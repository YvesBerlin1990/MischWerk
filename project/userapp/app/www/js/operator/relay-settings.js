/* Controller des Verbindungsreiters in der Verwaltung (/mw admin). */
(function () {
  'use strict';
  function create(dependencies) {
    var model = dependencies.model, signals = dependencies.signals, bridge = dependencies.bridge;
    var form = document.getElementById('relay-form'), sync = document.getElementById('relay-sync');
    var save = document.getElementById('relay-save');
    var refresh = document.getElementById('relay-refresh'), status = document.getElementById('relay-status');
    var result = document.getElementById('relay-result'), ready = false, busy = false, revision = null, sequence = 0, pending = null;
    var activate = document.getElementById('relay-activate');
    var deactivate = document.getElementById('relay-deactivate');
    var currentState = null, closed = false, confirmationTimer;
    var target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    function clear() { sync.value = ''; }
    function waitForConfirmation() {
        clearTimeout(confirmationTimer);
        confirmationTimer = setTimeout(function () {
            pending = null; busy = false; ready = false; clear(); controls();
            result.textContent = 'Keine Bestätigung erhalten. Bitte Status aktualisieren.';
        }, 15000);
    }
    function allowed() { return !!(model.current() && model.current().user.canAdminister); }
    function running() { return !!(currentState && currentState.operation && currentState.operation.publisherActive); }
    function controls() {
        var blocked = !ready || busy || !allowed() || !model.connected();
        sync.disabled = blocked;
        save.disabled = blocked || !sync.value;
        refresh.disabled = busy || !allowed() || !bridge || closed;
        activate.disabled = blocked || !currentState || !currentState.hasSyncSecret || running();
        activate.textContent = running() ? 'Aktiv' : 'Aktivieren';
        deactivate.disabled = blocked || !currentState || (!currentState.enabled && !running());
    }
    function failed() { ready = false; busy = false; controls(); clear(); result.textContent = 'Status nicht verfügbar. Bitte aktualisieren.'; }
    function apply(state) {
        if (!state || typeof state.revision !== 'number' || !isFinite(state.revision) || state.revision < 0 ||
                Math.floor(state.revision) !== state.revision || typeof state.hasSyncSecret !== 'boolean' ||
                state.syncUrl !== target) { failed(); return false; }
        revision = state.revision; currentState = state; sync.required = !state.hasSyncSecret; ready = true;
        status.textContent = running() ? state.operation.healthy === true ? 'Aktiv – Daten werden übertragen.' :
            'Verbindung aktiv – Übertragung noch nicht bestätigt.' : state.enabled && state.runtimeVerified ?
            'Verbindung freigegeben – derzeit keine Übertragung.' : 'Verbindung ausgeschaltet.';
        document.getElementById('relay-key-state').textContent = state.hasSyncSecret ? 'Ein Verbindungsschlüssel ist hinterlegt.' : 'Zum Aktivieren wird ein Verbindungsschlüssel benötigt.';
        if (dependencies.diagnosis) { dependencies.diagnosis.render(state.operation, state.targetKind); }
        controls(); return true;
    }
    function start() {
        if (!bridge || typeof bridge.sendEvent !== 'function' || typeof bridge.addEventListener !== 'function') { failed(); return; }
        function load() {
            clear(); ready = false; controls(); result.textContent = '';
            if (!allowed()) { return; }
            try { bridge.sendEvent('mw:androidSettings.status', {}); } catch (ignored) { failed(); }
        }
        bridge.addEventListener('mw:androidSettings.status', function (event) {
            if (closed || busy || !allowed()) { return; }
            if (!event.data || event.data.ok !== true) { failed(); return; }
            apply(event.data.state);
        });
        bridge.addEventListener('mw:androidSettings.result', function (event) {
            var data = event.data;
            if (closed || !allowed() || !data || !pending || data.requestId !== pending) { return; }
            clearTimeout(confirmationTimer); pending = null; busy = false; clear();
            result.classList.toggle('error', data.ok !== true);
            if (data.ok === true || data.state) { if (!apply(data.state)) { return; } }
            else { controls(); }
            result.textContent = typeof data.message === 'string' ? data.message : 'Bitte die Einrichtung erneut öffnen.';
        });
        form.addEventListener('submit', function (event) {
            event.preventDefault(); if (!ready || busy || save.disabled) { return; }
            pending = 'save-' + (++sequence);
            var data = { requestId: pending, revision: revision, syncSecret: sync.value };
            clear(); busy = true; controls(); result.textContent = 'Einstellungen werden gespeichert …';
            try { waitForConfirmation(); bridge.sendEvent('mw:androidSettings.save', data); }
            catch (ignored) { clearTimeout(confirmationTimer); pending = null; failed(); }
        });
        refresh.addEventListener('click', function () { if (!busy) { load(); } });
        function operate(action) {
            if (!ready || busy || closed) { return; }
            clear(); pending = action + '-' + (++sequence); busy = true; controls();
            result.textContent = 'Anfrage wird verarbeitet …';
            try { waitForConfirmation(); bridge.sendEvent('mw:androidSettings.' + action, { requestId: pending, revision: revision }); }
            catch (ignored) { clearTimeout(confirmationTimer); pending = null; failed(); }
        }
        activate.addEventListener('click', function () { operate('activate'); });
        deactivate.addEventListener('click', function () { operate('deactivate'); });
        function leave() { clearTimeout(confirmationTimer); closed = true; pending = null; clear(); ready = false; controls(); }
        window.addEventListener('pagehide', leave);
        sync.addEventListener('input', controls);
        signals.on('team-panel', function (name) {
            clear(); if (name === 'connection' && !busy) { closed = false; load(); } else { controls(); }
        });
        signals.on('overlay-capture', function (state) { state.busy = state.busy || busy; });
        signals.on('overlay-discard-private', function () { clear(); controls(); });
        signals.on('controls', function () {
            if (!allowed()) { clearTimeout(confirmationTimer); clear(); ready = false; busy = false; pending = null; currentState = null; } controls();
        });
        controls();
    }
    return { start:start };
  }
  MischWerkUI.define('teamConnection', create);
}());

/* Ein Controller für bestehende private Einrichtung und den Verwaltungsreiter. */
(function () {
  'use strict';
  function create(dependencies) {
    var inline = !!dependencies, model = dependencies && dependencies.model, signals = dependencies && dependencies.signals;
    var bridge = dependencies ? dependencies.bridge : typeof Client !== 'undefined' ? Client : null;
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
    function allowed() { return !inline || !!(model.current() && model.current().user.canManageRadioModerators); }
    function controls() {
        var blocked = !ready || busy || !allowed() || (inline && !model.connected());
        sync.disabled = save.disabled = blocked;
        refresh.disabled = busy || !allowed() || !bridge || closed;
        if (inline) { save.disabled = blocked || !sync.value; }
        activate.disabled = blocked || !currentState || !currentState.hasSyncSecret;
        if (inline && currentState && currentState.operation && currentState.operation.publisherActive) {
            activate.disabled = true;
        }
        if (inline) { activate.textContent = currentState && currentState.operation && currentState.operation.publisherActive ? 'Aktiv' : 'Aktivieren'; }
        deactivate.disabled = blocked || !currentState || (!currentState.enabled && !(currentState.operation && currentState.operation.publisherActive));
    }
    function failed() { ready = false; busy = false; controls(); clear(); result.textContent = inline ? 'Status nicht verfügbar. Bitte aktualisieren.' : 'Einrichtung nicht bestätigt. Bitte im MischWerk-Channel erneut öffnen.'; }
    function apply(state) {
        if (!state || typeof state.revision !== 'number' || !isFinite(state.revision) || state.revision < 0 ||
                Math.floor(state.revision) !== state.revision || typeof state.hasSyncSecret !== 'boolean' ||
                state.syncUrl !== target) { failed(); return false; }
        revision = state.revision; currentState = state; sync.required = !state.hasSyncSecret; ready = true;
        if (inline) {
            var running = state.operation && state.operation.publisherActive;
            var post = state.operation && state.operation.lastPost;
            status.textContent = running ? post && post.accepted ? 'Aktiv – Daten werden übertragen.' :
                'Verbindung aktiv – Übertragung noch nicht bestätigt.' : state.enabled && state.runtimeVerified ?
                'Freigegeben – Übertragung ruht.' : 'Verbindung ausgeschaltet.';
            document.getElementById('relay-key-state').textContent = state.hasSyncSecret ? 'Schlüssel ist hinterlegt.' : 'Noch kein Schlüssel hinterlegt.';
        } else {
        status.textContent = 'In Knuddels hinterlegt: Sync-Schlüssel ' + (state.hasSyncSecret ? 'ja' : 'nein') +
            '. Verbindung ' +
            (state.enabled && state.runtimeVerified ? 'freigegeben.' : 'noch nicht freigegeben.');
        if (state.operation) {
            var post = state.operation.lastPost;
            status.textContent += ' Publisher ' + (state.operation.publisherActive ? 'läuft' : 'aus') + '.';
            if (post) { status.textContent += ' Letzte Antwort: HTTP ' + post.status + (post.accepted ? ', angenommen.' : ', nicht angenommen.'); }
        }
        }
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
        var close = document.getElementById('relay-close');
        if (close) { close.addEventListener('click', function () {
            leave();
            try { bridge.sendEvent('mw:androidSettings.close', {}); } catch (ignored) { failed(); }
        }); }
        window.addEventListener('pagehide', leave);
        sync.addEventListener('input', controls);
        if (inline) {
            signals.on('team-panel', function (name) {
                clear(); if (name === 'connection' && !busy) { closed = false; load(); } else { controls(); }
            });
            signals.on('overlay-capture', function (state) { state.busy = state.busy || busy; });
            signals.on('overlay-discard-private', function () { clear(); controls(); });
            signals.on('controls', function () {
                if (!allowed()) { clearTimeout(confirmationTimer); clear(); ready = false; busy = false; pending = null; currentState = null; } controls();
            });
            controls();
        } else { load(); }
    }
    return { start:start };
  }
  if (typeof MischWerkUI !== 'undefined') { MischWerkUI.define('teamConnection', create); }
  else { create(null).start(); }
}());

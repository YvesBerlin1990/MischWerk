/* Eigene private Eingabe; vorhandene Secrets werden niemals vom Server geliefert. */
(function () {
    'use strict';
    var form = document.getElementById('relay-form'), sync = document.getElementById('relay-sync');
    var wishes = document.getElementById('relay-wishes'), save = document.getElementById('relay-save');
    var refresh = document.getElementById('relay-refresh'), status = document.getElementById('relay-status');
    var result = document.getElementById('relay-result'), ready = false, busy = false, revision = null, sequence = 0, pending = null;
    var prepare = document.getElementById('relay-prepare'), activate = document.getElementById('relay-activate');
    var deactivate = document.getElementById('relay-deactivate'), hook = document.getElementById('relay-hook');
    var hookPanel = document.getElementById('relay-hook-panel'), currentState = null, closed = false;
    var target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    function clear() { sync.value = ''; wishes.value = ''; hook.value = ''; hookPanel.hidden = true; }
    function controls() {
        sync.disabled = wishes.disabled = save.disabled = refresh.disabled = !ready || busy;
        prepare.disabled = activate.disabled = !ready || busy || !currentState || !currentState.hasSyncSecret || !currentState.hasRelaySecret;
        deactivate.disabled = !ready || busy || !currentState || (!currentState.enabled && !(currentState.operation && currentState.operation.publisherActive));
    }
    function failed() { ready = false; busy = false; controls(); clear(); result.textContent = 'Einrichtung nicht bestätigt. Bitte im MischWerk-Channel erneut öffnen.'; }
    function apply(state) {
        if (!state || typeof state.revision !== 'number' || !isFinite(state.revision) || state.revision < 0 ||
                Math.floor(state.revision) !== state.revision || typeof state.hasSyncSecret !== 'boolean' ||
                typeof state.hasRelaySecret !== 'boolean' || state.syncUrl !== target) { failed(); return false; }
        revision = state.revision; currentState = state; sync.required = !state.hasSyncSecret; ready = true;
        status.textContent = 'In Knuddels hinterlegt: Sync-Schlüssel ' + (state.hasSyncSecret ? 'ja' : 'nein') +
            ', Wunsch-Schlüssel ' + (state.hasRelaySecret ? 'ja' : 'nein') + '. Verbindung ' +
            (state.enabled && state.runtimeVerified ? 'freigegeben.' : 'noch nicht freigegeben.');
        if (state.operation) {
            var post = state.operation.lastPost;
            status.textContent += ' Publisher ' + (state.operation.publisherActive ? 'läuft' : 'aus') +
                ', WebHook ' + (state.operation.webhookRegistered ? 'registriert' : 'nicht registriert') + '.';
            if (post) { status.textContent += ' Letzte Antwort: HTTP ' + post.status + (post.accepted ? ', angenommen.' : ', nicht angenommen.'); }
            if (state.operation.webhookRegistration && state.operation.webhookRegistration.failedStage) {
                status.textContent += ' Registrierung: ' + state.operation.webhookRegistration.failedStage + '.';
            }
        }
        controls(); return true;
    }
    if (typeof Client === 'undefined' || typeof Client.sendEvent !== 'function' || typeof Client.addEventListener !== 'function') { failed(); return; }
    function load() {
        clear(); ready = false; controls(); result.textContent = '';
        try { Client.sendEvent('mw:androidSettings.status', {}); } catch (ignored) { failed(); }
    }
    Client.addEventListener('mw:androidSettings.status', function (event) {
        if (closed || busy) { return; }
        if (!event.data || event.data.ok !== true) { failed(); return; }
        apply(event.data.state);
    });
    Client.addEventListener('mw:androidSettings.result', function (event) {
        var data = event.data;
        if (closed || !data || !pending || data.requestId !== pending) { return; }
        pending = null; busy = false; clear();
        if (data.ok === true || data.state) { if (!apply(data.state)) { return; } }
        else { controls(); }
        result.textContent = typeof data.message === 'string' ? data.message : 'Bitte die Einrichtung erneut öffnen.';
        if (data.ok === true && typeof data.webhookUrl === 'string' && data.webhookUrl.length <= 2048 && /^https:\/\/[^\s<>]+$/.test(data.webhookUrl)) {
            hook.value = data.webhookUrl; hookPanel.hidden = false;
        }
    });
    form.addEventListener('submit', function (event) {
        event.preventDefault(); if (!ready || busy) { return; }
        pending = 'save-' + (++sequence);
        var data = { requestId: pending, revision: revision, syncSecret: sync.value, relaySecret: wishes.value };
        clear(); busy = true; controls(); result.textContent = 'Einstellungen werden gespeichert …';
        try { Client.sendEvent('mw:androidSettings.save', data); }
        catch (ignored) { pending = null; failed(); }
    });
    refresh.addEventListener('click', function () { if (!busy) { load(); } });
    function operate(action) {
        if (!ready || busy || closed) { return; }
        clear(); pending = action + '-' + (++sequence); busy = true; controls();
        result.textContent = 'Anfrage wird verarbeitet …';
        try { Client.sendEvent('mw:androidSettings.' + action, { requestId: pending, revision: revision }); }
        catch (ignored) { pending = null; failed(); }
    }
    prepare.addEventListener('click', function () { operate('prepare'); });
    activate.addEventListener('click', function () { operate('activate'); });
    deactivate.addEventListener('click', function () { operate('deactivate'); });
    function leave() { closed = true; pending = null; clear(); ready = false; controls(); }
    document.getElementById('relay-close').addEventListener('click', function () {
        leave();
        try { Client.sendEvent('mw:androidSettings.close', {}); } catch (ignored) { failed(); }
    });
    window.addEventListener('pagehide', leave);
    load();
}());

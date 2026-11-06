/* Eigene private Eingabe; vorhandene Secrets werden niemals vom Server geliefert. */
(function () {
    'use strict';
    var form = document.getElementById('relay-form'), sync = document.getElementById('relay-sync');
    var wishes = document.getElementById('relay-wishes'), save = document.getElementById('relay-save');
    var refresh = document.getElementById('relay-refresh'), status = document.getElementById('relay-status');
    var result = document.getElementById('relay-result'), ready = false, busy = false, revision = null, sequence = 0, pending = null;
    var target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    function clear() { sync.value = ''; wishes.value = ''; }
    function controls() { sync.disabled = wishes.disabled = save.disabled = refresh.disabled = !ready || busy; }
    function failed() { ready = false; busy = false; controls(); clear(); result.textContent = 'Einrichtung nicht bestätigt. Bitte im MischWerk-Channel erneut öffnen.'; }
    function apply(state) {
        if (!state || typeof state.revision !== 'number' || !isFinite(state.revision) || state.revision < 0 ||
                Math.floor(state.revision) !== state.revision || typeof state.hasSyncSecret !== 'boolean' ||
                typeof state.hasRelaySecret !== 'boolean' || state.syncUrl !== target) { failed(); return false; }
        revision = state.revision; sync.required = !state.hasSyncSecret; ready = true;
        status.textContent = 'In Knuddels hinterlegt: Sync-Schlüssel ' + (state.hasSyncSecret ? 'ja' : 'nein') +
            ', Wunsch-Schlüssel ' + (state.hasRelaySecret ? 'ja' : 'nein') + '. Verbindung ' +
            (state.enabled && state.runtimeVerified ? 'freigegeben.' : 'noch nicht freigegeben.');
        controls(); return true;
    }
    if (typeof Client === 'undefined' || typeof Client.sendEvent !== 'function' || typeof Client.addEventListener !== 'function') { failed(); return; }
    function load() {
        clear(); ready = false; controls(); result.textContent = '';
        try { Client.sendEvent('mw:androidSettings.status', {}); } catch (ignored) { failed(); }
    }
    Client.addEventListener('mw:androidSettings.status', function (event) {
        if (busy) { return; }
        if (!event.data || event.data.ok !== true) { failed(); return; }
        apply(event.data.state);
    });
    Client.addEventListener('mw:androidSettings.result', function (event) {
        var data = event.data;
        if (!data || !pending || data.requestId !== pending) { return; }
        pending = null; busy = false; clear();
        if (data.ok === true) { if (!apply(data.state)) { return; } }
        else { controls(); }
        result.textContent = typeof data.message === 'string' ? data.message : 'Bitte die Einrichtung erneut öffnen.';
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
    document.getElementById('relay-close').addEventListener('click', function () {
        clear(); ready = false; controls();
        try { Client.sendEvent('mw:androidSettings.close', {}); } catch (ignored) { failed(); }
    });
    window.addEventListener('pagehide', clear);
    load();
}());

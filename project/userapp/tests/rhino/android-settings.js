/* Verbindungseinstellungen eingebettet in /mw admin: Status, Speichern und private Berechtigung mit ausschließlich lokalen Testwerten. */
(function () {
    var key = 'mischwerk.android.private.v1', sync = new Array(65).join('s'), relay = new Array(65).join('r'), other = new Array(65).join('n');
    function fixture(initial) {
        var started = startApp(initial ? (function () { var value = {}; value[key] = initial; return value; }()) : {});
        var owner = person(2, 'Otterchen', true);
        started.app.onUserJoined(owner);
        started.app.chatCommands.mw(owner, 'admin');
        started.owner = owner; started.session = viewSession(owner, 'team');
        started.call = function (type, data, user, session) {
            started.app.onEventReceived(user || owner, 'mw:androidSettings.' + type, data || {}, session || started.session);
            var target = session || started.session;
            return target.events.length ? target.events[target.events.length - 1].data : null;
        };
        started.save = function (change) {
            var data = { revision:0, requestId:'save-1', syncSecret:sync, relaySecret:'' };
            Object.keys(change || {}).forEach(function (name) { data[name] = change[name]; });
            return started.call('save', data);
        };
        started.call('status');
        return started;
    }
    var f = fixture();
    try {
        check(f.session !== null && f.session.getAppContent().mode === 'Overlay', 'Verwaltung als natives Overlay geöffnet');
        var status = latest(f.session, 'mw:androidSettings.status');
        check(status.ok === true && status.state.hasSyncSecret === false, 'Status liest nur Vorhandenseinsflags');
        check(!store.data[key], 'Statuslesen schreibt keine Verbindung');
        var radio = radioSession(f.owner), before = JSON.stringify(store.data);
        f.call('save', { revision:0, requestId:'radio', syncSecret:sync }, f.owner, radio);
        check(JSON.stringify(store.data) === before, 'Normale Radiositzung setzt keine Schlüssel');
        var outsider = person(90002, 'Synthetischer Fremder', true);
        f.app.onUserJoined(outsider);
        f.call('save', { revision:0, requestId:'save-1', syncSecret:sync, relaySecret:'' }, outsider, f.session);
        check(!store.data[key], 'Fremde Identität kann private Sitzung nicht verwenden');
        check(f.save().ok === true, 'Konsolenberechtigter speichert Sync-Schlüssel');
        var saved = store.data[key];
        check(saved.enabled === false && saved.runtimeVerified === false && saved.revision === 1, 'Speichern schaltet aus und erhöht die Revision');
        check(saved.syncSecret === sync && saved.syncUrl === 'https://radio-mischwerk.web.app/api/publishKnuddelsState', 'Fester Server-Speicheradapter in Rhino');
        check(JSON.stringify(f.session.events).indexOf(sync) === -1, 'Kein Secret in Serverantworten');
        var stored = JSON.stringify(store.data[key]);
        f.save(); check(JSON.stringify(store.data[key]) === stored, 'Anfragewiederholung schreibt nicht erneut');
        check(f.save({ requestId:'save-2' }).ok === false && JSON.stringify(store.data[key]) === stored, 'Veraltete Einstellungsrevision bleibt abgewiesen');
        [{ enabled:true }, { runtimeVerified:true }, { syncUrl:'https://evil.invalid' }, { syncSecret:'short' }, { relaySecret:'bad' }].forEach(function (change, index) {
            change.revision = 1; change.requestId = 'invalid-' + index;
            check(f.save(change).ok === false && JSON.stringify(store.data[key]) === stored, 'Ungültige Einstellung abgewiesen: ' + Object.keys(change)[0]);
        });
        check(f.save({ revision:1, requestId:'relay', syncSecret:'', relaySecret:relay }).ok === false &&
            JSON.stringify(store.data[key]) === stored, 'Neues Relay-Secret wird nicht mehr angenommen');
        check(f.save({ revision:1, requestId:'keep', syncSecret:'' }).ok === true &&
            store.data[key].syncSecret === sync && store.data[key].revision === 2, 'Leeres Sync-Feld erhält vorhandenen Schlüssel');
        advance(600001);
        stored = JSON.stringify(store.data[key]);
        f.save({ revision:2, requestId:'expired', syncSecret:other });
        check(JSON.stringify(store.data[key]) === stored, 'Abgelaufene Berechtigung speichert nicht');
        check(f.call('status').ok === true, 'Aktualisieren erneuert die private Leseberechtigung');
        var ownerRight = f.owner.isChannelOwner;
        f.owner.isChannelOwner = function () { return false; };
        f.save({ revision:2, requestId:'lost', syncSecret:other });
        check(JSON.stringify(store.data[key]) === stored, 'Rechteverlust verhindert Speichern');
        f.owner.isChannelOwner = ownerRight;
        f.session.nativeClose(false);
        f.save({ revision:2, requestId:'closed', syncSecret:other });
        check(JSON.stringify(store.data[key]) === stored, 'Schließen der Verwaltung beendet die Berechtigung');
        f.app.chatCommands.mw(f.owner, 'admin'); f.session = viewSession(f.owner, 'team'); f.call('status');
        check(f.save({ revision:2, requestId:'reopened', syncSecret:other }).ok === true && store.data[key].syncSecret === other,
            'Neu geöffnete Verwaltung speichert wieder');
        stored = JSON.stringify(store.data[key]);
        f.app.onUserLeft(f.owner); f.save({ revision:3, requestId:'left', syncSecret:sync });
        check(JSON.stringify(store.data[key]) === stored, 'Channelverlassen beendet die Berechtigung');
    } finally { f.stop(); }
    var g = fixture({ enabled:false, syncSecret:sync, revision:4 });
    try {
        var listener = person(11, 'Hörer', false);
        g.app.onUserJoined(listener); g.app.chatCommands.mw(listener, 'admin');
        check(viewSession(listener, 'team') === null, 'Hörer erhält keine Verwaltung');
        var polaroid = person(4, 'Polaroid', false);
        polaroid.getNick = function () { return new java.lang.String('Polaroid'); };
        g.app.onUserJoined(polaroid); g.app.chatCommands.mw(polaroid, 'admin');
        var adminSession = viewSession(polaroid, 'team');
        check(adminSession !== null && g.call('status', {}, polaroid, adminSession).ok === true, 'Polaroid liest die Verbindung über den nativen Java-Nick');
        g.app.onPrepareShutdown();
        g.call('save', { revision:4, requestId:'shutdown', syncSecret:relay }, polaroid, adminSession);
        check(store.data[key].syncSecret === sync, 'Shutdown beendet die Berechtigung');
    } finally { g.stop(); }
}());

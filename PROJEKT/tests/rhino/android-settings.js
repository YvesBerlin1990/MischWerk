/* Betreiber-Einrichtung in echten Rhino-Engines, ausschließlich lokale Testwerte. */
(function () {
    var original = KnuddelsServer.getPersistence, data = {}, writes = 0, allowedOwner = true;
    var sync = new Array(65).join('s'), runtime, operator;
    KnuddelsServer.getPersistence = function () { return {
        getObjectKeys: function () { return Object.keys(data); },
        deleteObject: function (key) { delete data[key]; },
        getObject: function (key, fallback) { return copy(Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback); },
        setObject: function (key, value) { writes += 1; data[key] = copy(value); }
    }; };
    try {
        runtime = MischWerkModules.createRuntime(MischWerkConfig);
        runtime.warn = function () {}; runtime.send = function (session, type, value) { session.sendEvent(type, value); };
        runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };
        runtime.userId = function (user) { return user.getUserId(); };
        runtime.isChannelOwner = function (user) { return user === operator && allowedOwner; };
        runtime.stopAndroidRelay = function () {};
        MischWerkModules.attachSessionState(runtime);
        MischWerkModules.attachContent(runtime);
        MischWerkModules.attachSessions(runtime, MischWerkConfig);
        MischWerkModules.attachAndroidSettings(runtime, MischWerkConfig);
        operator = person(90001, 'Synthetischer Betreiber', true);
        runtime.androidRelayCommand(operator, 'einrichten');
        var session = operator.sessions[0];
        check(session.getAppContent().html.data.view === 'relay-settings', 'Eigene private Einrichtung in Rhino');
        runtime.handleAndroidSettingsEvent(operator, 'mw:androidSettings.status', {}, session);
        check(JSON.stringify(session.events).indexOf(sync) === -1 && writes === 0, 'Status liest nur Vorhandenseinsflags');
        var outsider = person(90002, 'Synthetischer Fremder', false);
        var request = { revision: 0, requestId: 'save-1', syncSecret: sync, relaySecret: '' };
        runtime.handleAndroidSettingsEvent(outsider, 'mw:androidSettings.save', request, session);
        check(writes === 0, 'Fremde Identität kann private Sitzung nicht verwenden');
        runtime.handleAndroidSettingsEvent(operator, 'mw:androidSettings.save', request, session);
        var saved = data['mischwerk.android.private.v1'];
        check(writes === 1 && saved.enabled === false && saved.runtimeVerified === false, 'Einrichtung öffnet keine Startsperre');
        check(saved.syncSecret === sync && saved.syncUrl === 'https://radio-mischwerk.web.app/api/publishKnuddelsState', 'Fester Server-Speicheradapter in Rhino');
        check(JSON.stringify(session.events).indexOf(sync) === -1, 'Kein Secret in Serverantworten');
        runtime.handleAndroidSettingsEvent(operator, 'mw:androidSettings.save', request, session);
        check(writes === 1, 'Anfragewiederholung schreibt nicht erneut');
        request.requestId = 'save-2';
        runtime.handleAndroidSettingsEvent(operator, 'mw:androidSettings.save', request, session);
        check(writes === 1, 'Veraltete Einstellungsrevision bleibt abgewiesen');
        allowedOwner = false;
        runtime.handleAndroidSettingsEvent(operator, 'mw:androidSettings.status', {}, session);
        check(session.getAppContent().getSessions().length === 0, 'Rechteverlust schließt private Einrichtung');
        allowedOwner = true; runtime.androidRelayCommand(operator, 'einrichten'); runtime.clearAndroidSettings();
        check(operator.sessions.length === 0, 'Cleanup entfernt private Berechtigung und Ansicht');
    } finally { KnuddelsServer.getPersistence = original; }
}());

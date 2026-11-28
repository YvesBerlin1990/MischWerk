/* Aktivieren und Ausschalten des zentralen Abgleichs über /mw admin, ohne WebHook, mit nativen Java-Antwortobjekten. */
(function () {
    var hooksBefore = KnuddelsServer.getWebHookAccess, externalBefore = KnuddelsServer.getExternalServerAccess;
    var key = 'mischwerk.android.private.v1', url = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    var calls = [], hookCalls = 0, initial = {};
    initial[key] = { enabled:false, runtimeVerified:false, syncSecret:new Array(65).join('s'), syncUrl:url, revision:0 };
    KnuddelsServer.getWebHookAccess = function () { hookCalls += 1; throw new Error('No WebHook permission'); };
    KnuddelsServer.getExternalServerAccess = function () { return { canAccessURL:function () { return true; },
        postURL:function (target, parameters) { calls.push({ url:target, parameters:parameters }); } }; };
    function complete(index, status) {
        var call = calls[index];
        call.parameters[status === 200 ? 'onSuccess' : 'onFailure'](new java.lang.String(JSON.stringify({ contractVersion:2, accepted:status === 200, serverTime:testClock,
            station:{ contractVersion:2, authority:'studio', protocolEpoch:'rhino-operation', revision:0, broadcastState:'unknown', onAir:false, wishboxOpen:false,
                moderatorNick:null, topic:null, updatedAt:0, validUntil:0 },
            wishReceipts:[], ownWishStatuses:[], deletionReceipts:[], broadcastEvents:[], eventCursor:'initial',
            nickAccessPage:{ snapshotId:'s', revision:new Array(65).join('a'), snapshotAt:testClock, validUntil:testClock + 45000, items:[], nextCursor:null, complete:true } })),
            javaResponse(call.url, status));
    }
    var started = startApp(initial), app = started.app, sequence = 0;
    try {
        var owner = person(2, 'Otterchen', true);
        app.onUserJoined(owner); app.chatCommands.mw(owner, 'admin');
        var session = viewSession(owner, 'team');
        app.onEventReceived(owner, 'mw:androidSettings.status', {}, session);
        var action = function (name, extra) {
            var data = { revision:store.data[key].revision, requestId:'operation-' + (++sequence) };
            Object.keys(extra || {}).forEach(function (field) { data[field] = extra[field]; });
            app.onEventReceived(owner, 'mw:androidSettings.' + name, data, session);
            return session.events[session.events.length - 1].data;
        };
        var status = function () {
            app.onEventReceived(owner, 'mw:androidSettings.status', {}, session);
            return latest(session, 'mw:androidSettings.status');
        };
        check(calls.length === 0 && !store.data[key].enabled, 'Keine implizite Aktivierung durch Öffnen');
        var ownerRight = owner.isChannelOwner;
        owner.isChannelOwner = function () { return false; };
        action('activate');
        check(calls.length === 0 && !store.data[key].enabled, 'Rechteverlust verhindert Aktivierung');
        owner.isChannelOwner = ownerRight;
        app.chatCommands.mw(owner, 'admin'); session = viewSession(owner, 'team'); status();
        var activated = action('activate');
        check(activated.ok && store.data[key].enabled && store.data[key].runtimeVerified, 'Sync allein erlaubt ausdrücklich beide Flags');
        check(calls.length === 1 && hookCalls === 0 && calls[0].url === url, 'Erster regulärer POST ohne WebHook');
        check(Object.keys(calls[0].parameters.data).sort().join(',') === 'nonce,payload,sig,ts', 'Signaturvertrag unverändert in Rhino');
        complete(0, 200);
        check(status().state.operation.firstAcceptedPost.accepted === true, 'Java-Antwort als erste Annahme erkannt');
        check(action('activate').ok && calls.length === 1 && store.data[key].revision === 1, 'Aktivierung bleibt idempotent');
        app.chatCommands.mw(owner, 'admin'); session = viewSession(owner, 'team');
        var reopened = status(), saved = JSON.stringify(store.data[key]);
        check(reopened.ok && reopened.state.operation.publisherActive === true && JSON.stringify(store.data[key]) === saved && calls.length === 1,
            'Wiederöffnen erhält aktiven Publisher und Schlüssel');
        check(JSON.stringify(reopened).indexOf(store.data[key].syncSecret) === -1, 'Status nur mit technischen Metadaten');
        advance(10000);
        check(calls.length === 2, 'Derselbe Zehnsekundentakt läuft weiter');
        check(JSON.parse(calls[1].parameters.data.payload).requestId !== JSON.parse(calls[0].parameters.data.payload).requestId, 'Jeder Abgleich mit eigener Anfragekennung');
        complete(1, 401);
        var operation = status().state.operation;
        check(operation.publisherActive === true && operation.lastPost.status === 401 && operation.lastPost.accepted === false, 'Abgewiesener POST bleibt unterscheidbar');
        ['', 'einrichten', 'status', 'http-pruefen', 'auth-pruefen'].forEach(function (option) {
            owner.privateMessages = [];
            app.chatCommands.mw(owner, 'verbindung ' + option);
            check(owner.privateMessages[0].indexOf('Diesen Aufruf gibt es nicht') !== -1 && JSON.stringify(store.data[key]) === saved,
                'Entfernter Verbindungsbefehl verändert nichts: ' + option);
        });
        check(action('deactivate').ok && !store.data[key].enabled && !store.data[key].runtimeVerified, 'Ausschalten persistiert false-Flags');
        var after = calls.length; advance(60000);
        check(calls.length === after && hookCalls === 0, 'Ausschalten beendet den Heartbeat ohne Hook');
        var before = session.events.length; action('prepare');
        check(session.events.length === before && hookCalls === 0, 'Alte Hookvorbereitung ist entfernt');
    } finally {
        started.stop();
        KnuddelsServer.getWebHookAccess = hooksBefore; KnuddelsServer.getExternalServerAccess = externalBefore;
    }
}());

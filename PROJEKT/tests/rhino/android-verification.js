/* Einmal-POST in echten Rhino-Engines; vollständig synthetische Plattform und Schlüssel. */
(function () {
    var oldPersistence = KnuddelsServer.getPersistence, oldExternal = KnuddelsServer.getExternalServerAccess;
    var sync = new Array(65).join('s'), target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    var settings = { enabled: false, runtimeVerified: false, syncSecret: sync, syncUrl: target, revision: 1 };
    var calls = [], replies = [], writes = 0, owner = person(90001, 'Synthetischer Betreiber', true), authorized = true;
    var runtime = MischWerkModules.createRuntime(MischWerkConfig), now = 1800000000000;
    KnuddelsServer.getPersistence = function () { return {
        getObject: function () { return copy(settings); }, setObject: function () { writes += 1; }
    }; };
    KnuddelsServer.getExternalServerAccess = function () { return {
        canAccessURL: function (url) { return url === target; },
        postURL: function (url, parameters) { calls.push(parameters); }
    }; };
    try {
        runtime.now = function () { return now; };
        runtime.warn = function () {};
        runtime.userId = function (user) { return user.getUserId(); };
        runtime.isChannelOwner = function (user) { return user === owner && authorized; };
        runtime.moderatorIsActive = function () { return false; };
        runtime.state = { requestsEnabled: true, topic: 'Synthetisches Thema', moderator: null };
        owner.sendPrivateMessage = function (text) { replies.push(JSON.parse(String(text))); };
        MischWerkModules.attachChanges(runtime);
        MischWerkModules.attachTicker(runtime);
        MischWerkModules.attachAndroidFailures(runtime); MischWerkModules.attachAndroidSigning(runtime);
        MischWerkModules.attachAndroidConnection(runtime);
        MischWerkModules.attachAndroidPublisher(runtime);
        MischWerkModules.attachAndroidVerification(runtime, MischWerkConfig);
        check(calls.length === 0, 'Keine automatische Einmalprüfung');
        authorized = false; runtime.androidVerificationCommand(owner);
        check(calls.length === 0 && replies.length === 0, 'Nur authentisierter Inhaber prüft');
        authorized = true; runtime.androidVerificationCommand(owner);
        check(calls.length === 1 && typeof calls[0].data.payload === 'string', 'Ein ausdrücklicher nativer String-payload');
        check(!calls[0].header && !calls[0].headers && /^[a-f0-9]{64}$/.test(calls[0].data.sig), 'Signierte Daten ohne Header');
        var body = JSON.parse(calls[0].data.payload);
        check(body.station.topic === runtime.state.topic && body.station.updatedAt === now && body.wishUpdates.length === 0,
            'Aktuelle Senderprojektion, kein Wunschversand');
        calls[0].onSuccess(new java.lang.String(JSON.stringify({ accepted: true, serverTime: now })), {
            getResponseCode: function () { return new java.lang.Integer(200); },
            getURLString: function () { return new java.lang.String(target); }
        });
        check(replies.length === 1 && replies[0].nativeResponseAccepted === true, 'Java-Rückgaben nativ normalisiert');
        check(replies[0].firestoreWriteConfirmed === null, 'HTTP-Erfolg behauptet keine Firestore-Folgeprüfung');
        check(writes === 0 && settings.enabled === false && settings.runtimeVerified === false, 'Keine Freigabe oder Persistenzmutation');
        check(JSON.stringify(replies).indexOf(sync) === -1 && JSON.stringify(replies).indexOf('Synthetisches Thema') === -1,
            'Nur technischer Privatbericht, ohne Schlüssel und Themeninhalt');
        runtime.androidVerificationCommand(owner);
        check(calls.length === 1, 'Schnelle Wiederholung begrenzt');
        now += 30000; runtime.androidVerificationCommand(owner); runtime.cancelAndroidVerification();
        calls[1].onSuccess('{}', { getResponseCode: function () { return 200; }, getURLString: function () { return target; } });
        check(replies.length === 2 && calls.length === 2, 'Abgebrochene native Antwort bleibt verworfen');
        now += 30000; runtime.androidVerificationCommand(owner, true);
        check(calls.length === 3 && calls[2].data.payload === '{}', 'Auth-Probe sendet ausschließlich leeres Objekt');
        check(!calls[2].header && !calls[2].headers && /^[a-f0-9]{64}$/.test(calls[2].data.sig), 'Auth-Probe nutzt signierten Body');
        var forbiddenReads = 0;
        calls[2].onFailure({ toString: function () { forbiddenReads += 1; throw new Error('Body darf nicht gelesen werden'); } }, {
            getResponseCode: function () { return new java.lang.Integer(400); },
            getURLString: function () { forbiddenReads += 1; throw new Error('Adresse darf nicht gelesen werden'); }
        });
        var auth = replies[replies.length - 1];
        check(auth.check === 'native-signed-auth-post' && auth.authenticationAccepted === true, '400 im Fehlercallback bestätigt Statusvertrag');
        check(auth.http.invalidPayloadConfirmed === null && auth.http.jsonParsed === false && auth.http.bodyRead === false,
            'Kein Body gelesen oder Fehlerinhalt behauptet');
        check(forbiddenReads === 0 && auth.http.responseUrlMatches === null, 'Nur dokumentierter Statuscode abgefragt');
        check(auth.nativeResponseAccepted === false && auth.firestoreWriteConfirmed === null, 'Keine Status- oder Firestore-Annahme behauptet');
        check(auth.request.stationUpdatedAt === null && auth.request.payloadShape === 'empty-object', 'Keine Senderdaten im Auth-Test');
        check(writes === 0 && settings.enabled === false && settings.runtimeVerified === false, 'Auth-Test öffnet keine Freigabe');
        check(JSON.stringify(auth).indexOf(sync) === -1, 'Auth-Test gibt keine Schlüsselwerte aus');
        now += 30000; runtime.androidVerificationCommand(owner, true);
        calls[3].onFailure('{"error":"unauthorized"}', {
            getResponseCode: function () { return 401; }, getURLString: function () { return target; }
        });
        check(replies[replies.length - 1].authenticationAccepted === false, '401 bleibt abgewiesen');
    } finally {
        runtime.cancelAndroidVerification();
        KnuddelsServer.getPersistence = oldPersistence; KnuddelsServer.getExternalServerAccess = oldExternal;
    }
}());

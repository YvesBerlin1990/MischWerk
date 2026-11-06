/* Echte ES5/Rhino-Prüfung; HTTP-Port und Plattform bleiben vollständig isolierte Fakes. */
(function () {
    var previousPersistence = KnuddelsServer.getPersistence, previousHooks = KnuddelsServer.getWebHookAccess;
    var previousExternal = KnuddelsServer.getExternalServerAccess, previousInfo = KnuddelsServer.getAppServerInfo;
    var secret = new Array(65).join('r'), sync = new Array(65).join('s'), observer = null, sends = [];
    var data = { 'mischwerk.android.private.v1': { enabled: true, relaySecret: secret, syncSecret: sync,
        syncUrl: 'https://europe-west3-radio-mischwerk.cloudfunctions.net/publishKnuddelsState' } };
    KnuddelsServer.getPersistence = function () { return {
        getObject: function (key, fallback) { return copy(Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback); },
        setObject: function (key, value) { data[key] = copy(value); }
    }; };
    KnuddelsServer.getWebHookAccess = function () { return {
        registerWebHook: function (key, handler) { check(key === 'android-wishes', 'Android eigener Hook'); observer = handler; return 'https://example.invalid/private'; },
        unregisterWebHook: function () { observer = null; }
    }; };
    try {
        var runtime = MischWerkModules.createRuntime(MischWerkConfig), clock = 1800000000000;
        runtime.now = function () { return clock; };
        runtime.warn = function () {};
        runtime.broadcast = function () {};
        runtime.moderatorIsActive = function () { return false; };
        runtime.isModerator = function () { return true; };
        runtime.state = { requestsEnabled: true, topic: '', moderator: null };
        MischWerkModules.attachChanges(runtime);
        MischWerkModules.attachValidation(runtime);
        MischWerkModules.attachWishQueue(runtime);
        MischWerkModules.attachAndroidConnection(runtime);
        MischWerkModules.attachAndroidReceipts(runtime);
        var wire = { sendJson: function (request, finish) {
            sends.push(copy(request)); finish({ status: 200, body: { accepted: true, serverTime: clock } });
        } };
        MischWerkModules.attachAndroidPublisher(runtime, wire);
        MischWerkModules.attachAndroidWebHook(runtime, wire);
        runtime.startAndroidRelay(); runtime.startAndroidRelay();
        check(runtime.androidRelayHealthy(), 'Android-Sync im lokalen Fake bestätigt');
        function call(id, text, authorization) {
            var result;
            observer({ getMethod: function () { return 'POST'; }, getPath: function () { return '/v1/wishes'; },
                getQueryString: function () { return ''; }, getHeaders: function () { return { authorization: [authorization || 'Bearer ' + secret], 'content-type': ['application/json'] }; },
                getBody: function () { return JSON.stringify({ action: 'submitWish', submissionId: id, text: text, displayName: null }); }
            }, { send: function (status, headers, body) { result = { status: status, body: JSON.parse(body) }; } });
            return result;
        }
        for (var index = 0; index < 3; index += 1) { runtime.submitWish({ getNick: function () { return 'Nativ'; }, getUserId: function () { return 1; } }, { submissionId: 'native-' + index, text: 'Band' }); }
        check(call('android', 'M.I.A. – Song').body.position === 4, 'Android auf Platz 4 in Rhino');
        check(call('android', 'M.I.A. – Song').body.position === 4 && runtime.wishItems().length === 4, 'Android genau einmal');
        check(call('bad', 'https://example.invalid').status === 400, 'Gemeinsame Linkprüfung in Rhino');
        check(call('bad', 'Band', 'Bearer wrong').status === 401, 'Bearer-Prüfung in Rhino');
        runtime.resolveWish(1, 'done');
        check(sends[sends.length - 1].body.wishUpdates[0].position === 3, 'Echte neue Position in Rhino');
        runtime.changeWishStage(null, { id: 4, previousStage: 'queued', stage: 'preparing' });
        check(sends[sends.length - 1].body.wishUpdates[0].state === 'preparing', 'Android vorbereitet');
        runtime.resolveWish(2, 'done'); runtime.resolveWish(3, 'discarded');
        runtime.changeWishStage(null, { id: 4, previousStage: 'preparing', stage: 'playing' });
        check(sends[sends.length - 1].body.wishUpdates[0].state === 'playing', 'Android spielt');
        runtime.resolveWish(4, 'done');
        check(sends[sends.length - 1].body.wishUpdates[0].state === 'done', 'Endstatus vor Verlust des Eintrags');
        check(call('android', 'M.I.A. – Song').body.position === null && runtime.wishItems().length === 0, 'Terminale Wiederholung bleibt idempotent');
        runtime.state.requestsEnabled = false; runtime.changed('station');
        check(sends[sends.length - 1].body.station.wishboxOpen === false, 'Geschlossener echter Senderstatus');
        check(call('closed', 'Band').body.relayCode === 'CLOSED', 'Geschlossen sperrt Versand');
        check(JSON.stringify(data['mischwerk.android.receipts.v1']).indexOf('M.I.A.') === -1, 'Kein Wunschtext in Persistenz');
        var nativeCalls = [], nativeAllowed = true;
        KnuddelsServer.getExternalServerAccess = function () { return {
            canAccessURL: function () { return nativeAllowed; },
            postURL: function (url, params) {
                nativeCalls.push(params);
                check(typeof params.data.payload === 'string', 'Nativer Adapter sendet ausschließlich String-payload');
                check(params.header.Authorization === 'Bearer ' + sync && params.headers === undefined, 'Native header-Signatur');
                params.onSuccess(JSON.stringify({ accepted: true, serverTime: clock }), {
                    getResponseCode: function () { return 200; }, getURLString: function () { return url; }
                });
            }
        }; };
        var connection = { runtimeVerified: true, syncUrl: 'https://radio-mischwerk.web.app/api/publishKnuddelsState', syncSecret: sync };
        var nativeWire = runtime.createAndroidWire(connection), nativeReply = null;
        nativeWire.sendJson({ url: connection.syncUrl, authorization: 'Bearer ' + sync, body: { station: { wishboxOpen: false }, wishUpdates: [] } }, function (result) { nativeReply = result; });
        check(nativeCalls.length === 1 && nativeReply.status === 200 && nativeReply.body.accepted, 'Nativer Responseadapter in Rhino');
        check(JSON.parse(nativeCalls[0].data.payload).station.wishboxOpen === false, 'Innerer Vertrag bleibt typisiert');
        nativeAllowed = false;
        check(runtime.createAndroidWire(connection) === null, 'Fehlende Domainfreigabe sperrt nativen Port');
        connection.runtimeVerified = false; nativeAllowed = true;
        check(runtime.createAndroidWire(connection) === null, 'Fehlender Laufzeitnachweis sperrt nativen Port');
        runtime.stopAndroidRelay(); runtime.stopAndroidRelay();
        check(observer === null && Object.keys(channelTextTasks).length === 0, 'Shutdown beendet Hook und Timer');
        var probeCalls = [], probeReport = null, beforeProbe = JSON.stringify(data);
        KnuddelsServer.getAppServerInfo = function () { return {
            getVersion: function () { return '20990101-010101'; }, getServerId: function () { return 'synthetic-rhino'; }
        }; };
        KnuddelsServer.getExternalServerAccess = function () { return {
            canAccessURL: function (url) { probeCalls.push(url); return true; },
            getAllAccessibleDomains: function () { return [{ getDomainName: function () { return 'https://radio-mischwerk.web.app/'; } }]; },
            postURL: function () { throw new Error('Keine Anfrage bei Diagnose'); }
        }; };
        runtime.isChannelOwner = function (person) { return person.owner === true; };
        MischWerkModules.attachAndroidDiagnostics(runtime, MischWerkConfig);
        var operator = { owner: true, sendPrivateMessage: function (text) { probeReport = text; } };
        runtime.androidDiagnosticsCommand(operator, 'pruefen');
        check(probeReport.indexOf('20990101-010101') !== -1, 'Diagnose liest synthetische Serverversion in Rhino');
        check(probeReport.indexOf('"relayTargetAllowed":true') !== -1, 'Diagnose liest Domainrecht in Rhino');
        check(probeCalls.length === 2 && observer === null, 'Diagnose registriert keinen Hook');
        check(JSON.stringify(data) === beforeProbe, 'Diagnose schreibt keine Konfiguration oder Wünsche');
        runtime.androidDiagnosticsCommand({ owner: false }, 'pruefen');
        check(probeCalls.length === 2, 'Diagnose ohne Eigentümerrecht ist still');
        runtime.androidDiagnosticsCommand(operator, 'aktivieren');
        check(probeReport.indexOf('invalid-command') !== -1 && probeCalls.length === 2, 'Diagnose erlaubt keine Aktivierung');
        var stringFactories = [function (value) { return new String(value); }, function (value) { return new java.lang.String(value); }];
        stringFactories.forEach(function (makeString) {
            KnuddelsServer.getAppServerInfo = function () { return {
                getVersion: function () { return makeString('20990101-010101'); },
                getServerId: function () { return makeString('synthetic-rhino'); }
            }; };
            KnuddelsServer.getExternalServerAccess = function () { return {
                canAccessURL: function () { return true; },
                getAllAccessibleDomains: function () { return [{ getDomainName: function () { return makeString('https://radio-mischwerk.web.app:443/'); } }]; }
            }; };
            runtime.androidDiagnosticsCommand(operator, 'pruefen');
            var parsedProbe = JSON.parse(probeReport.replace(/\\([_°<>\\])/g, '$1'));
            check(parsedProbe.appServer.version === '20990101-010101', 'Stringobjekt-Version in Rhino normalisiert');
            check(parsedProbe.appServer.serverId === 'synthetic-rhino', 'Stringobjekt-Server-ID in Rhino normalisiert');
            check(parsedProbe.externalHttps.targetListed === true, 'Stringobjekt-Domain mit HTTPS-Standardport erkannt');
            check(parsedProbe.errors.length === 0 && JSON.stringify(data) === beforeProbe, 'Stringnormalisierung ohne Fehler und ohne Schreibzugriff');
            check(parsedProbe.appServer.valueDiagnostics.version.type === 'object', 'Tatsächlicher Stringobjekt-Typ bleibt im Diagnosebericht');
            check(parsedProbe.appServer.valueDiagnostics.version.text === '20990101-010101', 'Öffentlicher Rohwert bleibt vor Formatprüfung sichtbar');
        });
        KnuddelsServer.getAppServerInfo = function () { return {
            getVersion: function () { throw new Error('Private exception details'); }, getServerId: function () { return 'synthetic-rhino'; }
        }; };
        runtime.androidDiagnosticsCommand(operator, 'pruefen');
        var failedRead = JSON.parse(probeReport.replace(/\\([_°<>\\])/g, '$1'));
        check(failedRead.appServer.serverId === 'synthetic-rhino', 'Fehler eines Getters verdeckt den anderen nicht');
        check(failedRead.appServer.valueDiagnostics.version.error === 'read-failed' && probeReport.indexOf('Private exception') === -1, 'Getterfehler ohne Exceptiondetails');
        KnuddelsServer.getAppServerInfo = function () { return {
            getVersion: function () { return 'SNAPSHOT-'; }, getServerId: function () { return 'apps7@192.0.2.7'; }
        }; };
        runtime.androidDiagnosticsCommand(operator, 'pruefen');
        var snapshotRead = JSON.parse(probeReport.replace(/\\([_°<>\\])/g, '$1'));
        check(snapshotRead.appServer.version === 'SNAPSHOT-', 'Snapshotlabel unverändert aus der API erhalten');
        check(snapshotRead.appServer.serverId === 'apps7@192.0.2.7', 'Server-ID mit At-Zeichen erhalten');
        check(snapshotRead.appServer.versionComparable === false && snapshotRead.appServer.webhookMinimumVersionSatisfied === null, 'Snapshot ergibt keinen erfundenen Versionsvergleich');
        check(snapshotRead.errors.length === 0, 'Gültige API-Strings erzeugen keine Formatfehler');
    } finally {
        KnuddelsServer.getPersistence = previousPersistence; KnuddelsServer.getWebHookAccess = previousHooks;
        KnuddelsServer.getExternalServerAccess = previousExternal;
        KnuddelsServer.getAppServerInfo = previousInfo;
        channelTextTasks = {};
    }
}());

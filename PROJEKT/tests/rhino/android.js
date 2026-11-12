/* Echte Rhino-Engines; native HTTP-Antworten/Java-Strings im isolierten Plattformmodell. */
(function () {
    var previousPersistence = KnuddelsServer.getPersistence, previousHooks = KnuddelsServer.getWebHookAccess;
    var previousExternal = KnuddelsServer.getExternalServerAccess, previousInfo = KnuddelsServer.getAppServerInfo;
    var sync = new Array(65).join('s'), observer = null, nativeCalls = [], hookCalls = 0, clock = 1800000000000;
    var data = { 'mischwerk.android.private.v1': { enabled: true, runtimeVerified: true, syncSecret: sync,
        syncUrl: 'https://radio-mischwerk.web.app/api/publishKnuddelsState' } };
    KnuddelsServer.getPersistence = function () { return {
        getObjectKeys: function () { return Object.keys(data); }, deleteObject: function (key) { delete data[key]; },
        getObject: function (key, fallback) { return copy(Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback); },
        setObject: function (key, value) { data[key] = copy(value); }
    }; };
    KnuddelsServer.getWebHookAccess = function () { hookCalls += 1; throw new Error('No WebHook permission'); };
    KnuddelsServer.getExternalServerAccess = function () { return {
        canAccessURL: function () { return true; }, postURL: function (url, params) { nativeCalls.push({ url: url, params: params }); }
    }; };
    try {
        channelTextTasks = {};
        var runtime = MischWerkModules.createRuntime(MischWerkConfig);
        runtime.now = function () { return clock; }; runtime.warn = function () {}; runtime.broadcast = function () {};
        runtime.moderatorIsActive = function () { return false; };runtime.requestsAvailable=function(){return runtime.state.requestsEnabled;};runtime.canUseModeration=function(){return true;}; runtime.isModerator = function () { return true; };
        runtime.state = { requestsEnabled: true, topic: '', moderator: null };runtime.requestsAvailable=function(){return runtime.state.requestsEnabled;};
        MischWerkModules.attachChanges(runtime); MischWerkModules.attachValidation(runtime);
        MischWerkModules.attachTicker(runtime);
        MischWerkModules.attachWishStorage(runtime); MischWerkModules.attachWishQueue(runtime);
        MischWerkModules.attachAndroidFailures(runtime); MischWerkModules.attachAndroidSigning(runtime); MischWerkModules.attachAndroidConnection(runtime);
        MischWerkModules.attachAndroidReceipts(runtime); MischWerkModules.attachAndroidIncoming(runtime);
        MischWerkModules.attachAndroidPublisher(runtime); MischWerkModules.attachAndroidRelay(runtime);
        function answer(rows, status) {
            var c = nativeCalls[nativeCalls.length - 1], reply = { accepted: true, serverTime: clock, wishes: rows };
            c.params[status ? 'onFailure' : 'onSuccess'](new java.lang.String(JSON.stringify(reply)), {
                getResponseCode: function () { return new java.lang.Integer(status || 200); },
                getURLString: function () { return new java.lang.String(c.url); }
            });
        }
        function tick() {
            var id = Object.keys(channelTextTasks)[0], task = channelTextTasks[id];
            delete channelTextTasks[id]; clock += 20000; channelTextTime += 20000; task.callback();
        }
        runtime.startAndroidRelay(); runtime.startAndroidRelay();
        check(nativeCalls.length === 1 && hookCalls === 0, 'Sync allein startet ohne WebHook oder zweiten Schlüssel');
        check(Object.keys(nativeCalls[0].params.data).sort().join(',') === 'nonce,payload,sig,ts', 'Unveränderte vier signierte Strings');
        answer([]); check(runtime.androidRelayHealthy(), 'Native Java-String-Antwort und Java-Integer normalisiert');
        runtime.state.ticker = { text: new Array(301).join('Ä'), enabled: true, speed: 72, direction: 'right', revision: 1 };
        runtime.changed('station');
        var ticker = JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).station.ticker;
        check(ticker.enabled && ticker.text.length === 300 && ticker.speed === 72 && ticker.direction === 'right', 'Aktiver kanonischer Lauftext im signierten Android-Payload');
        answer([]); runtime.state.ticker.enabled = false; runtime.changed('station');
        ticker = JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).station.ticker;
        check(ticker.enabled === false && ticker.text.length === 300 && ticker.speed === 72 && ticker.direction === 'right', 'Ausgeschalteter Lauftext mit erhaltenen Werten im Android-Payload');
        answer([]);
        for (var i = 0; i < 3; i += 1) { runtime.submitWish({ getNick: function () { return 'Nativ'; }, getUserId: function () { return 1; } }, { submissionId: 'native-' + i, text: 'Band' }); }
        var incoming = [{ submissionId: 'android', text: 'M.I.A. – Song', displayName: 'Untrusted' }];
        tick(); answer(incoming); check(runtime.wishItems().length === 4, 'Android aus Antwort in derselben Queue auf Platz 4');
        check(runtime.wishItems()[3].nick === 'Android', 'Name wird keine behauptete Knuddelsidentität');
        tick(); check(JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).wishUpdates[0].position === 4, 'Nächster POST quittiert echten Platz');
        tick(); answer(incoming); check(runtime.wishItems().length === 4, 'Antwortwiederholung ist idempotent');
        runtime.resolveWish(1, 'done'); answer([]);
        check(JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).wishUpdates[0].position === 3, 'Entfernung eines Vorgängers aktualisiert echte Position');
        runtime.resolveWish(2, 'done'); answer([]); runtime.resolveWish(3, 'done'); answer([]);
        runtime.changeWishStage(null, { id: 4, previousStage: 'queued', stage: 'preparing' });
        check(JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).wishUpdates[0].state === 'preparing', 'Vorbereitung wird zurückgemeldet'); answer([]);
        runtime.changeWishStage(null, { id: 4, previousStage: 'preparing', stage: 'playing' }); answer([]);
        runtime.resolveWish(4, 'done'); answer(incoming);
        check(runtime.wishItems().length === 0 && runtime.pendingAndroidUpdates()[0].state === 'done', 'Terminale Antwortwiederholung erzeugt keine Dublette');
        tick(); answer([{ submissionId: 'invalid', text: 'https://example.invalid', displayName: null }]);
        check(runtime.androidReceipt('invalid').state === 'discarded', 'Ungültiger Text wird verworfen und quittiert');
        tick(); var longRows = [];
        for (i = 0; i < 10; i += 1) { longRows.push({ submissionId: 'long-' + i, text: new Array(301).join('Ä'), displayName: new Array(51).join('名') }); }
        answer(longRows); check(runtime.wishItems().length === 10, 'Zehn Unicode-Wünsche über alter 4096-Byte-Grenze in Rhino');
        check(JSON.stringify(data['mischwerk.android.receipts.v1']).indexOf('Untrusted') === -1, 'Technische Marker ohne Wunschtext oder Namen');
        runtime.stopAndroidRelay(); runtime.stopAndroidRelay();
        check(hookCalls === 0 && Object.keys(channelTextTasks).length === 0, 'Stop beendet Timer ohne WebHook-Zugriff');
        KnuddelsServer.getWebHookAccess = function () { return {
            registerWebHook: function () { throw new Error('Keine Registrierung bei Diagnose'); }, unregisterWebHook: function () {}
        }; };
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

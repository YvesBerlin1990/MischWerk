/* Echte Rhino-Engines; native HTTP-Antworten/Java-Strings im isolierten Plattformmodell. */
(function () {
    var previousPersistence = KnuddelsServer.getPersistence, previousHooks = KnuddelsServer.getWebHookAccess;
    var previousExternal = KnuddelsServer.getExternalServerAccess, previousInfo = KnuddelsServer.getAppServerInfo, previousPeople = people;
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
        MischWerkModules.attachWishExportState(runtime); MischWerkModules.attachWishControlState(runtime);
        MischWerkModules.attachWishStorage(runtime); MischWerkModules.attachWishQueue(runtime);
        MischWerkModules.attachWebsiteWishes(runtime);
        MischWerkModules.attachAndroidFailures(runtime); MischWerkModules.attachAndroidSigning(runtime); MischWerkModules.attachAndroidConnection(runtime);
        MischWerkModules.attachAndroidReceipts(runtime); MischWerkModules.attachAndroidIncoming(runtime);
        MischWerkModules.attachAndroidStudioWishes(runtime);
        MischWerkModules.attachStudioWishControl(runtime); MischWerkModules.attachStudioWishCommands(runtime);
        MischWerkModules.attachAndroidPublisher(runtime); MischWerkModules.attachAndroidRelay(runtime);
        function answer(rows, status, commands) {
            var c = nativeCalls[nativeCalls.length - 1], reply = { accepted: true, serverTime: clock, wishes: rows };
            if (commands) { reply.studioWishCommands = commands; }
            c.params[status ? 'onFailure' : 'onSuccess'](new java.lang.String(JSON.stringify(reply)), {
                getResponseCode: function () { return new java.lang.Integer(status || 200); },
                getURLString: function () { return new java.lang.String(c.url); }
            });
        }
        function tick() {
            var id = Object.keys(channelTextTasks)[0], task = channelTextTasks[id];
            var elapsed = task.at - channelTextTime;
            delete channelTextTasks[id]; clock += elapsed; channelTextTime += elapsed; task.callback();
        }
        runtime.startAndroidRelay(); runtime.startAndroidRelay();
        check(nativeCalls.length === 1 && hookCalls === 0, 'Sync allein startet ohne WebHook oder zweiten Schlüssel');
        check(channelTextTasks[Object.keys(channelTextTasks)[0]].at === channelTextTime + 20000, 'Inaktive Moderation behält exakt den 20-Sekunden-Takt');
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
        for (var i = 0; i < 3; i += 1) {
            runtime.submitWish({ getNick: function () { return 'Nativ'; }, getUserId: function () { return 1; } }, { submissionId: 'native-' + i, text: 'Band' });
            var nativeBody = JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload), nativeRow = nativeBody.studioWishUpdates[0];
            check(nativeBody.wishMetadataVersion === 1 && nativeRow.position === i + 1 && nativeRow.text === 'Band' &&
                nativeRow.origin === 'knuddels' && nativeRow.displayName === 'Nativ' && /^knuddels:[A-Za-z0-9_-]{1,84}$/.test(nativeRow.submissionId),
                'Native Projektion mit stabiler ID und echtem Platz in Rhino');
            answer([]);
        }
        var incoming = [{ submissionId: 'android', text: 'M.I.A. – Song', displayName: 'Untrusted' }];
        tick(); answer(incoming); check(runtime.wishItems().length === 4, 'Android aus Antwort in derselben Queue auf Platz 4');
        check(runtime.wishItems()[3].nick === 'Android', 'Name wird keine behauptete Knuddelsidentität');
        check(runtime.wishItems()[3].displayName === 'Untrusted' && runtime.wishItems()[3].origin === undefined, 'Legacyname erhalten, unbekannte Herkunft nicht geraten');
        tick(); check(JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload).wishUpdates[0].position === 4, 'Nächster POST quittiert echten Platz'); answer([]);
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
        longRows[0].origin = 'web'; longRows[1].origin = 'android';
        answer(longRows); check(runtime.wishItems().length === 10, 'Zehn Unicode-Wünsche über alter 4096-Byte-Grenze in Rhino');
        check(runtime.wishItems()[0].origin === 'web' && runtime.wishItems()[1].origin === 'android' &&
            runtime.wishItems()[0].displayName.length === 50, 'Web-/Android-Herkunft und Anzeigename verlustfrei in Rhino');
        check(JSON.stringify(data['mischwerk.android.receipts.v1']).indexOf('Untrusted') === -1, 'Technische Marker ohne Wunschtext oder Namen');
        tick(); answer([]);
        var moderator = person(99101, 'Otterchen', true); people = [moderator];
        runtime.state.radioModeratorUserIds = [];
        runtime.state.moderator = { userId: 99101, nick: 'Otterchen', authentication: 'knuddels', sessionKey: 'rhino-native-session', since: clock };
        MischWerkModules.attachIdentity(runtime, MischWerkConfig); MischWerkModules.attachModeration(runtime, MischWerkConfig);
        runtime.changed('station'); answer([]);
        check(Object.keys(channelTextTasks).length === 1 && channelTextTasks[Object.keys(channelTextTasks)[0]].at === channelTextTime + 5000,
            'Echte aktive Moderation verwendet genau einen 5-Sekunden-Timer in Rhino');
        function body() { return JSON.parse(nativeCalls[nativeCalls.length - 1].params.data.payload); }
        check(body().studioWishControl.nick === 'Otterchen' && /^[a-f0-9]{64}$/.test(body().studioWishControl.sessionId),
            'Echter nativer Moderator und Sitzung im v1-Steuerblock in Rhino');
        runtime.submitWish(moderator, { submissionId: 'rhino-control', text: 'Fernregie erhält Reihenfolge' });
        var controlItem = runtime.wishItems()[10], commandSequence = 0;
        function command(action, item) {
            var queue = runtime.loadWishes(), version = queue.controlVersions.filter(function (row) { return row.id === item.id; })[0];
            var sent = version.exports[version.exports.length - 1];
            return { commandId: new Array(64).join('0') + (++commandSequence), submissionId: runtime.wishControlId(queue, item),
                action: action, expectedState: runtime.wishControlStage(item), expectedPosition: queue.items.indexOf(item) + 1,
                expectedSourceUpdatedAt: sent.stamp, beforeSubmissionId: null, sessionId: body().studioWishControl.sessionId, expiresAt: clock + 120000 };
        }
        var accept = command('accept', controlItem), beforeCalls = nativeCalls.length;
        answer([], null, [accept]);
        check(nativeCalls.length === beforeCalls && controlItem.id === runtime.wishItems()[10].id, 'Kein Sortieren oder rekursiver Ergebnis-POST in Rhino');
        tick();
        check(body().studioWishResults[0].state === 'applied' && body().studioWishUpdates[0].state === 'received' &&
            body().studioWishUpdates[0].position === 11, 'Atomarer Annahmebeleg mit aktuellem nativen Wunsch im selben POST');
        var revision = runtime.loadWishes().controlVersions[10].revision;
        answer([], null, [accept]); tick();
        check(body().studioWishResults[0].state === 'applied' && runtime.loadWishes().controlVersions[10].revision === revision,
            'Doppelte Zustellung quittiert denselben Commit ohne zweite Mutation');
        answer([]); tick();
        var stale = command('prepare', runtime.wishItems()[10]);
        runtime.changeWishStage(moderator, { id: controlItem.id, previousStage: 'queued', stage: 'preparing' });
        runtime.changeWishStage(moderator, { id: controlItem.id, previousStage: 'preparing', stage: 'queued' });
        answer([], null, [stale]); tick();
        check(body().studioWishResults[0].reason === 'stale_wish', 'Hin-und-zurück-Mutation macht alten Snapshot in Rhino ungültig');
        answer([], null, [command('prepare', runtime.wishItems()[0])]); tick();
        check(body().studioWishResults[0].state === 'applied' && body().wishUpdates[0].state === 'preparing',
            'Externer Wunsch benutzt dieselben Fachaktionen und aktuelle technische Rückprojektion');
        answer([], null, [command('playing', runtime.wishItems()[0])]); tick();
        check(body().wishUpdates[0].state === 'playing', 'Nur vorbereiteter erster Wunsch wird als laufend markiert');
        answer([], null, [command('done', runtime.wishItems()[0])]); tick();
        check(body().studioWishResults[0].state === 'applied' && body().wishUpdates[0].state === 'done' && body().wishUpdates[0].position === null,
            'Abschluss und dauerhafter Beleg vor Endzustandsquittung in Rhino');
        answer([]);
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
        people = previousPeople;
        channelTextTasks = {};
    }
}());

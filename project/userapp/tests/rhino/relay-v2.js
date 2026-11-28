/* Zentraler V2-Abgleich in beiden echten Engines: signierte Hülle, Studio-Projektion, Outbox, Einzelquittungen, Iconoptionen und HTTP-Reserve. */
(function () {
    var externalBefore = KnuddelsServer.getExternalServerAccess, nativeCalls = [], initial = centralSettings();
    KnuddelsServer.getExternalServerAccess = function () { return { canAccessURL:function () { return true; },
        postURL:function (url, parameters) { nativeCalls.push({ url:url, parameters:parameters, body:JSON.parse(parameters.data.payload) }); } }; };
    function finish(extra) { centralFinish(nativeCalls[nativeCalls.length - 1], extra); }
    var started = startApp(initial), App = started.app, currentRuntime = started.runtime;
    try {
        var owner = person(2, 'Otterchen', true), listener = person(3, 'Hörer', false), dj = person(4, 'DJ-Test', false);
        App.onUserJoined(owner); App.onUserJoined(listener); App.onUserJoined(dj); publicMessages = [];
        var os = radioSession(owner), ls = radioSession(listener);
        check(nativeCalls.length === 1, 'Aktivierte Verbindung startet genau einen Abgleich');
        check(Object.keys(nativeCalls[0].parameters.data).sort().join(',') === 'nonce,payload,sig,ts', 'Vier unveränderte Stringfelder');
        Object.keys(nativeCalls[0].parameters.data).forEach(function (key) { check(typeof nativeCalls[0].parameters.data[key] === 'string', 'Stringfeld ' + key); });
        check(nativeCalls[0].body.contractVersion === 2 && nativeCalls[0].body.station === undefined, 'Nur innerer V2-Vertrag, keine lokale Sendung');
        check(nativeCalls[0].body.nativeConfig === undefined, 'Keine zentrale Konfigurationsmutation');
        check(currentRuntime.receivedRosterState().confirmed === false, 'Unbekannte Freigaben bleiben unbestätigt');
        finish({ station:{ contractVersion:2, authority:'studio', protocolEpoch:'rhino-public', revision:0, broadcastState:'unknown', onAir:false, wishboxOpen:false,
            moderatorNick:null, topic:null, updatedAt:0, validUntil:0 } });
        check(currentRuntime.receivedShow().active === false, 'Unbekannter Stand aktiviert keinen DJ');
        advance(9999); check(nativeCalls.length === 1, 'Kein vorzeitiger regulärer Abgleich');
        advance(1); check(nativeCalls.length === 2, 'Ohne aktive Sendung nach zehn Sekunden erneut abgleichen');
        finish(); App.onEventReceived(owner, 'mw:refresh', {}, os);
        check(currentRuntime.receivedRosterState().confirmed === true, 'Vollständig empfangene Freigaben sind bestätigt');
        var ownerState = latest(os, 'mw:state');
        check(Object.keys(ownerState.user).sort().join(',') === 'canAdminister,nick', 'Zustand enthält nur Nick und Inhabernachweis');
        check(ownerState.topic === 'Äther 🎶' && ownerState.requestsEnabled === true, 'Bestätigte Firebase-Sendung');
        check(!('queue' in ownerState) && !('queueTotal' in ownerState), 'Keine Moderationsqueue im Zustand');
        var unchanged = JSON.stringify(store.data);
        ['mw:onAir', 'mw:offAir', 'mw:openStudio', 'mw:setTopic', 'mw:setRequests', 'mw:handover.accept', 'mw:addRadioModerator', 'mw:removeRadioModerator',
            'mw:ackRequest', 'mw:queue.read', 'mw:setWishStage', 'mw:resolveRequest', 'mw:pin.login', 'mw:migration.start'].forEach(function (type) {
            App.onEventReceived(owner, type, { requestId:'old', enabled:true, topic:'Falsch' }, os);
            check(latest(os, 'mw:result').ok === false, 'Altaktion gesperrt ' + type);
            check(JSON.stringify(store.data) === unchanged, 'Keine Altmutation ' + type);
        });
        check(App.chatCommands.lauftext === undefined, 'Lauftextbefehl entfernt');
        check(MischWerkModules.attachHandover === undefined && MischWerkModules.attachModerationPin === undefined, 'Keine leeren Altcontroller');
        var originalSet = store.setObject;
        store.setObject = function () { throw new Error('synthetischer Speicherabbruch'); };
        App.onEventReceived(listener, 'mw:wish.submit', { submissionId:'rhino-failed', text:'Fehler bleibt privat' }, ls);
        store.setObject = originalSet;
        check(latest(ls, 'mw:wish.receipt').accepted === false && currentRuntime.nativeRelayState().entries.length === 0, 'Speicherabbruch bestätigt keine Outbox');
        App.onEventReceived(listener, 'mw:wish.submit', { submissionId:'rhino-wish', text:'Lied für Änne 🎶' }, ls);
        check(latest(ls, 'mw:wish.receipt').pending === true && latest(ls, 'mw:wish.receipt').accepted === false, 'Outbox ist keine Annahme');
        advance(10000);
        var sent = nativeCalls[nativeCalls.length - 1].body.wishSubmissions[0];
        check(sent.ownerKey.length === 64 && sent.text === 'Lied für Änne 🎶', 'Pseudonymer Besitzer und Unicode vollständig');
        check(JSON.stringify(nativeCalls[nativeCalls.length - 1].body).indexOf('"3"') === -1, 'Keine native Nutzer-ID im Abgleich');
        finish({ wishReceipts:[{ submissionId:sent.submissionId, accepted:true, state:'queued', position:17, error:null }] });
        check(latest(ls, 'mw:wish.receipt').accepted === true, 'Individuelle Commitquittung');
        App.onEventReceived(listener, 'mw:refresh', {}, ls);
        check(latest(ls, 'mw:state').wishPositions.nextPosition === 17, 'Zentraler globaler Platz');
        App.onEventReceived(listener, 'mw:wish.submit', { submissionId:'rhino-wish', text:'Lied für Änne 🎶' }, ls);
        check(currentRuntime.nativeRelayState().entries.length === 1, 'Wiederholte Kennung erzeugt keinen zweiten Wunsch');
        App.onEventReceived(listener, 'mw:wish.submit', { submissionId:'rhino-wish', text:'Anderer Text' }, ls);
        check(latest(ls, 'mw:wish.receipt').accepted === false, 'Gleiche Kennung mit anderem Text bleibt abgewiesen');
        App.chatCommands.mw(owner, 'admin'); var ts = viewSession(owner, 'team');
        App.onEventReceived(owner, 'mw:display.save', { view:'team', viewRevision:1, requestId:'display', expectedRevision:0, teamSignsEnabled:false, announcementsEnabled:true }, ts);
        check(latest(ts, 'mw:result').ok === true, 'Teamzeichen separat schaltbar');
        check(Object.keys(dj.nicklistIcons).length === 1, 'Mikrofon bleibt ohne MW-Teamzeichen');
        var consoleUser = person(6, 'Polaroid', false);
        consoleUser.getNick = function () { return new java.lang.String('Polaroid'); };
        App.onUserJoined(consoleUser); App.chatCommands.mw(consoleUser, 'admin');
        var consoleSession = viewSession(consoleUser, 'team');
        check(!!consoleSession && currentRuntime.canUseAdministration(consoleUser), 'Polaroid erhält die native Konsole aus authentifiziertem Java-Nick');
        check(currentRuntime.canAdminister(consoleUser) === false, 'Konsolenzugang erteilt kein Inhaberrecht');
        var consoleSmileyCode = ':(polaroid-test):', consoleSmileyImage = '°>sm_fixture_polaroid.gif<°', consoleSmileyReplies = [];
        var consolePrivateReply = consoleUser.sendPrivateMessage;
        consoleUser.sendPrivateMessage = function (text) { consoleSmileyReplies.push(String(text)); };
        var consoleSmileyMessage = function (code, image) { return { getAuthor:function () { return consoleUser; },
            getRawText:function () { return new java.lang.String('smiley ' + code); }, getText:function () { return new java.lang.String('smiley ' + image); } }; };
        App.onPrivateMessage(consoleSmileyMessage(consoleSmileyCode, consoleSmileyImage));
        check(consoleSmileyReplies[0].indexOf('Smiley gespeichert') === 0, 'Polaroid importiert Smiley aus nativen Java-Strings ohne Inhaberrecht');
        check(currentRuntime.readChannelTexts().smileys[0].image === consoleSmileyImage, 'Polaroids Smiley dauerhaft im vorhandenen Speicher');
        var consoleSmileyStored = JSON.stringify(currentRuntime.readChannelTexts());
        App.onPrivateMessage(consoleSmileyMessage(consoleSmileyCode, consoleSmileyImage));
        check(JSON.stringify(currentRuntime.readChannelTexts()) === consoleSmileyStored, 'Polaroids Smileywiederholung ist idempotent');
        var consoleOnline = consoleUser.isOnlineInChannel;
        consoleUser.isOnlineInChannel = function () { return false; };
        App.onPrivateMessage(consoleSmileyMessage(':(gesperrt):', '°>sm_fixture_private.gif<°'));
        check(JSON.stringify(currentRuntime.readChannelTexts()) === consoleSmileyStored && consoleSmileyReplies[2].indexOf('Empfangen') === -1,
            'Abwesender Polaroid erhält weder Import noch Formatdiagnose');
        consoleUser.isOnlineInChannel = consoleOnline; consoleUser.sendPrivateMessage = consolePrivateReply;
        App.onEventReceived(consoleUser, 'mw:androidSettings.status', {}, consoleSession);
        check(latest(consoleSession, 'mw:androidSettings.status').ok === true, 'Polaroid liest die private Verbindung in aktueller Konsole');
        App.onEventReceived(consoleUser, 'mw:display.save', { view:'team', viewRevision:1, requestId:'console-icons', expectedRevision:1, teamSignsEnabled:false,
            microphoneEnabled:false, headphonesEnabled:false, announcementsEnabled:true }, consoleSession);
        check(latest(consoleSession, 'mw:result').ok === true && Object.keys(dj.nicklistIcons).length === 0, 'Mikrofon separat ausschaltbar ohne Status zu erfinden');
        check(currentRuntime.displaySettings().headphonesEnabled === false, 'Kopfhöreroption separat gespeichert');
        App.onEventReceived(consoleUser, 'mw:display.save', { view:'team', viewRevision:1, requestId:'console-restore', expectedRevision:2, teamSignsEnabled:false,
            microphoneEnabled:true, headphonesEnabled:true, announcementsEnabled:true }, consoleSession);
        check(Object.keys(dj.nicklistIcons).length === 1, 'Bestätigtes Mikrofon nach explizitem Einschalten wiederhergestellt');
        var beforeExpiryMessages = publicMessages.length, lastCall = nativeCalls.length;
        currentRuntime.stopAndroidPublisher();
        advance(45000); App.onEventReceived(listener, 'mw:refresh', {}, ls);
        check(nativeCalls.length === lastCall, 'Angehaltener Publisher sendet nichts');
        check(latest(ls, 'mw:state').moderator === null && latest(ls, 'mw:state').requestsEnabled === false, '45 Sekunden schließen Anzeige und Annahme');
        check(publicMessages.length === beforeExpiryMessages, 'Ausfall ist kein Ende');
        check(currentRuntime.receivedRosterState().confirmed === false, 'Abgelaufene Freigaben werden wieder unbestätigt');
        var own = currentRuntime.copy(currentRuntime.nativeRelayState()), oldId = own.entries[0].submissionId;
        currentRuntime.acceptNativeWishReply({ wishReceipts:[], deletionReceipts:[], ownWishStatuses:[{ submissionId:oldId, state:null, position:null, error:'unavailable' }] },
            { wishSubmissions:[], ownerDeletions:[], ownWishQueries:[{ submissionId:oldId, ownerKey:own.entries[0].ownerKey }] });
        check(currentRuntime.nativeRelayState().entries[0].state === 'unconfirmed' && currentRuntime.nativeRelayState().entries[0].text === 'Lied für Änne 🎶',
            'Statusfehler bleibt neutral, Text und Identität erhalten');
        var original = currentRuntime.copy(currentRuntime.loadWishes());
        for (var i = 0; i < 260; i += 1) {
            original.items.push({ id:original.nextId++, senderKey:'3', nick:'Hörer', text:String(i) + new Array(141).join('🎶'), submissionId:'legacy-' + i, createdAt:testClock,
                delivery:i === 0 ? { nick:'Alter DJ', at:testClock, senderKey:'2' } : null });
        }
        var terminalId = original.nextId++;
        original.replays.push({ id:terminalId, submissionId:'rhino-terminal', senderKey:'3', outcome:'done' });
        original.revision += 1;
        currentRuntime.updateStudioWishState(currentRuntime.loadWishes(), original);
        currentRuntime.updateWishControlState(currentRuntime.loadWishes(), original);
        currentRuntime.commitWishMetadata(original);
        check(Object.keys(store.data).filter(function (key) { return key.indexOf('mischwerk.wishes.v3') === 0; }).length > 3, 'Große Originalbestände liegen auf mehreren Seiten');
        Object.keys(store.data).forEach(function (key) { check(JSON.stringify(store.data[key]).length < 90000, 'Seite unter 90000 JSON-Zeichen: ' + key); });
        var beforeReplay = currentRuntime.nativeRelayState().entries.length;
        App.onEventReceived(listener, 'mw:wish.submit', { submissionId:'rhino-terminal', text:'Historischer Text ist unbekannt' }, ls);
        check(latest(ls, 'mw:wish.receipt').state === 'done' && currentRuntime.nativeRelayState().entries.length === beforeReplay, 'Terminaler Original-Replay erzeugt keine neue ID');
        App.onEventReceived(dj, 'mw:wish.submit', { submissionId:'rhino-terminal', text:'Fremde Wiederholung' }, radioSession(dj));
        check(latest(radioSession(dj), 'mw:wish.receipt').accepted === false, 'Fremder Replaybesitzer bleibt gesperrt');
        var reloaded = MischWerkModules.createApp(MischWerkConfig), reloadedRuntime = lastRuntime;
        var items = reloadedRuntime.loadWishes().items;
        check(items.length === 260 && items[259].text === '259' + new Array(141).join('🎶'), '260 Unicodeoriginale über 100 kB vollständig neu geladen');
        check(reloadedRuntime.nativeRelayState().entries[0].text === 'Lied für Änne 🎶', 'Outbox übersteht Neustart');
        check(currentRuntime.numericUserId(new java.lang.Integer(3)) === 3, 'Native Zahlenwrapper normalisiert');
        currentRuntime.startAndroidPublisher(currentRuntime.readAndroidSettings(), currentRuntime.createAndroidWire(currentRuntime.readAndroidSettings()));
        var failedCall = nativeCalls[nativeCalls.length - 1];
        check(nativeCalls.length > lastCall, 'Neu gestarteter Publisher gleicht wieder ab');
        failedCall.parameters.onFailure(new java.lang.String('Private Antwort wird nie protokolliert'), javaResponse(failedCall.url, 400));
        check(currentRuntime.androidLastFailure().stage === 'http_response' && currentRuntime.androidLastFailure().httpStatus === 400, 'HTTP-Ursprungsstufe bleibt bei Java-Antwortobjekten erhalten');
        check(warnings.join('|').indexOf('Private Antwort') === -1, 'Rohantwort nicht protokolliert');
    } finally {
        started.stop(); KnuddelsServer.getExternalServerAccess = externalBefore;
    }
}());
(function () {
    var budgetNow = 1800000000000, budgetRuntime = { now:function () { return budgetNow; } }, callbacks = [];
    MischWerkModules.attachHttpBudget(budgetRuntime);
    var completeBudget = budgetRuntime.beginExternalRequest('sync'); completeBudget();
    check(budgetRuntime.externalRequestDelay('sync') === 10000, 'HTTP-Mindestabstand gilt auch nach sofortigem Erfolg');
    for (var budgetIndex = 1; budgetIndex < 60; budgetIndex += 1) { budgetNow += 10000; budgetRuntime.beginExternalRequest('sync')(); }
    check(budgetRuntime.externalRequestDelay('sync') === 10000, '60 POSTs lassen keine zusätzliche Dringlichkeit zu');
    budgetNow += 10000; check(budgetRuntime.externalRequestDelay('sync') === 0, 'Rollendes Fenster gibt den ältesten bestätigten Platz frei');
    for (var scheduleIndex = 0; scheduleIndex < 30; scheduleIndex += 1) { callbacks.push(budgetRuntime.beginExternalRequest('schedule')); }
    check(budgetRuntime.externalRequestDelay('schedule') > 0, '30 Sendeplanaufrufe halten ihre eigene Reserve');
    budgetNow += 600000; check(budgetRuntime.externalRequestDelay('schedule') > 0, 'Ausstehende native Antworten bleiben auch nach zehn Minuten reserviert');
    callbacks.forEach(function (callback) { callback(); });
    budgetNow += 599999; check(budgetRuntime.externalRequestDelay('schedule') === 1, 'Verspätete Antworten halten ihre Reserve für weitere zehn Minuten');
    budgetNow += 1; check(budgetRuntime.externalRequestDelay('schedule') === 0, 'Sendeplanreserve läuft nach echtem Callback ab');
    budgetRuntime.beginExternalRequest('sync')(); budgetNow -= 1000;
    check(budgetRuntime.externalRequestDelay('sync') === 11000, 'Rückwärts laufende Uhr hebt den Abstand nicht auf');
}());

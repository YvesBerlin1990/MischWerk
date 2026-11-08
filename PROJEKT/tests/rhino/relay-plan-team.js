/* Echte ES5-/Java-Werte, unveränderter nativer HTTP-Port, bestehende Wochen-/Teamadapter. */
(function () {
    var persistenceBefore = KnuddelsServer.getPersistence, externalBefore = KnuddelsServer.getExternalServerAccess;
    var accessBefore = KnuddelsServer.getUserAccess, saved = {}, calls = [], clock = 1800000000000, fail = false;
    var url = 'https://radio-mischwerk.web.app/api/publishKnuddelsState', runtime;
    KnuddelsServer.getPersistence = function () { return {
        getObject: function (key, fallback) { return copy(saved[key] || fallback); },
        setObject: function (key, value) { if (fail && key.indexOf('mischwerk.schedule.v1.') === 0) { throw new Error('storage'); } saved[key] = copy(value); }
    }; };
    KnuddelsServer.getUserAccess = function () { return {
        exists: function (nick) { return nick === 'Otterchen' || nick === 'DJ Test'; },
        getUserId: function (nick) { return new java.lang.Integer(nick === 'Otterchen' ? 1 : 2); },
        getNick: function (id) { return new java.lang.String(id === 1 ? 'Otterchen' : 'DJ Test'); }
    }; };
    KnuddelsServer.getExternalServerAccess = function () { return { canAccessURL: function () { return true; },
        postURL: function (target, params) { calls.push({ target: target, params: params }); } }; };
    function create() {
        var r = MischWerkModules.createRuntime(MischWerkConfig);
        r.now = function () { return clock; }; r.warn = function () {}; r.broadcast = function () {};
        r.moderatorIsActive = function () { return false; }; r.dropWebsiteUser = function () {};
        r.pendingAndroidUpdates = function () { return []; }; r.confirmAndroidUpdates = function () {};
        r.androidReceiptsReady = function () { return true; };
        MischWerkModules.attachChanges(r); MischWerkModules.attachRelayResults(r);
        MischWerkModules.attachIdentity(r, MischWerkConfig); MischWerkModules.attachValidation(r);
        MischWerkModules.attachPersistence(r, MischWerkConfig); MischWerkModules.attachRadioTeam(r, MischWerkConfig);
        MischWerkModules.attachTicker(r); MischWerkModules.attachScheduleCalendar(r); MischWerkModules.attachScheduleStorage(r);
        MischWerkModules.attachScheduleProgramme(r, MischWerkConfig); MischWerkModules.attachScheduleCommands(r, MischWerkConfig);
        MischWerkModules.attachScheduleBroadcasts(r); MischWerkModules.attachWebsitePublic(r, MischWerkConfig);
        MischWerkModules.attachAndroidSigning(r); MischWerkModules.attachAndroidConnection(r); MischWerkModules.attachAndroidIncoming(r);
        MischWerkModules.attachRelayProjection(r); MischWerkModules.attachRelayCommands(r); MischWerkModules.attachAndroidPublisher(r);
        r.readState();
        var settings = { runtimeVerified: true, syncSecret: new Array(65).join('s'), syncUrl: url };
        r.startAndroidPublisher(settings, r.createAndroidWire(settings));
        return r;
    }
    function body() { return JSON.parse(calls[calls.length - 1].params.data.payload); }
    function answer(extra) {
        var call = calls[calls.length - 1], reply = { accepted: true, serverTime: clock, wishes: [] };
        Object.keys(extra || {}).forEach(function (key) { reply[key] = extra[key]; });
        call.params.onSuccess(new java.lang.String(JSON.stringify(reply)), {
            getResponseCode: function () { return new java.lang.Integer(200); }, getURLString: function () { return new java.lang.String(url); }
        });
    }
    function tick() {
        var id = Object.keys(channelTextTasks)[0], task = channelTextTasks[id];
        delete channelTextTasks[id]; clock += 20000; channelTextTime += 20000; task.callback();
    }
    try {
        channelTextTasks = {}; runtime = create();
        var week = runtime.scheduleWeek(runtime.scheduleToday()), prefix = 'mischwerk.schedule.v1.';
        var plan = { commandId: 'rhino-plan', operation: 'save', week: week, expectedRevision: 0,
            entry: { date: runtime.scheduleToday(), kind: 'live', timing: 'fixed', start: '18:00', end: '19:00', nick: 'Otterchen', topic: 'Sendung' } };
        var team = { commandId: 'rhino-team', operation: 'add', expectedRevision: 0, nick: 'DJ Test' };
        check(body().scheduleUpdates.length === 3 && body().teamUpdates.moderators.length === 0, 'Öffentliche Initialprojektionen in Rhino');
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(calls.length === 1, 'Keine rekursive Sendung nach Rückaufträgen');
        check(runtime.readScheduleWeek(week).entries.length === 1 && runtime.state.radioModeratorUserIds[0] === 2, 'Beide Relayaufträge ohne Rollenfelder mit nativer Nickauflösung angewandt');
        check(saved[prefix + week].relayResults[0].revision === saved[prefix + week].revision, 'Wochenänderung und Wiederholungsbeleg atomar');
        tick();
        check(body().scheduleResults[0].state === 'applied' && body().moderatorResults[0].state === 'applied', 'Nächster regulärer POST quittiert beide Bereiche');
        check(body().teamUpdates.moderators[0].nick === 'DJ Test', 'Java-Nick als öffentlicher String ohne User-ID');
        check(JSON.stringify(body()).indexOf('userId') === -1, 'Keine privaten Knuddels-IDs im Relay-Body');
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(runtime.readScheduleWeek(week).revision === 1 && runtime.state.radioModeratorRevision === 1, 'Wiederholung führt keine zweite Fachänderung aus');
        runtime.stopAndroidPublisher(); channelTextTasks = {}; runtime = create();
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(runtime.readScheduleWeek(week).revision === 1 && runtime.state.radioModeratorRevision === 1, 'Neustart erhält Wiederholungsschutz');
        tick(); answer({ scheduleCommands: [{ commandId: 'stale-revision', operation: 'delete', week: week, expectedRevision: 0, id: 1 }] });
        check(runtime.readScheduleWeek(week).entries.length === 1 && runtime.readScheduleWeek(week).revision === 1, 'Veraltete Revision weiterhin abgelehnt ohne Fachänderung');
        tick(); check(body().scheduleResults[0].state === 'rejected', 'Ablehnung im nächsten regulären POST');
        answer({});
        var savedWeek = runtime.readScheduleWeek(week);
        for (var index = 2; index <= 105; index += 1) {
            var entry = copy(savedWeek.entries[0]); entry.id = index; savedWeek.entries.push(entry);
        }
        savedWeek.nextId = 106; runtime.writeScheduleWeek(week, savedWeek); runtime.changed('schedule');
        check(body().scheduleUpdates.length === 4 && body().scheduleUpdates[3].page === 3, 'Höchstens vier öffentliche Wochen-Seiten pro POST');
        answer({}); tick(); check(body().scheduleUpdates[0].page === 4, 'Regulärer Folgepost liefert restliche Seiten'); answer({});
        tick(); fail = true;
        var failed = copy(plan); failed.commandId = 'storage-failure'; failed.operation = 'delete'; failed.id = 1; failed.expectedRevision = 2;
        answer({ scheduleCommands: [failed] }); fail = false;
        check(runtime.readScheduleWeek(week).entries.length === 105, 'Speicherfehler verändert keinen Wochenplan');
        check(!runtime.pendingRelayResults().scheduleResults, 'Speicherfehler täuscht keine Annahme vor');
    } finally {
        if (runtime) { runtime.stopAndroidPublisher(); }
        KnuddelsServer.getPersistence = persistenceBefore; KnuddelsServer.getExternalServerAccess = externalBefore;
        KnuddelsServer.getUserAccess = accessBefore; channelTextTasks = {};
    }
}());

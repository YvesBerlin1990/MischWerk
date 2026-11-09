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
        MischWerkModules.attachScheduleRelay(r); MischWerkModules.attachScheduleBroadcasts(r); MischWerkModules.attachWebsitePublic(r, MischWerkConfig);
        MischWerkModules.attachAndroidFailures(r); MischWerkModules.attachAndroidSigning(r); MischWerkModules.attachAndroidConnection(r); MischWerkModules.attachAndroidIncoming(r);
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
        var plan = { commandId: 'rhino-plan', id: 'firebase-plan', operation: 'save', week: week, expectedRevision: 0,
            entry: { date: runtime.scheduleToday(), kind: 'live', timing: 'fixed', start: '18:00', end: '19:00', nick: 'Otterchen', topic: 'Sendung' } };
        var team = { commandId: 'rhino-team', operation: 'add', expectedRevision: 0, nick: 'DJ Test' };
        check(body().scheduleRevisions.length === 3 && body().moderatorRevision === 0, 'Tatsächliche Revisionen in Rhino');
        check(!body().scheduleUpdates && !body().teamUpdates, 'Keine vollständigen Listen');
        check(runtime.androidLastFailure() === null, 'Private Fehlerdiagnose zunächst leer');
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(calls.length === 1, 'Keine rekursive Sendung nach Rückaufträgen');
        check(runtime.readScheduleWeek(week).entries.length === 1 && runtime.state.radioModeratorUserIds[0] === 2, 'Relayaufträge mit Java-Nickauflösung angewandt');
        var committed = saved[prefix + week];
        check(committed.relayBindings[0].firebaseId === plan.id && committed.relayBindings[0].nativeId === committed.entries[0].id,
            'Firebase-ID, native Änderung und Quittung in einem Commit');
        check(committed.relayResults[0].revision === committed.revision, 'Quittung enthält tatsächliche Revision');
        tick();
        check(body().scheduleResults[0].state === 'applied' && body().moderatorResults[0].state === 'applied', 'Regulärer Folgepost quittiert');
        check(body().moderatorRevision === 1 && !body().teamUpdates, 'Nur Teamrevision ohne Nicks');
        check(JSON.stringify(body()).indexOf('nativeId') === -1, 'Native IDs bleiben intern');
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(runtime.readScheduleWeek(week).revision === 1 && runtime.state.radioModeratorRevision === 1, 'Wiederholung ohne zweite Änderung');
        runtime.stopAndroidPublisher(); channelTextTasks = {}; runtime = create();
        answer({ scheduleCommands: [plan], moderatorCommands: [team] });
        check(runtime.readScheduleWeek(week).revision === 1 && runtime.state.radioModeratorRevision === 1, 'Neustart erhält Wiederholungsschutz');
        tick();
        var edit = copy(plan); edit.commandId = 'edit'; edit.expectedRevision = 1; edit.entry.topic = 'Neu';
        var noop = copy(team); noop.commandId = 'already-added'; noop.expectedRevision = 1;
        answer({ scheduleCommands: [edit], moderatorCommands: [noop] });
        check(runtime.readScheduleWeek(week).entries.length === 1 && runtime.readScheduleWeek(week).entries[0].topic === 'Neu', 'Stabile String-ID ändert dasselbe native Ziel');
        check(runtime.state.radioModeratorRevision === 1, 'Erfülltes Team ohne Fachrevisionssprung');
        tick();
        var remove = copy(plan); remove.commandId = 'delete'; remove.expectedRevision = 2; remove.operation = 'delete'; remove.entry = null;
        answer({ scheduleCommands: [remove] });
        check(runtime.readScheduleWeek(week).entries.length === 0 && runtime.readScheduleWeek(week).relayBindings[0].deleted, 'Löschen hält dauerhaften Marker atomar');
        tick(); remove.commandId = 'delete-again'; remove.expectedRevision = 3;
        answer({ scheduleCommands: [remove] });
        check(runtime.readScheduleWeek(week).revision === 3, 'Wiederholte Löschung ohne Revisionserhöhung');
        tick(); var revive = copy(plan); revive.commandId = 'revive'; revive.expectedRevision = 3;
        answer({ scheduleCommands: [revive] }); tick();
        check(body().scheduleResults[0].reason === 'business_rule', 'Löschmarker verhindert Umbelegung');
        var stale = copy(remove); stale.commandId = 'stale'; stale.expectedRevision = 0;
        answer({ scheduleCommands: [stale] }); tick();
        check(body().scheduleResults[0].reason === 'revision_conflict' && body().scheduleResults[0].revision === 3, 'Nur echter Konflikt als Konflikt quittiert');
        var invalid = copy(remove); invalid.commandId = 'missing-revision'; delete invalid.expectedRevision;
        answer({ scheduleCommands: [invalid] }); tick();
        check(body().scheduleResults[0].reason === 'validation', 'Fehlende Revision ist Validierung');
        fail = true; var failed = copy(remove); failed.commandId = 'storage'; failed.id = 'unknown';
        answer({ scheduleCommands: [failed] }); fail = false;
        check(runtime.readScheduleWeek(week).relayBindings.length === 1, 'Speicherfehler verändert keine Marker');
        var failure = runtime.androidLastFailure();
        check(failure.stage === 'command_storage' && failure.httpStatus === null && /Z$/.test(failure.atUtc), 'Neutrale private Fehlerstufe mit UTC');
        tick(); var call = calls[calls.length - 1];
        call.params.onSuccess(new java.lang.String('{invalid'), {
            getResponseCode: function () { return new java.lang.Integer(200); }, getURLString: function () { return new java.lang.String(url); }
        });
        check(runtime.androidLastFailure().stage === 'response_json' && runtime.androidLastFailure().httpStatus === 200, 'Java-HTTP-JSON-Fehler bleibt präzise diagnostiziert');
    } finally {
        if (runtime) { runtime.stopAndroidPublisher(); }
        KnuddelsServer.getPersistence = persistenceBefore; KnuddelsServer.getExternalServerAccess = externalBefore;
        KnuddelsServer.getUserAccess = accessBefore; channelTextTasks = {};
    }
}());

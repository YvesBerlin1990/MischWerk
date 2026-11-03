/* Zentraler Backend-Start: Module laden, Abhängigkeiten verbinden, Knuddels-Hooks zuordnen. */
var MischWerkModules = {};
KnuddelsServer.execute('server/config.js');
KnuddelsServer.execute('server/core/runtime.js');
KnuddelsServer.execute('server/core/diagnostics.js');
KnuddelsServer.execute('server/users/identity.js');
KnuddelsServer.execute('server/core/validation.js');
KnuddelsServer.execute('server/state/persistence.js');
KnuddelsServer.execute('server/radio/station.js');
KnuddelsServer.execute('server/radio/team.js');
KnuddelsServer.execute('server/radio/moderation.js');
KnuddelsServer.execute('server/radio/announcements.js');
KnuddelsServer.execute('server/radio/handover.js');
KnuddelsServer.execute('server/state/initialization.js');
KnuddelsServer.execute('server/radio/show.js');
KnuddelsServer.execute('server/radio/curtain.js');
KnuddelsServer.execute('server/wishes/queue.js');
KnuddelsServer.execute('server/wishes/transport.js');
KnuddelsServer.execute('server/schedule/calendar.js');
KnuddelsServer.execute('server/schedule/storage.js');
KnuddelsServer.execute('server/schedule/programme.js');
KnuddelsServer.execute('server/schedule/transport.js');
KnuddelsServer.execute('server/radio/assistant.js');
KnuddelsServer.execute('server/ui/snapshot.js');
KnuddelsServer.execute('server/transport/views.js');
KnuddelsServer.execute('server/ui/sessions.js');
KnuddelsServer.execute('server/ui/wish-surface.js');
KnuddelsServer.execute('server/ui/navigation.js');
KnuddelsServer.execute('server/ui/overlays.js');
KnuddelsServer.execute('server/maintenance.js');
KnuddelsServer.execute('server/lifecycle.js');
KnuddelsServer.execute('server/transport/events.js');

/* Verdrahtung der Fachmodule und Zuordnung der Knuddels-Hooks. */
MischWerkModules.createApp = function (config) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachDiagnostics(runtime, config);
    MischWerkModules.attachIdentity(runtime, config);
    MischWerkModules.attachValidation(runtime, config);
    MischWerkModules.attachPersistence(runtime, config);
    MischWerkModules.attachStation(runtime, config);
    MischWerkModules.attachRadioTeam(runtime, config);
    MischWerkModules.attachModeration(runtime, config);
    MischWerkModules.attachStudioAnnouncements(runtime);
    MischWerkModules.attachHandover(runtime);
    MischWerkModules.attachStateInitialization(runtime, config);
    MischWerkModules.attachShow(runtime, config);
    MischWerkModules.attachCurtain(runtime, config);
    MischWerkModules.attachWishQueue(runtime, config);
    MischWerkModules.attachWishTransport(runtime, config);
    MischWerkModules.attachScheduleCalendar(runtime);
    MischWerkModules.attachScheduleStorage(runtime);
    MischWerkModules.attachScheduleProgramme(runtime);
    MischWerkModules.attachScheduleTransport(runtime);
    MischWerkModules.attachStudioAssistant(runtime);
    MischWerkModules.attachSnapshot(runtime, config);
    MischWerkModules.attachViewTransport(runtime, config);
    MischWerkModules.attachSessions(runtime, config);
    MischWerkModules.attachWishSurface(runtime);
    MischWerkModules.attachNavigation(runtime);
    MischWerkModules.attachOverlays(runtime);
    MischWerkModules.attachMaintenance(runtime, config);
    MischWerkModules.attachLifecycle(runtime, config);
    MischWerkModules.attachEvents(runtime, config);
    return {
        onAppStart: runtime.start,
        onUserJoined: runtime.userJoined,
        onPrepareShutdown: runtime.prepareShutdown,
        onUserLeft: runtime.userLeft,
        onUserDeleted: runtime.userDeleted,
        onEventReceived: runtime.handleEvent,
        chatCommands: { mischwerk: runtime.open, update: runtime.requestUpdate }
    };
};

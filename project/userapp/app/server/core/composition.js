/* Verdrahtung der Fachmodule und Zuordnung der Knuddels-Hooks. */
MischWerkModules.createApp = function (config, androidWire) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachHttpBudget(runtime);
    MischWerkModules.attachDiagnostics(runtime, config);
    MischWerkModules.attachChanges(runtime);
    MischWerkModules.attachIdentity(runtime, config);
    MischWerkModules.attachValidation(runtime, config);
    MischWerkModules.attachPersistence(runtime, config);
    MischWerkModules.attachStation(runtime, config);
    MischWerkModules.attachRadioTeam(runtime, config);
    MischWerkModules.attachModeration(runtime, config);
    MischWerkModules.attachStudioAnnouncements(runtime);
    MischWerkModules.attachTicker(runtime);
    MischWerkModules.attachDisplaySettings(runtime);
    MischWerkModules.attachUserGreetings(runtime);
    MischWerkModules.attachChannelTextFormat(runtime);
    MischWerkModules.attachChannelTextStorage(runtime);
    MischWerkModules.attachChannelTextSmileys(runtime);
    MischWerkModules.attachChannelTextScheduler(runtime);
    MischWerkModules.attachChannelTextTransport(runtime);
    MischWerkModules.attachStateInitialization(runtime, config);
    MischWerkModules.attachWishExportState(runtime);
    MischWerkModules.attachWishControlState(runtime);
    MischWerkModules.attachWishStorage(runtime);
    MischWerkModules.attachWishQueue(runtime, config);
    MischWerkModules.attachWishTransport(runtime, config);
    MischWerkModules.attachScheduleCalendar(runtime);
    MischWerkModules.attachScheduleStorage(runtime);
    MischWerkModules.attachPublicScheduleData(runtime);
    MischWerkModules.attachPublicSchedule(runtime);
    MischWerkModules.attachScheduleDay(runtime);
    MischWerkModules.attachScheduleTransport(runtime);
    MischWerkModules.attachSnapshot(runtime);
    MischWerkModules.attachSessionState(runtime);
    MischWerkModules.attachViewTransport(runtime, config);
    MischWerkModules.attachContent(runtime);
    MischWerkModules.attachSessions(runtime, config);
    MischWerkModules.attachNicklistStorage(runtime);
    MischWerkModules.attachNicklist(runtime);
    MischWerkModules.attachWishSurface(runtime);
    MischWerkModules.attachOverlays(runtime);
    MischWerkModules.attachAdministration(runtime);
    MischWerkModules.attachMaintenance(runtime, config);
    MischWerkModules.attachChannelTextSettings(runtime);
    MischWerkModules.attachAndroidSigning(runtime);
    MischWerkModules.attachReceivedBroadcast(runtime);
    MischWerkModules.attachNativeWishState(runtime);
    MischWerkModules.attachNativeWishPositions(runtime);
    MischWerkModules.attachNativeTransport(runtime);
    MischWerkModules.attachAndroidFailures(runtime);
    MischWerkModules.attachAndroidConnection(runtime);
    MischWerkModules.attachAndroidSettingsAccess(runtime);
    MischWerkModules.attachAndroidSettings(runtime, config);
    MischWerkModules.attachAndroidIncoming(runtime);
    MischWerkModules.attachAndroidPublisher(runtime);
    MischWerkModules.attachAndroidRelay(runtime, androidWire);
    MischWerkModules.attachAndroidOperation(runtime, config);
    MischWerkModules.attachLifecycle(runtime, config);
    runtime.observeChanges(function(kind) { if (kind === 'station') { runtime.broadcast(); } });
    MischWerkModules.attachEvents(runtime, config);
    MischWerkModules.attachChatCommands(runtime);
    return {
        onAppStart: runtime.start,
        onUserJoined: runtime.userJoined,
        onPrepareShutdown: runtime.prepareShutdown,
        onShutdown: runtime.shutdown,
        onUserLeft: runtime.userLeft,
        onUserDeleted: runtime.userDeleted,
        onEventReceived: runtime.handleEvent,
        onPrivateMessage: runtime.receiveChannelSmiley,
        chatCommands: { mw: runtime.chatCommand, update: runtime.requestUpdate, settopic: runtime.setTopicCommand }
    };
};

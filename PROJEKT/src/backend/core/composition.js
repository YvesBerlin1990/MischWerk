/* Verdrahtung der Fachmodule und Zuordnung der Knuddels-Hooks. */
MischWerkModules.createApp = function (config, androidWire) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachDiagnostics(runtime, config);
    MischWerkModules.attachChanges(runtime);
    MischWerkModules.attachRelayResults(runtime);
    MischWerkModules.attachIdentity(runtime, config);
    MischWerkModules.attachValidation(runtime, config);
    MischWerkModules.attachPersistence(runtime, config);
    MischWerkModules.attachStation(runtime, config);
    MischWerkModules.attachRadioTeam(runtime, config);
    MischWerkModules.attachPinConstants1(runtime);
    MischWerkModules.attachPinConstants2(runtime);
    MischWerkModules.attachPinBcrypt(runtime);
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
    MischWerkModules.attachNativeMigration(runtime);
    MischWerkModules.attachMigrationTransport(runtime);
    MischWerkModules.attachWishQueue(runtime, config);
    MischWerkModules.attachWishTransport(runtime, config);
    MischWerkModules.attachScheduleCalendar(runtime);
    MischWerkModules.attachScheduleStorage(runtime);
    MischWerkModules.attachScheduleProgramme(runtime, config);
    MischWerkModules.attachScheduleCommands(runtime, config);
    MischWerkModules.attachScheduleRelay(runtime);
    MischWerkModules.attachScheduleOverview(runtime);
    MischWerkModules.attachPublicScheduleData(runtime);
    MischWerkModules.attachPublicSchedule(runtime);
    MischWerkModules.attachScheduleDay(runtime);
    MischWerkModules.attachScheduleTransport(runtime);
    MischWerkModules.attachSnapshot(runtime, config);
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
    MischWerkModules.attachWebsitePublic(runtime, config);
    MischWerkModules.attachWebsiteTransport(runtime);
    MischWerkModules.attachAndroidSigning(runtime);
    MischWerkModules.attachReceivedBroadcast(runtime);
    MischWerkModules.attachNativeWishState(runtime);
    MischWerkModules.attachNativeWishPositions(runtime);
    MischWerkModules.attachNativeTransport(runtime);
    MischWerkModules.attachAndroidFailures(runtime);
    MischWerkModules.attachAndroidConnection(runtime);
    MischWerkModules.attachAndroidDiagnostics(runtime, config);
    MischWerkModules.attachAndroidSettingsAccess(runtime);
    MischWerkModules.attachAndroidSettings(runtime, config);
    MischWerkModules.attachAndroidIncoming(runtime);
    MischWerkModules.attachAndroidPublisher(runtime);
    MischWerkModules.attachAndroidVerification(runtime, config);
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

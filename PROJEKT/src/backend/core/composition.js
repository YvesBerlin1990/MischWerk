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
    MischWerkModules.attachPinWork(runtime);
    MischWerkModules.attachModerationPin(runtime);
    MischWerkModules.attachModeration(runtime, config);
    MischWerkModules.attachStudioAnnouncements(runtime);
    MischWerkModules.attachTicker(runtime);
    MischWerkModules.attachTickerCommand(runtime);
    MischWerkModules.attachUserGreetings(runtime);
    MischWerkModules.attachChannelTextFormat(runtime);
    MischWerkModules.attachChannelTextStorage(runtime);
    MischWerkModules.attachChannelTextSmileys(runtime);
    MischWerkModules.attachChannelTextScheduler(runtime);
    MischWerkModules.attachChannelTextTransport(runtime);
    MischWerkModules.attachHandover(runtime);
    MischWerkModules.attachStateInitialization(runtime, config);
    MischWerkModules.attachShow(runtime, config);
    MischWerkModules.attachWishExportState(runtime);
    MischWerkModules.attachWishControlState(runtime);
    MischWerkModules.attachWishStorage(runtime);
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
    MischWerkModules.attachScheduleBroadcasts(runtime);
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
    MischWerkModules.attachWebsiteWishes(runtime);
    MischWerkModules.attachWebsiteAccess(runtime);
    MischWerkModules.attachWebsitePublic(runtime, config);
    MischWerkModules.attachWebsiteCommands(runtime);
    MischWerkModules.attachWebsiteTransport(runtime);
    MischWerkModules.attachAndroidSigning(runtime);
    MischWerkModules.attachAndroidFailures(runtime);
    MischWerkModules.attachAndroidConnection(runtime);
    MischWerkModules.attachAndroidDiagnostics(runtime, config);
    MischWerkModules.attachAndroidSettingsAccess(runtime);
    MischWerkModules.attachAndroidSettings(runtime, config);
    MischWerkModules.attachAndroidReceipts(runtime);
    MischWerkModules.attachAndroidIncoming(runtime);
    MischWerkModules.attachAndroidStudioWishes(runtime);
    MischWerkModules.attachStudioWishControl(runtime);
    MischWerkModules.attachStudioWishCommands(runtime);
    MischWerkModules.attachRelayProjection(runtime);
    MischWerkModules.attachRelayCommands(runtime);
    MischWerkModules.attachAndroidPublisher(runtime);
    MischWerkModules.attachAndroidVerification(runtime, config);
    MischWerkModules.attachAndroidRelay(runtime, androidWire);
    MischWerkModules.attachAndroidOperation(runtime, config);
    MischWerkModules.attachLifecycle(runtime, config);
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
        chatCommands: { mw: runtime.chatCommand, update: runtime.requestUpdate,
            lauftext: runtime.tickerCommand, settopic: runtime.setTopicCommand }
    };
};

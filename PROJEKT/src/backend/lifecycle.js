/* Start, Channelwechsel, Nutzerloeschung und Shutdown. */
MischWerkModules.attachLifecycle = function (runtime, config) {
    'use strict';
    runtime.shuttingDown = false;

    runtime.start = function () {
        runtime.load();
        runtime.loadWishes();
        runtime.initializeUserGreetings();
        runtime.startChannelTexts();
        runtime.startWebsite();
        runtime.startAndroidRelay();
        try { runtime.refreshUiCache(); }
        catch (error) { runtime.warn('APP_UI_CACHE', error); }
        KnuddelsServer.getDefaultLogger().info('MischWerk ' + config.version + ' (Build ' + config.buildNumber + '): Radioleiste mit Channel-Overlays für Moderation, Verwaltung, Wunschbox und Sendeplan gestartet. ' +
            (runtime.station().configured ? 'STREAMPANEL ist konfiguriert.' : 'STREAMPANEL-Hörerstream ist noch nicht konfiguriert.'));
        KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
            try { runtime.open(user, true); } catch (error) { runtime.warn(); }
        });
    };

    runtime.userJoined = function (user) {
        try { runtime.open(user, true); } catch (error) { runtime.warn(); }
        runtime.greetUser(user);
    };

    runtime.prepareShutdown = function () {
        runtime.shuttingDown = true;
        runtime.clearUserGreetings();
        runtime.clearAndroidSettings();
        runtime.stopAndroidRelay();
        runtime.clearWebsiteLogins();
        runtime.stopChannelTexts();
        runtime.broadcast();
    };

    runtime.shutdown = function () {
        runtime.shuttingDown = true;
        runtime.clearUserGreetings();
        runtime.clearAndroidSettings();
        runtime.stopAndroidRelay();
        runtime.stopChannelTexts();
    };

    runtime.userLeft = function (user) {
        var changed = false;
        try {
            var userId = runtime.userId(user);
            runtime.forgetUserGreeting(userId);
            runtime.clearAndroidSettings(userId);
            runtime.load();
            runtime.dropWebsiteUser(userId);
            if (runtime.state.moderator && runtime.state.moderator.userId === userId) {
                runtime.invalidateModerator();
                changed = true;
                var next = runtime.copy(runtime.state);
                next.moderator = null;
                runtime.persist(next);
            }
        } catch (error) { runtime.warn(); }
        changed = runtime.dropHandoverForUser(userId) || changed;
        runtime.removeUserViews(userId);
        if (changed) { runtime.broadcast(); }
    };

    runtime.userDeleted = function (userId) {
        runtime.forgetUserGreeting(userId);
        runtime.clearAndroidSettings(runtime.numericUserId(userId));
        runtime.load();
        runtime.loadWishes();
        try { runtime.removeWishesForUser(userId); }
        catch (error) { runtime.warn('WISH_PURGE', error); }
        userId = runtime.numericUserId(userId);
        runtime.dropWebsiteUser(userId);
        runtime.dropHandoverForUser(userId, true);
        var next = runtime.copy(runtime.state);
        if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
        if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
            next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
            next.radioModeratorRevision += 1;
        }
        runtime.persist(next, null, userId);
        try { runtime.removeScheduleUser(userId); }
        catch (error) { runtime.warn('SCHEDULE_PURGE', error); }
        if (runtime.state.scheduleSync) {
            var scrubbed = runtime.copy(runtime.state), pending = scrubbed.scheduleSync;
            if (pending.previous && pending.previous.userId === userId) { pending.previous = null; pending.previousTopic = ''; }
            if (pending.current && pending.current.userId === userId) { pending.current = null; pending.topic = ''; }
            if (!pending.previous && !pending.current) { delete scrubbed.scheduleSync; }
            runtime.persist(scrubbed);
        }
        runtime.broadcast();
    };
};

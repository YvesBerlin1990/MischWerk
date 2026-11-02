/* Start, Channelwechsel, Nutzerloeschung und Shutdown. */
MischWerkModules.attachLifecycle = function (runtime, config) {
    'use strict';
    runtime.shuttingDown = false;

    runtime.start = function () {
        runtime.load();
        runtime.loadWishes();
        try { runtime.refreshUiCache(); }
        catch (error) { runtime.warn('APP_UI_CACHE', error); }
        KnuddelsServer.getDefaultLogger().info('MischWerk ' + config.version + ': Radioleiste mit Wunschbox-, Radio-Team- und Moderations-Popups gestartet. ' +
            (runtime.station().configured ? 'RadioKing ist konfiguriert.' : 'RadioKing-Hörerstream ist noch nicht konfiguriert.'));
        KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
            try { runtime.open(user, true); } catch (error) { runtime.warn(); }
        });
    };

    runtime.userJoined = function (user) {
        try { runtime.open(user, true); } catch (error) { runtime.warn(); }
    };

    runtime.prepareShutdown = function () {
        runtime.shuttingDown = true;
        runtime.broadcast();
    };

    runtime.userLeft = function (user) {
        var changed = false;
        try {
            runtime.load();
            var userId = runtime.userId(user);
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
        runtime.load();
        runtime.loadWishes();
        runtime.removeWishesForUser(userId);
        userId = runtime.numericUserId(userId);
        runtime.dropHandoverForUser(userId);
        var next = runtime.copy(runtime.state);
        if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
        if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
            next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
            next.radioModeratorRevision += 1;
        }
        runtime.persist(next);
        try { runtime.removeScheduleUser(userId); }
        catch (error) { runtime.warn('SCHEDULE_PURGE', error); }
        runtime.broadcast();
    };
};

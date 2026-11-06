/* Studio-Anmeldung ohne Zeitlimit, Abmeldung und Übergabe. */
MischWerkModules.attachModeration = function (runtime, config) {
    'use strict';
    var inactiveModeratorKey = null;
    function newModerator(user) {
        return { userId: runtime.userId(user), nick: runtime.nick(user), since: runtime.now(),
            sessionKey: String(runtime.now()) + '-' + String(runtime.state.revision + 1) };
    }
    runtime.invalidateModerator = function () { inactiveModeratorKey = runtime.moderatorKey(); };

    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };

    runtime.moderatorIsActive = function () {
        var moderator = runtime.state.moderator;
        if (!moderator || runtime.moderatorKey() === inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return runtime.userId(user) === runtime.state.moderator.userId && runtime.isModerator(user);
        });
    };

    runtime.prune = function () {
        if (!runtime.state.moderator) { return false; }
        if (!runtime.moderatorIsActive()) {
            runtime.invalidateModerator();
            var next = runtime.copy(runtime.state);
            next.moderator = null;
            runtime.persist(next);
            return true;
        }
        if (Object.prototype.hasOwnProperty.call(runtime.state.moderator, 'expiresAt') ||
                Object.prototype.hasOwnProperty.call(runtime.state.moderator, 'openEnd')) {
            var cleaned = runtime.copy(runtime.state);
            delete cleaned.moderator.expiresAt; delete cleaned.moderator.openEnd;
            runtime.persist(cleaned);
        }
        return false;
    };
    runtime.changeModeration = function (user, type, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        if (type !== 'mw:onAir' && type !== 'mw:offAir') { throw runtime.failure('Unbekannte Aktion.'); }
        var userId = runtime.userId(user);
        if (data.expectedModerator !== undefined && data.expectedModerator !== runtime.moderatorKey()) {
            throw runtime.failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        if (type === 'mw:onAir') {
            if (next.moderator && next.moderator.userId !== userId) {
                throw runtime.failure('Bitte die Sendung über eine bestätigte Übergabe übernehmen.');
            }
            if (next.moderator) { return; }
            next.moderator = newModerator(user);
        } else {
            if (!next.moderator) { throw runtime.failure('Niemand ist als Moderation angemeldet.'); }
            if (next.moderator.userId !== userId && !user.isChannelOwner()) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
            next.topic = '';
        }
        runtime.persist(next);
    };
    runtime.transferModeration = function (user, expectedModerator, topic) {
        if (!runtime.isModerator(user) || !runtime.moderatorIsActive() ||
                expectedModerator !== runtime.moderatorKey() || runtime.state.moderator.userId === runtime.userId(user)) {
            throw runtime.failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        next.moderator = newModerator(user);
        next.topic = runtime.text(topic, 80, false);
        runtime.persist(next);
    };
};

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
        if (!moderator || runtime.shuttingDown || runtime.moderatorKey() === inactiveModeratorKey ||
                (moderator.authentication !== 'knuddels' && !runtime.moderationPinProof(moderator.userId, moderator.pinProof))) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return runtime.userId(user) === runtime.state.moderator.userId && runtime.isModerator(user);
        });
    };

    runtime.canUseModeration = function (user) {
        return runtime.isModerator(user) && runtime.moderatorIsActive() && runtime.state.moderator.userId === runtime.userId(user);
    };
    runtime.requestsAvailable = function (user) {
        if (!runtime.state.requestsEnabled || runtime.shuttingDown) { return false; }
        if (runtime.moderatorIsActive()) { return true; }
        return !!user && runtime.canAdminister(user) && runtime.userId(user) === runtime.state.requestsOwnerId;
    };
    runtime.prune = function () {
        if (!runtime.state.moderator) { return false; }
        if (!runtime.moderatorIsActive()) {
            runtime.invalidateModerator();
            var next = runtime.copy(runtime.state);
            next.moderator = null;
            next.requestsEnabled = false;
            delete next.requestsOwnerId;
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
    runtime.changeModeration = function (user, type, data, nativeSession) {
        if (nativeSession && !runtime.activeSession(user, nativeSession)) { throw runtime.failure('Bitte das Moderationsmenü erneut öffnen.'); }
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
            // Nur eine tatsächliche native Sitzung ersetzt die zusätzliche Website-PIN.
            var proof = nativeSession ? null : runtime.prepareModerationPin(user, data, next);
            if (next.moderator) { return; }
            next.moderator = newModerator(user);
            if (nativeSession) { next.moderator.authentication = 'knuddels'; }
            else { next.moderator.pinProof = proof; }
            next.requestsEnabled = true;
            delete next.requestsOwnerId;
        } else {
            if (!next.moderator) { throw runtime.failure('Niemand ist als Moderation angemeldet.'); }
            if (next.moderator.userId !== userId && !runtime.canAdminister(user)) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
            next.topic = '';
            next.requestsEnabled = false;
            delete next.requestsOwnerId;
        }
        runtime.persist(next);
    };
    runtime.transferModeration = function (user, expectedModerator, topic, data, nativeSession) {
        if (nativeSession && !runtime.activeSession(user, nativeSession)) { throw runtime.failure('Bitte das Moderationsmenü erneut öffnen.'); }
        if (!runtime.isModerator(user) || !runtime.moderatorIsActive() ||
                expectedModerator !== runtime.moderatorKey() || runtime.state.moderator.userId === runtime.userId(user)) {
            throw runtime.failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        var proof = nativeSession ? null : runtime.prepareModerationPin(user, data || {}, next);
        next.moderator = newModerator(user);
        if (nativeSession) { next.moderator.authentication = 'knuddels'; }
        else { next.moderator.pinProof = proof; }
        next.requestsEnabled = true;
        delete next.requestsOwnerId;
        next.topic = runtime.text(topic, 80, false);
        runtime.persist(next);
    };
};

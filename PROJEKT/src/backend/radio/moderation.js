/* Studio-Anmeldung, Ablauf und Abmeldung. */
MischWerkModules.attachModeration = function (runtime, config) {
    'use strict';
    var inactiveModeratorKey = null;
    function newModerator(user) {
        return { userId: runtime.userId(user), nick: runtime.nick(user), since: runtime.now(),
            sessionKey: String(runtime.now()) + '-' + String(runtime.state.revision + 1),
            expiresAt: runtime.now() + config.moderatorSessionHours * 3600000 };
    }
    function setEnd(moderator, data) {
        if (data.endMode === 'openEnd') {
            moderator.expiresAt = null;
            moderator.openEnd = true;
            return 'Open End gespeichert. Deine Anmeldung gilt bis zur Abmeldung.';
        }
        if (data.endMode !== 'fixed' || typeof data.endLocal !== 'string' ||
                !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(data.endLocal)) {
            throw runtime.failure('Bitte ein gültiges Ende oder Open End auswählen.');
        }
        var date = data.endLocal.slice(0, 10), time = data.endLocal.slice(11);
        var until = runtime.scheduleTimestamp(date, time, true);
        if (until <= runtime.now()) { throw runtime.failure('Die Endzeit muss in der Zukunft liegen.'); }
        moderator.expiresAt = until;
        delete moderator.openEnd;
        return 'Endzeit auf ' + date.slice(8) + '.' + date.slice(5, 7) + '.' + date.slice(0, 4) +
            ' um ' + time + ' Uhr gespeichert.';
    }

    runtime.invalidateModerator = function () { inactiveModeratorKey = runtime.moderatorKey(); };

    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };

    runtime.moderatorIsActive = function () {
        var moderator = runtime.state.moderator;
        var openEnd = moderator && moderator.openEnd === true && moderator.expiresAt === null;
        var timed = moderator && typeof moderator.expiresAt === 'number' && isFinite(moderator.expiresAt) &&
            moderator.expiresAt > runtime.now();
        if (!moderator || (!openEnd && !timed) ||
                runtime.moderatorKey() === inactiveModeratorKey) { return false; }
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
        var message = null;
        if (type === 'mw:onAir') {
            if (next.moderator && next.moderator.userId !== userId) {
                throw runtime.failure('Bitte die Sendung über eine bestätigte Übergabe übernehmen.');
            }
            next.moderator = newModerator(user);
            if (runtime.state.moderator) { next.moderator.since = runtime.state.moderator.since; }
            if (data.endMode !== undefined) {
                if (!runtime.state.moderator || typeof data.expectedModerator !== 'string' || !runtime.moderatorIsActive()) {
                    throw runtime.failure('Nur eine aktive eigene Anmeldung kann eine neue Endzeit erhalten.');
                }
                message = setEnd(next.moderator, data);
            } else if (runtime.state.moderator) {
                if (runtime.state.moderator.openEnd === true) {
                    next.moderator.openEnd = true;
                    next.moderator.expiresAt = null;
                } else { next.moderator.expiresAt = Math.max(next.moderator.expiresAt, runtime.state.moderator.expiresAt); }
            }
        } else {
            if (!next.moderator) { throw runtime.failure('Niemand ist als Moderation angemeldet.'); }
            if (next.moderator.userId !== userId && !user.isChannelOwner()) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
            next.topic = '';
        }
        runtime.persist(next);
        return message;
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

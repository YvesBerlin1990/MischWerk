/* Validierung und atomare Fachaktionen für Wünsche, Thema und Moderation. */
MischWerkModules.attachActions = function (runtime, config) {
    'use strict';

    runtime.text = function (value, max, required) {
        if (typeof value !== 'string') { throw runtime.failure('Bitte gültigen Text eingeben.'); }
        var clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
        if ((required && !clean) || clean.length > max) {
            throw runtime.failure('Bitte die Eingabe prüfen (maximal ' + max + ' Zeichen).');
        }
        return clean;
    };
    runtime.containsWishLink = function (value) {
        var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
        try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
        if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/i.test(candidate)) { return true; }
        // Initialen in Namen wie will.i.am oder M.I.A. nicht mit einer Domain verwechseln.
        return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/i.test(candidate) ||
            /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/i.test(candidate);
    };
    runtime.manageRadioModerator = function (user, type, data) {
        if (!runtime.isChannelOwner(user)) {
            throw runtime.failure('Nur der Channelinhaber darf Radiomoderatoren verwalten.');
        }
        if (data.expectedRadioModeratorRevision !== undefined &&
                data.expectedRadioModeratorRevision !== runtime.state.radioModeratorRevision) {
            throw runtime.failure('Das Radio-Team wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        var userId;
        var nick;
        if (type === 'mw:addRadioModerator') {
            nick = runtime.text(data.nick, 50, true);
            var access = KnuddelsServer.getUserAccess();
            if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
            try { userId = runtime.numericUserId(access.getUserId(nick)); }
            catch (error) { throw runtime.failure('Dieser Knuddels-Nick konnte nicht aufgelöst werden.'); }
            if (userId === runtime.userId(user)) {
                throw runtime.failure('Der Channelinhaber ist bereits dauerhaft für das Studio berechtigt.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
                throw runtime.failure('Dieser Nutzer ist bereits Radiomoderator.');
            }
            if (next.radioModeratorUserIds.length >= 50) {
                throw runtime.failure('Es können höchstens 50 Radiomoderatoren ernannt werden.');
            }
            next.radioModeratorUserIds.push(userId);
            nick = String(access.getNick(userId));
        } else if (type === 'mw:removeRadioModerator') {
            userId = data.userId;
            if (typeof userId !== 'number' || !isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
                throw runtime.failure('Ungültiger Radiomoderator.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) === -1) {
                throw runtime.failure('Dieser Nutzer ist kein Radiomoderator mehr.');
            }
            next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
            if (next.moderator && next.moderator.userId === userId) {
                runtime.inactiveModeratorKey = runtime.moderatorKey();
                next.moderator = null;
            }
        } else { throw runtime.failure('Unbekannte Radio-Team-Aktion.'); }
        next.radioModeratorRevision = runtime.state.radioModeratorRevision + 1;
        runtime.persist(next);
        return nick;
    };
    runtime.addRequest = function (user, data) {
        var userId = runtime.userId(user);
        var key = 'u' + userId;
        // Historischer Feldname: nur Wiederholungs-Erkennung, keine Wartezeit oder Begrenzung.
        var previous = runtime.state.cooldowns[key];
        if (data.requestId && ((previous && previous.requestId === data.requestId) ||
                runtime.state.requests.some(function (item) { return item.userId === userId && item.requestId === data.requestId; }))) { return false; }
        if (runtime.shuttingDown || !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var timestamp = runtime.now();
        var wishText = data.text !== undefined ? runtime.text(data.text, 300, true) :
            runtime.text(data.artist, 80, true) + ' – ' + runtime.text(data.title, 80, true) +
                (data.message ? ' · ' + runtime.text(data.message, 200, false) : '');
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = {
            id: runtime.state.nextId,
            userId: userId,
            nick: runtime.nick(user),
            text: wishText,
            delivery: null,
            requestId: data.requestId || null,
            createdAt: timestamp
        };
        var next = runtime.copy(runtime.state);
        next.nextId += 1;
        next.requests.push(item);
        next.cooldowns[key] = { at: timestamp, requestId: data.requestId || null };
        runtime.persist(next, 'Dein Wunsch konnte nicht gespeichert werden. Bitte versuche es erneut.');
        return item;
    };
    runtime.acknowledgeRequest = function (user, data, session) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var userId = runtime.userId(user);
        var view = runtime.views.filter(function (item) {
            return item.userId === userId && item.content === session.getAppContent();
        })[0];
        if (!view || view.kind !== 'studio') { throw runtime.failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = runtime.state.requests[view.page * runtime.pageSize];
        if (!item || item.id !== data.id) { throw runtime.failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        if (item.delivery) { return false; }
        var next = runtime.copy(runtime.state);
        next.requests[view.page * runtime.pageSize].delivery = { userId: userId, nick: runtime.nick(user), at: runtime.now() };
        runtime.persist(next);
        return true;
    };
    runtime.moderate = function (user, type, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        var userId = runtime.userId(user);
        // Vergleich fachlicher Werte statt globaler Revision: Empfangsquittungen erzeugen keine falschen Konflikte.
        if ((type === 'mw:onAir' || type === 'mw:offAir') && data.expectedModerator !== undefined &&
                data.expectedModerator !== runtime.moderatorKey()) {
            throw runtime.failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        if (type === 'mw:setRequests') {
            if (typeof data.enabled !== 'boolean') { throw runtime.failure('Ungültiger Wunschbox-Status.'); }
            if (data.previousEnabled !== undefined && data.previousEnabled !== runtime.state.requestsEnabled) {
                throw runtime.failure('Der Wunschbox-Status wurde inzwischen geändert. Bitte erneut prüfen.');
            }
            next.requestsEnabled = data.enabled;
        } else if (type === 'mw:setTopic') {
            if (data.previousTopic !== undefined && data.previousTopic !== runtime.state.topic) {
                throw runtime.failure('Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.');
            }
            next.topic = runtime.text(data.topic, 80, false);
        } else if (type === 'mw:onAir') {
            next.moderator = { userId: userId, nick: runtime.nick(user), since: runtime.now(),
                sessionKey: String(runtime.now()) + '-' + String(runtime.state.revision + 1),
                expiresAt: runtime.now() + config.moderatorSessionHours * 3600000 };
        } else if (type === 'mw:offAir') {
            if (next.moderator && next.moderator.userId !== userId && !user.isChannelOwner()) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
        } else if (type === 'mw:resolveRequest') {
            if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') {
                throw runtime.failure('Ungültige Wunsch-Aktion.');
            }
            var found = next.requests.some(function (item) { return item.id === data.id; });
            if (!found) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
            next.requests = next.requests.filter(function (item) { return item.id !== data.id; });
        } else { throw runtime.failure('Unbekannte Aktion.'); }
        runtime.persist(next);
    };
};

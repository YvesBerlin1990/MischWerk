/* Persistenter Zustand, Rollenprüfung und ausschließlich freigegebene Snapshots. */
MischWerkModules.attachState = function (runtime, config) {
    'use strict';

    runtime.initialState = function () {
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, moderator: null, requests: [], cooldowns: {}, nextId: 1 };
    };
    runtime.persist = function (next) {
        next.revision = (runtime.state && runtime.state.revision || 0) + 1;
        if (runtime.jsonBytes(JSON.stringify(next)) > 90000) {
            throw runtime.failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.');
        }
        KnuddelsServer.getPersistence().setObject(runtime.key, next);
        runtime.state = next;
    };
    runtime.load = function () {
        if (runtime.state) { return; }
        var saved = KnuddelsServer.getPersistence().getObject(runtime.key, null);
        if (saved && (saved.version !== 1 || !Array.isArray(saved.requests) ||
                typeof saved.requestsEnabled !== 'boolean' || typeof saved.nextId !== 'number')) {
            throw new Error('Unbekanntes MischWerk-Datenformat. Persistenz vor Migration sichern.');
        }
        runtime.state = saved || runtime.initialState();
        runtime.state.topic = typeof runtime.state.topic === 'string' ? runtime.state.topic : '';
        runtime.state.cooldowns = runtime.state.cooldowns || {};
        runtime.state.revision = typeof runtime.state.revision === 'number' ? runtime.state.revision : 0;
        runtime.prune();
    };
    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };
    runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };
    runtime.isModerator = function (user) {
        return runtime.online(user) && (user.isChannelOwner() || user.isChannelModerator() ||
            config.radioModeratorUserIds.indexOf(user.getUserId()) !== -1);
    };
    runtime.moderatorIsActive = function () {
        if (!runtime.state.moderator || runtime.state.moderator.expiresAt <= runtime.now() ||
                runtime.moderatorKey() === runtime.inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return user.getUserId() === runtime.state.moderator.userId && runtime.isModerator(user);
        });
    };
    runtime.prune = function () {
        if (!runtime.state.moderator) { return false; }
        if (!runtime.moderatorIsActive()) {
            runtime.inactiveModeratorKey = runtime.moderatorKey();
            var next = runtime.copy(runtime.state);
            next.moderator = null;
            runtime.persist(next);
            return true;
        }
        return false;
    };
    runtime.station = function () {
        var settings = config.radioking || {};
        var id = typeof settings.radioId === 'string' ? settings.radioId.trim().toLowerCase() : '';
        if (id.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) { id = ''; }
        // URLs ausschließlich ableiten: kein Passwort, API-Schlüssel oder fremder Host im Event.
        var stream = id ? 'https://play.radioking.io/' + id : '';
        return { name: config.stationName, provider: 'radioking', radioId: id, configured: !!id,
            streamUrl: stream, stationUrl: stream,
            metadataUrl: id ? 'https://api.radioking.io/widget/radio/' + id + '/track/current' : '' };
    };
    runtime.requestText = function (item) {
        if (typeof item.text === 'string') { return item.text; }
        // Bereits gespeicherte Wünsche aus dem früheren Formular bleiben lesbar.
        return [item.artist, item.title].filter(function (part) { return !!part; }).join(' – ') +
            (item.message ? ' · ' + item.message : '');
    };
    runtime.requestView = function (item) {
        return { id: item.id, nick: item.nick, artist: item.artist, title: item.title,
            message: item.message, text: runtime.requestText(item), createdAt: item.createdAt,
            delivery: item.delivery ? { nick: item.delivery.nick, at: item.delivery.at } : null };
    };
    runtime.snapshot = function (user, page, myPage, feedbackId) {
        var mod = runtime.isModerator(user);
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var own = runtime.state.requests.filter(function (item) { return item.userId === user.getUserId(); });
        var totalPages = Math.max(1, Math.ceil(runtime.state.requests.length / runtime.pageSize));
        var ownPages = Math.max(1, Math.ceil(own.length / runtime.pageSize));
        myPage = Math.max(0, Math.min(ownPages - 1, Math.floor(Number(myPage) || 0)));
        var feedback = own.filter(function (item) { return item.id === feedbackId; })[0] || own[own.length - 1];
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: runtime.station(),
            topic: runtime.state.topic,
            revision: runtime.state.revision,
            user: { nick: user.getNick(), canModerate: mod,
                isOnAir: !!(mod && presenter && presenter.userId === user.getUserId()),
                canEndModeration: !!(mod && presenter && (presenter.userId === user.getUserId() || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: runtime.state.requestsEnabled && !runtime.shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, sessionKey: runtime.moderatorKey() } : null,
            myRequests: own.slice(myPage * runtime.pageSize, (myPage + 1) * runtime.pageSize).map(runtime.requestView),
            myTotal: own.length,
            myPage: myPage,
            myPages: ownPages,
            requestFeedback: feedback ? runtime.requestView(feedback) : null,
            queue: mod ? runtime.state.requests.slice(page * runtime.pageSize, (page + 1) * runtime.pageSize).map(runtime.requestView) : [],
            queueTotal: mod ? runtime.state.requests.length : 0,
            page: mod ? page : 0,
            pages: mod ? totalPages : 1,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

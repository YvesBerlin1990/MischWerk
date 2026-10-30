/* Persistenter Zustand, Rollenprüfung und ausschließlich freigegebene Snapshots. */
MischWerkModules.attachState = function (runtime, config) {
    'use strict';

    runtime.initialState = function () {
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, moderator: null, requests: [], cooldowns: {},
            nextId: 1, radioModeratorUserIds: config.radioModeratorUserIds.slice(0, 50), radioModeratorRevision: 0 };
    };
    runtime.compactCooldowns = function (state, maximum) {
        var source = state.cooldowns;
        if (!source || typeof source !== 'object' || Array.isArray(source)) { source = {}; }
        var entries = Object.keys(source).filter(function (key) {
            var entry = source[key];
            return /^u[1-9][0-9]*$/.test(key) && entry && typeof entry === 'object' && !Array.isArray(entry) &&
                typeof entry.at === 'number' && isFinite(entry.at) && entry.at >= 0 && entry.at <= runtime.now() + 300000 &&
                typeof entry.requestId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(entry.requestId);
        }).map(function (key) {
            return { key: key, at: source[key].at, requestId: source[key].requestId };
        }).sort(function (left, right) {
            return right.at - left.at || (left.key < right.key ? -1 : left.key === right.key ? 0 : 1);
        }).slice(0, maximum);
        state.cooldowns = {};
        entries.forEach(function (entry) {
            state.cooldowns[entry.key] = { at: entry.at, requestId: entry.requestId };
        });
    };
    runtime.persist = function (next, failureMessage) {
        try {
            next.revision = (runtime.state && runtime.state.revision || 0) + 1;
            runtime.compactCooldowns(next, runtime.maxReplayEntries);
            var serialized = JSON.stringify(next);
            if (runtime.jsonBytes(serialized) > 90000) {
                var smaller = runtime.copy(next);
                runtime.compactCooldowns(smaller, runtime.emergencyReplayEntries);
                if (runtime.jsonBytes(JSON.stringify(smaller)) > 90000) {
                    throw runtime.failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.');
                }
                next = smaller;
            }
        } catch (prepareError) {
            if (prepareError.publicMessage) { throw prepareError; }
            runtime.warn('PERSIST_PREPARE');
            throw runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht vorbereiten. Bitte versuche es erneut.');
        }
        try {
            KnuddelsServer.getPersistence().setObject(runtime.key, next);
        } catch (error) {
            // Bei knapper AppPersistence bleiben Wünsche erhalten; nur alte technische Wiederholungsmarker werden reduziert.
            var emergency = runtime.copy(next);
            runtime.compactCooldowns(emergency, runtime.emergencyReplayEntries);
            try {
                KnuddelsServer.getPersistence().setObject(runtime.key, emergency);
                next = emergency;
            } catch (retryError) {
                runtime.warn('PERSIST_WRITE');
                throw runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht speichern. Bitte versuche es erneut.');
            }
        }
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
        runtime.compactCooldowns(runtime.state, runtime.maxReplayEntries);
        runtime.state.revision = typeof runtime.state.revision === 'number' ? runtime.state.revision : 0;
        var configuredIds = Array.isArray(runtime.state.radioModeratorUserIds) ? runtime.state.radioModeratorUserIds :
            config.radioModeratorUserIds;
        runtime.state.radioModeratorUserIds = configuredIds.filter(function (userId, index, values) {
            return typeof userId === 'number' && isFinite(userId) && userId > 0 && Math.floor(userId) === userId &&
                values.indexOf(userId) === index;
        }).slice(0, 50);
        runtime.state.radioModeratorRevision = typeof runtime.state.radioModeratorRevision === 'number' ?
            runtime.state.radioModeratorRevision : 0;
        runtime.prune();
    };
    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };
    runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };
    runtime.isChannelOwner = function (user) { return runtime.online(user) && user.isChannelOwner(); };
    runtime.isModerator = function (user) {
        return runtime.online(user) && (user.isChannelOwner() ||
            runtime.state.radioModeratorUserIds.indexOf(runtime.userId(user)) !== -1);
    };
    runtime.moderatorIsActive = function () {
        if (!runtime.state.moderator || runtime.state.moderator.expiresAt <= runtime.now() ||
                runtime.moderatorKey() === runtime.inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return runtime.userId(user) === runtime.state.moderator.userId && runtime.isModerator(user);
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
    runtime.radioModeratorViews = function (user, page) {
        if (!runtime.isChannelOwner(user)) { return { items: [], total: 0, page: 0, pages: 1 }; }
        var access = KnuddelsServer.getUserAccess();
        var total = runtime.state.radioModeratorUserIds.length;
        var pages = Math.max(1, Math.ceil(total / runtime.radioModeratorPageSize));
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        var ids = runtime.state.radioModeratorUserIds.slice(page * runtime.radioModeratorPageSize,
            (page + 1) * runtime.radioModeratorPageSize);
        return { items: ids.map(function (userId) {
            var nick;
            try { nick = String(access.getNick(userId)); }
            catch (error) { nick = 'Unbekannter Nutzer #' + userId; }
            return { userId: userId, nick: nick };
        }), total: total, page: page, pages: pages };
    };
    runtime.snapshot = function (user, page, myPage, feedbackId, radioModeratorPage) {
        var mod = runtime.isModerator(user);
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var radioTeam = runtime.radioModeratorViews(user, radioModeratorPage);
        var currentUserId = runtime.userId(user);
        var requests = runtime.wishItems();
        var totalPages = Math.max(1, Math.ceil(requests.length / runtime.pageSize));
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: runtime.station(),
            topic: runtime.state.topic,
            revision: runtime.state.revision,
            user: { nick: runtime.nick(user), canModerate: mod,
                canManageRadioModerators: runtime.isChannelOwner(user),
                isOnAir: !!(mod && presenter && presenter.userId === currentUserId),
                canEndModeration: !!(mod && presenter && (presenter.userId === currentUserId || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: runtime.state.requestsEnabled && !runtime.shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, sessionKey: runtime.moderatorKey() } : null,
            myRequests: [],
            myTotal: 0,
            myPage: 0,
            myPages: 1,
            requestFeedback: null,
            queue: mod ? requests.slice(page * runtime.pageSize, (page + 1) * runtime.pageSize).map(runtime.requestView) : [],
            queueTotal: mod ? requests.length : 0,
            radioModerators: radioTeam.items,
            radioModeratorTotal: radioTeam.total,
            radioModeratorPage: radioTeam.page,
            radioModeratorPages: radioTeam.pages,
            radioModeratorRevision: runtime.state.radioModeratorRevision,
            page: mod ? page : 0,
            pages: mod ? totalPages : 1,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

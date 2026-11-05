/* Berechtigte Ansichtsmodelle fuer Hoerer und Studio. */
MischWerkModules.attachSnapshot = function (runtime, config) {
    'use strict';

    runtime.requestText = function (item) {
        if (typeof item.text === 'string') { return item.text; }
        // Bereits gespeicherte Wünsche aus dem früheren Formular bleiben lesbar.
        return [item.artist, item.title].filter(function (part) { return !!part; }).join(' – ') +
            (item.message ? ' · ' + item.message : '');
    };

    runtime.requestView = function (item) {
        return { id: item.id, nick: item.nick, artist: item.artist, title: item.title,
            message: item.message, text: runtime.requestText(item), createdAt: item.createdAt,
            delivery: item.delivery ? { nick: item.delivery.nick, at: item.delivery.at } : null,
            stage: item.stage || 'queued' };
    };

    runtime.snapshot = function (user, page, myPage, feedbackId, radioModeratorPage, kind) {
        var mod = runtime.isModerator(user);
        var showQueue = mod && kind !== 'team';
        var station = runtime.station();
        if (!mod) { delete station.historyUrl; delete station.historyIgnoredTitles; }
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var radioTeam = runtime.radioModeratorViews(user, radioModeratorPage);
        var currentUserId = runtime.userId(user);
        var requests = runtime.wishItems();
        var totalPages = Math.max(1, Math.ceil(requests.length / runtime.pageSize));
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: station,
            topic: runtime.state.topic,
            curtain: runtime.curtainState(user),
            revision: runtime.state.revision,
            user: { nick: runtime.nick(user), canModerate: mod,
                canManageRadioModerators: runtime.isChannelOwner(user),
                isOnAir: !!(mod && presenter && presenter.userId === currentUserId),
                canEndModeration: !!(mod && presenter && (presenter.userId === currentUserId || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: runtime.state.requestsEnabled && !runtime.shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, openEnd: presenter.openEnd === true, sessionKey: runtime.moderatorKey() } : null,
            handover: runtime.handoverSnapshot(user),
            myRequests: [],
            myTotal: 0,
            myPage: 0,
            myPages: 1,
            requestFeedback: null,
            wishPositions: runtime.wishPositions(user, myPage),
            queue: showQueue ? requests.slice(page * runtime.pageSize, (page + 1) * runtime.pageSize).map(runtime.requestView) : [],
            queueStart: showQueue ? Math.floor(page / 3) * 3 : 0,
            queueWindow: showQueue ? requests.slice(Math.floor(page / 3) * 3, Math.floor(page / 3) * 3 + 3).map(runtime.requestView) : [],
            queueTotal: showQueue ? requests.length : 0,
            radioModerators: radioTeam.items,
            radioModeratorTotal: radioTeam.total,
            radioModeratorPage: radioTeam.page,
            radioModeratorPages: radioTeam.pages,
            radioModeratorRevision: runtime.state.radioModeratorRevision,
            page: showQueue ? page : 0,
            pages: showQueue ? totalPages : 1,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

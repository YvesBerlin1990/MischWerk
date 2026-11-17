/* Native Ansichtsmodelle mit zentralem Senderstand und ausschließlich eigenen Wünschen. */
MischWerkModules.attachSnapshot = function(runtime, config) {
    'use strict';

    runtime.snapshot = function(user, page, myPage, feedbackId, radioModeratorPage, kind) {
        var station = runtime.station();
        var show = runtime.receivedShow();
        var presenter = show.active ? {
            nick: show.nick
        } : null;
        var radioTeam = runtime.radioModeratorViews(user, radioModeratorPage);
        return {
            station: station,
            topic: show.active ? show.topic : '',
            broadcastRemainingMs: show.remainingMs || 0,
            displaySettings: runtime.canUseAdministration(user) ? runtime.displaySettings() : null,
            migration: runtime.canUseAdministration(user) ? runtime.migrationView() : null,
            ticker: runtime.tickerState(),
            scheduleSyncPending: false,
            revision: runtime.state.revision,
            user: {
                nick: runtime.nick(user),
                canModerate: false,
                canUseModeration: false,
                canToggleRequests: false,
                showModerationButton: false,
                canManageRadioModerators: runtime.canUseAdministration(user),
                canAdminister: runtime.canUseAdministration(user),
                isOnAir: false,
                canEndModeration: false
            },
            limits: {
                maxTextLength: 300,
                maxTopicLength: 80
            },
            requestsEnabled: runtime.requestsAvailable(user),
            moderator: presenter,
            myRequests: [],
            myTotal: 0,
            myPage: 0,
            myPages: 1,
            requestFeedback: null,
            wishPositions: runtime.nativeWishPositions(user, myPage),
            queue: [],
            queueStart: 0,
            queueWindow: [],
            queueTotal: 0,
            radioModerators: radioTeam.items,
            radioModeratorsConfirmed: radioTeam.confirmed,
            radioModeratorsRemainingMs: radioTeam.remainingMs,
            radioModeratorTotal: radioTeam.total,
            radioModeratorPage: radioTeam.page,
            radioModeratorPages: radioTeam.pages,
            radioModeratorRevision: runtime.state.radioModeratorRevision,
            page: 0,
            pages: 1,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

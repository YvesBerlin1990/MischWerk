/* Native Ansichtsmodelle mit zentralem Senderstand und ausschließlich eigenen Wünschen. */
MischWerkModules.attachSnapshot = function(runtime) {
    'use strict';

    runtime.snapshot = function(user, myPage, radioModeratorPage) {
        var show = runtime.receivedShow();
        var radioTeam = runtime.radioModeratorViews(user, radioModeratorPage);
        return {
            station: runtime.station(),
            topic: show.active ? show.topic : '',
            broadcastRemainingMs: show.remainingMs || 0,
            displaySettings: runtime.canUseAdministration(user) ? runtime.displaySettings() : null,
            theme: runtime.displaySettings().theme,
            ticker: runtime.tickerState(),
            revision: runtime.state.revision,
            user: {
                nick: runtime.nick(user),
                canAdminister: runtime.canUseAdministration(user)
            },
            limits: {
                maxTextLength: 300
            },
            requestsEnabled: runtime.requestsAvailable(user),
            moderator: show.active ? { nick: show.nick } : null,
            wishPositions: runtime.nativeWishPositions(user, myPage),
            radioModerators: radioTeam.items,
            radioModeratorsConfirmed: radioTeam.confirmed,
            radioModeratorsRemainingMs: radioTeam.remainingMs,
            radioModeratorTotal: radioTeam.total,
            radioModeratorPage: radioTeam.page,
            radioModeratorPages: radioTeam.pages,
            radioModeratorRevision: runtime.state.radioModeratorRevision,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

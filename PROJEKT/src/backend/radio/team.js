/* Firebase führt Freigaben. Alte Ernennungen verleihen keine nativen Rechte. */
MischWerkModules.attachRadioTeam = function(runtime) {
    'use strict';
    runtime.radioModeratorViews = function(user, page) {
        var confirmed = runtime.canUseAdministration(user) && runtime.receivedRosterState().confirmed;
        var rows = confirmed && typeof runtime.receivedRoster === 'function' ? runtime
            .receivedRoster() : [];
        var pages = Math.max(1, Math.ceil(rows.length / runtime.radioModeratorPageSize));
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        return {
            items: rows.slice(page * runtime.radioModeratorPageSize, (page + 1) * runtime
                .radioModeratorPageSize).map(function(nick) {
                return {
                    nick: nick
                };
            }),
            confirmed: confirmed,
            remainingMs: confirmed ? runtime.receivedRosterState().remainingMs : 0,
            total: confirmed ? rows.length : null,
            page: page,
            pages: pages
        };
    };
};

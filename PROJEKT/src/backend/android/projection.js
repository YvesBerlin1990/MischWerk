/* Öffentliche Wochen-/Teamprojektionen im bestehenden Publisher, ohne Timer oder Persistenz. */
MischWerkModules.attachRelayProjection = function (runtime) {
    'use strict';
    var confirmed = {}, progress = {}, teamConfirmed = null;
    runtime.resetRelayProjection = function () { confirmed = {}; progress = {}; teamConfirmed = null; };
    runtime.prepareRelayProjection = function () {
        var batch = { body: {}, weeks: [], team: null }, pages = [];
        try {
            var current = runtime.scheduleWeek(runtime.scheduleToday());
            var weeks = runtime.scheduleWeeks().concat([current, runtime.scheduleDay(current, 7), runtime.scheduleDay(current, 14)])
                .filter(function (week, index, values) { return values.indexOf(week) === index; }).sort();
            weeks.forEach(function (week) {
                if (pages.length >= 4) { return; }
                var first = runtime.publicWebsitePlan(week, 0), all = [first];
                for (var page = 1; page < first.pages; page += 1) { all.push(runtime.publicWebsitePlan(week, page)); }
                var signature = JSON.stringify(all), key = '$' + week;
                if (confirmed[key] === signature) { return; }
                var state = progress[key];
                if (!state || state.signature !== signature) { state = { signature: signature, page: 0 }; progress[key] = state; }
                var end = Math.min(all.length, state.page + 4 - pages.length);
                pages = pages.concat(all.slice(state.page, end));
                batch.weeks.push({ key: key, signature: signature, start: state.page, end: end, pages: all.length });
            });
            if (pages.length) { batch.body.scheduleUpdates = pages; }
        } catch (scheduleError) { batch.weeks = []; runtime.warn('RELAY_SCHEDULE_PROJECTION'); }
        try {
            var access = KnuddelsServer.getUserAccess();
            var team = { revision: runtime.state.radioModeratorRevision, moderators: runtime.state.radioModeratorUserIds.map(function (id) {
                var nick = access.getNick(id);
                if (nick === null || nick === undefined) { throw new Error('RELAY_TEAM_NICK'); }
                return { nick: runtime.text(String(nick), 50, true) };
            }) };
            var signature = JSON.stringify(team);
            if (signature !== teamConfirmed) { batch.body.teamUpdates = team; batch.team = signature; }
        } catch (teamError) { runtime.warn('RELAY_TEAM_PROJECTION'); }
        return batch;
    };
    runtime.confirmRelayProjection = function (batch) {
        batch.weeks.forEach(function (item) {
            var state = progress[item.key];
            if (!state || state.signature !== item.signature || state.page !== item.start) { return; }
            state.page = item.end;
            if (item.end === item.pages) { confirmed[item.key] = item.signature; delete progress[item.key]; }
        });
        if (batch.team !== null) { teamConfirmed = batch.team; }
    };
};

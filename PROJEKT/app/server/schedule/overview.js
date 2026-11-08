/* Rollende Hörerübersicht aus den bestehenden Wochenadaptern, ohne zweite Persistenz. */
MischWerkModules.attachScheduleOverview = function (runtime) {
    'use strict';
    runtime.scheduleOverviewPage = function (user, page) {
        var today = runtime.scheduleToday(), days = [], weeks = [], revisions = [], entries = [], seen = {};
        var first = null;
        for (var offset = 0; offset < 14; offset += 1) { days.push(runtime.scheduleDay(today, offset)); }
        var lastWeek = runtime.scheduleWeek(days[13]);
        for (var week = runtime.scheduleWeek(today); week <= lastWeek; week = runtime.scheduleDay(week, 7)) {
            var data = runtime.schedulePage(user, week, 0);
            if (!first) { first = data; }
            weeks.push({ week: week, revision: data.revision });
            revisions.push([week, data.revision, data.previousRevision, data.boundaryRevision].join(':'));
            for (var index = 0; index < data.pages; index += 1) {
                var batch = index ? runtime.schedulePage(user, week, index) : data;
                batch.entries.forEach(function (entry) {
                    var key = entry.week + ':' + entry.id;
                    if (!seen[key]) { seen[key] = true; entries.push(entry); }
                });
            }
        }
        var beginning = runtime.scheduleDate(today) / 60000, finish = beginning + 14 * 1440;
        entries = entries.filter(function (entry) {
            var interval = runtime.scheduleInterval(entry);
            if (entry.timing === 'openEnd' && !entry.automatic && typeof entry.until === 'number') { interval.end = entry.until; }
            return interval.start < finish && interval.end > beginning;
        }).sort(function (left, right) {
            var a = left.date + left.start, b = right.date + right.start;
            return a < b ? -1 : a > b ? 1 : left.id - right.id;
        });
        return runtime.scheduleResponse({ range: true, week: first.week, today: today, days: days,
            revision: first.revision, previousRevision: first.previousRevision,
            boundaryRevision: revisions.join('/'), weeks: weeks, canManage: first.canManage }, entries, page);
    };
};

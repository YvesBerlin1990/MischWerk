/* Wochenprogramm lesen sowie ownergeprüfte Sendungen anlegen, ändern und entfernen. */
MischWerkModules.attachScheduleProgramme = function (runtime, config) {
    'use strict';
    function ordered(entries) {
        return entries.slice().sort(function (a, b) {
            var left = a.date + a.start, right = b.date + b.start;
            return left < right ? -1 : left > right ? 1 : a.id - b.id;
        });
    }
    function brief(entry) {
        return !!entry.automatic && typeof entry.actualStart === 'number' &&
            (typeof entry.actualEnd === 'number' ? entry.actualEnd : runtime.now()) - entry.actualStart < 5 * 60000;
    }
    function publicEntry(entry, week) {
        return { id: entry.id, week: week, date: entry.date, start: entry.start, end: entry.end,
            nick: entry.nick, topic: entry.topic, kind: entry.kind || 'live', timing: entry.timing || 'fixed',
            automatic: !!entry.automatic, shortBroadcast: brief(entry), actualStart: entry.actualStart || null, actualEnd: entry.actualEnd || null,
            actualFrom: entry.automatic ? runtime.scheduleInterval(entry).start : null,
            actualUntil: entry.automatic ? runtime.scheduleInterval(entry).end : null };
    }
    runtime.scheduleResponse = function (data, entries, page) {
        var chunks = [[]], length = 0;
        entries.forEach(function (entry) {
            var size = JSON.stringify(entry).length + 1;
            if (chunks[chunks.length - 1].length >= 20 || length + size > 8200) { chunks.push([]); length = 0; }
            chunks[chunks.length - 1].push(entry); length += size;
        });
        page = Math.max(0, Math.min(chunks.length - 1, Math.floor(Number(page) || 0)));
        data.entries = chunks[page]; data.page = page; data.pages = chunks.length; data.total = entries.length;
        return data;
    };
    runtime.schedulePage = function (user, date, page) {
        var today = runtime.scheduleToday();
        var week = runtime.scheduleWeek(date || today);
        var saved = runtime.readScheduleWeek(week);
        var canManage = runtime.isChannelOwner(user);
        function visible(entry) { return canManage || !brief(entry); }
        var previous = runtime.scheduleDay(week, -7);
        var previousSaved = runtime.readScheduleWeek(previous);
        var visibleEntries = saved.entries.filter(visible);
        var entries = visibleEntries.map(function (entry) { return publicEntry(entry, week); });
        var before = runtime.scheduleNeighbour(week, -1, visible), after = runtime.scheduleNeighbour(week, 1, visible);
        if (before.entries.length) { entries.push(publicEntry(ordered(before.entries).pop(), before.week)); }
        if (after.entries.length) { entries.push(publicEntry(ordered(after.entries)[0], after.week)); }
        entries = ordered(entries);
        var beginning = runtime.scheduleDate(week) / 60000, finish = beginning + 7 * 1440;
        entries = entries.filter(function (entry, index, timeline) {
            var interval = runtime.scheduleInterval(entry);
            if (entry.timing === 'openEnd' && !entry.automatic) {
                interval.end = index + 1 < timeline.length ? runtime.scheduleInterval(timeline[index + 1]).start : Infinity;
                entry.until = isFinite(interval.end) ? interval.end : null;
            }
            return interval.start < finish && interval.end > beginning;
        });
        return runtime.scheduleResponse({ week: week, today: today, revision: saved.revision, previousRevision: previousSaved.revision,
            boundaryRevision: before.week + ':' + before.revision + '/' + after.week + ':' + after.revision + '/shown:' + visibleEntries.length,
            canManage: canManage,
            days: [0, 1, 2, 3, 4, 5, 6].map(function (offset) { return runtime.scheduleDay(week, offset); }) }, entries, page);
    };
};

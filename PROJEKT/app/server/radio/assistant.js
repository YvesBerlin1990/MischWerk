/* Lesender Sendungsassistent: bestätigte Studiozeit und passende datierte Sendeplantermine. */
MischWerkModules.attachStudioAssistant = function (runtime) {
    'use strict';
    var entries = [], readAt = null, unavailable = true;
    function timedEntry(entry, week) {
        var endDate = entry.end < entry.start ? runtime.scheduleDay(entry.date, 1) : entry.date;
        return { key: week + '-' + entry.id, userId: entry.userId, date: entry.date,
            start: entry.start, end: entry.end, nick: entry.nick, topic: entry.topic,
            startAt: runtime.scheduleTimestamp(entry.date, entry.start, false),
            endAt: runtime.scheduleTimestamp(endDate, entry.end, true) };
    }
    function publicEntry(entry) {
        if (!entry) { return null; }
        return { key: entry.key, date: entry.date, start: entry.start, end: entry.end,
            nick: entry.nick, topic: entry.topic, startAt: entry.startAt, endAt: entry.endAt };
    }
    runtime.refreshAssistant = function () {
        try {
            var week = runtime.scheduleWeek(runtime.scheduleToday()), nextEntries = [];
            [-7, 0, 7].forEach(function (offset) {
                var selectedWeek = runtime.scheduleDay(week, offset);
                runtime.readScheduleWeek(selectedWeek).entries.forEach(function (entry) {
                    nextEntries.push(timedEntry(entry, selectedWeek));
                });
            });
            entries = nextEntries.sort(function (a, b) { return a.startAt - b.startAt; });
            readAt = runtime.now(); unavailable = false;
        } catch (error) {
            unavailable = true;
            runtime.warn('ASSISTANT_PLAN');
        }
    };
    runtime.removeAssistantUser = function (userId) {
        entries = entries.filter(function (entry) { return entry.userId !== userId; });
    };
    runtime.assistantSnapshot = function (user) {
        if (!runtime.isModerator(user)) { return null; }
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var now = runtime.now(), userId = presenter ? presenter.userId : runtime.userId(user);
        var response = { startedAt: presenter ? presenter.since : null, current: null, next: null,
            unavailable: unavailable || readAt === null || now - readAt >= 65000 };
        // Ein Wunschbroadcast liest niemals Sendeplan-Persistenz. Nur ausdrücklicher UI-Refresh lädt neu.
        if (!response.unavailable) {
            var current = entries.filter(function (entry) {
                return entry.userId === userId && entry.startAt <= now && entry.endAt > now;
            })[0];
            if (!current && presenter) {
                current = entries.filter(function (entry) {
                    return entry.userId === userId && entry.startAt <= now && entry.endAt > presenter.since;
                }).pop();
            }
            var planned = current || entries.filter(function (entry) {
                return entry.userId === userId && entry.startAt > now;
            })[0];
            response.current = publicEntry(planned);
            response.next = publicEntry(entries.filter(function (entry) {
                return entry !== planned && entry.startAt >= (current ? current.endAt : now);
            })[0]);
        }
        return response;
    };
};

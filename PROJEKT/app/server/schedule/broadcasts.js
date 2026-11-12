/* Tatsächliche Studio-Wechsel: dauerhafter Auftrag, idempotente Wochenfortschreibung. */
MischWerkModules.attachScheduleBroadcasts = function (runtime) {
    'use strict';
    function key(moderator) { return moderator ? moderator.sessionKey || String(moderator.since) : null; }
    function local(stamp) { return new Date(runtime.scheduleWallTime(stamp)).toISOString(); }
    function weekOf(moderator) { return runtime.scheduleWeek(local(moderator.since).slice(0, 10)); }
    function interval(entry) {
        var span = runtime.scheduleInterval(entry);
        return { start: runtime.scheduleTimestamp(entry.date, entry.start, false), end: isFinite(span.end) ?
            runtime.scheduleTimestamp(new Date(Math.floor(span.end / 1440) * 86400000).toISOString().slice(0, 10),
                new Date(span.end * 60000).toISOString().slice(11, 16), true) : Infinity };
    }
    function find(moderator) {
        var week = weekOf(moderator), timeline = [], match = null;
        var previous = runtime.scheduleDay(week, -7);
        var before = runtime.scheduleNeighbour(previous, -1), after = runtime.scheduleNeighbour(week, 1);
        [week, previous, before.week, after.week].filter(function (value, index, values) {
            return value && values.indexOf(value) === index;
        }).forEach(function (value) {
            var saved = runtime.readScheduleWeek(value);
            saved.entries.forEach(function (entry) {
                var item = { week:value, saved:saved, entry:entry };
                timeline.push(item);
                if (entry.broadcastKey === key(moderator)) { match = item; }
            });
        });
        if (match) { return match; }
        timeline.sort(function (a, b) { return runtime.scheduleInterval(a.entry).start - runtime.scheduleInterval(b.entry).start; });
        return timeline.filter(function (item, index) {
            var entry = item.entry;
            if (entry.automatic || entry.userId !== moderator.userId || entry.kind === 'autodj') { return false; }
            var span = interval(entry);
            if (entry.timing === 'openEnd' && index + 1 < timeline.length) {
                span.end = interval(timeline[index + 1].entry).start;
            }
            return span.start <= moderator.since && span.end > moderator.since;
        }).pop() || null;
    }
    function record(moderator, endedAt, topic) {
        var found = find(moderator), week = found ? found.week : weekOf(moderator);
        var saved = found ? found.saved : runtime.readScheduleWeek(week);
        var entry = found && found.entry, start = local(moderator.since);
        if (!entry) {
            entry = { id: saved.nextId++, date: start.slice(0, 10), start: start.slice(11, 16), end: '',
                timing: 'openEnd', kind: 'live', automatic: true, userId: moderator.userId,
                nick: moderator.nick, topic: topic || '' };
            saved.entries.push(entry);
        }
        if (entry.broadcastKey === key(moderator) && entry.actualStart === moderator.since &&
                (endedAt ? entry.actualEnd === endedAt : !entry.actualEnd)) { return; }
        entry.broadcastKey = key(moderator);
        entry.actualStart = moderator.since;
        if (endedAt) { entry.actualEnd = endedAt; }
        else { delete entry.actualEnd; }
        var homepage = (saved.relayBindings || []).some(function (binding) {
            return binding.deleted === false && binding.nativeId === entry.id;
        });
        if (topic && !homepage) { entry.topic = topic; }
        runtime.writeScheduleWeek(week, saved);
    }
    runtime.prepareScheduleSync = function (next, purgedUserId) {
        var previous = runtime.state && runtime.state.moderator;
        if (purgedUserId) {
            if (next.scheduleSync) {
                if (next.scheduleSync.previous && next.scheduleSync.previous.userId === purgedUserId) {
                    next.scheduleSync.previous = null; next.scheduleSync.previousTopic = '';
                }
                if (next.scheduleSync.current && next.scheduleSync.current.userId === purgedUserId) {
                    next.scheduleSync.current = null; next.scheduleSync.topic = '';
                }
                if (!next.scheduleSync.previous && !next.scheduleSync.current) { delete next.scheduleSync; }
            }
            if (previous && previous.userId === purgedUserId) { return; }
        }
        if (key(previous) === key(next.moderator)) { return; }
        if (next.scheduleSync) {
            throw runtime.failure('Der letzte Studiowechsel wird noch im Sendeplan gespeichert. Bitte aktualisieren und erneut versuchen.');
        }
        next.scheduleSync = { previous: previous ? runtime.copy(previous) : null,
            current: next.moderator ? runtime.copy(next.moderator) : null,
            previousTopic: runtime.state.topic, topic: next.topic, at: runtime.now() };
    };
    runtime.flushScheduleSync = function () {
        var pending = runtime.state.scheduleSync;
        if (!pending) { return false; }
        try {
            if (pending.previous) { record(pending.previous, pending.at, pending.previousTopic); }
            if (pending.current) { record(pending.current, null, pending.topic); }
            runtime.changed('schedule');
            return true;
        } catch (error) { runtime.warn('SCHEDULE_SYNC'); return false; }
    };
};

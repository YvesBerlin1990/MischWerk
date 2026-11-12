/* Öffentliche Tagesprojektion aus dem vollständigen JSON der Homepage. */
MischWerkModules.attachScheduleDay = function (runtime) {
    'use strict';
    runtime.scheduleDayContext = function (date) {
        if (date !== undefined && typeof date !== 'string') { throw runtime.failure('Ungültiger Tag. Bitte erneut öffnen.'); }
        date = date || runtime.scheduleToday(); runtime.scheduleDate(date);
        var monday = runtime.scheduleWeek(runtime.scheduleToday());
        var first = runtime.scheduleDay(monday, -7), last = runtime.scheduleDay(monday, 13);
        if (date < first || date > last) { throw runtime.failure('Bitte einen Tag der vorigen, aktuellen oder nächsten Woche wählen.'); }
        return { date:date, week:runtime.scheduleWeek(date), first:first, last:last };
    };
    runtime.scheduleDayPage = function (context, page, snapshot) {
        var date = context.date, beginning = runtime.scheduleDate(date) / 60000, finish = beginning + 1440;
        var rows = [], cursor = beginning;
        function time(value) {
            var minutes = Math.round(value - beginning) % 1440;
            return ('0' + Math.floor(minutes / 60)).slice(-2) + ':' + ('0' + minutes % 60).slice(-2);
        }
        snapshot.entries.map(function (entry) {
            return { entry:entry, from:Math.max(beginning, entry.from), until:Math.min(finish, entry.until) };
        }).filter(function (slot) { return slot.until > slot.from; }).sort(function (a, b) {
            return a.from - b.from || a.until - b.until;
        }).forEach(function (slot) {
            var from = Math.max(cursor, slot.from), entry = slot.entry;
            if (slot.until > from) {
                rows.push({ from:from, until:slot.until, start:time(from), end:time(slot.until),
                    topic:entry.topic || 'Live-Sendung', nick:entry.nick || 'Moderation', kind:entry.kind,
                    allDay:entry.allDay && from === beginning && slot.until === finish, openEnd:false });
            }
            cursor = Math.max(cursor, slot.until);
        });
        return runtime.scheduleResponse({ source:'homepage', date:date, today:runtime.scheduleToday(),
            previous:date > context.first ? runtime.scheduleDay(date, -1) : null,
            next:date < context.last ? runtime.scheduleDay(date, 1) : null,
            signature:date + ':' + snapshot.signature,
            clock:runtime.scheduleWallTime(runtime.now()) / 60000, serverTime:runtime.now() }, rows, page);
    };
};

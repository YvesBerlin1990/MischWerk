/* Öffentliche Tagesprojektion aus dem vollständigen JSON der Homepage. */
MischWerkModules.attachScheduleDay = function (runtime) {
    'use strict';
    // Begrenzte Seiten mit höchstens 20 Einträgen bzw. rund 8200 Zeichen je Paket.
    function paged(data, entries, page) {
        var chunks = [[]], length = 0;
        entries.forEach(function (entry) {
            var size = JSON.stringify(entry).length + 1;
            if (chunks[chunks.length - 1].length >= 20 || length + size > 8200) { chunks.push([]); length = 0; }
            chunks[chunks.length - 1].push(entry); length += size;
        });
        page = Math.max(0, Math.min(chunks.length - 1, Math.floor(Number(page) || 0)));
        data.entries = chunks[page]; data.page = page; data.pages = chunks.length; data.total = entries.length;
        return data;
    }
    runtime.scheduleDayContext = function (date) {
        if (date !== undefined && typeof date !== 'string') { throw runtime.failure('Ungültiger Tag. Bitte erneut öffnen.'); }
        date = date || runtime.scheduleToday(); runtime.scheduleDate(date);
        var monday = runtime.scheduleWeek(runtime.scheduleToday());
        var first = runtime.scheduleDay(monday, -7), last = runtime.scheduleDay(monday, 13);
        if (date < first || date > last) { throw runtime.failure('Der Sendeplan zeigt nur die vergangene, aktuelle und nächste Woche.'); }
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
        return paged({ source:'homepage', date:date, today:runtime.scheduleToday(),
            previous:date > context.first ? runtime.scheduleDay(date, -1) : null,
            next:date < context.last ? runtime.scheduleDay(date, 1) : null,
            week:context.week, windowFirst:context.first, windowLast:context.last,
            weekSignature:snapshot.signature, revision:snapshot.revision, previousRevision:snapshot.previousRevision,
            boundaryRevision:snapshot.boundaryRevision, checkedAt:snapshot.checkedAt,
            signature:date + ':' + snapshot.signature,
            clock:runtime.scheduleWallTime(runtime.now()) / 60000, serverTime:runtime.now() }, rows, page);
    };
};

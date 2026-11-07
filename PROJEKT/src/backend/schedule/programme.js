/* Wochenprogramm lesen sowie ownergeprüfte Sendungen anlegen, ändern und entfernen. */
MischWerkModules.attachScheduleProgramme = function (runtime) {
    'use strict';
    function ordered(entries) {
        return entries.slice().sort(function (a, b) {
            var left = a.date + a.start, right = b.date + b.start;
            return left < right ? -1 : left > right ? 1 : a.id - b.id;
        });
    }
    function publicEntry(entry, week) {
        return { id: entry.id, week: week, date: entry.date, start: entry.start, end: entry.end,
            nick: entry.nick, topic: entry.topic, kind: entry.kind || 'live', timing: entry.timing || 'fixed',
            automatic: !!entry.automatic, actualStart: entry.actualStart || null, actualEnd: entry.actualEnd || null,
            actualFrom: entry.automatic ? runtime.scheduleInterval(entry).start : null,
            actualUntil: entry.automatic ? runtime.scheduleInterval(entry).end : null };
    }
    runtime.schedulePage = function (user, date, page) {
        var today = runtime.scheduleToday();
        var week = runtime.scheduleWeek(date || today);
        var saved = runtime.readScheduleWeek(week);
        var previous = runtime.scheduleDay(week, -7);
        var previousSaved = runtime.readScheduleWeek(previous);
        var entries = saved.entries.map(function (entry) { return publicEntry(entry, week); });
        var before = runtime.scheduleNeighbour(week, -1), after = runtime.scheduleNeighbour(week, 1);
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
        var chunks = [[]], length = 0;
        entries.forEach(function (entry) {
            var size = JSON.stringify(entry).length + 1;
            if (chunks[chunks.length - 1].length >= 20 || length + size > 8200) { chunks.push([]); length = 0; }
            chunks[chunks.length - 1].push(entry); length += size;
        });
        var pages = chunks.length;
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        return { week: week, today: today, revision: saved.revision, previousRevision: previousSaved.revision,
            boundaryRevision: before.week + ':' + before.revision + '/' + after.week + ':' + after.revision,
            canManage: runtime.isChannelOwner(user),
            days: [0, 1, 2, 3, 4, 5, 6].map(function (offset) { return runtime.scheduleDay(week, offset); }),
            entries: chunks[page], page: page, pages: pages, total: entries.length };
    };
    runtime.changeSchedule = function (user, type, data) {
        if (!runtime.isChannelOwner(user)) { throw runtime.failure('Nur der Channelinhaber darf den Sendeplan ändern.'); }
        var week = runtime.scheduleWeek(data.week);
        if (week !== data.week) { throw runtime.failure('Bitte die Kalenderwoche erneut öffnen.'); }
        var saved = runtime.readScheduleWeek(week);
        if (typeof data.expectedRevision !== 'number' || data.expectedRevision !== saved.revision) {
            throw runtime.failure('Der Wochenplan wurde inzwischen geändert. Bitte aktualisieren und erneut prüfen.');
        }
        var id = data.id === undefined ? 0 : data.id;
        if (typeof id !== 'number' || id < 0 || Math.floor(id) !== id) { throw runtime.failure('Ungültige Sendung.'); }
        var existing = saved.entries.filter(function (entry) { return entry.id === id; })[0];
        if (id && !existing) { throw runtime.failure('Diese Sendung ist nicht mehr im Wochenplan.'); }
        if (existing && existing.automatic && type !== 'mw:schedule.delete') {
            throw runtime.failure('Automatische Studioeinträge dokumentieren die tatsächliche Moderation.');
        }
        if (existing && existing.broadcastKey && !existing.actualEnd) {
            throw runtime.failure('Bitte die laufende Moderation zuerst abmelden.');
        }
        if (type === 'mw:schedule.delete') {
            if (!existing) { throw runtime.failure('Bitte eine vorhandene Sendung auswählen.'); }
            saved.entries = saved.entries.filter(function (entry) { return entry.id !== id; });
        } else if (type === 'mw:schedule.save') {
            if (runtime.scheduleWeek(data.date) !== week) { throw runtime.failure('Das Datum muss in der angezeigten Woche liegen.'); }
            var kind = data.kind === undefined ? 'live' : data.kind;
            if (['live', 'autodj'].indexOf(kind) === -1) { throw runtime.failure('Bitte eine gültige Sendeart auswählen.'); }
            var interval = runtime.scheduleInterval(data), timing = data.timing || 'fixed';
            var userId = null, nick = 'MischWerk';
            if (kind === 'live') {
                nick = runtime.text(data.nick, 50, true);
                var access = KnuddelsServer.getUserAccess();
                if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
                userId = runtime.numericUserId(access.getUserId(nick));
                if (userId !== runtime.userId(user) && runtime.state.radioModeratorUserIds.indexOf(userId) === -1) {
                    throw runtime.failure('Bitte diesen Moderator zuerst in der Verwaltung ernennen.');
                }
                nick = runtime.text(String(access.getNick(userId)), 50, true);
            }
            var entry = { id: id || saved.nextId, date: data.date, kind: kind, timing: timing,
                start: timing === 'allDay' ? '00:00' : data.start,
                end: timing === 'allDay' ? '00:00' : timing === 'openEnd' ? '' : data.end,
                userId: userId, nick: nick,
                topic: runtime.text(data.topic, 80, true) };
            if (existing && existing.actualStart) {
                entry.actualStart = existing.actualStart; entry.actualEnd = existing.actualEnd;
                entry.broadcastKey = existing.broadcastKey;
            }
            [-7, 0, 7].forEach(function (offset) {
                var otherWeek = runtime.scheduleDay(week, offset);
                var other = offset === 0 ? saved : runtime.readScheduleWeek(otherWeek);
                other.entries.forEach(function (item) {
                    if (offset === 0 && item.id === id) { return; }
                    var occupied = runtime.scheduleInterval(item);
                    // Ein offenes Ende reicht bis zum nächsten geplanten Beginn; gleiche Anfänge bleiben Konflikte.
                    if (interval.start === occupied.start ||
                            (interval.start < occupied.start && entry.timing !== 'openEnd' && interval.end > occupied.start) ||
                            (occupied.start < interval.start && item.timing !== 'openEnd' && occupied.end > interval.start)) {
                        throw runtime.failure('Diese Sendezeit überschneidet sich mit einer bereits geplanten Sendung.');
                    }
                });
            });
            saved.entries = saved.entries.filter(function (item) { return item.id !== id; });
            saved.entries.push(entry);
            if (!id) { saved.nextId += 1; }
        } else { throw runtime.failure('Unbekannte Sendeplan-Aktion.'); }
        runtime.writeScheduleWeek(week, saved);
        return week;
    };
};

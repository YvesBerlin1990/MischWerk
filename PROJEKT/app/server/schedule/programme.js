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
            nick: entry.nick, topic: entry.topic };
    }
    runtime.schedulePage = function (user, date, page) {
        var today = runtime.scheduleToday();
        var week = runtime.scheduleWeek(date || today);
        var saved = runtime.readScheduleWeek(week);
        var previous = runtime.scheduleDay(week, -7);
        var previousSaved = runtime.readScheduleWeek(previous);
        var entries = saved.entries.map(function (entry) { return publicEntry(entry, week); });
        previousSaved.entries.forEach(function (entry) {
            if (entry.date === runtime.scheduleDay(week, -1) && entry.end < entry.start && entry.end !== '00:00') {
                entries.push(publicEntry(entry, previous));
            }
        });
        entries = ordered(entries);
        var pages = Math.max(1, Math.ceil(entries.length / 20));
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        return { week: week, today: today, revision: saved.revision, previousRevision: previousSaved.revision,
            canManage: runtime.isChannelOwner(user),
            days: [0, 1, 2, 3, 4, 5, 6].map(function (offset) { return runtime.scheduleDay(week, offset); }),
            entries: entries.slice(page * 20, (page + 1) * 20), page: page, pages: pages, total: entries.length };
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
        if (type === 'mw:schedule.delete') {
            if (!existing) { throw runtime.failure('Bitte eine vorhandene Sendung auswählen.'); }
            saved.entries = saved.entries.filter(function (entry) { return entry.id !== id; });
        } else if (type === 'mw:schedule.save') {
            if (runtime.scheduleWeek(data.date) !== week) { throw runtime.failure('Das Datum muss in der angezeigten Woche liegen.'); }
            var interval = runtime.scheduleInterval(data);
            var nick = runtime.text(data.nick, 50, true);
            var access = KnuddelsServer.getUserAccess();
            if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
            var userId = runtime.numericUserId(access.getUserId(nick));
            if (userId !== runtime.userId(user) && runtime.state.radioModeratorUserIds.indexOf(userId) === -1) {
                throw runtime.failure('Bitte diesen Moderator zuerst in der Verwaltung ernennen.');
            }
            var entry = { id: id || saved.nextId, date: data.date, start: data.start, end: data.end,
                userId: userId, nick: runtime.text(String(access.getNick(userId)), 50, true),
                topic: runtime.text(data.topic, 80, true) };
            [-7, 0, 7].forEach(function (offset) {
                var otherWeek = runtime.scheduleDay(week, offset);
                var other = offset === 0 ? saved : runtime.readScheduleWeek(otherWeek);
                other.entries.forEach(function (item) {
                    if (offset === 0 && item.id === id) { return; }
                    var occupied = runtime.scheduleInterval(item);
                    if (interval.start < occupied.end && interval.end > occupied.start) {
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

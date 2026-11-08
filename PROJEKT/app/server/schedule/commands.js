/* Gemeinsame Sendeplanregeln für authentifizierte Inhaber- und bestätigte Relay-Aufträge. */
MischWerkModules.attachScheduleCommands = function (runtime, config) {
    'use strict';
    runtime.changeSchedule = function (user, type, data) {
        if (!runtime.isChannelOwner(user)) { throw runtime.failure('Nur der Channelinhaber darf den Sendeplan ändern.'); }
        return change(user, type, data, null);
    };
    runtime.changeScheduleFromRelay = function (type, data, commandId) { return change(null, type, data, commandId); };
    function change(user, type, data, commandId) {
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
            var sync = runtime.state.scheduleSync;
            if (existing.broadcastKey && sync && [sync.previous, sync.current].some(function (moderator) {
                return moderator && (moderator.sessionKey || String(moderator.since)) === existing.broadcastKey;
            })) { throw runtime.failure('Der Studioeintrag wird noch gespeichert. Bitte aktualisieren und erneut entfernen.'); }
            saved.entries = saved.entries.filter(function (entry) { return entry.id !== id; });
        } else if (type === 'mw:schedule.save') {
            if (runtime.scheduleWeek(data.date) !== week) { throw runtime.failure('Das Datum muss in der angezeigten Woche liegen.'); }
            var kind = data.kind === undefined ? 'live' : data.kind;
            if (['live', 'autodj'].indexOf(kind) === -1) { throw runtime.failure('Bitte eine gültige Sendeart auswählen.'); }
            var interval = runtime.scheduleInterval(data), timing = data.timing || 'fixed';
            if (timing !== 'allDay') {
                runtime.scheduleTimestamp(data.date, data.start, false);
                if (timing === 'fixed') {
                    runtime.scheduleTimestamp(runtime.scheduleDay(data.date, data.end < data.start ? 1 : 0), data.end, true);
                }
            }
            var userId = null, nick = 'MischWerk';
            if (kind === 'live') {
                nick = runtime.text(data.nick, 50, true);
                var access = KnuddelsServer.getUserAccess();
                if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
                userId = runtime.numericUserId(access.getUserId(nick));
                var owner = user ? userId === runtime.userId(user) :
                    String(access.getNick(userId)).toLowerCase() === config.ownerNick.toLowerCase();
                if (!owner && runtime.state.radioModeratorUserIds.indexOf(userId) === -1) {
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
                            (occupied.start < interval.start && (item.timing !== 'openEnd' || item.automatic) && occupied.end > interval.start)) {
                        throw runtime.failure('Diese Sendezeit überschneidet sich mit einer bereits geplanten Sendung.');
                    }
                });
            });
            saved.entries = saved.entries.filter(function (item) { return item.id !== id; });
            saved.entries.push(entry);
            if (!id) { saved.nextId += 1; }
        } else { throw runtime.failure('Unbekannte Sendeplan-Aktion.'); }
        if (commandId) { runtime.addRelayResult(saved, 'relayResults', {
            commandId: commandId, state: 'applied', revision: saved.revision + 1 }); }
        runtime.writeScheduleWeek(week, saved);
        return week;
    }
};

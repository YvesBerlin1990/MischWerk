/* Eigene persistente Wochenpläne; niemals Teil der flüchtigen Wunschqueue. */
MischWerkModules.attachScheduleStorage = function (runtime) {
    'use strict';
    var prefix = 'mischwerk.schedule.v1.';
    var indexKey = prefix + 'weeks';
    runtime.readScheduleWeek = function (week) {
        if (runtime.scheduleWeek(week) !== week) { throw runtime.failure('Ungültige Kalenderwoche.'); }
        var saved = KnuddelsServer.getPersistence().getObject(prefix + week, null);
        if (!saved) { return { version: 1, revision: 0, nextId: 1, entries: [] }; }
        if (saved.version !== 1 || !Array.isArray(saved.entries) || typeof saved.revision !== 'number' ||
                !isFinite(saved.revision) || saved.revision < 0 || typeof saved.nextId !== 'number' ||
                saved.nextId < 1 || Math.floor(saved.nextId) !== saved.nextId) {
            throw runtime.failure('Dieser Wochenplan konnte nicht gelesen werden. Bitte den Channelinhaber informieren.');
        }
        return saved;
    };
    function weeks() {
        var list = KnuddelsServer.getPersistence().getObject(indexKey, []);
        if (!Array.isArray(list)) { throw new Error('schedule index'); }
        return list;
    }
    runtime.scheduleWeeks = function () { return weeks().slice(); };
    runtime.scheduleNeighbour = function (week, direction, visible) {
        var list = weeks().filter(function (item) { return direction < 0 ? item < week : item > week; }).sort();
        if (direction < 0) { list.reverse(); }
        for (var index = 0; index < list.length; index += 1) {
            var saved = runtime.readScheduleWeek(list[index]);
            var entries = visible ? saved.entries.filter(visible) : saved.entries;
            if (entries.length) { return { week: list[index], revision: saved.revision, entries: entries }; }
        }
        return { week: '', revision: 0, entries: [] };
    };
    function write(week, next, advance) {
        var saved = runtime.copy(next);
        if (advance) { saved.revision += 1; }
        if (runtime.jsonBytes(JSON.stringify(saved)) > 90000) {
            throw runtime.failure('Dieser Wochenplan ist zu umfangreich und konnte nicht gespeichert werden.');
        }
        var list = weeks();
        // Index zuerst: Scheitert das Schreiben des Plans, bleibt höchstens ein leerer Verweis.
        // Ein gespeicherter Plan bleibt dadurch immer für die Nutzerlöschung auffindbar.
        if (list.indexOf(week) === -1) {
            list.push(week);
            KnuddelsServer.getPersistence().setObject(indexKey, list);
        }
        KnuddelsServer.getPersistence().setObject(prefix + week, saved);
        return saved;
    }
    runtime.writeScheduleWeek = function (week, next) { return write(week, next, true); };
    runtime.commitScheduleRelay = function (week, next, advance) { return write(week, next, advance); };
    runtime.recordScheduleRelayResult = function (week, result) {
        var saved = runtime.readScheduleWeek(week);
        runtime.addRelayResult(saved, 'relayResults', result);
        write(week, saved, false);
    };
    runtime.removeScheduleUser = function (userId) {
        userId = runtime.numericUserId(userId);
        weeks().forEach(function (week) {
            var saved = runtime.readScheduleWeek(week);
            var filtered = saved.entries.filter(function (entry) { return entry.userId !== userId; });
            if (filtered.length !== saved.entries.length) {
                saved.entries = filtered;
                runtime.writeScheduleWeek(week, saved);
            }
        });
    };
};

/* Privat gespeicherter Wochenbestand: kein Lese- oder Schreibweg, nur Bereinigung bei Nutzerlöschung. */
MischWerkModules.attachScheduleStorage = function (runtime) {
    'use strict';
    var prefix = 'mischwerk.schedule.v1.';
    var indexKey = prefix + 'weeks';
    function weeks() {
        var list = KnuddelsServer.getPersistence().getObject(indexKey, []);
        if (!Array.isArray(list)) { throw new Error('schedule index'); }
        return list;
    }
    function read(week) {
        if (runtime.scheduleWeek(week) !== week) { throw new Error('schedule week'); }
        var saved = KnuddelsServer.getPersistence().getObject(prefix + week, null);
        if (!saved) { return null; }
        if (saved.version !== 1 || !Array.isArray(saved.entries) || typeof saved.revision !== 'number' ||
                !isFinite(saved.revision) || saved.revision < 0) {
            throw new Error('schedule week format');
        }
        return saved;
    }
    runtime.removeScheduleUser = function (userId) {
        userId = runtime.numericUserId(userId);
        weeks().forEach(function (week) {
            var saved = read(week);
            if (!saved) { return; }
            var filtered = saved.entries.filter(function (entry) { return entry.userId !== userId; });
            if (filtered.length !== saved.entries.length) {
                var next = runtime.copy(saved);
                next.entries = filtered; next.revision += 1;
                KnuddelsServer.getPersistence().setObject(prefix + week, next);
            }
        });
    };
};

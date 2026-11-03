/* Kalenderdaten und lokale Sendezeiten; unabhängig von der Server-Zeitzone. */
MischWerkModules.attachScheduleCalendar = function (runtime) {
    'use strict';
    function iso(value) { return new Date(value).toISOString().slice(0, 10); }
    runtime.scheduleDate = function (value) {
        if (typeof value !== 'string' || !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value)) {
            throw runtime.failure('Bitte ein gültiges Datum auswählen.');
        }
        var parts = value.split('-');
        var stamp = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (iso(stamp) !== value) { throw runtime.failure('Dieses Datum gibt es nicht.'); }
        return stamp;
    };
    runtime.scheduleDay = function (value, offset) { return iso(runtime.scheduleDate(value) + offset * 86400000); };
    runtime.scheduleWeek = function (value) {
        var stamp = runtime.scheduleDate(value);
        return iso(stamp - (new Date(stamp).getUTCDay() + 6) % 7 * 86400000);
    };
    runtime.scheduleToday = function () {
        var now = runtime.now();
        var year = new Date(now).getUTCFullYear();
        function change(month) {
            var last = new Date(Date.UTC(year, month + 1, 0));
            return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), 1);
        }
        var summer = now >= change(2) && now < change(9);
        return iso(now + (summer ? 2 : 1) * 3600000);
    };
    runtime.scheduleMinutes = function (value) {
        if (typeof value !== 'string' || !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
            throw runtime.failure('Bitte gültige Uhrzeiten angeben.');
        }
        return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    };
    runtime.scheduleInterval = function (entry) {
        var start = runtime.scheduleMinutes(entry.start);
        var end = runtime.scheduleMinutes(entry.end);
        if (start === end) { throw runtime.failure('Beginn und Ende müssen verschieden sein.'); }
        var day = runtime.scheduleDate(entry.date) / 60000;
        return { start: day + start, end: day + end + (end < start ? 1440 : 0) };
    };
    runtime.scheduleTimestamp = function (date, time, endOfInterval) {
        var wall = runtime.scheduleDate(date) + runtime.scheduleMinutes(time) * 60000;
        var matches = [];
        [2, 1].forEach(function (offset) {
            var value = wall - offset * 3600000, year = new Date(value).getUTCFullYear();
            function change(month) {
                var last = new Date(Date.UTC(year, month + 1, 0));
                return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), 1);
            }
            var actual = value >= change(2) && value < change(9) ? 2 : 1;
            if (actual === offset) { matches.push(value); }
        });
        if (!matches.length) { throw runtime.failure('Diese Uhrzeit entfällt durch die Zeitumstellung.'); }
        return endOfInterval ? Math.max.apply(Math, matches) : Math.min.apply(Math, matches);
    };
};

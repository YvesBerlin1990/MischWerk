/* Strenger Lesevertrag des öffentlichen Homepage-JSON, ohne Kalenderänderung. */
MischWerkModules.attachPublicScheduleData = function (runtime) {
    'use strict';
    runtime.parsePublicSchedule = function (raw, week) {
        function invalid() { throw runtime.failure('Die Homepage hat ungültige Sendeplandaten geliefert. Bitte erneut laden.'); }
        function date(value) {
            if (typeof value !== 'string') { invalid(); }
            runtime.scheduleDate(value); return value;
        }
        function text(value, limit) {
            if (typeof value !== 'string' || value.length > limit || /[\u0000-\u001f\u007f]/.test(value)) { invalid(); }
            return value;
        }
        raw = String(raw);
        if (raw.length > 131072 || encodeURIComponent(raw).replace(/%[0-9A-F]{2}|./g, 'x').length > 131072) { invalid(); }
        var value = JSON.parse(raw), ids = {}, rows = [];
        if (!value || value.version !== 1 || value.ok !== true || value.ready !== true || value.week !== week ||
                !Array.isArray(value.days) || value.days.length !== 7 || !Array.isArray(value.entries) || value.entries.length > 1024) { invalid(); }
        date(value.today);
        value.days.forEach(function (day, index) { if (day !== runtime.scheduleDay(week, index)) { invalid(); } });
        value.entries.forEach(function (entry) {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { invalid(); }
            var id = text(entry.id, 200), day = date(entry.date), beginning = runtime.scheduleDate(day) / 60000;
            if (!id || ids['$' + id] || entry.week !== runtime.scheduleWeek(day) ||
                    ['live', 'autodj'].indexOf(entry.kind) === -1 || ['fixed', 'allDay', 'openEnd'].indexOf(entry.timing) === -1 ||
                    (entry.until !== null && entry.until !== undefined && (typeof entry.until !== 'number' || !isFinite(entry.until)))) { invalid(); }
            ids['$' + id] = true;
            var start = runtime.scheduleMinutes(entry.start), end, from, until;
            if (entry.timing === 'allDay') { from = beginning; until = beginning + 1440; }
            else {
                from = beginning + start;
                if (entry.timing === 'openEnd') { until = typeof entry.until === 'number' ? entry.until : beginning + 1440; }
                else {
                    end = runtime.scheduleMinutes(entry.end);
                    until = beginning + end + (end < start ? 1440 : 0);
                }
            }
            if (until <= from) { invalid(); }
            rows.push({ from:from, until:until, topic:text(entry.topic, 80), nick:text(entry.moderator, 50),
                kind:entry.kind, allDay:entry.timing === 'allDay' });
        });
        return { entries:rows };
    };
};

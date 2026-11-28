/* Gemeinsame HTTP-Reserve unter dem Knuddels-Limit, ohne eigenen Timer oder Persistenz. */
MischWerkModules.attachHttpBudget = function (runtime) {
    'use strict';
    var groups = { sync: { limit: 60, entries: [], lastStart: null },
        schedule: { limit: 30, entries: [], lastStart: null } }, lastClock = 0;
    function clock() {
        lastClock = Math.max(lastClock, runtime.now());
        return lastClock;
    }
    runtime.externalRequestDelay = function (kind) {
        var group = groups[kind], now = clock(), due = now;
        group.entries = group.entries.filter(function (entry) {
            return !entry.finished || now - entry.at < 600000;
        });
        if (kind === 'sync' && group.lastStart !== null) { due = Math.max(due, group.lastStart + 10000); }
        if (group.entries.length >= group.limit) {
            var dates = group.entries.filter(function (entry) { return entry.finished; })
                .map(function (entry) { return entry.at + 600000; });
            due = Math.max(due, dates.length ? Math.min.apply(Math, dates) : now + 10000);
        }
        return Math.max(0, due - runtime.now());
    };
    runtime.beginExternalRequest = function (kind) {
        var delay = runtime.externalRequestDelay(kind);
        if (delay > 0) {
            var error = new Error('EXTERNAL_REQUEST_WAIT');
            error.externalRetryAt = runtime.now() + delay;
            throw error;
        }
        var group = groups[kind], entry = { at: clock(), finished: false };
        group.lastStart = entry.at;
        group.entries.push(entry);
        // Erst zehn Minuten nach dem Callback freigeben: auch verspätete Antworten zählen.
        return function () {
            if (!entry.finished) { entry.at = clock(); entry.finished = true; }
        };
    };
};

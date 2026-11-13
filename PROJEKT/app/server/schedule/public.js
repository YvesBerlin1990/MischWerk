/* Ein gemeinsamer nativer GET je Woche; nur flüchtiger Lesecache und Auftragstimeout. */
MischWerkModules.attachPublicSchedule = function (runtime) {
    'use strict';
    var cache = {}, pending = {}, sequence = 0;
    function unavailable() { return runtime.failure('Der Sendeplan der Homepage ist gerade nicht erreichbar. Bitte erneut laden.'); }
    function trim() {
        var monday = runtime.scheduleWeek(runtime.scheduleToday());
        var weeks = [-7, 0, 7].map(function (offset) { return runtime.scheduleDay(monday, offset); });
        Object.keys(cache).forEach(function (key) { if (weeks.indexOf(key) === -1) { delete cache[key]; } });
        return weeks;
    }
    runtime.cachedPublicSchedule = function (week) {
        trim();
        return cache[week] ? { value:cache[week].value, stale:cache[week].invalid || runtime.now() < cache[week].at ||
            runtime.now() - cache[week].at >= 60000 } : null;
    };
    runtime.invalidatePublicSchedule = function (week) {
        Object.keys(cache).forEach(function (key) {
            if (!week || Math.abs(runtime.scheduleDate(key) - runtime.scheduleDate(week)) <= 7 * 86400000) { cache[key].invalid = true; }
        });
        Object.keys(pending).forEach(function (key) {
            if (!week || Math.abs(runtime.scheduleDate(key) - runtime.scheduleDate(week)) <= 7 * 86400000) { pending[key].invalid = true; }
        });
    };
    runtime.readPublicSchedule = function (week, owner, callback) {
        if (runtime.shuttingDown || runtime.scheduleWeek(week) !== week || trim().indexOf(week) === -1) { callback(unavailable()); return; }
        if (cache[week] && !cache[week].invalid && runtime.now() >= cache[week].at && runtime.now() - cache[week].at < 60000) {
            callback(null, cache[week].value); return;
        }
        var job = pending[week];
        if (job) {
            job.waiters = job.waiters.filter(function (waiter) { return waiter.owner !== owner; });
            job.waiters.push({ owner:owner, callback:callback }); return;
        }
        var url = 'https://radio-mischwerk.web.app/api/public-schedule?week=' + week;
        job = { waiters:[{owner:owner, callback:callback}], at:runtime.now() }; pending[week] = job;
        function finish(error, value) {
            if (pending[week] !== job) { return; }
            delete pending[week]; clearTimeout(job.timer);
            if (runtime.shuttingDown) { return; }
            if (!error && trim().indexOf(week) === -1) { error = unavailable(); }
            if (!error) {
                var previous = cache[week] && cache[week].value;
                value.signature = previous && JSON.stringify([previous.entries, previous.revision, previous.previousRevision, previous.boundaryRevision]) ===
                    JSON.stringify([value.entries, value.revision, value.previousRevision, value.boundaryRevision]) ?
                    previous.signature : String(++sequence);
                value.checkedAt = runtime.now();
                cache[week] = {at:runtime.now(), value:value, invalid:!!job.invalid}; trim();
            }
            job.waiters.forEach(function (waiter) {
                try { waiter.callback(error, value); } catch (ignored) { runtime.warn('SCHEDULE_PUBLIC_DELIVERY'); }
            });
        }
        job.timer = setTimeout(function () { finish(unavailable()); }, 10000);
        try {
            var access = KnuddelsServer.getExternalServerAccess();
            if (!access.canAccessURL(url)) { throw unavailable(); }
            access.getURL(url, {
                onSuccess:function (raw, response) {
                    if (pending[week] !== job) { return; }
                    try {
                        if (runtime.now() < job.at || runtime.now() - job.at >= 10000 ||
                                !response || Number(response.getResponseCode()) !== 200 || String(response.getURLString()) !== url) { throw unavailable(); }
                        finish(null, runtime.parsePublicSchedule(raw, week));
                    } catch (error) { finish(error.publicMessage ? error : unavailable()); }
                },
                onFailure:function () { finish(unavailable()); }
            });
        } catch (error) { finish(unavailable()); }
    };
    runtime.stopPublicSchedule = function () {
        Object.keys(pending).forEach(function (week) { clearTimeout(pending[week].timer); pending[week].waiters = []; });
        pending = {}; cache = {};
    };
    runtime.releasePublicSchedule = function (owner) {
        Object.keys(pending).forEach(function (week) {
            pending[week].waiters = pending[week].waiters.filter(function (waiter) { return waiter.owner !== owner; });
        });
    };
};

/* Ein gemeinsamer nativer GET je Woche; nur flüchtiger Lesecache und Auftragstimeout. */
MischWerkModules.attachPublicSchedule = function (runtime) {
    'use strict';
    var cache = {}, pending = {}, sequence = 0;
    function unavailable() { return runtime.failure('Der Sendeplan der Homepage ist gerade nicht erreichbar. Bitte erneut laden.'); }
    runtime.readPublicSchedule = function (week, owner, callback) {
        var monday = runtime.scheduleWeek(runtime.scheduleToday());
        var weeks = [-7, 0, 7].map(function (offset) { return runtime.scheduleDay(monday, offset); });
        Object.keys(cache).forEach(function (key) { if (weeks.indexOf(key) === -1) { delete cache[key]; } });
        if (runtime.shuttingDown || weeks.indexOf(week) === -1) { callback(unavailable()); return; }
        if (cache[week] && runtime.now() >= cache[week].at && runtime.now() - cache[week].at < 15000) {
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
            if (!error) {
                var previous = cache[week] && cache[week].value;
                value.signature = previous && JSON.stringify(previous.entries) === JSON.stringify(value.entries) ?
                    previous.signature : String(++sequence);
                cache[week] = {at:runtime.now(), value:value};
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
        Object.keys(pending).forEach(function (week) { clearTimeout(pending[week].timer); });
        pending = {}; cache = {};
    };
};

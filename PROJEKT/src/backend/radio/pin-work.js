/* Flüchtige PIN-Arbeit: kurze Timerereignisse, unveränderter bcrypt-Kostenfaktor. */
MischWerkModules.attachPinWork = function (runtime) {
    'use strict';
    var active = null, ready = null;
    function stored(userId) { return JSON.stringify(runtime.state.moderatorPins['u' + userId] || null); }
    function cancelled() { return runtime.failure('Die PIN-Anmeldung wurde beendet. Bitte erneut anmelden.'); }
    function schedule(job, callback) { job.timer = setTimeout(callback, 1); }
    function notify(job, failure) {
        try { if (job.fail) { job.fail(failure); } } catch (ignored) { runtime.warn('PIN_NOTIFY'); }
    }
    runtime.preparedPinSalt = function (user) { return ready && ready.userId === runtime.userId(user) ? ready.salt : null; };
    runtime.hashModerationPin = function (user, pin, salt) {
        var userId = runtime.userId(user);
        if (ready && ready.userId === userId && ready.salt === salt) { return ready.hash; }
        if (active) { throw runtime.failure('Eine PIN-Prüfung läuft bereits. Bitte kurz warten.'); }
        var bytes = [];
        for (var index = 0; index < 32; index += 2) { bytes.push(parseInt(salt.slice(index, index + 2), 16)); }
        active = { user:user, userId:userId, salt:salt, record:stored(userId), moderator:JSON.stringify(runtime.state.moderator),
            deadline:runtime.now() + 60000, timer:null, started:false, error:{}, work:runtime.createPinBcrypt(String(userId) + ':' + pin, bytes) };
        throw active.error;
    };
    runtime.cancelModerationPin = function (userId) {
        if (!active || (userId !== undefined && active.userId !== userId)) { return; }
        var job = active; active = null;
        if (job.timer !== null) { clearTimeout(job.timer); }
        job.work.dispose();
        notify(job, cancelled());
    };
    runtime.deferModerationPin = function (error, retry, fail, allowed, menuOnly) {
        if (!active || error !== active.error || active.started) { return false; }
        var job = active; job.started = true; job.fail = fail;
        function moderationPinStep() {
            if (active !== job) { return; }
            job.timer = null;
            try {
                if (runtime.shuttingDown || runtime.now() >= job.deadline || !runtime.isModerator(job.user) ||
                        stored(job.userId) !== job.record || (!menuOnly && JSON.stringify(runtime.state.moderator) !== job.moderator) || !allowed()) { throw cancelled(); }
                var output = job.work.step();
                if (!output) { schedule(job, moderationPinStep); return; }
                active = null;
                ready = { userId:job.userId, salt:job.salt, hash:output.map(function (value) {
                    return ('0' + value.toString(16)).slice(-2);
                }).join('') };
                try { retry(); } finally { ready = null; }
            } catch (failure) {
                active = null; job.work.dispose(); notify(job, failure);
            }
        }
        schedule(job, moderationPinStep);
        return true;
    };
};

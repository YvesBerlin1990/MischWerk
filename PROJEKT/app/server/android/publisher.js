/* Vertragsprojektion und Heartbeat; der Verbindungsadapter kapselt postURL oder den Testport. */
MischWerkModules.attachAndroidPublisher = function (runtime) {
    'use strict';
    var settings = null, wire = null, running = false, timer = null, generation = 0, requestToken = 0;
    var active = null, healthy = false, confirmedAt = 0, lastClock = 0, dirty = false, lastProjection = null;
    function clock() {
        var now = runtime.now();
        if (typeof now !== 'number' || !isFinite(now) || now < lastClock) { throw new Error('ANDROID_CLOCK'); }
        lastClock = now; return now;
    }
    function cancelActive() {
        var old = active; active = null; requestToken += 1;
        if (old && typeof old.cancel === 'function') {
            try { old.cancel(); } catch (error) { runtime.warn('ANDROID_CANCEL'); }
        }
    }
    function projection() {
        var onAir = runtime.moderatorIsActive();
        return { wishboxOpen: runtime.state.requestsEnabled === true && !runtime.shuttingDown,
            onAir: onAir, moderatorNick: onAir ? runtime.state.moderator.nick : null,
            topic: runtime.state.topic || null };
    }
    function publish(force) {
        if (!running || runtime.shuttingDown || active) { return; }
        var updates, body;
        try {
            updates = runtime.pendingAndroidUpdates();
            if (!force && !dirty && !updates.length) { return; }
            var current = projection();
            lastProjection = JSON.stringify(current); current.updatedAt = clock();
            body = { station: current, wishUpdates: updates.map(function (row) {
                return { submissionId: row.submissionId, state: row.state, position: row.position };
            }) };
        } catch (error) { healthy = false; runtime.warn('ANDROID_PUBLISH_PREPARE'); return; }
        dirty = false;
        var token = ++requestToken, epoch = generation;
        active = { token: token, at: body.station.updatedAt, cancel: null };
        try {
            var cancel = wire.sendJson({ url: settings.syncUrl, authorization: 'Bearer ' + settings.syncSecret, body: body }, function (result) {
                if (!running || generation !== epoch || !active || active.token !== token) { return; }
                active = null;
                try {
                    var now = clock(), reply = result && result.body;
                    if (now - body.station.updatedAt > 10000 || !result || result.status !== 200 || !reply || reply.accepted !== true ||
                            typeof reply.serverTime !== 'number' || !isFinite(reply.serverTime) ||
                            reply.serverTime < now - 45000 || reply.serverTime > now + 30000) { throw new Error('ANDROID_RESPONSE'); }
                    runtime.confirmAndroidUpdates(updates);
                    healthy = true; confirmedAt = now;
                    publish(false);
                } catch (error) { healthy = false; dirty = true; runtime.warn('ANDROID_PUBLISH_RESPONSE'); }
            });
            if (active && active.token === token) { active.cancel = cancel; }
        } catch (error) { cancelActive(); healthy = false; dirty = true; runtime.warn('ANDROID_PUBLISH_SEND'); }
    }
    function arm() {
        if (!running || runtime.shuttingDown) { return; }
        var epoch = generation;
        timer = setTimeout(function () {
            timer = null;
            if (!running || epoch !== generation || runtime.shuttingDown) { return; }
            if (active && runtime.now() - active.at >= 10000) { cancelActive(); healthy = false; }
            publish(true); arm();
        }, 20000);
    }
    runtime.startAndroidPublisher = function (configuration, connection) {
        if (running) { return; }
        if (!connection || typeof connection.sendJson !== 'function') { throw new Error('ANDROID_TRANSPORT_UNVERIFIED'); }
        wire = connection;
        settings = configuration; running = true; generation += 1; dirty = true;
        publish(true); arm();
    };
    runtime.androidRelayHealthy = function () {
        return running && healthy && !runtime.shuttingDown && runtime.now() >= lastClock && runtime.now() - confirmedAt < 45000 &&
            (!active || runtime.now() - active.at < 10000) && runtime.androidReceiptsReady();
    };
    runtime.stopAndroidPublisher = function () {
        running = false; healthy = false; generation += 1;
        if (timer !== null) { clearTimeout(timer); timer = null; }
        cancelActive(); settings = null; wire = null;
    };
    runtime.observeChanges(function (kind) {
        if (kind === 'station' && JSON.stringify(projection()) !== lastProjection) { dirty = true; publish(true); }
        else if (kind === 'wishes' || kind === 'wish-removed') { publish(false); }
    });
};

/* Ein bestehender HTTP-Port und ein Timer für V2-Abgleich, Backoff und Fristablauf. */
MischWerkModules.attachAndroidPublisher = function(runtime) {
    'use strict';
    var wire = null,
        settings = null,
        running = false,
        timer = null,
        generation = 0,
        active = null,
        sequence = 0,
        processing = false,
        urgent = false;
    var failures = 0,
        retryAt = 0,
        nextPostAt = 0,
        healthy = false,
        confirmedAt = 0,
        lastPost = null,
        first = null,
        lastClock = 0;

    function clock() {
        var now = runtime.now();
        if (now < lastClock) {
            healthy = false;
            runtime.clearRelayProjection();
        }
        lastClock = now;
        return now;
    }

    function base() {
        return 10000;
    }

    function cancel() {
        var old = active;
        active = null;
        if (old && old.cancel) {
            old.cancel();
        }
    }

    function failed(stage, status) {
        healthy = false;
        failures = Math.min(4, failures + 1);
        retryAt = clock() + Math.max(base(), Math.min(60000, 10000 * Math.pow(2, failures - 1)));
        nextPostAt = retryAt;
        runtime.recordAndroidFailure(stage, status);
    }

    function publish() {
        if (!running || runtime.shuttingDown || active || processing || clock() < nextPostAt) {
            return;
        }
        var delay = runtime.externalRequestDelay('sync');
        if (delay > 0) { nextPostAt = clock() + delay; return; }
        var body;
        try {
            body = runtime.nativeRelayRequest();
        } catch (error) {
            failed('prepare', null);
            runtime.warn('NATIVE_PREPARE');
            return;
        }
        var at = clock(),
            epoch = generation,
            token = ++sequence;
        active = {
            token: token,
            at: at,
            cancel: null
        };
        urgent = false;
        nextPostAt = at + base();
        try {
            var cancellation = wire.sendJson({
                url: settings.syncUrl,
                body: body
            }, function(result) {
                if (!running || epoch !== generation || !active || active.token !== token) {
                    return;
                }
                active = null;
                var now = clock(),
                    reply = result && result.body;
                lastPost = {
                    at: at,
                    status: result && result.status || null,
                    accepted: false,
                    wishesReceived: 0
                };
                var stage = result && result.failureStage || 'response_contract';
                try {
                    if (result && result.failureStage) { throw new Error('NATIVE_TRANSPORT'); }
                    if (!result || result.status !== 200) {
                        stage = 'http_status'; throw new Error('NATIVE_HTTP');
                    }
                    if (!reply || reply.contractVersion !== 2) {
                        stage = 'contract_version'; throw new Error('NATIVE_VERSION');
                    }
                    if (now < at || now - at > 10000 || reply.accepted !== true ||
                        typeof reply.serverTime !== 'number' || !isFinite(reply.serverTime) || reply
                        .serverTime < now - 45000 || reply.serverTime > now + 30000) {
                        throw new Error('NATIVE_REPLY');
                    }
                    processing = true;
                    // Individuelle Belege behalten ihre Wirkung auch bei einem nachgelagerten Cursorreset.
                    stage = 'response_receipts';
                    runtime.acceptNativeWishReply(reply, body);
                    stage = 'response_projection';
                    var projection = runtime.acceptRelayProjection(reply, at, body);
                    runtime.setNativeNickCursor(projection.nickAccessCursor);
                    stage = 'response_events';
                    runtime.acceptBroadcastEvents(reply, body);
                    healthy = true;
                    confirmedAt = now;
                    runtime.nativeTransportConfirmedAt = now;
                    failures = 0;
                    retryAt = 0;
                    lastPost.accepted = true;
                    lastPost.wishesReceived = reply.wishReceipts.length;
                    if (!first) {
                        first = runtime.copy(lastPost);
                    }
                    nextPostAt = urgent ? now : now + base();
                } catch (error) {
                    failed(stage, result && (result.failureStatus || result.status));
                    // Der HTTP-Adapter hat seinen Fehler bereits einmal gemeldet.
                    if (!result || !result.failureStage) { runtime.warn('NATIVE_RESPONSE'); }
                }
                processing = false;
                runtime.changed('station');
                arm();
            });
            if (active && active.token === token) {
                active.cancel = cancellation;
            }
        } catch (error) {
            cancel();
            if (error.externalRetryAt) { nextPostAt = error.externalRetryAt; return; }
            failed(error.androidBusy ? 'busy' : 'send', null);
            runtime.warn('NATIVE_SEND');
        }
    }

    function arm() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        if (!running || runtime.shuttingDown) {
            return;
        }
        var now = clock(),
            due = Math.max(nextPostAt, now + runtime.externalRequestDelay('sync')),
            expiry = runtime.relayProjectionDeadline();
        if (active) {
            due = active.at + 10000;
        }
        if (expiry !== null) {
            due = Math.min(due, expiry);
        }
        var epoch = generation;
        timer = setTimeout(function() {
            timer = null;
            if (!running || epoch !== generation) {
                return;
            }
            var now = clock();
            if (active && now - active.at >= 10000) {
                cancel();
                failed('timeout', null);
            }
            if (expiry !== null && now >= expiry) {
                runtime.changed('station');
            }
            publish();
            arm();
        }, Math.max(1, due - now));
    }
    runtime.startAndroidPublisher = function(configuration, connection) {
        if (running) {
            return;
        }
        if (!connection || typeof connection.sendJson !== 'function') {
            throw new Error('NATIVE_WIRE');
        }
        settings = configuration;
        wire = connection;
        running = true;
        generation += 1;
        failures = 0;
        retryAt = 0;
        urgent = false;
        nextPostAt = clock();
        runtime.resetNativeTransport();
        publish();
        arm();
    };
    runtime.stopAndroidPublisher = function() {
        running = false;
        healthy = false;
        generation += 1;
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        cancel();
        wire = null;
        settings = null;
        runtime.nativeTransportConfirmedAt = null;
        runtime.clearRelayProjection();
    };
    runtime.androidRelayHealthy = function() {
        var now = clock();
        return running && healthy && !runtime.shuttingDown && now >= confirmedAt && now - confirmedAt < 45000;
    };
    runtime.androidPublisherStatus = function() {
        return {
            publisherActive: running,
            firstAcceptedPost: first,
            lastPost: lastPost,
            statusUpdatesConfirmed: 0,
            lastFailure: runtime.androidLastFailure()
        };
    };
    runtime.observeChanges(function(kind) {
        if (!running) {
            return;
        }
        if (kind === 'wishes' && clock() >= retryAt) {
            urgent = true;
            nextPostAt = Math.min(nextPostAt, clock());
            if (!processing) { publish(); }
        }
        if (!processing) { arm(); }
    });
};

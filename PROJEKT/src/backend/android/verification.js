/* Ausdrücklicher einmaliger Betreiber-POST; kein Aktivieren, Heartbeat oder Wunschversand. */
MischWerkModules.attachAndroidVerification = function (runtime, config) {
    'use strict';
    var active = null, lastAttempt = null;
    var target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    function allowed(user) { return !runtime.shuttingDown && runtime.isChannelOwner(user); }
    function reply(user, report) {
        try { if (allowed(user)) { user.sendPrivateMessage(JSON.stringify(report).escapeKCode()); } }
        catch (ignoredReply) { runtime.warn('ANDROID_VERIFICATION_REPLY'); }
    }
    runtime.cancelAndroidVerification = function (userId) {
        var old = active;
        if (!old || (userId !== undefined && old.userId !== userId)) { return; }
        active = null;
        clearTimeout(old.timer);
        if (typeof old.cancel === 'function') { old.cancel(); }
    };
    runtime.androidVerificationCommand = function (user, authProbe) {
        if (!allowed(user)) { return; }
        if (authProbe !== undefined && authProbe !== true) { return; }
        var now = runtime.now(), report = {
            schemaVersion: 1, check: authProbe ? 'native-signed-auth-post' : 'native-signed-status-post',
            app: { version: config.version, buildNumber: config.buildNumber },
            checkedAt: now, targetUrl: target, request: { stationUpdatedAt: null, wishUpdateCount: 0,
                encoding: 'data payload,ts,nonce,sig strings', authentication: 'HMAC-SHA256 UTF-8 signed body v1' },
            http: { status: null, callback: null, responseUrlMatches: null, jsonParsed: false, accepted: false, serverTime: null },
            configuration: { enabled: null, runtimeVerified: null, written: false, scope: 'request-start' }, nativeResponseAccepted: false,
            firestoreWriteConfirmed: null, errors: []
        };
        if (authProbe) {
            report.authenticationAccepted = false; report.request.payloadShape = 'empty-object';
            report.http.bodyRead = false;
            report.http.invalidPayloadConfirmed = null;
        }
        function rejected(code) { report.errors.push(code); reply(user, report); }
        if (active) { rejected('busy'); return; }
        if (typeof now !== 'number' || !isFinite(now) || now < 0 ||
                (lastAttempt !== null && now < lastAttempt)) { rejected('clock-invalid'); return; }
        if (lastAttempt !== null && now - lastAttempt < 30000) { rejected('retry-after-30-seconds'); return; }
        var entry = { userId: runtime.userId(user), timer: null, cancel: null }, station;
        function complete(result, error) {
            if (active !== entry) { return; }
            active = null; clearTimeout(entry.timer);
            if (error) {
                if (typeof entry.cancel === 'function') { entry.cancel(); }
                rejected(error); return;
            }
            if (!allowed(user)) { return; }
            var currentTime = runtime.now(), body = result && result.body;
            report.configuration.enabled = false; report.configuration.runtimeVerified = false;
            if (result && result.observation) { report.http = result.observation; }
            report.http.accepted = !!body && !Array.isArray(body) && body.accepted === true;
            report.http.serverTime = body && typeof body.serverTime === 'number' && isFinite(body.serverTime) ? body.serverTime : null;
            if (!result || result.configurationUnchanged !== true) { report.errors.push('configuration-changed'); }
            if (authProbe) {
                report.http.invalidPayloadConfirmed = null;
                if (!result || result.status !== 400 ||
                        typeof currentTime !== 'number' || !isFinite(currentTime) || currentTime < now || currentTime - now > 10000) {
                    report.errors.push('authentication-not-confirmed');
                }
                report.authenticationAccepted = report.errors.length === 0;
                reply(user, report); return;
            }
            if (!result || result.status !== 200 || report.http.accepted !== true || report.http.serverTime === null ||
                    typeof currentTime !== 'number' || !isFinite(currentTime) || currentTime < now || currentTime - now > 10000 ||
                    report.http.serverTime < currentTime - 45000 || report.http.serverTime > currentTime + 30000) {
                report.errors.push('response-not-accepted');
            }
            report.nativeResponseAccepted = report.errors.length === 0;
            reply(user, report);
        }
        try {
            if (!authProbe) {
                station = runtime.androidStationProjection(); station.updatedAt = runtime.nextAndroidProjectionTimestamp();
                report.request.stationUpdatedAt = station.updatedAt;
            }
            active = entry; lastAttempt = now;
            entry.timer = setTimeout(function () { complete(null, 'timeout'); }, 10000);
            var cancel = runtime.sendAndroidVerification(authProbe ? {} : { station: station, wishUpdates: [] },
                function (result) { complete(result, null); }, authProbe);
            report.configuration.enabled = false; report.configuration.runtimeVerified = false;
            if (active === entry) { entry.cancel = cancel; }
        } catch (ignoredSend) {
            if (active === entry) { complete(null, 'send-unavailable'); }
            else { rejected('send-unavailable'); }
        }
    };
};

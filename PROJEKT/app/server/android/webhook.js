/* Separater eingehender Wunschvertrag; keine Statuslesung und keine Benutzerattrappen. */
MischWerkModules.attachAndroidWebHook = function (runtime, wire) {
    'use strict';
    var key = 'android-wishes', settings = null, registered = false, endpoint = null, windowAt = 0, count = 0;
    var routingQuery = '', registration = null;
    function reply(response, status, accepted, value) {
        var result = accepted ? { accepted: true, position: value } : { accepted: false, relayCode: value };
        if (status === 429) { result.retryAfterSeconds = Math.max(1, Math.ceil((windowAt + 60000 - runtime.now()) / 1000)); }
        response.send(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff' }, JSON.stringify(result));
    }
    function header(request, name) {
        var headers = request.getHeaders(), values = [];
        Object.keys(headers || {}).forEach(function (key) {
            if (key.toLowerCase() === name) {
                if (Array.isArray(headers[key])) { values = values.concat(headers[key]); }
                else { values.push(String(headers[key])); }
            }
        });
        return values.length === 1 ? String(values[0]) : '';
    }
    function authorized(value) {
        if (!settings || value.length > 150) { return false; }
        var expected = 'Bearer ' + settings.relaySecret, difference = value.length ^ expected.length;
        for (var index = 0; index < expected.length; index += 1) {
            difference |= expected.charCodeAt(index) ^ (index < value.length ? value.charCodeAt(index) : 0);
        }
        return difference === 0;
    }
    function handle(request, response) {
        var target = response, sent = false;
        response = { send: function (status, headers, body) {
            if (sent) { return; }
            sent = true;
            try { target.send(status, headers, body); }
            catch (error) { runtime.warn('ANDROID_RESPONSE_SEND'); }
        } };
        try {
            if (!authorized(header(request, 'authorization'))) { reply(response, 401, false, 'INVALID'); return; }
            if (String(request.getMethod()) !== 'POST') { reply(response, 405, false, 'INVALID'); return; }
            if (String(request.getPath()) !== '/v1/wishes') { reply(response, 404, false, 'INVALID'); return; }
            var query = String(request.getQueryString() || '');
            if ((query && query !== routingQuery) || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(header(request, 'content-type'))) {
                reply(response, 400, false, 'INVALID'); return;
            }
            var raw = String(request.getBody() || '');
            if (raw.length > 4096 || runtime.jsonBytes(raw) > 4096) { reply(response, 413, false, 'INVALID'); return; }
            var data;
            try { data = JSON.parse(raw); } catch (error) { reply(response, 400, false, 'INVALID'); return; }
            if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'action,displayName,submissionId,text' ||
                    data.action !== 'submitWish' || typeof data.submissionId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.submissionId) ||
                    (data.displayName !== null && typeof data.displayName !== 'string')) {
                reply(response, 400, false, 'INVALID'); return;
            }
            try {
                data.text = runtime.text(data.text, 300, true);
                if (runtime.containsWishLink(data.text)) { throw new Error('ANDROID_TEXT'); }
            } catch (error) { reply(response, 400, false, 'INVALID'); return; }
            var old = runtime.androidReceipt(data.submissionId), items = runtime.wishItems();
            var item = items.filter(function (row) { return row.source === 'Android' && row.externalSubmissionId === data.submissionId; })[0];
            if (item || (old && old.committed)) {
                if (item && item.text !== data.text) { reply(response, 400, false, 'INVALID'); return; }
                reply(response, 200, true, item ? items.indexOf(item) + 1 : null); return;
            }
            if (!runtime.androidRelayHealthy() || runtime.state.requestsEnabled !== true) { reply(response, 409, false, 'CLOSED'); return; }
            if (runtime.now() - windowAt >= 60000 || runtime.now() < windowAt) { windowAt = runtime.now(); count = 0; }
            if (count >= 30 || !runtime.androidReceiptCapacity()) { reply(response, 429, false, 'RATE_LIMITED'); return; }
            runtime.enqueueAndroidWish(data, runtime.rememberAndroidWish, runtime.confirmAndroidWish); count += 1;
            reply(response, 200, true, runtime.wishItems().length);
            try { runtime.broadcast(); } catch (error) { runtime.warn('ANDROID_NOTIFY'); }
        } catch (error) { runtime.warn('ANDROID_WISH'); reply(response, 503, false, 'CLOSED'); }
    }
    runtime.androidWebHookRegistered = function () { return registered; };
    runtime.androidWebHookDiagnostics = function () { return registration ? JSON.parse(JSON.stringify(registration)) : null; };
    runtime.prepareAndroidWebHook = function (configuration) {
        if (runtime.shuttingDown) { throw new Error('ANDROID_SHUTDOWN'); }
        settings = configuration;
        if (registered) { return endpoint; }
        var phase = 'access-call';
        registration = { registerApiPresent: false, lookupApiPresent: false, registrationReturned: false,
            returnedType: null, lookupUsed: false, scheme: 'none', failedStage: null };
        function usable(base) { return base.length <= 2000 && /^https:\/\/[^\/\s@?#]+\/[^\s#]+$/.test(base); }
        try {
            if (typeof KnuddelsServer.getWebHookAccess !== 'function') { throw new Error('ANDROID_WEBHOOK_UNAVAILABLE'); }
            var access = KnuddelsServer.getWebHookAccess();
            registration.registerApiPresent = !!access && typeof access.registerWebHook === 'function';
            registration.lookupApiPresent = !!access && typeof access.getWebHookUrl === 'function';
            if (!registration.registerApiPresent) { throw new Error('ANDROID_WEBHOOK_UNAVAILABLE'); }
            phase = 'register-call';
            registered = true;
            var raw = access.registerWebHook(key, handle);
            registration.registrationReturned = raw !== null && raw !== undefined;
            registration.returnedType = typeof raw;
            var base = raw === null || raw === undefined ? '' : String(raw);
            if (!usable(base) && registration.lookupApiPresent) {
                phase = 'url-lookup'; registration.lookupUsed = true;
                raw = access.getWebHookUrl(key); base = raw === null || raw === undefined ? '' : String(raw);
            }
            phase = 'url-result';
            registration.scheme = /^https:\/\//.test(base) ? 'https' : /^http:\/\//.test(base) ? 'http' : base ? 'other' : 'none';
            if (!usable(base)) { throw new Error('ANDROID_WEBHOOK_URL'); }
            var separator = base.indexOf('?'), path = separator === -1 ? base : base.substring(0, separator);
            routingQuery = separator === -1 ? '' : base.substring(separator + 1);
            endpoint = path.replace(/\/$/, '') + '/v1/wishes' + (routingQuery ? '?' + routingQuery : ''); return endpoint;
        } catch (error) {
            registration.failedStage = phase;
            registration.error = runtime.androidRegistrationError(error, configuration);
            runtime.stopAndroidRelay();
            throw runtime.failure('Der AppServer hat den WebHook nicht bestätigt (' + phase + '). ' +
                registration.error.message + ' Die Verbindung bleibt ausgeschaltet.');
        }
    };
    runtime.startAndroidRelay = function () {
        if (runtime.shuttingDown) { return false; }
        if (runtime.androidPublisherStatus().publisherActive) { return true; }
        try {
            settings = runtime.readAndroidSettings();
            if (!settings) { return false; }
            var connection = wire || runtime.createAndroidWire(settings);
            if (!connection || typeof connection.sendJson !== 'function' || typeof KnuddelsServer.getWebHookAccess !== 'function') {
                runtime.warn('ANDROID_NOT_AVAILABLE'); return false;
            }
            runtime.startAndroidReceipts();
            runtime.prepareAndroidWebHook(settings);
            runtime.startAndroidPublisher(settings, connection);
            return true;
        } catch (error) { runtime.warn('ANDROID_START'); runtime.stopAndroidRelay(); return false; }
    };
    runtime.stopAndroidRelay = function () {
        if (typeof runtime.cancelAndroidVerification === 'function') { runtime.cancelAndroidVerification(); }
        runtime.stopAndroidPublisher(); settings = null; endpoint = null; routingQuery = '';
        if (registered) {
            registered = false;
            try { KnuddelsServer.getWebHookAccess().unregisterWebHook(key); }
            catch (error) { runtime.warn('ANDROID_STOP'); }
        }
    };
};

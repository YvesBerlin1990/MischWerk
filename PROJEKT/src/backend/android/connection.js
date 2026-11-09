/* Private Verbindungseinstellungen und dokumentierter postURL-Adapter; keine UI-Daten. */
MischWerkModules.attachAndroidConnection = function (runtime) {
    'use strict';
    var busy = false;
    runtime.readAndroidSettings = function () {
        var value = KnuddelsServer.getPersistence().getObject('mischwerk.android.private.v1', null);
        if (!value || value.enabled !== true) { return null; }
        function secret(text) { return typeof text === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(text); }
        if (!secret(value.syncSecret) ||
                typeof value.syncUrl !== 'string' ||
                !/^https:\/\/(?:radio-mischwerk\.web\.app\/api\/publishKnuddelsState|europe-west3-radio-mischwerk\.cloudfunctions\.net\/publishKnuddelsState|[a-z0-9-]+\.a\.run\.app\/?)$/.test(value.syncUrl)) {
            throw new Error('ANDROID_CONFIGURATION');
        }
        return { syncSecret: value.syncSecret, syncUrl: value.syncUrl,
            runtimeVerified: value.runtimeVerified === true };
    };
    function createWire(settings, verification, authProbe) {
        if (!settings || (!verification && settings.runtimeVerified !== true) || typeof KnuddelsServer.getExternalServerAccess !== 'function') { return null; }
        var external = KnuddelsServer.getExternalServerAccess();
        if (!external || typeof external.postURL !== 'function' || typeof external.canAccessURL !== 'function' ||
                external.canAccessURL(settings.syncUrl) !== true) { return null; }
        return { sendJson: function (request, finish) {
            if (busy) { var busyError = new Error('ANDROID_CONNECTION'); busyError.androidBusy = true; throw busyError; }
            if (request.url !== settings.syncUrl ||
                    external.canAccessURL(settings.syncUrl) !== true) { throw new Error('ANDROID_CONNECTION'); }
            var finished = false, cancelled = false;
            function complete(raw, response, failed) {
                if (finished) { return; }
                finished = true; busy = false;
                if (cancelled) { return; }
                var result = { status: 0, body: null }, code = null, matches = authProbe ? null : false, parsed = false;
                var stage = 'http_response';
                try {
                    code = Number(response.getResponseCode());
                    if (!isFinite(code) || code < 100 || code > 599 || Math.floor(code) !== code) { code = null; }
                    if (authProbe) { result.status = code === null ? 0 : code; }
                    else {
                        matches = String(response.getURLString()) === settings.syncUrl;
                        if (matches && code !== null) { result.status = code; }
                        var text = String(raw === null || raw === undefined ? '' : raw);
                        if (failed || code === null) { throw new Error('ANDROID_HTTP_RESPONSE'); }
                        stage = 'response_url';
                        if (!matches) { throw new Error('ANDROID_HTTP_RESPONSE'); }
                        stage = 'response_size';
                        if (text.length > 32768 || runtime.jsonBytes(text) > 32768) { throw new Error('ANDROID_HTTP_RESPONSE'); }
                        stage = 'response_json';
                        result = { status: code, body: JSON.parse(text) };
                        parsed = true;
                    }
                } catch (error) {
                    result.failureStage = stage;
                    if (!verification) { runtime.recordAndroidFailure(stage, code); }
                    runtime.warn('ANDROID_HTTP_RESPONSE');
                }
                if (verification) { result.observation = { status: code, callback: failed ? 'failure' : 'success',
                    responseUrlMatches: matches, jsonParsed: parsed }; }
                if (authProbe) { result.observation.bodyRead = false; }
                finish(result);
            }
            busy = true;
            try {
                var signed = runtime.createAndroidSignedData(request.body, settings.syncSecret);
                external.postURL(settings.syncUrl, {
                    data: signed,
                    onSuccess: function (raw, response) { complete(raw, response, false); },
                    onFailure: function (raw, response) { complete(raw, response, true); }
                });
            } catch (error) { if (!finished) { busy = false; finished = true; throw new Error('ANDROID_HTTP_SEND'); } }
            // Die API belegt keinen Netzwerkabbruch. Bis zum echten Callback bleibt der Port belegt.
            return function () { cancelled = true; };
        } };
    }
    runtime.createAndroidWire = function (settings) { return createWire(settings, false); };
    runtime.sendAndroidVerification = function (body, finish, authProbe) {
        if (authProbe !== undefined && authProbe !== true) { throw new Error('ANDROID_VERIFICATION_MODE'); }
        if (authProbe === true && (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length)) {
            throw new Error('ANDROID_AUTH_PROBE_BODY');
        }
        function read() {
            var value = KnuddelsServer.getPersistence().getObject('mischwerk.android.private.v1', null);
            if (!value || value.enabled !== false || value.runtimeVerified !== false ||
                    typeof value.syncSecret !== 'string' || !/^[a-zA-Z0-9_-]{43,128}$/.test(value.syncSecret) ||
                    value.syncUrl !== 'https://radio-mischwerk.web.app/api/publishKnuddelsState') {
                throw new Error('ANDROID_VERIFICATION_CONFIGURATION');
            }
            return { syncUrl: value.syncUrl, syncSecret: value.syncSecret, revision: value.revision };
        }
        var settings = read(), wire = createWire(settings, true, authProbe === true);
        if (!wire) { throw new Error('ANDROID_VERIFICATION_UNAVAILABLE'); }
        return wire.sendJson({ url: settings.syncUrl, body: body }, function (result) {
            try { result.configurationUnchanged = JSON.stringify(read()) === JSON.stringify(settings); }
            catch (ignoredRead) { result.configurationUnchanged = false; }
            finish(result);
        });
    };
};

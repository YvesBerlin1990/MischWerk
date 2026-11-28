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
    function createWire(settings) {
        if (!settings || settings.runtimeVerified !== true || typeof KnuddelsServer.getExternalServerAccess !== 'function') { return null; }
        var external = KnuddelsServer.getExternalServerAccess();
        if (!external || typeof external.postURL !== 'function' || typeof external.canAccessURL !== 'function' ||
                external.canAccessURL(settings.syncUrl) !== true) { return null; }
        return { sendJson: function (request, finish) {
            if (busy) { var busyError = new Error('ANDROID_CONNECTION'); busyError.androidBusy = true; throw busyError; }
            if (request.url !== settings.syncUrl ||
                    external.canAccessURL(settings.syncUrl) !== true) { throw new Error('ANDROID_CONNECTION'); }
            var finished = false, cancelled = false, finishBudget = null;
            function complete(raw, response, failed) {
                if (finished) { return; }
                finished = true; busy = false;
                finishBudget();
                if (cancelled) { return; }
                var result = { status: 0, body: null }, code = null, matches = false;
                var stage = 'http_response';
                try {
                    code = Number(response.getResponseCode());
                    if (!isFinite(code) || code < 100 || code > 599 || Math.floor(code) !== code) { code = null; }
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
                } catch (error) {
                    result.failureStage = stage;
                    result.failureStatus = code;
                    runtime.recordAndroidFailure(stage, code);
                    runtime.warn('ANDROID_HTTP_RESPONSE');
                }
                finish(result);
            }
            var signed = runtime.createAndroidSignedData(request.body, settings.syncSecret);
            finishBudget = runtime.beginExternalRequest('sync');
            busy = true;
            try {
                external.postURL(settings.syncUrl, {
                    data: signed,
                    onSuccess: function (raw, response) { complete(raw, response, false); },
                    onFailure: function (raw, response) { complete(raw, response, true); }
                });
            } catch (error) { if (!finished) { finishBudget(); busy = false; finished = true; throw new Error('ANDROID_HTTP_SEND'); } }
            // Die API belegt keinen Netzwerkabbruch. Bis zum echten Callback bleibt der Port belegt.
            return function () { cancelled = true; };
        } };
    }
    runtime.createAndroidWire = createWire;
};

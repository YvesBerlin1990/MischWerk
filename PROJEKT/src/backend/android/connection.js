/* Private Verbindungseinstellungen und dokumentierter postURL-Adapter; keine UI-Daten. */
MischWerkModules.attachAndroidConnection = function (runtime) {
    'use strict';
    var busy = false;
    runtime.readAndroidSettings = function () {
        var value = KnuddelsServer.getPersistence().getObject('mischwerk.android.private.v1', null);
        if (!value || value.enabled !== true) { return null; }
        function secret(text) { return typeof text === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(text); }
        if (!secret(value.relaySecret) || !secret(value.syncSecret) || value.relaySecret === value.syncSecret ||
                typeof value.syncUrl !== 'string' ||
                !/^https:\/\/(?:radio-mischwerk\.web\.app\/api\/publishKnuddelsState|europe-west3-radio-mischwerk\.cloudfunctions\.net\/publishKnuddelsState|[a-z0-9-]+\.a\.run\.app\/?)$/.test(value.syncUrl)) {
            throw new Error('ANDROID_CONFIGURATION');
        }
        return { relaySecret: value.relaySecret, syncSecret: value.syncSecret, syncUrl: value.syncUrl,
            runtimeVerified: value.runtimeVerified === true };
    };
    runtime.createAndroidWire = function (settings) {
        if (!settings || settings.runtimeVerified !== true || typeof KnuddelsServer.getExternalServerAccess !== 'function') { return null; }
        var external = KnuddelsServer.getExternalServerAccess();
        if (!external || typeof external.postURL !== 'function' || typeof external.canAccessURL !== 'function' ||
                external.canAccessURL(settings.syncUrl) !== true) { return null; }
        return { sendJson: function (request, finish) {
            if (request.url !== settings.syncUrl || request.authorization !== 'Bearer ' + settings.syncSecret ||
                    external.canAccessURL(settings.syncUrl) !== true || busy) { throw new Error('ANDROID_CONNECTION'); }
            var finished = false, cancelled = false;
            function complete(raw, response, failed) {
                if (finished) { return; }
                finished = true; busy = false;
                if (cancelled) { return; }
                var result = { status: 0, body: null };
                try {
                    var text = String(raw === null || raw === undefined ? '' : raw);
                    var code = Number(response.getResponseCode());
                    if (failed || text.length > 4096 || runtime.jsonBytes(text) > 4096 ||
                            !isFinite(code) || code < 100 || code > 599 || Math.floor(code) !== code ||
                            String(response.getURLString()) !== settings.syncUrl) { throw new Error('ANDROID_HTTP_RESPONSE'); }
                    result = { status: code, body: JSON.parse(text) };
                } catch (error) { runtime.warn('ANDROID_HTTP_RESPONSE'); }
                finish(result);
            }
            busy = true;
            try {
                external.postURL(settings.syncUrl, {
                    data: { payload: JSON.stringify(request.body) },
                    header: { Authorization: request.authorization },
                    onSuccess: function (raw, response) { complete(raw, response, false); },
                    onFailure: function (raw, response) { complete(raw, response, true); }
                });
            } catch (error) { if (!finished) { busy = false; finished = true; throw new Error('ANDROID_HTTP_SEND'); } }
            // Die API belegt keinen Netzwerkabbruch. Bis zum echten Callback bleibt der Port belegt.
            return function () { cancelled = true; };
        } };
    };
};

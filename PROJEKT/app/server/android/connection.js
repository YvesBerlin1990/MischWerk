/* Private Verbindungseinstellungen und dokumentierter postURL-Adapter; keine UI-Daten. */
MischWerkModules.attachAndroidConnection = function (runtime) {
    'use strict';
    var busy = false;
    runtime.androidRegistrationError = function (error, settings) {
        var name = 'Error', message = '';
        try {
            var givenName = String(error && error.name || 'Error');
            if (/^(?:Error|TypeError|ReferenceError|RangeError|InternalError|JavaException|WrappedException)$/.test(givenName)) { name = givenName; }
            message = String(error && error.message || '');
        } catch (ignoredRead) { message = ''; }
        if (message.length > 4096) { message = ''; }
        [settings && settings.syncSecret, settings && settings.relaySecret].forEach(function (value) {
            if (typeof value === 'string' && value) { message = message.split(value).join('[Schlüssel entfernt]'); }
        });
        message = message.split(/[\r\n]/)[0]
            .replace(/https?:\/\/[^\s<>"']+/gi, '[URL entfernt]')
            .replace(/\bBearer\s+\S+/gi, '[Authentisierung entfernt]')
            .replace(/(['"])[^'"\r\n]*\1/g, '[Wert entfernt]')
            .replace(/[A-Za-z0-9_-]{32,}/g, '[Wert entfernt]')
            .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '[Adresse entfernt]')
            .replace(/[A-Za-z]:\\[^\s,;]+/g, '[Pfad entfernt]')
            .replace(/\/(?:home|Users|var|tmp|opt)\/[^\s,;]+/g, '[Pfad entfernt]')
            .replace(/\s+/g, ' ').trim();
        if (!message || (name === 'Error' && !/webhook|permission|denied|disabled|not (?:enabled|configured|initialized|allowed|supported)|unsupported|cannot|can't find method|exception|invalid/i.test(message))) {
            message = 'Keine freigegebene kurze AppServer-Meldung verfügbar.';
        }
        return { name: name, message: message.substring(0, 260) };
    };
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
    function createWire(settings, verification, authProbe) {
        if (!settings || (!verification && settings.runtimeVerified !== true) || typeof KnuddelsServer.getExternalServerAccess !== 'function') { return null; }
        var external = KnuddelsServer.getExternalServerAccess();
        if (!external || typeof external.postURL !== 'function' || typeof external.canAccessURL !== 'function' ||
                external.canAccessURL(settings.syncUrl) !== true) { return null; }
        return { sendJson: function (request, finish) {
            if (request.url !== settings.syncUrl ||
                    external.canAccessURL(settings.syncUrl) !== true || busy) { throw new Error('ANDROID_CONNECTION'); }
            var finished = false, cancelled = false;
            function complete(raw, response, failed) {
                if (finished) { return; }
                finished = true; busy = false;
                if (cancelled) { return; }
                var result = { status: 0, body: null }, code = null, matches = authProbe ? null : false, parsed = false;
                try {
                    code = Number(response.getResponseCode());
                    if (!isFinite(code) || code < 100 || code > 599 || Math.floor(code) !== code) { code = null; }
                    if (authProbe) { result.status = code === null ? 0 : code; }
                    else {
                        matches = String(response.getURLString()) === settings.syncUrl;
                        if (matches && code !== null) { result.status = code; }
                        var text = String(raw === null || raw === undefined ? '' : raw);
                        if (failed || text.length > 4096 || runtime.jsonBytes(text) > 4096 ||
                                code === null || !matches) { throw new Error('ANDROID_HTTP_RESPONSE'); }
                        result = { status: code, body: JSON.parse(text) };
                        parsed = true;
                    }
                } catch (error) { runtime.warn('ANDROID_HTTP_RESPONSE'); }
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

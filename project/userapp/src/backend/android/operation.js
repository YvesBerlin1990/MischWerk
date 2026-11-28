/* Ausdrückliche reguläre Freigabe in der bereits berechtigten privaten Owner-Sitzung. */
MischWerkModules.attachAndroidOperation = function (runtime, config) {
    'use strict';
    var key = 'mischwerk.android.private.v1';
    runtime.androidTargetKind = function (url) {
        if (url === 'https://radio-mischwerk.web.app/api/publishKnuddelsState') { return 'hosting'; }
        if (typeof url === 'string' && /^https:\/\/europe-west3-radio-mischwerk\.cloudfunctions\.net\//.test(url)) { return 'cloud-functions'; }
        return typeof url === 'string' && /^https:\/\/[a-z0-9-]+\.a\.run\.app\/?$/.test(url) ? 'cloud-run' : 'unknown';
    };
    function complete(value) {
        function secret(text) { return typeof text === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(text); }
        return secret(value.syncSecret) &&
            value.syncUrl === 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    }
    runtime.androidOperationState = function () {
        var value = runtime.androidPublisherStatus();
        value.healthy = runtime.androidRelayHealthy();
        value.transport = 'status-response-v2';
        value.queueReturn = runtime.androidIncomingStatus();
        return value;
    };
    runtime.runAndroidOperation = function (action, previous) {
        var next = JSON.parse(JSON.stringify(previous)), saved = false;
        if (action !== 'activate' && action !== 'deactivate') { throw new Error('ANDROID_OPERATION'); }
        if (previous.revision >= 999999999) { throw new Error('ANDROID_REVISION'); }
        if (action === 'activate') {
            if (!complete(previous)) { throw runtime.failure('Bitte zuerst den Sync-Schlüssel speichern.'); }
            if (previous.enabled === true && previous.runtimeVerified === true && runtime.androidPublisherStatus().publisherActive) {
                return { message: 'Die Verbindung ist bereits aktiviert.' };
            }
            next.enabled = true; next.runtimeVerified = true;
            if (!runtime.createAndroidWire(next)) { throw runtime.failure('Die Statusverbindung ist auf diesem AppServer nicht verfügbar.'); }
        } else {
            runtime.stopAndroidRelay(); next.enabled = false; next.runtimeVerified = false;
        }
        next.revision = (typeof previous.revision === 'number' ? previous.revision : 0) + 1;
        try {
            KnuddelsServer.getPersistence().setObject(key, next); saved = true;
            if (action === 'activate' && runtime.startAndroidRelay() !== true) { throw new Error('ANDROID_START'); }
        } catch (error) {
            runtime.stopAndroidRelay();
            if (saved && action === 'activate') {
                next.enabled = false; next.runtimeVerified = false; next.revision += 1;
                try { KnuddelsServer.getPersistence().setObject(key, next); }
                catch (ignoredRollback) { runtime.warn('ANDROID_DISABLE_SAVE'); }
            }
            throw runtime.failure('Die Verbindung konnte nicht vollständig umgestellt werden. Bitte Status neu laden.');
        }
        return { message: action === 'activate' ? 'Verbindung aktiviert. Der aktuelle Status wird jetzt übertragen.' : 'Verbindung ausgeschaltet.' };
    };
};

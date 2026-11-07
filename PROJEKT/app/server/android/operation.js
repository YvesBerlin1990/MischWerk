/* Ausdrückliche reguläre Freigabe in der bereits berechtigten privaten Owner-Sitzung. */
MischWerkModules.attachAndroidOperation = function (runtime, config) {
    'use strict';
    var key = 'mischwerk.android.private.v1';
    function complete(value) {
        function secret(text) { return typeof text === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(text); }
        return secret(value.syncSecret) && secret(value.relaySecret) && value.syncSecret !== value.relaySecret &&
            value.syncUrl === 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    }
    runtime.androidOperationState = function () {
        var value = runtime.androidPublisherStatus();
        value.webhookRegistered = runtime.androidWebHookRegistered();
        value.webhookRegistration = runtime.androidWebHookDiagnostics();
        return value;
    };
    runtime.androidOperationReport = function (user) {
        if (runtime.shuttingDown || !runtime.isChannelOwner(user)) { return; }
        try {
            var stored = KnuddelsServer.getPersistence().getObject(key, null) || {}, state = runtime.androidOperationState();
            var first = state.firstAcceptedPost;
            user.sendPrivateMessage(JSON.stringify({ build: config.buildNumber, version: config.version,
                publisherActive: state.publisherActive,
                flags: { enabled: stored.enabled === true, runtimeVerified: stored.runtimeVerified === true },
                firstRegularPost: first ? { atUtc: new Date(first.at).toISOString(), status: first.status, accepted: first.accepted } : null,
                relaySecretConfigured: typeof stored.relaySecret === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(stored.relaySecret),
                webhookRegistered: state.webhookRegistered,
                webhookRegistration: state.webhookRegistration }).escapeKCode());
        } catch (ignoredReport) { runtime.warn('ANDROID_STATUS_REPORT'); }
    };
    runtime.runAndroidOperation = function (action, previous) {
        var next = JSON.parse(JSON.stringify(previous)), saved = false;
        if (action === 'prepare') {
            if (!complete(previous)) { throw runtime.failure('Bitte zuerst beide unterschiedlichen Schlüssel speichern.'); }
            return { webhookUrl: runtime.prepareAndroidWebHook(previous),
                message: 'WebHook bereit. Die vollständige Adresse ausschließlich geschützt in KNUDDELS_WEBHOOK_URL hinterlegen.' };
        }
        if (action !== 'activate' && action !== 'deactivate') { throw new Error('ANDROID_OPERATION'); }
        if (previous.revision >= 999999999) { throw new Error('ANDROID_REVISION'); }
        if (action === 'activate') {
            if (!complete(previous)) { throw runtime.failure('Bitte zuerst beide unterschiedlichen Schlüssel speichern.'); }
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
            if (action === 'activate') { runtime.prepareAndroidWebHook(next); }
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

/* Bestehenden Statuspublisher ohne eingehenden HTTP-Endpunkt starten und stoppen. */
MischWerkModules.attachAndroidRelay = function (runtime, wire) {
    'use strict';
    runtime.startAndroidRelay = function () {
        if (runtime.shuttingDown) { return false; }
        if (runtime.androidPublisherStatus().publisherActive) { return true; }
        try {
            var settings = runtime.readAndroidSettings();
            if (!settings) { return false; }
            var connection = wire || runtime.createAndroidWire(settings);
            if (!connection || typeof connection.sendJson !== 'function') { runtime.warn('ANDROID_NOT_AVAILABLE'); return false; }
            runtime.startAndroidReceipts();
            runtime.startAndroidPublisher(settings, connection); return true;
        } catch (error) { runtime.warn('ANDROID_START'); runtime.stopAndroidRelay(); return false; }
    };
    runtime.stopAndroidRelay = function () {
        if (typeof runtime.cancelAndroidVerification === 'function') { runtime.cancelAndroidVerification(); }
        runtime.stopAndroidPublisher();
    };
};

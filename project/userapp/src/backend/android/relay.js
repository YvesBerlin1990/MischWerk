/* V2-Abgleich startet ausschließlich über die vorhandene private Betriebsfreigabe. */
MischWerkModules.attachAndroidRelay = function(runtime, wire) {
    'use strict';
    runtime.startAndroidRelay = function() {
        if (runtime.shuttingDown) {
            return false;
        }
        if (runtime.androidPublisherStatus().publisherActive) {
            return true;
        }
        try {
            var settings = runtime.readAndroidSettings();
            if (!settings) {
                return false;
            }
            var connection = wire || runtime.createAndroidWire(settings);
            if (!connection) {
                return false;
            }
            runtime.startAndroidPublisher(settings, connection);
            return true;
        } catch (error) {
            runtime.warn('ANDROID_START');
            runtime.stopAndroidRelay();
            return false;
        }
    };
    runtime.stopAndroidRelay = function() {
        runtime.stopAndroidPublisher();
    };
};

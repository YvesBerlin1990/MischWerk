/* Erstladen koordinieren: Speicher lesen, danach die Studio-Anmeldung prüfen. */
MischWerkModules.attachStateInitialization = function (runtime) {
    'use strict';
    runtime.load = function () {
        if (runtime.state) { return; }
        runtime.readState();
        runtime.prune();
        runtime.initializeStudioAnnouncements();
    };
};

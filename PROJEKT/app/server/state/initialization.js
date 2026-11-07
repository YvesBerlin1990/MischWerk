/* Erstladen koordinieren: Speicher lesen, danach die Studio-Anmeldung prüfen. */
MischWerkModules.attachStateInitialization = function (runtime) {
    'use strict';
    runtime.load = function () {
        if (runtime.state) {
            if (runtime.state.scheduleSync) { runtime.persist(runtime.copy(runtime.state)); }
            return;
        }
        runtime.readState();
        if (runtime.state.scheduleSync) { runtime.persist(runtime.copy(runtime.state)); }
        runtime.prune();
        runtime.initializeStudioAnnouncements();
    };
};

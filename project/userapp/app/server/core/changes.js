/* Interne Änderungen beobachten, ohne Fachmodule an einen externen Empfänger zu koppeln. */
MischWerkModules.attachChanges = function (runtime) {
    'use strict';
    var listeners = [];
    runtime.observeChanges = function (listener) { listeners.push(listener); };
    runtime.changed = function (kind, value) {
        listeners.forEach(function (listener) {
            try { listener(kind, value); }
            catch (error) { runtime.warn('ANDROID_CHANGE'); }
        });
    };
};

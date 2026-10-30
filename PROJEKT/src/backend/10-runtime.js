/* Gemeinsamer Laufzeitkern und kleine, fachunabhängige Hilfsfunktionen. */
MischWerkModules.createRuntime = function (config) {
    'use strict';
    var runtime = {
        key: 'mischwerk.state.v1',
        pageSize: 1,
        state: null,
        views: [],
        shuttingDown: false,
        lastWarningAt: 0,
        inactiveModeratorKey: null
    };

    runtime.now = function () { return new Date().getTime(); };
    runtime.copy = function (value) { return JSON.parse(JSON.stringify(value)); };
    runtime.failure = function (message) {
        var error = new Error(message);
        error.publicMessage = message;
        return error;
    };
    runtime.warn = function () {
        if (runtime.lastWarningAt && runtime.now() - runtime.lastWarningAt < 60000) { return; }
        runtime.lastWarningAt = runtime.now();
        try { KnuddelsServer.getDefaultLogger().warn('MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.'); }
        catch (ignored) { /* Fehler beim Loggen darf den App-Zustand nicht ändern. */ }
    };
    runtime.jsonBytes = function (value) {
        var length = 0;
        for (var i = 0; i < value.length; i += 1) {
            var code = value.charCodeAt(i);
            if (code < 128) { length += 1; }
            else if (code < 2048) { length += 2; }
            else if (code >= 55296 && code <= 56319 && i + 1 < value.length &&
                    value.charCodeAt(i + 1) >= 56320 && value.charCodeAt(i + 1) <= 57343) { length += 4; i += 1; }
            else { length += 3; }
        }
        return length;
    };

    return runtime;
};

/* Gemeinsamer Laufzeitkern und kleine, fachunabhängige Hilfsfunktionen. */
MischWerkModules.createRuntime = function (config) {
    'use strict';
    var runtime = {
        key: 'mischwerk.state.v1',
        pageSize: 1,
        radioModeratorPageSize: 5,
        maxReplayEntries: 100,
        emergencyReplayEntries: 20,
        state: null,
        views: [],
        shuttingDown: false,
        warningTimes: {},
        inactiveModeratorKey: null
    };

    runtime.now = function () { return new Date().getTime(); };
    runtime.copy = function (value) { return JSON.parse(JSON.stringify(value)); };
    runtime.failure = function (message) {
        var error = new Error(message);
        error.publicMessage = message;
        return error;
    };
    runtime.numericUserId = function (value) {
        var userId = Number(value);
        if (!isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
            throw runtime.failure('Die Knuddels-Nutzer-ID konnte nicht verarbeitet werden. Bitte öffne MischWerk erneut.');
        }
        return userId;
    };
    runtime.userId = function (user) { return runtime.numericUserId(user.getUserId()); };
    runtime.nick = function (user) { return String(user.getNick()); };
    runtime.warn = function (operation) {
        var tag = typeof operation === 'string' && /^[A-Z_]{1,30}$/.test(operation) ? operation : 'GENERAL';
        if (runtime.warningTimes[tag] && runtime.now() - runtime.warningTimes[tag] < 60000) { return; }
        runtime.warningTimes[tag] = runtime.now();
        var context = tag === 'GENERAL' ? '' : ' [' + tag + ']';
        try { KnuddelsServer.getDefaultLogger().warn('MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.' + context); }
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

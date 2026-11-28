/* Datensparsame Phasen- und Fehlerdiagnose. */
MischWerkModules.attachDiagnostics = function (runtime, config) {
    'use strict';
    var warningTimes = {};
    runtime.warn = function (operation, error) {
        var tag = typeof operation === 'string' && /^[A-Z_]{1,30}$/.test(operation) ? operation : 'GENERAL';
        if (warningTimes[tag] && runtime.now() - warningTimes[tag] < 60000) { return; }
        warningTimes[tag] = runtime.now();
        var context = tag === 'GENERAL' ? '' : ' [' + tag + ']';
        var connection = /^(?:ANDROID_HTTP_RESPONSE|NATIVE_(?:RESPONSE|SEND|PREPARE))$/.test(tag);
        if (connection && typeof runtime.androidLastFailure === 'function') {
            var failure = runtime.androidLastFailure();
            if (failure) {
                context += ' [Stufe:' + failure.stage + ']';
                if (failure.httpStatus !== null) { context += ' [HTTP:' + failure.httpStatus + ']'; }
            }
        }
        // Ausschließlich Typ und Quellzeile, niemals Exception-Text, Stack oder Nutzdaten loggen.
        try {
            if (error && /^(?:Error|SyntaxError|TypeError|RangeError|ReferenceError|URIError|EvalError)$/.test(String(error.name))) {
                context += ' [' + String(error.name) + ']';
            }
            if (error && typeof error.lineNumber === 'number' && error.lineNumber > 0 && isFinite(error.lineNumber)) {
                context += ' [Backend-Zeile:' + Math.floor(error.lineNumber) + ']';
            }
        } catch (ignoredDetails) { /* Diagnose darf keinen Folgefehler auslösen. */ }
        var message = connection ? 'MischWerk: Der Verbindungsabgleich konnte nicht bestätigt werden.' :
            tag.indexOf('WISH_') === 0 ? 'MischWerk: Musikwunsch konnte nicht verarbeitet werden.' :
            'MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.';
        try { KnuddelsServer.getDefaultLogger().warn(message + context); }
        catch (ignored) { /* Fehler beim Loggen darf den App-Zustand nicht ändern. */ }
    };
};

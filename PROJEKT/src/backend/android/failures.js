/* Flüchtige private Diagnose: feste Stufen, HTTP-Code und UTC, ohne Nutzdaten oder Fehlerobjekte. */
MischWerkModules.attachAndroidFailures = function (runtime) {
    'use strict';
    var last = null;
    runtime.recordAndroidFailure = function (stage, status) {
        if (['prepare', 'send', 'timeout', 'http_response', 'response_url', 'response_size',
                'response_json', 'response_contract', 'command_storage'].indexOf(stage) < 0) { return; }
        var now = runtime.now();
        if (typeof now !== 'number' || !isFinite(now) || Math.abs(now) > 8640000000000000) { return; }
        last = { stage: stage, httpStatus: typeof status === 'number' && isFinite(status) &&
            Math.floor(status) === status && status >= 100 && status <= 599 ? status : null,
            atUtc: new Date(now).toISOString() };
    };
    runtime.androidLastFailure = function () { return last ? runtime.copy(last) : null; };
};

/* Technische Wiederholungsbelege in den vorhandenen Team-/Wochendaten, ohne neue Ablage. */
MischWerkModules.attachRelayResults = function (runtime) {
    'use strict';
    runtime.relayInteger = function (value) {
        return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 9007199254740991 && Math.floor(value) === value;
    };
    runtime.relayFailure = function (reason) {
        var error = new Error('RELAY_COMMAND'); error.relayReason = reason; return error;
    };
    runtime.relayResultRows = function (target, field) {
        var rows = target[field] || [];
        if (!Array.isArray(rows) || rows.length > 64 || rows.some(function (row) {
            return !row || typeof row.commandId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(row.commandId) ||
                ['applied', 'rejected'].indexOf(row.state) < 0 ||
                (row.reason !== undefined && ['revision_conflict', 'validation', 'business_rule'].indexOf(row.reason) < 0) ||
                (row.revision !== null && !runtime.relayInteger(row.revision));
        })) { throw new Error('RELAY_RESULTS'); }
        return rows;
    };
    runtime.addRelayResult = function (target, field, result) {
        var rows = runtime.relayResultRows(target, field).filter(function (row) { return row.commandId !== result.commandId; });
        target[field] = rows.concat([result]).slice(-64);
    };
};

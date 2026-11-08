/* Technische Wiederholungsbelege in den vorhandenen Team-/Wochendaten, ohne neue Ablage. */
MischWerkModules.attachRelayResults = function (runtime) {
    'use strict';
    runtime.relayResultRows = function (target, field) {
        var rows = target[field] || [];
        if (!Array.isArray(rows) || rows.length > 64 || rows.some(function (row) {
            return !row || typeof row.commandId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(row.commandId) ||
                ['applied', 'rejected'].indexOf(row.state) < 0 || (row.revision !== null &&
                (typeof row.revision !== 'number' || !isFinite(row.revision) || row.revision < 0 || Math.floor(row.revision) !== row.revision));
        })) { throw new Error('RELAY_RESULTS'); }
        return rows;
    };
    runtime.addRelayResult = function (target, field, result) {
        var rows = runtime.relayResultRows(target, field).filter(function (row) { return row.commandId !== result.commandId; });
        target[field] = rows.concat([result]).slice(-64);
    };
};

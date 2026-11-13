/* Ausschließlich aus bestätigten regulären Relay-Antworten; keine Clientrollen oder Benutzerattrappen. */
MischWerkModules.attachRelayCommands = function (runtime) {
    'use strict';
    var sent = {}, transient = { schedule: [], moderator: [] }, urgent = { schedule: [], moderator: [] };
    function idValid(row) { return row && typeof row.commandId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(row.commandId); }
    function exact(row, fields) {
        return row && typeof row === 'object' && !Array.isArray(row) && Object.keys(row).length === fields.length &&
            Object.keys(row).every(function (key) { return fields.indexOf(key) >= 0; });
    }
    function results(kind) {
        var rows = transient[kind].slice();
        if (kind === 'moderator') { return rows.concat(runtime.relayResultRows(runtime.state, 'moderatorRelayResults')); }
        runtime.scheduleWeeks().forEach(function (week) {
            rows = rows.concat(runtime.relayResultRows(runtime.readScheduleWeek(week), 'relayResults'));
        });
        return rows;
    }
    function find(kind, id) { return results(kind).filter(function (row) { return row.commandId === id; })[0] || null; }
    function requeue(kind, row) {
        delete sent[kind + '$' + row.commandId];
        urgent[kind] = [row.commandId].concat(urgent[kind].filter(function (id) { return id !== row.commandId; })).slice(0, 64);
    }
    function reject(kind, row, week, revision, reason) {
        var result = { commandId: row.commandId, state: 'rejected', revision: revision, reason: reason };
        if (kind === 'schedule' && week) { runtime.recordScheduleRelayResult(week, result); }
        else if (kind === 'moderator') { runtime.recordModeratorRelayResult(result); }
        else { transient[kind] = transient[kind].concat([result]).slice(-64); }
        requeue(kind, result);
    }
    function apply(kind, row) {
        if (!idValid(row) || Array.isArray(row)) { runtime.warn('RELAY_COMMAND_ID'); return; }
        var week = null, revision = null;
        try {
            var old = find(kind, row.commandId);
            if (old) { requeue(kind, old); return; }
            if (kind === 'schedule') {
                try { if (runtime.scheduleWeek(row.week) !== row.week) { throw new Error('week'); } }
                catch (weekError) { throw runtime.relayFailure('validation'); }
                week = row.week; revision = runtime.readScheduleWeek(week).revision;
            } else { revision = runtime.state.radioModeratorRevision; }
            // Firebase prüft Konto, App Check und Rechte vor dieser regulären Relay-Antwort.
            if (!runtime.relayInteger(row.expectedRevision)) { throw runtime.relayFailure('validation'); }
            if (!runtime.relayInteger(revision) || runtime.shuttingDown) { throw new Error('RELAY_STATE'); }
            if (row.expectedRevision !== revision) { throw runtime.relayFailure('revision_conflict'); }
            if (kind === 'schedule') {
                if (!exact(row, ['commandId', 'operation', 'week', 'expectedRevision', 'id', 'entry']) ||
                        ['save', 'delete'].indexOf(row.operation) < 0 || typeof row.id !== 'string' ||
                        !/^[a-zA-Z0-9_-]{1,128}$/.test(row.id)) { throw runtime.relayFailure('validation'); }
                if (row.operation === 'save') {
                    var entry = row.entry, hour = /^(?:[01][0-9]|2[0-3]):00$/;
                    if (!exact(entry, ['date', 'kind', 'timing', 'start', 'end', 'nick', 'topic']) ||
                            Object.keys(entry).some(function (key) { return typeof entry[key] !== 'string'; }) ||
                            ['live', 'autodj'].indexOf(entry.kind) < 0 || ['fixed', 'allDay', 'openEnd'].indexOf(entry.timing) < 0 ||
                            !hour.test(entry.start) || (entry.timing === 'fixed' ? !hour.test(entry.end) : entry.end !== '')) {
                        throw runtime.relayFailure('validation');
                    }
                } else if (row.entry !== null) { throw runtime.relayFailure('validation'); }
                var changed = runtime.changeScheduleFromRelay(row);
                if (changed) { runtime.changed('schedule', week); }
            } else {
                if (!exact(row, ['commandId', 'operation', 'expectedRevision', 'nick']) ||
                        ['add', 'remove'].indexOf(row.operation) < 0) { throw runtime.relayFailure('validation'); }
                var teamData = { nick: row.nick, expectedRadioModeratorRevision: row.expectedRevision };
                changed = runtime.changeRadioModeratorFromRelay(row.operation === 'add' ? 'mw:addRadioModerator' : 'mw:removeRadioModerator', teamData, row.commandId);
            }
            requeue(kind, find(kind, row.commandId));
            return changed;
        } catch (error) {
            // Ein Fehler nach fachlichem Commit darf eine gespeicherte Annahme nicht in Ablehnung umdeuten.
            try {
                var committed = find(kind, row.commandId);
                if (committed) { requeue(kind, committed); return; }
                if (!error.relayReason) { throw error; }
                if (kind === 'moderator') { revision = runtime.state.radioModeratorRevision; }
                else if (week) { revision = runtime.readScheduleWeek(week).revision; }
                reject(kind, row, week, runtime.relayInteger(revision) ? revision : null, error.relayReason);
            } catch (writeError) {
                runtime.recordAndroidFailure('command_storage', null); runtime.warn('RELAY_COMMAND_STORAGE');
            }
        }
    }
    runtime.pendingRelayResults = function () {
        var body = {}, retained = {};
        ['schedule', 'moderator'].forEach(function (kind) {
            try {
                var all = results(kind), priority = urgent[kind];
                all = all.filter(function (row) { return priority.indexOf(row.commandId) >= 0; })
                    .concat(all.filter(function (row) { return priority.indexOf(row.commandId) < 0; }));
                var rows = all.filter(function (row) {
                    var key = kind + '$' + row.commandId, value = JSON.stringify(row);
                    if (sent[key] === value) { retained[key] = value; return false; }
                    return true;
                }).slice(0, 10);
                if (rows.length) { body[kind + 'Results'] = rows.map(function (row) {
                    var result = { commandId: row.commandId, state: row.state, revision: row.revision };
                    if (row.state === 'rejected' && row.reason) { result.reason = row.reason; }
                    return result;
                }); }
            } catch (error) { runtime.recordAndroidFailure('command_storage', null); runtime.warn('RELAY_RESULTS_READ'); }
        });
        sent = retained;
        return body;
    };
    runtime.confirmRelayResults = function (body) {
        ['schedule', 'moderator'].forEach(function (kind) {
            (body[kind + 'Results'] || []).forEach(function (row) {
                sent[kind + '$' + row.commandId] = JSON.stringify(row);
                urgent[kind] = urgent[kind].filter(function (id) { return id !== row.commandId; });
            });
        });
    };
    runtime.acceptRelayCommands = function (reply) {
        var changed = false;
        ['schedule', 'moderator'].forEach(function (kind) {
            var rows = reply[kind + 'Commands'];
            if (rows === undefined) { return; }
            if (!Array.isArray(rows) || rows.length > 1) { runtime.warn('RELAY_COMMAND_BATCH'); return; }
            rows.forEach(function (row) { if (apply(kind, row)) { changed = true; } });
        });
        try { if (changed) { runtime.broadcast(); } }
        catch (notifyError) { runtime.warn('RELAY_COMMAND_NOTIFY'); }
    };
};

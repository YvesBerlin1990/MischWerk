/* Ausschließlich aus bestätigten regulären Relay-Antworten; keine Clientrollen oder Benutzerattrappen. */
MischWerkModules.attachRelayCommands = function (runtime) {
    'use strict';
    var sent = {}, transient = { schedule: [], moderator: [] }, urgent = { schedule: [], moderator: [] };
    function idValid(row) { return row && typeof row.commandId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(row.commandId); }
    function integer(value) { return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 9007199254740991 && Math.floor(value) === value; }
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
    function reject(kind, row, week, revision) {
        var result = { commandId: row.commandId, state: 'rejected', revision: revision };
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
                if (runtime.scheduleWeek(row.week) !== row.week) { throw new Error('RELAY_WEEK'); }
                week = row.week; revision = runtime.readScheduleWeek(week).revision;
            } else { revision = runtime.state.radioModeratorRevision; }
            // Firebase prüft Konto, App Check und Rechte vor dieser regulären Relay-Antwort.
            if (!integer(row.expectedRevision) || row.expectedRevision !== revision || runtime.shuttingDown) {
                throw new Error('RELAY_REVISION');
            }
            if (kind === 'schedule') {
                if (['save', 'delete'].indexOf(row.operation) < 0) { throw new Error('RELAY_OPERATION'); }
                var data = { week: week, expectedRevision: row.expectedRevision, id: row.id };
                if (row.operation === 'save') {
                    var entry = row.entry, hour = /^(?:[01][0-9]|2[0-3]):00$/;
                    if (!entry || Array.isArray(entry) || ['live', 'autodj'].indexOf(entry.kind) < 0 ||
                            ['fixed', 'allDay', 'openEnd'].indexOf(entry.timing) < 0 || !hour.test(entry.start) ||
                            !(hour.test(entry.end) || (entry.timing === 'openEnd' && entry.end === ''))) { throw new Error('RELAY_ENTRY'); }
                    ['date', 'kind', 'timing', 'start', 'end', 'nick', 'topic'].forEach(function (field) { data[field] = entry[field]; });
                }
                runtime.changeScheduleFromRelay('mw:schedule.' + row.operation, data, row.commandId);
                runtime.changed('schedule');
            } else {
                if (['add', 'remove'].indexOf(row.operation) < 0) { throw new Error('RELAY_OPERATION'); }
                var nick = runtime.text(row.nick, 50, true), access = KnuddelsServer.getUserAccess();
                if (!access.exists(nick)) { throw new Error('RELAY_NICK'); }
                var teamData = { nick: nick, expectedRadioModeratorRevision: row.expectedRevision };
                if (row.operation === 'remove') { teamData.userId = runtime.numericUserId(access.getUserId(nick)); }
                runtime.changeRadioModeratorFromRelay(row.operation === 'add' ? 'mw:addRadioModerator' : 'mw:removeRadioModerator', teamData, row.commandId);
            }
            requeue(kind, find(kind, row.commandId));
        } catch (error) {
            // Ein Fehler nach fachlichem Commit darf eine gespeicherte Annahme nicht in Ablehnung umdeuten.
            try {
                var committed = find(kind, row.commandId);
                if (committed) { requeue(kind, committed); return; }
                reject(kind, row, week, revision);
            } catch (writeError) { runtime.warn('RELAY_COMMAND_STORAGE'); }
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
                }).slice(0, 64);
                if (rows.length) { body[kind + 'Results'] = rows; }
            } catch (error) { runtime.warn('RELAY_RESULTS_READ'); }
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
        ['schedule', 'moderator'].forEach(function (kind) {
            var rows = reply[kind + 'Commands'];
            if (rows === undefined) { return; }
            if (!Array.isArray(rows) || rows.length > 1) { runtime.warn('RELAY_COMMAND_BATCH'); return; }
            rows.forEach(function (row) { apply(kind, row); });
        });
        try { if ((reply.scheduleCommands || []).length || (reply.moderatorCommands || []).length) { runtime.broadcast(); } }
        catch (notifyError) { runtime.warn('RELAY_COMMAND_NOTIFY'); }
    };
};

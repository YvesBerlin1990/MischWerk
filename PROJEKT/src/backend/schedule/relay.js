/* Dauerhafte Firebase-Zuordnung im bestehenden Wochencommit; niemals als technischer Cache kürzen. */
MischWerkModules.attachScheduleRelay = function (runtime) {
    'use strict';
    function bindings(saved) {
        var rows = saved.relayBindings === undefined ? [] : saved.relayBindings, ids = [], nativeIds = [];
        if (!Array.isArray(rows)) { throw new Error('RELAY_BINDINGS'); }
        rows.forEach(function (row) {
            if (!row || typeof row.firebaseId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(row.firebaseId) ||
                    typeof row.deleted !== 'boolean' || (row.nativeId !== null &&
                    (!runtime.relayInteger(row.nativeId) || row.nativeId === 0)) ||
                    (!row.deleted && row.nativeId === null) || ids.indexOf(row.firebaseId) >= 0 ||
                    (row.nativeId !== null && nativeIds.indexOf(row.nativeId) >= 0)) { throw new Error('RELAY_BINDINGS'); }
            ids.push(row.firebaseId); if (row.nativeId !== null) { nativeIds.push(row.nativeId); }
        });
        return rows;
    }
    function same(left, right) {
        return ['date', 'kind', 'timing', 'start', 'end', 'nick', 'topic'].every(function (key) { return left[key] === right[key]; });
    }
    function displayText(value, maximum, required) {
        if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value) ||
                (required && !value.replace(/\s/g, ''))) { throw runtime.relayFailure('validation'); }
        return value;
    }
    runtime.changeScheduleFromRelay = function (row) {
        var week = row.week, saved = runtime.readScheduleWeek(week), rows = bindings(saved), binding = null;
        // Wochen sind die bestehenden Speicherpartitionen. Ein stabiler Schlüssel bleibt global an seine Woche gebunden.
        runtime.scheduleWeeks().concat([week]).filter(function (item, index, values) {
            return values.indexOf(item) === index;
        }).forEach(function (item) {
            bindings(item === week ? saved : runtime.readScheduleWeek(item)).forEach(function (value) {
                if (value.firebaseId !== row.id) { return; }
                if (binding || item !== week) { throw runtime.relayFailure('business_rule'); }
                binding = value;
            });
        });
        var data = { week: week, expectedRevision: row.expectedRevision, id: binding ? binding.nativeId : 0 };
        var prepared, advance = false, displayNick, displayTopic;
        if (row.operation === 'save') {
            if (binding && binding.deleted) { throw runtime.relayFailure('business_rule'); }
            displayNick = displayText(row.entry.nick, 50, row.entry.kind === 'live');
            displayTopic = displayText(row.entry.topic, 80, true);
            Object.keys(row.entry).forEach(function (key) { data[key] = row.entry[key]; });
            var normalized;
            try { normalized = runtime.normalizedScheduleEntry(null, data); }
            catch (inputError) {
                if (inputError.relayReason) { throw inputError; }
                if (!inputError.publicMessage) { throw inputError; }
                throw runtime.relayFailure('validation');
            }
            if (!binding) {
                var matches = saved.entries.filter(function (entry) {
                    if (entry.automatic) { return false; }
                    try { return same(runtime.normalizedScheduleEntry(null, entry), normalized); }
                    catch (existingError) { if (!existingError.publicMessage) { throw existingError; } return false; }
                });
                if (matches.length > 1) { throw runtime.relayFailure('business_rule'); }
                if (matches.length === 1) {
                    data.id = matches[0].id;
                    if (rows.some(function (item) { return item.nativeId === data.id; })) { throw runtime.relayFailure('business_rule'); }
                }
            }
            if (runtime.scheduleWeek(data.date) !== week) { throw runtime.relayFailure('validation'); }
            advance = true;
        } else if (binding && !binding.deleted && saved.entries.some(function (entry) { return entry.id === binding.nativeId; })) {
            advance = true;
        }
        if (advance) {
            if (data.id && saved.entries.filter(function (entry) { return entry.id === data.id; }).length > 1) {
                throw runtime.relayFailure('business_rule');
            }
            try { prepared = runtime.prepareScheduleChange(null, 'mw:schedule.' + row.operation, data); }
            catch (ruleError) {
                if (!ruleError.publicMessage) { throw ruleError; }
                throw runtime.relayFailure('business_rule');
            }
            saved = prepared.next; rows = bindings(saved);
            if (row.operation === 'save') {
                var target = saved.entries.filter(function (entry) { return entry.id === prepared.entryId; });
                if (target.length !== 1) { throw runtime.relayFailure('business_rule'); }
                // Native Identität und Bestandsvergleich bleiben geprüft; Web-Anzeigetexte bleiben unverändert.
                target[0].nick = displayNick; target[0].topic = displayTopic;
            }
            if (row.operation === 'save' && rows.some(function (item) {
                return item.nativeId === prepared.entryId && item.firebaseId !== row.id;
            })) { throw runtime.relayFailure('business_rule'); }
        }
        var updated = { firebaseId: row.id, nativeId: row.operation === 'save' ? prepared.entryId : binding ? binding.nativeId : null,
            deleted: row.operation === 'delete' };
        saved.relayBindings = rows.filter(function (item) { return item.firebaseId !== row.id; }).concat([updated]);
        runtime.addRelayResult(saved, 'relayResults', { commandId: row.commandId, state: 'applied', revision: saved.revision + (advance ? 1 : 0) });
        // Fachdaten, unverfallbare Zuordnung/Löschmarker und Quittung in EINEM Wochenobjekt schreiben.
        runtime.commitScheduleRelay(week, saved, advance);
        return advance;
    };
};

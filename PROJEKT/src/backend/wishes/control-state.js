/* Technische Wunschrevisionen und Auftragsbelege im gemeinsamen atomaren Queuecommit. */
MischWerkModules.attachWishControlState = function (runtime) {
    'use strict';
    function integer(value, min) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= min;
    }
    function invalid() { throw new Error('WISH_CONTROL_FORMAT'); }
    runtime.wishControlId = function (queue, item) {
        if (runtime.isNativeStudioWish(item)) { return runtime.studioWishId(queue, item); }
        return item.source === 'Android' ? item.externalSubmissionId : null;
    };
    runtime.wishControlStage = function (item) {
        var stage = item.stage || 'queued';
        return stage === 'queued' && item.delivery ? 'received' : stage;
    };
    runtime.validWishControlId = function (id) {
        return typeof id === 'string' && /^(?:knuddels:[A-Za-z0-9_-]{1,84}|[A-Za-z0-9_-]{1,80})$/.test(id);
    };
    runtime.validateWishControlState = function (queue) {
        var active = {}, versions = {}, commands = {};
        queue.items.forEach(function (item) { if (runtime.wishControlId(queue, item)) { active['$' + item.id] = item; } });
        if (queue.controlVersions === undefined) {
            queue.controlVersions = queue.items.filter(function (item) { return active['$' + item.id]; }).map(function (item) {
                return { id: item.id, revision: 1, exports: [] };
            });
        }
        if (queue.controlResults === undefined) { queue.controlResults = []; }
        if (!Array.isArray(queue.controlVersions) || !Array.isArray(queue.controlResults)) { invalid(); }
        queue.controlVersions.forEach(function (row) {
            if (!row || Object.keys(row).sort().join(',') !== 'exports,id,revision' || !integer(row.id, 1) ||
                    !active['$' + row.id] || versions['$' + row.id] || !integer(row.revision, 1) || !Array.isArray(row.exports)) { invalid(); }
            versions['$' + row.id] = true;
            var previous = 0;
            row.exports.forEach(function (entry) {
                if (!entry || Object.keys(entry).sort().join(',') !== 'revision,stamp' || !integer(entry.stamp, 1) ||
                        entry.stamp <= previous || entry.stamp > queue.studioStamp || !integer(entry.revision, 1) ||
                        entry.revision > row.revision) { invalid(); }
                previous = entry.stamp;
            });
        });
        if (Object.keys(active).length !== Object.keys(versions).length) { invalid(); }
        queue.controlResults.forEach(function (row) {
            if (!row || Object.keys(row).sort().join(',') !== 'commandId,dirty,reason,sessionId,state,submissionId,terminalState,wishId' ||
                    typeof row.commandId !== 'string' || !/^[a-f0-9]{64}$/.test(row.commandId) || commands['$' + row.commandId] ||
                    typeof row.sessionId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(row.sessionId) ||
                    !runtime.validWishControlId(row.submissionId) || (row.wishId !== null &&
                        (!integer(row.wishId, 1) || row.wishId >= queue.nextId)) ||
                    typeof row.dirty !== 'boolean' || ['applied', 'rejected'].indexOf(row.state) < 0 ||
                    (row.state === 'applied' ? row.reason !== null || row.wishId === null :
                        ['stale_wish', 'not_allowed', 'not_found', 'moderation_changed', 'storage_failed'].indexOf(row.reason) < 0) ||
                    (row.terminalState !== null && ['done', 'discarded'].indexOf(row.terminalState) < 0)) { invalid(); }
            if (row.state === 'applied' && (active['$' + row.wishId] ?
                    runtime.wishControlId(queue, active['$' + row.wishId]) !== row.submissionId || row.terminalState !== null :
                    row.terminalState === null)) { invalid(); }
            commands['$' + row.commandId] = true;
        });
    };
    runtime.updateWishControlState = function (previous, next) {
        var old = {}, versions = {}, outcomes = {}, active = {};
        previous.items.forEach(function (item, index) { old['$' + item.id] = { item: item, position: index }; });
        (previous.controlVersions || []).forEach(function (row) { versions['$' + row.id] = row; });
        next.replays.forEach(function (row) { outcomes['$' + row.id] = row.outcome; });
        var positions = {};
        next.items.forEach(function (item, position) { positions['$' + item.id] = position; });
        next.controlVersions = next.items.filter(function (item) { return runtime.wishControlId(next, item); }).map(function (item) {
            var key = '$' + item.id, row = versions[key], before = old[key], position = positions[key];
            active[key] = true;
            var changed = before && (before.position !== position || JSON.stringify(before.item) !== JSON.stringify(item));
            return { id: item.id, revision: row ? row.revision + (changed ? 1 : 0) : 1,
                exports: row ? runtime.copy(row.exports) : [] };
        });
        next.controlResults = next.controlResults || [];
        next.controlResults.forEach(function (row) {
            if (row.state === 'applied' && !active['$' + row.wishId] && row.terminalState === null) {
                row.terminalState = outcomes['$' + row.wishId] === 'done' ? 'done' : 'discarded';
            }
        });
    };
    runtime.reserveWishControlExports = function (queue, stamp, updates) {
        var sent = {}, ids = {};
        updates.forEach(function (row) { sent['$' + row.submissionId] = true; });
        queue.items.forEach(function (item) {
            if (sent['$' + runtime.wishControlId(queue, item)]) { ids['$' + item.id] = true; }
        });
        queue.controlVersions.forEach(function (row) {
            if (!ids['$' + row.id]) { return; }
            // Alte Schnappschüsse bleiben kurz zuordenbar; die letzte Sendung bleibt ohne Alterslimit erhalten.
            row.exports = row.exports.filter(function (entry, index) {
                return entry.stamp >= stamp - 180000 || index === row.exports.length - 1;
            });
            row.exports.push({ stamp: stamp, revision: row.revision });
        });
    };
};

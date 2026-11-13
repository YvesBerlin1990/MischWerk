/* Wunschaufträge nur aus dem frischen regulären Rückkanal und für die echte aktive Moderation. */
MischWerkModules.attachStudioWishCommands = function (runtime) {
    'use strict';
    function integer(value) { return typeof value === 'number' && isFinite(value) && value >= 0 && Math.floor(value) === value; }
    function fail(reason) { var error = new Error('WISH_COMMAND'); error.wishReason = reason; throw error; }
    function apply(row, control, serverTime, receivedAt) {
        if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.commandId !== 'string' ||
                !/^[a-f0-9]{64}$/.test(row.commandId) || !runtime.validWishControlId(row.submissionId) ||
                typeof row.sessionId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(row.sessionId)) {
            runtime.warn('WISH_COMMAND_FORMAT'); return;
        }
        var queue = runtime.loadWishes(), item = null;
        var result = { commandId: row.commandId, submissionId: row.submissionId, sessionId: row.sessionId,
            wishId: null, state: 'rejected', reason: null, terminalState: null, dirty: true };
        try {
            var current = runtime.studioWishControl(), user = runtime.studioWishModerator();
            if (!control || !current || !user || current.nick !== control.nick || current.sessionId !== control.sessionId ||
                    row.sessionId !== current.sessionId) { fail('moderation_changed'); }
            var old = runtime.findStudioWishResult(row.commandId);
            if (old) { runtime.requeueStudioWishResult(old.commandId); return; }
            if (Object.keys(row).some(function (key) { return ['commandId', 'submissionId', 'action', 'expectedState',
                    'expectedPosition', 'expectedSourceUpdatedAt', 'beforeSubmissionId', 'sessionId', 'expiresAt'].indexOf(key) < 0; }) ||
                    ['accept', 'prepare', 'defer', 'playing', 'done', 'discard'].indexOf(row.action) < 0 ||
                    (row.beforeSubmissionId !== undefined && row.beforeSubmissionId !== null) ||
                    ['queued', 'received', 'preparing', 'playing'].indexOf(row.expectedState) < 0 ||
                    !integer(row.expectedPosition) || row.expectedPosition < 1 || !integer(row.expectedSourceUpdatedAt) ||
                    !integer(row.expiresAt) || row.expiresAt > serverTime + 120000) { fail('not_allowed'); }
            var now = runtime.now();
            if (now < receivedAt || row.expiresAt <= serverTime + now - receivedAt) { fail('stale_wish'); }
            item = queue.items.filter(function (entry) { return runtime.wishControlId(queue, entry) === row.submissionId; })[0];
            if (!item) { fail('not_found'); }
            result.wishId = item.id;
            var version = queue.controlVersions.filter(function (entry) { return entry.id === item.id; })[0];
            if (runtime.wishControlStage(item) !== row.expectedState || queue.items.indexOf(item) + 1 !== row.expectedPosition ||
                    !version || !version.exports.some(function (entry) {
                        return entry.stamp === row.expectedSourceUpdatedAt && entry.revision === version.revision;
                    })) { fail('stale_wish'); }
            var previous = item.stage || 'queued';
            if ((row.action === 'accept' && previous === 'playing') ||
                    (row.action === 'prepare' && previous === 'playing') ||
                    (row.action === 'playing' && (previous !== 'preparing' || queue.items[0] !== item))) { fail('not_allowed'); }
            // Unmittelbar vor dem Fachcommit erneut mit der seit Empfang verstrichenen Zeit prüfen.
            now = runtime.now();
            if (now < receivedAt || row.expiresAt <= serverTime + now - receivedAt) { fail('stale_wish'); }
            result.state = 'applied';
            if (row.action === 'accept') { runtime.deliverWish(item.id, user, result); }
            else if (row.action === 'done' || row.action === 'discard') {
                runtime.resolveWish(item.id, row.action === 'done' ? 'done' : 'discarded', result);
            } else {
                runtime.changeWishStage(user, { id: item.id, previousStage: previous,
                    stage: row.action === 'prepare' ? 'preparing' : row.action === 'defer' ? 'queued' : 'playing' }, result);
            }
            try { runtime.broadcast(); } catch (notifyError) { runtime.warn('WISH_COMMAND_NOTIFY'); }
        } catch (error) {
            // Ein Benachrichtigungsfehler nach dem atomaren Commit ändert dessen Ergebnis niemals.
            try {
                var committed = runtime.findStudioWishResult(row.commandId);
                if (committed) { runtime.requeueStudioWishResult(committed.commandId); return; }
                result.state = 'rejected'; result.reason = error.wishReason || 'storage_failed';
                result.terminalState = null;
                var next = runtime.copy(runtime.loadWishes()); next.controlResults.push(result);
                runtime.commitWishMetadata(next);
            } catch (storageError) { runtime.recordAndroidFailure('command_storage', null); runtime.warn('WISH_COMMAND_STORAGE'); }
        }
    }
    runtime.acceptStudioWishCommands = function (reply, control, receivedAt) {
        if (reply.studioWishCommands === undefined) { return; }
        if (!Array.isArray(reply.studioWishCommands) || reply.studioWishCommands.length > 1) {
            runtime.warn('WISH_COMMAND_BATCH'); return;
        }
        reply.studioWishCommands.forEach(function (row) { apply(row, control, reply.serverTime, receivedAt); });
    };
};

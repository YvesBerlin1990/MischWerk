/* Geschützte native Wunschprojektion und revisionsgebundene Quittung im bestehenden Statuskanal. */
MischWerkModules.attachAndroidStudioWishes = function (runtime) {
    'use strict';
    runtime.startStudioWishExports = function () {
        var previous = runtime.loadWishes(), next = runtime.copy(previous);
        runtime.updateStudioWishState(previous, next);
        next.studioExports.forEach(function (row) { row.dirty = true; });
        runtime.commitWishMetadata(next);
    };
    runtime.reserveStudioWishTimestamp = function (candidate, updates) {
        var next = runtime.copy(runtime.loadWishes()), stamp = Math.max(candidate, next.studioStamp + 1);
        if (stamp > runtime.now() + 15000) { throw new Error('ANDROID_CLOCK'); }
        next.studioStamp = stamp; runtime.reserveWishControlExports(next, stamp, updates || []);
        runtime.commitWishMetadata(next); return stamp;
    };
    runtime.pendingStudioWishUpdates = function () {
        var queue = runtime.loadWishes(), items = {};
        queue.items.forEach(function (item) {
            if (runtime.isNativeStudioWish(item)) { items['$' + runtime.studioWishId(queue, item)] = item; }
        });
        return queue.studioExports.filter(function (row) { return row.dirty; }).slice(0, 10).map(function (row) {
            var update = { submissionId: row.submissionId, state: row.state, position: row.position, revision: row.revision };
            var item = items['$' + row.submissionId];
            if (item) {
                update.text = runtime.text(item.text.replace(/[\u007f-\u009f]/g, ' '), 300, true); update.origin = 'knuddels';
                update.displayName = runtime.text(item.nick.replace(/[\u007f-\u009f]/g, ' '), 50, false);
            }
            return update;
        });
    };
    runtime.confirmStudioWishUpdates = function (updates) {
        if (!updates.length) { return; }
        var next = runtime.copy(runtime.loadWishes()), sent = {}, changed = false;
        updates.forEach(function (row) { sent['$' + row.submissionId] = row.revision; });
        next.studioExports = next.studioExports.filter(function (row) {
            if (sent['$' + row.submissionId] !== row.revision) { return true; }
            changed = true;
            if (row.state === 'done' || row.state === 'discarded') { return false; }
            row.dirty = false; return true;
        });
        if (changed) { runtime.commitWishMetadata(next); }
    };
};

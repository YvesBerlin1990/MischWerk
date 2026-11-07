/* Wunsch-Rückkanal ausschließlich aus bestätigten Statusantworten; dieselbe dauerhafte Queue. */
MischWerkModules.attachAndroidIncoming = function (runtime) {
    'use strict';
    var totals = { received: 0, adopted: 0, duplicates: 0, discarded: 0, invalid: 0 };
    runtime.androidIncomingStatus = function () { return JSON.parse(JSON.stringify(totals)); };
    function existing(id) {
        var items = runtime.wishItems(), item = null;
        items.some(function (row) {
            if (row.source === 'Android' && row.externalSubmissionId === id) { item = row; return true; }
            return false;
        });
        if (item) {
            var stage = item.stage || 'queued';
            if (stage === 'queued' && item.delivery) { stage = 'received'; }
            runtime.requeueAndroidReceipt(id, stage, items.indexOf(item) + 1); return true;
        }
        var outcome = runtime.wishOutcome('android:' + id), old = runtime.androidReceipt(id);
        if (outcome || (old && old.committed)) {
            runtime.requeueAndroidReceipt(id, outcome || (old.state === 'done' ? 'done' : 'discarded'), null); return true;
        }
        return false;
    }
    runtime.acceptAndroidResponseWishes = function (rows) {
        rows.forEach(function (data) {
            totals.received += 1;
            if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.submissionId !== 'string' ||
                    !/^[a-zA-Z0-9_-]{1,80}$/.test(data.submissionId)) { totals.invalid += 1; return; }
            try {
                if (existing(data.submissionId)) { totals.duplicates += 1; return; }
                var valid = Object.keys(data).sort().join(',') === 'displayName,submissionId,text';
                var value = '';
                try {
                    value = runtime.text(data.text, 300, true);
                    valid = valid && !runtime.containsWishLink(value) && (data.displayName === null ||
                        (typeof data.displayName === 'string' && data.displayName.length <= 50));
                } catch (invalidText) { valid = false; }
                if (!valid || runtime.shuttingDown || runtime.state.requestsEnabled !== true) {
                    runtime.requeueAndroidReceipt(data.submissionId, 'discarded', null); totals.discarded += 1; return;
                }
                if (!runtime.androidReceiptCapacity()) { throw new Error('ANDROID_RECEIPT_CAPACITY'); }
                try {
                    runtime.enqueueAndroidWish({ submissionId: data.submissionId, text: value },
                        runtime.rememberAndroidWish, runtime.confirmAndroidWish);
                    totals.adopted += 1;
                } catch (queueError) {
                    // Ein Benachrichtigungs-/Quittungsfehler nach Commit darf die echte Annahme nicht verwerfen.
                    if (existing(data.submissionId)) { totals.adopted += 1; }
                    else { throw queueError; }
                }
            } catch (error) { runtime.warn('ANDROID_RETURN_WISH'); }
        });
        try { if (rows.length) { runtime.broadcast(); } }
        catch (ignoredNotify) { runtime.warn('ANDROID_NOTIFY'); }
    };
};

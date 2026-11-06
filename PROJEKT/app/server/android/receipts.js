/* Begrenzte technische Annahmemarker/Outbox; keine Wunschtexte, Namen oder zweite Queue. */
MischWerkModules.attachAndroidReceipts = function (runtime) {
    'use strict';
    var key = 'mischwerk.android.receipts.v1', entries = [], started = false, healthy = false;
    var retention = 7 * 86400000;
    function terminal(state) { return state === 'done' || state === 'discarded'; }
    function save() {
        healthy = false;
        KnuddelsServer.getPersistence().setObject(key, { version: 1, entries: entries });
        healthy = true;
    }
    function find(id) {
        return entries.filter(function (row) { return row.submissionId === id; })[0] || null;
    }
    function clean() {
        var now = runtime.now(), before = entries.length;
        entries = entries.filter(function (row) { return !terminal(row.state) || now - row.at < retention; });
        if (entries.length !== before) { save(); }
    }
    function change(row, state, position) {
        if (row.state === state && row.position === position) { return false; }
        row.state = state; row.position = position; row.at = runtime.now(); row.revision += 1; row.dirty = true;
        return true;
    }
    runtime.startAndroidReceipts = function () {
        if (started) { return; }
        var stored = KnuddelsServer.getPersistence().getObject(key, { version: 1, entries: [] });
        if (!stored || stored.version !== 1 || !Array.isArray(stored.entries) || stored.entries.length > 256) {
            throw new Error('ANDROID_RECEIPTS');
        }
        var seen = {};
        stored.entries.forEach(function (row) {
            if (!row || typeof row.submissionId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(row.submissionId) ||
                    seen['$' + row.submissionId] || ['queued', 'received', 'preparing', 'playing', 'done', 'discarded'].indexOf(row.state) < 0 ||
                    typeof row.committed !== 'boolean' ||
                    typeof row.createdAt !== 'number' || !isFinite(row.createdAt) || row.createdAt < 0 || row.createdAt > runtime.now() ||
                    typeof row.at !== 'number' || !isFinite(row.at) || row.at < row.createdAt || row.at > runtime.now()) {
                throw new Error('ANDROID_RECEIPTS');
            }
            seen['$' + row.submissionId] = true;
            var items = runtime.wishItems(), item = items.filter(function (entry) {
                return entry.source === 'Android' && entry.externalSubmissionId === row.submissionId;
            })[0];
            var outcome = runtime.wishOutcome('android:' + row.submissionId);
            var state = item ? item.stage || 'queued' :
                outcome || (terminal(row.state) ? row.state : 'discarded');
            if (item && state === 'queued' && item.delivery) { state = 'received'; }
            entries.push({ submissionId: row.submissionId, state: state,
                position: item ? items.indexOf(item) + 1 : null, createdAt: row.createdAt,
                at: item || !terminal(row.state) ? runtime.now() : row.at,
                committed: !!item || row.committed, revision: (Number(row.revision) || 0) + 1,
                dirty: !!item || row.committed, repeatAt: 0 });
        });
        clean(); save(); started = true;
    };
    runtime.androidReceipt = function (id) { clean(); return find(id); };
    runtime.androidReceiptsReady = function () { return started && healthy; };
    runtime.androidReceiptCapacity = function () { clean(); return entries.length < 256; };
    runtime.rememberAndroidWish = function (item, position) {
        var row = { submissionId: item.externalSubmissionId, state: 'queued', position: position,
            createdAt: runtime.now(), at: runtime.now(), committed: false, revision: 1, dirty: false, repeatAt: 0 };
        var previous = find(item.externalSubmissionId);
        if (previous) { entries.splice(entries.indexOf(previous), 1); }
        entries.push(row);
        try { save(); }
        catch (error) { entries.pop(); if (previous) { entries.push(previous); } throw error; }
    };
    runtime.confirmAndroidWish = function (item) {
        var row = find(item.externalSubmissionId);
        row.committed = true; row.dirty = true;
        save();
    };
    runtime.pendingAndroidUpdates = function () {
        clean();
        if (!healthy) { save(); }
        return entries.filter(function (row) { return row.committed && (row.dirty || (row.repeatAt > 0 && row.repeatAt <= runtime.now())); })
            .slice(0, 100).map(function (row) {
                return { submissionId: row.submissionId, state: row.state, position: row.position, revision: row.revision };
            });
    };
    runtime.confirmAndroidUpdates = function (updates) {
        updates.forEach(function (update) {
            var row = find(update.submissionId);
            if (row && row.revision === update.revision) {
                row.dirty = false;
                // Die Firebase-UID-Zuordnung kann beim ersten sofortigen Push noch ausstehen.
                row.repeatAt = runtime.now() < row.createdAt + 60000 ? runtime.now() + 20000 : 0;
            }
        });
        if (updates.length) { save(); }
    };
    runtime.observeChanges(function (kind, value) {
        if (!started) { return; }
        var changed = false, row;
        if (kind === 'wish-removed' && value.item.source === 'Android') {
            row = find(value.item.externalSubmissionId);
            if (row) { changed = change(row, value.outcome === 'done' ? 'done' : 'discarded', null); }
        } else if (kind === 'wishes') {
            runtime.wishItems().forEach(function (item, index) {
                if (item.source !== 'Android') { return; }
                row = find(item.externalSubmissionId);
                if (!row || terminal(row.state)) { return; }
                var state = item.stage || 'queued';
                if (state === 'queued' && item.delivery) { state = 'received'; }
                changed = change(row, state, index + 1) || changed;
            });
        }
        if (changed) {
            try { save(); }
            catch (error) { runtime.warn('ANDROID_RECEIPTS_WRITE'); }
        }
    });
};

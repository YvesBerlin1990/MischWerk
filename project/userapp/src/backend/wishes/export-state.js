/* Technische Studio-Sendemarker im bestehenden Queuecommit, ohne kopierte Wunschtexte. */
MischWerkModules.attachWishExportState = function (runtime) {
    'use strict';
    function integer(value) { return typeof value === 'number' && isFinite(value) && value >= 0 && Math.floor(value) === value; }
    function terminal(state) { return state === 'done' || state === 'discarded'; }
    runtime.isNativeStudioWish = function (item) {
        return item.source === undefined && item.senderKey.indexOf('website:') !== 0;
    };
    runtime.studioWishId = function (queue, item) { return 'knuddels:' + queue.studioNamespace + '-' + item.id; };
    runtime.validateStudioWishState = function (queue) {
        if (queue.studioExports === undefined) { queue.studioExports = []; }
        if (queue.studioStamp === undefined) { queue.studioStamp = 0; }
        if (!Array.isArray(queue.studioExports) || !integer(queue.studioStamp) ||
                (queue.studioNamespace !== undefined && (typeof queue.studioNamespace !== 'string' || !/^[A-Za-z0-9_-]{1,60}$/.test(queue.studioNamespace))) ||
                (queue.studioExports.length && !queue.studioNamespace)) { throw new Error('WISH_EXPORT_FORMAT'); }
        var seen = {}, active = {};
        queue.items.forEach(function (item, index) {
            if (runtime.isNativeStudioWish(item)) { active['$' + runtime.studioWishId(queue, item)] = index + 1; }
        });
        queue.studioExports.forEach(function (row) {
            if (!row || Object.keys(row).sort().join(',') !== 'dirty,position,revision,state,submissionId' ||
                    typeof row.submissionId !== 'string' || !/^knuddels:[A-Za-z0-9_-]{1,84}$/.test(row.submissionId) ||
                    row.submissionId.indexOf('knuddels:' + queue.studioNamespace + '-') !== 0 || seen['$' + row.submissionId] ||
                    !integer(row.revision) || row.revision < 1 || typeof row.dirty !== 'boolean' ||
                    ['queued', 'received', 'preparing', 'playing', 'done', 'discarded'].indexOf(row.state) < 0 ||
                    (terminal(row.state) ? row.position !== null || !!active['$' + row.submissionId] :
                        !integer(row.position) || row.position < 1 || active['$' + row.submissionId] !== row.position)) {
                throw new Error('WISH_EXPORT_FORMAT');
            }
            seen['$' + row.submissionId] = true;
        });
    };
    runtime.updateStudioWishState = function (previous, next) {
        if (!next.studioNamespace) { next.studioNamespace = runtime.now().toString(36) + '-' + String(Math.random()).slice(2, 18); }
        var rows = next.studioExports || [], index = {}, active = {}, outcomes = {};
        rows.forEach(function (row) { index['$' + row.submissionId] = row; });
        next.replays.forEach(function (row) { outcomes['$' + row.id] = row.outcome; });
        function change(id, state, position) {
            var row = index['$' + id];
            if (!row) { row = { submissionId: id, revision: 0 }; rows.push(row); index['$' + id] = row; }
            if (row.state !== state || row.position !== position) {
                row.state = state; row.position = position; row.revision += 1; row.dirty = true;
            }
        }
        next.items.forEach(function (item, position) {
            if (!runtime.isNativeStudioWish(item)) { return; }
            var id = runtime.studioWishId(next, item), state = item.stage || 'queued';
            if (state === 'queued' && item.delivery) { state = 'received'; }
            active['$' + id] = true; change(id, state, position + 1);
        });
        previous.items.forEach(function (item) {
            if (!runtime.isNativeStudioWish(item)) { return; }
            var id = runtime.studioWishId(next, item);
            if (!active['$' + id]) { change(id, outcomes['$' + item.id] === 'done' ? 'done' : 'discarded', null); }
        });
        next.studioExports = rows;
    };
};

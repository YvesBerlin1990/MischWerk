/* Ausschließlich eigene zentrale Wunschplätze mit getrennter Frischefrist. */
MischWerkModules.attachNativeWishPositions = function(runtime) {
    'use strict';
    runtime.nativeWishPositions = function(user, page) {
        var own = runtime.nativeWishEntries().filter(function(row) {
            return row.senderKey === String(runtime.userId(user)) && !runtime.nativeRelayState().deletions.some(function(del) {
                return del.nativeId === row.senderKey;
            });
        });
        var terminal = own.filter(function(row) {
            return ['done', 'discarded', 'rejected'].indexOf(row.state) >= 0 &&
                typeof row.confirmedAt === 'number' && runtime.now() >= row.confirmedAt && runtime.now() - row.confirmedAt < 45000;
        }).sort(function(a, b) { return b.confirmedAt - a.confirmedAt || b.localId - a.localId; })[0];
        var rows = own.filter(function(row) {
            return row.senderKey === String(runtime.userId(user)) && ['queued', 'received', 'preparing',
                'playing', 'unconfirmed'
            ].indexOf(row.state) >= 0;
        });
        rows = rows.filter(function(row) {
            return !runtime.nativeRelayState().deletions.some(function(del) {
                return del.nativeId === row.senderKey;
            });
        });
        rows.sort(function(a, b) {
            return (a.position || Infinity) - (b.position || Infinity);
        });
        var items = rows.map(function(row) {
            var fresh = typeof row.confirmedAt === 'number' && runtime.now() >= row.confirmedAt &&
                runtime.now() - row.confirmedAt < 45000;
            return {
                id: row.localId,
                text: row.text,
                position: fresh ? row.position : null,
                stage: fresh ? row.state === 'playing' ? 'preparing' : row.state : 'unknown'
            };
        });
        page = Math.max(0, Math.min(items.length - 1, Math.floor(Number(page) || 0)));
        return {
            available: typeof runtime.nativeTransportConfirmedAt === 'number' && runtime.now() >= runtime
                .nativeTransportConfirmedAt && runtime.now() - runtime.nativeTransportConfirmedAt < 45000,
            generation: runtime.loadWishes().studioNamespace || runtime.loadWishes().generation,
            revision: runtime.nativeRelayState().valueRevision || 0,
            lastOutcome: terminal ? terminal.playedConfirmed === true ? 'played' : 'closed' : null,
            remainingMs: rows.length || terminal ? Math.max(0, Math.min(45000,
                ((rows[0] || terminal).confirmedAt || 0) + 45000 - runtime.now(),
                (runtime.nativeTransportConfirmedAt || 0) + 45000 - runtime.now())) : 0,
            nextPosition: items.length ? items[0].position : null,
            nextItem: items[0] || null,
            items: items.slice(page, page + 1),
            total: items.length,
            page: page,
            pages: Math.max(1, items.length)
        };
    };
};

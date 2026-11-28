/* Version 2 über den bestehenden signierten postURL-Port; keine zusätzliche Verbindung. */
MischWerkModules.attachNativeTransport = function(runtime) {
    'use strict';
    var queryOffset = 0,
        nickCursor = null;
    runtime.nativeRelayRequest = function() {
        var state = runtime.copy(runtime.nativeRelayState());
        state.deletions.forEach(function(row) {
            if (!row.ownerKey) {
                row.ownerKey = runtime.nativeOwnerKey(row.nativeId);
            }
        });
        if (JSON.stringify(state) !== JSON.stringify(runtime.nativeRelayState())) {
            runtime.saveNativeRelayState(state);
        }
        var entries = runtime.nativeWishEntries().filter(function(row) {
            return !state.deletions.some(function(del) {
                return del.nativeId === row.senderKey;
            });
        });
        var pending = entries.filter(function(row) {
            return row.state === 'pending';
        }).slice(0, 10);
        var queries = entries.filter(function(row) {
            return row.state !== 'pending' && row.state !== 'rejected' && row.state !== 'done' && row
                .state !== 'discarded';
        });
        if (queryOffset >= queries.length) {
            queryOffset = 0;
        }
        queries = queries.slice(queryOffset, queryOffset + 20);
        queryOffset += queries.length;
        var body = {
            contractVersion: 2,
            transportId: runtime.nativeNamespace(),
            requestId: runtime.nativeUuid(),
            wishSubmissions: pending.map(function(row) {
                return {
                    submissionId: row.submissionId,
                    ownerKey: row.ownerKey,
                    text: row.text,
                    displayName: row.nick
                };
            }),
            ownWishQueries: queries.map(function(row) {
                return {
                    submissionId: row.submissionId,
                    ownerKey: row.ownerKey || runtime.nativeOwnerKey(row.senderKey)
                };
            }),
            ownerDeletions: state.deletions.filter(function(row) {
                return !row.applied;
            }).slice(0, 10).map(function(row) {
                return {
                    requestId: row.requestId,
                    ownerKey: row.ownerKey
                };
            }),
            eventCursor: state.eventCursor,
            nickAccessCursor: nickCursor
        };
        return body;
    };
    runtime.setNativeNickCursor = function(cursor) {
        nickCursor = cursor;
    };
    runtime.resetNativeTransport = function() {
        nickCursor = null;
        queryOffset = 0;
    };
};

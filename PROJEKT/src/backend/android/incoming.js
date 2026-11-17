/* Individuelle Commitbelege und eigene Status ausschließlich aus passender HTTP-Antwort. */
MischWerkModules.attachAndroidIncoming = function(runtime) {
    'use strict';
    var confirmed = 0;

    function integer(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0 && value <=
            9007199254740991;
    }
    runtime.androidIncomingStatus = function() {
        return {
            received: confirmed,
            adopted: confirmed,
            duplicates: 0,
            discarded: 0,
            invalid: 0
        };
    };
    runtime.acceptNativeWishReply = function(reply, request) {
        if (!Array.isArray(reply.wishReceipts) || reply.wishReceipts.length > 10 || !Array.isArray(reply
                .ownWishStatuses) || reply.ownWishStatuses.length > 20 ||
            !Array.isArray(reply.deletionReceipts) || reply.deletionReceipts.length > 10) {
            throw new Error('NATIVE_RECEIPTS');
        }
        var next = runtime.copy(runtime.nativeRelayState()),
            entries = runtime.nativeWishEntries(),
            notifications = [],
            changed = false;

        function target(id, kind) {
            var sent = request[kind].filter(function(row) {
                return row.submissionId === id;
            })[0];
            var entry = entries.filter(function(row) {
                return row.submissionId === id;
            })[0];
            if (!sent || !entry || next.deletions.some(function(row) {
                    return row.nativeId === entry.senderKey;
                })) {
                throw new Error('NATIVE_RECEIPT_OWNER');
            }
            var saved = next.entries.filter(function(row) {
                return row.submissionId === id;
            })[0];
            if (!saved) {
                saved = runtime.copy(entry);
                saved.ownerKey = sent.ownerKey;
                next.entries.push(saved);
            }
            if (saved.ownerKey !== sent.ownerKey) {
                throw new Error('NATIVE_RECEIPT_OWNER');
            }
            return saved;
        }
        reply.deletionReceipts.forEach(function(row) {
            if (!row || typeof row.applied !== 'boolean' || !request.ownerDeletions.some(function(
                sent) {
                    return sent.requestId === row.requestId;
                })) {
                throw new Error('NATIVE_DELETE_RECEIPT');
            }
            next.deletions.forEach(function(saved) {
                if (saved.requestId === row.requestId && row.applied === true && !saved
                    .applied) {
                    saved.applied = true;
                    changed = true;
                }
            });
        });
        reply.wishReceipts.forEach(function(row) {
            if (!row || typeof row.accepted !== 'boolean' || (row.accepted && ['queued', 'received',
                    'preparing', 'playing', 'done', 'discarded'
                ].indexOf(row.state) < 0) ||
                (row.accepted && ((row.state === 'done' || row.state === 'discarded') ? row.position !==
                    null : !integer(row.position) || row.position < 1))) {
                throw new Error('NATIVE_WISH_RECEIPT');
            }
            var saved = target(row.submissionId, 'wishSubmissions');
            if (saved.state !== 'pending') {
                return;
            }
            saved.accepted = row.accepted;
            saved.state = row.accepted ? row.state : 'rejected';
            saved.position = row.accepted ? row.position : null;
            saved.error = row.accepted ? null : 'not_accepted';
            saved.confirmedAt = runtime.now();
            saved.playedConfirmed = row.accepted && row.state === 'done' && saved.legacy !== true;
            notifications.push(runtime.copy(saved));
            changed = true;
        });
        reply.ownWishStatuses.forEach(function(row) {
            if (row && row.state === null && row.position === null && typeof row.error === 'string') {
                var unconfirmed = target(row.submissionId, 'ownWishQueries');
                if (unconfirmed.state !== 'done' && unconfirmed.state !== 'discarded') {
                    unconfirmed.state = 'unconfirmed';
                    unconfirmed.position = null;
                    unconfirmed.confirmedAt = null;
                    unconfirmed.error = 'not_confirmed';
                    changed = true;
                }
                return;
            }
            if (!row || !integer(row.wishRevision) || ['queued', 'received', 'preparing', 'playing',
                    'done', 'discarded'
                ].indexOf(row.state) < 0 ||
                ((row.state === 'done' || row.state === 'discarded') ? row.position !== null : !integer(
                    row.position) || row.position < 1)) {
                throw new Error('NATIVE_WISH_STATUS');
            }
            var saved = target(row.submissionId, 'ownWishQueries');
            var terminal = row.state === 'done' || row.state === 'discarded';
            if ((!terminal && (saved.state === 'done' || saved.state === 'discarded')) ||
                (!terminal && row.wishRevision < (saved.wishRevision || 0))) {
                return;
            }
            saved.wishRevision = row.wishRevision;
            saved.state = row.state;
            saved.position = row.position;
            saved.accepted = true;
            saved.confirmedAt = runtime.now();
            saved.playedConfirmed = row.state === 'done' && saved.legacy !== true;
            changed = true;
        });
        if (changed) {
            next.entries.forEach(function(row) {
                if (['done', 'discarded', 'rejected'].indexOf(row.state) >= 0) {
                    if (!row.textDigest) {
                        row.textDigest = runtime.androidSha256Text(row.text);
                    }
                    row.text = '';
                    row.nick = '';
                }
            });
            runtime.saveNativeRelayState(next);
            confirmed += notifications.length;
        }
        notifications.forEach(function(row) {
            runtime.getViews().forEach(function(view) {
                if (String(view.userId) !== row.senderKey || view.kind !== 'radio') {
                    return;
                }
                view.content.getSessions().forEach(function(session) {
                    if (runtime.activeSession(session.getUser(), session)) {
                        runtime.send(session, 'mw:wish.receipt', {
                            submissionId: row.clientId,
                            accepted: row.accepted,
                            message: row.accepted ?
                                'Dein Musikwunsch wurde an die Moderation gesendet.' :
                                'Der Wunsch wurde nicht angenommen. Bitte den aktuellen Stand prüfen.'
                        });
                    }
                });
            });
        });
    };
};

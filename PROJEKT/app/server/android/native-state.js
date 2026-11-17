/* Native Transportdaten im vorhandenen paginierten Wunschadapter. */
MischWerkModules.attachNativeWishState = function(runtime) {
    'use strict';
    runtime.nativeRelayState = function() {
        var queue = runtime.loadWishes();
        return queue.nativeRelay || {
            version: 2,
            entries: [],
            deletions: [],
            eventCursor: null,
            eventSeq: 0,
            eventEpoch: null
        };
    };
    runtime.saveNativeRelayState = function(data, nextId) {
        var queue = runtime.copy(runtime.loadWishes());
        var previous = runtime.nativeRelayState();
        data.valueRevision = (previous.valueRevision || 0) +
            (JSON.stringify(previous.entries) !== JSON.stringify(data.entries) ||
                JSON.stringify(previous.deletions) !== JSON.stringify(data.deletions) ? 1 : 0);
        queue.nativeRelay = data;
        if (!queue.studioNamespace) {
            queue.studioNamespace = runtime.now().toString(36) + '-' + String(Math.random()).slice(2, 18);
        }
        if (nextId !== undefined) {
            queue.nextId = nextId;
        }
        runtime.commitWishMetadata(queue);
    };
    runtime.nativeNamespace = function() {
        var queue = runtime.loadWishes();
        if (!queue.studioNamespace) {
            runtime.saveNativeRelayState(runtime.copy(runtime.nativeRelayState()));
        }
        return runtime.loadWishes().studioNamespace;
    };
    runtime.nativeUuid = function() {
        var value = String(RandomOperations.getRandomString(32, '0123456789abcdef'));
        if (!/^[a-f0-9]{32}$/.test(value)) {
            throw new Error('NATIVE_UUID');
        }
        return value.slice(0, 8) + '-' + value.slice(8, 12) + '-4' + value.slice(13, 16) + '-8' + value.slice(
            17, 20) + '-' + value.slice(20);
    };
    runtime.nativeOwnerKey = function(id) {
        var known = runtime.nativeRelayState().entries.filter(function(row) {
            return row.senderKey === String(id) && typeof row.ownerKey === 'string';
        })[0];
        if (known) {
            return known.ownerKey;
        }
        var config = KnuddelsServer.getPersistence().getObject('mischwerk.android.private.v1', null);
        if (!config || typeof config.syncSecret !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(config
                .syncSecret)) {
            throw new Error('NATIVE_OWNER_KEY');
        }
        return runtime.androidHmacSha256(config.syncSecret, 'mw-owner-v2:' + runtime.nativeNamespace() + ':' +
            String(id));
    };
    runtime.nativeWishEntries = function() {
        var queue = runtime.loadWishes(),
            own = runtime.nativeRelayState().entries.slice();
        queue.items.forEach(function(item) {
            if (!runtime.isNativeStudioWish(item) || own.some(function(row) {
                    return row.localId === item.id;
                })) {
                return;
            }
            own.push({
                localId: item.id,
                submissionId: runtime.studioWishId(queue, item),
                clientId: item.submissionId,
                senderKey: item.senderKey,
                text: item.text,
                nick: item.nick,
                state: 'unconfirmed',
                position: null,
                wishRevision: 0,
                legacy: true
            });
        });
        return own;
    };
    runtime.migrationFrozen = function() {
        var value = runtime.nativeRelayState().migration;
        if (!value) {
            return false;
        }
        if (value.phase === 'exported') {
            var protocol = runtime.receivedProtocol();
            return !protocol || protocol.authority !== 'studio' || !value.protocolEpochAtStart ||
                protocol.protocolEpoch === value.protocolEpochAtStart;
        }
        return ['exporting', 'paused'].indexOf(value.phase) >= 0;
    };
    runtime.queueNativeWish = function(user, data) {
        if (!data || typeof data.submissionId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(data
                .submissionId)) {
            throw runtime.failure('Ungültige Wunschkennung.');
        }
        var text = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(text)) {
            throw runtime.failure('Bitte gib deinen Musikwunsch ohne Links ein.');
        }
        var owner = String(runtime.userId(user)),
            state = runtime.copy(runtime.nativeRelayState());
        var replay = runtime.loadWishes().replays.filter(function(row) {
            return row.submissionId === data.submissionId;
        })[0];
        if (replay) {
            if (replay.senderKey !== owner) {
                throw runtime.failure('Diese Wunschkennung gehört nicht zu deinem Zugang.');
            }
            return {
                clientId: data.submissionId,
                state: replay.outcome,
                accepted: true,
                legacyReplay: true
            };
        }
        var existing = runtime.nativeWishEntries().filter(function(row) {
            return row.clientId === data.submissionId;
        })[0];
        if (existing) {
            if (existing.senderKey !== owner || (existing.textDigest ? existing.textDigest !== runtime
                    .androidSha256Text(text) : existing.text !== text)) {
                throw runtime.failure('Diese Wunschkennung wurde bereits anders verwendet.');
            }
            return existing;
        }
        if (runtime.migrationFrozen() || !runtime.requestsAvailable() || !runtime.online(user)) {
            throw runtime.failure('Die Wunschbox ist gerade geschlossen.');
        }
        var ownerKey = runtime.nativeOwnerKey(owner);
        if (state.deletions.some(function(row) {
                return row.ownerKey === ownerKey || row.nativeId === owner;
            })) {
            throw runtime.failure('Dieser Wunschzugang ist nicht verfügbar.');
        }
        var id = runtime.loadWishes().nextId,
            row = {
                localId: id,
                submissionId: 'knuddels:' + runtime.nativeNamespace() + '-' + id,
                clientId: data.submissionId,
                senderKey: owner,
                ownerKey: ownerKey,
                text: text,
                nick: runtime.nick(user),
                state: 'pending',
                position: null,
                wishRevision: 0,
                accepted: false,
                error: null
            };
        state.entries.push(row);
        runtime.saveNativeRelayState(state, id + 1);
        runtime.changed('wishes');
        return row;
    };
    runtime.queueNativeOwnerDeletion = function(userId) {
        var id = String(runtime.numericUserId(userId)),
            state = runtime.copy(runtime.nativeRelayState());
        var original = runtime.loadWishes();
        if (state.migration && runtime.migrationFrozen() && original.items.concat(original.replays).some(function(row) {
                return row.senderKey === id || row.delivery && row.delivery.senderKey === id;
            })) {
            state.migration.phase = 'invalidated';
        }
        if (!state.deletions.some(function(row) {
                return row.nativeId === id;
            })) {
            var key = null;
            try {
                key = runtime.nativeOwnerKey(id);
            } catch (unconfigured) {
                /* Auftrag bis zur Einrichtung lokal behalten. */
            }
            state.deletions.push({
                nativeId: id,
                ownerKey: key,
                requestId: runtime.nativeUuid(),
                applied: false
            });
        }
        state.entries = state.entries.filter(function(row) {
            return row.senderKey !== id;
        });
        runtime.saveNativeRelayState(state);
    };
};

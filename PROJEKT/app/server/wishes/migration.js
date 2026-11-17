/* Vollständige Originalpakete für den geschützten Export; keine Wunschtexte im Verwaltungszustand. */
MischWerkModules.attachNativeMigration = function(runtime) {
    'use strict';

    function canonical(value) {
        if (Array.isArray(value)) {
            return '[' + value.map(canonical).join(',') + ']';
        }
        if (value && typeof value === 'object') {
            return '{' + Object.keys(value).sort().filter(function(key) {
                return value[key] !== undefined;
            }).map(function(key) {
                return JSON.stringify(key) + ':' + canonical(value[key]);
            }).join(',') + '}';
        }
        return JSON.stringify(value);
    }
    runtime.nativeMigrationPage = function(options) {
        var namespace = runtime.nativeNamespace(),
            queue = runtime.loadWishes(),
            original = runtime.copy(queue);
        delete original.generation;
        delete original.submissionIds;
        delete original.nativeRelay;
        var android = KnuddelsServer.getPersistence().getObject('mischwerk.android.receipts.v1', null);
        original.androidReceipts = android;
        original.nativeOwnerBindings = queue.items.concat(queue.replays).filter(function(row) {
            return row.senderKey && /^[1-9][0-9]*$/.test(row.senderKey);
        }).map(function(row) {
            return {
                id: row.id,
                ownerKey: runtime.nativeOwnerKey(row.senderKey)
            };
        });
        var revision = String(queue.revision) + ':' + runtime.androidSha256Text(canonical(original));
        if (!options || typeof options.migrationId !== 'string' || !options.migrationId ||
            (options.sourceRevision !== undefined && options.sourceRevision !== revision)) {
            throw new Error('MIGRATION_REVISION');
        }
        var records = [],
            lookup = {},
            owners = {},
            deletions = runtime.nativeRelayState().deletions;

        function blocked(item) {
            return deletions.some(function(row) {
                return row.nativeId === item.senderKey;
            });
        }

        function id(item) {
            return runtime.isNativeStudioWish(item) ? runtime.studioWishId(queue, item) : item.source ===
                'Android' ? item.externalSubmissionId : item.submissionId;
        }

        function receipt(kind, name, submissionId, result) {
            var legacyTerminal = (kind === 'replay' || kind === 'terminal') && result.ownerKey &&
                (result.state === 'done' || result.state === 'discarded');
            records.push({
                section: 'receipts',
                value: {
                    kind: kind,
                    id: name,
                    submissionId: submissionId,
                    digest: legacyTerminal ? result.textDigest || null : runtime.androidSha256Text(
                        canonical(result)),
                    result: result
                }
            });
        }
        queue.items.forEach(function(item, index) {
            var submission = id(item);
            lookup['$' + item.id] = submission;
            if (blocked(item)) {
                return;
            }
            var native = runtime.isNativeStudioWish(item),
                origin = native ? 'knuddels' : item.senderKey.indexOf('website:') === 0 ? 'web' : item
                .origin === undefined ? null : item.origin;
            owners['$' + submission] = native ? runtime.nativeOwnerKey(item.senderKey) : null;
            var stage = item.stage || 'queued';
            if (stage === 'queued' && item.delivery) {
                stage = 'received';
            }
            records.push({
                section: 'wishes',
                value: {
                    submissionId: submission,
                    ownerKey: native ? runtime.nativeOwnerKey(item.senderKey) : null,
                    origin: origin,
                    text: item.text,
                    displayName: native ? item.nick : item.displayName === undefined ? null :
                        item.displayName,
                    state: stage,
                    position: index + 1,
                    received: !!item.delivery,
                    arrivalSequence: item.id,
                    wishRevision: (queue.controlVersions.filter(function(row) {
                        return row.id === item.id;
                    })[0] || {
                        revision: 1
                    }).revision
                }
            });
            if (item.submissionId !== submission) {
                records.push({
                    section: 'aliases',
                    value: {
                        alias: item.submissionId,
                        submissionId: submission
                    }
                });
            }
            if (item.delivery) {
                var delivery = {
                    nick: item.delivery.nick,
                    at: item.delivery.at
                };
                if (item.delivery.senderKey) {
                    delivery.ownerKey = runtime.nativeOwnerKey(item.delivery.senderKey);
                }
                receipt('delivery', 'delivery:' + submission, submission, delivery);
            }
        });
        queue.replays.forEach(function(row) {
            var native = row.submissionId.indexOf('android:') !== 0 && row.senderKey.indexOf(
                'website:') !== 0;
            var submission = native ? 'knuddels:' + namespace + '-' + row.id : row.submissionId.indexOf(
                'android:') === 0 ? row.submissionId.slice(8) : row.submissionId;
            lookup['$' + row.id] = submission;
            owners['$' + submission] = native ? runtime.nativeOwnerKey(row.senderKey) : null;
            receipt('replay', 'replay:' + row.id, submission, {
                state: row.outcome,
                outcome: row.outcome,
                localId: row.id,
                ownerKey: native ? runtime.nativeOwnerKey(row.senderKey) : null,
                textDigest: row.textDigest || null
            });
            if (row.submissionId !== submission) {
                records.push({
                    section: 'aliases',
                    value: {
                        alias: row.submissionId,
                        submissionId: submission
                    }
                });
            }
        });
        queue.studioExports.forEach(function(row) {
            receipt('terminal', 'export:' + row.submissionId, row.submissionId, {
                state: row.state,
                position: row.position,
                revision: row.revision,
                dirty: row.dirty,
                ownerKey: owners['$' + row.submissionId] || null,
                textDigest: row.textDigest || null
            });
        });
        queue.controlResults.forEach(function(row) {
            receipt('action', row.commandId, row.submissionId, runtime.copy(row));
        });
        queue.controlVersions.forEach(function(row) {
            if (lookup['$' + row.id]) {
                receipt('action', 'version:' + row.id, lookup['$' + row.id], runtime.copy(row));
            }
        });
        if (android) {
            if (android.version !== 1 || !Array.isArray(android.entries)) {
                throw new Error('MIGRATION_RECEIPTS');
            }
            android.entries.forEach(function(row) {
                receipt('terminal', 'android:' + row.submissionId, row.submissionId, runtime.copy(row));
            });
        }
        var offset = options.offset || 0;
        if (typeof offset !== 'number' || offset < 0 || Math.floor(offset) !== offset || offset > records
            .length) {
            throw new Error('MIGRATION_CURSOR');
        }
        var chunk = {
                contractVersion: 2,
                migrationId: options.migrationId,
                sourceNamespace: namespace,
                sourceRevision: revision,
                chunkIndex: options.chunkIndex || 0,
                finalChunk: false,
                wishes: [],
                aliases: [],
                receipts: [],
                approvedTargetBindings: []
            },
            next = offset;
        while (next < records.length) {
            var record = records[next];
            chunk[record.section].push(record.value);
            if (JSON.stringify(chunk).length >= 9000 || runtime.jsonBytes(JSON.stringify(chunk)) >= 28000) {
                chunk[record.section].pop();
                break;
            }
            next += 1;
        }
        if (next === offset && next < records.length) {
            throw new Error('MIGRATION_RECORD_SIZE');
        }
        chunk.finalChunk = next === records.length;
        return {
            chunk: chunk,
            nextOffset: next,
            sourceRevision: revision,
            totalRecords: records.length,
            digest: runtime.androidSha256Text(canonical(chunk)),
            originalQueueCount: queue.items.length,
            highwater: queue.nextId
        };
    };
};

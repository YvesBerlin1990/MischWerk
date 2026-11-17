/* Ausdrücklicher Inhaberexport über denselben signierten Brückenkanal. Kein Cutover. */
MischWerkModules.attachMigrationTransport = function(runtime) {
    'use strict';
    var preparation = null,
        completed = [];
    runtime.migrationView = function() {
        var saved = runtime.nativeRelayState().migration;
        return {
            prepared: !!preparation,
            migrationId: preparation ? preparation.migrationId : null,
            phase: saved ? saved.phase : 'idle',
            chunkIndex: saved ? saved.chunkIndex : 0,
            message: saved && saved.phase === 'invalidated' ?
                'Der Originalbestand wurde geändert. Bitte einen neuen Import vorbereiten.' : saved && saved
                .phase === 'exported' ?
                'Originalbestand übertragen. Die zentrale Verifikation steht noch aus.' : saved && saved
                .lastError ?
                'Originalexport noch nicht bestätigt. Bitte den zentralen Import prüfen.' : ''
        };
    };
    runtime.changeMigration = function(user, type, data) {
        if (runtime.shuttingDown || !runtime.canUseAdministration(user)) {
            throw runtime.failure('Nur Otterchen als Channelinhaber darf den Originalexport steuern.');
        }
        if (!data || typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
            throw runtime.failure('Ungültige Exportanfrage.');
        }
        var previous = completed.filter(function(row) {
            return row.userId === runtime.userId(user) && row.id === data.requestId;
        })[0];
        if (previous) {
            if (previous.type !== type) {
                throw runtime.failure('Diese Anfrage wurde bereits anders verwendet.');
            }
            return previous.message;
        }
        var message = change(type);
        completed.push({
            userId: runtime.userId(user),
            id: data.requestId,
            type: type,
            message: message
        });
        if (completed.length > 32) {
            completed.shift();
        }
        return message;
    };

    function change(type) {
        var state = runtime.copy(runtime.nativeRelayState());
        if (type === 'mw:migration.abort') {
            if (state.migration && state.migration.phase === 'exporting') {
                state.migration.phase = 'paused';
                runtime.saveNativeRelayState(state);
            }
            return 'Originalexport angehalten. Der lokale Bestand bleibt eingefroren.';
        }
        if (!preparation || preparation.sourceNamespace !== runtime.nativeNamespace()) {
            throw runtime.failure('Bitte zuerst den passenden Import in der zentralen Verwaltung vorbereiten.');
        }
        if (state.migration && state.migration.migrationId === preparation.migrationId) {
            if (state.migration.phase === 'exported') {
                return 'Der Originalbestand wurde bereits übertragen.';
            }
            if (state.migration.phase === 'invalidated') {
                throw runtime.failure('Bitte einen neuen zentralen Import vorbereiten.');
            }
            state.migration.phase = 'exporting';
        } else {
            var first = runtime.nativeMigrationPage({
                migrationId: preparation.migrationId
            });
            state.migration = {
                phase: 'exporting',
                migrationId: preparation.migrationId,
                sourceRevision: first.sourceRevision,
                protocolEpochAtStart: runtime.receivedProtocol() ? runtime.receivedProtocol().protocolEpoch :
                    null,
                offset: 0,
                chunkIndex: 0
            };
        }
        runtime.saveNativeRelayState(state);
        runtime.changed('wishes');
        return 'Originalexport gestartet. Neue native Wünsche bleiben währenddessen gesperrt.';
    }
    runtime.appendMigrationChunk = function(body) {
        var value = runtime.nativeRelayState().migration;
        if (!value || value.phase !== 'exporting') {
            return;
        }
        try {
            var page = runtime.nativeMigrationPage({
                migrationId: value.migrationId,
                sourceRevision: value.sourceRevision,
                offset: value.offset,
                chunkIndex: value.chunkIndex
            });
            body.migrationChunk = page.chunk;
        } catch (error) {
            var state = runtime.copy(runtime.nativeRelayState());
            state.migration.phase = 'invalidated';
            runtime.saveNativeRelayState(state);
            runtime.warn('MIGRATION_INVALIDATED');
        }
    };
    runtime.acceptMigrationReply = function(reply, request) {
        var prep = reply.migrationPreparation;
        if (prep && typeof prep.migrationId === 'string' && prep.sourceNamespace === runtime
            .nativeNamespace() && ['importing', 'frozen'].indexOf(prep.phase) >= 0) {
            preparation = {
                migrationId: prep.migrationId,
                sourceNamespace: prep.sourceNamespace,
                phase: prep.phase
            };
        } else if (prep === null) {
            preparation = null;
        }
        if (!reply.migrationReceipt) {
            return;
        }
        var receipt = reply.migrationReceipt,
            value = runtime.nativeRelayState().migration,
            chunk = request.migrationChunk;
        if (value && value.phase === 'exporting' && chunk && receipt.accepted === false) {
            if (!value.lastError) {
                var failed = runtime.copy(runtime.nativeRelayState());
                failed.migration.lastError = true;
                runtime.saveNativeRelayState(failed);
            }
            return;
        }
        if (!value || value.phase !== 'exporting' || !chunk || receipt.accepted !== true || receipt
            .migrationId !== chunk.migrationId ||
            receipt.sourceRevision !== chunk.sourceRevision || receipt.chunkIndex !== chunk.chunkIndex) {
            throw new Error('MIGRATION_RECEIPT');
        }
        var page = runtime.nativeMigrationPage({
            migrationId: value.migrationId,
            sourceRevision: value.sourceRevision,
            offset: value.offset,
            chunkIndex: value.chunkIndex
        });
        if (receipt.digest !== page.digest) {
            throw new Error('MIGRATION_DIGEST');
        }
        var state = runtime.copy(runtime.nativeRelayState());
        state.migration.offset = page.nextOffset;
        delete state.migration.lastError;
        state.migration.chunkIndex += 1;
        if (chunk.finalChunk) {
            state.migration.phase = 'exported';
        }
        runtime.saveNativeRelayState(state);
    };
};

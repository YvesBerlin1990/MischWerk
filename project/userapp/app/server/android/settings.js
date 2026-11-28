/* Private Verbindungseinstellungen im Verwaltungsreiter über authentifizierte Knuddels-Sitzungen. */
MischWerkModules.attachAndroidSettings = function (runtime, config) {
    'use strict';
    var entries = [], key = 'mischwerk.android.private.v1';
    var target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
    function secret(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{43,128}$/.test(value); }
    function read() {
        var value = KnuddelsServer.getPersistence().getObject(key, null);
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }
    function revision(value) {
        return typeof value.revision === 'number' && isFinite(value.revision) && value.revision >= 0 &&
            value.revision < 1000000000 && Math.floor(value.revision) === value.revision ? value.revision : 0;
    }
    function state(value) {
        return { revision: revision(value), hasSyncSecret: secret(value.syncSecret),
            targetKind: runtime.androidTargetKind(value.syncUrl),
            hasRelaySecret: secret(value.relaySecret), syncUrl: target, enabled: value.enabled === true,
            runtimeVerified: value.runtimeVerified === true,
            operation: typeof runtime.androidOperationState === 'function' ? runtime.androidOperationState() : null };
    }
    function respond(session, type, data) { runtime.send(session, 'mw:androidSettings.' + type, data); }
    runtime.clearAndroidSettings = function (userId) {
        entries.slice().forEach(function (entry) {
            if (userId === undefined || entry.userId === userId) { entry.finishClose(); }
        });
    };
    runtime.handleAndroidSettingsEvent = function (user, type, data, session) {
        var entry;
        try {
            if (!runtime.activeSession(user, session)) { return; }
            entry = entries.filter(function (item) { return item.content === session.getAppContent(); })[0];
            if (type === 'mw:androidSettings.status' && entry && runtime.now() >= entry.expires) {
                entry.finishClose(); entry = null;
            }
            if (!entry && type === 'mw:androidSettings.status' && entries.length < 4) {
                entry = runtime.administrationSettingsEntry(user, session);
                if (entry) {
                    entry.finishClose = function () { var closed = entry; entries = entries.filter(function (item) { return item !== closed; }); };
                    entry.content.addCloseListener(entry.finishClose); entries.push(entry);
                }
            }
            if (!runtime.canUseAndroidSettings(user, entry, session)) {
                if (entry && entry.userId === runtime.userId(user)) { entry.finishClose(); }
                return;
            }
        } catch (ignoredSession) { return; }
        var requestId = null;
        try {
            if (type === 'mw:androidSettings.status') { respond(session, 'status', { ok: true, state: state(read()) }); return; }
            if (['mw:androidSettings.activate', 'mw:androidSettings.deactivate'].indexOf(type) !== -1) {
                if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'requestId,revision' ||
                        typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(data.requestId)) {
                    throw runtime.failure('Die Anfrage ist ungültig.');
                }
                requestId = data.requestId;
                if (entry.requests.indexOf(requestId) !== -1 || entry.requests.length >= 20) {
                    throw runtime.failure('Bitte öffne die Einrichtung für eine neue Anfrage erneut.');
                }
                entry.requests.push(requestId);
                var stored = read();
                if (data.revision !== revision(stored)) { throw runtime.failure('Die Einstellungen wurden geändert. Bitte Status neu laden.'); }
                var operation = runtime.runAndroidOperation(type.substring('mw:androidSettings.'.length), stored);
                operation.ok = true; operation.requestId = requestId; operation.state = state(read());
                respond(session, 'result', operation); return;
            }
            if (type !== 'mw:androidSettings.save') { return; }
            if (!data || typeof data !== 'object' || Array.isArray(data) || JSON.stringify(data).length > 1200 ||
                    Object.keys(data).some(function (name) { return ['revision', 'requestId', 'syncSecret', 'relaySecret'].indexOf(name) === -1; }) ||
                    typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(data.requestId) ||
                    typeof data.syncSecret !== 'string' || (data.relaySecret !== undefined && data.relaySecret !== '')) {
                throw runtime.failure('Die Eingabe ist unvollständig oder ungültig.');
            }
            requestId = data.requestId;
            if (entry.requests.indexOf(requestId) !== -1 || entry.requests.length >= 20) {
                throw runtime.failure('Bitte öffne die Einrichtung für eine neue Anfrage erneut.');
            }
            entry.requests.push(requestId);
            var previous = read();
            if (data.revision !== revision(previous)) { throw runtime.failure('Die Einstellungen wurden inzwischen geändert. Bitte öffne die Einrichtung erneut.'); }
            var sync = data.syncSecret || (secret(previous.syncSecret) ? previous.syncSecret : '');
            var relay = previous.relaySecret;
            if (!secret(sync)) {
                throw runtime.failure('Bitte einen Sync-Schlüssel mit 43 bis 128 Zeichen aus Buchstaben, Ziffern, Bindestrich oder Unterstrich verwenden.');
            }
            var next = { enabled: false, runtimeVerified: false, syncUrl: target, syncSecret: sync, revision: revision(previous) + 1 };
            if (typeof relay === 'string') { next.relaySecret = relay; }
            runtime.stopAndroidRelay();
            KnuddelsServer.getPersistence().setObject(key, next);
            respond(session, 'result', { ok: true, requestId: requestId, state: state(next),
                message: 'Einstellungen gespeichert. Die Verbindung bleibt bis zur ausdrücklichen Aktivierung ausgeschaltet.' });
        } catch (error) {
            var failed = { ok: false, requestId: requestId,
                message: error.publicMessage || 'Die Einstellungen konnten nicht gespeichert werden. Bitte erneut öffnen.' };
            if (['mw:androidSettings.activate', 'mw:androidSettings.deactivate'].indexOf(type) !== -1) {
                try { failed.state = state(read()); } catch (ignoredState) {}
            }
            respond(session, type === 'mw:androidSettings.status' ? 'status' : 'result', failed);
        }
    };
};

/* Dauerhafter Appzustand und kompatibles Laden/Speichern. */
MischWerkModules.attachPersistence = function (runtime, config) {
    'use strict';
    runtime.state = null;

    runtime.initialState = function () {
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, curtainClosed: true, moderator: null, requests: [], cooldowns: {},
            nextId: 1, radioModeratorUserIds: config.radioModeratorUserIds.slice(0, 50), radioModeratorRevision: 0 };
    };

    runtime.compactCooldowns = function (state, maximum) {
        var source = state.cooldowns;
        if (!source || typeof source !== 'object' || Array.isArray(source)) { source = {}; }
        var entries = Object.keys(source).filter(function (key) {
            var entry = source[key];
            return /^u[1-9][0-9]*$/.test(key) && entry && typeof entry === 'object' && !Array.isArray(entry) &&
                typeof entry.at === 'number' && isFinite(entry.at) && entry.at >= 0 && entry.at <= runtime.now() + 300000 &&
                typeof entry.requestId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(entry.requestId);
        }).map(function (key) {
            return { key: key, at: source[key].at, requestId: source[key].requestId };
        }).sort(function (left, right) {
            return right.at - left.at || (left.key < right.key ? -1 : left.key === right.key ? 0 : 1);
        }).slice(0, maximum);
        state.cooldowns = {};
        entries.forEach(function (entry) {
            state.cooldowns[entry.key] = { at: entry.at, requestId: entry.requestId };
        });
    };

    runtime.persist = function (next, failureMessage, purgedUserId) {
        try {
            runtime.prepareScheduleSync(next, purgedUserId);
            next.revision = (runtime.state && runtime.state.revision || 0) + 1;
            runtime.compactCooldowns(next, runtime.maxReplayEntries);
            var serialized = JSON.stringify(next);
            if (runtime.jsonBytes(serialized) > 90000) {
                var smaller = runtime.copy(next);
                runtime.compactCooldowns(smaller, runtime.emergencyReplayEntries);
                if (runtime.jsonBytes(JSON.stringify(smaller)) > 90000) {
                    throw runtime.failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.');
                }
                next = smaller;
            }
        } catch (prepareError) {
            if (prepareError.publicMessage) { throw prepareError; }
            runtime.warn('PERSIST_PREPARE');
            throw runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht vorbereiten. Bitte versuche es erneut.');
        }
        try {
            KnuddelsServer.getPersistence().setObject(runtime.key, next);
        } catch (error) {
            // Bei knapper AppPersistence bleiben Wünsche erhalten; nur alte technische Wiederholungsmarker werden reduziert.
            var emergency = runtime.copy(next);
            runtime.compactCooldowns(emergency, runtime.emergencyReplayEntries);
            try {
                KnuddelsServer.getPersistence().setObject(runtime.key, emergency);
                next = emergency;
            } catch (retryError) {
                runtime.warn('PERSIST_WRITE');
                var writeFailure = runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht speichern. Bitte versuche es erneut.');
                writeFailure.relayTechnical = true;
                throw writeFailure;
            }
        }
        runtime.state = next;
        if (next.scheduleSync && runtime.flushScheduleSync()) {
            var acknowledged = runtime.copy(next);
            delete acknowledged.scheduleSync;
            try { runtime.persist(acknowledged); }
            catch (ackError) { runtime.warn('SCHEDULE_SYNC_ACK'); }
        }
        runtime.changed('station');
    };

    runtime.readState = function () {
        if (runtime.state) { return; }
        var saved = KnuddelsServer.getPersistence().getObject(runtime.key, null);
        if (saved && (saved.version !== 1 || !Array.isArray(saved.requests) ||
                typeof saved.requestsEnabled !== 'boolean' || typeof saved.nextId !== 'number')) {
            throw new Error('Unbekanntes MischWerk-Datenformat. Persistenz vor Migration sichern.');
        }
        runtime.state = saved || runtime.initialState();
        runtime.state.topic = typeof runtime.state.topic === 'string' ? runtime.state.topic : '';
        runtime.state.curtainClosed = typeof runtime.state.curtainClosed === 'boolean' ? runtime.state.curtainClosed : true;
        runtime.compactCooldowns(runtime.state, runtime.maxReplayEntries);
        runtime.state.revision = typeof runtime.state.revision === 'number' ? runtime.state.revision : 0;
        var configuredIds = Array.isArray(runtime.state.radioModeratorUserIds) ? runtime.state.radioModeratorUserIds :
            config.radioModeratorUserIds;
        runtime.state.radioModeratorUserIds = configuredIds.filter(function (userId, index, values) {
            return typeof userId === 'number' && isFinite(userId) && userId > 0 && Math.floor(userId) === userId &&
                values.indexOf(userId) === index;
        }).slice(0, 50);
        runtime.state.radioModeratorRevision = typeof runtime.state.radioModeratorRevision === 'number' ?
            runtime.state.radioModeratorRevision : 0;
    };
};

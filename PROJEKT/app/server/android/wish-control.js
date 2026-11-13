/* Geschützte Moderationsbindung und aktuelle Rückprojektion der technischen Wunschquittungen. */
MischWerkModules.attachStudioWishControl = function (runtime) {
    'use strict';
    runtime.studioWishModerator = function () {
        if (!runtime.moderatorIsActive() || runtime.state.moderator.authentication !== 'knuddels') { return null; }
        var users = KnuddelsServer.getChannel().getOnlineUsers(UserType.Human);
        for (var index = 0; index < users.length; index += 1) {
            if (runtime.canUseModeration(users[index])) { return users[index]; }
        }
        return null;
    };
    runtime.studioWishControl = function () {
        try {
            var user = runtime.studioWishModerator();
            if (!user) { return null; }
            var nick = runtime.nick(user);
            if (!nick || nick.length > 50 || /[\u0000-\u001f\u007f-\u009f]/.test(nick)) { return null; }
            // Firebase ordnet diesen echten Nick einem geschützt gepflegten DJ-Konto zu.
            return { version: 1, nick: nick, sessionId: runtime.androidHmacSha256('mischwerk-wish-session-v1',
                JSON.stringify([runtime.userId(user), nick, runtime.moderatorKey()])) };
        } catch (error) { runtime.warn('WISH_CONTROL_BINDING'); return null; }
    };
    runtime.findStudioWishResult = function (id) {
        var rows = runtime.loadWishes().controlResults;
        for (var index = 0; index < rows.length; index += 1) {
            if (rows[index].commandId === id) { return rows[index]; }
        }
        return null;
    };
    runtime.requeueStudioWishResult = function (id) {
        var next = runtime.copy(runtime.loadWishes());
        next.controlResults.forEach(function (row) { if (row.commandId === id) { row.dirty = true; } });
        runtime.commitWishMetadata(next);
    };
    runtime.studioWishProjection = function (updates, studio) {
        var control = runtime.studioWishControl(), queue = runtime.loadWishes();
        var results = control ? queue.controlResults.filter(function (row) {
            return row.dirty && row.sessionId === control.sessionId;
        }).slice(0, 1) : [];
        results.forEach(function (result) {
            var item = queue.items.filter(function (row) { return runtime.wishControlId(queue, row) === result.submissionId; })[0];
            var state = item ? runtime.wishControlStage(item) : result.terminalState;
            if (!state) {
                if (result.state === 'applied') { throw new Error('WISH_RESULT_PROJECTION'); }
                return;
            }
            var update = { submissionId: result.submissionId, state: state, position: item ? queue.items.indexOf(item) + 1 : null };
            if (result.submissionId.indexOf('knuddels:') === 0) {
                var marker = queue.studioExports.filter(function (row) { return row.submissionId === result.submissionId; })[0];
                if (marker) { update.revision = marker.revision; }
                if (item) { update.text = item.text; update.origin = 'knuddels'; update.displayName = item.nick; }
                studio = [update].concat(studio.filter(function (row) { return row.submissionId !== update.submissionId; })).slice(0, 10);
            } else {
                var receipt = runtime.androidReceipt(result.submissionId);
                if (receipt) { update.revision = receipt.revision; }
                updates = [update].concat(updates.filter(function (row) { return row.submissionId !== update.submissionId; }));
            }
        });
        return { control: control, results: results.map(function (row) {
            return { commandId: row.commandId, sessionId: row.sessionId, state: row.state, reason: row.reason };
        }), updates: updates.slice(0, 100 - studio.length), studio: studio };
    };
    runtime.confirmStudioWishResults = function (results) {
        if (!results.length) { return; }
        var next = runtime.copy(runtime.loadWishes());
        next.controlResults.forEach(function (row) {
            if (results.some(function (sent) { return sent.commandId === row.commandId && sent.sessionId === row.sessionId; })) {
                row.dirty = false;
            }
        });
        runtime.commitWishMetadata(next);
    };
    runtime.studioWishBody = function (station, projection) {
        function entry(row) { return { submissionId: row.submissionId, state: row.state, position: row.position }; }
        var body = { station: station, wishMetadataVersion: 1, studioWishControl: projection.control,
            studioWishResults: projection.results, wishUpdates: projection.updates.map(entry) };
        if (projection.studio.length) {
            body.studioWishUpdates = projection.studio.map(function (row) {
                var result = entry(row);
                if (row.text !== undefined) {
                    result.text = runtime.text(row.text.replace(/[\u007f-\u009f]/g, ' '), 300, true);
                    result.origin = row.origin;
                    result.displayName = runtime.text(row.displayName.replace(/[\u007f-\u009f]/g, ' '), 50, false);
                }
                return result;
            });
        }
        return body;
    };
};

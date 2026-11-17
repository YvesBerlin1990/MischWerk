/* Explizite zentrale Ereignisse: dauerhaft vor dem einen Botversuch markieren. */
MischWerkModules.attachStudioAnnouncements = function(runtime) {
    'use strict';
    var initialized = false;
    runtime.acceptBroadcastEvents = function(reply, request) {
        if (!Array.isArray(reply.broadcastEvents) || reply.broadcastEvents.length > 10 ||
            (reply.eventCursor !== null && typeof reply.eventCursor !== 'string')) {
            throw new Error('BROADCAST_EVENTS');
        }
        var state = runtime.copy(runtime.nativeRelayState()),
            fresh = [],
            epoch = reply.station.protocolEpoch,
            last = state.eventEpoch === epoch ? state.eventSeq : 0;
        reply.broadcastEvents.forEach(function(row) {
            if (!row || typeof row.eventId !== 'string' || !row.eventId || typeof row.eventSeq !==
                'number' || row.eventSeq < 1 || Math.floor(row.eventSeq) !== row.eventSeq || ['start',
                    'end', 'handover'
                ].indexOf(row.type) < 0 || typeof row.createdAt !== 'number' || typeof row
                .moderatorNick !== 'string' || row.moderatorNick.length > 50 ||
                (row.previousModeratorNick !== null && typeof row.previousModeratorNick !== 'string')) {
                throw new Error('BROADCAST_EVENT');
            }
            if (row.eventSeq <= last) {
                return;
            }
            last = row.eventSeq;
            if (reply.station.authority === 'studio' && initialized && state.eventEpoch === epoch &&
                request.eventCursor !== null && reply.cursorReset !== true &&
                row.createdAt <= reply.serverTime + 15000 && row.createdAt >= reply.serverTime - 45000
                ) {
                fresh.push(row);
            }
        });
        state.eventEpoch = epoch;
        state.eventSeq = last;
        state.eventCursor = reply.eventCursor;
        runtime.saveNativeRelayState(state);
        initialized = true;
        if (!runtime.displaySettings().announcementsEnabled) {
            return;
        }
        fresh.forEach(function(row) {
            var nick = row.moderatorNick.escapeKCode(),
                message;
            if (row.type === 'handover' && row.previousModeratorNick) {
                message = '🎙️ ' + row.previousModeratorNick.escapeKCode() +
                    ' macht Platz im Studio – ' + nick + ' ist jetzt live ON AIR bei Radio MischWerk!';
            } else if (row.type === 'start') {
                message = '🎙️ ' + nick +
                    ' betritt das Studio – ab jetzt live ON AIR bei Radio MischWerk!';
            } else if (row.type === 'end') {
                message = '🎙️ ' + nick +
                    ' verlässt das Studio – danke fürs Zuhören und bis zum nächsten Mal bei Radio MischWerk!';
            }
            if (message) {
                try {
                    KnuddelsServer.getDefaultBotUser().sendPublicMessage(message);
                } catch (error) {
                    runtime.warn('STUDIO_ANNOUNCE');
                }
            }
        });
    };
};

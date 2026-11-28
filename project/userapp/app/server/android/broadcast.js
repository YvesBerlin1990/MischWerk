/* Flüchtiger Empfang der öffentlichen Firebase-Projektion; keine Studio-Sitzungsdaten. */
MischWerkModules.attachReceivedBroadcast = function(runtime) {
    'use strict';
    var show = null,
        showDeadline = 0,
        roster = [],
        rosterDeadline = 0,
        pending = null,
        lastServerTime = 0,
        lastClock = 0,
        protocolConfirmedAt = null;

    function integer(value) {
        return typeof value === 'number' && isFinite(value) && value >= 0 && Math.floor(value) === value && value <=
            9007199254740991;
    }

    function nick(value) {
        return typeof value === 'string' && value.length > 0 && value.length <= 50 && !
            /[\u0000-\u001f\u007f-\u009f]/.test(value);
    }

    function time() {
        var now = runtime.now();
        if (now < lastClock) {
            showDeadline = 0;
            rosterDeadline = 0;
        }
        lastClock = now;
        return now;
    }

    function deadline(until, serverTime, startedAt) {
        return time() + Math.max(0, Math.min(45000, until - serverTime) - (runtime.now() - startedAt));
    }
    runtime.receivedShow = function() {
        var remaining = Math.max(0, showDeadline - time()),
            active = !!show && remaining > 0 && show.authority === 'studio' && show.broadcastState === 'live' &&
            show.onAir === true;
        return {
            active: active,
            wishboxOpen: active && show.wishboxOpen === true,
            nick: active ? show.moderatorNick : null,
            topic: active ? show.topic : '',
            remainingMs: active ? remaining : 0
        };
    };
    runtime.receivedProtocol = function() {
        return show && protocolConfirmedAt !== null && time() >= protocolConfirmedAt && time() -
            protocolConfirmedAt < 45000 ? {
                authority: show.authority,
                protocolEpoch: show.protocolEpoch
            } : null;
    };
    runtime.receivedRoster = function() {
        return rosterDeadline > time() ? roster.slice() : [];
    };
    runtime.receivedRosterState = function() {
        return { confirmed: rosterDeadline > time(), remainingMs: Math.max(0, rosterDeadline - time()) };
    };
    runtime.relayProjectionDeadline = function() {
        var now = time(),
            dates = [showDeadline, rosterDeadline].filter(function(at) {
                return at > now;
            });
        return dates.length ? Math.min.apply(Math, dates) : null;
    };
    runtime.clearRelayProjection = function() {
        show = null;
        showDeadline = 0;
        roster = [];
        rosterDeadline = 0;
        pending = null;
        protocolConfirmedAt = null;
    };
    runtime.acceptRelayProjection = function(reply, startedAt, request) {
        var station = reply.station,
            now = time();
        if (reply.serverTime < lastServerTime || now < startedAt) {
            throw new Error('RELAY_STALE');
        }
        if (!station || ['legacy', 'studio'].indexOf(station.authority) < 0 || station.contractVersion !== 2 ||
            typeof station.protocolEpoch !== 'string' || !station.protocolEpoch ||
            !integer(station.revision) || !integer(station.validUntil) || !integer(station.updatedAt) || [
                'live', 'ended', 'unknown'
            ].indexOf(station.broadcastState) < 0 || typeof station.onAir !== 'boolean' ||
            typeof station.wishboxOpen !== 'boolean' ||
            (station.broadcastState === 'live' ? typeof station.topic !== 'string' || station.topic.length >
                80 : station.topic !== null && (typeof station.topic !== 'string' || station.topic.length > 80)
            ) ||
            (station.moderatorNick !== null && !nick(station.moderatorNick)) || ['authorityEpoch', 'sessionId',
                'uid', 'ownerUid'
            ].some(function(key) {
                return Object.prototype.hasOwnProperty.call(station, key);
            })) {
            throw new Error('RELAY_STATION');
        }
        if (show && station.protocolEpoch === show.protocolEpoch && (station.revision < show.revision || (
                station.revision === show.revision && station.broadcastState === 'live' && station
                .updatedAt < show.updatedAt))) {
            throw new Error('RELAY_STALE');
        }
        if (show && station.protocolEpoch !== show.protocolEpoch) {
            pending = null;
            roster = [];
            rosterDeadline = 0;
        }
        show = runtime.copy(station);
        protocolConfirmedAt = now;
        showDeadline = deadline(station.validUntil, reply.serverTime, startedAt);
        lastServerTime = reply.serverTime;
        var page = reply.nickAccessPage;
        if (!page || typeof page.snapshotId !== 'string' || !page.snapshotId || (typeof page.revision !==
                'string' || !/^[a-f0-9]{64}$/.test(page.revision)) ||
            !integer(page.snapshotAt) || !integer(page.validUntil) || page.validUntil > page.snapshotAt +
            45000 ||
            page.snapshotAt > reply.serverTime + 15000 || !Array.isArray(page.items) || page.items.length >
            50 ||
            typeof page.complete !== 'boolean' || (page.nextCursor !== null && typeof page.nextCursor !==
                'string') ||
            (page.complete && page.nextCursor !== null) || page.items.some(function(item) {
                return !item || !nick(item.nick);
            })) {
            throw new Error('RELAY_ROSTER');
        }
        var rosterReset = page.cursorReset === true;
        if (rosterReset || !request.nickAccessCursor) {
            pending = null;
        }
        if (pending && (pending.id !== page.snapshotId || pending.revision !== page.revision || pending
                .until !== page.validUntil || pending.at !== page.snapshotAt)) {
            throw new Error('RELAY_ROSTER_MIX');
        }
        var next = pending ? runtime.copy(pending) : {
            id: page.snapshotId,
            revision: page.revision,
            at: page.snapshotAt,
            until: page.validUntil,
            items: [],
            cursor: null
        };
        if (!rosterReset && next.cursor !== request.nickAccessCursor && request.nickAccessCursor !== null) {
            throw new Error('RELAY_ROSTER_CURSOR');
        }
        page.items.forEach(function(item) {
            if (next.items.some(function(value) {
                    return value.toLowerCase() === item.nick.toLowerCase();
                })) {
                throw new Error('RELAY_ROSTER_DUPLICATE');
            }
            next.items.push(item.nick);
        });
        next.cursor = page.nextCursor;
        if (page.complete) {
            roster = next.items;
            rosterDeadline = deadline(page.validUntil, reply.serverTime, startedAt);
            pending = null;
        } else {
            pending = next;
        }
        return {
            nickAccessCursor: page.nextCursor,
            protocolEpoch: station.protocolEpoch
        };
    };
};

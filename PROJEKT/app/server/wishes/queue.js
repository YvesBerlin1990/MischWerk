/* Bestehenden Originalbestand laden und bei Nutzerlöschung gezielt bereinigen. */
MischWerkModules.attachWishQueue = function(runtime) {
    'use strict';
    var queue = null;

    function state() {
        if (!queue) {
            queue = runtime.readWishes();
            queue.generation = String(runtime.now()) + '-' + String(Math.random()).slice(2);
        }
        return queue;
    }
    runtime.loadWishes = function() {
        return state();
    };
    runtime.wishSourcePreflight = function() {
        if (!queue) { return { ready: false, sourceNamespace: null }; }
        var relay = queue.nativeRelay;
        return {
            ready: true,
            sourceNamespace: typeof queue.studioNamespace === 'string' &&
                /^[A-Za-z0-9_-]{1,60}$/.test(queue.studioNamespace) ? queue.studioNamespace : null,
            localQueueRevision: queue.revision,
            originalCount: queue.items.length,
            replayCount: queue.replays.length,
            outboxCount: relay ? relay.entries.length : 0,
            deletionCount: relay ? relay.deletions.length : 0
        };
    };
    runtime.wishItems = function() {
        return state().items;
    };
    runtime.commitWishMetadata = function(next) {
        runtime.saveWishes(next);
        queue = next;
    };
    runtime.removeWishesForUser = function(userId) {
        var id = String(runtime.numericUserId(userId)),
            next = runtime.copy(state());
        next.items.forEach(function(item) {
            if (item.delivery && item.delivery.senderKey === id) {
                item.delivery = {
                    nick: 'Radio-Team',
                    at: item.delivery.at
                };
            }
        });
        next.items = next.items.filter(function(item) {
            return item.senderKey !== id;
        });
        next.replays = next.replays.filter(function(item) {
            return item.senderKey !== id;
        });
        next.revision += 1;
        runtime.updateStudioWishState(state(), next);
        runtime.updateWishControlState(state(), next);
        runtime.saveWishes(next);
        queue = next;
        runtime.changed('wishes');
    };
};

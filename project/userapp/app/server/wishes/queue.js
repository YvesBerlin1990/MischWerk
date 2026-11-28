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

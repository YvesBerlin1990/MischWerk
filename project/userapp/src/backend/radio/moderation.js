/* Knuddels besitzt keine lokale Sendungs- oder Moderationsautorität. */
MischWerkModules.attachModeration = function(runtime) {
    'use strict';
    runtime.requestsAvailable = function() {
        return !runtime.shuttingDown && typeof runtime.receivedShow === 'function' &&
            runtime.receivedShow().active === true && runtime.receivedShow().wishboxOpen === true;
    };
};

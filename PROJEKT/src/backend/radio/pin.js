/* Persönliche PIN: bcrypt (Kostenfaktor 10), Kontobindung und dauerhafte Versuchssperre. */
MischWerkModules.attachModerationPin = function (runtime) {
    'use strict';
    function key(user) { return 'u' + runtime.userId(user); }
    function record(user) { return runtime.state.moderatorPins[key(user)]; }
    function validPin(value) {
        return typeof value === 'string' && value.length >= 4 && value.length <= 6 && !/[^0-9]/.test(value);
    }
    function validRecord(item) {
        return item && item.algorithm === 'bcrypt-10' && typeof item.salt === 'string' &&
            item.salt.length === 32 && !/[^a-f0-9]/.test(item.salt) && typeof item.hash === 'string' &&
            item.hash.length === 46 && !/[^a-f0-9]/.test(item.hash) &&
            typeof item.failures === 'number' && item.failures >= 0 && item.failures <= 5 &&
            Math.floor(item.failures) === item.failures && typeof item.blockedUntil === 'number' && isFinite(item.blockedUntil);
    }
    function hash(user, pin, salt) {
        return runtime.hashModerationPin(user, pin, salt);
    }
    function equal(left, right) {
        var difference = left.length ^ right.length;
        for (var index = 0; index < left.length; index += 1) { difference |= left.charCodeAt(index) ^ right.charCodeAt(index); }
        return difference === 0;
    }
    runtime.hasModerationPin = function (user) { return Object.prototype.hasOwnProperty.call(runtime.state.moderatorPins, key(user)); };
    runtime.moderationPinProof = function (userId, proof) {
        var item = runtime.state.moderatorPins['u' + userId];
        return validRecord(item) && typeof proof === 'string' && proof === item.salt;
    };
    runtime.prepareModerationPin = function (user, data, next) {
        if (!runtime.isModerator(user) || runtime.shuttingDown) { throw runtime.failure('Die Moderationsanmeldung ist nicht verfügbar.'); }
        var item = record(user), salt;
        if (runtime.hasModerationPin(user) && !validRecord(item)) {
            throw runtime.failure('Die gespeicherte Moderations-PIN konnte nicht geprüft werden. Bitte den Inhaber kontaktieren.');
        }
        if (item && item.blockedUntil > runtime.now()) {
            throw runtime.failure('Zu viele PIN-Fehlversuche. Bitte nach fünf Minuten erneut versuchen.');
        }
        if (!validPin(data.pin)) { throw runtime.failure('Die PIN muss aus 4 bis 6 Ziffern bestehen.'); }
        if (!item) {
            if (!validPin(data.pinConfirmation) || data.pin !== data.pinConfirmation) {
                throw runtime.failure('Bitte die neue PIN zweimal identisch eingeben.');
            }
            if (typeof RandomOperations === 'undefined' || typeof RandomOperations.getRandomString !== 'function') {
                throw runtime.failure('Die PIN kann gerade nicht sicher eingerichtet werden.');
            }
            salt = runtime.preparedPinSalt(user) || String(RandomOperations.getRandomString(32, '0123456789abcdef'));
            if (salt.length !== 32 || /[^a-f0-9]/.test(salt)) { throw runtime.failure('Die PIN kann gerade nicht sicher eingerichtet werden.'); }
            item = { algorithm:'bcrypt-10', salt:salt, hash:hash(user, data.pin, salt), failures:0, blockedUntil:0 };
        } else if (!equal(hash(user, data.pin, item.salt), item.hash)) {
            var failed = runtime.copy(runtime.state), attempt = failed.moderatorPins[key(user)];
            attempt.failures = item.blockedUntil ? 1 : item.failures + 1;
            attempt.blockedUntil = attempt.failures >= 5 ? runtime.now() + 300000 : 0;
            runtime.persist(failed);
            throw runtime.failure('Die PIN ist nicht korrekt.');
        }
        next.moderatorPins[key(user)] = runtime.copy(item);
        next.moderatorPins[key(user)].failures = 0;
        next.moderatorPins[key(user)].blockedUntil = 0;
        return item.salt;
    };
};

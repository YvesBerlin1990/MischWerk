/* Authentifizierte Nutzerkennung und Rechte im Channel. */
MischWerkModules.attachIdentity = function (runtime, config) {
    'use strict';

    runtime.numericUserId = function (value) {
        var userId = Number(value);
        if (!isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
            throw runtime.failure('Die Knuddels-Nutzer-ID konnte nicht verarbeitet werden. Bitte öffne MischWerk erneut.');
        }
        return userId;
    };

    runtime.userId = function (user) { return runtime.numericUserId(user.getUserId()); };

    runtime.nick = function (user) { return String(user.getNick()); };

    runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };

    runtime.isChannelOwner = function (user) { return runtime.online(user) && user.isChannelOwner(); };

    runtime.isModerator = function (user) {
        return runtime.online(user) && (user.isChannelOwner() ||
            runtime.state.radioModeratorUserIds.indexOf(runtime.userId(user)) !== -1);
    };
};

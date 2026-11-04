/* Gemeinsamer Vorhangzustand und Chatbedienung mit authentifiziertem Inhaberrecht. */
MischWerkModules.attachCurtain = function (runtime, config) {
    'use strict';
    runtime.curtainState = function (user) {
        var nick = runtime.nick(user).toLowerCase();
        return { closed: runtime.state.curtainClosed, audioVersion:config.version,
            exempt: config.curtainExemptNicks.some(function (name) { return name.toLowerCase() === nick; }),
            canManage: runtime.isChannelOwner(user) && nick === config.ownerNick.toLowerCase() };
    };
    runtime.changeCurtain = function (user, data) {
        if (!runtime.curtainState(user).canManage) {
            throw runtime.failure('Nur Otterchen als Channelinhaber kann den Vorhang bedienen.');
        }
        if (typeof data.closed !== 'boolean' || typeof data.previousClosed !== 'boolean') {
            throw runtime.failure('Ungültiger Vorhangzustand. Bitte erneut versuchen.');
        }
        if (data.previousClosed !== runtime.state.curtainClosed) {
            throw runtime.failure('Der Vorhang wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        if (data.closed === runtime.state.curtainClosed) {
            return data.closed ? 'Der Vorhang ist bereits geschlossen.' : 'Der Vorhang ist bereits geöffnet.';
        }
        var next = runtime.copy(runtime.state);
        next.curtainClosed = data.closed;
        runtime.persist(next);
        return data.closed ? 'Vorhang geschlossen.' : 'Vorhang geöffnet.';
    };
};

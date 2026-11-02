/* Öffentliche Nick-Bot-Meldungen bei tatsächlichem Wechsel der Studio-Moderation. */
MischWerkModules.attachStudioAnnouncements = function (runtime) {
    'use strict';
    var initialized = false;
    var lastModerator = null;

    function currentModerator() {
        if (!runtime.moderatorIsActive()) { return null; }
        return { userId: runtime.state.moderator.userId, nick: String(runtime.state.moderator.nick) };
    }

    function announce(moderator, onAir, previous) {
        try {
            var message = previous ? '🎙️ ' + previous.nick.escapeKCode() + ' macht Platz im Studio – ' +
                moderator.nick.escapeKCode() + ' ist jetzt live ON AIR bei Radio MischWerk!' :
                '🎙️ ' + moderator.nick.escapeKCode() + (onAir ?
                ' betritt das Studio – ab jetzt live ON AIR bei Radio MischWerk!' :
                ' verlässt das Studio – danke fürs Zuhören und bis zum nächsten Mal bei Radio MischWerk!');
            KnuddelsServer.getDefaultBotUser().sendPublicMessage(message);
        } catch (error) {
            // Ein Botfehler darf die bestätigte Moderation nicht zurücknehmen.
            runtime.warn('STUDIO_ANNOUNCE');
        }
    }

    runtime.initializeStudioAnnouncements = function () {
        if (initialized) { return; }
        try {
            lastModerator = currentModerator();
            initialized = true;
        } catch (error) { runtime.warn('STUDIO_ANNOUNCE'); }
    };

    runtime.announceStudioStatus = function () {
        try {
            if (!initialized) { runtime.initializeStudioAnnouncements(); return; }
            var moderator = currentModerator();
            var previous = lastModerator;
            // Vor dem Versand übernehmen: nach API-Fehlern keine ungewissen Wiederholungen senden.
            lastModerator = moderator;
            if (previous && moderator && previous.userId === moderator.userId) { return; }
            if (previous && moderator) { announce(moderator, true, previous); return; }
            if (previous) { announce(previous, false); }
            if (moderator) { announce(moderator, true); }
        } catch (error) { runtime.warn('STUDIO_ANNOUNCE'); }
    };
    runtime.notifyHandover = function (user, nick) {
        try { user.sendPrivateMessage(nick.escapeKCode() +
            ' möchte dir die Sendung übergeben. Bitte öffne das Moderationsmenü und wähle „Übergabe ansehen“.'); }
        catch (error) { runtime.warn('HANDOVER_NOTICE'); }
    };
};

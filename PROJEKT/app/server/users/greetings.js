/* Öffentliche Begrüßung beim Channelbeitritt; keine Studioanmeldung oder Rechtevergabe. */
MischWerkModules.attachUserGreetings = function (runtime) {
    'use strict';
    var present = {};

    function profileLink(user, display, fallback) {
        try {
            var link = user.getProfileLink(display);
            if (link !== null && link !== undefined) {
                link = String(link);
                if (link && link.length <= 6000) { return link; }
            }
        } catch (error) { /* Eine defekte optionale Verlinkung verhindert keine Begrüßung. */ }
        return fallback;
    }

    function photo(user) {
        try {
            if (!user.hasProfilePhoto()) { return ''; }
            var url = String(user.getProfilePhoto(24, 24));
            // Nur die vom Server gelieferte Bildadresse in genau einen KCode-Bildtag einsetzen.
            if (url.length > 2000 || !/^https?:\/\/[^/?#\s]+(?:[/?#][^\s]*)?$/.test(url) || /[\s°<>|\\]/.test(url)) { return ''; }
            // displayText ist Text: Bild-Steuerzeichen dürfen nicht durch die Profilfunktion laufen.
            // Nur das native Profilziel übernehmen, dann einen eigenständigen Bildtag bilden.
            var nativeLink = profileLink(user, 'Profil öffnen', '');
            var target = /^°>[^°<>|]*\|((?:\\[^\r\n]|[^\\°<>\r\n])+)<°$/.exec(nativeLink);
            return ' °>' + url + (target ? '<>--<>|' + target[1] : '') + '<°';
        } catch (error) { return ''; }
    }

    function message(user) {
        var nick = runtime.nick(user).escapeKCode();
        // Auch der Linktrenner muss im Anzeigetext wörtlich bleiben, ohne doppelt zu maskieren.
        var label = nick.replace(/(\\*)\|/g, function (match, slashes) {
            return slashes + (slashes.length % 2 ? '' : '\\') + '|';
        });
        // Goldton #e6c77b aus der Appleiste; danach mit normaler Schrift in derselben Zeile fortsetzen.
        return '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, ' + profileLink(user, label, nick) +
            '._°r° Viel Spaß beim Zuhören.' + photo(user);
    }

    runtime.initializeUserGreetings = function () {
        // Bereits anwesende Menschen beim Appstart nur merken, niemals nachträglich begrüßen.
        try {
            KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
                present[runtime.userId(user)] = true;
            });
        } catch (error) { runtime.warn('USER_GREETING'); }
    };

    runtime.greetUser = function (user) {
        if (runtime.shuttingDown) { return; }
        try {
            if (!runtime.online(user) || user.getUserType() !== UserType.Human) { return; }
            var userId = runtime.userId(user);
            if (present[userId]) { return; }
            // Vor dem Versand merken: auch bei ungewissem Botfehler nicht erneut senden.
            present[userId] = true;
            var text = message(user);
            KnuddelsServer.getDefaultBotUser().sendPublicMessage(text);
        } catch (error) { runtime.warn('USER_GREETING'); }
    };

    runtime.forgetUserGreeting = function (userId) { delete present[runtime.numericUserId(userId)]; };
    runtime.clearUserGreetings = function () { present = {}; };
};

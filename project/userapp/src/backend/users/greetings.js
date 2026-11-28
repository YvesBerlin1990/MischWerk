/* Öffentlicher Text und private Willkommensgrafik beim echten Channelbeitritt. */
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
        // Fester fetter Schriftschnitt statt eigener Bold-Umschaltung um den nativen Nicklink.
        // Vollständiger Formatreset vor dem zweiten Satz; Goldton und Größe danach zurücksetzen.
        return '°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, ' + profileLink(user, label, nick) +
            '.§°r° Viel Spaß beim Zuhören.' + photo(user);
    }

    function welcomeImage(name, target, banner) {
        var url = String(KnuddelsServer.getFullImagePath('img/welcome/' + name + '.png'));
        if (url.length > 2000 || !/^https?:\/\/[^/?#\s]+\/[^\s]*\.png(?:[?#][^\s]*)?$/.test(url) || /[\s°<>|\\]/.test(url)) {
            throw new Error('Welcome image path');
        }
        // Dokumentierte Bild-/Containermaße; Original-PNG und Seitenverhältnis erhalten.
        if (banner) { url = url.replace(/\.png(?=$|[?#])/, '...w_534.h_178.mw_534.mh_178.png'); }
        // Bild und Klickziel bleiben ein nativer KCode-Link; erst der Nutzerklick öffnet das Ziel.
        return '°>' + url + (target ? '<>--<>|' + target : '') + '<°';
    }

    function privateWelcome() {
        try {
            // Ausrichtung gilt je KCode-Zeile: Absender links, Bilder erst nach dem nativen Umbruch zentrieren.
            return '°>LEFT<°°#r°°>CENTER<°' + welcomeImage('banner', null, true) + '°#r°°>CENTER<°' +
                welcomeImage('lieblingschannel', '/edit setlmc') + ' ' +
                welcomeImage('mitmachen', 'https://radio-mischwerk.web.app/') + ' ' + welcomeImage('channelinfo', '/info') + '°#r°°>LEFT<°';
        } catch (error) { runtime.warn('USER_WELCOME_ASSET'); }
        // Ohne vollständige Bildauflösung keine leere oder zusätzliche Textnachricht senden.
        return null;
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
            // Die Grafik zuerst senden; beide Versandwege bleiben unabhängig gegen Fehler abgesichert.
            try {
                var welcome = privateWelcome();
                if (welcome) { user.sendPrivateMessage(welcome); }
            }
            catch (privateError) { runtime.warn('USER_WELCOME'); }
            try { KnuddelsServer.getDefaultBotUser().sendPublicMessage(message(user)); }
            catch (publicError) { runtime.warn('USER_GREETING'); }
        } catch (error) { runtime.warn('USER_GREETING'); }
    };

    runtime.forgetUserGreeting = function (userId) { delete present[runtime.numericUserId(userId)]; };
    runtime.clearUserGreetings = function () { present = {}; };
};

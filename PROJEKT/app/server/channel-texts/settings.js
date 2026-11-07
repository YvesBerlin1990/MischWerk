/* Channel-Thema per Inhaberbefehl und gemeinsame Bot-Einstellungen für Verwaltung/Website. */
MischWerkModules.attachChannelTextSettings = function (runtime) {
    'use strict';
    function buttonCount(text) { return (text.match(/°>\{button\}/g) || []).length; }
    function topicButton(label, command) {
        return '°>{button}' + label + '||call|' + command +
            '|color|44,44,44~26,26,26~36,36,36|width|170|height|30<°';
    }
    function radioTopic() {
        // Das native Thema ist bereits fett; Unterstriche würden diese Vorgabe umschalten.
        // Der KCode-Zeilenumbruch trennt den anschließenden Links-Reset von der Themenzeile.
        return '°>CENTER<°°[230,199,123]°Radio MischWerk°[232,232,232]° – Dein Mix aus Musik und guter Laune! ' +
            topicButton('Lieblings-MyChannel', '/edit setlmc') + ' ' +
            topicButton('Readme setzen', '/readme Ich höre Radio MischWerk.') + ' ' +
            topicButton('Channelinfo', '/info') + '°#r°°>LEFT<°';
    }
    function verifyButtons(information, expected, reply) {
        try {
            var stored = String(information.getTopic());
            var counts = 'Button-Elemente: ' + buttonCount(stored) + ' von ' + buttonCount(expected) + '.';
            if (stored !== expected) {
                return 'Das Channel-Thema wurde übergeben. Knuddels liefert einen veränderten Text zurück. ' + counts;
            }
            return reply + ' Rücklesen unverändert. ' + counts + ' Anzeige und Klicks sind damit noch nicht geprüft.';
        } catch (error) {
            runtime.warn('CHANNEL_TOPIC_READ', error);
            return 'Das Channel-Thema wurde übergeben. Das gespeicherte Ergebnis konnte nicht geprüft werden.';
        }
    }
    runtime.changeChannelTexts = function (user, data) {
        if (!runtime.canAdminister(user)) { throw runtime.failure('Nur der Channelinhaber darf Bot-Texte ändern.'); }
        if (runtime.shuttingDown) { throw runtime.failure('MischWerk startet gerade neu. Bitte später versuchen.'); }
        var previous = runtime.readChannelTexts();
        if (typeof data.expectedRevision !== 'number' || data.expectedRevision !== previous.revision) {
            throw runtime.failure('Die Bot-Texte wurden inzwischen geändert. Bitte aktualisieren und deine Eingabe prüfen.');
        }
        var valid = runtime.validateChannelTexts(data);
        var next = { version:1, revision:previous.revision + 1, enabled:valid.enabled, interval:valid.interval,
            texts:valid.texts, cursor:0, nextAt:valid.enabled ? runtime.now() + valid.interval * 60000 : 0 };
        runtime.storeChannelTexts(next);
        runtime.restartChannelTexts();
        return next.enabled ? 'Bot-Texte gespeichert. Erste Ausgabe in ' + next.interval + ' Minuten.' :
            'Bot-Texte gespeichert. Automatische Ausgabe ist ausgeschaltet.';
    };

    runtime.setTopicCommand = function (user, params) {
        var reply;
        try {
            if (!runtime.online(user)) {
                throw runtime.failure('Bitte verwende /settopic TEXT im MischWerk-Channel.');
            }
            if (!runtime.canAdminister(user)) {
                throw runtime.failure('Nur Otterchen als Channelinhaber darf das Channel-Thema ändern.');
            }
            if (runtime.shuttingDown) {
                throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte versuche es gleich erneut.');
            }
            var topic = params === undefined || params === null ? '' : String(params);
            var option = topic.replace(/^\s+|\s+$/g, '').toLowerCase();
            if (option === '--buttons') { topic = radioTopic(); }
            else if (option.indexOf('--') === 0 && option !== '--pruefen') {
                throw runtime.failure('Bitte verwende /settopic TEXT, /settopic --buttons oder /settopic --pruefen.');
            }
            if (!topic.replace(/^\s+|\s+$/g, '')) {
                throw runtime.failure('Bitte verwende /settopic TEXT mit einem nichtleeren Channel-Thema.');
            }
            if (topic.length > 2500) {
                throw runtime.failure('Das Channel-Thema darf einschließlich KCode höchstens 2.500 Zeichen enthalten.');
            }
            var information = KnuddelsServer.getChannel().getChannelConfiguration().getChannelInformation();
            var previous = String(information.getTopic());
            if (option === '--pruefen') {
                reply = 'Gespeichertes Channel-Thema: ' + previous.length + ' Zeichen; Button-Elemente: ' +
                    buttonCount(previous) + '. Anzeige und Klicks werden dabei nicht geprüft.';
            } else {
                if (previous === topic) {
                    reply = 'Dieses Channel-Thema ist bereits eingestellt.';
                } else {
                    information.setTopic(topic, true);
                    reply = 'Das Channel-Thema wurde aktualisiert.';
                }
                if (buttonCount(topic) > 0) { reply = verifyButtons(information, topic, reply); }
            }
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('CHANNEL_TOPIC', error); }
            reply = error.publicMessage || (option === '--pruefen' ?
                'Das gespeicherte Channel-Thema konnte gerade nicht geprüft werden. Bitte versuche es erneut.' :
                'Das Channel-Thema konnte gerade nicht geändert werden. Bitte versuche es erneut.');
        }
        // Eine fehlgeschlagene Privatantwort darf keinen zweiten Setzversuch auslösen.
        try { user.sendPrivateMessage(reply); }
        catch (replyError) { runtime.warn('CHANNEL_TOPIC_REPLY', replyError); }
    };
};

/* Eigene Smileys ausschließlich aus einer authentifizierten nativen Privatnachricht lernen. */
MischWerkModules.attachChannelTextSmileys = function (runtime) {
    'use strict';
    runtime.receiveChannelSmiley = function (message) {
        var user, reply;
        try {
            var raw = String(message.getRawText()).replace(/^\s+|\s+$/g, '');
            if (!/^smiley(?:\s|$)/.test(raw)) { return; }
            user = message.getAuthor();
            if (!runtime.canAdminister(user) || user.getUserType() !== UserType.Human) {
                throw runtime.failure('Nur Otterchen als anwesender Channelinhaber darf Bot-Smileys übernehmen.');
            }
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk startet gerade neu. Bitte später versuchen.'); }
            var code = raw.replace(/^smiley\s*/, '');
            if (!runtime.channelSmileyCode(code)) {
                throw runtime.failure('Bitte sende mir privat: smiley DEIN-CODE, zum Beispiel smiley :(nosmoking-happy-y):');
            }
            var processed = String(message.getText()).replace(/^\s*smiley\s+/, '').replace(/\s+$/g, '');
            var image = runtime.nativeChannelSmileyImage(processed);
            if (!image) {
                // Diese Prüfung kennt keinen Smileybesitz. Nur die empfangene Textform beschreiben.
                var detail = JSON.stringify(processed.slice(0, 350)).escapeKCode();
                var shortened = processed.length > 350 || detail.length > 700;
                detail = detail.slice(0, 700);
                throw runtime.failure((processed === code ?
                    'Die App erhält dieses Kürzel als Text. Das ist keine Prüfung deines Smiley-Besitzes.' :
                    'Die App konnte das gelieferte Smiley-Format noch nicht erkennen. Das ist keine Prüfung deines Smiley-Besitzes.') +
                    ' Empfangen (' + processed.length + ' Zeichen' + (shortened ? ', gekürzt' : '') + '): ' + detail);
            }
            var state = runtime.readChannelTexts(), found = -1;
            state.smileys.forEach(function (item, index) { if (item.code === code) { found = index; } });
            if (found !== -1 && state.smileys[found].image === image) {
                reply = 'Dieser Smiley ist bereits für deine Bot-Texte gespeichert.';
            } else {
                if (found === -1 && state.smileys.length >= 32) {
                    throw runtime.failure('Es sind bereits 32 Bot-Smileys gespeichert.');
                }
                if (found === -1) { state.smileys.push({ code:code, image:image }); }
                else { state.smileys[found].image = image; }
                // Einstellungen, Revision, Rotationszeiger und laufenden Termin unverändert erhalten.
                runtime.storeChannelTexts(state);
                reply = 'Smiley gespeichert. Du kannst das Kürzel jetzt in deinen Bot-Texten verwenden.';
            }
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('CHANNEL_SMILEY_IMPORT'); }
            reply = error.publicMessage || 'Der Smiley konnte gerade nicht übernommen werden. Bitte erneut versuchen.';
        }
        // Ein Antwortfehler darf den bestätigten Import weder zurückrollen noch wiederholen.
        if (user) {
            try { user.sendPrivateMessage(reply); }
            catch (error) { runtime.warn('CHANNEL_SMILEY_REPLY'); }
        }
    };
};

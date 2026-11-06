/* Gemeinsame Fachaktion für native Verwaltung und verifizierten Websitezugang. */
MischWerkModules.attachChannelTextSettings = function (runtime) {
    'use strict';
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
};

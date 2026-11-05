/* Nur die aktuelle native Verwaltung des tatsächlichen Channelinhabers darf Bot-Texte speichern. */
MischWerkModules.attachChannelTextTransport = function (runtime) {
    'use strict';
    runtime.handleChannelTextEvent = function (user, type, data, session) {
        var requestId = null;
        try {
            if (!data || typeof data !== 'object' || Array.isArray(data) ||
                    typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                throw runtime.failure('Ungültige Anfrage. Bitte öffne die Verwaltung erneut.');
            }
            requestId = data.requestId;
            var view = runtime.getViews().filter(function (item) {
                return item.userId === runtime.userId(user) && item.content === session.getAppContent();
            })[0];
            if (!runtime.isChannelOwner(user) || !view || view.kind !== 'team' || data.view !== 'team' || data.viewRevision !== view.viewRevision) {
                throw runtime.failure('Nur der Channelinhaber darf Bot-Texte in der Verwaltung ändern.');
            }
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk startet gerade neu. Bitte versuche es gleich erneut.'); }
            if (type !== 'mw:channelTexts.save') { throw runtime.failure('Diese Bot-Text-Aktion ist nicht verfügbar.'); }
            runtime.result(session, true, runtime.changeChannelTexts(user, data), type, requestId);
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('CHANNEL_TEXTS_EVENT'); }
            runtime.result(session, false, error.publicMessage || 'Bot-Texte konnten nicht gespeichert werden.', type, requestId);
        }
        try { runtime.refresh(session, user); } catch (error) { runtime.warn('CHANNEL_TEXTS_REFRESH'); }
    };
};

/* Sendungsthema und geoeffnete/geschlossene Wunschbox. */
MischWerkModules.attachShow = function (runtime, config) {
    'use strict';
    runtime.changeShow = function (user, type, data) {
        if (!(type === 'mw:setRequests' && runtime.canAdminister(user)) && !runtime.canUseModeration(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        if (runtime.shuttingDown) { throw runtime.failure('MischWerk wird neu gestartet.'); }
        var next = runtime.copy(runtime.state);
        if (type === 'mw:setRequests') {
            if (typeof data.enabled !== 'boolean') { throw runtime.failure('Ungültiger Wunschbox-Status.'); }
            if (data.previousEnabled !== undefined && data.previousEnabled !== runtime.requestsAvailable(user)) {
                throw runtime.failure('Der Wunschbox-Status wurde inzwischen geändert. Bitte erneut prüfen.');
            }
            next.requestsEnabled = data.enabled;
            if (data.enabled && !runtime.moderatorIsActive()) { next.requestsOwnerId = runtime.userId(user); }
            else { delete next.requestsOwnerId; }
        } else if (type === 'mw:setTopic') {
            if (data.previousTopic !== undefined && data.previousTopic !== runtime.state.topic) {
                throw runtime.failure('Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.');
            }
            next.topic = runtime.text(data.topic, 80, false);
        } else { throw runtime.failure('Unbekannte Sendungsaktion.'); }
        runtime.persist(next);
    };
};

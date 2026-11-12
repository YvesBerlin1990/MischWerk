/* Chat-Einstieg in die bestehende Verwaltung, ohne eigene Fenster- oder Entwurfslogik. */
MischWerkModules.attachAdministration = function (runtime) {
    'use strict';
    runtime.administrationCommand = function (user, params) {
        try {
            if (!runtime.online(user)) { throw runtime.failure('Bitte verwende /mw admin im MischWerk-Channel.'); }
            if (!runtime.canAdminister(user)) {
                throw runtime.failure('Nur Otterchen als Channelinhaber darf die Verwaltung öffnen.');
            }
            var command = String(params || '').replace(/^\s+|\s+$/g, '').toLowerCase();
            if (command !== 'admin') {
                throw runtime.failure('Bitte verwende /mw admin.');
            }
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte versuche es gleich erneut.'); }
            var radio = runtime.getViews().filter(function (view) {
                return view.kind === 'radio' && view.userId === runtime.userId(user) && runtime.activeSession(user, view.session);
            })[0];
            if (!radio) {
                runtime.openView(user, 'radio', false);
                radio = runtime.getViews().filter(function (view) {
                    return view.kind === 'radio' && view.userId === runtime.userId(user) && runtime.activeSession(user, view.session);
                })[0];
            }
            runtime.openOverlay(user, radio.session, 'mw:openRadioTeam');
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('ADMINISTRATION_COMMAND'); }
            user.sendPrivateMessage(error.publicMessage || 'Die Verwaltung konnte gerade nicht geöffnet werden. Bitte versuche es erneut.');
        }
    };
};

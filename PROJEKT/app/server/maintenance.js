/* Appverwaltung per Chat, getrennt von Radio-Team und Moderationsrechten. */
MischWerkModules.attachMaintenance = function (runtime, config) {
    'use strict';

    var updateRequested = false;
    var pendingFiles = [];

    runtime.refreshUiCache = function () {
        KnuddelsServer.getAppAccess().getOwnInstance().getRootInstance().invalidateClientCache();
    };

    function rememberFiles(files) {
        var index;
        var name;
        if (!files || typeof files.length !== 'number') {
            throw new Error('Ungueltige Dateiliste der Update-API.');
        }
        for (index = 0; index < files.length; index += 1) {
            name = String(files[index] || '');
            if (name && pendingFiles.indexOf(name) === -1) { pendingFiles.push(name); }
        }
    }

    runtime.requestUpdate = function (user, params) {
        var root;
        var seconds;
        try {
            if (!runtime.online(user)) {
                user.sendPrivateMessage('Bitte verwende /update im MischWerk-Channel.');
                return;
            }
            if (!user.isAppManager()) {
                user.sendPrivateMessage('Nur Appmanager dürfen /update verwenden.');
                return;
            }
            if (params && String(params).replace(/^\s+|\s+$/g, '')) {
                user.sendPrivateMessage('Bitte gib nur /update ein.');
                return;
            }
            if (updateRequested || runtime.shuttingDown) {
                user.sendPrivateMessage(runtime.shuttingDown ?
                    'MischWerk wird gerade beendet. Bitte warte, bis die App wieder verfügbar ist.' :
                    'Ein Update ist bereits vorgemerkt. Bitte warte auf den Neustart.');
                return;
            }
            root = KnuddelsServer.getAppAccess().getOwnInstance().getRootInstance();
            rememberFiles(root.updateAppFiles());
            root.invalidateClientCache();
            if (!pendingFiles.length) {
                user.sendPrivateMessage('Keine neuen Dateien gefunden. Version ' + config.version + ' läuft ohne Neustart weiter.');
                return;
            }
            seconds = root.updateApp('MischWerk wird aktualisiert und steht gleich wieder zur Verfügung.',
                'MischWerk: Update per /update durch einen Appmanager angefordert.');
            updateRequested = true;
        } catch (error) {
            runtime.warn('APP_UPDATE', error);
            user.sendPrivateMessage('Update fehlgeschlagen. Bitte versuche /update erneut.');
            return;
        }
        var estimate = typeof seconds === 'number' && isFinite(seconds) && seconds >= 0 ?
            (seconds === 0 ? ' Neustart voraussichtlich in Kürze.' :
                ' Neustart voraussichtlich in ' + Math.ceil(seconds) + (seconds <= 1 ? ' Sekunde.' : ' Sekunden.')) : '';
        user.sendPrivateMessage('Update vorgemerkt.' + estimate + ' Offene Musikwünsche bleiben beim Neustart erhalten.');
    };
};

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
                user.sendPrivateMessage('Nur Appmanager von MischWerk dürfen /update verwenden.');
                return;
            }
            if (params && String(params).replace(/^\s+|\s+$/g, '')) {
                user.sendPrivateMessage('Bitte verwende /update ohne weitere Angaben.');
                return;
            }
            if (updateRequested || runtime.shuttingDown) {
                user.sendPrivateMessage('Das MischWerk-Update ist bereits angefordert. Bitte warte auf den Neustart.');
                return;
            }
            root = KnuddelsServer.getAppAccess().getOwnInstance().getRootInstance();
            rememberFiles(root.updateAppFiles());
            root.invalidateClientCache();
            if (!pendingFiles.length) {
                user.sendPrivateMessage('Keine neuen MischWerk-Dateien auf dem Server gefunden. Es erfolgt kein Neustart. ' +
                    'Laufende Version: ' + config.version + '. Der Oberflächen-Cache wurde erneuert. ' +
                    'Bitte die Statuszentrale schließen und erneut öffnen. Fehlt die Änderung weiterhin, ' +
                    'das aktuelle Paket vollständig nach /ftp/MischWerk übertragen.');
                return;
            }
            seconds = root.updateApp('MischWerk wird aktualisiert und steht gleich wieder zur Verfügung.',
                'MischWerk: Update per /update durch einen Appmanager angefordert.');
            updateRequested = true;
        } catch (error) {
            runtime.warn('APP_UPDATE', error);
            user.sendPrivateMessage('Das MischWerk-Update konnte nicht angefordert werden. Bitte versuche es erneut.');
            return;
        }
        var estimate = typeof seconds === 'number' && isFinite(seconds) && seconds >= 0 ?
            ' Voraussichtlich in ' + Math.ceil(seconds) + ' Sekunden.' : '';
        user.sendPrivateMessage(pendingFiles.length + (pendingFiles.length === 1 ? ' neue Datei wurde' : ' neue Dateien wurden') +
            ' übernommen. MischWerk-Update bei Knuddels angefordert.' + estimate +
            ' Die App wird neu gestartet; offene Wünsche werden dabei geleert.');
    };
};

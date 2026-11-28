/* Appverwaltung per Chat, getrennt von Radio-Team und Moderationsrechten. */
var MischWerkUpdateProbe = null;
MischWerkModules.attachMaintenance = function (runtime, config) {
    'use strict';

    var updateRequested = false;
    var pendingFiles = [];

    function checkFiles() {
        var cache = {}, missing = [], count = 0, target = null, received = false;
        var oldModules = MischWerkModules, oldConfig = MischWerkConfig, oldProbe = MischWerkUpdateProbe;
        function listing(directory) {
            var key = 'd' + directory, slash, parent, name, items, index, result = {};
            if (cache[key]) { return cache[key]; }
            if (directory) {
                slash = directory.lastIndexOf('/');
                parent = slash < 0 ? '' : directory.slice(0, slash);
                name = directory.slice(slash + 1);
                if (!listing(parent)['f' + name + '/']) { cache[key] = result; return result; }
            }
            items = KnuddelsServer.listFiles(directory || '.');
            if (!items || typeof items.length !== 'number' || items.length > 10000) { throw new Error('File listing'); }
            for (index = 0; index < items.length; index += 1) {
                name = String(items[index]);
                if (name.indexOf('./') === 0) { name = name.slice(2); }
                else if (name.charAt(0) === '/') { name = name.slice(1); }
                if (directory && name.indexOf(directory + '/') === 0) { name = name.slice(directory.length + 1); }
                result['f' + name] = true;
            }
            cache[key] = result; return result;
        }
        function missingMessage(files) {
            return 'Update abgebrochen. Kein Neustart. Es fehlen: ' + files.slice(0, 5).map(function (file) { return file.escapeKCode(); }).join(', ') +
                (files.length > 5 ? ' (+' + (files.length - 5) + ' weitere)' : '') +
                '. Bitte das vollständige Paket übertragen und /update erneut versuchen.';
        }
        try {
            if (!listing('server')['fapp.js']) { return missingMessage(['server/app.js']); }
            MischWerkUpdateProbe = function (plan) {
                if (received) { throw new Error('Repeated update plan'); }
                received = true; target = plan;
            };
            // Der neue Ladeplan liefert im Prüfzweig nur Daten und lädt keine Fachmodule.
            KnuddelsServer.execute('server/app.js');
        } catch (error) {
            runtime.warn('APP_UPDATE_CHECK');
            return 'Update abgebrochen. Kein Neustart: Die App-Dateien konnten nicht zuverlässig geprüft werden. Bitte erneut versuchen.';
        } finally {
            MischWerkUpdateProbe = oldProbe; MischWerkModules = oldModules; MischWerkConfig = oldConfig;
        }
        try {
            if (!target || target.schema !== 1 || typeof target.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(target.version) ||
                    typeof target.buildNumber !== 'number' || target.buildNumber < 1 || !isFinite(target.buildNumber) ||
                    Math.floor(target.buildNumber) !== target.buildNumber || !target.directories ||
                    typeof target.directories !== 'object' || Array.isArray(target.directories)) { throw new Error('Update plan'); }
            var seen = {};
            Object.keys(target.directories).forEach(function (directory) {
                if (directory.length > 200 || (directory && (!/^(?:server|www)(?:\/[a-zA-Z0-9_-]+)*$/.test(directory)))) { throw new Error('Update directory'); }
                var names = target.directories[directory];
                if (!Array.isArray(names) || !names.length) { throw new Error('Update files'); }
                var actual = listing(directory);
                names.forEach(function (name) {
                    if (typeof name !== 'string' || name.length > 120 || !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(name) ||
                            name === '.' || name === '..' || ++count > 2000) { throw new Error('Update filename'); }
                    var file = (directory ? directory + '/' : '') + name;
                    if (seen['f' + file]) { throw new Error('Duplicate update file'); }
                    seen['f' + file] = true;
                    if (!actual['f' + name]) { missing.push(file); }
                });
            });
            ['main.js', 'app.config', 'server/app.js'].forEach(function (file) {
                if (!seen['f' + file]) { throw new Error('Incomplete update plan'); }
            });
            return missing.length ? missingMessage(missing) : null;
        } catch (error) {
            runtime.warn('APP_UPDATE_CHECK');
            return 'Update abgebrochen. Kein Neustart: Die Dateiliste der Zieldateien ist ungültig oder nicht prüfbar. Bitte das vollständige aktuelle Paket übertragen.';
        }
    }

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
            var fileFailure = checkFiles();
            if (fileFailure) { user.sendPrivateMessage(fileFailure); return; }
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

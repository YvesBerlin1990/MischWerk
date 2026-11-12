/* Gemeinsamer Chat-Einstieg; bestehende Fachaktionen und Rechte bleiben zuständig. */
MischWerkModules.attachChatCommands = function (runtime) {
    'use strict';
    function overview(user) {
        var lines = ['MischWerk ist dauerhaft in deiner Appleiste geöffnet.'];
        if (runtime.canAdminister(user)) { lines.push('/mw admin – Radio-Team, Bot-Texte und Verbindung verwalten.'); }
        lines.push('Sendeplan und Wunschbox findest du in der Appleiste. Hilfe: /mw.');
        return lines.join(' ');
    }
    function homepageHelp(user) {
        var text = '/mw homepage CODE – Anmeldung auf der Homepage bestätigen. Den Code erhältst du dort.';
        if (runtime.isChannelOwner(user)) {
            text += ' /mw homepage aktivieren – Zugang einschalten. /mw homepage deaktivieren – Zugang ausschalten.' +
                ' /mw homepage status – Verbindungsadresse anzeigen.';
        }
        return text;
    }
    runtime.chatCommand = function (user, params) {
        try {
            if (!runtime.online(user)) { throw runtime.failure('Bitte verwende /mw im MischWerk-Channel.'); }
            runtime.load();
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte versuche es gleich erneut.'); }
            var value = String(params || '').replace(/^\s+|\s+$/g, '');
            var match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(value);
            var name = match ? match[1].toLowerCase() : '', argument = match && match[2] || '';
            var option = argument.toLowerCase();
            if ((!name || name === 'hilfe') && !argument) { user.sendPrivateMessage(overview(user)); return; }
            if (name === 'admin' && !argument) { runtime.administrationCommand(user, 'admin'); return; }
            if (name === 'homepage') {
                if (!argument || option === 'hilfe') { user.sendPrivateMessage(homepageHelp(user)); return; }
                if (/^[a-f0-9]{32}$/.test(argument)) { runtime.websiteCommand(user, argument); return; }
                if (['aktivieren', 'deaktivieren', 'status'].indexOf(option) !== -1) {
                    runtime.websiteCommand(user, option === 'status' ? '' : option); return;
                }
                throw runtime.failure('Bitte verwende /mw homepage hilfe.');
            }
            throw runtime.failure('Diesen Aufruf gibt es nicht. Deine Befehle findest du mit /mw.');
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('CHAT_COMMAND'); }
            user.sendPrivateMessage(error.publicMessage || 'Der Befehl konnte gerade nicht ausgeführt werden. Bitte erneut versuchen.');
        }
    };
};

/* Authentifizierter Chatbefehl verwendet den bestehenden atomaren Lauftextspeicher. */
MischWerkModules.attachTickerCommand = function (runtime) {
    'use strict';
    var commandSequence = 0;
    function tempoName(speed) { return speed === 32 ? 'Langsam' : speed === 72 ? 'Schnell' : 'Normal'; }
    function help(current) {
        return 'Lauftext ist ' + (current.enabled ? 'eingeschaltet' : 'ausgeschaltet') + '. Geschwindigkeit: ' +
            tempoName(current.speed) + ' (' + current.speed + ' px/s). ' +
            'Text setzen: /lauftext TEXT. Die +++ werden automatisch ergänzt. ' +
            'Ein: /lauftext --an. Aus: /lauftext --aus. ' +
            'Tempo: /lauftext --tempo langsam (32 px/s), /lauftext --tempo normal (48 px/s), ' +
            '/lauftext --tempo schnell (72 px/s). Auch 32, 48 und 72 sind als Tempowert möglich. ' +
            'Alle Einstellungen anzeigen: /lauftext oder /lauftext --hilfe.';
    }
    runtime.tickerCommand = function (user, params) {
        var message, changed = false;
        try {
            if (!runtime.online(user)) { throw runtime.failure('Bitte verwende /lauftext im MischWerk-Channel.'); }
            runtime.load();
            if (!runtime.isModerator(user)) { throw runtime.failure('Nur Radiomoderatoren dürfen den Lauftext ändern.'); }
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte versuche es gleich erneut.'); }
            var input = String(params || '').trim(), current = runtime.tickerState();
            var option = input.toLowerCase();
            if (!input || option === '--hilfe') { message = help(current); }
            else {
                var enabled = current.enabled, text = current.text, speed = current.speed;
                var tempo = /^--tempo(?:\s+(.*))?$/.exec(option);
                if (option === '--aus') { enabled = false; }
                else if (option === '--an') { enabled = true; }
                else if (tempo) {
                    var value = (tempo[1] || '').trim();
                    speed = value === 'langsam' || value === '32' ? 32 :
                        value === 'normal' || value === '48' ? 48 : value === 'schnell' || value === '72' ? 72 : null;
                    if (speed === null) {
                        throw runtime.failure('Bitte verwende /lauftext --tempo langsam (32 px/s), normal (48 px/s) oder schnell (72 px/s).');
                    }
                } else {
                    if (input.indexOf('--') === 0) { throw runtime.failure('Unbekannte Lauftext-Option. ' + help(current)); }
                    text = runtime.text(input.replace(/^(?:\+{3,}\s*)+|(?:\s*\+{3,})+$/g, ''), 300, true);
                    enabled = true;
                }
                if (enabled && !text) { throw runtime.failure('Bitte zuerst mit /lauftext TEXT einen Lauftext setzen.'); }
                if (current.enabled === enabled && current.text === text && current.speed === speed) { message = 'Lauftext unverändert.'; }
                else {
                    runtime.changeTicker(user, { text:text, enabled:enabled, speed:speed, direction:current.direction,
                        expectedTickerRevision:current.revision, requestId:'ticker-command-' + (++commandSequence) });
                    changed = true;
                    message = enabled ? 'Lauftext eingeschaltet. Die +++ werden automatisch angezeigt.' : 'Lauftext ausgeschaltet.';
                }
                if (tempo) { message += ' Geschwindigkeit: ' + tempoName(speed) + ' (' + speed + ' px/s).'; }
            }
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('TICKER_COMMAND'); }
            user.sendPrivateMessage(error.publicMessage || 'Der Lauftext konnte gerade nicht gespeichert werden. Bitte erneut versuchen.');
            return;
        }
        if (changed) { try { runtime.broadcast(); } catch (error) { runtime.warn('TICKER_BROADCAST'); } }
        user.sendPrivateMessage(message);
    };
};

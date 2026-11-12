/* Lauftext-Fachaktion in ES5; keine echten Nachrichten oder neuen Plattformmethoden. */
(function () {
    var runtime = MischWerkModules.createRuntime(MischWerkConfig), writes = 0, fail = false;
    runtime.state = { ticker:null, topic:'Erhalten' };
    runtime.warn = function () {};
    runtime.isModerator = function (user) { return user === 'radio'; };
    runtime.userId = function () { return Number(new java.lang.Long(41)); };
    runtime.persist = function (next) { if (fail) { throw runtime.failure('Nicht gespeichert'); } writes += 1; runtime.state = copy(next); };
    MischWerkModules.attachValidation(runtime, MischWerkConfig);
    MischWerkModules.attachTicker(runtime);
    check(!runtime.tickerState().enabled && runtime.tickerState().text === '', 'Lauftext anfangs aus und leer');
    var data = {text:'  Dein Radio\n MischWerk ',enabled:true,speed:32,direction:'right',expectedTickerRevision:0,requestId:'ticker-es5'};
    runtime.changeTicker('radio', data);
    check(runtime.tickerState().text === 'Dein Radio MischWerk' && runtime.tickerState().speed === 32 &&
        runtime.tickerState().direction === 'right', 'Normalisierte Lauftextwerte mit ES5');
    runtime.changeTicker('radio', data); check(writes === 1, 'Doppelter Auftrag ohne zweite Speicherung');
    try { runtime.changeTicker('listener', data); check(false,'Rollenprüfung fehlt'); } catch (error) { check(!!error.publicMessage,'Nur Radiomoderation'); }
    data.requestId = 'stale';
    try { runtime.changeTicker('radio', data); check(false,'Revisionsprüfung fehlt'); } catch (error) { check(writes === 1,'Alter Entwurf bleibt abgewiesen'); }
    data.expectedTickerRevision = 1; fail = true;
    try { runtime.changeTicker('radio',data); check(false,'Fehlgeschlagene Speicherung'); } catch (error) { check(runtime.tickerState().revision === 1,'Speicherfehler erhält bestätigten Stand'); }
    fail = false; data.enabled = false; runtime.changeTicker('radio',data);
    check(!runtime.tickerState().enabled && runtime.tickerState().text === 'Dein Radio MischWerk','Ausschalten erhält Text');
    check(runtime.state.topic === 'Erhalten','Lauftext erhält übrigen Appzustand');
    runtime.state.ticker = {text:new Array(302).join('x'),enabled:true,speed:0,direction:'up',revision:-1};
    check(!runtime.tickerState().enabled && runtime.tickerState().revision === 0,'Defekter gespeicherter Lauftext wird sicher normalisiert');
    var replies = [], broadcasts = 0;
    var radio = { sendPrivateMessage:function (message) { replies.push(String(message)); } };
    runtime.online = function (user) { return user === radio; };
    runtime.isModerator = function (user) { return user === radio; };
    runtime.load = function () {};
    runtime.broadcast = function () { broadcasts += 1; };
    MischWerkModules.attachTickerCommand(runtime);
    runtime.tickerCommand(radio,'+++ Dein C++ Radio +++');
    check(runtime.tickerState().text === 'Dein C++ Radio' && runtime.tickerState().enabled,'Chatbefehl aktiviert Text und erhält innere Pluszeichen');
    check(replies[replies.length-1].indexOf('eingeschaltet') >= 0 && broadcasts === 1,'Erst bestätigter Chatbefehl wird veröffentlicht');
    runtime.tickerCommand(radio,'--aus');
    check(!runtime.tickerState().enabled && runtime.tickerState().text === 'Dein C++ Radio','Chatbefehl schaltet aus und erhält den Text');
    runtime.tickerCommand(radio,'--an');check(runtime.tickerState().enabled,'Chatbefehl schaltet gespeicherten Text wieder ein');
    var savedText = runtime.tickerState().text, savedDirection = runtime.tickerState().direction;
    runtime.tickerCommand(radio,'--tempo langsam');
    check(runtime.tickerState().speed === 32 && runtime.tickerState().enabled && runtime.tickerState().text === savedText,
        'Langsames Tempo erhält eingeschalteten Inhalt');
    runtime.tickerCommand(radio,'--tempo normal');check(runtime.tickerState().speed === 48,'Normales Tempo über Chatbefehl');
    runtime.tickerCommand(radio,'--tempo schnell');check(runtime.tickerState().speed === 72,'Schnelles Tempo über Chatbefehl');
    check(runtime.tickerState().direction === savedDirection,'Tempoänderung erhält Laufrichtung');
    runtime.tickerCommand(radio,'--aus');runtime.tickerCommand(radio,'--tempo 32');
    check(!runtime.tickerState().enabled && runtime.tickerState().speed === 32 && runtime.tickerState().text === savedText,
        'Numerisches Tempo im ausgeschalteten Zustand erhält Text und Sichtbarkeit');
    var helpRevision = runtime.tickerState().revision, helpBroadcasts = broadcasts;
    runtime.tickerCommand(radio,'');runtime.tickerCommand(radio,'--hilfe');
    check(replies[replies.length-1].indexOf('--tempo schnell') >= 0 && replies[replies.length-1].indexOf('--an') >= 0 &&
        replies[replies.length-1].indexOf('--aus') >= 0, 'Private Übersicht nennt Tempo und Ein/Aus');
    check(runtime.tickerState().revision === helpRevision && broadcasts === helpBroadcasts,'Hilfe ohne Schreiben oder Zustandsbroadcast');
    runtime.tickerCommand(radio,'--tempo 49');runtime.tickerCommand(radio,'--tempo');
    check(runtime.tickerState().revision === helpRevision && runtime.tickerState().speed === 32,'Ungültiges Tempo verändert nichts');
    runtime.tickerCommand(radio,'--an');check(runtime.tickerState().enabled && runtime.tickerState().speed === 32,
        'Erneutes Einschalten übernimmt gewählte Geschwindigkeit');
    var before = copy(runtime.tickerState());fail = true;runtime.tickerCommand(radio,'Fehler');fail = false;
    check(runtime.tickerState().revision === before.revision && runtime.tickerState().text === before.text,'Fehlgeschlagener Chatbefehl erhält bestätigte Werte');
    fail = true;runtime.tickerCommand(radio,'--tempo schnell');fail = false;
    check(runtime.tickerState().revision === before.revision && runtime.tickerState().speed === before.speed,
        'Fehlgeschlagene Tempoänderung erhält bestätigte Geschwindigkeit');
    runtime.tickerCommand(radio,'+++');check(runtime.tickerState().text === before.text,'Reine Randzeichen erzeugen keinen Lauftext');
    runtime.shuttingDown=true;runtime.tickerCommand(radio,'Zu spät');check(runtime.tickerState().text === before.text,'Chatbefehl beim Shutdown abgewiesen');
}());

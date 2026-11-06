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
}());

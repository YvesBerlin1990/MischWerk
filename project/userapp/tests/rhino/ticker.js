/* Lauftext ausschließlich über /mw admin: Rechte, Revision, Wiederholungsschutz, Schrift und Speicherfehler in ES5. */
(function () {
    var runtime = MischWerkModules.createRuntime(MischWerkConfig), writes = 0, fail = false;
    runtime.state = { ticker:null, topic:'Erhalten' };
    runtime.warn = function () {};
    runtime.canUseAdministration = function (user) { return user === 'console'; };
    runtime.userId = function () { return Number(new java.lang.Long(41)); };
    runtime.persist = function (next) { if (fail) { throw runtime.failure('Nicht gespeichert'); } writes += 1; runtime.state = copy(next); };
    MischWerkModules.attachValidation(runtime, MischWerkConfig);
    MischWerkModules.attachTicker(runtime);
    check(!runtime.tickerState().enabled && runtime.tickerState().text === '', 'Lauftext anfangs aus und leer');
    check(runtime.tickerState().font === 'petit-formal-script', 'Standardschrift ohne gespeicherte Auswahl');
    var data = {text:'  Dein Radio\n MischWerk ',enabled:true,speed:32,direction:'right',expectedTickerRevision:0,requestId:'ticker-es5'};
    runtime.changeTicker('console', data);
    check(runtime.tickerState().text === 'Dein Radio MischWerk' && runtime.tickerState().speed === 32 &&
        runtime.tickerState().direction === 'right', 'Normalisierte Lauftextwerte mit ES5');
    runtime.changeTicker('console', data); check(writes === 1, 'Doppelter Auftrag ohne zweite Speicherung');
    try { runtime.changeTicker('listener', data); check(false, 'Rollenprüfung fehlt'); } catch (error) { check(!!error.publicMessage, 'Nur Konsolenberechtigte'); }
    data.requestId = 'stale';
    try { runtime.changeTicker('console', data); check(false, 'Revisionsprüfung fehlt'); } catch (error) { check(writes === 1, 'Alter Entwurf bleibt abgewiesen'); }
    data.expectedTickerRevision = 1; fail = true;
    try { runtime.changeTicker('console', data); check(false, 'Fehlgeschlagene Speicherung'); } catch (error) { check(runtime.tickerState().revision === 1, 'Speicherfehler erhält bestätigten Stand'); }
    fail = false; data.enabled = false; runtime.changeTicker('console', data);
    check(!runtime.tickerState().enabled && runtime.tickerState().text === 'Dein Radio MischWerk', 'Ausschalten erhält Text');
    check(runtime.state.topic === 'Erhalten', 'Lauftext erhält übrigen Appzustand');
    [{speed:99}, {font:'comic-sans'}, {font:null}, {enabled:'true'}, {direction:'up'}, {text:new Array(302).join('x')}, {text:'', enabled:true}].forEach(function (change, index) {
        var invalid = {text:'Gültig', enabled:true, speed:48, direction:'left', expectedTickerRevision:2, requestId:'invalid-' + index};
        Object.keys(change).forEach(function (key) { invalid[key] = change[key]; });
        var before = writes, rejected = false;
        try { runtime.changeTicker('console', invalid); } catch (error) { rejected = !!error.publicMessage; }
        check(rejected && writes === before, 'Ungültiger Lauftext verändert nichts: ' + JSON.stringify(change));
    });
    runtime.changeTicker('console', {text:'Schrift', enabled:true, speed:48, direction:'left', font:'josefin-sans', expectedTickerRevision:2, requestId:'font'});
    check(runtime.tickerState().font === 'josefin-sans', 'Gewählte Schrift gespeichert');
    runtime.changeTicker('console', {text:'Schrift', enabled:true, speed:72, direction:'left', expectedTickerRevision:3, requestId:'legacy'});
    check(runtime.tickerState().font === 'josefin-sans' && runtime.tickerState().speed === 72, 'Alte Anfrage ohne Schriftfeld behält die Schrift');
    runtime.state.ticker = {text:new Array(302).join('x'),enabled:true,speed:0,direction:'up',font:'fremd',revision:-1};
    check(!runtime.tickerState().enabled && runtime.tickerState().revision === 0 && runtime.tickerState().font === 'petit-formal-script',
        'Defekter gespeicherter Lauftext wird sicher normalisiert');
    runtime.shuttingDown = true;
    try { runtime.changeTicker('console', {text:'Zu spät', enabled:true, speed:48, direction:'left', expectedTickerRevision:0, requestId:'late'}); check(false, 'Shutdown fehlt'); }
    catch (error) { check(runtime.state.ticker.font === 'fremd', 'Lauftext beim Shutdown abgewiesen'); }
}());
(function () {
    var started = startApp(), app = started.app, runtime = started.runtime;
    try {
        var owner = person(2, 'Otterchen', true), listener = person(1, 'Hörer', false);
        app.onUserJoined(owner); app.onUserJoined(listener);
        check(app.chatCommands.lauftext === undefined, 'Kein Lauftext-Chatbefehl');
        var radio = radioSession(listener);
        app.onEventReceived(listener, 'mw:setTicker', {view:'team', viewRevision:1, requestId:'forged', expectedTickerRevision:0,
            text:'Fremd', enabled:true, speed:48, direction:'left'}, radio);
        check(latest(radio, 'mw:result').ok === false && runtime.tickerState().text === '', 'Hörer ohne Verwaltung ändert keinen Lauftext');
        app.chatCommands.mw(owner, 'admin');
        var team = viewSession(owner, 'team');
        var request = {view:'team', viewRevision:1, requestId:'ticker-app', expectedTickerRevision:0,
            text:'Grüße aus dem Studio', enabled:true, speed:72, direction:'left', font:'rajdhani'};
        app.onEventReceived(owner, 'mw:setTicker', request, team);
        check(latest(team, 'mw:result').ok === true && runtime.tickerState().speed === 72 && runtime.tickerState().font === 'rajdhani',
            'Inhaberverwaltung speichert Lauftext');
        check(latest(radioSession(listener), 'mw:state') !== null, 'Hörer erhalten den bestätigten Zustand');
        request.requestId = 'ticker-old-view'; request.viewRevision = 0; request.expectedTickerRevision = 1;
        app.onEventReceived(owner, 'mw:setTicker', request, team);
        check(latest(team, 'mw:result').ok === false && runtime.tickerState().revision === 1, 'Veraltete Ansichtsrevision bleibt abgewiesen');
        var restarted = MischWerkModules.createApp(MischWerkConfig), again = lastRuntime;
        restarted.onAppStart();
        check(again.tickerState().text === 'Grüße aus dem Studio' && again.tickerState().font === 'rajdhani', 'Lauftext übersteht Neustart');
        restarted.onPrepareShutdown(); restarted.onShutdown();
    } finally { started.stop(); }
}());

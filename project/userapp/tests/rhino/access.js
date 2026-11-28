/* Start, Befehle, Rechte, Ladeabdeckung, Sendeplan-Overlay und entfernte Altwege an der vollständigen App. */
(function () {
    var started = startApp(), app = started.app, runtime = started.runtime;
    try {
        check(cacheInvalidations === 1, 'Oberflächen-Cache beim Start erneuert');
        check(Object.keys(app.chatCommands).sort().join(',') === 'mw,settopic,update', 'Nur /mw, /settopic und /update registriert');
        var listener = person(1, 'Musikfreund', false), owner = person(2, 'Otterchen', true);
        app.onUserJoined(listener); app.onUserJoined(owner);
        var greetings = publicMessages.filter(function (message) { return message.indexOf('Willkommen bei Radio MischWerk') !== -1; });
        check(greetings.length === 2 &&
            greetings[0] === '°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Musikfreund|/w Musikfreund<°.§°r° Viel Spaß beim Zuhören.' &&
            greetings[1] === '°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Otterchen|/w Otterchen<°.§°r° Viel Spaß beim Zuhören.',
            'Einheitliche Channelbegrüßungen beim Beitritt');
        var listenerSession = radioSession(listener), ownerSession = radioSession(owner);
        check(listenerSession !== null && ownerSession !== null, 'Beitritt öffnet die Radioleiste');
        check(ownerSession.getAppContent().loading.background === '#0f1114' && ownerSession.getAppContent().loading.enabled === false,
            'Radioleiste behält deaktivierte Ladeabdeckung');
        var initial = ownerSession.getAppContent().html.data;
        check(initial.user.canAdminister === true && !('showModerationButton' in initial.user) && !('canUseModeration' in initial.user),
            'Inhaberzustand ohne Moderationsfelder');
        app.onEventReceived(listener, 'mw:refresh', {}, listenerSession);
        check(latest(listenerSession, 'mw:state').user.canAdminister === false, 'Hörer ohne Inhabernachweis');
        var ownerRight = owner.isChannelOwner;
        owner.isChannelOwner = function () { return false; };
        app.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
        check(latest(ownerSession, 'mw:state').user.canAdminister === false, 'Nick Otterchen ohne Inhaberrecht erhält keinen Zugriff');
        owner.isChannelOwner = ownerRight;
        app.onEventReceived(owner, 'mw:refresh', { requestId:'refresh-rhino-1' }, ownerSession);
        check(latest(ownerSession, 'mw:state').refreshRequestId === 'refresh-rhino-1' && latest(ownerSession, 'mw:state').user.canAdminister === true,
            'Manuelles Aktualisieren bestätigt dasselbe Datenpaket');
        app.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
        check(latest(ownerSession, 'mw:state').refreshRequestId === undefined, 'Automatische Aktualisierung ohne fremde Quittung');
        check(!Object.prototype.hasOwnProperty.call(latest(ownerSession, 'mw:state'), 'curtain') && app.chatCommands.vorhang === undefined,
            'Kein Vorhangbefehl und kein Vorhangzustand');
        app.onEventReceived(listener, 'mw:openSchedule', { requestId:'rhino-schedule' }, listenerSession);
        var schedule = viewSession(listener, 'schedule');
        check(schedule !== null && schedule.getAppContent().mode === 'Overlay', 'Sendeplan öffnet auch für Hörer als Overlay');
        check(schedule.getAppContent().loading.background === '#0f1114' && schedule.getAppContent().loading.foreground === '#0f1114' &&
            schedule.getAppContent().loading.text === '' && schedule.getAppContent().loading.enabled === true, 'Native dunkle Ladeabdeckung ohne Ladetext');
        app.onEventReceived(listener, 'mw:openSchedule', { requestId:'rhino-schedule' }, listenerSession);
        check(viewSession(listener, 'schedule') === schedule && latest(listenerSession, 'mw:result').ok, 'Doppelte Anfrage erzeugt kein zweites Fenster');
        app.onEventReceived(listener, 'mw:openWishes', { requestId:'rhino-wishes' }, listenerSession);
        check(latest(listenerSession, 'mw:result').ok === false && viewSession(listener, 'wishes') === null, 'Wunschbox ohne zentrale Sendung geschlossen');
        app.onEventReceived(listener, 'mw:refresh', { requestId:'<invalid>' }, listenerSession);
        check(latest(listenerSession, 'mw:state').refreshRequestId === undefined, 'Ungültige Aktualisierungs-ID wird nicht quittiert');
        app.onEventReceived(owner, 'mw:schedule.get', { requestId:'old-week', week:'2026-10-26' }, ownerSession);
        check(latest(ownerSession, 'mw:schedule.result').ok === false && latest(ownerSession, 'mw:schedule.data') === null, 'Alter Wochenabruf entfernt');
        app.onEventReceived(owner, 'mw:schedule.save', { requestId:'old-save', week:'2026-10-26', expectedRevision:0 }, ownerSession);
        check(latest(ownerSession, 'mw:schedule.result').ok === false && !store.data['mischwerk.schedule.v1.weeks'], 'Overlay-Schreibauftrag abgewiesen');
        var previousAccess = KnuddelsServer.getExternalServerAccess;
        KnuddelsServer.getExternalServerAccess = function () { return { canAccessURL:function () { return true; },
            getURL:function (url, callbacks) {
                var week = url.split('week=')[1], days = [];
                for (var i = 0; i < 7; i += 1) { days.push(runtime.scheduleDay(week, i)); }
                callbacks.onSuccess(new java.lang.String(JSON.stringify({ version:1, ok:true, ready:true, week:week,
                    today:runtime.scheduleToday(), days:days, revision:0, entries:[] })), javaResponse(url, 200));
            } }; };
        try {
            app.onEventReceived(listener, 'mw:schedule.day', { requestId:'rhino-day', date:'' }, schedule);
            var daily = latest(schedule, 'mw:schedule.data');
            check(daily && daily.source === 'homepage' && daily.entries.length === 0, 'Tagesansicht liest öffentliche GET-Antwort mit Java-Wrappern');
            check(!store.data['mischwerk.schedule.v1.weeks'], 'Leerer Tag erzeugt keine Kalenderpersistenz');
        } finally { KnuddelsServer.getExternalServerAccess = previousAccess; }
        var replies = [];
        owner.sendPrivateMessage = function (message) { replies.push(String(message)); };
        app.chatCommands.mw(owner, '');
        check(replies[0].indexOf('/mw admin') !== -1 && replies[0].indexOf('/mw homepage') === -1 && viewSession(owner, 'team') === null,
            'Hilfe ohne Homepage-Code oder Fenster');
        listener.sendPrivateMessage = function (message) { replies.push(String(message)); };
        app.chatCommands.mw(listener, 'hilfe');
        check(replies[1].indexOf('/mw admin') === -1, 'Hörerhilfe ohne Verwaltungsaktion');
        var privateBefore = JSON.stringify(store.data), writesBefore = persistenceWrites;
        ['', 'hilfe', 'einrichten', 'status', 'pruefen', 'http-pruefen', 'auth-pruefen'].forEach(function (argument) {
            replies.length = 0; app.chatCommands.mw(owner, '  VeRbInDuNg  ' + argument);
            check(replies.length === 1 && replies[0].indexOf('Diesen Aufruf gibt es nicht.') !== -1 && viewSession(owner, 'team') === null,
                'Verbindungsbefehl samt Unterbefehlen entfernt: ' + argument);
            check(JSON.stringify(store.data) === privateBefore && persistenceWrites === writesBefore, 'Entfernter Aufruf erhält gespeicherte Verbindung');
        });
        ['verwaltung', 'homepage', 'studio'].forEach(function (argument) {
            replies.length = 0; app.chatCommands.mw(owner, argument);
            check(viewSession(owner, 'team') === null && replies[0].indexOf('/mw') !== -1, 'Entfernter Unterbefehl öffnet kein Fenster: ' + argument);
        });
        app.chatCommands.mw(owner, 'admin');
        var team = viewSession(owner, 'team');
        check(team !== null && team.getAppContent().mode === 'Overlay', 'Verwaltung als natives Overlay');
        app.onEventReceived(owner, 'mw:androidSettings.status', {}, team);
        check(latest(team, 'mw:androidSettings.status').ok === true, 'Private Verbindungseinstellungen direkt im Verwaltungsfenster');
        var other = person(9992, 'Anderer Inhaber', true);
        other.sendPrivateMessage = function (message) { replies.push(String(message)); };
        app.onUserJoined(other); replies.length = 0; app.chatCommands.mw(other, 'admin');
        check(viewSession(other, 'team') === null && replies.length === 1, 'Anderer Inhaber ohne Verwaltungszugriff');
        var manager = person(3, 'AppManager', false);
        manager.sendPrivateMessage = function (message) { replies.push(String(message)); };
        app.onUserJoined(manager); app.chatCommands.mw(manager, 'admin');
        check(viewSession(manager, 'team') === null, 'Appmanager allein ohne Verwaltung');
        owner.isChannelOwner = function () { return false; };
        replies.length = 0; app.chatCommands.mw(owner, 'admin');
        check(replies.length === 1 && replies[0].indexOf('nur für Otterchen') !== -1, 'Nick allein verleiht kein Inhaberrecht');
        app.onEventReceived(owner, 'mw:setTicker', { view:'team', viewRevision:1, requestId:'lost-right', expectedTickerRevision:0,
            text:'Ohne Recht', enabled:true, speed:48, direction:'left' }, team);
        check(latest(team, 'mw:result').ok === false && runtime.tickerState().text === '', 'Rechteverlust verhindert Verwaltungsaktion');
        app.onEventReceived(owner, 'mw:refresh', {}, team);
        check(viewSession(owner, 'team') === null && radioSession(owner) !== null, 'Rechteverlust schließt beim Aktualisieren nur die Verwaltung');
        owner.isChannelOwner = ownerRight;
        app.onEventReceived(owner, 'mw:setTicker', { view:'team', viewRevision:1, requestId:'stale-view', expectedTickerRevision:0,
            text:'Spät', enabled:true, speed:48, direction:'left' }, team);
        check(runtime.tickerState().text === '', 'Geschlossene Verwaltung ändert nichts mehr');
        availableUpdateFiles = ['server/app.js'];
        app.chatCommands.update(listener, '');
        check(updates.length === 0, 'Hörer darf kein Update anfordern');
        app.chatCommands.update(manager, '');
        app.chatCommands.update(owner, '');
        check(updates.length === 1, 'Appmanager darf genau ein Update anfordern');
        check(warnings.length === 0, 'Keine Warnung: ' + warnings.join('|'));
    } finally { started.stop(); }
}());
(function () {
    var calendarRuntime = { failure:function (message) { return new Error(message); } };
    MischWerkModules.attachScheduleCalendar(calendarRuntime);
    var hour = 3600000;
    check(calendarRuntime.scheduleWallTime(Date.UTC(2026, 6, 1, 18)) === Date.UTC(2026, 6, 1, 20), 'Berliner Sommerzeit in Rhino');
    check(calendarRuntime.scheduleWallTime(Date.UTC(2026, 10, 2, 19)) === Date.UTC(2026, 10, 2, 20), 'Berliner Winterzeit in Rhino');
    check(calendarRuntime.scheduleWallTime(Date.UTC(2026, 9, 25, 1) - 1) === Date.UTC(2026, 9, 25, 1) - 1 + 2 * hour &&
        calendarRuntime.scheduleWallTime(Date.UTC(2026, 9, 25, 1)) === Date.UTC(2026, 9, 25, 2), 'Winterzeitwechsel um 01:00 UTC');
    check(calendarRuntime.scheduleWallTime(Date.UTC(2026, 2, 29, 1)) === Date.UTC(2026, 2, 29, 3), 'Sommerzeitwechsel um 01:00 UTC');
    check(calendarRuntime.scheduleWeek('2026-11-01') === '2026-10-26' && calendarRuntime.scheduleDay('2026-10-26', 6) === '2026-11-01', 'Montag als Wochenbeginn');
    var invalidDate = false; try { calendarRuntime.scheduleDate('2026-02-30'); } catch (error) { invalidDate = true; }
    check(invalidDate, 'Ungültiges Kalenderdatum abgewiesen');
}());
(function () {
    var oldLogger = KnuddelsServer.getDefaultLogger, logs = [], stamp = 100000;
    var runtime = { now:function () { return stamp; } };
    KnuddelsServer.getDefaultLogger = function () { return { warn:function (message) { logs.push(String(message)); } }; };
    try {
        MischWerkModules.attachDiagnostics(runtime, {});
        check(typeof runtime.logPlaybackError === 'undefined', 'Entfernter Wiedergabelog bleibt auch in Rhino entfernt');
        runtime.warn('STATE_LOAD', { name:'TypeError', lineNumber:7, message:'privat', stack:'privat' });
        check(logs.length === 1 && /STATE_LOAD.*TypeError.*Backend-Zeile:7/.test(logs[0]) && logs[0].indexOf('privat') === -1, 'Reguläre Backendwarnung bleibt datensparsam erhalten');
        runtime.warn('STATE_LOAD', {}); check(logs.length === 1, 'Reguläre Warnrate bleibt erhalten');
        stamp += 60000; runtime.warn('STATE_LOAD', {}); check(logs.length === 2, 'Reguläre Warnung nach einer Minute erneut möglich');
    } finally { KnuddelsServer.getDefaultLogger = oldLogger; }
}());

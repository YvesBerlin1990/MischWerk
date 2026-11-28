/* Native Wunschabgabe: Freigabe nur aus zentraler Sendung, Linkprüfung, Unicode, Outbox über Neustart, Wunschbox-Overlay und Eingabeweg. */
(function () {
    var externalBefore = KnuddelsServer.getExternalServerAccess, calls = [];
    KnuddelsServer.getExternalServerAccess = function () { return { canAccessURL:function () { return true; },
        postURL:function (url, parameters) { calls.push({ url:url, parameters:parameters, body:JSON.parse(parameters.data.payload) }); } }; };
    var started = startApp(centralSettings()), app = started.app, runtime = started.runtime;
    try {
        var listener = person(1, 'Musikfreund', false), owner = person(2, 'Otterchen', true);
        app.onUserJoined(listener); app.onUserJoined(owner);
        var listenerSession = radioSession(listener), ownerSession = radioSession(owner);
        var submit = function (text, id) {
            listenerSession.events = [];
            app.onEventReceived(listener, 'mw:wish.submit', { text:text, submissionId:id }, listenerSession);
            return latest(listenerSession, 'mw:wish.receipt');
        };
        var closed = submit('Queen - Bohemian Rhapsody', 'closed-1');
        check(closed.accepted === false && closed.message.indexOf('geschlossen') !== -1 && runtime.nativeRelayState().entries.length === 0,
            'Ohne zentrale Sendung bleibt die Wunschbox geschlossen');
        app.onEventReceived(listener, 'mw:openWishes', { requestId:'closed-box' }, listenerSession);
        check(latest(listenerSession, 'mw:result').ok === false && viewSession(listener, 'wishes') === null, 'Kein Wunschfenster ohne Freigabe');
        centralFinish(calls[0]);
        app.onEventReceived(listener, 'mw:refresh', {}, listenerSession);
        check(latest(listenerSession, 'mw:state').requestsEnabled === true, 'Bestätigte zentrale Sendung öffnet die Wunschbox');
        var links = ['https://youtu.be/123', 'EXAMPLE.DE', 'example.de', 'HTTPS%3A%2F%2FEXAMPLE.COM',
            'open.spotify.com/track/123', 'Spotify:track:123', '[Song](example.org)', '192.168.0.1/song',
            '//example.net/song', 'https://exa​mple.com', 'example。com', 'ÄRZTE.DE'];
        links.forEach(function (link, index) {
            var rejected = submit('Queen - Song ' + link, 'link-' + index);
            check(rejected && rejected.accepted === false && rejected.message.indexOf('ohne Links') !== -1, 'Linkprüfung: ' + link);
        });
        check(runtime.nativeRelayState().entries.length === 0, 'Abgewiesene Links erzeugen keinen Outboxeintrag');
        [['', 'leer'], [new Array(302).join('x'), 'lang'], ['Gültig', 'ungültig/kennung'], ['Gültig', new Array(82).join('a')]].forEach(function (pair) {
            check(submit(pair[0], pair[1]).accepted === false, 'Ungültiger Wunsch oder Kennung abgewiesen: ' + pair[1].slice(0, 12));
        });
        var titles = ['Aha - Take on me (Testwunsch)', 'City - Fenster', 'will.i.am - Scream & Shout',
            'M.I.A. - Paper Planes', 't.A.T.u. - All The Things She Said', 'AC/DC - Thunderstruck',
            'Mr. Big - To Be With You', 'Ärzte - Lasse redn', '100% Musik', '  Führende Leerzeichen 🎶'];
        eventOrder = [];
        titles.forEach(function (title, index) {
            var receipt = submit(title, 'rhino-' + index);
            check(receipt.pending === true && receipt.accepted === false, 'Wunsch vorgemerkt: ' + title);
        });
        check(eventOrder[0] === 'mw:wish.receipt', 'Quittung vor dem Zustandsbroadcast');
        var entries = runtime.nativeRelayState().entries;
        check(entries.length === titles.length && entries[0].text === titles[0] && entries[0].nick === 'Musikfreund', 'Text und authentifizierter Nick in der Outbox');
        check(entries[9].text.indexOf('Führende Leerzeichen 🎶') !== -1, 'Unicode in der Outbox erhalten');
        check(submit(titles[0], 'rhino-0').pending === true && runtime.nativeRelayState().entries.length === titles.length, 'Wiederholung nicht doppelt einreihen');
        app.onEventReceived(listener, 'mw:refresh', {}, listenerSession);
        check(!('queue' in latest(listenerSession, 'mw:state')) && !('queueTotal' in latest(listenerSession, 'mw:state')), 'Keine Vollqueue im Hörerzustand');
        app.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
        check(JSON.stringify(latest(ownerSession, 'mw:state')).indexOf('Take on me') === -1, 'Fremde Wunschtexte erreichen auch den Inhaber nicht');
        app.onEventReceived(listener, 'mw:openWishes', { requestId:'rhino-wishes' }, listenerSession);
        var surface = viewSession(listener, 'wishes');
        check(surface !== null && surface.getAppContent().mode === 'Overlay', 'Natives Wunschoverlay geöffnet');
        app.onEventReceived(listener, 'mw:openWishes', { requestId:'rhino-wishes' }, listenerSession);
        check(viewSession(listener, 'wishes') === surface && latest(listenerSession, 'mw:result').ok, 'Doppelte Wunschbox-Anfrage schließt nicht wieder');
        app.onEventReceived(listener, 'mw:wishes.edit', { text:'Entwurf aus dem Overlay', sequence:1 }, surface);
        check(latest(listenerSession, 'mw:wishes.input').text === 'Entwurf aus dem Overlay', 'UI-Eingabe erreicht ausschließlich Radio');
        app.onPrepareShutdown(); app.onShutdown();
        var rebooted = MischWerkModules.createApp(MischWerkConfig), rebootedRuntime = lastRuntime;
        rebooted.onAppStart();
        check(rebootedRuntime.nativeRelayState().entries.length === titles.length && rebootedRuntime.nativeRelayState().entries[0].text === titles[0],
            'Alle vorgemerkten Wünsche überstehen Shutdown und neue App');
        rebooted.onUserJoined(listener);
        var again = radioSession(listener);
        app = rebooted; listenerSession = again;
        check(submit(titles[1], 'rhino-1').pending === true && rebootedRuntime.nativeRelayState().entries.length === titles.length,
            'Gleiche Kennung nach Neustart nur einmal');
        check(warnings.length === 0, 'Keine Warnung: ' + warnings.join('|'));
        rebooted.onPrepareShutdown(); rebooted.onShutdown();
    } finally {
        started.stop(); KnuddelsServer.getExternalServerAccess = externalBefore;
    }
}());

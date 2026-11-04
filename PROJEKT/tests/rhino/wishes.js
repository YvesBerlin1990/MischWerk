/* Lokaler ES5-Test in einer echten Rhino-Engine. Kein Bestandteil des Uploads. */
var assertions = 0;
function check(condition, message) {
    assertions += 1;
    if (!condition) { throw new Error(message); }
}
function copy(value) { return JSON.parse(JSON.stringify(value)); }
var warnings = [];
var people = [];
var eventOrder = [];
var persistenceWrites = 0;
var updates = [];
var cacheInvalidations = 0;
var publicMessages = [];
String.prototype.escapeKCode = function () { return String(this).replace(/[_°<>\\]/g, '\\$&'); };
var availableUpdateFiles = ['server/app.js'];
var store = {
    getObject: function (key, fallback) { return fallback; },
    setObject: function () { persistenceWrites += 1; }
};
var KnuddelsServer = {
    execute: function (file) { load('app/' + file); },
    getPersistence: function () { return store; },
    getDefaultBotUser: function () { return { sendPublicMessage: function (message) { publicMessages.push(message); } }; },
    getDefaultLogger: function () {
        return { info: function () {}, warn: function (message) { warnings.push(message); } };
    },
    getChannel: function () { return { getOnlineUsers: function () { return people; } }; },
    getUserAccess: function () { return { getNick: function (id) { return 'Nutzer ' + id; } }; },
    getAppAccess: function () { return { getOwnInstance: function () { return {
        getRootInstance: function () { return { invalidateClientCache: function () {
            cacheInvalidations += 1;
        }, updateAppFiles: function () {
            var files = availableUpdateFiles.slice(); availableUpdateFiles = []; return files;
        }, updateApp: function (message, logMessage) {
            updates.push({ message: message, logMessage: logMessage }); return 30;
        } }; }
    }; } }; }
};
var UserType = { Human: 'human' };
function HTMLFile(asset, data) { this.data = copy(data); }
var Color = { fromHexString: function (hex) { return { asHexString: function () { return hex; } }; } };
function content(html, mode) {
    var loading = { enabled:true };
    return { html: html, mode: mode, sessions: [], closeListeners: [], loading: loading,
        getLoadConfiguration: function () { return {
            setBackgroundColor: function (color) { loading.background = color.asHexString(); },
            setForegroundColor: function (color) { loading.foreground = color.asHexString(); },
            setText: function (text) { loading.text = text; },
            setEnabled: function (enabled) { loading.enabled = enabled; }
        }; },
        getSessions: function () { return this.sessions.slice(); },
        setResponsive: function () {}, setAllowJFXBrowser: function () {},
        addCloseListener: function (callback) { this.closeListeners.push(callback); }
    };
}
var AppContent = {
    headerbarContent: function (html) { return content(html, 'Headerbar'); },
    popupContent: function (html) { return content(html, 'Popup'); },
    overlayContent: function (html) { return content(html, 'Overlay'); }
};
function person(id, nick, owner) {
    var user = { sessions: [], getUserId: function () { return id; }, getNick: function () { return nick; },
        isOnlineInChannel: function () { return true; }, isChannelOwner: function () { return !!owner; },
        isAppManager: function () { return !!owner || id === 3; },
        equals: function (other) { return !!other && other.getUserId() === id; },
        canSendAppContent: function () { return true; }, sendPrivateMessage: function () {},
        sendAppContent: function (view) {
            user.sessions.slice().filter(function (previous) { return previous.getAppContent().mode === view.mode; })
                .forEach(function (previous) { previous.nativeClose(true); });
            var session = { events: [], getUser: function () { return user; },
                getAppContent: function () { return view; },
                sendEvent: function (type, data) {
                    check(JSON.stringify(data).length < 10000, 'Eventlimit');
                    this.events.push({ type: type, data: copy(data) }); eventOrder.push(type);
                },
                remove: function () { session.nativeClose(false); },
                nativeClose: function (replacing) { view.sessions = view.sessions.filter(function (item) { return item !== session; }); user.sessions = user.sessions.filter(function (item) { return item !== session; }); view.closeListeners.forEach(function (callback) { callback(user, view, replacing); }); }
            };
            view.sessions.push(session); this.sessions.push(session); return session;
        }
    };
    people.push(user); return user;
}
function latest(session, type) {
    for (var index = session.events.length - 1; index >= 0; index -= 1) {
        if (session.events[index].type === type) { return session.events[index].data; }
    }
    return null;
}
load('app/main.js');
App.onAppStart();
check(cacheInvalidations === 1, 'Oberflaechen-Cache beim Start erneuert');
var listener = person(1, 'Musikfreund', false);
var owner = person(2, 'Otterchen', true);
App.onUserJoined(listener); App.onUserJoined(owner);
var listenerSession = listener.sessions[0];
var ownerSession = owner.sessions[0];
App.onEventReceived(owner, 'mw:openStudio', {}, ownerSession);
var studio = owner.sessions[owner.sessions.length - 1];
check(studio.getAppContent().mode === 'Overlay' && studio.getAppContent().html.data.view === 'studio', 'Moderationsfenster geoeffnet');
check(studio.getAppContent().loading.background === '#0a0a0a', 'Native Ladeflaeche vor dem HTML dunkel vorbereitet');
check(studio.getAppContent().loading.text === '' && studio.getAppContent().loading.enabled === true, 'Aktive dunkle Abdeckung ohne nativen Ladetext');
check(studio.getAppContent().loading.foreground === '#0a0a0a', 'Native Ladefarben identisch');
check(ownerSession.getAppContent().loading.background === '#0a0a0a' && ownerSession.getAppContent().loading.enabled === false, 'Eigenstaendige Radioleiste unveraendert');
App.onEventReceived(owner, 'mw:openStudio', { requestId: 'rhino-focus' }, ownerSession);
App.onEventReceived(owner, 'mw:openStudio', { requestId: 'rhino-focus' }, ownerSession);
App.onEventReceived(owner, 'mw:overlay.ready', { token:latest(studio, 'mw:overlay.prepare').token, state:{}, revision:1 }, studio);
var previousStudio = studio; studio = owner.sessions[owner.sessions.length - 1];
check(studio !== previousStudio, 'Bewusster nativer Aufruf erzeugt frische Sitzung');
App.onEventReceived(owner, 'mw:openStudio', { requestId:'rhino-focus' }, ownerSession);
check(owner.sessions[owner.sessions.length - 1] === studio, 'Doppelte Anfrage erzeugt kein zweites Fenster');
check(latest(ownerSession, 'mw:result').ok, 'Doppelte Fokus-Anfrage bestaetigt ohne erneutes Oeffnen');
// Nach der Initialisierung darf kein Wunsch die Persistenz aufrufen.
store.getObject = function () { throw new Error('Keine Persistenz im Wunschweg'); };
store.setObject = function () { throw new Error('Keine Persistenz im Wunschweg'); };
function submit(text, id) {
    listenerSession.events = [];
    App.onEventReceived(listener, 'mw:wish.submit', { text: text, submissionId: id }, listenerSession);
    return latest(listenerSession, 'mw:wish.receipt');
}
var titles = ['Aha - Take on me (Testwunsch)', 'City - Fenster', 'will.i.am - Scream & Shout',
    'M.I.A. - Paper Planes', 't.A.T.u. - All The Things She Said', 'AC/DC - Thunderstruck',
    'Mr. Big - To Be With You', '\u00c4rzte - Lasse redn', '100% Musik'];
eventOrder = [];
for (var index = 0; index < titles.length; index += 1) {
    var receipt = submit(titles[index], 'rhino-' + index);
    check(receipt && receipt.accepted === true, 'Wunsch abgewiesen: ' + titles[index] + '; ' + warnings.join('|'));
}
check(eventOrder[0] === 'mw:wish.receipt', 'Quittung muss vor dem Broadcast erfolgen');
var state = latest(studio, 'mw:state');
check(state.queueTotal === titles.length, 'Studio erhaelt Queue');
check(state.queue[0].text === titles[0] && state.queue[0].nick === 'Musikfreund', 'Text und authentifizierter Nick');
check(latest(listenerSession, 'mw:state').queue.length === 0, 'Keine Hoererqueue');
check(latest(listenerSession, 'mw:state').myRequests.length === 0, 'Keine Hoererhistorie');
var links = ['https://youtu.be/123', 'EXAMPLE.DE', 'example.de', 'HTTPS%3A%2F%2FEXAMPLE.COM',
    'open.spotify.com/track/123', 'Spotify:track:123', '[Song](example.org)', '192.168.0.1/song',
    '//example.net/song', 'https://exa\u200bmple.com', 'example\u3002com', '\u00c4RZTE.DE'];
for (index = 0; index < links.length; index += 1) {
    var rejected = submit('Queen - Song ' + links[index], 'link-' + index);
    check(rejected && rejected.accepted === false && rejected.message.indexOf('Keine Links') !== -1, 'Linkpruefung: ' + links[index]);
}
for (index = titles.length; index < 125; index += 1) {
    check(submit('Wunsch ' + index, 'rhino-' + index).accepted, 'Keine Wunschbegrenzung');
}
check(submit(titles[0], 'rhino-0').accepted, 'Wiederholung quittieren');
check(latest(studio, 'mw:state').queueTotal === 125, 'Wiederholung nicht doppelt einreihen');
check(persistenceWrites === 0, 'Keine Wunschpersistenz');
check(warnings.length === 0, 'Keine Warnung: ' + warnings.join('|'));
App.chatCommands.update(listener, '');
check(updates.length === 0, 'Hoerer darf kein Update anfordern');
var manager = person(3, 'AppManager', false);
App.chatCommands.update(manager, '');
App.chatCommands.update(owner, '');
check(updates.length === 1, 'Appmanager darf genau ein Update anfordern');
check(latest(studio, 'mw:state').queueTotal === 125, 'Updateanforderung erhaelt Queue bis zum Neustart');
var positions = latest(listenerSession, 'mw:state').wishPositions;
check(positions.total === 125 && positions.items.length === 1, 'Eigene Positionen klein paginiert');
check(positions.items[0].position === 1 && positions.pages === 125, 'Echte Queuepositionen in Rhino');
check(latest(studio, 'mw:state').wishPositions.total === 0, 'Keine fremden Positionen fuer Besitzer');
App.onEventReceived(listener, 'mw:refresh', { myPage: 124 }, listenerSession);
positions = latest(listenerSession, 'mw:state').wishPositions;
check(positions.page === 124 && positions.items.length === 1, 'Letzte eigene Seite in Rhino');
check(positions.items[0].position === 125, 'Letzte Queuepositionen vollstaendig');
// Kalender und Wochenpersistenz ebenfalls unter der echten Rhino-Engine ausführen.
store = { data: {}, getObject: function (key, fallback) { return this.data[key] ? copy(this.data[key]) : fallback; },
    setObject: function (key, value) { this.data[key] = copy(value); } };
KnuddelsServer.getUserAccess = function () { return {
    exists: function (nick) { return nick === 'Otterchen' || nick === 'Musikfreund'; },
    getUserId: function (nick) { return nick === 'Otterchen' ? 2 : 1; },
    getNick: function (id) { return id === 2 ? 'Otterchen' : 'Musikfreund'; }
}; };
App.onEventReceived(owner, 'mw:openSchedule', {}, ownerSession);
App.onEventReceived(owner, 'mw:overlay.ready', { token: latest(studio, 'mw:overlay.prepare').token, state: {}, revision: 1 }, studio);
var scheduleSession = owner.sessions[owner.sessions.length - 1];
check(scheduleSession !== studio && scheduleSession.getAppContent().html.data.view === 'schedule', 'Sendeplan in eigener nativer Sitzung');
check(scheduleSession.getAppContent().loading.enabled === true, 'Native dunkle Abdeckung aktiv');
App.onEventReceived(owner, 'mw:schedule.get', { requestId: 'schedule-read', week: '2026-10-26' }, scheduleSession);
var programme = latest(scheduleSession, 'mw:schedule.data');
check(programme && programme.days.length === 7 && programme.days[6] === '2026-11-01', 'Sieben Kalenderdaten in Rhino');
App.onEventReceived(owner, 'mw:schedule.save', { requestId: 'schedule-save', week: '2026-10-26',
    expectedRevision: 0, date: '2026-10-26', start: '19:00', end: '21:00', nick: 'Otterchen', topic: 'Wochenprogramm' }, scheduleSession);
check(latest(scheduleSession, 'mw:schedule.result').ok, 'Sendung in Rhino speichern');
App.onEventReceived(owner, 'mw:schedule.get', { requestId: 'schedule-read-2', week: '2026-10-26' }, scheduleSession);
programme = latest(scheduleSession, 'mw:schedule.data');
check(programme.entries.length === 1 && programme.entries[0].nick === 'Otterchen', 'Gespeicherten Wochenplan lesen');
check(JSON.stringify(programme).indexOf('userId') === -1, 'Keine private User-ID im Sendeplan');
App.onEventReceived(listener, 'mw:schedule.save', { requestId: 'schedule-forged', week: '2026-10-26',
    expectedRevision: 1, date: '2026-10-26', start: '21:00', end: '23:00', nick: 'Musikfreund', topic: 'Fremd' }, listenerSession);
check(!latest(listenerSession, 'mw:schedule.result').ok, 'Hoerer darf Sendeplan nicht bearbeiten');
App.onEventReceived(owner, 'mw:schedule.save', { requestId: 'schedule-night', week: '2026-10-26',
    expectedRevision: 1, date: '2026-11-01', start: '22:00', end: '02:00', nick: 'Otterchen', topic: 'Nachtprogramm' }, scheduleSession);
check(latest(scheduleSession, 'mw:schedule.result').ok, 'Sendung ueber Mitternacht');
App.onEventReceived(owner, 'mw:schedule.get', { requestId: 'schedule-next', week: '2026-11-02' }, scheduleSession);
check(latest(scheduleSession, 'mw:schedule.data').entries[0].week === '2026-10-26', 'Fortsetzung am Montag sichtbar');
App.onEventReceived(owner, 'mw:schedule.delete', { requestId: 'schedule-delete', week: '2026-10-26',
    expectedRevision: 2, id: 1 }, scheduleSession);
check(latest(scheduleSession, 'mw:schedule.result').ok, 'Sendung in Rhino entfernen');
check(publicMessages.length === 0, 'Keine Studio-Meldung beim Start oder Wunschversand');
App.onEventReceived(owner, 'mw:onAir', {}, ownerSession);
check(publicMessages.length === 1 && publicMessages[0].indexOf('Otterchen betritt das Studio') !== -1, 'ON AIR im Nick-Bot');
App.onEventReceived(owner, 'mw:onAir', {}, ownerSession);
check(publicMessages.length === 1, 'Verlaengerung ohne doppelte Meldung');
App.onEventReceived(owner, 'mw:offAir', {}, ownerSession);
check(publicMessages.length === 2 && publicMessages[1].indexOf('Otterchen verlässt das Studio') !== -1, 'OFF AIR im Nick-Bot');
check(warnings.length === 0, 'Keine Warnung bei Studio-Meldungen');
App.onEventReceived(owner, 'mw:addRadioModerator', { nick: 'Musikfreund' }, ownerSession);
App.onEventReceived(owner, 'mw:onAir', {}, ownerSession);
var previousModerator = latest(ownerSession, 'mw:state').moderator;
App.onEventReceived(owner, 'mw:handover.request', { nick: 'Musikfreund', expectedModerator: previousModerator.sessionKey,
    notes: 'Bitte die Geburtstagsgruesse vorlesen.' }, ownerSession);
var incoming = latest(listenerSession, 'mw:state').handover.incoming;
check(incoming && publicMessages.length === 3, 'Uebergabe wartet ohne oeffentliche Meldung');
check(incoming.notes === 'Bitte die Geburtstagsgruesse vorlesen.', 'Private Uebergabenotiz in Rhino');
App.onEventReceived(listener, 'mw:handover.accept', { id: incoming.id, topic: 'Neue Sendung' }, listenerSession);
check(latest(listenerSession, 'mw:result').ok, 'Uebergabe angenommen');
check(latest(listenerSession, 'mw:state').moderator.nick === 'Musikfreund', 'Neuer Moderator in Rhino');
check(latest(listenerSession, 'mw:state').topic === 'Neue Sendung', 'Neues Thema gemeinsam gespeichert');
check(latest(listenerSession, 'mw:state').handover.receivedNotes === incoming.notes, 'Hinweis nach Uebernahme erhalten');
check(latest(ownerSession, 'mw:state').handover.receivedNotes === null, 'Uebernommener Hinweis nur beim Empfaenger');
check(typeof latest(listenerSession, 'mw:state').moderator.since === 'number', 'Bestaetigte Studiozeit bleibt erhalten');
check(!('assistant' in latest(listenerSession, 'mw:state')), 'Entfernter Sendungsassistent bleibt aus dem Snapshot');
check(publicMessages.length === 4 && publicMessages[3].indexOf('Otterchen macht Platz im Studio') !== -1, 'Eine gemeinsame Uebergabemeldung');
App.onEventReceived(owner, 'mw:onAir', {}, ownerSession);
check(!latest(ownerSession, 'mw:result').ok && publicMessages.length === 4, 'Keine direkte Uebernahme ohne Bestaetigung');
App.onEventReceived(owner, 'mw:openWishes', { requestId: 'rhino-wishes' }, ownerSession);
App.onEventReceived(owner, 'mw:overlay.ready', { token: latest(scheduleSession, 'mw:overlay.prepare').token, state: {}, revision: 1, view: 'schedule', viewRevision: 2 }, scheduleSession);
check(latest(ownerSession, 'mw:result').ok, 'Natives Wunschoverlay in Rhino geoeffnet');
var surfaceSession = owner.sessions.filter(function (active) { return active.getAppContent().html.data.wishSurface; })[0];
check(!!surfaceSession, 'Wunschoberflaeche getrennt von Radio');
App.onEventReceived(owner, 'mw:openWishes', { requestId: 'rhino-wishes' }, ownerSession);
check(owner.sessions.indexOf(surfaceSession) !== -1, 'Doppelte Wunschbox-Anfrage schliesst nicht wieder');
check(latest(ownerSession, 'mw:result').ok, 'Doppelte Wunschbox-Anfrage sicher bestaetigt');
App.onEventReceived(owner, 'mw:wishes.edit', { text:'Entwurf aus dem Overlay', sequence:1 }, surfaceSession);
check(latest(ownerSession, 'mw:wishes.input').text === 'Entwurf aus dem Overlay', 'UI-Eingabe erreicht ausschliesslich Radio');
check(warnings.length === 0, 'Overlay ohne Rhino-Warnungen');
App.onEventReceived(owner, 'mw:refresh', { page: 0 }, ownerSession);
var firstWish = latest(ownerSession, 'mw:state').queue[0];
var totalBeforeStage = latest(ownerSession, 'mw:state').queueTotal;
App.onEventReceived(owner, 'mw:setWishStage', { id: firstWish.id, previousStage: 'queued', stage: 'preparing' }, ownerSession);
check(latest(ownerSession, 'mw:result').ok, 'Wunsch in Rhino vorbereiten');
check(latest(ownerSession, 'mw:state').queue[0].stage === 'preparing', 'Vorbereitung angezeigt');
App.onEventReceived(owner, 'mw:setWishStage', { id: firstWish.id, previousStage: 'preparing', stage: 'playing' }, ownerSession);
check(latest(ownerSession, 'mw:result').ok, 'Laufenden Wunsch in Rhino markieren');
check(latest(ownerSession, 'mw:state').queueTotal === totalBeforeStage, 'Status entfernt keinen Wunsch');
var calendarRuntime = { failure: function (message) { return new Error(message); } };
MischWerkModules.attachScheduleCalendar(calendarRuntime);
check(calendarRuntime.scheduleTimestamp('2026-07-01', '20:00') === Date.UTC(2026, 6, 1, 18), 'Berliner Sommerzeit in Rhino');
check(calendarRuntime.scheduleTimestamp('2026-11-02', '20:00') === Date.UTC(2026, 10, 2, 19), 'Berliner Winterzeit in Rhino');
check(calendarRuntime.scheduleTimestamp('2026-10-25', '02:30', true) - calendarRuntime.scheduleTimestamp('2026-10-25', '02:30', false) === 3600000,
    'Doppelte Stunde bei Winterzeitwechsel');
check(warnings.length === 0, 'Neue Moderationsfunktionen ohne Rhino-Warnungen');
App.onEventReceived(owner, 'mw:refresh', { requestId: 'refresh-rhino-1' }, ownerSession);
check(latest(ownerSession, 'mw:state').refreshRequestId === 'refresh-rhino-1', 'Manuelles Aktualisieren bestaetigt dasselbe Datenpaket');
App.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
check(latest(ownerSession, 'mw:state').refreshRequestId === undefined, 'Automatische Aktualisierung ohne fremde Quittung');
App.onEventReceived(owner, 'mw:refresh', { requestId: '<invalid>' }, ownerSession);
check(!latest(ownerSession, 'mw:result').ok, 'Ungueltige Aktualisierungs-ID abgewiesen');
App.chatCommands.vorhang(owner, 'öffnen');
check(latest(listenerSession, 'mw:state').curtain.closed === false, 'Vorhang oeffnen per Chat in Rhino');
App.chatCommands.vorhang(listener, 'schließen');
App.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
check(latest(ownerSession, 'mw:state').curtain.closed === false, 'Hoerer darf Vorhang nicht schliessen');
App.chatCommands.vorhang(owner, 'schließen');
check(latest(listenerSession, 'mw:state').curtain.closed === true, 'Vorhang schliessen per Chat in Rhino');
App.chatCommands.vorhang(owner, 'toggle');
App.onEventReceived(owner, 'mw:refresh', {}, ownerSession);
check(latest(ownerSession, 'mw:state').curtain.closed === true, 'Ungueltige Chatangabe erhaelt Vorhang');
print('Rhino-Wunschweg OK: ' + assertions + ' Pruefungen, 125 Wuensche, ' + links.length + ' abgewiesene Links; Sendeplan und Studio-Meldungen ebenfalls geprueft.');

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
function content(html, mode) {
    return { html: html, mode: mode, sessions: [], closeListeners: [],
        getSessions: function () { return this.sessions.slice(); },
        setResponsive: function () {}, setAllowJFXBrowser: function () {},
        addCloseListener: function (callback) { this.closeListeners.push(callback); }
    };
}
var AppContent = {
    headerbarContent: function (html) { return content(html, 'radio'); },
    popupContent: function (html) { return content(html, html.data.view); },
    overlayContent: function (html) { return content(html, 'wishes'); }
};
function person(id, nick, owner) {
    var user = { sessions: [], getUserId: function () { return id; }, getNick: function () { return nick; },
        isOnlineInChannel: function () { return true; }, isChannelOwner: function () { return !!owner; },
        isAppManager: function () { return !!owner || id === 3; },
        equals: function (other) { return !!other && other.getUserId() === id; },
        canSendAppContent: function () { return true; }, sendPrivateMessage: function () {},
        sendAppContent: function (view) {
            var session = { events: [], getUser: function () { return user; },
                getAppContent: function () { return view; },
                sendEvent: function (type, data) {
                    check(JSON.stringify(data).length < 10000, 'Eventlimit');
                    this.events.push({ type: type, data: copy(data) }); eventOrder.push(type);
                },
                remove: function () { view.sessions = []; }
            };
            view.sessions.push(session); this.sessions.push(session); return true;
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
check(studio.getAppContent().mode === 'studio', 'Moderationsfenster geoeffnet');
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
check(positions.total === 125 && positions.items.length === 3, 'Eigene Positionen klein paginiert');
check(positions.items[0].position === 1 && positions.items[2].position === 3, 'Echte Queuepositionen in Rhino');
check(latest(studio, 'mw:state').wishPositions.total === 0, 'Keine fremden Positionen fuer Besitzer');
App.onEventReceived(listener, 'mw:refresh', { myPage: 41 }, listenerSession);
positions = latest(listenerSession, 'mw:state').wishPositions;
check(positions.page === 41 && positions.items.length === 2, 'Letzte eigene Seite in Rhino');
check(positions.items[0].position === 124 && positions.items[1].position === 125, 'Letzte Queuepositionen vollstaendig');
// Kalender und Wochenpersistenz ebenfalls unter der echten Rhino-Engine ausführen.
store = { data: {}, getObject: function (key, fallback) { return this.data[key] ? copy(this.data[key]) : fallback; },
    setObject: function (key, value) { this.data[key] = copy(value); } };
KnuddelsServer.getUserAccess = function () { return {
    exists: function (nick) { return nick === 'Otterchen' || nick === 'Musikfreund'; },
    getUserId: function (nick) { return nick === 'Otterchen' ? 2 : 1; },
    getNick: function (id) { return id === 2 ? 'Otterchen' : 'Musikfreund'; }
}; };
App.onEventReceived(owner, 'mw:openSchedule', {}, ownerSession);
var scheduleSession = owner.sessions[owner.sessions.length - 1];
check(scheduleSession.getAppContent().mode === 'schedule', 'Eigenes Sendeplan-Popup');
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
App.onEventReceived(owner, 'mw:handover.request', { nick: 'Musikfreund', expectedModerator: previousModerator.sessionKey }, ownerSession);
var incoming = latest(listenerSession, 'mw:state').handover.incoming;
check(incoming && publicMessages.length === 3, 'Uebergabe wartet ohne oeffentliche Meldung');
App.onEventReceived(listener, 'mw:handover.accept', { id: incoming.id, topic: 'Neue Sendung' }, listenerSession);
check(latest(listenerSession, 'mw:result').ok, 'Uebergabe angenommen');
check(latest(listenerSession, 'mw:state').moderator.nick === 'Musikfreund', 'Neuer Moderator in Rhino');
check(latest(listenerSession, 'mw:state').topic === 'Neue Sendung', 'Neues Thema gemeinsam gespeichert');
check(publicMessages.length === 4 && publicMessages[3].indexOf('Otterchen macht Platz im Studio') !== -1, 'Eine gemeinsame Uebergabemeldung');
App.onEventReceived(owner, 'mw:onAir', {}, ownerSession);
check(!latest(ownerSession, 'mw:result').ok && publicMessages.length === 4, 'Keine direkte Uebernahme ohne Bestaetigung');
App.onEventReceived(owner, 'mw:openWishes', {}, ownerSession);
check(latest(ownerSession, 'mw:result').ok, 'Natives Wunschoverlay in Rhino geoeffnet');
var surfaceSession = owner.sessions.filter(function (active) { return active.getAppContent().html.data.wishSurface; })[0];
check(!!surfaceSession, 'Wunschoberflaeche getrennt von Radio');
App.onEventReceived(owner, 'mw:wishes.edit', { text:'Entwurf aus dem Overlay', sequence:1 }, surfaceSession);
check(latest(ownerSession, 'mw:wishes.input').text === 'Entwurf aus dem Overlay', 'UI-Eingabe erreicht ausschliesslich Radio');
check(warnings.length === 0, 'Overlay ohne Rhino-Warnungen');
print('Rhino-Wunschweg OK: ' + assertions + ' Pruefungen, 125 Wuensche, ' + links.length + ' abgewiesene Links; Sendeplan und Studio-Meldungen ebenfalls geprueft.');

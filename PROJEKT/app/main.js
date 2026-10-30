/* MischWerk 0.1.25 - Knuddels UserApps Backend (Rhino, kein Node.js).
 * Verbindliche Regeln: ../AGENTS.md. API-Nachweise: ../docs/API-NACHWEIS.md.
 */
var MischWerkConfig = {
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    // Öffentliche Radio-ID aus RadioKing; keine Live-/Manager-Zugangsdaten nötig.
    radioking: {
        radioId: 'mischwerk'
    },
    // Zusätzliche Radio-Moderatoren nur über echte numerische Knuddels-User-IDs.
    radioModeratorUserIds: [],
    maxQueueLength: 50,
    moderatorSessionHours: 6
};

var App = (function (config) {
    'use strict';
    var KEY = 'mischwerk.state.v1';
    var PAGE_SIZE = 1;
    var state;
    var views = [];
    var shuttingDown = false;
    var lastWarningAt = 0;
    var inactiveModeratorKey = null;

    function now() { return new Date().getTime(); }
    function copy(value) { return JSON.parse(JSON.stringify(value)); }
    function failure(message) { var error = new Error(message); error.publicMessage = message; return error; }
    function warn() {
        if (lastWarningAt && now() - lastWarningAt < 60000) { return; }
        lastWarningAt = now();
        try { KnuddelsServer.getDefaultLogger().warn('MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.'); }
        catch (ignored) { /* Fehler beim Loggen darf den App-Zustand nicht ändern. */ }
    }
    function jsonBytes(value) {
        var length = 0;
        for (var i = 0; i < value.length; i += 1) {
            var code = value.charCodeAt(i);
            if (code < 128) { length += 1; }
            else if (code < 2048) { length += 2; }
            else if (code >= 55296 && code <= 56319 && i + 1 < value.length &&
                    value.charCodeAt(i + 1) >= 56320 && value.charCodeAt(i + 1) <= 57343) { length += 4; i += 1; }
            else { length += 3; }
        }
        return length;
    }
    function initialState() {
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, moderator: null, requests: [], cooldowns: {}, nextId: 1 };
    }
    function persist(next) {
        next.revision = (state && state.revision || 0) + 1;
        if (jsonBytes(JSON.stringify(next)) > 90000) { throw failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.'); }
        KnuddelsServer.getPersistence().setObject(KEY, next);
        state = next;
    }
    function load() {
        if (state) { return; }
        var saved = KnuddelsServer.getPersistence().getObject(KEY, null);
        if (saved && (saved.version !== 1 || !Array.isArray(saved.requests) ||
                typeof saved.requestsEnabled !== 'boolean' || typeof saved.nextId !== 'number')) {
            throw new Error('Unbekanntes MischWerk-Datenformat. Persistenz vor Migration sichern.');
        }
        state = saved || initialState();
        state.topic = typeof state.topic === 'string' ? state.topic : '';
        state.cooldowns = state.cooldowns || {};
        state.revision = typeof state.revision === 'number' ? state.revision : 0;
        prune();
    }
    function prune() {
        if (!state.moderator) { return false; }
        if (!moderatorIsActive()) {
            inactiveModeratorKey = moderatorKey();
            var next = copy(state);
            next.moderator = null;
            persist(next);
            return true;
        }
        return false;
    }
    function moderatorKey() { return state.moderator ? state.moderator.sessionKey || String(state.moderator.since) : null; }
    function moderatorIsActive() {
        if (!state.moderator || state.moderator.expiresAt <= now() || moderatorKey() === inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return user.getUserId() === state.moderator.userId && isModerator(user);
        });
    }
    function online(user) { return !!user && user.isOnlineInChannel(); }
    function isModerator(user) {
        return online(user) && (user.isChannelOwner() || user.isChannelModerator() ||
            config.radioModeratorUserIds.indexOf(user.getUserId()) !== -1);
    }
    function station() {
        var settings = config.radioking || {};
        var id = typeof settings.radioId === 'string' ? settings.radioId.trim().toLowerCase() : '';
        if (id.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) { id = ''; }
        // URLs ausschließlich ableiten: kein Passwort, API-Schlüssel oder fremder Host im Event.
        var stream = id ? 'https://play.radioking.io/' + id : '';
        return { name: config.stationName, provider: 'radioking', radioId: id, configured: !!id,
            streamUrl: stream, stationUrl: stream,
            metadataUrl: id ? 'https://api.radioking.io/widget/radio/' + id + '/track/current' : '' };
    }
    function requestText(item) {
        if (typeof item.text === 'string') { return item.text; }
        // Bereits gespeicherte Wünsche aus dem früheren Formular bleiben lesbar.
        return [item.artist, item.title].filter(function (part) { return !!part; }).join(' – ') +
            (item.message ? ' · ' + item.message : '');
    }
    function requestView(item) {
        return { id: item.id, nick: item.nick, artist: item.artist, title: item.title,
            message: item.message, text: requestText(item), createdAt: item.createdAt,
            delivery: item.delivery ? { nick: item.delivery.nick, at: item.delivery.at } : null };
    }
    function snapshot(user, page, myPage, feedbackId) {
        var mod = isModerator(user);
        var presenter = moderatorIsActive() ? state.moderator : null;
        var own = state.requests.filter(function (item) { return item.userId === user.getUserId(); });
        var totalPages = Math.max(1, Math.ceil(state.requests.length / PAGE_SIZE));
        var ownPages = Math.max(1, Math.ceil(own.length / PAGE_SIZE));
        myPage = Math.max(0, Math.min(ownPages - 1, Math.floor(Number(myPage) || 0)));
        var feedback = own.filter(function (item) { return item.id === feedbackId; })[0] || own[own.length - 1];
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: station(),
            topic: state.topic,
            revision: state.revision,
            user: { nick: user.getNick(), canModerate: mod,
                isOnAir: !!(mod && presenter && presenter.userId === user.getUserId()),
                canEndModeration: !!(mod && presenter && (presenter.userId === user.getUserId() || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: state.requestsEnabled && !shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, sessionKey: moderatorKey() } : null,
            myRequests: own.slice(myPage * PAGE_SIZE, (myPage + 1) * PAGE_SIZE).map(requestView),
            myTotal: own.length,
            myPage: myPage,
            myPages: ownPages,
            requestFeedback: feedback ? requestView(feedback) : null,
            queue: mod ? state.requests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(requestView) : [],
            queueTotal: mod ? state.requests.length : 0,
            page: mod ? page : 0,
            pages: mod ? totalPages : 1,
            serverTime: now(),
            shuttingDown: shuttingDown
        };
    }
    function send(session, type, data) {
        try { if (session) { session.sendEvent(type, data); } }
        catch (error) { warn(); }
    }
    function refresh(session, user, page, myPage) {
        var view = views.filter(function (item) { return item.userId === user.getUserId() && item.content === session.getAppContent(); })[0];
        // Bei Push/Bestätigung denselben Wunsch halten, auch wenn davor ein anderer entfernt wurde.
        if (page === undefined && view && view.queueId) {
            state.requests.some(function (item, index) {
                if (item.id !== view.queueId) { return false; }
                page = Math.floor(index / PAGE_SIZE); return true;
            });
        }
        var next = snapshot(user, page === undefined && view ? view.page : page,
            myPage === undefined && view ? view.myPage : myPage, view ? view.feedbackId : null);
        if (view) { view.page = next.page; view.myPage = next.myPage; view.queueId = next.queue.length ? next.queue[0].id : null; }
        send(session, 'mw:state', next);
    }
    function broadcast() {
        views.forEach(function (view) {
            try {
                view.content.getSessions().forEach(function (session) {
                    try { var user = session.getUser(); if (online(user)) { refresh(session, user); } }
                    catch (error) { warn(); }
                });
            } catch (error) { warn(); }
        });
    }
    function result(session, ok, message, action, requestId, request) {
        var response = { ok: ok, message: message, action: action, requestId: requestId };
        if (request) { response.request = requestView(request); }
        send(session, 'mw:result', response);
    }
    function activeSession(user, session) {
        try {
            return !!session && online(user) && user.equals(session.getUser()) &&
                session.getAppContent().getSessions().some(function (active) { return user.equals(active.getUser()); });
        } catch (error) { return false; }
    }
    function text(value, max, required) {
        if (typeof value !== 'string') { throw failure('Bitte gültigen Text eingeben.'); }
        var clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
        if ((required && !clean) || clean.length > max) {
            throw failure('Bitte die Eingabe prüfen (maximal ' + max + ' Zeichen).');
        }
        return clean;
    }
    function containsWishLink(value) {
        var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
        try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
        if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/i.test(candidate)) { return true; }
        // Initialen in Namen wie will.i.am oder M.I.A. nicht mit einer Domain verwechseln.
        return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/i.test(candidate) ||
            /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/i.test(candidate);
    }
    function addRequest(user, data) {
        var key = 'u' + user.getUserId();
        // Historischer Feldname: nur Wiederholungs-Erkennung, keine Wartezeit oder Begrenzung.
        var previous = state.cooldowns[key];
        if (data.requestId && ((previous && previous.requestId === data.requestId) ||
                state.requests.some(function (item) { return item.userId === user.getUserId() && item.requestId === data.requestId; }))) { return false; }
        if (shuttingDown || !state.requestsEnabled) { throw failure('Die Wunschbox ist deaktiviert.'); }
        var timestamp = now();
        if (state.requests.length >= config.maxQueueLength) { throw failure('Die Wunschbox ist voll. Versuche es später erneut.'); }
        var wishText = data.text !== undefined ? text(data.text, 300, true) :
            text(data.artist, 80, true) + ' – ' + text(data.title, 80, true) +
                (data.message ? ' · ' + text(data.message, 200, false) : '');
        if (containsWishLink(wishText)) { throw failure('Nur Interpret + Titel. Keine Links.'); }
        var item = {
            id: state.nextId,
            userId: user.getUserId(),
            nick: user.getNick(),
            text: wishText,
            delivery: null,
            requestId: data.requestId || null,
            createdAt: timestamp
        };
        var next = copy(state);
        next.nextId += 1;
        next.requests.push(item);
        next.cooldowns[key] = { at: timestamp, requestId: data.requestId || null };
        persist(next);
        return item;
    }
    function acknowledgeRequest(user, data, session) {
        if (!isModerator(user)) { throw failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var view = views.filter(function (item) { return item.userId === user.getUserId() && item.content === session.getAppContent(); })[0];
        if (!view || view.kind !== 'studio') { throw failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = state.requests[view.page * PAGE_SIZE];
        if (!item || item.id !== data.id) { throw failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        if (item.delivery) { return false; }
        var next = copy(state);
        next.requests[view.page * PAGE_SIZE].delivery = { userId: user.getUserId(), nick: user.getNick(), at: now() };
        persist(next);
        return true;
    }
    function moderate(user, type, data) {
        if (!isModerator(user)) { throw failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        // Vergleich fachlicher Werte statt globaler Revision: Empfangsquittungen erzeugen keine falschen Konflikte.
        if ((type === 'mw:onAir' || type === 'mw:offAir') && data.expectedModerator !== undefined && data.expectedModerator !== moderatorKey()) {
            throw failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = copy(state);
        if (type === 'mw:setRequests') {
            if (typeof data.enabled !== 'boolean') { throw failure('Ungültiger Wunschbox-Status.'); }
            if (data.previousEnabled !== undefined && data.previousEnabled !== state.requestsEnabled) {
                throw failure('Der Wunschbox-Status wurde inzwischen geändert. Bitte erneut prüfen.');
            }
            next.requestsEnabled = data.enabled;
        } else if (type === 'mw:setTopic') {
            if (data.previousTopic !== undefined && data.previousTopic !== state.topic) {
                throw failure('Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.');
            }
            next.topic = text(data.topic, 80, false);
        } else if (type === 'mw:onAir') {
            next.moderator = { userId: user.getUserId(), nick: user.getNick(), since: now(),
                sessionKey: String(now()) + '-' + String(state.revision + 1),
                expiresAt: now() + config.moderatorSessionHours * 3600000 };
        } else if (type === 'mw:offAir') {
            if (next.moderator && next.moderator.userId !== user.getUserId() && !user.isChannelOwner()) {
                throw failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
        } else if (type === 'mw:resolveRequest') {
            if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') { throw failure('Ungültige Wunsch-Aktion.'); }
            var found = next.requests.some(function (item) { return item.id === data.id; });
            if (!found) { throw failure('Dieser Wunsch wurde bereits bearbeitet.'); }
            next.requests = next.requests.filter(function (item) { return item.id !== data.id; });
        } else { throw failure('Unbekannte Aktion.'); }
        persist(next);
    }
    function openView(user, kind, automatic) {
        if (!online(user)) { user.sendPrivateMessage('Bitte öffne MischWerk im MyChannel.'); return; }
        if (kind === 'studio' && !isModerator(user)) { throw failure('Nur die Radio-Moderation darf das Moderationsmenü öffnen.'); }
        load();
        prune();
        if (kind === 'wishes' && !state.requestsEnabled) { throw failure('Die Wunschbox ist deaktiviert.'); }
        var data = snapshot(user, 0);
        data.view = kind;
        var htmlFile = new HTMLFile('index.html', data);
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, 264) : AppContent.popupContent(htmlFile, kind === 'wishes' ? 520 : 780, kind === 'wishes' ? 360 : 420);
        content.setResponsive(true);
        content.setAllowJFXBrowser(false);
        if (!user.canSendAppContent(content)) {
            if (automatic === true) { return false; }
            throw failure(kind === 'radio' ? 'Dieser Client unterstützt die MischWerk-Channelleiste nicht.' : 'Dieser Client kann das MischWerk-Fenster gerade nicht öffnen.');
        }
        content.addCloseListener(function () {
            views = views.filter(function (view) { return view.content !== content; });
        });
        views.slice().forEach(function (view) {
            if (view.userId === user.getUserId() && (view.kind === 'radio') === (kind === 'radio')) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        if (!user.sendAppContent(content)) { throw failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.'); }
        views.push({ content: content, kind: kind, userId: user.getUserId(), page: 0, myPage: 0, feedbackId: null });
        return true;
    }
    function open(user, automatic) {
        try { openView(user, 'radio', automatic); }
        catch (error) { if (automatic !== true) { user.sendPrivateMessage(error.publicMessage || 'MischWerk konnte gerade nicht geöffnet werden.'); } else { warn(); } }
    }
    return {
        onAppStart: function () {
            load();
            KnuddelsServer.getDefaultLogger().info('MischWerk 0.1.25: Radioleiste mit Wunschbox-/Moderations-Popups gestartet. ' +
                (station().configured ? 'RadioKing ist konfiguriert.' : 'RadioKing-Hörerstream ist noch nicht konfiguriert.'));
            KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
                try { open(user, true); } catch (error) { warn(); }
            });
        },
        onUserJoined: function (user) { try { open(user, true); } catch (error) { warn(); } },
        onPrepareShutdown: function () { shuttingDown = true; broadcast(); },
        onUserLeft: function (user) {
            var changed = false;
            try {
                load();
                if (state.moderator && state.moderator.userId === user.getUserId()) {
                    inactiveModeratorKey = moderatorKey(); changed = true;
                    var next = copy(state); next.moderator = null; persist(next);
                }
            } catch (error) { warn(); }
            views.slice().forEach(function (view) {
                if (view.userId === user.getUserId()) {
                    view.content.getSessions().forEach(function (session) { session.remove(); });
                }
            });
            views = views.filter(function (view) { return view.userId !== user.getUserId(); });
            if (changed) { broadcast(); }
        },
        onUserDeleted: function (userId) {
            load();
            var next = copy(state);
            next.requests = next.requests.filter(function (item) { return item.userId !== userId; });
            delete next.cooldowns['u' + userId];
            if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
            persist(next);
            broadcast();
        },
        chatCommands: { mischwerk: open, radio: open },
        onEventReceived: function (user, type, data, session) {
            if (!activeSession(user, session)) { return; }
            if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
            var requestId = null;
            try {
                load();
                if (prune()) { broadcast(); }
                data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
                if (data.requestId !== undefined) {
                    if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) { throw failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.'); }
                    requestId = data.requestId;
                }
                if (type === 'mw:ready' || type === 'mw:refresh') { refresh(session, user, data.page, data.myPage); return; }
                if (shuttingDown) { throw failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.'); }
                if (type === 'mw:openWishes' || type === 'mw:openStudio') {
                    openView(user, type === 'mw:openStudio' ? 'studio' : 'wishes');
                    result(session, true, 'Fenster geöffnet.', type, requestId);
                    return;
                }
                if (type === 'mw:ackRequest') {
                    if (acknowledgeRequest(user, data, session)) { broadcast(); }
                    return;
                }
                if (type === 'mw:request') {
                    var added = addRequest(user, data);
                    var request = added || state.requests.filter(function (item) {
                        return item.userId === user.getUserId() && item.requestId === requestId;
                    })[0];
                    if (request) {
                        views.forEach(function (view) {
                            if (view.userId === user.getUserId() && view.content === session.getAppContent()) { view.feedbackId = request.id; }
                        });
                    }
                    var message = request && request.delivery ? 'An ' + request.delivery.nick + ' übergeben.' :
                        request ? 'Dein Musikwunsch ist mit deinem Nicknamen gespeichert und wartet auf die Übergabe im Moderationsfenster.' :
                        'Dein Musikwunsch wurde bereits gespeichert und inzwischen bearbeitet.';
                    result(session, true, message, type, requestId, request);
                } else {
                    moderate(user, type, data);
                    result(session, true, type === 'mw:setTopic' ? (state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                        type === 'mw:setRequests' ? (state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                        type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                        type === 'mw:onAir' ? 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
                }
                broadcast();
            } catch (error) {
                if (!error.publicMessage) { warn(); }
                result(session, false, error.publicMessage || 'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.', type, requestId);
                try { if (state) { refresh(session, user); } } catch (ignored) { warn(); }
            }
        }
    };
}(MischWerkConfig));

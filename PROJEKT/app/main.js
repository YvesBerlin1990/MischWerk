/* MischWerk 0.1.26 - erzeugtes Knuddels UserApps Backend.
 * Quellen: src/backend/*.js. Nicht direkt bearbeiten.
 */

/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
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

var MischWerkModules = {};

/* Gemeinsamer Laufzeitkern und kleine, fachunabhängige Hilfsfunktionen. */
MischWerkModules.createRuntime = function (config) {
    'use strict';
    var runtime = {
        key: 'mischwerk.state.v1',
        pageSize: 1,
        state: null,
        views: [],
        shuttingDown: false,
        lastWarningAt: 0,
        inactiveModeratorKey: null
    };

    runtime.now = function () { return new Date().getTime(); };
    runtime.copy = function (value) { return JSON.parse(JSON.stringify(value)); };
    runtime.failure = function (message) {
        var error = new Error(message);
        error.publicMessage = message;
        return error;
    };
    runtime.warn = function () {
        if (runtime.lastWarningAt && runtime.now() - runtime.lastWarningAt < 60000) { return; }
        runtime.lastWarningAt = runtime.now();
        try { KnuddelsServer.getDefaultLogger().warn('MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.'); }
        catch (ignored) { /* Fehler beim Loggen darf den App-Zustand nicht ändern. */ }
    };
    runtime.jsonBytes = function (value) {
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
    };

    return runtime;
};

/* Persistenter Zustand, Rollenprüfung und ausschließlich freigegebene Snapshots. */
MischWerkModules.attachState = function (runtime, config) {
    'use strict';

    runtime.initialState = function () {
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, moderator: null, requests: [], cooldowns: {}, nextId: 1 };
    };
    runtime.persist = function (next) {
        next.revision = (runtime.state && runtime.state.revision || 0) + 1;
        if (runtime.jsonBytes(JSON.stringify(next)) > 90000) {
            throw runtime.failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.');
        }
        KnuddelsServer.getPersistence().setObject(runtime.key, next);
        runtime.state = next;
    };
    runtime.load = function () {
        if (runtime.state) { return; }
        var saved = KnuddelsServer.getPersistence().getObject(runtime.key, null);
        if (saved && (saved.version !== 1 || !Array.isArray(saved.requests) ||
                typeof saved.requestsEnabled !== 'boolean' || typeof saved.nextId !== 'number')) {
            throw new Error('Unbekanntes MischWerk-Datenformat. Persistenz vor Migration sichern.');
        }
        runtime.state = saved || runtime.initialState();
        runtime.state.topic = typeof runtime.state.topic === 'string' ? runtime.state.topic : '';
        runtime.state.cooldowns = runtime.state.cooldowns || {};
        runtime.state.revision = typeof runtime.state.revision === 'number' ? runtime.state.revision : 0;
        runtime.prune();
    };
    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };
    runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };
    runtime.isModerator = function (user) {
        return runtime.online(user) && (user.isChannelOwner() || user.isChannelModerator() ||
            config.radioModeratorUserIds.indexOf(user.getUserId()) !== -1);
    };
    runtime.moderatorIsActive = function () {
        if (!runtime.state.moderator || runtime.state.moderator.expiresAt <= runtime.now() ||
                runtime.moderatorKey() === runtime.inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return user.getUserId() === runtime.state.moderator.userId && runtime.isModerator(user);
        });
    };
    runtime.prune = function () {
        if (!runtime.state.moderator) { return false; }
        if (!runtime.moderatorIsActive()) {
            runtime.inactiveModeratorKey = runtime.moderatorKey();
            var next = runtime.copy(runtime.state);
            next.moderator = null;
            runtime.persist(next);
            return true;
        }
        return false;
    };
    runtime.station = function () {
        var settings = config.radioking || {};
        var id = typeof settings.radioId === 'string' ? settings.radioId.trim().toLowerCase() : '';
        if (id.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) { id = ''; }
        // URLs ausschließlich ableiten: kein Passwort, API-Schlüssel oder fremder Host im Event.
        var stream = id ? 'https://play.radioking.io/' + id : '';
        return { name: config.stationName, provider: 'radioking', radioId: id, configured: !!id,
            streamUrl: stream, stationUrl: stream,
            metadataUrl: id ? 'https://api.radioking.io/widget/radio/' + id + '/track/current' : '' };
    };
    runtime.requestText = function (item) {
        if (typeof item.text === 'string') { return item.text; }
        // Bereits gespeicherte Wünsche aus dem früheren Formular bleiben lesbar.
        return [item.artist, item.title].filter(function (part) { return !!part; }).join(' – ') +
            (item.message ? ' · ' + item.message : '');
    };
    runtime.requestView = function (item) {
        return { id: item.id, nick: item.nick, artist: item.artist, title: item.title,
            message: item.message, text: runtime.requestText(item), createdAt: item.createdAt,
            delivery: item.delivery ? { nick: item.delivery.nick, at: item.delivery.at } : null };
    };
    runtime.snapshot = function (user, page, myPage, feedbackId) {
        var mod = runtime.isModerator(user);
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var own = runtime.state.requests.filter(function (item) { return item.userId === user.getUserId(); });
        var totalPages = Math.max(1, Math.ceil(runtime.state.requests.length / runtime.pageSize));
        var ownPages = Math.max(1, Math.ceil(own.length / runtime.pageSize));
        myPage = Math.max(0, Math.min(ownPages - 1, Math.floor(Number(myPage) || 0)));
        var feedback = own.filter(function (item) { return item.id === feedbackId; })[0] || own[own.length - 1];
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: runtime.station(),
            topic: runtime.state.topic,
            revision: runtime.state.revision,
            user: { nick: user.getNick(), canModerate: mod,
                isOnAir: !!(mod && presenter && presenter.userId === user.getUserId()),
                canEndModeration: !!(mod && presenter && (presenter.userId === user.getUserId() || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: runtime.state.requestsEnabled && !runtime.shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, sessionKey: runtime.moderatorKey() } : null,
            myRequests: own.slice(myPage * runtime.pageSize, (myPage + 1) * runtime.pageSize).map(runtime.requestView),
            myTotal: own.length,
            myPage: myPage,
            myPages: ownPages,
            requestFeedback: feedback ? runtime.requestView(feedback) : null,
            queue: mod ? runtime.state.requests.slice(page * runtime.pageSize, (page + 1) * runtime.pageSize).map(runtime.requestView) : [],
            queueTotal: mod ? runtime.state.requests.length : 0,
            page: mod ? page : 0,
            pages: mod ? totalPages : 1,
            serverTime: runtime.now(),
            shuttingDown: runtime.shuttingDown
        };
    };
};

/* Validierung und atomare Fachaktionen für Wünsche, Thema und Moderation. */
MischWerkModules.attachActions = function (runtime, config) {
    'use strict';

    runtime.text = function (value, max, required) {
        if (typeof value !== 'string') { throw runtime.failure('Bitte gültigen Text eingeben.'); }
        var clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
        if ((required && !clean) || clean.length > max) {
            throw runtime.failure('Bitte die Eingabe prüfen (maximal ' + max + ' Zeichen).');
        }
        return clean;
    };
    runtime.containsWishLink = function (value) {
        var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
        try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
        if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/i.test(candidate)) { return true; }
        // Initialen in Namen wie will.i.am oder M.I.A. nicht mit einer Domain verwechseln.
        return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/i.test(candidate) ||
            /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/i.test(candidate);
    };
    runtime.addRequest = function (user, data) {
        var key = 'u' + user.getUserId();
        // Historischer Feldname: nur Wiederholungs-Erkennung, keine Wartezeit oder Begrenzung.
        var previous = runtime.state.cooldowns[key];
        if (data.requestId && ((previous && previous.requestId === data.requestId) ||
                runtime.state.requests.some(function (item) { return item.userId === user.getUserId() && item.requestId === data.requestId; }))) { return false; }
        if (runtime.shuttingDown || !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var timestamp = runtime.now();
        if (runtime.state.requests.length >= config.maxQueueLength) { throw runtime.failure('Die Wunschbox ist voll. Versuche es später erneut.'); }
        var wishText = data.text !== undefined ? runtime.text(data.text, 300, true) :
            runtime.text(data.artist, 80, true) + ' – ' + runtime.text(data.title, 80, true) +
                (data.message ? ' · ' + runtime.text(data.message, 200, false) : '');
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = {
            id: runtime.state.nextId,
            userId: user.getUserId(),
            nick: user.getNick(),
            text: wishText,
            delivery: null,
            requestId: data.requestId || null,
            createdAt: timestamp
        };
        var next = runtime.copy(runtime.state);
        next.nextId += 1;
        next.requests.push(item);
        next.cooldowns[key] = { at: timestamp, requestId: data.requestId || null };
        runtime.persist(next);
        return item;
    };
    runtime.acknowledgeRequest = function (user, data, session) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var view = runtime.views.filter(function (item) {
            return item.userId === user.getUserId() && item.content === session.getAppContent();
        })[0];
        if (!view || view.kind !== 'studio') { throw runtime.failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = runtime.state.requests[view.page * runtime.pageSize];
        if (!item || item.id !== data.id) { throw runtime.failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        if (item.delivery) { return false; }
        var next = runtime.copy(runtime.state);
        next.requests[view.page * runtime.pageSize].delivery = { userId: user.getUserId(), nick: user.getNick(), at: runtime.now() };
        runtime.persist(next);
        return true;
    };
    runtime.moderate = function (user, type, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        // Vergleich fachlicher Werte statt globaler Revision: Empfangsquittungen erzeugen keine falschen Konflikte.
        if ((type === 'mw:onAir' || type === 'mw:offAir') && data.expectedModerator !== undefined &&
                data.expectedModerator !== runtime.moderatorKey()) {
            throw runtime.failure('Die Moderation wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        if (type === 'mw:setRequests') {
            if (typeof data.enabled !== 'boolean') { throw runtime.failure('Ungültiger Wunschbox-Status.'); }
            if (data.previousEnabled !== undefined && data.previousEnabled !== runtime.state.requestsEnabled) {
                throw runtime.failure('Der Wunschbox-Status wurde inzwischen geändert. Bitte erneut prüfen.');
            }
            next.requestsEnabled = data.enabled;
        } else if (type === 'mw:setTopic') {
            if (data.previousTopic !== undefined && data.previousTopic !== runtime.state.topic) {
                throw runtime.failure('Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.');
            }
            next.topic = runtime.text(data.topic, 80, false);
        } else if (type === 'mw:onAir') {
            next.moderator = { userId: user.getUserId(), nick: user.getNick(), since: runtime.now(),
                sessionKey: String(runtime.now()) + '-' + String(runtime.state.revision + 1),
                expiresAt: runtime.now() + config.moderatorSessionHours * 3600000 };
        } else if (type === 'mw:offAir') {
            if (next.moderator && next.moderator.userId !== user.getUserId() && !user.isChannelOwner()) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
        } else if (type === 'mw:resolveRequest') {
            if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') {
                throw runtime.failure('Ungültige Wunsch-Aktion.');
            }
            var found = next.requests.some(function (item) { return item.id === data.id; });
            if (!found) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
            next.requests = next.requests.filter(function (item) { return item.id !== data.id; });
        } else { throw runtime.failure('Unbekannte Aktion.'); }
        runtime.persist(next);
    };
};

/* AppContent-Sitzungen, Push-Aktualisierung und getrennte Radio-/Popup-Ansichten. */
MischWerkModules.attachViews = function (runtime) {
    'use strict';

    runtime.send = function (session, type, data) {
        try { if (session) { session.sendEvent(type, data); } }
        catch (error) { runtime.warn(); }
    };
    runtime.refresh = function (session, user, page, myPage) {
        var view = runtime.views.filter(function (item) {
            return item.userId === user.getUserId() && item.content === session.getAppContent();
        })[0];
        // Bei Push/Bestätigung denselben Wunsch halten, auch wenn davor ein anderer entfernt wurde.
        if (page === undefined && view && view.queueId) {
            runtime.state.requests.some(function (item, index) {
                if (item.id !== view.queueId) { return false; }
                page = Math.floor(index / runtime.pageSize);
                return true;
            });
        }
        var next = runtime.snapshot(user, page === undefined && view ? view.page : page,
            myPage === undefined && view ? view.myPage : myPage, view ? view.feedbackId : null);
        if (view) {
            view.page = next.page;
            view.myPage = next.myPage;
            view.queueId = next.queue.length ? next.queue[0].id : null;
        }
        runtime.send(session, 'mw:state', next);
    };
    runtime.broadcast = function () {
        runtime.views.forEach(function (view) {
            try {
                view.content.getSessions().forEach(function (session) {
                    try {
                        var user = session.getUser();
                        if (runtime.online(user)) { runtime.refresh(session, user); }
                    } catch (error) { runtime.warn(); }
                });
            } catch (error) { runtime.warn(); }
        });
    };
    runtime.result = function (session, ok, message, action, requestId, request) {
        var response = { ok: ok, message: message, action: action, requestId: requestId };
        if (request) { response.request = runtime.requestView(request); }
        runtime.send(session, 'mw:result', response);
    };
    runtime.activeSession = function (user, session) {
        try {
            return !!session && runtime.online(user) && user.equals(session.getUser()) &&
                session.getAppContent().getSessions().some(function (active) { return user.equals(active.getUser()); });
        } catch (error) { return false; }
    };
    runtime.openView = function (user, kind, automatic) {
        if (!runtime.online(user)) { user.sendPrivateMessage('Bitte öffne MischWerk im MyChannel.'); return; }
        if (kind === 'studio' && !runtime.isModerator(user)) {
            throw runtime.failure('Nur die Radio-Moderation darf das Moderationsmenü öffnen.');
        }
        runtime.load();
        runtime.prune();
        if (kind === 'wishes' && !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var data = runtime.snapshot(user, 0);
        data.view = kind;
        var htmlFile = new HTMLFile('index.html', data);
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, 264) :
            AppContent.popupContent(htmlFile, kind === 'wishes' ? 520 : 780, kind === 'wishes' ? 360 : 420);
        content.setResponsive(true);
        content.setAllowJFXBrowser(false);
        if (!user.canSendAppContent(content)) {
            if (automatic === true) { return false; }
            throw runtime.failure(kind === 'radio' ? 'Dieser Client unterstützt die MischWerk-Channelleiste nicht.' :
                'Dieser Client kann das MischWerk-Fenster gerade nicht öffnen.');
        }
        content.addCloseListener(function () {
            runtime.views = runtime.views.filter(function (view) { return view.content !== content; });
        });
        runtime.views.slice().forEach(function (view) {
            if (view.userId === user.getUserId() && (view.kind === 'radio') === (kind === 'radio')) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        if (!user.sendAppContent(content)) {
            throw runtime.failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.');
        }
        runtime.views.push({ content: content, kind: kind, userId: user.getUserId(), page: 0, myPage: 0,
            feedbackId: null });
        return true;
    };
    runtime.open = function (user, automatic) {
        try { runtime.openView(user, 'radio', automatic); }
        catch (error) {
            if (automatic !== true) {
                user.sendPrivateMessage(error.publicMessage || 'MischWerk konnte gerade nicht geöffnet werden.');
            } else { runtime.warn(); }
        }
    };
};

/* Globaler Knuddels-App-Einstieg; setzt die fachlichen Module zu den Hooks zusammen. */
var App = (function (config) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachState(runtime, config);
    MischWerkModules.attachActions(runtime, config);
    MischWerkModules.attachViews(runtime);

    return {
        onAppStart: function () {
            runtime.load();
            KnuddelsServer.getDefaultLogger().info('MischWerk 0.1.26: Radioleiste mit Wunschbox-/Moderations-Popups gestartet. ' +
                (runtime.station().configured ? 'RadioKing ist konfiguriert.' : 'RadioKing-Hörerstream ist noch nicht konfiguriert.'));
            KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
                try { runtime.open(user, true); } catch (error) { runtime.warn(); }
            });
        },
        onUserJoined: function (user) {
            try { runtime.open(user, true); } catch (error) { runtime.warn(); }
        },
        onPrepareShutdown: function () {
            runtime.shuttingDown = true;
            runtime.broadcast();
        },
        onUserLeft: function (user) {
            var changed = false;
            try {
                runtime.load();
                if (runtime.state.moderator && runtime.state.moderator.userId === user.getUserId()) {
                    runtime.inactiveModeratorKey = runtime.moderatorKey();
                    changed = true;
                    var next = runtime.copy(runtime.state);
                    next.moderator = null;
                    runtime.persist(next);
                }
            } catch (error) { runtime.warn(); }
            runtime.views.slice().forEach(function (view) {
                if (view.userId === user.getUserId()) {
                    view.content.getSessions().forEach(function (session) { session.remove(); });
                }
            });
            runtime.views = runtime.views.filter(function (view) { return view.userId !== user.getUserId(); });
            if (changed) { runtime.broadcast(); }
        },
        onUserDeleted: function (userId) {
            runtime.load();
            var next = runtime.copy(runtime.state);
            next.requests = next.requests.filter(function (item) { return item.userId !== userId; });
            delete next.cooldowns['u' + userId];
            if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
            runtime.persist(next);
            runtime.broadcast();
        },
        chatCommands: { mischwerk: runtime.open, radio: runtime.open },
        onEventReceived: function (user, type, data, session) {
            if (!runtime.activeSession(user, session)) { return; }
            if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
            var requestId = null;
            try {
                runtime.load();
                if (runtime.prune()) { runtime.broadcast(); }
                data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
                if (data.requestId !== undefined) {
                    if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                        throw runtime.failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.');
                    }
                    requestId = data.requestId;
                }
                if (type === 'mw:ready' || type === 'mw:refresh') {
                    runtime.refresh(session, user, data.page, data.myPage);
                    return;
                }
                if (runtime.shuttingDown) {
                    throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.');
                }
                if (type === 'mw:openWishes' || type === 'mw:openStudio') {
                    runtime.openView(user, type === 'mw:openStudio' ? 'studio' : 'wishes');
                    runtime.result(session, true, 'Fenster geöffnet.', type, requestId);
                    return;
                }
                if (type === 'mw:ackRequest') {
                    if (runtime.acknowledgeRequest(user, data, session)) { runtime.broadcast(); }
                    return;
                }
                if (type === 'mw:request') {
                    var added = runtime.addRequest(user, data);
                    var request = added || runtime.state.requests.filter(function (item) {
                        return item.userId === user.getUserId() && item.requestId === requestId;
                    })[0];
                    if (request) {
                        runtime.views.forEach(function (view) {
                            if (view.userId === user.getUserId() && view.content === session.getAppContent()) {
                                view.feedbackId = request.id;
                            }
                        });
                    }
                    var message = request && request.delivery ? 'An ' + request.delivery.nick + ' übergeben.' :
                        request ? 'Dein Musikwunsch ist mit deinem Nicknamen gespeichert und wartet auf die Übergabe im Moderationsfenster.' :
                        'Dein Musikwunsch wurde bereits gespeichert und inzwischen bearbeitet.';
                    runtime.result(session, true, message, type, requestId, request);
                } else {
                    runtime.moderate(user, type, data);
                    runtime.result(session, true, type === 'mw:setTopic' ? (runtime.state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                        type === 'mw:setRequests' ? (runtime.state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                        type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                        type === 'mw:onAir' ? 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
                }
                runtime.broadcast();
            } catch (error) {
                if (!error.publicMessage) { runtime.warn(); }
                runtime.result(session, false, error.publicMessage ||
                    'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.', type, requestId);
                try { if (runtime.state) { runtime.refresh(session, user); } } catch (ignored) { runtime.warn(); }
            }
        }
    };
}(MischWerkConfig));

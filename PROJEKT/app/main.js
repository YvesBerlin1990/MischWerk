/* MischWerk 0.1.32 - erzeugtes Knuddels UserApps Backend.
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
    // Optionale anfängliche Radio-Moderatoren; weitere IDs verwaltet der Channelinhaber persistent.
    radioModeratorUserIds: [],
    moderatorSessionHours: 6
};

var MischWerkModules = {};

/* Gemeinsamer Laufzeitkern und kleine, fachunabhängige Hilfsfunktionen. */
MischWerkModules.createRuntime = function (config) {
    'use strict';
    var runtime = {
        key: 'mischwerk.state.v1',
        pageSize: 1,
        radioModeratorPageSize: 5,
        maxReplayEntries: 100,
        emergencyReplayEntries: 20,
        state: null,
        views: [],
        shuttingDown: false,
        warningTimes: {},
        inactiveModeratorKey: null
    };

    runtime.now = function () { return new Date().getTime(); };
    runtime.copy = function (value) { return JSON.parse(JSON.stringify(value)); };
    runtime.failure = function (message) {
        var error = new Error(message);
        error.publicMessage = message;
        return error;
    };
    runtime.numericUserId = function (value) {
        var userId = Number(value);
        if (!isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
            throw runtime.failure('Die Knuddels-Nutzer-ID konnte nicht verarbeitet werden. Bitte öffne MischWerk erneut.');
        }
        return userId;
    };
    runtime.userId = function (user) { return runtime.numericUserId(user.getUserId()); };
    runtime.nick = function (user) { return String(user.getNick()); };
    runtime.warn = function (operation) {
        var tag = typeof operation === 'string' && /^[A-Z_]{1,30}$/.test(operation) ? operation : 'GENERAL';
        if (runtime.warningTimes[tag] && runtime.now() - runtime.warningTimes[tag] < 60000) { return; }
        runtime.warningTimes[tag] = runtime.now();
        var context = tag === 'GENERAL' ? '' : ' [' + tag + ']';
        try { KnuddelsServer.getDefaultLogger().warn('MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden.' + context); }
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
        return { version: 1, revision: 0, topic: '', requestsEnabled: true, moderator: null, requests: [], cooldowns: {},
            nextId: 1, radioModeratorUserIds: config.radioModeratorUserIds.slice(0, 50), radioModeratorRevision: 0 };
    };
    runtime.compactCooldowns = function (state, maximum) {
        var source = state.cooldowns;
        if (!source || typeof source !== 'object' || Array.isArray(source)) { source = {}; }
        var entries = Object.keys(source).filter(function (key) {
            var entry = source[key];
            return /^u[1-9][0-9]*$/.test(key) && entry && typeof entry === 'object' && !Array.isArray(entry) &&
                typeof entry.at === 'number' && isFinite(entry.at) && entry.at >= 0 && entry.at <= runtime.now() + 300000 &&
                typeof entry.requestId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(entry.requestId);
        }).map(function (key) {
            return { key: key, at: source[key].at, requestId: source[key].requestId };
        }).sort(function (left, right) {
            return right.at - left.at || (left.key < right.key ? -1 : left.key === right.key ? 0 : 1);
        }).slice(0, maximum);
        state.cooldowns = {};
        entries.forEach(function (entry) {
            state.cooldowns[entry.key] = { at: entry.at, requestId: entry.requestId };
        });
    };
    runtime.persist = function (next, failureMessage) {
        try {
            next.revision = (runtime.state && runtime.state.revision || 0) + 1;
            runtime.compactCooldowns(next, runtime.maxReplayEntries);
            var serialized = JSON.stringify(next);
            if (runtime.jsonBytes(serialized) > 90000) {
                var smaller = runtime.copy(next);
                runtime.compactCooldowns(smaller, runtime.emergencyReplayEntries);
                if (runtime.jsonBytes(JSON.stringify(smaller)) > 90000) {
                    throw runtime.failure('Die Wunschbox ist gerade ausgelastet. Bitte versuche es später erneut.');
                }
                next = smaller;
            }
        } catch (prepareError) {
            if (prepareError.publicMessage) { throw prepareError; }
            runtime.warn('PERSIST_PREPARE');
            throw runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht vorbereiten. Bitte versuche es erneut.');
        }
        try {
            KnuddelsServer.getPersistence().setObject(runtime.key, next);
        } catch (error) {
            // Bei knapper AppPersistence bleiben Wünsche erhalten; nur alte technische Wiederholungsmarker werden reduziert.
            var emergency = runtime.copy(next);
            runtime.compactCooldowns(emergency, runtime.emergencyReplayEntries);
            try {
                KnuddelsServer.getPersistence().setObject(runtime.key, emergency);
                next = emergency;
            } catch (retryError) {
                runtime.warn('PERSIST_WRITE');
                throw runtime.failure(failureMessage || 'MischWerk konnte die Änderung nicht speichern. Bitte versuche es erneut.');
            }
        }
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
        runtime.compactCooldowns(runtime.state, runtime.maxReplayEntries);
        runtime.state.revision = typeof runtime.state.revision === 'number' ? runtime.state.revision : 0;
        var configuredIds = Array.isArray(runtime.state.radioModeratorUserIds) ? runtime.state.radioModeratorUserIds :
            config.radioModeratorUserIds;
        runtime.state.radioModeratorUserIds = configuredIds.filter(function (userId, index, values) {
            return typeof userId === 'number' && isFinite(userId) && userId > 0 && Math.floor(userId) === userId &&
                values.indexOf(userId) === index;
        }).slice(0, 50);
        runtime.state.radioModeratorRevision = typeof runtime.state.radioModeratorRevision === 'number' ?
            runtime.state.radioModeratorRevision : 0;
        runtime.prune();
    };
    runtime.moderatorKey = function () {
        return runtime.state.moderator ? runtime.state.moderator.sessionKey || String(runtime.state.moderator.since) : null;
    };
    runtime.online = function (user) { return !!user && user.isOnlineInChannel(); };
    runtime.isChannelOwner = function (user) { return runtime.online(user) && user.isChannelOwner(); };
    runtime.isModerator = function (user) {
        return runtime.online(user) && (user.isChannelOwner() ||
            runtime.state.radioModeratorUserIds.indexOf(runtime.userId(user)) !== -1);
    };
    runtime.moderatorIsActive = function () {
        if (!runtime.state.moderator || runtime.state.moderator.expiresAt <= runtime.now() ||
                runtime.moderatorKey() === runtime.inactiveModeratorKey) { return false; }
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).some(function (user) {
            return runtime.userId(user) === runtime.state.moderator.userId && runtime.isModerator(user);
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
    runtime.radioModeratorViews = function (user, page) {
        if (!runtime.isChannelOwner(user)) { return { items: [], total: 0, page: 0, pages: 1 }; }
        var access = KnuddelsServer.getUserAccess();
        var total = runtime.state.radioModeratorUserIds.length;
        var pages = Math.max(1, Math.ceil(total / runtime.radioModeratorPageSize));
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        var ids = runtime.state.radioModeratorUserIds.slice(page * runtime.radioModeratorPageSize,
            (page + 1) * runtime.radioModeratorPageSize);
        return { items: ids.map(function (userId) {
            var nick;
            try { nick = String(access.getNick(userId)); }
            catch (error) { nick = 'Unbekannter Nutzer #' + userId; }
            return { userId: userId, nick: nick };
        }), total: total, page: page, pages: pages };
    };
    runtime.snapshot = function (user, page, myPage, feedbackId, radioModeratorPage) {
        var mod = runtime.isModerator(user);
        var presenter = runtime.moderatorIsActive() ? runtime.state.moderator : null;
        var radioTeam = runtime.radioModeratorViews(user, radioModeratorPage);
        var currentUserId = runtime.userId(user);
        var requests = runtime.wishItems();
        var totalPages = Math.max(1, Math.ceil(requests.length / runtime.pageSize));
        page = Math.max(0, Math.min(totalPages - 1, Math.floor(Number(page) || 0)));
        return {
            station: runtime.station(),
            topic: runtime.state.topic,
            revision: runtime.state.revision,
            user: { nick: runtime.nick(user), canModerate: mod,
                canManageRadioModerators: runtime.isChannelOwner(user),
                isOnAir: !!(mod && presenter && presenter.userId === currentUserId),
                canEndModeration: !!(mod && presenter && (presenter.userId === currentUserId || user.isChannelOwner())) },
            limits: { maxTextLength: 300, maxTopicLength: 80 },
            requestsEnabled: runtime.state.requestsEnabled && !runtime.shuttingDown,
            moderator: presenter ? { nick: presenter.nick, since: presenter.since,
                expiresAt: presenter.expiresAt, sessionKey: runtime.moderatorKey() } : null,
            myRequests: [],
            myTotal: 0,
            myPage: 0,
            myPages: 1,
            requestFeedback: null,
            queue: mod ? requests.slice(page * runtime.pageSize, (page + 1) * runtime.pageSize).map(runtime.requestView) : [],
            queueTotal: mod ? requests.length : 0,
            radioModerators: radioTeam.items,
            radioModeratorTotal: radioTeam.total,
            radioModeratorPage: radioTeam.page,
            radioModeratorPages: radioTeam.pages,
            radioModeratorRevision: runtime.state.radioModeratorRevision,
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
    runtime.manageRadioModerator = function (user, type, data) {
        if (!runtime.isChannelOwner(user)) {
            throw runtime.failure('Nur der Channelinhaber darf Radiomoderatoren verwalten.');
        }
        if (data.expectedRadioModeratorRevision !== undefined &&
                data.expectedRadioModeratorRevision !== runtime.state.radioModeratorRevision) {
            throw runtime.failure('Das Radio-Team wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        var userId;
        var nick;
        if (type === 'mw:addRadioModerator') {
            nick = runtime.text(data.nick, 50, true);
            var access = KnuddelsServer.getUserAccess();
            if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
            try { userId = runtime.numericUserId(access.getUserId(nick)); }
            catch (error) { throw runtime.failure('Dieser Knuddels-Nick konnte nicht aufgelöst werden.'); }
            if (userId === runtime.userId(user)) {
                throw runtime.failure('Der Channelinhaber ist bereits dauerhaft für das Studio berechtigt.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
                throw runtime.failure('Dieser Nutzer ist bereits Radiomoderator.');
            }
            if (next.radioModeratorUserIds.length >= 50) {
                throw runtime.failure('Es können höchstens 50 Radiomoderatoren ernannt werden.');
            }
            next.radioModeratorUserIds.push(userId);
            nick = String(access.getNick(userId));
        } else if (type === 'mw:removeRadioModerator') {
            userId = data.userId;
            if (typeof userId !== 'number' || !isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
                throw runtime.failure('Ungültiger Radiomoderator.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) === -1) {
                throw runtime.failure('Dieser Nutzer ist kein Radiomoderator mehr.');
            }
            next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
            if (next.moderator && next.moderator.userId === userId) {
                runtime.inactiveModeratorKey = runtime.moderatorKey();
                next.moderator = null;
            }
        } else { throw runtime.failure('Unbekannte Radio-Team-Aktion.'); }
        next.radioModeratorRevision = runtime.state.radioModeratorRevision + 1;
        runtime.persist(next);
        return nick;
    };
    runtime.acknowledgeRequest = function (user, data, session) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var view = runtime.views.filter(function (item) {
            return item.content === session.getAppContent();
        })[0];
        if (!view || view.kind !== 'studio') { throw runtime.failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = runtime.wishItems()[view.page * runtime.pageSize];
        if (!item || item.id !== data.id) { throw runtime.failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        return runtime.deliverWish(item.id, user);
    };
    runtime.moderate = function (user, type, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        if (type === 'mw:resolveRequest') {
            if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') {
                throw runtime.failure('Ungültige Wunsch-Aktion.');
            }
            runtime.resolveWish(data.id);
            return;
        }
        var userId = runtime.userId(user);
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
            next.moderator = { userId: userId, nick: runtime.nick(user), since: runtime.now(),
                sessionKey: String(runtime.now()) + '-' + String(runtime.state.revision + 1),
                expiresAt: runtime.now() + config.moderatorSessionHours * 3600000 };
        } else if (type === 'mw:offAir') {
            if (next.moderator && next.moderator.userId !== userId && !user.isChannelOwner()) {
                throw runtime.failure('Nur die aktive Moderation oder der Channel-Besitzer kann die Sendung beenden.');
            }
            next.moderator = null;
        } else { throw runtime.failure('Unbekannte Aktion.'); }
        runtime.persist(next);
    };
};

/* Schlanker Wunschweg: laufende Queue, Moderationsansicht und direkte Absenderquittung. */
MischWerkModules.attachWishTransport = function (runtime) {
    'use strict';

    var receiptLimit = 100;
    runtime.wishQueue = { nextId: 1, items: [], receipts: [] };

    function validSubmissionId(value) {
        return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    }
    function sameUser(left, right) {
        try { return !!left && !!right && left.equals(right); }
        catch (error) { return false; }
    }
    function receiptFor(user, submissionId) {
        return runtime.wishQueue.receipts.filter(function (receipt) {
            return receipt.submissionId === submissionId && sameUser(receipt.user, user);
        })[0] || null;
    }

    // Die Wunschliste ist absichtlich nur Laufzeitzustand. Sie wird weder in den allgemeinen
    // App-Zustand noch in einen eigenen AppPersistence-Schlüssel geschrieben.
    runtime.loadWishes = function () { return runtime.wishQueue; };
    runtime.wishItems = function () { return runtime.wishQueue.items; };
    runtime.submitWish = function (user, data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !validSubmissionId(data.submissionId)) {
            throw runtime.failure('Die Wunschübertragung ist ungültig. Bitte öffne MischWerk erneut.');
        }
        var queued = runtime.wishQueue.items.filter(function (item) {
            return item.submissionId === data.submissionId && sameUser(item.user, user);
        })[0];
        if (queued) { return { duplicate: true, item: queued }; }
        var receipt = receiptFor(user, data.submissionId);
        if (receipt) {
            return { duplicate: true, item: runtime.wishQueue.items.filter(function (item) {
                return item.id === receipt.wishId;
            })[0] || null };
        }
        if (runtime.shuttingDown || !runtime.state.requestsEnabled) {
            throw runtime.failure('Die Wunschbox ist deaktiviert.');
        }
        var wishText = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = { id: runtime.wishQueue.nextId, user: user, nick: runtime.nick(user), text: wishText,
            submissionId: data.submissionId, createdAt: runtime.now(), delivery: null };
        runtime.wishQueue.nextId += 1;
        runtime.wishQueue.items.push(item);
        runtime.wishQueue.receipts.push({ user: user, submissionId: data.submissionId, wishId: item.id });
        runtime.wishQueue.receipts = runtime.wishQueue.receipts.slice(-receiptLimit);
        return { duplicate: false, item: item };
    };
    runtime.deliverWish = function (id, moderator) {
        var item = runtime.wishQueue.items.filter(function (candidate) { return candidate.id === id; })[0];
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (item.delivery) { return false; }
        item.delivery = { nick: runtime.nick(moderator), at: runtime.now() };
        return true;
    };
    runtime.resolveWish = function (id) {
        if (!runtime.wishQueue.items.some(function (item) { return item.id === id; })) {
            throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.');
        }
        runtime.wishQueue.items = runtime.wishQueue.items.filter(function (item) { return item.id !== id; });
    };
    runtime.removeWishesForUser = function (userId) {
        var expected = String(userId);
        function belongsToDeletedUser(entry) {
            try { return entry.user && String(entry.user.getUserId()) === expected; }
            catch (error) { return false; }
        }
        runtime.wishQueue.items = runtime.wishQueue.items.filter(function (item) {
            return !belongsToDeletedUser(item);
        });
        runtime.wishQueue.receipts = runtime.wishQueue.receipts.filter(function (receipt) {
            return !belongsToDeletedUser(receipt);
        });
    };
    runtime.sendWishReceipt = function (session, accepted, message, submissionId) {
        var receipt = { accepted: accepted, message: message, submissionId: submissionId };
        runtime.send(session, 'mw:wish.receipt', receipt);
    };
    runtime.handleWishSubmission = function (user, data, session) {
        var submissionId = data && typeof data.submissionId === 'string' ? data.submissionId : null;
        try {
            runtime.load();
            var outcome = runtime.submitWish(user, data);
            runtime.sendWishReceipt(session, true, outcome.item ?
                'Dein Musikwunsch wurde an die Moderation gesendet.' :
                'Dein Musikwunsch wurde bereits an die Moderation gesendet.', data.submissionId);
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('WISH_QUEUE'); }
            runtime.sendWishReceipt(session, false, error.publicMessage ||
                'Die Wunschübertragung konnte nicht abgeschlossen werden. Bitte versuche es erneut.', submissionId);
        }
    };
};

/* AppContent-Sitzungen, Push-Aktualisierung und getrennte Radio-/Popup-Ansichten. */
MischWerkModules.attachViews = function (runtime) {
    'use strict';

    runtime.send = function (session, type, data) {
        try { if (session) { session.sendEvent(type, data); } }
        catch (error) { runtime.warn(); }
    };
    runtime.refresh = function (session, user, page, myPage, radioModeratorPage) {
        var userId = runtime.userId(user);
        var view = runtime.views.filter(function (item) {
            return item.userId === userId && item.content === session.getAppContent();
        })[0];
        // Bei Push/Bestätigung denselben Wunsch halten, auch wenn davor ein anderer entfernt wurde.
        if (page === undefined && view && view.queueId) {
            runtime.wishItems().some(function (item, index) {
                if (item.id !== view.queueId) { return false; }
                page = Math.floor(index / runtime.pageSize);
                return true;
            });
        }
        var next = runtime.snapshot(user, page === undefined && view ? view.page : page,
            myPage === undefined && view ? view.myPage : myPage, view ? view.feedbackId : null,
            radioModeratorPage === undefined && view ? view.radioModeratorPage : radioModeratorPage);
        if (view) {
            view.page = next.page;
            view.myPage = next.myPage;
            view.radioModeratorPage = next.radioModeratorPage;
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
        runtime.load();
        runtime.loadWishes();
        if (kind === 'studio' && !runtime.isModerator(user)) {
            throw runtime.failure('Nur die Radio-Moderation darf das Moderationsmenü öffnen.');
        }
        if (kind === 'team' && !runtime.isChannelOwner(user)) {
            throw runtime.failure('Nur der Channelinhaber darf das Radio-Team verwalten.');
        }
        runtime.prune();
        if (kind === 'wishes' && !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var data = runtime.snapshot(user, 0);
        data.view = kind;
        var htmlFile = new HTMLFile('index.html', data);
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, 264) :
            AppContent.popupContent(htmlFile, kind === 'wishes' ? 520 : kind === 'team' ? 560 : 780,
                kind === 'wishes' ? 360 : kind === 'team' ? 420 : 420);
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
        var userId = runtime.userId(user);
        runtime.views.slice().forEach(function (view) {
            if (view.userId === userId && (view.kind === 'radio') === (kind === 'radio')) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        if (!user.sendAppContent(content)) {
            throw runtime.failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.');
        }
        runtime.views.push({ content: content, kind: kind, userId: userId, page: 0, myPage: 0,
            radioModeratorPage: 0, feedbackId: null });
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
    MischWerkModules.attachWishTransport(runtime);
    MischWerkModules.attachViews(runtime);

    return {
        onAppStart: function () {
            runtime.load();
            runtime.loadWishes();
            KnuddelsServer.getDefaultLogger().info('MischWerk 0.1.32: Radioleiste mit Wunschbox-, Radio-Team- und Moderations-Popups gestartet. ' +
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
                var userId = runtime.userId(user);
                if (runtime.state.moderator && runtime.state.moderator.userId === userId) {
                    runtime.inactiveModeratorKey = runtime.moderatorKey();
                    changed = true;
                    var next = runtime.copy(runtime.state);
                    next.moderator = null;
                    runtime.persist(next);
                }
            } catch (error) { runtime.warn(); }
            runtime.views.slice().forEach(function (view) {
                if (view.userId === userId) {
                    view.content.getSessions().forEach(function (session) { session.remove(); });
                }
            });
            runtime.views = runtime.views.filter(function (view) { return view.userId !== userId; });
            if (changed) { runtime.broadcast(); }
        },
        onUserDeleted: function (userId) {
            runtime.load();
            runtime.loadWishes();
            runtime.removeWishesForUser(userId);
            userId = runtime.numericUserId(userId);
            var next = runtime.copy(runtime.state);
            if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
            if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
                next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
                next.radioModeratorRevision += 1;
            }
            runtime.persist(next);
            runtime.broadcast();
        },
        chatCommands: { mischwerk: runtime.open, radio: runtime.open },
        onEventReceived: function (user, type, data, session) {
            if (!runtime.activeSession(user, session)) { return; }
            if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
            if (type === 'mw:wish.submit') {
                runtime.handleWishSubmission(user, data, session);
                return;
            }
            var requestId = null;
            var operation = 'EVENT_PREPARE';
            try {
                operation = 'STATE_LOAD';
                runtime.load();
                runtime.loadWishes();
                operation = 'STATE_PRUNE';
                if (runtime.prune()) { runtime.broadcast(); }
                operation = 'EVENT_VALIDATE';
                data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
                if (data.requestId !== undefined) {
                    if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                        throw runtime.failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.');
                    }
                    requestId = data.requestId;
                }
                if (type === 'mw:ready' || type === 'mw:refresh') {
                    operation = 'STATE_REFRESH';
                    runtime.refresh(session, user, data.page, data.myPage, data.radioModeratorPage);
                    return;
                }
                if (runtime.shuttingDown) {
                    throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.');
                }
                if (type === 'mw:openWishes' || type === 'mw:openStudio' || type === 'mw:openRadioTeam') {
                    operation = 'OPEN_VIEW';
                    runtime.openView(user, type === 'mw:openStudio' ? 'studio' :
                        type === 'mw:openRadioTeam' ? 'team' : 'wishes');
                    runtime.result(session, true, 'Fenster geöffnet.', type, requestId);
                    return;
                }
                if (type === 'mw:ackRequest') {
                    operation = 'REQUEST_ACK';
                    if (runtime.acknowledgeRequest(user, data, session)) { runtime.broadcast(); }
                    return;
                }
                if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') {
                    operation = 'RADIO_TEAM';
                    var changedNick = runtime.manageRadioModerator(user, type, data);
                    runtime.result(session, true, type === 'mw:addRadioModerator' ?
                        changedNick + ' ist jetzt Radiomoderator.' : 'Radiomoderator entfernt.', type, requestId);
                } else {
                    operation = 'MODERATION_ACTION';
                    runtime.moderate(user, type, data);
                    runtime.result(session, true, type === 'mw:setTopic' ? (runtime.state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                        type === 'mw:setRequests' ? (runtime.state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                        type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                        type === 'mw:onAir' ? 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
                }
                operation = 'STATE_BROADCAST';
                runtime.broadcast();
            } catch (error) {
                if (!error.publicMessage) { runtime.warn(operation); }
                runtime.result(session, false, error.publicMessage ||
                    'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.', type, requestId);
                try { if (runtime.state) { runtime.refresh(session, user); } } catch (ignored) { runtime.warn(); }
            }
        }
    };
}(MischWerkConfig));

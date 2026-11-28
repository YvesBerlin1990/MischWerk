/* Gemeinsames Knuddels-Plattformmodell für die Rhino-Suiten: Persistenz, Nutzer, Sitzungen, virtuelle Uhr und Timer. Kein Bestandteil des Uploads. */
var assertions = 0;
var mischWerkAppRoot = typeof mischWerkAppRoot === 'string' ? mischWerkAppRoot : 'app';
function check(condition, message) {
    assertions += 1;
    if (!condition) { throw new Error(message); }
}
function copy(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
var warnings = [], people = [], eventOrder = [], updates = [], publicMessages = [];
var persistenceWrites = 0, cacheInvalidations = 0;
var availableUpdateFiles = [];
String.prototype.escapeKCode = function () { return String(this).replace(/[_°<>\\]/g, '\\$&'); };
function createStore(initial) {
    return { data: copy(initial || {}),
        getObject: function (key, fallback) { return Object.prototype.hasOwnProperty.call(this.data, key) ? copy(this.data[key]) : fallback; },
        getObjectKeys: function () { return Object.keys(this.data); },
        deleteObject: function (key) { delete this.data[key]; },
        setObject: function (key, value) { persistenceWrites += 1; this.data[key] = copy(value); }
    };
}
var store = createStore();
// Virtuelle Uhr: setTimeout/clearTimeout und runtime.now der App laufen gemeinsam über testClock.
var testClock = 1800000000000, timers = [], timerSequence = 0;
function setTimeout(callback, delay) {
    var entry = { id: ++timerSequence, callback: callback, at: testClock + Math.max(0, Number(delay) || 0) };
    timers.push(entry); return entry.id;
}
function clearTimeout(id) { timers = timers.filter(function (entry) { return entry.id !== id; }); }
function advance(ms) {
    var target = testClock + ms;
    for (var guard = 0; guard < 100000; guard += 1) {
        var due = timers.filter(function (entry) { return entry.at <= target; })
            .sort(function (a, b) { return a.at - b.at || a.id - b.id; })[0];
        if (!due) { testClock = target; return; }
        clearTimeout(due.id); testClock = Math.max(testClock, due.at); due.callback();
    }
    throw new Error('Timerschleife ohne Ende');
}
var KnuddelsServer = {
    execute: function (file) { load(mischWerkAppRoot + '/' + file); },
    listFiles: function (folder) {
        var directory = new java.io.File(mischWerkAppRoot + '/' + (String(folder) === '/' ? '.' : String(folder)));
        var entries = directory.listFiles();
        if (entries === null) { throw new Error('Missing test directory'); }
        var result = [];
        for (var index = 0; index < entries.length; index += 1) {
            result.push(new java.lang.String(String(entries[index].getName()) + (entries[index].isDirectory() ? '/' : '')));
        }
        return result;
    },
    getPersistence: function () { return store; },
    getFullImagePath: function (name) { return new java.lang.String('https://mischwerk.invalid/' + name); },
    getDefaultBotUser: function () { return { sendPublicMessage: function (message) { publicMessages.push(String(message)); } }; },
    getDefaultLogger: function () {
        return { info: function () {}, warn: function (message) { warnings.push(String(message)); } };
    },
    getChannel: function () { return { getOnlineUsers: function () { return people; } }; },
    getUserAccess: function () { return {
        exists: function (nick) { return nick === 'Otterchen'; },
        getUserId: function (nick) { if (nick !== 'Otterchen') { throw new Error('Unbekannter Testnutzer'); } return 2; },
        getNick: function (id) { return 'Nutzer ' + id; }
    }; },
    getExternalServerAccess: function () { return { canAccessURL: function () { return false; } }; },
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
// Deterministische, aber je Aufruf verschiedene Zufallsfolge als nativer Java-String.
var randomSequence = 0;
var RandomOperations = { getRandomString: function (length, alphabet) {
    randomSequence += 1; var value = '';
    for (var index = 0; index < length; index += 1) { value += alphabet.charAt((index * 7 + randomSequence * 13) % alphabet.length); }
    return new java.lang.String(value);
} };
function HTMLFile(asset, data) { this.data = copy(data); }
var Color = { fromHexString: function (hex) { return { asHexString: function () { return hex; } }; } };
function content(html, mode) {
    var loading = { enabled: true };
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
// Authentifizierter Testnutzer; owner=true bedeutet echtes Channelinhaberrecht, ID 3 ist Appmanager.
function person(id, nick, owner) {
    var userStore = {};
    var user = { sessions: [], nicklistIcons: {}, privateMessages: [],
        getUserId: function () { return id; }, getNick: function () { return nick; },
        getPersistence: function () { return {
            getObject: function (key, fallback) { return Object.prototype.hasOwnProperty.call(userStore, key) ? copy(userStore[key]) : fallback; },
            setObject: function (key, value) { userStore[key] = copy(value); }
        }; },
        addNicklistIcon: function (path, width) {
            check(width === (String(path).split('?')[0].slice(-9) === '/team.png' ? 32 : 24), 'Nicklistenbreite passend zum Originalbild');
            user.nicklistIcons[String(path)] = width;
        },
        removeNicklistIcon: function (path) { delete user.nicklistIcons[String(path)]; },
        getUserType: function () { return UserType.Human; },
        hasProfilePhoto: function () { return false; },
        getProfilePhoto: function () { return ''; },
        getProfileLink: function (displayText) { return '°>' + displayText + '|/w ' + nick.escapeKCode() + '<°'; },
        isChannelModerator: function () { return false; },
        isOnlineInChannel: function () { return true; }, isChannelOwner: function () { return !!owner; },
        isAppManager: function () { return !!owner || id === 3; },
        equals: function (other) { return !!other && other.getUserId() === id; },
        canSendAppContent: function () { return true; },
        sendPrivateMessage: function (message) { user.privateMessages.push(String(message)); },
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
                nativeClose: function (replacing) {
                    view.sessions = view.sessions.filter(function (item) { return item !== session; });
                    user.sessions = user.sessions.filter(function (item) { return item !== session; });
                    view.closeListeners.forEach(function (callback) { callback(user, view, replacing); });
                }
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
function viewSession(user, view) {
    return user.sessions.filter(function (session) { return session.getAppContent().html.data.view === view; })[0] || null;
}
function radioSession(user) {
    return user.sessions.filter(function (session) { return session.getAppContent().mode === 'Headerbar'; })[0] || null;
}
function javaResponse(url, code) {
    return { getResponseCode: function () { return new java.lang.Integer(code || 200); },
        getURLString: function () { return new java.lang.String(url); } };
}
// Gültige zentrale V2-Antwort mit bestätigter Live-Sendung von DJ-Test; extra ersetzt einzelne Felder.
var centralKey = 'mischwerk.android.private.v1', centralUrl = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
function centralSettings() {
    var value = {};
    value[centralKey] = { enabled:true, runtimeVerified:true, syncSecret:'synthetic_' + new Array(46).join('x'), syncUrl:centralUrl, revision:0 };
    return value;
}
function centralResponse(extra) {
    var result = { contractVersion:2, accepted:true, serverTime:testClock,
        station:{ contractVersion:2, authority:'studio', protocolEpoch:'rhino-public', revision:1, broadcastState:'live', onAir:true, wishboxOpen:true,
            moderatorNick:'DJ-Test', topic:'Äther 🎶', updatedAt:testClock, validUntil:testClock + 45000 },
        wishReceipts:[], ownWishStatuses:[], deletionReceipts:[], broadcastEvents:[], eventCursor:'initial',
        nickAccessPage:{ snapshotId:'s' + testClock, revision:new Array(65).join('a'), snapshotAt:testClock, validUntil:testClock + 45000,
            items:[{ nick:'DJ-Test' }], nextCursor:null, complete:true } };
    Object.keys(extra || {}).forEach(function (key) { result[key] = extra[key]; });
    return result;
}
function centralFinish(call, extra) {
    call.parameters.onSuccess(new java.lang.String(JSON.stringify(centralResponse(extra))), javaResponse(call.url, 200));
}
load(mischWerkAppRoot + '/main.js');
// Jede erzeugte Laufzeit nutzt die virtuelle Uhr; die zuletzt erzeugte bleibt für Fachprüfungen erreichbar.
var lastRuntime = null;
(function () {
    var create = MischWerkModules.createRuntime;
    MischWerkModules.createRuntime = function (config) {
        var runtime = create(config);
        runtime.now = function () { return testClock; };
        lastRuntime = runtime; return runtime;
    };
}());
// Setzt Plattformzustand für die nächste Suite zurück; globale Ersetzungen stellt jede Suite selbst wieder her.
function resetPlatform(initial) {
    store = createStore(initial); timers = []; people = []; publicMessages = []; warnings = []; eventOrder = [];
    updates = []; availableUpdateFiles = []; cacheInvalidations = 0; persistenceWrites = 0;
}
// Vollständige App aus dem gewählten Appstand mit frischem Speicher; liefert App und Laufzeit.
function startApp(initial) {
    resetPlatform(initial);
    var app = MischWerkModules.createApp(MischWerkConfig), runtime = lastRuntime;
    app.onAppStart();
    return { app: app, runtime: runtime, stop: function () { app.onPrepareShutdown(); app.onShutdown(); } };
}

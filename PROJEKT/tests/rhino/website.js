/* Reale ES5/Rhino-Ausführung des dokumentierten WebHook-Callbacks; ausschließlich lokale Daten. */
(function () {
    var previousPersistence = KnuddelsServer.getPersistence, previousHooks = KnuddelsServer.getWebHookAccess;
    var data = { 'mischwerk.website.enabled.v1':true }, observer = null, messages = [];
    KnuddelsServer.getPersistence = function () { return {
        getObjectKeys: function () { return Object.keys(data); },
        deleteObject: function (key) { delete data[key]; },
        getObject:function (key, fallback) { return Object.prototype.hasOwnProperty.call(data, key) ? copy(data[key]) : fallback; },
        setObject:function (key, value) { data[key] = copy(value); }
    }; };
    KnuddelsServer.getWebHookAccess = function () { return {
        registerWebHook:function (key, callback) { check(key === 'website', 'Dokumentierter Hookkey'); observer = callback; return 'https://example.invalid/website'; },
        unregisterWebHook:function () { observer = null; }
    }; };
    function call(body) {
        var result;
        observer({ getMethod:function () { return 'POST'; }, getBody:function () { return JSON.stringify(body); }, getRemoteAddress:function () { return 'local'; } },
            { send:function (status, headers, text) { check(text.length < 9500, 'Websitepaket bleibt klein'); result = {status:status, data:JSON.parse(text)}; } });
        return result;
    }
    try {
        var user = person(100, 'WebsiteOwner', true); user.sendPrivateMessage = function (text) { messages.push(text); };
        var app = MischWerkModules.createApp(MischWerkConfig); app.onAppStart();
        check(typeof observer === 'function', 'WebHook in beiden Rhino-Engines registriert');
        var token = new Array(65).join('a'), code = new Array(33).join('b');
        check(call({operation:'login.begin', token:token, code:code}).status === 200, 'Websitekopplung beginnt');
        check(call({operation:'login.status', token:token}).data.pending === true, 'Kopplung ohne Chat bleibt unbestätigt');
        app.chatCommands['mischwerk-web'](user, code);
        check(call({operation:'login.status', token:token}).data.pending === false, 'Echte Chatidentität bestätigt');
        var action = {operation:'action', token:token, type:'mw:onAir', data:{expectedModerator:null}, requestId:'rhino-web-onair-123'};
        check(call(action).status === 200, 'Website meldet Studio an');
        var state = call({operation:'state', token:token, view:'studio'}).data.state;
        check(state.user.isOnAir && state.moderator.nick === 'WebsiteOwner', 'Website und App teilen tatsächlichen Zustand');
        var before = publicMessages.length;
        check(call(action).status === 200 && publicMessages.length === before, 'Wiederholung ohne doppelte öffentliche Meldung');
        check(call({operation:'action', token:token, type:'mw:onAir', data:{expectedModerator:state.moderator.sessionKey, endMode:'openEnd'}, requestId:'rhino-web-openend-123'}).status === 200, 'Alte Zeitdaten verändern Anmeldung nicht');
        state = call({operation:'state', token:token}).data.state;
        check(!('openEnd' in state.moderator) && !('expiresAt' in state.moderator), 'Anmeldung ohne Zeitfelder');
        app.onUserLeft(user);
        check(call({operation:'state', token:token}).status === 401, 'Verlassen sperrt Websitezugang auch in Rhino');
    } finally { KnuddelsServer.getPersistence = previousPersistence; KnuddelsServer.getWebHookAccess = previousHooks; }
}());

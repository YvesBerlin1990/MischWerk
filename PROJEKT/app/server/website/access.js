/* Kurzlebige Websitekopplung; Identität ausschließlich durch authentifizierten Chatbefehl. */
MischWerkModules.attachWebsiteAccess = function (runtime) {
    'use strict';
    var sessions = {};
    function valid(value, length) { return typeof value === 'string' && value.length === length && /^[a-f0-9]+$/.test(value); }
    function clean() {
        var now = runtime.now();
        Object.keys(sessions).forEach(function (key) {
            var item = sessions[key];
            if (now >= item.expires || now - item.touched >= 1800000) { delete sessions[key]; }
        });
    }
    runtime.beginWebsiteLogin = function (data) {
        clean();
        if (!valid(data.token, 64) || !valid(data.code, 32) || sessions['$' + data.token] ||
                Object.keys(sessions).length >= 100 || Object.keys(sessions).some(function (key) { return sessions[key].code === data.code; })) {
            throw runtime.failure('Anmeldung konnte nicht begonnen werden. Bitte erneut versuchen.');
        }
        sessions['$' + data.token] = { token:data.token, code:data.code, userId:null, expires:runtime.now() + 180000,
            touched:runtime.now(), results:[], queueId:null, page:0 };
        return { pending:true, expiresAt:runtime.now() + 180000 };
    };
    runtime.confirmWebsiteLogin = function (user, code) {
        clean();
        if (!runtime.isModerator(user) || !valid(code, 32)) { throw runtime.failure('Diese Websiteanmeldung ist nicht verfügbar.'); }
        var item = Object.keys(sessions).map(function (key) { return sessions[key]; }).filter(function (entry) { return entry.code === code; })[0];
        if (!item || item.userId !== null) { throw runtime.failure('Der Anmeldecode ist abgelaufen oder bereits verwendet.'); }
        item.userId = runtime.userId(user); item.owner = runtime.isChannelOwner(user); item.code = null; item.expires = runtime.now() + 28800000; item.touched = runtime.now();
    };
    function unauthorized(message) { var error = runtime.failure(message); error.websiteAuthentication = true; return error; }
    runtime.websiteSession = function (token, pendingAllowed) {
        clean();
        var item = valid(token, 64) && sessions['$' + token];
        if (!item || runtime.shuttingDown) { throw unauthorized('Websiteanmeldung beendet. Bitte erneut anmelden.'); }
        if (item.userId === null && pendingAllowed) { return { entry:item, user:null }; }
        var user = KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).filter(function (person) {
            return runtime.userId(person) === item.userId && runtime.isModerator(person);
        })[0];
        if (!user || (item.owner && !runtime.isChannelOwner(user))) { delete sessions['$' + token]; throw unauthorized('Websiteanmeldung beendet. Bitte im Channel erneut anmelden.'); }
        item.touched = runtime.now();
        return { entry:item, user:user };
    };
    runtime.endWebsiteLogin = function (token) { if (valid(token, 64)) { delete sessions['$' + token]; } };
    runtime.dropWebsiteUser = function (userId) {
        Object.keys(sessions).forEach(function (key) { if (sessions[key].userId === userId) { delete sessions[key]; } });
    };
    runtime.clearWebsiteLogins = function () { sessions = {}; };
};

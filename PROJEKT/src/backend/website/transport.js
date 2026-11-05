/* Dokumentierter HTTP-Anschluss; standardmäßig aus, Freigabe ausschließlich durch Channelinhaber. */
MischWerkModules.attachWebsiteTransport = function (runtime) {
    'use strict';
    var hookUrl = null, rates = {}, enabledKey = 'mischwerk.website.enabled.v1';
    function reply(response, status, data) {
        var body = JSON.stringify(data);
        if (body.length >= 9500) { status = 503; body = '{"version":1,"ok":false,"message":"Antwort zu groß. Bitte einen kleineren Ausschnitt laden."}'; }
        response.send(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
            'X-Content-Type-Options':'nosniff' }, body);
    }
    function limited(address, maximum) {
        var now = runtime.now();
        Object.keys(rates).forEach(function (key) { if (now - rates[key].at >= 60000) { delete rates[key]; } });
        var key = '$' + address;
        if (!rates[key] && Object.keys(rates).length >= 100) { return true; }
        var row = rates[key] || { at:now, count:0 }; rates[key] = row; row.count += 1;
        return row.count > (maximum || 1200);
    }
    function handle(request, response) {
        try {
            runtime.load();
            if (runtime.prune()) { runtime.broadcast(); }
            if (runtime.shuttingDown) { reply(response, 503, {version:1, ok:false}); return; }
            if (limited(String(request.getRemoteAddress()))) { reply(response, 429, {version:1, ok:false}); return; }
            var method = String(request.getMethod());
            if (method === 'GET') {
                var query = {};
                String(request.getQueryString() || '').split('&').forEach(function (pair) {
                    try { var parts = pair.split('='); query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || ''); }
                    catch (error) { throw runtime.failure('Ungültige Kalenderabfrage.'); }
                });
                reply(response, 200, query.radio === '1' ? {version:1, ok:true, radio:runtime.publicWebsiteRadio()} : runtime.publicWebsitePlan(query.week, Number(query.page || 0))); return;
            }
            if (method !== 'POST') { reply(response, 405, {version:1, ok:false}); return; }
            var raw = String(request.getBody() || '');
            if (raw.length >= 9500) { reply(response, 413, {version:1, ok:false}); return; }
            var data, result, auth;
            try { data = JSON.parse(raw); } catch (error) { throw runtime.failure('Ungültige Anfrage.'); }
            if (!data || typeof data !== 'object' || Array.isArray(data)) { throw runtime.failure('Ungültige Anfrage.'); }
            if (!data.operation) {
                if (limited('wish:' + String(request.getRemoteAddress()), 60)) { reply(response, 429, {version:1, ok:false}); return; }
                runtime.submitWebsiteWish(data); result = {};
                try { runtime.broadcast(); } catch (error) { runtime.warn('WEBSITE_WISH_NOTIFY'); }
            } else if (data.operation === 'login.begin') { result = runtime.beginWebsiteLogin(data); }
            else if (data.operation === 'logout') { runtime.endWebsiteLogin(data.token); result = {}; }
            else {
                auth = runtime.websiteSession(data.token, data.operation === 'login.status');
                if (data.operation === 'login.status') { result = {pending:!auth.user}; }
                else if (data.operation === 'state') { result = {state:runtime.websiteState(auth, data)}; }
                else if (data.operation === 'action') { result = runtime.websiteAction(auth, data); }
                else { throw runtime.failure('Unbekannte Websiteanfrage.'); }
            }
            result.version = 1; result.ok = true; reply(response, 200, result);
        } catch (error) {
            reply(response, error.websiteAuthentication ? 401 : error.publicMessage ? 400 : 503, {version:1, ok:false,
                message:error.publicMessage || 'Die Appverbindung ist derzeit nicht verfügbar.'});
        }
    }
    runtime.startWebsite = function () {
        if (KnuddelsServer.getPersistence().getObject(enabledKey, false) !== true) { return; }
        try {
            if (typeof KnuddelsServer.getWebHookAccess !== 'function') { return; }
            hookUrl = String(KnuddelsServer.getWebHookAccess().registerWebHook('website', handle));
        } catch (error) { hookUrl = null; runtime.warn('WEBSITE_REGISTER'); }
    };
    runtime.websiteCommand = function (user, params) {
        try {
            runtime.load();
            var value = String(params || '').replace(/^\s+|\s+$/g, '');
            if (/^[a-f0-9]{32}$/.test(value)) {
                runtime.confirmWebsiteLogin(user, value);
                user.sendPrivateMessage('Websiteanmeldung bestätigt. Du kannst jetzt im Arbeitsbereich fortfahren.'); return;
            }
            if (!runtime.isChannelOwner(user)) { return; }
            if (value === 'aktivieren') { KnuddelsServer.getPersistence().setObject(enabledKey, true); runtime.startWebsite(); }
            else if (value === 'deaktivieren') {
                KnuddelsServer.getPersistence().setObject(enabledKey, false); runtime.clearWebsiteLogins(); hookUrl = null;
                if (typeof KnuddelsServer.getWebHookAccess === 'function') { KnuddelsServer.getWebHookAccess().unregisterWebHook('website'); }
                user.sendPrivateMessage('Websiteanschluss deaktiviert.'); return;
            } else if (value) { throw runtime.failure('Bitte aktivieren, deaktivieren oder einen Anmeldecode verwenden.'); }
            user.sendPrivateMessage(hookUrl ? 'Websiteanschluss nur für deine Serverkonfiguration: ' + hookUrl :
                'Websiteanschluss ist noch nicht aktiv oder auf diesem Appserver nicht verfügbar.');
        } catch (error) { user.sendPrivateMessage(error.publicMessage || 'Websiteanschluss konnte nicht geändert werden.'); }
    };
};

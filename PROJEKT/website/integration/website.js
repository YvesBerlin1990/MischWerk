/* Öffentlicher Wochenplan und anonyme Websitewünsche; niemals Verwaltung oder Identitätsnachweis. */
MischWerkModules.attachWebsite = function (runtime, config) {
    'use strict';
    var hookUrl = null, windows = {};
    function reply(response, status, data) {
        response.send(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }, JSON.stringify(data));
    }
    function query(value) {
        var result = {};
        String(value || '').split('&').forEach(function (pair) {
            var parts = pair.split('='), key = decodeURIComponent(parts[0]);
            if (key === 'week' || key === 'page') { result[key] = decodeURIComponent(parts[1] || ''); }
        });
        return result;
    }
    function schedule(request, response) {
        var data;
        try { data = query(request.getQueryString()); }
        catch (error) { throw runtime.failure('Ungültige Kalenderabfrage.'); }
        if (data.week && !/^\d{4}-\d{2}-\d{2}$/.test(data.week)) { throw runtime.failure('Ungültige Woche.'); }
        if (data.page && !/^\d{1,4}$/.test(data.page)) { throw runtime.failure('Ungültige Seite.'); }
        var page = runtime.schedulePage(null, data.week, Number(data.page || 0));
        var entries = page.entries.map(function (entry) {
            return { id:entry.id, date:entry.date, start:entry.start, end:entry.end, topic:entry.topic,
                moderator:String(entry.nick).toLowerCase() === config.ownerNick.toLowerCase() ? 'Yves' : 'Moderation' };
        });
        reply(response, 200, { version:1, ok:true, week:page.week, today:page.today, days:page.days,
            revision:page.revision, previousRevision:page.previousRevision, entries:entries,
            page:page.page, pages:page.pages, total:page.total, requestsEnabled:runtime.state.requestsEnabled === true });
    }
    function wish(request, response) {
        var raw = request.getBody(), body = raw === null || typeof raw === 'undefined' ? '' : String(raw);
        if (body.length > 5000) { throw runtime.failure('Ungültiger Musikwunsch.'); }
        var data;
        try { data = JSON.parse(body); }
        catch (error) { throw runtime.failure('Ungültiger Musikwunsch.'); }
        var now = runtime.now(), address = '$' + String(request.getRemoteAddress());
        Object.keys(windows).forEach(function (key) { if (now - windows[key].at >= 60000) { delete windows[key]; } });
        var quota = windows[address] || { at:now, count:0 };
        quota.count += 1; windows[address] = quota;
        if (quota.count > 60) { reply(response, 429, { version:1, ok:false }); return; }
        runtime.submitWebsiteWish(data);
        try { runtime.broadcast(); } catch (error) { runtime.warn('WEBSITE_WISH_NOTIFY'); }
        reply(response, 200, { version:1, ok:true });
    }
    runtime.registerWebsite = function () {
        try {
            if (typeof KnuddelsServer.getWebHookAccess !== 'function') { return; }
            hookUrl = String(KnuddelsServer.getWebHookAccess().registerWebHook('website', function (request, response) {
                try {
                    runtime.load();
                    if (runtime.shuttingDown) { reply(response, 503, { version:1, ok:false }); return; }
                    var method = String(request.getMethod());
                    if (method === 'GET') { schedule(request, response); }
                    else if (method === 'POST') { wish(request, response); }
                    else { reply(response, 405, { version:1, ok:false }); }
                } catch (error) { reply(response, error.publicMessage ? 400 : 503, { version:1, ok:false }); }
            }));
        } catch (error) { hookUrl = null; runtime.warn('WEBSITE_HOOK'); }
    };
    runtime.websiteInfo = function (user) {
        if (!runtime.isChannelOwner(user)) { return; }
        user.sendPrivateMessage(hookUrl ? 'Website-Anschluss für die serverseitige Konfiguration: ' + hookUrl :
            'Der Website-Anschluss ist auf diesem Appserver noch nicht verfügbar.');
    };
};

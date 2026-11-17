/* Alter Websiteanschluss ausschließlich lesend; keine Anmeldung oder Schreibaktionen. */
MischWerkModules.attachWebsiteTransport = function(runtime) {
    'use strict';
    runtime.startWebsite = function() {
        if (KnuddelsServer.getPersistence().getObject('mischwerk.website.enabled.v1', false) !== true) {
            return;
        }
        try {
            KnuddelsServer.getWebHookAccess().registerWebHook('website', function(request, response) {
                if (String(request.getMethod()) !== 'GET') {
                    response.send(410, {}, '');
                    return;
                }
                var query = {};
                try {
                    String(request.getQueryString() || '').split('&').forEach(function(pair) {
                        var parts = pair.split('=');
                        query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] ||
                        '');
                    });
                } catch (error) {
                    response.send(400, {}, '');
                    return;
                }
                var body = JSON.stringify(query.radio === '1' ? {
                    version: 1,
                    ok: true,
                    radio: runtime.publicWebsiteRadio()
                } : runtime.publicWebsitePlan(query.week, Number(query.page || 0)));
                if (body.length >= 9500) {
                    response.send(503, {}, '');
                    return;
                }
                response.send(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Cache-Control': 'no-store'
                }, body);
            });
        } catch (error) {
            runtime.warn('WEBSITE_REGISTER');
        }
    };
};

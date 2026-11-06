/* Private, rein lesende AppServer-Prüfung; keine HTTP-Anfrage oder Aktivierung. */
MischWerkModules.attachAndroidDiagnostics = function (runtime, config) {
    'use strict';
    var host = 'https://radio-mischwerk.web.app';
    function apiString(value) {
        if (typeof value === 'string') { return value; }
        if (!value || typeof value !== 'object') { return null; }
        var tag = Object.prototype.toString.call(value);
        if (tag !== '[object String]' && !(tag === '[object JavaObject]' &&
                typeof value.charAt === 'function' && typeof value.substring === 'function')) { return null; }
        return String(value);
    }
    function infoText(value) {
        return typeof value === 'string' && value.length > 0 && value.length <= 160 &&
            value.replace(/\s/g, '').length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
    }
    function inspectInfoValue(read) {
        var record = { returned: false, type: null, isNull: false, tag: null, text: null,
            textLength: null, truncated: false, stringAccepted: false, error: null }, normalized = null, value, text;
        try { value = read(); }
        catch (ignoredRead) { record.error = 'read-failed'; return { record: record, normalized: null }; }
        record.returned = true; record.type = typeof value; record.isNull = value === null;
        try { record.tag = Object.prototype.toString.call(value).slice(0, 64); }
        catch (ignoredTag) { record.error = 'tag-unavailable'; }
        if (value !== null && value !== undefined && typeof value !== 'function') {
            try {
                text = String(value); record.textLength = text.length;
                record.text = text.slice(0, 160); record.truncated = text.length > 160;
            } catch (ignoredText) { record.error = 'string-conversion-failed'; }
        }
        try { normalized = apiString(value); record.stringAccepted = typeof normalized === 'string'; }
        catch (ignoredNormalization) { record.error = 'normalization-failed'; }
        return { record: record, normalized: normalized };
    }
    runtime.androidDiagnosticsCommand = function (user, params) {
        if (!runtime.isChannelOwner(user)) { return; }
        function reply(value) { user.sendPrivateMessage(JSON.stringify(value).escapeKCode()); }
        if (params !== 'pruefen') { reply({ error: 'invalid-command' }); return; }
        var report = { schemaVersion: 1, app: { version: config.version, buildNumber: config.buildNumber },
            checkedAt: runtime.now(), appServer: { version: null, serverId: null, versionComparable: null, webhookMinimumVersionSatisfied: null,
                valueDiagnostics: { version: null, serverId: null } },
            webhook: { apiPresent: null, registrationTested: false },
            externalHttps: { targetUrl: host + '/api/publishKnuddelsState', relayTargetAllowed: null,
                accessFileAllowed: null, targetListed: null, domainCount: null, listComplete: false }, errors: [] };
        function error(tag) { report.errors.push(tag); }
        try {
            var info = KnuddelsServer.getAppServerInfo();
            var versionRead = inspectInfoValue(function () { return info.getVersion(); });
            var idRead = inspectInfoValue(function () { return info.getServerId(); });
            var version = versionRead.normalized, serverId = idRead.normalized;
            report.appServer.valueDiagnostics.version = versionRead.record;
            report.appServer.valueDiagnostics.serverId = idRead.record;
            if (infoText(version)) {
                report.appServer.version = version;
                report.appServer.versionComparable = /^\d{8}-\d{6}$/.test(version);
                if (report.appServer.versionComparable) {
                    report.appServer.webhookMinimumVersionSatisfied = version >= '20260213-125115';
                }
            } else { error('server-version-invalid'); }
            if (infoText(serverId)) { report.appServer.serverId = serverId; }
            else { error('server-id-invalid'); }
        } catch (ignoredInfo) { error('server-info-unavailable'); }
        try {
            var hooks = KnuddelsServer.getWebHookAccess();
            report.webhook.apiPresent = !!hooks && typeof hooks.registerWebHook === 'function' && typeof hooks.unregisterWebHook === 'function';
        } catch (ignoredHooks) { error('webhook-api-unavailable'); }
        var external;
        try { external = KnuddelsServer.getExternalServerAccess(); }
        catch (ignoredExternal) { error('external-api-unavailable'); }
        function allowed(url) {
            try {
                var result = external.canAccessURL(url);
                if (typeof result === 'boolean') { return result; }
                error('domain-permission-invalid');
            } catch (ignoredPermission) { error('domain-permission-unavailable'); }
            return null;
        }
        report.externalHttps.relayTargetAllowed = allowed(report.externalHttps.targetUrl);
        report.externalHttps.accessFileAllowed = allowed(host + '/knuddelsAccess.txt');
        try {
            var domains = external.getAllAccessibleDomains(), found = false, complete = true, index, name;
            if (!domains || typeof domains.length !== 'number' || domains.length < 0 ||
                    domains.length > 1000 || Math.floor(domains.length) !== domains.length) { throw new Error('DOMAIN_LIST'); }
            report.externalHttps.domainCount = domains.length;
            for (index = 0; index < domains.length; index += 1) {
                try {
                    name = apiString(domains[index].getDomainName());
                    if (typeof name !== 'string') { complete = false; }
                    else if (/^(?:https:\/\/)?radio-mischwerk\.web\.app(?::443)?\/?$/i.test(name)) { found = true; }
                } catch (ignoredDomain) { complete = false; }
            }
            report.externalHttps.listComplete = complete;
            report.externalHttps.targetListed = found ? true : (complete ? false : null);
            if (!complete) { error('domain-list-incomplete'); }
        } catch (ignoredList) { error('domain-list-unavailable'); }
        reply(report);
    };
};

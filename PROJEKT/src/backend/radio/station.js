/* Bestätigte öffentliche STREAMPANEL-Anschlüsse und explizite Antwortzuordnung. */
MischWerkModules.attachStation = function (runtime, config) {
    'use strict';
    function publicUrl(value) {
        if (typeof value !== 'string' || value.length > 2000) { return ''; }
        value = value.trim();
        var decoded;
        try { decoded = decodeURIComponent(value); } catch (error) { return ''; }
        var match = /^https:\/\/([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::443)?(?:\/[a-z0-9._~!$&'()*+,;=:@%/?-]*)?$/i.exec(value);
        if (!match || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,63}$/i.test(match[1]) ||
                /(?:^|[?&])(?:key|token|password|pass|auth|secret|api_key|apikey|authorization|access_token)=/i.test(decoded) ||
                /(?:^|\.)(?:localhost|local|internal|test)$/i.test(match[1])) { return ''; }
        return value;
    }
    function host(url) { return url.replace(/^https:\/\//i, '').split(/[/:?]/)[0].toLowerCase(); }
    function field(value) {
        if (typeof value !== 'string' || value.length > 200 ||
                !/^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+){0,7}$/.test(value) ||
                /(?:^|\.)(?:__proto__|prototype|constructor)(?:\.|$)/.test(value)) { return ''; }
        return value;
    }
    function scalar(value) {
        return typeof value === 'boolean' || (typeof value === 'number' && isFinite(value)) ||
            (typeof value === 'string' && value.length <= 120) ? value : null;
    }
    runtime.station = function () {
        var settings = config.streampanel || {};
        var stream = publicUrl(settings.streamUrl);
        var hosts = stream ? [host(stream)] : [];
        (Array.isArray(settings.allowedHosts) ? settings.allowedHosts.slice(0, 10) : []).forEach(function (name) {
            if (typeof name !== 'string') { return; }
            var checked = publicUrl('https://' + name.trim().toLowerCase() + '/');
            if (checked && hosts.indexOf(host(checked)) === -1) { hosts.push(host(checked)); }
        });
        function endpoint(value) {
            var url = publicUrl(value);
            return stream && url && hosts.indexOf(host(url)) !== -1 ? url : '';
        }
        var history = endpoint(settings.historyUrl);
        if (stream && settings.historyUrl === 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json' &&
                hosts.indexOf('mischwerk.spcast.eu') !== -1) { history = settings.historyUrl; }
        var metadata = settings.metadata || {}, status = settings.status || {};
        return { name: config.stationName, provider: 'streampanel', configured: !!stream,
            streamUrl: stream, stationUrl: stream, allowedHosts: hosts,
            metadataUrl: endpoint(metadata.url), modeUrl: endpoint(metadata.modeUrl),
            statusUrl: endpoint(status.url),
            historyUrl: history,
            historyIgnoredTitles: Array.isArray(settings.historyIgnoredTitles) ? settings.historyIgnoredTitles.slice(0, 20).filter(function (title) {
                return typeof title === 'string' && title.trim().length > 0 && title.length <= 200;
            }).map(function (title) { return title.trim(); }) : [],
            statusFormat: status.format === 'spcast-statistics' ? status.format : '',
            streamId: typeof status.streamId === 'number' && status.streamId > 0 && status.streamId % 1 === 0 ? status.streamId : null,
            streamPath: typeof status.streamPath === 'string' && /^\/[a-zA-Z0-9_/-]{1,120}$/.test(status.streamPath) ? status.streamPath : '',
            fields: { title: field(metadata.titleField), artist: field(metadata.artistField), live: field(metadata.liveField),
                status: field(status.valueField), statusIdentity: field(status.identityField) },
            statusValues: { online: scalar(status.onlineValue), offline: scalar(status.offlineValue) },
            stationId: typeof status.identityValue === 'string' && status.identityValue.length <= 120 ? status.identityValue : '' };
    };
};

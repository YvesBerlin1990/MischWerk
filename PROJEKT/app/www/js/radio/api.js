/* Öffentliche HTTPS-Audio-/JSON-Anschlüsse; Feldzuordnung erst aus bestätigten Produktdaten. */
MischWerkUI.define('radioApi', function () {
  'use strict';
  var pending = {};
  function publicUrl(value, hosts) {
    if (typeof value !== 'string' || value.length > 2000 || !Array.isArray(hosts)) { return false; }
    try {
      var url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443') ||
          !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,63}$/i.test(url.hostname) ||
          /(?:^|\.)(?:localhost|local|internal|test)$/i.test(url.hostname) || hosts.indexOf(url.hostname.toLowerCase()) === -1) { return false; }
      var secret = false;
      url.searchParams.forEach(function (value, key) {
        if (/^(?:key|token|password|pass|auth|secret|api_key|apikey|authorization|access_token)$/i.test(key)) { secret = true; }
      });
      return !secret;
    } catch (error) { return false; }
  }
  function audioUrl(station) {
    return station && station.configured && station.provider === 'streampanel' &&
      publicUrl(station.streamUrl, station.allowedHosts) ? station.streamUrl : null;
  }
  function streamUrls(station) {
    if (!station || !station.configured || station.provider !== 'streampanel' ||
        !publicUrl(station.streamUrl, station.allowedHosts) || !station.fields || !station.statusValues) { return null; }
    for (var name of ['metadataUrl', 'modeUrl', 'statusUrl']) {
      if (station[name] && !publicUrl(station[name], station.allowedHosts)) { return null; }
    }
    if (station.statusFormat && (station.statusFormat !== 'spcast-statistics' ||
        !Number.isSafeInteger(station.streamId) || station.streamId < 1 || !station.streamPath || !station.fields.statusIdentity || !station.stationId)) { return null; }
    return { stream: station.streamUrl,
      metadata: station.metadataUrl && (station.fields.title || station.fields.artist) ? station.metadataUrl : '',
      mode: station.modeUrl || '',
      status: station.statusUrl && station.fields.status && station.statusValues.online !== null &&
        station.statusValues.offline !== null && station.statusValues.online !== station.statusValues.offline ? station.statusUrl : '' };
  }
  function getResponse(url, fresh) {
    if (pending[url]) { return pending[url]; }
    var task;
    if (fresh && typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 10000);
      task = fetch(url, { cache: 'no-store', credentials: 'omit', signal: controller.signal }).then(function (response) {
        if (!response.ok) { throw new Error('http'); }
        return response.text();
      }).then(function (text) { clearTimeout(timer); return text; }, function () {
        clearTimeout(timer); throw new Error('network');
      });
    } else {
      task = new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest(); request.open('GET', url, true); request.timeout = 10000;
        request.onload = function () {
          if (request.status < 200 || request.status >= 300) { reject(new Error('http')); return; }
          resolve(request.responseText);
        };
        request.onerror = request.ontimeout = function () { reject(new Error('network')); };
        request.send();
      });
    }
    pending[url] = task.then(function (text) { delete pending[url]; return text; }, function (error) {
      delete pending[url]; throw error;
    });
    return pending[url];
  }
  function readField(data, field) {
    if (typeof field !== 'string' || field.length > 200 ||
        !/^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+){0,7}$/.test(field)) { return undefined; }
    var parts = field.split('.');
    for (var part of parts) {
      if (part === '__proto__' || part === 'prototype' || part === 'constructor' || data === null ||
          typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, part)) { return undefined; }
      data = data[part];
    }
    return data;
  }
  function object(text) {
    var data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || data.status === 'error') { throw new Error('invalid response'); }
    return data;
  }
  function statusSource(data, station) {
    if (station.statusFormat !== 'spcast-statistics') { return data; }
    if (!Array.isArray(data.streams) || !Number.isSafeInteger(data.totalstreams) || data.totalstreams < data.streams.length ||
        !Number.isSafeInteger(data.activestreams) || data.activestreams < 0 || data.activestreams > data.totalstreams) { throw new Error('invalid statistics'); }
    if (!data.streams.length && data.activestreams === 0 && data.currentlisteners === 0) { return null; }
    var active = data.streams.filter(function (stream) { return stream && (stream.streamstatus === 1 || stream.backupstatus === 1); }).length;
    if (active !== data.activestreams) { throw new Error('contradictory active streams'); }
    var matches = data.streams.filter(function (stream) { return stream && stream.id === station.streamId; });
    if (matches.length !== 1 || matches[0].streampath !== station.streamPath ||
        readField(matches[0], station.fields.statusIdentity) !== station.stationId) { throw new Error('stream mismatch'); }
    var source = matches[0];
    if ((source.streamstatus !== 0 && source.streamstatus !== 1) || (source.backupstatus !== 0 && source.backupstatus !== 1) ||
        (data.activestreams === 0 && (source.streamstatus === 1 || source.backupstatus === 1))) { throw new Error('contradictory statistics'); }
    return source;
  }
  function fetchStationStatus(station) {
    var urls = streamUrls(station);
    if (!urls || !urls.status) { return Promise.reject(new Error('status unavailable')); }
    return getResponse(urls.status, true).then(function (text) {
      var data = statusSource(object(text), station);
      if (data === null) { return 'stopped'; }
      if (station.fields.statusIdentity && readField(data, station.fields.statusIdentity) !== station.stationId) { throw new Error('station mismatch'); }
      if (station.statusFormat === 'spcast-statistics' && data.backupstatus === 1) { return 'started'; }
      var value = readField(data, station.fields.status);
      return value === station.statusValues.online ? 'started' : value === station.statusValues.offline ? 'stopped' : 'unknown';
    });
  }
  function fetchProviderStatus(station) { return fetchStationStatus(station).catch(function () { return 'unknown'; }); }
  function fetchMetadata(station) {
    var urls = streamUrls(station);
    if (!urls || !urls.metadata) { return Promise.reject(new Error('metadata unavailable')); }
    var mode = urls.mode ? getResponse(urls.mode, true).then(function (text) {
      return text.trim() === 'live' ? true : text.trim() === 'autodj' ? false : null;
    }).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([getResponse(urls.metadata, true), mode]).then(function (responses) {
      var text = responses[0];
      if (JSON.parse(text) === null) { return { title: '', artist: { name: '' }, isLive: responses[1] }; }
      var data = object(text), title = readField(data, station.fields.title), artist = readField(data, station.fields.artist);
      if (title === undefined && artist === undefined) { throw new Error('metadata fields unavailable'); }
      var live = readField(data, station.fields.live);
      return { title: typeof title === 'string' ? title.trim() : '', artist: { name: typeof artist === 'string' ? artist.trim() : '' },
        isLive: typeof live === 'boolean' ? live : responses[1] };
    });
  }
  return { audioUrl: audioUrl, streamUrls: streamUrls, fetchProviderStatus: fetchProviderStatus,
    fetchStationStatus: fetchStationStatus, fetchMetadata: fetchMetadata };
});

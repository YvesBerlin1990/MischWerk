/* Öffentliche SPCast-Historie, strenge Datenprüfung und Berliner Tagesgrenzen. */
MischWerkUI.define('historyData', function () {
  'use strict';
  var days = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit' });
  var times = new Intl.DateTimeFormat('de-DE', { timeZone:'Europe/Berlin', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  function day(now) {
    var parts = {};
    days.formatToParts(new Date(now)).forEach(function (part) { parts[part.type] = part.value; });
    return parts.year + '-' + parts.month + '-' + parts.day;
  }
  function nextDay(now) {
    var today = day(now), low = Math.floor(now / 1000), high = low + 36 * 3600;
    while (high - low > 1) {
      var middle = Math.floor((low + high) / 2);
      if (day(middle * 1000) === today) { low = middle; } else { high = middle; }
    }
    return high * 1000;
  }
  function url(station) {
    if (!station || station.provider !== 'streampanel' || !station.configured || !Array.isArray(station.allowedHosts)) { return ''; }
    try {
      var source = new URL(station.historyUrl), secret = false;
      source.searchParams.forEach(function (value, key) { if (/^(?:key|token|password|pass|auth|secret|api_key|apikey|authorization|access_token)$/i.test(key)) { secret = true; } });
      var specific = source.href === 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json';
      if (source.protocol !== 'https:' || source.username || source.password || source.hash || secret ||
          (source.port && source.port !== '443' && !specific) || station.allowedHosts.indexOf(source.hostname) === -1 ||
          !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,63}$/i.test(source.hostname) ||
          /(?:^|\.)(?:localhost|local|internal|test)$/i.test(source.hostname)) { return ''; }
      return source.href;
    } catch (error) { return ''; }
  }
  function parse(rows, now, station) {
    if (!Array.isArray(rows) || rows.length > 10000) { throw new Error('invalid history'); }
    var today = day(now), seen = Object.create(null), result = [];
    function titleKey(text) { return text.trim().replace(/\s+/g, ' ').toLowerCase(); }
    var ignored = station && Array.isArray(station.historyIgnoredTitles) ? station.historyIgnoredTitles.filter(function (title) {
      return typeof title === 'string';
    }).map(titleKey) : [];
    rows.forEach(function (row) {
      var stamp = row && row.timestamp, text = row && row.metadata && row.metadata.song;
      if (!Number.isSafeInteger(stamp) || stamp <= 0 || stamp * 1000 > now || typeof text !== 'string' ||
          !text.trim() || text.trim().toLowerCase() === 'unknown' || text.length > 2000 || day(stamp * 1000) !== today) { return; }
      if (ignored.indexOf(titleKey(text)) !== -1) { return; }
      var key = stamp + ':' + text;
      if (seen[key]) { return; } seen[key] = true;
      result.push({ timestamp:stamp, text:text });
    });
    return result.sort(function (a, b) { return b.timestamp - a.timestamp; });
  }
  function load(station) {
    var source = url(station);
    if (!source) { throw new Error('history unavailable'); }
    var cancel, timer;
    var task;
    if (typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
      var controller = new AbortController(); cancel = function () { controller.abort(); };
      task = fetch(source, { cache:'no-store', credentials:'omit', redirect:'error', signal:controller.signal }).then(function (response) {
        if (!response.ok) { throw new Error('http'); } return response.text();
      });
    } else {
      var request = new XMLHttpRequest(); cancel = function () { request.abort(); };
      task = new Promise(function (resolve, reject) {
        request.open('GET', source, true); request.timeout = 10000;
        request.onload = function () { if (request.status >= 200 && request.status < 300) { resolve(request.responseText); } else { reject(new Error('http')); } };
        request.onerror = request.ontimeout = request.onabort = function () { reject(new Error('network')); };
        request.send();
      });
    }
    timer = setTimeout(cancel, 10000);
    task = task.then(function (text) {
      if (text.length > 2000000) { throw new Error('history too large'); }
      var rows = JSON.parse(text);
      if (!Array.isArray(rows)) { throw new Error('invalid history'); } return rows;
    }).finally(function () { clearTimeout(timer); });
    return { promise:task, cancel:cancel };
  }
  return { day:day, nextDay:nextDay, time:function (stamp) { return times.format(new Date(stamp * 1000)); }, url:url, parse:parse, load:load };
});

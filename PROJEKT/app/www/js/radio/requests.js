/* Öffentliche Datenabrufe: je URL ein Auftrag, Timeout und expliziter Abbruch. */
MischWerkUI.define('radioRequests', function () {
  'use strict';
  var pending = {}, sequence = 0;
  function get(url, format) {
    if (pending[url]) { return pending[url].promise; }
    var entry = {}, cancel, timer;
    pending[url] = entry;
    var plain = format === 'spcast-shoutcast-song';
    // Der Titelanschluss unterstützt diesen Parameter; Statistik akzeptiert nur ihre feste URL.
    var requestUrl = plain ? url + (url.indexOf('?') === -1 ? '?' : '&') + '_mw=' + Date.now() + '-' + (++sequence) : url;
    entry.promise = new Promise(function (resolve, reject) {
      var settled = false, controller, request;
      function finish(error, text) {
        if (settled) { return; }
        settled = true; clearTimeout(timer);
        if (pending[url] === entry) { delete pending[url]; }
        if (error) { reject(error); } else { resolve(text); }
      }
      function response(text, type) {
        var validType = /^text\/(?:plain|html)(?:\s*;|$)/i;
        if (plain && !validType.test(type || '')) { finish(new Error('song content type')); return; }
        finish(null, text);
      }
      cancel = function () {
        finish(new Error('cancelled'));
        if (controller) { controller.abort(); }
        if (request) { request.abort(); }
      };
      timer = setTimeout(cancel, 10000);
      try { if (typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
        controller = new AbortController();
        fetch(requestUrl, { cache: 'no-store', credentials: 'omit', signal: controller.signal }).then(function (result) {
          if (!result.ok) { throw new Error('http'); }
          return result.text().then(function (text) { response(text, result.headers.get('content-type')); });
        }).catch(function () { finish(new Error('network')); });
      } else {
        request = new XMLHttpRequest(); request.open('GET', requestUrl, true); request.timeout = 10000;
        request.onload = function () {
          if (request.status < 200 || request.status >= 300) { finish(new Error('http')); return; }
          response(request.responseText, request.getResponseHeader('content-type'));
        };
        request.onerror = request.ontimeout = request.onabort = function () { finish(new Error('network')); };
        request.send();
      } } catch (error) { finish(new Error('network')); }
    });
    entry.cancel = function () { cancel(); };
    return entry.promise;
  }
  function cancel(url) { if (pending[url]) { pending[url].cancel(); } }
  return { get: get, cancel: cancel };
});

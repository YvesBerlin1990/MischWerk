/* Lokaler Plattformadapter. Ausschließlich vom Emulator injiziert, niemals UserApp-Code. */
(function () {
  'use strict';
  var boot = window.__Emulator, handlers = {}, pending = {}, visibilityOverride = null;
  function send(type, detail) {
    parent.postMessage(Object.assign({ source: 'mischwerk-emulator-frame', type: type, sessionId: boot.sessionId }, detail), location.origin);
  }
  function note(message, detail) { send('diagnostic', { message: message, detail: detail || null }); }
  function validate(data) {
    var serialized = JSON.stringify(data === undefined ? {} : data);
    if (!serialized || serialized.length >= 10000) throw new Error('Client.sendEvent: Nutzdaten müssen unter 10000 Zeichen bleiben.');
    return JSON.parse(serialized);
  }
  function include(files, css) {
    Array.prototype.forEach.call(files, function (file) {
      var url = new URL(file, document.baseURI);
      if (url.origin !== location.origin || !url.pathname.startsWith('/app/')) throw new Error('Dateieinbindung außerhalb der lokalen App.');
      url.searchParams.set('v', boot.cacheVersion);
      if (boot.faults.loader === 'parser') {
        if (document.readyState !== 'loading') {
          note('API-Verstoß: includeJS/includeCSS nach Ende des HTML-Parsens.', { file: file });
          throw new Error('Parsermodus: includeJS/includeCSS muss während des HTML-Parsens aufgerufen werden.');
        }
        document.write(css ? '<link rel="stylesheet" href="' + url.href + '">' : '<script src="' + url.href + '"></scr' + 'ipt>');
      } else {
        var node = document.createElement(css ? 'link' : 'script');
        if (css) { node.rel = 'stylesheet'; node.href = url.href; } else node.src = url.href;
        document.head.appendChild(node);
      }
    });
  }
  function event(type, data) { return { type: type, data: data, getType: function () { return type; }, getData: function () { return data; } }; }
  function deliver(type, data) {
    var callbacks = handlers[type];
    if (!callbacks || !callbacks.length) {
      var queue = pending[type] || (pending[type] = []);
      if (queue.length >= 100) { queue.shift(); note('Ereignispuffer voll.', { type: type }); }
      queue.push(data); return;
    }
    callbacks.slice().forEach(function (callback) { callback(event(type, data)); });
  }
  var host = {
    getAppViewMode: function () { return boot.mode.toUpperCase(); },
    getBrowserType: function () { return 'Chrome'; },
    getBrowserVersion: function () { var match = /(?:Edg|Chrome)\/([\d.]+)/.exec(navigator.userAgent); return match ? match[1] : 'unknown'; },
    setSize: function (width, height) {
      if (![width, height].every(function (value) { return typeof value === 'number' && isFinite(value) && value >= 0; })) throw new Error('HostFrame.setSize erwartet endliche nichtnegative Maße.');
      send('host', { method: 'setSize', width: width, height: height });
    },
    setTitle: function (title) { send('host', { method: 'setTitle', title: String(title).slice(0, 200) }); },
    setResizable: function (value) { send('host', { method: 'setResizable', value: value === true }); },
    setMinSize: function (width, height) { send('host', { method: 'setMinSize', width: width, height: height }); },
    setMaxSize: function (width, height) { send('host', { method: 'setMaxSize', width: width, height: height }); },
    focus: function () { window.focus(); },
    setBackgroundColor: function () { note('HostFrame-Hintergrund wird nur durch die App-CSS dargestellt.'); },
    setIcons: function () { note('Native Fenstersymbole sind nicht modelliert.'); }
  };
  var client = {
    pageData: boot.pageData, getNick: function () { return boot.nick; },
    isK3Client: function () { return boot.client !== 'stapp' && boot.client !== 'jfx'; },
    getClientType: function () { return { toString: function () { return boot.client === 'android' ? 'Android' : boot.client === 'ios' ? 'IOS' : boot.client === 'jfx' ? 'Applet' : 'Browser'; } }; },
    getHostFrame: function () { return host; }, getCacheInvalidationId: function () { return boot.cacheVersion; },
    includeJS: function () { include(arguments, false); }, includeCSS: function () { include(arguments, true); },
    sendEvent: function (type, data) {
      if (typeof type !== 'string' || !type || type === '*' || type.length > 100) throw new Error('Client.sendEvent: ungültiger Eventtyp.');
      send('event', { eventType: type, eventData: validate(data) });
    },
    addEventListener: function (type, callback) {
      if (typeof callback !== 'function') throw new Error('Listener benötigt eine Funktion.');
      (handlers[type] || (handlers[type] = [])).push(callback);
      var queued = pending[type] || []; delete pending[type]; queued.forEach(function (data) { deliver(type, data); });
    },
    removeEventListener: function (type, callback) { handlers[type] = callback ? (handlers[type] || []).filter(function (item) { return item !== callback; }) : []; },
    dispatchEvent: function (value) { deliver(value.type, value.data); },
    close: function () { send('close'); },
    executeSlashCommand: function (command) { send('command', { command: String(command) }); },
    getDirectConnection: function () { return Promise.resolve(null); },
    addConnectionTypeChangeListener: function () {}, removeConnectionTypeChangeListener: function () {}
  };
  window.Client = new Proxy(client, { get: function (target, property) {
    if (typeof property !== 'symbol' && !(property in target)) { note('Nicht modellierte Client-API: ' + property); throw new Error('Nicht modellierte Client-API: ' + property); }
    return target[property];
  } });
  function localFixture(value) {
    var url = new URL(value, location.href);
    return url.origin === 'https://emulator.mischwerk.invalid' ? location.origin + url.pathname + url.search : value;
  }
  var nativeFetch = window.fetch;
  window.fetch = function (input, options) {
    var url = typeof input === 'string' || input instanceof URL ? localFixture(String(input)) : input;
    return nativeFetch.call(this, url, options);
  };
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var args = Array.prototype.slice.call(arguments); args[1] = localFixture(url);
    return nativeOpen.apply(this, args);
  };
  var mediaSource = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  Object.defineProperty(HTMLMediaElement.prototype, 'src', { configurable: true, get: mediaSource.get,
    set: function (value) { mediaSource.set.call(this, localFixture(value)); } });
  window.addEventListener('message', function (message) {
    if (message.source !== parent || message.origin !== location.origin || !message.data || message.data.source !== 'mischwerk-emulator-host' || message.data.sessionId !== boot.sessionId) return;
    var data = message.data;
    if (data.type === 'event') deliver(data.eventType, data.eventData);
    if (data.type === 'visibility') {
      visibilityOverride = data.hidden;
      Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return visibilityOverride; } });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return visibilityOverride ? 'hidden' : 'visible'; } });
      document.dispatchEvent(new Event('visibilitychange'));
    }
    if (data.type === 'inspect') {
      var controls = Array.from(document.querySelectorAll('button,input,textarea,select,a[href]')).filter(function (element) {
        var style = getComputedStyle(element); return element.getClientRects().length && style.visibility !== 'hidden' && !element.closest('[inert]');
      });
      var outside = controls.filter(function (element) { var rect = element.getBoundingClientRect(); return rect.left < -1 || rect.right > innerWidth + 1; });
      send('layout', { viewport: { width: innerWidth, height: innerHeight }, overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        controls: controls.length, outside: outside.map(function (element) { return element.id || element.textContent.trim().slice(0, 80); }),
        smallButtons: controls.filter(function (element) { var rect = element.getBoundingClientRect(); return element.tagName === 'BUTTON' && (rect.width < 43 || rect.height < 43); }).map(function (element) { return element.id; }),
        activeElement: document.activeElement && document.activeElement.id, ready: document.documentElement.classList.contains('mw-ready') });
    }
  });
  window.addEventListener('error', function (error) {
    note(error.message || 'Ressource konnte nicht geladen werden.', { file: error.filename || error.target.src || error.target.href || '', line: error.lineno });
  }, true);
  window.addEventListener('unhandledrejection', function (error) { note('Unbehandelte Promise-Ablehnung: ' + String(error.reason)); });
  document.addEventListener('DOMContentLoaded', function () { send('frameLoaded'); });
  var readyAt = performance.now(), observer = new MutationObserver(function () {
    if (document.documentElement.classList.contains('mw-ready')) {
      send('ready', { milliseconds: Math.round(performance.now() - readyAt) }); observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();

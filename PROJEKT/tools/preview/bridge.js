/* Ausschließlich lokaler Preview-Server. Nicht in app/www/ kopieren. */
(function () {
  'use strict';
  var handlers = {};
  var boot = window.MischWerkDemoData;
  function deliver(events) {
    events.forEach(function (event) {
      (handlers[event.type] || []).forEach(function (callback) { callback(event); });
      if (event.type === 'mw:wishes.open' || event.type === 'mw:wishes.closed') {
        if (window.parent !== window) { window.parent.postMessage({ type:'preview-wishes', open:event.type === 'mw:wishes.open', sessionId:boot.sessionId }, location.origin); }
      }
    });
  }
  window.Client = {
    pageData: boot.pageData,
    includeCSS: function (file) { var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = file; document.head.appendChild(link); },
    includeJS: function (file) { var script = document.createElement('script'); script.src = file; document.head.appendChild(script); },
    isK3Client: function () { return true; },
    close: function () { window.Client.sendEvent('mw:wishes.close', {}); },
    getHostFrame: function () { return { setTitle: function () {}, setResizable: function () {} }; },
    addEventListener: function (type, callback) { (handlers[type] || (handlers[type] = [])).push(callback); },
    sendEvent: function (type, data) {
      if (type === 'mw:openStudio' || type === 'mw:openRadioTeam' || type === 'mw:openSchedule') {
        var view = type === 'mw:openStudio' ? 'studio' : type === 'mw:openRadioTeam' ? 'team' : type === 'mw:openSchedule' ? 'schedule' : 'wishes';
        var popup = window.open('/preview?sourceSession=' + encodeURIComponent(boot.sessionId) + '&view=' + view,
          'MischWerkDemo-' + view, 'popup,width=' + (view === 'schedule' ? 820 : view === 'team' ? 560 : view === 'wishes' ? 520 : 780) +
            ',height=' + (view === 'schedule' || view === 'team' ? 560 : view === 'wishes' ? 360 : 600));
        setTimeout(function () {
          (handlers['mw:result'] || []).forEach(function (callback) { callback({ data: { ok: !!popup,
            message: popup ? 'Demo-Fenster geöffnet.' : 'Bitte erlaube Popups für die lokale Demo.', action: type, requestId: data.requestId } }); });
        }, 0);
        return;
      }
      fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: boot.sessionId, type: type, data: data }) })
        .then(function (response) { if (!response.ok) { throw new Error('demo'); } return response.json(); })
        .then(deliver)
        .catch(function () {
          if (type === 'mw:wish.submit') {
            (handlers['mw:wish.receipt'] || []).forEach(function (callback) { callback({ data: { accepted: false,
              message: 'Der lokale Vorschau-Server ist nicht erreichbar.', submissionId: data && data.submissionId } }); });
          } else {
            (handlers['mw:result'] || []).forEach(function (callback) { callback({ data: { ok: false,
              message: 'Der lokale Vorschau-Server ist nicht erreichbar.', action: type, requestId: data && data.requestId } }); });
          }
        });
    }
  };
  var pollTimer;
  var ended = false;
  function poll() {
    if (ended) { return; }
    fetch('/api/poll?sessionId=' + encodeURIComponent(boot.sessionId))
      .then(function (response) { return response.ok ? response.json() : []; }).then(deliver)
      .catch(function () {}).then(function () { if (!ended) { pollTimer = setTimeout(poll, 100); } });
  }
  if (boot.embedded || boot.pageData.wishSurface) { pollTimer = setTimeout(poll, 100); }
  window.addEventListener('pagehide', function () { ended = true; clearTimeout(pollTimer); });
  document.addEventListener('DOMContentLoaded', function () { document.getElementById('demo-banner').hidden = boot.embedded || boot.pageData.wishSurface; });
}());

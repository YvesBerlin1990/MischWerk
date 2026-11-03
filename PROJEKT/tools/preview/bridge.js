/* Ausschließlich lokaler Preview-Server. Nicht in app/www/ kopieren. */
(function () {
  'use strict';
  var handlers = {};
  var boot = window.MischWerkDemoData;
  var lifecycle = { 'mw:overlay.open':true, 'mw:overlay.closed':false, 'mw:wishes.open':true, 'mw:wishes.closed':false };
  function deliver(events) {
    events.forEach(function (event) {
      (handlers[event.type] || []).forEach(function (callback) { callback(event); });
      if (Object.prototype.hasOwnProperty.call(lifecycle, event.type) && !event.data.shared && !event.data.switching && window.parent !== window) {
        window.parent.postMessage({ type:'preview-overlay', open:lifecycle[event.type],
          kind:event.data.kind || 'wishes', sessionId:boot.sessionId }, location.origin);
      }
    });
  }
  window.Client = {
    pageData: boot.pageData,
    includeCSS: function (file) { var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = file; document.head.appendChild(link); },
    includeJS: function (file) { var script = document.createElement('script'); script.src = file; document.head.appendChild(script); },
    isK3Client: function () { return true; },
    getHostFrame: function () { return { setTitle: function () {},
      setSize: function (width, height) {
        if (boot.pageData.overlay && window.parent !== window) {
          parent.postMessage({ type:'preview-wish-size', kind:boot.pageData.view, width:width, height:height }, location.origin);
        }
      } }; },
    addEventListener: function (type, callback) { (handlers[type] || (handlers[type] = [])).push(callback); },
    sendEvent: function (type, data) {
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
  if (boot.embedded || boot.pageData.overlay) { pollTimer = setTimeout(poll, 100); }
  window.addEventListener('pagehide', function () { ended = true; clearTimeout(pollTimer); });
  document.addEventListener('DOMContentLoaded', function () { document.getElementById('demo-banner').hidden = boot.embedded || boot.pageData.overlay; });
}());

/* Radioseitiger Wunschrelay: Darstellung bündeln, nur Änderungen weiterreichen. */
MischWerkUI.define('wishRelay', function (dependencies) {
  'use strict';
  var bridge=dependencies.bridge, model=dependencies.model, dom=dependencies.dom;
  var commands=dependencies.commands, signals=dependencies.signals;
  var sequence=0, surfaceId=null, surfaceRevision=0, mirrored=null, opened=false;
  var mirrorTimer=null, observer;
  function mirror(force) {
    if (force === true) { clearTimeout(mirrorTimer); mirrorTimer=null; publish(true); return; }
    if (mirrorTimer !== null) { return; }
    mirrorTimer=setTimeout(function () { mirrorTimer=null; publish(false); }, 0);
  }
  function publish(force) {
    if (!opened && force !== true) { return; }
    var feedback = dom.el('wish-feedback');
    var data = { text:dom.el('wish-text').value, sequence:sequence, surfaceId:surfaceId,
      disabled:dom.el('wish-fields').disabled, feedback:feedback.textContent, feedbackHidden:feedback.hidden,
      error:feedback.classList.contains('error'), pending:feedback.classList.contains('pending'),
      hint:dom.el('wish-hint').hidden ? '' : dom.el('wish-hint').textContent };
    var key = JSON.stringify(data);
    if (key === mirrored && force !== true) { return; }
    mirrored = key;
    commands.send('mw:wishes.sync', data, false);
  }
  function radioStart() {
    dom.el('open-wishes').setAttribute('aria-haspopup', 'dialog');
    dom.el('open-wishes').setAttribute('aria-expanded', 'false');
    bridge.addEventListener('mw:wishes.open', function (event) {
      sequence = 0;
      surfaceId = event.data.surfaceId; surfaceRevision = event.data.viewRevision || 1; opened = true;
      dom.el('open-wishes').setAttribute('aria-expanded', 'true'); mirror(true);
    });
    bridge.addEventListener('mw:overlay.open', function () {
      opened = false; dom.el('open-wishes').setAttribute('aria-expanded', 'false');
    });
    bridge.addEventListener('mw:wishes.closed', function (event) {
      if (event.data.surfaceId !== surfaceId) { return; }
      opened = false; dom.el('open-wishes').setAttribute('aria-expanded', 'false'); signals.emit('overlay-closed', { kind:'wishes' });
    });
    bridge.addEventListener('mw:wishes.input', function (event) {
      var data = event.data;
      if (!data || data.surfaceId !== surfaceId || data.sequence <= sequence || typeof data.text !== 'string') { return; }
      sequence = data.sequence;
      // Auch bei inzwischen gesperrtem Versand bleibt die eigene letzte Eingabe erhalten.
      dom.el('wish-text').value = data.text;
      dom.el('wish-text').dispatchEvent(new Event('input', { bubbles:true }));
      if (data.submit && !dom.el('wish-fields').disabled && model.connected()) {
        dom.el('wish-form').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      }
      mirror();
    });
    observer = new MutationObserver(function () { mirror(); });
    observer.observe(dom.el('wishes-panel'), {
      subtree:true, childList:true, attributes:true, attributeFilter:['disabled','hidden','class']
    });
    dom.el('wish-text').addEventListener('input', function () { mirror(); });
    window.addEventListener('pagehide', function () { clearTimeout(mirrorTimer); observer.disconnect(); });
  }
  return { start:function () { if (bridge) { radioStart(); } } };
});

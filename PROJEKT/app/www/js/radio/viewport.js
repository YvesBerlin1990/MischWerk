/* Radio-Geometrie und direkt zugängliche Musik-/Lautstärkeangaben; das Audioelement und der Channelzustand bleiben erhalten. */
MischWerkUI.define('viewport', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var root = document.documentElement;
  var requestedHeight = 0;
  var scheduled = false;
  function resize() {
    if (model.view !== 'radio' || document.readyState !== 'complete') { return; }
    var small = window.innerWidth < 700;
    var focused = document.activeElement;
    var constrained = small && window.innerHeight < 360;
    root.classList.toggle('radio-constrained', constrained);
    var bar = dom.el('radio-panel');
    if (bridge && !bridge.isK3Client()) {
      // Natürliche mobile Höhe einmal messen; bei ignorierter Hostanpassung kompakt bleiben.
      root.classList.remove('radio-constrained');
      var height = Math.max(160, Math.min(500, Math.ceil(bar.getBoundingClientRect().height)));
      root.style.setProperty('--radio-height', height + 'px');
      if (height !== requestedHeight) {
        requestedHeight = height;
        try { bridge.getHostFrame().setSize(0, height); }
        catch (ignored) { /* Die sichtbare Framehöhe bleibt maßgeblich. */ }
      }
      root.classList.toggle('radio-constrained', constrained);
    } else { root.style.setProperty('--radio-height', '160px'); }
    if (focused && focused !== document.body && !focused.getClientRects().length) {
      dom.el('open-schedule').focus();
    }
  }
  function request() {
    if (scheduled || model.view !== 'radio') { return; }
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; resize(); });
  }
  function start() {
    if (model.view !== 'radio') { return; }
    signals.on('snapshot', request);
    signals.on('radio-layout', request);
    resize();
  }
  return { start: start, resize: resize };
});

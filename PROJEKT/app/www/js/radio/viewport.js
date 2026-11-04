/* Ausschließlich Radio-Geometrie: die Wunschoberfläche besitzt einen eigenen nativen Overlayrahmen. */
MischWerkUI.define('viewport', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var root = document.documentElement;
  var requestedHeight = 0, scheduled = false;
  function resize(initial) {
    if ((!root.classList.contains('mw-ready') && initial !== true) || model.view !== 'radio' || (document.readyState === 'loading' && initial !== true) ||
        !Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function (link) { return !!link.sheet; })) { return; }
    var small = window.innerWidth <= 1350;
    var focused = document.activeElement;
    var constrained = small && window.innerHeight < 360;
    root.classList.toggle('radio-constrained', constrained);
    if (bridge && !bridge.isK3Client()) { root.classList.remove('radio-constrained'); }
    // 40 px Hintergrund für den Glow, unabhängig vom Wiedergabestatus.
    var contentHeight = Math.max(160, Math.ceil(dom.el('radio-panel').getBoundingClientRect().height)) + 40;
    var height = Math.min(500, contentHeight);
    if (bridge && !bridge.isK3Client()) { constrained = small && window.innerHeight + 1 < contentHeight; }
    if (bridge && bridge.isK3Client()) { height = 200; }
    root.style.setProperty('--radio-height', height + 'px');
    if (bridge && !bridge.isK3Client() && height !== requestedHeight) {
      requestedHeight = height;
      try { bridge.getHostFrame().setSize(0, height); }
      catch (ignored) { /* Der kompakte Fallback bleibt im tatsächlichen Rahmen erreichbar. */ }
    }
    root.classList.toggle('radio-constrained', constrained);
    if (focused && focused !== document.body && !focused.getClientRects().length) { dom.el('open-schedule').focus({ preventScroll:true }); }
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
  return { start:start, resize:resize };
});

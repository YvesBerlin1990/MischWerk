/* Native Wunschhöhe nach der Bestätigung aus dem sichtbaren Inhalt ableiten. */
MischWerkUI.define('wishWindow', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom, signals = dependencies.signals;
  var active = false, requested = null, frameRequest = null, observer;
  function fit() {
    frameRequest = null;
    if (!document.documentElement.classList.contains('mw-ready') || document.hidden) { return; }
    var panel = dom.el('wishes-panel');
    if (!panel.getClientRects().length) { return; }
    var own = model.current() && model.current().wishPositions, feedback = dom.el('wish-feedback');
    if ((own && own.available && own.total > 0) || (!feedback.hidden && feedback.classList.contains('success'))) { active = true; }
    if (!active) { return; }
    var width = Math.ceil(window.innerWidth), height = Math.ceil(panel.getBoundingClientRect().height);
    var geometry = width + ':' + height;
    if (width <= 0 || height <= 0 || requested === geometry) { return; }
    requested = geometry;
    try { bridge.getHostFrame().setSize(width, height); }
    catch (error) { /* Bei nicht unterstützter Größenannahme bleiben Inhalte nativ erreichbar. */ }
  }
  function schedule() {
    if (frameRequest === null) { frameRequest = requestAnimationFrame(fit); }
  }
  function start() {
    if (model.view !== 'wishes' || !bridge || !bridge.pageData || bridge.pageData.wishSurface !== true) { return; }
    observer = new ResizeObserver(schedule);
    observer.observe(dom.el('wishes-panel'));
    signals.on('initial-layout', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pagehide', function () {
      observer.disconnect();
      if (frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; }
    });
  }
  return { start:start };
});

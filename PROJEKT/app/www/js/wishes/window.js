/* Native Wunschhöhe vom Öffnen bis zur Bestätigung aus dem sichtbaren Inhalt ableiten. */
MischWerkUI.define('wishWindow', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom, signals = dependencies.signals;
  var requested = null, frameRequest = null, observer, disposed = false;
  function fit() {
    frameRequest = null;
    if (disposed || !model.current() || !document.documentElement.classList.contains('mw-ready') || document.hidden) { return; }
    if (document.fonts && document.fonts.status === 'loading') { return; }
    var panel = dom.el('wishes-panel');
    if (!panel.getClientRects().length) { return; }
    var width = Math.ceil(window.innerWidth), height = Math.min(1000, Math.ceil(panel.getBoundingClientRect().height));
    var geometry = width + ':' + height;
    if (width <= 0 || height <= 0 || requested === geometry) { return; }
    requested = geometry;
    try { bridge.getHostFrame().setSize(width, height); }
    catch (error) { /* Bei nicht unterstützter Größenannahme bleiben Inhalte nativ erreichbar. */ }
  }
  function schedule() {
    if (!disposed && frameRequest === null) { frameRequest = requestAnimationFrame(fit); }
  }
  function start() {
    if (model.view !== 'wishes' || !bridge || !bridge.pageData || bridge.pageData.wishSurface !== true) { return; }
    observer = new ResizeObserver(schedule);
    observer.observe(dom.el('wishes-panel'));
    signals.on('initial-layout', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pagehide', function () {
      disposed = true;
      observer.disconnect();
      if (frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; }
    });
  }
  return { start:start };
});

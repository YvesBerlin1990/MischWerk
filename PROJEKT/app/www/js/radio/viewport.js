/* Ausschließlich Radio-Geometrie: die Wunschoberfläche besitzt einen eigenen nativen Overlayrahmen. */
MischWerkUI.define('viewport', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var root = document.documentElement;
  var requestedHeight = 0, scheduled = false;
  if (bridge && bridge.isK3Client()) {
    var initialTicker = bridge.pageData && bridge.pageData.ticker;
    requestedHeight = initialTicker && initialTicker.enabled && initialTicker.text ? 220 : 176;
  }
  function resize(initial) {
    if ((!root.classList.contains('mw-ready') && initial !== true) || model.view !== 'radio' || (document.readyState === 'loading' && initial !== true) ||
        !Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function (link) { return !!link.sheet; })) { return; }
    var small = window.innerWidth <= 1350;
    var focused = document.activeElement;
    var constrained = small && window.innerHeight < 360;
    root.classList.toggle('radio-constrained', constrained);
    if (bridge && !bridge.isK3Client()) { root.classList.remove('radio-constrained'); }
    // 16 px Hintergrund für den Glow, unabhängig vom Wiedergabestatus.
    var ticker = dom.el('radio-ticker');
    var tickerHeight = ticker && !ticker.hidden ? Math.ceil(ticker.getBoundingClientRect().height) : 0;
    // Der obere Anschluss nutzt den unteren Appleistenrand; dessen Glowraum liegt unter der Laufzeile.
    var contentHeight = Math.max(160, Math.ceil(dom.el('radio-panel').getBoundingClientRect().height)) + tickerHeight + 16;
    var height = Math.min(500, contentHeight);
    if (bridge && !bridge.isK3Client()) { constrained = small && window.innerHeight + 1 < contentHeight; }
    if (bridge && bridge.isK3Client()) { height = Math.min(500, 176 + tickerHeight); }
    root.style.setProperty('--radio-height', height + 'px');
    if (bridge && height !== requestedHeight) {
      requestedHeight = height;
      try { bridge.getHostFrame().setSize(0, height); }
      catch (ignored) { /* Der kompakte Fallback bleibt im tatsächlichen Rahmen erreichbar. */ }
    }
    root.classList.toggle('radio-constrained', constrained);
    if (focused && focused !== document.body && !focused.getClientRects().length) {
      var target = dom.el('open-wishes').disabled ? dom.el('mute-button') : dom.el('open-wishes');
      target.focus({ preventScroll:true });
      if (target.id === 'mute-button') { target.scrollIntoView({ block:'nearest', inline:'nearest' }); }
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
  return { start:start, resize:resize };
});

/* Natürliche Sendeplanhöhe, native Fensteranpassung und Platzgrenzen des jeweiligen Clients. */
MischWerkUI.define('scheduleWindow', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var pages = dependencies.pages;
  var timer;
  var lastKey = null;
  var requestedHeight = 0;
  var popupLimit = null;
  var revealKey = null;
  function fitWindow(initial) {
    if (document.hidden) { return; }
    if (!document.documentElement.classList.contains('mw-ready') && initial !== true) { return; }
    if (!pages.revision()) { return; }
    var form = dom.el('schedule-form');
    var feedback = dom.el('schedule-feedback');
    var notice = dom.el('notice');
    var key = [window.innerWidth, window.innerHeight, pages.revision(), form.hidden,
      dom.el('schedule-new').hidden, feedback.hidden, feedback.textContent, notice.hidden, notice.textContent].join('|');
    if (key === lastKey && !revealKey) { return; }
    lastKey = key;
    var focused = document.activeElement;
    pages.restore();
    var shell = document.querySelector('.dialog-shell');
    var banner = dom.el('demo-banner');
    var bannerHeight = banner.hidden ? 0 : banner.getBoundingClientRect().height;
    var natural = Math.ceil(shell.getBoundingClientRect().height + bannerHeight);
    var target = natural;
    if (bridge && !bridge.isK3Client()) {
      if (popupLimit === null) {
        var available = window.screen && window.screen.availHeight;
        // Vor dem ersten Resize festhalten; ein Host-Resize darf seine Grenze nicht verkleinern.
        popupLimit = Math.max(260, Math.min(1000, available > window.innerHeight ? available - 80 : window.innerHeight));
      }
      target = Math.max(50, Math.min(natural, popupLimit));
      if (target !== requestedHeight) {
        try { bridge.getHostFrame().setSize(0, target); requestedHeight = target; }
        catch (error) { /* Der aktuelle Viewport bleibt die verlässliche Platzgrenze. */ }
      }
    }
    var usable = Math.min(target, window.innerHeight);
    if (form.hidden && natural > usable + 1) {
      var pager = dom.el('schedule-pagination');
      pager.hidden = false;
      var listHeight = dom.el('schedule-days').getBoundingClientRect().height;
      var surrounding = shell.getBoundingClientRect().height + bannerHeight - listHeight;
      pages.fit(Math.max(1, Math.floor(usable - surrounding - 1)), focused);
    }
    if (revealKey) { pages.reveal(revealKey); revealKey = null; }
    if (focused && document.contains(focused) && focused.getClientRects().length && focused !== document.body) {
      try { focused.focus({ preventScroll: true }); } catch (ignored) { focused.focus(); }
    }
  }
  function request() {
    clearTimeout(timer);
    timer = setTimeout(fitWindow, 40);
  }
  function start() {
    if (model.view !== 'schedule') { return; }
    pages.start();
    signals.on('schedule-content', function (data) { pages.capture(data.week); lastKey = null; request(); });
    signals.on('schedule-layout', function (initial) { if (initial === true) { clearTimeout(timer); fitWindow(true); } else { request(); } });
    signals.on('schedule-reveal', function (key) { revealKey = key; request(); });
    window.addEventListener('resize', request);
    document.addEventListener('visibilitychange', request);
    window.addEventListener('load', request);
    window.addEventListener('pagehide', function () { clearTimeout(timer); });
    request();
  }
  return { start: start };
});

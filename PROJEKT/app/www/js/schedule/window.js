/* Sendeplan im bereits passend geöffneten Rahmen paginieren; keine nachträglichen Hostgrößen. */
MischWerkUI.define('scheduleWindow', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var pages = dependencies.pages;
  var timer;
  var lastKey = null;
  var revealKey = null;
  function fitWindow(initial) {
    if (model.view !== 'schedule' || document.hidden) { return; }
    if (!document.documentElement.classList.contains('mw-ready') && initial !== true) { return; }
    if (!pages.revision()) { return; }
    var form = dom.el('schedule-form');
    var feedback = dom.el('schedule-feedback');
    var notice = dom.el('notice');
    var key = [window.innerWidth, window.innerHeight, pages.revision(), form.hidden,
      dom.el('schedule-new').hidden, feedback.hidden, feedback.textContent, notice.hidden, notice.textContent,
      document.querySelectorAll('.schedule-delete-confirm').length].join('|');
    if (key === lastKey && !revealKey) { return; }
    lastKey = key;
    var focused = document.activeElement;
    pages.restore();
    var shell = document.querySelector('.dialog-shell');
    var banner = dom.el('demo-banner');
    var bannerHeight = banner.hidden ? 0 : banner.getBoundingClientRect().height;
    var natural = Math.ceil(shell.getBoundingClientRect().height + bannerHeight);
    var usable = window.innerHeight;
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
    signals.on('schedule-content', function (data) { pages.capture(data.week, data.fromToday); lastKey = null; request(); });
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

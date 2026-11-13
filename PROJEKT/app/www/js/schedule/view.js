/* Ruhige Tagesliste mit zugeordneten Zeiten und aktueller Programmeinordnung. */
MischWerkUI.define('scheduleView', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, bridge = dependencies.bridge, signals = dependencies.signals, cache = dependencies.cache;
  var current = null, receivedAt = 0, frameRequest = null, requested = null, observer, disposed = false, renderKey = null;
  var list = dom.el('schedule-list');
  function fit() {
    frameRequest = null;
    if (disposed || document.hidden || !bridge || !document.documentElement.classList.contains('mw-ready')) { return; }
    if (document.fonts && document.fonts.status === 'loading') { return; }
    if (!list.children.length && dom.el('schedule-message').hidden && dom.el('schedule-retry').hidden) { return; }
    var shell = document.querySelector('.dialog-shell'), style = getComputedStyle(list);
    var natural = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    Array.from(list.children).forEach(function (row) { natural += row.getBoundingClientRect().height; });
    var width = Math.ceil(innerWidth), height = Math.ceil(shell.getBoundingClientRect().height - list.getBoundingClientRect().height + natural);
    height = Math.max(220, Math.min(600, height));
    var geometry = width + ':' + height;
    if (width < 1 || !Number.isFinite(height) || requested === geometry) { return; }
    requested = geometry;
    if (height === innerHeight) { return; }
    try { bridge.getHostFrame().setSize(width, height); }
    catch (error) { /* Begrenzte oder nicht unterstützte Hosts behalten die native Listen-Scrollfläche. */ }
  }
  function fitSoon() {
    if (!disposed && frameRequest === null) { frameRequest = requestAnimationFrame(fit); }
  }
  function label(date) {
    return new Date(date + 'T12:00:00Z').toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' });
  }
  function date(value, today) {
    dom.setText('schedule-date-label', value ? label(value) : 'Tagesprogramm');
    dom.el('schedule-date-label').dateTime = value || '';
    dom.setText('schedule-date-hint', value && value !== today ? 'Zurück zu heute' : 'Heute');
    fitSoon();
  }
  function message(text, error) {
    var box = dom.el('schedule-message');
    box.textContent = text; box.hidden = !text; box.classList.toggle('error', !!error);
    box.setAttribute('role', error ? 'alert' : 'status');
    dom.el('schedule-retry').hidden = !error;
    fitSoon();
  }
  function clear() { current = null; renderKey = null; list.replaceChildren(); list.scrollTop = 0; }
  function mark() {
    if (!current) { return; }
    var clock = cache.wall(current.serverTime + Math.max(0, Date.now() - receivedAt)) / 60000;
    var active = current.entries.findIndex(function (entry) { return entry.from <= clock && clock < entry.until; });
    Array.from(list.children).forEach(function (row, index) {
      var entry = current.entries[index], text = 'Sendung';
      if (active !== -1) { text = index === active ? 'Jetzt im Programm' : index === active - 1 ? 'Davor' : index === active + 1 ? 'Danach' : index < active ? 'Früher am Tag' : 'Später am Tag'; }
      row.classList.toggle('schedule-current', index === active);
      if (index === active) { if (row.getAttribute('aria-current') !== 'time') { row.setAttribute('aria-current', 'time'); } }
      else if (row.hasAttribute('aria-current')) { row.removeAttribute('aria-current'); }
      var position = row.querySelector('.schedule-position');
      if (position.textContent !== text) { position.textContent = text; }
    });
  }
  function render(data, initial, scroll) {
    var key = JSON.stringify([data.date,data.entries]);
    if (key === renderKey) {
      current = data; receivedAt = Date.now(); date(data.date,data.today);
      if (typeof scroll === 'number') { list.scrollTop = scroll; }
      message(data.entries.length ? '' : 'Für diesen Tag sind keine Sendungen vorhanden.',false); mark(); return;
    }
    renderKey = key;
    var previousScroll = typeof scroll === 'number' ? scroll : list.scrollTop;
    var anchor = Array.from(list.children).find(function (row) { return row.offsetTop + row.offsetHeight > list.offsetTop + list.scrollTop; });
    var from = anchor && anchor.dataset.from, offset = anchor ? anchor.offsetTop - list.offsetTop - list.scrollTop : 0;
    current = data; receivedAt = Date.now(); list.replaceChildren();
    data.entries.forEach(function (entry) {
      var row = dom.element('li', 'schedule-show'); row.dataset.from = String(entry.from);
      var top = dom.element('div', 'schedule-show-top');
      top.appendChild(dom.element('span', 'schedule-position'));
      var hours = dom.element('time', 'schedule-hours', entry.allDay ? 'Ganztägig' : entry.start + ' – ' + entry.end + ' Uhr');
      hours.dateTime = data.date + 'T' + entry.start; top.appendChild(hours); row.appendChild(top);
      row.appendChild(dom.element('h2', 'schedule-topic', entry.topic));
      row.appendChild(dom.element('div', 'schedule-presenter', entry.nick));
      list.appendChild(row);
    });
    date(data.date, data.today); message(data.entries.length ? '' : 'Für diesen Tag sind keine Sendungen vorhanden.', false); mark();
    var restored = from && Array.from(list.children).find(function (row) { return row.dataset.from === from; });
    list.scrollTop = restored && !initial ? restored.offsetTop - list.offsetTop - offset : previousScroll;
    if (initial && typeof scroll !== 'number' && list.scrollHeight > list.clientHeight) {
      var active = list.querySelector('.schedule-current');
      if (active) { var target = active.previousElementSibling || active; list.scrollTop = target.offsetTop - list.offsetTop; }
    }
  }
  function start() {
    signals.on('initial-layout', fitSoon);
    window.addEventListener('resize', fitSoon);
    document.addEventListener('visibilitychange', fitSoon);
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(fitSoon);
      document.querySelectorAll('.dialog-header,#dialog-notice-slot,.schedule-day-nav,#schedule-message').forEach(function (node) { observer.observe(node); });
    }
    window.addEventListener('pagehide', function () {
      disposed = true;
      if (observer) { observer.disconnect(); }
      if (frameRequest !== null) { cancelAnimationFrame(frameRequest); }
    });
  }
  return { render:render, clear:clear, date:date, message:message, mark:mark, start:start };
});

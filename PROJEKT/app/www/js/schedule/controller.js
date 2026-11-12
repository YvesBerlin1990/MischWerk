/* Ein Tagesabruf mit Paket-/Datumsprüfung; Aktualisierung über den vorhandenen Lifecycle. */
MischWerkUI.define('schedule', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var commands = dependencies.commands, signals = dependencies.signals, view = dependencies.view;
  var selected = '', following = true, data = null, pending = null, batch = null;
  var timer, lastRead = 0, disposed = false, refreshAgain = false, restoreScroll = null;
  function validDate(value) { return typeof value === 'string' && /^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value); }
  function controls() {
    var disabled = !model.connected() || disposed;
    dom.el('schedule-previous').disabled = disabled || !data || !data.previous;
    dom.el('schedule-next').disabled = disabled || !data || !data.next;
    dom.el('schedule-today').disabled = disabled;
    dom.el('schedule-retry').disabled = disabled || !!pending;
    dom.el('schedule-list').setAttribute('aria-busy', String(!!pending));
    view.mark();
    if (pending && Date.now() - lastRead >= 15000) { fail('Keine Antwort erhalten. Bitte erneut laden.'); }
  }
  function fail(message) {
    clearTimeout(timer); pending = null; batch = null; refreshAgain = false;
    view.message(message, true); controls();
  }
  function packet(page) {
    clearTimeout(timer);
    pending = { id:commands.nextId('day'), page:page }; lastRead = Date.now();
    timer = setTimeout(function () { fail('Keine Antwort erhalten. Bitte erneut laden.'); }, 15000);
    try { bridge.sendEvent('mw:schedule.day', { requestId:pending.id, date:following ? '' : selected, page:page }); }
    catch (error) { fail('Die Verbindung antwortet nicht. Bitte erneut laden.'); }
    controls();
  }
  function read(force) {
    if (disposed || document.hidden || !bridge || !model.connected()) { return; }
    if (pending) { if (force) { refreshAgain = true; } return; }
    batch = { entries:[], signature:null, restarts:0 };
    if (!data) { view.message('Programm wird geladen …', false); }
    packet(0);
  }
  function receive(event) {
    var value = event.data;
    if (disposed || !pending || !value || value.requestId !== pending.id) { return; }
    if (value.source !== 'homepage' || !validDate(value.date) || !validDate(value.today) ||
        (!following && value.date !== selected) || (following && value.date !== value.today) ||
        !Array.isArray(value.entries) || !Number.isInteger(value.page) || !Number.isInteger(value.pages) ||
        value.pages < 1 || typeof value.signature !== 'string' || !Number.isFinite(value.clock)) { fail('Ungültige Programmdaten. Bitte erneut laden.'); return; }
    if (value.page !== pending.page || (batch.signature !== null && batch.signature !== value.signature)) {
      if (++batch.restarts > 2) { fail('Das Programm wird gerade geändert. Bitte erneut laden.'); return; }
      batch.entries = []; batch.signature = null; packet(0); return;
    }
    if (value.entries.some(function (entry) { return !entry || typeof entry.topic !== 'string' || typeof entry.nick !== 'string' ||
      !Number.isFinite(entry.from) || !Number.isFinite(entry.until) || entry.until <= entry.from ||
      typeof entry.start !== 'string' || typeof entry.end !== 'string'; })) { fail('Ungültige Programmdaten. Bitte erneut laden.'); return; }
    batch.signature = value.signature; batch.entries = batch.entries.concat(value.entries);
    if (value.page + 1 < value.pages) { packet(value.page + 1); return; }
    clearTimeout(timer); pending = null;
    var initial = !data || data.date !== value.date;
    value.entries = batch.entries; batch = null; data = value; selected = value.date;
    view.render(value, initial, restoreScroll); restoreScroll = null; controls();
    if (refreshAgain) { refreshAgain = false; read(false); }
  }
  function select(date, follow) {
    var today = data && data.today;
    clearTimeout(timer); pending = null; batch = null; refreshAgain = false;
    if (date !== selected) { data = null; view.clear(); restoreScroll = null; }
    selected = date; following = follow; view.date(date, today);
    read(false);
  }
  function restore(state) {
    var saved = state && state.scheduleDay;
    if (!saved || !validDate(saved.date)) { return; }
    if (selected === saved.date && following === (saved.followToday !== false)) { return; }
    select(saved.date, saved.followToday !== false);
    restoreScroll = Number.isFinite(saved.scroll) ? Math.max(0,saved.scroll) : null;
  }
  function start() {
    restore(bridge && bridge.pageData && bridge.pageData.overlayState);
    dom.el('schedule-previous').addEventListener('click',function () { if (data && data.previous) { select(data.previous,false); } });
    dom.el('schedule-next').addEventListener('click',function () { if (data && data.next) { select(data.next,false); } });
    dom.el('schedule-today').addEventListener('click',function () { select('',true); });
    dom.el('schedule-retry').addEventListener('click',function () { read(true); });
    if (bridge) {
      bridge.addEventListener('mw:schedule.data',receive);
      bridge.addEventListener('mw:schedule.result',function (event) { if (pending && event.data.requestId === pending.id && event.data.ok === false) { fail(event.data.message || 'Das Programm konnte nicht geladen werden.'); } });
      bridge.addEventListener('mw:schedule.changed',function () { read(true); });
    }
    signals.on('snapshot',function () { if (!pending && (!data || Date.now() - lastRead >= 18000)) { read(false); } controls(); });
    signals.on('controls',controls);
    signals.on('overlay-restore',restore);
    signals.on('overlay-capture',function (state) { state.scheduleDay = {date:selected,followToday:following,scroll:dom.el('schedule-list').scrollTop}; });
    document.addEventListener('visibilitychange',function () { if (document.hidden) { clearTimeout(timer); pending = null; batch = null; } else { read(true); } });
    window.addEventListener('pagehide',function () { disposed = true; clearTimeout(timer); pending = null; batch = null; });
  }
  return {start:start};
});

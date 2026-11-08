/* Sendeplan-Protokoll, zugeordnete Antworten und dauerhafter Besitzerentwurf. */
MischWerkUI.define('schedule', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var view = dependencies.view;
  var editor = dependencies.editor;
  var data = null;
  var batch = null;
  var reading = null;
  var mutation = null;
  var readTimer;
  var mutationTimer;
  var selectedWeek = null;
  var savedEntry = null;
  function feedback(message, error) {
    var box = dom.el('schedule-feedback');
    box.textContent = message;
    box.hidden = !message;
    box.classList.toggle('error', !!error);
    box.setAttribute('role', error ? 'alert' : 'status');
  }
  function availability() {
    if (model.view !== 'schedule') { return; }
    if (!canManage() && (selectedWeek || data && data.canManage)) {
      selectedWeek = null; data = null; batch = null;
      clearTimeout(readTimer); reading = null;
      clearTimeout(mutationTimer); mutation = null; savedEntry = null;
      feedback('');
      view.clear(); signals.emit('schedule-access-lost');
    }
    view.availability({ live: model.connected(), owner: !!(data && data.canManage && canManage()),
      reading: !!reading, mutation: !!mutation, loaded: !!data, editorOpen: editor.isOpen(),
      ready: !!data && editor.ready(data.week) });
  }
  function canManage() {
    return !!model.current() && model.current().user.canManageRadioModerators === true;
  }
  function load(week, page, range) {
    if (model.view !== 'schedule' || !bridge || !model.connected() || document.hidden) { return; }
    page = page || 0;
    if (range === undefined) { range = !week; }
    if (!page) { batch = null; }
    clearTimeout(readTimer);
    var requestId = commands.nextId('schedule-read');
    reading = { requestId: requestId, week: week, page: page, range: range };
    readTimer = setTimeout(function () {
      if (!reading || reading.requestId !== requestId) { return; }
      reading = null;
      feedback('Der Sendeplan antwortet noch nicht. Bitte aktualisieren.', true);
      availability();
    }, 15000);
    availability();
    try { bridge.sendEvent('mw:schedule.get', { requestId: requestId, week: week, page: page, range: range }); }
    catch (error) { clearTimeout(readTimer); reading = null; feedback('Sendeplan nicht erreichbar. Bitte erneut öffnen.', true); availability(); }
  }
  function reload() {
    if (editor.isOpen() && data && !editor.ready(data.week)) { feedback('Sendeplan wird geladen …'); }
    load(selectedWeek || undefined);
  }
  function receive(event) {
    var response = event.data;
    if (!reading || !response || response.requestId !== reading.requestId ||
        (!reading.range && reading.week && response.week !== reading.week) || (response.range === true) !== reading.range ||
        !Array.isArray(response.entries) || !Array.isArray(response.days) || response.days.length !== (reading.range ? 14 : 7)) { return; }
    var range = reading.range;
    if (response.page !== reading.page || response.canManage && !canManage()) { reload(); return; }
    clearTimeout(readTimer);
    reading = null;
    if (!response.page) { batch = { week: response.week, today: response.today, revision: response.revision, canManage: response.canManage,
      previousRevision: response.previousRevision, boundaryRevision: response.boundaryRevision, entries: [] }; }
    if (!batch || batch.week !== response.week || batch.today !== response.today || batch.revision !== response.revision || batch.canManage !== response.canManage ||
        batch.previousRevision !== response.previousRevision || batch.boundaryRevision !== response.boundaryRevision) { reload(); return; }
    batch.entries = batch.entries.concat(response.entries);
    if (response.page < response.pages - 1) { load(response.week, response.page + 1, range); return; }
    response.entries = batch.entries;
    data = response;
    batch = null;
    editor.bindWeek(data);
    view.render(data);
    if (savedEntry) {
      var entry = data.entries.filter(function (item) {
        return item.week === savedEntry.week && (savedEntry.id ? item.id === savedEntry.id :
          item.date === savedEntry.date && item.start === savedEntry.start && item.end === savedEntry.end);
      })[0];
      if (entry) { signals.emit('schedule-reveal', entry.week + ':' + entry.id + ':' + entry.date); }
      savedEntry = null;
    }
    if (dom.el('schedule-feedback').textContent === 'Sendeplan wird geladen …') { feedback(''); }
    availability();
  }
  function submit(action) {
    if (!data || !data.canManage || !canManage() || !model.connected() || mutation) { return; }
    if (action.type === 'mw:schedule.save' && (reading || !editor.ready(data.week))) { return; }
    var requestId = commands.nextId('schedule-write');
    action.data.requestId = requestId;
    mutation = requestId;
    savedEntry = action.type === 'mw:schedule.save' ? {
      week: action.data.week, id: action.data.id, date: action.data.date, start: action.data.start, end: action.data.end
    } : null;
    feedback('Wird gespeichert …');
    availability();
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(function () {
      if (mutation !== requestId) { return; }
      mutation = null; savedEntry = null;
      feedback('Speichern noch nicht bestätigt. Bitte den Wochenplan prüfen.', true);
      availability();
      reload();
    }, 15000);
    try { bridge.sendEvent(action.type, action.data); }
    catch (error) {
      clearTimeout(mutationTimer); mutation = null; savedEntry = null;
      feedback('Speichern nicht bestätigt. Dein Entwurf bleibt erhalten.', true);
      availability();
    }
  }
  function result(event) {
    var response = event.data || {};
    if (reading && response.requestId === reading.requestId) {
      clearTimeout(readTimer); reading = null;
      feedback(response.message, true); availability(); return;
    }
    if (!mutation || response.requestId !== mutation) { return; }
    clearTimeout(mutationTimer); mutation = null;
    if (response.ok) { editor.close(); }
    else { savedEntry = null; }
    feedback(response.message, !response.ok);
    availability();
    reload();
  }
  function start() {
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'schedule') { return; } state.scheduleWeek = selectedWeek; state.busy = !!mutation; });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'schedule') { return; }
      if (canManage() && typeof state.scheduleWeek === 'string' && calendar.week(state.scheduleWeek)) { selectedWeek = state.scheduleWeek; reload(); }
    });
    if (model.view !== 'schedule' || !bridge) { return; }
    bridge.addEventListener('mw:schedule.data', receive);
    bridge.addEventListener('mw:schedule.result', result);
    bridge.addEventListener('mw:schedule.changed', function () { if (!mutation && !reading) { reload(); } });
    signals.on('snapshot', function () { availability(); if (!reading && !mutation) { reload(); } });
    signals.on('schedule-editor-state', function () {
      if (editor.isOpen() && data && selectedWeek === null) { selectedWeek = data.week; }
      availability();
    });
    signals.on('schedule-select-week', function (week) {
      if (!editor.isOpen() || mutation) { return; }
      selectedWeek = week;
      if (reading && reading.week === week) { return; }
      if (data && data.week === week && !reading) { availability(); return; }
      feedback('Sendeplan wird geladen …');
      load(week);
    });
    signals.on('schedule-submit', submit);
    dom.el('schedule-new').addEventListener('click', function () { if (data) { feedback(''); editor.open(data); } });
    dom.el('schedule-refresh').addEventListener('click', reload);
    dom.el('schedule-current').addEventListener('click', function () {
      selectedWeek = null; signals.emit('schedule-reveal', data && data.today); reload();
    });
    ['schedule-previous', 'schedule-next'].forEach(function (id, index) {
      dom.el(id).addEventListener('click', function () {
        if (!data || !data.canManage || editor.isOpen()) { return; }
        selectedWeek = calendar.shift(data.week, index ? 7 : -7);
        reload();
      });
    });
    window.addEventListener('pagehide', function () {
      clearTimeout(readTimer); clearTimeout(mutationTimer); reading = null; mutation = null;
    });
  }
  return { start: start, availability: availability };
});

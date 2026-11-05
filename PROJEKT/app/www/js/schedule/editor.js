/* Besitzerentwurf und dessen feste Wochenrevision; Pushmeldungen überschreiben keine Eingabe. */
MischWerkUI.define('scheduleEditor', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var model = dependencies.model;
  var signals = dependencies.signals;
  var draft = null;
  var liveNick = '';
  var fieldIds = ['schedule-date','schedule-nick','schedule-start','schedule-end','schedule-topic','schedule-kind','schedule-timing'];
  function options() {
    var automatic = dom.el('schedule-kind').value === 'autodj';
    var nick = dom.el('schedule-nick'), timing = dom.el('schedule-timing').value;
    if (automatic && !nick.readOnly) { liveNick = nick.value; }
    if (automatic) {
      nick.value = 'MischWerk';
      if (!dom.el('schedule-topic').value) { dom.el('schedule-topic').value = 'MischWerk am Pult'; }
    } else if (nick.readOnly) { nick.value = liveNick; }
    nick.readOnly = automatic;
    [{ field: dom.el('schedule-start-field'), input: dom.el('schedule-start'), hidden: timing === 'allDay' },
      { field: dom.el('schedule-end-field'), input: dom.el('schedule-end'), hidden: timing !== 'fixed' }].forEach(function (control) {
      control.field.hidden = control.hidden;
      control.input.disabled = control.hidden;
      control.input.required = !control.hidden;
    });
    dom.setText('schedule-timing-hint', timing === 'allDay' ? 'Ganztags: 00:00 bis 00:00 am Folgetag.' :
      timing === 'openEnd' ? 'Open End: ohne feste Endzeit, bis zur nächsten geplanten Sendung.' :
      'Ein Ende vor dem Beginn liegt am Folgetag. Live: Channelinhaber oder Radio-Team.');
  }
  function close() {
    draft = null;
    dom.el('schedule-form').hidden = true;
    dom.el('schedule-days').hidden = false;
    signals.emit('schedule-editor-state');
  }
  function open(data, entry) {
    if (!data || !data.canManage || !model.current() || !model.current().user.canManageRadioModerators) { return; }
    draft = { week: data.week, expectedRevision: data.revision, id: entry ? entry.id : 0 };
    dom.el('schedule-form').reset();
    dom.el('schedule-nick').readOnly = false;
    liveNick = model.current().user.nick;
    if (entry) {
      dom.el('schedule-date').min = data.week;
      dom.el('schedule-date').max = calendar.shift(data.week, 6);
    } else {
      dom.el('schedule-date').removeAttribute('min');
      dom.el('schedule-date').removeAttribute('max');
    }
    dom.el('schedule-date').value = entry ? entry.date : data.days.indexOf(data.today) !== -1 ? data.today : data.week;
    dom.el('schedule-nick').value = entry ? entry.nick : model.current().user.nick;
    dom.el('schedule-start').value = entry && entry.timing !== 'allDay' ? entry.start : '19:00';
    dom.el('schedule-end').value = entry && entry.end && entry.timing !== 'allDay' ? entry.end : '21:00';
    dom.el('schedule-topic').value = entry ? entry.topic : '';
    dom.el('schedule-kind').value = entry && entry.kind || 'live';
    dom.el('schedule-timing').value = entry && entry.timing || 'fixed';
    if (dom.el('schedule-kind').value === 'autodj') { dom.el('schedule-nick').readOnly = true; }
    options();
    dom.setText('schedule-editor-title', entry ? 'Sendung bearbeiten' : 'Sendung eintragen');
    dom.el('schedule-delete').hidden = !entry;
    dom.el('schedule-form').hidden = false;
    dom.el('schedule-days').hidden = true;
    signals.emit('schedule-editor-state');
    dom.el('schedule-date').focus();
  }
  function bindWeek(data) {
    if (draft && !draft.id && data.canManage && data.week !== draft.week &&
        calendar.week(dom.el('schedule-date').value) === data.week) {
      draft.week = data.week;
      draft.expectedRevision = data.revision;
    }
  }
  function ready(week) {
    return !!draft && draft.week === week && calendar.week(dom.el('schedule-date').value) === draft.week;
  }
  function start() {
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'schedule') { return; }
      if (!draft) { return; }
      state.scheduleEditor = { draft:JSON.parse(JSON.stringify(draft)), fields:{}, liveNick:liveNick };
      fieldIds.forEach(function (id) { state.scheduleEditor.fields[id] = dom.el(id).value; });
    });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'schedule') { return; }
      var saved = state.scheduleEditor;
      if (!saved || !saved.draft || !saved.fields || !model.current().user.canManageRadioModerators ||
          !calendar.week(saved.draft.week) || !Number.isInteger(saved.draft.expectedRevision)) { return; }
      draft = { week:saved.draft.week, expectedRevision:saved.draft.expectedRevision, id:Number(saved.draft.id) || 0 };
      dom.el('schedule-nick').readOnly = false;
      fieldIds.forEach(function (id) { if (typeof saved.fields[id] === 'string') { dom.el(id).value = saved.fields[id].slice(0,100); } });
      if (!dom.el('schedule-kind').value) { dom.el('schedule-kind').value = 'live'; }
      if (!dom.el('schedule-timing').value) { dom.el('schedule-timing').value = 'fixed'; }
      options();
      liveNick = typeof saved.liveNick === 'string' ? saved.liveNick.slice(0,50) : model.current().user.nick;
      if (draft.id) { dom.el('schedule-date').min = draft.week; dom.el('schedule-date').max = calendar.shift(draft.week,6); }
      else { dom.el('schedule-date').removeAttribute('min'); dom.el('schedule-date').removeAttribute('max'); }
      dom.setText('schedule-editor-title', draft.id ? 'Sendung bearbeiten' : 'Sendung eintragen');
      dom.el('schedule-delete').hidden = !draft.id; dom.el('schedule-form').hidden = false; dom.el('schedule-days').hidden = true;
      signals.emit('schedule-editor-state');
    });
    signals.on('schedule-access-lost', function () {
      if (draft) { close(); }
      liveNick = '';
      dom.el('schedule-form').reset();
    });
    signals.on('schedule-edit', function (event) { open(event.data, event.entry); });
    ['schedule-kind', 'schedule-timing'].forEach(function (id) {
      dom.el(id).addEventListener('change', function () { options(); signals.emit('schedule-editor-state'); });
    });
    dom.el('schedule-cancel').addEventListener('click', close);
    dom.el('schedule-date').addEventListener('input', function () {
      if (!draft) { return; }
      var week = calendar.week(this.value);
      if (!draft.id && week) { signals.emit('schedule-select-week', week); }
      signals.emit('schedule-editor-state');
    });
    dom.el('schedule-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!draft || !ready(draft.week) || dom.el('schedule-save').disabled ||
          dom.el('schedule-fields').disabled || !this.reportValidity()) { return; }
      var timing = dom.el('schedule-timing').value;
      signals.emit('schedule-submit', { type: 'mw:schedule.save', data: {
        week: draft.week, id: draft.id || undefined, expectedRevision: draft.expectedRevision,
        date: dom.el('schedule-date').value, kind: dom.el('schedule-kind').value, timing: timing,
        start: timing === 'allDay' ? '00:00' : dom.el('schedule-start').value,
        end: timing === 'allDay' ? '00:00' : timing === 'openEnd' ? '' : dom.el('schedule-end').value,
        nick: dom.el('schedule-nick').value, topic: dom.el('schedule-topic').value
      } });
    });
    dom.el('schedule-delete').addEventListener('click', function () {
      if (!draft || !draft.id || dom.el('schedule-fields').disabled) { return; }
      signals.emit('schedule-submit', { type: 'mw:schedule.delete', data: {
        week: draft.week, id: draft.id, expectedRevision: draft.expectedRevision
      } });
    });
  }
  return { start: start, open: open, close: close, bindWeek: bindWeek, ready: ready,
    isOpen: function () { return !!draft; } };
});

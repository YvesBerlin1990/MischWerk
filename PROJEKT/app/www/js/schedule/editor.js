/* Besitzerentwurf und dessen feste Wochenrevision; Pushmeldungen überschreiben keine Eingabe. */
MischWerkUI.define('scheduleEditor', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var model = dependencies.model;
  var signals = dependencies.signals;
  var draft = null;
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
    if (entry) {
      dom.el('schedule-date').min = data.week;
      dom.el('schedule-date').max = calendar.shift(data.week, 6);
    } else {
      dom.el('schedule-date').removeAttribute('min');
      dom.el('schedule-date').removeAttribute('max');
    }
    dom.el('schedule-date').value = entry ? entry.date : data.days.indexOf(data.today) !== -1 ? data.today : data.week;
    dom.el('schedule-nick').value = entry ? entry.nick : model.current().user.nick;
    dom.el('schedule-start').value = entry ? entry.start : '19:00';
    dom.el('schedule-end').value = entry ? entry.end : '21:00';
    dom.el('schedule-topic').value = entry ? entry.topic : '';
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
    signals.on('schedule-edit', function (event) { open(event.data, event.entry); });
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
      signals.emit('schedule-submit', { type: 'mw:schedule.save', data: {
        week: draft.week, id: draft.id || undefined, expectedRevision: draft.expectedRevision,
        date: dom.el('schedule-date').value, start: dom.el('schedule-start').value, end: dom.el('schedule-end').value,
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

/* Datierte Vorschau ab heute; Wochenansichten bleiben für die Verwaltung erhalten. */
MischWerkUI.define('scheduleView', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var signals = dependencies.signals;
  var rendered = null;
  function availability(state) {
    var live = state.live, owner = state.owner, busy = state.reading || state.mutation;
    ['schedule-previous', 'schedule-next', 'schedule-current'].forEach(function (id) {
      dom.el(id).disabled = !live || busy || state.editorOpen || !state.loaded;
      if (id !== 'schedule-current') { dom.el(id).hidden = !owner; }
    });
    dom.el('schedule-refresh').disabled = busy;
    dom.el('schedule-new').hidden = !owner || state.editorOpen;
    dom.el('schedule-new').disabled = !live || busy;
    dom.el('schedule-fields').disabled = !owner || !live || state.mutation;
    dom.el('schedule-save').disabled = !owner || !live || busy || !state.ready;
    dom.el('schedule-form').hidden = !owner || !state.editorOpen;
    dom.el('schedule-days').hidden = owner && state.editorOpen;
    var message = dom.el('schedule-feedback');
    if (owner && state.editorOpen) { dom.el('schedule-form').appendChild(message); }
    else { dom.el('schedule-calendar').insertBefore(message, dom.el('schedule-days')); }
    dom.el('schedule-save').setAttribute('aria-busy', String(state.mutation));
    dom.el('schedule-refresh').setAttribute('aria-busy', String(state.reading));
    if (state.editorOpen) { dom.el('schedule-pagination').hidden = true; }
    document.querySelectorAll('.schedule-owner-action').forEach(function (button) {
      button.closest('.schedule-owner-controls').hidden = !owner;
      button.disabled = !live || busy || button.dataset.scheduleLocked === 'true';
    });
    signals.emit('schedule-layout');
  }
  function clear() {
    var focused = document.activeElement;
    var privateFocus = focused && (dom.el('schedule-form').contains(focused) || focused.closest('.schedule-owner-controls'));
    rendered = null; dom.el('schedule-days').textContent = ''; dom.el('schedule-days').hidden = false;
    dom.setText('schedule-summary', 'Sendeplan wird geladen …');
    signals.emit('schedule-content', { week: null });
    if (privateFocus) { var list = dom.el('schedule-days'); list.tabIndex = -1; list.focus({ preventScroll: true }); }
  }
  function ownerControls(data, entry) {
    var actions = dom.element('div', 'schedule-owner-controls'), edit = null;
    if (entry.shortBroadcast) {
      actions.appendChild(dom.element('p', 'schedule-broadcast', 'Unter 5 Minuten · privat'));
    }
    if (!entry.automatic && (!entry.actualStart || entry.actualEnd)) {
      edit = dom.element('button', 'secondary-button schedule-edit schedule-owner-action', 'Bearbeiten');
      edit.type = 'button';
      edit.setAttribute('aria-label', 'Sendung von ' + entry.nick + ' am ' + calendar.label(entry.date) + ' bearbeiten');
      edit.addEventListener('click', function () { signals.emit('schedule-edit', { data: data, entry: entry }); });
      actions.appendChild(edit);
    }
    var remove = dom.element('button', 'text-button schedule-remove schedule-owner-action', 'Entfernen');
    remove.type = 'button';
    remove.dataset.scheduleLocked = String(!!entry.actualStart && !entry.actualEnd);
    remove.disabled = remove.dataset.scheduleLocked === 'true';
    remove.title = remove.disabled ? 'Bitte die laufende Moderation zuerst abmelden.' : 'Nur diesen Sendeplaneintrag entfernen';
    remove.setAttribute('aria-label', 'Sendeplaneintrag von ' + entry.nick + ' am ' + calendar.label(entry.date) + ' entfernen');
    remove.addEventListener('click', function () {
      if (remove.disabled) { return; }
      if (edit) { edit.hidden = true; } remove.hidden = true;
      var prompt = dom.element('span', 'schedule-remove-prompt', 'Eintrag entfernen?');
      var confirm = dom.element('button', 'text-button schedule-delete-confirm schedule-owner-action', 'Entfernen');
      var cancel = dom.element('button', 'secondary-button schedule-delete-cancel schedule-owner-action', 'Abbrechen');
      confirm.type = cancel.type = 'button';
      confirm.addEventListener('click', function () {
        if (confirm.disabled) { return; }
        signals.emit('schedule-submit', { type:'mw:schedule.delete', data:{ week:data.week, id:entry.id, expectedRevision:data.revision } });
        var list = dom.el('schedule-days'); list.tabIndex = -1; list.focus({ preventScroll:true });
      });
      cancel.addEventListener('click', function () {
        actions.removeChild(prompt); actions.removeChild(confirm); actions.removeChild(cancel);
        if (edit) { edit.hidden = false; } remove.hidden = false; remove.focus();
        signals.emit('schedule-layout');
      });
      actions.appendChild(prompt); actions.appendChild(confirm); actions.appendChild(cancel); cancel.focus();
      signals.emit('schedule-layout');
    });
    actions.appendChild(remove);
    return actions;
  }
  function render(data) {
    var key = JSON.stringify([data.days, data.today, data.revision, data.weeks, data.canManage, data.entries]);
    if (key === rendered) { return; }
    rendered = key;
    dom.setText('schedule-range', calendar.range(data.days[0], data.days.length));
    dom.setText('schedule-period', data.range ? 'Ab heute · nächste 14 Tage' : 'Montag bis Sonntag');
    dom.setText('schedule-summary', data.entries.length ?
      'Sendungen und Musik ' + (data.range ? 'für die nächsten 14 Tage' : 'in dieser Woche') : '');
    dom.el('schedule-summary').hidden = !data.entries.length;
    var list = dom.el('schedule-days');
    list.textContent = '';
    data.days.forEach(function (day) {
      var section = dom.element('section', 'schedule-day');
      section.dataset.scheduleDate = day;
      if (day === data.today) { section.classList.add('is-today'); }
      var heading = dom.element('h2', 'schedule-day-label');
      var number = dom.element('span', 'schedule-day-number', day.slice(8));
      number.setAttribute('aria-hidden', 'true'); heading.appendChild(number);
      var date = dom.element('span', 'schedule-day-heading');
      date.appendChild(dom.element('span', 'schedule-day-name', calendar.day(day).split(',')[0] + ', '));
      var fullDate = dom.element('time', 'schedule-day-date', calendar.label(day));
      fullDate.dateTime = day; date.appendChild(fullDate); heading.appendChild(date);
      if (day === data.today || day === calendar.shift(data.today, 1)) {
        heading.appendChild(dom.element('span', 'schedule-today', day === data.today ? 'Heute' : 'Morgen'));
      }
      section.appendChild(heading);
      var slots = calendar.slots(data.entries, day);
      var hasShows = slots.some(function (slot) { return !!slot.entry; });
      section.classList.add(hasShows ? 'has-shows' : 'is-empty');
      if (!hasShows) { section.appendChild(dom.element('p', 'schedule-empty', 'Ganztags · Musikmix von MischWerk')); }
      slots.forEach(function (slot, index) {
        if (!hasShows) { return; }
        var entry = slot.entry;
        if (!entry) {
          var gap = calendar.gapTime(slots, index);
          if (gap) {
            var music = dom.element('p', 'schedule-autodj-gap');
            music.appendChild(dom.element('span', 'schedule-gap-time', gap));
            music.appendChild(document.createTextNode(' '));
            music.appendChild(dom.element('span', 'schedule-gap-copy', 'Musikmix von MischWerk'));
            section.appendChild(music);
          }
          return;
        }
        var row = dom.element('article', 'schedule-show');
        row.dataset.scheduleKey = entry.week + ':' + entry.id + ':' + day;
        var copy = dom.element('div', 'schedule-show-copy');
        copy.appendChild(dom.element('strong', 'schedule-time', calendar.entryTime(entry, day)));
        copy.appendChild(dom.element('h3', 'schedule-topic', entry.topic || (entry.kind === 'autodj' ? 'Musikmix von MischWerk' : 'MischWerk Radio Show')));
        copy.appendChild(dom.element('span', 'schedule-presenter', entry.kind === 'autodj' ? 'Radio MischWerk' : 'Mit ' + entry.nick));
        row.appendChild(copy);
        var sourceWeek = (data.weeks || []).filter(function (item) { return item.week === entry.week; })[0];
        if (data.canManage && (entry.week === data.week || sourceWeek)) {
          var selected = sourceWeek ? Object.assign({}, data, { week: sourceWeek.week, revision: sourceWeek.revision }) : data;
          row.appendChild(ownerControls(selected, entry));
        }
        section.appendChild(row);
      });
      list.appendChild(section);
    });
    signals.emit('schedule-content', { week: data.range ? data.today : data.week, fromToday: data.range === true });
  }
  return { render: render, availability: availability, clear: clear };
});

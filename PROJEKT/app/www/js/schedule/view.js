/* Wochenübersicht: sieben datierte Tage und die vollständig nachgeladenen Sendungen. */
MischWerkUI.define('scheduleView', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var signals = dependencies.signals;
  var rendered = null;
  function render(data) {
    var key = JSON.stringify([data.week, data.today, data.revision, data.canManage, data.entries]);
    if (key === rendered) { return; }
    rendered = key;
    dom.setText('schedule-range', calendar.range(data.week));
    dom.setText('schedule-summary', data.entries.length ?
      data.entries.length + (data.entries.length === 1 ? ' Sendung in dieser Woche' : ' Sendungen in dieser Woche') :
      'Noch keine Sendungen eingetragen.');
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
      if (day === data.today) { heading.appendChild(dom.element('span', 'schedule-today', 'Heute')); }
      section.appendChild(heading);
      var entries = data.entries.filter(function (entry) {
        return entry.date === day || (entry.end < entry.start && entry.end !== '00:00' && calendar.shift(entry.date, 1) === day);
      });
      section.classList.add(entries.length ? 'has-shows' : 'is-empty');
      if (!entries.length) { section.appendChild(dom.element('p', 'schedule-empty', 'Keine Sendung eingetragen')); }
      entries.forEach(function (entry) {
        var row = dom.element('article', 'schedule-show');
        row.dataset.scheduleKey = entry.week + ':' + entry.id + ':' + day;
        var continued = entry.date !== day;
        var time = continued ? '00:00 – ' + entry.end + ' Uhr · vom Vortag' :
          entry.start + ' – ' + entry.end + ' Uhr' + (entry.end < entry.start ? ' · Ende am Folgetag' : '');
        var copy = dom.element('div', 'schedule-show-copy');
        copy.appendChild(dom.element('strong', 'schedule-time', time));
        copy.appendChild(dom.element('span', 'schedule-presenter', 'Mit ' + entry.nick));
        copy.appendChild(dom.element('p', 'schedule-topic', entry.topic));
        row.appendChild(copy);
        if (data.canManage && entry.week === data.week) {
          var edit = dom.element('button', 'secondary-button schedule-edit', 'Bearbeiten');
          edit.type = 'button';
          edit.setAttribute('aria-label', 'Sendung von ' + entry.nick + ' am ' + calendar.label(entry.date) + ' bearbeiten');
          edit.addEventListener('click', function () { signals.emit('schedule-edit', { data: data, entry: entry }); });
          row.appendChild(edit);
        }
        section.appendChild(row);
      });
      list.appendChild(section);
    });
    signals.emit('schedule-content', { week: data.week });
  }
  return { render: render };
});

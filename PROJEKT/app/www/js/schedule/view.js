/* Wochenübersicht: sieben datierte Tage und die vollständig nachgeladenen Sendungen. */
MischWerkUI.define('scheduleView', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var calendar = dependencies.calendar;
  var signals = dependencies.signals;
  var rendered = null;
  function broadcastTime(stamp) {
    return new Intl.DateTimeFormat('de-DE', { timeZone:'Europe/Berlin', day:'2-digit', month:'2-digit',
      hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date(stamp));
  }
  function render(data) {
    var key = JSON.stringify([data.week, data.today, data.revision, data.canManage, data.entries]);
    if (key === rendered) { return; }
    rendered = key;
    dom.setText('schedule-range', calendar.range(data.week));
    dom.setText('schedule-summary', data.entries.length ?
      data.entries.length + (data.entries.length === 1 ? ' Sendung in dieser Woche' : ' Sendungen in dieser Woche') :
      'AutoDJ (MischWerk) · die ganze Woche');
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
      var slots = calendar.slots(data.entries, day);
      var hasShows = slots.some(function (slot) { return !!slot.entry; });
      section.classList.add(hasShows ? 'has-shows' : 'is-empty');
      if (!hasShows) { section.appendChild(dom.element('p', 'schedule-empty', 'Ganztags · AutoDJ (MischWerk)')); }
      slots.forEach(function (slot) {
        if (!hasShows) { return; }
        var entry = slot.entry;
        if (!entry) {
          section.appendChild(dom.element('p', 'schedule-autodj-gap',
            calendar.time(slot.from) + ' – ' + calendar.time(slot.to) + ' · AutoDJ (MischWerk)'));
          return;
        }
        var row = dom.element('article', 'schedule-show');
        row.dataset.scheduleKey = entry.week + ':' + entry.id + ':' + day;
        var continued = entry.date !== day;
        var time = continued ? '00:00 – ' + entry.end + ' Uhr · vom Vortag' :
          entry.start + ' – ' + entry.end + ' Uhr' + (entry.end < entry.start ? ' · Ende am Folgetag' : '');
        if (entry.timing === 'allDay') { time = 'Ganztags'; }
        if (entry.timing === 'openEnd') {
          time = (continued ? 'Seit ' + calendar.label(entry.date) : entry.start + ' Uhr') + ' · Open End';
        }
        if (entry.automatic) {
          time = entry.start + ' Uhr · spontan';
          if (entry.actualEnd) {
            time = (continued ? '00:00' : entry.start) + ' – ' + broadcastTime(entry.actualEnd).split(', ').pop() + ' Uhr';
            if (broadcastTime(entry.actualStart).slice(0, 6) !== broadcastTime(entry.actualEnd).slice(0, 6)) {
              time += ' · Ende ' + broadcastTime(entry.actualEnd).slice(0, 6);
            }
          }
        }
        var copy = dom.element('div', 'schedule-show-copy');
        copy.appendChild(dom.element('strong', 'schedule-time', time));
        copy.appendChild(dom.element('span', 'schedule-presenter', entry.kind === 'autodj' ? 'AutoDJ · MischWerk' : 'Mit ' + entry.nick));
        copy.appendChild(dom.element('p', 'schedule-topic', entry.topic || 'MischWerk Radio Show'));
        if (entry.actualStart) {
          copy.appendChild(dom.element('p', 'schedule-broadcast', 'Angemeldet: ' + broadcastTime(entry.actualStart) +
            (entry.actualEnd ? ' · Abgemeldet: ' + broadcastTime(entry.actualEnd) : ' · Moderation angemeldet')));
        }
        row.appendChild(copy);
        if (data.canManage && entry.week === data.week && !entry.automatic && (!entry.actualStart || entry.actualEnd)) {
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

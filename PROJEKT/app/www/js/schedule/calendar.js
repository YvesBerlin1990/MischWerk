/* Darstellung und Navigation reiner Kalenderdaten ohne lokale Zeitzonenverschiebung. */
MischWerkUI.define('scheduleCalendar', function () {
  'use strict';
  var weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function date(value) { return new Date(value + 'T12:00:00Z'); }
  function shift(value, days) {
    var result = date(value); result.setUTCDate(result.getUTCDate() + days);
    return result.toISOString().slice(0, 10);
  }
  function week(value) {
    if (typeof value !== 'string' || !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value)) { return null; }
    var selected = date(value);
    if (!isFinite(selected.getTime()) || selected.toISOString().slice(0, 10) !== value) { return null; }
    return shift(value, -((selected.getUTCDay() + 6) % 7));
  }
  function label(value) { return value.slice(8) + '.' + value.slice(5, 7) + '.' + value.slice(0, 4); }
  function day(value) { return weekdays[date(value).getUTCDay()] + ', ' + label(value); }
  function range(week) { return label(week) + ' – ' + label(shift(week, 6)); }
  function minutes(time) { return Number(time.slice(0, 2)) * 60 + Number(time.slice(3)); }
  function time(value) {
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }
  function slots(entries, day) {
    var midnight = Date.parse(day + 'T00:00:00Z') / 60000, cursor = 0, result = [];
    entries.map(function (entry) {
      var start = Date.parse(entry.date + 'T00:00:00Z') / 60000 + minutes(entry.start);
      var end = entry.timing === 'allDay' ? start + 1440 : entry.timing === 'openEnd' ?
        (typeof entry.until === 'number' ? entry.until : Infinity) :
        start - minutes(entry.start) + minutes(entry.end) + (entry.end < entry.start ? 1440 : 0);
      return { entry: entry, from: Math.max(0, start - midnight), to: Math.min(1440, end - midnight) };
    }).filter(function (slot) { return slot.from < slot.to; }).sort(function (a, b) {
      return a.from - b.from;
    }).forEach(function (slot) {
      if (cursor < slot.from) { result.push({ from: cursor, to: slot.from }); }
      result.push(slot); cursor = Math.max(cursor, slot.to);
    });
    if (cursor < 1440) { result.push({ from: cursor, to: 1440 }); }
    return result;
  }
  return { shift: shift, week: week, label: label, day: day, range: range, slots: slots, time: time };
});

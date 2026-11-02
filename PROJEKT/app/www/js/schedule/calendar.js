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
  return { shift: shift, week: week, label: label, day: day, range: range };
});

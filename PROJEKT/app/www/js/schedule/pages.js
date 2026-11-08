/* Lange Wochenpläne in sichtbare Abschnitte aufteilen; Originalzeilen behalten ihre Aktionen. */
MischWerkUI.define('schedulePages', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var days = [];
  var pages = [];
  var selected = 0;
  var anchor = null;
  var week = null;
  var generation = 0;
  var navigated = false;
  var rolling = false;
  function capture(nextWeek, fromToday) {
    fromToday = fromToday === true;
    if (nextWeek !== week || fromToday !== rolling) { selected = 0; anchor = null; navigated = false; }
    rolling = fromToday;
    week = nextWeek;
    generation += 1;
    days = Array.prototype.map.call(dom.el('schedule-days').children, function (node) {
      return { node: node, heading: node.firstElementChild,
        items: Array.prototype.slice.call(node.children, 1) };
    });
    if (!anchor) { anchor = position(dom.el('schedule-days'), !fromToday); }
  }
  function position(node, preferShow) {
    var row = preferShow && node.querySelector('.schedule-show');
    var day = row ? row.closest('.schedule-day') : node.querySelector('.schedule-day');
    return day ? { key: row ? row.dataset.scheduleKey : null, day: day.dataset.scheduleDate } : null;
  }
  function restore() {
    var list = dom.el('schedule-days');
    list.textContent = '';
    days.forEach(function (day) {
      day.node.textContent = '';
      day.node.appendChild(day.heading);
      day.items.forEach(function (item) { day.node.appendChild(item); });
      list.appendChild(day.node);
    });
    dom.el('schedule-pagination').hidden = true;
    pages = [];
  }
  function select(index) {
    if (!pages.length) { return; }
    selected = Math.max(0, Math.min(index, pages.length - 1));
    pages.forEach(function (page, number) { page.hidden = number !== selected; });
    anchor = position(pages[selected], navigated || !rolling);
    dom.setText('schedule-page-label', 'Seite ' + (selected + 1) + ' von ' + pages.length);
    dom.el('schedule-page-previous').disabled = selected === 0;
    dom.el('schedule-page-next').disabled = selected === pages.length - 1;
  }
  function fit(height, focused) {
    var list = dom.el('schedule-days');
    var focusedRow = focused && focused.closest && focused.closest('.schedule-show');
    var wanted = focusedRow ? { key: focusedRow.dataset.scheduleKey, day: focusedRow.closest('.schedule-day').dataset.scheduleDate } : anchor;
    list.textContent = '';
    pages = [];
    function newPage() {
      var page = dom.element('div', 'schedule-page');
      list.appendChild(page); pages.push(page); return page;
    }
    var page = newPage();
    days.forEach(function (day) {
      var section = null;
      function newSection(continued) {
        var node = dom.element('section', day.node.className);
        node.dataset.scheduleDate = day.node.dataset.scheduleDate;
        var heading = day.heading.cloneNode(true);
        if (continued) { heading.appendChild(dom.element('span', 'schedule-continuation', 'Fortsetzung')); }
        node.appendChild(heading); page.appendChild(node); return node;
      }
      day.items.forEach(function (item, index) {
        if (!section) { section = newSection(false); }
        section.appendChild(item);
        if (page.getBoundingClientRect().height <= height + 0.5) { return; }
        // Eine einzelne Zeile bleibt zusammen; niemals Einträge kürzen oder verwerfen.
        if (page.children.length === 1 && section.children.length === 2) { return; }
        section.removeChild(item);
        if (section.children.length === 1) { page.removeChild(section); }
        page = newPage(); section = newSection(index > 0); section.appendChild(item);
      });
    });
    var target = selected;
    if (wanted) {
      var match = pages.findIndex(function (node) {
        return wanted.key && Array.prototype.some.call(node.querySelectorAll('.schedule-show'), function (row) {
          return row.dataset.scheduleKey === wanted.key;
        });
      });
      if (match < 0) {
        match = pages.findIndex(function (node) {
          return Array.prototype.some.call(node.querySelectorAll('.schedule-day'), function (day) {
            return day.dataset.scheduleDate === wanted.day;
          });
        });
      }
      if (match >= 0) { target = match; }
    }
    dom.el('schedule-pagination').hidden = pages.length < 2;
    select(target);
  }
  function reveal(key) {
    for (var index = 0; index < pages.length; index += 1) {
      if (Array.prototype.some.call(pages[index].querySelectorAll('.schedule-show,.schedule-day'), function (row) {
        return row.dataset.scheduleKey === key || row.dataset.scheduleDate === key;
      })) { navigated = key.indexOf(':') !== -1; select(index); return; }
    }
  }
  function start() {
    dom.el('schedule-page-previous').addEventListener('click', function () { navigated = true; select(selected - 1); });
    dom.el('schedule-page-next').addEventListener('click', function () { navigated = true; select(selected + 1); });
  }
  return { capture: capture, restore: restore, fit: fit, reveal: reveal, start: start,
    revision: function () { return generation; } };
});

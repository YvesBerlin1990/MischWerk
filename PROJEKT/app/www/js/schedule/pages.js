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
  function capture(nextWeek) {
    if (nextWeek !== week) { selected = 0; anchor = null; }
    week = nextWeek;
    generation += 1;
    days = Array.prototype.map.call(dom.el('schedule-days').children, function (node) {
      return { node: node, heading: node.firstElementChild,
        items: Array.prototype.slice.call(node.children, 1) };
    });
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
    var row = pages[selected].querySelector('.schedule-show');
    anchor = row ? row.dataset.scheduleKey : null;
    dom.setText('schedule-page-label', 'Seite ' + (selected + 1) + ' von ' + pages.length);
    dom.el('schedule-page-previous').disabled = selected === 0;
    dom.el('schedule-page-next').disabled = selected === pages.length - 1;
  }
  function fit(height, focused) {
    var list = dom.el('schedule-days');
    var focusedRow = focused && focused.closest && focused.closest('.schedule-show');
    var wanted = focusedRow ? focusedRow.dataset.scheduleKey : anchor;
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
      pages.forEach(function (node, index) {
        if (Array.prototype.some.call(node.querySelectorAll('.schedule-show'), function (row) {
          return row.dataset.scheduleKey === wanted;
        })) { target = index; }
      });
    }
    dom.el('schedule-pagination').hidden = pages.length < 2;
    select(target);
  }
  function reveal(key) {
    for (var index = 0; index < pages.length; index += 1) {
      if (Array.prototype.some.call(pages[index].querySelectorAll('.schedule-show'), function (row) {
        return row.dataset.scheduleKey === key;
      })) { select(index); return; }
    }
  }
  function start() {
    dom.el('schedule-page-previous').addEventListener('click', function () { select(selected - 1); });
    dom.el('schedule-page-next').addEventListener('click', function () { select(selected + 1); });
  }
  return { capture: capture, restore: restore, fit: fit, reveal: reveal, start: start,
    revision: function () { return generation; } };
});

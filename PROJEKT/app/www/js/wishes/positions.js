/* Private aktuelle Wunschpositionen; unabhängig vom unveränderten Senden des Formulars. */
MischWerkUI.define('wishPositions', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var current = null, rendered = null, waitingFor = null, timer, readFocus = null, confirmed = true;
  function finishRead() { clearTimeout(timer); waitingFor = null; }
  function render() {
    var panel = dom.el('wish-positions');
    var focused = panel.contains(document.activeElement);
    panel.hidden = !current || !current.available || !current.total;
    if (panel.hidden) {
      if (focused) {
        var surface = document.documentElement.hasAttribute('data-wish-surface');
        var target = surface && dom.el('wish-form').hidden ? dom.el('wish-compose-open') :
          dom.el('wish-text').matches(':disabled') ? dom.el(surface || model.view === 'radio' ? 'close-wishes' : 'dialog-title') : dom.el('wish-text');
        target.setAttribute('tabindex', target.id === 'dialog-title' ? '-1' : '0'); target.focus({ preventScroll:true });
      }
      layout.resizeDialog(); return;
    }
    var live = model.connected() && confirmed;
    var hint = waitingFor !== null ? 'Positionen werden aktualisiert …' :
      live ? '' : 'Position momentan nicht verfügbar. Bitte aktualisieren.';
    dom.setText('wish-positions-status', hint);
    dom.el('wish-positions-status').hidden = !hint;
    dom.el('wish-positions-pages').hidden = current.pages <= 1;
    dom.setText('wish-positions-page', 'Seite ' + (current.page + 1) + ' / ' + current.pages);
    dom.el('prev-wish-positions').disabled = !live || waitingFor !== null || current.page <= 0;
    dom.el('next-wish-positions').disabled = !live || waitingFor !== null || current.page >= current.pages - 1;
    var key = JSON.stringify([current.items, live]);
    if (key !== rendered) {
      rendered = key;
      var list = dom.el('wish-positions-list');
      list.textContent = '';
      current.items.forEach(function (item) {
        var row = dom.element('li', 'wish-position-item');
        row.appendChild(dom.element('strong', 'wish-position-value', live ? 'Platz ' + item.position : 'Platz —'));
        row.appendChild(dom.element('p', 'wish-position-text', item.text));
        row.appendChild(dom.element('span', 'wish-position-stage', live ?
          item.stage === 'playing' ? 'Läuft gerade' : item.stage === 'preparing' ? 'In Vorbereitung' : 'Wartet' : 'Status momentan nicht verfügbar'));
        list.appendChild(row);
      });
    }
    layout.resizeDialog();
  }
  function receive() {
    var next = model.current() && model.current().wishPositions;
    if (!next || typeof next.generation !== 'string' || !Array.isArray(next.items) ||
        !Number.isInteger(next.revision) || next.revision < 0 ||
        !Number.isInteger(next.page) || !Number.isInteger(next.pages) || next.pages < 1 ||
        !Number.isInteger(next.total) || next.total < 0 ||
        next.page < 0 || next.page >= next.pages) { return; }
    if (current && next.generation !== current.generation) {
      finishRead();
    }
    if (waitingFor !== null && next.page !== Math.min(waitingFor, next.pages - 1)) { return; }
    var restore = waitingFor !== null && readFocus &&
      (document.activeElement === readFocus || document.activeElement === document.body);
    finishRead(); confirmed = true; current = next; render();
    if (restore && !dom.el('wish-positions').hidden) {
      var target = !readFocus.disabled ? readFocus : dom.el('refresh-wish-positions');
      target.focus({ preventScroll: true });
    }
    readFocus = null;
  }
  function read(page) {
    if (waitingFor !== null) { return; }
    waitingFor = page;
    readFocus = document.activeElement;
    timer = setTimeout(function () { finishRead(); confirmed = false; readFocus = null; render(); }, 15000);
    commands.send('mw:refresh', { myPage: page });
    render();
  }
  function start() {
    signals.on('snapshot', receive);
    signals.on('controls', render);
    dom.el('refresh-wish-positions').addEventListener('click', function () { read(current ? current.page : 0); });
    dom.el('prev-wish-positions').addEventListener('click', function () { if (!this.disabled) { read(current.page - 1); } });
    dom.el('next-wish-positions').addEventListener('click', function () { if (!this.disabled) { read(current.page + 1); } });
    window.addEventListener('pagehide', finishRead);
  }
  return { start: start };
});

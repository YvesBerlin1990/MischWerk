/* Bestehende native Overlaymaße und ein gemeinsamer Rückmeldungsweg. */
MischWerkUI.define('layout', function (dependencies) {
  'use strict';
  var model = dependencies.model, dom = dependencies.dom, signals = dependencies.signals;
  var viewport = dependencies.viewport, noticeTimer;
  function resizeDialog() { signals.emit('dialog-layout'); }
  function notify(message, error, action) {
    var box = dom.el('notice');
    if (model.view !== 'radio') { dom.el('dialog-notice-slot').appendChild(box); }
    box.textContent = message; box.hidden = !message; box.className = 'notice' + (error ? ' error' : '');
    box.setAttribute('role', error ? 'alert' : 'status');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { box.hidden = true; }, 6000);
  }
  function renderView() {
    var state = model.current(), panel = dom.el(model.view + '-panel');
    if (panel) { panel.hidden = !state || (model.view === 'team' && !state.user.canAdminister); }
    dom.el('team-access-denied').hidden = model.view !== 'team' || !state || state.user.canAdminister;
  }
  function resizeBar(initial) { if (viewport) { viewport.resize(initial); } }
  function start() {
    if (model.view === 'radio') { dom.el('radio-panel').appendChild(dom.el('notice')); }
    else {
      var slot = dom.el('dialog-notice-slot');
      slot.parentNode.insertBefore(slot, document.querySelector('.dialog-content')); slot.appendChild(dom.el('notice'));
      dom.setText('dialog-title', model.view === 'wishes' ? 'Wunschbox' : model.view === 'team' ? 'Verwaltung' : 'Sendeplan');
    }
    signals.on('snapshot', renderView);
    window.addEventListener('pagehide', function () { clearTimeout(noticeTimer); });
  }
  function availability() {
    if (model.view !== 'team') { return; }
    dom.el('studio-connection').hidden = model.connected();
    dom.setText('studio-connection', model.connected() ? '' : 'Verbindung unterbrochen');
  }
  return { start:start, notify:notify, renderView:renderView, availability:availability, resizeDialog:resizeDialog, resizeBar:resizeBar };
});

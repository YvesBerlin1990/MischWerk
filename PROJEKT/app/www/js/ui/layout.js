/* Native Overlaymaße bleiben unverändert; Inhalt passt sich dem vorhandenen Rahmen an. */
MischWerkUI.define('layout', function (dependencies) {
  'use strict';
  var model = dependencies.model, dom = dependencies.dom, signals = dependencies.signals;
  var viewport = dependencies.viewport;
  var noticeTimer, layoutReady = false;
  function fitContent() {
    if (model.view === 'schedule') { signals.emit('schedule-layout', true); return; }
    if (model.view !== 'studio') { return; }
    signals.emit('studio-fit');
  }
  function resizeDialog(initial) {
    if (!layoutReady || model.view === 'radio' || (document.readyState === 'loading' && initial !== true) ||
        (!document.documentElement.classList.contains('mw-ready') && initial !== true)) { return; }
    fitContent();
  }
  function notify(message, error, action) {
    var box = dom.el('notice');
    if (model.view !== 'radio') {
      var targets = { 'mw:onAir':'studio-controls', 'mw:offAir':'studio-controls', 'mw:setRequests':'studio-controls',
        'mw:setWishStage':'queue-notice', 'mw:resolveRequest':'queue-notice',
        'mw:addRadioModerator':'radio-moderator-form', 'mw:removeRadioModerator':'team-list-notice', 'mw:channelTexts.save':'channel-texts-form' };
      var target = dom.el(targets[action] || (action && action.indexOf('mw:handover.') === 0 ? 'handover-panel' : 'dialog-notice-slot'));
      if (!target || !target.getClientRects().length || target.closest('[hidden]')) { target = dom.el('dialog-notice-slot'); }
      target.appendChild(box);
      box.setAttribute('role', error ? 'alert' : 'status');
      box.setAttribute('aria-live', error ? 'assertive' : 'polite');
    }
    box.textContent = message; box.hidden = false; box.className = 'notice' + (error ? ' error' : '');
    resizeDialog(); clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { box.hidden = true; resizeDialog(); }, 6000);
  }
  function renderView() {
    var state = model.current(), panel = dom.el(model.view + '-panel');
    if (panel) { panel.hidden = !state || (model.view === 'studio' && !state.user.canModerate) ||
      (model.view === 'team' && !state.user.canManageRadioModerators); }
    dom.el('access-denied').hidden = model.view !== 'studio' || !state || state.user.canModerate;
    dom.el('team-access-denied').hidden = model.view !== 'team' || !state || state.user.canManageRadioModerators;
  }
  function resizeBar(initial) { if (viewport) { viewport.resize(initial); } }
  function start() {
    if (model.view === 'radio') { dom.el('radio-panel').appendChild(dom.el('notice')); }
    else {
      var slot = dom.el('dialog-notice-slot');
      slot.parentNode.insertBefore(slot, document.querySelector('.dialog-content'));
      dom.el('dialog-notice-slot').appendChild(dom.el('notice'));
      dom.setText('dialog-title', model.view === 'wishes' ? 'Wunschbox' : model.view === 'team' ? 'Verwaltung' : model.view === 'schedule' ? 'Sendeplan' : 'Moderation');
      dom.el('studio-connection').hidden = true;
    }
    layoutReady = true;
    if (model.view === 'studio') {
      signals.on('studio-layout', resizeDialog);
      document.addEventListener('toggle', resizeDialog, true);
      if (typeof ResizeObserver === 'function') { new ResizeObserver(resizeDialog).observe(document.querySelector('.dialog-shell')); }
    }
    window.addEventListener('resize', resizeDialog);
    signals.on('snapshot', resizeDialog);
    window.addEventListener('pagehide', function () { clearTimeout(noticeTimer); });
  }
  function availability() {
    var state = model.current();
    if (!state || (model.view !== 'studio' && model.view !== 'team')) { return; }
    var live = model.connected();
    dom.el('studio-connection').hidden = live;
    dom.setText('studio-connection', live ? '' : 'Verbindung fehlt');
    dom.el('studio-connection').classList.toggle('connection-lost', !live);
    dom.el('studio-connection').title = live ? 'Verbindung zum Knuddels-Channel bestätigt' : 'Aktionen gesperrt. Aktualisieren oder das Fenster erneut öffnen.';
  }
  return { start:start, notify:notify, renderView:renderView, availability:availability,
    resizeDialog:resizeDialog, resizeBar:resizeBar };
});

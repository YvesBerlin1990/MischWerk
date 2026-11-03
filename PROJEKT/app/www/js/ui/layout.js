/* Ansichtsauswahl, Fenstermaße und zeitlich begrenzte Oberflächenhinweise. */
MischWerkUI.define('layout', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var viewport = dependencies.viewport;
  var dialogHeight = 0;
  var dialogResizeTimer;
  var noticeTimer;
  var layoutReady = false;
  var dialogLimit = null;
  var lastConnection = null;
  var studioFocus = null;
  var studioAwaitingHeight = 0;
  var studioHostTimer;
  function fitDialog() {
    if (model.view === 'studio' && document.documentElement.classList.contains('history-open')) { return; }
    var surface = document.documentElement.hasAttribute('data-wish-surface');
    var shell = surface ? dom.el('wishes-panel') : document.querySelector('.dialog-shell');
    // Vor der ersten Hostanpassung festhalten: manche Clients melden danach die Framehöhe als Bildschirmhöhe.
    if (dialogLimit === null) {
      var available = window.screen && window.screen.availHeight;
      dialogLimit = Math.max(260, Math.min(1000, available > window.innerHeight ? available - 80 : window.innerHeight));
    }
    var height;
    if (model.view === 'studio') {
      var panel = dom.el('studio-panel');
      var wasCompact = panel.classList.contains('fit-tabs');
      // Die vollständige Konsole messen, unabhängig vom gewählten Reiter.
      panel.classList.remove('fit-tabs');
      var fullHeight = Math.ceil(shell.getBoundingClientRect().height);
      var limited = window.innerWidth > 600 && fullHeight > dialogLimit;
      var growing = !limited && fullHeight > window.innerHeight + 1 &&
        (fullHeight !== dialogHeight || studioAwaitingHeight === fullHeight);
      panel.classList.toggle('fit-tabs', window.innerWidth > 600 &&
        (limited || (!growing && fullHeight > window.innerHeight + 1)));
      if (panel.classList.contains('fit-tabs') || window.innerWidth <= 600) {
        var focused = document.activeElement === document.body && studioFocus && studioFocus.isConnected ? studioFocus : document.activeElement;
        var inQueue = dom.el('studio-requests').contains(focused);
        if (inQueue || dom.el('studio-setup').contains(focused)) {
          panel.classList.toggle('show-queue', inQueue);
          dom.el('studio-controls-tab').setAttribute('aria-pressed', String(!inQueue));
          dom.el('studio-queue-tab').setAttribute('aria-pressed', String(inQueue));
          if (focused !== document.activeElement) { focused.focus({ preventScroll:true }); }
        }
      }
      if (wasCompact !== panel.classList.contains('fit-tabs')) { signals.emit('queue-visible'); }
      // Ein kleiner/ignorierter Hostrahmen darf nicht selbst zur immer kleineren Zielhöhe werden.
      height = limited ? Math.ceil(shell.getBoundingClientRect().height) : fullHeight;
    } else { height = Math.ceil(shell.getBoundingClientRect().height); }
    var fittedHeight = Math.max(50, Math.min(height, dialogLimit));
    if (fittedHeight === dialogHeight) { return; }
    if (model.view === 'studio' && fittedHeight > window.innerHeight + 1) {
      studioAwaitingHeight = fittedHeight;
      clearTimeout(studioHostTimer);
      // Eine schrittweise Hostantwort nicht zwischenzeitlich als feste Clientgrenze behandeln.
      studioHostTimer = setTimeout(function () { studioAwaitingHeight = 0; resizeDialog(); }, 350);
    }
    try {
      if (bridge && (surface || !bridge.isK3Client() || model.view === 'team' || model.view === 'studio')) {
        bridge.getHostFrame().setSize(bridge.isK3Client() ? Math.max(50, Math.min(1000, window.innerWidth)) : 0, fittedHeight);
      }
    } catch (error) { /* Der tatsächliche Rahmen bleibt scrollbar nutzbar. */ }
    dialogHeight = fittedHeight;
  }
  function resizeDialog(initial) {
    if (model.view === 'radio') { return; }
    if (model.view === 'schedule') { signals.emit('schedule-layout', initial === true); return; }
    clearTimeout(dialogResizeTimer);
    if (model.view === 'studio' && document.documentElement.classList.contains('history-open')) { signals.emit('history-layout'); return; }
    if (!layoutReady || (document.readyState === 'loading' && initial !== true) ||
        (!document.documentElement.classList.contains('mw-ready') && initial !== true)) { return; }
    if (initial === true) { fitDialog(); }
    else { dialogResizeTimer = setTimeout(fitDialog, 40); }
  }
  
  function notify(message, error) {
    var box = dom.el('notice');
    box.textContent = message; box.hidden = false; box.className = 'notice' + (error ? ' error' : '');
    resizeDialog();
    clearTimeout(noticeTimer); noticeTimer = setTimeout(function () { box.hidden = true; resizeDialog(); }, 6000);
  }
  
  function renderView() {
    if (model.shared) {
      ['wishes','studio','team','schedule'].forEach(function (name) { dom.el(name + '-panel').hidden = name !== model.view; });
    }
    var panel = dom.el(model.view + '-panel');
    if (panel) { panel.hidden = !model.current() ||
      (model.view === 'studio' && !model.current().user.canModerate) ||
      (model.view === 'team' && !model.current().user.canManageRadioModerators); }
    dom.el('access-denied').hidden = model.view !== 'studio' || !model.current() || model.current().user.canModerate;
    dom.el('team-access-denied').hidden = model.view !== 'team' || !model.current() || model.current().user.canManageRadioModerators;
  }
  
  function resizeBar(initial) {
    if (viewport) { viewport.resize(initial); }
  }
  
  function switchPane(panel, className, first, second, selected) {
    dom.el(panel).classList.toggle(className, selected);
    dom.el(first).setAttribute('aria-pressed', String(!selected));
    dom.el(second).setAttribute('aria-pressed', String(selected));
    resizeDialog();
    signals.emit('queue-visible');
  }
  
  function start() {
    if (model.view !== 'radio') {
      dom.el('dialog-notice-slot').appendChild(dom.el('notice'));
      dom.setText('dialog-title', model.view === 'wishes' ? 'Wunschbox' : model.view === 'team' ? 'Radio-Team' : model.view === 'schedule' ? 'Sendeplan' : 'Moderation');
      dom.el('studio-connection').hidden = model.view !== 'studio' && model.view !== 'team';
    } else { dom.el('radio-panel').appendChild(dom.el('notice')); }
    layoutReady = true;
    if (model.view === 'studio' || model.shared) {
      document.addEventListener('focusin', function (event) {
        studioFocus = dom.el('studio-requests').contains(event.target) || dom.el('studio-setup').contains(event.target) ? event.target : null;
      });
    }
    window.addEventListener('resize', resizeDialog);
    signals.on('snapshot', resizeDialog);
    signals.on('studio-layout', resizeDialog);
    window.addEventListener('pagehide', function () { clearTimeout(dialogResizeTimer); clearTimeout(studioHostTimer); clearTimeout(noticeTimer); });
    if (model.view === 'team' || model.view === 'studio' || model.shared) {
      if (model.view === 'team' || model.shared) { signals.on('team-layout', resizeDialog); }
      document.addEventListener('toggle', resizeDialog, true);
      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(resizeDialog).observe(document.querySelector('.dialog-shell'));
      }
    }
    if ((document.documentElement.hasAttribute('data-wish-surface') || model.shared) && typeof ResizeObserver === 'function') {
      new ResizeObserver(resizeDialog).observe(dom.el('wishes-panel'));
    }
  }
  function enterView(first) {
    if (first) { return; }
    clearTimeout(dialogResizeTimer); dialogHeight = 0; studioAwaitingHeight = 0;
    var width = model.view === 'schedule' ? 820 : model.view === 'studio' ? 780 : 560;
    var height = model.view === 'schedule' ? 660 : model.view === 'team' ? 560 : 600;
    try { if (bridge) { bridge.getHostFrame().setSize(width, height); } } catch (ignored) { /* Native Grenzen bleiben erreichbar. */ }
    requestAnimationFrame(function () { resizeDialog(true); signals.emit('queue-visible'); });
  }
  function availability(pending) {
    var state = model.current();
    if (!state) { return; }
    var live = model.connected();
    if (model.view !== 'studio' && model.view !== 'team') { return; }
    dom.setText('studio-connection', live ? 'Verbunden' : 'Verbindung fehlt');
    dom.el('studio-connection').classList.toggle('connection-lost', !live);
    dom.el('studio-connection').title = live ? 'Verbindung zum Knuddels-Channel bestätigt' : 'Aktionen gesperrt. Aktualisieren oder das Fenster erneut öffnen.';
    if (lastConnection !== live) { lastConnection = live; resizeDialog(); }
  }
  return { start: start, enterView:enterView, notify: notify, renderView: renderView, availability: availability,
    resizeDialog: resizeDialog, resizeBar: resizeBar, switchPane: switchPane };
});

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
  function resizeDialog() {
    if (model.view === 'schedule') { signals.emit('schedule-layout'); return; }
    clearTimeout(dialogResizeTimer);
    if (model.view === 'radio' || !layoutReady || document.readyState !== 'complete') { return; }
    dialogResizeTimer = setTimeout(function () {
      var shell = document.querySelector('.dialog-shell');
      if (model.view === 'studio') {
        var panel = dom.el('studio-panel');
        var wasCompact = panel.classList.contains('fit-tabs');
        // Erst die vollständige Konsole messen; ein bereits gewählter Reiter
        // darf die Entscheidung nicht abwechselnd ein- und ausschalten.
        panel.classList.remove('fit-tabs');
        panel.classList.toggle('fit-tabs', window.innerWidth > 600 &&
          shell.getBoundingClientRect().height > window.innerHeight);
        if (wasCompact !== panel.classList.contains('fit-tabs')) { signals.emit('queue-visible'); }
      }
      // Diese Fenster erhalten ihre Größe bereits beim Öffnen vom Backend.
      // Inhalt über Reiter/Scrollen einpassen, ohne den nativen Rahmen nachträglich zu ändern.
      if (model.view === 'studio' || model.view === 'team') { return; }
      var height = Math.ceil(shell.getBoundingClientRect().height);
      if (height === dialogHeight) { return; }
      try {
        // Nur STAPP: Breite mit 0 beibehalten, Höhe an den tatsächlichen Inhalt anpassen.
        if (bridge && !bridge.isK3Client()) { var available = window.screen && window.screen.availHeight;
          bridge.getHostFrame().setSize(0, Math.min(height, Math.max(260, Math.min(1000, available > 0 ? available - 80 : window.innerHeight)))); }
        dialogHeight = height;
      } catch (error) { /* Responsive Darstellung bleibt ohne HostFrame-Anpassung nutzbar. */ }
    }, 40);
  }
  
  function notify(message, error) {
    var box = dom.el('notice');
    box.textContent = message; box.hidden = false; box.className = 'notice' + (error ? ' error' : '');
    resizeDialog();
    clearTimeout(noticeTimer); noticeTimer = setTimeout(function () { box.hidden = true; resizeDialog(); }, 6000);
  }
  
  function renderView() {
    var panel = dom.el(model.view + '-panel');
    if (panel) { panel.hidden = !model.current() ||
      (model.view === 'studio' && !model.current().user.canModerate) ||
      (model.view === 'team' && !model.current().user.canManageRadioModerators); }
    dom.el('access-denied').hidden = model.view !== 'studio' || !model.current() || model.current().user.canModerate;
    dom.el('team-access-denied').hidden = model.view !== 'team' || !model.current() || model.current().user.canManageRadioModerators;
  }
  
  function resizeBar() {
    if (viewport) { viewport.resize(); }
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
    window.addEventListener('resize', resizeDialog);
  }
  function availability(pending) {
    var state = model.current();
    if (!state) { return; }
    var live = model.connected();
    if (model.view !== 'studio' && model.view !== 'team') { return; }
    dom.setText('studio-connection', live ? 'Verbunden' : 'Verbindung fehlt');
    dom.el('studio-connection').classList.toggle('connection-lost', !live);
    dom.el('studio-connection').title = live ? 'Verbindung zum Knuddels-Channel bestätigt' : 'Aktionen gesperrt. Aktualisieren oder das Fenster erneut öffnen.';
    resizeDialog();
  }
  return { start: start, notify: notify, renderView: renderView, availability: availability,
    resizeDialog: resizeDialog, resizeBar: resizeBar, switchPane: switchPane };
});

/* Bestätigte Zustände ausschließlich an das geöffnete Fenster verteilen. */
MischWerkUI.define('updates', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var wishes = dependencies.wishes;
  var studio = dependencies.studio;
  var queue = dependencies.queue;
  var team = dependencies.team;
  var schedule = dependencies.schedule;
  var provider = dependencies.provider;
  var player = dependencies.player;
  var presentation = dependencies.presentation;
  var signals = dependencies.signals;
  function radioAvailability() {
    var state = model.current(), live = model.connected(), pending = commands.pending();
    dom.el('studio-tab').hidden = !state.user.showModerationButton;
    dom.el('studio-tab').disabled = !live || pending || !state.user.showModerationButton;
    dom.el('radio-private-actions').hidden = !state.user.showModerationButton;
    dom.el('radio-listener-brand').hidden = !dom.el('radio-private-actions').hidden;
    dom.el('radio-actions').classList.toggle('public-only', dom.el('radio-private-actions').hidden);
    var scheduleAllowed = state.user.canManageRadioModerators === true;
    dom.el('open-schedule').disabled = !live || pending || !scheduleAllowed;
    dom.el('open-schedule').setAttribute('aria-disabled', String(dom.el('open-schedule').disabled));
    dom.el('schedule-button-caption').hidden = scheduleAllowed;
    dom.el('open-schedule').title = scheduleAllowed ?
      (!live ? 'Verbindung zum Channel fehlt' : 'Sendeplan öffnen') : 'Sendeplan – In Kürze';
    if (scheduleAllowed) { dom.el('open-schedule').setAttribute('aria-haspopup', 'dialog'); }
    else { dom.el('open-schedule').removeAttribute('aria-haspopup'); }
    dom.el('open-wishes').classList.toggle('wishes-closed', !state.requestsEnabled);
    dom.setText('wish-button-caption', !state.requestsEnabled ? 'Deaktiviert' : !live ? 'Verbindung fehlt' : 'Dein Musikwunsch');
    dom.el('open-wishes').title = !state.requestsEnabled ? 'Wunschbox deaktiviert' :
      !live ? 'Verbindung zum Channel fehlt' : 'Wunschbox öffnen';
    dom.el('open-wishes').disabled = !live || !state.requestsEnabled || pending;
    dom.el('open-wishes').setAttribute('aria-disabled', String(dom.el('open-wishes').disabled));
    dom.setText('host-name', state.moderator ? state.moderator.nick : 'Radio Mischwerk');
    presentation.renderOnAirStatus();
    player.renderStatus();
  }
  function availability() {
    if (!model.current()) { return; }
    if (wishes) { wishes.availability(); }
    if (studio) { studio.availability(); }
    if (queue) { queue.availability(); }
    if (team) { team.availability(); }
    if (schedule) { schedule.availability(); }
    layout.availability(commands.pending());
    if (model.view === 'radio') { radioAvailability(); }
  }
  function receive(change) {
    var state = model.current();
    layout.renderView();
    if (provider) { provider.selectStation(change.previousStation); }
    if (presentation) { presentation.renderTopic(); }
    if (studio) {
      studio.renderTopic();
    }
    if (queue) { queue.render(); }
    if (team) { team.render(); }
    availability();
    if (queue) { queue.acknowledge(); }
  }
  function start() { signals.on('snapshot', receive); signals.on('controls', availability); }
  return { start: start };
});

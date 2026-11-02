/* Letzter bestätigter Channelzustand, Revision und Verbindungsgültigkeit. */
MischWerkUI.define('model', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var signals = dependencies.signals;
  var state = null;
  var lastStateAt = 0;
  var initialView = bridge && bridge.pageData && bridge.pageData.view;
  var view = initialView === 'wishes' || initialView === 'studio' || initialView === 'team' || initialView === 'schedule' ? initialView : 'radio';
  document.documentElement.setAttribute('data-view', view);
  function connected() { return !!state && Date.now() - lastStateAt < 65000 && !state.shuttingDown; }
  
  function receive(next) {
    if (!next || !next.user || !next.station || !Array.isArray(next.myRequests) || !Array.isArray(next.queue)) { return; }
    if (state && typeof state.revision === 'number' && typeof next.revision === 'number' && next.revision < state.revision) { return; }
    if (state && state.handover && next.handover && next.handover.revision < state.handover.revision) { return; }
    var oldStation = state && JSON.stringify(state.station);
    next.radioModerators = Array.isArray(next.radioModerators) ? next.radioModerators : [];
    next.radioModeratorTotal = typeof next.radioModeratorTotal === 'number' ? next.radioModeratorTotal : next.radioModerators.length;
    next.radioModeratorPage = typeof next.radioModeratorPage === 'number' ? next.radioModeratorPage : 0;
    next.radioModeratorPages = typeof next.radioModeratorPages === 'number' ? next.radioModeratorPages : 1;
    next.radioModeratorRevision = typeof next.radioModeratorRevision === 'number' ? next.radioModeratorRevision : 0;
    next.user.canManageRadioModerators = next.user.canManageRadioModerators === true;
    state = next; lastStateAt = Date.now();
    signals.emit('snapshot', { previousStation: oldStation });
  }
  
  return { view: view, current: function () { return state; }, connected: connected, receive: receive };
});

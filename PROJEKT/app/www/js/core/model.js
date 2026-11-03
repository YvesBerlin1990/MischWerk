/* Letzter bestätigter Channelzustand, Revision und Verbindungsgültigkeit. */
MischWerkUI.define('model', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var signals = dependencies.signals;
  var state = null;
  var lastStateAt = 0;
  var retiredWishGenerations = [];
  var initialView = bridge && bridge.pageData && bridge.pageData.view;
  var view = initialView === 'wishes' || initialView === 'studio' || initialView === 'team' || initialView === 'schedule' ? initialView : 'radio';
  var shared = !!(bridge && bridge.pageData && bridge.pageData.sharedViews);
  var viewRevision = 0;
  document.documentElement.setAttribute('data-view', view);
  function connected() { return !!state && Date.now() - lastStateAt < 65000 && !state.shuttingDown; }
  
  function receive(next) {
    if (!next || !next.user || !next.station || !Array.isArray(next.myRequests) || !Array.isArray(next.queue)) { return; }
    if (shared && (!Number.isInteger(next.viewRevision) || next.viewRevision < viewRevision ||
        ['wishes','studio','team','schedule'].indexOf(next.view) === -1)) { return; }
    if (state && typeof state.revision === 'number' && typeof next.revision === 'number' && next.revision < state.revision) { return; }
    if (state && state.handover && next.handover && next.handover.revision < state.handover.revision) { return; }
    var oldStation = state && JSON.stringify(state.station);
    var previousPositions = state && state.wishPositions;
    var nextPositions = next.wishPositions;
    if (previousPositions && nextPositions) {
      if (retiredWishGenerations.indexOf(nextPositions.generation) !== -1 ||
          (previousPositions.generation === nextPositions.generation && nextPositions.revision < previousPositions.revision)) {
        next.wishPositions = previousPositions;
        next.queue = state.queue; next.queueTotal = state.queueTotal;
        next.page = state.page; next.pages = state.pages;
      } else if (previousPositions.generation !== nextPositions.generation) {
        retiredWishGenerations.push(previousPositions.generation);
        if (retiredWishGenerations.length > 8) { retiredWishGenerations.shift(); }
      }
    }
    next.radioModerators = Array.isArray(next.radioModerators) ? next.radioModerators : [];
    next.radioModeratorTotal = typeof next.radioModeratorTotal === 'number' ? next.radioModeratorTotal : next.radioModerators.length;
    next.radioModeratorPage = typeof next.radioModeratorPage === 'number' ? next.radioModeratorPage : 0;
    next.radioModeratorPages = typeof next.radioModeratorPages === 'number' ? next.radioModeratorPages : 1;
    next.radioModeratorRevision = typeof next.radioModeratorRevision === 'number' ? next.radioModeratorRevision : 0;
    next.user.canManageRadioModerators = next.user.canManageRadioModerators === true;
    state = next; lastStateAt = Date.now();
    if (shared) { viewRevision = next.viewRevision; }
    if (shared) { signals.emit('view-select', { view:next.view, revision:next.viewRevision, state:next.overlayState }); }
    signals.emit('snapshot', { previousStation: oldStation, refreshRequestId: next.refreshRequestId });
  }
  
  var model = { view:view, shared:shared, setView:function (next) { model.view = next; }, current: function () { return state; }, connected: connected, receive: receive };
  return model;
});

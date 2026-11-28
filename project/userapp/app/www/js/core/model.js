/* Letzter bestätigter Channelzustand, Revision und Verbindungsgültigkeit. */
MischWerkUI.define('model', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var signals = dependencies.signals;
  var state = null;
  var lastStateAt = 0;
  var showDeadline = 0;
  var positionsDeadline = 0;
  var rosterDeadline = 0;
  function broadcastFresh() { return connected() && Date.now() >= lastStateAt && Date.now() < showDeadline; }
  function positionsFresh() { return connected() && Date.now() >= lastStateAt && Date.now() < positionsDeadline; }
  function rosterFresh() { return connected() && Date.now() >= lastStateAt && Date.now() < rosterDeadline; }
  var retiredWishGenerations = [];
  var initialView = bridge && bridge.pageData && bridge.pageData.view;
  var view = initialView === 'wishes' || initialView === 'team' || initialView === 'schedule' ? initialView : 'radio';
  document.documentElement.setAttribute('data-view', view);
  function connected() { return !!state && Date.now() - lastStateAt < 65000 && !state.shuttingDown; }
  
  function receive(next) {
    if (!next || !next.user || !next.station) { return; }
    if (next.view && next.view !== view) { return; }
    if (state && typeof state.revision === 'number' && typeof next.revision === 'number' && next.revision < state.revision) { return; }
    var oldStation = state && JSON.stringify(state.station);
    var previousPositions = state && state.wishPositions;
    var nextPositions = next.wishPositions;
    var stalePositions = false;
    if (previousPositions && nextPositions) {
      if (retiredWishGenerations.indexOf(nextPositions.generation) !== -1 ||
          (previousPositions.generation === nextPositions.generation && nextPositions.revision < previousPositions.revision)) {
        next.wishPositions = previousPositions;
        stalePositions = true;
      } else if (previousPositions.generation !== nextPositions.generation) {
        retiredWishGenerations.push(previousPositions.generation);
        if (retiredWishGenerations.length > 8) { retiredWishGenerations.shift(); }
      }
    }
    next.radioModerators = Array.isArray(next.radioModerators) ? next.radioModerators : [];
    next.radioModeratorsConfirmed = next.radioModeratorsConfirmed === true;
    next.radioModeratorTotal = next.radioModeratorsConfirmed && typeof next.radioModeratorTotal === 'number' ? next.radioModeratorTotal : null;
    next.radioModeratorPage = typeof next.radioModeratorPage === 'number' ? next.radioModeratorPage : 0;
    next.radioModeratorPages = typeof next.radioModeratorPages === 'number' ? next.radioModeratorPages : 1;
    next.radioModeratorRevision = typeof next.radioModeratorRevision === 'number' ? next.radioModeratorRevision : 0;
    next.user.canAdminister = next.user.canAdminister === true;
    state = next; lastStateAt = Date.now();
    showDeadline = lastStateAt + Math.max(0, Math.min(45000, Number(next.broadcastRemainingMs) || 0));
    rosterDeadline = next.radioModeratorsConfirmed ? lastStateAt + Math.max(0, Math.min(45000, Number(next.radioModeratorsRemainingMs) || 0)) : 0;
    if (!stalePositions) {
      positionsDeadline = lastStateAt + Math.max(0, Math.min(45000,
        next.wishPositions && next.wishPositions.remainingMs === undefined ? 45000 : Number(next.wishPositions && next.wishPositions.remainingMs) || 0));
    }
    signals.emit('snapshot', { previousStation: oldStation, refreshRequestId: next.refreshRequestId });
  }
  
  var model = { view:view, current: function () { return state; }, connected: connected, broadcastFresh:broadcastFresh,
    positionsFresh:positionsFresh, rosterFresh:rosterFresh, receive: receive };
  return model;
});

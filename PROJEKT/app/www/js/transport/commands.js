/* Allgemeine Channelaktionen, Anfragezuordnung und Bestätigungsfristen. */
MischWerkUI.define('commands', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var layout = dependencies.layout;
  var signals = dependencies.signals;
  var pending = null;
  var pendingTimer;
  var requestSequence = 0;
  function nextId(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + (++requestSequence) + '-' + Math.random().toString(36).slice(2, 10); }
  function refreshControls() { signals.emit('controls'); }
  function send(type, data, mutation) {
    if (!bridge || (mutation && !model.connected())) { layout.notify('Die Verbindung zum Channel fehlt. Bitte öffne MischWerk erneut.', true); return; }
    if (mutation && pending) { return; }
    data = data || {};
    var requestId;
    if (mutation) {
      if (type === 'mw:onAir' || type === 'mw:offAir') { data.expectedModerator = model.current().moderator ? model.current().moderator.sessionKey || String(model.current().moderator.since) : null; }
      if (type === 'mw:setTopic') { data.previousTopic = model.current().topic; }
      if (type === 'mw:setRequests') { data.previousEnabled = model.current().requestsEnabled; }
      if (type === 'mw:setCurtain') { data.previousClosed = model.current().curtain.closed; }
      if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') { data.expectedRadioModeratorRevision = model.current().radioModeratorRevision; }
      requestId = nextId('mw');
      data.requestId = requestId;
      pending = { type: type, requestId: requestId }; refreshControls();
      if (type === 'mw:setTopic') {
        signals.emit('topic-started', { requestId: requestId, value: data.topic });
      }
      pendingTimer = setTimeout(function () {
        pending = null; refreshControls();
        if (type === 'mw:setTopic') { signals.emit('topic-error', 'Noch keine Bestätigung. Bitte erneut prüfen und speichern.'); }
        else { layout.notify('Noch keine Bestätigung erhalten. Bitte aktualisiere vor einem erneuten Versuch.', true); }
        send('mw:refresh', {}, false);
      }, 15000);
    }
    try { bridge.sendEvent(type, data); }
    catch (error) {
      if (mutation && pending && pending.requestId === requestId) { pending = null; clearTimeout(pendingTimer); }
      refreshControls();
      if (type === 'mw:setTopic') { signals.emit('topic-error', 'Speichern nicht bestätigt. Bitte erneut versuchen.'); }
      else { layout.notify('Verbindung unterbrochen. Bitte erneut öffnen.', true); }
    }
  }
  
  function result(response) {
    response = response || {};
    if (!pending || response.requestId !== pending.requestId || response.action !== pending.type) { return; }
    pending = null; clearTimeout(pendingTimer);
    signals.emit('command-result', response);
    refreshControls();
    if (response.action !== 'mw:setTopic' && (!response.ok ||
        (response.action !== 'mw:openWishes' && response.action !== 'mw:openStudio' && response.action !== 'mw:openRadioTeam' && response.action !== 'mw:openSchedule'))) {
      layout.notify(response.message, !response.ok);
    }
  }
  function start() {
    if (model.view !== 'radio') { return; }
    [['open-wishes','mw:openWishes'], ['open-schedule','mw:openSchedule'],
      ['studio-tab','mw:openStudio'], ['team-tab','mw:openRadioTeam']].forEach(function (action) {
      document.getElementById(action[0]).addEventListener('click', function () {
        if (!this.disabled && !this.hidden && model.connected()) { send(action[1], {}, true); }
      });
    });
  }
  return { start: start, send: send, result: result, nextId: nextId, pending: function () { return !!pending; } };
});

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
  var manualRefresh = null;
  var refreshBinding = null;
  function finishRefresh(message, error, detail) {
    if (manualRefresh) { clearTimeout(manualRefresh.timer); }
    manualRefresh = null;
    refreshBinding.button.removeAttribute('aria-busy');
    refreshBinding.button.setAttribute('aria-disabled', 'false');
    refreshBinding.button.title = detail || refreshBinding.label;
    refreshBinding.feedback.textContent = message;
    refreshBinding.feedback.title = detail || message;
    refreshBinding.feedback.classList.toggle('refresh-error', !!error);
    refreshControls();
  }
  function refreshManually(binding) {
    if (manualRefresh) { return; }
    refreshBinding = binding;
    if (manualRefresh || refreshBinding.button.disabled) { return; }
    if (!bridge) { finishRefresh('Verbindung fehlt', true, 'Bitte öffne MischWerk erneut.'); return; }
    var requestId = nextId('refresh');
    manualRefresh = { requestId: requestId };
    refreshBinding.button.setAttribute('aria-busy', 'true');
    refreshBinding.button.setAttribute('aria-disabled', 'true');
    refreshBinding.button.title = 'Wird aktualisiert …';
    refreshBinding.feedback.textContent = 'Aktualisiere …';
    refreshBinding.feedback.title = '';
    refreshBinding.feedback.classList.remove('refresh-error');
    manualRefresh.timer = setTimeout(function () {
      finishRefresh('Keine Antwort', true, 'Keine Antwort erhalten. Bitte erneut aktualisieren.');
    }, 15000);
    refreshControls();
    try { bridge.sendEvent('mw:refresh', { requestId: requestId }); }
    catch (error) { finishRefresh('Verbindung fehlt', true, 'Bitte erneut aktualisieren oder MischWerk erneut öffnen.'); }
  }
  function bindRefresh(buttonId, feedbackId) {
    var button = document.getElementById(buttonId);
    var binding = { button:button, feedback:document.getElementById(feedbackId), label:button.title };
    button.addEventListener('click', function () { refreshManually(binding); });
  }
  function nextId(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + (++requestSequence) + '-' + Math.random().toString(36).slice(2, 10); }
  function refreshControls() { signals.emit('controls'); }
  function send(type, data, mutation, confirmed) {
    if (!bridge || (mutation && !model.connected())) { layout.notify('Die Verbindung zum Channel fehlt. Bitte öffne MischWerk erneut.', true); return; }
    if (mutation && (pending || manualRefresh)) { return; }
    data = data || {};
    if (model.view !== 'radio' && model.current()) { data.view = model.view; data.viewRevision = model.current().viewRevision; }
    var requestId;
    if (mutation) {
      if (type === 'mw:onAir' || type === 'mw:offAir') { data.expectedModerator = model.current().moderator ? model.current().moderator.sessionKey || String(model.current().moderator.since) : null; }
      if (type === 'mw:setTopic') { data.previousTopic = model.current().topic; }
      if (type === 'mw:setRequests') { data.previousEnabled = model.current().requestsEnabled; }
      if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') { data.expectedRadioModeratorRevision = model.current().radioModeratorRevision; }
      requestId = nextId('mw');
      data.requestId = requestId;
      pending = { type: type, requestId: requestId, confirmed:confirmed }; refreshControls();
      if (type === 'mw:setTopic') {
        signals.emit('topic-started', { requestId: requestId, value: data.topic });
      }
      pendingTimer = setTimeout(function () {
        pending = null; refreshControls();
        if (type === 'mw:setTopic') { signals.emit('topic-error', 'Noch keine Bestätigung. Bitte erneut prüfen und speichern.'); }
        else { layout.notify('Noch keine Bestätigung erhalten. Bitte aktualisiere vor einem erneuten Versuch.', true, type); }
        send('mw:refresh', {}, false);
      }, 15000);
    }
    try { bridge.sendEvent(type, data); }
    catch (error) {
      if (mutation && pending && pending.requestId === requestId) { pending = null; clearTimeout(pendingTimer); }
      refreshControls();
      if (type === 'mw:setTopic') { signals.emit('topic-error', 'Speichern nicht bestätigt. Bitte erneut versuchen.'); }
      else { layout.notify('Verbindung unterbrochen. Bitte erneut öffnen.', true, type); }
    }
  }
  
  function result(response) {
    response = response || {};
    if (manualRefresh && response.action === 'mw:refresh' && response.requestId === manualRefresh.requestId && response.ok === false) {
      finishRefresh('Nicht aktualisiert', true, response.message || 'Bitte erneut aktualisieren.'); return;
    }
    if (!pending || response.requestId !== pending.requestId || response.action !== pending.type) { return; }
    pending = null; clearTimeout(pendingTimer);
    signals.emit('command-result', response);
    refreshControls();
    if (response.action !== 'mw:setTopic' && response.action !== 'mw:channelTexts.save' && (!response.ok ||
        (response.action !== 'mw:openWishes' && response.action !== 'mw:openStudio' && response.action !== 'mw:openRadioTeam' && response.action !== 'mw:openSchedule'))) {
      if (response.action !== 'mw:removeRadioModerator' || response.ok || !document.getElementById('team-removal-confirm')) {
        layout.notify(response.message, !response.ok, response.action);
      }
    }
  }
  function start() {
    signals.on('snapshot', function (change) {
      var state = model.current();
      if (pending && typeof pending.confirmed === 'function' && model.connected() && pending.confirmed(state)) {
        pending = null; clearTimeout(pendingTimer); refreshControls();
      }
      if (!manualRefresh || change.refreshRequestId !== manualRefresh.requestId) { return; }
      if (!model.connected()) { finishRefresh('Verbindung fehlt', true, 'Bitte öffne MischWerk gleich erneut.'); }
      else if ((model.view === 'studio' && !state.user.canModerate) || (model.view === 'team' && !state.user.canManageRadioModerators)) {
        finishRefresh('Zugriff beendet', true, 'Deine Berechtigung hat sich geändert.');
      } else { finishRefresh('Aktualisiert · ' + new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' }), false); }
    });
    window.addEventListener('pagehide', function () {
      if (manualRefresh) { finishRefresh('Bitte aktualisieren', false); }
    });
    if (model.view !== 'radio') { return; }
    [['open-wishes','mw:openWishes'], ['open-schedule','mw:openSchedule'],
      ['studio-tab','mw:openStudio']].forEach(function (action) {
      document.getElementById(action[0]).addEventListener('click', function () {
        if (!this.disabled && !this.hidden && model.connected()) { send(action[1], {}, true); }
      });
    });
  }
  return { start: start, send: send, result: result, nextId: nextId, bindRefresh: bindRefresh,
    pending: function () { return !!pending || !!manualRefresh; } };
});

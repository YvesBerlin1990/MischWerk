/* Studio-Anmeldung, Wunschboxschalter und bestätigtes Bearbeiten des Sendungsthemas. */
MischWerkUI.define('studio', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var topicDirty = false;
  var topicRequest = null;
  var requestsError = '';
  function releaseTopicSpace() { dom.el('notice').removeAttribute('data-topic-reserved'); }
  function refreshControls() { signals.emit('controls'); }
  function topicFeedback(message, error) {
    var box = dom.el('topic-feedback');
    box.textContent = message; box.hidden = !message; box.classList.toggle('error', !!error);
    dom.el('topic-help').hidden = !!message;
    layout.resizeDialog();
  }
  
  function renderTopic() {
    var topic = typeof model.current().topic === 'string' ? model.current().topic.trim() : '';
    if (!topicDirty) { dom.el('studio-topic').value = topic; }
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    dom.setText('studio-schedule-note', model.current().scheduleSyncPending ?
      'Moderation bestätigt. Der Sendeplaneintrag steht noch aus. Bitte die Moderation erneut öffnen.' :
      'Im Sendeplan automatisch vermerkt.');
    dom.el('studio-schedule-note').classList.toggle('error', !!model.current().scheduleSyncPending);
    document.body.classList.toggle('moderator-on-air', live && !!model.current().moderator);
    dom.setText('studio-host', !live ? 'Moderation unbestätigt' : model.current().moderator ? model.current().moderator.nick + ' ist am Mikrofon' : 'Keine Moderation angemeldet');
    var limits = model.current().limits || { maxTopicLength: 80 };
    dom.el('studio-topic').disabled = !live || !!commands.pending() || !model.current().user.canUseModeration;
    dom.el('studio-topic').maxLength = limits.maxTopicLength || 80;
    dom.el('save-topic').disabled = dom.el('studio-topic').disabled || !topicDirty;
    dom.el('save-topic').setAttribute('aria-busy', String(!!topicRequest));
    dom.el('reset-topic').hidden = !topicDirty;
    dom.el('reset-topic').disabled = dom.el('studio-topic').disabled;
    dom.setText('studio-topic-count', dom.el('studio-topic').value.length + ' / ' + dom.el('studio-topic').maxLength);
    ['on-air', 'off-air'].forEach(function (id) { dom.el(id).disabled = !!commands.pending() || !live || !model.current().user.canModerate; });
    // Beim Speichern fokussierbar halten; der Ereignisweg weist weitere Klicks ab.
    dom.el('toggle-wishes').disabled = !live || !model.current().user.canToggleRequests;
    dom.el('toggle-wishes').setAttribute('aria-disabled', String(dom.el('toggle-wishes').disabled || commands.pending()));
    dom.el('off-air').disabled = dom.el('off-air').disabled || !model.current().user.canEndModeration;
    dom.el('on-air').hidden = !!model.current().moderator;
    dom.el('on-air').disabled = dom.el('on-air').disabled || !!model.current().moderator;
    dom.setText('on-air', 'Anmelden');
    dom.setText('off-air', model.current().moderator && !model.current().user.isOnAir ? 'Moderation beenden' : 'Abmelden');
    dom.el('on-air').title = 'Als Moderation anmelden';
    dom.el('off-air').title = !model.current().moderator ? 'Keine Moderation angemeldet' : model.current().user.canEndModeration ? 'Studio-Anmeldung beenden' : 'Nur aktive Moderation oder Channel-Besitzer dürfen abmelden';
    var requestsPending = commands.pending('mw:setRequests');
    if (!model.current().user.canToggleRequests) { requestsError = ''; }
    dom.el('toggle-wishes').setAttribute('aria-busy', String(requestsPending));
    dom.el('toggle-wishes').setAttribute('aria-checked', String(model.current().requestsEnabled));
    dom.setText('toggle-label', model.current().requestsEnabled ? 'Ein' : 'Aus');
    var error = !!requestsError && !requestsPending;
    var status = dom.el('studio-wish-state');
    status.classList.toggle('error', error);
    status.setAttribute('role', error ? 'alert' : 'status');
    status.setAttribute('aria-live', error ? 'assertive' : 'polite');
    dom.setText('studio-wish-state', requestsPending ? 'Änderung wird gespeichert …' : error ? requestsError :
      !live ? 'Verbindung fehlt' : model.current().requestsEnabled ?
      (model.current().moderator ? 'Musikwünsche sind offen' : 'Nur für den Channelinhaber geöffnet') : 'Musikwünsche sind geschlossen');
  
  }
  function start() {
    dom.el('studio-topic').addEventListener('focus', function () {
      var notice=dom.el('notice');
      if (!notice.hidden && dom.el('studio-controls').contains(notice)) { notice.setAttribute('data-topic-reserved',''); }
    });
    ['on-air','off-air','toggle-wishes','handover-open','studio-programme-tab','studio-queue-tab'].forEach(function(id){
      dom.el(id).addEventListener('click',releaseTopicSpace);
    });
    signals.on('studio-selection',function(selection){if(selection.tab!=='programme')releaseTopicSpace();});
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'studio') { return; }
      state.studio = { topic:topicDirty ? dom.el('studio-topic').value : null };
    });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'studio') { return; }
      if (!state.studio || !model.current().user.canModerate) { return; }
      if (typeof state.studio.topic === 'string' && state.studio.topic.length <= 80) {
        dom.el('studio-topic').value = state.studio.topic; topicDirty = true;
        topicFeedback('Ungespeicherte Änderungen', false); refreshControls();
      }
    });
    dom.el('on-air').addEventListener('click', function () {
      if (this.disabled) { return; }
      var revision = model.current().revision;
      commands.send('mw:onAir', {}, true, function (state) {
        return state.revision > revision && state.user.canUseModeration && state.user.isOnAir;
      });
    });
    dom.el('off-air').addEventListener('click', function () { commands.send('mw:offAir', {}, true); });
    dom.el('studio-topic').addEventListener('input', function () {
      topicDirty = this.value !== (model.current().topic || '');
      topicFeedback(topicDirty ? 'Ungespeicherte Änderungen' : '', false); refreshControls();
    });
    dom.el('reset-topic').addEventListener('click', function () {
      if (this.disabled) { return; }
      topicDirty = false; topicRequest = null; renderTopic();
      topicFeedback('Änderungen verworfen.', false); refreshControls(); dom.el('studio-topic').focus();
    });
    dom.el('topic-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (dom.el('save-topic').disabled || !this.reportValidity()) { return; }
      commands.send('mw:setTopic', { topic: dom.el('studio-topic').value }, true);
    });
    dom.el('toggle-wishes').addEventListener('click', function () {
      if (this.disabled || commands.pending()) { return; }
      commands.send('mw:setRequests', { enabled: !model.current().requestsEnabled }, true);
    });
  
    signals.on('topic-started', function (request) {
      topicRequest = request; topicFeedback('Thema wird gespeichert …', false);
    });
    signals.on('studio-topic-reset', function () { topicDirty = false; topicRequest = null; renderTopic(); topicFeedback('',false); });
    signals.on('topic-error', function (message) { topicFeedback(message, true); });
    signals.on('requests-feedback', function (feedback) {
      requestsError = feedback.error ? feedback.message || 'Wunschbox konnte nicht gespeichert werden.' : '';
      availability(); layout.resizeDialog();
    });
    signals.on('command-result', function (response) {
      if (response.action === 'mw:setTopic') {
        if (response.ok && topicRequest && topicRequest.value === dom.el('studio-topic').value) { topicDirty = false; }
        topicRequest = null;
        topicFeedback(response.message || (response.ok ? 'Thema gespeichert.' : 'Thema konnte nicht gespeichert werden.'), !response.ok);
      }
  
    });
  }
  return { start: start, renderTopic: renderTopic, availability: availability };
});

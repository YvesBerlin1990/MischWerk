(function () {
  'use strict';
  var bridge = typeof Client !== 'undefined' ? Client : null;
  var state = null;
  var initialView = bridge && bridge.pageData && bridge.pageData.view;
  var uiView = initialView === 'wishes' || initialView === 'studio' || initialView === 'team' ? initialView : 'radio';
  document.documentElement.setAttribute('data-view', uiView);
  var page = 0;
  var pending = null;
  var topicDirty = false;
  var topicRequest = null;
  var lastWish = null;
  var wishPending = null;
  var feedbackRequest = null;
  var receiptAttempts = {};
  var queueKey = null;
  var requestSequence = 0;
  var pendingTimer;
  var wishTimer;
  var noticeTimer;
  var lastStateAt = 0;
  var metadataTimer;
  var metadataGeneration = 0;
  var metadataStation = null;
  var providerStatus = 'unknown';
  var lastSong = null;
  var wantedPlayback = false;
  var playbackTimer;
  var playbackAttempt = 0;
  var streamPhase = 'ready';
  var HIGH_VOLUME_THRESHOLD = .6;
  var lastAudibleVolume = .4;
  var barHeight = 0;
  var dialogHeight = 0;
  var dialogResizeTimer;
  var layoutReady = false;
  var audio = document.getElementById('radio-audio');
  function el(id) { return document.getElementById(id); }
  function setText(id, value) {
    el(id).textContent = value;
    if (id === 'track-title' || id === 'track-artist' || id === 'host-name' || id === 'show-topic') { el(id).title = value; }
  }
  function resizeDialog() {
    clearTimeout(dialogResizeTimer);
    if (uiView === 'radio' || !layoutReady) { return; }
    dialogResizeTimer = setTimeout(function () {
      var height = Math.ceil(document.querySelector('.dialog-shell').getBoundingClientRect().height);
      if (height === dialogHeight) { return; }
      try {
        // Nur STAPP: Breite mit 0 beibehalten, Höhe an den tatsächlichen Inhalt anpassen.
        if (bridge && !bridge.isK3Client()) { bridge.getHostFrame().setSize(0, height); }
        dialogHeight = height;
      } catch (error) { /* Responsive Darstellung bleibt ohne HostFrame-Anpassung nutzbar. */ }
    }, 40);
  }
  function fitWishText() {
    var field = el('wish-text');
    // Auch der Server speichert Wünsche als einen Absatz; Zeilenumbrüche vergrößern kein Fenster unnötig.
    if (/[\r\n]/.test(field.value)) {
      var caret = field.selectionStart;
      field.value = field.value.replace(/[\r\n]/g, ' ');
      field.setSelectionRange(caret, caret);
    }
    field.style.height = 'auto';
    field.style.height = Math.max(80, field.scrollHeight + 2) + 'px';
    setText('wish-text-count', field.value.length + ' / ' + field.maxLength);
    resizeDialog();
  }
  function switchPane(panel, className, first, second, selected) {
    el(panel).classList.toggle(className, selected);
    el(first).setAttribute('aria-pressed', String(!selected));
    el(second).setAttribute('aria-pressed', String(selected));
    resizeDialog();
    acknowledgeQueue();
  }
  if (uiView !== 'radio') {
    el('dialog-notice-slot').appendChild(el('notice'));
    setText('dialog-title', uiView === 'wishes' ? 'Wunschbox' : uiView === 'team' ? 'Radio-Team' : 'Moderation');
    el('wish-status').hidden = uiView !== 'wishes';
    el('studio-connection').hidden = uiView !== 'studio' && uiView !== 'team';
  }
  function connected() { return !!state && Date.now() - lastStateAt < 65000 && !state.shuttingDown; }
  function notify(message, error) {
    var box = el('notice');
    box.textContent = message; box.hidden = false; box.className = 'notice' + (error ? ' error' : '');
    resizeDialog();
    clearTimeout(noticeTimer); noticeTimer = setTimeout(function () { box.hidden = true; resizeDialog(); }, 6000);
  }
  function renderView() {
    el('wishes-panel').hidden = uiView !== 'wishes';
    el('studio-panel').hidden = uiView !== 'studio' || !state || !state.user.canModerate;
    el('team-panel').hidden = uiView !== 'team' || !state || !state.user.canManageRadioModerators;
    el('access-denied').hidden = uiView !== 'studio' || !state || state.user.canModerate;
    el('team-access-denied').hidden = uiView !== 'team' || !state || state.user.canManageRadioModerators;
  }
  function resizeBar() {
    var height = window.innerWidth <= 680 ? 264 : 160;
    if (uiView !== 'radio' || !bridge || height === barHeight) { return; }
    try {
      // setSize für Headerbar ist im STAPP dokumentiert. K3 entscheidet selbst über seine Darstellung.
      if (!bridge.isK3Client()) { bridge.getHostFrame().setSize(0, height); }
      barHeight = height;
    } catch (error) { /* Initiale Headerbar-Höhe reicht auch für die schmale Darstellung. */ }
  }
  function send(type, data, mutation) {
    if (!bridge || (mutation && !connected())) { notify('Die Verbindung zum Channel fehlt. Bitte öffne MischWerk erneut.', true); return; }
    if (mutation && pending) { return; }
    data = data || {};
    var requestId;
    if (mutation) {
      if (type === 'mw:onAir' || type === 'mw:offAir') { data.expectedModerator = state.moderator ? state.moderator.sessionKey || String(state.moderator.since) : null; }
      if (type === 'mw:setTopic') { data.previousTopic = state.topic; }
      if (type === 'mw:setRequests') { data.previousEnabled = state.requestsEnabled; }
      if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') { data.expectedRadioModeratorRevision = state.radioModeratorRevision; }
      requestId = 'mw-' + Date.now().toString(36) + '-' + (++requestSequence) + '-' + Math.random().toString(36).slice(2, 10);
      data.requestId = requestId;
      pending = { type: type, requestId: requestId }; renderAvailability();
      if (type === 'mw:setTopic') {
        topicRequest = { requestId: requestId, value: data.topic };
        topicFeedback('Thema wird gespeichert …', false);
      }
      pendingTimer = setTimeout(function () {
        pending = null; renderAvailability();
        if (type === 'mw:setTopic') { topicFeedback('Noch keine Bestätigung. Bitte erneut prüfen und speichern.', true); }
        else { notify('Noch keine Bestätigung erhalten. Bitte aktualisiere vor einem erneuten Versuch.', true); }
        send('mw:refresh', {}, false);
      }, 15000);
    }
    try { bridge.sendEvent(type, data); }
    catch (error) {
      if (mutation && pending && pending.requestId === requestId) { pending = null; clearTimeout(pendingTimer); }
      renderAvailability();
      if (type === 'mw:setTopic') { topicFeedback('Speichern nicht bestätigt. Bitte erneut versuchen.', true); }
      else { notify('Verbindung unterbrochen. Bitte erneut öffnen.', true); }
    }
  }
  function sameWish(a, b) { return a.text === b.text; }
  function submitWish(data) {
    if (!bridge || !connected()) { showWishFeedback('Die Verbindung zum Channel fehlt. Bitte öffne MischWerk erneut.', true); return; }
    if (wishPending) { return; }
    var submissionId = 'wish-' + Date.now().toString(36) + '-' + (++requestSequence) + '-' + Math.random().toString(36).slice(2, 10);
    if (lastWish && sameWish(data, lastWish.data)) { submissionId = lastWish.submissionId; }
    lastWish = { submissionId: submissionId, data: { text: data.text } };
    wishPending = { submissionId: submissionId };
    feedbackRequest = null;
    showWishFeedback('Wird gesendet …', false, true);
    renderAvailability();
    clearTimeout(wishTimer);
    wishTimer = setTimeout(function () {
      if (!wishPending || wishPending.submissionId !== submissionId) { return; }
      wishPending = null;
      renderAvailability();
      showWishFeedback('Noch keine Bestätigung. Bitte erneut prüfen.', true);
      send('mw:refresh', {}, false);
    }, 15000);
    try { bridge.sendEvent('mw:wish.submit', { submissionId: submissionId, text: data.text }); }
    catch (error) {
      wishPending = null;
      clearTimeout(wishTimer);
      renderAvailability();
      showWishFeedback('Senden nicht bestätigt. Bitte erneut prüfen.', true);
    }
  }
  function topicFeedback(message, error) {
    var box = el('topic-feedback');
    box.textContent = message; box.hidden = !message; box.classList.toggle('error', !!error);
    resizeDialog();
  }
  function renderTopic() {
    var topic = typeof state.topic === 'string' ? state.topic.trim() : '';
    document.documentElement.classList.toggle('has-topic', !!topic);
    setText('show-topic', topic); el('radio-topic').hidden = !topic;
    updateMetadataLayout();
    if (!topicDirty) { el('studio-topic').value = topic; }
  }
  function containsWishLink(value) {
    var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
    try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
    if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/i.test(candidate)) { return true; }
    return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/i.test(candidate) ||
      /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/i.test(candidate);
  }
  function wishValues() { return { text: el('wish-text').value.trim() }; }
  function showWishFeedback(message, error, pendingFeedback) {
    var box = el('wish-feedback');
    box.className = 'wish-feedback' + (error ? ' error' : pendingFeedback ? ' pending' : ' success');
    box.setAttribute('role', error ? 'alert' : 'status');
    box.setAttribute('aria-live', error ? 'assertive' : 'polite');
    box.textContent = message; box.hidden = false;
    resizeDialog();
  }
  function requestText(item) {
    return typeof item.text === 'string' ? item.text :
      [item.artist, item.title].filter(Boolean).join(' – ') + (item.message ? ' · ' + item.message : '');
  }
  function deliveryText(item) {
    if (item.delivery) { return 'Wunsch an ' + item.delivery.nick + ' übergeben.'; }
    return state && state.moderator ? 'Wunsch erfolgreich gespeichert – wartet auf ' + state.moderator.nick + '.' :
      'Wunsch erfolgreich gespeichert – wartet auf Moderation.';
  }
  function acknowledgeQueue() {
    if (uiView !== 'studio' || !state || !state.user.canModerate || !connected() || document.hidden) { return; }
    requestAnimationFrame(function () {
      var list = el('request-queue');
      if (!list.getClientRects().length || document.hidden) { return; }
      state.queue.forEach(function (item) {
        if (item.delivery || (receiptAttempts[item.id] && Date.now() - receiptAttempts[item.id] < 15000)) { return; }
        receiptAttempts[item.id] = Date.now();
        send('mw:ackRequest', { id: item.id }, false);
      });
    });
  }
  function element(tag, className, text) {
    var node = document.createElement(tag); if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; } return node;
  }
  function time(timestamp) { return new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  function renderWishFeedback() {
    if (feedbackRequest) {
      if (state.requestFeedback && state.requestFeedback.id === feedbackRequest.id) { feedbackRequest = state.requestFeedback; }
      state.myRequests.forEach(function (item) { if (feedbackRequest.id === item.id) { feedbackRequest = item; } });
      showWishFeedback(deliveryText(feedbackRequest), false);
    }
  }
  function renderQueue() {
    var list = el('request-queue');
    var key = JSON.stringify([!!state.user.canModerate, state.user.canModerate ? state.queue.map(function (item) {
      return [item.id, item.nick, item.createdAt, requestText(item)];
    }) : []]);
    setText('queue-count', state.queueTotal);
    setText('page-label', 'Wunsch ' + (page + 1) + ' / ' + state.pages);
    el('queue-pagination').hidden = !state.queueTotal || !state.user.canModerate;
    // Gleiche sichtbare Angaben nicht alle 20 Sekunden neu erstellen: Tastaturfokus bleibt erhalten.
    if (key === queueKey) { return; }
    queueKey = key;
    var hadFocus = list.contains(document.activeElement);
    list.textContent = '';
    if (!state.user.canModerate) { return; }
    if (!state.queue.length) { list.appendChild(element('p', 'empty-copy', 'Aktuell keine Musikwünsche.')); }
    state.queue.forEach(function (item) {
      var row = element('article', 'queue-item');
      var copy = element('div', 'queue-copy');
      copy.appendChild(element('p', 'request-sender', 'Von ' + item.nick + ' · ' + time(item.createdAt) + ' Uhr'));
      copy.appendChild(element('h3', 'request-text', requestText(item)));
      var actions = element('div', 'queue-actions');
      ['Erledigt', 'Verwerfen'].forEach(function (label, i) {
        var button = element('button', i === 0 ? 'primary-button' : 'secondary-button', label);
        button.type = 'button'; button.dataset.resolve = String(item.id);
        button.dataset.outcome = i === 0 ? 'done' : 'discarded';
        button.title = i === 0 ? 'Diesen Wunsch als erledigt entfernen' : 'Diesen Wunsch verwerfen';
        button.addEventListener('click', function () { send('mw:resolveRequest', { id: item.id, outcome: button.dataset.outcome }, true); });
        actions.appendChild(button);
      });
      row.appendChild(copy); row.appendChild(actions); list.appendChild(row);
    });
    if (hadFocus) { el('queue-heading').focus(); }
  }
  function renderRadioTeam() {
    var list = el('radio-moderator-list');
    list.textContent = '';
    setText('radio-moderator-count', state.radioModeratorTotal);
    setText('radio-moderator-page-label', 'Seite ' + (state.radioModeratorPage + 1) + ' / ' + state.radioModeratorPages);
    el('radio-moderator-pagination').hidden = state.radioModeratorPages <= 1;
    if (!state.user.canManageRadioModerators) { return; }
    if (!state.radioModerators.length) {
      list.appendChild(element('p', 'empty-copy', 'Noch keine Radiomoderatoren ernannt.'));
      return;
    }
    state.radioModerators.forEach(function (item) {
      var row = element('div', 'team-member');
      row.appendChild(element('strong', '', item.nick));
      var button = element('button', 'secondary-button', 'Entfernen');
      button.type = 'button';
      button.dataset.radioModeratorId = String(item.userId);
      button.title = item.nick + ' den Studiozugriff entziehen';
      button.addEventListener('click', function () {
        send('mw:removeRadioModerator', { userId: item.userId }, true);
      });
      row.appendChild(button);
      list.appendChild(row);
    });
  }
  function renderAvailability() {
    if (!state) { return; }
    var live = connected();
    var limits = state.limits || { maxTextLength: 300 };
    var enabled = live && state.requestsEnabled;
    el('wish-text').maxLength = limits.maxTextLength || 300;
    el('wish-fields').disabled = !enabled || !!pending || !!wishPending;
    el('open-wishes').classList.toggle('wishes-closed', !state.requestsEnabled);
    setText('wish-button-caption', !state.requestsEnabled ? 'Deaktiviert' : !live ? 'Verbindung fehlt' : 'Dein Musikwunsch');
    el('open-wishes').title = !state.requestsEnabled ? 'Die Wunschbox ist deaktiviert.' : !live ? 'Verbindung zum Channel fehlt' : 'Wunschbox öffnen und einen Musikwunsch senden';
    setText('wish-status', !state.requestsEnabled ? 'WUNSCHBOX DEAKTIVIERT' : enabled ? 'WUNSCHBOX OFFEN' : 'VERBINDUNG FEHLT');
    el('wish-status').classList.toggle('green-pill', enabled);
    var hint = '';
    setText('studio-queue-tab', 'Wünsche (' + state.queueTotal + ')');
    if (!live) { hint = 'Verbindung zum Channel unterbrochen. Bitte öffne MischWerk erneut.'; }
    else if (!enabled) { hint = 'Wunschbox deaktiviert.'; }
    setText('wish-hint', hint);
    el('wish-hint').hidden = !hint;
    el('open-wishes').disabled = !enabled || !!pending || !!wishPending;
    el('open-wishes').setAttribute('aria-disabled', String(el('open-wishes').disabled));
    el('studio-tab').disabled = !live || !!pending || !state.user.canModerate;
    el('team-tab').disabled = !live || !!pending || !state.user.canManageRadioModerators;
    el('studio-topic').disabled = !live || !!pending || !state.user.canModerate;
    el('studio-topic').maxLength = limits.maxTopicLength || 80;
    el('save-topic').disabled = el('studio-topic').disabled || !topicDirty;
    ['on-air', 'off-air', 'toggle-wishes'].forEach(function (id) { el(id).disabled = !!pending || !live || !state.user.canModerate; });
    el('off-air').disabled = el('off-air').disabled || !state.user.canEndModeration;
    setText('on-air', state.user.isOnAir ? 'Anmeldung verlängern' : 'Moderation übernehmen');
    setText('off-air', state.moderator && !state.user.isOnAir ? 'Moderation beenden' : 'Abmelden');
    el('on-air').title = state.user.isOnAir ? 'Deine Studio-Anmeldung erneut für bis zu sechs Stunden bestätigen' : state.moderator ? 'Moderation von ' + state.moderator.nick + ' übernehmen' : 'Dich als Moderation in der Channel-Leiste anzeigen';
    el('off-air').title = !state.moderator ? 'Niemand ist als Moderation angemeldet' : state.user.canEndModeration ? 'Studio-Anmeldung beenden' : 'Nur die aktive Moderation oder der Channel-Besitzer kann abmelden';
    setText('studio-connection', live ? 'Verbunden' : 'Verbindung fehlt');
    el('studio-connection').classList.toggle('connection-lost', !live);
    el('studio-connection').title = live ? 'Verbindung zum Knuddels-Channel bestätigt' : 'Aktionen gesperrt. Aktualisieren oder das Fenster erneut öffnen.';
    var expiresAt = state.moderator && state.moderator.expiresAt;
    el('studio-session').hidden = !expiresAt;
    setText('studio-session', expiresAt ? 'Angemeldet bis ' + time(expiresAt) + ' Uhr' : '');
    el('prev-page').disabled = !!pending || !live || !state.user.canModerate || page <= 0;
    el('next-page').disabled = !!pending || !live || !state.user.canModerate || page >= state.pages - 1;
    document.querySelectorAll('[data-resolve]').forEach(function (button) { button.disabled = !!pending || !live || !state.user.canModerate; });
    el('radio-moderator-nick').disabled = !!pending || !live || !state.user.canManageRadioModerators;
    el('add-radio-moderator').disabled = el('radio-moderator-nick').disabled;
    el('refresh-radio-team').disabled = !live || !!pending || !state.user.canManageRadioModerators;
    el('prev-radio-moderator-page').disabled = !live || !!pending || !state.user.canManageRadioModerators || state.radioModeratorPage <= 0;
    el('next-radio-moderator-page').disabled = !live || !!pending || !state.user.canManageRadioModerators || state.radioModeratorPage >= state.radioModeratorPages - 1;
    document.querySelectorAll('[data-radio-moderator-id]').forEach(function (button) {
      button.disabled = !!pending || !live || !state.user.canManageRadioModerators;
    });
    el('toggle-wishes').setAttribute('aria-checked', String(state.requestsEnabled));
    setText('toggle-label', state.requestsEnabled ? 'Wunschbox deaktivieren' : 'Wunschbox aktivieren');
    setText('studio-wish-state', state.requestsEnabled ? 'Wunschbox aktiviert' : 'Wunschbox deaktiviert');
    renderOnAirStatus();
    renderStreamStatus();
    resizeDialog();
  }
  function receive(next) {
    if (!next || !next.user || !next.station || !Array.isArray(next.myRequests) || !Array.isArray(next.queue)) { return; }
    if (state && typeof state.revision === 'number' && typeof next.revision === 'number' && next.revision < state.revision) { return; }
    var oldStation = state && JSON.stringify(state.station);
    next.radioModerators = Array.isArray(next.radioModerators) ? next.radioModerators : [];
    next.radioModeratorTotal = typeof next.radioModeratorTotal === 'number' ? next.radioModeratorTotal : next.radioModerators.length;
    next.radioModeratorPage = typeof next.radioModeratorPage === 'number' ? next.radioModeratorPage : 0;
    next.radioModeratorPages = typeof next.radioModeratorPages === 'number' ? next.radioModeratorPages : 1;
    next.radioModeratorRevision = typeof next.radioModeratorRevision === 'number' ? next.radioModeratorRevision : 0;
    next.user.canManageRadioModerators = next.user.canManageRadioModerators === true;
    state = next; page = next.page; lastStateAt = Date.now();
    el('studio-tab').hidden = !state.user.canModerate;
    el('team-tab').hidden = !state.user.canManageRadioModerators;
    renderView();
    var host = state.moderator ? state.moderator.nick : 'Radio Mischwerk';
    setText('host-name', host); setText('studio-host', state.moderator ? host + ' ist am Mikrofon' : 'Keine Moderation angemeldet');
    var radioUrls = radioKingUrls(state.station);
    el('play-button').disabled = !radioUrls;
    if (radioUrls && uiView === 'radio') {
      el('station-link').hidden = false; el('station-link').href = radioUrls.stream;
      if (oldStation !== JSON.stringify(state.station)) {
        stopPlayback(); streamPhase = 'ready'; setText('playback-status', 'Bereit, wenn du es bist. Drücke Play.');
        metadataGeneration += 1; metadataStation = state.station; lastSong = null; providerStatus = 'checking';
        renderSong(null);
        pollMetadata();
      }
    } else if (uiView === 'radio') {
      clearTimeout(metadataTimer); metadataGeneration += 1; metadataStation = null; lastSong = null; providerStatus = 'unknown';
      stopPlayback(); el('station-link').hidden = true;
      renderSong(null);
      setText('metadata-status', 'Sobald der Sender bereit ist, erscheint hier der aktuelle Titel.');
      setText('playback-status', 'Der Sender wird noch eingerichtet.');
    }
    renderTopic(); renderWishFeedback(); renderQueue(); renderRadioTeam(); renderAvailability(); acknowledgeQueue();
  }
  function getResponse(url) {
    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest(); request.open('GET', url, true); request.timeout = 10000;
      request.onload = function () {
        if (request.status < 200 || request.status >= 300) { reject(new Error('http')); return; }
        resolve(request.responseText);
      };
      request.onerror = request.ontimeout = function () { reject(new Error('network')); };
      request.send();
    });
  }
  function radioKingUrls(station) {
    if (!station || !station.configured || station.provider !== 'radioking' ||
        typeof station.radioId !== 'string' || station.radioId.length > 120 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(station.radioId)) { return null; }
    var stream = 'https://play.radioking.io/' + station.radioId;
    var metadata = 'https://api.radioking.io/widget/radio/' + station.radioId + '/track/current';
    // Nur die zum bestätigten Radio gehörenden öffentlichen Endpunkte zulassen.
    if (station.streamUrl !== stream || station.metadataUrl !== metadata) { return null; }
    return { stream: stream, metadata: metadata, status: 'https://api.radioking.io/widget/radio/' + station.radioId };
  }
  function fetchProviderStatus(station) {
    return getResponse(radioKingUrls(station).status).then(function (text) {
      var data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || data.status === 'error' || data.slug !== station.radioId) { throw new Error('invalid RadioKing station'); }
      // Kontostatus active und live/is_live sagen nichts über AutoDJ oder Sendepause aus.
      return data.stream_status === 'started' || data.stream_status === 'stopped' ? data.stream_status : 'unknown';
    }).catch(function () { return 'unknown'; });
  }
  function applyProviderStatus(status) {
    var previous = providerStatus;
    providerStatus = status;
    if (status === 'stopped') {
      if (previous !== 'stopped' || wantedPlayback) { stopPlayback(); }
      lastSong = null; renderSong(null);
      setText('playback-status', 'RadioKing meldet den Sender als gestoppt. Der Status wird automatisch erneut geprüft.');
    } else if (previous === 'stopped') {
      streamPhase = 'ready';
      setText('playback-status', status === 'started' ? 'Der Sender ist wieder bereit. Drücke Play zum Zuhören.' : 'Senderstatus nicht prüfbar. Du kannst die Wiedergabe versuchen.');
    }
    renderStreamStatus();
  }
  function parseMetadata(text) {
    var data = JSON.parse(text);
    if (data === null) { return { title: '', artist: { name: '' } }; }
    if (typeof data !== 'object' || Array.isArray(data) || data.error || data.status === 'error' ||
        (!Object.prototype.hasOwnProperty.call(data, 'title') && !Object.prototype.hasOwnProperty.call(data, 'artist'))) {
      throw new Error('invalid RadioKing metadata');
    }
    // RadioKing liefert getrennte Felder. Bindestriche in Titeln/Interpreten unverändert lassen.
    return { title: typeof data.title === 'string' ? data.title.trim() : '',
      artist: { name: typeof data.artist === 'string' ? data.artist.trim() : '' } };
  }
  function fetchMetadata(station, generation) {
    var urls = radioKingUrls(station);
    if (generation !== metadataGeneration || !urls) { return Promise.reject(new Error('metadata unavailable')); }
    return getResponse(urls.metadata).then(parseMetadata);
  }
  function updateMetadataLayout() {
    var root = document.documentElement;
    var title = !el('track-title').hidden;
    var artist = !document.querySelector('.artist-copy').hidden;
    var topic = !el('radio-topic').hidden;
    root.classList.toggle('has-title', title);
    root.classList.toggle('has-artist', artist);
    root.classList.toggle('single-track', title !== artist);
    root.classList.toggle('no-track', !title && !artist);
    root.classList.toggle('no-metadata', !title && !artist && !topic);
  }
  function renderSong(song) {
    song = song && typeof song === 'object' ? song : {};
    var title = typeof song.title === 'string' ? song.title.trim() : '';
    var artist = song.artist && typeof song.artist.name === 'string' ? song.artist.name.trim() : '';
    setText('track-title', title); setText('track-artist', artist);
    el('track-title').hidden = !title; el('track-label').hidden = !title;
    document.querySelector('.artist-copy').hidden = !artist;
    document.querySelector('.track-row').hidden = !title && !artist;
    setText('track-label', song.type === 'ad' ? 'Titel · Werbung' : 'Titel');
    updateMetadataLayout();
  }
  function pollMetadata() {
    clearTimeout(metadataTimer);
    if (!metadataStation) { return Promise.resolve(); }
    var generation = ++metadataGeneration;
    if (document.hidden) { metadataTimer = setTimeout(pollMetadata, 30000); return Promise.resolve(); }
    var station = metadataStation;
    return fetchProviderStatus(station).then(function (status) {
      if (generation !== metadataGeneration) { return; }
      applyProviderStatus(status);
      if (status === 'stopped') {
        setText('metadata-status', 'Sender bei RadioKing gestoppt. Automatische Prüfung alle 30 Sekunden.');
        return;
      }
      return fetchMetadata(station, generation).then(function (song) {
        if (generation !== metadataGeneration) { return; }
        renderSong(song); lastSong = song;
        setText('metadata-status', 'Titelanzeige von RadioKing · zuletzt aktualisiert um ' + time(Date.now()) + '. Titel und Audio können zeitversetzt sein.');
      });
    }).catch(function () {
      if (generation !== metadataGeneration) { return; }
      if (!lastSong) { renderSong(null); }
      setText('metadata-status', 'Musikdaten sind gerade nicht erreichbar. ' + (lastSong ? 'Die letzte Titelanzeige kann veraltet sein. ' : '') + 'Der Player kann trotzdem funktionieren.');
    }).then(function () { if (generation === metadataGeneration) { metadataTimer = setTimeout(pollMetadata, 30000); } });
  }
  function renderOnAirStatus() {
    var active = connected() && !!state.moderator;
    var description = active ? 'On Air: ' + state.moderator.nick + ' ist als Moderation angemeldet.' :
      state && state.moderator ? 'On-Air-Status unbestätigt: Verbindung zum Channel unterbrochen.' : 'Off Air: Keine Moderation angemeldet.';
    document.body.classList.toggle('moderator-on-air', active);
    el('on-air-sign').setAttribute('aria-label', description);
    el('on-air-sign').title = description;
  }
  function renderStreamStatus() {
    var urls = state && radioKingUrls(state.station);
    var offline = providerStatus === 'stopped';
    var checking = providerStatus === 'checking';
    var label = !state ? 'Verbinde …' : !urls ? 'In Vorbereitung' : offline ? 'Sendepause' : streamPhase === 'playing' ? 'LIVE' : streamPhase === 'connecting' ? 'Verbinden' : checking ? 'Prüfe …' : streamPhase === 'error' ? 'Streamfehler' : !connected() ? 'Getrennt' : providerStatus === 'unknown' ? 'Status unbekannt' : streamPhase === 'stopped' ? 'Gestoppt' : 'Bereit';
    setText('stream-label', label);
    var description = !urls ? 'Der RadioKing-Hörerstream ist noch nicht eingerichtet.' : offline ? 'Der Sender ist bei RadioKing gestoppt. Automatische Prüfung alle 30 Sekunden.' : checking ? 'Der Senderstatus bei RadioKing wird geprüft.' : providerStatus === 'unknown' && streamPhase !== 'playing' ? 'Senderstatus momentan nicht prüfbar. Du kannst die Wiedergabe versuchen.' : 'Status deiner Radio-Wiedergabe: ' + label;
    el('stream-badge').title = description;
    el('play-button').disabled = uiView !== 'radio' || !urls || offline || (checking && !wantedPlayback);
    el('play-button').setAttribute('aria-disabled', String(el('play-button').disabled));
    el('play-button').classList.toggle('is-offline', !!urls && offline);
    el('play-button').title = description;
    el('play-button').setAttribute('aria-label', offline ? 'Radio pausiert: Sender bei RadioKing gestoppt' : checking ? 'Senderstatus wird geprüft' : wantedPlayback ? 'Radio stoppen' : 'Radio abspielen');
    el('stream-badge').classList.toggle('is-idle', label !== 'LIVE');
    document.body.classList.toggle('playing', streamPhase === 'playing');
  }
  function playbackUi(playing, status) {
    setText('play-icon', playing ? 'Ⅱ' : '▶'); el('play-button').setAttribute('aria-label', playing ? 'Radio stoppen' : 'Radio abspielen');
    el('play-button').setAttribute('aria-pressed', String(playing));
    renderStreamStatus();
    if (status) { setText('playback-status', status); }
  }
  function stopPlayback() {
    wantedPlayback = false; streamPhase = 'stopped'; playbackAttempt += 1; clearTimeout(playbackTimer); audio.pause(); audio.removeAttribute('src'); audio.load();
    playbackUi(false);
  }
  function playbackFailed() {
    if (!wantedPlayback) { return; }
    stopPlayback(); streamPhase = 'error'; renderStreamStatus(); setText('playback-status', 'Der Stream ist gerade nicht erreichbar. Bitte erneut versuchen.');
    var attempt = playbackAttempt;
    pollMetadata().then(function () {
      if (attempt === playbackAttempt && streamPhase === 'error' && providerStatus !== 'stopped') { notify('Der Stream ist gerade nicht erreichbar. Bitte versuche es erneut.', true); }
    });
  }
  function startPlayback() {
    wantedPlayback = true; streamPhase = 'connecting'; var attempt = ++playbackAttempt;
    playbackUi(true, 'Verbinde mit dem Stream …');
    clearTimeout(playbackTimer); playbackTimer = setTimeout(playbackFailed, 20000);
    function playResolvedStream() {
      if (!wantedPlayback || attempt !== playbackAttempt) { return; }
      var source = radioKingUrls(state && state.station);
      if (!source) { playbackFailed(); return; }
      audio.src = source.stream;
      try {
        var promise = audio.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () { if (attempt === playbackAttempt) { playbackFailed(); } });
        }
      } catch (error) { if (attempt === playbackAttempt) { playbackFailed(); } }
    }
    playResolvedStream();
  }
  el('play-button').addEventListener('click', function () {
    if (!state || !radioKingUrls(state.station) || el('play-button').disabled || providerStatus === 'stopped') { return; }
    if (wantedPlayback) { stopPlayback(); setText('playback-status', 'Gestoppt. Dein Mix wartet auf dich.'); return; }
    startPlayback();
  });
  function bindAudioEvents(target) {
    target.addEventListener('playing', function () { if (target === audio && wantedPlayback) { streamPhase = 'playing'; clearTimeout(playbackTimer); playbackUi(true, 'Du hörst MischWerk. Schön, dass du da bist.'); } });
    function buffering() {
      if (target !== audio || !wantedPlayback) { return; }
      streamPhase = 'connecting'; renderStreamStatus(); setText('playback-status', 'Der Stream lädt nach …');
      clearTimeout(playbackTimer); playbackTimer = setTimeout(playbackFailed, 20000);
    }
    target.addEventListener('waiting', buffering); target.addEventListener('stalled', buffering);
    target.addEventListener('pause', function () {
      if (target === audio && wantedPlayback) { stopPlayback(); setText('playback-status', 'Wiedergabe unterbrochen. Drücke Play, um erneut zu starten.'); }
    });
    target.addEventListener('error', function () { if (target === audio) { playbackFailed(); } });
    target.addEventListener('ended', function () { if (target === audio) { playbackFailed(); } });
  }
  bindAudioEvents(audio);
  function setVolume(level) {
    level = Number(level); if (!isFinite(level)) { return; }
    level = Math.max(0, Math.min(1, level)); audio.volume = level;
    if (level > 0) { lastAudibleVolume = level; }
    var percent = Math.round(level * 100); el('volume').value = String(percent);
    var warningStart = HIGH_VOLUME_THRESHOLD * 100;
    var high = level > HIGH_VOLUME_THRESHOLD;
    el('volume').style.setProperty('--volume', percent + '%');
    el('volume').style.setProperty('--volume-low', Math.min(percent, warningStart) + '%');
    el('volume').style.setProperty('--volume-high', Math.max(percent, warningStart) + '%');
    el('volume').style.setProperty('--volume-warning-start', warningStart + '%');
    document.querySelector('.volume-control').classList.toggle('is-high', high);
    setText('volume-value', percent + ' %');
    el('volume').setAttribute('aria-valuetext', percent + ' Prozent' + (high ? '. Hohe Playerlautstärke. Hörpegel am Gerät prüfen.' : '. Keine Dezibel-Messung.'));
    el('volume').title = high ? 'Hohe Lautstärke kann das Gehör schädigen. Systemlautstärke und Kopfhörer prüfen; dies ist keine dB-Messung.' : 'Playerlautstärke. Der rote Bereich über 60 % ist ein Vorsichtshinweis, keine gemessene dB-Grenze.';
    el('volume-value').title = el('volume').title;
    el('mute-button').setAttribute('aria-pressed', String(level === 0));
    el('mute-button').setAttribute('aria-label', level === 0 ? 'Ton einschalten' : 'Ton ausschalten');
    // Hohe Werte nur für die laufende Sitzung: beim erneuten Öffnen kein automatischer Sprung auf 100 %.
    try { localStorage.setItem('mischwerk.volume.v1', String(Math.min(level, HIGH_VOLUME_THRESHOLD))); } catch (error) { /* Lokale Speicherung ist optional. */ }
  }
  el('volume').addEventListener('input', function () { setVolume(Number(this.value) / 100); });
  el('mute-button').addEventListener('click', function () { setVolume(audio.volume === 0 ? lastAudibleVolume : 0); });
  var initialVolume = .4;
  try { var savedVolume = localStorage.getItem('mischwerk.volume.v1'); if (savedVolume !== null && savedVolume !== '' && isFinite(Number(savedVolume))) { initialVolume = Math.min(Number(savedVolume), HIGH_VOLUME_THRESHOLD); } } catch (error) { /* Auch ohne Speicher bedienbar. */ }
  setVolume(initialVolume);
  el('open-wishes').addEventListener('click', function () {
    if (!state || !state.requestsEnabled || !connected() || el('open-wishes').disabled) { return; }
    send('mw:openWishes', {}, true);
  });
  el('studio-tab').addEventListener('click', function () { send('mw:openStudio', {}, true); });
  el('team-tab').addEventListener('click', function () { send('mw:openRadioTeam', {}, true); });
  el('wish-text').addEventListener('input', fitWishText);
  el('studio-controls-tab').addEventListener('click', function () { switchPane('studio-panel', 'show-queue', 'studio-controls-tab', 'studio-queue-tab', false); });
  el('studio-queue-tab').addEventListener('click', function () { switchPane('studio-panel', 'show-queue', 'studio-controls-tab', 'studio-queue-tab', true); });
  el('wish-form').addEventListener('submit', function (event) {
    event.preventDefault();
    if (el('wish-fields').disabled || !this.reportValidity()) { return; }
    var values = wishValues();
    if (containsWishLink(values.text)) { feedbackRequest = null; showWishFeedback('Nur Interpret + Titel. Keine Links.', true); return; }
    submitWish(values);
  });
  el('on-air').addEventListener('click', function () { send('mw:onAir', {}, true); });
  el('off-air').addEventListener('click', function () { send('mw:offAir', {}, true); });
  el('studio-topic').addEventListener('input', function () { topicDirty = true; topicFeedback('', false); renderAvailability(); });
  el('topic-form').addEventListener('submit', function (event) {
    event.preventDefault();
    if (el('save-topic').disabled || !this.reportValidity()) { return; }
    send('mw:setTopic', { topic: el('studio-topic').value }, true);
  });
  el('toggle-wishes').addEventListener('click', function () { send('mw:setRequests', { enabled: !state.requestsEnabled }, true); });
  el('radio-moderator-form').addEventListener('submit', function (event) {
    event.preventDefault();
    if (el('add-radio-moderator').disabled || !this.reportValidity()) { return; }
    send('mw:addRadioModerator', { nick: el('radio-moderator-nick').value }, true);
  });
  el('refresh-radio-team').addEventListener('click', function () { send('mw:refresh', {}); });
  el('prev-radio-moderator-page').addEventListener('click', function () { send('mw:refresh', { radioModeratorPage: state.radioModeratorPage - 1 }); });
  el('next-radio-moderator-page').addEventListener('click', function () { send('mw:refresh', { radioModeratorPage: state.radioModeratorPage + 1 }); });
  el('prev-page').addEventListener('click', function () { send('mw:refresh', { page: page - 1 }); });
  el('next-page').addEventListener('click', function () { send('mw:refresh', { page: page + 1 }); });
  el('refresh-queue').addEventListener('click', function () { send('mw:refresh', {}); });
  if (bridge) {
    bridge.addEventListener('mw:state', function (event) { receive(event.data); });
    bridge.addEventListener('mw:wish.receipt', function (event) {
      var receipt = event.data || {};
      if (!lastWish || receipt.submissionId !== lastWish.submissionId) { return; }
      if (wishPending && wishPending.submissionId === receipt.submissionId) { wishPending = null; }
      clearTimeout(wishTimer);
      if (receipt.accepted) {
        if (sameWish(wishValues(), lastWish.data)) { el('wish-form').reset(); fitWishText(); }
        lastWish = null;
        feedbackRequest = receipt.request || null;
      }
      showWishFeedback(receipt.accepted && feedbackRequest ? deliveryText(feedbackRequest) : receipt.message,
        !receipt.accepted);
      renderAvailability();
    });
    bridge.addEventListener('mw:result', function (event) {
      var response = event.data || {};
      var current = pending && response.requestId === pending.requestId && response.action === pending.type;
      if (!current) { return; }
      if (current) { pending = null; clearTimeout(pendingTimer); }
      if (current && response.action === 'mw:setTopic') {
        if (response.ok && topicRequest && topicRequest.value === el('studio-topic').value) { topicDirty = false; }
        topicRequest = null;
        topicFeedback(response.message || (response.ok ? 'Thema gespeichert.' : 'Thema konnte nicht gespeichert werden.'), !response.ok);
      }
      if (current && response.ok && response.action === 'mw:addRadioModerator') {
        el('radio-moderator-form').reset();
      }
      renderAvailability();
      if (response.action !== 'mw:setTopic' && (!response.ok ||
          (response.action !== 'mw:openWishes' && response.action !== 'mw:openStudio' && response.action !== 'mw:openRadioTeam'))) {
        notify(response.message, !response.ok);
      }
    });
    if (bridge.pageData && bridge.pageData.user) { receive(bridge.pageData); }
    try {
      var frame = bridge.getHostFrame();
      frame.setTitle(uiView === 'wishes' ? 'MischWerk · Wunschbox' : uiView === 'studio' ?
        'MischWerk · Moderation' : uiView === 'team' ? 'MischWerk · Radio-Team' : 'MischWerk · Radio');
      if (uiView !== 'radio' && !bridge.isK3Client()) { frame.setResizable(false); }
    } catch (error) { /* Optionale Beschriftung darf den Player nicht blockieren. */ }
    resizeBar();
    send('mw:ready');
    setInterval(function () { if (!document.hidden) { send('mw:refresh', {}); } }, 20000);
    setInterval(renderAvailability, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { send('mw:refresh', {}); if (metadataStation) { pollMetadata(); } } });
  } else {
    setText('wish-hint', 'Öffne diese App in Knuddels mit /mischwerk oder starte die lokale Vorschau aus dem Projektordner.');
    el('wish-hint').hidden = false;
    setText('metadata-status', 'Diese Oberfläche benötigt die Verbindung zum Knuddels-MyChannel. Eine lokale Demo findest du in Vorschau-starten.cmd.');
  }
  window.addEventListener('pagehide', function () { stopPlayback(); clearTimeout(metadataTimer); metadataGeneration += 1; });
  layoutReady = true;
  if (document.readyState === 'complete') { fitWishText(); }
  else { window.addEventListener('load', fitWishText); }
  window.addEventListener('resize', function () { resizeBar(); fitWishText(); });
  resizeDialog();
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && bridge) { send('mw:refresh', {}); if (metadataStation) { pollMetadata(); } }
  });
}());

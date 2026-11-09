/* Titel, Sendemodus und Übertragung unabhängig lesen; Audio bleibt in radio/connection. */
MischWerkUI.define('provider', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var api = dependencies.api;
  var signals = dependencies.signals;
  var presentation = dependencies.presentation;
  var METADATA_INTERVAL = 5000;
  var STATUS_INTERVAL = 30000;
  var metadataTimer;
  var modeTimer;
  var statusTimer;
  var metadataRequest = null;
  var modeRequest = null;
  var statusRequest = null;
  var generation = 0;
  var active = false;
  var metadataRevision = 0;
  var modeRevision = 0;
  var metadataStation = null;
  var providerStatus = 'unknown';
  var lastSong = null;
  var broadcastMode = null, modeAt = 0, statusAt = 0;
  var metadataMode = null, metadataModeAt = 0;
  function publishBroadcast() {
    var embedded = typeof metadataMode === 'boolean';
    signals.emit('broadcast-status', { status: providerStatus, statusAt: statusAt,
      isLive: embedded ? metadataMode : broadcastMode, modeAt: embedded ? metadataModeAt : modeAt });
  }
  function canReadMetadata() {
    var urls = api.streamUrls(metadataStation);
    return active && urls && !!urls.metadata && !document.hidden && providerStatus !== 'checking' && providerStatus !== 'stopped';
  }
  function pollMetadata() {
    clearTimeout(metadataTimer);
    if (!canReadMetadata()) { return Promise.resolve(); }
    if (metadataRequest) { return metadataRequest; }
    var selected = generation, revision = ++metadataRevision, retry = METADATA_INTERVAL;
    function current() { return selected === generation && revision === metadataRevision && providerStatus !== 'stopped'; }
    var pending = api.fetchMetadata(metadataStation).then(function (song) {
      if (!current()) { return; }
      if (lastSong && typeof song.timestamp === 'number' && typeof lastSong.timestamp === 'number' && song.timestamp < lastSong.timestamp) { return; }
      presentation.renderSong(song); lastSong = song;
      metadataMode = typeof song.isLive === 'boolean' ? song.isLive : null;
      metadataModeAt = metadataMode === null ? 0 : Date.now(); publishBroadcast();
      dom.setText('metadata-status', 'Titelanzeige von Radio Mischwerk · zuletzt aktualisiert um ' + dom.time(Date.now()) + '. Titel und Audio können zeitversetzt sein.');
    }).catch(function () {
      if (!current()) { return; }
      retry = STATUS_INTERVAL;
      metadataMode = null; metadataModeAt = 0; publishBroadcast();
      if (!lastSong) { presentation.renderSong(null); }
      dom.setText('metadata-status', 'Musikdaten sind gerade nicht erreichbar. ' + (lastSong ? 'Die letzte Titelanzeige kann veraltet sein. ' : '') + 'Der Player kann trotzdem funktionieren.');
    }).then(function () {
      if (metadataRequest !== pending) { return; }
      metadataRequest = null;
      if (current() && canReadMetadata()) { metadataTimer = setTimeout(pollMetadata, retry); }
    });
    metadataRequest = pending;
    return pending;
  }
  function canReadMode() {
    var urls = api.streamUrls(metadataStation);
    return canReadMetadata() && urls && !!urls.mode;
  }
  function pollMode() {
    clearTimeout(modeTimer);
    if (!canReadMode()) { return Promise.resolve(); }
    if (modeRequest) { return modeRequest; }
    var selected = generation, revision = ++modeRevision, retry = METADATA_INTERVAL;
    function current() { return selected === generation && revision === modeRevision && canReadMode(); }
    var pending = api.fetchBroadcastMode(metadataStation).then(function (live) {
      if (!current()) { return; }
      broadcastMode = typeof live === 'boolean' ? live : null;
      modeAt = broadcastMode === null ? 0 : Date.now(); publishBroadcast();
    }).catch(function () {
      if (!current()) { return; }
      retry = STATUS_INTERVAL; broadcastMode = null; modeAt = 0; publishBroadcast();
    }).then(function () {
      if (modeRequest !== pending) { return; }
      modeRequest = null;
      // Alte Antworten bleiben verworfen. Nach Rückkehr erst einen frischen Modus lesen.
      if (canReadMode()) { modeTimer = setTimeout(pollMode, current() ? retry : 0); }
    });
    modeRequest = pending;
    return pending;
  }
  function applyProviderStatus(status) {
    var previous = providerStatus;
    providerStatus = status;
    statusAt = Date.now();
    if (status !== 'started') { broadcastMode = null; modeAt = 0; metadataMode = null; metadataModeAt = 0; }
    signals.emit('provider-status', { status: status, previous: previous });
    if (status === 'stopped') {
      clearTimeout(metadataTimer); metadataRevision += 1; metadataRequest = null;
      clearTimeout(modeTimer); modeRevision += 1;
      lastSong = null; presentation.renderSong(null);
      broadcastMode = null; modeAt = 0;
      dom.setText('metadata-status', 'Radio Mischwerk meldet eine Sendepause. Automatische Prüfung alle 30 Sekunden.');
    } else if (previous === 'checking' || previous === 'stopped') { pollMetadata(); pollMode(); }
    publishBroadcast();
  }
  function pollStatus() {
    clearTimeout(statusTimer);
    if (!active || !metadataStation || document.hidden) { return Promise.resolve(); }
    var urls = api.streamUrls(metadataStation);
    if (!urls || !urls.status) { applyProviderStatus('unknown'); return Promise.resolve(); }
    if (statusRequest) { return statusRequest; }
    var selected = generation;
    var pending = api.fetchProviderStatus(metadataStation).then(function (status) {
      if (selected === generation) { applyProviderStatus(status); }
    }).then(function () {
      if (statusRequest !== pending) { return; }
      statusRequest = null;
      if (selected === generation && metadataStation && !document.hidden) {
        statusTimer = setTimeout(pollStatus, STATUS_INTERVAL);
      }
    });
    statusRequest = pending;
    return pending;
  }
  function poll() {
    active = model.view === 'radio' && !!metadataStation && !document.hidden;
    var status = pollStatus();
    if (canReadMetadata()) { pollMetadata(); pollMode(); }
    return status;
  }
  function dispose() {
    active = false;
    clearTimeout(metadataTimer); clearTimeout(modeTimer); clearTimeout(statusTimer);
    generation += 1; metadataRevision += 1; modeRevision += 1;
    metadataRequest = null; statusRequest = null;
    // Einen laufenden Modusabruf bis zum Abschluss behalten, ohne alte Werte neu zuzuordnen.
    broadcastMode = null; modeAt = 0; statusAt = 0; metadataMode = null; metadataModeAt = 0; publishBroadcast();
  }
  function metadataKey(station) {
    var value = Object.assign({}, typeof station === 'string' ? JSON.parse(station) : station);
    delete value.historyUrl; delete value.historyIgnoredTitles;
    return JSON.stringify(value);
  }
  function selectStation(oldStation) {
    var radioUrls = api.streamUrls(model.current().station);
    if (radioUrls && model.view === 'radio') {
      dom.el('station-link').hidden = false; dom.el('station-link').href = radioUrls.stream;
      if (metadataKey(oldStation) !== metadataKey(model.current().station)) {
        dispose(); metadataStation = model.current().station; lastSong = null; providerStatus = 'checking';
        active = !document.hidden;
        presentation.renderSong(null); pollStatus();
      }
    } else if (model.view === 'radio') {
      dispose(); metadataStation = null; lastSong = null; providerStatus = 'unknown';
      dom.el('station-link').hidden = true;
      presentation.renderSong(null);
      dom.setText('metadata-status', 'Sobald der Sender bereit ist, erscheint hier der aktuelle Titel.');
    }
  }
  return { selectStation: selectStation, poll: poll, dispose: dispose,
    hasStation: function () { return !!metadataStation; }, status: function () { return providerStatus; } };
});

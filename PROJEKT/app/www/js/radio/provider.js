/* Senderstatus und Titel mit getrennten Takten; laufende und veraltete Antworten zuordnen. */
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
  var statusTimer;
  var metadataRequest = null;
  var statusRequest = null;
  var generation = 0;
  var metadataRevision = 0;
  var metadataStation = null;
  var providerStatus = 'unknown';
  var lastSong = null;
  function canReadMetadata() {
    var urls = api.streamUrls(metadataStation);
    return urls && !!urls.metadata && !document.hidden && providerStatus !== 'checking' && providerStatus !== 'stopped';
  }
  function pollMetadata() {
    clearTimeout(metadataTimer);
    if (!canReadMetadata()) { return Promise.resolve(); }
    if (metadataRequest) { return metadataRequest; }
    var selected = generation, revision = ++metadataRevision, retry = METADATA_INTERVAL;
    function current() { return selected === generation && revision === metadataRevision && providerStatus !== 'stopped'; }
    var pending = api.fetchMetadata(metadataStation).then(function (song) {
      if (!current()) { return; }
      presentation.renderSong(song); lastSong = song;
      dom.setText('metadata-status', 'Titelanzeige von STREAMPANEL · zuletzt aktualisiert um ' + dom.time(Date.now()) + '. Titel und Audio können zeitversetzt sein.');
    }).catch(function () {
      if (!current()) { return; }
      retry = STATUS_INTERVAL;
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
  function applyProviderStatus(status) {
    var previous = providerStatus;
    providerStatus = status;
    signals.emit('provider-status', { status: status, previous: previous });
    if (status === 'stopped') {
      clearTimeout(metadataTimer); metadataRevision += 1; metadataRequest = null;
      lastSong = null; presentation.renderSong(null);
      dom.setText('metadata-status', 'Sender bei STREAMPANEL gestoppt. Automatische Prüfung alle 30 Sekunden.');
    } else if (previous === 'checking' || previous === 'stopped') { pollMetadata(); }
  }
  function pollStatus() {
    clearTimeout(statusTimer);
    if (!metadataStation || document.hidden) { return Promise.resolve(); }
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
    var status = pollStatus();
    if (canReadMetadata()) { pollMetadata(); }
    return status;
  }
  function dispose() {
    clearTimeout(metadataTimer); clearTimeout(statusTimer);
    generation += 1; metadataRevision += 1;
    metadataRequest = null; statusRequest = null;
  }
  function selectStation(oldStation) {
    var radioUrls = api.streamUrls(model.current().station);
    dom.el('play-button').disabled = !radioUrls;
    if (radioUrls && model.view === 'radio') {
      dom.el('station-link').hidden = false; dom.el('station-link').href = radioUrls.stream;
      if (oldStation !== JSON.stringify(model.current().station)) {
        dispose(); metadataStation = model.current().station; lastSong = null; providerStatus = 'checking';
        signals.emit('station-changed', { configured: true });
        presentation.renderSong(null); pollStatus();
      }
    } else if (model.view === 'radio') {
      dispose(); metadataStation = null; lastSong = null; providerStatus = 'unknown';
      signals.emit('station-changed', { configured: false }); dom.el('station-link').hidden = true;
      presentation.renderSong(null);
      dom.setText('metadata-status', 'Sobald der Sender bereit ist, erscheint hier der aktuelle Titel.');
      dom.setText('playback-status', 'Der Sender wird noch eingerichtet.');
    }
  }
  return { selectStation: selectStation, poll: poll, dispose: dispose,
    hasStation: function () { return !!metadataStation; }, status: function () { return providerStatus; } };
});

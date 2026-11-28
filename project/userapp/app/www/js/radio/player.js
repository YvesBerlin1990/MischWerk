/* Bedienung und Anzeige; die Audioverbindung gehört ausschließlich radio/connection. */
MischWerkUI.define('player', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var api = dependencies.api;
  var provider = dependencies.provider;
  var signals = dependencies.signals;
  var volume = dependencies.volume;
  var connection = dependencies.connection;
  var selectedSource = '';
  var stoppedByUser = false;
  var messages = {
    stopped: 'Bereit, wenn du es bist. Drücke Play.',
    connecting: 'Verbinde mit dem Stream …',
    playing: 'Du hörst MischWerk. Schön, dass du da bist.',
    buffering: 'Die Verbindung stockt kurz. Die Wiedergabe läuft automatisch weiter.',
    reconnecting: 'Verbindung unterbrochen. Wir verbinden dich automatisch wieder.',
    blocked: 'Tippen zum Starten. Der Browser benötigt deine Freigabe.'
  };
  function source() { return api.audioUrl(model.current() && model.current().station) || ''; }
  function renderStatus() {
    var state = connection.state(), url = source();
    var label = !model.current() ? 'Verbinde …' : !url ? 'In Vorbereitung' :
      state.phase === 'playing' ? 'LIVE' : state.phase === 'connecting' ? 'Verbinden' :
      state.phase === 'buffering' ? 'Verbinden' : state.phase === 'reconnecting' ? 'Verbinde erneut' :
      state.phase === 'blocked' ? 'Tippen zum Starten' : provider.status() === 'stopped' ? 'Sendepause' :
      stoppedByUser ? 'Gestoppt' : !model.connected() ? 'Getrennt' : 'Bereit';
    var description = !url ? 'Der Hörerstream von Radio Mischwerk ist noch nicht eingerichtet.' :
      state.wanted ? messages[state.phase] : provider.status() === 'stopped' ?
        'Radio Mischwerk meldet eine Sendepause. Du kannst die Wiedergabe versuchen.' : messages[state.phase];
    var button = dom.el('play-button');
    button.disabled = model.view !== 'radio' || !url;
    button.setAttribute('aria-disabled', String(button.disabled));
    button.setAttribute('aria-pressed', String(state.wanted));
    button.setAttribute('aria-label', state.wanted ? 'Radio stoppen' : 'Radio abspielen');
    button.classList.toggle('is-offline', !state.wanted && provider.status() === 'stopped');
    button.title = button.getAttribute('aria-label');
    dom.setText('stream-label', label);
    dom.el('stream-badge').setAttribute('aria-label', description);
    dom.el('stream-badge').classList.toggle('is-idle', label !== 'LIVE');
    document.body.classList.toggle('playing', state.phase === 'playing');
  }
  function stop() {
    stoppedByUser = true;
    connection.stop(); renderStatus();
  }
  function selectSource() {
    var next = source();
    if (selectedSource !== next) { connection.stop(); selectedSource = next; stoppedByUser = false; }
    renderStatus();
  }
  function start() {
    connection.bind();
    signals.on('connection-state', renderStatus);
    signals.on('snapshot', selectSource);
    signals.on('provider-status', renderStatus);
    dom.el('play-button').addEventListener('click', function () {
      if (connection.state().wanted) { stop(); return; }
      var url = source();
      if (model.view !== 'radio' || !url) { return; }
      volume.preparePlayback(); selectedSource = url; stoppedByUser = false; connection.start(url);
    });
  }
  return { start: start, stop: stop, renderStatus: renderStatus, playbackPosition: connection.playbackPosition, playbackNow: connection.playbackNow,
    isListening: function () { return connection.state().wanted; } };
});

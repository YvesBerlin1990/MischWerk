/* Native Wiedergabe, Medienereignisse, Versuchszuordnung und Playerstatus. */
MischWerkUI.define('player', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var api = dependencies.api;
  var provider = dependencies.provider;
  var layout = dependencies.layout;
  var signals = dependencies.signals;
  var audio = dependencies.audio;
  var volume = dependencies.volume;
  var wantedPlayback = false;
  var playbackTimer;
  var playbackAttempt = 0;
  var streamPhase = 'ready';
  function renderStreamStatus() {
    var urls = model.current() && api.streamUrls(model.current().station);
    var offline = provider.status() === 'stopped';
    var checking = provider.status() === 'checking';
    var label = !model.current() ? 'Verbinde …' : !urls ? 'In Vorbereitung' : offline ? 'Sendepause' : streamPhase === 'playing' ? 'LIVE' : streamPhase === 'connecting' ? 'Verbinden' : checking ? 'Prüfe …' : streamPhase === 'error' ? 'Streamfehler' : !model.connected() ? 'Getrennt' : provider.status() === 'unknown' ? 'Status unbekannt' : streamPhase === 'stopped' ? 'Gestoppt' : 'Bereit';
    dom.setText('stream-label', label);
    var description = !urls ? 'Der Hörerstream von Radio Mischwerk ist noch nicht eingerichtet.' : offline ? 'Radio Mischwerk meldet eine Sendepause. Automatische Prüfung alle 30 Sekunden.' : checking ? 'Der Senderstatus von Radio Mischwerk wird geprüft.' : provider.status() === 'unknown' && streamPhase !== 'playing' ? 'Senderstatus momentan nicht prüfbar. Du kannst die Wiedergabe versuchen.' : 'Status deiner Radio-Wiedergabe: ' + label;
    dom.el('stream-badge').title = description;
    dom.el('play-button').disabled = model.view !== 'radio' || !urls || offline || (checking && !wantedPlayback);
    dom.el('play-button').setAttribute('aria-disabled', String(dom.el('play-button').disabled));
    dom.el('play-button').classList.toggle('is-offline', !!urls && offline);
    dom.el('play-button').title = description;
    dom.el('play-button').setAttribute('aria-label', offline ? 'Radio pausiert: Radio Mischwerk meldet eine Sendepause' : checking ? 'Senderstatus wird geprüft' : wantedPlayback ? 'Radio stoppen' : 'Radio abspielen');
    dom.el('stream-badge').classList.toggle('is-idle', label !== 'LIVE');
    document.body.classList.toggle('playing', streamPhase === 'playing');
  }
  
  function playbackUi(playing, status) {
    dom.el('play-button').setAttribute('aria-label', playing ? 'Radio stoppen' : 'Radio abspielen');
    dom.el('play-button').setAttribute('aria-pressed', String(playing));
    renderStreamStatus();
    if (status) { dom.setText('playback-status', status); }
  }
  
  function stopPlayback() {
    wantedPlayback = false; streamPhase = 'stopped'; playbackAttempt += 1; clearTimeout(playbackTimer); audio.pause(); audio.removeAttribute('src'); audio.load();
    signals.emit('playback-reset');
    playbackUi(false);
  }
  
  function playbackFailed() {
    if (!wantedPlayback) { return; }
    stopPlayback(); streamPhase = 'error'; renderStreamStatus(); dom.setText('playback-status', 'Der Stream ist gerade nicht erreichbar. Bitte erneut versuchen.');
    var attempt = playbackAttempt;
    provider.poll().then(function () {
      if (attempt === playbackAttempt && streamPhase === 'error' && provider.status() !== 'stopped') { layout.notify('Der Stream ist gerade nicht erreichbar. Bitte versuche es erneut.', true); }
    });
  }
  
  function startPlayback() {
    signals.emit('playback-reset');
    volume.preparePlayback();
    wantedPlayback = true; streamPhase = 'connecting'; var attempt = ++playbackAttempt;
    playbackUi(true, 'Verbinde mit dem Stream …');
    clearTimeout(playbackTimer); playbackTimer = setTimeout(playbackFailed, 20000);
    function playResolvedStream() {
      if (!wantedPlayback || attempt !== playbackAttempt) { return; }
      var source = api.streamUrls(model.current() && model.current().station);
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
  
  function bindAudioEvents(target) {
    target.addEventListener('playing', function () { if (target === audio && wantedPlayback) { streamPhase = 'playing'; clearTimeout(playbackTimer); playbackUi(true, 'Du hörst MischWerk. Schön, dass du da bist.'); } });
    function buffering() {
      if (target !== audio || !wantedPlayback) { return; }
      streamPhase = 'connecting'; renderStreamStatus(); dom.setText('playback-status', 'Der Stream lädt nach …');
      signals.emit('playback-reset');
      provider.poll();
      clearTimeout(playbackTimer); playbackTimer = setTimeout(playbackFailed, 20000);
    }
    target.addEventListener('waiting', buffering); target.addEventListener('stalled', buffering);
    target.addEventListener('pause', function () {
      if (target === audio && wantedPlayback) { stopPlayback(); dom.setText('playback-status', 'Wiedergabe unterbrochen. Drücke Play, um erneut zu starten.'); }
    });
    target.addEventListener('error', function () { if (target === audio) { playbackFailed(); } });
    target.addEventListener('ended', function () { if (target === audio) { playbackFailed(); } });
  }
  
  function start() {
    dom.el('play-button').addEventListener('click', function () {
      if (!model.current() || !api.streamUrls(model.current().station) || dom.el('play-button').disabled || provider.status() === 'stopped') { return; }
      if (wantedPlayback) { stopPlayback(); dom.setText('playback-status', 'Gestoppt. Dein Mix wartet auf dich.'); return; }
      startPlayback();
    });
  
    bindAudioEvents(audio);
    signals.on('station-changed', function (station) {
      stopPlayback();
      if (station.configured) { streamPhase = 'ready'; dom.setText('playback-status', 'Bereit, wenn du es bist. Drücke Play.'); }
    });
    signals.on('provider-status', function (change) {
      if (change.status === 'stopped') {
        if (change.previous !== 'stopped' || wantedPlayback) { stopPlayback(); }
        dom.setText('playback-status', 'Radio Mischwerk meldet eine Sendepause. Der Status wird automatisch erneut geprüft.');
      } else if (change.previous === 'stopped') {
        streamPhase = 'ready';
        dom.setText('playback-status', change.status === 'started' ? 'Der Sender ist wieder bereit. Drücke Play zum Zuhören.' : 'Senderstatus nicht prüfbar. Du kannst die Wiedergabe versuchen.');
      }
      renderStreamStatus();
    });
  }
  function playbackPosition() {
    if (!wantedPlayback || streamPhase !== 'playing' || audio.paused || audio.ended || audio.seeking ||
        audio.error || audio.readyState < 3 || !isFinite(audio.currentTime)) { return null; }
    return audio.currentTime;
  }
  return { start: start, stop: stopPlayback, renderStatus: renderStreamStatus, playbackPosition: playbackPosition };
});

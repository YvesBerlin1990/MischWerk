/* Ein Hörwunsch, ein natives Audioelement, eine abbrechbare Verbindungssteuerung. */
MischWerkUI.define('radioConnection', function (dependencies) {
  'use strict';
  var audio = dependencies.audio;
  var signals = dependencies.signals;
  var realm = dependencies.realm;
  var source = '', wanted = false, phase = 'stopped', failure = '';
  var timer, generation = 0, failures = 0, retryAt = 0;
  var position = 0, progressAt = 0, stableSince = 0;
  var starting = false, pausedSince = null, resumes = 0;
  var lastClock = 0, clockOffset = 0;
  var RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
  var START_TIMEOUT = 30000;
  var playSequence = 0, attempt = 0;
  var variant = 1, restoreMute = null, waitCanplay = false, watchAt = 0;

  function now() {
    var stamp = window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
    if (stamp < lastClock) { clockOffset += lastClock - stamp; }
    lastClock = stamp;
    return stamp + clockOffset;
  }
  function publish(next, reason) {
    if (reason === undefined) { reason = failure; }
    if (next === 'playing' || next === 'stopped') { reason = ''; }
    if (phase === next && failure === reason) { return; }
    phase = next; failure = reason;
    if (next !== 'playing') { signals.emit('playback-reset'); }
    signals.emit('connection-state', { phase: phase, wanted: wanted, error: failure });
  }
  function restore() { if (restoreMute !== null) { audio.muted = restoreMute; restoreMute = null; } }
  function mediaFailure() {
    return audio.error && ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][audio.error.code] || 'PLAY_FAILED';
  }
  function release() {
    generation += 1; pausedSince = null; waitCanplay = false; restore();
    audio.pause(); audio.removeAttribute('src'); audio.load();
  }
  function stop() {
    wanted = false; source = ''; retryAt = 0; clearTimeout(timer);
    release(); attempt = 0; publish('stopped'); signals.emit('playback-reset');
  }
  function retry(reason) {
    if (!wanted || retryAt) { return; }
    // Hörwunsch vor Freigabe erhalten; Ereignisse der alten Quelle sind jetzt wirkungslos.
    retryAt = now() + RETRY_DELAYS[Math.min(failures++, RETRY_DELAYS.length - 1)];
    release(); publish('reconnecting', reason || 'PLAYBACK_INTERRUPTED');
  }
  function rejected(error, selected, resume) {
    if (!wanted || selected !== generation || retryAt) { return; }
    if (error && error.name === 'NotAllowedError') {
      wanted = false; clearTimeout(timer); release(); publish('blocked', 'NotAllowedError');
    } else if (!resume) {
      var name = error && error.name;
      retry(['NotAllowedError', 'NotSupportedError', 'AbortError', 'SecurityError'].indexOf(name) !== -1 ? name : 'PLAY_FAILED');
    }
  }
  function play(resume) {
    var selected = generation, call = ++playSequence;
    try {
      var pending = variant === 4 ? realm.getPlay().call(audio) : audio.play();
      if (pending && typeof pending.then === 'function') {
        pending.then(null, function (error) {
          if (selected === generation && call === playSequence) { rejected(error, selected, resume); }
        });
      }
    } catch (error) { rejected(error, selected, resume); }
  }
  function connect() {
    retryAt = 0; generation += 1;
    attempt = Math.min(1000000, attempt + 1);
    variant = [4, 1, 2, 3][(attempt - 1) % 4]; waitCanplay = variant === 3;
    position = 0; starting = true; stableSince = 0; pausedSince = null; resumes = 0;
    progressAt = now();
    publish('connecting');
    // Alles synchron im Klick: load vor play, damit kein neues load dessen Promise abbricht.
    if (variant === 2) { restoreMute = audio.muted; audio.muted = true; }
    audio.preload = 'auto'; audio.src = source; audio.load();
    if (variant !== 3) { play(); }
  }
  function sample() {
    if (!wanted || retryAt || audio.paused || audio.ended || audio.seeking || audio.error ||
        audio.readyState < 2 || !isFinite(audio.currentTime)) { return false; }
    var current = audio.currentTime, advanced = current > position, stamp = now();
    position = current;
    if (!advanced) { return false; }
    starting = false; progressAt = stamp;
    if (!stableSince) { stableSince = stamp; }
    if (stamp - stableSince >= 30000) { failures = 0; }
    // Fortschritt belegt Wiedergabe auch bei knappem Puffer (HAVE_CURRENT_DATA).
    publish('playing');
    return true;
  }
  function tick(force) {
    clearTimeout(timer);
    if (!wanted) { return; }
    var stamp = now();
    if (!force && stamp < watchAt) { scheduleTick(); return; }
    watchAt = stamp + 1000;
    if (retryAt) {
      if (stamp >= retryAt) { connect(); }
    } else {
      var advanced = sample();
      if (!advanced && stamp - progressAt >= 2000 && phase === 'playing') { publish('buffering'); }
      // Der Browser darf kurze Engpässe selbst überstehen. Nur wirklichen Stillstand ersetzen.
      if (!resumePaused(stamp) && !advanced && stamp - progressAt >= (starting ? START_TIMEOUT : 15000)) { retry(starting ? 'START_TIMEOUT' : 'PLAYBACK_STALLED'); }
    }
    if (wanted) { scheduleTick(); }
  }
  function scheduleTick() {
    clearTimeout(timer);
    var stamp = now(), due = watchAt || stamp + 1000;
    timer = setTimeout(tick, Math.max(1, due - stamp));
  }
  function resumePaused(stamp) {
    if (!active() || waitCanplay || !audio.paused || audio.readyState < 3 || audio.ended || audio.error) { pausedSince = null; return false; }
    if (pausedSince === null) { pausedSince = stamp; }
    if (stamp - pausedSince > 3000) {
      pausedSince = stamp;
      if (resumes < 3) { resumes += 1; play(true); }
      else { retry('PLAYBACK_INTERRUPTED'); }
    }
    return true;
  }
  function start(url) {
    stop(); source = url; wanted = true; failures = 0;
    connect(); tick(true);
  }
  function active() { return wanted && !retryAt; }
  function ready() {
    if (!active() || audio.readyState < 2 || audio.error || audio.ended) { return; }
    if (!audio.paused) { pausedSince = null; }
    clearTimeout(timer);
    watchAt = now() + 1000;
    // Ohne ersten Fortschritt gilt weiter die 30-Sekunden-Frist ab connect.
    scheduleTick();
  }
  function bind() {
    window.addEventListener('pagehide', realm.dispose);
    audio.addEventListener('playing', function () {
      ready();
      if (active() && !audio.paused && !audio.ended && !audio.error) { restore(); scheduleTick(); publish('playing'); }
    });
    audio.addEventListener('canplay', function () { ready(); if (active() && waitCanplay) { waitCanplay = false; play(); } });
    audio.addEventListener('loadeddata', ready);
    audio.addEventListener('timeupdate', sample);
    audio.addEventListener('waiting', function () {
      if (active()) { sample(); stableSince = 0; publish('buffering'); }
    });
    audio.addEventListener('stalled', function () {
      // stalled betrifft den Datentransfer; vorhandene Audiodaten können weiterlaufen.
      if (active() && !sample() && audio.readyState < 3) { stableSince = 0; publish('buffering'); }
    });
    audio.addEventListener('pause', function () {
      if (!active() || !audio.paused) { return; }
      if (audio.ended || audio.error) { retry(audio.error ? mediaFailure() : 'PLAYBACK_ENDED'); return; }
      if (pausedSince === null && audio.readyState >= 3) { pausedSince = now(); }
      publish('buffering');
    });
    audio.addEventListener('ended', function () { if (active() && audio.ended) { retry('PLAYBACK_ENDED'); } });
    audio.addEventListener('error', function () { if (active() && audio.error) { retry(mediaFailure()); } });
    window.addEventListener('online', function () {
      if (wanted && retryAt) { retryAt = now(); tick(true); }
    });
    document.addEventListener('visibilitychange', function () {
      // Nach gedrosselten Hintergrundtimern zuerst Fortschritt lesen, nicht blind neu laden.
      if (!document.hidden && wanted) { tick(true); }
    });
  }
  function playbackPosition() {
    if (!active() || phase !== 'playing' || audio.paused || audio.ended || audio.seeking ||
        audio.error || audio.readyState < 2 || !isFinite(audio.currentTime)) { return null; }
    return audio.currentTime;
  }
  return { bind: bind, start: start, stop: stop, playbackPosition: playbackPosition, playbackNow: now,
    state: function () { return { phase: phase, wanted: wanted, error: failure }; } };
});

/* Ein Hörwunsch, ein natives Audioelement, eine abbrechbare Verbindungssteuerung. */
MischWerkUI.define('radioConnection', function (dependencies) {
  'use strict';
  var audio = dependencies.audio;
  var signals = dependencies.signals;
  var source = '', wanted = false, phase = 'stopped';
  var timer, generation = 0, failures = 0, retryAt = 0;
  var position = 0, progressAt = 0, stableSince = 0;
  var hasProgress = false, resuming = false;
  var lastClock = 0, clockOffset = 0;
  var RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

  function now() {
    var stamp = window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
    if (stamp < lastClock) { clockOffset += lastClock - stamp; }
    lastClock = stamp;
    return stamp + clockOffset;
  }
  function publish(next) {
    if (phase === next) { return; }
    phase = next;
    if (next !== 'playing') { signals.emit('playback-reset'); }
    signals.emit('connection-state', { phase: phase, wanted: wanted });
  }
  function release() {
    generation += 1; resuming = false;
    audio.pause(); audio.removeAttribute('src'); audio.load();
  }
  function stop() {
    wanted = false; source = ''; retryAt = 0; clearTimeout(timer);
    release(); publish('stopped'); signals.emit('playback-reset');
  }
  function retry() {
    if (!wanted || retryAt) { return; }
    // Hörwunsch vor Freigabe erhalten; Ereignisse der alten Quelle sind jetzt wirkungslos.
    retryAt = now() + RETRY_DELAYS[Math.min(failures++, RETRY_DELAYS.length - 1)];
    publish('reconnecting'); release();
  }
  function rejected(error, selected) {
    if (!wanted || selected !== generation || retryAt) { return; }
    resuming = false;
    if (error && error.name === 'NotAllowedError') {
      wanted = false; clearTimeout(timer); release(); publish('blocked');
    } else { retry(); }
  }
  function play() {
    var selected = generation;
    try {
      var pending = audio.play();
      if (pending && typeof pending.then === 'function') {
        pending.then(function () {
          if (selected === generation) { resuming = false; }
        }, function (error) { rejected(error, selected); });
      } else { resuming = false; }
    } catch (error) { rejected(error, selected); }
  }
  function connect() {
    retryAt = 0; generation += 1;
    position = 0; hasProgress = false; stableSince = 0;
    progressAt = now();
    publish('connecting');
    audio.src = source;
    play();
  }
  function sample() {
    if (!wanted || retryAt || audio.paused || audio.ended || audio.seeking || audio.error ||
        audio.readyState < 2 || !isFinite(audio.currentTime)) { return false; }
    var current = audio.currentTime, advanced = current > position, stamp = now();
    position = current;
    if (!advanced) { return false; }
    hasProgress = true; progressAt = stamp;
    if (!stableSince) { stableSince = stamp; }
    if (stamp - stableSince >= 30000) { failures = 0; }
    // Fortschritt belegt Wiedergabe auch bei knappem Puffer (HAVE_CURRENT_DATA).
    publish('playing');
    return true;
  }
  function tick() {
    clearTimeout(timer);
    if (!wanted) { return; }
    var stamp = now();
    if (retryAt) {
      if (stamp >= retryAt) { connect(); }
    } else {
      var advanced = sample();
      if (!advanced && stamp - progressAt >= 2000 && phase === 'playing') { publish('buffering'); }
      // Der Browser darf kurze Engpässe selbst überstehen. Nur wirklichen Stillstand ersetzen.
      if (!advanced && stamp - progressAt >= (hasProgress ? 15000 : 30000)) { retry(); }
    }
    if (wanted) { timer = setTimeout(tick, 1000); }
  }
  function start(url) {
    stop(); source = url; wanted = true; failures = 0;
    connect(); tick();
  }
  function active() { return wanted && !retryAt; }
  function bind() {
    audio.addEventListener('playing', function () {
      if (active() && !audio.paused && !audio.ended && !audio.error) { publish('playing'); }
    });
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
      if (audio.ended || audio.error) { retry(); return; }
      if (!resuming) { resuming = true; publish('buffering'); play(); }
    });
    audio.addEventListener('ended', function () { if (active() && audio.ended) { retry(); } });
    audio.addEventListener('error', function () { if (active() && audio.error) { retry(); } });
    window.addEventListener('online', function () {
      if (wanted && retryAt) { retryAt = now(); tick(); }
    });
    document.addEventListener('visibilitychange', function () {
      // Nach gedrosselten Hintergrundtimern zuerst Fortschritt lesen, nicht blind neu laden.
      if (!document.hidden && wanted) { tick(); }
    });
  }
  function playbackPosition() {
    if (!active() || phase !== 'playing' || audio.paused || audio.ended || audio.seeking ||
        audio.error || audio.readyState < 2 || !isFinite(audio.currentTime)) { return null; }
    return audio.currentTime;
  }
  return { bind: bind, start: start, stop: stop, playbackPosition: playbackPosition, playbackNow: now,
    state: function () { return { phase: phase, wanted: wanted }; } };
});

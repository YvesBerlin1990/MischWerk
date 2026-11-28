/* Playerfortschritt melden; keine Aussage über Systemlautstärke oder menschliches Zuhören. */
MischWerkUI.define('listenerPresence', function (dependencies) {
  'use strict';
  var player = dependencies.player, audio = dependencies.audio, commands = dependencies.commands;
  var model = dependencies.model, signals = dependencies.signals;
  var position = null, sampledAt = 0, consecutive = 0, active = false, sequence = 0, disposed = false;
  function payload() { sequence += 1; return { active:active, sequence:sequence }; }
  function setActive(next) {
    if (active === next) { return; }
    active = next;
    try { commands.send('mw:listenerPresence', payload()); } catch (ignored) { /* Anzeigeausfall stoppt kein Audio. */ }
  }
  function reset() { position = null; sampledAt = 0; consecutive = 0; setActive(false); }
  function audible() { return !disposed && model.view === 'radio' && navigator.onLine !== false && !audio.muted && audio.volume > 0; }
  function sample() {
    var current = audible() ? player.playbackPosition() : null, now = player.playbackNow();
    if (current === null || !isFinite(current)) { reset(); return; }
    var elapsed = (now - sampledAt) / 1000;
    if (position !== null && elapsed > 0 && elapsed <= 15 && current > position && current - position <= elapsed * 2 + 1) {
      consecutive += 1; setActive(consecutive >= 2);
    } else { consecutive = 0; setActive(false); }
    position = current; sampledAt = now;
  }
  function start() {
    signals.on('playback-reset', reset);
    audio.addEventListener('volumechange', function () { if (!audible()) { reset(); } });
    ['waiting', 'error', 'ended', 'pause', 'seeking', 'emptied'].forEach(function (event) { audio.addEventListener(event, reset); });
    window.addEventListener('offline', reset);
  }
  function renewal() {
    if (active && (!audible() || player.playbackPosition() === null)) { reset(); }
    return payload();
  }
  function dispose() { disposed = true; reset(); }
  function resume() { disposed = false; reset(); }
  return { start:start, sample:sample, renewal:renewal, dispose:dispose, resume:resume };
});

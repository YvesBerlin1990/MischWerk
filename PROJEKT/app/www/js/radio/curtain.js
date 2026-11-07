/* Globaler Vorhang und ausschließlich lokaler Werbeklick; Verwaltung erfolgt im Chat. */
MischWerkUI.define('curtain', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var player = dependencies.player;
  var audio = dependencies.audio;
  var advertisement = dom.el('curtain-audio');
  var wanted = false, attempt = 0, covered = false, previousFocus = null;
  function message(text, error) {
    dom.setText('curtain-message', text);
    dom.el('curtain-message').hidden = !text;
    dom.el('curtain-message').classList.toggle('error', !!error);
  }
  function button() {
    dom.setText('curtain-ad-label', wanted ? 'Werbung stoppen' : 'Werbung starten');
    dom.el('curtain-ad').setAttribute('aria-label', wanted ? 'Werbung stoppen' : 'Werbung abspielen');
    dom.el('curtain-ad').setAttribute('aria-pressed', String(wanted));
  }
  function stopAdvertisement() {
    wanted = false; attempt += 1;
    advertisement.pause(); advertisement.removeAttribute('src'); advertisement.load();
    button(); message('');
  }
  function failed(generation) {
    if (!wanted || generation !== attempt) { return; }
    stopAdvertisement(); message('Die Werbung konnte nicht gestartet werden. Bitte erneut versuchen.', true);
  }
  function syncVolume() { advertisement.volume = Math.min(.1, audio.volume); advertisement.muted = audio.muted; }
  function playAdvertisement() {
    if (wanted) { stopAdvertisement(); return; }
    player.stop(); syncVolume();
    wanted = true; var generation = ++attempt;
    var state = model.current(), version = state && state.curtain && state.curtain.audioVersion || '1';
    advertisement.src = 'audio/werbung.mp3?v=' + encodeURIComponent(version);
    button(); message('Werbung wird geladen …');
    try {
      var result = advertisement.play();
      if (result && typeof result.catch === 'function') { result.catch(function () { failed(generation); }); }
    } catch (error) { failed(generation); }
  }
  function render() {
    var state = model.current(), curtain = state && state.curtain;
    var closed = !!(curtain && curtain.closed === true && curtain.exempt !== true);
    var panel = dom.el('radio-panel'), overlay = dom.el('radio-curtain'), focused = document.activeElement;
    var hadFocus = document.hasFocus();
    if (closed && !covered && panel.contains(focused)) { previousFocus = focused; }
    document.documentElement.setAttribute('data-curtain', closed ? 'closed' : 'open');
    panel.inert = closed;
    if (closed) { panel.setAttribute('aria-hidden', 'true'); } else { panel.removeAttribute('aria-hidden'); }
    overlay.hidden = !closed;
    if (closed !== covered && hadFocus) {
      if (closed && panel.contains(focused)) { dom.el('curtain-ad').focus({ preventScroll:true }); }
      else if (!closed && overlay.contains(focused)) {
        var target = previousFocus && previousFocus.isConnected && !previousFocus.disabled ? previousFocus :
          !dom.el('play-button').disabled ? dom.el('play-button') : dom.el('mute-button');
        target.focus({ preventScroll:true });
      }
    }
    covered = closed;
  }
  function start() {
    dom.el('curtain-ad').addEventListener('click', playAdvertisement);
    advertisement.addEventListener('playing', function () { if (wanted) { message('Werbung läuft.'); } });
    advertisement.addEventListener('ended', stopAdvertisement);
    advertisement.addEventListener('error', function () { failed(attempt); });
    audio.addEventListener('volumechange', syncVolume);
    audio.addEventListener('play', stopAdvertisement);
    dom.el('play-button').addEventListener('click', stopAdvertisement);
    window.addEventListener('pagehide', stopAdvertisement);
    signals.on('snapshot', render); signals.on('controls', render);
  }
  return { start:start };
});

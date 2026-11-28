/* Native Lautstärke, Mute und begrenzte Wiederherstellung gespeicherter Werte. */
MischWerkUI.define('volume', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  var audio = dependencies.audio;
  var START_VOLUME = .3;
  var lastAudibleVolume = START_VOLUME;
  function setVolume(level) {
    level = Number(level); if (!isFinite(level)) { return; }
    level = Math.max(0, Math.min(1, level)); audio.volume = level;
    if (level > 0) { lastAudibleVolume = level; }
    var percent = Math.round(level * 100); dom.el('volume').value = String(percent);
    dom.el('volume').style.setProperty('--volume', percent + '%');
    dom.setText('volume-value', percent + ' %');
    dom.el('volume').setAttribute('aria-valuetext', percent + ' Prozent');
    dom.el('volume').title = 'Playerlautstärke einstellen';
    dom.el('volume-value').title = dom.el('volume').title;
    dom.el('mute-button').setAttribute('aria-pressed', String(level === 0));
    dom.el('mute-button').setAttribute('aria-label', level === 0 ? 'Ton einschalten' : 'Ton ausschalten');
    dom.el('mute-button').title = dom.el('mute-button').getAttribute('aria-label');
    // Beim nächsten Öffnen höchstens mit der leisen Startlautstärke beginnen.
    try { localStorage.setItem('mischwerk.volume.v1', String(Math.min(level, START_VOLUME))); } catch (error) { /* Lokale Speicherung ist optional. */ }
  }
  function preparePlayback() {
    lastAudibleVolume = Math.min(lastAudibleVolume, START_VOLUME);
    setVolume(Math.min(audio.volume, START_VOLUME));
  }
  function start() {
    dom.el('volume').addEventListener('input', function () { setVolume(Number(this.value) / 100); });
    dom.el('mute-button').addEventListener('click', function () { setVolume(audio.volume === 0 ? lastAudibleVolume : 0); });
    var initialVolume = START_VOLUME;
    try { var savedVolume = localStorage.getItem('mischwerk.volume.v1'); if (savedVolume !== null && savedVolume !== '' && isFinite(Number(savedVolume))) { initialVolume = Math.min(Number(savedVolume), START_VOLUME); } } catch (error) { /* Auch ohne Speicher bedienbar. */ }
    setVolume(initialVolume);
  }
  return { start: start, preparePlayback: preparePlayback };
});

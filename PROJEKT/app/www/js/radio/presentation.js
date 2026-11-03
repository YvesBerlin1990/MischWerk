/* Titel, Interpret, Thema-Anordnung und serverbestätigte ON-AIR-Anzeige. */
MischWerkUI.define('presentation', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var broadcast = {};
  function updateMetadataLayout() {
    var root = document.documentElement;
    var title = !dom.el('track-title').hidden;
    var artist = !document.querySelector('.artist-copy').hidden;
    var topic = !dom.el('radio-topic').hidden;
    root.classList.toggle('has-title', title);
    root.classList.toggle('has-artist', artist);
    root.classList.toggle('single-track', title !== artist);
    root.classList.toggle('no-track', !title && !artist);
    root.classList.toggle('no-metadata', !title && !artist && !topic);
    dom.el('metadata-empty').hidden = title || artist;
    signals.emit('radio-layout');
  }
  
  function renderSong(song) {
    song = song && typeof song === 'object' ? song : {};
    var title = typeof song.title === 'string' ? song.title.trim() : '';
    var artist = song.artist && typeof song.artist.name === 'string' ? song.artist.name.trim() : '';
    dom.setText('track-title', title); dom.setText('track-artist', artist);
    dom.el('track-title').hidden = !title; dom.el('track-label').hidden = !title;
    document.querySelector('.artist-copy').hidden = !artist;
    document.querySelector('.track-row').hidden = !title && !artist;
    dom.setText('track-label', song.type === 'ad' ? 'Titel · Werbung' : 'Titel');
    updateMetadataLayout();
  }
  
  function renderTopic() {
    var topic = model.current() && typeof model.current().topic === 'string' ? model.current().topic.trim() : '';
    document.documentElement.classList.toggle('has-topic', !!topic);
    dom.setText('show-topic', topic); dom.el('radio-topic').hidden = !topic;
    updateMetadataLayout();
  }
  function renderOnAirStatus() {
    var moderator = model.current() && model.current().moderator;
    var active = model.connected() && !!moderator;
    function fresh(at) { var age = Date.now() - at; return typeof at === 'number' && age >= 0 && age < 90000; }
    var transmitting = broadcast.status === 'started' && fresh(broadcast.statusAt);
    var confirmedMode = transmitting && fresh(broadcast.modeAt) && !document.hidden;
    var mix = confirmedMode && broadcast.isLive === false;
    var live = confirmedMode && broadcast.isLive === true;
    var paused = broadcast.status === 'stopped' && fresh(broadcast.statusAt);
    var label = mix ? 'MischWerk übernimmt' : live ? 'Live-Moderation' : paused ? 'Sendepause' :
      moderator && !active ? 'Moderation unbestätigt' : active ? 'Moderation' : 'Radio MischWerk';
    var description = mix ? 'MischWerk übernimmt: STREAMPANEL bestätigt die automatische Musikstrecke.' :
      live ? 'STREAMPANEL bestätigt eine Live-Sendung.' : paused ? 'STREAMPANEL meldet eine Sendepause.' : 'Der Sendemodus ist derzeit nicht bestätigt.';
    if (active && !mix && !paused) { description += ' ' + moderator.nick + ' ist im Studio als Moderation angemeldet.'; }
    if (moderator && !active) { description += ' Die Moderationsanmeldung ist bei fehlender Channelverbindung unbestätigt.'; }
    var mode = mix ? 'mix' : live ? 'live' : 'unconfirmed';
    var showName = active && !mix && !paused;
    var presenter = document.querySelector('.presenter');
    var changed = presenter.getAttribute('data-mode') !== mode || dom.el('on-air-sign').textContent !== label || dom.el('host-name').hidden === showName;
    document.body.classList.toggle('moderator-on-air', active);
    presenter.setAttribute('data-mode', mode);
    dom.el('on-air-sign').setAttribute('aria-label', description);
    dom.el('on-air-sign').title = description;
    dom.setText('on-air-sign', label);
    dom.el('host-name').hidden = !showName;
    if (changed) { signals.emit('radio-layout'); }
    var positions = model.current() && model.current().wishPositions;
    dom.el('own-wish-position').hidden = !positions || !positions.available || !positions.total;
    document.body.classList.toggle('has-own-wish', !dom.el('own-wish-position').hidden);
    var validPosition = positions && Number.isInteger(positions.nextPosition) && positions.nextPosition > 0;
    dom.setText('own-wish-position', positions && positions.total ? !model.connected() || !validPosition ? 'Wunschposition unbestätigt' :
      (positions.total > 1 ? 'Dein nächster Wunsch: Platz ' : 'Dein Wunsch: Platz ') + positions.nextPosition : '');
  }
  signals.on('broadcast-status', function (value) { broadcast = value; renderOnAirStatus(); });
  document.addEventListener('visibilitychange', renderOnAirStatus);
  
  return { renderTopic: renderTopic, updateMetadataLayout: updateMetadataLayout, renderSong: renderSong, renderOnAirStatus: renderOnAirStatus };
});

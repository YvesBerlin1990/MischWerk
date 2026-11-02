/* Titel, Interpret, Thema-Anordnung und serverbestätigte ON-AIR-Anzeige. */
MischWerkUI.define('presentation', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
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
    var active = model.connected() && !!model.current().moderator;
    var description = active ? 'On Air: ' + model.current().moderator.nick + ' ist als Moderation angemeldet.' :
      model.current() && model.current().moderator ? 'On-Air-Status unbestätigt: Verbindung zum Channel unterbrochen.' : 'DJ Mischwerk legt auf';
    document.body.classList.toggle('moderator-on-air', active);
    dom.el('on-air-sign').setAttribute('aria-label', description);
    dom.el('on-air-sign').title = description;
    var label = active ? 'Live-Moderation' : model.current() && model.current().moderator ? 'Moderation unbestätigt' : 'DJ Mischwerk legt auf';
    dom.setText('on-air-sign', label);
    dom.el('host-name').hidden = !active;
  }
  
  return { renderTopic: renderTopic, updateMetadataLayout: updateMetadataLayout, renderSong: renderSong, renderOnAirStatus: renderOnAirStatus };
});

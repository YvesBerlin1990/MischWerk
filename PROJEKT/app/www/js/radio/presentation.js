/* Titel, Interpret, Thema-Anordnung und serverbestätigte ON-AIR-Anzeige. */
MischWerkUI.define('presentation', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var broadcast = {};
  var DEFAULT_TOPIC = 'MischWerk Radio Show';
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
    var topic = model.broadcastFresh() && model.current() && typeof model.current().topic === 'string' ? model.current().topic.trim() : '';
    document.documentElement.classList.add('has-topic');
    dom.setText('show-topic', topic || DEFAULT_TOPIC); dom.el('radio-topic').hidden = false;
    updateMetadataLayout();
  }
  function renderOnAirStatus() {
    var moderator = model.current() && model.current().moderator;
    var active = model.broadcastFresh() && !!moderator;
    function fresh(at) { var age = Date.now() - at; return typeof at === 'number' && age >= -30000 && age <= 45000; }
    var transmitting = broadcast.status === 'started' && fresh(broadcast.statusAt);
    var confirmedMode = transmitting && fresh(broadcast.modeAt) && !document.hidden;
    var mix = confirmedMode && broadcast.isLive === false;
    var label = active ? 'Es moderiert' : mix ? 'MischWerk am Pult' : 'Moderation derzeit nicht verfügbar';
    var description = active ? 'Es moderiert ' + moderator.nick + '.' : mix ?
      'MischWerk am Pult.' : 'Moderation derzeit nicht verfügbar.';
    var mode = active ? 'moderation' : mix ? 'mix' : 'unconfirmed';
    // Wie Web und Android bestätigt ausschließlich die frische zentrale Projektion den Live-DJ.
    var showName = active;
    var presenter = document.querySelector('.presenter');
    var changed = presenter.getAttribute('data-mode') !== mode || dom.el('on-air-sign').textContent !== label || dom.el('host-name').hidden === showName;
    document.body.classList.toggle('moderator-on-air', active);
    presenter.setAttribute('data-mode', mode);
    dom.el('on-air-sign').setAttribute('aria-label', description);
    dom.setText('on-air-sign', label);
    dom.el('host-name').hidden = !showName;
    dom.el('host-name').setAttribute('data-prefix', '');
    dom.el('host-name').setAttribute('aria-label', active ? moderator.nick : '');
    if (changed) { signals.emit('radio-layout'); }
    var positions = model.current() && model.current().wishPositions;
    dom.el('own-wish-position').hidden = !positions || !positions.available || !positions.total;
    document.body.classList.toggle('has-own-wish', !dom.el('own-wish-position').hidden);
    var validPosition = positions && Number.isInteger(positions.nextPosition) && positions.nextPosition > 0;
    var confirmedPosition = model.positionsFresh() && validPosition;
    var wishLabel = positions && positions.total ? 'Dein Wunsch:' : '';
    var wishRank = positions && positions.total && confirmedPosition ? 'Platz ' + positions.nextPosition : '';
    var next = positions && positions.nextItem;
    if (!next || next.position !== positions.nextPosition) {
      next = positions && Array.isArray(positions.items) ? positions.items.filter(function (item) {
        return item.position === positions.nextPosition;
      })[0] : null;
    }
    var text = next && typeof next.text === 'string' ? next.text : '';
    var stage = !confirmedPosition ? 'Status unbestätigt' : next && next.stage === 'playing' ? 'In Vorbereitung' :
      next && next.stage === 'preparing' ? 'In Vorbereitung' : next && next.stage === 'received' ? 'Angenommen' : next && next.stage === 'queued' ? 'Wartet auf Annahme' : '';
    var more = positions && positions.total > 1 ? positions.total - 1 : 0;
    dom.setText('own-wish-label', wishLabel); dom.setText('own-wish-rank', wishRank);
    dom.el('own-wish-rank').hidden = !wishRank;
    dom.setText('own-wish-title', text); dom.el('own-wish-title').hidden = !text;
    dom.setText('own-wish-stage', stage); dom.el('own-wish-stage').hidden = !stage;
    dom.el('own-wish-stage').setAttribute('data-stage', confirmedPosition && next ? next.stage : 'unknown');
    dom.setText('own-wish-more', more ? '+' + more : ''); dom.el('own-wish-more').hidden = !more;
    dom.el('own-wish-more').setAttribute('aria-label', more + (more === 1 ? ' weiterer offener Wunsch' : ' weitere offene Wünsche'));
  }
  signals.on('broadcast-status', function (value) { broadcast = value; renderOnAirStatus(); });
  document.addEventListener('visibilitychange', renderOnAirStatus);
  
  return { renderTopic: renderTopic, updateMetadataLayout: updateMetadataLayout, renderSong: renderSong, renderOnAirStatus: renderOnAirStatus };
});

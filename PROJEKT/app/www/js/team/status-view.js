/* Bestätigte Appzustände und öffentliche Anbieterbefunde lesbar darstellen. */
MischWerkUI.define('statusView', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  function card(name, value, detail, tone) {
    var id = 'status-' + name;
    dom.setText(id + '-value', value);
    dom.setText(id + '-detail', detail);
    dom.el(id).setAttribute('data-tone', tone || 'neutral');
  }
  function current(item) { return item && item.kind === 'ready' && Date.now() - item.at < 90000; }
  function stamp(item) { return 'Geprüft um ' + new Date(item.at).toLocaleTimeString('de-DE') + ' Uhr.'; }
  function remoteCard(name, item, configured) {
    if (!configured) { card(name, 'Nicht eingerichtet', 'Es fehlt eine gültige RadioKing-Senderkonfiguration.'); return false; }
    if (!model.connected()) { card(name, 'Nicht aktuell', 'Anbieterprüfung pausiert, bis die App-Verbindung bestätigt ist.', 'error'); return false; }
    if (!item) { card(name, 'Prüfe …', 'Öffentliche RadioKing-Daten werden abgerufen.'); return false; }
    if (item.kind === 'paused') { card(name, 'Sendepause', 'Kein Titelabruf bei bestätigtem Senderstopp. ' + stamp(item)); return false; }
    if (!current(item)) {
      card(name, item.kind === 'error' ? 'Nicht erreichbar' : 'Nicht aktuell',
        (item.kind === 'error' ? 'Abfrage fehlgeschlagen. ' : 'Erneute Prüfung erforderlich. ') + stamp(item), 'error');
      return false;
    }
    return true;
  }
  function render(remote, running, configured) {
    var state = model.current();
    if (!state) { return; }
    var connected = model.connected();
    card('app', connected ? 'Verbunden' : state.shuttingDown ? 'Wartung läuft' : 'Verbindung fehlt',
      connected ? 'Channelzustand bestätigt; automatische Aktualisierung aktiv.' : 'App-Zustände sind nicht aktuell. Jetzt prüfen oder das Fenster erneut öffnen.', connected ? 'ok' : 'error');
    if (connected) {
      var moderator = state.moderator;
      card('studio', moderator ? 'ON AIR · ' + moderator.nick : 'Kein ON AIR', moderator ?
        'Im MischWerk-Studio angemeldet' + (moderator.expiresAt ? ' bis ' + dom.time(moderator.expiresAt) + ' Uhr.' : '.') :
        'Keine Moderation im MischWerk-Studio angemeldet.', moderator ? 'gold' : 'neutral');
      card('wishes', state.requestsEnabled ? 'Aktiviert' : 'Deaktiviert', state.requestsEnabled ? 'Hörer können Musikwünsche senden.' : 'Neue Musikwünsche sind gesperrt.', state.requestsEnabled ? 'ok' : 'neutral');
      var count = Number(state.queueTotal) || 0;
      card('queue', count.toLocaleString('de-DE') + ' offen', count ? 'Bearbeitung im Moderationsmenü.' : 'Keine offenen Musikwünsche.', count ? 'gold' : 'ok');
      card('topic', state.topic ? 'Gesetzt' : 'Nicht gesetzt', state.topic || 'Kein Sendungsthema veröffentlicht.', state.topic ? 'ok' : 'neutral');
    } else {
      ['studio', 'wishes', 'queue', 'topic'].forEach(function (name) {
        card(name, 'Status unbekannt', 'Die Verbindung zum Channel muss erneut bestätigt werden.', 'error');
      });
    }
    var transmission = remote.transmission, song = remote.metadata;
    if (remoteCard('transmission', transmission, configured)) {
      card('transmission', transmission.value === 'started' ? 'Sendet' : transmission.value === 'stopped' ? 'Gestoppt' : 'Status unbekannt',
        'Öffentlicher Senderstatus; kein Audio-Test. ' + stamp(transmission), transmission.value === 'started' ? 'ok' : transmission.value === 'stopped' ? 'error' : 'neutral');
    }
    if (remoteCard('listeners', remote.listeners, configured)) {
      card('listeners', remote.listeners.value.toLocaleString('de-DE'), 'Öffentliche RadioKing-Hörerzahl. ' + stamp(remote.listeners), 'ok');
    }
    if (remoteCard('metadata', song, configured)) {
      var text = [song.value.title, song.value.artist.name].filter(Boolean).join(' · ');
      card('metadata', text ? 'Erreichbar' : 'Keine Titelangaben', (text ? text + '. ' : 'RadioKing liefert derzeit keinen Titel. ') + stamp(song), text ? 'ok' : 'neutral');
    }
    var mode = 'Status unbekannt', detail = 'LIVE/AutoDJ ist derzeit nicht bestätigt.', tone = 'neutral', warning = '';
    if (!configured) { mode = 'Nicht eingerichtet'; detail = 'RadioKing-Senderkonfiguration fehlt.'; }
    else if (current(transmission) && transmission.value === 'stopped') {
      mode = 'Sendepause'; detail = 'RadioKing meldet den Sender als gestoppt.'; tone = 'error';
      if (connected && state.moderator) { warning = 'Im Studio ist noch eine Moderation ON AIR angemeldet.'; }
    } else if (current(transmission) && transmission.value === 'started' && current(song) && typeof song.value.isLive === 'boolean') {
      mode = song.value.isLive ? 'LIVE' : 'AutoDJ'; tone = song.value.isLive ? 'gold' : 'ok';
      detail = 'Laut aktueller RadioKing-Titelkennzeichnung. ' + stamp(song);
      if (connected && song.value.isLive !== !!state.moderator) {
        warning = song.value.isLive ? 'RadioKing meldet LIVE; im Studio ist niemand ON AIR angemeldet.' :
          'RadioKing meldet AutoDJ laut Titelstatus; im Studio ist eine Moderation ON AIR angemeldet. Encoderverbindung prüfen.';
      }
    }
    card('mode', mode, detail, tone);
    dom.setText('status-mode-warning', warning); dom.el('status-mode-warning').hidden = !warning;
    dom.el('refresh-status').disabled = running;
    dom.setText('refresh-status', running ? 'Prüfe …' : 'Jetzt prüfen');
    dom.setText('status-refresh-note', !configured ? 'Für die automatische Prüfung muss RadioKing eingerichtet sein.' :
      !connected ? 'Die automatische Prüfung pausiert, bis die App-Verbindung wiederhergestellt ist.' :
      'Automatische Aktualisierung: 30 Sekunden nach der letzten abgeschlossenen Prüfung, bei Abruffehlern nach 60 Sekunden.');
  }
  return { render: render };
});

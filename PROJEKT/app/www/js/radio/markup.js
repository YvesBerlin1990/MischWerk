/* Radiooberfläche: eine Datenbindung pro Bedienung, Details bleiben im selben Audiofenster. */
MischWerkUI.define('radioMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('radio-placeholder', `
    <div id="radio-deck" class="radio-deck">
    <main id="radio-panel" class="radio-bar" aria-label="MischWerk Radio">
      <div class="radio-brand"><img class="bar-logo" src="img/mischwerk-logo.png" width="140" height="140" loading="lazy" decoding="async" alt="MischWerk"><span>MischWerk</span></div>
      <section class="radio-program" aria-label="Radioplayer und Informationen">
      <div class="radio-panel-face radio-program-face" aria-hidden="true"></div>
      <div class="transport">
        <button id="play-button" class="play-button" type="button" aria-label="Radio abspielen" aria-pressed="false" disabled><span id="play-icon" aria-hidden="true"><svg class="play-symbol" viewBox="0 0 24 24"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg><svg class="pause-symbol" viewBox="0 0 24 24"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg></span></button>
      </div>
      <section id="radio-metadata" class="radio-metadata" aria-label="Musik, Sendung und Lautstärke" tabindex="0">
      <div class="radio-information">
      <section class="now-playing" aria-label="Aktuelle Musik">
        <div class="track-row" hidden>
          <div class="track-copy" aria-live="polite"><span class="track-eyebrow" aria-hidden="true">Jetzt läuft</span><span class="field-label sr-only" id="track-label" hidden>Titel</span><strong id="track-title" title="Aktueller Titel" hidden></strong><div class="artist-copy" hidden><span class="field-label sr-only artist-label">Interpret</span><span id="track-artist" title="Interpret"></span></div></div>
        </div>
        <p id="metadata-empty" class="empty-copy">Titelinformationen derzeit nicht verfügbar</p>
      </section>
        <div class="radio-context">
          <div id="radio-topic" class="topic-display" aria-live="polite"><span class="topic-label">Thema:</span><strong id="show-topic" title="Thema der Sendung">MischWerk Radio Show</strong></div>
          <div class="radio-status-row"><section class="presenter" data-mode="unconfirmed" aria-label="Sendung und Moderation"><svg class="presenter-mic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4m-4 0h8"/></svg><span id="on-air-sign" title="Sendung und Moderation" class="on-air-sign" role="status">Radio MischWerk</span><strong id="host-name" title="Aktuelle Moderation" hidden></strong></section>
          </div>
        </div>
        <div class="volume-control"><label for="volume">Lautstärke</label><button id="mute-button" class="icon-button" type="button" aria-label="Ton ausschalten" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path class="sound-waves" d="M16 9a5 5 0 0 1 0 6"></path><path class="sound-waves" d="M19.364 18.364a9 9 0 0 0 0-12.728"></path><path class="mute-cross" d="m17 9 5 6m0-6-5 6"/></svg></button><input id="volume" type="range" min="0" max="100" value="30" aria-label="Lautstärke in Prozent" aria-describedby="volume-help"><output for="volume" id="volume-value">30 %</output><span id="volume-help" class="sr-only">Lautstärke von 0 bis 100 Prozent. Mit den Pfeiltasten einstellen; mit der Lautsprechertaste stummschalten oder den vorherigen Wert wiederherstellen.</span></div>
      </div>
          <section id="own-wish-position" title="Dein Musikwunsch" class="own-wish-position" role="status" aria-label="Dein Musikwunsch" hidden><div class="own-wish-heading"><span id="own-wish-label" class="own-wish-label"></span><span id="own-wish-more" class="own-wish-more" hidden></span></div><strong id="own-wish-rank" class="own-wish-rank" hidden></strong><strong id="own-wish-title" title="Dein Musikwunsch" class="own-wish-title" hidden></strong><span id="own-wish-stage" class="own-wish-stage" hidden></span></section>
      </section>
      <nav id="radio-actions" class="radio-actions-panel public-only" aria-label="Radio bedienen">
        <div class="bar-actions" aria-label="Sendeplan und Musikwünsche">
        <button id="open-schedule" class="wish-button schedule-button" type="button" title="Sendeplan öffnen" aria-haspopup="dialog" disabled aria-disabled="true"><span class="public-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 5h10M14 12h6M10 19h10"></path><path d="m3 8 6 4-6 4z"></path></svg><svg class="radio-xmas-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M8 14h1m3 0h1m3 0h1M8 17h1m3 0h1"/></svg></span><span class="wish-button-copy"><strong>Sendeplan</strong><span id="schedule-button-caption" hidden></span></span></button>
        <button id="open-wishes" class="wish-button" type="button" aria-haspopup="dialog" hidden disabled aria-disabled="true"><span class="wish-button-icon public-action-icon" aria-hidden="true"><svg class="wish-icon-music" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg><svg class="wish-icon-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><svg class="radio-xmas-icon" viewBox="0 0 24 24"><path d="M5 12v9h14v-9M3 8h18v4H3zm9 0v13m0-13C5 8 5 2 8 3c2 0 4 5 4 5s2-5 4-5c3-1 3 5-4 5z"/></svg></span><span class="wish-button-copy"><strong>Wunschbox</strong><span id="wish-button-caption">Dein Musikwunsch</span></span></button>
        </div>
      </nav>
      </section>
      <div id="radio-listener-brand" class="radio-listener-brand" aria-hidden="true"><img class="radio-listener-logo" src="img/mischwerk-radio.png" width="140" height="140" loading="lazy" decoding="async" alt=""></div>
      <div class="sr-only"><span id="stream-badge" title="Wiedergabestatus" role="status"><span id="stream-label">Verbinde …</span></span><span id="metadata-status" role="status"></span><a id="station-link" tabindex="-1" target="_blank" rel="noopener noreferrer" hidden>Öffentlichen Radiostream öffnen</a></div>
    </main>
    <div id="radio-ticker-placeholder"></div>
    </div>
  `);
});

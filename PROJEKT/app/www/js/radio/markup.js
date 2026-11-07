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
      <section class="now-playing" aria-label="Aktuelle Musik">
        <div class="track-row" hidden><div class="track-copy" aria-live="polite"><span class="track-eyebrow" aria-hidden="true">Jetzt läuft</span><span class="field-label sr-only" id="track-label" hidden>Titel</span><strong id="track-title" hidden></strong><div class="artist-copy" hidden><span class="field-label sr-only artist-label">Interpret</span><span id="track-artist"></span></div></div></div>
        <p id="metadata-empty" class="empty-copy">Titelinformationen derzeit nicht verfügbar</p>
      </section>
        <div class="radio-context">
          <div id="radio-topic" class="topic-display" aria-live="polite"><span class="topic-label">Thema:</span><strong id="show-topic" title="MischWerk Radio Show">MischWerk Radio Show</strong></div>
          <div class="radio-status-row"><section class="presenter" data-mode="unconfirmed" aria-label="Sendung und Moderation"><span id="on-air-sign" class="on-air-sign" role="status">Radio MischWerk</span><strong id="host-name" hidden></strong></section>
          </div>
        </div>
          <section id="own-wish-position" class="own-wish-position" role="status" aria-label="Dein Musikwunsch" hidden><div class="own-wish-heading"><span id="own-wish-label" class="own-wish-label"></span><span id="own-wish-more" class="own-wish-more" hidden></span></div><strong id="own-wish-rank" class="own-wish-rank" hidden></strong><strong id="own-wish-title" class="own-wish-title" hidden></strong><span id="own-wish-stage" class="own-wish-stage" hidden></span></section>
        <div class="volume-control"><label for="volume">Lautstärke</label><button id="mute-button" class="icon-button" type="button" aria-label="Ton ausschalten" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path class="sound-waves" d="M16 9a5 5 0 0 1 0 6"></path><path class="sound-waves" d="M19.364 18.364a9 9 0 0 0 0-12.728"></path><path class="mute-cross" d="m17 9 5 6m0-6-5 6"/></svg></button><input id="volume" type="range" min="0" max="100" value="10" aria-label="Lautstärke in Prozent" aria-describedby="volume-help"><output for="volume" id="volume-value">10 %</output><span id="volume-help" class="sr-only">Über 60 Prozent ist der Regler rot markiert. Dies ist keine Dezibel-Messung und kein garantierter Schutzbereich: Der Hörpegel hängt von Kopfhörern und Systemlautstärke ab. Auch niedrigere Werte können zu laut sein. Bis 100 Prozent bleibt frei einstellbar.</span></div>
      </section>
      <nav id="radio-actions" class="radio-actions-panel public-only" aria-label="Radio bedienen">
        <div class="bar-actions" aria-label="Sendeplan und Musikwünsche">
        <button id="open-schedule" class="wish-button schedule-button" type="button" title="Sendeplan – In Kürze" disabled aria-disabled="true"><span class="public-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 5h10M14 12h6M10 19h10"></path><path d="m3 8 6 4-6 4z"></path></svg></span><span class="wish-button-copy"><strong>Sendeplan</strong><span id="schedule-button-caption">In Kürze</span></span></button>
        <button id="open-wishes" class="wish-button" type="button" aria-haspopup="dialog" disabled aria-disabled="true"><span class="wish-button-icon public-action-icon" aria-hidden="true"><svg class="wish-icon-music" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg><svg class="wish-icon-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><span class="wish-button-copy"><strong>Wunschbox</strong><span id="wish-button-caption">Dein Musikwunsch</span></span></button>
        </div>
      </nav>
      </section>
        <div id="radio-private-actions" class="bar-utility-links" aria-label="Radio verwalten" hidden>
          <button id="studio-tab" class="wish-button studio-link" type="button" aria-label="Radioregie" title="Radioregie" aria-haspopup="dialog" hidden><span class="public-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 3v8m0 4v6M12 3v2m0 4v12M19 3v10m0 4v4"/><circle cx="5" cy="13" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="19" cy="15" r="2"/></svg></span><span class="wish-button-copy action-label"><strong>Radioregie</strong></span></button>
        </div>
        <div id="radio-listener-brand" class="radio-listener-brand" aria-hidden="true" hidden>
          <span class="radio-listener-emblem"><img class="radio-listener-logo" src="img/mischwerk-radio.png" width="140" height="140" loading="lazy" decoding="async" alt=""></span>
          <span class="radio-listener-wordmark"><img class="radio-listener-logo" src="img/mischwerk-radio.png" width="115" height="115" loading="lazy" decoding="async" alt=""></span>
        </div>
      <div class="sr-only"><span id="stream-badge" role="status"><span id="stream-label">Verbinde …</span></span><span id="playback-status" role="status"></span><span id="metadata-status" role="status"></span><a id="station-link" tabindex="-1" target="_blank" rel="noopener noreferrer" hidden>Öffentlichen Radiostream öffnen</a></div>
    </main>
    <div id="radio-ticker-placeholder"></div>
    </div>
  `);
});

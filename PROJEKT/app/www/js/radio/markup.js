/* Radiooberfläche: eine Datenbindung pro Bedienung, Details bleiben im selben Audiofenster. */
MischWerkUI.define('radioMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('radio-placeholder', `
    <main id="radio-panel" class="radio-bar" aria-label="MischWerk Radio">
      <div class="radio-panel-face radio-program-face" aria-hidden="true"></div>
      <div class="radio-brand"><img class="bar-logo" src="img/mischwerk-logo.png" width="128" height="128" loading="lazy" decoding="async" alt="MischWerk"><span>MischWerk</span></div>
      <div class="transport">
        <button id="play-button" class="play-button" type="button" aria-label="Radio abspielen" aria-pressed="false" disabled><span id="play-icon" aria-hidden="true"><svg class="play-symbol" viewBox="0 0 24 24"><path d="M6 3v18l15-9Z"/></svg><svg class="pause-symbol" viewBox="0 0 24 24"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg></span></button>
        <span id="listener-count" class="listener-count" role="status" aria-live="off" aria-label="Hörerzahl wird abgerufen"><svg class="listener-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/></svg><span class="listener-caption" aria-hidden="true">Hörer: </span><span id="listener-value" class="listener-value" aria-hidden="true">…</span></span>
      </div>
      <section id="radio-metadata" class="radio-metadata" aria-label="Musik, Sendung und Lautstärke" tabindex="0">
      <section class="now-playing" aria-label="Aktuelle Musik">
        <div class="track-row" hidden><div class="track-copy" aria-live="polite"><span class="field-label sr-only" id="track-label" hidden>Titel</span><strong id="track-title" hidden></strong><div class="artist-copy" hidden><span class="field-label sr-only artist-label">Interpret</span><span id="track-artist"></span></div></div></div>
        <p id="metadata-empty" class="empty-copy">Titelinformationen derzeit nicht verfügbar</p>
      </section>
        <div class="radio-context">
          <div id="radio-topic" class="topic-display" aria-live="polite" hidden><span class="topic-label">Thema</span><strong id="show-topic"></strong></div>
          <section class="presenter" aria-label="Aktuelle Moderation"><span id="on-air-sign" class="on-air-sign" role="status">DJ Mischwerk legt auf</span><strong id="host-name" hidden></strong></section>
        </div>
        <div class="volume-control"><button id="mute-button" class="icon-button" type="button" aria-label="Ton ausschalten" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z" fill="currentColor" stroke="none"/><path class="sound-waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="mute-cross" d="m17 9 5 6m0-6-5 6"/></svg></button><label for="volume">Lautstärke</label><input id="volume" type="range" min="0" max="100" value="10" aria-label="Lautstärke in Prozent" aria-describedby="volume-help"><output for="volume" id="volume-value">10 %</output><span id="volume-help" class="sr-only">Über 60 Prozent ist der Regler rot markiert. Dies ist keine Dezibel-Messung und kein garantierter Schutzbereich: Der Hörpegel hängt von Kopfhörern und Systemlautstärke ab. Auch niedrigere Werte können zu laut sein. Bis 100 Prozent bleibt frei einstellbar.</span></div>
      </section>
      <nav id="radio-actions" class="radio-actions-panel public-only" aria-label="Radio bedienen">
        <div class="bar-actions" aria-label="Sendeplan und Musikwünsche">
        <button id="open-schedule" class="wish-button schedule-button" type="button" aria-haspopup="dialog" disabled aria-disabled="true"><span class="public-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h2m4 0h2"/></svg></span><span class="wish-button-copy"><strong>Sendeplan</strong><span id="schedule-button-caption">Wochenübersicht</span></span></button>
        <button id="open-wishes" class="wish-button" type="button" aria-haspopup="dialog" disabled aria-disabled="true"><span class="wish-button-icon public-action-icon" aria-hidden="true"><svg class="wish-icon-music" viewBox="0 0 24 24"><path d="M10 17V6l9-2v11M10 9l9-2"/><ellipse cx="7" cy="17" rx="3" ry="2.5"/><ellipse cx="16" cy="15" rx="3" ry="2.5"/></svg><svg class="wish-icon-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><span class="wish-button-copy"><strong>Wunschbox</strong><span id="wish-button-caption">Dein Musikwunsch</span></span></button>
        </div>
        <div id="radio-private-actions" class="bar-utility-links" aria-label="Radio verwalten" hidden>
          <button id="studio-tab" class="studio-link" type="button" aria-label="Moderation" title="Moderation" aria-haspopup="dialog" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/></svg><span class="action-label">Moderation</span></button>
          <button id="team-tab" class="studio-link" type="button" aria-label="Radio-Team" title="Radio-Team" aria-haspopup="dialog" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/></svg><span class="action-label">Radio-Team</span></button>
          <button id="curtain-toggle" class="icon-button curtain-toggle" type="button" hidden disabled aria-label="Vorhang für alle Hörer öffnen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h20M3 4v17h8V4m2 0v17h8V4M3 15l8-5m2 0 8 5M6 4v17m12-17v17"/></svg><span id="curtain-toggle-label">Vorhang öffnen</span></button>
        </div>
      </nav>
      <div class="sr-only"><span id="stream-badge" role="status"><span id="stream-label">Verbinde …</span></span><span id="playback-status" role="status"></span><span id="metadata-status" role="status"></span><a id="station-link" target="_blank" rel="noopener noreferrer" hidden>Öffentlichen Radiostream öffnen</a></div>
    </main>
  `);
});

/* Kompakte Mitgliederverwaltung mit Formular, Liste und Bestätigung am Eintrag. */
MischWerkUI.define('teamMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('team-placeholder', `
<section id="team-panel" aria-label="Verwaltung" hidden>
  <div class="team-tabs" role="tablist" aria-label="Verwaltung">
    <button id="team-members-tab" type="button" role="tab" aria-selected="true" aria-controls="team-members">Anzeige</button>
    <button id="team-texts-tab" type="button" role="tab" aria-selected="false" aria-controls="channel-texts-panel" tabindex="-1">Bot-Texte</button>
    <button id="team-connection-tab" type="button" role="tab" aria-selected="false" aria-controls="team-connection-panel" tabindex="-1">Verbindung</button>
  </div>
  <div id="team-members" role="tabpanel" aria-labelledby="team-members-tab">
    <section class="native-settings" aria-labelledby="theme-heading">
      <h2 id="theme-heading">Gestaltung</h2>
      <label for="display-theme">Design</label>
      <select id="display-theme"><option value="normal">Normal</option><option value="xmas">X-Mas</option></select>
      <p id="theme-feedback" class="form-hint" role="status"></p>
    </section>
    <form id="display-form" class="native-settings">
      <h2>Anzeige im Channel</h2>
      <label class="channel-texts-toggle"><input id="team-signs-enabled" type="checkbox">Teamzeichen anzeigen</label>
      <label class="channel-texts-toggle"><input id="microphone-enabled" type="checkbox">Mikrofon anzeigen</label>
      <label class="channel-texts-toggle"><input id="headphones-enabled" type="checkbox">Kopfhörer anzeigen</label>
      <label class="channel-texts-toggle"><input id="announcements-enabled" type="checkbox">Sendungsmeldungen senden</label>
      <button id="display-save" class="primary-button" type="submit">Anzeige speichern</button>
      <p id="display-feedback" class="form-hint" role="status"></p>
    </form>
    <form id="ticker-form" class="native-settings">
      <h2>Lauftext</h2>
      <label for="ticker-text">Information für den Channel</label>
      <textarea id="ticker-text" maxlength="300" rows="3"></textarea>
      <label class="channel-texts-toggle"><input id="ticker-enabled" type="checkbox">Lauftext einschalten</label>
      <label for="ticker-speed">Geschwindigkeit</label>
      <select id="ticker-speed"><option value="32">Langsam</option><option value="48">Normal</option><option value="72">Schnell</option></select>
      <label for="ticker-font">Schrift</label>
      <select id="ticker-font"><option value="petit-formal-script">Petit Formal Script</option><option value="josefin-sans">Josefin Sans</option><option value="rajdhani">Rajdhani</option></select>
      <button id="ticker-save" class="primary-button" type="submit">Lauftext speichern</button>
      <button id="ticker-reload" class="secondary-button" type="button">Gespeicherten Stand laden</button>
      <p id="ticker-feedback" class="form-hint" role="status"></p>
    </form>
    <section class="team-members-list" aria-labelledby="team-list-heading">
      <div class="team-list-heading">
        <h2 id="team-list-heading" tabindex="-1">Freigegebene Nicks <span class="count-badge" id="radio-moderator-count">0</span></h2>
        <span id="team-refresh-feedback" role="status" aria-live="polite" aria-atomic="true"></span>
        <button class="icon-button" id="refresh-radio-team" type="button" aria-label="Team aktualisieren" title="Team aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button>
      </div>
      <p class="form-hint">Die Freigaben werden in der MischWerk-Verwaltung gepflegt.</p>
      <div id="radio-moderator-list" class="team-list"></div>
      <div class="pagination" id="radio-moderator-pagination" hidden>
        <button class="secondary-button" id="prev-radio-moderator-page" type="button">Zurück</button>
        <span id="radio-moderator-page-label">Seite 1 / 1</span>
        <button class="secondary-button" id="next-radio-moderator-page" type="button">Weiter</button>
      </div>
    </section>
  </div>
  <div id="channel-texts-slot"></div>
  <section id="team-connection-panel" role="tabpanel" aria-labelledby="team-connection-tab" hidden>
    <div class="connection-content">
      <h2>Homepage und App</h2>
      <p class="form-hint">Verbindet Senderdaten und Musikwünsche mit Homepage und App.</p>
      <p id="relay-status" class="connection-status" role="status">Status wird geladen …</p>
      <p id="relay-key-state" class="form-hint"></p>
      <p id="relay-failure" class="form-hint" role="status"></p>
      <div class="connection-actions">
        <button id="relay-activate" type="button" class="primary-button" disabled>Aktivieren</button>
        <button id="relay-deactivate" type="button" class="secondary-button" disabled>Ausschalten</button>
      </div>
      <details class="connection-secret"><summary>Originalbestand übertragen</summary>
        <label for="migration-source">Quellenkennung dieser App</label>
        <input id="migration-source" type="text" readonly value="Noch nicht geprüft" aria-describedby="migration-source-info">
        <p id="migration-source-info" class="form-hint"></p>
        <p id="migration-counts" class="form-hint"></p>
        <p class="form-hint">Ungefrorene Vorprüfung. Das Lesen startet keinen Export.</p>
        <p id="migration-status" class="form-hint" role="status"></p>
        <button id="migration-start" type="button" class="secondary-button" disabled>Vorbereiteten Export starten</button>
        <button id="migration-abort" type="button" class="secondary-button" disabled>Export anhalten</button>
      </details>
      <details class="connection-secret"><summary>Schlüssel verwalten</summary>
        <p class="form-hint">Beim Speichern wird die Verbindung ausgeschaltet. Danach erneut aktivieren.</p>
        <form id="relay-form" autocomplete="off" data-private>
          <label for="relay-sync">Neuer Schlüssel</label>
          <input id="relay-sync" type="password" autocomplete="off" minlength="43" maxlength="128" pattern="[A-Za-z0-9_-]{43,128}" disabled spellcheck="false">
          <button id="relay-save" type="submit" class="secondary-button" disabled>Schlüssel speichern</button>
        </form>
      </details>
    </div>
    <div class="connection-footer">
      <button id="relay-refresh" type="button" class="secondary-button" disabled>Status aktualisieren</button>
      <p id="relay-result" class="form-hint" role="status" aria-live="polite"></p>
    </div>
  </section>
</section>`);
});

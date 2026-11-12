/* Kompakte Mitgliederverwaltung mit Formular, Liste und Bestätigung am Eintrag. */
MischWerkUI.define('teamMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('team-placeholder', `
<section id="team-panel" aria-label="Verwaltung" hidden>
  <div class="team-tabs" role="tablist" aria-label="Verwaltung">
    <button id="team-members-tab" type="button" role="tab" aria-selected="true" aria-controls="team-members">Radio-Team</button>
    <button id="team-texts-tab" type="button" role="tab" aria-selected="false" aria-controls="channel-texts-panel" tabindex="-1">Bot-Texte</button>
    <button id="team-connection-tab" type="button" role="tab" aria-selected="false" aria-controls="team-connection-panel" tabindex="-1">Verbindung</button>
  </div>
  <div id="team-members" role="tabpanel" aria-labelledby="team-members-tab">
    <section class="team-add" aria-labelledby="team-add-heading">
      <h2 id="team-add-heading">Mitglied hinzufügen</h2>
      <form id="radio-moderator-form" class="team-add-form">
        <label class="sr-only" for="radio-moderator-nick">Knuddels-Nick</label>
        <div class="team-add-row">
          <input id="radio-moderator-nick" name="nick" type="text" maxlength="50" required autocomplete="off" placeholder="Knuddels-Nick" aria-describedby="team-add-help">
          <button id="add-radio-moderator" class="primary-button" type="submit">Hinzufügen</button>
        </div>
      </form>
      <p id="team-add-help" class="form-hint">Kann moderieren und Wünsche bearbeiten.</p>
    </section>
    <section class="team-members-list" aria-labelledby="team-list-heading">
      <div class="team-list-heading">
        <h2 id="team-list-heading" tabindex="-1">Mitglieder <span class="count-badge" id="radio-moderator-count">0</span></h2>
        <span id="team-refresh-feedback" role="status" aria-live="polite" aria-atomic="true"></span>
        <button class="icon-button" id="refresh-radio-team" type="button" aria-label="Team aktualisieren" title="Team aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button>
      </div>
      <div id="team-list-notice"></div>
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
      <h2>Homepage &amp; App</h2>
      <p class="form-hint">Senderdaten und Musikwünsche bleiben verbunden.</p>
      <p id="relay-status" class="connection-status" role="status">Status wird geladen …</p>
      <p id="relay-key-state" class="form-hint"></p>
      <div class="connection-actions">
        <button id="relay-activate" type="button" class="primary-button" disabled>Aktivieren</button>
        <button id="relay-deactivate" type="button" class="secondary-button" disabled>Ausschalten</button>
      </div>
      <details class="connection-secret"><summary>Verbindungsschlüssel ändern</summary>
        <p class="form-hint">Nur bei Bedarf ändern. Speichern schaltet die Verbindung aus.</p>
        <form id="relay-form" autocomplete="off" data-private>
          <label for="relay-sync">Neuer Schlüssel</label>
          <input id="relay-sync" type="password" autocomplete="off" minlength="43" maxlength="128" pattern="[A-Za-z0-9_-]{43,128}" disabled spellcheck="false">
          <button id="relay-save" type="submit" class="secondary-button" disabled>Speichern</button>
        </form>
      </details>
    </div>
    <div class="connection-footer">
      <button id="relay-refresh" type="button" class="secondary-button" disabled>Aktualisieren</button>
      <p id="relay-result" class="form-hint" role="status" aria-live="polite"></p>
    </div>
  </section>
</section>`);
});

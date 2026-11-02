/* Mitgliederverwaltung als eigenständige Arbeitsfläche mit getrennter Statusansicht. */
MischWerkUI.define('teamMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('team-placeholder', `
    <section id="team-panel" aria-label="Radio-Team und Statuszentrale" hidden>
      <nav class="team-tabs" aria-label="Radio-Team-Bereiche">
        <button id="team-members-tab" type="button" aria-pressed="true" aria-controls="team-members">Radio-Team</button>
        <button id="team-status-tab" type="button" aria-pressed="false" aria-controls="team-status">Statuszentrale</button>
      </nav>
      <div id="team-members">
        <section class="card team-intro-card" aria-labelledby="team-add-heading">
          <div class="team-section-heading"><span class="eyebrow">STUDIOZUGRIFF VERGEBEN</span><h2 id="team-add-heading">Dein Team erweitern</h2></div>
          <form id="radio-moderator-form" class="team-add-form">
            <label for="radio-moderator-nick">Knuddels-Nick</label>
            <div class="team-add-row"><input id="radio-moderator-nick" name="nick" type="text" maxlength="50" required autocomplete="off" placeholder="Exakten Nick eingeben" aria-describedby="team-add-help"><button id="add-radio-moderator" class="primary-button" type="submit">Ernennen</button></div>
          </form>
          <p id="team-add-help" class="form-hint">Radiomoderatoren können die Sendung steuern und Musikwünsche bearbeiten.</p>
        </section>
        <section class="card team-list-card" aria-labelledby="team-list-heading">
          <div class="list-heading"><div class="team-section-heading"><span class="eyebrow">MITGLIEDER</span><h2 id="team-list-heading" tabindex="-1">Radiomoderatoren <span class="count-badge" id="radio-moderator-count">0</span></h2></div><button class="icon-button" id="refresh-radio-team" type="button" aria-label="Radio-Team aktualisieren" title="Radio-Team aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div>
          <div id="radio-moderator-list" class="team-list"></div>
          <div class="pagination" id="radio-moderator-pagination" hidden><button class="secondary-button" id="prev-radio-moderator-page" type="button">← Zurück</button><span id="radio-moderator-page-label">Seite 1 / 1</span><button class="secondary-button" id="next-radio-moderator-page" type="button">Weiter →</button></div>
        </section>
        <p class="team-owner-note">Teamverwaltung ist Sache des Channelinhabers. Channelmoderatoren erhalten keinen automatischen Studiozugriff.</p>
      </div>
      <div id="team-status-placeholder"></div>
    </section>
  `);
});

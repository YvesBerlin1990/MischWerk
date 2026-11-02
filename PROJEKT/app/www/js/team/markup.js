/* Statischer Aufbau der Radio-Team-Verwaltung. Keine Nutzereingaben als HTML. */
MischWerkUI.define('teamMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('team-placeholder', `
    <section id="team-panel" aria-label="Radio-Team und Statuszentrale" hidden>
      <nav class="team-tabs" aria-label="Radio-Team-Bereiche">
        <button id="team-members-tab" type="button" aria-pressed="true" aria-controls="team-members">Radio-Team</button>
        <button id="team-status-tab" type="button" aria-pressed="false" aria-controls="team-status">Statuszentrale</button>
      </nav>
      <div id="team-members">
      <section class="card team-intro-card">
        <span class="eyebrow">CHANNELINHABER</span>
        <form id="radio-moderator-form" class="team-add-form">
          <label for="radio-moderator-nick">Knuddels-Nick</label>
          <div class="topic-edit-row"><input id="radio-moderator-nick" name="nick" type="text" maxlength="50" required autocomplete="off" placeholder="Nickname"><button id="add-radio-moderator" class="primary-button" type="submit">Ernennen</button></div>
        </form>
        <p class="form-hint">Ernannte Radiomoderatoren erhalten Zugriff auf das Moderationsmenü. Channelmoderatoren erhalten diesen Zugriff nicht automatisch.</p>
      </section>
      <section class="card team-list-card">
        <div class="list-heading"><h2>Radiomoderatoren <span class="count-badge" id="radio-moderator-count">0</span></h2><button class="text-button" id="refresh-radio-team" type="button">Aktualisieren</button></div>
        <div id="radio-moderator-list" class="team-list"></div>
        <div class="pagination" id="radio-moderator-pagination" hidden><button class="secondary-button" id="prev-radio-moderator-page" type="button">← Zurück</button><span id="radio-moderator-page-label">Seite 1 / 1</span><button class="secondary-button" id="next-radio-moderator-page" type="button">Weiter →</button></div>
      </section>
      <p class="fine-print">Nur der Channelinhaber kann das Radio-Team ändern.</p>
      </div>
      <div id="team-status-placeholder"></div>
    </section>
`);
});

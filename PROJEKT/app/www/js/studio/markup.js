/* Neu aufgebaute Arbeitsfläche; dynamische Inhalte besitzen ihre Fachkomponenten. */
MischWerkUI.define('studioMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('studio-placeholder', `
    <section id="studio-panel" aria-label="Moderationsmenü" hidden>
      <nav class="compact-tabs" aria-label="Moderations-Bereich">
        <button type="button" id="studio-controls-tab" aria-pressed="true" aria-controls="studio-setup">Sendesteuerung</button>
        <button type="button" id="studio-queue-tab" aria-pressed="false" aria-controls="studio-requests">Wünsche</button>
      </nav>
      <div class="studio-workspace">
        <section id="studio-setup" class="card studio-setup" aria-labelledby="studio-setup-heading">
          <div class="workspace-heading"><span class="eyebrow">DEINE SENDUNG</span><h2 id="studio-setup-heading">Sendesteuerung</h2></div>
          <div class="studio-controls">
            <section class="studio-control-card microphone-card" aria-labelledby="studio-host">
              <div class="studio-card-heading"><span class="studio-status-light" aria-hidden="true"></span><span class="eyebrow">Am Mikrofon</span></div>
              <h3 id="studio-host">Keine Moderation angemeldet</h3>
              <p id="studio-session" class="studio-session" hidden></p>
              <div class="button-row">
                <button class="primary-button" id="on-air" type="button">Moderation übernehmen</button>
                <button class="secondary-button" id="off-air" type="button" disabled>Abmelden</button>
                <button id="handover-open" class="secondary-button" type="button" aria-controls="handover-panel" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg><span id="handover-open-label">Sendung übergeben</span></button>
              </div>
            </section>
            <section class="studio-control-card wishes-control-card" aria-labelledby="studio-wish-state">
              <div><span class="eyebrow">Musikwünsche zulassen</span><h3 id="studio-wish-state">Wunschbox</h3></div>
              <button id="toggle-wishes" type="button" class="switch-button" role="switch" aria-label="Musikwünsche zulassen" aria-checked="false"><span class="switch-track" aria-hidden="true"><i></i></span><span id="toggle-label">Aus</span></button>
            </section>
          </div>
          <form id="topic-form" class="topic-form">
            <div class="topic-form-heading"><label for="studio-topic">Thema der Sendung</label><span id="studio-topic-count">0 / 80</span></div>
            <input id="studio-topic" name="topic" type="text" maxlength="80" placeholder="Was läuft in deiner Sendung?" aria-describedby="topic-help topic-feedback">
            <p id="topic-help" class="form-hint">Leer speichern entfernt das Thema.</p>
            <div class="topic-actions"><button id="reset-topic" class="text-button" type="button" hidden>Änderungen verwerfen</button><button id="save-topic" class="primary-button" type="submit" disabled>Speichern</button></div>
            <p id="topic-feedback" role="status" aria-live="polite" hidden></p>
          </form>
        </section>
        <section id="studio-requests" class="card studio-queue" aria-labelledby="queue-heading">
          <div class="list-heading studio-queue-heading"><div class="workspace-heading"><span class="eyebrow">AUS DEM CHANNEL</span><h2 id="queue-heading" tabindex="-1">Musikwünsche <span class="count-badge" id="queue-count">0</span></h2></div><button class="icon-button" id="refresh-queue" type="button" aria-label="Musikwünsche aktualisieren" title="Musikwünsche aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div>
          <div id="request-queue" class="queue"></div>
          <div class="pagination" id="queue-pagination"><button class="secondary-button" id="prev-page" type="button">← Zurück</button><span id="page-label">Wunsch 1 / 1</span><button class="secondary-button" id="next-page" type="button">Weiter →</button></div>
        </section>
      </div>
      <div id="handover-placeholder"></div>
    </section>
  `);
});

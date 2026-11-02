/* Statischer Aufbau der Studiokonsole. Keine Nutzereingaben als HTML. */
MischWerkUI.define('studioMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('studio-placeholder', `
    <section id="studio-panel" aria-label="Moderationsmenü" hidden>
      <nav class="compact-tabs" aria-label="Moderations-Bereich"><button type="button" id="studio-controls-tab" aria-pressed="true">Studio</button><button type="button" id="studio-queue-tab" aria-pressed="false">Wünsche</button></nav>
      <div class="studio-workspace">
        <section class="card studio-setup" aria-label="Studio-Steuerung">
          <div class="studio-controls">
            <section class="card studio-control-card microphone-card">
              <div class="studio-card-heading"><span class="studio-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8"/></svg></span><div><span class="eyebrow"><span class="studio-status-light" aria-hidden="true"></span>AM MIKROFON</span><h2 id="studio-host">Keine Moderation angemeldet</h2></div></div>
              <p id="studio-session" class="studio-session" hidden></p>
              <div class="button-row">
                <button class="primary-button" id="on-air" type="button">Moderation übernehmen</button><button class="secondary-button" id="off-air" type="button" disabled>Abmelden</button>
                <button id="handover-open" class="secondary-button" type="button" aria-controls="handover-panel" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg><span id="handover-open-label">Sendung übergeben</span></button>
              </div>
            </section>
            <section class="card studio-control-card wishes-control-card">
              <div class="studio-card-heading"><span class="studio-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 9l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg></span><div><span class="eyebrow">WUNSCHBOX</span><h2 id="studio-wish-state">Musikwünsche</h2></div></div>
              <button id="toggle-wishes" type="button" class="switch-button" role="switch" aria-label="Musikwünsche zulassen" aria-checked="false"><span class="switch-track"><i></i></span><span class="sr-only">Musikwünsche zulassen</span><span id="toggle-label">Wunschbox aktivieren</span></button>
            </section>
          </div>
          <form id="topic-form" class="card topic-form">
            <div class="topic-form-heading"><div class="topic-title"><span class="studio-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h11M4 18h8"/></svg></span><div><span class="eyebrow">SENDUNG</span><label for="studio-topic">Thema der Sendung</label></div></div><span id="topic-feedback" role="status" aria-live="polite" hidden></span></div>
            <div class="topic-edit-row"><input id="studio-topic" name="topic" type="text" maxlength="80" placeholder="z. B. 80er und 90er" aria-describedby="topic-help"><button id="save-topic" class="primary-button" type="submit" disabled>Speichern</button></div>
            <span id="topic-help" class="sr-only">Bis zu 80 Zeichen. Zum Entfernen das Feld leeren und speichern.</span>
          </form>
        </section>
        <section class="card studio-queue" aria-labelledby="queue-heading">
          <div class="list-heading studio-queue-heading"><div><span class="eyebrow">MUSIKWÜNSCHE</span><h2 id="queue-heading" tabindex="-1">Musikwünsche <span class="count-badge" id="queue-count">0</span></h2></div><button class="icon-button" id="refresh-queue" type="button" aria-label="Musikwünsche aktualisieren" title="Musikwünsche aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div>
          <div id="request-queue" class="queue"></div>
          <div class="pagination" id="queue-pagination"><button class="secondary-button" id="prev-page" type="button">← Zurück</button><span id="page-label">Wunsch 1 / 1</span><button class="secondary-button" id="next-page" type="button">Weiter →</button></div>
        </section>
      </div>
      <div id="handover-placeholder"></div>
    </section>
`);
});

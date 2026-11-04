/* Eigenständige Arbeitsreiter; Inhalte und Bediengruppen bleiben vollständig erreichbar. */
MischWerkUI.define('studioMarkup',function(dependencies){
  'use strict';
  dependencies.dom.mount('studio-placeholder', `
<section id="studio-panel" aria-label="Moderationsmenü" hidden>
  <nav id="studio-programme-tabs" class="studio-programme-tabs" role="tablist" aria-label="Moderationsbereiche" hidden>
    <button id="studio-programme-tab" type="button" role="tab" aria-selected="true" aria-controls="studio-programme">Deine Sendung</button>
    <button id="studio-queue-tab" type="button" role="tab" aria-selected="false" aria-controls="studio-requests" tabindex="-1">Musikwünsche</button>
    <button id="studio-history-tab" type="button" role="tab" aria-selected="false" aria-controls="history-panel" tabindex="-1">Heute gespielt</button>
  </nav>
  <section id="studio-programme" role="tabpanel" aria-labelledby="studio-programme-tab">
    <div id="studio-setup" class="studio-part-area studio-dashboard">
      <section class="studio-part microphone-card" aria-labelledby="studio-host">
        <div class="studio-status-copy"><span class="eyebrow">AM MIKROFON</span>
        <h2 id="studio-host">Keine Moderation angemeldet</h2>
        <p id="studio-session" class="studio-session" hidden></p>
        <dl id="studio-timing" class="studio-timing" hidden><div><dt>Beginn</dt><dd id="studio-started"></dd></div><div><dt>Studiozeit</dt><dd id="studio-duration"></dd></div></dl></div>
        <div id="studio-controls" class="button-row"><button class="primary-button" id="on-air" type="button">Moderation übernehmen</button><button class="secondary-button" id="off-air" type="button" disabled>Abmelden</button><button id="handover-open" class="secondary-button" type="button" aria-controls="handover-panel" hidden><span id="handover-open-label">Sendung übergeben</span></button></div>
      </section>
      <section class="studio-part studio-topic-section" aria-labelledby="studio-topic-label">
        <form id="topic-form" class="topic-form">
          <div class="topic-form-heading"><label id="studio-topic-label" for="studio-topic">Thema deiner Sendung</label><span id="studio-topic-count">0 / 80</span></div>
          <input id="studio-topic" name="topic" type="text" maxlength="80" placeholder="Was läuft in deiner Sendung?" aria-describedby="topic-help topic-feedback">
          <div class="topic-status"><p id="topic-help" class="form-hint">Leer speichern entfernt das Thema.</p><p id="topic-feedback" role="status" aria-live="polite" hidden></p></div>
          <div class="topic-actions"><button id="reset-topic" class="text-button" type="button" aria-label="Änderungen am Thema verwerfen" hidden>Verwerfen</button><button id="save-topic" class="primary-button" type="submit" disabled>Speichern</button></div>
        </form>
      </section>
      <section class="studio-part wishes-control-card" aria-labelledby="studio-wish-state">
        <div><h3>Wunschbox</h3><span id="studio-wish-state" class="eyebrow">Musikwünsche zulassen</span></div>
        <button id="toggle-wishes" type="button" class="switch-button" role="switch" aria-label="Musikwünsche zulassen" aria-checked="false"><span class="switch-track" aria-hidden="true"><i></i></span><span id="toggle-label">Aus</span></button>
      </section>
      <section id="studio-handover-card" class="studio-part" data-unavailable hidden>
        <section id="studio-received-notes" hidden><h3>Hinweise für deine Sendung</h3><div class="studio-reader"><p id="studio-notes-text"></p></div></section>
      </section>
    </div>
    <nav id="studio-paging" class="studio-part-pagination" aria-label="Bereiche deiner Sendung" hidden><button class="secondary-button" data-part-previous type="button">Zurück</button><span data-part-label role="status"></span><button class="secondary-button" data-part-next type="button">Weiter</button></nav>
    <div id="handover-placeholder"></div>
  </section>
  <section id="studio-requests" class="studio-queue" data-detail="copy" role="tabpanel" aria-labelledby="studio-queue-tab" hidden>
    <div class="list-heading studio-queue-heading"><div class="workspace-heading"><span class="eyebrow" id="queue-refresh-feedback" role="status" aria-live="polite" aria-atomic="true">AUS DEM CHANNEL</span><h2 id="queue-heading" tabindex="-1">Musikwünsche <span class="count-badge" id="queue-count">0</span></h2></div><div class="queue-header-actions"><button id="queue-detail-toggle" type="button" class="secondary-button" aria-controls="queue-actions" aria-expanded="false">Aktionen</button><button class="icon-button" id="refresh-queue" type="button" aria-label="Musikwünsche aktualisieren" title="Musikwünsche aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div></div>
    <div id="queue-notice"></div><div id="request-queue" class="queue" role="list" aria-label="Musikwünsche in Eingangsreihenfolge"></div>
    <div class="pagination" id="queue-pagination"><button class="secondary-button" id="prev-page" type="button">← Zurück</button><span id="page-label">Wunsch 1 / 1</span><button class="secondary-button" id="next-page" type="button">Weiter →</button></div>
  </section>
  <div id="history-placeholder"></div>
</section>
  `);
});

/* Neu aufgebaute Moderation: Sendung und Wünsche im selben nativen Arbeitsfenster. */
MischWerkUI.define('studioMarkup',function(dependencies){
  'use strict';
  dependencies.dom.mount('studio-placeholder', `
<section id="studio-panel" class="studio-workspace" aria-label="Moderation" hidden>
  <nav id="studio-programme-tabs" class="studio-programme-tabs" role="tablist" aria-label="Moderationsbereiche" hidden>
    <button id="studio-programme-tab" type="button" role="tab" aria-selected="true" aria-controls="studio-programme">Sendung</button>
    <button id="studio-queue-tab" type="button" role="tab" aria-selected="false" aria-controls="studio-requests" tabindex="-1">Wünsche</button>
  </nav>
  <section id="studio-programme" class="studio-pane" role="tabpanel" aria-labelledby="studio-programme-tab">
    <div id="studio-setup" class="studio-sections">
      <section class="studio-section studio-session" aria-labelledby="studio-host">
        <div id="studio-status-copy"><span class="studio-label">Moderation</span><h2 id="studio-host">Keine Moderation angemeldet</h2></div>
        <div id="studio-controls" class="studio-session-actions">
          <button id="on-air" class="primary-button" type="button">Anmelden</button>
          <button id="off-air" class="secondary-button" type="button" disabled>Abmelden</button>
          <button id="handover-open" class="secondary-button" type="button" aria-controls="handover-panel" hidden><span id="handover-open-label">Sendung übergeben</span></button>
        </div>
        <p id="studio-schedule-note" class="form-hint" role="status">Im Sendeplan automatisch vermerkt.</p>
      </section>
      <section class="studio-section studio-wishes" aria-labelledby="studio-wish-heading">
        <div><h3 id="studio-wish-heading">Wunschbox</h3><p id="studio-wish-state" role="status" aria-live="polite" aria-atomic="true">Musikwünsche sind geschlossen</p></div>
        <button id="toggle-wishes" class="switch-button" type="button" role="switch" aria-label="Musikwünsche zulassen" aria-describedby="studio-wish-state" aria-checked="false"><span class="switch-track" aria-hidden="true"><i></i></span><span id="toggle-label">Aus</span></button>
      </section>
      <section class="studio-section studio-topic" aria-labelledby="studio-topic-label">
        <form id="topic-form" class="studio-topic-form">
          <div class="studio-section-heading"><label id="studio-topic-label" for="studio-topic">Thema der Sendung</label><span id="studio-topic-count">0 / 80</span></div>
          <input id="studio-topic" name="topic" type="text" maxlength="80" placeholder="Worum geht es in deiner Sendung?" aria-describedby="topic-help topic-feedback">
          <div class="studio-topic-footer"><div class="topic-status"><p id="topic-help" class="form-hint">Leer speichern entfernt das Thema.</p><p id="topic-feedback" role="status" aria-live="polite" hidden></p></div><div class="topic-actions"><button id="reset-topic" class="text-button" type="button" aria-label="Änderungen am Thema verwerfen" hidden>Verwerfen</button><button id="save-topic" class="primary-button" type="submit" disabled>Speichern</button></div></div>
        </form>
      </section>
      <section id="studio-handover-card" class="studio-section studio-notes" data-unavailable hidden><section id="studio-received-notes" hidden><h3>Hinweise für deine Sendung</h3><div class="studio-reader"><p id="studio-notes-text"></p></div></section></section>
    </div>
    <div id="handover-placeholder"></div>
  </section>
  <section id="studio-requests" class="studio-pane studio-queue" role="tabpanel" aria-labelledby="studio-queue-tab" hidden>
    <div class="studio-queue-heading"><div><h2 id="queue-heading" tabindex="-1">Musikwünsche <span id="queue-count" class="count-badge">0</span></h2><span id="queue-refresh-feedback" class="form-hint" role="status" aria-live="polite" aria-atomic="true">In Eingangsreihenfolge</span></div><button id="refresh-queue" class="icon-button" type="button" aria-label="Musikwünsche aktualisieren" title="Musikwünsche aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div>
    <div id="queue-notice"></div>
    <div id="queue-body" tabindex="0" role="region" aria-label="Eingegangene Musikwünsche"><div id="request-queue" class="queue" role="list" aria-label="Musikwünsche in Eingangsreihenfolge"></div></div>
  </section>
</section>`);
});

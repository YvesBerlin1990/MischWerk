/* Private Übergabe in vollständig erreichbaren Bediengruppen. */
MischWerkUI.define('handoverMarkup',function(dependencies){
  'use strict';dependencies.dom.mount('handover-placeholder',`
<section id="handover-panel" class="card handover-panel" aria-labelledby="handover-title" hidden>
  <div class="handover-heading"><span class="handover-symbol" aria-hidden="true">↔</span><div><span class="eyebrow">MODERATIONSWECHSEL</span><h2 id="handover-title">Sendung übergeben</h2></div></div>
  <div id="handover-body" class="studio-part-area">
    <section class="studio-part"><p id="handover-description" class="handover-description"></p>
      <section id="handover-note-preview" class="handover-note-preview" hidden><h3>Hinweise zur Übergabe</h3><div class="studio-reader"><p id="handover-note-text"></p></div></section>
      <button id="handover-cancel" class="secondary-button" type="button" hidden>Übergabe abbrechen</button>
    </section>
    <form id="handover-request-form" class="studio-part-form" hidden>
      <section class="studio-part"><label for="handover-target">Nächste Moderation</label><select id="handover-target" required></select></section>
      <section class="studio-part"><div class="handover-notes-heading"><label for="handover-notes">Hinweise für die nächste Moderation</label><span id="handover-notes-count">0 / 500</span></div>
        <textarea id="handover-notes" maxlength="500" rows="3" placeholder="Wichtige Hinweise für die nächste Sendung" aria-describedby="handover-notes-help"></textarea>
        <p id="handover-notes-help" class="form-hint">Nur für euch beide. Bleibt während der übernommenen Sendung verfügbar.</p>
        <button id="handover-request" class="primary-button" type="submit">Übergabe anfragen</button>
      </section>
    </form>
    <form id="handover-accept-form" class="studio-part-form" hidden><section class="studio-part">
      <label for="handover-topic">Thema deiner Sendung</label><input id="handover-topic" type="text" maxlength="80" placeholder="Dein neues Thema" aria-describedby="handover-topic-help">
      <p id="handover-topic-help" class="form-hint">Leer lassen entfernt das bisherige Thema bei der Übernahme.</p>
      <div class="button-row"><button id="handover-accept" class="primary-button" type="submit">Jetzt übernehmen</button><button id="handover-decline" class="secondary-button" type="button">Ablehnen</button></div>
    </section></form>
  </div>
  <nav id="handover-paging" class="studio-part-pagination" aria-label="Schritte der Übergabe" hidden><button class="secondary-button" data-part-previous type="button">Zurück</button><span data-part-label role="status"></span><button class="secondary-button" data-part-next type="button">Weiter</button></nav>
  <button id="handover-back" class="text-button" type="button">← Zurück zu deiner Sendung</button>
</section>`);
});

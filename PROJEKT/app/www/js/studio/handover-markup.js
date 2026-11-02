/* Eigener Arbeitsschritt für den bestätigten Moderationswechsel. */
MischWerkUI.define('handoverMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('handover-placeholder', `
    <section id="handover-panel" class="card handover-panel" aria-labelledby="handover-title" hidden>
      <div class="handover-heading"><span class="handover-symbol" aria-hidden="true">↔</span><div><span class="eyebrow">NÄCHSTE SENDUNG</span><h2 id="handover-title">Sendung übergeben</h2></div></div>
      <p id="handover-description" class="handover-description"></p>
      <form id="handover-request-form" hidden>
        <label for="handover-target">Nächste Moderation</label>
        <select id="handover-target" required></select>
        <button id="handover-request" class="primary-button" type="submit">Übergabe anfragen</button>
      </form>
      <form id="handover-accept-form" hidden>
        <label for="handover-topic">Thema deiner Sendung</label>
        <input id="handover-topic" type="text" maxlength="80" placeholder="Dein neues Thema" aria-describedby="handover-topic-help">
        <p id="handover-topic-help" class="form-hint">Leer lassen entfernt das bisherige Thema bei der Übernahme.</p>
        <div class="button-row"><button id="handover-accept" class="primary-button" type="submit">Jetzt übernehmen</button><button id="handover-decline" class="secondary-button" type="button">Ablehnen</button></div>
      </form>
      <button id="handover-cancel" class="secondary-button" type="button" hidden>Übergabe abbrechen</button>
      <button id="handover-back" class="text-button" type="button">← Zurück zum Studio</button>
    </section>
  `);
});

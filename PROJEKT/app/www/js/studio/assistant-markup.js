/* Statische Vorlage des Sendungsassistenten; keine zusätzlichen Hörer- oder Anbieterdaten. */
MischWerkUI.define('assistantMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('assistant-placeholder', `
    <section id="assistant-block" class="assistant-block" aria-label="Sendungsassistent" hidden>
      <details id="studio-assistant">
        <summary>Sendungsassistent<span id="assistant-summary"></span></summary>
        <dl class="assistant-values">
          <div><dt>Seit der Anmeldung</dt><dd id="assistant-elapsed">—</dd></div>
          <div><dt id="assistant-plan-label">Geplante Sendung</dt><dd id="assistant-plan"></dd></div>
          <div><dt>Danach am Mikrofon</dt><dd id="assistant-next"></dd></div>
        </dl>
        <p id="assistant-topic-copy" class="assistant-topic-copy" hidden></p>
        <button id="assistant-topic" class="secondary-button" type="button" hidden>Geplantes Thema übernehmen</button>
        <section id="assistant-notes" class="assistant-notes" hidden><h3>Übernommene Hinweise</h3><p id="assistant-notes-text"></p></section>
      </details>
      <p id="assistant-reminder" class="assistant-reminder" role="status" aria-live="polite" hidden></p>
    </section>
  `);
});

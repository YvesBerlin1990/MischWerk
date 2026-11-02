/* Neue Wunschbox-Vorlage; IDs und Formularvertrag des bestehenden Controllers bleiben erhalten. */
MischWerkUI.define('wishesMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('wishes-placeholder', `
    <section id="wishes-panel" aria-label="Wunschbox" hidden>
      <header id="wish-drawer-heading" class="wish-drawer-heading" hidden><h2 id="inline-wish-title">Wunschbox</h2><button id="close-wishes" class="icon-button" type="button" aria-label="Wunschbox schließen" title="Wunschbox schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <form id="wish-form" class="wish-compose">
        <fieldset id="wish-fields" disabled>
          <div class="wish-label-row">
            <label for="wish-text">Interpret und Titel</label>
            <svg class="wish-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12M9 9l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
          </div>
          <div class="wish-editor">
            <textarea name="text" id="wish-text" required maxlength="300" rows="3" placeholder="z. B. a-ha – Take On Me" aria-describedby="wish-rules wish-text-count"></textarea>
            <div class="wish-editor-footer"><span id="wish-text-count">0 / 300</span></div>
          </div>
          <p id="wish-rules" class="wish-rules">Bitte nur Interpret und Titel, keine Links.</p>
          <button class="primary-button wish-send" type="submit" id="submit-wish"><span>Wunsch senden</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14"/></svg></button>
        </fieldset>
        <div id="wish-feedback" class="wish-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></div>
        <p class="form-hint" id="wish-hint" role="status" hidden></p>
      </form>
      <section id="wish-positions" class="wish-positions" aria-labelledby="wish-positions-heading" hidden>
        <div class="list-heading"><h2 id="wish-positions-heading">Deine offenen Wünsche</h2><button id="refresh-wish-positions" class="icon-button" type="button" aria-label="Positionen aktualisieren" title="Positionen aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button></div>
        <p id="wish-positions-status" class="form-hint" role="status" hidden></p>
        <ol id="wish-positions-list" class="wish-positions-list"></ol>
        <nav id="wish-positions-pages" class="pagination" aria-label="Deine Wünsche durchblättern" hidden><button id="prev-wish-positions" class="secondary-button" type="button">← Zurück</button><span id="wish-positions-page"></span><button id="next-wish-positions" class="secondary-button" type="button">Weiter →</button></nav>
        <p class="wish-position-note">Wann dein Song läuft, entscheidet die Moderation.</p>
      </section>
    </section>
  `);
});

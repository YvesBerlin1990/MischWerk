/* Neue Wunschbox-Vorlage; IDs und Formularvertrag des bestehenden Controllers bleiben erhalten. */
MischWerkUI.define('wishesMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('wishes-placeholder', `
    <section id="wishes-panel" aria-label="Wunschbox" hidden>
      <header id="wish-drawer-heading" class="wish-drawer-heading dialog-header" hidden><span class="dialog-brand"><img src="img/mischwerk-logo.png" width="57" height="67" loading="lazy" decoding="async" alt="MischWerk"></span><div class="dialog-heading"><span class="eyebrow">Die Mischung macht’s.</span><h2 id="inline-wish-title">MischWerk Wunschbox</h2></div><button id="close-wishes" class="icon-button" type="button" aria-label="Wunschbox schließen" title="Wunschbox schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <button id="wish-compose-open" class="secondary-button" type="button" aria-controls="wish-form" hidden>Weiteren Wunsch eingeben</button>
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
          <p id="wish-rules" class="wish-rules">Welcher Song darf’s sein?</p>
          <button class="primary-button wish-send" type="submit" id="submit-wish"><span>Wunsch senden</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14"/></svg></button>
        </fieldset>
        <div id="wish-feedback" class="wish-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></div>
        <p class="form-hint" id="wish-hint" role="status" hidden></p>
      </form>
    </section>
  `);
});

/* Statischer Aufbau der Wunschbox. Keine Nutzereingaben als HTML. */
MischWerkUI.define('wishesMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('wishes-placeholder', `
    <section id="wishes-panel" aria-label="Wunschbox" hidden>
          <form id="wish-form" class="card form-card">
            <fieldset id="wish-fields" disabled>
              <label for="wish-text">Interpret und Titel<textarea name="text" id="wish-text" required maxlength="300" rows="3" placeholder="z. B. a-ha – Take On Me" aria-describedby="wish-rules wish-text-count"></textarea></label>
              <div class="wish-input-meta"><p id="wish-rules" class="wish-rules">Bitte nur Interpret und Titel, keine Links.</p><span id="wish-text-count">0 / 300</span></div>
              <div class="form-footer"><button class="primary-button" type="submit" id="submit-wish">Wunsch senden</button></div>
            </fieldset>
            <div id="wish-feedback" class="wish-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></div>
            <p class="form-hint" id="wish-hint" role="status" hidden></p>
          </form>
    </section>
`);
});

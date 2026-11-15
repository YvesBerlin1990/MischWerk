/* Neue Wunschbox-Vorlage; IDs und Formularvertrag des bestehenden Controllers bleiben erhalten. */
MischWerkUI.define('wishesMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('wishes-placeholder', `
    <section id="wishes-panel" aria-label="Wunschbox" hidden>
      <header id="wish-drawer-heading" class="wish-drawer-heading dialog-header" hidden><div class="dialog-heading"><span class="eyebrow">MischWerk</span><h2 id="inline-wish-title">Wunschbox</h2></div><button id="close-wishes" class="icon-button" type="button" aria-label="Wunschbox schließen" title="Wunschbox schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <section id="wish-tracking" class="wish-tracking" aria-labelledby="wish-tracking-title" hidden>
        <p class="wish-live-label">Dein Live-Status</p><h3 id="wish-tracking-title" aria-live="polite" aria-atomic="true">Dein Wunsch im Blick</h3>
        <div class="wish-tracking-summary" role="status" aria-live="polite" aria-atomic="true"><strong id="wish-tracking-song"></strong><div class="wish-tracking-meta"><strong id="wish-tracking-rank"></strong><span id="wish-tracking-stage"></span></div><p id="wish-tracking-more"></p></div>
        <ol id="wish-tracking-steps" class="wish-tracking-steps" aria-label="Wunschstatus"><li>Eingegangen</li><li>In Vorbereitung</li><li>Jetzt dran</li></ol>
        <p id="wish-tracking-location" class="wish-tracking-location">Deinen Platz und Status findest du hier – auch beim erneuten Öffnen. In breiten Radioleisten steht dein Wunsch zusätzlich rechts.</p>
        <p class="wish-tracking-note">Der Status kommt von der Moderation. Eine feste Spielzeit gibt es nicht.</p>
        <button id="wish-back-radio" class="primary-button" type="button">Zurück zum Radio</button>
      </section>
      <button id="wish-compose-open" class="secondary-button" type="button" aria-controls="wish-form" hidden>Weiteren Wunsch eingeben</button>
      <form id="wish-form" class="wish-compose">
        <div class="wish-intro"><strong>Wünschen. Zurücklehnen. Mitverfolgen.</strong><p>Nach dem Senden siehst du hier deinen Platz und Status. In breiten Radioleisten findest du deinen Wunsch auch direkt rechts.</p></div>
        <fieldset id="wish-fields" disabled>
          <div class="wish-label-row">
            <label for="wish-text">Dein Musikwunsch</label>
            <svg class="wish-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12M9 9l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
          </div>
          <div class="wish-editor">
            <textarea name="text" id="wish-text" required maxlength="300" rows="3" placeholder="z. B. a-ha – Take On Me" aria-describedby="wish-rules wish-text-count"></textarea>
            <div class="wish-editor-footer"><span id="wish-text-count">0 / 300</span></div>
          </div>
          <p id="wish-rules" class="wish-rules">Interpret, Titel und optional ein Gruß. Bitte ohne Links.</p>
          <button class="primary-button wish-send" type="submit" id="submit-wish"><span>Wunsch senden</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14"/></svg></button>
        </fieldset>
        <div id="wish-feedback" class="wish-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></div>
        <p class="form-hint" id="wish-hint" role="status" hidden></p>
      </form>
    </section>
  `);
});

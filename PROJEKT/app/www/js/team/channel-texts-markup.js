/* Bot-Texte einzeln bearbeiten; Versand und gespeicherte Reihenfolge bleiben erhalten. */
MischWerkUI.define('channelTextsMarkup', function (dependencies) {
  dependencies.dom.mount('channel-texts-slot', `
<section id="channel-texts-panel" role="tabpanel" aria-labelledby="team-texts-tab" hidden>
  <form id="channel-texts-form" class="channel-texts-form">
    <div id="channel-texts-scroll" class="channel-texts-scroll" role="region" aria-label="Bot-Texte bearbeiten" tabindex="0">
      <p class="form-hint channel-texts-intro">Deine Texte erscheinen abwechselnd im Channel.</p>
      <div class="channel-texts-options">
        <label class="channel-texts-toggle" for="channel-texts-enabled"><input id="channel-texts-enabled" type="checkbox">Automatisch senden</label>
        <label for="channel-texts-interval">Abstand<select id="channel-texts-interval"><option value="20">20 Minuten</option><option value="30">30 Minuten</option><option value="40">40 Minuten</option><option value="50">50 Minuten</option></select></label>
      </div>
      <p id="channel-texts-status" class="channel-texts-status" role="status" aria-live="polite">Wird geladen …</p>
      <div class="channel-texts-picker">
        <label class="sr-only" for="channel-texts-current">Text auswählen</label>
        <select id="channel-texts-current" aria-controls="channel-texts-fields"></select>
        <button id="channel-texts-add" type="button" class="secondary-button" aria-label="Text hinzufügen" title="Text hinzufügen">+</button>
      </div>
      <div id="channel-texts-fields" class="channel-texts-fields"></div>
      <details class="channel-texts-help"><summary>Smileys verwenden</summary><p>Einmal privat an den Bot senden: <code>smiley DEIN-CODE</code>. Danach das Kürzel im Text nutzen. Leere Texte werden übersprungen.</p></details>
    </div>
    <div id="channel-texts-actions" class="channel-texts-actions">
      <button id="channel-texts-save" type="submit" class="primary-button">Speichern</button>
      <button id="channel-texts-refresh" type="button" class="icon-button" aria-label="Texte aktualisieren" title="Texte aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button>
      <button id="channel-texts-reload" type="button" class="secondary-button" hidden>Neu laden</button>
      <p id="channel-texts-feedback" class="form-hint" role="status" aria-live="polite"></p>
    </div>
  </form>
</section>`);
});

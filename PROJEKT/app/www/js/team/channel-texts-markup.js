/* Eigener Verwaltungsbereich; mehrere Klartextfelder für abwechselnde öffentliche Ausgaben. */
MischWerkUI.define('channelTextsMarkup', function (dependencies) {
  dependencies.dom.mount('channel-texts-slot', `
<section id="channel-texts-panel" role="tabpanel" aria-labelledby="team-texts-tab" hidden>
  <form id="channel-texts-form" class="channel-texts-form">
    <h2>Öffentliche Bot-Texte</h2>
    <p class="form-hint">Der Bot sendet deine Texte der Reihe nach in den Channel. Leere Felder werden übersprungen.</p>
    <div class="channel-texts-options">
      <label class="channel-texts-toggle" for="channel-texts-enabled"><input id="channel-texts-enabled" type="checkbox">Automatisch senden</label>
      <label for="channel-texts-interval">Abstand<select id="channel-texts-interval"><option value="20">20 Minuten</option><option value="30">30 Minuten</option><option value="40">40 Minuten</option><option value="50">50 Minuten</option></select></label>
    </div>
    <p id="channel-texts-status" class="channel-texts-status" role="status" aria-live="polite">Einstellungen werden geladen …</p>
    <div id="channel-texts-fields" class="channel-texts-fields"></div>
    <button id="channel-texts-add" type="button" class="secondary-button">Weiteren Text hinzufügen</button>
    <div class="channel-texts-actions">
      <button id="channel-texts-save" type="submit" class="primary-button">Speichern</button>
      <button id="channel-texts-refresh" type="button" class="secondary-button">Aktualisieren</button>
      <button id="channel-texts-reload" type="button" class="secondary-button" hidden>Gespeicherte Texte laden</button>
      <p id="channel-texts-feedback" class="form-hint" role="status" aria-live="polite"></p>
    </div>
  </form>
</section>`);
});

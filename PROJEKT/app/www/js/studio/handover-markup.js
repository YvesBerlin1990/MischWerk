/* Neu aufgebaute private Übergabe im bestehenden nativen Fenster. */
MischWerkUI.define('handoverMarkup',function(dependencies){
 'use strict';dependencies.dom.mount('handover-placeholder',`
<section id="handover-panel" class="handover-panel" aria-labelledby="handover-title" hidden>
 <div class="handover-heading"><h2 id="handover-title">Sendung übergeben</h2><button id="handover-back" class="text-button" type="button">Zurück</button></div>
 <div id="handover-body">
  <p id="handover-description" class="handover-description handover-group"></p>
  <section id="handover-note-preview" class="handover-note-preview handover-group" hidden><h3>Hinweise zur Übergabe</h3><div class="studio-reader"><p id="handover-note-text"></p></div></section>
  <button id="handover-cancel" class="secondary-button handover-group" type="button" hidden>Übergabe abbrechen</button>
  <form id="handover-request-form" hidden>
   <div class="handover-group"><label for="handover-target">Nächste Moderation</label><select id="handover-target" required></select></div>
   <div class="handover-group"><div class="handover-notes-heading"><label for="handover-notes">Hinweise zur Sendung</label><span id="handover-notes-count">0 / 500</span></div>
   <textarea id="handover-notes" maxlength="500" rows="3" aria-describedby="handover-notes-help" placeholder="Was soll die nächste Moderation wissen?"></textarea>
   <p id="handover-notes-help" class="form-hint">Nur für euch beide. Bleibt während der übernommenen Sendung verfügbar.</p></div>
   <div class="handover-group"><button id="handover-request" class="primary-button" type="submit">Übergabe anfragen</button></div>
  </form>
  <form id="handover-accept-form" hidden>
   <div class="handover-group"><label for="handover-topic">Thema deiner Sendung</label><input id="handover-topic" type="text" maxlength="80" aria-describedby="handover-topic-help" placeholder="Dein neues Thema">
   <p id="handover-topic-help" class="form-hint">Leer lassen entfernt das bisherige Thema bei der Übernahme.</p></div>
   <div class="button-row handover-group"><button id="handover-accept" class="primary-button" type="submit">Jetzt übernehmen</button><button id="handover-decline" class="secondary-button" type="button">Ablehnen</button></div>
  </form>
 </div>
</section>`);
});

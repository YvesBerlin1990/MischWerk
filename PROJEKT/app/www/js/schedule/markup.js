/* Eigenständiger Wochenplan mit einer ausschließlich für den Besitzer sichtbaren Eingabe. */
MischWerkUI.define('scheduleMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('schedule-placeholder', `
    <section id="schedule-panel" aria-label="Wöchentlicher Sendeplan" hidden>
      <div id="schedule-calendar">
      <div class="schedule-intro">
        <span class="schedule-intro-label">Deine Moderation</span>
        <div class="schedule-hosts" aria-label="Aktuelles Moderationsteam">
          <span class="schedule-host"><span class="schedule-host-initial" aria-hidden="true">O</span>Otterchen</span>
          <span class="schedule-host"><span class="schedule-host-initial" aria-hidden="true">P</span>Polaroid</span>
        </div>
      </div>
      <section class="schedule-controls" aria-label="Woche und Sendeplanaktionen">
        <nav class="schedule-navigation" aria-label="Kalenderwoche">
          <button id="schedule-previous" class="secondary-button schedule-step" type="button" aria-label="Vorherige Woche" title="Vorherige Woche"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
          <div class="schedule-week"><span>Deine Radiowoche</span><strong id="schedule-range">Sendeplan</strong></div>
          <button id="schedule-next" class="secondary-button schedule-step" type="button" aria-label="Nächste Woche" title="Nächste Woche"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
        </nav>
        <div class="schedule-toolbar">
          <button id="schedule-current" class="secondary-button" type="button">Diese Woche</button>
          <button id="schedule-refresh" class="icon-button" type="button" aria-label="Sendeplan aktualisieren" title="Sendeplan aktualisieren"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 11m2 4a7 7 0 0 0 12 2l2-4"/></svg></button>
          <button id="schedule-new" class="secondary-button" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Sendung eintragen</button>
        </div>
      </section>
      <p id="schedule-summary" class="schedule-summary" role="status" aria-live="polite"></p>
      <p id="schedule-feedback" class="schedule-feedback" role="status" aria-live="polite">Sendeplan wird geladen …</p>
      <div id="schedule-days" class="schedule-days" aria-label="Sendungen der Woche"></div>
      <nav id="schedule-pagination" class="schedule-pagination" aria-label="Seiten der Kalenderwoche" hidden>
        <button id="schedule-page-previous" class="secondary-button" type="button" aria-controls="schedule-days">Zurück</button>
        <span id="schedule-page-label" role="status" aria-live="polite"></span>
        <button id="schedule-page-next" class="secondary-button" type="button" aria-controls="schedule-days">Weiter</button>
      </nav>
      <form id="schedule-form" class="card schedule-form" hidden>
        <fieldset id="schedule-fields">
          <h2 id="schedule-editor-title">Sendung eintragen</h2>
          <div class="schedule-form-grid">
            <label for="schedule-kind">Sendeart<select id="schedule-kind"><option value="live">Live</option><option value="autodj">AutoDJ</option></select></label>
            <label for="schedule-timing">Laufzeit<select id="schedule-timing"><option value="fixed">Feste Zeit</option><option value="allDay">Ganztags</option><option value="openEnd">Open End</option></select></label>
            <label for="schedule-date">Datum<input id="schedule-date" type="date" required></label>
            <label for="schedule-nick">Moderator<input id="schedule-nick" type="text" maxlength="50" required autocomplete="off" placeholder="Knuddels-Nick"></label>
            <label id="schedule-start-field" for="schedule-start">Von<input id="schedule-start" type="time" required></label>
            <label id="schedule-end-field" for="schedule-end">Bis<input id="schedule-end" type="time" required></label>
          </div>
          <label for="schedule-topic">Thema<input id="schedule-topic" type="text" maxlength="80" required placeholder="Thema der Sendung"></label>
          <p id="schedule-timing-hint" class="form-hint">Ein Ende vor dem Beginn liegt am Folgetag. Live: Channelinhaber oder Radio-Team.</p>
          <div class="schedule-form-actions">
            <button id="schedule-save" class="primary-button" type="submit">Speichern</button>
            <button id="schedule-cancel" class="secondary-button" type="button">Zurück zur Woche</button>
            <button id="schedule-delete" class="text-button" type="button" hidden>Sendung löschen</button>
          </div>
        </fieldset>
      </form>
      </div>
    </section>
`);
});

/* Ausschließlich lesende Tagesansicht; Einträge werden auf der Homepage gepflegt. */
MischWerkUI.define('scheduleMarkup', function (dependencies) {
  'use strict';
  var dom = dependencies.dom;
  dom.mount('schedule-placeholder', `
    <section id="schedule-panel" aria-labelledby="dialog-title" hidden>
      <nav class="schedule-day-nav" aria-label="Tag auswählen">
        <button id="schedule-previous" class="schedule-arrow" type="button" aria-label="Vorheriger Tag" title="Vorheriger Tag" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button>
        <button id="schedule-today" class="schedule-date" type="button" title="Heutiges Programm anzeigen" disabled><span id="schedule-date-hint">Heute</span><time id="schedule-date-label">Tagesprogramm</time></button>
        <button id="schedule-next" class="schedule-arrow" type="button" aria-label="Nächster Tag" title="Nächster Tag" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
      </nav>
      <div id="schedule-message" role="status" aria-live="polite">Programm wird geladen …</div>
      <button id="schedule-retry" class="secondary-button" type="button" hidden>Erneut laden</button>
      <ol id="schedule-list" aria-label="Sendungen des Tages" tabindex="0"></ol>
    </section>
  `);
  return {};
});

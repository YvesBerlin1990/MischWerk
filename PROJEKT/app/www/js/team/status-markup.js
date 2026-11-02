/* Neu aufgebautes Statuspult; ausschließlich mitgelieferte Texte als HTML. */
MischWerkUI.define('statusMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('team-status-placeholder', `
    <section id="team-status" aria-labelledby="status-heading" hidden>
      <header class="list-heading status-heading"><h2 id="status-heading">Statuszentrale</h2><button id="refresh-status" class="secondary-button" type="button">Jetzt prüfen</button></header>
      <section id="status-mode" class="status-mode" data-tone="neutral" aria-label="Sendebetrieb bei STREAMPANEL">
        <div class="status-mode-main"><span class="eyebrow">STREAMPANEL · Titelstatus</span><strong id="status-mode-value">Noch nicht geprüft</strong></div>
        <p id="status-mode-warning" class="status-warning" role="status" hidden></p>
      </section>
      <section class="status-grid" aria-label="Radio und Channel im Überblick">
        <article id="status-transmission" class="status-item" data-tone="neutral"><h3>Übertragung</h3><strong id="status-transmission-value">Noch nicht geprüft</strong></article>
        <article id="status-listeners" class="status-item" data-tone="neutral"><h3>Aktuelle Hörer</h3><strong id="status-listeners-value">Noch nicht geprüft</strong></article>
        <article id="status-metadata" class="status-item" data-tone="neutral"><h3>Titelabruf</h3><strong id="status-metadata-value">Noch nicht geprüft</strong></article>
        <article id="status-studio" class="status-item" data-tone="neutral"><h3>ON AIR · Studio</h3><strong id="status-studio-value">Noch nicht geprüft</strong></article>
        <article id="status-app" class="status-item" data-tone="neutral"><h3>App-Verbindung</h3><strong id="status-app-value">Noch nicht geprüft</strong></article>
        <article id="status-wishes" class="status-item" data-tone="neutral"><h3>Wunschbox</h3><strong id="status-wishes-value">Noch nicht geprüft</strong></article>
        <article id="status-queue" class="status-item" data-tone="neutral"><h3>Offene Musikwünsche</h3><strong id="status-queue-value">Noch nicht geprüft</strong></article>
        <article id="status-topic" class="status-item" data-tone="neutral"><h3>Sendungsthema</h3><strong id="status-topic-value">Noch nicht geprüft</strong></article>
      </section>
      <details id="status-details" class="status-details">
        <summary>Details &amp; Prüfzeiten</summary>
        <p id="status-refresh-note" class="status-refresh-note" role="status">Automatische Aktualisierung: 30 Sekunden nach der letzten abgeschlossenen Prüfung, bei Abruffehlern nach 60 Sekunden.</p>
        <dl class="status-detail-list">
          <div><dt>Sendebetrieb · STREAMPANEL</dt><dd id="status-mode-detail"></dd></div>
          <div><dt>Übertragung · STREAMPANEL</dt><dd id="status-transmission-detail"></dd></div>
          <div><dt>ON AIR · Studio</dt><dd id="status-studio-detail"></dd></div>
          <div><dt>Aktuelle Hörer</dt><dd id="status-listeners-detail"></dd></div>
          <div><dt>Titelabruf · STREAMPANEL</dt><dd id="status-metadata-detail"></dd></div>
          <div><dt>App-Verbindung</dt><dd id="status-app-detail"></dd></div>
          <div><dt>Wunschbox</dt><dd id="status-wishes-detail"></dd></div>
          <div><dt>Offene Musikwünsche</dt><dd id="status-queue-detail"></dd></div>
          <div><dt>Sendungsthema</dt><dd id="status-topic-detail"></dd></div>
        </dl>
        <nav class="pagination" aria-label="Statusdetails durchblättern"><button id="prev-status-detail" class="secondary-button" type="button">← Zurück</button><span id="status-detail-page"></span><button id="next-status-detail" class="secondary-button" type="button">Weiter →</button></nav>
        <p class="fine-print">LIVE/AutoDJ folgt ausschließlich der aktuellen STREAMPANEL-Titelkennzeichnung, nicht der Studio-Anmeldung. Dies ist kein separater Encoder-Verbindungstest. Anbieter-Cache und Titelverzögerungen sind möglich.</p>
        <a class="status-provider-link" href="https://status.streampanel.net/" target="_blank" rel="noopener noreferrer">Offizielle STREAMPANEL-Störungsübersicht ↗</a>
      </details>
    </section>
  `);
});

/* Statische Vorhangfläche und getrenntes Werbe-Audio, ausschließlich in der Radioleiste. */
MischWerkUI.define('curtainMarkup', function (dependencies) {
  'use strict';
  dependencies.dom.mount('curtain-placeholder', `
    <section id="radio-curtain" class="radio-curtain" aria-labelledby="curtain-title" hidden>
      <div class="curtain-content">
        <img class="curtain-logo" src="img/mischwerk-logo.png" width="80" height="80" loading="lazy" decoding="async" alt="MischWerk">
        <div class="curtain-copy"><span>Die Mischung macht’s.</span><h2 id="curtain-title">Radio MischWerk</h2></div>
        <div class="curtain-ad-controls">
          <button id="curtain-ad" class="curtain-ad" type="button" aria-label="Werbung abspielen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18l15-9Z" fill="currentColor" stroke="none"/></svg><span id="curtain-ad-label">Werbung starten</span></button>
          <p id="curtain-message" role="status" aria-live="polite" hidden></p>
        </div>
      </div>
    </section>
    <audio id="curtain-audio" preload="none"></audio>
  `);
});

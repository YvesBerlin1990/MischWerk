/* Bestätigter Sendertext unter dem Radio; Bewegung bleibt lokal und unabhängig vom Audio. */
MischWerkUI.define('radioTicker', function (dependencies) {
  'use strict';
  var model = dependencies.model, dom = dependencies.dom, signals = dependencies.signals;
  dom.mount('radio-ticker-placeholder', `
    <section id="radio-ticker" class="radio-ticker" aria-label="Hinweis von Radio MischWerk" hidden>
      <span class="radio-ticker-label" aria-hidden="true">Information:</span>
      <div id="radio-ticker-window" class="radio-ticker-window" aria-hidden="true"><div id="radio-ticker-track" class="radio-ticker-track"><span></span><span></span></div></div>
      <span id="radio-ticker-readable" class="sr-only" role="status" aria-live="polite"></span>
      <button id="radio-ticker-pause" class="radio-ticker-pause" type="button" aria-label="Lauftext anhalten" aria-pressed="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <g class="radio-ticker-symbol-pause"><rect x="6" y="3" width="4" height="18" rx="1"/><rect x="14" y="3" width="4" height="18" rx="1"/></g>
          <path class="radio-ticker-symbol-play" d="M7 4 21 12 7 20Z"/>
        </svg>
      </button>
    </section>
  `);
  var line = dom.el('radio-ticker'), track = dom.el('radio-ticker-track');
  var pause = dom.el('radio-ticker-pause'), copies = track.children;
  var paused = false, disposed = false, signature = '', speed = 48;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function measure() {
    if (line.hidden || disposed) { return; }
    var minimum = dom.el('radio-ticker-window').clientWidth;
    Array.from(copies).forEach(function (copy) { copy.style.minWidth = minimum + 'px'; });
    track.style.setProperty('--ticker-duration', Math.max(1, copies[0].getBoundingClientRect().width / speed) + 's');
    signals.emit('radio-layout');
  }
  function movement() {
    line.classList.toggle('ticker-paused', paused || document.hidden || disposed);
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Lauftext fortsetzen' : 'Lauftext anhalten');
  }
  function render() {
    var state = model.current(), value = state && state.ticker;
    var show = !!(value && value.enabled === true && typeof value.text === 'string' && value.text.trim());
    var key = JSON.stringify(show ? [value.text, value.speed, value.direction] : null);
    if (signature === key) { return; }
    signature = key; line.hidden = !show;
    document.documentElement.classList.toggle('radio-has-ticker', show);
    if (show) {
      Array.from(copies).forEach(function (copy) { copy.textContent = value.text; });
      dom.setText('radio-ticker-readable', value.text);
      line.title = value.text;
      speed = [32, 48, 72].indexOf(value.speed) !== -1 ? value.speed : 48;
      track.style.animationDirection = value.direction === 'right' ? 'reverse' : 'normal';
      measure();
    } else {
      Array.from(copies).forEach(function (copy) { copy.textContent = ''; });
      dom.setText('radio-ticker-readable', '');
    }
    movement(); signals.emit('radio-layout');
  }
  function start() {
    signals.on('snapshot', render);
    pause.addEventListener('click', function () { paused = !paused; movement(); });
    document.addEventListener('visibilitychange', movement);
    window.addEventListener('resize', measure);
    if (motion.addEventListener) { motion.addEventListener('change', measure); }
    if (typeof ResizeObserver === 'function') { new ResizeObserver(measure).observe(line); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
    window.addEventListener('pagehide', function () { disposed = true; movement(); });
    window.addEventListener('pageshow', function () { disposed = false; movement(); measure(); });
  }
  return { start:start };
});

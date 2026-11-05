/* Eine Inhalts-Scrollfläche und mitwachsende Textfelder; keine Fenstergrößen- oder Versandlogik. */
MischWerkUI.define('channelTextsLayout', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, signals = dependencies.signals;
  var active = false, position = 0, replacing = false, width = 0, observer;
  var pane = dom.el('channel-texts-scroll');
  function grow(field) {
    field.style.height = 'auto';
    field.style.height = Math.max(70, field.scrollHeight + 2) + 'px';
    field.scrollTop = 0;
  }
  function fit() {
    if (!active) { return; }
    var top = replacing ? position : pane.scrollTop;
    pane.querySelectorAll('textarea').forEach(grow);
    pane.scrollTop = top;
    position = pane.scrollTop;
    replacing = false;
  }
  function caret(field) {
    var box = field.getBoundingClientRect(), clip = pane.getBoundingClientRect();
    var end = field.selectionEnd === field.value.length;
    if (end && box.bottom > clip.bottom - 12) { pane.scrollTop += box.bottom - clip.bottom + 12; }
    else if (field.selectionEnd === 0 && box.top < clip.top + 12) { pane.scrollTop += box.top - clip.top - 12; }
  }
  function select(open) {
    active = !!open;
    document.documentElement.classList.toggle('channel-texts-open', active);
    if (active) {
      window.scrollTo(0, 0);
      replacing = true;
      fit();
    }
  }
  function start() {
    signals.on('channel-texts-panel', select);
    signals.on('channel-texts-before-fields', function () {
      if (active) { position = pane.scrollTop; replacing = true; }
    });
    signals.on('channel-texts-fields', fit);
    pane.addEventListener('scroll', function () { if (active) { position = pane.scrollTop; } }, { passive:true });
    pane.addEventListener('input', function (event) {
      if (!active || event.target.tagName !== 'TEXTAREA') { return; }
      var top = pane.scrollTop;
      grow(event.target);
      pane.scrollTop = top;
      caret(event.target);
    });
    pane.addEventListener('keyup', function (event) {
      if (active && event.target.tagName === 'TEXTAREA') { caret(event.target); }
    });
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(function () {
        if (!active || pane.clientWidth === width) { return; }
        width = pane.clientWidth;
        fit();
      });
      observer.observe(pane);
    }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
    window.addEventListener('pagehide', function () { if (observer) { observer.disconnect(); } });
  }
  return { start:start };
});

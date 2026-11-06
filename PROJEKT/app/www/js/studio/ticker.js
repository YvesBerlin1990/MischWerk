/* Lauftextentwurf im vorhandenen Moderationsmenü; nur bestätigte Werte werden öffentlich. */
MischWerkUI.define('studioTicker', function (dependencies) {
  'use strict';
  var model = dependencies.model, dom = dependencies.dom, commands = dependencies.commands, signals = dependencies.signals;
  dom.mount('ticker-editor-placeholder', `
    <section id="studio-ticker-panel" role="tabpanel" aria-labelledby="studio-ticker-tab" hidden>
    <section id="ticker-editor" class="ticker-editor" aria-labelledby="ticker-heading">
      <form id="ticker-form">
        <div class="ticker-heading"><h3 id="ticker-heading">Lauftext</h3><span id="ticker-count">0 / 300</span></div>
        <label for="ticker-text">Text für alle Hörer</label>
        <textarea id="ticker-text" rows="3" maxlength="300" aria-describedby="ticker-help ticker-feedback"></textarea>
        <p id="ticker-help" class="form-hint">Erscheint unter der Appleiste. Einschalten benötigt einen Text.</p>
        <div class="ticker-options">
          <label for="ticker-speed">Tempo<select id="ticker-speed"><option value="32">Langsam</option><option value="48">Normal</option><option value="72">Zügig</option></select></label>
          <label for="ticker-direction">Laufrichtung<select id="ticker-direction"><option value="left">Nach links</option><option value="right">Nach rechts</option></select></label>
        </div>
        <label class="ticker-enabled" for="ticker-enabled"><input id="ticker-enabled" type="checkbox">Lauftext einschalten</label>
        <p id="ticker-feedback" role="status" aria-live="polite"></p>
        <div class="button-row"><button id="ticker-save" class="primary-button" type="submit" disabled>Speichern</button><button id="ticker-reset" class="secondary-button" type="button" hidden>Verwerfen</button><button id="ticker-reload" class="secondary-button" type="button" hidden>Aktuellen Stand laden</button></div>
      </form>
    </section>
    </section>
  `);
  var dirty = false, base = null, pendingValue = null, requestId = null;
  var fields = ['ticker-text','ticker-speed','ticker-direction','ticker-enabled'];
  function allowed() { return !!(model.current() && model.current().user.canModerate === true); }
  function current() { return model.current() && model.current().ticker || {text:'',speed:48,direction:'left',enabled:false,revision:0}; }
  function value() { return {text:dom.el('ticker-text').value,speed:Number(dom.el('ticker-speed').value),direction:dom.el('ticker-direction').value,enabled:dom.el('ticker-enabled').checked}; }
  function fill(source) {
    dom.el('ticker-text').value = source.text; dom.el('ticker-speed').value = String(source.speed);
    dom.el('ticker-direction').value = source.direction; dom.el('ticker-enabled').checked = source.enabled;
  }
  function key(source) { return JSON.stringify([source.text,source.speed,source.direction,source.enabled]); }
  function feedback(message, error) { dom.setText('ticker-feedback',message); dom.el('ticker-feedback').classList.toggle('error',!!error); signals.emit('studio-layout'); }
  function controls() {
    var permitted = allowed(), disabled = !permitted || !model.connected() || commands.pending();
    fields.forEach(function (id) { dom.el(id).disabled = disabled; });
    dom.el('ticker-save').disabled = disabled || !dirty || (value().enabled && !value().text.trim());
    dom.el('ticker-save').setAttribute('aria-busy',String(!!requestId));
    dom.el('ticker-reset').hidden = !dirty; dom.el('ticker-reset').disabled = disabled;
    dom.el('ticker-reload').hidden = !dirty || base === current().revision; dom.el('ticker-reload').disabled = disabled;
    dom.setText('ticker-count',dom.el('ticker-text').value.length + ' / 300');
  }
  function render() {
    if (!allowed()) { dirty = false; base = null; requestId = null; pendingValue = null; fill({text:'',speed:48,direction:'left',enabled:false}); feedback('',false); controls(); return; }
    if (!dirty) { fill(current()); base = current().revision; }
    else if (base !== current().revision && !requestId) { feedback('Inzwischen geändert. Dein Entwurf bleibt erhalten. Bitte aktuellen Stand laden.',true); }
    controls();
  }
  function reset() { dirty = false; requestId = null; pendingValue = null; fill(current()); base = current().revision; feedback('',false); controls(); }
  function measure() {
    var panel = dom.el('studio-ticker-panel');
    if (!panel.getClientRects().length || !allowed()) { return; }
    signals.emit('studio-natural-height',{tab:'ticker',height:panel.getBoundingClientRect().top +
      dom.el('ticker-editor').getBoundingClientRect().height + parseFloat(getComputedStyle(document.querySelector('.dialog-shell')).paddingBottom)});
  }
  function start() {
    fields.forEach(function (id) {
      if (id !== 'ticker-text') { dom.el(id).addEventListener('input',function (event) { event.stopPropagation(); }); }
      dom.el(id).addEventListener(id === 'ticker-text' ? 'input' : 'change',function (event) {
      event.stopPropagation();
      if (!allowed()) { return; }
      if (!dirty) { base = current().revision; }
      dirty = key(value()) !== key(current()); feedback(dirty ? 'Ungespeicherte Änderungen' : '',false); controls();
      signals.emit('overlay-dirty');
    }); });
    ['ticker-reset','ticker-reload'].forEach(function (id) { dom.el(id).addEventListener('click',function () { if (!this.disabled) { reset(); signals.emit('overlay-dirty'); dom.el('ticker-text').focus(); } }); });
    dom.el('ticker-form').addEventListener('submit',function (event) {
      event.preventDefault(); if (dom.el('ticker-save').disabled || !this.reportValidity()) { return; }
      pendingValue = key(value()); feedback('Lauftext wird gespeichert …',false);
      var data = value(); data.expectedTickerRevision = base;
      commands.send('mw:setTicker',data,true);
    });
    signals.on('ticker-started',function (id) { requestId = id; controls(); });
    signals.on('ticker-error',function (message) { requestId = null; pendingValue = null; feedback(message,true); controls(); });
    signals.on('command-result',function (response) {
      if (response.action !== 'mw:setTicker' || response.requestId !== requestId) { return; }
      if (response.ok && pendingValue === key(value())) { dirty = false; }
      requestId = null; pendingValue = null; feedback(response.message,!response.ok);
      controls(); signals.emit('overlay-dirty');
    });
    signals.on('snapshot',render); signals.on('controls',controls);
    signals.on('studio-fit',measure);
    signals.on('studio-selection',function () { requestAnimationFrame(measure); });
    signals.on('overlay-capture',function (state) { if (allowed() && dirty) { state.tickerDraft = {value:value(),revision:base}; } });
    signals.on('overlay-restore',function (state) {
      var draft = state.tickerDraft;
      if (!allowed() || !draft || !draft.value || typeof draft.value.text !== 'string' || draft.value.text.length > 300 ||
          [32,48,72].indexOf(draft.value.speed) === -1 || ['left','right'].indexOf(draft.value.direction) === -1 ||
          typeof draft.value.enabled !== 'boolean' || !Number.isInteger(draft.revision) || draft.revision < 0) { return; }
      fill(draft.value); base = draft.revision; dirty = true; feedback('Ungespeicherte Änderungen',false); render();
    });
  }
  return {start:start};
});

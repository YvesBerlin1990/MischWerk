/* Wunsch-Overlay darstellen; der unveränderte Versandcontroller lebt weiterhin in der Radioleiste. */
MischWerkUI.define('wishDrawer', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var surface = !!(bridge && bridge.pageData && bridge.pageData.wishSurface);
  var surfaceId = surface ? bridge.pageData.wishSurfaceId : null;
  var sequence = 0, acknowledged = 0, mirrored = null, opened = false, receiving = false, closing = false;
  var closeTimer;
  var focusPending = true;
  function focusInput() {
    requestAnimationFrame(function () {
      if (!focusPending || closing || dom.el('wish-fields').disabled ||
          !document.documentElement.classList.contains('mw-ready')) { return; }
      if (document.activeElement !== document.body && document.activeElement !== document.documentElement) {
        focusPending = false; return;
      }
      dom.el('wish-text').focus({ preventScroll:true }); focusPending = false;
    });
  }
  function restoreFocus() {
    var target = !dom.el('open-wishes').disabled ? dom.el('open-wishes') :
      !dom.el('open-schedule').disabled ? dom.el('open-schedule') : dom.el('mute-button');
    var curtain = model.current() && model.current().curtain;
    if (curtain && curtain.closed && !curtain.exempt) { target = dom.el('curtain-ad'); }
    target.focus({ preventScroll:true });
    if (target.id === 'mute-button') { target.scrollIntoView({ block:'nearest', inline:'nearest' }); }
  }
  function mirror(force) {
    if (!opened && force !== true) { return; }
    var feedback = dom.el('wish-feedback');
    var data = { text:dom.el('wish-text').value, sequence:sequence, surfaceId:surfaceId,
      disabled:dom.el('wish-fields').disabled, feedback:feedback.textContent, feedbackHidden:feedback.hidden,
      error:feedback.classList.contains('error'), pending:feedback.classList.contains('pending'),
      hint:dom.el('wish-hint').hidden ? '' : dom.el('wish-hint').textContent };
    var key = JSON.stringify(data);
    if (key === mirrored && force !== true) { return; }
    mirrored = key;
    commands.send('mw:wishes.sync', data, false);
  }
  function radioStart() {
    dom.el('open-wishes').setAttribute('aria-haspopup', 'dialog');
    dom.el('open-wishes').setAttribute('aria-expanded', 'false');
    dom.el('open-wishes').addEventListener('click', function () {
      if (!this.disabled) { commands.send('mw:openWishes', {}, true); }
    });
    bridge.addEventListener('mw:wishes.open', function (event) {
      surfaceId = event.data.surfaceId; sequence = 0; opened = true;
      dom.el('open-wishes').setAttribute('aria-expanded', 'true'); mirror(true);
    });
    bridge.addEventListener('mw:wishes.closed', function (event) {
      if (event.data.surfaceId !== surfaceId) { return; }
      opened = false; dom.el('open-wishes').setAttribute('aria-expanded', 'false'); restoreFocus();
    });
    bridge.addEventListener('mw:wishes.input', function (event) {
      var data = event.data;
      if (!data || data.surfaceId !== surfaceId || data.sequence <= sequence || typeof data.text !== 'string') { return; }
      sequence = data.sequence;
      // Auch bei inzwischen gesperrtem Versand bleibt die eigene letzte Eingabe erhalten.
      dom.el('wish-text').value = data.text;
      dom.el('wish-text').dispatchEvent(new Event('input', { bubbles:true }));
      if (data.submit && !dom.el('wish-fields').disabled && model.connected()) {
        dom.el('wish-form').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      }
      mirror(true);
    });
    new MutationObserver(function () { mirror(); }).observe(dom.el('wishes-panel'), {
      subtree:true, childList:true, attributes:true, attributeFilter:['disabled','hidden','class']
    });
    dom.el('wish-text').addEventListener('input', function () { mirror(); });
    signals.on('snapshot', function () {
      var curtain = model.current() && model.current().curtain;
      if (opened && curtain && curtain.closed && !curtain.exempt) { commands.send('mw:wishes.close', {}, false); }
    });
  }
  function fitText() {
    var field = dom.el('wish-text');
    field.style.height = 'auto'; field.style.height = Math.max(80, field.scrollHeight + 2) + 'px';
    dom.setText('wish-text-count', field.value.length + ' / 300');
  }
  function apply(data) {
    if (!data || data.sequence < sequence) { return; }
    acknowledged = data.sequence;
    receiving = true;
    if (dom.el('wish-text').value !== data.text) { dom.el('wish-text').value = data.text; fitText(); }
    var live = model.connected() && model.current() && model.current().requestsEnabled;
    dom.el('wish-fields').disabled = data.disabled || !live;
    var feedback = dom.el('wish-feedback');
    feedback.className = 'wish-feedback' + (data.error ? ' error' : data.pending ? ' pending' : ' success');
    feedback.setAttribute('role', data.error ? 'alert' : 'status');
    feedback.setAttribute('aria-live', data.error ? 'assertive' : 'polite');
    feedback.textContent = data.feedback; feedback.hidden = data.feedbackHidden;
    dom.setText('wish-hint', data.hint); dom.el('wish-hint').hidden = !data.hint;
    receiving = false;
    focusInput();
    if (closing && acknowledged >= sequence) { clearTimeout(closeTimer); bridge.close(); }
  }
  function close() {
    if (acknowledged >= sequence) { bridge.close(); }
    else {
      closing = true;
      dom.setText('wish-hint', 'Deine Eingabe wird noch übernommen …'); dom.el('wish-hint').hidden = false;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        dom.setText('wish-hint', 'Die Verbindung antwortet noch nicht. Deine Eingabe bleibt hier erhalten.');
        dom.el('wish-hint').hidden = false;
      }, 6000);
    }
  }
  function edit(submit) {
    if (receiving || dom.el('wish-fields').disabled) { return; }
    sequence += 1;
    commands.send(submit ? 'mw:wishes.submit' : 'mw:wishes.edit', { text:dom.el('wish-text').value, sequence:sequence }, false);
    if (submit) { dom.el('wish-fields').disabled = true; }
  }
  function surfaceStart() {
    var panel = dom.el('wishes-panel');
    panel.classList.add('wish-drawer'); panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'inline-wish-title');
    dom.el('wish-drawer-heading').hidden = false;
    dom.el('wish-text').rows = 2;
    dom.el('wish-text').addEventListener('input', function () { fitText(); edit(false); });
    dom.el('wish-form').addEventListener('submit', function (event) {
      event.preventDefault(); if (this.reportValidity()) { edit(true); }
    });
    dom.el('close-wishes').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    });
    bridge.addEventListener('mw:wishes.presentation', function (event) {
      if (event.data.surfaceId === surfaceId) { apply(event.data.state); }
    });
    signals.on('snapshot', function () { apply(model.current() && model.current().wishPresentation); });
    signals.on('initial-layout', function () { fitText(); focusInput(); });
    window.addEventListener('pagehide', function () { clearTimeout(closeTimer); });
    signals.on('controls', function () {
      if (!model.connected() || !model.current().requestsEnabled) { dom.el('wish-fields').disabled = true; }
    });
    fitText();
    focusInput();
  }
  function start() {
    if (!bridge) { return; }
    if (model.view === 'radio') { radioStart(); }
    else if (surface) { surfaceStart(); }
  }
  return { start:start };
});

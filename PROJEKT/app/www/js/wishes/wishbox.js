/* Wunschformular, Linkprüfung, Entwurf und unmittelbare Versandbestätigung. */
MischWerkUI.define('wishes', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var lastWish = null;
  var wishPending = null;
  var wishTimer;
  function refreshControls() { signals.emit('controls'); }
  function fitWishText() {
    var field = dom.el('wish-text');
    // Auch der Server speichert Wünsche als einen Absatz; Zeilenumbrüche vergrößern kein Fenster unnötig.
    if (/[\r\n]/.test(field.value)) {
      var caret = field.selectionStart;
      field.value = field.value.replace(/[\r\n]/g, ' ');
      field.setSelectionRange(caret, caret);
    }
    field.style.height = 'auto';
    field.style.height = Math.max(80, field.scrollHeight + 2) + 'px';
    dom.setText('wish-text-count', field.value.length + ' / ' + field.maxLength);
    layout.resizeDialog();
  }
  
  function sameWish(a, b) { return a.text === b.text; }
  
  function submitWish(data) {
    if (!bridge || !model.connected()) { showWishFeedback('Die Verbindung zum Channel fehlt. Bitte öffne MischWerk erneut.', true); return; }
    if (wishPending) { return; }
    var submissionId = commands.nextId('wish');
    if (lastWish && sameWish(data, lastWish.data)) { submissionId = lastWish.submissionId; }
    lastWish = { submissionId: submissionId, data: { text: data.text } };
    wishPending = { submissionId: submissionId };
    showWishFeedback('Wird gesendet …', false, true);
    refreshControls();
    clearTimeout(wishTimer);
    wishTimer = setTimeout(function () {
      if (!wishPending || wishPending.submissionId !== submissionId) { return; }
      wishPending = null;
      refreshControls();
      showWishFeedback('Noch keine Bestätigung. Bitte erneut prüfen.', true);
      commands.send('mw:refresh', {}, false);
    }, 15000);
    try { bridge.sendEvent('mw:wish.submit', { submissionId: submissionId, text: data.text }); }
    catch (error) {
      wishPending = null;
      clearTimeout(wishTimer);
      refreshControls();
      showWishFeedback('Senden nicht bestätigt. Bitte erneut prüfen.', true);
    }
  }
  
  function containsWishLink(value) {
    var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
    try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
    candidate = candidate.toLowerCase();
    if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/.test(candidate)) { return true; }
    return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/.test(candidate) ||
      /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/.test(candidate);
  }
  
  function wishValues() { return { text: dom.el('wish-text').value.trim() }; }
  
  function showWishFeedback(message, error, pendingFeedback) {
    var box = dom.el('wish-feedback');
    box.className = 'wish-feedback' + (error ? ' error' : pendingFeedback ? ' pending' : ' success');
    box.setAttribute('role', error ? 'alert' : 'status');
    box.setAttribute('aria-live', error ? 'assertive' : 'polite');
    box.textContent = message; box.hidden = false;
    layout.resizeDialog();
    if (bridge && bridge.isK3Client()) {
      requestAnimationFrame(function () {
        if (!box.hidden) { box.scrollIntoView({ block: 'nearest' }); }
      });
    }
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    var limits = model.current().limits || { maxTextLength: 300 };
    var enabled = live && model.current().requestsEnabled;
    dom.el('wish-text').maxLength = limits.maxTextLength || 300;
    dom.el('wish-fields').disabled = !enabled || !!commands.pending() || !!wishPending;
    dom.setText('wish-status', enabled ? '' : !model.current().requestsEnabled ? 'WUNSCHBOX DEAKTIVIERT' : 'VERBINDUNG FEHLT');
    dom.el('wish-status').hidden = model.view !== 'wishes' || enabled;
    dom.el('wish-status').classList.toggle('green-pill', enabled);
    var hint = '';
    if (!live) { hint = 'Verbindung zum Channel unterbrochen. Bitte öffne MischWerk erneut.'; }
    else if (!enabled) { hint = 'Wunschbox deaktiviert.'; }
    dom.setText('wish-hint', hint);
    dom.el('wish-hint').hidden = !hint;
  
  }
  function receipt(event) {
      var receipt = event.data || {};
      if (!lastWish || receipt.submissionId !== lastWish.submissionId) { return; }
      if (wishPending && wishPending.submissionId === receipt.submissionId) { wishPending = null; }
      clearTimeout(wishTimer);
      if (receipt.accepted) {
        if (sameWish(wishValues(), lastWish.data)) { dom.el('wish-form').reset(); fitWishText(); }
        lastWish = null;
      }
      showWishFeedback(receipt.message, !receipt.accepted);
      refreshControls();
  }
  
  function start() {
  
    dom.el('wish-text').addEventListener('input', fitWishText);
    dom.el('wish-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (dom.el('wish-fields').disabled || !this.reportValidity()) { return; }
      var values = wishValues();
      if (containsWishLink(values.text)) { showWishFeedback('Nur Interpret + Titel. Keine Links.', true); return; }
      submitWish(values);
    });
  
  }
  return { start: start, receipt: receipt, availability: availability, fitText: fitWishText };
});

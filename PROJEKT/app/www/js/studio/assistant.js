/* Bestätigte Sendungszeiten anzeigen und Hinweise geben; kein Encoder- oder Anbieterzugriff. */
MischWerkUI.define('assistant', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var serverAnchor = 0, localAnchor = 0;
  var lastNotes = null;
  function duration(milliseconds) {
    var seconds = Math.max(0, Math.floor(milliseconds / 1000));
    function pad(value) { return String(value).padStart(2, '0'); }
    return Math.floor(seconds / 3600) + ':' + pad(Math.floor(seconds / 60) % 60) + ':' + pad(seconds % 60);
  }
  function slotText(slot) {
    return slot.date.slice(8) + '.' + slot.date.slice(5, 7) + '. · ' + slot.start + '–' + slot.end +
      (slot.end < slot.start ? ' (Folgetag)' : '') + ' Uhr · ' + slot.nick;
  }
  function render() {
    var state = model.current(), assistant = state && state.assistant;
    var block = dom.el('assistant-block');
    block.hidden = !state || !state.user.canModerate || !assistant;
    if (block.hidden) { return; }
    var live = model.connected(), now = serverAnchor + Date.now() - localAnchor;
    var slot = assistant.current, running = slot && now >= slot.startAt;
    var elapsed = assistant.startedAt === null ? null : now - assistant.startedAt;
    var remaining = slot ? Math.max(0, Math.ceil((slot.endAt - now) / 60000)) : null;
    dom.setText('assistant-summary', !live ? 'Verbindung fehlt' : elapsed !== null ? 'Laufzeit ' + duration(elapsed) :
      slot ? 'Geplant ab ' + slot.start + ' Uhr' : 'Deine Sendung im Blick');
    dom.setText('assistant-elapsed', live && elapsed !== null ? duration(elapsed) : '—');
    dom.setText('assistant-plan-label', running ? 'Geplantes Ende' : 'Geplante Sendung');
    dom.setText('assistant-plan', !live ? 'Momentan nicht bestätigt' : assistant.unavailable ? 'Sendeplan momentan nicht verfügbar' :
      slot ? slotText(slot) + (running ? remaining ? ' · Noch ' + remaining + ' Min.' : ' · Sendezeit beendet' : '') : 'Für diese oder nächste Woche nicht eingeplant');
    dom.setText('assistant-next', !live ? 'Momentan nicht bestätigt' : assistant.unavailable ? 'Sendeplan momentan nicht verfügbar' :
      assistant.next ? slotText(assistant.next) : 'Keine weitere Sendung in dieser oder der nächsten Woche');
    var topic = slot && slot.topic || '';
    dom.el('assistant-topic-copy').hidden = !topic;
    dom.setText('assistant-topic-copy', topic ? 'Geplantes Thema: ' + topic : '');
    var button = dom.el('assistant-topic'), input = dom.el('studio-topic');
    var customDraft = input.value !== (state.topic || '') && input.value !== topic;
    button.hidden = !topic;
    button.disabled = !live || input.disabled || customDraft || (!!state.moderator && !state.user.isOnAir);
    button.title = customDraft ? 'Deinen aktuellen Themenentwurf zuerst speichern oder verwerfen' : 'In das Themenfeld übernehmen und anschließend selbst speichern';
    var notes = state.handover && state.handover.receivedNotes;
    if (notes && notes !== lastNotes) { dom.el('studio-assistant').open = true; }
    lastNotes = notes;
    dom.el('assistant-notes').hidden = !notes;
    dom.setText('assistant-notes-text', notes || '');
    var reminder = live && state.user.isOnAir && running && slot.endAt - now <= 600000 ?
      now >= slot.endAt ? 'Deine geplante Sendezeit ist beendet. Bitte die Übergabe abstimmen.' :
      slot.endAt - now <= 300000 ? 'Deine Sendung endet in wenigen Minuten. Bitte die Übergabe abstimmen.' :
      'Das Sendungsende nähert sich. Bereite die Übergabe vor.' : '';
    dom.el('assistant-reminder').hidden = !reminder;
    dom.setText('assistant-reminder', reminder);
  }
  function start() {
    signals.on('snapshot', function () {
      serverAnchor = model.current().serverTime; localAnchor = Date.now(); render();
    });
    signals.on('controls', render);
    dom.el('assistant-topic').addEventListener('click', function () {
      if (!this.disabled && model.current().assistant && model.current().assistant.current) {
        signals.emit('topic-draft', model.current().assistant.current.topic);
      }
    });
  }
  return { start: start };
});

/* Studio-Übergabe bedienen; bestätigte Anfrage und lokalen Themenentwurf getrennt halten. */
MischWerkUI.define('handover', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var reader=dependencies.reader;
  var opened = false;
  var incomingId = null;
  var incomingModerator = null;
  var candidateKey = null;
  function details() { return model.current().handover || { candidates: [], outgoing: null, incoming: null }; }
  function close() {
    if (!opened) { return; }
    var restoreFocus = dom.el('handover-panel').contains(document.activeElement);
    opened = false;
    dom.el('studio-panel').classList.remove('show-handover');
    dom.el('handover-panel').hidden = true;
    layout.resizeDialog();
    signals.emit('queue-visible');
    var entry = dom.el('handover-open');
    if (restoreFocus && !entry.disabled && entry.getClientRects().length) {
      entry.focus({ preventScroll: true });
    }
  }
  function render() {
    if (!model.current()) { return; }
    var state = model.current(), handover = details();
    var incoming = handover.incoming, outgoing = handover.outgoing;
    var completed=incomingId===handover.acceptedId&&incomingId&&!incoming&&state.user.isOnAir&&state.moderator&&state.moderator.sessionKey!==incomingModerator;
    var available = state.user.canModerate && (state.user.isOnAir || incoming);
    var disabled = !model.connected() || commands.pending() || !state.user.canModerate;
    var received=state.user.canModerate&&state.handover&&state.handover.receivedNotes;
    var card=dom.el('studio-handover-card');
    card.toggleAttribute('data-unavailable',!received);
    if(!received)card.hidden=true;
    dom.el('studio-received-notes').hidden=!received;
    reader.set('received',dom.el('studio-notes-text'),received||'',state.moderator&&state.moderator.sessionKey);
    dom.el('handover-open').hidden = !available;
    dom.el('handover-open').disabled = disabled;
    dom.setText('handover-open-label', incoming ? 'Übergabe ansehen' : outgoing ? 'Übergabe läuft …' : 'Sendung übergeben');
    if (incomingId !== (incoming && incoming.id)) {
      incomingId = incoming && incoming.id;
      incomingModerator = incoming && state.moderator && state.moderator.sessionKey;
      dom.el('handover-topic').value = '';
    }
    if(completed){signals.emit('studio-topic-reset');close();}
    if (!available) { close(); layout.resizeDialog(); return; }
    if (!opened) { layout.resizeDialog(); return; }
    dom.el('handover-panel').hidden = false;
    dom.setText('handover-title', incoming ? 'Sendung übernehmen' : 'Sendung übergeben');
    dom.setText('handover-description', incoming ? incoming.nick + ' möchte dir die Sendung übergeben. Bestätige, sobald du sendebereit bist.' :
      outgoing ? 'Warte auf ' + outgoing.nick + '. Bis zur Annahme bleibst du ON AIR.' :
      handover.candidates.length ? 'Wähle den nächsten Moderator. Du bleibst bis zur Annahme ON AIR.' : 'Aktuell ist kein weiterer Radiomoderator im Channel.');
    dom.el('handover-request-form').hidden = !!incoming || !!outgoing || !handover.candidates.length;
    dom.el('handover-accept-form').hidden = !incoming;
    dom.el('handover-cancel').hidden = !outgoing;
    var notes = incoming ? incoming.notes : outgoing ? outgoing.notes : '';
    dom.el('handover-note-preview').hidden = !notes;
    reader.set('handover',dom.el('handover-note-text'),notes||'',incoming?incoming.id:outgoing?outgoing.id:'');
    var key = JSON.stringify(handover.candidates);
    if (key !== candidateKey) {
      candidateKey = key;
      var select = dom.el('handover-target'), value = select.value;
      select.textContent = '';
      handover.candidates.forEach(function (nick) {
        var option = dom.element('option', '', nick); option.value = nick; select.appendChild(option);
      });
      if (handover.candidates.indexOf(value) !== -1) { select.value = value; }
    }
    ['handover-target', 'handover-topic', 'handover-notes', 'handover-request', 'handover-accept', 'handover-decline', 'handover-cancel'].forEach(function (id) {
      dom.el(id).disabled = disabled;
    });
    layout.resizeDialog();
  }
  function start() {
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'studio') { return; }
      state.handover = { open:opened, target:dom.el('handover-target').value,
        notes:dom.el('handover-notes').value, topic:dom.el('handover-topic').value,
        incoming:incomingId, moderator:model.current() && model.current().moderator && model.current().moderator.sessionKey };
    });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'studio') { return; }
      var draft = state.handover;
      if (!draft || !model.current().user.canModerate) { return; }
      var moderator = model.current().moderator;
      if (moderator && moderator.sessionKey === draft.moderator) {
        if (typeof draft.notes === 'string' && draft.notes.length <= 500) { dom.el('handover-notes').value = draft.notes; }
        if (Array.from(dom.el('handover-target').options).some(function (option) { return option.value === draft.target; })) { dom.el('handover-target').value = draft.target; }
      }
      if (draft.incoming === incomingId && typeof draft.topic === 'string' && draft.topic.length <= 80) { dom.el('handover-topic').value = draft.topic; }
      if (draft.open && !dom.el('handover-open').hidden && !dom.el('handover-open').disabled) { dom.el('handover-open').click(); }
      dom.setText('handover-notes-count', dom.el('handover-notes').value.length + ' / 500');
    });
    dom.el('handover-notes').addEventListener('input', function () {
      dom.setText('handover-notes-count', this.value.length + ' / 500');
    });
    dom.el('handover-open').addEventListener('click', function () {
      opened = true; dom.el('studio-panel').classList.add('show-handover'); render();
      var focus = details().incoming ? dom.el('handover-topic') : dom.el('handover-back');
      try { focus.focus({ preventScroll: true }); } catch (ignored) { focus.focus(); }
    });
    ['handover-back', 'studio-programme-tab', 'studio-queue-tab', 'studio-history-tab'].forEach(function (id) {
      dom.el(id).addEventListener('click', close);
    });
    dom.el('handover-request-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!this.reportValidity() || dom.el('handover-request').disabled) { return; }
      commands.send('mw:handover.request', { nick: dom.el('handover-target').value, notes: dom.el('handover-notes').value,
        expectedModerator: model.current().moderator && model.current().moderator.sessionKey }, true);
    });
    dom.el('handover-accept-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!this.reportValidity() || dom.el('handover-accept').disabled || !details().incoming) { return; }
      var previous=model.current().moderator&&model.current().moderator.sessionKey, revision=details().revision;
      var id=details().incoming.id, topic=dom.el('handover-topic').value;
      commands.send('mw:handover.accept', { id: id, topic: topic }, true, function(state){
        return state.user.canModerate&&state.user.isOnAir&&state.moderator&&state.moderator.sessionKey!==previous&&
          state.handover&&state.handover.revision>revision&&!state.handover.incoming&&state.handover.acceptedId===id;
      });
    });
    dom.el('handover-decline').addEventListener('click', function () {
      if (details().incoming) { commands.send('mw:handover.decline', { id: details().incoming.id }, true); }
    });
    dom.el('handover-cancel').addEventListener('click', function () {
      if (details().outgoing) { commands.send('mw:handover.cancel', { id: details().outgoing.id }, true); }
    });
    signals.on('studio-selection',function(data){if(data.tab!=='programme')close();});
    signals.on('snapshot', render);
    signals.on('controls', render);
    signals.on('command-result', function (response) {
      if (!response.ok || response.action.indexOf('mw:handover.') !== 0) { return; }
      if (response.action === 'mw:handover.accept') { signals.emit('studio-topic-reset'); commands.send('mw:refresh',{},false); }
      if (response.action === 'mw:handover.request') {
        dom.el('handover-notes').value = ''; dom.setText('handover-notes-count', '0 / 500');
      }
      if (response.action !== 'mw:handover.request') { close(); }
    });
  }
  return { start: start };
});

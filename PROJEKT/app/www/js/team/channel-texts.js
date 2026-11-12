/* Bot-Texte bearbeiten, bestätigte Einstellungen und private ungespeicherte Eingaben trennen. */
MischWerkUI.define('channelTexts', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var commands = dependencies.commands, signals = dependencies.signals;
  var saved = null, revision = null, dirty = false, sequence = 0, textIndex = 0;
  function allowed() { return model.current() && model.current().user.canManageRadioModerators; }
  function values() {
    return { enabled:dom.el('channel-texts-enabled').checked, interval:Number(dom.el('channel-texts-interval').value),
      texts:Array.from(dom.el('channel-texts-fields').querySelectorAll('textarea')).map(function (field) { return field.value; }) };
  }
  function availability() {
    var blocked = !allowed() || !model.connected() || commands.pending() || revision === null;
    dom.el('channel-texts-form').querySelectorAll('input,select,textarea,button').forEach(function (field) { field.disabled = blocked; });
    dom.el('channel-texts-refresh').disabled = !allowed() || commands.pending();
    var count = values().texts.length;
    dom.el('channel-texts-add').disabled = blocked || count >= 6;
    dom.el('channel-texts-fields').querySelectorAll('button').forEach(function (button) { button.disabled = blocked || count <= 1; });
    dom.el('channel-texts-save').disabled = blocked || !dirty || !!(saved && saved.revision !== revision);
    dom.el('channel-texts-reload').hidden = !saved || saved.revision === revision;
  }
  function changed() { dirty = true; availability(); }
  function showText() {
    dom.el('channel-texts-current').value = String(textIndex);
    dom.el('channel-texts-fields').querySelectorAll('.channel-texts-entry').forEach(function (row, index) { row.hidden = index !== textIndex; });
    signals.emit('channel-texts-selected');
  }
  function fields(texts) {
    signals.emit('channel-texts-before-fields');
    var container = dom.el('channel-texts-fields'); container.textContent = '';
    var picker = dom.el('channel-texts-current'); picker.textContent = '';
    textIndex = Math.max(0, Math.min(textIndex, texts.length - 1));
    texts.forEach(function (text, index) {
      var option = dom.element('option', '', 'Text ' + (index + 1) + ' von ' + texts.length);
      option.value = String(index); picker.appendChild(option);
      var row = dom.element('div', 'channel-texts-entry'), heading = dom.element('div', 'channel-texts-entry-heading');
      row.hidden = index !== textIndex;
      var label = dom.element('label', '', 'Nachricht'), field = dom.element('textarea');
      field.id = 'channel-text-entry-' + (++sequence); field.maxLength = 300; field.rows = 2; field.value = text;
      field.placeholder = 'Deine Nachricht …'; label.htmlFor = field.id;
      var counter = dom.element('span', 'channel-texts-counter', text.length + ' / 300');
      counter.id = field.id + '-count'; field.setAttribute('aria-describedby', counter.id);
      var remove = dom.element('button', 'channel-texts-remove', 'Entfernen'); remove.type = 'button';
      remove.setAttribute('aria-label', 'Text ' + (index + 1) + ' entfernen');
      remove.addEventListener('click', function () {
        var current = values().texts; current.splice(index, 1); fields(current); changed();
        container.querySelectorAll('textarea')[textIndex].focus();
      });
      field.addEventListener('input', function () { counter.textContent = field.value.length + ' / 300'; changed(); });
      heading.appendChild(label); heading.appendChild(counter); heading.appendChild(remove);
      row.appendChild(heading); row.appendChild(field); container.appendChild(row);
    });
    picker.value = String(textIndex);
    signals.emit('channel-texts-fields');
  }
  function fill(data) {
    dom.el('channel-texts-enabled').checked = data.enabled;
    dom.el('channel-texts-interval').value = String(data.interval); fields(data.texts);
  }
  function receive(data) {
    if (!allowed() || !data || !Array.isArray(data.texts) || !Number.isInteger(data.revision)) { return; }
    if (saved && data.revision < saved.revision) { return; }
    saved = data;
    if (!dirty && revision !== data.revision) { fill(data); revision = data.revision; }
    if (dirty && revision === null) { revision = data.revision; }
    dom.setText('channel-texts-status', data.enabled ? 'Ein · alle ' + data.interval + ' Minuten' : 'Automatisches Senden ist aus.');
    if (dirty && revision !== data.revision) {
      dom.setText('channel-texts-feedback', 'Es gibt neuere Texte. Lade sie zuerst. Dein Entwurf bleibt bis dahin erhalten.');
    }
    availability();
  }
  function start() {
    fields(['', '']); availability();
    if (bridge) { bridge.addEventListener('mw:channelTexts.state', function (event) { receive(event.data); }); }
    dom.el('channel-texts-enabled').addEventListener('change', changed);
    dom.el('channel-texts-interval').addEventListener('change', changed);
    dom.el('channel-texts-current').addEventListener('change', function () { textIndex = Number(this.value); showText(); });
    dom.el('channel-texts-add').addEventListener('click', function () {
      var current = values().texts; if (current.length >= 6) { return; } textIndex = current.length; current.push(''); fields(current); changed();
      dom.el('channel-texts-fields').lastElementChild.querySelector('textarea').focus();
    });
    commands.bindRefresh('channel-texts-refresh', 'channel-texts-feedback');
    dom.el('channel-texts-reload').addEventListener('click', function () {
      if (!saved) { return; } fill(saved); revision = saved.revision; dirty = false;
      dom.setText('channel-texts-feedback', 'Gespeicherte Texte geladen.'); availability();
    });
    dom.el('channel-texts-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (dom.el('channel-texts-save').disabled || !this.reportValidity()) { return; }
      var data = values(); data.expectedRevision = revision;
      commands.send('mw:channelTexts.save', data, true);
    });
    signals.on('command-result', function (response) {
      if (response.action !== 'mw:channelTexts.save') { return; }
      if (response.ok) { dirty = false; }
      dom.setText('channel-texts-feedback', response.message || 'Speichern wurde nicht bestätigt.'); availability();
    });
    signals.on('controls', availability);
    signals.on('snapshot', function () {
      if (!allowed()) { saved = null; revision = null; dirty = false; fill({ enabled:false, interval:20, texts:['', ''] });
        dom.setText('channel-texts-status', ''); dom.setText('channel-texts-feedback', ''); }
      availability();
    });
    signals.on('overlay-capture', function (state) {
      if (!allowed()) { return; }
      state.channelTexts = { textIndex:textIndex, dirty:dirty, revision:revision, form:values() };
    });
    signals.on('overlay-restore', function (state) {
      var draft = state.channelTexts;
      if (!allowed() || !draft) { return; }
      textIndex = Number.isInteger(draft.textIndex) && draft.textIndex >= 0 && draft.textIndex < 6 ? draft.textIndex : 0;
      if (draft.dirty && draft.form && Array.isArray(draft.form.texts) && draft.form.texts.length > 0 && draft.form.texts.length <= 6 &&
          draft.form.texts.every(function (text) { return typeof text === 'string' && text.length <= 300; })) {
        fill(draft.form); revision = draft.revision; dirty = true;
      }
      if (revision !== null) { textIndex = Math.min(textIndex, values().texts.length - 1); showText(); }
      availability();
    });
  }
  return { start:start };
});

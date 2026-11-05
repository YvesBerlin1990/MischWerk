/* Bot-Texte bearbeiten, bestätigte Einstellungen und private ungespeicherte Eingaben trennen. */
MischWerkUI.define('channelTexts', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var commands = dependencies.commands, signals = dependencies.signals;
  var saved = null, revision = null, dirty = false, selected = 'members', sequence = 0;
  var tabIds = { members:'team-members-tab', texts:'team-texts-tab' };
  function allowed() { return model.current() && model.current().user.canManageRadioModerators; }
  function values() {
    return { enabled:dom.el('channel-texts-enabled').checked, interval:Number(dom.el('channel-texts-interval').value),
      texts:Array.from(dom.el('channel-texts-fields').querySelectorAll('textarea')).map(function (field) { return field.value; }) };
  }
  function select(name, focus) {
    selected = name === 'texts' ? 'texts' : 'members';
    ['members', 'texts'].forEach(function (item) {
      var button = dom.el(tabIds[item]), active = selected === item;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
    });
    dom.el('team-members').hidden = selected !== 'members';
    dom.el('channel-texts-panel').hidden = selected !== 'texts';
    signals.emit('channel-texts-panel', selected === 'texts');
    if (focus) { dom.el(tabIds[selected]).focus(); }
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
  function fields(texts) {
    signals.emit('channel-texts-before-fields');
    var container = dom.el('channel-texts-fields'); container.textContent = '';
    texts.forEach(function (text, index) {
      var row = dom.element('div', 'channel-texts-entry'), heading = dom.element('div', 'channel-texts-entry-heading');
      var label = dom.element('label', '', 'Text ' + (index + 1)), field = dom.element('textarea');
      field.id = 'channel-text-entry-' + (++sequence); field.maxLength = 300; field.rows = 2; field.value = text;
      field.placeholder = 'Deine Nachricht für den Channel …'; label.htmlFor = field.id;
      var counter = dom.element('span', 'channel-texts-counter', text.length + ' / 300');
      counter.id = field.id + '-count'; field.setAttribute('aria-describedby', counter.id);
      var remove = dom.element('button', 'channel-texts-remove', 'Entfernen'); remove.type = 'button';
      remove.setAttribute('aria-label', 'Text ' + (index + 1) + ' entfernen');
      remove.addEventListener('click', function () {
        var current = values().texts; current.splice(index, 1); fields(current); changed();
        var remaining = container.querySelectorAll('textarea'); remaining[Math.min(index, remaining.length - 1)].focus();
      });
      field.addEventListener('input', function () { counter.textContent = field.value.length + ' / 300'; changed(); });
      heading.appendChild(label); heading.appendChild(counter); heading.appendChild(remove);
      row.appendChild(heading); row.appendChild(field); container.appendChild(row);
    });
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
    dom.setText('channel-texts-status', data.enabled ? 'Aktiv · alle ' + data.interval + ' Minuten' : 'Automatische Ausgabe ist ausgeschaltet.');
    if (dirty && revision !== data.revision) {
      dom.setText('channel-texts-feedback', 'Inzwischen geändert. Deine Eingabe bleibt hier erhalten. Lade die gespeicherten Texte, bevor du erneut bearbeitest.');
    }
    availability();
  }
  function start() {
    fields(['', '']); availability();
    if (bridge) { bridge.addEventListener('mw:channelTexts.state', function (event) { receive(event.data); }); }
    ['members', 'texts'].forEach(function (name) {
      var button = dom.el(tabIds[name]);
      button.addEventListener('click', function () { select(name); });
      button.addEventListener('keydown', function (event) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) { return; }
        event.preventDefault(); select(event.key === 'Home' ? 'members' : event.key === 'End' ? 'texts' : selected === 'members' ? 'texts' : 'members', true);
      });
    });
    dom.el('channel-texts-enabled').addEventListener('change', changed);
    dom.el('channel-texts-interval').addEventListener('change', changed);
    dom.el('channel-texts-add').addEventListener('click', function () {
      var current = values().texts; if (current.length >= 6) { return; } current.push(''); fields(current); changed();
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
        dom.setText('channel-texts-status', ''); dom.setText('channel-texts-feedback', ''); select('members'); }
      availability();
    });
    signals.on('overlay-capture', function (state) {
      if (!allowed()) { return; }
      state.channelTexts = { selected:selected, dirty:dirty, revision:revision, form:values() };
    });
    signals.on('overlay-restore', function (state) {
      var draft = state.channelTexts;
      if (!allowed() || !draft) { return; }
      select(draft.selected);
      if (draft.dirty && draft.form && Array.isArray(draft.form.texts) && draft.form.texts.length > 0 && draft.form.texts.length <= 6 &&
          draft.form.texts.every(function (text) { return typeof text === 'string' && text.length <= 300; })) {
        fill(draft.form); revision = draft.revision; dirty = true;
      }
      availability();
    });
  }
  return { start:start };
});

/* Eigene Bereichsnavigation innerhalb derselben geladenen HTML-Oberfläche. */
MischWerkUI.define('navigation', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var signals = dependencies.signals, commands = dependencies.commands, layout = dependencies.layout;
  var wishDrawer = dependencies.wishDrawer;
  var initialized = false, requestedRevision = 0;
  var titles = { wishes:'Wunschbox', studio:'Moderation', team:'Radio-Team', schedule:'Sendeplan' };
  function switchView(bereich, revision) {
    if (!model.shared || !Object.prototype.hasOwnProperty.call(titles, bereich)) { return; }
    var state = model.current();
    if (!state || state.view !== bereich || state.viewRevision < revision) {
      if (revision > requestedRevision) { requestedRevision = revision; commands.send('mw:refresh', {}); }
      return;
    }
    if (initialized && model.view === bereich) { return; }
    var previous = model.view, first = !initialized;
    initialized = true; model.setView(bereich);
    document.documentElement.setAttribute('data-view', bereich);
    document.documentElement.toggleAttribute('data-wish-surface', bereich === 'wishes');
    ['wishes','studio','team','schedule'].forEach(function (name) { dom.el(name + '-panel').hidden = name !== bereich; });
    dom.setText('dialog-title', titles[bereich]);
    dom.el('studio-connection').hidden = bereich !== 'studio' && bereich !== 'team';
    dom.el('close-overlay').hidden = bereich === 'wishes';
    try { bridge.getHostFrame().setTitle('MischWerk · ' + titles[bereich]); } catch (ignored) { /* Bereich bleibt bedienbar. */ }
    if (bereich === 'wishes' && wishDrawer) { wishDrawer.fitText(); }
    layout.enterView(first);
    signals.emit('view-changed', { previous:previous, view:bereich, first:first, state:state.overlayState });
  }
  function clearPrivate() {
    var state = model.current();
    if (!state) { return; }
    if (!state.user.canModerate) {
      signals.emit('studio-topic-reset');
      ['studio-topic','handover-topic','handover-notes'].forEach(function (id) { dom.el(id).value = ''; });
      ['handover-note-text','assistant-notes-text'].forEach(function (id) { dom.setText(id, ''); });
    }
    if (!state.user.canManageRadioModerators) {
      dom.el('radio-moderator-nick').value = ''; signals.emit('schedule-access-lost');
    }
  }
  function start() {
    if (!model.shared || !bridge) { return; }
    signals.on('view-select', function (next) { switchView(next.view, next.revision); });
    signals.on('snapshot', clearPrivate);
    bridge.addEventListener('mw:view', function (event) {
      var next = event.data;
      if (next && Number.isInteger(next.revision) && next.revision > 0) { switchView(next.view, next.revision); }
    });
  }
  return { start:start, switchView:switchView };
});

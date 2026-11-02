/* Zusammensetzung der Oberfläche. Die Komponenten führen Ereignisse und Hintergrundarbeit aus. */
(function () {
  'use strict';
  if (window.MischWerkUI) { return; }
  var modules = [
    ['dom', 'core/dom.js'],
    ['signals', 'core/signals.js'],
    ['model', 'core/model.js'],
    ['radioMarkup', 'radio/markup.js', 'radio'],
    ['curtainMarkup', 'radio/curtain-markup.js', 'radio'],
    ['curtain', 'radio/curtain.js', 'radio'],
    ['viewport', 'radio/viewport.js', 'radio'],
    ['wishesMarkup', 'wishes/markup.js', 'wishes'],
    ['studioMarkup', 'studio/markup.js', 'studio'],
    ['handoverMarkup', 'studio/handover-markup.js', 'studio'],
    ['teamMarkup', 'team/markup.js', 'team'],
    ['statusMarkup', 'team/status-markup.js', 'team'],
    ['layout', 'ui/layout.js'],
    ['commands', 'transport/commands.js'],
    ['radioApi', 'radio/api.js', 'radio team'],
    ['presentation', 'radio/presentation.js', 'radio'],
    ['provider', 'radio/provider.js', 'radio'],
    ['listeners', 'radio/listeners.js', 'radio'],
    ['volume', 'radio/volume.js', 'radio'],
    ['player', 'radio/player.js', 'radio'],
    ['wishes', 'wishes/wishbox.js', 'wishes'],
    ['studio', 'studio/controls.js', 'studio'],
    ['handover', 'studio/handover.js', 'studio'],
    ['queue', 'studio/queue.js', 'studio'],
    ['team', 'team/management.js', 'team'],
    ['statusView', 'team/status-view.js', 'team'],
    ['statusCentral', 'team/status.js', 'team'],
    ['scheduleCalendar', 'schedule/calendar.js', 'schedule'],
    ['scheduleMarkup', 'schedule/markup.js', 'schedule'],
    ['scheduleView', 'schedule/view.js', 'schedule'],
    ['scheduleEditor', 'schedule/editor.js', 'schedule'],
    ['schedulePages', 'schedule/pages.js', 'schedule'],
    ['scheduleWindow', 'schedule/window.js', 'schedule'],
    ['schedule', 'schedule/controller.js', 'schedule'],
    ['updates', 'ui/updates.js'],
    ['lifecycle', 'transport/lifecycle.js']
  ];
  var view = document.documentElement.getAttribute('data-view') || 'radio';
  var loadPlan = modules.filter(function (module) { return !module[2] || module[2].split(' ').indexOf(view) !== -1; });
  var factories = {};
  var initialized = false;
  function initialize() {
    if (initialized || document.readyState === 'loading' || !loadPlan.every(function (module) { return !!factories[module[0]]; })) { return; }
    initialized = true;
    compose();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initialize, { once:true }); }
  function compose() {
    var bridge = typeof Client !== 'undefined' ? Client : null;
    var dom = factories.dom({});
    if (factories.radioMarkup) { factories.radioMarkup({ dom: dom }); }
    if (factories.curtainMarkup) { factories.curtainMarkup({ dom: dom }); }
    if (factories.wishesMarkup) { factories.wishesMarkup({ dom: dom }); }
    if (factories.studioMarkup) { factories.studioMarkup({ dom: dom }); }
    if (factories.handoverMarkup) { factories.handoverMarkup({ dom: dom }); }
    if (factories.teamMarkup) { factories.teamMarkup({ dom: dom }); }
    if (factories.statusMarkup) { factories.statusMarkup({ dom: dom }); }
    if (factories.scheduleMarkup) { factories.scheduleMarkup({ dom: dom }); }
    var signals = factories.signals({});
    var model = factories.model({ bridge: bridge, signals: signals });
    var viewport = null;
    if (factories.viewport) { viewport = factories.viewport({ bridge: bridge, model: model, dom: dom, signals: signals }); }
    var layout = factories.layout({ bridge: bridge, model: model, dom: dom, signals: signals, viewport: viewport });
    var commands = factories.commands({ bridge: bridge, model: model, layout: layout, signals: signals });
    var api = null;
    if (factories.radioApi) { api = factories.radioApi({}); }
    var presentation = null;
    if (factories.presentation) { presentation = factories.presentation({ model: model, dom: dom, signals: signals }); }
    var provider = null;
    if (factories.provider) { provider = factories.provider({ model: model, dom: dom, api: api, signals: signals, presentation: presentation }); }
    var listeners = null;
    if (factories.listeners) { listeners = factories.listeners({ model: model, dom: dom, api: api, signals: signals }); }
    var audio = dom.el('radio-audio');
    var volume = null;
    if (factories.volume) { volume = factories.volume({ dom: dom, audio: audio }); }
    var player = null;
    if (factories.player) { player = factories.player({ model: model, dom: dom, api: api, provider: provider,
      layout: layout, signals: signals, audio: audio, volume: volume }); }
    var curtain = null;
    if (factories.curtain) { curtain = factories.curtain({ model:model, dom:dom, commands:commands, signals:signals, player:player, audio:audio }); }
    var wishes = null;
    if (factories.wishes) { wishes = factories.wishes({ bridge: bridge, model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var studio = null;
    if (factories.studio) { studio = factories.studio({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var queue = null;
    if (factories.queue) { queue = factories.queue({ model: model, dom: dom, commands: commands, signals: signals }); }
    var handover = null;
    if (factories.handover) { handover = factories.handover({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var team = null;
    if (factories.team) { team = factories.team({ model: model, dom: dom, commands: commands, signals: signals }); }
    var statusView = null;
    if (factories.statusView) { statusView = factories.statusView({ model: model, dom: dom }); }
    var statusCentral = null;
    if (factories.statusCentral) { statusCentral = factories.statusCentral({ model: model, dom: dom, api: api,
      commands: commands, signals: signals, view: statusView }); }
    var calendar = null;
    if (factories.scheduleCalendar) { calendar = factories.scheduleCalendar({}); }
    var scheduleView = null;
    if (factories.scheduleView) { scheduleView = factories.scheduleView({ dom: dom, calendar: calendar, signals: signals }); }
    var scheduleEditor = null;
    if (factories.scheduleEditor) { scheduleEditor = factories.scheduleEditor({ dom: dom, calendar: calendar, model: model, signals: signals }); }
    var schedulePages = null;
    if (factories.schedulePages) { schedulePages = factories.schedulePages({ dom: dom }); }
    var scheduleWindow = null;
    if (factories.scheduleWindow) { scheduleWindow = factories.scheduleWindow({ bridge: bridge, model: model, dom: dom,
      signals: signals, pages: schedulePages }); }
    var schedule = null;
    if (factories.schedule) { schedule = factories.schedule({ bridge: bridge, model: model, dom: dom, calendar: calendar,
      commands: commands, signals: signals, view: scheduleView, editor: scheduleEditor }); }
    var updates = factories.updates({ model: model, dom: dom, layout: layout, commands: commands,
      wishes: wishes, studio: studio, queue: queue, team: team, schedule: schedule, provider: provider, player: player,
      presentation: presentation, listeners: listeners, signals: signals });
    var lifecycle = factories.lifecycle({ bridge: bridge, model: model, dom: dom, layout: layout,
      commands: commands, wishes: wishes, provider: provider, listeners: listeners, player: player, signals: signals });
    if (viewport) { viewport.start(); }
    layout.start();
    commands.start();
    if (volume) { volume.start(); }
    if (player) { player.start(); }
    if (curtain) { curtain.start(); }
    if (wishes) { wishes.start(); }
    if (studio) { studio.start(); }
    if (handover) { handover.start(); }
    if (queue) { queue.start(); }
    if (team) { team.start(); }
    if (statusCentral) { statusCentral.start(); }
    if (scheduleEditor) { scheduleEditor.start(); }
    if (scheduleWindow) { scheduleWindow.start(); }
    if (schedule) { schedule.start(); }
    updates.start();
    lifecycle.start();
  }
  window.MischWerkUI = {
    define: function (name, factory) {
      if (factories[name]) { throw new Error('Doppeltes Oberflächenmodul: ' + name); }
      factories[name] = factory;
      initialize();
    }
  };
  loadPlan.forEach(function (module) {
    var file = 'js/' + module[1];
    if (typeof Client !== 'undefined') { Client.includeJS(file); }
    else {
      var script = document.createElement('script');
      script.src = file;
      document.body.appendChild(script);
    }
  });
}());

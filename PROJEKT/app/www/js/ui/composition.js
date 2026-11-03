/* Vorhandene Fachkomponenten einmalig und explizit verbinden. */
MischWerkUI.setComposer(function (factories, modules) {

    var bridge = typeof Client !== 'undefined' ? Client : null;
    var dom = factories.dom({});
    if (factories.radioMarkup) { factories.radioMarkup({ dom: dom }); }
    if (factories.curtainMarkup) { factories.curtainMarkup({ dom: dom }); }
    if (factories.wishesMarkup) { factories.wishesMarkup({ dom: dom }); }
    if (factories.studioMarkup) { factories.studioMarkup({ dom: dom }); }
    if (factories.handoverMarkup) { factories.handoverMarkup({ dom: dom }); }
    if (factories.assistantMarkup) { factories.assistantMarkup({ dom: dom }); }
    if (factories.teamMarkup) { factories.teamMarkup({ dom: dom }); }
    if (factories.statusMarkup) { factories.statusMarkup({ dom: dom }); }
    if (factories.scheduleMarkup) { factories.scheduleMarkup({ dom: dom }); }
    var historyView = null;
    if (factories.historyView) { historyView = factories.historyView({ dom: dom }); }
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
    var audio = dom.el('radio-audio');
    var volume = null;
    if (factories.volume) { volume = factories.volume({ dom: dom, audio: audio }); }
    var player = null;
    if (factories.player) { player = factories.player({ model: model, dom: dom, api: api, provider: provider,
      layout: layout, signals: signals, audio: audio, volume: volume }); }
    var curtain = null;
    if (factories.curtain) { curtain = factories.curtain({ model:model, dom:dom, commands:commands, signals:signals, player:player, audio:audio }); }
    var wishes = null;
    if (factories.wishes && !(bridge && bridge.pageData && bridge.pageData.wishSurface)) { wishes = factories.wishes({ bridge: bridge, model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var wishPositions = null;
    if (factories.wishPositions) { wishPositions = factories.wishPositions({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var wishDrawer = null;
    if (factories.wishDrawer) { wishDrawer = factories.wishDrawer({ bridge:bridge, model:model, dom:dom, commands:commands, signals:signals }); }
    var studio = null;
    if (factories.studio) { studio = factories.studio({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var queue = null;
    if (factories.queue) { queue = factories.queue({ model: model, dom: dom, commands: commands, signals: signals }); }
    var handover = null;
    if (factories.handover) { handover = factories.handover({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var assistant = null;
    if (factories.assistant) { assistant = factories.assistant({ model: model, dom: dom, signals: signals }); }
    var team = null;
    if (factories.team) { team = factories.team({ model: model, dom: dom, commands: commands, signals: signals }); }
    var statusView = null;
    if (factories.statusView) { statusView = factories.statusView({ model: model, dom: dom }); }
    var statusCentral = null;
    if (factories.statusCentral) { statusCentral = factories.statusCentral({ model: model, dom: dom, api: api,
      commands: commands, signals: signals, view: statusView }); }
    var calendar = null;
    if (factories.scheduleCalendar) { calendar = factories.scheduleCalendar({}); }
    var historyData = null;
    if (factories.historyData) { historyData = factories.historyData({}); }
    var history = null;
    if (factories.history) { history = factories.history({ bridge:bridge, model:model, dom:dom, signals:signals, data:historyData, view:historyView, commands:commands }); }
    var scheduleView = null;
    if (factories.scheduleView) { scheduleView = factories.scheduleView({ dom: dom, calendar: calendar, signals: signals }); }
    var scheduleEditor = null;
    if (factories.scheduleEditor) { scheduleEditor = factories.scheduleEditor({ dom: dom, calendar: calendar, model: model, signals: signals }); }
    var schedulePages = null;
    if (factories.schedulePages) { schedulePages = factories.schedulePages({ dom: dom }); }
    var scheduleWindow = null;
    if (factories.scheduleWindow) { scheduleWindow = factories.scheduleWindow({ model: model, dom: dom,
      signals: signals, pages: schedulePages }); }
    var schedule = null;
    if (factories.schedule) { schedule = factories.schedule({ bridge: bridge, model: model, dom: dom, calendar: calendar,
      commands: commands, signals: signals, view: scheduleView, editor: scheduleEditor }); }
    var navigation = factories.navigation({ bridge:bridge, model:model, dom:dom, signals:signals, commands:commands, layout:layout, wishDrawer:wishDrawer });
    var overlays = factories.overlays({ bridge:bridge, model:model, dom:dom, signals:signals, commands:commands, layout:layout, wishDrawer:wishDrawer });
    var updates = factories.updates({ model: model, dom: dom, layout: layout, commands: commands,
      wishes: wishes, studio: studio, queue: queue, team: team, schedule: schedule, provider: provider, player: player,
      presentation: presentation, signals: signals });
    var lifecycle = factories.lifecycle({ bridge: bridge, model: model, dom: dom, layout: layout,
      commands: commands, wishes: wishes, provider: provider, player: player, signals: signals });
    lifecycle.prepareAssets(modules, typeof styles === 'undefined' ? [] : styles, typeof styleViews === 'undefined' ? {} : styleViews);
    lifecycle.start([viewport, layout, commands, volume, player, curtain, wishes, wishPositions, wishDrawer,
      studio, handover, assistant, queue, team, statusCentral, scheduleEditor, history, scheduleWindow, schedule, updates, overlays, navigation]);
});

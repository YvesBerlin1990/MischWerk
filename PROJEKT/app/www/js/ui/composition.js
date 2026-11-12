/* Vorhandene Fachkomponenten einmalig und explizit verbinden. */
MischWerkUI.setComposer(function (factories) {

    var bridge = typeof Client !== 'undefined' ? Client : null;
    var dom = factories.dom({});
    if (factories.radioMarkup) { factories.radioMarkup({ dom: dom }); }
    if (factories.wishesMarkup) { factories.wishesMarkup({ dom: dom }); }
    if (factories.studioMarkup) { factories.studioMarkup({ dom: dom }); }
    if (factories.handoverMarkup) { factories.handoverMarkup({ dom: dom }); }
    if (factories.teamMarkup) { factories.teamMarkup({ dom: dom }); }
    if (factories.channelTextsMarkup) { factories.channelTextsMarkup({ dom:dom }); }
    if (factories.scheduleMarkup) { factories.scheduleMarkup({ dom:dom }); }
    var signals = factories.signals({});
    var model = factories.model({ bridge: bridge, signals: signals });
    var radioTicker = null;
    if (factories.radioTicker) { radioTicker = factories.radioTicker({ model:model, dom:dom, signals:signals }); }
    var viewport = null;
    if (factories.viewport) { viewport = factories.viewport({ bridge: bridge, model: model, dom: dom, signals: signals }); }
    var layout = factories.layout({ model: model, dom: dom, signals: signals, viewport: viewport });
    var commands = factories.commands({ bridge: bridge, model: model, layout: layout, signals: signals });
    var metadata = null;
    if (factories.songMetadata) { metadata = factories.songMetadata({}); }
    var requests = null;
    if (factories.radioRequests) { requests = factories.radioRequests({}); }
    var api = null;
    if (factories.radioApi) { api = factories.radioApi({ metadata: metadata, requests: requests }); }
    var presentation = null;
    if (factories.presentation) { presentation = factories.presentation({ model: model, dom: dom, signals: signals }); }
    var provider = null;
    if (factories.provider) { provider = factories.provider({ model: model, dom: dom, api: api, signals: signals, presentation: presentation }); }
    var audio = dom.el('radio-audio');
    var volume = null;
    if (factories.volume) { volume = factories.volume({ dom: dom, audio: audio }); }
    var connection = null;
    if (factories.radioConnection) { connection = factories.radioConnection({ audio: audio, signals: signals }); }
    var player = null;
    if (factories.player) { player = factories.player({ model: model, dom: dom, api: api, provider: provider,
      signals: signals, volume: volume, connection: connection }); }
    var listenerPresence = null;
    if (factories.listenerPresence) { listenerPresence = factories.listenerPresence({ player:player, audio:audio,
      commands:commands, model:model, signals:signals }); }
    var wishes = null;
    if (factories.wishes && !(bridge && bridge.pageData && bridge.pageData.wishSurface)) { wishes = factories.wishes({ bridge: bridge, model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var wishFeedback = null;
    if (factories.wishFeedback) { wishFeedback = factories.wishFeedback({ bridge:bridge, dom:dom }); }
    var wishRelay = null;
    if (factories.wishRelay) { wishRelay = factories.wishRelay({ bridge:bridge, model:model, dom:dom, commands:commands, signals:signals }); }
    var wishDrawer = null;
    if (factories.wishDrawer) { wishDrawer = factories.wishDrawer({ bridge:bridge, model:model, dom:dom, commands:commands, signals:signals }); }
    var wishWindow = null;
    if (factories.wishWindow) { wishWindow = factories.wishWindow({ bridge:bridge, model:model, dom:dom, signals:signals }); }
    var reader=null;
    if(factories.studioReader){reader = factories.studioReader({dom:dom,signals:signals});}
    var workspace=null;
    if(factories.studioWorkspace){workspace = factories.studioWorkspace({model:model,dom:dom,signals:signals});}
    var studioWindow=null;
    var studio = null;
    if (factories.studio) { studio = factories.studio({ model: model, dom: dom, layout: layout, commands: commands, signals: signals }); }
    var queue = null;
    if (factories.queue) { queue = factories.queue({ model: model, dom: dom, commands: commands, signals: signals, reader:reader }); }
    if(factories.studioWindow){studioWindow = factories.studioWindow({model:model,signals:signals,dom:dom,bridge:bridge});}
    var handover = null;
    if (factories.handover) { handover = factories.handover({ model: model, dom: dom, layout: layout, commands: commands, signals: signals, reader:reader }); }
    var team = null;
    if (factories.team) { team = factories.team({ model: model, dom: dom, commands: commands, signals: signals }); }
    var channelTexts = null;
    var channelTextsLayout = null;
    if (factories.channelTextsLayout) { channelTextsLayout = factories.channelTextsLayout({ dom:dom, signals:signals }); }
    if (factories.channelTexts) { channelTexts = factories.channelTexts({ bridge:bridge, model:model, dom:dom, commands:commands, signals:signals }); }
    var teamConnection = null, teamNavigation = null;
    if (factories.teamConnection) { teamConnection = factories.teamConnection({ bridge:bridge, model:model, signals:signals }); }
    if (factories.teamNavigation) { teamNavigation = factories.teamNavigation({ dom:dom, model:model, signals:signals }); }
    var scheduleView = null;
    if (factories.scheduleView) { scheduleView = factories.scheduleView({ dom:dom, bridge:bridge, signals:signals }); }
    var schedule = null;
    if (factories.schedule) { schedule = factories.schedule({ bridge:bridge, model:model, dom:dom, commands:commands, signals:signals, view:scheduleView }); }
    var overlays = factories.overlays({ bridge:bridge, model:model, dom:dom, signals:signals, commands:commands, layout:layout, wishDrawer:wishDrawer });
    var updates = factories.updates({ model: model, dom: dom, layout: layout, commands: commands,
      wishes: wishes, studio: studio, queue: queue, team: team, provider: provider, player: player,
      presentation: presentation, signals: signals });
    var lifecycle = factories.lifecycle({ bridge: bridge, model: model, dom: dom, layout: layout,
      commands: commands, wishes: wishes, provider: provider, player: player, signals: signals, listenerPresence:listenerPresence });
    lifecycle.start([viewport, layout, commands, volume, player, listenerPresence, radioTicker, wishes, wishFeedback, wishRelay, wishDrawer, wishWindow,
      studioWindow, workspace, reader, studio, handover, queue, team, channelTextsLayout, channelTexts, teamConnection, teamNavigation, scheduleView, schedule, updates, overlays]);
});

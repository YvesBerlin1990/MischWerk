/* Client-Hooks, Sichtbarkeitswechsel, Refresh-Timer und erster Layoutabschluss. */
MischWerkUI.define('lifecycle', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var layout = dependencies.layout;
  var commands = dependencies.commands;
  var wishes = dependencies.wishes;
  var provider = dependencies.provider;
  var player = dependencies.player;
  var signals = dependencies.signals;
  var initialLayoutTimer;
  var initialLayoutFinished = false;
  var assets = [], warmed = {}, assetTimer, disposed = false;
  function prepareAssets(scripts, styles, styleViews) {
    assets = scripts.map(function (entry) { return { file:'js/' + entry[1], views:entry[2], as:'script' }; });
    styles.forEach(function (file) { assets.push({ file:file, views:styleViews[file], as:'style' }); });
  }
  function assetURL(file, kind) {
    var anchor = kind === 'script' ? 'js/start.js' : 'css/foundation.css';
    var elements = document.querySelectorAll(kind === 'script' ? 'script[src]' : 'link[rel=stylesheet][href]');
    for (var index = 0; index < elements.length; index++) {
      var url = new URL(kind === 'script' ? elements[index].src : elements[index].href, document.baseURI);
      if (url.origin !== location.origin || !url.pathname.endsWith('/' + anchor)) { continue; }
      // Den tatsächlich vom SDK erzeugten Pfad samt Cachekennung übernehmen, keine Parameternamen erfinden.
      url.pathname = url.pathname.slice(0, -anchor.length) + file;
      return url.href;
    }
    return null;
  }
  function warmOverlays() {
    var state = model.current(), connection = navigator.connection;
    if (disposed || model.view !== 'radio' || document.hidden || !model.connected() || !state ||
        !document.documentElement.classList.contains('mw-ready') || (connection && connection.saveData)) { return; }
    var allowed = ['radio', 'schedule'];
    if (state.requestsEnabled) { allowed.push('wishes'); }
    if (state.user.canModerate) { allowed.push('studio'); }
    if (state.user.canManageRadioModerators) { allowed.push('team'); }
    assets.forEach(function (asset) {
      if (!asset.views || !asset.views.split(' ').some(function (view) { return allowed.indexOf(view) !== -1; }) ||
          asset.views.split(' ').indexOf('radio') !== -1) { return; }
      var url = assetURL(asset.file, asset.as);
      if (!url || warmed[url]) { return; }
      var hint = document.createElement('link'); hint.rel = 'prefetch'; hint.as = asset.as; hint.href = url;
      hint.setAttribute('data-mw-prefetch', ''); document.head.appendChild(hint); warmed[url] = true;
    });
  }
  function queueWarmup() { clearTimeout(assetTimer); assetTimer = setTimeout(warmOverlays, 0); }
  function finishInitialLayout() {
    if (initialLayoutFinished || !Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function (link) { return !!link.sheet; })) { return; }
    initialLayoutFinished = true;
    clearInterval(initialLayoutTimer);
    if (wishes) { wishes.fitText(); }
    signals.emit('initial-layout');
    layout.resizeBar(true);
    layout.resizeDialog(true);
    document.documentElement.classList.add('mw-ready');
    signals.emit('queue-visible');
    queueWarmup();
  }
  function refreshVisible() {
    commands.send('mw:refresh', {});
    if (provider && provider.hasStation()) { provider.poll(); }
  }
  function start(components) {
    signals.on('snapshot', queueWarmup);
    components.forEach(function (component) { if (component) { component.start(); } });
    if (bridge) {
      bridge.addEventListener('mw:state', function (event) { model.receive(event.data); });
      if (wishes) { bridge.addEventListener('mw:wish.receipt', wishes.receipt); }
      bridge.addEventListener('mw:result', function (event) { commands.result(event.data); });
      if (model.view === 'studio' || model.shared) { bridge.addEventListener('mw:schedule.changed', function () { if (model.view === 'studio') { refreshVisible(); } }); }
      if (bridge.pageData && bridge.pageData.user) { model.receive(bridge.pageData); }
      try {
        var frame = bridge.getHostFrame();
        frame.setTitle(model.view === 'wishes' ? 'MischWerk · Wunschbox' : model.view === 'studio' ?
          'MischWerk · Moderation' : model.view === 'team' ? 'MischWerk · Radio-Team' : model.view === 'schedule' ? 'MischWerk · Sendeplan' : 'MischWerk · Radio');
      } catch (error) { /* Optionale Beschriftung darf den Player nicht blockieren. */ }
      layout.resizeBar();
      commands.send('mw:ready');
      setInterval(function () { if (!document.hidden) { commands.send('mw:refresh', {}); } }, 20000);
      setInterval(function () { signals.emit('controls'); }, 1000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { refreshVisible(); queueWarmup(); } });
    } else {
      if (wishes) {
        dom.setText('wish-hint', 'Öffne diese App in Knuddels mit /mischwerk oder starte die lokale Vorschau aus dem Projektordner.');
        dom.el('wish-hint').hidden = false;
      }
      if (provider) { dom.setText('metadata-status', 'Diese Oberfläche benötigt die Verbindung zum Knuddels-MyChannel.'); }
    }
    window.addEventListener('pagehide', function () {
      disposed = true; clearTimeout(assetTimer);
      document.querySelectorAll('link[data-mw-prefetch]').forEach(function (hint) { hint.remove(); });
      if (player) { player.stop(); }
      if (provider) { provider.dispose(); }
    });
    initialLayoutTimer = setInterval(finishInitialLayout, 40);
    finishInitialLayout();
    window.addEventListener('load', finishInitialLayout, { once:true });
    window.addEventListener('resize', function () { layout.resizeBar(); if (wishes) { wishes.fitText(); } });
    layout.resizeDialog();
    window.addEventListener('pageshow', function (event) { if (event.persisted && bridge) { disposed = false; refreshVisible(); queueWarmup(); } });
  }
  return { start: start, prepareAssets: prepareAssets };
});

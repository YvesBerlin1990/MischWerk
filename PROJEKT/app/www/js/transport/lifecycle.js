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
  var listeners = dependencies.listeners;
  var player = dependencies.player;
  var signals = dependencies.signals;
  function finishInitialLayout() {
    if (wishes) { wishes.fitText(); }
    layout.resizeBar();
    document.documentElement.classList.add('mw-ready');
    signals.emit('queue-visible');
  }
  function refreshVisible() {
    commands.send('mw:refresh', {});
    if (provider && provider.hasStation()) { provider.poll(); }
    if (listeners) { listeners.poll(); }
  }
  function start() {
    if (bridge) {
      bridge.addEventListener('mw:state', function (event) { model.receive(event.data); });
      if (wishes) { bridge.addEventListener('mw:wish.receipt', wishes.receipt); }
      bridge.addEventListener('mw:result', function (event) { commands.result(event.data); });
      if (bridge.pageData && bridge.pageData.user) { model.receive(bridge.pageData); }
      try {
        var frame = bridge.getHostFrame();
        frame.setTitle(model.view === 'wishes' ? 'MischWerk · Wunschbox' : model.view === 'studio' ?
          'MischWerk · Moderation' : model.view === 'team' ? 'MischWerk · Radio-Team' : model.view === 'schedule' ? 'MischWerk · Sendeplan' : 'MischWerk · Radio');
        if (model.view !== 'radio' && !bridge.isK3Client()) { frame.setResizable(false); }
      } catch (error) { /* Optionale Beschriftung darf den Player nicht blockieren. */ }
      layout.resizeBar();
      commands.send('mw:ready');
      setInterval(function () { if (!document.hidden) { commands.send('mw:refresh', {}); } }, 20000);
      setInterval(function () { signals.emit('controls'); }, 1000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { refreshVisible(); } });
    } else {
      if (wishes) {
        dom.setText('wish-hint', 'Öffne diese App in Knuddels mit /mischwerk oder starte die lokale Vorschau aus dem Projektordner.');
        dom.el('wish-hint').hidden = false;
      }
      if (provider) { dom.setText('metadata-status', 'Diese Oberfläche benötigt die Verbindung zum Knuddels-MyChannel.'); }
    }
    window.addEventListener('pagehide', function () {
      if (player) { player.stop(); }
      if (provider) { provider.dispose(); }
      if (listeners) { listeners.dispose(); }
    });
    if (document.readyState === 'complete') { finishInitialLayout(); }
    else { window.addEventListener('load', finishInitialLayout); }
    window.addEventListener('resize', function () { layout.resizeBar(); if (wishes) { wishes.fitText(); } });
    layout.resizeDialog();
    window.addEventListener('pageshow', function (event) { if (event.persisted && bridge) { refreshVisible(); } });
  }
  return { start: start };
});

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
  var activityInterval = 180000;
  var activityPosition = null;
  var activitySampleAt = 0;
  var activityProgressAt = 0;
  var activityDueAt = 0;
  var activityRequest = null;
  var disposed = false;

  function resetPlaybackActivity() {
    activityPosition = null; activitySampleAt = 0; activityProgressAt = 0;
    // Kurzes Nachladen darf den bestätigten Hörwunsch nicht endlos um drei Minuten verschieben.
    if (!player || !player.isListening()) { activityDueAt = 0; }
    activityRequest = null;
  }
  function playbackPosition() {
    return !disposed && player && navigator.onLine !== false ? player.playbackPosition() : null;
  }
  function samplePlaybackActivity() {
    var position = playbackPosition();
    if (position === null || !model.connected() || !bridge || typeof bridge.executeSlashCommand !== 'function') {
      resetPlaybackActivity(); return;
    }
    // Dieselbe monotone Medienuhr wie die Audioverbindung; Systemzeitkorrekturen ändern keine Frist.
    var now = player.playbackNow();
    var elapsed = (now - activitySampleAt) / 1000, advanced = false;
    if (activityPosition === null || elapsed <= 0 || elapsed > 15 || position < activityPosition ||
        position - activityPosition > elapsed * 2 + 1) {
      resetPlaybackActivity();
    } else if (position > activityPosition) { activityProgressAt = now; advanced = true; }
    activityPosition = position; activitySampleAt = now;
    if (!activityDueAt) { activityDueAt = now + activityInterval; }
    if (!activityProgressAt || now - activityProgressAt > 5000) {
      activityRequest = null; return;
    }
    if (activityRequest && now > activityRequest.expiresAt) { activityRequest = null; }
    if (!advanced) { activityRequest = null; return; }
    if (activityRequest && activityRequest.confirmed && position > activityRequest.position) {
      activityRequest = null; activityDueAt = now + activityInterval;
      // Öffentliche Client-Methode; /confirm ist im aktuellen OR-Radio-Player nachgewiesen.
      try { bridge.executeSlashCommand('/confirm'); } catch (error) { resetPlaybackActivity(); }
      return;
    }
    if (now < activityDueAt || activityRequest) { return; }
    // Erst eine ausgeführte Bestätigung beginnt den nächsten Drei-Minuten-Abstand.
    // Verlorene/unterbrochene Antworten begrenzt neu prüfen, solange wirklich Ton läuft.
    activityDueAt = now + 10000;
    activityRequest = { id:commands.nextId('playback'), expiresAt:now + 10000, position:position, confirmed:false };
    commands.send('mw:refresh', { requestId:activityRequest.id });
  }
  function confirmPlaybackActivity(change) {
    if (!activityRequest || activityRequest.confirmed || change.refreshRequestId !== activityRequest.id) { return; }
    var position = playbackPosition(), now = player.playbackNow();
    if (now > activityRequest.expiresAt || position === null || !model.connected() ||
        !activityProgressAt || now - activityProgressAt > 5000) { activityRequest = null; return; }
    activityRequest.position = position;
    activityRequest.confirmed = true;
  }

  function finishInitialLayout() {
    if (typeof startupBroken !== 'undefined' && startupBroken) { clearInterval(initialLayoutTimer); return; }
    if (initialLayoutFinished || !Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function (link) { return !!link.sheet; })) { return; }
    if (model.view !== 'radio' && document.fonts && document.fonts.status === 'loading') { return; }
    initialLayoutFinished = true;
    clearInterval(initialLayoutTimer);
    if (wishes) { wishes.fitText(); }
    signals.emit('initial-layout');
    layout.resizeBar(true);
    layout.resizeDialog(true);
    document.documentElement.classList.add('mw-ready');
    signals.emit('queue-visible');
  }
  function refreshVisible() {
    commands.send('mw:refresh', {});
    if (provider && provider.hasStation()) { provider.poll(); }
  }
  function start(components) {
    components.forEach(function (component) { if (component) { component.start(); } });
    if (bridge) {
      signals.on('playback-reset', resetPlaybackActivity);
      signals.on('snapshot', confirmPlaybackActivity);
      window.addEventListener('offline', resetPlaybackActivity);
      bridge.addEventListener('mw:state', function (event) { model.receive(event.data); });
      if (wishes) { bridge.addEventListener('mw:wish.receipt', wishes.receipt); }
      bridge.addEventListener('mw:result', function (event) { commands.result(event.data); });
      if (bridge.pageData && bridge.pageData.user) { model.receive(bridge.pageData); }
      try {
        var frame = bridge.getHostFrame();
        frame.setTitle(model.view === 'wishes' ? 'MischWerk · Wunschbox' : model.view === 'studio' ?
          'MischWerk · Moderation' : model.view === 'team' ? 'MischWerk · Verwaltung' : 'MischWerk · Radio');
      } catch (error) { /* Optionale Beschriftung darf den Player nicht blockieren. */ }
      layout.resizeBar();
      commands.send('mw:ready');
      setInterval(function () { if (!disposed && (!document.hidden || playbackPosition() !== null)) { commands.send('mw:refresh', {}); } }, 20000);
      setInterval(function () { samplePlaybackActivity(); signals.emit('controls'); }, 1000);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (provider) { provider.dispose(); } }
        else { refreshVisible(); }
      });
    } else {
      if (wishes) {
        dom.setText('wish-hint', 'Öffne diese App in Knuddels mit /mischwerk oder starte die lokale Vorschau aus dem Projektordner.');
        dom.el('wish-hint').hidden = false;
      }
      if (provider) { dom.setText('metadata-status', 'Diese Oberfläche benötigt die Verbindung zum Knuddels-MyChannel.'); }
    }
    window.addEventListener('pagehide', function () {
      disposed = true; resetPlaybackActivity();
      if (player) { player.stop(); }
      if (provider) { provider.dispose(); }
    });
    initialLayoutTimer = setInterval(finishInitialLayout, 40);
    finishInitialLayout();
    window.addEventListener('load', finishInitialLayout, { once:true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(finishInitialLayout); }
    window.addEventListener('resize', function () { layout.resizeBar(); if (wishes) { wishes.fitText(); } });
    layout.resizeDialog();
    window.addEventListener('pageshow', function (event) {
      if (event.persisted && bridge) { disposed = false; resetPlaybackActivity(); refreshVisible(); }
    });
  }
  return { start: start };
});

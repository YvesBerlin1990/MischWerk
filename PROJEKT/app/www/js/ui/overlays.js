/* Channel-Overlays schließen, Entwürfe bestätigen und Fokus zum Einstieg zurückgeben. */
MischWerkUI.define('overlays', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var signals = dependencies.signals, commands = dependencies.commands, layout = dependencies.layout;
  var wishDrawer = dependencies.wishDrawer;
  var enabled = bridge && bridge.pageData && (bridge.pageData.overlay || bridge.pageData.wishSurface);
  var revision = 0, restored = false, restoring = false, timer, saveTimer, closeTimer;
  var restoredViews = {};
  var lockedToken = null, lastToken = 0, lockedFocus = null;
  var entries = { wishes:'open-wishes', studio:'studio-tab', team:'team-tab', schedule:'open-schedule' };
  function capture() {
    var state = {};
    signals.emit('overlay-capture', state);
    state.focus = document.activeElement && document.activeElement.id || '';
    state.scroll = Math.max(0, Math.round(document.scrollingElement.scrollTop));
    return state;
  }
  function send(type, data) {
    if (model.shared && model.current()) { data.view = model.view; data.viewRevision = model.current().viewRevision; }
    try { bridge.sendEvent(type, data); return true; }
    catch (error) { layout.notify('Die Verbindung antwortet nicht. Deine Eingabe bleibt hier erhalten.', true); return false; }
  }
  function save() {
    if (!enabled || !restored || restoring || lockedToken !== null || model.view === 'wishes') { return; }
    send('mw:overlay.draft', { state:capture(), revision:++revision });
  }
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 0); }
  function prepare(token) {
    if (!Number.isInteger(token) || token <= lastToken) { return; }
    lastToken = token;
    clearTimeout(timer);
    var started = Date.now();
    function attempt() {
      var state = capture();
      var waiting = !!commands.pending() || !!state.busy ||
        (model.view === 'wishes' && wishDrawer && !wishDrawer.isSynced());
      if (waiting && Date.now() - started < 6000) { timer = setTimeout(attempt, 50); return; }
      if (!waiting) {
        lockedToken = token; lockedFocus = document.activeElement;
        var panel = model.view === 'wishes' ? dom.el('wishes-panel') : document.querySelector('.dialog-content');
        panel.inert = true; panel.setAttribute('aria-busy', 'true');
      }
      send('mw:overlay.ready', { token:token, state:state, revision:++revision, error:waiting });
      if (waiting) { layout.notify('Die Eingabe wird noch bestätigt. Bitte den Wechsel erneut versuchen.', true); }
    }
    attempt();
  }
  function dismiss() {
    if (lockedToken !== null) { send('mw:overlay.cancel', { token:lockedToken }); return; }
    var state = capture();
    if (commands.pending() || state.busy) { layout.notify('Die letzte Aktion wird noch bestätigt. Bitte kurz warten.', true); return; }
    if (send('mw:overlay.dismiss', { state:state, revision:++revision })) {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { layout.notify('Schließen wurde noch nicht bestätigt. Deine Eingabe bleibt hier erhalten.', true); }, 6000);
    }
  }
  function restore() {
    if (restored || !model.current()) { return; }
    restored = true; restoring = true;
    var state = model.shared ? model.current().overlayState : bridge.pageData.overlayState;
    if (state && typeof state === 'object') {
      if (!model.shared || !restoredViews[model.view]) { signals.emit('overlay-restore', state); }
      requestAnimationFrame(function () {
        var target = typeof state.focus === 'string' && document.getElementById(state.focus);
        if (target && !target.disabled && target.getClientRects().length) { target.focus({ preventScroll:true }); }
        window.scrollTo(0, Number(state.scroll) || 0);
      });
    }
    restoredViews[model.view] = true;
    restoring = false;
  }
  function start() {
    if (!bridge) { return; }
    if (model.view === 'radio') {
      function restoreEntry(data) {
        var curtain = model.current() && model.current().curtain;
        var target = dom.el(curtain && curtain.closed && !curtain.exempt ? 'curtain-ad' : entries[data.kind] || 'open-schedule');
        if (data.kind === 'wishes' && target.disabled) { target = dom.el('open-schedule'); }
        if (target.disabled || !target.getClientRects().length) { target = dom.el('mute-button'); }
        target.focus({ preventScroll:true });
        if (target.id === 'mute-button') { target.scrollIntoView({ block:'nearest', inline:'nearest' }); }
      }
      bridge.addEventListener('mw:overlay.closed', function (event) { restoreEntry(event.data); });
      signals.on('overlay-closed', restoreEntry);
      return;
    }
    if (!enabled) { return; }
    document.documentElement.setAttribute('data-overlay', 'true');
    if (model.view !== 'wishes' || model.shared) {
      document.querySelector('.dialog-shell').setAttribute('role', 'dialog');
      document.querySelector('.dialog-shell').setAttribute('aria-labelledby', 'dialog-title');
      dom.el('close-overlay').hidden = model.view === 'wishes';
      dom.el('close-overlay').addEventListener('click', dismiss);
      document.addEventListener('keydown', function (event) {
        if (model.view !== 'wishes' && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); dismiss(); }
      });
    }
    signals.on('overlay-dismiss', dismiss);
    bridge.addEventListener('mw:overlay.prepare', function (event) { prepare(event.data.token); });
    bridge.addEventListener('mw:overlay.resume', function (event) {
      if (lockedToken !== event.data.token) { return; }
      lockedToken = null;
      var panel = model.view === 'wishes' ? dom.el('wishes-panel') : document.querySelector('.dialog-content');
      panel.inert = false; panel.removeAttribute('aria-busy');
      if (lockedFocus && !lockedFocus.disabled && lockedFocus.getClientRects().length) { lockedFocus.focus({ preventScroll:true }); }
    });
    bridge.addEventListener('mw:overlay.focus', function () {
      var target = document.activeElement;
      if (!target || target === document.body || !target.getClientRects().length) { target = dom.el(model.view === 'wishes' ? 'close-wishes' : 'close-overlay'); }
      if (target.getClientRects().length) { target.focus({ preventScroll:true }); }
    });
    signals.on('view-changed', function () {
      clearTimeout(timer); clearTimeout(closeTimer); lockedToken = null; restored = false;
      [dom.el('wishes-panel'), document.querySelector('.dialog-content')].forEach(function (panel) {
        panel.inert = false; panel.removeAttribute('aria-busy');
      });
    });
    signals.on('snapshot', restore);
    document.addEventListener('input', save);
    document.addEventListener('change', save);
    document.addEventListener('click', queueSave);
    signals.on('command-result', queueSave);
    window.addEventListener('pagehide', function () {
      save(); clearTimeout(timer); clearTimeout(saveTimer); clearTimeout(closeTimer);
    });
    restore();
  }
  return { start:start };
});

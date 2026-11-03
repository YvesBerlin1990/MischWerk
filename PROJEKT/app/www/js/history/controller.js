/* Sichtbarer Programmreiter, Tageswechsel, Abrufgeneration und lesbare Titelmeldungen. */
MischWerkUI.define('history', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, model = dependencies.model, dom = dependencies.dom;
  var signals = dependencies.signals, api = dependencies.data, commands = dependencies.commands, view = dependencies.view;
  var initial = bridge && bridge.pageData && bridge.pageData.overlayState;
  var selected = !!(initial && initial.studioHistory === true);
  var cached = [], page = 0, key = null, generation = 0, job = null, timer, midnight;
  var shownDay = api.day(Date.now()), message = '', failed = false, ended = false, entered = false;
  function permitted() { var state = model.current(); return !!(state && state.user && state.user.canModerate === true); }
  function visible() { return !ended && selected && permitted() && model.view === 'studio' && !document.hidden; }
  function showSelection() {
    dom.el('studio-programme-tabs').hidden = !permitted();
    dom.el('studio-programme').hidden = selected; dom.el('history-panel').hidden = !selected;
    ['studio-programme-tab', 'studio-history-tab'].forEach(function (id, index) {
      var active = selected === (index === 1), button = dom.el(id);
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
    });
    document.documentElement.classList.toggle('history-open', selected && model.view === 'studio');
  }
  function stop() {
    clearTimeout(timer); clearTimeout(midnight); timer = null; midnight = null; generation += 1;
    if (job) { job.cancel(); } job = null;
  }
  function render() {
    var today = api.day(Date.now());
    if (today !== shownDay) { cached = []; page = 0; shownDay = today; message = ''; failed = false; }
    dom.setText('history-heading', 'Heute · ' + today.slice(8) + '.' + today.slice(5, 7) + '.' + today.slice(0, 4));
    var state = model.current(), rows = api.parse(cached, Date.now(), state && state.station);
    dom.setText('history-feedback', job ? 'Titelmeldungen werden geladen …' : message);
    dom.el('history-feedback').classList.toggle('error', failed);
    dom.el('history-refresh').disabled = !!job;
    dom.el('history-refresh').setAttribute('aria-busy', String(!!job));
    page = view.render(rows, page, api.time);
  }
  function poll() {
    clearTimeout(timer); timer = null;
    if (!visible() || job) { return; }
    var state = model.current();
    if (!state || !model.connected()) { message = 'Die App-Verbindung fehlt. Bitte aktualisieren.'; failed = true; render(); return; }
    if (!api.url(state.station)) { message = 'Die Titelhistorie ist für diesen Sender noch nicht eingerichtet.'; failed = false; render(); return; }
    var selectedGeneration = generation, retry = 15000;
    var task = api.load(state.station); job = task; render();
    task.promise.then(function (rows) {
      if (selectedGeneration !== generation || !visible()) { return; }
      api.parse(rows, Date.now(), state.station); cached = rows; failed = false;
      message = 'Aktualisiert um ' + api.time(Math.floor(Date.now() / 1000)) + ' Uhr.';
    }).catch(function () {
      if (selectedGeneration !== generation || !visible()) { return; }
      retry = 60000; failed = true;
      message = 'Die Historie ist gerade nicht erreichbar. Bereits geladene heutige Titel bleiben sichtbar.';
    }).finally(function () {
      if (job !== task) { return; } job = null; render();
      if (selectedGeneration === generation && visible()) { timer = setTimeout(poll, retry); }
    });
  }
  function synchronize() {
    if (!permitted()) {
      var focused = dom.el('history-panel').contains(document.activeElement) || document.activeElement === dom.el('studio-history-tab');
      stop(); selected = false; cached = []; page = 0; message = ''; failed = false; view.clear();
      if (focused && !dom.el('close-overlay').hidden) { dom.el('close-overlay').focus({ preventScroll:true }); }
    }
    showSelection();
    var next = model.current() ? JSON.stringify(model.current().station) : null;
    if (key !== next) { stop(); cached = []; page = 0; key = next; message = ''; failed = false; }
    render();
    if (!visible()) { if (job || timer || midnight) { stop(); } return; }
    if (!midnight) { midnight = setTimeout(function () { stop(); cached = []; page = 0; synchronize(); }, api.nextDay(Date.now()) - Date.now()); }
    if (!job && !timer) { poll(); }
  }
  function select(value) {
    selected = value === true && permitted();
    synchronize(); signals.emit('queue-visible');
    if (!selected) { signals.emit('studio-layout'); }
  }
  function start() {
    ['studio-programme-tab', 'studio-history-tab'].forEach(function (id, index) {
      var button = dom.el(id);
      button.addEventListener('click', function () { select(index === 1); });
      button.addEventListener('keydown', function (event) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) { return; }
        event.preventDefault(); var next = event.key === 'Home' ? false : event.key === 'End' ? true : !selected;
        select(next); dom.el(selected ? 'studio-history-tab' : 'studio-programme-tab').focus();
      });
    });
    dom.el('history-refresh').addEventListener('click', function () {
      if (!model.connected()) { commands.send('mw:refresh', {}); } poll();
    });
    [['history-previous', -1], ['history-next', 1]].forEach(function (entry) {
      dom.el(entry[0]).addEventListener('click', function () { if (!this.disabled) { page += entry[1]; render(); } });
    });
    signals.on('overlay-capture', function (state) { if (model.view === 'studio' && permitted()) { state.studioHistory = selected; } });
    signals.on('overlay-restore', function (state) { if (model.view === 'studio') { select(state.studioHistory === true); } });
    signals.on('view-changed', function () {
      if (model.view === 'studio' && !entered) {
        entered = true; var state = model.current().overlayState;
        if (state) { select(state.studioHistory === true); }
      }
      synchronize();
    });
    signals.on('snapshot', synchronize);
    signals.on('history-layout', function () { if (visible()) { render(); } });
    document.addEventListener('visibilitychange', synchronize);
    window.addEventListener('resize', function () { if (visible()) { render(); } });
    window.addEventListener('pagehide', function () { ended = true; stop(); });
    window.addEventListener('pageshow', function () { ended = false; synchronize(); });
    select(selected);
  }
  return { start:start };
});

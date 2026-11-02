/* Lesende Anbieterprüfung nur in der sichtbaren, berechtigten Statuszentrale. */
MischWerkUI.define('statusCentral', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var api = dependencies.api;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var view = dependencies.view;
  var selected = false, ended = false, stationKey = null, generation = 0;
  var remote = {}, pending = null, timer;
  function authorized() {
    return model.view === 'team' && model.current() && model.current().user.canManageRadioModerators;
  }
  function visible() { return !ended && authorized() && selected && !document.hidden; }
  function render() {
    if (visible()) { view.render(remote, !!pending, !!api.radioKingUrls(model.current().station)); }
  }
  function stop() {
    clearTimeout(timer); generation += 1; pending = null; stationKey = null; remote = {};
  }
  function poll() {
    clearTimeout(timer);
    if (!visible() || !model.connected()) { render(); return; }
    if (pending) { return pending; }
    var station = model.current().station;
    if (!api.radioKingUrls(station)) { render(); return; }
    var currentGeneration = generation, failed = false;
    function current() { return currentGeneration === generation && visible(); }
    function save(name, value, kind) {
      if (!current()) { return; }
      remote[name] = { value: value, kind: kind || 'ready', at: Date.now() }; render();
    }
    function read(name, request) {
      return request.then(function (value) { save(name, value); return value; }, function () {
        failed = true; save(name, null, 'error'); return null;
      });
    }
    var task = Promise.all([
      read('transmission', api.fetchStationStatus(station)).then(function (status) {
        if (!current()) { return; }
        if (status === 'stopped') { save('metadata', null, 'paused'); return; }
        return read('metadata', api.fetchMetadata(station));
      }),
      read('listeners', api.fetchListeners(station))
    ]).then(function () {
      if (!current() || pending !== task) { return; }
      pending = null; render(); timer = setTimeout(poll, failed ? 60000 : 30000);
    });
    pending = task; render(); return task;
  }
  function synchronize() {
    document.documentElement.classList.toggle('status-central-open', !!(authorized() && selected));
    if (!visible() || !model.connected()) {
      if (stationKey !== null || pending) { stop(); }
      render(); return;
    }
    var next = JSON.stringify(model.current().station);
    if (next !== stationKey) { stop(); stationKey = next; poll(); }
    render();
  }
  function select(status) {
    if (!authorized()) { return; }
    selected = status;
    dom.el('team-status').hidden = !status; dom.el('team-members').hidden = status;
    dom.el('team-status-tab').setAttribute('aria-pressed', String(status));
    dom.el('team-members-tab').setAttribute('aria-pressed', String(!status));
    synchronize();
  }
  function start() {
    dom.el('team-status-tab').addEventListener('click', function () { select(true); });
    dom.el('team-members-tab').addEventListener('click', function () { select(false); });
    dom.el('refresh-status').addEventListener('click', function () {
      if (!visible() || pending) { return; }
      commands.send('mw:refresh', {}); poll();
    });
    signals.on('snapshot', synchronize); signals.on('controls', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    window.addEventListener('pagehide', function () { ended = true; stop(); });
    window.addEventListener('pageshow', function (event) { if (event.persisted) { ended = false; synchronize(); } });
  }
  return { start: start };
});

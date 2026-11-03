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
  var remote = {}, remoteStation = null, pending = null, timer;
  var detailPage = 0;
  function details() {
    var items = document.querySelectorAll('.status-detail-list > div');
    Array.prototype.forEach.call(items, function (row, index) { row.hidden = index !== detailPage; });
    dom.setText('status-detail-page', 'Detail ' + (detailPage + 1) + ' / ' + items.length);
    dom.el('prev-status-detail').disabled = detailPage === 0;
    dom.el('next-status-detail').disabled = detailPage >= items.length - 1;
    document.documentElement.classList.toggle('status-details-open', dom.el('status-details').open);
    signals.emit('team-layout');
  }
  function authorized() {
    return model.view === 'team' && model.current() && model.current().user.canManageRadioModerators;
  }
  function visible() { return !ended && authorized() && selected && !document.hidden; }
  function render() {
    if (authorized()) { view.render(remote, visible() && !!pending, !!api.streamUrls(model.current().station)); }
  }
  function stop() {
    clearTimeout(timer); generation += 1; pending = null; stationKey = null;
  }
  function poll() {
    clearTimeout(timer);
    if (!visible() || !model.connected()) { render(); return; }
    if (pending) { return pending; }
    var station = model.current().station;
    var urls = api.streamUrls(station);
    if (!urls || (!urls.status && !urls.metadata)) { render(); return; }
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
    var task = (urls.status ? read('transmission', api.fetchStationStatus(station)) : Promise.resolve('unknown')).then(function (status) {
        if (!current()) { return; }
        if (status === 'stopped') { save('metadata', null, 'paused'); return; }
        if (urls.metadata) { return read('metadata', api.fetchMetadata(station)); }
      }).then(function () {
      if (!current() || pending !== task) { return; }
      pending = null; render(); timer = setTimeout(poll, failed ? 60000 : 30000);
    });
    pending = task; render(); return task;
  }
  function synchronize() {
    document.documentElement.classList.toggle('status-central-open', !!(authorized() && selected));
    var next = authorized() ? JSON.stringify(model.current().station) : null;
    // Bekannte Werte auch im inaktiven Reiter messen, ohne dafür Anbieterabfragen zu starten.
    if (next !== remoteStation) { remote = {}; remoteStation = next; }
    if (!visible() || !model.connected()) {
      if (stationKey !== null || pending) { stop(); }
      render(); return;
    }
    if (next !== stationKey) { stop(); stationKey = next; poll(); }
    render();
  }
  function select(status) {
    if (!authorized()) { return; }
    selected = status;
    dom.el('team-status').hidden = !status; dom.el('team-members').hidden = status;
    dom.el('team-status-tab').setAttribute('aria-pressed', String(status));
    dom.el('team-members-tab').setAttribute('aria-pressed', String(!status));
    synchronize(); details();
  }
  function start() {
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'team') { return; } state.status = { selected:selected, details:dom.el('status-details').open }; });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'team') { return; }
      if (state.status && model.current().user.canManageRadioModerators) {
        dom.el('status-details').open = state.status.details === true; select(state.status.selected === true);
      }
    });
    dom.el('status-details').addEventListener('toggle', details);
    [['prev-status-detail', -1], ['next-status-detail', 1]].forEach(function (entry) {
      dom.el(entry[0]).addEventListener('click', function () {
        if (this.disabled) { return; }
        detailPage += entry[1]; details();
        if (this.disabled) { dom.el(entry[1] > 0 ? 'prev-status-detail' : 'next-status-detail').focus(); }
      });
    });
    details();
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

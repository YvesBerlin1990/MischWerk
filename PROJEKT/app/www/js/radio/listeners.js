/* Öffentliche STREAMPANEL-Hörerzahl: eigener Abfragetakt ohne Einfluss auf Ton oder Rechte. */
MischWerkUI.define('listeners', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var api = dependencies.api;
  var signals = dependencies.signals;
  var station = null;
  var stationKey = null;
  var timer;
  var request = null;
  var generation = 0;
  var lastCountAt = 0;
  function visible() { return model.view === 'radio' && station && !document.hidden; }
  function render(count, loading) {
    var value = count === null ? loading ? '…' : 'nicht verfügbar' : count.toLocaleString('de-DE');
    dom.setText('listener-value', value);
    dom.el('listener-count').setAttribute('aria-label', 'Hörer: ' + value);
    dom.el('listener-count').classList.toggle('is-unavailable', count === null && !loading);
    dom.el('listener-count').title = count === null ? loading ? 'Hörerzahl wird von STREAMPANEL abgerufen.' :
      'Die STREAMPANEL-Hörerzahl ist gerade nicht verfügbar. Sie wird automatisch erneut geprüft.' :
      'Hörer: ' + value + '. Aktuelle Hörer des gesamten STREAMPANEL-Senders, nicht nur im Channel. Zuletzt abgerufen um ' +
        dom.time(lastCountAt) + '. Automatische Abfrage alle 20 Sekunden; Anbieterwerte können zeitversetzt sein.';
    signals.emit('radio-layout');
  }
  function poll() {
    clearTimeout(timer);
    if (!visible()) { return Promise.resolve(); }
    var urls = api.streamUrls(station);
    if (!urls || !urls.listeners) { render(null, false); return Promise.resolve(); }
    if (request) { return request; }
    if (lastCountAt && Date.now() - lastCountAt >= 60000) { render(null, true); }
    var selected = generation, interval = 20000;
    var pending = api.fetchListeners(station).then(function (count) {
      if (selected !== generation) { return; }
      lastCountAt = Date.now();
      render(count, false);
    }).catch(function () {
      if (selected !== generation) { return; }
      interval = 60000;
      lastCountAt = 0;
      render(null, false);
    }).then(function () {
      if (request !== pending) { return; }
      request = null;
      if (selected === generation && visible()) { timer = setTimeout(poll, interval); }
    });
    request = pending;
    return pending;
  }
  function dispose() {
    clearTimeout(timer);
    generation += 1;
    request = null;
  }
  function selectStation() {
    if (model.view !== 'radio') { return; }
    var next = model.current().station, key = JSON.stringify(next);
    if (key === stationKey) { return; }
    dispose();
    stationKey = key;
    station = api.streamUrls(next) ? next : null;
    lastCountAt = 0;
    render(null, !!station);
    poll();
  }
  return { selectStation: selectStation, poll: poll, dispose: dispose };
});

/* Sichtbarer Moderationswunsch, Empfangsquittung und Erledigt-/Verwerfen-Aktionen. */
MischWerkUI.define('queue', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var receiptAttempts = {};
  var queueKey = null;
  function requestText(item) {
    return typeof item.text === 'string' ? item.text :
      [item.artist, item.title].filter(Boolean).join(' – ') + (item.message ? ' · ' + item.message : '');
  }
  
  function acknowledgeQueue() {
    if (model.view !== 'studio' || !document.documentElement.classList.contains('mw-ready') ||
        !model.current() || !model.current().user.canModerate || !model.connected() || document.hidden) { return; }
    requestAnimationFrame(function () {
      var list = dom.el('request-queue');
      if (!list.getClientRects().length || document.hidden) { return; }
      model.current().queue.forEach(function (item) {
        if (item.delivery || (receiptAttempts[item.id] && Date.now() - receiptAttempts[item.id] < 15000)) { return; }
        receiptAttempts[item.id] = Date.now();
        commands.send('mw:ackRequest', { id: item.id }, false);
      });
    });
  }
  
  function renderQueue() {
    var list = dom.el('request-queue');
    var key = JSON.stringify([!!model.current().user.canModerate, model.current().user.canModerate ? model.current().queue.map(function (item) {
      return [item.id, item.nick, item.createdAt, requestText(item), item.stage || 'queued'];
    }) : []]);
    dom.setText('queue-count', model.current().queueTotal);
    dom.setText('page-label', 'Wunsch ' + (model.current().page + 1) + ' / ' + model.current().pages);
    dom.el('queue-pagination').classList.toggle('single-page', model.current().pages <= 1);
    dom.el('queue-pagination').hidden = !model.current().queueTotal || !model.current().user.canModerate;
    // Gleiche sichtbare Angaben nicht alle 20 Sekunden neu erstellen: Tastaturfokus bleibt erhalten.
    if (key === queueKey) { return; }
    queueKey = key;
    var hadFocus = list.contains(document.activeElement);
    var stageFocus = hadFocus && document.activeElement.hasAttribute('data-stage');
    list.textContent = '';
    if (!model.current().user.canModerate) { return; }
    if (!model.current().queue.length) { list.appendChild(dom.element('p', 'empty-copy', 'Noch keine Musikwünsche eingegangen.')); }
    model.current().queue.forEach(function (item) {
      var row = dom.element('article', 'queue-item');
      var copy = dom.element('div', 'queue-copy');
      copy.appendChild(dom.element('h3', 'request-text', requestText(item)));
      copy.appendChild(dom.element('p', 'request-sender', 'Von ' + item.nick + ' · ' + dom.time(item.createdAt) + ' Uhr'));
      var stage = item.stage || 'queued';
      var status = dom.element('p', 'request-stage', stage === 'playing' ? 'Läuft gerade' : stage === 'preparing' ? 'In Vorbereitung' : 'Wartet');
      status.dataset.stageValue = stage;
      copy.appendChild(status);
      var stageActions = dom.element('div', 'queue-stage-actions');
      var stages = stage === 'queued' ? ['preparing'] : stage === 'preparing' ? ['playing', 'queued'] : ['queued'];
      stages.forEach(function (nextStage) {
        var button = dom.element('button', 'secondary-button', nextStage === 'preparing' ? 'Vorbereiten' : nextStage === 'playing' ? 'Läuft gerade' : 'Zurückstellen');
        button.type = 'button'; button.dataset.stage = nextStage;
        button.dataset.firstOnly = nextStage === 'playing' ? 'true' : 'false';
        button.title = nextStage === 'playing' ? 'Als laufend markieren, sobald du den Wunsch spielst. Nur für Platz 1.' :
          nextStage === 'preparing' ? 'Diesen Wunsch vorbereiten; die Platznummer bleibt erhalten' : 'Markierung zurücknehmen; die Platznummer bleibt erhalten';
        button.addEventListener('click', function () {
          if (!this.disabled) { commands.send('mw:setWishStage', { id: item.id, stage: nextStage, previousStage: stage }, true); }
        });
        stageActions.appendChild(button);
      });
      var actions = dom.element('div', 'queue-actions');
      ['Gespielt', 'Verwerfen'].forEach(function (label, i) {
        var button = dom.element('button', i === 0 ? 'primary-button' : 'secondary-button', label);
        button.type = 'button'; button.dataset.resolve = String(item.id);
        button.dataset.outcome = i === 0 ? 'done' : 'discarded';
        button.title = i === 0 ? 'Diesen Wunsch als gespielt abschließen und Folgeplätze nachrücken lassen' : 'Diesen Wunsch verwerfen';
        button.addEventListener('click', function () { commands.send('mw:resolveRequest', { id: item.id, outcome: button.dataset.outcome }, true); });
        actions.appendChild(button);
      });
      row.appendChild(copy); row.appendChild(stageActions); row.appendChild(actions); list.appendChild(row);
    });
    if (hadFocus) { (stageFocus ? list.querySelector('[data-stage]') || dom.el('queue-heading') : dom.el('queue-heading')).focus({ preventScroll:true }); }
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    dom.setText('studio-queue-tab', 'Wünsche (' + model.current().queueTotal + ')');
    dom.el('prev-page').disabled = !!commands.pending() || !live || !model.current().user.canModerate || model.current().page <= 0;
    dom.el('next-page').disabled = !!commands.pending() || !live || !model.current().user.canModerate || model.current().page >= model.current().pages - 1;
    document.querySelectorAll('[data-resolve]').forEach(function (button) { button.disabled = !!commands.pending() || !live || !model.current().user.canModerate; });
    document.querySelectorAll('[data-stage]').forEach(function (button) {
      button.disabled = !!commands.pending() || !live || !model.current().user.canModerate ||
        (button.dataset.firstOnly === 'true' && model.current().page !== 0);
    });
  
  }
  function start() {
    dom.el('prev-page').addEventListener('click', function () { commands.send('mw:refresh', { page: model.current().page - 1 }); });
    dom.el('next-page').addEventListener('click', function () { commands.send('mw:refresh', { page: model.current().page + 1 }); });
    commands.bindRefresh('refresh-queue', 'queue-refresh-feedback');
  
    signals.on('queue-visible', acknowledgeQueue);
  }
  return { start: start, render: renderQueue, acknowledge: acknowledgeQueue, availability: availability };
});

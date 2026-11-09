/* Sichtbarer Moderationswunsch, Empfangsquittung und Erledigt-/Verwerfen-Aktionen. */
MischWerkUI.define('queue', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var reader=dependencies.reader;
  var receiptAttempts = {};
  var queueKey = null;
  function items(){var state=model.current();return Array.isArray(state.queueWindow)&&state.queueWindow.some(function(item){return state.queue[0]&&item.id===state.queue[0].id;})?state.queueWindow:state.queue;}
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
    var key = JSON.stringify([!!model.current().user.canModerate,model.current().page, model.current().user.canModerate ? items().map(function (item) {
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
    if(!model.current().user.canModerate||!model.current().queue.length)reader.clear('wish');
    if (!model.current().user.canModerate) { return; }
    if (!model.current().queue.length) { list.appendChild(dom.element('p', 'empty-copy', 'Noch keine Musikwünsche eingegangen.')); }
    items().forEach(function (item,index) {
      var row = dom.element('article', 'queue-item');
      row.setAttribute('role','listitem');
      var selected=model.current().queue[0]&&item.id===model.current().queue[0].id;
      row.classList.toggle('selected',!!selected);
      if(!selected){
        var pick=dom.element('button','request-pick');pick.type='button';
        var position=(model.current().queueStart||0)+index;
        pick.append(dom.element('span','request-number',String(position+1)),dom.element('span','request-preview',requestText(item)),dom.element('span','request-preview-sender',item.nick));
        pick.setAttribute('aria-label','Wunsch '+(position+1)+' von '+item.nick+' vollständig ansehen und bearbeiten');
        pick.dataset.position=position;
        pick.addEventListener('click',function(){commands.send('mw:refresh',{page:position});});
        row.appendChild(pick);list.appendChild(row);return;
      }
      var copy = dom.element('div', 'queue-copy');
      copy.id='queue-copy';
      var text=dom.element('h3','request-text',requestText(item));copy.appendChild(text);
      var meta=dom.element('div','queue-meta');
      meta.appendChild(dom.element('p', 'request-sender', 'Von ' + item.nick + ' · ' + dom.time(item.createdAt) + ' Uhr'));
      var stage = item.stage || 'queued';
      var status = dom.element('p', 'request-stage', stage === 'playing' ? 'Läuft gerade' : stage === 'preparing' ? 'In Vorbereitung' : 'Wartet');
      status.dataset.stageValue = stage;
      meta.appendChild(status);
      var stageActions = dom.element('div', 'queue-stage-actions');
      var stages = stage === 'queued' ? ['preparing'] : stage === 'preparing' ? ['playing', 'queued'] : ['queued'];
      stages.forEach(function (nextStage) {
        var button = dom.element('button', 'secondary-button', nextStage === 'preparing' ? 'Vorbereiten' : nextStage === 'playing' ? 'Läuft gerade' : 'Zurückstellen');
        button.type = 'button'; button.dataset.stage = nextStage;
        button.dataset.firstOnly = nextStage === 'playing' ? 'true' : 'false';
        button.title = nextStage === 'playing' ? 'Als laufend markieren – nur Platz 1' :
          nextStage === 'preparing' ? 'Wunsch vorbereiten' : 'Markierung zurücknehmen';
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
        button.title = i === 0 ? 'Als gespielt abschließen und nachrücken' : 'Wunsch verwerfen';
        button.addEventListener('click', function () { commands.send('mw:resolveRequest', { id: item.id, outcome: button.dataset.outcome }, true); });
        actions.appendChild(button);
      });
      var toolbar=dom.element('div','queue-toolbar');toolbar.id='queue-actions';toolbar.append(stageActions,actions);
      row.append(copy,meta,toolbar);list.appendChild(row);reader.set('wish',text,requestText(item),item.id);
    });
    signals.emit('studio-layout');
    if (hadFocus) { (stageFocus ? list.querySelector('[data-stage]') || dom.el('queue-heading') : dom.el('queue-heading')).focus({ preventScroll:true }); }
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    dom.el('queue-detail-toggle').hidden=!model.current().queue.length;
    dom.setText('studio-queue-tab', 'Wünsche (' + model.current().queueTotal + ')');
    dom.el('studio-queue-tab').setAttribute('aria-label', 'Musikwünsche, ' + model.current().queueTotal + ' offen');
    dom.el('prev-page').disabled = !!commands.pending() || !live || !model.current().user.canModerate || model.current().page <= 0;
    dom.el('next-page').disabled = !!commands.pending() || !live || !model.current().user.canModerate || model.current().page >= model.current().pages - 1;
    document.querySelectorAll('[data-resolve]').forEach(function (button) { button.disabled = !!commands.pending() || !live || !model.current().user.canModerate; });
    document.querySelectorAll('.request-pick').forEach(function(button){button.disabled=!!commands.pending()||!live||!model.current().user.canModerate;});
    document.querySelectorAll('[data-stage]').forEach(function (button) {
      button.disabled = !!commands.pending() || !live || !model.current().user.canModerate ||
        (button.dataset.firstOnly === 'true' && model.current().page !== 0);
    });
  
  }
  function start() {
    dom.el('studio-requests').addEventListener('focusin',function(event){
      var actions=event.target.closest('.queue-toolbar'),copy=event.target.closest('.queue-copy');
      if(!actions&&!copy)return;
      this.setAttribute('data-detail',actions?'actions':'copy');
      dom.setText('queue-detail-toggle',actions?'Wunschtext':'Aktionen');
      dom.el('queue-detail-toggle').setAttribute('aria-expanded',String(!!actions));
    });
    dom.el('queue-detail-toggle').addEventListener('click',function(){
      var panel=dom.el('studio-requests'),actions=panel.getAttribute('data-detail')!=='actions';
      panel.setAttribute('data-detail',actions?'actions':'copy');this.textContent=actions?'Wunschtext':'Aktionen';
      this.setAttribute('aria-expanded',String(actions));signals.emit('studio-readers');signals.emit('studio-layout');
    });
    dom.el('prev-page').addEventListener('click', function () { commands.send('mw:refresh', { page: model.current().page - 1 }); });
    dom.el('next-page').addEventListener('click', function () { commands.send('mw:refresh', { page: model.current().page + 1 }); });
    commands.bindRefresh('refresh-queue', 'queue-refresh-feedback');
  
    signals.on('queue-visible', acknowledgeQueue);
  }
  return { start: start, render: renderQueue, acknowledge: acknowledgeQueue, availability: availability, text:requestText };
});

/* Eine private Wunschliste: vollständige Texte, echte Absender und Empfangszeiten. */
MischWerkUI.define('queue', function (dependencies) {
  'use strict';
  var model=dependencies.model,dom=dependencies.dom,commands=dependencies.commands;
  var signals=dependencies.signals,bridge=dependencies.bridge;
  var rows=[],stamp=null,complete=null,pending=null,buffer=[],renderKey=null,attempts={},disposed=false,loadError=false;
  function requestText(item){
    return typeof item.text==='string'?item.text:
      [item.artist,item.title].filter(Boolean).join(' – ')+(item.message?' · '+item.message:'');
  }
  function sender(item){
    if(item.origin===undefined||item.origin==='knuddels')return item.nick;
    var source=item.origin==='web'?'Web':item.origin==='android'?'Android':'Extern';
    return item.displayName?item.displayName+' · '+source:source;
  }
  function allowed(){return !disposed&&model.current()&&model.current().user.canUseModeration;}
  function visible(){return allowed()&&!document.hidden&&dom.el('queue-body').getClientRects().length>0;}
  function identity(){
    var state=model.current(),positions=state.wishPositions||{};
    return JSON.stringify([state.user.nick,state.viewRevision,positions.generation,positions.revision,state.queueTotal]);
  }
  function draw(){
    var list=dom.el('request-queue'),body=dom.el('queue-body');
    var key=JSON.stringify(rows.map(function(item){return [item.id,sender(item),item.createdAt,requestText(item)];}));
    if(key===renderKey)return;
    renderKey=key;
    var scroll=body.scrollTop,old={};
    Array.from(list.children).forEach(function(node){old[node.dataset.wishId]=node;});
    var fragment=document.createDocumentFragment();
    rows.forEach(function(item){
      var row=old[item.id]||dom.element('article','queue-item');
      row.setAttribute('role','listitem');row.dataset.wishId=String(item.id);
      if(!row.firstChild){
        var meta=dom.element('div','queue-meta');
        meta.append(dom.element('span','request-sender'),dom.element('time','request-time'));
        row.append(meta,dom.element('p','request-text'));
      }
      row.querySelector('.request-sender').textContent=sender(item);
      var time=row.querySelector('.request-time'),date=new Date(item.createdAt);
      time.textContent=dom.time(item.createdAt)+' Uhr';
      if(Number.isFinite(date.getTime()))time.dateTime=date.toISOString();
      row.querySelector('.request-text').textContent=requestText(item);
      fragment.appendChild(row);
    });
    list.textContent='';list.appendChild(fragment);
    if(!rows.length)list.appendChild(dom.element('p','empty-copy','Noch keine Musikwünsche eingegangen.'));
    body.scrollTop=scroll;signals.emit('studio-layout');
  }
  function read(){
    if(!visible()||!model.connected()||pending||complete===stamp||!bridge)return;
    var positions=model.current().wishPositions;
    if(!positions||!positions.generation)return;
    pending={id:commands.nextId('queue'),at:Date.now(),stamp:stamp,offset:buffer.length};
    dom.el('queue-body').setAttribute('aria-busy','true');
    commands.send('mw:queue.read',{requestId:pending.id,generation:positions.generation,
      revision:positions.revision,offset:pending.offset});
  }
  function failed(){
    loadError=true;
    pending=null;buffer=[];dom.el('queue-body').removeAttribute('aria-busy');
    dom.el('queue-refresh-feedback').textContent='Liste nicht vollständig geladen. Bitte aktualisieren.';
    dom.el('queue-refresh-feedback').classList.add('refresh-error');
  }
  function receive(event){
    var data=event.data;
    if(!allowed()||!pending||!data||data.requestId!==pending.id||pending.stamp!==stamp||
        data.viewRevision!==model.current().viewRevision)return;
    if(data.reset){pending=null;buffer=[];commands.send('mw:refresh');return;}
    var positions=model.current().wishPositions;
    if(data.generation!==positions.generation||data.revision!==positions.revision||data.offset!==pending.offset||
        !Array.isArray(data.items)||data.next!==data.offset+data.items.length||data.total!==model.current().queueTotal||
        data.next>data.total||(data.next<data.total&&!data.items.length)){failed();return;}
    pending=null;buffer=buffer.concat(data.items);
    if(data.next<data.total){read();return;}
    rows=buffer;buffer=[];complete=stamp;
    if(loadError){
      dom.el('queue-refresh-feedback').textContent='In Eingangsreihenfolge';
      dom.el('queue-refresh-feedback').classList.remove('refresh-error');loadError=false;
    }
    dom.el('queue-body').removeAttribute('aria-busy');draw();acknowledgeQueue();
  }
  function acknowledgeQueue(){
    if(!visible()||!model.connected()||complete!==stamp||!document.documentElement.classList.contains('mw-ready'))return;
    requestAnimationFrame(function(){
      if(!visible()||complete!==stamp)return;
      var body=dom.el('queue-body'),bounds=body.getBoundingClientRect(),positions=model.current().wishPositions;
      rows.forEach(function(item){
        var node=body.querySelector('[data-wish-id="'+item.id+'"] .request-text');
        if(!node||item.delivery||(attempts[item.id]&&Date.now()-attempts[item.id]<15000))return;
        var box=node.getBoundingClientRect();
        if(box.bottom<=bounds.top||box.top>=bounds.bottom)return;
        attempts[item.id]=Date.now();
        commands.send('mw:ackRequest',{id:item.id,generation:positions.generation,revision:positions.revision});
      });
    });
  }
  function clear(){
    rows=[];buffer=[];pending=null;stamp=null;complete=null;renderKey=null;attempts={};
    loadError=false;
    dom.el('request-queue').textContent='';dom.el('queue-body').removeAttribute('aria-busy');
  }
  function renderQueue(){
    var state=model.current();dom.setText('queue-count',state.queueTotal);
    if(!allowed()){clear();return;}
    var next=identity();
    if(next!==stamp){
      var previous=stamp&&JSON.parse(stamp),current=JSON.parse(next);
      if(previous&&(previous[0]!==current[0]||previous[1]!==current[1]||previous[2]!==current[2]))clear();
      stamp=next;pending=null;buffer=[];complete=null;
      if(!state.queueTotal)rows=[];
      else if(!rows.length)rows=Array.isArray(state.queueWindow)&&state.queueWindow.length?state.queueWindow:state.queue;
      if(!state.queueTotal)complete=stamp;
      draw();
    }
    if(pending&&Date.now()-pending.at>15000)failed();
    read();
  }
  function availability(){
    if(!model.current())return;
    dom.setText('studio-queue-tab','Wünsche ('+model.current().queueTotal+')');
    dom.el('studio-queue-tab').setAttribute('aria-label','Musikwünsche, '+model.current().queueTotal+' offen');
  }
  function start(){
    commands.bindRefresh('refresh-queue','queue-refresh-feedback');
    if(bridge){
      bridge.addEventListener('mw:queue.page',receive);
      bridge.addEventListener('mw:result',function(event){
        var result=event.data;
        if(pending&&result&&result.action==='mw:queue.read'&&result.requestId===pending.id&&!result.ok)failed();
      });
    }
    dom.el('queue-body').addEventListener('scroll',acknowledgeQueue,{passive:true});
    signals.on('queue-visible',function(){read();acknowledgeQueue();});
    window.addEventListener('pagehide',function(){disposed=true;clear();});
  }
  return {start:start,render:renderQueue,acknowledge:acknowledgeQueue,availability:availability,text:requestText};
});

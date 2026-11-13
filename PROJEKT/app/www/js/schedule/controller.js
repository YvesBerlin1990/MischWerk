/* Ausgewählten Tag sofort zeigen; begrenztes Vorladen über denselben öffentlichen Wochenbestand. */
MischWerkUI.define('schedule', function (dependencies) {
  'use strict';
  var bridge=dependencies.bridge,model=dependencies.model,dom=dependencies.dom,commands=dependencies.commands;
  var signals=dependencies.signals,view=dependencies.view,cache=dependencies.cache;
  var selected='',following=true,data=null,pending=null,batch=null,timer=null,disposed=false,offline=false;
  var lastRead=0,refreshAgain=false,restoreScroll=null,restored=false,identity=null,serverAt=0,localAt=0,refreshFrame=null;
  function now() { return serverAt+Math.max(0,Date.now()-localAt); }
  function connected() { return !disposed&&!offline&&model.connected(); }
  function cancel() { clearTimeout(timer); timer=null; pending=null; batch=null; refreshAgain=false; }
  function controls() {
    var disabled=!connected();
    if(data)data=cache.present(data,now());
    dom.el('schedule-previous').disabled=disabled||!data||!data.previous;
    dom.el('schedule-next').disabled=disabled||!data||!data.next;
    dom.el('schedule-today').disabled=disabled;
    dom.el('schedule-retry').disabled=disabled||!!pending;
    dom.el('schedule-list').setAttribute('aria-busy',String(!!pending&&!data));
    view.mark();
  }
  function paint(record,initial) {
    if(!record)return;
    data=cache.present(record.data,now());
    selected=data.date;
    view.render(data,initial,restoreScroll!==null?restoreScroll:initial?record.scroll:null);
    if(dom.el('schedule-list').getClientRects().length)restoreScroll=null;
    controls();
  }
  function fail(message) {
    var visible=pending&&!pending.background;
    cancel();
    if(visible||data) view.message((data?'Letzter bestätigter Stand, derzeit nicht aktuell. ':'')+message,true);
    controls();
  }
  function packet(page) {
    clearTimeout(timer);
    pending.id=commands.nextId('day'); pending.page=page;
    timer=setTimeout(function () { fail('Keine Antwort erhalten. Bitte erneut laden.'); },15000);
    var cached=cache.get(pending.date);
    try { bridge.sendEvent('mw:schedule.day',{requestId:pending.id,date:pending.date,page:page,
      signature:page===0&&cached?cached.data.signature:null}); }
    catch(error) { fail('Die Verbindung antwortet nicht. Bitte erneut laden.'); }
    controls();
  }
  function readDate(date,background) {
    if(disposed||document.hidden||!bridge||!connected()||pending)return;
    pending={date:date,background:background,restarts:0};
    batch={entries:[],signature:null}; if(!background)lastRead=Date.now();
    if(!data&&!background)view.message('Programm wird geladen …',false);
    packet(0);
  }
  function preload() {
    if(pending||!connected()||document.hidden)return;
    var next=cache.next(now());
    if(next)readDate(next,true);
  }
  function read(force) {
    if(serverAt&&selected&&!cache.contains(selected,cache.today(now()))){select('',true);return;}
    if(pending) {
      if(pending.background)cancel();
      else { if(force)refreshAgain=true; return; }
    }
    readDate(selected,false);
  }
  function receive(event) {
    var value=event.data,job=pending;
    if(disposed||!job||!value||value.requestId!==job.id)return;
    if(!cache.validPacket(value,job.date)) { fail('Ungültige Programmdaten. Bitte erneut laden.'); return; }
    serverAt=value.serverTime;localAt=Date.now();
    if(!cache.contains(value.date,cache.today(now()))){select('',true);return;}
    if(!value.unchanged) {
      if(!Array.isArray(value.entries)||!Number.isInteger(value.page)||!Number.isInteger(value.pages)||value.pages<1) {
        fail('Ungültige Programmdaten. Bitte erneut laden.');return;
      }
      if(value.page!==job.page||(batch.signature!==null&&batch.signature!==value.signature)) {
        if(++job.restarts>2) {fail('Das Programm wird gerade geändert. Bitte erneut laden.');return;}
        batch={entries:[],signature:null};packet(0);return;
      }
      if(value.entries.some(function(entry){return !entry||typeof entry.topic!=='string'||typeof entry.nick!=='string'||
          !Number.isFinite(entry.from)||!Number.isFinite(entry.until)||entry.until<=entry.from||
          typeof entry.start!=='string'||typeof entry.end!=='string';})) {fail('Ungültige Programmdaten. Bitte erneut laden.');return;}
      batch.signature=value.signature;batch.entries=batch.entries.concat(value.entries);
      if(value.page+1<value.pages) {packet(value.page+1);return;}
      value.entries=batch.entries;
    }
    var again=refreshAgain,background=job.background;
    clearTimeout(timer);timer=null;pending=null;batch=null;refreshAgain=false;
    var record=cache.save(value);
    if(!record){fail('Der gespeicherte Programmstand fehlt. Bitte erneut laden.');return;}
    if(!selected&&!background)selected=value.date;
    if(selected===value.date)paint(record,!data||data.date!==value.date);
    controls();
    Promise.resolve().then(function(){if(disposed)return;if(again)read(true);else preload();});
  }
  function select(date,follow) {
    var today=cache.today(serverAt?now():Date.now());
    if(date&&!cache.contains(date,today)){date='';follow=true;restoreScroll=null;}
    var previous=cache.get(selected);if(previous)previous.scroll=dom.el('schedule-list').scrollTop;
    cancel();selected=date;following=follow;
    if(!date&&serverAt)selected=cache.today(now());
    var cached=cache.get(selected);
    if(serverAt)cache.window(today);
    if(cached) {
      paint(cached,true);
      if(cache.stale(cached,now())) {view.message('Letzter bestätigter Stand wird geprüft …',false);read(false);}
      else Promise.resolve().then(preload);
    } else {
      data=null;view.clear();view.date(selected,serverAt?cache.today(now()):'');read(false);
    }
    controls();
  }
  function restore(state) {
    var saved=state&&state.scheduleDay;
    if(!saved||!cache.validDate(saved.date))return;
    if(restored&&selected===saved.date&&following===(saved.followToday!==false))return;
    restoreScroll=Number.isFinite(saved.scroll)?Math.max(0,saved.scroll):null;
    if(selected!==saved.date||following!==(saved.followToday!==false))select(saved.date,saved.followToday!==false);
    else if(data)paint(cache.get(selected),false);
    restored=true;
  }
  function tick() {
    var state=model.current();
    if(state) {
      var key=JSON.stringify([state.user.nick,state.viewRevision]);
      if(identity!==null&&identity!==key){cancel();cache.clear();data=null;selected='';view.clear();}
      identity=key;
      if(state.shuttingDown){cancel();cache.clear();data=null;view.clear();view.message('Die Verbindung wird neu gestartet.',true);controls();return;}
    }
    if(serverAt) {
      var today=cache.today(now());cache.window(today);
      if(selected&&(!cache.contains(selected,today)||(following&&selected!==today)))select(today,true);
    }
    if(!connected()){if(data)view.message('Letzter bestätigter Stand, derzeit nicht aktuell. Verbindung unterbrochen.',true);controls();return;}
    if(!pending&&(!data||Date.now()-lastRead>=18000))read(false);
    controls();
  }
  function changed(event) {
    cache.invalidate(event.data&&event.data.week);
    if(refreshFrame===null)refreshFrame=requestAnimationFrame(function(){refreshFrame=null;read(true);});
  }
  function start() {
    var initial=bridge&&bridge.pageData&&bridge.pageData.scheduleInitial;
    if(initial) {
      serverAt=initial.serverTime;localAt=Date.now();cache.save(initial);selected=initial.date;paint(cache.get(selected),true);
      if(cache.stale(cache.get(selected),now()))view.message('Letzter bestätigter Stand wird geprüft …',false);
    }
    restore(bridge&&bridge.pageData&&bridge.pageData.overlayState);
    dom.el('schedule-previous').addEventListener('click',function(){if(data&&data.previous)select(data.previous,false);});
    dom.el('schedule-next').addEventListener('click',function(){if(data&&data.next)select(data.next,false);});
    dom.el('schedule-today').addEventListener('click',function(){select('',true);});
    dom.el('schedule-retry').addEventListener('click',function(){read(true);});
    if(bridge) {
      bridge.addEventListener('mw:schedule.data',receive);
      bridge.addEventListener('mw:schedule.result',function(event){if(pending&&event.data.requestId===pending.id&&event.data.ok===false)fail(event.data.message||'Programm nicht erreichbar.');});
      bridge.addEventListener('mw:schedule.changed',changed);
    }
    signals.on('snapshot',tick);signals.on('controls',controls);signals.on('overlay-restore',restore);
    signals.on('initial-layout',function(){Promise.resolve().then(function(){if(data&&restoreScroll!==null)paint(cache.get(selected),false);});});
    signals.on('overlay-capture',function(state){state.scheduleDay={date:selected,followToday:following,scroll:dom.el('schedule-list').scrollTop};});
    document.addEventListener('visibilitychange',function(){if(document.hidden)cancel();else read(true);});
    window.addEventListener('offline',function(){offline=true;fail('Verbindung unterbrochen.');});
    window.addEventListener('online',function(){offline=false;read(true);});
    window.addEventListener('pagehide',function(){disposed=true;cancel();cache.clear();if(refreshFrame!==null)cancelAnimationFrame(refreshFrame);});
  }
  return {start:start};
});

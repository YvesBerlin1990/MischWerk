/* Lokale Anzeige und Lauftext; Firebase-Freigaben ausschließlich lesen. */
MischWerkUI.define('team', function (dependencies) {
  'use strict';
  var model=dependencies.model, dom=dependencies.dom, commands=dependencies.commands, signals=dependencies.signals;
  var tickerRevision=null, displayRevision=null, tickerDirty=false, displayDirty=false, saved=null;
  function fillTicker(value) {
    dom.el('ticker-text').value=value.text;dom.el('ticker-enabled').checked=value.enabled;
    dom.el('ticker-speed').value=String(value.speed);tickerRevision=value.revision;tickerDirty=false;
  }
  function render() {
    var state=model.current(); if(!state){return;} saved=state;
    if(!tickerDirty){fillTicker(state.ticker);}
    if(!displayDirty&&state.displaySettings){
      dom.el('team-signs-enabled').checked=state.displaySettings.teamSignsEnabled;
      dom.el('microphone-enabled').checked=state.displaySettings.microphoneEnabled!==false;
      dom.el('headphones-enabled').checked=state.displaySettings.headphonesEnabled!==false;
      dom.el('announcements-enabled').checked=state.displaySettings.announcementsEnabled;
      displayRevision=state.displaySettings.revision;
    }
    renderRoster(state);availability();
  }
  function renderRoster(state) {
    var confirmed=model.rosterFresh(),list=dom.el('radio-moderator-list');list.textContent='';
    if(confirmed){state.radioModerators.forEach(function(item){list.appendChild(dom.element('div','team-member',item.nick));});}
    if(!confirmed||!state.radioModerators.length){list.appendChild(dom.element('p','empty-copy',confirmed?'Keine freigegebenen Nicks.':'Freigaben derzeit nicht bestätigt.'));}
    dom.setText('radio-moderator-count',confirmed?state.radioModeratorTotal:'?');
    dom.setText('radio-moderator-page-label',confirmed?'Seite '+(state.radioModeratorPage+1)+' / '+state.radioModeratorPages:'Stand unbekannt');
    dom.el('radio-moderator-pagination').hidden=!confirmed||state.radioModeratorPages<=1;
  }
  function availability() {
    var state=model.current(),blocked=!state||!state.user.canAdminister||!model.connected()||commands.pending();
    if(state){renderRoster(state);}
    ['display-form','ticker-form'].forEach(function(id){dom.el(id).querySelectorAll('input,textarea,select,button').forEach(function(field){field.disabled=blocked;});});
    var migration=state&&state.migration;
    dom.el('migration-start').disabled=blocked||!migration||!migration.prepared||['exported','invalidated','exporting'].includes(migration.phase);
    dom.el('migration-abort').disabled=blocked||!migration||migration.phase!=='exporting';
    dom.setText('migration-status',migration?(migration.message||'Export: '+migration.phase+' · Paket '+migration.chunkIndex):'Kein Import vorbereitet.');
    dom.el('display-save').disabled=blocked||!displayDirty||displayRevision===null;
    dom.el('ticker-save').disabled=blocked||!tickerDirty||tickerRevision===null;
    dom.el('prev-radio-moderator-page').disabled=blocked||!state||!model.rosterFresh()||state.radioModeratorPage<=0;
    dom.el('next-radio-moderator-page').disabled=blocked||!state||!model.rosterFresh()||state.radioModeratorPage>=state.radioModeratorPages-1;
  }
  function start() {
    signals.on('migration-preflight',function(value){
      var known=value&&value.ready===true,namespace=known&&typeof value.sourceNamespace==='string'?value.sourceNamespace:null;
      dom.el('migration-source').value=known?(namespace||'Quellenkennung noch nicht vorhanden'):'Vorprüfung nicht bestätigt';
      dom.setText('migration-source-info',known&&typeof value.checkedAt==='number'?'App '+value.version+' / Build '+value.buildNumber+' · '+new Date(value.checkedAt).toISOString():'Vorprüfung nicht bestätigt.');
      dom.setText('migration-counts',known?'Originalwünsche: '+value.originalCount+' · Endbelege: '+value.replayCount+' · V2-Vorgänge: '+value.outboxCount+' · Löschmarker: '+value.deletionCount:'');
    });
    dom.el('migration-start').addEventListener('click',function(){commands.send('mw:migration.start',{},true);});
    dom.el('migration-abort').addEventListener('click',function(){commands.send('mw:migration.abort',{},true);});
    ['input','change'].forEach(function(type){
      dom.el('ticker-form').addEventListener(type,function(){tickerDirty=true;availability();});
      dom.el('display-form').addEventListener(type,function(){displayDirty=true;availability();});
    });
    dom.el('ticker-form').addEventListener('submit',function(event){event.preventDefault();if(dom.el('ticker-save').disabled){return;}
      commands.send('mw:setTicker',{text:dom.el('ticker-text').value,enabled:dom.el('ticker-enabled').checked,
        speed:Number(dom.el('ticker-speed').value),direction:saved.ticker.direction,expectedTickerRevision:tickerRevision},true);
    });
    dom.el('display-form').addEventListener('submit',function(event){event.preventDefault();if(dom.el('display-save').disabled){return;}
      commands.send('mw:display.save',{teamSignsEnabled:dom.el('team-signs-enabled').checked,
        microphoneEnabled:dom.el('microphone-enabled').checked,headphonesEnabled:dom.el('headphones-enabled').checked,
        announcementsEnabled:dom.el('announcements-enabled').checked,expectedRevision:displayRevision},true);
    });
    dom.el('ticker-reload').addEventListener('click',function(){if(saved){fillTicker(saved.ticker);availability();}});
    commands.bindRefresh('refresh-radio-team','team-refresh-feedback');
    dom.el('prev-radio-moderator-page').addEventListener('click',function(){commands.send('mw:refresh',{radioModeratorPage:model.current().radioModeratorPage-1});});
    dom.el('next-radio-moderator-page').addEventListener('click',function(){commands.send('mw:refresh',{radioModeratorPage:model.current().radioModeratorPage+1});});
    signals.on('command-result',function(result){
      if(result.action==='mw:setTicker'){if(result.ok){tickerDirty=false;}dom.setText('ticker-feedback',result.message);}
      if(result.action==='mw:display.save'){if(result.ok){displayDirty=false;}dom.setText('display-feedback',result.message);}
    });
    signals.on('ticker-error',function(message){dom.setText('ticker-feedback',message);});
    signals.on('overlay-capture',function(state){state.nativeSettings={tickerDirty:tickerDirty,tickerRevision:tickerRevision,
      text:dom.el('ticker-text').value,enabled:dom.el('ticker-enabled').checked,speed:dom.el('ticker-speed').value,
      displayDirty:displayDirty,displayRevision:displayRevision,team:dom.el('team-signs-enabled').checked,microphone:dom.el('microphone-enabled').checked,headphones:dom.el('headphones-enabled').checked,announcements:dom.el('announcements-enabled').checked};});
    signals.on('overlay-restore',function(state){var draft=state.nativeSettings;if(!draft||!model.current().user.canAdminister){return;}
      if(draft.tickerDirty&&typeof draft.text==='string'&&draft.text.length<=300){tickerDirty=true;tickerRevision=draft.tickerRevision;
        dom.el('ticker-text').value=draft.text;dom.el('ticker-enabled').checked=draft.enabled===true;dom.el('ticker-speed').value=draft.speed;}
      if(draft.displayDirty){displayDirty=true;displayRevision=draft.displayRevision;dom.el('team-signs-enabled').checked=draft.team===true;dom.el('microphone-enabled').checked=typeof draft.microphone==='boolean'?draft.microphone:model.current().displaySettings.microphoneEnabled!==false;dom.el('headphones-enabled').checked=typeof draft.headphones==='boolean'?draft.headphones:model.current().displaySettings.headphonesEnabled!==false;dom.el('announcements-enabled').checked=draft.announcements===true;}availability();
    });
  }
  return {start:start,render:render,availability:availability};
});

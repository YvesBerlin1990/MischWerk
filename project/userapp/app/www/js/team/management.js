/* Lokale Anzeige und Lauftext; Firebase-Freigaben ausschließlich lesen. */
MischWerkUI.define('team', function (dependencies) {
  'use strict';
  var model=dependencies.model, dom=dependencies.dom, commands=dependencies.commands, signals=dependencies.signals;
  var tickerRevision=null, displayRevision=null, tickerDirty=false, displayDirty=false, saved=null;
  function fillTicker(value) {
    dom.el('ticker-text').value=value.text;dom.el('ticker-enabled').checked=value.enabled;
    dom.el('ticker-speed').value=String(value.speed);dom.el('ticker-font').value=value.font||'petit-formal-script';tickerRevision=value.revision;tickerDirty=false;
  }
  function render() {
    var state=model.current(); if(!state){return;}
    if(displayDirty&&saved&&saved.displaySettings&&state.displaySettings&&
      displayRevision===saved.displaySettings.revision&&state.displaySettings.revision===displayRevision+1&&
      state.displaySettings.teamSignsEnabled===saved.displaySettings.teamSignsEnabled&&
      state.displaySettings.microphoneEnabled===saved.displaySettings.microphoneEnabled&&
      state.displaySettings.headphonesEnabled===saved.displaySettings.headphonesEnabled&&
      state.displaySettings.announcementsEnabled===saved.displaySettings.announcementsEnabled){displayRevision=state.displaySettings.revision;}
    saved=state;
    if(state.displaySettings && !commands.pending('mw:display.theme')){dom.el('display-theme').value=state.displaySettings.theme||'normal';}
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
    dom.el('display-theme').disabled=blocked||!state.displaySettings;
    ['display-form','ticker-form'].forEach(function(id){dom.el(id).querySelectorAll('input,textarea,select,button').forEach(function(field){field.disabled=blocked;});});
    dom.el('display-save').disabled=blocked||!displayDirty||displayRevision===null;
    dom.el('ticker-save').disabled=blocked||!tickerDirty||tickerRevision===null;
    dom.el('prev-radio-moderator-page').disabled=blocked||!state||!model.rosterFresh()||state.radioModeratorPage<=0;
    dom.el('next-radio-moderator-page').disabled=blocked||!state||!model.rosterFresh()||state.radioModeratorPage>=state.radioModeratorPages-1;
  }
  function start() {
    dom.el('display-theme').addEventListener('change',function(){
      var current=model.current();
      if(!current||!current.displaySettings){return;}
      commands.send('mw:display.theme',{theme:this.value,expectedRevision:current.displaySettings.revision},true);
    });
    ['input','change'].forEach(function(type){
      dom.el('ticker-form').addEventListener(type,function(){tickerDirty=true;availability();});
      dom.el('display-form').addEventListener(type,function(){displayDirty=true;availability();});
    });
    dom.el('ticker-form').addEventListener('submit',function(event){event.preventDefault();if(dom.el('ticker-save').disabled){return;}
      commands.send('mw:setTicker',{text:dom.el('ticker-text').value,enabled:dom.el('ticker-enabled').checked,
        speed:Number(dom.el('ticker-speed').value),direction:saved.ticker.direction,font:dom.el('ticker-font').value,expectedTickerRevision:tickerRevision},true);
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
      if(result.action==='mw:display.theme'){dom.setText('theme-feedback',result.message);if(!result.ok&&saved){dom.el('display-theme').value=saved.displaySettings.theme||'normal';}}
    });
    signals.on('ticker-error',function(message){dom.setText('ticker-feedback',message);});
    signals.on('overlay-capture',function(state){state.nativeSettings={tickerDirty:tickerDirty,tickerRevision:tickerRevision,
      text:dom.el('ticker-text').value,enabled:dom.el('ticker-enabled').checked,speed:dom.el('ticker-speed').value,font:dom.el('ticker-font').value,
      displayDirty:displayDirty,displayRevision:displayRevision,team:dom.el('team-signs-enabled').checked,microphone:dom.el('microphone-enabled').checked,headphones:dom.el('headphones-enabled').checked,announcements:dom.el('announcements-enabled').checked};});
    signals.on('overlay-restore',function(state){var draft=state.nativeSettings;if(!draft||!model.current().user.canAdminister){return;}
      if(draft.tickerDirty&&typeof draft.text==='string'&&draft.text.length<=300){tickerDirty=true;tickerRevision=draft.tickerRevision;
        dom.el('ticker-text').value=draft.text;dom.el('ticker-enabled').checked=draft.enabled===true;dom.el('ticker-speed').value=draft.speed;if(['petit-formal-script','josefin-sans','rajdhani'].indexOf(draft.font)!==-1){dom.el('ticker-font').value=draft.font;}}
      if(draft.displayDirty){displayDirty=true;displayRevision=draft.displayRevision;dom.el('team-signs-enabled').checked=draft.team===true;dom.el('microphone-enabled').checked=typeof draft.microphone==='boolean'?draft.microphone:model.current().displaySettings.microphoneEnabled!==false;dom.el('headphones-enabled').checked=typeof draft.headphones==='boolean'?draft.headphones:model.current().displaySettings.headphonesEnabled!==false;dom.el('announcements-enabled').checked=draft.announcements===true;}availability();
    });
  }
  return {start:start,render:render,availability:availability};
});

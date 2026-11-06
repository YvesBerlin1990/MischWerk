/* Ganze Bediengruppen im vorhandenen Rahmen auf Seiten verteilen, ohne Hostaufruf. */
MischWerkUI.define('studioPages', function(dependencies){
  'use strict';
  var dom=dependencies.dom, signals=dependencies.signals, states={}, fitting=false, timer;
  function fitArea(id,pagerId){
    var area=dom.el(id), pager=dom.el(pagerId);
    if(!area.getClientRects().length)return;
    var state=states[id]||(states[id]={selected:0,pages:[],anchor:null});
    var scroll=area.scrollTop, navigating=!!state.requested;
    var focused=document.activeElement;
    var parts=Array.from(area.querySelectorAll('.studio-part')).filter(function(part){return !part.closest('form[hidden]')&&!part.hasAttribute('data-unavailable');});
    var anchor=state.requested||parts.find(function(part){return part.contains(focused);})||state.anchor;
    if(parts.indexOf(anchor)===-1)anchor=parts[0];
    state.requested=null;
    parts.forEach(function(part){part.hidden=false;});pager.hidden=true;
    var last=parts[parts.length-1];
    var bottom=last?last.getBoundingClientRect().bottom+area.scrollTop:area.getBoundingClientRect().top;
    if(id==='handover-body'){
      var back=dom.el('handover-back'),card=getComputedStyle(dom.el('handover-panel'));
      bottom+=back.getBoundingClientRect().height+parseFloat(getComputedStyle(back).marginTop)+parseFloat(card.paddingBottom)+parseFloat(card.borderBottomWidth);
    }
    signals.emit('studio-natural-height',{tab:'programme',height:bottom+parseFloat(getComputedStyle(document.querySelector('.dialog-shell')).paddingBottom)});
    var fits=area.scrollHeight<=area.clientHeight+1;
    parts.forEach(function(part){part.hidden=true;});pager.hidden=fits;
    var pages=[],current=[];
    parts.forEach(function(part){part.hidden=false;
      if(current.length&&area.scrollHeight>area.clientHeight+1){
        current.forEach(function(item){item.hidden=true;});pages.push(current);current=[];
      }
      current.push(part);
    });
    if(current.length)pages.push(current);
    state.pages=pages;
    if(anchor){var target=pages.findIndex(function(page){return page.indexOf(anchor)!==-1;});if(target!==-1)state.selected=target;}
    state.selected=Math.max(0,Math.min(state.selected,pages.length-1));
    state.anchor=anchor;
    pages.forEach(function(page,index){page.forEach(function(part){part.hidden=index!==state.selected;});});
    area.scrollTop=navigating?0:scroll;
    pager.hidden=pages.length<2;
    pager.querySelector('[data-part-previous]').disabled=state.selected===0;
    pager.querySelector('[data-part-next]').disabled=state.selected>=pages.length-1;
    pager.querySelector('[data-part-label]').textContent='Bereich '+(state.selected+1)+' / '+Math.max(1,pages.length);
  }
  function fit(){
    if(fitting)return;fitting=true;
    fitArea('studio-setup','studio-paging');fitArea('handover-body','handover-paging');
    fitting=false;signals.emit('studio-readers');signals.emit('history-layout');
  }
  function request(){cancelAnimationFrame(timer);timer=requestAnimationFrame(fit);}
  function bind(id,pagerId){var pager=dom.el(pagerId);
    [[-1,'[data-part-previous]'],[1,'[data-part-next]']].forEach(function(entry){pager.querySelector(entry[1]).addEventListener('click',function(){
      if(this.disabled)return;
      var state=states[id], target=state&&state.pages[state.selected+entry[0]];
      if(!target)return;
      state.requested=target[0];fit();
    });});
  }
  function start(){
    bind('studio-setup','studio-paging');bind('handover-body','handover-paging');
    signals.on('studio-fit',fit);signals.on('studio-selection',function(){request();});
    signals.on('controls',request);window.addEventListener('resize',request);
    if(typeof ResizeObserver==='function')new ResizeObserver(request).observe(document.querySelector('.dialog-content'));
    window.addEventListener('pagehide',function(){cancelAnimationFrame(timer);});
  }
  return {start:start};
});

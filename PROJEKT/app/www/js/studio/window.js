/* Vollständigen Inhalt vermessen; dieselbe native Moderation ohne Leerreserve verkürzen. */
MischWerkUI.define('studioWindow', function (dependencies) {
  'use strict';
  var bridge=dependencies.bridge, model=dependencies.model, signals=dependencies.signals, dom=dependencies.dom, queue=dependencies.queue;
  var maximum=0, requested=null;
  function resize(height){
    if(!isFinite(height))return;
    if(!bridge||document.hidden||!model.current()||!model.current().user.canModerate)return;
    if(!Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function(link){return !!link.sheet;}))return;
    var width=Math.ceil(innerWidth);height=Math.max(20,Math.min(maximum,Math.ceil(height)));
    var geometry=width+':'+height, first=requested===null;
    if(width<1||requested===geometry)return;
    requested=geometry;
    if(first&&height===innerHeight)return;
    try{bridge.getHostFrame().setSize(width,height);}
    catch(error){/* Begrenzte oder nicht unterstützte Hosts behalten die erreichbaren Inhaltsseiten. */}
  }
  function start(){
    if(model.view!=='studio'||!bridge)return;
    maximum=Math.max(20,Math.min(1000,innerHeight));
    document.documentElement.classList.toggle('studio-height-limited',maximum<=550);
    signals.on('studio-natural-height',function(measurement){
      if(document.documentElement.getAttribute('data-studio-tab')===measurement.tab)resize(measurement.height);
    });
    signals.on('studio-fit',measureQueue);
  }
  function measureQueue(){
    var panel=dom.el('studio-requests'),list=dom.el('request-queue');
    if(!panel.getClientRects().length||!model.current()||!model.current().user.canModerate)return;
    if(list.querySelector('.request-text')&&!model.current().queue[0])return;
    panel.classList.add('studio-window-measure');
    var text=list.querySelector('.request-text'),copy=list.querySelector('.queue-copy'),saved=text&&text.textContent;
    if(text)text.textContent=queue.text(model.current().queue[0]);
    var natural=0;
    Array.from(list.children).forEach(function(row){natural+=row.getBoundingClientRect().height;});
    if(text){
      var full=text.scrollHeight;
      natural+=Math.min(120,full)+(full>120?50:0)-copy.getBoundingClientRect().height;
    }
    var pager=dom.el('queue-pagination');
    var bottom=pager.getClientRects().length?pager.getBoundingClientRect().bottom:list.getBoundingClientRect().bottom;
    var height=bottom+parseFloat(getComputedStyle(document.querySelector('.dialog-shell')).paddingBottom)+natural-list.getBoundingClientRect().height;
    if(text)text.textContent=saved;
    panel.classList.remove('studio-window-measure');
    panel.classList.toggle('studio-queue-tight',height>innerHeight+1);resize(height);
  }
  return {start:start};
});

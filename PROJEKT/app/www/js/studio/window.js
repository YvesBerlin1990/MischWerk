/* Scrollfreie Bediengruppen; knappe Hosts blättern innerhalb desselben Menüs. */
MischWerkUI.define('studioWindow',function(dependencies){
  'use strict';
  var model=dependencies.model,signals=dependencies.signals,dom=dependencies.dom,bridge=dependencies.bridge;
  var areas=[],fitting=false,originalHeight=0,requested=null,sized=false,frameRequest=null,disposed=false;
  function create(id,selector,pagerId,label){
    var area={node:dom.el(id),selector:selector,index:0,pages:[],anchor:null};
    var nav=dom.element('nav','studio-pagination');nav.id=pagerId;nav.hidden=true;nav.setAttribute('aria-label',label);
    area.previous=dom.element('button','secondary-button','Zurück');area.previous.type='button';
    area.label=dom.element('span','');area.label.setAttribute('role','status');
    area.next=dom.element('button','secondary-button','Weiter');area.next.type='button';
    nav.append(area.previous,area.label,area.next);area.node.after(nav);area.nav=nav;
    function move(offset){area.index+=offset;select(area);signals.emit('studio-readers');signals.emit('queue-visible');}
    area.previous.addEventListener('click',function(){move(-1);});area.next.addEventListener('click',function(){move(1);});
    areas.push(area);
  }
  function select(area){
    area.index=Math.max(0,Math.min(area.index,area.pages.length-1));
    var visible=area.pages[area.index]||[];
    area.groups.forEach(function(group){group.toggleAttribute('data-page-hidden',visible.indexOf(group)===-1);group.classList.remove('page-first');});
    if(visible.length){visible[0].classList.add('page-first');area.anchor=visible[0];}
    area.label.textContent='Seite '+(area.index+1)+' / '+area.pages.length;
    area.previous.disabled=area.index===0;area.next.disabled=area.index>=area.pages.length-1;
  }
  function height(node){var style=getComputedStyle(node);return node.getBoundingClientRect().height+parseFloat(style.marginTop)+parseFloat(style.marginBottom);}
  function fitArea(area){
    if(!area.node.getClientRects().length)return;
    var focus=document.activeElement;
    area.groups=Array.from(area.node.querySelectorAll(area.selector));
    area.groups.forEach(function(group){group.removeAttribute('data-page-hidden');group.classList.remove('page-first');});
    area.nav.hidden=true;
    var groups=area.groups.filter(function(group){return group.getClientRects().length&&height(group)>0;});
    var budget=area.node.clientHeight;
    function total(){return groups.reduce(function(sum,group){return sum+height(group);},0);}
    area.natural=total();
    if(area.natural>budget){area.nav.hidden=false;budget=area.node.clientHeight;}
    var pages=[[]],used=0;
    groups.forEach(function(group){
      var size=height(group);
      if(used&&used+size>budget+1){pages.push([]);used=0;}
      pages[pages.length-1].push(group);used+=size;
    });
    area.pages=pages;
    // Bei Größenänderung oder Push die gewählte Bediengruppe und ihren Fokus erhalten.
    var anchor=groups.find(function(group){return group.contains(focus);})||area.anchor;
    var position=pages.findIndex(function(page){return page.indexOf(anchor)!==-1;});
    if(position!==-1)area.index=position;
    select(area);
  }
  function fitWindow(){
    frameRequest=null;
    if(disposed||document.hidden||!bridge||!model.current()||!model.current().user.canModerate)return;
    var queue=dom.el('studio-requests'),target=originalHeight;
    if(!queue.hidden){
      var shell=document.querySelector('.dialog-shell'),body=dom.el('queue-body');
      var chrome=shell.getBoundingClientRect().height-queue.getBoundingClientRect().height;
      var padding=getComputedStyle(body);
      // Die vollständige Liste messen, ohne die Scrollfläche oder laufende Tastaturnavigation zu verändern.
      target=Math.ceil(chrome+queue.getBoundingClientRect().height-body.getBoundingClientRect().height+
        dom.el('request-queue').getBoundingClientRect().height+parseFloat(padding.paddingTop)+parseFloat(padding.paddingBottom)+8);
      target=Math.max(320,Math.min(580,target));
    }else if(!sized)return;
    var width=Math.ceil(innerWidth),key=width+':'+target;
    if(width<1||!Number.isFinite(target)||requested===key)return;
    requested=key;
    if(target===innerHeight)return;
    sized=true;
    try{bridge.getHostFrame().setSize(width,target);}catch(ignored){/* Liste und Bereichsseiten bleiben im begrenzten Host bedienbar. */}
  }
  function fit(){
    if(disposed||fitting||document.hidden||!model.current()||!model.current().user.canModerate)return;
    if(!Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function(link){return !!link.sheet;}))return;
    if(document.fonts&&document.fonts.status==='loading')return;
    fitting=true;
    try{areas.forEach(fitArea);signals.emit('studio-readers');
      if(frameRequest===null)frameRequest=requestAnimationFrame(fitWindow);
    }finally{fitting=false;}
  }
  function start(){
    if(model.view!=='studio')return;
    originalHeight=Math.max(320,Math.min(1000,innerHeight));
    create('studio-setup','.studio-section','studio-paging','Weitere Sendungsbereiche');
    create('handover-body','.handover-group','handover-paging','Weitere Übergabebereiche');
    signals.on('studio-fit',fit);signals.on('initial-layout',fit);
    window.addEventListener('pagehide',function(){disposed=true;if(frameRequest!==null)cancelAnimationFrame(frameRequest);});
  }
  return {start:start};
});

/* Vollständige schreibgeschützte Texte in der verfügbaren Fläche, mit eigenen Textseiten. */
MischWerkUI.define('studioReader',function(dependencies){
  'use strict';
  var dom=dependencies.dom, signals=dependencies.signals, readers={}, fitting=false;
  function select(reader){
    reader.index=Math.max(0,Math.min(reader.index,reader.pages.length-1));
    reader.node.textContent=reader.pages[reader.index]||'';
    reader.label.textContent='Text '+(reader.index+1)+' / '+reader.pages.length;
    reader.previous.disabled=reader.index===0;reader.next.disabled=reader.index>=reader.pages.length-1;
  }
  function fitReader(reader){
    var node=reader.node;if(!node.isConnected||!node.getClientRects().length||node.clientHeight<1)return;
    var key=[reader.text,node.clientWidth,node.clientHeight,reader.nav.hidden].join('|');
    if(key===reader.key)return;
    reader.nav.hidden=true;node.textContent=reader.text;
    if(node.scrollHeight<=node.clientHeight+1){reader.pages=[reader.text];reader.index=0;reader.key=key;return;}
    reader.nav.hidden=false;
    var letters=Array.from(reader.text),offset=0,pages=[];
    while(offset<letters.length){var low=1,high=letters.length-offset;
      while(low<high){var middle=Math.ceil((low+high)/2);node.textContent=letters.slice(offset,offset+middle).join('');
        if(node.scrollHeight<=node.clientHeight+1)low=middle;else high=middle-1;
      }
      pages.push(letters.slice(offset,offset+low).join(''));offset+=low;
    }
    reader.pages=pages.length?pages:[''];select(reader);
    reader.key=[reader.text,node.clientWidth,node.clientHeight,reader.nav.hidden].join('|');
  }
  function fit(){if(fitting)return;fitting=true;Object.keys(readers).forEach(function(id){fitReader(readers[id]);});fitting=false;}
  function set(id,node,text,key){
    text=String(text||'');var previous=readers[id];
    if(previous&&previous.node===node&&previous.text===text&&previous.identity===key)return;
    var reader={node:node,text:text,identity:key,index:previous&&previous.identity===key&&previous.text===text?previous.index:0,pages:[text]};
    if(previous&&previous.nav.isConnected)previous.nav.remove();
    var nav=dom.element('nav','text-pagination');nav.setAttribute('aria-label','Abschnitte des vollständigen Texts');nav.hidden=true;
    reader.previous=dom.element('button','secondary-button','←');reader.previous.type='button';reader.previous.setAttribute('aria-label','Vorheriger Textabschnitt');
    reader.label=dom.element('span','');reader.label.setAttribute('role','status');
    reader.next=dom.element('button','secondary-button','→');reader.next.type='button';reader.next.setAttribute('aria-label','Nächster Textabschnitt');
    nav.append(reader.previous,reader.label,reader.next);node.after(nav);reader.nav=nav;
    reader.previous.addEventListener('click',function(){reader.index-=1;select(reader);});
    reader.next.addEventListener('click',function(){reader.index+=1;select(reader);});
    node.classList.add('paged-text');readers[id]=reader;node.textContent=text;fitReader(reader);
  }
  function start(){signals.on('studio-readers',fit);signals.on('initial-layout',fit);}
  function clear(id){var reader=readers[id];if(!reader)return;reader.node.textContent='';reader.nav.remove();delete readers[id];}
  return {start:start,set:set,clear:clear};
});

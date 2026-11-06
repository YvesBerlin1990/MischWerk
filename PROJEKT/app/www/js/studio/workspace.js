/* Berechtigte Arbeitsreiter mit eigener Tastatur- und Entwurfsauswahl. */
MischWerkUI.define('studioWorkspace', function (dependencies) {
  'use strict';
  var model=dependencies.model, dom=dependencies.dom, signals=dependencies.signals;
  var tabs=['programme','queue','history','ticker'], selected='programme';
  var buttons=['studio-programme-tab','studio-queue-tab','studio-history-tab','studio-ticker-tab'];
  var panels=['studio-programme','studio-requests','history-panel','studio-ticker-panel'];
  function permitted(){return !!(model.current()&&model.current().user.canModerate);}
  function show(value, focus){
    selected=tabs.indexOf(value)!==-1?value:'programme';
    var allowed=permitted();
    dom.el('studio-programme-tabs').hidden=!allowed;
    tabs.forEach(function(tab,index){var active=allowed&&tab===selected, button=dom.el(buttons[index]);
      dom.el(panels[index]).hidden=!active;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    document.documentElement.setAttribute('data-studio-tab',allowed?selected:'');
    document.documentElement.classList.toggle('history-open',allowed&&selected==='history');
    signals.emit('studio-selection',{tab:allowed?selected:null});
    signals.emit('studio-layout');signals.emit('queue-visible');
    if(focus&&allowed)dom.el(buttons[tabs.indexOf(selected)]).focus({preventScroll:true});
  }
  function restore(state){
    if(!permitted())return;
    show(state.studioTab||(state.studioHistory?'history':state.studio&&state.studio.queue?'queue':'programme'));
  }
  function start(){
    buttons.forEach(function(id,index){var button=dom.el(id);
      button.addEventListener('click',function(){if(permitted())show(tabs[index]);});
      button.addEventListener('keydown',function(event){
        if(['ArrowLeft','ArrowRight','Home','End'].indexOf(event.key)===-1)return;
        event.preventDefault();var next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
        show(tabs[next],true);
      });
    });
    signals.on('overlay-capture',function(state){if(model.view==='studio'&&permitted())state.studioTab=selected;});
    signals.on('overlay-restore',function(state){if(model.view==='studio')restore(state);});
    signals.on('snapshot',function(){if(!permitted())selected='programme';show(selected);});
  }
  return {start:start};
});

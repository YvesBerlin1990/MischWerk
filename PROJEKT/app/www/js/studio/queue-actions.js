/* Native Wunschregie verwendet die bestehenden bestätigten Channelaktionen. */
MischWerkUI.define('queueActions', function (dependencies) {
  'use strict';
  var model=dependencies.model,dom=dependencies.dom,commands=dependencies.commands,signals=dependencies.signals;
  var rows=[],ready=false,discard=null;
  var stages={queued:'Wartet',preparing:'In Vorbereitung',playing:'Als laufend markiert'};
  var actions=[['prepare','Vorbereiten'],['play','Als laufend markieren'],['reset','Zurückstellen'],
    ['done','Erledigt'],['discard','Verwerfen'],['cancel','Abbrechen']];
  function usable(){return ready&&model.current()&&model.current().user.canUseModeration&&model.connected()&&!commands.pending();}
  function render(row,item,index){
    var stage=item.stage||'queued',group=row.querySelector('.request-actions');
    if(!group){
      row.appendChild(dom.element('p','request-stage'));
      group=dom.element('div','request-actions');group.setAttribute('role','group');
      group.setAttribute('aria-label','Wunsch bearbeiten');
      actions.forEach(function(action){
        var button=dom.element('button','secondary-button',action[1]);
        button.type='button';button.dataset.queueAction=action[0];group.appendChild(button);
      });
      row.appendChild(group);
    }
    row.querySelector('.request-stage').textContent='Platz '+(index+1)+' · '+stages[stage];
    actions.forEach(function(action){
      var name=action[0],button=group.querySelector('[data-queue-action="'+name+'"]');
      button.hidden=name==='prepare'?stage!=='queued':name==='play'?stage!=='preparing'||index!==0:
        name==='reset'?stage==='queued':name==='cancel'?discard!==item.id:false;
      button.disabled=!usable();
      if(name==='discard')button.textContent=discard===item.id?'Wirklich verwerfen?':'Verwerfen';
    });
  }
  function sync(){
    rows.forEach(function(item,index){
      var row=dom.el('request-queue').querySelector('[data-wish-id="'+item.id+'"]');
      if(row)render(row,item,index);
    });
  }
  function update(items,confirmed){
    rows=items;ready=confirmed;
    if(!rows.some(function(item){return item.id===discard;}))discard=null;
    sync();
  }
  function start(){
    dom.el('request-queue').addEventListener('click',function(event){
      var button=event.target.closest('[data-queue-action]');
      if(!button||button.disabled||!usable())return;
      var row=button.closest('[data-wish-id]'),item=rows.filter(function(entry){return String(entry.id)===row.dataset.wishId;})[0];
      if(!item)return;
      var action=button.dataset.queueAction;
      if(action==='cancel'||(action==='discard'&&discard!==item.id)){
        discard=action==='cancel'?null:item.id;sync();signals.emit('studio-layout');return;
      }
      discard=null;
      if(action==='done'||action==='discard')commands.send('mw:resolveRequest',{id:item.id,outcome:action==='done'?'done':'discarded'},true);
      else commands.send('mw:setWishStage',{id:item.id,stage:{prepare:'preparing',play:'playing',reset:'queued'}[action],previousStage:item.stage||'queued'},true);
      sync();
    });
    signals.on('controls',sync);
    window.addEventListener('pagehide',function(){update([],false);discard=null;});
  }
  return {start:start,update:update};
});

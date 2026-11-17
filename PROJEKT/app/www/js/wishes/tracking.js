/* Eigene Wunschposition aus dem vorhandenen authentifizierten Snapshot; kein weiterer Abruf. */
MischWerkUI.define('wishTracking', function (dependencies) {
  'use strict';
  var model=dependencies.model, dom=dependencies.dom, signals=dependencies.signals;
  var hadOpen=false, lastKey=null;
  function render() {
    var state=model.current();
    if (!state) { return; }
    var p=state.wishPositions, live=model.connected(), available=!!p&&p.available===true;
    var total=available&&Number.isInteger(p.total)&&p.total>0?p.total:0;
    var feedback=dom.el('wish-feedback');
    var accepted=feedback.getAttribute('data-accepted')==='true'||(!feedback.hidden&&feedback.classList.contains('success'));
    var next=p&&p.nextItem;
    if (!next||next.position!==p.nextPosition) {
      next=p&&Array.isArray(p.items)?p.items.filter(function(item){return item.position===p.nextPosition;})[0]:null;
    }
    var valid=live&&model.positionsFresh()&&available&&total>0&&Number.isInteger(p.nextPosition)&&p.nextPosition>0&&!!next;
    var stage=valid&&['queued','received','preparing','playing'].indexOf(next.stage)!==-1?next.stage:'unknown';
    var key=JSON.stringify([live,available,total,p&&p.nextPosition,next&&next.text,stage,accepted,model.positionsFresh(),p&&p.lastOutcome]);
    if (lastKey===key) { return; } lastKey=key;
    var panel=dom.el('wish-tracking'), visible=total>0||accepted||hadOpen;
    if (!visible&&panel.contains(document.activeElement)) { dom.el('wish-text').focus({preventScroll:true}); }
    panel.hidden=!visible;panel.classList.toggle('is-accepted',accepted);
    if (!visible) { return; }
    if (total>0) { hadOpen=true; }
    var empty=live&&available&&model.positionsFresh()&&total===0&&hadOpen;
    var played=empty&&model.positionsFresh()&&p.lastOutcome==='played';
    dom.setText('wish-tracking-title', played?'Dein Wunsch wurde gespielt':empty?'Dein Wunsch ist nicht mehr offen':accepted?'Dein Wunsch ist dabei!':total>1?'Dein nächster Wunsch':'Dein Wunsch im Blick');
    dom.setText('wish-tracking-song', total&&next&&typeof next.text==='string'?next.text:'');
    dom.el('wish-tracking-song').hidden=!total||!next;
    dom.setText('wish-tracking-rank', valid?'Platz '+p.nextPosition:'');
    dom.el('wish-tracking-rank').hidden=!valid;
    dom.setText('wish-tracking-stage', played?'Die Moderation hat deinen Wunsch als gespielt bestätigt.':empty?'Die Moderation hat ihn abgeschlossen oder aus der Liste genommen.':!valid?'Status wird aktualisiert …':stage==='playing'||stage==='preparing'?'In Vorbereitung':stage==='received'?'Angenommen':stage==='queued'?'Wartet auf Annahme':'Status wird aktualisiert …');
    dom.setText('wish-tracking-more', total>1?'Du hast '+total+' offene Wünsche. Hier siehst du deinen nächsten.':'');
    dom.el('wish-tracking-more').hidden=total<=1;
    var steps=dom.el('wish-tracking-steps'), index=played?2:stage==='playing'||stage==='preparing'?1:stage==='received'?0:-1;
    steps.hidden=(!valid&&!played)||index<0;
    Array.from(steps.children).forEach(function(step,i){
      step.classList.toggle('is-current',i===index);step.classList.toggle('is-done',i<index);
      if(i===index){step.setAttribute('aria-current','step');}else{step.removeAttribute('aria-current');}
    });
  }
  return {start:function(){
    if(model.view!=='wishes'){return;}
    signals.on('snapshot',render);signals.on('controls',render);signals.on('wish-presentation',render);
    render();
  }};
});

/* Sendung ohne Zeitlimit, Wunschregie und private Übergabe im verifizierten Arbeitsbereich. */
(function(){'use strict';var W=window.MischWerkWorkspace,$=W.el,topicBase=null,topicDirty=false,handoverKey=null;
 function subtab(name){W.studioTab=name;['programme','wishes','history'].forEach(function(tab){$(tab+'-panel').hidden=tab!==name;});document.querySelectorAll('[data-studio]').forEach(function(button){button.setAttribute('aria-current',button.dataset.studio===name?'page':'false');});draw(W.state);document.dispatchEvent(new Event('workspace:view'));}
 function draw(state){if(!state){topicBase=null;topicDirty=false;handoverKey=null;return;}if(W.view!=='studio')return;
  $('studio-presenter').textContent=state.moderator?state.moderator.nick+' ist am Mikrofon.':'MischWerk am Pult';
  $('studio-login').hidden=state.user.isOnAir;$('studio-login').disabled=!!state.moderator;$('studio-offair').hidden=!state.user.canEndModeration;
  if(!topicDirty){$('topic').value=state.topic;topicBase=state.topic;}
  $('wishes-availability').textContent=state.requestsEnabled?'Musikwünsche sind erlaubt.':'Die Wunschbox ist geschlossen.';$('wishes-toggle').setAttribute('aria-checked',String(state.requestsEnabled));
  var hand=state.handover,selected=$('handover-target').value;$('handover-target').replaceChildren();hand.candidates.forEach(function(nick){var option=W.node('option',nick);option.value=nick;$('handover-target').append(option);});if(hand.candidates.includes(selected))$('handover-target').value=selected;
  $('handover-form').hidden=!state.user.isOnAir||!!hand.outgoing||!hand.candidates.length;$('handover-incoming').hidden=!hand.incoming;$('handover-cancel').hidden=!hand.outgoing;
  $('handover-status').textContent=hand.incoming?'Übergabe von '+hand.incoming.nick:hand.outgoing?'Wartet auf '+hand.outgoing.nick:state.user.isOnAir&&!hand.candidates.length?'Gerade ist keine weitere Moderation im Channel.':'Die nächste Moderation bestätigt die Übernahme selbst.';
  $('handover-private-note').textContent=hand.incoming?.notes||'';$('handover-received').textContent=hand.receivedNotes?'Übernommene private Notiz: '+hand.receivedNotes:'';
  var item=state.queue[0];$('queue-heading').textContent='Musikwünsche · '+state.queueTotal;$('queue-text').textContent=item?item.text:'Keine offenen Musikwünsche.';
  $('queue-position').textContent=item?'Platz '+(state.page+1)+' · '+({queued:'Wartet',preparing:'In Vorbereitung',playing:'Läuft gerade'}[item.stage]||'Wartet'):'';
  $('queue-sender').textContent=item?item.nick+(item.delivery?' · Empfang bestätigt':''):'';$('queue-actions').hidden=!item;$('queue-previous').disabled=!state.page;$('queue-next').disabled=state.page+1>=state.pages;
  if(item&&!item.delivery&&W.studioTab==='wishes'&&!document.hidden&&$('wishes-panel').getClientRects().length)W.act('mw:ackRequest',{id:item.id});
 }
 document.querySelectorAll('[data-studio]').forEach(function(button){button.addEventListener('click',function(){subtab(button.dataset.studio);});});
 $('studio-login').addEventListener('click',function(){W.act('mw:onAir',{expectedModerator:W.state.moderator?.sessionKey||null});});
 $('studio-offair').addEventListener('click',function(){W.act('mw:offAir',{expectedModerator:W.state.moderator?.sessionKey||null});});
 $('topic').addEventListener('input',function(){topicDirty=true;});$('topic-form').addEventListener('submit',async function(event){event.preventDefault();if(await W.act('mw:setTopic',{topic:$('topic').value,previousTopic:topicBase})){topicDirty=false;draw(W.state);}});
 $('topic-reset').addEventListener('click',function(){topicDirty=false;draw(W.state);});$('wishes-toggle').addEventListener('click',function(){W.act('mw:setRequests',{enabled:!W.state.requestsEnabled,previousEnabled:W.state.requestsEnabled});});
 $('handover-form').addEventListener('input',function(){if(!handoverKey)handoverKey=W.state.moderator?.sessionKey;});$('handover-form').addEventListener('submit',async function(event){event.preventDefault();if(await W.act('mw:handover.request',{nick:$('handover-target').value,notes:$('handover-notes').value,expectedModerator:handoverKey||W.state.moderator?.sessionKey})){handoverKey=null;$('handover-notes').value='';}});
 ['accept','decline','cancel'].forEach(function(action){$('handover-'+action).addEventListener('click',function(){var hand=W.state.handover,entry=action==='cancel'?hand.outgoing:hand.incoming;if(entry)W.act('mw:handover.'+action,{id:entry.id,topic:$('handover-topic').value});});});
 $('queue-previous').addEventListener('click',function(){W.changeOptions({page:W.state.page-1});});$('queue-next').addEventListener('click',function(){W.changeOptions({page:W.state.page+1});});
 document.querySelectorAll('[data-stage],[data-outcome]').forEach(function(button){button.addEventListener('click',function(){var item=W.state.queue[0];if(!item)return;W.act(button.dataset.stage?'mw:setWishStage':'mw:resolveRequest',button.dataset.stage?{id:item.id,stage:button.dataset.stage,previousStage:item.stage}:{id:item.id,outcome:button.dataset.outcome});});});
 W.onState(draw);
})();

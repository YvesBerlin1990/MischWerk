/* Wochenplan und revisionsgebundener Editor nutzen dieselben Kalenderdaten wie die App. */
(function(){'use strict';var W=window.MischWerkWorkspace,$=W.el,C=W.factories.scheduleCalendar(),base=null,dirty=false,editing=null,deleteConfirmation=null;
 function clearDelete(){deleteConfirmation=null;delete $('plan-delete').dataset.confirm;$('plan-delete').textContent='Eintrag löschen';}
 function fields(){var auto=$('plan-kind').value==='autodj',timing=$('plan-timing').value;$('plan-nick').disabled=auto;$('plan-nick').required=!auto;if(auto)$('plan-nick').value='MischWerk';
  $('plan-start-label').hidden=timing==='allDay';$('plan-start').disabled=timing==='allDay';$('plan-start').required=timing!=='allDay';$('plan-end-label').hidden=timing!=='fixed';$('plan-end').disabled=timing!=='fixed';$('plan-end').required=timing==='fixed';}
 function reset(){clearDelete();var plan=W.state.schedule;editing=null;dirty=false;base={week:plan.week,revision:plan.revision};$('plan-editor-title').textContent='Sendung eintragen';$('plan-form').reset();$('plan-date').value=plan.today>plan.week&&plan.today<=C.shift(plan.week,6)?plan.today:plan.week;$('plan-nick').value=W.state.user.nick;$('plan-delete').hidden=true;fields();}
 function edit(entry){clearDelete();editing={id:entry.id,week:entry.week||W.state.schedule.week};base={week:W.state.schedule.week,revision:W.state.schedule.revision};dirty=true;
  ['date','kind','timing','nick','start','end','topic'].forEach(function(key){$('plan-'+key).value=entry[key]||'';});$('plan-editor-title').textContent='Sendung bearbeiten';$('plan-delete').hidden=false;fields();$('plan-editor-title').scrollIntoView({block:'start'});}
 function draw(state){if(!state){clearDelete();base=null;dirty=false;editing=null;return;}if(W.view!=='schedule'||!state.schedule){clearDelete();return;}var plan=state.schedule;
  if(deleteConfirmation&&(!plan.canManage||plan.week!==base.week||plan.revision!==base.revision))clearDelete();
  $('plan-range').textContent=C.range(plan.week);$('plan-form').hidden=!plan.canManage;$('plan-list').replaceChildren();
  plan.days.forEach(function(day){var section=W.node('article');section.className='plan-day'+(day===plan.today?' is-today':'');section.append(W.node('h3',C.day(day)));
   C.slots(plan.entries,day).forEach(function(slot){var row=W.node('div');row.className='plan-slot';var entry=slot.entry,open=entry?.timing==='openEnd'&&entry.date===day;
    row.append(W.node('time',slot.from===0&&slot.to===1440&&!open?'Ganztags':C.time(slot.from)+' – '+(open?'Open End':C.time(slot.to))));
    var info=W.node('div');info.append(W.node('p',entry?.topic||'MischWerk am Pult'),W.node('small',entry?(entry.kind==='autodj'?'AutoDJ (MischWerk)':entry.nick):'AutoDJ (MischWerk)'));row.append(info);
    if(plan.canManage&&entry&&(!entry.week||entry.week===plan.week)){var button=W.node('button','Bearbeiten');button.className='small-button';button.addEventListener('click',function(){edit(entry);});row.append(button);}section.append(row);
   });$('plan-list').append(section);
  });if(plan.canManage&&!dirty)reset();
 }
 function switchWeek(value){clearDelete();dirty=false;editing=null;base=null;W.changeOptions({week:value});}
 $('plan-previous').addEventListener('click',function(){switchWeek(C.shift(W.state.schedule.week,-7));});$('plan-next').addEventListener('click',function(){switchWeek(C.shift(W.state.schedule.week,7));});$('plan-today').addEventListener('click',function(){switchWeek(C.week(W.state.schedule.today));});
 $('plan-form').addEventListener('input',function(){clearDelete();dirty=true;});$('plan-kind').addEventListener('change',function(){if($('plan-kind').value==='live'&&$('plan-nick').value==='MischWerk')$('plan-nick').value=W.state.user.nick;fields();});$('plan-timing').addEventListener('change',fields);
 $('plan-date').addEventListener('change',async function(){if(editing)return;var week=C.week($('plan-date').value);if(!week)return;if(week!==base?.week){base={week:week,revision:null};await W.changeOptions({week:week});if(W.state.schedule.week===week)base.revision=W.state.schedule.revision;}});
 $('plan-new').addEventListener('click',reset);
 $('plan-form').addEventListener('submit',async function(event){event.preventDefault();if(!base||base.revision===null){W.message('Bitte die Zielwoche zuerst laden.',true);return;}var data={week:base.week,expectedRevision:base.revision};['date','kind','timing','nick','start','end','topic'].forEach(function(key){data[key]=$('plan-'+key).value;});if(editing)data.id=editing.id;
  if(await W.act('mw:schedule.save',data)){dirty=false;editing=null;reset();await W.load();}
 });
 $('plan-delete').addEventListener('click',async function(){if(!editing||!base)return;var key=JSON.stringify([editing.week,editing.id,base.revision]);if(deleteConfirmation!==key){deleteConfirmation=key;this.dataset.confirm='yes';this.textContent='Löschen bestätigen';return;}if(await W.act('mw:schedule.delete',{week:base.week,expectedRevision:base.revision,id:editing.id})){dirty=false;editing=null;reset();}});
 W.onState(draw);
})();

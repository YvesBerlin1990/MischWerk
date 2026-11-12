const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
let sequence = 0;

test('Automatische Anmeldungen erscheinen für Hörer erst ab genau fünf Minuten und bleiben für den Inhaber sichtbar', () => {
  const f=fixture();f.h.advance(Date.parse('2026-11-07T15:40:00Z')-f.h.now());
  const selected=currentWeek(f.h);f.h.event(f.owner,f.radio,'mw:onAir', {});
  const own=read(f,selected);assert.equal(own.entries.length,1);assert.equal(own.entries[0].shortBroadcast,true);
  assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,0);
  f.h.advance(299999);assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,0);
  f.h.advance(1);assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,1);
  f.h.event(f.owner,f.radio,'mw:offAir');
  assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,1);
  assert.equal(read(f,selected).entries[0].actualStart,Date.parse('2026-11-07T15:40:00Z'));
});

test('Kurze abgeschlossene automatische Einträge bleiben privat löschbar; manuelle Kurzsendungen bleiben öffentlich', () => {
  const f=fixture(),selected=currentWeek(f.h);f.h.event(f.owner,f.radio,'mw:onAir', {});f.h.advance(1000);f.h.event(f.owner,f.radio,'mw:offAir');
  const own=read(f,selected),entry=own.entries[0];assert.equal(entry.shortBroadcast,true);
  assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,0);
  const forged=event(f,'mw:schedule.delete',{week:selected,id:entry.id,expectedRevision:own.revision},f.listener,f.listenerRadio);
  assert.equal(forged.find(e=>e.type==='mw:schedule.result').data.ok,false);
  const removed=event(f,'mw:schedule.delete',{week:selected,id:entry.id,expectedRevision:own.revision});
  assert.equal(removed.find(e=>e.type==='mw:schedule.result').data.ok,true);
  const h=createHarness(f.h.store),owner=h.user(1,'Otterchen','owner'),session=h.open(owner);
  assert.equal(read({h,owner,session},selected).total,0);
  assert.equal(save(f,{start:'18:00',end:'18:01',topic:'Geplant, eine Minute'}).ok,true);
  assert.equal(read(f,week,0,f.listener,f.listenerRadio).total,1);
});

test('Nachträge dürfen tatsächliche automatische Studiozeiten nicht überdecken; Anschluss nach der Abmeldung ist erlaubt', () => {
  const f=fixture();f.h.advance(Date.parse('2026-11-07T15:00:00Z')-f.h.now());
  const selected=currentWeek(f.h),date='2026-11-07';
  f.h.event(f.owner,f.radio,'mw:onAir', {});f.h.advance(10*60000);f.h.event(f.owner,f.radio,'mw:offAir');
  for(const timing of ['fixed','openEnd']){
    const result=save(f,{week:selected,date,timing,start:'16:05',end:timing==='fixed'?'16:08':''});
    assert.equal(result.ok,false,'Die tatsächliche Zeit von 16:00 bis 16:10 bleibt belegt');
    assert.match(result.message,/überschneidet/);
  }
  assert.equal(save(f,{week:selected,date,start:'16:10',end:'16:20'}).ok,true);
  assert.equal(read(f,selected).total,2);
});

test('Planung weist bei der Sommerzeitumstellung entfallende Anfangs- und Endzeiten ab', () => {
  for(const values of [
    {date:'2027-03-28',start:'02:10',end:'03:30'},
    {date:'2027-03-28',start:'01:30',end:'02:30'},
    {date:'2027-03-27',start:'23:00',end:'02:30'},
    {date:'2027-03-28',start:'02:30',timing:'openEnd',end:''}
  ]){
    const result=save(fixture(),{week:'2027-03-22',...values});
    assert.equal(result.ok,false,JSON.stringify(values));assert.match(result.message,/Zeitumstellung/);
  }
  assert.equal(save(fixture(),{week:'2027-03-22',date:'2027-03-28',start:'01:30',end:'03:30'}).ok,true);
  assert.equal(save(fixture(),{week:'2027-03-22',date:'2027-03-28',timing:'allDay'}).ok,true);
});

test('Ausgeblendete kurze Studioeinträge verdecken keine ältere offene Fortsetzung aus einer Nachbarwoche', () => {
  const f=fixture();f.h.store.setObject('mischwerk.schedule.v1.weeks',['2026-10-12','2026-10-19']);
  f.h.store.setObject('mischwerk.schedule.v1.2026-10-12',{version:1,revision:1,nextId:2,entries:[
    {id:1,date:'2026-10-18',start:'19:00',end:'',timing:'openEnd',kind:'live',userId:1,nick:'Otterchen',topic:'Offene Planung'}]});
  f.h.store.setObject('mischwerk.schedule.v1.2026-10-19',{version:1,revision:1,nextId:2,entries:[
    {id:1,date:'2026-10-25',start:'19:00',end:'',timing:'openEnd',kind:'live',automatic:true,userId:1,nick:'Otterchen',topic:'Kurzer Test',
      actualStart:Date.parse('2026-10-25T18:00:00Z'),actualEnd:Date.parse('2026-10-25T18:01:00Z')}]});
  const plan=read(f,week,0,f.listener,f.listenerRadio);
  assert.equal(plan.total,1);assert.equal(plan.entries[0].topic,'Offene Planung');
});

test('Löschen wartet auf einen noch unbestätigten Studioabgleich und wird nach dessen Abschluss dauerhaft', () => {
  const f=fixture(),selected=currentWeek(f.h);f.h.event(f.owner,f.radio,'mw:onAir', {});f.h.advance(6*60000);
  const write=f.h.store.setObject;
  f.h.store.setObject=(key,value)=>{if(key==='mischwerk.state.v1'&&!value.scheduleSync)throw Error('ack');write(key,value);};
  f.h.event(f.owner,f.radio,'mw:offAir');assert.ok(f.h.store.data['mischwerk.state.v1'].scheduleSync);
  const own=read(f,selected),id=own.entries[0].id;
  const pending=event(f,'mw:schedule.delete',{week:selected,id,expectedRevision:own.revision});
  assert.equal(pending.find(e=>e.type==='mw:schedule.result').data.ok,false);
  f.h.store.setObject=write;
  const ready=read(f,selected);
  assert.equal(event(f,'mw:schedule.delete',{week:selected,id,expectedRevision:ready.revision}).find(e=>e.type==='mw:schedule.result').data.ok,true);
  const h=createHarness(f.h.store),owner=h.user(1,'Otterchen','owner'),session=h.open(owner);
  assert.equal(read({h,owner,session},selected).total,0);
});

function currentWeek(h) {
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone:'Europe/Berlin' }).format(new Date(h.now()));
  const stamp = new Date(date + 'T12:00:00Z');
  stamp.setUTCDate(stamp.getUTCDate() - (stamp.getUTCDay() + 6) % 7);
  return stamp.toISOString().slice(0,10);
}

test('Studio-Anmeldung und Abmeldung werden ohne Dubletten dauerhaft im Sendeplan vermerkt', () => {
  const f = fixture(), selected = currentWeek(f.h);
  f.h.event(f.owner, f.radio, 'mw:onAir', {});
  const first = read(f, selected);
  assert.equal(first.total, 1);
  assert.equal(first.entries[0].automatic, true);
  assert.equal(first.entries[0].actualStart, f.h.now());
  assert.equal(first.entries[0].actualEnd, null);
  f.h.event(f.owner, f.radio, 'mw:onAir', {});
  assert.equal(read(f, selected).revision, first.revision);
  f.h.advance(90000);
  f.h.event(f.owner, f.radio, 'mw:offAir');
  const ended = read(f, selected);
  assert.equal(ended.total, 1); assert.equal(ended.entries[0].actualEnd, f.h.now());
  assert.ok(ended.entries[0].actualUntil > ended.entries[0].actualFrom);
  assert.equal(JSON.stringify(ended).includes('broadcastKey'), false);
  const restarted = createHarness(f.h.store), owner = restarted.user(1, 'Otterchen', 'owner');
  assert.equal(read({h:restarted,owner,session:restarted.open(owner)}, selected).entries[0].actualEnd, ended.entries[0].actualEnd);
});

test('Passende geplante Sendung wird ergänzt und behält ihre geplanten Zeiten', () => {
  const f=fixture(), selected=currentWeek(f.h);
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(f.h.now()));
  f.h.store.setObject('mischwerk.schedule.v1.weeks',[selected]);
  f.h.store.setObject('mischwerk.schedule.v1.'+selected,{version:1,revision:1,nextId:2,entries:[
    {id:1,date,start:'00:00',end:'00:00',timing:'allDay',kind:'live',userId:1,nick:'Otterchen',topic:'Geplante Sendung'}]});
  f.h.event(f.owner,f.radio,'mw:onAir', {}); f.h.advance(2000); f.h.event(f.owner,f.radio,'mw:offAir');
  const data=read(f,selected); assert.equal(data.total,1); assert.equal(data.entries[0].automatic,false);
  assert.equal(data.entries[0].timing,'allDay'); assert.equal(data.entries[0].topic,'Geplante Sendung');
  assert.ok(data.entries[0].actualStart); assert.equal(data.entries[0].actualEnd,f.h.now());
});

test('Spontane Moderation belegt keine zukünftigen Tage und erhält Ende über eine Wochengrenze', () => {
  const f=fixture(), selected=currentWeek(f.h);
  const sunday=Date.parse(selected+'T22:59:00Z')+6*86400000;
  f.h.advance(sunday-f.h.now());
  f.h.event(f.owner,f.radio,'mw:onAir', {});
  const begun=read(f,selected);assert.equal(begun.total,1);
  assert.ok(begun.entries[0].actualUntil-begun.entries[0].actualFrom<1);
  f.h.advance(120000); f.h.event(f.owner,f.radio,'mw:offAir');
  const next=currentWeek(f.h);assert.notEqual(next,selected);
  const continued=read(f,next);assert.equal(continued.total,1);
  assert.equal(continued.entries[0].week,selected);assert.equal(continued.entries[0].actualEnd,f.h.now());
});

test('Nutzerlöschung entfernt auch einen ausstehenden privaten Sendeplanauftrag', () => {
  const f=fixture(),write=f.h.store.setObject;
  f.h.store.setObject=(key,value)=>{if(key.startsWith('mischwerk.schedule.'))throw Error('disk');write(key,value);};
  f.h.event(f.owner,f.radio,'mw:onAir', {});assert.ok(f.h.store.data['mischwerk.state.v1'].scheduleSync);
  f.h.app.onUserDeleted(f.owner.id);
  assert.equal(f.h.store.data['mischwerk.state.v1'].moderator,null);
  assert.equal(f.h.store.data['mischwerk.state.v1'].scheduleSync,undefined);
  f.h.store.setObject=write;
  assert.equal(read(f,currentWeek(f.h),0,f.listener,f.listenerRadio).total,0);
});

test('Fehlender Wochencommit wird nach Neustart idempotent nachgeholt', () => {
  const f=fixture(), selected=currentWeek(f.h), write=f.h.store.setObject;
  f.h.store.setObject=(key,value)=>{if(key.startsWith('mischwerk.schedule.v1.'))throw Error('disk');write(key,value);};
  f.h.event(f.owner,f.radio,'mw:onAir', {});
  assert.ok(f.h.store.data['mischwerk.state.v1'].moderator);
  assert.ok(f.h.store.data['mischwerk.state.v1'].scheduleSync);
  assert.equal(f.h.state(f.owner,f.radio).scheduleSyncPending,true);
  f.h.store.setObject=write;
  const h=createHarness(f.h.store,{users:[{id:1,nick:'Otterchen',role:'owner'}]});
  const owner=h.user(1,'Otterchen','owner'), session=h.open(owner);
  assert.equal(read({h,owner,session},selected).total,1);
  assert.equal(h.store.data['mischwerk.state.v1'].scheduleSync,undefined);
});

test('Verlassen beendet den automatischen Eintrag, fehlender Moderationscommit erzeugt keinen Eintrag', () => {
  const f=fixture(), selected=currentWeek(f.h), write=f.h.store.setObject;
  f.h.store.setObject=(key,value)=>{if(key==='mischwerk.state.v1')throw Error('disk');write(key,value);};
  f.h.event(f.owner,f.radio,'mw:onAir', {}); assert.equal(read(f,selected).total,0);
  f.h.store.setObject=write; f.h.event(f.owner,f.radio,'mw:onAir', {}); f.h.advance(5000);
  f.owner.online=false; f.h.app.onUserLeft(f.owner);
  assert.equal(f.h.store.data['mischwerk.schedule.v1.'+selected].entries[0].actualEnd,f.h.now());
  assert.equal(read(f,selected,0,f.listener,f.listenerRadio).total,0,'Kurze beendete Anmeldung bleibt für Hörer verborgen');
});
const week = '2026-10-26';
test('Hörerübersicht beginnt heute und enthält exakt 14 Tage über Wochen-, Jahres- und Zeitumstellungsgrenzen', () => {
  for (const [stamp, today] of [['2026-11-07T12:00:00Z','2026-11-07'], ['2026-12-31T23:30:00Z','2027-01-01'],
    ['2026-03-28T23:30:00Z','2026-03-29'], ['2026-10-24T22:30:00Z','2026-10-25']]) {
    const f = fixture(); f.h.advance(Date.parse(stamp)-f.h.now());
    const result = event(f, 'mw:schedule.get', { range:true, week:'2020-01-06' }, f.listener, f.listenerRadio)
      .find(item => item.type === 'mw:schedule.data').data;
    assert.equal(result.days.length,14); assert.equal(result.days[0],today);
    assert.equal(result.today,today); assert.equal(result.range,true); assert.equal(result.canManage,false);
    for (let index=1;index<14;index++) assert.equal(Date.parse(result.days[index])-Date.parse(result.days[index-1]),86400000);
    assert.equal(result.entries.length,0);
  }
});

test('14-Tage-Übersicht verbindet drei Wochen ohne Dubletten und berücksichtigt Revisionen und Paketgrenzen', () => {
  const f=fixture(); f.h.advance(Date.parse('2026-11-07T12:00:00Z')-f.h.now());
  const dates=['2026-11-06','2026-11-07','2026-11-09','2026-11-16','2026-11-20','2026-11-21'];
  for(const [index,date] of dates.entries()){
    const stamp=new Date(date+'T12:00:00Z');stamp.setUTCDate(stamp.getUTCDate()-(stamp.getUTCDay()+6)%7);
    assert.equal(save(f,{week:stamp.toISOString().slice(0,10),date,topic:'Sendung '+index}).ok,true);
  }
  function overview(page=0){return event(f,'mw:schedule.get',{range:true,page},f.listener,f.listenerRadio).find(e=>e.type==='mw:schedule.data').data;}
  const first=overview();
  assert.deepEqual(first.entries.map(entry=>entry.date),dates.slice(1,5));
  assert.equal(new Set(first.entries.map(entry=>entry.week+':'+entry.id)).size,4);
  assert.equal(first.weeks.length,3);assert.equal(first.days[13],'2026-11-20');
  assert.equal(JSON.stringify(first).includes('userId'),false);
  const revision=first.boundaryRevision;
  assert.equal(save(f,{week:'2026-11-16',date:'2026-11-19',topic:'Neue Vorschau'}).ok,true);
  assert.notEqual(overview().boundaryRevision,revision);
  assert.ok(JSON.stringify(overview()).length<9500);
});

test('14-Tage-Übersicht überträgt viele Sendungen vollständig in kleinen revisionsgleichen Paketen', () => {
  const f=fixture();f.h.advance(Date.parse('2026-11-07T12:00:00Z')-f.h.now());
  const weeks=['2026-11-02','2026-11-09','2026-11-16'],dates=['2026-11-07','2026-11-09','2026-11-20'];
  f.h.store.setObject('mischwerk.schedule.v1.weeks',weeks);
  for(const [index,week] of weeks.entries()) f.h.store.setObject('mischwerk.schedule.v1.'+week,{version:1,revision:index+1,nextId:26,
    entries:Array.from({length:25},(_,i)=>({id:i+1,date:dates[index],start:'00:'+String(i*2).padStart(2,'0'),
      end:'00:'+String(i*2+1).padStart(2,'0'),userId:1,nick:'Otterchen',topic:'Sendung '+index+' '+i}))});
  const rows=[];let first;
  for(let page=0;;page++){
    const data=event(f,'mw:schedule.get',{range:true,page},f.listener,f.listenerRadio).find(e=>e.type==='mw:schedule.data').data;
    first=first||data;assert.equal(data.total,75);assert.equal(data.boundaryRevision,first.boundaryRevision);
    assert.ok(data.entries.length<=20);assert.ok(JSON.stringify(data).length<9500);rows.push(...data.entries);
    if(page===data.pages-1)break;
  }
  assert.equal(rows.length,75);assert.equal(new Set(rows.map(row=>row.week+':'+row.id)).size,75);
});

function fixture() {
  const h = createHarness();
  const owner = h.user(1, 'Otterchen', 'owner');
  const listener = h.user(2, 'Musikfreund');
  const radio = h.open(owner), listenerRadio = h.open(listener);
  const session = radio;
  return { h, owner, listener, radio, listenerRadio, session };
}
function event(f, type, values = {}, person = f.owner, session = f.session) {
  return f.h.event(person, session, type, { requestId: 'schedule-test-' + (++sequence), ...values });
}
function read(f, date = week, page = 0, person = f.owner, session = f.session) {
  const events = event(f, 'mw:schedule.get', { week: date, page }, person, session);
  const result = events.find(item => item.type === 'mw:schedule.data');
  assert.ok(result, JSON.stringify(events));
  return result.data;
}
function save(f, values = {}) {
  const selected = values.week || week;
  return event(f, 'mw:schedule.save', { week: selected, expectedRevision: read(f, selected).revision,
    date: selected, start: '19:00', end: '21:00', nick: f.owner.nick, topic: '80er und 90er', ...values })
    .find(item => item.type === 'mw:schedule.result').data;
}

test('AutoDJ ist eine eigene geprüfte Sendeart ohne Knuddels-Nick oder fremde User-ID', () => {
  const f = fixture();
  assert.equal(save(f, { kind: 'autodj', nick: 'Nicht vorhandener Nick', userId: 77 }).ok, true);
  const entry = read(f).entries[0];
  assert.equal(entry.kind, 'autodj'); assert.equal(entry.nick, 'MischWerk');
  assert.equal(f.h.store.data['mischwerk.schedule.v1.' + week].entries[0].userId, null);
  assert.equal('userId' in entry, false);
  assert.equal(save(f, { start: '21:00', end: '22:00', kind: 'live', nick: 'MischWerk' }).ok, false);
  for (const input of [{ kind: 'owner' }, { kind: null }, { timing: 'forever' }, { timing: true }]) {
    assert.equal(save(f, input).ok, false, JSON.stringify(input));
  }
  const forged = event(f, 'mw:schedule.save', { week, expectedRevision: 1, date: week,
    kind: 'autodj', timing: 'allDay', topic: 'Gefälscht' }, f.listener, f.listenerRadio);
  assert.equal(forged.find(e => e.type === 'mw:schedule.result').data.ok, false);
  assert.equal(read(f).total, 1);
});

test('Ganztags belegt genau einen Kalendertag und bleibt nach Neustart eindeutig', () => {
  const f = fixture();
  assert.equal(save(f, { kind: 'autodj', timing: 'allDay', start: '', end: '' }).ok, true);
  const entry = read(f).entries[0];
  assert.equal(entry.timing, 'allDay'); assert.equal(entry.start, '00:00'); assert.equal(entry.end, '00:00');
  assert.equal(save(f, { start: '01:00', end: '02:00' }).ok, false);
  assert.equal(save(f, { date: '2026-10-27', start: '00:00', end: '01:00' }).ok, true);
  assert.equal(save(f, { date: '2026-11-01', kind: 'autodj', timing: 'allDay' }).ok, true);
  assert.equal(read(f, '2026-11-02').total, 0, 'Kein leerer Ganztags-Übertrag auf Montag');
  const restarted = createHarness(f.h.store), owner = restarted.user(1, 'Otterchen', 'owner');
  assert.equal(read({ h: restarted, owner, session: restarted.open(owner) }).entries[0].timing, 'allDay');
});

test('Open End hat keine feste Endzeit und wird durch die nächste Sendung begrenzt', () => {
  const f = fixture();
  assert.equal(save(f, { timing: 'openEnd', end: '' }).ok, true);
  assert.equal(read(f).entries[0].end, ''); assert.equal(read(f).entries[0].until, null);
  assert.equal(save(f, { start: '18:00', end: '20:00' }).ok, false, 'Feste Sendung darf offenen Beginn nicht überdecken');
  assert.equal(save(f, { start: '19:00', end: '22:00' }).ok, false, 'Gleichzeitiger Beginn bleibt Konflikt');
  assert.equal(save(f, { start: '21:00', end: '22:00' }).ok, true);
  assert.equal(read(f).entries[0].until, Date.parse(week + 'T21:00:00Z') / 60000);
  const id = read(f).entries[1].id;
  assert.equal(save(f, { id, timing: 'openEnd', start: '21:00', end: '' }).ok, true);
  assert.equal(read(f).entries[1].until, null);
  assert.equal(save(f, { start: '17:00', end: '19:00' }).ok, true);
  assert.equal(save(f, { start: '17:30', timing: 'openEnd', end: '' }).ok, false, 'Offener Beginn innerhalb fester Sendung bleibt Konflikt');
});

test('Open End reicht über leere Wochen bis zur nächsten Sendung und aktualisiert seine Grenzrevision', () => {
  const f = fixture(), future = '2026-11-16';
  assert.equal(save(f, { date: '2026-11-01', start: '22:00', timing: 'openEnd', end: '' }).ok, true);
  const empty = read(f, '2026-11-09');
  assert.equal(empty.total, 1); assert.equal(empty.entries[0].week, week);
  assert.equal(empty.entries[0].timing, 'openEnd'); assert.equal(empty.entries[0].until, null);
  assert.equal(save(f, { week: future, date: future, start: '08:00', end: '09:00' }).ok, true);
  const bounded = read(f, '2026-11-09');
  assert.equal(bounded.entries[0].until, Date.parse(future + 'T08:00:00Z') / 60000);
  assert.notEqual(empty.boundaryRevision, bounded.boundaryRevision);
  assert.equal(read(f, future).entries[0].week, week, 'Offene Fortsetzung ist auch beim Folgeprogramm sichtbar');
  assert.ok(JSON.stringify(bounded).length < 9500);
  assert.equal(JSON.stringify(bounded).includes('userId'), false);
});

test('Alte Einträge bleiben Live mit fester Zeit; AutoDJ-Löschung betrifft keine Moderator-Daten', () => {
  const f = fixture();
  assert.equal(save(f).ok, true);
  const stored = f.h.store.data['mischwerk.schedule.v1.' + week].entries[0];
  delete stored.kind; delete stored.timing;
  assert.equal(read(f).entries[0].kind, 'live'); assert.equal(read(f).entries[0].timing, 'fixed');
  assert.equal(save(f, { date: '2026-10-27', kind: 'autodj', timing: 'allDay' }).ok, true);
  f.h.app.onUserDeleted(f.owner.id);
  assert.equal(read(f).total, 1); assert.equal(read(f).entries[0].kind, 'autodj');
});
test('Tagesplan öffnet für Hörer und Inhaber ohne Wunschfreigabe und erhält Radio sowie gespeicherte Daten',()=>{
 const f=fixture();f.h.event(f.owner,f.radio,'mw:setRequests',{enabled:false});const before=JSON.stringify(f.h.store.data);
 for(const [person,session]of [[f.owner,f.radio],[f.listener,f.listenerRadio]]){
  const events=f.h.event(person,session,'mw:openSchedule',{requestId:'daily-plan'});
  assert.equal(events.find(e=>e.type==='mw:result').data.ok,true);
  assert.equal(person.sessions.some(s=>s.activeView==='schedule'),true);assert.equal(session.removed,false);
 }
 assert.equal(JSON.stringify(f.h.store.data),before);
});
test('Nur der echte Channelinhaber bearbeitet den Plan; Radiomoderatoren, CM und Appmanager lesen nur', () => {
  const f = fixture();
  const moderator = f.h.user(3, 'Radiostimme');
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: moderator.nick });
  for (const person of [f.listener, moderator, f.h.user(4, 'CM', 'cm'), f.h.user(5, 'Appmanager', 'manager')]) {
    const session = f.h.open(person);
    assert.equal(read(f, week, 0, person, session).canManage, false);
    for (const type of ['mw:schedule.save', 'mw:schedule.delete']) {
      const response = event(f, type, { week, expectedRevision: 0, canManage: true, id: 1,
        date: week, start: '18:00', end: '20:00', nick: person.nick, topic: 'Manipuliert' }, person, session);
      assert.equal(response.find(item => item.type === 'mw:schedule.result').data.ok, false);
    }
  }
  assert.equal(read(f).total, 0);
});
test('Anlegen, Ändern, Wiederholungs- und Revisionsschutz sowie Löschen einzelner Sendungen', () => {
  const f = fixture();
  assert.equal(save(f).ok, true);
  const first = read(f);
  const id = first.entries[0].id;
  assert.equal(save(f, { id, start: '20:00', end: '22:00', topic: 'Rockabend' }).ok, true);
  assert.equal(read(f).entries[0].topic, 'Rockabend');
  assert.equal(save(f, { expectedRevision: first.revision, topic: 'Veraltet' }).ok, false);
  assert.equal(read(f).total, 1);
  const result = event(f, 'mw:schedule.delete', { week, id, expectedRevision: read(f).revision });
  assert.equal(result.find(item => item.type === 'mw:schedule.result').data.ok, true);
  assert.equal(read(f).total, 0);
});
test('Nur vorhandene und für das Radio ernannte Nicks; authentifizierte User-ID bleibt privat', () => {
  const f = fixture();
  assert.equal(save(f, { nick: 'Unbekannter Nick' }).ok, false);
  assert.equal(save(f, { nick: f.listener.nick }).ok, false);
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick, userId: 999 }).ok, true);
  const entry = read(f).entries[0];
  assert.equal(entry.nick, f.listener.nick);
  assert.equal('userId' in entry, false);
  const stored = f.h.store.data['mischwerk.schedule.v1.' + week].entries[0];
  assert.equal(stored.userId, f.listener.id);
});
test('Datums-, Uhrzeit-, Themen- und Wochenvalidierung; fehlerhafte Eingaben verändern keine Daten', () => {
  const f = fixture();
  for (const input of [{ date: '2026-02-30' }, { date: '2026-11-02' }, { start: '25:00' },
    { end: '19:00' }, { topic: '' }, { topic: 'x'.repeat(81) }, { expectedRevision: null }, { id: '1' }]) {
    assert.equal(save(f, input).ok, false, JSON.stringify(input));
  }
  assert.equal(read(f).total, 0);
  assert.equal(read(f, '2026-11-01').week, week);
});
test('Überschneidungen werden einschließlich Sonntag/Montag verhindert; angrenzende Sendungen sind möglich', () => {
  const f = fixture();
  assert.equal(save(f, { date: '2026-11-01', start: '22:00', end: '02:00' }).ok, true);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '01:00', end: '03:00' }).ok, false);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '02:00', end: '04:00' }).ok, true);
  const next = read(f, '2026-11-02');
  assert.equal(next.total, 2);
  assert.equal(next.previousRevision, read(f).revision, 'Auch die Vorwoche besitzt eine geprüfte Paketrevision');
  assert.equal(next.entries[0].week, week, 'Fortsetzung der Vorwoche am Montag sichtbar');
  assert.equal(save(f, { date: '2026-11-01', start: '23:00', end: '01:00' }).ok, false);
});
test('Zukünftige Wochen über Monats- und Jahresgrenzen werden mit eigener Revision gespeichert und gelesen', () => {
  const f = fixture();
  for (const future of ['2027-01-04', '2027-04-12', '2028-01-03']) {
    assert.equal(save(f, { week: future, date: future, topic: 'Zukunft ' + future }).ok, true);
    const planned = read(f, future);
    assert.equal(planned.revision, 1);
    assert.equal(planned.entries[0].date, future);
    assert.equal(planned.entries[0].topic, 'Zukunft ' + future);
    assert.equal(save(f, { week: future, date: future, start: '21:00', end: '22:00', expectedRevision: 0 }).ok, false);
    assert.ok(f.h.store.data['mischwerk.schedule.v1.' + future]);
  }
  assert.equal(read(f).total, 0, 'Die Ausgangswoche bleibt unverändert');
});

test('Sendungen bis exakt Mitternacht erzeugen keine leere Fortsetzung in der Folgewoche', () => {
  const f = fixture();
  assert.equal(save(f, { date: '2026-11-01', start: '22:00', end: '00:00' }).ok, true);
  assert.equal(read(f).total, 1);
  assert.equal(read(f, '2026-11-02').total, 0);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '00:00', end: '02:00' }).ok, true);
  assert.equal(read(f, '2026-11-02').total, 1);
});

test('Planänderungen werden gespeichert und quittiert, ohne entfernte Overlay-Abfragen oder Benachrichtigungen',()=>{
 const f=fixture(),observer=f.h.user(3,'Beobachtung'),session=f.h.open(observer);
 const events=event(f,'mw:schedule.save',{week,expectedRevision:0,date:week,start:'19:00',end:'21:00',nick:f.owner.nick,topic:'Gespeicherte Sendung'});
 const receipts=events.filter(e=>e.type==='mw:schedule.result');assert.equal(receipts.length,1);assert.equal(receipts[0].data.ok,true);
 assert.equal(read(f).entries[0].topic,'Gespeicherte Sendung');
 assert.equal(session.events.some(e=>e.type==='mw:schedule.changed'),false);
 assert.equal(f.h.logs.some(e=>e.message.includes('[SCHEDULE_NOTIFY]')),false);
});
test('Persistente Wochenpläne überleben Neustarts und bleiben vollständig von Zustand und Wünschen getrennt', () => {
  const f = fixture();
  const state = JSON.stringify(f.h.store.data['mischwerk.state.v1']);
  assert.equal(save(f).ok, true);
  assert.equal(JSON.stringify(f.h.store.data['mischwerk.state.v1']), state);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' });
  const second = createHarness(f.h.store);
  const listener = second.user(2, f.listener.nick);
  const session = second.open(listener);
  const restarted = { h: second, owner: listener, session };
  assert.equal(read(restarted).entries[0].topic, '80er und 90er');
  assert.equal(second.state(listener, session).queueTotal, 0);
});
test('Alle Wochen-Einträge bleiben über kleine Pakete lesbar, ohne private User-IDs zu veröffentlichen', () => {
  const f = fixture();
  for (let i = 0; i < 25; i++) {
    const start = String(Math.floor(i / 3)).padStart(2, '0') + ':' + String(i % 3 * 20).padStart(2, '0');
    const end = String(Math.floor((i + 1) / 3)).padStart(2, '0') + ':' + String((i + 1) % 3 * 20).padStart(2, '0');
    assert.equal(save(f, { start, end, topic: '"'.repeat(80) }).ok, true);
  }
  const first = read(f), second = read(f, week, 1);
  assert.equal(first.pages, 2); assert.equal(first.total, 25);
  assert.equal(first.entries.length + second.entries.length, 25);
  assert.ok(JSON.stringify(first).length < 9500);
  assert.equal(first.entries.some(entry => 'userId' in entry), false);
});
test('Speicherfehler erhalten Wochenplan und Wunschannahme', () => {
  const f = fixture();
  assert.equal(save(f).ok, true);
  const setObject = f.h.store.setObject;
  f.h.store.setObject = (key, value) => { if (key.startsWith('mischwerk.schedule.')) { throw new Error('privater Fehler'); } setObject(key, value); };
  const response = save(f, { id: read(f).entries[0].id, topic: 'Nicht gespeichert' });
  assert.equal(response.ok, false); assert.doesNotMatch(response.message, /privater Fehler/);
  assert.equal(read(f).entries[0].topic, '80er und 90er');
  f.h.event(f.owner,f.radio,'mw:onAir',{});
  assert.equal(f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' })
    .find(item => item.type === 'mw:wish.receipt').data.accepted, true);
});
test('Nutzerlöschung entfernt geplante Nick-/Userdaten aus allen gespeicherten Wochen', () => {
  const f = fixture();
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick }).ok, true);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', nick: f.listener.nick }).ok, true);
  f.h.app.onUserDeleted(f.listener.id);
  assert.equal(read(f).total, 0); assert.equal(read(f, '2026-11-02').total, 0);
  assert.equal(JSON.stringify(f.h.store.data).includes(f.listener.nick), false);
});
test('Aktuelle Woche folgt dem deutschen Datum auch sonntags nach UTC-Mitternacht und im Sommer', () => {
  const f = fixture();
  for (const [stamp, today, monday] of [
    ['2026-07-05T22:30:00Z', '2026-07-06', '2026-07-06'],
    ['2026-10-25T00:30:00Z', '2026-10-25', '2026-10-19'],
    ['2026-10-25T01:30:00Z', '2026-10-25', '2026-10-19'],
    ['2026-12-31T23:30:00Z', '2027-01-01', '2026-12-28']
  ]) {
    f.h.advance(Date.parse(stamp) - f.h.state(f.owner, f.session).serverTime);
    const current = event(f, 'mw:schedule.get').find(item => item.type === 'mw:schedule.data').data;
    assert.equal(current.today, today); assert.equal(current.week, monday);
    assert.equal(current.days.length, 7);
  }
});
test('Geschlossene/fremde Sitzungen und ungültige Anfrage-IDs dürfen keine Sendung speichern', () => {
  const f = fixture();
  assert.deepEqual(event(f, 'mw:schedule.save', {}, f.listener, f.session), []);
  assert.equal(event(f, 'mw:schedule.get', { requestId: '../datei' }).find(item => item.type === 'mw:schedule.result').data.ok, false);
  f.session.remove();
  assert.deepEqual(event(f, 'mw:schedule.save'), []);
  assert.equal(Object.keys(f.h.store.data).some(key => key.startsWith('mischwerk.schedule.')), false);
});
test('Fehler beim Bereinigen des Sendeplans blockieren nicht die bisherige Rollen- und Wunschbereinigung', () => {
  const f = fixture();
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick }).ok, true);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' });
  const write = f.h.store.setObject;
  f.h.store.setObject = (key, value) => {
    if (key.startsWith('mischwerk.schedule.')) { throw new Error('privater Speicherfehler'); }
    write(key, value);
  };
  assert.doesNotThrow(() => f.h.app.onUserDeleted(f.listener.id));
  assert.equal(f.h.store.data['mischwerk.state.v1'].radioModeratorUserIds.length, 0);
  assert.equal(f.h.state(f.owner, f.session).queueTotal, 0);
  assert.ok(f.h.logs.some(log => log.message.includes('SCHEDULE_PURGE')));
  assert.equal(f.h.logs.some(log => log.message.includes('privater Speicherfehler')), false);
});

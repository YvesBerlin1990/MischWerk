const test = require('node:test'), assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const base = 'https://radio-mischwerk.web.app/api/public-schedule?week=';
const plain = value => JSON.parse(JSON.stringify(value));
function fixture(options = {}) {
  const calls = [], store = persistence(); let runtime;
  const h = createHarness(store, { serverMethods: { getExternalServerAccess: () => ({
    canAccessURL: () => options.allowed !== false,
    getURL(target, callbacks) { calls.push({ target, callbacks }); if (options.throwGet) throw Error('private'); }
  }) }, configureModules(c) {
    const attach = c.MischWerkModules.attachScheduleDay;
    c.MischWerkModules.attachScheduleDay = r => { attach(r); runtime = r; };
  } });
  const person = h.user(71, 'Hörer'), session = h.open(person);
  const date = runtime.scheduleToday(), week = runtime.scheduleWeek(date);
  let sequence = 0;
  const body = (entries = [], changes = {}) => ({ version:1, ok:true, ready:true, week, today:date,
    days:Array.from({length:7}, (_,i) => runtime.scheduleDay(week,i)), revision:0, entries, ...changes });
  const row = (changes = {}) => ({ id:'public-row', week, date, start:'12:00', end:'14:00', until:null,
    kind:'live', timing:'fixed', moderator:'Otterchen', topic:'Öffentlicher Webtitel', ...changes });
  return {h, store, runtime, calls, person, session, date, week, body, row,
    read(day = date, page = 0, who = person, surface = session) {
      h.event(who, surface, 'mw:schedule.day', {requestId:'public-'+(++sequence), date:day, page}); return surface.events;
    },
    reply(value = body(), status = 200, target = calls.at(-1)?.target, failure = false, index = calls.length-1) {
      calls[index].callbacks[failure?'onFailure':'onSuccess'](typeof value === 'string' ? value : JSON.stringify(value),
        { getResponseCode:() => status, getURLString:() => target }); return session.events;
    },
    data: () => session.events.findLast(e => e.type === 'mw:schedule.data')?.data,
    error: () => session.events.findLast(e => e.type === 'mw:schedule.result')?.data
  };
}
test('Öffentliche Tagesansicht liest JSON per nativem GET ohne aktivierte Statusverbindung oder Kalendercommit', () => {
  const f = fixture(); const before = JSON.stringify(f.store.data);
  f.read(); assert.equal(f.data(), undefined, 'Ohne HTTP-Antwort gibt es keinen bestätigten Tag');
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].target, base+f.week);
  f.reply(f.body([f.row()]));
  assert.equal(f.data().source, 'homepage'); assert.equal(f.data().entries[0].topic, 'Öffentlicher Webtitel');
  assert.equal(f.data().entries[0].nick, 'Otterchen'); assert.equal(JSON.stringify(f.store.data),before);
  assert.doesNotMatch(JSON.stringify(f.data()), /public-row|userId|firebaseId|relayBindings|syncSecret/);
});

test('Generierte AutoDJ-Zeilen, Live-Texte und leere Webtitel folgen dem öffentlichen Vertrag', () => {
  const f=fixture(); f.read(); f.reply(f.body([
    f.row({id:'generated',kind:'autodj',start:'00:00',end:'12:00',generated:true,moderator:'MischWerk am Pult',topic:'MischWerk Radio Show'}),
    f.row({id:'live',topic:'',moderator:'Polaroid'}),
    f.row({id:'late',start:'14:00',end:'00:00',topic:'  Web   Titel  ',moderator:'otterchen'})
  ]));
  assert.deepEqual(f.data().entries.map(e=>[e.start,e.end,e.topic,e.nick]),[
    ['00:00','12:00','MischWerk Radio Show','MischWerk am Pult'], ['12:00','14:00','Live-Sendung','Polaroid'],
    ['14:00','00:00','  Web   Titel  ','otterchen']]);
  f.h.advance(15000); f.read(); f.reply(f.body([f.row({kind:'autodj',timing:'allDay',start:'00:00',end:'00:00',generated:true})]));
  assert.equal(f.data().entries[0].allDay,true); assert.equal(f.data().entries[0].until-f.data().entries[0].from,1440);
});

test('Leerer öffentlicher Tag und native Altdaten erzeugen keine erfundenen Programme oder Schreibaktionen', () => {
  const f=fixture(); f.store.setObject('mischwerk.schedule.v1.weeks',[f.week]);
  f.store.setObject('mischwerk.schedule.v1.'+f.week,{broken:true}); const before=JSON.stringify(f.store.data);
  f.read(); f.reply(f.body()); assert.deepEqual(f.data().entries,[]); assert.equal(JSON.stringify(f.store.data),before);
});

test('Mitternacht, vom Server aufgelöstes Open End und Wochengrenzen folgen den Webintervallen', () => {
  const f=fixture(),sunday=f.runtime.scheduleDay(f.week,6),monday=f.runtime.scheduleDay(sunday,1);
  const body=f.body([f.row({date:sunday,start:'22:00',end:'02:00'})],{week:f.runtime.scheduleWeek(monday),days:Array.from({length:7},(_,i)=>f.runtime.scheduleDay(monday,i))});
  f.read(monday); f.reply(body); assert.deepEqual(f.data().entries.map(e=>[e.start,e.end]),[['00:00','02:00']]);
  f.h.advance(15000); f.read(monday); body.entries[0].timing='openEnd'; body.entries[0].until=f.runtime.scheduleDate(monday)/60000+600;
  body.entries.push(f.row({id:'next',date:monday,week:body.week,start:'10:00',end:'12:00'})); f.reply(body);
  assert.deepEqual(f.data().entries.map(e=>[e.start,e.end]),[['00:00','10:00'],['10:00','12:00']]);
  f.h.advance(15000); f.read(monday); body.entries[0].until=null; f.reply(body);
  assert.deepEqual(f.data().entries.map(e=>e.start),['10:00'],'Ohne until endet Open End wie auf der Website am Ende seines Starttags');
});

test('Viele Einträge werden atomar paginiert; revision 0 kann neue Inhalte und eine neue Signatur liefern', () => {
  const f=fixture(),entries=Array.from({length:24},(_,i)=>f.row({id:'hour-'+i,start:String(i).padStart(2,'0')+':00',end:String((i+1)%24).padStart(2,'0')+':00',topic:'Ä'.repeat(78)}));
  f.read();f.reply(f.body(entries));const first=plain(f.data());assert.equal(first.pages,2);assert.equal(first.entries.length,20);
  f.read(f.date,1);assert.equal(f.calls.length,1);assert.equal(f.data().entries.length,4);assert.equal(f.data().signature,first.signature);
  assert.ok(JSON.stringify(f.data()).length<9500);f.h.advance(15000);f.read();f.reply(f.body(entries));assert.equal(f.data().signature,first.signature);
  f.h.advance(15000);f.read();entries[0].topic='BB';f.reply(f.body(entries));const changed=f.data().signature;assert.notEqual(changed,first.signature);
  f.h.advance(15000);f.read();entries[0].topic='Aa';f.reply(f.body(entries));assert.notEqual(f.data().signature,changed,'Keine Kollision eines einfachen 31er-Hashes');
});

test('Mehrere Hörer teilen GET und Cache; derselbe Inhaltseigentümer behält nur seinen jüngsten Auftrag', () => {
  const f=fixture(),other=f.h.user(72,'Zweiter'),second=f.h.open(other);
  f.read();f.read(f.date,0,other,second);f.read(f.date);assert.equal(f.calls.length,1);
  f.reply(f.body([f.row()]));assert.equal(f.session.events.filter(e=>e.type==='mw:schedule.data').length,1);
  assert.equal(second.events.filter(e=>e.type==='mw:schedule.data').length,1);assert.equal(f.data().requestId,'public-3');
  f.read();assert.equal(f.calls.length,1);f.h.advance(15000);f.read();assert.equal(f.calls.length,2);
});

for(const kind of ['http','redirect','failure','invalid','not-ready','wrong-week','oversized','bad-entry','duplicate','bad-days','control','long-title']) {
  test('Öffentlicher Abruf weist '+kind+' als Fehler ab und bestätigt keinen leeren Tag', () => {
    const f=fixture();let body=f.body([f.row()]),status=200,target;
    if(kind==='http')status=503;if(kind==='redirect')target='https://other.invalid/';if(kind==='invalid')body='<html>Fehler</html>';
    if(kind==='not-ready')body.ready=false;if(kind==='wrong-week')body.week='2020-01-06';if(kind==='oversized')body=' '.repeat(131073);
    if(kind==='bad-entry')body.entries[0].date='2026-02-30';if(kind==='duplicate')body.entries.push({...body.entries[0]});
    if(kind==='bad-days')body.days.pop();if(kind==='control')body.entries[0].topic='Web\nTitel';if(kind==='long-title')body.entries[0].topic='Ä'.repeat(81);
    f.read();f.reply(body,status,target||f.calls[0].target,kind==='failure');assert.equal(f.data(),undefined);assert.equal(f.error().ok,false);
    assert.doesNotMatch(JSON.stringify(f.error()),/other.invalid|<html>|Web\\n|private/);
    f.read();assert.equal(f.calls.length,2,'Fehler wird nicht als gültiger Cache gespeichert');
  });
}

for(const options of [{allowed:false},{throwGet:true}])test('Domain- oder API-Fehler bleibt sichtbar und schreibt keinen Kalender '+JSON.stringify(options),()=>{
  const f=fixture(options);f.read();assert.equal(f.data(),undefined);assert.equal(f.error().ok,false);
});

test('Timeout verwirft späte und doppelte Callbacks, ohne einen neuen Auftrag zu beenden', () => {
  const f=fixture();f.read();f.h.advance(10000);assert.equal(f.error().ok,false);f.read();
  f.reply(f.body([f.row({topic:'Alt'})]),200,f.calls[0].target,false,0);assert.equal(f.data(),undefined);
  f.reply(f.body([f.row({topic:'Neu'})]));assert.equal(f.data().entries[0].topic,'Neu');
  f.reply(f.body([f.row({topic:'Doppelt'})]));assert.equal(f.data().entries[0].topic,'Neu');
});

for(const hook of ['onPrepareShutdown','onShutdown'])test(hook+' räumt öffentliche Aufträge und Timeout auf',()=>{
  const f=fixture();f.read();f.h.app[hook]();f.reply(f.body([f.row()]));f.h.advance(10001);assert.equal(f.data(),undefined);assert.equal(f.error(),undefined);
});

test('Verlassene und geschlossene Sitzungen erhalten keine asynchrone Tagesantwort',()=>{
  for(const mode of ['offline','closed']){const f=fixture();f.read();if(mode==='offline')f.person.online=false;else f.session.content.sessions=[];
    f.reply(f.body([f.row()]));assert.equal(f.data(),undefined);assert.equal(f.error(),undefined);}
});

test('Berliner Heute und navigierbare Wochen bleiben über DST und Jahreswechsel korrekt',()=>{
  for(const [stamp,today] of [['2026-07-05T22:30:00Z','2026-07-06'],['2026-10-25T01:30:00Z','2026-10-25'],['2026-12-31T23:30:00Z','2027-01-01']]){
    const f=fixture();f.h.advance(Date.parse(stamp)-f.h.now());const week=f.runtime.scheduleWeek(today);
    f.read('');assert.equal(f.calls.at(-1).target,base+week);f.reply(f.body([],{week,today,days:Array.from({length:7},(_,i)=>f.runtime.scheduleDay(week,i))}));
    assert.equal(f.data().date,today);assert.equal(f.data().today,today);
    const first=f.runtime.scheduleDay(week,-7),last=f.runtime.scheduleDay(week,13);
    assert.equal(f.runtime.scheduleDayContext(first).first,first);assert.equal(f.runtime.scheduleDayContext(last).last,last);
    f.read(f.runtime.scheduleDay(first,-1));assert.equal(f.data(),undefined);assert.equal(f.error().ok,false);
    assert.equal(f.calls.length,1,'Ungültiges Datum wird nicht an eine fremde URL weitergereicht');
  }
});

test('Ein Heute-Auftrag über Mitternacht bestätigt keine veraltete Tagesauswahl',()=>{
  const f=fixture();f.h.advance(Date.parse('2026-11-11T22:59:59Z')-f.h.now());f.read('');f.h.advance(2000);
  f.reply(f.body());assert.equal(f.data(),undefined);assert.equal(f.error().ok,false);
});

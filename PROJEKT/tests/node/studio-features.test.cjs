const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHarness } = require('../support/knuddels.cjs');
const result = events => events.findLast(event => event.type === 'mw:result')?.data;
function fixture() {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), dj = h.user(2, 'Nächster DJ'), a = h.user(3, 'Hörer A'), b = h.user(4, 'Hörer B');
  const os = h.open(owner), ds = h.open(dj), as = h.open(a), bs = h.open(b);
  assert.equal(result(h.event(owner, os, 'mw:addRadioModerator', {nick:dj.nick})).ok, true);
  return {h,owner,dj,a,b,os,ds,as,bs};
}
function at(f, utc) { f.h.advance(Date.parse(utc) - f.h.state(f.owner,f.os).serverTime); }
function schedule(f, date, start, end, nick, topic = 'Geplantes Thema') {
  const day = new Date(date+'T12:00:00Z'); day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
  const week = day.toISOString().slice(0,10);
  f.h.event(f.owner,f.os,'mw:openSchedule');
  const session = f.owner.sessions.find(s=>s.content.htmlFile.pageData.view==='schedule');
  const read=f.h.event(f.owner,session,'mw:schedule.get',{week,requestId:'read-plan'}).find(e=>e.type==='mw:schedule.data').data;
  const saved=f.h.event(f.owner,session,'mw:schedule.save',{week,date,start,end,nick,topic,expectedRevision:read.revision,requestId:'save-plan'}).find(e=>e.type==='mw:schedule.result').data;
  assert.equal(saved.ok,true,saved.message);
}

test('Wunschregie zeigt Status privat, erhält Plätze bis Abschluss und speichert keine Wünsche',()=>{
  const f=fixture(),{h,owner,a,b,os,as,bs}=f;
  h.event(a,as,'mw:wish.submit',{text:'Erster Song'});h.event(b,bs,'mw:wish.submit',{text:'Zweiter Song'});
  const state=h.state(owner,os), id=state.queue[0].id, before=JSON.stringify(h.store.data);
  for(const [previousStage,stage] of [['queued','preparing'],['preparing','playing']]){
    assert.equal(result(h.event(owner,os,'mw:setWishStage',{id,previousStage,stage})).ok,true);
    assert.equal(h.state(a,as).wishPositions.items[0].stage,stage);
    assert.equal(h.state(a,as).wishPositions.items[0].position,1);
    assert.equal(h.state(b,bs).wishPositions.items[0].position,2);
    assert.equal(h.state(b,bs).queue.length,0);
    assert.equal(JSON.stringify(h.store.data),before);
  }
  h.event(owner,os,'mw:resolveRequest',{id,outcome:'done'});
  assert.equal(h.state(a,as).wishPositions.total,0);assert.equal(h.state(b,bs).wishPositions.nextPosition,1);
  assert.equal(h.state(b,bs).wishPositions.items[0].stage,'queued');
  assert.equal(JSON.stringify(h.store.data),before);
  const read=h.store.getObject;let reads=0;h.store.getObject=()=>{reads++;throw Error('Plan nicht erreichbar');};
  h.advance(70000);
  const accepted=h.event(a,as,'mw:wish.submit',{text:'Auch bei abgelaufenem Plancache'}).find(e=>e.type==='mw:wish.receipt').data;
  assert.equal(accepted.accepted,true);assert.equal(reads,0,'Wunschbroadcast lädt niemals Planpersistenz');
  assert.equal(os.events.findLast(e=>e.type==='mw:state').data.assistant.unavailable,true);
  h.store.getObject=read;
});

test('Wunschregie verwirft veraltete, fremde und ungültige Aktionen; nur Platz 1 kann laufen',()=>{
  const {h,owner,dj,a,os,ds,as}=fixture();
  for(const text of ['Eins','Zwei'])h.event(a,as,'mw:wish.submit',{text});
  const first=h.state(owner,os).queue[0].id, second=h.state(owner,os,1).queue[0].id;
  const change=(id,stage,previousStage='queued',user=owner,session=os)=>result(h.event(user,session,'mw:setWishStage',{id,stage,previousStage}));
  assert.equal(change(first,'preparing','queued',a,as).ok,false);
  assert.equal(change(first,'preparing','queued',dj,os),undefined);
  assert.equal(change(first,'forged').ok,false);assert.equal(change(first,'playing').ok,false);
  assert.equal(change(second,'preparing').ok,true);assert.equal(change(second,'playing','preparing').ok,false);
  assert.equal(change(first,'preparing').ok,true);
  assert.equal(change(first,'queued','queued',dj,ds).ok,false,'Veralteter Stand überschreibt keine andere Moderation');
  assert.equal(change(first,'preparing').ok,true,'Identische Wiederholung bleibt erfolgreich');
  assert.equal(change(first,'playing','preparing').ok,true);
  assert.equal(change(first,'queued','playing').ok,true);
  assert.equal(h.state(owner,os).queueTotal,2);
});

test('Übergabenotizen bleiben privat, überstehen fehlgeschlagene Annahme und bleiben während der übernommenen Sendung lesbar',()=>{
  const f=fixture(),{h,owner,dj,a,os,ds,as}=f;
  h.event(owner,os,'mw:onAir'); const key=h.state(owner,os).moderator.sessionKey;
  const notes='Nach dem nächsten Song bitte die Geburtstagsgrüße vorlesen.';
  assert.equal(result(h.event(owner,os,'mw:handover.request',{nick:dj.nick,expectedModerator:key,notes})).ok,true);
  const incoming=h.state(dj,ds).handover.incoming;
  assert.equal(incoming.notes,notes);assert.equal(h.state(owner,os).handover.outgoing.notes,notes);
  assert.equal(JSON.stringify(h.state(a,as)).includes(notes),false);
  const write=h.store.setObject;h.store.setObject=()=>{throw Error('storage-failed');};
  assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id:incoming.id,topic:'Neu'})).ok,false);
  assert.equal(h.state(dj,ds).handover.incoming.notes,notes);
  h.store.setObject=write;
  assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id:incoming.id,topic:'Neu'})).ok,true);
  assert.equal(h.state(dj,ds).handover.receivedNotes,notes);
  assert.equal(h.state(owner,os).handover.receivedNotes,null);
  owner.online=false;h.app.onUserLeft(owner);
  assert.equal(h.state(dj,ds).handover.receivedNotes,notes,'Vorherige Moderation darf den Channel verlassen');
  h.advance(1000);h.event(dj,ds,'mw:onAir');
  assert.equal(h.state(dj,ds).handover.receivedNotes,notes,'Verlängerung erhält Hinweise');
  assert.equal(JSON.stringify(h.store.data).includes(notes),false);
  assert.equal(h.bot.messages.some(x=>x.includes(notes)),false);
  h.event(dj,ds,'mw:offAir');assert.equal(h.state(dj,ds).handover.receivedNotes,null);
});

test('Übergabenotizen prüfen Länge, verhindern stilles Überschreiben und verschwinden bei Abbruch, Löschung und Neustart',()=>{
  const {h,owner,dj,os,ds}=fixture();h.event(owner,os,'mw:onAir');
  const expectedModerator=h.state(owner,os).moderator.sessionKey;
  const request=notes=>result(h.event(owner,os,'mw:handover.request',{nick:dj.nick,expectedModerator,notes}));
  assert.equal(request('x'.repeat(501)).ok,false);assert.equal(h.state(dj,ds).handover.incoming,null);
  assert.equal(request('x'.repeat(500)).ok,true);const id=h.state(dj,ds).handover.incoming.id;
  assert.equal(request('Geändert').ok,false);assert.equal(h.state(dj,ds).handover.incoming.notes,'x'.repeat(500));
  h.event(owner,os,'mw:handover.cancel',{id});assert.equal(h.state(dj,ds).handover.incoming,null);
  assert.equal(request('Bitte Grüße vorlesen.').ok,true);
  const incoming=h.state(dj,ds).handover.incoming;
  h.event(dj,ds,'mw:handover.accept',{id:incoming.id});
  h.app.onUserDeleted(owner.id);assert.equal(h.state(dj,ds).handover.receivedNotes,null);
  const restarted=createHarness(h.store), newDj=restarted.user(dj.id,dj.nick);
  assert.equal(restarted.state(newDj,restarted.open(newDj)).handover.receivedNotes,null);
});

test('Sendungsassistent verbindet Studiozeit mit Berliner Sendeplan und nächster Moderation, ohne Planrechte zu ändern',()=>{
  const f=fixture(),{h,owner,dj,a,os,ds,as}=f;at(f,'2026-11-02T19:30:00Z');
  schedule(f,'2026-11-02','20:00','22:00',owner.nick);schedule(f,'2026-11-02','22:00','23:00',dj.nick,'Nächste Sendung');
  h.event(owner,os,'mw:onAir');const started=h.state(owner,os).moderator.since;
  const assistant=h.state(owner,os).assistant;
  assert.equal(assistant.current.startAt,Date.parse('2026-11-02T19:00:00Z'));
  assert.equal(assistant.current.endAt,Date.parse('2026-11-02T21:00:00Z'));
  assert.equal(assistant.next.nick,dj.nick);assert.equal(assistant.startedAt,started);
  assert.equal('userId' in assistant.current,false);assert.equal(h.state(a,as).assistant,null);
  assert.equal(h.state(dj,ds).assistant.current.topic,'Geplantes Thema');
  assert.equal(h.state(owner,os).topic,'','Lesender Assistent übernimmt kein Thema automatisch');
  h.advance(60000);h.event(owner,os,'mw:onAir');assert.equal(h.state(owner,os).assistant.startedAt,started);
  at(f,'2026-11-02T21:05:00Z');
  assert.equal(h.state(owner,os).assistant.current.endAt,assistant.current.endAt,'Überziehung bleibt bis zur tatsächlichen Übergabe sichtbar');
  assert.equal(h.state(owner,os).assistant.next.nick,dj.nick);
});

test('Sendungsassistent liest Fortsetzung am Montag, zukünftige eigene Sendung und meldet Speicherfehler unabhängig von Wünschen',()=>{
  const f=fixture(),{h,owner,a,os,as}=f;at(f,'2026-11-02T00:30:00Z');
  schedule(f,'2026-11-01','23:00','02:00',owner.nick,'Über Mitternacht');
  assert.equal(h.state(owner,os).assistant.current.endAt,Date.parse('2026-11-02T01:00:00Z'));
  h.advance(3600000);schedule(f,'2026-11-03','20:00','22:00',owner.nick,'Morgen');
  assert.equal(h.state(owner,os).assistant.current.topic,'Morgen');
  const read=h.store.getObject;h.store.getObject=(key,fallback)=>{if(key.startsWith('mischwerk.schedule.'))throw Error('offline');return read(key,fallback);};
  assert.equal(h.state(owner,os).assistant.unavailable,true);
  h.event(a,as,'mw:wish.submit',{text:'Unabhängiger Wunsch'});
  assert.equal(h.state(owner,os).queueTotal,1);assert.ok(h.logs.some(x=>x.message.includes('ASSISTANT_PLAN')));
});

test('Berliner Sendungszeit berücksichtigt Sommerzeit, Winterzeit, doppelte Stunde und ausgelassene Uhrzeit',()=>{
  const scope={MischWerkModules:{},Date};vm.createContext(scope);
  vm.runInContext(fs.readFileSync('src/backend/schedule/calendar.js','utf8'),scope);
  const runtime={failure:message=>Error(message)};scope.MischWerkModules.attachScheduleCalendar(runtime);
  assert.equal(runtime.scheduleTimestamp('2026-07-01','20:00'),Date.parse('2026-07-01T18:00:00Z'));
  assert.equal(runtime.scheduleTimestamp('2026-11-02','20:00'),Date.parse('2026-11-02T19:00:00Z'));
  assert.equal(runtime.scheduleTimestamp('2026-10-25','02:30',false),Date.parse('2026-10-25T00:30:00Z'));
  assert.equal(runtime.scheduleTimestamp('2026-10-25','02:30',true),Date.parse('2026-10-25T01:30:00Z'));
  assert.throws(()=>runtime.scheduleTimestamp('2026-03-29','02:30'),/Zeitumstellung/);
});

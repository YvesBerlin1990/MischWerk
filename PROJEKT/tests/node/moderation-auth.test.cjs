const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
function fixture(options) {
 const h=createHarness(undefined,options),owner=h.user(1,'Otterchen','owner'),dj=h.user(2,'DJ'),listener=h.user(3,'Hörer');
 const os=h.open(owner),ds=h.open(dj),ls=h.open(listener);h.event(owner,os,'mw:addRadioModerator',{nick:'DJ'});
 return {h,owner,dj,listener,os,ds,ls};
}
const result=events=>events.findLast(e=>e.type==='mw:result')?.data;
const login=f=>result(f.h.event(f.dj,f.ds,'mw:onAir',{}));
test('Native Anmeldung ohne PIN startet sofort, aktiviert Wünsche und erzeugt keine Hasharbeit',()=>{
 const f=fixture({autoPin:false}),{h,dj,ds,listener,ls}=f;
 assert.equal(login(f).ok,true);assert.equal(h.state(dj,ds).user.canUseModeration,true);
 assert.equal(h.state(listener,ls).requestsEnabled,true);assert.equal(h.bot.messages.length,1);
 assert.equal([...h.timers.values()].some(t=>t.callback.name==='moderationPinStep'),false);
 assert.deepEqual(h.store.data['mischwerk.state.v1'].moderatorPins,{});
 assert.equal('pinSetupRequired' in h.state(dj,ds).user,false);
 assert.equal('moderationPinVerified' in h.state(dj,ds).user,false);
 assert.equal('pinProof' in h.store.data['mischwerk.state.v1'].moderator,false);
});
test('Öffnen und Aktualisieren starten keine Sendung; Thema und fremde Wünsche bleiben vorher gesperrt',()=>{
 const {h,dj,ds,listener,ls}=fixture();assert.equal(h.state(dj,ds).moderator,null);
 assert.equal(h.state(listener,ls).requestsEnabled,false);assert.equal(h.bot.messages.length,0);
 assert.equal(result(h.event(dj,ds,'mw:setTopic',{topic:'Zu früh'})).ok,false);
 assert.equal(result(h.event(dj,ds,'mw:setRequests',{enabled:true})).ok,false);
 assert.equal(h.state(dj,ds).queueTotal,0);
});
for(const role of ['listener','moderator','manager'])test('Native Anmeldung bleibt ohne Radioernennung gesperrt: '+role,()=>{
 const f=fixture(),person=f.h.user(4,'Andere Rolle',role),session=f.h.open(person);
 assert.equal(result(f.h.event(person,session,'mw:onAir',{authentication:'knuddels',nativeSession:true,canModerate:true})).ok,false);
 assert.equal(f.h.state(f.dj,f.ds).moderator,null);
});
for(const mode of ['geschlossen','fremd','verlassen','entzug','shutdown'])test('Native Anmeldung prüft Sitzung und Rechte erneut: '+mode,()=>{
 const f=fixture(),{h,dj,ds,owner,os}=f;
 if(mode==='geschlossen')ds.nativeClose(false);
 if(mode==='fremd'){h.event(owner,ds,'mw:onAir',{});assert.equal(h.state(dj,ds).moderator,null);return;}
 if(mode==='verlassen'){dj.online=false;h.app.onUserLeft(dj);}
 if(mode==='entzug')h.event(owner,os,'mw:removeRadioModerator',{userId:2});
 if(mode==='shutdown')h.app.onPrepareShutdown();
 assert.notEqual(login(f)?.ok,true);assert.equal(h.store.data['mischwerk.state.v1'].moderator,null);
});
test('Veraltete native PIN-Anfragen mutieren nichts; PIN-Felder beim direkten Start werden verworfen',()=>{
 const f=fixture(),{h,dj,ds}=f;
 assert.equal(result(h.event(dj,ds,'mw:pin.login',{pin:'001234',pinConfirmation:'001234'})).ok,false);
 assert.equal(h.state(dj,ds).moderator,null);
 assert.equal(result(h.event(dj,ds,'mw:onAir',{pin:'001234',pinConfirmation:'001234'})).ok,true);
 assert.doesNotMatch(JSON.stringify(h.store.data)+JSON.stringify(h.logs)+JSON.stringify(ds.events),/001234/);
});
test('Gespeicherte Website-PIN und Fehlversuchssperre bleiben bei nativer Anmeldung unverändert',()=>{
 const f=fixture(),saved=f.h.store.data['mischwerk.state.v1'];
 const pin={algorithm:'bcrypt-10',salt:'000102030405060708090a0b0c0d0e0f',hash:'6b1efc45725197bde80955c1acfeac18b1f292f408acaa',failures:5,blockedUntil:f.h.now()+300000};
 saved.moderatorPins.u2=pin;
 const h=createHarness(f.h.store),dj=h.user(2,'DJ'),ds=h.open(dj);
 assert.equal(result(h.event(dj,ds,'mw:onAir',{})).ok,true);
 assert.deepEqual(h.store.data['mischwerk.state.v1'].moderatorPins.u2,pin);
});
test('Native Abmeldung, erneute Anmeldung und Wiederholung erhalten die bestehenden Studioregeln',()=>{
 const f=fixture(),{h,dj,ds,listener,ls}=f;assert.equal(login(f).ok,true);
 h.event(dj,ds,'mw:setTopic',{topic:'Meine Sendung'});h.event(listener,ls,'mw:wish.submit',{text:'Bleibender Wunsch',submissionId:'native-kept'});
 const before=h.store.getObject('mischwerk.state.v1');assert.equal(login(f).ok,true);
 assert.deepEqual(h.store.getObject('mischwerk.state.v1'),before);assert.equal(h.bot.messages.length,1);
 h.event(dj,ds,'mw:offAir',{});assert.equal(h.state(listener,ls).requestsEnabled,false);assert.equal(h.state(dj,ds).topic,'');
 assert.equal(login(f).ok,true);assert.equal(h.state(dj,ds).queueTotal,1);
});
test('Native Übernahme benötigt weiterhin eine passende bestätigte Übergabe',()=>{
 const f=fixture(),{h,owner,os,dj,ds}=f;h.event(owner,os,'mw:onAir',{});
 assert.equal(login(f).ok,false);h.event(owner,os,'mw:handover.request',{nick:'DJ',expectedModerator:h.state(owner,os).moderator.sessionKey,notes:'Bleibt privat'});
 const id=h.state(dj,ds).handover.incoming.id;
 assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id:'falsch'})).ok,false);
 assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id,topic:'Neue Sendung'})).ok,true);
 assert.equal(h.state(dj,ds).user.canUseModeration,true);assert.equal(h.state(dj,ds).handover.receivedNotes,'Bleibt privat');assert.equal(h.bot.messages.length,2);
});
test('Speicherfehler bestätigen weder native Anmeldung noch Übergabe',()=>{
 const f=fixture(),write=f.h.store.setObject;f.h.store.setObject=()=>{throw Error('Abbruch');};
 assert.equal(login(f).ok,false);assert.equal(f.h.state(f.dj,f.ds).moderator,null);assert.equal(f.h.bot.messages.length,0);
 f.h.store.setObject=write;assert.equal(login(f).ok,true);
});
test('Neustart erhält eine berechtigte native Sendung ohne PIN und ohne zweite Beginnmeldung',()=>{
 const f=fixture();login(f);f.h.event(f.dj,f.ds,'mw:setTopic',{topic:'Sendung bleibt'});
 const before=f.h.store.getObject('mischwerk.state.v1').moderator;
 const h=createHarness(f.h.store,{users:[{id:2,nick:'DJ'}]}),dj=h.user(2,'DJ'),ds=h.open(dj);
 assert.equal(h.state(dj,ds).user.canUseModeration,true);assert.equal(h.state(dj,ds).topic,'Sendung bleibt');
 assert.deepEqual(h.store.getObject('mischwerk.state.v1').moderator,before);assert.equal(h.bot.messages.length,0);
});
test('Verlassen und Rechteentzug beenden auch eine native Sendung ohne PIN',()=>{
 for(const mode of ['verlassen','entzug']){const f=fixture();login(f);
 if(mode==='verlassen'){f.dj.online=false;f.h.app.onUserLeft(f.dj);}else f.h.event(f.owner,f.os,'mw:removeRadioModerator',{userId:2});
 assert.equal(f.h.state(f.owner,f.os).moderator,null);assert.equal(f.h.state(f.listener,f.ls).requestsEnabled,false);}
});

test('bcrypt-Kern entspricht dem unabhängigen bcrypt.js-Referenzvektor mit Kostenfaktor 10', () => {
  const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),scope={MischWerkModules:{}};
  for(const file of ['pin-constants-1','pin-constants-2','pin-bcrypt'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../src/backend/core',file+'.js'),'utf8'),scope);
  const r={};scope.MischWerkModules.attachPinConstants1(r);scope.MischWerkModules.attachPinConstants2(r);scope.MischWerkModules.attachPinBcrypt(r);
  r.now=Date.now;
  const work=r.createPinBcrypt('2:0123',Array.from({length:16},(_,i)=>i));let output=null,steps=0;
  while(!output){output=work.step();steps++;assert.ok(steps<=1024);}
  assert.ok(steps>=16&&steps<64,'Unveränderte bcrypt-10-Arbeit mit weniger Timerpausen als zuvor');
  assert.equal(output.map(x=>x.toString(16).padStart(2,'0')).join(''),'6b1efc45725197bde80955c1acfeac18b1f292f408acaa');
});


test('Bestehende gültige PIN-Sendung bleibt beim Update aktiv; ungültige Altbelege werden nicht wiederbelebt',()=>{
 for(const valid of [true,false]){
 const f=fixture(),saved=f.h.store.getObject('mischwerk.state.v1'),salt='000102030405060708090a0b0c0d0e0f';
 saved.moderatorPins.u2={algorithm:'bcrypt-10',salt,hash:'6b1efc45725197bde80955c1acfeac18b1f292f408acaa',failures:0,blockedUntil:0};
 saved.moderator={userId:2,nick:'DJ',since:f.h.now()-1000,sessionKey:'legacy-show',pinProof:valid?salt:'ungültig'};saved.topic='Alte Sendung';saved.requestsEnabled=true;
 f.h.store.setObject('mischwerk.state.v1',saved);
 const h=createHarness(f.h.store,{users:[{id:2,nick:'DJ'}]}),dj=h.user(2,'DJ'),ds=h.open(dj),state=h.state(dj,ds);
 assert.equal(state.user.canUseModeration,valid);assert.equal(state.requestsEnabled,valid);assert.equal(h.bot.messages.length,0);
 if(valid){assert.equal(state.moderator.sessionKey,'legacy-show');assert.equal(state.topic,'Alte Sendung');}
 assert.deepEqual(h.store.getObject('mischwerk.state.v1').moderatorPins,saved.moderatorPins);
 }
});

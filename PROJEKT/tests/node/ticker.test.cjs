const test = require('node:test');
const assert = require('node:assert/strict');
const {createHarness} = require('../support/knuddels.cjs');
const result = events => events.findLast(e=>e.type==='mw:result')?.data;
function fixture() {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner'),dj=h.user(2,'Radiofreund'),listener=h.user(3,'Musikfreund');
  const os=h.open(owner),ds=h.open(dj),ls=h.open(listener);
  assert.equal(result(h.event(owner,os,'mw:addRadioModerator',{nick:dj.nick})).ok,true);
  h.event(dj,ds,'mw:openStudio');const studio=dj.sessions.find(s=>s.activeView==='studio');
  let sequence=0;
  const save=(data={},person=dj,session=studio)=>result(h.event(person,session,'mw:setTicker',{
    view:'studio',viewRevision:1,requestId:'ticker-'+(++sequence),expectedTickerRevision:h.state(person,session).ticker.revision,
    text:'Radio MischWerk: Dein Abend mit Musik.',speed:48,direction:'left',enabled:true,...data
  }));
  return {h,owner,dj,listener,os,ds,ls,studio,save};
}
test('Lauftext startet leer und aus; ernannter Radiomoderator speichert für alle ohne Studioanmeldung',()=>{
  const f=fixture();assert.deepEqual(f.h.state(f.listener,f.ls).ticker,{text:'',enabled:false,speed:48,direction:'left',revision:0});
  assert.equal(f.save({text:'  Deine Musik\n bei MischWerk  ',speed:32,direction:'right'}).ok,true);
  const state=f.h.state(f.listener,f.ls);
  assert.deepEqual(state.ticker,{text:'Deine Musik bei MischWerk',enabled:true,speed:32,direction:'right',revision:1});
  assert.equal(state.moderator,null);assert.deepEqual(f.h.bot.messages,[]);
  const restarted=createHarness(f.h.store),person=restarted.user(3,'Musikfreund'),session=restarted.open(person);
  assert.deepEqual(restarted.state(person,session).ticker,state.ticker);assert.equal(session.content.height,220);
});
test('Lauftextänderung braucht aktuelle Studioansicht und Radiorecht; MCM, Hörer und Appmanager reichen nicht',()=>{
  const f=fixture(),before=JSON.stringify(f.h.store.data);
  for(const [index,role] of ['listener','moderator','manager','developer'].entries()){
    const person=f.h.user(10+index,role,role),session=f.h.open(person);
    assert.equal(f.save({canModerate:true,isChannelModerator:true},person,session).ok,false);
  }
  assert.equal(f.save({},f.dj,f.ds).ok,false);
  assert.equal(f.save({viewRevision:0}).ok,false);assert.equal(f.save({view:'radio'}).ok,false);
  assert.equal(JSON.stringify(f.h.store.data),before);
  f.h.event(f.owner,f.os,'mw:openStudio');const ownerStudio=f.owner.sessions.find(s=>s.activeView==='studio');
  assert.equal(f.save({},f.owner,ownerStudio).ok,true,'Bestehendes automatisches Inhaberrecht');
  f.h.event(f.owner,f.os,'mw:removeRadioModerator',{userId:f.dj.id});
  assert.ok(!f.save({},f.dj,f.studio)?.ok);
});
test('Lauftext validiert Text, Tempo, Richtung, Ein/Aus, Revision und Anfragekennung streng',()=>{
  const f=fixture();
  for(const data of [{text:''},{text:' '.repeat(20)},{text:'x'.repeat(301)},{text:null},{enabled:'true'},
    {speed:0},{speed:49},{speed:'48'},{direction:'up'},{direction:null},{expectedTickerRevision:'0'},{expectedTickerRevision:undefined},{requestId:''}]){
    assert.equal(f.save(data).ok,false,JSON.stringify(data));assert.equal(f.h.state(f.listener,f.ls).ticker.revision,0);
  }
  assert.equal(f.save({enabled:false,text:''}).ok,true);
  assert.equal(f.save({text:'<script>alert(1)</script> °R° _Text_',speed:72}).ok,true,'Text wird als Text gespeichert');
});
test('Gleichzeitige Lauftextentwürfe überschreiben sich nicht; bestätigte doppelte Anfrage mutiert nicht erneut',()=>{
  const f=fixture();const data={requestId:'same-request',expectedTickerRevision:0};
  assert.equal(f.save(data).ok,true);const before=JSON.stringify(f.h.store.data);
  assert.equal(f.save(data).ok,true);assert.equal(JSON.stringify(f.h.store.data),before);
  assert.equal(f.save({...data,text:'Anderer Text'}).ok,false);
  assert.equal(f.save({expectedTickerRevision:0}).ok,false);assert.equal(JSON.stringify(f.h.store.data),before);
  assert.equal(f.save({text:'Neuer bestätigter Stand'}).ok,true);
});
test('Lauftext-Speicherfehler erhalten alten Stand und erlauben dieselbe Anfrage nach Behebung',()=>{
  const f=fixture(),write=f.h.store.setObject;
  f.h.store.setObject=()=>{throw Error('private-ticker-secret');};
  const data={requestId:'retry-after-error',expectedTickerRevision:0};assert.equal(f.save(data).ok,false);
  assert.equal(f.h.state(f.listener,f.ls).ticker.enabled,false);
  f.h.store.setObject=write;assert.equal(f.save(data).ok,true);
  assert.ok(!JSON.stringify(f.h.logs).includes('private-ticker-secret'));
});
test('Ausgeschalteter Lauftext behält Inhalt, Tempo und Richtung; neue Leiste verwendet die bisherige Höhe',()=>{
  const f=fixture();f.save({speed:72,direction:'right'});const old=f.h.state(f.listener,f.ls).ticker;
  assert.equal(f.save({enabled:false,speed:72,direction:'right'}).ok,true);
  const state=f.h.state(f.listener,f.ls).ticker;assert.equal(state.text,old.text);assert.equal(state.speed,72);assert.equal(state.direction,'right');
  const newUser=f.h.user(33,'Neu');assert.equal(f.h.open(newUser).content.height,176);
  const foreign=f.h.event(f.listener,f.studio,'mw:setTicker',{view:'studio',viewRevision:1});assert.deepEqual(foreign,[]);
  f.h.app.onPrepareShutdown();assert.equal(f.save().ok,false);
});
test('Erfolgreiche Lauftextanfragen bleiben auf 32 Wiederholungsmarker begrenzt',()=>{
  const f=fixture();for(let i=0;i<33;i++)assert.equal(f.save({requestId:'bounded-'+i,text:'Text '+i}).ok,true);
  assert.equal(f.save({requestId:'bounded-32',text:'Text 32',expectedTickerRevision:32}).ok,true);
  assert.equal(f.save({requestId:'bounded-0',text:'Text 0',expectedTickerRevision:0}).ok,false);
  assert.equal(f.h.state(f.listener,f.ls).ticker.revision,33);
});

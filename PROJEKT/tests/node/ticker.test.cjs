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

test('/lauftext setzt und aktiviert ohne Moderationsfenster; Anzeigezeichen werden genau einmal ergänzt',()=>{
 const f=fixture();f.h.app.chatCommands.lauftext(f.dj,'+++ Dein Radio C++ +++');
 assert.match(f.dj.messages.at(-1),/eingeschaltet/);
 assert.deepEqual(f.h.state(f.listener,f.ls).ticker,{text:'Dein Radio C++',enabled:true,speed:48,direction:'left',revision:1});
 const before=JSON.stringify(f.h.store.data);f.h.app.chatCommands.lauftext(f.dj,'Dein Radio C++');assert.equal(JSON.stringify(f.h.store.data),before);
 f.h.app.chatCommands.lauftext(f.dj,'--aus');assert.equal(f.h.state(f.listener,f.ls).ticker.enabled,false);
 assert.equal(f.h.state(f.listener,f.ls).ticker.text,'Dein Radio C++');f.h.app.chatCommands.lauftext(f.dj,'--an');assert.equal(f.h.state(f.listener,f.ls).ticker.enabled,true);
 const h=createHarness(f.h.store),listener=h.user(3,'Musikfreund'),session=h.open(listener);assert.equal(h.state(listener,session).ticker.text,'Dein Radio C++');assert.equal(session.content.height,220);
});
test('/lauftext prüft echte Rechte, Channelanwesenheit und Shutdown ohne öffentliche Nachricht',()=>{
 const f=fixture();for(const [i,role] of ['listener','moderator','manager','developer'].entries()){
  const person=f.h.user(i+10,role,role);f.h.app.chatCommands.lauftext(person,'Unerlaubt');assert.match(person.messages.at(-1),/Nur Radiomoderatoren/);
  f.h.app.chatCommands.lauftext(person,'--tempo schnell');assert.match(person.messages.at(-1),/Nur Radiomoderatoren/);
 }
 f.dj.online=false;f.h.app.chatCommands.lauftext(f.dj,'Abwesend');assert.match(f.dj.messages.at(-1),/MischWerk-Channel/);f.dj.online=true;
 f.h.app.chatCommands.lauftext(f.owner,'Erlaubt');assert.equal(f.h.state(f.listener,f.ls).ticker.text,'Erlaubt');assert.deepEqual(f.h.bot.messages,[]);
 f.h.app.onPrepareShutdown();f.h.app.chatCommands.lauftext(f.owner,'Zu spät');assert.match(f.owner.messages.at(-1),/neu gestartet/);
});

test('/lauftext zeigt Status, Ein/Aus und alle Tempostufen ohne Änderung oder zusätzliches Fenster',()=>{
 const f=fixture();f.save({text:'Bestehender Lauftext C++',enabled:false,speed:72,direction:'right'});
 const before=JSON.stringify(f.h.store.data),events=f.ls.events.length,sessions=f.dj.sessions.length;
 for(const input of ['', '   ', '--hilfe']){
  f.h.app.chatCommands.lauftext(f.dj,input);const message=f.dj.messages.at(-1);
  assert.match(message,/ausgeschaltet/);assert.match(message,/72 px\/s/);
  for(const option of ['--an','--aus','--tempo langsam','--tempo normal','--tempo schnell'])assert.ok(message.includes(option),option);
  assert.equal(JSON.stringify(f.h.store.data),before);assert.equal(f.ls.events.length,events);assert.equal(f.dj.sessions.length,sessions);
 }
});

test('/lauftext --tempo ändert ausschließlich die Geschwindigkeit und erhält Text, Ein/Aus, Richtung und Neustart',()=>{
 const f=fixture();f.save({text:'Bestehender Lauftext C++',enabled:false,speed:48,direction:'right'});
 for(const [option,speed] of [['langsam',32],['normal',48],['schnell',72],['32',32],['48',48],['72',72]]){
  f.h.app.chatCommands.lauftext(f.dj,'--tempo '+option);const value=f.h.state(f.listener,f.ls).ticker;
  assert.equal(value.speed,speed);assert.equal(value.enabled,false);assert.equal(value.text,'Bestehender Lauftext C++');assert.equal(value.direction,'right');
  assert.match(f.dj.messages.at(-1),new RegExp(speed+' px/s'));
 }
 const before=JSON.stringify(f.h.store.data),events=f.ls.events.length;
 f.h.app.chatCommands.lauftext(f.dj,'--tempo schnell');assert.equal(JSON.stringify(f.h.store.data),before);assert.equal(f.ls.events.length,events);
 f.h.app.chatCommands.lauftext(f.dj,'--an');f.h.app.chatCommands.lauftext(f.dj,'--tempo langsam');
 const value=f.h.state(f.listener,f.ls).ticker;assert.equal(value.enabled,true);assert.equal(value.speed,32);assert.equal(value.direction,'right');
 const restarted=createHarness(f.h.store),listener=restarted.user(3,'Musikfreund'),session=restarted.open(listener);
 assert.deepEqual(restarted.state(listener,session).ticker,value);assert.equal(session.content.height,220);
 f.h.app.chatCommands.lauftext(f.dj,'Neuer Text');assert.equal(f.h.state(f.listener,f.ls).ticker.speed,32);
});

test('/lauftext --tempo erlaubt eine Voreinstellung bei leerem Text und weist ungültige Werte ohne Änderung ab',()=>{
 const f=fixture();f.h.app.chatCommands.lauftext(f.owner,'--tempo langsam');
 assert.deepEqual(f.h.state(f.listener,f.ls).ticker,{text:'',enabled:false,speed:32,direction:'left',revision:1});
 const before=JSON.stringify(f.h.store.data);
 for(const input of ['--tempo','--tempo 0','--tempo 49','--tempo 48.0','--tempo 32 extra','--tempo -72','--tempo sehr schnell']){
  f.h.app.chatCommands.lauftext(f.dj,input);assert.equal(JSON.stringify(f.h.store.data),before,input);assert.match(f.dj.messages.at(-1),/--tempo/);
 }
 f.h.app.chatCommands.lauftext(f.dj,'--an');assert.equal(JSON.stringify(f.h.store.data),before,'Leeren Text weiterhin nicht einschalten');
 f.h.app.chatCommands.lauftext(f.dj,'+++ Radio C++ +++');assert.equal(f.h.state(f.listener,f.ls).ticker.speed,32);
 assert.equal(f.h.state(f.listener,f.ls).ticker.text,'Radio C++');
});
test('/lauftext verwirft leere Dekoration, Überlänge und falsche Optionen und bewahrt Tempo/Richtung',()=>{
 const f=fixture();for(const text of ['', ' ', '+++', '+++ +++', 'x'.repeat(301),'--falsch','--an']){
  f.h.app.chatCommands.lauftext(f.dj,text);assert.equal(f.h.state(f.listener,f.ls).ticker.revision,0,text);
 }
 f.save({speed:72,direction:'right'});f.h.app.chatCommands.lauftext(f.dj,'x'.repeat(300));const state=f.h.state(f.listener,f.ls).ticker;
 assert.equal(state.text.length,300);assert.equal(state.speed,72);assert.equal(state.direction,'right');
});
test('/lauftext bestätigt keine Speicherung bei Fehler und veröffentlicht nur atomar bestätigte Werte',()=>{
 const f=fixture();f.h.app.chatCommands.lauftext(f.dj,'Vorher');const write=f.h.store.setObject;
 f.h.store.setObject=()=>{throw Error('private-command-secret');};f.h.app.chatCommands.lauftext(f.dj,'Nachher');
 assert.doesNotMatch(f.dj.messages.at(-1),/eingeschaltet|private-command-secret/);assert.equal(f.h.state(f.listener,f.ls).ticker.text,'Vorher');
 f.h.app.chatCommands.lauftext(f.dj,'--tempo schnell');assert.equal(f.h.state(f.listener,f.ls).ticker.speed,48);
 assert.doesNotMatch(f.dj.messages.at(-1),/72 px\/s|private-command-secret/);
 f.h.store.setObject=write;f.h.app.chatCommands.lauftext(f.dj,'Nachher');assert.equal(f.h.state(f.listener,f.ls).ticker.text,'Nachher');
});

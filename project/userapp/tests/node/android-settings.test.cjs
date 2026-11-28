// Verbindungseinstellungen über den Verwaltungsreiter (/mw admin) prüfen.
const test = require('node:test');
const assert = require('node:assert/strict');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const key='mischwerk.android.private.v1',sync='s'.repeat(64),relay='r'.repeat(64);
function fixture(initial){
 const h=createHarness(persistence(initial?{[key]:initial}:{})),owner=h.user(1,'Otterchen','owner');
 const session=openConnection(h,owner);
 assert.ok(session,'Verwaltung mit Verbindungsreiter geöffnet');
 return {h,owner,session,call(type,data={},person=owner,from=session){return h.event(person,from,'mw:androidSettings.'+type,data);},save(data={}){return this.call('save',{revision:0,requestId:'save-1',syncSecret:sync,relaySecret:'',...data});}};
}
function last(events){return events.at(-1)?.data;}
function openConnection(h,user){
 h.app.chatCommands.mw(user,'admin');const team=user.sessions.find(s=>s.content.htmlFile.pageData.view==='team');
 if(team)h.event(user,team,'mw:androidSettings.status',{});return team;
}

test('Verwaltungszugriff auf Einstellungen prüft echte Ansicht, Inhaber und Frist erneut',()=>{
 const h=createHarness(persistence({[key]:{enabled:true,runtimeVerified:true,syncSecret:sync,relaySecret:relay,revision:4}}));
 const owner=h.user(1,'Otterchen','owner'),radio=h.open(owner),before=JSON.stringify(h.store.data[key]);
 h.event(owner,radio,'mw:androidSettings.status',{view:'team'});assert.equal(radio.events.length,0);
 h.event(owner,radio,'mw:androidSettings.save',{revision:4,requestId:'forged',syncSecret:'n'.repeat(64)});
 assert.equal(JSON.stringify(h.store.data[key]),before);
 h.app.chatCommands.mw(owner,'admin');const team=owner.sessions.find(s=>s.content.htmlFile.pageData.view==='team');
 assert.equal(last(h.event(owner,team,'mw:androidSettings.status',{})).ok,true);
 h.advance(600001);h.event(owner,team,'mw:androidSettings.save',{revision:4,requestId:'expired',syncSecret:'n'.repeat(64)});
 assert.equal(JSON.stringify(h.store.data[key]),before);
 assert.equal(last(h.event(owner,team,'mw:androidSettings.status',{})).ok,true,'Aktualisieren erneuert die private Leseberechtigung');
 owner.nick='Anderer Inhaber';h.event(owner,team,'mw:androidSettings.save',{revision:4,requestId:'renamed',syncSecret:'n'.repeat(64)});
 assert.equal(JSON.stringify(h.store.data[key]),before);
});
test('Verbindung ist nur für anwesende Konsolenberechtigte verfügbar',()=>{
 const h=createHarness();for(const [i,role] of ['listener','moderator','manager','developer'].entries()){
  const p=h.user(10+i,role,role);assert.equal(openConnection(h,p),undefined);
 }
 const owner=h.user(1,'Otterchen','owner');owner.online=false;assert.equal(openConnection(h,owner),undefined);
 const polaroid=h.user(4,'Polaroid');const team=openConnection(h,polaroid);assert.ok(team);assert.equal(team.events.at(-1).data.ok,true);
});
test('Private Ansicht und Status enthalten nur öffentliche Zieladresse, Revision und Vorhandenseinsflags',()=>{
 const f=fixture({enabled:false,syncSecret:sync,relaySecret:relay,revision:4});
 const data=f.session.content.htmlFile.pageData;
 assert.equal(data.view,'team');assert.equal(f.session.content.viewMode,'Overlay');
 assert.doesNotMatch(JSON.stringify(data),new RegExp(sync+'|'+relay));
 const status=last(f.call('status'));assert.equal(status.ok,true);assert.equal(status.state.revision,4);
 assert.equal(status.state.hasSyncSecret,true);assert.equal(status.state.hasRelaySecret,true);
 assert.doesNotMatch(JSON.stringify(status),new RegExp(sync+'|'+relay));
});
test('Sync allein wird serverseitig gespeichert, ohne Transport, Hook, Timer oder Wunschänderung',()=>{
 const f=fixture(),before=f.h.bot.messages.length;
 const result=last(f.save());assert.equal(result.ok,true);
 const stored=f.h.store.data[key];assert.equal(stored.syncSecret,sync);assert.equal(stored.relaySecret,undefined);
 assert.equal(stored.enabled,false);assert.equal(stored.runtimeVerified,false);assert.equal(stored.revision,1);
 assert.equal(stored.syncUrl,'https://radio-mischwerk.web.app/api/publishKnuddelsState');
 assert.equal(f.h.timers.size,0);assert.equal(f.h.updateCalls.length,0);assert.equal(f.h.bot.messages.length,before);
 assert.doesNotMatch(JSON.stringify(f.session.events),new RegExp(sync));
});
test('Fremde, veraltete und normale Radio-Sitzungen dürfen keine Schlüssel setzen',()=>{
 const f=fixture(),other=f.h.user(2,'Andere','owner'),data={revision:0,requestId:'save-1',syncSecret:sync,relaySecret:''};
 f.h.open(f.owner);const radio=f.owner.sessions.find(s=>s.content.viewMode==='Headerbar');
 f.call('save',data,other,f.session);f.call('save',data,f.owner,radio);assert.equal(f.h.store.data[key],undefined);
 f.session.nativeClose(false);f.call('save',data);assert.equal(f.h.store.data[key],undefined);
});
test('Rechteverlust und Channelverlassen werden bei jeder Einstellung geprüft',()=>{
 for(const mode of ['role','online']){const f=fixture();if(mode==='role')f.owner.role='manager';else f.owner.online=false;f.save();assert.equal(f.h.store.data[key],undefined);}
});
test('Zusatzfelder, manipulierte Flags/Ziele, identische und ungültige Schlüssel werden abgewiesen',()=>{
 for(const change of [{enabled:true},{runtimeVerified:true},{syncUrl:'https://evil.invalid'}, {syncSecret:'short'},{relaySecret:sync},{relaySecret:'bad'}]){
  const f=fixture();assert.equal(last(f.save(change)).ok,false);assert.equal(f.h.store.data[key],undefined);
 }
});
test('Leere Eingaben erhalten vorhandene Schlüssel; Änderung setzt die Aktivierung zurück',()=>{
 const f=fixture({enabled:true,runtimeVerified:false,syncSecret:sync,relaySecret:relay,revision:3});
 assert.equal(last(f.save({revision:3,syncSecret:'',relaySecret:''})).ok,true);
 assert.equal(f.h.store.data[key].syncSecret,sync);assert.equal(f.h.store.data[key].relaySecret,relay);
 assert.equal(f.h.store.data[key].enabled,false);assert.equal(f.h.store.data[key].runtimeVerified,false);
});
test('Veraltete Revision und wiederholte Anfrage schreiben nicht erneut',()=>{
 const f=fixture();assert.equal(last(f.save()).ok,true);
 const saved=JSON.stringify(f.h.store.data[key]);assert.equal(last(f.save({revision:1})).ok,false);
 assert.equal(last(f.save({requestId:'save-2',syncSecret:relay})).ok,false);assert.equal(JSON.stringify(f.h.store.data[key]),saved);
});
test('Speicherfehler zeigen keine Secrets oder internen Details',()=>{
 const f=fixture();f.h.store.setObject=()=>{throw Error(sync+' private details');};
 const result=last(f.save());assert.equal(result.ok,false);assert.doesNotMatch(JSON.stringify(result),new RegExp(sync+'|private details'));
 assert.doesNotMatch(JSON.stringify(f.h.logs),new RegExp(sync+'|private details'));
});
test('Schließen, Ablauf und Shutdown beenden die private Einstellungsberechtigung',()=>{
 for(const action of ['close','expire','shutdown','leave']){const f=fixture();
  if(action==='close')f.session.nativeClose(false);if(action==='expire')f.h.advance(600001);if(action==='shutdown')f.h.app.onPrepareShutdown();if(action==='leave')f.h.app.onUserLeft(f.owner);
  f.save();assert.equal(f.h.store.data[key],undefined);
 }
});
test('Ungültige Plattform-Sitzung wirft nichts; aktuelle Wrapper derselben Sitzung funktionieren',()=>{
 const f=fixture();assert.doesNotThrow(()=>f.call('status',{},f.owner,{}));
 assert.doesNotThrow(()=>f.call('status',{},f.owner,{getAppContent(){throw Error('private details');}}));
 const alias=Object.create(f.session);alias.events=[];assert.equal(last(f.call('status',{},f.owner,alias)).ok,true);
});
test('Channelverlassen entfernt private Berechtigung auch bei Fehler im allgemeinen Zustand',()=>{
 let runtime;const h=createHarness(undefined,{configureModules(c){const attach=c.MischWerkModules.attachLifecycle;c.MischWerkModules.attachLifecycle=(r,config)=>{attach(r,config);runtime=r;};}});
 const owner=h.user(1,'Otterchen','owner');const session=openConnection(h,owner);
 runtime.load=()=>{throw Error('storage offline');};h.app.onUserLeft(owner);assert.equal(session.removed,true);
});
test('Fehler beim privaten Statuslesen antworten auf dem Statuskanal ohne interne Details',()=>{
 const f=fixture();f.h.store.getObject=()=>{throw Error('private-read-details');};const events=f.call('status');
 assert.equal(events.at(-1).type,'mw:androidSettings.status');assert.equal(last(events).ok,false);
 assert.doesNotMatch(JSON.stringify(events),/private-read-details/);
});

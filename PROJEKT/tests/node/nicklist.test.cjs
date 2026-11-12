const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const key = 'mischwerk.nicklist-icons.v1';
const image = kind => 'https://mischwerk.invalid/img/nicklist/' + kind + '.png';
const icons = user => [...user.nicklistIcons.keys()].filter(url=>url.startsWith('https://mischwerk.invalid/')).map(url=>path.basename(url,'.png')).sort();
function fixture() {
  const h = createHarness(undefined,{users:[{id:1,nick:'Otterchen',role:'owner'},{id:2,nick:'DJ'},{id:3,nick:'Hörer'}]});
  const owner = h.user(1), dj = h.user(2), listener = h.user(3);
  const os = owner.sessions[0], ds = dj.sessions[0], ls = listener.sessions[0];
  const appoint = () => h.event(owner,os,'mw:addRadioModerator',{nick:dj.nick});
  const presence = (user,session,active,sequence) => h.event(user,session,'mw:listenerPresence',{active,sequence});
  return {h,owner,dj,listener,os,ds,ls,appoint,presence};
}
test('Gelieferte transparente PNGs mit 24 px Höhe und proportionalem MW-Zeichen und unverwechselbare Zielpfade sind inventarisiert',()=>{
  const hashes={team:'704c413878d750de5cc5e650b98a17664a2c981ef8baf38326998aa4b5175927',listener:'116b5e6bcc0aa246f8d630499c4fc46e6e2fe0971cd663d392bf59f30cde1709',moderator:'e3226d285d66bfa6cfd2c674eb48dc8a9e08f34d39eec231ce2299191ebb7fa2'};
  for (const kind of Object.keys(hashes)) {
    const app=process.env.MISCHWERK_TEST_UPLOAD||path.resolve(__dirname,'../../app');
    const bytes=fs.readFileSync(path.join(app,'www/img/nicklist',kind+'.png'));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),kind==='team'?32:24); assert.equal(bytes.readUInt32BE(20),24);
    assert.equal(bytes[25],6,'RGBA-PNG');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[kind]);
    assert.ok(require('../../tools/lib/frontend-files.cjs').frontendFiles.includes('img/nicklist/'+kind+'.png'));
  }
});
test('Gesamte Anzeigematrix, Priorität Mikrofon und nur differenzielle API-Aufrufe',()=>{
  const {h,owner,dj,listener,os,ds,ls,appoint,presence}=fixture();
  assert.deepEqual(icons(listener),[]);assert.deepEqual(icons(dj),[]);assert.deepEqual(icons(owner),['team']);
  presence(listener,ls,true,1);assert.deepEqual(icons(listener),['listener']);
  appoint();assert.deepEqual(icons(dj),['team']);
  presence(dj,ds,true,1);assert.deepEqual(icons(dj),['listener','team']);
  h.event(dj,ds,'mw:onAir');assert.deepEqual(icons(dj),['moderator','team']);
  presence(dj,ds,false,2);assert.deepEqual(icons(dj),['moderator','team']);
  presence(dj,ds,true,3);assert.deepEqual(icons(dj),['moderator','team']);
  const count=dj.iconCalls.length; h.advance(20000);h.state(dj,ds);assert.equal(dj.iconCalls.length,count);
  h.event(dj,ds,'mw:offAir');assert.deepEqual(icons(dj),['listener','team']);
  assert.ok(dj.iconCalls.filter(c=>c.operation==='add').every(c=>c.width===(c.path===image('team')?32:24)));
  assert.equal(dj.nicklistIcons.size,2);
  presence(dj,ds,false,4);assert.deepEqual(icons(dj),['team']);
});
test('CM, Entwickler, Appmanager und ein falscher Inhaber erhalten kein Teamzeichen',()=>{
  const {h,owner,os,dj,appoint}=fixture();
  for(const [i,role] of ['moderator','developer','manager','owner'].entries()) {
    const user=h.user(10+i,'Andere Person '+i,role);h.app.onUserJoined(user);assert.deepEqual(icons(user),[]);
  }
  appoint();assert.deepEqual(icons(dj),['team']);
  h.event(owner,os,'mw:removeRadioModerator',{userId:dj.id});assert.deepEqual(icons(dj),[]);
  assert.deepEqual(Array.from(h.runtime.state.radioModeratorUserIds),[]);assert.deepEqual(icons(owner),['team']);
  owner.role='listener';h.advance(20000);assert.deepEqual(icons(owner),[]);
});
test('Hörerstatus verlangt aktuelle eigene Radiositzung, booleschen Wert und strikt steigende Sequenz',()=>{
  const {h,owner,listener,os,ls,presence}=fixture();
  for(const data of [{active:1,sequence:1},{active:true,sequence:0},{active:true,sequence:1.1},{active:true,sequence:Infinity},{active:true,sequence:9007199254740992}])h.event(listener,ls,'mw:listenerPresence',data);
  h.event(listener,os,'mw:listenerPresence',{active:true,sequence:1});assert.deepEqual(icons(listener),[]);
  presence(listener,ls,true,2);presence(listener,ls,false,2);presence(listener,ls,false,1);assert.deepEqual(icons(listener),['listener']);
  h.event(owner,os,'mw:openStudio');
  h.event(owner,owner.sessions[1],'mw:listenerPresence',{active:true,sequence:100,userId:listener.id,moderator:true});
  assert.deepEqual(icons(owner),['team']);
  presence(listener,ls,false,3);presence(listener,ls,true,2);assert.deepEqual(icons(listener),[]);
  h.event(listener,ls,'mw:refresh',{listenerPresence:{active:true,sequence:4},moderator:true,userId:owner.id});
  assert.deepEqual(icons(listener),['listener']);assert.deepEqual(icons(owner),['team']);
});
test('45 Sekunden ab Serverempfang; alte und doppelte Meldungen verlängern keine Frist',()=>{
  const {h,listener,ls,presence}=fixture();presence(listener,ls,true,1);h.advance(20000);
  h.event(listener,ls,'mw:refresh',{listenerPresence:{active:true,sequence:2},timestamp:1});h.advance(44999);
  presence(listener,ls,true,2);assert.deepEqual(icons(listener),['listener']);h.advance(1);assert.deepEqual(icons(listener),[]);
  presence(listener,ls,true,3);assert.deepEqual(icons(listener),['listener']);
});
test('Schließen oder Ersetzen der Radioansicht sperrt alte Pakete, Studioschließen erhält Mikrofon',()=>{
  const {h,owner,listener,os,ls,presence}=fixture();presence(listener,ls,true,1);
  const replacement=h.open(listener);assert.deepEqual(icons(listener),[]);
  presence(listener,ls,true,2);assert.deepEqual(icons(listener),[]);
  presence(listener,replacement,true,1);assert.deepEqual(icons(listener),['listener']);replacement.nativeClose();assert.deepEqual(icons(listener),[]);
  h.event(owner,os,'mw:onAir');h.event(owner,os,'mw:openStudio');
  owner.sessions[1].nativeClose();assert.deepEqual(icons(owner),['moderator','team']);
  os.nativeClose();assert.deepEqual(icons(owner),['moderator','team']);
});
test('Frische Plattformwrapper mit gleichem Öffnungszeitpunkt bleiben gültig',()=>{
  const {h,listener,ls,presence}=fixture();
  const wrapper={getUser:()=>listener,getAppContent:()=>ls.content,getOpenTimestamp:()=>ls.getOpenTimestamp()};
  presence(listener,wrapper,true,1);assert.deepEqual(icons(listener),['listener']);
  const old={...wrapper,getOpenTimestamp:()=>new Date(ls.getOpenTimestamp().getTime()-1)};
  presence(listener,old,false,2);assert.deepEqual(icons(listener),['listener']);
});
test('Angefragte, abgelehnte und fehlgeschlagen gespeicherte Übergabe verschieben kein Mikrofon',()=>{
  const {h,owner,dj,os,ds,appoint}=fixture();appoint();h.event(owner,os,'mw:onAir');
  const request=()=>{h.event(owner,os,'mw:handover.request',{nick:dj.nick,expectedModerator:h.runtime.moderatorKey()});return h.state(dj,ds).handover.incoming.id;};
  let id=request();assert.deepEqual(icons(owner),['moderator','team']);assert.deepEqual(icons(dj),['team']);
  h.event(dj,ds,'mw:handover.decline',{id});assert.deepEqual(icons(owner),['moderator','team']);
  id=request();const write=h.store.setObject;h.store.setObject=()=>{throw Error('commit failed');};
  h.event(dj,ds,'mw:handover.accept',{id,topic:'Neue Sendung'});assert.deepEqual(icons(owner),['moderator','team']);assert.deepEqual(icons(dj),['team']);
  h.store.setObject=write;h.event(dj,ds,'mw:handover.accept',{id,topic:'Neue Sendung'});
  assert.deepEqual(icons(owner),['team']);assert.deepEqual(icons(dj),['moderator','team']);
});
test('Commitfehler beim Ende erhält Mikrofon; fehlende Rechte werden ohne offenes Fenster erkannt',()=>{
  const {h,owner,dj,os,ds,appoint}=fixture();appoint();h.event(dj,ds,'mw:onAir');
  const write=h.store.setObject;h.store.setObject=()=>{throw Error('commit failed');};h.event(dj,ds,'mw:offAir');
  assert.deepEqual(icons(dj),['moderator','team']);h.store.setObject=write;
  // Entzug außerhalb des gerade offenen Fensters über dieselbe bestätigte Zustandsquelle.
  h.runtime.state.radioModeratorUserIds=[];h.advance(20000);assert.deepEqual(icons(dj),[]);assert.equal(h.runtime.state.moderator,null);
  assert.deepEqual(icons(owner),['team']);assert.equal(os.removed,false);
});
test('Vor add dauerhaft vormerken; Schreibfehler verhindert Hinzufügen und wird wiederholt',()=>{
  const {h,listener,ls,presence}=fixture();const write=listener.persistence.setObject;let fail=true;
  listener.persistence.setObject=(k,v)=>{if(fail)throw Error('save failed');write(k,v);};
  const add=listener.addNicklistIcon;listener.addNicklistIcon=function(url,width){assert.ok(this.persistence.getObject(key).paths.some(p=>p.path===url&&p.status==='possible'));add.call(this,url,width);};
  presence(listener,ls,true,1);assert.deepEqual(icons(listener),[]);assert.equal(listener.iconCalls.length,0);
  fail=false;h.advance(1000);assert.deepEqual(icons(listener),['listener']);
  assert.equal(listener.persistence.getObject(key).paths.length,1);
});
test('Exception nach möglicherweise erfolgreichem add wird erst bereinigt und dann neu gesetzt',()=>{
  const {h,listener,ls,presence}=fixture();const add=listener.addNicklistIcon;let fail=true;
  listener.nicklistIcons.set('https://other.invalid/foreign.png',17);
  listener.addNicklistIcon=function(url,width){add.call(this,url,width);if(fail)throw Error('uncertain add');};
  presence(listener,ls,true,1);assert.equal(listener.persistence.getObject(key).paths[0].status,'possible');
  fail=false;h.advance(1000);assert.deepEqual(listener.iconCalls.map(c=>c.operation),['add','remove','add']);
  assert.deepEqual(icons(listener),['listener']);assert.equal(listener.nicklistIcons.get('https://other.invalid/foreign.png'),17);
});
test('Fehlgeschlagene Entfernung hält Nachweis und Zwei-Icon-Limit; Wiederholung verwendet aktuellen Sollzustand',()=>{
  const {h,owner,os,presence}=fixture();h.event(owner,os,'mw:onAir');presence(owner,os,true,1);
  const remove=owner.removeNicklistIcon;let fail=true;
  owner.removeNicklistIcon=function(url){if(url===image('moderator')&&fail)throw Error('remove failed');remove.call(this,url);};
  h.event(owner,os,'mw:offAir');assert.deepEqual(icons(owner),['moderator','team']);
  assert.equal(owner.persistence.getObject(key).paths.find(p=>p.kind==='moderator').status,'remove');
  assert.ok(!owner.nicklistIcons.has(image('listener')));
  h.advance(1000);assert.equal(owner.nicklistIcons.size,2);fail=false;h.advance(2000);
  assert.deepEqual(icons(owner),['listener','team']);assert.ok(!owner.persistence.getObject(key).paths.some(p=>p.kind==='moderator'));
  h.event(owner,os,'mw:onAir');fail=true;h.event(owner,os,'mw:offAir');
  h.event(owner,os,'mw:onAir');fail=false;h.advance(1000);
  assert.deepEqual(icons(owner),['moderator','team']);h.advance(30000);assert.deepEqual(icons(owner),['moderator','team']);
});
test('Fehlgeschlagene Speicherung nach add erzeugt keine wiederholten Hinzufügungen',()=>{
  const {h,listener,ls,presence}=fixture();const write=listener.persistence.setObject;let attempts=0;
  listener.persistence.setObject=(k,v)=>{attempts++;if(attempts===2)throw Error('post-add write');write(k,v);};
  presence(listener,ls,true,1);h.advance(1000);assert.equal(listener.iconCalls.filter(c=>c.operation==='add').length,1);
  assert.equal(listener.persistence.getObject(key).paths[0].status,'set');
});
test('Neustart bereinigt vorgemerkte Altpfade vor Rekonstruktion und verlangt neue Hörermeldungen',()=>{
  const previous=fixture();previous.h.event(previous.owner,previous.os,'mw:onAir');
  const old=previous.owner.persistence.getObject(key);old.paths=old.paths.map(p=>({...p,path:p.path.replace('mischwerk.invalid','old-mischwerk.invalid')}));
  const store=persistence(previous.h.store.data);
  const order=[];
  const h=createHarness(store,{users:[{id:1,nick:'Otterchen',role:'owner'}],configureModules(scope){
    const attach=scope.MischWerkModules.attachNicklistStorage;
    scope.MischWerkModules.attachNicklistStorage=runtime=>{attach(runtime);const apply=runtime.applyNicklist;
      runtime.applyNicklist=(user,record,wanted)=>{if(!user.__seeded){user.__seeded=true;user.persistence.setObject(key,old);user.nicklistIcons.set(old.paths[0].path,20);user.nicklistIcons.set(old.paths[1].path,20);
        const remove=user.removeNicklistIcon,add=user.addNicklistIcon;user.removeNicklistIcon=function(url){order.push('remove');remove.call(this,url);};user.addNicklistIcon=function(url,w){order.push('add');add.call(this,url,w);};}
        return apply(user,record,wanted);};};
  }});
  assert.deepEqual(order,['remove','remove','add','add']);assert.deepEqual(icons(h.user(1)),['moderator','team']);
});
test('Verlassen, Wiederbeitritt, Nutzerlöschung und beide Shutdown-Hooks räumen eigene Icons auf',()=>{
  for(const action of ['leave','delete','prepare','shutdown']){
    const {h,owner,os,presence}=fixture();h.event(owner,os,'mw:onAir');presence(owner,os,true,1);
    owner.nicklistIcons.set('https://other.invalid/foreign.png',17);
    if(action==='leave'){owner.online=false;h.app.onUserLeft(owner);owner.online=true;h.app.onUserJoined(owner);assert.deepEqual(icons(owner),['team']);owner.online=false;h.app.onUserLeft(owner);}
    else if(action==='delete')h.app.onUserDeleted(owner.id);
    else if(action==='prepare')h.app.onPrepareShutdown();else h.app.onShutdown();
    assert.deepEqual(icons(owner),[]);assert.equal(owner.nicklistIcons.get('https://other.invalid/foreign.png'),17);
    assert.deepEqual(owner.persistence.getObject(key).paths,[]);
    if(['prepare','shutdown'].includes(action))assert.equal(h.timers.size,0);
  }
});
test('Shutdownfehler behält Altpfad; zweiter Hook und Wiederbeitritt können ihn bereinigen',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:onAir');const remove=owner.removeNicklistIcon;
  owner.removeNicklistIcon=()=>{throw Error('platform down');};h.app.onPrepareShutdown();
  assert.equal(owner.persistence.getObject(key).paths.length,2);assert.equal(h.timers.size,0);
  owner.removeNicklistIcon=remove;h.app.onShutdown();assert.deepEqual(icons(owner),[]);
});
test('Bereinigung nutzt 1/2/5/15/30 Sekunden und keinen engen Wiederholungstakt bei fälliger Rechteprüfung',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:onAir');let attempts=0;
  owner.removeNicklistIcon=url=>{if(url===image('moderator')){attempts++;throw Error('down');}};
  h.event(owner,os,'mw:offAir');assert.equal(attempts,1);
  for(const delay of [1000,2000,5000,15000]){h.advance(delay);assert.equal(h.timers.size,1);}
  assert.equal(attempts,5);h.advance(20000);assert.equal(attempts,5);
  assert.equal([...h.timers.values()][0].at-h.now(),10000,'Nächste Fälligkeit in zehn Sekunden, keine 1-ms-Schleife');
  h.advance(10000);assert.equal(attempts,6);assert.equal(h.timers.size,1);
});
test('Unlesbarer oder fremder Bereinigungsnachweis wird ohne fremde Iconentfernung abgewiesen',()=>{
  const {h,owner,os}=fixture();const user=h.user(8,'Neu');
  user.persistence.setObject(key,{version:1,paths:[{kind:'moderator',path:'https://other.invalid/foreign.png',status:'set'}]});
  h.app.onUserJoined(user);h.event(owner,os,'mw:addRadioModerator',{nick:user.nick});
  assert.equal(user.iconCalls.length,0);assert.equal(user.persistence.getObject(key).paths[0].path,'https://other.invalid/foreign.png');
});
test('Nach Neustart bleibt Team bestehen, während Kopfhörer eine neue Wiedergabemeldung verlangen',()=>{
  const f=fixture();f.presence(f.owner,f.os,true,1);assert.deepEqual(icons(f.owner),['listener','team']);
  const saved=f.owner.persistence.getObject(key),store=persistence(f.h.store.data);
  const h=createHarness(store,{users:[{id:1,nick:'Otterchen',role:'owner'}],configureModules(scope){
    const attach=scope.MischWerkModules.attachNicklistStorage;
    scope.MischWerkModules.attachNicklistStorage=runtime=>{attach(runtime);const apply=runtime.applyNicklist;
      runtime.applyNicklist=(user,record,wanted)=>{if(!user.seeded){user.seeded=true;user.persistence.setObject(key,saved);}return apply(user,record,wanted);};};
  }});
  assert.deepEqual(icons(h.user(1)),['team']);h.event(h.user(1),h.user(1).sessions[0],'mw:listenerPresence',{active:true,sequence:1});
  assert.deepEqual(icons(h.user(1)),['listener','team']);
});

function clientFixture(){
  let factory,position=null,now=1000;const messages=[],handlers={},audioHandlers={},windowHandlers={};
  const audio={muted:false,volume:.1,addEventListener:(name,fn)=>audioHandlers[name]=fn};
  const context={MischWerkUI:{define:(name,fn)=>factory=fn},navigator:{onLine:true},window:{addEventListener:(name,fn)=>windowHandlers[name]=fn}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../app/www/js/radio/listener.js'),'utf8'),context);
  const presence=factory({player:{playbackPosition:()=>position,playbackNow:()=>now},audio,commands:{send:(type,data)=>messages.push({type,data:JSON.parse(JSON.stringify(data))})},model:{view:'radio'},signals:{on:(name,fn)=>handlers[name]=fn}});
  presence.start();return {presence,audio,audioHandlers,windowHandlers,handlers,messages,step(value){position=value;now+=1000;presence.sample();},context};
}
test('Client: zwei plausible Fortschrittsmessungen, Nullfortschritt, Sprung und Wiederanlauf',()=>{
  const f=clientFixture();f.step(null);f.step(0);f.step(1);assert.equal(f.messages.length,0);f.step(2);
  assert.equal(f.messages.at(-1).data.active,true);f.step(2);assert.equal(f.messages.at(-1).data.active,false);
  f.step(3);f.step(4);assert.equal(f.messages.at(-1).data.active,true);f.step(200);assert.equal(f.messages.at(-1).data.active,false);
  f.step(201);f.step(202);assert.equal(f.messages.at(-1).data.active,true);
  for(let i=1;i<f.messages.length;i++)assert.ok(f.messages[i].data.sequence>f.messages[i-1].data.sequence);
});
test('Client: Mute, Lautstärke null, Stop, Nachladen, Fehler, Offline und Seitenende sofort inaktiv',()=>{
  for(const trigger of ['mute','zero','waiting','error','ended','pause','seeking','emptied','offline','stop','dispose']){
    const f=clientFixture();f.step(0);f.step(1);f.step(2);assert.equal(f.messages.at(-1).data.active,true);
    if(trigger==='mute'){f.audio.muted=true;f.audioHandlers.volumechange();}
    else if(trigger==='zero'){f.audio.volume=0;f.audioHandlers.volumechange();}
    else if(trigger==='offline')f.windowHandlers.offline();else if(trigger==='stop')f.handlers['playback-reset']();
    else if(trigger==='dispose')f.presence.dispose();else f.audioHandlers[trigger]();
    assert.equal(f.messages.at(-1).data.active,false,trigger);
  }
});
test('Client: Hintergrund bei Fortschritt bleibt aktiv; Refresh erneuert nur mit höherer Sequenz',()=>{
  const f=clientFixture();f.context.document={hidden:true};f.step(0);f.step(1);f.step(2);f.step(3);
  const before=f.messages.length,a=f.presence.renewal(),b=f.presence.renewal();
  assert.equal(a.active,true);assert.equal(b.active,true);assert.ok(b.sequence>a.sequence);assert.equal(f.messages.length,before);
  f.presence.dispose();f.presence.resume();f.step(4);assert.equal(f.presence.renewal().active,false);f.step(5);f.step(6);assert.equal(f.presence.renewal().active,true);
});
test('Bestehender Lifecycle erneuert im Hintergrund alle 20 Sekunden ohne weitere Abfrage und erhält /confirm',()=>{
  const p=require('../support/playback.cjs').playbackHarness();p.play();p.advance(4000);
  assert.equal(p.requests.filter(r=>r.type==='mw:listenerPresence').at(-1).data.active,true);
  p.document.hidden=true;p.document.emit('visibilitychange');p.advance(196000);
  const renewals=p.requests.filter(r=>r.type==='mw:refresh'&&r.data.listenerPresence);
  assert.equal(renewals.length,10);assert.ok(renewals.every(r=>r.data.listenerPresence.active));
  assert.ok(renewals.every((r,i)=>i===0||r.data.listenerPresence.sequence>renewals[i-1].data.listenerPresence.sequence));
  assert.equal(p.slashes.length,1);assert.equal(p.audio.playCalls,1);assert.equal(p.audio.paused,false);
  p.audio.volume=0;p.audio.emit('volumechange');assert.equal(p.requests.at(-1).type,'mw:listenerPresence');assert.equal(p.requests.at(-1).data.active,false);
  p.window.emit('pagehide');p.advance(20000);assert.equal(p.audio.paused,true);
});

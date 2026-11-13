// Interne Fachcontroller direkt prüfen; /mw verbindung ist kein Chat-Einstieg mehr.
// Reale Backendmodule, dokumentierte postURL-Callbacks und isolierte Plattform-/Speicheradapter.
const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const privateKey='mischwerk.android.private.v1',journalKey='mischwerk.android.receipts.v1';
const hostingUrl='https://radio-mischwerk.web.app/api/publishKnuddelsState';
const settings=()=>({enabled:true,runtimeVerified:true,syncSecret:'s'.repeat(64),syncUrl:hostingUrl});
function setup(options={}){
 const calls=[],store=options.store||persistence({[privateKey]:{...settings(),...options.config}});let runtime,hookCalls=0;
 const external={canAccessURL:()=>options.allowed!==false,postURL(url,p){calls.push({url,p,at:h.now(),finished:false});if(options.throwPost)throw Error('private-network-details');}};
 const h=createHarness(store,{now:options.now,serverMethods:{getExternalServerAccess:()=>external,getWebHookAccess(){hookCalls++;throw Error('WEBHOOK-MUST-NOT-BE-CALLED');},...options.serverMethods},configureModules(c){const attach=c.MischWerkModules.attachAndroidPublisher;c.MischWerkModules.attachAndroidPublisher=r=>{attach(r);runtime=r;};const lifecycle=c.MischWerkModules.attachLifecycle;c.MischWerkModules.attachLifecycle=(r,cfg)=>{lifecycle(r,cfg);const start=r.start;r.start=()=>{const saved=r.startAndroidRelay;r.startAndroidRelay=()=>{};start();r.startAndroidRelay=saved;};};}});
 const owner=h.user(1,'Otterchen','owner'),listener=h.user(2,'Privater Nick');const radio=h.open(owner),listenerRadio=h.open(listener);
 h.event(owner,radio,'mw:onAir',{});
 runtime.startAndroidRelay();
 return {h,store,runtime,owner,listener,radio,listenerRadio,calls,options,get hookCalls(){return hookCalls;},
  reply(wishes=[],opts={}){const c=calls[opts.index===undefined?calls.length-1:opts.index];assert.ok(c,'Nativer Status-POST vorhanden');const body=opts.body||{accepted:true,serverTime:h.now(),wishes};c.finished=true;c.p[opts.failure?'onFailure':'onSuccess'](opts.raw===undefined?JSON.stringify(body):opts.raw,{getResponseCode:()=>opts.status||200,getURLString:()=>opts.url||hostingUrl});},
  tick(){h.advance(runtime.moderatorIsActive()?5000:20000);},
  poll(wishes=[],opts={}){this.tick();this.reply(wishes,opts);},
  updates(){return JSON.parse(calls.at(-1).p.data.payload).wishUpdates;},items(){return JSON.parse(JSON.stringify(runtime.wishItems()));},
  channel(text='Channelwunsch',id){h.event(listener,listenerRadio,'mw:wish.submit',{text,...(id?{submissionId:id}:{})});},
  resolve(id,outcome='done'){h.event(owner,radio,'mw:resolveRequest',{id,outcome});}
 };
}
const wish=(id='android-one',text='Band – Song',displayName=null)=>({submissionId:id,text,displayName});

// Fernregie durch denselben echten signierten HTTP-Port, keine direkten Erfolgsattrappen.
let wishCommandSequence=0;
const payload=f=>JSON.parse(f.calls.at(-1).p.data.payload);
function wishCommand(f,action,id=1,overrides={}){
 const queue=f.runtime.loadWishes(),item=queue.items.find(row=>row.id===id);
 const submissionId=f.runtime.wishControlId(queue,item),version=queue.controlVersions.find(row=>row.id===id);
 const source=version.exports.filter(row=>row.revision===version.revision).at(-1);
 return {commandId:(++wishCommandSequence).toString(16).padStart(64,'0'),submissionId,action,
  expectedState:f.runtime.wishControlStage(item),expectedPosition:queue.items.indexOf(item)+1,
  expectedSourceUpdatedAt:source?.stamp||0,beforeSubmissionId:null,
  sessionId:payload(f).studioWishControl.sessionId,expiresAt:f.h.now()+120000,...overrides};
}
function sendWishCommand(f,command,extra={}){
 f.reply([],{body:{accepted:true,serverTime:f.h.now(),wishes:[],studioWishCommands:[command],...extra}});
}
function wishResult(f){f.tick();return payload(f).studioWishResults[0];}

test('Fernregie bindet echten nativen Nick und Sitzung; keine Firebase-UID oder behauptete Clientrolle',()=>{
 const f=setup(),control=payload(f).studioWishControl;
 assert.deepEqual(Object.keys(control).sort(),['nick','sessionId','version']);
 assert.equal(control.nick,'Otterchen');assert.equal(control.version,1);assert.match(control.sessionId,/^[a-f0-9]{64}$/);
 assert.equal(f.runtime.studioWishControl().sessionId,control.sessionId);
 f.reply();f.h.event(f.owner,f.radio,'mw:offAir',{});assert.equal(payload(f).studioWishControl,null);
 f.reply();f.h.event(f.owner,f.radio,'mw:onAir',{});assert.notEqual(payload(f).studioWishControl.sessionId,control.sessionId);
 assert.equal(f.calls.at(-1).p.data.payload.includes('uid'),false);
});

test('Alle sechs Fernaktionen verwenden dieselbe Queue, behalten Reihenfolge und Herkunft',()=>{
 for(const external of [false,true]){
  const f=setup();f.reply();f.channel('Erster Wunsch','control-first');f.reply();
  if(external){f.poll([{...wish('remote-second','Zweiter Wunsch','Öffentlicher Name'),origin:'web'}]);f.tick();}
  else f.channel('Zweiter Wunsch','control-second');
  const before=f.items(),id=2;
  for(const action of ['accept','prepare','defer']){
   const command=wishCommand(f,action,id);sendWishCommand(f,command);
   assert.deepEqual(f.items().map(row=>row.id),[1,2]);
   assert.equal(wishResult(f).state,'applied');
   const row=[...(payload(f).studioWishUpdates||[]),...payload(f).wishUpdates].find(row=>row.submissionId===command.submissionId);
   assert.equal(row.position,2);assert.equal(row.state,action==='prepare'?'preparing':'received');
   f.reply();f.tick();
  }
  assert.equal(f.items()[1].text,before[1].text);assert.equal(f.items()[1].submissionId,before[1].submissionId);
  assert.equal(f.items()[1].displayName,before[1].displayName);assert.equal(f.items()[1].origin,before[1].origin);
  const discard=wishCommand(f,'discard',id);sendWishCommand(f,discard);assert.deepEqual(f.items().map(row=>row.id),[1]);
  assert.equal(wishResult(f).state,'applied');f.reply();f.tick();
  for(const action of ['prepare','playing','done']){
   sendWishCommand(f,wishCommand(f,action));assert.equal(wishResult(f).state,'applied');f.reply();f.tick();
  }
  assert.equal(f.items().length,0);
 }
});

test('Nulländerung wird dauerhaft quittiert und liefert aktuellen Wunsch im selben POST',()=>{
 const f=setup();f.reply();f.channel('Bleibt offen','control-noop');f.reply();f.tick();
 const command=wishCommand(f,'defer'),before=f.items();sendWishCommand(f,command);
 assert.deepEqual(f.items(),before);assert.equal(wishResult(f).state,'applied');
 assert.deepEqual(payload(f).studioWishUpdates.map(row=>[row.submissionId,row.state,row.position]),[[command.submissionId,'queued',1]]);
 assert.equal(payload(f).studioWishControl.sessionId,command.sessionId);
});

test('Fernregie lehnt Sortieren, Zielanker, ungültige Vorzustände und direktes playing ab',()=>{
 for(const changes of [{action:'move'},{beforeSubmissionId:'knuddels:other'},{action:'forged'},
  {expectedPosition:0},{expectedState:'done'},{expiresAt:Date.now()+999999999}, {action:'playing'}, {role:'owner'}]){
  const f=setup();f.reply();f.channel('Unverändert','control-invalid');const before=f.items();
  sendWishCommand(f,wishCommand(f,'accept',1,changes));assert.deepEqual(f.items(),before);
  assert.equal(wishResult(f).reason,'not_allowed');
 }
});

test('Status hin und zurück sowie Empfang nach dem Snapshot machen den alten Auftrag ungültig',()=>{
 for(const mutation of ['stage','delivery']){
  const f=setup();f.reply();f.channel('Konflikt','control-conflict');const command=wishCommand(f,'accept');
  if(mutation==='stage'){
   f.runtime.changeWishStage(f.owner,{id:1,stage:'preparing',previousStage:'queued'});
   f.runtime.changeWishStage(f.owner,{id:1,stage:'queued',previousStage:'preparing'});
  }else f.runtime.deliverWish(1,f.owner);
  const before=f.items();sendWishCommand(f,command);assert.deepEqual(f.items(),before);
  assert.equal(wishResult(f).reason,'stale_wish');
  assert.equal(payload(f).studioWishUpdates[0].state,mutation==='stage'?'queued':'received');
 }
});

test('Unbekannte und globale Heartbeat-Version sind kein Beleg für den einzelnen Wunsch',()=>{
 const f=setup();f.reply();f.channel('Eigene Revision','control-source');f.reply();f.tick();
 const command=wishCommand(f,'accept',1,{expectedSourceUpdatedAt:payload(f).station.updatedAt});
 sendWishCommand(f,command);assert.equal(f.items()[0].delivery,null);assert.equal(wishResult(f).reason,'stale_wish');
});

test('Eine Änderung an anderem Wunsch verwirft den gültigen Bezug nicht',()=>{
 const f=setup();f.reply();f.channel('Erster','control-independent');const command=wishCommand(f,'accept');
 f.channel('Neuer Zweiter','control-independent-2');sendWishCommand(f,command);
 assert.equal(f.items()[0].delivery.nick,'Otterchen');assert.equal(wishResult(f).state,'applied');
});

test('Moderationswechsel, Abmeldung und Verlassen verhindern alte Fernaufträge',()=>{
 for(const change of ['off','restart','leave']){
  const f=setup();f.reply();f.channel('Sitzungsschutz','control-session');const command=wishCommand(f,'accept');
  if(change==='leave'){f.owner.online=false;f.h.app.onUserLeft(f.owner);}
  else {f.h.event(f.owner,f.radio,'mw:offAir',{});if(change==='restart')f.h.event(f.owner,f.radio,'mw:onAir',{});}
  sendWishCommand(f,command);assert.equal(f.items()[0].delivery,null);f.tick();
  assert.equal(payload(f).studioWishResults.length,0,'Altes Ergebnis wird keiner neuen Moderation zugeordnet');
  if(change!=='restart')assert.equal(payload(f).studioWishControl,null);
 }
});

test('Unterwegs abgelaufene Aufträge und übergroße Antworten verändern die Queue nicht',()=>{
 const f=setup();f.reply();f.channel('Frische','control-expiry');
 sendWishCommand(f,wishCommand(f,'accept',1,{expiresAt:f.h.now()-1}));assert.equal(wishResult(f).reason,'stale_wish');
 f.reply();f.tick();const before=f.items(),command=wishCommand(f,'accept');
 f.reply([],{body:{accepted:true,serverTime:f.h.now(),wishes:[],studioWishCommands:[command],padding:'Ä'.repeat(17000)}});
 assert.deepEqual(f.items(),before);
});

test('Doppelte Zustellung und Neustart nach Commit führen nicht erneut aus',()=>{
 const f=setup();f.reply();f.channel('Genau einmal','control-duplicate');const command=wishCommand(f,'accept');
 sendWishCommand(f,command);const delivery=f.items()[0].delivery,revision=f.runtime.loadWishes().controlVersions[0].revision;
 assert.equal(wishResult(f).state,'applied');f.reply([],{failure:true,status:503});
 f.tick();sendWishCommand(f,command);assert.equal(wishResult(f).state,'applied');
 assert.deepEqual(f.items()[0].delivery,delivery);assert.equal(f.runtime.loadWishes().controlVersions[0].revision,revision);
 f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()});sendWishCommand(reboot,command);
 assert.deepEqual(reboot.items()[0].delivery,delivery);
 assert.equal(reboot.runtime.loadWishes().controlVersions[0].revision,revision);
 assert.equal(reboot.runtime.findStudioWishResult(command.commandId).state,'applied');
 assert.equal(payload(reboot).studioWishControl.sessionId===command.sessionId,false,'Neustart bestätigt eine neue native Moderationssitzung');
 reboot.tick();assert.equal(payload(reboot).studioWishResults.length,0,'Keine alte Quittung unter einer neuen Sitzung');
});

test('Aktuelle Rückprojektion darf dem quittierten accept bereits voraus sein',()=>{
 const f=setup();f.reply();f.channel('Schon vorbereitet','control-progress');const command=wishCommand(f,'accept');
 sendWishCommand(f,command);f.runtime.changeWishStage(f.owner,{id:1,stage:'preparing',previousStage:'queued'});
 assert.equal(wishResult(f).state,'applied');assert.equal(payload(f).studioWishUpdates[0].state,'preparing');
});

test('Speicherfehler vor Fachcommit erzeugt keine Änderung und keine falsche Erfolgsquittung',()=>{
 for(const permanent of [false,true]){
  const f=setup();f.reply();f.channel('Atomar','control-storage');f.reply();f.tick();
  const command=wishCommand(f,'accept'),write=f.store.setObject;let failures=0;
  f.store.setObject=(key,value)=>{if(key==='mischwerk.wishes.v3'&&(permanent||failures++===0))throw Error('private storage');write(key,value);};
  sendWishCommand(f,command);assert.equal(f.items()[0].delivery,null);f.store.setObject=write;
  assert.equal(f.runtime.findStudioWishResult(command.commandId)?.state,permanent?undefined:'rejected');
  if(!permanent)assert.equal(wishResult(f).reason,'storage_failed');
  else {f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()});assert.equal(reboot.items()[0].delivery,null);}
 }
});

test('Anzeigefehler nach dauerhaftem Commit bleibt applied',()=>{
 const f=setup();f.reply();f.channel('Commit zuerst','control-notify');
 f.runtime.broadcast=()=>{throw Error('private render failure');};const command=wishCommand(f,'accept');
 sendWishCommand(f,command);assert.equal(f.items()[0].delivery.nick,'Otterchen');assert.equal(wishResult(f).state,'applied');
});

test('Regie quittiert nur im nächsten Takt, ohne zweiten HTTP-Aufruf oder weitere Schleife',()=>{
 const f=setup();f.reply();f.channel('Ein Timer','control-rate');const count=f.calls.length;
 sendWishCommand(f,wishCommand(f,'accept'));assert.equal(f.calls.length,count);
 f.h.advance(4999);assert.equal(f.calls.length,count);f.h.advance(1);assert.equal(f.calls.length,count+1);
 const body=payload(f);assert.equal(body.studioWishResults.length,1);
 assert.ok(body.wishUpdates.length+(body.studioWishUpdates||[]).length<=100);
 assert.deepEqual(Object.keys(f.calls.at(-1).p.data).sort(),['nonce','payload','sig','ts']);
 assert.ok(Object.values(f.calls.at(-1).p.data).every(value=>typeof value==='string'));
});

test('Dauerhafter Abschlussbeleg überlebt Replaygrenze und bestätigt Wiederholung nach Exportquittung',()=>{
 const f=setup();f.reply();f.channel('Dauerhafter Abschluss','control-terminal');const command=wishCommand(f,'done');
 sendWishCommand(f,command);f.runtime.stopAndroidRelay();
 for(let i=0;i<270;i++){f.channel('Weiterer Wunsch '+i,'control-later-'+i);f.resolve(i+2);}
 assert.equal(f.runtime.wishOutcome('control-terminal'),null,'Der normale Replaycache ist inzwischen weitergerückt');
 assert.equal(f.runtime.findStudioWishResult(command.commandId).terminalState,'done');
 f.runtime.startAndroidRelay();assert.equal(payload(f).studioWishResults[0].state,'applied');
 assert.deepEqual(payload(f).studioWishUpdates[0],{submissionId:command.submissionId,state:'done',position:null});
 sendWishCommand(f,command);assert.ok(!f.runtime.loadWishes().studioExports.some(row=>row.submissionId===command.submissionId));
 assert.equal(wishResult(f).state,'applied');
 assert.deepEqual(payload(f).studioWishUpdates[0],{submissionId:command.submissionId,state:'done',position:null});
 assert.equal(f.items().length,0);
});

test('Regiequittung erhält gemeinsam maximal 100 Updates und zehn native Wünsche',()=>{
 const f=setup();f.reply();f.runtime.stopAndroidRelay();
 for(let i=0;i<14;i++)f.channel('Nativer Wunsch '+i,'control-package-'+i);
 f.runtime.startAndroidRelay();f.reply();f.tick();
 const command=wishCommand(f,'accept',14);sendWishCommand(f,command);wishResult(f);
 const body=payload(f);assert.equal(body.studioWishResults.length,1);assert.equal(body.studioWishUpdates[0].submissionId,command.submissionId);
 assert.ok(body.studioWishUpdates.length<=10);assert.ok(body.studioWishUpdates.length+body.wishUpdates.length<=100);
 assert.doesNotMatch(JSON.stringify(f.h.state(f.owner,f.radio)),/controlVersions|controlResults|commandId|exports/);
});

test('Ungültige technische Speicherbelege werden vor jedem Seitencommit abgewiesen',()=>{
 const f=setup();f.reply();f.channel('Valider Bestand','control-validate');f.reply();
 for(const mutate of [q=>{q.controlVersions[0].revision=0;},q=>{q.controlVersions[0].exports[0].stamp=q.studioStamp+1;},
  q=>{q.controlVersions.push(q.controlVersions[0]);},q=>{q.controlVersions=[];},q=>{q.controlResults=[{commandId:'forged'}];}]){
  const queue=JSON.parse(JSON.stringify(f.runtime.loadWishes())),saved=JSON.stringify(f.store.data);mutate(queue);
  assert.throws(()=>f.runtime.saveWishes(queue),/WISH_CONTROL_FORMAT/);assert.equal(JSON.stringify(f.store.data),saved);
 }
});

test('Gemeinsamer Firebase-Vertrag exportiert native Wünsche und erhält Web-/Android-Metadaten',()=>{
 const f=setup();f.reply();f.channel('Nativer Wunsch','native-contract');
 const payload=()=>JSON.parse(f.calls.at(-1).p.data.payload),native=payload().studioWishUpdates;
 assert.equal(payload().wishMetadataVersion,1);assert.equal(native.length,1);
 assert.match(native[0].submissionId,/^knuddels:[A-Za-z0-9_-]{1,84}$/);
 assert.deepEqual({...native[0],submissionId:'stable'},{submissionId:'stable',state:'queued',position:1,text:'Nativer Wunsch',origin:'knuddels',displayName:'Privater Nick'});
 f.reply();f.poll([{...wish('from-web','Webwunsch','Webname'),origin:'web'},{...wish('from-android','Androidwunsch','Appname'),origin:'android'}]);
 assert.deepEqual(f.items().map(r=>r.text),['Nativer Wunsch','Webwunsch','Androidwunsch']);
 assert.deepEqual(f.items().slice(1).map(r=>[r.displayName,r.origin,r.senderKey]),[['Webname','web',''],['Appname','android','']]);
 assert.equal(f.h.state(f.listener,f.listenerRadio).wishPositions.total,1);
 f.tick();assert.deepEqual(f.updates().map(r=>r.position),[2,3]);
 assert.doesNotMatch(JSON.stringify(payload()),/senderKey|userId|visitorId|authentication/);
});

test('Native Studiostatus und Endzustände verwenden dieselbe stabile ID und die echte Position',()=>{
 const f=setup();f.reply();f.channel('Native Regie','native-stage');
 const row=()=>JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0],id=row().submissionId;f.reply();
 f.runtime.deliverWish(1,f.owner);assert.equal(row().state,'received');assert.equal(row().submissionId,id);f.reply();
 for(const [stage,previousStage] of [['preparing','queued'],['playing','preparing']]){
  f.runtime.changeWishStage(f.owner,{id:1,stage,previousStage});assert.equal(row().state,stage);assert.equal(row().position,1);f.reply();
 }
 f.resolve(1);assert.deepEqual(row(),{submissionId:id,state:'done',position:null});f.reply();
 assert.equal(f.runtime.pendingStudioWishUpdates().length,0);assert.equal(f.runtime.loadWishes().studioExports.length,0);
});

test('Gemischte Vorgängerentfernung aktualisiert native und externe Plätze im selben POST',()=>{
 const f=setup();f.reply([wish('web-first','Web zuerst','Webname')]);f.tick();f.reply();
 f.channel('Native danach','native-position');const native=JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0];
 assert.equal(native.position,2);f.reply();f.resolve(1);
 const body=JSON.parse(f.calls.at(-1).p.data.payload);
 assert.equal(body.wishUpdates[0].state,'done');assert.equal(body.studioWishUpdates[0].position,1);
 assert.equal(body.studioWishUpdates[0].submissionId,native.submissionId);
});

test('Eine alte HTTP-Quittung löscht keinen neueren nativen Endzustand',()=>{
 const f=setup();f.reply();f.channel('Kurzer Wunsch','native-old-ack');
 const first=JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0];f.resolve(1,'discarded');f.reply();f.tick();
 const body=JSON.parse(f.calls.at(-1).p.data.payload);
 assert.deepEqual(body.studioWishUpdates,[{submissionId:first.submissionId,state:'discarded',position:null}]);
 f.reply();assert.equal(f.runtime.pendingStudioWishUpdates().length,0);
});

test('Neustart erhält Metadaten und native IDs und erhöht die persistierte Projektionsversion',()=>{
 const f=setup();f.reply();f.channel('Bleibt erhalten','native-reboot');
 const before=JSON.parse(f.calls.at(-1).p.data.payload);f.reply();
 f.poll([{...wish('web-reboot','Aus Web','Name <Web>'),origin:'web'},{...wish('app-reboot','Aus App','Name App'),origin:'android'}]);
 const lastStamp=JSON.parse(f.calls.at(-1).p.data.payload).station.updatedAt;
 f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()});
 const after=JSON.parse(reboot.calls[0].p.data.payload);
 assert.equal(after.studioWishUpdates[0].submissionId,before.studioWishUpdates[0].submissionId);
 assert.ok(after.station.updatedAt>lastStamp,'Auch beim Neustart in derselben Millisekunde steigt die Version');
 assert.deepEqual(reboot.items().slice(1).map(r=>[r.displayName,r.origin]),[['Name <Web>','web'],['Name App','android']]);
 const views=reboot.items().map(r=>reboot.runtime.requestView(r));assert.deepEqual(views.map(r=>r.nick),['Privater Nick','Name <Web>','Name App']);
 assert.deepEqual(views.map(r=>r.origin),['knuddels','web','android']);
});

test('Native Queue- und Endmarkercommits sind atomar; verlorene HTTP-Erfolge werden erneut gesendet',()=>{
 const f=setup();f.reply();const write=f.store.setObject;
 f.channel('\u009f','control-only-native');assert.equal(f.items().length,0,'Steuerzeichen allein werden nicht als Wunsch angenommen');
 f.store.setObject=(key,value)=>{if(key==='mischwerk.wishes.v3')throw Error('disk unavailable');write(key,value);};
 const count=f.calls.length;f.channel('Noch nicht gespeichert','native-commit');assert.equal(f.items().length,0);assert.equal(f.calls.length,count);
 f.store.setObject=write;f.channel('Noch nicht gespeichert','native-commit');assert.equal(f.items().length,1);
 const pending=JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0];f.reply([],{failure:true,status:503});
 f.tick();assert.equal(JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0].submissionId,pending.submissionId);f.reply();
 f.store.setObject=(key,value)=>{if(key==='mischwerk.wishes.v3')throw Error('disk unavailable');write(key,value);};
 f.resolve(1);assert.equal(f.items().length,1);assert.equal(f.runtime.loadWishes().studioExports[0].state,'queued');
 f.store.setObject=write;f.resolve(1);assert.equal(f.items().length,0);assert.equal(f.runtime.loadWishes().studioExports[0].state,'done');
});

test('Unbestätigte native Endmarker überleben die 256er-Replaygrenze und einen Neustart',()=>{
 const f=setup();f.reply();f.runtime.stopAndroidRelay();
 for(let i=0;i<270;i++){f.channel('Temporärer Text '+i,'native-many-'+i);f.resolve(i+1,i%2?'discarded':'done');}
 assert.equal(f.items().length,0);assert.equal(f.runtime.loadWishes().replays.length,256);
 assert.equal(f.runtime.loadWishes().studioExports.length,270);
 assert.doesNotMatch(JSON.stringify(f.runtime.loadWishes().studioExports),/Temporärer Text|Privater Nick|senderKey/);
 f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()}),sent=[];
 for(let page=0;reboot.runtime.pendingStudioWishUpdates().length&&page<28;page++){
  const body=JSON.parse(reboot.calls.at(-1).p.data.payload);assert.ok(body.wishUpdates.length+body.studioWishUpdates.length<=100);
  sent.push(...body.studioWishUpdates);reboot.reply();
  if(reboot.runtime.pendingStudioWishUpdates().length)reboot.tick();
 }
 assert.equal(reboot.runtime.pendingStudioWishUpdates().length,0,'Alle Endmarker werden innerhalb der begrenzten Paketfolge quittiert');
 assert.equal(sent.length,270);assert.equal(new Set(sent.map(r=>r.submissionId)).size,270);
 assert.ok(sent.every(r=>['done','discarded'].includes(r.state)&&r.position===null&&!('text' in r)));
});

test('Native und externe Quittungen teilen die gemeinsame Obergrenze von 100 pro POST',()=>{
 const at=Date.now()-120000,entries=Array.from({length:205},(_,i)=>({submissionId:'mixed-'+i,state:'done',position:null,createdAt:at,at,committed:true,dirty:true,revision:1}));
 const f=setup({store:persistence({[privateKey]:settings(),[journalKey]:{version:1,entries}})});
 for(let i=0;i<12;i++)f.channel('Native '+i,'native-mix-'+i);
 f.reply();f.tick();f.reply();f.tick();f.reply();const bodies=f.calls.map(c=>JSON.parse(c.p.data.payload));
 assert.deepEqual(bodies.map(b=>b.wishUpdates.length+(b.studioWishUpdates||[]).length),[100,100,17]);
 assert.equal(bodies.flatMap(b=>b.studioWishUpdates||[]).length,12);
});

test('Legacyherkunft bleibt unbekannt; optionale Metadaten verleihen keine Channelidentität',()=>{
 const f=setup();f.reply([wish('legacy-metadata','Legacy','Name <img onerror=evil>')]);
 const view=f.runtime.requestView(f.items()[0]);assert.equal(view.origin,null);assert.equal(view.nick,'Name <img onerror=evil>');
 assert.equal(f.items()[0].senderKey,'');assert.equal(f.h.state(f.listener,f.listenerRadio).wishPositions.total,0);
 f.tick();f.reply([{...wish('forged-origin'),origin:'knuddels'},{...wish('control-name'),displayName:'Name\u0000X'}]);
 assert.equal(f.items().length,1);f.tick();
 for(const id of ['forged-origin','control-name'])assert.equal(f.updates().find(r=>r.submissionId===id).state,'discarded');
});

test('Wiederholungen ergänzen nachgewiesene fehlende Altmetadaten ohne bestehende Angaben zu überschreiben',()=>{
 const f=setup();f.reply([wish('legacy-enrich','Originaltext','Alter Name')]);
 const old=f.runtime.copy(f.runtime.loadWishes());delete old.items[0].displayName;f.runtime.commitWishMetadata(old);
 f.poll([{...wish('legacy-enrich','Anderer Text','Nachgewiesener Name'),origin:'web'}]);
 assert.equal(f.items().length,1);assert.equal(f.items()[0].text,'Originaltext');assert.equal(f.items()[0].displayName,'Nachgewiesener Name');assert.equal(f.items()[0].origin,'web');
 f.poll([{...wish('legacy-enrich','Noch ein Text','Späterer Name'),origin:'android'}]);
 assert.equal(f.items()[0].displayName,'Nachgewiesener Name');assert.equal(f.items()[0].origin,'web');assert.equal(f.items()[0].senderKey,'');
});

test('Ein Uhrzeitrücksprung sendet keine ältere Projektion und erhält offene native Updates',()=>{
 const f=setup();f.reply();f.channel('Uhrschutz','clock-native');f.reply();
 const count=f.calls.length,stamp=JSON.parse(f.calls.at(-1).p.data.payload).station.updatedAt,now=f.runtime.now;
 f.runtime.now=()=>f.h.now()-100000;f.runtime.state.topic='Geändert';f.runtime.changed('station');assert.equal(f.calls.length,count);
 f.runtime.now=now;f.runtime.changed('station');assert.ok(JSON.parse(f.calls.at(-1).p.data.payload).station.updatedAt>stamp);
 assert.equal(f.items()[0].text,'Uhrschutz');
});

test('Nutzerlöschung meldet native Wünsche ausdrücklich als discarded ohne Namen oder Text',()=>{
 const f=setup();f.reply();f.channel('Löschen','native-purge');const id=JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates[0].submissionId;f.reply();
 f.h.app.onUserDeleted(f.listener.id);assert.equal(f.items().length,0);
 assert.deepEqual(JSON.parse(f.calls.at(-1).p.data.payload).studioWishUpdates,[{submissionId:id,state:'discarded',position:null}]);
 assert.equal(f.runtime.loadWishes().replays.length,0);
});
test('Sync allein startet nativen signierten Publisher ohne WebHook-Zugriff oder Relay-Schlüssel',()=>{
 const f=setup();assert.equal(f.calls.length,1);assert.equal(f.hookCalls,0);assert.equal(f.runtime.androidPublisherStatus().publisherActive,true);
 const c=f.calls[0];assert.deepEqual(Object.keys(c.p.data).sort(),['nonce','payload','sig','ts']);assert.equal(c.p.header,undefined);
 assert.equal(c.p.data.sig,require('node:crypto').createHmac('sha256',settings().syncSecret).update('v1.'+c.p.data.ts+'.'+c.p.data.nonce+'.'+c.p.data.payload).digest('hex'));
 assert.doesNotMatch(JSON.stringify(c.p.data),new RegExp(settings().syncSecret));f.reply();assert.equal(f.runtime.androidRelayHealthy(),true);
});
test('Wünsche stammen nur aus frischen bestätigten 200-Antworten des festen Ziels',()=>{
 for(const opts of [{status:401},{status:409},{status:503},{failure:true},{url:'https://evil.invalid'},{raw:'{broken'},
  {body:{accepted:false,serverTime:Date.now(),wishes:[wish()]}},{body:{accepted:true,serverTime:1,wishes:[wish()]}},
  {body:{accepted:true,serverTime:Date.now(),wishes:{}}},{body:{accepted:true,serverTime:Date.now()}},
  {body:{accepted:true,serverTime:Date.now(),wishes:Array.from({length:11},(_,i)=>wish('many-'+i))}}]){
  const f=setup();f.reply([wish()],opts);assert.equal(f.items().length,0);assert.equal(f.runtime.androidRelayHealthy(),false);
 }
 const f=setup();f.h.advance(10001);f.reply([wish()]);assert.equal(f.items().length,0);
});
test('Zehn lange Unicode-Wünsche über 4096 Bytes werden vollständig übernommen und im nächsten POST quittiert',()=>{
 const f=setup(),rows=Array.from({length:10},(_,i)=>wish('batch-'+i,'Ä'.repeat(300),'名'.repeat(50)));
 f.reply(rows);assert.equal(f.items().length,10);assert.equal(f.calls.length,1,'Kein rekursiver Status-POST aus der Antwortverarbeitung');
 f.tick();assert.equal(f.updates().length,10);assert.ok(f.updates().every((r,i)=>r.position===i+1&&r.state==='queued'));
 f.reply();assert.equal(f.runtime.androidPublisherStatus().statusUpdatesConfirmed,10);
});
test('Rückkanal reiht hinter Channelwünschen ein und vermischt keine eigenen Hörerpositionen',()=>{
 const f=setup();for(let i=0;i<3;i++)f.channel('Channel '+i);f.reply([wish()]);
 assert.equal(f.items().length,4);assert.equal(f.items()[3].nick,'Android');assert.equal(f.items()[3].source,'Android');
 assert.equal(f.h.state(f.listener,f.listenerRadio).wishPositions.total,3);f.tick();assert.equal(f.updates()[0].position,4);
});
test('Erneute Zustellung und gleichlautende native Kennung erzeugen keinen zweiten Androideintrag',()=>{
 const f=setup();f.channel('Anderer Ursprung','android-one');f.reply([wish(),wish()]);assert.equal(f.items().length,2);
 f.poll([wish('android-one','Anderer Inhalt')]);assert.equal(f.items().length,2);assert.equal(f.items()[1].text,'Band – Song');
 assert.equal(f.runtime.androidIncomingStatus().duplicates,2);assert.equal(f.updates()[0].position,2);
});
test('Terminale Wiederholung bleibt erledigt und wird erneut mit aktuellem Ergebnis quittiert',()=>{
 const f=setup();f.reply([wish()]);f.resolve(1);f.reply();f.poll([wish()]);assert.equal(f.items().length,0);f.tick();
 assert.deepEqual(f.updates(),[{submissionId:'android-one',state:'done',position:null}]);
});
test('Geschlossene Wunschbox und ungültige Inhalte erzeugen discarded statt einer falschen Queueannahme',()=>{
 const changes=[{text:''},{text:'x'.repeat(301)},{text:'https://example.invalid'},{text:'www.example.invalid'},{text:null},
  {displayName:{}},{displayName:'x'.repeat(51)},{uid:'forged'}];
 for(const data of changes){const f=setup();f.reply([{...wish(),...data}]);assert.equal(f.items().length,0);f.tick();assert.equal(f.updates()[0].state,'discarded');}
 const f=setup();f.h.event(f.owner,f.radio,'mw:setRequests',{enabled:false});f.reply([wish()]);assert.equal(f.items().length,0);f.tick();assert.equal(f.updates()[0].state,'discarded');
});
test('Ungültige Kennungen werden nicht gespeichert; gültige Nachbarn und __proto__ bleiben sicher',()=>{
 const f=setup();f.reply([null,[],wish(''),wish('x'.repeat(81)),wish('bad/id'),wish(2),wish('__proto__'),wish('safe')]);
 assert.equal(f.items().length,2);assert.equal(f.runtime.androidIncomingStatus().invalid,6);f.tick();assert.deepEqual(f.updates().map(x=>x.submissionId),['__proto__','safe']);
});
test('Wunschtext wird normalisiert; fremde Namen werden weder als Identität noch als KCode ausgegeben',()=>{
 const f=setup();f.reply([wish('safe',' \u0000  M.I.A.   – Song \n ','°>evil<°')]);assert.equal(f.items()[0].text,'M.I.A. – Song');assert.equal(f.items()[0].nick,'Android');
 assert.doesNotMatch(JSON.stringify([f.h.logs,f.h.bot.messages,f.store.data[journalKey]]),/evil|M\.I\.A\./);
});
test('Nur geschützte native Studioupdates enthalten Wunschtext und öffentlichen Nick; externe Quittungen bleiben technisch',()=>{
 const f=setup();f.channel('Privater Channeltext');f.reply([wish('private','Privater Androidtext','Privater Androidname')]);f.tick();
 const outgoing=f.calls.map(c=>JSON.parse(c.p.data.payload));
 assert.ok(outgoing.some(body=>body.studioWishUpdates?.some(row=>row.text==='Privater Channeltext'&&row.displayName==='Privater Nick')));
 assert.doesNotMatch(JSON.stringify(outgoing),/Privater Androidtext|Privater Androidname|senderKey|userId/);
 for(const row of f.updates())assert.deepEqual(Object.keys(row).sort(),['position','state','submissionId']);
 assert.doesNotMatch(JSON.stringify(f.store.data[journalKey]),/Privater Androidtext|Privater Androidname/);
});
test('Position rückt nach echtem Vorgängerabschluss vor; received/preparing/playing/done folgen der Regie',()=>{
 const f=setup();f.channel('Vorher');f.reply([wish()]);f.resolve(1);assert.equal(f.updates()[0].position,1);f.reply();
 f.h.event(f.owner,f.radio,'mw:openStudio');const studio=f.owner.sessions.find(s=>s.content.viewMode==='Overlay');
 f.h.event(f.owner,studio,'mw:ackRequest',{id:2});assert.equal(f.updates()[0].state,'received');f.reply();
 f.h.event(f.owner,studio,'mw:setWishStage',{id:2,stage:'preparing',previousStage:'queued'});assert.equal(f.updates()[0].state,'preparing');f.reply();
 f.h.event(f.owner,studio,'mw:setWishStage',{id:2,stage:'playing',previousStage:'preparing'});assert.equal(f.updates()[0].state,'playing');f.reply();
 f.h.event(f.owner,studio,'mw:resolveRequest',{id:2,outcome:'done'});assert.equal(f.updates()[0].state,'done');assert.equal(f.items().length,0);
});
test('Nutzerlöschung verändert nur echte Positionen; Androidverwerfen meldet discarded',()=>{
 const f=setup();f.channel('Vorher');f.reply([wish()]);f.h.app.onUserDeleted(f.listener.id);assert.equal(f.updates()[0].position,1);f.reply();
 f.resolve(2,'discarded');assert.equal(f.updates()[0].state,'discarded');
});
test('Queuecommitfehler bestätigt keine Annahme; dieselbe Kennung kann nach Erholung übernommen werden',()=>{
 const f=setup(),write=f.store.setObject;f.store.setObject=(k,v)=>{if(k==='mischwerk.wishes.v3')throw Error('private-storage-detail');write(k,v);};
 f.reply([wish()]);assert.equal(f.items().length,0);f.store.setObject=write;f.poll([wish()]);assert.equal(f.items().length,1);f.poll([wish()]);assert.equal(f.items().length,1);
 assert.doesNotMatch(JSON.stringify(f.h.logs),/private-storage-detail/);
});
test('Abgestürzte Quittung nach dauerhaftem Queuecommit wird nach Neustart ohne Dublette repariert',()=>{
 const f=setup(),write=f.store.setObject;f.store.setObject=(k,v)=>{if(k===journalKey&&v.entries.some(r=>r.committed))throw Error('receipt offline');write(k,v);};
 f.reply([wish()]);assert.equal(f.items().length,1);f.store.setObject=write;f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()});reboot.reply([wish()]);assert.equal(reboot.items().length,1);reboot.tick();assert.equal(reboot.updates()[0].state,'queued');
});
test('Fehlender Quittungsmarker wird aus der dauerhaft vorhandenen Queue wiederhergestellt',()=>{
 const f=setup();f.reply([wish()]);f.h.app.onShutdown();f.store.data[journalKey]={version:1,entries:[]};const reboot=setup({store:f.store,now:f.h.now()});reboot.reply([wish()]);assert.equal(reboot.items().length,1);reboot.tick();assert.equal(reboot.updates()[0].position,1);
});
test('Verlorene/verspätete Antwort und Shutdown führen keine alten Wünsche aus',()=>{
 const f=setup();f.h.advance(20000);const before=f.calls.length;f.reply([wish()],{index:0});assert.equal(f.items().length,0);assert.equal(f.calls.length,before);
 f.tick();f.h.app.onPrepareShutdown();f.reply([wish()]);assert.equal(f.items().length,0);assert.equal(f.h.timers.size,0);
});
test('Nativer belegter Port bleibt bis zum echten Callback gesperrt, logisches Cancel genügt nicht',()=>{
 const f=setup();f.h.advance(60000);assert.equal(f.calls.length,1);f.reply([wish()]);assert.equal(f.items().length,0);f.h.advance(10000);assert.equal(f.calls.length,2);f.reply([wish()]);assert.equal(f.items().length,1);
});
test('Antwortgrenze ist ein lokaler 32-KiB-Schutz, keine behauptete Plattformgrenze',()=>{
 const f=setup();f.reply([],{raw:'x'.repeat(32769)});assert.equal(f.items().length,0);assert.equal(f.runtime.androidRelayHealthy(),false);
});
test('Domainfreigabe wird vor jedem Versand erneut geprüft; fehlerhafte Konfiguration startet nicht',()=>{
 const f=setup();f.reply();f.options.allowed=false;f.tick();assert.equal(f.calls.length,1);
 for(const config of [{enabled:false},{runtimeVerified:false},{syncSecret:'short'},{syncUrl:hostingUrl+'?bad=1'},{syncUrl:'http://evil.invalid'}])assert.equal(setup({config}).calls.length,0);
});
test('Jede neue Projektion ist monoton und nach mehr als 45 Sekunden frisch',()=>{
 const f=setup();f.reply();for(const topic of ['Eins','Zwei','Drei']){f.h.event(f.owner,f.radio,'mw:setTopic',{topic});f.reply();}f.tick();f.reply();
 const stamps=f.calls.map(c=>JSON.parse(c.p.data.payload).station.updatedAt);for(let i=1;i<stamps.length;i++)assert.ok(stamps[i]>stamps[i-1]);
 const old=f.calls.at(-1).p.data;f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'Hängt'});f.h.advance(60000);f.reply([],{failure:true,status:401});f.h.advance(10000);assert.ok(JSON.parse(f.calls.at(-1).p.data.payload).station.updatedAt>JSON.parse(old.payload).station.updatedAt+45000);
});
test('Quittungsrevision einer alten Projektion löscht keine neuere Regieänderung',()=>{
 const f=setup();f.reply([wish()]);f.tick();f.resolve(1,'discarded');f.reply();f.tick();assert.ok(f.calls.some(c=>JSON.parse(c.p.data.payload).wishUpdates.some(r=>r.state==='discarded')));
});
test('Große ausstehende Statusmenge wird weiterhin in Paketen bis 100 ohne Verlust bestätigt',()=>{
 const at=Date.now()-120000,entries=Array.from({length:205},(_,i)=>({submissionId:'old-'+i,state:'done',position:null,createdAt:at,at,committed:true,dirty:true,revision:1}));
 const f=setup({store:persistence({[privateKey]:settings(),[journalKey]:{version:1,entries}})});f.reply();f.tick();f.reply();f.tick();f.reply();assert.deepEqual(f.calls.map(c=>JSON.parse(c.p.data.payload).wishUpdates.length),[100,100,5]);
});
test('Sieben-Tage-Bereinigung und Kapazitätsgrenze bleiben begrenzt, ohne Hörerwünsche zu sperren',()=>{
 const at=Date.now()-8*86400000,entry={submissionId:'expired',state:'done',position:null,createdAt:at,at,committed:true,dirty:true,revision:1};const f=setup({store:persistence({[privateKey]:settings(),[journalKey]:{version:1,entries:[entry]}})});assert.equal(f.store.data[journalKey].entries.length,0);
 f.reply();for(let n=0;n<26;n++)f.poll(Array.from({length:10},(_,i)=>wish('capacity-'+(n*10+i))));assert.equal(f.items().length,256);assert.equal(f.store.data[journalKey].entries.length,256);f.channel();assert.equal(f.items().length,257);
});
test('Station überträgt bestätigten Lauftext einschließlich Aus mit Studiozustand und genau einem aktiven 5-Sekunden-Heartbeat',()=>{
 const f=setup(),station=()=>JSON.parse(f.calls.at(-1).p.data.payload).station;
 assert.deepEqual(station().ticker,{text:'',enabled:false,speed:48,direction:'left',revision:0});
 f.reply();f.h.advance(4999);assert.equal(f.calls.length,1);f.h.advance(1);assert.equal(f.calls.length,2);f.reply();
 f.h.event(f.owner,f.radio,'mw:onAir', {});f.reply();f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'Sendung'});const state=JSON.parse(f.calls.at(-1).p.data.payload).station;assert.equal(state.onAir,true);assert.equal(state.moderatorNick,'Otterchen');assert.equal(state.topic,'Sendung');
 f.reply();f.h.event(f.owner,f.radio,'mw:openStudio');const studio=f.owner.sessions.find(s=>s.activeView==='studio');
 const save=(data)=>f.h.event(f.owner,studio,'mw:setTicker',{view:'studio',viewRevision:1,...data});
 const text='Ä'.repeat(300);
 for(const [index,values] of [{text:'  Radio\n MischWerk  ',enabled:true,speed:32,direction:'right'},
  {text,enabled:true,speed:72,direction:'left'},{text,enabled:false,speed:72,direction:'left'}].entries()){
  const before=f.calls.length;
  const events=save({...values,requestId:'android-ticker-'+index,expectedTickerRevision:index});
  assert.equal(events.findLast(e=>e.type==='mw:result')?.data.ok,true);
  assert.equal(f.calls.length,before+1,'Bestätigte Lauftextänderung wird sofort übertragen');
  const ticker={...values,text:index===0?'Radio MischWerk':text,revision:index+1};
  assert.deepEqual(station().ticker,ticker);assert.equal(station().topic,'Sendung');
  assert.equal(station().onAir,true);assert.equal(station().moderatorNick,'Otterchen');assert.equal(station().wishboxOpen,true);
  const stamp=station().updatedAt;f.reply();f.tick();
  assert.equal(f.calls.length,before+2,'Ein regulärer Heartbeat übernimmt denselben Lauftext');
  assert.deepEqual(station().ticker,ticker);assert.ok(station().updatedAt>stamp);f.reply();
 }
 for(const call of f.calls){const data=call.p.data;assert.deepEqual(Object.keys(data).sort(),['nonce','payload','sig','ts']);
  assert.equal(data.sig,require('node:crypto').createHmac('sha256',settings().syncSecret).update('v1.'+data.ts+'.'+data.nonce+'.'+data.payload).digest('hex'));}
 f.h.app.onShutdown();const reboot=setup({store:f.store,now:f.h.now()});
 assert.deepEqual(JSON.parse(reboot.calls[0].p.data.payload).station.ticker,station().ticker,'Ausgeschalteter gespeicherter Lauftext bleibt nach Neustart übertragen');
});

test('Dynamischer Publisher misst zwölf aktive und drei inaktive Statusaufrufe pro Minute',t=>{
 const f=setup(),start=f.h.now();f.reply();
 for(let i=0;i<11;i++){f.h.advance(5000);const before=f.calls.length;f.reply();assert.equal(f.calls.length,before,'Kein POST aus onSuccess');}
 f.h.advance(4999);assert.equal(f.calls.length,12);
 assert.deepEqual(f.calls.map(c=>c.at-start),Array.from({length:12},(_,i)=>i*5000));
 f.h.event(f.owner,f.radio,'mw:offAir',{});f.reply();const idle=f.calls.length;
 for(let i=0;i<2;i++){f.h.advance(20000);f.reply();}
 f.h.advance(19999);assert.equal(f.calls.length-idle+1,3);
 t.diagnostic('Synthetische gesunde Verbindung, Intervalle ohne Start am rechten Rand: aktiv 12/min, inaktiv 3/min; Faktor 4.');
});

test('Dynamischer Publisher stellt den einen Takt bei wiederholtem Moderationswechsel sauber um',()=>{
 const f=setup();f.reply();
 for(let round=0;round<4;round++){
  f.h.event(f.owner,f.radio,'mw:offAir',{});f.reply();let count=f.calls.length;
  f.h.advance(19999);assert.equal(f.calls.length,count);f.h.advance(1);assert.equal(f.calls.length,count+1);f.reply();
  f.h.event(f.owner,f.radio,'mw:onAir',{});f.reply();count=f.calls.length;
  f.h.advance(4999);assert.equal(f.calls.length,count);f.h.advance(1);assert.equal(f.calls.length,count+1);f.reply();
  for(let i=0;i<3;i++)f.h.state(f.owner,f.radio);
  assert.equal(f.calls.length,count+1,'Öffnen und Aktualisieren erzeugt keinen Publisher');
 }
 f.owner.online=false;f.h.app.onUserLeft(f.owner);f.reply();const count=f.calls.length;
 assert.equal(payload(f).studioWishControl,null);f.h.advance(19999);assert.equal(f.calls.length,count);
 f.h.advance(1);assert.equal(f.calls.length,count+1);f.reply();
 f.h.app.onShutdown();f.h.advance(60000);assert.equal(f.calls.length,count+1);
});

test('Dynamischer Publisher wartet auch nach Timeout und Neustart auf das physische Ende des HTTP-Aufrufs',()=>{
 const f=setup();f.h.advance(10000);assert.equal(f.calls.length,1);
 f.runtime.stopAndroidRelay();f.runtime.startAndroidRelay();assert.equal(f.calls.length,1);
 for(let i=0;i<6;i++){f.h.advance(10000);assert.equal(f.calls.length,1);}
 f.reply([wish('late-physical')]);assert.equal(f.items().length,0);assert.equal(f.calls.length,1,'Spätes onSuccess startet keinen Folgeaufruf');
 f.h.advance(60000);assert.equal(f.calls.length,2);assert.equal(f.calls.filter(c=>!c.finished).length,1);
 f.reply();assert.equal(f.calls.length,2);f.runtime.stopAndroidRelay();f.h.advance(60000);assert.equal(f.calls.length,2);
});

test('Dynamischer Publisher bremst 429 und 5xx auf zehn zwanzig vierzig und sechzig Sekunden',()=>{
 const f=setup();
 for(const [index,delay] of [10000,20000,40000,60000].entries()){
  const count=f.calls.length;f.reply([],{failure:true,status:index%2?503:429});
  assert.equal(f.calls.length,count,'Kein Folge-POST aus onFailure');
  f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'Fehlerphase '+index});assert.equal(f.calls.length,count);
  f.h.advance(delay-1);assert.equal(f.calls.length,count);f.h.advance(1);assert.equal(f.calls.length,count+1);
 }
 f.reply();const count=f.calls.length;f.h.advance(4999);assert.equal(f.calls.length,count);f.h.advance(1);assert.equal(f.calls.length,count+1);
});

test('Dynamischer Publisher misst dauerhafte Fernregiequittungen kurz vor und nach einem aktiven Takt',t=>{
 const latencies=[];
 for(const phase of [4999,5001]){
  const f=setup();f.reply();f.channel('Messwunsch','cadence-latency');f.reply();
  if(phase>5000){f.h.advance(5000);f.reply();f.h.advance(1);}else f.h.advance(phase);
  const queuedAt=f.h.now(),command=wishCommand(f,'accept'),count=f.calls.length;
  f.h.advance(phase<5000?5000-phase:10000-phase);assert.equal(f.calls.length,count+1);
  sendWishCommand(f,command);assert.equal(f.items()[0].delivery.nick,'Otterchen');
  assert.ok(f.runtime.findStudioWishResult(command.commandId),'Ergebnis ist vor Quittung dauerhaft gespeichert');
  assert.equal(f.calls.length,count+1);
  f.h.advance(4999);assert.equal(f.calls.length,count+1);f.h.advance(1);
  const body=payload(f);assert.equal(body.studioWishResults[0].state,'applied');
  assert.equal(body.studioWishUpdates[0].submissionId,command.submissionId);assert.equal(body.studioWishUpdates[0].state,'received');
  latencies.push(f.h.now()-queuedAt);
 }
 assert.deepEqual(latencies,[5001,9999]);
 t.diagnostic('Synthetischer Transport ohne Laufzeit: Auftrag kurz vor/nach dem Takt, dauerhafte Rückquittung nach 5001/9999 ms.');
});

function runtimeProbeFixture(options = {}) {
  const checks = [], secrets = 'private-secret-value';
  const h = createHarness(persistence({ [privateKey]: { enabled: false, relaySecret: secrets } }), { serverMethods: {
    getAppServerInfo: options.missing ? undefined : () => ({
      getVersion: () => { if (options.versionThrows) throw Error('private-exception-details'); return options.version === undefined ? '20990101-010101' : options.version; },
      getServerId: () => options.serverId === undefined ? 'synthetic-server' : options.serverId
    }),
    getExternalServerAccess: options.missing ? undefined : () => ({
      canAccessURL(url) { checks.push(url); if (options.fail) throw Error(secrets); return options.allowed === undefined ? true : options.allowed; },
      getAllAccessibleDomains() { if (options.fail) throw Error(secrets); return [
        { getDomainName: () => 'https://private-other-service.invalid' },
        { getDomainName: () => options.domain === undefined ? (options.listed === false ? 'https://radio-mischwerk.web.app.evil.invalid' : 'https://radio-mischwerk.web.app/') : options.domain }
      ]; },
      getURL() { throw Error('Probe darf keine HTTP-Anfrage senden'); }, postURL() { throw Error('Probe darf keine HTTP-Anfrage senden'); }
    }),
    getWebHookAccess: () => ({ registerWebHook() { throw Error('Probe darf keinen Hook registrieren'); } })
  } });
  return { h, checks, invoke(person, command = 'pruefen') {
    assert.equal(typeof h.app.chatCommands.mw, 'function', 'Privater Diagnosebefehl vorhanden');
    h.runtime.androidRelayCommand(person,command);
    if (!person.messages.length) return null;
    const message=person.messages.at(-1).replace(/\\([_°<>\\])/g, '$1');
    return message.startsWith('{') ? JSON.parse(message) : message;
  } };
}
test('Geschützte Laufzeitprüfung liest Version und Domainrechte ohne Wünsche, Secrets oder Konfiguration zu verändern', () => {
  const f = runtimeProbeFixture(), owner = f.h.user(1, 'Otterchen', 'owner');
  const before = JSON.stringify(f.h.store.data), messages = f.h.bot.messages.length;
  const report = f.invoke(owner);
  assert.equal(report.schemaVersion, 1); assert.equal(report.appServer.version, '20990101-010101');
  assert.equal(report.externalHttps.relayTargetAllowed, true); assert.equal(report.externalHttps.accessFileAllowed, true);
  assert.equal(report.externalHttps.targetListed, true); assert.equal(report.webhook.registrationTested, false);
  assert.deepEqual(f.checks, [hostingUrl, 'https://radio-mischwerk.web.app/knuddelsAccess.txt']);
  assert.equal(JSON.stringify(f.h.store.data), before); assert.equal(f.h.bot.messages.length, messages);
  assert.equal(f.h.updateCalls.length, 0); assert.equal(f.h.timers.size, 0);
  assert.doesNotMatch(JSON.stringify(report), /private-secret-value|private-other-service|relaySecret|syncSecret|submissionId/);
});
test('Laufzeitprüfung bleibt ausschließlich dem anwesenden tatsächlichen Channelinhaber vorbehalten', () => {
  const f = runtimeProbeFixture();
  for (const [index, role] of ['listener', 'manager', 'moderator', 'developer'].entries()) {
    const user = f.h.user(10 + index, role, role);
    assert.equal(f.invoke(user), null); assert.equal(user.messages.length, 0);
  }
  const owner = f.h.user(1, 'Otterchen', 'owner'); owner.online = false;
  assert.equal(f.invoke(owner),null); assert.equal(f.checks.length, 0);
});
test('Fehlende und fehlerhafte Laufzeit-APIs bleiben unbekannt und geben keine Exceptiondetails aus', () => {
  for (const options of [{ missing: true }, { fail: true }]) {
    const f = runtimeProbeFixture(options), owner = f.h.user(1, 'Otterchen', 'owner');
    const report = f.invoke(owner);
    assert.equal(report.externalHttps.relayTargetAllowed, null);
    assert.ok(report.errors.length > 0);
    assert.doesNotMatch(JSON.stringify(report), /private-secret-value|stack|private-other-service/);
  }
});
test('Domainliste ersetzt keine echte HTTPS-Freigabe; ältere Serverversion und ungültige Befehle aktivieren nichts', () => {
  const f = runtimeProbeFixture({ allowed: false, version: '20190101-010101', listed: false });
  const owner = f.h.user(1, 'Otterchen', 'owner'), report = f.invoke(owner);
  assert.equal(report.externalHttps.relayTargetAllowed, false); assert.equal(report.externalHttps.targetListed, false);
  assert.equal(report.appServer.webhookMinimumVersionSatisfied, false);
  const before = f.checks.length;
  assert.equal(f.invoke(owner, 'aktivieren').error,'invalid-command'); assert.equal(f.checks.length, before);
});
test('Anders typisierte Freigaben bleiben unbekannt; ein Versionslabel ergibt keinen Datumsnachweis', () => {
  for (const allowed of ['true', 1, null]) {
    const f = runtimeProbeFixture({ allowed, version: 'unbekannt' });
    const report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
    assert.equal(report.externalHttps.relayTargetAllowed, null);
    assert.equal(report.externalHttps.accessFileAllowed, null);
    assert.equal(report.appServer.version, 'unbekannt');
    assert.equal(report.appServer.versionComparable, false);
    assert.equal(report.appServer.webhookMinimumVersionSatisfied, null);
    assert.equal(report.externalHttps.targetListed, true, 'Domainliste bleibt ein eigener Befund');
  }
});
test('Dokumentierte API-Strings werden auch als Stringobjekte vor der Formatprüfung normalisiert', () => {
  const f = runtimeProbeFixture({ version: new String('20990101-010101'), serverId: new String('synthetic-server'), domain: new String('https://radio-mischwerk.web.app:443/') });
  const report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
  assert.equal(report.appServer.version, '20990101-010101');
  assert.equal(report.appServer.serverId, 'synthetic-server');
  assert.equal(report.appServer.webhookMinimumVersionSatisfied, true);
  assert.equal(report.externalHttps.targetListed, true);
  assert.deepEqual(report.errors, []);
});
test('Domainvergleich akzeptiert ausschließlich das genaue HTTPS-Ziel einschließlich Standardport', () => {
  for (const [domain, expected] of [
    ['https://radio-mischwerk.web.app:443', true], ['HTTPS://RADIO-MISCHWERK.WEB.APP:443/', true],
    ['https://radio-mischwerk.web.app:444', false], ['http://radio-mischwerk.web.app', false],
    ['https://radio-mischwerk.web.app.evil.invalid:443', false], ['https://radio-mischwerk.web.app@evil.invalid', false],
    ['https://evil.invalid/radio-mischwerk.web.app', false], ['https://radio-mischwerk.web.app/?x=1', false]
  ]) {
    const f = runtimeProbeFixture({ domain }), report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
    assert.equal(report.externalHttps.targetListed, expected, domain);
    assert.equal(report.externalHttps.relayTargetAllowed, true, 'Eintrag in der Liste ersetzt nicht canAccessURL');
  }
});
test('Fehlerhafte API-Stringwerte bleiben unbekannt statt über beliebige Objektkonvertierung einen Nachweis zu erzeugen', () => {
  for (const value of [null, 123, true, {}, { toString: () => '20990101-010101' }]) {
    const f = runtimeProbeFixture({ version: value, serverId: value, domain: value });
    const report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
    assert.equal(report.appServer.version, null); assert.equal(report.appServer.serverId, null);
    assert.equal(report.appServer.webhookMinimumVersionSatisfied, null);
    assert.equal(report.externalHttps.targetListed, null); assert.equal(report.externalHttps.listComplete, false);
  }
});
test('Serverdiagnose erhält öffentliche Versionslabels unverändert und zeigt ihre Typen', () => {
  const f = runtimeProbeFixture({ version: 'version-with-unexpected-format', serverId: null });
  const report = f.invoke(f.h.user(1, 'Otterchen', 'owner')), observed = report.appServer.valueDiagnostics;
  assert.equal(report.appServer.version, 'version-with-unexpected-format');
  assert.equal(report.appServer.versionComparable, false);
  assert.equal(observed.version.returned, true); assert.equal(observed.version.type, 'string');
  assert.equal(observed.version.text, 'version-with-unexpected-format');
  assert.equal(observed.serverId.returned, true); assert.equal(observed.serverId.isNull, true);
  assert.equal(observed.serverId.text, null);
  assert.equal(report.externalHttps.relayTargetAllowed, true);
});
test('Fehler eines ServerInfo-Getters verdeckt den zweiten Getter nicht und gibt keine Exceptiondetails aus', () => {
  const f = runtimeProbeFixture({ versionThrows: true }), report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
  assert.equal(report.appServer.version, null); assert.equal(report.appServer.serverId, 'synthetic-server');
  assert.equal(report.appServer.valueDiagnostics.version.returned, false);
  assert.equal(report.appServer.valueDiagnostics.version.error, 'read-failed');
  assert.doesNotMatch(JSON.stringify(report), /private-exception-details/);
});
test('Öffentliche Server-Rohwerte werden begrenzt und unbekannte Objekte nicht als bestätigter String behandelt', () => {
  const f = runtimeProbeFixture({ version: { toString: () => '20990101-010101' }, serverId: 's'.repeat(300) });
  const report = f.invoke(f.h.user(1, 'Otterchen', 'owner')), observed = report.appServer.valueDiagnostics;
  assert.equal(report.appServer.version, null); assert.equal(report.appServer.webhookMinimumVersionSatisfied, null);
  assert.equal(observed.version.type, 'object'); assert.equal(observed.version.tag, '[object Object]');
  assert.equal(observed.version.text, '20990101-010101'); assert.equal(observed.version.stringAccepted, false);
  assert.equal(observed.serverId.text.length, 160); assert.equal(observed.serverId.textLength, 300);
  assert.equal(observed.serverId.truncated, true);
});
test('Snapshot-Version und Server-ID mit At-Zeichen werden als gelesene API-Strings erhalten', () => {
  const f = runtimeProbeFixture({ version: 'SNAPSHOT-', serverId: 'apps7@192.0.2.7' });
  const report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
  assert.equal(report.appServer.version, 'SNAPSHOT-'); assert.equal(report.appServer.serverId, 'apps7@192.0.2.7');
  assert.equal(report.appServer.versionComparable, false); assert.equal(report.appServer.webhookMinimumVersionSatisfied, null);
  assert.deepEqual(report.errors, []);
});
test('Leere, überlange und Steuerzeichen enthaltende Serverangaben bleiben unbrauchbar', () => {
  for (const text of ['', '   ', 'x'.repeat(161), 'line\nbreak', 'control\u007f']) {
    const f = runtimeProbeFixture({ version: text, serverId: text });
    const report = f.invoke(f.h.user(1, 'Otterchen', 'owner'));
    assert.equal(report.appServer.version, null); assert.equal(report.appServer.serverId, null);
    assert.equal(report.appServer.versionComparable, null); assert.equal(report.appServer.webhookMinimumVersionSatisfied, null);
  }
});

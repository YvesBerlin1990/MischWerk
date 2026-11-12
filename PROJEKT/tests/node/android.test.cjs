// Interne Fachcontroller direkt prüfen; /mw verbindung ist kein Chat-Einstieg mehr.
// Reale Backendmodule, dokumentierte postURL-Callbacks und isolierte Plattform-/Speicheradapter.
const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const privateKey='mischwerk.android.private.v1',journalKey='mischwerk.android.receipts.v1';
const hostingUrl='https://radio-mischwerk.web.app/api/publishKnuddelsState';
const settings=()=>({enabled:true,runtimeVerified:true,syncSecret:'s'.repeat(64),syncUrl:hostingUrl});
function setup(options={}){
 const calls=[],store=options.store||persistence({[privateKey]:{...settings(),...options.config}});let runtime,hookCalls=0;
 const external={canAccessURL:()=>options.allowed!==false,postURL(url,p){calls.push({url,p});if(options.throwPost)throw Error('private-network-details');}};
 const h=createHarness(store,{serverMethods:{getExternalServerAccess:()=>external,getWebHookAccess(){hookCalls++;throw Error('WEBHOOK-MUST-NOT-BE-CALLED');},...options.serverMethods},configureModules(c){const attach=c.MischWerkModules.attachAndroidPublisher;c.MischWerkModules.attachAndroidPublisher=r=>{attach(r);runtime=r;};const lifecycle=c.MischWerkModules.attachLifecycle;c.MischWerkModules.attachLifecycle=(r,cfg)=>{lifecycle(r,cfg);const start=r.start;r.start=()=>{const saved=r.startAndroidRelay;r.startAndroidRelay=()=>{};start();r.startAndroidRelay=saved;};};}});
 const owner=h.user(1,'Otterchen','owner'),listener=h.user(2,'Privater Nick');const radio=h.open(owner),listenerRadio=h.open(listener);
 h.event(owner,radio,'mw:onAir',{});
 runtime.startAndroidRelay();
 return {h,store,runtime,owner,listener,radio,listenerRadio,calls,options,get hookCalls(){return hookCalls;},
  reply(wishes=[],opts={}){const c=calls[opts.index===undefined?calls.length-1:opts.index];assert.ok(c,'Nativer Status-POST vorhanden');const body=opts.body||{accepted:true,serverTime:h.now(),wishes};c.p[opts.failure?'onFailure':'onSuccess'](opts.raw===undefined?JSON.stringify(body):opts.raw,{getResponseCode:()=>opts.status||200,getURLString:()=>opts.url||hostingUrl});},
  poll(wishes=[],opts={}){h.advance(20000);this.reply(wishes,opts);},
  updates(){return JSON.parse(calls.at(-1).p.data.payload).wishUpdates;},items(){return JSON.parse(JSON.stringify(runtime.wishItems()));},
  channel(text='Channelwunsch',id){h.event(listener,listenerRadio,'mw:wish.submit',{text,...(id?{submissionId:id}:{})});},
  resolve(id,outcome='done'){h.event(owner,radio,'mw:resolveRequest',{id,outcome});}
 };
}
const wish=(id='android-one',text='Band – Song',displayName=null)=>({submissionId:id,text,displayName});
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
 f.h.advance(20000);assert.equal(f.updates().length,10);assert.ok(f.updates().every((r,i)=>r.position===i+1&&r.state==='queued'));
 f.reply();assert.equal(f.runtime.androidPublisherStatus().statusUpdatesConfirmed,10);
});
test('Rückkanal reiht hinter Channelwünschen ein und vermischt keine eigenen Hörerpositionen',()=>{
 const f=setup();for(let i=0;i<3;i++)f.channel('Channel '+i);f.reply([wish()]);
 assert.equal(f.items().length,4);assert.equal(f.items()[3].nick,'Android');assert.equal(f.items()[3].source,'Android');
 assert.equal(f.h.state(f.listener,f.listenerRadio).wishPositions.total,3);f.h.advance(20000);assert.equal(f.updates()[0].position,4);
});
test('Erneute Zustellung und gleichlautende native Kennung erzeugen keinen zweiten Androideintrag',()=>{
 const f=setup();f.channel('Anderer Ursprung','android-one');f.reply([wish(),wish()]);assert.equal(f.items().length,2);
 f.poll([wish('android-one','Anderer Inhalt')]);assert.equal(f.items().length,2);assert.equal(f.items()[1].text,'Band – Song');
 assert.equal(f.runtime.androidIncomingStatus().duplicates,2);assert.equal(f.updates()[0].position,2);
});
test('Terminale Wiederholung bleibt erledigt und wird erneut mit aktuellem Ergebnis quittiert',()=>{
 const f=setup();f.reply([wish()]);f.resolve(1);f.reply();f.poll([wish()]);assert.equal(f.items().length,0);f.h.advance(20000);
 assert.deepEqual(f.updates(),[{submissionId:'android-one',state:'done',position:null}]);
});
test('Geschlossene Wunschbox und ungültige Inhalte erzeugen discarded statt einer falschen Queueannahme',()=>{
 const changes=[{text:''},{text:'x'.repeat(301)},{text:'https://example.invalid'},{text:'www.example.invalid'},{text:null},
  {displayName:{}},{displayName:'x'.repeat(51)},{uid:'forged'}];
 for(const data of changes){const f=setup();f.reply([{...wish(),...data}]);assert.equal(f.items().length,0);f.h.advance(20000);assert.equal(f.updates()[0].state,'discarded');}
 const f=setup();f.h.event(f.owner,f.radio,'mw:setRequests',{enabled:false});f.reply([wish()]);assert.equal(f.items().length,0);f.h.advance(20000);assert.equal(f.updates()[0].state,'discarded');
});
test('Ungültige Kennungen werden nicht gespeichert; gültige Nachbarn und __proto__ bleiben sicher',()=>{
 const f=setup();f.reply([null,[],wish(''),wish('x'.repeat(81)),wish('bad/id'),wish(2),wish('__proto__'),wish('safe')]);
 assert.equal(f.items().length,2);assert.equal(f.runtime.androidIncomingStatus().invalid,6);f.h.advance(20000);assert.deepEqual(f.updates().map(x=>x.submissionId),['__proto__','safe']);
});
test('Wunschtext wird normalisiert; fremde Namen werden weder als Identität noch als KCode ausgegeben',()=>{
 const f=setup();f.reply([wish('safe',' \u0000  M.I.A.   – Song \n ','°>evil<°')]);assert.equal(f.items()[0].text,'M.I.A. – Song');assert.equal(f.items()[0].nick,'Android');
 assert.doesNotMatch(JSON.stringify([f.h.logs,f.h.bot.messages,f.store.data[journalKey]]),/evil|M\.I\.A\./);
});
test('Bestätigte Nutzlasten enthalten nur technische Androidstatusfelder, keine Wunschtexte oder Namen',()=>{
 const f=setup();f.channel('Privater Channeltext');f.reply([wish('private','Privater Androidtext','Privater Androidname')]);f.h.advance(20000);
 const outgoing=JSON.stringify(f.calls.map(c=>c.p.data));assert.doesNotMatch(outgoing,/Privater Channeltext|Privater Androidtext|Privater Androidname|Privater Nick|senderKey|userId/);
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
 f.reply([wish()]);assert.equal(f.items().length,1);f.store.setObject=write;f.h.app.onShutdown();const reboot=setup({store:f.store});reboot.reply([wish()]);assert.equal(reboot.items().length,1);reboot.h.advance(20000);assert.equal(reboot.updates()[0].state,'queued');
});
test('Fehlender Quittungsmarker wird aus der dauerhaft vorhandenen Queue wiederhergestellt',()=>{
 const f=setup();f.reply([wish()]);f.h.app.onShutdown();f.store.data[journalKey]={version:1,entries:[]};const reboot=setup({store:f.store});reboot.reply([wish()]);assert.equal(reboot.items().length,1);reboot.h.advance(20000);assert.equal(reboot.updates()[0].position,1);
});
test('Verlorene/verspätete Antwort und Shutdown führen keine alten Wünsche aus',()=>{
 const f=setup();f.h.advance(20000);const before=f.calls.length;f.reply([wish()],{index:0});assert.equal(f.items().length,0);assert.equal(f.calls.length,before);
 f.h.advance(20000);f.h.app.onPrepareShutdown();f.reply([wish()]);assert.equal(f.items().length,0);assert.equal(f.h.timers.size,0);
});
test('Nativer belegter Port bleibt bis zum echten Callback gesperrt, logisches Cancel genügt nicht',()=>{
 const f=setup();f.h.advance(60000);assert.equal(f.calls.length,1);f.reply([wish()]);assert.equal(f.items().length,0);f.h.advance(20000);assert.equal(f.calls.length,2);f.reply([wish()]);assert.equal(f.items().length,1);
});
test('Antwortgrenze ist ein lokaler 32-KiB-Schutz, keine behauptete Plattformgrenze',()=>{
 const f=setup();f.reply([],{raw:'x'.repeat(32769)});assert.equal(f.items().length,0);assert.equal(f.runtime.androidRelayHealthy(),false);
});
test('Domainfreigabe wird vor jedem Versand erneut geprüft; fehlerhafte Konfiguration startet nicht',()=>{
 const f=setup();f.reply();f.options.allowed=false;f.h.advance(20000);assert.equal(f.calls.length,1);
 for(const config of [{enabled:false},{runtimeVerified:false},{syncSecret:'short'},{syncUrl:hostingUrl+'?bad=1'},{syncUrl:'http://evil.invalid'}])assert.equal(setup({config}).calls.length,0);
});
test('Jede neue Projektion ist monoton und nach mehr als 45 Sekunden frisch',()=>{
 const f=setup();f.reply();for(const topic of ['Eins','Zwei','Drei']){f.h.event(f.owner,f.radio,'mw:setTopic',{topic});f.reply();}f.h.advance(20000);f.reply();
 const stamps=f.calls.map(c=>JSON.parse(c.p.data.payload).station.updatedAt);for(let i=1;i<stamps.length;i++)assert.ok(stamps[i]>stamps[i-1]);
 const old=f.calls.at(-1).p.data;f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'Hängt'});f.h.advance(60000);f.reply([],{failure:true,status:401});f.h.advance(20000);assert.ok(JSON.parse(f.calls.at(-1).p.data.payload).station.updatedAt>JSON.parse(old.payload).station.updatedAt+45000);
});
test('Quittungsrevision einer alten Projektion löscht keine neuere Regieänderung',()=>{
 const f=setup();f.reply([wish()]);f.h.advance(20000);f.resolve(1,'discarded');f.reply();assert.ok(f.calls.some(c=>JSON.parse(c.p.data.payload).wishUpdates.some(r=>r.state==='discarded')));
});
test('Große ausstehende Statusmenge wird weiterhin in Paketen bis 100 ohne Verlust bestätigt',()=>{
 const at=Date.now()-120000,entries=Array.from({length:205},(_,i)=>({submissionId:'old-'+i,state:'done',position:null,createdAt:at,at,committed:true,dirty:true,revision:1}));
 const f=setup({store:persistence({[privateKey]:settings(),[journalKey]:{version:1,entries}})});f.reply();f.reply();f.reply();assert.deepEqual(f.calls.map(c=>JSON.parse(c.p.data.payload).wishUpdates.length),[100,100,5]);
});
test('Sieben-Tage-Bereinigung und Kapazitätsgrenze bleiben begrenzt, ohne Hörerwünsche zu sperren',()=>{
 const at=Date.now()-8*86400000,entry={submissionId:'expired',state:'done',position:null,createdAt:at,at,committed:true,dirty:true,revision:1};const f=setup({store:persistence({[privateKey]:settings(),[journalKey]:{version:1,entries:[entry]}})});assert.equal(f.store.data[journalKey].entries.length,0);
 f.reply();for(let n=0;n<26;n++)f.poll(Array.from({length:10},(_,i)=>wish('capacity-'+(n*10+i))));assert.equal(f.items().length,256);assert.equal(f.store.data[journalKey].entries.length,256);f.channel();assert.equal(f.items().length,257);
});
test('Station überträgt bestätigten Lauftext einschließlich Aus mit Studiozustand und genau einem 20-Sekunden-Heartbeat',()=>{
 const f=setup(),station=()=>JSON.parse(f.calls.at(-1).p.data.payload).station;
 assert.deepEqual(station().ticker,{text:'',enabled:false,speed:48,direction:'left',revision:0});
 f.reply();f.h.advance(19999);assert.equal(f.calls.length,1);f.h.advance(1);assert.equal(f.calls.length,2);f.reply();
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
  const stamp=station().updatedAt;f.reply();f.h.advance(20000);
  assert.equal(f.calls.length,before+2,'Ein regulärer Heartbeat übernimmt denselben Lauftext');
  assert.deepEqual(station().ticker,ticker);assert.ok(station().updatedAt>stamp);f.reply();
 }
 for(const call of f.calls){const data=call.p.data;assert.deepEqual(Object.keys(data).sort(),['nonce','payload','sig','ts']);
  assert.equal(data.sig,require('node:crypto').createHmac('sha256',settings().syncSecret).update('v1.'+data.ts+'.'+data.nonce+'.'+data.payload).digest('hex'));}
 f.h.app.onShutdown();const reboot=setup({store:f.store});
 assert.deepEqual(JSON.parse(reboot.calls[0].p.data.payload).station.ticker,station().ticker,'Ausgeschalteter gespeicherter Lauftext bleibt nach Neustart übertragen');
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

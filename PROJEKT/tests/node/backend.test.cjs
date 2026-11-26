const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const { configureStream } = require('../fixtures/stream.cjs');
const wish = { text: 'Lieblingsband – Unser Song · Für den Channel' };

test('Ladeeigenschaften bleiben einzeln optional, auch bei Fehlern oder fehlender Color-API', () => {
  const scope = { MischWerkModules:{}, Color:{ fromHexString:hex => hex } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../src/backend/ui/loading.js'),'utf8'),scope);
  const configure = scope.MischWerkModules.configureLoading;
  for (const loading of [null, undefined, {}, {setEnabled:false}]) assert.doesNotThrow(() => configure(loading));
  const applied = {};
  const loading = { setEnabled() { throw Error('Nicht verfügbar'); }, setText:value => { applied.text=value; },
    setBackgroundColor:value => { applied.background=value; }, setForegroundColor:value => { applied.foreground=value; } };
  configure(loading);assert.deepEqual(applied,{text:'',foreground:'#0f1114',background:'#0f1114'});
  delete scope.Color;assert.doesNotThrow(() => configure(loading));
  for(const enabled of [false,true]){
    let applied;configure({setEnabled:value => {applied=value;}},enabled);assert.equal(applied,enabled);
  }
});





test('Native Wunschöffnung dedupliziert Zustellungen; erneuter bewusster Aufruf öffnet frisch',()=>{
 const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes',{requestId:'once'});const old=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 h.event(owner,os,'mw:openWishes',{requestId:'once'});assert.equal(old.removed,false);assert.equal(old.events.some(e=>e.type==='mw:overlay.prepare'),false);
 h.event(owner,os,'mw:openWishes',{requestId:'again'});h.finishOverlay(owner,old);const fresh=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.notEqual(fresh,old);assert.equal(old.removed,true);
 h.event(owner,os,'mw:openWishes',{requestId:'again'});assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay'),fresh);
});













test('Authentifizierte Sitzungsprüfung erhält den bewährten Uservergleich auch bei neuen Plattformwrappern',()=>{
  const {h,owner,os,listener}=fixture(),content=os.content,getSessions=content.getSessions;
  content.getSessions=()=>getSessions.call(content).map(active=>({getUser:()=>active.getUser(),getOpenTimestamp:()=>active.getOpenTimestamp()}));
  assert.equal(h.event(owner,os,'mw:refresh').some(e=>e.type==='mw:state'),true);
  assert.equal(h.event(listener,os,'mw:refresh').length,0);
  content.getSessions=getSessions;
});








const lastResult = events => {
  const data = events.findLast(event => event.type === 'mw:result' || event.type === 'mw:wish.receipt')?.data;
  return data && typeof data.accepted === 'boolean' ? { ...data, ok: data.accepted } : data;
};
function fixture(active=true) {
 const f=require('../fixtures/relay-v2.cjs').setup();if(active)f.finish();
 const h=f.h,listener=h.user(1,'Musikfreund'),owner=h.user(2,'Otterchen','owner');
 return {...f,h,listener,owner,ls:h.open(listener),os:h.open(owner)};
}




function legacyStore(requests, extra = {}) {
  const highest = requests.reduce((value, item) => Math.max(value, item.id), 0);
  return persistence({ 'mischwerk.state.v1': { version: 1, revision: 0, topic: '', requestsEnabled: true,
    moderator: null, requests, cooldowns: {}, nextId: highest + 1, radioModeratorUserIds: [],
    radioModeratorRevision: 0, ...extra } });
}
test('Radio und Wunschbox sind ohne Vorhangbefehl und ohne Vorhangzustand verfügbar',()=>{
 const {h,listener,owner,ls,os}=fixture();assert.equal(h.app.chatCommands.vorhang,undefined);
 assert.equal(Object.hasOwn(h.state(listener,ls),'curtain'),false);assert.equal(Object.hasOwn(h.state(owner,os),'curtain'),false);
 assert.equal(lastResult(h.event(listener,ls,'mw:openWishes')).ok,true);
 const before=JSON.stringify(h.store.data);assert.equal(lastResult(h.event(owner,os,'mw:setCurtain',{closed:true,previousClosed:false})).ok,false);
 assert.equal(JSON.stringify(h.store.data),before,'Alter UI-Auftrag verändert keine Daten');
});

function appoint(h, owner, ownerSession, person) {
  const revision = h.state(owner, ownerSession).radioModeratorRevision;
  const result = lastResult(h.event(owner, ownerSession, 'mw:addRadioModerator', {
    nick: person.nick, expectedRadioModeratorRevision: revision
  }));
  assert.equal(result.ok, true, result.message);
}
function removeRadioModerator(h, owner, ownerSession, person) {
  const revision = h.state(owner, ownerSession).radioModeratorRevision;
  const result = lastResult(h.event(owner, ownerSession, 'mw:removeRadioModerator', {
    userId: person.id, expectedRadioModeratorRevision: revision
  }));
  assert.equal(result.ok, true, result.message);
}
test('main.js bleibt ein kurzer Einstieg und lädt die Serverdateien des gewählten Appstands', () => {
  const h = createHarness();
  const { modules, checkBackend } = require('../../tools/build/backend.cjs');
  checkBackend();
  const delivery = process.env.MISCHWERK_TEST_UPLOAD ? require('../../tools/build/prepare-upload.cjs').createDelivery() : null;
  assert.deepEqual(h.loadedFiles, ['main.js', 'server/app.js', ...modules.filter(file => file !== 'app.js' &&
    (!delivery || delivery.has('server/' + file))).map(file => 'server/' + file)]);
  const entry = fs.readFileSync(path.join(process.env.MISCHWERK_TEST_UPLOAD || path.resolve(__dirname, '../../app'), 'main.js'), 'utf8');
  assert.equal((entry.match(/KnuddelsServer.execute\(/g) || []).length, 1);
  assert.ok(entry.split('\n').length < 6);
  assert.doesNotMatch(entry, /onEventReceived\s*[:=]|\bpersist\s*\(|function\s*\(/);
});
test('Backend und Frontend haben eindeutige Schnittstellen und azyklische Abhängigkeiten', () => {
  const result = require('../../tools/checks/architecture.cjs').checkArchitecture();
  assert.equal(result.backendModules, require('../../tools/build/backend.cjs').modules.length);
  assert.equal(result.frontendComponents, 42);
});

test('Laufzeitprüfung verweigert fremde und fehlende Dateien vor der Paketfreigabe', t => {
  const os = require('node:os');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Pakettest-'));
  t.after(() => {
    assert.ok(directory.startsWith(path.join(os.tmpdir(), 'MischWerk-Pakettest-')));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  fs.cpSync(path.join(__dirname, '../../app'), directory, { recursive: true });
  const { checkRuntime } = require('../../tools/checks/lengths.cjs');
  assert.doesNotThrow(() => checkRuntime(directory));
  const unexpected = path.join(directory, 'www/versehentliche-quelldaten.json');
  fs.writeFileSync(unexpected, '{}');
  assert.throws(() => checkRuntime(directory), /Laufzeitdateien/);
  fs.unlinkSync(unexpected);
  fs.unlinkSync(path.join(directory, 'www/js/start.js'));
  assert.throws(() => checkRuntime(directory), /Laufzeitdateien/);
});

test('/update erlaubt nur echte Appmanager und Channelinhaber, keine CM- oder Radiomoderatorrolle', () => {
  const { h, listener, owner, ls, os } = fixture();
  const initialInvalidations = h.cacheInvalidations.length;
  const cm = h.user(3, 'ChannelCM', 'moderator');

  for (const person of [listener, cm, h.user(4, 'Otterchen', 'listener')]) {
    h.app.chatCommands.update(person, '');
    assert.match(person.messages.at(-1), /Nur Appmanager/);
  }
  assert.equal(h.updateCalls.length, 0);
  assert.equal(h.cacheInvalidations.length, initialInvalidations, 'Keine Cache-Aktion ohne Appmanagerrecht');
  const manager = h.user(5, 'AppManager', 'manager'), ms = h.open(manager);
  assert.equal(h.state(manager, ms).user.canModerate, false, 'Appmanager erhalten kein Studiorecht');
  h.app.chatCommands.update(manager, '');
  assert.equal(h.updateCalls.length, 1);
  assert.match(manager.messages.at(-1), /Update vorgemerkt.*30 Sekunden.*Offene Musikwünsche/);
  const other = createHarness();
  other.app.chatCommands.update(other.user(6, 'Besitzer', 'owner'), '');
  assert.equal(other.updateCalls.length, 1, 'Channelinhaber sind laut API Appmanager');
});

test('/update bleibt nach API-Fehler erneut möglich und gibt keine internen Details aus', () => {
  const { h, owner } = fixture();
  const updateFiles = h.rootInstance.updateAppFiles;
  h.rootInstance.updateAppFiles = () => { throw new Error('Private interne Dateiangaben'); };
  h.app.chatCommands.update(owner, '');
  assert.match(owner.messages.at(-1), /Update fehlgeschlagen/);
  h.rootInstance.updateAppFiles = updateFiles;
  const update = h.rootInstance.updateApp;
  h.rootInstance.updateApp = () => { throw new Error('Private interne Angaben'); };
  h.app.chatCommands.update(owner, '');
  assert.match(owner.messages.at(-1), /Update fehlgeschlagen/);
  assert.ok(h.logs.some(entry => entry.message.includes('[APP_UPDATE]')));
  assert.doesNotMatch(JSON.stringify(h.logs) + JSON.stringify(owner.messages), /Private interne/);
  h.rootInstance.updateApp = update;
  h.app.chatCommands.update(owner, '');
  assert.equal(h.updateCalls.length, 1);
  assert.match(owner.messages.at(-1), /vorgemerkt/);
});
test('/update prüft FTP-Dateien und startet ohne neue Daten nicht neu', () => {
  const h = createHarness(); const owner = h.user(2, 'Otterchen', 'owner');
  h.rootInstance.availableFiles = [];
  h.app.chatCommands.update(owner, '');
  assert.equal(h.updateFileCalls.length, 1); assert.equal(h.updateCalls.length, 0);
  assert.match(owner.messages.at(-1), /Keine neuen Dateien.*ohne Neustart/);
  h.rootInstance.availableFiles = ['server/maintenance.js', 'www/js/start.js'];
  h.app.chatCommands.update(owner, '');
  assert.equal(h.updateFileCalls.length, 2); assert.equal(h.updateCalls.length, 1);
  assert.match(owner.messages.at(-1), /Update vorgemerkt/);
});
test('/update sperrt einen Neustart bei fehlendem Nicklisten-Modul und nennt den relativen Pfad', () => {
  const directory = path.resolve(process.env.MISCHWERK_TEST_UPLOAD || 'app');
  const missing = 'server/users/nicklist-storage.js';
  const h = createHarness(undefined, { serverMethods:{ listFiles(folder) {
    const relative = folder === '.' ? '' : folder.replace(/\/$/,'');
    return fs.readdirSync(path.join(directory,relative),{withFileTypes:true})
      .filter(entry => (relative ? relative+'/' : '')+entry.name !== missing)
      .map(entry => entry.name+(entry.isDirectory()?'/':''));
  } } });
  const owner = h.user(1,'Otterchen','owner');
  h.app.chatCommands.update(owner,'');
  assert.equal(h.updateCalls.length,0,'Fehlende Pflichtdatei darf keinen Neustart auslösen');
  assert.match(owner.messages.at(-1),/Kein Neustart/);
  assert.ok(owner.messages.at(-1).includes(missing));
});
function guardedUpdateFixture(options = {}) {
  const app = path.resolve(process.env.MISCHWERK_TEST_UPLOAD || 'app'), missing = new Set(options.missing || []), reads = [];
  let scope;
  function listFiles(folder) {
    reads.push(folder);
    const relative = folder === '.' ? '' : folder.replace(/\/$/,'');
    const entries = fs.readdirSync(path.join(app,relative),{withFileTypes:true})
      .filter(entry => !missing.has((relative ? relative+'/' : '')+entry.name))
      .map(entry=>entry.name+(entry.isDirectory()?'/':''));
    return options.list ? options.list(relative,entries) : entries;
  }
  const h = createHarness(undefined,{configureModules(value){scope=value;},serverMethods:{listFiles},
    readFile(file,source,probing){return probing && file==='server/app.js' && options.probe ? options.probe(source) : source;}});
  const owner = h.user(1,'Otterchen','owner');
  return { h, owner, scope, missing, reads, listFiles, update(){h.app.chatCommands.update(owner,'');} };
}
for(const file of ['server/users/nicklist.js','server','main.js','app.config','www/img/nicklist/team.png','www/fonts/outfit-latin.woff2'])
test('/update erkennt fehlenden Paketbestand: '+file,()=>{
  const f=guardedUpdateFixture({missing:[file]});f.update();
  assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Kein Neustart.*Es fehlen/);
  assert.ok(f.owner.messages.at(-1).includes(file));
  assert.equal(new Set(f.reads).size,f.reads.length,'Jedes benötigte Verzeichnis nur einmal pro Versuch lesen');
});
test('/update prüft auch ohne neue Änderungsdateien den vollständigen Bestand',()=>{
  const f=guardedUpdateFixture({missing:['server/users/nicklist.js']});f.h.rootInstance.availableFiles=[];
  f.update();assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Es fehlen/);
});
test('/update verwendet den Dateibedarf des neuen Builds und erlaubt Nachliefern ohne weitere Änderungsdateien',()=>{
  const {readUpdatePlan,renderUpdatePlan}=require('../../tools/lib/update-plan.cjs');
  let repaired=false;
  const f=guardedUpdateFixture({probe(source){
    const plan=readUpdatePlan(source),files=Object.entries(plan.directories).flatMap(([dir,names])=>names.map(name=>(dir?dir+'/':'')+name));
    return renderUpdatePlan(source,[...files,'server/future/module.js'],{version:'0.1.999',buildNumber:999});
  },list(folder,entries){
    if(folder==='server'&&repaired)entries.push('future/');
    return entries;
  }});
  const native=f.scope.KnuddelsServer.listFiles;
  f.scope.KnuddelsServer.listFiles=folder=>folder==='server/future'?['module.js']:native(folder);
  const oldConfig=f.scope.MischWerkConfig,oldModules=f.scope.MischWerkModules,oldApp=f.scope.App;
  const saved=JSON.stringify(f.h.store.data),timerCount=f.h.timers.size;
  f.update();assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/server\/future\/module.js/);
  assert.equal(f.scope.MischWerkConfig,oldConfig);assert.equal(f.scope.MischWerkModules,oldModules);assert.equal(f.scope.App,oldApp);
  assert.equal(JSON.stringify(f.h.store.data),saved);assert.equal(f.h.timers.size,timerCount);
  assert.equal(f.h.rootInstance.availableFiles.length,0);
  repaired=true;f.update();assert.equal(f.h.updateCalls.length,1);assert.match(f.owner.messages.at(-1),/Update vorgemerkt/);
  f.update();assert.equal(f.h.updateCalls.length,1,'Nach erfolgreichem Vormerken kein zweiter Neustart');
});
test('/update stellt globale Module und Konfiguration nach einem nicht unterstützten alten Ladeplan wieder her',()=>{
  const f=guardedUpdateFixture({probe:()=>"MischWerkModules = {}; MischWerkConfig = {version:'alt'};"});
  const modules=f.scope.MischWerkModules,config=f.scope.MischWerkConfig,app=f.scope.App;
  f.update();assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Kein Neustart.*Dateiliste/);
  assert.equal(f.scope.MischWerkModules,modules);assert.equal(f.scope.MischWerkConfig,config);assert.equal(f.scope.App,app);
  assert.equal(f.scope.MischWerkUpdateProbe,null);
});
test('/update lehnt einen mehrfach gelieferten Dateiplan ohne Neustart ab',()=>{
  const f=guardedUpdateFixture({probe:()=>"MischWerkUpdateProbe(null); MischWerkUpdateProbe({});"});
  f.update();assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Kein Neustart/);
  assert.equal(f.scope.MischWerkUpdateProbe,null);
});
test('/update scheitert geschlossen bei fehlender oder fehlerhafter listFiles-API und hält interne Details privat',()=>{
  for(const method of [undefined,()=>{throw Error('private-server-path');},()=>null,()=>({length:10001})]){
    const f=guardedUpdateFixture();f.scope.KnuddelsServer.listFiles=method;f.update();
    assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Kein Neustart/);
    assert.doesNotMatch(JSON.stringify(f.h.logs)+JSON.stringify(f.owner.messages),/private-server-path/);
  }
});
for(const invalid of ['schema','version','build','empty','duplicate','traversal','wrong-root','long-directory'])
test('/update verwirft ungültige Zieldateiliste: '+invalid,()=>{
  const f=guardedUpdateFixture({probe(source){
    const plan=require('../../tools/lib/update-plan.cjs').readUpdatePlan(source);
    if(invalid==='schema')plan.schema=2;
    if(invalid==='version')plan.version='unbekannt';
    if(invalid==='build')plan.buildNumber=0;
    if(invalid==='empty')plan.directories={};
    if(invalid==='duplicate')plan.directories[''].push('main.js');
    if(invalid==='traversal')plan.directories['server'].push('../outside');
    if(invalid==='wrong-root')plan.directories['private']=['secret'];
    if(invalid==='long-directory')plan.directories['server/'+('a'.repeat(201))]=['file.js'];
    return 'MischWerkUpdateProbe('+JSON.stringify(plan)+');';
  }});
  f.update();assert.equal(f.h.updateCalls.length,0);assert.match(f.owner.messages.at(-1),/Kein Neustart/);
  assert.ok(f.reads.every(folder=>!folder.includes('..')));
});
test('/update begrenzt die Dateifehlermeldung und meldet weitere fehlende Dateien als Anzahl',()=>{
  const f=guardedUpdateFixture({missing:['www']});f.update();
  const message=f.owner.messages.at(-1);
  assert.equal(f.h.updateCalls.length,0);assert.match(message,/weitere/);assert.ok(message.length<1000);
});
test('/update verarbeitet native Stringwrapper und pfadbezogene listFiles-Ergebnisse',()=>{
  for(const prefix of ['', './', '/']){
    const f=guardedUpdateFixture({list(folder,entries){return entries.map(name=>new String(prefix+(folder?folder+'/':'')+name));}});
    f.update();assert.equal(f.h.updateCalls.length,1);assert.match(f.owner.messages.at(-1),/Update vorgemerkt/);
  }
});
test('Appstart erneuert den Oberflaechen-Cache vor der ersten Ansicht, ohne Dateien zu uebernehmen', () => {
  const h = createHarness(undefined, { users: [{ id: 2, nick: 'Besitzer', role: 'owner' }] });
  assert.equal(h.cacheInvalidations.length, 1);
  assert.equal(h.updateFileCalls.length, 0);
  assert.equal(h.updateCalls.length, 0);
  assert.ok(h.contents.length > 0, 'Appansichten werden weiterhin gestartet');
});
test('/update erneuert auch bei bereits uebernommenen Dateien den Cache und nennt die laufende Version', () => {
  const h = createHarness(); const owner = h.user(2, 'Otterchen', 'owner');
  const order = [], readFiles = h.rootInstance.updateAppFiles, invalidate = h.rootInstance.invalidateClientCache;
  h.rootInstance.availableFiles = [];
  h.rootInstance.updateAppFiles = function () { order.push('files'); return readFiles.call(this); };
  h.rootInstance.invalidateClientCache = function () { order.push('cache'); return invalidate.call(this); };
  h.app.chatCommands.update(owner, '');
  assert.deepEqual(order, ['files', 'cache']);
  assert.equal(h.updateCalls.length, 0, 'Leere Dateiliste erzwingt keinen Neustart');
  assert.equal(h.cacheInvalidations.length, 2, 'Start und ausdrueckliche Aktualisierung');
  assert.ok(owner.messages.at(-1).includes(h.config.version));
  assert.doesNotMatch(owner.messages.at(-1), /Cache|Statuszentrale|\/ftp\/|updateAppFiles/);
  assert.ok(owner.messages.at(-1).length < 130, 'Kurze Ergebnisnachricht statt technischer Anleitung');
  assert.equal(owner.messages.length, 1, 'Einmalige private Rückmeldung');
});
test('/update invalidiert nach reinen Team-Dateien den Cache vor dem Neustartauftrag', () => {
  const h = createHarness(); const owner = h.user(2, 'Otterchen', 'owner');
  const order = [], invalidate = h.rootInstance.invalidateClientCache, update = h.rootInstance.updateApp;
  h.rootInstance.availableFiles = ['www/js/team/markup.js', 'www/css/team/team.css'];
  h.rootInstance.invalidateClientCache = function () { order.push('cache'); return invalidate.call(this); };
  h.rootInstance.updateApp = function (message, logMessage) { order.push('update'); return update.call(this, message, logMessage); };
  const saved = JSON.stringify(h.store.data);
  h.app.chatCommands.update(owner, '');
  assert.deepEqual(order, ['cache', 'update']);
  assert.equal(h.updateCalls.length, 1);
  assert.equal(JSON.stringify(h.store.data), saved);
  assert.match(owner.messages.at(-1), /Update vorgemerkt/);
});
test('/update behaelt erkannte Dateien bei Cachefehlern fuer den naechsten Versuch', () => {
  const h = createHarness(); const owner = h.user(2, 'Otterchen', 'owner');
  const invalidate = h.rootInstance.invalidateClientCache;
  h.rootInstance.availableFiles = ['www/js/team/management.js'];
  h.rootInstance.invalidateClientCache = () => { throw new Error('Private interne Cachedetails'); };
  h.app.chatCommands.update(owner, '');
  assert.equal(h.updateCalls.length, 0);
  assert.match(owner.messages.at(-1), /Update fehlgeschlagen/);
  h.rootInstance.invalidateClientCache = invalidate;
  h.app.chatCommands.update(owner, '');
  assert.equal(h.updateCalls.length, 1);
  assert.match(owner.messages.at(-1), /Update vorgemerkt/);
  assert.doesNotMatch(JSON.stringify(h.logs) + JSON.stringify(owner.messages), /Private interne Cachedetails/);
});
test('Cachefehler beim Start verhindert weder Ansichten noch Datenladen', () => {
  const h = createHarness(undefined, { failClientCache: true, users: [{ id: 2, nick: 'Besitzer', role: 'owner' }] });
  assert.ok(h.contents.length > 0);
  assert.ok(h.logs.some(entry => entry.message.includes('[APP_UI_CACHE]')));
  assert.doesNotMatch(JSON.stringify(h.logs), /Private interne Cachedetails/);
  assert.equal(h.updateCalls.length, 0);
});
test('/update lehnt Zusätze, abwesende Nutzer und einen laufenden Shutdown ab', () => {
  const { h, owner } = fixture();
  h.app.chatCommands.update(owner, 'fremde-app');
  assert.match(owner.messages.at(-1), /nur \/update/);
  owner.online = false; h.app.chatCommands.update(owner, '');
  assert.match(owner.messages.at(-1), /MischWerk-Channel/);
  owner.online = true; h.app.onPrepareShutdown(); h.app.chatCommands.update(owner, '');
  assert.match(owner.messages.at(-1), /wird gerade beendet/);
  assert.equal(h.updateCalls.length, 0);
});


































test('STREAMPANEL verwendet die bestätigten öffentlichen MischWerk-SPCast-Anschlüsse', () => {
  const {h,owner,os}=fixture(),station=h.state(owner,os).station;
  assert.equal(station.provider,'streampanel');assert.equal(station.configured,true);
  assert.equal(station.streamUrl,'https://mischwerk.sp.radio.fm/stream');
  assert.equal(station.metadataUrl,'https://mischwerk.sp.radio.fm/currentsong?sid=1');
  assert.equal(station.metadataFormat,'spcast-shoutcast-song');
  assert.equal(station.fields.title,'');assert.equal(station.fields.artist,'');
  assert.equal(station.fields.live,'');
  assert.deepEqual(station.allowedHosts,['mischwerk.sp.radio.fm','mischwerk.spcast.eu']);
  assert.equal(station.statusUrl,'https://mischwerk.sp.radio.fm/statistics?json=1');
  assert.equal('listenersUrl' in station,false);assert.equal('listeners' in station.fields,false);assert.equal(station.statusFormat,'spcast-statistics');
  assert.equal(station.streamId,1);assert.equal(station.streamPath,'/stream');
  assert.equal(station.modeUrl,'https://mischwerk.sp.radio.fm/scripts/whoIsLive.php');
});
test('Ein öffentlicher HTTPS-Audiostream funktioniert unabhängig von noch fehlenden Datendiensten',()=>{
  const {h,owner,os,listener,ls}=fixture();configureStream(h.config);
  let station=h.state(owner,os).station;assert.equal(station.configured,true);
  assert.equal(station.streamUrl,'https://stream.example.com/test-radio');
  h.config.streampanel.metadata={};h.config.streampanel.status={};h.config.streampanel.listeners={};
  station=h.state(owner,os).station;assert.equal(station.configured,true);assert.equal(station.metadataUrl,'');
  assert.equal(h.event(listener,ls,'mw:wish.submit',wish).find(e=>e.type==='mw:wish.receipt').data.pending,true);
});
test('STREAMPANEL gibt nur geprüfte öffentliche HTTPS-Anschlüsse und freigegebene Datenhosts aus',()=>{
  const {h,owner,os}=fixture();
  for(const streamUrl of ['http://stream.example.com/stream','https://user:pass@stream.example.com/stream','https://localhost/stream','https://127.0.0.1/stream','https://stream.example.com:8000/stream','https://stream.example.com/stream?token=secret','https://stream.example.com/stream?%74oken=secret','https://stream.example.com/stream#secret',{},1]){
    h.config.streampanel={streamUrl};const station=h.state(owner,os).station;
    assert.equal(station.configured,false,String(streamUrl));assert.equal(station.streamUrl,'');
    assert.doesNotMatch(JSON.stringify(station),/secret|user:pass/);
  }
  configureStream(h.config);h.config.streampanel.metadata.url='https://other.example.com/metadata';
  assert.equal(h.state(owner,os).station.metadataUrl,'');
  h.config.streampanel.allowedHosts.push('other.example.com');
  assert.equal(h.state(owner,os).station.metadataUrl,'https://other.example.com/metadata');
});
test('Private Zusatzfelder und gefährliche Feldpfade werden niemals veröffentlicht oder ausgewertet',()=>{
  const {h,owner,os}=fixture();configureStream(h.config);
  Object.assign(h.config.streampanel,{password:'private-secret',token:'private-secret'});
  h.config.streampanel.metadata.titleField='__proto__.title';
  h.config.streampanel.metadata.artistField='constructor.name';
  const station=h.state(owner,os).station;
  assert.doesNotMatch(JSON.stringify(station),/private-secret|__proto__|constructor/);
  assert.equal(station.fields.title,'');assert.equal(station.fields.artist,'');
  assert.equal(station.configured,true);
});






test('Eine geschlossene nicht-null Sitzung darf keine weiteren Aktionen ausführen', () => {
  const { h, listener, ls } = fixture(); ls.remove();
  assert.deepEqual(h.event(listener, ls, 'mw:wish.submit', wish), []);
});




test('Knuddels-Ansicht ist responsiv und schließt den alten JFX-Browser aus', () => {
  const { h, os } = fixture();
  assert.equal(os.content.responsive, true); assert.equal(os.content.allowJFXBrowser, false);
  assert.equal(os.content.htmlFile.getAssetPath(), 'index.html');
  assert.equal(os.content.viewMode, 'Headerbar'); assert.equal(os.content.height, 176);
});
test('Channelbeitritt und Appstart öffnen die Leiste; Wiederöffnen hinterlässt keine doppelte Sitzung', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer');
  assert.deepEqual(Object.keys(h.app.chatCommands).sort(), ['mw', 'settopic', 'update']);
  h.app.onUserJoined(user); const first = user.sessions[0];
  assert.equal(first.content.viewMode, 'Headerbar');
  h.app.chatCommands.mw(user,'');
  assert.equal(first.removed, false); assert.equal(user.sessions.length, 1);
  h.app.onAppStart(); assert.equal(user.sessions.length, 1);
  h.app.onUserLeft(user); assert.equal(user.sessions.length, 0);
});
test('Doppelte automatische Start-/Beitrittsereignisse erhalten dieselbe Radioleiste', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer');
  h.app.onUserJoined(user);
  const first = user.sessions[0], contentCount = h.contents.length;
  h.app.onAppStart(); h.app.onUserJoined(user); h.app.onUserJoined(user);
  assert.equal(user.sessions[0], first);
  assert.equal(first.removed, false);
  assert.equal(h.contents.length, contentCount, 'Kein zweites HTMLFile/AppContent erzeugen');
  first.remove(); h.app.onUserJoined(user);
  assert.equal(user.sessions.length, 1); assert.notEqual(user.sessions[0], first, 'Geschlossene Leiste wird neu geoeffnet');
});
test('Nicht unterstützte Headerbar öffnet kein Popup und erzeugt beim Beitritt keine Fehlermeldung', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer'); user.capable = false;
  h.app.onUserJoined(user); assert.equal(user.sessions.length, 0); assert.equal(user.messages.length, 1);
  assert.match(user.messages[0],/img\/welcome\/banner/,'Die private Begrüßung benötigt keine Headerbar');
  assert.doesNotMatch(user.messages[0],/Fehler|nicht unterstützt|konnte nicht/);
  h.app.chatCommands.mw(user,''); assert.equal(user.messages.length,2);assert.match(user.messages.at(-1), /Appleiste/);
  assert.equal(user.sessions.length,0);
});


















test('Eine native Overlayseite nimmt keine Daten eines anderen Bereichs an',()=>{
 const {h,owner,os}=fixture();let factory;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../app/www/js/core/model.js'),'utf8'),{MischWerkUI:{define(name,value){factory=value;}},document:{documentElement:{setAttribute(){}}}});const model=factory({bridge:{pageData:{view:'team'}},signals:{emit(){}}}),base=h.state(owner,os);model.receive({...base,revision:10,view:'team'});model.receive({...base,revision:11,view:'wishes'});assert.equal(model.current().view,'team');model.receive({...base,revision:9,view:'team'});assert.equal(model.current().revision,10);assert.equal('setView' in model,false);
});














test('Bereits nativ geschlossene Headerbar erhält auch bei verspätetem Close-Listener keinen remove-Aufruf',()=>{
 const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
 const callbacks=radio.content.closeListeners.splice(0);radio.nativeClose(false);radio.content.closeListeners.push(...callbacks);
 let removals=0;const remove=radio.remove;radio.remove=function(){removals++;return remove.call(this);};
 h.app.onUserLeft(owner);assert.equal(removals,0);
 callbacks.forEach(callback=>callback(owner,radio.content,false));h.app.onUserLeft(owner);assert.equal(removals,0);
});

test('Geschlossene Sitzung darf keine Events über eine andere aktive Sitzung desselben Inhalts einschleusen',()=>{
 const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
 const current=owner.sendAppContent(radio.content);assert.equal(radio.removed,true);
 const before=h.state(owner,current).wishPositions.total;
 h.event(owner,radio,'mw:wish.submit',{submissionId:'closed-session-input',text:'Verspäteter geschlossener Sender'});
 assert.equal(h.state(owner,current).wishPositions.total,before);
});

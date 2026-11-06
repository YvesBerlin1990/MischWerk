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

test('Aktive leere dunkle Ladeabdeckung steht vor Fähigkeitsprüfung und Versand fest', () => {
  for (const action of ['mw:openWishes', 'mw:openStudio', 'mw:openRadioTeam', 'mw:openSchedule']) {
    const { h, owner, os } = fixture();
    assert.deepEqual(os.content.loading, { background:'#0F1114', foreground:'#0F1114', text:'', enabled:false });
    const checked = [];
    for (const method of ['canSendAppContent', 'sendAppContent']) {
      const original = owner[method];
      owner[method] = function (content) {
        checked.push({ method, mode:content.viewMode, loading:{ ...content.loading } });
        return original.call(this, content);
      };
    }
    h.event(owner, os, action);
    assert.deepEqual(checked, ['canSendAppContent', 'sendAppContent'].map(method => ({ method, mode:'Overlay',
      loading:{ background:'#0F1114', foreground:'#0F1114', text:'', enabled:true } })), action);
    assert.equal(os.removed, false);
  }
});

test('Native Ersetzung beendet den Fensterablauf ohne nachträglichen Zugriff auf die alte Sitzung', () => {
  for (const action of ['mw:openWishes','mw:openStudio','mw:openRadioTeam','mw:openSchedule']) {
    const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');
    const old=owner.sessions.find(session=>session.content.viewMode==='Overlay');
    let returned=false, staleReads=0, replacing;
    old.content.addCloseListener((user,content,nativeReplacing)=>{replacing=nativeReplacing;});
    const getSessions=old.content.getSessions;
    old.content.getSessions=function(){if(returned)staleReads++;return getSessions.call(this);};
    const send=owner.sendAppContent;
    owner.sendAppContent=function(content){const session=send.call(this,content);returned=true;return session;};
    h.event(owner,os,action);h.finishOverlay(owner,old);
    assert.equal(lastResult(os.events).ok,true,action);
    assert.equal(staleReads,0,'Keine zweite Fensteroperation nach erfolgreichem nativem Ersetzen');
    assert.equal(replacing,true,'Native Close-Listener unterscheiden Ersetzen von Schließen');
    assert.equal(os.events.some(event=>event.type==='mw:overlay.closed'),false,'Kein Fokuswechsel beim Ersetzen');
    assert.equal(owner.sessions.length,2);assert.equal(os.removed,false);
    const current=owner.sessions.find(session=>session.content.viewMode==='Overlay');
    current.remove();
    assert.ok(os.events.some(event=>event.type==='mw:overlay.closed'||event.type==='mw:wishes.closed'));
  }
});

test('Native Wunschöffnung dedupliziert Zustellungen; erneuter bewusster Aufruf öffnet frisch',()=>{
 const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes',{requestId:'once'});const old=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 h.event(owner,os,'mw:openWishes',{requestId:'once'});assert.equal(old.removed,false);assert.equal(old.events.some(e=>e.type==='mw:overlay.prepare'),false);
 h.event(owner,os,'mw:openWishes',{requestId:'again'});h.finishOverlay(owner,old);const fresh=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.notEqual(fresh,old);assert.equal(old.removed,true);
 h.event(owner,os,'mw:openWishes',{requestId:'again'});assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay'),fresh);
});

test('Overlayöffnung lässt verspätete Wiederholungen abgeschlossener Aufträge nicht zur alten Ansicht zurückspringen',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio',{requestId:'first-studio'});
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,studio,'mw:overlay.dismiss',{state:{},revision:1});
  h.event(owner,os,'mw:openRadioTeam',{requestId:'new-team'});
  const team=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,os,'mw:openStudio',{requestId:'first-studio'});
  if(team.events.some(e=>e.type==='mw:overlay.prepare'))h.finishOverlay(owner,team);
  assert.equal(team.removed,false);assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay'),team);
});

test('Jeder bewusste native Aufruf erzeugt genau einen geprüften Inhalt, einschließlich Wiederöffnung desselben Bereichs',()=>{
 for(const action of ['mw:openStudio','mw:openRadioTeam','mw:openSchedule','mw:openWishes']){const {h,owner,os}=fixture(),count=h.contents.length;h.event(owner,os,action,{requestId:'first'});const old=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.equal(h.contents.length,count+1);h.event(owner,os,action,{requestId:'second'});h.finishOverlay(owner,old);assert.equal(h.contents.length,count+2);assert.equal(old.removed,true);assert.equal(owner.sessions.length,2);}
});

test('Overlayöffnung bleibt erfolgreich, wenn allein die nachgelagerte Öffnungsmitteilung fehlschlägt',()=>{
  const {h,owner,os}=fixture(),send=os.sendEvent;
  os.sendEvent=function(type,data){if(type==='mw:overlay.open')throw Error('Mitteilung verloren');return send.call(this,type,data);};
  h.event(owner,os,'mw:openStudio',{requestId:'notice-fails'});
  assert.equal(owner.sessions.some(s=>s.content.viewMode==='Overlay'),true);
  assert.equal(lastResult(os.events).ok,true,'Erfolgreiches Anzeigen darf nicht nachträglich als fehlgeschlagen gelten');
});

test('Overlayöffnung übermittelt eine frühe verlorene Wechselanfrage nach der eigenen Clientbereitschaft erneut',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,os,'mw:openRadioTeam',{requestId:'early-team'});
  h.event(owner,studio,'mw:ready');
  assert.ok(studio.events.some(e=>e.type==='mw:overlay.prepare'),'Bereitschaft wiederholt den noch offenen Token');
  h.finishOverlay(owner,studio);assert.equal(studio.removed,true);
  assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay').activeView,'team');
});

test('Overlayöffnung behält Rechte, Sitzungszuordnung und erneute Versuche nach Fehlern beim Wiederholungsschutz',()=>{
  const {h,owner,os,listener,ls}=fixture();
  const send=owner.sendAppContent;owner.sendAppContent=()=>false;
  assert.equal(lastResult(h.event(owner,os,'mw:openStudio',{requestId:'retry'})).ok,false);
  owner.sendAppContent=send;h.event(owner,os,'mw:openStudio',{requestId:'retry'});
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.ok(studio);
  owner.role='listener';assert.equal(lastResult(h.event(owner,os,'mw:openStudio',{requestId:'retry'})).ok,false);
  owner.role='owner';assert.equal(lastResult(h.event(owner,os,'mw:openRadioTeam',{requestId:'retry'})).ok,false);
  assert.equal(studio.removed,false);
  h.event(listener,ls,'mw:openSchedule',{requestId:'retry'});
  assert.equal(listener.sessions.some(s=>s.content.htmlFile.pageData.view==='schedule'),true);
  assert.equal(JSON.stringify(h.state(listener,ls)).includes('overlayRequests'),false);
  assert.equal(Object.keys(h.store.data).some(key=>/overlay/i.test(key)),false);
});

test('Overlayöffnung wiederholt abgelaufene oder schon abgeschlossene Wechsel bei später Bereitschaft nicht',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,os,'mw:openRadioTeam',{requestId:'expired'});h.advance(14001);
  h.event(owner,studio,'mw:ready');assert.equal(studio.events.some(e=>e.type==='mw:overlay.prepare'),false);
  assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);
  h.event(owner,os,'mw:openRadioTeam',{requestId:'fresh'});h.finishOverlay(owner,studio);
  const team=owner.sessions.find(s=>s.content.viewMode==='Overlay');h.event(owner,team,'mw:ready');
  assert.equal(team.events.some(e=>e.type==='mw:overlay.prepare'),false);
});

test('Authentifizierte Sitzungsprüfung erhält den bewährten Uservergleich auch bei neuen Plattformwrappern',()=>{
  const {h,owner,os,listener}=fixture(),content=os.content,getSessions=content.getSessions;
  content.getSessions=()=>getSessions.call(content).map(active=>({getUser:()=>active.getUser(),getOpenTimestamp:()=>active.getOpenTimestamp()}));
  assert.equal(h.event(owner,os,'mw:refresh').some(e=>e.type==='mw:state'),true);
  assert.equal(h.event(listener,os,'mw:refresh').length,0);
  content.getSessions=getSessions;
});

test('Alle vier Bereiche öffnen nativ mit eigenen Anfangsmaßen und privaten Entwürfen',()=>{
 const {h,owner,os,listener,ls}=fixture();let previous;const count=h.contents.length;
 for(const [action,kind,width,height] of [['mw:openStudio','studio',780,730],['mw:openRadioTeam','team',560,630],['mw:openSchedule','schedule',820,630],['mw:openWishes','wishes',560,340]]){
  h.event(owner,os,action);if(previous)h.finishOverlay(owner,previous,{draft:previous.activeView});const current=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  assert.equal(current.activeView,kind);assert.deepEqual([current.content.width,current.content.height],[width,height]);assert.equal(current.content.loading.enabled,true);assert.equal(current.content.responsive,true);assert.equal(current.content.allowJFXBrowser,false);assert.equal('sharedViews' in current.content.htmlFile.pageData,false);
  if(previous){assert.equal(previous.removed,true);assert.notEqual(current,previous);}assert.equal(owner.sessions.length,2);previous=current;
 }
 assert.equal(h.contents.length,count+4);h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,previous);const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.equal(h.state(owner,studio).overlayState.draft,'studio');assert.equal(JSON.stringify(h.state(listener,ls)).includes('draft'),false);assert.equal(os.removed,false);
});

test('Bereichswechsel prüft Token, Sitzungsbesitz, Revision und Fehler vor der Navigation',()=>{
  const {h,owner,os,listener,ls}=fixture();h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,studio,'mw:overlay.draft',{state:{value:'neu'},revision:4});
  h.event(owner,studio,'mw:overlay.draft',{state:{value:'alt'},revision:2});
  h.event(owner,os,'mw:openRadioTeam',{requestId:'to-team'});
  const token=studio.events.findLast(e=>e.type==='mw:overlay.prepare').data.token;
  h.event(listener,studio,'mw:overlay.ready',{token,state:{},revision:5});
  h.event(owner,os,'mw:overlay.ready',{token,state:{},revision:5});
  h.event(owner,studio,'mw:overlay.ready',{token:token+1,state:{},revision:5});
  assert.equal(studio.removed,false);assert.equal(ls.removed,false);
  h.event(owner,studio,'mw:overlay.ready',{token,state:{value:'veraltet'},revision:3});
  assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);
  h.event(owner,os,'mw:openRadioTeam',{requestId:'retry-team'});
  h.finishOverlay(owner,studio,{value:'neu'},true);
  assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);
  h.event(owner,os,'mw:openRadioTeam',{requestId:'timeout-team'});h.advance(14001);
  h.finishOverlay(owner,studio,{value:'zu spät'});assert.equal(studio.removed,false);
  h.event(owner,os,'mw:openRadioTeam',{requestId:'fresh-team'});
  h.finishOverlay(owner,studio,{value:'neu'},false,5);
  assert.equal(studio.removed,true);assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay').activeView,'team');assert.equal(lastResult(os.events).ok,true);
});

test('Overlayfehler, entzogene Rechte und fehlende Fähigkeiten erhalten den bisherigen Inhalt',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  owner.canSendAppContent=()=>false;h.event(owner,os,'mw:openSchedule');h.finishOverlay(owner,studio);assert.equal(lastResult(os.events).ok,false);
  assert.equal(studio.removed,false);owner.canSendAppContent=()=>true;
  h.event(owner,os,'mw:openRadioTeam',{requestId:'revoked'});owner.role='listener';h.finishOverlay(owner,studio);
  assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);owner.role='owner';
  h.event(owner,os,'mw:openSchedule',{requestId:'lost-capability'});
  owner.canSendAppContent=()=>false;h.finishOverlay(owner,studio);owner.canSendAppContent=()=>true;
  assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);assert.equal(os.removed,false);
  h.app.onUserLeft(owner);assert.equal(owner.sessions.length,0);
  assert.equal(h.event(owner,studio,'mw:overlay.draft',{state:{value:'alt'},revision:99}).length,0);
});

test('Native Wunschseite wird erst nach Übernahme ihrer letzten Eingabe ersetzt',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes');
  const surface=owner.sessions.find(s=>s.content.viewMode==='Overlay'),id=surface.content.htmlFile.pageData.wishSurfaceId;
  h.event(owner,surface,'mw:wishes.edit',{text:'Noch nicht übernommen',sequence:1});
  h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,surface);
  assert.equal(surface.removed,false);assert.equal(lastResult(os.events).ok,false);
  h.event(owner,os,'mw:wishes.sync',{surfaceId:id,text:'Noch nicht übernommen',sequence:1,disabled:false});
  h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,surface);
  assert.equal(surface.removed,true);assert.equal(owner.sessions.find(s=>s.content.viewMode==='Overlay').activeView,'studio');assert.equal(lastResult(os.events).ok,true);
  assert.equal(h.state(owner,os).queueTotal,0,'UI-Wechsel sendet keinen Wunsch');
});
const lastResult = events => {
  const data = events.findLast(event => event.type === 'mw:result' || event.type === 'mw:wish.receipt')?.data;
  return data && typeof data.accepted === 'boolean' ? { ...data, ok: data.accepted } : data;
};
function fixture() {
  const h = createHarness();
  const listener = h.user(1, 'Musikfreund'); const owner = h.user(2, 'Otterchen', 'owner');
  return { h, listener, owner, ls: h.open(listener), os: h.open(owner) };
}

test('Manuelles Aktualisieren bestätigt nur den angeforderten Snapshot und erhält alte Clients', () => {
  const {h,owner,os,listener,ls}=fixture();
  const response=h.event(owner,os,'mw:refresh',{requestId:'refresh-owner-1'});
  assert.equal(response.findLast(e=>e.type==='mw:state').data.refreshRequestId,'refresh-owner-1');
  assert.equal(response.some(e=>e.type==='mw:result'),false,'Erfolg gehört zum tatsächlichen Datenpaket');
  assert.equal(h.state(owner,os).refreshRequestId,undefined);
  h.event(owner,os,'mw:setTopic',{topic:'Neue Sendung'});
  assert.equal(ls.events.findLast(e=>e.type==='mw:state').data.refreshRequestId,undefined,'Push trägt keine fremde Anfrage-ID');
  assert.equal(h.event(listener,ls,'mw:refresh',{requestId:'refresh-listener'}).findLast(e=>e.type==='mw:state').data.refreshRequestId,'refresh-listener');
  assert.equal(h.event(owner,os,'mw:refresh',{requestId:'<invalid>'}).findLast(e=>e.type==='mw:result').data.ok,false);
  assert.equal(h.event(listener,os,'mw:refresh',{requestId:'forged-session'}).length,0);
  const getContent=os.getAppContent;
  let contentReads=0;
  os.getAppContent=function(){if(++contentReads>1)throw Error('simulierter Lesefehler');return getContent.call(this);};
  const failed=h.event(owner,os,'mw:refresh',{requestId:'refresh-error'}).findLast(e=>e.type==='mw:result').data;
  assert.equal(failed.requestId,'refresh-error');assert.equal(failed.ok,false);assert.match(failed.message,/Aktualisierung/);
  os.getAppContent=getContent;
  h.event(owner,os,'mw:openStudio',{requestId:'open-studio'});
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  owner.role='listener';
  const revoked=h.event(owner,studio,'mw:refresh',{requestId:'refresh-revoked'}).findLast(e=>e.type==='mw:state').data;
  assert.equal(revoked.refreshRequestId,'refresh-revoked'); assert.equal(revoked.user.canModerate,false); assert.deepEqual(revoked.queue,[]);
});
function legacyStore(requests, extra = {}) {
  const highest = requests.reduce((value, item) => Math.max(value, item.id), 0);
  return persistence({ 'mischwerk.state.v1': { version: 1, revision: 0, topic: '', requestsEnabled: true,
    moderator: null, requests, cooldowns: {}, nextId: highest + 1, radioModeratorUserIds: [],
    radioModeratorRevision: 0, ...extra } });
}
test('Vorhang-Chatbefehle prüfen authentifizierte Rechte statt behaupteter Namen',()=>{
  const {h,listener,owner,ls,os}=fixture();
  assert.deepEqual(h.state(listener,ls).curtain,{closed:true,audioVersion:h.config.version,exempt:false,canManage:false});
  assert.equal(h.state(owner,os).curtain.exempt,true);
  for(const [id,nick,role] of [[3,'Polaroid','listener'],[4,'ChannelMod','moderator'],[5,'AppManager','manager'],[6,'AndererInhaber','owner'],[7,'RadioMod','listener']]){
    const person=h.user(id,nick,role),session=h.open(person);if(id===7)appoint(h,owner,os,person);
    assert.equal(h.state(person,session).curtain.exempt,nick==='Polaroid');
    h.app.chatCommands.vorhang(person,'öffnen');assert.match(person.messages.at(-1),/Nur Otterchen/);
    assert.equal(h.state(listener,ls).curtain.closed,true);
  }
  owner.role='listener';h.app.chatCommands.vorhang(owner,'öffnen');assert.match(owner.messages.at(-1),/Nur Otterchen/);
  owner.role='owner';owner.online=false;h.app.chatCommands.vorhang(owner,'öffnen');assert.match(owner.messages.at(-1),/im MischWerk-Channel/);
});
test('Vorhang öffnet und schließt ausschließlich per Chat global; ungültige Angaben und alte UI-Events ändern nichts',()=>{
  const {h,listener,owner,ls,os}=fixture();
  h.app.chatCommands.vorhang(owner,' öffnen ');assert.equal(owner.messages.at(-1),'Vorhang geöffnet.');
  assert.equal(ls.events.findLast(e=>e.type==='mw:state').data.curtain.closed,false);
  const revision=h.state(listener,ls).revision;
  h.app.chatCommands.vorhang(owner,'ÖFFNEN');assert.match(owner.messages.at(-1),/bereits geöffnet/);
  assert.equal(h.state(listener,ls).revision,revision);
  for(const params of ['', 'toggle', 'öffnen jetzt','schließen Otterchen']){
    h.app.chatCommands.vorhang(owner,params);assert.match(owner.messages.at(-1),/Bitte verwende \/vorhang öffnen/);
    assert.equal(h.state(listener,ls).curtain.closed,false);
  }
  assert.equal(lastResult(h.event(owner,os,'mw:setCurtain',{closed:true,previousClosed:false})).ok,false);
  assert.equal(h.state(listener,ls).curtain.closed,false);
  h.app.chatCommands.vorhang(owner,'schließen');assert.equal(owner.messages.at(-1),'Vorhang geschlossen.');
  assert.equal(ls.events.findLast(e=>e.type==='mw:state').data.curtain.closed,true);
});
test('Vorhang-Chatbefehl braucht keine offene Radioansicht und erhält andere gespeicherte Einstellungen nach Neustart',()=>{
  const store=legacyStore([],{topic:'Meine Sendung',requestsEnabled:false});
  const h=createHarness(store),owner=h.user(1,'Otterchen','owner');
  h.app.chatCommands.vorhang(owner,'öffnen');assert.equal(owner.messages.at(-1),'Vorhang geöffnet.');
  const restarted=createHarness(store),person=restarted.user(2,'Musikfreund'),fresh=restarted.open(person),state=restarted.state(person,fresh);
  assert.equal(state.curtain.closed,false);assert.equal(state.topic,'Meine Sendung');assert.equal(state.requestsEnabled,false);
});
test('Fehlgeschlagene Vorhangspeicherung und Shutdown lassen den bestätigten Zustand erhalten',()=>{
  const {h,owner,os}=fixture();h.store.setObject=()=>{throw new Error('Speicher nicht verfügbar');};
  h.app.chatCommands.vorhang(owner,'öffnen');assert.match(owner.messages.at(-1),/nicht speichern/);
  assert.equal(h.state(owner,os).curtain.closed,true);
  h.app.onPrepareShutdown();h.app.chatCommands.vorhang(owner,'öffnen');assert.match(owner.messages.at(-1),/neu gestartet/);
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
test('main.js laedt fachlich getrennte Serverdateien statt eines Sammelbundles', () => {
  const h = createHarness();
  const { modules, checkBackend } = require('../../tools/build/backend.cjs');
  checkBackend();
  assert.deepEqual(h.loadedFiles, ['main.js', 'server/app.js', ...modules.filter(file => file !== 'app.js').map(file => 'server/' + file)]);
  const entry = fs.readFileSync(path.join(__dirname, '../../app/main.js'), 'utf8');
  assert.equal((entry.match(/KnuddelsServer.execute\(/g) || []).length, 1);
  assert.ok(entry.split('\n').length < 6);
  assert.doesNotMatch(entry, /onEventReceived\s*[:=]|\bpersist\s*\(|function\s*\(/);
});
test('Backend und Frontend haben eindeutige Schnittstellen und azyklische Abhängigkeiten', () => {
  const result = require('../../tools/checks/architecture.cjs').checkArchitecture();
  assert.equal(result.backendModules, 48);
  assert.equal(result.frontendComponents, 49);
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
test('Rechte kommen vom User, nicht vom Nick oder den Eventdaten', () => {
  const { h, listener, ls } = fixture(); listener.nick = 'Otterchen';
  for (const type of ['mw:setRequests', 'mw:setTopic', 'mw:onAir', 'mw:offAir', 'mw:resolveRequest']) {
    const result = lastResult(h.event(listener, ls, type, { enabled: false, id: 1, canModerate: true, userId: 2 }));
    assert.equal(result.ok, false);
  }
  assert.equal(h.state(listener, ls).requestsEnabled, true);
  assert.equal(h.state(listener, ls).user.canModerate, false);
});
test('/update erlaubt nur echte Appmanager und Channelinhaber, keine CM- oder Radiomoderatorrolle', () => {
  const { h, listener, owner, ls, os } = fixture();
  const initialInvalidations = h.cacheInvalidations.length;
  const cm = h.user(3, 'ChannelCM', 'moderator');
  appoint(h, owner, os, listener);
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
test('/update reiht nur einmal ein und verändert laufende Wünsche und Einstellungen nicht', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:wish.submit', { text: 'Bleibt bis zum Neustart' });
  h.event(owner, os, 'mw:setTopic', { topic: 'Rock' });
  const saved = JSON.stringify(h.store.data);
  h.app.chatCommands.update(owner, '');
  h.app.chatCommands.update(h.user(9, 'ZweiterManager', 'manager'), '');
  assert.equal(h.updateCalls.length, 1);
  const state = h.state(owner, os);
  assert.equal(state.queueTotal, 1); assert.equal(state.topic, 'Rock');
  assert.equal(state.shuttingDown, false, 'Erst der echte Knuddels-Hook beendet die Annahme');
  assert.equal(JSON.stringify(h.store.data), saved);
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
  h.rootInstance.availableFiles = ['www/js/team/markup.js', 'www/css/team.css'];
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
test('Ernannte Radiomoderation entfernt gespielte und nicht verfügbare Wünsche einzeln', () => {
  const { h, listener, owner, ls, os } = fixture();
  const mod = h.user(10, 'Radiomoderator'), ms = h.open(mod);
  appoint(h, owner, os, mod);
  for (const text of ['Gespielt', 'Nicht verfügbar', 'Noch offen']) {
    h.event(listener, ls, 'mw:wish.submit', { text });
  }
  h.event(mod, ms, 'mw:openStudio');
  const studio = mod.sessions.find(session => session.content.viewMode === 'Overlay');
  for (const outcome of ['done', 'discarded']) {
    const id = h.state(mod, studio).queue[0].id;
    const response = lastResult(h.event(mod, studio, 'mw:resolveRequest', { id, outcome }));
    assert.equal(response.ok, true); assert.match(response.message, /entfernt|verworfen/);
  }
  const remaining = h.state(mod, studio);
  assert.equal(remaining.queueTotal, 1); assert.equal(remaining.queue[0].text, 'Noch offen');
  const manager = h.user(11, 'NurAppmanager', 'manager'), managerSession = h.open(manager);
  assert.equal(lastResult(h.event(manager, managerSession, 'mw:resolveRequest', { id: remaining.queue[0].id })).ok, false);
  assert.equal(h.state(owner, os).queueTotal, 1);
});
test('Das neue Wunschprotokoll legt den Wunsch nur in die laufende Moderationsqueue', () => {
  const { h, listener, owner, ls, os } = fixture();
  const wrappedId = { toString() { return String(listener.id); } };
  const wrappedNick = { toString() { return listener.nick; } };
  listener.getUserId = () => wrappedId;
  listener.getNick = () => wrappedNick;
  const result = lastResult(h.event(listener, ls, 'mw:wish.submit', { text: 'A-ha – Take On Me', submissionId: 'wrapped-user' }));
  assert.equal(result.ok, true, result.message);
  const queued = h.state(owner, os).queue[0];
  assert.equal(queued.nick, listener.nick); assert.equal(queued.text, 'A-ha – Take On Me');
  assert.equal(h.state(listener, ls).myRequests.length, 0);
  assert.equal(h.store.data['mischwerk.wishes.v2'], undefined);
  assert.equal(h.logs.some(entry => entry.message.includes('[WISH_APPEND]')), false);
});
test('Unerwartete Wunschfehler nennen Phase, Fehlertyp und Zeile ohne Text oder Nutzerdaten', () => {
  const logs = [], receipts = [];
  const context = vm.createContext({ MischWerkModules: {}, KnuddelsServer: { getDefaultLogger: () => ({ warn: message => logs.push(message) }) } });
  for (const name of ['config.js', 'core/runtime.js', 'core/diagnostics.js', 'core/validation.js', 'wishes/queue.js', 'wishes/transport.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/backend', name), 'utf8'), context);
  }
  const runtime = context.MischWerkModules.createRuntime(context.MischWerkConfig);
  context.MischWerkModules.attachDiagnostics(runtime, context.MischWerkConfig);
  context.MischWerkModules.attachValidation(runtime, context.MischWerkConfig);
  context.MischWerkModules.attachWishQueue(runtime, context.MischWerkConfig);
  context.MischWerkModules.attachWishTransport(runtime);
  runtime.state = { requestsEnabled: true };
  runtime.send = (session, type, data) => receipts.push(data);
  const error = new SyntaxError('Interne Details und privater Wunsch'); error.lineNumber = 123;
  runtime.containsWishLink = () => { throw error; };
  runtime.handleWishSubmission({ getNick: () => 'Privater Nick' }, { text: 'Privater Song', submissionId: 'private-id' }, {});
  assert.equal(receipts[0].accepted, false);
  assert.match(logs[0], /\[WISH_LINK_CHECK\].*\[SyntaxError\].*\[Backend-Zeile:123\]/);
  assert.equal(runtime.wishItems().length, 0);
  assert.doesNotMatch(JSON.stringify(logs) + JSON.stringify(receipts), /Interne Details|Privater Song|Privater Nick/);
});
test('Session muss zum authentifizierten Nutzer gehören; geschlossene Sessions werden ignoriert', () => {
  const { h, listener, owner, ls } = fixture();
  assert.deepEqual(h.event(owner, ls, 'mw:setRequests', { enabled: false }), []);
  h.app.onEventReceived(listener, 'mw:wish.submit', wish, null);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
});
test('Der alte Wunschweg ist abgeschaltet und das neue Protokoll quittiert getrennt', () => {
  const { h, listener, owner, ls, os } = fixture();
  const oldEvents = h.event(listener, ls, 'mw:request', { text: 'Alter Transport', requestId: 'old-path' });
  assert.equal(oldEvents.some(event => event.type === 'mw:wish.receipt'), false);
  assert.equal(h.state(listener, ls).myTotal, 0);
  const events = h.event(listener, ls, 'mw:wish.submit', { text: 'Neuer Transport', submissionId: 'new-path' });
  assert.equal(events.some(event => event.type === 'mw:wish.receipt' && event.data.accepted), true);
  assert.equal(events.some(event => event.type === 'mw:result'), false);
  assert.equal(h.state(listener, ls).myTotal, 0);
  assert.equal(h.state(owner, os).queueTotal, 1);
});
test('Wunschbox kann geschlossen werden; Backend weist Wünsche dann ab', () => {
  const { h, listener, owner, ls, os } = fixture();
  assert.equal(lastResult(h.event(owner, os, 'mw:setRequests', { enabled: false })).ok, true);
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', wish)).ok, false);
  h.event(owner, os, 'mw:setRequests', { enabled: true });
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', wish)).ok, true);
});
test('Nur ein ernannter Radiomoderator steuert Wunschbox und persistentes Sendungsthema für alle Hörer', () => {
  const {h,listener,owner,ls,os}=fixture();
  const mod=h.user(4,'StudioMod','moderator'),ms=h.open(mod);
  assert.equal(h.state(listener,ls).topic,'');
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Unerlaubt'})).ok,false,'Channelmoderator allein ist nicht berechtigt');
  appoint(h,owner,os,mod);
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'  80er\n und 90er  '})).ok,true);
  assert.equal(h.state(listener,ls).topic,'80er und 90er');
  assert.equal(h.state(owner,os).topic,'80er und 90er');
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:false})).ok,true);
  assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text:'Mein Wunsch'})).ok,false);
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true})).ok,true);
  assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text:'Mein Wunsch'})).ok,true);
  const restarted=createHarness(h.store),ru=restarted.user(9,'Hoerer'),rs=restarted.open(ru);
  assert.equal(restarted.state(ru,rs).topic,'80er und 90er');
  const persistedMod=restarted.user(mod.id,mod.nick,'listener'),persistedSession=restarted.open(persistedMod);
  assert.equal(restarted.state(persistedMod,persistedSession).user.canModerate,true,'Ernennung bleibt nach Neustart erhalten');
  removeRadioModerator(h,owner,os,mod);
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Unerlaubt'})).ok,false);
  assert.equal(h.state(listener,ls).topic,'80er und 90er');
  assert.equal(lastResult(h.event(owner,os,'mw:setTopic',{topic:''})).ok,true);
  assert.equal(h.state(listener,ls).topic,'');
});

test('Thema validiert Text und Länge; Speicherfehler und alte Daten bewahren den Zustand', () => {
  const {h,listener,owner,ls,os}=fixture();
  h.event(owner,os,'mw:setTopic',{topic:'Rock & Pop'});
  for(const topic of [null,{},42,'A'.repeat(81)]){
    assert.equal(lastResult(h.event(owner,os,'mw:setTopic',{topic})).ok,false);
    assert.equal(h.state(listener,ls).topic,'Rock & Pop');
  }
  const old=h.store.data['mischwerk.state.v1'];
  delete old.topic;
  const legacy=createHarness(h.store),lu=legacy.user(8,'Altbestand','owner'),ss=legacy.open(lu);
  assert.equal(legacy.state(lu,ss).topic,'');
  assert.equal(legacy.state(lu,ss).requestsEnabled,true);
  const saved=h.store.setObject;
  h.store.setObject=()=>{throw new Error('disk full');};
  const rejected=lastResult(h.event(owner,os,'mw:setTopic',{topic:'Neues Thema'}));
  h.store.setObject=saved;
  assert.equal(rejected.ok,false);
  assert.equal(h.state(listener,ls).topic,'Rock & Pop');
});

test('Mehr als zwei Wünsche dürfen ohne Wartezeit direkt nacheinander gesendet werden', () => {
  const { h, listener, owner, ls, os } = fixture();
  for(let i=0;i<4;i++){assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text:'Wunsch '+i,submissionId:'direkt-'+i})).ok,true);}
  assert.equal(h.state(listener,ls).myTotal,0);
  assert.equal(h.state(owner,os).queueTotal,4);
});
test('Private Grüße und Nutzer-IDs gehen nicht an andere Hörer; Moderation erhält die Queue', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:wish.submit', { ...wish, nick: 'Fälschung' });
  const stranger = h.user(3, 'Zuhörer'); const ss = h.open(stranger);
  assert.equal(h.state(stranger, ss).queue.length, 0); assert.equal(h.state(stranger, ss).myRequests.length, 0);
  const queue = h.state(owner, os).queue;
  assert.equal(queue[0].nick, 'Musikfreund'); assert.equal(queue[0].text, wish.text);
  assert.equal('userId' in queue[0], false);
});
test('Moderatorrechte werden bei jeder Aktion und beim Lesen erneut geprüft', () => {
  const { h, listener, owner, ls, os } = fixture();
  listener.role = 'moderator';
  assert.equal(h.state(listener, ls).user.canModerate, false,'Channelmoderator hat keinen automatischen Zugriff');
  appoint(h,owner,os,listener);
  assert.equal(h.state(listener, ls).user.canModerate, true);
  removeRadioModerator(h,owner,os,listener);
  assert.equal(lastResult(h.event(listener, ls, 'mw:setRequests', { enabled: false })).ok, false);
  assert.equal(h.state(listener, ls).queue.length, 0);
});
test('Channelinhaber verwaltet das Radio-Team über eine eigene persistente Rollenliste', () => {
  const {h,listener,owner,ls,os}=fixture();
  const channelModerator=h.user(7,'KanalMod','moderator'),cms=h.open(channelModerator);
  assert.equal(h.state(channelModerator,cms).user.canModerate,false);
  assert.equal(lastResult(h.event(channelModerator,cms,'mw:addRadioModerator',{nick:listener.nick})).ok,false,'Nur der Channelinhaber darf ernennen');
  assert.equal(lastResult(h.event(owner,os,'mw:addRadioModerator',{nick:'NichtVorhanden'})).ok,false);
  const revision=h.state(owner,os).radioModeratorRevision;
  assert.equal(lastResult(h.event(owner,os,'mw:addRadioModerator',{nick:'kanalmod',expectedRadioModeratorRevision:revision})).ok,true);
  let state=h.state(owner,os);
  assert.deepEqual(state.radioModerators,[{userId:channelModerator.id,nick:'KanalMod'}]);
  assert.equal(h.state(channelModerator,cms).user.canModerate,true);
  assert.equal(lastResult(h.event(owner,os,'mw:addRadioModerator',{nick:'KanalMod',expectedRadioModeratorRevision:state.radioModeratorRevision})).ok,false,'Doppelte Ernennung ablehnen');
  assert.equal(lastResult(h.event(owner,os,'mw:addRadioModerator',{nick:listener.nick,expectedRadioModeratorRevision:revision})).ok,false,'Veraltete Team-Änderung ablehnen');
  assert.equal(lastResult(h.event(owner,os,'mw:addRadioModerator',{nick:owner.nick,expectedRadioModeratorRevision:state.radioModeratorRevision})).ok,true,'Besitzer kann den Button ausdrücklich freigeben');
  removeRadioModerator(h,owner,os,owner);
  removeRadioModerator(h,owner,os,channelModerator);
  state=h.state(owner,os);
  assert.deepEqual(state.radioModerators,[]);
  assert.equal(h.state(channelModerator,cms).user.canModerate,false);
  const members=[];
  for(let index=0;index<7;index++){
    const member=h.user(30+index,'RadioTeam'+index);members.push(member);appoint(h,owner,os,member);
  }
  state=h.state(owner,os);
  assert.equal(state.radioModeratorTotal,7);assert.equal(state.radioModerators.length,3);
  assert.equal(state.radioModeratorPage,0);assert.equal(state.radioModeratorPages,3);
  const secondPage=h.state(owner,os,0,undefined,1);
  assert.equal(secondPage.radioModeratorPage,1);assert.equal(secondPage.radioModerators.length,3);
});
test('Radio-Team ist ein eigenes Besitzer-Popup; Entzug beendet eine laufende Studio-Anmeldung', () => {
  const {h,listener,owner,ls,os}=fixture();
  const radioMod=h.user(8,'RadioMod','moderator'),rms=h.open(radioMod);
  assert.equal(lastResult(h.event(listener,ls,'mw:openRadioTeam')).ok,false);
  assert.equal(lastResult(h.event(radioMod,rms,'mw:openStudio')).ok,false,'Channelmoderator kann das Studio nicht öffnen');
  assert.equal(lastResult(h.event(owner,os,'mw:openRadioTeam')).ok,true);
  const team=owner.sessions.find(session=>session.content.viewMode==='Overlay');
  assert.equal(team.content.width,560);assert.equal(team.content.height,630);
  assert.equal(team.content.htmlFile.getPageData().view,'team');assert.equal(os.removed,false);
  appoint(h,owner,team,radioMod);
  assert.equal(lastResult(h.event(radioMod,rms,'mw:openStudio')).ok,true);
  const studio=radioMod.sessions.find(session=>session.content.viewMode==='Overlay');
  h.event(radioMod,studio,'mw:onAir');
  assert.equal(h.state(owner,os).moderator.nick,'RadioMod');
  removeRadioModerator(h,owner,team,radioMod);
  assert.equal(h.state(owner,os).moderator,null);
  assert.equal(h.state(radioMod,studio).user.canModerate,false);
  assert.equal(lastResult(h.event(radioMod,studio,'mw:setTopic',{topic:'Nicht mehr erlaubt'})).ok,false);
});
test('Ungültige Texte und nichtboolesche Schalter werden verworfen', () => {
  const { h, listener, owner, ls, os } = fixture();
  for (const data of [{ artist: '', title: 'X' }, { artist: 'a'.repeat(81), title: 'X' }, { artist: {}, title: 'X' }]) {
    assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', data)).ok, false);
  }
  assert.equal(lastResult(h.event(owner, os, 'mw:setRequests', { enabled: 'false' })).ok, false);
});

test('Fehlgeschlagener Rechteentzug erhält Moderation, Thema und offene Übergabe', () => {
  const { h, listener, owner, ls, os } = fixture();
  appoint(h, owner, os, listener);
  h.event(listener, ls, 'mw:onAir');
  h.event(listener, ls, 'mw:setTopic', { topic: 'Laufende Sendung' });
  const before = h.state(listener, ls);
  h.event(listener, ls, 'mw:handover.request', { nick: owner.nick, expectedModerator: before.moderator.sessionKey });
  const handover = h.state(listener, ls).handover;
  const write = h.store.setObject;
  h.store.setObject = () => { throw new Error('Privater Speicherfehler'); };
  const result = lastResult(h.event(owner, os, 'mw:removeRadioModerator', {
    userId: listener.id, expectedRadioModeratorRevision: before.radioModeratorRevision
  }));
  h.store.setObject = write;
  assert.equal(result.ok, false);
  const after = h.state(listener, ls);
  assert.deepEqual(after.moderator, before.moderator);
  assert.equal(after.topic, before.topic);
  assert.equal(after.user.canModerate, true);
  assert.deepEqual(after.handover, handover);
});
test('Neustart leert die flüchtige Wunschqueue und bewahrt den Wunschbox-Status', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:wish.submit', wish); h.event(owner, os, 'mw:setRequests', { enabled: false });
  const restarted = createHarness(h.store); const ro = restarted.user(2, 'Otterchen', 'owner'); const rs = restarted.open(ro);
  assert.equal(restarted.state(ro, rs).queue.length, 0); assert.equal(restarted.state(ro, rs).requestsEnabled, false);
  restarted.advance(48 * 3600000 + 1); assert.equal(restarted.state(ro, rs).queue.length, 0);
});
test('On-Air nutzt echten Nick; erfolgreiche Abmeldung löscht das Thema; Anmeldung läuft ab', () => {
  const { h, listener, owner, ls, os } = fixture(); listener.role = 'moderator'; appoint(h,owner,os,listener);
  h.event(owner,os,'mw:setTopic',{topic:'Rock'});
  h.event(listener, ls, 'mw:onAir', { nick: 'Fälschung' });
  assert.equal(h.state(owner, os).moderator.nick, listener.nick);
  const other = h.user(4, 'AndereMod', 'moderator'); const ss = h.open(other);
  assert.equal(lastResult(h.event(other, ss, 'mw:offAir')).ok, false);
  assert.equal(h.state(owner,os).topic,'Rock','Abgewiesene Fremd-Abmeldung verändert das Thema nicht');
  assert.equal(lastResult(h.event(owner, os, 'mw:offAir')).ok, true);
  assert.equal(h.state(owner,os).topic,'','Erfolgreiches Beenden durch den Besitzer entfernt das Thema');
  h.event(owner,os,'mw:setTopic',{topic:'Jazz'});
  assert.equal(lastResult(h.event(owner,os,'mw:offAir')).ok,false,'Ohne aktive Moderation gibt es keine erfolgreiche Abmeldung');
  assert.equal(h.state(owner,os).topic,'Jazz','Abmeldung ohne aktive Moderation entfernt kein Thema');
  h.event(listener, ls, 'mw:onAir'); h.advance(6 * 3600000 + 1);
  assert.equal(h.state(owner, os).moderator, null);
  assert.equal(h.state(owner,os).topic,'Jazz','Automatischer Ablauf behält das Thema');
});

test('ON AIR endet beim Channel-Verlassen oder Rechteverlust und behält Wünsche und Thema',()=>{
  const {h,listener,owner,ls,os}=fixture();
  const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  appoint(h,owner,os,mod);
  h.event(listener,ls,'mw:wish.submit',{text:'Band – Song'});h.event(owner,os,'mw:setTopic',{topic:'Rock'});
  h.event(mod,ms,'mw:onAir');
  h.app.onUserLeft(mod);
  assert.equal(os.events.findLast(e=>e.type==='mw:state').data.moderator,null,'Andere Ansichten sofort aktualisieren');
  assert.equal(h.state(owner,os).moderator,null);
  const again=h.open(mod);h.event(mod,again,'mw:onAir');removeRadioModerator(h,owner,os,mod);
  const state=h.state(owner,os);
  assert.equal(state.moderator,null);assert.equal(state.queueTotal,1);assert.equal(state.topic,'Rock');
  appoint(h,owner,os,mod);h.event(mod,again,'mw:onAir');mod.online=false;
  assert.equal(h.state(owner,os).moderator,null,'Auch verpassten Leave-Hook beim nächsten Lesen erkennen');
});

test('Studio-Rechte, bewusste Verlängerung und veraltete Abmeldungen folgen der echten Moderationssitzung',()=>{
  const {h,listener,owner,os}=fixture();
  const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod),other=h.user(10,'ZweiterMod','moderator'),ss=h.open(other);
  appoint(h,owner,os,mod);appoint(h,owner,os,other);
  assert.equal(h.state(owner,os).user.canEndModeration,false);
  h.event(mod,ms,'mw:onAir',{expectedModerator:null});
  let state=h.state(mod,ms),key=state.moderator.sessionKey,expires=state.moderator.expiresAt;
  assert.equal(state.user.isOnAir,true);assert.equal(state.user.canEndModeration,true);
  assert.equal(h.state(other,ss).user.canEndModeration,false);assert.equal(h.state(owner,os).user.canEndModeration,true);
  assert.equal(h.state(listener,h.open(listener)).user.canEndModeration,false);
  assert.equal(lastResult(h.event(other,ss,'mw:offAir',{canEndModeration:true})).ok,false);
  h.advance(60000);h.event(mod,ms,'mw:onAir',{expectedModerator:key});
  state=h.state(mod,ms);assert.ok(state.moderator.expiresAt>expires);assert.notEqual(state.moderator.sessionKey,key);
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:key})).ok,false);
  key=state.moderator.sessionKey;
  h.event(mod,ms,'mw:handover.request',{expectedModerator:key,nick:other.nick});
  h.event(other,ss,'mw:handover.accept',{id:h.state(other,ss).handover.incoming.id,topic:''});
  assert.equal(lastResult(h.event(mod,ms,'mw:onAir',{expectedModerator:key})).ok,false,'Veraltete Übernahme nicht anwenden');
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:key})).ok,false,'Alte Abmeldung beendet keine neue Sendung');
  assert.equal(h.state(owner,os).moderator.nick,'ZweiterMod');
  h.event(owner,os,'mw:setTopic',{topic:'Rock'});
  const store=h.store.setObject;h.store.setObject=()=>{throw new Error('disk full');};
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:h.state(owner,os).moderator.sessionKey})).ok,false);
  h.store.setObject=store;assert.equal(h.state(owner,os).moderator.nick,'ZweiterMod');
  assert.equal(h.state(owner,os).topic,'Rock','Fehlgeschlagene Abmeldung entfernt das Thema nicht halbseitig');
});

test('Speicherfehler beim Verlassen lässt keine unbestätigte ON-AIR-Anzeige stehen oder beim Wiederbeitritt aufleben',()=>{
  const {h,owner,os}=fixture();const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  appoint(h,owner,os,mod);
  h.event(mod,ms,'mw:onAir');
  const save=h.store.setObject;h.store.setObject=()=>{throw new Error('disk full');};
  h.app.onUserLeft(mod);
  assert.equal(os.events.findLast(e=>e.type==='mw:state').data.moderator,null,'Anzeige auch bei fehlgeschlagener Speicherung sofort aus');
  assert.equal(h.state(owner,os).moderator,null);
  h.store.setObject=save;
  h.open(mod);assert.equal(h.state(owner,os).moderator,null,'Wiederbeitritt erfordert neue Anmeldung');
});

test('Gleichzeitige Themen- und Wunschbox-Änderungen überschreiben keinen neueren fachlichen Stand',()=>{
  const {h,owner,os}=fixture();const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  appoint(h,owner,os,mod);
  h.event(owner,os,'mw:setTopic',{topic:'Rock',previousTopic:''});
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Jazz',previousTopic:''})).ok,false);
  assert.equal(h.state(owner,os).topic,'Rock');
  h.event(owner,os,'mw:onAir'); // Andere Zustandsrevision sperrt eine gültige Themenänderung nicht.
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Jazz',previousTopic:'Rock'})).ok,true);
  h.event(owner,os,'mw:setRequests',{enabled:false,previousEnabled:true});
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true,previousEnabled:true})).ok,false);
  assert.equal(h.state(owner,os).requestsEnabled,false);
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true,previousEnabled:false})).ok,true);
});

test('Parallele Bearbeitung hält den angezeigten Wunsch und quittiert weiterhin die richtige ID',()=>{
  const {h,listener,owner,ls,os}=fixture();
  for(const text of ['A','B','C','D'])h.event(listener,ls,'mw:wish.submit',{text});
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  const other=h.user(9,'ZweiterMod','moderator'),ss=h.open(other);appoint(h,owner,os,other);h.event(other,ss,'mw:openStudio');
  const second=other.sessions.find(s=>s.content.viewMode==='Overlay');
  const item=h.state(owner,studio,1).queue[0],first=h.state(other,second).queue[0];
  h.event(other,second,'mw:resolveRequest',{id:first.id,outcome:'done'});
  let pushed=studio.events.findLast(e=>e.type==='mw:state').data;
  assert.equal(pushed.queue[0].id,item.id);assert.equal(pushed.page,0);
  h.event(owner,studio,'mw:refresh',{});assert.equal(studio.events.findLast(e=>e.type==='mw:state').data.queue[0].id,item.id);
  h.event(owner,studio,'mw:ackRequest',{id:item.id});
  assert.equal(h.state(owner,studio).queue[0].delivery.nick,'Otterchen');
  assert.equal(h.state(listener,ls).myRequests.length,0);
  h.event(owner,studio,'mw:resolveRequest',{id:item.id,outcome:'discarded'});
  pushed=studio.events.findLast(e=>e.type==='mw:state').data;assert.equal(pushed.queue[0].text,'C');
  h.state(owner,studio,1);h.event(owner,studio,'mw:resolveRequest',{id:4});
  pushed=studio.events.findLast(e=>e.type==='mw:state').data;assert.equal(pushed.queue[0].text,'C');assert.equal(pushed.page,0);
});

test('Wunsch-Aktionen melden Erledigt und Verwerfen eindeutig; ungültige Aktionen erhalten die Queue',()=>{
  const {h,listener,owner,ls,os}=fixture();
  h.event(listener,ls,'mw:wish.submit',{text:'Band – Song'});const id=h.state(owner,os).queue[0].id;
  assert.equal(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'play-now'})).ok,false);
  assert.equal(h.state(owner,os).queueTotal,1);
  assert.match(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'discarded'})).message,/verworfen/);
  assert.equal(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'done'})).ok,false);
  h.event(listener,ls,'mw:wish.submit',{text:'Neuer Song'});
  assert.match(lastResult(h.event(owner,os,'mw:resolveRequest',{id:h.state(owner,os).queue[0].id,outcome:'done'})).message,/erledigt/);
});
test('Queue hat keine feste Wunschanzahl, bleibt paginiert und unter dem Knuddels-Eventlimit', () => {
  const { h, owner, os } = fixture();
  let firstUser; let firstSession;
  for (let i = 0; i < 120; i++) {
    const user = h.user(100 + i, 'Hörer' + i); const session = h.open(user);
    if (i === 0) { firstUser = user; firstSession = session; }
    assert.equal(lastResult(h.event(user, session, 'mw:wish.submit', {
      text: 'ä'.repeat(80) + ' – ' + 'T'.repeat(80) + ' · ' + 'G'.repeat(130), submissionId: 'queue-' + i
    })).ok, true);
  }
  assert.equal(lastResult(h.event(firstUser, firstSession, 'mw:wish.submit', {
    text: 'ä'.repeat(80) + ' – ' + 'T'.repeat(80) + ' · ' + 'G'.repeat(130), submissionId: 'queue-0'
  })).ok, true, 'Auch nach Begrenzung technischer Quittungen kein doppelter offener Wunsch');
  const snapshot = h.state(owner, os, 2);
  assert.equal(snapshot.queue.length, 1); assert.equal(snapshot.pages, 120); assert.ok(JSON.stringify(snapshot).length < 10000);
  const extra = h.user(999, 'WeitererHörer'); const es = h.open(extra);
  assert.equal(lastResult(h.event(extra, es, 'mw:wish.submit', wish)).ok, true);
  const id = snapshot.queue[0].id; h.event(owner, os, 'mw:resolveRequest', { id });
  assert.equal(h.state(owner, os).queueTotal, 120);
});
test('Channel verlassen schließt die UI, Löschung entfernt persönliche Daten', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:wish.submit', wish); h.app.onUserLeft(listener); assert.equal(ls.removed, true);
  listener.online = false; assert.deepEqual(h.event(listener, ls, 'mw:wish.submit', wish), []);
  h.app.onUserDeleted(listener.id); assert.equal(h.state(owner, os).queueTotal, 0);
});
test('STREAMPANEL verwendet die bestätigten öffentlichen MischWerk-SPCast-Anschlüsse', () => {
  const {h,owner,os}=fixture(),station=h.state(owner,os).station;
  assert.equal(station.provider,'streampanel');assert.equal(station.configured,true);
  assert.equal(station.streamUrl,'https://mischwerk.sp.radio.fm/stream');
  assert.equal(station.metadataUrl,'https://scripts.streampanel.net/spcast/player/default/api.php?url=mischwerk.spcast.eu&userid=8884&historic=true');
  assert.equal(station.fields.title,'currentSong');assert.equal(station.fields.artist,'currentArtist');
  assert.equal(station.fields.live,'');
  assert.deepEqual(station.allowedHosts,['mischwerk.sp.radio.fm','mischwerk.spcast.eu','scripts.streampanel.net']);
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
  assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',wish)).ok,true);
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

test('Alte UserPersistence-Wartezeiten werden nicht mehr gelesen und blockieren keine Wünsche', () => {
  const { h, listener, owner, ls, os } = fixture();
  listener.persistence.getNumber = () => { throw new Error('obsolete cooldown must not be read'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'atomic-request' })).ok, true);
  assert.equal(h.state(owner, os).queueTotal, 1);
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'another-request' })).ok, true);
});
test('Eine defekte andere UI-Sitzung ändert keine erfolgreiche Wunschannahme', () => {
  const { h, listener, owner, ls, os } = fixture();
  const sendEvent=os.sendEvent;
  os.sendEvent = () => { throw new Error('closed transport'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', wish)).ok, true);
  os.sendEvent=sendEvent;
  assert.equal(h.state(owner, os).queueTotal, 1);
});
test('Push-Updates bewahren die ausgewählte Moderationsseite', () => {
  const { h, owner, os } = fixture();
  for (let i = 0; i < 10; i++) { const user = h.user(100 + i, 'Hörer' + i); h.event(user, h.open(user), 'mw:wish.submit', wish); }
  assert.equal(h.state(owner, os, 1).page, 1);
  os.events = [];
  const extra = h.user(200, 'NeuerHörer'); h.event(extra, h.open(extra), 'mw:wish.submit', wish);
  assert.equal(os.events.findLast(event => event.type === 'mw:state').data.page, 1);
});
test('Erneut übertragener Wunsch mit derselben ID wird nicht doppelt angelegt', () => {
  const { h, listener, owner, ls, os } = fixture();
  const data = { ...wish, submissionId: 'retry-request' };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', data)).ok, true);
  const id = h.state(owner, os).queue[0].id;
  h.event(owner, os, 'mw:resolveRequest', { id });
  h.event(owner, os, 'mw:setRequests', { enabled: false });
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', data)).ok, true);
  assert.equal(h.state(owner, os).queueTotal, 0);
});
test('Wiederholungsschutz bleibt ohne Wunschbegrenzung für die ganze App-Sitzung erhalten', () => {
  const { h, listener, owner, ls, os } = fixture();
  const first = { text: 'Erster Wunsch', submissionId: 'session-first' };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', first)).ok, true);
  const firstId = h.state(owner, os).queue[0].id;
  h.event(owner, os, 'mw:resolveRequest', { id: firstId, outcome: 'done' });
  for (let index = 0; index < 120; index++) {
    assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', {
      text: 'Wunsch ' + index, submissionId: 'session-' + index
    })).ok, true);
  }
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', first)).ok, true);
  assert.equal(h.state(owner, os).queueTotal, 120, 'Alte Übertragungs-ID darf keinen zweiten Wunsch anlegen');
});
test('Eine geschlossene nicht-null Sitzung darf keine weiteren Aktionen ausführen', () => {
  const { h, listener, ls } = fixture(); ls.remove();
  assert.deepEqual(h.event(listener, ls, 'mw:wish.submit', wish), []);
});
test('Wunschtransport verwendet keinen String-Speicher', () => {
  const { h, listener, owner, ls, os } = fixture();
  const original = h.store.setString; h.store.setString = () => { throw new Error('disk failed'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'retry-after-disk' })).ok, true);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
  assert.equal(h.state(owner, os).queueTotal, 1);
  h.store.setString = original;
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'retry-after-disk' })).ok, true);
  assert.equal(h.state(owner, os).queueTotal, 1);
});
test('Übertragungs-IDs werden validiert und Speicherfehler berühren den Laufzeitweg nicht', () => {
  const { h, listener, owner, ls, os } = fixture();
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'x'.repeat(81) })).ok, false);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
  h.store.setString = () => { throw new Error('secret internal path'); };
  const response = lastResult(h.event(listener, ls, 'mw:wish.submit', { ...wish, submissionId: 'safe-id' }));
  assert.equal(response.submissionId, 'safe-id'); assert.equal(response.accepted, true);
  assert.equal(response.ok, true); assert.ok(!response.message.includes('secret'));
  assert.equal(h.state(owner,os).queueTotal,1);
  assert.ok(h.logs.every(entry => !entry.message.includes('secret internal path')));
});
test('Historische Wünsche werden nicht in die neue Laufzeitqueue übernommen', () => {
  const timestamp = Date.now() - 1000;
  const store = legacyStore([{ id: 7, userId: 1, nick: 'Musikfreund', artist: 'Alte Band', title: 'Alter Titel',
    message: 'Alter Gruß', delivery: null, requestId: 'legacy-request', createdAt: timestamp }]);
  const h = createHarness(store); const listener = h.user(1, 'Musikfreund'); const session = h.open(listener);
  const owner=h.user(2,'Otterchen','owner'),ownerSession=h.open(owner);
  assert.equal(h.state(owner, ownerSession).queueTotal,0);
  assert.equal(store.data['mischwerk.wishes.v2'],undefined);
  assert.equal(lastResult(h.event(listener, session, 'mw:wish.submit', { text: 'Neuer Wunsch', submissionId: 'new-request' })).ok, true);
  assert.equal(h.state(listener, session).myTotal, 0);
  assert.equal(h.state(owner, ownerSession).queueTotal,1);
});
test('Wünsche sind vollständig von jeder Persistenz getrennt', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.store.setObject = () => { throw new Error('allgemeiner Zustand gesperrt'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:wish.submit', { text: 'Eigener Speicherweg', submissionId: 'separate-store' })).ok, true);
  assert.equal(h.state(listener, ls).myRequests.length,0);
  assert.equal(h.state(owner, os).queue[0].text,'Eigener Speicherweg');
  assert.equal(h.store.data['mischwerk.wishes.v2'],undefined);
});
test('Knuddels-Ansicht ist responsiv und schließt den alten JFX-Browser aus', () => {
  const { h, os } = fixture();
  assert.equal(os.content.responsive, true); assert.equal(os.content.allowJFXBrowser, false);
  assert.equal(os.content.htmlFile.getAssetPath(), 'index.html');
  assert.equal(os.content.viewMode, 'Headerbar'); assert.equal(os.content.height, 176);
});
test('Channelbeitritt und Appstart öffnen die Leiste; Wiederöffnen hinterlässt keine doppelte Sitzung', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer');
  assert.deepEqual(Object.keys(h.app.chatCommands).sort(), ['mischwerk', 'mischwerk-relay', 'mischwerk-web', 'mw', 'update', 'vorhang']);
  h.app.onUserJoined(user); const first = user.sessions[0];
  assert.equal(first.content.viewMode, 'Headerbar');
  h.app.chatCommands.mischwerk(user);
  assert.equal(first.removed, true); assert.equal(user.sessions.length, 1);
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
  h.app.onUserJoined(user); assert.equal(user.sessions.length, 0); assert.equal(user.messages.length, 0);
  h.app.chatCommands.mischwerk(user); assert.match(user.messages[0], /Channel.*leiste/);
});
test('Wunschbox und Moderation wechseln als Channel-Overlays bei erhaltener Radioleiste', () => {
  const {h,owner,os} = fixture();
  assert.equal(lastResult(h.event(owner,os,'mw:openWishes')).ok,true);
  assert.equal(owner.sessions.length,2);
  const overlay=owner.sessions.find(session=>session.content.viewMode==='Overlay');assert.ok(overlay);
  assert.ok(os.events.some(event=>event.type==='mw:wishes.open'));
  assert.equal(os.removed,false);
  h.event(owner,os,'mw:openStudio'); h.finishOverlay(owner,overlay);
  const studio=owner.sessions.find(session=>session.content.viewMode==='Overlay');
  assert.notEqual(studio,overlay);assert.equal(studio.activeView,'studio');
  assert.equal(studio.events.some(e=>e.type==='mw:view'),false);
  assert.equal(os.removed,false);
  assert.equal(studio.content.htmlFile.getPageData().view,'studio','Neues natives Dokument für den Zielbereich');
  assert.equal(overlay.removed,true);
  h.event(owner,studio,'mw:setRequests',{enabled:false});
  assert.equal(h.state(owner,os).requestsEnabled,false);
  h.app.onUserLeft(owner); assert.equal(owner.sessions.length,0);
});
test('Studio-Popup prüft Rechte im Backend; abgelehntes Popup schließt die Leiste nicht', () => {
  const {h,listener,ls} = fixture();
  assert.equal(lastResult(h.event(listener,ls,'mw:openStudio',{canModerate:true})).ok,false);
  assert.equal(listener.sessions.length,1); assert.equal(ls.removed,false);
  listener.canSendAppContent=content=>content.viewMode==='Headerbar';
  assert.equal(lastResult(h.event(listener,ls,'mw:openSchedule')).ok,false);
  assert.equal(ls.removed,false); assert.equal(listener.sessions.length,1);
});

test('Deaktivierte Wunschbox blockiert das Öffnen serverseitig für Hörer und Moderatoren; Reaktivieren erhält Wünsche',()=>{
  const {h,listener,owner,ls,os}=fixture();
  h.app.chatCommands.vorhang(owner,'öffnen');
  h.event(listener,ls,'mw:wish.submit',{text:'Diesen Wunsch erhalten'});
  assert.equal(lastResult(h.event(listener,ls,'mw:openWishes')).ok,true);
  const existingWish=ls, listenerOverlay=listener.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,os,'mw:setRequests',{enabled:false});
  assert.equal(lastResult(h.event(owner,os,'mw:openStudio')).ok,true);
  const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  const contentCount=h.contents.length;
  for(const [person,session] of [[listener,ls],[owner,os]]){
    const result=lastResult(h.event(person,session,'mw:openWishes',{enabled:true,canModerate:true}));
    assert.equal(result.ok,false);assert.match(result.message,/deaktiviert/);
    assert.equal(h.contents.length,contentCount,'Kein neues Popup erzeugen');
    assert.equal(session.removed,false);
  }
  assert.equal(studio.removed,false,'Gesperrtes Wunschfenster ersetzt das Studio nicht');
  assert.equal(lastResult(h.event(listener,existingWish,'mw:wish.submit',{text:'Nicht annehmen'})).ok,false);
  assert.equal(h.state(owner,os).queueTotal,1);
  const restarted=createHarness(h.store),nextListener=restarted.user(10,'Neuer Hörer'),nextSession=restarted.open(nextListener);
  assert.equal(lastResult(restarted.event(nextListener,nextSession,'mw:openWishes')).ok,false,'Sperre nach Neustart erhalten');
  assert.equal(lastResult(h.event(owner,studio,'mw:setRequests',{enabled:true})).ok,true);
  h.event(listener,ls,'mw:openWishes'); h.finishOverlay(listener,listenerOverlay);
  assert.equal(lastResult(ls.events).ok,true);
  assert.equal(h.state(listener,ls).myTotal,0,'Hörer erhält keine Wunschhistorie');
  assert.equal(h.state(owner,studio).queueTotal,1,'Laufende Moderationsqueue bleibt erhalten');
});
test('Popup und Radioleiste behalten getrennte Seiten bei Statusmeldungen', () => {
  const {h,owner,os}=fixture();
  for(let i=0;i<17;i++){const user=h.user(200+i,'Wunsch'+i);h.event(user,h.open(user),'mw:wish.submit',wish);}
  h.event(owner,os,'mw:openStudio'); const popup=owner.sessions.find(session=>session.content.viewMode==='Overlay');
  assert.equal(h.state(owner,popup,1).page,1); assert.equal(h.state(owner,os,0).page,0);
  h.event(owner,os,'mw:setRequests',{enabled:false});
  assert.equal(popup.events.findLast(event=>event.type==='mw:state').data.page,1);
  assert.equal(os.events.findLast(event=>event.type==='mw:state').data.page,0);
});
test('Ein Textfeld übermittelt den vollständigen Wunsch mit echtem Nick und ohne erfundene Zustellung', () => {
  const {h,listener,owner,ls,os}=fixture();
  const response=lastResult(h.event(listener,ls,'mw:wish.submit',{text:'Bitte Lieblingsband – Unser Song. Grüße an den Channel!',nick:'Fälschung',userId:owner.id,delivery:{nick:'Fake'},submissionId:'single-field'}));
  assert.equal(response.ok,true);assert.match(response.message,/Moderation gesendet/);assert.doesNotMatch(response.message,/angekommen|übergeben/);
  const item=h.state(owner,os).queue[0];
  assert.equal(item.nick,listener.nick);assert.equal(item.text,'Bitte Lieblingsband – Unser Song. Grüße an den Channel!');
  assert.equal(item.delivery,null);assert.equal('request' in response,false);
  assert.equal('userId' in item,false);
});
test('Einzelfeld wird serverseitig validiert und nur in die laufende Queue übernommen', () => {
  const {h,listener,owner,ls,os}=fixture();
  for(const text of ['', '  \n ', {}, 'X'.repeat(301)]){
    assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text})).ok,false);
  }
  assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text:'  Wunsch\nmit   Gruß  '})).ok,true);
  assert.equal(h.state(owner,os).queue[0].text,'Wunsch mit Gruß');
  const restarted=createHarness(h.store),person=restarted.user(2,'Otterchen','owner');
  assert.equal(restarted.state(person,restarted.open(person)).queueTotal,0);
});

test('Musikwünsche lehnen Links im Backend ab und erlauben normale Interpret-/Titel-Namen',()=>{
  const {h,listener,owner,ls,os}=fixture();
  for(const link of ['https://youtu.be/123','youtube.com/watch?v=123','www.youtube.com/watch?v=123','http://example.org/song','example.de','open.spotify.com/track/123','spotify:track:123','https%3A%2F%2Fexample.com','example。com','https://exa\u200bmple.com','[Song](example.org)','//example.net/song','ftp://example.com/song','192.168.0.1/song','x.com/song','EXAMPLE.DE','HTTPS%3A%2F%2FEXAMPLE.COM','ÄRZTE.DE']){
    const result=lastResult(h.event(listener,ls,'mw:wish.submit',{text:'Queen – Song '+link}));
    assert.equal(result.ok,false,link);assert.match(result.message,/Keine Links/);
    assert.equal(h.state(owner,os).queueTotal,0);
  }
  assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{artist:'Band',title:'Song',message:'https://example.com'})).ok,false,'Alter Client darf keine Links einschleusen');
  for(const text of ['a-ha – Take On Me','will.i.am – Scream & Shout','M.I.A. – Paper Planes','t.A.T.u. – All The Things She Said','AC/DC – Thunderstruck','Mr. Big – To Be With You']){
    assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text})).ok,true,text);
  }
  assert.equal(h.state(owner,os).queueTotal,6);
});
test('Zustellung erfordert eine berechtigte Studiositzung und genau den angezeigten Wunsch', () => {
  const {h,listener,owner,ls,os}=fixture();
  h.event(listener,ls,'mw:wish.submit',{text:'Erster Wunsch'});
  const other=h.user(3,'Anderer Hörer');h.event(other,h.open(other),'mw:wish.submit',{text:'Zweiter Wunsch'});
  const id=h.state(owner,os).queue[0].id;
  assert.equal(lastResult(h.event(listener,ls,'mw:ackRequest',{id,nick:'Fake'})).ok,false);
  assert.equal(lastResult(h.event(owner,os,'mw:ackRequest',{id})).ok,false);
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  const second=h.state(owner,studio,1).queue[0];
  assert.equal(lastResult(h.event(owner,studio,'mw:ackRequest',{id})).ok,false);
  assert.equal(h.state(owner,studio,0).queue[0].delivery,null);
  h.state(owner,studio,0);
  h.event(owner,studio,'mw:ackRequest',{id,nick:'Fake',userId:999});
  const received=h.state(owner,studio).queue[0];
  assert.equal(received.delivery.nick,'Otterchen');assert.ok(received.delivery.at);
  assert.equal('userId' in received.delivery,false);
  const revision=h.state(owner,studio).revision;h.event(owner,studio,'mw:ackRequest',{id});
  assert.equal(h.state(owner,studio).revision,revision);
  owner.role='listener';
  assert.equal(lastResult(h.event(owner,studio,'mw:ackRequest',{id:second.id})).ok,false);
  const restarted=createHarness(h.store),person=restarted.user(2,owner.nick,'owner');
  assert.equal(restarted.state(person,restarted.open(person)).queueTotal,0);
});
test('Viele Wünsche bleiben nur in der Moderation paginiert und unter dem Eventlimit', () => {
  const {h,listener,owner,ls,os}=fixture();
  for(let i=0;i<50;i++){
    assert.equal(lastResult(h.event(listener,ls,'mw:wish.submit',{text:String(i).padStart(2,'0')+'ä'.repeat(298),submissionId:'full-own-'+i})).ok,true);
  }
  let state=h.state(listener,ls,0,0);
  assert.equal(state.myTotal,0);assert.equal(state.myPages,1);assert.equal(state.myRequests.length,0);
  assert.ok(JSON.stringify(state).length<10000);
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  const item=h.state(owner,studio,49).queue[0];
  h.event(owner,studio,'mw:ackRequest',{id:item.id});
  state=h.state(listener,ls,0,3);
  assert.equal(state.myPage,0);assert.equal(state.myRequests.length,0);
  assert.equal(state.requestFeedback,null);
  assert.equal(h.state(owner,studio,49).queue[0].delivery.nick,'Otterchen');
  h.event(owner,studio,'mw:setRequests',{enabled:false});
  assert.equal(ls.events.findLast(e=>e.type==='mw:state').data.myPage,0);
  state=h.state(listener,ls,0,500);
  assert.equal(state.myPage,0);assert.ok(JSON.stringify(state).length<10000);
  h.app.onUserDeleted(listener.id);assert.equal(h.state(owner,studio).queueTotal,0);
});



test('Geschlossene native Sitzungen können neue Overlays weder schließen noch mit alten Entwürfen überschreiben',()=>{
 const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');const old=owner.sessions.find(s=>s.content.viewMode==='Overlay');h.event(owner,os,'mw:openRadioTeam');h.finishOverlay(owner,old,{studio:{topic:'Aktuell'}},false,4);const team=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 for(const type of ['mw:overlay.draft','mw:overlay.dismiss','mw:overlay.ready'])h.event(owner,old,type,{state:{studio:{topic:'Veraltet'}},revision:999,token:1});assert.equal(team.removed,false);
 h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,team);const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.notEqual(studio,old);assert.equal(h.state(owner,studio).overlayState.studio.topic,'Aktuell');
 const send=owner.sendAppContent;owner.sendAppContent=()=>{throw Error('Testfehler');};h.event(owner,os,'mw:openSchedule');h.finishOverlay(owner,studio);assert.equal(studio.removed,false);assert.equal(lastResult(os.events).ok,false);owner.sendAppContent=send;
});

test('Rechteverlust leert private Entwürfe auch nach mehreren nativen Overlayöffnungen',()=>{
 const {h,owner,os}=fixture();h.event(owner,os,'mw:openStudio');let current=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 for(const [action,state] of [['mw:openRadioTeam',{studio:{topic:'Privat'}}],['mw:openSchedule',{team:{nick:'Privat'}}],['mw:openWishes',{scheduleEditor:{fields:{'schedule-topic':'Privat'}}}]]){h.event(owner,os,action);h.finishOverlay(owner,current,state);current=owner.sessions.find(s=>s.content.viewMode==='Overlay');}
 owner.role='listener';h.state(owner,current);owner.role='owner';for(const [action,field] of [['mw:openSchedule','scheduleEditor'],['mw:openStudio','studio'],['mw:openRadioTeam','team']]){h.event(owner,os,action);h.finishOverlay(owner,current);current=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.equal(h.state(owner,current).overlayState?.[field],undefined);}
});

test('Eine native Overlayseite nimmt keine Daten eines anderen Bereichs an',()=>{
 const {h,owner,os}=fixture();let factory;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../app/www/js/core/model.js'),'utf8'),{MischWerkUI:{define(name,value){factory=value;}},document:{documentElement:{setAttribute(){}}}});const model=factory({bridge:{pageData:{view:'studio'}},signals:{emit(){}}}),base=h.state(owner,os);model.receive({...base,revision:10,view:'studio'});model.receive({...base,revision:11,view:'team'});assert.equal(model.current().view,'studio');model.receive({...base,revision:9,view:'studio'});assert.equal(model.current().revision,10);assert.equal('setView' in model,false);
});

test('Neue native Sitzung beginnt auch über Moderation mit einer frischen Wunsch-Eingabesequenz',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes');
  let surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,os,'mw:wishes.sync',{surfaceId:surface.content.htmlFile.pageData.wishSurfaceId,text:'Erhaltener Wunsch',sequence:7,disabled:false});
  surface.remove();h.event(owner,os,'mw:openStudio');surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  assert.equal(surface.content.htmlFile.pageData.wishPresentation.sequence,0);
  assert.equal(surface.content.htmlFile.pageData.wishPresentation.text,'Erhaltener Wunsch');
  h.event(owner,os,'mw:openWishes');h.finishOverlay(owner,surface);surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  h.event(owner,surface,'mw:wishes.edit',{text:'Neu bearbeitet',sequence:1});
  const relay=os.events.findLast(e=>e.type==='mw:wishes.input');assert.equal(relay.data.text,'Neu bearbeitet');
  h.event(owner,os,'mw:wishes.sync',{surfaceId:relay.data.surfaceId,text:'Neu bearbeitet',sequence:1,disabled:false});
  assert.equal(surface.events.findLast(e=>e.type==='mw:wishes.presentation').data.state.text,'Neu bearbeitet');
});

test('Alle sechzehn nativen Bereichsübergänge erzeugen eigene Sitzungen und erhalten die Radioleiste',()=>{
 const actions=['mw:openWishes','mw:openStudio','mw:openRadioTeam','mw:openSchedule'];for(const first of actions)for(const target of actions){const {h,owner,os}=fixture();h.event(owner,os,first);const old=owner.sessions.find(s=>s.content.viewMode==='Overlay');h.event(owner,os,target);h.finishOverlay(owner,old);const next=owner.sessions.find(s=>s.content.viewMode==='Overlay');assert.notEqual(next,old);assert.equal(old.removed,true);assert.equal(owner.sessions.length,2);assert.equal(os.removed,false);assert.equal(next.events.some(e=>e.type==='mw:view'),false);h.event(owner,next,'mw:overlay.dismiss',{state:{},revision:1});assert.equal(next.removed,true);}
});

test('Gemeinsames Schließen der Wunschansicht wartet auch serverseitig auf die letzte Eingabeübernahme',()=>{
  const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes');const surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  const id=surface.content.htmlFile.pageData.wishSurfaceId;
  h.event(owner,surface,'mw:wishes.edit',{text:'Letzte Eingabe',sequence:1});
  h.event(owner,surface,'mw:overlay.dismiss',{state:{},revision:1});assert.equal(surface.removed,false);
  h.event(owner,os,'mw:wishes.sync',{surfaceId:id,text:'Letzte Eingabe',sequence:1,disabled:false});
  h.event(owner,surface,'mw:overlay.dismiss',{state:{},revision:2});assert.equal(surface.removed,true);
  h.event(owner,os,'mw:openWishes');const next=owner.sessions.find(s=>s.content.viewMode==='Overlay');
  assert.equal(next.content.htmlFile.pageData.wishPresentation.text,'Letzte Eingabe');assert.equal(h.state(owner,os).queueTotal,0);
});

test('Die Radioleiste schließt ausschließlich ihre aktuelle Wunschoberfläche mit passender Öffnungskennung',()=>{
 const {h,owner,os,listener,ls}=fixture();h.event(owner,os,'mw:openWishes');let surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');const old={view:'wishes',surfaceId:surface.content.htmlFile.pageData.wishSurfaceId,viewRevision:1};h.event(listener,ls,'mw:overlay.close',old);assert.equal(surface.removed,false);h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,surface);let current=owner.sessions.find(s=>s.content.viewMode==='Overlay');h.event(owner,os,'mw:overlay.close',old);assert.equal(current.removed,false);h.event(owner,os,'mw:openWishes');h.finishOverlay(owner,current);surface=owner.sessions.find(s=>s.content.viewMode==='Overlay');h.event(owner,os,'mw:overlay.close',old);assert.equal(surface.removed,false);h.event(owner,os,'mw:overlay.close',{...old,surfaceId:surface.content.htmlFile.pageData.wishSurfaceId});assert.equal(surface.removed,true);assert.equal(os.removed,false);
});

test('Abgewiesene native Wiederöffnung erhält die bestätigte Wunsch-Eingabesequenz',()=>{
 const {h,owner,os}=fixture();h.event(owner,os,'mw:openWishes');const surface=owner.sessions.find(s=>s.content.viewMode==='Overlay'),id=surface.content.htmlFile.pageData.wishSurfaceId;h.event(owner,surface,'mw:wishes.edit',{text:'Bestätigter Entwurf',sequence:7});h.event(owner,os,'mw:wishes.sync',{surfaceId:id,text:'Bestätigter Entwurf',sequence:7,disabled:false});h.event(owner,os,'mw:openStudio');owner.canSendAppContent=()=>false;h.finishOverlay(owner,surface);assert.equal(surface.removed,false);owner.canSendAppContent=()=>true;h.event(owner,surface,'mw:overlay.dismiss',{state:{},revision:2});assert.equal(surface.removed,true,'Fehlgeschlagene Öffnung darf bestätigtes Schließen nicht blockieren');
});


test('Nutzerbereinigung schließt Headerbar und abhängiges Overlay jeweils höchstens einmal',()=>{
 const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
 h.event(owner,radio,'mw:openStudio');const overlay=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 const calls=new Map();for(const session of [radio,overlay]){const remove=session.remove;session.remove=function(){calls.set(this,(calls.get(this)||0)+1);return remove.call(this);};}
 h.app.onUserLeft(owner);
 assert.equal(calls.get(radio),1);assert.equal(calls.get(overlay),1);
 h.app.onUserLeft(owner);assert.equal(calls.get(radio),1);assert.equal(calls.get(overlay),1);
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

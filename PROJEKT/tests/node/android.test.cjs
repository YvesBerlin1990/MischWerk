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

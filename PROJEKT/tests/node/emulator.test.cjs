const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const WebSocket = require('ws');
const { AppRuntime } = require('../../tools/emulator/runtime/app.cjs');
const { TestPersistence } = require('../../tools/emulator/runtime/persistence.cjs');
const { createEmulator } = require('../../tools/emulator/server.cjs');
const { profiles, defaults } = require('../../tools/emulator/config.cjs');
const project = path.resolve(__dirname, '../..');
test('Ladekonfiguration bleibt auch deaktiviert samt Text und Farben im Plattformmodell erhalten', () => {
  const { TestContents } = require('../../tools/emulator/runtime/content.cjs');
  const model = new TestContents({ enums:{AppViewMode:{Overlay:'Overlay'}}, clock:{Date}, emit(){} });
  const content = model.create({getAssetPath:()=>'index.html',getPageData:()=>({view:'wishes'})},'Overlay',560,340);
  const loading = content.getLoadConfiguration();
  loading.setEnabled(false);loading.setText('Lädt...');
  loading.setForegroundColor({asHexString:()=>'#000000'});loading.setBackgroundColor({asHexString:()=>'#FFFFFF'});
  model.open({getNick:()=>'Test'},content);
  assert.deepEqual(model.describe([...model.sessions.keys()][0]).loading,
    {enabled:false,text:'Lädt...',foreground:'#000000',background:'#FFFFFF'});
});
function scratch(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Test-'));
  t.after(() => { assert.ok(path.basename(directory).startsWith('MischWerk-Emulator-Test-')); fs.rmSync(directory, { recursive: true, force: true }); });
  return directory;
}
function setup(t) {
  const events = [], faults = { ...defaults };
  const runtime = new AppRuntime({ appDir: path.join(project, 'app'), dataDir: scratch(t), profiles, faults,
    emit: (kind, data) => events.push({ kind, ...data }) });
  runtime.start(); t.after(() => runtime.shutdown());
  const join = nick => { runtime.join(nick, nick); return [...runtime.contents.sessions.keys()].find(id => runtime.contents.describe(id).nick === nick); };
  const state = (nick, id) => { runtime.event(nick, id, 'mw:refresh', {}); return events.findLast(event => event.kind === 'sessionEvent' && event.sessionId === id && event.eventType === 'mw:state').eventData; };
  return { runtime, events, faults, join, state };
}

test('Plattformbefehl /confirm wird nur protokolliert, ohne erfundenen nativen Idle-Erfolg',t=>{
 const {runtime,events,join,state}=setup(t);assert.throws(()=>runtime.command('Otterchen','/confirm'),/Channelbeitritt/);
 const id=join('Otterchen'),before=state('Otterchen',id),count=events.length;
 runtime.command('Otterchen','/confirm');
 assert.deepEqual(events.slice(count),[{kind:'platformCommand',nick:'Otterchen',command:'/confirm',idleEffect:'not-modelled'}]);
 assert.equal(state('Otterchen',id).revision,before.revision);
 assert.throws(()=>runtime.command('Otterchen','/unbekannt'),/Unbekannter/);
});
test('Plattformrollen bleiben getrennt; Besitzer und echte Teamernennung steuern Apprechte', t => {
  const { runtime, join, state } = setup(t), owner = join('Otterchen');
  assert.equal(state('Otterchen', owner).user.canManageRadioModerators, true);
  for (const nick of ['AppManager', 'Channelmoderator', 'Polaroid', 'DJ-Test']) {
    const id = join(nick); assert.equal(state(nick, id).user.canModerate, false);
  }
  runtime.event('Otterchen', owner, 'mw:addRadioModerator', { nick: 'dj-test', expectedRadioModeratorRevision: 0 });
  const dj = [...runtime.contents.sessions.keys()].find(id => runtime.contents.describe(id).nick === 'DJ-Test');
  assert.equal(state('DJ-Test', dj).user.canModerate, true);
  assert.equal(state('DJ-Test', dj).user.canManageRadioModerators, false);
});
test('Fremde Sitzungen, geschlossene Sitzungen und übergroße Nutzdaten werden verworfen', t => {
  const { runtime, join } = setup(t), owner = join('Otterchen'), other = join('Polaroid');
  assert.throws(() => runtime.close('Otterchen', other), /gehört nicht/);
  assert.throws(() => runtime.event('Otterchen', other, 'mw:refresh', {}), /Fremde/);
  assert.throws(() => runtime.event('Otterchen', owner, 'mw:refresh', { text: 'x'.repeat(10000) }), /10000/);
  runtime.close('Polaroid', other); assert.equal(runtime.contents.sessions.has(owner), true);
  assert.throws(() => runtime.event('Polaroid', other, 'mw:refresh', {}), /Fremde/);
});
test('Doppelte Beitritte verändern den angemeldeten Nutzer nicht; Verlassen entfernt echte Anwesenheit', t => {
  const { runtime, join } = setup(t); const id = join('Otterchen');
  assert.throws(() => runtime.join('Otterchen', 'other'), /bereits verbunden/);
  assert.equal(runtime.contents.sessions.has(id), true);
  runtime.leave('Otterchen');
  assert.equal(runtime.users.online().length, 0); assert.equal(runtime.contents.sessions.size, 0);
  assert.equal(runtime.context.KnuddelsServer.getChannel().getOnlineUsers().length, 0);
});
test('100 Wünsche, wiederholte IDs und mehrere Hörer: Queue vollständig und privat', t => {
  const { runtime, join, state, events } = setup(t), owner = join('Otterchen'), listener = join('Polaroid');
  for (let index = 0; index < 100; index++) {
    runtime.event('Polaroid', listener, 'mw:wish.submit', { submissionId: 'stress-' + index, text: 'Interpret – Titel ' + index });
  }
  runtime.event('Polaroid', listener, 'mw:wish.submit', { submissionId: 'stress-99', text: 'Interpret – Titel 99' });
  assert.equal(state('Otterchen', owner).queueTotal, 100);
  const own = state('Polaroid', listener);
  assert.equal(own.wishPositions.total, 100); assert.equal(own.wishPositions.items.length, 1);
  assert.equal(own.queue.length, 0);
  assert.equal(events.filter(event => event.eventType === 'mw:wish.receipt' && event.eventData.accepted).length, 101);
});
test('Speicherfehler bestätigen keine Änderung; die flüchtige Wunschqueue bleibt benutzbar', t => {
  const { runtime, join, state, faults } = setup(t), owner = join('Otterchen');
  faults.failPersistence = true;
  runtime.event('Otterchen', owner, 'mw:setTopic', { topic: 'Nicht speichern' });
  assert.equal(state('Otterchen', owner).topic, '');
  assert.equal(runtime.persistence.api().getObject('mischwerk.state.v1', null), null);
  runtime.event('Otterchen', owner, 'mw:wish.submit', { submissionId: 'memory-test', text: 'Interpret – Titel' });
  assert.equal(state('Otterchen', owner).queueTotal, 1);
  faults.failPersistence = false;
  runtime.event('Otterchen', owner, 'mw:setTopic', { topic: 'Jetzt gespeichert' });
  assert.equal(state('Otterchen', owner).topic, 'Jetzt gespeichert');
});
test('Sieben Stunden Zeitsprung beenden eine echte Studio-Anmeldung', t => {
  const { runtime, join, state } = setup(t), owner = join('Otterchen');
  runtime.event('Otterchen', owner, 'mw:onAir', {});
  assert.equal(state('Otterchen', owner).user.isOnAir, true);
  runtime.clock.advance(7 * 3600000);
  assert.equal(state('Otterchen', owner).moderator, null);
  assert.equal(state('Otterchen', owner).user.isOnAir, false);
});
test('Radioende schließt alle zugehörigen Channel-Overlays', t => {
  const { runtime, join } = setup(t), owner = join('Otterchen');
  runtime.event('Otterchen', owner, 'mw:openWishes', {});
  runtime.event('Otterchen', owner, 'mw:openStudio', {});
  assert.equal(runtime.contents.sessions.size, 2,'Wechsel wartet auf bestätigte Übernahme');
  runtime.close('Otterchen', owner);
  const remaining = [...runtime.contents.sessions.keys()].map(id => runtime.contents.describe(id));
  assert.deepEqual(remaining, []);
});
test('Unbekannte Plattform-API und Loader außerhalb der App fallen sichtbar durch', t => {
  const { runtime } = setup(t);
  assert.throws(() => runtime.context.KnuddelsServer.madeUpMethod, /Nicht modellierte/);
  assert.equal(runtime.errors.at(-1).phase, 'API-Abdeckung');
  assert.throws(() => runtime.execute('../package.json'), /außerhalb/);
  assert.throws(() => runtime.context.AppContent.headerbarContent(new runtime.context.HTMLFile('index.html'), 501), /20 bis 500/);
});
test('AppContent entspricht dokumentierten Größen, Defaults und Close-Listener-Argumenten', t => {
  const { runtime, join } = setup(t); join('Otterchen');
  const html = new runtime.context.HTMLFile('index.html');
  const popup = runtime.context.AppContent.popupContent(html), overlay = runtime.context.AppContent.overlayContent(html);
  assert.deepEqual([popup.getWidth(), popup.getHeight(), overlay.getWidth(), overlay.getHeight()], [300, 400, 200, 350]);
  assert.equal(popup.isResponsive(), false); assert.equal(popup.isAllowJFXBrowser(), true);
  assert.throws(() => runtime.context.AppContent.popupContent(html, 49, 400), /50 bis 1000/);
  assert.throws(() => runtime.context.AppContent.overlayContent(html, 1001, 300), /20 bis 1000/);
  let argumentsSeen;
  popup.addCloseListener((...args) => { argumentsSeen = args; });
  const user = runtime.users.find('Otterchen').user, session = user.sendAppContent(popup);
  session.remove();
  assert.equal(argumentsSeen[0], user); assert.equal(argumentsSeen[1], popup); assert.equal(argumentsSeen[2], false);
});
test('sendAppContent ersetzt nur den eigenen ViewMode und meldet replacing statt einer eigenen remove-Aktion', t => {
  const {runtime,join}=setup(t);join('Otterchen');join('Testhoerer');
  const user=runtime.users.find('Otterchen').user, other=runtime.users.find('Testhoerer').user;
  const html=new runtime.context.HTMLFile('index.html');
  const old=runtime.context.AppContent.overlayContent(html), next=runtime.context.AppContent.overlayContent(html);
  const session=user.sendAppContent(old), foreign=other.sendAppContent(old);
  let removeCalls=0, closed, duringReplacement;
  session.remove=()=>{removeCalls++;};
  old.addCloseListener((...args)=>{closed=args;duringReplacement=user.canSendAppContent(next);});
  const result=user.sendAppContent(next);
  assert.equal(result.getAppContent(),next);assert.equal(result.getUser(),user);
  assert.equal(removeCalls,0,'Ersetzen ist eine Plattformaktion, kein AppContentSession.remove-Aufruf');
  assert.deepEqual(closed,[user,old,true]);
  assert.equal(duringReplacement,false,'Kein weiterer Versand aus einem nativen Ersetzungslistener');
  assert.equal(user.canSendAppContent(next),true,'Nach dem Versand wieder verfügbar');
  assert.deepEqual(old.getSessions(),[foreign]);
  assert.equal(user.getAppContentSessions().length,2,'Headerbar und Overlay bleiben getrennt');
  assert.equal(user.getAppContentSession(runtime.enums.AppViewMode.Overlay),result);
  result.remove();assert.deepEqual(next.getSessions(),[]);
});

test('Persistenzwerte werden kopiert und fehlgeschlagene Schreibvorgänge sind atomar', t => {
  let fail = false;
  const store = new TestPersistence(scratch(t), () => fail), api = store.api(), object = { list: [1] };
  api.setObject('example', object); object.list.push(2);
  assert.deepEqual(api.getObject('example'), { list: [1] });
  fail = true; assert.throws(() => api.setObject('example', { list: [3] }), /Speicherfehler/);
  assert.deepEqual(api.getObject('example'), { list: [1] });
});
test('Nutzerlöschung bereinigt echte Team- und Wunschdaten', t => {
  const { runtime, join, state } = setup(t), owner = join('Otterchen'), dj = join('DJ-Test');
  runtime.event('Otterchen', owner, 'mw:addRadioModerator', { nick: 'DJ-Test' });
  runtime.event('DJ-Test', dj, 'mw:wish.submit', { submissionId: 'delete-me', text: 'Interpret – Titel' });
  assert.equal(state('Otterchen', owner).queueTotal, 1);
  runtime.deleteUser('DJ-Test');
  assert.equal(state('Otterchen', owner).queueTotal, 0);
  assert.equal(state('Otterchen', owner).radioModeratorTotal, 0);
  assert.equal(runtime.users.find('DJ-Test'), undefined);
});
test('Quellstand bleibt eingefroren und meldet geänderte sowie hinzugefügte Dateien', t => {
  const { SourceSnapshot } = require('../../tools/emulator/runtime/source.cjs');
  const directory = scratch(t);
  fs.writeFileSync(path.join(directory, 'app.config'), 'appVersion = 1\n');
  fs.writeFileSync(path.join(directory, 'main.js'), 'var App = {};');
  const snapshot = new SourceSnapshot(directory);
  fs.writeFileSync(path.join(directory, 'main.js'), 'var App = {changed:true};');
  fs.writeFileSync(path.join(directory, 'new.js'), 'var added = true;');
  assert.equal(snapshot.read('main.js').toString(), 'var App = {};');
  assert.deepEqual(snapshot.changes().sort(), ['main.js', 'new.js']);
  assert.equal(snapshot.hash.length, 64);
});
test('Endlosschleifen in App-Hooks werden beendet und als Appfehler erfasst', t => {
  const directory = scratch(t);
  fs.writeFileSync(path.join(directory, 'main.js'), 'var App = {onUserJoined:function(){while(true){}}};');
  const runtime = new AppRuntime({ appDir: directory, dataDir: path.join(directory, 'data'), profiles, faults: { ...defaults } });
  runtime.start(); t.after(() => runtime.shutdown());
  assert.throws(() => runtime.join('Otterchen', 'loop'), /timed out/);
  assert.ok(runtime.errors.some(error => /timed out/.test(error.message)));
});
async function server(t) {
  const instance = await createEmulator({ port: 0, dataDir: scratch(t) });
  t.after(() => instance.close()); return instance;
}
async function peer(t, instance) {
  const socket = new WebSocket(instance.origin.replace('http:', 'ws:') + '/control?token=' + instance.hub.controlToken,
    { origin: instance.origin });
  const messages = [];
  socket.on('message', raw => messages.push(JSON.parse(raw)));
  socket.on('error', () => {});
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  t.after(() => socket.terminate());
  const wait = async predicate => {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const found = messages.find(predicate); if (found) return found;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Nachricht blieb aus: ' + JSON.stringify(messages.slice(-3)));
  };
  await wait(message => message.type === 'hello');
  return { socket, messages, wait, send: value => socket.send(JSON.stringify(value)) };
}
test('WebSocket null, Arrays, falsche Typen und kaputtes JSON lassen den Server am Leben', async t => {
  const instance = await server(t), client = await peer(t, instance);
  for (const raw of ['null', '[]', '{"type":5}', '{']) client.socket.send(raw);
  await client.wait(message => message.type === 'error');
  client.send({ type: 'join', nick: 'Otterchen' });
  await client.wait(message => message.type === 'contentShow');
  assert.equal(instance.hub.runtime.users.find('Otterchen').state.online, true);
});
test('WebSocket-Nick und Sitzung können nicht durch Rollenfelder oder fremde IDs ersetzt werden', async t => {
  const instance = await server(t), first = await peer(t, instance), second = await peer(t, instance);
  first.send({ type: 'join', nick: 'Otterchen' }); const owner = await first.wait(message => message.type === 'contentShow');
  second.send({ type: 'join', nick: 'AppManager', roles: { isChannelOwner: true } });
  const manager = await second.wait(message => message.type === 'contentShow');
  assert.equal(manager.pageData.user.canManageRadioModerators, false);
  second.send({ type: 'close', sessionId: owner.sessionId });
  await second.wait(message => message.type === 'error');
  assert.ok(instance.hub.runtime.contents.sessions.has(owner.sessionId));
  const hello = await second.wait(message => message.type === 'hello');
  const denied = await fetch(instance.origin + '/frame/' + owner.sessionId + '?connection=' + hello.connectionId);
  assert.equal(denied.status, 404);
});
test('Doppeltes Senden und verlorene Quittung behalten dieselbe Wunsch-ID', async t => {
  const instance = await server(t), client = await peer(t, instance);
  client.send({ type: 'join', nick: 'Otterchen' }); const view = await client.wait(message => message.type === 'contentShow');
  client.send({ type: 'faults', value: { duplicateNext: true, dropServer: 1, dropServerType: 'mw:wish.receipt' } });
  client.send({ type: 'event', sessionId: view.sessionId, eventType: 'mw:wish.submit',
    eventData: { text: 'Interpret – Titel', submissionId: 'dup-test' } });
  await client.wait(message => message.type === 'sessionEvent' && message.eventType === 'mw:wish.receipt');
  assert.equal(instance.hub.trace.filter(item => item.kind === 'droppedServer').length, 1);
  assert.equal(instance.hub.trace.filter(item => item.kind === 'sessionEvent' && item.eventType === 'mw:state').at(-1).eventData.queueTotal, 1);
});
test('Neustart erhält Thema und Testrollen, leert Queue und verwirft verspätete alte Pakete', async t => {
  const instance = await server(t), client = await peer(t, instance);
  client.send({ type: 'join', nick: 'Otterchen' }); const first = await client.wait(message => message.type === 'contentShow');
  client.send({ type: 'event', sessionId: first.sessionId, eventType: 'mw:setTopic', eventData: { topic: 'Bleibt gespeichert' } });
  await client.wait(message => message.type === 'sessionEvent' && message.eventType === 'mw:state' && message.eventData.topic === 'Bleibt gespeichert');
  client.send({ type: 'faults', value: { clientDelayMs: 100 } });
  client.send({ type: 'event', sessionId: first.sessionId, eventType: 'mw:wish.submit', eventData: { text: 'Alt', submissionId: 'old' } });
  client.send({ type: 'restart' });
  const next = await client.wait(message => message.type === 'contentShow' && message.sessionId !== first.sessionId);
  assert.equal(next.pageData.topic, 'Bleibt gespeichert'); assert.equal(next.pageData.queueTotal, 0);
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(instance.hub.runtime.contents.sessions.has(first.sessionId), false);
  assert.equal(instance.hub.deliveryTimers.size, 0);
});
test('HTTP-Diagnose schützt Steuerbericht und Dateifreigaben, Ressourcenfehler sind gezielt', async t => {
  const instance = await server(t);
  assert.equal((await fetch(instance.origin + '/api/report')).status, 403);
  assert.equal((await fetch(instance.origin + '/app/%2e%2e%2fapp.config')).status, 400);
  assert.equal((await fetch(instance.origin + '/app/index.html', { method: 'POST' })).status, 405);
  const hostileHostStatus = await new Promise((resolve, reject) => {
    require('node:http').get(instance.origin, { headers: { host: 'evil.example' } }, response => {
      response.resume(); resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(hostileHostStatus, 403);
  instance.hub.faults.resourceFailure = 'js/start.js';
  assert.equal((await fetch(instance.origin + '/app/js/start.js')).status, 503);
  assert.equal((await fetch(instance.origin + '/app/css/shared/foundation.css')).status, 200);
  const report = await (await fetch(instance.origin + '/api/report', { headers: { 'x-emulator-token': instance.hub.controlToken } })).json();
  assert.equal(report.schemaVersion, 1); assert.ok(report.limits.length);
});
test('Echte Audioassets unterstützen Range und HEAD ohne den Rest der Datei auszuliefern', async t => {
  const instance = await server(t), url = instance.origin + '/app/img/mischwerk-logo.png';
  const response = await fetch(url, { headers: { range: 'bytes=0-15' } });
  assert.equal(response.status, 206); assert.equal((await response.arrayBuffer()).byteLength, 16);
  assert.match(response.headers.get('content-range'), /^bytes 0-15\//);
  assert.equal((await fetch(url, { headers: { range: 'bytes=900000000-' } })).status, 416);
  assert.equal((await fetch(url, { method: 'HEAD' })).status, 200);
});

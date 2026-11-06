// Ausschließlich lokale Plattform- und HTTPS-Port-Fakes; keine externen Requests.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const privateKey = 'mischwerk.android.private.v1';
const journalKey = 'mischwerk.android.receipts.v1';
const settings = () => ({ enabled: true, relaySecret: 'r'.repeat(64), syncSecret: 's'.repeat(64),
  syncUrl: 'https://europe-west3-radio-mischwerk.cloudfunctions.net/publishKnuddelsState' });
function setup(options = {}) {
  const hooks = new Map(), sends = [], pending = [], removed = [];
  const store = options.store || persistence({ [privateKey]: settings() });
  let h;
  const wire = { sendJson(request, finish) {
    sends.push(JSON.parse(JSON.stringify(request)));
    if (options.throwSend) throw Error('private HTTP details');
    if (options.hang) pending.push(finish);
    else finish({ status: options.status || 200, body: options.response || { accepted: true, serverTime: h ? h.now() : Date.now() } });
  } };
  h = createHarness(store, { serverMethods: { getWebHookAccess: () => ({
    registerWebHook(key, handle) { hooks.set(key, handle); return 'https://hooks.example.invalid/private/' + key; },
    unregisterWebHook(key) { removed.push(key); hooks.delete(key); }
  }), ...options.serverMethods }, configureModules(context) {
    const create = context.MischWerkModules.createApp;
    context.MischWerkModules.createApp = config => create(config, options.noWire ? undefined : wire);
  } });
  const owner = h.user(1, 'Otterchen', 'owner'), listener = h.user(2, 'Privater Nick');
  const radio = h.open(owner), listenerRadio = h.open(listener);
  function call(data = {}, override = {}) {
    const handle = hooks.get('android-wishes');
    assert.equal(typeof handle, 'function', 'Android-WebHook muss lokal registriert sein');
    let result;
    handle({ getMethod: () => override.method || 'POST', getPath: () => override.path || '/v1/wishes',
      getQueryString: () => override.query || '', getRemoteAddress: () => '127.0.0.1',
      getHeaders: () => override.headers || { Authorization: ['Bearer ' + settings().relaySecret], 'Content-Type': ['application/json'] },
      getBody: () => override.raw === undefined ? JSON.stringify({ action: 'submitWish', submissionId: 'android-one', text: 'Band – Song', displayName: null, ...data }) : override.raw
    }, { send(status, headers, body) { assert.equal(result, undefined, 'Genau eine Antwort'); result = { status, headers, body: JSON.parse(body) }; } });
    return result;
  }
  return { h, store, owner, listener, radio, listenerRadio, call, hooks, sends, pending, removed, options };
}
const hostingUrl = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
test('Neu erzeugte native Adapter teilen den belegten Port bis zur tatsächlichen Antwort',()=>{
 let runtime;const calls=[];const external={canAccessURL:()=>true,postURL:(url,p)=>calls.push({url,p})};
 createHarness(undefined,{serverMethods:{getExternalServerAccess:()=>external},configureModules(c){const attach=c.MischWerkModules.attachAndroidConnection;c.MischWerkModules.attachAndroidConnection=r=>{attach(r);runtime=r;};}});
 const config={runtimeVerified:true,syncUrl:hostingUrl,syncSecret:'s'.repeat(64)},a=runtime.createAndroidWire(config),b=runtime.createAndroidWire(config);
 const req={url:hostingUrl,authorization:'Bearer '+config.syncSecret,body:{station:{wishboxOpen:false},wishUpdates:[]}};
 const cancel=a.sendJson(req,()=>assert.fail('Logisch abgebrochene Antwort ignorieren'));cancel();
 assert.throws(()=>b.sendJson(req,()=>{}));assert.equal(calls.length,1);
 calls[0].p.onSuccess('{}',{getResponseCode:()=>200,getURLString:()=>hostingUrl});
 b.sendJson(req,()=>{});assert.equal(calls.length,2);
});
function setupNative(options = {}) {
  const calls = [], accessChecks = []; let fixture;
  const external = { canAccessURL(url) { accessChecks.push(url); return options.allowed !== false; },
    postURL(url, parameters) {
      const call = { url, parameters }; calls.push(call);
      if (options.throwPost) throw Error('private network details');
      if (options.hang) return;
      const callback = options.failureCallback ? parameters.onFailure : parameters.onSuccess;
      callback(options.raw === undefined ? JSON.stringify({ accepted: true, serverTime: fixture ? fixture.h.now() : Date.now() }) : options.raw,
        { getResponseCode: () => options.responseCode || 200, getURLString: () => options.finalUrl || url });
    }
  };
  const config = { ...settings(), syncUrl: hostingUrl, runtimeVerified: true, ...options.config };
  fixture = setup({ noWire: true, store: persistence({ [privateKey]: config }), serverMethods: {
    getExternalServerAccess: () => external, ...options.serverMethods
  } });
  return { ...fixture, nativeCalls: calls, accessChecks, nativeOptions: options };
}
test('Nativer postURL-Adapter verwendet Hosting, String-payload und header im Singular', () => {
  const f = setupNative();
  assert.equal(f.nativeCalls.length, 1);
  const first = f.nativeCalls[0];
  assert.equal(first.url, hostingUrl);
  assert.deepEqual(Object.keys(first.parameters.data), ['payload']);
  assert.equal(typeof first.parameters.data.payload, 'string');
  assert.equal(first.parameters.header.Authorization, 'Bearer ' + settings().syncSecret);
  assert.equal('headers' in first.parameters, false); assert.equal('body' in first.parameters, false);
  assert.deepEqual(JSON.parse(first.parameters.data.payload).wishUpdates, []);
  assert.equal(f.call().body.accepted, true);
  assert.equal(JSON.parse(f.nativeCalls.at(-1).parameters.data.payload).wishUpdates[0].state, 'queued');
});
test('Nativer Start benötigt ausdrücklichen Laufzeitnachweis, passende APIs und Domainfreigabe', () => {
  for (const options of [{ config: { runtimeVerified: false } }, { config: { runtimeVerified: 'true' } },
    { allowed: false }, { serverMethods: { getExternalServerAccess: undefined } }]) {
    const f = setupNative(options); assert.equal(f.hooks.size, 0); assert.equal(f.nativeCalls.length, 0);
  }
});
test('Hosting-Konfiguration akzeptiert ausschließlich den vereinbarten HTTPS-Zielpfad', () => {
  for (const syncUrl of ['https://radio-mischwerk.web.app.evil.invalid/api/publishKnuddelsState',
    'https://radio-mischwerk.web.app/api/other', hostingUrl + '?token=bad', hostingUrl + '#fragment',
    'http://radio-mischwerk.web.app/api/publishKnuddelsState']) {
    const f = setupNative({ config: { syncUrl } }); assert.equal(f.nativeCalls.length, 0); assert.equal(f.hooks.size, 0);
  }
});
test('Native HTTP-/JSON-/Weiterleitungsfehler werden nie zu einer offenen Verbindung', () => {
  for (const options of [{ responseCode: 401 }, { responseCode: 409 }, { raw: '<html>failure</html>' },
    { raw: 'x'.repeat(4097) }, { finalUrl: 'https://unrelated.invalid' }, { throwPost: true },
    { failureCallback: true }]) {
    const f = setupNative(options); assert.equal(f.call().body.relayCode, 'CLOSED');
    assert.doesNotMatch(JSON.stringify(f.h.logs), /private network details|rrrrrrrr|ssssssss/);
  }
});
test('Native Domainfreigabe wird vor jedem Versand erneut geprüft', () => {
  const f = setupNative(); f.nativeOptions.allowed = false;
  f.h.advance(20000); assert.equal(f.nativeCalls.length, 1);
  assert.equal(f.call().body.relayCode, 'CLOSED');
  assert.ok(f.accessChecks.length >= 2);
});
test('Nicht abbrechbarer nativer Aufruf startet nach logischem Timeout keinen parallelen Request', () => {
  const f = setupNative(); f.nativeOptions.hang = true; f.call();
  assert.equal(f.nativeCalls.length, 2);
  f.h.advance(20000); assert.equal(f.nativeCalls.length, 2);
  const old = f.nativeCalls[1];
  f.nativeOptions.hang = false;
  old.parameters.onSuccess(JSON.stringify({ accepted: true, serverTime: f.h.now() }), {
    getResponseCode: () => 200, getURLString: () => hostingUrl
  });
  assert.equal(f.call({ submissionId: 'too-early' }).body.relayCode, 'CLOSED');
  f.h.advance(20000); assert.equal(f.nativeCalls.length, 3);
  assert.equal(f.call({ submissionId: 'recovered' }).body.accepted, true);
});
test('Ohne verifizierten JSON-Transport bleibt Android auch mit Konfiguration ausgeschaltet', () => {
  const f = setup({ noWire: true });
  assert.equal(f.hooks.size, 0); assert.equal(f.sends.length, 0); assert.equal(f.h.timers.size, 0);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Channel bleibt nutzbar' });
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 1);
});
test('Drei echte Wünsche plus Android ergeben Platz 4 und einen erkennbaren externen Absender', () => {
  const f = setup();
  for (let i = 0; i < 3; i++) f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Channel ' + i });
  assert.deepEqual(f.call().body, { accepted: true, position: 4 });
  const row = f.h.state(f.owner, f.radio, 3).queue[0];
  assert.equal(row.nick, 'Android'); assert.equal(row.text, 'Band – Song');
  assert.equal(f.h.state(f.listener, f.listenerRadio).wishPositions.total, 3);
  assert.equal(f.sends.at(-1).body.wishUpdates[0].submissionId, 'android-one');
  assert.equal(f.sends.at(-1).body.wishUpdates[0].position, 4);
});
test('Wiederholungen sind vor und nach Erledigung idempotent; native ID kollidiert nicht', () => {
  const f = setup();
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Anderer Ursprung', submissionId: 'android-one' });
  assert.equal(f.call().body.position, 2); assert.equal(f.call().body.position, 2);
  assert.equal(f.call({ text: 'Anderer Inhalt' }).status, 400);
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 2, outcome: 'done' });
  assert.deepEqual(f.call().body, { accepted: true, position: null });
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 1);
});
test('Geschlossen und Shutdown sperren neue Wünsche; bestätigte Wiederholung bleibt sicher', () => {
  const f = setup(); f.call();
  f.h.event(f.owner, f.radio, 'mw:setRequests', { enabled: false });
  assert.deepEqual(f.call({ submissionId: 'new' }).body, { accepted: false, relayCode: 'CLOSED' });
  assert.equal(f.call().body.accepted, true);
  f.h.app.onPrepareShutdown();
  assert.equal(f.hooks.has('android-wishes'), false); assert.equal(f.h.timers.size, 0);
});
test('Strenge Authentisierung, Methode, Pfad, JSON-Schema und Bodygrenze', () => {
  const f = setup();
  assert.equal(f.call({}, { headers: {} }).status, 401);
  assert.equal(f.call({}, { headers: { authorization: ['Bearer wrong'], 'Content-Type': ['application/json'] } }).status, 401);
  assert.equal(f.call({}, { headers: { Authorization: ['Bearer ' + settings().relaySecret, 'Bearer wrong'] } }).status, 401);
  assert.equal(f.call({}, { method: 'GET' }).status, 405);
  assert.equal(f.call({}, { path: '/status' }).status, 404);
  assert.equal(f.call({}, { query: 'secret=ignored' }).status, 400);
  assert.equal(f.call({}, { raw: '{broken' }).status, 400);
  assert.equal(f.call({}, { raw: 'x'.repeat(4097) }).status, 413);
  assert.equal(f.call({ uid: 'forged' }).status, 400);
  assert.equal(f.call({ action: 'getStatus' }).status, 400);
  assert.equal(f.call({ displayName: { nick: 'forged' } }).status, 400);
  assert.equal(f.call({ submissionId: '__proto__' }).body.accepted, true);
});
test('Ungültige IDs, leere/zu lange Texte und Links werden wie bei Knuddels abgewiesen', () => {
  const f = setup();
  for (const submissionId of ['', 'x'.repeat(81), 'bad/id', 2]) assert.equal(f.call({ submissionId }).status, 400);
  for (const text of ['', 'x'.repeat(301), 'https://example.invalid', 'www.example.invalid', 'example.com', null]) {
    assert.equal(f.call({ text }).status, 400);
  }
  assert.equal(f.call({ text: ' \u0000  M.I.A.   – Song \n ' }).body.accepted, true);
  assert.equal(f.h.state(f.owner, f.radio).queue[0].text, 'M.I.A. – Song');
});
test('Nur angenommene Android-IDs und technische Statusfelder werden übertragen/gespeichert', () => {
  const f = setup(); f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Geheimer Channelwunsch' });
  f.call({ text: 'Privater Androidsong', displayName: 'Privater Androidname' });
  const serialized = JSON.stringify(f.sends);
  assert.doesNotMatch(serialized, /Geheimer Channelwunsch|Privater Nick|Privater Androidsong|Privater Androidname|senderKey|userId/);
  assert.doesNotMatch(JSON.stringify(f.store.data[journalKey]), /Privater Androidsong|Privater Androidname|Geheimer Channelwunsch/);
  for (const send of f.sends) for (const row of send.body.wishUpdates) {
    assert.deepEqual(Object.keys(row).sort(), ['position', 'state', 'submissionId']);
  }
});
test('Status folgt Empfang, Vorbereitung, Wiedergabe, Erledigt und echtem Vorrücken', () => {
  const f = setup();
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Vorher' }); f.call();
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 1, outcome: 'done' });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].position, 1);
  f.h.event(f.owner, f.radio, 'mw:openStudio');
  const studio = f.owner.sessions.find(s => s.content.viewMode === 'Overlay');
  f.h.event(f.owner, studio, 'mw:ackRequest', { id: 2 });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'received');
  f.h.event(f.owner, studio, 'mw:setWishStage', { id: 2, stage: 'preparing', previousStage: 'queued' });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'preparing');
  f.h.event(f.owner, studio, 'mw:setWishStage', { id: 2, stage: 'playing', previousStage: 'preparing' });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'playing');
  f.h.event(f.owner, studio, 'mw:resolveRequest', { id: 2, outcome: 'done' });
  assert.deepEqual(f.sends.at(-1).body.wishUpdates, [{ submissionId: 'android-one', state: 'done', position: null }]);
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 0);
});
test('Verwerfen und Nutzerlöschung übertragen korrekte Endzustände/Positionen', () => {
  const f = setup();
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Vorher' }); f.call();
  f.h.app.onUserDeleted(f.listener.id);
  assert.equal(f.sends.at(-1).body.wishUpdates[0].position, 1);
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 2, outcome: 'discarded' });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'discarded');
});
test('Station projiziert echten Schalter/Studiozustand und Heartbeat spätestens nach 20 Sekunden', () => {
  const f = setup(), first = f.sends.length;
  f.h.advance(19999); assert.equal(f.sends.length, first);
  f.h.advance(1); assert.equal(f.sends.length, first + 1);
  assert.equal(f.sends.at(-1).authorization, 'Bearer ' + settings().syncSecret);
  assert.equal(f.sends.at(-1).url, settings().syncUrl);
  assert.deepEqual(f.sends.at(-1).body.station, { wishboxOpen: true, onAir: false, moderatorNick: null, topic: null, updatedAt: f.h.now() });
  f.h.event(f.owner, f.radio, 'mw:onAir'); f.h.event(f.owner, f.radio, 'mw:setTopic', { topic: 'Sendung' });
  assert.equal(f.sends.at(-1).body.station.onAir, true);
  assert.equal(f.sends.at(-1).body.station.moderatorNick, 'Otterchen');
  assert.equal(f.sends.at(-1).body.station.topic, 'Sendung');
  f.owner.online = false; f.h.advance(20000);
  assert.equal(f.sends.at(-1).body.station.onAir, false);
  assert.equal(f.sends.at(-1).body.station.moderatorNick, null);
});
test('Fehlende/kaputte Konfiguration und fehlerhafte Statusantwort sperren Android', () => {
  for (const value of [undefined, {}, { ...settings(), syncUrl: 'http://127.0.0.1' }, { ...settings(), relaySecret: 'short' }]) {
    const f = setup({ store: persistence({ [privateKey]: value }) }); assert.equal(f.hooks.size, 0); assert.equal(f.sends.length, 0);
  }
  const f = setup({ status: 401 }); assert.equal(f.call().body.relayCode, 'CLOSED');
});
test('Hängender Relay-Aufruf läuft ab; alte Antworten nach Shutdown werden ignoriert', () => {
  const f = setup({ hang: true }); assert.equal(f.call().body.relayCode, 'CLOSED');
  f.h.advance(20000); assert.ok(f.pending.length >= 2);
  f.h.app.onPrepareShutdown(); const sent = f.sends.length;
  for (const done of f.pending) done({ status: 200, body: { accepted: true, serverTime: f.h.now() } });
  f.h.advance(20000); assert.equal(f.sends.length, sent); assert.equal(f.h.timers.size, 0);
});
test('Drosselung betrifft neue Androidwünsche und lässt Wiederholungen/Channelwünsche zu', () => {
  const f = setup();
  for (let i = 0; i < 30; i++) assert.equal(f.call({ submissionId: 'rate-' + i }).body.accepted, true);
  const limited = f.call({ submissionId: 'rate-extra' });
  assert.equal(limited.status, 429); assert.equal(limited.body.relayCode, 'RATE_LIMITED');
  assert.ok(limited.body.retryAfterSeconds > 0);
  assert.equal(f.call({ submissionId: 'rate-0' }).body.accepted, true);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Weiterhin frei' });
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 31);
  f.h.advance(60000); assert.equal(f.call({ submissionId: 'rate-extra' }).body.accepted, true);
});
test('Speicherfehler vor Annahme erzeugt weder Queueeintrag noch erfolgreiche Quittung', () => {
  const f = setup(), save = f.store.setObject;
  f.store.setObject = () => { throw Error('Secret darf nicht ins Log'); };
  assert.equal(f.call().body.accepted, false); assert.equal(f.h.state(f.owner, f.radio).queueTotal, 0);
  f.store.setObject = save;
  assert.doesNotMatch(JSON.stringify(f.h.logs), /Secret darf nicht ins Log|rrrrrrrr|ssssssss|hooks.example/);
});
test('Neustart leert die Queue, markiert offene Android-IDs verworfen und reiht Wiederholungen nicht neu ein', () => {
  const f = setup(); f.call(); f.h.app.onPrepareShutdown();
  const reboot = setup({ store: f.store });
  assert.equal(reboot.h.state(reboot.owner, reboot.radio).queueTotal, 0);
  assert.equal(reboot.sends[0].body.wishUpdates[0].state, 'discarded');
  assert.deepEqual(reboot.call().body, { accepted: true, position: null });
});
test('Terminale Marker laufen nach sieben Tagen ab; unbekannte Daten werden nicht als offen publiziert', () => {
  const old = Date.now() - 8 * 86400000;
  const f = setup({ store: persistence({ [privateKey]: settings(), [journalKey]: { version: 1, entries: [
    { submissionId: 'expired', state: 'done', createdAt: old, at: old, committed: true, revision: 1, dirty: true, position: null }
  ] } }) });
  assert.equal(f.sends[0].body.wishUpdates.length, 0);
  assert.equal(f.store.data[journalKey].entries.length, 0);
  const bad = setup({ store: persistence({ [privateKey]: settings(), [journalKey]: { version: 99 } }) });
  assert.equal(bad.hooks.size, 0); assert.equal(bad.sends.length, 0);
});
test('Ungültige Antworten, veraltete Serverzeit und Transportausnahme erlauben keine Annahme', () => {
  for (const options of [{ throwSend: true }, { response: { accepted: false, serverTime: Date.now() } },
    { response: { accepted: true, serverTime: 'now' } }, { response: { accepted: true, serverTime: 1 } },
    { status: 409 }, { status: 503 }]) {
    const f = setup(options); assert.equal(f.call().body.relayCode, 'CLOSED');
    assert.doesNotMatch(JSON.stringify(f.h.logs), /private HTTP details|rrrrrrrr|ssssssss/);
  }
});
test('Verlorene Antwort erzeugt keinen Doppelwunsch; Endstatus bleibt bis zur Erholung ausstehend', () => {
  const f = setup(); f.call(); f.options.hang = true;
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 1, outcome: 'done' });
  assert.equal(f.call().body.accepted, true); assert.equal(f.h.state(f.owner, f.radio).queueTotal, 0);
  f.h.advance(20000);
  const latest = f.pending.at(-1), before = f.sends.length;
  f.pending[0]({ status: 200, body: { accepted: true, serverTime: f.h.now() } });
  assert.equal(f.sends.length, before, 'Veraltete Bestätigung darf neueren Auftrag nicht bestätigen');
  f.options.hang = false;
  latest({ status: 200, body: { accepted: true, serverTime: f.h.now() } });
  assert.equal(f.call({ submissionId: 'after-recovery' }).body.accepted, true);
  assert.ok(f.sends.some(send => send.body.wishUpdates.some(row => row.state === 'done')));
});
test('UID-Zuordnungsrennen wird durch begrenzte Wiederholung nach der Annahme aufgefangen', () => {
  const f = setup(); f.call();
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 1, outcome: 'done' });
  let count = f.sends.filter(send => send.body.wishUpdates.some(row => row.state === 'done')).length;
  for (let i = 0; i < 3; i++) f.h.advance(20000);
  const after = f.sends.filter(send => send.body.wishUpdates.some(row => row.state === 'done')).length;
  assert.ok(after >= count + 3);
  f.h.advance(20000); count = f.sends.at(-1).body.wishUpdates.length;
  assert.equal(count, 0, 'Nach dem Zuordnungsfenster genügt der Station-Heartbeat');
});
test('Große ausstehende Statusmenge wird verlustfrei in Paketen von höchstens 100 übertragen', () => {
  const at = Date.now() - 120000;
  const entries = Array.from({ length: 205 }, (_, i) => ({ submissionId: 'batch-' + i, state: 'done', position: null,
    createdAt: at, at, committed: true, dirty: true, revision: 1 }));
  const f = setup({ store: persistence({ [privateKey]: settings(), [journalKey]: { version: 1, entries } }) });
  assert.deepEqual(f.sends.map(send => send.body.wishUpdates.length), [100, 100, 5]);
  assert.equal(new Set(f.sends.flatMap(send => send.body.wishUpdates.map(row => row.submissionId))).size, 205);
});
test('Schreibfehler beim Entfernen verliert den Endstatus nicht und blockiert keine native Bearbeitung', () => {
  const f = setup(); f.call(); const save = f.store.setObject;
  f.store.setObject = () => { throw Error('storage offline'); };
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 1, outcome: 'discarded' });
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 0);
  assert.equal(f.call({ submissionId: 'while-storage-down' }).body.accepted, false);
  f.store.setObject = save; f.h.advance(20000);
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'discarded');
});
test('Metadaten bleiben begrenzt; Kapazitätsgrenze nimmt keine weiteren Androidwünsche an', () => {
  const at = Date.now() - 120000;
  const entries = Array.from({ length: 256 }, (_, i) => ({ submissionId: 'bound-' + i, state: 'done', position: null,
    createdAt: at, at, committed: true, dirty: true, revision: 1 }));
  const f = setup({ store: persistence({ [privateKey]: settings(), [journalKey]: { version: 1, entries } }) });
  assert.equal(f.call().body.relayCode, 'RATE_LIMITED'); assert.equal(f.store.data[journalKey].entries.length, 256);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Native Annahme bleibt frei' });
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 1);
});
test('Ohne Datenänderung entstehen keine zusätzlichen Pushes; Neustart/Shutdown sind idempotent', () => {
  const f = setup(), before = f.sends.length;
  for (let i = 0; i < 3; i++) f.h.state(f.owner, f.radio);
  f.h.app.onAppStart();
  assert.equal(f.hooks.size, 1); assert.equal(f.h.timers.size, 1); assert.equal(f.sends.length, before);
  f.h.app.onShutdown(); f.h.app.onPrepareShutdown();
  assert.equal(f.h.timers.size, 0); assert.equal(f.removed.length, 1);
});
test('Fehlende Commitbestätigung rollt die Queue zurück; ein reservierter Marker ist keine erfolgreiche Annahme', () => {
  const f = setup(), save = f.store.setObject; let writes = 0;
  f.store.setObject = (key, value) => {
    if (key === journalKey && ++writes === 2) throw Error('commit failed');
    save(key, value);
  };
  assert.equal(f.call().body.accepted, false);
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 0);
  assert.equal(f.call().body.accepted, false);
  f.store.setObject = save; f.h.app.onPrepareShutdown();
  const reboot = setup({ store: f.store });
  assert.equal(reboot.call().body.accepted, false);
  assert.equal(reboot.sends[0].body.wishUpdates.length, 0, 'Unbestätigte ID darf nicht publiziert werden');
});
test('Bestätigung einer älteren Revision löscht keine inzwischen geänderte Bearbeitungsstufe', () => {
  const f = setup(); f.options.hang = true; f.call();
  f.h.event(f.owner, f.radio, 'mw:setWishStage', { id: 1, stage: 'preparing', previousStage: 'queued' });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'queued', 'Vorheriger Auftrag ist noch unterwegs');
  f.options.hang = false;
  f.pending[0]({ status: 200, body: { accepted: true, serverTime: f.h.now() } });
  assert.equal(f.sends.at(-1).body.wishUpdates[0].state, 'preparing');
});
test('Rückwärts gestellte Uhr sperrt neue Wünsche; abgelaufene Endmarker werden auch zur Laufzeit entfernt', () => {
  const f = setup(); f.call();
  f.h.event(f.owner, f.radio, 'mw:resolveRequest', { id: 1, outcome: 'done' });
  f.h.advance(-1); assert.equal(f.call({ submissionId: 'clock' }).body.relayCode, 'CLOSED');
  f.h.advance(8 * 86400000 + 1);
  assert.equal(f.store.data[journalKey].entries.length, 0);
  assert.equal(f.call({ submissionId: 'clock' }).body.accepted, true);
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
    assert.equal(typeof h.app.chatCommands['mischwerk-relay'], 'function', 'Privater Diagnosebefehl vorhanden');
    h.app.chatCommands['mischwerk-relay'](person, command);
    return person.messages.length ? JSON.parse(person.messages.at(-1).replace(/\\([_°<>\\])/g, '$1')) : null;
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
  assert.equal(f.invoke(owner), null); assert.equal(f.checks.length, 0);
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
  assert.equal(f.invoke(owner, 'aktivieren').error, 'invalid-command'); assert.equal(f.checks.length, before);
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

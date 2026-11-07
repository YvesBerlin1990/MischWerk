// Ausschließlich Plattform-Fakes und lokale Testschlüssel; kein echter HTTP-Aufruf.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const key = 'mischwerk.android.private.v1';
const target = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
function fixture(options = {}) {
  const value = { enabled: false, runtimeVerified: false, syncSecret: 's'.repeat(64), syncUrl: target, revision: 1, ...options.settings };
  const calls = [], hooks = []; let runtime, h;
  h = createHarness(persistence({ [key]: value }), {
    serverMethods: { getExternalServerAccess: () => ({ canAccessURL: () => options.allowed !== false,
      postURL(url, parameters) { calls.push({ url, parameters }); if (options.throwSend) throw Error(value.syncSecret + ' private failure'); }
    }), getWebHookAccess: () => ({ registerWebHook: (...args) => hooks.push(args), unregisterWebHook() {} }) },
    configureModules(c) { const attach = c.MischWerkModules.attachAndroidPublisher;
      c.MischWerkModules.attachAndroidPublisher = r => { attach(r); runtime = r; }; }
  });
  const owner = h.user(1, 'Otterchen', 'owner');
  return { h, owner, runtime, calls, hooks, value, options,
    run(user = owner, params = 'http-pruefen') { h.app.chatCommands['mischwerk-relay'](user, params); },
    reply(change = {}) { const p = calls.at(-1).parameters;
      (change.failed ? p.onFailure : p.onSuccess)(change.raw ?? JSON.stringify({ accepted: true, serverTime: h.now() }),
        { getResponseCode: () => change.status ?? 200, getURLString: () => change.url ?? target }); },
    result() { return JSON.parse(owner.messages.at(-1)); }
  };
}
test('Einmaltest sendet nur nach ausdrücklichem Inhaberaufruf echte Senderprojektion und keine Wünsche', () => {
  const f = fixture(), before = JSON.stringify(f.h.store.data), publicBefore = f.h.bot.messages.length;
  f.runtime.state.topic = 'Aktuelles Thema';
  assert.equal(f.calls.length, 0); f.run(); assert.equal(f.calls.length, 1);
  const p = f.calls[0].parameters, body = JSON.parse(p.data.payload);
  assert.equal(f.calls[0].url, target); assert.deepEqual(Object.keys(p.data).sort(), ['nonce','payload','sig','ts']);
  assert.equal(p.header, undefined); assert.equal(p.headers, undefined);
  assert.equal(p.data.sig, require('node:crypto').createHmac('sha256', f.value.syncSecret)
    .update('v1.'+p.data.ts+'.'+p.data.nonce+'.'+p.data.payload).digest('hex'));
  assert.equal(body.station.topic, 'Aktuelles Thema'); assert.equal(body.station.updatedAt, f.h.now());
  assert.equal(body.station.wishboxOpen, f.runtime.state.requestsEnabled === true); assert.deepEqual(body.wishUpdates, []);
  f.reply(); const result = f.result(); assert.equal(result.nativeResponseAccepted, true);
  assert.equal(result.http.status, 200); assert.equal(result.http.accepted, true);
  assert.equal(result.firestoreWriteConfirmed, null); assert.equal(result.configuration.enabled, false);
  assert.equal(result.configuration.runtimeVerified, false); assert.equal(JSON.stringify(f.h.store.data), before);
  assert.equal(f.hooks.length, 0); assert.equal(f.h.timers.size, 0); assert.equal(f.h.bot.messages.length, publicBefore);
  assert.doesNotMatch(JSON.stringify(f.owner.messages), /ssssssss|Aktuelles Thema/);
});
test('Andere Rollen, Abwesenheit und ähnliche Befehle starten keinen Einmaltest', () => {
  const f = fixture();
  for (const [i, role] of ['listener', 'moderator', 'manager', 'developer'].entries()) f.run(f.h.user(i + 10, role, role));
  f.owner.online = false; f.run(); f.owner.online = true;
  f.run(f.owner, 'http-pruefen jetzt'); assert.equal(f.calls.length, 0);
});
test('Unvollständige, bereits aktive, verifizierte und fremde Konfiguration bleibt gesperrt', () => {
  for (const settings of [{ syncSecret: '' }, { enabled: true }, { runtimeVerified: true },
    { enabled: undefined }, { syncUrl: target + '?x=1' }, { syncUrl: 'https://evil.invalid' }]) {
    const f = fixture({ settings }); f.run(); assert.equal(f.calls.length, 0);
  }
  const f = fixture({ allowed: false }); f.run(); assert.equal(f.calls.length, 0);
});
test('HTTP-/Callback-/JSON-/Zeitfehler bestätigen keine native Abnahme und geben keine Rohdaten aus', () => {
  for (const change of [{ status: 401, failed: true }, { status: 500 }, { raw: '<html>private details</html>' },
    { raw: 'x'.repeat(4097) }, { url: 'https://evil.invalid' }, { raw: '{"accepted":false,"serverTime":0}' },
    { raw: '{"accepted":true,"serverTime":0}' }, { raw: '[1,2]' }]) {
    const f = fixture(); f.run(); f.reply(change); const result = f.result();
    assert.equal(result.nativeResponseAccepted, false); assert.equal(result.firestoreWriteConfirmed, null);
    assert.doesNotMatch(JSON.stringify(f.owner.messages), /ssssssss|private details|evil.invalid/);
    if (change.status === 401) { assert.equal(result.http.status, 401); assert.equal(result.http.callback, 'failure'); }
  }
});
test('Timeout gibt genau einen Fehler zurück, hält physischen Port besetzt und ignoriert späte Antwort', () => {
  const f = fixture(); f.run(); f.h.advance(10000); assert.ok(f.result().errors.includes('timeout'));
  const count = f.owner.messages.length; f.h.advance(20001); f.run(); assert.equal(f.calls.length, 1);
  f.reply(); assert.equal(f.owner.messages.length, count + 1); f.h.advance(30000); f.run();
  assert.equal(f.calls.length, 2); f.reply(); assert.equal(f.result().nativeResponseAccepted, true);
});
test('Parallelaufruf und schnelle Wiederholung senden keinen zweiten POST', () => {
  const f = fixture(); f.run(); f.run(); assert.equal(f.calls.length, 1); f.reply();
  f.run(); assert.equal(f.calls.length, 1); f.h.advance(30000); f.run(); assert.equal(f.calls.length, 2);
});
test('Rechteverlust, Verlassen und Shutdown unterdrücken eine verspätete Erfolgsantwort', () => {
  for (const mode of ['role', 'leave', 'shutdown']) {
    const f = fixture(); f.run();
    if (mode === 'role') f.owner.role = 'manager';
    if (mode === 'leave') { f.owner.online = false; f.h.app.onUserLeft(f.owner); }
    if (mode === 'shutdown') f.h.app.onPrepareShutdown();
    f.reply(); assert.equal(f.owner.messages.length, 0); assert.equal(f.h.timers.size, 0);
  }
});
test('Konfigurationswechsel und private Speicherfehler werden nicht als Erfolg gemeldet', () => {
  for (const mode of ['revision', 'secret', 'read']) {
    const f = fixture(); f.run();
    if (mode === 'revision') f.h.store.data[key].revision += 1;
    if (mode === 'secret') f.h.store.data[key].syncSecret = 'n'.repeat(64);
    if (mode === 'read') f.h.store.getObject = () => { throw Error('private failure'); };
    f.reply(); assert.equal(f.result().nativeResponseAccepted, false);
    assert.doesNotMatch(JSON.stringify(f.owner.messages), /private failure|ssssssss|nnnnnnnn/);
  }
});
test('Synchroner Versandfehler hinterlässt weder Timer noch offene Anforderung', () => {
  const f = fixture({ throwSend: true }); f.run(); assert.equal(f.result().nativeResponseAccepted, false);
  assert.equal(f.h.timers.size, 0); assert.doesNotMatch(JSON.stringify(f.h.logs) + JSON.stringify(f.owner.messages), /ssssssss|private failure/);
});

test('Fehlende native HTTP-API und Uhrenrücksprung erzeugen keinen Netzwerkversuch', () => {
  const f = fixture(); f.runtime.now = () => NaN; f.run(); assert.equal(f.calls.length, 0);
  assert.ok(f.result().errors.includes('clock-invalid'));
  const store = persistence({ [key]: { enabled:false, runtimeVerified:false, syncUrl:target, syncSecret:'s'.repeat(64) } });
  const h = createHarness(store, {serverMethods:{getExternalServerAccess:undefined}}), owner = h.user(1,'Otterchen','owner');
  h.app.chatCommands['mischwerk-relay'](owner,'http-pruefen');
  assert.equal(JSON.parse(owner.messages.at(-1)).nativeResponseAccepted,false); assert.equal(h.timers.size,0);
});

test('Speichern neuer privater Einstellungen verwirft den alten Einmaltest endgültig', () => {
  const f = fixture(); f.run(); f.h.app.chatCommands['mischwerk-relay'](f.owner,'einrichten');
  const session = f.owner.sessions.find(s=>s.content.htmlFile.assetPath==='relay-settings.html');
  f.h.event(f.owner,session,'mw:androidSettings.save',{revision:1,requestId:'save-probe',syncSecret:'n'.repeat(64),relaySecret:''});
  f.reply(); assert.equal(f.owner.messages.length,0); assert.equal(f.h.timers.size,0);
  assert.equal(f.h.store.data[key].syncSecret,'n'.repeat(64)); assert.equal(f.h.store.data[key].enabled,false);
});

test('Signierte Auth-Probe sendet nur {} ohne Header und liest nur den Statuscode', () => {
  const f = fixture(), before = JSON.stringify(f.h.store.data);
  f.runtime.androidStationProjection = () => { throw Error('Senderprojektion darf nicht gelesen werden'); };
  f.run(f.owner, 'auth-pruefen'); assert.equal(f.calls.length, 1);
  const p = f.calls[0].parameters;
  assert.equal(p.data.payload, '{}'); assert.deepEqual(Object.keys(p.data).sort(), ['nonce','payload','sig','ts']);
  assert.equal(p.header, undefined); assert.equal(p.headers, undefined);
  assert.equal(p.data.sig, require('node:crypto').createHmac('sha256', f.value.syncSecret)
    .update('v1.'+p.data.ts+'.'+p.data.nonce+'.'+p.data.payload).digest('hex'));
  f.reply({status:400, failed:true, raw:'{"error":"invalid_payload"}'});
  const report = f.result();
  assert.equal(report.check, 'native-signed-auth-post'); assert.equal(report.authenticationAccepted, true);
  assert.equal(report.nativeResponseAccepted, false); assert.equal(report.firestoreWriteConfirmed, null);
  assert.equal(report.request.stationUpdatedAt, null); assert.equal(report.request.payloadShape, 'empty-object');
  assert.equal(report.http.status, 400); assert.equal(report.http.jsonParsed, false);
  assert.equal(report.http.bodyRead, false); assert.equal(report.http.responseUrlMatches, null);
  assert.equal(report.http.invalidPayloadConfirmed, null); assert.deepEqual(report.errors, []);
  assert.equal(report.request.probeHeaderIncluded, undefined);
  assert.equal(JSON.stringify(f.h.store.data), before); assert.equal(f.hooks.length, 0);
  assert.doesNotMatch(JSON.stringify(f.owner.messages), /ssssssss|Senderprojektion/);
});

test('Headerprobe akzeptiert weder 401, 200, Serverfehler noch ungültige Statuscodes', () => {
  for (const change of [{status:401,failed:true,raw:'{"error":"unauthorized"}'},
    {status:200,raw:'{"accepted":true}'},{status:500,failed:true,raw:'other private error'},
    {status:0,failed:true,raw:'not JSON private error'}, {status:400.5}, {status:700}]) {
    const f = fixture(); f.run(f.owner,'auth-pruefen'); f.reply(change);
    assert.equal(f.result().authenticationAccepted,false); assert.equal(f.result().nativeResponseAccepted,false);
    assert.ok(f.result().errors.includes('authentication-not-confirmed'));
    assert.doesNotMatch(JSON.stringify(f.owner.messages), /other private|not JSON|evil.invalid|ssssssss/);
  }
});

test('Headerprobe fasst Antwortbody und Antwortadresse in beiden Callbacks nicht an', () => {
  for (const failed of [false, true]) {
    const f = fixture(); f.run(f.owner, 'auth-pruefen'); let forbiddenReads = 0, codeReads = 0;
    const raw = { toString() { forbiddenReads++; throw Error('private response body'); } };
    const response = { getResponseCode() { codeReads++; return 400; },
      getURLString() { forbiddenReads++; throw Error('private response URL'); } };
    const p = f.calls[0].parameters; (failed ? p.onFailure : p.onSuccess)(raw, response);
    assert.equal(forbiddenReads, 0); assert.equal(codeReads, 1);
    assert.equal(f.result().authenticationAccepted, true); assert.equal(f.result().http.bodyRead, false);
    assert.equal(f.result().http.jsonParsed, false); assert.equal(f.result().http.responseUrlMatches, null);
    assert.doesNotMatch(JSON.stringify(f.owner.messages), /private response|ssssssss/);
  }
});

test('Auth-Probe und Statustest teilen Timeout, Wiederholungsabstand und physischen Port', () => {
  const f = fixture(); f.run(f.owner,'auth-pruefen'); assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].parameters.data.payload,'{}'); f.run(); assert.equal(f.calls.length,1);
  f.h.advance(10000); assert.ok(f.result().errors.includes('timeout'));
  f.h.advance(20001); f.run(); assert.equal(f.calls.length,1);
  f.reply({status:400,failed:true,raw:'{"error":"invalid_payload"}'});
  f.h.advance(30000); f.run(); assert.equal(f.calls.length,2);
  assert.ok(JSON.parse(f.calls[1].parameters.data.payload).station);
  f.reply(); assert.equal(f.result().nativeResponseAccepted,true);
});

test('Auth-Probe bleibt bei fremden Rollen, ungültiger Konfiguration und fremden Befehlsvarianten gesperrt', () => {
  for(const settings of [{enabled:true},{runtimeVerified:true},{syncSecret:''},{syncUrl:target+'?secret=x'}]) {
    const f = fixture({settings}); f.run(f.owner,'auth-pruefen'); assert.equal(f.calls.length,0);
  }
  const f = fixture(); f.run(f.h.user(10,'Manager','manager'),'auth-pruefen');
  f.run(f.owner,'auth-pruefen headers'); f.run(f.owner,'auth-pruefen header');
  assert.equal(f.calls.length,0);
});

test('Auth-Probe bestätigt bei Konfigurationswechsel oder verlorenen Rechten keinen Erfolg', () => {
  for(const mode of ['revision','role','leave','shutdown']) {
    const f = fixture(); f.run(f.owner,'auth-pruefen');
    if(mode==='revision') f.h.store.data[key].revision++;
    if(mode==='role') f.owner.role='manager';
    if(mode==='leave') {f.owner.online=false;f.h.app.onUserLeft(f.owner);}
    if(mode==='shutdown') f.h.app.onPrepareShutdown();
    f.reply({status:400,failed:true,raw:'{"error":"invalid_payload"}'});
    if(mode==='revision') assert.equal(f.result().authenticationAccepted,false);
    else assert.equal(f.owner.messages.length,0);
    assert.equal(f.h.timers.size,0);
  }
});

test('Der Auth-Probeport lehnt nichtleere Nutzlasten und unbekannte Modi vor dem Versand ab', () => {
  const f = fixture();
  for(const body of [{station:{}},[],null,'{}']) {
    assert.throws(()=>f.runtime.sendAndroidVerification(body,()=>{},true), /ANDROID_AUTH_PROBE_BODY/);
  }
  assert.throws(()=>f.runtime.sendAndroidVerification({},()=>{},'headers'), /ANDROID_VERIFICATION_MODE/);
  assert.equal(f.calls.length,0);
});

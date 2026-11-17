// Ausschließlich der ausdrücklich freigegebene lokale Demo-Slot; kein Seed, Reset oder Reload.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const root = process.env.MISCHWERK_ANDROID_ROOT;
assert.equal(process.env.GCLOUD_PROJECT, 'demo-radio-wishes-three');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18480');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19419');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'build/studio-wishes-three-integration/emulator-fixture.json'), 'utf8'));
assert.equal(fixture.project, process.env.GCLOUD_PROJECT);
const base = 'http://127.0.0.1:15005';
const expectedHash = 'ab8398d567a1f9329c7105ec28f76ffedb3a1f20e3a00f859774509f22bea1dc';
const source = fixture.accounts.find(row => row.uid.endsWith('-source')); assert.ok(source);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const posts = [], pending = new Set(), wireErrors = [];
let phase = "initial";
let h, pulse, broadcast, user, physical = 0, maximumPhysical = 0, loseNext = false;
async function json(route, body, token) {
  const response = await fetch(base + '/' + route, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Connection: 'close', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
  const value = await response.json(); assert.equal(response.status, 200, route + ': HTTP ' + response.status); return value;
}
async function document(collection, id) {
  const response = await fetch('http://127.0.0.1:18480/v1/projects/' + fixture.project +
    '/databases/(default)/documents/' + collection + '/' + id, { headers: { Authorization: 'Bearer owner', Connection: 'close' } });
  assert.equal(response.status, 200); return (await response.json()).fields;
}
async function until(predicate, limit = 18000) {
  const start = performance.now();
  while (!predicate()) {
    assert.equal(wireErrors.length, 0, wireErrors[0] || 'Transportfehler');
    assert.ok(performance.now() - start < limit, 'Lokale Einzelbestätigung fehlt: ' + phase);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
const binding = () => ({ sessionId: broadcast.sessionId, authorityEpoch: broadcast.authorityEpoch,
  targetBindingRevision: broadcast.targetBindingRevision });
async function action(operation, extra = {}) {
  return json('studioBroadcastAction', { contractVersion: 2, operation, ...extra }, source.idToken);
}
function postURL(url, parameters) {
  assert.equal(url, 'https://radio-mischwerk.web.app/api/publishKnuddelsState');
  assert.deepEqual(Object.keys(parameters.data).sort(), ['nonce', 'payload', 'sig', 'ts']);
  assert.ok(Object.values(parameters.data).every(value => typeof value === 'string'));
  const request = JSON.parse(parameters.data.payload); assert.equal(request.nativeConfig, undefined);
  const row = { request, at: performance.now(), lost: loseNext }; loseNext = false; posts.push(row);
  physical++; maximumPhysical = Math.max(physical, maximumPhysical);
  const work = (async () => {
    try {
      const response = await fetch(base + '/publishKnuddelsState', { method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Connection: 'close' },
        body: new URLSearchParams(parameters.data), signal: AbortSignal.timeout(15000) });
      const raw = await response.text(); row.status = response.status; row.finishedAt = performance.now();
      const parsed = JSON.parse(raw); row.summary = {contractVersion:parsed.contractVersion, accepted:parsed.accepted, station:parsed.station?{authority:parsed.station.authority,state:parsed.station.broadcastState,open:parsed.station.wishboxOpen}:null,
        statuses:(parsed.ownWishStatuses || []).map(item => ({state:item.state,position:item.position,error:item.error})),queries:request.ownWishQueries.length};
      assert.equal(response.status, 200, 'Nativer Demo-Port: HTTP ' + response.status);
      assert.ok(raw.length <= 32768 && Buffer.byteLength(raw) <= 32768);
      physical--;
      if (row.lost) parameters.onFailure('', { getResponseCode: () => 503, getURLString: () => url });
      else parameters.onSuccess(raw, { getResponseCode: () => response.status, getURLString: () => url });
      row.completed = true;
    } catch (error) { if (!row.finishedAt) physical--; throw error; }
  })();
  pending.add(work); work.then(() => pending.delete(work), error => {wireErrors.push(error.message);pending.delete(work);});
}
async function main() {
  const before = await json('__test-runtime'); assert.equal(before.codeHash, expectedHash);
  const clockBefore = await json('__test-clock', { advanceMs: 0 }); assert.ok(Math.abs(clockBefore.now - Date.now()) < 1000);
  const status = await action('status'); assert.ok(!status.broadcast || ['ended', 'expired'].includes(status.broadcast.state));
  try {
    broadcast = (await action('acquire', { requestId: crypto.randomUUID(), expectedRevision: status.revision })).broadcast;
    broadcast = (await action('confirmConnection', { requestId: crypto.randomUUID(), expectedRevision: broadcast.revision,
      ...binding(), connectionGeneration: crypto.randomUUID(),
      evidence: { confirmationSeq: 1, pcmFrames: 48000, sourceAudioBytes: 4096, progressAgeMs: 0 } })).broadcast;
    const empty = await json('studioWishAction', { contractVersion: 2, operation: 'queuePage', cursor: null }, source.idToken);
    assert.equal(empty.items.length, 0);
    h = createHarness(persistence({ 'mischwerk.android.private.v1': { enabled: true, runtimeVerified: true,
      syncSecret: fixture.hmacKey, syncUrl: 'https://radio-mischwerk.web.app/api/publishKnuddelsState', revision: 0 } }),
      { now: Date.now(), serverMethods: { getExternalServerAccess: () => ({ canAccessURL: () => true, postURL }) } });
    pulse = setInterval(() => h.advance(Math.max(0, Date.now() - h.now())), 10);
    phase='central-projection';await until(() => h.runtime.receivedShow().active);
    user = h.user(7, 'Nativer Prüfhörer'); const radio = h.open(user);
    const start = performance.now(), entries = () => h.runtime.nativeRelayState().entries;
    const submit = id => h.event(user, radio, 'mw:wish.submit', { submissionId: id, text: 'Synthetischer nativer Wunsch ' + id });
    submit('native-448-one'); const first = posts.at(-1); submit('native-448-two');
    assert.equal(posts.at(-1), first, 'Ein laufender physischer Post bleibt allein');
    phase='first-two-receipts';await until(() => entries().length === 2 && entries().every(row => row.accepted));
    const firstRows = posts.filter(row => row.request.wishSubmissions.length);
    assert.equal(firstRows.length, 2); assert.equal(maximumPhysical, 1);
    const ackTimes = user.sessions.flatMap(session => session.events).filter(row => row.type === 'mw:wish.receipt' && row.data.accepted);
    assert.equal(ackTimes.length, 2);
    const fastFinished = performance.now();
    loseNext = true; submit('native-448-loss'); const lost = posts.at(-1);
    phase='lost-response';await until(() => lost.completed); assert.equal(lost.status, 200); assert.equal(entries()[2].accepted, false);
    const id = entries()[2].submissionId; submit('native-448-loss'); assert.equal(entries().length, 3);
    phase='loss-recovery';await until(() => entries()[2].accepted);
    const repeated = posts.filter(row => row.request.wishSubmissions.some(wish => wish.submissionId === id));
    assert.equal(repeated.length, 2); assert.equal(repeated[0].request.wishSubmissions[0].submissionId, repeated[1].request.wishSubmissions[0].submissionId);
    for (const entry of entries()) {
      const stored = await document('liveStudioWishes', hash(entry.submissionId));
      assert.equal(stored.text.stringValue, entry.text);
    }
    const target = entries()[0];
    let confirmationSeq = 1;
    for (const [operation, expected] of [['accept', 'received'], ['prepare', 'preparing'], ['done', 'done']]) {
      confirmationSeq++;
      broadcast = (await action('heartbeat', { requestId: crypto.randomUUID(), ...binding(),
        connectionGeneration: broadcast.connectionGeneration,
        evidence: {confirmationSeq,pcmFrames:48000*confirmationSeq,sourceAudioBytes:4096*confirmationSeq,progressAgeMs:0} })).broadcast;
      const page = await json('studioWishAction', { contractVersion: 2, operation: 'queuePage', cursor: null }, source.idToken);
      const current = page.items.find(row => row.submissionId === target.submissionId); assert.ok(current);
      await json('studioWishAction', { contractVersion: 2, operation: 'submit', requestId: crypto.randomUUID(),
        ...binding(), submissionId: current.submissionId, action: operation, expectedWishRevision: current.wishRevision }, source.idToken);
      phase='stage-'+operation;await until(() => entries().find(row => row.submissionId === target.submissionId).state === expected, 18000);
    }
    assert.equal(h.runtime.nativeWishPositions(user).lastOutcome, 'played');
    h.app.onUserDeleted(7); await until(() => h.runtime.nativeRelayState().deletions.every(row => row.applied));
    const afterQueue = await json('studioWishAction', { contractVersion: 2, operation: 'queuePage', cursor: null }, source.idToken);
    assert.equal(afterQueue.items.length, 0);
    for (const row of firstRows) for (const wish of row.request.wishSubmissions) {
      const erased = await document('liveStudioWishes', hash(wish.submissionId)); assert.equal(erased.erased.booleanValue, true); assert.equal(erased.text, undefined);
    }
    const report = { project: fixture.project, version: h.config.version, build: h.config.buildNumber, runtime: before,
      firstPostMs: +(firstRows[0].at - start).toFixed(2), busyPostMs: +(firstRows[1].at - start).toFixed(2),
      bothReceiptsMs: +(fastFinished - start).toFixed(2), lossRetryMs: +(repeated[1].at - repeated[0].at).toFixed(2),
      actualSignedPort: true, actualFirestore: true, wishes: 3, maximumPhysical, duplicateCreated: false,
      stages: ['received', 'preparing', 'done'], ownDeletionConfirmed: true, activeQueue: 0,
      clockAdvanced: false, nativePlatformExecution: false };
    const file = path.join(os.tmpdir(), 'MischWerk-448-Native-Firebase-Messung.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } catch (error) {
    console.error(JSON.stringify({phase,atFailure:true,states:h?.runtime.nativeRelayState().entries.map(item=>item.state),
      replies:posts.slice(-4).map(row=>row.summary),failure:h?.runtime.androidLastFailure()}));
    throw error;
  } finally {
    if (h && user && h.runtime.nativeRelayState().deletions.length === 0) {
      h.app.onUserDeleted(7); await until(() => h.runtime.nativeRelayState().deletions.every(row => row.applied));
    }
    if (broadcast) {
      const current = await action('status');
      if (current.broadcast?.sessionId === broadcast.sessionId && !['ended', 'expired'].includes(current.broadcast.state)) {
        await action('end', { requestId: crypto.randomUUID(), ...binding(), expectedRevision: current.broadcast.revision });
      }
    }
    if (pulse) clearInterval(pulse); h?.app.onPrepareShutdown(); h?.app.onShutdown();
    await Promise.all([...pending]);
    const after = await json('__test-runtime'); assert.deepEqual(after, before);
    const clockAfter = await json('__test-clock', { advanceMs: 0 }); assert.ok(Math.abs(clockAfter.now - Date.now()) < 1000);
    const final = await action('status'); assert.ok(!final.broadcast || ['ended', 'expired'].includes(final.broadcast.state));
    console.log(JSON.stringify({ finalSession: final.broadcast?.state || 'none', runtimeUnchanged: true, clockAdvanceMs: 0, ownProcessesStopped: true }));
  }
}
main().catch(error => { console.error(JSON.stringify({phase,error:error.message,lastFailure:h?.runtime.androidLastFailure(),reply:posts.at(-1)?.summary,states:h?.runtime.nativeRelayState().entries.map(item=>item.state),wireErrors})); process.exitCode = 1; });

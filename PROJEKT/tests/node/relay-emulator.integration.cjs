// Expliziter gemeinsamer Lauf: echte lokale Handler/Firestore, tatsächlicher nativer Appadapter.
// Aufruf ausschließlich mit dem freigegebenen getrennten Demo-Slot; keine Produktionsziele.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const { seed } = require('../fixtures/legacy-wishes.cjs');

async function main() {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-radio-native-v2');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18280');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19219');
  const androidRoot = process.env.MISCHWERK_ANDROID_ROOT;
  assert.ok(androidRoot && fs.existsSync(path.join(androidRoot, 'project/tools/studio-v2-migration.cjs')));
  const fixture = JSON.parse(fs.readFileSync(path.join(androidRoot, 'build/studio-v2-native/emulator-fixture.json'), 'utf8'));
  assert.equal(fixture.project, process.env.GCLOUD_PROJECT);
  const base = 'http://127.0.0.1:15004';
  let migrationId = 'native-446-' + Date.now();
  let resumeNamespace = null;
  let continueActive = false;
  if (process.env.MISCHWERK_RESUME_NATIVE_INTEGRATION === '1') {
    const response = await fetch('http://127.0.0.1:18280/v1/projects/' + fixture.project +
      '/databases/(default)/documents/studioMigrationBridge/current', { headers: { Authorization: 'Bearer owner' } });
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.ok(['importing', 'active'].includes(saved.fields.phase.stringValue));
    continueActive = saved.fields.phase.stringValue === 'active';
    migrationId = saved.fields.migrationId.stringValue;
    resumeNamespace = saved.fields.sourceNamespace.stringValue;
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Native-V2-Integration-'));
  let h, loseNext = false;
  const posts = [], pending = new Set();
  async function http(route, body, token) {
    const response = await fetch(base + '/' + route, { method: 'POST', headers: {
      'Content-Type': 'application/json', Connection: 'close', ...(token ? { Authorization: 'Bearer ' + token } : {})
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    assert.equal(response.status, 200, route + ': ' + (result.error?.code || response.status));
    return result;
  }
  const initialClock = (await http('__test-clock', { advanceMs: 0 })).now;
  const external = { canAccessURL: () => true, postURL(url, args) {
    assert.equal(url, 'https://radio-mischwerk.web.app/api/publishKnuddelsState');
    assert.deepEqual(Object.keys(args.data).sort(), ['nonce', 'payload', 'sig', 'ts']);
    assert.ok(Object.values(args.data).every(value => typeof value === 'string'));
    const item = { request: JSON.parse(args.data.payload) };
    posts.push(item);
    const task = (async () => {
      const response = await fetch(base + '/publishKnuddelsState', { method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Connection: 'close' },
        body: new URLSearchParams(args.data), signal: AbortSignal.timeout(30000) });
      const raw = await response.text(); item.status = response.status; item.reply = JSON.parse(raw);
      assert.ok(raw.length <= 32768 && Buffer.byteLength(raw) <= 32768);
      if (loseNext) {
        loseNext = false;
        args.onFailure('', { getResponseCode: () => 503, getURLString: () => url });
      } else {
        args.onSuccess(raw, { getResponseCode: () => response.status, getURLString: () => url });
      }
    })();
    pending.add(task); task.then(() => pending.delete(task), () => pending.delete(task));
  } };
  async function flush() { while (pending.size) await Promise.all([...pending]); }
  async function advance(milliseconds) {
    await flush();
    const clock = await http('__test-clock', { advanceMs: milliseconds });
    h.advance(clock.now - h.now()); await flush();
  }
  function tool(operation, argument) {
    const result = spawnSync(process.execPath, ['project/tools/studio-v2-migration.cjs', operation,
      migrationId, ...(argument ? [argument] : []), '--apply-local'],
    { cwd: androidRoot, env: process.env, encoding: 'utf8', windowsHide: true, timeout: 120000 });
    assert.equal(result.status, 0, operation + ': ' + result.stderr);
    return JSON.parse(result.stdout.trim());
  }
  function decode(value) {
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('nullValue' in value) return null;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
    if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]));
    return value.timestampValue;
  }
  async function document(collection, id) {
    const response = await fetch('http://127.0.0.1:18280/v1/projects/' + fixture.project +
      '/databases/(default)/documents/' + collection + '/' + id, { headers: { Authorization: 'Bearer owner' } });
    assert.equal(response.status, 200);
    const value = await response.json();
    return Object.fromEntries(Object.entries(value.fields).map(([k, v]) => [k, decode(v)]));
  }
  const hash = text => crypto.createHash('sha256').update(text).digest('hex');
  try {
    h = createHarness(persistence({ 'mischwerk.android.private.v1': {
      enabled: true, runtimeVerified: true, syncSecret: fixture.hmacKey,
      syncUrl: 'https://radio-mischwerk.web.app/api/publishKnuddelsState', revision: 0
    } }), { now: resumeNamespace ? parseInt(resumeNamespace.split('-')[0], 36) : initialClock,
      ...(resumeNamespace ? { random: () => Number('0.' + resumeNamespace.split('-')[1]) } : {}),
      serverMethods: { getExternalServerAccess: () => external } });
    const originals = Array.from({ length: 260 }, (_, i) => ({
      text: '  ' + i + '🎶'.repeat(140) + '  ',
      ...(i === 0 ? { delivery: { nick: 'Vorheriger DJ', senderKey: '9', at: h.now() - 1000 }, stage: 'preparing' } : {}),
      ...(i === 1 ? { senderKey: 'website:legacy', nick: 'Website', submissionId: 'legacy-web-446' } : {}),
      ...(i === 2 ? { senderKey: 'android:legacy', nick: 'Android', submissionId: 'android:legacy-android-446',
        externalSubmissionId: 'legacy-android-446', source: 'Android', origin: 'android', displayName: 'Prüfhörer Android' } : {})
    }));
    seed(h, originals);
    const original = JSON.parse(JSON.stringify(h.runtime.loadWishes()));
    const terminalId = original.nextId++;
    original.replays.push({ id: terminalId, submissionId: 'legacy-terminal-446', senderKey: '3', outcome: 'done' });
    h.runtime.commitWishMetadata(original);
    assert.ok(Buffer.byteLength(JSON.stringify(original)) > 100000);
    await flush();
    const namespace = h.runtime.nativeNamespace();
    if (resumeNamespace) assert.equal(namespace, resumeNamespace);
    if (!continueActive) {
    tool('prepare', namespace); await advance(20000);
    assert.equal(h.runtime.migrationView().prepared, true);
    assert.equal(h.runtime.migrationView().phase, 'idle');
    const owner = h.user(2, 'Otterchen', 'owner'); h.app.chatCommands.mw(owner, 'admin');
    const session = owner.sessions.find(view => view.activeView === 'team');
    const adminEvent = (type, id) => h.event(owner, session, type, { requestId: id, view: 'team', viewRevision: 1 });
    loseNext = true; adminEvent('mw:migration.start', 'integration-start'); await flush();
    const firstChunk = posts.at(-1).request.migrationChunk;
    assert.ok(firstChunk); assert.equal(h.runtime.migrationView().chunkIndex, 0);
    await advance(20000); assert.deepEqual(posts.at(-1).request.migrationChunk, firstChunk);
    assert.equal(h.runtime.migrationView().chunkIndex, 1);
    adminEvent('mw:migration.abort', 'integration-pause'); await advance(20000);
    assert.equal(posts.at(-1).request.migrationChunk, undefined);
    adminEvent('mw:migration.start', 'integration-resume'); await flush();
    for (let safety = 0; h.runtime.migrationView().phase === 'exporting'; safety++) {
      assert.ok(safety < 1000); await advance(20000);
      assert.equal(posts.at(-1).status, 200);
      assert.equal(posts.at(-1).reply.migrationReceipt?.accepted, true);
    }
    assert.equal(h.runtime.migrationView().phase, 'exported');
    assert.equal(h.runtime.loadWishes().items.length, 260);
    const exported = new Map();
    for (const item of posts) for (const wish of item.request.migrationChunk?.wishes || []) exported.set(wish.submissionId, wish);
    assert.equal(exported.size, 260);
    console.log(JSON.stringify({ stage: 'originals-exported', originals: exported.size }));
    for (const [id, expected] of exported) {
      const stored = await document('studioImportWishes', hash(migrationId + ':' + id));
      for (const [key, value] of Object.entries(expected)) assert.deepEqual(stored[key], value, 'Originalfeld ' + key);
    }
    tool('freeze'); tool('stagePending');
    const targets = path.join(directory, 'targets.json');
    fs.writeFileSync(targets, JSON.stringify(fixture.accounts.map(({ uid, targetBindingRevision }) => ({ uid, targetBindingRevision }))));
    tool('reviewTargets', targets); tool('install');
    const verified = tool('verify'); assert.ok(verified.count >= 260); tool('activate');
    console.log(JSON.stringify({ stage: 'central-verification-and-activation', verified: true }));
    } else {
      const migration = await document('studioMigrations', hash(migrationId));
      assert.equal(migration.phase, 'active');
      assert.equal(h.runtime.nativeMigrationPage({ migrationId }).sourceRevision, migration.sourceRevision);
      console.log(JSON.stringify({ stage: 'continued-after-verified-activation', originals: 260 }));
    }
    await advance(20000);
    assert.equal(h.runtime.receivedProtocol().authority, 'studio');
    assert.equal(h.runtime.migrationFrozen(), false);
    const source = fixture.accounts.find(account => account.uid.endsWith('-source'));
    let status = await http('studioBroadcastAction', { contractVersion: 2, operation: 'status' }, source.idToken);
    assert.ok(!status.broadcast || ['ended', 'expired'].includes(status.broadcast.state));
    let result = await http('studioBroadcastAction', { contractVersion: 2, operation: 'acquire',
      requestId: crypto.randomUUID(), expectedRevision: status.revision }, source.idToken);
    let broadcast = result.broadcast;
    const binding = () => ({ sessionId: broadcast.sessionId, authorityEpoch: broadcast.authorityEpoch,
      targetBindingRevision: broadcast.targetBindingRevision });
    result = await http('studioBroadcastAction', { contractVersion: 2, operation: 'confirmConnection',
      requestId: crypto.randomUUID(), expectedRevision: broadcast.revision, ...binding(), connectionGeneration: crypto.randomUUID(),
      evidence: { confirmationSeq: 1, pcmFrames: 48000, sourceAudioBytes: 4096, progressAgeMs: 0 } }, source.idToken);
    broadcast = result.broadcast; await advance(20000);
    assert.equal(h.runtime.receivedShow().nick, source.nick);
    const user = h.user(7, 'Nativer Prüfhörer'), radio = h.open(user);
    h.event(user, radio, 'mw:wish.submit', { submissionId: 'integration-native', text: 'Eigener zentraler Wunsch' });
    await flush();
    const submitted = posts.at(-1).request.wishSubmissions[0]; assert.ok(submitted);
    assert.equal(h.runtime.nativeRelayState().entries.find(row => row.clientId === 'integration-native').accepted, true);
    const storedWish = await document('liveStudioWishes', hash(submitted.submissionId));
    assert.equal(storedWish.text, 'Eigener zentraler Wunsch');
    h.event(user, radio, 'mw:wish.submit', { submissionId: 'integration-native', text: 'Eigener zentraler Wunsch' });
    assert.equal(h.runtime.nativeRelayState().entries.filter(row => row.clientId === 'integration-native').length, 1);
    const beforeEnd = h.bot.messages.length;
    await advance(45001);
    assert.equal(h.runtime.receivedShow().active, false); assert.equal(h.bot.messages.length, beforeEnd);
    h.app.onUserDeleted(7); await advance(20000);
    for (let i = 0; h.runtime.nativeRelayState().deletions.some(row => !row.applied); i++) {
      assert.ok(i < 100); await advance(20000);
    }
    const erased = await document('liveStudioWishes', hash(submitted.submissionId));
    assert.equal(erased.erased, true); assert.equal(erased.text, undefined);
    assert.equal(h.runtime.loadWishes().items.length, 260, 'Private Legacyoriginale bleiben erhalten');
    const terminalReplay = await document('studioWishReplay', hash('knuddels:' + h.runtime.nativeNamespace() + '-' + terminalId));
    assert.equal(terminalReplay.legacyDigestUnknown, true);
    assert.equal(terminalReplay.state, 'done');
    const chunkResponse = await fetch('http://127.0.0.1:18280/v1/projects/' + fixture.project +
      '/databases/(default)/documents/studioMigrations/' + hash(migrationId) + '/chunks?pageSize=1000',
      { headers: { Authorization: 'Bearer owner' } });
    assert.equal(chunkResponse.status, 200);
    const storedChunks = await chunkResponse.json();
    assert.equal(storedChunks.nextPageToken, undefined);
    assert.ok(storedChunks.documents?.length > 0);
    const report = { project: fixture.project, app: h.config.version, build: h.config.buildNumber, originals: 260,
      chunks: storedChunks.documents.length, phasedRuns: Boolean(resumeNamespace),
      posts: posts.length, migrationVerified: true, centralAcceptance: true, ownerDeletion: true,
      missingDigestStayedUnknown: terminalReplay.legacyDigestUnknown,
      terminalReplayIndependentlyRead: true, nativePlatformExecution: false };
    fs.writeFileSync(path.join(os.tmpdir(), 'MischWerk-v2-real-integration.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    h?.app.onPrepareShutdown();
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack); if (error.cause?.code) console.error('Lokaler Transport: ' + error.cause.code); process.exitCode = 1; });

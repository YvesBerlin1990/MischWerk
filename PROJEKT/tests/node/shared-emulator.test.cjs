// Verbrauchertest des zentralen Git-Submoduls; kein eigener Emulatorcode.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { AppRunner } = require('../../tools/userapp-emulator/runtime/appRunner');
const { launchConfiguration } = require('../../tools/start-emulator.cjs');
const app = path.resolve(process.env.MISCHWERK_TEST_UPLOAD || path.join(__dirname, '../../app'));
const url = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
const secret = 'synthetic_shared_' + 'x'.repeat(48);
async function until(predicate) {
  const start = performance.now();
  while (!predicate()) {
    assert.ok(performance.now() - start < 3000, 'Lokale Bestätigung fehlt');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
function create(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Shared-'));
  const config = Object.fromEntries(fs.readFileSync(path.join(app, 'app.config'), 'utf8').split(/\r?\n/)
    .filter(line => /^\s*[^#\s][^=]*=/.test(line)).map(line => {
      const offset = line.indexOf('='); return [line.slice(0, offset).trim(), line.slice(offset + 1).trim()];
    }));
  const runner = new AppRunner(app, config, { persistenceRoot: directory, accessibleDomains: [] });
  const events = [], errors = [], posts = [];
  let physical = 0, maximumPhysical = 0, position = 0;
  runner.setEventHandler({ onLog(level, message) { if (level === 'error') errors.push(message); },
    onPublicMessage() {}, onPrivateMessage() {}, onPostMessage() {}, onNicklistIconUpdate() {},
    onSessionEvent(nick, sessionId, type, data) { events.push({ nick, sessionId, type, data, at: performance.now() }); } });
  runner.appPersistence.objects['mischwerk.android.private.v1'] = {
    enabled: true, runtimeVerified: true, syncSecret: secret, syncUrl: url, revision: 0
  };
  // Ausschließlich der bekannte Modellport ist erlaubt; kein echter Netzwerkzugriff.
  runner.externalServerAccess.canAccessURL = target => target === url;
  runner.externalServerAccess.getURL = () => { throw new Error('Unerwarteter externer GET'); };
  runner.externalServerAccess.postURL = (target, parameters) => {
    assert.equal(target, url); const data = parameters.data;
    assert.deepEqual(Object.keys(data).sort(), ['nonce', 'payload', 'sig', 'ts']);
    assert.equal(data.sig, crypto.createHmac('sha256', secret).update('v1.' + data.ts + '.' + data.nonce + '.' + data.payload).digest('hex'));
    const body = JSON.parse(data.payload); assert.equal(body.nativeConfig, undefined);
    const post = { body, at: performance.now(), complete: false }; posts.push(post);
    physical++; maximumPhysical = Math.max(physical, maximumPhysical);
    setTimeout(() => {
      physical--; post.complete = true; const now = Date.now();
      parameters.onSuccess(JSON.stringify({ contractVersion: 2, accepted: true, serverTime: now,
        station: { contractVersion: 2, authority: 'studio', protocolEpoch: 'shared-test', revision: 1,
          broadcastState: 'live', onAir: true, wishboxOpen: true, moderatorNick: 'DJ-Test', topic: 'Lokaler Test',
          updatedAt: now, validUntil: now + 45000 },
        wishReceipts: body.wishSubmissions.map(row => ({ submissionId: row.submissionId, accepted: true, state: 'queued', position: ++position, error: null })),
        ownWishStatuses: [], deletionReceipts: [], broadcastEvents: [], eventCursor: 'initial',
        nickAccessPage: { snapshotId: 'roster-' + now, revision: 'a'.repeat(64), snapshotAt: now,
          validUntil: now + 45000, items: [], nextCursor: null, complete: true }
      }), { getResponseCode: () => 200, getURLString: () => url });
    }, 20);
  };
  t.after(() => {
    runner.shutdown(); assert.ok(directory.startsWith(os.tmpdir() + path.sep));
    fs.rmSync(directory, { recursive: true, force: true }); assert.deepEqual(errors, []);
  });
  runner.start();
  return { runner, events, posts, maximumPhysical: () => maximumPhysical };
}

test('Gemeinsamer Emulator ist alleiniger Benutzerstart mit expliziter MischWerk-Appquelle', () => {
  const config = launchConfiguration({ EMULATOR_SKIP_LOCAL_DELIVERY: '1' });
  assert.equal(config.arguments[0], path.resolve(__dirname, '../../tools/userapp-emulator/server.js'));
  assert.equal(config.arguments[1], path.resolve(__dirname, '../../app'));
  assert.equal(config.options.env.EMULATOR_HOST, '127.0.0.1');
  assert.equal(config.options.env.EMULATOR_ALLOWED_DOMAINS, '');
  assert.ok(!fs.existsSync(path.resolve(__dirname, '../../tools/emulator')));
});

test('Zentraler AppRunner lädt MischWerk und misst zwei signierte Wünsche bei einem physischen Port', async t => {
  const f = create(t); await until(() => f.posts[0]?.complete);
  assert.deepEqual(f.runner.getRegisteredCommands().sort(), ['mw', 'settopic', 'update']);
  f.runner.userJoin('Polaroid', 'Unknown', 30, {}, 'Browser', false);
  const radio = [...f.runner.sessions.values()].find(session => session._viewModeName === 'Headerbar'); assert.ok(radio);
  const start = performance.now();
  f.runner.handleClientEvent('Polaroid', radio._sessionId, 'mw:wish.submit', { submissionId: 'shared-one', text: 'Lokaler Prüfwunsch eins' });
  assert.equal(f.posts.length, 2, 'Erste Abgabe wartet nicht auf den Regeltakt');
  f.runner.handleClientEvent('Polaroid', radio._sessionId, 'mw:wish.submit', { submissionId: 'shared-two', text: 'Lokaler Prüfwunsch zwei' });
  assert.equal(f.posts.length, 2, 'Zweite Abgabe belegt keinen parallelen Port');
  await until(() => f.events.filter(row => row.type === 'mw:wish.receipt' && row.data.accepted).length === 2);
  assert.equal(f.posts.length, 3); assert.equal(f.maximumPhysical(), 1);
  const accepted = f.events.filter(row => row.type === 'mw:wish.receipt' && row.data.accepted);
  assert.ok(f.posts[1].at - start < 500); assert.ok(f.posts[2].at - start < 1000);
  console.log('Lokale Modellmessung mit echtem zentralem AppRunner und 20-ms-Antwortattrappe: ' + JSON.stringify({
    firstPostMs: +(f.posts[1].at - start).toFixed(2), secondPostMs: +(f.posts[2].at - start).toFixed(2),
    firstReceiptMs: +(accepted[0].at - start).toFixed(2), secondReceiptMs: +(accepted[1].at - start).toFixed(2), maximumPhysical: f.maximumPhysical()
  }));
  const before = f.posts.length;
  f.runner.handleClientEvent('Polaroid', radio._sessionId, 'mw:wish.submit', { submissionId: 'shared-one', text: 'Lokaler Prüfwunsch eins' });
  assert.equal(f.posts.length, before, 'Wiederholung erzeugt keine zweite Einreichung');
  f.runner.handleChatCommand('Polaroid', 'mw', 'admin');
  const admin = [...f.runner.sessions.values()].find(session => session._viewModeName === 'Overlay'); assert.ok(admin);
  f.runner.handleClientEvent('Polaroid', admin._sessionId, 'mw:androidSettings.status', {});
  const state = f.events.findLast(row => row.type === 'mw:androidSettings.status').data.state;
  assert.equal(state.sourcePreflight.sourceNamespace, f.posts[0].body.transportId);
  assert.equal(f.posts.length, before, 'Private Vorprüfung sendet keinen zusätzlichen HTTP-Auftrag');
});

test('Zentrale Emulatoroberfläche öffnet echte Radio- und Verwaltungsframes ohne externes Netz', async t => {
  const { spawn } = require('node:child_process');
  const { chromium } = require('playwright');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Shared-UI-'));
  const configuration = launchConfiguration({ ...process.env, EMULATOR_SKIP_LOCAL_DELIVERY: '1',
    EMULATOR_RUNTIME_DATA_ROOT: directory, EMULATOR_REPORTS_DIR: directory, MISCHWERK_TEST_UPLOAD: app });
  const child = spawn(configuration.executable, configuration.arguments, { ...configuration.options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', browser;
  child.stdout.on('data', data => { output += data.toString(); }); child.stderr.on('data', data => { output += data.toString(); });
  t.after(async () => {
    await browser?.close();
    if (child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
    assert.ok(directory.startsWith(os.tmpdir() + path.sep)); fs.rmSync(directory, { recursive: true, force: true });
  });
  await until(() => /Emulator-UI: http:\/\/127\.0\.0\.1:\d+/.test(output));
  const origin = output.match(/Emulator-UI: (http:\/\/127\.0\.0\.1:\d+)/)[1];
  browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin); await page.locator('#nick-input').fill('Polaroid'); await page.locator('#app-manager-checkbox').uncheck();
  await page.locator('#join-btn').click();
  async function frame(id) {
    const start = performance.now();
    while (performance.now() - start < 15000) {
      for (const item of page.frames()) if (await item.locator('#' + id).count()) {
        await item.locator('html.mw-ready').waitFor(); return item;
      }
      await page.waitForTimeout(50);
    }
    assert.fail('Native Appansicht fehlt: ' + id);
  }
  const radio = await frame('play-button'); assert.equal(await radio.locator('#studio-tab').count(), 0);
  await page.locator('#chat-input').fill('/mw admin'); await page.locator('#chat-input').press('Enter');
  const admin = await frame('team-panel'); await admin.locator('#team-connection-tab').click();
  await admin.locator('.connection-secret summary').filter({ hasText: 'Originalbestand übertragen' }).click();
  await admin.waitForFunction(() => document.getElementById('migration-source').value === 'Quellenkennung noch nicht vorhanden');
  assert.match(await admin.locator('#migration-source-info').textContent(), /Build 448/);
  assert.deepEqual(errors, []);
});

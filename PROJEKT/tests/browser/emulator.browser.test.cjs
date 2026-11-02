const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
test.after(async () => { await browser?.close(); });
async function setup(t, faults = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Browser-'));
  const instance = await createEmulator({ port: 0, dataDir: directory });
  Object.assign(instance.hub.faults, faults);
  if (faults.provider) instance.hub.restart(false);
  const context = await browser.newContext({ viewport: { width: 1800, height: 1000 } });
  const errors = [], external = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === instance.origin) return route.continue();
    external.push(route.request().url()); return route.abort();
  });
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  t.after(async () => {
    await context.close(); await instance.close();
    assert.ok(path.basename(directory).startsWith('MischWerk-Emulator-Browser-')); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function join(nick = 'Otterchen', client = 'k3', width = 1280) {
    const page = await context.newPage(); await page.goto(instance.origin + '/?nick=' + encodeURIComponent(nick));
    await page.waitForFunction(() => window.EmulatorLab?.state.appVersion);
    await page.locator('#persona').selectOption(nick);
    await page.locator('#client').selectOption(client);
    await page.locator('#width').fill(String(width)); await page.locator('#width').dispatchEvent('change');
    await page.locator('#join').click();
    const radio = await view(page, 'Headerbar');
    return { page, radio };
  }
  return { ...instance, context, join, errors, external };
}
async function view(page, mode) {
  const selector = mode === 'Headerbar' ? '#headerbars iframe[src]' : mode === 'Overlay' ? '#overlays iframe[src]' : '#popups iframe[src]';
  const handle = await page.waitForSelector(selector);
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
  return frame;
}
async function send(page, value) { await page.evaluate(value => window.EmulatorLab.send(value), value); }
test('Parserstart zeigt alle Besitzeraktionen und korrekte Client-/Cacheverträge', async t => {
  const lab = await setup(t), { page, radio } = await lab.join();
  assert.equal(await radio.locator('#studio-tab').isVisible(), true);
  assert.equal(await radio.locator('#team-tab').isVisible(), true);
  assert.deepEqual(await radio.evaluate(() => [Client.isK3Client(), Client.getHostFrame().getAppViewMode(),
    Client.getCacheInvalidationId() === Client.getCacheInvalidationId()]), [true, 'HEADERBAR', true]);
  assert.ok(await radio.evaluate(() => Array.from(document.scripts).filter(script => script.src.includes('/app/')).every(script => new URL(script.src).searchParams.has('v'))));
  await page.locator('#inspect').click();
  await page.waitForFunction(() => window.EmulatorLab.trace.some(item => item.kind === 'layout' && item.ready));
  assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});
test('Zwei echte Nutzer: natives Overlay, Entwurf, doppeltes Senden und Erledigt bis zum Nachrücken', async t => {
  const lab = await setup(t), owner = await lab.join();
  await owner.radio.locator('#curtain-toggle').click();
  await owner.radio.locator('#curtain-toggle-label').filter({ hasText: 'Vorhang schließen' }).waitFor();
  const listener = await lab.join('Testhoerer');
  const before = await listener.page.locator('#channel').boundingBox();
  await listener.radio.locator('#open-wishes').click();
  let surface = await view(listener.page, 'Overlay');
  assert.equal((await listener.page.locator('#channel').boundingBox()).y, before.y);
  assert.equal(await listener.radio.evaluate(() => innerHeight), 160);
  assert.equal(await surface.evaluate(() => Client.getHostFrame().getAppViewMode()), 'OVERLAY');
  await surface.locator('#wish-text').fill('a-ha – Take On Me');
  await surface.locator('#close-wishes').click();
  await listener.page.locator('#overlays iframe').waitFor({ state: 'detached' });
  await listener.radio.locator('#open-wishes').click(); surface = await view(listener.page, 'Overlay');
  assert.equal(await surface.locator('#wish-text').inputValue(), 'a-ha – Take On Me');
  await send(listener.page, { type: 'faults', value: { duplicateNext: true } });
  await listener.page.waitForFunction(() => window.EmulatorLab.state.faults.duplicateNext === true);
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: 'an die Moderation gesendet' }).waitFor();
  await surface.locator('.wish-position-value').filter({ hasText: 'Platz 1' }).waitFor();
  await owner.radio.locator('#studio-tab').click(); const studio = await view(owner.page, 'Popup');
  const queueTab = studio.locator('#studio-queue-tab');
  if (await queueTab.isVisible()) await queueTab.click();
  await studio.locator('.request-text').filter({ hasText: 'Take On Me' }).waitFor();
  assert.match(await studio.locator('.request-sender').innerText(), /Testhoerer/);
  assert.equal(await studio.locator('#queue-count').innerText(), '1');
  await studio.locator('[data-outcome=done]').click();
  await studio.locator('#queue-count').filter({ hasText: '0' }).waitFor();
  await surface.locator('#wish-positions-list .wish-position-value').waitFor({ state: 'hidden' });
  assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});
test('Verlorene Quittung: Timeout und Wiederholung behalten dieselbe submissionId', async t => {
  const lab = await setup(t), { page, radio } = await lab.join('Polaroid');
  await send(page, { type: 'faults', value: { dropServer: 1, dropServerType: 'mw:wish.receipt' } });
  await page.waitForFunction(() => window.EmulatorLab.state.faults.dropServer === 1);
  await radio.locator('#open-wishes').click(); const surface = await view(page, 'Overlay');
  await surface.locator('#wish-text').fill('Testinterpret – Verlorene Quittung');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: /bestätigt|Verbindung|erneut|Rückmeldung/ }).waitFor({ timeout: 20000 });
  await surface.locator('#submit-wish:not([disabled])').waitFor();
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: /an die Moderation gesendet/ }).waitFor();
  const submissions = lab.hub.trace.filter(item => item.kind === 'clientEvent' && item.eventType === 'mw:wish.submit');
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0].eventData.submissionId, submissions[1].eventData.submissionId);
  const record = lab.hub.runtime.users.find('Polaroid'), radioId = [...lab.hub.runtime.contents.sessions.keys()].find(id =>
    lab.hub.runtime.contents.describe(id).nick === record.state.nick && lab.hub.runtime.contents.describe(id).mode === 'Headerbar');
  lab.hub.runtime.event('Polaroid', radioId, 'mw:refresh', {});
  assert.equal(lab.hub.trace.findLast(item => item.eventType === 'mw:state' && item.nick === 'Polaroid').eventData.wishPositions.total, 1);
});
test('320 und 2290 Pixel sind tatsächliche Framebreiten, Overlay verändert den Channelbeginn nicht', async t => {
  const lab = await setup(t), { page, radio } = await lab.join('Polaroid', 'k3', 320);
  assert.equal(await radio.evaluate(() => innerWidth), 320);
  await radio.locator('#open-wishes').click(); const surface = await view(page, 'Overlay');
  assert.ok(await surface.locator('#submit-wish').isVisible());
  assert.equal(await radio.evaluate(() => innerHeight), 160);
  await page.locator('#width').fill('2290'); await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(() => innerWidth === 2290);
  assert.equal(await radio.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#inspect').click();
  assert.deepEqual(lab.errors, []);
});
test('Hostgrößen verkleinern Popuprahmen und Inhalt gemeinsam; verzögerte Antworten bleiben konsistent', async t => {
  const lab = await setup(t, { hostSizing: 'stepped' }), { page, radio } = await lab.join('Otterchen', 'stapp');
  await radio.locator('#team-tab').click(); const team = await view(page, 'Popup');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].some(entry => entry.mode === 'Popup' && entry.height !== 560));
  const initialHeight = await team.evaluate(() => innerHeight);
  await team.locator('#team-status-tab').click();
  await team.waitForFunction(previous => innerHeight < previous, initialHeight);
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Popup').every(entry =>
    Math.abs(entry.element.getBoundingClientRect().height - entry.iframe.getBoundingClientRect().height - 30) < 2));
  assert.equal(await page.evaluate(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Popup').every(entry =>
    entry.element.getBoundingClientRect().bottom <= document.querySelector('#stage').getBoundingClientRect().bottom)), true);
  assert.equal(await team.evaluate(() => Client.getHostFrame().getAppViewMode()), 'POPUP');
  assert.equal(await radio.evaluate(() => Client.isK3Client()), false);
  await team.locator('#team-members-tab').click();
  await team.locator('#radio-moderator-nick').fill('DJ-Test');
  await team.locator('#radio-moderator-form button[type=submit]').click();
  await team.locator('#radio-moderator-list').filter({ hasText: 'DJ-Test' }).waitFor();
  assert.deepEqual(lab.errors, []);
});
test('Fehlende Overlayfähigkeit erhält die Radioleiste und erklärt die Ablehnung', async t => {
  const lab = await setup(t), { page, radio } = await lab.join('Polaroid');
  await page.locator('#no-overlay').check();
  await page.waitForFunction(() => window.EmulatorLab.state.users.find(user => user.nick === 'Polaroid').capabilities.Overlay === false);
  await radio.locator('#open-wishes').click();
  await radio.locator('#notice').filter({ hasText: /nicht öffnen/ }).waitFor();
  assert.equal(await page.locator('#overlays iframe').count(), 0);
  assert.equal(await radio.evaluate(() => document.documentElement.classList.contains('mw-ready')), true);
});
test('Synthetischer Anbieter nutzt nur lokale Antworten und echtes HTML-Audio nach Play', async t => {
  const lab = await setup(t, { provider: 'online' }), { radio } = await lab.join();
  await radio.locator('#track-title').filter({ hasText: 'Lokaler Testtitel' }).waitFor();
  await radio.locator('#listener-value').filter({ hasText: '17' }).waitFor();
  assert.equal(await radio.locator('#radio-audio').getAttribute('src'), null);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(() => document.querySelector('#radio-audio').paused === false);
  assert.ok(await radio.locator('#radio-audio').evaluate(audio => audio.volume <= .1));
  assert.ok(await radio.locator('#radio-audio').evaluate(audio => new URL(audio.currentSrc).origin === location.origin));
  assert.deepEqual(lab.external, []); assert.deepEqual(lab.errors, []);
});
for (const scenario of ['stopped', 'http-error', 'invalid']) {
  test('Anbieterfall ' + scenario + ' verwechselt unbekannte Daten nicht mit bestätigtem Stopp', async t => {
    const lab = await setup(t, { provider: scenario }), { radio } = await lab.join();
    if (scenario === 'stopped') {
      await radio.locator('#play-button:disabled').waitFor();
      await radio.locator('#play-button').filter({ hasText: '' }).waitFor();
      assert.match(await radio.locator('#play-button').getAttribute('title'), /pause|gestoppt/i);
    } else {
      await radio.locator('#play-button:not([disabled])').waitFor();
      await radio.locator('#listener-count[aria-label*="nicht verfügbar"]').waitFor();
    }
    assert.equal(await radio.locator('#radio-audio').getAttribute('src'), null);
    assert.deepEqual(lab.external, []); assert.deepEqual(lab.errors, []);
  });
}
test('Parsermodus meldet verspätete Einbindung; fehlendes Modul verhindert falsches Grün', async t => {
  const lab = await setup(t), { page, radio } = await lab.join();
  assert.match(await radio.evaluate(() => { try { Client.includeJS('js/start.js'); return ''; } catch (error) { return error.message; } }), /während des HTML-Parsens/);
  await send(page, { type: 'faults', value: { resourceFailure: 'js/radio/player.js' } });
  await page.waitForFunction(() => window.EmulatorLab.state.faults.resourceFailure === 'js/radio/player.js');
  const originalFrame = await page.locator('#headerbars iframe').getAttribute('src');
  await send(page, { type: 'command', command: 'mischwerk' });
  await page.waitForFunction(original => document.querySelector('#headerbars iframe')?.getAttribute('src') !== original, originalFrame);
  const handle = await page.waitForSelector('#headerbars iframe[src]'); const failed = await handle.contentFrame();
  await failed.locator('#startup-error').waitFor({ state: 'visible', timeout: 20000 });
  assert.equal(await failed.evaluate(() => document.documentElement.classList.contains('mw-ready')), false);
  assert.ok(lab.hub.trace.some(item => item.kind === 'resourceFailure'));
});
test('Async-Stresstest, langsame Dateien und Rollenwechsel funktionieren ohne simulierte Besitzerfreigabe', async t => {
  const lab = await setup(t, { loader: 'async', resourceDelayMs: 80 });
  const owner = await lab.join();
  await owner.radio.locator('#curtain-toggle').click();
  await owner.radio.locator('#curtain-toggle-label').filter({ hasText: 'Vorhang schließen' }).waitFor();
  const { page, radio } = await lab.join('AppManager');
  assert.equal(await radio.locator('#studio-tab').isVisible(), false);
  assert.equal(await radio.locator('#team-tab').isVisible(), false);
  await page.locator('#role').selectOption('owner'); await page.locator('#apply-role').click();
  await radio.locator('#team-tab:not([hidden])').waitFor();
  assert.deepEqual(lab.errors, []);
});

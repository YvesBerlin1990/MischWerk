// Reset des nativen Sendeplans mit dem integrierten Emulator und echten Appdateien.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
const app = process.env.MISCHWERK_TEST_UPLOAD || path.resolve(__dirname, '../../app');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
test.after(async () => { await browser?.close(); });
for (const client of ['k3', 'stapp']) test('Sendeplan bleibt in '+client+' für Inhaber und Hörer ohne Overlay; Radio läuft weiter', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Schedule-Reset-'));
  const instance = await createEmulator({ port: 0, dataDir: directory, appDir: app });
  instance.hub.faults.provider = 'online'; instance.hub.restart(false);
  const context = await browser.newContext({ viewport: { width: 1800, height: 1000 } });
  const errors = [], requests = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route('**/*', route => {
    requests.push(route.request().url());
    return new URL(route.request().url()).origin === instance.origin ? route.continue() : route.abort();
  });
  t.after(async () => {
    await context.close(); await instance.close();
    assert.ok(path.basename(directory).startsWith('MischWerk-Schedule-Reset-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const nick of ['Otterchen', 'Testhoerer']) {
    const page = await context.newPage();
    await page.goto(instance.origin+'/?nick='+encodeURIComponent(nick));
    await page.waitForFunction(() => window.EmulatorLab?.state.appVersion);
    await page.locator('#persona').selectOption(nick); await page.locator('#client').selectOption(client);
    await page.locator('#join').click();
    const radio = await (await page.waitForSelector('#headerbars iframe[src]')).contentFrame();
    await radio.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
    const button = radio.locator('#open-schedule');
    const openings = () => instance.hub.trace.filter(e => e.kind === 'clientEvent' && e.eventType === 'mw:openSchedule').length;
    const previousOpenings = openings();
    assert.equal(await button.isVisible(), true); assert.equal(await button.isDisabled(), true);
    assert.equal(await button.getAttribute('aria-disabled'), 'true'); assert.equal(await button.getAttribute('aria-haspopup'), null);
    assert.equal(await radio.locator('#schedule-button-caption').textContent(), 'In Kürze');
    assert.equal(await radio.locator('#schedule-button-caption').isVisible(), true);
    await button.evaluate(node => { node.click(); node.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await radio.locator('#mute-button').focus(); await button.focus();
    assert.equal(await button.evaluate(node => node === document.activeElement), false);
    await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    assert.equal(openings(), previousOpenings);
    assert.equal(await page.locator('#overlays iframe').count(), 0);
    if (nick === 'Otterchen') {
      instance.hub.runtime.command('Otterchen', 'vorhang', 'öffnen');
      await radio.locator('#play-button:not([disabled])').click();
      await radio.waitForFunction(() => !document.getElementById('radio-audio').paused);
      await radio.evaluate(() => { window.__resetAudio = document.getElementById('radio-audio'); });
      await radio.locator('#studio-tab').click();
      const frame = await (await page.waitForSelector('#overlays iframe[src]')).contentFrame();
      await frame.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
      await frame.locator('#studio-topic').fill('Entwurf bleibt beim Reset');
      const source = await page.locator('#overlays iframe').getAttribute('src');
      await radio.evaluate(() => Client.sendEvent('mw:openSchedule', { requestId: 'legacy-reset' }));
      await page.waitForFunction(() => EmulatorLab.trace.some(e => e.kind === 'sessionEvent' && e.eventType === 'mw:result' && e.eventData.requestId === 'legacy-reset' && e.eventData.ok === false));
      assert.equal(await page.locator('#overlays iframe').getAttribute('src'), source);
      assert.equal(await frame.locator('#studio-topic').inputValue(), 'Entwurf bleibt beim Reset');
      await radio.locator('#track-title').filter({ hasText: 'Lokaler Testtitel' }).waitFor();
      assert.equal(await radio.evaluate(() => __resetAudio === document.getElementById('radio-audio') && !__resetAudio.paused && !__resetAudio.error), true);
    }
  }
  assert.equal(instance.hub.trace.some(e => e.kind === 'clientEvent' && /^mw:schedule\./.test(e.eventType)), false);
  assert.equal(requests.some(url => /\/(?:js|css)\/schedule\//.test(url)), false);
  assert.deepEqual(errors, []);
});
test('Alte direkte Sendeplanseite startet weder Radio noch Provider oder Overlaycontroller', async t => {
  const context = await browser.newContext(); t.after(() => context.close());
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__includes = [];
    window.Client = { pageData: { view: 'schedule' }, includeJS: file => __includes.push(file), includeCSS: file => __includes.push(file) };
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url()); requests.push(url.href);
    const file = path.resolve(app, 'www', '.'+url.pathname);
    assert.ok(file.startsWith(path.resolve(app, 'www')+path.sep));
    return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
  });
  await page.goto('http://reset.mischwerk.invalid/index.html');
  assert.equal(await page.locator('html').getAttribute('data-view'), 'removed');
  await page.locator('#startup-error').filter({ hasText: 'Sendeplan wird neu gestaltet' }).waitFor();
  assert.equal(await page.locator('.dialog-shell').isVisible(), false);
  assert.equal(await page.locator('#schedule-panel').count(), 0);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), null);
  assert.deepEqual(await page.evaluate(() => __includes), []);
  assert.equal(requests.some(url => /spcast|streampanel|current-song|\/js\//i.test(url)), false);
  assert.deepEqual(errors, []);
});
test('Ausgelieferte App enthält keine alte Sendeplanoberfläche; Website besitzt ihren Datumshelfer selbst', () => {
  for (const name of ['calendar','markup','controller','editor','view','pages','window']) assert.equal(fs.existsSync(path.join(app, 'www/js/schedule', name+'.js')), false);
  for (const name of ['schedule','schedule-options']) assert.equal(fs.existsSync(path.join(app, 'www/css/schedule', name+'.css')), false);
  const root = path.resolve(__dirname, '../..');
  assert.ok(fs.existsSync(path.join(root, 'website/public/js/site/calendar.js')));
  assert.match(fs.readFileSync(path.join(root, 'website/public/index.html'),'utf8'), /src="\/calendar\.js"/);
  const { frontendFilesForView } = require('../../tools/lib/frontend-files.cjs');
  assert.throws(() => frontendFilesForView('schedule'), /nicht verfügbar/);
});

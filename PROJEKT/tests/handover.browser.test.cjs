// Vollständige Übergabe zwischen zwei Browserfenstern am echten lokalen Backend.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createHarness } = require('../tools/knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
async function setup(t, width = 780, longNames = false) {
  const h = createHarness(), owner = h.user(1, longNames ? 'O'.repeat(50) : 'Otterchen', 'owner'), next = h.user(2, longNames ? 'D'.repeat(50) : 'Nächster DJ');
  const radio = h.open(owner); h.event(owner, radio, 'mw:addRadioModerator', { nick: next.nick });
  h.event(owner, radio, 'mw:onAir'); h.event(owner, radio, 'mw:setTopic', { topic: 'Bisherige Sendung' });
  const context = await browser.newContext({ viewport: { width, height: 740 } });
  t.after(() => context.close());
  const records = [], errors = [];
  let delivery = Promise.resolve();
  async function flush() {
    const updates = records.map(record => ({ page: record.page, events: record.session.events.splice(0) }));
    for (const update of updates) {
      if (update.page && !update.page.isClosed()) {
        await update.page.evaluate(events => { for (const event of events) { window.__emit(event.type, event.data); } }, update.events);
      }
    }
  }
  await context.exposeBinding('__server', ({ page }, type, data) => {
    delivery = delivery.then(async () => {
      const record = records.find(item => item.page === page);
      h.event(record.user, record.session, type, data); await flush();
    });
    return delivery;
  });
  await context.route('http://mischwerk.test/**', async route => {
    const relative = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    const file = path.resolve(root, 'app/www', relative);
    if (!file.startsWith(path.join(root, 'app/www') + path.sep) || !fs.existsSync(file)) { return route.fulfill({ status: 404 }); }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(file) });
  });
  for (const user of [owner, next]) {
    const header = user === owner ? radio : h.open(user);
    h.event(user, header, 'mw:openStudio');
    const session = user.sessions.find(item => item.content.viewMode === 'Popup');
    const state = h.state(user, session); state.view = 'studio'; state.station.configured = false;
    const page = await context.newPage(); records.push({ page, session, user });
    for (const record of records) { record.session.events = []; }
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(state => {
      window.__handlers = {}; window.__sent = [];
      window.__emit = (type, data) => (window.__handlers[type] || []).forEach(callback => callback({ type, data }));
      window.Client = {
        pageData: state, isK3Client: () => true,
        getHostFrame: () => ({ setTitle() {}, setResizable() {} }),
        includeJS(file) { const node = document.createElement('script'); node.src = file; document.head.appendChild(node); },
        includeCSS(file) { const node = document.createElement('link'); node.rel = 'stylesheet'; node.href = file; document.head.appendChild(node); },
        addEventListener(type, callback) { (window.__handlers[type] || (window.__handlers[type] = [])).push(callback); },
        sendEvent(type, data) { window.__sent.push({ type, data }); window.__server(type, data); }
      };
      HTMLMediaElement.prototype.load = function () {};
      HTMLMediaElement.prototype.pause = function () {};
    }, state);
    await page.goto('http://mischwerk.test/');
    await page.waitForFunction(() => window.__sent.some(event => event.type === 'mw:ready'));
    await page.locator('#studio-panel').waitFor();
  }
  return { h, owner, next, source: records[0].page, target: records[1].page, records, flush, errors };
}
async function fits(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  for (const button of await page.locator('#handover-panel button:visible').all()) {
    await button.scrollIntoViewIfNeeded();
    assert.equal(await button.evaluate(node => { const b = node.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }), true);
  }
}
async function request(source, target) {
  await source.locator('#handover-open').click();
  await source.locator('#handover-target').selectOption({ index: 0 });
  await source.locator('#handover-request').click();
  await source.locator('#handover-cancel').waitFor();
  await target.locator('#handover-open').filter({ hasText: 'Übergabe ansehen' }).waitFor();
  await target.locator('#handover-open').click();
  await target.locator('#handover-accept').waitFor();
}

test('Bestätigte Übergabe im Browser: Auswahl, Warten, Annahme mit Thema und genau eine gemeinsame Botansage', async t => {
  const { h, source, target, errors } = await setup(t);
  assert.equal(await target.locator('#on-air').isDisabled(), true);
  await request(source, target);
  await fits(source); await fits(target);
  assert.equal(h.bot.messages.length, 1);
  await target.locator('#handover-topic').fill('Die nächste Sendung');
  if (process.env.MISCHWERK_CAPTURE_HANDOVER) {
    const folder = path.join(root, 'docs/pruefung/bilder/studio'); fs.mkdirSync(folder, { recursive: true });
    await source.screenshot({ path: path.join(folder, 'Uebergabe-Warten.png') });
    await target.screenshot({ path: path.join(folder, 'Uebergabe-Annehmen.png') });
  }
  await target.locator('#handover-accept').click();
  await target.locator('#on-air').filter({ hasText: 'Anmeldung verlängern' }).waitFor();
  await source.locator('#studio-host').filter({ hasText: 'Nächster DJ ist am Mikrofon' }).waitFor();
  assert.equal(await target.locator('#studio-topic').inputValue(), 'Die nächste Sendung');
  assert.equal(await target.locator('#handover-panel').isVisible(), false);
  assert.equal(h.bot.messages.at(-1), '🎙️ Otterchen macht Platz im Studio – Nächster DJ ist jetzt live ON AIR bei Radio MischWerk!');
  assert.equal(h.bot.messages.length, 2); assert.deepEqual(errors, []);
});

test('Schmale Übergabe erhält Themenentwurf bei Fehler und Refresh; Abbrechen lässt alte Pakete nicht wieder aufleben', async t => {
  const { h, source, target, owner, records, flush, errors } = await setup(t, 320);
  await request(source, target);
  await fits(source); await fits(target);
  await target.locator('#handover-topic').fill('Mein erhaltenes Thema');
  const save = h.store.setObject; h.store.setObject = () => { throw new Error('storage-failed'); };
  await target.locator('#handover-accept').click();
  await target.locator('#notice.error').waitFor();
  assert.equal(await target.locator('#handover-topic').inputValue(), 'Mein erhaltenes Thema');
  const old = h.state(records[1].user, records[1].session); await flush();
  assert.equal(await target.locator('#handover-topic').inputValue(), 'Mein erhaltenes Thema');
  assert.equal(h.state(owner, records[0].session).moderator.nick, owner.nick); await flush();
  await fits(target);
  h.store.setObject = save;
  await source.locator('#handover-cancel').click();
  await target.locator('#handover-panel').waitFor({ state: 'hidden' });
  await target.evaluate(state => window.__emit('mw:state', state), old);
  assert.equal(await target.locator('#handover-open').isVisible(), false);
  assert.equal(h.bot.messages.length, 1); assert.deepEqual(errors, []);
});

test('Ablehnen beendet nur die Anfrage; 320px-Studio bleibt mit Übergabeaktion und maximalem Nick bedienbar', async t => {
  const { h, source, target, errors } = await setup(t, 320, true);
  await request(source, target);
  await target.locator('#handover-decline').click();
  await target.locator('#handover-panel').waitFor({ state: 'hidden' });
  await source.locator('#handover-request-form').waitFor();
  await fits(source); await fits(target);
  assert.equal(h.bot.messages.length, 1);
  assert.equal(await source.locator('#on-air').isVisible(), false, 'Übergabebereich bleibt getrennt vom Studio');
  await source.locator('#handover-back').click();
  await source.locator('#on-air').waitFor(); await fits(source);
  assert.deepEqual(errors, []);
});

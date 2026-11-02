// Lesender Nachweis der Statuszentrale am eigenen öffentlichen Sender, ohne Audiostart.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createHarness } = require('./knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/pruefung/radioking');
const report = { checkedAt: new Date().toISOString(), version: require('../package.json').version,
  scope: 'Own public MischWerk RadioKing endpoints in production Statuszentrale; Knuddels bridge mocked. No audio, encoder control or deployment.',
  references: ['https://player.radioking.io/mischwerk/app.bundle.js', 'https://status.radioking.com/'],
  responses: [], errors: [] };
async function main() {
  const h = createHarness(), user = h.user(1, 'Lokale Statusprüfung', 'owner');
  const state = { ...h.state(user, h.open(user)), view: 'team' };
  assert.equal(state.station.radioId, 'mischwerk');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 560, height: 560 } });
    page.on('pageerror', error => report.errors.push(error.message));
    const responses = [];
    page.on('response', response => {
      if (!response.url().startsWith('https://api.radioking.io/widget/radio/mischwerk')) return;
      responses.push((async () => {
        const headers = response.headers();
        report.responses.push({ url: response.url(), status: response.status(),
          cors: headers['access-control-allow-origin'], cache: headers['cache-control'], body: await response.json() });
      })());
    });
    await page.addInitScript(state => {
      window.__sent = []; window.__sizes = [];
      window.Client = { pageData: state, isK3Client: () => true,
        includeCSS(file) { const n = document.createElement('link'); n.rel = 'stylesheet'; n.href = file; document.head.appendChild(n); },
        includeJS(file) { const n = document.createElement('script'); n.src = file; document.head.appendChild(n); },
        addEventListener() {}, sendEvent(type) { window.__sent.push(type); },
        getHostFrame() { return { setTitle() {}, setResizable() {}, setSize(...size) { window.__sizes.push(size); } }; } };
    }, state);
    await page.route('http://mischwerk-status.test/**', route => {
      const file = path.resolve(root, 'app/www', new URL(route.request().url()).pathname.slice(1) || 'index.html');
      assert.ok(file.startsWith(path.join(root, 'app/www') + path.sep));
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
      return route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(file) });
    });
    await page.goto('http://mischwerk-status.test/');
    await page.locator('#team-status-tab').click();
    await page.waitForFunction(() => !document.getElementById('refresh-status').disabled &&
      document.getElementById('status-transmission-value').textContent !== 'Prüfe …');
    await Promise.all(responses);
    const info = report.responses.find(r => r.url.endsWith('/mischwerk'));
    const song = report.responses.find(r => r.url.endsWith('/track/current'));
    const listeners = report.responses.find(r => r.url.endsWith('/listener'));
    assert.equal(info.status, 200); assert.equal(info.body.slug, 'mischwerk');
    assert.equal(listeners.status, 200); assert.equal(listeners.cors, '*');
    report.displayed = await page.evaluate(() => Object.fromEntries(['mode','transmission','studio','listeners','metadata','app'].map(n =>
      [n, document.getElementById('status-' + n + '-value').textContent])));
    assert.equal(report.displayed.listeners, listeners.body.listener_count.toLocaleString('de-DE'));
    assert.equal(report.displayed.mode, info.body.stream_status === 'stopped' ? 'Sendepause' :
      info.body.stream_status === 'started' && typeof song?.body.is_live === 'boolean' ? (song.body.is_live ? 'LIVE' : 'AutoDJ') : 'Status unbekannt');
    assert.equal(await page.locator('#radio-audio').getAttribute('src'), null);
    assert.deepEqual(await page.evaluate(() => window.__sizes), []);
    assert.equal(await page.evaluate(() => window.__sent.some(t => /onAir|offAir|setRequests/.test(t))), false);
    assert.deepEqual(report.errors, []);
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'Statuszentrale-RadioKing-aktuell.png'), fullPage: true });
    report.realCrossOrigin = true; report.noAudioStarted = true; report.passed = true;
  } finally { await browser.close(); }
}
main().catch(error => { report.error = error.message; process.exitCode = 1; }).finally(() => {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'statuszentrale-aktuell.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, displayed: report.displayed, error: report.error }));
});

// Lokale Kaltstartmessung mit echten Appdateien, ohne Knuddels-/Anbieterzugriff.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parseArgs } = require('node:util');
const { chromium } = require('playwright');
const { createEmulator } = require('../emulator/server.cjs');
async function measureStartup(appDir, { delay = 0, runs = 3 } = {}) {
  assert.ok(Number.isInteger(delay) && delay >= 0 && delay <= 10000);
  assert.ok(Number.isInteger(runs) && runs > 0 && runs <= 10);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Startmessung-'));
  const lab = await createEmulator({ appDir, port:0, dataDir:directory });
  lab.hub.faults.resourceDelayMs = delay;
  const browser = await chromium.launch({ headless:true, channel:'msedge', args:['--mute-audio'] });
  const results = [];
  try {
    for (const [view, button] of [['wishes','open-wishes'],['studio','studio-tab'],['team','team-tab'],['schedule','open-schedule']]) {
      const samples = [];
      for (let run = 0; run < runs; run++) {
        const context = await browser.newContext({ viewport:{ width:1800, height:1000 } });
        const page = await context.newPage(), errors = [], requests = [];
        await context.route('**/*', route => new URL(route.request().url()).origin === lab.origin ? route.continue() : route.abort());
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(lab.origin);
        await page.waitForFunction(() => window.EmulatorLab?.state.appVersion);
        await page.locator('#join').click();
        const radio = await (await page.waitForSelector('#headerbars iframe[src]')).contentFrame();
        await radio.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
        const network = await context.newCDPSession(page);
        await network.send('Network.enable');
        await network.send('Network.setCacheDisabled', { cacheDisabled:true });
        await network.send('Network.clearBrowserCache');
        page.on('request', request => { if (/\/app\/.*\.(js|css)\?/.test(request.url())) requests.push(request.url()); });
        const started = performance.now();
        await radio.locator('#' + button + ':not([disabled])').click();
        const frame = await (await page.waitForSelector('#overlays iframe[src]')).contentFrame();
        await frame.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
        samples.push({ milliseconds:Math.round(performance.now() - started), js:requests.filter(url => /\.js\?/.test(url)).length,
          css:requests.filter(url => /\.css\?/.test(url)).length });
        assert.deepEqual(errors, []);
        await context.close();
      }
      const sorted = samples.map(item => item.milliseconds).sort((a,b) => a-b);
      results.push({ view, js:samples[0].js, css:samples[0].css, medianMilliseconds:sorted[Math.floor(sorted.length / 2)], samples });
    }
    return { appDir:path.resolve(appDir), delayPerResourceMs:delay, runs,
      model:'Lokaler Parsermodus, Browsercache vor jedem Overlay per CDP geleert; keine native Knuddels-Ladezeit.', results };
  } finally {
    await browser.close(); await lab.close();
    const target = path.resolve(directory), parent = path.resolve(os.tmpdir());
    assert.equal(path.dirname(target), parent);
    assert.ok(path.basename(target).startsWith('MischWerk-Startmessung-'));
    fs.rmSync(target, { recursive:true, force:true });
  }
}
if (require.main === module) {
  const { values } = parseArgs({ options:{ 'app-dir':{type:'string',default:path.resolve(__dirname,'../../app')},
    delay:{type:'string',default:'0'}, runs:{type:'string',default:'3'} } });
  measureStartup(values['app-dir'], { delay:Number(values.delay), runs:Number(values.runs) })
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { measureStartup };

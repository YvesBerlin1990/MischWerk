// Browser-Roundtrip des Sendeplans mit echtem Backend und lokaler API-Brücke.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
async function setup(t, { clock = false, nativeSizing = false } = {}) {
  const child = spawn(process.execPath, ['tools/preview/server.cjs'], { cwd: root, windowsHide: true,
    env: { ...process.env, MISCHWERK_PREVIEW_PORT: '0' } });
  t.after(() => child.kill());
  const base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Preview startup timeout')), 8000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.stdout.on('data', chunk => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
  });
  const context = await browser.newContext({ viewport: { width: 820, height: 660 }, screen: { width: 1920, height: 1080 } });
  t.after(() => context.close());
  const errors = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const owner = await context.newPage(), listener = await context.newPage();
  if(nativeSizing)for(const page of [owner,listener]){
    let queue=Promise.resolve();
    await page.exposeFunction('__applyScheduleSize',height=>{
      queue=queue.then(async()=>{
        const start=page.viewportSize();
        for(const fraction of [.3,.6,1]){
          await page.setViewportSize({width:start.width,height:Math.round(start.height+(height-start.height)*fraction)});
          await new Promise(resolve=>setTimeout(resolve,25));
        }
      });
      return queue;
    });
    await page.route('**/preview-bridge.js',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`
        window.__scheduleSizes=[];
        Object.defineProperty(screen,'availHeight',{configurable:true,get(){return __scheduleSizes.length?innerHeight:1080;}});
        Client.isK3Client=()=>false;
        Client.getHostFrame=()=>({setTitle(){},setResizable(){},setSize(width,height){
          __scheduleSizes.push([width,height]);window.__applyScheduleSize(height).catch(()=>{});
        }});
      `});
    });
  }
  if (clock) { await owner.clock.install(); }
  await owner.goto(base + '/preview?role=moderator&view=schedule');
  await listener.goto(base + '/preview?view=schedule');
  for (const page of [owner, listener]) {
    await page.waitForFunction(() => document.querySelectorAll('.schedule-day').length === 7);
  }
  return { base, context, owner, listener, errors };
}

test('Fensteröffnung: Sendeplan behält seine passende Anfangsgröße ohne nachträgliche Hostanpassung',async t=>{
  const {owner,listener,errors}=await setup(t,{nativeSizing:true});
  for(const page of [owner,listener]){
    await page.waitForTimeout(1300);
    assert.deepEqual(await page.evaluate(()=>__scheduleSizes),[],'Kein Größenbefehl nach dem nativen Öffnen');
    assert.equal(await page.evaluate(()=>innerHeight),660);
    assert.equal(await page.locator('.schedule-day').count(),7,'Auch mit zusätzlichem Vorschauhinweis bleibt die vollständige Woche erhalten');
    await scheduleReachable(page);
  }
  await owner.locator('#schedule-new').click();
  await owner.waitForTimeout(250);
  await owner.locator('#schedule-topic').fill('Mein Entwurf bleibt während der Größenanpassung');
  const sizes=await owner.evaluate(()=>__scheduleSizes.slice());
  await owner.waitForTimeout(1200);
  assert.deepEqual(await owner.evaluate(()=>__scheduleSizes),sizes,'Editor bleibt ohne weitere Größenbefehle stabil');
  assert.equal(await owner.locator('#schedule-topic').inputValue(),'Mein Entwurf bleibt während der Größenanpassung');
  await scheduleReachable(owner);
  assert.deepEqual(errors,[]);
});
test('Leere Sendeplanwoche verteilt den freien Rahmen auf sieben gleichmäßige Tageszeilen',async t=>{
 const {owner,listener,errors}=await setup(t);
 for(const page of [owner,listener])for(const height of [630,800]){
  await page.setViewportSize({width:820,height});await page.waitForTimeout(150);
  const layout=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('.schedule-day')].map(n=>n.getBoundingClientRect());
   return {heights:rows.map(r=>r.height),bottom:innerHeight-rows.at(-1).bottom,
    overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,
    paged:!document.getElementById('schedule-pagination').hidden};
  });
  assert.equal(layout.heights.length,7);assert.equal(layout.paged,false);assert.equal(layout.overflow,false);
  assert.ok(Math.max(...layout.heights)-Math.min(...layout.heights)<1,JSON.stringify(layout));
  assert.ok(layout.heights.every(h=>h>=50),JSON.stringify(layout));
  assert.ok(layout.bottom>=(height<=700?16:24)&&layout.bottom<=(height<=700?17:25),JSON.stringify(layout));
 }
 await owner.locator('#schedule-new').click();await owner.locator('#schedule-topic').fill('Mein Wochenentwurf');
 assert.equal(await owner.locator('body').evaluate(n=>getComputedStyle(n).display),'block','Editor erhält seine natürliche Anordnung');
 await owner.locator('#schedule-cancel').click();
 await owner.waitForTimeout(150);assert.equal(await owner.locator('.schedule-day').count(),7);
 assert.deepEqual(errors,[]);
});

async function newShow(page, topic = '80er und 90er') {
  await page.locator('#schedule-new').click();
  await page.locator('#schedule-topic').fill(topic);
  await page.locator('#schedule-save').click();
  await page.waitForFunction(() => document.getElementById('schedule-form').hidden);
  await page.locator('.schedule-topic').filter({ hasText: topic }).waitFor();
}
async function scheduleCall(page, type, values = {}) {
  return page.evaluate(async ({ type, values }) => {
    const response = await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: window.MischWerkDemoData.sessionId, type,
        data: { requestId: 'window-' + crypto.randomUUID(), ...values } }) });
    return response.json();
  }, { type, values });
}
async function scheduleReachable(page) {
  const result = await page.evaluate(() => {
    const shell = document.querySelector('.dialog-shell').getBoundingClientRect();
    const rows = [...document.querySelectorAll('.schedule-show,.schedule-day-label,#schedule-pagination')]
      .filter(node => node.getClientRects().length).map(node => node.getBoundingClientRect());
    return { horizontal: document.documentElement.scrollWidth > innerWidth,
      vertical: document.documentElement.scrollHeight > innerHeight,
      shellFits: shell.bottom <= innerHeight + 1,
      rowsFit: rows.every(box => box.top >= 0 && box.bottom <= innerHeight + 1),
      listOverflow: getComputedStyle(document.getElementById('schedule-days')).overflowY };
  });
  assert.equal(result.horizontal, false);
  assert.equal(result.listOverflow, 'visible');
  // Bei tatsächlich kleineren Hostgrenzen bleiben Eingaben nativ erreichbar.
  for (const control of await page.locator('#schedule-form input:visible,#schedule-form button:visible').all()) {
    await control.scrollIntoViewIfNeeded();
    assert.ok(await control.evaluate(node=>{const box=node.getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight+1;}));
  }
}

test('Sendeoptionen: AutoDJ ganztags speichern und bearbeiten; Open End begrenzt die freien Planzeiten', async t => {
  const { owner, listener, errors } = await setup(t);
  assert.equal(await owner.locator('.schedule-empty').count(), 7);
  assert.match(await owner.locator('.schedule-empty').first().innerText(), /Ganztags.*AutoDJ.*MischWerk/);
  await owner.locator('#schedule-new').click();
  assert.equal(await owner.locator('#schedule-kind').count(), 1);
  await owner.locator('#schedule-kind').selectOption('autodj');
  assert.equal(await owner.locator('#schedule-nick').inputValue(), 'MischWerk');
  assert.equal(await owner.locator('#schedule-nick').getAttribute('readonly'), '');
  await owner.locator('#schedule-timing').selectOption('allDay');
  assert.equal(await owner.locator('#schedule-start').isVisible(), false);
  assert.equal(await owner.locator('#schedule-end').isVisible(), false);
  await owner.locator('#schedule-save').click();
  await owner.locator('#schedule-form').waitFor({state:'hidden'});
  await owner.locator('.schedule-show:visible .schedule-edit').first().click();
  assert.equal(await owner.locator('#schedule-kind').inputValue(), 'autodj');
  assert.equal(await owner.locator('#schedule-timing').inputValue(), 'allDay');
  await owner.locator('#schedule-kind').selectOption('live');
  await owner.locator('#schedule-nick').fill('Testleitung');
  await owner.locator('#schedule-timing').selectOption('openEnd');
  await owner.locator('#schedule-start').fill('18:00');
  await owner.locator('#schedule-topic').fill('Abend ohne feste Endzeit');
  const date = await owner.locator('#schedule-date').inputValue();
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(() => !document.getElementById('schedule-refresh').disabled);
  assert.equal(await owner.locator('#schedule-timing').inputValue(), 'openEnd');
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Abend ohne feste Endzeit');
  await owner.locator('#schedule-save').click();
  await owner.locator('#schedule-form').waitFor({state:'hidden'});
  const row = owner.locator('.schedule-show').filter({hasText:'Abend ohne feste Endzeit'}).first();
  assert.match(await row.innerText(), /18:00.*Open End/);
  await listener.locator('#schedule-refresh').click();
  await listener.locator('.schedule-topic').filter({hasText:'Abend ohne feste Endzeit'}).first().waitFor({state:'attached'});
  assert.equal(await listener.locator('.schedule-edit').count(), 0);
  const day = owner.locator('.schedule-day[data-schedule-date="'+date+'"]');
  assert.match(await day.locator('.schedule-autodj-gap').first().innerText(), /00:00.*18:00.*AutoDJ/);
  assert.equal(await day.locator('.schedule-autodj-gap').count(), 1, 'Keine erfundene AutoDJ-Lücke nach offenem Ende');
  assert.deepEqual(errors, []);
});
test('Sendeplan: Anlegen, Bearbeiten und Löschen durch den Besitzer; Hörer sehen sieben datierte Tage', async t => {
  const { owner, listener, errors } = await setup(t);
  assert.equal(await listener.locator('#schedule-new').isVisible(), false);
  assert.equal(await listener.locator('#schedule-topic').isDisabled(), true);
  assert.equal(await owner.locator('.schedule-day').count(), 7);
  assert.doesNotMatch(await owner.locator('.schedule-controls').innerText(), /Deutsche Ortszeit/);
  assert.match(await owner.locator('.schedule-day-label').first().textContent(), /Montag, \d{2}\.\d{2}\.\d{4}/);
  assert.match(await owner.locator('.schedule-day-label').last().textContent(), /Sonntag, \d{2}\.\d{2}\.\d{4}/);
  await newShow(owner);
  await listener.locator('#schedule-refresh').click();
  await listener.locator('.schedule-topic').filter({ hasText: '80er und 90er' }).waitFor();
  assert.equal(await listener.locator('.schedule-edit').count(), 0);
  assert.match(await listener.locator('.schedule-time').first().textContent(), /19:00 – 21:00/);
  assert.match(await listener.locator('.schedule-presenter').first().textContent(), /Testleitung/);
  for (const [page, width] of [[owner, 820], [listener, 320]]) {
    await page.setViewportSize({ width, height: width === 820 ? 680 : 640 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#schedule-days').evaluate(node => getComputedStyle(node).overflowY), 'visible', 'Wochenliste ohne eigenen Scrollbereich');
    if (process.env.MISCHWERK_CAPTURE_SCHEDULE) {
      const folder = path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan'); fs.mkdirSync(folder, { recursive: true });
      await page.screenshot({ path: path.join(folder, 'Sendeplan-' + width + '.png') });
    }
    if (process.env.MISCHWERK_DESIGN_CAPTURE) {
      const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'design');fs.mkdirSync(folder,{recursive:true});
      await page.waitForTimeout(180); // Native Seitenaufteilung nach dem Breitenwechsel abwarten.
      await page.screenshot({path:path.join(folder,'Sendeplan-'+width+'.png')});
    }
  }
  await owner.locator('.schedule-edit').first().click();
  await owner.locator('#schedule-topic').fill('Rockabend');
  assert.equal(await owner.locator('#schedule-pagination').isVisible(),false,'Im Editor ist die Wochen-Seitennavigation ausgeblendet');
  if (process.env.MISCHWERK_DESIGN_CAPTURE) {
    const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'design');fs.mkdirSync(folder,{recursive:true});
    await owner.screenshot({path:path.join(folder,'Sendeplan-Editor.png'),fullPage:true});
  }
  await owner.locator('#schedule-save').click();
  await owner.locator('.schedule-topic').filter({ hasText: 'Rockabend' }).waitFor();
  await listener.locator('#schedule-refresh').click();
  await listener.locator('.schedule-topic').filter({ hasText: 'Rockabend' }).waitFor();
  await owner.locator('.schedule-edit').first().click();
  await owner.locator('#schedule-delete').click();
  await owner.waitForFunction(() => document.getElementById('schedule-form').hidden);
  await listener.locator('#schedule-refresh').click();
  await listener.waitForFunction(() => document.querySelectorAll('.schedule-show').length === 0);
  assert.deepEqual(errors, []);
});
test('Wochenwechsel, Mitternacht und unverlorener Themenentwurf bei Fehler und Aktualisierung', async t => {
  const { owner, errors } = await setup(t);
  const initial = await owner.locator('#schedule-range').textContent();
  await owner.locator('#schedule-next').click();
  await owner.waitForFunction(value => document.getElementById('schedule-range').textContent !== value, initial);
  const next = await owner.locator('#schedule-range').textContent();
  await owner.locator('#schedule-current').click();
  await owner.waitForFunction(value => document.getElementById('schedule-range').textContent === value, initial);
  await owner.locator('#schedule-previous').click();
  await owner.waitForFunction(value => document.getElementById('schedule-range').textContent !== value, initial);
  assert.notEqual(await owner.locator('#schedule-range').textContent(), next);
  await owner.locator('#schedule-current').click();
  await owner.waitForFunction(value => document.getElementById('schedule-range').textContent === value, initial);
  const monday = await owner.locator('.schedule-day').first().getAttribute('data-schedule-date');
  const sunday = await owner.locator('.schedule-day').last().getAttribute('data-schedule-date');
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-date').fill(sunday);
  await owner.locator('#schedule-start').fill('22:00');
  await owner.locator('#schedule-end').fill('02:00');
  await owner.locator('#schedule-topic').fill('Nachtprogramm');
  await owner.locator('#schedule-save').click();
  await owner.waitForFunction(() => document.getElementById('schedule-form').hidden);
  await owner.locator('#schedule-next').click();
  await owner.locator('.schedule-time').filter({ hasText: 'vom Vortag' }).waitFor();
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-date').fill(await owner.locator('.schedule-day').first().getAttribute('data-schedule-date'));
  await owner.locator('#schedule-start').fill('01:00');
  await owner.locator('#schedule-end').fill('03:00');
  await owner.locator('#schedule-topic').fill('Mein Entwurf');
  await owner.locator('#schedule-save').click();
  await owner.locator('#schedule-feedback.error').filter({ hasText: 'überschneidet' }).waitFor();
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Mein Entwurf');
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(() => !document.getElementById('schedule-refresh').disabled);
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Mein Entwurf');
  assert.equal(await owner.locator('#schedule-next').isDisabled(), true);
  assert.notEqual(monday, sunday);
  await owner.setViewportSize({ width: 320, height: 640 });
  await owner.locator('#schedule-panel').waitFor();
  await scheduleReachable(owner);
  assert.equal(await owner.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.ok(await owner.locator('#schedule-save').isVisible());
  assert.deepEqual(errors, []);
});

test('Sendeplan zeigt nach Ende um 00:00 keine Null-Minuten-Sendung am Folgetag', async t => {
  const { owner, errors } = await setup(t, { clock: true });
  const monday = await owner.locator('.schedule-day').first().getAttribute('data-schedule-date');
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-date').fill(monday);
  await owner.locator('#schedule-start').fill('22:00');
  await owner.locator('#schedule-end').fill('00:00');
  await owner.locator('#schedule-topic').fill('Bis Mitternacht');
  await owner.locator('#schedule-save').click();
  await owner.waitForFunction(() => document.getElementById('schedule-form').hidden);
  await owner.locator('.schedule-topic').filter({ hasText: 'Bis Mitternacht' }).first().waitFor();
  assert.equal(await owner.locator('.schedule-topic').filter({ hasText: 'Bis Mitternacht' }).count(), 1);
  await owner.route('**/api/event', route => route.fulfill({ status: 503, body: 'Offline' }));
  await owner.clock.fastForward(66000);
  assert.equal(await owner.locator('#schedule-new').isDisabled(), true);
  assert.equal(await owner.locator('#schedule-refresh').isEnabled(), true);
  assert.deepEqual(errors, []);
});
test('Sendeplan bleibt bei geschlossener Wunschbox aktiv und öffnet als separates Channel-Overlay', async t => {
  const { base, context, owner, errors } = await setup(t);
  const radio = await context.newPage();
  await radio.goto(base + '/preview?role=moderator');
  await radio.waitForFunction(() => !document.getElementById('open-schedule').disabled);
  await radio.evaluate(() => { window.__sameAudio = document.getElementById('radio-audio'); });
  for (const width of [320, 390, 680, 681, 900, 901, 960, 1500, 2560]) {
    // Die lokale Demo hat zusätzlich zum nativen Header eine 26-px-Kennzeichnung.
    await radio.setViewportSize({ width, height: 186 });
    // mw-ready bleibt nach dem ersten Laden gesetzt; der Resize-Handler folgt separat.
    await radio.waitForFunction(expectedWidth => document.documentElement.classList.contains('mw-ready') &&
      innerWidth === expectedWidth && document.documentElement.classList.contains('radio-constrained') === (expectedWidth <= 1350), width);
    const plan = await radio.locator('#open-schedule').boundingBox(), wish = await radio.locator('#open-wishes').boundingBox();
    assert.ok(plan.y+plan.height<=186&&wish.y+wish.height<=186,'Hauptaktionen bleiben vollständig im Header bei '+width);
    assert.ok(Math.abs(plan.height-wish.height)<.05, 'Gleiche feste Höhe');
    assert.ok(await radio.locator('#open-schedule').evaluate(node => {
      const box = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), 'Sendeplan ohne Überlagerung bei ' + width);
    assert.equal(await radio.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (process.env.MISCHWERK_CAPTURE_SCHEDULE && [320, 960].includes(width)) {
      const folder = path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan'); fs.mkdirSync(folder, { recursive: true });
      await radio.screenshot({ path: path.join(folder, 'Leiste-Sendeplan-' + width + '.png') });
    }
  }
  const studio = await context.newPage();
  await studio.goto(base + '/preview?role=moderator&view=studio');
  await studio.waitForFunction(() => !document.getElementById('toggle-wishes').disabled);
  await studio.locator('#toggle-wishes').click();
  await studio.waitForFunction(() => document.getElementById('toggle-wishes').getAttribute('aria-checked') === 'false');
  await radio.reload();
  await radio.waitForFunction(() => document.getElementById('open-wishes').disabled && !document.getElementById('open-schedule').disabled);
  await radio.evaluate(() => { window.__sameAudio = document.getElementById('radio-audio'); });
  const channel=await context.newPage();await channel.goto(base+'/channel.html?role=moderator');
  const header=await(await channel.locator('#radio-frame').elementHandle()).contentFrame();
  await header.waitForFunction(()=>document.getElementById('open-wishes').disabled&&!document.getElementById('open-schedule').disabled);
  await header.evaluate(()=>{window.__sameAudio=document.getElementById('radio-audio');});
  const pages=context.pages().length;
  await header.locator('#open-schedule').click();
  await channel.locator('#overlay-frame:not([hidden])').waitFor();
  const overlay=await(await channel.locator('#overlay-frame').elementHandle()).contentFrame();
  await overlay.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===7);
  assert.equal(await overlay.locator('#dialog-title').textContent(),'Sendeplan');
  assert.equal(context.pages().length,pages,'Kein separates Browserfenster');
  assert.equal(await header.locator('#radio-panel').isVisible(),true);
  assert.ok(await header.evaluate(()=>window.__sameAudio===document.getElementById('radio-audio')));
  assert.equal((await channel.locator('#radio-frame').boundingBox()).height,160);
  assert.equal(await owner.locator('#dialog-title').textContent(), 'Sendeplan');
  assert.deepEqual(errors, []);
});

test('Mehr als ein Paket wird vollständig als Woche dargestellt; Sendungstexte bleiben reiner Text', async t => {
  const { owner, errors } = await setup(t);
  const seeded = await owner.evaluate(async () => {
    const sessionId = window.MischWerkDemoData.sessionId;
    let sequence = 0;
    async function call(type, data) {
      const response = await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type, data: { requestId: 'bulk-' + (++sequence), ...data } }) });
      return response.json();
    }
    const events = await call('mw:schedule.get', {});
    const week = events.find(event => event.type === 'mw:schedule.data').data.week;
    function time(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
    for (let i = 0; i < 25; i++) {
      const result = await call('mw:schedule.save', { week, date: week, expectedRevision: i,
        start: time(i * 20), end: time((i + 1) * 20), nick: Client.pageData.user.nick,
        topic: i ? 'Sendung ' + (i + 1) : '<img src="x" onerror="window.__bad=true">' });
      if (!result.find(event => event.type === 'mw:schedule.result').data.ok) { return false; }
    }
    return true;
  });
  assert.equal(seeded, true);
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(() => document.querySelectorAll('.schedule-show').length === 25);
  assert.equal(await owner.locator('.schedule-day').evaluateAll(nodes => new Set(nodes.map(node => node.dataset.scheduleDate)).size), 7);
  assert.equal(await owner.locator('#schedule-days img').count(), 0);
  assert.equal(await owner.evaluate(() => window.__bad), undefined);
  assert.ok((await owner.locator('#schedule-days').textContent()).includes('Sendung 25'));
  // Erst die fertige Pagination verwenden; der kurz sichtbare Rohplan ist noch keine Seite.
  await owner.locator('#schedule-pagination').waitFor({ state: 'visible' });
  while (!(await owner.locator('.schedule-edit').last().isVisible())) {
    await owner.locator('#schedule-page-next:not([disabled])').click();
  }
  await owner.locator('.schedule-edit').last().click();
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Sendung 25');
  await owner.locator('#schedule-topic').fill('Letzte Sendung geändert');
  await owner.locator('#schedule-save').click();
  const changed = owner.locator('.schedule-topic').filter({ hasText: 'Letzte Sendung geändert' });
  await changed.waitFor({ state: 'attached' });
  await changed.waitFor({ state: 'visible' });
  assert.equal(await changed.textContent(), 'Letzte Sendung geändert');
  const monday = await owner.locator('.schedule-day').first().getAttribute('data-schedule-date');
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-date').fill(monday);
  await owner.locator('#schedule-start').fill('10:00');
  await owner.locator('#schedule-end').fill('11:00');
  await owner.locator('#schedule-topic').fill('Neue Sendung am langen Tag');
  await owner.locator('#schedule-save').click();
  await owner.locator('.schedule-topic').filter({ hasText: 'Neue Sendung am langen Tag' }).waitFor({ state: 'visible' });
  assert.deepEqual(errors, []);
});

test('Sendeplan behält den Rahmen bei neuen und gelöschten Sendungen; alle Einträge bleiben erreichbar', async t => {
  const { owner, errors } = await setup(t,{nativeSizing:true});
  const emptyHeight = owner.viewportSize().height;
  assert.equal(emptyHeight,660);
  await scheduleReachable(owner);
  const first = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  for (let i = 0; i < 3; i++) {
    const events = await scheduleCall(owner, 'mw:schedule.save', { week: first.week, date: first.week,
      expectedRevision: i, start: String(i).padStart(2, '0') + ':00',
      end: String(i + 1).padStart(2, '0') + ':00', nick: 'Testleitung', topic: 'Zusätzliche Sendung ' + i });
    assert.equal(events.find(e => e.type === 'mw:schedule.result').data.ok, true);
  }
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===3);
  await owner.waitForTimeout(100);
  assert.equal(owner.viewportSize().height,emptyHeight);
  assert.deepEqual(await owner.evaluate(()=>__scheduleSizes),[]);
  await scheduleReachable(owner);
  const seen=new Set();
  while(true){
    for(const text of await owner.locator('.schedule-show:visible .schedule-topic').allTextContents())seen.add(text);
    if(!(await owner.locator('#schedule-pagination').isVisible())||await owner.locator('#schedule-page-next').isDisabled())break;
    await owner.locator('#schedule-page-next').click();await scheduleReachable(owner);
  }
  assert.equal(seen.size,3);
  if (process.env.MISCHWERK_CAPTURE_SCHEDULE) {
    await owner.screenshot({ path: path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan/Sendeplan-Dynamisch-Belegt.png') });
  }
  const full = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  for (let i = 0; i < full.entries.length; i++) {
    const events = await scheduleCall(owner, 'mw:schedule.delete', { week: full.week,
      expectedRevision: full.revision + i, id: full.entries[i].id });
    assert.equal(events.find(e => e.type === 'mw:schedule.result').data.ok, true);
  }
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(height => document.querySelectorAll('.schedule-show').length === 0 &&
    innerHeight === height, emptyHeight);
  await owner.waitForTimeout(100);
  assert.deepEqual(await owner.evaluate(()=>__scheduleSizes),[]);
  assert.equal(await owner.locator('.schedule-day').count(),7);
  await scheduleReachable(owner);
  if (process.env.MISCHWERK_CAPTURE_SCHEDULE) {
    await owner.screenshot({ path: path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan/Sendeplan-Dynamisch-Leer.png') });
  }
  assert.deepEqual(errors, []);
});

test('Feste K3-Höhe: alle Einträge über sichtbare Seiten erreichbar, auch ein langer einzelner Tag', async t => {
  const { owner, errors } = await setup(t);
  await owner.evaluate(() => {
    const original = Client.getHostFrame;
    window.__k3ScheduleSizes = [];
    Client.getHostFrame = () => ({ ...original(), setSize(width, height) {
      window.__k3ScheduleSizes.push([width, height]);
    } });
  });
  const first = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  for (let i = 0; i < 12; i++) {
    const events = await scheduleCall(owner, 'mw:schedule.save', { week: first.week, date: first.week,
      expectedRevision: i, start: String(i).padStart(2, '0') + ':00',
      end: String(i + 1).padStart(2, '0') + ':00', nick: 'Testleitung',
      topic: i === 0 ? 'Kalenderprüfung 0'.padEnd(80, 'W') : 'Kalenderprüfung ' + i });
    assert.equal(events.find(e => e.type === 'mw:schedule.result').data.ok, true);
  }
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(() => document.querySelectorAll('.schedule-show').length === 12);
  await owner.setViewportSize({ width: 320, height: 640 });
  await owner.locator('#schedule-pagination').waitFor();
  await owner.locator('#schedule-panel').waitFor();
  const seen = new Set();
  const visitedPages = new Set();
  while (true) {
    const currentPage = await owner.locator('#schedule-page-label').textContent();
    assert.ok(!visitedPages.has(currentPage), 'Der Seitenwechsel muss vorankommen: ' + currentPage);
    visitedPages.add(currentPage);
    await scheduleReachable(owner);
    for (const text of await owner.locator('.schedule-show:visible .schedule-topic').allTextContents()) { seen.add(text); }
    if (await owner.locator('#schedule-page-next').isDisabled()) { break; }
    await owner.locator('#schedule-page-next').click();
  }
  assert.equal(seen.size, 12, 'Alle Sendungen des langen Tages sind vollständig zugänglich');
  const caption = await owner.locator('#schedule-page-label').textContent();
  await owner.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await owner.waitForTimeout(200);
  assert.equal(await owner.locator('#schedule-page-label').textContent(), caption, 'Aktualisierung erhält die aktuelle Seite');
  while (await owner.locator('.schedule-edit:visible').count() === 0) {
    await owner.locator('#schedule-page-previous:not([disabled])').click();
  }
  await owner.locator('.schedule-edit:visible').last().click();
  await owner.locator('#schedule-cancel').click();
  await owner.locator('#schedule-pagination').waitFor();
  await scheduleReachable(owner);
  assert.deepEqual(await owner.evaluate(() => window.__k3ScheduleSizes), [], 'Keine STAPP-Größenaufrufe in K3');
  assert.deepEqual(errors, []);
});


function futureWeek(value, offset = 0) {
  const date = new Date(value + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7 + offset);
  return date.toISOString().slice(0, 10);
}
async function waitScheduleReady(page) {
  await page.waitForFunction(() => !document.getElementById('schedule-save').disabled);
}

test('Neue Sendungen lassen sich direkt im Kalender für nächste Woche, spätere Monate und das nächste Jahr planen', async t => {
  const { owner, listener, errors } = await setup(t);
  const initial = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  const next = futureWeek(initial.week, 7), year = Number(initial.today.slice(0, 4)) + 1;
  const targets = [next, year + '-01-06', year + '-04-14'];
  const seed = (await scheduleCall(owner, 'mw:schedule.save', { week: next, date: next, expectedRevision: 0,
    start: '16:00', end: '17:00', nick: 'Testleitung', topic: 'Bereits geplante Sendung' })).find(e => e.type === 'mw:schedule.result').data;
  assert.equal(seed.ok, true);
  const writes = [];
  owner.on('request', request => { if (request.url().endsWith('/api/event')) { const body = request.postDataJSON(); if (body?.type === 'mw:schedule.save') writes.push(body.data); } });
  for (const [index, date] of targets.entries()) {
    await owner.locator('#schedule-new').click();
    assert.equal(await owner.locator('#schedule-date').getAttribute('min'), null);
    assert.equal(await owner.locator('#schedule-date').getAttribute('max'), null);
    await owner.locator('#schedule-topic').fill('Zukunftsprogramm ' + index);
    await owner.locator('#schedule-date').fill(date);
    assert.equal(await owner.locator('#schedule-date').evaluate(n => n.validity.rangeOverflow || n.validity.rangeUnderflow), false);
    await waitScheduleReady(owner);
    assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Zukunftsprogramm ' + index);
    assert.equal(await owner.locator('.schedule-day').first().getAttribute('data-schedule-date'), futureWeek(date));
    if (index === 1 && process.env.MISCHWERK_CAPTURE_SCHEDULE) {
      await owner.screenshot({ path: path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan/Sendeplan-Zukunft.png') });
    }
    await owner.locator('#schedule-save').click();
    await owner.waitForFunction(() => document.getElementById('schedule-form').hidden);
    await owner.locator('.schedule-topic').filter({ hasText: 'Zukunftsprogramm ' + index }).waitFor();
    assert.equal(writes.at(-1).week, futureWeek(date));
    assert.equal(writes.at(-1).date, date);
    assert.equal(writes.at(-1).expectedRevision, index === 0 ? 1 : 0, 'Revision gehört zur Zielwoche');
    const stored = (await scheduleCall(listener, 'mw:schedule.get', { week: futureWeek(date) })).find(e => e.type === 'mw:schedule.data').data;
    assert.ok(stored.entries.some(e => e.date === date && e.topic === 'Zukunftsprogramm ' + index));
    if (index === 0) {
      await listener.locator('#schedule-next').click();
      await listener.locator('.schedule-topic').filter({ hasText: 'Zukunftsprogramm 0' }).waitFor();
      assert.equal(await listener.locator('.schedule-edit').count(), 0);
      await owner.locator('.schedule-edit:visible').first().click();
      assert.equal(await owner.locator('#schedule-date').getAttribute('min'), futureWeek(date));
      assert.equal(await owner.locator('#schedule-date').getAttribute('max'), futureWeek(date, 6));
      await owner.locator('#schedule-cancel').click();
    }
  }
  await owner.reload();
  await owner.waitForFunction(() => document.querySelectorAll('.schedule-day').length === 7);
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-date').fill(targets[2]);
  await waitScheduleReady(owner);
  await owner.locator('#schedule-cancel').click();
  await owner.locator('.schedule-topic').filter({ hasText: 'Zukunftsprogramm 2' }).waitFor();
  if (process.env.MISCHWERK_CAPTURE_SCHEDULE) {
    await owner.screenshot({ path: path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'sendeplan/Sendeplan-Zukunft-Gespeichert.png') });
  }
  assert.deepEqual(errors, []);
});

test('Schneller Datumswechsel ignoriert die verspätete Antwort einer anderen Zukunftswoche und erhält alle Eingaben', async t => {
  const { owner, errors } = await setup(t);
  const initial = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  const first = futureWeek(initial.week, 7), second = futureWeek(initial.week, 14);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await owner.route('**/api/event', async route => {
    const body = route.request().postDataJSON();
    if (body.type === 'mw:schedule.get' && body.data.week === first) {
      const response = await route.fetch(); await gate; await route.fulfill({ response });
    } else { await route.continue(); }
  });
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-topic').fill('Mein unverlorener Zukunftsentwurf');
  await owner.locator('#schedule-start').fill('18:00'); await owner.locator('#schedule-end').fill('20:00');
  const held = owner.waitForRequest(r => r.url().endsWith('/api/event') && r.postDataJSON()?.type === 'mw:schedule.get' && r.postDataJSON().data.week === first);
  await owner.locator('#schedule-date').fill(first); await held;
  assert.equal(await owner.locator('#schedule-save').isDisabled(), true);
  assert.equal(await owner.locator('#schedule-date').isDisabled(), false);
  await owner.locator('#schedule-date').fill(second);
  await waitScheduleReady(owner);
  const range = await owner.locator('#schedule-range').textContent();
  const delayed = owner.waitForResponse(r => r.url().endsWith('/api/event') && r.request().postDataJSON()?.type === 'mw:schedule.get' && r.request().postDataJSON().data.week === first);
  release(); await delayed; await owner.waitForTimeout(50);
  assert.equal(await owner.locator('#schedule-range').textContent(), range);
  assert.equal(await owner.locator('#schedule-date').inputValue(), second);
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Mein unverlorener Zukunftsentwurf');
  assert.equal(await owner.locator('#schedule-start').inputValue(), '18:00'); assert.equal(await owner.locator('#schedule-end').inputValue(), '20:00');
  await owner.locator('#schedule-save').click();
  await owner.waitForFunction(() => document.getElementById('schedule-form').hidden);
  await owner.locator('.schedule-topic').filter({ hasText: 'Mein unverlorener Zukunftsentwurf' }).waitFor();
  const wrong = (await scheduleCall(owner, 'mw:schedule.get', { week: first })).find(e => e.type === 'mw:schedule.data').data;
  assert.equal(wrong.total, 0);
  assert.deepEqual(errors, []);
});

test('Fehler beim Laden einer Zukunftswoche erhält den Entwurf; Aktualisieren bindet die richtige Woche und bewahrt den Revisionsschutz', async t => {
  const { owner, errors } = await setup(t);
  const initial = (await scheduleCall(owner, 'mw:schedule.get')).find(e => e.type === 'mw:schedule.data').data;
  const target = futureWeek(initial.week, 28); let fail = true;
  await owner.route('**/api/event', route => {
    const body = route.request().postDataJSON();
    if (fail && body.type === 'mw:schedule.get' && body.data.week === target) {
      return route.fulfill({ json: [{ type: 'mw:schedule.result', data: { requestId: body.data.requestId, ok: false, message: 'Test: Zielwoche nicht erreichbar.' } }] });
    }
    return route.continue();
  });
  await owner.locator('#schedule-new').click();
  await owner.locator('#schedule-topic').fill('Entwurf in vier Wochen');
  await owner.locator('#schedule-date').fill(target);
  await owner.locator('#schedule-feedback.error').filter({ hasText: 'Zielwoche nicht erreichbar' }).waitFor();
  assert.equal(await owner.locator('#schedule-save').isDisabled(), true);
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Entwurf in vier Wochen');
  fail = false; await owner.locator('#schedule-refresh').click(); await waitScheduleReady(owner);
  assert.equal(await owner.locator('#schedule-feedback.error').isVisible(), false);
  assert.equal(await owner.locator('#schedule-date').inputValue(), target);
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Entwurf in vier Wochen');
  const parallel = (await scheduleCall(owner, 'mw:schedule.save', { week: target, date: target, expectedRevision: 0,
    start: '10:00', end: '11:00', nick: 'Testleitung', topic: 'Parallele Sendung' })).find(e => e.type === 'mw:schedule.result').data;
  assert.equal(parallel.ok, true);
  await owner.locator('#schedule-refresh').click(); await waitScheduleReady(owner);
  await owner.locator('#schedule-save').click();
  await owner.locator('#schedule-feedback.error').filter({ hasText: 'inzwischen geändert' }).waitFor();
  assert.equal(await owner.locator('#schedule-topic').inputValue(), 'Entwurf in vier Wochen');
  await owner.setViewportSize({ width: 320, height: 680 });
  await owner.locator('#schedule-panel').waitFor();
  await scheduleReachable(owner);
  const saved = (await scheduleCall(owner, 'mw:schedule.get', { week: target })).find(e => e.type === 'mw:schedule.data').data;
  assert.equal(saved.entries.length, 1); assert.equal(saved.entries[0].topic, 'Parallele Sendung');
  assert.deepEqual(errors, []);
});

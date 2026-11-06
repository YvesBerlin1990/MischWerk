// Vollständige Übergabe zwischen zwei Browserfenstern am echten lokalen Backend.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createHarness } = require('../support/knuddels.cjs');
const root = path.resolve(__dirname, '../..');
const browserSource=process.env.MISCHWERK_TEST_UPLOAD?path.join(process.env.MISCHWERK_TEST_UPLOAD,'www'):path.join(root,'app/www');
const {reveal,readText,fits:studioFits}=require('../support/studio-browser.cjs');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
async function setup(t, width = 780, longNames = false) {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), next = h.user(2, longNames ? 'D'.repeat(50) : 'Nächster DJ');
  const radio = h.open(owner); h.event(owner, radio, 'mw:addRadioModerator', { nick: next.nick });
  h.event(owner, radio, 'mw:onAir'); h.event(owner, radio, 'mw:setTopic', { topic: 'Bisherige Sendung' });
  const context = await browser.newContext({ viewport: { width, height: 740 } });
  t.after(() => context.close());
  const records = [], errors = [];
  let delivery = Promise.resolve();
  async function flush() {
    const updates = records.map(record => ({ page: record.page, events: record.session.events.splice(0).filter(event=>{
      if(record.dropResult&&event.type==='mw:result'&&event.data.action===record.dropResult){record.dropResult=null;return false;}
      if(record.dropState&&event.type==='mw:state'){record.dropState--;return false;}
      if(record.holdStates&&event.type==='mw:state'){(record.held||(record.held=[])).push(event);return false;}return true;
    }) }));
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
    const file = path.resolve(browserSource, relative);
    if (!file.startsWith(browserSource + path.sep) || !fs.existsSync(file)) { return route.fulfill({ status: 404 }); }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(file) });
  });
  for (const user of [owner, next]) {
    const header = user === owner ? radio : h.open(user);
    h.event(user, header, 'mw:openStudio');
    const session = user.sessions.find(item => item.content.viewMode === 'Overlay');
    const state = h.state(user, session); state.view = 'studio'; state.station.configured = false;
    const page = await context.newPage(); records.push({ page, session, user });
    for (const record of records) { record.session.events = []; }
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(state => {
      window.__handlers = {}; window.__sent = [];
      window.__emit = (type, data) => { if(type==='mw:state')window.__lastSnapshot=data;(window.__handlers[type] || []).forEach(callback => callback({ type, data })); };
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
  return { h, owner, next, source: records[0].page, target: records[1].page, records, flush, drain:()=>delivery, errors };
}
async function fits(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  for (const button of await page.locator('#handover-panel button:visible').all()) {
    await button.scrollIntoViewIfNeeded();
    assert.equal(await button.evaluate(node => { const b = node.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }), true);
  }
}
async function request(source, target) {
  await reveal(source,'#handover-open','studio');await source.locator('#handover-open').click();
  await reveal(source,'#handover-target','handover');await source.locator('#handover-target').selectOption({ index: 0 });
  await reveal(source,'#handover-request','handover');await source.locator('#handover-request').click();
  await source.locator('#handover-cancel').waitFor();
  await reveal(target,'#handover-open');
  await reveal(target,'#handover-open','studio');await target.locator('#handover-open').click();
  await reveal(target,'#handover-accept','handover');
}

test('Bestätigte Übergabe im Browser: Auswahl, Warten, Annahme mit Thema und genau eine gemeinsame Botansage', async t => {
  const { h, source, target, errors } = await setup(t);
  assert.equal(await target.locator('#on-air').isDisabled(), true);
  await request(source, target);
  await fits(source); await fits(target);
  assert.equal(h.bot.messages.length, 1);
  await reveal(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Die nächste Sendung');
  if (process.env.MISCHWERK_CAPTURE_HANDOVER) {
    const folder = path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'studio'); fs.mkdirSync(folder, { recursive: true });
    await source.screenshot({ path: path.join(folder, 'Uebergabe-Warten.png') });
    await target.screenshot({ path: path.join(folder, 'Uebergabe-Annehmen.png') });
  }
  await reveal(target,'#handover-accept','handover');await target.locator('#handover-accept').click();
  await reveal(target,'#on-air');await target.locator('#on-air').filter({ hasText: 'Endzeit ändern' }).waitFor();
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
  await reveal(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Mein erhaltenes Thema');
  const save = h.store.setObject; h.store.setObject = () => { throw new Error('storage-failed'); };
  await reveal(target,'#handover-accept','handover');await target.locator('#handover-accept').click();
  await target.locator('#notice.error').waitFor();
  assert.equal(await target.locator('#handover-topic').inputValue(), 'Mein erhaltenes Thema');
  const old = h.state(records[1].user, records[1].session); await flush();
  assert.equal(await target.locator('#handover-topic').inputValue(), 'Mein erhaltenes Thema');
  assert.equal(h.state(owner, records[0].session).moderator.nick, owner.nick); await flush();
  await fits(target);
  h.store.setObject = save;
  await reveal(source,'#handover-cancel','handover');await source.locator('#handover-cancel').click();
  await target.locator('#handover-panel').waitFor({ state: 'hidden' });
  await target.evaluate(state => window.__emit('mw:state', state), old);
  assert.equal(await target.locator('#handover-open').isVisible(), false);
  assert.equal(h.bot.messages.length, 1); assert.deepEqual(errors, []);
});

test('Ablehnen beendet nur die Anfrage; 320px-Studio bleibt mit Übergabeaktion und maximalem Nick bedienbar', async t => {
  const { h, source, target, errors } = await setup(t, 320, true);
  await request(source, target);
  await reveal(target,'#handover-decline','handover');await target.locator('#handover-decline').click();
  await target.locator('#handover-panel').waitFor({ state: 'hidden' });
  await source.locator('#handover-request-form').waitFor();
  await fits(source); await fits(target);
  assert.equal(h.bot.messages.length, 1);
  assert.equal(await source.locator('#on-air').isVisible(), false, 'Übergabebereich bleibt getrennt vom Studio');
  await reveal(source,'#handover-back','handover');await source.locator('#handover-back').click();
  await reveal(source,'#on-air');await source.locator('#on-air').waitFor(); await fits(source);
  assert.deepEqual(errors, []);
});

test('Private Übergabenotizen erscheinen im echten Browserablauf vor und nach Annahme und bleiben bei Speicherfehler erhalten',async t=>{
  const {h,owner,source,target,errors}=await setup(t,320);
  const notes='Bitte nach dem nächsten Song die Geburtstagsgrüße vorlesen. '.repeat(8).slice(0,500).trim();
  await reveal(source,'#handover-open','studio');await source.locator('#handover-open').click();
  await reveal(source,'#handover-notes','handover');await source.locator('#handover-notes').fill(notes);
  assert.equal(await source.locator('#handover-notes-count').textContent(),notes.length+' / 500');
  await reveal(source,'#handover-request','handover');await source.locator('#handover-request').click();
  await source.locator('#handover-cancel').waitFor();
  assert.equal(await readText(source,'#handover-note-text','handover'),notes);
  await reveal(target,'#handover-open','studio');await target.locator('#handover-open').click();
  assert.equal(await readText(target,'#handover-note-text','handover'),notes);
  await reveal(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Meine neue Sendung');
  const write=h.store.setObject;h.store.setObject=()=>{throw Error('storage-failed');};
  await reveal(target,'#handover-accept','handover');await target.locator('#handover-accept').click();await target.locator('#notice.error').waitFor();
  assert.equal(await readText(target,'#handover-note-text','handover'),notes);
  assert.equal(await target.locator('#handover-topic').inputValue(),'Meine neue Sendung');
  h.store.setObject=write;
  await reveal(target,'#handover-accept','handover');await target.locator('#handover-accept').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
  await reveal(target,'#studio-received-notes');
  assert.equal(await readText(target,'#studio-notes-text'),notes);
  assert.equal(await target.locator('#studio-assistant').count(),0);
  owner.online=false;h.app.onUserLeft(owner);
  assert.equal(await readText(target,'#studio-notes-text'),notes);
  await target.locator('#studio-notes-text').scrollIntoViewIfNeeded();
  assert.equal(await target.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.MISCHWERK_CAPTURE_STUDIO_FEATURES)await target.screenshot({path:path.join(root,'docs/pruefung/oberflaeche/moderation-320.png'),fullPage:true});
  assert.equal(h.bot.messages.length,2);assert.deepEqual(errors,[]);
});

test('Ausgewählte Themen- und Übergabegruppen bleiben nach vorübergehend größerem Hostrahmen ausgewählt',async t=>{
 const {source,errors}=await setup(t,320);
 await source.setViewportSize({width:320,height:568});await reveal(source,'#studio-topic');
 await source.setViewportSize({width:320,height:1400});await source.waitForFunction(()=>document.getElementById('studio-paging').hidden);
 await source.setViewportSize({width:320,height:568});await source.waitForFunction(()=>!document.getElementById('studio-paging').hidden);
 assert.equal(await source.locator('#studio-topic').isVisible(),true,'Die gewählte Themengruppe bleibt bei Rückkehr zur kleinen Höhe erhalten');
 await reveal(source,'#handover-open');await source.locator('#handover-open').click();await reveal(source,'#handover-notes','handover');
 await source.setViewportSize({width:320,height:1400});await source.waitForFunction(()=>document.getElementById('handover-paging').hidden);
 await source.setViewportSize({width:320,height:568});await source.waitForFunction(()=>!document.getElementById('handover-paging').hidden);
 assert.equal(await source.locator('#handover-notes').isVisible(),true,'Die gewählte Notizgruppe bleibt bei Rückkehr zur kleinen Höhe erhalten');
 assert.deepEqual(errors,[]);
});

test('Sehr niedrige Übergabe lässt übergroße Bediengruppen mit Rad und Touch scrollen',async t=>{
 const {source,target,drain,errors}=await setup(t,320);
 for(const page of [source,target])await page.setViewportSize({width:320,height:360});
 await reveal(source,'#handover-open');await source.locator('#handover-open').click();await reveal(source,'#handover-notes','handover');
 const area=source.locator('#handover-body');
 assert.equal(await area.evaluate(n=>getComputedStyle(n).overflowY),'auto','Die übergroße Notizgruppe hat einen nativ bedienbaren Scrollweg');
 assert.ok(await area.evaluate(n=>n.scrollHeight>n.clientHeight));
 await area.hover();await source.mouse.wheel(0,600);await source.waitForFunction(()=>document.getElementById('handover-body').scrollTop>0);
 const scroll=await area.evaluate(n=>n.scrollTop);await source.evaluate(()=>Client.sendEvent('mw:refresh',{requestId:'handover-scroll-check'}));await drain();
 await source.waitForFunction(()=>window.__lastSnapshot?.refreshRequestId==='handover-scroll-check');
 assert.equal(await area.evaluate(n=>n.scrollTop),scroll,'Ein Zustandsrefresh setzt die gelesene Bediengruppe nicht an den Anfang');
 const send=source.locator('#handover-request');assert.equal(await send.evaluate(n=>{const b=n.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}),true);
 await send.click();await reveal(target,'#handover-open');await target.locator('#handover-open').click();await reveal(target,'#handover-accept','handover');
 await target.locator('#handover-body').hover();await target.mouse.wheel(0,600);await target.locator('#handover-accept').click();
 await target.locator('#handover-panel').waitFor({state:'hidden'});assert.deepEqual(errors,[]);
});

test('Bestätigter Zustandswechsel schließt die Übergabe auch bei verlorener Annahmequittung und verwirft den alten Themenentwurf',async t=>{
 const {source,target,h,records,errors}=await setup(t,320);
 await reveal(target,'#studio-topic');await target.locator('#studio-topic').fill('Alter ungespeicherter Studioentwurf');
 await request(source,target);await reveal(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Bestätigte neue Sendung');
 await target.clock.install();
 records[1].dropResult='mw:handover.accept';await reveal(target,'#handover-accept','handover');await target.locator('#handover-accept').click();
 await target.waitForFunction(()=>document.getElementById('studio-host').textContent.includes('Nächster DJ'));
 assert.equal(await target.locator('#handover-panel').isVisible(),false,'Der authentifizierte Zustand bestätigt die abgeschlossene Übernahme');
 await reveal(target,'#studio-topic');assert.equal(await target.locator('#studio-topic').inputValue(),'Bestätigte neue Sendung');
 assert.equal(await target.locator('#topic-feedback').isVisible(),false,'Kein veralteter Entwurfshinweis nach bestätigter Übernahme');
 await reveal(target,'#on-air');assert.equal(await target.locator('#on-air').isDisabled(),false,'Bestätigte Übernahme lässt keine unnötige Quittungssperre zurück');
 await target.clock.runFor(16000);assert.equal(await target.locator('#notice.error').isVisible(),false,'Keine falsche Zeitüberschreitung nach bestätigtem Wechsel');
 await reveal(target,'#studio-topic');await target.locator('#studio-topic').fill('Meine nachträgliche Korrektur');
 await target.evaluate(()=>{const sent=window.__sent.find(e=>e.type==='mw:handover.accept');window.__emit('mw:result',{ok:true,action:sent.type,requestId:sent.data.requestId,message:'Sendung übernommen.'});});
 assert.equal(await target.locator('#studio-topic').inputValue(),'Meine nachträgliche Korrektur','Verspätete Quittung verwirft keinen neuen Entwurf');
 assert.equal(h.bot.messages.length,2);assert.deepEqual(errors,[]);
});

test('Ohne frischen bestätigten Übergabezustand wird kein Erfolg erfunden; verspäteter Zustand löst die Sperre',async t=>{
 const {source,target,h,records,drain,errors}=await setup(t,320);await request(source,target);
 const record=records[1],previous=h.state(record.user,record.session);record.dropResult='mw:handover.accept';record.holdStates=true;
 await target.locator('#handover-accept').click();await drain();
 assert.equal(h.state(record.user,record.session).user.isOnAir,true,'Backend hat atomar übernommen');
 await target.evaluate(s=>window.__emit('mw:state',s),previous);
 assert.equal(await target.locator('#handover-panel').isVisible(),true,'Alter Zustand bestätigt keine Übernahme');
 assert.equal(await target.locator('#handover-accept').isDisabled(),true);
 record.holdStates=false;await target.evaluate(events=>events.forEach(e=>window.__emit(e.type,e.data)),record.held);
 await target.locator('#handover-panel').waitFor({state:'hidden'});await reveal(target,'#on-air');assert.equal(await target.locator('#on-air').isDisabled(),false);
 assert.equal(h.bot.messages.length,2);assert.deepEqual(errors,[]);
});

test('Verlorener Zustands-Push nach Annahme wird anhand der echten Quittung sofort neu gelesen',async t=>{
 const {source,target,records,drain,errors}=await setup(t,320);await request(source,target);records[1].dropState=1;
 await target.locator('#handover-accept').click();await drain();
 await target.waitForFunction(()=>document.getElementById('studio-host').textContent.includes('Nächster DJ')&&!document.getElementById('on-air').disabled,null,{timeout:2000});
 assert.equal(await target.locator('#handover-panel').isVisible(),false);assert.deepEqual(errors,[]);
});

test('Abgelehnte Anfrage hinterlässt keine alte Übergabeidentität, die einen späteren Studioentwurf verwirft',async t=>{
 const {source,target,errors}=await setup(t,320);await request(source,target);
 await target.locator('#handover-decline').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
 await source.locator('#handover-back').click();await reveal(source,'#off-air');await source.locator('#off-air').click();
 await reveal(target,'#studio-topic');await target.locator('#studio-topic').fill('Entwurf für meine unabhängige Sendung');
 await reveal(target,'#on-air');await target.locator('#on-air').click();await target.locator('#on-air').filter({hasText:'Endzeit ändern'}).waitFor();
 assert.equal(await target.locator('#studio-topic').inputValue(),'Entwurf für meine unabhängige Sendung','Eine neue eigene Anmeldung ist keine Annahme der alten, abgelehnten Anfrage');
 assert.deepEqual(errors,[]);
});

test('Verlorene Annahmequittung wird auch bei gleichzeitig geändertem Thema eindeutig zugeordnet',async t=>{
 const {source,target,h,owner,records,drain,flush,errors}=await setup(t,320);await request(source,target);
 const record=records[1];record.dropResult='mw:handover.accept';record.holdStates=true;
 await target.locator('#handover-accept').click();await drain();
 h.event(owner,records[0].session,'mw:setTopic',{topic:'Parallel bestätigte Änderung'});await flush();
 record.holdStates=false;await target.evaluate(e=>window.__emit(e.type,e.data),record.held.at(-1));
 await target.locator('#handover-panel').waitFor({state:'hidden'});await reveal(target,'#on-air');
 assert.equal(await target.locator('#on-air').isDisabled(),false,'Die bestätigte Übergabe bleibt trotz späterer Themenänderung eindeutig');
 assert.equal(await target.locator('#studio-topic').inputValue(),'Parallel bestätigte Änderung');assert.equal(h.bot.messages.length,2);assert.deepEqual(errors,[]);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
const {reveal:revealStudio}=require('../support/studio-browser.cjs');
let browser;

for(const client of ['k3','stapp'])test('Direkte Songtitel im nativen '+client+'-Modell sind für Hörer sichtbar und erhalten echtes Audio',async t=>{
  const lab=await setup(t,{provider:'online'},true);
  const config=lab.hub.providerConfig();
  lab.hub.providerConfig=()=>({...config,metadata:{url:'https://emulator.mischwerk.invalid/fixture/current-song',format:'spcast-current-song',titleField:'',artistField:'',liveField:''}});
  lab.hub.restart(false);
  let title='a-ha - Take On Me';
  await lab.context.route('**/fixture/current-song?*',r=>r.fulfill({body:title,contentType:'text/plain',headers:{'Cache-Control':'max-age=300'}}));
  const {page,radio}=await lab.join('Polaroid',client,390,false);
  // Der Hörer erhält den öffentlichen Titel, während die private Regie weiterhin verborgen bleibt.
  assert.equal(await radio.locator('#studio-tab').isVisible(),false);
  await radio.locator('#track-title').filter({hasText:'Take On Me'}).waitFor();
  assert.equal(await radio.locator('.artist-copy').isVisible(),true);
  assert.equal(await radio.locator('#track-artist').textContent(),'a-ha');
  assert.equal(await radio.evaluate(()=>document.getElementById('track-title').getBoundingClientRect().bottom<=document.getElementById('track-artist').getBoundingClientRect().top),true,'Titel steht über dem Interpreten');
  const typography=await radio.evaluate(()=>({size:parseFloat(getComputedStyle(document.getElementById('track-artist')).fontSize),gap:document.getElementById('track-artist').getBoundingClientRect().top-document.getElementById('track-title').getBoundingClientRect().bottom}));
  assert.ok(typography.size>=15&&typography.gap>=5,'Interpret größer und mit Abstand zum Titel: '+JSON.stringify(typography));
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__historyAudio=document.getElementById('radio-audio');window.__historyAudioAt=__historyAudio.currentTime;});
  title='Neue Band - Neuer Titel';await page.clock.runFor(5000);
  await radio.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  assert.equal(await radio.locator('#track-artist').textContent(),'Neue Band');
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>window.__historyAudioAt);
  assert.equal(await radio.locator('#radio-audio').evaluate(n=>n===window.__historyAudio&&!n.paused&&!n.error),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored'])test('Wunschbox-Feedback erzeugt in '+client+' bei '+sizing+' keine zusätzliche Radioregie-Seite',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:sizing}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__wishToggleAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab:not([disabled])').click();let frame=await overlayView(page,'studio');
  await revealStudio(frame,'#toggle-wishes');
  if(await frame.locator('#toggle-wishes').getAttribute('aria-checked')==='true'){
    await frame.locator('#toggle-wishes').click();
    await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='false');
  }
  await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');
  await frame.waitForTimeout(700);
  assert.equal(await frame.locator('#studio-paging').isVisible(),false,'Die normalen Bediengruppen passen auf eine Seite');
  await frame.locator('#studio-topic').fill('Mein ungespeichertes Thema');
  const before=await frame.evaluate(()=>['studio-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  const sizeCount=sizes();
  await frame.locator('#toggle-wishes').click();
  await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='true');
  await frame.waitForTimeout(200);
  const geometry=await frame.evaluate(()=>({height:innerHeight,pager:!document.getElementById('studio-paging').hidden,
    area:[document.getElementById('studio-setup').clientHeight,document.getElementById('studio-setup').scrollHeight],
    parts:[...document.querySelectorAll('#studio-setup > .studio-part')].map(n=>({hidden:n.hidden,height:n.getBoundingClientRect().height})),
    notice:document.getElementById('notice').textContent}));
  assert.equal(geometry.pager,false,'Feedback darf keine zweite Seite erzeugen: '+JSON.stringify(geometry));
  assert.equal(await frame.locator('#studio-topic').isVisible(),true);
  assert.equal(await frame.locator('#on-air').isVisible(),true);
  assert.match(await frame.locator('#studio-wish-state').textContent(),/offen/);
  assert.equal(await frame.locator('#studio-wish-state').getAttribute('aria-live'),'polite');
  assert.equal(await frame.locator('#notice').isVisible(),false);
  assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
  assert.deepEqual(await frame.evaluate(()=>['studio-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  })),before,'Schalten verschiebt keine Bedienung');
  assert.equal(sizes(),sizeCount,'Keine neue Fenstergröße für die Erfolgsbestätigung');
  if(client==='stapp'&&sizing==='normal')await page.locator('#overlays iframe').screenshot({path:path.join(os.tmpdir(),'mischwerk-wunschbox-feedback.png')});
  await frame.locator('#toggle-wishes').click();
  await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='false');
  await frame.waitForTimeout(100);
  assert.match(await frame.locator('#studio-wish-state').textContent(),/geschlossen/);
  assert.equal(await frame.locator('#studio-paging').isVisible(),false);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__wishToggleAudio&&!__wishToggleAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3', 'stapp']) test('/settopic in '+client+' übernimmt Chat-KCode und erhält laufendes Audio', async t => {
  const lab = await setup(t, { provider: 'online' }), owner = await lab.join('Otterchen', client, 1280, false);
  lab.hub.runtime.command('Otterchen', 'vorhang', 'öffnen');
  await owner.radio.locator('#play-button:not([disabled])').click();
  await owner.radio.waitForFunction(() => document.getElementById('radio-audio').currentTime > .1);
  await owner.radio.evaluate(() => {
    window.__topicAudio = document.getElementById('radio-audio'); __topicAudio.loop = true;
    window.__topicLoads = 0; __topicAudio.addEventListener('loadstart', () => __topicLoads++);
  });
  const originalFrame = await owner.page.locator('#headerbars iframe').getAttribute('src');
  const raw = '°[230,199,123]°_Radio MischWerk_°r° ' +
    '°>{button}Lieblings-MyChannel|mw-lmc|call|/edit setlmc<° ' +
    '°>{button}Readme setzen|mw-readme|call|/readme Ich höre Radio MischWerk.<° ' +
    '°>{button}Channelinfo|mw-info|call|/info<° ' + 'Musik '.repeat(50);
  async function command(value) {
    await owner.page.locator('#chat-input').fill('/settopic '+value);
    await owner.page.locator('#chat-form button').click();
  }
  await command(raw);
  await assertEventually(() => lab.hub.runtime.channelTopic === raw);
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 1);
  assert.equal(lab.hub.trace.findLast(e => e.kind === 'channelTopic').showMessage, true);
  await command(raw);
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.includes('bereits eingestellt')));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 1);
  await command('--buttons');
  await assertEventually(() => lab.hub.runtime.channelTopic.includes('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|'));
  const serverTopic = lab.hub.runtime.channelTopic;
  assert.ok(serverTopic.includes('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|'));
  assert.ok(serverTopic.includes('°>{button}Readme setzen||call|/readme Ich höre Radio MischWerk.|color|'));
  assert.ok(serverTopic.includes('°>{button}Channelinfo||call|/info|color|'));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 2);
  await command('--pruefen');
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.startsWith('Gespeichertes Channel-Thema:')));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 2);
  lab.hub.runtime.users.find('Otterchen').state.role = 'listener';
  await command('Ohne Inhaberrecht');
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.includes('Nur Otterchen')));
  assert.equal(lab.hub.runtime.channelTopic, serverTopic);
  assert.equal(await owner.page.locator('#headerbars iframe').getAttribute('src'), originalFrame);
  assert.deepEqual(await owner.radio.evaluate(() => ({ same: __topicAudio === document.getElementById('radio-audio'),
    playing: !__topicAudio.paused, loads: __topicLoads })), { same: true, playing: true, loads: 0 });
  assert.deepEqual(lab.hub.runtime.errors, []); assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});


for (const client of ['k3', 'stapp']) {
  test('Dauerhafte Wünsche in '+client+' erhalten Entwurf bei Speicherfehler, Audio beim Speichern und Queue beim Neustart', async t => {
    const lab = await setup(t, { provider: 'online' }), { page, radio } = await lab.join('Otterchen', client, 1280, false);
    await radio.evaluate(() => Client.executeSlashCommand('/vorhang öffnen'));
    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(() => document.getElementById('radio-audio').currentTime > .1);
    await radio.evaluate(() => {
      window.__wishAudio = document.getElementById('radio-audio'); window.__wishLoads = 0;
      __wishAudio.addEventListener('loadstart', () => __wishLoads++);
    });
    await radio.locator('#open-wishes:not([disabled])').click();
    const wishes = await view(page, 'Overlay');
    await wishes.locator('#wish-text').fill('Erster gespeicherter Wunsch');
    lab.hub.faults.failPersistence = true;
    await wishes.locator('#submit-wish').click();
    await wishes.locator('#wish-feedback.error').waitFor();
    assert.equal(await wishes.locator('#wish-text').inputValue(), 'Erster gespeicherter Wunsch');
    lab.hub.faults.failPersistence = false;
    await wishes.locator('#submit-wish:not([disabled])').click();
    await wishes.locator('#wish-feedback.success').waitFor();
    const attempts = lab.hub.trace.filter(row => row.kind === 'clientEvent' && row.eventType === 'mw:wish.submit');
    assert.equal(attempts.length, 2); assert.equal(attempts[0].eventData.submissionId, attempts[1].eventData.submissionId);
    await wishes.locator('#wish-compose-open').click();
    await wishes.locator('#wish-text').fill('Zweiter gespeicherter Wunsch');
    await wishes.locator('#submit-wish').click(); await wishes.locator('#wish-feedback.success').waitFor();
    await wishes.locator('#close-wishes').click();
    await radio.locator('#studio-tab').click(); const studio = await overlayView(page, 'studio');
    await studio.locator('#studio-queue-tab').click();
    await studio.locator('[data-stage="preparing"]').click();
    await studio.waitForFunction(() => document.getElementById('request-queue').textContent.includes('Vorbereitung'));
    assert.deepEqual(await radio.evaluate(() => ({ same: __wishAudio === document.getElementById('radio-audio'),
      paused: __wishAudio.paused, loads: __wishLoads })), { same: true, paused: false, loads: 0 });
    const oldSource = await page.locator('#headerbars iframe').getAttribute('src');
    lab.hub.restart(false);
    await page.waitForFunction(old => document.querySelector('#headerbars iframe')?.getAttribute('src') !== old, oldSource);
    const restored = await view(page, 'Headerbar');
    await restored.locator('#own-wish-title').filter({ hasText: 'Erster gespeicherter Wunsch' }).waitFor();
    await restored.locator('#own-wish-more').filter({ hasText: '+1' }).waitFor();
    await restored.locator('#studio-tab').click(); const reopened = await overlayView(page, 'studio');
    await reopened.locator('#studio-queue-tab').click();
    await reopened.locator('#request-queue').filter({ hasText: 'Erster gespeicherter Wunsch' }).waitFor();
    assert.match(await reopened.locator('#request-queue').textContent(), /Vorbereitung/);
    assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
  });
}
async function openRadioAction(radio,button) {
  if(button==='team-tab') { assert.equal(await radio.locator('#team-tab').count(),0); await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung')); }
  // Nichtinhaber prüfen den unveränderten API-Weg; Inhaber öffnen wieder über die freigegebene Taste.
  else if(button==='open-schedule' && await radio.locator('#open-schedule').isDisabled()) { await radio.evaluate(()=>Client.sendEvent('mw:openSchedule',{})); }
  else { await radio.locator('#'+button+':not([disabled])').click(); }
}

async function openTicker(frame) {
  await frame.locator('#studio-ticker-tab').click();
  await frame.locator('#ticker-text').waitFor();
}

for(const client of ['k3','stapp'])test('Lauftextformular in '+client+' passt ohne Scrollbereich und hält alle Aktionen über Bereichsseiten erreichbar',async t=>{
 const lab=await setup(t,{hostSizing:'ignored'}),{page,radio}=await lab.join('Otterchen',client,320,false);
 await page.setViewportSize({width:1800,height:1200});
 await radio.locator('#studio-tab').click();let studio=await overlayView(page,'studio');await openTicker(studio);
 async function fits(){
  const result=await studio.evaluate(()=>{
   const panel=document.getElementById('studio-ticker-panel'),body=document.getElementById('ticker-body')||panel;
   const controls=[...panel.querySelectorAll('textarea,select,input,button')].filter(n=>n.getClientRects().length).map(n=>{
    const r=n.getBoundingClientRect();return {id:n.id,top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button,input,textarea,select')===n};
   });
   return {width:innerWidth,height:innerHeight,panel:panel.scrollHeight-panel.clientHeight,body:body.scrollHeight-body.clientHeight,overflow:getComputedStyle(panel).overflowY,document:document.documentElement.scrollHeight-innerHeight,controls};
  });
  assert.ok(result.panel<=1&&result.body<=1&&result.document<=1,'Inhalt passt ohne versteckten Überlauf: '+JSON.stringify(result));
  assert.equal(result.overflow,'hidden');
  assert.ok(result.controls.every(n=>n.top>=0&&n.bottom<=result.height+1&&n.left>=0&&n.right<=result.width+1&&n.hit),'Alle sichtbaren Felder sind erreichbar: '+JSON.stringify(result));
 }
 await fits();
 await studio.locator('#ticker-text').fill('Neue Infos für Radio MischWerk.');
 if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/moderation/moderation-lauftext-320.png')});
 const text='Vollständiger Lauftext mit Umlauten und Musik 🎵. '.repeat(8).slice(0,300);
 await studio.locator('#ticker-text').fill(text);assert.equal(await studio.locator('#ticker-count').textContent(),'300 / 300');await fits();
 assert.equal(await studio.locator('#ticker-paging').isVisible(),false,'Im normalen kompakten Overlay ist kein Bereichswechsel nötig');
 await page.locator('#overlays .app-window').evaluate(node=>{node.style.height='360px';});await studio.waitForFunction(()=>innerHeight===360);
 await studio.waitForFunction(()=>!document.getElementById('ticker-paging').hidden);
 await studio.locator('#ticker-text').focus();await studio.locator('#ticker-text').press('Tab');await studio.locator('#ticker-paging [data-part-next]').press('Enter');await studio.locator('#ticker-speed').waitFor();await fits();
 for(const id of ['ticker-text','ticker-speed','ticker-direction','ticker-enabled','ticker-save','ticker-reset']){await revealStudio(studio,'#'+id,'ticker');await fits();}
 await studio.locator('#ticker-reset').click();await studio.locator('#ticker-text').waitFor();
 assert.equal(await studio.locator('#ticker-text').evaluate(n=>n===document.activeElement),true,'Verwerfen kehrt zum Textfeld zurück');
 assert.equal(await studio.locator('#ticker-text').inputValue(),'');await fits();
 await studio.locator('#ticker-text').fill(text);await revealStudio(studio,'#ticker-enabled','ticker');await studio.locator('#ticker-enabled').check();
 await revealStudio(studio,'#ticker-save','ticker');lab.hub.faults.failPersistence=true;await studio.locator('#ticker-save').click();
 await studio.locator('#ticker-feedback.error').waitFor();await fits();lab.hub.faults.failPersistence=false;
 await studio.locator('#ticker-save').click();await studio.locator('#ticker-feedback').filter({hasText:'Lauftext gespeichert'}).waitFor();await fits();
 await revealStudio(studio,'#ticker-text','ticker');assert.equal(await studio.locator('#ticker-text').inputValue(),text.trim());
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp']) {
  test('Lauftext in '+client+' wird im Moderationsmenü für alle gespeichert und erhält laufendes Audio',async t=>{
    const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1280,false);
    await owner.radio.evaluate(()=>Client.executeSlashCommand('/vorhang öffnen'));
    await owner.radio.locator('#play-button:not([disabled])').click();
    await owner.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await owner.radio.evaluate(()=>{window.__tickerAudio=document.getElementById('radio-audio');window.__tickerLoads=0;__tickerAudio.addEventListener('loadstart',()=>__tickerLoads++);});
    const originalBar=await owner.radio.evaluate(()=>['radio-panel','play-button','radio-metadata','open-schedule','open-wishes','studio-tab'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()})));
    const originalGlowSpace=await owner.radio.evaluate(()=>innerHeight-document.querySelector('.radio-program-face').getBoundingClientRect().bottom);
    await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio');
    await openTicker(studio);
    await studio.locator('#ticker-text').fill('Du hörst Radio MischWerk. Dein Mix aus Musik und guter Laune. Bei geöffneter Wunschbox ist Platz für deinen Lieblingssong. Viel Spaß beim Zuhören! +++ '.repeat(3).slice(0,300));
    await studio.locator('#ticker-speed').selectOption('32');await studio.locator('#ticker-enabled').check();
    const checkbox=await studio.locator('#ticker-enabled').boundingBox();assert.ok(checkbox.width<=22&&checkbox.height<=22,'Kompakter Schalter innerhalb des 44-px-Labels');
    await studio.locator('#ticker-save').click();await studio.locator('#ticker-feedback').filter({hasText:'Lauftext gespeichert.'}).waitFor();
    await owner.radio.locator('#radio-ticker').waitFor();
    await owner.radio.evaluate(()=>document.fonts.ready);
    const face=await owner.radio.locator('#radio-ticker-track > span').first().evaluate(n=>({
      family:getComputedStyle(n).fontFamily,weight:getComputedStyle(n).fontWeight,
      loaded:[...document.fonts].some(f=>f.family==='Rajdhani'&&f.weight==='500'&&f.status==='loaded'),text:n.textContent
    }));
    assert.match(face.family,/Rajdhani/);assert.equal(face.weight,'500');assert.equal(face.loaded,true);
    assert.match(face.text,/^\+\+\+ .* \+\+\+$/);
    const glow=await owner.radio.evaluate(()=>({
      combined:document.getElementById('radio-deck')?getComputedStyle(document.getElementById('radio-deck'),'::before').animationName:null,
      duration:getComputedStyle(document.getElementById('radio-deck'),'::before').animationDuration,
      original:getComputedStyle(document.querySelector('.radio-program-face')).boxShadow,
      faceBackground:getComputedStyle(document.querySelector('.radio-program-face')).backgroundColor,
      faceBorder:getComputedStyle(document.querySelector('.radio-program-face')).borderBottomColor,
      lowerCorners:['borderBottomLeftRadius','borderBottomRightRadius'].map(key=>getComputedStyle(document.querySelector('.radio-program-face'))[key]),
      faceTexture:getComputedStyle(document.querySelector('.radio-program-face'),'::after').backgroundImage,
      glowSpace:innerHeight-document.getElementById('radio-ticker').getBoundingClientRect().bottom,
      texture:getComputedStyle(document.getElementById('radio-deck'),'::before').backgroundImage,
      tickerFont:getComputedStyle(document.querySelector('#radio-ticker-track > span')).fontSize,
      tickerBackground:getComputedStyle(document.getElementById('radio-ticker')).backgroundColor
    }));
    assert.equal(glow.combined,'mw-halo-rgb');assert.equal(glow.original,'none','Kein zweiter Glow zwischen Appleiste und Lauftext');
    assert.equal(glow.duration,'42s','Lauftext und Appleiste verwenden denselben leicht beschleunigten RGB-Zyklus');
    assert.equal(glow.faceBackground,'rgb(20, 20, 20)','Ursprüngliche Deckfläche bleibt als Mischhintergrund für das Logo erhalten');
    assert.notEqual(glow.faceBorder,'rgba(0, 0, 0, 0)','Unterer Appleistenrahmen bleibt sichtbar');
    assert.deepEqual(glow.lowerCorners,['0px','0px'],'Am Anschluss keine innenliegenden Rundungen oder Eckkeile');
    assert.match(glow.faceTexture,/repeating-radial-gradient/,'Appleiste behält ihr ursprüngliches Muster');
    assert.equal(glow.glowSpace,originalGlowSpace,'Unterer Glow erhält wieder denselben Auslauf wie vor dem Lauftext');
    assert.deepEqual(await owner.radio.evaluate(()=>['radio-panel','play-button','radio-metadata','open-schedule','open-wishes','studio-tab'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()}))),originalBar,'Lauftext verändert weder Maße noch Bedienelemente der Appleiste');
    assert.equal(glow.texture,'none','Gemeinsame Fläche unter der Laufleiste enthält kein Muster');
    assert.equal(glow.tickerFont,'20px','Größerer Lauftext bleibt in der 44-px-Leiste');
    assert.equal(glow.tickerBackground,'rgb(20, 20, 20)','Einfarbige Laufleiste deckt auch die überlappende Appleistendekoration ab');
    await owner.page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').animationName),'none');
    assert.notEqual(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').boxShadow),'none');
    await owner.page.emulateMedia({reducedMotion:'no-preference'});
    if(client==='k3') {
      await owner.page.setViewportSize({width:1800,height:1600});
      await studio.waitForTimeout(250);
      await studio.waitForFunction(()=>document.getElementById('ticker-save').getBoundingClientRect().bottom<=innerHeight&&document.getElementById('studio-programme-tabs').getBoundingClientRect().top>=0);
      const header=owner.page.locator('#headerbars iframe');
      await header.scrollIntoViewIfNeeded();
      await owner.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const camera=await header.boundingBox(),stage=await owner.page.locator('.stage-scroll').boundingBox();
      assert.ok(camera.y>=stage.y&&camera.y+camera.height<=stage.y+stage.height,'Vollständige Appleiste im sichtbaren Aufnahmebereich');
      const picture=await header.screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/radio/lauftext-1280.png'),animations:'disabled'});
      assert.ok(Math.abs(picture.readUInt32BE(20)-camera.height)<=1,'Vorschau enthält die gesamte Leistenhöhe');
      if(process.env.MISCHWERK_TICKER_CAPTURE){
        const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio');fs.mkdirSync(folder,{recursive:true});
        await owner.radio.locator('#radio-ticker').screenshot({path:path.join(folder,'Lauftext-Begrenzung.png'),animations:'disabled'});
      }
      await owner.page.locator('#overlays iframe').scrollIntoViewIfNeeded();
      await owner.page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/moderation/moderation-lauftext.png'),animations:'disabled'});
    }
    for(const width of [320,390,780,1280,2290,3840]){
      await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');
      await owner.radio.waitForTimeout(80);
      const geometry=await owner.radio.evaluate(()=>{
        const face=document.querySelector('.radio-program-face').getBoundingClientRect(),line=document.getElementById('radio-ticker').getBoundingClientRect();
        const deck=document.getElementById('radio-deck').getBoundingClientRect(),bar=document.getElementById('radio-panel').getBoundingClientRect();
        const text=document.querySelector('#radio-ticker-track > span'),textBox=text.getBoundingClientRect();
        const textWindow=document.getElementById('radio-ticker-window'),bounds=textWindow.getBoundingClientRect(),style=getComputedStyle(textWindow);
        const label=document.querySelector('.radio-ticker-label').getBoundingClientRect(),pause=document.getElementById('radio-ticker-pause').getBoundingClientRect();
        const fades=['::before','::after'].map(side=>getComputedStyle(textWindow,side));
        return {attached:Math.abs(face.bottom-line.top)<1,fits:deck.bottom<=innerHeight+1,
          bounded:parseFloat(style.borderLeftWidth)>0&&parseFloat(style.borderRightWidth)>0&&style.overflowX==='hidden',
          fades:fades.every(s=>s.content!=='none'&&s.pointerEvents==='none'&&s.backgroundImage.includes('linear-gradient')),
          separated:label.right<bounds.left&&bounds.right<pause.left,
          cleanCorners:['borderBottomLeftRadius','borderBottomRightRadius'].every(key=>parseFloat(getComputedStyle(document.querySelector('.radio-program-face'))[key])===0),
          glowFits:Math.abs(innerHeight-line.bottom-(bar.bottom-face.bottom+16))<1,
          font:parseFloat(getComputedStyle(text).fontSize),lineHeight:line.height,
          textFits:textBox.top>=line.top&&textBox.bottom<=line.bottom&&Math.abs((textBox.top+textBox.bottom-line.top-line.bottom)/2)<1,
          height:innerHeight,content:deck.height,controls:['play-button','open-schedule','open-wishes','studio-tab'].every(id=>{
            const r=document.getElementById(id).getBoundingClientRect();
            return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=line.top+1;
          })};
      });
      assert.ok(geometry.bounded&&geometry.fades&&geometry.separated&&geometry.attached&&geometry.cleanCorners&&geometry.fits&&geometry.glowFits&&geometry.controls&&geometry.textFits,JSON.stringify({client,width,...geometry}));
      assert.equal(geometry.font,width<=700?18:20,'Angepasste Schriftgröße bei '+width+' px');assert.equal(geometry.lineHeight,44,'Unveränderte Laufleistenhöhe');
      assert.ok(Math.abs(geometry.height-geometry.content)<=1,'Hosthöhe entspricht der tatsächlichen Gesamtfläche ohne Leerreserve');
    }
    await owner.page.locator('#width').fill('1280');await owner.page.locator('#width').dispatchEvent('change');
    await owner.radio.waitForFunction(()=>innerWidth===1280);
    const listener=await lab.join('Testhoerer',client,1280);
    await listener.radio.locator('#radio-ticker-readable').filter({hasText:'Du hörst Radio MischWerk.'}).waitFor({state:'attached'});
    assert.equal(await listener.radio.locator('#ticker-form').count(),0);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationDirection),'normal');
    const before=await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).transform);
    await listener.radio.waitForTimeout(150);
    assert.notEqual(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).transform),before);
    const tickerPause=listener.radio.locator('#radio-ticker-pause');
    assert.equal(await tickerPause.locator('svg').count(),1,'Echtes Pause-/Play-Symbol statt Schriftzeichen');
    assert.deepEqual(await tickerPause.locator('svg').evaluate(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,fill:getComputedStyle(n).fill,stroke:getComputedStyle(n).stroke})),{width:24,height:24,fill:'rgb(230, 199, 123)',stroke:'none'});
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),true);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),false);
    await tickerPause.click();
    assert.equal(await tickerPause.getAttribute('aria-pressed'),'true');
    assert.equal(await tickerPause.getAttribute('aria-label'),'Lauftext fortsetzen');
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),false);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),true);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
    await tickerPause.press('Space');
    assert.equal(await tickerPause.getAttribute('aria-pressed'),'false');
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),true);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),false);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationPlayState),'running');
    const literal='<img src=x onerror=alert(1)> Radio MischWerk';
    await studio.locator('#ticker-text').fill(literal);await studio.locator('#ticker-speed').selectOption('72');await studio.locator('#ticker-direction').selectOption('right');
    await studio.locator('#ticker-save').click();await listener.radio.waitForFunction(text=>document.getElementById('radio-ticker-readable').textContent===text,literal);
    assert.equal(await listener.radio.locator('#radio-ticker img').count(),0);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationDirection),'reverse');
    assert.equal(await owner.radio.evaluate(()=>__tickerAudio===document.getElementById('radio-audio')&&!__tickerAudio.paused&&__tickerLoads===0),true);
    await studio.locator('#ticker-enabled').uncheck();await studio.locator('#ticker-save').click();
    await listener.radio.locator('#radio-ticker').waitFor({state:'hidden'});await owner.radio.locator('#radio-ticker').waitFor({state:'hidden'});
    assert.equal(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').content),'none');
    assert.notEqual(await owner.radio.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).boxShadow),'none','Ohne Lauftext bleibt der ursprüngliche Halo erhalten');
    assert.equal(await owner.radio.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).borderBottomLeftRadius),'24px','Ohne Lauftext wieder ursprüngliche Rundungen');
    assert.equal(await studio.locator('#ticker-text').inputValue(),literal);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.hub.runtime.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Lauftextentwurf in '+client+' erhält Konflikte, Speicherfehler und Schließen; Rechteverlust sperrt ihn',async t=>{
    const lab=await setup(t),owner=await lab.join('Otterchen',client,1280,false);
    await owner.radio.evaluate(()=>Client.executeSlashCommand('/vorhang öffnen'));
    const runtime=lab.hub.runtime,header=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).nick==='Otterchen');
    runtime.event('Otterchen',header,'mw:addRadioModerator',{nick:'DJ-Test'});
    const dj=await lab.join('DJ-Test',client,1280);
    await owner.radio.locator('#studio-tab').click();const first=await overlayView(owner.page,'studio');
    await dj.radio.locator('#studio-tab').click();const second=await overlayView(dj.page,'studio');
    await openTicker(first);await openTicker(second);
    await first.evaluate(()=>{window.__tickerDrafts=0;const original=Client.sendEvent;Client.sendEvent=function(type,data){if(type==='mw:overlay.draft'&&data.state?.tickerDraft)__tickerDrafts++;return original.call(this,type,data);};});
    await first.locator('#ticker-text').pressSequentially('Mein ungespeicherter Entwurf',{delay:10});
    assert.equal(await first.evaluate(()=>__tickerDrafts),0,'Eingaben werden gebündelt statt pro Zeichen gesendet');
    await first.waitForTimeout(450);assert.equal(await first.evaluate(()=>__tickerDrafts),1,'Ein Entwurfsabgleich nach der Eingabepause');
    await second.locator('#ticker-text').fill('Bestätigter Text des anderen DJs');await second.locator('#ticker-enabled').check();await second.locator('#ticker-save').click();
    await first.locator('#ticker-reload').waitFor();assert.equal(await first.locator('#ticker-text').inputValue(),'Mein ungespeicherter Entwurf');
    await first.locator('#ticker-save').click();await first.locator('#ticker-feedback.error').waitFor();
    assert.equal(await first.locator('#ticker-text').inputValue(),'Mein ungespeicherter Entwurf');
    await first.locator('#ticker-reload').click();assert.equal(await first.locator('#ticker-text').inputValue(),'Bestätigter Text des anderen DJs');
    await first.locator('#ticker-text').fill('Bleibt bis zur Bestätigung privat');
    const write=runtime.persistence.write;runtime.persistence.write=()=>{throw Error('Synthetischer Speicherfehler');};
    await first.locator('#ticker-save').click();await first.locator('#ticker-feedback.error').waitFor();runtime.persistence.write=write;
    assert.equal(await first.locator('#ticker-text').inputValue(),'Bleibt bis zur Bestätigung privat');
    assert.equal(await owner.radio.locator('#radio-ticker-readable').textContent(),'Bestätigter Text des anderen DJs');
    await first.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});
    await owner.radio.locator('#studio-tab').click();const reopened=await overlayView(owner.page,'studio');await openTicker(reopened);
    assert.equal(await reopened.locator('#ticker-text').inputValue(),'Bleibt bis zur Bestätigung privat');
    runtime.event('Otterchen',header,'mw:removeRadioModerator',{userId:runtime.users.find('DJ-Test').state.id});
    await dj.radio.locator('#studio-tab').waitFor({state:'hidden'});
    assert.ok(!await second.locator('#ticker-save').isEnabled());
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Lauftext in '+client+' passt bei langen Texten und reduziert Bewegung; begrenzte Hosthöhe bleibt erreichbar',async t=>{
    const lab=await setup(t,{hostSizing:'ignored'}),owner=await lab.join('Otterchen',client,320,false);
    await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio');await openTicker(studio);
    const text='UngetrennterLauftext'.repeat(16).slice(0,300);
    await studio.locator('#ticker-text').fill(text);await studio.locator('#ticker-enabled').check();await studio.locator('#ticker-save').click();
    await owner.radio.locator('#radio-ticker').waitFor();
    for(const width of [320,390,780,1280,3840]){
      await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');
      await owner.radio.waitForTimeout(80);
      assert.equal(await owner.radio.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,width+' px');
      const joined=await owner.radio.evaluate(()=>{
        const main=document.querySelector('.radio-program-face').getBoundingClientRect(),ticker=document.getElementById('radio-ticker').getBoundingClientRect();
        const deck=document.getElementById('radio-deck'),bounds=deck.getBoundingClientRect(),style=getComputedStyle(deck,'::before');
        return Math.abs(ticker.top-main.bottom)<1&&Math.abs(ticker.left-bounds.left-parseFloat(style.left))<1&&
          Math.abs(bounds.right-parseFloat(style.right)-ticker.right)<1&&Math.abs(bounds.bottom-parseFloat(style.bottom)-ticker.bottom)<1;
      });
      assert.equal(joined,true,'Laufleiste ohne Leerstreifen am sichtbaren Appleistenrahmen und gemeinsamer Glow darunter bei '+width+' px');
      await owner.radio.locator('#radio-ticker-pause').scrollIntoViewIfNeeded();
      assert.equal(await owner.radio.locator('#radio-ticker-pause').isVisible(),true);
    }
    await owner.page.locator('#width').fill('320');await owner.page.locator('#width').dispatchEvent('change');
    await owner.radio.waitForFunction(()=>innerWidth===320);
    await owner.page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await owner.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationName),'none');
    assert.equal(await owner.radio.locator('#radio-ticker-window').evaluate(n=>['::before','::after'].every(side=>getComputedStyle(n,side).display==='none')),true,'Statischer Text bleibt ohne verdeckende Randverläufe vollständig lesbar');
    assert.equal(await owner.radio.locator('#radio-ticker-readable').textContent(),text);
    assert.equal(await owner.radio.locator('#radio-ticker-track>span').first().evaluate(n=>n.scrollWidth>n.clientWidth),false);
    assert.equal(await owner.radio.evaluate(()=>{
      const text=document.querySelector('#radio-ticker-track>span').getBoundingClientRect(),line=document.getElementById('radio-ticker').getBoundingClientRect();
      return text.width<=document.getElementById('radio-ticker-window').clientWidth+1&&text.height<=line.height;
    }),true,'Reduzierte Bewegung zeigt den vollständigen Text umgebrochen');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {
  test('Echtes Audioende vor ended verbindet in '+client+' ohne neuen Klick wieder',async t=>{
    const lab=await setup(t,{provider:'online'}),{radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{window.__endEvents=[];window.__starts=0;const a=document.getElementById('radio-audio');
      a.addEventListener('pause',()=>__endEvents.push({ended:a.ended,time:a.currentTime}),true);a.addEventListener('loadstart',()=>__starts++);});
    await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='73';n.dispatchEvent(new Event('input'));});
    await radio.waitForFunction(()=>__starts>=2&&document.getElementById('radio-audio').currentTime>.2,null,{timeout:18000});
    assert.ok(await radio.evaluate(()=>__endEvents.some(e=>e.ended&&e.time===12)),'Echter Browser-pause vor ended');
    assert.equal(await radio.locator('#play-button').getAttribute('aria-pressed'),'true');assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.73);
    assert.equal(await radio.locator('#notice').isVisible(),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Vier Sekunden HTTP-Lücke bleiben in '+client+' mit vorhandener Reserve ohne Wiedergabepause',async t=>{
    const lab=await setup(t,{provider:'online'}),original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();let requests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(fn=>fn(request,response));return;}
      requests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});const cut=44+44100*2*8;response.write(audio.subarray(0,cut));
      const timer=setTimeout(()=>{timers.delete(timer);if(!response.destroyed)response.end(audio.subarray(cut));},4000);timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{window.__gaps=[];const a=document.getElementById('radio-audio');for(const type of ['pause','waiting','error'])a.addEventListener(type,()=>{if(a.currentTime>.1)__gaps.push(type);});});
    await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>6,null,{timeout:12000});
    assert.deepEqual(await radio.evaluate(()=>__gaps),[]);assert.equal(requests,1);assert.equal(await radio.locator('#stream-label').textContent(),'LIVE');assert.deepEqual(lab.errors,[]);
  });
  test('Abgerissene HTTP-Verbindung wird in '+client+' automatisch erneuert; Stop beendet sie dauerhaft',async t=>{
    const lab=await setup(t,{provider:'online'}),original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();let requests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(fn=>fn(request,response));return;}
      requests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});
      if(requests>1){response.end(audio);return;}response.write(audio.subarray(0,44+44100*2*3));
      const timer=setTimeout(()=>{timers.delete(timer);response.destroy();},2000);timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {radio}=await lab.join('Otterchen',client);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='73';n.dispatchEvent(new Event('input'));});await radio.locator('#mute-button').click();
    await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>4,null,{timeout:25000});
    assert.ok(requests>=2&&requests<=3,requests);assert.equal(await radio.locator('#play-button').getAttribute('aria-pressed'),'true');assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),0);
    await radio.locator('#mute-button').click();assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.73);
    await radio.locator('#play-button').click();const count=requests;await new Promise(r=>setTimeout(r,1500));assert.equal(requests,count);assert.equal(await radio.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Kurze echte HTTP-Nachladelücke übersteht '+client+' ohne neue Audioverbindung',async t=>{
    const lab=await setup(t,{provider:'online'},true);
    const original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();
    let audioRequests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(handler=>handler(request,response));return;}
      audioRequests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});
      const cut=44+44100*2*3;response.write(audio.subarray(0,cut));
      const timer=setTimeout(()=>{timers.delete(timer);if(!response.destroyed)response.end(audio.subarray(cut));},6000);
      timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {page,radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{
      const a=document.getElementById('radio-audio');window.__gapEvents=[];window.__playCalls=0;
      const play=a.play;a.play=function(){window.__playCalls++;return play.apply(this,arguments);};
      for(const type of ['playing','waiting','pause','error'])a.addEventListener(type,()=>__gapEvents.push({type,time:a.currentTime}));
    });
    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='43';n.dispatchEvent(new Event('input'));});
    const source=await radio.locator('#radio-audio').getAttribute('src');
    await radio.waitForFunction(()=>__gapEvents.some(e=>e.type==='waiting'&&e.time>.1),null,{timeout:12000});
    await radio.waitForFunction(()=>__gapEvents.filter(e=>e.type==='playing').length>=2&&document.getElementById('radio-audio').currentTime>3.2);
    await page.clock.runFor(21000);
    assert.equal(await radio.locator('#radio-audio').getAttribute('src'),source);
    assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.paused),false);
    assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.43);
    assert.equal(await radio.locator('#stream-label').textContent(),'LIVE');
    assert.equal(await radio.evaluate(()=>__playCalls),1,'Keine eigene play-/Wiederverbindungsschleife');
    assert.equal(audioRequests,1);assert.equal(await radio.locator('#notice').isVisible(),false);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp'])for(const initialWidth of [320,780])test('Studio ohne Verlängerung in '+client+' bei '+initialWidth+' px bleibt nach 48 Stunden aktiv und erhält Audio sowie erreichbare Kernaktionen',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,initialWidth);
 await radio.evaluate(()=>Client.executeSlashCommand('/vorhang öffnen'));
 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
 await radio.evaluate(()=>{window.__studioAudio=document.getElementById('radio-audio');__studioAudio.loop=true;window.__studioLoads=0;__studioAudio.addEventListener('loadstart',()=>__studioLoads++);});
 await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
 assert.equal(await studio.locator('#on-air').textContent(),'Anmelden');await studio.locator('#on-air').click();
 await studio.locator('#off-air:not([disabled])').waitFor();const before=lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator;
 assert.equal('expiresAt' in before,false);assert.equal('openEnd' in before,false);
 for(const width of [initialWidth]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await studio.waitForFunction(w=>innerWidth===Math.min(w,640),width);
  assert.equal(await studio.locator('#on-air').isVisible(),false);
  assert.equal(await studio.locator('#studio-session,#studio-timing,#studio-end-form').count(),0);
  assert.doesNotMatch(await studio.locator('#studio-programme').innerText(),/Endzeit|Angemeldet bis|Studiozeit|Noch .*Min\./);
  for(const id of ['off-air','handover-open']){const button=studio.locator('#'+id);if(await button.isVisible()){
   await button.scrollIntoViewIfNeeded();const b=await button.evaluate(n=>n.getBoundingClientRect().toJSON());assert.ok(b.height>=44);assert.ok(b.x>=0&&b.x+b.width<=width+1);
   assert.equal(await button.evaluate(n=>{const b=n.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===n;}),true);
  }}
 }
 lab.hub.runtime.clock.advance(48*3600000);await studio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
 await studio.locator('#off-air:not([disabled])').waitFor();assert.deepEqual(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator,before);
 await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));await overlayView(page,'team');
 await radio.locator('#studio-tab').click();studio=await overlayView(page,'studio');assert.equal(await studio.locator('#on-air').isVisible(),false);
 await page.locator('#overlays .app-window').screenshot({path:require('node:path').join(require('node:os').tmpdir(),'MischWerk-Build269-'+client+'-'+initialWidth+'.png')});
 await studio.locator('#off-air').click();await studio.locator('#on-air:not([disabled])').waitFor();
 assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator,null);
 assert.deepEqual(await radio.evaluate(()=>({same:__studioAudio===document.getElementById('radio-audio'),paused:__studioAudio.paused,loads:__studioLoads})),{same:true,paused:false,loads:0});
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Alle Overlaylogos sind in '+client+' groß und vollständig sichtbar, mit mittigem Titel und freiem Schließen', async t => {
  const lab=await setup(t,{},false,{deviceScaleFactor:client==='stapp'?2:1}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1600});
  async function assertHeader(frame,minimum) {
    await frame.evaluate(()=>document.fonts.ready);
    const geometry=await frame.evaluate(()=>{
      const head=[...document.querySelectorAll('.dialog-header')].find(node=>node.getClientRects().length);
      const logo=head.querySelector('.dialog-brand img'),heading=head.querySelector('.dialog-heading'),close=head.querySelector('button'),brand=head.querySelector('.dialog-brand');
      const range=document.createRange();range.selectNodeContents(heading.querySelector('h1,h2'));
      const rect=node=>node.getBoundingClientRect().toJSON();
      const point=close.getBoundingClientRect();
      return {logo:rect(logo),head:rect(head),heading:rect(heading),close:rect(close),brand:rect(brand),text:range.getBoundingClientRect().toJSON(),
        fit:getComputedStyle(logo).objectFit,blend:getComputedStyle(logo).mixBlendMode,background:getComputedStyle(logo).backgroundColor,
        source:logo.getAttribute('src'),hit:document.elementFromPoint(point.x+point.width/2,point.y+point.height/2)?.closest('button')===close,
        width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.ok(geometry.logo.width>=minimum,'Erkennbares Logo: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.logo.width-geometry.logo.height)<.1,'Quadratische, proportional gefüllte Bildfläche');
    assert.ok(geometry.logo.top>=geometry.head.top+1&&geometry.logo.bottom<=geometry.head.bottom-1,'Logo nicht vertikal beschnitten');
    assert.ok(geometry.logo.right<geometry.brand.right&&geometry.logo.right+4<=geometry.text.left,'Logo vor Trennlinie und Titel');
    assert.ok(geometry.text.right+4<=geometry.close.left&&geometry.text.top>=geometry.head.top&&geometry.text.bottom<=geometry.head.bottom,'Titel bleibt vom Schließen getrennt');
    assert.ok(Math.abs(geometry.heading.x+geometry.heading.width/2-geometry.head.x-geometry.head.width/2)<1,'Titel exakt mittig');
    assert.ok(geometry.close.width>=44&&geometry.close.height>=44&&geometry.hit,'Schließen bleibt direkt bedienbar');
    assert.equal(geometry.overflow,false);assert.equal(geometry.fit,'contain');assert.equal(geometry.blend,'lighten');
    assert.equal(geometry.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.source,'img/mischwerk-logo.png');
    return geometry;
  }
  for(const [button,kind] of [['open-wishes','wishes'],['studio-tab','studio'],['team-tab','team'],['open-schedule','schedule']]) {
    await page.locator('#width').fill('1280');await page.locator('#width').dispatchEvent('change');
    await openRadioAction(radio,button);const frame=await overlayView(page,kind);
    await assertHeader(frame,64);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
    await frame.waitForFunction(()=>innerWidth===320);await assertHeader(frame,64);
    if(kind==='team') {
      await frame.locator('#team-texts-tab').click();
      await page.locator('#overlays iframe').evaluate(node=>{node.style.height='350px';});
      await frame.waitForFunction(()=>innerHeight===350);
      const short=await assertHeader(frame,64);assert.equal(short.head.height,76,'Einheitlicher Kopf behält auch im niedrigen Host seine Höhe');
    }
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Neue Sendeoptionen behalten in '+client+' ihren Entwurf beim Overlaywechsel und speichern AutoDJ', async t => {
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,1280,false);
  assert.equal(await radio.locator('#open-schedule').isEnabled(),true,'Otterchen als Inhaber braucht keinen zusätzlichen Radio-Team-Eintrag');
  assert.equal(await radio.locator('#schedule-button-caption').isHidden(),true);
  await page.setViewportSize({width:1800,height:1400});
  await openRadioAction(radio,'open-schedule');let schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-new').click();
  await schedule.locator('#schedule-nick').fill('Polaroid');
  await schedule.locator('#schedule-kind').selectOption('autodj');
  await schedule.locator('#schedule-timing').selectOption('openEnd');
  await schedule.locator('#schedule-start').fill('22:30');
  await schedule.locator('#schedule-topic').fill('Nacht mit MischWerk');
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));await overlayView(page,'team');
  await openRadioAction(radio,'open-schedule');schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-form').waitFor({state:'visible'});
  assert.equal(await schedule.locator('#schedule-kind').inputValue(),'autodj');
  assert.equal(await schedule.locator('#schedule-timing').inputValue(),'openEnd');
  assert.equal(await schedule.locator('#schedule-start').inputValue(),'22:30');
  assert.equal(await schedule.locator('#schedule-end').isVisible(),false);
  assert.equal(await schedule.locator('#schedule-topic').inputValue(),'Nacht mit MischWerk');
  await schedule.locator('#schedule-kind').selectOption('live');
  assert.equal(await schedule.locator('#schedule-nick').inputValue(),'Polaroid','Live-Nick über AutoDJ und Overlaywechsel erhalten');
  await schedule.locator('#schedule-kind').selectOption('autodj');
  await schedule.locator('#schedule-timing').selectOption('allDay');
  const date=await schedule.locator('#schedule-date').inputValue();
  await schedule.locator('#schedule-save:not([disabled])').click();await schedule.locator('#schedule-form').waitFor({state:'hidden'});
  const monday=lab.hub.runtime.persistence.api().getObject('mischwerk.schedule.v1.weeks')[0];
  const entry=lab.hub.runtime.persistence.api().getObject('mischwerk.schedule.v1.'+monday).entries[0];
  assert.deepEqual([entry.date,entry.kind,entry.timing,entry.nick,entry.userId,entry.start,entry.end],
    [date,'autodj','allDay','MischWerk',null,'00:00','00:00']);
  const account=lab.hub.runtime.users.find('Otterchen');account.state.role='listener';
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.waitForFunction(()=>document.getElementById('open-schedule').disabled &&
    !document.getElementById('schedule-button-caption').hidden);
  account.state.role='owner';
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.waitForFunction(()=>!document.getElementById('open-schedule').disabled &&
    document.getElementById('schedule-button-caption').hidden);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='botPublic').length,0,'Planung sendet keine echte Studiomeldung');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte scrollen in '+client+' ausschließlich im festen Inhaltsbereich', async t => {
  const lab=await setup(t,{},false,{deviceScaleFactor:client==='stapp'?2:1}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1400});
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  assert.equal(await team.locator('#channel-texts-scroll').count(),1,'Genau eine eigene Inhalts-Scrollfläche');
  const pane=team.locator('#channel-texts-scroll');
  for(let i=0;i<4;i++)await team.locator('#channel-texts-add').click();
  const long=Array.from({length:16},(_,i)=>'Nachricht Zeile '+(i+1)).join('\n');
  for(const field of await team.locator('#channel-texts-fields textarea').all())await field.fill(long);
  const fixed=()=>team.evaluate(()=>['.dialog-header','.team-tabs','.channel-texts-actions'].map(selector=>{
    const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  for(const width of [560,390,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await team.waitForTimeout(100);
    assert.ok(await team.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1),'Dokument bewegt sich nicht');
    const fields=await team.locator('#channel-texts-fields textarea').evaluateAll(nodes=>nodes.map(n=>({height:n.clientHeight,content:n.scrollHeight,overflow:getComputedStyle(n).overflowY,font:parseFloat(getComputedStyle(n).fontSize)})));
    assert.ok(fields.every(n=>n.height>=n.content-1&&n.overflow==='hidden'&&n.font>=16),JSON.stringify(fields));
    const field=team.locator('#channel-texts-fields textarea').first();await field.evaluate(n=>n.scrollIntoView({block:'start'}));
    const before=await fixed(),initial=await pane.evaluate(n=>n.scrollTop),box=await field.boundingBox(),clip=await pane.boundingBox();
    await page.mouse.move(box.x+25,Math.max(box.y,clip.y)+25);await page.mouse.wheel(0,160);await page.waitForTimeout(100);
    assert.ok(await pane.evaluate(n=>n.scrollTop)>initial,'Auch über einem Textfeld scrollt dieselbe Inhaltsfläche');
    assert.equal(await field.evaluate(n=>n.scrollTop),0,'Kein inneres Textfeldscrollen');assert.deepEqual(await fixed(),before);
    await pane.evaluate(n=>{n.scrollTop=n.scrollHeight;});const bottom=await pane.evaluate(n=>n.scrollTop);
    await page.mouse.wheel(0,600);await page.waitForTimeout(100);assert.equal(await pane.evaluate(n=>n.scrollTop),bottom);
    assert.equal(await team.evaluate(()=>scrollY),0,'Am Scrollrand kein Sprung zum Dokument');assert.deepEqual(await fixed(),before);
    // Edge lässt Mausradimpulse nachlaufen; die folgende Aktualisierungsprüfung beginnt nach diesem separaten Vorgang.
    await team.waitForTimeout(450);
    await field.focus();await field.press('Control+End');await field.press('Enter');
    await field.evaluate(n=>{n.value=n.value.slice(0,294);n.setSelectionRange(n.value.length,n.value.length);n.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.ok(await field.evaluate(n=>{const r=n.getBoundingClientRect(),p=document.getElementById('channel-texts-scroll').getBoundingClientRect();return r.bottom<=p.bottom+1;}),'Ende des wachsenden Textes bleibt erreichbar');
    await field.press('Control+Home');assert.ok(await field.evaluate(n=>{const r=n.getBoundingClientRect(),p=document.getElementById('channel-texts-scroll').getBoundingClientRect();return r.top>=p.top-1;}));
    await team.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await pane.evaluate(n=>{n.scrollTop=Math.min(450,n.scrollHeight-n.clientHeight);});
    await team.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    const position=await pane.evaluate(n=>n.scrollTop);
    await team.locator('#channel-texts-refresh').click();await team.waitForFunction(()=>document.getElementById('channel-texts-refresh').getAttribute('aria-disabled')==='false');
    const refreshed=await pane.evaluate(n=>n.scrollTop);
    assert.ok(Math.abs(refreshed-position)<2,'Aktualisieren versetzt den Inhalt nicht: '+position+' → '+refreshed);
  }
  lab.hub.faults.failPersistence=true;await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'konnten nicht gespeichert'}).waitFor();
  assert.ok(await team.locator('#channel-texts-feedback').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  lab.hub.faults.failPersistence=false;
  const position=await pane.evaluate(n=>n.scrollTop);await team.locator('#team-members-tab').click();assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
  await team.locator('#team-texts-tab').click();assert.ok(Math.abs(await pane.evaluate(n=>n.scrollTop)-position)<2);
  await team.locator('#channel-texts-save').click();await team.locator('#channel-texts-feedback').filter({hasText:'Bot-Texte gespeichert.'}).waitFor();
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').texts.length,6);
  await page.setViewportSize({width:1800,height:550});await page.waitForTimeout(100);
  assert.ok(await pane.evaluate(n=>n.clientHeight>=50),'Auch im begrenzten Host bleibt ein nutzbarer Inhaltsbereich');
  assert.equal(await team.evaluate(()=>scrollY),0);
  for(const id of ['channel-texts-refresh','close-overlay'])assert.ok(await team.locator('#'+id).evaluate(n=>{
    const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&hit&&hit.closest('button')===n;
  }));
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' speichern, rotieren und erhalten Entwurf, Rechte und Audio', async t => {
  const lab=await setup(t,{provider:'online'}), {page,radio}=await lab.join('Otterchen',client,1280);
  const greetings=lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message);
  assert.equal(greetings.length,1);
  assert.equal(greetings[0], "°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>Otterchen|/w Otterchen<°._°r° Viel Spaß beim Zuhören.");
  await page.setViewportSize({width:1800,height:1400});
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__botTextsAudio=document.getElementById('radio-audio');});
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));let team=await overlayView(page,'team');
  assert.equal(await team.locator('#dialog-title').textContent(),'Verwaltung');
  await team.locator('#team-texts-tab').click();
  await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  assert.equal(await team.locator('#channel-texts-enabled').isChecked(),false);
  assert.deepEqual(await team.locator('#channel-texts-interval option').allTextContents(),['20 Minuten','30 Minuten','40 Minuten','50 Minuten']);
  await team.locator('#channel-texts-fields textarea').nth(0).fill('Erster Channeltext');
  await team.locator('#channel-texts-fields textarea').nth(1).fill('Zweiter Channeltext');
  await team.locator('#channel-texts-interval').selectOption('30');
  await team.locator('#channel-texts-enabled').check();
  await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Erste Ausgabe in 30 Minuten'}).waitFor();
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),greetings);
  lab.hub.runtime.clock.advance(30*60000);
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext']);
  lab.hub.runtime.clock.advance(30*60000);
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext','Zweiter Channeltext']);
  await team.locator('#channel-texts-enabled').uncheck();await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'ausgeschaltet'}).waitFor();
  lab.hub.runtime.clock.advance(50*60000);assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext','Zweiter Channeltext']);
  await team.locator('#channel-texts-fields textarea').nth(0).fill('Mein ungespeicherter Bot-Text');
  await team.locator('#channel-texts-refresh').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Mein ungespeicherter Bot-Text');
  await openRadioAction(radio,'open-schedule');await overlayView(page,'schedule');
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#team-texts-tab').getAttribute('aria-selected'),'true');
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Mein ungespeicherter Bot-Text');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__botTextsAudio&&!window.__botTextsAudio.paused),true);
  await team.locator('#team-members-tab').click();assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
  await team.locator('#team-members-tab').press('ArrowRight');assert.equal(await team.locator('#channel-texts-form').isVisible(),true);
  for(let i=0;i<4;i++)await team.locator('#channel-texts-add').click();
  assert.equal(await team.locator('#channel-texts-fields textarea').count(),6);assert.equal(await team.locator('#channel-texts-add').isDisabled(),true);
  await team.locator('#channel-texts-fields button').last().click();assert.equal(await team.locator('#channel-texts-fields textarea').count(),5);
  lab.hub.runtime.users.find('Otterchen').state.role='listener';
  await team.locator('#channel-texts-refresh').click();
  await team.locator('#team-panel').waitFor({state:'hidden'});
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'');
  assert.equal(await team.locator('#channel-texts-save').isDisabled(),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' bleiben bei 560 und 320 Pixeln erreichbar und behalten Fehlerentwürfe', async t => {
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,1280);
  await page.setViewportSize({width:1800,height:1400});
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-fields textarea').nth(0).fill('Ein Text für unsere Hörerinnen und Hörer.');
  await team.locator('#channel-texts-fields textarea').nth(1).fill('Deinen Musikwunsch kannst du in der Wunschbox abgeben.');
  lab.hub.faults.failPersistence=true;await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'konnten nicht gespeichert'}).waitFor();
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Ein Text für unsere Hörerinnen und Hörer.');
  lab.hub.faults.failPersistence=false;
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await team.waitForTimeout(100);
    assert.equal(await team.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const metrics=await team.evaluate(()=>Array.from(document.querySelectorAll('#channel-texts-form textarea,#channel-texts-form select,#channel-texts-save')).map(n=>{
      const r=n.getBoundingClientRect();return {width:r.width,height:r.height,font:parseFloat(getComputedStyle(n).fontSize),button:n.tagName==='BUTTON'};
    }));
    assert.ok(metrics.every(m=>m.width>44&&m.height>=44&&m.font>=(m.button?14:16)),JSON.stringify(metrics));
    await team.locator('#channel-texts-save').scrollIntoViewIfNeeded();assert.equal(await team.locator('#channel-texts-save').isVisible(),true);
    if(process.env.MISCHWERK_DESIGN_CAPTURE&&client==='k3') {
      await team.evaluate(()=>window.scrollTo(0,0));
      await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
    }
  }
  await team.locator('#channel-texts-save').click();await team.locator('#channel-texts-feedback').filter({hasText:'gespeichert'}).waitFor();
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' schützen ungespeicherte Eingaben bei einer neueren Serverrevision', async t => {
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client);
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-fields textarea').first().fill('Mein noch nicht gespeicherter Entwurf');
  await team.evaluate(()=>Client.sendEvent('mw:channelTexts.save',{requestId:'other-owner-edit',view:'team',viewRevision:1,
    expectedRevision:0,enabled:false,interval:50,texts:['Inzwischen gespeicherter Text']}));
  await team.locator('#channel-texts-reload').waitFor({state:'visible'});
  assert.ok(await team.locator('#channel-texts-reload').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight&&hit&&hit.closest('button')===n;}));
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Mein noch nicht gespeicherter Entwurf');
  assert.equal(await team.locator('#channel-texts-save').isDisabled(),true);
  await team.locator('#channel-texts-refresh').click();
  await team.waitForFunction(()=>document.getElementById('channel-texts-refresh').getAttribute('aria-disabled')==='false');
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Mein noch nicht gespeicherter Entwurf');
  await team.locator('#channel-texts-reload').click();
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Inzwischen gespeicherter Text');
  assert.equal(await team.locator('#channel-texts-interval').inputValue(),'50');
  await team.locator('#channel-texts-fields textarea').first().fill('Überarbeiteter bestätigter Stand');
  await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Bot-Texte gespeichert. Automatische Ausgabe ist ausgeschaltet.'}).waitFor();
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').revision,2);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Bot-Texte erhalten bei verlorener Speicherquittung die globale Hinweisbox und einen erreichbaren Wiederanlauf', async t => {
  const lab=await setup(t,{},true),{page,radio}=await lab.join('Otterchen','k3');
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-fields textarea').first().fill('Text mit verlorener Bestätigung');
  lab.hub.faults.dropServerType='mw:result';lab.hub.faults.dropServer=1;
  await team.locator('#channel-texts-save').click();
  await page.clock.runFor(15010);
  await team.locator('#channel-texts-reload').waitFor({state:'visible'});
  assert.equal(await team.locator('#notice').count(),1,'Feedback-Neuzeichnung erhält die gemeinsame Hinweisbox');
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Text mit verlorener Bestätigung');
  await team.locator('#channel-texts-reload').click();await team.locator('#team-members-tab').click();
  await team.locator('#radio-moderator-nick').fill('Unbekannter-Nick');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-form #notice').waitFor({state:'visible'});
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored','clamped'])test('Kompakte Moderation in '+client+' bei '+sizing+' behält Text, Fokus und stabile Größen',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:sizing==='clamped'?'normal':sizing}),{page,radio}=await lab.join('Otterchen',client,sizing==='clamped'?320:2290);
  if(sizing==='clamped')await page.setViewportSize({width:1800,height:550});
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__compactAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab').click();const frame=await overlayView(page,'studio');await frame.waitForTimeout(700);
  const compact=await frame.evaluate(()=>innerHeight);
  if(sizing==='ignored')assert.equal(compact,580);
  else if(sizing!=='clamped')assert.ok(compact<650,'Leere Sendezeiten hinterlassen keine 730-px-Leerreserve');
  await revealStudio(frame,'#studio-topic');await frame.waitForTimeout(500);
  // Der scrollbare Laborrahmen ist keine native Overlaybewegung: im Channel messen.
  const outer=()=>page.evaluate(()=>{const frame=document.querySelector('#overlays iframe').getBoundingClientRect(),channel=document.getElementById('channel').getBoundingClientRect();return [frame.x-channel.x,frame.y-channel.y,frame.width,frame.height];});
  const topicGeometry=()=>frame.evaluate(()=>['studio-topic','save-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  const initialOuter=await outer(),initialTopic=await topicGeometry();
  const initialSizes=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  await frame.locator('#studio-topic').fill('Mein ungespeicherter Themenentwurf');
  await frame.waitForTimeout(500);
  const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize');
  const before=sizes().length;await frame.waitForTimeout(700);assert.equal(sizes().length,before,'Keine wiederholten Größenaufträge');
  assert.equal(before,initialSizes,'Eingabe sendet keinen Größenauftrag');
  assert.deepEqual(await outer(),initialOuter,'Overlay bleibt beim Eingeben am selben Ort und gleich groß');
  assert.deepEqual(await topicGeometry(),initialTopic,'Bedienelemente bleiben beim Eingeben unverändert');
  assert.equal(await frame.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);
  await frame.locator('#studio-history-tab').click();await frame.waitForTimeout(600);
  assert.ok(await frame.evaluate(()=>innerHeight>0&&innerHeight<=580),'Historie bleibt vollständig innerhalb der anfänglich verfügbaren Höhe');
  assert.doesNotMatch(await frame.locator('#history-panel').textContent(),/Senderzeit in deutscher Ortszeit|Ton und Titel können zeitversetzt/);
  await frame.locator('#studio-programme-tab').click();await frame.waitForTimeout(600);await revealStudio(frame,'#studio-topic');
  assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein ungespeicherter Themenentwurf');
  await frame.waitForTimeout(500);const saveOuter=await outer(),saveTopic=await topicGeometry(),saveSizes=sizes().length;
  await frame.locator('#save-topic').click();await frame.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();await frame.waitForTimeout(500);
  assert.equal(sizes().length,saveSizes,'Speichern und bestätigter Zustand senden keinen Größenauftrag');
  assert.deepEqual(await outer(),saveOuter,'Overlay bleibt nach dem Speichern gleich groß und am selben Ort');
  assert.deepEqual(await topicGeometry(),saveTopic,'Speichern verschiebt keine Bedienelemente');
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__compactAudio&&!window.__compactAudio.paused),true);
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Moderationshistorie erhält in '+client+' native Studio-/Kalenderentwürfe sowie Audio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__historyAudio=document.getElementById('radio-audio');});
  await openRadioAction(radio,'open-schedule');const plan=await overlayView(page,'schedule');
  await plan.locator('#schedule-new').click();await plan.locator('#schedule-topic').fill('Mein ungespeicherter Sendeplanentwurf');
  await plan.evaluate(()=>{window.__historyDocument=document;});
  assert.equal(await plan.locator('#schedule-panel [role=tab]').count(),0,'Der öffentliche Sendeplan enthält keine Historienreiter');
  await radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(page,'studio');
  assert.equal(await studio.evaluate(()=>document===window.__historyDocument),false);
  await studio.locator('#studio-topic').fill('Mein Studioentwurf');await studio.locator('#studio-topic').dispatchEvent('input');
  await studio.locator('#studio-history-tab').click();await studio.locator('#history-list li span').filter({hasText:'Emulator · Lokaler Testtitel'}).waitFor();
  await openRadioAction(radio,'open-schedule');const calendar=await overlayView(page,'schedule');
  assert.equal(await calendar.locator('#schedule-topic').inputValue(),'Mein ungespeicherter Sendeplanentwurf');
  assert.equal(await calendar.locator('#history-panel').isVisible(),false);
  await radio.locator('#studio-tab:not([disabled])').click();const back=await overlayView(page,'studio');
  assert.equal(await back.locator('#history-panel').isVisible(),true);
  await back.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();const reopened=await overlayView(page,'studio');
  await reopened.locator('#history-list li span').filter({hasText:'Emulator · Lokaler Testtitel'}).waitFor();
  assert.equal(await reopened.locator('#history-panel').isVisible(),true,'Moderationsreiter nach echtem Schließen wiederherstellen');
  await reopened.locator('#studio-programme-tab').click();assert.equal(await reopened.locator('#studio-topic').inputValue(),'Mein Studioentwurf');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__historyAudio&&!window.__historyAudio.paused),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,5);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Historienrechte werden in '+client+' serverseitig vergeben und beim Entzug auch im offenen Studio gelöscht',async t=>{
  const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client);
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  await owner.radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(owner.page,'team');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#radio-moderator-form button[type=submit]').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  const dj=await lab.join('DJ-Test',client);await dj.radio.locator('#studio-tab:not([disabled])').click();
  await dj.radio.locator('#play-button:not([disabled])').click();await dj.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await dj.radio.evaluate(()=>{window.__historyRoleAudio=document.getElementById('radio-audio');});
  const studio=await overlayView(dj.page,'studio');await studio.locator('#studio-history-tab').click();await studio.locator('#history-list li').waitFor();
  await team.locator('.team-member').filter({hasText:'DJ-Test'}).locator('button').click();
  await team.locator('[data-confirm-removal]').click();await dj.radio.locator('#studio-tab').waitFor({state:'hidden'});
  if(!studio.isDetached()){
    await studio.locator('#history-panel').waitFor({state:'hidden'});assert.equal(await studio.locator('#history-list li').count(),0);
    await studio.locator('#studio-history-tab').evaluate(n=>n.click());assert.equal(await studio.locator('#history-panel').isVisible(),false);
  }
  const listener=await lab.join('Testhoerer',client);await openRadioAction(listener.radio,'open-schedule');
  const calendar=await overlayView(listener.page,'schedule');assert.equal(await calendar.locator('#schedule-panel').isVisible(),true);
  assert.equal(await dj.radio.evaluate(()=>document.getElementById('radio-audio')===window.__historyRoleAudio&&!window.__historyRoleAudio.paused),true,'Rechteverlust der Historie unterbricht kein öffentliches Radioaudio');
  assert.equal(await calendar.locator('#studio-history-tab').isVisible(),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Doppelte native Wunschöffnung in '+client+' bleibt einmalig und erhält Entwurf und Audio',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);lab.hub.faults.clientEventType='mw:openWishes';lab.hub.faults.duplicateNext=true;await radio.locator('#open-wishes:not([disabled])').click();let wishes=await overlayView(page,'wishes');await wishes.locator('#wish-text:not([disabled])').fill('Nativer Entwurf');await page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wishes.sync'&&e.eventData.text==='Nativer Entwurf'));assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);lab.hub.faults.duplicateNext=true;const before=await page.locator('#overlays iframe').getAttribute('src');await radio.locator('#open-wishes:not([disabled])').click();await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,before);wishes=await overlayView(page,'wishes');assert.equal(await wishes.locator('#wish-text').inputValue(),'Nativer Entwurf');assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Wechsel während der ersten HTML-Ladephase erholt sich in '+client+' von verlorener Vorbereitung',async t=>{
  const lab=await setup(t,{resourceDelayMs:20}),{page,radio}=await lab.join('Otterchen',client);
  let release;await page.route('**/frame/**',async route=>{
    if(!release){await new Promise(resolve=>{release=resolve;});}await route.continue();
  });
  try{
    await radio.locator('#studio-tab').click();await page.locator('#overlays iframe[title$=" · studio"]').waitFor();
    await assertEventually(()=>typeof release==='function');
    assert.equal(await radio.locator('#team-tab').count(),0);
    lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:overlay.prepare';
    await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));
    await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='droppedServer'&&e.eventType==='mw:overlay.prepare'));
    release();const team=await overlayView(page,'team');
    await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Entwurf');
    assert.equal(await page.locator('#overlays iframe').count(),1);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:overlay.prepare').length,2);
    await openRadioAction(radio,'open-schedule');await overlayView(page,'schedule');
    await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const back=await overlayView(page,'team');
    assert.equal(await back.locator('#radio-moderator-nick').inputValue(),'Unfertiger Entwurf');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  }finally{if(release)release();}
});

for(const client of ['k3','stapp'])test('SDK-Ladeübergabe zeigt in '+client+' bereits fertig gestaltete Radioleiste und alle vier Ansichten',async t=>{
  const lab=await setup(t,{resourceDelayMs:30}),{page,radio}=await lab.join('Otterchen',client);
  await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='nativeReady'));
  assert.equal(lab.hub.trace.find(e=>e.kind==='nativeReady').visibleAtHandoff,true,'Radio vor dem SDK-DOMContentLoaded-Listener fertig');
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-schedule','schedule'],['open-wishes','wishes']]){
    const from=lab.hub.trace.length;await openRadioAction(radio,button);
    const frame=await overlayView(page,kind);
    await page.waitForFunction(n=>window.EmulatorLab.trace.slice(n).some(e=>e.kind==='nativeReady'),from);
    const opening=lab.hub.trace.slice(from),handoff=opening.findIndex(e=>e.kind==='nativeReady');
    assert.equal(opening[handoff].visibleAtHandoff,true,kind+' vor Loader-Entfernung fertig');
    const sizing=opening.findIndex(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize');
    if(kind==='studio')assert.ok(sizing>=0&&sizing<handoff,'Kompakte Studiohöhe vor der SDK-Übergabe: '+JSON.stringify(opening.filter(e=>['nativeReady','hostSize','frameReady'].includes(e.kind))));else assert.equal(sizing,-1,kind+' behält sein Anfangsmaß');
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Aktive Ladeabdeckung verhindert in '+client+' weiße Erstbilder über dem realistisch weißen Unterbau',async t=>{
  const lab=await setup(t,{resourceDelayMs:35}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1600});
  let release; await page.route('**/frame/**',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-schedule','schedule'],['open-wishes','wishes']]) {
    await openRadioAction(radio,button);
    await page.locator('#overlays iframe').waitFor();
    const loading=page.locator('#overlays .app-loading');assert.equal(await loading.count(),1);
    const opened=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.pageData.view,kind);assert.equal(opened.loading.enabled,true);
    assert.equal(opened.loading.background,'#0F1114');
    assert.equal(opened.loading.foreground,'#0F1114');
    assert.equal(opened.loading.text,'');
    assert.equal(await loading.textContent(),'');
    for(let picture=0;picture<3;picture++) await assertDarkPicture(page,loading,true);
    if(kind==='studio'){
      // Der Bildprüfer muss weiße Flächen und sichtbaren Ladetext wirklich ablehnen.
      await loading.evaluate(n=>{n.textContent='Lädt...';n.style.backgroundColor='#ffffff';n.style.color='#000000';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Keine weiße Zwischenfläche/);
      await loading.evaluate(n=>{n.style.backgroundColor='#0f1114';n.style.color='#f6f0df';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Native Zwischenfläche/);
      await loading.evaluate(n=>{n.textContent='';n.style.color='#0f1114';});
      await assertDarkPicture(page,loading,true);
    }
    await loading.evaluate(n=>{n.style.visibility='hidden';});
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
    await loading.evaluate(n=>{n.style.visibility='visible';});
    await page.waitForFunction(()=>!!document.querySelector('#overlays iframe[src]'));
    await assertEventually(()=>typeof release==='function');const resume=release;release=null;resume();
    const frame=await overlayView(page,kind);await loading.waitFor({state:'detached'});
    const colors=await frame.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor]);
    assert.deepEqual(colors,['rgb(15, 17, 20)','rgb(15, 17, 20)']);
    const surface=await frame.locator(kind==='wishes'?'.wish-drawer':'.dialog-shell').evaluate(n=>({
      color:getComputedStyle(n).backgroundColor,radius:parseFloat(getComputedStyle(n).borderTopLeftRadius)
    }));
    assert.equal(surface.color,'rgb(20, 20, 20)');assert.ok(surface.radius>0,'Abgerundete Inhaltsfläche bleibt erhalten');
    await assertOverlayCornerPixels(page);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');await frame.waitForTimeout(100);
    await assertOverlayCornerPixels(page);
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
    await page.locator('#width').fill('1280');await page.locator('#width').dispatchEvent('change');
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Build-172-Gegenprobe: Deaktivierte Ladefarben lassen den weißen Loader-Unterbau sichtbar',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp');
  const configure=lab.hub.runtime.context.MischWerkModules.configureLoading;
  lab.hub.runtime.context.MischWerkModules.configureLoading=loading=>configure(loading,false);
  let release;await page.route('**/frame/**',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
  try{
    await radio.locator('#open-wishes:not([disabled])').click();await page.locator('#overlays iframe').waitFor();
    const opening=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opening.loading.enabled,false);assert.equal(opening.loading.background,'#0F1114');
    assert.equal(await page.locator('#overlays .app-loading').count(),0);
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
  }finally{if(release)release();}
});
async function assertOverlayCornerPixels(page) {
  const png=await page.locator('#overlays iframe').screenshot();
  const pixels=await page.evaluate(async data=>{
    const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+data)).blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
    return [[1,1],[3,3],[canvas.width-2,1],[canvas.width-4,3]].map(([x,y])=>Array.from(context.getImageData(x,y,1,1).data));
  },png.toString('base64'));
  assert.deepEqual(pixels,Array(4).fill([15,17,20,255]),'Tatsächliche obere Eckpixel passen zum Channelgrund');
}
async function assertDarkPicture(page,element,uniform=false) {
  const png=await element.screenshot();
  const pixels=await page.evaluate(async data=>{
    const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+data)).blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
    const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
    let white=0,dark=0,innerNonDark=0;
    for(let i=0;i<rgba.length;i+=4){
      const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width),isDark=rgba[i]===15&&rgba[i+1]===17&&rgba[i+2]===20;
      if(rgba[i]>235&&rgba[i+1]>235&&rgba[i+2]>235)white++;if(isDark)dark++;
      if(!isDark&&x>=8&&y>=8&&x<canvas.width-8&&y<canvas.height-8)innerNonDark++;
    }
    return {white:white/(rgba.length/4),dark:dark/(rgba.length/4),innerNonDark};
  },png.toString('base64'));
  assert.ok(pixels.white<.02,'Keine weiße Zwischenfläche im tatsächlichen Screenshot: '+JSON.stringify(pixels));
  if(uniform){assert.equal(pixels.white,0);assert.equal(pixels.innerNonDark,0,'Native Zwischenfläche enthält weder Text noch Indikator: '+JSON.stringify(pixels));}
}

for(const client of ['k3','stapp'])test('Erster HTML-Anstrich zeigt in '+client+' schon vor dem Startskript den dunklen Overlaykopf',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client);
 await page.setViewportSize({width:1800,height:1600});
 const network=await lab.context.newCDPSession(page);await network.send('Network.enable');await network.send('Network.setCacheDisabled',{cacheDisabled:true});await network.send('Network.clearBrowserCache');
 let release;await page.route('**/app/js/start.js*',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
 try {
  for(const width of [1280,320]) {
   await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
  for(const [button,kind,title] of [['open-wishes','wishes','Wunschbox'],['studio-tab','studio','Moderation'],['team-tab','team','Verwaltung'],['open-schedule','schedule','Sendeplan']]){
   await network.send('Network.clearBrowserCache');
   await openRadioAction(radio,button);await assertEventually(()=>typeof release==='function');
   const frame=await (await page.waitForSelector('#overlays iframe')).contentFrame();
   await frame.locator('.dialog-header').waitFor({timeout:2000});
   assert.equal(await frame.locator('#dialog-title').textContent(),title);
   assert.equal(await frame.evaluate(()=>document.documentElement.classList.contains('mw-ready')),false);
   assert.equal(await frame.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
   const earlyLogo=await frame.locator('.dialog-brand img').boundingBox();
   const earlyHead=await frame.locator('.dialog-header:visible').boundingBox();
   assert.ok(earlyLogo.width>=64&&Math.abs(earlyLogo.width-earlyLogo.height)<.1,'Schon der HTML-Anstrich reserviert das große proportionale Logo');
   // Eigene HTML-Ebene separat prüfen; im normalen Ablauf deckt der native Loader sie noch ab.
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='hidden';});
   await assertDarkPicture(page,page.locator('#overlays .app-window'));
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='visible';});
   const resume=release;release=null;resume();await overlayView(page,kind);
   const readyHead=await frame.locator('.dialog-header:visible').boundingBox();
   const readyLogo=await frame.locator('.dialog-brand img:visible').boundingBox();
   assert.ok(Math.abs(earlyHead.height-readyHead.height)<=1&&Math.abs(earlyLogo.width-readyLogo.width)<=1,
     'Kopf und Logo wechseln beim Sichtbarwerden nicht ihre Größe: '+JSON.stringify({kind,earlyHead,readyHead,earlyLogo,readyLogo}));
   if(client==='k3'&&kind==='wishes')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/wunschbox/wunschbox-flach-'+(width===320?320:560)+'.png')});
   await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  }}
 }finally{if(release)release();}
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
async function assertEventually(check) { for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.fail('Erwarteter Zustand blieb aus'); }

test('Die Radioleiste lädt keine Overlaycontroller oder vorbereitenden Ressourcenhinweise',async t=>{
 const lab=await setup(t),requests=[];lab.context.on('request',r=>requests.push(r.url()));const {page,radio}=await lab.join('Otterchen','stapp');await radio.waitForTimeout(100);assert.equal(await radio.locator('link[data-mw-prefetch],link[rel=prefetch]').count(),0);assert.equal(requests.some(u=>/js\/(studio|team|schedule)\//.test(u)),false);await radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(page,'studio');assert.equal(await studio.locator('#studio-topic').isVisible(),true);assert.ok(requests.some(u=>u.includes('/studio/controls.js')));assert.equal(requests.some(u=>u.includes('/team/management.js')||u.includes('/schedule/controller.js')),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Native Wiederöffnung erzeugt neue Dokumente und erhält die reguläre SDK-Cachekennung',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp');await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');const first=await page.locator('#overlays iframe').getAttribute('src'),cache=await studio.evaluate(()=>Client.getCacheInvalidationId());await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),first);assert.equal(await studio.evaluate(()=>Client.getCacheInvalidationId()),cache);assert.equal(await studio.locator('link[rel=prefetch]').count(),0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

async function overlayView(page,kind) {
 const selector='#overlays iframe[title$=" · '+kind+'"]';
 for(let attempt=0;attempt<100;attempt++){
  const handle=await page.waitForSelector(selector),frame=await handle.contentFrame();
  if(!frame||frame.isDetached()){await page.waitForTimeout(20);continue;}
  try{await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));return frame;}
  catch(error){if(!frame.isDetached())throw error;}
 }
 throw Error('Native Overlayseite wurde nicht bereit: '+kind);
}

test('Geschlossener Vorhang erhält beim Schließen eines Verwaltungs-Overlays ein sichtbares Fokusziel',async t=>{
  const lab=await setup(t),owner=await lab.join('Otterchen','stapp');
  await owner.radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(owner.page,'team');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');
  await team.locator('#radio-moderator-form button[type=submit]').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  const dj=await lab.join('DJ-Test','k3');
  await dj.radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(dj.page,'studio');
  lab.hub.runtime.command('Otterchen','vorhang','schließen');
  await dj.radio.locator('#curtain-ad').waitFor();
  await studio.locator('#close-overlay').click();
  await dj.page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await dj.radio.locator('#curtain-ad').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);
});
test('Verlorene Overlaybestätigung lässt den Entwurf stehen; Abbrechen und fehlende Fähigkeit erhalten die Ansicht',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',700);
  await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
  await studio.locator('#studio-topic:not([disabled])').fill('Diesen Entwurf behalten');
  lab.hub.faults.dropClient=1;lab.hub.faults.clientEventType='mw:overlay.ready';
  const at=lab.hub.trace.filter(e=>e.kind==='droppedClient').length;
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));
  await page.waitForFunction(n=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedClient').length>n,at);
  assert.equal(await studio.locator('.dialog-content').evaluate(n=>n.inert),true);
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Diesen Entwurf behalten');
  await studio.locator('#close-overlay').click();
  await studio.waitForFunction(()=>!document.querySelector('.dialog-content').inert);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Bleibt auch ohne Fähigkeit');
  await page.locator('#no-overlay').check();
  await page.waitForFunction(()=>EmulatorLab.state.users.find(u=>u.nick==='Otterchen').capabilities.Overlay===false);
  await radio.locator('#studio-tab:not([disabled])').click();
  await radio.locator('#notice').filter({hasText:/unterstützt.*nicht/}).waitFor();
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Bleibt auch ohne Fähigkeit');
  assert.equal(await page.locator('#popups iframe').count(),0);
  await team.locator('#radio-moderator-nick').focus();await page.keyboard.press('Escape');
  await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-schedule').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);
});
for(const client of ['k3','stapp'])test('Alle Channel-Overlays in '+client+' erhalten Entwürfe, Wunschversand, Fokus und Audio beim Wechsel',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,2290);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__sameAudio=document.getElementById('radio-audio');});
  lab.context.setDefaultTimeout(10000);
  const header=await radio.evaluate(()=>innerHeight);
  await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
  await studio.evaluate(()=>{window.__keptDocument=document;});
  const firstSource=await page.locator('#overlays iframe').getAttribute('src');
  await studio.locator('#studio-topic:not([disabled])').fill('Mein ungespeichertes Thema');
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));let team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Nick');
  await openRadioAction(radio,'open-schedule');let schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-new:not([disabled])').click();
  await schedule.locator('#schedule-topic').fill('Mein Planentwurf');
  const date=await schedule.locator('#schedule-date').inputValue();
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
  assert.equal(await studio.locator('#reset-topic').isVisible(),true);
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Unfertiger Nick');
  await openRadioAction(radio,'open-schedule');schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-form').waitFor();
  assert.equal(await schedule.locator('#schedule-topic').inputValue(),'Mein Planentwurf');
  assert.equal(await schedule.locator('#schedule-date').inputValue(),date);
  assert.notEqual(studio,team);assert.notEqual(studio,schedule);
  assert.equal(await schedule.evaluate(()=>window.__keptDocument===document),false);
  assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),firstSource);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,6);
  await schedule.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-schedule').evaluate(n=>document.activeElement===n),true);
  await radio.locator('#open-wishes:not([disabled])').click();let wishes=await overlayView(page,'wishes');
  assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),firstSource);
  assert.equal(await wishes.evaluate(()=>!!window.__keptDocument),false);
  await wishes.locator('#wish-text:not([disabled])').fill('Mein Wunsch bleibt beim Wechsel');
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  await radio.locator('#open-wishes:not([disabled])').click();wishes=await overlayView(page,'wishes');
  assert.equal(await wishes.locator('#wish-text').inputValue(),'Mein Wunsch bleibt beim Wechsel');
  await wishes.locator('#submit-wish').click();
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  await studio.waitForFunction(()=>document.getElementById('queue-count').textContent==='1');
  if(await studio.locator('#studio-queue-tab').isVisible())await studio.locator('#studio-queue-tab').click();
  assert.match(await studio.locator('#request-queue').textContent(),/Mein Wunsch bleibt beim Wechsel/);
  await radio.locator('#open-wishes:not([disabled])').click();wishes=await overlayView(page,'wishes');
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 1'}).waitFor();
  assert.equal(await wishes.locator('#wish-positions').count(),0);
  assert.equal(await page.locator('#popups iframe').count(),0);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  assert.equal(await radio.evaluate(()=>innerHeight),header);
  assert.equal(await radio.locator('#radio-audio').evaluate(n=>n===window.__sameAudio&&!n.paused),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit').length,1);
  assertAllowedOverlaySizes(lab);
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await wishes.waitForFunction(()=>innerWidth===320);
  assert.equal(await wishes.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
for(const client of ['k3','stapp'])test('Studioanmeldung zeigt in '+client+' eindeutig die Moderation; Abmeldung stellt MischWerk wieder her',async t=>{
 const lab=await setup(t,{provider:'online'});let live=false;
 await lab.context.route('**/fixture/metadata',r=>r.fulfill({json:{title:'Lokaler Testtitel',artist:'Emulator-Testsignal',live}}));
 const {page,radio}=await lab.join('Otterchen',client,1920);
 await radio.locator('#on-air-sign').filter({hasText:'MischWerk am Pult'}).waitFor();
 const neutral='rgb(180, 180, 176)',liveColor='rgb(255, 154, 143)';
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>getComputedStyle(n).color),neutral);
 // Seit Build 311 gelten 14 px; auch am aktuellen Upload exakt prüfen, bevor der Funktionsablauf beginnt.
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)),14,'AutoDJ-Anzeige gemäß aktueller Typografie');
 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__moderatorNameAudio=document.getElementById('radio-audio');window.__moderatorAudioEvents=[];for(const type of ['playing','pause','emptied','error','ended'])window.__moderatorNameAudio.addEventListener(type,()=>window.__moderatorAudioEvents.push(type));});
 await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
 await studio.locator('#on-air:not([disabled])').click();await studio.locator('#studio-host').filter({hasText:'Otterchen ist am Mikrofon'}).waitFor();
 await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
 assert.equal(await radio.locator('#on-air-sign').textContent(),'Es moderiert');
 assert.equal(await radio.locator('#host-name').textContent(),'Otterchen');assert.equal(await radio.locator('#host-name').getAttribute('data-prefix'),'');
 assert.equal(await radio.locator('.presenter').getAttribute('data-mode'),'moderation');
 for(const selector of ['#on-air-sign','#host-name'])assert.equal(await radio.locator(selector).evaluate(n=>getComputedStyle(n).color),liveColor);
 assert.doesNotMatch(await radio.locator('.presenter').textContent(),/MischWerk am Pult|Im Studio angemeldet/);
 await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
 await studio.locator('#off-air:not([disabled])').click();await studio.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
 await radio.locator('#host-name').waitFor({state:'hidden'});assert.equal(await radio.locator('#on-air-sign').textContent(),'MischWerk am Pult','Abmeldung schaltet bei unverändertem AutoDJ sichtbar zurück');
 await studio.locator('#on-air:not([disabled])').click();await studio.locator('#studio-host').filter({hasText:'Otterchen ist am Mikrofon'}).waitFor();
 await radio.locator('#on-air-sign').filter({hasText:'Es moderiert'}).waitFor();
 await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
 live=true;await radio.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await radio.waitForFunction(()=>document.querySelector('.presenter').getAttribute('data-mode')==='live');
 for(const width of [1920,1351,1024,768,390,320]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await radio.waitForTimeout(100);
  assert.equal(await radio.locator('#host-name').textContent(),'Otterchen');assert.equal(await radio.locator('#host-name').isVisible(),true);
  assert.equal(await radio.locator('#host-name').getAttribute('data-prefix'),'');await radio.locator('#host-name').scrollIntoViewIfNeeded();
  assert.equal(await radio.locator('#host-name').evaluate(n=>{const r=n.getBoundingClientRect(),p=n.closest('.presenter').getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1;}),true);
  assert.equal(await radio.locator('#on-air-sign').textContent(),'Es moderiert');assert.equal(await radio.locator('.presenter').getAttribute('data-mode'),'live');
  for(const selector of ['#on-air-sign','#host-name']){
   assert.equal(await radio.locator(selector).evaluate(n=>getComputedStyle(n).color),liveColor);
   assert.equal(await radio.locator(selector).evaluate(n=>parseFloat(getComputedStyle(n).fontSize)),14,'Aktuelle Moderationsschrift bei '+width);
  }
  assert.ok(await radio.locator('.radio-status-row').evaluate(n=>{
   const row=n.getBoundingClientRect(),text=n.querySelector('.presenter').getBoundingClientRect();
   const padding=n.closest('.radio-constrained')?10:6;
   return parseFloat(getComputedStyle(n).paddingTop)===padding&&text.top-row.top>=padding;
  }),'Anzeige gegenüber dem Thema tiefer bei '+width);
  assert.ok((await radio.locator('#on-air-sign').getAttribute('aria-label')).startsWith('Radio Mischwerk bestätigt eine Live-Sendung.'));
  assert.equal(await radio.locator('#on-air-sign').getAttribute('title'),'Sendung und Moderation');
  if(width===1920){const sign=await radio.locator('#on-air-sign').boundingBox(),name=await radio.locator('#host-name').boundingBox();assert.ok(Math.abs(sign.y-name.y)<1&&name.x>=sign.x+sign.width);}
  const audioState=await radio.evaluate(()=>{const audio=window.__moderatorNameAudio;return {same:document.getElementById('radio-audio')===audio,paused:audio.paused,ended:audio.ended,error:audio.error?.code||null,source:audio.getAttribute('src'),events:window.__moderatorAudioEvents};});
  assert.equal(audioState.same&&!audioState.paused,true,JSON.stringify({width,...audioState}));
  assert.equal(await radio.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await radio.locator('#studio-tab:not([disabled])').click();const back=await overlayView(page,'studio');
 await back.locator('#off-air:not([disabled])').click();await back.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
 await radio.locator('#host-name').waitFor({state:'hidden'});assert.equal(await radio.locator('#on-air-sign').textContent(),'MischWerk spielt live','Kein falscher AutoDJ aus einer App-Abmeldung');
 live=false;await radio.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await radio.locator('#on-air-sign').filter({hasText:'MischWerk am Pult'}).waitFor();
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>getComputedStyle(n).color),neutral,'AutoDJ nach Abmeldung wieder neutral');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
for(const client of ['k3','stapp']) test('Neugestaltete Arbeitsfenster in '+client+' verbinden alle Reiter und protokollieren Moderation im Sendeplan',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  async function reopen(kind,action) {
    const old=await page.locator('#overlays iframe').getAttribute('src');await action();
    await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,old);
    return overlayView(page,kind);
  }
  await page.setViewportSize({width:1800,height:1600});
  await radio.evaluate(()=>Client.executeSlashCommand('/vorhang öffnen'));
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__redesignAudio=document.getElementById('radio-audio');__redesignAudio.loop=true;window.__redesignLoads=0;__redesignAudio.addEventListener('loadstart',()=>__redesignLoads++);});
  const ownerHeader=[...lab.hub.runtime.contents.sessions.keys()].find(id=>{
    const description=lab.hub.runtime.contents.describe(id);return description.nick==='Otterchen'&&description.mode==='Headerbar';
  });
  lab.hub.runtime.event('Otterchen',ownerHeader,'mw:wish.submit',{submissionId:'redesign-wish',text:'Lokaler Prüfwunsch: a-ha – Take On Me'});
  await radio.locator('#studio-tab').click();let studio=await overlayView(page,'studio');
  await studio.locator('#studio-topic').fill('Lokale Prüfung · Musik zum Feierabend');await studio.locator('#save-topic').click();
  await studio.locator('#on-air').click();await studio.locator('#off-air:not([disabled])').waitFor();
  for(const width of [780,320,390,560,1280,3840]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
    studio=await reopen('studio',()=>radio.locator('#studio-tab').click());
    await studio.waitForFunction(width=>innerWidth===Math.min(width,640),width);
    for(const [tab,panel,name] of [['studio-programme-tab','studio-programme','moderation'],['studio-queue-tab','studio-requests','moderation-wuensche'],['studio-history-tab','history-panel','moderation-historie'],['studio-ticker-tab','studio-ticker-panel','moderation-lauftext']]) {
      await studio.locator('#'+tab).click();await studio.locator('#'+panel).waitFor();await studio.waitForTimeout(100);
      const fit=await studio.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
        tabs:[...document.querySelectorAll('#studio-programme-tabs button')].map(button=>{const r=button.getBoundingClientRect();return {width:r.width,height:r.height,scroll:button.scrollWidth};})}));
      assert.ok(fit.scroll<=fit.width+1,JSON.stringify(fit));
      assert.ok(fit.tabs.every(button=>button.height>=44&&button.scroll<=button.width+1),JSON.stringify(fit));
      if(panel==='studio-requests'){
        const rows=await studio.locator('.queue-item.selected').evaluate(node=>{
          const rect=selector=>{const n=node.querySelector(selector);return n&&n.getClientRects().length?n.getBoundingClientRect().toJSON():null;};
          return {copy:rect('.queue-copy'),text:rect('.request-text'),pager:rect('.text-pagination'),meta:rect('.queue-meta'),actions:rect('.queue-toolbar')};
        });
        if(rows.copy&&rows.meta)assert.ok(rows.copy.bottom<=rows.meta.top+1&&(!rows.pager||rows.pager.bottom<=rows.meta.top+1),'Wunschtext und Textseiten liegen vor der Absenderzeile: '+JSON.stringify(rows));
        if(rows.meta&&rows.actions)assert.ok(rows.meta.bottom<=rows.actions.top+1,'Absender und Aktionen überlappen nicht: '+JSON.stringify(rows));
      }

      if(client==='k3'&&[320,780].includes(width))await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/moderation/'+name+'-'+width+'.png'),animations:'disabled'});
    }
  }
  await studio.locator('#studio-programme-tab').click();await revealStudio(studio,'#off-air');await studio.locator('#off-air').click();await studio.locator('#on-air:not([disabled])').waitFor();
  await openRadioAction(radio,'open-schedule');let plan=await overlayView(page,'schedule');
  await plan.locator('.schedule-show').first().waitFor({state:'attached'});
  assert.doesNotMatch(await plan.locator('#schedule-days').textContent(),/Angemeldet:|Abgemeldet:/);
  assert.equal(await plan.locator('.schedule-show').count(),1,'Ein tatsächlicher Studiobesuch, keine Zukunftsduplikate');
  for(const width of [820,320,560]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await plan.waitForTimeout(150);
    plan=await reopen('schedule',()=>openRadioAction(radio,'open-schedule'));
    await plan.locator('.schedule-show').first().waitFor({state:'attached'});
    assert.ok(await plan.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-'+width+'.png'),animations:'disabled'});
  }
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));let team=await overlayView(page,'team');
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
    team=await reopen('team',()=>radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung')));
    for(const [tab,panel,name] of [['team-members-tab','team-members','verwaltung'],['team-texts-tab','channel-texts-panel','verwaltung-bottexte']]) {
      await team.locator('#'+tab).click();await team.locator('#'+panel).waitFor();await team.waitForTimeout(100);
      assert.ok(await team.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.ok(await team.locator('#dialog-title').evaluate(node=>{
        const range=document.createRange();range.selectNodeContents(node);
        const text=range.getBoundingClientRect(),box=node.getBoundingClientRect();
        return text.width<=box.width+1&&range.getClientRects().length===1;
      }),'Verwaltung bleibt vollständig und ohne Worttrennung sichtbar');
      if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/verwaltung/'+name+'-'+width+'.png'),animations:'disabled'});
    }
  }
  assert.deepEqual(await radio.evaluate(()=>({same:document.getElementById('radio-audio')===__redesignAudio,paused:__redesignAudio.paused,loads:__redesignLoads})),{same:true,paused:false,loads:0});
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
test.after(async () => { await browser?.close(); });

for (const client of ['k3', 'stapp']) {
  test('Öffentliche Begrüßung mit Foto am Ende und vier Rollen erhält laufendes Radio in ' + client, async t => {
    const lab = await setup(t, { provider: 'online' }), records = [], log = lab.hub.log.bind(lab.hub);
    lab.hub.log = (kind, data) => { const item = log(kind, data); records.push(item); return item; };
    const { radio } = await lab.join('Otterchen', client, 1280, false);
    const runtime = lab.hub.runtime;
    runtime.command('Otterchen', 'vorhang', 'öffnen');
    const header = [...runtime.contents.sessions.keys()].find(id => runtime.contents.describe(id).nick === 'Otterchen');
    for (const nick of ['DJ-Test', 'Polaroid']) runtime.event('Otterchen', header, 'mw:addRadioModerator', { nick });
    runtime.users.find('Polaroid').state.role = 'cm';
    runtime.users.find('Testhoerer').state.profilePhoto = 'https://example.invalid/profile.png';
    const photoUser = runtime.users.find('Testhoerer').user, nativeProfileLink = photoUser.getProfileLink;
    photoUser.getProfileLink = display => nativeProfileLink(String(display).replace(/[<>]/g, character => '\\' + character));
    await radio.evaluate(() => { window.__greetingAudio = document.getElementById('radio-audio'); });
    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(() => __greetingAudio.currentTime > .1);
    for (const nick of ['Testhoerer', 'Channelmoderator', 'DJ-Test', 'Polaroid']) await lab.join(nick, client);
    const messages = () => records.filter(item => item.kind === 'public').map(item => item.message);
    assert.equal(messages().length, 5);
    assert.equal(messages()[1], "°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>Testhoerer|/w Testhoerer<°._°r° Viel Spaß beim Zuhören. °>https://example.invalid/profile.png<>--<>|/w Testhoerer<°");
    assert.deepEqual(runtime.users.find('Testhoerer').state.photoSize, [24, 24]);
    assert.equal(messages()[2], "°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>Channelmoderator|/w Channelmoderator<°._°r° Viel Spaß beim Zuhören.");
    assert.equal(messages()[3], "°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>DJ-Test|/w DJ-Test<°._°r° Viel Spaß beim Zuhören.");
    assert.equal(messages()[4], "°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>Polaroid|/w Polaroid<°._°r° Viel Spaß beim Zuhören.");
    for (const person of runtime.users.online()) runtime.invokeFunction(runtime.app.onUserJoined, [person.user]);
    runtime.invokeFunction(runtime.app.onAppStart);
    assert.equal(messages().length, 5, 'Keine Doppelmeldungen oder nachträgliche Startbegrüßung');
    await radio.waitForFunction(() => __greetingAudio.currentTime > .5);
    assert.equal(await radio.evaluate(() => __greetingAudio === document.getElementById('radio-audio') && !__greetingAudio.paused), true);
    assert.deepEqual(lab.errors, []); assert.deepEqual(runtime.errors, []); assert.deepEqual(lab.external, []);
  });
}

for(const client of ['k3','stapp'])test('Sendeplan wechselt bei Rechteverlust aus einer Verwaltungswoche zurück auf die 14-Tage-Höreransicht in '+client,async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,1280,false);
  await openRadioAction(radio,'open-schedule');const schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-next:not([disabled])').click();
  await schedule.waitForFunction(()=>document.getElementById('schedule-period').textContent==='Montag bis Sonntag');
  lab.hub.runtime.users.find('Otterchen').state.role='listener';
  await schedule.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await schedule.waitForFunction(()=>document.getElementById('schedule-period').textContent==='Ab heute · nächste 14 Tage',null,{timeout:5000});
  assert.equal(await schedule.locator('.schedule-day').evaluateAll(nodes=>new Set(nodes.map(n=>n.dataset.scheduleDate)).size),14);
  assert.equal(await schedule.locator('#schedule-new').isVisible(),false);
  assert.equal(await schedule.locator('#schedule-previous').isVisible(),false);
  const account=lab.hub.runtime.users.find('Otterchen');account.state.role='owner';
  await schedule.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await schedule.locator('#schedule-new').waitFor();await schedule.locator('#schedule-new').click();
  await schedule.locator('#schedule-topic').fill('Privater Entwurf vor Rechteverlust');
  account.state.role='listener';await schedule.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await schedule.locator('#schedule-form').waitFor({state:'hidden'});
  assert.equal(await schedule.locator('#schedule-topic').inputValue(),'','Private Eingaben werden beim Rechteverlust verworfen');
  assert.equal(await schedule.locator('.schedule-owner-action:visible').count(),0);
  assert.equal(await schedule.evaluate(()=>document.activeElement.id),'schedule-days');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

async function setup(t, faults = {}, clock = false, contextOptions = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Browser-'));
  const instance = await createEmulator({ port: 0, dataDir: directory, appDir:process.env.MISCHWERK_TEST_UPLOAD });
  Object.assign(instance.hub.faults, faults);
  if (faults.provider) instance.hub.restart(false);
  const context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, ...contextOptions });
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
  async function join(nick = 'Otterchen', client = 'k3', width = 1280, registeredOwner = true) {
    const page = await context.newPage();
    if(clock) await page.clock.install();
    await page.goto(instance.origin + '/?nick=' + encodeURIComponent(nick));
    await page.waitForFunction(() => window.EmulatorLab?.state.appVersion);
    await page.locator('#persona').selectOption(nick);
    await page.locator('#client').selectOption(client);
    await page.locator('#width').fill(String(width)); await page.locator('#width').dispatchEvent('change');
    await page.locator('#join').click();
    const radio = await view(page, 'Headerbar');
    const operator=instance.hub.runtime.users.find(nick);
    if(registeredOwner&&nick==='Otterchen'&&operator.state.role==='owner') {
      const saved=instance.hub.runtime.persistence.api().getObject('mischwerk.state.v1');
      if(!(saved?.radioModeratorUserIds||[]).includes(operator.state.id))await radio.evaluate(()=>Client.sendEvent('mw:addRadioModerator',{nick:'Otterchen'}));
      await radio.locator('#studio-tab:not([hidden])').waitFor();
    }
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

for (const client of ['k3','stapp']) {
  test('Wunschbox bündelt in '+client+' nach Versand nur Bestätigung und weiteren Wunsch; Information bleibt in der Appleiste',async t=>{
    const lab=await setup(t,{hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,320);
    await radio.locator('#open-wishes:not([disabled])').click();
    const surface=await view(page,'Overlay');
    const song='Langer Interpret und vollständiger Musikwunsch '.repeat(7).slice(0,300);
    for(const text of [song,'Mein zweiter Wunsch']) {
      if(await surface.locator('#wish-compose-open').isVisible())await surface.locator('#wish-compose-open').click();
      await surface.locator('#wish-text').fill(text);await surface.locator('#submit-wish').click();
      await surface.locator('#wish-feedback.success').waitFor();
      await surface.locator('#wish-compose-open').waitFor();
    }
    await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor();
    assert.equal(await radio.locator('#own-wish-title').textContent(),song);
    assert.equal(await radio.locator('#own-wish-position').getAttribute('title'),'Dein Musikwunsch');
    assert.equal(await surface.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
    assert.doesNotMatch(await surface.locator('#wishes-panel').innerText(),/Deine offenen Wünsche|Platz 1|Mein zweiter Wunsch/);
    await radio.waitForTimeout(600);
    const headerHeight=await radio.evaluate(()=>innerHeight);
    await surface.locator('#wish-compose-open').click();
    const draft='Mein weiterer Entwurf';await surface.locator('#wish-text').fill(draft);
    await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
    assert.equal(await surface.locator('#wish-text').inputValue(),draft);
    assert.equal(await surface.locator('#wish-text').evaluate(n=>n===document.activeElement),true);
    assert.equal(await surface.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await surface.waitForTimeout(900);
    const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
    await surface.waitForTimeout(600);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count,'Ruhender Inhalt löst keine Größenkaskade aus');
    assert.equal(await radio.evaluate(()=>innerHeight),headerHeight);
    assert.equal(lab.hub.trace.filter(e=>e.eventType==='mw:wish.submit').length,2);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {
  test('Automatische Studioeinträge zeigen in '+client+' volle Stunden, beachten fünf Minuten und lassen sich vom Inhaber entfernen',async t=>{
    const lab=await setup(t),owner=await lab.join('Otterchen',client,1280,false);
    const before=lab.hub.runtime.clock.now(),local=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',minute:'2-digit',second:'2-digit'}).format(new Date(before)).split(':').map(Number);
    let advance=((40-local[0]+60)%60)*60000-local[1]*1000;if(advance<=0)advance+=3600000;
    lab.hub.runtime.clock.advance(advance);
    const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).format(new Date(lab.hub.runtime.clock.now())));
    await owner.radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(owner.page,'studio');
    await studio.locator('#on-air:not([disabled])').click();await studio.locator('#off-air:not([disabled])').waitFor();
    await openRadioAction(owner.radio,'open-schedule');let plan=await overlayView(owner.page,'schedule');
    await plan.locator('.schedule-show').waitFor({state:'attached'});
    assert.equal(await plan.locator('.schedule-remove').isDisabled(),true,'Laufende Moderation zuerst regulär beenden');
    assert.equal(await plan.locator('.schedule-broadcast').textContent(),'Unter 5 Minuten · privat');
    if(client==='k3'&&process.env.MISCHWERK_CAPTURE_SCHEDULE){
      await owner.page.setViewportSize({width:1800,height:1400});await plan.waitForTimeout(100);
      const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','sendeplan');fs.mkdirSync(folder,{recursive:true});
      await owner.page.locator('#overlays iframe').screenshot({path:path.join(folder,'Sendeplan-Kurze-Anmeldung-720.png')});
      await owner.page.locator('#width').fill('320');await owner.page.locator('#width').dispatchEvent('change');
      await plan.waitForFunction(()=>innerWidth===320);await plan.waitForTimeout(100);
      while(!await plan.locator('.schedule-show').first().isVisible())await plan.locator('#schedule-page-next:not([disabled])').click();
      const compact=await plan.evaluate(()=>({height:innerHeight,scroll:document.documentElement.scrollHeight,pager:document.getElementById('schedule-pagination').getBoundingClientRect().bottom}));
      assert.ok(compact.scroll<=compact.height+1&&compact.pager<=compact.height,'Auch der private Kurzzeiteintrag samt Navigation passt vollständig: '+JSON.stringify(compact));
      await owner.page.locator('#overlays iframe').screenshot({path:path.join(folder,'Sendeplan-Kurze-Anmeldung-320.png')});
      await owner.page.locator('#width').fill('1280');await owner.page.locator('#width').dispatchEvent('change');
      await openRadioAction(owner.radio,'open-schedule');plan=await overlayView(owner.page,'schedule');
      await plan.waitForFunction(()=>innerWidth===720);
    }
    const listener=await lab.join('Polaroid',client);await openRadioAction(listener.radio,'open-schedule');
    const publicPlan=await overlayView(listener.page,'schedule');
    await publicPlan.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===14);
    assert.equal(await publicPlan.locator('.schedule-show').count(),0);
    lab.hub.runtime.clock.advance(5*60000);
    await publicPlan.locator('#schedule-refresh:not([disabled])').click();
    await publicPlan.locator('.schedule-show').waitFor({state:'attached'});
    assert.equal(await publicPlan.locator('.schedule-time').textContent(),hour+' Uhr');
    assert.equal(await publicPlan.locator('.schedule-broadcast,.schedule-remove').count(),0);
    assert.doesNotMatch(await publicPlan.locator('#schedule-days').textContent(),/Angemeldet:|Abgemeldet:|\d{2}:4[05]/);
    await owner.radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(owner.page,'studio');
    await studio.locator('#off-air:not([disabled])').click();await studio.locator('#on-air:not([disabled])').waitFor();
    await openRadioAction(owner.radio,'open-schedule');plan=await overlayView(owner.page,'schedule');
    await plan.locator('.schedule-remove:not([disabled])').waitFor({state:'attached'});await plan.waitForTimeout(100);
    const row=plan.locator('.schedule-show').first();let guard=0;
    while(!await row.isVisible()){assert.ok(guard++<30);await plan.locator('#schedule-page-next:not([disabled])').click();}
    assert.equal(await row.locator('.schedule-time').textContent(),hour+' Uhr');
    assert.equal(await row.locator('.schedule-edit').count(),0,'Automatische Zeiten werden nicht manuell umgeschrieben');
    const geometry=await plan.evaluate(()=>{
      const pager=document.getElementById('schedule-pagination').getBoundingClientRect();
      return {height:innerHeight,shell:document.querySelector('.dialog-shell').getBoundingClientRect().bottom,
        pager:pager.toJSON(),scroll:document.documentElement.scrollHeight};
    });
    assert.ok(geometry.scroll<=geometry.height+1 && geometry.pager.bottom<=geometry.height && Math.abs(geometry.shell-geometry.height)<=1,
      'Die kurze gefüllte Kalenderseite samt Fußnavigation passt vollständig in den Rahmen: '+JSON.stringify(geometry));
    if(client==='k3'){
      await owner.page.setViewportSize({width:1800,height:1400});
      await owner.page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-sendungen-820.png')});
    }
    await row.locator('.schedule-remove').click();await row.locator('.schedule-delete-cancel').click();
    assert.equal(await plan.locator('.schedule-show').count(),1);
    await row.locator('.schedule-remove').click();await row.locator('.schedule-delete-confirm').click();
    await plan.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===0);
    await publicPlan.locator('#schedule-refresh:not([disabled])').click();
    await publicPlan.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===0);
    assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator,null,'Löschen ist eine Kalenderaktion');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Hörerplan zeigt in '+client+' beide Moderationen, vollständige Sendungen und erhält bewusst gewählte Seiten',async t=>{
    const lab=await setup(t),owner=await lab.join('Otterchen',client);
    await owner.radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(owner.page,'team');
    await team.locator('#radio-moderator-nick').fill('Polaroid');
    await team.locator('#radio-moderator-form button[type=submit]').click();
    await team.locator('#radio-moderator-list').filter({hasText:'Polaroid'}).waitFor();
    await openRadioAction(owner.radio,'open-schedule');const editor=await overlayView(owner.page,'schedule');
    await editor.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===14);
    const days=await editor.locator('.schedule-day').evaluateAll(nodes=>nodes.map(node=>node.dataset.scheduleDate));
    const shows=[{date:days[2],nick:'Otterchen',start:'19:00',end:'21:00',topic:'Feierabend mit MischWerk'},
      {date:days[4],nick:'Polaroid',start:'20:00',end:'22:00',topic:'Hits und Entdeckungen'}];
    for(const show of shows){
      await editor.locator('#schedule-new:not([disabled])').click();
      for(const [key,value] of Object.entries(show))await editor.locator('#schedule-'+key).fill(value);
      await editor.locator('#schedule-save').click();await editor.locator('#schedule-form').waitFor({state:'hidden'});
      await editor.locator('.schedule-topic').filter({hasText:show.topic}).waitFor({state:'attached'});
    }
    const listener=await lab.join('Polaroid',client);await openRadioAction(listener.radio,'open-schedule');
    const frame=await overlayView(listener.page,'schedule');
    await frame.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===2);
    await frame.waitForTimeout(100);
    async function revealShow(topic){
      const row=frame.locator('.schedule-show').filter({hasText:topic});let guard=0;
      while(await frame.locator('#schedule-pagination').isVisible()&&!await frame.locator('#schedule-page-previous').isDisabled()&&guard++<30)await frame.locator('#schedule-page-previous').click();
      while(!await row.isVisible()&&!await frame.locator('#schedule-page-next').isDisabled()&&guard++<60)await frame.locator('#schedule-page-next').click();
      assert.equal(await row.isVisible(),true,'Die vollständige Sendung bleibt über die Kalenderseiten erreichbar');return row;
    }
    const dates=new Set();let guard=0;
    while(true){
      assert.ok(Math.abs(await frame.evaluate(()=>innerHeight-document.querySelector('.dialog-shell').getBoundingClientRect().bottom))<=1,'Jede Kalenderseite schließt bündig mit dem nativen Rahmen ab');
      for(const date of await frame.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate)))dates.add(date);
      if(!await frame.locator('#schedule-pagination').isVisible()||await frame.locator('#schedule-page-next').isDisabled())break;
      assert.ok(guard++<30);await frame.locator('#schedule-page-next').click();
    }
    assert.deepEqual([...dates].sort(),days.slice().sort(),'Alle 14 Tage bleiben mit größerer Schrift erreichbar');
    assert.equal(await frame.locator('#schedule-new').isVisible(),false);
    assert.equal(await frame.locator('.schedule-edit:visible').count(),0);
    assert.equal(await frame.locator('.schedule-owner-controls').count(),0);
    assert.doesNotMatch(await frame.locator('#schedule-panel').innerText(),/AutoDJ|Open End|Anmeldung|Verwaltung|Bearbeiten|Entfernen|eintragen/);
    assert.deepEqual((await frame.locator('.schedule-presenter').allTextContents()).sort(),['Mit Otterchen','Mit Polaroid']);
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true);
    for(const show of shows){const row=await revealShow(show.topic);
      assert.match(await row.locator('.schedule-time').textContent(),new RegExp(show.start+' – '+show.end));
      assert.equal(await row.locator('.schedule-presenter').textContent(),'Mit '+show.nick);
      const time=await row.locator('.schedule-time').boundingBox(),nick=await row.locator('.schedule-presenter').boundingBox();
      assert.ok(time.x<nick.x,'Uhrzeit und Moderation stehen nebeneinander');
      assert.ok(time.height<=26,'Die feste Zeitspanne bleibt samt Uhr in einer Zeile');
      const fonts=await row.evaluate(node=>[parseFloat(getComputedStyle(node.querySelector('.schedule-topic')).fontSize),parseFloat(getComputedStyle(node.querySelector('.schedule-presenter')).fontSize)]);
      assert.ok(fonts[0]>fonts[1],'Der Sendungstitel bleibt das wichtigste Textmerkmal');
    }
    if(client==='k3'&&process.env.MISCHWERK_CAPTURE_SCHEDULE){
      await listener.page.setViewportSize({width:1800,height:1400});
      const picture=listener.page.locator('#overlays iframe');await picture.scrollIntoViewIfNeeded();
      await picture.screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-hoerer-720.png')});
    }
    await revealShow(shows[0].topic);
    await listener.page.locator('#width').fill('320');await listener.page.locator('#width').dispatchEvent('change');
    await frame.waitForFunction(()=>innerWidth===320&&document.querySelector('.schedule-page:not([hidden]) .schedule-show'));
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.match(await frame.locator('.schedule-show:visible').first().textContent(),/Otterchen/);
    assert.ok(await frame.locator('.schedule-show:visible').first().evaluate(node=>parseFloat(getComputedStyle(node.querySelector('.schedule-topic')).fontSize)>parseFloat(getComputedStyle(node.querySelector('.schedule-presenter')).fontSize)));
    if(client==='k3'&&process.env.MISCHWERK_CAPTURE_SCHEDULE)await listener.page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-hoerer-320.png')});
    await frame.locator('#schedule-page-previous:not([disabled])').click();
    const chosen=await frame.locator('#schedule-page-label').textContent();
    assert.equal(await frame.locator('.schedule-show:visible').count(),0,'Auch eine leere Kalenderseite bleibt erreichbar');
    const edit=editor.locator('.schedule-show').filter({hasText:shows[0].topic}).locator('.schedule-edit');
    while(!await edit.isVisible())await editor.locator('#schedule-page-previous:not([disabled])').click();
    await edit.click();shows[0].topic+=' · aktualisiert';await editor.locator('#schedule-topic').fill(shows[0].topic);
    await editor.locator('#schedule-save').click();await editor.locator('#schedule-form').waitFor({state:'hidden'});
    await frame.locator('.schedule-topic').filter({hasText:shows[0].topic}).waitFor({state:'attached'});
    await frame.waitForTimeout(100);
    assert.equal(await frame.locator('#schedule-page-label').textContent(),chosen,'Geänderte Sendungsdaten versetzen den Hörer nicht auf eine andere Seite');
    await frame.locator('#schedule-refresh:not([disabled])').click();
    await frame.waitForFunction(()=>document.getElementById('schedule-refresh').getAttribute('aria-busy')==='false');
    await frame.waitForTimeout(100);
    assert.equal(await frame.locator('#schedule-page-label').textContent(),chosen,'Aktualisieren erhält die bewusst gewählte Seite');
    const seen=new Set();while(true){
      assert.ok(Math.abs(await frame.evaluate(()=>innerHeight-document.querySelector('.dialog-shell').getBoundingClientRect().bottom))<=1,'Auch schmale Kalenderseiten schließen bündig ab');
      for(const text of await frame.locator('.schedule-topic:visible').allTextContents())seen.add(text);
      if(await frame.locator('#schedule-page-next').isDisabled())break;
      await frame.locator('#schedule-page-next').click();
    }
    assert.deepEqual([...seen].sort(),shows.map(show=>show.topic).sort());
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Sendeplan öffnet in '+client+' sofort mit 720 × 600 ohne spätere Größenanforderung',async t=>{
    const lab=await setup(t,{hostSizing:'stepped',resourceDelayMs:20,serverDelayMs:150}),{page,radio}=await lab.join('Otterchen',client);
    await page.setViewportSize({width:1800,height:1400});
    await radio.waitForFunction(client=>client==='k3'||!document.documentElement.classList.contains('radio-constrained'),client);
    await radio.waitForFunction(()=>innerHeight>=document.getElementById('radio-panel').getBoundingClientRect().height-1);
    const radioHeight=await radio.evaluate(()=>innerHeight);
    const at=lab.hub.trace.length;
    await openRadioAction(radio,'open-schedule');
    const handle=await page.waitForSelector('#overlays iframe[src]');
    assert.equal(Math.round((await handle.boundingBox()).height),600,'Nativer Rahmen steht bereits vor dem fertigen Appinhalt');
    const frame=await handle.contentFrame();
    await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    await frame.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===14);
    await frame.waitForTimeout(800);
    const opened=lab.hub.trace.slice(at).find(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.width,720);assert.equal(opened.height,600);
    const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===opened.sessionId&&e.method==='setSize');
    assert.deepEqual(sizes(),[]);
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[720,600]);
    const compactPreview=await frame.evaluate(()=>{
      const rows=[...document.querySelectorAll('.schedule-day')].filter(node=>node.getClientRects().length);
      const list=document.getElementById('schedule-days').getBoundingClientRect();
      return {days:rows.length,heights:rows.map(node=>node.getBoundingClientRect().height),list:list.height,
        available:document.getElementById('schedule-pagination').getBoundingClientRect().top-list.top,
        summaryHidden:document.getElementById('schedule-summary').hidden};
    });
    assert.equal(compactPreview.days,5,'Fünf kompakte Vorschautage nutzen den breiten 600-px-Rahmen: '+JSON.stringify(compactPreview));
    assert.equal(compactPreview.summaryHidden,true,'Keine zusätzliche Ankündigungszeile über dem Programm');
    assert.ok(await frame.locator('.schedule-day:visible').count()>0,'Heute steht auf der ersten sichtbaren Kalenderseite');
    assert.equal(await frame.locator('.schedule-day:visible').first().getAttribute('data-schedule-date'),
      new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(lab.hub.runtime.clock.now())));
    assert.equal(await frame.locator('#schedule-pagination').isVisible(),true);
    if(client==='k3'){
      await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-820.png')});
      const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','sendeplan');fs.mkdirSync(folder,{recursive:true});
      await frame.locator('.schedule-controls').screenshot({path:path.join(folder,'Sendeplan-Kopf-293.png')});
    }
    await frame.locator('#schedule-new').click();await frame.locator('#schedule-topic').fill('Mein Entwurf');
    await frame.waitForTimeout(150);
    assert.deepEqual(sizes(),[]);assert.equal(await frame.locator('#schedule-topic').inputValue(),'Mein Entwurf');
    async function editorFits() {
      const layout=await frame.evaluate(()=>{
        const controls=[...document.querySelectorAll('#schedule-form input,#schedule-form select,#schedule-form button,#schedule-refresh,#close-overlay')].filter(node=>node.getClientRects().length).map(node=>{
          const rect=node.getBoundingClientRect();return {id:node.id,...rect.toJSON(),hit:document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button,input,select')===node};
        });
        return {width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,controls};
      });
      assert.equal(layout.height,600);assert.ok(layout.scrollHeight<=600,'Editor ohne vertikales Scrollen: '+JSON.stringify(layout));
      assert.ok(layout.scrollWidth<=layout.width,'Keine horizontale Überbreite');
      for(const control of layout.controls)assert.ok(control.y>=0&&control.bottom<=600&&control.x>=0&&control.right<=layout.width&&control.width>=44&&control.height>=44&&control.hit,'Bedienfläche vollständig und direkt erreichbar: '+JSON.stringify(control));
      assert.deepEqual(sizes(),[],'Kein Größenauftrag zum Einpassen des Formulars');
    }
    await frame.evaluate(()=>document.fonts.ready);
    for(const width of [720,560,390,320]) {
      await page.locator('#width').fill(String(width===720?1200:width));await page.locator('#width').dispatchEvent('change');
      await frame.waitForFunction(width=>innerWidth===width,width);await editorFits();
      assert.equal(await frame.locator('#schedule-topic').inputValue(),'Mein Entwurf');
      await frame.locator('#schedule-kind').selectOption('autodj');
      assert.equal(await frame.locator('#schedule-nick').inputValue(),'MischWerk');
      for(const timing of ['allDay','openEnd','fixed']){
        await frame.locator('#schedule-timing').selectOption(timing);await editorFits();
        assert.equal(await frame.locator('#schedule-start').isVisible(),timing!=='allDay');
        assert.equal(await frame.locator('#schedule-end').isVisible(),timing==='fixed');
      }
      await frame.locator('#schedule-kind').selectOption('live');
      assert.equal(await frame.locator('#schedule-nick').inputValue(),'Otterchen');
      if(client==='k3'&&width===720)await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-editor-820.png')});
    }
    await frame.locator('#schedule-nick').fill('KeinExistierenderNick');await frame.locator('#schedule-save').click();
    await frame.locator('#schedule-feedback.error').waitFor();await editorFits();
    await frame.locator('#schedule-refresh:not([disabled])').click();
    await frame.waitForFunction(()=>!document.getElementById('schedule-refresh').disabled&&!document.getElementById('schedule-fields').disabled);
    assert.equal(await frame.locator('#schedule-topic').inputValue(),'Mein Entwurf');
    await frame.locator('#schedule-nick').fill('Otterchen');
    await page.locator('#width').fill('1200');await page.locator('#width').dispatchEvent('change');
    await frame.locator('#schedule-save').click();
    await frame.locator('#schedule-form').waitFor({state:'hidden'});
    await frame.locator('.schedule-topic').filter({hasText:'Mein Entwurf'}).waitFor();
    await frame.locator('.schedule-show:visible .schedule-edit').first().click();
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');await frame.waitForFunction(()=>innerWidth===320);
    assert.equal(await frame.locator('#schedule-delete').isVisible(),true);await editorFits();
    if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-editor-320.png')});
    await frame.locator('#schedule-cancel').click();await frame.locator('#schedule-form').waitFor({state:'hidden'});
    await page.locator('#width').fill('1200');await page.locator('#width').dispatchEvent('change');
    await frame.locator('#schedule-next').click();
    await frame.waitForFunction(()=>!document.getElementById('schedule-next').disabled);
    assert.deepEqual(sizes(),[]);
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[320,600],'Der nativ verkleinerte Rahmen bleibt beim Wochenwechsel erhalten');
    const selectedWeek=await frame.locator('#schedule-range').textContent();
    await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
    await openRadioAction(radio,'open-schedule');
    const reopened=await view(page,'Overlay');
    await reopened.locator('#schedule-range').filter({hasText:selectedWeek}).waitFor();
    await reopened.locator('#schedule-current:not([disabled])').click();
    await reopened.locator('.schedule-topic').filter({hasText:'Mein Entwurf'}).waitFor({state:'attached'});
    const shown=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(shown.height,600);
    assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===shown.sessionId&&e.method==='setSize'),[],'Auch der befüllte Plan öffnet ohne Größenkorrektur');
    assert.equal(await radio.evaluate(()=>innerHeight),radioHeight);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
    await reopened.waitForFunction(()=>innerWidth===320);
    await reopened.waitForTimeout(150);
    if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/sendeplan/sendeplan-320.png')});
    if(client==='k3')await reopened.locator('.schedule-controls').screenshot({path:path.join(os.tmpdir(),'MischWerk-Pruefbilder','sendeplan','Sendeplan-Kopf-293-schmal.png')});
    const dates=new Set();
    while(await reopened.locator('#schedule-pagination').isVisible() && !(await reopened.locator('#schedule-page-previous').isDisabled())) {
      await reopened.locator('#schedule-page-previous').click();
    }
    while(true){
      for(const date of await reopened.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate)))dates.add(date);
      if(!(await reopened.locator('#schedule-pagination').isVisible())||await reopened.locator('#schedule-page-next').isDisabled())break;
      await reopened.locator('#schedule-page-next').click();
    }
    assert.equal(dates.size,14,'Native Breitenbegrenzung erhält alle 14 Vorschautage');
    assert.equal(await reopened.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {
  test('Aktualisieren in beiden echten Appfenstern: '+client+' bestätigt Antwort, Fehler und Wiederholung',async t=>{
    const lab=await setup(t,{},true),{page,radio}=await lab.join('Otterchen',client);
    for(const kind of ['studio','team']) {
      await openRadioAction(radio,kind==='studio'?'studio-tab':'team-tab');
      const frame=await view(page,'Overlay');
      const button=frame.locator(kind==='studio'?'#refresh-queue':'#refresh-radio-team');
      const feedback=frame.locator(kind==='studio'?'#queue-refresh-feedback':'#team-refresh-feedback');
      if(kind==='studio'&&await frame.locator('#studio-queue-tab').isVisible())await frame.locator('#studio-queue-tab').click();
      await frame.evaluate(()=>document.fonts.ready);
      await page.clock.runFor(500);
      await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
      const size=await frame.evaluate(()=>[innerWidth,innerHeight]);
      // Die Antwort bis nach der Busy-/Doppelklickprüfung halten; 100 ms wären unter Last ein Wettlauf.
      const sendUser=lab.hub.sendUser.bind(lab.hub),responses=[];
      lab.hub.sendUser=(nick,message)=>{
        if(message.type==='sessionEvent'&&message.eventType==='mw:state'&&message.eventData.refreshRequestId)
          responses.push(()=>sendUser(nick,message));
        else sendUser(nick,message);
      };
      const at=lab.hub.trace.length;
      await button.locator('svg').click();
      assert.equal(await button.getAttribute('aria-busy'),'true');
      await button.evaluate(b=>b.click());
      await new Promise((resolve,reject)=>{
        const until=Date.now()+8000;
        function ready(){if(responses.length)resolve();else if(Date.now()>until)reject(Error('Keine Refreshantwort'));else setTimeout(ready,10);}
        ready();
      });
      lab.hub.sendUser=sendUser;responses.splice(0).forEach(deliver=>deliver());
      await feedback.filter({hasText:'Aktualisiert'}).waitFor();
      const requests=lab.hub.trace.slice(at).filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:refresh');
      assert.equal(requests.length,1);
      assert.ok(lab.hub.trace.some(e=>e.kind==='sessionEvent'&&e.eventType==='mw:state'&&e.eventData.refreshRequestId===requests[0].eventData.requestId));
      assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),size);
      lab.hub.faults.serverDelayMs=0;lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:state';
      const dropped=lab.hub.trace.filter(e=>e.kind==='droppedServer').length;
      await button.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(n=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedServer').length>n,dropped);
      await page.clock.runFor(15001);
      assert.match(await feedback.textContent(),/Keine Antwort/);
      assert.equal(await button.getAttribute('aria-busy'),null);
      await page.keyboard.press('Space');await feedback.filter({hasText:'Aktualisiert'}).waitFor();
      await page.clock.runFor(250);
      assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),size,'Rückmeldungen ändern keine Fenstermaße');
      assert.equal(await button.evaluate(b=>b===document.activeElement),true);
      await frame.evaluate(()=>Client.close());await page.locator('#overlays iframe').waitFor({state:'detached'});
    }
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}
test('Parserstart zeigt alle Besitzeraktionen und korrekte Client-/Cacheverträge', async t => {
  const lab = await setup(t), { page, radio } = await lab.join();
  assert.equal(await radio.locator('#studio-tab').isVisible(), true);
  assert.equal(await radio.locator('#team-tab').count(), 0);
  assert.deepEqual(await radio.evaluate(() => [Client.isK3Client(), Client.getHostFrame().getAppViewMode(),
    Client.getCacheInvalidationId() === Client.getCacheInvalidationId()]), [true, 'HEADERBAR', true]);
  assert.ok(await radio.evaluate(() => Array.from(document.scripts).filter(script => script.src.includes('/app/')).every(script => new URL(script.src).searchParams.has('v'))));
  await page.locator('#inspect').click();
  await page.waitForFunction(() => window.EmulatorLab.trace.some(item => item.kind === 'layout' && item.ready));
  assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});
test('Zwei echte Nutzer: natives Overlay, Entwurf, doppeltes Senden und Erledigt bis zum Nachrücken', async t => {
  const lab = await setup(t), owner = await lab.join();
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  const listener = await lab.join('Testhoerer');
  const before = await listener.page.locator('#channel').boundingBox();
  await listener.radio.locator('#open-wishes').click();
  let surface = await view(listener.page, 'Overlay');
  assert.equal((await listener.page.locator('#channel').boundingBox()).y, before.y);
  assert.equal(await listener.radio.evaluate(() => innerHeight), 176);
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
  await listener.radio.locator('#own-wish-rank').filter({ hasText: 'Platz 1' }).waitFor();
  await owner.radio.locator('#studio-tab').click(); const studio = await view(owner.page, 'Overlay');
  const queueTab = studio.locator('#studio-queue-tab');
  if (await queueTab.isVisible()) await queueTab.click();
  await studio.locator('.request-text').filter({ hasText: 'Take On Me' }).waitFor();
  assert.match(await studio.locator('.request-sender').innerText(), /Testhoerer/);
  assert.equal(await studio.locator('#queue-count').innerText(), '1');
  await studio.locator('[data-outcome=done]').click();
  await studio.locator('#queue-count').filter({ hasText: '0' }).waitFor();
  await listener.radio.locator('#own-wish-position').waitFor({ state: 'hidden' });
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
  assert.equal(await radio.evaluate(() => innerHeight), 176);
  await page.locator('#width').fill('2290'); await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(() => innerWidth === 2290);
  assert.equal(await radio.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#inspect').click();
  assert.deepEqual(lab.errors, []);
});
test('Team-Popup öffnet die Verwaltung direkt und bleibt bei schrittweisen Hostantworten stabil', async t => {
  const lab = await setup(t, { hostSizing: 'stepped' }), { page, radio } = await lab.join('Otterchen', 'stapp');
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung')); const team = await view(page, 'Overlay');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].some(entry => entry.mode === 'Overlay' && entry.height === 560));
  assert.deepEqual(await team.evaluate(()=>[innerWidth,innerHeight]),[500,560]);
  const initialHeight = await team.evaluate(() => innerHeight);
  assert.equal(await team.locator('#team-status,#team-status-tab').count(),0);
  assert.deepEqual(await team.locator('.team-tabs [role=tab]').allTextContents(),['Radio-Team','Bot-Texte']);
  assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
  assert.equal(await team.evaluate(()=>innerHeight),initialHeight);
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    Math.abs(entry.element.getBoundingClientRect().height - entry.iframe.getBoundingClientRect().height) < 2));
  assert.equal(await page.evaluate(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    entry.element.getBoundingClientRect().bottom <= document.querySelector('#stage').getBoundingClientRect().bottom)), true);
  assert.equal(await team.evaluate(() => Client.getHostFrame().getAppViewMode()), 'OVERLAY');
  assert.equal(await radio.evaluate(() => Client.isK3Client()), false);
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
  await radio.locator('#notice').filter({ hasText: /nicht unterstützt|unterstützt.*nicht/ }).waitFor();
  assert.equal(await page.locator('#overlays iframe').count(), 0);
  assert.equal(await radio.evaluate(() => document.documentElement.classList.contains('mw-ready')), true);
});
test('Synthetischer Anbieter nutzt nur lokale Antworten und echtes HTML-Audio nach Play', async t => {
  const lab = await setup(t, { provider: 'online' }), { radio } = await lab.join();
  await radio.locator('#track-title').filter({ hasText: 'Lokaler Testtitel' }).waitFor();
  assert.equal(await radio.locator('#listener-count,#listener-value').count(), 0);
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
      await radio.locator('#stream-label').filter({ hasText: 'Sendepause' }).waitFor();
      assert.equal(await radio.locator('#play-button').isEnabled(), true);
      assert.equal(await radio.locator('#play-button').getAttribute('title'),'Radio abspielen');
      assert.match(await radio.locator('#stream-badge').getAttribute('aria-label'),/Sendepause/);
    } else {
      await radio.locator('#play-button:not([disabled])').waitFor();
      assert.equal(await radio.locator('#listener-count').count(), 0);
    }
    assert.equal(await radio.locator('#radio-audio').getAttribute('src'), null);
    assert.deepEqual(lab.external, []); assert.deepEqual(lab.errors, []);
  });
}
test('Parsermodus meldet verspätete Einbindung; fehlendes Modul verhindert falsches Grün', async t => {
  const lab = await setup(t), { page, radio } = await lab.join();
  await radio.waitForFunction(() => document.readyState !== 'loading');
  assert.match(await radio.evaluate(() => { try { Client.includeJS('js/start.js'); return ''; } catch (error) { return error.message; } }), /während des HTML-Parsens/);
  const loaded = await radio.evaluate(() => Array.from(document.scripts).map(s =>
    new URL(s.src, document.baseURI).pathname.match(/\/(js\/.*\.js)$/)?.[1]).filter(Boolean));
  const uiRoot = path.join(process.env.MISCHWERK_TEST_UPLOAD || path.resolve(__dirname, '../../app'), 'www');
  const missing = loaded.find(file => fs.existsSync(path.join(uiRoot, file)) &&
    fs.readFileSync(path.join(uiRoot, file), 'utf8').includes("define('player'"));
  assert.ok(missing, 'Tatsächlich geladenes Bündel mit Playerkomponente gefunden');
  await send(page, { type: 'faults', value: { resourceFailure: missing } });
  await page.waitForFunction(file => window.EmulatorLab.state.faults.resourceFailure === file, missing);
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
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  const { page, radio } = await lab.join('AppManager');
  assert.equal(await radio.locator('#studio-tab').isVisible(), false);
  assert.equal(await radio.locator('#team-tab').isVisible(), false);
  await page.locator('#role').selectOption('owner'); await page.locator('#apply-role').click();
  await page.waitForFunction(()=>window.EmulatorLab.state.users.find(u=>u.nick==='AppManager').role==='owner');
  assert.equal(await radio.locator('#studio-tab').isVisible(),false,'Inhaberrolle ersetzt keinen Radio-Team-Eintrag');
  assert.equal(await radio.locator('#team-tab').count(),0);
  assert.deepEqual(lab.errors, []);
});

test('Moderationserweiterung im strengen Emulator: private Wunschregie, Themenentwurf und Übergabenotizen zwischen drei Nutzern',async t=>{
  const lab=await setup(t,{hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp');
  await owner.page.setViewportSize({width:1800,height:1400});
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  await owner.radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));let team=await view(owner.page,'Overlay');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  const dj=await lab.join('DJ-Test','k3'),listener=await lab.join('Testhoerer','stapp');
  await dj.page.setViewportSize({width:1800,height:1400});
  await listener.radio.locator('#open-wishes').click();const surface=await view(listener.page,'Overlay');
  await surface.locator('#wish-text').fill('Unser gemeinsamer Testwunsch');await surface.locator('#submit-wish').click();
  await listener.radio.locator('#own-wish-rank').filter({hasText:'Platz 1'}).waitFor();
  const oldPopup=await owner.page.locator('#overlays iframe').getAttribute('src');
  await owner.radio.locator('#studio-tab').click();
  const studio=await overlayView(owner.page,'studio');
  assert.notEqual(await owner.page.locator('#overlays iframe').getAttribute('src'),oldPopup);
  await studio.locator('#on-air').click();await studio.locator('#off-air:not([disabled])').waitFor();
  if(await studio.locator('#studio-queue-tab').isVisible())await studio.locator('#studio-queue-tab').click();
  await studio.locator('[data-stage=preparing]').click();await listener.radio.locator('#own-wish-stage').filter({hasText:'In Vorbereitung'}).waitFor();
  await studio.locator('[data-stage=playing]').click();await listener.radio.locator('#own-wish-stage').filter({hasText:'Läuft gerade'}).waitFor();
  assert.equal(await listener.radio.locator('#own-wish-rank').textContent(),'Platz 1');
  if(await studio.locator('#studio-programme-tab').isVisible())await studio.locator('#studio-programme-tab').click();
  const runtime=lab.hub.runtime;
  assert.equal(await studio.locator('#studio-plan').count(),0);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.get'),false,'Moderation liest keine Sendezeiten');
  await revealStudio(studio,'#studio-topic');await studio.locator('#studio-topic').fill('Unser geplanter Themenabend');
  await studio.locator('#save-topic').click();await studio.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();
  await revealStudio(studio,'#handover-open');await studio.locator('#handover-open').click();await studio.locator('#handover-notes').fill('Bitte die Geburtstagsgrüße übernehmen.');
  await studio.locator('#handover-target').selectOption('DJ-Test');await studio.locator('#handover-request').click();
  await dj.radio.locator('#studio-tab').click();const target=await view(dj.page,'Overlay');
  await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();assert.match(await require('../support/studio-browser.cjs').readText(target,'#handover-note-text','handover'),/Geburtstagsgrüße/);
  await revealStudio(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Nächste Sendung');await revealStudio(target,'#handover-accept','handover');await target.locator('#handover-accept').click();
  await target.locator('#studio-received-notes:not([hidden])').waitFor({state:'attached'});
  await revealStudio(target,'#studio-notes-text');await target.locator('#studio-notes-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#studio-queue-tab').waitFor();
  await target.locator('#studio-queue-tab').click();
  await target.locator('[data-outcome=done]').click();await listener.radio.locator('#own-wish-position').waitFor({state:'hidden'});
  assert.equal(runtime.errors.length,0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Übergabe in '+client+' bleibt bei höchstens 320 × 360 und verlorener Annahmequittung vollständig bedienbar',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp',320);
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  await owner.radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));const team=await overlayView(owner.page,'team');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  await team.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});
  const dj=await lab.join('DJ-Test',client,320);
  for(const person of [owner,dj]){await person.radio.locator('#play-button:not([disabled])').click();await person.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);await person.radio.locator('#radio-audio').evaluate(a=>{a.loop=true;});}
  await owner.radio.locator('#studio-tab').click();const source=await overlayView(owner.page,'studio');
  await source.locator('#on-air').click();await source.locator('#off-air:not([disabled])').waitFor();
  await owner.page.setViewportSize({width:1800,height:490});await dj.page.setViewportSize({width:1800,height:490});
  await owner.page.locator('#overlays .app-window').evaluate(node=>{node.style.height='360px';});
  await source.waitForFunction(()=>innerWidth===320&&innerHeight===360);await revealStudio(source,'#handover-open');await source.locator('#handover-open').click();
  const notes='Private Notizen für die nächste Sendung. '.repeat(14).slice(0,500).trim();
  await revealStudio(source,'#handover-notes','handover');await source.locator('#handover-notes').fill(notes);
  await revealStudio(source,'#handover-request','handover');await source.locator('#handover-request').click();await source.locator('#handover-cancel').waitFor();
  await dj.radio.locator('#studio-tab').click();const target=await overlayView(dj.page,'studio');await revealStudio(target,'#handover-open');await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();
  assert.equal(await require('../support/studio-browser.cjs').readText(target,'#handover-note-text','handover'),notes);
  await revealStudio(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Die neue bestätigte Sendung');
  await revealStudio(target,'#handover-accept','handover');lab.hub.faults.dropServerType='mw:result';lab.hub.faults.dropServer=1;
  await target.locator('#handover-accept').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
  await revealStudio(target,'#off-air');assert.equal(await target.locator('#off-air').isDisabled(),false);
  assert.equal(await target.locator('#studio-topic').inputValue(),'Die neue bestätigte Sendung');
  assert.equal(await require('../support/studio-browser.cjs').readText(target,'#studio-notes-text'),notes);
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator.userId,lab.hub.runtime.users.find('DJ-Test').state.id);
  assert.ok(lab.hub.trace.some(e=>e.kind==='droppedServer'&&e.nick==='DJ-Test'&&e.eventType==='mw:result'));
  for(const person of [owner,dj])assert.equal(await person.radio.locator('#radio-audio').evaluate(a=>!a.paused&&a.currentTime>0),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Native Wunschliste zeigt drei Einträge, erhält die Auswahl über Fensterseiten und quittiert nur den ausgewählten Wunsch',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen','stapp');
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  // Der zwölfsekündige Testton darf während des vollständigen Listenablaufs nicht enden.
  await radio.evaluate(()=>{window.__listAudio=document.getElementById('radio-audio');window.__listAudio.loop=true;});
  await lab.join('Testhoerer','k3');
  const runtime=lab.hub.runtime,header=[...runtime.contents.sessions.keys()].find(id=>{const s=runtime.contents.describe(id);return s.nick==='Testhoerer'&&s.mode==='Headerbar';});
  for(let i=1;i<=5;i++)runtime.event('Testhoerer',header,'mw:wish.submit',{submissionId:'native-list-'+i,text:'Nativer Listenwunsch '+i});
  await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
  const acks=()=>lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:ackRequest');
  assert.equal(acks().length,0);await studio.locator('#studio-queue-tab').click();
  await assertEventually(()=>acks().length===1);
  assert.equal(await studio.locator('.queue-item').count(),3);
  await studio.locator('[data-position="1"]').click();await studio.locator('.request-text').filter({hasText:'Listenwunsch 2'}).waitFor();
  await assertEventually(()=>acks().length===2);
  assert.notEqual(acks()[0].eventData.id,acks()[1].eventData.id);
  await studio.locator('#next-page').click();await studio.locator('.request-text').filter({hasText:'Listenwunsch 3'}).waitFor();
  await studio.locator('#next-page').click();await studio.locator('.request-text').filter({hasText:'Listenwunsch 4'}).waitFor();
  assert.equal(await studio.locator('.queue-item').count(),2);
  await studio.locator('#prev-page').click();await studio.locator('.request-text').filter({hasText:'Listenwunsch 3'}).waitFor();
  assert.equal(await studio.locator('.queue-item').count(),3);
  await studio.locator('[data-outcome=done]').click();await studio.locator('#queue-count').filter({hasText:'4'}).waitFor();
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__listAudio&&!window.__listAudio.paused),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Alle nativen Öffnungen in '+client+' behalten getrennte native Anfänge und ausschließlich freigegebene Inhaltshöhen',async t=>{
 const lab=await setup(t,{provider:'online',resourceDelayMs:10}),{page,radio}=await lab.join('Otterchen',client,2290);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);const entries=[['studio-tab','studio',640,580],['team-tab','team',500,560],['open-schedule','schedule',720,600],['open-wishes','wishes',480,340]];
 for(const [from,kind] of entries){const previous=await page.locator('#overlays iframe').count()?await page.locator('#overlays iframe').getAttribute('src'):null;await openRadioAction(radio,from);await page.waitForFunction(previous=>{const n=document.querySelector('#overlays iframe');return n&&n.getAttribute('src')!==previous;},previous);await overlayView(page,kind);for(const [button,target,width,height] of entries){const old=await page.locator('#overlays iframe').getAttribute('src');await openRadioAction(radio,button);await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,old);const frame=await overlayView(page,target);const actual=await frame.evaluate(()=>[innerWidth,innerHeight]);assert.equal(actual[0],width);if(target==='studio')assert.ok(actual[1]>0&&actual[1]<=height);else assert.equal(actual[1],height);assertAllowedOverlaySizes(lab);assert.equal(await frame.locator('#'+target+'-panel').isVisible(),true);}}
 assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:view'),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Rechteverlust löscht gespeicherte native Verwaltungsentwürfe vor erneuter Öffnung',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',2290);await radio.locator('#studio-tab:not([disabled])').click();let frame=await overlayView(page,'studio');await frame.locator('#studio-topic').fill('Privater Studioentwurf');await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));frame=await overlayView(page,'team');await frame.locator('#radio-moderator-nick').fill('Privater Teamnick');await openRadioAction(radio,'open-schedule');frame=await overlayView(page,'schedule');await frame.locator('#schedule-new').click();await frame.locator('#schedule-topic').fill('Privater Planentwurf');await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');const runtime=lab.hub.runtime,record=runtime.users.find('Otterchen');const headerId=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Headerbar');runtime.event('Otterchen',headerId,'mw:removeRadioModerator',{userId:record.state.id});record.state.role='listener';let id=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Overlay');runtime.event('Otterchen',id,'mw:refresh',{});await radio.locator('#studio-tab').waitFor({state:'hidden'});record.state.role='owner';runtime.event('Otterchen',headerId,'mw:addRadioModerator',{nick:'Otterchen'});runtime.event('Otterchen',id,'mw:refresh',{});await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));await openRadioAction(radio,'open-schedule');frame=await overlayView(page,'schedule');assert.equal(await frame.locator('#schedule-form').isHidden(),true);await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');assert.equal(await frame.locator('#studio-topic').inputValue(),'');assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Wiederöffnen über Moderation erhält den Wunschentwurf und setzt die Eingabesequenz der neuen Sitzung zurück',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','k3',2290);
  await radio.locator('#open-wishes:not([disabled])').click();let surface=await overlayView(page,'wishes');
  for(const text of ['Erste Eingabe','Zweite Eingabe','Erhaltener Wunschentwurf'])await surface.locator('#wish-text:not([disabled])').fill(text);
  await surface.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();surface=await overlayView(page,'studio');
  await radio.locator('#open-wishes:not([disabled])').click();surface=await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Erhaltener Wunschentwurf');
  await surface.locator('#wish-text:not([disabled])').fill('Neue Eingabe nach Wiederöffnung');
  await radio.locator('#studio-tab:not([disabled])').click();assert.notEqual(await overlayView(page,'studio'),surface);
  await radio.locator('#open-wishes:not([disabled])').click();surface=await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Neue Eingabe nach Wiederöffnung');
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Langer Wunschentwurf wird nach verborgenem Größenwechsel in '+client+' beim Zurückkehren vollständig neu gemessen',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,700);
  await radio.locator('#open-wishes:not([disabled])').click();let frame=await overlayView(page,'wishes');
  const text=('Langer Wunschtext mit Interpret und Titel. ').repeat(8).slice(0,300);
  await frame.locator('#wish-text:not([disabled])').fill(text);
  await radio.locator('#studio-tab:not([disabled])').click();await overlayView(page,'studio');
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await (await overlayView(page,'studio')).waitForFunction(()=>innerWidth===320);
  await radio.locator('#open-wishes:not([disabled])').click();const next=await overlayView(page,'wishes');assert.notEqual(next,frame);frame=next;
  await frame.waitForFunction(()=>{const n=document.getElementById('wish-text');return n.scrollHeight<=n.clientHeight+1;});
  assert.equal(await frame.locator('#wish-text').inputValue(),text);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])for(const width of [320,2290])test('Overlaydesign: matte Tasten, stabile Druckfläche und Tastaturfokus in '+client+' bei '+width+' px',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,width);
  // Primäraktionen sind silbern, der Hörerplan verwendet eine dunkle Sekundäraktion.
  for(const [entry,kind,control]of [['studio-tab','studio','on-air'],['team-tab','team','add-radio-moderator'],['open-schedule','schedule','schedule-new'],['open-wishes','wishes','submit-wish']]){
    await openRadioAction(radio,entry);const frame=await overlayView(page,kind);
    if(kind==='team')await frame.locator('#radio-moderator-nick').fill('DJ-Test');
    if(kind==='wishes')await frame.locator('#wish-text:not([disabled])').fill('a-ha – Take On Me');
    if(kind==='studio'||kind==='team')assert.equal(await frame.locator('#studio-connection').isVisible(),false);
    const button=frame.locator('#'+control+':not([disabled])');await button.scrollIntoViewIfNeeded();
    await page.mouse.move(0,0);
    const resting=await button.evaluate(n=>{const s=getComputedStyle(n);return{background:s.backgroundColor,image:s.backgroundImage,shadow:s.boxShadow,textShadow:s.textShadow,transform:s.transform};});
    assert.equal(resting.background,kind==='schedule'?'rgba(0, 0, 0, 0)':kind==='wishes'?'rgb(233, 234, 236)':'rgb(230, 199, 123)');assert.equal(resting.image,'none');
    assert.equal(resting.shadow,'none');assert.equal(resting.textShadow,'none');assert.equal(resting.transform,'none');
    await button.hover();await frame.waitForTimeout(180);const hover=await button.evaluate(n=>getComputedStyle(n).backgroundColor);assert.notEqual(hover,resting.background);
    const before=await button.boundingBox();await page.mouse.down();
    await frame.waitForTimeout(180);const down=await button.evaluate(n=>getComputedStyle(n).backgroundColor);assert.notEqual(down,hover);
    assert.deepEqual(await button.boundingBox(),before,'Drücken verschiebt oder skaliert die Taste nicht');
    await page.mouse.move(0,0);await page.mouse.up();
    await page.keyboard.press('Tab');await button.focus();
    assert.equal(await button.evaluate(n=>n.matches(':focus-visible')&&parseFloat(getComputedStyle(n).outlineWidth)>=3),true);
    const small=await frame.evaluate(()=>[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility==='visible'&&!n.closest('[hidden]')).filter(n=>{const r=n.getBoundingClientRect();return r.width<43.9||r.height<43.9;}).map(n=>n.id||n.textContent));
    assert.deepEqual(small,[],'Alle sichtbaren Tasten behalten mindestens 44 × 44 px');
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Overlaydesign: kompakte Rückmeldungen bleiben in '+client+' bei Eingabe, Fehler und Versand an der Aktion',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,320);
  async function inline(frame,selector,parent){
    const box=frame.locator(selector);await box.waitFor();
    assert.equal(await box.evaluate((n,parent)=>!!n.closest('#'+parent),parent),true);
    assert.equal(await box.evaluate(n=>{const s=getComputedStyle(n);return s.position==='static'&&s.fontSize===(n.id==='topic-feedback'?'12px':'13px')&&s.boxShadow==='none'&&n.scrollWidth<=n.clientWidth+1;}),true);
    await box.scrollIntoViewIfNeeded();
  }
  await radio.evaluate(()=>Client.executeSlashCommand('/MW Verwaltung'));let frame=await overlayView(page,'team');
  await frame.locator('#radio-moderator-nick').fill('DieserNickExistiertNicht');await frame.locator('#add-radio-moderator').click();
  await inline(frame,'#notice.error','radio-moderator-form');assert.equal(await frame.locator('#notice').getAttribute('role'),'alert');
  await frame.locator('#radio-moderator-nick').fill('DJ-Test');await frame.locator('#add-radio-moderator').click();await frame.locator('.team-member').filter({hasText:'DJ-Test'}).waitFor();
  await inline(frame,'#notice:not(.error)','radio-moderator-form');
  await frame.locator('.team-member').filter({hasText:'DJ-Test'}).locator(':scope > button').click();lab.hub.faults.failPersistence=true;
  await frame.locator('[data-confirm-removal]').click();await frame.locator('.team-removal-feedback:not([hidden])').waitFor();
  assert.equal(await frame.locator('#notice.error:visible').count(),0,'Entzugsfehler wird ausschließlich am betroffenen Mitglied ausgegeben');
  lab.hub.faults.failPersistence=false;
  await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');
  await frame.locator('#on-air').click();await inline(frame,'#notice:not(.error)','studio-controls');
  await revealStudio(frame,'#studio-topic');await frame.locator('#studio-topic').fill('Unser Musikabend');await frame.locator('#save-topic').click();await frame.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();await inline(frame,'#topic-feedback','topic-form');
  await openRadioAction(radio,'open-schedule');frame=await overlayView(page,'schedule');await frame.locator('#schedule-new').click();
  await frame.locator('#schedule-end').fill(await frame.locator('#schedule-start').inputValue());await frame.locator('#schedule-topic').fill('Mein unverlorener Entwurf');await frame.locator('#schedule-save').click();
  await inline(frame,'#schedule-feedback.error','schedule-form');assert.equal(await frame.locator('#schedule-topic').inputValue(),'Mein unverlorener Entwurf');
  await radio.locator('#open-wishes:not([disabled])').click();frame=await overlayView(page,'wishes');await frame.locator('#wish-text:not([disabled])').fill('https://example.com');await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.error').waitFor();assert.equal(await frame.locator('#wish-text').inputValue(),'https://example.com');
  const deliver=lab.hub.sendUser.bind(lab.hub),receipts=[];
  lab.hub.sendUser=(nick,message)=>{if(message.type==='sessionEvent'&&message.eventType==='mw:wish.receipt')receipts.push(()=>deliver(nick,message));else deliver(nick,message);};
  await frame.locator('#wish-text').fill('a-ha – Take On Me');await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.pending').waitFor();
  lab.hub.sendUser=deliver;receipts.splice(0).forEach(send=>send());await frame.locator('#wish-feedback.success').waitFor();
  assert.equal(await frame.locator('#wish-feedback').evaluate(n=>{const s=getComputedStyle(n);return s.fontSize==='13px'&&s.boxShadow==='none'&&n.scrollWidth<=n.clientWidth+1;}),true);
  assert.equal(await frame.locator('#wish-feedback').evaluate(n=>getComputedStyle(n).position==='relative'&&parseFloat(getComputedStyle(n).paddingLeft)>=38&&getComputedStyle(n,'::before').width==='18px'),true,'Quittungssymbol bleibt innerhalb der zugehörigen Rückmeldung');
  assert.equal(await frame.locator('#wish-rules').textContent(),'Welcher Song darf’s sein?');
  assertAllowedOverlaySizes(lab);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


function assertAllowedOverlaySizes(lab) {
  const wishes=new Set(lab.hub.trace.filter(e=>e.kind==='contentShow'&&['wishes','studio'].includes(e.pageData?.view)).map(e=>e.sessionId));
  for(const event of lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&['setSize','setMinSize','setMaxSize','setResizable'].includes(e.method))){
    assert.equal(event.method,'setSize');assert.equal(wishes.has(event.sessionId),true,'Größenanpassung ausschließlich in Wunschbestätigung oder kompakter Moderation');assert.ok(event.width>0&&event.height>0);
  }
}

for(const client of ['k3','stapp'])for(const width of [320,390,2290])test('Wunschbestätigung passt in '+client+' bei '+width+' px ohne Scrollen vollständig in denselben nativen Rahmen',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,width);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__wishFitAudio=document.getElementById('radio-audio');});
  await radio.locator('#open-wishes:not([disabled])').click();let frame=await overlayView(page,'wishes');
  const source=await page.locator('#overlays iframe').getAttribute('src');
  assert.equal(await frame.evaluate(()=>innerHeight),340,'Erstes leeres Formular behält sein kompaktes Anfangsmaß');
  async function fits(){
    await frame.waitForFunction(()=>{const p=document.getElementById('wishes-panel').getBoundingClientRect(),b=document.getElementById(document.getElementById('wish-form').hidden?'wish-compose-open':'submit-wish').getBoundingClientRect();return Math.abs(Math.ceil(p.height)-innerHeight)<=1&&b.top>=0&&b.bottom<=innerHeight+1&&document.body.scrollHeight<=document.body.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1;},null,{timeout:5000});
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  for(const text of ['Aha - Take On Me',('Interpret und ein vollständiger langer Songtitel. ').repeat(7).slice(0,300)]){
    if(await frame.locator('#wish-compose-open').isVisible())await frame.locator('#wish-compose-open').click();
    await frame.locator('#wish-text:not([disabled])').fill(text);await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.success').waitFor();await frame.locator('#wish-compose-open').waitFor();await fits();
    assert.equal(await page.locator('#overlays iframe').getAttribute('src'),source,'Kein Ersetzen oder erneutes Öffnen nach dem Absenden');
  }
  assert.equal(await frame.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
  await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor();
  assert.equal(await radio.locator('#own-wish-title').textContent(),'Aha - Take On Me');
  if(process.env.MISCHWERK_CAPTURE_WISH196&&client==='stapp'&&[320,2290].includes(width)){
    await frame.locator('#wish-feedback').waitFor({state:'hidden'});await fits();
    await frame.locator('#wishes-panel').screenshot({path:path.resolve(__dirname,'../../docs/pruefung/oberflaeche/wunschbox/wunschbox-nach-versand-'+(width===320?320:560)+'.png')});
  }
  await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  await frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await fits();
  const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  await frame.waitForTimeout(800);assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count,'Unveränderter Inhalt erzeugt keine weiteren Größenaufträge');
  await frame.locator('#wish-compose-open').click();await frame.locator('#wish-text:not([disabled])').fill('Mein weiterer Entwurf');await fits();
  await frame.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#open-wishes:not([disabled])').click();frame=await overlayView(page,'wishes');await fits();assert.equal(await frame.locator('#wish-text').inputValue(),'Mein weiterer Entwurf');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__wishFitAudio&&!window.__wishFitAudio.paused),true);
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const constraint of ['ignored','clamped'])test('Wunschhöhe bleibt bei '+constraint+' im '+client+' ohne Größenwiederholung vollständig erreichbar',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:constraint==='ignored'?'ignored':'normal'}),{page,radio}=await lab.join('Otterchen',client,320);
  if(constraint==='clamped')await page.setViewportSize({width:1800,height:550});
  await radio.locator('#open-wishes:not([disabled])').click();const frame=await overlayView(page,'wishes');
  await frame.locator('#wish-text:not([disabled])').fill(('Ein vollständiger langer Wunsch ohne Kürzung. ').repeat(8).slice(0,300));await frame.locator('#submit-wish').click();await frame.locator('#wish-compose-open').waitFor();
  await frame.locator('#wish-compose-open').scrollIntoViewIfNeeded();assert.equal(await frame.locator('#wish-compose-open').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight+1),true);
  await frame.waitForTimeout(500);const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;assert.ok(count>0);
  await frame.waitForTimeout(1200);assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count);
  await frame.locator('#wish-compose-open').click();await frame.locator('#wish-text:not([disabled])').fill(('Erhaltener langer weiterer Entwurf. ').repeat(9).slice(0,300));await frame.locator('#submit-wish').scrollIntoViewIfNeeded();assert.equal(await frame.locator('#wish-text').inputValue(),('Erhaltener langer weiterer Entwurf. ').repeat(9).slice(0,300));
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Vorhang wird in '+client+' ausschließlich per Chat bedient und erhält laufendes Audio',async t=>{
  const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1920),listener=await lab.join('Testhoerer',client,390);
  assert.equal(await owner.radio.locator('#curtain-toggle').count(),0);
  const drape=listener.radio.locator('.curtain-drape');
  assert.equal(await drape.count(),1,'Eigene rein dekorative Stoffhälften');
  assert.equal(await drape.getAttribute('aria-hidden'),'true');
  assert.equal(await drape.evaluate(n=>getComputedStyle(n).pointerEvents),'none');
  async function wings() {
    return drape.evaluate(node=>['::before','::after'].map(pseudo=>{
      const style=getComputedStyle(node,pseudo),matrix=new DOMMatrixReadOnly(style.transform);
      return {x:matrix.m41,width:parseFloat(style.width),color:style.backgroundColor};
    }));
  }
  const closedWings=await wings();assert.ok(closedWings.every(wing=>wing.x===0));
  assert.ok(closedWings.every(wing=>{const [r,g,b]=wing.color.match(/\d+/g).map(Number);return r>3*g&&r>2*b;}),'Roter Samtgrund');
  assert.equal(await owner.radio.locator('.curtain-drape').evaluate(n=>n.getAnimations({subtree:true}).length),0,'Ausnahme erhält keine künstliche Startanimation');
  await listener.radio.locator('#curtain-ad').waitFor();await listener.radio.locator('#curtain-ad').click();
  await listener.radio.waitForFunction(()=>!document.getElementById('curtain-audio').paused);
  const chat=async (person,params)=>{await person.page.locator('#chat-input').fill('/vorhang '+params);await person.page.locator('#chat-form button').click();};
  await chat(listener,'öffnen');await listener.page.locator('#chat').filter({hasText:'Nur Otterchen als Channelinhaber'}).waitFor();
  assert.equal(await listener.radio.locator('#radio-curtain').isVisible(),true);
  await chat(owner,'öffnen');await owner.page.locator('#chat').filter({hasText:'Vorhang geöffnet.'}).waitFor();
  await listener.radio.locator('#radio-curtain').waitFor({state:'hidden'});
  assert.equal(await listener.radio.locator('#radio-panel').evaluate(n=>n.inert),false,'Logische Freigabe wartet nicht auf Dekoration');
  await listener.radio.waitForFunction(()=>document.querySelector('.curtain-drape').getAnimations({subtree:true}).length===2);
  await drape.evaluate(node=>{
    window.__curtainMotion=node.getAnimations({subtree:true});
    __curtainMotion.forEach(animation=>{animation.pause();animation.currentTime=animation.effect.getTiming().duration*.35;});
  });
  const middle=await wings();
  assert.ok(middle[0].x<0&&middle[0].x>-middle[0].width&&middle[1].x>0&&middle[1].x<middle[1].width,'Stoffhälften öffnen tatsächlich gegenläufig');
  await listener.radio.evaluate(()=>Client.sendEvent('mw:refresh'));
  await listener.radio.waitForTimeout(60);
  assert.equal(await drape.evaluate(n=>n.getAnimations({subtree:true}).every(animation=>__curtainMotion.includes(animation))),true,'Identischer Snapshot startet keine neue Bewegung');
  await drape.evaluate(()=>__curtainMotion.forEach(animation=>animation.finish()));
  const opened=await wings();assert.ok(opened[0].x<=-opened[0].width&&opened[1].x>=opened[1].width,'Stoff vollständig außerhalb der Leiste');
  assert.equal(await listener.radio.evaluate(()=>!document.getElementById('curtain-audio').paused),true);
  await listener.radio.locator('#play-button:not([disabled])').click();await listener.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await listener.radio.evaluate(()=>{window.__curtainAudio=document.getElementById('radio-audio');});
  await chat(owner,'schließen');await owner.page.locator('#chat').filter({hasText:'Vorhang geschlossen.'}).waitFor();
  await listener.radio.locator('#radio-curtain').waitFor();
  assert.equal(await listener.radio.evaluate(()=>document.getElementById('radio-audio')===window.__curtainAudio&&!window.__curtainAudio.paused),true);
  assert.equal(await owner.radio.locator('#radio-curtain').isVisible(),false);
  await chat(owner,'toggle');await owner.page.locator('#chat').filter({hasText:'Bitte verwende /vorhang öffnen oder /vorhang schließen.'}).waitFor();
  assert.equal(await listener.radio.locator('#radio-curtain').isVisible(),true);
  await listener.page.emulateMedia({reducedMotion:'reduce'});
  await chat(owner,'öffnen');await listener.radio.locator('#radio-curtain').waitFor({state:'hidden'});
  assert.equal(await drape.evaluate(n=>n.getAnimations({subtree:true}).length),0,'Reduzierte Bewegung öffnet unmittelbar');
  const reduced=await wings();assert.ok(reduced[0].x<=-reduced[0].width&&reduced[1].x>=reduced[1].width);
  assert.equal(await listener.radio.evaluate(()=>document.getElementById('radio-audio')===window.__curtainAudio&&!window.__curtainAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])test('Wunschrelay in '+client+' bündelt gleichzeitiges Tippen dreier Nutzer unter dem beobachteten Eventbudget und erhält Schlusszeichen',async t=>{
 const lab=await setup(t,{provider:'online'}),records=[],log=lab.hub.log.bind(lab.hub);
 lab.hub.log=(kind,data)=>{const item=log(kind,data);records.push(item);return item;};
 const users=[];users.push({...await lab.join('Otterchen',client,1360),nick:'Otterchen'});
 lab.hub.runtime.command('Otterchen','vorhang','öffnen');
 for(const nick of ['Polaroid','DJ-Test'])users.push({...await lab.join(nick,client,1360),nick});
 for(const item of users){await item.radio.locator('#open-wishes:not([disabled])').click();item.surface=await overlayView(item.page,'wishes');await item.surface.locator('#wish-fields:not([disabled])').waitFor();item.text='Wunsch '+item.nick+' – abcdefghijklmnopqrstuvwxyz 1234567890 Schlusszeichen';}
 await users[0].radio.evaluate(()=>{window.__relayAudio=document.getElementById('radio-audio');__relayAudio.loop=true;});await users[0].radio.locator('#play-button:not([disabled])').click();await users[0].radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 const begin=records.length;
 await Promise.all(users.map(item=>item.surface.locator('#wish-text').pressSequentially(item.text,{delay:25})));
 // Ohne Wartezeit schließen: der noch gebündelte Rest muss vorher übernommen werden.
 await Promise.all(users.map(async item=>{await item.surface.locator('#close-wishes').click();await item.page.locator('#overlays iframe').waitFor({state:'detached'});await item.radio.locator('#open-wishes:not([disabled])').click();item.surface=await overlayView(item.page,'wishes');assert.equal(await item.surface.locator('#wish-text').inputValue(),item.text);}));
 await Promise.all(users.map(async item=>{await item.surface.locator('#submit-wish:not([disabled])').click();await item.surface.locator('#wish-feedback.success').waitFor();await item.radio.locator('#own-wish-title').filter({hasText:item.text}).waitFor();}));
 const sent=records.slice(begin).filter(e=>e.kind==='sessionEvent'),peaks={};
 for(const item of users){const messages=sent.filter(e=>e.nick===item.nick).sort((a,b)=>a.realAt-b.realAt);let start=0,peak=0;for(let end=0;end<messages.length;end++){while(messages[end].realAt-messages[start].realAt>=5000)start++;peak=Math.max(peak,end-start+1);}peaks[item.nick]=peak;assert.ok(peak<=40,JSON.stringify({client,peaks}));const submissions=records.slice(begin).filter(e=>e.kind==='clientEvent'&&e.nick===item.nick&&e.eventType==='mw:wish.submit');assert.equal(submissions.length,1);assert.equal(submissions[0].eventData.text,item.text);const state=records.findLast(e=>e.kind==='sessionEvent'&&e.nick===item.nick&&e.eventType==='mw:state').eventData;assert.equal(state.wishPositions.total,1);assert.equal(state.wishPositions.nextItem.text,item.text);}
 assert.equal(await users[0].radio.evaluate(()=>document.getElementById('radio-audio')===window.__relayAudio&&!__relayAudio.paused),true);
 for(const item of users)lab.hub.runtime.leave(item.nick);
 assert.equal(records.filter(e=>e.kind==='sessionRemoveRepeated').length,0,'Keine doppelten nativen Schließaufträge beim Verlassen mit offenen Wunschfenstern');
 console.log('Eventbudget '+client+': '+JSON.stringify(peaks)+' Serverevents je Nutzer im stärksten 5-s-Fenster bei drei gleichzeitigen Schreibern');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for (const client of ['k3','stapp']) test('Verwaltung wird in '+client+' über den eingegebenen Chatbefehl geöffnet und erhält Radio und Entwurf', async t => {
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,2290);
  assert.equal(await radio.locator('#team-tab').count(),0);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__administrationAudio=document.getElementById('radio-audio');__administrationAudio.loop=true;});
  async function command() { await page.locator('#chat-input').fill('/MW Verwaltung'); await page.locator('#chat-form button').click(); }
  await command(); let team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Privater Verwaltungsentwurf');
  await team.locator('#close-overlay').click(); await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-schedule').evaluate(n=>document.activeElement===n),true);
  await command(); team=await overlayView(page,'team');
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Privater Verwaltungsentwurf');
  assert.equal(await radio.evaluate(()=>window.__administrationAudio===document.getElementById('radio-audio')&&!__administrationAudio.paused),true);
  assert.ok(lab.hub.trace.some(e=>e.kind==='contentShow'&&e.mode==='Overlay'));
  await team.locator('#close-overlay').click(); await page.locator('#overlays iframe').waitFor({state:'detached'});
  if (process.env.MISCHWERK_ADMIN_CAPTURE && client==='stapp') {
    await page.setViewportSize({width:2700,height:1400});
    await radio.evaluate(()=>document.fonts.ready);
    await radio.locator('#open-schedule').evaluate(node=>node.blur());
    if(process.env.MISCHWERK_GLOW_CAPTURE)await radio.locator('.radio-program-face').evaluate(n=>{for(const a of n.getAnimations()){a.pause();a.currentTime=32000;}});
    const directory=path.resolve(__dirname,'../../docs/pruefung/oberflaeche/radio');
    await page.locator('#headerbars iframe').screenshot({path:path.join(directory,'vinyl-glow-desktop.png')});
    const preview=path.join(os.tmpdir(),'MischWerk-Pruefbilder');fs.mkdirSync(preview,{recursive:true});
    await radio.locator('#studio-tab').screenshot({path:path.join(preview,'moderation-button.png')});
    await page.locator('#width').fill('390'); await page.locator('#width').dispatchEvent('change');
    await radio.waitForFunction(()=>innerWidth===390); await page.locator('#headerbars iframe').screenshot({path:path.join(directory,'vinyl-glow-mobil.png')});
  }
  assert.deepEqual(lab.errors,[]); assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])test('Otterchen hat in '+client+' automatisch Vollzugriff; andere Moderatoren brauchen einen Eintrag',async t=>{
  const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1280,false);
  assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true,'Otterchen als Inhaber erhält automatisch Zugriff');
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  const dj=await lab.join('DJ-Test',client,390),manager=await lab.join('AppManager',client,390);
  assert.equal(await dj.radio.locator('#studio-tab').isVisible(),false);assert.equal(await manager.radio.locator('#studio-tab').isVisible(),false);
  await owner.page.locator('#chat-input').fill('/MW Verwaltung');await owner.page.locator('#chat-form button').click();const team=await overlayView(owner.page,'team');
  async function add(nick){await team.locator('#radio-moderator-nick').fill(nick);await team.locator('#radio-moderator-form button[type=submit]:not([disabled])').click();await team.locator('.team-member').filter({hasText:nick}).waitFor();}
  async function remove(nick){await team.locator('.team-member').filter({hasText:nick}).locator(':scope > button').click();await team.locator('[data-confirm-removal]:not([disabled])').click();await team.locator('.team-member').filter({hasText:nick}).waitFor({state:'detached'});}
  await add('DJ-Test');await dj.radio.locator('#studio-tab:not([hidden])').waitFor();assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true);assert.equal(await manager.radio.locator('#studio-tab').isVisible(),false);
  await remove('DJ-Test');await dj.radio.locator('#studio-tab').waitFor({state:'hidden'});
  await add('Otterchen');await owner.radio.locator('#studio-tab:not([hidden])').waitFor();
  await remove('Otterchen');assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true);assert.equal(await team.locator('#radio-moderator-form').isVisible(),true,'Verwaltung bleibt für den Inhaber erreichbar');
  await add('DJ-Test');await dj.radio.locator('#studio-tab:not([hidden])').waitFor();
  await dj.radio.locator('#studio-tab').click();const source=await overlayView(dj.page,'studio');await source.locator('#on-air').click();
  await source.locator('#off-air:not([disabled])').waitFor();await revealStudio(source,'#handover-open');await source.locator('#handover-open').click();
  await revealStudio(source,'#handover-target','handover');await source.locator('#handover-target').selectOption('Otterchen');
  await revealStudio(source,'#handover-request','handover');await source.locator('#handover-request').click();
  await owner.radio.locator('#studio-tab').click();const target=await overlayView(owner.page,'studio');await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();
  await revealStudio(target,'#handover-accept','handover');await target.locator('#handover-accept').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
  await revealStudio(target,'#off-air');assert.equal(await target.locator('#on-air').isVisible(),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

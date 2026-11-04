const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
const {reveal:revealStudio}=require('../support/studio-browser.cjs');
let browser;

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored','clamped'])test('Kompakte Moderation in '+client+' bei '+sizing+' behält Text, Fokus und stabile Größen',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:sizing==='clamped'?'normal':sizing}),{page,radio}=await lab.join('Otterchen',client,sizing==='clamped'?320:2290);
  if(sizing==='clamped')await page.setViewportSize({width:1800,height:550});
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__compactAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab').click();const frame=await overlayView(page,'studio');await frame.waitForTimeout(700);
  const compact=await frame.evaluate(()=>innerHeight);
  if(sizing==='ignored')assert.equal(compact,730);
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
  assert.ok(await frame.evaluate(()=>innerHeight>0&&innerHeight<=730),'Historie bleibt vollständig innerhalb der anfänglich verfügbaren Höhe');
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
  await radio.locator('#open-schedule:not([disabled])').click();const plan=await overlayView(page,'schedule');
  await plan.locator('#schedule-new').click();await plan.locator('#schedule-topic').fill('Mein ungespeicherter Sendeplanentwurf');
  await plan.evaluate(()=>{window.__historyDocument=document;});
  assert.equal(await plan.locator('#schedule-panel [role=tab]').count(),0,'Der öffentliche Sendeplan enthält keine Historienreiter');
  await radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(page,'studio');
  assert.equal(await studio.evaluate(()=>document===window.__historyDocument),false);
  await studio.locator('#studio-topic').fill('Mein Studioentwurf');await studio.locator('#studio-topic').dispatchEvent('input');
  await studio.locator('#studio-history-tab').click();await studio.locator('#history-list li span').filter({hasText:'Emulator · Lokaler Testtitel'}).waitFor();
  await radio.locator('#open-schedule:not([disabled])').click();const calendar=await overlayView(page,'schedule');
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
  await owner.radio.locator('#team-tab').click();const team=await overlayView(owner.page,'team');
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
  const listener=await lab.join('Testhoerer',client);await listener.radio.locator('#open-schedule:not([disabled])').click();
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
    await radio.locator('#team-tab:not([disabled])').waitFor();
    lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:overlay.prepare';
    await radio.locator('#team-tab').click();
    await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='droppedServer'&&e.eventType==='mw:overlay.prepare'));
    release();const team=await overlayView(page,'team');
    await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Entwurf');
    assert.equal(await page.locator('#overlays iframe').count(),1);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:overlay.prepare').length,2);
    await radio.locator('#open-schedule:not([disabled])').click();await overlayView(page,'schedule');
    await radio.locator('#team-tab:not([disabled])').click();const back=await overlayView(page,'team');
    assert.equal(await back.locator('#radio-moderator-nick').inputValue(),'Unfertiger Entwurf');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  }finally{if(release)release();}
});

for(const client of ['k3','stapp'])test('SDK-Ladeübergabe zeigt in '+client+' bereits fertig gestaltete Radioleiste und alle vier Ansichten',async t=>{
  const lab=await setup(t,{resourceDelayMs:30}),{page,radio}=await lab.join('Otterchen',client);
  await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='nativeReady'));
  assert.equal(lab.hub.trace.find(e=>e.kind==='nativeReady').visibleAtHandoff,true,'Radio vor dem SDK-DOMContentLoaded-Listener fertig');
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-schedule','schedule'],['open-wishes','wishes']]){
    const from=lab.hub.trace.length;await radio.locator('#'+button+':not([disabled])').click();
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
    await radio.locator('#'+button+':not([disabled])').click();
    await page.locator('#overlays iframe').waitFor();
    const loading=page.locator('#overlays .app-loading');assert.equal(await loading.count(),1);
    const opened=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.pageData.view,kind);assert.equal(opened.loading.enabled,true);
    assert.equal(opened.loading.background,'#0A0A0A');
    assert.equal(opened.loading.foreground,'#0A0A0A');
    assert.equal(opened.loading.text,'');
    assert.equal(await loading.textContent(),'');
    for(let picture=0;picture<3;picture++) await assertDarkPicture(page,loading,true);
    if(kind==='studio'){
      // Der Bildprüfer muss weiße Flächen und sichtbaren Ladetext wirklich ablehnen.
      await loading.evaluate(n=>{n.textContent='Lädt...';n.style.backgroundColor='#ffffff';n.style.color='#000000';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Keine weiße Zwischenfläche/);
      await loading.evaluate(n=>{n.style.backgroundColor='#0a0a0a';n.style.color='#f6f0df';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Native Zwischenfläche/);
      await loading.evaluate(n=>{n.textContent='';n.style.color='#0a0a0a';});
      await assertDarkPicture(page,loading,true);
    }
    await loading.evaluate(n=>{n.style.visibility='hidden';});
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
    await loading.evaluate(n=>{n.style.visibility='visible';});
    await page.waitForFunction(()=>!!document.querySelector('#overlays iframe[src]'));
    await assertEventually(()=>typeof release==='function');const resume=release;release=null;resume();
    const frame=await overlayView(page,kind);await loading.waitFor({state:'detached'});
    const colors=await frame.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor]);
    assert.deepEqual(colors,['rgb(10, 10, 10)',kind==='studio'?'rgb(20, 20, 20)':'rgb(10, 10, 10)']);
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
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
    assert.equal(opening.loading.enabled,false);assert.equal(opening.loading.background,'#0A0A0A');
    assert.equal(await page.locator('#overlays .app-loading').count(),0);
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
  }finally{if(release)release();}
});
async function assertDarkPicture(page,element,uniform=false) {
  const png=await element.screenshot();
  const pixels=await page.evaluate(async data=>{
    const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+data)).blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
    const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
    let white=0,dark=0,innerNonDark=0;
    for(let i=0;i<rgba.length;i+=4){
      const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width),isDark=rgba[i]===10&&rgba[i+1]===10&&rgba[i+2]===10;
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
  for(const [button,kind,title] of [['open-wishes','wishes','Wunschbox'],['studio-tab','studio','Moderation'],['team-tab','team','Verwaltung'],['open-schedule','schedule','Sendeplan']]){
   await network.send('Network.clearBrowserCache');
   await radio.locator('#'+button+':not([disabled])').click();await assertEventually(()=>typeof release==='function');
   const frame=await (await page.waitForSelector('#overlays iframe')).contentFrame();
   await frame.locator('.dialog-header').waitFor({timeout:2000});
   assert.equal(await frame.locator('#dialog-title').textContent(),title);
   assert.equal(await frame.evaluate(()=>document.documentElement.classList.contains('mw-ready')),false);
   assert.equal(await frame.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
   // Eigene HTML-Ebene separat prüfen; im normalen Ablauf deckt der native Loader sie noch ab.
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='hidden';});
   await assertDarkPicture(page,page.locator('#overlays .app-window'));
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='visible';});
   const resume=release;release=null;resume();await overlayView(page,kind);
   await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
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
  await owner.radio.locator('#team-tab').click();const team=await overlayView(owner.page,'team');
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
  await radio.locator('#team-tab:not([disabled])').click();
  await page.waitForFunction(n=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedClient').length>n,at);
  assert.equal(await studio.locator('.dialog-content').evaluate(n=>n.inert),true);
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Diesen Entwurf behalten');
  await studio.locator('#close-overlay').click();
  await studio.waitForFunction(()=>!document.querySelector('.dialog-content').inert);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  await radio.locator('#team-tab:not([disabled])').click();const team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Bleibt auch ohne Fähigkeit');
  await page.locator('#no-overlay').check();
  await page.waitForFunction(()=>EmulatorLab.state.users.find(u=>u.nick==='Otterchen').capabilities.Overlay===false);
  await radio.locator('#studio-tab:not([disabled])').click();
  await radio.locator('#notice').filter({hasText:/unterstützt.*nicht/}).waitFor();
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Bleibt auch ohne Fähigkeit');
  assert.equal(await page.locator('#popups iframe').count(),0);
  await team.locator('#radio-moderator-nick').focus();await page.keyboard.press('Escape');
  await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#team-tab').evaluate(n=>document.activeElement===n),true);
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
  await radio.locator('#team-tab:not([disabled])').click();let team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Nick');
  await radio.locator('#open-schedule:not([disabled])').click();let schedule=await overlayView(page,'schedule');
  await schedule.locator('#schedule-new:not([disabled])').click();
  await schedule.locator('#schedule-topic').fill('Mein Planentwurf');
  const date=await schedule.locator('#schedule-date').inputValue();
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
  assert.equal(await studio.locator('#reset-topic').isVisible(),true);
  await radio.locator('#team-tab:not([disabled])').click();team=await overlayView(page,'team');
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Unfertiger Nick');
  await radio.locator('#open-schedule:not([disabled])').click();schedule=await overlayView(page,'schedule');
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
 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__moderatorNameAudio=document.getElementById('radio-audio');window.__moderatorAudioEvents=[];for(const type of ['playing','pause','emptied','error','ended'])window.__moderatorNameAudio.addEventListener(type,()=>window.__moderatorAudioEvents.push(type));});
 await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
 await studio.locator('#on-air:not([disabled])').click();await studio.locator('#studio-host').filter({hasText:'Otterchen ist am Mikrofon'}).waitFor();
 await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
 assert.equal(await radio.locator('#on-air-sign').textContent(),'Es moderiert');
 assert.equal(await radio.locator('#host-name').textContent(),'Otterchen');assert.equal(await radio.locator('#host-name').getAttribute('data-prefix'),'');
 assert.equal(await radio.locator('.presenter').getAttribute('data-mode'),'moderation');
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
  assert.ok((await radio.locator('#on-air-sign').getAttribute('title')).startsWith('Radio Mischwerk bestätigt eine Live-Sendung.'));
  if(width===1920){const sign=await radio.locator('#on-air-sign').boundingBox(),name=await radio.locator('#host-name').boundingBox();assert.ok(Math.abs(sign.y-name.y)<1&&name.x>=sign.x+sign.width);}
  const audioState=await radio.evaluate(()=>{const audio=window.__moderatorNameAudio;return {same:document.getElementById('radio-audio')===audio,paused:audio.paused,ended:audio.ended,error:audio.error?.code||null,source:audio.getAttribute('src'),events:window.__moderatorAudioEvents};});
  assert.equal(audioState.same&&!audioState.paused,true,JSON.stringify({width,...audioState}));
  assert.equal(await radio.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await radio.locator('#studio-tab:not([disabled])').click();const back=await overlayView(page,'studio');
 await back.locator('#off-air:not([disabled])').click();await back.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
 await radio.locator('#host-name').waitFor({state:'hidden'});assert.equal(await radio.locator('#on-air-sign').textContent(),'MischWerk spielt live','Kein falscher AutoDJ aus einer App-Abmeldung');
 live=false;await radio.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await radio.locator('#on-air-sign').filter({hasText:'MischWerk am Pult'}).waitFor();assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
test.after(async () => { await browser?.close(); });
async function setup(t, faults = {}, clock = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Browser-'));
  const instance = await createEmulator({ port: 0, dataDir: directory, appDir:process.env.MISCHWERK_TEST_UPLOAD });
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
    const page = await context.newPage();
    if(clock) await page.clock.install();
    await page.goto(instance.origin + '/?nick=' + encodeURIComponent(nick));
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
    assert.ok((await radio.locator('#own-wish-position').getAttribute('title')).includes(song));
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
  test('Hörerplan zeigt in '+client+' beide Moderationen, vollständige Sendungen und erhält bewusst gewählte Seiten',async t=>{
    const lab=await setup(t),owner=await lab.join('Otterchen',client);
    await owner.radio.locator('#team-tab').click();const team=await overlayView(owner.page,'team');
    await team.locator('#radio-moderator-nick').fill('Polaroid');
    await team.locator('#radio-moderator-form button[type=submit]').click();
    await team.locator('#radio-moderator-list').filter({hasText:'Polaroid'}).waitFor();
    await owner.radio.locator('#open-schedule:not([disabled])').click();const editor=await overlayView(owner.page,'schedule');
    await editor.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===7);
    const days=await editor.locator('.schedule-day').evaluateAll(nodes=>nodes.map(node=>node.dataset.scheduleDate));
    const shows=[{date:days[2],nick:'Otterchen',start:'19:00',end:'21:00',topic:'Lokaler Test: Feierabend'},
      {date:days[4],nick:'Polaroid',start:'20:00',end:'22:00',topic:'Lokaler Test: Freitag'}];
    for(const show of shows){
      await editor.locator('#schedule-new:not([disabled])').click();
      for(const [key,value] of Object.entries(show))await editor.locator('#schedule-'+key).fill(value);
      await editor.locator('#schedule-save').click();await editor.locator('#schedule-form').waitFor({state:'hidden'});
      await editor.locator('.schedule-topic').filter({hasText:show.topic}).waitFor({state:'attached'});
    }
    const listener=await lab.join('Polaroid',client);await listener.radio.locator('#open-schedule:not([disabled])').click();
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
      for(const date of await frame.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate)))dates.add(date);
      if(!await frame.locator('#schedule-pagination').isVisible()||await frame.locator('#schedule-page-next').isDisabled())break;
      assert.ok(guard++<30);await frame.locator('#schedule-page-next').click();
    }
    assert.deepEqual([...dates].sort(),days.slice().sort(),'Alle sieben Tage bleiben mit größerer Schrift erreichbar');
    assert.equal(await frame.locator('#schedule-new').isVisible(),false);
    assert.equal(await frame.locator('.schedule-edit:visible').count(),0);
    assert.match(await frame.locator('.schedule-hosts').innerText(),/Otterchen[\s\S]*Polaroid/);
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true);
    for(const show of shows){const row=await revealShow(show.topic);
      assert.match(await row.locator('.schedule-time').textContent(),new RegExp(show.start+' – '+show.end));
      assert.equal(await row.locator('.schedule-presenter').textContent(),'Mit '+show.nick);
      const time=await row.locator('.schedule-time').boundingBox(),nick=await row.locator('.schedule-presenter').boundingBox();
      assert.ok(time.x<nick.x,'Uhrzeit und Moderation stehen nebeneinander');
    }
    await revealShow(shows[0].topic);
    await listener.page.locator('#width').fill('320');await listener.page.locator('#width').dispatchEvent('change');
    await frame.waitForFunction(()=>innerWidth===320&&document.querySelector('.schedule-page:not([hidden]) .schedule-show'));
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.match(await frame.locator('.schedule-show:visible').first().textContent(),/Otterchen/);
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
      for(const text of await frame.locator('.schedule-topic:visible').allTextContents())seen.add(text);
      if(await frame.locator('#schedule-page-next').isDisabled())break;
      await frame.locator('#schedule-page-next').click();
    }
    assert.deepEqual([...seen].sort(),shows.map(show=>show.topic).sort());
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Sendeplan öffnet in '+client+' sofort mit 820 × 630 ohne spätere Größenanforderung',async t=>{
    const lab=await setup(t,{hostSizing:'stepped',resourceDelayMs:20,serverDelayMs:150}),{page,radio}=await lab.join('Otterchen',client);
    await radio.waitForFunction(client=>client==='k3'||!document.documentElement.classList.contains('radio-constrained'),client);
    await radio.waitForFunction(()=>innerHeight>=document.getElementById('radio-panel').getBoundingClientRect().height-1);
    const radioHeight=await radio.evaluate(()=>innerHeight);
    const at=lab.hub.trace.length;
    await radio.locator('#open-schedule:not([disabled])').click();
    const handle=await page.waitForSelector('#overlays iframe[src]');
    assert.equal(Math.round((await handle.boundingBox()).height),630,'Nativer Rahmen steht bereits vor dem fertigen Appinhalt');
    const frame=await handle.contentFrame();
    await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    await frame.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===7);
    await frame.waitForTimeout(800);
    const opened=lab.hub.trace.slice(at).find(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.width,820);assert.equal(opened.height,630);
    const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===opened.sessionId&&e.method==='setSize');
    assert.deepEqual(sizes(),[]);
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[820,630]);
    assert.equal(await frame.locator('.schedule-day:visible').count(),7,'Leere Woche passt einschließlich aller sieben Tage');
    assert.equal(await frame.locator('#schedule-pagination').isVisible(),false);
    await frame.locator('#schedule-new').click();await frame.locator('#schedule-topic').fill('Mein Entwurf');
    await frame.waitForTimeout(150);
    assert.deepEqual(sizes(),[]);assert.equal(await frame.locator('#schedule-topic').inputValue(),'Mein Entwurf');
    await frame.locator('#schedule-save').click();
    await frame.locator('#schedule-form').waitFor({state:'hidden'});
    await frame.locator('.schedule-topic').filter({hasText:'Mein Entwurf'}).waitFor();
    await frame.locator('#schedule-next').click();
    await frame.waitForFunction(()=>!document.getElementById('schedule-next').disabled);
    assert.deepEqual(sizes(),[]);
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[820,630]);
    const selectedWeek=await frame.locator('#schedule-range').textContent();
    await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
    await radio.locator('#open-schedule:not([disabled])').click();
    const reopened=await view(page,'Overlay');
    await reopened.locator('#schedule-range').filter({hasText:selectedWeek}).waitFor();
    await reopened.locator('#schedule-current:not([disabled])').click();
    await reopened.locator('.schedule-topic').filter({hasText:'Mein Entwurf'}).waitFor({state:'attached'});
    const shown=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(shown.height,630);
    assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===shown.sessionId&&e.method==='setSize'),[],'Auch der befüllte Plan öffnet ohne Größenkorrektur');
    assert.equal(await radio.evaluate(()=>innerHeight),radioHeight);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
    await reopened.waitForFunction(()=>innerWidth===320);
    await reopened.waitForTimeout(150);
    const dates=new Set();
    while(await reopened.locator('#schedule-pagination').isVisible() && !(await reopened.locator('#schedule-page-previous').isDisabled())) {
      await reopened.locator('#schedule-page-previous').click();
    }
    while(true){
      for(const date of await reopened.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate)))dates.add(date);
      if(!(await reopened.locator('#schedule-pagination').isVisible())||await reopened.locator('#schedule-page-next').isDisabled())break;
      await reopened.locator('#schedule-page-next').click();
    }
    assert.equal(dates.size,7,'Native Breitenbegrenzung erhält alle Wochentage');
    assert.equal(await reopened.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {
  test('Aktualisieren in beiden echten Appfenstern: '+client+' bestätigt Antwort, Fehler und Wiederholung',async t=>{
    const lab=await setup(t,{},true),{page,radio}=await lab.join('Otterchen',client);
    for(const kind of ['studio','team']) {
      await radio.locator(kind==='studio'?'#studio-tab':'#team-tab').click();
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
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
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
  assert.equal(await radio.evaluate(() => innerHeight), 160);
  await page.locator('#width').fill('2290'); await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(() => innerWidth === 2290);
  assert.equal(await radio.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#inspect').click();
  assert.deepEqual(lab.errors, []);
});
test('Team-Popup öffnet die Verwaltung direkt und bleibt bei schrittweisen Hostantworten stabil', async t => {
  const lab = await setup(t, { hostSizing: 'stepped' }), { page, radio } = await lab.join('Otterchen', 'stapp');
  await radio.locator('#team-tab').click(); const team = await view(page, 'Overlay');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].some(entry => entry.mode === 'Overlay' && entry.height === 630));
  assert.deepEqual(await team.evaluate(()=>[innerWidth,innerHeight]),[560,630]);
  const initialHeight = await team.evaluate(() => innerHeight);
  assert.equal(await team.locator('#team-status,#team-status-tab,#team-members-tab').count(),0);
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
      await radio.locator('#play-button:disabled').waitFor();
      await radio.locator('#play-button').filter({ hasText: '' }).waitFor();
      assert.match(await radio.locator('#play-button').getAttribute('title'), /pause|gestoppt/i);
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
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  const { page, radio } = await lab.join('AppManager');
  assert.equal(await radio.locator('#studio-tab').isVisible(), false);
  assert.equal(await radio.locator('#team-tab').isVisible(), false);
  await page.locator('#role').selectOption('owner'); await page.locator('#apply-role').click();
  await radio.locator('#team-tab:not([hidden])').waitFor();
  assert.deepEqual(lab.errors, []);
});

test('Moderationserweiterung im strengen Emulator: private Wunschregie, Themenentwurf und Übergabenotizen zwischen drei Nutzern',async t=>{
  const lab=await setup(t,{hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp');
  await owner.page.setViewportSize({width:1800,height:1400});
  lab.hub.runtime.command('Otterchen','vorhang','öffnen');
  await owner.radio.locator('#team-tab').click();let team=await view(owner.page,'Overlay');
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
  await studio.locator('#on-air').click();await studio.locator('#on-air').filter({hasText:'Anmeldung verlängern'}).waitFor();
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
  await target.locator('#handover-open').click();await target.locator('#handover-note-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#handover-topic').fill('Nächste Sendung');await target.locator('#handover-accept').click();
  await target.locator('#studio-received-notes:not([hidden])').waitFor({state:'attached'});
  await revealStudio(target,'#studio-notes-text');await target.locator('#studio-notes-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#studio-queue-tab').waitFor();
  await target.locator('#studio-queue-tab').click();
  await target.locator('[data-outcome=done]').click();await listener.radio.locator('#own-wish-position').waitFor({state:'hidden'});
  assert.equal(runtime.errors.length,0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
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
 const lab=await setup(t,{provider:'online',resourceDelayMs:10}),{page,radio}=await lab.join('Otterchen',client,2290);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);const entries=[['studio-tab','studio',780,730],['team-tab','team',560,630],['open-schedule','schedule',820,630],['open-wishes','wishes',560,340]];
 for(const [from,kind] of entries){const previous=await page.locator('#overlays iframe').count()?await page.locator('#overlays iframe').getAttribute('src'):null;await radio.locator('#'+from+':not([disabled])').click();await page.waitForFunction(previous=>{const n=document.querySelector('#overlays iframe');return n&&n.getAttribute('src')!==previous;},previous);await overlayView(page,kind);for(const [button,target,width,height] of entries){const old=await page.locator('#overlays iframe').getAttribute('src');await radio.locator('#'+button+':not([disabled])').click();await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,old);const frame=await overlayView(page,target);const actual=await frame.evaluate(()=>[innerWidth,innerHeight]);assert.equal(actual[0],width);if(target==='studio')assert.ok(actual[1]>0&&actual[1]<=height);else assert.equal(actual[1],height);assertAllowedOverlaySizes(lab);assert.equal(await frame.locator('#'+target+'-panel').isVisible(),true);}}
 assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:view'),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Rechteverlust löscht gespeicherte native Verwaltungsentwürfe vor erneuter Öffnung',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',2290);await radio.locator('#studio-tab:not([disabled])').click();let frame=await overlayView(page,'studio');await frame.locator('#studio-topic').fill('Privater Studioentwurf');await radio.locator('#team-tab:not([disabled])').click();frame=await overlayView(page,'team');await frame.locator('#radio-moderator-nick').fill('Privater Teamnick');await radio.locator('#open-schedule:not([disabled])').click();frame=await overlayView(page,'schedule');await frame.locator('#schedule-new').click();await frame.locator('#schedule-topic').fill('Privater Planentwurf');await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');const runtime=lab.hub.runtime,record=runtime.users.find('Otterchen');record.state.role='listener';let id=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Overlay');runtime.event('Otterchen',id,'mw:refresh',{});await radio.locator('#team-tab').waitFor({state:'hidden'});record.state.role='owner';runtime.event('Otterchen',id,'mw:refresh',{});await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));await radio.locator('#open-schedule:not([disabled])').click();frame=await overlayView(page,'schedule');assert.equal(await frame.locator('#schedule-form').isHidden(),true);await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');assert.equal(await frame.locator('#studio-topic').inputValue(),'');assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
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
    await radio.locator('#'+entry+':not([disabled])').click();const frame=await overlayView(page,kind);
    if(kind==='team')await frame.locator('#radio-moderator-nick').fill('DJ-Test');
    if(kind==='wishes')await frame.locator('#wish-text:not([disabled])').fill('a-ha – Take On Me');
    if(kind==='studio'||kind==='team')assert.equal(await frame.locator('#studio-connection').isVisible(),false);
    const button=frame.locator('#'+control+':not([disabled])');await button.scrollIntoViewIfNeeded();
    await page.mouse.move(0,0);
    const resting=await button.evaluate(n=>{const s=getComputedStyle(n);return{background:s.backgroundColor,image:s.backgroundImage,shadow:s.boxShadow,textShadow:s.textShadow,transform:s.transform};});
    assert.equal(resting.background,kind==='schedule'?'rgb(31, 31, 31)':'rgb(233, 234, 236)');assert.equal(resting.image,'none');
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
  await radio.locator('#team-tab:not([disabled])').click();let frame=await overlayView(page,'team');
  await frame.locator('#radio-moderator-nick').fill('DieserNickExistiertNicht');await frame.locator('#add-radio-moderator').click();
  await inline(frame,'#notice.error','radio-moderator-form');assert.equal(await frame.locator('#notice').getAttribute('role'),'alert');
  await frame.locator('#radio-moderator-nick').fill('DJ-Test');await frame.locator('#add-radio-moderator').click();await frame.locator('.team-member').filter({hasText:'DJ-Test'}).waitFor();
  await inline(frame,'#notice:not(.error)','radio-moderator-form');
  await frame.locator('.team-member > button').click();lab.hub.faults.failPersistence=true;
  await frame.locator('[data-confirm-removal]').click();await frame.locator('.team-removal-feedback:not([hidden])').waitFor();
  assert.equal(await frame.locator('#notice.error:visible').count(),0,'Entzugsfehler wird ausschließlich am betroffenen Mitglied ausgegeben');
  lab.hub.faults.failPersistence=false;
  await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');
  await frame.locator('#on-air').click();await inline(frame,'#notice:not(.error)','studio-controls');
  await revealStudio(frame,'#studio-topic');await frame.locator('#studio-topic').fill('Unser Musikabend');await frame.locator('#save-topic').click();await frame.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();await inline(frame,'#topic-feedback','topic-form');
  await radio.locator('#open-schedule:not([disabled])').click();frame=await overlayView(page,'schedule');await frame.locator('#schedule-new').click();
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
    await frame.locator('#wishes-panel').screenshot({path:path.resolve(__dirname,'../../docs/pruefung/oberflaeche/wunschbox-nach-versand-'+(width===320?320:560)+'.png')});
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
  await listener.radio.locator('#curtain-ad').waitFor();await listener.radio.locator('#curtain-ad').click();
  await listener.radio.waitForFunction(()=>!document.getElementById('curtain-audio').paused);
  const chat=async (person,params)=>{await person.page.locator('#chat-input').fill('/vorhang '+params);await person.page.locator('#chat-form button').click();};
  await chat(listener,'öffnen');await listener.page.locator('#chat').filter({hasText:'Nur Otterchen als Channelinhaber'}).waitFor();
  assert.equal(await listener.radio.locator('#radio-curtain').isVisible(),true);
  await chat(owner,'öffnen');await owner.page.locator('#chat').filter({hasText:'Vorhang geöffnet.'}).waitFor();
  await listener.radio.locator('#radio-curtain').waitFor({state:'hidden'});
  assert.equal(await listener.radio.evaluate(()=>!document.getElementById('curtain-audio').paused),true);
  await listener.radio.locator('#play-button:not([disabled])').click();await listener.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await listener.radio.evaluate(()=>{window.__curtainAudio=document.getElementById('radio-audio');});
  await chat(owner,'schließen');await owner.page.locator('#chat').filter({hasText:'Vorhang geschlossen.'}).waitFor();
  await listener.radio.locator('#radio-curtain').waitFor();
  assert.equal(await listener.radio.evaluate(()=>document.getElementById('radio-audio')===window.__curtainAudio&&!window.__curtainAudio.paused),true);
  assert.equal(await owner.radio.locator('#radio-curtain').isVisible(),false);
  await chat(owner,'toggle');await owner.page.locator('#chat').filter({hasText:'Bitte verwende /vorhang öffnen oder /vorhang schließen.'}).waitFor();
  assert.equal(await listener.radio.locator('#radio-curtain').isVisible(),true);
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

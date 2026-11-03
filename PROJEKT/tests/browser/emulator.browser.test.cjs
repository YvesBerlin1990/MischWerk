const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
let browser;

for(const client of ['k3','stapp'])test('Moderationshistorie teilt in '+client+' die Overlay-Sitzung und erhält Studio-/Kalenderentwurf sowie Audio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__historyAudio=document.getElementById('radio-audio');});
  await radio.locator('#open-schedule:not([disabled])').click();const plan=await overlayView(page,'schedule');
  await plan.locator('#schedule-new').click();await plan.locator('#schedule-topic').fill('Mein ungespeicherter Sendeplanentwurf');
  await plan.evaluate(()=>{window.__historyDocument=document;});
  assert.equal(await plan.locator('#schedule-panel [role=tab]').count(),0,'Der öffentliche Sendeplan enthält keine Historienreiter');
  await radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(page,'studio');
  assert.equal(await studio.evaluate(()=>document===window.__historyDocument),true);
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
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Historienrechte werden in '+client+' serverseitig vergeben und beim Entzug auch im offenen Studio gelöscht',async t=>{
  const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client);
  await owner.radio.locator('#curtain-toggle:not([disabled])').click();
  await owner.radio.locator('#curtain-toggle-label').filter({hasText:'Vorhang schließen'}).waitFor();
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

for(const client of ['k3','stapp'])test('Doppelte Wunschboxzustellung öffnet und schließt in '+client+' jeweils einmal; Entwurf und Audio bleiben',async t=>{
  const lab=await setup(t,{provider:'online',resourceDelayMs:30}),{page,radio}=await lab.join('Otterchen',client);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__keptAudio=document.getElementById('radio-audio');});
  lab.hub.faults.clientEventType='mw:openWishes';lab.hub.faults.duplicateNext=true;
  await radio.locator('#open-wishes:not([disabled])').click();const wishes=await overlayView(page,'wishes');
  await wishes.locator('#wish-text:not([disabled])').fill('Dieser Entwurf bleibt bei doppelten Paketen');
  await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wishes.sync'&&e.eventData.text==='Dieser Entwurf bleibt bei doppelten Paketen'));
  await radio.waitForTimeout(400);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
  assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:overlay.prepare'),false,'Doppelte Öffnung startet keinen Schließwechsel');
  lab.hub.faults.duplicateNext=true;await radio.locator('#open-wishes:not([disabled])').click();
  await page.locator('#overlays iframe').waitFor({state:'detached'});await radio.locator('#open-wishes:not([disabled])').waitFor();
  await radio.waitForTimeout(300);assert.equal(await page.locator('#overlays iframe').count(),0);
  await radio.locator('#open-wishes').click();const reopened=await overlayView(page,'wishes');
  await reopened.locator('#wish-text:not([disabled])').waitFor();
  assert.equal(await reopened.locator('#wish-text').inputValue(),'Dieser Entwurf bleibt bei doppelten Paketen');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__keptAudio&&!window.__keptAudio.paused),true);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
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
    assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
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
    if(kind==='schedule')assert.equal(sizing,-1,'Sendeplan behält das serverseitige Anfangsmaß');
    else assert.ok(sizing>=0&&sizing<handoff,kind+' sendet sein erstes Inhaltsmaß vor der nativen Übergabe');
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Native Ladeansicht bleibt deaktiviert in '+client+' schon vor allen vier Overlaydokumenten',async t=>{
  const lab=await setup(t,{resourceDelayMs:35}),{page,radio}=await lab.join('Otterchen',client);
  let release; await page.route('**/frame/**',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-schedule','schedule'],['open-wishes','wishes']]) {
    await radio.locator('#'+button+':not([disabled])').click();
    await page.locator('#overlays iframe').waitFor();
    const loading=page.locator('#overlays .app-loading');assert.equal(await loading.count(),0);
    const opened=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.pageData.view,kind);assert.equal(opened.loading.enabled,false);
    assert.equal(opened.loading.background,'#242424');
    assert.equal(opened.loading.foreground,'#F6F0DF');
    await page.waitForFunction(()=>!!document.querySelector('#overlays iframe[src]'));
    await assertEventually(()=>typeof release==='function');const resume=release;release=null;resume();
    const frame=await overlayView(page,kind);await loading.waitFor({state:'detached'});
    const colors=await frame.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor]);
    if(kind==='wishes')assert.deepEqual(colors,['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);
    else {assert.equal(colors[0],'rgb(36, 36, 36)');assert.ok(['rgb(36, 36, 36)','rgb(43, 43, 43)'].includes(colors[1]));}
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
async function assertEventually(check) { for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.fail('Erwarteter Zustand blieb aus'); }

test('Overlaydateien werden nach der Radiofreigabe vorab geladen, ohne fremde Controller oder Datenabrufe',async t=>{
  const lab=await setup(t),owner=await lab.join('Otterchen','stapp');
  await owner.radio.waitForFunction(()=>document.querySelectorAll('link[data-mw-prefetch]').length>=10);
  const hints=await owner.radio.locator('link[data-mw-prefetch]').evaluateAll(nodes=>nodes.map(n=>({url:n.href,as:n.as})));
  assert.ok(hints.some(h=>h.url.includes('/studio/controls.js')));
  assert.ok(hints.some(h=>h.url.includes('/team/management.js')));
  assert.ok(hints.some(h=>h.url.includes('/schedule/controller.js')));
  const generation=await owner.radio.evaluate(()=>Client.getCacheInvalidationId());
  for(const hint of hints){assert.equal(new URL(hint.url).searchParams.get('v'),generation);assert.ok(['script','style'].includes(hint.as));}
  assert.equal(await owner.page.locator('#overlays iframe').count(),0);
  assert.equal(await owner.radio.locator('#studio-placeholder').evaluate(n=>n.children.length),0);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&/^mw:(schedule\.|wish\.submit)/.test(e.eventType)),false);
  const listener=await lab.join('Polaroid','k3');
  await listener.radio.waitForFunction(()=>!!document.querySelector('link[data-mw-prefetch]'));
  const own=await listener.radio.locator('link[data-mw-prefetch]').evaluateAll(nodes=>nodes.map(n=>n.href));
  assert.equal(own.some(url=>/\/(studio|team)\//.test(url)||/\/(studio|team|handover)[^/]*\.css/.test(url)),false);
  assert.ok(own.some(url=>url.includes('/schedule/controller.js')));
  await owner.radio.waitForTimeout(600);assert.equal(await owner.radio.locator('link[data-mw-prefetch]').count(),hints.length);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Vorgeladene Overlaydatei kommt beim Erstaufruf aus dem Browsercache; erneuter Beitritt und Invalidierung bleiben aktuell',async t=>{
  const lab=await setup(t);await lab.context.unroute('**/*');
  const {page,radio}=await lab.join('Otterchen','stapp');
  await radio.waitForFunction(()=>{
    const hint=[...document.querySelectorAll('link[data-mw-prefetch]')].find(n=>n.href.includes('/studio/controls.js'));
    return hint&&performance.getEntriesByName(hint.href).some(entry=>entry.responseEnd>0);
  });
  const before=await radio.locator('link[data-mw-prefetch]').evaluateAll(nodes=>nodes.map(n=>n.href));
  const cdp=await lab.context.newCDPSession(page),responses=[];
  await cdp.send('Network.enable');cdp.on('Network.responseReceived',event=>responses.push(event.response));
  await radio.locator('#studio-tab').click();await overlayView(page,'studio');
  assert.ok(responses.some(response=>response.url.includes('/studio/controls.js')&&
    (response.fromPrefetchCache||response.fromDiskCache)),'Studio-JavaScript nutzt den vorab gefüllten HTTP-Cache');
  await page.locator('#join').click();await page.locator('#headerbars iframe').waitFor({state:'detached'});
  await page.locator('#join').click();let next=await view(page,'Headerbar');
  await next.waitForFunction(()=>!!document.querySelector('link[data-mw-prefetch]'));
  assert.deepEqual(await next.locator('link[data-mw-prefetch]').evaluateAll(nodes=>nodes.map(n=>n.href)),before);
  lab.hub.runtime.context.KnuddelsServer.getAppAccess().getOwnInstance().getRootInstance().invalidateClientCache();
  await page.locator('#join').click();await page.locator('#headerbars iframe').waitFor({state:'detached'});
  await page.locator('#join').click();next=await view(page,'Headerbar');
  await next.waitForFunction(()=>!!document.querySelector('link[data-mw-prefetch]'));
  const after=await next.locator('link[data-mw-prefetch]').evaluateAll(nodes=>nodes.map(n=>n.href));
  assert.equal(after.some(url=>before.includes(url)),false,'Neue SDK-Cachekennung nach App-Invalidierung');
  assert.deepEqual(lab.errors,[]);assert.equal(lab.hub.runtime.errors.length,0);
});

async function overlayView(page,kind) {
  const handle=await page.waitForSelector('#overlays iframe');
  const frame=await handle.contentFrame();
  await frame.waitForFunction(kind=>document.documentElement.classList.contains('mw-ready')&&document.documentElement.dataset.view===kind,kind);
  return frame;
}
test('Geschlossener Vorhang erhält beim Schließen eines Verwaltungs-Overlays ein sichtbares Fokusziel',async t=>{
  const lab=await setup(t),owner=await lab.join('Otterchen','stapp');
  await owner.radio.locator('#team-tab').click();const team=await overlayView(owner.page,'team');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');
  await team.locator('#radio-moderator-form button[type=submit]').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  await owner.radio.locator('#curtain-toggle:not([disabled])').click();
  await owner.radio.locator('#curtain-toggle-label').filter({hasText:'Vorhang schließen'}).waitFor();
  const dj=await lab.join('DJ-Test','k3');
  await dj.radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(dj.page,'studio');
  await owner.radio.locator('#curtain-toggle:not([disabled])').click();
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
  assert.equal(studio,team);assert.equal(studio,schedule);
  assert.equal(await schedule.evaluate(()=>window.__keptDocument===document),true);
  assert.equal(await page.locator('#overlays iframe').getAttribute('src'),firstSource);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
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
  await wishes.locator('.wish-position-value').filter({hasText:'Platz 1'}).waitFor();
  assert.equal(await page.locator('#popups iframe').count(),0);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  assert.equal(await radio.evaluate(()=>innerHeight),header);
  assert.equal(await radio.locator('#radio-audio').evaluate(n=>n===window.__sameAudio&&!n.paused),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit').length,1);
  assert.equal(lab.hub.trace.some(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&['setResizable','setMinSize','setMaxSize'].includes(e.method)),false);
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await wishes.waitForFunction(()=>innerWidth===320);
  assert.equal(await wishes.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
test.after(async () => { await browser?.close(); });
async function setup(t, faults = {}, clock = false) {
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
  test('Wunschinformation bleibt in '+client+' oberhalb des Formulars vollständig ohne inneres Scrollen sichtbar',async t=>{
    const lab=await setup(t,{hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,320);
    await radio.locator('#open-wishes:not([disabled])').click();
    const surface=await view(page,'Overlay');
    const song='Langer Interpret und vollständiger Musikwunsch '.repeat(7).slice(0,300);
    for(const text of [song,'Mein zweiter Wunsch']) {
      if(await surface.locator('#wish-compose-open').isVisible())await surface.locator('#wish-compose-open').click();
      await surface.locator('#wish-text').fill(text);await surface.locator('#submit-wish').click();
      await surface.locator('#wish-feedback.success').waitFor();
      await surface.locator('#wish-fields:not([disabled])').waitFor({state:'attached'});
    }
    await surface.locator('#wish-positions-page').filter({hasText:'Seite 1 / 2'}).waitFor();
    await radio.waitForTimeout(600);
    const headerHeight=await radio.evaluate(()=>innerHeight);
    assert.equal(await surface.locator('.wish-position-text').textContent(),song);
    const draft='Mein Entwurf beim Blättern';
    await surface.locator('#wish-compose-open').click();
    await surface.locator('#wish-text').fill(draft);
    await surface.waitForFunction(()=>document.body.scrollHeight<=innerHeight+1);
    assert.equal(await surface.locator('.wish-position-item').count(),1);
    const geometry=await surface.evaluate(()=>{
      const p=document.getElementById('wish-positions').getBoundingClientRect(),form=document.getElementById('wish-form').getBoundingClientRect();
      return {above:p.bottom<=form.top,position:p.top>=0&&p.bottom<=innerHeight,form:form.bottom<=innerHeight,
        innerScroll:getComputedStyle(document.getElementById('wishes-panel')).overflowY,
        textFits:document.getElementById('wish-text').scrollHeight<=document.getElementById('wish-text').clientHeight+1};
    });
    assert.deepEqual(geometry,{above:true,position:true,form:true,innerScroll:'visible',textFits:true});
    await surface.locator('#next-wish-positions').click();
    await surface.locator('.wish-position-text').filter({hasText:'Mein zweiter Wunsch'}).waitFor();
    assert.equal(await surface.locator('.wish-position-value').textContent(),'Platz 2');
    assert.equal(await surface.locator('#wish-text').inputValue(),draft);
    await surface.waitForTimeout(900);
    const sizes=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize');
    await surface.waitForTimeout(600);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,sizes.length,'Ruhender Inhalt löst keine Größenkaskade aus');
    assert.equal(await radio.evaluate(()=>innerHeight),headerHeight);
    assert.equal(lab.hub.trace.filter(e=>e.eventType==='mw:wish.submit').length,2);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {
  test('Sendeplan öffnet in '+client+' sofort mit 820 × 660 ohne spätere Größenanforderung',async t=>{
    const lab=await setup(t,{hostSizing:'stepped',resourceDelayMs:20,serverDelayMs:150}),{page,radio}=await lab.join('Otterchen',client);
    const at=lab.hub.trace.length;
    await radio.locator('#open-schedule:not([disabled])').click();
    const handle=await page.waitForSelector('#overlays iframe[src]');
    assert.equal(Math.round((await handle.boundingBox()).height),660,'Nativer Rahmen steht bereits vor dem fertigen Appinhalt');
    const frame=await handle.contentFrame();
    await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    await frame.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===7);
    await frame.waitForTimeout(800);
    const opened=lab.hub.trace.slice(at).find(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.width,820);assert.equal(opened.height,660);
    const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===opened.sessionId&&e.method==='setSize');
    assert.deepEqual(sizes(),[]);
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[820,660]);
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
    assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),[820,660]);
    const selectedWeek=await frame.locator('#schedule-range').textContent();
    await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
    await radio.locator('#open-schedule:not([disabled])').click();
    const reopened=await view(page,'Overlay');
    await reopened.locator('#schedule-range').filter({hasText:selectedWeek}).waitFor();
    await reopened.locator('#schedule-current:not([disabled])').click();
    await reopened.locator('.schedule-topic').filter({hasText:'Mein Entwurf'}).waitFor({state:'attached'});
    const shown=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(shown.height,660);
    assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.sessionId===shown.sessionId&&e.method==='setSize'),[],'Auch der befüllte Plan öffnet ohne Größenkorrektur');
    assert.equal(await radio.evaluate(()=>innerHeight),160);
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
      await page.clock.runFor(500);
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
  await owner.radio.locator('#studio-tab').click(); const studio = await view(owner.page, 'Overlay');
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
test('Team-Popup hält Rahmen, Inhalt und Reiter bei schrittweisen Hostantworten gemeinsam stabil', async t => {
  const lab = await setup(t, { hostSizing: 'stepped' }), { page, radio } = await lab.join('Otterchen', 'stapp');
  await radio.locator('#team-tab').click(); const team = await view(page, 'Overlay');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].some(entry => entry.mode === 'Overlay' && entry.height !== 560));
  await team.waitForFunction(()=>Math.abs(innerHeight-Math.ceil(document.querySelector('.dialog-shell').getBoundingClientRect().height))<=1);
  const initialHeight = await team.evaluate(() => innerHeight);
  await team.locator('#team-status-tab').click();
  await team.locator('#team-status-tab[aria-pressed=true]').waitFor();
  await team.waitForTimeout(200);
  assert.equal(await team.evaluate(()=>innerHeight),initialHeight,'Reiterwechsel behält die gemeinsame Fensterhöhe');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    Math.abs(entry.element.getBoundingClientRect().height - entry.iframe.getBoundingClientRect().height) < 2));
  assert.equal(await page.evaluate(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    entry.element.getBoundingClientRect().bottom <= document.querySelector('#stage').getBoundingClientRect().bottom)), true);
  assert.equal(await team.evaluate(() => Client.getHostFrame().getAppViewMode()), 'OVERLAY');
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
  await owner.radio.locator('#curtain-toggle').click();
  await owner.radio.locator('#curtain-toggle-label').filter({ hasText: 'Vorhang schließen' }).waitFor();
  const { page, radio } = await lab.join('AppManager');
  assert.equal(await radio.locator('#studio-tab').isVisible(), false);
  assert.equal(await radio.locator('#team-tab').isVisible(), false);
  await page.locator('#role').selectOption('owner'); await page.locator('#apply-role').click();
  await radio.locator('#team-tab:not([hidden])').waitFor();
  assert.deepEqual(lab.errors, []);
});

test('Moderationserweiterung im strengen Emulator: private Wunschregie, Sendeplanthema und Übergabenotizen zwischen drei Nutzern',async t=>{
  const lab=await setup(t,{hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp');
  await owner.radio.locator('#curtain-toggle').click();
  await owner.radio.locator('#curtain-toggle-label').filter({hasText:'Vorhang schließen'}).waitFor();
  await owner.radio.locator('#team-tab').click();let team=await view(owner.page,'Overlay');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  const dj=await lab.join('DJ-Test','k3'),listener=await lab.join('Testhoerer','stapp');
  await listener.radio.locator('#open-wishes').click();const surface=await view(listener.page,'Overlay');
  await surface.locator('#wish-text').fill('Unser gemeinsamer Testwunsch');await surface.locator('#submit-wish').click();
  await surface.locator('.wish-position-value').filter({hasText:'Platz 1'}).waitFor();
  const oldPopup=await owner.page.locator('#overlays iframe').getAttribute('src');
  await owner.radio.locator('#studio-tab').click();
  const studio=await overlayView(owner.page,'studio');
  assert.equal(await owner.page.locator('#overlays iframe').getAttribute('src'),oldPopup);
  await studio.locator('#on-air').click();await studio.locator('#on-air').filter({hasText:'Anmeldung verlängern'}).waitFor();
  if(await studio.locator('#studio-queue-tab').isVisible())await studio.locator('#studio-queue-tab').click();
  await studio.locator('[data-stage=preparing]').click();await surface.locator('.wish-position-stage').filter({hasText:'In Vorbereitung'}).waitFor();
  await studio.locator('[data-stage=playing]').click();await surface.locator('.wish-position-stage').filter({hasText:'Läuft gerade'}).waitFor();
  assert.equal(await surface.locator('.wish-position-value').textContent(),'Platz 1');
  if(await studio.locator('#studio-controls-tab').isVisible())await studio.locator('#studio-controls-tab').click();
  const runtime=lab.hub.runtime;
  const radioId=[...runtime.contents.sessions.keys()].find(id=>{const s=runtime.contents.describe(id);return s.nick==='Otterchen'&&s.mode==='Headerbar';});
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(runtime.clock.now()));
  const monday=new Date(date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  runtime.event('Otterchen',radioId,'mw:schedule.save',{week:monday.toISOString().slice(0,10),date,start:'00:00',end:'23:59',nick:'Otterchen',topic:'Unser geplanter Themenabend',expectedRevision:0,requestId:'emulator-assistant'});
  await studio.locator('#studio-assistant > summary').click();
  await studio.locator('#assistant-topic-copy').filter({hasText:'Unser geplanter Themenabend'}).waitFor({timeout:5000});
  await studio.locator('#assistant-topic').click();assert.equal(await studio.locator('#studio-topic').inputValue(),'Unser geplanter Themenabend');
  await studio.locator('#save-topic').click();await studio.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();
  await studio.locator('#handover-open').click();await studio.locator('#handover-notes').fill('Bitte die Geburtstagsgrüße übernehmen.');
  await studio.locator('#handover-target').selectOption('DJ-Test');await studio.locator('#handover-request').click();
  await dj.radio.locator('#studio-tab').click();const target=await view(dj.page,'Overlay');
  await target.locator('#handover-open').click();await target.locator('#handover-note-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#handover-topic').fill('Nächste Sendung');await target.locator('#handover-accept').click();
  await target.locator('#assistant-notes-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#studio-queue-tab').waitFor();
  await target.locator('#studio-queue-tab').click();
  await target.locator('[data-outcome=done]').click();await surface.locator('#wish-positions').waitFor({state:'hidden'});
  assert.equal(runtime.errors.length,0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Gemeinsame Navigation in '+client+' übersteht verlorene Ereignisse ohne Dokumentwechsel und bindet beide Aktualisieren-Buttons',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,2290);
  await radio.locator('#studio-tab:not([disabled])').click();const frame=await overlayView(page,'studio');
  await frame.evaluate(()=>{window.__navigationDocument=document;});
  const opened=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
  const oldState=lab.hub.trace.findLast(e=>e.kind==='sessionEvent'&&e.sessionId===opened.sessionId&&e.eventType==='mw:state').eventData;
  lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:view';
  await radio.locator('#team-tab:not([disabled])').click();assert.equal(await overlayView(page,'team'),frame);
  await frame.locator('#refresh-radio-team').click();await frame.locator('#team-refresh-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  const teamFeedback=await frame.locator('#team-refresh-feedback').textContent();
  lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:state';
  await radio.locator('#studio-tab:not([disabled])').click();assert.equal(await overlayView(page,'studio'),frame);
  if(await frame.locator('#studio-queue-tab').isVisible())await frame.locator('#studio-queue-tab').click();
  await frame.locator('#refresh-queue').click();await frame.locator('#queue-refresh-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(await frame.locator('#team-refresh-feedback').textContent(),teamFeedback,'Nur der zugehörige Rückmeldeplatz wird aktualisiert');
  lab.hub.runtime.contents.sessions.get(opened.sessionId).sendEvent('mw:state',oldState);
  await page.waitForFunction(()=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedServer'&&['mw:view','mw:state'].includes(e.eventType)).length>=2);
  await frame.waitForTimeout(100);assert.equal(await frame.evaluate(()=>document.documentElement.dataset.view),'studio');
  assert.equal(await frame.evaluate(()=>window.__navigationDocument===document),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='nativeReady'&&e.sessionId===opened.sessionId).length,1);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&/^mw:schedule\./.test(e.eventType)),false,'Versteckter Sendeplan startet keine Datenabfrage');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.equal(lab.hub.runtime.errors.length,0);
});

test('Rechteverlust leert auch inaktive Formulare der gemeinsam geöffneten Oberfläche',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',2290);
  await radio.locator('#studio-tab:not([disabled])').click();const frame=await overlayView(page,'studio');
  await frame.locator('#studio-topic:not([disabled])').fill('Privater Studioentwurf');
  await radio.locator('#team-tab:not([disabled])').click();await overlayView(page,'team');
  await frame.locator('#radio-moderator-nick:not([disabled])').fill('Privater Teamnick');
  await radio.locator('#open-schedule:not([disabled])').click();await overlayView(page,'schedule');
  await frame.locator('#schedule-new:not([disabled])').click();await frame.locator('#schedule-topic').fill('Privater Planentwurf');
  await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');
  const runtime=lab.hub.runtime,record=runtime.users.find('Otterchen');record.state.role='listener';
  const id=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Overlay');
  runtime.event('Otterchen',id,'mw:refresh',{});
  await frame.waitForFunction(()=>document.getElementById('studio-topic').value===''&&document.getElementById('radio-moderator-nick').value===''&&document.getElementById('schedule-topic').value==='');
  assert.equal(await frame.locator('#schedule-form').isHidden(),true);
  record.state.role='owner';runtime.event('Otterchen',id,'mw:refresh',{});
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#open-schedule:not([disabled])').click();await overlayView(page,'schedule');
  assert.equal(await frame.locator('#schedule-form').isHidden(),true,'Entzogener Entwurf wird nach Rechtewiederkehr nicht zurückgeholt');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.equal(runtime.errors.length,0);
});

test('Wiederöffnen über Moderation erhält den Wunschentwurf und setzt die Eingabesequenz der neuen Sitzung zurück',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','k3',2290);
  await radio.locator('#open-wishes:not([disabled])').click();let surface=await overlayView(page,'wishes');
  for(const text of ['Erste Eingabe','Zweite Eingabe','Erhaltener Wunschentwurf'])await surface.locator('#wish-text:not([disabled])').fill(text);
  await surface.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();surface=await overlayView(page,'studio');
  await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Erhaltener Wunschentwurf');
  await surface.locator('#wish-text:not([disabled])').fill('Neue Eingabe nach Wiederöffnung');
  await radio.locator('#studio-tab:not([disabled])').click();assert.equal(await overlayView(page,'studio'),surface);
  await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Neue Eingabe nach Wiederöffnung');
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Langer Wunschentwurf wird nach verborgenem Größenwechsel in '+client+' beim Zurückkehren vollständig neu gemessen',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,700);
  await radio.locator('#open-wishes:not([disabled])').click();const frame=await overlayView(page,'wishes');
  const text=('Langer Wunschtext mit Interpret und Titel. ').repeat(8).slice(0,300);
  await frame.locator('#wish-text:not([disabled])').fill(text);
  await radio.locator('#studio-tab:not([disabled])').click();await overlayView(page,'studio');
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await frame.waitForFunction(()=>innerWidth===320);
  await radio.locator('#open-wishes:not([disabled])').click();assert.equal(await overlayView(page,'wishes'),frame);
  await frame.waitForFunction(()=>{const n=document.getElementById('wish-text');return n.scrollHeight<=n.clientHeight+1;});
  assert.equal(await frame.locator('#wish-text').inputValue(),text);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

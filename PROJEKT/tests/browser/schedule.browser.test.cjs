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
    env: { ...process.env, MISCHWERK_PREVIEW_PORT: '0', MISCHWERK_PREVIEW_START_MODERATION:'0' } });
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
    await page.waitForFunction(() => document.querySelectorAll('.schedule-day').length === 14);
  }
  return { base, context, owner, listener, errors };
}

test('Tageskopf, Musikzeiten und kurze Einträge bleiben geordnet; Inhaberaktionen stehen unter der Sendung',async t=>{
  const {owner,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  const date=initial.today,week=futureWeek(date);
  const entries=['01:23','16:40'].map((start,index)=>({id:101+index,week,date,start,end:'',timing:'openEnd',kind:'live',
    automatic:true,shortBroadcast:true,nick:'Testleitung',topic:'MischWerk Radio Show',
    actualStart:Date.parse(date+'T'+start+':00Z')-3600000,actualEnd:Date.parse(date+'T'+start+':15Z')-3600000,
    actualFrom:Date.parse(date+'T'+start+':00Z')/60000,actualUntil:Date.parse(date+'T'+start+':15Z')/60000}));
  await owner.route('**/api/event',route=>{
    const body=route.request().postDataJSON();if(body.type!=='mw:schedule.get')return route.continue();
    return route.fulfill({json:[{type:'mw:schedule.data',data:{...initial,entries,total:2,page:0,pages:1,requestId:body.data.requestId}}]});
  });
  await owner.locator('#schedule-refresh:not([disabled])').click();
  await owner.locator('.schedule-show').first().waitFor({state:'attached'});
  for(const width of [720,560,390,320]){
    await owner.setViewportSize({width,height:660});await owner.waitForTimeout(100);
    while(!await owner.locator('.schedule-show').first().isVisible())await owner.locator('#schedule-page-next:not([disabled])').click();
    const row=owner.locator('.schedule-show').first();
    const geometry=await row.evaluate(node=>{
      const rect=selector=>node.querySelector(selector).getBoundingClientRect().toJSON();
      const heading=node.closest('.schedule-day').querySelector('.schedule-day-label').getBoundingClientRect();
      return {copy:rect('.schedule-show-copy'),actions:rect('.schedule-owner-controls'),time:rect('.schedule-time'),
        title:rect('.schedule-topic'),headingBottom:heading.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.ok(geometry.actions.top>=geometry.copy.bottom,'Aktionen liegen unter dem zusammengehörenden Programmtext: '+JSON.stringify(geometry));
    assert.ok(geometry.headingBottom<=geometry.copy.top,'Das Datum gehört als Kopf über den Tagesverlauf');
    assert.equal(geometry.overflow,false);
    assert.equal(await owner.locator('.schedule-gap-time').count(),3);
    assert.equal(await owner.locator('.schedule-gap-copy').first().textContent(),'Musikmix von MischWerk');
    assert.doesNotMatch(await owner.locator('#schedule-days').textContent(),/01:23|16:40/);
  }
  assert.deepEqual(errors,[]);
});

test('Hörerprogramm stellt den Sendungstitel vor den Namen und beschreibt offene Enden verständlich',async t=>{
  const {owner,listener,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  const date=initial.days[1],week=futureWeek(date);
  const target=(await scheduleCall(owner,'mw:schedule.get',{week})).find(e=>e.type==='mw:schedule.data').data;
  assert.equal((await scheduleCall(owner,'mw:schedule.save',{week,expectedRevision:target.revision,date,
    start:'19:00',end:'',timing:'openEnd',nick:'Testleitung',topic:'Soul am Abend'})).find(e=>e.type==='mw:schedule.result').data.ok,true);
  await listener.locator('#schedule-refresh:not([disabled])').click();
  const row=listener.locator('.schedule-show').filter({hasText:'Soul am Abend'}).first();await row.waitFor({state:'attached'});
  const hierarchy=await row.evaluate(node=>{
    const title=node.querySelector('.schedule-topic'),name=node.querySelector('.schedule-presenter');
    return {title:parseFloat(getComputedStyle(title).fontSize),name:parseFloat(getComputedStyle(name).fontSize),
      first:!!(title.compareDocumentPosition(name)&Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  assert.ok(hierarchy.title>hierarchy.name&&hierarchy.first,'Die Sendung hat Vorrang vor dem Namen: '+JSON.stringify(hierarchy));
  assert.match(await row.locator('.schedule-time').textContent(),/19:00 Uhr · Ende offen/);
  assert.doesNotMatch(await listener.locator('#schedule-days').textContent(),/AutoDJ|Open End|Anmeldung|Abgemeldet|Verwaltung/);
  assert.equal(await listener.locator('.schedule-owner-controls').count(),0);
  assert.deepEqual(errors,[]);
});

test('Reiner Musikplan beginnt direkt mit den Tagen und kennzeichnet morgen ohne Ankündigungszeile',async t=>{
  const {listener,errors}=await setup(t);
  assert.equal(await listener.locator('#schedule-summary').textContent(),'');
  assert.equal(await listener.locator('#schedule-summary').isVisible(),false);
  assert.ok((await listener.locator('.schedule-empty').allTextContents()).every(text=>text==='Ganztags · Musikmix von MischWerk'));
  assert.equal(await listener.locator('.schedule-today').filter({hasText:'Morgen'}).count(),1);
  assert.doesNotMatch(await listener.locator('#schedule-panel').innerText(),/angekündigt|AutoDJ|Moderator|Verwaltung|Bearbeiten|Löschen|Entfernen|eintragen/);
  assert.deepEqual(errors,[]);
});

test('Hörer blättern durch alle Tage; der Zeitraum steht ausschließlich oben',async t=>{
  const {listener,errors}=await setup(t);
  assert.equal(await listener.locator('#schedule-page-range').count(),0);
  const range=await listener.locator('#schedule-range').textContent();
  for(const width of [720,560,390,320]){
    await listener.setViewportSize({width,height:600});await listener.locator('#schedule-current').click();await listener.waitForTimeout(100);
    const seen=new Set();let guard=0;
    do{
      const dates=await listener.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate));
      dates.forEach(day=>seen.add(day));
      assert.equal(await listener.locator('#schedule-range').textContent(),range);
      assert.match(await listener.locator('#schedule-pagination').innerText(),/^Zurück\s+Seite \d+ von \d+\s+Weiter$/);
      const fit=await listener.locator('#schedule-pagination').evaluate(node=>{
        const box=node.getBoundingClientRect();return {bottom:box.bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,
          hit:[...node.querySelectorAll('button')].filter(n=>!n.disabled).every(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n;})};
      });
      assert.ok(fit.bottom<=fit.height&&fit.hit&&!fit.overflow,JSON.stringify(fit));
      if(await listener.locator('#schedule-page-next').isDisabled())break;
      assert.ok(guard++<30);await listener.locator('#schedule-page-next').click();
    }while(true);
    assert.equal(seen.size,14);
  }
  assert.deepEqual(errors,[]);
});

test('Der Jahreswechsel wird nur im Kopf genannt; die Navigation bleibt bei 320 Pixeln sichtbar',async t=>{
  const {owner,listener,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  const today='2026-12-31',days=Array.from({length:14},(_,i)=>new Date(Date.parse(today+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));
  await listener.route('**/api/event',route=>{
    const body=route.request().postDataJSON();
    if(body.type!=='mw:schedule.get')return route.continue();
    return route.fulfill({json:[{type:'mw:schedule.data',data:{...initial,canManage:false,today,days,week:futureWeek(today),
      entries:[],page:0,pages:1,total:0,requestId:body.data.requestId}}]});
  });
  await listener.setViewportSize({width:320,height:600});await listener.locator('#schedule-refresh:not([disabled])').click();
  await listener.locator('.schedule-day[data-schedule-date="2026-12-31"]').waitFor({state:'attached'});await listener.waitForTimeout(100);
  assert.equal(await listener.locator('#schedule-range').textContent(),'31.12.2026 – 13.01.2027');
  assert.match(await listener.locator('#schedule-pagination').innerText(),/^Zurück\s+Seite \d+ von \d+\s+Weiter$/);
  const layout=await listener.evaluate(()=>({height:innerHeight,shell:document.querySelector('.dialog-shell').getBoundingClientRect().bottom,
    pager:document.getElementById('schedule-pagination').getBoundingClientRect().bottom,scroll:document.documentElement.scrollHeight}));
  assert.ok(layout.pager<=layout.height&&layout.scroll<=layout.height&&Math.abs(layout.shell-layout.height)<=1,JSON.stringify(layout));
  assert.deepEqual(errors,[]);
});

test('Inhaber kann normale Sendungen direkt entfernen; Abbruch erhält den Eintrag und Hörer haben keine Löschaktion',async t=>{
  const {owner,listener,errors}=await setup(t);
  await newShow(owner,'Direkt entfernbares Programm');
  await owner.setViewportSize({width:320,height:640});await owner.waitForTimeout(100);
  const row=owner.locator('.schedule-show').filter({hasText:'Direkt entfernbares Programm'});
  const remove=row.locator('.schedule-remove');assert.equal(await remove.count(),1);
  await remove.click();await row.locator('.schedule-delete-cancel').click();
  assert.equal(await remove.evaluate(node=>node===document.activeElement),true);
  assert.equal((await scheduleCall(owner,'mw:schedule.get')).find(e=>e.type==='mw:schedule.data').data.total,1);
  assert.equal(await listener.locator('.schedule-remove,.schedule-delete-confirm').count(),0);
  await remove.click();await row.locator('.schedule-delete-confirm').click();
  await owner.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===0);
  assert.equal((await scheduleCall(owner,'mw:schedule.get')).find(e=>e.type==='mw:schedule.data').data.total,0);
  assert.deepEqual(errors,[]);
});

test('Hörer sehen zuerst heute und erreichen den letzten der nächsten 14 Tage samt zukünftiger Sendung',async t=>{
  const {owner,listener,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  const date=initial.days[13],week=futureWeek(date);
  const target=(await scheduleCall(owner,'mw:schedule.get',{week})).find(e=>e.type==='mw:schedule.data').data;
  const saved=(await scheduleCall(owner,'mw:schedule.save',{week,expectedRevision:target.revision,date,
    start:'19:00',end:'21:00',nick:'Testleitung',topic:'Sendung am letzten Vorschautag'})).find(e=>e.type==='mw:schedule.result').data;
  assert.equal(saved.ok,true);
  await listener.locator('#schedule-refresh:not([disabled])').click();
  await listener.locator('.schedule-topic').filter({hasText:'Sendung am letzten Vorschautag'}).waitFor({state:'attached'});
  await listener.waitForTimeout(100);
  assert.deepEqual(await listener.locator('.schedule-day').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.scheduleDate))]),initial.days);
  assert.equal(await listener.locator('.schedule-day:visible').first().getAttribute('data-schedule-date'),initial.today);
  assert.equal(await listener.locator('#schedule-previous').isVisible(),false);
  assert.equal(await listener.locator('#schedule-next').isVisible(),false);
  assert.equal(await listener.locator('#schedule-period').textContent(),'Ab heute · nächste 14 Tage');
  let guard=0;
  while(!await listener.locator('.schedule-topic').filter({hasText:'Sendung am letzten Vorschautag'}).isVisible()){
    assert.ok(guard++<30);await listener.locator('#schedule-page-next:not([disabled])').click();
  }
  assert.equal(await listener.locator('.schedule-day:visible').last().getAttribute('data-schedule-date'),date);
  await listener.locator('#schedule-current').click();await listener.waitForTimeout(100);
  assert.equal(await listener.locator('.schedule-day:visible').first().getAttribute('data-schedule-date'),initial.today);
  await owner.locator('#schedule-refresh:not([disabled])').click();
  const edit=owner.locator('.schedule-show').filter({hasText:'Sendung am letzten Vorschautag'}).locator('.schedule-edit');
  await edit.waitFor({state:'attached'});await owner.waitForTimeout(100);
  guard=0;while(!await edit.isVisible()){assert.ok(guard++<30);await owner.locator('#schedule-page-next:not([disabled])').click();}
  await edit.click();await owner.waitForFunction(()=>!document.getElementById('schedule-save').disabled);
  await owner.locator('#schedule-topic').fill('Letzter Vorschautag bearbeitet');await owner.locator('#schedule-save').click();
  await owner.waitForFunction(()=>document.getElementById('schedule-form').hidden);
  const stored=(await scheduleCall(owner,'mw:schedule.get',{week})).find(e=>e.type==='mw:schedule.data').data;
  assert.ok(stored.entries.some(entry=>entry.date===date&&entry.topic==='Letzter Vorschautag bearbeitet'));
  assert.deepEqual(errors,[]);
});

test('Tages- und Wochenwechsel während einer Paketfolge lädt die Vorschau neu statt alte Tage zu mischen',async t=>{
  const {owner,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  let step=0;
  await owner.route('**/api/event',route=>{
    const body=route.request().postDataJSON();
    if(body.type!=='mw:schedule.get'||body.data.range!==true||step>=2)return route.continue();
    const today=step===0?'2026-11-08':'2026-11-09';
    const days=Array.from({length:14},(_,i)=>new Date(Date.parse(today+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));
    const data={...initial,week:futureWeek(today),today,days,page:step,pages:2,entries:[],requestId:body.data.requestId};
    step++;return route.fulfill({json:[{type:'mw:schedule.data',data}]});
  });
  const renewed=owner.waitForRequest(request=>{
    const body=request.url().endsWith('/api/event')&&request.postDataJSON();
    return step===2&&body?.type==='mw:schedule.get'&&body.data.range===true&&body.data.page===0;
  },{timeout:5000});
  await owner.locator('#schedule-refresh:not([disabled])').click();await renewed;
  await owner.waitForFunction(()=>document.getElementById('schedule-refresh').getAttribute('aria-busy')==='false');
  assert.equal(step,2);
  assert.deepEqual(await owner.locator('.schedule-day').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.scheduleDate))]),initial.days);
  assert.deepEqual(errors,[]);
});

test('Aktualisieren hält den gelesenen leeren Tag, wenn frühere Tage zusätzliche Sendungsseiten erhalten',async t=>{
  const {owner,listener,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  let date=await listener.locator('.schedule-day:visible').first().getAttribute('data-schedule-date');
  while(date<initial.days[5]){
    await listener.locator('#schedule-page-next:not([disabled])').click();
    date=await listener.locator('.schedule-day:visible').first().getAttribute('data-schedule-date');
  }
  const day=initial.days[1],week=futureWeek(day);
  let revision=(await scheduleCall(owner,'mw:schedule.get',{week})).find(e=>e.type==='mw:schedule.data').data.revision;
  const time=minute=>String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
  for(let i=0;i<24;i++){
    const result=(await scheduleCall(owner,'mw:schedule.save',{week,expectedRevision:revision,date:day,
      start:time(i*20),end:time((i+1)*20),nick:'Testleitung',topic:'Zusätzliche Sendung '+i})).find(e=>e.type==='mw:schedule.result').data;
    assert.equal(result.ok,true,result.message);revision+=1;
  }
  await listener.locator('#schedule-refresh:not([disabled])').click();
  await listener.locator('.schedule-topic').first().waitFor({state:'attached'});await listener.waitForTimeout(150);
  assert.ok((await listener.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate))).includes(date),
    'Der zuvor gelesene Tag bleibt nach neuer Seitenaufteilung sichtbar');
  assert.deepEqual(errors,[]);
});

test('Eine während des Ladens geschrumpfte Paketfolge wird ohne Antworttimeout erneut geladen',async t=>{
  const {owner,errors}=await setup(t);
  const initial=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  let step=0;
  await owner.route('**/api/event',route=>{
    const body=route.request().postDataJSON();
    if(body.type!=='mw:schedule.get'||!body.data.range||step>=2)return route.continue();
    const data={...initial,page:0,pages:step===0?2:1,revision:initial.revision+step,entries:[],requestId:body.data.requestId};
    step++;return route.fulfill({json:[{type:'mw:schedule.data',data}]});
  });
  const renewed=owner.waitForRequest(request=>{
    const body=request.url().endsWith('/api/event')&&request.postDataJSON();
    return step===2&&body?.type==='mw:schedule.get'&&body.data.page===0;
  },{timeout:5000});
  await owner.locator('#schedule-refresh:not([disabled])').click();await renewed;
  await owner.waitForFunction(()=>document.getElementById('schedule-refresh').getAttribute('aria-busy')==='false');
  assert.equal(step,2);assert.deepEqual(errors,[]);
});

test('Fensteröffnung: Sendeplan behält seine passende Anfangsgröße ohne nachträgliche Hostanpassung',async t=>{
  const {owner,listener,errors}=await setup(t,{nativeSizing:true});
  for(const page of [owner,listener]){
    await page.waitForTimeout(1300);
    assert.deepEqual(await page.evaluate(()=>__scheduleSizes),[],'Kein Größenbefehl nach dem nativen Öffnen');
    assert.equal(await page.evaluate(()=>innerHeight),660);
    assert.equal(await page.locator('.schedule-day').count(),14,'Auch mit Vorschauhinweis bleiben alle 14 Tage erhalten');
    await scheduleReachable(page);
    assert.doesNotMatch(await page.locator('.schedule-intro').textContent(),/Alle Zeiten|Europe\/Berlin|Zeitzone/);
    for(const width of [720,560,390,320]){
      await page.setViewportSize({width,height:660});await page.waitForTimeout(100);
      const header=await page.evaluate(()=>{
        const box=id=>document.querySelector(id).getBoundingClientRect().toJSON();
        const buttons=[...document.querySelectorAll('.schedule-controls button')].filter(node=>node.getClientRects().length);
        return {nav:box('.schedule-navigation'),toolbar:box('.schedule-toolbar'),current:box('#schedule-current'),refresh:box('#schedule-refresh'),
          buttons:buttons.map(node=>{const r=node.getBoundingClientRect();return {...r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===node};}),
          overflow:document.documentElement.scrollWidth>innerWidth};
      });
      assert.ok(header.nav.bottom<=header.toolbar.top,'Zeitraum und Aktionen stehen in getrennten Zeilen');
      assert.ok(Math.abs(header.current.top-header.refresh.top)<1,'Ansichtsaktionen bleiben zusammen');
      assert.equal(header.overflow,false);
      for(const button of header.buttons){assert.ok(button.width>=44&&button.height>=44);assert.ok(button.left>=0&&button.right<=width+1);assert.equal(button.hit,true);}
    }
    await page.setViewportSize({width:820,height:660});await page.waitForTimeout(100);
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
test('Leere 14-Tage-Vorschau erhält alle Tageszeilen über erreichbare Seiten im festen Rahmen',async t=>{
 const {owner,listener,errors}=await setup(t);
 for(const page of [owner,listener])for(const height of [630,800]){
  await page.setViewportSize({width:820,height});await page.waitForTimeout(150);
  await page.locator('#schedule-current').click();await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('.schedule-day')].filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect());
   return {heights:rows.map(r=>r.height),bottom:innerHeight-document.getElementById('schedule-pagination').getBoundingClientRect().bottom,
    overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,
    paged:!document.getElementById('schedule-pagination').hidden};
  });
  assert.ok(layout.heights.length>0&&layout.heights.length<14);assert.equal(layout.paged,true);assert.equal(layout.overflow,false);
  if(height===630)assert.ok(layout.heights.length>=5,'Im breiten Standardrahmen sind mindestens fünf kompakte Tage sichtbar');
  assert.ok(Math.max(...layout.heights)-Math.min(...layout.heights)<1,JSON.stringify(layout));
  assert.ok(layout.heights.every(h=>h>=50),JSON.stringify(layout));
  assert.ok(layout.bottom>=(height<=700?16:24)&&layout.bottom<=(height<=700?17:25),JSON.stringify(layout));
  const dates=new Set();
  do {
    for(const date of await page.locator('.schedule-day:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate)))dates.add(date);
    if(await page.locator('#schedule-page-next').isDisabled())break;
    await page.locator('#schedule-page-next').click();
  } while(dates.size<14);
  assert.equal(dates.size,14);
 }
 await owner.locator('#schedule-new').click();await owner.locator('#schedule-topic').fill('Mein Wochenentwurf');
 assert.equal(await owner.locator('body').evaluate(n=>getComputedStyle(n).display),'block','Editor erhält seine natürliche Anordnung');
 await owner.locator('#schedule-cancel').click();
 await owner.locator('#schedule-current').click();await owner.waitForTimeout(150);assert.equal(await owner.locator('.schedule-day').count(),14);
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
      reading: document.getElementById('schedule-form').hidden,
      outerTail: innerHeight - shell.bottom,
      shellFits: shell.bottom <= innerHeight + 1,
      rowsFit: rows.every(box => box.top >= 0 && box.bottom <= innerHeight + 1),
      listOverflow: getComputedStyle(document.getElementById('schedule-days')).overflowY };
  });
  assert.equal(result.horizontal, false);
  assert.equal(result.listOverflow, 'visible');
  if(result.reading&&!result.vertical)assert.ok(Math.abs(result.outerTail)<=1,'Die Kalenderfläche schließt ohne äußeren Überstand am unteren Rahmen ab: '+JSON.stringify(result));
  // Bei tatsächlich kleineren Hostgrenzen bleiben Eingaben nativ erreichbar.
  for (const control of await page.locator('#schedule-form input:visible,#schedule-form button:visible').all()) {
    await control.scrollIntoViewIfNeeded();
    assert.ok(await control.evaluate(node=>{const box=node.getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight+1;}));
  }
}

test('Sendeoptionen: AutoDJ ganztags speichern und bearbeiten; Open End begrenzt die freien Planzeiten', async t => {
  const { owner, listener, errors } = await setup(t);
  assert.equal(await owner.locator('.schedule-empty').count(), 14);
  assert.match(await owner.locator('.schedule-empty').first().innerText(), /Ganztags.*Musikmix von MischWerk/);
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
  assert.match(await row.innerText(), /18:00.*Ende offen/);
  await listener.locator('#schedule-refresh').click();
  await listener.locator('.schedule-topic').filter({hasText:'Abend ohne feste Endzeit'}).first().waitFor({state:'attached'});
  assert.equal(await listener.locator('.schedule-edit').count(), 0);
  const day = owner.locator('.schedule-day[data-schedule-date="'+date+'"]');
  assert.match(await day.locator('.schedule-autodj-gap').first().textContent(), /00:00.*18:00.*Musikmix von MischWerk/);
  assert.equal(await day.locator('.schedule-autodj-gap').count(), 1, 'Keine erfundene AutoDJ-Lücke nach offenem Ende');
  assert.deepEqual(errors, []);
});
test('Sendeplan: Anlegen, Bearbeiten und Löschen durch den Besitzer; Hörer sehen 14 Tage ab heute', async t => {
  const { owner, listener, errors } = await setup(t);
  assert.equal(await listener.locator('#schedule-new').isVisible(), false);
  assert.equal(await listener.locator('#schedule-topic').isDisabled(), true);
  assert.equal(await owner.locator('.schedule-day').count(), 14);
  assert.doesNotMatch(await owner.locator('.schedule-controls').innerText(), /Deutsche Ortszeit/);
  const range=(await scheduleCall(owner,'mw:schedule.get',{range:true})).find(e=>e.type==='mw:schedule.data').data;
  assert.equal(await owner.locator('.schedule-day').first().getAttribute('data-schedule-date'),range.today);
  assert.equal(await owner.locator('.schedule-day').last().getAttribute('data-schedule-date'),range.days[13]);
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
  const days = await owner.locator('.schedule-day').evaluateAll(nodes=>nodes.map(n=>n.dataset.scheduleDate));
  const monday = days[0];
  const sunday = days.find(day=>new Date(day+'T12:00:00Z').getUTCDay()===0);
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
test('Inhaber öffnet den Sendeplan auch bei geschlossener Wunschbox als getrenntes Channel-Overlay', async t => {
  const { base, context, owner, errors } = await setup(t);
  const radio = await context.newPage();
  await radio.goto(base + '/preview?role=moderator');
  await radio.waitForFunction(() => !document.getElementById('open-wishes').disabled);
  assert.equal(await radio.locator('#open-schedule').isEnabled(),true);
  assert.equal(await radio.locator('#schedule-button-caption').textContent(),'In Kürze');
  assert.equal(await radio.locator('#schedule-button-caption').isHidden(),true);
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
  await header.waitForFunction(()=>!document.getElementById('studio-tab').disabled&&document.getElementById('open-wishes').disabled&&!document.getElementById('open-schedule').disabled);
  await header.evaluate(()=>{window.__sameAudio=document.getElementById('radio-audio');});
  const pages=context.pages().length;
  await header.locator('#open-schedule').click();
  await channel.locator('#overlay-frame:not([hidden])').waitFor();
  const overlay=await(await channel.locator('#overlay-frame').elementHandle()).contentFrame();
  await overlay.waitForFunction(()=>document.querySelectorAll('.schedule-day').length===14);
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
    const initial = events.find(event => event.type === 'mw:schedule.data').data;
    const week = initial.week;
    function time(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
    for (let i = 0; i < 25; i++) {
      const result = await call('mw:schedule.save', { week, date: initial.today, expectedRevision: i,
        start: time(i * 20), end: time((i + 1) * 20), nick: Client.pageData.user.nick,
        topic: i ? 'Sendung ' + (i + 1) : '<img src="x" onerror="window.__bad=true">' });
      if (!result.find(event => event.type === 'mw:schedule.result').data.ok) { return false; }
    }
    return true;
  });
  assert.equal(seeded, true);
  await owner.locator('#schedule-refresh').click();
  await owner.waitForFunction(() => document.querySelectorAll('.schedule-show').length === 25);
  assert.equal(await owner.locator('.schedule-day').evaluateAll(nodes => new Set(nodes.map(node => node.dataset.scheduleDate)).size), 14);
  assert.equal(await owner.locator('#schedule-days img').count(), 0);
  assert.equal(await owner.evaluate(() => window.__bad), undefined);
  assert.ok((await owner.locator('#schedule-days').textContent()).includes('Sendung 25'));
  // Erst die fertige Pagination verwenden; der kurz sichtbare Rohplan ist noch keine Seite.
  await owner.locator('#schedule-pagination').waitFor({ state: 'visible' });
  await owner.waitForFunction(() => document.querySelectorAll('.schedule-page .schedule-show').length === 25);
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
    const events = await scheduleCall(owner, 'mw:schedule.save', { week: first.week, date: first.today,
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
  assert.equal(await owner.locator('.schedule-day').count(),14);
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
    const events = await scheduleCall(owner, 'mw:schedule.save', { week: first.week, date: first.today,
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
      await listener.locator('#schedule-refresh').click();
      while(!await listener.locator('.schedule-topic').filter({hasText:'Zukunftsprogramm 0'}).isVisible()){
        await listener.locator('#schedule-page-next:not([disabled])').click();
      }
      await listener.locator('.schedule-topic').filter({ hasText: 'Zukunftsprogramm 0' }).waitFor();
      assert.equal(await listener.locator('.schedule-edit').count(), 0);
      await owner.locator('.schedule-edit:visible').first().click();
      assert.equal(await owner.locator('#schedule-date').getAttribute('min'), futureWeek(date));
      assert.equal(await owner.locator('#schedule-date').getAttribute('max'), futureWeek(date, 6));
      await owner.locator('#schedule-cancel').click();
    }
  }
  await owner.reload();
  await owner.waitForFunction(() => new Set(Array.from(document.querySelectorAll('.schedule-day'),node=>node.dataset.scheduleDate)).size === 14);
  assert.equal(await owner.locator('.schedule-day').first().getAttribute('data-schedule-date'),initial.today);
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

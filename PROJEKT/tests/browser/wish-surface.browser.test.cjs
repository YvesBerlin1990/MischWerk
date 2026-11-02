// Channel und natives Overlay getrennt modellieren: kein zusätzlicher Headerbereich.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname,'../..');
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true,channel:'msedge'});});
test.after(async()=>{await browser?.close();});
async function setup(t,{width=1200,surfaceK3=true}={}){
  const child=spawn(process.execPath,['tools/preview/server.cjs'],{cwd:root,windowsHide:true,env:{...process.env,MISCHWERK_PREVIEW_PORT:'0'}});
  t.after(()=>child.kill());
  const base=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Preview startup timeout')),8000);
    child.on('error',reject);child.stdout.on('data',chunk=>{const m=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});
  });
  const context=await browser.newContext({viewport:{width,height:760}});t.after(()=>context.close());
  if(!surfaceK3)await context.route('**/preview-bridge.js',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
      if(MischWerkDemoData.pageData.wishSurface){
        window.__overlayHostCalls=[];Client.isK3Client=()=>false;
        Client.getHostFrame=()=>({setTitle(){},setResizable(){__overlayHostCalls.push('setResizable');},setSize(){__overlayHostCalls.push('setSize');}});
      }
    `});
  });
  const errors=[],sent=[];
  context.on('page',page=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/api/event'))sent.push(r.postDataJSON());});});
  const owner=await context.newPage();await owner.goto(base+'/preview?role=moderator');
  await owner.locator('#curtain-toggle:not([disabled])').click();
  await owner.locator('#curtain-toggle-label').filter({hasText:'Vorhang schließen'}).waitFor();
  const page=await context.newPage();await page.goto(base+'/channel.html');
  const radio=await(await page.locator('#radio-frame').elementHandle()).contentFrame();
  await radio.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  async function open(enabled=true){
    await radio.locator('#open-wishes:not([disabled])').click();
    await page.locator('#wish-frame:not([hidden])').waitFor();
    const surface=await(await page.locator('#wish-frame').elementHandle()).contentFrame();
    await surface.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    if(enabled)await surface.locator('#wish-fields:not([disabled])').waitFor();
    return surface;
  }
  return {base,context,owner,page,radio,open,errors,sent};
}
async function action(page,type,data={}){
  return page.evaluate(async({type,data})=>(await fetch('/api/event',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sessionId:MischWerkDemoData.sessionId,type,data})})).json(),{type,data});
}

test('Native Wunschbox überlagert den Channel ohne Leerbereich und erhält Entwurf, Versand und private Position',async t=>{
  const {page,radio,open,context,sent,errors}=await setup(t);
  const before=await page.locator('#channel').boundingBox(),pages=context.pages().length;
  let surface=await open();
  assert.equal((await page.locator('#channel').boundingBox()).y,before.y);
  assert.equal((await page.locator('#radio-frame').boundingBox()).height,160);
  assert.equal(await radio.locator('#wishes-panel').isVisible(),false);
  assert.equal(await surface.locator('#wishes-panel').getAttribute('role'),'dialog');
  await surface.locator('#wish-text').fill('Dieser Entwurf bleibt in der Radio-Sitzung');
  await surface.locator('#close-wishes').click();await page.locator('#wish-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  surface=await open();
  assert.equal(await surface.locator('#wish-text').inputValue(),'Dieser Entwurf bleibt in der Radio-Sitzung');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  await surface.locator('.wish-position-value').filter({hasText:'Platz 3'}).waitFor();
  assert.equal(await surface.locator('#wish-text').inputValue(),'');
  const submits=sent.filter(e=>e.type==='mw:wish.submit');
  assert.equal(submits.length,1);assert.equal(submits[0].sessionId,await radio.evaluate(()=>MischWerkDemoData.sessionId));
  assert.equal(context.pages().length,pages);
  assert.equal((await page.locator('#channel').boundingBox()).y,before.y);
  assert.deepEqual(errors,[]);
});

test('Wunsch-Overlay bleibt bei 320 und 2290 Pixeln auf seine Fläche begrenzt und erzeugt keinen neuen Headerplatz',async t=>{
  for(const width of [320,2290]){
    const {page,radio,open,errors}=await setup(t,{width});
    const surface=await open();
    const native=await page.locator('#wish-frame').boundingBox();
    assert.ok(native.width<=560&&native.x>=0&&native.x+native.width<=width);
    assert.equal(native.y,160);assert.equal((await page.locator('#channel').boundingBox()).y,160);
    assert.equal(await surface.locator('#wishes-panel').evaluate(n=>n.getBoundingClientRect().top),0);
    assert.equal(await surface.locator('#submit-wish').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight),true);
    assert.equal(await surface.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await surface.locator('#wishes-panel').evaluate(n=>n.scrollHeight>n.clientHeight+1),false,'Normales Formular passt in die Oberfläche');
    if(process.env.MISCHWERK_CAPTURE_OVERLAY)await page.screenshot({path:path.join(root,'docs/pruefung/oberflaeche/wunschbox-'+width+'.png')});
    await surface.locator('#wish-text').fill('Ein sehr langer Musikwunsch '.repeat(11).slice(0,300));
    await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
    assert.equal(await surface.locator('#submit-wish').isVisible(),true);
    await surface.locator('#close-wishes').click();await page.locator('#wish-frame').waitFor({state:'hidden'});
    assert.equal((await page.locator('#radio-frame').boundingBox()).height,160);
    assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
    assert.deepEqual(errors,[]);
  }
});

test('Schließen während bestätigtem Versand erhält die späte Quittung und erzeugt beim Wiederöffnen keinen zweiten Wunsch',async t=>{
  const {page,radio,open,sent,errors}=await setup(t);
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/event',async route=>{
    if(route.request().postDataJSON().type==='mw:wish.submit'){
      const response=await route.fetch();await gate;await route.fulfill({response});
    }else await route.continue();
  });
  let surface=await open();
  await surface.locator('#wish-text').fill('a-ha – Take On Me');await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.pending').waitFor();
  await surface.locator('#close-wishes').click();await page.locator('#wish-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#wish-text').inputValue(),'a-ha – Take On Me');
  release();await radio.waitForFunction(()=>document.getElementById('wish-text').value==='');
  surface=await open();
  await surface.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  assert.equal(sent.filter(e=>e.type==='mw:wish.submit').length,1);assert.deepEqual(errors,[]);
});

test('Overlay wartet beim sofortigen Schließen auf die Übernahme der letzten Eingabe im Radio',async t=>{
  const {page,radio,open,errors}=await setup(t);
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/event',async route=>{
    if(route.request().postDataJSON().type==='mw:wishes.edit'){await gate;}
    await route.continue();
  });
  let surface=await open();await surface.locator('#wish-text').fill('Mein letzter Buchstabe bleibt');
  await surface.locator('#close-wishes').click();
  assert.equal(await page.locator('#wish-frame').isVisible(),true,'Noch nicht übernommener Entwurf bleibt sichtbar');
  assert.match(await surface.locator('#wish-hint').textContent(),/übernommen/);
  release();await page.locator('#wish-frame').waitFor({state:'hidden'});
  surface=await open();assert.equal(await surface.locator('#wish-text').inputValue(),'Mein letzter Buchstabe bleibt');
  assert.equal(await radio.locator('#wishes-panel').isVisible(),false);assert.deepEqual(errors,[]);
});

test('Linkprüfung und Versandfehler bleiben im ursprünglichen Wunschcontroller; Wiederholung nutzt dieselbe submissionId',async t=>{
  const {page,open,sent,errors}=await setup(t);const surface=await open();
  await surface.locator('#wish-text').fill('https://example.com');await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.error').filter({hasText:'Keine Links'}).waitFor();
  assert.equal(sent.filter(e=>e.type==='mw:wish.submit').length,0);
  let fail=true;
  await page.route('**/api/event',async route=>{
    const request=route.request().postDataJSON();
    if(fail&&request.type==='mw:wish.submit'){
      fail=false;await route.fulfill({json:[{type:'mw:wish.receipt',data:{submissionId:request.data.submissionId,accepted:false,message:'Bitte erneut senden.'}}]});
    }else await route.continue();
  });
  await surface.locator('#wish-text').fill('Unsere Band – Unser Song');await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.error').filter({hasText:'erneut senden'}).waitFor();
  assert.equal(await surface.locator('#wish-text').inputValue(),'Unsere Band – Unser Song');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.success').waitFor();
  const primary=sent.filter(e=>e.type==='mw:wish.submit');assert.equal(primary.length,2);
  assert.equal(primary[0].data.submissionId,primary[1].data.submissionId);assert.deepEqual(errors,[]);
});

test('Wunschplätze rücken im echten Overlay-Roundtrip nach; Radio und Moderation bleiben getrennt',async t=>{
  const {base,context,page,open,errors}=await setup(t);const surface=await open();
  await surface.locator('#wish-text').fill('Unser Song im Channel-Overlay');await surface.locator('#submit-wish').click();
  await surface.locator('.wish-position-value').filter({hasText:'Platz 3'}).waitFor();
  const mod=await context.newPage();await mod.goto(base+'/preview?role=moderator&view=studio');
  for(const [outcome,rank] of [['done',2],['discarded',1]]){
    await mod.locator('[data-outcome='+outcome+']').click();
    await surface.locator('.wish-position-value').filter({hasText:'Platz '+rank}).waitFor();
  }
  await mod.locator('.request-text').filter({hasText:'Unser Song im Channel-Overlay'}).waitFor();
  await surface.locator('#close-wishes').click();await page.locator('#wish-frame').waitFor({state:'hidden'});
  const reopened=await open();await reopened.locator('.wish-position-value').filter({hasText:'Platz 1'}).waitFor();
  assert.deepEqual(errors,[]);
});

test('Deaktivierte Annahme und Vorhang erhalten Entwurf und geben den Tastaturfokus an die Radioleiste zurück',async t=>{
  const {page,owner,radio,open,errors}=await setup(t);let surface=await open();
  await surface.locator('#wish-text').fill('Mein gespeicherter Entwurf');
  await radio.waitForFunction(()=>document.getElementById('wish-text').value==='Mein gespeicherter Entwurf');
  await action(owner,'mw:setRequests',{enabled:false,previousEnabled:true});
  await surface.locator('#wish-fields[disabled]').waitFor();
  await surface.locator('#close-wishes').click();await page.locator('#wish-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#open-schedule').evaluate(n=>document.activeElement===n),true);
  await action(owner,'mw:setRequests',{enabled:true,previousEnabled:false});surface=await open();
  assert.equal(await surface.locator('#wish-text').inputValue(),'Mein gespeicherter Entwurf');
  await action(owner,'mw:setCurtain',{closed:true,previousClosed:false});
  await page.locator('#wish-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#curtain-ad').evaluate(n=>document.activeElement===n),true);
  assert.equal(await radio.locator('#wish-text').inputValue(),'Mein gespeicherter Entwurf');assert.deepEqual(errors,[]);
});

test('Verzögertes Overlay-CSS erhält den langen Entwurf und misst das Textfeld vor Sichtbarkeit vollständig',async t=>{
  const {page,radio,open,errors}=await setup(t,{width:320});let surface=await open();
  const draft='Langer Songtitel mit mehreren Wörtern '.repeat(8).slice(0,300);
  await surface.locator('#wish-text').fill(draft);await surface.locator('#close-wishes').click();
  await page.locator('#wish-frame').waitFor({state:'hidden'});
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/css/wishbox.css',async route=>{await gate;await route.continue();});
  const opening=open();await page.locator('#wish-frame:not([hidden])').waitFor();
  surface=await(await page.locator('#wish-frame').elementHandle()).contentFrame();
  await surface.locator('#wish-text').waitFor({state:'attached'});
  assert.equal(await surface.evaluate(()=>document.documentElement.classList.contains('mw-ready')),false);
  release();surface=await opening;
  assert.equal(await surface.locator('#wish-text').inputValue(),draft);
  assert.equal(await surface.locator('#wish-text').evaluate(n=>document.activeElement===n),true,'Erste bedienbare Ansicht fokussiert die Eingabe');
  assert.equal(await surface.locator('#wish-text').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
  await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
  assert.equal((await page.locator('#radio-frame').boundingBox()).height,160);
  assert.equal(await radio.locator('#wishes-panel').isVisible(),false);assert.deepEqual(errors,[]);
});

test('STAPP-Wunschoberfläche verwendet weder Popup-Resizable noch nachträgliche Hostgrößenaufrufe',async t=>{
  const {page,open,errors}=await setup(t,{surfaceK3:false});const surface=await open();
  await surface.locator('#wish-text').fill('Test im STAPP-Overlay');await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.success').waitFor();
  assert.deepEqual(await surface.evaluate(()=>__overlayHostCalls),[]);
  assert.equal((await page.locator('#radio-frame').boundingBox()).height,160);assert.deepEqual(errors,[]);
});

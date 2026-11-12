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
        const originalHost=Client.getHostFrame;
        Client.getHostFrame=()=>({setTitle(){},setResizable(){__overlayHostCalls.push({method:'setResizable'});},setSize(width,height){
          __overlayHostCalls.push({method:'setSize',width,height});originalHost().setSize(width,height);
        }});
      }
    `});
  });
  const errors=[],sent=[];
  context.on('page',page=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/api/event'))sent.push(r.postDataJSON());});});
  const owner=await context.newPage();await owner.goto(base+'/preview?role=moderator');

  const page=await context.newPage();await page.goto(base+'/channel.html');
  const radio=await(await page.locator('#radio-frame').elementHandle()).contentFrame();
  await radio.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  async function open(enabled=true){
    await radio.locator('#open-wishes:not([disabled])').click();
    await page.locator('#overlay-frame:not([hidden])').waitFor();
    const surface=await(await page.locator('#overlay-frame').elementHandle()).contentFrame();
    await surface.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    if(enabled)await surface.locator('#wish-fields:not([disabled])').waitFor({state:'attached'});
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
  await surface.locator('#close-wishes').click();await page.locator('#overlay-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  surface=await open();
  assert.equal(await surface.locator('#wish-text').inputValue(),'Dieser Entwurf bleibt in der Radio-Sitzung');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 3'}).waitFor();
  assert.equal(await surface.locator('#wish-positions').count(),0);
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
    const native=await page.locator('#overlay-frame').boundingBox();
    assert.ok(native.width<=560&&native.x>=0&&native.x+native.width<=width);
    const radioBox=await page.locator('#radio-frame').boundingBox();
    assert.equal(native.y,radioBox.y+radioBox.height);assert.equal((await page.locator('#channel').boundingBox()).y,native.y);
    assert.equal(await surface.locator('#wishes-panel').evaluate(n=>n.getBoundingClientRect().top),0);
    assert.equal(await surface.locator('#submit-wish').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight),true);
    assert.equal(await surface.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await surface.locator('#wishes-panel').evaluate(n=>n.scrollHeight>n.clientHeight+1),false,'Normales Formular passt in die Oberfläche');
    await surface.locator('#wish-text').fill('Ein sehr langer Musikwunsch '.repeat(11).slice(0,300));
    await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
    assert.equal(await surface.locator('#submit-wish').isVisible(),true);
    await surface.locator('#submit-wish').click();
    await radio.locator('#own-wish-rank').filter({hasText:'Platz 3'}).waitFor({state:width<1200?'attached':'visible'});
    assert.equal(await radio.locator('#own-wish-position').isVisible(),width>=1200);
  assert.equal(await surface.locator('#wish-positions').count(),0);
    await surface.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();

    assert.equal(await surface.locator('#wish-form').isVisible(),false,'Leeres Formular weicht der Aktion für einen weiteren Wunsch');
    assert.equal(await surface.locator('#wish-compose-open').isVisible(),true);
    assert.equal(await surface.locator('#wish-compose-open').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight),true);
    if(process.env.MISCHWERK_CAPTURE_OVERLAY){
      await surface.waitForTimeout(250);
      await page.screenshot({path:path.join(root,'docs/pruefung/oberflaeche/wunschbox/wunschbox-'+width+'.png')});
    }
    await surface.locator('#close-wishes').click();await page.locator('#overlay-frame').waitFor({state:'hidden'});
    assert.equal((await page.locator('#radio-frame').boundingBox()).height,radioBox.height,'Wunsch-Overlay erhält die bestehende natürliche Radiohöhe');
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
  await surface.locator('#close-wishes').click();await page.locator('#overlay-frame').waitFor({state:'hidden'});
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
  assert.equal(await page.locator('#overlay-frame').isVisible(),true,'Noch nicht übernommener Entwurf bleibt sichtbar');
  assert.match(await surface.locator('#wish-hint').textContent(),/übernommen/);
  release();await page.locator('#overlay-frame').waitFor({state:'hidden'});
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
  const {base,context,page,radio,open,errors}=await setup(t);const surface=await open();
  await surface.locator('#wish-text').fill('Unser Song im Channel-Overlay');await surface.locator('#submit-wish').click();
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 3'}).waitFor();
  assert.equal(await surface.locator('#wish-positions').count(),0);
  const mod=await context.newPage();await mod.goto(base+'/preview?role=moderator&view=studio');
  await mod.locator('#studio-queue-tab').click();
  for(const [outcome,rank] of [['done',2],['discarded',1]]){
    await mod.locator('[data-outcome='+outcome+']').click();
    await radio.locator('#own-wish-rank').filter({hasText:'Platz '+rank}).waitFor();
  }
  await mod.locator('.request-text').filter({hasText:'Unser Song im Channel-Overlay'}).waitFor();
  await surface.locator('#close-wishes').click();await page.locator('#overlay-frame').waitFor({state:'hidden'});
  const reopened=await open();await radio.locator('#own-wish-rank').filter({hasText:'Platz 1'}).waitFor();
  assert.equal(await reopened.locator('#wish-positions').count(),0);
  await reopened.locator('#wish-compose-open').focus();
  await mod.locator('[data-outcome=done]').click();
  await radio.locator('#own-wish-position').waitFor({state:'hidden'});
  await reopened.waitForFunction(()=>document.activeElement===document.getElementById('wish-text'),{},{timeout:2000});
  assert.equal(await reopened.locator('#wish-text').evaluate(n=>document.activeElement===n),true,'Nach Bearbeitung des letzten Wunsches bleibt ein sichtbares Fokusziel');
  assert.deepEqual(errors,[]);
});

test('Wunschregie überträgt Vorbereitung und laufenden Song privat an den Hörer und rückt erst beim Abschluss nach',async t=>{
  const {base,context,radio,open,errors,sent}=await setup(t);const surface=await open();
  await surface.locator('#wish-text').fill('Unser Wunsch mit sichtbarem Status');await surface.locator('#submit-wish').click();
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 3'}).waitFor();
  assert.equal(await surface.locator('#wish-positions').count(),0);
  const mod=await context.newPage();await mod.goto(base+'/preview?role=moderator&view=studio');
  await mod.locator('#studio-queue-tab').click();
  for(const rank of [2,1]){
    await mod.locator('[data-outcome=done]').click();
    await radio.locator('#own-wish-rank').filter({hasText:'Platz '+rank}).waitFor();
  }
  await surface.locator('#wish-compose-open').click();
  await surface.locator('#wish-text').fill('Mein nächster Entwurf bleibt');
  await mod.locator('[data-stage=preparing]').click();
  await radio.locator('#own-wish-stage').filter({hasText:'In Vorbereitung'}).waitFor();
  assert.equal(await radio.locator('#own-wish-rank').textContent(),'Platz 1');
  await mod.locator('[data-stage=playing]').click();
  await radio.locator('#own-wish-stage').filter({hasText:'Läuft gerade'}).waitFor();
  assert.equal(await radio.locator('#own-wish-rank').textContent(),'Platz 1');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Mein nächster Entwurf bleibt');
  assert.equal(sent.filter(e=>e.type==='mw:wish.submit').length,1);
  await mod.locator('[data-outcome=done]').click();
  await radio.locator('#own-wish-position').waitFor({state:'hidden'});
  assert.equal(await surface.locator('#wish-text').inputValue(),'Mein nächster Entwurf bleibt');
  assert.deepEqual(errors,[]);
});

test('Deaktivierte Annahme und Wiederöffnung erhalten Entwurf und geben den Tastaturfokus an die Radioleiste zurück',async t=>{
  const {page,owner,radio,open,errors}=await setup(t);let surface=await open();
  await surface.locator('#wish-text').fill('Mein gespeicherter Entwurf');
  await radio.waitForFunction(()=>document.getElementById('wish-text').value==='Mein gespeicherter Entwurf');
  await action(owner,'mw:setRequests',{enabled:false,previousEnabled:true});
  await surface.locator('#wish-fields[disabled]').waitFor();
  await surface.locator('#close-wishes').click();await page.locator('#overlay-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#mute-button').evaluate(n=>document.activeElement===n),true);
  await action(owner,'mw:setRequests',{enabled:true,previousEnabled:false});surface=await open();
  assert.equal(await surface.locator('#wish-text').inputValue(),'Mein gespeicherter Entwurf');

  await surface.locator('#close-wishes').click();
  await page.locator('#overlay-frame').waitFor({state:'hidden'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  assert.equal(await radio.locator('#wish-text').inputValue(),'Mein gespeicherter Entwurf');assert.deepEqual(errors,[]);
});

test('Verzögertes Overlay-CSS erhält den langen Entwurf und misst das Textfeld vor Sichtbarkeit vollständig',async t=>{
  const {page,radio,open,errors}=await setup(t,{width:320});let surface=await open();const radioHeight=(await page.locator('#radio-frame').boundingBox()).height;
  const draft='Langer Songtitel mit mehreren Wörtern '.repeat(8).slice(0,300);
  await surface.locator('#wish-text').fill(draft);await surface.locator('#close-wishes').click();
  await page.locator('#overlay-frame').waitFor({state:'hidden'});
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/css/wishes/wishbox.css',async route=>{await gate;await route.continue();});
  const opening=open();await page.locator('#overlay-frame:not([hidden])').waitFor();
  surface=await(await page.locator('#overlay-frame').elementHandle()).contentFrame();
  await surface.locator('#wish-text').waitFor({state:'attached'});
  assert.equal(await surface.evaluate(()=>document.documentElement.classList.contains('mw-ready')),false);
  release();surface=await opening;
  assert.equal(await surface.locator('#wish-text').inputValue(),draft);
  assert.equal(await surface.locator('#wish-text').evaluate(n=>document.activeElement===n),true,'Erste bedienbare Ansicht fokussiert die Eingabe');
  assert.equal(await surface.locator('#wish-text').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
  await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
  assert.equal((await page.locator('#radio-frame').boundingBox()).height,radioHeight,'Erneutes Öffnen erhält die natürliche Radiohöhe');
  assert.equal(await radio.locator('#wishes-panel').isVisible(),false);assert.deepEqual(errors,[]);
});

test('STAPP-Wunschoberfläche passt vom Öffnen bis zur nächsten Eingabe ihre native Höhe vollständig an',async t=>{
  const {page,open,errors}=await setup(t,{surfaceK3:false});const surface=await open();
  await surface.waitForFunction(()=>__overlayHostCalls.length>0);
  await surface.waitForFunction(()=>Math.abs(document.getElementById('wishes-panel').getBoundingClientRect().height-innerHeight)<=1);
  const initialHeight=await surface.evaluate(()=>innerHeight);
  assert.ok(initialHeight<340,'Das normale Formular braucht keine leere Höhenreserve');
  await surface.locator('#wish-text').fill('Test im STAPP-Overlay');await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.success').waitFor();
  await surface.waitForFunction(()=>document.getElementById('wishes-panel').getBoundingClientRect().height<=innerHeight&&document.body.scrollHeight<=document.body.clientHeight+1);
  const calls=await surface.evaluate(()=>__overlayHostCalls);
  assert.ok(calls.length>0);assert.ok(calls.every(c=>c.method==='setSize'&&c.width>0&&c.height>0));
  assert.equal(await surface.locator('#wish-compose-open').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight),true);
  const confirmationHeight=await surface.evaluate(()=>innerHeight);
  assert.ok(confirmationHeight<initialHeight,'Die kurze Bestätigung verkleinert das Fenster');
  await surface.locator('#wish-compose-open').click();
  await surface.locator('#wish-text').fill('Langer Interpret und ausführlicher Titel '.repeat(8).slice(0,300));
  await surface.waitForFunction(h=>innerHeight>h&&document.body.scrollHeight<=innerHeight+1,confirmationHeight);
  assert.equal(await surface.locator('#wish-text').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
  assert.equal((await page.locator('#radio-frame').boundingBox()).height,160);assert.deepEqual(errors,[]);
});

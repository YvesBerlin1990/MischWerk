// Verbindungsreiter in /mw admin: echte Verwaltungsoberfläche mit nachgebildetem Knuddels-Client, ohne Netz.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MISCHWERK_PLAYWRIGHT||'playwright');
const {createHarness}=require('../support/knuddels.cjs');
const root=path.resolve(__dirname,'../..'),base=process.env.MISCHWERK_TEST_UPLOAD?path.resolve(process.env.MISCHWERK_TEST_UPLOAD,'www'):path.join(root,'app/www');
const state={revision:0,hasSyncSecret:false,syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',enabled:false,runtimeVerified:false};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true,channel:'msedge'});});test.after(async()=>{await browser?.close();});
async function pageFor(t,options={}){
 const h=createHarness(),owner=h.user(1,'Otterchen','owner'),session=h.open(owner);
 const snapshot=h.state(owner,session);snapshot.revision=0;snapshot.view='team';
 const context=await browser.newContext({viewport:{width:options.width||560,height:640}});t.after(()=>context.close());const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());
  const file=url.hostname==='mischwerk.test'?(url.pathname==='/'?'index.html':url.pathname.slice(1)):'',absolute=path.resolve(base,file);
  if(!file||!absolute.startsWith(base+path.sep)||!fs.existsSync(absolute)){await route.fulfill({status:404,body:''});return;}
  await route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(absolute)});});
 await page.addInitScript(({snapshot,opts})=>{window.__sent=[];window.__listeners={};
  window.__emit=(type,data)=>(window.__listeners[type]||[]).forEach(fn=>fn({type,data}));
  const include=(tag,attr,file)=>{const node=document.createElement(tag);if(tag==='link')node.rel='stylesheet';node[attr]=file;(document.body||document.head).appendChild(node);};
  window.Client={pageData:snapshot,includeCSS:file=>include('link','href',file),includeJS:file=>include('script','src',file),
   addEventListener(type,fn){(window.__listeners[type]||(window.__listeners[type]=[])).push(fn);},executeSlashCommand(){},isK3Client:()=>true,
   getHostFrame:()=>({setTitle(){},setResizable(){},setSize(){}}),
   sendEvent(type,data){
    if(type==='mw:androidSettings.save'&&opts.throwSend)throw Error('private exception');
    const field=document.getElementById('relay-sync');
    window.__sent.push({type,data:JSON.parse(JSON.stringify(data||{})),fieldsEmpty:!field||field.value===''});
   }};
 },{snapshot,opts:options});
 await page.goto('http://mischwerk.test/');
 await page.locator('#team-connection-tab').click();
 await page.waitForFunction(()=>window.__sent.some(e=>e.type==='mw:androidSettings.status'));
 return page;
}
async function open(page,value=state){await page.evaluate(s=>window.__emit('mw:androidSettings.status',{ok:true,state:s}),value);}
async function secret(page){if(!await page.locator('#relay-sync').isVisible())await page.locator('.connection-secret summary').click();}
const last=page=>page.evaluate(()=>window.__sent.at(-1));
test('Formular bleibt ohne bestätigten Status gesperrt',async t=>{
 const p=await pageFor(t);await secret(p);assert.equal(await p.locator('#relay-sync').isDisabled(),true);assert.equal(await p.locator('#relay-save').isDisabled(),true);
 await open(p);await p.locator('#relay-sync').fill('s'.repeat(64));assert.equal(await p.locator('#relay-save').isEnabled(),true);
});
test('Schlüssel wird vor dem Versand aus dem Eingabefeld gelöscht und nie gespeichert oder angezeigt',async t=>{
 const p=await pageFor(t);await open(p);await secret(p);const sync='s'.repeat(64);await p.locator('#relay-sync').fill(sync);await p.locator('#relay-save').click();
 const sent=await last(p);assert.equal(sent.type,'mw:androidSettings.save');assert.equal(sent.data.syncSecret,sync);assert.equal(sent.fieldsEmpty,true);
 assert.equal(await p.locator('#relay-save').isDisabled(),true);
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'save-1',state:{...s,revision:1,hasSyncSecret:true},message:'Einstellungen gespeichert.'}),state);
 assert.match(await p.locator('#relay-result').innerText(),/Einstellungen gespeichert/);assert.equal(await p.locator('#relay-sync').inputValue(),'');
 assert.doesNotMatch(await p.locator('body').innerText(),new RegExp(sync));assert.deepEqual(await p.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
});
test('Versandfehler und Seitenende behalten keine Schlüsseleingabe',async t=>{
 const p=await pageFor(t,{throwSend:true});await open(p);await secret(p);await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();
 assert.equal(await p.locator('#relay-sync').inputValue(),'');assert.doesNotMatch(await p.locator('#relay-result').innerText(),/private exception/);
 const q=await pageFor(t);await open(q);await secret(q);await q.locator('#relay-sync').fill('s'.repeat(64));await q.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 assert.equal(await q.locator('#relay-sync').inputValue(),'');
});
test('Reiterwechsel verwirft die Schlüsseleingabe',async t=>{
 const p=await pageFor(t);await open(p);await secret(p);await p.locator('#relay-sync').fill('s'.repeat(64));
 await p.locator('#team-members-tab').click();await p.locator('#team-connection-tab').click();assert.equal(await p.locator('#relay-sync').inputValue(),'');
});
test('Antworten anderer Anfragen und fremde Zieladresse aktivieren die Eingabe nicht',async t=>{
 const p=await pageFor(t);await open(p);await secret(p);await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'foreign',state:s}),state);assert.equal(await p.locator('#relay-save').isDisabled(),true);
 const q=await pageFor(t);await open(q,{...state,syncUrl:'https://evil.invalid'});await secret(q);
 assert.equal(await q.locator('#relay-sync').isDisabled(),true);assert.match(await q.locator('#relay-result').innerText(),/Status nicht verfügbar/);
});
for(const width of [320,560])test('Verbindungsreiter bleibt bei '+width+' Pixeln lesbar und mit Tastatur bedienbar',async t=>{
 const p=await pageFor(t,{width});await open(p,{...state,hasSyncSecret:true});await secret(p);
 await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-sync').focus();await p.keyboard.press('Tab');
 assert.equal(await p.locator('#relay-save').evaluate(e=>e===document.activeElement),true);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 for(const id of ['relay-save','relay-activate','relay-deactivate','relay-refresh'])assert.ok(await p.locator('#'+id).evaluate(e=>e.getBoundingClientRect().height>=44),id);
});
test('Betriebsaktionen benötigen nur den gespeicherten Schlüssel und senden nur Revision und Anfragekennung',async t=>{
 const p=await pageFor(t);await open(p,state);assert.equal(await p.locator('#relay-activate').isDisabled(),true);
 await open(p,{...state,hasSyncSecret:true});await p.locator('#relay-activate').click();
 const sent=await last(p);assert.equal(sent.type,'mw:androidSettings.activate');assert.deepEqual(Object.keys(sent.data).sort(),['requestId','revision']);
 await p.evaluate(({s,id})=>window.__emit('mw:androidSettings.result',{ok:true,requestId:id,state:{...s,hasSyncSecret:true,enabled:true,runtimeVerified:true,revision:1,operation:{publisherActive:true,healthy:true}},message:'Verbindung aktiviert.'}),{s:state,id:sent.data.requestId});
 assert.equal(await p.locator('#relay-deactivate').isEnabled(),true);assert.match(await p.locator('#relay-status').innerText(),/Aktiv – Daten werden übertragen/);
 assert.equal(await p.locator('#relay-activate').innerText(),'Aktiv');
});
test('Verspätete Aktivierungsantwort nach Seitenende bleibt verworfen',async t=>{
 const p=await pageFor(t),ready={...state,hasSyncSecret:true};await open(p,ready);await p.locator('#relay-activate').click();
 const id=(await last(p)).data.requestId;await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 await p.evaluate(({s,id})=>window.__emit('mw:androidSettings.result',{ok:true,requestId:id,state:{...s,enabled:true,runtimeVerified:true,operation:{publisherActive:true}}}),{s:ready,id});
 assert.equal(await p.locator('#relay-activate').isDisabled(),true);assert.doesNotMatch(await p.locator('#relay-status').innerText(),/Aktiv/);
});
test('Fehlerantwort übernimmt den tatsächlichen Freigabe- und Laufstatus',async t=>{
 const p=await pageFor(t),active={...state,revision:1,hasSyncSecret:true,enabled:true,runtimeVerified:true,operation:{publisherActive:true}};await open(p,active);
 await p.locator('#relay-deactivate').click();const id=(await last(p)).data.requestId;
 await p.evaluate(({s,id})=>window.__emit('mw:androidSettings.result',{ok:false,requestId:id,state:{...s,operation:{publisherActive:false}},message:'Bitte Status neu laden.'}),{s:active,id});
 assert.match(await p.locator('#relay-status').innerText(),/Verbindung freigegeben/);assert.match(await p.locator('#relay-result').innerText(),/Bitte Status neu laden/);
 assert.equal(await p.locator('#relay-refresh').isEnabled(),true);
});
test('Verlorene Bestätigung beendet den Wartezustand ohne automatisches erneutes Speichern',async t=>{
 const p=await pageFor(t);await p.clock.install();await open(p,{...state,hasSyncSecret:true});await secret(p);
 await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();
 await p.clock.runFor(15010);assert.match(await p.locator('#relay-result').textContent(),/Keine Bestätigung/);
 assert.equal(await p.locator('#relay-refresh').isEnabled(),true);assert.equal(await p.locator('#relay-sync').inputValue(),'');
 assert.equal(await p.evaluate(()=>__sent.filter(e=>e.type==='mw:androidSettings.save').length),1);
});

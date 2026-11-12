const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MISCHWERK_PLAYWRIGHT||'playwright');let browser;
const root=path.resolve(__dirname,'../..'),base=process.env.MISCHWERK_TEST_UPLOAD?path.join(process.env.MISCHWERK_TEST_UPLOAD,'www'):path.join(root,'app/www');
const state={revision:0,hasSyncSecret:false,hasRelaySecret:false,syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',enabled:false,runtimeVerified:false};
test.before(async()=>{browser=await chromium.launch({headless:true,channel:'msedge'});});test.after(async()=>{await browser?.close();});
async function pageFor(t,options={}){
 const context=await browser.newContext({viewport:{width:options.width||560,height:640}});t.after(()=>context.close());const page=await context.newPage();
 await page.route('**/*',async route=>{const name=new URL(route.request().url()).pathname.slice(1);if(!['relay-settings.html','js/operator/relay-settings.js'].includes(name)){await route.fulfill({status:404,body:''});return;}await route.fulfill({status:200,contentType:name.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(path.join(base,name))});});
 await page.addInitScript(opts=>{window.__sent=[];window.__listeners={};window.__emit=(type,data)=>(window.__listeners[type]||[]).forEach(fn=>fn({type,data}));
  if(!opts.noClient)window.Client={addEventListener(type,fn){(window.__listeners[type]||(window.__listeners[type]=[])).push(fn);},sendEvent(type,data){
   if(type==='mw:androidSettings.save'&&opts.throwSend)throw Error('private exception');
   window.__sent.push({type,data:JSON.parse(JSON.stringify(data)),fieldsEmpty:document.getElementById('relay-sync').value===''});
  }};
 },options);
 await page.goto('https://settings.invalid/relay-settings.html');await page.waitForFunction(()=>window.__sent.length||document.getElementById('relay-result').textContent);return page;
}
async function open(page,value=state){await page.evaluate(s=>window.__emit('mw:androidSettings.status',{ok:true,state:s}),value);}
test('Formular bleibt ohne bestätigte private Sitzung gesperrt',async t=>{
 const p=await pageFor(t);assert.equal(await p.locator('#relay-sync').isDisabled(),true);assert.equal(await p.locator('#relay-save').isDisabled(),true);
 await open(p);assert.equal(await p.locator('#relay-save').isEnabled(),true);assert.equal(await p.locator('#relay-sync').inputValue(),'');assert.equal(await p.locator('#relay-url').getAttribute('readonly'),'');
});
test('Secrets werden vor dem Versand aus den Eingabefeldern gelöscht und nie gespeichert oder angezeigt',async t=>{
 const p=await pageFor(t);await open(p);const sync='s'.repeat(64),relay='r'.repeat(64);await p.locator('#relay-sync').fill(sync);await p.locator('#relay-save').click();
 const sent=await p.evaluate(()=>window.__sent.at(-1));assert.equal(sent.data.syncSecret,sync);assert.equal(sent.fieldsEmpty,true);assert.equal(await p.locator('#relay-save').isDisabled(),true);
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'save-1',state:{...s,revision:1,hasSyncSecret:true,hasRelaySecret:false},message:'Einstellungen gespeichert.'}),state);
 assert.equal(await p.locator('#relay-sync').inputValue(),'');assert.equal(await p.locator('#relay-save').isEnabled(),true);
 assert.doesNotMatch(await p.locator('body').innerText(),new RegExp(sync+'|'+relay));assert.deepEqual(await p.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
});
test('Versandfehler und Seitenende behalten keine Secret-Eingaben',async t=>{
 const p=await pageFor(t,{throwSend:true});await open(p);await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();assert.equal(await p.locator('#relay-sync').inputValue(),'');assert.doesNotMatch(await p.locator('#relay-result').innerText(),/private exception/);
 const q=await pageFor(t);await open(q);await q.locator('#relay-sync').fill('s'.repeat(64));await q.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await q.locator('#relay-sync').inputValue(),'');
});
test('Antworten anderer Anfragen und fehlerhafter Status aktivieren die Eingabe nicht',async t=>{
 const p=await pageFor(t);await open(p);await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'foreign',state:s}),state);assert.equal(await p.locator('#relay-save').isDisabled(),true);
 const q=await pageFor(t);await open(q,{...state,syncUrl:'https://evil.invalid'});assert.equal(await q.locator('#relay-save').isDisabled(),true);
});
for(const width of [320,560])test('Einrichtung bleibt bei '+width+' Pixeln lesbar und mit Tastatur bedienbar',async t=>{
 const p=await pageFor(t,{width});await open(p,{...state,hasSyncSecret:true});await p.locator('#relay-sync').focus();await p.keyboard.press('Tab');assert.equal(await p.locator('#relay-save').evaluate(e=>e===document.activeElement),true);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await p.locator('#relay-save').evaluate(e=>e.getBoundingClientRect().height>=44));
 await p.locator('#relay-close').click();assert.equal((await p.evaluate(()=>window.__sent.at(-1))).type,'mw:androidSettings.close');
});
test('Außerhalb Knuddels bleibt der Dialog ohne Client geschlossen',async t=>{const p=await pageFor(t,{noClient:true});assert.equal(await p.locator('#relay-save').isDisabled(),true);assert.match(await p.locator('#relay-result').innerText(),/im MischWerk-Channel/);});
test('Betriebsaktionen benötigen nur den gespeicherten Sync-Schlüssel und senden nur Revision/Anfragekennung',async t=>{
 const p=await pageFor(t);await open(p,state);assert.equal(await p.locator('#relay-activate').isDisabled(),true);
 await open(p,{...state,hasSyncSecret:true,hasRelaySecret:false});await p.locator('#relay-activate').click();
 const sent=await p.evaluate(()=>window.__sent.at(-1));assert.equal(sent.type,'mw:androidSettings.activate');assert.deepEqual(Object.keys(sent.data).sort(),['requestId','revision']);
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'activate-1',state:{...s,hasSyncSecret:true,hasRelaySecret:false,enabled:true,runtimeVerified:true,revision:1,operation:{publisherActive:true,webhookRegistered:true,lastPost:{status:200,accepted:true}}},message:'Verbindung aktiviert.'}),state);
 assert.equal(await p.locator('#relay-deactivate').isEnabled(),true);assert.match(await p.locator('#relay-status').innerText(),/Publisher läuft/);assert.match(await p.locator('#relay-status').innerText(),/HTTP 200, angenommen/);
});
test('Keine Hook-/Relay-Eingaben; verspätete Aktivierungsantwort nach Schließen bleibt verworfen',async t=>{
 const p=await pageFor(t),ready={...state,hasSyncSecret:true};await open(p,ready);
 for(const id of ['relay-prepare','relay-hook','relay-hook-panel','relay-wishes'])assert.equal(await p.locator('#'+id).count(),0);
 await p.locator('#relay-activate').click();await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:true,requestId:'activate-1',state:{...s,enabled:true,runtimeVerified:true,operation:{publisherActive:true}}}),ready);
 assert.equal(await p.locator('#relay-activate').isDisabled(),true);assert.equal(await p.locator('#relay-sync').inputValue(),'');
});
test('Fehlerantwort aktualisiert tatsächliche Freigabeflags und Laufstatus ohne Geheimnisse',async t=>{
 const p=await pageFor(t),active={...state,revision:1,hasSyncSecret:true,hasRelaySecret:false,enabled:true,runtimeVerified:true,operation:{publisherActive:true,webhookRegistered:true}};await open(p,active);await p.locator('#relay-deactivate').click();
 await p.evaluate(s=>window.__emit('mw:androidSettings.result',{ok:false,requestId:'deactivate-1',state:{...s,operation:{publisherActive:false,webhookRegistered:false,webhookRegistration:{failedStage:'url-result'}}},message:'Bitte Status neu laden.'}),active);
 assert.match(await p.locator('#relay-status').innerText(),/Verbindung freigegeben/);assert.match(await p.locator('#relay-status').innerText(),/Publisher aus/);
 assert.equal(await p.locator('#relay-refresh').isEnabled(),true);
});

test('Verlorene Bestätigung beendet den Wartezustand ohne automatisches erneutes Speichern',async t=>{
 const p=await pageFor(t);await p.clock.install();await open(p,{...state,hasSyncSecret:true});
 await p.locator('#relay-sync').fill('s'.repeat(64));await p.locator('#relay-save').click();
 await p.clock.runFor(15010);assert.match(await p.locator('#relay-result').textContent(),/Keine Bestätigung/);
 assert.equal(await p.locator('#relay-refresh').isEnabled(),true);
 assert.equal(await p.locator('#relay-sync').inputValue(),'');
 assert.equal(await p.evaluate(()=>__sent.filter(e=>e.type==='mw:androidSettings.save').length),1);
});

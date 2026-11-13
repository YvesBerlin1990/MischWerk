// Tagesansicht mit echter App, integriertem Emulator und dem dokumentierten nativen GET-Testport.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const {createEmulator}=require('../../tools/emulator/server.cjs');
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true,channel:'msedge',args:['--mute-audio']});});
test.after(async()=>{await browser?.close();});
async function setup(t,client='k3',options={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'MischWerk-Day-'));
 const instance=await createEmulator({port:0,dataDir:directory,appDir:process.env.MISCHWERK_TEST_UPLOAD});
 Object.assign(instance.hub.faults,{provider:'online'},options);instance.hub.restart(false);
 const runtime=instance.hub.runtime,posts=[];runtime.shutdown();
 runtime.clock.offset=Date.parse(options.now||'2026-11-10T18:30:00Z')-Date.now();
 runtime.persistence.api().setObject('mischwerk.android.private.v1',{enabled:true,runtimeVerified:true,syncSecret:'local-test-secret-'.repeat(4),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState'});
 let backend;const attach=runtime.context.MischWerkModules.attachScheduleDay;
 runtime.context.MischWerkModules.attachScheduleDay=r=>{attach(r);backend=r;};
 const publicRows=new Map(),gets=[],publicControl={failure:false,held:[],holdWeeks:[]};
 runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,getURL(url,callbacks){
  gets.push(url);const week=new URL(url).searchParams.get('week');
  const respond=()=>{
   if(publicControl.failure){runtime.invokeFunction(callbacks.onFailure,['',{getResponseCode:()=>503}]);return;}
   const body={version:1,ok:true,ready:true,week,today:backend.scheduleToday(),days:Array.from({length:7},(_,i)=>backend.scheduleDay(week,i)),revision:0,entries:[...publicRows.values()]};
   runtime.invokeFunction(callbacks.onSuccess,[JSON.stringify(body),{getResponseCode:()=>200,getURLString:()=>url}]);
  };
  if(publicControl.holdWeeks.includes(week))publicControl.held.push({week,respond});else respond();
 }});
 const wire={sendJson(request,finish){const row={request,finish,finished:false};posts.push(row);return ()=>{row.cancelled=true;};}};
 runtime.app=runtime.context.MischWerkModules.createApp(runtime.context.MischWerkConfig,wire);runtime.context.App=runtime.app;
 runtime.invokeFunction(runtime.app.onAppStart);runtime.clock.start();
 const context=await browser.newContext({viewport:{width:1800,height:1600}}),errors=[],external=[],requests=[];
 await context.route('**/*',route=>{const url=route.request().url();requests.push({url,frame:route.request().frame()});if(new URL(url).origin===instance.origin)return route.continue();external.push(url);return route.abort();});
 context.setDefaultTimeout(8000);
 context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 t.after(async()=>{await context.close();await instance.close();assert.ok(path.basename(directory).startsWith('MischWerk-Day-'));fs.rmSync(directory,{recursive:true,force:true});});
 function reply(extra={}){
  if(posts.at(-1)?.finished)runtime.clock.advance(20000);
  const row=posts.at(-1);assert.ok(row&&!row.finished&&!row.cancelled);row.finished=true;
  runtime.invokeFunction(row.finish,[{status:200,body:{accepted:true,serverTime:runtime.clock.now(),wishes:[],...extra}}]);
 }
 reply({moderatorCommands:[{commandId:'day-test-team',operation:'add',expectedRevision:0,nick:'Polaroid'}]});
 async function join(nick='Otterchen',clock=false){
  const page=await context.newPage();if(clock)await page.clock.install();
  await page.goto(instance.origin+'/?nick='+encodeURIComponent(nick));await page.waitForFunction(()=>window.EmulatorLab?.state.appVersion);
  await page.locator('#persona').selectOption(nick);await page.locator('#client').selectOption(client);await page.locator('#width').fill('1280');await page.locator('#width').dispatchEvent('change');await page.locator('#join').click();
  const radio=await(await page.waitForSelector('#headerbars iframe[src]')).contentFrame();await radio.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  return {page,radio};
 }
 const date=backend.scheduleToday(),week=backend.scheduleWeek(date);
 const command=(id,start,end,topic,nick='Otterchen',revision=0)=>({commandId:'save-'+id,id,operation:'save',week,expectedRevision:revision,entry:{date,kind:'live',timing:'fixed',start,end,nick,topic}});
 function publish(commands){
  for(const command of commands){if(command.operation==='delete')publicRows.delete(command.id);else publicRows.set(command.id,{id:command.id,week:command.week,until:null,...command.entry,moderator:command.entry.nick});}
  runtime.clock.advance(15000);backend.changed('schedule');
 }
 return {...instance,context,runtime,backend,posts,reply,join,command,date,week,errors,external,requests,publish,publicRows,gets,publicControl};
}
async function overlay(page,kind='schedule'){const selector='#overlays iframe[title$=" · '+kind+'"]';await page.frameLocator(selector).locator('html.mw-ready').waitFor();return await(await page.locator(selector).elementHandle()).contentFrame();}
async function openSchedule(person){await person.radio.locator('#open-schedule:not([disabled])').click();const frame=await overlay(person.page);await frame.waitForFunction(()=>document.querySelector('.schedule-topic')||document.getElementById('schedule-message').textContent==='Für diesen Tag sind keine Sendungen vorhanden.');return frame;}

for(const client of ['k3','stapp'])test('Tagesplan in '+client+' wächst mit dem Inhalt und wird beim leeren Tag wieder kompakt',async t=>{
 const lab=await setup(t,client),owner=await lab.join(),frame=await openSchedule(owner);
 await frame.waitForFunction(()=>innerHeight<350);
 const compact=await frame.evaluate(()=>innerHeight);
 lab.publish([lab.command('size-one','18:00','20:00','Ein langes Sendungsthema mit deutlich mehr Text für die schmale Ansicht')]);
 await frame.locator('.schedule-topic').filter({hasText:'Ein langes Sendungsthema'}).waitFor();
 await frame.waitForFunction(h=>innerHeight>h+20,compact);
 assert.ok(await frame.evaluate(()=>innerHeight<=600));
 for(const width of [640,320]){
  await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');await frame.waitForFunction(w=>innerWidth===w,width);
  await frame.locator('.schedule-show').last().scrollIntoViewIfNeeded();
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await frame.locator('#schedule-next').click();await frame.locator('#schedule-message').filter({hasText:'Für diesen Tag sind keine Sendungen vorhanden.'}).waitFor();
 await frame.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===0&&innerHeight<350);
 const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
 const stable=sizes();assert.ok(stable>0);
 await frame.waitForTimeout(650);
 assert.equal(sizes(),stable,'Gleicher Inhalt erzeugt keine Größenwiederholung');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['ignored','stepped','clamped'])test('Dynamischer Tagesplan bleibt in '+client+' bei '+sizing+' vollständig erreichbar und ohne Größenkaskade',async t=>{
 const lab=await setup(t,client,{hostSizing:sizing==='clamped'?'normal':sizing}),owner=await lab.join();
 if(sizing==='clamped')await owner.page.setViewportSize({width:1800,height:490});
 lab.publish([lab.command('size-limit','18:00','20:00','Lange Sendung '+ 'mit vollständigem Titel '.repeat(2))]);
 const frame=await openSchedule(owner);await frame.waitForTimeout(700);
 if(sizing==='ignored')assert.equal(await frame.evaluate(()=>innerHeight),320);
 if(sizing==='clamped')assert.ok(await frame.evaluate(()=>innerHeight<=360));
 await frame.locator('.schedule-show').last().scrollIntoViewIfNeeded();
 assert.equal(await frame.locator('.schedule-show').last().isVisible(),true);
 assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
 const stable=sizes();assert.ok(stable>0);assert.ok(stable<5,'Begrenzte Größenantwort erzeugt keine Wiederholung');
 await frame.waitForTimeout(650);assert.equal(sizes(),stable);
 await frame.locator('#schedule-next').click();await frame.locator('#schedule-message').filter({hasText:'Für diesen Tag sind keine Sendungen vorhanden.'}).waitFor();
 if(sizing!=='ignored')await frame.waitForFunction(()=>innerHeight<350);
 assert.equal(await frame.locator('.schedule-show').count(),0);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Homepage-Tagesplan in '+client+' zeigt davor/jetzt/danach, Tageswechsel und erhält Audio, Fokus sowie die übrigen Fenster',async t=>{
 const lab=await setup(t,client),owner=await lab.join();
 const rows=[lab.command('before','16:00','18:00','Feierabend-Mix','Polaroid',0),lab.command('current','18:00','20:00','MischWerk Radio Show','Otterchen',1),lab.command('after','20:00','22:00','Rock am Abend','Polaroid',2)];rows.forEach(row=>lab.publish([row]));
 await owner.radio.locator('#play-button').click();await owner.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);await owner.radio.evaluate(()=>{window.__dayAudio=document.getElementById('radio-audio');});
 await owner.radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:false}));
 let frame=await openSchedule(owner);await frame.locator('.schedule-current .schedule-topic').filter({hasText:'MischWerk Radio Show'}).waitFor();
 assert.equal(await frame.locator('.schedule-current').evaluate(n=>n.previousElementSibling.querySelector('.schedule-position').textContent),'Davor');
 assert.equal(await frame.locator('.schedule-current').evaluate(n=>n.nextElementSibling.querySelector('.schedule-position').textContent),'Danach');
 assert.equal(await frame.locator('.schedule-current .schedule-presenter').textContent(),'Otterchen');
 assert.equal(await frame.locator('.schedule-current .schedule-hours').textContent(),'18:00 – 20:00 Uhr');
 assert.equal(await frame.locator('input,textarea,select,#schedule-save,#schedule-new').count(),0);
 assert.equal(await frame.evaluate(()=>Client.pageData.station.historyUrl),undefined);
 const headerCount=await owner.page.locator('#headerbars iframe').count();
 for(const width of [640,560,390,320]){
  await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');await frame.waitForFunction(w=>innerWidth===w,width);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const folder=path.resolve(__dirname,'../../docs/pruefung/oberflaeche/sendeplan');fs.mkdirSync(folder,{recursive:true});
  if(client==='k3'&&[640,320].includes(width))await frame.locator('.dialog-shell').screenshot({path:path.join(folder,'sendeplan-tag-'+width+'.png')});
 }
 await frame.locator('#schedule-next').click();await frame.locator('#schedule-date-label').filter({hasText:'11. November'}).waitFor();await frame.locator('#schedule-message').filter({hasText:'Für diesen Tag sind keine Sendungen vorhanden.'}).waitFor();
 assert.equal(await frame.locator('.schedule-show').count(),0);assert.equal(await frame.locator('.schedule-hours').count(),0);
 await frame.locator('#schedule-today').click();await frame.locator('.schedule-current .schedule-topic').filter({hasText:'MischWerk Radio Show'}).waitFor();
 await frame.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});assert.equal(await owner.radio.locator('#open-schedule').evaluate(n=>n===document.activeElement),true);
 await owner.radio.locator('#studio-tab').click();const studio=await overlay(owner.page,'studio');await require('../support/studio-browser.cjs').login(studio);await studio.locator('#off-air:not([disabled])').waitFor();await require('../support/studio-browser.cjs').reveal(studio,'#studio-topic');await studio.locator('#studio-topic').fill('Unverlorener Entwurf');frame=await openSchedule(owner);await owner.radio.locator('#studio-tab').click();const back=await overlay(owner.page,'studio');assert.equal(await back.locator('#studio-topic').inputValue(),'Unverlorener Entwurf');
 assert.equal(await owner.page.locator('#headerbars iframe').count(),headerCount);assert.equal(await owner.radio.evaluate(()=>__dayAudio===document.getElementById('radio-audio')&&!__dayAudio.paused&&!__dayAudio.error),true);
 const listener=await lab.join('Testhoerer');const publicPlan=await openSchedule(listener);await publicPlan.locator('.schedule-topic').filter({hasText:'MischWerk Radio Show'}).waitFor();assert.equal(await publicPlan.locator('#studio-history-tab').count(),0);
 assert.equal(lab.requests.some(r=>r.frame===publicPlan&&/\/fixture\//.test(r.url)),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.runtime.errors,[]);
});

for(const client of ['k3','stapp'])test('Homepage-Inhalte in '+client+' erscheinen unverändert; leere Tage erhalten keine erfundenen Sendungen',async t=>{
 const lab=await setup(t,client),owner=await lab.join(),frame=await openSchedule(owner);
 assert.equal(await frame.locator('.schedule-show').count(),0);assert.equal(await frame.locator('#schedule-message').textContent(),'Für diesen Tag sind keine Sendungen vorhanden.');
 const row=lab.command('dynamic','18:00','20:00','<img src=x onerror=alert(1)> Mein Thema','otterchen');lab.publish([row]);await frame.locator('.schedule-topic').filter({hasText:row.entry.topic}).waitFor();assert.equal(await frame.locator('#schedule-list img, #schedule-list script').count(),0);
 assert.equal(await frame.locator('.schedule-topic').textContent(),row.entry.topic);assert.equal(await frame.locator('.schedule-presenter').textContent(),row.entry.nick);assert.equal(await frame.locator('.schedule-show').count(),1);
 await frame.locator('#schedule-next').focus();lab.publish([{...row,commandId:'edit-dynamic',expectedRevision:1,entry:{...row.entry,topic:'Thema von der Homepage aktualisiert'}}]);await frame.locator('.schedule-topic').filter({hasText:'Thema von der Homepage aktualisiert'}).waitFor();assert.equal(await frame.locator('#schedule-next').evaluate(n=>n===document.activeElement),true);
 lab.publish([{...row,commandId:'autodj-dynamic',expectedRevision:2,entry:{...row.entry,kind:'autodj',timing:'allDay',start:'00:00',end:'',topic:'MischWerk Radio Show',nick:'MischWerk am Pult'}}]);await frame.locator('.schedule-topic').filter({hasText:'MischWerk Radio Show',exact:true}).waitFor();assert.equal(await frame.locator('.schedule-presenter').textContent(),'MischWerk am Pult');assert.equal(await frame.locator('.schedule-show').count(),1);assert.equal(await frame.locator('.schedule-hours').textContent(),'Ganztägig');
 lab.publish([{...row,commandId:'delete-dynamic',operation:'delete',expectedRevision:3,entry:null}]);await frame.locator('#schedule-message').filter({hasText:'Für diesen Tag sind keine Sendungen vorhanden.'}).waitFor();assert.equal(await frame.locator('.schedule-show').count(),0);
 assert.equal(lab.publicRows.size,0);assert.equal(lab.runtime.persistence.api().getObject('mischwerk.schedule.v1.'+lab.week,null),null);
 if(client==='k3'){const folder=path.resolve(__dirname,'../../docs/pruefung/oberflaeche/sendeplan');fs.mkdirSync(folder,{recursive:true});await frame.locator('.dialog-shell').screenshot({path:path.join(folder,'sendeplan-autodj.png')});}
 await frame.evaluate(()=>Client.sendEvent('mw:schedule.save',{requestId:'readonly',week:'2026-11-09',expectedRevision:4,date:'2026-11-10',start:'12:00',end:'13:00',nick:'Otterchen',topic:'Verboten'}));await owner.page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.eventType==='mw:schedule.result'&&e.eventData.requestId==='readonly'&&e.eventData.ok===false));assert.equal(lab.runtime.persistence.api().getObject('mischwerk.schedule.v1.'+lab.week,null),null);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.runtime.errors,[]);
});

test('Ausfall oder verspätete Antwort wird nicht als AutoDJ ausgegeben; Wiederholen und Tageswechsel verwerfen alte Pakete',async t=>{
 const lab=await setup(t),owner=await lab.join('Otterchen',true),frame=await openSchedule(owner);
 await owner.page.clock.runFor(300);await owner.page.waitForFunction(()=>new Set(EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').map(e=>e.eventData.date)).size===21);
 lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:schedule.data';
 await frame.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await owner.page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.kind==='droppedServer'&&e.eventType==='mw:schedule.data'));
 assert.equal(await frame.locator('.schedule-show').count(),0);await owner.page.clock.runFor(15001);await frame.locator('#schedule-message.error').waitFor();assert.equal(await frame.locator('.schedule-show').count(),0);
 await frame.locator('#schedule-retry').click();await frame.locator('#schedule-message:not(.error)').filter({hasText:'Für diesen Tag sind keine Sendungen vorhanden.'}).waitFor();
 const deliver=lab.hub.sendUser.bind(lab.hub),held=[];lab.hub.sendUser=(nick,message)=>{if(message.type==='sessionEvent'&&message.eventType==='mw:schedule.data'&&!held.length)held.push(()=>deliver(nick,message));else deliver(nick,message);};
 await frame.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await owner.page.waitForTimeout(100);assert.equal(held.length,1);lab.hub.sendUser=deliver;
 await frame.locator('#schedule-next').click();await frame.locator('#schedule-date-label').filter({hasText:'11. November'}).waitFor();held[0]();assert.match(await frame.locator('#schedule-date-label').textContent(),/11\. November/);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Viele Tageszeilen und lange Titel bleiben bei 320 Pixeln vollständig erreichbar, auch über mehrere Datenpakete',async t=>{
 const lab=await setup(t),owner=await lab.join();const store=lab.runtime.persistence.api();
 const entries=Array.from({length:24},(_,i)=>({id:i+1,date:lab.date,kind:'live',timing:'fixed',start:String(i).padStart(2,'0')+':00',end:String((i+1)%24).padStart(2,'0')+':00',nick:'Otterchen',userId:101,topic:'Sendung '+i+' · '+ 'Sehr langer Sendungstitel '.repeat(2)}));
 entries.forEach(e=>lab.publicRows.set(String(e.id),{...e,id:String(e.id),week:lab.week,until:null,moderator:e.nick}));
 await owner.page.locator('#width').fill('320');await owner.page.locator('#width').dispatchEvent('change');const frame=await openSchedule(owner);await frame.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===24);
 await frame.locator('.schedule-show').last().scrollIntoViewIfNeeded();assert.equal(await frame.locator('.schedule-show').last().isVisible(),true);assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.ok(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length>=2);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Direkter GET in '+client+' erhält beim HTTP-Ausfall den bekannten Plan und lädt nach Wiederholen neu',async t=>{
 const lab=await setup(t,client),owner=await lab.join();const row=lab.command('real-get','18:00','20:00','Bekannter Webplan');lab.publish([row]);
 const frame=await openSchedule(owner);await frame.locator('.schedule-topic').filter({hasText:'Bekannter Webplan'}).waitFor();
 lab.publicControl.failure=true;lab.publish([{...row,entry:{...row.entry,topic:'Neuer Webplan'}}]);
 await frame.locator('#schedule-message.error').waitFor();assert.equal(await frame.locator('.schedule-topic').textContent(),'Bekannter Webplan');
 assert.equal(await frame.locator('.schedule-show').count(),1);lab.publicControl.failure=false;
 await frame.locator('#schedule-retry').click();await frame.locator('.schedule-topic').filter({hasText:'Neuer Webplan'}).waitFor();
 assert.equal(await frame.locator('#schedule-message').isVisible(),false);assert.ok(lab.gets.length>=3);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.runtime.errors,[]);
});

test('Offener Tagesplan liest geändertes öffentliches JSON über den bestehenden 20-Sekunden-Lifecycle ohne Relayauftrag',async t=>{
 const lab=await setup(t),owner=await lab.join('Otterchen',true);const row=lab.command('poll','18:00','20:00','Vorher');lab.publish([row]);
 const frame=await openSchedule(owner);await frame.locator('.schedule-topic').filter({hasText:'Vorher',exact:true}).waitFor();
 const before=lab.gets.length;await frame.locator('#schedule-next').focus();
 const saved=lab.publicRows.get('poll');saved.topic='Nachher';lab.runtime.clock.advance(60000);
 await owner.page.clock.runFor(20001);await frame.locator('.schedule-topic').filter({hasText:'Nachher',exact:true}).waitFor();
 assert.ok(lab.gets.length>before);assert.equal(await frame.locator('#schedule-next').evaluate(n=>n===document.activeElement),true);
 assert.equal(lab.runtime.persistence.api().getObject('mischwerk.schedule.v1.'+lab.week,null),null);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.runtime.errors,[]);
});

async function preloaded(owner){
 await owner.page.waitForFunction(()=>new Set(EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').map(e=>e.eventData.date)).size>=21);
}
for(const stamp of ['2026-11-09T18:30:00Z','2026-11-15T18:30:00Z'])test('21-Tage-Vorladen zeigt den ersten Tag vor den Randwochen und navigiert ohne neue Abrufe '+stamp,async t=>{
 const lab=await setup(t,'k3',{now:stamp}),owner=await lab.join();
 const today=lab.backend.scheduleToday(),week=lab.backend.scheduleWeek(today),first=lab.backend.scheduleDay(week,-7);
 const days=Array.from({length:21},(_,i)=>lab.backend.scheduleDay(first,i));
 for(const date of days)lab.publicRows.set(date,{id:date,date,week:lab.backend.scheduleWeek(date),start:'00:00',end:'00:00',timing:'allDay',kind:'live',until:null,topic:'Tag '+date,moderator:'Testmoderation'});
 lab.publicControl.holdWeeks=[first];
 const frame=await openSchedule(owner);await frame.locator('.schedule-topic').filter({hasText:'Tag '+today,exact:true}).waitFor();
 await owner.page.waitForFunction(()=>EmulatorLab.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length>=2);
 assert.equal(lab.publicControl.held.length,1,'Die erste Woche muss die sichtbare Auswahl nicht blockieren');
 lab.publicControl.holdWeeks=[];lab.publicControl.held.shift().respond();await preloaded(owner);
 const gets=lab.gets.length,bridge=lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length;
 assert.equal(gets,3);assert.equal(bridge,21);
 const index=days.indexOf(today);assert.ok(index>=7&&20-index>=7);
 for(let i=index;i>0;i--)await frame.locator('#schedule-previous').click();
 assert.equal(await frame.locator('#schedule-previous').isDisabled(),true);
 await frame.locator('#schedule-previous').evaluate(n=>n.dispatchEvent(new MouseEvent('click')));
 assert.equal(await frame.locator('#schedule-date-label').getAttribute('datetime'),days[0]);
 for(let i=0;i<21;i++){
  assert.equal(await frame.locator('#schedule-date-label').getAttribute('datetime'),days[i]);
  assert.equal(await frame.locator('.schedule-topic').textContent(),'Tag '+days[i]);
  assert.equal(await frame.locator('#schedule-list').getAttribute('aria-busy'),'false');
  assert.equal(await frame.locator('#schedule-message').isVisible(),false);
  if(i<20)await frame.locator('#schedule-next').click();
 }
 assert.equal(await frame.locator('#schedule-next').isDisabled(),true);
 await frame.locator('#schedule-next').evaluate(n=>n.dispatchEvent(new MouseEvent('click')));
 assert.equal(await frame.locator('#schedule-date-label').getAttribute('datetime'),days.at(-1));
 assert.equal(lab.gets.length,gets);assert.equal(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length,bridge);
 await frame.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});const reopened=await openSchedule(owner);
 assert.equal(await reopened.evaluate(()=>Client.pageData.scheduleInitial.date),days.at(-1),'Wiederöffnung enthält den bestätigten ausgewählten Tag bereits im Anfangspaket');
 assert.equal(lab.gets.length,gets);
 t.diagnostic('Initial: 3 GETs und 21 Tagespakete; '+(index+20)+' anschließende Tageswechsel: 0 GETs und 0 Tagesabrufe.');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const closed of [false,true])test('Drei-Wochen-Grenze setzt ausgeschlossene Auswahl auf Heute zurück '+client+(closed?' nach Wiederöffnung':' im offenen Plan'),async t=>{
 const lab=await setup(t,client,{now:'2026-11-15T22:59:58Z'}),owner=await lab.join('Otterchen',true);
 let frame=await openSchedule(owner);await owner.page.clock.runFor(100);await preloaded(owner);
 const first=lab.backend.scheduleDay(lab.week,-7),steps=13;
 for(let i=0;i<steps;i++)await frame.locator('#schedule-previous').click();
 assert.equal(await frame.locator('#schedule-date-label').getAttribute('datetime'),first);
 if(closed){await frame.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});}
 lab.runtime.clock.advance(3000);await owner.page.clock.runFor(20001);
 if(closed)frame=await openSchedule(owner);
 const today=lab.backend.scheduleToday();
 await frame.waitForFunction(date=>document.getElementById('schedule-date-label').getAttribute('datetime')===date,today);
 const currentWeek=lab.backend.scheduleWeek(today),allowed=[-7,0,7].map(n=>lab.backend.scheduleDay(currentWeek,n));
 assert.equal(today,'2026-11-16');
 assert.equal(lab.backend.cachedPublicSchedule(first),null);
 assert.ok(lab.gets.slice(3).every(url=>allowed.includes(new URL(url).searchParams.get('week'))),'Nach Wochenwechsel keine alten Außenwochen lesen');
 assert.equal(await frame.locator('#schedule-previous').isDisabled(),false);
 assert.equal(await frame.locator('#schedule-next').isDisabled(),false);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.runtime.errors,[]);
});

test('Unveränderte Hintergrundantwort erhält echte Zeilenknoten, Fokus und Scrollposition',async t=>{
 const lab=await setup(t),owner=await lab.join();
 for(let i=0;i<24;i++)lab.publicRows.set('stable-'+i,{id:'stable-'+i,date:lab.date,week:lab.week,kind:'live',timing:'fixed',start:String(i).padStart(2,'0')+':00',end:String((i+1)%24).padStart(2,'0')+':00',until:null,topic:'Stabile Sendung '+i,moderator:'Testmoderation'});
 const frame=await openSchedule(owner);await preloaded(owner);await frame.waitForFunction(()=>document.querySelectorAll('.schedule-show').length===24);
 await frame.locator('#schedule-next').focus();
 const before=await frame.evaluate(()=>{const list=document.getElementById('schedule-list');list.scrollTop=240;window.__stableRows=Array.from(list.children);return list.scrollTop;});
 const count=lab.hub.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length,gets=lab.gets.length;
 await frame.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await owner.page.waitForFunction(n=>EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length>n,count);
 assert.ok(lab.hub.trace.findLast(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').eventData.unchanged);
 assert.equal(await frame.evaluate(()=>__stableRows.every((node,i)=>node===document.getElementById('schedule-list').children[i])),true);
 assert.equal(await frame.locator('#schedule-list').evaluate(n=>n.scrollTop),before);
 assert.equal(await frame.locator('#schedule-next').evaluate(n=>n===document.activeElement),true);assert.equal(lab.gets.length,gets);
 lab.runtime.clock.advance(60000);await frame.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await owner.page.waitForFunction(n=>EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length>n,count+1);
 assert.equal(await frame.evaluate(()=>__stableRows.every((node,i)=>node===document.getElementById('schedule-list').children[i])),true,'Auch eine neue identische Vollantwort baut die Liste nicht um');
 assert.equal(await frame.locator('#schedule-list').evaluate(n=>n.scrollTop),before);
 assert.equal(await frame.locator('#schedule-next').evaluate(n=>n===document.activeElement),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Berliner Mitternacht verschiebt das Vorladefenster und Jetzt läuft ohne Programmabruf weiter',async t=>{
 const lab=await setup(t,'stapp',{now:'2026-11-15T22:59:58Z'}),owner=await lab.join('Otterchen',true);
 const sunday=lab.backend.scheduleToday(),monday=lab.backend.scheduleDay(sunday,1);
 lab.publicRows.set('cross',{id:'cross',date:sunday,week:lab.backend.scheduleWeek(sunday),start:'23:00',end:'02:00',timing:'fixed',kind:'live',until:null,topic:'Über Mitternacht',moderator:'Testmoderation'});
 const frame=await openSchedule(owner);await owner.page.clock.runFor(100);await preloaded(owner);
 assert.equal(await frame.locator('.schedule-current .schedule-topic').textContent(),'Über Mitternacht');
 const gets=lab.gets.length;
 lab.runtime.clock.advance(3000);await owner.page.clock.runFor(20001);
 await frame.locator('#schedule-date-label').filter({hasText:'16. November'}).waitFor();
 assert.equal(await frame.locator('.schedule-current .schedule-topic').textContent(),'Über Mitternacht');
 await owner.page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data'&&e.eventData.date==='2026-11-29'));
 assert.equal(lab.gets.length,gets+1,'Nur die neu hinzugekommene Kalenderwoche wird geladen');
 assert.equal(await frame.locator('#schedule-date-label').getAttribute('datetime'),monday);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const stamp of ['2026-03-29T00:59:58Z','2026-10-25T00:59:58Z'])test('Jetzt-Markierung folgt der Berliner Zeitumstellung ohne neue Programmdaten '+stamp,async t=>{
 const lab=await setup(t,'k3',{now:stamp}),owner=await lab.join('Otterchen',true),date=lab.backend.scheduleToday(),week=lab.backend.scheduleWeek(date);
 for(const [id,start,end,topic] of [['early','00:00','02:30','Früh'],['late','02:30','04:00','Spät']])lab.publicRows.set(id,{id,date,week,start,end,topic,moderator:'Testmoderation',kind:'live',timing:'fixed',until:null});
 const frame=await openSchedule(owner);await owner.page.clock.runFor(100);await preloaded(owner);
 const spring=stamp.includes('03-29');assert.equal(await frame.locator('.schedule-current .schedule-topic').textContent(),spring?'Früh':'Spät');
 const gets=lab.gets.length,bridge=lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length;
 lab.runtime.clock.advance(3000);await owner.page.clock.runFor(3000);
 await frame.locator('.schedule-current .schedule-topic').filter({hasText:spring?'Spät':'Früh',exact:true}).waitFor();
 assert.equal(lab.gets.length,gets);assert.equal(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.day').length,bridge);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Offline bleibt der bestätigte Tag sichtbar und ausdrücklich veraltet; Wiederanbindung erhält dieselben Zeilen',async t=>{
 const lab=await setup(t),owner=await lab.join();lab.publish([lab.command('offline','18:00','20:00','Bekannter Offlineplan')]);
 const frame=await openSchedule(owner);await preloaded(owner);await frame.evaluate(()=>window.__offlineRow=document.querySelector('.schedule-show'));
 await frame.evaluate(()=>window.dispatchEvent(new Event('offline')));
 await frame.locator('#schedule-message.error').filter({hasText:'derzeit nicht aktuell'}).waitFor();
 assert.equal(await frame.locator('.schedule-topic').textContent(),'Bekannter Offlineplan');assert.equal(await frame.locator('#schedule-next').isDisabled(),true);
 await frame.locator('.dialog-shell').screenshot({path:path.join(os.tmpdir(),'MischWerk-392-Sendeplan-Offline.png')});
 await frame.evaluate(()=>window.dispatchEvent(new Event('online')));await frame.locator('#schedule-message').waitFor({state:'hidden'});
 assert.equal(await frame.evaluate(()=>__offlineRow===document.querySelector('.schedule-show')),true);
 assert.equal(await frame.locator('#schedule-next').isDisabled(),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Gebündelte Vorwochenänderung aktualisiert eine grenzüberschreitende Sendung und erhält die entfernte Cachewoche',async t=>{
 const lab=await setup(t,'k3',{now:'2026-11-16T00:30:00Z'}),owner=await lab.join();
 const today=lab.backend.scheduleToday(),week=lab.backend.scheduleWeek(today),sunday=lab.backend.scheduleDay(today,-1),previous=lab.backend.scheduleWeek(sunday),after=lab.backend.scheduleDay(week,7);
 lab.publicRows.set('night',{id:'night',date:sunday,week:previous,start:'22:00',end:'02:00',timing:'fixed',kind:'live',until:null,topic:'Vorwochensendung',moderator:'Testmoderation'});
 const frame=await openSchedule(owner);await preloaded(owner);
 assert.equal(await frame.locator('.schedule-hours').textContent(),'00:00 – 02:00 Uhr');
 const gets=lab.gets.length;await frame.locator('#schedule-next').focus();
 lab.publicRows.get('night').end='03:00';
 for(let i=0;i<3;i++)lab.backend.changed('schedule',previous);
 await frame.locator('.schedule-hours').filter({hasText:'00:00 – 03:00 Uhr',exact:true}).waitFor();
 await owner.page.waitForFunction(n=>EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length>=n,35);
 assert.equal(lab.backend.cachedPublicSchedule(after).stale,false);assert.equal(lab.gets.length,gets+2,'Drei Änderungen führen zu je einem Abruf der betroffenen und angrenzenden Woche');
 assert.equal(await frame.locator('#schedule-next').evaluate(n=>n===document.activeElement),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Warme Wiederöffnung stellt die gespeicherte Scrollposition her und Hintergrundprüfung erhält die jüngere Position',async t=>{
 const lab=await setup(t),owner=await lab.join();
 for(let i=0;i<12;i++)lab.publicRows.set('scroll-'+i,{id:'scroll-'+i,date:lab.date,week:lab.week,kind:'live',timing:'fixed',start:String(i*2).padStart(2,'0')+':00',end:String(((i+1)*2)%24).padStart(2,'0')+':00',until:null,topic:'Scrollsendung '+i,moderator:'Testmoderation'});
 let frame=await openSchedule(owner);await preloaded(owner);
 await frame.locator('#schedule-list').evaluate(n=>n.scrollTop=120);
 await frame.locator('#schedule-next').click();await frame.locator('#schedule-previous').click();
 await frame.locator('#schedule-list').evaluate(n=>n.scrollTop=420);
 const count=lab.hub.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length;
 await frame.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await owner.page.waitForFunction(n=>EmulatorLab.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:schedule.data').length>n,count);
 assert.equal(await frame.locator('#schedule-list').evaluate(n=>n.scrollTop),420,'Refresh verwendet keine ältere Besuchsposition');
 await frame.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});frame=await openSchedule(owner);
 assert.ok(await frame.evaluate(()=>Client.pageData.scheduleInitial),'Der vollständige kleine Tag kommt aus dem warmen Servercache');
 await frame.waitForFunction(()=>document.getElementById('schedule-list').scrollTop===420).catch(async error=>{
  t.diagnostic(JSON.stringify(await frame.evaluate(()=>({position:document.getElementById('schedule-list').scrollTop,saved:Client.pageData.overlayState,clientHeight:document.getElementById('schedule-list').clientHeight,scrollHeight:document.getElementById('schedule-list').scrollHeight}))));throw error;
 });
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

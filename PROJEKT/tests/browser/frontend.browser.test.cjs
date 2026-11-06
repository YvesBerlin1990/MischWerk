const {previewCurtain}=require('../support/preview-command.cjs');
// Optional: Playwright/Edge mit lokalem Testton und eigener Werbe-MP3, ohne echte Sender-/Knuddels-Verbindungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MISCHWERK_PLAYWRIGHT || 'playwright');
const { createHarness } = require('../support/knuddels.cjs');
const { configureStream } = require('../fixtures/stream.cjs');
const {reveal:revealStudio,readText:readStudioText,fits:studioFits,settle:studioSettle}=require('../support/studio-browser.cjs');
const {inspectLayout}=require('../support/layout-browser.cjs');
const root = path.resolve(__dirname, '../..');
const browserSource=process.env.MISCHWERK_TEST_UPLOAD?path.resolve(process.env.MISCHWERK_TEST_UPLOAD,'www'):path.join(root,'app/www');
let browser;
// Tatsächlichen lokalen Ladeplan prüfen, einschließlich reproduzierbarer Uploadbündel.
function selectedFiles(view){
 const vm=require('node:vm'),files=[],document={readyState:'loading',addEventListener(){},documentElement:{getAttribute:()=>view,setAttribute(){}}};
 const Client={pageData:{view},includeJS:f=>files.push(f),includeCSS:f=>files.push(f)};
 vm.runInNewContext(fs.readFileSync(path.join(browserSource,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],{Client,document,setTimeout(){}});
 vm.runInNewContext(fs.readFileSync(path.join(browserSource,'js/start.js'),'utf8'),{Client,document,window:{}});
 return ['js/start.js',...files];
}
function deliveredFile(view,file){
 if(!process.env.MISCHWERK_TEST_UPLOAD||file==='js/start.js')return file;
 const original=fs.readFileSync(path.join(root,'app/www',file),'utf8');
 const delivered=selectedFiles(view).find(f=>f.endsWith(path.extname(file))&&fs.readFileSync(path.join(browserSource,f),'utf8').includes(original));
 assert.ok(delivered,'Vollständige Quelldatei im Ladeplan vorhanden: '+file);return delivered;
}


for(const k3 of [true,false])test('Knuddels-Heartbeat bleibt bei wiederkehrenden kurzen Engpässen in '+(k3?'K3':'STAPP')+' fällig',async t=>{
 const {page,state,errors}=await setup(t,{station:true,clock:true,activityAudio:true,k3});
 await page.evaluate(state=>{let revision=state.revision;const send=Client.sendEvent;Client.sendEvent=function(type,data){send.call(this,type,data);if(type==='mw:refresh')__emit('mw:state',{...state,revision:++revision,refreshRequestId:data.requestId});};},state);
 await page.locator('#play-button').click();
 for(let i=0;i<7;i++){
  await page.clock.runFor(55000);await page.locator('#radio-audio').evaluate(a=>{Object.defineProperty(a,'currentTime',{configurable:true,value:a.currentTime});Object.defineProperty(a,'readyState',{configurable:true,value:2});a.dispatchEvent(new Event('waiting'));});
  await page.clock.runFor(2000);await page.locator('#radio-audio').evaluate(a=>{delete a.currentTime;delete a.readyState;});await page.clock.runFor(3000);
 }
 const slashes=await page.evaluate(()=>__slashCommands);assert.equal(slashes.length,2);assert.ok(slashes[1].at-slashes[0].at>=180000);assert.ok(slashes.every(s=>s.command==='/confirm'));
 await page.locator('#play-button').click();await page.clock.runFor(190000);assert.equal(await page.evaluate(()=>__slashCommands.length),2);assert.deepEqual(errors,[]);
});

for(const k3 of [true,false])test('Wiedergabe-Heartbeat in '+(k3?'K3':'STAPP')+' bleibt an Medienfortschritt und frische Channelantwort gebunden',async t=>{
 const {page,state,errors}=await setup(t,{station:true,clock:true,activityAudio:true,k3});
 await page.evaluate(state=>{
  let revision=state.revision;window.__activityAck=true;
  const original=Client.sendEvent;Client.sendEvent=function(type,data){
   original.call(this,type,data);
   if(type==='mw:refresh'&&(!data.requestId||window.__activityAck))window.__emit('mw:state',{...state,revision:++revision,refreshRequestId:data.requestId});
  };
 },state);
 await page.clock.runFor(200000);assert.equal(await page.evaluate(()=>window.__slashCommands.length),0);
 await page.locator('#play-button').click();await page.clock.runFor(180000);
 assert.equal(await page.evaluate(()=>window.__slashCommands.length),0);
 await page.clock.runFor(2000);assert.deepEqual(await page.evaluate(()=>window.__slashCommands.map(s=>s.command)),['/confirm'],JSON.stringify(await page.evaluate(()=>({sent:window.__sent.slice(-5),label:document.getElementById('stream-label').textContent,position:document.getElementById('radio-audio').currentTime,paused:document.getElementById('radio-audio').paused,ready:document.getElementById('radio-audio').readyState,now:Date.now()}))));
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:true}));
 await page.clock.runFor(182000);assert.equal(await page.evaluate(()=>window.__slashCommands.length),2);
 await page.evaluate(()=>{window.__activityAck=false;});await page.clock.runFor(180000);
 assert.equal(await page.evaluate(()=>window.__slashCommands.length),2,'Keine Aktivität allein aus laufendem Ton oder beliebigen Snapshots');
 const pending=await page.evaluate(()=>window.__sent.filter(e=>e.data?.requestId?.startsWith('playback-')).at(-1).data.requestId);
 await page.locator('#play-button').click();
 await page.evaluate(({state,pending})=>window.__emit('mw:state',{...state,revision:9999,refreshRequestId:pending}),{state,pending});
 await page.clock.runFor(600000);assert.equal(await page.evaluate(()=>window.__slashCommands.length),2);
 assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
});

test('Vinyl Deck bleibt über alle Leistenbreiten, Rollen und Pixeldichten erreichbar',async t=>{
 const rows=[],widths=[320,360,374,375,390,560,561,640,641,699,700,701,850,899,900,901,1024,1100,1199,1200,1201,1280,1350,1351,1360,1490,1600,1920,2290,2560,3440,3840];
 try{
  for(const deviceScaleFactor of [1,1.25,1.5,2])for(const role of ['listener','radioModerator','owner']){
   const {page,state,errors,requests}=await setup(t,{role,deviceScaleFactor,station:true,viewport:{width:1280,height:160}});
   await page.evaluate(()=>document.fonts.ready);
   for(const [width,height] of [...widths.map(w=>[w,160]),[320,360],[390,600],[700,600],[701,600],[1199,600],[1200,600]]){
    await resizeViewport(page,{width,height});
    const row=await page.evaluate(()=>{
     const m=document.getElementById('radio-metadata'),face=document.querySelector('.radio-program-face'),f=face.getBoundingClientRect();
     const controls=['play-button','open-schedule','open-wishes','studio-tab','team-tab'].map(id=>document.getElementById(id)).filter(n=>n?.getClientRects().length).map(n=>({id:n.id,...n.getBoundingClientRect().toJSON()}));
     const music=document.querySelector('.now-playing').getBoundingClientRect(),topic=document.querySelector('.radio-context').getBoundingClientRect();
     const studio=document.querySelector('#studio-tab:not([hidden])');
     function discStyle(node) { if(!node)return null;const s=getComputedStyle(node),r=node.getBoundingClientRect();return [r.width,r.height,s.borderRadius,s.borderColor,s.backgroundImage,s.color]; }
     const studioDisc=studio?discStyle(studio.querySelector('.public-action-icon')):null,publicDisc=discStyle(document.querySelector('#open-schedule .public-action-icon'));
     return {canvases:[document.documentElement,document.body,document.getElementById('radio-panel')].map(n=>getComputedStyle(n).backgroundColor),musicShare:music.width/m.clientWidth,topicShare:topic.width/m.clientWidth,faceWidth:f.width,faceHeight:f.height,horizontalOverflow:document.documentElement.scrollWidth>innerWidth||m.scrollWidth>m.clientWidth,controls,studioDisc,publicDisc,
      background:getComputedStyle(face).backgroundColor,vinyl:getComputedStyle(face,'::before').backgroundImage,titleFont:getComputedStyle(document.getElementById('track-title')).fontFamily,uiFont:getComputedStyle(document.body).fontFamily};
    });
    rows.push({width,height,role,deviceScaleFactor,...row});
    const detail=JSON.stringify({width,height,role,deviceScaleFactor,...row});
    assert.ok(row.faceWidth>0&&row.faceHeight>0,detail);assert.equal(row.horizontalOverflow,false,detail);
    if(width>=1200){assert.ok(row.musicShare<=.6&&row.topicShare>=.35,'Musik und Thema teilen die Breite ausgewogen: '+detail);}
    assert.deepEqual(row.canvases,Array(3).fill('rgb(15, 17, 20)'),'Äußerer Untergrund entspricht dem Channelbild: '+detail);
    assert.equal(row.background,'rgb(20, 20, 20)');assert.match(row.vinyl,/repeating-radial-gradient/);assert.match(row.titleFont,/Fraunces/);assert.match(row.uiFont,/Outfit/);
    assert.equal(row.controls.length,role==='owner'||role==='radioModerator'?4:3,detail);
    if(role!=='listener') { assert.ok(row.studioDisc,'Moderation hat dieselbe runde Symbolfläche: '+detail);assert.deepEqual(row.studioDisc,row.publicDisc,'Gleiche Vinylfläche für Moderation und Sendeplan: '+detail); }
    for(const c of row.controls){assert.ok(c.width>=44&&c.height>=44,detail);assert.ok(c.x>=0&&c.x+c.width<=width+.5,detail);if(height===160)assert.ok(c.y>=0&&c.y+c.height<=160.5,detail);}
    await publicActionContentsFit(page);
    for(const id of ['mute-button','volume','volume-value']){await page.locator('#'+id).scrollIntoViewIfNeeded();const c=await page.locator('#'+id).boundingBox();assert.ok(c.x>=0&&c.x+c.width<=width+.5,detail);}
    await muteButtonFits(page);
    if(deviceScaleFactor===1&&role==='owner'&&[320,700,1280,2290].includes(width)&&height===160)await captureDesign(page,'Vinyl-Deck-'+width);
   }
   const text='Langer vollständiger Musikwunsch '.repeat(10).slice(0,300);
   await page.evaluate(({state,text})=>window.__emit('mw:state',{...state,revision:3,topic:'S'.repeat(80),moderator:{nick:'EinSehrLangerModeratornameMitWeiteremZusatz'},wishPositions:{available:true,generation:'vinyl-test',revision:1,nextPosition:2,items:[{id:1,text,position:2,stage:'queued'}],total:1,page:0,pages:1,nextItem:{id:1,text,position:2,stage:'queued'}}}),{state,text});
   for(const width of [320,700,701,900,901,1199,1200,1280,3840]){
    await resizeViewport(page,{width,height:160});
    for(const id of ['show-topic','host-name','own-wish-rank','own-wish-title','mute-button'])await page.locator('#'+id).scrollIntoViewIfNeeded();
    await muteButtonFits(page);
    assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollWidth>n.clientWidth),false,'Lange Inhalte bei '+width);
    assert.equal(await page.locator('#own-wish-title').getAttribute('title'),text);
    if(width>=1200){const portions=await page.evaluate(()=>{const m=document.getElementById('radio-metadata');return ['.now-playing','.radio-context','#own-wish-position'].map(s=>document.querySelector(s).getBoundingClientRect().width/m.clientWidth);});assert.ok(Math.max(...portions)<=.45&&Math.min(...portions)>=.23,'Mit Wunsch teilen alle drei Bereiche die Breite: '+JSON.stringify({width,role,portions}));}
    if(width>=1200)assert.ok(await page.locator('#radio-metadata').evaluate(m=>{m.scrollTop=0;return ['.track-eyebrow','.topic-label','.own-wish-label'].every(s=>document.querySelector(s).getBoundingClientRect().top>=m.getBoundingClientRect().top-.5);}),'Auch lange Textgruppen bleiben oben vollständig erreichbar: '+JSON.stringify({width,role,deviceScaleFactor}));
   }
   assert.ok(requests.every(url=>!url.includes('fonts.googleapis.com')&&!url.includes('fonts.gstatic.com')),'Schriften ausschließlich lokal');
   assert.deepEqual(errors,[]);await page.context().close();
  }
 }finally{if(process.env.MISCHWERK_LAYOUT_RESULTS)fs.writeFileSync(process.env.MISCHWERK_LAYOUT_RESULTS,JSON.stringify(rows,null,2)+'\n');}
});

test('Schmale Ansichten trennen sichtbare Texte, Dekoration und Bedienflächen auch bei knapper Höhe',async t=>{
 const sizes=[[320,160],[320,320],[320,360],[320,760],[360,420],[390,176],[390,500],[390,760],[475,568],[476,360],[600,420],[640,568],[641,360],[659,420],[660,568],[700,360],[700,760],[701,500],[900,420],[901,568],[1024,360],[1199,500]];
 const rows=[];
 for(const k3 of [true,false])for(const view of ['radio','wishes','studio','team','schedule']){
  const {page,state,errors}=await setup(t,{view,k3,station:true,viewport:{width:390,height:600}});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Sehr langes Sendungsthema '.repeat(4).slice(0,80),
   moderator:{nick:'EinSehrLangerModeratornameMitWeiteremZusatz',expiresAt:Date.now()+3600000},
   wishPositions:{available:true,generation:'layout-test',revision:1,nextPosition:2,items:[{id:1,text:'Wunschtext '.repeat(30),position:2,stage:'queued'}],total:1,page:0,pages:1,nextItem:{id:1,text:'Wunschtext '.repeat(30),position:2,stage:'queued'}},
   queue:[{id:1,nick:'SehrLangerHoererNickname',text:'Wunschtext '.repeat(30),createdAt:Date.now()}],queueTotal:1,pages:1,
   radioModerators:[{userId:8,nick:'EinSehrLangerModeratornameMitWeiteremZusatz'}],radioModeratorTotal:1,radioModeratorPages:1}),state);
  async function check(){
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const result=await inspectLayout(page);rows.push({k3,...result});assert.deepEqual(result.issues,[],JSON.stringify({k3,...result}));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  }
  for(const [width,height] of sizes){
   if(view!=='radio'&&height<320)continue;
   await resizeViewport(page,{width,height});await page.evaluate(()=>document.fonts.ready);await check();
   if(view==='radio'){
    const spacing=await page.evaluate(()=>{
     const face=document.querySelector('.radio-program-face').getBoundingClientRect(),s=getComputedStyle(document.querySelector('.radio-program-face'),'::before');
     const play=document.getElementById('play-button').getBoundingClientRect(),meta=document.getElementById('radio-metadata'),music=meta.querySelector('.now-playing').getBoundingClientRect(),actions=document.getElementById('radio-actions').getBoundingClientRect();
     const disc={left:face.left+parseFloat(s.left),top:face.top+parseFloat(s.top)-parseFloat(s.height)/2,width:parseFloat(s.width),height:parseFloat(s.height)};
     return {disc,play:play.toJSON(),textLeft:music.left,bottom:actions.top};
    });
    assert.ok(spacing.disc.left+spacing.disc.width<=spacing.textLeft-2,'Schallplatte bleibt vor den Texten: '+JSON.stringify({width,height,k3,spacing}));
    assert.ok(spacing.disc.top+spacing.disc.height<=spacing.bottom-2,'Schallplatte bleibt über den Aktionen: '+JSON.stringify({width,height,k3,spacing}));
    await publicActionContentsFit(page);await muteButtonFits(page);
   }
   for(const selector of view==='studio'?['#studio-queue-tab','#studio-history-tab','#studio-programme-tab']:view==='team'?['#team-texts-tab','#team-members-tab']:[]){
    await page.locator(selector).click();await check();
    if(selector==='#studio-queue-tab'&&await page.locator('#queue-detail-toggle').isVisible()){
     assert.ok(await page.locator('.queue-copy h3').evaluate(n=>n.clientHeight>=24),'Der Wunschtext behält sichtbare Lesefläche');
     await page.locator('#queue-detail-toggle').click();await check();
     for(const button of await page.locator('.queue-toolbar button').all())if(await button.isVisible()){await button.scrollIntoViewIfNeeded();await check();assert.equal(await button.evaluate(n=>{const b=n.getBoundingClientRect();return document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest('button')===n;}),true);}
     await page.locator('#queue-detail-toggle').click();await check();
     for(const button of await page.locator('.queue-copy button').all())if(await button.isVisible()){await button.scrollIntoViewIfNeeded();await check();assert.equal(await button.evaluate(n=>{const b=n.getBoundingClientRect();return document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest('button')===n;}),true);}
    }
   }
  }
  if(view==='studio'){
   await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,user:{...state.user,isOnAir:true,canEndModeration:true},
    moderator:{nick:state.user.nick,since:Date.now()-3600000,expiresAt:Date.now()+3600000,sessionKey:'layout-own'},
    handover:{candidates:['NaechsterModeratorMitLangemNicknamen'],incoming:null,outgoing:null,receivedNotes:null}}),state);
   for(const [width,height] of [[320,360],[390,420],[640,568]]){
    await resizeViewport(page,{width,height});await revealStudio(page,'#on-air');await page.locator('#on-air').click();await check();
    for(const id of ['studio-end-mode','studio-end-at','studio-end-cancel']){await page.locator('#'+id).scrollIntoViewIfNeeded();await check();}
    await page.locator('#studio-end-mode').selectOption('openEnd');await check();await page.locator('#studio-end-cancel').click();
    await revealStudio(page,'#handover-open');await page.locator('#handover-open').click();await check();
    await revealStudio(page,'#handover-notes','handover');await page.locator('#handover-notes').fill('Private Übergabehinweise '.repeat(22).slice(0,500));await check();
    await page.locator('#handover-back').click();
   }
  }
  assert.deepEqual(errors,[]);await page.context().close();
 }
 if(process.env.MISCHWERK_RESPONSIVE_RESULTS)fs.writeFileSync(process.env.MISCHWERK_RESPONSIVE_RESULTS,JSON.stringify(rows,null,2)+'\n');
});

test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
function radioSong(song) { return song ? {title:song.title,artist:typeof song.artist==='string'?song.artist:song.artist?.name} : null; }
for(const k3 of [true,false]) {
  test('Neuer Player übersteht knappen Puffer und Ereignisflut in '+(k3?'K3':'STAPP'),async t=>{
    const {page,errors}=await setup(t,{station:true,realAudio:true,clock:true,k3});
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    await page.locator('#volume').evaluate(n=>{n.value='73';n.dispatchEvent(new Event('input'));});
    await page.locator('#radio-audio').evaluate(a=>{window.__plays=0;const play=a.play;a.play=function(){window.__plays++;return play.call(this);};Object.defineProperty(a,'readyState',{configurable:true,value:2});for(let i=0;i<50;i++){a.dispatchEvent(new Event('waiting'));a.dispatchEvent(new Event('stalled'));}});
    const source=await page.locator('#radio-audio').getAttribute('src');
    for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,300));await page.clock.runFor(7000);}
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),source);assert.equal(await page.evaluate(()=>__plays),0);assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.73);
    await page.locator('#radio-audio').evaluate(a=>{delete a.readyState;});await page.waitForFunction(()=>document.body.classList.contains('playing'));
    assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);
  });
  for(const cause of ['ohne Ereignis','playing-Flut','rückwärts gestellte Uhr'])test('Echter Stillstand verbindet in '+(k3?'K3':'STAPP')+' automatisch neu: '+cause,async t=>{
    const {page,errors}=await setup(t,{station:true,activityAudio:true,clock:true,k3});
    await page.locator('#play-button').click();await page.clock.runFor(5000);
    await page.locator('#radio-audio').evaluate(a=>{window.__plays=0;const play=a.play;a.play=function(){window.__plays++;return play.call(this);};Object.defineProperty(a,'currentTime',{configurable:true,value:a.currentTime});});
    if(cause==='rückwärts gestellte Uhr')await page.clock.setSystemTime(await page.evaluate(()=>Date.now()-3600000));
    for(let i=0;i<17;i++){await page.clock.runFor(1000);if(cause==='playing-Flut')await page.locator('#radio-audio').evaluate(a=>a.dispatchEvent(new Event('playing')));}
    assert.equal(await page.evaluate(()=>__plays),1);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');
    await page.locator('#radio-audio').evaluate(a=>{delete a.currentTime;});await page.clock.runFor(2000);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
    await page.locator('#play-button').click();await page.clock.runFor(60000);assert.equal(await page.evaluate(()=>__plays),1);assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
  });
  test('Unerwartete native Pause setzt in '+(k3?'K3':'STAPP')+' dieselbe Quelle fort',async t=>{
    const {page,errors}=await setup(t,{station:true,realAudio:true,k3});await page.locator('#play-button').click();await waitRadioPlaying(page);const source=await page.locator('#radio-audio').getAttribute('src');
    await page.locator('#radio-audio').evaluate(a=>a.pause());await waitRadioPlaying(page);assert.equal(await page.locator('#radio-audio').getAttribute('src'),source);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);
  });
}
async function setup(t, { nativeSizing = false, hostSteps = false, screenHeight, role = 'owner', registeredOwner = true, curtainClosed = false, nick, parserIncludes = false, deviceScaleFactor = 1, station = false, delayedSong = false, delayedStatus = false, providerStatus = 'started', throwingPlay = false, clock = false, k3 = true, realAudio = false, activityAudio = false, cors = true, savedVolume, loadingDelay, loadingPause = 0, initialRequest = false, view = 'radio', overlayState, viewport = { width: 960, height: 760 } } = {}) {
  const h = createHarness(); configureStream(h.config, station ? 'test-radio' : '');
  const owner=h.user(1,'Otterchen','owner'),ownerSession=h.open(owner);
  const user=role==='owner'?owner:h.user(2,role==='radioModerator'?'RadioMod':'Musikfreund',role==='channelModerator'?'moderator':role==='manager'?'manager':'listener');
  if(role==='owner'&&registeredOwner&&view!=='team')h.event(owner,ownerSession,'mw:addRadioModerator',{nick:owner.nick});
  if(role==='radioModerator')h.event(owner,ownerSession,'mw:addRadioModerator',{nick:user.nick});
  const session=role==='owner'?ownerSession:h.open(user);
  if(nick){user.nick=nick;}
  const state = h.state(user, session); state.view = view; state.curtain.closed=curtainClosed;
  if(overlayState){state.overlay=true;state.overlayState=overlayState;}
  if (initialRequest) { state.queue = [{id:201,nick:'Hörer',text:'a-ha – Take On Me',createdAt:Date.now()}]; state.queueTotal=1; state.pages=1; }
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  t.after(() => context.close());
  const page = await context.newPage(); const errors = [],requests=[]; let releaseSong,releaseStatus;
  if(parserIncludes){page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(5000);}
  let nativeQueue=Promise.resolve();
  if(nativeSizing)await page.exposeFunction('__applyHostSize',(width,height)=>{
    nativeQueue=nativeQueue.then(async()=>{
      if(page.isClosed())return;
      const start=page.viewportSize();
      for(const fraction of hostSteps?[.3,.6,1]:[1]){
        await page.setViewportSize({width:width||start.width,height:Math.round(start.height+(height-start.height)*fraction)});
        if(hostSteps)await new Promise(resolve=>setTimeout(resolve,25));
      }
    });
    return nativeQueue;
  });
  // Ressourcenhinweise führen keine Module aus und gehören nicht zum ausführenden Fensterladeplan.
  page.on('request',request=>{if(!/prefetch/.test(request.headers()['sec-purpose']||request.headers().purpose||''))requests.push(request.url());});
  const songGate = new Promise(resolve => { releaseSong = resolve; });
  const statusGate = new Promise(resolve => { releaseStatus = resolve; });
  let releaseLayout;
  const layoutGate = new Promise(resolve => { releaseLayout = resolve; });
  let loadingSnapshot = null;
  page.on('pageerror', error => errors.push(error.message));
  if (clock) { await page.clock.install(); }
  await page.addInitScript(({ state, throwingPlay, k3, realAudio, activityAudio, savedVolume, parserIncludes, nativeSizing, screenHeight }) => {
    if(savedVolume!==undefined){localStorage.setItem('mischwerk.volume.v1',String(savedVolume));}
    window.__sizeStates=[];
    if(screenHeight!==undefined||nativeSizing)Object.defineProperty(screen,'availHeight',{configurable:true,get(){
      return nativeSizing&&window.__sizes.length?innerHeight:(screenHeight??1080);
    }});
    window.__slashCommands = []; window.__sent = []; window.__handlers = {}; window.__rejects = []; window.__adRejects = []; window.__adPlays = []; window.__sizes = []; window.__inclusions = [];
    window.__emit = (type, data) => (window.__handlers[type] || []).forEach(callback => callback({ type, data }));
    window.Client = {
      pageData: state,
      includeCSS(file) {
        window.__inclusions.push({file,readyState:document.readyState});
        if(parserIncludes){document.write('<link rel="stylesheet" href="'+file+'">');return;}
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = file; document.head.appendChild(link);
      },
      includeJS(file) {
        window.__inclusions.push({file,readyState:document.readyState});
        if(parserIncludes){document.write('<script src="'+file+'"></scr'+'ipt>');return;}
        const script = document.createElement('script'); script.src = file; (document.body||document.head).appendChild(script);
      },
      sendEvent(type, data) { window.__sent.push({ type, data }); },
      executeSlashCommand(command) { window.__slashCommands.push({command,at:Date.now()}); },
      addEventListener(type, callback) { (window.__handlers[type] || (window.__handlers[type] = [])).push(callback); },
      getHostFrame() { return { setTitle() {}, setResizable() {}, setSize(width, height) { window.__sizes.push([width, height]);
        window.__sizeStates.push({width,height,visible:document.documentElement.classList.contains('mw-ready')});
        if(nativeSizing)window.__applyHostSize(width,height).catch(()=>{});
      } }; }, isK3Client() { return k3; }
    };
    window.__contexts=[];
    window.AudioContext=window.webkitAudioContext=function(){window.__contexts.push('unexpected');throw new Error('Keine Audioanalyse vorgesehen');};
    if(realAudio){return;}
    if(activityAudio){
      const states=new WeakMap();function media(node){if(!states.has(node))states.set(node,{paused:true,began:Date.now()});return states.get(node);}
      Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{configurable:true,get(){const s=media(this);return s.paused?0:(Date.now()-s.began)/1000;}});
      Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return media(this).paused;}});
      Object.defineProperty(HTMLMediaElement.prototype,'readyState',{configurable:true,get(){return media(this).paused?0:4;}});
      HTMLMediaElement.prototype.load=function(){};
      HTMLMediaElement.prototype.pause=function(){media(this).paused=true;};
      HTMLMediaElement.prototype.play=function(){Object.assign(media(this),{paused:false,began:Date.now()});this.dispatchEvent(new Event('playing'));return Promise.resolve();};
      return;
    }
    HTMLMediaElement.prototype.load = function () {};
    const paused=new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return paused.get(this)!==false;}});
    HTMLMediaElement.prototype.pause = function () {paused.set(this,true);};
    HTMLMediaElement.prototype.play = function () {
      paused.set(this,false);
      if(this.id==='curtain-audio'){
        window.__adPlays.push({src:this.src,volume:this.volume,muted:this.muted});
        return new Promise((resolve,reject)=>window.__adRejects.push(reject));
      }
      if (throwingPlay) { throw new Error('Playback not supported'); }
      return new Promise((resolve, reject) => window.__rejects.push(reject));
    };
  }, { state, throwingPlay, k3, realAudio, activityAudio, savedVolume, parserIncludes, nativeSizing, screenHeight });
  if(realAudio){
    const body=require('../fixtures/audio.cjs').audioFixture();
    await page.route('https://stream.example.com/test-radio',route=>{
      const match=(route.request().headers().range||'').match(/bytes=(\d+)-(\d*)/);
      const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),body.length-1):body.length-1;
      return route.fulfill({status:match?206:200,contentType:'audio/wav',headers:{
        'Access-Control-Allow-Origin':cors?'*':'https://not-allowed.test','Accept-Ranges':'bytes',
        ...(match?{'Content-Range':'bytes '+start+'-'+end+'/'+body.length}:{})
      },body:body.subarray(start,end+1)});
    });
  }
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current', async route => {
    if (delayedSong) { await songGate; }
    await route.fulfill({ json: radioSong({title:'Testtitel',artist:'Testinterpret'}) });
  });
  await page.route(/^https:\/\/stats\.example\.com\/widget\/radio\/[a-z0-9-]+\/listener$/, route =>
    route.fulfill({ json: { listener_count: 12 } }));
  await page.route(/^https:\/\/stats\.example\.com\/widget\/radio\/[a-z0-9-]+$/,async route=>{
    if(delayedStatus){await statusGate;}
    await route.fulfill({json:{slug:new URL(route.request().url()).pathname.split('/').pop(),stream_status:providerStatus,status:'active',live:null}});
  });
  await page.route('http://mischwerk.test/**', async route => {
    const url = new URL(route.request().url());
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const absolute = path.resolve(browserSource, file);
    if (!absolute.startsWith(browserSource + path.sep) || !fs.existsSync(absolute)) { await route.fulfill({ status: 404 }); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' };
    if(file.endsWith('.mp3')){
      const body=fs.readFileSync(absolute),match=(route.request().headers().range||'').match(/bytes=(\d+)-(\d*)/);
      const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),body.length-1):body.length-1;
      return route.fulfill({status:match?206:200,contentType:'audio/mpeg',headers:{'Accept-Ranges':'bytes',
        ...(match?{'Content-Range':'bytes '+start+'-'+end+'/'+body.length}:{})},body:body.subarray(start,end+1)});
    }
    const delayedFile=loadingDelay==='module'?({studio:'js/studio/queue.js',team:'js/team/management.js'}[view]||'js/radio/player.js'):
      loadingDelay==='stylesheet'?({studio:'css/studio.css',team:'css/team.css',wishes:'css/wishbox.css'}[view]||'css/radio-surface.css'):
      ({css:'css/foundation.css',parallel:'css/foundation.css',script:'js/start.js',logo:'img/mischwerk-logo.png',actions:'css/radio-actions.css'}[loadingDelay]);
    if (delayedFile&&file===(delayedFile.startsWith('img/')?delayedFile:deliveredFile(view,delayedFile))) { await layoutGate; }
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(absolute) });
  });
  const metadataRequested=station&&view==='radio'&&!delayedStatus&&providerStatus!=='stopped'?page.waitForRequest('https://stats.example.com/widget/radio/test-radio/track/current'):null;
  const navigation = page.goto('http://mischwerk.test/');
  if (loadingDelay) {
    await page.locator('#radio-placeholder, #radio-panel').first().waitFor({ state: 'attached' });
    if (loadingDelay === 'parallel') { await page.waitForFunction(() => window.__sent.some(event => event.type === 'mw:ready')); }
    if (loadingDelay === 'logo') { await page.waitForFunction(station => document.documentElement.classList.contains('mw-ready') &&
      (!station || !document.getElementById('play-button').disabled), station); }
    if (loadingPause) { await page.waitForTimeout(loadingPause); }
    loadingSnapshot = await page.evaluate(() => ({
      background: getComputedStyle(document.documentElement).backgroundColor,
      visibility: getComputedStyle(document.getElementById('radio-panel') || document.getElementById('radio-placeholder')).visibility,
      sizes: window.__sizes.slice(), initialized: document.documentElement.classList.contains('mw-ready'),
      playEnabled: !!document.getElementById('play-button') && !document.getElementById('play-button').disabled,
      readyEvents: window.__sent.filter(event => event.type === 'mw:ready').length,
      acknowledgements: window.__sent.filter(event => event.type === 'mw:ackRequest').length
    }));
    releaseLayout();
  }
  await navigation;
  await page.waitForFunction(() => window.__sent.some(event => event.type === 'mw:ready')).catch(error => {
    throw new Error('Frontendstart fehlgeschlagen: ' + (errors.join('; ') || error.message));
  });
  if(metadataRequested){await metadataRequested;}
  if(station&&view==='radio'&&!delayedStatus){await page.waitForFunction(()=>document.getElementById('stream-label').textContent!=='Prüfe …');}
  return { page, state, errors, requests, releaseSong, releaseStatus, loadingSnapshot };
}

function radioHeight() { return 160; }
async function showStudioPane(page, queue) {
  if (!await page.locator(queue ? '#studio-requests' : '#studio-setup').isVisible()) {
    await page.locator(queue ? '#studio-queue-tab' : '#studio-programme-tab').click();
  }
}

async function historySetup(t, respond, when = '2026-11-03T12:00:00Z') {
  const lab = await setup(t,{view:'studio',station:true,clock:true,viewport:{width:820,height:660}});
  await lab.page.clock.setSystemTime(new Date(when));
  const source = 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json';
  await lab.page.route(source, respond);
  lab.state.station = {...lab.state.station,historyUrl:source,historyIgnoredTitles:['Mischwerk dein Radio','Dein Mix auf Mischwerk'],allowedHosts:[...lab.state.station.allowedHosts,'mischwerk.spcast.eu']};
  await lab.page.evaluate(state=>__emit('mw:state',{...state,revision:2}),lab.state);
  return {...lab,source};
}
const historyRow = (time, song) => ({timestamp:Date.parse(time)/1000,metadata:{song}});

test('Historienzugriff bleibt Hörern, Channelmoderatoren und Appmanagern auch bei direkten Reiteraufrufen versperrt',async t=>{
  for(const role of ['listener','channelModerator','manager']){
    const {page,state,requests,errors}=await setup(t,{role,view:'studio',station:true,clock:true});
    assert.equal(Object.hasOwn(state.station,'historyUrl'),false);assert.equal(state.user.canModerate,false);
    assert.equal(await page.locator('#studio-history-tab').isVisible(),false);
    await page.locator('#studio-history-tab').evaluate(n=>n.click());
    await page.clock.runFor(60000);
    assert.equal(await page.locator('#history-panel').isVisible(),false);assert.equal(await page.locator('#history-list li').count(),0);
    assert.equal(requests.some(url=>url.includes('/sp/cache/history/')),false);assert.deepEqual(errors,[]);
  }
  const listener=await setup(t,{role:'listener',view:'schedule'});
  assert.equal(await listener.page.locator('#schedule-panel').isVisible(),true);
  assert.equal(await listener.page.locator('#studio-history-tab').count(),0,'Der Kalender-Ladeplan enthält keine Historienoberfläche');
});

test('Rechteverlust bricht die Moderationshistorie ab, leert Titel und Seiten und verwirft die späte Antwort',async t=>{
  let calls=0,release;const gate=new Promise(resolve=>{release=resolve;});
  const {page,state,requests,errors}=await historySetup(t,async route=>{
    calls++;if(calls===2){await gate;return route.fulfill({json:[historyRow('2026-11-03T11:30:00Z','Verspäteter privater Titel')]}).catch(()=>{});}
    return route.fulfill({json:[historyRow('2026-11-03T11:00:00Z',calls===1?'Bisher geladener Titel':'Frisch nach Ernennung')]});
  });
  try{
    await page.locator('#studio-history-tab').click();await page.locator('#history-list li').waitFor();
    await page.locator('#history-refresh').click();await page.waitForFunction(()=>document.getElementById('history-refresh').disabled);
    await page.evaluate(state=>__emit('mw:state',{...state,revision:3,user:{...state.user,canModerate:false}}),state);
    assert.equal(await page.locator('#studio-history-tab').isVisible(),false);assert.equal(await page.locator('#history-list li').count(),0);
    assert.equal(await page.locator('#history-panel').isVisible(),false);
    release();await page.waitForTimeout(50);const before=requests.length;
    await page.locator('#studio-history-tab').evaluate(n=>n.click());await page.clock.runFor(60000);
    assert.equal(requests.length,before);assert.equal(await page.locator('#history-list li').count(),0);
    await page.evaluate(state=>__emit('mw:state',{...state,revision:4}),state);
    assert.equal(await page.locator('#history-panel').isVisible(),false);
    await page.locator('#studio-history-tab').click();await page.locator('#history-list li span').filter({hasText:'Frisch nach Ernennung'}).waitFor();
    assert.equal(await page.locator('#history-list li').count(),1);assert.deepEqual(errors,[]);
  }finally{release();}
});
test('Tageshistorie zeigt heute nach Senderzeit, erhält Wiederholungen und stellt Fremdtexte sicher dar', async t => {
  const entries = Array.from({length:9},(_,i)=>historyRow('2026-11-03T10:0'+i+':00Z','Band – Titel '+i));
  entries.push(entries[0],historyRow('2026-11-03T11:00:00Z','Band – Titel 0'),
    historyRow('2026-11-03T11:30:00Z','<img src=x onerror=alert(1)>'),historyRow('2026-11-02T22:59:59Z','Gestern'),
    historyRow('2026-11-03T13:00:00Z','Noch nicht gespielt'),historyRow('2026-11-03T10:00:00Z','Unknown'));
  const {page,state,requests,source,errors}=await historySetup(t,r=>r.fulfill({json:entries}));
  assert.equal(requests.includes(source),false);
  await page.locator('#studio-history-tab').click();await page.locator('#history-list li').first().waitFor();
  const sizes=await page.evaluate(()=>__sizes.slice());
  assert.ok((await page.locator('#history-list li').count())>0 && (await page.locator('#history-list li').count())<=entries.length);
  assert.equal(await page.locator('#history-list li').first().textContent(),'12:30:00<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#history-list img').count(),0);
  assert.equal(await page.locator('#history-heading').textContent(),'Heute · 03.11.2026');
  assert.equal(await page.locator('#studio-programme').isVisible(),false);
  const calendarReads=await page.evaluate(()=>__sent.filter(e=>e.type==='mw:schedule.get').length);
  await page.evaluate(state=>__emit('mw:state',{...state,revision:3}),state);
  assert.equal(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:schedule.get').length),calendarReads);
  assert.equal(await page.locator('#history-next').isDisabled(),true,'Auf der neuesten Seite gibt es zeitlich kein Weiter');
  assert.equal(await page.locator('#history-previous').isDisabled(),false,'Zurück führt zu älteren Titeln');
  const numbering=async()=> (await page.locator('#history-page').textContent()).match(/\d+/g).map(Number);
  const [latestPage,totalPages]=await numbering();
  assert.ok(totalPages>1);
  assert.equal(latestPage,totalPages,'Beim Öffnen liegen die neuesten Titel auf der letzten Seite');
  const latest=await page.locator('#history-list time').first().getAttribute('datetime');
  const newestTexts=await page.locator('#history-list li span').allTextContents();
  await page.locator('#history-previous').click();
  assert.deepEqual(await numbering(),[totalPages-1,totalPages],'Zurück zählt in Richtung Seite 1');
  assert.ok(Date.parse(await page.locator('#history-list time').first().getAttribute('datetime'))<Date.parse(latest),'Zurück verringert die angezeigte Uhrzeit');
  await page.locator('#history-next').click();
  assert.deepEqual(await numbering(),[totalPages,totalPages],'Weiter zählt wieder zur neuesten letzten Seite');
  assert.equal(await page.locator('#history-list time').first().getAttribute('datetime'),latest,'Weiter führt wieder zu neueren Uhrzeiten');
  assert.deepEqual(await page.locator('#history-list li span').allTextContents(),newestTexts);
  const texts=[...(await page.locator('#history-list li span').allTextContents())];
  while(!await page.locator('#history-previous').isDisabled()) { await page.locator('#history-previous').click();texts.push(...await page.locator('#history-list li span').allTextContents()); }
  assert.equal(await page.locator('#history-next').isDisabled(),false,'Auf der ältesten Seite führt Weiter wieder zu neueren Titeln');
  assert.deepEqual(await numbering(),[1,totalPages],'Die ältesten Titel liegen auf Seite 1');
  assert.equal(texts.filter(text=>text==='Band – Titel 0').length,2);
  assert.ok(!texts.some(text=>['Gestern','Noch nicht gespielt','Unknown'].includes(text)));
  for(const width of [320,390,820]){
    await page.setViewportSize({width,height:660});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    for(const control of await page.locator('#history-panel button:visible').all())await control.scrollIntoViewIfNeeded();
  }
  await validDialogSizes(page);
  await page.locator('#studio-history-tab').focus();await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#studio-requests').isVisible(),true);
  assert.equal(await page.locator('#studio-queue-tab').evaluate(n=>n===document.activeElement),true);
  assert.deepEqual(errors,[]);
});
test('Tageshistorie blendet konfigurierte Senderjingles aus und erhält ähnliche Musiktitel unverändert',async t=>{
  let entries=['Mischwerk dein Radio','  MISCHWERK  dein\tRadio  ','Dein Mix auf Mischwerk','dein mix auf mischwerk',
    'GAYLE - abcdefu','Cher - Believe','The Black Eyed Peas - I Gotta Feeling','Band - Dein Mix auf Mischwerk'].map((text,i)=>historyRow('2026-11-03T10:0'+i+':00Z',text));
  const {page,state,errors}=await historySetup(t,r=>r.fulfill({json:entries}));
  await page.locator('#studio-history-tab').click();await page.locator('#history-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.deepEqual(await page.locator('#history-list li span').allTextContents(),
    ['Band - Dein Mix auf Mischwerk','The Black Eyed Peas - I Gotta Feeling','Cher - Believe','GAYLE - abcdefu']);
  assert.equal(await page.locator('#history-list time').last().textContent(),'11:04:00');
  assert.equal(await page.locator('#history-pagination').isVisible(),false);
  await page.evaluate(state=>__emit('mw:state',{...state,revision:3,station:{...state.station,historyIgnoredTitles:[]}}),state);
  await page.locator('#history-refresh:not([disabled])').waitFor();
  assert.equal(await page.locator('#history-count').textContent(),'8 Titelmeldungen heute');
  await page.setViewportSize({width:820,height:800});await studioSettle(page);
  assert.ok(await page.locator('#history-list li').count()>6,'Verfügbarer Platz ersetzt die frühere Sechsergrenze');
  await page.evaluate(state=>__emit('mw:state',{...state,revision:4}),state);await page.locator('#history-refresh:not([disabled])').waitFor();
  assert.equal(await page.locator('#history-list li').count(),4);
  entries=entries.slice(0,4);await page.locator('#history-refresh').click();
  await page.locator('#history-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(await page.locator('#history-list li').count(),0);assert.equal(await page.locator('#history-empty').isVisible(),true);
  assert.deepEqual(errors,[]);
});

test('Historie passt ihre Seiten ohne Scrollen an den Overlayrahmen an und erhält extrem lange Titel vollständig',async t=>{
  const longTitle=('Band – Sehr langer Titel 🎵 mit unverändertem Text. ').repeat(35);
  const entries=[historyRow('2026-11-03T11:59:00Z',longTitle),...Array.from({length:10},(_,i)=>historyRow('2026-11-03T10:'+String(i).padStart(2,'0')+':00Z','Band – Titel '+i))];
  const {page,errors}=await historySetup(t,r=>r.fulfill({json:entries}));
  await page.locator('#studio-history-tab').click();await page.locator('#history-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  for(const [width,height] of [[820,660],[390,480],[320,400]]){
    await page.setViewportSize({width,height});
    let guard=0;while(!await page.locator('#history-next').isDisabled()){
      assert.ok(guard++<100,JSON.stringify(await page.evaluate(()=>({width:innerWidth,height:innerHeight,page:document.getElementById('history-page').textContent,list:document.getElementById('history-list').clientHeight,header:document.querySelector('.dialog-header').getBoundingClientRect().height}))));await page.locator('#history-next').click();
    }
    const recovered=new Map();guard=0;
    for(;;){
      const geometry=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,controls:document.getElementById('history-pagination').getBoundingClientRect().bottom,
        shell:document.querySelector('.dialog-shell').getBoundingClientRect().bottom,body:document.body.getBoundingClientRect().bottom,
        list:document.getElementById('history-list').getBoundingClientRect().height}));
      assert.ok(geometry.height<=height+1,JSON.stringify({width,height,...geometry}));assert.ok(geometry.width<=width);
      assert.ok(geometry.controls<=height+1);
      for(const row of await page.locator('#history-list li').evaluateAll(nodes=>nodes.map(n=>({key:n.querySelector('time').dateTime,text:n.querySelector('span').textContent})))){
        recovered.set(row.key,(recovered.get(row.key)||'')+row.text);
      }
      if(await page.locator('#history-previous').isDisabled())break;
      assert.ok(guard++<100);await page.locator('#history-previous').click();
    }
    assert.equal(recovered.size,entries.length);for(const row of entries)assert.equal(recovered.get(new Date(row.timestamp*1000).toISOString()),row.metadata.song);
  }
  await page.locator('#studio-programme-tab').click();assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('history-open')),false);
  assert.deepEqual(errors,[]);
});

test('Tageshistorie behält heutige Daten bei Abruffehlern, begrenzt Anfragen und beendet sie im Hintergrund',async t=>{
  let broken=false,count=0;
  const {page,state,errors}=await historySetup(t,r=>{count++;return broken?r.fulfill({status:503,body:'unavailable'}):r.fulfill({json:[historyRow('2026-11-03T11:00:00Z','Mein Titel')]});});
  await page.locator('#studio-history-tab').click();await page.locator('#history-list li').waitFor();
  broken=true;await page.locator('#history-refresh').click();
  await page.locator('#history-feedback').filter({hasText:'nicht erreichbar'}).waitFor();
  assert.equal(await page.locator('#history-list li span').textContent(),'Mein Titel');const before=count;
  await page.clock.runFor(59000);assert.equal(count,before);
  broken=false;await page.clock.runFor(1001);await page.locator('#history-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(count,before+1);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=count;await page.clock.runFor(120000);assert.equal(count,hidden);
  await page.evaluate(state=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});__emit('mw:state',{...state,revision:3});document.dispatchEvent(new Event('visibilitychange'));},state);
  await page.locator('#history-refresh:not([disabled])').waitFor();assert.equal(count,hidden+1);assert.deepEqual(errors,[]);
});
test('Tageshistorie entfernt gestern um Mitternacht und zeigt neue heutige Meldungen ohne alte Daten',async t=>{
  const entries=[historyRow('2026-11-03T22:59:00Z','Vor Mitternacht'),historyRow('2026-11-03T23:00:00Z','Neuer Tag')];
  const {page,errors}=await historySetup(t,r=>r.fulfill({json:entries}),'2026-11-03T22:59:58Z');
  await page.locator('#studio-history-tab').click();await page.locator('#history-list li').waitFor();
  assert.equal(await page.locator('#history-list li span').textContent(),'Vor Mitternacht');
  await page.clock.runFor(3000);await page.locator('#history-heading').filter({hasText:'04.11.2026'}).waitFor();
  await page.locator('#history-list li span').filter({hasText:'Neuer Tag'}).waitFor();
  assert.equal(await page.locator('#history-list li').count(),1);assert.equal(await page.locator('#history-list time').textContent(),'00:00:00');
  assert.deepEqual(errors,[]);
});
test('Tageshistorie bricht beim Reiterwechsel ab und übernimmt keine verspätete alte Antwort',async t=>{
  let release,first=true;
  const {page,errors}=await historySetup(t,async r=>{
    if(first){first=false;await new Promise(resolve=>{release=resolve;});return r.fulfill({json:[historyRow('2026-11-03T11:00:00Z','Alte Antwort')]}).catch(()=>{});}
    return r.fulfill({json:[historyRow('2026-11-03T11:30:00Z','Aktuelle Antwort')]});
  });
  try{
    await page.locator('#studio-history-tab').click();await page.waitForFunction(()=>document.getElementById('history-refresh').disabled);
    await page.locator('#studio-programme-tab').click();await page.locator('#studio-history-tab').click();
    await page.locator('#history-list li span').filter({hasText:'Aktuelle Antwort'}).waitFor();release();
    await page.waitForTimeout(50);assert.equal(await page.locator('#history-list li span').textContent(),'Aktuelle Antwort');assert.deepEqual(errors,[]);
  }finally{if(release)release();}
});
test('Tageshistorie zeigt bei leeren Providerdaten keine Platzhalter als gespielte Lieder',async t=>{
  const {page,errors}=await historySetup(t,r=>r.fulfill({json:[historyRow('2026-11-03T10:00:00Z','Unknown'),historyRow('2026-11-03T11:00:00Z','')]}));
  await page.locator('#studio-history-tab').click();await page.locator('#history-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(await page.locator('#history-list li').count(),0);assert.equal(await page.locator('#history-empty').isVisible(),true);assert.deepEqual(errors,[]);
});

for (const view of ['studio','team']) {
  const button=view==='studio'?'#refresh-queue':'#refresh-radio-team';
  const feedback=view==='studio'?'#queue-refresh-feedback':'#team-refresh-feedback';
  test(view+': Aktualisieren bestätigt unveränderte Daten, sperrt Doppelklicks und erhält Maße/Fokus/Entwurf',async t=>{
    for(const width of [320,780]) {
      const {page,state,errors}=await setup(t,{view,clock:true,viewport:{width,height:900}});
      const draft=view==='studio'?'#studio-topic':'#radio-moderator-nick';
      await page.locator(draft).fill('Mein Entwurf');
      if(view==='studio' && await page.locator('#studio-queue-tab').isVisible())await page.locator('#studio-queue-tab').click();
      await page.clock.runFor(150);
      const before=await page.locator('.dialog-shell').boundingBox();
      await page.locator(button+' svg').click();
      const request=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:refresh'));
      assert.match(request.data.requestId,/^refresh-/);
      assert.match(await page.locator(feedback).textContent(),/Aktualisiere/);
      assert.equal(await page.locator(button).getAttribute('aria-busy'),'true');
      await page.locator(button).evaluate(b=>{b.click();b.click();});
      assert.equal(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:refresh').length),1);
      await page.evaluate(({state,id})=>__emit('mw:state',{...state,refreshRequestId:id}),{state,id:request.data.requestId});
      assert.match(await page.locator(feedback).textContent(),/Aktualisiert · \d\d:\d\d/);
      assert.equal(await page.locator(button).getAttribute('aria-busy'),null);
      assert.equal(await page.locator(button).evaluate(b=>b===document.activeElement),true);
      assert.equal(await page.locator(draft).inputValue(),'Mein Entwurf');
      await page.clock.runFor(150);
      assert.deepEqual(await page.locator('.dialog-shell').boundingBox(),before);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.deepEqual(errors,[]);
    }
  });
  test(view+': Fehlende/alte Antworten melden Fehler, Wiederholung und Tastatur funktionieren',async t=>{
    const {page,state,errors}=await setup(t,{view,clock:true});
    if(view==='studio' && await page.locator('#studio-queue-tab').isVisible())await page.locator('#studio-queue-tab').click();
    await page.locator(button).focus();await page.keyboard.press('Enter');
    const first=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:refresh').data.requestId);
    await page.evaluate(s=>{__emit('mw:state',{...s,revision:3});__emit('mw:state',{...s,revision:2,refreshRequestId:__sent.findLast(e=>e.type==='mw:refresh').data.requestId});},state);
    assert.equal(await page.locator(button).getAttribute('aria-busy'),'true','Fremder Push und veraltete Daten bestätigen nicht');
    await page.clock.runFor(15001);
    assert.match(await page.locator(feedback).textContent(),/Keine Antwort/);
    await page.keyboard.press('Space');
    const second=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:refresh').data.requestId);assert.notEqual(second,first);
    await page.evaluate(({s,id})=>__emit('mw:state',{...s,revision:3,refreshRequestId:id}),{s:state,id:first});
    assert.equal(await page.locator(button).getAttribute('aria-busy'),'true','Verspätete erste Antwort bestätigt keinen zweiten Versuch');
    await page.evaluate(id=>__emit('mw:result',{action:'mw:refresh',requestId:id,ok:false,message:'Bitte erneut aktualisieren.'}),second);
    assert.match(await page.locator(feedback).textContent(),/Nicht aktualisiert/);
    await page.clock.runFor(66000);
    assert.equal(await page.locator(button).isEnabled(),true,'Wiederverbindung bleibt erreichbar');
    await page.locator(button).click();
    await page.evaluate(s=>__emit('mw:state',{...s,revision:3,refreshRequestId:__sent.findLast(e=>e.type==='mw:refresh').data.requestId}),state);
    assert.match(await page.locator(feedback).textContent(),/Aktualisiert/);
    await page.evaluate(()=>{Client.sendEvent=()=>{throw Error('unterbrochen');};});
    await page.locator(button).click();
    assert.match(await page.locator(feedback).textContent(),/Verbindung fehlt/);
    assert.equal(await page.locator(button).getAttribute('aria-busy'),null);
    assert.deepEqual(errors,[]);
  });
}
async function validDialogSizes(page) {
  const sizes=await page.evaluate(()=>window.__sizes);
  if(await page.locator('html').getAttribute('data-view')==='studio'){assert.ok(sizes.every(([w,h])=>w>0&&h>=20&&h<=1000));}else assert.deepEqual(sizes,[], 'Andere Verwaltungsfenster behalten ihre festen Maße');
}

test('Moderationshöhe wächst bei mehr Inhalt, schrumpft wieder und bleibt beim Lesen langer Textseiten stabil',async t=>{
  for(const k3 of [true,false]){
    const {page,state,errors}=await setup(t,{view:'studio',k3,nativeSizing:true,hostSteps:true,viewport:{width:780,height:730}});
    await page.waitForTimeout(250);const empty=page.viewportSize().height;assert.ok(empty<650);
    const active={...state,revision:2,moderator:{nick:'Otterchen',since:state.serverTime,expiresAt:state.serverTime+3600000,sessionKey:'compact'},user:{...state.user,isOnAir:true,canEndModeration:true}};
    await page.evaluate(s=>__emit('mw:state',s),active);await page.waitForTimeout(250);
    assert.ok(page.viewportSize().height>empty&&page.viewportSize().height<=730);
    const text=('Ein vollständiger Musikwunsch mit Originaltext 🎵. ').repeat(7).slice(0,300);
    const item={id:71,text,nick:'Hörer',createdAt:state.serverTime,stage:'queued'};
    await page.evaluate(({s,item})=>__emit('mw:state',{...s,revision:3,queue:[item],queueWindow:[item],queueStart:0,queueTotal:1,page:0,pages:1}),{s:active,item});
    await page.locator('#studio-queue-tab').click();await page.waitForTimeout(250);
    await page.setViewportSize({width:320,height:page.viewportSize().height});await page.waitForTimeout(250);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>innerHeight===window.__sizes.at(-1)[1]);await studioSettle(page);
    await page.waitForFunction(()=>innerHeight===window.__sizes.at(-1)[1]);
    const height=page.viewportSize().height,requests=await page.evaluate(()=>__sizes.length);assert.equal(await readStudioText(page,'.request-text'),text);
    assert.equal(await page.evaluate(()=>__sizes.length),requests,'Lesen erzeugt keinen neuen Größenauftrag');
    await page.waitForTimeout(250);assert.equal(page.viewportSize().height,height,'Kurze letzte Textseite verkürzt das Fenster nicht weiter');
    await studioFits(page);assert.deepEqual(errors,[]);
  }
});

test('Themenbearbeitung behält beim Tippen, Speichern, Fehler und Verwerfen dieselbe Overlaygeometrie',async t=>{
  for(const width of [780,320])for(const k3 of [true,false]){
    const {page,state,errors}=await setup(t,{view:'studio',k3,nativeSizing:true,hostSteps:true,viewport:{width,height:730}});
    await page.waitForTimeout(500);await revealStudio(page,'#studio-topic');await page.waitForTimeout(200);
    const geometry=()=>page.evaluate(()=>({size:[innerWidth,innerHeight],requests:__sizes.length,
      boxes:['.dialog-header','#studio-programme-tabs','#studio-topic','#save-topic','.studio-topic-section','.wishes-control-card'].map(selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
      }),scroll:[document.documentElement.scrollTop,document.getElementById('studio-setup').scrollTop]}));
    const before=await geometry();
    async function unchanged(phase){await page.waitForTimeout(180);assert.deepEqual(await geometry(),before,phase+' bei '+width+' px / '+(k3?'K3':'STAPP'));}
    await page.locator('#studio-topic').focus();await unchanged('Fokus');
    await page.locator('#studio-topic').pressSequentially('Musik zum Feierabend',{delay:10});await unchanged('Eingabe');
    assert.equal(await page.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);
    await page.locator('#studio-topic').fill('N'.repeat(80));await unchanged('80 Zeichen');
    await page.locator('#save-topic').click();await unchanged('Speichern läuft');
    let request=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:setTopic'));
    await page.evaluate(r=>__emit('mw:result',{action:r.type,requestId:r.data.requestId,ok:false,message:'Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.'}),request);
    await unchanged('Fehlerantwort');
    await page.locator('#save-topic').click();request=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:setTopic'));
    await page.evaluate(({r,s})=>{__emit('mw:result',{action:r.type,requestId:r.data.requestId,ok:true,message:'Thema gespeichert.'});__emit('mw:state',{...s,revision:2,topic:r.data.topic});},{r:request,s:state});
    await unchanged('Bestätigtes Speichern');
    await page.locator('#studio-topic').fill('');await unchanged('Leeren');await page.locator('#reset-topic').click();await unchanged('Verwerfen');
    await studioFits(page);assert.deepEqual(errors,[]);await page.context().close();
  }
});

test('Moderation misst ihre kompakte Höhe erst nach verzögertem CSS',async t=>{
 for(const k3 of [true,false]){const {page,state,errors,loadingSnapshot}=await setup(t,{view:'studio',k3,nativeSizing:true,hostSteps:true,loadingDelay:'stylesheet',loadingPause:120,viewport:{width:780,height:600}});assert.deepEqual(loadingSnapshot.sizes,[]);await page.waitForTimeout(400);await page.evaluate(s=>__emit('mw:state',{...s,revision:s.revision+1}),state);await validDialogSizes(page);assert.equal(page.viewportSize().width,780);assert.ok(page.viewportSize().height<=600);await page.locator('#studio-topic').fill('Nativer Rahmen');assert.equal(await page.locator('#studio-topic').inputValue(),'Nativer Rahmen');assert.deepEqual(errors,[]);}
});

test('Eine auslaufende Statusmeldung verschiebt die begonnene Themenbearbeitung auch nach dem Speichern nicht',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',nativeSizing:true,hostSteps:true,viewport:{width:780,height:730}});
  await page.locator('#on-air').click();const request=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:onAir'));
  await page.evaluate(({r,s})=>{__emit('mw:state',{...s,revision:2,moderator:{nick:'Otterchen',sessionKey:'editing',since:s.serverTime,expiresAt:s.serverTime+3600000},user:{...s.user,isOnAir:true,canEndModeration:true}});__emit('mw:result',{action:r.type,requestId:r.data.requestId,ok:true,message:'Studio-Anmeldung bestätigt.'});},{r:request,s:state});
  await page.waitForFunction(()=>{
    const target=window.__sizes.at(-1);return target&&innerWidth===target[0]&&innerHeight===target[1];
  });await page.locator('#studio-topic').focus();
  const geometry=()=>page.evaluate(()=>({size:[innerWidth,innerHeight],sizes:__sizes.length,rect:document.getElementById('studio-topic').getBoundingClientRect().toJSON()}));
  const before=await geometry();await page.locator('#studio-topic').fill('Meine Sendung');
  await page.waitForTimeout(6200);assert.deepEqual(await geometry(),before,'Ausblenden nach sechs Sekunden verschiebt die Eingabe nicht');
  await page.locator('#save-topic').click();const topic=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:setTopic'));
  await page.evaluate(r=>__emit('mw:result',{action:r.type,requestId:r.data.requestId,ok:true,message:'Thema gespeichert.'}),topic);
  await page.waitForTimeout(200);assert.deepEqual(await geometry(),before,'Auch nach Bestätigung bleibt die Geometrie erhalten');
  await page.locator('#studio-queue-tab').click();assert.equal(await page.locator('#notice').getAttribute('data-topic-reserved'),null,'Bewusster Bereichswechsel gibt den vorübergehend erhaltenen Platz frei');assert.deepEqual(errors,[]);
});

test('Anmeldung und lange Inhalte erhalten native Moderationsmaße, Entwurf und Fokus',async t=>{
 const {page,state,errors}=await setup(t,{view:'studio',nativeSizing:true,hostSteps:true,viewport:{width:780,height:600}});await page.locator('#studio-topic').fill('Mein Entwurf');await page.evaluate(s=>__emit('mw:state',{...s,revision:2,moderator:{nick:'Lange Moderation '.repeat(5),since:Date.now(),expiresAt:Date.now()+3600000,sessionKey:'native'},user:{...s.user,isOnAir:true,canEndModeration:true}}),state);assert.equal(await page.locator('#studio-topic').inputValue(),'Mein Entwurf');assert.equal(await page.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);await page.evaluate(s=>__emit('mw:state',{...s,revision:3}),state);await validDialogSizes(page);assert.equal(page.viewportSize().width,780);assert.ok(page.viewportSize().height<=600);assert.deepEqual(errors,[]);
});

test('Schmale Moderationsreiter verwenden denselben nativen Rahmen',async t=>{
 const {page,errors}=await setup(t,{view:'studio',nativeSizing:true,viewport:{width:320,height:600}});await page.locator('#studio-queue-tab').click();assert.equal(await page.locator('#studio-requests').isVisible(),true);await page.locator('#studio-programme-tab').click();await revealStudio(page,'#studio-topic');assert.equal(await page.locator('#studio-topic').isVisible(),true);await validDialogSizes(page);assert.equal(page.viewportSize().width,320);assert.ok(page.viewportSize().height<=600);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
});

test('Radio-Team öffnet direkt die Verwaltung und behält native Maße und Kopfposition',async t=>{
 for(const k3 of [true,false])for(const width of [320,560]){
  const {page,state,errors}=await setup(t,{view:'team',k3,nativeSizing:true,hostSteps:true,loadingDelay:'stylesheet',loadingPause:120,viewport:{width,height:560}});
  const before=await page.locator('.dialog-header').boundingBox();
  assert.equal(await page.locator('#dialog-title').textContent(),'Verwaltung');
  assert.ok(await page.locator('#dialog-title').evaluate(n=>{const r=document.createRange();r.selectNodeContents(n);const t=r.getBoundingClientRect(),h=n.closest('.dialog-header').getBoundingClientRect();return Math.abs(t.x+t.width/2-h.x-h.width/2)<1;}));
  assert.equal(await page.locator('#radio-moderator-form').isVisible(),true);
  assert.deepEqual(await page.locator('.team-tabs [role=tab]').allTextContents(),['Radio-Team','Bot-Texte']);
  await page.locator('#refresh-radio-team').click();
  await page.evaluate(s=>__emit('mw:state',{...s,revision:s.revision+1}),state);
  assert.deepEqual(await page.locator('.dialog-header').boundingBox(),before);
  assert.deepEqual(await page.evaluate(()=>__sizes),[]);
  assert.deepEqual(page.viewportSize(),{width,height:560});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
 }
});

test('Fensteröffnung: Moderation ist vor Sichtbarkeit eingeteilt, auch wenn das Logo verspätet lädt',async t=>{
  const {page,loadingSnapshot,errors}=await setup(t,{view:'studio',loadingDelay:'logo',loadingPause:150,initialRequest:true,viewport:{width:780,height:400}});
  assert.equal(loadingSnapshot.initialized,true);
  assert.ok(loadingSnapshot.sizes.length<=1,'Höchstens eine initiale Inhaltsmessung');
  assert.equal(await page.locator('#studio-programme-tabs [role=tab]').count(),3);
  assert.equal(await page.locator('#studio-programme-tab').isVisible(),true);
  await page.locator('#studio-queue-tab').click();
  await revealStudio(page,'[data-outcome=done]');
  assert.equal(await page.locator('[data-outcome=done]').isVisible(),true);
  assert.deepEqual(errors,[]);
});

test('Wunsch-Overlay löst beim Öffnen und Schließen keine zusätzliche Headergröße aus',async t=>{
  for(const k3 of [true,false])for(const width of [320,1200]){
    const {page,errors}=await setup(t,{k3,role:'listener',nativeSizing:true,hostSteps:true,viewport:{width,height:160}});
    if(!k3)await page.waitForFunction(()=>__sizes.length&&innerHeight===__sizes.at(-1)[1]);
    const sizes=await page.evaluate(()=>__sizes.slice()),height=page.viewportSize().height;
    for(let round=1;round<=3;round++){
      await page.locator('#open-wishes').click();
      await page.evaluate(id=>{const e=__sent.findLast(e=>e.type==='mw:openWishes');__emit('mw:wishes.open',{surfaceId:id});__emit('mw:result',{ok:true,action:e.type,requestId:e.data.requestId});},round);
      await page.evaluate(id=>__emit('mw:wishes.closed',{surfaceId:id}),round);
      await page.waitForTimeout(100);
      assert.deepEqual(await page.evaluate(()=>__sizes),sizes);assert.equal(page.viewportSize().height,height);
      assert.equal(await page.locator('#wishes-panel').isVisible(),false);
    }
    assert.deepEqual(errors,[]);
  }
});

test('Knuddels-Einbindung per document.write erhält den HTML-Aufbau in allen Fenstern',async t=>{
  for(const [view,role] of [['radio','owner'],['radio','listener'],['wishes','owner'],['studio','owner'],['team','owner'],['schedule','owner']]){
    const {page,errors}=await setup(t,{view,role,curtainClosed:true,parserIncludes:true,station:true});
    assert.equal(await page.title(),'MischWerk');
    assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('mw-ready')),true);
    assert.equal(await page.locator(view==='radio'?(role==='listener'?'#curtain-ad':'#play-button'):'#dialog-title').isVisible(),true);
    const inclusions=await page.evaluate(()=>window.__inclusions);
    assert.ok(inclusions.length>0&&inclusions.every(call=>call.readyState==='loading'),JSON.stringify(inclusions));
    assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:ready').length),1);
    assert.deepEqual(errors,[]);
  }
});
test('Fehlendes Startmodul meldet den Dateipfad sofort und erholt sich nach vollständiger Auslieferung',async t=>{
  const {page}=await setup(t,{station:true,clock:true});
  const missing='http://mischwerk.test/js/wishes/relay.js';
  await page.route(missing,route=>route.abort());
  await page.reload();
  assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('mw-ready')),false);
  assert.equal(await page.locator('#startup-error').isVisible(),true,'Ein fehlendes Pflichtmodul bleibt nicht 15 Sekunden stumm');
  assert.match(await page.locator('#startup-error').textContent(),/wishes\/relay\.js/);
  await page.clock.fastForward(15001);
  assert.equal(await page.locator('#startup-error').isVisible(),true);
  assert.match(await page.locator('#startup-error').textContent(),/vollständigen? App-Upload/);
  assert.equal(await page.locator('#play-button').count(),0,'Keine halbfertige bedienbare Oberfläche');
  await page.unroute(missing);
  await page.reload();
  await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  assert.equal(await page.locator('#startup-error').isVisible(),false);
  assert.equal(await page.locator('#play-button').isVisible(),true);
});

test('Fehlendes Pflichtstylesheet zeigt ohne CSS und ohne Nachladen sofort einen Starthinweis',async t=>{
 const {page}=await setup(t,{station:true,clock:true});
 await page.route('http://mischwerk.test/css/foundation.css',r=>r.abort());await page.reload();
 assert.equal(await page.locator('#startup-error').isVisible(),true,JSON.stringify(await page.evaluate(()=>({classes:document.documentElement.className,broken:startupBroken,ready:document.readyState,error:getComputedStyle(document.getElementById('startup-error')).cssText,links:[...document.querySelectorAll('link')].map(l=>({href:l.href,sheet:!!l.sheet}))}))));
 assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('mw-ready')),false);
 assert.equal(await page.locator('#radio-panel').isVisible(),false);
});

test('Fehler der SDK-Stylesheet-Einbindung kann den bereits registrierten Starthinweis nicht überspringen',async t=>{
 const {page}=await setup(t,{station:true,clock:true});
 const html=fs.readFileSync(path.join(browserSource,'index.html'),'utf8').replace('Client.includeCSS(file);',"throw new Error('Test: SDK CSS include failed');");
 await page.route('http://mischwerk.test/',r=>r.fulfill({contentType:'text/html',body:html}));await page.reload();
 assert.equal(await page.locator('#startup-error').isVisible(),true);
 assert.equal(await page.evaluate(()=>__sent.length),0,'Nach gescheiterter CSS-Einbindung startet keine halbfertige App');
 await page.unroute('http://mischwerk.test/');await page.reload();await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
 assert.equal(await page.locator('#startup-error').isVisible(),false);
});

test('Vorhang verhüllt nur die Radioleiste, lädt Werbung erst auf Klick und bleibt bis zur Freigabe geschlossen',async t=>{
  const {page,state,errors,requests}=await setup(t,{role:'listener',curtainClosed:true,station:true,viewport:{width:1360,height:160}});
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  assert.equal(await page.locator('#radio-panel').evaluate(n=>n.inert),true);
  assert.equal(await page.locator('#play-button').isVisible(),false);
  assert.equal(await page.locator('#curtain-audio').getAttribute('src'),null);
  assert.equal(requests.some(url=>url.includes('werbung.mp3')),false);
  for(const width of [1360,320]){
    await resizeViewport(page,{width,height:160});
    const box=await page.locator('#curtain-ad').boundingBox();
    assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=160,JSON.stringify(box));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(process.env.MISCHWERK_CURTAIN_SCREENSHOTS){
      fs.mkdirSync(process.env.MISCHWERK_CURTAIN_SCREENSHOTS,{recursive:true});
      await page.screenshot({path:path.join(process.env.MISCHWERK_CURTAIN_SCREENSHOTS,'Vorhang-'+width+'.png')});
    }
  }
  await page.locator('#curtain-ad').click();
  assert.equal(await page.locator('#curtain-audio').getAttribute('src'),'audio/werbung.mp3?v='+state.curtain.audioVersion);
  assert.equal(await page.evaluate(()=>window.__adPlays.length),1);
  assert.equal(await page.locator('#curtain-ad-label').textContent(),'Werbung stoppen');
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:setCurtain')),false);
  await page.locator('#curtain-audio').evaluate(n=>n.dispatchEvent(new Event('ended')));
  assert.equal(await page.locator('#curtain-ad-label').textContent(),'Werbung starten');
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  await page.locator('#curtain-ad').focus();
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,curtain:{...state.curtain,closed:false}}),state);
  assert.equal(await page.locator('#radio-panel').evaluate(n=>n.inert),false);
  assert.equal(await page.locator('#play-button').evaluate(n=>n===document.activeElement),true);
  await page.locator('#play-button').click();
  const source=await page.locator('#radio-audio').getAttribute('src');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3}),state);
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  assert.equal(await page.locator('#curtain-ad').evaluate(n=>n===document.activeElement),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),source,'Verhüllen unterbricht keine bereits gestartete Wiedergabe');
  await page.locator('#curtain-ad').click();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null,'Bewusster Werbeklick beendet Radio statt zwei Tonquellen zu mischen');
  assert.deepEqual(errors,[]);
});
test('Vorhangausnahmen bleiben erhalten; keine Rolle erhält einen Vorhangbutton',async t=>{
  for(const [role,nick,exempt] of [['owner','Otterchen',true],['listener','Polaroid',true],['owner','AndererInhaber',false]]){
    const {page,state,errors}=await setup(t,{role,nick,curtainClosed:true,station:true,viewport:{width:1360,height:160}});
    assert.equal(await page.locator('#radio-curtain').isVisible(),!exempt);
    assert.equal(await page.locator('#curtain-toggle').count(),0);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,curtain:{...state.curtain,closed:false}}),state);
    assert.equal(await page.locator('#radio-curtain').isVisible(),false);
    assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:setCurtain')),false);
    assert.deepEqual(errors,[]);
  }
});
test('Werbung respektiert Lautstärke und Mute, alte Startfehler greifen nicht in neue Wiedergaben ein',async t=>{
  const {page,errors}=await setup(t,{role:'listener',curtainClosed:true,savedVolume:.8});
  await page.locator('#radio-audio').evaluate(n=>{n.muted=true;n.dispatchEvent(new Event('volumechange'));});
  await page.locator('#curtain-ad').click();await page.locator('#curtain-ad').click();await page.locator('#curtain-ad').click();
  const plays=await page.evaluate(()=>window.__adPlays);
  assert.ok(plays.every(p=>p.volume<=.1&&p.muted));
  await page.evaluate(()=>window.__adRejects[0](new Error('veralteter Start')));
  assert.equal(await page.locator('#curtain-ad-label').textContent(),'Werbung stoppen');
  await page.evaluate(()=>window.__adRejects[1](new Error('aktueller Start')));
  await page.locator('#curtain-message.error').waitFor();
  assert.equal(await page.locator('#curtain-ad-label').textContent(),'Werbung starten');
  assert.equal(await page.locator('#curtain-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  await page.locator('#curtain-ad').click();
  await page.locator('#radio-audio').evaluate(n=>{n.volume=.04;n.muted=false;n.dispatchEvent(new Event('volumechange'));});
  assert.equal(await page.locator('#curtain-audio').evaluate(n=>n.volume),.04);
  assert.equal(await page.locator('#curtain-audio').evaluate(n=>n.muted),false);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await page.locator('#curtain-audio').getAttribute('src'),null);
  assert.deepEqual(errors,[]);
});
test('Eigene unveränderte Werbe-MP3 spielt nach Klick im nativen Audioelement',async t=>{
  const {page,requests,errors}=await setup(t,{role:'listener',curtainClosed:true,realAudio:true,viewport:{width:960,height:160}});
  assert.equal(requests.some(url=>url.includes('werbung.mp3')),false);
  await page.locator('#curtain-ad').click();
  await page.waitForFunction(()=>{const n=document.getElementById('curtain-audio');return !n.paused&&n.currentTime>0&&isFinite(n.duration);});
  const clip=await page.locator('#curtain-audio').evaluate(n=>({duration:n.duration,volume:n.volume}));
  assert.ok(clip.duration>42&&clip.duration<45,JSON.stringify(clip));assert.ok(clip.volume<=.1);
  assert.equal(await page.locator('#radio-curtain').isVisible(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  await page.locator('#curtain-ad').click();
  assert.equal(await page.locator('#curtain-audio').evaluate(n=>n.paused),true);
  assert.deepEqual(errors,[]);
});

test('Radio-Team entfernt Statuszentrale, Anbieterquellen und Prüftimer vollständig',async t=>{
 for(const k3 of [true,false]){
  const {page,state,requests,errors}=await setup(t,{view:'team',station:true,k3,clock:true,viewport:{width:560,height:630}});
  assert.equal(await page.locator('#radio-moderator-form').isVisible(),true);
  assert.equal(await page.locator('#team-status,#team-status-tab,#refresh-status,#status-details,.team-workspace').count(),0);
  assert.deepEqual(await page.locator('.team-tabs [role=tab]').allTextContents(),['Radio-Team','Bot-Texte']);
  assert.equal(await page.getByText('Statuszentrale',{exact:true}).count(),0);
  await page.locator('#radio-moderator-nick').fill('Mein Team-Entwurf');
  await page.evaluate(s=>__emit('mw:state',{...s,revision:2,moderator:{nick:'Langer Moderationsname'},queueTotal:8,topic:'Thema'}),state);
  await page.clock.runFor(61000);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(61000);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.evaluate(s=>__emit('mw:state',{...s,revision:3}),state);
  await page.locator('#refresh-radio-team').click();
  assert.equal(await page.evaluate(()=>__sent.at(-1).type),'mw:refresh');
  assert.equal(await page.locator('#radio-moderator-nick').inputValue(),'Mein Team-Entwurf');
  assert.equal(requests.some(u=>u.startsWith('https://stats.example.com/')||/\/(?:team\/status[^/]*\.js|radio\/api\.js|css\/team-status\.css)(?:\?|$)/.test(u)),false);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(errors,[]);
 }
});

test('Radio-Team bleibt ausschließlich für den tatsächlichen Channelinhaber bedienbar',async t=>{
 for(const role of ['listener','radioModerator','channelModerator','manager']){
  const {page,requests,errors}=await setup(t,{view:'team',role,station:true,clock:true});
  assert.equal(await page.locator('#team-panel').isVisible(),false);
  assert.equal(await page.locator('#radio-moderator-nick').isDisabled(),true);
  assert.equal(await page.locator('#team-status-tab,#team-status,#refresh-status').count(),0);
  await page.clock.runFor(61000);
  assert.equal(requests.some(u=>u.startsWith('https://stats.example.com/')),false);
  assert.deepEqual(errors,[]);
 }
});

test('Hörerzahl bleibt in allen Rollen und Ansichten ohne Anzeige und ohne Abfragetimer entfernt',async t=>{
 for(const role of ['owner','radioModerator','channelModerator','manager','listener']){
  const {page,state,requests,errors}=await setup(t,{station:true,role,clock:true,viewport:{width:1360,height:160}});
  await page.evaluate(state=>__emit('mw:state',{...state,revision:2,station:{...state.station,
   listenersUrl:'https://stats.example.com/obsolete-listeners',fields:{...state.station.fields,listeners:'listener_count'}}}),state);
  for(const width of [320,390,699,700,1099,1100,1360,2290]){
   await resizeViewport(page,{width,height:160});
   assert.equal(await page.locator('#listener-count,#listener-value,.listener-icon').count(),0);
   assert.equal(await page.locator('.presenter').isVisible(),true);
   assert.equal(await page.locator('#stream-label').evaluate(n=>!!n.closest('.sr-only')),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(role==='owner'&&[320,700,2290].includes(width)){await captureDesign(page,'Appleiste-ohne-Hoerer-'+width);}
  }
  await page.clock.runFor(61000);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(requests.some(url=>url.includes('/listener')||url.includes('obsolete-listeners')),false);
  assert.equal(requests.some(url=>url.endsWith('/track/current')),true);
  assert.equal(requests.some(url=>url.includes('radio/listeners.js')),false);
  assert.deepEqual(errors,[]);await page.context().close();
 }
 for(const view of ['wishes','studio','team','schedule']){
  const {page,requests,errors}=await setup(t,{station:true,view,clock:true});
  await page.clock.runFor(61000);
  assert.equal(await page.locator('#listener-count,#status-listeners,#status-listeners-detail').count(),0);
  assert.equal(requests.some(url=>url.endsWith('/listener')),false);assert.deepEqual(errors,[]);
 }
});

async function resizeViewport(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
}
async function publicActionContentsFit(page) {
 const measurements=await page.locator('#open-schedule,#open-wishes,#studio-tab').evaluateAll(buttons=>buttons.filter(b=>b.getClientRects().length).map(button=>{
  const b=button.getBoundingClientRect(),icon=button.querySelector('.public-action-icon').getBoundingClientRect(),copy=button.querySelector('.wish-button-copy'),c=copy.getBoundingClientRect();
  const title=copy.querySelector('strong'),t=title.getBoundingClientRect(),style=getComputedStyle(title),shown=!!copy.getClientRects().length,svg=Array.from(button.querySelectorAll('.public-action-icon svg')).find(n=>n.getClientRects().length).getBoundingClientRect();
  return {id:button.id,viewport:innerWidth,closed:button.classList.contains('wishes-closed'),left:b.left,right:b.right,width:b.width,height:b.height,iconHeight:icon.height,iconY:icon.top,svgSize:svg.width,titleY:shown?t.top:null,font:shown?[style.fontFamily,style.fontSize,style.fontWeight,style.lineHeight]:null,inside:[icon,...shown?[c]:[]].every(r=>r.left>=b.left-.5&&r.right<=b.right+.5&&r.top>=b.top-.5&&r.bottom<=b.bottom+.5),textFits:!shown||copy.scrollWidth<=copy.clientWidth+1,separate:!shown||icon.right<=c.left+.5||icon.bottom<=c.top+.5};
 }));
 for(const row of measurements)assert.ok(row.inside&&row.textFits&&row.separate,'Symbol und vollständige Beschriftung passen ohne Überlagerung in die Radiotaste: '+JSON.stringify(row));
 for(const row of measurements.slice(1)){
  for(const key of ['width','height','iconHeight','iconY','svgSize'])assert.ok(Math.abs(measurements[0][key]-row[key])<.6,'Radiotasten haben gemeinsame Maße und Symbolhöhe ('+key+'): '+JSON.stringify(measurements));
  if(row.titleY!==null){assert.ok(Math.abs(measurements[0].titleY-row.titleY)<.6,'Alle Hauptbeschriftungen auf derselben Höhe: '+JSON.stringify(measurements));assert.deepEqual(row.font,measurements[0].font,'Gemeinsame Schriftmaße');}
 }
 if(measurements.length===3)assert.ok(Math.abs((measurements[1].left-measurements[0].right)-(measurements[2].left-measurements[1].right))<.6,'Gleicher Abstand zwischen allen drei Radiotasten: '+JSON.stringify(measurements));
}
async function muteButtonFits(page) {
 await page.locator('#mute-button').scrollIntoViewIfNeeded();
 const row=await page.locator('#mute-button').evaluate(button=>{
  const b=button.getBoundingClientRect(),m=document.getElementById('radio-metadata').getBoundingClientRect(),f=document.querySelector('.radio-program-face').getBoundingClientRect();
  const points=[[b.left+1,b.top+b.height/2],[b.right-1,b.top+b.height/2],[b.left+b.width/2,b.top+1],[b.left+b.width/2,b.bottom-1]];
  const actions=Array.from(document.querySelectorAll('#open-schedule,#open-wishes,#studio-tab,#team-tab')).filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect());
  return {viewport:[innerWidth,innerHeight],button:b.toJSON(),metadata:m.toJSON(),inside:[m,f].every(r=>b.left>=r.left-.5&&b.right<=r.right+.5&&b.top>=r.top-.5&&b.bottom<=r.bottom+.5),separate:actions.every(r=>b.right<=r.left+.5||b.left>=r.right-.5||b.bottom<=r.top+.5||b.top>=r.bottom-.5),hit:points.every(([x,y])=>document.elementFromPoint(x,y)?.closest('button')===button)};
 });
 assert.ok(row.button.width>=44&&row.button.height>=44&&row.inside&&row.separate&&row.hit,'Lautstärketaste bleibt vollständig innerhalb der Leiste, ohne Überlagerung und an allen vier Rändern bedienbar: '+JSON.stringify(row));
}
async function radioAction(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.locator(selector).click();
}
async function captureDesign(page, name) {
  if (!process.env.MISCHWERK_DESIGN_CAPTURE) return;
  const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'design');fs.mkdirSync(folder,{recursive:true});
  const size=page.viewportSize();
  const contentHeight=await page.locator('html').getAttribute('data-view')==='radio' ?
    Math.ceil((await page.locator('#radio-panel').boundingBox()).height)+16 : Math.min(1000,Math.ceil((await page.locator('.dialog-shell').boundingBox()).height));
  await page.evaluate(version => {
    const note=document.createElement('div');note.id='local-test-note';
    note.textContent='MischWerk '+version+' · lokale Vorschau';
    note.style.cssText='position:fixed;bottom:0;left:0;right:0;height:24px;padding:4px 8px;background:#202020;color:#c4c1b5;font:12px Segoe UI,Arial;z-index:100;visibility:visible';
    document.body.appendChild(note);
  }, require('../../package.json').version);
  await page.setViewportSize({width:size.width,height:contentHeight+24});
  await page.waitForTimeout(180); // Farbwechsel der Reiter vor der Aufnahme abschließen.
  await page.screenshot({path:path.join(folder,name+'.png')});
  await page.evaluate(()=>document.getElementById('local-test-note').remove());
  await page.setViewportSize(size);
}

test('Gemeinsame Dialogköpfe, sichtbarer Zeichenzähler und lange Eingaben bleiben auf schmalen Flächen lesbar',async t=>{
  for(const [view,width,height] of [['wishes',320,568],['studio',780,860],['team',560,600],['schedule',820,630]]) {
    const {page,state,errors}=await setup(t,{view,viewport:{width,height}});
    assert.equal(await page.locator('.dialog-brand img:visible').evaluate(n=>getComputedStyle(n).mixBlendMode),'lighten');
    const header=page.locator('.dialog-header:visible');
    assert.equal(await header.evaluate(n=>{const h=n.getBoundingClientRect(),t=n.querySelector('.dialog-heading').getBoundingClientRect();return Math.abs(h.x+h.width/2-t.x-t.width/2)<1;}),true,'Titel genau über die Fensterbreite zentriert');
    assert.equal(await page.locator('h1,h2,h3').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).every(n=>getComputedStyle(n).textAlign==='center')),true,'Alle Menüüberschriften mittig');
    assert.equal(await page.locator('.dialog-brand img:visible').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)','Original-Logo ohne abgesetztes Hintergrundrechteck');
    assert.ok(await page.locator('#dialog-title').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=22));
    if(view==='wishes') {
      await page.locator('#wish-text').fill('A'.repeat(300));
      assert.equal(await page.locator('#wish-text-count').textContent(),'300 / 300');
      assert.equal(await page.locator('#wish-text-count').isVisible(),true);
      await page.locator('#wish-text').fill('a-ha – Take On Me');await page.locator('#submit-wish').click();
      const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:wish.submit'));
      await page.evaluate(sent=>window.__emit('mw:wish.receipt',{submissionId:sent.data.submissionId,accepted:true,message:'Dein Musikwunsch wurde an die Moderation gesendet.'}),sent);
    } else {
      await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen',expiresAt:Date.now()+3600000},user:{...state.user,isOnAir:true,canEndModeration:true},queueTotal:1,pages:1,queue:[{id:1,nick:'Musikfreund',text:'a-ha – Take On Me',createdAt:Date.now()}],radioModerators:[{nick:'MischWerk-Team',userId:2},{nick:'Nächster DJ',userId:3}],radioModeratorTotal:2}),state);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await captureDesign(page,view==='wishes'?'Wunschbox-Mobil':view==='studio'?'Moderation':'Radio-Team');
    if(process.env.MISCHWERK_DESIGN_CAPTURE&&view==='studio') {
      await resizeViewport(page,{width:320,height:740});await captureDesign(page,'Moderation-Mobil');
      await page.locator('#studio-queue-tab').click();await captureDesign(page,'Moderation-Musikwuensche-Mobil');
    }
    assert.deepEqual(errors,[]);
  }
});

test('Start bleibt bei verzögerten Ressourcen unsichtbar; erst die gemessene fertige Geometrie wird einmal an STAPP gemeldet', async t => {
  for (const loadingDelay of ['css','script','module','stylesheet','actions']) {
    for (const [width,k3] of [[960,false],[320,false],[960,true],[320,true]]) {
      const {page,loadingSnapshot,errors}=await setup(t,{k3,loadingDelay,viewport:{width,height:760}});
      assert.equal(loadingSnapshot.background,'rgb(15, 17, 20)');
      assert.equal(loadingSnapshot.visibility,'hidden');assert.equal(loadingSnapshot.initialized,false);
      assert.deepEqual(loadingSnapshot.sizes,[],'Keine geratenen Größen vor der geladenen Oberfläche');
      const sizes=await page.evaluate(()=>window.__sizes);
      assert.equal(sizes.length,k3?0:1,'Höchstens ein initialer Hostaufruf');
      if(!k3){assert.equal(sizes[0][0],0);assert.ok(sizes[0][1]>=160&&sizes[0][1]<=500);}
      assert.equal(await page.locator('#radio-panel').isVisible(),true);assert.deepEqual(errors,[]);
    }
  }
});

test('Neue Wunschbox wartet auf ihr Stylesheet und erhält den Versandvertrag im nativen Fenster', async t => {
  for (const k3 of [true,false]) {
    const {page,loadingSnapshot,errors,requests}=await setup(t,{view:'wishes',k3,loadingDelay:'stylesheet',loadingPause:120,viewport:{width:320,height:360}});
    assert.equal(loadingSnapshot.initialized,false);
    assert.deepEqual(loadingSnapshot.sizes,[]);
    await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
    assert.equal(requests.filter(url=>url.endsWith('/css/wishbox.css')).length,1);
    assert.doesNotMatch(await page.locator('.dialog-shell').innerText(),/submissionId|mw:|API|Backend|Persistenz|Protokoll|HostFrame/);
    await page.locator('#wish-text').fill('a-ha – Take On Me');
    assert.equal(await page.locator('#wish-text-count').textContent(),'17 / 300');
    await page.locator('#submit-wish').click();
    const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:wish.submit'));
    assert.deepEqual(Object.keys(sent.data).sort(),['submissionId','text']);
    assert.equal(sent.data.text,'a-ha – Take On Me');
    assert.equal(await page.locator('#wish-text').isDisabled(),true);
    await page.evaluate(s=>window.__emit('mw:wish.receipt',{accepted:false,submissionId:s.data.submissionId,message:'Bitte erneut senden.'}),sent);
    assert.equal(await page.locator('#wish-text').inputValue(),'a-ha – Take On Me');
    assert.equal(await page.locator('#wish-text').isDisabled(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
  }
});

test('Fremde Bestätigungen entsperren keinen Wunsch und löschen keinen neuen Entwurf', async t => {
  const { page, errors } = await setup(t, {view:'wishes'});
  await page.locator('#wish-text').fill('Band – Song');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:wish.submit'));
  await page.evaluate(()=>window.__emit('mw:result',{ok:true,action:'mw:setRequests',requestId:'fremd',message:'Alt'}));
  assert.equal(await page.locator('#wish-fields').evaluate(node=>node.disabled),true);
  assert.equal(await page.locator('#wish-text').inputValue(),'Band – Song');
  await page.evaluate(()=>{document.getElementById('wish-text').value='Neuer Entwurf';});
  await page.evaluate(sent=>window.__emit('mw:wish.receipt',{accepted:true,submissionId:sent.data.submissionId,message:'Gespeichert'}),sent);
  assert.equal(await page.locator('#wish-text').inputValue(),'Neuer Entwurf'); assert.deepEqual(errors,[]);
});

test('Skripte laden parallel zu langsamen Styles; vor Sichtbarkeit wird kein Musikwunsch quittiert', async t => {
  for (const view of ['radio','studio']) {
    const {page,loadingSnapshot,requests,errors} = await setup(t,{view,loadingDelay:'parallel',initialRequest:view==='studio',
      k3:false,viewport:{width:780,height:860}});
    assert.equal(loadingSnapshot.readyEvents,1,'Verdrahtung bereits bei blockiertem CSS abgeschlossen');
    assert.equal(loadingSnapshot.initialized,false,'Sichtbarkeit wartet weiterhin auf geladene Styles');
    assert.deepEqual(loadingSnapshot.sizes,[]);
    assert.equal(loadingSnapshot.acknowledgements,0);
    assert.equal(requests.some(url=>url.endsWith('/js/app.js')),false);
    if(view==='studio') {
      assert.equal(await page.evaluate(()=>window.__sent.some(event=>event.type==='mw:ackRequest')),false,'Deine Sendung quittiert keine unsichtbaren Wünsche');
      await showStudioPane(page,true);
      await page.waitForFunction(()=>window.__sent.some(event=>event.type==='mw:ackRequest'));
      assert.equal(await page.evaluate(()=>window.__sent.filter(event=>event.type==='mw:ackRequest').length),1);
    }
    assert.deepEqual(errors,[]);
  }
});

test('Jedes Fenster lädt nur seine Module und Styles; erneuter Einstieg verdoppelt keine Hooks oder Initialisierung', async t => {
  for (const view of ['radio','wishes','studio','team','schedule']) {
    const { page, errors, requests } = await setup(t, { view });
    const files = selectedFiles(view);
    const actual = requests.filter(url => url.startsWith('http://mischwerk.test/') && /\.(js|css)$/.test(url));
    assert.deepEqual(actual.map(url => url.replace('http://mischwerk.test/','')).sort(), [...files].sort(), view);
    assert.equal(requests.some(url => url === 'http://mischwerk.test/js/app.js'), false);
    await page.addScriptTag({ url: 'http://mischwerk.test/js/start.js' });
    await page.waitForFunction(() => document.querySelectorAll('script[src$="js/start.js"]').length === 2);
    assert.equal(await page.evaluate(() => window.__sent.filter(event => event.type === 'mw:ready').length), 1);
    assert.equal(await page.evaluate(() => Object.values(window.__handlers).every(handlers => handlers.length === 1)), true);
    assert.deepEqual(errors, []);
  }
});

test('Langsames Original-Logo blockiert weder bedienbare Radioleiste noch korrekte erste Hosthöhe', async t => {
  for (const k3 of [false,true]) {
    const {page,errors,requests,loadingSnapshot} = await setup(t,{station:true,k3,loadingDelay:'logo',viewport:{width:960,height:760}});
    assert.equal(loadingSnapshot.initialized,true);
    assert.equal(loadingSnapshot.playEnabled,true);
    assert.equal(loadingSnapshot.visibility,'visible');
    assert.equal(loadingSnapshot.sizes.length,k3?0:1);
    assert.equal(await page.locator('#play-button').isEnabled(),true);
    await page.locator('#play-button').click();
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://stream.example.com/test-radio');
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.js')).length,selectedFiles('radio').filter(file=>file.endsWith('.js')).length);
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.css')).length,selectedFiles('radio').filter(file=>file.endsWith('.css')).length);
    assert.equal(requests.some(url=>/\/js\/(studio|team|schedule)\//.test(url)),false);
    assert.deepEqual(errors,[]);
  }
});

test('Verspätete Play-Ablehnung eines alten Versuchs stoppt keinen neuen Start', async t => {
  const { page, errors } = await setup(t, { station: true });
  await page.locator('#play-button').click(); await page.locator('#play-button').click(); await page.locator('#play-button').click();
  await page.evaluate(() => window.__rejects[0](new Error('alter Start')));
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'), 'Radio stoppen');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), 'https://stream.example.com/test-radio'); assert.deepEqual(errors, []);
});
test('Synchroner Verbindungsfehler hält Hörwunsch und kündigt Wiederherstellung an',async t=>{
 const {page,errors}=await setup(t,{station:true,throwingPlay:true,clock:true});await page.locator('#play-button').click();await page.locator('#playback-status').filter({hasText:'automatisch wieder'}).waitFor();
 assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');await page.clock.runFor(60000);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');await page.locator('#play-button').click();assert.deepEqual(errors,[]);
});
test('Späte Medienereignisse nach bewussten Stop bleiben wirkungslos',async t=>{
 const {page}=await setup(t,{station:true,clock:true});await page.locator('#play-button').click();await page.locator('#play-button').click();
 await page.locator('#radio-audio').evaluate(a=>['pause','ended','error','playing','stalled'].forEach(type=>a.dispatchEvent(new Event(type))));await page.clock.runFor(60000);
 assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
});
test('Alte Songantwort darf eine entfernte Senderkonfiguration nicht überschreiben', async t => {
  const { page, state, releaseSong } = await setup(t, { station: true, delayedSong: true });
  state.station = { configured: false, streamUrl: '', stationUrl: '', name: 'MischWerk',metadataEndpoints:[] };
  await page.evaluate(state => window.__emit('mw:state', state), state);
  const response=page.waitForResponse('https://stats.example.com/widget/radio/test-radio/track/current');releaseSong();await response;
  assert.equal(await page.locator('#track-title').textContent(), '');
  assert.equal(await page.locator('#track-title').isVisible(), false);
  assert.equal(await page.locator('#play-button').isDisabled(), true);
});
test('Erneuter identischer Wunsch nach Bestätigungs-Timeout behält seine Übertragungs-ID', async t => {
  const { page } = await setup(t, { clock: true, view:'wishes' });
  await page.locator('#wish-text').fill('Band – Song');
  await page.locator('#submit-wish').click(); await page.clock.runFor(15010);
  await page.locator('#submit-wish').click();
  const requests = await page.evaluate(() => window.__sent.filter(event => event.type === 'mw:wish.submit'));
  assert.equal(requests.length, 2); assert.ok(requests[0].data.submissionId);
  assert.equal(requests[0].data.submissionId, requests[1].data.submissionId);
});
test('Veralteter Zustand setzt keine neuere Wunschbox-Entscheidung zurück', async t => {
  const {page,state}=await setup(t,{view:'wishes'});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,requestsEnabled:false}),state);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,requestsEnabled:true}),state);
  assert.match(await page.locator('#wish-status').textContent(),/DEAKTIVIERT/);
});

test('Neue Radioanordnung hält die Hauptaktionen in 160 Pixeln sichtbar und ordnet mobile Vollansichten untereinander', async t => {
  const {page,state,errors}=await setup(t,{station:true,viewport:{width:1440,height:160}});
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'Am Fenster',artist:'Puhdys & City'}}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Am Fenster');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen'}}),state);
  for(const width of [1440,1100,1099,1024,868,768,760,759,700,699,390,320]) {
    await resizeViewport(page,{width,height:160});
    await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<=1350),width);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Kein horizontaler Überlauf bei '+width);
    for(const selector of ['#play-button','#track-title','#track-artist','#open-schedule','#open-wishes']) {
      const box=await page.locator(selector).boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=160.5,selector+' sichtbar bei '+width);
      if(selector.includes('button')||selector.includes('open-'))assert.ok(box.height>=44);
    }
    if(width>700) {
      const logo=await page.locator('.bar-logo').boundingBox(),play=await page.locator('#play-button').boundingBox();
      const volume=await page.locator('.volume-control').boundingBox();
      assert.ok(logo.x>=0&&logo.y>=0&&logo.y+logo.height<=160&&(logo.x+logo.width<=play.x||play.x+play.width<=logo.x||logo.y+logo.height<=play.y+1),'Logo bleibt vollständig sichtbar und vom Player getrennt');
      const action=await page.locator('#open-schedule').boundingBox();
      assert.ok(volume.x>=play.x+play.width&&(volume.x+volume.width<=action.x||volume.y+volume.height<=action.y),'Lautstärke überlagert weder Player noch Hauptaktionen');
    }
    const title=await page.locator('#track-title').boundingBox(),artist=await page.locator('#track-artist').boundingBox();
    assert.ok(artist.y>=title.y+title.height-1,'Interpret unter dem Titel');
    assert.equal(await page.locator('.radio-bar').evaluate(n=>getComputedStyle(n).transform),'none');
    if(width===1024) await captureDesign(page,'Radio-Desktop-1024');
    if(width===1440||width===868) await captureDesign(page,'Radio-Desktop-'+width);
    if(width===390) await captureDesign(page,'Radio-Fest-390');
  }
  for(const width of [390,320]) {
    await resizeViewport(page,{width,height:600});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('radio-constrained'));
    const title=await page.locator('#track-title').boundingBox(),artist=await page.locator('#track-artist').boundingBox(),topic=await page.locator('#radio-topic').boundingBox();
    assert.ok(artist.y>=title.y+title.height-1&&topic.y>=artist.y+artist.height,'Mobile Informationen untereinander');
    assert.equal(await page.locator('#volume').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===390)await captureDesign(page,'Radio-Mobil-390');
  }
  assert.deepEqual(errors,[]);
});

test('Öffentliche Aktionen und private Zugänge folgen ausschließlich der echten Besitzer- oder Radiomoderatorenrolle',async t=>{
  async function arrangement(page,stacked) {
    const schedule=await page.locator('#open-schedule').boundingBox(),wishes=await page.locator('#open-wishes').boundingBox();
    assert.ok(Math.abs(schedule.width-wishes.width)<1&&Math.abs(schedule.height-wishes.height)<1,'Gleich große öffentliche Aktionen');
    assert.ok(Math.abs(schedule.y-wishes.y)<1&&wishes.x>=schedule.x+schedule.width,'Zwei öffentliche Aktionen nebeneinander');
  }
  for(const role of ['listener','channelModerator','manager','radioModerator','owner']) {
    const {page,state,errors}=await setup(t,{role,station:true,viewport:{width:1360,height:160}});
    const hasStudio=role==='radioModerator'||role==='owner';
    assert.equal(await page.locator('#radio-more,#radio-back').count(),0);
    assert.equal(await page.locator('#open-schedule').isVisible(),true);
    assert.equal(await page.locator('#open-wishes').isVisible(),true);
    assert.equal(await page.locator('#studio-tab').isVisible(),hasStudio);
    assert.equal(await page.locator('#team-tab').count(),0);
    assert.equal(await page.locator('#radio-private-actions').isVisible(),hasStudio);
    await arrangement(page,!hasStudio);
    if(['listener','radioModerator','owner'].includes(role)) {
      const name='Aktionen-'+(role==='listener'?'Hoerer':role==='owner'?'Inhaber':'Radiomoderator');
      await captureDesign(page,name+'-1360');
      if(process.env.MISCHWERK_DESIGN_CAPTURE)await page.locator('#radio-actions').screenshot({path:path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'design',name+'-Detail.png')});
    }
    for(const width of [1024,700,390,320]) {
      await resizeViewport(page,{width,height:160});
      await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<=1350),width);
      if(!hasStudio)await arrangement(page,width>=700);
      for(const selector of ['#open-schedule','#open-wishes',...(hasStudio?['#studio-tab']:[])]) {
        const box=await page.locator(selector).boundingBox();
        assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=160.5,'Sichtbare Aktion für '+role+' bei '+width+': '+selector);
        assert.ok(box.height>=44&&box.width>=44);
      }
    }
    if(hasStudio) {
      await page.locator('#studio-tab').click();assert.equal(await page.evaluate(()=>window.__sent.at(-1).type),'mw:openStudio');
      await page.evaluate(()=>{const sent=window.__sent.at(-1);window.__emit('mw:result',{ok:true,action:sent.type,requestId:sent.data.requestId});});
    }
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,user:{...state.user,canModerate:false,canManageRadioModerators:false}}),state);
    assert.equal(await page.locator('#studio-tab').isVisible(),false);assert.equal(await page.locator('#team-tab').isVisible(),false);
    assert.equal(await page.locator('#radio-private-actions').isVisible(),false);
    await resizeViewport(page,{width:1360,height:160});await arrangement(page,true);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,requestsEnabled:false,user:{...state.user,canModerate:true,showModerationButton:true,canManageRadioModerators:true}}),state);
    await arrangement(page,false);assert.equal(await page.locator('#open-wishes').isDisabled(),true);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,requestsEnabled:false,user:{...state.user,canModerate:false,canManageRadioModerators:false}}),state);
    await arrangement(page,true);assert.equal(await page.locator('#open-wishes').isDisabled(),true);
    if(role==='listener') {
      await captureDesign(page,'Aktionen-Hoerer-Deaktiviert-1360');
      await resizeViewport(page,{width:390,height:600});await arrangement(page,true);
      await captureDesign(page,'Aktionen-Hoerer-Mobil');
    }
    assert.deepEqual(errors,[]);
  }
});

test('Studioleiste nutzt sehr breite Fenster vollständig und gruppiert auch ohne Thema den Moderationsstatus bei der Musik',async t=>{
  const {page,state,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:2291,height:160}});
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'Wonders',artist:'Neelix, Ghost Rider & The Gardener and the Tree'}}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Wonders');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'',moderator:null,requestsEnabled:false}),state);
  for(const width of [2291,1920,2560]) {
    await resizeViewport(page,{width,height:160});
    const bar=await page.locator('#radio-panel').boundingBox(),music=await page.locator('.radio-program-face').boundingBox();
    const actions=await page.locator('#radio-actions').boundingBox(),status=await page.locator('.presenter').boundingBox();
    assert.equal(bar.width,width,'Leiste nutzt die gesamte Framebreite');assert.equal(bar.x,0);
    assert.ok(status.x>=music.x&&status.x+status.width<=music.x+music.width,'Moderationsstatus bleibt innerhalb der Musikgruppe');
    assert.ok(actions.x-music.x-music.width<=16,'Musik und Bedienung bleiben unmittelbar benachbart');
    assert.equal(await page.locator('#radio-topic').isVisible(),true);assert.equal(await page.locator('#show-topic').textContent(),'MischWerk Radio Show');
    assert.equal(await page.locator('#open-wishes').isDisabled(),true);
    assert.equal(await page.locator('#open-wishes').evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)','Gesperrte Wunschbox behält die offene Deckdarstellung und bleibt nativ gesperrt');
    assert.equal(await page.locator('#on-air-sign').textContent(),'Radio MischWerk');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===2291)await captureDesign(page,'Radio-Studio-2291');
  }
  await resizeViewport(page,{width:1360,height:160});await captureDesign(page,'Radio-Studio-1360');
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await captureDesign(page,'Radio-Studio-1360-Play');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  await captureDesign(page,'Radio-Studio-1360-Pause');
  assert.deepEqual(errors,[]);
});

test('Hohe Auflösungen und Bildschirmskalierungen erhalten lesbare Gruppen, direkte Aktionen und weißen Wiedergaberahmen',async t=>{
  const measurements=[];
  for(const deviceScaleFactor of [1,1.25,1.5,2])for(const width of [1920,2560,3440,3840])for(const role of ['listener','owner']) {
    const {page,state,errors}=await setup(t,{role,deviceScaleFactor,station:true,realAudio:true,viewport:{width,height:160}});
    let song={title:'Wonders',artist:'Neelix, Ghost Rider & The Gardener and the Tree'};
    await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
    await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Wonders');
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen'}}),state);
    const bounds=await page.locator('#radio-panel').boundingBox();
    assert.equal(bounds.width,width);assert.equal(bounds.height,160);assert.equal(bounds.x,0);
    assert.equal(await page.evaluate(()=>devicePixelRatio),deviceScaleFactor);
    assert.ok(Math.abs(await page.locator('.bar-logo').evaluate(n=>n.getBoundingClientRect().width)-100)<.03);
    assert.equal(await page.locator('#play-button').evaluate(n=>n.getBoundingClientRect().width),60);
    assert.equal(await page.locator('#track-title').evaluate(n=>getComputedStyle(n).fontSize),'24px');
    const actions=['#open-schedule','#open-wishes',...(role==='owner'?['#studio-tab']:[])];
    async function reachable() {
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      for(const selector of actions)assert.equal(await page.locator(selector).evaluate(n=>{
        const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=160&&r.width>=44&&r.height>=44&&hit?.closest('button')===n;
      }),true,selector+' direkt bedienbar bei '+width+' / '+deviceScaleFactor);
    }
    await reachable();await page.locator('#play-button').click();await waitRadioPlaying(page);
    assert.equal(await page.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).animationName),'mw-halo-rgb');
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none','Keine Beleuchtung um die äußere Leiste');
    const light=await page.locator('.radio-program-face').evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:innerWidth-r.right,outerWidth:r.width,top:r.top,height:r.height};});
    const metadata=await page.locator('#radio-metadata').boundingBox();
    assert.ok(light.left<=metadata.x&&light.left+light.outerWidth>metadata.x+metadata.width,'Weißer Rahmen folgt der Musikkarte einschließlich Player und Hörertasten');
    assert.ok(light.left>0&&light.right>0&&light.outerWidth<width&&light.top>=0&&light.height<=160);
    const music=await page.locator('.radio-program-face').boundingBox(),volume=await page.locator('.volume-control').boundingBox();
    assert.ok(Math.abs(volume.x-(await page.locator('#track-title').boundingBox()).x)<1,'Lautstärke und Musik besitzen dieselbe linke Kante');
    const roleLabel=role==='owner'?'Inhaber':'Hoerer';
    if(deviceScaleFactor===1||(deviceScaleFactor===2&&width===3840&&role==='owner'))await captureDesign(page,'Aufloesung-'+roleLabel+'-'+width+'-DPR'+deviceScaleFactor);
    if(process.env.MISCHWERK_DESIGN_CAPTURE&&deviceScaleFactor===1&&role==='owner'&&(width===1920||width===3840))await page.locator('.radio-program-face').screenshot({path:path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'design','Musikkarte-Hintergrund-'+width+'.png')});
    song={title:'Ein sehr langer Musiktitel mit mehreren zusätzlichen Angaben und einer ausführlichen Version für die Sendung',artist:'Ein sehr langer Interpret zusammen mit vielen weiteren Mitwirkenden und einem zusätzlichen Künstler'};
    await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent.startsWith('Ein sehr langer'));
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'S'.repeat(80),moderator:{nick:'EinSehrLangerModeratorNicknameMitWeiteremZusatz'}}),state);
    for(const selector of ['#track-title','#track-artist','#show-topic','#host-name','#volume']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollWidth>n.clientWidth),false,'Keine horizontale Überbreite bei Langtext');
    }
    await page.evaluate(()=>{document.scrollingElement.scrollTop=0;document.body.scrollTop=0;document.getElementById('radio-metadata').scrollTop=0;});
    assert.ok(await page.locator('#radio-metadata').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=160&&n.clientHeight<=144;}),'Lange Musikangaben bleiben in der festen Musikfläche statt über den App-Rand hinauszuwachsen');
    await page.locator('#radio-metadata').hover();await page.mouse.wheel(0,1000);
    await page.waitForFunction(()=>{const n=document.getElementById('radio-metadata');return n.scrollHeight<=n.clientHeight||n.scrollTop>0;});
    const longScroll=await page.locator('#radio-metadata').evaluate(n=>{
      const m=n.getBoundingClientRect(),v=document.getElementById('volume').getBoundingClientRect();
      return {metadataTop:m.top,metadataBottom:m.bottom,volumeTop:v.top,volumeBottom:v.bottom,barTop:document.getElementById('radio-panel').getBoundingClientRect().top};
    });
    assert.equal(longScroll.barTop,0,'Native Scrollbedienung verschiebt nicht die gesamte Leiste');
    assert.ok(longScroll.volumeTop>=longScroll.metadataTop&&longScroll.volumeBottom<=longScroll.metadataBottom+1,'Lautstärkeregler bleibt vollständig erreichbar');
    await reachable();await page.locator('#play-button').click();await waitRadioPlaying(page);
    if(deviceScaleFactor===1&&width===3840&&role==='owner')await captureDesign(page,'Aufloesung-Inhaber-3840-Langtext');
    await page.locator('#play-button').click();
    assert.equal(await page.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).borderTopColor),'rgb(58, 58, 58)');
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none');
    if(deviceScaleFactor===1&&width===3840&&role==='owner')await captureDesign(page,'Aufloesung-Inhaber-3840-Pause');
    assert.deepEqual(errors,[]);
    measurements.push({width,deviceScaleFactor,role,appWidth:bounds.width,appHeight:bounds.height,sideMargin:bounds.x,frame:light,metadataCentered:true,longScroll,shortAndLongTextPassed:true,whiteFrameOnOffPassed:true});
    await page.context().close();
  }
  if(process.env.MISCHWERK_RESOLUTION_RESULTS)fs.writeFileSync(process.env.MISCHWERK_RESOLUTION_RESULTS,JSON.stringify(measurements,null,2)+'\n');
});

test('Fester schmaler Header bietet Titel, Lautstärke und berechtigte Verwaltungsaktionen direkt ohne Mehr-Menü oder Audiounterbrechung',async t=>{
  const {page,state,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:390,height:160}});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er'}),state);
  assert.equal(await page.locator('#radio-more,#radio-back').count(),0);
  const volume=await page.locator('.volume-control').boundingBox();
  assert.ok(volume.y>=0&&volume.y+volume.height<=105,'Lautstärke liegt bei kurzen Musikangaben direkt in der Musikfläche');
  await captureDesign(page,'Radio-Fest-Details-390');
  await page.locator('#volume').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#volume-value').textContent(),'11 %');
  for(const selector of ['#open-schedule','#open-wishes','#studio-tab']) {
    const box=await page.locator(selector).boundingBox();
    assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=160,'Aktion direkt erreichbar: '+selector);
  }
  await page.locator('#radio-metadata').focus();await page.keyboard.press('End');
  await page.waitForFunction(()=>document.getElementById('radio-metadata').scrollTop>0);
  assert.ok(await page.locator('#radio-metadata').evaluate(n=>n.scrollTop>0),'Musikfläche lässt sich ohne Umschaltbutton per Tastatur scrollen');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>!a.paused),true);
  assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);assert.deepEqual(errors,[]);
});

test('Ignorierte STAPP-Größenänderung erhält die kompakte Bedienung; erlaubte native Größenänderung öffnet die mobile Vollansicht',async t=>{
  const {page,state,errors}=await setup(t,{station:true,k3:false,viewport:{width:320,height:160}});
  assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('radio-constrained')),true);
  assert.ok((await page.evaluate(()=>window.__sizes)).every(size=>size[0]===0&&size[1]<=500));
  assert.ok((await page.locator('#open-wishes').boundingBox()).y+44<=160);
  await page.exposeBinding('__resizeRadio',async(source,height)=>source.page.setViewportSize({width:320,height}));
  await page.evaluate(()=>{Client.getHostFrame=()=>({setSize(width,height){window.__sizes.push([width,height]);window.__resizeRadio(height);},setTitle(){},setResizable(){}});});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Ein langes Thema für die mobile Radioansicht mit deutlich zusätzlichem Platzbedarf'}),state);
  await page.waitForFunction(()=>innerHeight>160&&!document.documentElement.classList.contains('radio-constrained'));
  assert.equal(await page.locator('#volume').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});

test('Fenster-Buttons senden Popup-Anfragen ohne Leistenwechsel oder Audiostopp', async t => {
  const {page,errors}=await setup(t,{station:true,k3:false,viewport:{width:960,height:160}});
  const initialSizes=await page.evaluate(()=>window.__sizes);
  await page.locator('#play-button').click();
  await page.locator('#open-wishes').click();
  const request=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:openWishes'));
  assert.ok(request);
  await page.evaluate(request=>window.__emit('mw:result',{ok:true,action:request.type,requestId:request.data.requestId,message:'Fenster geöffnet.'}),request);
  await radioAction(page,'#studio-tab');
  assert.equal(await page.evaluate(()=>window.__sent.some(event=>event.type==='mw:openStudio')),true);
  assert.equal(await page.locator('#wishes-panel').isVisible(),false); assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'Radio stoppen');
  assert.deepEqual(await page.evaluate(()=>window.__sizes),initialSizes);
  assert.deepEqual(errors,[]);
});

test('Radio-Team bleibt vom Moderationsmenü getrennt und verwaltet Ernennungen revisionssicher', async t => {
  const radio=await setup(t,{viewport:{width:960,height:160}});
  assert.equal(await radio.page.locator('#team-tab').count(),0);
  assert.equal(await radio.page.locator('#studio-tab').isVisible(),true);

  const {page,state,errors}=await setup(t,{view:'team',k3:false,viewport:{width:560,height:760}});
  assert.equal(await page.locator('#team-panel').isVisible(),true);
  assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.match(await page.locator('#team-panel').innerText(),/Channelmoderatoren erhalten keinen automatischen Studiozugriff/);
  await page.locator('#radio-moderator-nick').fill('KanalMod');
  await page.locator('#add-radio-moderator').click();
  const add=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:addRadioModerator'));
  assert.equal(add.data.nick,'KanalMod');assert.equal(add.data.expectedRadioModeratorRevision,state.radioModeratorRevision);
  await page.evaluate(add=>window.__emit('mw:result',{ok:false,action:add.type,requestId:add.data.requestId,message:'Nick unbekannt'}),add);
  assert.equal(await page.locator('#radio-moderator-nick').inputValue(),'KanalMod','Fehler erhält die Eingabe');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+1,radioModeratorRevision:1,
    radioModeratorTotal:6,radioModeratorPage:0,radioModeratorPages:2,
    radioModerators:[{userId:7,nick:'<img src=x onerror=alert(1)>'},{userId:8,nick:'Zwei'},{userId:9,nick:'Drei'},{userId:10,nick:'Vier'},{userId:11,nick:'Fünf'}]}),state);
  assert.equal(await page.locator('#radio-moderator-list img').count(),0);
  assert.equal(await page.locator('.team-member strong').first().textContent(),'<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#radio-moderator-count').textContent(),'6');
  await page.locator('[data-radio-moderator-id="7"]').click();
  assert.equal(await page.evaluate(()=>window.__sent.some(event=>event.type==='mw:removeRadioModerator')),false);
  await page.locator('[data-confirm-removal="7"]').click();
  const remove=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:removeRadioModerator'));
  assert.equal(remove.data.userId,7);assert.equal(remove.data.expectedRadioModeratorRevision,1);
  await page.evaluate(remove=>window.__emit('mw:result',{ok:true,action:remove.type,requestId:remove.data.requestId,message:'Entfernt'}),remove);
  await page.locator('#next-radio-moderator-page').click();
  const pageRequest=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:refresh'));
  assert.equal(pageRequest.data.radioModeratorPage,1);
  for(const width of [320,560]){
    await resizeViewport(page,{width,height:760});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Keine horizontale Überlagerung bei '+width);
  }
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+2,user:{...state.user,canManageRadioModerators:false},radioModerators:[]}),state);
  assert.equal(await page.locator('#team-panel').isVisible(),false);
  assert.equal(await page.locator('#team-access-denied').isVisible(),true);
  assert.deepEqual(errors,[]);
});

test('Neues Radio-Team bestätigt Entzug gezielt, erhält Fokus und sperrt ihn bei Verbindungsverlust', async t => {
  const {page,state,errors}=await setup(t,{view:'team',clock:true,viewport:{width:320,height:560}});
  const team={...state,revision:2,radioModeratorRevision:4,radioModerators:[{userId:7,nick:'Radiostimme'}],radioModeratorTotal:1};
  await page.evaluate(s=>window.__emit('mw:state',s),team);
  assert.equal(await page.locator('#add-radio-moderator').isDisabled(),true);
  await page.locator('#radio-moderator-nick').fill('   ');
  assert.equal(await page.locator('#add-radio-moderator').isDisabled(),true);
  const member=page.locator('[data-radio-moderator-id="7"]');
  await member.click();
  assert.equal(await page.locator('[data-confirm-removal]').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Abbrechen');
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:removeRadioModerator')),false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-confirm-removal]').count(),0);
  assert.equal(await member.evaluate(n=>n===document.activeElement),true);
  await member.click();
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:3,topic:'Sendung'}),team);
  assert.equal(await page.locator('[data-confirm-removal]').isVisible(),true,'Unveränderte Liste erhält offene Rückfrage');
  await page.clock.fastForward(66000);
  assert.equal(await page.locator('[data-confirm-removal]').isDisabled(),true);
  await page.locator('[data-confirm-removal]').evaluate(n=>n.click());
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:removeRadioModerator')),false);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:4}),team);
  await page.locator('[data-confirm-removal]').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:removeRadioModerator'));
  assert.equal(sent.data.userId,7);assert.equal(sent.data.expectedRadioModeratorRevision,4);
  assert.equal(await page.locator('[data-confirm-removal]').isDisabled(),true);
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Speichern fehlgeschlagen.'}),sent);
  assert.equal(await page.locator('[data-confirm-removal]').isEnabled(),true);
  assert.match(await page.locator('.team-removal-feedback').textContent(),/Speichern fehlgeschlagen/);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:5,radioModerators:[...s.radioModerators,{userId:8,nick:'Zweite Stimme'}]}),team);
  assert.equal(await member.evaluate(n=>n===document.activeElement),true,'Listenänderung hält den Fokus beim selben Mitglied');
  assert.equal(await page.locator('[data-confirm-removal]').count(),0,'Listenänderung verwirft die alte Rückfrage');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});

test('Radio-Team erhält Tastaturfokus bei Pushmeldungen und erlaubt Aktualisieren nach Verbindungsverlust', async t => {
  const { page, state, errors } = await setup(t, { view: 'team', clock: true });
  const team = { ...state, revision: 2, radioModerators: [{ userId: 7, nick: 'Radiostimme' }], radioModeratorTotal: 1 };
  await page.evaluate(state => window.__emit('mw:state', state), team);
  await page.locator('[data-radio-moderator-id="7"]').evaluate(button => {
    window.__focusedMember = button;
    window.__connectionText = document.getElementById('studio-connection').firstChild;
    button.focus();
  });
  await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 3, topic: 'Neues Thema' }), team);
  assert.equal(await page.evaluate(() => document.activeElement === window.__focusedMember), true);
  await page.clock.fastForward(2000);
  assert.equal(await page.evaluate(() => document.getElementById('studio-connection').firstChild === window.__connectionText), true,
    'Unveränderte Live-Statusmeldungen werden nicht jede Sekunde neu geschrieben');
  await page.clock.fastForward(66000);
  assert.equal(await page.locator('#add-radio-moderator').isDisabled(), true);
  assert.equal(await page.locator('#refresh-radio-team').isEnabled(), true);
  await page.locator('#refresh-radio-team').click();
  assert.equal(await page.evaluate(() => window.__sent.at(-1).type), 'mw:refresh');
  assert.deepEqual(errors, []);
});

test('Deaktivierte Wunschbox ist sichtbar gesperrt, sendet keine Popup-Anfrage und wird nach Aktivierung wieder bedienbar',async t=>{
  const {page,state,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:2124,height:160}});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  let revision=2;
  const previousRequests=await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length);
  for(const canModerate of [false,true]){
    await page.evaluate(({state,revision,canModerate})=>window.__emit('mw:state',{...state,revision,requestsEnabled:false,user:{...state.user,canModerate}}),{state,revision:revision++,canModerate});
    for(const width of [320,681,901,2124]){
      await resizeViewport(page,{width,height:radioHeight(width)});
      assert.equal(await page.locator('#open-wishes').isVisible(),true);
      assert.equal(await page.locator('#open-wishes').isDisabled(),true);
      assert.equal(await page.locator('#open-wishes').getAttribute('aria-disabled'),'true');
      assert.equal(await page.locator('#wish-button-caption').textContent(),'Deaktiviert');
      assert.equal(await page.locator('#open-wishes .wish-icon-lock').evaluate(n=>getComputedStyle(n).display!=='none'),true);
      assert.equal(await page.locator('#open-wishes .wish-icon-music').isVisible(),false);
      assert.equal(await page.locator('#open-wishes').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)','Gesperrte Wunschbox bleibt offen auf der gemeinsamen Deckfläche bei '+width);
      await publicActionContentsFit(page);
      assert.equal(await page.locator('#open-wishes .wish-button-arrow').isVisible(),false);
      assert.match(await page.locator('#open-wishes').getAttribute('title'),/deaktiviert/);
      await page.locator('#open-wishes').evaluate(button=>{button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
      assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests);
      assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
      if(!canModerate&&process.env.MISCHWERK_CAPTURE_WISH_BUTTON){
        const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'wunschbutton');fs.mkdirSync(folder,{recursive:true});
        await page.locator('#open-wishes').screenshot({path:path.join(folder,'Deaktiviert-'+width+'.png')});
        await page.locator('#radio-actions').screenshot({path:path.join(folder,'Vergleich-'+width+'.png')});
      }
    }
    if(canModerate){assert.equal(await page.locator('#studio-tab').isEnabled(),true,'Studio bleibt zur Reaktivierung zugänglich');}
  }
  const buttonGeometry=()=>page.locator('#open-schedule,#open-wishes,#studio-tab').evaluateAll(nodes=>nodes.map(n=>[n,...n.querySelectorAll('.public-action-icon,.wish-button-copy strong')].map(e=>e.getBoundingClientRect().toJSON())));
  const closedGeometry=await buttonGeometry();
  await page.evaluate(({state,revision})=>window.__emit('mw:state',{...state,revision,requestsEnabled:true}),{state,revision:revision++});
  await publicActionContentsFit(page);
  assert.deepEqual(await buttonGeometry(),closedGeometry,'Aktivieren und Deaktivieren verschiebt keine Taste, Symbolfläche oder Hauptbeschriftung');
  assert.equal(await page.locator('#open-wishes').isEnabled(),true);
  assert.equal(await page.locator('#open-wishes').getAttribute('aria-disabled'),'false');
  assert.equal(await page.locator('#wish-button-caption').textContent(),'Dein Musikwunsch');
  assert.equal(await page.locator('#open-wishes .wish-button-arrow').count(),0);
  assert.equal(await page.locator('#open-wishes .wish-icon-lock').isVisible(),false);
  assert.equal(await page.locator('#open-wishes .wish-icon-music').isVisible(),true);
  await page.locator('#open-wishes').click();
  assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests+1);
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  assert.deepEqual(errors,[]);
});

test('Popup zeigt nur seinen Bereich und verändert weder Headerbar-Höhe noch Audiowiedergabe', async t => {
  for(const view of ['wishes','studio','team']){
    const {page,errors}=await setup(t,{view,k3:false,station:true,viewport:{width:820,height:680}});
    assert.equal(await page.locator('#radio-panel').isVisible(),false);
    assert.equal(await page.locator('#'+view+'-panel').isVisible(),true);
    if (view === 'wishes') {
      assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);
    } else {
      await page.waitForTimeout(100);
      await validDialogSizes(page);
    }
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal((await page.locator('.dialog-brand img:visible').boundingBox()).width,80);
    assert.deepEqual(errors,[]);
  }
});

test('Rückkehr aus dem Seiten-Cache aktualisiert den Status ohne automatischen Audiostart', async t => {
  const { page } = await setup(t, { station: true });
  await page.locator('#track-title').filter({ hasText: 'Testtitel' }).waitFor();
  await page.evaluate(() => { window.__sent = []; window.dispatchEvent(new PageTransitionEvent('pagehide')); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
  assert.equal(await page.evaluate(() => window.__sent.some(event => event.type === 'mw:refresh')), true);
  assert.equal(await page.evaluate(() => window.__rejects.length), 0);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), null);
});
test('Wunschbox enthält weder Regeltext noch Offen-Limit und sperrt nicht wegen alter Wartezeiten', async t => {
  const {page,state}=await setup(t,{view:'wishes'});
  state.limits={maxOpenRequests:2,cooldownSeconds:120,retentionHours:24,maxTextLength:300};
  state.cooldownUntil=Date.now()+120000;
  state.myTotal=4;state.myPages=4;state.myRequests=[{id:1,text:'Vorhandener Wunsch',createdAt:Date.now()}];
  await page.evaluate(state=>window.__emit('mw:state',state),state);
  assert.equal(await page.locator('#wish-fields').evaluate(node=>node.disabled),false);
  assert.equal(await page.locator('#wish-limit').count(),0);
  assert.equal(await page.locator('#wish-hint').isVisible(),false);
  assert.equal(await page.locator('#wish-status').isVisible(),false);
  assert.doesNotMatch(await page.locator('#wishes-panel').innerText(),/2 offene|2 Minuten|24 Stunden|0 \/ 2 offen/);
});

test('Erfolgreiche oder fehlgeschlagene Statusabfrage entsperrt keine parallele Studioaktion', async t => {
  const {page,state}=await setup(t,{view:'studio'}); await page.locator('#on-air').click();
  await showStudioPane(page,true);
  await page.locator('#refresh-queue').click();
  assert.equal(await page.locator('#refresh-queue').getAttribute('aria-busy'),'true','Aktualisieren bleibt auch während einer wartenden Schreibaktion nutzbar');
  await page.evaluate(s=>__emit('mw:state',{...s,refreshRequestId:__sent.findLast(e=>e.type==='mw:refresh').data.requestId}),state);
  assert.match(await page.locator('#queue-refresh-feedback').textContent(),/Aktualisiert/);
  assert.equal(await page.locator('#on-air').isDisabled(),true,'Die Lesebestätigung bestätigt keine Schreibaktion');
  await page.evaluate(()=>{const send=Client.sendEvent;Client.sendEvent=function(type,data){if(type==='mw:refresh')throw new Error('offline');return send(type,data);};});
  await page.locator('#refresh-queue').click(); assert.equal(await page.locator('#on-air').isDisabled(),true);
});
test('Entzogene Moderatorrechte sperren auch ein bereits geöffnetes Studiofenster', async t => {
  const {page,state}=await setup(t,{view:'studio'});
  await page.evaluate(state=>window.__emit('mw:state',{...state,user:{nick:'Otterchen',canModerate:false},queue:[]}),state);
  assert.equal(await page.locator('#studio-panel').isVisible(),false); assert.equal(await page.locator('#access-denied').isVisible(),true);
});

test('RGB-Lichthof wechselt fließend ohne Farbsprung und folgt nativer Wiedergabe ohne Geometrieänderung',async t=>{
  for(const k3 of [true,false])for(const viewport of [{width:1440,height:160},{width:1024,height:160},{width:390,height:160},{width:320,height:600}]) {
    const {page,errors}=await setup(t,{station:true,realAudio:true,viewport,k3});
    await page.evaluate(()=>document.fonts.ready);
    const frame=()=>page.locator('.radio-program-face').evaluate(node=>{
      const style=getComputedStyle(node);
      return {color:style.borderTopColor,shadow:style.boxShadow,pointerEvents:style.pointerEvents,animation:style.animationName,borderWidth:style.borderTopWidth};
    });
    const resting=await frame(),bounds=await page.locator('#radio-panel').boundingBox();
    assert.equal(resting.color,'rgb(58, 58, 58)');
    assert.equal(resting.shadow,'none');
    for(const [selector,pseudo] of [['#radio-panel','::before'],['.radio-program-face','::after']]) {
      const texture=await page.locator(selector).evaluate((node,pseudo)=>{
        const style=getComputedStyle(node,pseudo);return {image:style.backgroundImage,pointerEvents:style.pointerEvents,animation:style.animationName};
      },pseudo);
      assert.match(texture.image,/repeating-radial-gradient/);assert.equal(texture.pointerEvents,'none');assert.equal(texture.animation,'none');
    }
    const cardBounds=await page.locator('.radio-program-face').boundingBox();
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none');
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    await page.mouse.move(0,0);
    await page.locator('#play-button').evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished)));
    const playing=await frame();
    assert.equal(playing.shadow.split(/, (?![^()]*\))/).length,6);assert.match(playing.shadow,/84px 16px/);assert.equal(playing.borderWidth,'1px');
    assert.equal(playing.pointerEvents,'none');assert.equal(playing.animation,'mw-halo-rgb');
    const motion=await page.locator('.radio-program-face').evaluate(node=>{
      const style=getComputedStyle(node);return {duration:style.animationDuration,timing:style.animationTimingFunction,iterations:style.animationIterationCount};
    });
    assert.deepEqual(motion,{duration:'48s',timing:'linear',iterations:'infinite'});
    const sample=milliseconds=>page.locator('.radio-program-face').evaluate(async(node,milliseconds)=>{
      const animation=node.getAnimations().find(animation=>animation.animationName==='mw-halo-rgb');
      animation.pause();await animation.ready;animation.currentTime=milliseconds;
      const style=getComputedStyle(node),colors=[style.borderTopColor,...style.boxShadow.matchAll(/rgba?\([^)]*\)/g)].map(value=>String(value).match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number));
      const unaffected=['.bar-logo','#play-button','#track-title','#open-schedule','#radio-metadata'].map(selector=>{
        const element=document.querySelector(selector),style=getComputedStyle(element);return {bounds:element.getBoundingClientRect().toJSON(),color:style.color,background:style.backgroundColor,filter:style.filter};
      });
      return {colors,unaffected};
    },milliseconds);
    const initial=await sample(0),phase=await sample(viewport.width===390?32000:8000);
    assert.notDeepEqual(phase.colors,initial.colors);assert.deepEqual(phase.unaffected,initial.unaffected,'Nur Lichtfarben wechseln, nicht Inhalt oder Geometrie');
    if(k3&&viewport.width===1440) {
      const phases=[];
      for(const time of [0,8000,16000,24000,32000,40000])phases.push((await sample(time)).colors[0].slice(0,3).join(','));
      assert.equal(new Set(phases).size,6,'Alle sechs Farbstationen werden erreicht');
      for(const boundary of [8000,16000,24000,32000,40000,48000]) {
        const before=await sample(boundary-10),after=await sample(boundary+10);
        assert.deepEqual(after.unaffected,before.unaffected);
        for(let layer=0;layer<before.colors.length;layer++)for(let channel=0;channel<3;channel++)assert.ok(Math.abs(after.colors[layer][channel]-before.colors[layer][channel])<=2,'Kein Farbsprung an '+boundary+' ms in Lichtschicht '+layer);
      }
      assert.deepEqual((await sample(48000)).colors,initial.colors,'Nahtloser Übergang zum nächsten Zyklus');
      await sample(8000);
    }
    assert.deepEqual(await page.locator('#radio-panel').boundingBox(),bounds);
    assert.deepEqual(await page.locator('.radio-program-face').boundingBox(),cardBounds);
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(viewport.width===1024||viewport.width===390)await captureDesign(page,'Radio-Leuchtrahmen-'+viewport.width+'-Play');
    await page.emulateMedia({reducedMotion:'reduce'});
    const reduced=await frame();assert.equal(reduced.animation,'none');assert.equal(reduced.color,'rgb(240, 244, 250)');assert.notEqual(reduced.shadow,'none','Statische Wiedergabebestätigung bei reduzierter Bewegung');
    if(viewport.width===390) {
      await page.locator('#radio-metadata').focus();await page.keyboard.press('End');assert.deepEqual(await frame(),reduced);
    }
    await page.locator('#play-button').click();
    assert.deepEqual(await frame(),resting,'Bei Pause bleibt nur die unveränderte neutrale Kartenkontur');
    assert.equal(await page.locator('#radio-audio').evaluate(audio=>audio.paused),true);
    assert.deepEqual(await page.locator('#radio-panel').boundingBox(),bounds);
    if(viewport.width===1024||viewport.width===390)await captureDesign(page,'Radio-Leuchtrahmen-'+viewport.width+'-Pause');
    assert.deepEqual(errors,[]);
  }
});

test('Glowauslauf erhält seinen Hintergrund in K3 und STAPP auch bei begrenzter Hosthöhe',async t=>{
  const pixelProof=[];
  for(const k3 of [true,false]) {
    const {page,errors}=await setup(t,{station:true,realAudio:true,k3,deviceScaleFactor:k3?1:2,nativeSizing:!k3,viewport:{width:1920,height:176}});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    const audio=await page.locator('#radio-audio').getAttribute('src');
    await page.locator('#radio-audio').evaluate(a=>{a.loop=true;});
    async function assertSoftPixels(phase) {
      await page.locator('.radio-program-face').evaluate((n,t)=>{for(const a of n.getAnimations()){a.pause();a.currentTime=t;}},phase);
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const png=await page.screenshot();
      const pixels=await page.evaluate(async b64=>{
        const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+b64)).blob()),canvas=document.createElement('canvas');
        canvas.width=bitmap.width;canvas.height=bitmap.height;const c=canvas.getContext('2d');c.drawImage(bitmap,0,0);
        const scale=canvas.width/innerWidth,xs=[.25,.5,.75].map(p=>Math.floor(canvas.width*p));
        const row=y=>xs.map(x=>Array.from(c.getImageData(x,y,1,1).data).slice(0,3));
        return {edge:row(canvas.height-1),before:row(canvas.height-2),near:row(canvas.height-Math.ceil(17*scale)),width:innerWidth,scale};
      },png.toString('base64'));
      const base=[15,17,20],deviation=Math.max(...pixels.edge.flatMap(rgb=>rgb.map((v,i)=>Math.abs(v-base[i]))));
      const step=Math.max(...pixels.edge.flatMap((rgb,n)=>rgb.map((v,i)=>Math.abs(v-pixels.before[n][i]))));
      assert.ok(deviation<=1&&step<=2,'Glow endet weich auf der Canvasfarbe: '+JSON.stringify({k3,phase,deviation,step,...pixels}));
      assert.ok(pixels.near.some(rgb=>rgb.some((v,i)=>Math.abs(v-base[i])>5)),'Der Lichtsaum bleibt vor dem Auslauf sichtbar');
      pixelProof.push({k3,phase,deviation,step,...pixels});
    }
    for(const width of [1920,1200,1199,700,390,320]) {
      await resizeViewport(page,{width,height:176});
      await page.waitForFunction(()=>document.getElementById('radio-panel').getBoundingClientRect().height+16<=innerHeight+1&&document.scrollingElement.scrollHeight<=innerHeight+1);
      const tail=await page.evaluate(()=>{
        const style=getComputedStyle(document.body,'::after'),bar=document.getElementById('radio-panel').getBoundingClientRect();
        return {height:parseFloat(style.height),position:style.position,image:style.backgroundImage,pointer:style.pointerEvents,barHeight:bar.height,frameHeight:innerHeight,scrollHeight:document.scrollingElement.scrollHeight};
      });
      assert.equal(tail.height,16);assert.equal(tail.position,'relative');assert.match(tail.image,/linear-gradient/);assert.equal(tail.pointer,'none');
      assert.ok(tail.barHeight+16<=tail.frameHeight+1,'Vollständiger Auslauf: '+JSON.stringify({k3,width,...tail}));
      assert.ok(tail.scrollHeight<=tail.frameHeight+1,'Keine Scrollfläche für dekorativen Leerraum');
      for(const selector of ['#play-button','#open-schedule','#open-wishes'])assert.equal(await page.locator(selector).evaluate(node=>{
        const r=node.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===node;
      }),true,'Auslauf fängt keine Klicks ab');
      assert.equal(await page.locator('#radio-audio').getAttribute('src'),audio);
      if(width===1920)for(const phase of [0,8000,16000,24000,32000,40000])await assertSoftPixels(phase);
      if(width===390)await assertSoftPixels(32000);
      if(width===1920||width===390)await captureDesign(page,'RGB-Auslauf-'+width);
    }
    assert.deepEqual(errors,[]);
  }
  if(process.env.MISCHWERK_GLOW_CAPTURE)fs.writeFileSync(path.join(require('node:os').tmpdir(),'mischwerk-glow-235-pixels.json'),JSON.stringify(pixelProof,null,2));
  const {page}=await setup(t,{station:true,viewport:{width:390,height:160}});
  const fallback=await page.evaluate(()=>{
    const style=getComputedStyle(document.body,'::after');return {height:style.height,position:style.position,scrollHeight:document.scrollingElement.scrollHeight};
  });
  assert.equal(fallback.position,'fixed');assert.equal(fallback.height,'8px');assert.equal(fallback.scrollHeight,160);
});

test('Wiedergabestatus folgt echter Wiedergabe statt dem Play-Klick', async t => {
  const {page}=await setup(t,{station:true,viewport:{width:1200,height:160}});
  const shadow=()=>page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).boxShadow);
  const buttonGlow=()=>page.locator('#play-button').evaluate(node=>({halo:getComputedStyle(node,'::after').boxShadow,symbol:getComputedStyle(document.getElementById('play-icon')).filter,pointer:getComputedStyle(node,'::after').pointerEvents}));
  const buttonDark=await buttonGlow();assert.equal(buttonDark.halo,'none');assert.equal(buttonDark.symbol,'none');
  assert.equal(await page.locator('#stream-label').textContent(),'Bereit');
  assert.equal(await shadow(),'none');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).borderTopColor),'rgb(58, 58, 58)');
  assert.equal(await shadow(),'none','Play-Versuch allein aktiviert keinen Lichthof');
  assert.deepEqual(await buttonGlow(),buttonDark,'Playbutton leuchtet erst bei Wiedergabe');
  for(const type of ['waiting','stalled','pause','ended','error']) {
    await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
    assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
    assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),true);
    assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).animationName),'mw-halo-rgb');
    assert.match(await shadow(),/84px 16px/);
    const lit=await buttonGlow();assert.notEqual(lit.halo,'none');assert.match(lit.symbol,/drop-shadow/);assert.equal(lit.pointer,'none','Goldschein fängt keine Klicks ab');
    await page.evaluate(type=>{const a=document.getElementById('radio-audio');if(type==='pause')a.pause();if(type==='ended')Object.defineProperty(a,'ended',{configurable:true,value:true});if(type==='error')Object.defineProperty(a,'error',{configurable:true,value:{code:2}});a.dispatchEvent(new Event(type));},type);
    assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false,type);
    assert.equal(await shadow(),'none','Lichthof sofort aus bei '+type);
    assert.deepEqual(await buttonGlow(),buttonDark,'Goldener Playbutton sofort dunkel bei '+type);
    assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).borderTopColor),'rgb(58, 58, 58)');
    if(!['waiting','stalled'].includes(type)) {
      await page.locator('#play-button').click();await page.locator('#radio-audio').evaluate(a=>{delete a.ended;delete a.error;});await page.locator('#play-button').click();assert.equal(await shadow(),'none','Erneuter Versuch bleibt ohne Lichthof');
    }
  }
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Gestoppt');
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  assert.equal(await shadow(),'none','Spätes Medienereignis nach Stop schaltet kein Licht ein');
  assert.deepEqual(await buttonGlow(),buttonDark,'Spätes Medienereignis nach Stop schaltet auch den Playbutton nicht ein');
  await page.emulateMedia({reducedMotion:'reduce'});
});

test('Bestätigte Moderation ersetzt AutoDJ in der Hauptanzeige; Abmeldung zeigt wieder MischWerk ohne Audiowechsel',async t=>{
  const {page,state,errors}=await setup(t,{station:true,clock:true,viewport:{width:1600,height:160}});
  const sign=page.locator('#on-air-sign'),host=page.locator('#host-name');
  assert.equal(await sign.textContent(),'Radio MischWerk','Fehlende Modusinformation ist kein AutoDJ');
  let mode='autodj',modeError=false,transmission='started',revision=2;
  const base='https://stats.example.com/widget/radio/test-radio',modeUrl='https://stats.example.com/mode';
  const autoTitle='Radio Mischwerk bestätigt die automatische Musikstrecke.',liveTitle='Radio Mischwerk bestätigt eine Live-Sendung.',unknownTitle='Der Sendemodus ist derzeit nicht bestätigt.';
  await page.route(modeUrl,r=>r.fulfill({status:modeError?503:200,contentType:'text/plain',body:mode}));
  await page.route(base,r=>r.fulfill({json:{slug:'test-radio',stream_status:transmission}}));
  const selected={...state,station:{...state.station,modeUrl,fields:{...state.station.fields,live:''}}};
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++});
  await sign.filter({hasText:'MischWerk am Pult'}).waitFor();
  await page.locator('#play-button').click();
  await page.evaluate(()=>{const audio=document.getElementById('radio-audio');window.__modeAudio=audio;audio.dispatchEvent(new Event('playing'));});
  assert.equal(await sign.textContent(),'MischWerk am Pult','Play erzeugt keine Moderationsanmeldung');
  const moderator={nick:'StudioNick mit vollständigem Namen'};
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator});
  assert.equal(await sign.textContent(),'Es moderiert');
  assert.equal(await page.locator('.presenter').getAttribute('data-mode'),'moderation','Studioanmeldung erfindet keinen bestätigten LIVE-Modus');
  assert.equal(await host.getAttribute('data-prefix'),'');
  assert.equal(await host.isVisible(),true);assert.equal(await host.textContent(),moderator.nick);
  assert.match(await sign.getAttribute('aria-label'),/Es moderiert StudioNick mit vollständigem Namen/);
  assert.ok((await sign.getAttribute('title')).startsWith(autoTitle),'Der unabhängige Anbieterbefund bleibt im Tooltip erhalten');
  assert.doesNotMatch(await page.locator('.presenter').textContent(),/MischWerk am Pult|Im Studio angemeldet/);
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator:null});
  assert.equal(await sign.textContent(),'MischWerk am Pult','Abmeldung wechselt ohne Providerwechsel zurück');assert.equal(await host.isVisible(),false);
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator});
  assert.equal(await sign.textContent(),'Es moderiert');
  async function refresh(label,titlePrefix){
    const response=page.waitForResponse(base);
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await(await response).finished();
    await page.waitForFunction(({label,titlePrefix})=>{const sign=document.getElementById('on-air-sign');return sign.textContent===label&&sign.title.startsWith(titlePrefix);},{label,titlePrefix});
  }
  mode='live';await refresh('Es moderiert',liveTitle);
  assert.equal(await host.textContent(),moderator.nick);assert.equal(await host.isVisible(),true);
  assert.equal(await host.getAttribute('data-prefix'),'');
  assert.equal(await page.locator('.presenter').getAttribute('data-mode'),'live');
  assert.equal(await sign.evaluate(n=>getComputedStyle(n).color),'rgb(255, 154, 143)');
  assert.equal(await host.evaluate(n=>getComputedStyle(n).color),'rgb(255, 154, 143)');
  for(const value of ['relay','autodj_live','']){
    mode=value;await refresh('Es moderiert',unknownTitle);
    assert.equal(await page.locator('.presenter').getAttribute('data-mode'),'moderation');
    assert.equal(await host.isVisible(),true,'Die bestätigte Moderation bleibt bei unbekanntem Sendemodus erkennbar');
  }
  mode='autodj';await refresh('Es moderiert',autoTitle);
  modeError=true;await refresh('Es moderiert',unknownTitle);modeError=false;
  mode='live';await refresh('Es moderiert',liveTitle);
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator:null});
  assert.equal(await sign.textContent(),'MischWerk spielt live');assert.equal(await host.isVisible(),false,'Keine erfundene Identität aus Anbieterwerten');
  assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),false);
  mode='autodj';transmission='stopped';await refresh('Sendepause','Radio Mischwerk meldet eine Sendepause.');
  assert.equal(await host.isVisible(),false);assert.equal(await page.locator('#play-button').isEnabled(),true);
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator});
  assert.equal(await sign.textContent(),'Es moderiert');assert.equal(await host.isVisible(),true);
  assert.match(await sign.getAttribute('title'),/Sendepause/);assert.equal(await page.locator('#play-button').isEnabled(),true,'Sendestatus sperrt den direkten Höreranschluss nicht');
  await page.evaluate(()=>{window.__disconnectedAt=Date.now();});await page.clock.fastForward(66000);
  assert.equal(await host.isVisible(),false,'Bei verlorener Channelbestätigung wird kein alter Nick als aktuell gezeigt');
  await page.evaluate(s=>window.__emit('mw:state',s),{...selected,revision:revision++,moderator:null});
  transmission='unbekannt';await refresh('Radio MischWerk',unknownTitle);
  transmission='started';await refresh('MischWerk am Pult',autoTitle);
  assert.equal(await page.locator('#play-button').isDisabled(),false);
  assert.equal(await page.locator('#radio-audio').evaluate(n=>n===window.__modeAudio),true);
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:onAir')),false);
  assert.deepEqual(errors,[]);
});

test('Sendemodus bleibt bei verzögerter Erstprüfung, alter Senderantwort und veralteten Hintergrunddaten neutral',async t=>{
  const {page,state,errors,releaseSong}=await setup(t,{station:true,clock:true,delayedSong:true});
  const sign=page.locator('#on-air-sign'),base='https://stats.example.com/widget/radio/';
  assert.equal(await sign.textContent(),'Radio MischWerk');
  await page.route('https://stats.example.com/old-mode',r=>r.fulfill({contentType:'text/plain',body:'autodj'}));
  await page.evaluate(s=>window.__emit('mw:state',s),{...state,revision:2,station:{...state.station,modeUrl:'https://stats.example.com/old-mode'}});
  assert.equal(await sign.textContent(),'Radio MischWerk','Unvollständige Erstprüfung bestätigt keinen AutoDJ');
  let release,blocked=false;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route(base+'other-radio',async r=>{if(blocked)await gate;await r.fulfill({json:{slug:'other-radio',stream_status:'started'}});});
  await page.route(base+'other-radio/track/current',async r=>{if(blocked)await gate;await r.fulfill({json:{title:'Anderer Sender',is_live:true}});});
  const changed={...state,revision:3,station:{...state.station,stationId:'other-radio',streamUrl:'https://stream.example.com/other-radio',
    metadataUrl:base+'other-radio/track/current',statusUrl:base+'other-radio'}};
  await page.evaluate(s=>window.__emit('mw:state',s),changed);
  await sign.filter({hasText:'MischWerk spielt live'}).waitFor();
  releaseSong();await page.waitForTimeout(60);
  assert.equal(await sign.textContent(),'MischWerk spielt live','Verspäteter AutoDJ-Befund des alten Senders wird verworfen');
  blocked=true;
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.fastForward(91000);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await sign.textContent(),'Radio MischWerk','Alte Befunde werden vor neuer Prüfung nicht wieder als aktuell angezeigt');
  release();await sign.filter({hasText:'MischWerk spielt live'}).waitFor();
  assert.deepEqual(errors,[]);
});

test('Stummschaltung stellt Lautstärke wieder her und gesperrter Speicher blockiert sie nicht', async t => {
  const {page,errors}=await setup(t,{viewport:{width:320,height:264}});

  await page.evaluate(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('gesperrt');}});const range=document.getElementById('volume');range.value='43';range.dispatchEvent(new Event('input'));});
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0);
  assert.equal(await page.locator('#volume-value').textContent(),'0 %');
  assert.equal(await page.locator('#mute-button').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#mute-button .mute-cross').isVisible(),true);
  assert.equal(await page.locator('#mute-button .sound-waves').first().isVisible(),false);
  await page.locator('#mute-button').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  assert.equal(await page.locator('#volume-value').textContent(),'43 %');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  assert.equal(await page.locator('#mute-button').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#mute-button .sound-waves').first().isVisible(),true);
  await muteButtonFits(page);
  assert.deepEqual(errors,[]);
});

test('Lautstärke startet bei höchstens 10 Prozent und begrenzt auch alte gespeicherte Werte',async t=>{
  for(const [savedVolume,expected] of [[undefined,.1],[.05,.05],[.1,.1],[.25,.1],[.56,.1],[.7,.1],[1,.1],[0,0],['ungueltig',.1],[-1,0],[Infinity,.1]]){
    const {page,errors}=await setup(t,{savedVolume});
    assert.equal(await page.locator('#radio-audio').evaluate(audio=>audio.volume),expected);
    assert.equal(await page.locator('#volume').inputValue(),String(expected*100));
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.locator('.volume-control').evaluate(node=>node.classList.contains('is-high')),false);
    assert.ok(Number(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')))<=.1);
    assert.deepEqual(errors,[]);
  }
});

test('Roter Lautstärkebereich warnt über 60 Prozent; bis 100 bleibt frei und Mute erhält den bewusst gewählten Pegel',async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1600,height:160}});
  const capture=async name=>{
    if(!process.env.MISCHWERK_CAPTURE_VOLUME){return;}
    const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'lautstaerke');fs.mkdirSync(folder,{recursive:true});
    await page.locator('.volume-control').screenshot({path:path.join(folder,name+'.png')});
  };
  await capture('10-prozent');
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.locator('#volume').evaluate(node=>{node.value='60';node.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.locator('#volume').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#volume').inputValue(),'61');
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),true);
  assert.match(await page.locator('#volume').getAttribute('aria-valuetext'),/Hohe Playerlautstärke/);
  assert.match(await page.locator('#volume-help').textContent(),/keine Dezibel-Messung und kein garantierter Schutzbereich/);
  await page.keyboard.press('End');
  assert.equal(await page.locator('#volume').inputValue(),'100');
  assert.equal(await page.locator('#volume-value').textContent(),'100 %');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),1);
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')),'0.1');
  assert.ok(await page.locator('#volume').evaluate(n=>getComputedStyle(n).backgroundImage.includes('rgb(255, 138, 126)')),'Rote Reglerzone sichtbar');
  assert.equal(await page.locator('#volume-value').evaluate(n=>getComputedStyle(n,'::before').content),'"!"','Warnhinweis nicht nur durch Farbe');
  await capture('100-prozent');
  await resizeViewport(page,{width:320,height:264});await page.locator('#volume').scrollIntoViewIfNeeded();await capture('100-prozent-mobil');
  assert.equal(await page.locator('.radio-bar').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),0);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),1);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),true);
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('volume').value==='10');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.1);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
  assert.deepEqual(errors,[]);
});

test('Eigene und lange Themen ersetzen den dauerhaften Standard; leere Angaben stellen ihn wieder her',async t=>{
  const {page,state,errors}=await setup(t,{station:true});const topic='S'.repeat(80);
  await page.evaluate(({state,topic})=>window.__emit('mw:state',{...state,revision:2,topic}),{state,topic});
  for(const width of [1440,1024,390,320]){
    await resizeViewport(page,{width,height:160});await page.locator('#show-topic').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#show-topic').textContent(),topic);
    assert.equal(await page.locator('#show-topic').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  }
  let revision=3;
  for(const topic of ['', '   ', null, undefined]){
    await page.evaluate(s=>window.__emit('mw:state',s),{...state,revision:revision++,topic});
    assert.equal(await page.locator('#radio-topic').isVisible(),true);
    assert.equal(await page.locator('#show-topic').textContent(),'MischWerk Radio Show');
    assert.equal(await page.locator('#show-topic').getAttribute('title'),'MischWerk Radio Show');
  }
  await page.evaluate(s=>window.__emit('mw:state',s),{...state,revision:revision++,topic:'MischWerk Wunschabend'});
  assert.equal(await page.locator('#show-topic').textContent(),'MischWerk Wunschabend');
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:setTopic')),false,'Die Anzeige speichert kein erfundenes Thema');
  assert.deepEqual(errors,[]);
});

test('Fehlende Musikdaten erfinden keine Titel und zeigen einen neutralen Status; einzelne vorhandene Werte bleiben korrekt',async t=>{
  const {page,state,errors}=await setup(t,{station:true});
  for(const song of [{title:'',artist:''},{title:'Nur Titel',artist:''},{title:'',artist:'Nur Interpret'}]){
    await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+1,station:{...state.station,stationId:'test-other',streamUrl:'https://stream.example.com/test-other',metadataUrl:'https://stats.example.com/widget/radio/test-other/track/current',statusUrl:'https://stats.example.com/widget/radio/test-other'}}),state);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+2}),state);
    await page.waitForFunction(song=>document.getElementById('track-title').textContent===song.title&&document.getElementById('track-artist').textContent===song.artist,song);
    assert.equal(await page.locator('#track-title').isVisible(),!!song.title);
    assert.equal(await page.locator('.artist-copy').isVisible(),!!song.artist);
    assert.equal(await page.locator('#metadata-empty').isVisible(),!song.title&&!song.artist);
    state.revision+=3;
  }
  assert.deepEqual(errors,[]);
});

test('Neue Moderation hält beim Verkleinern den per Tastatur bedienten Arbeitsbereich offen', async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',viewport:{width:960,height:900},initialRequest:true});
  await showStudioPane(page,true);
  await page.locator('[data-outcome=done]').focus();
  await resizeViewport(page,{width:390,height:360});
  assert.equal(await page.locator('#studio-queue-tab').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('[data-outcome=done]').isVisible(),true);
  assert.equal(await page.locator('[data-outcome=done]').evaluate(n=>n===document.activeElement),true);
  await page.locator('#studio-programme-tab').click();await revealStudio(page,'#studio-topic');
  await page.locator('#studio-topic').fill('Mein Entwurf');await page.locator('#studio-topic').focus();
  await resizeViewport(page,{width:780,height:360});
  await studioSettle(page);
  assert.equal(await page.locator('#studio-topic').isVisible(),true);
  assert.equal(await page.locator('#studio-topic').inputValue(),'Mein Entwurf');
  assert.equal(await page.locator('#studio-programme-tab').getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
});

test('Neue Sendesteuerung zählt Zeichen, erkennt Rücknahme und verwirft nur den eigenen Themenentwurf', async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',viewport:{width:320,height:560}});
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,topic:'Bestätigt'}),state);
  assert.equal(await page.locator('#studio-topic-count').textContent(),'9 / 80');
  await revealStudio(page,'#studio-topic');
  await page.locator('#studio-topic').fill('N'.repeat(80));
  assert.equal(await page.locator('#studio-topic-count').textContent(),'80 / 80');
  assert.equal(await page.locator('#reset-topic').isVisible(),true);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:3,topic:'Von anderer Moderation'}),state);
  assert.equal(await page.locator('#studio-topic').inputValue(),'N'.repeat(80));
  await page.locator('#reset-topic').click();
  assert.equal(await page.locator('#studio-topic').inputValue(),'Von anderer Moderation');
  assert.equal(await page.locator('#save-topic').isDisabled(),true);
  assert.equal(await page.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:setTopic')),false);
  await page.locator('#studio-topic').fill('Entwurf');
  await page.locator('#studio-topic').fill('Von anderer Moderation');
  assert.equal(await page.locator('#reset-topic').isVisible(),false);
  assert.equal(await page.locator('#save-topic').isDisabled(),true);
  await page.locator('#studio-topic').fill('');
  await page.locator('#save-topic').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setTopic'));
  assert.equal(sent.data.topic,'');assert.equal(sent.data.previousTopic,'Von anderer Moderation');
  assert.equal(await page.locator('#reset-topic').isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});

test('Studio erhält Themenentwurf bei Fehlern und Statusupdates; nur bestätigtes Speichern beendet die Bearbeitung', async t=>{
  const {page,state,errors}=await setup(t,{view:'studio'});
  await page.locator('#studio-topic').fill('80er und 90er');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Ein anderes Thema'}),state);
  assert.equal(await page.locator('#studio-topic').inputValue(),'80er und 90er');
  await page.locator('#save-topic').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setTopic'));
  assert.equal(sent.data.topic,'80er und 90er');
  assert.equal(await page.locator('#save-topic').isDisabled(),true);
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Speichern fehlgeschlagen.'}),sent);
  assert.equal(await page.locator('#studio-topic').inputValue(),'80er und 90er');
  assert.match(await page.locator('#topic-feedback').textContent(),/fehlgeschlagen/);
  await page.locator('#save-topic').click();
  const retry=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setTopic'));
  await page.evaluate(s=>window.__emit('mw:result',{ok:true,action:s.type,requestId:s.data.requestId,message:'Thema gespeichert.'}),retry);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,topic:'80er und 90er'}),state);
  assert.equal(await page.locator('#save-topic').isDisabled(),true);
  assert.equal(await page.locator('#studio-topic').inputValue(),'80er und 90er');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,user:{nick:'Hoerer',canModerate:false}}),state);
  assert.equal(await page.locator('#studio-topic').isDisabled(),true);
  assert.equal(await page.locator('#toggle-wishes').isDisabled(),true);
  assert.deepEqual(errors,[]);
});

test('Musikfläche bleibt ohne Scrollstapel geordnet; lange Texte bleiben als Volltext im DOM und Titelhinweis erhalten',async t=>{
  const {page,state,errors}=await setup(t,{station:true});
  const song={title:'Ein sehr langer Musiktitel mit zusätzlichen Angaben und einem weiteren Interpreten',artist:'Ein sehr langer Interpret mit vielen Beteiligten'};
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent.startsWith('Ein sehr langer'));
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'EinSehrLangerModeratorNicknameMitZusatz'}}),state);
  for(const width of [1024,390,320]){
    await resizeViewport(page,{width,height:160});

    for(const selector of ['#track-title','#track-artist','#host-name']){
      assert.equal(await page.locator(selector).getAttribute('title'),await page.locator(selector).textContent());
      assert.equal(await page.locator(selector).isVisible(),true);
    }
    if(width>1350)assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollHeight>n.clientHeight+1),false);
    else for(const id of ['host-name','volume'])await page.locator('#'+id).scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#track-title').textContent(),song.title);
    assert.equal(await page.locator('#track-artist').textContent(),song.artist);
    assert.equal(await page.locator('#open-schedule').isVisible(),true);
  }
  assert.deepEqual(errors,[]);
});

test('Studio zeigt eigene Anmeldung, Ablauf und echte Abmelderechte; Verbindungsverlust sperrt Aktionen sichtbar',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',clock:true,viewport:{width:780,height:700}});
  assert.equal(await page.locator('#off-air').isDisabled(),true);
  assert.equal(await page.locator('#studio-connection').isVisible(),false);
  let next={...state,revision:2,moderator:{nick:'Otterchen',since:Date.now(),expiresAt:Date.now()+3600000,sessionKey:'session-1'},user:{...state.user,isOnAir:true,canEndModeration:true}};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  assert.equal(await page.locator('#on-air').textContent(),'Endzeit ändern');
  assert.equal(await page.locator('#handover-open').evaluate(n=>n.parentElement.id),'studio-controls','Übergabe gehört zur An-/Abmeldegruppe');
  assert.equal(await page.locator('#studio-handover-card').isVisible(),false,'Ohne empfangene Notiz gibt es keine separate Übergabezeile');
  assert.equal(await page.locator('#off-air').isDisabled(),false);
  assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),true);
  assert.match(await page.locator('#studio-session').textContent(),/Angemeldet bis .* Uhr/);
  await page.locator('#on-air').click();
  await page.locator('#studio-end-mode').selectOption('openEnd');
  await page.locator('#studio-end-save').click();
  const renew=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:onAir'));
  assert.equal(renew.data.expectedModerator,'session-1');
  await page.evaluate(s=>window.__emit('mw:result',{ok:true,action:s.type,requestId:s.data.requestId,message:'Studio-Anmeldung bestätigt.'}),renew);
  next={...next,revision:3,user:{nick:'Otterchen',canModerate:true,isOnAir:false,canEndModeration:false}};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  assert.equal(await page.locator('#off-air').isDisabled(),true,'Gleicher Nick ist kein Rechtebeweis');
  assert.match(await page.locator('#off-air').getAttribute('title'),/aktive Moderation.*Besitzer/);
  next={...next,revision:4,user:{...next.user,canEndModeration:true}};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  assert.equal(await page.locator('#off-air').textContent(),'Moderation beenden');
  await page.locator('#off-air').click();
  const end=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:offAir'));
  assert.equal(end.data.expectedModerator,'session-1');
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Moderation inzwischen geändert.'}),end);
  await page.clock.fastForward(66000);
  assert.equal(await page.locator('#studio-connection').textContent(),'Verbindung fehlt');
  assert.equal(await page.locator('#studio-host').textContent(),'Moderation unbestätigt');
  assert.equal(await page.locator('#studio-session').isVisible(),false);
  assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),false);
  for(const id of ['on-air','off-air','toggle-wishes','save-topic','prev-page','next-page'])assert.equal(await page.locator('#'+id).isDisabled(),true,id);
  await showStudioPane(page,true);
  await page.locator('#refresh-queue').click();
  assert.match(await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:refresh').data.requestId),/^refresh-/);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:5,refreshRequestId:__sent.findLast(e=>e.type==='mw:refresh').data.requestId}),next);
  assert.equal(await page.locator('#studio-connection').isVisible(),false);
  assert.equal(await page.locator('#toggle-wishes').isDisabled(),false);
  assert.deepEqual(errors,[]);
});

test('Studio-Warteschlange behält Tastaturfokus und sperrt Seitenwechsel während bestätigungspflichtiger Bearbeitung',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio'});
  const item={id:17,text:'a-ha – Take On Me',nick:'Musikfreund',createdAt:Date.now(),delivery:null};
  const next={...state,revision:2,queue:[item],queueTotal:2,pages:2,page:0};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  await showStudioPane(page,true);
  await page.locator('[data-outcome="done"]').evaluate(node=>{window.__focusedWish=node;node.focus();});
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:3,queue:[{...s.queue[0],delivery:{nick:'Otterchen',at:Date.now()}}]}),next);
  assert.equal(await page.evaluate(()=>document.activeElement===window.__focusedWish),true,'Empfangsquittung ersetzt keine bediente Schaltfläche');
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:4}),next);
  assert.equal(await page.evaluate(()=>document.activeElement===window.__focusedWish),true,'Statusaktualisierung erhält Fokus');
  await page.locator('#refresh-queue').click();
  const refreshId=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:refresh').data.requestId);
  assert.match(refreshId,/^refresh-/);
  await page.evaluate(({s,id})=>window.__emit('mw:state',{...s,revision:4,refreshRequestId:id}),{s:next,id:refreshId});
  await page.locator('[data-outcome="discarded"]').click();
  const discard=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:resolveRequest'));
  assert.equal(discard.data.id,17);assert.equal(discard.data.outcome,'discarded');
  assert.equal(await page.locator('#next-page').isDisabled(),true);
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Speichern fehlgeschlagen.'}),discard);
  assert.equal(await page.locator('.request-text').textContent(),item.text);
  assert.equal(await page.locator('#next-page').isDisabled(),false);
  await page.locator('[data-outcome="done"]').click();
  const done=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:resolveRequest'));
  assert.equal(done.data.id,17);assert.equal(done.data.outcome,'done');
  await page.evaluate(s=>window.__emit('mw:result',{ok:true,action:s.type,requestId:s.data.requestId,message:'Wunsch als erledigt entfernt.'}),done);
  assert.match(await page.locator('#notice').textContent(),/erledigt/);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:5,queue:[],queueTotal:0,pages:1}),next);
  assert.equal(await page.locator('#queue-pagination').isVisible(),false);
  assert.match(await page.locator('#request-queue').textContent(),/keine Musikwünsche/);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:6,user:{nick:'Hoerer',canModerate:false}}),next);
  assert.equal(await page.locator('#request-queue').textContent(),'');
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:7,queue:[],queueTotal:0,pages:1}),next);
  assert.match(await page.locator('#request-queue').textContent(),/keine Musikwünsche/);
  assert.deepEqual(errors,[]);
});

test('Studio sendet erwartete Werte und erhält den Themenentwurf bei paralleler Änderung und Zeitüberschreitung',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',clock:true});
  await page.locator('#studio-topic').fill('Mein Mix');await page.locator('#save-topic').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setTopic'));
  assert.equal(sent.data.previousTopic,'');
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Das Thema wurde inzwischen geändert. Dein Entwurf bleibt erhalten.'}),sent);
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,topic:'Sendung des Kollegen'}),state);
  assert.equal(await page.locator('#studio-topic').inputValue(),'Mein Mix');
  await page.locator('#save-topic').click();
  assert.equal(await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setTopic').data.previousTopic),'Sendung des Kollegen');
  await page.clock.fastForward(16000);
  assert.equal(await page.locator('#studio-topic').inputValue(),'Mein Mix');
  assert.match(await page.locator('#topic-feedback').textContent(),/keine Bestätigung/);
  await page.locator('#toggle-wishes').click();
  const toggle=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:setRequests'));
  assert.equal(toggle.data.previousEnabled,true);assert.equal(toggle.data.enabled,false);
  assert.deepEqual(errors,[]);
});

test('Studio und maximale Wunschtexte sind bei knappen Fenstermaßen ohne horizontale Überbreite per Tastatur erreichbar',async t=>{
  for(const width of [780,390,320]){
    const {page,state,errors}=await setup(t,{view:'studio',viewport:{width,height:568}});
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'LangerModeratorNickname',expiresAt:Date.now()+3600000},queue:[{id:1,nick:'Hörer',text:'W'.repeat(300),createdAt:Date.now()}],queueTotal:1,pages:1}),state);
    await page.locator('#studio-queue-tab').waitFor({state:'visible'});await page.locator('#studio-queue-tab').click();
    await revealStudio(page,'[data-outcome=done]');assert.equal(await page.locator('[data-outcome=done]').isVisible(),true);
    assert.equal(await readStudioText(page,'.queue-copy h3'),'W'.repeat(300));
    assert.equal(await page.locator('#queue-pagination button').first().isVisible(),false,'Einzelner Wunsch braucht keine Vor/Zurück-Aktionen');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  }
});

async function naturalContentHeight(page) {
  await page.waitForTimeout(100);
  const height=await page.locator('.dialog-shell').evaluate(node=>Math.ceil(node.getBoundingClientRect().height));
  await validDialogSizes(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.dialog-shell').evaluate(node=>node.scrollWidth>node.clientWidth),false);
  return height;
}

test('Wunschbox behält ihren nativen Rahmen und enthält keine alte Wunschliste', async t => {
  for(const view of ['wishes']) {
    const {page,state,errors}=await setup(t,{view,k3:false,viewport:{width:view==='wishes'?520:780,height:700}});
    const emptyHeight=await naturalContentHeight(page);
    if(view==='wishes'){assert.ok(emptyHeight<=460);assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-requests').count(),0);}
    const item={id:1,artist:'Ä'.repeat(80),title:'T'.repeat(80),message:'Gruß '.repeat(40),nick:'EinSehrLangerModeratorUndHoererNickname',createdAt:Date.now()};
    const populated={...state,revision:4,myRequests:[item],myTotal:2,myPage:0,myPages:2,queue:[item],queueTotal:50,pages:50,page:0};
    await page.evaluate(state=>window.__emit('mw:state',state),populated);
    const populatedHeight=await naturalContentHeight(page);
    assert.ok(populatedHeight>=emptyHeight);
    if(view==='wishes'){assert.equal(populatedHeight,emptyHeight,'Alte Wünsche vergrößern das vereinfachte Fenster nicht');}
    assert.ok(populatedHeight<=1000,'Popup bleibt innerhalb der Hostgrenze: '+populatedHeight);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:5}),state);
    assert.equal(await naturalContentHeight(page),emptyHeight);
    assert.deepEqual(errors,[]);
  }
});

test('Moderation und Radio-Team erhalten bei Inhalt und Rückmeldungen ihre nativen Fenstermaße', async t => {
  for (const [view, width, height] of [['studio', 780, 680], ['team', 560, 560]]) {
    const { page, state, errors } = await setup(t, { view, k3: false, clock: true, viewport: { width, height } });
    await page.clock.fastForward(3000);
    await page.clock.runFor(100);
    await validDialogSizes(page);
    await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 2, topic: 'S'.repeat(80),
      queue: [{ id: 1, nick: 'N'.repeat(50), text: 'W'.repeat(300), createdAt: Date.now() }], queueTotal: 2, pages: 2,
      radioModerators: [1, 2, 3, 4, 5].map(userId => ({ userId, nick: 'N'.repeat(50) })),
      radioModeratorTotal: 6, radioModeratorPages: 2 }), state);
    await page.clock.fastForward(2000);
    await page.clock.runFor(100);
    if (view === 'studio') {
      if (await page.locator('#studio-queue-tab').isVisible()) { await page.locator('#studio-queue-tab').click(); }
      await page.clock.runFor(100);
      await page.locator('#next-page').click();
      assert.equal(await page.evaluate(() => window.__sent.findLast(event => event.type === 'mw:refresh').data.page), 1);
      await revealStudio(page,'[data-outcome=done]');
      await page.locator('[data-outcome=done]').click();
      const sent = await page.evaluate(() => window.__sent.findLast(event => event.type === 'mw:resolveRequest'));
      await page.evaluate(sent => window.__emit('mw:result', { ok: true, action: sent.type,
        requestId: sent.data.requestId, message: 'Wunsch als erledigt entfernt.' }), sent);
    } else {
      await page.locator('[data-radio-moderator-id="5"]').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('[data-radio-moderator-id="5"]').isVisible(), true);
    }
    await page.clock.fastForward(7000);
    await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 3 }), state);
    await page.clock.fastForward(2000);
    await validDialogSizes(page);
    assert.deepEqual(page.viewportSize(), { width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
  }
});

test('Langsame Styles und Module lösen in Verwaltungsfenstern keine vorläufigen Größenänderungen aus', async t => {
  for (const view of ['studio', 'team']) {
    for (const loadingDelay of ['css', 'script', 'module', 'stylesheet']) {
      const { page, loadingSnapshot, errors } = await setup(t, { view, k3: false, loadingDelay, loadingPause: 180,
        viewport: { width: view === 'studio' ? 780 : 560, height: view === 'studio' ? 680 : 560 } });
      assert.equal(loadingSnapshot.initialized, false);
      assert.deepEqual(loadingSnapshot.sizes, [], view + '/' + loadingDelay + ': keine Messung im unvollständigen Ladezustand');
      await page.waitForTimeout(100);
      if(view==='studio'||view==='team'){await validDialogSizes(page);}else{assert.deepEqual(await page.evaluate(() => window.__sizes), []);}
      assert.deepEqual(errors, []);
    }
  }
});

test('Niedrige STAPP-Verwaltungsfenster halten alle Aktionen mit Reitern und Scrollen erreichbar', async t => {
  for (const view of ['studio', 'team']) {
    const { page, state, errors } = await setup(t, { view, k3: false,
      viewport: { width: view === 'studio' ? 780 : 320, height: 360 } });
    await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 2,
      queue: [{ id: 1, nick: 'Hörer', text: 'W'.repeat(300), createdAt: Date.now() }], queueTotal: 2, pages: 2 }), state);
    if (view === 'studio') {
      await page.locator('#studio-queue-tab').waitFor({ state: 'visible' });
      await page.locator('#studio-queue-tab').click();
      await revealStudio(page,'[data-outcome=done]');
      assert.equal(await page.locator('[data-outcome=done]').isVisible(), true);
      await page.locator('#studio-programme-tab').click();
    }
    for (const selector of view === 'studio' ? ['#on-air', '#toggle-wishes', '#studio-topic'] :
      ['#radio-moderator-nick', '#add-radio-moderator', '#refresh-radio-team']) {
      if(view==='studio')await revealStudio(page,selector);
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.ok(await page.locator(selector).evaluate(node => {
        const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight + 1;
      }), selector + ' bleibt erreichbar');
    }
    if(view==='studio'||view==='team'){await validDialogSizes(page);}else{assert.deepEqual(await page.evaluate(() => window.__sizes), []);}
    assert.deepEqual(errors, []);
  }
});
test('Feste K3-Popups halten Rückmeldungen und Aktionen auch unterhalb ihrer Inhaltshöhe erreichbar', async t => {
  for (const view of ['wishes', 'studio', 'team']) {
    const { page, state, errors } = await setup(t, { view, k3: true, viewport: { width: view === 'studio' ? 780 : 320, height: 360 } });
    if (view === 'wishes') {
      await page.locator('#wish-text').fill('Aha - Take on me (Testwunsch)');
      await page.locator('#submit-wish').click();
      const sent = await page.evaluate(() => window.__sent.findLast(event => event.type === 'mw:wish.submit'));
      await page.evaluate(data => window.__emit('mw:wish.receipt', { submissionId: data.submissionId, accepted: true,
        message: 'Dein Musikwunsch wurde an die Moderation gesendet.' }), sent.data);
      await page.waitForTimeout(100);
      assert.ok(await page.locator('#wish-feedback').evaluate(node => node.getBoundingClientRect().bottom <= innerHeight + 1),
        JSON.stringify(await page.evaluate(() => ({ box: document.getElementById('wish-feedback').getBoundingClientRect().toJSON(), body: [document.body.clientHeight, document.body.scrollHeight, document.body.scrollTop], root: document.documentElement.getBoundingClientRect().toJSON() }))));
      assert.equal(await page.locator('#wish-text').inputValue(), '');
    } else if (view === 'studio') {
      await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 2, queueTotal: 2, pages: 2,
        queue: [{ id: 1, nick: 'Hörer', text: 'Langer Wunsch '.repeat(22), createdAt: Date.now() }] }), state);
      await page.locator('#studio-programme-tab').waitFor();
      await page.locator('#studio-queue-tab').click();
      assert.equal(await page.locator('#on-air').isVisible(), false);
      await revealStudio(page,'[data-outcome=done]');
      await page.locator('[data-outcome=done]').click();
      assert.equal(await page.evaluate(() => window.__sent.findLast(event => event.type === 'mw:resolveRequest').data.outcome), 'done');
      await page.locator('#studio-programme-tab').click();
    }
    const selectors = view === 'team' ? ['#radio-moderator-nick', '#add-radio-moderator', '#refresh-radio-team'] :
      view === 'studio' ? ['#on-air', '#toggle-wishes', '#save-topic'] : ['#wish-text', '#submit-wish'];
    for (const selector of selectors) {
      if(view==='studio')await revealStudio(page,selector);
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.ok(await page.locator(selector).evaluate(node => {
        const box = node.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight + 1 && node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), selector + ' bleibt erreichbar');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if(view==='studio'||view==='team'){await validDialogSizes(page);}else{assert.deepEqual(await page.evaluate(() => window.__sizes), []);}
    assert.deepEqual(errors, []);
  }
});

test('Schmale Popups halten maximale Texte und Aktionen mit Reitern und nativem Scrollen erreichbar', async t => {
  for(const view of ['wishes','studio']){
    const {page,state,errors}=await setup(t,{view,k3:true,viewport:{width:320,height:740}});
    const item={id:1,artist:'Ä'.repeat(80),title:'T'.repeat(80),message:'G'.repeat(200),nick:'SehrLangerHoererNicknameMitZusatz',createdAt:Date.now()};
    const next={...state,revision:2,myRequests:view==='wishes'?[]:[item],queue:[item],queueTotal:50,pages:50};
    await page.evaluate(state=>window.__emit('mw:state',state),next);
    if(view==='wishes'){
      await page.locator('#wish-text').fill('G'.repeat(300));
      assert.ok(await naturalContentHeight(page)<=1000);
      assert.equal(await page.locator('#wish-text').evaluate(n=>n.scrollHeight>n.clientHeight),false);
      await page.locator('#wish-text').fill(('Gruß\n').repeat(40));
      assert.ok(await naturalContentHeight(page)<=1000);
      assert.equal(await page.locator('#wish-form').isVisible(),true);
      assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-next').count(),0);
    }else{
      assert.ok(await naturalContentHeight(page)<=1000);
      await page.locator('#studio-queue-tab').click();
      assert.equal(await page.locator('#on-air').isVisible(),false);
      await revealStudio(page,'[data-outcome=done]');
      assert.equal(await page.locator('[data-resolve]').first().isVisible(),true);
    }
    if (view === 'studio') {
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      for (const selector of ['[data-outcome=done]', '[data-outcome=discarded]', '#next-page']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        assert.ok(await page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}));
      }
    } else { assert.ok(await naturalContentHeight(page)<=1000); }
    if (view === 'studio') { await validDialogSizes(page); }
    else { assert.deepEqual(await page.evaluate(()=>window.__sizes),[]); }
    assert.deepEqual(errors,[]);
  }
});
test('Ein einziges Wunschfeld sendet nur Text und zeigt Versandfehler dauerhaft ohne Entwurfsverlust', async t=>{
  const {page,errors}=await setup(t,{view:'wishes'});
  assert.equal(await page.locator('#wish-form textarea,#wish-form input').count(),1);
  await page.locator('#wish-text').fill('Mein Song, bitte mit Grüßen an alle!');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:wish.submit'));
  assert.equal(sent.data.text,'Mein Song, bitte mit Grüßen an alle!');
  assert.deepEqual(Object.keys(sent.data).sort(),['submissionId','text']);
  assert.match(await page.locator('#wish-feedback').textContent(),/Wird gesendet/);
  assert.equal(await page.locator('#wish-feedback').evaluate(n=>n.classList.contains('pending')),true);
  await page.evaluate(s=>window.__emit('mw:wish.receipt',{accepted:false,submissionId:s.data.submissionId,message:'Wunschbox geschlossen.'}),sent);
  assert.equal(await page.locator('#wish-text').inputValue(),sent.data.text);
  assert.match(await page.locator('#wish-feedback').textContent(),/geschlossen/);
  assert.equal(await page.locator('#wish-feedback').getAttribute('role'),'alert');
  assert.equal(await page.locator('#wish-feedback').getAttribute('aria-live'),'assertive');
  assert.equal(await page.locator('#wish-feedback').evaluate(n=>n.classList.contains('error')),true);
  assert.deepEqual(errors,[]);
});

test('Kompakte Wunschbox zeigt nur das Formular und weist Links ohne Versand oder Entwurfsverlust ab',async t=>{
  const {page,errors}=await setup(t,{view:'wishes',k3:false,viewport:{width:520,height:500}});
  assert.equal(await page.locator('#wish-form textarea,#wish-form input').count(),1);
  assert.match(await page.locator('label[for="wish-text"]').textContent(),/Interpret und Titel/);
  assert.equal(await page.locator('#wish-rules').textContent(),'Welcher Song darf’s sein?');
  assert.equal(await page.locator('.my-wishes,#wish-list-tab,#wish-nick,#my-requests').count(),0);
  assert.doesNotMatch(await page.locator('.dialog-shell').innerText(),/Einfach drauflosschreiben|direkt ans Studio|Dein Knuddels-Nick|Deine Wünsche/);
  for(const width of [520,320]){
    await resizeViewport(page,{width,height:500});
    const height=await naturalContentHeight(page);assert.ok(height<=500,'Lesbares Wunschfenster bei '+width);
    if(process.env.MISCHWERK_CAPTURE_WISHES){
      const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'wunschbox');fs.mkdirSync(folder,{recursive:true});
      await page.screenshot({path:path.join(folder,'Wunschbox-'+width+'.png')});
    }
  }
  for(const text of ['https://youtu.be/123','Band – Song www.example.com','open.spotify.com/track/123','Band – Song example.de','[Song](example.org)']){
    await page.locator('#wish-text').fill(text);await page.locator('#submit-wish').click();
    assert.match(await page.locator('#wish-feedback').textContent(),/Keine Links/);
    assert.equal(await page.locator('#wish-text').inputValue(),text);
    assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:wish.submit')),false);
    assert.ok(await naturalContentHeight(page)<=600,'Fehlerrückmeldung bleibt erreichbar');
  }
  await page.locator('#wish-text').fill('will.i.am – Scream & Shout');await page.locator('#submit-wish').click();
  assert.equal(await page.evaluate(()=>window.__sent.find(e=>e.type==='mw:wish.submit').data.text),'will.i.am – Scream & Shout');
  assert.deepEqual(errors,[]);
});
test('Versandbestätigung verschwindet nach fünf Sekunden; Fehler und laufender Versand bleiben sichtbar', async t=>{
  const {page,state}=await setup(t,{view:'wishes',clock:true});
  await page.locator('#wish-text').fill('Bitte unseren Lieblingssong.');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:wish.submit'));
  const item={id:9,text:sent.data.text,nick:'Otterchen',createdAt:Date.now(),delivery:null};
  await page.evaluate(({s})=>window.__emit('mw:wish.receipt',{accepted:true,submissionId:s.data.submissionId,message:'Dein Musikwunsch wurde an die Moderation gesendet.'}),{s:sent});
  assert.equal(await page.locator('#wish-text').inputValue(),'');
  assert.match(await page.locator('#wish-feedback').textContent(),/an die Moderation gesendet/);
  assert.equal(await page.locator('#wish-feedback').getAttribute('role'),'status');
  assert.equal(await page.locator('#wish-feedback').getAttribute('aria-live'),'polite');
  assert.equal(await page.locator('#wish-feedback').evaluate(n=>n.classList.contains('success')),true);
  assert.equal(await page.locator('#wish-feedback').evaluate(n=>getComputedStyle(n,'::before').content),'"✓"');
  assert.equal(await page.locator('#wish-feedback').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=13),true);
  await page.evaluate(({state,item})=>window.__emit('mw:state',{...state,revision:3,myRequests:[],requestFeedback:null,queue:[]}),{state,item});
  assert.match(await page.locator('#wish-feedback').textContent(),/an die Moderation gesendet/);
  assert.equal(await page.locator('.delivery-status').count(),0);
  await page.evaluate(()=>window.__emit('mw:wish.receipt',{accepted:true,submissionId:'fremd',message:'An Fake übergeben.'}));
  assert.doesNotMatch(await page.locator('#wish-feedback').textContent(),/Fake/);
  assert.ok(await naturalContentHeight(page)<760);
  await page.clock.runFor(6000);
  assert.equal(await page.locator('#wish-feedback').isVisible(),false);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4}),state);
  assert.equal(await page.locator('#wish-feedback').isVisible(),false,'Ein Snapshot zeigt die alte Erfolgsmeldung nicht erneut');
  await page.locator('#wish-text').fill('https://example.com');await page.locator('#submit-wish').click();
  await page.clock.runFor(6000);assert.equal(await page.locator('#wish-feedback.error').isVisible(),true);
  await page.locator('#wish-text').fill('Ein weiterer Song');await page.locator('#submit-wish').click();
  await page.clock.runFor(6000);assert.equal(await page.locator('#wish-feedback.pending').isVisible(),true);
});
test('Empfang wird nur für sichtbare Moderationswünsche bestätigt', async t=>{
  for(const view of ['radio','wishes','studio']){
    const {page,state}=await setup(t,{view,viewport:{width:320,height:740}});
    const item={id:42,text:'Mein Musikwunsch',nick:'Musikfreund',createdAt:Date.now(),delivery:null};
    await page.evaluate(({state,item})=>window.__emit('mw:state',{...state,revision:3,queue:[item],queueTotal:1}),{state,item});
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:ackRequest')),false);
    if(view==='studio'){
      await page.locator('#studio-queue-tab').click();
      await page.waitForFunction(()=>window.__sent.some(e=>e.type==='mw:ackRequest'));
      assert.equal(await page.evaluate(()=>window.__sent.find(e=>e.type==='mw:ackRequest').data.id),42);
      assert.match(await page.locator('.request-sender').textContent(),/Musikfreund/);
    }
  }
});
test('Vollständiger Browser-Roundtrip liefert Wünsche, Thema und Wunschbox-Steuerung zwischen Studio und Hörern', async t=>{
  const {spawn}=require('node:child_process');
  const child=spawn(process.execPath,['tools/preview/server.cjs'],{cwd:root,env:{...process.env,MISCHWERK_PREVIEW_PORT:'0'},windowsHide:true});
  t.after(()=>child.kill());
  const base=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Preview startup timeout')),8000);
    child.on('error',error=>{clearTimeout(timeout);reject(error);});
    child.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});
  });
  const context=await browser.newContext({viewport:{width:780,height:740}});t.after(()=>context.close());
  const listener=await context.newPage(),mod=await context.newPage();
  await listener.goto(base+'/preview?role=listener&view=wishes');
  await listener.locator('#wish-fields:not([disabled])').waitFor();
  const nick=await listener.evaluate(()=>Client.pageData.user.nick);
  await listener.locator('#wish-text').fill('Browser-Roundtrip: Bitte unseren Lieblingssong!');
  await listener.locator('#submit-wish').click();
  await listener.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  await mod.goto(base+'/preview?role=moderator&view=studio');
  for(let i=0;i<2;i++){
    await showStudioPane(mod,true);
    await mod.locator('#next-page:not([disabled])').waitFor();
    await mod.locator('#next-page').click();
    await mod.locator('#page-label').filter({hasText:'Wunsch '+(i+2)+' /'}).waitFor();
  }
  await mod.locator('.request-text').filter({hasText:'Browser-Roundtrip'}).waitFor();
  assert.match(await mod.locator('.request-sender').textContent(),new RegExp(nick.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
  await mod.waitForTimeout(150);
  await listener.evaluate(()=>Client.sendEvent('mw:refresh',{page:0}));
  await listener.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  assert.equal(await listener.locator('.delivery-status').count(),0);
  const radio=await context.newPage();
  await radio.goto(base+'/preview?role=listener&view=radio');
  const ownerRadio=await context.newPage();
  await ownerRadio.goto(base+'/preview?role=moderator&view=radio');
  await previewCurtain(ownerRadio);
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.waitForFunction(()=>document.documentElement.dataset.curtain==='open');
  await radio.locator('#open-wishes:not([disabled])').waitFor();
  await showStudioPane(mod,false);
  await mod.locator('#studio-topic').fill('80er und 90er');
  await mod.locator('#save-topic').click();
  await mod.locator('#topic-feedback').filter({hasText:'Thema gespeichert.'}).waitFor();
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#show-topic').filter({hasText:'80er und 90er'}).waitFor();
  await mod.locator('#toggle-wishes').click();
  await mod.locator('#toggle-wishes[aria-checked="false"]').waitFor();
  assert.equal(await mod.locator('#toggle-label').textContent(),'Aus');
  await listener.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await listener.locator('#wish-fields[disabled]').waitFor();
  assert.match(await listener.locator('#wish-hint').textContent(),/deaktiviert/);
  await mod.locator('#toggle-wishes').click();
  await mod.locator('#toggle-wishes[aria-checked="true"]').waitFor();
  assert.equal(await mod.locator('#toggle-label').textContent(),'Ein');
  await listener.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await listener.locator('#wish-fields:not([disabled])').waitFor();
  assert.equal(await mod.locator('#on-air').isDisabled(), true, 'Laufende Demo-Sendung kann nur über Übergabe gewechselt werden');
  await mod.locator('#off-air').click(); // Channelinhaber beendet die vorhandene Demo-Moderation ausdrücklich.
  await mod.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
  await mod.locator('#on-air').click();
  await mod.locator('#on-air').filter({hasText:'Endzeit ändern'}).waitFor();
  assert.equal(await mod.locator('#off-air').isDisabled(),false);
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#host-name').filter({hasText:'Testleitung'}).waitFor();
  assert.equal(await radio.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),true);
  await mod.locator('#off-air').click();
  await mod.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
  assert.equal(await mod.locator('#off-air').isDisabled(),true);
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#on-air-sign').filter({hasText:'Radio MischWerk'}).waitFor();
  assert.equal(await radio.locator('#host-name').isVisible(),false);
  await radio.locator('#radio-topic').waitFor({state:'visible'});
  await radio.locator('#show-topic').filter({hasText:'MischWerk Radio Show'}).waitFor();
  assert.equal(await mod.locator('#studio-topic').inputValue(),'');
  assert.equal(await radio.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),false);
  await showStudioPane(mod,true);
  await mod.locator('.request-text').filter({hasText:'Browser-Roundtrip'}).waitFor();
  await mod.locator('[data-outcome="discarded"]').click();
  await mod.locator('#notice').filter({hasText:'Wunsch verworfen.'}).waitFor();
  await mod.locator('#queue-count').filter({hasText:'2'}).waitFor();
  assert.equal((await mod.locator('.request-text').textContent()).includes('Browser-Roundtrip'),false);
});
async function waitRadioPlaying(page) {
  await page.waitForFunction(()=>document.getElementById('stream-label').textContent==='LIVE' &&
    !document.getElementById('radio-audio').paused && document.getElementById('radio-audio').currentTime>0);
}
test('Native Radiowiedergabe startet leise, erhält manuelle Lautstärke und begrenzt jeden Neustart vor dem ersten Ton', async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1200,height:160}});
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  await page.evaluate(()=>{
    const audio=document.getElementById('radio-audio'),play=audio.play;
    window.__playVolumes=[];
    audio.play=function(){window.__playVolumes.push(this.volume);return play.apply(this,arguments);};
    const range=document.getElementById('volume');range.value='90';range.dispatchEvent(new Event('input'));
  });
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.1],'Schon beim Aufruf von audio.play höchstens 10 Prozent');
  assert.equal(await page.locator('#volume-value').textContent(),'10 %');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://stream.example.com/test-radio');
  assert.equal(await page.locator('#track-title').textContent(),'Testtitel');
  assert.equal(await page.locator('#track-artist').textContent(),'Testinterpret');
  await page.locator('#volume').evaluate(node=>{node.value='43';node.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  await page.evaluate(()=>{const audio=document.getElementById('radio-audio');audio.dispatchEvent(new Event('waiting'));audio.dispatchEvent(new Event('playing'));});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43,'Nachladen setzt die bewusst gewählte Lautstärke nicht zurück');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),true);
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.1);
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.1,.1]);
  await page.locator('#volume').evaluate(node=>{node.value='5';node.dispatchEvent(new Event('input'));});
  await page.locator('#play-button').click();await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.05,'Niedrigere Werte bleiben beim Neustart erhalten');
  await page.locator('#volume').evaluate(node=>{node.value='90';node.dispatchEvent(new Event('input'));});
  await page.locator('#mute-button').click();
  await page.locator('#play-button').click();await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0,'Stumm bleibt beim Neustart stumm');
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.1,'Nach stummem Neustart kein alter hoher Unmute-Wert');
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.1,.1,.05,0]);
  assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
  assert.equal(await page.locator('#radio-audio').getAttribute('crossorigin'),null);
  assert.deepEqual(errors,[]);
});
test('Ansichtswechsel und Popup unterbrechen keinen Radioton; Seitenende stoppt ihn', async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1200,height:160}});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('waiting')));
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  await resizeViewport(page,{width:900,height:160});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),false);
  await resizeViewport(page,{width:1500,height:160});
  await page.evaluate(()=>{window.__testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get(){return window.__testHidden;}});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),false);
  await page.evaluate(()=>{window.__testHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.__originalAudio=document.getElementById('radio-audio');});
  await page.locator('#open-wishes').click();
  assert.equal(await page.evaluate(()=>window.__originalAudio===document.getElementById('radio-audio')),true);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),false);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),true);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),true);
  assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
  assert.deepEqual(errors,[]);
});
test('Radioton funktioniert ohne Web-Audio-Schnittstelle und ohne Stream-CORS-Freigabe', async t=>{
  for(const cors of [true,false]){
    const {page,errors}=await setup(t,{station:true,realAudio:true,cors,viewport:{width:1200,height:160}});
    if(!cors){await page.evaluate(()=>{window.AudioContext=window.webkitAudioContext=undefined;});}
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    assert.equal(await page.locator('#radio-audio').getAttribute('crossorigin'),null);
    assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.1);
    assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
    assert.deepEqual(errors,[]);
  }
});

test('Verspätete Titelantwort startet nach Stoppen keine Wiedergabe', async t=>{
  const {page,releaseSong,errors}=await setup(t,{station:true,delayedSong:true});
  await page.locator('#play-button').click();await page.locator('#play-button').click();
  const response=page.waitForResponse('https://stats.example.com/widget/radio/test-radio/track/current');releaseSong();await response;
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.evaluate(()=>window.__rejects.length),1);
  assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);
});


test('STREAMPANEL übernimmt getrennte Titel-/Interpretenfelder, leere Werte und Live-Sendungstitel unverändert', async t=>{
  const {page,errors}=await setup(t,{station:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  let payload;
  const endpoint='https://stats.example.com/widget/radio/test-radio/track/current';
  await page.route(endpoint,route=>route.fulfill({json:payload}));
  for(const [body,title,artist] of [
    [{title:'Take On Me',artist:'a-ha'},'Take On Me','a-ha'],
    [{title:'Song - Live - Remix',artist:'Band - Name'},'Song - Live - Remix','Band - Name'],
    [{title:'Nur ein Titel'},'Nur ein Titel',''],
    [{artist:'Nur Interpret'},'','Nur Interpret'],
    [{title:'Sendung - mit Gast',artist:'',is_live:true,forced_title:true},'Sendung - mit Gast',''],
    [{title:'<img src=x onerror=alert(1)>',artist:'<script>Fake</script>'},'<img src=x onerror=alert(1)>','<script>Fake</script>'],
    [{title:{bad:true},artist:42},'',''],
    [{title:'  ',artist:null},'',''],
    [null,'','']
  ]){
    payload=body;
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(({title,artist})=>document.getElementById('track-title').textContent===title&&document.getElementById('track-artist').textContent===artist,{title,artist});
    assert.equal(await page.locator('#track-label').isVisible(),!!title);
    assert.equal(await page.locator('.artist-copy').isVisible(),!!artist);
  }
  assert.equal(await page.locator('#track-title img,#track-artist script').count(),0);
  assert.equal(await page.locator('#on-air-sign').evaluate(n=>document.body.classList.contains('moderator-on-air')),false,'STREAMPANEL is_live vergibt keine Knuddels-Moderation');
  assert.deepEqual(errors,[]);
});

test('STREAMPANEL-Metadatenfehler erhalten den letzten Titel und stoppen keinen Radioton; leere gültige Antwort löscht Angaben', async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  let mode='valid';
  const endpoint='https://stats.example.com/widget/radio/test-radio/track/current';
  await page.route(endpoint,route=>{
    if(mode==='network'){return route.abort();}
    if(mode==='http'){return route.fulfill({status:429,body:'Too many requests'});}
    if(mode==='invalid'){return route.fulfill({contentType:'application/json',body:'not json'});}
    if(mode==='error'){return route.fulfill({json:{status:'error',message:'unavailable'}});}
    return route.fulfill({json:mode==='empty'?null:{title:'Titel',artist:'Interpret'}});
  });
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#track-title').filter({hasText:'Titel'}).waitFor();
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  for(mode of ['network','http','invalid','error']){
    await page.evaluate(()=>{document.getElementById('metadata-status').textContent='';document.dispatchEvent(new Event('visibilitychange'));});
    await page.locator('#metadata-status').filter({hasText:'nicht erreichbar'}).waitFor({state:'attached'});
    assert.equal(await page.locator('#track-title').textContent(),'Titel');
    assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
    assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
  }
  mode='empty';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#track-title').waitFor({state:'hidden'});
  assert.equal(await page.locator('#track-artist').textContent(),'');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  mode='valid';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#track-title').filter({hasText:'Titel'}).waitFor();
  assert.deepEqual(errors,[]);
});

test('Änderungen und Fehler ausschließlich der Datenanschlüsse erhalten die Audioverbindung',async t=>{
 const {page,state,errors}=await setup(t,{station:true,realAudio:true});await page.locator('#play-button').click();await waitRadioPlaying(page);
 const source=await page.locator('#radio-audio').getAttribute('src');let revision=2;
 await page.locator('#radio-audio').evaluate(a=>{window.__newAudioLoads=0;a.addEventListener('loadstart',()=>__newAudioLoads++);});
 for(const change of [{metadataUrl:'https://foreign.example.com/invalid'},{historyUrl:''},{fields:{...state.station.fields,title:'changed'}},{statusUrl:''}]){
  await page.evaluate(({state,change,revision})=>__emit('mw:state',{...state,revision,station:{...state.station,...change}}),{state,change,revision:revision++});
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),source);assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
 }
 assert.equal(await page.evaluate(()=>__newAudioLoads),0);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);
});

test('STREAMPANEL-Senderwechsel stoppt den alten Stream; verspätete Antworten überschreiben keine neuen Titel', async t=>{
  const {page,state,releaseSong,errors}=await setup(t,{station:true,delayedSong:true});
  await page.locator('#play-button').click();
  const stream='https://stream.example.com/other-radio',metadata='https://stats.example.com/widget/radio/other-radio/track/current';
  await page.route(metadata,route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neuer Interpret'}}));
  await page.evaluate(({state,stream,metadata})=>window.__emit('mw:state',{...state,revision:2,station:{...state.station,stationId:'other-radio',streamUrl:stream,stationUrl:stream,metadataUrl:metadata,statusUrl:'https://stats.example.com/widget/radio/other-radio'}}),{state,stream,metadata});
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  const oldResponse=page.waitForResponse('https://stats.example.com/widget/radio/test-radio/track/current');releaseSong();await oldResponse;
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#track-title').textContent(),'Neuer Titel');
  assert.equal(await page.locator('#track-artist').textContent(),'Neuer Interpret');
  await page.locator('#play-button').click();assert.equal(await page.locator('#radio-audio').getAttribute('src'),stream);
  assert.deepEqual(errors,[]);
});

test('STREAMPANEL blockiert manipulierte Hörer-/API-Adressen und Zugangsdaten auch im Browser',async t=>{
  const {page,state,errors}=await setup(t,{station:false});
  let networkRequests=0;
  await page.route('https://**/*',route=>{networkRequests++;return route.abort();});
  const base={...state.station,allowedHosts:['stream.example.com','stats.example.com'],provider:'streampanel',configured:true,stationId:'test-radio',streamUrl:'https://stream.example.com/test-radio',metadataUrl:'https://stats.example.com/widget/radio/test-radio/track/current'};
  let revision=2;
  for(const patch of [
    {streamUrl:'http://stream.example.com/test-radio'},
    {streamUrl:'https://encoder.example.com/test-radio'},
    {streamUrl:'https://stream.example.com.evil.example/test-radio'},
    {streamUrl:'https://user:secret@stream.example.com/test-radio'},
    {metadataUrl:'https://foreign.example.com/track/current'},
    {metadataUrl:'https://stats.example.com/widget/radio/test-radio/track/current?token=secret'},
    {statusUrl:'https://foreign.example.com/status'},

    {provider:'unknown'}
  ]){
    await page.evaluate(({state,station,revision})=>window.__emit('mw:state',{...state,station,revision}),{state,station:{...base,...patch},revision:revision++});
    assert.equal(await page.locator('#play-button').isDisabled(),!!patch.streamUrl||!!patch.provider,'Ungültige Datenquelle darf nur ihre Datenabfrage sperren');
    assert.equal(await page.locator('#station-link').isVisible(),false);
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  }
  assert.equal(networkRequests,0);
  assert.deepEqual(errors,[]);
});

test('Sendestatus bleibt Hinweis und verhindert keinen bewussten Hörversuch',async t=>{
 const {page,state,errors,requests}=await setup(t,{station:true,providerStatus:'stopped',realAudio:true});assert.equal(await page.locator('#stream-label').textContent(),'Sendepause');assert.equal(await page.locator('#play-button').isEnabled(),true);
 assert.equal(requests.some(url=>url.startsWith('https://stream.example.com')),false);await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,topic:'Neue Sendung'}),state);
 await page.locator('#play-button').click();await waitRadioPlaying(page);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');assert.deepEqual(errors,[]);
});

test('Widersprechende Sendepause und Senderstart beeinflussen laufendes natives Audio nicht',async t=>{
 const {page,errors}=await setup(t,{station:true,realAudio:true});await page.locator('#play-button').click();await waitRadioPlaying(page);const src=await page.locator('#radio-audio').getAttribute('src');let status='stopped';
 await page.route('https://stats.example.com/widget/radio/test-radio',r=>r.fulfill({json:{slug:'test-radio',stream_status:status}}));
 for(const value of ['stopped','started']){status=value;const response=page.waitForResponse('https://stats.example.com/widget/radio/test-radio');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await(await response).finished();
 assert.equal(await page.locator('#radio-audio').getAttribute('src'),src);assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');}assert.deepEqual(errors,[]);
});

test('SPCast-Statistik bleibt unabhängig von Audio und Nachladeereignissen',async t=>{
 const h=createHarness(),u=h.user(1,'Otterchen','owner'),product=h.state(u,h.open(u)).station;const {spcastStatistics}=require('../fixtures/stream.cjs');const {page,state,errors}=await setup(t,{station:true,realAudio:true});let checks=0;
 await page.route(product.statusUrl,r=>{checks++;return r.fulfill({json:spcastStatistics({online:false,listeners:0})});});await page.route(product.streamUrl,r=>r.fulfill({contentType:'audio/wav',body:require('../fixtures/audio.cjs').audioFixture()}));
 await page.evaluate(({state,product})=>__emit('mw:state',{...state,revision:2,station:product}),{state,product});await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor();
 await page.locator('#play-button').click();await waitRadioPlaying(page);const before=checks;await page.locator('#radio-audio').evaluate(a=>{for(let i=0;i<20;i++){a.dispatchEvent(new Event('waiting'));a.dispatchEvent(new Event('stalled'));}});
 await page.waitForFunction(()=>document.body.classList.contains('playing'));assert.equal(checks,before);assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);assert.deepEqual(errors,[]);
});

test('Nicht prüfbarer oder unbekannter Anbieterstatus sperrt nicht dauerhaft und unterbricht keinen Ton',async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  let mode;
  await page.route('https://stats.example.com/widget/radio/test-radio',route=>{
    if(mode==='network')return route.abort();
    if(mode==='http')return route.fulfill({status:503,body:'unavailable'});
    if(mode==='json')return route.fulfill({contentType:'application/json',body:'invalid json'});
    return route.fulfill({json:mode});
  });
  for(mode of ['network','http','json',null,{}, {slug:'other-radio',stream_status:'stopped'},{slug:'test-radio',stream_status:'active'},{slug:'test-radio',stream_status:false},{slug:'test-radio',status:'error',stream_status:'stopped'}]){
    await page.evaluate(()=>{document.getElementById('metadata-status').textContent='';document.dispatchEvent(new Event('visibilitychange'));});
    await page.locator('#metadata-status').filter({hasText:'Titelanzeige von Radio Mischwerk'}).waitFor({state:'attached'});
    assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
    assert.equal(await page.locator('#play-button').isEnabled(),true);
    assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  }
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Gestoppt');
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(errors,[]);
});

test('Verspäteter Stop-Status eines alten Senders sperrt keinen neu gewählten Sender',async t=>{
  const {page,state,releaseStatus,errors}=await setup(t,{station:true,providerStatus:'stopped',delayedStatus:true});
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#stream-label').textContent(),'Bereit');
  await page.route('https://stats.example.com/widget/radio/other-radio',route=>route.fulfill({json:{slug:'other-radio',stream_status:'started'}}));
  await page.route('https://stats.example.com/widget/radio/other-radio/track/current',route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neue Band'}}));
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,station:{...s.station,stationId:'other-radio',streamUrl:'https://stream.example.com/other-radio',metadataUrl:'https://stats.example.com/widget/radio/other-radio/track/current',statusUrl:'https://stats.example.com/widget/radio/other-radio'}}),state);
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  await page.locator('#play-button').click();
  const oldResponse=page.waitForResponse('https://stats.example.com/widget/radio/test-radio');releaseStatus();await oldResponse;
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://stream.example.com/other-radio');
  assert.equal(await page.locator('#track-title').textContent(),'Neuer Titel');
  assert.deepEqual(errors,[]);
});

test('Langsame erste Statusprüfung verzögert den direkten Hörversuch nicht',async t=>{
 const {page,releaseStatus,errors}=await setup(t,{station:true,delayedStatus:true,clock:true,realAudio:true});assert.equal(await page.locator('#play-button').isEnabled(),true);
 await page.locator('#play-button').click();await waitRadioPlaying(page);await page.clock.runFor(11000);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');releaseStatus();assert.deepEqual(errors,[]);
});

test('Medienfehler verbindet neu ohne zusätzliche Statusabfrage und bleibt stoppbar',async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true});let checks=0;await page.route('https://stats.example.com/widget/radio/test-radio',r=>{checks++;return r.fulfill({json:{slug:'test-radio',stream_status:'stopped'}});});
 await page.locator('#play-button').click();await page.evaluate(()=>__rejects[0](new Error('offline')));assert.equal(await page.locator('#stream-label').textContent(),'Verbinde erneut');await page.clock.runFor(2100);
 assert.equal(await page.evaluate(()=>__rejects.length),2);assert.equal(checks,0);await page.locator('#play-button').click();await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>__rejects.length),2);assert.deepEqual(errors,[]);
});

test('Titel wechseln im Fünfsekundentakt ohne Browsercache; Status bleibt bei 30 Sekunden, Popups und Hintergrund bleiben ruhig',async t=>{
  for(const view of ['wishes','studio','team','schedule']){
    const {page,errors}=await setup(t,{station:true,view,clock:true});let requests=0;
    await page.route('https://stats.example.com/**',route=>{requests++;return route.fulfill({json:{title:'Titel',artist:'Interpret'}});});
    await page.clock.runFor(31000);assert.equal(requests,0,'Keine Providerverbindung im Popup '+view);assert.deepEqual(errors,[]);
  }
  const {page,errors}=await setup(t,{station:true,clock:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  await page.evaluate(()=>{const original=window.fetch;window.__metadataFetch=[];window.fetch=function(url,options){window.__metadataFetch.push({url,cache:options.cache,credentials:options.credentials});return original.apply(this,arguments);};});
  const endpoint='https://stats.example.com/widget/radio/test-radio/track/current';let requests=0,statusRequests=0;
  await page.route('https://stats.example.com/**',route=>{
    if(route.request().url().endsWith('/test-radio')){statusRequests++;return route.fulfill({json:{slug:'test-radio',stream_status:'started'}});}
    if(route.request().url().endsWith('/listener')){return route.fulfill({json:{listener_count:12}});}
    requests++;return route.fulfill({json:{title:'Titel '+requests,artist:'Interpret '+requests}});
  });
  await page.clock.runFor(4900);assert.equal(requests,0);assert.equal(statusRequests,0);
  for(let number=1;number<=6;number++){
    const response=page.waitForResponse(endpoint);await page.clock.runFor(number===1?101:5001);await response;
    await page.locator('#track-title').filter({hasText:'Titel '+number}).waitFor();
    assert.equal(await page.locator('#track-artist').textContent(),'Interpret '+number);assert.equal(requests,number);
    assert.equal(statusRequests,number<6?0:1,'Status erhält keinen schnellen Titeltakt');
  }
  const metadataCalls = (await page.evaluate(()=>window.__metadataFetch)).filter(call=>call.url===endpoint);
  assert.ok(metadataCalls.length >= 6);
  assert.ok(metadataCalls.every(call=>call.cache==='no-store'&&call.credentials==='omit'));
  await page.evaluate(()=>{window.__metadataHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get(){return window.__metadataHidden;}});});
  await page.clock.runFor(35000);assert.equal(requests,6);assert.equal(statusRequests,1);
  let response=page.waitForResponse(endpoint);await page.evaluate(()=>{window.__metadataHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await response;
  await page.locator('#track-title').filter({hasText:'Titel 7'}).waitFor();assert.equal(statusRequests,2);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await page.clock.runFor(35000);assert.equal(requests,7);assert.equal(statusRequests,2,'Geschlossene Ansicht hinterlässt keine Timer');
  response=page.waitForResponse(endpoint);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await response;
  await page.locator('#track-title').filter({hasText:'Titel 8'}).waitFor();
  response=page.waitForResponse(endpoint);await page.evaluate(()=>{window.fetch=undefined;window.AbortController=undefined;document.dispatchEvent(new Event('visibilitychange'));});await response;
  await page.locator('#track-title').filter({hasText:'Titel 9'}).waitFor();assert.deepEqual(errors,[]);
});

test('Langsamer Senderstatus blockiert keine neuen Titel; wiederholtes Refresh dupliziert laufende Provideranfragen nicht',async t=>{
  const {page,errors}=await setup(t,{station:true,clock:true});await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  const base='https://stats.example.com/widget/radio/test-radio',endpoint=base+'/track/current';
  let releaseStatus,releaseTitle,statusCalls=0,titleCalls=0;
  const statusGate=new Promise(resolve=>{releaseStatus=resolve;}),titleGate=new Promise(resolve=>{releaseTitle=resolve;});
  await page.route(base,async route=>{statusCalls++;await statusGate;await route.fulfill({json:{slug:'test-radio',stream_status:'started'}});});
  await page.route(endpoint,async route=>{const number=++titleCalls;if(number===1)await titleGate;await route.fulfill({json:{title:'Schneller Titel '+number,artist:'Band '+number}});});
  const request=page.waitForRequest(endpoint);
  await page.evaluate(()=>{for(let i=0;i<3;i++)document.dispatchEvent(new Event('visibilitychange'));});await request;
  await page.clock.runFor(1000);assert.equal(titleCalls,1);assert.equal(statusCalls,1);
  let response=page.waitForResponse(endpoint);releaseTitle();await response;
  await page.locator('#track-title').filter({hasText:'Schneller Titel 1'}).waitFor();
  response=page.waitForResponse(endpoint);await page.clock.runFor(5001);await response;
  await page.locator('#track-title').filter({hasText:'Schneller Titel 2'}).waitFor();assert.equal(statusCalls,1);
  response=page.waitForResponse(base);releaseStatus();await response;assert.deepEqual(errors,[]);
});

test('Sendepause verwirft eine verspätete Titelantwort; Metadaten-Timeout erhält die Anzeige und versucht erst nach 30 Sekunden erneut',async t=>{
  const {page,errors}=await setup(t,{station:true,clock:true});await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  const base='https://stats.example.com/widget/radio/test-radio',endpoint=base+'/track/current';let releaseTitle,status='started',calls=0,hold=true;
  const gate=new Promise(resolve=>{releaseTitle=resolve;});
  await page.route(base,route=>route.fulfill({json:{slug:'test-radio',stream_status:status}}));
  await page.route(endpoint,async route=>{const number=++calls;if(hold){await gate;}try{await route.fulfill({json:{title:'Aktueller Titel '+number,artist:'Band '+number}});}catch(error){if(!route.request().failure())throw error;}});
  const request=page.waitForRequest(endpoint);await page.clock.runFor(5001);await request;
  status='stopped';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor();
  const oldResponse=page.waitForResponse(endpoint);hold=false;releaseTitle();await oldResponse;
  await page.waitForTimeout(20);assert.equal(await page.locator('#track-title').isVisible(),false);
  await page.clock.runFor(15000);assert.equal(calls,1,'Keine Titelabfragen bei bestätigter Pause');
  status='started';let response=page.waitForResponse(endpoint);await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await response;
  await page.locator('#track-title').filter({hasText:'Aktueller Titel 2'}).waitFor();
  let releaseTimeout;const timeoutGate=new Promise(resolve=>{releaseTimeout=resolve;});
  await page.route(endpoint,async route=>{calls++;await timeoutGate;try{await route.fulfill({json:{title:'Zu spät',artist:'Veraltet'}});}catch(error){if(!route.request().failure())throw error;}});
  const timedRequest=page.waitForRequest(endpoint);await page.clock.runFor(5001);await timedRequest;
  await page.clock.runFor(10001);await page.locator('#metadata-status').filter({hasText:'nicht erreichbar'}).waitFor({state:'attached'});
  assert.equal(await page.locator('#track-title').textContent(),'Aktueller Titel 2');const afterTimeout=calls;
  await page.clock.runFor(5001);assert.equal(calls,afterTimeout,'Fehler erzeugt keine Fünfsekunden-Abfrageserie');
  releaseTimeout();await page.unroute(endpoint);
  await page.route(endpoint,route=>{calls++;return route.fulfill({json:{title:'Wieder erreichbar',artist:'Band'}});});
  response=page.waitForResponse(endpoint);await page.clock.runFor(25000);await response;
  await page.locator('#track-title').filter({hasText:'Wieder erreichbar'}).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
});

function privatePositions(items, extra={}) {
  return {available:true,generation:'queue-browser',revision:1,nextPosition:items[0]?.position||null,
    items,total:items.length,page:0,pages:1,...extra};
}
test('Wunschbox enthält keine doppelte Wunschübersicht und erhält den Eingabeentwurf bei privaten Updates',async t=>{
  const {page,state,errors}=await setup(t,{view:'wishes',role:'listener',parserIncludes:true,viewport:{width:320,height:560}});
  const emit=positions=>page.evaluate(({state,positions})=>window.__emit('mw:state',{...state,wishPositions:positions}),{state,positions});
  await page.locator('#wish-text').fill('Dieser Entwurf bleibt');
  const sent=await page.evaluate(()=>window.__sent.length);
  for(const positions of [privatePositions([{id:11,text:'<img src=x onerror=alert(1)> Mein Song',position:2}]),privatePositions([],{generation:'queue-restarted',revision:0})]){
    await emit(positions);
    assert.equal(await page.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
    assert.doesNotMatch(await page.locator('#wishes-panel').innerText(),/Deine offenen Wünsche|Platz 2|Mein Song/);
    assert.equal(await page.locator('#wish-text').inputValue(),'Dieser Entwurf bleibt');
    assert.equal(await page.locator('#wish-text').evaluate(n=>n===document.activeElement),true);
  }
  assert.equal(await page.evaluate(()=>window.__sent.length),sent,'Private Updates erzeugen keine zusätzlichen Leseaufträge');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});

test('Radio zeigt den nächsten eigenen Wunsch auch bei geschlossener Wunschbox ohne Tonunterbrechung',async t=>{
  const {page,state,errors}=await setup(t,{role:'listener',station:true,realAudio:true,clock:true,viewport:{width:1200,height:160}});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  const position=privatePositions([{id:1,text:'Mein Song',position:7,stage:'queued'}],{total:2,nextItem:{id:1,text:'Mein Song',position:7,stage:'queued'}});
  const emit=positions=>page.evaluate(({state,positions})=>window.__emit('mw:state',{...state,requestsEnabled:false,wishPositions:positions}),{state,positions});
  await emit(position);
  assert.equal(await page.locator('#own-wish-label').textContent(),'Dein Wunsch:');
  assert.equal(await page.locator('#own-wish-rank').textContent(),'Platz 7');
  assert.equal(await page.locator('#own-wish-title').textContent(),'Mein Song');
  assert.equal(await page.locator('#own-wish-stage').textContent(),'Wartet');
  assert.equal(await page.locator('#own-wish-more').textContent(),'+1');
  assert.equal(await page.locator('#open-wishes').isDisabled(),true);
  assert.equal(await page.locator('#mute-button').evaluate(n=>{
    const r=n.getBoundingClientRect(),m=document.getElementById('radio-metadata').getBoundingClientRect();
    return r.top>=m.top&&r.bottom<=m.bottom;
  }),true,'Kurze Musikangaben und Wunschplatz lassen die Lautstärke vollständig im 160-px-Rahmen');
  for(const width of [320,390,700,1200,2048]){
    await resizeViewport(page,{width,height:160});
    for(const id of ['own-wish-position','volume','play-button','open-schedule'])await page.locator('#'+id).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.equal(await page.locator('#radio-audio').evaluate(n=>n.paused),false);
  await emit({...position,revision:2,nextPosition:6,nextItem:{...position.nextItem,position:6,stage:'preparing'},items:[{id:2,text:'Anderer eigener Wunsch auf Seite 2',position:9,stage:'queued'}],page:1,pages:2});
  await emit(position);
  assert.match(await page.locator('#own-wish-position').textContent(),/Platz 6/);
  assert.equal(await page.locator('#own-wish-title').textContent(),'Mein Song');
  assert.equal(await page.locator('#own-wish-stage').textContent(),'In Vorbereitung');
  await page.clock.fastForward(66000);
  assert.equal(await page.locator('#own-wish-stage').textContent(),'Status unbestätigt');
  assert.equal(await page.locator('#own-wish-rank').isVisible(),false,'Unbestätigte Position zeigt keinen hervorgehobenen Platzwert');
  await emit({...position,revision:3,nextPosition:null});
  assert.equal(await page.locator('#own-wish-stage').textContent(),'Status unbestätigt');
  await emit(privatePositions([],{revision:4}));
  assert.equal(await page.locator('#own-wish-position').isVisible(),false);
  assert.deepEqual(errors,[]);
});

test('Wunschplätze rücken im vollständigen Versand- und Moderations-Roundtrip nach',async t=>{
  const {spawn}=require('node:child_process');
  const child=spawn(process.execPath,['tools/preview/server.cjs'],{cwd:root,env:{...process.env,MISCHWERK_PREVIEW_PORT:'0'},windowsHide:true});
  t.after(()=>child.kill());
  const base=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Preview startup timeout')),8000);
    child.on('error',error=>{clearTimeout(timeout);reject(error);});
    child.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});
  });
  const context=await browser.newContext({viewport:{width:520,height:700}});t.after(()=>context.close());
  const listener=await context.newPage(),mod=await context.newPage(),radio=await context.newPage();
  await mod.goto(base+'/preview?role=moderator&view=studio');await previewCurtain(mod);
  await radio.goto(base+'/preview?role=listener&embedded=1');
  const source=await radio.evaluate(()=>MischWerkDemoData.sessionId);
  await listener.goto(base+'/preview?view=wishes&sourceSession='+encodeURIComponent(source));
  await listener.locator('#wish-text:not([disabled])').fill('Ein Song mit sichtbarem Platz');
  await listener.locator('#submit-wish').click();
  await listener.locator('#wish-feedback').filter({hasText:'an die Moderation gesendet'}).waitFor();
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 3'}).waitFor();
  assert.equal(await radio.locator('#own-wish-title').textContent(),'Ein Song mit sichtbarem Platz');
  assert.equal(await listener.locator('#wish-positions').count(),0);
  await mod.setViewportSize({width:780,height:740});
  for(const [outcome,rank] of [['done',2],['discarded',1]]){
    await showStudioPane(mod,true);
    await mod.locator('[data-outcome="'+outcome+'"]').click();
    await mod.locator('#queue-count').filter({hasText:String(rank)}).waitFor();
    await radio.locator('#own-wish-rank').filter({hasText:'Platz '+rank}).waitFor();
  }
  await showStudioPane(mod,true);
  await mod.locator('.request-text').filter({hasText:'Ein Song mit sichtbarem Platz'}).waitFor();
  await mod.locator('[data-outcome="done"]').click();
  await mod.locator('#queue-count').filter({hasText:'0'}).waitFor();
  await radio.locator('#own-wish-position').waitFor({state:'hidden'});
  assert.equal(await listener.locator('#wish-text').isEnabled(),true);
});

test('Breite Radioleiste nutzt die Mittelbreite und erhält Tastaturbedienung',async t=>{
  const {page,state,errors}=await setup(t,{station:true,curtainClosed:true,viewport:{width:2290,height:160}});
  await page.waitForFunction(()=>{const img=document.querySelector('.bar-logo');return img.complete&&img.naturalWidth>0;});
  const ids=['open-schedule','open-wishes','studio-tab'];
  const boxes=await Promise.all(ids.map(id=>page.locator('#'+id).boundingBox()));
  assert.equal((await page.locator('#radio-panel').boundingBox()).width,2290);
  assert.equal((await page.locator('#play-button').boundingBox()).width,60);
  assert.ok(Math.abs(boxes[0].width-boxes[1].width)<1&&boxes[0].height===92&&boxes[1].height===92);
  assert.ok(Math.abs(boxes[0].y-boxes[1].y)<1);
  const logo=await page.locator('.bar-logo').boundingBox(),play=await page.locator('#play-button').boundingBox(),music=await page.locator('.radio-program-face').boundingBox();
  assert.ok(play.x+play.width<=logo.x&&play.x>=music.x&&boxes[1].x+boxes[1].width<=music.x+music.width);
  assert.equal(await page.locator('.bar-logo').getAttribute('src'),'img/mischwerk-logo.png');
  assert.deepEqual(await page.locator('#studio-tab .action-label strong').evaluate(n=>{const s=getComputedStyle(n);return [s.fontSize,s.fontWeight];}),['13px','600']);
  for(const [index,id] of ids.entries()){
    const node=page.locator('#'+id),before=await node.boundingBox();
    await node.hover();await page.mouse.down();
    assert.deepEqual(await node.boundingBox(),before,'Druckzustand verschiebt keine Klickfläche');
    const styles=await node.evaluate(n=>{const s=getComputedStyle(n);return {shadow:s.boxShadow,textShadow:s.textShadow,background:s.backgroundImage};});
    assert.equal(styles.shadow,'none');assert.equal(styles.textShadow,'none');assert.equal(styles.background,'none');
    await page.mouse.move(0,0);await page.mouse.up();
    await node.focus();await page.keyboard.press('Enter');
    const sent=await page.evaluate(()=>window.__sent.at(-1));
    assert.equal(sent.type,['mw:openSchedule','mw:openWishes','mw:openStudio','mw:openRadioTeam'][index]);
    await page.evaluate(sent=>window.__emit('mw:result',{ok:true,action:sent.type,requestId:sent.data.requestId}),sent);
    if(index<ids.length-1){await node.focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#'+ids[index+1]).evaluate(n=>document.activeElement===n),true);}
  }
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,curtain:{...state.curtain,closed:false}}),state);
  assert.equal(await page.locator('#curtain-toggle').count(),0);
  assert.deepEqual(errors,[]);
});

test('Teammitglieder und Entzugsbestätigung sind im unveränderten nativen Rahmen erreichbar',async t=>{
 for(const k3 of [true,false]){const {page,state,errors}=await setup(t,{view:'team',k3,viewport:{width:560,height:560}});await page.evaluate(s=>__emit('mw:state',{...s,revision:2,radioModerators:[1,2,3].map(userId=>({userId,nick:'Radio-Teammitglied '+userId})),radioModeratorTotal:3}),state);await page.locator('[data-radio-moderator-id="1"]').click();await page.locator('[data-confirm-removal]').scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-confirm-removal]').isVisible(),true);await page.locator('#team-removal-confirm .secondary-button').click();assert.deepEqual(await page.evaluate(()=>__sizes),[]);assert.deepEqual(page.viewportSize(),{width:560,height:560});assert.deepEqual(errors,[]);}
});

test('Teamverwaltung erhält Eingabe, Entzugsbestätigung und Fokus bei Aktualisierung und Overlaywechsel',async t=>{
 const {page,state,errors,requests}=await setup(t,{view:'team',nativeSizing:true,hostSteps:true,viewport:{width:560,height:630},overlayState:{status:{selected:true,details:true},team:{nick:'Mein unverlorener Entwurf',page:0}}});
 // A fresh overlay restores the existing team draft and ignores the removed status selection.
 assert.equal(await page.locator('#radio-moderator-nick').inputValue(),'Mein unverlorener Entwurf');
 assert.equal(await page.locator('#radio-moderator-form').isVisible(),true);
 assert.equal(await page.locator('#team-status,#team-status-tab').count(),0);
 await page.evaluate(s=>__emit('mw:state',{...s,revision:2,radioModerators:[{userId:21,nick:'Ein Radiomoderator'}],radioModeratorTotal:1}),state);
 await page.locator('[data-radio-moderator-id="21"]').click();
 const before=await page.locator('.dialog-header').boundingBox();
 await page.evaluate(s=>__emit('mw:state',{...s,revision:3,radioModerators:[{userId:21,nick:'Ein Radiomoderator'}],radioModeratorTotal:1}),state);
 assert.equal(await page.locator('#team-removal-confirm').isVisible(),true);
 assert.equal(await page.locator('#team-removal-confirm .secondary-button').evaluate(n=>n===document.activeElement),true);
 await page.evaluate(()=>__emit('mw:overlay.prepare',{token:1}));
 const ready=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:overlay.ready'));
 assert.equal(ready.data.state.team.nick,'Mein unverlorener Entwurf');
 assert.equal(ready.data.state.team.removing,'21');
 assert.equal(Object.hasOwn(ready.data.state,'status'),false);
 await page.evaluate(()=>__emit('mw:overlay.resume',{token:1}));
 assert.equal(await page.locator('#team-removal-confirm .secondary-button').evaluate(n=>n===document.activeElement),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#team-removal-confirm').count(),0);
 assert.equal(await page.locator('[data-radio-moderator-id="21"]').evaluate(n=>n===document.activeElement),true);
 assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:removeRadioModerator')),false);
 assert.deepEqual(await page.locator('.dialog-header').boundingBox(),before);
 assert.deepEqual(await page.evaluate(()=>__sizes),[]);
 assert.equal(requests.some(u=>u.startsWith('https://stats.example.com/')),false);
 assert.deepEqual(errors,[]);
});

test('Overlay-Eingaben nutzen denselben Wunschcontroller und erhalten laufendes Audio auch bei später Quittung',async t=>{
 for(const k3 of [true,false]){
  const {page,errors}=await setup(t,{role:'listener',station:true,realAudio:true,k3,viewport:{width:1200,height:160}});
  const initialSizes=await page.evaluate(()=>window.__sizes);
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.evaluate(()=>{window.__radioNode=document.getElementById('radio-audio');});
  await page.locator('#open-wishes').click();
  await page.evaluate(()=>{const e=__sent.findLast(e=>e.type==='mw:openWishes');__emit('mw:wishes.open',{surfaceId:1});__emit('mw:result',{ok:true,action:e.type,requestId:e.data.requestId});});
  await page.evaluate(()=>{__emit('mw:wishes.input',{surfaceId:1,sequence:1,text:'Unser Song'});__emit('mw:wishes.input',{surfaceId:1,sequence:2,text:'Unser Song',submit:true});});
  const wish=await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:wish.submit'));
  assert.equal(wish.data.text,'Unser Song');
  await page.evaluate(()=>__emit('mw:wishes.closed',{surfaceId:1}));
  await page.evaluate(w=>__emit('mw:wish.receipt',{accepted:true,submissionId:w.data.submissionId,message:'Dein Musikwunsch wurde an die Moderation gesendet.'}),wish);
  assert.equal(await page.locator('#wish-text').inputValue(),'');
  assert.equal(await page.locator('#wishes-panel').isVisible(),false);
  assert.equal(await page.locator('#radio-audio').evaluate(n=>n===__radioNode&&!n.paused),true);
  assert.equal(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:wish.submit').length),1);
  assert.deepEqual(await page.evaluate(()=>__sizes),initialSizes);assert.deepEqual(errors,[]);
 }
});



test('Ausstehender STREAMPANEL-Zugang erzeugt keine Anbieterabfragen und sperrt nur den Player',async t=>{
 const {page,requests,errors}=await setup(t,{station:false,clock:true,viewport:{width:1200,height:160}});
 await page.clock.fastForward(61000);
 assert.equal(await page.locator('#play-button').isDisabled(),true);
 assert.equal(await page.locator('#open-wishes').isEnabled(),true);
 assert.equal(requests.some(url=>url.startsWith('https://')),false);
 assert.deepEqual(errors,[]);
});




test('Overlay-Schließen stellt den Fokus bei deaktivierter Annahme und Verbindungsverlust auch hinter langen Titeln wieder her',async t=>{
 for(const lost of [false,true]){
  const {page,state,errors}=await setup(t,{role:'listener',station:true,viewport:{width:320,height:160}});
  await page.locator('#open-wishes').click();
  await page.evaluate(()=>{const e=__sent.findLast(e=>e.type==='mw:openWishes');__emit('mw:wishes.open',{surfaceId:1});__emit('mw:result',{ok:true,action:e.type,requestId:e.data.requestId});
    __emit('mw:wishes.input',{surfaceId:1,sequence:1,text:'Mein Entwurf bleibt'});document.getElementById('track-title').textContent='Langer Titel '.repeat(80);});
  await page.evaluate(({state,lost})=>__emit('mw:state',{...state,revision:2,requestsEnabled:lost,shuttingDown:lost}),{state,lost});
  await page.evaluate(()=>__emit('mw:wishes.input',{surfaceId:1,sequence:2,text:'Letzte Eingabe trotz gesperrtem Versand',submit:true}));
  await page.evaluate(()=>__emit('mw:wishes.closed',{surfaceId:1}));
  const target=lost?'#mute-button':'#open-schedule';
  assert.equal(await page.locator(target).evaluate(n=>{const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return document.activeElement===n&&!!hit&&(hit===n||n.contains(hit));}),true);
  assert.equal(await page.locator('#wish-text').inputValue(),'Letzte Eingabe trotz gesperrtem Versand');
  assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:wish.submit')),false);assert.deepEqual(errors,[]);
 }
});

test('Alle direkten Radioaktionen einschließlich Vorhang passen auch zwischen 700 und 1099 Pixeln in den Rahmen',async t=>{
 for(const role of ['owner','radioModerator','listener']){
  const {page,state,errors}=await setup(t,{role,station:true,viewport:{width:2290,height:160}});
  for(const closed of [false,true]){
   await page.evaluate(({state,closed})=>__emit('mw:state',{...state,revision:closed?3:2,curtain:{...state.curtain,closed,exempt:true}}),{state,closed});
   for(const width of [320,390,699,700,759,760,1024,1099,1100,1360,2290,3840]){
    await page.setViewportSize({width,height:160});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const buttons=await page.evaluate(()=>[...document.querySelectorAll('#radio-panel button')].filter(n=>n.getClientRects().length&&!n.closest('#radio-metadata')).map(n=>{
     const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
     return {id:n.id,height:b.height,width:b.width,inside:b.top>=0&&b.bottom<=innerHeight+1&&b.left>=0&&b.right<=innerWidth+1,hit:!!hit&&(hit===n||n.contains(hit))};
    }));
    for(const button of buttons){assert.ok(button.inside&&button.hit&&button.height>=44&&button.width>=44,JSON.stringify({role,closed,viewportWidth:width,...button}));}
   }
  }
  assert.deepEqual(errors,[]);
 }
});


test('Tastatur verlässt die Radioaktionen ohne unsichtbaren Zwischenstopp auf dem Hilfslink',async t=>{
 const {page,errors}=await setup(t,{station:true,viewport:{width:2290,height:160}});
 assert.equal(await page.locator('#team-tab').count(),0);
 await page.locator('#studio-tab').focus();await page.keyboard.press('Tab');
 assert.notEqual(await page.evaluate(()=>document.activeElement.id),'station-link');
 assert.deepEqual(errors,[]);
});

test('Sendungszeit nutzt bestätigte Serverzeit ohne Assistent, Erinnerung oder automatische Aktion',async t=>{
  for(const k3 of [true,false]){
    const {page,state,errors}=await setup(t,{view:'studio',clock:true,k3,viewport:{width:780,height:730}});
    const now=state.serverTime;
    const next={...state,revision:2,serverTime:now,moderator:{nick:'Otterchen',since:now-125000,expiresAt:now+3600000,sessionKey:'timer-1'},user:{...state.user,isOnAir:true,canEndModeration:true}};
    await page.evaluate(s=>__emit('mw:state',s),next);
    assert.equal(await page.locator('#studio-duration').textContent(),'0 Std. 2 Min.');
    assert.equal(await page.locator('#studio-assistant,[id^=assistant-]').count(),0);
    await page.clock.fastForward(60000);
    assert.equal(await page.locator('#studio-duration').textContent(),'0 Std. 3 Min.');
    assert.equal(await page.evaluate(()=>__sent.some(e=>['mw:offAir','mw:onAir','mw:handover.request','mw:setTopic'].includes(e.type))),false);
    await page.clock.fastForward(6000);
    assert.equal(await page.locator('#studio-timing').isVisible(),false);
    assert.equal(await page.locator('#studio-host').textContent(),'Moderation unbestätigt');
    assert.deepEqual(errors,[]);
  }
});

test('Moderation enthält keine eigenen Sendezeiten oder Kalenderabrufe und erhält den Themenentwurf',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',viewport:{width:780,height:730}});
  await page.locator('#studio-topic').fill('Mein eigener Entwurf');
  for(const tab of ['studio-queue-tab','studio-history-tab','studio-programme-tab'])await page.locator('#'+tab).click();
  await page.evaluate(s=>{__emit('mw:schedule.changed',{});__emit('mw:schedule.data',{requestId:'alter-studio-plan',week:'2026-11-02',page:0,pages:1,entries:[]});__emit('mw:state',{...s,revision:s.revision+1});document.dispatchEvent(new Event('visibilitychange'));},state);
  assert.equal(await page.locator('#studio-plan,[id^="studio-plan-"],[class^="studio-plan-"]').count(),0);
  assert.doesNotMatch(await page.locator('#studio-panel').textContent(),/Deine Sendezeiten|Diese und nächste Woche/);
  assert.equal(await page.evaluate(()=>__sent.some(e=>e.type.startsWith('mw:schedule.'))),false);
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(e=>/\/studio\/plan\.js|\/schedule\/calendar\.js/.test(e.name))),false);
  await revealStudio(page,'#studio-topic');assert.equal(await page.locator('#studio-topic').inputValue(),'Mein eigener Entwurf');
  assert.equal(await page.evaluate(()=>__sent.some(e=>['mw:setTopic','mw:onAir','mw:offAir'].includes(e.type))),false);
  await studioFits(page);assert.deepEqual(errors,[]);
});

test('Flache Sendefläche und kompakte Wünsche nutzen klare Hierarchie; alle Texte bleiben ohne Scrollen erreichbar',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',initialRequest:true,viewport:{width:780,height:730}});
  assert.equal(await page.locator('#studio-setup .card').count(),0);
  assert.equal(await page.locator('.microphone-card').evaluate(n=>getComputedStyle(n).backgroundImage),'none');
  await showStudioPane(page,true);
  assert.ok((await page.locator('.queue-item').boundingBox()).height<200);
  assert.ok((await page.locator('[data-outcome=done]').boundingBox()).width<150);
  const text=('Musikwunsch 🎵 mit vollständigem Originaltext. ').repeat(8).slice(0,300);
  await page.evaluate(({s,text})=>__emit('mw:state',{...s,revision:2,queue:[{...s.queue[0],text}]}),{s:state,text});
  for(const [width,height] of [[780,730],[390,560],[320,560],[780,360],[320,400]]){
    await resizeViewport(page,{width,height});await studioSettle(page);
    assert.equal(await readStudioText(page,'.request-text'),text);
    await studioFits(page);
  }
  assert.deepEqual(errors,[]);
});

test('Wunschliste zeigt mehrere Einträge, wählt über bestehende Seiten und quittiert ausschließlich die sichtbare Auswahl',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',viewport:{width:780,height:730}});
  const rows=[1,2,3].map(id=>({id,text:'Listenwunsch '+id,nick:'Hörer '+id,stage:id===2?'preparing':'queued',createdAt:state.serverTime,delivery:null}));
  const next={...state,revision:2,queue:[rows[0]],queueWindow:rows,queueStart:0,queueTotal:5,page:0,pages:5,wishPositions:{...state.wishPositions,revision:3}};
  await page.evaluate(s=>__emit('mw:state',s),next);await studioSettle(page);
  assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:ackRequest')),false);
  await showStudioPane(page,true);await studioSettle(page);
  assert.equal(await page.locator('.queue-item').count(),3);assert.equal(await page.locator('.request-pick').count(),2);
  assert.deepEqual(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:ackRequest').map(e=>e.data.id)),[1]);
  await page.locator('[data-position="1"]').click();
  assert.equal(await page.evaluate(()=>__sent.findLast(e=>e.type==='mw:refresh').data.page),1);
  const selected={...next,revision:3,queue:[rows[1]],page:1};await page.evaluate(s=>__emit('mw:state',s),selected);await studioSettle(page);
  assert.equal(await page.locator('.request-text').textContent(),'Listenwunsch 2');
  assert.equal(await page.locator('[data-stage=playing]').isDisabled(),true,'Weiterhin darf ausschließlich Platz 1 laufen');
  assert.deepEqual(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:ackRequest').map(e=>e.data.id)),[1,2]);
  await page.evaluate(s=>__emit('mw:state',{...s,queueWindow:s.queueWindow.map(row=>({...row,text:'Veraltete Vorschau'})),wishPositions:{...s.wishPositions,revision:2}}),selected);
  assert.doesNotMatch(await page.locator('#request-queue').textContent(),/Veraltete Vorschau/);
  await studioFits(page);
  await page.evaluate(s=>__emit('mw:state',{...s,revision:4,user:{...s.user,canModerate:false},queue:[],queueWindow:[]}),selected);
  assert.equal(await page.locator('#request-queue').textContent(),'');assert.deepEqual(errors,[]);
});

test('Verspäteter Queue-Stand setzt weder Wunschstatus noch Hörerposition zurück',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',initialRequest:true,viewport:{width:780,height:900}});
  const base={...state,revision:2,wishPositions:{...state.wishPositions,revision:10},queue:[{...state.queue[0],stage:'preparing'}]};
  await page.evaluate(s=>__emit('mw:state',s),base);
  assert.equal(await page.locator('.request-stage').textContent(),'In Vorbereitung');
  const old={...base,wishPositions:{...base.wishPositions,revision:9},queue:[{...base.queue[0],stage:'queued'}]};
  await page.evaluate(s=>__emit('mw:state',s),old);
  assert.equal(await page.locator('.request-stage').textContent(),'In Vorbereitung');
  await page.evaluate(s=>__emit('mw:state',{...s,user:{...s.user,canModerate:false}}),base);
  assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.deepEqual(errors,[]);
});


for(const k3 of [true,false])test('HTML-Vorlagenraster erhält in '+(k3?'K3':'STAPP')+' Thema, Wunschplatz, Originaltexte und laufendes Audio',async t=>{
 const {page,state,errors}=await setup(t,{station:true,k3,nativeSizing:!k3,curtainClosed:true,viewport:{width:1920,height:160}});
 await page.route('https://stats.example.com/widget/radio/test-radio/track/current',r=>r.fulfill({json:{title:'Big City Life',artist:'Mattafix'}}));
 await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Big City Life');
 await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,topic:'Testmusik!',wishPositions:{generation:'radio-info',revision:1,available:true,total:1,page:0,pages:1,nextPosition:1,items:[{id:1,text:'Queen – We Will Rock You',position:1,stage:'queued'}],nextItem:{id:1,text:'Queen – We Will Rock You',position:1,stage:'queued'}}}),state);
 await page.locator('#play-button').click();await page.evaluate(()=>{window.__orderedAudio=document.getElementById('radio-audio');__orderedAudio.dispatchEvent(new Event('playing'));});
 for(const width of [320,390,560,561,700,768,850,851,1024,1199,1200,1201,1350,1351,1600,1920,2290]){
  await resizeViewport(page,{width,height:160});
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Kein horizontaler Überlauf bei '+width);
  assert.deepEqual(await page.evaluate(()=>['.track-eyebrow','.topic-label','.own-wish-label'].map(s=>getComputedStyle(document.querySelector(s)).color)),Array(3).fill('rgb(230, 199, 123)'),'Informationsüberschriften einheitlich in warmem Gold bei '+width);
  const buttons=await Promise.all(['open-schedule','open-wishes'].map(id=>page.locator('#'+id).boundingBox()));
  assert.ok(Math.abs(buttons[0].width-buttons[1].width)<1&&buttons.every(b=>b.height>=44));
  assert.ok(Math.abs(buttons[0].y-buttons[1].y)<1&&buttons[1].x>=buttons[0].x+buttons[0].width);
  const constrained=await page.locator('html').evaluate(n=>n.classList.contains('radio-constrained'));
  if(!constrained){
   assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollWidth>n.clientWidth+1),false);
   const music=await page.locator('.now-playing').boundingBox(),topic=await page.locator('.radio-context').boundingBox(),wish=await page.locator('#own-wish-position').boundingBox();
   assert.ok(wish.x>=topic.x+topic.width-1,'Eigener Wunsch steht neben dem Thema');
   if(width>850)assert.ok(topic.x>=music.x+music.width-1,'Musik steht links von den Sendungsinformationen');
   assert.deepEqual(await page.locator('#show-topic').evaluate(n=>{const s=getComputedStyle(n);return[s.fontSize,s.fontWeight,s.color];}),[width<=700?'17px':'18px','700','rgb(245, 245, 242)']);
   assert.equal(await page.locator('#own-wish-rank').evaluate(n=>getComputedStyle(n).color),'rgb(245, 245, 242)');
   if(width<=900)assert.ok(await page.locator('.track-eyebrow').evaluate(n=>n.getBoundingClientRect().top-document.getElementById('radio-metadata').getBoundingClientRect().top>=10),'Natürliche schmale Ansicht hat Luft über Jetzt läuft bei '+width);
   if(width>=1200){
    const spacing=await page.evaluate(()=>{
     const rect=s=>document.querySelector(s).getBoundingClientRect(),m=rect('#radio-metadata'),music=rect('.track-copy'),v=rect('.volume-control');
     const topic=rect('.topic-label'),value=rect('#show-topic'),status=rect('.presenter'),wish=rect('.own-wish-label'),rank=rect('.own-wish-rank'),stage=rect('.own-wish-stage');
     return {musicInset:music.top-m.top,musicBottom:music.bottom,volumeTop:v.top,topicCenter:(topic.top+status.bottom-m.top-m.bottom)/2,wishCenter:(wish.top+stage.bottom-m.top-m.bottom)/2,topicGap:value.top-topic.bottom,wishGap:rank.top-wish.bottom,scroll:m.height<document.getElementById('radio-metadata').scrollHeight-1};
    });
    const detail=JSON.stringify({width,k3,...spacing});
    assert.ok(spacing.musicInset>=14&&spacing.musicBottom<=spacing.volumeTop+1,'Musik tiefer und ohne Überlappung zum Regler: '+detail);
    assert.ok(Math.abs(spacing.topicCenter)<1&&Math.abs(spacing.wishCenter)<1,'Thema und Wunsch ausgewogen in der Höhe: '+detail);
    assert.ok(spacing.topicGap>=6&&spacing.wishGap>=5,'Mehr Luft zwischen Beschriftung und Inhalt: '+detail);
    assert.equal(spacing.scroll,false,'Kurze vollständige Angaben passen ohne Informationsscrollen: '+detail);
   }
  }else{
   for(const id of ['volume','show-topic','own-wish-rank'])await page.locator('#'+id).scrollIntoViewIfNeeded();
  }
  assert.equal(await page.evaluate(()=>document.getElementById('radio-audio')===window.__orderedAudio),true);
 }
 assert.equal(await page.locator('#show-topic').textContent(),'Testmusik!');assert.match(await page.locator('#own-wish-position').textContent(),/Platz 1/);assert.deepEqual(errors,[]);
});


test('Otterchen erhält die automatische Serverfreigabe; fehlende oder unbestätigte Freigaben zeigen keine Moderationstaste',async t=>{
  const {page,state,errors}=await setup(t,{registeredOwner:false,station:true,viewport:{width:1360,height:160}});
  assert.equal(state.user.canModerate,true);assert.equal(state.user.showModerationButton,true);assert.equal(await page.locator('#studio-tab').isVisible(),true);
  let revision=state.revision+1;
  for(const value of [undefined,false,'true',1]) {
    await page.evaluate(({state,revision,value})=>{const next={...state,revision,user:{...state.user,showModerationButton:value}};if(value===undefined)delete next.user.showModerationButton;window.__emit('mw:state',next);},{state,revision:revision++,value});
    assert.equal(await page.locator('#studio-tab').isVisible(),false);assert.equal(await page.locator('#radio-private-actions').isVisible(),false);
  }
  await page.evaluate(({state,revision})=>window.__emit('mw:state',{...state,revision,user:{...state.user,showModerationButton:true}}),{state,revision:revision++});assert.equal(await page.locator('#studio-tab').isVisible(),true);
  await page.evaluate(({state,revision})=>window.__emit('mw:state',{...state,revision,user:{...state.user,showModerationButton:true,canModerate:false}}),{state,revision:revision++});assert.equal(await page.locator('#studio-tab').isVisible(),false);assert.deepEqual(errors,[]);
});

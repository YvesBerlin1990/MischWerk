// Optional: Playwright/Edge mit lokalem Testton und eigener Werbe-MP3, ohne echte Sender-/Knuddels-Verbindungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MISCHWERK_PLAYWRIGHT || 'playwright');
const { createHarness } = require('../tools/knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
let browser;

test('Zentrierung und Studiokartenhintergrund bleiben beim Wechsel aller Leistenbreiten erhalten',async t=>{
  const rows=[];
  const widths=[1490,1599,1600,1601,1360,1100,1099,1024,868,760,759,700,699,640,390,320,1920,2560,3440,3840];
  try {
    for(const deviceScaleFactor of [1,1.25,1.5,2])for(const role of ['listener','owner']) {
      const {page,state,errors}=await setup(t,{role,deviceScaleFactor,station:true,viewport:{width:1490,height:160}});
      await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'You Might Think',artist:'The Cars'}}));
      await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='You Might Think');
      await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'',moderator:null}),state);
      for(const [width,height] of [...widths.map(width=>[width,160]),[320,600],[390,600],[699,600]]) {
        await resizeViewport(page,{width,height});
        await page.waitForFunction(({width,height})=>document.documentElement.classList.contains('radio-constrained')===(width<700&&height<360),{width,height});
        const row=await page.evaluate(()=>{
          const face=document.querySelector('.radio-program-face'),f=face.getBoundingClientRect(),m=document.getElementById('radio-metadata');
          function textCenter(id){const r=document.createRange();r.selectNodeContents(document.getElementById(id));const b=r.getBoundingClientRect();return b.x+b.width/2;}
          const volume=document.querySelector('.volume-control').getBoundingClientRect();
          const before=getComputedStyle(face,'::before'),after=getComputedStyle(face,'::after');
          return {faceVisible:getComputedStyle(face).display!=='none',faceX:f.x,faceY:f.y,faceWidth:f.width,faceHeight:f.height,center:f.x+f.width/2,
            titleCenter:textCenter('track-title'),artistCenter:textCenter('track-artist'),volumeCenter:volume.x+volume.width/2,
            metadataAlign:getComputedStyle(m).textAlign,horizontalOverflow:document.documentElement.scrollWidth>innerWidth||m.scrollWidth>m.clientWidth,
            grooves:{width:parseFloat(before.width),height:parseFloat(before.height)},arcs:{width:parseFloat(after.width),height:parseFloat(after.height)}};
        });
        rows.push({width,height,role,deviceScaleFactor,...row});
        if(process.env.MISCHWERK_LAYOUT_BEFORE&&width===1490&&deviceScaleFactor===1&&role==='listener')await captureDesign(page,'Breitenfehler-Vorher-1490');
        assert.ok(row.faceVisible&&row.faceWidth>0&&row.faceHeight>0,'Musikkartenhintergrund bleibt sichtbar bei '+width+' × '+height);
        for(const field of ['titleCenter','artistCenter','volumeCenter'])assert.ok(Math.abs(row[field]-row.center)<1.5,field+' bleibt zur Musikkarte zentriert bei '+width+' × '+height+'; Abweichung '+(row[field]-row.center));
        assert.equal(row.horizontalOverflow,false,'Keine horizontale Überbreite bei '+width+' × '+height);
        for(const pattern of [row.grooves,row.arcs]) {
          assert.ok(Math.abs(pattern.width-pattern.height)<1,'Rillen und Bogenlinien bleiben kreisförmig');
          assert.ok(pattern.width<=Math.max(180,row.faceWidth*.8),'Dekoration passt sich schmalen Musikkarten an');
        }
        if(deviceScaleFactor===1&&role==='owner'&&[320,390,699,700,1024,1360,1490,1599,1600,1920].includes(width))await captureDesign(page,'Breiten-Korrektur-'+width+'-'+height);
      }
      await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,topic:'S'.repeat(80),moderator:{nick:'EinSehrLangerModeratornameMitWeiteremZusatz'}}),state);
      for(const [width,height] of [[320,160],[700,160],[1490,160],[1599,160],[390,600]]) {
        await resizeViewport(page,{width,height});
        await page.locator('#show-topic').scrollIntoViewIfNeeded();await page.locator('#host-name').scrollIntoViewIfNeeded();
        assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollWidth>n.clientWidth),false,'Lange Themen und Nicks bleiben vollständig umbrechend');
      }
      assert.deepEqual(errors,[]);await page.context().close();
    }
  } finally {
    if(process.env.MISCHWERK_LAYOUT_RESULTS)fs.writeFileSync(process.env.MISCHWERK_LAYOUT_RESULTS,JSON.stringify(rows,null,2)+'\n');
  }
});
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
function radioSong(song) { return song ? {title:song.title,artist:typeof song.artist==='string'?song.artist:song.artist?.name} : null; }
async function setup(t, { role = 'owner', curtainClosed = false, nick, parserIncludes = false, deviceScaleFactor = 1, station = false, delayedSong = false, delayedStatus = false, providerStatus = 'started', throwingPlay = false, clock = false, k3 = true, realAudio = false, cors = true, savedVolume, loadingDelay, loadingPause = 0, initialRequest = false, view = 'radio', viewport = { width: 960, height: 760 } } = {}) {
  const h = createHarness(); h.config.radioking.radioId = station ? 'test-radio' : ''; 
  const owner=h.user(1,'Otterchen','owner'),ownerSession=h.open(owner);
  const user=role==='owner'?owner:h.user(2,role==='radioModerator'?'RadioMod':'Musikfreund',role==='channelModerator'?'moderator':role==='manager'?'manager':'listener');
  if(role==='radioModerator')h.event(owner,ownerSession,'mw:addRadioModerator',{nick:user.nick});
  const session=role==='owner'?ownerSession:h.open(user);
  if(nick){user.nick=nick;}
  const state = h.state(user, session); state.view = view; state.curtain.closed=curtainClosed;
  if (initialRequest) { state.queue = [{id:201,nick:'Hörer',text:'a-ha – Take On Me',createdAt:Date.now()}]; state.queueTotal=1; state.pages=1; }
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  t.after(() => context.close());
  const page = await context.newPage(); const errors = [],requests=[]; let releaseSong,releaseStatus;
  if(parserIncludes){page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(5000);}
  page.on('request',request=>requests.push(request.url()));
  const songGate = new Promise(resolve => { releaseSong = resolve; });
  const statusGate = new Promise(resolve => { releaseStatus = resolve; });
  let releaseLayout;
  const layoutGate = new Promise(resolve => { releaseLayout = resolve; });
  let loadingSnapshot = null;
  page.on('pageerror', error => errors.push(error.message));
  if (clock) { await page.clock.install(); }
  await page.addInitScript(({ state, throwingPlay, k3, realAudio, savedVolume, parserIncludes }) => {
    if(savedVolume!==undefined){localStorage.setItem('mischwerk.volume.v1',String(savedVolume));}
    window.__sent = []; window.__handlers = {}; window.__rejects = []; window.__adRejects = []; window.__adPlays = []; window.__sizes = []; window.__inclusions = [];
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
      addEventListener(type, callback) { (window.__handlers[type] || (window.__handlers[type] = [])).push(callback); },
      getHostFrame() { return { setTitle() {}, setResizable() {}, setSize(width, height) { window.__sizes.push([width, height]); } }; }, isK3Client() { return k3; }
    };
    window.__contexts=[];
    window.AudioContext=window.webkitAudioContext=function(){window.__contexts.push('unexpected');throw new Error('Keine Audioanalyse vorgesehen');};
    if(realAudio){return;}
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () {
      if(this.id==='curtain-audio'){
        window.__adPlays.push({src:this.src,volume:this.volume,muted:this.muted});
        return new Promise((resolve,reject)=>window.__adRejects.push(reject));
      }
      if (throwingPlay) { throw new Error('Playback not supported'); }
      return new Promise((resolve, reject) => window.__rejects.push(reject));
    };
  }, { state, throwingPlay, k3, realAudio, savedVolume, parserIncludes });
  if(realAudio){
    const body=require('./audio-fixture.cjs').audioFixture();
    await page.route('https://play.radioking.io/test-radio',route=>{
      const match=(route.request().headers().range||'').match(/bytes=(\d+)-(\d*)/);
      const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),body.length-1):body.length-1;
      return route.fulfill({status:match?206:200,contentType:'audio/wav',headers:{
        'Access-Control-Allow-Origin':cors?'*':'https://not-allowed.test','Accept-Ranges':'bytes',
        ...(match?{'Content-Range':'bytes '+start+'-'+end+'/'+body.length}:{})
      },body:body.subarray(start,end+1)});
    });
  }
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current', async route => {
    if (delayedSong) { await songGate; }
    await route.fulfill({ json: radioSong({title:'Testtitel',artist:'Testinterpret'}) });
  });
  await page.route(/^https:\/\/api\.radioking\.io\/widget\/radio\/[a-z0-9-]+\/listener$/, route =>
    route.fulfill({ json: { listener_count: 12 } }));
  await page.route(/^https:\/\/api\.radioking\.io\/widget\/radio\/[a-z0-9-]+$/,async route=>{
    if(delayedStatus){await statusGate;}
    await route.fulfill({json:{slug:new URL(route.request().url()).pathname.split('/').pop(),stream_status:providerStatus,status:'active',live:null}});
  });
  await page.route('http://mischwerk.test/**', async route => {
    const url = new URL(route.request().url());
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const absolute = path.resolve(root, 'app/www', file);
    if (!absolute.startsWith(path.join(root, 'app', 'www') + path.sep) || !fs.existsSync(absolute)) { await route.fulfill({ status: 404 }); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' };
    if(file.endsWith('.mp3')){
      const body=fs.readFileSync(absolute),match=(route.request().headers().range||'').match(/bytes=(\d+)-(\d*)/);
      const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),body.length-1):body.length-1;
      return route.fulfill({status:match?206:200,contentType:'audio/mpeg',headers:{'Accept-Ranges':'bytes',
        ...(match?{'Content-Range':'bytes '+start+'-'+end+'/'+body.length}:{})},body:body.subarray(start,end+1)});
    }
    if ((['css','parallel'].includes(loadingDelay) && file === 'css/foundation.css') || (loadingDelay === 'script' && file === 'js/start.js') ||
        (loadingDelay === 'module' && file === ({studio:'js/studio/queue.js',team:'js/team/management.js'}[view] || 'js/radio/player.js')) ||
        (loadingDelay === 'stylesheet' && file === ({studio:'css/studio.css',team:'css/team.css'}[view] || 'css/radio-surface.css')) ||
        (loadingDelay === 'logo' && file === 'img/mischwerk-logo.png') ||
        (loadingDelay === 'actions' && file === 'css/radio-actions.css')) { await layoutGate; }
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(absolute) });
  });
  const metadataRequested=station&&view==='radio'&&!delayedStatus&&providerStatus!=='stopped'?page.waitForRequest('https://api.radioking.io/widget/radio/test-radio/track/current'):null;
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
test('Fehlendes Startmodul zeigt einen verständlichen Hinweis statt dauerhaft leerer Fläche',async t=>{
  const {page}=await setup(t,{station:true,clock:true});
  const missing='http://mischwerk.test/js/radio/curtain.js';
  await page.route(missing,route=>route.abort());
  await page.reload();
  assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('mw-ready')),false);
  await page.clock.fastForward(15001);
  assert.equal(await page.locator('#startup-error').isVisible(),true);
  assert.match(await page.locator('#startup-error').textContent(),/vollständige App-Upload/);
  assert.equal(await page.locator('#play-button').count(),0,'Keine halbfertige bedienbare Oberfläche');
  await page.unroute(missing);
  await page.reload();
  await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  assert.equal(await page.locator('#startup-error').isVisible(),false);
  assert.equal(await page.locator('#play-button').isVisible(),true);
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
test('Vorhang lässt Otterchen und Polaroid frei und zeigt die globale Steuerung nur Otterchen',async t=>{
  for(const [role,nick,manage,exempt] of [['owner','Otterchen',true,true],['listener','Polaroid',false,true],['owner','AndererInhaber',false,false]]){
    const {page,state,errors}=await setup(t,{role,nick,curtainClosed:true,station:true,viewport:{width:1360,height:160}});
    assert.equal(await page.locator('#radio-curtain').isVisible(),!exempt);
    assert.equal(await page.locator('#curtain-toggle').isVisible(),manage);
    if(manage){
      for(const width of [320,390,700,960,1360]){
        await resizeViewport(page,{width,height:160});
        await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<700),width);
        const box=await page.locator('#curtain-toggle').boundingBox();
        assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=160.5,JSON.stringify({width,box}));
        if(width===1360&&process.env.MISCHWERK_CURTAIN_SCREENSHOTS){
          await page.screenshot({path:path.join(process.env.MISCHWERK_CURTAIN_SCREENSHOTS,'Otterchen-Steuerung.png')});
        }
      }
      await page.locator('#curtain-toggle').click();
      const event=await page.evaluate(()=>window.__sent.find(e=>e.type==='mw:setCurtain'));
      assert.equal(event.data.closed,false);assert.equal(event.data.previousClosed,true);
      assert.equal(await page.locator('#curtain-toggle').isDisabled(),true);
      assert.equal(await page.locator('#curtain-toggle-label').textContent(),'Vorhang öffnen');
      await page.evaluate(({event,state})=>{
        window.__emit('mw:result',{ok:true,action:event.type,requestId:event.data.requestId,message:'Vorhang geöffnet.'});
        window.__emit('mw:state',{...state,revision:2,curtain:{...state.curtain,closed:false}});
      },{event,state});
      assert.equal(await page.locator('#curtain-toggle-label').textContent(),'Vorhang schließen');
      assert.equal(await page.locator('#curtain-toggle').isEnabled(),true);
      assert.equal(await page.locator('#radio-curtain').isVisible(),false);
    }
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

async function statusReady(page) {
  await page.waitForFunction(() => !document.getElementById('refresh-status').disabled &&
    document.getElementById('status-transmission-value').textContent !== 'Prüfe …');
}
async function statusRefresh(page) {
  await page.locator('#refresh-status').click(); await statusReady(page);
}

test('Statuszentrale trennt RadioKing-LIVE/AutoDJ und Studio-ON-AIR und zeigt bestätigte Funktionszustände', async t => {
  const {page,state,errors}=await setup(t,{view:'team',station:true,k3:false,viewport:{width:560,height:560}});
  let isLive=false;
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'A < B',artist:'Interpret',is_live:isLive}}));
  await page.route('**/test-radio/listener',route=>route.fulfill({json:{listener_count:0}}));
  await page.locator('#team-status-tab').click(); await statusReady(page);
  assert.equal(await page.locator('#team-members').isVisible(),false);
  assert.equal(await page.locator('#status-mode-value').textContent(),'AutoDJ');
  assert.match(await page.locator('#status-mode-detail').textContent(),/RadioKing-Titelkennzeichnung/);
  assert.equal(await page.locator('#status-studio-value').textContent(),'Kein ON AIR');
  assert.equal(await page.locator('#status-transmission-value').textContent(),'Sendet');
  assert.equal(await page.locator('#status-listeners-value').textContent(),'0');
  assert.equal(await page.locator('#status-app-value').textContent(),'Verbunden');
  assert.equal(await page.locator('#status-mode-warning').isVisible(),false);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,requestsEnabled:false,queueTotal:8,topic:'<img src=x>',moderator:{nick:'<b>Stimme</b>',expiresAt:Date.now()+60000}}),state);
  assert.equal(await page.locator('#status-wishes-value').textContent(),'Deaktiviert');
  assert.equal(await page.locator('#status-queue-value').textContent(),'8 offen');
  assert.equal(await page.locator('#status-topic-detail').textContent(),'<img src=x>');
  assert.equal(await page.locator('#status-studio-value').textContent(),'ON AIR · <b>Stimme</b>');
  assert.equal(await page.locator('#team-status img, #team-status b').count(),0);
  assert.match(await page.locator('#status-mode-warning').textContent(),/Encoderverbindung prüfen/);
  isLive=true;await statusRefresh(page);
  assert.equal(await page.locator('#status-mode-value').textContent(),'LIVE');
  assert.equal(await page.locator('#status-mode-warning').isVisible(),false);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,moderator:null}),state);
  assert.match(await page.locator('#status-mode-warning').textContent(),/niemand ON AIR/);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);
  assert.equal(await page.evaluate(()=>window.__sent.some(e=>/onAir|offAir|setRequests/.test(e.type))),false);
  assert.deepEqual(errors,[]);
});

test('Statuszentrale erfindet aus fehlenden, falschen oder gesperrten Daten keinen AutoDJ- oder Hörerstatus',async t=>{
  const {page,errors}=await setup(t,{view:'team',station:true});
  let song={title:'Titel',artist:'Interpret',is_live:false},info={slug:'test-radio',stream_status:'started'},listeners={listener_count:20},http=200;
  await page.route('**/test-radio/track/current',r=>r.fulfill({json:song}));
  await page.route('**/test-radio/listener',r=>r.fulfill({status:http,json:listeners}));
  await page.route('**/test-radio',r=>r.fulfill({json:info}));
  await page.locator('#team-status-tab').click();await statusReady(page);
  for(const flag of [undefined,null,'false',0,{},'true']){
    song={title:'Titel',artist:'Interpret',is_live:flag};await statusRefresh(page);
    assert.equal(await page.locator('#status-mode-value').textContent(),'Status unbekannt');
  }
  song={title:'Titel',artist:'Interpret',is_live:false};info={slug:'wrong-radio',stream_status:'started'};http=403;
  await statusRefresh(page);
  assert.equal(await page.locator('#status-mode-value').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#status-transmission-value').textContent(),'Nicht erreichbar');
  assert.equal(await page.locator('#status-listeners-value').textContent(),'Nicht erreichbar');
  info={slug:'test-radio',status:'active',live:true};http=200;listeners={listener_count:-1};await statusRefresh(page);
  assert.equal(await page.locator('#status-transmission-value').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#status-mode-value').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#status-listeners-value').textContent(),'Nicht erreichbar');
  info={slug:'test-radio',stream_status:'started'};song=null;listeners={listener_count:0};await statusRefresh(page);
  assert.equal(await page.locator('#status-metadata-value').textContent(),'Keine Titelangaben');
  assert.equal(await page.locator('#status-mode-value').textContent(),'Status unbekannt');
  assert.deepEqual(errors,[]);
});

test('Statuszentrale prüft Sendepausen ohne Audio oder Titelabruf und erholt sich nach HTTP-Fehlern',async t=>{
  const {page,errors}=await setup(t,{view:'team',station:true,providerStatus:'stopped'});let titles=0;
  await page.route('**/test-radio/track/current',r=>{titles++;return r.fulfill({status:404,json:{error:'unavailable'}});});
  await page.locator('#team-status-tab').click();await statusReady(page);
  assert.equal(await page.locator('#status-mode-value').textContent(),'Sendepause');
  assert.equal(await page.locator('#status-metadata-value').textContent(),'Sendepause');assert.equal(titles,0);
  await page.route('**/test-radio',r=>r.fulfill({json:{slug:'test-radio',stream_status:'started'}}));await statusRefresh(page);
  assert.equal(await page.locator('#status-transmission-value').textContent(),'Sendet');
  assert.equal(await page.locator('#status-metadata-value').textContent(),'Nicht erreichbar');
  assert.equal(await page.locator('#status-mode-value').textContent(),'Status unbekannt');
  await page.route('**/test-radio/track/current',r=>r.fulfill({json:{title:'Wieder da',is_live:false}}));await statusRefresh(page);
  assert.equal(await page.locator('#status-mode-value').textContent(),'AutoDJ');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
});

test('Statuszentrale pollt 30/60 Sekunden nur im sichtbaren Reiter und beendet Abfragen bei Seitenende',async t=>{
  const {page,state,requests,errors}=await setup(t,{view:'team',station:true,clock:true});let failed=false,calls=0;
  await page.route('**/test-radio/listener',r=>{calls++;return r.fulfill({status:failed?503:200,json:{listener_count:0}});});
  const pulse=()=>page.evaluate(state=>window.__emit('mw:state',state),state);
  await page.locator('#team-status-tab').click();await statusReady(page);assert.equal(calls,1);
  await page.clock.runFor(29900);assert.equal(calls,1);
  failed=true;await page.clock.runFor(200);await statusReady(page);assert.equal(calls,2);
  await pulse();await page.clock.runFor(59000);assert.equal(calls,2);
  await pulse();failed=false;await page.clock.runFor(1200);await statusReady(page);assert.equal(calls,3);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(31000);assert.equal(calls,3);
  await pulse();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await statusReady(page);assert.equal(calls,4);
  await page.locator('#team-members-tab').click();await page.clock.runFor(31000);assert.equal(calls,4);
  await pulse();await page.locator('#team-status-tab').click();await statusReady(page);assert.equal(calls,5);
  const count=requests.filter(u=>u.startsWith('https://api.radioking.io/')).length;
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));await page.clock.runFor(61000);
  assert.equal(requests.filter(u=>u.startsWith('https://api.radioking.io/')).length,count);assert.deepEqual(errors,[]);
});

test('Statuszentrale verwirft verspätete Senderantworten, begrenzt Parallelabfragen und stoppt bei Rechteverlust',async t=>{
  const {page,state,requests,errors}=await setup(t,{view:'team',station:true});let release,calls=0;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/test-radio/listener',async r=>{calls++;await gate;return r.fulfill({json:{listener_count:999}});});
  const requested=page.waitForRequest('**/test-radio/listener');
  await page.locator('#team-status-tab').click();await requested;
  assert.equal(await page.locator('#refresh-status').isDisabled(),true);
  await page.locator('#refresh-status').evaluate(b=>{b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});assert.equal(calls,1);
  await page.route('**/other-radio/listener',r=>r.fulfill({json:{listener_count:7}}));
  await page.route('**/other-radio/track/current',r=>r.fulfill({json:{title:'Neuer Sender',is_live:true}}));
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,station:{...state.station,radioId:'other-radio',streamUrl:'https://play.radioking.io/other-radio',metadataUrl:'https://api.radioking.io/widget/radio/other-radio/track/current'}}),state);
  await statusReady(page);release();await page.waitForTimeout(30);
  assert.equal(await page.locator('#status-listeners-value').textContent(),'7');
  assert.equal(await page.locator('#status-mode-value').textContent(),'LIVE');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,user:{...state.user,canManageRadioModerators:false}}),state);
  assert.equal(await page.locator('#team-panel').isVisible(),false);
  const count=requests.length;await page.locator('#team-status-tab').evaluate(b=>b.click());await page.waitForTimeout(20);
  assert.equal(requests.length,count);assert.deepEqual(errors,[]);
});

test('Statuszentrale blendet veraltete Appzustände aus und bleibt ohne Senderkonfiguration bedienbar',async t=>{
  const {page,state,errors,requests}=await setup(t,{view:'team',clock:true});
  await page.locator('#team-status-tab').click();
  assert.equal(await page.locator('#status-mode-value').textContent(),'Nicht eingerichtet');
  assert.equal(requests.some(u=>u.startsWith('https://api.radioking.io/')),false);
  await page.clock.runFor(66000);
  assert.equal(await page.locator('#status-app-value').textContent(),'Verbindung fehlt');
  assert.equal(await page.locator('#status-wishes-value').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#refresh-status').isEnabled(),true);
  await page.locator('#refresh-status').click();assert.equal(await page.evaluate(()=>window.__sent.at(-1).type),'mw:refresh');
  await page.evaluate(state=>window.__emit('mw:state',state),state);
  assert.equal(await page.locator('#status-app-value').textContent(),'Verbunden');assert.deepEqual(errors,[]);
});

test('Statuszentrale bleibt bei 320–780 Pixeln scrollbar, fokussierbar und ohne native Größensprünge',async t=>{
  for(const k3 of [true,false]){
    const {page,state,errors}=await setup(t,{view:'team',station:true,k3,viewport:{width:560,height:560}});
    await page.route('**/test-radio/track/current',r=>r.fulfill({json:{title:'T'.repeat(300),artist:'I'.repeat(100),is_live:false}}));
    await page.locator('#team-status-tab').click();await statusReady(page);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'S'.repeat(80),moderator:{nick:'N'.repeat(50)}}),state);
    for(const width of [320,390,560,780]){
      await page.setViewportSize({width,height:360});
      for(const selector of ['#refresh-status','.status-provider-link','#team-members-tab']){
        if(selector==='.status-provider-link'){await page.locator('#status-details > summary').click();}
        await page.locator(selector).scrollIntoViewIfNeeded();
        assert.ok(await page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}));
      }
      await page.locator('#status-details').evaluate(n=>{n.open=false;});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    await page.setViewportSize({width:560,height:560});await page.evaluate(()=>window.scrollTo(0,0));
    if(k3)await captureDesign(page,'Statuszentrale-560');
    await page.setViewportSize({width:320,height:560});await page.evaluate(()=>window.scrollTo(0,0));
    if(k3)await captureDesign(page,'Statuszentrale-320');
    await page.locator('#team-members-tab').click();assert.equal(await page.locator('#radio-moderator-form').isVisible(),true);
    assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);assert.deepEqual(errors,[]);
  }
});

test('Statuszentrale bleibt dem tatsächlichen Channelinhaber vorbehalten und berührt andere Popups nicht',async t=>{
  for(const role of ['listener','radioModerator','channelModerator','manager']){
    const {page,requests,errors}=await setup(t,{view:'team',role,station:true,clock:true});
    await page.locator('#team-status-tab').evaluate(b=>b.click());await page.clock.runFor(31000);
    assert.equal(await page.locator('#team-status').isVisible(),false);
    assert.equal(requests.some(u=>u.startsWith('https://api.radioking.io/')),false);assert.deepEqual(errors,[]);
  }
});

test('Kompakte Statuszentrale zeigt alle neun Statuswerte bei 320 und 560 Pixeln ohne Scrollen',async t=>{
  const {page,errors}=await setup(t,{view:'team',station:true,k3:false,viewport:{width:560,height:560}});
  await page.route('**/test-radio/track/current',r=>r.fulfill({json:{title:'American Pie',artist:'Don McLean',is_live:false}}));
  await page.locator('#team-status-tab').click();await statusReady(page);
  const measurements=[];
  for(const width of [560,320,390,480,481,780]){
    await page.setViewportSize({width,height:560});await page.evaluate(()=>window.scrollTo(0,0));
    const result=await page.evaluate(()=>{
      const ids=['mode','transmission','studio','listeners','app','wishes','queue','metadata','topic'];
      return {width:innerWidth,height:document.querySelector('.dialog-shell').getBoundingClientRect().height,
        overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
        detailsOpen:document.getElementById('status-details').open,
        values:ids.map(id=>{const n=document.getElementById('status-'+id+'-value'),r=n.getBoundingClientRect();return {id,text:n.textContent,top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(n).fontSize)};}),
        controlHeights:['#refresh-status','#team-members-tab','#team-status-tab','#status-details > summary'].map(s=>document.querySelector(s).getBoundingClientRect().height)};
    });
    measurements.push(result);
    assert.equal(result.overflow,false,JSON.stringify(result));assert.equal(result.detailsOpen,false);
    for(const value of result.values){assert.ok(value.text&&value.top>=0&&value.bottom<=560&&value.font>=16,JSON.stringify(value));}
    assert.ok(result.controlHeights.every(height=>height>=44));
    if(width===560||width===320)await captureDesign(page,'Statuszentrale-'+width);
  }
  console.log('Statuskompakt-Messung: '+JSON.stringify(measurements.map(({width,height})=>({width,height}))));
  assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);assert.deepEqual(errors,[]);
});

test('Statusdetails bleiben vollständig erreichbar und bei Aktualisierungen geöffnet; Warnungen sind sofort sichtbar',async t=>{
  const {page,state,errors}=await setup(t,{view:'team',station:true,viewport:{width:320,height:560}});
  const title='T'.repeat(300),artist='Interpret '+ 'I'.repeat(100),nick='N'.repeat(50),topic='S'.repeat(80);
  await page.route('**/test-radio/track/current',r=>r.fulfill({json:{title,artist,is_live:false}}));
  await page.locator('#team-status-tab').click();await statusReady(page);
  await page.evaluate(({state,nick,topic})=>window.__emit('mw:state',{...state,revision:2,moderator:{nick,expiresAt:Date.now()+60000},topic}),{state,nick,topic});
  assert.equal(await page.locator('#status-mode-warning').isVisible(),true);
  assert.equal(await page.locator('#status-details').getAttribute('open'),null);
  assert.equal(await page.locator('#status-studio-value').textContent(),'ON AIR · '+nick);
  const summary=page.locator('#status-details > summary');await summary.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#status-details').getAttribute('open'),'');
  for(const name of ['mode','transmission','studio','listeners','metadata','app','wishes','queue','topic']){
    assert.ok((await page.locator('#status-'+name+'-detail').textContent()).length);
  }
  assert.match(await page.locator('#status-metadata-detail').textContent(),new RegExp(title));
  assert.match(await page.locator('#status-metadata-detail').textContent(),new RegExp(artist));
  assert.equal(await page.locator('#status-topic-detail').textContent(),topic);
  assert.match(await page.locator('#status-mode-detail').textContent(),/Geprüft um/);
  await page.locator('.status-provider-link').scrollIntoViewIfNeeded();assert.equal(await page.locator('.status-provider-link').isVisible(),true);
  await summary.focus();
  await page.evaluate(({state,nick,topic})=>window.__emit('mw:state',{...state,revision:3,moderator:{nick},topic}),{state,nick,topic});
  assert.equal(await summary.evaluate(n=>document.activeElement===n),true);
  await statusRefresh(page);
  assert.equal(await page.locator('#status-details').getAttribute('open'),'');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await summary.focus();await page.keyboard.press('Space');assert.equal(await page.locator('#status-details').getAttribute('open'),null);
  await page.locator('#team-members-tab').click();assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('status-central-open')),false);
  assert.equal(await page.locator('#radio-moderator-form').isVisible(),true);assert.deepEqual(errors,[]);
});

test('RadioKing-Hörerzahl ist für alle Rollen sichtbar und aktualisiert sich auch ohne Play alle 20 Sekunden', async t => {
  for (const role of ['listener', 'radioModerator', 'owner']) {
    const { page, errors } = await setup(t, { station: true, role, clock: true, viewport: { width: 960, height: 160 } });
    await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
    let value = 0, calls = 0;
    await page.route('https://api.radioking.io/widget/radio/test-radio/listener', route => {
      calls += 1; return route.fulfill({ json: { listener_count: value } });
    });
    await page.clock.fastForward(20100);
    await page.locator('#listener-count').filter({ hasText: 'Hörer: 0' }).waitFor();
    assert.equal(calls, 1);
    value = '1234';
    await page.clock.fastForward(20100);
    await page.locator('#listener-count').filter({ hasText: 'Hörer: 1.234' }).waitFor();
    assert.equal(calls, 2);
    assert.equal(await page.locator('#radio-audio').getAttribute('src'), null);
    for (const width of [320, 700, 1360]) {
      await resizeViewport(page, { width, height: 160 });
      await page.locator('#listener-count').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#listener-count').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
  }
});

test('RadioKing-Hörerfehler zeigen keine falsche Null, erhalten Audio und warten 60 Sekunden bis zum Retry', async t => {
  const { page, errors } = await setup(t, { station: true, clock: true });
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
  await page.locator('#play-button').click();
  await page.locator('#radio-audio').evaluate(audio => audio.dispatchEvent(new Event('playing')));
  const source = await page.locator('#radio-audio').getAttribute('src');
  let calls = 0;
  await page.route('https://api.radioking.io/widget/radio/test-radio/listener', route => {
    calls += 1; return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
  });
  await page.clock.fastForward(20100);
  await page.locator('#listener-count').filter({ hasText: 'Hörer: nicht verfügbar' }).waitFor();
  assert.equal(calls, 1);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), source);
  await page.clock.fastForward(59000);
  assert.equal(calls, 1);
  await page.clock.fastForward(1100);
  await page.waitForFunction(() => document.getElementById('listener-count').textContent === 'Hörer: nicht verfügbar');
  await page.waitForTimeout(20);
  assert.equal(calls, 2);
  assert.deepEqual(errors, []);
});

test('RadioKing-Hörerantworten werden streng geprüft und nach Rückkehr sofort neu gelesen', async t => {
  const { page, errors } = await setup(t, { station: true });
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
  let response;
  await page.route('https://api.radioking.io/widget/radio/test-radio/listener', route => route.fulfill({ json: response }));
  for (response of [null, {}, [], { listener_count: null }, { listener_count: false }, { listener_count: -1 },
    { listener_count: 1.5 }, { listener_count: '12 Hörer' }, { listener_count: '' },
    { listener_count: 9007199254740992 }, { listener_count: 12, error: true }]) {
    await page.evaluate(() => { document.getElementById('listener-value').textContent = ''; document.dispatchEvent(new Event('visibilitychange')); });
    await page.locator('#listener-count').filter({ hasText: 'Hörer: nicht verfügbar' }).waitFor();
  }
  response = { listener_count: 7 };
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 7' }).waitFor();
  assert.deepEqual(errors, []);
});

test('RadioKing-Hörerabfragen sind einfach laufend, sendergebunden und enden beim Seitenende', async t => {
  const { page, state, requests, errors } = await setup(t, { station: true, clock: true });
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
  let release, calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  t.after(release);
  await page.route('https://api.radioking.io/widget/radio/test-radio/listener', async route => {
    calls += 1; await gate; await route.fulfill({ json: { listener_count: 8 } });
  });
  const pendingRequest = page.waitForRequest('https://api.radioking.io/widget/radio/test-radio/listener');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await pendingRequest;
  for (let i = 0; i < 4; i++) { await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); }
  assert.equal(calls, 1);
  await page.route('https://api.radioking.io/widget/radio/other-radio/listener', route => route.fulfill({ json: { listener_count: 99 } }));
  await page.route('https://api.radioking.io/widget/radio/other-radio/track/current', route => route.fulfill({ json: { title: 'Anderer Titel', artist: 'Andere Band' } }));
  await page.evaluate(state => window.__emit('mw:state', { ...state, revision: 2, station: { ...state.station,
    radioId: 'other-radio', streamUrl: 'https://play.radioking.io/other-radio',
    metadataUrl: 'https://api.radioking.io/widget/radio/other-radio/track/current' } }), state);
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 99' }).waitFor();
  const oldResponse = page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/listener');
  release(); await oldResponse; await page.waitForTimeout(20);
  assert.equal(await page.locator('#listener-count').textContent(), 'Hörer: 99');
  const count = requests.filter(url => url.endsWith('/listener')).length;
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await page.clock.fastForward(75000);
  assert.equal(requests.filter(url => url.endsWith('/listener')).length, count);
  assert.deepEqual(errors, []);
});

test('Popups und unsichtbare Radioleisten fragen keine RadioKing-Hörerzahl ab', async t => {
  for (const view of ['wishes', 'studio', 'team', 'schedule']) {
    const { requests, errors } = await setup(t, { station: true, view });
    assert.equal(requests.some(url => url.endsWith('/listener')), false);
    assert.deepEqual(errors, []);
  }
  const { page, requests } = await setup(t, { station: true, clock: true });
  await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
  const count = requests.filter(url => url.endsWith('/listener')).length;
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
  await page.clock.fastForward(45000);
  assert.equal(requests.filter(url => url.endsWith('/listener')).length, count);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(30);
  assert.equal(requests.filter(url => url.endsWith('/listener')).length, count + 1);
});

test('Hörerzahl steht unter Play statt der sichtbaren Statuszeile und überlappt keine Radioaktion', async t => {
  for (const role of ['listener', 'owner']) {
    const { page, errors } = await setup(t, { station: true, role });
    await page.locator('#listener-count').filter({ hasText: 'Hörer: 12' }).waitFor();
    let count = 0;
    await page.route('https://api.radioking.io/widget/radio/test-radio/listener', route =>
      route.fulfill({ json: { listener_count: count } }));
    for (const value of [0, 1234, null]) {
      count = value;
      const response = page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/listener');
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await response;
      await page.locator('#listener-count').filter({ hasText: value === null ? 'nicht verfügbar' :
        'Hörer: ' + value.toLocaleString('de-DE') }).waitFor();
      for (const [width, height] of [[320, 160], [390, 160], [699, 160], [700, 160], [1099, 160], [1100, 160], [1360, 160], [390, 600]]) {
        await resizeViewport(page, { width, height });
        await page.waitForFunction(({ width, height }) => document.documentElement.classList.contains('radio-constrained') ===
          (width < 700 && height < 360), { width, height });
        const geometry = await page.evaluate(() => {
          const play = document.getElementById('play-button').getBoundingClientRect();
          const counter = document.getElementById('listener-count').getBoundingClientRect();
          const actions = document.getElementById('radio-actions').getBoundingClientRect();
          return { below: counter.top >= play.bottom, centered: Math.abs(counter.x + counter.width / 2 - play.x - play.width / 2),
            top: counter.top, bottom: counter.bottom, left: counter.left, right: counter.right, actionsTop: actions.top,
            constrained: document.documentElement.classList.contains('radio-constrained'),
            overflow: document.documentElement.scrollWidth > innerWidth,
            accessible: document.getElementById('listener-count').getAttribute('aria-label') };
        });
        assert.equal(geometry.below, true, 'Hörerzahl unter Play bei ' + width);
        assert.ok(geometry.centered < 1.5, 'Hörerzahl mittig unter Play');
        assert.ok(geometry.left >= 0 && geometry.right <= width, 'Hörerzahl bleibt im Frame');
        if (geometry.constrained) { assert.ok(geometry.bottom <= geometry.actionsTop, 'Keine Überlagerung der Aktionen: ' + JSON.stringify({width, value, ...geometry})); }
        assert.equal(geometry.overflow, false);
        assert.match(geometry.accessible, /^Hörer: /);
      }
    }
    assert.equal(await page.locator('.transport > #listener-count').count(), 1);
    assert.equal(await page.locator('.radio-context #listener-count,.live-badge,.transport #stream-badge').count(), 0);
    assert.equal(await page.locator('#stream-label').evaluate(node => !!node.closest('.sr-only')), true);
    assert.deepEqual(errors, []);
  }
});
async function resizeViewport(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
}
async function radioAction(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.locator(selector).click();
}
async function captureDesign(page, name) {
  if (!process.env.MISCHWERK_DESIGN_CAPTURE) return;
  const folder=path.join(root,'docs/pruefung/bilder/design');fs.mkdirSync(folder,{recursive:true});
  const size=page.viewportSize();
  const contentHeight=await page.locator('html').getAttribute('data-view')==='radio' ?
    Math.ceil((await page.locator('#radio-panel').boundingBox()).height) : Math.min(1000,Math.ceil((await page.locator('.dialog-shell').boundingBox()).height));
  await page.evaluate(version => {
    const note=document.createElement('div');note.id='local-test-note';
    note.textContent='MischWerk '+version+' · lokale Vorschau';
    note.style.cssText='position:fixed;bottom:0;left:0;right:0;height:24px;padding:4px 8px;background:#202020;color:#c4c1b5;font:12px Segoe UI,Arial;z-index:100;visibility:visible';
    document.body.appendChild(note);
  }, require('../package.json').version);
  await page.setViewportSize({width:size.width,height:contentHeight+24});
  await page.waitForTimeout(180); // Farbwechsel der Reiter vor der Aufnahme abschließen.
  await page.screenshot({path:path.join(folder,name+'.png')});
  await page.evaluate(()=>document.getElementById('local-test-note').remove());
  await page.setViewportSize(size);
}

test('Gemeinsame Dialogköpfe, sichtbarer Zeichenzähler und lange Eingaben bleiben auf schmalen Flächen lesbar',async t=>{
  for(const [view,width,height] of [['wishes',320,568],['studio',780,860],['team',560,600]]) {
    const {page,state,errors}=await setup(t,{view,viewport:{width,height}});
    assert.equal(await page.locator('.dialog-brand img').evaluate(n=>getComputedStyle(n).mixBlendMode),'lighten');
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
      assert.equal(loadingSnapshot.background,'rgb(36, 36, 36)');
      assert.equal(loadingSnapshot.visibility,'hidden');assert.equal(loadingSnapshot.initialized,false);
      assert.deepEqual(loadingSnapshot.sizes,[],'Keine geratenen Größen vor der geladenen Oberfläche');
      const sizes=await page.evaluate(()=>window.__sizes);
      assert.equal(sizes.length,k3?0:1,'Höchstens ein initialer Hostaufruf');
      if(!k3){assert.equal(sizes[0][0],0);assert.ok(sizes[0][1]>=160&&sizes[0][1]<=500);}
      assert.equal(await page.locator('#radio-panel').isVisible(),true);assert.deepEqual(errors,[]);
    }
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
      await page.waitForFunction(()=>window.__sent.some(event=>event.type==='mw:ackRequest'));
      assert.equal(await page.evaluate(()=>window.__sent.filter(event=>event.type==='mw:ackRequest').length),1);
    }
    assert.deepEqual(errors,[]);
  }
});

test('Jedes Fenster lädt nur seine Module und Styles; erneuter Einstieg verdoppelt keine Hooks oder Initialisierung', async t => {
  const { frontendFilesForView } = require('../tools/frontend-files.cjs');
  for (const view of ['radio','wishes','studio','team','schedule']) {
    const { page, errors, requests } = await setup(t, { view });
    const files = frontendFilesForView(view).filter(file => /\.(js|css)$/.test(file));
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
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://play.radioking.io/test-radio');
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.js')).length,18);
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.css')).length,8);
    assert.equal(requests.some(url=>/\/js\/(studio|team|schedule|wishes)\//.test(url)),false);
    assert.deepEqual(errors,[]);
  }
});

test('Verspätete Play-Ablehnung eines alten Versuchs stoppt keinen neuen Start', async t => {
  const { page, errors } = await setup(t, { station: true });
  await page.locator('#play-button').click(); await page.locator('#play-button').click(); await page.locator('#play-button').click();
  await page.evaluate(() => window.__rejects[0](new Error('alter Start')));
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'), 'Radio stoppen');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), 'https://play.radioking.io/test-radio'); assert.deepEqual(errors, []);
});
test('Synchroner Wiedergabefehler wird direkt angezeigt', async t => {
  const { page, errors } = await setup(t, { station: true, throwingPlay: true });
  await page.locator('#play-button').click();
  await page.locator('#playback-status').filter({ hasText: 'nicht erreichbar' }).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), null); assert.deepEqual(errors, []);
});
test('Externe Audio-Pause setzt Anzeige und Stream zurück', async t => {
  const { page } = await setup(t, { station: true }); await page.locator('#play-button').click();
  await page.evaluate(() => document.getElementById('radio-audio').dispatchEvent(new Event('pause')));
  await page.locator('#playback-status').filter({ hasText: 'unterbrochen' }).waitFor();
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'), 'Radio abspielen');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), null);
});
test('Alte Songantwort darf eine entfernte Senderkonfiguration nicht überschreiben', async t => {
  const { page, state, releaseSong } = await setup(t, { station: true, delayedSong: true });
  state.station = { configured: false, streamUrl: '', stationUrl: '', name: 'MischWerk',metadataEndpoints:[] };
  await page.evaluate(state => window.__emit('mw:state', state), state);
  const response=page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/track/current');releaseSong();await response;
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
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'Am Fenster',artist:'Puhdys & City'}}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Am Fenster');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen'}}),state);
  for(const width of [1440,1100,1099,1024,868,768,760,759,700,699,390,320]) {
    await resizeViewport(page,{width,height:160});
    await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<700),width);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Kein horizontaler Überlauf bei '+width);
    for(const selector of ['#play-button','#track-title','#track-artist','#open-schedule','#open-wishes']) {
      const box=await page.locator(selector).boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=160.5,selector+' sichtbar bei '+width);
      if(selector.includes('button')||selector.includes('open-'))assert.ok(box.height>=44);
    }
    if(width>=700) {
      const logo=await page.locator('.bar-logo').boundingBox(),play=await page.locator('#play-button').boundingBox();
      const volume=await page.locator('.volume-control').boundingBox();
      assert.ok(logo.x>=0&&logo.y>=0&&logo.x+logo.width<=play.x&&logo.y+logo.height<=160,'Logo bleibt vollständig sichtbar und vom Player getrennt');
      assert.ok(volume.x>=play.x+play.width&&volume.x+volume.width<=(await page.locator('#open-schedule').boundingBox()).x,'Lautstärke überlagert weder Player noch Hauptaktionen');
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
    if(stacked) {
      assert.ok(Math.abs(schedule.x-wishes.x)<1&&Math.abs(schedule.width-wishes.width)<1,'Höreraktionen gleich breit untereinander');
      assert.ok(wishes.y>=schedule.y+schedule.height+1,'Sendeplan über Wunschbox mit Abstand');
    } else assert.ok(Math.abs(schedule.y-wishes.y)<1&&wishes.x>=schedule.x+schedule.width,'Zwei öffentliche Aktionen nebeneinander');
  }
  for(const role of ['listener','channelModerator','manager','radioModerator','owner']) {
    const {page,state,errors}=await setup(t,{role,station:true,viewport:{width:1360,height:160}});
    const hasStudio=role==='radioModerator'||role==='owner',hasTeam=role==='owner';
    assert.equal(await page.locator('#radio-more,#radio-back').count(),0);
    assert.equal(await page.locator('#open-schedule').isVisible(),true);
    assert.equal(await page.locator('#open-wishes').isVisible(),true);
    assert.equal(await page.locator('#studio-tab').isVisible(),hasStudio);
    assert.equal(await page.locator('#team-tab').isVisible(),hasTeam);
    assert.equal(await page.locator('#radio-private-actions').isVisible(),hasStudio||hasTeam);
    await arrangement(page,!hasStudio&&!hasTeam);
    if(['listener','radioModerator','owner'].includes(role)) {
      const name='Aktionen-'+(role==='listener'?'Hoerer':role==='owner'?'Inhaber':'Radiomoderator');
      await captureDesign(page,name+'-1360');
      if(process.env.MISCHWERK_DESIGN_CAPTURE)await page.locator('#radio-actions').screenshot({path:path.join(root,'docs/pruefung/bilder/design',name+'-Detail.png')});
    }
    for(const width of [1024,700,390,320]) {
      await resizeViewport(page,{width,height:160});
      await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<700),width);
      if(!hasStudio&&!hasTeam)await arrangement(page,width>=700);
      for(const selector of ['#open-schedule','#open-wishes',...(hasStudio?['#studio-tab']:[]),...(hasTeam?['#team-tab']:[])]) {
        const box=await page.locator(selector).boundingBox();
        assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=160.5,'Sichtbare Aktion für '+role+' bei '+width+': '+selector);
        assert.ok(box.height>=44&&box.width>=44);
      }
    }
    if(hasStudio) {
      await page.locator('#studio-tab').click();assert.equal(await page.evaluate(()=>window.__sent.at(-1).type),'mw:openStudio');
      await page.evaluate(()=>{const sent=window.__sent.at(-1);window.__emit('mw:result',{ok:true,action:sent.type,requestId:sent.data.requestId});});
    }
    if(hasTeam) {
      await page.locator('#team-tab').click();assert.equal(await page.evaluate(()=>window.__sent.at(-1).type),'mw:openRadioTeam');
    }
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,user:{...state.user,canModerate:false,canManageRadioModerators:false}}),state);
    assert.equal(await page.locator('#studio-tab').isVisible(),false);assert.equal(await page.locator('#team-tab').isVisible(),false);
    assert.equal(await page.locator('#radio-private-actions').isVisible(),false);
    await resizeViewport(page,{width:1360,height:160});await arrangement(page,true);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,requestsEnabled:false,user:{...state.user,canModerate:true,canManageRadioModerators:true}}),state);
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
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'Wonders',artist:'Neelix, Ghost Rider & The Gardener and the Tree'}}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Wonders');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'',moderator:null,requestsEnabled:false}),state);
  for(const width of [2291,1920,2560]) {
    await resizeViewport(page,{width,height:160});
    const bar=await page.locator('#radio-panel').boundingBox(),music=await page.locator('.radio-program-face').boundingBox();
    const actions=await page.locator('#radio-actions').boundingBox(),status=await page.locator('.presenter').boundingBox();
    assert.equal(bar.width,width,'Leiste nutzt die volle verfügbare Breite');assert.equal(bar.x,0);
    assert.ok(status.x>=music.x&&status.x+status.width<=music.x+music.width,'Moderationsstatus bleibt innerhalb der Musikgruppe');
    assert.ok(actions.x-music.x-music.width<=16,'Musik und Bedienung bleiben unmittelbar benachbart');
    assert.equal(await page.locator('#radio-topic').isVisible(),false);
    assert.equal(await page.locator('#open-wishes').isDisabled(),true);
    assert.equal(await page.locator('#open-wishes').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(255, 190, 46)','Gesicherte Wunschbox behält die gemeinsame Goldfarbe und bleibt nativ gesperrt');
    assert.equal(await page.locator('#on-air-sign').textContent(),'DJ Mischwerk legt auf');
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
    await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
    await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Wonders');
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen'}}),state);
    const bounds=await page.locator('#radio-panel').boundingBox();
    assert.equal(bounds.width,width);assert.equal(bounds.height,160);assert.equal(bounds.x,0);
    assert.equal(await page.evaluate(()=>devicePixelRatio),deviceScaleFactor);
    assert.equal(await page.locator('.bar-logo').evaluate(n=>n.getBoundingClientRect().width),128);
    assert.equal(await page.locator('#play-button').evaluate(n=>n.getBoundingClientRect().width),96);
    assert.equal(await page.locator('#track-title').evaluate(n=>getComputedStyle(n).fontSize),'26px');
    const actions=['#open-schedule','#open-wishes',...(role==='owner'?['#studio-tab','#team-tab']:[])];
    async function reachable() {
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      for(const selector of actions)assert.equal(await page.locator(selector).evaluate(n=>{
        const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=160&&r.width>=44&&r.height>=44&&hit?.closest('button')===n;
      }),true,selector+' direkt bedienbar bei '+width+' / '+deviceScaleFactor);
    }
    await reachable();await page.locator('#play-button').click();await waitRadioPlaying(page);
    assert.equal(await page.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).borderTopColor),'rgb(245, 245, 245)');
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none','Keine Beleuchtung um die äußere Leiste');
    const light=await page.locator('.radio-program-face').evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:innerWidth-r.right,outerWidth:r.width,top:r.top,height:r.height};});
    const metadata=await page.locator('#radio-metadata').boundingBox();
    assert.ok(Math.abs(light.left-metadata.x)<1&&Math.abs(light.outerWidth-metadata.width)<1,'Weißer Rahmen folgt ausschließlich der inneren Musikgruppe');
    assert.ok(light.left>0&&light.right>0&&light.outerWidth<width&&light.top>=0&&light.height<=160);
    const music=await page.locator('.radio-program-face').boundingBox(),volume=await page.locator('.volume-control').boundingBox();
    assert.ok(Math.abs((volume.x+volume.width/2)-(music.x+music.width/2))<1,'Lautstärke und Musik bleiben gemeinsam in der Mitte');
    const roleLabel=role==='owner'?'Inhaber':'Hoerer';
    if(deviceScaleFactor===1||(deviceScaleFactor===2&&width===3840&&role==='owner'))await captureDesign(page,'Aufloesung-'+roleLabel+'-'+width+'-DPR'+deviceScaleFactor);
    if(process.env.MISCHWERK_DESIGN_CAPTURE&&deviceScaleFactor===1&&role==='owner'&&(width===1920||width===3840))await page.locator('.radio-program-face').screenshot({path:path.join(root,'docs/pruefung/bilder/design','Musikkarte-Hintergrund-'+width+'.png')});
    song={title:'Ein sehr langer Musiktitel mit mehreren zusätzlichen Angaben und einer ausführlichen Version für die Sendung',artist:'Ein sehr langer Interpret zusammen mit vielen weiteren Mitwirkenden und einem zusätzlichen Künstler'};
    await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent.startsWith('Ein sehr langer'));
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'S'.repeat(80),moderator:{nick:'EinSehrLangerModeratorNicknameMitWeiteremZusatz'}}),state);
    for(const selector of ['#track-title','#track-artist','#show-topic','#host-name','#volume']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#radio-metadata').evaluate(n=>n.scrollWidth>n.clientWidth),false,'Keine horizontale Überbreite bei Langtext');
    }
    await page.evaluate(()=>{document.scrollingElement.scrollTop=0;document.body.scrollTop=0;document.getElementById('radio-metadata').scrollTop=0;});
    assert.ok(await page.locator('#radio-metadata').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=160&&n.clientHeight<=136;}),'Lange Musikangaben bleiben in der festen Musikfläche statt über den App-Rand hinauszuwachsen');
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
    assert.equal(await page.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).borderTopColor),'rgb(89, 89, 89)');
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
  assert.ok(volume.y>=0&&volume.y+volume.height<=101,'Lautstärke liegt bei kurzen Musikangaben direkt in der Musikfläche');
  await captureDesign(page,'Radio-Fest-Details-390');
  await page.locator('#volume').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#volume-value').textContent(),'11 %');
  for(const selector of ['#open-schedule','#open-wishes','#studio-tab','#team-tab']) {
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
  await page.waitForFunction(()=>innerHeight>=360&&!document.documentElement.classList.contains('radio-constrained'));
  assert.equal(await page.locator('#volume').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});

test('Fenster-Buttons senden Popup-Anfragen ohne Leistenwechsel oder Audiostopp', async t => {
  const {page,errors}=await setup(t,{station:true,k3:false,viewport:{width:960,height:160}});
  await page.locator('#play-button').click();
  await page.locator('#open-wishes').click();
  const request=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:openWishes'));
  assert.ok(request);
  await page.evaluate(request=>window.__emit('mw:result',{ok:true,action:request.type,requestId:request.data.requestId,message:'Fenster geöffnet.'}),request);
  await radioAction(page,'#studio-tab');
  assert.equal(await page.evaluate(()=>window.__sent.some(event=>event.type==='mw:openStudio')),true);
  assert.equal(await page.locator('#wishes-panel').isVisible(),false); assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'Radio stoppen');
  assert.deepEqual(await page.evaluate(()=>window.__sizes),[[0,160]]);
  assert.deepEqual(errors,[]);
});

test('Radio-Team bleibt vom Moderationsmenü getrennt und verwaltet Ernennungen revisionssicher', async t => {
  const radio=await setup(t,{viewport:{width:960,height:160}});
  assert.equal(await radio.page.locator('#team-tab').isEnabled(),true);
  assert.equal(await radio.page.locator('#team-tab').evaluate(node=>!!node.closest('#studio-panel')),false);
  await radioAction(radio.page,'#team-tab');
  assert.equal(await radio.page.evaluate(()=>window.__sent.some(event=>event.type==='mw:openRadioTeam')),true);

  const {page,state,errors}=await setup(t,{view:'team',k3:false,viewport:{width:560,height:760}});
  assert.equal(await page.locator('#team-panel').isVisible(),true);
  assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.match(await page.locator('#team-panel').innerText(),/Channelmoderatoren erhalten diesen Zugriff nicht automatisch/);
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
      assert.equal(await page.locator('#open-wishes').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 190, 46)','Gesperrte Wunschbox behält die gemeinsame Goldfarbe bei '+width);
      assert.equal(await page.locator('#open-wishes').evaluate(n=>getComputedStyle(n).borderTopColor),await page.locator('#open-schedule').evaluate(n=>getComputedStyle(n).borderTopColor),'Beide öffentlichen Aktionen behalten dieselbe Goldkontur bei '+width);
      assert.equal(await page.locator('#open-wishes .wish-button-arrow').isVisible(),false);
      assert.match(await page.locator('#open-wishes').getAttribute('title'),/deaktiviert/);
      await page.locator('#open-wishes').evaluate(button=>{button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
      assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests);
      assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
      if(!canModerate&&process.env.MISCHWERK_CAPTURE_WISH_BUTTON){
        const folder=path.join(root,'docs/pruefung/bilder/wunschbutton');fs.mkdirSync(folder,{recursive:true});
        await page.locator('#open-wishes').screenshot({path:path.join(folder,'Deaktiviert-'+width+'.png')});
      }
    }
    if(canModerate){assert.equal(await page.locator('#studio-tab').isEnabled(),true,'Studio bleibt zur Reaktivierung zugänglich');}
  }
  await page.evaluate(({state,revision})=>window.__emit('mw:state',{...state,revision,requestsEnabled:true}),{state,revision:revision++});
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
      await page.waitForFunction(()=>window.__sizes.length>0);
      assert.ok((await page.evaluate(()=>window.__sizes)).every(size=>size[0]===0&&size[1]>264));
    } else {
      await page.waitForTimeout(100);
      assert.deepEqual(await page.evaluate(()=>window.__sizes), [], 'Verwaltungsfenster behalten ihre nativen Startmaße');
    }
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal((await page.locator('.dialog-brand img').boundingBox()).width,96);
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

test('Fehlgeschlagene Statusabfrage entsperrt keine parallele Studioaktion', async t => {
  const {page}=await setup(t,{view:'studio'}); await page.locator('#on-air').click();
  await page.evaluate(()=>{const send=Client.sendEvent;Client.sendEvent=function(type,data){if(type==='mw:refresh')throw new Error('offline');return send(type,data);};});
  await page.locator('#refresh-queue').click(); assert.equal(await page.locator('#on-air').isDisabled(),true);
});
test('Entzogene Moderatorrechte sperren auch ein bereits geöffnetes Studiofenster', async t => {
  const {page,state}=await setup(t,{view:'studio'});
  await page.evaluate(state=>window.__emit('mw:state',{...state,user:{nick:'Otterchen',canModerate:false},queue:[]}),state);
  assert.equal(await page.locator('#studio-panel').isVisible(),false); assert.equal(await page.locator('#access-denied').isVisible(),true);
});

test('Weißer Rahmen der inneren Musikkarte folgt nativer Wiedergabe und erlischt bei Pause ohne Geometrieänderung',async t=>{
  for(const viewport of [{width:1440,height:160},{width:1024,height:160},{width:390,height:160},{width:320,height:600}]) {
    const {page,errors}=await setup(t,{station:true,realAudio:true,viewport});
    const frame=()=>page.locator('.radio-program-face').evaluate(node=>{
      const style=getComputedStyle(node);
      return {color:style.borderTopColor,shadow:style.boxShadow,pointerEvents:style.pointerEvents,animation:style.animationName,borderWidth:style.borderTopWidth};
    });
    const resting=await frame(),bounds=await page.locator('#radio-panel').boundingBox();
    assert.equal(resting.color,'rgb(89, 89, 89)');
    const cardBounds=await page.locator('.radio-program-face').boundingBox();
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none');
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    const playing=await frame();
    assert.equal(playing.color,'rgb(245, 245, 245)');assert.notEqual(playing.shadow,resting.shadow);assert.equal(playing.borderWidth,'1px');
    assert.equal(playing.pointerEvents,'none');assert.equal(playing.animation,'none');
    assert.deepEqual(await page.locator('#radio-panel').boundingBox(),bounds);
    assert.deepEqual(await page.locator('.radio-program-face').boundingBox(),cardBounds);
    assert.equal(await page.locator('#radio-panel').evaluate(n=>getComputedStyle(n,'::after').content),'none');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(viewport.width===1024||viewport.width===390)await captureDesign(page,'Radio-Leuchtrahmen-'+viewport.width+'-Play');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal((await frame()).color,playing.color,'Wiedergabebestätigung bleibt auch ohne Bewegung sichtbar');
    if(viewport.width===390) {
      await page.locator('#radio-metadata').focus();await page.keyboard.press('End');assert.equal((await frame()).color,playing.color);
    }
    if(viewport.width===320)await page.locator('#radio-audio').evaluate(audio=>audio.pause());
    else await page.locator('#play-button').click();
    assert.deepEqual(await frame(),resting,'Bei Pause bleibt nur die unveränderte neutrale Kartenkontur');
    assert.equal(await page.locator('#radio-audio').evaluate(audio=>audio.paused),true);
    assert.deepEqual(await page.locator('#radio-panel').boundingBox(),bounds);
    if(viewport.width===1024||viewport.width===390)await captureDesign(page,'Radio-Leuchtrahmen-'+viewport.width+'-Pause');
    assert.deepEqual(errors,[]);
  }
});

test('Wiedergabestatus folgt echter Wiedergabe statt dem Play-Klick', async t => {
  const {page}=await setup(t,{station:true,viewport:{width:1200,height:160}});
  assert.equal(await page.locator('#stream-label').textContent(),'Bereit');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).borderTopColor),'rgb(89, 89, 89)');
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),true);
  assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).borderTopColor),'rgb(245, 245, 245)');
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('waiting')));
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  assert.equal(await page.locator('.radio-program-face').evaluate(node=>getComputedStyle(node).borderTopColor),'rgb(89, 89, 89)');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Gestoppt');
  await page.emulateMedia({reducedMotion:'reduce'});
});

test('Moderationsanzeige wechselt zwischen DJ Mischwerk, Live-Moderation und unbestätigter Anmeldung; Audio vergibt keine Moderation',async t=>{
  const {page,state,errors}=await setup(t,{station:true,clock:true,viewport:{width:1600,height:160}});
  const sign=page.locator('#on-air-sign');
  assert.equal(await sign.textContent(),'DJ Mischwerk legt auf');assert.equal(await page.locator('#host-name').isVisible(),false);
  await page.locator('#play-button').click();await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  assert.equal(await sign.textContent(),'DJ Mischwerk legt auf');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'StudioNick'}}),state);
  assert.equal(await sign.textContent(),'Live-Moderation');assert.equal(await page.locator('#host-name').textContent(),'StudioNick');
  await page.locator('#play-button').click();assert.equal(await sign.textContent(),'Live-Moderation');
  await page.clock.fastForward(66000);assert.equal(await sign.textContent(),'Moderation unbestätigt');
  assert.equal(await page.locator('#host-name').isVisible(),false);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,moderator:null}),state);
  assert.equal(await sign.textContent(),'DJ Mischwerk legt auf');assert.deepEqual(errors,[]);
});

test('Stummschaltung stellt Lautstärke wieder her und gesperrter Speicher blockiert sie nicht', async t => {
  const {page,errors}=await setup(t,{viewport:{width:320,height:264}});

  await page.evaluate(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('gesperrt');}});const range=document.getElementById('volume');range.value='43';range.dispatchEvent(new Event('input'));});
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0);
  assert.equal(await page.locator('#volume-value').textContent(),'0 %');
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  assert.equal(await page.locator('#volume-value').textContent(),'43 %');
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
    const folder=path.join(root,'docs/pruefung/bilder/lautstaerke');fs.mkdirSync(folder,{recursive:true});
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
  assert.ok(await page.locator('#volume').evaluate(n=>getComputedStyle(n).backgroundImage.includes('rgb(241, 111, 101)')),'Rote Reglerzone sichtbar');
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

test('Lange Themen bleiben im Detail vollständig und leere Angaben lassen keine leeren Beschriftungen zurück',async t=>{
  const {page,state,errors}=await setup(t,{station:true});const topic='S'.repeat(80);
  await page.evaluate(({state,topic})=>window.__emit('mw:state',{...state,revision:2,topic}),{state,topic});
  for(const width of [1440,1024,390,320]){
    await resizeViewport(page,{width,height:160});

    await page.locator('#show-topic').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#show-topic').textContent(),topic);
    assert.equal(await page.locator('#show-topic').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  }
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,topic:''}),state);
  assert.equal(await page.locator('#radio-topic').isVisible(),false);assert.deepEqual(errors,[]);
});

test('Fehlende Musikdaten erfinden keine Titel und zeigen einen neutralen Status; einzelne vorhandene Werte bleiben korrekt',async t=>{
  const {page,state,errors}=await setup(t,{station:true});
  for(const song of [{title:'',artist:''},{title:'Nur Titel',artist:''},{title:'',artist:'Nur Interpret'}]){
    await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+1,station:{...state.station,radioId:'test-other',streamUrl:'https://play.radioking.io/test-other',metadataUrl:'https://api.radioking.io/widget/radio/test-other/track/current'}}),state);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+2}),state);
    await page.waitForFunction(song=>document.getElementById('track-title').textContent===song.title&&document.getElementById('track-artist').textContent===song.artist,song);
    assert.equal(await page.locator('#track-title').isVisible(),!!song.title);
    assert.equal(await page.locator('.artist-copy').isVisible(),!!song.artist);
    assert.equal(await page.locator('#metadata-empty').isVisible(),!song.title&&!song.artist);
    state.revision+=3;
  }
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

test('Volltext in der direkt scrollbar erreichbaren Musikfläche bleibt bei langen Titel-, Interpreten- und Moderationsnamen erreichbar',async t=>{
  const {page,state,errors}=await setup(t,{station:true});
  const song={title:'Ein sehr langer Musiktitel mit zusätzlichen Angaben und einem weiteren Interpreten',artist:'Ein sehr langer Interpret mit vielen Beteiligten'};
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent.startsWith('Ein sehr langer'));
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'EinSehrLangerModeratorNicknameMitZusatz'}}),state);
  for(const width of [1024,390,320]){
    await resizeViewport(page,{width,height:160});

    for(const selector of ['#track-title','#track-artist','#host-name']){
      await page.locator(selector).scrollIntoViewIfNeeded();assert.equal(await page.locator(selector).evaluate(n=>n.scrollWidth>n.clientWidth),false);
    }
    assert.equal(await page.locator('#track-title').textContent(),song.title);
    assert.equal(await page.locator('#track-artist').textContent(),song.artist);
    assert.equal(await page.locator('#open-schedule').isVisible(),true);
  }
  assert.deepEqual(errors,[]);
});

test('Studio zeigt eigene Anmeldung, Ablauf und echte Abmelderechte; Verbindungsverlust sperrt Aktionen sichtbar',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',clock:true,viewport:{width:780,height:700}});
  assert.equal(await page.locator('#off-air').isDisabled(),true);
  assert.equal(await page.locator('#studio-connection').textContent(),'Verbunden');
  let next={...state,revision:2,moderator:{nick:'Otterchen',since:Date.now(),expiresAt:Date.now()+3600000,sessionKey:'session-1'},user:{...state.user,isOnAir:true,canEndModeration:true}};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  assert.equal(await page.locator('#on-air').textContent(),'Anmeldung verlängern');
  assert.equal(await page.locator('#off-air').isDisabled(),false);
  assert.match(await page.locator('#studio-session').textContent(),/Angemeldet bis .* Uhr/);
  await page.locator('#on-air').click();
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
  for(const id of ['on-air','off-air','toggle-wishes','save-topic','prev-page','next-page'])assert.equal(await page.locator('#'+id).isDisabled(),true,id);
  await page.locator('#refresh-queue').click();
  assert.deepEqual(await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:refresh').data),{});
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:5}),next);
  assert.equal(await page.locator('#studio-connection').textContent(),'Verbunden');
  assert.equal(await page.locator('#toggle-wishes').isDisabled(),false);
  assert.deepEqual(errors,[]);
});

test('Studio-Warteschlange behält Tastaturfokus und sperrt Seitenwechsel während bestätigungspflichtiger Bearbeitung',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio'});
  const item={id:17,text:'a-ha – Take On Me',nick:'Musikfreund',createdAt:Date.now(),delivery:null};
  const next={...state,revision:2,queue:[item],queueTotal:2,pages:2,page:0};
  await page.evaluate(s=>window.__emit('mw:state',s),next);
  await page.locator('[data-outcome="done"]').evaluate(node=>{window.__focusedWish=node;node.focus();});
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:3,queue:[{...s.queue[0],delivery:{nick:'Otterchen',at:Date.now()}}]}),next);
  assert.equal(await page.evaluate(()=>document.activeElement===window.__focusedWish),true,'Empfangsquittung ersetzt keine bediente Schaltfläche');
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:4}),next);
  assert.equal(await page.evaluate(()=>document.activeElement===window.__focusedWish),true,'Statusaktualisierung erhält Fokus');
  await page.locator('#refresh-queue').click();
  assert.deepEqual(await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:refresh').data),{});
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
    await page.locator('[data-outcome=done]').scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-outcome=done]').isVisible(),true);
    assert.equal(await page.locator('.queue-copy h3').textContent(),'W'.repeat(300));
    assert.equal(await page.locator('#queue-pagination button').first().isVisible(),false,'Einzelner Wunsch braucht keine Vor/Zurück-Aktionen');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  }
});

async function fitPopup(page) {
  await page.waitForTimeout(100);
  const height=await page.locator('.dialog-shell').evaluate(node=>Math.ceil(node.getBoundingClientRect().height));
  await resizeViewport(page,{width:page.viewportSize().width,height});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
  assert.equal(await page.locator('.dialog-shell').evaluate(node=>node.scrollWidth>node.clientWidth),false);
  return height;
}

test('Wunschbox behält ihre natürliche Höhenanpassung und enthält keine alte Wunschliste', async t => {
  for(const view of ['wishes']) {
    const {page,state,errors}=await setup(t,{view,k3:false,viewport:{width:view==='wishes'?520:780,height:700}});
    const emptyHeight=await fitPopup(page);
    if(view==='wishes'){assert.ok(emptyHeight<=460);assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-requests').count(),0);}
    const item={id:1,artist:'Ä'.repeat(80),title:'T'.repeat(80),message:'Gruß '.repeat(40),nick:'EinSehrLangerModeratorUndHoererNickname',createdAt:Date.now()};
    const populated={...state,revision:4,myRequests:[item],myTotal:2,myPage:0,myPages:2,queue:[item],queueTotal:50,pages:50,page:0};
    await page.evaluate(state=>window.__emit('mw:state',state),populated);
    const populatedHeight=await fitPopup(page);
    assert.ok(populatedHeight>=emptyHeight);
    if(view==='wishes'){assert.equal(populatedHeight,emptyHeight,'Alte Wünsche vergrößern das vereinfachte Fenster nicht');}
    assert.ok(populatedHeight<=1000,'Popup bleibt innerhalb der Hostgrenze: '+populatedHeight);
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:5}),state);
    assert.equal(await fitPopup(page),emptyHeight);
    assert.deepEqual(errors,[]);
  }
});

test('Moderation und Radio-Team behalten ihre nativen Startmaße bei Laden, Push und Rückmeldungen', async t => {
  for (const [view, width, height] of [['studio', 780, 680], ['team', 560, 560]]) {
    const { page, state, errors } = await setup(t, { view, k3: false, clock: true, viewport: { width, height } });
    await page.clock.fastForward(3000);
    await page.clock.runFor(100);
    assert.deepEqual(await page.evaluate(() => window.__sizes), [], view + ': kein nachträgliches Schrumpfen beim Start');
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
      await page.locator('[data-outcome=done]').scrollIntoViewIfNeeded();
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
    assert.deepEqual(await page.evaluate(() => window.__sizes), [], view + ': auch Inhalt und Hinweise ändern keine Fenstermaße');
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
      assert.deepEqual(await page.evaluate(() => window.__sizes), []);
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
      await page.locator('[data-outcome=done]').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('[data-outcome=done]').isVisible(), true);
      await page.locator('#studio-controls-tab').click();
    }
    for (const selector of view === 'studio' ? ['#on-air', '#toggle-wishes', '#studio-topic'] :
      ['#radio-moderator-nick', '#add-radio-moderator', '#refresh-radio-team']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.ok(await page.locator(selector).evaluate(node => {
        const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight + 1;
      }), selector + ' bleibt erreichbar');
    }
    assert.deepEqual(await page.evaluate(() => window.__sizes), []);
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
      await page.locator('#studio-controls-tab').waitFor();
      await page.locator('#studio-queue-tab').click();
      assert.equal(await page.locator('#on-air').isVisible(), false);
      await page.locator('[data-outcome=done]').scrollIntoViewIfNeeded();
      await page.locator('[data-outcome=done]').click();
      assert.equal(await page.evaluate(() => window.__sent.findLast(event => event.type === 'mw:resolveRequest').data.outcome), 'done');
      await page.locator('#studio-controls-tab').click();
    }
    const selectors = view === 'team' ? ['#radio-moderator-nick', '#add-radio-moderator', '#refresh-radio-team'] :
      view === 'studio' ? ['#on-air', '#toggle-wishes', '#save-topic'] : ['#wish-text', '#submit-wish'];
    for (const selector of selectors) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.ok(await page.locator(selector).evaluate(node => {
        const box = node.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight + 1 && node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), selector + ' bleibt erreichbar');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(await page.evaluate(() => window.__sizes), []);
    assert.deepEqual(errors, []);
  }
});

test('Schmale Popups bleiben mit maximalen Texten und Reitern ohne Scrollen bedienbar', async t => {
  for(const view of ['wishes','studio']){
    const {page,state,errors}=await setup(t,{view,k3:true,viewport:{width:320,height:740}});
    const item={id:1,artist:'Ä'.repeat(80),title:'T'.repeat(80),message:'G'.repeat(200),nick:'SehrLangerHoererNicknameMitZusatz',createdAt:Date.now()};
    const next={...state,revision:2,myRequests:view==='wishes'?[]:[item],queue:[item],queueTotal:50,pages:50};
    await page.evaluate(state=>window.__emit('mw:state',state),next);
    if(view==='wishes'){
      await page.locator('#wish-text').fill('G'.repeat(300));
      assert.ok(await fitPopup(page)<=1000);
      assert.equal(await page.locator('#wish-text').evaluate(n=>n.scrollHeight>n.clientHeight),false);
      await page.locator('#wish-text').fill(('Gruß\n').repeat(40));
      assert.ok(await fitPopup(page)<=1000);
      assert.equal(await page.locator('#wish-form').isVisible(),true);
      assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-next').count(),0);
    }else{
      assert.ok(await fitPopup(page)<=1000);
      await page.locator('#studio-queue-tab').click();
      assert.equal(await page.locator('#on-air').isVisible(),false);
      assert.equal(await page.locator('[data-resolve]').first().isVisible(),true);
    }
    assert.ok(await fitPopup(page)<=1000);
    assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);
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
  assert.equal(await page.locator('#wish-rules').textContent(),'Bitte nur Interpret und Titel, keine Links.');
  assert.equal(await page.locator('.my-wishes,#wish-list-tab,#wish-nick,#my-requests').count(),0);
  assert.doesNotMatch(await page.locator('.dialog-shell').innerText(),/Einfach drauflosschreiben|direkt ans Studio|Dein Knuddels-Nick|Deine Wünsche/);
  for(const width of [520,320]){
    await resizeViewport(page,{width,height:500});
    const height=await fitPopup(page);assert.ok(height<=500,'Lesbares Wunschfenster bei '+width);
    if(process.env.MISCHWERK_CAPTURE_WISHES){
      const folder=path.join(root,'docs/pruefung/bilder/wunschbox');fs.mkdirSync(folder,{recursive:true});
      await page.screenshot({path:path.join(folder,'Wunschbox-'+width+'.png')});
    }
  }
  for(const text of ['https://youtu.be/123','Band – Song www.example.com','open.spotify.com/track/123','Band – Song example.de','[Song](example.org)']){
    await page.locator('#wish-text').fill(text);await page.locator('#submit-wish').click();
    assert.match(await page.locator('#wish-feedback').textContent(),/Keine Links/);
    assert.equal(await page.locator('#wish-text').inputValue(),text);
    assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:wish.submit')),false);
    assert.ok(await fitPopup(page)<=600,'Fehlerrückmeldung bleibt erreichbar');
  }
  await page.locator('#wish-text').fill('will.i.am – Scream & Shout');await page.locator('#submit-wish').click();
  assert.equal(await page.evaluate(()=>window.__sent.find(e=>e.type==='mw:wish.submit').data.text),'will.i.am – Scream & Shout');
  assert.deepEqual(errors,[]);
});
test('Versand an die Moderation wird gut sichtbar bestätigt; Zustandsupdates zeigen keine Hörerhistorie', async t=>{
  const {page,state}=await setup(t,{view:'wishes'});
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
  assert.ok(await fitPopup(page)<760);
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
  const child=spawn(process.execPath,['tools/preview.cjs'],{cwd:root,env:{...process.env,MISCHWERK_PREVIEW_PORT:'0'},windowsHide:true});
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
  await ownerRadio.locator('#curtain-toggle:not([disabled])').click();
  await ownerRadio.locator('#curtain-toggle-label').filter({hasText:'Vorhang schließen'}).waitFor();
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.waitForFunction(()=>document.documentElement.dataset.curtain==='open');
  await radio.locator('#open-wishes:not([disabled])').waitFor();
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
  await mod.locator('#on-air').filter({hasText:'Anmeldung verlängern'}).waitFor();
  assert.equal(await mod.locator('#off-air').isDisabled(),false);
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#host-name').filter({hasText:'Otterchen (Demo)'}).waitFor();
  assert.equal(await radio.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),true);
  await mod.locator('#off-air').click();
  await mod.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
  assert.equal(await mod.locator('#off-air').isDisabled(),true);
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#on-air-sign').filter({hasText:'DJ Mischwerk legt auf'}).waitFor();
  assert.equal(await radio.locator('#host-name').isVisible(),false);
  await radio.locator('#radio-topic').waitFor({state:'hidden'});
  assert.equal(await mod.locator('#studio-topic').inputValue(),'');
  assert.equal(await radio.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),false);
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
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://play.radioking.io/test-radio');
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
  const response=page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/track/current');releaseSong();await response;
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.evaluate(()=>window.__rejects.length),1);
  assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);
});


test('RadioKing übernimmt getrennte Titel-/Interpretenfelder, leere Werte und Live-Sendungstitel unverändert', async t=>{
  const {page,errors}=await setup(t,{station:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  let payload;
  const endpoint='https://api.radioking.io/widget/radio/test-radio/track/current';
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
  assert.equal(await page.locator('#on-air-sign').evaluate(n=>document.body.classList.contains('moderator-on-air')),false,'RadioKing is_live vergibt keine Knuddels-Moderation');
  assert.deepEqual(errors,[]);
});

test('RadioKing-Metadatenfehler erhalten den letzten Titel und stoppen keinen Radioton; leere gültige Antwort löscht Angaben', async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  let mode='valid';
  const endpoint='https://api.radioking.io/widget/radio/test-radio/track/current';
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

test('RadioKing-Senderwechsel stoppt den alten Stream; verspätete Antworten überschreiben keine neuen Titel', async t=>{
  const {page,state,releaseSong,errors}=await setup(t,{station:true,delayedSong:true});
  await page.locator('#play-button').click();
  const stream='https://play.radioking.io/other-radio',metadata='https://api.radioking.io/widget/radio/other-radio/track/current';
  await page.route(metadata,route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neuer Interpret'}}));
  await page.evaluate(({state,stream,metadata})=>window.__emit('mw:state',{...state,revision:2,station:{...state.station,radioId:'other-radio',streamUrl:stream,stationUrl:stream,metadataUrl:metadata}}),{state,stream,metadata});
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  const oldResponse=page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/track/current');releaseSong();await oldResponse;
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#track-title').textContent(),'Neuer Titel');
  assert.equal(await page.locator('#track-artist').textContent(),'Neuer Interpret');
  await page.locator('#play-button').click();assert.equal(await page.locator('#radio-audio').getAttribute('src'),stream);
  assert.deepEqual(errors,[]);
});

test('RadioKing blockiert manipulierte Hörer-/API-Adressen und Zugangsdaten auch im Browser',async t=>{
  const {page,state,errors}=await setup(t,{station:false});
  let networkRequests=0;
  await page.route('https://**/*',route=>{networkRequests++;return route.abort();});
  const base={provider:'radioking',configured:true,radioId:'test-radio',streamUrl:'https://play.radioking.io/test-radio',metadataUrl:'https://api.radioking.io/widget/radio/test-radio/track/current'};
  let revision=2;
  for(const patch of [
    {streamUrl:'http://play.radioking.io/test-radio'},
    {streamUrl:'https://live.radioking.com/test-radio'},
    {streamUrl:'https://play.radioking.io.evil.example/test-radio'},
    {streamUrl:'https://user:secret@play.radioking.io/test-radio'},
    {metadataUrl:'https://api.radioking.io/widget/radio/other-radio/track/current'},
    {metadataUrl:'https://api.radioking.io/widget/radio/test-radio/track/current?token=secret'},
    {radioId:'test-radio/other'},
    {radioId:'test-radio\n'},
    {provider:'unknown'}
  ]){
    await page.evaluate(({state,station,revision})=>window.__emit('mw:state',{...state,station,revision}),{state,station:{...base,...patch},revision:revision++});
    assert.equal(await page.locator('#play-button').isDisabled(),true);
    assert.equal(await page.locator('#station-link').isVisible(),false);
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  }
  assert.equal(networkRequests,0);
  assert.deepEqual(errors,[]);
});

test('Bestätigt gestoppter Sender sperrt Play neutralgrau, auch nach Push und synthetischem Klick',async t=>{
  const {page,state,errors,requests}=await setup(t,{station:true,providerStatus:'stopped',realAudio:true,viewport:{width:2124,height:160}});
  assert.equal(await page.locator('#stream-label').textContent(),'Sendepause');
  assert.equal(await page.locator('#play-button').isDisabled(),true);
  assert.equal(await page.locator('#play-button').getAttribute('aria-disabled'),'true');
  assert.match(await page.locator('#play-button').getAttribute('title'),/RadioKing gestoppt/);
  assert.equal(requests.some(url=>url.includes('/track/current')),false,'Keine aussichtslose Titelabfrage bei bestätigter Pause');
  assert.equal(requests.some(url=>url.startsWith('https://play.radioking.io')),false,'Kein Audio zum Prüfen laden');
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,moderator:{nick:'Otterchen'},topic:'80er und 90er'}),state);
  assert.equal(await page.locator('#play-button').isDisabled(),true,'Knuddels-Push darf die Sendepause nicht entsperren');
  assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('moderator-on-air')),true,'Studioanmeldung ist unabhängig vom Radioserver');
  for(const width of [320,681,900,901,1500,2124]){
    await resizeViewport(page,{width,height:radioHeight(width)});
    const color=await page.locator('#play-button').evaluate(n=>getComputedStyle(n).backgroundColor);
    assert.match(color,/102, 102, 102/);assert.doesNotMatch(color,/255, 190, 46/);
    await page.locator('#play-button').evaluate(b=>{b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
    if(process.env.MISCHWERK_CAPTURE_RADIO_STATUS&&[320,2124].includes(width)){
      const folder=path.join(root,'docs/pruefung/bilder/radiostatus');fs.mkdirSync(folder,{recursive:true});
      await page.locator('.transport').screenshot({path:path.join(folder,'Sendepause-'+width+'.png')});
      await page.locator('#radio-panel').screenshot({path:path.join(folder,'Sendepause-Leiste-'+width+'.png')});
    }
  }
  assert.deepEqual(errors,[]);
});

test('Senderstart entsperrt Play ohne Autostart; bestätigte Sendepause beendet laufende native Wiedergabe',async t=>{
  const {page,errors}=await setup(t,{station:true,providerStatus:'stopped',realAudio:true});
  let status='started';
  await page.route('https://api.radioking.io/widget/radio/test-radio',route=>route.fulfill({json:{slug:'test-radio',stream_status:status,status:'active',live:null}}));
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#stream-label').filter({hasText:'Bereit'}).waitFor();
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  status='stopped';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor();
  assert.equal(await page.locator('#play-button').isDisabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),true);
  assert.equal(await page.locator('#track-title').isVisible(),false);
  assert.equal(await page.locator('#notice').isVisible(),false,'Sendepause ist kein technischer Fehler');
  status='started';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#play-button:not([disabled])').waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null,'Nach Senderneustart erneut bewusst Play drücken');
  assert.deepEqual(errors,[]);
});

test('Nicht prüfbarer oder unbekannter Anbieterstatus sperrt nicht dauerhaft und unterbricht keinen Ton',async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  let mode;
  await page.route('https://api.radioking.io/widget/radio/test-radio',route=>{
    if(mode==='network')return route.abort();
    if(mode==='http')return route.fulfill({status:503,body:'unavailable'});
    if(mode==='json')return route.fulfill({contentType:'application/json',body:'invalid json'});
    return route.fulfill({json:mode});
  });
  for(mode of ['network','http','json',null,{}, {slug:'other-radio',stream_status:'stopped'},{slug:'test-radio',stream_status:'active'},{slug:'test-radio',stream_status:false},{slug:'test-radio',status:'error',stream_status:'stopped'}]){
    await page.evaluate(()=>{document.getElementById('metadata-status').textContent='';document.dispatchEvent(new Event('visibilitychange'));});
    await page.locator('#metadata-status').filter({hasText:'Titelanzeige von RadioKing'}).waitFor({state:'attached'});
    assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
    assert.equal(await page.locator('#play-button').isEnabled(),true);
    assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  }
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(errors,[]);
});

test('Verspäteter Stop-Status eines alten Senders sperrt keinen neu gewählten Sender',async t=>{
  const {page,state,releaseStatus,errors}=await setup(t,{station:true,providerStatus:'stopped',delayedStatus:true});
  assert.equal(await page.locator('#play-button').isDisabled(),true);
  assert.equal(await page.locator('#stream-label').textContent(),'Prüfe …');
  await page.route('https://api.radioking.io/widget/radio/other-radio',route=>route.fulfill({json:{slug:'other-radio',stream_status:'started'}}));
  await page.route('https://api.radioking.io/widget/radio/other-radio/track/current',route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neue Band'}}));
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,station:{...s.station,radioId:'other-radio',streamUrl:'https://play.radioking.io/other-radio',metadataUrl:'https://api.radioking.io/widget/radio/other-radio/track/current'}}),state);
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  await page.locator('#play-button').click();
  const oldResponse=page.waitForResponse('https://api.radioking.io/widget/radio/test-radio');releaseStatus();await oldResponse;
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://play.radioking.io/other-radio');
  assert.equal(await page.locator('#track-title').textContent(),'Neuer Titel');
  assert.deepEqual(errors,[]);
});

test('Zeitüberschreitung bei erster Statusprüfung gibt manuellen Hörversuch wieder frei',async t=>{
  const {page,releaseStatus,errors}=await setup(t,{station:true,delayedStatus:true,clock:true});
  assert.equal(await page.locator('#stream-label').textContent(),'Prüfe …');
  assert.equal(await page.locator('#play-button').isDisabled(),true);
  await page.clock.runFor(11000);
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  assert.equal(await page.locator('#stream-label').textContent(),'Status unbekannt');
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  releaseStatus();assert.deepEqual(errors,[]);
});

test('Medienfehler prüft den Senderstatus sofort und wird bei gestopptem Sender zur Sendepause',async t=>{
  const {page,errors}=await setup(t,{station:true});
  let checks=0;
  await page.route('https://api.radioking.io/widget/radio/test-radio',route=>{checks++;return route.fulfill({json:{slug:'test-radio',stream_status:'stopped'}});});
  await page.locator('#play-button').click();await page.evaluate(()=>window.__rejects[0](new Error('offline')));
  await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor();
  assert.equal(checks,1);assert.equal(await page.locator('#play-button').isDisabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#notice').isVisible(),false);
  assert.deepEqual(errors,[]);
});

test('Titel wechseln im Fünfsekundentakt ohne Browsercache; Status bleibt bei 30 Sekunden, Popups und Hintergrund bleiben ruhig',async t=>{
  for(const view of ['wishes','studio','team','schedule']){
    const {page,errors}=await setup(t,{station:true,view,clock:true});let requests=0;
    await page.route('https://api.radioking.io/**',route=>{requests++;return route.fulfill({json:{title:'Titel',artist:'Interpret'}});});
    await page.clock.runFor(31000);assert.equal(requests,0,'Keine Providerverbindung im Popup '+view);assert.deepEqual(errors,[]);
  }
  const {page,errors}=await setup(t,{station:true,clock:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  await page.evaluate(()=>{const original=window.fetch;window.__metadataFetch=[];window.fetch=function(url,options){window.__metadataFetch.push({url,cache:options.cache,credentials:options.credentials});return original.apply(this,arguments);};});
  const endpoint='https://api.radioking.io/widget/radio/test-radio/track/current';let requests=0,statusRequests=0;
  await page.route('https://api.radioking.io/**',route=>{
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
  const base='https://api.radioking.io/widget/radio/test-radio',endpoint=base+'/track/current';
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
  const base='https://api.radioking.io/widget/radio/test-radio',endpoint=base+'/track/current';let releaseTitle,status='started',calls=0,hold=true;
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

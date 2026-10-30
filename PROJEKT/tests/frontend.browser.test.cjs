// Optional: Playwright und Microsoft Edge. Audio nur mit lokal erzeugten PCM-Testsignalen, keine echten Sender-/Knuddels-Verbindungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MISCHWERK_PLAYWRIGHT || 'playwright');
const { createHarness } = require('../tools/knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
let browser;
test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge' }); });
test.after(async () => { await browser?.close(); });
function radioSong(song) { return song ? {title:song.title,artist:typeof song.artist==='string'?song.artist:song.artist?.name} : null; }
async function setup(t, { station = false, delayedSong = false, delayedStatus = false, providerStatus = 'started', throwingPlay = false, clock = false, k3 = true, realAudio = false, cors = true, savedVolume, view = 'radio', viewport = { width: 960, height: 760 } } = {}) {
  const h = createHarness(); h.config.radioking.radioId = station ? 'test-radio' : ''; 
  const user = h.user(1, 'Otterchen', 'owner'); const session = h.open(user);
  const state = h.state(user, session); state.view = view;
  const context = await browser.newContext({ viewport });
  t.after(() => context.close());
  const page = await context.newPage(); const errors = [],requests=[]; let releaseSong,releaseStatus;
  page.on('request',request=>requests.push(request.url()));
  const songGate = new Promise(resolve => { releaseSong = resolve; });
  const statusGate = new Promise(resolve => { releaseStatus = resolve; });
  page.on('pageerror', error => errors.push(error.message));
  if (clock) { await page.clock.install(); }
  await page.addInitScript(({ state, throwingPlay, k3, realAudio, savedVolume }) => {
    if(savedVolume!==undefined){localStorage.setItem('mischwerk.volume.v1',String(savedVolume));}
    window.__sent = []; window.__handlers = {}; window.__rejects = []; window.__sizes = [];
    window.__emit = (type, data) => (window.__handlers[type] || []).forEach(callback => callback({ type, data }));
    window.Client = {
      pageData: state,
      includeCSS(file) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = file; document.head.appendChild(link); },
      includeJS(file) { const script = document.createElement('script'); script.src = file; document.body.appendChild(script); },
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
      if (throwingPlay) { throw new Error('Playback not supported'); }
      return new Promise((resolve, reject) => window.__rejects.push(reject));
    };
  }, { state, throwingPlay, k3, realAudio, savedVolume });
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
  await page.route(/^https:\/\/api\.radioking\.io\/widget\/radio\/[a-z0-9-]+$/,async route=>{
    if(delayedStatus){await statusGate;}
    await route.fulfill({json:{slug:new URL(route.request().url()).pathname.split('/').pop(),stream_status:providerStatus,status:'active',live:null}});
  });
  await page.route('http://mischwerk.test/**', async route => {
    const url = new URL(route.request().url());
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const absolute = path.resolve(root, 'app/www', file);
    if (!absolute.startsWith(path.join(root, 'app', 'www') + path.sep) || !fs.existsSync(absolute)) { await route.fulfill({ status: 404 }); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(absolute) });
  });
  const metadataRequested=station&&view==='radio'&&!delayedStatus&&providerStatus!=='stopped'?page.waitForRequest('https://api.radioking.io/widget/radio/test-radio/track/current'):null;
  await page.goto('http://mischwerk.test/'); await page.waitForFunction(() => window.__sent.some(event => event.type === 'mw:ready'));
  if(metadataRequested){await metadataRequested;}
  if(station&&view==='radio'&&!delayedStatus){await page.waitForFunction(()=>document.getElementById('stream-label').textContent!=='Prüfe …');}
  return { page, state, errors, requests, releaseSong, releaseStatus };
}
test('Fremde Bestätigungen entsperren keinen Wunsch und löschen keinen neuen Entwurf', async t => {
  const { page, errors } = await setup(t, {view:'wishes'});
  await page.locator('#wish-text').fill('Band – Song');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:request'));
  await page.evaluate(()=>window.__emit('mw:result',{ok:true,action:'mw:setRequests',requestId:'fremd',message:'Alt'}));
  assert.equal(await page.locator('#wish-fields').evaluate(node=>node.disabled),true);
  assert.equal(await page.locator('#wish-text').inputValue(),'Band – Song');
  await page.evaluate(()=>{document.getElementById('wish-text').value='Neuer Entwurf';});
  await page.evaluate(sent=>window.__emit('mw:result',{ok:true,action:sent.type,requestId:sent.data.requestId,message:'Gespeichert'}),sent);
  assert.equal(await page.locator('#wish-text').inputValue(),'Neuer Entwurf'); assert.deepEqual(errors,[]);
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
test('Erneuter identischer Wunsch nach Bestätigungs-Timeout behält seine Anfrage-ID', async t => {
  const { page } = await setup(t, { clock: true, view:'wishes' });
  await page.locator('#wish-text').fill('Band – Song');
  await page.locator('#submit-wish').click(); await page.clock.runFor(15010);
  await page.locator('#submit-wish').click();
  const requests = await page.evaluate(() => window.__sent.filter(event => event.type === 'mw:request'));
  assert.equal(requests.length, 2); assert.ok(requests[0].data.requestId);
  assert.equal(requests[0].data.requestId, requests[1].data.requestId);
});
test('Veralteter Zustand setzt keine neuere Wunschbox-Entscheidung zurück', async t => {
  const {page,state}=await setup(t,{view:'wishes'});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,requestsEnabled:false}),state);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,requestsEnabled:true}),state);
  assert.match(await page.locator('#wish-status').textContent(),/DEAKTIVIERT/);
});

test('Radioleiste passt ohne Scrollen; Logo und alle Bedienelemente bleiben vollständig sichtbar', async t => {
  const {page,errors}=await setup(t,{station:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  await page.evaluate(()=>{const range=document.getElementById('volume');range.value='100';range.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('#track-label').textContent(),'Titel');
  assert.equal(await page.locator('#level-meter,.waveform,.meter-rest').count(),0);
  assert.equal(await page.locator('#wish-tab-dot,.status-dot').count(),0);
  let roleRevision=1;
  for(const width of [320,390,680,681,700,900,901,960,1199,1200,1499,1500,1600,1799,1800,2124,2560]){
    const height=width<=680?264:160; await page.setViewportSize({width,height});
    const overflow=await page.locator('.radio-bar').evaluate(node=>({x:node.scrollWidth>node.clientWidth,y:node.scrollHeight>node.clientHeight}));
    assert.deepEqual(overflow,{x:false,y:false},'Leiste bei '+width+' px');
    for(const selector of ['.bar-logo','#play-button','#stream-badge','#mute-button','#volume','#volume-value','#open-wishes','#team-tab','#studio-tab','.on-air-sign','#host-name','#track-title','#track-artist']){
      const box=await page.locator(selector).boundingBox(); assert.ok(box && box.x>=0 && box.y>=0 && box.x+box.width<=width && box.y+box.height<=height,selector+' bei '+width);
    }
    assert.equal((await page.locator('.bar-logo').boundingBox()).width,128);
    const originalStatus=await page.locator('#stream-label').textContent();
    for(const label of ['LIVE','Bereit','Verbinden','Streamfehler','In Vorbereitung','Gestoppt','Getrennt','Sendepause','Prüfe …','Status unbekannt']){
      const transportLayout=await page.locator('#play-button').evaluate((button,label)=>{
        document.getElementById('stream-label').textContent=label;
        const box=button.getBoundingClientRect(),style=getComputedStyle(button),ring=getComputedStyle(button,'::before');
        const badge=document.getElementById('stream-badge').getBoundingClientRect();
        // Der äußere Plattenteller-Ring steht über die Klickfläche hinaus, einschließlich 5-px-Kontur.
        const ringBottom=box.bottom-parseFloat(style.borderBottomWidth)-parseFloat(ring.bottom)+5;
        return {gap:badge.top-ringBottom,ringTop:box.top+parseFloat(style.borderTopWidth)+parseFloat(ring.top)-5,bottom:badge.bottom};
      },label);
      assert.ok(transportLayout.gap>=5.9,label+': mindestens 6 px Abstand zum sichtbaren Plattenteller-Ring bei '+width);
      assert.ok(transportLayout.ringTop>=0,'Plattenteller-Ring oben vollständig sichtbar bei '+width);
      assert.ok(transportLayout.bottom<=height,label+': Status vollständig in der Leiste bei '+width);
    }
    await page.locator('#stream-label').evaluate((node,text)=>{node.textContent=text;},originalStatus);
    for(const selector of ['#play-button','#mute-button','#volume','#open-wishes','#team-tab','#studio-tab']){
      assert.ok(await page.locator(selector).evaluate(node=>{const box=node.getBoundingClientRect();return node.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));}),'Keine überlagerte Bedienfläche: '+selector+' bei '+width);
    }
    assert.ok((await page.locator('#volume').boundingBox()).width<=180,'Kompakter Lautstärkeregler bei '+width);
    assert.equal(await page.locator('#volume-value').textContent(),'100 %');
    if(width>=1200){
      const logo=await page.locator('.bar-logo').boundingBox(),actions=await page.locator('.bar-actions').boundingBox();
      const info=await page.locator('.track-copy').boundingBox(),volume=await page.locator('.volume-control').boundingBox();
      assert.ok(logo.x<=24,'Logo am linken Leistenrand bei '+width);
      assert.ok(width-actions.x-actions.width<=24,'Fensterbuttons am rechten Leistenrand bei '+width);
      if(width<1500){assert.ok(info.y+info.height<=volume.y,'Lautstärke unter den Titelangaben bei '+width);}
      else {assert.ok(info.x+info.width<volume.x,'Lautstärke neben den Titelangaben bei '+width);}
    }
    if(width>=1200){
      const title=await page.locator('#track-title').boundingBox(),artist=await page.locator('#track-artist').boundingBox();
      const host=await page.locator('#host-name').boundingBox(),volume=await page.locator('.volume-control').boundingBox(),actions=await page.locator('.bar-actions').boundingBox();
      assert.ok(artist.x>title.x+title.width,'Interpret in eigener Spalte bei '+width);
      if(width<1500){assert.ok(Math.abs(title.y-artist.y)<1,'Titel und Interpret auf gleicher Höhe bei '+width);}
      if(width<1500){assert.ok(actions.y+actions.height<height,'Fensterbuttons vollständig innerhalb der Leiste bei '+width);}
      else {
        for(const box of [title,artist,volume]){assert.ok(Math.abs(box.y+box.height/2-height/2)<1,'Angaben und Lautstärke vertikal in der Leistenmitte bei '+width);}
      }
    }
    if(width>=901){
      const row=await page.locator('.bar-actions').boundingBox(),wish=await page.locator('#open-wishes').boundingBox(),studio=await page.locator('#studio-tab').boundingBox();
      const presenter=await page.locator('.presenter').boundingBox();
      const status=await page.locator('#stream-badge').boundingBox(),play=await page.locator('#play-button').boundingBox();
      assert.ok(presenter.x+presenter.width<row.x,'Moderation und Fensterbuttons in getrennten Bereichen bei '+width);
      assert.ok(Math.abs(presenter.y+presenter.height/2-wish.y-wish.height/2)<1,'ON AIR und Name als ganze Gruppe auf derselben Höhenmitte wie Wunschbox bei '+width);
      const sign=await page.locator('#on-air-sign').boundingBox(),name=await page.locator('#host-name').boundingBox();
      assert.ok(Math.abs(sign.x+sign.width/2-name.x-name.width/2)<1,'ON AIR und Moderatorname auf einer gemeinsamen Mittelachse bei '+width);
      assert.ok(name.y-sign.y-sign.height>=9.9,'Lesbarer Abstand zwischen ON AIR und Moderatorname bei '+width);
      const team=await page.locator('#team-tab').boundingBox();
      assert.ok(wish.y+wish.height<studio.y&&wish.y+wish.height<team.y,'Wunschbox und Verwaltungslinks mit eigenem Abstand bei '+width);
      assert.ok(Math.abs(wish.y+wish.height/2-height/2)<1,'Wunschbox vertikal mittig bei '+width);
      assert.ok(status.y>=play.y+play.height+5,'Wiedergabestatus beim Play-Knopf bei '+width);
    }
    const wishBefore=await page.locator('#open-wishes').boundingBox(),studioLink=await page.locator('#studio-tab').boundingBox();
    assert.ok(height-studioLink.y-studioLink.height<=12&&width-studioLink.x-studioLink.width<=24,'Moderation nur unten rechts bei '+width);
    assert.equal(await page.locator('#studio-tab').evaluate(n=>!!n.closest('.bar-actions')),false);
    await page.evaluate(revision=>window.__emit('mw:state',{...Client.pageData,revision,user:{nick:'Hoerer',canModerate:false}}),++roleRevision);
    assert.equal(await page.locator('#studio-tab').isVisible(),false);
    assert.equal(await page.locator('#team-tab').isVisible(),false);
    const wishAfter=await page.locator('#open-wishes').boundingBox();
    for(const key of ['x','y','width','height']){assert.ok(Math.abs(wishBefore[key]-wishAfter[key])<.1,'Wunschbox unverändert ohne Moderationslink: '+key+' bei '+width);}
    await page.evaluate(revision=>window.__emit('mw:state',{...Client.pageData,revision}),++roleRevision);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  }
  assert.equal(await page.locator('#host-name').textContent(),'Radio Mischwerk');
  await page.evaluate(()=>window.__emit('mw:state',{...Client.pageData,revision:98,station:{...Client.pageData.station,configured:false,streamUrl:''}}));
  assert.equal(await page.locator('#stream-label').textContent(),'In Vorbereitung');
  assert.match(await page.locator('#stream-badge').getAttribute('title'),/RadioKing-Hörerstream.*nicht eingerichtet/);
  assert.equal(await page.locator('.radio-bar').innerText().then(text=>text.includes('Otterchen')),false);
  await page.evaluate(()=>window.__emit('mw:state',{...Client.pageData,revision:99,user:{nick:'Hoerer',canModerate:false}}));
  assert.equal(await page.locator('#studio-tab').isVisible(),false);
  const solo=await page.locator('#open-wishes').boundingBox(),row=await page.locator('.bar-actions').boundingBox();
  assert.ok(Math.abs(solo.width-row.width)<1,'Einzelner Wunschbox-Button nutzt die Zeile');
  await page.evaluate(()=>window.__emit('mw:state',{...Client.pageData,revision:100,requestsEnabled:false,user:{nick:'Hoerer',canModerate:false}}));
  assert.equal(await page.locator('#wish-button-caption').textContent(),'Deaktiviert');
  assert.equal(await page.locator('#open-wishes').isDisabled(),true,'Deaktivierte Wunschbox darf kein Popup öffnen');
  if(process.env.MISCHWERK_CAPTURE_BAR){
    const folder=path.join(root,'docs/leisten-positionierung');fs.mkdirSync(folder,{recursive:true});
    await page.setViewportSize({width:2124,height:160});
    await page.evaluate(()=>{
      window.__emit('mw:state',{...Client.pageData,revision:101,requestsEnabled:false});
      const range=document.getElementById('volume');range.value='40';range.dispatchEvent(new Event('input'));
    });
    await page.screenshot({path:path.join(folder,'Leiste-2124.png')});
    await page.screenshot({path:path.join(folder,'Moderation-Wunschbox.png'),clip:{x:1695,y:0,width:429,height:160}});
    await page.evaluate(()=>window.__emit('mw:state',{...Client.pageData,revision:102,moderator:{nick:'Otterchen'}}));
    await page.screenshot({path:path.join(folder,'Leiste-On-Air-2124.png')});
    await page.setViewportSize({width:320,height:264});
    await page.screenshot({path:path.join(folder,'Leiste-320.png')});
  }
  assert.deepEqual(errors,[]);
});

test('Fenster-Buttons senden Popup-Anfragen ohne Leistenwechsel oder Audiostopp', async t => {
  const {page,errors}=await setup(t,{station:true,k3:false,viewport:{width:960,height:160}});
  await page.locator('#play-button').click();
  await page.locator('#open-wishes').click();
  const request=await page.evaluate(()=>window.__sent.findLast(event=>event.type==='mw:openWishes'));
  assert.ok(request);
  await page.evaluate(request=>window.__emit('mw:result',{ok:true,action:request.type,requestId:request.data.requestId,message:'Fenster geöffnet.'}),request);
  await page.locator('#studio-tab').click();
  assert.equal(await page.evaluate(()=>window.__sent.some(event=>event.type==='mw:openStudio')),true);
  assert.equal(await page.locator('#wishes-panel').isVisible(),false); assert.equal(await page.locator('#studio-panel').isVisible(),false);
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'),'Radio stoppen');
  assert.deepEqual(await page.evaluate(()=>window.__sizes),[[0,160]]);
  assert.deepEqual(errors,[]);
});

test('Radio-Team bleibt vom Moderationsmenü getrennt und verwaltet Ernennungen revisionssicher', async t => {
  const radio=await setup(t,{viewport:{width:960,height:160}});
  assert.equal(await radio.page.locator('#team-tab').isVisible(),true);
  assert.equal(await radio.page.locator('#team-tab').evaluate(node=>!!node.closest('#studio-panel')),false);
  await radio.page.locator('#team-tab').click();
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
    await page.setViewportSize({width,height:760});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Keine horizontale Überlagerung bei '+width);
  }
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+2,user:{...state.user,canManageRadioModerators:false},radioModerators:[]}),state);
  assert.equal(await page.locator('#team-panel').isVisible(),false);
  assert.equal(await page.locator('#team-access-denied').isVisible(),true);
  assert.deepEqual(errors,[]);
});

test('Deaktivierte Wunschbox ist sichtbar gesperrt, sendet keine Popup-Anfrage und wird nach Aktivierung wieder bedienbar',async t=>{
  const {page,state,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:2124,height:160}});
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  let revision=2;
  const previousRequests=await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length);
  for(const canModerate of [false,true]){
    await page.evaluate(({state,revision,canModerate})=>window.__emit('mw:state',{...state,revision,requestsEnabled:false,user:{...state.user,canModerate}}),{state,revision:revision++,canModerate});
    for(const width of [320,681,901,2124]){
      await page.setViewportSize({width,height:width<=680?264:160});
      assert.equal(await page.locator('#open-wishes').isVisible(),true);
      assert.equal(await page.locator('#open-wishes').isDisabled(),true);
      assert.equal(await page.locator('#open-wishes').getAttribute('aria-disabled'),'true');
      assert.equal(await page.locator('#wish-button-caption').textContent(),'Deaktiviert');
      assert.equal(await page.locator('#open-wishes .wish-icon-lock').isVisible(),true);
      assert.equal(await page.locator('#open-wishes .wish-icon-music').isVisible(),false);
      await page.waitForFunction(()=>{const rgb=getComputedStyle(document.getElementById('open-wishes')).borderTopColor.match(/\d+/g).map(Number);return rgb.every(value=>value===rgb[0]);});
      const border=await page.locator('#open-wishes').evaluate(n=>getComputedStyle(n).borderTopColor.match(/\d+/g).map(Number));
      assert.ok(border.every(value=>value===border[0]),'Deaktivierter Rahmen ist neutral und nicht gold bei '+width);
      assert.equal(await page.locator('#open-wishes .wish-button-arrow').isVisible(),false);
      assert.match(await page.locator('#open-wishes').getAttribute('title'),/deaktiviert/);
      await page.locator('#open-wishes').evaluate(button=>{button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
      assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests);
      assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
      if(!canModerate&&process.env.MISCHWERK_CAPTURE_WISH_BUTTON){
        const folder=path.join(root,'docs/wunschbutton-pruefung');fs.mkdirSync(folder,{recursive:true});
        await page.locator('#open-wishes').screenshot({path:path.join(folder,'Deaktiviert-'+width+'.png')});
      }
    }
    if(canModerate){assert.equal(await page.locator('#studio-tab').isEnabled(),true,'Studio bleibt zur Reaktivierung zugänglich');}
  }
  await page.evaluate(({state,revision})=>window.__emit('mw:state',{...state,revision,requestsEnabled:true}),{state,revision:revision++});
  assert.equal(await page.locator('#open-wishes').isEnabled(),true);
  assert.equal(await page.locator('#open-wishes').getAttribute('aria-disabled'),'false');
  assert.equal(await page.locator('#wish-button-caption').textContent(),'Dein Musikwunsch');
  assert.equal(await page.locator('#open-wishes .wish-button-arrow').isVisible(),true);
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
    await page.waitForFunction(()=>window.__sizes.length>0);
    assert.ok((await page.evaluate(()=>window.__sizes)).every(size=>size[0]===0&&size[1]>264));
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal((await page.locator('.dialog-brand img').boundingBox()).width,view==='wishes'?72:96);
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

test('Wiedergabestatus folgt echter Wiedergabe statt dem Play-Klick', async t => {
  const {page}=await setup(t,{station:true,viewport:{width:1200,height:160}});
  assert.equal(await page.locator('#stream-label').textContent(),'Bereit');
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),true);
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('waiting')));
  assert.equal(await page.locator('#stream-label').textContent(),'Verbinden');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('playing')),false);
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#stream-label').textContent(),'Gestoppt');
  await page.emulateMedia({reducedMotion:'reduce'});
});

test('On-Air-Schild leuchtet nur bei bestätigter Moderation, unabhängig vom lokalen Radioton', async t => {
  const {page,state,errors}=await setup(t,{station:true,clock:true,viewport:{width:1600,height:160}});
  const sign=page.locator('#on-air-sign');
  const active=()=>page.locator('body').evaluate(node=>node.classList.contains('moderator-on-air'));
  assert.equal(await sign.textContent(),'ON AIR');
  assert.equal(await active(),false);
  const dark=await sign.evaluate(node=>getComputedStyle(node).color);
  const inactiveStyle=await sign.evaluate(node=>{const css=getComputedStyle(node);return {color:css.color,border:css.borderTopColor,shadow:css.boxShadow};});
  for(const width of [320,900,1600]){
    await page.setViewportSize({width,height:width<=680?264:160});
    for(const property of ['color','borderTopColor']){
      const channels=await sign.evaluate((node,property)=>getComputedStyle(node)[property].match(/\d+/g).slice(0,3).map(Number),property);
      assert.ok(channels.every(value=>value===channels[0]),'Inaktives ON AIR ist neutral grau: '+property+' bei '+width);
    }
  }
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).textShadow),'none');
  await page.locator('#play-button').click();
  await page.evaluate(()=>document.getElementById('radio-audio').dispatchEvent(new Event('playing')));
  assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
  assert.equal(await active(),false,'Lokales Radiohören meldet niemanden als Moderation an');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'StudioNick',since:Date.now()}}),state);
  assert.equal(await active(),true);
  assert.equal(await page.locator('#host-name').textContent(),'StudioNick');
  assert.match(await sign.getAttribute('aria-label'),/StudioNick.*Moderation angemeldet/);
  assert.notEqual(await sign.evaluate(node=>getComputedStyle(node).color),dark);
  assert.notEqual(await sign.evaluate(node=>getComputedStyle(node).textShadow),'none');
  await page.locator('#play-button').click();
  assert.equal(await active(),true,'Lokales Stoppen ändert den Moderationsstatus nicht');
  await page.clock.fastForward(66000);
  assert.equal(await active(),false,'Veralteter Zustand darf nicht weiter leuchten');
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).color),dark);
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).textShadow),'none');
  assert.match(await sign.getAttribute('title'),/unbestätigt.*Verbindung/);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,moderator:{nick:'StudioNick'}}),state);
  assert.equal(await active(),true);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,moderator:null}),state);
  assert.equal(await active(),false);
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).color),dark);
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).borderTopColor),inactiveStyle.border);
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).boxShadow),inactiveStyle.shadow);
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).textShadow),'none');
  assert.equal(await page.locator('#host-name').textContent(),'Radio Mischwerk');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await sign.evaluate(node=>getComputedStyle(node).animationName),'none');
  assert.deepEqual(errors,[]);
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

test('Lautstärke startet bei 40 Prozent und stellt gespeicherte hohe Werte höchstens mit 60 Prozent wieder her',async t=>{
  for(const [savedVolume,expected] of [[undefined,.4],[.25,.25],[.7,.6],[1,.6],[0,0],['ungueltig',.4],[-1,0],[Infinity,.4]]){
    const {page,errors}=await setup(t,{savedVolume});
    assert.equal(await page.locator('#radio-audio').evaluate(audio=>audio.volume),expected);
    assert.equal(await page.locator('#volume').inputValue(),String(expected*100));
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.locator('.volume-control').evaluate(node=>node.classList.contains('is-high')),false);
    assert.ok(Number(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')))<=.6);
    assert.deepEqual(errors,[]);
  }
});

test('Roter Lautstärkebereich warnt über 60 Prozent; bis 100 bleibt frei und Mute erhält den bewusst gewählten Pegel',async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1600,height:160}});
  const capture=async name=>{
    if(!process.env.MISCHWERK_CAPTURE_VOLUME){return;}
    const folder=path.join(root,'docs','lautstaerke-pruefung');fs.mkdirSync(folder,{recursive:true});
    await page.locator('.volume-control').screenshot({path:path.join(folder,name+'.png')});
  };
  await capture('40-prozent');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')),'0.6');
  assert.ok(await page.locator('#volume').evaluate(n=>getComputedStyle(n).backgroundImage.includes('rgb(241, 111, 101)')),'Rote Reglerzone sichtbar');
  assert.equal(await page.locator('#volume-value').evaluate(n=>getComputedStyle(n,'::before').content),'"!"','Warnhinweis nicht nur durch Farbe');
  await capture('100-prozent');
  await page.setViewportSize({width:320,height:264});await capture('100-prozent-mobil');
  assert.equal(await page.locator('.radio-bar').evaluate(n=>n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),0);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),1);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),true);
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('volume').value==='60');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.6);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
  assert.deepEqual(errors,[]);
});

test('Thema passt mit langen Angaben über alle Leistenbreiten und bleibt ohne Text verborgen', async t => {
  const {page,state,errors}=await setup(t,{station:true,viewport:{width:2124,height:160}});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  assert.equal(await page.locator('#radio-topic').isVisible(),false);
  const topic='W'.repeat(80);
  await page.evaluate(({state,topic})=>window.__emit('mw:state',{...state,revision:2,topic,moderator:{nick:'Ein sehr langer Moderatorname mit Zusatz'}}),{state,topic});
  await page.evaluate(()=>{document.getElementById('track-title').textContent='Ein besonders langer Songtitel mit vielen zusätzlichen Angaben';document.getElementById('track-artist').textContent='Eine Band mit einem sehr langen Künstlernamen';});
  for(const width of [320,390,680,681,700,900,901,960,1199,1200,1499,1500,1600,1799,1800,2124,2560]){
    const height=width<=680?264:160;
    await page.setViewportSize({width,height});
    assert.equal(await page.locator('.radio-bar').evaluate(n=>n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight),false,'Thema ohne Überlauf bei '+width);
    for(const selector of ['#radio-topic','#show-topic','#volume','#track-title','#track-artist','#host-name','#play-button','#open-wishes','#studio-tab']){
      const box=await page.locator(selector).boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,selector+' bei '+width);
    }
    const boxes=await page.evaluate(()=>['show-topic','volume','track-title','track-artist'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
    const [theme,...others]=boxes;
    for(const box of others){assert.ok(theme.x+theme.w<=box.x||box.x+box.w<=theme.x||theme.y+theme.h<=box.y||box.y+box.h<=theme.y,'Thema überlagert keine Musikdaten/Regler bei '+width);}
    const [volume,title,artist]=others;
    if(width>=901){
      const presenter=await page.locator('.presenter').boundingBox(),wish=await page.locator('#open-wishes').boundingBox();
      assert.ok(Math.abs(presenter.y+presenter.height/2-wish.y-wish.height/2)<1,'Auch langer Moderatorname samt ON AIR bleibt zur Wunschbox zentriert bei '+width);
    }
    if(width>=1800){
      assert.ok(title.x+title.w<artist.x&&artist.x+artist.w<theme.x&&theme.x+theme.w<volume.x,'Titel, Interpret, Thema und Lautstärke in eigenen Bereichen bei '+width);
      for(const box of boxes){assert.ok(Math.abs(box.y+box.h/2-80)<1,'Alle Angaben mit Thema vertikal mittig bei '+width);}
      assert.ok((await page.locator('.topic-label').boundingBox()).y+12<=theme.y,'Themenbeschriftung über dem Wert bei '+width);
    }else if(width>=1500){assert.ok(theme.y+theme.h<=volume.y,'Thema über dem Regler bei '+width);}
  }
  assert.equal(await page.locator('#show-topic').textContent(),topic);
  assert.equal(await page.locator('#show-topic').getAttribute('title'),topic);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,topic:''}),state);
  assert.equal(await page.locator('#radio-topic').isVisible(),false);
  assert.deepEqual(errors,[]);
});

test('Leere Metadaten zeigen keine Platzhalter, Beschriftungen oder leeren Spalten', async t=>{
  const {page,state,errors}=await setup(t,{station:true,delayedSong:true,viewport:{width:2124,height:160}});
  assert.equal(await page.locator('#track-label').isVisible(),false);
  assert.equal(await page.locator('.artist-copy').isVisible(),false);
  let metadata=null,failure=false;
  await page.route('https://api.radioking.io/widget/radio/test-radio/track/current',route=>failure?route.fulfill({status:503,body:'unavailable'}):route.fulfill({json:radioSong(metadata)}));
  let revision=2;
  for(const [song,topic,title,artist] of [
    [null,'','',''],
    [{title:'Nur Titel'},'','Nur Titel',''],
    [{artist:{name:'Nur Interpret'}},'','','Nur Interpret'],
    [{title:'Titel',artist:{name:'Interpret'}},'','Titel','Interpret'],
    [null,'80er und 90er','',''],
    [{title:'Titel'},'80er und 90er','Titel',''],
    [{artist:{name:'Interpret'}},'80er und 90er','','Interpret'],
    [{title:'Titel',artist:{name:'Interpret'}},'80er und 90er','Titel','Interpret'],
    [{title:' \n ',artist:{name:' \t '}},'  ','','']
  ]){
    metadata=song;
    await page.evaluate(({state,topic,revision})=>{window.__emit('mw:state',{...state,topic,revision});document.dispatchEvent(new Event('visibilitychange'));},{state,topic,revision:revision++});
    await page.waitForFunction(({title,artist})=>document.getElementById('track-title').textContent===title&&document.getElementById('track-artist').textContent===artist,{title,artist});
    assert.equal(await page.locator('#track-label').isVisible(),!!title);
    assert.equal(await page.locator('.artist-copy').isVisible(),!!artist);
    assert.equal(await page.locator('#radio-topic').isVisible(),!!topic.trim());
    for(const width of [320,681,1200,1500,1800,2124]){
      const height=width<=680?264:160;await page.setViewportSize({width,height});
      assert.equal(await page.locator('.radio-bar').evaluate(n=>n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight),false,'Teilweise/leere Angaben bei '+width);
      for(const selector of ['#volume','#play-button','#open-wishes','#studio-tab',...(title?['#track-title']:[]),...(artist?['#track-artist']:[]),...(topic.trim()?['#show-topic']:[])]){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,selector+' bei '+width);
      }
      if(!title&&!artist&&!topic.trim()){
        const surface=await page.locator('.now-playing').evaluate(n=>{const style=getComputedStyle(n,'::before');return {display:style.display,background:style.backgroundImage};});
        assert.notEqual(surface.display,'none','Gestaltete Musikfläche bleibt auch ohne Angaben sichtbar');
        assert.match(surface.background,/radial-gradient/,'Dezente Plattenrillen bleiben erhalten');
        assert.doesNotMatch(await page.locator('.radio-bar').innerText(),/Noch kein|Keine Titelangabe|Keine Interpretenangabe|THEMA|INTERPRET/);
      }
    }
  }
  failure=true;
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#metadata-status').filter({hasText:'nicht erreichbar'}).waitFor({state:'attached'});
  assert.equal(await page.locator('#track-title').isVisible(),false);
  assert.equal(await page.locator('.artist-copy').isVisible(),false);
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

test('Lange Live-Angaben überlagern weder Lautstärke noch Fenster-Buttons', async t => {
  const {page,state}=await setup(t,{station:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  state.moderator={nick:'Ein sehr langer Moderatorname mit Zusatz'};
  await page.evaluate(state=>window.__emit('mw:state',state),state);
  await page.evaluate(()=>{document.getElementById('track-title').textContent='Ein besonders langer Songtitel – die ausführliche Live-Version';document.getElementById('track-artist').textContent='Eine Band mit einem besonders langen Künstlernamen';});
  for(const width of [320,390,680,681,700,900,901,960,1100,1199,1200,1400,1499,1500,1600,2124,2560]) {
    await page.setViewportSize({width,height:width<=680?264:160});
    const title=await page.locator('#track-title').boundingBox(),volume=await page.locator('.volume-control').boundingBox();
    const host=await page.locator('#host-name').boundingBox(),actions=await page.locator('.bar-actions').boundingBox();
    if(width<1200){assert.ok(title.y+title.height<=volume.y,'Titel/Lautstärke bei '+width);}
    else if(width<1500) {
      const artist=await page.locator('#track-artist').boundingBox();
      assert.ok(title.y+title.height<=volume.y && artist.y+artist.height<=volume.y,'Titel/Interpret oberhalb der Lautstärke bei '+width);
    }
    else {
      const artist=await page.locator('#track-artist').boundingBox();
      assert.ok(title.x+title.width<volume.x && artist.x+artist.width<volume.x,'Titel/Interpret neben der Lautstärke bei '+width);
      for(const box of [title,artist,volume]){assert.ok(Math.abs(box.y+box.height/2-80)<1,'Auch lange Angaben vertikal mittig bei '+width);}
    }
    if(width<=900){assert.ok(host.y+host.height<=actions.y,'Moderator/Buttons bei '+width);}
    else {assert.ok(host.x+host.width<actions.x,'Moderator und Buttons getrennt nebeneinander bei '+width);}
    assert.equal(await page.locator('.radio-bar').evaluate(node=>node.scrollWidth>node.clientWidth||node.scrollHeight>node.clientHeight),false,'Überlauf bei '+width);
  }
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

test('Studio bleibt mit Ablaufanzeige, langen Namen und Wunschtexten in normalen und schmalen Fenstern ohne Scrollen',async t=>{
  const {page,state,errors}=await setup(t,{view:'studio',k3:false,viewport:{width:780,height:800}});
  const next={...state,revision:2,topic:'80er und 90er',moderator:{nick:'Otterchen',since:Date.now(),expiresAt:Date.now()+3600000,sessionKey:'demo-1'},user:{...state.user,isOnAir:true,canEndModeration:true},queue:[{id:10,text:'a-ha – Take On Me',nick:'Musikfreund',createdAt:Date.now()}],queueTotal:2,pages:2};
  await page.evaluate(s=>window.__emit('mw:state',s),next);await fitPopup(page);
  const folder=path.join(root,'docs/studio-pruefung');
  if(process.env.MISCHWERK_CAPTURE_STUDIO){fs.mkdirSync(folder,{recursive:true});await page.screenshot({path:path.join(folder,'Studio-780.png')});}
  for(const width of [780,601,600,390,320]){
    await page.setViewportSize({width,height:800});
    await page.evaluate(s=>window.__emit('mw:state',{...s,revision:3,moderator:{...s.moderator,nick:'EinSehrLangerModeratorNameMitZusatz'},user:{...s.user,isOnAir:false,canEndModeration:true},queue:[{...s.queue[0],text:'Langer Wunsch '.repeat(22),nick:'EinSehrLangerHoererNameMitZusatz'}]}),next);
    assert.ok(await fitPopup(page)<1000,'Studio-Inhalt unter 1000 px bei '+width);
    if(width<=600){
      await page.locator('#studio-controls-tab').click();assert.ok(await fitPopup(page)<740);
      await page.locator('#studio-queue-tab').click();assert.ok(await fitPopup(page)<740);
      if(width===320&&process.env.MISCHWERK_CAPTURE_STUDIO)await page.screenshot({path:path.join(folder,'Studio-Wuensche-320.png')});
    }
    for(const selector of width<=600?['#prev-page','#next-page','[data-outcome="done"]']:['#on-air','#off-air','#toggle-wishes','#save-topic','#next-page']){
      const box=await page.locator(selector).boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width&&box.y+box.height<=page.viewportSize().height,selector+' bei '+width);
    }
  }
  assert.deepEqual(errors,[]);
});
async function fitPopup(page) {
  await page.waitForTimeout(100);
  const height=await page.locator('.dialog-shell').evaluate(node=>Math.ceil(node.getBoundingClientRect().height));
  await page.setViewportSize({width:page.viewportSize().width,height});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
  assert.equal(await page.locator('.dialog-shell').evaluate(node=>node.scrollWidth>node.clientWidth),false);
  return height;
}
test('Popup passt sich langen Wünschen an und schrumpft nach Rückmeldungen wieder', async t => {
  for(const view of ['wishes','studio']) {
    const {page,state,errors}=await setup(t,{view,k3:false,viewport:{width:view==='wishes'?520:780,height:700}});
    const emptyHeight=await fitPopup(page);
    if(view==='wishes'){assert.ok(emptyHeight<=360);assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-requests').count(),0);}
    const item={id:1,artist:'Ä'.repeat(80),title:'T'.repeat(80),message:'Gruß '.repeat(40),nick:'EinSehrLangerModeratorUndHoererNickname',createdAt:Date.now()};
    const populated={...state,revision:4,myRequests:[item],myTotal:2,myPage:0,myPages:2,queue:[item],queueTotal:50,pages:50,page:0};
    await page.evaluate(state=>window.__emit('mw:state',state),populated);
    const populatedHeight=await fitPopup(page);
    assert.ok(populatedHeight>=emptyHeight);
    if(view==='wishes'){assert.equal(populatedHeight,emptyHeight,'Alte Wünsche vergrößern das vereinfachte Fenster nicht');}
    assert.ok(populatedHeight<760);
    if(view==='studio'){
      assert.equal(await page.locator('.queue-item').count(),1);
      for(const selector of ['#next-page','[data-resolve]']) {
        const box=await page.locator(selector).first().boundingBox();assert.ok(box.y+box.height<=populatedHeight);
      }
      await page.locator('#next-page').click();
      assert.equal(await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:refresh').data.page),1);
    }
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:5}),state);
    assert.equal(await fitPopup(page),emptyHeight);
    assert.deepEqual(errors,[]);
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
      assert.ok(await fitPopup(page)<740);
      assert.equal(await page.locator('#wish-text').evaluate(n=>n.scrollHeight>n.clientHeight),false);
      await page.locator('#wish-text').fill(('Gruß\n').repeat(40));
      assert.ok(await fitPopup(page)<740);
      assert.equal(await page.locator('#wish-form').isVisible(),true);
      assert.equal(await page.locator('.my-wishes,#wish-list-tab,#my-next').count(),0);
    }else{
      assert.ok(await fitPopup(page)<740);
      await page.locator('#studio-queue-tab').click();
      assert.equal(await page.locator('#on-air').isVisible(),false);
      assert.equal(await page.locator('[data-resolve]').first().isVisible(),true);
    }
    assert.ok(await fitPopup(page)<740);
    assert.deepEqual(await page.evaluate(()=>window.__sizes),[]);
    assert.deepEqual(errors,[]);
  }
});
test('Ein einziges Wunschfeld sendet nur Text und zeigt Versandfehler dauerhaft ohne Entwurfsverlust', async t=>{
  const {page,errors}=await setup(t,{view:'wishes'});
  assert.equal(await page.locator('#wish-form textarea,#wish-form input').count(),1);
  await page.locator('#wish-text').fill('Mein Song, bitte mit Grüßen an alle!');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:request'));
  assert.equal(sent.data.text,'Mein Song, bitte mit Grüßen an alle!');
  assert.deepEqual(Object.keys(sent.data).sort(),['requestId','text']);
  assert.match(await page.locator('#wish-feedback').textContent(),/Wird gesendet/);
  await page.evaluate(s=>window.__emit('mw:result',{ok:false,action:s.type,requestId:s.data.requestId,message:'Wunschbox geschlossen.'}),sent);
  assert.equal(await page.locator('#wish-text').inputValue(),sent.data.text);
  assert.match(await page.locator('#wish-feedback').textContent(),/geschlossen/);
  assert.deepEqual(errors,[]);
});

test('Kompakte Wunschbox zeigt nur das Formular und weist Links ohne Versand oder Entwurfsverlust ab',async t=>{
  const {page,errors}=await setup(t,{view:'wishes',k3:false,viewport:{width:520,height:500}});
  assert.equal(await page.locator('#wish-form textarea,#wish-form input').count(),1);
  assert.match(await page.locator('label[for="wish-text"]').textContent(),/Interpret \+ Titel/);
  assert.equal(await page.locator('#wish-rules').textContent(),'Keine YouTube- oder sonstigen Links.');
  assert.equal(await page.locator('.my-wishes,#wish-list-tab,#wish-nick,#my-requests').count(),0);
  assert.doesNotMatch(await page.locator('.dialog-shell').innerText(),/Einfach drauflosschreiben|direkt ans Studio|Dein Knuddels-Nick|Deine Wünsche/);
  for(const width of [520,320]){
    await page.setViewportSize({width,height:500});
    const height=await fitPopup(page);assert.ok(height<=380,'Kompaktes leeres Wunschfenster bei '+width);
    if(process.env.MISCHWERK_CAPTURE_WISHES){
      const folder=path.join(root,'docs','wunschbox-pruefung');fs.mkdirSync(folder,{recursive:true});
      await page.screenshot({path:path.join(folder,'Wunschbox-'+width+'.png')});
    }
  }
  for(const text of ['https://youtu.be/123','Band – Song www.example.com','open.spotify.com/track/123','Band – Song example.de','[Song](example.org)']){
    await page.locator('#wish-text').fill(text);await page.locator('#submit-wish').click();
    assert.match(await page.locator('#wish-feedback').textContent(),/Keine Links/);
    assert.equal(await page.locator('#wish-text').inputValue(),text);
    assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:request')),false);
    assert.ok(await fitPopup(page)<480,'Fehlerrückmeldung bleibt kompakt');
  }
  await page.locator('#wish-text').fill('will.i.am – Scream & Shout');await page.locator('#submit-wish').click();
  assert.equal(await page.evaluate(()=>window.__sent.find(e=>e.type==='mw:request').data.text),'will.i.am – Scream & Shout');
  assert.deepEqual(errors,[]);
});
test('Gespeichert und an Moderator zugestellt werden getrennt bestätigt; fremde Rückmeldung bleibt wirkungslos', async t=>{
  const {page,state}=await setup(t,{view:'wishes'});
  await page.locator('#wish-text').fill('Bitte unseren Lieblingssong.');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:request'));
  const item={id:9,text:sent.data.text,nick:'Otterchen',createdAt:Date.now(),delivery:null};
  await page.evaluate(({s,item})=>window.__emit('mw:result',{ok:true,action:s.type,requestId:s.data.requestId,message:'Gespeichert',request:item}),{s:sent,item});
  assert.equal(await page.locator('#wish-text').inputValue(),'');
  assert.match(await page.locator('#wish-feedback').textContent(),/Gespeichert/);
  assert.doesNotMatch(await page.locator('#wish-feedback').textContent(),/übergeben/);
  await page.evaluate(({state,item})=>window.__emit('mw:state',{...state,revision:3,myRequests:[{...item,delivery:{nick:'StudioMod',at:Date.now()}}]}),{state,item});
  assert.match(await page.locator('#wish-feedback').textContent(),/An StudioMod übergeben/);
  assert.equal(await page.locator('.delivery-status').count(),0);
  await page.evaluate(()=>window.__emit('mw:result',{ok:true,action:'mw:request',requestId:'fremd',message:'An Fake übergeben.'}));
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
  await listener.locator('#wish-feedback').filter({hasText:'Gespeichert'}).waitFor();
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
  await listener.locator('#wish-feedback').filter({hasText:'An Otterchen (Demo) übergeben'}).waitFor();
  assert.equal(await listener.locator('.delivery-status').count(),0);
  const radio=await context.newPage();
  await radio.goto(base+'/preview?role=listener&view=radio');
  await radio.locator('#open-wishes:not([disabled])').waitFor();
  await mod.locator('#studio-topic').fill('80er und 90er');
  await mod.locator('#save-topic').click();
  await mod.locator('#topic-feedback').filter({hasText:'Thema gespeichert.'}).waitFor();
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#show-topic').filter({hasText:'80er und 90er'}).waitFor();
  await mod.locator('#toggle-wishes').click();
  await mod.locator('#toggle-wishes[aria-checked="false"]').waitFor();
  assert.equal(await mod.locator('#toggle-label').textContent(),'Wunschbox aktivieren');
  await listener.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await listener.locator('#wish-fields[disabled]').waitFor();
  assert.match(await listener.locator('#wish-hint').textContent(),/deaktiviert/);
  await mod.locator('#toggle-wishes').click();
  await mod.locator('#toggle-wishes[aria-checked="true"]').waitFor();
  assert.equal(await mod.locator('#toggle-label').textContent(),'Wunschbox deaktivieren');
  await listener.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await listener.locator('#wish-fields:not([disabled])').waitFor();
  await mod.locator('#studio-topic').fill('');
  await mod.locator('#save-topic').click();
  await mod.locator('#topic-feedback').filter({hasText:'Thema entfernt.'}).waitFor();
  await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
  await radio.locator('#radio-topic').waitFor({state:'hidden'});
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
  await radio.locator('#host-name').filter({hasText:'Radio Mischwerk'}).waitFor();
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
test('Native Radiowiedergabe behält Lautstärke, Stummschaltung und Neustart ohne Audioanalyse', async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1200,height:160}});
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://play.radioking.io/test-radio');
  assert.equal(await page.locator('#track-title').textContent(),'Testtitel');
  assert.equal(await page.locator('#track-artist').textContent(),'Testinterpret');
  await page.locator('#volume').evaluate(node=>{node.value='43';node.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.43);
  await page.locator('#play-button').click();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),true);
  await page.locator('#play-button').click();await waitRadioPlaying(page);
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
  await page.setViewportSize({width:900,height:160});
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.paused),false);
  await page.setViewportSize({width:1500,height:160});
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
    assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.4);
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
  const {page,releaseSong,errors}=await setup(t,{station:true,delayedSong:true});
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
  releaseSong();assert.deepEqual(errors,[]);
});

test('RadioKing-Metadatenfehler erhalten den letzten Titel und stoppen keinen Radioton; leere gültige Antwort löscht Angaben', async t=>{
  const {page,releaseSong,errors}=await setup(t,{station:true,delayedSong:true,realAudio:true});
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
  releaseSong();assert.deepEqual(errors,[]);
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
    await page.setViewportSize({width,height:width<=680?264:160});
    const color=await page.locator('#play-button').evaluate(n=>getComputedStyle(n).backgroundImage);
    assert.match(color,/102, 102, 102/);assert.doesNotMatch(color,/255, 190, 46/);
    await page.locator('#play-button').evaluate(b=>{b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
    if(process.env.MISCHWERK_CAPTURE_RADIO_STATUS&&[320,2124].includes(width)){
      const folder=path.join(root,'docs/radio-status-pruefung');fs.mkdirSync(folder,{recursive:true});
      await page.locator('.transport').screenshot({path:path.join(folder,'Sendepause-'+width+'.png')});
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

test('Nur sichtbare Radioleiste fragt RadioKing-Status und Titel alle 30 Sekunden ab; Popups starten keine Abfragen',async t=>{
  for(const view of ['wishes','studio']){
    const {page,errors}=await setup(t,{station:true,view,clock:true});
    let requests=0;
    await page.route('https://api.radioking.io/**',route=>{requests++;return route.fulfill({json:{title:'Titel',artist:'Interpret'}});});
    await page.clock.runFor(31000);
    assert.equal(requests,0,'Keine Metadatenverbindung im Popup');assert.deepEqual(errors,[]);
  }
  const {page,errors}=await setup(t,{station:true,clock:true});
  await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  let requests=0,statusRequests=0;
  await page.route('https://api.radioking.io/**',route=>{
    if(route.request().url().endsWith('/test-radio')){statusRequests++;return route.fulfill({json:{slug:'test-radio',stream_status:'started'}});}
    requests++;return route.fulfill({json:{title:'Titel',artist:'Interpret'}});
  });
  await page.clock.runFor(29000);assert.equal(requests,0);assert.equal(statusRequests,0);
  const response=page.waitForResponse('https://api.radioking.io/widget/radio/test-radio/track/current');
  await page.clock.runFor(1100);await response;assert.equal(requests,1);assert.equal(statusRequests,1);
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:true}));
  await page.clock.runFor(31000);assert.equal(requests,1,'Ausgeblendete Leiste pausiert Titelabruf');assert.equal(statusRequests,1,'Ausgeblendete Leiste pausiert Statusabruf');
  assert.deepEqual(errors,[]);
});

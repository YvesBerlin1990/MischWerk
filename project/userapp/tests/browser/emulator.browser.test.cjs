const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createNativeTestLab } = require('../support/native-lab/server.cjs');
const studioPictures=path.join(require('node:os').tmpdir(),'MischWerk-Pruefbilder','moderation-neu');fs.mkdirSync(studioPictures,{recursive:true});
let browser;









for(const client of ['k3','stapp'])for(const width of [320,640])test('Sendeplanfehler zeigt Erneut laden vollständig ohne Scrollen in '+client+' bei '+width,async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,width);
 await radio.locator('#open-schedule').click();const frame=await overlayView(page,'schedule');
 await frame.locator('#schedule-message.error').waitFor();await frame.locator('#schedule-retry:not([hidden])').waitFor();
 await require('../support/browser-frame.cjs').settle(frame);
 await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
 const geometry=await frame.locator('#schedule-retry').evaluate(n=>{const r=n.getBoundingClientRect();return {bottom:r.bottom,height:innerHeight,left:r.left,right:r.right,width:innerWidth,buttonHeight:r.height,hit:n.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};});
 assert.ok(geometry.bottom<=geometry.height-10,'Fehleraktion hat vollständig Platz samt unterem Abstand: '+JSON.stringify(geometry));
 assert.ok(geometry.left>=0&&geometry.right<=geometry.width&&geometry.buttonHeight>=44&&geometry.hit,'Fehleraktion ist vollständig bedienbar');
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','designaudit');fs.mkdirSync(folder,{recursive:true});
 await page.locator('#overlays iframe').screenshot({path:path.join(folder,'sendeplan-fehler-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+client+'-'+width+'.png'),scale:'css'});
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});









for(const client of ['k3','stapp','android'])test('Private Willkommensgrafik bleibt beim Channelbeitritt nur beim Empfänger in '+client,async t=>{
 const lab=await setup(t,{provider:'online',authenticationTest:true},false,client==='android'?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{});
 const records=[],log=lab.hub.log.bind(lab.hub);lab.hub.log=(kind,data)=>{const item=log(kind,data);records.push(item);return item;};
 const owner=await lab.join('Otterchen',client,client==='android'?390:900,false);
 await owner.radio.locator('#play-button:not([disabled])').click();await owner.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await owner.radio.evaluate(()=>{window.__welcomeAudio=document.getElementById('radio-audio');__welcomeAudio.loop=true;});
 const guest=await lab.join('Testhoerer',client,client==='android'?390:640);
 const welcomes=()=>records.filter(item=>item.kind==='private'&&item.message.includes('img/welcome/banner'));
 assert.deepEqual(welcomes().map(item=>item.nick),['Otterchen','Testhoerer']);
 assert.deepEqual(records.filter(item=>item.kind==='private'||item.kind==='public').map(item=>item.kind),
  ['private','public','private','public'],'Erste Botnachricht je Beitritt ist die private Willkommensgrafik');
 for(const person of [owner,guest]){
  const messages=person.page.locator('#chat p').filter({hasText:'img/welcome/banner'});await messages.waitFor();assert.equal(await messages.count(),1);
 }
 assert.equal(await owner.page.locator('#chat p').filter({hasText:'Testhoerer (privat):'}).count(),0,'Ein anderer Empfänger erhält die Grafik nicht');
 const message=welcomes()[1].message;
 assert.ok(message.startsWith('°>LEFT<°°#r°°>CENTER<°'),'Absender links, danach nativer KCode-Umbruch vor dem zentrierten Banner');
 assert.doesNotMatch(message,/[\r\n]/,'Keine wirkungslose LF-Ersatzformatierung');
 assert.equal(message.replace(/°>[^°]*<°|°[^°]*°/g,'').trim(),'','Kein normaler Text außerhalb von Banner und Bildbuttons');
 const images=[...message.matchAll(/°>(https?:\/\/[^°<>]*)(?:<>--<>\|([^°<>]+))?<°/g)];
 assert.equal(images.length,4);assert.deepEqual(images.map(match=>match[2]||null),[null,'/edit setlmc','https://radio-mischwerk.web.app/','/info']);
 const app=process.env.MISCHWERK_TEST_UPLOAD||path.resolve(__dirname,'../../app');
 for(const image of images){
  const relative=new URL(image[1]).pathname.slice(1).replace('...w_534.h_178.mw_534.mh_178','');
  const response=await guest.page.request.get(lab.origin+'/app/'+relative);assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/^image\/png/);
  assert.ok((await response.body()).equals(fs.readFileSync(path.join(app,'www',relative))),'Tatsächlich ausgelieferte Grafik: '+relative);
 }
 lab.hub.runtime.invokeFunction(lab.hub.runtime.app.onUserJoined,[lab.hub.runtime.users.find('Testhoerer').user]);assert.equal(welcomes().length,2);
 await guest.page.locator('#join').click();await guest.page.waitForFunction(()=>document.getElementById('join').textContent==='Channel betreten');
 await guest.page.locator('#join').click();await guest.page.waitForFunction(()=>document.getElementById('join').textContent==='Channel verlassen');
 await guest.page.locator('#chat p').filter({hasText:'img/welcome/banner'}).nth(1).waitFor();assert.equal(welcomes().length,3);
 assert.equal(await owner.page.locator('#chat p').filter({hasText:'img/welcome/banner'}).count(),1);
 assert.equal(await owner.radio.evaluate(()=>document.getElementById('radio-audio')===__welcomeAudio&&!__welcomeAudio.paused),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.hub.runtime.errors,[]);
});



// Den Tastenhintergrund messen; Text-/Iconkanten enthalten normale Subpixel-Farbsäume.
async function captureRadioButtonColor(button,radio,output){
 const png=await button.screenshot({path:output,scale:'css',animations:'disabled'});
 const foreground=await button.evaluate(n=>{const b=n.getBoundingClientRect();return n.classList.contains('wish-button')?Array.from(n.querySelectorAll('strong,.public-action-icon')).map(part=>{const r=part.getBoundingClientRect();return {left:r.left-b.left-2,right:r.right-b.left+2,top:r.top-b.top-2,bottom:r.bottom-b.top+2};}):[];});
 const blue=await radio.evaluate(async ({base64,foreground})=>{const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height).data;let blue=0;for(let y=4;y<img.height-4;y++)for(let x=4;x<img.width-4;x++){if(foreground.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom))continue;const i=(y*img.width+x)*4;if(pixels[i+1]>pixels[i]+15&&pixels[i+2]>pixels[i]+15&&pixels[i+2]>70)blue++;}return blue;},{base64:png.toString('base64'),foreground});
 return {blue,...await button.evaluate(n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,color:s.color,tap:s.webkitTapHighlightColor,pressed:n.getAttribute('aria-pressed')};})};
}



for(const client of ['android','stapp','k3'])test('Lautsprechertaste bleibt bei Touch, Maus und Tastatur ohne türkisfarbene Fläche in '+client,async t=>{
 const touch=client==='android',lab=await setup(t,{provider:'online'},false,{isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});
 const {page,radio}=await lab.join('Otterchen',client,touch?390:1280);await page.bringToFront();
 const button=radio.locator('#mute-button'),folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio-mute');fs.mkdirSync(folder,{recursive:true});
 await radio.locator('#play-button').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__muteColorAudio=document.getElementById('radio-audio');__muteColorAudio.loop=true;});
 await radio.locator('#volume').fill('38');await button.scrollIntoViewIfNeeded();
 const proof=[];
 async function capture(state){proof.push({state,...await captureRadioButtonColor(button,radio,path.join(folder,client+'-'+state+'.png'))});}
 await capture('normal');
 if(touch)await button.tap();else await button.click();assert.equal(await radio.locator('#volume-value').textContent(),'0 %');await capture('stumm');
 if(touch)await button.tap();else await button.click();assert.equal(await radio.locator('#volume-value').textContent(),'38 %');await capture('wieder-an');
 await radio.locator('#volume').focus();await page.keyboard.press('Shift+Tab');
 assert.equal(await button.evaluate(n=>document.activeElement===n&&n.matches(':focus-visible')&&getComputedStyle(n).outlineColor==='rgb(230, 199, 123)'&&parseFloat(getComputedStyle(n).outlineWidth)>=2),true,'Goldener Tastaturfokus bleibt sichtbar');
 await capture('tastatur');await button.press('Space');assert.equal(await radio.locator('#volume-value').textContent(),'0 %');await button.press('Space');
 fs.writeFileSync(path.join(folder,client+'-farben.json'),JSON.stringify(proof,null,2));
 assert.ok(proof.every(row=>row.blue===0&&row.background==='rgba(0, 0, 0, 0)'&&row.tap==='rgba(0, 0, 0, 0)'),JSON.stringify(proof));
 assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__muteColorAudio&&!__muteColorAudio.paused&&__muteColorAudio.volume===.38),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

















for (const client of ['k3', 'stapp']) test('/settopic in '+client+' übernimmt Chat-KCode und erhält laufendes Audio', async t => {
  const lab = await setup(t, { provider: 'online' }), owner = await lab.join('Otterchen', client, 1280, false);

  await owner.radio.locator('#play-button:not([disabled])').click();
  await owner.radio.waitForFunction(() => document.getElementById('radio-audio').currentTime > .1);
  await owner.radio.evaluate(() => {
    window.__topicAudio = document.getElementById('radio-audio'); __topicAudio.loop = true;
    window.__topicLoads = 0; __topicAudio.addEventListener('loadstart', () => __topicLoads++);
  });
  const originalFrame = await owner.page.locator('#headerbars iframe').getAttribute('src');
  const raw = '°[230,199,123]°_Radio MischWerk_°r° ' +
    '°>{button}Lieblings-MyChannel|mw-lmc|call|/edit setlmc<° ' +
    '°>{button}Readme setzen|mw-readme|call|/readme Ich höre Radio MischWerk.<° ' +
    '°>{button}Channelinfo|mw-info|call|/info<° ' + 'Musik '.repeat(50);
  async function command(value) {
    await owner.page.locator('#chat-input').fill('/settopic '+value);
    await owner.page.locator('#chat-form button').click();
  }
  await command(raw);
  await assertEventually(() => lab.hub.runtime.channelTopic === raw);
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 1);
  assert.equal(lab.hub.trace.findLast(e => e.kind === 'channelTopic').showMessage, true);
  await command(raw);
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.includes('bereits eingestellt')));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 1);
  await command('--buttons');
  await assertEventually(() => lab.hub.runtime.channelTopic.includes('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|'));
  const serverTopic = lab.hub.runtime.channelTopic;
  assert.ok(serverTopic.includes('guter Laune!°#r°°#r°°>CENTER<°°>{button}'));
  assert.ok(serverTopic.includes('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|'));
  assert.ok(serverTopic.includes('°>{button}Homepage||enabled|0|color|'));
  assert.doesNotMatch(serverTopic,/Readme setzen|\/readme\b/);
  assert.doesNotMatch(serverTopic.match(/°>\{button\}Homepage\|[^°]*<°/)[0],/\|call\|/);
  assert.ok(serverTopic.includes('°>{button}Channelinfo||call|/info|color|'));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 2);
  await command('--pruefen');
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.startsWith('Gespeichertes Channel-Thema:')));
  assert.equal(lab.hub.trace.filter(e => e.kind === 'channelTopic').length, 2);
  lab.hub.runtime.users.find('Otterchen').state.role = 'listener';
  await command('Ohne Inhaberrecht');
  await assertEventually(() => lab.hub.trace.some(e => e.kind === 'private' && e.message.includes('Nur Otterchen')));
  assert.equal(lab.hub.runtime.channelTopic, serverTopic);
  assert.equal(await owner.page.locator('#headerbars iframe').getAttribute('src'), originalFrame);
  assert.deepEqual(await owner.radio.evaluate(() => ({ same: __topicAudio === document.getElementById('radio-audio'),
    playing: !__topicAudio.paused, loads: __topicLoads })), { same: true, playing: true, loads: 0 });
  assert.deepEqual(lab.hub.runtime.errors, []); assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});



async function openRadioAction(radio,button) {
  if(button==='team-tab') { assert.equal(await radio.locator('#team-tab').count(),0); await radio.evaluate(()=>Client.executeSlashCommand('/mw admin')); }
  else { await radio.locator('#'+button+':not([disabled])').click(); }
}







for(const client of ['k3','stapp']) {
  test('Echtes Audioende vor ended verbindet in '+client+' ohne neuen Klick wieder',async t=>{
    const lab=await setup(t,{provider:'online'}),{radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{window.__endEvents=[];window.__starts=0;const a=document.getElementById('radio-audio');
      a.addEventListener('pause',()=>__endEvents.push({ended:a.ended,time:a.currentTime}),true);a.addEventListener('loadstart',()=>__starts++);});
    await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='73';n.dispatchEvent(new Event('input'));});
    await radio.waitForFunction(()=>__starts>=2&&document.getElementById('radio-audio').currentTime>.2,null,{timeout:18000});
    assert.ok(await radio.evaluate(()=>__endEvents.some(e=>e.ended&&e.time===12)),'Echter Browser-pause vor ended');
    assert.equal(await radio.locator('#play-button').getAttribute('aria-pressed'),'true');assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.73);
    assert.equal(await radio.locator('#notice').isVisible(),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Vier Sekunden HTTP-Lücke bleiben in '+client+' mit vorhandener Reserve ohne Wiedergabepause',async t=>{
    const lab=await setup(t,{provider:'online'}),original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();let requests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(fn=>fn(request,response));return;}
      requests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});const cut=44+44100*2*8;response.write(audio.subarray(0,cut));
      const timer=setTimeout(()=>{timers.delete(timer);if(!response.destroyed)response.end(audio.subarray(cut));},4000);timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{window.__gaps=[];const a=document.getElementById('radio-audio');for(const type of ['pause','waiting','error'])a.addEventListener(type,()=>{if(a.currentTime>.1)__gaps.push(type);});});
    await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>6,null,{timeout:12000});
    assert.deepEqual(await radio.evaluate(()=>__gaps),[]);assert.equal(requests,1);assert.equal(await radio.locator('#stream-label').textContent(),'LIVE');assert.deepEqual(lab.errors,[]);
  });
  test('Abgerissene HTTP-Verbindung wird in '+client+' automatisch erneuert; Stop beendet sie dauerhaft',async t=>{
    const lab=await setup(t,{provider:'online'}),original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();let requests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(fn=>fn(request,response));return;}
      requests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});
      if(requests>1){response.end(audio);return;}response.write(audio.subarray(0,44+44100*2*3));
      const timer=setTimeout(()=>{timers.delete(timer);response.destroy();},2000);timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {radio}=await lab.join('Otterchen',client);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='73';n.dispatchEvent(new Event('input'));});await radio.locator('#mute-button').click();
    await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>4,null,{timeout:25000});
    assert.ok(requests>=2&&requests<=3,requests);assert.equal(await radio.locator('#play-button').getAttribute('aria-pressed'),'true');assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),0);
    await radio.locator('#mute-button').click();assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.73);
    await radio.locator('#play-button').click();const count=requests;await new Promise(r=>setTimeout(r,1500));assert.equal(requests,count);assert.equal(await radio.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
  test('Kurze echte HTTP-Nachladelücke übersteht '+client+' ohne neue Audioverbindung',async t=>{
    const lab=await setup(t,{provider:'online'},true);
    const original=lab.server.listeners('request'),audio=require('../fixtures/audio.cjs').audioFixture();
    let audioRequests=0;const timers=new Set();
    t.after(()=>timers.forEach(clearTimeout));lab.server.removeAllListeners('request');
    lab.server.on('request',(request,response)=>{
      if(request.url.split('?')[0]!=='/fixture/audio.wav'){original.forEach(handler=>handler(request,response));return;}
      audioRequests++;response.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});
      const cut=44+44100*2*3;response.write(audio.subarray(0,cut));
      const timer=setTimeout(()=>{timers.delete(timer);if(!response.destroyed)response.end(audio.subarray(cut));},6000);
      timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer);});
    });
    const {page,radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>{
      const a=document.getElementById('radio-audio');window.__gapEvents=[];window.__playCalls=0;window.__realmCalls=0;
      const play=a.play;a.play=function(){window.__playCalls++;return play.apply(this,arguments);};
      const append=Element.prototype.appendChild;
      Element.prototype.appendChild=function(node){
        const result=append.call(this,node);
        if(node.tagName==='IFRAME'&&node.src==='about:blank'){
          const prototype=node.contentWindow.HTMLMediaElement.prototype,np=prototype.play;
          prototype.play=function(){window.__realmCalls++;return np.apply(this,arguments);};
        }
        return result;
      };
      for(const type of ['playing','waiting','pause','error'])a.addEventListener(type,()=>__gapEvents.push({type,time:a.currentTime}));
    });
    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await radio.locator('#volume').evaluate(n=>{n.value='43';n.dispatchEvent(new Event('input'));});
    const source=await radio.locator('#radio-audio').getAttribute('src');
    await radio.waitForFunction(()=>__gapEvents.some(e=>e.type==='waiting'&&e.time>.1),null,{timeout:12000});
    await radio.waitForFunction(()=>__gapEvents.filter(e=>e.type==='playing').length>=2&&document.getElementById('radio-audio').currentTime>3.2);
    await page.clock.runFor(21000);
    assert.equal(await radio.locator('#radio-audio').getAttribute('src'),source);
    assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.paused),false);
    assert.equal(await radio.locator('#radio-audio').evaluate(a=>a.volume),.43);
    assert.equal(await radio.locator('#stream-label').textContent(),'LIVE');
    assert.equal(await radio.evaluate(()=>__playCalls+__realmCalls),1,'Keine eigene play-/Wiederverbindungsschleife auf beiden Aufrufwegen');
    assert.equal(audioRequests,1);assert.equal(await radio.locator('#notice').isVisible(),false);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}








for (const client of ['k3','stapp']) test('Bot-Texte scrollen in '+client+' ausschließlich im festen Inhaltsbereich', async t => {
  const lab=await setup(t,{},false,{deviceScaleFactor:client==='stapp'?2:1}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1400});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  assert.equal(await team.locator('#channel-texts-scroll').count(),1,'Genau eine eigene Inhalts-Scrollfläche');
  const pane=team.locator('#channel-texts-scroll');
  for(let i=0;i<4;i++)await team.locator('#channel-texts-add').click();
  const long=Array.from({length:16},(_,i)=>'Nachricht Zeile '+(i+1)).join('\n');
  for(let i=0;i<6;i++){await team.locator('#channel-texts-current').selectOption(String(i));await team.locator('#channel-texts-fields textarea').nth(i).fill(long);}
  await team.locator('#channel-texts-current').selectOption('0');
  const fixed=()=>team.evaluate(()=>['.dialog-header','.team-tabs','.channel-texts-actions'].map(selector=>{
    const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  for(const width of [560,390,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await team.waitForTimeout(100);
    assert.ok(await team.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1),'Dokument bewegt sich nicht');
    const fields=await team.locator('#channel-texts-fields textarea:visible').evaluateAll(nodes=>nodes.map(n=>({height:n.clientHeight,content:n.scrollHeight,overflow:getComputedStyle(n).overflowY,font:parseFloat(getComputedStyle(n).fontSize)})));
    assert.ok(fields.every(n=>n.height>=n.content-1&&n.overflow==='hidden'&&n.font>=16),JSON.stringify(fields));
    const field=team.locator('#channel-texts-fields textarea').first();await field.evaluate(n=>n.scrollIntoView({block:'start'}));
    const before=await fixed(),initial=await pane.evaluate(n=>n.scrollTop),box=await field.boundingBox(),clip=await pane.boundingBox();
    await page.mouse.move(box.x+25,Math.max(box.y,clip.y)+25);await page.mouse.wheel(0,160);await page.waitForTimeout(100);
    assert.ok(await pane.evaluate(n=>n.scrollTop)>initial,'Auch über einem Textfeld scrollt dieselbe Inhaltsfläche');
    assert.equal(await field.evaluate(n=>n.scrollTop),0,'Kein inneres Textfeldscrollen');assert.deepEqual(await fixed(),before);
    await pane.evaluate(n=>{n.scrollTop=n.scrollHeight;});const bottom=await pane.evaluate(n=>n.scrollTop);
    await page.mouse.wheel(0,600);await page.waitForTimeout(100);assert.equal(await pane.evaluate(n=>n.scrollTop),bottom);
    assert.equal(await team.evaluate(()=>scrollY),0,'Am Scrollrand kein Sprung zum Dokument');assert.deepEqual(await fixed(),before);
    // Edge lässt Mausradimpulse nachlaufen; die folgende Aktualisierungsprüfung beginnt nach diesem separaten Vorgang.
    await team.waitForTimeout(450);
    await field.focus();await field.press('Control+End');await field.press('Enter');
    await field.evaluate(n=>{n.value=n.value.slice(0,294);n.setSelectionRange(n.value.length,n.value.length);n.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.ok(await field.evaluate(n=>{const r=n.getBoundingClientRect(),p=document.getElementById('channel-texts-scroll').getBoundingClientRect();return r.bottom<=p.bottom+1;}),'Ende des wachsenden Textes bleibt erreichbar');
    await field.press('Control+Home');assert.ok(await field.evaluate(n=>{const r=n.getBoundingClientRect(),p=document.getElementById('channel-texts-scroll').getBoundingClientRect();return r.top>=p.top-1;}));
    await team.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await pane.evaluate(n=>{n.scrollTop=Math.min(450,n.scrollHeight-n.clientHeight);});
    await team.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    const position=await pane.evaluate(n=>n.scrollTop);
    await team.locator('#channel-texts-refresh').click();await team.waitForFunction(()=>document.getElementById('channel-texts-refresh').getAttribute('aria-disabled')==='false');
    const refreshed=await pane.evaluate(n=>n.scrollTop);
    assert.ok(Math.abs(refreshed-position)<2,'Aktualisieren versetzt den Inhalt nicht: '+position+' → '+refreshed);
  }
  lab.hub.faults.failPersistence=true;await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'konnten nicht gespeichert'}).waitFor();
  assert.ok(await team.locator('#channel-texts-feedback').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  lab.hub.faults.failPersistence=false;
  const position=await pane.evaluate(n=>n.scrollTop);await team.locator('#team-members-tab').click();assert.equal(await team.locator('#display-form').isVisible(),true);
  await team.locator('#team-texts-tab').click();assert.ok(Math.abs(await pane.evaluate(n=>n.scrollTop)-position)<2);
  await team.locator('#channel-texts-save').click();await team.locator('#channel-texts-feedback').filter({hasText:'Bot-Texte gespeichert.'}).waitFor();
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').texts.length,6);
  await page.setViewportSize({width:1800,height:550});await page.waitForTimeout(100);
  assert.ok(await pane.evaluate(n=>n.clientHeight>=50),'Auch im begrenzten Host bleibt ein nutzbarer Inhaltsbereich');
  assert.equal(await team.evaluate(()=>scrollY),0);
  for(const id of ['channel-texts-refresh','close-overlay'])assert.ok(await team.locator('#'+id).evaluate(n=>{
    const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&hit&&hit.closest('button')===n;
  }));
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' speichern, rotieren und erhalten Entwurf, Rechte und Audio', async t => {
  const lab=await setup(t,{provider:'online'}), {page,radio}=await lab.join('Otterchen',client,1280,false);
  const greetings=lab.hub.trace.filter(e=>e.kind==='public'&&e.message.includes('Willkommen')).map(e=>e.message);
  assert.equal(greetings.length,1);
  assert.equal(greetings[0], "°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Otterchen|/w Otterchen<°.§°r° Viel Spaß beim Zuhören.");
  await page.setViewportSize({width:1800,height:1400});
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__botTextsAudio=document.getElementById('radio-audio');});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await overlayView(page,'team');
  assert.equal(await team.locator('#dialog-title').textContent(),'Verwaltung');
  await team.locator('#team-texts-tab').click();
  await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  assert.equal(await team.locator('#channel-texts-enabled').isChecked(),false);
  assert.deepEqual(await team.locator('#channel-texts-interval option').allTextContents(),['20 Minuten','30 Minuten','40 Minuten','50 Minuten']);
  await team.locator('#channel-texts-current').selectOption('0');await team.locator('#channel-texts-fields textarea').nth(0).fill('Erster Channeltext');
  await team.locator('#channel-texts-current').selectOption('1');await team.locator('#channel-texts-fields textarea').nth(1).fill('Zweiter Channeltext');
  await team.locator('#channel-texts-interval').selectOption('30');
  await team.locator('#channel-texts-enabled').check();
  await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Erste Ausgabe in 30 Minuten'}).waitFor();
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),greetings);
  lab.hub.runtime.clock.advance(30*60000);
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext']);
  lab.hub.runtime.clock.advance(30*60000);
  assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext','Zweiter Channeltext']);
  await team.locator('#channel-texts-enabled').uncheck();await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'ausgeschaltet'}).waitFor();
  lab.hub.runtime.clock.advance(50*60000);assert.deepEqual(lab.hub.trace.filter(e=>e.kind==='public').map(e=>e.message),[...greetings,'Erster Channeltext','Zweiter Channeltext']);
  await team.locator('#channel-texts-current').selectOption('0');await team.locator('#channel-texts-fields textarea').nth(0).fill('Mein ungespeicherter Bot-Text');
  await team.locator('#channel-texts-refresh').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Aktualisiert'}).waitFor();
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Mein ungespeicherter Bot-Text');
  await openRadioAction(radio,'open-wishes');await overlayView(page,'wishes');
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#team-texts-tab').getAttribute('aria-selected'),'true');
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Mein ungespeicherter Bot-Text');
  assert.equal(await team.locator('#channel-texts-current').inputValue(),'0');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__botTextsAudio&&!window.__botTextsAudio.paused),true);
  await team.locator('#team-members-tab').click();assert.equal(await team.locator('#display-form').isVisible(),true);
  await team.locator('#team-members-tab').press('ArrowRight');assert.equal(await team.locator('#channel-texts-form').isVisible(),true);
  for(let i=0;i<4;i++)await team.locator('#channel-texts-add').click();
  assert.equal(await team.locator('#channel-texts-fields textarea').count(),6);assert.equal(await team.locator('#channel-texts-add').isDisabled(),true);
  await team.locator('#channel-texts-fields button').last().click();assert.equal(await team.locator('#channel-texts-fields textarea').count(),5);
  lab.hub.runtime.users.find('Otterchen').state.role='listener';
  await team.locator('#channel-texts-refresh').click();
  await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(lab.hub.runtime.contents.sessions.size,1);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte übernehmen eigene Knuddels-Smileys in '+client+' und erhalten Kürzel, Entwurf und Audio', async t => {
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__smileyAudio=document.getElementById('radio-audio');});
  const runtime=lab.hub.runtime, owner=runtime.users.find('Otterchen').user;
  const code=':(nosmoking-happy-y):',image='°>sm_abo_24-03_nosmoking_yellow_happy...b.w_35.h_39.mx_1.pw_33.ph_39.gif<°';
  runtime.invokeFunction(runtime.app.onPrivateMessage,[{getAuthor:()=>owner,getRawText:()=> 'smiley '+code,
    getText:()=> client==='k3' ? '°r°smiley '+image.replace('<°','<>|/tb-show sid~smileyClick:21178<°')+'°r°' :
      'smiley _'+image.replace('<°','|/tb-show sid~smileyClick:21178<°')+'_'}]);
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();
  await team.locator('.channel-texts-help summary').click();await team.getByText('smiley DEIN-CODE',{exact:true}).waitFor();await team.locator('.channel-texts-help summary').click();
  await team.locator('#channel-texts-current').selectOption('0');await team.locator('#channel-texts-fields textarea').nth(0).fill('Rauchen bitte vor der Tür. '+code);
  await team.locator('#channel-texts-enabled').check();
  await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Erste Ausgabe in 20 Minuten'}).waitFor();
  runtime.clock.advance(20*60000);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='public').at(-1).message,'Rauchen bitte vor der Tür. '+image);
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Rauchen bitte vor der Tür. '+code);
  if(process.env.MISCHWERK_SMILEY_CAPTURE&&client==='k3') {
    for(const width of [560,320]) {
      await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
      await team.waitForTimeout(100);
      await team.evaluate(()=>{document.getElementById('channel-texts-scroll').scrollTop=0;});
      await page.locator('#overlays iframe').screenshot({path:path.resolve('../docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
    }
  }
  await team.locator('#channel-texts-current').selectOption('0');await team.locator('#channel-texts-fields textarea').nth(0).fill('Mein Entwurf '+code);
  await team.locator('#close-overlay').click();
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Mein Entwurf '+code);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__smileyAudio&&!window.__smileyAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' bleiben bei 560 und 320 Pixeln erreichbar und behalten Fehlerentwürfe', async t => {
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,1280);
  await page.setViewportSize({width:1800,height:1400});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-current').selectOption('0');await team.locator('#channel-texts-fields textarea').nth(0).fill('Ein Text für unsere Hörerinnen und Hörer.');
  await team.locator('#channel-texts-current').selectOption('1');await team.locator('#channel-texts-fields textarea').nth(1).fill('Deinen Musikwunsch kannst du in der Wunschbox abgeben.');
  lab.hub.faults.failPersistence=true;await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'konnten nicht gespeichert'}).waitFor();
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'Ein Text für unsere Hörerinnen und Hörer.');
  lab.hub.faults.failPersistence=false;
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await team.waitForTimeout(100);
    assert.equal(await team.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const metrics=await team.evaluate(()=>Array.from(document.querySelectorAll('#channel-texts-fields .channel-texts-entry:not([hidden]) textarea,#channel-texts-form select,#channel-texts-save')).map(n=>{
      const r=n.getBoundingClientRect();return {width:r.width,height:r.height,font:parseFloat(getComputedStyle(n).fontSize),button:n.tagName==='BUTTON'};
    }));
    assert.ok(metrics.every(m=>m.width>44&&m.height>=44&&m.font>=(m.button?14:16)),JSON.stringify(metrics));
    await team.locator('#channel-texts-save').scrollIntoViewIfNeeded();assert.equal(await team.locator('#channel-texts-save').isVisible(),true);
    if(process.env.MISCHWERK_DESIGN_CAPTURE&&client==='k3') {
      await team.evaluate(()=>window.scrollTo(0,0));
      await page.locator('#overlays iframe').screenshot({path:path.resolve('../docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
    }
  }
  await team.locator('#channel-texts-save').click();await team.locator('#channel-texts-feedback').filter({hasText:'gespeichert'}).waitFor();
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Bot-Texte in '+client+' schützen ungespeicherte Eingaben bei einer neueren Serverrevision', async t => {
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client);
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-fields textarea').first().fill('Mein noch nicht gespeicherter Entwurf');
  await team.evaluate(()=>Client.sendEvent('mw:channelTexts.save',{requestId:'other-owner-edit',view:'team',viewRevision:1,
    expectedRevision:0,enabled:false,interval:50,texts:['Inzwischen gespeicherter Text']}));
  await team.locator('#channel-texts-reload').waitFor({state:'visible'});
  assert.ok(await team.locator('#channel-texts-reload').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight&&hit&&hit.closest('button')===n;}));
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Mein noch nicht gespeicherter Entwurf');
  assert.equal(await team.locator('#channel-texts-save').isDisabled(),true);
  await team.locator('#channel-texts-refresh').click();
  await team.waitForFunction(()=>document.getElementById('channel-texts-refresh').getAttribute('aria-disabled')==='false');
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Mein noch nicht gespeicherter Entwurf');
  await team.locator('#channel-texts-reload').click();
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Inzwischen gespeicherter Text');
  assert.equal(await team.locator('#channel-texts-interval').inputValue(),'50');
  await team.locator('#channel-texts-fields textarea').first().fill('Überarbeiteter bestätigter Stand');
  await team.locator('#channel-texts-save').click();
  await team.locator('#channel-texts-feedback').filter({hasText:'Bot-Texte gespeichert. Automatische Ausgabe ist ausgeschaltet.'}).waitFor();
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').revision,2);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});









for(const client of ['k3','stapp'])test('Doppelte native Wunschöffnung in '+client+' bleibt einmalig und erhält Entwurf und Audio',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);lab.hub.faults.clientEventType='mw:openWishes';lab.hub.faults.duplicateNext=true;await radio.locator('#open-wishes:not([disabled])').click();let wishes=await overlayView(page,'wishes');await wishes.locator('#wish-text:not([disabled])').fill('Nativer Entwurf');await page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wishes.sync'&&e.eventData.text==='Nativer Entwurf'));assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);lab.hub.faults.duplicateNext=true;const before=await page.locator('#overlays iframe').getAttribute('src');await radio.locator('#open-wishes:not([disabled])').click();await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,before);wishes=await overlayView(page,'wishes');assert.equal(await wishes.locator('#wish-text').inputValue(),'Nativer Entwurf');assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});







test('Build-172-Gegenprobe: Deaktivierte Ladefarben lassen den weißen Loader-Unterbau sichtbar',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp');
  const configure=lab.hub.runtime.context.MischWerkModules.configureLoading;
  lab.hub.runtime.context.MischWerkModules.configureLoading=loading=>configure(loading,false);
  let release;await page.route('**/frame/**',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
  try{
    await radio.locator('#open-wishes:not([disabled])').click();await page.locator('#overlays iframe').waitFor();
    const opening=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opening.loading.enabled,false);assert.equal(opening.loading.background,'#0F1114');
    assert.equal(await page.locator('#overlays .app-loading').count(),0);
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
  }finally{if(release)release();}
});
async function assertOverlayCornerPixels(page) {
  const png=await page.locator('#overlays iframe').screenshot();
  const pixels=await page.evaluate(async data=>{
    const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+data)).blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
    return [[1,1],[3,3],[canvas.width-2,1],[canvas.width-4,3]].map(([x,y])=>Array.from(context.getImageData(x,y,1,1).data));
  },png.toString('base64'));
  assert.deepEqual(pixels,Array(4).fill([15,17,20,255]),'Tatsächliche obere Eckpixel passen zum Channelgrund');
}
async function assertDarkPicture(page,element,uniform=false) {
  const png=await element.screenshot();
  const pixels=await page.evaluate(async data=>{
    const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+data)).blob());
    const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
    const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
    let white=0,dark=0,innerNonDark=0;
    for(let i=0;i<rgba.length;i+=4){
      const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width),isDark=rgba[i]===15&&rgba[i+1]===17&&rgba[i+2]===20;
      if(rgba[i]>235&&rgba[i+1]>235&&rgba[i+2]>235)white++;if(isDark)dark++;
      if(!isDark&&x>=8&&y>=8&&x<canvas.width-8&&y<canvas.height-8)innerNonDark++;
    }
    return {white:white/(rgba.length/4),dark:dark/(rgba.length/4),innerNonDark};
  },png.toString('base64'));
  assert.ok(pixels.white<.02,'Keine weiße Zwischenfläche im tatsächlichen Screenshot: '+JSON.stringify(pixels));
  if(uniform){assert.equal(pixels.white,0);assert.equal(pixels.innerNonDark,0,'Native Zwischenfläche enthält weder Text noch Indikator: '+JSON.stringify(pixels));}
}


async function assertEventually(check) { for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.fail('Erwarteter Zustand blieb aus'); }





async function overlayView(page,kind) {
 const selector='#overlays iframe[title$=" · '+kind+'"]';
 for(let attempt=0;attempt<100;attempt++){
  const handle=await page.waitForSelector(selector),frame=await handle.contentFrame();
  if(!frame||frame.isDetached()){await page.waitForTimeout(20);continue;}
  try{await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));return frame;}
  catch(error){if(!frame.isDetached())throw error;}
 }
 throw Error('Native Overlayseite wurde nicht bereit: '+kind);
}





test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });

test.after(async () => { await browser?.close(); });




async function setup(t, faults = {}, clock = false, contextOptions = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Browser-'));
  const {TestPersistence}=require('../support/native-lab/runtime/persistence.cjs');
  new TestPersistence(directory).api().setObject('mischwerk.android.private.v1',{enabled:!faults.connectionDisabled,runtimeVerified:!faults.connectionDisabled,syncSecret:'synthetic_'+ 'x'.repeat(45),relaySecret:'r'.repeat(64),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:0});
  let instance;const posts=[],central={held:[],active:true,topic:'Musik aus dem Studio',nick:'DJ-Test',revision:1,accept:true,position:0};
  const externalPort={canAccessURL:()=>true,postURL(url,args){const body=JSON.parse(args.data.payload);posts.push(body);const respond=()=>{if(!instance)return;const runtime=instance.hub.runtime,now=runtime.clock.now();if(central.failure){runtime.invokeFunction(args.onFailure,[central.failure.raw,{getResponseCode:()=>central.failure.status,getURLString:()=>url}]);return;}runtime.invokeFunction(args.onSuccess,[JSON.stringify({contractVersion:2,accepted:true,serverTime:now,station:{contractVersion:2,authority:'studio',protocolEpoch:'browser-v2',revision:central.revision,broadcastState:central.active?'live':'unknown',onAir:central.active,wishboxOpen:central.active,moderatorNick:central.active?central.nick:null,topic:central.active?central.topic:null,updatedAt:central.active?now:0,validUntil:central.active?now+45000:0},wishReceipts:body.wishSubmissions.map(row=>({submissionId:row.submissionId,accepted:true,state:'queued',position:++central.position,error:null})),ownWishStatuses:[],deletionReceipts:[],broadcastEvents:[],eventCursor:'initial',nickAccessPage:{snapshotId:'s'+now,revision:'a'.repeat(64),snapshotAt:now,validUntil:now+45000,items:central.roster===undefined?[{nick:'DJ-Test'}]:central.roster,nextCursor:null,complete:true}}),{getResponseCode:()=>200,getURLString:()=>url}]);};setImmediate(()=>{if(central.accept)respond();else central.held.push(respond);});}};
  instance = await createNativeTestLab({ port: 0, dataDir: directory, appDir:process.env.MISCHWERK_TEST_UPLOAD,external:externalPort });
  Object.assign(instance.hub.faults, faults);
  if (faults.provider) instance.hub.restart(false);
  const context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, ...contextOptions });context.setDefaultTimeout(15000);
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
  async function join(nick = 'Otterchen', client = 'k3', width = 1280, registeredOwner = true) {
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
  return { ...instance, context, join, errors, external,central,posts };
}
async function view(page, mode) {
  const selector = mode === 'Headerbar' ? '#headerbars iframe[src]' : mode === 'Overlay' ? '#overlays iframe[src]' : '#popups iframe[src]';
  const handle = await page.waitForSelector(selector);
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
  return frame;
}
async function send(page, value) { await page.evaluate(value => window.EmulatorLab.send(value), value); }

test('X-Mas in der Wunschbox folgt der Anzeigeeinstellung und erhält Eingabe und Fokus',async t=>{
 const lab=await setup(t,{provider:'online'});
 const owner=await lab.join(),listener=await lab.join('Testhoerer','stapp',480);
 await owner.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));
 const admin=await overlayView(owner.page,'team');
 const theme=admin.locator('#display-theme');
 const open=async()=>{
  await listener.radio.locator('#open-wishes:not([disabled])').click();
  return await overlayView(listener.page,'wishes');
 };
 let frame=await open();
 const header=()=>frame.locator('#wish-drawer-heading').evaluate(node=>getComputedStyle(node,'::before').backgroundImage);
 const original=await header();
 assert.doesNotMatch(original,/xmas/);
 const draft='a-ha – Take On Me';
 const input=frame.locator('#wish-text');
 await input.fill(draft);
 await input.evaluate(node=>node.setSelectionRange(0,4));
 await theme.selectOption('xmas');
 await frame.locator('html.theme-xmas').waitFor({state:'attached'});
 assert.match(await header(),/xmas-corner-bow\.png/);
 assert.deepEqual(await input.evaluate(node=>[node.value,node.selectionStart,node.selectionEnd,node===document.activeElement]),
  [draft,0,4,true]);
 await frame.locator('#close-wishes').click();
 await listener.page.locator('#overlays iframe').waitFor({state:'detached'});
 frame=await open();
 assert.equal(await frame.evaluate(()=>Client.pageData.theme),'xmas');
 assert.equal(await frame.locator('#wish-text').inputValue(),draft);
 const pictures=path.join(os.tmpdir(),'MischWerk-Pruefbilder','wunschbox');
 fs.mkdirSync(pictures,{recursive:true});
 for(const width of [480,320]){
  const viewport=listener.page.locator('#width');
  await viewport.fill(String(width));await viewport.dispatchEvent('change');
  await frame.waitForFunction(width=>innerWidth===width,width);
  await listener.page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth),width);
  const submit=frame.locator('#submit-wish');
  await submit.scrollIntoViewIfNeeded();
  assert.ok((await submit.boundingBox()).height>=44);
  await listener.page.locator('#overlays iframe').screenshot({path:path.join(pictures,'wunschbox-xmas-'+width+'.png'),scale:'css'});
 }
 await theme.selectOption('normal');
 await frame.locator('html:not(.theme-xmas)').waitFor({state:'attached'});
 assert.equal(await header(),original);
 assert.equal(await frame.locator('#wish-text').inputValue(),draft);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp','android'])test('Native Wiedergabe erholt sich nach einem Fehlversuch ohne Nutzer-Fehlerlog in '+client,async t=>{
 const lab=await setup(t,{provider:'online'},false,client==='android'?{userAgent:'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 Chrome/157.0.8103.38 Mobile Safari/537.36'}:{});let failed=true;
 await lab.context.route('**/fixture/audio.wav**',route=>failed?route.abort('failed'):route.continue());
 const {radio}=await lab.join('Otterchen',client,412);await radio.locator('#play-button').click();
 await radio.waitForFunction(()=>document.getElementById('stream-label').textContent==='Verbinde erneut');failed=false;
 await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.2&&document.body.classList.contains('playing'));
 assert.equal(await radio.locator('#radio-audio').evaluate(audio=>audio.muted),false);
 assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:playback.error'||e.kind==='log'&&e.message.includes('[PLAYBACK_ERROR]')),false);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp','android'])for(const hostSizing of ['normal','ignored'])test('Audiostörung bleibt im Hintergrund und erholt sich in '+client+' bei '+hostSizing,async t=>{
 const lab=await setup(t,{provider:'online',hostSizing},false,{viewport:{width:4100,height:1100},...(client==='android'?{userAgent:'Mozilla/5.0 (Linux; Android 14; SM-A546B; wv) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'}:{})});let failure=true;
 await lab.context.route('**/fixture/audio.wav**',route=>failure?route.abort('failed'):route.continue());
 const {page,radio}=await lab.join('Otterchen',client,412);
 await radio.evaluate(()=>document.fonts.ready);await radio.waitForTimeout(100);
 const original=await radio.evaluate(()=>innerHeight);
 const originalDeck=await radio.locator('#radio-deck').evaluate(n=>n.getBoundingClientRect().height);
 const originalSizes=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Headerbar'&&e.method==='setSize').length;
 await radio.locator('#play-button').click();
 await radio.waitForFunction(()=>document.getElementById('stream-label').textContent==='Verbinde erneut');
 assert.equal(await radio.locator('#playback-status').count(),0,'Keine Diagnosezeile unter der Appleiste');
 assert.equal(await radio.evaluate(()=>innerHeight),original);
 assert.equal(await radio.locator('#radio-deck').evaluate(n=>n.getBoundingClientRect().height),originalDeck);
 assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Headerbar'&&e.method==='setSize').length,originalSizes,'Ein Fehler erzeugt keinen Größenauftrag');
 assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:playback.error'||e.kind==='log'&&e.message.includes('[PLAYBACK_ERROR]')),false,'Keine Nutzer-Fehlerberichte oder App-Logs');
 assert.equal(await radio.locator('#play-button').getAttribute('aria-pressed'),'true');
 assert.equal(await radio.locator('body').evaluate(n=>n.classList.contains('playing')),false);
 for(const width of [320,412,1280,3840]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(w=>innerWidth===w,width);
  assert.equal(await radio.locator('#playback-status').count(),0);
  assert.doesNotMatch(await radio.locator('body').textContent(),/Medienfehler|PLAY_FAILED|START_TIMEOUT/);
  assert.equal(await radio.locator('#play-button').isEnabled(),true);
 }
 await page.locator('#width').fill('412');await page.locator('#width').dispatchEvent('change');
 await radio.locator('#play-button').scrollIntoViewIfNeeded();
 const picture=path.join(os.tmpdir(),'MischWerk-Pruefbilder','audiofehler-hintergrund-398');fs.mkdirSync(picture,{recursive:true});
 await radio.locator('body').screenshot({path:path.join(picture,'audiofehler-'+client+'-'+hostSizing+'.png')});
 failure=false;await radio.locator('#play-button').click();assert.equal(await radio.locator('#playback-status').count(),0);
 await radio.locator('#play-button').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.2&&document.body.classList.contains('playing'));
 assert.equal(await radio.locator('#playback-status').count(),0);
 if(hostSizing==='ignored')assert.equal(await radio.evaluate(()=>innerHeight),original);
 const sizes=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Headerbar'&&e.method==='setSize').length;
 await radio.waitForTimeout(500);assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Headerbar'&&e.method==='setSize').length,sizes,'Keine Größenwiederholung bei gleichem Inhalt');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) {
  test('Wunschbox bündelt in '+client+' nach Versand nur die Quittung und weitere Eingabe auch bei schmaler Leiste',async t=>{
    const lab=await setup(t,{hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,320);
    await radio.locator('#open-wishes:not([disabled])').click();
    const surface=await view(page,'Overlay');
    const appearance=await surface.evaluate(()=>({background:getComputedStyle(document.getElementById('wishes-panel')).backgroundColor,font:getComputedStyle(document.getElementById('inline-wish-title')).fontFamily,button:getComputedStyle(document.getElementById('submit-wish')).backgroundColor}));
    assert.equal(appearance.background,'rgb(20, 20, 20)');assert.match(appearance.font,/Outfit/);assert.equal(appearance.button,'rgb(230, 199, 123)');
    await surface.waitForFunction(()=>Math.abs(document.getElementById('wishes-panel').getBoundingClientRect().height-innerHeight)<=1);
    const pictures=path.join(os.tmpdir(),'MischWerk-Pruefbilder','wunschbox-neu');fs.mkdirSync(pictures,{recursive:true});
    await surface.locator('#wishes-panel').screenshot({path:path.join(pictures,'wunschbox-live-status-443-'+client+'-320.png')});
    const song='Langer Interpret und vollständiger Musikwunsch '.repeat(7).slice(0,300);
    for(const text of [song,'Mein zweiter Wunsch']) {
      if(await surface.locator('#wish-compose-open').isVisible())await surface.locator('#wish-compose-open').click();
      await surface.locator('#wish-text').fill(text);await surface.locator('#submit-wish').click();
      await surface.locator('#wish-feedback.success').filter({hasText:'Dein Wunsch ist dabei!',exact:true}).waitFor();
      await surface.locator('#wish-compose-open').waitFor();
    }
    await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor({state:'attached'});
    assert.equal(await radio.locator('#own-wish-position').isVisible(),false,'Mobile Leiste reserviert keine private Wunschfläche');
    assert.equal(await radio.locator('#own-wish-title').textContent(),song);
    assert.equal(await radio.locator('#own-wish-position').getAttribute('title'),'Dein Musikwunsch');
    assert.equal(await surface.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
    assert.equal(await surface.locator('#wish-tracking,#wish-back-radio').count(),0);assert.equal(await surface.locator('#wish-compose-open').isVisible(),true);
    await radio.waitForTimeout(600);
    const headerHeight=await radio.evaluate(()=>innerHeight);
    await surface.locator('#wish-compose-open').click();
    const draft='Mein weiterer Entwurf';await surface.locator('#wish-text').fill(draft);
    await surface.locator('#submit-wish').scrollIntoViewIfNeeded();
    assert.equal(await surface.locator('#wish-text').inputValue(),draft);
    assert.equal(await surface.locator('#wish-text').evaluate(n=>n===document.activeElement),true);
    assert.equal(await surface.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await surface.waitForTimeout(900);
    const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
    await surface.waitForTimeout(600);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count,'Ruhender Inhalt löst keine Größenkaskade aus');
    assert.equal(await radio.evaluate(()=>innerHeight),headerHeight);
    assert.equal(lab.hub.trace.filter(e=>e.eventType==='mw:wish.submit').length,2);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp']) {


}




test('Verlorene Quittung: Timeout und Wiederholung behalten dieselbe submissionId', async t => {
  const lab = await setup(t);await lab.join('Otterchen');const { page, radio } = await lab.join('Polaroid');
  await send(page, { type: 'faults', value: { dropServer: 2, dropServerType: 'mw:wish.receipt' } });
  await page.waitForFunction(() => window.EmulatorLab.state.faults.dropServer === 2);
  await radio.locator('#open-wishes').click(); const surface = await view(page, 'Overlay');
  await surface.locator('#wish-text').fill('Testinterpret – Verlorene Quittung');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({hasText:/Bestätigung|Verbindung|erneut/}).waitFor({timeout:30000});
  await surface.locator('#submit-wish:not([disabled])').waitFor();
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback.success').filter({hasText:'Dein Wunsch ist dabei!',exact:true}).waitFor();
  const submissions = lab.hub.trace.filter(item => item.kind === 'clientEvent' && item.eventType === 'mw:wish.submit');
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0].eventData.submissionId, submissions[1].eventData.submissionId);
  const record = lab.hub.runtime.users.find('Polaroid'), radioId = [...lab.hub.runtime.contents.sessions.keys()].find(id =>
    lab.hub.runtime.contents.describe(id).nick === record.state.nick && lab.hub.runtime.contents.describe(id).mode === 'Headerbar');
  lab.hub.runtime.event('Polaroid', radioId, 'mw:refresh', {});
  assert.equal(lab.hub.trace.findLast(item => item.eventType === 'mw:state' && item.nick === 'Polaroid').eventData.wishPositions.total, 1);
});
test('320 und 2290 Pixel sind tatsächliche Framebreiten, Overlay verändert den Channelbeginn nicht', async t => {
  const lab = await setup(t);await lab.join('Otterchen');const { page, radio } = await lab.join('Polaroid', 'k3', 320);
  assert.equal(await radio.evaluate(() => innerWidth), 320);
  await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  const initialHeight=await radio.evaluate(()=>innerHeight);
  await radio.locator('#open-wishes').click(); const surface = await view(page, 'Overlay');
  assert.ok(await surface.locator('#submit-wish').isVisible());
  assert.equal(await radio.evaluate(() => innerHeight),initialHeight,'Overlay erhält die bereits gemessene natürliche Radiohöhe');
  await page.locator('#width').fill('2290'); await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(() => innerWidth === 2290);
  assert.equal(await radio.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#inspect').click();
  assert.deepEqual(lab.errors, []);
});

test('Fehlende Overlayfähigkeit erhält die Radioleiste und erklärt die Ablehnung', async t => {
  const lab = await setup(t);await lab.join('Otterchen');const { page, radio } = await lab.join('Polaroid');
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
  await radio.waitForFunction(() => {const audio=document.querySelector('#radio-audio');return !audio.paused&&audio.currentTime>0&&!!audio.currentSrc;});
  assert.ok(await radio.locator('#radio-audio').evaluate(audio => audio.volume <= .3));
  assert.ok(await radio.locator('#radio-audio').evaluate(audio => new URL(audio.currentSrc).origin === location.origin));
  assert.deepEqual(lab.external, []); assert.deepEqual(lab.errors, []);
});
for (const scenario of ['stopped', 'http-error', 'invalid']) {
  test('Anbieterfall ' + scenario + ' verwechselt unbekannte Daten nicht mit bestätigtem Stopp', async t => {
    const lab = await setup(t, { provider: scenario }), { radio } = await lab.join();
    if (scenario === 'stopped') {
      await radio.locator('#stream-label').filter({ hasText: 'Sendepause' }).waitFor();
      assert.equal(await radio.locator('#play-button').isEnabled(), true);
      assert.equal(await radio.locator('#play-button').getAttribute('title'),'Radio abspielen');
      assert.match(await radio.locator('#stream-badge').getAttribute('aria-label'),/Sendepause/);
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
  const loaded = await radio.evaluate(() => Array.from(document.scripts).map(s =>
    new URL(s.src, document.baseURI).pathname.match(/\/(js\/.*\.js)$/)?.[1]).filter(Boolean));
  const uiRoot = path.join(process.env.MISCHWERK_TEST_UPLOAD || path.resolve(__dirname, '../../app'), 'www');
  const missing = loaded.find(file => fs.existsSync(path.join(uiRoot, file)) &&
    fs.readFileSync(path.join(uiRoot, file), 'utf8').includes("define('player'"));
  assert.ok(missing, 'Tatsächlich geladenes Bündel mit Playerkomponente gefunden');
  await send(page, { type: 'faults', value: { resourceFailure: missing } });
  await page.waitForFunction(file => window.EmulatorLab.state.faults.resourceFailure === file, missing);
  const originalFrame = await page.locator('#headerbars iframe').getAttribute('src');
  await page.locator('#join').click();await page.locator('#headerbars iframe').waitFor({state:'detached'});
  await page.locator('#join').click();
  await page.waitForFunction(original => document.querySelector('#headerbars iframe')?.getAttribute('src') !== original, originalFrame);
  const handle = await page.waitForSelector('#headerbars iframe[src]'); const failed = await handle.contentFrame();
  await failed.locator('#startup-error').waitFor({ state: 'visible', timeout: 20000 });
  assert.equal(await failed.evaluate(() => document.documentElement.classList.contains('mw-ready')), false);
  assert.ok(lab.hub.trace.some(item => item.kind === 'resourceFailure'));
});
























function assertAllowedOverlaySizes(lab) {
  const wishes=new Set(lab.hub.trace.filter(e=>e.kind==='contentShow'&&['wishes','studio'].includes(e.pageData?.view)).map(e=>e.sessionId));
  for(const event of lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&['setSize','setMinSize','setMaxSize','setResizable'].includes(e.method))){
    assert.equal(event.method,'setSize');assert.equal(wishes.has(event.sessionId),true,'Größenanpassung ausschließlich in Wunschbestätigung oder kompakter Moderation');assert.ok(event.width>0&&event.height>0);
  }
}

for(const client of ['k3','stapp'])for(const width of [320,390,2290])test('Wunschbestätigung passt in '+client+' bei '+width+' px ohne Scrollen vollständig in denselben nativen Rahmen',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,width);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__wishFitAudio=document.getElementById('radio-audio');__wishFitAudio.loop=true;});
  await page.setViewportSize({width:1800,height:1800});
  await radio.locator('#open-wishes:not([disabled])').click();let frame=await overlayView(page,'wishes');
  const source=await page.locator('#overlays iframe').getAttribute('src');
  await fits();assert.equal(await frame.evaluate(()=>innerHeight),await frame.locator('#wishes-panel').evaluate(n=>Math.ceil(n.getBoundingClientRect().height)),'Natürliche Höhe statt abgeschnittenem Formular');
  async function fits(){
    await frame.waitForFunction(()=>{const p=document.getElementById('wishes-panel').getBoundingClientRect(),b=document.getElementById(document.getElementById('wish-form').hidden?'wish-compose-open':'submit-wish').getBoundingClientRect();return Math.abs(Math.ceil(p.height)-innerHeight)<=1&&b.top>=0&&b.bottom<=innerHeight+1&&document.body.scrollHeight<=document.body.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1;},null,{timeout:5000});
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  for(const text of ['Aha - Take On Me',('Interpret und ein vollständiger langer Songtitel. ').repeat(7).slice(0,300)]){
    if(await frame.locator('#wish-compose-open').isVisible())await frame.locator('#wish-compose-open').click();
    await frame.locator('#wish-text:not([disabled])').fill(text);await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.success').filter({hasText:'Dein Wunsch ist dabei!',exact:true}).waitFor();await frame.locator('#wish-compose-open').waitFor();await fits();
    assert.equal(await page.locator('#overlays iframe').getAttribute('src'),source,'Kein Ersetzen oder erneutes Öffnen nach dem Absenden');
  }
  assert.equal(await frame.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
  await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor({state:width<1200?'attached':'visible'});
  assert.equal(await radio.locator('#own-wish-position').isVisible(),width>=1200,'Eigene Wunschplatzierung bleibt nur im breiten Deck sichtbar');
  assert.equal(await radio.locator('#own-wish-title').textContent(),'Aha - Take On Me');
  if(process.env.MISCHWERK_CAPTURE_WISH196&&client==='stapp'&&[320,2290].includes(width)){
    await frame.locator('#wish-feedback').waitFor({state:'hidden'});await fits();
    await frame.locator('#wishes-panel').screenshot({path:path.resolve(__dirname,'../../../docs/pruefung/oberflaeche/wunschbox/wunschbox-nach-versand-'+(width===320?320:560)+'.png')});
  }
  await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  await frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await fits();
  const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  await frame.waitForTimeout(800);assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count,'Unveränderter Inhalt erzeugt keine weiteren Größenaufträge');
  await frame.locator('#wish-compose-open').click();await frame.locator('#wish-text:not([disabled])').fill('Mein weiterer Entwurf');await fits();
  await frame.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#open-wishes:not([disabled])').click();frame=await overlayView(page,'wishes');await fits();assert.equal(await frame.locator('#wish-text').inputValue(),'Mein weiterer Entwurf');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__wishFitAudio&&!window.__wishFitAudio.paused),true);
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const constraint of ['ignored','clamped'])test('Wunschhöhe bleibt bei '+constraint+' im '+client+' ohne Größenwiederholung vollständig erreichbar',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:constraint==='ignored'?'ignored':'normal'}),{page,radio}=await lab.join('Otterchen',client,320);
  if(constraint==='clamped')await page.setViewportSize({width:1800,height:550});
  await radio.locator('#open-wishes:not([disabled])').click();const frame=await overlayView(page,'wishes');
  await frame.locator('#wish-text:not([disabled])').fill(('Ein vollständiger langer Wunsch ohne Kürzung. ').repeat(8).slice(0,300));await frame.locator('#submit-wish').click();await frame.locator('#wish-compose-open').waitFor();
  await frame.locator('#wish-compose-open').scrollIntoViewIfNeeded();assert.equal(await frame.locator('#wish-compose-open').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight+1),true);
  await frame.waitForTimeout(500);const count=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;assert.ok(count>0);
  await frame.waitForTimeout(1200);assert.equal(lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length,count);
  await frame.locator('#wish-compose-open').click();await frame.locator('#wish-text:not([disabled])').fill(('Erhaltener langer weiterer Entwurf. ').repeat(9).slice(0,300));await frame.locator('#submit-wish').scrollIntoViewIfNeeded();assert.equal(await frame.locator('#wish-text').inputValue(),('Erhaltener langer weiterer Entwurf. ').repeat(9).slice(0,300));
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Radio ist in '+client+' ohne Vorhang und Werbung direkt nutzbar',async t=>{
 const lab=await setup(t,{provider:'online'}),requests=[];lab.context.on('request',request=>requests.push(request.url()));
 const {page,radio}=await lab.join('DJ-Test',client,1280,false);
 await radio.locator('#play-button:not([disabled])').waitFor();assert.equal(await radio.locator('#radio-panel').isVisible(),true);
 assert.equal(await radio.locator('#radio-curtain,#curtain-audio,.curtain-drape').count(),0);assert.equal(await radio.locator('audio').count(),1);
 assert.equal(await radio.locator('#radio-audio').getAttribute('src'),null);
 await radio.locator('#play-button').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__directRadioAudio=document.getElementById('radio-audio');});
 assert.equal(await radio.locator('#open-wishes').isDisabled(),false);await lab.join('Otterchen',client,1280);
 await radio.locator('#open-wishes:not([disabled])').click();const wishes=await overlayView(page,'wishes');
 await wishes.locator('#wish-text').fill('Mein erreichbarer Wunsch');await wishes.locator('#close-wishes').click();
 await page.locator('#overlays iframe').waitFor({state:'detached'});
 assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
 assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__directRadioAudio&&!__directRadioAudio.paused),true);
 assert.equal(requests.some(url=>/curtain|werbung\.mp3/.test(url)),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Wunschrelay in '+client+' bündelt gleichzeitiges Tippen dreier Nutzer unter dem beobachteten Eventbudget und erhält Schlusszeichen',async t=>{
 const lab=await setup(t,{provider:'online'}),records=[],log=lab.hub.log.bind(lab.hub);
 lab.hub.log=(kind,data)=>{const item=log(kind,data);records.push(item);return item;};
 const users=[];users.push({...await lab.join('Otterchen',client,1360),nick:'Otterchen'});

 for(const nick of ['Polaroid','DJ-Test'])users.push({...await lab.join(nick,client,1360),nick});
 for(const item of users){await item.radio.locator('#open-wishes:not([disabled])').click();item.surface=await overlayView(item.page,'wishes');await item.surface.locator('#wish-fields:not([disabled])').waitFor();item.text='Wunsch '+item.nick+' – abcdefghijklmnopqrstuvwxyz 1234567890 Schlusszeichen';}
 await users[0].radio.evaluate(()=>{window.__relayAudio=document.getElementById('radio-audio');__relayAudio.loop=true;});await users[0].radio.locator('#play-button:not([disabled])').click();await users[0].radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 const begin=records.length;
 await Promise.all(users.map(item=>item.surface.locator('#wish-text').pressSequentially(item.text,{delay:25})));
 // Ohne Wartezeit schließen: der noch gebündelte Rest muss vorher übernommen werden.
 await Promise.all(users.map(async item=>{await item.surface.locator('#close-wishes').click();await item.page.locator('#overlays iframe').waitFor({state:'detached'});await item.radio.locator('#open-wishes:not([disabled])').click();item.surface=await overlayView(item.page,'wishes');assert.equal(await item.surface.locator('#wish-text').inputValue(),item.text);}));
 await Promise.all(users.map(async item=>{await item.surface.locator('#submit-wish:not([disabled])').click();await item.surface.locator('#wish-feedback.success').filter({hasText:'Dein Wunsch ist dabei!',exact:true}).waitFor();await item.radio.locator('#own-wish-title').filter({hasText:item.text}).waitFor();}));
 const sent=records.slice(begin).filter(e=>e.kind==='sessionEvent'),peaks={};
 for(const item of users){const messages=sent.filter(e=>e.nick===item.nick).sort((a,b)=>a.realAt-b.realAt);let start=0,peak=0;for(let end=0;end<messages.length;end++){while(messages[end].realAt-messages[start].realAt>=5000)start++;peak=Math.max(peak,end-start+1);}peaks[item.nick]=peak;assert.ok(peak<=40,JSON.stringify({client,peaks}));const submissions=records.slice(begin).filter(e=>e.kind==='clientEvent'&&e.nick===item.nick&&e.eventType==='mw:wish.submit');assert.equal(submissions.length,1);assert.equal(submissions[0].eventData.text,item.text);const state=records.findLast(e=>e.kind==='sessionEvent'&&e.nick===item.nick&&e.eventType==='mw:state').eventData;assert.equal(state.wishPositions.total,1);assert.equal(state.wishPositions.nextItem.text,item.text);}
 assert.equal(await users[0].radio.evaluate(()=>document.getElementById('radio-audio')===window.__relayAudio&&!__relayAudio.paused),true);
 for(const item of users)lab.hub.runtime.leave(item.nick);
 assert.equal(records.filter(e=>e.kind==='sessionRemoveRepeated').length,0,'Keine doppelten nativen Schließaufträge beim Verlassen mit offenen Wunschfenstern');
 console.log('Eventbudget '+client+': '+JSON.stringify(peaks)+' Serverevents je Nutzer im stärksten 5-s-Fenster bei drei gleichzeitigen Schreibern');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])test('Verbindung im Admin-Reiter erhält in '+client+' Firebase, Einstellungen, Schlüssel und Radio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1400});
  const runtime=lab.hub.runtime,key='mischwerk.android.private.v1',calls=lab.posts;runtime.clock.stop();
  const baseline=calls.length;
  const saved=JSON.stringify(runtime.persistence.api().getObject(key));
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__settingsAudio=document.getElementById('radio-audio');});
  for(const option of ['', 'hilfe', 'einrichten', 'status', 'pruefen', 'http-pruefen', 'auth-pruefen']){
    await page.locator('#chat-input').fill('/mw verbindung '+option);await page.locator('#chat-form button').click();
  }
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#chat p')).filter(n=>n.textContent.includes('Diesen Aufruf gibt es nicht.')).length===7);
  assert.equal(await page.locator('#overlays iframe').count(),0);
  assert.equal(JSON.stringify(runtime.persistence.api().getObject(key)),saved);assert.equal(calls.length,baseline);
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await overlayView(page,'team');
  assert.equal(await team.locator('#team-connection-tab').count(),1);
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
    await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
    assert.equal(await team.locator('#relay-save').isDisabled(),true);assert.equal(await team.locator('#relay-sync').inputValue(),'');
    assert.ok(await team.locator('.connection-content').evaluate(n=>n.scrollHeight<=n.clientHeight+1));
    assert.ok(await team.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1));
    for(const selector of ['#relay-activate','#relay-deactivate','#relay-refresh','#close-overlay'])assert.ok(await team.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight;}),selector);
    if(process.env.MISCHWERK_CONNECTION_CAPTURE&&client==='k3')await team.waitForTimeout(180);
    if(process.env.MISCHWERK_CONNECTION_CAPTURE&&client==='k3')await page.locator('#overlays iframe').screenshot({path:path.resolve('../docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-'+width+'.png')});
    await team.locator('.connection-secret:has(#relay-form) summary').click();await team.locator('#relay-sync').fill('x'.repeat(64));await team.waitForTimeout(30);
    assert.equal(await team.locator('#relay-sync').inputValue(),'x'.repeat(64));assert.equal(await team.locator('#relay-save').isEnabled(),true);
    await team.locator('#team-texts-tab').click();assert.equal(await team.locator('#relay-sync').inputValue(),'');
    await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
    await team.locator('.connection-secret:has(#relay-form) summary').click();
  }
  await team.locator('#relay-refresh').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
  await team.locator('.connection-secret:has(#relay-form) summary').click();await team.locator('#relay-sync').fill('x'.repeat(64));
  await team.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#team-connection-tab').getAttribute('aria-selected'),'true');await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
  assert.equal(await team.locator('#relay-sync').inputValue(),'');
  assert.doesNotMatch(JSON.stringify(lab.hub.trace.filter(e=>e.eventType&&e.eventType.startsWith('mw:overlay.'))),/xxxxxxxx/);
  assert.equal(JSON.stringify(runtime.persistence.api().getObject(key)),saved);assert.equal(calls.length,baseline);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__settingsAudio&&!__settingsAudio.paused),true);
  assert.doesNotMatch(await team.locator('body').innerText(),/ssssssss|rrrrrrrr/);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Neue Verbindungseinstellungen speichern und schalten nur nach ausdrücklicher Aktion',async t=>{
  const lab=await setup(t,{connectionDisabled:true}),{page,radio}=await lab.join('Otterchen','k3'),runtime=lab.hub.runtime,key='mischwerk.android.private.v1',calls=[];
  runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,postURL:(url,p)=>{calls.push(url);p.onSuccess(JSON.stringify({accepted:true,serverTime:runtime.clock.now(),wishes:[]}),{getResponseCode:()=>200,getURLString:()=>url});}});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'ausgeschaltet'}).waitFor();
  await team.locator('.connection-secret:has(#relay-form) summary').click();await team.locator('#relay-sync').fill('n'.repeat(64));await team.waitForTimeout(50);
  assert.equal(await team.locator('#relay-sync').inputValue(),'n'.repeat(64));await team.locator('#relay-save').click();
  await team.locator('#relay-result').filter({hasText:'Einstellungen gespeichert'}).waitFor();
  const stored=runtime.persistence.api().getObject(key);assert.equal(stored.syncSecret,'n'.repeat(64));assert.equal(stored.relaySecret,'r'.repeat(64));assert.equal(stored.enabled,false);assert.equal(stored.revision,1);assert.equal(calls.length,0);
  assert.equal(await team.locator('#relay-sync').inputValue(),'');assert.equal(await team.locator('#relay-save').isDisabled(),true);
  await team.locator('#relay-activate').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();assert.equal(calls.length,1);
  await team.locator('#relay-deactivate').click();await team.locator('#relay-status').filter({hasText:'ausgeschaltet'}).waitFor();assert.equal(runtime.persistence.api().getObject(key).enabled,false);assert.equal(calls.length,1);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Einheitliche /mw-Hilfe in '+client+' erhält die dauerhaft geöffnete App und laufendes Radio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,2290);
  assert.deepEqual(Object.keys(lab.hub.runtime.app.chatCommands).sort(),['mw','settopic','update']);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__mwAudio=document.getElementById('radio-audio');});
  const header=await page.locator('#headerbars iframe').getAttribute('src');
  for(const value of ['/mw','/mw homepage hilfe','/mw verbindung hilfe','/mw radio']) {
    await page.locator('#chat-input').fill(value);await page.locator('#chat-form button').click();
  }
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#chat p')).filter(n=>n.textContent.includes('Diesen Aufruf gibt es nicht.')).length===3);
  assert.ok(await page.locator('#chat').textContent().then(s=>s.includes('/mw admin')&&!s.includes('/mw verbindung status')));
  assert.equal(await page.locator('#overlays iframe').count(),0);assert.equal(await page.locator('#headerbars iframe').getAttribute('src'),header);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__mwAudio&&!__mwAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});








for(const client of ['k3','stapp'])test('Dateiprüfung vor /update sperrt unvollständigen Stand und erhält laufendes Radio in '+client,async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,2290);
  const runtime=lab.hub.runtime,server=runtime.context.KnuddelsServer,root=server.getAppAccess().getOwnInstance().getRootInstance();
  let missing=true,first=true,queued=0;
  const nativeList=server.listFiles;
  server.listFiles=folder=>nativeList(folder).filter(name=>!(missing&&folder==='server/users'&&name==='nicklist-storage.js'));
  root.updateAppFiles=()=>{if(!first)return [];first=false;return ['server/app.js'];};
  root.updateApp=()=>{queued++;return 30;};
  await radio.locator('#play-button').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__guardAudio=document.getElementById('radio-audio');__guardAudio.loop=true;});
  const modules=runtime.context.MischWerkModules,configuration=runtime.context.MischWerkConfig;
  const saved=JSON.stringify(runtime.persistence.data),header=await page.locator('#headerbars iframe').getAttribute('src');
  await page.locator('#chat-input').fill('/update');await page.locator('#chat-form button').click();
  await page.locator('#chat p').filter({hasText:'Es fehlen: server/users/nicklist-storage.js'}).waitFor();
  assert.equal(queued,0);assert.equal(runtime.context.MischWerkModules,modules);assert.equal(runtime.context.MischWerkConfig,configuration);
  assert.equal(JSON.stringify(runtime.persistence.data),saved);assert.equal(await page.locator('#headerbars iframe').getAttribute('src'),header);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__guardAudio&&!__guardAudio.paused),true);
  missing=false;await page.locator('#chat-input').fill('/update');await page.locator('#chat-form button').click();
  await page.locator('#chat p').filter({hasText:'Update vorgemerkt.'}).waitFor();assert.equal(queued,1);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__guardAudio&&!__guardAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Firebase-Empfang ist für alle Rollen alleinige Sendungsquelle; 45 Sekunden bleiben unabhängig von Radioaudio in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1280),dj=await lab.join('DJ-Test',client,320),guest=await lab.join('Polaroid',client,1280);
 for(const person of [owner,dj,guest]){assert.equal(await person.radio.locator('#studio-tab,#team-tab').count(),0);await person.radio.locator('#host-name').filter({hasText:'DJ-Test',exact:true}).waitFor();}
 assert.equal(lab.hub.runtime.users.find('Otterchen').state.nicklistIcons.some(i=>i.path.endsWith('/team.png')),false);
 if(process.env.MISCHWERK_V2_CAPTURE&&client==='k3')await guest.page.setViewportSize({width:2700,height:1700});
 if(process.env.MISCHWERK_V2_CAPTURE&&client==='k3')for(const [width,name] of [[2290,'breit'],[800,'mittel'],[320,'schmal']]){
  await guest.page.locator('#width').fill(String(width));await guest.page.locator('#width').dispatchEvent('change');await guest.radio.waitForFunction(w=>innerWidth===w,width);await guest.radio.evaluate(()=>document.fonts.ready);await guest.page.waitForTimeout(150);
  await guest.page.locator('#headerbars iframe').screenshot({path:path.resolve(__dirname,'../../../docs/pruefung/oberflaeche/radio/radio-harmonie-'+name+'.png')});
 }

 await guest.radio.locator('#play-button').click();await guest.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);await guest.radio.evaluate(()=>{window.__centralAudio=document.getElementById('radio-audio');__centralAudio.loop=true;});
 await owner.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(owner.page,'team');
 assert.equal(await team.locator('#radio-moderator-nick,[data-confirm-removal]').count(),0);assert.match(await team.locator('#radio-moderator-list').textContent(),/DJ-Test/);
 await team.locator('#team-signs-enabled').uncheck();await team.locator('#display-save').click();await team.locator('#display-feedback').filter({hasText:'gespeichert'}).waitFor();
 assert.equal(lab.hub.runtime.users.find('DJ-Test').state.nicklistIcons.some(i=>i.path.endsWith('/moderator.png')),true);
 for(const width of [500,320]){await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');await team.waitForFunction(w=>innerWidth===w,width);await team.locator('#ticker-text').fill('Grüße aus dem Studio');await team.locator('#ticker-enabled').check();await team.locator('#ticker-speed').selectOption('72');assert.equal(await team.locator('#ticker-font').inputValue(),width===500?'petit-formal-script':'josefin-sans');await team.locator('#ticker-font').selectOption('josefin-sans');await team.locator('#ticker-save').scrollIntoViewIfNeeded();await team.locator('#ticker-save').click();await team.locator('#ticker-feedback').filter({hasText:'gespeichert'}).waitFor();assert.equal(await team.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(process.env.MISCHWERK_V2_CAPTURE&&client==='k3'){
  await team.locator('#team-members-tab').click();await team.locator('#team-members').evaluate(n=>n.scrollTop=0);await team.waitForTimeout(100);
  await owner.page.locator('#overlays iframe').screenshot({path:path.resolve(__dirname,'../../../docs/pruefung/oberflaeche/verwaltung/verwaltung-'+(width===500?560:320)+'.png')});
  await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv'}).waitFor();await owner.page.locator('#overlays iframe').screenshot({path:path.resolve(__dirname,'../../../docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-'+(width===500?560:320)+'.png')});await team.locator('#team-members-tab').click();
 }}
 await guest.radio.locator('#radio-ticker[data-font=josefin-sans]').waitFor();
 await team.locator('#ticker-text').fill('Entwurf bleibt erhalten');await team.locator('#ticker-font').selectOption('rajdhani');await team.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});await owner.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const restored=await overlayView(owner.page,'team');assert.equal(await restored.locator('#ticker-text').inputValue(),'Entwurf bleibt erhalten');assert.equal(await restored.locator('#ticker-font').inputValue(),'rajdhani');
 lab.central.accept=false;lab.hub.runtime.clock.advance(45001);await guest.radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));await guest.radio.locator('#open-wishes').waitFor({state:'hidden'});assert.doesNotMatch(await guest.radio.locator('#host-name').textContent(),/DJ-Test/);
 assert.equal(await guest.radio.evaluate(()=>document.getElementById('radio-audio')===__centralAudio&&!__centralAudio.paused),true);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.hub.runtime.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Polaroids Verwaltung trennt Icons, Verbindung und Inhaberbefehle in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),person=await lab.join('Polaroid',client,500),dj=await lab.join('DJ-Test',client,500);
 assert.notEqual(lab.hub.runtime.users.find('Polaroid').state.role,'owner');
 await person.radio.locator('#play-button').click();await person.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
 await person.radio.evaluate(()=>{window.__consoleAudio=document.getElementById('radio-audio');__consoleAudio.loop=true;Client.executeSlashCommand('/mw admin');});
 const team=await overlayView(person.page,'team');
 for(const id of ['team-signs-enabled','microphone-enabled','headphones-enabled'])assert.equal(await team.locator('#'+id).isChecked(),true);
 const icons=nick=>lab.hub.runtime.users.find(nick).state.nicklistIcons.map(row=>row.path.split('/').at(-1));
 await team.locator('#microphone-enabled').uncheck();await team.locator('#display-save').click();await assertEventually(()=>!icons('DJ-Test').includes('moderator.png'));
 assert.ok(icons('DJ-Test').includes('team.png'));assert.equal(await team.locator('#headphones-enabled').isChecked(),true);
 await assertEventually(()=>icons('Polaroid').includes('listener.png'));
 await team.locator('#headphones-enabled').uncheck();await team.locator('#display-save:not([disabled])').click();await assertEventually(()=>!icons('Polaroid').includes('listener.png'));
 await team.locator('#team-signs-enabled').uncheck();await team.locator('#display-save:not([disabled])').click();await assertEventually(()=>!icons('DJ-Test').includes('team.png'));
 await person.page.locator('#width').fill('320');await person.page.locator('#width').dispatchEvent('change');await team.waitForFunction(()=>innerWidth===320);
 assert.equal(await team.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv – Daten'}).waitFor();
 lab.central.failure={status:400,raw:'Geheime Antwort und privater Wunsch'};lab.hub.runtime.clock.advance(10000);
 await person.page.waitForTimeout(100);await team.locator('#relay-refresh').click();await team.locator('#relay-failure').filter({hasText:'HTTP 400'}).waitFor();
 assert.doesNotMatch(await team.locator('#team-connection-panel').textContent(),/Geheime Antwort|privater Wunsch/);
 lab.central.failure=null;lab.hub.runtime.clock.advance(20000);await person.page.waitForTimeout(100);await team.locator('#relay-refresh').click();await team.locator('#relay-status').filter({hasText:'Aktiv – Daten'}).waitFor();assert.equal(await team.locator('#relay-failure').textContent(),'');
 await team.locator('.connection-secret summary').filter({hasText:'Schlüssel verwalten'}).click();await team.locator('#relay-sync').fill('s'.repeat(64));await team.locator('#relay-save').click();await team.locator('#relay-status').filter({hasText:'ausgeschaltet'}).waitFor();assert.equal(await team.locator('#relay-sync').inputValue(),'');
 await team.locator('#relay-activate').click();
 await team.locator('#relay-status').filter({hasText:'Übertragung noch nicht bestätigt'}).waitFor();
 lab.hub.runtime.clock.advance(10000);await person.page.waitForTimeout(100);
 await team.locator('#relay-refresh').click();await team.locator('#relay-status').filter({hasText:'Aktiv – Daten'}).waitFor();
 const topic=lab.hub.runtime.channelTopic;await person.radio.evaluate(()=>Client.executeSlashCommand('/settopic Unerlaubtes Thema'));await person.page.locator('#chat p').filter({hasText:'Nur Otterchen'}).waitFor();assert.equal(lab.hub.runtime.channelTopic,topic);
 await person.radio.evaluate(()=>Client.executeSlashCommand('/update'));assert.equal(lab.hub.trace.filter(row=>row.kind==='update').length,0);
 assert.equal(await person.radio.evaluate(()=>document.getElementById('radio-audio')===__consoleAudio&&!__consoleAudio.paused),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.hub.runtime.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Statusaktualisierung und unbekannte Freigaben bleiben beim Lesen unverändert in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),person=await lab.join('Polaroid',client,500);
 await person.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(person.page,'team');
 await team.locator('#radio-moderator-count').filter({hasText:'1',exact:true}).waitFor();
 await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv – Daten'}).waitFor();
 const before=JSON.stringify(lab.hub.runtime.persistence.data),posts=lab.posts.length;await team.locator('#relay-refresh').click();
 await team.locator('#relay-status').filter({hasText:'Aktiv – Daten'}).waitFor();
 assert.equal(JSON.stringify(lab.hub.runtime.persistence.data),before);assert.equal(lab.posts.length,posts);
 await person.page.locator('#width').fill('320');await person.page.locator('#width').dispatchEvent('change');await team.waitForFunction(()=>innerWidth===320);
 assert.equal(await team.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 lab.central.roster=[];lab.hub.runtime.clock.advance(10000);await person.page.waitForTimeout(100);await team.locator('#team-members-tab').click();await team.evaluate(()=>Client.sendEvent('mw:refresh',{}));
 await team.locator('#radio-moderator-count').filter({hasText:'0',exact:true}).waitFor();await team.locator('#radio-moderator-list').filter({hasText:'Keine freigegebenen Nicks.'}).waitFor();
 lab.central.accept=false;lab.hub.runtime.clock.advance(45001);await team.evaluate(()=>Client.sendEvent('mw:refresh',{}));
 await team.locator('#radio-moderator-count').filter({hasText:'?',exact:true}).waitFor();await team.locator('#radio-moderator-list').filter({hasText:'nicht bestätigt'}).waitFor();
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.hub.runtime.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Eigene Outbox bleibt bis zentraler Einzelquittung offen und verrät keine fremden Wünsche in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),guest=await lab.join('Polaroid',client,320);await guest.radio.locator('#open-wishes').click();const surface=await overlayView(guest.page,'wishes');lab.central.accept=false;
 await surface.locator('#wish-text').fill('Für Änne 🎶');await surface.locator('#submit-wish').click();await surface.locator('#wish-feedback').filter({hasText:'übertragen'}).waitFor();assert.equal(await surface.locator('#wish-text').inputValue(),'Für Änne 🎶');assert.equal(await surface.locator('#wish-tracking').count(),0);
 const entry=JSON.parse(JSON.stringify(lab.hub.runtime.persistence.data));assert.match(JSON.stringify(entry),/Für Änne/);lab.central.accept=true;lab.central.held.splice(0).forEach(fn=>fn());lab.hub.runtime.clock.advance(20000);await surface.locator('#wish-feedback.success').filter({hasText:'Dein Wunsch ist dabei!',exact:true}).waitFor();assert.equal(await surface.locator('#wish-text').inputValue(),'');assert.equal(lab.posts.filter(p=>p.wishSubmissions.length).length>=1,true);assert.equal(await surface.locator('#wish-tracking').count(),0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

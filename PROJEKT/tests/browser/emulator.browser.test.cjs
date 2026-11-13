const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { createEmulator } = require('../../tools/emulator/server.cjs');
const {reveal:revealStudio}=require('../support/studio-browser.cjs');
const studioPictures=path.join(require('node:os').tmpdir(),'MischWerk-Pruefbilder','moderation-neu');fs.mkdirSync(studioPictures,{recursive:true});
let browser;

for(const client of ['k3','stapp'])test('Fernregie verändert dieselbe native Wunschliste und erhält Radioaudio in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,640),listener=await lab.join('Polaroid',client,640);
 await owner.radio.locator('#play-button').click();await owner.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
 await owner.radio.evaluate(()=>{window.__controlAudio=document.getElementById('radio-audio');__controlAudio.loop=true;});
 await listener.radio.evaluate(()=>{
  window.__remoteWishAccepted=false;
  Client.addEventListener('mw:wish.receipt',event=>{if(event.data.submissionId==='remote-browser')window.__remoteWishAccepted=event.data.accepted;});
  Client.sendEvent('mw:wish.submit',{submissionId:'remote-browser',text:'Queen – Radio Ga Ga'});
 });
 await listener.radio.waitForFunction(()=>window.__remoteWishAccepted===true);
 const runtime=lab.hub.runtime,bodies=[];let pending=null,sequence=0;
 runtime.persistence.api().setObject('mischwerk.android.private.v1',{enabled:true,runtimeVerified:true,syncSecret:'s'.repeat(64),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState'});
 runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,postURL:(url,p)=>{
  const body=JSON.parse(p.data.payload);bodies.push(body);const command=pending;pending=null;
  p.onSuccess(JSON.stringify({accepted:true,serverTime:runtime.clock.now(),wishes:[],...(command?{studioWishCommands:[command]}:{})}),
   {getResponseCode:()=>200,getURLString:()=>url});
 }});
 runtime.invokeFunction(runtime.app.onAppStart,[]);
 const exported=bodies.flatMap(body=>body.studioWishUpdates||[]).find(row=>row.text==='Queen – Radio Ga Ga');
 assert.ok(exported);assert.equal(bodies.at(-1).studioWishControl.nick,'Otterchen');
 function act(action,state){
  const source=bodies.findLast(body=>body.studioWishUpdates?.some(row=>row.submissionId===exported.submissionId&&row.state===state));
  assert.ok(source,'Tatsächlich exportierter Einzelwunschstand');
  const id=(++sequence).toString(16).padStart(64,'0');pending={commandId:id,submissionId:exported.submissionId,action,
   expectedState:state,expectedPosition:1,expectedSourceUpdatedAt:source.station.updatedAt,beforeSubmissionId:null,
   sessionId:bodies.at(-1).studioWishControl.sessionId,expiresAt:runtime.clock.now()+120000};
  const count=bodies.length;runtime.clock.advance(5000);assert.equal(bodies.length,count+1,'Keine rekursive Quittung');
  runtime.clock.advance(5000);
  const result=bodies.findLast(body=>body.studioWishResults.some(row=>row.commandId===id));
  assert.equal(result?.studioWishResults[0].state,'applied');return result;
 }
 assert.equal(act('accept','queued').studioWishUpdates[0].state,'received');
 await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio');
 await studio.locator('#studio-queue-tab').click();await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===1);
 assert.deepEqual(await studio.locator('.request-text').allTextContents(),['Queen – Radio Ga Ga']);
 assert.equal(await studio.locator('.queue-item button').count(),0,'Bestehendes natives Menü erhält keine neuen Regieknöpfe');
 assert.equal(act('prepare','received').studioWishUpdates[0].state,'preparing');
 assert.equal(act('playing','preparing').studioWishUpdates[0].state,'playing');
 const done=act('done','playing');assert.deepEqual(done.studioWishUpdates[0],{submissionId:exported.submissionId,state:'done',position:null});
 await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===0);
 assert.equal(await owner.radio.evaluate(()=>document.getElementById('radio-audio')===__controlAudio&&!__controlAudio.paused),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Gemeinsame Wunschweiterleitung erhält Namen Herkunft und private Reihenfolge in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,640),listener=await lab.join('Polaroid',client,640);
 await listener.radio.evaluate(()=>Client.sendEvent('mw:wish.submit',{submissionId:'metadata-native',text:'Nativer Wunsch'}));
 await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio');
 await studio.locator('#studio-queue-tab').click();await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===1);
 const runtime=lab.hub.runtime,key='mischwerk.android.private.v1',bodies=[];
 let incoming=[{submissionId:'metadata-web',text:'Wunsch aus Web',displayName:'Web <img src=x onerror=evil>',origin:'web'},
  {submissionId:'metadata-app',text:'Wunsch aus Android',displayName:'Appname',origin:'android'},
  {submissionId:'metadata-legacy',text:'Wunsch ohne Herkunft',displayName:'Altname'}];
 runtime.persistence.api().setObject(key,{enabled:true,runtimeVerified:true,syncSecret:'s'.repeat(64),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState'});
 runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,postURL:(url,p)=>{
  bodies.push(JSON.parse(p.data.payload));const wishes=incoming;incoming=[];
  p.onSuccess(JSON.stringify({accepted:true,serverTime:runtime.clock.now(),wishes}),{getResponseCode:()=>200,getURLString:()=>url});
 }});
 runtime.invokeFunction(runtime.app.onAppStart,[]);
 await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===4);
 assert.deepEqual(await studio.locator('.request-text').allTextContents(),['Nativer Wunsch','Wunsch aus Web','Wunsch aus Android','Wunsch ohne Herkunft']);
 assert.deepEqual(await studio.locator('.request-sender').allTextContents(),['Polaroid','Web <img src=x onerror=evil> · Web','Appname · Android','Altname · Extern']);
 assert.equal(await studio.locator('.request-sender img').count(),0,'Anzeigenamen bleiben wörtlicher Text');
 assert.ok(bodies.every(b=>b.wishMetadataVersion===1));
 assert.ok(bodies.some(b=>b.studioWishUpdates?.some(r=>r.text==='Nativer Wunsch'&&r.displayName==='Polaroid'&&r.origin==='knuddels'&&r.position===1)));
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','wunschweiterleitung');fs.mkdirSync(folder,{recursive:true});
 for(const width of [640,320,900]){
  await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');
  await require('../support/studio-browser.cjs').settle(studio);
  assert.deepEqual((await require('../support/layout-browser.cjs').inspectLayout(studio)).issues,[]);
  if(width!==900)await owner.page.locator('#overlays iframe').screenshot({path:path.join(folder,'wuensche-'+client+'-'+width+'.png')});
 }
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp','android'])test('Scrollbare Wunschliste zeigt Nick Uhrzeit und Goldtext ohne Seiteneinteilung in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,640);
 await radio.locator('#play-button').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__listAudio=document.getElementById('radio-audio');__listAudio.loop=true;});
 const texts=['a-ha – Take On Me','Queen – Radio Ga Ga','Depeche Mode – Enjoy the Silence',('Ein langer Wunsch mit Grüßen für alle im Channel. ').repeat(7).slice(0,300).trim()];
 for(let i=0;i<23;i++)await radio.evaluate(({text,id})=>Client.sendEvent('mw:wish.submit',{text,submissionId:'scroll-ui-'+id}),{text:texts[i%texts.length],id:i});
 await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
 assert.equal(await studio.locator('#studio-queue-tab').isDisabled(),false);
 await studio.locator('#studio-queue-tab').click();await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===23);
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','wuensche-liste');fs.mkdirSync(folder,{recursive:true});
 const captured=new Set();
 for(const width of [640,390,320,1280,3840,640]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
  await studio.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const geometry=await studio.evaluate(()=>{
   const body=document.getElementById('queue-body'),text=document.querySelector('.request-text'),meta=document.querySelector('.queue-meta');
   return {width:innerWidth,bodyWidth:body.clientWidth,over:document.documentElement.scrollWidth>innerWidth+1,scroll:getComputedStyle(body).overflowY,
    color:getComputedStyle(text).color,clamp:getComputedStyle(text).webkitLineClamp,meta:meta.textContent,nav:document.querySelectorAll('#studio-requests nav').length,
    actions:document.querySelectorAll('.queue-item button').length,font:getComputedStyle(text).fontFamily};
  });
  assert.equal(geometry.over,false,JSON.stringify(geometry));assert.equal(geometry.scroll,'auto');assert.equal(geometry.color,'rgb(230, 199, 123)');
  assert.equal(geometry.nav,0);assert.equal(geometry.actions,0);assert.match(geometry.meta,/Otterchen.*\d{2}:\d{2} Uhr/);assert.match(geometry.font,/Outfit/);
  assert.equal(await studio.locator('.queue-item').nth(3).locator('.request-text').textContent(),texts[3]);
  assert.equal(await studio.locator('.queue-item').nth(3).locator('.request-text').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
  assert.equal(await studio.locator('#queue-body').evaluate(n=>n.scrollHeight>n.clientHeight),true);
  if([640,320].includes(width)&&!captured.has(width)){
   await studio.locator('#queue-body').evaluate(n=>{n.scrollTop=0;});
   await page.locator('#overlays iframe').screenshot({path:path.join(folder,'liste-oben-'+client+'-'+width+'.png')});captured.add(width);
  }
  await studio.locator('#queue-body').focus();await studio.locator('#queue-body').press('Control+End');
  await studio.waitForFunction(()=>{const n=document.getElementById('queue-body');return n.scrollTop+n.clientHeight>=n.scrollHeight-1;});
  assert.equal(await studio.locator('.queue-item').last().locator('.request-text').textContent(),texts[22%texts.length]);
  if([640,320].includes(width))await page.locator('#overlays iframe').screenshot({path:path.join(folder,'liste-'+client+'-'+width+'.png')});
 }
 const scroll=await studio.locator('#queue-body').evaluate(n=>n.scrollTop);
 await studio.locator('#refresh-queue').click();await studio.locator('#queue-refresh-feedback').filter({hasText:'Aktualisiert'}).waitFor();
 assert.equal(await studio.locator('#queue-body').evaluate(n=>n.scrollTop),scroll);
 await radio.evaluate(()=>Client.sendEvent('mw:wish.submit',{text:'Neu am Ende der Liste',submissionId:'scroll-ui-latest'}));
 await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===24);
 assert.equal(await studio.locator('#queue-body').evaluate(n=>n.scrollTop),scroll);
 assert.equal(await studio.locator('.queue-item').last().locator('.request-text').textContent(),'Neu am Ende der Liste');
 await studio.locator('#studio-programme-tab').click();await studio.locator('#off-air').click();
 await studio.waitForFunction(()=>document.getElementById('request-queue').textContent==='');
 assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__listAudio&&!__listAudio.paused),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.hub.runtime.errors,[]);
});

for(const client of ['k3','stapp','android'])test('Wunschbox wird für Hörer erst nach Moderationsanmeldung sichtbar und erhält Entwurf und Audio in '+client,async t=>{
 const lab=await setup(t,{provider:'online',authenticationTest:true});
 const owner=await lab.join('Otterchen',client,1280,false),guest=await lab.join('Testhoerer',client,1280);
 const wish=guest.radio.locator('#open-wishes');
 await wish.waitFor({state:'hidden'});assert.equal(await owner.radio.locator('#open-wishes').isVisible(),false);
 await guest.radio.locator('#play-button').click();await guest.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await guest.radio.evaluate(()=>{window.__wishVisibilityAudio=document.getElementById('radio-audio');__wishVisibilityAudio.loop=true;});
 const pictures=path.join(__dirname,'../../docs/pruefung/oberflaeche/radio');
 if(client==='k3'&&!process.env.MISCHWERK_TEST_UPLOAD)await guest.radio.locator('#radio-panel').screenshot({path:path.join(pictures,'radio-wunschbox-autodj.png')});
 await owner.radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:true}));await owner.radio.locator('#open-wishes:not([disabled])').waitFor();
 assert.equal(await wish.isVisible(),false,'Persönliche Inhaberfreigabe öffnet Hörerzugriff nicht');
 await owner.radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:false}));await owner.radio.locator('#open-wishes').waitFor({state:'hidden'});
 await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio',false);
 assert.equal(await wish.isVisible(),false,'Das Öffnen des Menüs allein startet keine Live-Moderation');
 await studio.locator('#on-air').click();await studio.locator('#off-air').waitFor();await guest.radio.locator('#open-wishes:not([disabled])').waitFor();
 assert.equal(await wish.isVisible(),true);
 if(client==='k3'&&!process.env.MISCHWERK_TEST_UPLOAD)await guest.radio.locator('#radio-panel').screenshot({path:path.join(pictures,'radio-wunschbox-live.png')});
 await wish.click();let surface=await overlayView(guest.page,'wishes',false);await surface.locator('#wish-text').fill('Mein Entwurf für die Live-Sendung');
 await surface.locator('#close-wishes').click();await guest.page.locator('#overlays iframe').waitFor({state:'detached'});
 await owner.radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:false}));await wish.waitFor({state:'hidden'});
 await wish.evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));assert.equal(await guest.page.locator('#overlays iframe').count(),0);
 await owner.radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:true}));await guest.radio.locator('#open-wishes:not([disabled])').waitFor();
 await wish.click();surface=await overlayView(guest.page,'wishes',false);assert.equal(await surface.locator('#wish-text').inputValue(),'Mein Entwurf für die Live-Sendung');
 await surface.locator('#close-wishes').click();await guest.page.locator('#overlays iframe').waitFor({state:'detached'});
 await studio.locator('#off-air').click();await wish.waitFor({state:'hidden'});
 assert.equal(await guest.radio.evaluate(()=>document.getElementById('radio-audio')===__wishVisibilityAudio&&!__wishVisibilityAudio.paused),true);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.hub.runtime.errors,[]);
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

for(const [client,density] of [['k3',1],['stapp',1.25],['k3',1.5],['android',2]])test('Verkleinerte Appleiste hält Musik und Sendung im gemeinsamen Raster in '+client+' bei Pixeldichte '+density,async t=>{
 const lab=await setup(t,{provider:'online',authenticationTest:true},false,{deviceScaleFactor:density}),{page,radio}=await lab.join('Otterchen',client,900,false);
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio-fenster');fs.mkdirSync(folder,{recursive:true});
 const captureClient=client+(density===1?'':'-dpr-'+density),measurements=[];
 async function checkLines(targetPage,targetRadio,phase){
  await targetRadio.evaluate(()=>window.scrollTo(0,0));await require('../support/studio-browser.cjs').settle(targetRadio);
  const geometry=await targetRadio.evaluate(()=>{
   const music=document.querySelector('.now-playing'),brand=document.querySelector('.radio-brand'),line=getComputedStyle(document.getElementById('radio-panel'),'::after');
   return {width:innerWidth,music:music.getBoundingClientRect().toJSON(),brand:brand.getBoundingClientRect().toJSON(),
    logo:document.querySelector('.bar-logo').getBoundingClientRect().toJSON(),play:document.getElementById('play-button').getBoundingClientRect().toJSON(),
    logoHeight:parseFloat(line.height),logoDisplay:line.display,musicBorder:getComputedStyle(music).borderRightWidth};
  });
  if(geometry.width<=700){
   assert.equal(geometry.logoDisplay,'none');assert.equal(geometry.musicBorder,'0px','Beide Trenner entfallen gemeinsam in der gestapelten Ansicht');
   measurements.push({phase,width:geometry.width,hidden:true});return;
  }
  assert.ok(Math.abs(geometry.logoHeight-geometry.music.height)<=1,'Beide Linien besitzen dieselbe vollständige Informationshöhe: '+JSON.stringify(geometry));
  assert.ok(Math.abs((geometry.logo.top+geometry.logo.bottom-geometry.play.top-geometry.play.bottom)/2)<=1,'Logo und Playbutton teilen denselben Höhenmittelpunkt: '+JSON.stringify(geometry));
  const png=await targetPage.locator('#headerbars iframe').screenshot({scale:'css',animations:'disabled'});
  const pixels=await targetRadio.evaluate(async ({base64,geometry})=>{
   const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;
   const top=Math.ceil(geometry.music.top)+2,bottom=Math.floor(geometry.music.bottom)-2;
   return {top,bottom,imageHeight:img.height,missing:[geometry.brand.right,geometry.music.right].map(edge=>{
    let missing=0;for(let y=top;y<bottom;y++){
     let visible=false;for(let x=Math.floor(edge)-3;x<=Math.ceil(edge)+1;x++){
      const i=(y*img.width+x)*4,rgb=[data[i],data[i+1],data[i+2]];
      if(Math.min(...rgb)>=38&&Math.max(...rgb)-Math.min(...rgb)<=4)visible=true;
     }if(!visible)missing++;
    }return missing;
   })};
  },{base64:png.toString('base64'),geometry});
  assert.ok(pixels.top>=0&&pixels.bottom<=pixels.imageHeight,'Die vollständige Informationszeile ist sichtbar');
  assert.deepEqual(pixels.missing,[0,0],'Beide Linien bleiben durchgehend sichtbar: '+JSON.stringify({client,density,phase,geometry,pixels}));
  measurements.push({phase,width:geometry.width,height:geometry.music.height,logoHeight:geometry.logoHeight,...pixels});
 }
 await radio.evaluate(()=>document.fonts.ready);
 await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'appleiste-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+captureClient+'-900.png'),scale:'css'});
 await radio.locator('#play-button').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__resizeAudio=document.getElementById('radio-audio');__resizeAudio.loop=true;});
 for(const width of [900,1014,1152,701,702,780,850,1024,1199,700,699,640,390,320,1200,1280,1499,1500,1920,2560,3840,900]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
  await radio.waitForFunction(w=>innerWidth===w,width);await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  await require('../support/studio-browser.cjs').settle(radio);
  const layout=await radio.evaluate(()=>{
   const box=s=>document.querySelector(s).getBoundingClientRect(),music=box('.now-playing'),topic=box('.radio-context'),play=box('#play-button'),volume=box('.volume-control'),actions=box('#radio-actions');
   const face=box('.radio-program-face'),disc=getComputedStyle(document.querySelector('.radio-program-face'),'::before');
   return {music:music.toJSON(),topic:topic.toJSON(),play:play.toJSON(),logo:box('.bar-logo').toJSON(),volume:volume.toJSON(),range:box('#volume').toJSON(),orientation:getComputedStyle(document.getElementById('volume')).writingMode,actions:actions.toJSON(),height:box('#radio-panel').height,overflow:document.documentElement.scrollWidth>innerWidth,
    separator:getComputedStyle(document.querySelector('.now-playing')).borderRightWidth,
    separatorColor:getComputedStyle(document.querySelector('.now-playing')).borderRightColor,brand:box('.radio-brand').toJSON(),
    brandLine:{height:parseFloat(getComputedStyle(document.getElementById('radio-panel'),'::after').height),width:getComputedStyle(document.getElementById('radio-panel'),'::after').width,display:getComputedStyle(document.getElementById('radio-panel'),'::after').display},discCenter:face.left+parseFloat(disc.left)+parseFloat(disc.width)/2,
    face:face.toJSON(),disc:{top:face.top+document.querySelector('.radio-program-face').clientTop+parseFloat(disc.top)-parseFloat(disc.height)/2,
     bottom:face.top+document.querySelector('.radio-program-face').clientTop+parseFloat(disc.top)+parseFloat(disc.height)/2,
     centerY:face.top+document.querySelector('.radio-program-face').clientTop+parseFloat(disc.top)}};
  });
  assert.equal(layout.overflow,false);
  if(width>700){
   assert.ok(Math.abs(layout.brand.top-layout.music.top)<=1&&Math.abs(layout.brand.bottom-layout.music.bottom)<=1,'Logotrenner nutzt die volle Informationshöhe');
   assert.ok(Math.abs(layout.brandLine.height-layout.music.height)<=1,'Logotrenner reicht unabhängig vom Bild über die gesamte Informationszeile');
   assert.equal(layout.brandLine.width,'1px');
   assert.ok(layout.music.bottom>=layout.volume.bottom-1,'Musiktrenner reicht durchgehend bis unter die Lautstärkezeile');
   assert.equal(layout.separator,'1px');
   assert.equal(layout.separatorColor,'rgb(58, 58, 58)','Informationstrenner entspricht dem neutralgrauen Screenshot 2');
  }
  assert.ok(layout.disc.top>=layout.face.top+1&&layout.disc.bottom<=layout.face.bottom-1,'Alle Kreise passen vollständig in die Leistenhöhe: '+JSON.stringify({width,...layout}));
  assert.ok(Math.abs(layout.disc.centerY-(layout.play.top+layout.play.height/2))<=1,'Play und Kreise teilen denselben Höhenmittelpunkt');
  assert.equal(layout.orientation,'horizontal-tb','Lautstärke bleibt auch im breiten Deck waagerecht bei '+width);
  assert.ok(layout.range.width>=layout.range.height&&layout.range.height>=44,'Waagerechte Spur und 44-px-Bedienhöhe bei '+width);
  assert.ok(layout.volume.top>=layout.topic.bottom-.5,'Lautstärke folgt unter Thema und Moderationsname bei '+width);
  assert.ok(Math.abs((layout.volume.left+layout.volume.right-layout.topic.left-layout.topic.right)/2)<=1,'Lautstärke und Thema sind gemeinsam zentriert bei '+width);
  if(width>=1200){assert.equal(layout.play.left,36);assert.equal(layout.play.width,80);assert.equal(layout.logo.left,width<1500?198:200);assert.equal(layout.logo.width,100);assert.equal(layout.height,160);}
  if(width>700&&width<1200){
   assert.ok(Math.abs((layout.play.top+layout.play.bottom-layout.music.top-layout.music.bottom)/2)<=1,'Player mittig in der verfügbaren Musikzeile');
   assert.ok(layout.play.right<layout.logo.left&&layout.logo.right<layout.music.left,'Wie im Hauptlayout steht Play vor Logo und Musik: '+JSON.stringify({width,...layout}));
   assert.equal(layout.separator,'1px','Dezenter Trenner zwischen Musik und Thema bei '+width);
   assert.ok(Math.abs(layout.discCenter-(layout.play.left+layout.play.width/2))<=1,'Vinyl bleibt am Mittelpunkt des Playbuttons');
   assert.ok(Math.abs(layout.music.top-layout.topic.top)<=1&&layout.music.right<=layout.topic.left,'Musik und Sendung stehen nebeneinander statt mit großem Leerraum untereinander: '+JSON.stringify({width,...layout}));
   assert.ok(layout.height<=200,'Kurze Inhalte brauchen keine zusätzliche Informationszeile: '+JSON.stringify({width,...layout}));
  }
  if(width<=700){
   assert.equal(layout.brandLine.display,'none','Ohne Logo entfällt auch dessen Trenner');
   assert.ok(layout.topic.left<layout.play.left&&layout.topic.right>layout.music.right-1,'Thema nutzt unter der Musik die gesamte Inhaltsbreite');
   assert.ok(layout.topic.top>=layout.play.bottom+6,'Thema bleibt unter der vollständigen Playfläche');
  }
  if(width<1200)assert.ok(layout.actions.top>=Math.max(layout.topic.bottom,layout.volume.bottom,layout.play.bottom),'Aktionen stehen nach dem vollständigen Informationsbereich');
  if(width<1200)await checkLines(page,radio,'normal');
  if([1014,1280].includes(width))await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'appleiste-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+captureClient+'-'+width+'.png'),scale:'css'});
  await radio.locator('#radio-actions').scrollIntoViewIfNeeded();
  assert.deepEqual((await require('../support/layout-browser.cjs').inspectLayout(radio)).issues,[]);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__resizeAudio&&!__resizeAudio.paused),true);
 }
 await radio.evaluate(()=>Client.sendEvent('mw:onAir',{}));await radio.locator('#host-name').filter({hasText:'Otterchen'}).waitFor();
 const topic='Ein Themenabend mit Musikwünschen, tollen Gästen und Musik für euren Feierabend.';
 await radio.evaluate(topic=>Client.sendEvent('mw:setTopic',{topic}),topic);await radio.locator('#show-topic').filter({hasText:topic}).waitFor();
 for(const width of [900,701,700,390,320]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await radio.waitForFunction(w=>innerWidth===w,width);await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  await radio.locator('.radio-context').scrollIntoViewIfNeeded();await require('../support/studio-browser.cjs').settle(radio);
  assert.deepEqual((await require('../support/layout-browser.cjs').inspectLayout(radio)).issues,[],'Langes Thema bei '+width);
  assert.equal(await radio.locator('#show-topic').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
  await checkLines(page,radio,'langes Thema');
  await radio.evaluate(()=>window.scrollTo(0,0));
  await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'appleiste-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+captureClient+'-'+width+'-thema.png'),scale:'css'});
 }
 const title='Ein langer Musiktitel mit mehreren vollständigen Zeilen für kleine Fenster',artist='Interpret mit einem längeren Namen';
 await lab.context.route('**/fonts/*.woff2',route=>route.abort());
 await lab.context.route('**/fixture/metadata*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({title,artist,live:false})}));
 const fallback=await lab.join('Polaroid',client,701);
 await fallback.radio.locator('#track-title').filter({hasText:title}).waitFor();
 for(const width of [701,320,900]){
  await fallback.page.locator('#width').fill(String(width));await fallback.page.locator('#width').dispatchEvent('change');await fallback.radio.waitForFunction(w=>innerWidth===w,width);await fallback.page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
  for(const selector of ['.now-playing','.radio-context','.volume-control','#radio-actions']){
   await fallback.radio.locator(selector).scrollIntoViewIfNeeded();await require('../support/studio-browser.cjs').settle(fallback.radio);
   assert.deepEqual((await require('../support/layout-browser.cjs').inspectLayout(fallback.radio)).issues,[],'Lange Texte mit Ersatzschrift bei '+width);
  }
  assert.equal(await fallback.radio.locator('#track-title').textContent(),title);assert.equal(await fallback.radio.locator('#track-artist').textContent(),artist);
  await checkLines(fallback.page,fallback.radio,'langer Titel mit Ersatzschrift');
 }
 assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__resizeAudio&&!__resizeAudio.paused),true,'Erneutes Öffnen und Ersatzschrift erhalten die laufende Wiedergabe');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
 fs.writeFileSync(path.join(folder,'trenner-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+captureClient+'.json'),JSON.stringify(measurements,null,2));
});

// Den Tastenhintergrund messen; Text-/Iconkanten enthalten normale Subpixel-Farbsäume.
async function captureRadioButtonColor(button,radio,output){
 const png=await button.screenshot({path:output,scale:'css',animations:'disabled'});
 const foreground=await button.evaluate(n=>{const b=n.getBoundingClientRect();return n.classList.contains('wish-button')?Array.from(n.querySelectorAll('strong,.public-action-icon')).map(part=>{const r=part.getBoundingClientRect();return {left:r.left-b.left-2,right:r.right-b.left+2,top:r.top-b.top-2,bottom:r.bottom-b.top+2};}):[];});
 const blue=await radio.evaluate(async ({base64,foreground})=>{const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height).data;let blue=0;for(let y=4;y<img.height-4;y++)for(let x=4;x<img.width-4;x++){if(foreground.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom))continue;const i=(y*img.width+x)*4;if(pixels[i+1]>pixels[i]+15&&pixels[i+2]>pixels[i]+15&&pixels[i+2]>70)blue++;}return blue;},{base64:png.toString('base64'),foreground});
 return {blue,...await button.evaluate(n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,color:s.color,tap:s.webkitTapHighlightColor,pressed:n.getAttribute('aria-pressed')};})};
}

for(const density of [2,3])test('Alle mobilen Appleisten-Buttons behalten ihre Farben nach Antippen bei Pixeldichte '+density,async t=>{
 const lab=await setup(t,{provider:'online'},false,{isMobile:true,hasTouch:true,deviceScaleFactor:density}),{page,radio}=await lab.join('Otterchen','android',390);await page.bringToFront();
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext Alle Tasten ohne türkise Hervorhebung'));await radio.locator('#radio-ticker:not([hidden])').waitFor();
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio-buttons');fs.mkdirSync(folder,{recursive:true});const proof=[];
 async function record(id,phase){proof.push({id,phase,...await captureRadioButtonColor(radio.locator('#'+id),radio,path.join(folder,density+'-'+id+'-'+phase+'.png'))});}
 const play=radio.locator('#play-button');await play.tap();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);await record('play-button','play');
 await play.tap();await radio.waitForFunction(()=>document.getElementById('radio-audio').paused);await record('play-button','stop');
 await play.tap();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);await radio.evaluate(()=>{window.__barButtonAudio=document.getElementById('radio-audio');__barButtonAudio.loop=true;});await radio.locator('#volume').fill('38');
 for(const [id,kind,close] of [['open-schedule','schedule','close-overlay'],['open-wishes','wishes','close-wishes'],['studio-tab','studio','close-overlay']]){
  await radio.locator('#'+id).tap();const overlay=await overlayView(page,kind,false);await record(id,'offen');await overlay.locator('#'+close).tap();await page.locator('#overlays iframe').waitFor({state:'detached'});await record(id,'geschlossen');
 }
 const pause=radio.locator('#radio-ticker-pause');await pause.tap();assert.equal(await pause.getAttribute('aria-pressed'),'true');await record('radio-ticker-pause','pause');await pause.tap();assert.equal(await pause.getAttribute('aria-pressed'),'false');await record('radio-ticker-pause','weiter');
 await radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:false}));await radio.locator('#open-wishes').waitFor({state:'hidden'});await radio.locator('#open-wishes').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));assert.equal(await page.locator('#overlays iframe').count(),0);await radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:true}));await radio.locator('#open-wishes:not([disabled])').waitFor();
 fs.writeFileSync(path.join(folder,density+'-farben.json'),JSON.stringify(proof,null,2));
 const ids=await radio.locator('.radio-deck button:visible').evaluateAll(nodes=>nodes.map(n=>n.id));assert.deepEqual([...ids].sort(),['mute-button','open-schedule','open-wishes','play-button','radio-ticker-pause','studio-tab'].sort());
 await page.keyboard.press('Tab');
 for(const id of ids){const button=radio.locator('#'+id);assert.equal(await button.evaluate(n=>getComputedStyle(n).webkitTapHighlightColor),'rgba(0, 0, 0, 0)',id+' ohne Browser-Tippfarbe');if(await button.isDisabled())continue;await button.focus();assert.equal(await button.evaluate(n=>document.activeElement===n&&n.matches(':focus-visible')&&parseFloat(getComputedStyle(n).outlineWidth)>=2),true,id+' behält den Tastaturfokus');}
 assert.ok(proof.every(row=>row.blue===0&&row.tap==='rgba(0, 0, 0, 0)'),JSON.stringify(proof));
 assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__barButtonAudio&&!__barButtonAudio.paused&&__barButtonAudio.volume===.38),true);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

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

for(const sizing of ['normal','ignored','stepped'])for(const legacy of [false,true])test('Mobile Appleiste zeigt das vollständige Thema ohne Wunschplatzierung: '+sizing+', '+(legacy?'ohne :has()':'aktueller Browser'),async t=>{
 const lab=await setup(t,{provider:'online',hostSizing:sizing},false,{isMobile:true,hasTouch:true,deviceScaleFactor:sizing==='ignored'?3:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'});
 const owner=await lab.join('Otterchen','android',320),listener=await lab.join('Polaroid','android',320);
 const topic='Ein Themenabend mit Musikwünschen, tollen Gästen und Musik für euren Feierabend.';assert.equal(topic.length,80);
 await owner.radio.evaluate(topic=>Client.sendEvent('mw:setTopic',{topic}),topic);
 await listener.radio.locator('#show-topic').filter({hasText:topic}).waitFor({state:'attached'});
 if(sizing==='stepped'){await owner.radio.evaluate(()=>Client.executeSlashCommand('/lauftext Mobile Information'));await listener.radio.locator('#radio-ticker:not([hidden])').waitFor();}
 const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio-mobil');fs.mkdirSync(folder,{recursive:true});
 for(const {page,radio} of [owner,listener]){
  await page.bringToFront();await radio.evaluate(()=>document.fonts.ready);
  if(legacy)await radio.evaluate(()=>{
   function withoutHas(sheet){for(let i=sheet.cssRules.length-1;i>=0;i--){const rule=sheet.cssRules[i];if(rule.selectorText?.includes(':has('))sheet.deleteRule(i);else if(rule.cssRules)withoutHas(rule);}}
   for(const sheet of document.styleSheets)withoutHas(sheet);
  });
  await radio.locator('#play-button:not([disabled])').tap({timeout:5000});await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__mobileAudio=document.getElementById('radio-audio');__mobileAudio.loop=true;});
  await radio.evaluate(submissionId=>Client.sendEvent('mw:wish.submit',{text:'Mein ausführlicher Musikwunsch mit vielen weiteren Informationen. '.repeat(4),submissionId}),'mobile-layout-'+(page===owner.page?'owner':'listener'));
  await radio.waitForFunction(()=>!document.getElementById('own-wish-position').hidden);
  for(const width of [320,360,390,430,640,780,1100,1199,1280,320]){
   await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
   await page.locator('#headerbars iframe').scrollIntoViewIfNeeded();await radio.waitForFunction(w=>innerWidth===w,width,{polling:50,timeout:5000});await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
   if(width<=1199){
    await radio.locator('.radio-context').scrollIntoViewIfNeeded();
    const theme=await radio.locator('#show-topic').evaluate(node=>{
     const box=node.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const lines=Array.from(range.getClientRects());
     let top=0,bottom=innerHeight,left=0,right=innerWidth;
     for(let n=node;n;n=n.parentElement){const s=getComputedStyle(n),r=n.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,r.left);right=Math.min(right,r.right);}}
     return {fits:lines.every(r=>r.top>=top-.5&&r.bottom<=bottom+.5&&r.left>=left-.5&&r.right<=right+.5),cut:node.scrollHeight>node.clientHeight+1,aboveControls:box.bottom<=document.getElementById('volume').getBoundingClientRect().top};
    });
    assert.deepEqual(theme,{fits:true,cut:false,aboveControls:true},'Das vollständige 80-Zeichen-Thema ist lesbar bei '+width+' px '+(theme.fits?'':JSON.stringify(await radio.evaluate(()=>({scroll:scrollY,height:innerHeight,topic:document.getElementById('show-topic').getBoundingClientRect().toJSON(),context:document.querySelector('.radio-context').getBoundingClientRect().toJSON(),focus:document.activeElement.id})))));
    assert.equal(await radio.locator('#own-wish-position').isVisible(),false,'Keine Wunschplatzierung in der mobilen Appleiste');
    if(width<=430){
     const height=await radio.locator('#radio-panel').evaluate(n=>n.getBoundingClientRect().height);
     assert.ok(height<=312,'Kompakte Leiste trotz vollständigem 80-Zeichen-Thema: '+JSON.stringify({width,height}));
    }
   }else assert.equal(await radio.locator('#own-wish-position').isVisible(),true,'Desktop behält die Wunschplatzierung');
   await radio.locator('#radio-actions').scrollIntoViewIfNeeded();await require('../support/studio-browser.cjs').settle(radio);
   const issues=await radio.evaluate(()=>{
    const issues=[];
    for(const button of document.querySelectorAll('#radio-actions button,#studio-tab')){
     if(!button.getClientRects().length)continue;
     const b=button.getBoundingClientRect(),icon=button.querySelector('.public-action-icon').getBoundingClientRect(),copy=button.querySelector('.wish-button-copy').getBoundingClientRect();
     if(icon.right>copy.left+.5&&icon.bottom>copy.top+.5)issues.push(button.id+': Symbol überlagert Text');
     if(b.width<44||b.height<44||b.left<0||b.right>innerWidth||b.top<0||b.bottom>innerHeight)issues.push(button.id+': Bedienfläche außerhalb des Rahmens '+JSON.stringify({top:b.top,bottom:b.bottom,height:innerHeight}));
     for(const label of button.querySelectorAll('strong')){const range=document.createRange();range.selectNodeContents(label);const r=range.getBoundingClientRect();if(r.left<b.left||r.right>b.right||r.top<b.top||r.bottom>b.bottom)issues.push(button.id+': Beschriftung außerhalb der Taste');}
     for(const [x,y] of [[b.left+2,b.top+b.height/2],[b.right-2,b.top+b.height/2],[b.left+b.width/2,b.top+2],[b.left+b.width/2,b.bottom-2]])if(!button.contains(document.elementFromPoint(x,y)))issues.push(button.id+': verdecktes Klickziel');
    }
    if(document.documentElement.scrollWidth>innerWidth)issues.push('Horizontale Überbreite');return issues;
   });
   assert.deepEqual(issues,[],width+' px, '+sizing+', legacy='+legacy);
   await radio.locator('#volume').scrollIntoViewIfNeeded();assert.deepEqual((await require('../support/layout-browser.cjs').inspectLayout(radio)).issues,[]);
   await radio.locator('#volume').fill('100');assert.equal(await radio.locator('#volume-value').textContent(),'100 %');
   await radio.locator('#mute-button').tap({timeout:5000});assert.equal(await radio.locator('#volume-value').textContent(),'0 %');await radio.locator('#mute-button').tap({timeout:5000});
   assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__mobileAudio&&!__mobileAudio.paused),true);
   if(sizing==='normal'&&[320,390].includes(width)){await radio.evaluate(()=>window.scrollTo(0,0));await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'android-thema-'+(page===owner.page?'moderation':'hoerer')+'-'+width+'-'+legacy+'.png'),scale:'css'});}
  }
  await radio.locator('#open-schedule').tap({timeout:5000});let overlay=await overlayView(page,'schedule',false);await overlay.locator('#close-overlay').tap({timeout:5000});
  await radio.locator('#open-wishes').tap({timeout:5000});overlay=await view(page,'Overlay');await overlay.locator('#close-wishes').tap({timeout:5000});
  if(page===owner.page){await radio.locator('#studio-tab').tap({timeout:5000});overlay=await overlayView(page,'studio',false);await overlay.locator('#close-overlay').tap({timeout:5000});}
 }
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Native Anmeldung ohne PIN erhält Wunschbox und Rollen in '+client,async t=>{
 const lab=await setup(t,{provider:'online',authenticationTest:true}),owner=await lab.join('Otterchen',client,640,false),width=client==='k3'?320:640,dj=await lab.join('DJ-Test',client,width),listener=await lab.join('Polaroid',client,640);
 await owner.radio.evaluate(()=>Client.sendEvent('mw:addRadioModerator',{nick:'DJ-Test'}));await dj.radio.locator('#studio-tab:not([hidden])').waitFor();
 await dj.radio.locator('#studio-tab').click();let studio=await overlayView(dj.page,'studio',false);
 assert.equal(await studio.locator('#moderation-pin,#moderation-login-form,#handover-pin').count(),0);
 assert.equal(await studio.locator('#studio-queue-tab').isDisabled(),true);assert.equal(await studio.locator('#studio-topic').isDisabled(),true);
 assert.equal(await listener.radio.locator('#open-wishes').isDisabled(),true);
 await dj.page.waitForFunction(()=>window.EmulatorLab.frames.pendingSizes.size===0);
 await studio.locator('.dialog-shell').screenshot({path:path.join(studioPictures,'moderation-bereit-'+width+'.png')});
 await studio.locator('#close-overlay').click();await dj.page.locator('#overlays iframe').waitFor({state:'detached'});
 assert.equal(lab.hub.trace.some(e=>e.kind==='sessionEvent'&&e.nick==='DJ-Test'&&e.eventData?.moderator),false);
 await dj.radio.locator('#studio-tab').click();studio=await overlayView(dj.page,'studio',false);
 const began=Date.now();await require('../support/studio-browser.cjs').login(studio);assert.ok(Date.now()-began<5000,'Direkter nativer Start bleibt im lokalen Modell unter fünf Sekunden');
 await listener.radio.locator('#open-wishes:not([disabled])').waitFor();assert.equal(await studio.locator('#studio-queue-tab').isDisabled(),false);
 await revealStudio(studio,'#studio-topic');assert.equal(await studio.locator('#studio-topic').isDisabled(),false);
 await revealStudio(studio,'#toggle-wishes');await studio.locator('#toggle-wishes').click();await listener.radio.locator('#open-wishes').waitFor({state:'hidden'});await studio.locator('#toggle-wishes:not([disabled])').click();await listener.radio.locator('#open-wishes:not([disabled])').waitFor();
 await revealStudio(studio,'#off-air');await studio.locator('#off-air').click();await studio.locator('#on-air:not([disabled])').waitFor();await listener.radio.locator('#open-wishes').waitFor({state:'hidden'});
 await require('../support/studio-browser.cjs').login(studio);await listener.radio.locator('#open-wishes:not([disabled])').waitFor();
 assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:pin.login'),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const width of [320,640])test('Neu aufgebautes flaches Moderationsmenü erhält die vollständige Wunschregie in '+client+' bei '+width,async t=>{
 const lab=await setup(t,{provider:'online',authenticationTest:true}),owner=await lab.join('Otterchen',client,width,false),listener=await lab.join('Polaroid',client,640);
 await owner.radio.locator('#play-button:not([disabled])').click();await owner.radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await owner.radio.evaluate(()=>{window.__modernAudio=document.getElementById('radio-audio');__modernAudio.loop=true;});
 await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio',false);
 assert.equal(await studio.locator('#queue-detail-toggle,.microphone-card,.studio-part').count(),0);
 assert.deepEqual(await studio.locator('#studio-programme-tabs [role=tab]').allTextContents(),['Sendung','Wünsche (0)']);
 await require('../support/studio-browser.cjs').login(studio);
 await revealStudio(studio,'#studio-topic');await studio.locator('#studio-topic').fill('Neues Menü, gleiche Sendung');await studio.locator('#save-topic').click();
 await owner.radio.locator('#show-topic').filter({hasText:'Neues Menü, gleiche Sendung'}).waitFor();
 for(const enabled of [false,true]){await revealStudio(studio,'#toggle-wishes');await studio.locator('#toggle-wishes').click();await studio.waitForFunction(v=>document.getElementById('toggle-wishes').getAttribute('aria-checked')===String(v),enabled);}
 await owner.page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);await require('../support/studio-browser.cjs').settle(studio);
 await studio.locator('.dialog-shell').screenshot({path:path.join(studioPictures,'neu-sendung-'+client+'-'+width+'.png')});
 const text='Ein vollständiger Musikwunsch mit allen Informationen und einem persönlichen Gruß. '.repeat(3).trim();
 await listener.radio.evaluate(({text,id})=>Client.sendEvent('mw:wish.submit',{text,submissionId:id}),{text,id:'modern-'+client+'-'+width});
 await studio.locator('#queue-count').filter({hasText:'1'}).waitFor({state:'attached'});await studio.locator('#studio-queue-tab').click();
 assert.equal(await require('../support/studio-browser.cjs').readText(studio,'.request-text'),text);
 await owner.page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);await require('../support/studio-browser.cjs').settle(studio);
 await studio.locator('.dialog-shell').screenshot({path:path.join(studioPictures,'neu-wuensche-'+client+'-'+width+'.png')});
 for(const [stage,previous] of [['preparing','queued'],['playing','preparing'],['queued','playing']]){await require('../support/studio-browser.cjs').stageRequest(studio,stage,previous);await listener.radio.locator('#own-wish-stage').filter({hasText:stage==='preparing'?'In Vorbereitung':stage==='playing'?'Läuft gerade':'Wartet'}).waitFor({state:'attached'});}
 await revealStudio(studio,'.request-text');await require('../support/studio-browser.cjs').resolveRequest(studio,'done');await studio.locator('#queue-count').filter({hasText:'0'}).waitFor({state:'attached'});
 await studio.locator('#studio-programme-tab').click();await revealStudio(studio,'#off-air');await studio.locator('#off-air').click();await listener.radio.locator('#open-wishes').waitFor({state:'hidden'});
 assert.equal(await owner.radio.evaluate(()=>document.getElementById('radio-audio')===__modernAudio&&!__modernAudio.paused),true);
 const appearance=await studio.locator('#on-air').evaluate(n=>({shadow:getComputedStyle(n).boxShadow,image:getComputedStyle(n).backgroundImage}));assert.deepEqual(appearance,{shadow:'none',image:'none'});
 assert.equal(await studio.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Moderation mit zwei Reitern und /lauftext erhält Thema, Fokus und Audio ohne Historienabruf in '+client,async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,1280,false),requests=[];
 lab.context.on('request',request=>requests.push(request.url()));
 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>0);
 await radio.evaluate(()=>{window.__commandAudio=document.getElementById('radio-audio');});
 await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
 assert.deepEqual(await studio.locator('#studio-programme-tabs [role=tab]').allTextContents(),['Sendung','Wünsche (0)']);
 assert.equal(await studio.locator('#studio-history-tab,#history-panel,#studio-ticker-tab,#ticker-form').count(),0);
 if(client==='k3')for(const [width,name] of [[640,'moderation-780.png'],[320,'moderation-320.png']]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await studio.waitForFunction(w=>innerWidth===w,width);
  await studio.locator('.dialog-shell').screenshot({path:path.join(studioPictures,name)});
 }
 await revealStudio(studio,'#studio-topic');await studio.locator('#studio-topic').fill('Mein erhaltener Themenentwurf');
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext +++ Willkommen bei MischWerk C++ +++'));
 await radio.locator('#radio-ticker-track > span').first().filter({hasText:'+++ Willkommen bei MischWerk C++ +++'}).waitFor({state:'attached'});
 assert.equal(await studio.locator('#studio-topic').inputValue(),'Mein erhaltener Themenentwurf');
 assert.equal(await studio.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);
 const tickerText=await radio.locator('#radio-ticker-readable').textContent();
 const overlays=await page.locator('#overlays iframe').count();
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext'));
 await assertEventually(()=>lab.hub.trace.some(event=>event.kind==='private'&&event.message.includes('--tempo langsam')&&event.message.includes('--an')&&event.message.includes('--aus')));
 assert.equal(await page.locator('#overlays iframe').count(),overlays,'Lauftexteinstellungen öffnen keine zusätzliche Oberfläche');
 for(const [tempo,speed] of [['langsam',32],['normal',48],['schnell',72]]){
  await radio.evaluate(tempo=>Client.executeSlashCommand('/lauftext --tempo '+tempo),tempo);
  await radio.waitForFunction(speed=>{const track=document.getElementById('radio-ticker-track'),duration=parseFloat(getComputedStyle(track).animationDuration),width=track.children[0].getBoundingClientRect().width;return duration>0&&Math.abs(width/duration-speed)<.1;},speed);
  assert.equal(await radio.locator('#radio-ticker-readable').textContent(),tickerText,'Tempoänderung erhält den vollständigen Text');
 }
 await studio.locator('#studio-programme-tab').focus();await studio.locator('#studio-programme-tab').press('ArrowRight');assert.equal(await studio.locator('#studio-queue-tab').getAttribute('aria-selected'),'true');
 await studio.locator('#studio-queue-tab').press('ArrowRight');assert.equal(await studio.locator('#studio-programme-tab').getAttribute('aria-selected'),'true');
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext --aus'));await radio.locator('#radio-ticker').waitFor({state:'hidden'});
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext --tempo langsam'));
 await assertEventually(()=>lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').ticker.speed===32);
 assert.equal(await radio.locator('#radio-ticker').isVisible(),false,'Tempoänderung schaltet den ausgeblendeten Lauftext nicht ein');
 await radio.evaluate(()=>Client.executeSlashCommand('/lauftext --an'));await radio.locator('#radio-ticker').waitFor();
 await radio.waitForFunction(()=>{const track=document.getElementById('radio-ticker-track');return Math.abs(track.children[0].getBoundingClientRect().width/parseFloat(getComputedStyle(track).animationDuration)-32)<.1;});
 assert.equal(await studio.locator('#studio-topic').inputValue(),'Mein erhaltener Themenentwurf');
 assert.equal(await radio.evaluate(()=>__commandAudio===document.getElementById('radio-audio')&&!__commandAudio.paused&&!__commandAudio.error),true);
 assert.equal(requests.some(url=>/\/history\/|:9000|fixture\/history|studio\/ticker\.js/.test(url)),false);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);assert.deepEqual(lab.hub.runtime.errors,[]);
});

for(const client of ['k3','stapp'])test('Direkte Songtitel im nativen '+client+'-Modell sind für Hörer sichtbar und erhalten echtes Audio',async t=>{
  const lab=await setup(t,{provider:'online'},true);
  const config=lab.hub.providerConfig();
  lab.hub.providerConfig=()=>({...config,metadata:{url:'https://emulator.mischwerk.invalid/fixture/current-song',format:'spcast-shoutcast-song',titleField:'',artistField:'',liveField:''}});
  lab.hub.restart(false);
  let title='a-ha - Take On Me';
  await lab.context.route('**/fixture/current-song?*',r=>r.fulfill({body:title,contentType:'text/plain',headers:{'Cache-Control':'max-age=300'}}));
  const requests=[];lab.context.on('request',request=>requests.push(request.url()));
  const {page,radio}=await lab.join('Polaroid',client,390,false);
  // Der Hörer erhält den öffentlichen Titel, während die private Regie weiterhin verborgen bleibt.
  assert.equal(await radio.locator('#studio-tab').isVisible(),false);
  await radio.locator('#track-title').filter({hasText:'Take On Me'}).waitFor();
  assert.equal(await radio.locator('.track-dancer,.track-dancer-measure').count(),0,'Keine Figuren oder Messkopien in der Titelanzeige');
  assert.equal(await radio.locator('.now-playing').evaluate(node=>node.getAnimations({subtree:true}).length),0,'Die Musikangaben enthalten keine Animation');
  assert.equal(await radio.locator('.artist-copy').isVisible(),true);
  assert.equal(await radio.locator('#track-artist').textContent(),'a-ha');
  assert.equal(await radio.evaluate(()=>document.getElementById('track-title').getBoundingClientRect().bottom<=document.getElementById('track-artist').getBoundingClientRect().top),true,'Titel steht über dem Interpreten');
  const typography=await radio.evaluate(()=>({size:parseFloat(getComputedStyle(document.getElementById('track-artist')).fontSize),gap:document.getElementById('track-artist').getBoundingClientRect().top-document.getElementById('track-title').getBoundingClientRect().bottom}));
  assert.ok(typography.size>=15&&typography.gap>=5,'Interpret größer und mit Abstand zum Titel: '+JSON.stringify(typography));
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__historyAudio=document.getElementById('radio-audio');window.__historyAudioAt=__historyAudio.currentTime;});
  title='Neue Band - Neuer Titel';await page.clock.runFor(5000);
  await radio.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  assert.equal(await radio.locator('#track-artist').textContent(),'Neue Band');
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>window.__historyAudioAt);
  assert.equal(await radio.locator('#radio-audio').evaluate(n=>n===window.__historyAudio&&!n.paused&&!n.error),true);
  assert.equal(requests.some(url=>/dancers\.js|knuddel-figur/.test(url)),false,'Keine Figurenressource nachgeladen');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored'])test('Schmale Moderation zeigt bei 320 Pixeln Anmeldung, Thema und Wunschbox zusammen in '+client+' bei '+sizing,async t=>{
  const lab=await setup(t,{provider:'online',authenticationTest:true,hostSizing:sizing}),{page,radio}=await lab.join('Otterchen',client,320,false);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__compactStudioAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab').click();let frame=await overlayView(page,'studio',false);
  async function together(){
    await require('../support/studio-browser.cjs').settle(frame);
    await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
    await require('../support/studio-browser.cjs').settle(frame);
    assert.equal(await frame.locator('#studio-paging').isVisible(),false,'Keine Bereichsseiten bei 320 Pixeln');
    for(const id of ['studio-controls','topic-form','toggle-wishes'])assert.equal(await frame.locator('#'+id).isVisible(),true,id+' bleibt auf derselben Seite');
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    assert.equal(await frame.locator('#toggle-wishes').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight+1),true,'Die Wunschbox passt mit den übrigen Standardgruppen in den sichtbaren Rahmen');
  }
  await require('../support/studio-browser.cjs').settle(frame);
  assert.equal(await frame.locator('#moderation-pin,#moderation-confirmation').count(),0);
  await together();
  assert.equal(await frame.locator('#studio-topic').isDisabled(),true);
  await revealStudio(frame,'#on-air');await frame.locator('#on-air').click();
  await frame.locator('#off-air:not([disabled])').waitFor();await together();
  await frame.locator('#studio-topic').fill('Mein schmaler Themenentwurf');
  for(const enabled of [false,true]){
    await frame.locator('#toggle-wishes').click();await frame.waitForFunction(v=>document.getElementById('toggle-wishes').getAttribute('aria-checked')===String(v),enabled);
    await together();assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein schmaler Themenentwurf');
  }
  await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab').click();frame=await overlayView(page,'studio',false);await together();
  assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein schmaler Themenentwurf');
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__compactStudioAudio&&!__compactStudioAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Erste Moderationsanmeldung aktiviert die Wunschbox ohne vorübergehende Feedbackseite in '+client,async t=>{
  const lab=await setup(t,{provider:'online',authenticationTest:true}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  await radio.locator('#studio-tab:not([disabled])').click();const frame=await overlayView(page,'studio');
  await require('../support/studio-browser.cjs').settle(frame);
  assert.equal(await frame.locator('#studio-paging').isVisible(),false,'Alle normalen Bediengruppen bleiben direkt nach der Anmeldung auf einer Seite');
  assert.equal(await frame.locator('#notice').isVisible(),false,'Anmeldung und automatische Freigabe benötigen keine zusätzliche Erfolgsbox');
  await frame.locator('#studio-topic').fill('Mein Entwurf nach der Anmeldung');
  for(const enabled of [false,true]){
    await frame.locator('#toggle-wishes:not([disabled])').click();
    await frame.waitForFunction(value=>document.getElementById('toggle-wishes').getAttribute('aria-checked')===String(value),enabled);
    await require('../support/studio-browser.cjs').settle(frame);
    assert.equal(await frame.locator('#studio-paging').isVisible(),false);
    assert.equal(await frame.locator('#notice').isVisible(),false);
    assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein Entwurf nach der Anmeldung');
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored'])test('Wunschbox-Feedback erzeugt in '+client+' bei '+sizing+' keine zusätzliche Radioregie-Seite',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:sizing}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__wishToggleAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab:not([disabled])').click();let frame=await overlayView(page,'studio');
  await revealStudio(frame,'#toggle-wishes');
  if(await frame.locator('#toggle-wishes').getAttribute('aria-checked')==='true'){
    await frame.locator('#toggle-wishes').click();
    await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='false');
  }
  await radio.waitForFunction(()=>document.getElementById('open-wishes').classList.contains('wishes-closed'));
  await radio.evaluate(()=>document.fonts.ready);
  const radioButtons=()=>radio.locator('#open-schedule,#open-wishes,#studio-tab').evaluateAll(nodes=>nodes.map(n=>[n,...n.querySelectorAll('.public-action-icon,.wish-button-copy strong')].map(e=>e.getBoundingClientRect().toJSON())));
  const disabledButtons=await radioButtons();
  await frame.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');
  await frame.waitForTimeout(700);
  assert.equal(await frame.locator('#studio-paging').isVisible(),false,'Die normalen Bediengruppen passen auf eine Seite');
  await frame.locator('#studio-topic').fill('Mein ungespeichertes Thema');
  const before=await frame.evaluate(()=>['studio-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  const sizeCount=sizes();
  await frame.evaluate(()=>{
    window.__wishPagerFrames=[];
    window.__wishPagerObserver=new MutationObserver(()=>{
      const pager=document.getElementById('studio-paging');
      if(pager&&!pager.hidden)__wishPagerFrames.push(pager.textContent);
    });
    __wishPagerObserver.observe(document.getElementById('studio-panel'),{subtree:true,attributes:true,childList:true,characterData:true});
  });
  await frame.locator('#toggle-wishes').click();
  await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='true');
  await frame.waitForTimeout(200);
  await radio.locator('#open-wishes:not([disabled])').waitFor();
  assert.equal(disabledButtons[1][0].width,0,'Die gesperrte Wunschbox reserviert keinen Platz');
  assert.equal(await radio.locator('#open-wishes').isVisible(),true,'Serverbestätigte Freigabe blendet den Button ein');
  assert.ok((await radioButtons())[1][0].width>=44,'Die eingeblendete Wunschbox bleibt bedienbar');
  const geometry=await frame.evaluate(()=>({height:innerHeight,pager:!document.getElementById('studio-paging').hidden,
    area:[document.getElementById('studio-setup').clientHeight,document.getElementById('studio-setup').scrollHeight],
    parts:[...document.querySelectorAll('#studio-setup > .studio-section')].map(n=>({hidden:n.hidden,height:n.getBoundingClientRect().height})),
    notice:document.getElementById('notice').textContent}));
  assert.equal(geometry.pager,false,'Feedback darf keine zweite Seite erzeugen: '+JSON.stringify(geometry));
  assert.equal(await frame.locator('#studio-topic').isVisible(),true);
  assert.equal(await frame.locator('#on-air').isVisible(),false);
  assert.match(await frame.locator('#studio-wish-state').textContent(),/offen/);
  assert.equal(await frame.locator('#studio-wish-state').getAttribute('aria-live'),'polite');
  assert.equal(await frame.locator('#notice').isVisible(),false);
  assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
  assert.deepEqual(await frame.evaluate(()=>['studio-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  })),before,'Schalten verschiebt keine Bedienung');
  assert.equal(sizes(),sizeCount,'Keine neue Fenstergröße für die Erfolgsbestätigung');
  if(client==='stapp'&&sizing==='normal')await page.locator('#overlays iframe').screenshot({path:path.join(os.tmpdir(),'mischwerk-wunschbox-feedback.png')});
  await frame.locator('#toggle-wishes').click();
  await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='false');
  await frame.waitForTimeout(100);
  await radio.waitForFunction(()=>document.getElementById('open-wishes').classList.contains('wishes-closed'));
  assert.deepEqual(await radioButtons(),disabledButtons,'Serverbestätigtes erneutes Sperren erhält dieselbe Appleistengeometrie');
  assert.match(await frame.locator('#studio-wish-state').textContent(),/geschlossen/);
  assert.equal(await frame.locator('#studio-paging').isVisible(),false);
  assert.deepEqual(await frame.evaluate(()=>{__wishPagerObserver.disconnect();return __wishPagerFrames;}),[],'Auch zwischen den Zustandsereignissen erscheint keine zweite Seite');
  if(sizing==='normal'){
    lab.hub.faults.failPersistence=true;
    await frame.locator('#toggle-wishes').click();await frame.locator('#studio-wish-state.error').waitFor();
    assert.equal(await frame.locator('#toggle-wishes').getAttribute('aria-checked'),'false','Fehlgeschlagene Speicherung öffnet die Wunschbox nicht');
    assert.equal(await frame.locator('#notice').isVisible(),false,'Fehler bleibt direkt beim Wunschboxschalter');
    lab.hub.faults.failPersistence=false;lab.hub.faults.clientDelayMs=250;
    await frame.locator('#toggle-wishes').click();
    assert.equal(await frame.locator('#toggle-wishes').getAttribute('aria-busy'),'true');
    assert.equal(await frame.locator('#toggle-wishes').getAttribute('aria-checked'),'false');
    await frame.waitForFunction(()=>document.getElementById('toggle-wishes').getAttribute('aria-checked')==='true');
    await frame.waitForFunction(()=>document.getElementById('studio-paging').hidden);
    assert.equal(await frame.locator('#studio-wish-state.error').count(),0);
    assert.equal(await frame.locator('#toggle-wishes').evaluate(n=>document.activeElement===n),true);
    assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
    lab.hub.faults.clientDelayMs=0;
  }
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__wishToggleAudio&&!__wishToggleAudio.paused),true);
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


for (const client of ['k3', 'stapp']) {
  test('Dauerhafte Wünsche in '+client+' erhalten Entwurf bei Speicherfehler, Audio beim Speichern und Queue beim Neustart', async t => {
    const lab = await setup(t, { provider: 'online' }), { page, radio } = await lab.join('Otterchen', client, 1280, false);

    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(() => document.getElementById('radio-audio').currentTime > .1);
    await radio.evaluate(() => {
      window.__wishAudio = document.getElementById('radio-audio'); window.__wishLoads = 0;
      __wishAudio.addEventListener('loadstart', () => __wishLoads++);
    });
    await radio.locator('#open-wishes:not([disabled])').click();
    const wishes = await view(page, 'Overlay');
    await wishes.locator('#wish-text').fill('Erster gespeicherter Wunsch');
    lab.hub.faults.failPersistence = true;
    await wishes.locator('#submit-wish').click();
    await wishes.locator('#wish-feedback.error').waitFor();
    assert.equal(await wishes.locator('#wish-text').inputValue(), 'Erster gespeicherter Wunsch');
    lab.hub.faults.failPersistence = false;
    await wishes.locator('#submit-wish:not([disabled])').click();
    await wishes.locator('#wish-feedback.success').waitFor();
    const attempts = lab.hub.trace.filter(row => row.kind === 'clientEvent' && row.eventType === 'mw:wish.submit');
    assert.equal(attempts.length, 2); assert.equal(attempts[0].eventData.submissionId, attempts[1].eventData.submissionId);
    await wishes.locator('#wish-compose-open').click();
    await wishes.locator('#wish-text').fill('Zweiter gespeicherter Wunsch');
    await wishes.locator('#submit-wish').click(); await wishes.locator('#wish-feedback.success').waitFor();
    await wishes.locator('#close-wishes').click();
    await radio.locator('#studio-tab').click(); const studio = await overlayView(page, 'studio');
    await studio.locator('#studio-queue-tab').click();
    await require('../support/studio-browser.cjs').stageRequest(studio,'preparing');
    await radio.locator('#own-wish-stage').filter({hasText:'In Vorbereitung'}).waitFor();
    assert.deepEqual(await radio.evaluate(() => ({ same: __wishAudio === document.getElementById('radio-audio'),
      paused: __wishAudio.paused, loads: __wishLoads })), { same: true, paused: false, loads: 0 });
    const oldSource = await page.locator('#headerbars iframe').getAttribute('src');
    lab.hub.restart(false);
    await page.waitForFunction(old => document.querySelector('#headerbars iframe')?.getAttribute('src') !== old, oldSource);
    const restored = await view(page, 'Headerbar');
    await restored.locator('#own-wish-title').filter({ hasText: 'Erster gespeicherter Wunsch' }).waitFor();
    await restored.locator('#own-wish-more').filter({ hasText: '+1' }).waitFor();
    await restored.locator('#studio-tab').click(); const reopened = await overlayView(page, 'studio');
    await reopened.locator('#studio-queue-tab').click();
    await reopened.locator('#request-queue').filter({ hasText: 'Erster gespeicherter Wunsch' }).waitFor();
    await restored.locator('#own-wish-stage').filter({hasText:'In Vorbereitung'}).waitFor();
    assert.equal(await reopened.locator('.request-stage,.queue-item button').count(),0);
    assert.deepEqual(await reopened.locator('.request-text').allTextContents(),['Erster gespeicherter Wunsch','Zweiter gespeicherter Wunsch']);
    assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
  });
}
async function openRadioAction(radio,button) {
  if(button==='team-tab') { assert.equal(await radio.locator('#team-tab').count(),0); await radio.evaluate(()=>Client.executeSlashCommand('/mw admin')); }
  else { await radio.locator('#'+button+':not([disabled])').click(); }
}





for(const client of ['k3','stapp']) {
  test('Lauftext in '+client+' wird mit /lauftext für alle gespeichert und erhält laufendes Audio',async t=>{
    const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1280,false);

    await owner.radio.locator('#play-button:not([disabled])').click();
    await owner.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
    await owner.radio.evaluate(()=>{window.__tickerAudio=document.getElementById('radio-audio');window.__tickerLoads=0;__tickerAudio.addEventListener('loadstart',()=>__tickerLoads++);});
    const originalBar=await owner.radio.evaluate(()=>['radio-panel','play-button','radio-metadata','open-schedule','open-wishes','studio-tab'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()})));
    const originalGlowSpace=await owner.radio.evaluate(()=>innerHeight-document.querySelector('.radio-program-face').getBoundingClientRect().bottom);
    await owner.radio.locator('#studio-tab').click();const studio=await overlayView(owner.page,'studio');
    lab.hub.runtime.command('Otterchen','lauftext','Du hörst Radio MischWerk. Dein Mix aus Musik und guter Laune.');
    await owner.radio.locator('#radio-ticker').waitFor();
    await owner.radio.evaluate(()=>document.fonts.ready);
    const face=await owner.radio.locator('#radio-ticker-track > span').first().evaluate(n=>({
      family:getComputedStyle(n).fontFamily,weight:getComputedStyle(n).fontWeight,
      loaded:[...document.fonts].some(f=>f.family==='Rajdhani'&&f.weight==='500'&&f.status==='loaded'),text:n.textContent
    }));
    assert.match(face.family,/Rajdhani/);assert.equal(face.weight,'500');assert.equal(face.loaded,true);
    assert.match(face.text,/^\+\+\+ .* \+\+\+$/);
    const glow=await owner.radio.evaluate(()=>({
      combined:document.getElementById('radio-deck')?getComputedStyle(document.getElementById('radio-deck'),'::before').animationName:null,
      duration:getComputedStyle(document.getElementById('radio-deck'),'::before').animationDuration,
      original:getComputedStyle(document.querySelector('.radio-program-face')).boxShadow,
      faceBackground:getComputedStyle(document.querySelector('.radio-program-face')).backgroundColor,
      faceBorder:getComputedStyle(document.querySelector('.radio-program-face')).borderBottomColor,
      lowerCorners:['borderBottomLeftRadius','borderBottomRightRadius'].map(key=>getComputedStyle(document.querySelector('.radio-program-face'))[key]),
      faceTexture:getComputedStyle(document.querySelector('.radio-program-face'),'::after').backgroundImage,
      glowSpace:innerHeight-document.getElementById('radio-ticker').getBoundingClientRect().bottom,
      texture:getComputedStyle(document.getElementById('radio-deck'),'::before').backgroundImage,
      tickerFont:getComputedStyle(document.querySelector('#radio-ticker-track > span')).fontSize,
      tickerBackground:getComputedStyle(document.getElementById('radio-ticker')).backgroundColor
    }));
    assert.equal(glow.combined,'mw-halo-rgb');assert.equal(glow.original,'none','Kein zweiter Glow zwischen Appleiste und Lauftext');
    assert.equal(glow.duration,'42s','Lauftext und Appleiste verwenden denselben leicht beschleunigten RGB-Zyklus');
    assert.equal(glow.faceBackground,'rgb(20, 20, 20)','Ursprüngliche Deckfläche bleibt als Mischhintergrund für das Logo erhalten');
    assert.notEqual(glow.faceBorder,'rgba(0, 0, 0, 0)','Unterer Appleistenrahmen bleibt sichtbar');
    assert.deepEqual(glow.lowerCorners,['0px','0px'],'Am Anschluss keine innenliegenden Rundungen oder Eckkeile');
    assert.match(glow.faceTexture,/repeating-radial-gradient/,'Appleiste behält ihr ursprüngliches Muster');
    assert.equal(glow.glowSpace,originalGlowSpace,'Unterer Glow erhält wieder denselben Auslauf wie vor dem Lauftext');
    assert.deepEqual(await owner.radio.evaluate(()=>['radio-panel','play-button','radio-metadata','open-schedule','open-wishes','studio-tab'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()}))),originalBar,'Lauftext verändert weder Maße noch Bedienelemente der Appleiste');
    assert.equal(glow.texture,'none','Gemeinsame Fläche unter der Laufleiste enthält kein Muster');
    assert.equal(glow.tickerFont,'20px','Größerer Lauftext bleibt in der 44-px-Leiste');
    assert.equal(glow.tickerBackground,'rgb(20, 20, 20)','Einfarbige Laufleiste deckt auch die überlappende Appleistendekoration ab');
    await owner.page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').animationName),'none');
    assert.notEqual(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').boxShadow),'none');
    await owner.page.emulateMedia({reducedMotion:'no-preference'});
    if(client==='k3') {
      await owner.page.setViewportSize({width:1800,height:1600});
      const header=owner.page.locator('#headerbars iframe');
      await header.scrollIntoViewIfNeeded();
      await owner.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const camera=await header.boundingBox(),stage=await owner.page.locator('.stage-scroll').boundingBox();
      assert.ok(camera.y>=stage.y&&camera.y+camera.height<=stage.y+stage.height,'Vollständige Appleiste im sichtbaren Aufnahmebereich');
      const picture=await header.screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/radio/lauftext-1280.png'),animations:'disabled'});
      assert.ok(Math.abs(picture.readUInt32BE(20)-camera.height)<=1,'Vorschau enthält die gesamte Leistenhöhe');
      if(process.env.MISCHWERK_TICKER_CAPTURE){
        const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio');fs.mkdirSync(folder,{recursive:true});
        await owner.radio.locator('#radio-ticker').screenshot({path:path.join(folder,'Lauftext-Begrenzung.png'),animations:'disabled'});
      }
    }
    for(const width of [320,390,780,1280,2290,3840]){
      await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');
      await owner.radio.waitForTimeout(80);
      const geometry=await owner.radio.evaluate(()=>{
        const face=document.querySelector('.radio-program-face').getBoundingClientRect(),line=document.getElementById('radio-ticker').getBoundingClientRect();
        const deck=document.getElementById('radio-deck').getBoundingClientRect(),bar=document.getElementById('radio-panel').getBoundingClientRect();
        const text=document.querySelector('#radio-ticker-track > span'),textBox=text.getBoundingClientRect();
        const textWindow=document.getElementById('radio-ticker-window'),bounds=textWindow.getBoundingClientRect(),style=getComputedStyle(textWindow);
        const label=document.querySelector('.radio-ticker-label').getBoundingClientRect(),pause=document.getElementById('radio-ticker-pause').getBoundingClientRect();
        const fades=['::before','::after'].map(side=>getComputedStyle(textWindow,side));
        return {attached:Math.abs(face.bottom-line.top)<1,fits:deck.bottom<=innerHeight+1,
          bounded:parseFloat(style.borderLeftWidth)>0&&parseFloat(style.borderRightWidth)>0&&style.overflowX==='hidden',
          fades:fades.every(s=>s.content!=='none'&&s.pointerEvents==='none'&&s.backgroundImage.includes('linear-gradient')),
          separated:label.right<bounds.left&&bounds.right<pause.left,
          cleanCorners:['borderBottomLeftRadius','borderBottomRightRadius'].every(key=>parseFloat(getComputedStyle(document.querySelector('.radio-program-face'))[key])===0),
          glowFits:Math.abs(innerHeight-line.bottom-(bar.bottom-face.bottom+16))<1,
          font:parseFloat(getComputedStyle(text).fontSize),lineHeight:line.height,
          textFits:textBox.top>=line.top&&textBox.bottom<=line.bottom&&Math.abs((textBox.top+textBox.bottom-line.top-line.bottom)/2)<1,
          height:innerHeight,content:deck.height,controls:['play-button','open-schedule','open-wishes','studio-tab'].every(id=>{
            const r=document.getElementById(id).getBoundingClientRect();
            return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=line.top+1;
          })};
      });
      assert.ok(geometry.bounded&&geometry.fades&&geometry.separated&&geometry.attached&&geometry.cleanCorners&&geometry.fits&&geometry.glowFits&&geometry.controls&&geometry.textFits,JSON.stringify({client,width,...geometry}));
      assert.equal(geometry.font,width<=700?18:20,'Angepasste Schriftgröße bei '+width+' px');assert.equal(geometry.lineHeight,44,'Unveränderte Laufleistenhöhe');
      assert.ok(Math.abs(geometry.height-geometry.content)<=1,'Hosthöhe entspricht der tatsächlichen Gesamtfläche ohne Leerreserve');
    }
    await owner.page.locator('#width').fill('1280');await owner.page.locator('#width').dispatchEvent('change');
    await owner.radio.waitForFunction(()=>innerWidth===1280);
    const listener=await lab.join('Testhoerer',client,1280);
    await listener.radio.locator('#radio-ticker-readable').filter({hasText:'Du hörst Radio MischWerk.'}).waitFor({state:'attached'});
    assert.equal(await listener.radio.locator('#ticker-form').count(),0);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationDirection),'normal');
    const before=await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).transform);
    await listener.radio.waitForTimeout(150);
    assert.notEqual(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).transform),before);
    const tickerPause=listener.radio.locator('#radio-ticker-pause');
    assert.equal(await tickerPause.locator('svg').count(),1,'Echtes Pause-/Play-Symbol statt Schriftzeichen');
    assert.deepEqual(await tickerPause.locator('svg').evaluate(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,fill:getComputedStyle(n).fill,stroke:getComputedStyle(n).stroke})),{width:24,height:24,fill:'rgb(230, 199, 123)',stroke:'none'});
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),true);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),false);
    await tickerPause.click();
    assert.equal(await tickerPause.getAttribute('aria-pressed'),'true');
    assert.equal(await tickerPause.getAttribute('aria-label'),'Lauftext fortsetzen');
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),false);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),true);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
    await tickerPause.press('Space');
    assert.equal(await tickerPause.getAttribute('aria-pressed'),'false');
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-pause').isVisible(),true);
    assert.equal(await tickerPause.locator('.radio-ticker-symbol-play').isVisible(),false);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationPlayState),'running');
    const literal='<img src=x onerror=alert(1)> Radio MischWerk';
    lab.hub.runtime.command('Otterchen','lauftext',literal);await listener.radio.waitForFunction(text=>document.getElementById('radio-ticker-readable').textContent===text,literal);
    assert.equal(await listener.radio.locator('#radio-ticker img').count(),0);
    assert.equal(await listener.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationDirection),'normal');
    assert.equal(await owner.radio.evaluate(()=>__tickerAudio===document.getElementById('radio-audio')&&!__tickerAudio.paused&&__tickerLoads===0),true);
    lab.hub.runtime.command('Otterchen','lauftext','--aus');
    await listener.radio.locator('#radio-ticker').waitFor({state:'hidden'});await owner.radio.locator('#radio-ticker').waitFor({state:'hidden'});
    assert.equal(await owner.radio.locator('#radio-deck').evaluate(n=>getComputedStyle(n,'::before').content),'none');
    assert.notEqual(await owner.radio.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).boxShadow),'none','Ohne Lauftext bleibt der ursprüngliche Halo erhalten');
    assert.equal(await owner.radio.locator('.radio-program-face').evaluate(n=>getComputedStyle(n).borderBottomLeftRadius),'24px','Ohne Lauftext wieder ursprüngliche Rundungen');
    assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').ticker.text,literal);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.hub.runtime.errors,[]);assert.deepEqual(lab.external,[]);
  });

  test('Lauftext in '+client+' passt bei langen Texten und reduziert Bewegung; begrenzte Hosthöhe bleibt erreichbar',async t=>{
    const lab=await setup(t,{hostSizing:'ignored'}),owner=await lab.join('Otterchen',client,320,false);

    const text='UngetrennterLauftext'.repeat(16).slice(0,300);
    lab.hub.runtime.command('Otterchen','lauftext',text);
    await owner.radio.locator('#radio-ticker').waitFor();
    for(const width of [320,390,780,1280,3840]){
      await owner.page.locator('#width').fill(String(width));await owner.page.locator('#width').dispatchEvent('change');
      await owner.radio.waitForTimeout(80);
      assert.equal(await owner.radio.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,width+' px');
      const joined=await owner.radio.evaluate(()=>{
        const main=document.querySelector('.radio-program-face').getBoundingClientRect(),ticker=document.getElementById('radio-ticker').getBoundingClientRect();
        const deck=document.getElementById('radio-deck'),bounds=deck.getBoundingClientRect(),style=getComputedStyle(deck,'::before');
        return Math.abs(ticker.top-main.bottom)<1&&Math.abs(ticker.left-bounds.left-parseFloat(style.left))<1&&
          Math.abs(bounds.right-parseFloat(style.right)-ticker.right)<1&&Math.abs(bounds.bottom-parseFloat(style.bottom)-ticker.bottom)<1;
      });
      assert.equal(joined,true,'Laufleiste ohne Leerstreifen am sichtbaren Appleistenrahmen und gemeinsamer Glow darunter bei '+width+' px');
      await owner.radio.locator('#radio-ticker-pause').scrollIntoViewIfNeeded();
      assert.equal(await owner.radio.locator('#radio-ticker-pause').isVisible(),true);
    }
    await owner.page.locator('#width').fill('320');await owner.page.locator('#width').dispatchEvent('change');
    await owner.radio.waitForFunction(()=>innerWidth===320);
    await owner.page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await owner.radio.locator('#radio-ticker-track').evaluate(n=>getComputedStyle(n).animationName),'none');
    assert.equal(await owner.radio.locator('#radio-ticker-window').evaluate(n=>['::before','::after'].every(side=>getComputedStyle(n,side).display==='none')),true,'Statischer Text bleibt ohne verdeckende Randverläufe vollständig lesbar');
    assert.equal(await owner.radio.locator('#radio-ticker-readable').textContent(),text);
    assert.equal(await owner.radio.locator('#radio-ticker-track>span').first().evaluate(n=>n.scrollWidth>n.clientWidth),false);
    assert.equal(await owner.radio.evaluate(()=>{
      const text=document.querySelector('#radio-ticker-track>span').getBoundingClientRect(),line=document.getElementById('radio-ticker').getBoundingClientRect();
      return text.width<=document.getElementById('radio-ticker-window').clientWidth+1&&text.height<=line.height;
    }),true,'Reduzierte Bewegung zeigt den vollständigen Text umgebrochen');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
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
      const a=document.getElementById('radio-audio');window.__gapEvents=[];window.__playCalls=0;
      const play=a.play;a.play=function(){window.__playCalls++;return play.apply(this,arguments);};
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
    assert.equal(await radio.evaluate(()=>__playCalls),1,'Keine eigene play-/Wiederverbindungsschleife');
    assert.equal(audioRequests,1);assert.equal(await radio.locator('#notice').isVisible(),false);
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}

for(const client of ['k3','stapp'])for(const initialWidth of [320,780])test('Studio ohne Verlängerung in '+client+' bei '+initialWidth+' px bleibt nach 48 Stunden aktiv und erhält Audio sowie erreichbare Kernaktionen',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,initialWidth);

 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
 await radio.evaluate(()=>{window.__studioAudio=document.getElementById('radio-audio');__studioAudio.loop=true;window.__studioLoads=0;__studioAudio.addEventListener('loadstart',()=>__studioLoads++);});
 await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio',false);
 assert.equal(await studio.locator('#on-air').textContent(),'Anmelden');await require('../support/studio-browser.cjs').login(studio);
 await studio.locator('#off-air:not([disabled])').waitFor();const before=lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator;
 assert.equal('expiresAt' in before,false);assert.equal('openEnd' in before,false);
 for(const width of [initialWidth]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await studio.waitForFunction(w=>innerWidth===Math.min(w,640),width);
  assert.equal(await studio.locator('#on-air').isVisible(),false);
  assert.equal(await studio.locator('#studio-session,#studio-timing,#studio-end-form').count(),0);
  assert.doesNotMatch(await studio.locator('#studio-programme').innerText(),/Endzeit|Angemeldet bis|Studiozeit|Noch .*Min\./);
  for(const id of ['off-air','handover-open']){const button=studio.locator('#'+id);if(await button.isVisible()){
   await button.scrollIntoViewIfNeeded();const b=await button.evaluate(n=>n.getBoundingClientRect().toJSON());assert.ok(b.height>=44);assert.ok(b.x>=0&&b.x+b.width<=width+1);
   assert.equal(await button.evaluate(n=>{const b=n.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===n;}),true);
  }}
 }
 lab.hub.runtime.clock.advance(48*3600000);await studio.evaluate(()=>Client.sendEvent('mw:refresh',{}));
 await studio.locator('#off-air:not([disabled])').waitFor();assert.deepEqual(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator,before);
 await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));await overlayView(page,'team');
 await radio.locator('#studio-tab').click();studio=await overlayView(page,'studio');assert.equal(await studio.locator('#on-air').isVisible(),false);
 await page.locator('#overlays .app-window').screenshot({path:require('node:path').join(require('node:os').tmpdir(),'MischWerk-Build269-'+client+'-'+initialWidth+'.png')});
 await studio.locator('#off-air').click();await studio.locator('#on-air:not([disabled])').waitFor();
 assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator,null);
 assert.deepEqual(await radio.evaluate(()=>({same:__studioAudio===document.getElementById('radio-audio'),paused:__studioAudio.paused,loads:__studioLoads})),{same:true,paused:false,loads:0});
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Alle Overlaylogos sind in '+client+' groß und vollständig sichtbar, mit mittigem Titel und freiem Schließen', async t => {
  const lab=await setup(t,{},false,{deviceScaleFactor:client==='stapp'?2:1}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1600});
  async function assertHeader(frame,minimum) {
    await frame.evaluate(()=>document.fonts.ready);
    const geometry=await frame.evaluate(()=>{
      const head=[...document.querySelectorAll('.dialog-header')].find(node=>node.getClientRects().length);
      const logo=head.querySelector('.dialog-brand img'),heading=head.querySelector('.dialog-heading'),close=head.querySelector('button'),brand=head.querySelector('.dialog-brand');
      const range=document.createRange();range.selectNodeContents(heading.querySelector('h1,h2'));
      const rect=node=>node.getBoundingClientRect().toJSON();
      const point=close.getBoundingClientRect();
      return {logo:rect(logo),head:rect(head),heading:rect(heading),close:rect(close),brand:rect(brand),text:range.getBoundingClientRect().toJSON(),
        fit:getComputedStyle(logo).objectFit,blend:getComputedStyle(logo).mixBlendMode,background:getComputedStyle(logo).backgroundColor,
        source:logo.getAttribute('src'),hit:document.elementFromPoint(point.x+point.width/2,point.y+point.height/2)?.closest('button')===close,
        width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.ok(geometry.logo.width>=minimum,'Erkennbares Logo: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.logo.width-geometry.logo.height)<.1,'Quadratische, proportional gefüllte Bildfläche');
    assert.ok(geometry.logo.top>=geometry.head.top+1&&geometry.logo.bottom<=geometry.head.bottom-1,'Logo nicht vertikal beschnitten');
    assert.ok(geometry.logo.right<geometry.brand.right&&geometry.logo.right+4<=geometry.text.left,'Logo vor Trennlinie und Titel');
    assert.ok(geometry.text.right+4<=geometry.close.left&&geometry.text.top>=geometry.head.top&&geometry.text.bottom<=geometry.head.bottom,'Titel bleibt vom Schließen getrennt');
    assert.ok(Math.abs(geometry.heading.x+geometry.heading.width/2-geometry.head.x-geometry.head.width/2)<1,'Titel exakt mittig');
    assert.ok(geometry.close.width>=44&&geometry.close.height>=44&&geometry.hit,'Schließen bleibt direkt bedienbar');
    assert.equal(geometry.overflow,false);assert.equal(geometry.fit,'contain');assert.equal(geometry.blend,'lighten');
    assert.equal(geometry.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.source,'img/mischwerk-logo.png');
    return geometry;
  }
  for(const [button,kind] of [['open-wishes','wishes'],['studio-tab','studio'],['team-tab','team']]) {
    await page.locator('#width').fill('1280');await page.locator('#width').dispatchEvent('change');
    await openRadioAction(radio,button);const frame=await overlayView(page,kind);
    await assertHeader(frame,64);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
    await frame.waitForFunction(()=>innerWidth===320);await assertHeader(frame,64);
    if(kind==='team') {
      await frame.locator('#team-texts-tab').click();
      await page.locator('#overlays iframe').evaluate(node=>{node.style.height='350px';});
      await frame.waitForFunction(()=>innerHeight===350);
      const short=await assertHeader(frame,64);assert.equal(short.head.height,76,'Einheitlicher Kopf behält auch im niedrigen Host seine Höhe');
    }
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for (const client of ['k3','stapp']) test('Neue Verwaltung in '+client+' zeigt Team und einzelne Bot-Texte ohne unnötiges Scrollen', async t => {
  const lab=await setup(t,{},false,{deviceScaleFactor:client==='stapp'?2:1}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1400});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Polaroid');await team.locator('#add-radio-moderator').click();
  await team.locator('.team-member').filter({hasText:'Polaroid'}).waitFor();
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await team.waitForTimeout(100);
    await team.locator('#team-members-tab').click();
    const metrics=await team.evaluate(()=>{
      const head=document.querySelector('.dialog-header'),title=document.getElementById('dialog-title'),pane=document.getElementById('team-members');
      return {font:getComputedStyle(title).fontFamily,bg:getComputedStyle(head).backgroundColor,decoration:getComputedStyle(head,'::before').content,
        scroll:pane.scrollHeight-pane.clientHeight,outer:document.documentElement.scrollHeight-innerHeight,width:document.documentElement.scrollWidth-innerWidth};
    });
    assert.match(metrics.font,/Outfit/);assert.equal(metrics.bg,'rgb(23, 25, 28)');assert.ok(['none','normal','""'].includes(metrics.decoration));
    assert.ok(metrics.scroll<=1&&metrics.outer<=1&&metrics.width<=1,JSON.stringify(metrics));
    assert.equal(await team.locator('#team-add-heading').textContent(),'Mitglied hinzufügen');
    await team.waitForTimeout(180);
    if(process.env.MISCHWERK_ADMIN_DESIGN_CAPTURE&&client==='k3')await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-'+width+'.png')});
    await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-current:not([disabled])').waitFor();
    const count=await team.locator('#channel-texts-fields textarea').count();
    for(let i=count;i<6;i++)await team.locator('#channel-texts-add').click();
    for(let i=0;i<6;i++) {await team.locator('#channel-texts-current').selectOption(String(i));await team.locator('#channel-texts-fields textarea').nth(i).fill('Kurze Nachricht '+(i+1));}
    await team.locator('#channel-texts-current').selectOption('0');
    assert.equal(await team.locator('#channel-texts-fields textarea:visible').count(),1);
    assert.ok(await team.locator('#channel-texts-scroll').evaluate(n=>n.scrollHeight<=n.clientHeight+1),'Kurze Texte benötigen keine Scrollleiste');
    for(const selector of ['#channel-texts-current','#channel-texts-add','#channel-texts-save','#channel-texts-refresh','#close-overlay']) {
      assert.ok(await team.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&hit&&hit.closest('button,select')===n;}),selector);
    }
    await team.waitForTimeout(180);
    if(process.env.MISCHWERK_ADMIN_DESIGN_CAPTURE&&client==='k3')await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
  }
  await team.locator('#channel-texts-save').click();await team.locator('#channel-texts-feedback').filter({hasText:'gespeichert'}).waitFor();
  assert.deepEqual(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').texts,Array.from({length:6},(_,i)=>'Kurze Nachricht '+(i+1)));
  await team.locator('#channel-texts-current').selectOption('4');await team.locator('#channel-texts-fields textarea').nth(4).fill('Entwurf im fünften Text');
  await team.locator('#channel-texts-refresh').click();await team.waitForFunction(()=>document.getElementById('channel-texts-refresh').getAttribute('aria-disabled')==='false');
  assert.equal(await team.locator('#channel-texts-current').inputValue(),'4');
  await team.locator('#close-overlay').click();await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));
  const reopened=await overlayView(page,'team');
  assert.equal(await reopened.locator('#channel-texts-current').inputValue(),'4');
  assert.equal(await reopened.locator('#channel-texts-fields textarea:visible').inputValue(),'Entwurf im fünften Text');
  await reopened.locator('.channel-texts-remove:visible').click();
  assert.equal(await reopened.locator('#channel-texts-current').inputValue(),'4');
  assert.equal(await reopened.locator('#channel-texts-fields textarea:visible').inputValue(),'Kurze Nachricht 6');
  await reopened.locator('#channel-texts-save').click();await reopened.locator('#channel-texts-feedback').filter({hasText:'gespeichert'}).waitFor();
  assert.deepEqual(lab.hub.runtime.persistence.api().getObject('mischwerk.channelTexts.v1').texts,['Kurze Nachricht 1','Kurze Nachricht 2','Kurze Nachricht 3','Kurze Nachricht 4','Kurze Nachricht 6']);
  await reopened.locator('#channel-texts-current').selectOption('3');await reopened.locator('#close-overlay').click();
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const clean=await overlayView(page,'team');
  await clean.locator('#channel-texts-current:not([disabled])').waitFor();
  assert.equal(await clean.locator('#channel-texts-current').inputValue(),'3','Auch ohne ungespeicherte Änderung bleibt die Textauswahl erhalten');
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

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
  const position=await pane.evaluate(n=>n.scrollTop);await team.locator('#team-members-tab').click();assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
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
  await team.locator('#team-members-tab').click();assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
  await team.locator('#team-members-tab').press('ArrowRight');assert.equal(await team.locator('#channel-texts-form').isVisible(),true);
  for(let i=0;i<4;i++)await team.locator('#channel-texts-add').click();
  assert.equal(await team.locator('#channel-texts-fields textarea').count(),6);assert.equal(await team.locator('#channel-texts-add').isDisabled(),true);
  await team.locator('#channel-texts-fields button').last().click();assert.equal(await team.locator('#channel-texts-fields textarea').count(),5);
  lab.hub.runtime.users.find('Otterchen').state.role='listener';
  await team.locator('#channel-texts-refresh').click();
  await team.locator('#team-panel').waitFor({state:'hidden'});
  assert.equal(await team.locator('#channel-texts-fields textarea').nth(0).inputValue(),'');
  assert.equal(await team.locator('#channel-texts-save').isDisabled(),true);
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
      await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
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
      await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-bottexte-'+width+'.png')});
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

test('Bot-Texte erhalten bei verlorener Speicherquittung die globale Hinweisbox und einen erreichbaren Wiederanlauf', async t => {
  const lab=await setup(t,{},true),{page,radio}=await lab.join('Otterchen','k3');
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-texts-tab').click();await team.locator('#channel-texts-enabled:not([disabled])').waitFor();
  await team.locator('#channel-texts-fields textarea').first().fill('Text mit verlorener Bestätigung');
  lab.hub.faults.dropServerType='mw:result';lab.hub.faults.dropServer=1;
  await team.locator('#channel-texts-save').click();
  await page.clock.runFor(15010);
  await team.locator('#channel-texts-reload').waitFor({state:'visible'});
  assert.equal(await team.locator('#notice').count(),1,'Feedback-Neuzeichnung erhält die gemeinsame Hinweisbox');
  assert.equal(await team.locator('#channel-texts-fields textarea').first().inputValue(),'Text mit verlorener Bestätigung');
  await team.locator('#channel-texts-reload').click();await team.locator('#team-members-tab').click();
  await team.locator('#radio-moderator-nick').fill('Unbekannter-Nick');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-form #notice').waitFor({state:'visible'});
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])for(const sizing of ['normal','stepped','ignored','clamped'])test('Kompakte Moderation in '+client+' bei '+sizing+' behält Text, Fokus und stabile Größen',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:sizing==='clamped'?'normal':sizing}),{page,radio}=await lab.join('Otterchen',client,sizing==='clamped'?320:2290);
  if(sizing==='clamped')await page.setViewportSize({width:1800,height:550});
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__compactAudio=document.getElementById('radio-audio');});
  await radio.locator('#studio-tab').click();const frame=await overlayView(page,'studio');await frame.waitForTimeout(700);
  const compact=await frame.evaluate(()=>innerHeight);
  if(sizing==='ignored')assert.equal(compact,580);
  else if(sizing!=='clamped')assert.ok(compact<650,'Leere Sendezeiten hinterlassen keine 730-px-Leerreserve');
  await revealStudio(frame,'#studio-topic');await frame.waitForTimeout(500);
  // Der scrollbare Laborrahmen ist keine native Overlaybewegung: im Channel messen.
  const outer=()=>page.evaluate(()=>{const frame=document.querySelector('#overlays iframe').getBoundingClientRect(),channel=document.getElementById('channel').getBoundingClientRect();return [frame.x-channel.x,frame.y-channel.y,frame.width,frame.height];});
  const topicGeometry=()=>frame.evaluate(()=>['studio-topic','save-topic','toggle-wishes'].map(id=>{
    const r=document.getElementById(id).getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  const initialOuter=await outer(),initialTopic=await topicGeometry();
  const initialSizes=lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize').length;
  await frame.locator('#studio-topic').fill('Mein ungespeicherter Themenentwurf');
  await frame.waitForTimeout(500);
  const sizes=()=>lab.hub.trace.filter(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize');
  const before=sizes().length;await frame.waitForTimeout(700);assert.equal(sizes().length,before,'Keine wiederholten Größenaufträge');
  assert.equal(before,initialSizes,'Eingabe sendet keinen Größenauftrag');
  assert.deepEqual(await outer(),initialOuter,'Overlay bleibt beim Eingeben am selben Ort und gleich groß');
  assert.deepEqual(await topicGeometry(),initialTopic,'Bedienelemente bleiben beim Eingeben unverändert');
  assert.equal(await frame.locator('#studio-topic').evaluate(n=>n===document.activeElement),true);
  await frame.locator('#studio-queue-tab').click();await frame.waitForTimeout(200);
  await frame.locator('#studio-programme-tab').click();await frame.waitForTimeout(600);await revealStudio(frame,'#studio-topic');
  assert.equal(await frame.locator('#studio-topic').inputValue(),'Mein ungespeicherter Themenentwurf');
  await frame.waitForTimeout(500);const saveOuter=await outer(),saveTopic=await topicGeometry(),saveSizes=sizes().length;
  await frame.locator('#save-topic').click();await frame.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();await frame.waitForTimeout(500);
  assert.equal(sizes().length,saveSizes,'Speichern und bestätigter Zustand senden keinen Größenauftrag');
  assert.deepEqual(await outer(),saveOuter,'Overlay bleibt nach dem Speichern gleich groß und am selben Ort');
  assert.deepEqual(await topicGeometry(),saveTopic,'Speichern verschiebt keine Bedienelemente');
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===window.__compactAudio&&!window.__compactAudio.paused),true);
  assertAllowedOverlaySizes(lab);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});





for(const client of ['k3','stapp'])test('Doppelte native Wunschöffnung in '+client+' bleibt einmalig und erhält Entwurf und Audio',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);lab.hub.faults.clientEventType='mw:openWishes';lab.hub.faults.duplicateNext=true;await radio.locator('#open-wishes:not([disabled])').click();let wishes=await overlayView(page,'wishes');await wishes.locator('#wish-text:not([disabled])').fill('Nativer Entwurf');await page.waitForFunction(()=>EmulatorLab.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wishes.sync'&&e.eventData.text==='Nativer Entwurf'));assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);lab.hub.faults.duplicateNext=true;const before=await page.locator('#overlays iframe').getAttribute('src');await radio.locator('#open-wishes:not([disabled])').click();await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,before);wishes=await overlayView(page,'wishes');assert.equal(await wishes.locator('#wish-text').inputValue(),'Nativer Entwurf');assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Wechsel während der ersten HTML-Ladephase erholt sich in '+client+' von verlorener Vorbereitung',async t=>{
  const lab=await setup(t,{resourceDelayMs:20}),{page,radio}=await lab.join('Otterchen',client);
  let release;await page.route('**/frame/**',async route=>{
    if(!release){await new Promise(resolve=>{release=resolve;});}await route.continue();
  });
  try{
    await radio.locator('#studio-tab').click();await page.locator('#overlays iframe[title$=" · studio"]').waitFor();
    await assertEventually(()=>typeof release==='function');
    assert.equal(await radio.locator('#team-tab').count(),0);
    lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:overlay.prepare';
    await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));
    await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='droppedServer'&&e.eventType==='mw:overlay.prepare'));
    release();const team=await overlayView(page,'team');
    await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Entwurf');
    assert.equal(await page.locator('#overlays iframe').count(),1);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,2);
    assert.equal(lab.hub.trace.filter(e=>e.kind==='sessionEvent'&&e.eventType==='mw:overlay.prepare').length,2);
    await openRadioAction(radio,'open-wishes');await overlayView(page,'wishes');
    await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const back=await overlayView(page,'team');
    assert.equal(await back.locator('#radio-moderator-nick').inputValue(),'Unfertiger Entwurf');
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  }finally{if(release)release();}
});

for(const client of ['k3','stapp'])test('SDK-Ladeübergabe zeigt in '+client+' bereits fertig gestaltete Radioleiste und alle drei Overlays',async t=>{
  const lab=await setup(t,{resourceDelayMs:30}),{page,radio}=await lab.join('Otterchen',client);
  await page.waitForFunction(()=>window.EmulatorLab.trace.some(e=>e.kind==='nativeReady'));
  assert.equal(lab.hub.trace.find(e=>e.kind==='nativeReady').visibleAtHandoff,true,'Radio vor dem SDK-DOMContentLoaded-Listener fertig');
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-wishes','wishes']]){
    const from=lab.hub.trace.length;await openRadioAction(radio,button);
    const frame=await overlayView(page,kind);
    await page.waitForFunction(n=>window.EmulatorLab.trace.slice(n).some(e=>e.kind==='nativeReady'),from);
    const opening=lab.hub.trace.slice(from),handoff=opening.findIndex(e=>e.kind==='nativeReady');
    assert.equal(opening[handoff].visibleAtHandoff,true,kind+' vor Loader-Entfernung fertig');
    const sizing=opening.findIndex(e=>e.kind==='hostSize'&&e.mode==='Overlay'&&e.method==='setSize');
    if(kind!=='wishes')assert.equal(sizing,-1,kind+' behält sein Anfangsmaß');
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Aktive Ladeabdeckung verhindert in '+client+' weiße Erstbilder über dem realistisch weißen Unterbau',async t=>{
  const lab=await setup(t,{resourceDelayMs:35}),{page,radio}=await lab.join('Otterchen',client);
  await page.setViewportSize({width:1800,height:1600});
  let release; await page.route('**/frame/**',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
  for(const [button,kind] of [['studio-tab','studio'],['team-tab','team'],['open-wishes','wishes']]) {
    await openRadioAction(radio,button);
    await page.locator('#overlays iframe').waitFor();
    const loading=page.locator('#overlays .app-loading');assert.equal(await loading.count(),1);
    const opened=lab.hub.trace.findLast(e=>e.kind==='contentShow'&&e.mode==='Overlay');
    assert.equal(opened.pageData.view,kind);assert.equal(opened.loading.enabled,true);
    assert.equal(opened.loading.background,'#0F1114');
    assert.equal(opened.loading.foreground,'#0F1114');
    assert.equal(opened.loading.text,'');
    assert.equal(await loading.textContent(),'');
    for(let picture=0;picture<3;picture++) await assertDarkPicture(page,loading,true);
    if(kind==='studio'){
      // Der Bildprüfer muss weiße Flächen und sichtbaren Ladetext wirklich ablehnen.
      await loading.evaluate(n=>{n.textContent='Lädt...';n.style.backgroundColor='#ffffff';n.style.color='#000000';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Keine weiße Zwischenfläche/);
      await loading.evaluate(n=>{n.style.backgroundColor='#0f1114';n.style.color='#f6f0df';});
      await assert.rejects(assertDarkPicture(page,loading,true),/Native Zwischenfläche/);
      await loading.evaluate(n=>{n.textContent='';n.style.color='#0f1114';});
      await assertDarkPicture(page,loading,true);
    }
    await loading.evaluate(n=>{n.style.visibility='hidden';});
    await assert.rejects(assertDarkPicture(page,page.locator('#overlays iframe'),true),/Keine weiße Zwischenfläche/);
    await loading.evaluate(n=>{n.style.visibility='visible';});
    await page.waitForFunction(()=>!!document.querySelector('#overlays iframe[src]'));
    await assertEventually(()=>typeof release==='function');const resume=release;release=null;resume();
    const frame=await overlayView(page,kind);await loading.waitFor({state:'detached'});
    const colors=await frame.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor]);
    assert.deepEqual(colors,['rgb(15, 17, 20)','rgb(15, 17, 20)']);
    const surface=await frame.locator(kind==='wishes'?'.wish-drawer':'.dialog-shell').evaluate(n=>({
      color:getComputedStyle(n).backgroundColor,radius:parseFloat(getComputedStyle(n).borderTopLeftRadius)
    }));
    assert.equal(surface.color,'rgb(23, 25, 28)');assert.ok(surface.radius>0,'Abgerundete Inhaltsfläche bleibt erhalten');
    await assertOverlayCornerPixels(page);
    await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');await frame.waitForTimeout(100);
    await assertOverlayCornerPixels(page);
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();
    await page.locator('#overlays iframe').waitFor({state:'detached'});
    await page.locator('#width').fill('1280');await page.locator('#width').dispatchEvent('change');
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
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

for(const client of ['k3','stapp'])test('Erster HTML-Anstrich zeigt in '+client+' schon vor dem Startskript den dunklen Overlaykopf',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client);
 await page.setViewportSize({width:1800,height:1600});
 const network=await lab.context.newCDPSession(page);await network.send('Network.enable');await network.send('Network.setCacheDisabled',{cacheDisabled:true});await network.send('Network.clearBrowserCache');
 let release;await page.route('**/app/js/start.js*',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
 try {
  for(const width of [1280,320]) {
   await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
  for(const [button,kind,title] of [['open-wishes','wishes','Wunschbox'],['studio-tab','studio','Moderation'],['team-tab','team','Verwaltung']]){
   await network.send('Network.clearBrowserCache');
   await openRadioAction(radio,button);await assertEventually(()=>typeof release==='function');
   const frame=await (await page.waitForSelector('#overlays iframe')).contentFrame();
   await frame.locator('.dialog-header').waitFor({timeout:2000});
   assert.equal(await frame.locator('#dialog-title').textContent(),title);
   assert.equal(await frame.evaluate(()=>document.documentElement.classList.contains('mw-ready')),false);
   assert.equal(await frame.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
   const earlyLogo=await frame.locator('.dialog-brand img').boundingBox();
   const earlyHead=await frame.locator('.dialog-header:visible').boundingBox();
   assert.ok(earlyLogo.width>=64&&Math.abs(earlyLogo.width-earlyLogo.height)<.1,'Schon der HTML-Anstrich reserviert das große proportionale Logo');
   // Eigene HTML-Ebene separat prüfen; im normalen Ablauf deckt der native Loader sie noch ab.
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='hidden';});
   await assertDarkPicture(page,page.locator('#overlays .app-window'));
   await page.locator('#overlays .app-loading').evaluate(n=>{n.style.visibility='visible';});
   const resume=release;release=null;resume();await overlayView(page,kind);
   const readyHead=await frame.locator('.dialog-header:visible').boundingBox();
   const readyLogo=await frame.locator('.dialog-brand img:visible').boundingBox();
   assert.ok(Math.abs(earlyHead.height-readyHead.height)<=1&&Math.abs(earlyLogo.width-readyLogo.width)<=1,
     'Kopf und Logo wechseln beim Sichtbarwerden nicht ihre Größe: '+JSON.stringify({kind,earlyHead,readyHead,earlyLogo,readyLogo}));
   if(client==='k3'&&kind==='wishes')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/wunschbox/wunschbox-flach-'+(width===320?320:560)+'.png')});
   await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  }}
 }finally{if(release)release();}
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
async function assertEventually(check) { for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.fail('Erwarteter Zustand blieb aus'); }

test('Die Radioleiste lädt keine Overlaycontroller oder vorbereitenden Ressourcenhinweise',async t=>{
 const lab=await setup(t),requests=[];lab.context.on('request',r=>requests.push(r.url()));const {page,radio}=await lab.join('Otterchen','stapp');await radio.waitForTimeout(100);assert.equal(await radio.locator('link[data-mw-prefetch],link[rel=prefetch]').count(),0);assert.equal(requests.some(u=>/js\/(studio|team|schedule)\//.test(u)),false);await radio.locator('#studio-tab:not([disabled])').click();const studio=await overlayView(page,'studio');assert.equal(await studio.locator('#studio-topic').isVisible(),true);assert.ok(requests.some(u=>u.includes('/studio/controls.js')));assert.equal(requests.some(u=>u.includes('/team/management.js')||u.includes('/schedule/controller.js')),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Native Wiederöffnung erzeugt neue Dokumente und erhält die reguläre SDK-Cachekennung',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp');await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');const first=await page.locator('#overlays iframe').getAttribute('src'),cache=await studio.evaluate(()=>Client.getCacheInvalidationId());await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),first);assert.equal(await studio.evaluate(()=>Client.getCacheInvalidationId()),cache);assert.equal(await studio.locator('link[rel=prefetch]').count(),0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

async function overlayView(page,kind,authenticate=true) {
 const selector='#overlays iframe[title$=" · '+kind+'"]';
 for(let attempt=0;attempt<100;attempt++){
  const handle=await page.waitForSelector(selector),frame=await handle.contentFrame();
  if(!frame||frame.isDetached()){await page.waitForTimeout(20);continue;}
  try{await frame.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));if(kind==='studio'&&authenticate)await require('../support/studio-browser.cjs').login(frame);return frame;}
  catch(error){if(!frame.isDetached())throw error;}
 }
 throw Error('Native Overlayseite wurde nicht bereit: '+kind);
}

test('Verlorene Overlaybestätigung lässt den Entwurf stehen; Abbrechen und fehlende Fähigkeit erhalten die Ansicht',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',700);
  await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
  await studio.locator('#studio-topic:not([disabled])').fill('Diesen Entwurf behalten');
  lab.hub.faults.dropClient=1;lab.hub.faults.clientEventType='mw:overlay.ready';
  const at=lab.hub.trace.filter(e=>e.kind==='droppedClient').length;
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));
  await page.waitForFunction(n=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedClient').length>n,at);
  assert.equal(await studio.locator('.dialog-content').evaluate(n=>n.inert),true);
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Diesen Entwurf behalten');
  await studio.locator('#close-overlay').click();
  await studio.waitForFunction(()=>!document.querySelector('.dialog-content').inert);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Bleibt auch ohne Fähigkeit');
  await page.locator('#no-overlay').check();
  await page.waitForFunction(()=>EmulatorLab.state.users.find(u=>u.nick==='Otterchen').capabilities.Overlay===false);
  await radio.locator('#studio-tab:not([disabled])').click();
  await radio.locator('#notice').filter({hasText:/unterstützt.*nicht/}).waitFor();
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Bleibt auch ohne Fähigkeit');
  assert.equal(await page.locator('#popups iframe').count(),0);
  await team.locator('#radio-moderator-nick').focus();await page.keyboard.press('Escape');
  await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#studio-tab').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);
});
for(const client of ['k3','stapp'])test('Alle Channel-Overlays in '+client+' erhalten Entwürfe, Wunschversand, Fokus und Audio beim Wechsel',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,2290);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__sameAudio=document.getElementById('radio-audio');});
  lab.context.setDefaultTimeout(10000);
  const header=await radio.evaluate(()=>innerHeight);
  await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
  await studio.evaluate(()=>{window.__keptDocument=document;});
  const firstSource=await page.locator('#overlays iframe').getAttribute('src');
  await studio.locator('#studio-topic:not([disabled])').fill('Mein ungespeichertes Thema');
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Unfertiger Nick');
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  assert.equal(await studio.locator('#studio-topic').inputValue(),'Mein ungespeichertes Thema');
  assert.equal(await studio.locator('#reset-topic').isVisible(),true);
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Unfertiger Nick');
  assert.notEqual(studio,team);
  assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),firstSource);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,4);
  await team.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#studio-tab').evaluate(n=>document.activeElement===n),true);
  await radio.locator('#open-wishes:not([disabled])').click();let wishes=await overlayView(page,'wishes');
  assert.notEqual(await page.locator('#overlays iframe').getAttribute('src'),firstSource);
  assert.equal(await wishes.evaluate(()=>!!window.__keptDocument),false);
  await wishes.locator('#wish-text:not([disabled])').fill('Mein Wunsch bleibt beim Wechsel');
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  await radio.locator('#open-wishes:not([disabled])').click();wishes=await overlayView(page,'wishes');
  assert.equal(await wishes.locator('#wish-text').inputValue(),'Mein Wunsch bleibt beim Wechsel');
  await wishes.locator('#submit-wish').click();
  await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
  await studio.waitForFunction(()=>document.getElementById('queue-count').textContent==='1');
  if(await studio.locator('#studio-queue-tab').isVisible())await studio.locator('#studio-queue-tab').click();
  assert.match(await studio.locator('#request-queue').textContent(),/Mein Wunsch bleibt beim Wechsel/);
  await radio.locator('#open-wishes:not([disabled])').click();wishes=await overlayView(page,'wishes');
  await radio.locator('#own-wish-rank').filter({hasText:'Platz 1'}).waitFor();
  assert.equal(await wishes.locator('#wish-positions').count(),0);
  assert.equal(await page.locator('#popups iframe').count(),0);
  assert.equal(await page.locator('#overlays iframe').count(),1);
  assert.equal(await radio.evaluate(()=>innerHeight),header);
  assert.equal(await radio.locator('#radio-audio').evaluate(n=>n===window.__sameAudio&&!n.paused),true);
  assert.equal(lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit').length,1);
  assertAllowedOverlaySizes(lab);
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await wishes.waitForFunction(()=>innerWidth===320);
  assert.equal(await wishes.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await wishes.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#open-wishes').evaluate(n=>document.activeElement===n),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
for(const client of ['k3','stapp'])test('Studioanmeldung zeigt in '+client+' eindeutig die Moderation; Abmeldung stellt MischWerk wieder her',async t=>{
 const lab=await setup(t,{provider:'online'});let live=false;
 await lab.context.route('**/fixture/metadata',r=>r.fulfill({json:{title:'Lokaler Testtitel',artist:'Emulator-Testsignal',live}}));
 const {page,radio}=await lab.join('Otterchen',client,1920,false);
 await radio.locator('#on-air-sign').filter({hasText:'MischWerk am Pult'}).waitFor();
 const neutral='rgb(180, 180, 176)',goldColor='rgb(230, 199, 123)';
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>getComputedStyle(n).color),neutral);
 // Die vergrößerte Moderationsanzeige bleibt gegenüber dem Musiktitel nachgeordnet.
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)),15,'Besser lesbare AutoDJ-Anzeige');
 await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
 await radio.evaluate(()=>{window.__moderatorNameAudio=document.getElementById('radio-audio');window.__moderatorAudioEvents=[];for(const type of ['playing','pause','emptied','error','ended'])window.__moderatorNameAudio.addEventListener(type,()=>window.__moderatorAudioEvents.push(type));});
 await radio.locator('#studio-tab:not([disabled])').click();let studio=await overlayView(page,'studio');
 await require('../support/studio-browser.cjs').login(studio);await studio.locator('#studio-host').filter({hasText:'Otterchen ist am Mikrofon'}).waitFor();
 await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
 assert.equal(await radio.locator('#on-air-sign').textContent(),'Es moderiert');
 assert.equal(await radio.locator('#host-name').textContent(),'Otterchen');assert.equal(await radio.locator('#host-name').getAttribute('data-prefix'),'');
 assert.equal(await radio.locator('.presenter').getAttribute('data-mode'),'moderation');
 assert.equal(await radio.locator('.live-topic-label').count(),0);
 assert.equal(await radio.locator('.presenter-mic').isVisible(),true);
 assert.equal(await radio.locator('.topic-label').isVisible(),false);
 for(const selector of ['#on-air-sign','#host-name'])assert.equal(await radio.locator(selector).evaluate(n=>getComputedStyle(n).color),selector==='#host-name'?goldColor:neutral);
 assert.doesNotMatch(await radio.locator('.presenter').textContent(),/MischWerk am Pult|Im Studio angemeldet/);
 await radio.locator('#studio-tab:not([disabled])').click();studio=await overlayView(page,'studio');
 await studio.locator('#off-air:not([disabled])').click();await studio.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
 await radio.locator('#host-name').waitFor({state:'hidden'});assert.equal(await radio.locator('#on-air-sign').textContent(),'MischWerk am Pult','Abmeldung schaltet bei unverändertem AutoDJ sichtbar zurück');
 await require('../support/studio-browser.cjs').login(studio);await studio.locator('#studio-host').filter({hasText:'Otterchen ist am Mikrofon'}).waitFor();
 await radio.locator('#on-air-sign').filter({hasText:'Es moderiert'}).waitFor();
 await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
 live=true;await radio.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await radio.waitForFunction(()=>document.querySelector('.presenter').getAttribute('data-mode')==='live');
 await radio.evaluate(()=>Client.sendEvent('mw:setTopic',{topic:'80er und 90er'}));
 await radio.locator('#show-topic').filter({hasText:'80er und 90er'}).waitFor();
 for(const width of [3840,1920,1351,1200,1024,768,390,320]){
  await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');await radio.waitForTimeout(100);
  assert.equal(await radio.locator('#host-name').textContent(),'Otterchen');assert.equal(await radio.locator('#host-name').isVisible(),true);
  assert.equal(await radio.locator('#host-name').getAttribute('data-prefix'),'');await radio.locator('#host-name').scrollIntoViewIfNeeded();
  assert.equal(await radio.locator('#host-name').evaluate(n=>{const r=n.getBoundingClientRect(),p=n.closest('.presenter').getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1;}),true);
  assert.equal(await radio.locator('#on-air-sign').textContent(),'Es moderiert');assert.equal(await radio.locator('.presenter').getAttribute('data-mode'),'live');
  for(const selector of ['#on-air-sign','#host-name']){
   assert.equal(await radio.locator(selector).evaluate(n=>getComputedStyle(n).color),selector==='#host-name'?goldColor:neutral);
   assert.equal(await radio.locator(selector).evaluate(n=>parseFloat(getComputedStyle(n).fontSize)),selector==='#host-name'?16:12,'Studio-Hierarchie bei '+width);
  }
  assert.ok(await radio.locator('.radio-status-row').evaluate(n=>{
   const row=n.getBoundingClientRect(),text=n.querySelector('.presenter').getBoundingClientRect();
   const padding=innerWidth<1200?3:6;
   return parseFloat(getComputedStyle(n).paddingTop)===padding&&text.top-row.top>=padding;
  }),'Anzeige gegenüber dem Thema tiefer bei '+width);
  const centering=await radio.evaluate(()=>{
   const context=document.querySelector('.radio-context'),box=context.getBoundingClientRect(),style=getComputedStyle(context);
   const axis=(box.left+parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth)+box.right-parseFloat(style.paddingRight)-parseFloat(style.borderRightWidth))/2;
   const range=document.createRange();range.selectNodeContents(document.getElementById('show-topic'));const topic=range.getBoundingClientRect();
   const parts=Array.from(document.querySelector('.presenter').children).filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect());
   return {topic:Math.abs((topic.left+topic.right)/2-axis),moderation:Math.abs((Math.min(...parts.map(r=>r.left))+Math.max(...parts.map(r=>r.right)))/2-axis)};
  });
  assert.ok(centering.topic<=1&&centering.moderation<=1,'Thema und gesamte Moderationszeile sind mittig: '+JSON.stringify({width,...centering}));
  if(width<1200){
   const badgeSpace=await radio.evaluate(()=>{
    const badge=document.querySelector('#radio-topic').getBoundingClientRect(),face=document.querySelector('.radio-program-face'),f=face.getBoundingClientRect(),s=getComputedStyle(face,'::before');
    const disc={right:f.left+parseFloat(s.left)+parseFloat(s.width),bottom:f.top+parseFloat(s.top)+parseFloat(s.height)/2};
    return {clear:badge.left>=disc.right+6||badge.top>=disc.bottom+6,badge:badge.toJSON(),disc};
   });
   assert.ok(badgeSpace.clear,'Gemeinsamer Themen-/Moderationsbereich hält Abstand zum gesamten Play-/Vinylbereich: '+JSON.stringify({width,...badgeSpace}));
  }
  assert.ok((await radio.locator('#on-air-sign').getAttribute('aria-label')).startsWith('Radio Mischwerk bestätigt eine Live-Sendung.'));
  assert.equal(await radio.locator('#on-air-sign').getAttribute('title'),'Sendung und Moderation');
  if(process.env.MISCHWERK_LIVE_CAPTURE&&client==='k3'&&[1920,390].includes(width)){
   const folder=path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio-live-neu');fs.mkdirSync(folder,{recursive:true});
   await radio.evaluate(()=>document.fonts.ready);await radio.locator('.radio-context').screenshot({path:path.join(folder,'live-moderation-'+width+'.png')});
   if(width===1920){
    const viewport=page.viewportSize();await page.setViewportSize({width:width+360,height:1100});
    await page.locator('#headerbars iframe').scrollIntoViewIfNeeded();
    await radio.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'appleiste-live-'+lab.hub.runtime.context.MischWerkConfig.buildNumber+'-'+width+'.png')});
    await page.setViewportSize(viewport);
   }
   if(width===390)await page.locator('#headerbars iframe').screenshot({path:path.join(folder,'appleiste-live-'+width+'.png')});
  }
  if(width===1920){const sign=await radio.locator('#on-air-sign').boundingBox(),name=await radio.locator('#host-name').boundingBox();assert.ok(Math.abs(sign.y+sign.height/2-name.y-name.height/2)<=4&&name.x>=sign.x+sign.width);}
  const audioState=await radio.evaluate(()=>{const audio=window.__moderatorNameAudio;return {same:document.getElementById('radio-audio')===audio,paused:audio.paused,ended:audio.ended,error:audio.error?.code||null,source:audio.getAttribute('src'),events:window.__moderatorAudioEvents};});
  assert.equal(audioState.same&&!audioState.paused,true,JSON.stringify({width,...audioState}));
  assert.equal(await radio.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 const longTopic='Ein Themenabend mit Musikwünschen, tollen Gästen und Musik für euren Feierabend.';
 await radio.evaluate(topic=>Client.sendEvent('mw:setTopic',{topic}),longTopic);
 await radio.locator('#show-topic').filter({hasText:longTopic}).waitFor();
 assert.equal(await radio.locator('#show-topic').evaluate(n=>n.scrollHeight<=n.clientHeight+1),true);
 assert.ok(await radio.evaluate(()=>document.getElementById('show-topic').getBoundingClientRect().bottom<=document.getElementById('volume').getBoundingClientRect().top));
 const liveHeight=await radio.locator('#radio-panel').evaluate(n=>n.getBoundingClientRect().height);
 assert.ok(liveHeight<=312,'Live bleibt bei 320 px kompakt mit vollständigem Thema: '+liveHeight);
 await radio.locator('#studio-tab:not([disabled])').click();const back=await overlayView(page,'studio');
 await back.locator('#off-air:not([disabled])').click();await back.locator('#studio-host').filter({hasText:'Keine Moderation angemeldet'}).waitFor();
 await radio.locator('#host-name').waitFor({state:'hidden'});assert.equal(await radio.locator('#on-air-sign').textContent(),'MischWerk spielt live','Kein falscher AutoDJ aus einer App-Abmeldung');
 live=false;await radio.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await radio.locator('#on-air-sign').filter({hasText:'MischWerk am Pult'}).waitFor();
 assert.equal(await radio.locator('#on-air-sign').evaluate(n=>getComputedStyle(n).color),neutral,'AutoDJ nach Abmeldung wieder neutral');
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test.before(async () => { browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--mute-audio'] }); });
for(const client of ['k3','stapp']) test('Neugestaltete Arbeitsfenster in '+client+' verbinden alle Reiter und erhalten Audio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,1280,false);
  async function reopen(kind,action) {
    const old=await page.locator('#overlays iframe').getAttribute('src');await action();
    await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,old);
    return overlayView(page,kind);
  }
  await page.setViewportSize({width:1800,height:1600});

  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__redesignAudio=document.getElementById('radio-audio');__redesignAudio.loop=true;window.__redesignLoads=0;__redesignAudio.addEventListener('loadstart',()=>__redesignLoads++);});
  const ownerHeader=[...lab.hub.runtime.contents.sessions.keys()].find(id=>{
    const description=lab.hub.runtime.contents.describe(id);return description.nick==='Otterchen'&&description.mode==='Headerbar';
  });
  lab.hub.runtime.event('Otterchen',ownerHeader,'mw:wish.submit',{submissionId:'redesign-wish',text:'Lokaler Prüfwunsch: a-ha – Take On Me'});
  await radio.locator('#studio-tab').click();let studio=await overlayView(page,'studio');
  await studio.locator('#studio-topic').fill('Lokale Prüfung · Musik zum Feierabend');await studio.locator('#save-topic').click();
  await require('../support/studio-browser.cjs').login(studio);await studio.locator('#off-air:not([disabled])').waitFor();
  for(const width of [780,320,390,560,1280,3840]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
    studio=await reopen('studio',()=>radio.locator('#studio-tab').click());
    await studio.waitForFunction(width=>innerWidth===Math.min(width,640),width);
    for(const [tab,panel,name] of [['studio-programme-tab','studio-programme','moderation'],['studio-queue-tab','studio-requests','moderation-wuensche']]) {
      await studio.locator('#'+tab).click();await studio.locator('#'+panel).waitFor();await studio.waitForTimeout(100);
      const fit=await studio.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
        tabs:[...document.querySelectorAll('#studio-programme-tabs button')].map(button=>{const r=button.getBoundingClientRect();return {width:r.width,height:r.height,scroll:button.scrollWidth};})}));
      assert.ok(fit.scroll<=fit.width+1,JSON.stringify(fit));
      assert.ok(fit.tabs.every(button=>button.height>=44&&button.scroll<=button.width+1),JSON.stringify(fit));
      if(panel==='studio-requests'){
        const rows=await studio.locator('.queue-item').first().evaluate(node=>{
          const rect=selector=>{const n=node.querySelector(selector);return n&&n.getClientRects().length?n.getBoundingClientRect().toJSON():null;};
          return {text:rect('.request-text'),meta:rect('.queue-meta')};
        });
        assert.ok(rows.meta.bottom<=rows.text.top+1,'Absender und Zeit stehen oberhalb des vollständigen Wunsches');
      }

      if(client==='k3'&&[320,780].includes(width))await page.locator('#overlays iframe').screenshot({path:path.join(studioPictures,name+'-'+width+'.png'),animations:'disabled'});
    }
  }
  await studio.locator('#studio-programme-tab').click();await revealStudio(studio,'#off-air');await studio.locator('#off-air').click();await studio.locator('#on-air:not([disabled])').waitFor();
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await overlayView(page,'team');
  for(const width of [560,320]) {
    await page.locator('#width').fill(String(width));await page.locator('#width').dispatchEvent('change');
    team=await reopen('team',()=>radio.evaluate(()=>Client.executeSlashCommand('/mw admin')));
    for(const [tab,panel,name] of [['team-members-tab','team-members','verwaltung'],['team-texts-tab','channel-texts-panel','verwaltung-bottexte']]) {
      await team.locator('#'+tab).click();await team.locator('#'+panel).waitFor();await team.waitForTimeout(100);
      assert.ok(await team.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.ok(await team.locator('#dialog-title').evaluate(node=>{
        const range=document.createRange();range.selectNodeContents(node);
        const text=range.getBoundingClientRect(),box=node.getBoundingClientRect();
        return text.width<=box.width+1&&range.getClientRects().length===1;
      }),'Verwaltung bleibt vollständig und ohne Worttrennung sichtbar');
      if(client==='k3')await page.locator('#overlays iframe').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/verwaltung/'+name+'-'+width+'.png'),animations:'disabled'});
    }
  }
  assert.deepEqual(await radio.evaluate(()=>({same:document.getElementById('radio-audio')===__redesignAudio,paused:__redesignAudio.paused,loads:__redesignLoads})),{same:true,paused:false,loads:0});
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});
test.after(async () => { await browser?.close(); });

for (const client of ['k3', 'stapp']) {
  test('Öffentliche Begrüßung mit Foto am Ende und vier Rollen erhält laufendes Radio in ' + client, async t => {
    const lab = await setup(t, { provider: 'online' }), records = [], log = lab.hub.log.bind(lab.hub);
    lab.hub.log = (kind, data) => { const item = log(kind, data); records.push(item); return item; };
    const { radio } = await lab.join('Otterchen', client, 1280, false);
    const runtime = lab.hub.runtime;

    const header = [...runtime.contents.sessions.keys()].find(id => runtime.contents.describe(id).nick === 'Otterchen');
    for (const nick of ['DJ-Test', 'Polaroid']) runtime.event('Otterchen', header, 'mw:addRadioModerator', { nick });
    runtime.users.find('Polaroid').state.role = 'cm';
    runtime.users.find('Testhoerer').state.profilePhoto = 'https://example.invalid/profile.png';
    const photoUser = runtime.users.find('Testhoerer').user, nativeProfileLink = photoUser.getProfileLink;
    photoUser.getProfileLink = display => nativeProfileLink(String(display).replace(/[<>]/g, character => '\\' + character));
    await radio.evaluate(() => { window.__greetingAudio = document.getElementById('radio-audio'); });
    await radio.locator('#play-button:not([disabled])').click();
    await radio.waitForFunction(() => __greetingAudio.currentTime > .1);
    for (const nick of ['Testhoerer', 'Channelmoderator', 'DJ-Test', 'Polaroid']) await lab.join(nick, client);
    const messages = () => records.filter(item => item.kind === 'public').map(item => item.message);
    assert.equal(messages().length, 5);
    assert.equal(messages()[1], "°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Testhoerer|/w Testhoerer<°.§°r° Viel Spaß beim Zuhören. °>https://example.invalid/profile.png<>--<>|/w Testhoerer<°");
    assert.deepEqual(runtime.users.find('Testhoerer').state.photoSize, [24, 24]);
    assert.equal(messages()[2], "°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Channelmoderator|/w Channelmoderator<°.§°r° Viel Spaß beim Zuhören.");
    assert.equal(messages()[3], "°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>DJ-Test|/w DJ-Test<°.§°r° Viel Spaß beim Zuhören.");
    assert.equal(messages()[4], "°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>Polaroid|/w Polaroid<°.§°r° Viel Spaß beim Zuhören.");
    for (const person of runtime.users.online()) runtime.invokeFunction(runtime.app.onUserJoined, [person.user]);
    runtime.invokeFunction(runtime.app.onAppStart);
    assert.equal(messages().length, 5, 'Keine Doppelmeldungen oder nachträgliche Startbegrüßung');
    await radio.waitForFunction(() => __greetingAudio.currentTime > .5);
    assert.equal(await radio.evaluate(() => __greetingAudio === document.getElementById('radio-audio') && !__greetingAudio.paused), true);
    assert.deepEqual(lab.errors, []); assert.deepEqual(runtime.errors, []); assert.deepEqual(lab.external, []);
  });
}


async function setup(t, faults = {}, clock = false, contextOptions = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Emulator-Browser-'));
  const instance = await createEmulator({ port: 0, dataDir: directory, appDir:process.env.MISCHWERK_TEST_UPLOAD });
  Object.assign(instance.hub.faults, faults);
  if (faults.provider) instance.hub.restart(false);
  const context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, ...contextOptions });
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
    const operator=instance.hub.runtime.users.find(nick);
    if(registeredOwner&&nick==='Otterchen'&&operator.state.role==='owner') {
      const saved=instance.hub.runtime.persistence.api().getObject('mischwerk.state.v1');
      if(!(saved?.radioModeratorUserIds||[]).includes(operator.state.id))await radio.evaluate(()=>Client.sendEvent('mw:addRadioModerator',{nick:'Otterchen'}));
      await radio.locator('#studio-tab:not([hidden])').waitFor();
    }
    if(nick==='Otterchen'&&!faults.authenticationTest){if(registeredOwner){await radio.evaluate(()=>Client.sendEvent('mw:onAir',{}));await radio.locator('#open-wishes:not([disabled])').waitFor();}else await radio.evaluate(()=>Client.sendEvent('mw:setRequests',{enabled:true}));}
    return { page, radio };
  }
  return { ...instance, context, join, errors, external };
}
async function view(page, mode) {
  const selector = mode === 'Headerbar' ? '#headerbars iframe[src]' : mode === 'Overlay' ? '#overlays iframe[src]' : '#popups iframe[src]';
  const handle = await page.waitForSelector(selector);
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
  if(mode==='Overlay'&&await frame.locator('#on-air').count())await require('../support/studio-browser.cjs').login(frame);
  return frame;
}
async function send(page, value) { await page.evaluate(value => window.EmulatorLab.send(value), value); }

for (const client of ['k3','stapp']) {
  test('Wunschbox bündelt in '+client+' nach Versand nur Bestätigung und weiteren Wunsch; Information bleibt in der Appleiste',async t=>{
    const lab=await setup(t,{hostSizing:'stepped'}),{page,radio}=await lab.join('Otterchen',client,320);
    await radio.locator('#open-wishes:not([disabled])').click();
    const surface=await view(page,'Overlay');
    const appearance=await surface.evaluate(()=>({background:getComputedStyle(document.getElementById('wishes-panel')).backgroundColor,font:getComputedStyle(document.getElementById('inline-wish-title')).fontFamily,button:getComputedStyle(document.getElementById('submit-wish')).backgroundColor}));
    assert.equal(appearance.background,'rgb(23, 25, 28)');assert.match(appearance.font,/Outfit/);assert.equal(appearance.button,'rgb(230, 199, 123)');
    await surface.waitForFunction(()=>Math.abs(document.getElementById('wishes-panel').getBoundingClientRect().height-innerHeight)<=1);
    const pictures=path.join(os.tmpdir(),'MischWerk-Pruefbilder','wunschbox-neu');fs.mkdirSync(pictures,{recursive:true});
    await surface.locator('#wishes-panel').screenshot({path:path.join(pictures,'wunschbox-build-355-'+client+'-320.png')});
    const song='Langer Interpret und vollständiger Musikwunsch '.repeat(7).slice(0,300);
    for(const text of [song,'Mein zweiter Wunsch']) {
      if(await surface.locator('#wish-compose-open').isVisible())await surface.locator('#wish-compose-open').click();
      await surface.locator('#wish-text').fill(text);await surface.locator('#submit-wish').click();
      await surface.locator('#wish-feedback.success').waitFor();
      await surface.locator('#wish-compose-open').waitFor();
    }
    await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor({state:'attached'});
    assert.equal(await radio.locator('#own-wish-position').isVisible(),false,'Mobile Leiste reserviert keine private Wunschfläche');
    assert.equal(await radio.locator('#own-wish-title').textContent(),song);
    assert.equal(await radio.locator('#own-wish-position').getAttribute('title'),'Dein Musikwunsch');
    assert.equal(await surface.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
    assert.doesNotMatch(await surface.locator('#wishes-panel').innerText(),/Deine offenen Wünsche|Platz 1|Mein zweiter Wunsch/);
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

for(const client of ['k3','stapp']) {
  test('Aktualisieren in beiden echten Appfenstern: '+client+' bestätigt Antwort, Fehler und Wiederholung',async t=>{
    const lab=await setup(t,{},true),{page,radio}=await lab.join('Otterchen',client);
    await radio.evaluate(()=>Client.sendEvent('mw:wish.submit',{text:'Ein Wunsch für den Aktualisierungstest',submissionId:'refresh-selected-wish-383'}));
    await radio.locator('#own-wish-position:not([hidden])').waitFor();
    for(const kind of ['studio','team']) {
      await openRadioAction(radio,kind==='studio'?'studio-tab':'team-tab');
      const frame=await view(page,'Overlay');
      const button=frame.locator(kind==='studio'?'#refresh-queue':'#refresh-radio-team');
      const feedback=frame.locator(kind==='studio'?'#queue-refresh-feedback':'#team-refresh-feedback');
      if(kind==='studio'&&await frame.locator('#studio-queue-tab').isVisible())await frame.locator('#studio-queue-tab').click();
      await frame.evaluate(()=>document.fonts.ready);
      await page.clock.runFor(500);
      await page.waitForFunction(()=>EmulatorLab.frames.pendingSizes.size===0);
      const size=await frame.evaluate(()=>[innerWidth,innerHeight]);
      // Die Antwort bis nach der Busy-/Doppelklickprüfung halten; 100 ms wären unter Last ein Wettlauf.
      const sendUser=lab.hub.sendUser.bind(lab.hub),responses=[];
      lab.hub.sendUser=(nick,message)=>{
        if(message.type==='sessionEvent'&&message.eventType==='mw:state'&&message.eventData.refreshRequestId)
          responses.push(()=>sendUser(nick,message));
        else sendUser(nick,message);
      };
      const at=lab.hub.trace.length;
      await button.locator('svg').click();
      assert.equal(await button.getAttribute('aria-busy'),'true');
      await button.evaluate(b=>b.click());
      await new Promise((resolve,reject)=>{
        const until=Date.now()+8000;
        function ready(){if(responses.length)resolve();else if(Date.now()>until)reject(Error('Keine Refreshantwort'));else setTimeout(ready,10);}
        ready();
      });
      lab.hub.sendUser=sendUser;responses.splice(0).forEach(deliver=>deliver());
      await feedback.filter({hasText:'Aktualisiert'}).waitFor();
      const requests=lab.hub.trace.slice(at).filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:refresh');
      assert.equal(requests.length,1);
      assert.ok(lab.hub.trace.some(e=>e.kind==='sessionEvent'&&e.eventType==='mw:state'&&e.eventData.refreshRequestId===requests[0].eventData.requestId));
      assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),size);
      lab.hub.faults.serverDelayMs=0;lab.hub.faults.dropServer=1;lab.hub.faults.dropServerType='mw:state';
      const dropped=lab.hub.trace.filter(e=>e.kind==='droppedServer').length;
      await button.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(n=>window.EmulatorLab.trace.filter(e=>e.kind==='droppedServer').length>n,dropped);
      await page.clock.runFor(15001);
      assert.match(await feedback.textContent(),/Keine Antwort/);
      assert.equal(await button.getAttribute('aria-busy'),null);
      await page.keyboard.press('Space');await feedback.filter({hasText:'Aktualisiert'}).waitFor();
      await page.clock.runFor(250);
      assert.deepEqual(await frame.evaluate(()=>[innerWidth,innerHeight]),size,'Rückmeldungen ändern keine Fenstermaße');
      assert.equal(await button.evaluate(b=>b===document.activeElement),true);
      await frame.evaluate(()=>Client.close());await page.locator('#overlays iframe').waitFor({state:'detached'});
    }
    assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
  });
}
test('Parserstart zeigt alle Besitzeraktionen und korrekte Client-/Cacheverträge', async t => {
  const lab = await setup(t), { page, radio } = await lab.join();
  assert.equal(await radio.locator('#studio-tab').isVisible(), true);
  assert.equal(await radio.locator('#team-tab').count(), 0);
  assert.deepEqual(await radio.evaluate(() => [Client.isK3Client(), Client.getHostFrame().getAppViewMode(),
    Client.getCacheInvalidationId() === Client.getCacheInvalidationId()]), [true, 'HEADERBAR', true]);
  assert.ok(await radio.evaluate(() => Array.from(document.scripts).filter(script => script.src.includes('/app/')).every(script => new URL(script.src).searchParams.has('v'))));
  await page.locator('#inspect').click();
  await page.waitForFunction(() => window.EmulatorLab.trace.some(item => item.kind === 'layout' && item.ready));
  assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});
test('Zwei echte Nutzer: natives Overlay, Entwurf, doppeltes Senden und Erledigt bis zum Nachrücken', async t => {
  const lab = await setup(t), owner = await lab.join();

  const listener = await lab.join('Testhoerer');
  const before = await listener.page.locator('#channel').boundingBox();
  await listener.radio.locator('#open-wishes').click();
  let surface = await view(listener.page, 'Overlay');
  assert.equal((await listener.page.locator('#channel').boundingBox()).y, before.y);
  assert.equal(await listener.radio.evaluate(() => innerHeight), 176);
  assert.equal(await surface.evaluate(() => Client.getHostFrame().getAppViewMode()), 'OVERLAY');
  await surface.locator('#wish-text').fill('a-ha – Take On Me');
  await surface.locator('#close-wishes').click();
  await listener.page.locator('#overlays iframe').waitFor({ state: 'detached' });
  await listener.radio.locator('#open-wishes').click(); surface = await view(listener.page, 'Overlay');
  assert.equal(await surface.locator('#wish-text').inputValue(), 'a-ha – Take On Me');
  await send(listener.page, { type: 'faults', value: { duplicateNext: true } });
  await listener.page.waitForFunction(() => window.EmulatorLab.state.faults.duplicateNext === true);
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: 'an die Moderation gesendet' }).waitFor();
  await listener.radio.locator('#own-wish-rank').filter({ hasText: 'Platz 1' }).waitFor();
  await owner.radio.locator('#studio-tab').click(); const studio = await view(owner.page, 'Overlay');
  const queueTab = studio.locator('#studio-queue-tab');
  if (await queueTab.isVisible()) await queueTab.click();
  await studio.locator('.request-text').filter({ hasText: 'Take On Me' }).waitFor();
  assert.match(await studio.locator('.request-sender').innerText(), /Testhoerer/);
  assert.equal(await studio.locator('#queue-count').innerText(), '1');
  await require('../support/studio-browser.cjs').resolveRequest(studio,'done');
  await studio.locator('#queue-count').filter({ hasText: '0' }).waitFor();
  await listener.radio.locator('#own-wish-position').waitFor({ state: 'hidden' });
  assert.deepEqual(lab.errors, []); assert.deepEqual(lab.external, []);
});
test('Verlorene Quittung: Timeout und Wiederholung behalten dieselbe submissionId', async t => {
  const lab = await setup(t);await lab.join('Otterchen');const { page, radio } = await lab.join('Polaroid');
  await send(page, { type: 'faults', value: { dropServer: 1, dropServerType: 'mw:wish.receipt' } });
  await page.waitForFunction(() => window.EmulatorLab.state.faults.dropServer === 1);
  await radio.locator('#open-wishes').click(); const surface = await view(page, 'Overlay');
  await surface.locator('#wish-text').fill('Testinterpret – Verlorene Quittung');
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: /bestätigt|Verbindung|erneut|Rückmeldung/ }).waitFor({ timeout: 20000 });
  await surface.locator('#submit-wish:not([disabled])').waitFor();
  await surface.locator('#submit-wish').click();
  await surface.locator('#wish-feedback').filter({ hasText: /an die Moderation gesendet/ }).waitFor();
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
test('Team-Popup öffnet die Verwaltung direkt und bleibt bei schrittweisen Hostantworten stabil', async t => {
  const lab = await setup(t, { hostSizing: 'stepped' }), { page, radio } = await lab.join('Otterchen', 'stapp');
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin')); const team = await view(page, 'Overlay');
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].some(entry => entry.mode === 'Overlay' && entry.height === 560));
  assert.deepEqual(await team.evaluate(()=>[innerWidth,innerHeight]),[500,560]);
  const initialHeight = await team.evaluate(() => innerHeight);
  assert.equal(await team.locator('#team-status,#team-status-tab').count(),0);
  assert.deepEqual(await team.locator('.team-tabs [role=tab]').allTextContents(),['Radio-Team','Bot-Texte','Verbindung']);
  assert.equal(await team.locator('#radio-moderator-form').isVisible(),true);
  assert.equal(await team.evaluate(()=>innerHeight),initialHeight);
  await page.waitForFunction(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    Math.abs(entry.element.getBoundingClientRect().height - entry.iframe.getBoundingClientRect().height) < 2));
  assert.equal(await page.evaluate(() => [...window.EmulatorLab.frames.sessions.values()].filter(entry => entry.mode === 'Overlay').every(entry =>
    entry.element.getBoundingClientRect().bottom <= document.querySelector('#stage').getBoundingClientRect().bottom)), true);
  assert.equal(await team.evaluate(() => Client.getHostFrame().getAppViewMode()), 'OVERLAY');
  assert.equal(await radio.evaluate(() => Client.isK3Client()), false);
  await team.locator('#radio-moderator-nick').fill('DJ-Test');
  await team.locator('#radio-moderator-form button[type=submit]').click();
  await team.locator('#radio-moderator-list').filter({ hasText: 'DJ-Test' }).waitFor();
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
  await radio.waitForFunction(() => document.querySelector('#radio-audio').paused === false);
  assert.ok(await radio.locator('#radio-audio').evaluate(audio => audio.volume <= .1));
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
test('Async-Stresstest, langsame Dateien und Rollenwechsel funktionieren ohne simulierte Besitzerfreigabe', async t => {
  const lab = await setup(t, { loader: 'async', resourceDelayMs: 80 });
  const owner = await lab.join();

  const { page, radio } = await lab.join('AppManager');
  assert.equal(await radio.locator('#studio-tab').isVisible(), false);
  assert.equal(await radio.locator('#team-tab').isVisible(), false);
  await page.locator('#role').selectOption('owner'); await page.locator('#apply-role').click();
  await page.waitForFunction(()=>window.EmulatorLab.state.users.find(u=>u.nick==='AppManager').role==='owner');
  assert.equal(await radio.locator('#studio-tab').isVisible(),false,'Inhaberrolle ersetzt keinen Radio-Team-Eintrag');
  assert.equal(await radio.locator('#team-tab').count(),0);
  assert.deepEqual(lab.errors, []);
});

test('Moderationserweiterung im strengen Emulator: private Wunschregie, Themenentwurf und Übergabenotizen zwischen drei Nutzern',async t=>{
  const lab=await setup(t,{hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp');
  await owner.page.setViewportSize({width:1800,height:1400});

  await owner.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let team=await view(owner.page,'Overlay');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  const dj=await lab.join('DJ-Test','k3'),listener=await lab.join('Testhoerer','stapp');
  await dj.page.setViewportSize({width:1800,height:1400});
  await listener.radio.locator('#open-wishes').click();const surface=await view(listener.page,'Overlay');
  await surface.locator('#wish-text').fill('Unser gemeinsamer Testwunsch');await surface.locator('#submit-wish').click();
  await listener.radio.locator('#own-wish-rank').filter({hasText:'Platz 1'}).waitFor();
  const oldPopup=await owner.page.locator('#overlays iframe').getAttribute('src');
  await owner.radio.locator('#studio-tab').click();
  const studio=await overlayView(owner.page,'studio');
  assert.notEqual(await owner.page.locator('#overlays iframe').getAttribute('src'),oldPopup);
  await require('../support/studio-browser.cjs').login(studio);await studio.locator('#off-air:not([disabled])').waitFor();
  if(await studio.locator('#studio-queue-tab').isVisible())await studio.locator('#studio-queue-tab').click();
  await require('../support/studio-browser.cjs').stageRequest(studio,'preparing');await listener.radio.locator('#own-wish-stage').filter({hasText:'In Vorbereitung'}).waitFor();
  await require('../support/studio-browser.cjs').stageRequest(studio,'playing','preparing');await listener.radio.locator('#own-wish-stage').filter({hasText:'Läuft gerade'}).waitFor();
  assert.equal(await listener.radio.locator('#own-wish-rank').textContent(),'Platz 1');
  if(await studio.locator('#studio-programme-tab').isVisible())await studio.locator('#studio-programme-tab').click();
  const runtime=lab.hub.runtime;
  assert.equal(await studio.locator('#studio-plan').count(),0);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:schedule.get'),false,'Moderation liest keine Sendezeiten');
  await revealStudio(studio,'#studio-topic');await studio.locator('#studio-topic').fill('Unser geplanter Themenabend');
  await studio.locator('#save-topic').click();await studio.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();
  await revealStudio(studio,'#handover-open');await studio.locator('#handover-open').click();await studio.locator('#handover-notes').fill('Bitte die Geburtstagsgrüße übernehmen.');
  await studio.locator('#handover-target').selectOption('DJ-Test');await studio.locator('#handover-request').click();
  await dj.radio.locator('#studio-tab').click();const target=await view(dj.page,'Overlay');
  await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();assert.match(await require('../support/studio-browser.cjs').readText(target,'#handover-note-text','handover'),/Geburtstagsgrüße/);
  await revealStudio(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Nächste Sendung');await revealStudio(target,'#handover-accept','handover');await target.locator('#handover-accept').click();
  await target.locator('#studio-received-notes:not([hidden])').waitFor({state:'attached'});
  await revealStudio(target,'#studio-notes-text');await target.locator('#studio-notes-text').filter({hasText:'Geburtstagsgrüße'}).waitFor();
  await target.locator('#studio-queue-tab').waitFor();
  await target.locator('#studio-queue-tab').click();
  await require('../support/studio-browser.cjs').resolveRequest(target,'done');await listener.radio.locator('#own-wish-position').waitFor({state:'hidden'});
  assert.equal(runtime.errors.length,0);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Übergabe in '+client+' bleibt bei höchstens 320 × 360 und verlorener Annahmequittung vollständig bedienbar',async t=>{
  const lab=await setup(t,{provider:'online',hostSizing:'stepped'}),owner=await lab.join('Otterchen','stapp',320);

  await owner.radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(owner.page,'team');
  await team.locator('#radio-moderator-nick').fill('DJ-Test');await team.locator('#add-radio-moderator').click();
  await team.locator('#radio-moderator-list').filter({hasText:'DJ-Test'}).waitFor();
  await team.locator('#close-overlay').click();await owner.page.locator('#overlays iframe').waitFor({state:'detached'});
  const dj=await lab.join('DJ-Test',client,320);
  for(const person of [owner,dj]){await person.radio.locator('#play-button:not([disabled])').click();await person.radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);await person.radio.locator('#radio-audio').evaluate(a=>{a.loop=true;});}
  await owner.radio.locator('#studio-tab').click();const source=await overlayView(owner.page,'studio');
  await require('../support/studio-browser.cjs').login(source);await source.locator('#off-air:not([disabled])').waitFor();
  await owner.page.setViewportSize({width:1800,height:490});await dj.page.setViewportSize({width:1800,height:490});
  await owner.page.locator('#overlays .app-window').evaluate(node=>{node.style.height='360px';});
  await source.waitForFunction(()=>innerWidth===320&&innerHeight===360);await revealStudio(source,'#handover-open');await source.locator('#handover-open').click();
  const notes='Private Notizen für die nächste Sendung. '.repeat(14).slice(0,500).trim();
  await revealStudio(source,'#handover-notes','handover');await source.locator('#handover-notes').fill(notes);
  await revealStudio(source,'#handover-request','handover');await source.locator('#handover-request').click();await source.locator('#handover-cancel').waitFor();
  await dj.radio.locator('#studio-tab').click();const target=await overlayView(dj.page,'studio');await revealStudio(target,'#handover-open');await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();
  assert.equal(await require('../support/studio-browser.cjs').readText(target,'#handover-note-text','handover'),notes);
  await revealStudio(target,'#handover-topic','handover');await target.locator('#handover-topic').fill('Die neue bestätigte Sendung');
  await revealStudio(target,'#handover-accept','handover');lab.hub.faults.dropServerType='mw:result';lab.hub.faults.dropServer=1;
  await target.locator('#handover-accept').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
  await revealStudio(target,'#off-air');assert.equal(await target.locator('#off-air').isDisabled(),false);
  assert.equal(await target.locator('#studio-topic').inputValue(),'Die neue bestätigte Sendung');
  assert.equal(await require('../support/studio-browser.cjs').readText(target,'#studio-notes-text'),notes);
  assert.equal(lab.hub.runtime.persistence.api().getObject('mischwerk.state.v1').moderator.userId,lab.hub.runtime.users.find('DJ-Test').state.id);
  assert.ok(lab.hub.trace.some(e=>e.kind==='droppedServer'&&e.nick==='DJ-Test'&&e.eventType==='mw:result'));
  for(const person of [owner,dj])assert.equal(await person.radio.locator('#radio-audio').evaluate(a=>!a.paused&&a.currentTime>0),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Native Wunschliste quittiert nur Texte innerhalb der sichtbaren Scrollfläche',async t=>{
 const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen','stapp');
 const listener=await lab.join('Testhoerer','k3');
 for(let i=1;i<=15;i++)await listener.radio.evaluate(i=>Client.sendEvent('mw:wish.submit',{submissionId:'visible-list-'+i,text:('Nativer Listenwunsch '+i+' ').repeat(8).slice(0,300)}),i);
 await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio');
 const acks=()=>lab.hub.trace.filter(e=>e.kind==='clientEvent'&&e.eventType==='mw:ackRequest');
 assert.equal(acks().length,0);await studio.locator('#studio-queue-tab').click();
 await studio.waitForFunction(()=>document.querySelectorAll('.queue-item').length===15);
 await assertEventually(()=>acks().length>0);
 assert.ok(acks().length<15,'Nicht sichtbare Wünsche bleiben ungelesen');
 assert.equal(acks().some(e=>e.eventData.id===15),false);
 await studio.locator('#queue-body').evaluate(n=>{n.scrollTop=n.scrollHeight;});
 await assertEventually(()=>acks().some(e=>e.eventData.id===15));
 assert.equal(await studio.locator('#studio-requests nav,.queue-item button').count(),0);
 assert.equal(lab.hub.trace.filter(e=>e.kind==='contentShow'&&e.mode==='Overlay').length,1);
 assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Alle nativen Öffnungen in '+client+' behalten getrennte native Anfänge und ausschließlich freigegebene Inhaltshöhen',async t=>{
 const lab=await setup(t,{provider:'online',resourceDelayMs:10}),{page,radio}=await lab.join('Otterchen',client,2290);await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);const entries=[['studio-tab','studio',640,580],['team-tab','team',500,560],['open-wishes','wishes',480,340]];
 for(const [from,kind] of entries){const previous=await page.locator('#overlays iframe').count()?await page.locator('#overlays iframe').getAttribute('src'):null;await openRadioAction(radio,from);await page.waitForFunction(previous=>{const n=document.querySelector('#overlays iframe');return n&&n.getAttribute('src')!==previous;},previous);await overlayView(page,kind);for(const [button,target,width,height] of entries){const old=await page.locator('#overlays iframe').getAttribute('src');await openRadioAction(radio,button);await page.waitForFunction(old=>document.querySelector('#overlays iframe')?.getAttribute('src')!==old,old);const frame=await overlayView(page,target);const actual=await frame.evaluate(()=>[innerWidth,innerHeight]);assert.equal(actual[0],width);if(target==='studio'||target==='wishes')assert.ok(actual[1]>0&&actual[1]<=height,'Natürliche Inhaltshöhe bleibt innerhalb der Ausgangsgröße');else assert.equal(actual[1],height);assertAllowedOverlaySizes(lab);assert.equal(await frame.locator('#'+target+'-panel').isVisible(),true);}}
 assert.equal(await radio.evaluate(()=>!document.getElementById('radio-audio').paused),true);assert.equal(lab.hub.trace.some(e=>e.eventType==='mw:view'),false);assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Rechteverlust löscht gespeicherte native Verwaltungsentwürfe vor erneuter Öffnung',async t=>{
 const lab=await setup(t),{page,radio}=await lab.join('Otterchen','stapp',2290);await radio.locator('#studio-tab:not([disabled])').click();let frame=await overlayView(page,'studio');await frame.locator('#studio-topic').fill('Privater Studioentwurf');await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));frame=await overlayView(page,'team');await frame.locator('#radio-moderator-nick').fill('Privater Teamnick');await radio.locator('#open-wishes:not([disabled])').click();await overlayView(page,'wishes');const runtime=lab.hub.runtime,record=runtime.users.find('Otterchen');const headerId=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Headerbar');runtime.event('Otterchen',headerId,'mw:removeRadioModerator',{userId:record.state.id});record.state.role='listener';let id=[...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).mode==='Overlay');runtime.event('Otterchen',id,'mw:refresh',{});await radio.locator('#studio-tab').waitFor({state:'hidden'});record.state.role='owner';runtime.event('Otterchen',headerId,'mw:addRadioModerator',{nick:'Otterchen'});runtime.event('Otterchen',id,'mw:refresh',{});await radio.evaluate(()=>Client.sendEvent('mw:refresh',{}));await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');assert.equal(await frame.locator('#studio-topic').inputValue(),'');assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Wiederöffnen über Moderation erhält den Wunschentwurf und setzt die Eingabesequenz der neuen Sitzung zurück',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','k3',2290);
  await radio.locator('#open-wishes:not([disabled])').click();let surface=await overlayView(page,'wishes');
  for(const text of ['Erste Eingabe','Zweite Eingabe','Erhaltener Wunschentwurf'])await surface.locator('#wish-text:not([disabled])').fill(text);
  await surface.locator('#close-wishes').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  await radio.locator('#studio-tab:not([disabled])').click();surface=await overlayView(page,'studio');
  await radio.locator('#open-wishes:not([disabled])').click();surface=await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Erhaltener Wunschentwurf');
  await surface.locator('#wish-text:not([disabled])').fill('Neue Eingabe nach Wiederöffnung');
  await radio.locator('#studio-tab:not([disabled])').click();assert.notEqual(await overlayView(page,'studio'),surface);
  await radio.locator('#open-wishes:not([disabled])').click();surface=await overlayView(page,'wishes');
  assert.equal(await surface.locator('#wish-text').inputValue(),'Neue Eingabe nach Wiederöffnung');
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Langer Wunschentwurf wird nach verborgenem Größenwechsel in '+client+' beim Zurückkehren vollständig neu gemessen',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen',client,700);
  await radio.locator('#open-wishes:not([disabled])').click();let frame=await overlayView(page,'wishes');
  const text=('Langer Wunschtext mit Interpret und Titel. ').repeat(8).slice(0,300);
  await frame.locator('#wish-text:not([disabled])').fill(text);
  await radio.locator('#studio-tab:not([disabled])').click();await overlayView(page,'studio');
  await page.locator('#width').fill('320');await page.locator('#width').dispatchEvent('change');
  await (await overlayView(page,'studio')).waitForFunction(()=>innerWidth===320);
  await radio.locator('#open-wishes:not([disabled])').click();const next=await overlayView(page,'wishes');assert.notEqual(next,frame);frame=next;
  await frame.waitForFunction(()=>{const n=document.getElementById('wish-text');return n.scrollHeight<=n.clientHeight+1;});
  assert.equal(await frame.locator('#wish-text').inputValue(),text);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(lab.hub.trace.some(e=>e.kind==='clientEvent'&&e.eventType==='mw:wish.submit'),false);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])for(const width of [320,2290])test('Overlaydesign: matte Tasten, stabile Druckfläche und Tastaturfokus in '+client+' bei '+width+' px',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,width);
  // Hauptaktionen der Arbeitsfenster verwenden denselben Goldton.
  for(const [entry,kind,control]of [['studio-tab','studio','save-topic'],['team-tab','team','add-radio-moderator'],['open-wishes','wishes','submit-wish']]){
    await openRadioAction(radio,entry);const frame=await overlayView(page,kind);
    if(kind==='team')await frame.locator('#radio-moderator-nick').fill('DJ-Test');
    if(kind==='wishes')await frame.locator('#wish-text:not([disabled])').fill('a-ha – Take On Me');
    if(kind==='studio'||kind==='team')assert.equal(await frame.locator('#studio-connection').isVisible(),false);
    if(kind==='studio'){await revealStudio(frame,'#studio-topic');await frame.locator('#studio-topic').fill('Prüfthema');await revealStudio(frame,'#save-topic');}
    const button=frame.locator('#'+control+':not([disabled])');await button.scrollIntoViewIfNeeded();
    await page.mouse.move(0,0);
    const resting=await button.evaluate(n=>{const s=getComputedStyle(n);return{background:s.backgroundColor,image:s.backgroundImage,shadow:s.boxShadow,textShadow:s.textShadow,transform:s.transform};});
    assert.equal(resting.background,'rgb(230, 199, 123)');assert.equal(resting.image,'none');
    assert.equal(resting.shadow,'none');assert.equal(resting.textShadow,'none');assert.equal(resting.transform,'none');
    await button.hover();await frame.waitForTimeout(180);const hover=await button.evaluate(n=>getComputedStyle(n).backgroundColor);assert.notEqual(hover,resting.background);
    const before=await button.boundingBox();await page.mouse.down();
    await frame.waitForTimeout(180);const down=await button.evaluate(n=>getComputedStyle(n).backgroundColor);assert.notEqual(down,hover);
    assert.deepEqual(await button.boundingBox(),before,'Drücken verschiebt oder skaliert die Taste nicht');
    await page.mouse.move(0,0);await page.mouse.up();
    await page.keyboard.press('Tab');await button.focus();
    assert.equal(await button.evaluate(n=>n.matches(':focus-visible')&&parseFloat(getComputedStyle(n).outlineWidth)>=3),true);
    const small=await frame.evaluate(()=>[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility==='visible'&&!n.closest('[hidden]')).filter(n=>{const r=n.getBoundingClientRect();return r.width<43.9||r.height<43.9;}).map(n=>n.id||n.textContent));
    assert.deepEqual(small,[],'Alle sichtbaren Tasten behalten mindestens 44 × 44 px');
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await frame.locator(kind==='wishes'?'#close-wishes':'#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  }
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Overlaydesign: kompakte Rückmeldungen bleiben in '+client+' bei Eingabe, Fehler und Versand an der Aktion',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,320,false);
  async function inline(frame,selector,parent){
    const box=frame.locator(selector);await box.waitFor();
    assert.equal(await box.evaluate((n,parent)=>!!n.closest('#'+parent),parent),true);
    assert.equal(await box.evaluate(n=>{const s=getComputedStyle(n);return s.position==='static'&&s.fontSize===(n.id==='topic-feedback'||document.documentElement.dataset.view==='team'?'12px':'13px')&&s.boxShadow==='none'&&n.scrollWidth<=n.clientWidth+1;}),true);
    await box.scrollIntoViewIfNeeded();
  }
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));let frame=await overlayView(page,'team');
  await frame.locator('#radio-moderator-nick').fill('DieserNickExistiertNicht');await frame.locator('#add-radio-moderator').click();
  await inline(frame,'#notice.error','radio-moderator-form');assert.equal(await frame.locator('#notice').getAttribute('role'),'alert');
  await frame.locator('#radio-moderator-nick').fill('DJ-Test');await frame.locator('#add-radio-moderator').click();await frame.locator('.team-member').filter({hasText:'DJ-Test'}).waitFor();
  await inline(frame,'#notice:not(.error)','radio-moderator-form');
  await frame.locator('.team-member').filter({hasText:'DJ-Test'}).locator(':scope > button').click();lab.hub.faults.failPersistence=true;
  await frame.locator('[data-confirm-removal]').click();await frame.locator('.team-removal-feedback:not([hidden])').waitFor();
  assert.equal(await frame.locator('#notice.error:visible').count(),0,'Entzugsfehler wird ausschließlich am betroffenen Mitglied ausgegeben');
  lab.hub.faults.failPersistence=false;
  await radio.locator('#studio-tab:not([disabled])').click();frame=await overlayView(page,'studio');
  await require('../support/studio-browser.cjs').login(frame);await frame.locator('#off-air:not([disabled])').waitFor();
  assert.equal(await frame.locator('#notice').isVisible(),false,'Bestätigte Moderation und Wunschboxstatus ersetzen die zusätzliche Erfolgsbox');
  await revealStudio(frame,'#studio-topic');await frame.locator('#studio-topic').fill('Unser Musikabend');await frame.locator('#save-topic').click();await frame.locator('#topic-feedback').filter({hasText:'gespeichert'}).waitFor();await inline(frame,'#topic-feedback','topic-form');
  await radio.locator('#open-wishes:not([disabled])').click();frame=await overlayView(page,'wishes');await frame.locator('#wish-text:not([disabled])').fill('https://example.com');await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.error').waitFor();assert.equal(await frame.locator('#wish-text').inputValue(),'https://example.com');
  const deliver=lab.hub.sendUser.bind(lab.hub),receipts=[];
  lab.hub.sendUser=(nick,message)=>{if(message.type==='sessionEvent'&&message.eventType==='mw:wish.receipt')receipts.push(()=>deliver(nick,message));else deliver(nick,message);};
  await frame.locator('#wish-text').fill('a-ha – Take On Me');await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.pending').waitFor();
  lab.hub.sendUser=deliver;receipts.splice(0).forEach(send=>send());await frame.locator('#wish-feedback.success').waitFor();
  assert.equal(await frame.locator('#wish-feedback').evaluate(n=>{const s=getComputedStyle(n);return s.fontSize==='13px'&&s.boxShadow==='none'&&n.scrollWidth<=n.clientWidth+1;}),true);
  assert.equal(await frame.locator('#wish-feedback').evaluate(n=>getComputedStyle(n).position==='relative'&&parseFloat(getComputedStyle(n).paddingLeft)>=38&&getComputedStyle(n,'::before').width==='18px'),true,'Quittungssymbol bleibt innerhalb der zugehörigen Rückmeldung');
  assert.equal(await frame.locator('#wish-rules').textContent(),'Welcher Song darf’s sein?');
  assertAllowedOverlaySizes(lab);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
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
  await radio.locator('#open-wishes:not([disabled])').click();let frame=await overlayView(page,'wishes');
  const source=await page.locator('#overlays iframe').getAttribute('src');
  await fits();assert.ok(await frame.evaluate(()=>innerHeight<=340),'Das leere Formular nutzt nur seine natürliche Höhe');
  async function fits(){
    await frame.waitForFunction(()=>{const p=document.getElementById('wishes-panel').getBoundingClientRect(),b=document.getElementById(document.getElementById('wish-form').hidden?'wish-compose-open':'submit-wish').getBoundingClientRect();return Math.abs(Math.ceil(p.height)-innerHeight)<=1&&b.top>=0&&b.bottom<=innerHeight+1&&document.body.scrollHeight<=document.body.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1;},null,{timeout:5000});
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  for(const text of ['Aha - Take On Me',('Interpret und ein vollständiger langer Songtitel. ').repeat(7).slice(0,300)]){
    if(await frame.locator('#wish-compose-open').isVisible())await frame.locator('#wish-compose-open').click();
    await frame.locator('#wish-text:not([disabled])').fill(text);await frame.locator('#submit-wish').click();await frame.locator('#wish-feedback.success').waitFor();await frame.locator('#wish-compose-open').waitFor();await fits();
    assert.equal(await page.locator('#overlays iframe').getAttribute('src'),source,'Kein Ersetzen oder erneutes Öffnen nach dem Absenden');
  }
  assert.equal(await frame.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
  await radio.locator('#own-wish-more').filter({hasText:'+1'}).waitFor({state:width<1200?'attached':'visible'});
  assert.equal(await radio.locator('#own-wish-position').isVisible(),width>=1200,'Eigene Wunschplatzierung bleibt nur im breiten Deck sichtbar');
  assert.equal(await radio.locator('#own-wish-title').textContent(),'Aha - Take On Me');
  if(process.env.MISCHWERK_CAPTURE_WISH196&&client==='stapp'&&[320,2290].includes(width)){
    await frame.locator('#wish-feedback').waitFor({state:'hidden'});await fits();
    await frame.locator('#wishes-panel').screenshot({path:path.resolve(__dirname,'../../docs/pruefung/oberflaeche/wunschbox/wunschbox-nach-versand-'+(width===320?320:560)+'.png')});
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
 assert.equal(await radio.locator('#open-wishes').isDisabled(),true);await lab.join('Otterchen',client,1280);
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
 await Promise.all(users.map(async item=>{await item.surface.locator('#submit-wish:not([disabled])').click();await item.surface.locator('#wish-feedback.success').waitFor();await item.radio.locator('#own-wish-title').filter({hasText:item.text}).waitFor();}));
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
  const runtime=lab.hub.runtime,key='mischwerk.android.private.v1',secret='s'.repeat(64),calls=[];
  runtime.persistence.api().setObject(key,{enabled:true,runtimeVerified:true,syncSecret:secret,relaySecret:'r'.repeat(64),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:7});
  runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,postURL:(url,p)=>{
    calls.push(url);p.onSuccess(JSON.stringify({accepted:true,serverTime:runtime.clock.now(),wishes:[]}),{getResponseCode:()=>200,getURLString:()=>url});
  }});
  runtime.invokeFunction(runtime.app.onAppStart,[]);assert.equal(calls.length,1);
  const saved=JSON.stringify(runtime.persistence.api().getObject(key));
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__settingsAudio=document.getElementById('radio-audio');});
  for(const option of ['', 'hilfe', 'einrichten', 'status', 'pruefen', 'http-pruefen', 'auth-pruefen']){
    await page.locator('#chat-input').fill('/mw verbindung '+option);await page.locator('#chat-form button').click();
  }
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#chat p')).filter(n=>n.textContent.includes('Diesen Aufruf gibt es nicht.')).length===7);
  assert.equal(await page.locator('#overlays iframe').count(),0);
  assert.equal(JSON.stringify(runtime.persistence.api().getObject(key)),saved);assert.equal(calls.length,1);
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
    if(process.env.MISCHWERK_CONNECTION_CAPTURE&&client==='k3')await page.locator('#overlays iframe').screenshot({path:path.resolve('docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-'+width+'.png')});
    await team.locator('.connection-secret summary').click();await team.locator('#relay-sync').fill('x'.repeat(64));await team.waitForTimeout(30);
    assert.equal(await team.locator('#relay-sync').inputValue(),'x'.repeat(64));assert.equal(await team.locator('#relay-save').isEnabled(),true);
    await team.locator('#team-texts-tab').click();assert.equal(await team.locator('#relay-sync').inputValue(),'');
    await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
    await team.locator('.connection-secret summary').click();
  }
  await team.locator('#relay-refresh').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
  await team.locator('.connection-secret summary').click();await team.locator('#relay-sync').fill('x'.repeat(64));
  await team.locator('#close-overlay').click();await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));team=await overlayView(page,'team');
  assert.equal(await team.locator('#team-connection-tab').getAttribute('aria-selected'),'true');await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();
  assert.equal(await team.locator('#relay-sync').inputValue(),'');
  assert.doesNotMatch(JSON.stringify(lab.hub.trace.filter(e=>e.eventType&&e.eventType.startsWith('mw:overlay.'))),/xxxxxxxx/);
  assert.equal(JSON.stringify(runtime.persistence.api().getObject(key)),saved);assert.equal(calls.length,1);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__settingsAudio&&!__settingsAudio.paused),true);
  assert.doesNotMatch(await team.locator('body').innerText(),/ssssssss|rrrrrrrr/);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

test('Neue Verbindungseinstellungen speichern und schalten nur nach ausdrücklicher Aktion',async t=>{
  const lab=await setup(t),{page,radio}=await lab.join('Otterchen','k3'),runtime=lab.hub.runtime,key='mischwerk.android.private.v1',calls=[];
  runtime.persistence.api().setObject(key,{enabled:false,runtimeVerified:false,syncSecret:'s'.repeat(64),relaySecret:'r'.repeat(64),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:3});
  runtime.context.KnuddelsServer.getExternalServerAccess=()=>({canAccessURL:()=>true,postURL:(url,p)=>{calls.push(url);p.onSuccess(JSON.stringify({accepted:true,serverTime:runtime.clock.now(),wishes:[]}),{getResponseCode:()=>200,getURLString:()=>url});}});
  await radio.evaluate(()=>Client.executeSlashCommand('/mw admin'));const team=await overlayView(page,'team');
  await team.locator('#team-connection-tab').click();await team.locator('#relay-status').filter({hasText:'ausgeschaltet'}).waitFor();
  await team.locator('.connection-secret summary').click();await team.locator('#relay-sync').fill('n'.repeat(64));await team.waitForTimeout(50);
  assert.equal(await team.locator('#relay-sync').inputValue(),'n'.repeat(64));await team.locator('#relay-save').click();
  await team.locator('#relay-result').filter({hasText:'Einstellungen gespeichert'}).waitFor();
  const stored=runtime.persistence.api().getObject(key);assert.equal(stored.syncSecret,'n'.repeat(64));assert.equal(stored.relaySecret,'r'.repeat(64));assert.equal(stored.enabled,false);assert.equal(stored.revision,4);assert.equal(calls.length,0);
  assert.equal(await team.locator('#relay-sync').inputValue(),'');assert.equal(await team.locator('#relay-save').isDisabled(),true);
  await team.locator('#relay-activate').click();await team.locator('#relay-status').filter({hasText:'Aktiv –'}).waitFor();assert.equal(calls.length,1);
  await team.locator('#relay-deactivate').click();await team.locator('#relay-status').filter({hasText:'ausgeschaltet'}).waitFor();assert.equal(runtime.persistence.api().getObject(key).enabled,false);assert.equal(calls.length,1);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Einheitliche /mw-Hilfe in '+client+' erhält die dauerhaft geöffnete App und laufendes Radio',async t=>{
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,2290);
  assert.deepEqual(Object.keys(lab.hub.runtime.app.chatCommands).sort(),['lauftext','mw','settopic','update']);
  await radio.locator('#play-button:not([disabled])').click();await radio.waitForFunction(()=>!document.getElementById('radio-audio').paused);
  await radio.evaluate(()=>{window.__mwAudio=document.getElementById('radio-audio');});
  const header=await page.locator('#headerbars iframe').getAttribute('src');
  for(const value of ['/mw','/mw homepage hilfe','/mw verbindung hilfe','/mw radio']) {
    await page.locator('#chat-input').fill(value);await page.locator('#chat-form button').click();
  }
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#chat p')).filter(n=>n.textContent.includes('Diesen Aufruf gibt es nicht.')).length===2);
  assert.ok(await page.locator('#chat').textContent().then(s=>s.includes('/mw admin')&&!s.includes('/mw verbindung status')));
  assert.equal(await page.locator('#overlays iframe').count(),0);assert.equal(await page.locator('#headerbars iframe').getAttribute('src'),header);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__mwAudio&&!__mwAudio.paused),true);
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for (const client of ['k3','stapp']) test('Verwaltung wird in '+client+' ausschließlich über /mw admin geöffnet und erhält Radio und Entwurf', async t => {
  const lab=await setup(t,{provider:'online'}),{page,radio}=await lab.join('Otterchen',client,2290);
  assert.equal(await radio.locator('#team-tab').count(),0);
  await radio.locator('#play-button:not([disabled])').click();
  await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__administrationAudio=document.getElementById('radio-audio');__administrationAudio.loop=true;});
  async function command(value='/mw admin') { await page.locator('#chat-input').fill(value); await page.locator('#chat-form button').click(); }
  await command('/mw verwaltung');await page.locator('#chat p').filter({hasText:'Deine Befehle findest du mit /mw.'}).waitFor();
  assert.equal(await page.locator('#overlays iframe').count(),0,'Der alte Unterbefehl öffnet kein Fenster');
  await command(); let team=await overlayView(page,'team');
  await team.locator('#radio-moderator-nick:not([disabled])').fill('Privater Verwaltungsentwurf');
  await team.locator('#close-overlay').click(); await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.equal(await radio.locator('#studio-tab').evaluate(n=>document.activeElement===n),true);
  await command(); team=await overlayView(page,'team');
  assert.equal(await team.locator('#radio-moderator-nick').inputValue(),'Privater Verwaltungsentwurf');
  assert.equal(await radio.evaluate(()=>window.__administrationAudio===document.getElementById('radio-audio')&&!__administrationAudio.paused),true);
  assert.ok(lab.hub.trace.some(e=>e.kind==='contentShow'&&e.mode==='Overlay'));
  await team.locator('#close-overlay').click(); await page.locator('#overlays iframe').waitFor({state:'detached'});
  if (process.env.MISCHWERK_ADMIN_CAPTURE && client==='stapp') {
    await page.setViewportSize({width:2700,height:1400});
    await radio.evaluate(()=>document.fonts.ready);
    await radio.locator('#open-schedule').evaluate(node=>node.blur());
    if(process.env.MISCHWERK_GLOW_CAPTURE)await radio.locator('.radio-program-face').evaluate(n=>{for(const a of n.getAnimations()){a.pause();a.currentTime=32000;}});
    const directory=path.resolve(__dirname,'../../docs/pruefung/oberflaeche/radio');
    await page.locator('#headerbars iframe').screenshot({path:path.join(directory,'vinyl-glow-desktop.png')});
    const preview=path.join(os.tmpdir(),'MischWerk-Pruefbilder');fs.mkdirSync(preview,{recursive:true});
    await radio.locator('#studio-tab').screenshot({path:path.join(preview,'moderation-button.png')});
    await page.locator('#width').fill('390'); await page.locator('#width').dispatchEvent('change');
    await radio.waitForFunction(()=>innerWidth===390); await page.locator('#headerbars iframe').screenshot({path:path.join(directory,'vinyl-glow-mobil.png')});
  }
  assert.deepEqual(lab.errors,[]); assert.deepEqual(lab.external,[]);
});


for(const client of ['k3','stapp'])test('Otterchen hat in '+client+' automatisch Zugang zur Moderationsanmeldung; andere Moderatoren brauchen einen Eintrag',async t=>{
  const lab=await setup(t,{provider:'online'}),owner=await lab.join('Otterchen',client,1280,false);
  assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true,'Otterchen als Inhaber erhält automatisch Zugriff');

  const dj=await lab.join('DJ-Test',client,390),manager=await lab.join('AppManager',client,390);
  assert.equal(await dj.radio.locator('#studio-tab').isVisible(),false);assert.equal(await manager.radio.locator('#studio-tab').isVisible(),false);
  await owner.page.locator('#chat-input').fill('/mw admin');await owner.page.locator('#chat-form button').click();const team=await overlayView(owner.page,'team');
  async function add(nick){await team.locator('#radio-moderator-nick').fill(nick);await team.locator('#radio-moderator-form button[type=submit]:not([disabled])').click();await team.locator('.team-member').filter({hasText:nick}).waitFor();}
  async function remove(nick){await team.locator('.team-member').filter({hasText:nick}).locator(':scope > button').click();await team.locator('[data-confirm-removal]:not([disabled])').click();await team.locator('.team-member').filter({hasText:nick}).waitFor({state:'detached'});}
  await add('DJ-Test');await dj.radio.locator('#studio-tab:not([hidden])').waitFor();assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true);assert.equal(await manager.radio.locator('#studio-tab').isVisible(),false);
  await remove('DJ-Test');await dj.radio.locator('#studio-tab').waitFor({state:'hidden'});
  await add('Otterchen');await owner.radio.locator('#studio-tab:not([hidden])').waitFor();
  await remove('Otterchen');assert.equal(await owner.radio.locator('#studio-tab').isVisible(),true);assert.equal(await team.locator('#radio-moderator-form').isVisible(),true,'Verwaltung bleibt für den Inhaber erreichbar');
  await add('DJ-Test');await dj.radio.locator('#studio-tab:not([hidden])').waitFor();
  await dj.radio.locator('#studio-tab').click();const source=await overlayView(dj.page,'studio');await require('../support/studio-browser.cjs').login(source);
  await source.locator('#off-air:not([disabled])').waitFor();await revealStudio(source,'#handover-open');await source.locator('#handover-open').click();
  await revealStudio(source,'#handover-target','handover');await source.locator('#handover-target').selectOption('Otterchen');
  await revealStudio(source,'#handover-request','handover');await source.locator('#handover-request').click();
  await owner.radio.locator('#studio-tab').click();const target=await overlayView(owner.page,'studio');await revealStudio(target,'#handover-open');await target.locator('#handover-open').click();
  await revealStudio(target,'#handover-accept','handover');await target.locator('#handover-accept').click();await target.locator('#handover-panel').waitFor({state:'hidden'});
  await revealStudio(target,'#off-air');assert.equal(await target.locator('#on-air').isVisible(),false);
  assert.ok(lab.hub.runtime.users.find('Otterchen').state.nicklistIcons.some(icon=>icon.path.endsWith('/moderator.png')));
  assert.ok(!lab.hub.runtime.users.find('DJ-Test').state.nicklistIcons.some(icon=>icon.path.endsWith('/moderator.png')));
  assert.deepEqual(lab.errors,[]);assert.deepEqual(lab.external,[]);
});

for(const client of ['k3','stapp'])test('Nicklistenstatus folgt echtem Playerfortschritt, Ton und bestätigter Moderation in '+client,async t=>{
  const lab=await setup(t,{provider:'online',authenticationTest:true});
  const {page,radio}=await lab.join('Otterchen',client,1280,false);
  const record=lab.hub.runtime.users.find('Otterchen');
  const icons=()=>record.state.nicklistIcons.map(icon=>path.basename(icon.path,'.png')).sort();
  async function waitIcons(expected){for(let i=0;i<80;i++){if(JSON.stringify(icons())===JSON.stringify(expected))return;await page.waitForTimeout(100);}assert.deepEqual(icons(),expected);}
  assert.deepEqual(icons(),['team']);
  await radio.locator('#play-button').click();await radio.waitForFunction(()=>document.getElementById('radio-audio').currentTime>.1);
  await radio.evaluate(()=>{window.__nickAudio=document.getElementById('radio-audio');__nickAudio.loop=true;});
  await waitIcons(['listener','team']);
  await radio.locator('#volume').fill('0');await waitIcons(['team']);
  assert.equal(await radio.evaluate(()=>!__nickAudio.paused),true);
  await radio.locator('#volume').fill('35');await waitIcons(['listener','team']);
  await page.locator('#visibility').click();await page.waitForTimeout(2200);assert.deepEqual(icons(),['listener','team']);
  await page.locator('#visibility').click();
  await radio.locator('#studio-tab').click();const studio=await overlayView(page,'studio',false);
  assert.deepEqual(icons(),['listener','team'],'Bloßes Öffnen startet keine Moderation');
  await studio.locator('#on-air').click();await studio.locator('#off-air').waitFor();await waitIcons(['moderator','team']);
  await studio.locator('#close-overlay').click();await page.locator('#overlays iframe').waitFor({state:'detached'});
  assert.deepEqual(icons(),['moderator','team'],'Fensterschließen erhält gültige Studioanmeldung');
  await radio.evaluate(()=>Client.sendEvent('mw:offAir',{}));await waitIcons(['listener','team']);
  await radio.locator('#play-button').click();await waitIcons(['team']);
  assert.equal(await radio.evaluate(()=>document.getElementById('radio-audio')===__nickAudio&&__nickAudio.paused&&__nickAudio.volume===.35),true);
  assert.ok(record.state.nicklistIcons.every(icon=>icon.width===(icon.path.endsWith('/team.png')?32:24)));
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

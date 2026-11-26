// Optional: Playwright/Edge mit lokalem Testton, ohne echte Sender-/Knuddels-Verbindungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.MISCHWERK_PLAYWRIGHT || 'playwright');
const { createHarness } = require('../support/knuddels.cjs');
const { configureStream } = require('../fixtures/stream.cjs');
const {reveal:revealStudio,readText:readStudioText,fits:studioFits,settle:studioSettle}=require('../support/studio-browser.cjs');
const {inspectLayout}=require('../support/layout-browser.cjs');
const root = path.resolve(__dirname, '../..');
const browserSource=process.env.MISCHWERK_TEST_UPLOAD?path.resolve(process.env.MISCHWERK_TEST_UPLOAD,'www'):path.join(root,'app/www');
let browser;

for (const k3 of [true, false]) test('X-Mas bleibt mit Lauflicht und Volltext innerhalb der Hosthöhe in ' + (k3 ? 'K3' : 'STAPP'), async t => {
  const song = {title:'Jump', artist:'Van Halen'};
  const {page,state,errors} = await setup(t, {station:true,k3,role:'listener',theme:'normal',parserIncludes:true,
    song,autoDj:true,viewport:{width:1645,height:540}});
  const play = page.locator('#play-button');
  const audio = page.locator('#radio-audio');
  const emitMedia = name => audio.evaluate((node,name) => node.dispatchEvent(new Event(name)),name);
  const pictures = path.join(os.tmpdir(),'MischWerk-Pruefbilder','radio','458');
  if (k3) fs.mkdirSync(pictures,{recursive:true});
  await page.getByText('Jump',{exact:true}).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.bar-logo,.radio-listener-logo').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  let revision = 0;
  const topic = 'Eine ausführliche Radiosendung mit besonderen Musikwünschen und vielen Gästen';
  const ownWish = 'Ein eigener Musikwunsch mit Platz, Bearbeitungsstatus und zusätzlichen Angaben. '.repeat(3).trim();
  async function snapshot(theme,withWish,ticker,long=false) {
    await page.evaluate(({state,theme,revision,withWish,ticker,long,topic,ownWish})=>{
      const wish={id:1,text:ownWish,position:1,stage:'queued'};
      __emit('mw:state',{...state,theme,revision,requestsEnabled:withWish,
        topic:long?topic:'MischWerk Radio Show',ticker:{text:'Frohe Weihnachten bei Radio MischWerk',enabled:ticker,speed:48,direction:'left',revision},
        wishPositions:{generation:'xmas',revision,available:true,total:long?1:0,page:0,pages:1,nextPosition:long?1:null,
          items:long?[wish]:[],nextItem:long?wish:null}});
    },{state,theme,revision:++revision,withWish,ticker,long,topic,ownWish});
    await studioSettle(page);
  }
  async function resize(width,height){ await resizeViewport(page,{width,height}); }
  function colors() {
    return page.evaluate(()=>{
      const style = getComputedStyle(document.querySelector('.radio-program-face'));
      return [getComputedStyle(document.body).backgroundColor,style.backgroundColor,style.backgroundImage,
        getComputedStyle(document.getElementById('radio-ticker')).backgroundColor];
    });
  }
  function dimensions() {
    return page.evaluate(()=>{
      const root=document.documentElement,deck=document.getElementById('radio-deck');
      const box=deck.getBoundingClientRect(),play=document.getElementById('play-button').getBoundingClientRect();
      const selectors=['#play-button','#open-schedule','#open-wishes','#mute-button','#volume','#radio-ticker-pause',
        '.xmas-read-trigger','.radio-brand img','.radio-listener-brand img','#track-title','#track-artist','#show-topic','#on-air-sign','#own-wish-title','#own-wish-stage'];
      const bounds=[],hits=[];
      for(const node of deck.querySelectorAll(selectors.join(','))){
        const rect=node.getBoundingClientRect();
        if(!rect.width||!rect.height)continue;
        const name=node.id||node.className;
        if(rect.left < -.5 || rect.right > innerWidth+.5 || rect.top < -.5 || rect.bottom > innerHeight+.5)
          bounds.push([name,rect.left,rect.top,rect.right,rect.bottom]);
        if(node.matches('button,input') && (rect.width < 43.99 || rect.height < 43.99 ||
          !node.contains(document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)))) hits.push([name,rect.left,rect.top,rect.width,rect.height]);
      }
      return {viewport:[innerWidth,innerHeight],requested:__sizes.at(-1)?.[1],height:box.height,
        centered:Math.abs((play.left+play.right)/2-innerWidth/2)<.5,bounds,hits,
        scrolling:[root,document.body,deck].map(node=>[node.scrollWidth-node.clientWidth,node.scrollHeight-node.clientHeight])};
    });
  }
  function motion() {
    return page.evaluate(()=>Array.from(document.querySelectorAll('.radio-xmas-lamp')).map((lamp,index)=>{
      const halo=document.querySelector('.radio-xmas-halos').children[index];
      const core=getComputedStyle(lamp,'::after'),shine=getComputedStyle(halo,'::before');
      return {phase:core.animationDelay,haloPhase:shine.animationDelay,core:Number(core.opacity),halo:Number(shine.opacity),
        name:core.animationName,haloName:shine.animationName};
    }));
  }
  async function freeze(time) {
    await page.evaluate(time=>{
      for(const animation of document.getAnimations()){
        if(animation.animationName!=='mw-xmas-chain')continue;
        animation.pause();
        animation.currentTime=time;
      }
    },time);
  }
  async function checkClosed() {
    const phases=await motion();
    assert.ok(phases.length>5 && phases.every(row=>row.name==='none' && row.haloName==='none' && row.core===0));
    assert.equal(await page.locator('.radio-xmas-halos').evaluate(node=>getComputedStyle(node).opacity),'0');
  }
  function checkGeometry(measured) {
    assert.ok(measured.centered,JSON.stringify(measured));
    assert.deepEqual(measured.scrolling,[[0,0],[0,0],[0,0]],JSON.stringify(measured));
    assert.deepEqual(measured.bounds, [],JSON.stringify(measured));
    assert.deepEqual(measured.hits, [],JSON.stringify(measured));
    assert.equal(measured.height,Math.min(measured.requested,measured.viewport[1]));
  }
  async function checkWave() {
    await freeze(2160);
    const rows=await motion();
    assert.ok(rows.every(row=>row.name==='mw-xmas-chain'&&row.phase===row.haloPhase&&Math.abs(row.core-row.halo)<.002));
    assert.ok(Math.min(...rows.map(row=>row.core))>=.33 && Math.min(...rows.map(row=>row.core))<=.35 &&
      Math.max(...rows.map(row=>row.core))>=.94);
    const cycle=3.6, phase=row=>Number.parseFloat(row.phase);
    const step=(phase(rows[1])-phase(rows[0])+cycle)%cycle;
    assert.ok(step>.25&&step<.9);
    for(let i=0;i<rows.length;i++){
      const next=rows[(i+1)%rows.length];
      assert.ok(Math.abs((phase(next)-phase(rows[i])+cycle)%cycle-step)<.0001,'Gleiche Phasenabstände einschließlich Rahmenschluss');
    }
  }
  for (const width of [1645,1920,1200,390,320]) {
    await resize(width,540);
    await snapshot('normal',true,false);
    const normalHeight=(await dimensions()).requested;
    await resize(width,width>=1200?normalHeight:500);
    const normal=await colors();
    if(k3&&width===1645) await page.screenshot({path:path.join(pictures,'normal-1645.png')});
    for (const withWish of [true,false]) {
      const suffix = width+'-'+(withWish?'mit-wunschbox':'ohne-wunschbox');
      await snapshot('xmas',withWish,width<1200);
      assert.deepEqual(await colors(),normal);
      const geometry=await dimensions();
      checkGeometry(geometry);
      const cable = page.locator('.radio-xmas-cable i').first();
      assert.match(await cable.evaluate(node=>getComputedStyle(node).backgroundImage),/xmas-kabel-fein\.png/);
      await checkClosed();
      if(k3) await page.screenshot({path:path.join(pictures,'xmas-'+suffix+'-aus.png')});
      await play.click();
      await checkClosed();
      await emitMedia('playing');
      await checkWave();
      if(k3) await page.screenshot({path:path.join(pictures,'xmas-'+suffix+'-an.png')});
      checkGeometry(await dimensions());
      if(width===1645 && withWish){
        const stable=await page.evaluate(async()=>{
          const lamp=document.querySelector('.radio-xmas-lamp');
          const animation=document.getAnimations().find(item=>item.animationName==='mw-xmas-chain');
          dispatchEvent(new Event('resize'));
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          return lamp===document.querySelector('.radio-xmas-lamp')&&document.getAnimations().includes(animation);
        });
        assert.ok(stable,'Neuvermessung bei unveränderter Geometrie erhält die laufende Animation');
      }
      if(k3&&withWish&&[1645,390].includes(width)){
        for(const [index,time] of [0,600,1200,1800,2400,3000,3600].entries()){
          await freeze(time);
          await page.screenshot({path:path.join(pictures,'lauflicht-'+width+'-'+index+'.png')});
        }
      }
      await emitMedia('waiting');
      await checkClosed();
      await emitMedia('playing');
      await freeze(2160);
      await audio.evaluate(node=>{
        Object.defineProperty(node,'error',{value:{code:2},configurable:true});
        node.dispatchEvent(new Event('error'));
        delete node.error;
      });
      await checkClosed();
      await play.click();
      await checkClosed();
      if(withWish)t.diagnostic('X-Mas '+width+' px, Normal-Anfrage '+normalHeight+' px: '+JSON.stringify(geometry));
    }
  }
  for (const [width,height] of [[1200,214],[1645,292],[1920,341],[3840,500]]) {
    await resize(width,height);
    await snapshot('xmas',true,false);
    await page.locator('#volume').evaluate(input=>{
      input.value='100';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    assert.equal(await page.locator('#volume-value').textContent(),'100 %');
    const spacing=await page.evaluate(()=>{
      const box=selector=>document.querySelector(selector).getBoundingClientRect();
      const gear=box('.transport');
      const gearWidth=parseFloat(getComputedStyle(document.querySelector('.transport'),'::before').width);
      const group=box('.radio-context'),volume=box('.volume-control');
      const percent=box('#volume-value'),slider=box('#volume'),actions=box('.radio-actions-panel');
      const divider=getComputedStyle(document.querySelector('.radio-actions-panel'),'::before');
      const middle=actions.left+parseFloat(divider.left),halfWidth=parseFloat(divider.height)/2;
      return {gaps:[Math.min(group.left,volume.left)-gear.x-(gear.width+gearWidth)/2,
        middle-halfWidth-Math.max(group.right,volume.right),actions.left-middle-halfWidth],
        slider:slider.width,percent:percent.right<=volume.right+.5,button:box('#open-wishes').height};
    });
    const scale=Math.min(width/1645,height/292);
    assert.ok(spacing.gaps.every((gap,index)=>gap+.1>=[20,24,20][index]*scale),JSON.stringify(spacing));
    assert.ok(spacing.percent&&spacing.slider>=44&&spacing.button>=44,JSON.stringify(spacing));
    checkGeometry(await dimensions());
    if(k3) await page.screenshot({path:path.join(pictures,'referenz-'+width+'-aus.png')});
    await play.click();
    await emitMedia('playing');
    await freeze(2160);
    if(k3) await page.screenshot({path:path.join(pictures,'referenz-'+width+'-an.png')});
    if(k3 && width===1645) {
      for(const [index,time] of [0,600,1200,1800,2400,3000,3600].entries()){
        await freeze(time);
        await page.screenshot({path:path.join(pictures,'referenz-lauflicht-'+index+'.png')});
      }
    }
    await play.click();
    t.diagnostic('Referenzraster '+width+' px: '+JSON.stringify(spacing));
  }
  song.title='Sehr langer Titel mit weiteren Informationen '.repeat(6).trim();
  await page.waitForFunction(title=>document.getElementById('track-title').textContent===title,song.title);
  for(const [width,height,ticker] of [[1645,292,false],[390,500,true],[320,500,true],[390,220,true],[320,220,true],
    [320,176,false],[1645,176,true],[1200,176,true]]) {
    await resize(width,height);
    await snapshot('xmas',true,ticker,true);
    const geometry=await dimensions();checkGeometry(geometry);
    t.diagnostic('Lange Texte '+width+' × '+height+' px: '+JSON.stringify(geometry));
    if(k3 && (width<=390 || height===292)){
      await page.screenshot({path:path.join(pictures,'xmas-lang-'+width+'-'+height+'.png')});
      await play.click();
      await emitMedia('playing');
      await freeze(2160);
      if(width===1645) {
        await page.locator('#volume').evaluate(input=>{
          input.value='100';
          input.dispatchEvent(new Event('input',{bubbles:true}));
        });
        assert.equal(await page.locator('#volume-value').textContent(),'100 %');
        assert.equal(await page.locator('#show-topic').evaluate(node=>getComputedStyle(node).webkitLineClamp),'2');
      }
      await page.screenshot({path:path.join(pictures,'xmas-lang-'+width+'-'+height+'-an.png')});
      await play.click();
    }
    for(const [key,expected] of [['music',song.title+'\n'+song.artist],['topic',topic],['wish',ownWish]]){
      const trigger=page.locator('[data-read='+key+']');
      await trigger.click();
      const reader=page.locator('#xmas-reader[open]');
      await reader.waitFor();
      let full='';
      const next=reader.locator('#xmas-reader-next');
      for(let read=0;read<20;read++){
        const copy=reader.locator('#xmas-reader-text');
        assert.ok(await copy.evaluate(node=>node.scrollHeight<=node.clientHeight&&node.scrollWidth<=node.clientWidth));
        full+=await copy.textContent();
        if(await next.isDisabled())break;
        await next.click();
      }
      assert.ok(full.includes(expected),JSON.stringify({key,length:full.length,expectedLength:expected.length}));
      await reader.getByRole('button',{name:'Schließen'}).click();
      await reader.waitFor({state:'detached'});
      assert.ok(await trigger.evaluate(node=>node===document.activeElement));
      checkGeometry(await dimensions());
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await play.click();
  await emitMedia('playing');
  assert.ok((await motion()).every(row=>row.name==='none'&&row.haloName==='none'&&row.core===1&&row.halo===1));
  await play.click();
  await checkClosed();
  assert.deepEqual(errors,[]);
});

test('X-Mas bleibt bei fehlender Weihnachtsgrafik bedienbar', async t => {
  const {page, errors} = await setup(t, {station:true, theme:'xmas', missingDecoration:true, parserIncludes:true});
  assert.match(await page.locator('html').getAttribute('class'), /theme-xmas/);
  assert.equal(await page.locator('#play-button').isEnabled(), true);
  assert.equal(await page.locator('#open-schedule').isEnabled(), true);
  assert.equal(await page.locator('#volume').isEnabled(), true);
  assert.equal(await page.evaluate(() => __sent.filter(event => event.type === 'mw:ready').length), 1);
  assert.deepEqual(errors, []);
});



for(const k3 of [true,false])test('Waagerechte Lautstärke steht unter Thema und Moderation und bleibt mit Maus und Tastatur bedienbar in '+(k3?'K3':'STAPP'),async t=>{
  const {page,state,errors}=await setup(t,{station:true,k3,activityAudio:true,role:'listener',viewport:{width:1280,height:220}});
  const wish={id:1,text:'Queen – We Will Rock You',position:1,stage:'queued'};
  await page.evaluate(({state,wish})=>__emit('mw:state',{...state,revision:2,topic:'Rock am Abend',wishPositions:{generation:'horizontal',revision:1,available:true,total:1,page:0,pages:1,nextPosition:1,items:[wish],nextItem:wish}}),{state,wish});
  await page.locator('#play-button').click();await page.evaluate(()=>{window.__verticalAudio=document.getElementById('radio-audio');window.__verticalRange=document.getElementById('volume');});
  await page.evaluate(()=>document.fonts.ready);
  for(const width of [1200,1280,1500,1920,2290,3840]){
    await resizeViewport(page,{width,height:220});
    const geometry=await page.evaluate(()=>{
      const r=s=>document.querySelector(s).getBoundingClientRect(),m=r('#radio-metadata'),c=r('.radio-context'),v=r('.volume-control'),input=r('#volume'),face=r('.radio-panel-face');
      const text=['.topic-label','#show-topic','.presenter'].map(s=>r(s));
      return {contextHeight:c.height,metadataHeight:m.height,range:[input.width,input.height],separate:text.every(t=>t.bottom<=v.top+1),centered:Math.abs((c.left+c.right-v.left-v.right)/2)<1,inside:v.top>=m.top-1&&v.bottom<=m.bottom+1,readoutGap:r('#volume-value').top-face.top,muteGap:face.bottom-r('#mute-button').bottom+8,scroll:document.getElementById('radio-metadata').scrollHeight>m.height+1};
    });
    assert.ok(geometry.range[0]>geometry.range[1]&&geometry.range[1]>=44,'Waagerechter Regler mit 44-px-Bedienhöhe: '+JSON.stringify({width,...geometry}));
    assert.ok(geometry.contextHeight<geometry.metadataHeight&&geometry.separate&&geometry.centered&&geometry.inside&&!geometry.scroll,'Regler passt vollständig mittig unter Thema und Moderation: '+JSON.stringify({width,...geometry}));
    assert.ok(geometry.readoutGap>=6&&geometry.muteGap>=6,'Prozentanzeige und Stummtaste halten Abstand zum sichtbaren Leistenrahmen: '+JSON.stringify({width,...geometry}));
    const range=await page.locator('#volume').boundingBox();
    await page.mouse.click(range.x+range.width-4,range.y+range.height/2);const right=Number(await page.locator('#volume').inputValue());
    await page.mouse.click(range.x+4,range.y+range.height/2);const left=Number(await page.locator('#volume').inputValue());
    assert.ok(right>=95&&left<=5,'Rechts laut, links leise: '+JSON.stringify({right,left}));
    await page.locator('#volume').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#volume').inputValue(),'1');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#volume').inputValue(),'0');
    await page.keyboard.press('End');assert.equal(await page.locator('#volume-value').textContent(),'100 %');
    assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
    assert.ok(await page.locator('#volume-value').evaluate(n=>{const r=document.createRange();r.selectNodeContents(n);const text=r.getBoundingClientRect(),box=n.getBoundingClientRect();return n.scrollWidth<=n.clientWidth+1&&text.left>=box.left&&text.right<=box.right&&text.top>=box.top&&text.bottom<=box.bottom;}),'100 Prozent bleibt vollständig lesbar');
    for(const value of ['48','100']){
      await page.locator('#volume').fill(value);
      assert.ok(await page.locator('#volume-value').evaluate(n=>n.getBoundingClientRect().top-document.querySelector('.radio-panel-face').getBoundingClientRect().top>=6),'Auch '+value+' Prozent mit Einfassung bleiben unterhalb der oberen Leistenkante');
    }
    if(width===1280){const folder=path.join(require('node:os').tmpdir(),'MischWerk-Pruefbilder','radio');fs.mkdirSync(folder,{recursive:true});await page.locator('.volume-control').screenshot({path:path.join(folder,'Waagerecht-100-'+(k3?'k3':'stapp')+'.png')});}
    await page.locator('#mute-button').click();assert.equal(await page.locator('#volume-value').textContent(),'0 %');
    await page.locator('#mute-button').click();assert.equal(await page.locator('#volume-value').textContent(),'100 %');
    assert.equal(await page.evaluate(()=>document.getElementById('radio-audio')===__verticalAudio&&!__verticalAudio.paused&&__verticalAudio.volume===1&&document.getElementById('volume')===__verticalRange),true);
  }
  await resizeViewport(page,{width:390,height:220});await page.locator('#volume').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#volume').evaluate(n=>n.getBoundingClientRect().height),44,'Kleine native Informationsfläche behält den erreichbaren waagerechten Regler');
  await page.locator('#volume').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#volume').inputValue(),'1');
  assert.equal(await page.evaluate(()=>document.getElementById('radio-audio')===__verticalAudio&&!__verticalAudio.paused&&document.getElementById('volume')===__verticalRange),true);
  assert.deepEqual(errors,[]);
});

for(const k3 of [true,false])test('Musik im Fokus zentriert die Informationsbereiche, gibt Wunschfläche frei und erhält Audio und Lauftext in '+(k3?'K3':'STAPP'),async t=>{
  const {page,state,errors}=await setup(t,{station:true,k3,role:'listener',activityAudio:true,viewport:{width:2290,height:220}});
  assert.equal(await page.locator('.volume-control').count(),1,'Eine gemeinsame Lautstärkeregelung');
  assert.equal(await page.locator('.now-playing .volume-control').count(),0);
  const modeUrl='https://stats.example.com/focus-mode';
  await page.route(modeUrl,r=>r.fulfill({contentType:'text/plain',body:'autodj'}));
  const wish={id:1,text:'Queen – We Will Rock You',position:1,stage:'queued'};let revision=state.revision;
  async function snapshot(withWish){
    await page.evaluate(({state,wish,revision,withWish,modeUrl})=>__emit('mw:state',{...state,station:{...state.station,modeUrl},revision,topic:'',
      ticker:{enabled:true,text:'Willkommen bei Radio MischWerk',speed:48,direction:'left',revision:1},
      wishPositions:{generation:'focus',revision,available:true,total:withWish?1:0,page:0,pages:1,nextPosition:withWish?1:null,items:withWish?[wish]:[],nextItem:withWish?wish:null}}),{state,wish,revision:++revision,withWish,modeUrl});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }
  await snapshot(true);await page.locator('#play-button').click();
  await page.evaluate(()=>{window.__focusAudio=document.getElementById('radio-audio');__focusAudio.volume=.38;});
  await page.evaluate(()=>document.fonts.ready);
  const pictures=path.join(require('node:os').tmpdir(),'MischWerk-Pruefbilder','radio');fs.mkdirSync(pictures,{recursive:true});
  async function captureFocus(name){
    const clip=await page.evaluate(()=>({x:0,y:0,width:innerWidth,height:Math.min(innerHeight,Math.ceil(document.getElementById('radio-deck').getBoundingClientRect().bottom)+16)}));
    await page.screenshot({path:path.join(pictures,name+'.png'),clip});
  }
  async function visibleSeparator(selector){
    const music=await page.locator('.now-playing').boundingBox();
    const zone=selector==='.radio-brand'?await page.locator('#radio-metadata').evaluate(n=>({x:n.getBoundingClientRect().left-parseFloat(getComputedStyle(document.getElementById('radio-panel')).columnGap),width:0})):await page.locator(selector).boundingBox();
    const shot=await page.screenshot({clip:{x:Math.floor(zone.x+zone.width)-3,y:Math.ceil(music.y)+2,width:6,height:Math.floor(music.height)-4},scale:'css'});
    const missing=await page.evaluate(async base64=>{
      const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height).data;
      let missing=0;for(let y=0;y<img.height;y++){
        let visible=false;for(let x=0;x<img.width;x++){const i=(y*img.width+x)*4;
          const rgb=[pixels[i],pixels[i+1],pixels[i+2]];
          if(Math.min(...rgb)>=38&&Math.max(...rgb)-Math.min(...rgb)<=4)visible=true;
        }if(!visible)missing++;
      }return missing;
    },shot.toString('base64'));
    assert.equal(missing,0,'Der Trenner an '+selector+' ist auf voller Informationshöhe durchgehend neutralgrau: '+JSON.stringify({viewport:page.viewportSize(),zone,music}));
  }
  for(const width of [3840,2290,1920,1500,1280,1100,960,700,560,390,320]){
    await resizeViewport(page,{width,height:width>=1200?220:650});await snapshot(true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Keine Überbreite bei '+width);
    const before=await page.locator('.now-playing').evaluate(n=>n.getBoundingClientRect().width);
    assert.ok(await page.locator('.radio-metadata').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Informationsbereiche passen bei '+width);
    const alignment=await page.locator('#track-title,#track-artist,#show-topic,.own-wish-position').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).textAlign));
    assert.ok(alignment.every(value=>value==='center'),'Mittige Texte bei '+width+': '+alignment);
    if(width>=1200){
      const wishFonts=await page.locator('.own-wish-label,.own-wish-rank,.own-wish-title,.own-wish-stage').evaluateAll(nodes=>nodes.map(n=>parseFloat(getComputedStyle(n).fontSize)));assert.ok(wishFonts[0]>=14&&wishFonts[1]>=18&&wishFonts[2]>=16&&wishFonts[3]>=14,'Wunschüberschrift, Platz, Text und Status sind lesbar vergrößert: '+wishFonts);
      const parts=await page.locator('.now-playing,.radio-context,.own-wish-position').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
      if(width>=1800)assert.ok(parts[2].left>=parts[1].right+15&&Math.abs(parts[0].width-(parts[2].right-parts[1].left))<1,'Wunsch steht rechts neben der Sendung; beide Seiten behalten gemeinsam dieselbe Breite');else assert.ok(Math.abs(parts[2].left-parts[1].left)<1&&parts[2].top>=parts[1].bottom+44,'Engere Hörerleisten zeigen den eigenen Wunsch unter Thema und Lautstärke innerhalb der rechten Spalte');
      assert.ok(await page.locator('.now-playing').evaluate(n=>Math.abs(n.getBoundingClientRect().height-document.getElementById('radio-metadata').clientHeight)<1),'Die laufende Musik nutzt wieder die vollständige Höhe links');
      const centering=await page.evaluate(()=>[['#track-title','.now-playing'],['#show-topic','.radio-context'],['#own-wish-rank','.own-wish-position']].map(([text,zone])=>{
        const n=document.querySelector(text),range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect(),parent=document.querySelector(zone),z=parent.getBoundingClientRect(),s=getComputedStyle(parent);return Math.abs((t.left+t.right-z.left-z.right-parseFloat(s.paddingLeft)+parseFloat(s.paddingRight))/2);
      }));
      assert.ok(centering.every(offset=>offset<1),'Tatsächliche Textmitten stimmen mit ihren Bereichen überein: '+centering);
      assert.ok(await page.locator('.volume-control').evaluate(n=>{const c=document.querySelector('.radio-context').getBoundingClientRect(),v=n.getBoundingClientRect(),m=document.getElementById('radio-metadata').getBoundingClientRect();return v.top>=c.bottom-1&&v.bottom<=m.bottom+1&&Math.abs((c.left+c.right-v.left-v.right)/2)<1;}),'Waagerechter Regler vollständig und mittig unter dem Thema');
    }
    const ticker=await page.locator('#radio-ticker').boundingBox(),bar=await page.locator('#radio-panel').boundingBox();
    assert.ok(ticker.y>=bar.y+bar.height-19,'Lauftext bleibt unter der Appleiste');
    if([1100,960].includes(width))for(const selector of ['.now-playing','.radio-brand'])await visibleSeparator(selector);
    if([2290,1280,390].includes(width))await captureFocus('Fokus-'+(k3?'k3':'stapp')+'-'+width);
    if(process.env.MISCHWERK_BALANCE_CAPTURE&&k3&&width===2290)await page.locator('#radio-metadata').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/radio/radio-bereiche-mit-wunsch.png'),animations:'disabled'});
    await snapshot(false);assert.equal(await page.locator('#own-wish-position').isVisible(),false);
    if([1100,960].includes(width))for(const selector of ['.now-playing','.radio-brand'])await visibleSeparator(selector);
    if(process.env.MISCHWERK_BALANCE_CAPTURE&&k3&&width===2290)await page.locator('#radio-metadata').screenshot({path:path.join(__dirname,'../../docs/pruefung/oberflaeche/radio/radio-bereiche-ohne-wunsch.png'),animations:'disabled'});
    if(width>=1200)assert.ok(await page.evaluate(()=>{const m=document.querySelector('.now-playing').getBoundingClientRect(),c=document.querySelector('.radio-context').getBoundingClientRect(),p=document.getElementById('play-button').getBoundingClientRect();return Math.abs(m.width-c.width)<1&&Math.abs(p.left+p.width/2-innerWidth/2)<1;}),'Ohne Wunsch nutzt Thema die freie rechte Fläche; beide Seiten bleiben gleich breit und Play exakt mittig');
    assert.equal(await page.locator('#radio-audio').evaluate(n=>n===window.__focusAudio&&!n.paused&&n.volume===.38),true);
  }
  await resizeViewport(page,{width:1100,height:500});await snapshot(true);
  // Eine auf Bildhöhe verkürzte Logofläche darf die 124-px-Linie nicht kürzen.
  await page.locator('.radio-brand').evaluate(n=>n.style.alignSelf='center');
  await visibleSeparator('.radio-brand');
  await page.locator('.radio-brand').evaluate(n=>n.style.removeProperty('align-self'));
  await page.evaluate(()=>{document.getElementById('track-title').textContent='I Still Haven’t Found What I’m Looking For – Live';document.getElementById('track-artist').textContent='U2';dispatchEvent(new Event('resize'));});await studioSettle(page);
  assert.ok(await page.locator('#radio-metadata').evaluate(n=>{const box=n.getBoundingClientRect();return ['.track-eyebrow','#track-title','#track-artist'].every(selector=>{const r=n.querySelector(selector).getBoundingClientRect();return r.top>=box.top-.5&&r.bottom<=box.bottom+.5;});}),'Zweizeiliger Musiktitel und Interpret passen gemeinsam vollständig in die Informationshöhe');
  await captureFocus('Fokus-'+(k3?'k3':'stapp')+'-lang');
  for(const width of [1100,960,700,390,320]){
    await resizeViewport(page,{width,height:220});
    for(const selector of ['#mute-button','#volume']){
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.equal(await page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Bedienung erreichbar bei '+width);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    assert.equal(await page.locator('#radio-audio').evaluate(n=>n===window.__focusAudio&&!n.paused&&n.volume===.38),true);
  }
  await resizeViewport(page,{width:1280,height:220});await snapshot(true);
  await page.evaluate(()=>{
    document.getElementById('track-title').textContent='Sehr langer Musiktitel mit weiteren Informationen '.repeat(15);
    document.getElementById('track-artist').textContent='Ein ebenfalls ausführlicher Interpret mit Gastmusikern';
    document.getElementById('show-topic').textContent='Eine ausführliche Radiosendung mit besonderen Musikwünschen und vielen Gästen'.slice(0,80);
    document.getElementById('radio-metadata').scrollTop=0;dispatchEvent(new Event('resize'));
  });await studioSettle(page);
  const textStart=await page.evaluate(()=>{const m=document.getElementById('radio-metadata').getBoundingClientRect();return ['.track-eyebrow','.topic-label'].map(selector=>document.querySelector(selector).getBoundingClientRect().top-m.top);});
  assert.ok(textStart.every(offset=>offset>=0),'Lange Gruppen bleiben vom Anfang an erreichbar: '+textStart);
  await page.locator('#volume').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#radio-audio').evaluate(n=>n===window.__focusAudio&&!n.paused&&n.volume===.38),true);
  assert.deepEqual(errors,[]);
});







for(const k3 of [true,false])test('Lauftext rahmt automatisch mit Pluszeichen und erhält Inhalt in '+(k3?'K3':'STAPP'),async t=>{
  const {page,state,errors}=await setup(t,{station:true,k3,viewport:{width:1280,height:230}});
  const examples=[['Grüße für alle','+++ Grüße für alle +++'],['+++ Grüße für alle +++','+++ Grüße für alle +++'],
    ['++++++  Grüße +++ an alle  ++++++','+++ Grüße +++ an alle +++'],['C++ + Musik','+++ C++ + Musik +++'],
    ['<b>Grüße</b>','+++ <b>Grüße</b> +++'],['Ä'.repeat(300),'+++ '+'Ä'.repeat(300)+' +++']];
  let revision=state.revision;
  for(const [text,expected] of examples){
    await page.evaluate(({s,text,revision})=>__emit('mw:state',{...s,revision,ticker:{text,enabled:true,speed:48,direction:'left',revision}}),{s:state,text,revision:++revision});
    assert.equal(await page.locator('#radio-ticker-track > span').first().textContent(),expected);
    assert.equal(await page.locator('#radio-ticker-track > span').nth(1).textContent(),expected);
    assert.equal(await page.locator('#radio-ticker-readable').textContent(),expected.slice(4,-4));
    assert.equal(await page.locator('#radio-ticker').getAttribute('title'),'Informationen von Radio MischWerk');
  }
  await page.evaluate(s=>__emit('mw:state',{...s,revision:100,ticker:{text:'+++ +++',enabled:true,speed:48,direction:'left',revision:100}}),state);
  assert.equal(await page.locator('#radio-ticker').isVisible(),false,'Reine alte Plus-Dekoration erzeugt keinen leeren Lauftext');
  assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:setTicker')),false,'Darstellung schreibt keine gespeicherten Texte um');
  assert.equal(await page.locator('#radio-ticker-track b').count(),0,'Auch mit Randmarkern bleibt Inhalt reiner Text');
  assert.deepEqual(errors,[]);
});

for(const fail of [false,true])test('Lauftext misst nach '+(fail?'fehlgeschlagener':'verzögerter')+' Rajdhani-Schrift und bleibt lesbar',async t=>{
  const {page,state,errors}=await setup(t,{station:true,viewport:{width:1280,height:230}});
  let release;const fontGate=new Promise(resolve=>{release=resolve;});
  await page.route('**/fonts/rajdhani-medium-latin.woff2*',async r=>{await fontGate;if(fail)await r.abort();else await r.fallback();});
  try{
    const text='+++ Grüße aus der Regie – Musik für alle! +++';
    await page.evaluate(({s,text})=>__emit('mw:state',{...s,revision:2,ticker:{text,enabled:true,speed:48,direction:'left',revision:1}}),{s:state,text});
    assert.equal(await page.locator('#radio-ticker').isVisible(),true);
    release();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
    const font=await page.locator('#radio-ticker-track > span').first().evaluate(n=>({
      family:getComputedStyle(n).fontFamily,weight:getComputedStyle(n).fontWeight,
      fonts:[...document.fonts].filter(f=>f.family==='Rajdhani').map(f=>f.status),
      width:n.getBoundingClientRect().width,duration:parseFloat(getComputedStyle(n.parentElement).animationDuration),
      text:n.textContent,innerHeight
    }));
    assert.match(font.family,/Rajdhani/);assert.equal(font.weight,'500');
    assert.ok(font.fonts.includes(fail?'error':'loaded'),JSON.stringify(font));
    assert.ok(Math.abs(font.width/font.duration-48)<0.1,'Laufdauer folgt der tatsächlich geladenen Schrift: '+JSON.stringify(font));
    assert.equal(font.text,text);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }finally{release();}
  assert.deepEqual(errors,[]);
});

















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

for(const k3 of [true,false])test('Heartbeat bei knappem Puffer und Uhrkorrektur in '+(k3?'K3':'STAPP'),async t=>{
 const {page,state,errors}=await setup(t,{station:true,clock:true,activityAudio:true,k3});
 await page.evaluate(state=>{
  let revision=state.revision;const send=Client.sendEvent;
  Client.sendEvent=function(type,data){send.call(this,type,data);if(type==='mw:refresh')__emit('mw:state',{...state,revision:++revision,refreshRequestId:data.requestId});};
 },state);
 await page.locator('#play-button').click();await page.clock.runFor(5000);
 await page.locator('#radio-audio').evaluate(a=>Object.defineProperty(a,'readyState',{configurable:true,value:2}));
 await page.clock.setSystemTime(await page.evaluate(()=>Date.now()-3600000));await page.clock.runFor(178000);
 assert.equal(await page.evaluate(()=>__slashCommands.length),1);
 await page.clock.setSystemTime(await page.evaluate(()=>Date.now()+7200000));await page.clock.runFor(181000);
 assert.equal(await page.evaluate(()=>__slashCommands.length),2);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');
 await page.locator('#radio-audio').evaluate(a=>Object.defineProperty(a,'currentTime',{configurable:true,value:a.currentTime}));
 await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>__slashCommands.length),2);
 await page.locator('#play-button').click();await page.clock.runFor(190000);assert.equal(await page.evaluate(()=>__slashCommands.length),2);
 assert.deepEqual(errors,[]);
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
async function setup(t, { moderation = true, nativeSizing = false, hostSteps = false, screenHeight, role = 'owner', registeredOwner = true, nick, parserIncludes = false, deviceScaleFactor = 1, station = false, delayedSong = false, delayedStatus = false, providerStatus = 'started', throwingPlay = false, clock = false, k3 = true, realAudio = false, activityAudio = false, cors = true, savedVolume, fontMode, wishSurface = false, loadingDelay, loadingPause = 0, initialRequest = false, view = 'radio', overlayState, theme, missingDecoration = false, autoDj = false, song = {title:'Testtitel', artist:'Testinterpret'}, viewport = { width: 960, height: 760 } } = {}) {
  const h = createHarness(); configureStream(h.config, station ? 'test-radio' : '');
  const owner=h.user(1,'Otterchen','owner'),ownerSession=h.open(owner);
  const user=role==='owner'?owner:h.user(2,role==='radioModerator'?'RadioMod':'Musikfreund',role==='channelModerator'?'moderator':role==='manager'?'manager':'listener');
  if(role==='owner'&&registeredOwner&&view!=='team')h.event(owner,ownerSession,'mw:addRadioModerator',{nick:owner.nick});
  if(role==='radioModerator')h.event(owner,ownerSession,'mw:addRadioModerator',{nick:user.nick});
  h.event(owner,ownerSession,'mw:setRequests',{enabled:true});
  const session=role==='owner'?ownerSession:h.open(user);
  if(nick){user.nick=nick;}
  if(moderation&&view==='studio')h.event(user,session,'mw:onAir',{});
  const state = h.state(user, session); state.revision=0; state.requestsEnabled=true; state.broadcastRemainingMs=45000; state.view = view;if(wishSurface)state.wishSurface=true;
  if(theme)state.theme=theme;
  if(autoDj)state.station.modeUrl='https://stats.example.com/radio-mode';
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
  await page.addInitScript(({ state, throwingPlay, k3, realAudio, activityAudio, savedVolume, parserIncludes, nativeSizing, screenHeight, fontMode }) => {
    if(fontMode==='missing-api')Object.defineProperty(document,'fonts',{value:undefined});
    if(savedVolume!==undefined){localStorage.setItem('mischwerk.volume.v1',String(savedVolume));}
    window.__sizeStates=[];
    if(screenHeight!==undefined||nativeSizing)Object.defineProperty(screen,'availHeight',{configurable:true,get(){
      return nativeSizing&&window.__sizes.length?innerHeight:(screenHeight??1080);
    }});
    window.__slashCommands = []; window.__sent = []; window.__handlers = {}; window.__rejects = [];   window.__sizes = []; window.__inclusions = [];
    window.__queueState=state;
    window.__emit = (type,data) => { if(type==='mw:state')window.__queueState=data; (window.__handlers[type]||[]).forEach(callback=>callback({type,data})); };
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
      sendEvent(type,data) { window.__sent.push({type,data});
        if(type==='mw:queue.read')queueMicrotask(()=>{const s=window.__queueState,p=s.wishPositions||{},rows=s.queueWindow?.length?s.queueWindow:s.queue;
          window.__emit('mw:queue.page',{requestId:data.requestId,viewRevision:s.viewRevision,generation:p.generation,revision:p.revision,
          offset:data.offset,next:Math.min(data.offset+10,rows.length),total:s.queueTotal,items:rows.slice(data.offset,data.offset+10)});});
      },
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
    // Synthetische Medien behalten auch im zusätzlichen lokalen Realm ihr kontrolliertes Modell.
    const append=Element.prototype.appendChild;
    Element.prototype.appendChild=function(node){
      const result=append.call(this,node);
      if(node.tagName==='IFRAME'&&node.src==='about:blank')node.contentWindow.HTMLMediaElement.prototype.play=function(){return this.play();};
      return result;
    };
    // Modellierte Medien bleiben vollständig synthetisch; auto darf keine echten Testdomains laden.
    const preloads=new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype,'preload',{configurable:true,
      get(){return preloads.get(this)||this.getAttribute('preload')||'';},set(value){preloads.set(this,String(value));this.setAttribute('preload','none');}});
    if(activityAudio){
      const states=new WeakMap();function media(node){if(!states.has(node))states.set(node,{paused:true,began:performance.now()});return states.get(node);}
      Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{configurable:true,get(){const s=media(this);return s.paused?0:(performance.now()-s.began)/1000;}});
      Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return media(this).paused;}});
      Object.defineProperty(HTMLMediaElement.prototype,'readyState',{configurable:true,get(){return media(this).paused?0:4;}});
      HTMLMediaElement.prototype.load=function(){};
      HTMLMediaElement.prototype.pause=function(){media(this).paused=true;};
      HTMLMediaElement.prototype.play=function(){Object.assign(media(this),{paused:false,began:performance.now()});this.dispatchEvent(new Event('playing'));return Promise.resolve();};
      return;
    }
    HTMLMediaElement.prototype.load = function () {};
    const paused=new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return paused.get(this)!==false;}});
    HTMLMediaElement.prototype.pause = function () {paused.set(this,true);};
    HTMLMediaElement.prototype.play = function () {
      paused.set(this,false);
      if (throwingPlay) { throw new Error('Playback not supported'); }
      return new Promise((resolve, reject) => window.__rejects.push(reject));
    };
  }, { state, throwingPlay, k3, realAudio, activityAudio, savedVolume, parserIncludes, nativeSizing, screenHeight, fontMode });
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
    await route.fulfill({ json: radioSong(song) });
  });
  if(autoDj)await page.route(state.station.modeUrl, route => route.fulfill({contentType:'text/plain',body:'autodj'}));
  await page.route(/^https:\/\/stats\.example\.com\/widget\/radio\/[a-z0-9-]+\/listener$/, route =>
    route.fulfill({ json: { listener_count: 12 } }));
  await page.route(/^https:\/\/stats\.example\.com\/widget\/radio\/[a-z0-9-]+$/,async route=>{
    if(delayedStatus){await statusGate;}
    await route.fulfill({json:{slug:new URL(route.request().url()).pathname.split('/').pop(),stream_status:providerStatus,status:'active',live:null}});
  });
  await page.route('http://mischwerk.test/**', async route => {
    const url = new URL(route.request().url());
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if(missingDecoration && /^img\/xmas-/.test(file)){await route.fulfill({status:404});return;}
    if(fontMode==='unavailable'&&file.endsWith('.woff2')){await route.fulfill({status:404});return;}
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
      loadingDelay==='stylesheet'?({studio:'css/studio/studio.css',team:'css/team/team.css',wishes:'css/wishes/wishbox.css'}[view]||'css/radio/radio-surface.css'):
      ({css:'css/shared/foundation.css',parallel:'css/shared/foundation.css',script:'js/start.js',logo:'img/mischwerk-logo.png',font:'fonts/outfit-latin.woff2',actions:'css/radio/radio-actions.css'}[loadingDelay]);
    if (delayedFile&&file===(/^(img|fonts)\//.test(delayedFile)?delayedFile:deliveredFile(view,delayedFile))) { await layoutGate; }
    await route.fulfill({ contentType: types[path.extname(file)], body: fs.readFileSync(absolute) });
  });
  const metadataRequested=station&&view==='radio'&&!delayedStatus&&providerStatus!=='stopped'?page.waitForRequest('https://stats.example.com/widget/radio/test-radio/track/current'):null;
  const navigation = page.goto('http://mischwerk.test/');
  if (loadingDelay) {
    await page.locator('#radio-placeholder, #radio-panel').first().waitFor({ state: 'attached' });
    if (loadingDelay === 'parallel') { await page.waitForFunction(() => window.__sent.some(event => event.type === 'mw:ready')); }
    if (loadingDelay === 'font') { await page.waitForFunction(() => document.fonts.status==='loading'&&window.__sent.some(event=>event.type==='mw:ready')); }
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
  await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  if(metadataRequested){await metadataRequested;}
  if(station&&view==='radio'&&!delayedStatus){await page.waitForFunction(()=>document.getElementById('stream-label').textContent!=='Prüfe …');}
  return { page, state, errors, requests, releaseSong, releaseStatus, loadingSnapshot };
}

function radioHeight(width) { return width>=1200?260:500; }
async function showStudioPane(page, queue) {
  if (!await page.locator(queue ? '#studio-requests' : '#studio-setup').isVisible()) {
    await page.locator(queue ? '#studio-queue-tab' : '#studio-programme-tab').click();
  }
}
















async function validDialogSizes(page) {
  const sizes=await page.evaluate(()=>window.__sizes);
  if(await page.locator('html').getAttribute('data-view')==='studio'){assert.ok(sizes.every(([w,h])=>w>0&&h>=20&&h<=1000));}else assert.deepEqual(sizes,[], 'Andere Verwaltungsfenster behalten ihre festen Maße');
}









test('Overlay bleibt beim Laden der lokalen Titelschrift ruhig und wird danach vollständig sichtbar',async t=>{
 for(const view of ['team','wishes']) {
  const {page,loadingSnapshot,errors}=await setup(t,{view,wishSurface:view==='wishes',overlayState:{},nativeSizing:true,hostSteps:true,loadingDelay:'font',loadingPause:180,viewport:{width:640,height:580}});
  assert.deepEqual(loadingSnapshot.sizes,[],'Keine vorzeitige Größenmessung: '+view);
  assert.equal(loadingSnapshot.initialized,false,'Keine sichtbare Ersatzschrift vor dem finalen Overlaylayout: '+view);
  await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  assert.equal(await page.evaluate(()=>document.fonts.status),'loaded');
  if(view==='studio')assert.match(await page.locator('#dialog-title').evaluate(n=>getComputedStyle(n).fontFamily),/Outfit/);
  assert.equal(await page.locator('.dialog-header:visible').evaluate(node=>Math.round(node.getBoundingClientRect().height)),76);
  assert.deepEqual(errors,[]);await page.context().close();
 }
});

test('Fehlende Schriftdateien oder Schrift-API lassen Overlays mit lesbarer Rückfallschrift öffnen',async t=>{
 for(const fontMode of ['unavailable','missing-api'])for(const view of ['team','wishes']){
  const {page,errors}=await setup(t,{view,fontMode,wishSurface:view==='wishes',overlayState:{},viewport:{width:320,height:580}});
  await page.waitForFunction(()=>document.documentElement.classList.contains('mw-ready'));
  await page.locator(view==='wishes'?'#close-wishes':'#close-overlay').click({trial:true});
  assert.equal(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:ready').length),1);
  assert.deepEqual(errors,[]);await page.context().close();
 }
});











test('Wunsch-Overlay löst beim Öffnen und Schließen keine zusätzliche Headergröße aus',async t=>{
  for(const k3 of [true,false])for(const width of [320,1200]){
    const {page,errors}=await setup(t,{k3,role:'listener',nativeSizing:true,hostSteps:true,viewport:{width,height:160}});
    await page.evaluate(()=>document.fonts.ready);await studioSettle(page);
    if(width<1200||!k3)await page.waitForFunction(()=>__sizes.length&&innerHeight===__sizes.at(-1)[1]);
    await page.waitForTimeout(250);
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
  for(const [view,role] of [['radio','owner'],['radio','listener'],['wishes','owner'],['team','owner']]){
    const {page,errors}=await setup(t,{view,role,parserIncludes:true,station:true});
    assert.equal(await page.title(),'MischWerk');
    assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('mw-ready')),true);
    assert.equal(await page.locator(view==='radio'?'#play-button':'#dialog-title').isVisible(),true);
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
 await page.route('http://mischwerk.test/css/shared/foundation.css',r=>r.abort());await page.reload();
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

test('Radio startet für alle Rollen ohne Vorhang, Werbeaudio oder Sperrfläche',async t=>{
 for(const k3 of [true,false])for(const role of ['owner','radioModerator','listener']){
  const {page,state,requests,errors}=await setup(t,{role,k3,station:true,activityAudio:true,viewport:{width:1360,height:220}});
  assert.equal(await page.locator('#radio-panel').isVisible(),true);
  assert.equal(await page.locator('#radio-curtain,#curtain-audio,#curtain-placeholder,.curtain-drape').count(),0);
  assert.equal(await page.locator('audio').count(),1);assert.equal(await page.locator('#radio-audio').getAttribute('src'),null,'Kein Autostart');
  await page.evaluate(state=>__emit('mw:state',{...state,revision:2,curtain:{closed:true,exempt:false}}),state);
  assert.equal(await page.locator('#radio-panel').evaluate(n=>!n.inert&&!n.hasAttribute('aria-hidden')),true,'Alte Zustandsantwort kann nichts sperren');
  await page.locator('#play-button').click();assert.equal(await page.locator('#radio-audio').evaluate(n=>!n.paused),true);
  assert.equal(requests.some(url=>/curtain|werbung\.mp3/.test(url)),false);assert.deepEqual(errors,[]);
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
  assert.equal(requests.some(url=>/\/listeners?$/.test(new URL(url).pathname)||url.includes('obsolete-listeners')),false);
  assert.equal(requests.some(url=>url.endsWith('/track/current')),true);
  assert.equal(requests.some(url=>url.includes('radio/listeners.js')),false);
  assert.deepEqual(errors,[]);await page.context().close();
 }
 for(const view of ['wishes','team']){
  const {page,requests,errors}=await setup(t,{station:true,view,clock:true});
  await page.clock.runFor(61000);
  assert.equal(await page.locator('#listener-count,#status-listeners,#status-listeners-detail').count(),0);
  assert.equal(requests.some(url=>url.endsWith('/listener')),false);assert.deepEqual(errors,[]);
 }
});

async function resizeViewport(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(() => document.documentElement.classList.contains('mw-ready'));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function publicActionContentsFit(page) {
 const measurements=await page.locator('#open-schedule,#open-wishes,#studio-tab').evaluateAll(buttons=>buttons.filter(b=>b.getClientRects().length).map(button=>{
  const b=button.getBoundingClientRect(),deck=document.querySelector('.radio-panel-face').getBoundingClientRect(),icon=button.querySelector('.public-action-icon').getBoundingClientRect(),copy=button.querySelector('.wish-button-copy'),c=copy.getBoundingClientRect();
  const title=copy.querySelector('strong'),t=title.getBoundingClientRect(),style=getComputedStyle(title),shown=!!copy.getClientRects().length,svg=Array.from(button.querySelectorAll('.public-action-icon svg')).find(n=>n.getClientRects().length).getBoundingClientRect();
  const caption=copy.querySelector('span'),hasCaption=!!caption&&!!caption.getClientRects().length&&getComputedStyle(caption).visibility!=='hidden';
  const actionStyle=getComputedStyle(button),space=parseFloat(actionStyle.getPropertyValue('--action-caption-space')),horizontal=actionStyle.flexDirection==='row';
  const hint=hasCaption?caption.getBoundingClientRect():null;
  return {id:button.id,viewport:innerWidth,closed:button.classList.contains('wishes-closed'),hasCaption,textCentered:!shown||(horizontal?Math.abs((t.top+t.bottom-b.top-b.bottom)/2)<.6:Math.abs((icon.top+c.bottom-b.top-b.bottom)/2)<.6),captionReserved:!shown||(Math.abs(c.height-t.height-space)<.6&&(!hint||(hint.top>=t.bottom-1&&hint.bottom<=b.bottom-1&&hint.left>=b.left&&hint.right<=b.right))),flat:actionStyle.boxShadow==='none'&&actionStyle.backgroundImage==='none',left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height,iconHeight:icon.height,iconY:icon.top,svgSize:svg.width,titleY:shown?t.top:null,font:shown?[style.fontFamily,style.fontSize,style.fontWeight,style.lineHeight]:null,insideDeck:b.left>=deck.left+3.5&&b.right<=deck.right-3.5&&b.top>=deck.top+3.5&&b.bottom<=deck.bottom-3.5,inside:[icon,...shown?[c]:[]].every(r=>r.left>=b.left-.5&&r.right<=b.right+.5&&r.top>=b.top-.5&&r.bottom<=b.bottom+.5),textFits:!shown||copy.scrollWidth<=copy.clientWidth+1,separate:!shown||icon.right<=c.left+.5||icon.bottom<=c.top+.5};
 }));
 for(const row of measurements)assert.ok(row.insideDeck&&row.inside&&row.textFits&&row.separate,'Tasten bleiben mit Abstand im Deck; Symbol und vollständige Beschriftung passen ohne Überlagerung: '+JSON.stringify(row));
 for(const row of measurements)assert.ok(row.textCentered&&row.captionReserved&&row.flat,'Flache Tasten zentrieren die Beschriftung und halten sichtbare Hinweise vollständig im Button: '+JSON.stringify(row));
 for(const row of measurements.slice(1)){
  for(const key of (row.viewport>=1200?['width','height','iconHeight','svgSize','left']:['width','height','iconHeight','iconY','svgSize']))assert.ok(Math.abs(measurements[0][key]-row[key])<.6,'Radiotasten haben gemeinsame Maße und Symbolhöhe ('+key+'): '+JSON.stringify(measurements));
  if(row.titleY!==null){if(row.viewport<1200)assert.ok(Math.abs(measurements[0].titleY-row.titleY)<.6,'Alle Hauptbeschriftungen stehen auch mit ausgeblendeten Hinweisen auf derselben Höhe: '+JSON.stringify(measurements));assert.deepEqual(row.font,measurements[0].font,'Gemeinsame Schriftmaße');}
 }
 if(measurements.length===3)assert.ok(Math.abs(measurements[0].viewport>=1200?(measurements[1].top-measurements[0].bottom)-(measurements[2].top-measurements[1].bottom):(measurements[1].left-measurements[0].right)-(measurements[2].left-measurements[1].right))<.6,'Gleicher Abstand zwischen allen drei Radiotasten: '+JSON.stringify(measurements));
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



test('Start bleibt bei verzögerten Ressourcen unsichtbar; erst die gemessene fertige Geometrie wird einmal an STAPP gemeldet', async t => {
  for (const loadingDelay of ['css','script','module','stylesheet','actions']) {
    for (const [width,k3] of [[960,false],[320,false],[960,true],[320,true]]) {
      const {page,loadingSnapshot,errors}=await setup(t,{k3,loadingDelay,viewport:{width,height:760}});
      assert.equal(loadingSnapshot.background,'rgb(0, 0, 0)');
      assert.equal(loadingSnapshot.visibility,'hidden');assert.equal(loadingSnapshot.initialized,false);
      assert.deepEqual(loadingSnapshot.sizes,[],'Keine geratenen Größen vor der geladenen Oberfläche');
      const sizes=await page.evaluate(()=>window.__sizes);
      assert.equal(sizes.length,1,'Eine gemeinsame natürliche Größenmessung für K3 und STAPP');
      assert.equal(sizes[0][0],0);assert.ok(sizes[0][1]>=160&&sizes[0][1]<=500);
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
    assert.equal(requests.filter(url=>url.endsWith('/css/wishes/wishbox.css')).length,1);
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



test('Skripte laden parallel zu langsamen Styles; vor Sichtbarkeit wird kein Musikwunsch quittiert', async t => {
  for (const view of ['radio','team']) {
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
  for (const view of ['radio','wishes','team']) {
    const { page, errors, requests } = await setup(t, { view });
    const files = selectedFiles(view);
    const actual = requests.filter(url => url.startsWith('http://mischwerk.test/') && /\.(js|css)$/.test(url));
    assert.deepEqual(actual.map(url => url.replace('http://mischwerk.test/','')).sort(), [...files].sort(), view);
    assert.equal(requests.some(url => url === 'http://mischwerk.test/js/app.js'), false);
    const hooks=await page.evaluate(()=>Object.fromEntries(Object.entries(__handlers).map(([type,list])=>[type,list.length])));
    await page.addScriptTag({ url: 'http://mischwerk.test/js/start.js' });
    await page.waitForFunction(() => document.querySelectorAll('script[src$="js/start.js"]').length === 2);
    assert.equal(await page.evaluate(() => window.__sent.filter(event => event.type === 'mw:ready').length), 1);
    assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(__handlers).map(([type,list])=>[type,list.length]))),hooks,'Wiederholter Einstieg registriert keinen Hook erneut');
    assert.equal(Object.entries(hooks).every(([type,count])=>count===(view==='studio'&&type==='mw:result'?2:1)),true);
    assert.deepEqual(errors, []);
  }
});

test('Langsames Original-Logo blockiert weder bedienbare Radioleiste noch korrekte erste Hosthöhe', async t => {
  for (const k3 of [false,true]) {
    const {page,errors,requests,loadingSnapshot} = await setup(t,{station:true,k3,loadingDelay:'logo',viewport:{width:960,height:760}});
    assert.equal(loadingSnapshot.initialized,true);
    assert.equal(loadingSnapshot.playEnabled,true);
    assert.equal(loadingSnapshot.visibility,'visible');
    assert.equal(loadingSnapshot.sizes.length,1,'Die natürliche schmale Höhe wird auch in K3 vor dem Logo angefordert');
    const measuredHeight=await page.locator('#radio-panel').evaluate(n=>Math.min(500,Math.max(160,Math.ceil(n.getBoundingClientRect().height))+16+(parseFloat(getComputedStyle(document.getElementById('radio-deck')).marginTop)||0)));
    assert.deepEqual(loadingSnapshot.sizes[0],[0,measuredHeight],'Die erste Höhe enthält bereits das vollständige Raster');
    assert.deepEqual(await page.evaluate(()=>window.__sizes),loadingSnapshot.sizes,'Das nachgeladene Logo erzeugt keinen weiteren Größenauftrag');
    assert.equal(await page.locator('#play-button').isEnabled(),true);
    await page.locator('#play-button').click();
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://stream.example.com/test-radio');
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.js')).length,selectedFiles('radio').filter(file=>file.endsWith('.js')).length);
    assert.equal(requests.filter(url=>url.startsWith('http://mischwerk.test/') && url.endsWith('.css')).length,selectedFiles('radio').filter(file=>file.endsWith('.css')).length);
    assert.equal(requests.some(url=>/\/js\/(studio|team|schedule)\//.test(url)),false);
    assert.deepEqual(errors,[]);
  }
});

for(const code of [1,2,3,4])test('Wiedergabefehler '+code+' bleibt im Hintergrund und erhält Leistenhöhe und Fokus ohne Nutzer-Fehlerlog',async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true,viewport:{width:412,height:320}});
 const height=await page.locator('#radio-deck').evaluate(n=>n.getBoundingClientRect().height);
 await page.locator('#play-button').click();
 assert.equal(await page.locator('#playback-status').count(),0,'Keine zusätzliche Diagnosezeile beim Start');
 await page.locator('#play-button').focus();
 await page.locator('#radio-audio').evaluate((audio,code)=>{Object.defineProperty(audio,'error',{configurable:true,value:{code,message:'https://private.invalid/secret'}});audio.dispatchEvent(new Event('error'));},code);
 const reports=await page.evaluate(()=>__sent.filter(e=>e.type==='mw:playback.error'));
 assert.equal(reports.length,0);
 assert.equal(await page.locator('#playback-status').count(),0);
 assert.doesNotMatch(await page.locator('body').textContent(),/Medienfehler|private|secret/);
 await page.locator('#radio-audio').evaluate(audio=>{Object.defineProperty(audio,'error',{configurable:true,value:null});});await page.clock.runFor(2100);
 assert.equal(await page.locator('#radio-deck').evaluate(n=>n.getBoundingClientRect().height),height);
 assert.match(await page.locator('#stream-label').textContent(),/Verbinden/);
 assert.equal(await page.locator('#play-button').evaluate(n=>n===document.activeElement),true);
 await page.locator('#radio-audio').evaluate(audio=>audio.dispatchEvent(new Event('playing')));
 assert.equal(await page.locator('#playback-status').count(),0);assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('playing')),true);
 assert.deepEqual(errors,[]);
});

test('Browserablehnungen bleiben im Hintergrund und eine nötige Freigabe bleibt zugänglich',async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true});
 for(const name of ['NotAllowedError','NotSupportedError','SecurityError','AbortError','Unbekannt']){
  await page.locator('#play-button').click();
  await page.evaluate(name=>__rejects.at(-1)({name,message:'<img src=x> https://private.invalid/secret'}),name);
  assert.equal(await page.locator('#playback-status').count(),0);
  assert.doesNotMatch(await page.locator('body').textContent(),/private|secret|<img/);
  assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),String(name!=='NotAllowedError'));
  if(name==='NotAllowedError'){
   assert.match(await page.locator('#stream-label').textContent(),/Tippen zum Starten/);
   assert.match(await page.locator('#stream-badge').getAttribute('aria-label'),/Freigabe/);
   const calls=await page.evaluate(()=>__rejects.length);await page.clock.runFor(61000);
   assert.equal(await page.evaluate(()=>__rejects.length),calls);
   assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:playback.error')),false);
   await page.locator('#play-button').click();
  }
  await page.locator('#play-button').click();assert.equal(await page.locator('#playback-status').count(),0);
 }
 assert.deepEqual(errors,[]);
});

for(const k3 of [true,false])test('Realm-Play umgeht eine eigene Play-Attrappe mit echtem Audio und verwendet ein iframe erneut in '+(k3?'K3':'STAPP'),async t=>{
 const {page,errors}=await setup(t,{station:true,realAudio:true,k3});
 await page.locator('#radio-audio').evaluate(audio=>{window.__ownCalls=0;window.__ownAudio=audio;window.__ownWrapper=function wrappedPlay(){__ownCalls++;return Promise.resolve();};audio.play=__ownWrapper;});
 await page.locator('#play-button').click();await waitRadioPlaying(page);
 assert.equal(await page.evaluate(()=>__ownCalls),0);assert.equal(await page.locator('iframe[src="about:blank"]').count(),1);
 await page.evaluate(()=>{window.__realmFrame=document.querySelector('iframe[src="about:blank"]');});
 await page.locator('#radio-audio').evaluate(audio=>{Object.defineProperty(audio,'error',{configurable:true,value:{code:2}});audio.dispatchEvent(new Event('error'));Object.defineProperty(audio,'error',{configurable:true,value:null});});
 assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:playback.error')),false);
 assert.equal(await page.evaluate(()=>__ownAudio.play===__ownWrapper),true);
 await page.locator('#play-button').click();await page.locator('#play-button').click();await waitRadioPlaying(page);
 assert.equal(await page.evaluate(()=>document.querySelector('iframe[src="about:blank"]')===__realmFrame&&document.getElementById('radio-audio')===__ownAudio&&__ownCalls===0),true);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('iframe[src="about:blank"]').count(),0);assert.deepEqual(errors,[]);
});

for(const k3 of [true,false])test('Startvarianten bleiben unverändert im einen Browserplayer in '+(k3?'K3':'STAPP'),async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true,k3});
 await page.locator('#radio-audio').evaluate(audio=>{
  window.__variantCalls=[];
  Object.defineProperty(audio,'paused',{configurable:true,get:()=>true});Object.defineProperty(audio,'readyState',{configurable:true,get:()=>4});
  audio.play=()=>{__variantCalls.push(audio.muted);audio.dispatchEvent(new Event('play'));return Promise.resolve();};
 });
 async function fail(){await page.clock.runFor(101);await page.locator('#radio-audio').evaluate(audio=>{Object.defineProperty(audio,'error',{configurable:true,value:{code:2}});audio.dispatchEvent(new Event('error'));Object.defineProperty(audio,'error',{configurable:true,value:null});});}
 await page.locator('#play-button').click();await fail();await page.clock.runFor(2000);
 assert.deepEqual(await page.evaluate(()=>__variantCalls),[false,false]);await fail();await page.clock.runFor(3000);
 assert.deepEqual(await page.evaluate(()=>__variantCalls),[false,false,true]);await fail();await page.clock.runFor(5000);
 assert.equal(await page.evaluate(()=>__variantCalls.length),3);await page.clock.runFor(4000);assert.equal(await page.evaluate(()=>__variantCalls.length),3);
 await page.locator('#radio-audio').evaluate(audio=>audio.dispatchEvent(new Event('canplay')));assert.equal(await page.evaluate(()=>__variantCalls.length),4);
 await fail();await page.clock.runFor(9000);assert.deepEqual(await page.evaluate(()=>__variantCalls),[false,false,true,false,false]);await fail();
 assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:playback.error')),false);assert.deepEqual(errors,[]);
});

for(const k3 of [true,false])test('Pausenexperiment zählt drei Fortsetzungen im bestehenden Browserplayer ohne Nutzer-Fehlerdiagnose in '+(k3?'K3':'STAPP'),async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true,k3});
 await page.locator('#radio-audio').evaluate(audio=>{
  window.__resumeCalls=0;window.__resumeLoads=0;
  for(const [key,value] of Object.entries({paused:true,readyState:3,currentTime:3.5,buffered:{length:1,end:()=>7},played:{length:2}}))
   Object.defineProperty(audio,key,{configurable:true,get:()=>value});
  audio.load=()=>{__resumeLoads++;};audio.play=()=>{__resumeCalls++;audio.dispatchEvent(new Event('play'));return Promise.resolve();};
 });
 await page.locator('#play-button').click();
 await page.locator('#radio-audio').evaluate(audio=>{for(const type of ['timeupdate','timeupdate','volumechange','ratechange'])audio.dispatchEvent(new Event(type));});
 await page.clock.runFor(2999);assert.equal(await page.evaluate(()=>__resumeCalls),1);
 await page.clock.runFor(1001);assert.equal(await page.evaluate(()=>__resumeCalls),2);
 await page.clock.runFor(4000);assert.equal(await page.evaluate(()=>__resumeCalls),3);
 await page.clock.runFor(4000);assert.equal(await page.evaluate(()=>__resumeCalls),4);
 assert.equal(await page.evaluate(()=>__resumeLoads),2,'Quelle und Puffer bis zum Budgetende erhalten');
 await page.clock.runFor(4000);
 const reports=await page.evaluate(()=>__sent.filter(e=>e.type==='mw:playback.error'));
 assert.equal(reports.length,0);assert.match(await page.locator('#stream-label').textContent(),/Verbinde erneut/);
 await page.locator('#play-button').click();const calls=await page.evaluate(()=>__resumeCalls);
 await page.clock.runFor(60000);assert.equal(await page.evaluate(()=>__resumeCalls),calls);assert.deepEqual(errors,[]);
});

test('Startzeitablauf wird nach 30 Sekunden intern gemeldet und Stop beendet die Wiederholung',async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true});await page.locator('#play-button').click();
 await page.clock.runFor(29900);assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:playback.error')),false);
 await page.clock.runFor(201);assert.match(await page.locator('#stream-label').textContent(),/Verbinde erneut/);assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:playback.error')),false);
 assert.equal(await page.locator('#playback-status').count(),0);
 await page.locator('#play-button').click();const count=await page.evaluate(()=>__sent.filter(e=>e.type==='mw:playback.error').length);
 await page.clock.runFor(61000);assert.equal(await page.evaluate(()=>__sent.filter(e=>e.type==='mw:playback.error').length),count);assert.deepEqual(errors,[]);
});


test('Verspätete Play-Ablehnung eines alten Versuchs stoppt keinen neuen Start', async t => {
  const { page, errors } = await setup(t, { station: true });
  await page.locator('#play-button').click(); await page.locator('#play-button').click(); await page.locator('#play-button').click();
  await page.evaluate(() => window.__rejects[0](new Error('alter Start')));
  assert.equal(await page.locator('#play-button').getAttribute('aria-label'), 'Radio stoppen');
  assert.equal(await page.locator('#radio-audio').getAttribute('src'), 'https://stream.example.com/test-radio'); assert.deepEqual(errors, []);
});
test('Synchroner Verbindungsfehler hält Hörwunsch und kündigt Wiederherstellung an',async t=>{
 const {page,errors}=await setup(t,{station:true,throwingPlay:true,clock:true});await page.locator('#play-button').click();
 assert.equal(await page.locator('#playback-status').count(),0);assert.match(await page.locator('#stream-badge').getAttribute('aria-label'),/automatisch wieder/);
 assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');await page.clock.runFor(60000);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');await page.locator('#play-button').click();assert.deepEqual(errors,[]);
});
test('Späte Medienereignisse nach bewussten Stop bleiben wirkungslos',async t=>{
 const {page}=await setup(t,{station:true,clock:true});await page.locator('#play-button').click();await page.locator('#play-button').click();
 await page.locator('#radio-audio').evaluate(a=>['pause','ended','error','playing','stalled'].forEach(type=>a.dispatchEvent(new Event(type))));await page.clock.runFor(60000);
 assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
});
test('Alte Songantwort darf eine entfernte Senderkonfiguration nicht überschreiben', async t => {
  const { page, state, releaseSong } = await setup(t, { station: true, delayedSong: true });
  const cancelled=page.waitForEvent('requestfailed',{predicate:r=>r.url()==='https://stats.example.com/widget/radio/test-radio/track/current'});
  state.station = { configured: false, streamUrl: '', stationUrl: '', name: 'MischWerk',metadataEndpoints:[] };
  await page.evaluate(state => window.__emit('mw:state', state), state);
  await cancelled;releaseSong();await page.waitForTimeout(20);
  assert.equal(await page.locator('#track-title').textContent(), '');
  assert.equal(await page.locator('#track-title').isVisible(), false);
  assert.equal(await page.locator('#play-button').isDisabled(), true);
});
test('Zehn Sekunden Versandwartezeit plus langsame HTTP-Antwort erzeugen keinen vorzeitigen Wunschfehler',async t=>{
 const {page,errors}=await setup(t,{clock:true,view:'wishes'});
 await page.locator('#wish-text').fill('Langsame Bestätigung');await page.locator('#submit-wish').click();
 await page.clock.runFor(19999);
 assert.equal(await page.locator('#wish-feedback').evaluate(n=>n.classList.contains('error')),false);
 assert.equal(await page.locator('#submit-wish').isDisabled(),true);
 await page.evaluate(()=>{const request=__sent.findLast(e=>e.type==='mw:wish.submit');
  __emit('mw:wish.receipt',{submissionId:request.data.submissionId,accepted:true,message:'Dein Wunsch ist dabei!'});});
 assert.equal(await page.locator('#wish-feedback').evaluate(n=>n.classList.contains('success')),true);
 assert.equal(await page.locator('#wish-text').inputValue(),'');assert.deepEqual(errors,[]);
});
test('Erneuter identischer Wunsch nach Bestätigungs-Timeout behält seine Übertragungs-ID', async t => {
  const { page } = await setup(t, { clock: true, view:'wishes' });
  await page.locator('#wish-text').fill('Band – Song');
  await page.locator('#submit-wish').click(); await page.clock.runFor(25010);
  await page.locator('#submit-wish').click();
  const requests = await page.evaluate(() => window.__sent.filter(event => event.type === 'mw:wish.submit'));
  assert.equal(requests.length, 2); assert.ok(requests[0].data.submissionId);
  assert.equal(requests[0].data.submissionId, requests[1].data.submissionId);
});
test('Veralteter Zustand setzt keine neuere Wunschbox-Entscheidung zurück', async t => {
  const {page,state}=await setup(t,{view:'wishes'});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:4,requestsEnabled:false}),state);
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:3,requestsEnabled:true}),state);
  assert.match(await page.locator('#wish-status').textContent(),/geschlossen/);
});

test('Radioanordnung hält Hauptaktionen in natürlicher Höhe sichtbar und ordnet mobile Informationen untereinander', async t => {
  const {page,state,errors}=await setup(t,{station:true,viewport:{width:1440,height:160}});
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:{title:'Am Fenster',artist:'Puhdys & City'}}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent==='Am Fenster');
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Die größten Hits der 80er und 90er',moderator:{nick:'Otterchen'}}),state);
  for(const width of [1440,1100,1099,1024,868,768,760,759,700,699,390,320]) {
    await resizeViewport(page,{width,height:width>=1200?260:500});
    await page.waitForFunction(w=>document.documentElement.classList.contains('radio-constrained')===(w<=1350&&innerHeight<360),width);
    await page.locator('#radio-metadata').evaluate(n=>{n.scrollTop=0;});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Kein horizontaler Überlauf bei '+width);
    for(const selector of ['#play-button','#track-title','#track-artist','#open-schedule','#open-wishes']) {
      const box=await page.locator(selector).boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=page.viewportSize().height+.5,selector+' sichtbar bei '+width);
      if(selector.includes('button')||selector.includes('open-'))assert.ok(box.height>=44);
    }
    if(width>700) {
      const logo=await page.locator('.bar-logo').boundingBox(),play=await page.locator('#play-button').boundingBox();
      await page.locator('.volume-control').scrollIntoViewIfNeeded();
      const volume=await page.locator('.volume-control').boundingBox();
      assert.ok(logo.x>=0&&logo.y>=0&&logo.y+logo.height<=page.viewportSize().height&&(logo.x+logo.width<=play.x||play.x+play.width<=logo.x||logo.y+logo.height<=play.y+1),'Logo bleibt vollständig sichtbar und vom Player getrennt');
      const action=await page.locator('#open-schedule').boundingBox();
      assert.ok(volume.x>=play.x+play.width&&(volume.x+volume.width<=action.x||volume.y+volume.height<=action.y),'Lautstärke überlagert weder Player noch Hauptaktionen: '+JSON.stringify({width,volume,action,play}));
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





test('Ignorierte STAPP-Größenänderung erhält die kompakte Bedienung; erlaubte native Größenänderung öffnet die mobile Vollansicht',async t=>{
  const {page,state,errors}=await setup(t,{station:true,k3:false,viewport:{width:320,height:160}});
  assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('radio-constrained')),true);
  assert.ok((await page.evaluate(()=>window.__sizes)).every(size=>size[0]===0&&size[1]<=500));
  await page.locator('#open-wishes').scrollIntoViewIfNeeded();
  const initialWish=await page.locator('#open-wishes').boundingBox();
  assert.ok(initialWish.y>=0&&initialWish.y+initialWish.height<=160,'Ignorierte Hostgröße erhält die Aktion über natives Seitenscrollen');
  await page.exposeBinding('__resizeRadio',async(source,height)=>source.page.setViewportSize({width:320,height}));
  await page.evaluate(()=>{Client.getHostFrame=()=>({setSize(width,height){window.__sizes.push([width,height]);window.__resizeRadio(height);},setTitle(){},setResizable(){}});});
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,topic:'Ein langes Thema für die mobile Radioansicht mit deutlich zusätzlichem Platzbedarf'}),state);
  await page.waitForFunction(()=>innerHeight>160&&!document.documentElement.classList.contains('radio-constrained'));
  assert.equal(await page.locator('#volume').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
});











for(const k3 of [true,false])for(const deviceScaleFactor of [1,2])for(const fontMode of [undefined,'unavailable'])test('Wunschbox erscheint nur bei bestätigter Freigabe ohne leeren Platz und erhält Audio in '+(k3?'K3':'STAPP')+' bei Pixeldichte '+deviceScaleFactor+(fontMode?' mit Ersatzschrift':''),async t=>{
  const {page,state,errors}=await setup(t,{station:true,realAudio:true,k3,deviceScaleFactor,fontMode,viewport:{width:2124,height:160}});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.locator('#volume').evaluate(n=>{n.value='38';n.dispatchEvent(new Event('input'));});
  await page.evaluate(()=>{window.__captionAudio=document.getElementById('radio-audio');window.__captionSource=__captionAudio.currentSrc;});
  let revision=2;
  const previousRequests=await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length);
  const emit=(available,canModerate)=>page.evaluate(({state,revision,available,canModerate})=>window.__emit('mw:state',{...state,revision,requestsEnabled:available,user:{...state.user,canModerate}}),{state,revision:revision++,available,canModerate});
  for(const canModerate of [false,true])for(const width of [320,390,681,901,1280,1500,2124,3840]){
    await emit(false,canModerate);await resizeViewport(page,{width,height:radioHeight(width)});
    assert.equal(await page.locator('#open-wishes').isVisible(),false);
    assert.equal(await page.locator('#open-wishes').isDisabled(),true);
    assert.equal(await page.locator('#open-wishes').getAttribute('aria-disabled'),'true');
    assert.equal(await page.locator('#wish-button-caption').isVisible(),false);
    assert.equal(await page.locator('#open-wishes').evaluate(n=>n.getClientRects().length),0,'Kein reservierter Wunschbox-Platz');
    assert.equal(await page.locator('#open-schedule').isEnabled(),true);
    const closed=await page.locator('.bar-actions').evaluate(n=>{const b=n.getBoundingClientRect(),s=document.getElementById('open-schedule').getBoundingClientRect();return {group:b.width,schedule:s.width};});
    assert.ok(Math.abs(closed.group-closed.schedule)<1,'Sendeplan nutzt den vollständigen öffentlichen Aktionsbereich');
    await page.locator('#open-wishes').evaluate(button=>{button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
    assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests);
    await publicActionContentsFit(page);
    await emit(true,canModerate);
    assert.equal(await page.locator('#open-wishes').isVisible(),true);
    assert.equal(await page.locator('#open-wishes').isEnabled(),true);
    assert.equal(await page.locator('#open-wishes .wish-icon-music').isVisible(),true);
    assert.equal(await page.locator('#open-wishes .wish-icon-lock').isVisible(),false);
    const schedule=await page.locator('#open-schedule').boundingBox(),wish=await page.locator('#open-wishes').boundingBox();
    assert.ok(Math.abs(schedule.width-wish.width)<1&&(wish.x>=schedule.x+schedule.width-1||wish.y>=schedule.y+schedule.height-1),'Aktive öffentliche Aktionen bleiben gleich groß');
    await publicActionContentsFit(page);
    await page.locator('#open-wishes').focus();await emit(false,canModerate);
    assert.equal(await page.locator('#open-wishes').isVisible(),false);
    assert.equal(await page.locator('#open-schedule').evaluate(n=>n===document.activeElement),true,'Fokus bleibt auf erreichbarer Aktion');
    assert.equal(await page.locator('#radio-audio').evaluate(n=>n===window.__captionAudio&&!n.paused&&n.volume===.38&&n.currentSrc===window.__captionSource),true);
  }
  for(const value of [undefined,'true',1]){await emit(value,true);assert.equal(await page.locator('#open-wishes').isVisible(),false,'Nur strikt bestätigte Freigabe');}
  await emit(true,true);await page.locator('#open-wishes').click();
  assert.equal(await page.evaluate(()=>window.__sent.filter(e=>e.type==='mw:openWishes').length),previousRequests+1);
  assert.deepEqual(errors,[]);
});

test('Overlay zeigt nur seinen Bereich und verändert weder Headerbar-Höhe noch Audiowiedergabe', async t => {
  for(const view of ['wishes','team']){
    const {page,errors}=await setup(t,{view,k3:false,station:true,viewport:{width:820,height:680}});
    assert.equal(await page.locator('#radio-panel').isVisible(),false);
    assert.equal(await page.locator('#'+view+'-panel').isVisible(),true);
    if (view === 'wishes') {
      assert.ok((await page.evaluate(()=>window.__sizes)).every(([w,h])=>w===0&&h>=20&&h<=1000));
    } else {
      await page.waitForTimeout(100);
      await validDialogSizes(page);
    }
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.locator('.dialog-header:visible img').count(),0);assert.equal(await page.locator('.dialog-header:visible .eyebrow').textContent(),'MischWerk');
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




test('RGB-Lichthof wechselt fließend ohne Farbsprung und folgt nativer Wiedergabe ohne Geometrieänderung',async t=>{
  for(const k3 of [true,false])for(const viewport of [{width:1440,height:160},{width:1024,height:160},{width:390,height:160},{width:320,height:600}]) {
    const {page,errors}=await setup(t,{station:true,realAudio:true,viewport,k3});
    await page.evaluate(()=>document.fonts.ready);
    const frame=()=>page.locator('.radio-program-face').evaluate(node=>{
      const style=getComputedStyle(node);
      return {color:style.borderTopColor,shadow:style.boxShadow,pointerEvents:style.pointerEvents,animation:style.animationName,borderWidth:style.borderTopWidth};
    });
    const geometry=selector=>page.locator(selector).evaluate(n=>{const b=n.getBoundingClientRect();let x=b.x,y=b.y;for(let parent=n.parentElement;parent;parent=parent.parentElement){x+=parent.scrollLeft;y+=parent.scrollTop;}return {x,y,width:b.width,height:b.height};});
    const resting=await frame(),bounds=await geometry('#radio-panel');
    assert.equal(resting.color,'rgb(58, 58, 58)');
    assert.equal(resting.shadow,'none');
    for(const [selector,pseudo] of [['.radio-program-face','::before']]) {
      const texture=await page.locator(selector).evaluate((node,pseudo)=>{
        const style=getComputedStyle(node,pseudo);return {image:style.backgroundImage,pointerEvents:style.pointerEvents,animation:style.animationName};
      },pseudo);
      assert.match(texture.image,/linear-gradient/);assert.doesNotMatch(texture.image,/repeating-radial-gradient/);assert.equal(texture.pointerEvents,'none');assert.equal(texture.animation,'none');
    }
    const cardBounds=await geometry('.radio-program-face');
    const divider=await page.locator('#radio-panel').evaluate(node=>{
      const style=getComputedStyle(node,'::after');
      return {content:style.content,display:style.display,width:style.width,color:style.backgroundColor,pointerEvents:style.pointerEvents,animation:style.animationName};
    });
    assert.equal(divider.content,'""','Der vorhandene Logotrenner aus Build 389 bleibt erhalten');
    assert.equal(divider.display,viewport.width<=700||viewport.width>=1200?'none':'block');
    assert.equal(divider.width,'1px');assert.equal(divider.color,'rgb(43, 43, 43)');
    assert.equal(divider.pointerEvents,'none');assert.equal(divider.animation,'none','Der neutrale Trenner gehört nicht zum animierten Lichthof');
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    await page.mouse.move(0,0);
    await page.locator('#play-button').evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished)));
    const playing=await frame();
    assert.equal(playing.shadow.split(/, (?![^()]*\))/).length,6);assert.match(playing.shadow,/84px 16px/);assert.equal(playing.borderWidth,'1px');
    assert.equal(playing.pointerEvents,'none');assert.equal(playing.animation,'mw-halo-rgb');
    const motion=await page.locator('.radio-program-face').evaluate(node=>{
      const style=getComputedStyle(node);return {duration:style.animationDuration,timing:style.animationTimingFunction,iterations:style.animationIterationCount};
    });
    assert.deepEqual(motion,{duration:'42s',timing:'linear',iterations:'infinite'});
    const sample=milliseconds=>page.locator('.radio-program-face').evaluate(async(node,milliseconds)=>{
      const animation=node.getAnimations().find(animation=>animation.animationName==='mw-halo-rgb');
      animation.pause();await animation.ready;animation.currentTime=milliseconds;
      const frameCount=animation.effect.getKeyframes().length;
      const style=getComputedStyle(node),colors=[style.borderTopColor,...style.boxShadow.matchAll(/rgba?\([^)]*\)/g)].map(value=>String(value).match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number));
      const unaffected=['.bar-logo','#play-button','#track-title','#open-schedule','#radio-metadata'].map(selector=>{
        const element=document.querySelector(selector),style=getComputedStyle(element);return {bounds:element.getBoundingClientRect().toJSON(),color:style.color,background:style.backgroundColor,filter:style.filter};
      });
      return {frameCount,colors,unaffected};
    },milliseconds);
    const initial=await sample(0),phase=await sample(viewport.width===390?28000:7000);
    assert.equal(initial.frameCount,13,'Zwölf Farbstationen plus identischer Schleifenendpunkt');
    assert.notDeepEqual(phase.colors,initial.colors);assert.deepEqual(phase.unaffected,initial.unaffected,'Nur Lichtfarben wechseln, nicht Inhalt oder Geometrie');
    if(k3&&viewport.width===1440) {
      const phases=[];
      for(const time of Array.from({length:12},(_,index)=>index*3500))phases.push((await sample(time)).colors[0].slice(0,3).join(','));
      assert.equal(new Set(phases).size,12,'Alle zwölf Farbstationen werden erreicht');
      for(const boundary of Array.from({length:12},(_,index)=>(index+1)*3500)) {
        const before=await sample(boundary-10),after=await sample(boundary+10);
        assert.deepEqual(after.unaffected,before.unaffected);
        for(let layer=0;layer<before.colors.length;layer++)for(let channel=0;channel<3;channel++)assert.ok(Math.abs(after.colors[layer][channel]-before.colors[layer][channel])<=2,'Kein Farbsprung an '+boundary+' ms in Lichtschicht '+layer);
      }
      assert.deepEqual((await sample(42000)).colors,initial.colors,'Nahtloser Übergang zum nächsten Zyklus');
      await sample(7000);
    }
    assert.deepEqual(await geometry('#radio-panel'),bounds);
    assert.deepEqual(await geometry('.radio-program-face'),cardBounds);
    const playingDivider=await page.locator('#radio-panel').evaluate(node=>{
      const style=getComputedStyle(node,'::after');
      return {content:style.content,display:style.display,width:style.width,color:style.backgroundColor,pointerEvents:style.pointerEvents,animation:style.animationName};
    });
    assert.deepEqual(playingDivider,divider,'Wiedergabe verändert weder neutralen Trenner noch seine Sichtbarkeit');
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
    assert.deepEqual(await geometry('#radio-panel'),bounds);
    if(viewport.width===1024||viewport.width===390)await captureDesign(page,'Radio-Leuchtrahmen-'+viewport.width+'-Pause');
    assert.deepEqual(errors,[]);
  }
});

test('Glowauslauf erhält seinen Hintergrund in K3 und STAPP auch bei begrenzter Hosthöhe',async t=>{
  const pixelProof=[];
  for(const k3 of [true,false]) {
    const {page,state,errors}=await setup(t,{station:true,realAudio:true,k3,deviceScaleFactor:k3?1:2,nativeSizing:true,viewport:{width:1920,height:176}});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    const audio=await page.locator('#radio-audio').getAttribute('src');
    await page.locator('#radio-audio').evaluate(a=>{a.loop=true;});
    async function assertSoftPixels(phase) {
      await page.evaluate(t=>{for(const a of document.getAnimations().filter(a=>a.animationName==='mw-halo-rgb')){a.pause();a.currentTime=t;}},phase);
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const png=await page.screenshot();
      const pixels=await page.evaluate(async b64=>{
        const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+b64)).blob()),canvas=document.createElement('canvas');
        canvas.width=bitmap.width;canvas.height=bitmap.height;const c=canvas.getContext('2d');c.drawImage(bitmap,0,0);
        const scale=canvas.width/innerWidth,xs=[.25,.5,.75].map(p=>Math.floor(canvas.width*p));
        const row=y=>xs.map(x=>Array.from(c.getImageData(x,y,1,1).data).slice(0,3));
        return {edge:row(canvas.height-1),before:row(canvas.height-2),near:row(canvas.height-Math.ceil(17*scale)),width:innerWidth,scale};
      },png.toString('base64'));
      const base=[0,0,0],deviation=Math.max(...pixels.edge.flatMap(rgb=>rgb.map((v,i)=>Math.abs(v-base[i]))));
      const step=Math.max(...pixels.edge.flatMap((rgb,n)=>rgb.map((v,i)=>Math.abs(v-pixels.before[n][i]))));
      assert.ok(deviation<=1&&step<=2,'Glow endet weich auf der Canvasfarbe: '+JSON.stringify({k3,phase,deviation,step,...pixels}));
      assert.ok(pixels.near.some(rgb=>rgb.some((v,i)=>Math.abs(v-base[i])>5)),'Der Lichtsaum bleibt vor dem Auslauf sichtbar');
      pixelProof.push({k3,phase,deviation,step,...pixels});
    }
    for(const width of [1920,1200,1199,700,390,320]) {
      await resizeViewport(page,{width,height:page.viewportSize().height});
      await page.waitForFunction(()=>document.getElementById('radio-panel').getBoundingClientRect().height+16<=innerHeight+1&&document.scrollingElement.scrollHeight<=innerHeight+1);
      const tail=await page.evaluate(()=>{
        const style=getComputedStyle(document.body,'::after'),bar=document.getElementById('radio-panel').getBoundingClientRect();
        return {height:parseFloat(style.height),position:style.position,image:style.backgroundImage,pointer:style.pointerEvents,barHeight:bar.height,frameHeight:innerHeight,scrollHeight:document.scrollingElement.scrollHeight};
      });
      assert.equal(tail.height,16,JSON.stringify({k3,width,...tail}));assert.equal(tail.position,'relative');assert.match(tail.image,/linear-gradient/);assert.equal(tail.pointer,'none');
      assert.ok(tail.barHeight+16<=tail.frameHeight+1,'Vollständiger Auslauf: '+JSON.stringify({k3,width,...tail}));
      assert.ok(tail.scrollHeight<=tail.frameHeight+1,'Keine Scrollfläche für dekorativen Leerraum');
      for(const selector of ['#play-button','#open-schedule','#open-wishes'])assert.equal(await page.locator(selector).evaluate(node=>{
        const r=node.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===node;
      }),true,'Auslauf fängt keine Klicks ab');
      assert.equal(await page.locator('#radio-audio').getAttribute('src'),audio);
      if(width===1920)for(const phase of [0,7000,14000,21000,28000,35000])await assertSoftPixels(phase);
      if(width===390)await assertSoftPixels(28000);
      if(width===1920||width===390)await captureDesign(page,'RGB-Auslauf-'+width);
    }
    await page.evaluate(state=>window.__emit('mw:state',{...state,revision:state.revision+1,ticker:{revision:1,enabled:true,text:'Radio MischWerk',speed:48,direction:'left'}}),state);
    for(const width of [1920,390]){
      await resizeViewport(page,{width,height:page.viewportSize().height});
      // Auf die tatsächliche Hostantwort und den danach aufgehobenen kompakten STAPP-Zwischenstand warten.
      await page.waitForFunction(expected=>Math.abs(document.getElementById('radio-deck').getBoundingClientRect().bottom-innerHeight)<=1&&
        Math.abs(innerHeight-document.getElementById('radio-ticker').getBoundingClientRect().bottom-expected)<1,width<=1199?24:22);
      const tail=await page.evaluate(()=>({space:innerHeight-document.getElementById('radio-ticker').getBoundingClientRect().bottom,height:innerHeight,
        ticker:document.getElementById('radio-ticker').getBoundingClientRect().toJSON(),deck:document.getElementById('radio-deck').getBoundingClientRect().toJSON(),
        scrolling:[document.scrollingElement.scrollTop,document.body.scrollTop],classes:document.documentElement.className}));
      assert.ok(Math.abs(tail.space-(width<=1199?24:22))<1,'Früherer Haloabstand auch unter der Laufzeile: '+JSON.stringify({k3,width,...tail}));
      for(const phase of [0,7000,14000,21000,28000,35000])await assertSoftPixels(phase);
      assert.equal(await page.locator('#radio-audio').getAttribute('src'),audio);
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

test('Lautstärke startet bei höchstens 30 Prozent und begrenzt auch alte gespeicherte Werte',async t=>{
  for(const [savedVolume,expected] of [[undefined,.3],[.05,.05],[.1,.1],[.25,.25],[.56,.3],[.7,.3],[1,.3],[0,0],['ungueltig',.3],[-1,0],[Infinity,.3]]){
    const {page,errors}=await setup(t,{savedVolume});
    assert.equal(await page.locator('#radio-audio').evaluate(audio=>audio.volume),expected);
    assert.equal(await page.locator('#volume').inputValue(),String(expected*100));
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
    assert.equal(await page.locator('.volume-control').evaluate(node=>node.classList.contains('is-high')),false);
    assert.ok(Number(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')))<=.3);
    assert.deepEqual(errors,[]);
  }
});

test('Goldener Lautstärkeregler bleibt bis 100 Prozent ohne Warnbereich und Mute erhält den gewählten Pegel',async t=>{
  const {page,errors}=await setup(t,{station:true,realAudio:true,viewport:{width:1600,height:160}});
  const capture=async name=>{
    if(!process.env.MISCHWERK_CAPTURE_VOLUME){return;}
    const folder=path.join(require('node:os').tmpdir(), 'MischWerk-Pruefbilder', 'lautstaerke');fs.mkdirSync(folder,{recursive:true});
    await page.locator('.volume-control').screenshot({path:path.join(folder,name+'.png')});
  };
  await capture('30-prozent');
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  await page.locator('#volume').evaluate(node=>{node.value='60';node.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.locator('#volume').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#volume').inputValue(),'61');
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  assert.equal(await page.locator('#volume').getAttribute('aria-valuetext'),'61 Prozent');
  assert.match(await page.locator('#volume-help').textContent(),/0 bis 100 Prozent/);
  await page.keyboard.press('End');
  assert.equal(await page.locator('#volume').inputValue(),'100');
  assert.equal(await page.locator('#volume-value').textContent(),'100 %');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),1);
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('mischwerk.volume.v1')),'0.3');
  assert.ok(await page.locator('#volume').evaluate(n=>!getComputedStyle(n).backgroundImage.includes('rgb(255, 138, 126)')&&getComputedStyle(n).backgroundImage.includes('rgb(230, 199, 123)')),'Goldene Spur ohne roten Warnbereich');
  assert.equal(await page.locator('#volume-value').evaluate(n=>getComputedStyle(n,'::before').content),'none','Kein Warnsymbol in der Prozentanzeige');
  await capture('100-prozent');
  await resizeViewport(page,{width:320,height:264});await page.locator('#volume').scrollIntoViewIfNeeded();await capture('100-prozent-mobil');
  assert.equal(await page.locator('.radio-bar').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),0);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),1);
  assert.equal(await page.locator('.volume-control').evaluate(n=>n.classList.contains('is-high')),false);
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('volume').value==='30');
  assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.3);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);
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







test('Musikfläche bleibt ohne Scrollstapel geordnet; lange Texte bleiben im DOM und Tooltips neutral',async t=>{
  const {page,state,errors}=await setup(t,{station:true});
  const song={title:'Ein sehr langer Musiktitel mit zusätzlichen Angaben und einem weiteren Interpreten',artist:'Ein sehr langer Interpret mit vielen Beteiligten'};
  await page.route('https://stats.example.com/widget/radio/test-radio/track/current',route=>route.fulfill({json:song}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('track-title').textContent.startsWith('Ein sehr langer'));
  await page.evaluate(state=>window.__emit('mw:state',{...state,revision:2,moderator:{nick:'EinSehrLangerModeratorNicknameMitZusatz'}}),state);
  for(const width of [1024,390,320]){
    await resizeViewport(page,{width,height:160});

    for(const [selector,hint] of [['#track-title','Aktueller Titel'],['#track-artist','Interpret'],['#host-name','Aktuelle Moderation']]){
      assert.equal(await page.locator(selector).getAttribute('title'),hint);
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



test('Langsame Styles und Module lösen in Verwaltungsfenstern keine vorläufigen Größenänderungen aus', async t => {
  for (const view of ['team']) {
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





test('Ein einziges Wunschfeld sendet nur Text und zeigt Versandfehler dauerhaft ohne Entwurfsverlust', async t=>{
  const {page,errors}=await setup(t,{view:'wishes'});
  assert.equal(await page.locator('#wish-form textarea,#wish-form input').count(),1);
  await page.locator('#wish-text').fill('Mein Song, bitte mit Grüßen an alle!');
  await page.locator('#submit-wish').click();
  const sent=await page.evaluate(()=>window.__sent.findLast(e=>e.type==='mw:wish.submit'));
  assert.equal(sent.data.text,'Mein Song, bitte mit Grüßen an alle!');
  assert.deepEqual(Object.keys(sent.data).sort(),['submissionId','text']);
  assert.match(await page.locator('#wish-feedback').textContent(),/wird gesendet/);
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
  assert.match(await page.locator('label[for="wish-text"]').textContent(),/Dein Musikwunsch/);
  assert.equal(await page.locator('#wish-rules').textContent(),'Interpret, Titel und optional ein Gruß. Bitte ohne Links.');
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
    assert.match(await page.locator('#wish-feedback').textContent(),/ohne Links/);
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
    const append=document.body.appendChild;document.body.appendChild=function(node){const result=append.call(this,node);if(node.tagName==='IFRAME'&&node.src==='about:blank'){const proto=node.contentWindow.HTMLMediaElement.prototype,native=proto.play;proto.play=function(){__playVolumes.push(this.volume);return native.apply(this,arguments);};}return result;};
    const range=document.getElementById('volume');range.value='90';range.dispatchEvent(new Event('input'));
  });
  await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.3],'Schon beim Aufruf von audio.play höchstens 30 Prozent');
  assert.equal(await page.locator('#volume-value').textContent(),'30 %');
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
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.3);
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.3,.3]);
  await page.locator('#volume').evaluate(node=>{node.value='5';node.dispatchEvent(new Event('input'));});
  await page.locator('#play-button').click();await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.05,'Niedrigere Werte bleiben beim Neustart erhalten');
  await page.locator('#volume').evaluate(node=>{node.value='90';node.dispatchEvent(new Event('input'));});
  await page.locator('#mute-button').click();
  await page.locator('#play-button').click();await page.locator('#play-button').click();await waitRadioPlaying(page);
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),0,'Stumm bleibt beim Neustart stumm');
  await page.locator('#mute-button').click();
  assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.3,'Nach stummem Neustart kein alter hoher Unmute-Wert');
  assert.deepEqual(await page.evaluate(()=>window.__playVolumes),[.3,.3,.05,0]);
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
    assert.equal(await page.locator('#radio-audio').getAttribute('preload'),null);
    assert.equal(await page.locator('#radio-audio').getAttribute('src'),null,'Kein Streamabruf vor bewusstem Play');
    if(!cors){await page.evaluate(()=>{window.AudioContext=window.webkitAudioContext=undefined;});}
    await page.locator('#radio-audio').evaluate(audio=>{
      window.__nativeMedia=[];
      const append=document.body.appendChild;document.body.appendChild=function(node){const result=append.call(this,node);if(node.tagName==='IFRAME'&&node.src==='about:blank'){const proto=node.contentWindow.HTMLMediaElement.prototype,native=proto.play;proto.play=function(){__nativeMedia.push({type:'play',src:this.src,preload:this.preload,activation:navigator.userActivation.isActive});return native.apply(this,arguments);};}return result;};
      for(const type of ['load','play']){const native=audio[type];audio[type]=function(){
        __nativeMedia.push({type,src:this.src,preload:this.preload,activation:navigator.userActivation.isActive});return native.call(this);
      };}
    });
    await page.locator('#play-button').click();await waitRadioPlaying(page);
    const calls=await page.evaluate(()=>__nativeMedia),play=calls.findIndex(c=>c.type==='play');
    assert.ok(play>0);assert.equal(calls[play-1].type,'load');assert.equal(calls[play-1].preload,'auto');
    assert.equal(calls[play-1].src,'https://stream.example.com/test-radio');assert.equal(calls[play].activation,true);
    assert.equal(calls.slice(play+1).some(c=>c.type==='load'),false,'Kein nachträgliches load setzt den gestarteten Ton zurück');
    assert.equal(await page.locator('#radio-audio').getAttribute('crossorigin'),null);
    assert.equal(await page.locator('#radio-audio').evaluate(node=>node.volume),.3);
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
 for(const change of [{metadataUrl:'https://foreign.example.com/invalid'},{fields:{...state.station.fields,title:'changed'}},{statusUrl:''}]){
  await page.evaluate(({state,change,revision})=>__emit('mw:state',{...state,revision,station:{...state.station,...change}}),{state,change,revision:revision++});
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),source);assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
 }
 assert.equal(await page.evaluate(()=>__newAudioLoads),0);assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);
});

test('STREAMPANEL-Senderwechsel stoppt den alten Stream; verspätete Antworten überschreiben keine neuen Titel', async t=>{
  const {page,state,releaseSong,errors}=await setup(t,{station:true,delayedSong:true});
  const cancelled=page.waitForEvent('requestfailed',{predicate:r=>r.url()==='https://stats.example.com/widget/radio/test-radio/track/current'});
  await page.locator('#play-button').click();
  const stream='https://stream.example.com/other-radio',metadata='https://stats.example.com/widget/radio/other-radio/track/current';
  await page.route(metadata,route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neuer Interpret'}}));
  await page.evaluate(({state,stream,metadata})=>window.__emit('mw:state',{...state,revision:2,station:{...state.station,stationId:'other-radio',streamUrl:stream,stationUrl:stream,metadataUrl:metadata,statusUrl:'https://stats.example.com/widget/radio/other-radio'}}),{state,stream,metadata});
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
  await cancelled;releaseSong();
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
  const cancelled=page.waitForEvent('requestfailed',{predicate:r=>r.url()==='https://stats.example.com/widget/radio/test-radio'});
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#stream-label').textContent(),'Bereit');
  await page.route('https://stats.example.com/widget/radio/other-radio',route=>route.fulfill({json:{slug:'other-radio',stream_status:'started'}}));
  await page.route('https://stats.example.com/widget/radio/other-radio/track/current',route=>route.fulfill({json:{title:'Neuer Titel',artist:'Neue Band'}}));
  await page.evaluate(s=>window.__emit('mw:state',{...s,revision:2,station:{...s.station,stationId:'other-radio',streamUrl:'https://stream.example.com/other-radio',metadataUrl:'https://stats.example.com/widget/radio/other-radio/track/current',statusUrl:'https://stats.example.com/widget/radio/other-radio'}}),state);
  await page.locator('#track-title').filter({hasText:'Neuer Titel'}).waitFor();
  await page.locator('#play-button').click();
  await cancelled;releaseStatus();
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#play-button').isEnabled(),true);
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),'https://stream.example.com/other-radio');
  assert.equal(await page.locator('#track-title').textContent(),'Neuer Titel');
  assert.deepEqual(errors,[]);
});

test('Langsame erste Statusprüfung verzögert den direkten Hörversuch nicht',async t=>{
 const {page,releaseStatus,errors}=await setup(t,{station:true,delayedStatus:true,clock:true,realAudio:true});assert.equal(await page.locator('#play-button').isEnabled(),true);
 await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor({timeout:2000});
 await page.locator('#play-button').click();await waitRadioPlaying(page);await page.clock.runFor(11000);assert.equal(await page.locator('#stream-label').textContent(),'LIVE');releaseStatus();assert.deepEqual(errors,[]);
});

for(const xhr of [false,true])test('Sendepause erholt sich nach zwei Sekunden mit frischem Titel ohne manuelles Refresh mit '+(xhr?'XHR':'fetch'),async t=>{
 const {page,state,errors}=await setup(t,{station:true,providerStatus:'stopped',clock:true,k3:!xhr});
 assert.equal(await page.locator('#stream-label').textContent(),'Sendepause');
 if(xhr)await page.evaluate(()=>{window.fetch=undefined;});
 await page.route(state.station.statusUrl,r=>r.fulfill({json:{slug:'test-radio',stream_status:'started'}}));
 const response=page.waitForResponse(state.station.metadataUrl);await page.clock.runFor(2001);await response;
 await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
 assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
});

test('Medienfehler verbindet neu ohne zusätzliche Statusabfrage und bleibt stoppbar',async t=>{
 const {page,errors}=await setup(t,{station:true,clock:true});let checks=0;await page.route('https://stats.example.com/widget/radio/test-radio',r=>{checks++;return r.fulfill({json:{slug:'test-radio',stream_status:'stopped'}});});
 await page.locator('#play-button').click();await page.evaluate(()=>__rejects[0](new Error('offline')));assert.equal(await page.locator('#stream-label').textContent(),'Verbinde erneut');await page.clock.runFor(2100);
 assert.equal(await page.evaluate(()=>__rejects.length),2);assert.equal(checks,0);await page.locator('#play-button').click();await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>__rejects.length),2);assert.deepEqual(errors,[]);
});

test('Titel wechseln im Zweisekundentakt ohne Browsercache; Status bleibt bei 30 Sekunden, Popups und Hintergrund bleiben ruhig',async t=>{
  for(const view of ['wishes','team']){
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
  await page.clock.runFor(1900);assert.equal(requests,0);assert.equal(statusRequests,0);
  for(let number=1;number<=16;number++){
    const response=page.waitForResponse(endpoint);await page.clock.runFor(number===1?101:2001);await response;
    await page.locator('#track-title').filter({hasText:'Titel '+number}).waitFor();
    assert.equal(await page.locator('#track-artist').textContent(),'Interpret '+number);assert.equal(requests,number);
    assert.ok(statusRequests<=1,'Status erhält keinen schnellen Titeltakt');
  }
  assert.equal(statusRequests,1);
  const metadataCalls = (await page.evaluate(()=>window.__metadataFetch)).filter(call=>call.url===endpoint);
  assert.equal(metadataCalls.length,16);
  assert.ok(metadataCalls.every(call=>call.cache==='no-store'&&call.credentials==='omit'));
  await page.evaluate(()=>{window.__metadataHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get(){return window.__metadataHidden;}});});
  await page.clock.runFor(35000);assert.equal(requests,16);assert.equal(statusRequests,1);
  let response=page.waitForResponse(endpoint);await page.evaluate(()=>{window.__metadataHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await response;
  await page.locator('#track-title').filter({hasText:'Titel 17'}).waitFor();assert.equal(statusRequests,2);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await page.clock.runFor(35000);assert.equal(requests,17);assert.equal(statusRequests,2,'Geschlossene Ansicht hinterlässt keine Timer');
  response=page.waitForResponse(endpoint);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await response;
  await page.locator('#track-title').filter({hasText:'Titel 18'}).waitFor();
  response=page.waitForResponse(endpoint);await page.evaluate(()=>{window.fetch=undefined;window.AbortController=undefined;document.dispatchEvent(new Event('visibilitychange'));});await response;
  await page.locator('#track-title').filter({hasText:'Titel 19'}).waitFor();assert.deepEqual(errors,[]);
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
  response=page.waitForResponse(endpoint);await page.clock.runFor(2001);await response;
  await page.locator('#track-title').filter({hasText:'Schneller Titel 2'}).waitFor();assert.equal(statusCalls,1);
  response=page.waitForResponse(base);releaseStatus();await response;assert.deepEqual(errors,[]);
});

test('Sendepause bricht alte Titel ab; ein Metadaten-Timeout erhält die Anzeige und baut nach zwei Sekunden eine frische Verbindung auf',async t=>{
  const {page,errors}=await setup(t,{station:true,clock:true});await page.locator('#track-title').filter({hasText:'Testtitel'}).waitFor();
  const base='https://stats.example.com/widget/radio/test-radio',endpoint=base+'/track/current';let releaseTitle,status='started',calls=0,hold=true;
  const gate=new Promise(resolve=>{releaseTitle=resolve;});
  await page.route(base,route=>route.fulfill({json:{slug:'test-radio',stream_status:status}}));
  await page.route(endpoint,async route=>{const number=++calls;if(hold){await gate;}try{await route.fulfill({json:{title:'Aktueller Titel '+number,artist:'Band '+number}});}catch(error){if(!route.request().failure())throw error;}});
  const request=page.waitForRequest(endpoint);await page.clock.runFor(5001);await request;
  status='stopped';await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor();
  hold=false;releaseTitle();
  await page.waitForTimeout(20);assert.equal(await page.locator('#track-title').isVisible(),false);
  await page.clock.runFor(15000);assert.equal(calls,1,'Keine Titelabfragen bei bestätigter Pause');
  status='started';let response=page.waitForResponse(endpoint);await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await response;
  await page.locator('#track-title').filter({hasText:'Aktueller Titel 2'}).waitFor();
  let releaseTimeout;const timeoutGate=new Promise(resolve=>{releaseTimeout=resolve;});
  await page.route(endpoint,async route=>{calls++;await timeoutGate;try{await route.fulfill({json:{title:'Zu spät',artist:'Veraltet'}});}catch(error){if(!route.request().failure())throw error;}});
  await page.evaluate(()=>{window.__metadataFailureAt=null;const observer=new MutationObserver(()=>{if(document.getElementById('metadata-status').textContent.includes('nicht erreichbar')){window.__metadataFailureAt=Date.now();observer.disconnect();}});observer.observe(document.getElementById('metadata-status'),{childList:true,subtree:true,characterData:true});});
  const timedRequest=page.waitForRequest(endpoint);await page.clock.runFor(2001);await timedRequest;
  await page.clock.runFor(10001);await page.locator('#metadata-status').filter({hasText:'nicht erreichbar'}).waitFor({state:'attached'});
  assert.equal(await page.locator('#track-title').textContent(),'Aktueller Titel 2');const afterTimeout=calls;
  const remaining=await page.evaluate(()=>2000-(Date.now()-__metadataFailureAt));assert.ok(remaining>0&&remaining<=2000);
  await page.clock.runFor(remaining-1);assert.equal(calls,afterTimeout,'Abbruch wird vor dem frischen Versuch abgeschlossen');
  releaseTimeout();await page.unroute(endpoint);
  await page.route(endpoint,route=>{calls++;return route.fulfill({json:{title:'Wieder erreichbar',artist:'Band'}});});
  response=page.waitForResponse(endpoint);await page.clock.runFor(1);await response;
  await page.locator('#track-title').filter({hasText:'Wieder erreichbar'}).waitFor();
  assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);assert.deepEqual(errors,[]);
});

function privatePositions(items, extra={}) {
  return {available:true,generation:'queue-browser',revision:1,nextPosition:items[0]?.position||null,
    items,total:items.length,page:0,pages:1,...extra};
}

test('Wunschbox zeigt bei eigenen Statusänderungen ausschließlich das unveränderte Formular',async t=>{
 const {page,state,errors}=await setup(t,{view:'wishes',role:'listener',clock:true,parserIncludes:true,viewport:{width:320,height:600}});
 let revision=0;const emit=p=>page.evaluate(({state,p})=>__emit('mw:state',{...state,wishPositions:p}),{state,p});
 await page.locator('#wish-text').fill('Mein weiterer Entwurf');
 for(const stage of ['queued','received','preparing','playing']){
  const item={id:7,text:'Eigener Wunsch',position:1,stage};await emit(privatePositions([item],{revision:++revision,nextItem:item}));
  assert.equal(await page.locator('#wish-tracking,#wish-back-radio').count(),0);
  assert.equal(await page.locator('#wish-text').inputValue(),'Mein weiterer Entwurf');
 }
 for(const lastOutcome of ['closed','played']){
  await emit(privatePositions([],{revision:++revision,lastOutcome,remainingMs:45000}));
  assert.equal(await page.locator('#wish-tracking,#wish-back-radio').count(),0);
 }
 await page.clock.fastForward(66000);assert.equal(await page.locator('#wish-tracking').count(),0);assert.deepEqual(errors,[]);
});

test('Wunschbox enthält keine doppelte Wunschübersicht und erhält den Eingabeentwurf bei privaten Updates',async t=>{
  const {page,state,errors}=await setup(t,{view:'wishes',role:'listener',parserIncludes:true,viewport:{width:320,height:560}});
  const emit=positions=>page.evaluate(({state,positions})=>window.__emit('mw:state',{...state,wishPositions:positions}),{state,positions});
  await page.locator('#wish-text').fill('Dieser Entwurf bleibt');
  const sent=await page.evaluate(()=>window.__sent.length);
  for(const positions of [privatePositions([{id:11,text:'<img src=x onerror=alert(1)> Mein Song',position:2}]),privatePositions([],{generation:'queue-restarted',revision:0})]){
    await emit(positions);
    assert.equal(await page.locator('#wish-positions,#refresh-wish-positions,#wish-positions-pages').count(),0);
    assert.equal(await page.locator('#wish-tracking,#wish-back-radio').count(),0);
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
  assert.equal(await page.locator('#own-wish-stage').textContent(),'Wartet auf Annahme');
  assert.equal(await page.locator('#own-wish-more').textContent(),'+1');
  assert.equal(await page.locator('#open-wishes').isDisabled(),true);
  assert.equal(await page.locator('#mute-button').evaluate(n=>{
    const r=n.getBoundingClientRect(),m=document.getElementById('radio-metadata').getBoundingClientRect();
    return r.top>=m.top&&r.bottom<=m.bottom;
  }),true,'Kurze Musikangaben und Wunschplatz lassen die Lautstärke vollständig im 160-px-Rahmen');
  for(const width of [320,390,700,1200,2048]){
    await resizeViewport(page,{width,height:160});
    assert.equal(await page.locator('#own-wish-position').isVisible(),width>=1200,'Eigener Wunsch wird mobil nicht als Leistenfläche dargestellt');
    for(const id of [...width>=1200?['own-wish-position']:[],'volume','play-button','open-schedule'])await page.locator('#'+id).scrollIntoViewIfNeeded();
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
 const {page,state,requests,errors}=await setup(t,{station:false,clock:true,viewport:{width:1200,height:160}});
 await page.clock.fastForward(61000);
 assert.equal(await page.locator('#open-wishes').isEnabled(),false,'Die zentrale 45-Sekunden-Frist bleibt unabhängig vom Anbieter');
 await page.evaluate(state=>__emit('mw:state',{...state,revision:1}),state);
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
  const target='#mute-button';
  assert.equal(await page.locator(target).evaluate(n=>{const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return document.activeElement===n&&!!hit&&(hit===n||n.contains(hit));}),true);
  assert.equal(await page.locator('#wish-text').inputValue(),'Letzte Eingabe trotz gesperrtem Versand');
  assert.equal(await page.evaluate(()=>__sent.some(e=>e.type==='mw:wish.submit')),false);assert.deepEqual(errors,[]);
 }
});

test('Alle direkten Radioaktionen passen bei 320 bis 3840 Pixeln in den natürlichen Rahmen',async t=>{
 for(const role of ['owner','radioModerator','listener']){
  const {page,errors}=await setup(t,{role,station:true,viewport:{width:2290,height:160}});
  for(const width of [320,390,699,700,759,760,1024,1099,1100,1360,2290,3840]){
   await page.setViewportSize({width,height:width>=1200?260:500});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const buttons=await page.evaluate(()=>[...document.querySelectorAll('#radio-panel button')].filter(n=>n.getClientRects().length&&!n.closest('#radio-metadata')).map(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
    return {id:n.id,height:b.height,width:b.width,inside:b.top>=0&&b.bottom<=innerHeight+1&&b.left>=0&&b.right<=innerWidth+1,hit:!!hit&&(hit===n||n.contains(hit))};
   }));
   for(const button of buttons)assert.ok(button.inside&&button.hit&&button.height>=44&&button.width>=44,JSON.stringify({role,viewportWidth:width,...button}));
  }
  assert.deepEqual(errors,[]);
 }
});





















test('Live-DJ und Thema folgen zentraler Bestätigung und verfallen gemeinsam',async t=>{
 for(const width of [320,1280]){
  const {page,state,errors}=await setup(t,{clock:true,station:true,role:'listener',viewport:{width,height:760}});
  assert.equal(await page.locator('#on-air-sign').textContent(),'Moderation derzeit nicht verfügbar');
  await page.evaluate(state=>__emit('mw:state',{...state,revision:1,broadcastRemainingMs:1000,moderator:{nick:'Prüf-DJ'},topic:'Ätherklänge'}),state);
  assert.equal(await page.locator('#on-air-sign').textContent(),'Es moderiert');
  assert.equal(await page.locator('#host-name').textContent(),'Prüf-DJ');
  assert.equal(await page.locator('#host-name').isVisible(),true);
  assert.equal(await page.locator('#show-topic').textContent(),'Ätherklänge');
  await page.clock.runFor(2001);
  assert.equal(await page.locator('#on-air-sign').textContent(),'Moderation derzeit nicht verfügbar');
  assert.equal(await page.locator('#host-name').isVisible(),false);
  assert.equal(await page.locator('#show-topic').textContent(),'MischWerk Radio Show');
  assert.deepEqual(errors,[]);
 }
});

test('Zentrale Fristen sperren Wunschformular und eigene Platzanzeige vor Ablauf der Channelverbindung',async t=>{
 for(const surface of [false,true]){
  const {page,state,errors}=await setup(t,{clock:true,station:true,view:surface?'wishes':'radio',wishSurface:surface});
  const wish={id:1,text:'Eigener Wunsch',position:7,stage:'preparing'};
  await page.evaluate(({state,wish,surface})=>__emit('mw:state',{...state,revision:1,broadcastRemainingMs:1000,moderator:{nick:'Prüf-DJ'},
    wishPositions:{available:true,generation:'ttl-own',revision:1,remainingMs:1000,total:1,page:0,pages:1,nextPosition:7,nextItem:wish,items:[wish]},
    ...(surface?{wishPresentation:{sequence:0,text:'Mein Entwurf',disabled:false,feedbackHidden:true,pending:false,error:false,feedback:'',hint:''}}:{})}),{state,wish,surface});
  if(surface)assert.equal(await page.locator('#wish-fields').evaluate(n=>n.disabled),false);else assert.equal(await page.locator('#own-wish-rank').textContent(),'Platz 7');
  await page.clock.runFor(2001);
  if(surface){assert.equal(await page.locator('#wish-fields').evaluate(n=>n.disabled),true);assert.equal(await page.locator('#wish-text').inputValue(),'Mein Entwurf');assert.equal(await page.locator('#wish-tracking').count(),0);}
  else{assert.equal(await page.locator('#open-wishes').isVisible(),false);assert.equal(await page.locator('#own-wish-rank').isVisible(),false);assert.equal(await page.locator('#open-schedule').isEnabled(),true);}
  assert.deepEqual(errors,[]);
 }
});

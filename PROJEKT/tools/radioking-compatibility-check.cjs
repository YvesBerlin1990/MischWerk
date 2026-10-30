// Explizite, lesende Netzwerkprüfung des eigenen RadioKing-Senders. Kein Knuddels-Zugriff/Upload.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.MISCHWERK_PLAYWRIGHT || 'playwright');
const { createHarness } = require('./knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/radioking-pruefung');
const protectedFiles = ['app/main.js','app/app.config','app/www/index.html','app/www/css/style.css','app/www/js/app.js','app/www/img/mischwerk-logo.png'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const before = Object.fromEntries(protectedFiles.map(file => [file,hash(file)]));
const report = { checkedAt: new Date().toISOString(), version: require('../package.json').version,
  scope: 'Own public MischWerk RadioKing endpoints and unchanged production frontend; mocked Knuddels bridge only.',
  references: [
    'https://help.radioking.com/hc/en-us/articles/4409391813521-Settings-Presentation',
    'https://help.radioking.com/hc/en-us/articles/4408959440913-Broadcast-live-with-LadioCast'
  ], http: [], browser: {}, protectedFilesUnchanged: false };
async function json(url) {
  const response = await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Origin:'https://chatproxy.knuddels.de'}});
  const body = await response.json();
  const result = { url, status:response.status, finalUrl:response.url,
    contentType:response.headers.get('content-type'), cors:response.headers.get('access-control-allow-origin'), cacheControl:response.headers.get('cache-control'), body };
  report.http.push(result); assert.equal(response.status,200); assert.equal(result.cors,'*'); return body;
}
async function main() {
  fs.mkdirSync(output,{recursive:true});
  const h = createHarness(), user=h.user(1,'Netzwerkprüfung','listener'), session=h.open(user);
  const state=h.state(user,session), station=state.station;
  assert.equal(station.radioId,'mischwerk');assert.equal(station.configured,true);
  const infoUrl='https://api.radioking.io/widget/radio/'+station.radioId;
  const info=await json(infoUrl);
  assert.equal(info.slug,station.radioId);assert.equal(info.name,'MischWerk');assert.equal(info.idradio,950821);
  assert.ok(['started','stopped'].includes(info.stream_status),'Unbekannter Anbieterstatus: keine verlässliche Aussage');
  const stopped=info.stream_status==='stopped';report.streamStatus=info.stream_status;
  const streams=await json(infoUrl+'/stream');
  assert.ok(streams.some(stream=>stream.format==='MP3'&&stream.url===station.streamUrl));
  if(!stopped){
    await json(station.metadataUrl);
    const audioResponse=await fetch(station.streamUrl,{signal:AbortSignal.timeout(12000)});
    assert.equal(audioResponse.status,200);assert.match(audioResponse.headers.get('content-type'),/^audio\/mpeg/);
    const reader=audioResponse.body.getReader(), chunk=await reader.read();await reader.cancel();
    assert.ok(chunk.value?.byteLength>0);
    report.http.push({url:station.streamUrl,status:audioResponse.status,finalUrl:audioResponse.url,
      contentType:audioResponse.headers.get('content-type'),cors:audioResponse.headers.get('access-control-allow-origin'),sampleBytes:chunk.value.byteLength});
  }
  let browser;
  try {
    browser=await chromium.launch({headless:true,channel:'msedge'});
    const page=await browser.newPage({viewport:{width:2124,height:160}});
    const errors=[];report.browser.errors=errors;
    page.on('pageerror',error=>errors.push(error.message));
    const apiResponses=[];
    page.on('response',response=>{
      if(response.url()===station.metadataUrl){apiResponses.push(response.json().catch(()=>null));}
    });
    await page.addInitScript(state=>{
      window.__sent=[];window.__handlers={};window.__contexts=[];
      window.Client={pageData:{...state,view:'radio'},isK3Client(){return true;},
        includeCSS(file){const n=document.createElement('link');n.rel='stylesheet';n.href=file;document.head.appendChild(n);},
        includeJS(file){const n=document.createElement('script');n.src=file;document.body.appendChild(n);},
        sendEvent(type,data){window.__sent.push({type,data});},
        addEventListener(type,handler){(window.__handlers[type]||(window.__handlers[type]=[])).push(handler);}};
      window.AudioContext=window.webkitAudioContext=function(){window.__contexts.push('unexpected');throw new Error('Keine Audioanalyse');};
      document.addEventListener('DOMContentLoaded',()=>{document.getElementById('radio-audio').muted=true;});
    },state);
    await page.route('http://mischwerk-check.test/**',route=>{
      const name=new URL(route.request().url()).pathname.slice(1)||'index.html';
      const file=path.resolve(root,'app/www',name), base=path.join(root,'app','www')+path.sep;
      if(!file.startsWith(base)||!fs.existsSync(file)){return route.fulfill({status:404});}
      const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'};
      return route.fulfill({contentType:types[path.extname(file)],body:fs.readFileSync(file)});
    });
    await page.goto('http://mischwerk-check.test/');
    if(stopped){
      await page.locator('#stream-label').filter({hasText:'Sendepause'}).waitFor({timeout:15000});
      assert.equal(await page.locator('#play-button').isDisabled(),true);
      assert.equal(await page.locator('#play-button').getAttribute('aria-disabled'),'true');
      await page.locator('#play-button').evaluate(b=>{b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
      assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
      assert.equal(await page.locator('#track-title').isVisible(),false);
      assert.equal(await page.locator('#notice').isVisible(),false);
      report.browser.realCrossOriginStatus=true;report.browser.radioStoppedAsReported=true;
      report.browser.realMp3Decoded=false;report.browser.audioCheckSkipped='Sender confirmed stopped; no audio connection attempted.';
      await page.screenshot({path:path.join(output,'MischWerk-RadioKing-'+report.version+'-Sendepause.png')});
      await page.locator('.transport').screenshot({path:path.join(output,'RadioKing-Sendepause-'+report.version+'.png')});
    }else{
      await page.waitForFunction(()=>document.getElementById('metadata-status').textContent.includes('Titelanzeige von RadioKing'));
      const response=await apiResponses[apiResponses.length-1];
      report.browser.displayed={title:await page.locator('#track-title').textContent(),artist:await page.locator('#track-artist').textContent()};
      assert.equal(report.browser.displayed.title,typeof response?.title==='string'?response.title.trim():'');
      assert.equal(report.browser.displayed.artist,typeof response?.artist==='string'?response.artist.trim():'');
      report.browser.realCrossOriginMetadata=true;
      report.browser.realCrossOriginStatus=true;
      assert.equal(await page.locator('#radio-audio').getAttribute('src'),null,'Kein Autostart');
      await page.locator('#play-button').click();
      await page.waitForFunction(()=>{const a=document.getElementById('radio-audio');return !a.paused&&a.currentTime>.1&&document.getElementById('stream-label').textContent==='LIVE';},null,{timeout:20000});
      report.browser.realMp3Decoded=true;
      await page.locator('#volume').evaluate(n=>{n.value='43';n.dispatchEvent(new Event('input'));});
      assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.43);
      await page.locator('#mute-button').click();assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),0);
      await page.locator('#mute-button').click();assert.equal(await page.locator('#radio-audio').evaluate(a=>a.volume),.43);
      await page.locator('#open-wishes').click();
      assert.equal(await page.locator('#radio-audio').evaluate(a=>a.paused),false);
      assert.ok(await page.evaluate(()=>window.__sent.some(e=>e.type==='mw:openWishes')));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
      await page.screenshot({path:path.join(output,'MischWerk-RadioKing-'+report.version+'-2124.png')});
      await page.locator('#play-button').click();assert.equal(await page.locator('#radio-audio').getAttribute('src'),null);
      await page.locator('#play-button').click();
      await page.waitForFunction(()=>!document.getElementById('radio-audio').paused&&document.getElementById('radio-audio').currentTime>.1,null,{timeout:20000});
    }
    assert.deepEqual(await page.evaluate(()=>window.__contexts),[]);assert.deepEqual(errors,[]);
    report.browser.controlsPassed=true;
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
    report.browser.passed=true;
  } finally {await browser?.close();}
}
main().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(()=>{
  report.protectedFilesUnchanged=protectedFiles.every(file=>hash(file)===before[file]);
  if(!report.protectedFilesUnchanged){process.exitCode=1;}
  fs.mkdirSync(output,{recursive:true});
  const file=path.join(output,'anbindung-'+report.version+'.json');
  fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({report:file,passed:report.browser.passed===true,protectedFilesUnchanged:report.protectedFilesUnchanged,error:report.error},null,2));
});

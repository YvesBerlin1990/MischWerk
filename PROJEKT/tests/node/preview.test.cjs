const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
test('Lokaler Vorschau-Server', async t => {
  const child = spawn(process.execPath, ['tools/preview/server.cjs'], { cwd: path.join(__dirname, '../..'), env: { ...process.env, MISCHWERK_PREVIEW_PORT: '0' }, windowsHide: true });
  t.after(() => child.kill());
  const base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Preview startup timeout')), 8000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.stdout.on('data', chunk => { const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
  });
  await t.test('Logo wird als PNG ausgeliefert', async () => {
    const response = await fetch(base + '/app/www/img/mischwerk-logo.png');
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/png');
    const bytes = new Uint8Array(await response.arrayBuffer()); assert.deepEqual([...bytes.slice(0, 8)], [137,80,78,71,13,10,26,10]);
  });
  await t.test('App-Teststartseite grenzt die pausierte Website und ihre APIs ab', async () => {
    const html = await (await fetch(base + '/')).text();
    const version = require('../../package.json').version;
    assert.ok(html.includes('App ' + version));
    assert.match(html, /MischWerk Knuddels-App/);
    assert.match(html, /Website ist pausiert/);
    for (const route of ['/api/site/content','/api/site/applications','/sections.js','/site-api.cjs']) assert.equal((await fetch(base+route)).status,404);
    assert.doesNotMatch(html, /Otterchen|Dein Sound|Dein Wunsch zählt/i);
    assert.doesNotMatch(html, /radioking|wartet auf Freischaltung|Google Fonts/i);
    for (const asset of ['/preview.css', '/channel.js', '/app/www/fonts/inter-latin.woff2']) {
      assert.equal((await fetch(base + asset)).status, 200);
    }
  });
  await t.test('Öffentliches Radio übernimmt die Appanschlüsse, ohne Demo-Identität oder Verwaltungsrechte', async () => {
    const load = async route => {
      const html = await (await fetch(base + route)).text();
      return JSON.parse(html.match(/window\.MischWerkDemoData=(.*?);<\/script>/)[1]);
    };
    const demo = await load('/preview?role=moderator');
    const radio = await load('/preview?radio=public&role=moderator');
    assert.equal(demo.publicRadio, false); assert.equal(demo.pageData.station.configured, false);
    assert.equal(radio.publicRadio, true); assert.equal(radio.pageData.station.provider, 'streampanel');
    assert.equal(radio.pageData.station.streamUrl, 'https://mischwerk.sp.radio.fm/stream');
    assert.equal(radio.pageData.station.metadataUrl, 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json');
    assert.equal(radio.pageData.station.metadataFormat, 'spcast-history');
    assert.equal(radio.pageData.station.statusUrl, 'https://mischwerk.sp.radio.fm/statistics?json=1');
    assert.equal(radio.pageData.station.modeUrl, 'https://mischwerk.sp.radio.fm/scripts/whoIsLive.php');
    assert.equal(radio.pageData.user.canModerate, false); assert.equal(radio.pageData.user.canManageRadioModerators, false);
    assert.equal(radio.pageData.moderator, null); assert.equal(radio.pageData.curtain.closed, false);
    assert.equal(radio.pageData.station.historyUrl, undefined);
    assert.equal((await fetch(base + '/preview?view=studio&sourceSession=' + radio.sessionId)).status, 403);
    assert.equal((await fetch(base + '/preview?view=schedule&sourceSession=' + radio.sessionId)).status, 403);
    assert.equal((await fetch(base + '/api/event', { method:'POST', body:JSON.stringify({ sessionId:radio.sessionId, type:'mw:wish.submit', data:{text:'Test',submissionId:'public-denied'} }) })).status, 403);
    assert.equal(demo.pageData.user.nick, 'Testleitung');
    assert.doesNotMatch(JSON.stringify(demo), /Otterchen|Polaroid|Musikfreund|Mixfreund|Klangwelle/i);
    const again = await load('/preview');
    assert.equal(again.pageData.station.configured, false);
  });
  await t.test('Kodierte Pfade können keine Projektdateien außerhalb von www lesen', async () => {
    for (const file of ['..%5c..%5cAGENTS.md', '..%2f..%2fapp%2fmain.js', '..%5capp.config']) {
      assert.equal((await fetch(base + '/app/www/' + file)).status, 404);
    }
  });
  await t.test('Defektes JSON und fremde Herkunft werden abgewiesen', async () => {
    assert.equal((await fetch(base + '/api/event', { method: 'POST', body: '{' })).status, 400);
    assert.equal((await fetch(base + '/api/event', { method: 'POST', headers: { Origin: 'https://fremd.example' }, body: '{}' })).status, 403);
  });
  await t.test('Echter Backend-Roundtrip in der lokalen Demo enthält zugeordnete Bestätigungen', async () => {
    const html = await (await fetch(base + '/preview?role=listener')).text();
    const data = JSON.parse(html.match(/window\.MischWerkDemoData=(.*?);<\/script>/)[1]);
    const send = async () => (await fetch(base + '/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: data.sessionId, type: 'mw:wish.submit', data: { text: 'Band – Song', submissionId: 'preview-roundtrip' } }) })).json();
    const first = await send(); assert.equal(first.find(event => event.type === 'mw:wish.receipt').data.submissionId, 'preview-roundtrip');
    const second = await send(); assert.equal(second.find(event => event.type === 'mw:wish.receipt').data.accepted, true);
    assert.equal(second.find(event => event.type === 'mw:state').data.myRequests.length, 0);
  });
  await t.test('Demo-Popup bleibt an den Nutzer gebunden und lässt die Radioleiste aktiv', async () => {
    const ownerHtml=await(await fetch(base+'/preview?role=moderator')).text();
    const ownerData=JSON.parse(ownerHtml.match(/window\.MischWerkDemoData=(.*?);<\/script>/)[1]);
    await fetch(base+'/api/command',{method:'POST',body:JSON.stringify({sessionId:ownerData.sessionId,command:'vorhang',params:'öffnen'})});
    const html=await(await fetch(base+'/preview?role=listener')).text();
    const data=JSON.parse(html.match(/window\.MischWerkDemoData=(.*?);<\/script>/)[1]);
    assert.equal((await fetch(base+'/preview?sourceSession='+data.sessionId+'&view=studio')).status,403);
    const popup=await fetch(base+'/preview?sourceSession='+data.sessionId+'&view=wishes');
    assert.equal(popup.status,200); assert.match(await popup.text(),/"view":"wishes"/);
    const refresh=await(await fetch(base+'/api/event',{method:'POST',body:JSON.stringify({sessionId:data.sessionId,type:'mw:refresh'})})).json();
    assert.equal(refresh.some(event=>event.type==='mw:state'),true);
  });
});

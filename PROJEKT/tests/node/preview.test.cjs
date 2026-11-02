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
    await fetch(base+'/api/event',{method:'POST',body:JSON.stringify({sessionId:ownerData.sessionId,type:'mw:setCurtain',data:{closed:false,previousClosed:true}})});
    const html=await(await fetch(base+'/preview?role=listener')).text();
    const data=JSON.parse(html.match(/window\.MischWerkDemoData=(.*?);<\/script>/)[1]);
    assert.equal((await fetch(base+'/preview?sourceSession='+data.sessionId+'&view=studio')).status,403);
    const popup=await fetch(base+'/preview?sourceSession='+data.sessionId+'&view=wishes');
    assert.equal(popup.status,200); assert.match(await popup.text(),/"view":"wishes"/);
    const refresh=await(await fetch(base+'/api/event',{method:'POST',body:JSON.stringify({sessionId:data.sessionId,type:'mw:refresh'})})).json();
    assert.equal(refresh.some(event=>event.type==='mw:state'),true);
  });
});

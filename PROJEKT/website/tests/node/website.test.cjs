const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createHarness } = require('../support/harness.cjs');
const { createSiteApi } = require('../../server/site-api.cjs');
const { createApplicationMail } = require('../../server/site-mail.cjs');
const { createSiteBridge } = require('../../server/site-bridge.cjs');
test('Isolierter Diagnoseserver bleibt ohne ausdrücklichen Testmodus abgeschaltet', () => {
  const result = require('node:child_process').spawnSync(process.execPath, ['tools/preview/server.cjs'], {
    cwd:require('node:path').resolve(__dirname,'../..'), windowsHide:true, timeout:5000,
    env:{...process.env,MISCHWERK_WEBSITE_TEST:''}, encoding:'utf8'
  });
  assert.equal(result.status,0); assert.match(result.stdout,/Diagnoseserver nur für isolierte Tests/);
  assert.doesNotMatch(result.stdout,/https?:\/\//);
});
function fixture() {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), listener = h.user(2, 'Hörer');
  const radio = h.open(owner), listenerRadio = h.open(listener);
  const invoke = (method = 'GET', body, query = 'week=2026-11-02&page=0') => {
    const result = h.webhooks.invoke('website', { method, body: JSON.stringify(body), query });
    return { status: result.status, data: JSON.parse(result.body) };
  };
  return { h, owner, listener, radio, listenerRadio, invoke };
}
test('WebHook veröffentlicht denselben Sendeplan ohne interne Identitäten oder Schreibrechte', () => {
  const f = fixture();
  f.h.event(f.owner, f.radio, 'mw:openSchedule');
  const session = f.owner.sessions.find(s => s.activeView === 'schedule');
  const result = f.h.event(f.owner, session, 'mw:schedule.save', { requestId: 'website-plan', week: '2026-11-02', expectedRevision: 0,
    date: '2026-11-03', start: '20:00', end: '22:00', nick: 'Otterchen', topic: 'Ein Abend mit Musik' });
  assert.equal(result.find(e => e.type === 'mw:schedule.result').data.ok, true);
  const publicPlan = f.invoke();
  assert.equal(publicPlan.status, 200); assert.equal(publicPlan.data.entries[0].moderator, 'Yves');
  assert.equal(publicPlan.data.entries[0].topic, 'Ein Abend mit Musik');
  assert.doesNotMatch(JSON.stringify(publicPlan.data), /Otterchen|userId|senderKey|canManage/);
  assert.equal(f.invoke('DELETE').status, 405);
  assert.equal(f.h.webhooks.invoke('website', {method:'POST',body:'{broken'}).status,400);
  assert.equal(f.h.webhooks.invoke('website', {query:'week=%ZZ'}).status,400);
  assert.equal(f.invoke('POST', { type: 'mw:schedule.delete', id: 1 }).status, 400);
  assert.equal(f.invoke().data.entries.length, 1);
  f.h.app.chatCommands['mischwerk-web'](f.listener); assert.equal(f.listener.messages.length, 0);
  f.h.app.chatCommands['mischwerk-web'](f.owner); assert.match(f.owner.messages.at(-1), /https:\/\/emulator\.mischwerk\.invalid\/webhooks/);
});
test('Websitewunsch erscheint einmalig in der echten Moderationsqueue und gibt keine Channelidentität vor', () => {
  const f = fixture(), data = { text: 'a-ha – Take On Me', submissionId: 'web-test-12345', visitorId: 'a'.repeat(32) };
  assert.equal(f.h.webhooks.invoke('website', {method:'POST',body:new String(JSON.stringify(data))}).status,200);
  assert.equal(f.invoke('POST', data).status, 200);
  const state = f.h.state(f.owner, f.radio);
  assert.equal(state.queueTotal, 1); assert.equal(state.queue[0].nick, 'Website');
  assert.equal(state.queue[0].text, data.text);
  assert.equal(f.h.state(f.listener, f.listenerRadio).wishPositions.total, 0);
  assert.equal(f.invoke('POST', { ...data, submissionId: 'web-link-12345', text: 'https://example.org' }).status, 400);
  f.h.event(f.owner, f.radio, 'mw:setRequests', { enabled: false });
  assert.equal(f.invoke('POST', { ...data, submissionId: 'web-disabled-12345' }).status, 400);
  assert.equal(f.invoke().data.requestsEnabled, false);
});
async function start(t, options) {
  const handle = createSiteApi(options);
  const server = http.createServer(async (req, res) => { if (!await handle(req, res, new URL(req.url, 'http://local'))) { res.writeHead(404); res.end(); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (route, data, origin = base) => fetch(base + '/api/site/' + route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { base, post };
}
const application = { name: 'Testperson', email: 'person@example.test', availability: 'Am Wochenende', message: 'Ich möchte bei euch moderieren.', submissionId: 'application-test-12345' };
test('Bewerbung wird serverseitig zugestellt; Empfänger, Fehlerdetails und Zugangsdaten bleiben privat', async t => {
  const messages = [];
  const mail = createApplicationMail({ MISCHWERK_APPLICATIONS_ENABLED:'true', MISCHWERK_APPLICATION_TO: 'privat@example.test', MISCHWERK_SMTP_USER: 'smtp@example.test' },
    { sendMail: async data => { messages.push(data); return { accepted: ['privat@example.test'], rejected: [] }; } });
  const { base, post } = await start(t, { mail, bridge: { configured: false } });
  const content = await (await fetch(base + '/api/site/content')).text();
  assert.doesNotMatch(content, /privat@example|smtp@example|SMTP|PASSWORD/);
  assert.equal((await post('applications', application, 'https://fremd.example')).status, 403);
  assert.equal((await post('applications', { ...application, email: 'invalid' })).status, 400);
  assert.equal((await post('applications', application)).status, 200);
  assert.equal((await post('applications', application)).status, 200); assert.equal(messages.length, 1);
  assert.equal(messages[0].to, 'privat@example.test'); assert.equal(messages[0].replyTo.address, application.email);
  assert.match(messages[0].text, /Am Wochenende/);
});
test('Fehlende oder abgewiesene Mailzustellung behauptet keinen Erfolg und bleibt wiederholbar', async t => {
  let called = 0;
  const env = {MISCHWERK_APPLICATIONS_ENABLED:'false',MISCHWERK_APPLICATION_TO:'private@example.test',MISCHWERK_SMTP_USER:'smtp@example.test',MISCHWERK_SMTP_PASSWORD:'test-secret'};
  const disabled = createApplicationMail(env,{sendMail:async()=>{called++;throw Error('SMTP password private@example.test');}});
  const { base, post } = await start(t, { mail:disabled, bridge: { configured: false } });
  assert.equal((await (await fetch(base + '/api/site/content')).json()).applicationsAvailable, false);
  const result = await post('applications', application);
  assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /password|private@example/);
  assert.equal(called,0,'Ausgeschalteter Versand verwendet auch vorhandene Zugangsdaten nicht.');
  const rejected = createApplicationMail({...env,MISCHWERK_APPLICATIONS_ENABLED:'true'},{sendMail:async()=>({accepted:[],rejected:['private@example.test']})});
  const second = await start(t,{mail:rejected,bridge:{configured:false}});
  assert.equal((await second.post('applications',application)).status,503);
});
test('HTTP-Anschluss übermittelt Plan und Wünsche an den dokumentierten WebHook statt in die Demo', async t => {
  const f = fixture();
  const bridge = createSiteBridge({ MISCHWERK_APP_WEBHOOK: 'https://bridge.example.test/website' }, async (url, options) => {
    const native = f.h.webhooks.invoke('website', { method: options.method, query: url.search.slice(1), body: options.body });
    return new Response(native.body, { status: native.status, headers: native.headers });
  });
  const { base, post } = await start(t, { bridge, mail: { configured: false } });
  const plan = await fetch(base + '/api/site/schedule?week=2026-11-02&page=0');
  assert.equal(plan.status, 200); assert.equal((await plan.json()).week, '2026-11-02');
  const wish = await post('wishes', { text: 'Band – Song', submissionId: 'website-http-wish-12345' });
  assert.equal(wish.status, 200); assert.match(wish.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal(f.h.state(f.owner, f.radio).queueTotal, 1);
});

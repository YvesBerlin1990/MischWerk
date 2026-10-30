// Lokale Vorschau: echtes main.js mit API-Mocks. Kein Bestandteil des Uploads.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createHarness } = require('./knuddels-mock.cjs');
const root = path.resolve(__dirname, '..');
const h = createHarness();
// Die lokale Demo erzeugt keine Verbindungen zum produktiven Radio.
h.config.radioking.radioId = "";
const sessions = new Map();
let nextUserId = 100;
let demoClockAt = Date.now();
const host = h.user(1, 'Otterchen', 'owner'); const hostSession = h.open(host);
h.event(host, hostSession, 'mw:onAir');
[['Mixfreund', 'Lieblingsband', 'Dieser eine Song', 'Liebe Grüße an den ganzen Channel!'], ['Klangwelle', 'Wunschinterpret', 'Gute Zeit', 'Für einen entspannten Abend.']].forEach((sample, index) => {
  const user = h.user(index + 2, sample[0]); const session = h.open(user);
  h.event(user, session, 'mw:request', { artist: sample[1], title: sample[2], message: sample[3] });
});
function respond(res, status, contentType, body) {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body);
}
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) { respond(res, 403, 'text/plain', 'Local host required'); return; }
    const currentTime = Date.now(); h.advance(currentTime - demoClockAt); demoClockAt = currentTime;
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'POST' && url.pathname === '/api/event') {
      if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) { respond(res, 403, 'text/plain', 'Local origin required'); return; }
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 12000) { respond(res, 413, 'text/plain', 'Too large'); return; } }
      let data;
      try { data = JSON.parse(body); } catch (error) { respond(res, 400, 'text/plain', 'Invalid JSON'); return; }
      if (!data || typeof data !== 'object' || Array.isArray(data)) { respond(res, 400, 'text/plain', 'Invalid event'); return; }
      const connection = sessions.get(data.sessionId);
      if (!connection) { respond(res, 404, 'text/plain', 'Demo-Sitzung abgelaufen'); return; }
      connection.touchedAt = Date.now();
      const events = h.event(connection.user, connection.session, data.type, data.data);
      respond(res, 200, 'application/json', JSON.stringify(events)); return;
    }
    if (req.method !== 'GET') { respond(res, 405, 'text/plain', 'Method not allowed'); return; }
    if (url.pathname === '/preview') {
      const role = url.searchParams.get('role') === 'moderator' ? 'moderator' : 'listener';
      const view = ['wishes', 'studio'].includes(url.searchParams.get('view')) ? url.searchParams.get('view') : 'radio';
      const sourceId = url.searchParams.get('sourceSession');
      const source = sourceId && sessions.get(sourceId);
      if (sourceId && (!source || source.session.removed)) { respond(res, 404, 'text/plain', 'Demo-Sitzung abgelaufen'); return; }
      const user = source ? source.user : h.user(nextUserId++, role === 'moderator' ? 'Otterchen (Demo)' : 'Musikfreund (Demo)', role === 'moderator' ? 'owner' : 'listener');
      let session = source ? source.session : h.open(user);
      if (view !== 'radio') {
        const events = h.event(user, session, view === 'studio' ? 'mw:openStudio' : 'mw:openWishes');
        const result = events.find(event => event.type === 'mw:result');
        if (!result || !result.data.ok) { respond(res, 403, 'text/plain', result ? result.data.message : 'Fenster nicht verfügbar'); return; }
        session = user.sessions.find(item => item.content.viewMode === 'Popup');
      }
      const sessionId = randomUUID();
      sessions.set(sessionId, { user, session, touchedAt: Date.now() });
      const data = { sessionId, pageData: { ...h.state(user, session), view } };
      const injection = '<base href="/app/www/"><script>window.MischWerkDemoData=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';</script><script src="/preview-bridge.js"></script>';
      const html = fs.readFileSync(path.join(root, 'app/www/index.html'), 'utf8').replace('<head>', '<head>' + injection);
      respond(res, 200, types['.html'], html); return;
    }
    const route = url.pathname === '/' ? '/preview.html' : url.pathname;
    if (!['/preview.html', '/preview-bridge.js'].includes(route) && !route.startsWith('/app/www/')) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    let file;
    if (route.startsWith('/app/www/')) {
      const publicRoot = path.join(root, 'app', 'www');
      const decoded = decodeURIComponent(route.slice('/app/www/'.length));
      if (decoded.includes('\0')) { respond(res, 400, 'text/plain', 'Invalid path'); return; }
      file = path.resolve(publicRoot, decoded);
      if (!file.startsWith(publicRoot + path.sep)) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    } else { file = path.join(root, route.slice(1)); }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    respond(res, 200, types[path.extname(file)] || 'application/octet-stream', fs.readFileSync(file));
  } catch (error) { respond(res, 500, 'text/plain', 'Vorschau-Fehler: ' + error.message); }
});
setInterval(() => {
  for (const [id, connection] of sessions) {
    if (Date.now() - connection.touchedAt > 10 * 60000) { connection.session.remove(); sessions.delete(id); }
  }
}, 60000).unref();
const port = Number(process.env.MISCHWERK_PREVIEW_PORT || 8765);
server.on('error', error => { console.error('Vorschau konnte nicht starten:', error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('MischWerk Vorschau: http://127.0.0.1:' + server.address().port + '\nBeenden mit Strg+C. Keine echten Knuddels-Daten, kein Radiostream.'));

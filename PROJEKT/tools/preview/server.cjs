// Lokale Vorschau: echtes main.js mit API-Mocks. Kein Bestandteil des Uploads.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createPreviewRuntime } = require('./runtime.cjs');
const root = path.resolve(__dirname, '../..');
const pendingEvents = new WeakMap();
function onEvent(session, event) {
  if (!pendingEvents.has(session)) { pendingEvents.set(session, []); }
  const queue = pendingEvents.get(session); queue.push(event);
  if (queue.length > 100) { queue.shift(); }
}
const runtimes = new Map();
function runtime(publicRadio) {
  const key = publicRadio ? 'public' : 'demo';
  if (!runtimes.has(key)) { runtimes.set(key, createPreviewRuntime(publicRadio, onEvent, process.env.MISCHWERK_PREVIEW_START_MODERATION !== '0')); }
  return runtimes.get(key);
}
const sessions = new Map();
let nextUserId = 100;
function respond(res, status, contentType, body) {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body);
}
function drain(session) { const events = pendingEvents.get(session) || []; pendingEvents.set(session, []); return events; }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = http.createServer(async (req, res) => {
  try {
    if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) { respond(res, 403, 'text/plain', 'Local host required'); return; }
    const currentTime = Date.now();
    for (const item of runtimes.values()) { item.harness.advance(currentTime - item.clockAt); item.clockAt = currentTime; }
    const url = new URL(req.url, 'http://127.0.0.1');    if (req.method === 'POST' && ['/api/event', '/api/command'].includes(url.pathname)) {
      if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) { respond(res, 403, 'text/plain', 'Local origin required'); return; }
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 12000) { respond(res, 413, 'text/plain', 'Too large'); return; } }
      let data;
      try { data = JSON.parse(body); } catch (error) { respond(res, 400, 'text/plain', 'Invalid JSON'); return; }
      if (!data || typeof data !== 'object' || Array.isArray(data)) { respond(res, 400, 'text/plain', 'Invalid event'); return; }
      const connection = sessions.get(data.sessionId);
      if (!connection || connection.session.removed) { respond(res, 404, 'text/plain', 'Demo-Sitzung abgelaufen'); return; }
      connection.touchedAt = Date.now();
      if (connection.runtime.publicRadio && (url.pathname === '/api/command' || !['mw:ready', 'mw:refresh'].includes(data.type))) { respond(res, 403, 'text/plain', 'Im Hörmodus ist nur der Player verfügbar.'); return; }
      if (url.pathname === '/api/command') {
        if (data.command !== 'vorhang' || typeof data.params !== 'string') { respond(res, 400, 'text/plain', 'Invalid command'); return; }
        connection.runtime.harness.app.chatCommands.vorhang(connection.user, data.params);
      } else { connection.runtime.harness.event(connection.user, connection.session, data.type, data.data); }
      respond(res, 200, 'application/json', JSON.stringify(drain(connection.session))); return;
    }
    if (req.method !== 'GET') { respond(res, 405, 'text/plain', 'Method not allowed'); return; }
    if (url.pathname === '/api/poll') {
      const connection = sessions.get(url.searchParams.get('sessionId'));
      if (!connection || connection.session.removed) { respond(res, 404, 'text/plain', 'Demo-Sitzung abgelaufen'); return; }
      connection.touchedAt = Date.now();
      respond(res, 200, 'application/json', JSON.stringify(drain(connection.session))); return;
    }
    if (url.pathname === '/preview') {
      const view = ['wishes', 'studio', 'team', 'schedule'].includes(url.searchParams.get('view')) ? url.searchParams.get('view') : 'radio';
      const sourceId = url.searchParams.get('sourceSession');
      const source = sourceId && sessions.get(sourceId);
      if (sourceId && (!source || source.session.removed)) { respond(res, 404, 'text/plain', 'Demo-Sitzung abgelaufen'); return; }
      const selected = source ? source.runtime : runtime(url.searchParams.get('radio') === 'public');
      if (selected.publicRadio && view !== 'radio') { respond(res, 403, 'text/plain', 'Testansichten sind im Hörmodus nicht verfügbar.'); return; }
      const h = selected.harness;
      const role = !selected.publicRadio && url.searchParams.get('role') === 'moderator' ? 'moderator' : 'listener';
      const user = source ? source.user : h.user(nextUserId++, role === 'moderator' ? 'Testleitung' : 'Testhörer', role === 'moderator' ? 'owner' : 'listener');
      let session = source ? source.session : h.open(user);
      // Ohne Quellsitzung bleibt die einzelne Wunschansicht eine lokale Controller-Diagnose.
      // Im Channel verwenden alle vier Ansichten den echten serverseitigen Overlayweg.
      if (view !== 'radio' && (view !== 'wishes' || source)) {
        let surface = user.sessions.find(item => item.content.viewMode === 'Overlay' && item.activeView === view);
        if (!surface) {
          const events = h.event(user, session, view === 'studio' ? 'mw:openStudio' : view === 'team' ? 'mw:openRadioTeam' : view === 'schedule' ? 'mw:openSchedule' : 'mw:openWishes');
          const result = events.find(event => event.type === 'mw:result');
          surface = user.sessions.find(item => item.content.viewMode === 'Overlay' && item.activeView === view);
          if (!surface) { respond(res, 403, 'text/plain', result ? result.data.message : 'Ansicht nicht verfügbar'); return; }
        }
        session = surface;
      }
      const sessionId = randomUUID();
      sessions.set(sessionId, { user, session, runtime: selected, touchedAt: Date.now() });
      const data = { sessionId, publicRadio: selected.publicRadio, embedded: url.searchParams.get('embedded') === '1',
        pageData: { ...session.content.htmlFile.pageData, ...h.state(user, session), view } };
      drain(session);
      const injection = '<base href="/app/www/">' + '<script>window.MischWerkDemoData=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';</script><script src="/preview-bridge.js"></script>';
      const html = fs.readFileSync(path.join(root, 'app/www/index.html'), 'utf8').replace('<head>', '<head>' + injection);
      respond(res, 200, types['.html'], html); return;
    }
    const route = url.pathname === '/' ? '/preview.html' : url.pathname;
    const previewFiles = { '/preview.html': 'index.html', '/preview-bridge.js': 'bridge.js', '/channel.html': 'channel.html', '/preview.css': 'preview.css', '/channel.js': 'channel.js' };
    if (!Object.prototype.hasOwnProperty.call(previewFiles, route) && !route.startsWith('/app/www/')) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    let file;
    if (route.startsWith('/app/www/')) {
      const publicRoot = path.join(root, 'app', 'www');
      const decoded = decodeURIComponent(route.slice('/app/www/'.length));
      if (decoded.includes('\0')) { respond(res, 400, 'text/plain', 'Invalid path'); return; }
      file = path.resolve(publicRoot, decoded);
      if (!file.startsWith(publicRoot + path.sep)) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    } else { file = path.join(__dirname, previewFiles[route]); }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { respond(res, 404, 'text/plain', 'Nicht gefunden'); return; }
    let body = fs.readFileSync(file);
    // Nur die lokale Darstellung erhält neutrale Testbeschriftungen; Appdateien bleiben unverändert.
    if (route.endsWith('.js')) {
      body = body.toString('utf8').replaceAll('Knuddels-Nick', 'Testrolle').replaceAll('Exakten Nick eingeben', 'Testrolle eingeben')
        .replaceAll('Verbindung zum Knuddels-Channel bestätigt', 'Lokale Testverbindung bestätigt')
        .replaceAll('Öffne diese App in Knuddels mit /mischwerk oder starte die lokale Vorschau aus dem Projektordner.', 'Öffne die lokale Testansicht erneut.')
        .replaceAll('Gestoppt. Dein Mix wartet auf dich.', 'Gestoppt. Mit Play hörst du weiter.')
        .replaceAll('Diese Oberfläche benötigt die Verbindung zum Knuddels-MyChannel.', 'Die lokale Testverbindung fehlt.');
    }
    if (route === '/preview.html') { body = body.toString('utf8').replaceAll('{{APP_VERSION}}', JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version); }
    respond(res, 200, types[path.extname(file)] || 'application/octet-stream', body);
  } catch (error) { respond(res, 500, 'text/plain', 'Vorschau-Fehler: ' + error.message); }
});
setInterval(() => {
  for (const [id, connection] of sessions) {
    if (Date.now() - connection.touchedAt > 10 * 60000) { connection.session.remove(); sessions.delete(id); }
  }
}, 60000).unref();
const port = Number(process.env.MISCHWERK_PREVIEW_PORT || 8765);
server.on('error', error => { console.error('Vorschau konnte nicht starten:', error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('MischWerk Knuddels-App – lokale Testvorschau: http://127.0.0.1:' + server.address().port + '\nBeenden mit Strg+C. Nur App-Testansichten. Die eigenständige Website ist pausiert.'));

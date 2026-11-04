const fs = require('node:fs');
const path = require('node:path');
const { audioFixture } = require('../../../tests/fixtures/audio.cjs');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function send(res, status, type, body, head = false) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  res.end(head ? undefined : body);
}
function safeFile(root, relative) {
  if (!relative || relative.includes('\0') || relative.split(/[\\/]/).includes('..')) throw new Error('Ungültiger Dateipfad.');
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
  if (!fs.realpathSync(target).startsWith(fs.realpathSync(root) + path.sep)) throw new Error('Dateiverknüpfung außerhalb der Freigabe.');
  return target;
}
function asset(req, res, file) {
  const size = fs.statSync(file).size, type = types[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range;
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Cache-Control': req.url.includes('v=') ? 'public, max-age=31536000, immutable' : 'no-cache' };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': 'bytes */' + size }); res.end(); return; }
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
    if (start >= size || start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + size }); res.end(); return; }
    res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': 'bytes ' + start + '-' + end + '/' + size });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  }
}
function sourceAsset(req, res, bytes, relative) {
  const range = req.headers.range, type = types[path.extname(relative)] || 'application/octet-stream', size = bytes.length;
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': req.url.includes('v=') ? 'public, max-age=31536000, immutable' : 'no-cache' };
  if (!range) { res.writeHead(200, { ...headers, 'Content-Length': size }); res.end(req.method === 'HEAD' ? undefined : bytes); return; }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
  const end = match?.[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!match || (!match[1] && !match[2]) || !Number.isFinite(start) || start >= size || start > end) {
    res.writeHead(416, { 'Content-Range': 'bytes */' + size }); res.end(); return;
  }
  res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': 'bytes ' + start + '-' + end + '/' + size });
  res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
}
function httpHandler(hub) {
  const publicRoot = path.resolve(__dirname, '../www'), appRoot = path.join(hub.options.appDir, 'www');
  const fixtureAudio = audioFixture();
  return async (req, res) => {
    try {
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) { send(res, 403, 'text/plain', 'Nur lokaler Zugriff.'); return; }
      if (!['GET', 'HEAD'].includes(req.method)) { send(res, 405, 'text/plain', 'Methode nicht erlaubt.'); return; }
      const url = new URL(req.url, hub.options.origin || 'http://127.0.0.1');
      const route = decodeURIComponent(url.pathname), head = req.method === 'HEAD';
      if (route === '/' || route === '/index.html') {
        const boot = { token: hub.controlToken, profiles: hub.runtime.users.descriptions(), appVersion: hub.options.appConfig.appVersion };
        const injection = '<script>window.EmulatorBoot=' + JSON.stringify(boot).replace(/</g, '\\u003c') + ';</script>';
        send(res, 200, types['.html'], fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8').replace('<!--BOOT-->', injection), head); return;
      }
      if (route === '/api/report') {
        if (req.headers['x-emulator-token'] !== hub.controlToken) { send(res, 403, 'text/plain', 'Ungültige Steuerverbindung.'); return; }
        const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), ...hub.state(true),
          limits: ['Node-VM ist keine Rhino-Engine.', 'Browserprofile ersetzen keinen echten K3/STAPP/iOS-Client.', 'Anbieterfälle sind ausschließlich lokale Testantworten.'] };
        send(res, 200, types['.json'], JSON.stringify(report, null, 2), head); return;
      }
      if (route === '/media/background.png') {
        const file = path.join(hub.options.projectRoot, 'medien/mychannel/Hintergrund_MischWerk_Knuddels.png');
        if (fs.existsSync(file)) { asset(req, res, file); return; }
      }
      if (route.startsWith('/fixture/')) {
        hub.log('providerRequest', { path: route, scenario: hub.faults.provider });
        if (hub.faults.provider === 'slow') await sleep(11000);
        if (hub.faults.provider === 'unconfigured') { send(res, 404, types['.json'], '{"error":"not configured"}'); return; }
        if (hub.faults.provider === 'http-error') { send(res, 503, types['.json'], '{"error":"simuliert"}'); return; }
        if (route === '/fixture/audio.wav') {
          res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': fixtureAudio.length, 'Cache-Control': 'no-store' });
          res.end(head ? undefined : fixtureAudio); return;
        }
        if (hub.faults.provider === 'invalid') { send(res, 200, types['.json'], '{"broken":'); return; }
        const values = { '/fixture/metadata': { title: 'Lokaler Testtitel', artist: 'Emulator-Testsignal', live: false },
          '/fixture/status': { status: hub.faults.provider === 'stopped' ? 'stopped' : 'started' },
          '/fixture/history': [{timestamp:Math.floor(hub.runtime.clock.now() / 1000) - 60, metadata:{song:'Emulator · Lokaler Testtitel'}}] };
        if (values[route]) { send(res, 200, types['.json'], JSON.stringify(values[route]), head); return; }
      }
      if (route.startsWith('/frame/')) {
        const id = route.slice('/frame/'.length), description = hub.runtime.contents.describe(id);
        const socket = hub.sockets.get(url.searchParams.get('connection'));
        if (!description || !socket || socket.nick !== description.nick) { send(res, 404, 'text/plain', 'Sitzung abgelaufen oder gehört zu einem anderen Nutzer.'); return; }
        const file = hub.source.read('www/' + description.htmlPath);
        if (!file) { send(res, 404, 'text/plain', 'HTML-Datei fehlt.'); return; }
        const user = hub.runtime.users.find(description.nick);
        const config = { sessionId: id, nick: description.nick, pageData: description.pageData,
          mode: description.mode, client: user.state.client, connectionId: socket.id,
          cacheVersion: hub.epoch + '-' + hub.runtime.cacheVersion + '-' + hub.resourceGeneration, faults: hub.faults };
        const base = '/app/' + path.posix.dirname(description.htmlPath).replace(/^\.$/, '') + '/';
        const injection = '<base href="' + base.replace('//', '/') + '"><script>window.__Emulator=' +
          JSON.stringify(config).replace(/</g, '\\u003c') + ';</script><script src="/ui/client.js"></script>';
        const html = file.toString('utf8').replace(/<head[^>]*>/i, '$&' + injection);
        res.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; media-src 'self' blob:; frame-src 'self'; object-src 'none'");
        send(res, 200, types['.html'], html, head); return;
      }
      const assetRoot = route.startsWith('/app/') ? appRoot : route.startsWith('/ui/') ? publicRoot : null;
      if (assetRoot) {
        const relative = route.slice(route.indexOf('/', 1) + 1);
        if (route.startsWith('/app/')) {
          if (hub.faults.resourceDelayMs) await sleep(hub.faults.resourceDelayMs);
          if (hub.faults.resourceFailure && relative.includes(hub.faults.resourceFailure)) {
            hub.log('resourceFailure', { path: relative }); send(res, 503, 'text/plain', 'Absichtlicher Ressourcenfehler.'); return;
          }
          const source = hub.source.read('www/' + relative);
          if (source) { sourceAsset(req, res, source, relative); return; }
          send(res, 404, 'text/plain', 'Datei fehlt im laufenden Teststand.'); return;
        }
        const file = safeFile(assetRoot, relative);
        if (file) { asset(req, res, file); return; }
      }
      send(res, 404, 'text/plain; charset=utf-8', 'Nicht gefunden.');
    } catch (error) { hub.log('httpError', { message: error.message }); if (!res.headersSent) send(res, 400, 'text/plain', 'Ungültige Anfrage.'); else res.end(); }
  };
}
module.exports = { httpHandler, safeFile };

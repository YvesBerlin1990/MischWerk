// Historische Regressionstest-Fixture; kein eigenständiger App-Emulator oder Benutzerstartweg.
// Ausschließlich über Tests importieren; eigene isolierte Testdaten und Loopback.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { WebSocketServer } = require('ws');
const { EmulatorHub } = require('./server/hub.cjs');
const { httpHandler } = require('./server/http.cjs');
const { projectRoot } = require('./config.cjs');
function readConfig(appDir) {
  return Object.fromEntries(fs.readFileSync(path.join(appDir, 'app.config'), 'utf8').split(/\r?\n/).filter(line => /^\s*[^#\s][^=]*=/.test(line)).map(line => {
    const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  }));
}
async function createNativeTestLab(options = {}) {
  const appDir = path.resolve(options.appDir || path.join(projectRoot, 'app'));
  const dataDir = options.dataDir || path.join(os.tmpdir(), 'MischWerk-Emulator', 'testdaten');
  const hub = new EmulatorHub({ projectRoot, appDir, dataDir, appConfig: readConfig(appDir),external:options.external });
  const server = http.createServer(httpHandler(hub));
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 32768 });
  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, hub.options.origin);
      const expectedOrigin = hub.options.origin;
      if (url.pathname !== '/control' || url.searchParams.get('token') !== hub.controlToken ||
          request.headers.host !== new URL(expectedOrigin).host ||
          (request.headers.origin && request.headers.origin !== expectedOrigin)) throw new Error('Ungültige lokale Steuerverbindung.');
      sockets.handleUpgrade(request, socket, head, ws => hub.connect(ws));
    } catch { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(options.port ?? 0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port; hub.setOrigin(origin);
  return { hub, server, origin, async close() {
    hub.shutdown(); sockets.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  } };
}
module.exports = { createNativeTestLab, readConfig };

// Explizite lesende Anschlussprüfung. Kein Encoder, Audiostart, Knuddels-Update oder Upload.
const fs = require('node:fs');
const vm = require('node:vm');
const { createHarness } = require('../../tests/support/knuddels.cjs');
async function main() {
  const h = createHarness(), user = h.user(1, 'Lokale Anschlussprüfung', 'owner');
  const station = h.state(user, h.open(user)).station;
  if (!station.configured) {
    console.log(JSON.stringify({ status: 'pending', version: h.config.version, networkRequests: 0,
      message: 'STREAMPANEL-Produktanschlüsse stehen aus. Keine echte Senderprüfung erfolgt.' }, null, 2));
    return;
  }
  let factory;
  vm.runInNewContext(fs.readFileSync('app/www/js/radio/api.js', 'utf8'), {
    URL, AbortController, fetch, setTimeout, clearTimeout,
    window: { fetch, AbortController }, MischWerkUI: { define(name, value) { factory = value; } }
  });
  const api = factory(), urls = api.streamUrls(station);
  if (!urls) { throw new Error('Öffentliche Konfiguration ungültig.'); }
  const report = { status: 'checked', version: h.config.version, checkedAt: new Date().toISOString(),
    scope: 'HTTP-Anschlussprüfung; kein Hörtest und keine K3-/Browser-CORS-Abnahme.', stream: {}, data: {} };
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(urls.stream, { credentials: 'omit', redirect: 'error', signal: controller.signal,
      headers: { Range: 'bytes=0-8191' } });
    report.stream = { httpStatus: response.status, contentType: response.headers.get('content-type'),
      cors: response.headers.get('access-control-allow-origin') };
    if (!response.ok) { throw new Error('Höreradresse antwortet nicht erfolgreich.'); }
    const reader = response.body.getReader();
    const first = await reader.read();
    report.stream.bytesReceived = first.value ? first.value.length : 0;
    await reader.cancel();
    if (!report.stream.bytesReceived) { throw new Error('Höreradresse lieferte keine Daten.'); }
    report.stream.directAudio = /^(audio\/|application\/ogg)/i.test(report.stream.contentType || '');
    if (!report.stream.directAudio) {
      report.stream.note = 'Ausgabeformat prüfen: HLS/MSE benötigt den passenden Produktweg, HTML ist keine Audioquelle.';
    }
  } finally { clearTimeout(timer); controller.abort(); }
  for (const [name, available, read] of [
    ['status', urls.status, () => api.fetchStationStatus(station)],
    ['metadata', urls.metadata, () => api.fetchMetadata(station)],
    ['listeners', urls.listeners, () => api.fetchListeners(station)]
  ]) {
    if (!available) { report.data[name] = { status: 'pending', reason: 'Öffentlicher Anschluss/Feldzuordnung fehlt.' }; continue; }
    try { report.data[name] = { status: 'received', value: await read() }; }
    catch (error) { report.data[name] = { status: 'failed', reason: 'HTTP, JSON, Identität oder Feldzuordnung prüfen.' }; process.exitCode = 1; }
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error('Anschlussprüfung: ' + error.message); process.exitCode = 1; });

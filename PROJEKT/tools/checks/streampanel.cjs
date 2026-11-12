// Explizite lesende Anschlussprüfung. Kein Encoder, Audiostart, Knuddels-Update oder Upload.
const fs = require('node:fs');
const vm = require('node:vm');
const { createHarness } = require('../../tests/support/knuddels.cjs');
async function probeStream(station, api, request = fetch) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  const redirects = [];
  let url = station.streamUrl;
  try {
    for (let hop = 0; hop <= 4; hop++) {
      if (!api.streamUrls({ ...station, streamUrl: url })) {
        throw new Error('Streamweiterleitung außerhalb der öffentlichen HTTPS-Freigabe.');
      }
      const response = await request(url, { credentials: 'omit', redirect: 'manual', signal: controller.signal,
        headers: { Range: 'bytes=0-8191' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (response.body) { await response.body.cancel(); }
        if (!location || hop === 4) { throw new Error('Streamweiterleitung fehlt oder Kette ist zu lang.'); }
        url = new URL(location, url).href;
        redirects.push({ httpStatus: response.status, url });
        continue;
      }
      if (!response.ok) {
        if (response.body) { await response.body.cancel(); }
        throw new Error('Höreradresse antwortet nicht erfolgreich.');
      }
      const report = { httpStatus: response.status, finalUrl: url, redirects,
        contentType: response.headers.get('content-type'), cors: response.headers.get('access-control-allow-origin') };
      const reader = response.body.getReader();
      const first = await reader.read();
      report.bytesReceived = first.value ? first.value.length : 0;
      await reader.cancel();
      if (!report.bytesReceived) { throw new Error('Höreradresse lieferte keine Daten.'); }
      report.directAudio = /^(audio\/|application\/ogg)/i.test(report.contentType || '');
      if (!report.directAudio) {
        report.note = 'Ausgabeformat prüfen: HLS/MSE benötigt den passenden Produktweg, HTML ist keine Audioquelle.';
      }
      return report;
    }
  } finally { clearTimeout(timer); controller.abort(); }
}
async function main() {
  const h = createHarness(), user = h.user(1, 'Lokale Anschlussprüfung', 'owner');
  const station = h.state(user, h.open(user)).station;
  if (!station.configured) {
    console.log(JSON.stringify({ status: 'pending', version: h.config.version, networkRequests: 0,
      message: 'STREAMPANEL-Produktanschlüsse stehen aus. Keine echte Senderprüfung erfolgt.' }, null, 2));
    return;
  }
  const factories = {};
  const scope = {
    URL, AbortController, fetch, setTimeout, clearTimeout,
    window: { fetch, AbortController }, MischWerkUI: { define(name, value) { factories[name] = value; } }
  };
  for (const file of ['metadata.js', 'requests.js', 'api.js']) {
    vm.runInNewContext(fs.readFileSync('app/www/js/radio/' + file, 'utf8'), scope);
  }
  const api = factories.radioApi({ metadata: factories.songMetadata(), requests: factories.radioRequests() }), urls = api.streamUrls(station);
  if (!urls) { throw new Error('Öffentliche Konfiguration ungültig.'); }
  const report = { status: 'checked', version: h.config.version, checkedAt: new Date().toISOString(),
    scope: 'HTTP-Anschlussprüfung; kein Hörtest und keine K3-/Browser-CORS-Abnahme.', stream: {}, data: {} };
  report.stream = await probeStream(station, api);
  for (const [name, available, read] of [
    ['status', urls.status, () => api.fetchStationStatus(station)],
    ['metadata', urls.metadata, () => api.fetchMetadata(station)],
    ['mode', urls.mode, () => api.fetchBroadcastMode(station)]
  ]) {
    if (!available) { report.data[name] = { status: 'pending', reason: 'Öffentlicher Anschluss/Feldzuordnung fehlt.' }; continue; }
    try { report.data[name] = { status: 'received', value: await read() }; }
    catch (error) { report.data[name] = { status: 'failed', reason: 'HTTP, JSON, Identität oder Feldzuordnung prüfen.' }; process.exitCode = 1; }
  }

  console.log(JSON.stringify(report, null, 2));
}
if (require.main === module) {
  main().catch(error => { console.error('Anschlussprüfung: ' + error.message); process.exitCode = 1; });
}
module.exports = { probeStream };

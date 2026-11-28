// Ausdrücklich angeforderter HTTP-Abgleich. Kein Upload, Update oder Appneustart.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { frontendFiles } = require('../lib/frontend-files.cjs');
const { createDelivery } = require('../build/prepare-upload.cjs');
const root = path.resolve(__dirname, '../..');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function checkDelivery(baseUrl, { project = root } = {}) {
  if (!baseUrl) throw new Error('Eine ausdrücklich gewählte --base-url ist erforderlich.');
  const base = new URL(baseUrl);
  if (base.username || base.password || base.search || base.hash || !base.pathname.endsWith('/') ||
      !(base.protocol === 'https:' || (base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)))) {
    throw new Error('Basisadresse ohne Zugangsdaten, Query oder Fragment und mit abschließendem / verwenden; HTTPS oder lokales HTTP.');
  }
  const manifestFile = path.join(project,'deployment/manifests/manifest-live.json');
  const bundled = fs.existsSync(manifestFile) && JSON.parse(fs.readFileSync(manifestFile,'utf8')).bundled === true;
  const delivery = bundled ? createDelivery(project) : new Map();
  const files = frontendFiles.filter(file => /\.(html|js|css)$/.test(file) && (!bundled || delivery.has('www/' + file)));
  const results = new Array(files.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (;;) {
      const index = cursor++, file = files[index];
      if (!file) return;
      const expected = delivery.get('www/' + file) || fs.readFileSync(path.join(project, 'app/www', file));
      const result = { file, status: 'unreachable', httpStatus: null, expectedBytes: expected.length, expectedSha256: digest(expected) };
      try {
        const response = await fetch(new URL(file, base), {
          credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000),
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
        });
        const actual = Buffer.from(await response.arrayBuffer());
        result.httpStatus = response.status;
        result.receivedBytes = actual.length;
        result.receivedSha256 = digest(actual);
        result.lastModified = response.headers.get('last-modified');
        result.status = !response.ok ? 'http-error' : result.receivedSha256 === result.expectedSha256 ? 'match' : 'different';
      } catch { /* Keine fremden Antworttexte, Zugangsdaten oder Nutzdaten ausgeben. */ }
      results[index] = result;
    }
  }));
  const mismatches = results.filter(file => file.status !== 'match');
  return { checkedAt: new Date().toISOString(), baseUrl: base.href,
    version: JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).version,
    ok: !mismatches.length, checkedFiles: files.length, matchingFiles: files.length - mismatches.length,
    scope: 'Öffentliche HTML-/JS-/CSS-Auslieferung gegen lokale Appbytes. Keine Backend-, Medien- oder native Funktionsabnahme.',
    mismatches };
}
if (require.main === module) {
  const { values } = parseArgs({ options: { 'base-url': { type: 'string' } } });
  checkDelivery(values['base-url']).then(report => {
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  }).catch(error => { console.error('Auslieferungsprüfung: ' + error.message); process.exitCode = 1; });
}
module.exports = { checkDelivery };

// Lokale Bereitstellung im festgelegten Uploadordner. Keine ZIP, Netzwerkverbindung oder Veröffentlichung.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { buildBackend } = require('./backend.cjs');
const { runtimeFiles, isBinary, checkText, checkRuntime } = require('../checks/lengths.cjs');
const { manifestGroups } = require('../lib/upload-manifests.cjs');
const { readRelease, checkAppConfig } = require('../lib/release-identity.cjs');
const root = path.resolve(__dirname, '../..');
const include = runtimeFiles;
const { frontendFiles } = require('../lib/frontend-files.cjs');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
// Ausschließlich Auslieferung: vollständige Quellmodule in unveränderter Reihenfolge bündeln.
// Bestehende Dateinamen/Inventare bleiben erhalten; kein Minifizieren und kein neuer Ladeweg.
function createDelivery(project = root) {
  const read = file => fs.readFileSync(path.join(project, 'app/www', file), 'utf8');
  const plans = {};
  for (const view of ['radio','wishes','studio','team','schedule']) {
    const scripts = [], styles = [];
    const document = { readyState:'loading', addEventListener() {}, documentElement:{ getAttribute:() => view, setAttribute() {} } };
    const scope = { document, window:{}, setTimeout() {}, Client:{ pageData:{view},
      includeJS:file => scripts.push(file), includeCSS:file => styles.push(file) } };
    vm.runInNewContext(read('index.html').match(/<script>([\s\S]*?)<\/script>/)[1], scope);
    vm.runInNewContext(read('js/start.js'), scope);
    plans[view] = { scripts, styles };
  }
  const delivery = new Map(), skipped = { scripts:[], styles:[] };
  for (const [type, extension] of [['scripts','.js'],['styles','.css']]) {
    const files = frontendFiles.filter(file => file.endsWith(extension) && file !== 'js/start.js');
    const membership = file => Object.keys(plans).filter(view => plans[view][type].includes(file)).join(' ');
    let group = [];
    const separator = type === 'scripts' ? '\n;\n' : '\n';
    function flush() {
      if (group.length > 1) {
        delivery.set('www/' + group[0], Buffer.from(group.map(read).join(separator)));
        skipped[type].push(...group.slice(1));
      }
      group = [];
    }
    for (const file of files) {
      const candidate = [...group,file].map(read).join(separator);
      if (group.length && (membership(group[0]) !== membership(file) || candidate.length >= 9500)) flush();
      group.push(file);
    }
    flush();
  }
  const start = read('js/start.js');
  assert.ok(start.includes('loadPlan.forEach(function (module) {'), 'JS-Ladeplan für Bündel nicht gefunden');
  delivery.set('www/js/start.js', Buffer.from(start.replace('loadPlan.forEach(function (module) {',
    'loadPlan.filter(function (module) { return ' + JSON.stringify(skipped.scripts) +
    ".indexOf('js/' + module[1]) === -1; }).forEach(function (module) {")));
  const html = read('index.html');
  const filter = 'styles.filter(styleApplies)';
  assert.ok(html.includes(filter), 'CSS-Ladeplan für Bündel nicht gefunden');
  delivery.set('www/index.html', Buffer.from(html.replace(filter,
    filter + '.filter(function (file) { return ' + JSON.stringify(skipped.styles) + '.indexOf(file) === -1; })')));
  for (const [file, bytes] of delivery) {
    assert.ok(bytes.toString('utf8').length < 9500, 'Auslieferungsbündel zu groß: ' + file);
    if (file.endsWith('.js')) new vm.Script(bytes.toString('utf8'), { filename:file });
  }
  return delivery;
}
function properties(text) {
  const data = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || /^\s*[#!]/.test(line)) { continue; }
    const match = line.match(/^\s*([^=\s]+)\s*=\s*(.*?)\s*$/);
    assert.ok(match, 'Ungültige app.config-Zeile');
    assert.ok(!(match[1] in data), 'Doppelter app.config-Key'); data[match[1]] = match[2];
  }
  return data;
}
function build() {
  buildBackend();
  for (const args of [['--test', 'tests/node/backend.test.cjs', 'tests/node/administration.test.cjs', 'tests/node/wish-positions.test.cjs', 'tests/node/stream.test.cjs', 'tests/node/history.test.cjs', 'tests/node/upload.test.cjs', 'tests/node/preview.test.cjs', 'tests/node/schedule.test.cjs', 'tests/node/announcements.test.cjs', 'tests/node/channel-texts.test.cjs', 'tests/node/handover.test.cjs', 'tests/node/studio-features.test.cjs', 'tests/node/website.test.cjs', 'tests/node/android.test.cjs', 'tests/node/android-settings.test.cjs', 'tests/node/emulator.test.cjs'], ['tools/checks/project.cjs'], ['tools/checks/rhino.cjs']]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
    assert.equal(result.status, 0, 'Prüfung fehlgeschlagen; Uploadordner nicht aktualisiert.');
  }
  const live = JSON.parse(fs.readFileSync(path.join(root, 'deployment/live.json'), 'utf8'));
  const appRoot = path.join(root, 'app');
  const config = properties(fs.readFileSync(path.join(appRoot, 'app.config'), 'utf8'));
  const { version, buildNumber } = readRelease(root);
  checkAppConfig(path.join(appRoot, 'app.config'), { version, buildNumber });
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.match(live.appKey, /^[A-Za-z][A-Za-z0-9_-]*$/);
  assert.equal(config.appName, 'MischWerk'); assert.equal(config.appVersion, version);
  assert.equal(config['appDeveloper.knuddelsDE'], live.developerNick);
  assert.equal(config.autoUpdate, 'false');
  assert.ok(Object.entries(config).some(([key, value]) => key.startsWith('mayBeInstalledBy.') && value === live.ownerNick + '.knuddelsDE'));
  assert.equal(live.environment, 'live');
  // LIVE nutzt hier nachweislich ebenfalls das App-ID-Präfix knuddelsDEV.
  // Maßgeblich: tatsächliche Appverwaltung; nicht vom FTP-Host ableiten.
  assert.equal(live.serverId, 'knuddelsDEV'); assert.equal(live.ftp.host, 'appupload.knuddels.de');
  assert.equal(live.ftp.security, 'explicit-tls'); assert.equal(live.ftp.username, live.developerId);
  assert.equal(live.appId, live.serverId + '.' + live.developerId + '.' + live.appKey);
  assert.equal(live.installId, live.developerId + '.' + live.appKey);
  new vm.Script(fs.readFileSync(path.join(appRoot, 'main.js'), 'utf8'), { filename: 'main.js' });
  checkRuntime(appRoot);
  assert.ok(typeof live.localUploadRoot === 'string' && path.isAbsolute(live.localUploadRoot), 'Absoluter lokaler Uploadpfad fehlt');
  const uploadRoot = path.resolve(live.localUploadRoot);
  assert.equal(path.basename(uploadRoot).toUpperCase(), 'UPLOAD', 'Uploadwurzel muss UPLOAD heißen');
  const installation = path.join(root, 'deployment', 'manifests');
  const manifestFolders = [...new Set([installation, path.join(path.dirname(uploadRoot), 'PROJEKT', 'deployment', 'manifests')])];
  const upload = path.join(uploadRoot, live.appKey);
  const delivery = createDelivery();
  for (const folder of manifestFolders) { fs.mkdirSync(folder, { recursive: true }); }
  fs.mkdirSync(uploadRoot, { recursive: true });
  assert.ok(fs.readdirSync(uploadRoot).every(name => name === live.appKey), 'Fremde Dateien neben dem Uploadziel');
  fs.mkdirSync(upload, { recursive: true });
  for (const file of include) {
    const input = path.join(appRoot, file); const output = path.join(upload, file);
    if (!isBinary(file)) { assert.ok(!fs.readFileSync(input).subarray(0, 3).equals(Buffer.from([239,187,191])), 'UTF-8-BOM in ' + file); }
    fs.mkdirSync(path.dirname(output), { recursive: true });
    if (delivery.has(file)) fs.writeFileSync(output, delivery.get(file));
    else fs.copyFileSync(input, output);
    assert.ok(fs.readFileSync(output).equals(delivery.get(file) || fs.readFileSync(input)));
  }
  checkRuntime(upload);
  const { createHarness } = require('../../tests/support/knuddels.cjs');
  const h = createHarness();
  const probeUser = h.user(1, 'Lokale Paketpruefung', 'owner');
  const stationConfigured = h.state(probeUser, h.open(probeUser)).station.configured;
  const manifest = {
    environment: live.environment, appId: live.appId, installId: live.installId,
    channel: live.channelName, version, buildNumber, remotePath: live.ftp.remoteRoot + '/' + live.appKey,
    stationConfigured, ftpHost: live.ftp.host, ftpUser: live.ftp.username,
    delivery: 'upload-directory', bundled:true, localUploadRoot: uploadRoot, fileCount: include.length, fileManifests: []
  };
  // Getrennte, vollständige Dateinachweise für Server und Oberfläche statt eines übergroßen JSON.
  for (const [name, files] of Object.entries(manifestGroups(include, isBinary))) {
    const file = path.join(installation, name);
    const content = { version, buildNumber, files: files.map(relative => ({ path: live.appKey + '/' + relative,
      bytes: fs.statSync(path.join(upload, relative)).size, sha256: digest(path.join(upload, relative)) })) };
    fs.writeFileSync(file, JSON.stringify(content, null, 2) + '\n', 'utf8');
    checkText(file);
    manifest.fileManifests.push({ path: name, fileCount: files.length, bytes: fs.statSync(file).size, sha256: digest(file) });
  }
  fs.writeFileSync(path.join(installation, 'manifest-live.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  checkText(path.join(installation, 'manifest-live.json'));
  // Identische Dateinachweise auch neben dem verbindlichen Desktop-Upload bereitstellen.
  for (const folder of manifestFolders.filter(folder => folder !== installation)) {
    for (const name of ['manifest-live.json', ...manifest.fileManifests.map(item => item.path)]) {
      fs.copyFileSync(path.join(installation, name), path.join(folder, name));
    }
  }
  const { checkUpload } = require('../checks/upload.cjs');
  for (const folder of manifestFolders) { checkUpload({ manifestFolder: folder }); }
  console.log(JSON.stringify({ version, buildNumber, appId: live.appId, remotePath: manifest.remotePath, uploadRoot,
    upload, fileCount: include.length, stationConfigured: manifest.stationConfigured }, null, 2));
}
module.exports = { properties, include, createDelivery };
if (require.main === module) { try { build(); } catch (error) { console.error('Upload-Bereitstellung: ' + error.message); process.exitCode = 1; } }

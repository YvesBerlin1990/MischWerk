// Lokale Bereitstellung im festgelegten Uploadordner. Keine ZIP, Netzwerkverbindung oder Veröffentlichung.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { buildBackend } = require('./backend.cjs');
const { runtimeFiles, isBinary, checkText, checkRuntime } = require('../checks/lengths.cjs');
const root = path.resolve(__dirname, '../..');
const include = runtimeFiles;
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
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
  for (const args of [['--test', 'tests/node/backend.test.cjs', 'tests/node/wish-positions.test.cjs', 'tests/node/stream.test.cjs', 'tests/node/upload.test.cjs', 'tests/node/preview.test.cjs', 'tests/node/schedule.test.cjs', 'tests/node/announcements.test.cjs', 'tests/node/handover.test.cjs'], ['tools/checks/project.cjs'], ['tools/checks/rhino.cjs']]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
    assert.equal(result.status, 0, 'Prüfung fehlgeschlagen; Uploadordner nicht aktualisiert.');
  }
  const live = JSON.parse(fs.readFileSync(path.join(root, 'deployment/live.json'), 'utf8'));
  const appRoot = path.join(root, 'app');
  const config = properties(fs.readFileSync(path.join(appRoot, 'app.config'), 'utf8'));
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
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
  for (const folder of manifestFolders) { fs.mkdirSync(folder, { recursive: true }); }
  fs.mkdirSync(uploadRoot, { recursive: true });
  assert.ok(fs.readdirSync(uploadRoot).every(name => name === live.appKey), 'Fremde Dateien neben dem Uploadziel');
  fs.mkdirSync(upload, { recursive: true });
  for (const file of include) {
    const input = path.join(appRoot, file); const output = path.join(upload, file);
    if (!isBinary(file)) { assert.ok(!fs.readFileSync(input).subarray(0, 3).equals(Buffer.from([239,187,191])), 'UTF-8-BOM in ' + file); }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.copyFileSync(input, output);
    assert.equal(digest(input), digest(output));
  }
  checkRuntime(upload);
  const { createHarness } = require('../../tests/support/knuddels.cjs');
  const h = createHarness();
  const probeUser = h.user(1, 'Lokale Paketpruefung', 'owner');
  const stationConfigured = h.state(probeUser, h.open(probeUser)).station.configured;
  const manifest = {
    environment: live.environment, appId: live.appId, installId: live.installId,
    channel: live.channelName, version, remotePath: live.ftp.remoteRoot + '/' + live.appKey,
    stationConfigured, ftpHost: live.ftp.host, ftpUser: live.ftp.username,
    delivery: 'upload-directory', localUploadRoot: uploadRoot, fileCount: include.length, fileManifests: []
  };
  // Getrennte, vollständige Dateinachweise für Server und Oberfläche statt eines übergroßen JSON.
  for (const [name, files] of [
    ['manifest-server.json', include.filter(file => !file.startsWith('www/'))],
    ['manifest-www.json', include.filter(file => file.startsWith('www/') && !isBinary(file))],
    ['manifest-media.json', include.filter(file => file.startsWith('www/') && isBinary(file))]
  ]) {
    const file = path.join(installation, name);
    const content = { version, files: files.map(relative => ({ path: live.appKey + '/' + relative,
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
  console.log(JSON.stringify({ appId: live.appId, remotePath: manifest.remotePath, uploadRoot,
    upload, fileCount: include.length, stationConfigured: manifest.stationConfigured }, null, 2));
}
if (require.main === module) { try { build(); } catch (error) { console.error('Upload-Bereitstellung: ' + error.message); process.exitCode = 1; } }
module.exports = { properties, include };

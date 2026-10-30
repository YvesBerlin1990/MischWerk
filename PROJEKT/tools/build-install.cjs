// Lokales Paketwerkzeug. Keine Netzwerkverbindung und kein Upload.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { writeBundle } = require('./build-backend.cjs');
const root = path.resolve(__dirname, '..');
const projectFolder = path.resolve(root, '..');
const include = ['main.js', 'app.config', 'www/index.html', 'www/css/style.css', 'www/js/app.js', 'www/img/mischwerk-logo.png'];
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
  writeBundle();
  for (const args of [['--test', 'tests/backend.test.cjs', 'tests/preview.test.cjs'], ['tools/check.cjs']]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
    assert.equal(result.status, 0, 'Prüfung fehlgeschlagen; kein Paket erzeugt.');
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
  const sourceFiles = [];
  function list(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      assert.ok(!entry.isSymbolicLink(), 'Symlinks werden nicht verpackt.');
      if (entry.isDirectory()) { list(path.join(directory, entry.name), relative + '/'); }
      else { sourceFiles.push(relative); }
    }
  }
  list(appRoot); assert.deepEqual(sourceFiles.sort(), [...include].sort(), 'Unerwartete oder fehlende Laufzeitdateien');
  const installation = path.join(projectFolder, 'ANLEITUNGEN', 'Paket');
  const upload = path.join(projectFolder, 'UPLOAD', live.appKey);
  fs.mkdirSync(installation, { recursive: true });
  fs.mkdirSync(upload, { recursive: true });
  for (const file of include) {
    const input = path.join(appRoot, file); const output = path.join(upload, file);
    if (!file.endsWith('.png')) { assert.ok(!fs.readFileSync(input).subarray(0, 3).equals(Buffer.from([239,187,191])), 'UTF-8-BOM in ' + file); }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.copyFileSync(input, output);
    assert.equal(digest(input), digest(output));
  }
  const actualUpload = [];
  function checkUpload(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      assert.ok(!entry.isSymbolicLink(), 'Symlink im Uploadordner');
      if (entry.isDirectory()) { checkUpload(path.join(directory, entry.name), prefix + entry.name + '/'); }
      else { actualUpload.push(prefix + entry.name); }
    }
  }
  checkUpload(upload); assert.deepEqual(actualUpload.sort(), [...include].sort(), 'Uploadordner enthält fremde Dateien');
  const { createHarness } = require('./knuddels-mock.cjs');
  const h = createHarness();
  const probeUser = h.user(1, 'Lokale Paketpruefung', 'owner');
  const stationConfigured = h.state(probeUser, h.open(probeUser)).station.configured;
  const manifest = {
    environment: live.environment, appId: live.appId, installId: live.installId,
    channel: live.channelName, version, remotePath: live.ftp.remoteRoot + '/' + live.appKey,
    stationConfigured, ftpHost: live.ftp.host, ftpUser: live.ftp.username,
    files: include.map(file => ({ path: live.appKey + '/' + file, bytes: fs.statSync(path.join(upload, file)).size, sha256: digest(path.join(upload, file)) }))
  };
  fs.writeFileSync(path.join(installation, 'manifest-live.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  const archive = path.join(installation, live.appKey + '-Knuddels-LIVE-' + version + '.zip');
  const quote = value => "'" + value.replace(/'/g, "''") + "'";
  const temporaryArchive = archive + '.' + Date.now() + '.tmp';
  assert.deepEqual(fs.readdirSync(path.dirname(upload)), [live.appKey], 'Fremde Ordner neben dem Uploadziel');
  const command = 'Add-Type -AssemblyName System.IO.Compression; Add-Type -AssemblyName System.IO.Compression.FileSystem; ' +
    '$mwBase = ' + quote(path.dirname(upload)) + '; ' +
    '$mwZip = [IO.Compression.ZipFile]::Open(' + quote(temporaryArchive) + ', [IO.Compression.ZipArchiveMode]::Create); ' +
    'try { foreach ($mwFile in [IO.Directory]::GetFiles($mwBase, "*", [IO.SearchOption]::AllDirectories)) { ' +
    '$mwEntryName = $mwFile.Substring($mwBase.Length + 1).Replace(\'\\\', \'/\'); ' +
    '[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($mwZip, $mwFile, $mwEntryName, [IO.Compression.CompressionLevel]::Optimal); ' +
    '} } finally { $mwZip.Dispose() }';
  const zip = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd: root, stdio: 'inherit', windowsHide: true });
  assert.equal(zip.status, 0, 'ZIP-Erstellung fehlgeschlagen');
  fs.renameSync(temporaryArchive, archive);
  fs.writeFileSync(path.join(installation, 'SHA256-LIVE.txt'), digest(archive) + '  ' + path.basename(archive) + '\n', 'utf8');
  console.log(JSON.stringify({ appId: live.appId, remotePath: manifest.remotePath, upload, archive, fileCount: include.length, stationConfigured: manifest.stationConfigured }, null, 2));
}
if (require.main === module) { try { build(); } catch (error) { console.error('LIVE-Paket: ' + error.message); process.exitCode = 1; } }
module.exports = { properties, include };

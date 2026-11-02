// Fertige Manifeste, Uploadkopien und unkomprimierten ZIP-Inhalt unabhängig abgleichen.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { runtimeFiles, checkText, checkRuntime } = require('./check-file-lengths.cjs');
const root = path.resolve(__dirname, '..', '..');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
function checkPackage() {
  const folder = path.join(root, 'ANLEITUNGEN/Paket');
  const upload = path.join(root, 'UPLOAD');
  const manifestFile = path.join(folder, 'manifest-live.json');
  checkText(manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const files = [];
  assert.deepEqual(manifest.fileManifests.map(item => item.path).sort(), ['manifest-server.json', 'manifest-www.json']);
  for (const item of manifest.fileManifests) {
    const file = path.join(folder, item.path);
    checkText(file);
    assert.equal(hash(file), item.sha256, 'Teilmanifest-Prüfsumme');
    assert.equal(fs.statSync(file).size, item.bytes);
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(content.version, manifest.version);
    assert.equal(content.files.length, item.fileCount);
    files.push(...content.files);
  }
  assert.equal(files.length, manifest.fileCount);
  assert.deepEqual(files.map(file => file.path).sort(), runtimeFiles.map(file => 'MischWerk/' + file).sort());
  for (const item of files) {
    const file = path.join(upload, item.path);
    assert.equal(fs.statSync(file).size, item.bytes, item.path);
    assert.equal(hash(file), item.sha256, item.path);
  }
  checkRuntime(path.join(upload, 'MischWerk'));
  const checksum = path.join(folder, 'SHA256-LIVE.txt');
  checkText(checksum);
  const archiveName = 'MischWerk-Knuddels-LIVE-' + manifest.version + '.zip';
  const archive = path.join(folder, archiveName);
  assert.equal(fs.readFileSync(checksum, 'utf8').trim(), hash(archive) + '  ' + archiveName);
  const quoted = archive.replace(/'/g, "''");
  const command = "Add-Type -AssemblyName System.IO.Compression.FileSystem; " +
    "$mwZip = [IO.Compression.ZipFile]::OpenRead('" + quoted + "'); try { $mwEntries = @(foreach ($mwEntry in $mwZip.Entries) { " +
    "$mwStream = $mwEntry.Open(); $mwBuffer = New-Object IO.MemoryStream; $mwSha = [Security.Cryptography.SHA256]::Create(); " +
    "try { $mwStream.CopyTo($mwBuffer); $mwBytes = $mwBuffer.ToArray(); $mwLength = $null; " +
    "if (!$mwEntry.FullName.EndsWith('.png') -and !$mwEntry.FullName.EndsWith('.mp3')) { $mwDecoder = New-Object Text.UTF8Encoding($false,$true); " +
    "$mwLength = $mwDecoder.GetString($mwBytes).Length; if ($mwLength -ge 9500) { throw 'Zeichengrenze im ZIP überschritten' } }; " +
    "[pscustomobject]@{ path=$mwEntry.FullName; bytes=$mwBytes.Length; characters=$mwLength; " +
    "sha256=[BitConverter]::ToString($mwSha.ComputeHash($mwBytes)).Replace('-','') } " +
    "} finally { $mwStream.Dispose(); $mwBuffer.Dispose(); $mwSha.Dispose() } }); " +
    "ConvertTo-Json -InputObject $mwEntries -Compress } finally { $mwZip.Dispose() }";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', windowsHide: true, maxBuffer: 1000000 });
  assert.equal(result.status, 0, 'ZIP-Prüfung fehlgeschlagen');
  const entries = JSON.parse(result.stdout.replace(/^\uFEFF/, ''));
  assert.deepEqual(entries.map(item => item.path).sort(), files.map(item => item.path).sort());
  for (const entry of entries) {
    const item = files.find(file => file.path === entry.path);
    assert.equal(entry.bytes, item.bytes, entry.path);
    assert.equal(entry.sha256, item.sha256, entry.path);
    if (entry.characters !== null) { assert.ok(entry.characters < 9500, entry.path); }
  }
  return { version: manifest.version, files: files.length, textFiles: entries.filter(item => item.characters !== null).length,
    maximumCharacters: Math.max(...entries.map(item => item.characters || 0)), sha256: hash(archive) };
}
if (require.main === module) { console.log('Fertiges Paket geprüft:', checkPackage()); }
module.exports = { checkPackage };

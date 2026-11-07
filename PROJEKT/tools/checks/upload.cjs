// Dateimanifeste, gepflegte Laufzeitdateien und den verbindlichen Uploadordner unabhängig abgleichen.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { runtimeFiles, isBinary, checkText, checkRuntime } = require('./lengths.cjs');
const { manifestGroups } = require('../lib/upload-manifests.cjs');
const { readRelease, checkAppConfig, checkBackendConfig } = require('../lib/release-identity.cjs');
const project = path.resolve(__dirname, '../..');
const { createDelivery } = require('../build/prepare-upload.cjs');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
function checkUpload(options = {}) {
  const source = options.project || project;
  const release = readRelease(source);
  const live = JSON.parse(fs.readFileSync(path.join(source, 'deployment/live.json'), 'utf8'));
  assert.ok(typeof live.localUploadRoot === 'string' && path.isAbsolute(live.localUploadRoot), 'Absoluter lokaler Uploadpfad fehlt');
  const upload = path.resolve(live.localUploadRoot);
  assert.equal(path.basename(upload).toUpperCase(), 'UPLOAD');
  checkAppConfig(path.join(source, 'app', 'app.config'), release);
  checkAppConfig(path.join(upload, 'MischWerk', 'app.config'), release);
  checkBackendConfig(path.join(source, 'app', 'server', 'config.js'), release);
  checkBackendConfig(path.join(upload, 'MischWerk', 'server', 'config.js'), release);
  const folder = options.manifestFolder || path.join(source, 'deployment', 'manifests');
  const manifestFile = path.join(folder, 'manifest-live.json');
  checkText(manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert.equal(manifest.delivery, 'upload-directory');
  assert.equal(path.resolve(manifest.localUploadRoot), upload, 'Falsches lokales Uploadziel');
  assert.equal(manifest.version, release.version);
  assert.equal(manifest.buildNumber, release.buildNumber, 'Upload-Buildnummer passt nicht zur Paketdatei');
  const files = [];
  const delivery = manifest.bundled === true ? createDelivery(source) : new Map();
  const expectedFiles = manifest.bundled === true ? [...delivery.keys()] : runtimeFiles;
  const groups = manifestGroups(expectedFiles, isBinary);
  assert.deepEqual(manifest.fileManifests.map(item => item.path).sort(), Object.keys(groups).sort());
  for (const item of manifest.fileManifests) {
    const file = path.join(folder, item.path);
    checkText(file);
    assert.equal(hash(file), item.sha256, 'Teilmanifest-Prüfsumme');
    assert.equal(fs.statSync(file).size, item.bytes);
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(content.version, manifest.version);
    assert.equal(content.buildNumber, manifest.buildNumber, 'Teilmanifest-Buildnummer passt nicht zur Uploadkennung');
    assert.equal(content.files.length, item.fileCount);
    assert.deepEqual(content.files.map(item => item.path).sort(), groups[item.path].map(file => 'MischWerk/' + file).sort());
    files.push(...content.files);
  }
  assert.equal(files.length, manifest.fileCount);
  assert.deepEqual(files.map(file => file.path).sort(), expectedFiles.map(file => 'MischWerk/' + file).sort());
  assert.deepEqual(fs.readdirSync(upload).sort(), ['MischWerk'], 'Fremde Dateien neben der App');
  const lengths = checkRuntime(path.join(upload, 'MischWerk'), expectedFiles);
  checkRuntime(path.join(source, 'app'));
  for (const item of files) {
    const file = path.join(upload, item.path);
    const original = path.join(source, 'app', item.path.slice('MischWerk/'.length));
    assert.equal(fs.statSync(file).size, item.bytes, item.path);
    assert.equal(hash(file), item.sha256, item.path);
    const expected = delivery.get(item.path.slice('MischWerk/'.length)) || fs.readFileSync(original);
    assert.equal(crypto.createHash('sha256').update(expected).digest('hex').toUpperCase(), item.sha256,
      'Upload weicht von den Quellen ab: ' + item.path);
  }
  return { version: manifest.version, buildNumber: manifest.buildNumber, uploadRoot: upload, files: files.length, textFiles: lengths.length,
    maximumCharacters: Math.max(...lengths.map(item => item.characters)) };
}
if (require.main === module) { console.log('Uploadordner geprüft:', checkUpload()); }
module.exports = { checkUpload };

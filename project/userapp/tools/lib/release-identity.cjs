// Reproduzierbare Versions-/Buildkennung aus der gepflegten Paketdatei.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
function readRelease(project) {
  const data = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
  assert.match(data.version, /^\d+\.\d+\.\d+$/, 'Ungültige Appversion');
  assert.ok(Number.isSafeInteger(data.buildNumber) && data.buildNumber > 0, 'Buildnummer muss eine positive ganze Zahl sein');
  return { version: data.version, buildNumber: data.buildNumber };
}
function checkAppConfig(file, release) {
  const text = fs.readFileSync(file, 'utf8');
  const versions = [...text.matchAll(/^appVersion[ \t]*=[ \t]*([^ \t\r\n]+)[ \t]*\r?$/gm)];
  const builds = [...text.matchAll(/^#[ \t]*Buildnummer[ \t]*=[ \t]*(\d+)[ \t]*\r?$/gm)];
  assert.equal(versions.length, 1, 'app.config benötigt genau eine Appversion');
  assert.equal(versions[0][1], release.version, 'Appversion in app.config passt nicht zur Paketdatei');
  assert.equal(builds.length, 1, 'app.config benötigt genau einen Buildnummer-Kommentar');
  assert.equal(Number(builds[0][1]), release.buildNumber, 'Buildnummer in app.config passt nicht zur Paketdatei');
}
function checkBackendConfig(file, release) {
  const scope = {};
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }).runInNewContext(scope);
  assert.equal(scope.MischWerkConfig.version, release.version, 'Backend-Konfiguration und Paketversion muessen uebereinstimmen');
  assert.equal(scope.MischWerkConfig.buildNumber, release.buildNumber, 'Backend-Konfiguration und Buildnummer muessen uebereinstimmen');
}
module.exports = { readRelease, checkAppConfig, checkBackendConfig };

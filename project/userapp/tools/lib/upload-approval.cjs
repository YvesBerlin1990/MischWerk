// Externe MyChannel-Deploy-Freigabe erst nach vollständigem Paketabgleich atomar erzeugen.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { checkRuntime } = require('../checks/lengths.cjs');
function rejectLinks(file) {
  for (let current = path.resolve(file); ; current = path.dirname(current)) {
    assert.ok(!fs.lstatSync(current).isSymbolicLink(), 'Verknüpfung im Freigabepfad');
    if (current === path.dirname(current)) break;
  }
}
function approvalFiles(directory, delivery) {
  const names = [...delivery.keys()].sort(), seen = new Set();
  for (const name of names) {
    assert.ok(!path.isAbsolute(name) && !/[\\:\u0000]/.test(name) &&
      name.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part)), 'Ungültiger Freigabepfad');
    assert.ok(!seen.has(name.toLowerCase()), 'Doppelter Freigabepfad'); seen.add(name.toLowerCase());
  }
  checkRuntime(directory, names);
  return names.map(name => {
    const file = path.join(directory, name); rejectLinks(file);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.equals(delivery.get(name)), 'Freigabe weicht vom geprüften Paket ab: ' + name);
    return { path:name, size:bytes.length, sha256:crypto.createHash('sha256').update(bytes).digest('hex') };
  });
}
function writeUploadApproval(directory, release, delivery, approvalAppVersion = release.version) {
  assert.match(approvalAppVersion, /^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/);
  assert.ok(Number.isSafeInteger(release.buildNumber) && release.buildNumber > 0);
  rejectLinks(directory);
  const approval = { schemaVersion:1, appName:release.appName, appVersion:approvalAppVersion,
    buildNumber:release.buildNumber, releaseId:crypto.randomUUID(), files:approvalFiles(directory, delivery) };
  assert.ok(typeof approval.appName === 'string' && approval.appName);
  const folder = path.join(path.dirname(directory), '.freigaben');
  fs.mkdirSync(folder, {recursive:true}); rejectLinks(folder);
  const file = path.join(folder, path.basename(directory) + '.json');
  if (fs.existsSync(file)) rejectLinks(file);
  const temporary = path.join(folder, '.' + path.basename(directory) + '.' + approval.releaseId + '.tmp');
  try {
    fs.writeFileSync(temporary, JSON.stringify(approval, null, 2) + '\n', {flag:'wx'});
    assert.deepEqual(JSON.parse(fs.readFileSync(temporary,'utf8')), approval);
    assert.deepEqual(approvalFiles(directory, delivery), approval.files);
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return file;
}
module.exports = { writeUploadApproval };

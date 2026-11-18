// Standardziel auf dem Desktop; persönliche Abweichung ausschließlich außerhalb von Git.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const desktopUploadRoot = 'desktop:MischWerk/UPLOAD';
function currentDesktop() {
  if (process.platform !== 'win32') { return path.join(os.homedir(), 'Desktop'); }
  const desktop = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); [Environment]::GetFolderPath('DesktopDirectory')"],
  { encoding:'utf8', windowsHide:true, timeout:10000 }).trim();
  assert.ok(desktop && path.isAbsolute(desktop), 'Windows-Desktopordner konnte nicht ermittelt werden');
  return desktop;
}
function resolveUploadRoot(value, desktop = currentDesktop) {
  if (value === desktopUploadRoot) {
    const folder = desktop();
    assert.ok(folder && path.isAbsolute(folder), 'Absoluter Desktopordner fehlt');
    return path.join(folder, 'MischWerk', 'UPLOAD');
  }
  // Ausdrückliche absolute Ziele bleiben für isolierte Paketprüfungen möglich.
  assert.ok(typeof value === 'string' && path.isAbsolute(value), 'Absoluter lokaler Uploadpfad fehlt');
  return path.resolve(value);
}
function localBuildSettingsFile() {
  return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.config'), 'MischWerk', 'build.json');
}
function resolveUploadLocation(value, appKey = 'MischWerk', options = {}) {
  assert.match(appKey, /^[A-Za-z][A-Za-z0-9_-]*$/);
  const settingsFile = options.settingsFile === undefined ? localBuildSettingsFile() : options.settingsFile;
  // Absolute Ziele isolierter Prüfungen behalten Vorrang vor persönlichen Einstellungen.
  if (value === desktopUploadRoot && settingsFile && fs.existsSync(settingsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    assert.equal(settings.schemaVersion, 1, 'Unbekannte lokale Buildkonfiguration');
    assert.ok(typeof settings.uploadDirectory === 'string' && path.isAbsolute(settings.uploadDirectory),
      'Absoluter persönlicher Uploadordner fehlt');
    const directory = path.resolve(settings.uploadDirectory);
    assert.notEqual(path.dirname(directory), directory, 'Laufwerkswurzel ist kein Uploadordner');
    const result = { root:directory, directory, direct:true };
    if (settings.approvalAppVersion !== undefined) {
      assert.match(settings.approvalAppVersion, /^[0-9]+\.[0-9]+$/, 'Ungültige lokale Freigabeversion');
      result.approvalAppVersion = settings.approvalAppVersion;
    }
    return result;
  }
  const root = resolveUploadRoot(value, options.desktop || currentDesktop);
  assert.equal(path.basename(root).toUpperCase(), 'UPLOAD', 'Uploadwurzel muss UPLOAD heißen');
  return { root, directory:path.join(root, appKey), direct:false };
}
module.exports = { desktopUploadRoot, resolveUploadRoot, resolveUploadLocation, localBuildSettingsFile };

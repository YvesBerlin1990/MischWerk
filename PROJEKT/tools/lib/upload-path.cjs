// Ein Uploadziel auf dem tatsächlichen Desktop, unabhängig von Nutzername und Checkout.
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
module.exports = { desktopUploadRoot, resolveUploadRoot };

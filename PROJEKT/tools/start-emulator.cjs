// Der Emulator selbst kommt ausschließlich aus dem zentralen Git-Submodul.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const project = path.resolve(__dirname, '..');
function setupEmulator(ensure = false) {
  if (process.env.CI || process.env.EMULATOR_SKIP_LOCAL_DELIVERY === '1') return false;
  if (process.platform !== 'win32') {
    if (ensure) return false;
    throw new Error('Die automatische Anmeldeaufgabe benötigt Windows.');
  }
  const emulator = path.join(__dirname, 'userapp-emulator');
  if (!fs.existsSync(path.join(emulator, 'server.js'))) {
    execFileSync('git', ['submodule', 'update', '--init', '--recursive', '--', 'PROJEKT/tools/userapp-emulator'],
      { cwd: path.resolve(project, '..'), stdio: 'inherit', windowsHide: true });
  }
  const installer = path.join(emulator, 'launcher/Install-LocalDelivery.ps1');
  if (!fs.existsSync(installer)) throw new Error('Der gebundene Emulatorstand enthält noch keine portable Abgleichseinrichtung.');
  const windows = process.env.SystemRoot || process.env.WINDIR;
  if (!windows) throw new Error('Das Windows-Systemverzeichnis wurde nicht gefunden.');
  execFileSync(path.join(windows, 'System32/WindowsPowerShell/v1.0/powershell.exe'),
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', installer,
      '-RepositoryPath', path.resolve(project, '..'), ...(ensure ? ['-Ensure'] : [])],
    { cwd: project, stdio: 'inherit', windowsHide: true });
  return true;
}
function launchConfiguration(environment = process.env) {
  const emulator = path.join(__dirname, 'userapp-emulator');
  if (!fs.existsSync(path.join(emulator, 'server.js'))) {
    throw new Error('Bitte zuerst git submodule update --init --recursive ausführen.');
  }
  try { require.resolve('express', { paths: [emulator] }); }
  catch { throw new Error('Bitte npm ci --prefix tools/userapp-emulator aus PROJEKT ausführen.'); }
  return {
    executable: process.execPath,
    arguments: [path.join(emulator, 'server.js'), path.resolve(environment.MISCHWERK_TEST_UPLOAD || path.join(project, 'app'))],
    options: { cwd: project, windowsHide: true, stdio: 'inherit', env: {
      ...environment,
      EMULATOR_RUNTIME_DATA_ROOT: environment.EMULATOR_RUNTIME_DATA_ROOT || path.join(os.tmpdir(), 'MischWerk-UserAppEmulator', 'daten'),
      EMULATOR_REPORTS_DIR: environment.EMULATOR_REPORTS_DIR || path.join(os.tmpdir(), 'MischWerk-UserAppEmulator', 'berichte'),
      EMULATOR_APP_PROFILE: 'mischwerk', EMULATOR_HOST: '127.0.0.1',
      EMULATOR_ALLOWED_DOMAINS: '',
      PORT: environment.MISCHWERK_EMULATOR_PORT || environment.PORT || '3105'
    } }
  };
}
function start() {
  const checked = setupEmulator(true);
  const configuration = launchConfiguration({ ...process.env, ...(checked ? { EMULATOR_LOCAL_DELIVERY_CHECKED: '1' } : {}) });
  execFileSync(process.execPath, [path.join(__dirname, 'build/backend.cjs')], { cwd: project, stdio: 'inherit', windowsHide: true });
  const child = spawn(configuration.executable, configuration.arguments, configuration.options);
  child.once('error', error => { console.error('Emulator konnte nicht starten: ' + error.message); process.exitCode = 1; });
  child.once('exit', code => { process.exitCode = code === null ? 1 : code; });
  return child;
}
if (require.main === module) {
  try { if (process.argv.includes('--setup')) setupEmulator(); else start(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { launchConfiguration, setupEmulator, start };

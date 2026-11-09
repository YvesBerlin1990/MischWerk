// Erzeugt einen kurzen Knuddels-Einstieg und separate Servermodule, kein Sammelbundle.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { readRelease, checkAppConfig, checkBackendConfig } = require('../lib/release-identity.cjs');
const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'src', 'backend');
const appRoot = path.join(root, 'app');
const modules = [
  'config.js', 'core/runtime.js', 'core/diagnostics.js', 'core/changes.js', 'core/relay-results.js', 'users/identity.js',
  'core/validation.js', 'state/persistence.js', 'radio/station.js', 'radio/team.js',
  'radio/moderation.js', 'radio/announcements.js', 'radio/ticker.js', 'users/greetings.js', 'channel-texts/storage.js', 'channel-texts/scheduler.js', 'channel-texts/transport.js',
  'radio/handover.js', 'state/initialization.js', 'radio/show.js', 'radio/curtain.js', 'wishes/storage.js', 'wishes/queue.js', 'wishes/transport.js',
  'schedule/calendar.js', 'schedule/storage.js', 'schedule/programme.js', 'schedule/commands.js', 'schedule/relay.js', 'schedule/overview.js', 'schedule/broadcasts.js', 'schedule/transport.js',
  'ui/snapshot.js', 'ui/session-state.js', 'transport/views.js', 'ui/loading.js', 'ui/content.js', 'ui/sessions.js', 'ui/wish-surface.js', 'ui/overlays.js', 'ui/administration.js', 'maintenance.js',
  'channel-texts/settings.js', 'wishes/website.js', 'website/access.js', 'website/public.js', 'website/commands.js', 'website/transport.js',
  'android/signing.js', 'android/failures.js', 'android/connection.js', 'android/diagnostics.js', 'android/settings.js', 'android/receipts.js', 'android/incoming.js', 'android/projection.js', 'android/commands.js', 'android/publisher.js', 'android/verification.js', 'android/relay.js', 'android/operation.js',
  'lifecycle.js', 'transport/events.js', 'app.js'
];
function source(file) {
  const value = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
  assert.ok(!value.startsWith('\uFEFF'), 'UTF-8-BOM: ' + file);
  new vm.Script(value, { filename: 'server/' + file });
  return value.trimEnd() + '\n';
}
function entry() {
  const release = readRelease(root);
  return '/* MischWerk ' + release.version + ' | Build ' + release.buildNumber + ' - Einstieg. Fachlogik liegt unter server/. */\n' +
    "KnuddelsServer.execute('server/app.js');" +
    '\nvar App = MischWerkModules.createApp(MischWerkConfig);\n';
}
function buildBackend() {
  const release = readRelease(root);
  checkAppConfig(path.join(appRoot, 'app.config'), release);
  checkBackendConfig(path.join(sourceRoot, 'config.js'), release);
  for (const file of modules) {
    const target = path.join(appRoot, 'server', file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source(file), 'utf8');
  }
  new vm.Script(entry(), { filename: 'main.js' });
  fs.writeFileSync(path.join(appRoot, 'main.js'), entry(), 'utf8');
}
function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    assert.ok(!item.isSymbolicLink(), 'Symlinks in Servermodulen nicht erlaubt');
    return item.isDirectory() ? listFiles(path.join(directory, item.name), prefix + item.name + '/') : [prefix + item.name];
  });
}
function checkBackend() {
  const release = readRelease(root);
  checkAppConfig(path.join(appRoot, 'app.config'), release);
  checkBackendConfig(path.join(sourceRoot, 'config.js'), release);
  assert.equal(fs.readFileSync(path.join(appRoot, 'main.js'), 'utf8'), entry(), 'Backend-Einstieg veraltet: build:backend ausfuehren.');
  for (const file of modules) {
    assert.equal(fs.readFileSync(path.join(appRoot, 'server', file), 'utf8'), source(file), 'Servermodul veraltet: ' + file);
  }
  assert.deepEqual(listFiles(path.join(appRoot, 'server')).sort(), [...modules].sort(), 'Fehlende oder fremde Servermodule');
  assert.deepEqual(listFiles(sourceRoot).sort(), [...modules].sort(), 'Fehlende oder ungenutzte Backend-Quellen');
}
if (require.main === module) {
  try {
    if (process.argv.includes('--check')) { checkBackend(); console.log('Backend-Einstieg und Servermodule aktuell.'); }
    else { buildBackend(); console.log('Backend erzeugt: kurzer main.js-Einstieg, ' + modules.length + ' Servermodule.'); }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { modules, entry, buildBackend, checkBackend };

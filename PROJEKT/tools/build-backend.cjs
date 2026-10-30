// Erzeugt die einzelne Knuddels-main.js deterministisch aus den gepflegten ES5-Modulen.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src', 'backend');
const target = path.join(root, 'app', 'main.js');
const modules = [
  '00-config.js',
  '10-runtime.js',
  '20-state.js',
  '30-actions.js',
  '40-views.js',
  '50-app.js'
];

function source(file) {
  const value = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
  assert.ok(!value.startsWith('\uFEFF'), 'UTF-8-BOM in Backend-Modul: ' + file);
  new vm.Script(value, { filename: path.join('src/backend', file) });
  return value.trimEnd();
}

function bundle() {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const banner = '/* MischWerk ' + version + ' - erzeugtes Knuddels UserApps Backend.\n' +
    ' * Quellen: src/backend/*.js. Nicht direkt bearbeiten.\n' +
    ' */';
  const output = banner + '\n\n' + modules.map(source).join('\n\n') + '\n';
  new vm.Script(output, { filename: 'app/main.js' });
  return output;
}

function writeBundle() {
  const output = bundle();
  fs.writeFileSync(target, output, 'utf8');
  return output;
}

function checkBundle() {
  assert.equal(fs.readFileSync(target, 'utf8'), bundle(),
    'app/main.js ist nicht aktuell. Bitte `pnpm run build:backend` ausführen.');
}

if (require.main === module) {
  try {
    if (process.argv.includes('--check')) {
      checkBundle();
      console.log('Backend-Bundle ist aktuell:', path.relative(root, target));
    } else {
      writeBundle();
      console.log('Backend-Bundle erzeugt:', path.relative(root, target));
    }
  } catch (error) {
    console.error('Backend-Bundle: ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = { bundle, writeBundle, checkBundle, modules, target };

// Prüft die öffentlichen Backend-Schnittstellen und die explizite Frontend-Verdrahtung.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { modules } = require('./build-backend.cjs');
const { frontendFiles, frontendFilesForView } = require('./frontend-files.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function checkArchitecture() {
  const backend = Object.fromEntries(modules.map(file => [file, read('src/backend/' + file)]));
  const providers = {};
  for (const [file, text] of Object.entries(backend)) {
    for (const match of text.matchAll(/runtime\.(\w+)\s*=\s*function/g)) {
      assert.ok(!providers[match[1]], 'Doppelte öffentliche Backendfunktion: ' + match[1]);
      providers[match[1]] = file;
    }
  }
  const edges = Object.fromEntries(modules.map(file => [file, [...new Set(
    [...backend[file].matchAll(/runtime\.(\w+)/g)].map(match => providers[match[1]]).filter(owner => owner && owner !== file)
  )]]));
  const visited = new Set();
  function visit(file, stack = []) {
    assert.ok(!stack.includes(file), 'Zyklische Backendabhängigkeit: ' + stack.concat(file).join(' -> '));
    if (visited.has(file)) { return; }
    for (const target of edges[file]) { visit(target, stack.concat(file)); }
    visited.add(file);
  }
  for (const file of modules.filter(file => file !== 'app.js')) { visit(file); }

  const factories = {};
  const declarations = {};
  for (const file of frontendFiles.filter(file => file.endsWith('.js') && file !== 'js/start.js')) {
    const source = read('app/www/' + file);
    new vm.Script(source, { filename: file }).runInNewContext({ MischWerkUI: {
      define(name, factory) {
        assert.ok(!factories[name], 'Doppeltes Frontendmodul: ' + name);
        factories[name] = factory;
        declarations[name] = [...new Set([...source.matchAll(/dependencies\.(\w+)/g)].map(match => match[1]))].sort();
      }
    } });
    assert.ok(!/Client\.includeJS|factories\./.test(source), 'Fachmodule dürfen keine anderen Module laden: ' + file);
  }
  const start = read('app/www/js/start.js');
  const available = new Set(['bridge', 'audio']);
  const composed = new Set();
  for (const match of start.matchAll(/(?:(?:(?:var )?(\w+) = )?)factories\.(\w+)\(\{([\s\S]*?)\}\);/g)) {
    const [, variable, name, argumentsText] = match;
    assert.ok(factories[name], 'Unbekannte Frontendkomponente: ' + name);
    assert.ok(!composed.has(name), 'Doppelte Zusammensetzung: ' + name);
    const pairs = [...argumentsText.matchAll(/(\w+):\s*(\w+)/g)];
    for (const [, dependency, value] of pairs) {
      assert.ok(available.has(value), name + '.' + dependency + ': Vorwärtsreferenz oder zyklische Abhängigkeit');
    }
    assert.deepEqual(pairs.map(pair => pair[1]).sort(), declarations[name], 'Abhängigkeiten passen nicht zur Schnittstelle: ' + name);
    if (variable) { available.add(variable); }
    composed.add(name);
  }
  assert.deepEqual([...composed].sort(), Object.keys(factories).sort(), 'Unverdrahtete Frontendkomponenten');
  const used = new Set();
  for (const view of ['radio', 'wishes', 'studio', 'team', 'schedule']) {
    const loaded = [], built = [], scope = { window: {}, document: {
      documentElement: { getAttribute: () => view }
    }, Client: { includeJS: file => loaded.push(file) } };
    vm.runInNewContext(start, scope);
    const expected = frontendFilesForView(view).filter(file => file.endsWith('.js') &&
      file !== 'js/start.js');
    assert.deepEqual([...loaded].sort(), [...expected].sort(), 'Ladeplan: ' + view);
    for (const file of loaded) {
      const name = read('app/www/' + file).match(/MischWerkUI\.define\('([^']+)'/)[1];
      scope.window.MischWerkUI.define(name, () => {
        built.push(name); used.add(name);
        return { start() {}, el() { return {}; } };
      });
    }
    assert.equal(built.length, loaded.length, 'Jedes geladene Modul muss genau einmal entstehen: ' + view);
    assert.equal(new Set(built).size, built.length, 'Doppelte Initialisierung: ' + view);
  }
  assert.deepEqual([...used].sort(), Object.keys(factories).sort(), 'Modul ohne erreichbares Fenster');
  return { backendModules: modules.length, frontendComponents: composed.size };
}
if (require.main === module) { console.log('Architektur geprüft:', checkArchitecture()); }
module.exports = { checkArchitecture };

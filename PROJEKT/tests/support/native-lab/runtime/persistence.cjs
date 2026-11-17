const fs = require('node:fs');
const path = require('node:path');
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
class TestPersistence {
  constructor(directory, shouldFail = () => false, onWrite = () => {}) {
    this.directory = directory; this.shouldFail = shouldFail; this.onWrite = onWrite;
    fs.mkdirSync(directory, { recursive: true });
    this.file = path.join(directory, 'app-state.json');
    this.data = { strings: {}, numbers: {}, objects: {} };
    if (fs.existsSync(this.file)) {
      const loaded = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      for (const type of ['strings', 'numbers', 'objects']) {
        if (!loaded[type] || typeof loaded[type] !== 'object' || Array.isArray(loaded[type])) throw new Error('Beschädigte Emulator-Testdaten: ' + type);
      }
      this.data = loaded;
    }
  }
  write(type, key, value, remove = false) {
    if (typeof key !== 'string' || !key || key.length > 200 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Ungültiger Persistenzschlüssel.');
    if (this.shouldFail()) throw new Error('Simulierter Speicherfehler.');
    if (!remove && JSON.stringify(value).length > 102400) throw new Error('Simulierte Schlüsselgrenze: 102400 Zeichen.');
    const next = copy(this.data);
    if (remove) delete next[type][key]; else next[type][key] = copy(value);
    const serialized = JSON.stringify(next, null, 2);
    if (Buffer.byteLength(serialized) > 10000000) throw new Error('Lokales Testlimit von 10 MB erreicht.');
    const temporary = this.file + '.tmp';
    fs.writeFileSync(temporary, serialized, 'utf8');
    fs.renameSync(temporary, this.file);
    this.data = next; this.onWrite({ type, key, characters: serialized.length });
  }
  api() {
    const store = this, api = {};
    for (const [type, suffix] of [['strings', 'String'], ['numbers', 'Number'], ['objects', 'Object']]) {
      api['has' + suffix] = key => Object.hasOwn(store.data[type], key);
      api['get' + suffix] = (key, fallback = suffix === 'Number' ? 0 : suffix === 'String' ? '' : null) =>
        copy(Object.hasOwn(store.data[type], key) ? store.data[type][key] : fallback);
      api['set' + suffix] = (key, value) => {
        if (suffix === 'String' && typeof value !== 'string') throw new Error('String erforderlich.');
        if (suffix === 'Number' && !Number.isFinite(value)) throw new Error('Endliche Zahl erforderlich.');
        store.write(type, key, value);
      };
      api['delete' + suffix] = key => store.write(type, key, undefined, true);
      api['get' + suffix + 'Keys'] = () => Object.keys(store.data[type]);
    }
    api.addNumber = (key, value) => { const next = api.getNumber(key) + value; api.setNumber(key, next); return next; };
    api.getDatabaseFileSize = () => Buffer.byteLength(JSON.stringify(store.data));
    api.getDatabaseFileSizeLimit = () => 10000000;
    return api;
  }
  reset() {
    this.write('objects', '__reset_marker', null);
    const empty = { strings: {}, numbers: {}, objects: {} };
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(empty), 'utf8');
    fs.renameSync(this.file + '.tmp', this.file); this.data = empty;
  }
}
module.exports = { TestPersistence, copy };

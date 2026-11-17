// Ein laufender Test verwendet genau einen unveränderlichen Quellstand im Arbeitsspeicher.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
class SourceSnapshot {
  constructor(directory) {
    this.directory = fs.realpathSync(directory); this.files = new Map();
    const collect = (folder, prefix = '') => {
      for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const relative = prefix + entry.name, absolute = path.join(folder, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Verknüpfungen im App-Teststand werden nicht übernommen: ' + relative);
        if (entry.isDirectory()) collect(absolute, relative + '/');
        else if (entry.isFile()) {
          const bytes = fs.readFileSync(absolute), stat = fs.statSync(absolute);
          this.files.set(relative, { bytes, size: stat.size, modified: stat.mtimeMs, hash: crypto.createHash('sha256').update(bytes).digest('hex') });
        }
      }
    };
    collect(this.directory);
    const digest = crypto.createHash('sha256');
    for (const [name, file] of this.files) digest.update(name + '\0' + file.hash + '\n');
    this.hash = digest.digest('hex');
    this.config = Object.fromEntries(this.read('app.config').toString('utf8').split(/\r?\n/)
      .filter(line => /^\s*[^#\s][^=]*=/.test(line)).map(line => {
        const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }));
  }
  read(name) {
    if (typeof name !== 'string' || name.includes('\0') || name.split(/[\\/]/).includes('..')) throw new Error('Ungültiger Snapshot-Pfad.');
    return this.files.get(name.replaceAll('\\', '/'))?.bytes || null;
  }
  changes() {
    const changes = [];
    const discover = (directory, prefix = '') => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const name = prefix + entry.name;
        if (entry.isSymbolicLink()) { changes.push(name); continue; }
        if (entry.isDirectory()) discover(path.join(directory, entry.name), name + '/');
        else if (!this.files.has(name)) changes.push(name);
      }
    };
    discover(this.directory);
    for (const [name, file] of this.files) {
      const absolute = path.join(this.directory, name);
      if (!fs.existsSync(absolute)) { changes.push(name); continue; }
      const stat = fs.statSync(absolute);
      if ((stat.size !== file.size || stat.mtimeMs !== file.modified) &&
          crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') !== file.hash) changes.push(name);
    }
    return changes;
  }
}
module.exports = { SourceSnapshot };

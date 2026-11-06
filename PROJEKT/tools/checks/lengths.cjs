// UTF-8-Text dekodieren und Unicode-Zeichen einschließlich unveränderter Zeilenumbrüche zählen.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { TextDecoder } = require('node:util');
const { modules } = require('../build/backend.cjs');
const { frontendFiles, operatorFiles } = require('../lib/frontend-files.cjs');
const root = path.resolve(__dirname, '../..');
const runtimeFiles = ['main.js', 'app.config', ...modules.map(file => 'server/' + file), ...frontendFiles.concat(operatorFiles).map(file => 'www/' + file)];
const decoder = new TextDecoder('utf-8', { fatal: true });
function isBinary(file) { return /\.(png|mp3|woff2)$/.test(file); }
function checkText(file) {
  const buffer = fs.readFileSync(file);
  assert.ok(!buffer.subarray(0, 3).equals(Buffer.from([239, 187, 191])), 'UTF-8-BOM: ' + file);
  const text = decoder.decode(buffer);
  // Auch die strengere UTF-16-Zählung muss passen; kein Verkleinern durch andere Kodierung.
  assert.ok(text.length < 9500, path.basename(file) + ': ' + text.length + ' Zeichen, erforderlich: < 9500');
  return { file, characters: text.length };
}
function checkRuntime(directory) {
  function list(folder, prefix = '') {
    return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
      assert.ok(!entry.isSymbolicLink(), 'Symlink in Laufzeitdateien: ' + prefix + entry.name);
      const relative = prefix + entry.name;
      return entry.isDirectory() ? list(path.join(folder, entry.name), relative + '/') : [relative];
    });
  }
  assert.deepEqual(list(directory).sort(), [...runtimeFiles].sort(), 'Unerwartete oder fehlende Laufzeitdateien');
  return runtimeFiles.filter(file => !isBinary(file)).map(file => checkText(path.join(directory, file)));
}
if (require.main === module) {
  const results = checkRuntime(path.join(root, 'app'));
  const largest = results.reduce((a, b) => a.characters > b.characters ? a : b);
  console.log(results.length + ' Laufzeit-Textdateien geprüft; Maximum: ' + largest.characters + ' Zeichen (' + path.relative(root, largest.file) + ').');
}
module.exports = { runtimeFiles, isBinary, checkText, checkRuntime };

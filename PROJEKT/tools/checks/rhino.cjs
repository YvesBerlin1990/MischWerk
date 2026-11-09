// Lokale Rhino-Pruefung; nur --download erlaubt den einmaligen Maven-Download in den Temp-Cache.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { checkBackend } = require('../build/backend.cjs');
const cache = path.join(os.tmpdir(), 'MischWerk-Rhino-Probe');
const engines = [
  { version: '1.7.7.2', language: '180', artifacts: [
    ['rhino', '5c6dae050ceb71774a5fc82ce6e3f0392daf0ffa9ec3596f70d4d07ee50b8970']
  ] },
  { version: '1.9.1', language: '200', artifacts: [
    ['rhino', '12dbb224cea124a5d32968722e8eb161c967bf15f3c9a795d1b05592b1147975'],
    ['rhino-tools', '941b4eb19e92a4fb6292e632a36b2217d5cabb3b3ebdccc86af2b6e78fef57c3']
  ] }
];
function javaExecutable() {
  if (process.env.MISCHWERK_JAVA) { return process.env.MISCHWERK_JAVA; }
  // Eine separat im Temp-Verzeichnis bereitgestellte Test-JRE braucht keine Systeminstallation.
  const localJava = path.join(cache, 'java17');
  if (fs.existsSync(localJava)) {
    for (const entry of fs.readdirSync(localJava)) {
      const candidate = path.join(localJava, entry, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
      if (fs.existsSync(candidate)) { return candidate; }
    }
  }
  return 'java';
}
async function main() {
  checkBackend();
  for (const engine of engines) {
    const jars = [];
    for (const [artifact, expectedHash] of engine.artifacts) {
      const filename = artifact + '-' + engine.version + '.jar';
      const jar = path.join(cache, filename);
      if (!fs.existsSync(jar) && process.argv.includes('--download')) {
        const response = await fetch('https://repo.maven.apache.org/maven2/org/mozilla/' + artifact + '/' + engine.version + '/' + filename, { signal: AbortSignal.timeout(30000) });
        assert.ok(response.ok, 'Rhino-Download: HTTP ' + response.status);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedHash, 'Rhino-Pruefsumme');
        fs.mkdirSync(cache, { recursive: true });
        fs.writeFileSync(jar, bytes, { flag: 'wx' });
      }
      assert.ok(fs.existsSync(jar), 'Rhino fehlt. Einmal node tools/checks/rhino.cjs --download ausfuehren. Java 11+ erforderlich (MISCHWERK_JAVA).');
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'), expectedHash, 'Abweichende Rhino-JAR: ' + filename);
      jars.push(jar);
    }
    const target = process.env.MISCHWERK_TEST_UPLOAD;
    const appOption = target ? ['-e', 'var mischWerkAppRoot = ' + JSON.stringify(path.resolve(target).replaceAll('\\', '/')) + ';'] : [];
    const result = spawnSync(javaExecutable(), ['-cp', jars.join(path.delimiter),
      'org.mozilla.javascript.tools.shell.Main', '-version', engine.language, '-encoding', 'UTF-8',
      ...appOption, '-f', 'tests/rhino/wishes.js'],
    { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', windowsHide: true, timeout: 60000 });
    if (result.stdout) { process.stdout.write(result.stdout); }
    if (result.stderr) { process.stderr.write(result.stderr); }
    assert.ifError(result.error);
    assert.equal(result.status, 0, 'Wunschweg in Rhino ' + engine.version + ' fehlgeschlagen; Java 11+ erforderlich.');
    assert.match(result.stdout, /Rhino-Wunschweg OK:/, 'Rhino-Ergebnis fehlt');
    console.log('Engine: Rhino ' + engine.version + ', Sprachmodus ' + engine.language + ', SHA-256 verifiziert; App: ' + (target || 'app/'));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

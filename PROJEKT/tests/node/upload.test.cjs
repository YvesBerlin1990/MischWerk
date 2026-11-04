const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { createDelivery } = require('../../tools/build/prepare-upload.cjs');
const { frontendFilesForView } = require('../../tools/lib/frontend-files.cjs');
const { runtimeFiles, isBinary } = require('../../tools/checks/lengths.cjs');
const { checkUpload } = require('../../tools/checks/upload.cjs');
const { manifestGroups } = require('../../tools/lib/upload-manifests.cjs');
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'MischWerk-Uploadpruefung-'));
  assert.ok(path.resolve(base).startsWith(path.join(os.tmpdir(), 'MischWerk-Uploadpruefung-')));
  t.after(() => fs.rmSync(base, { recursive:true, force:true }));
  const project = path.join(base, 'PROJEKT'), upload = path.join(base, 'UPLOAD');
  const source = path.resolve(__dirname, '../..');
  fs.mkdirSync(path.join(project, 'deployment'), { recursive:true });
  fs.cpSync(path.join(source, 'app'), path.join(project, 'app'), { recursive:true });
  fs.cpSync(path.join(source, 'app'), path.join(upload, 'MischWerk'), { recursive:true });
  fs.copyFileSync(path.join(source, 'package.json'), path.join(project, 'package.json'));
  fs.writeFileSync(path.join(project, 'deployment/live.json'), JSON.stringify({ localUploadRoot:upload }));
  const folder = path.join(project, 'deployment', 'manifests');
  fs.cpSync(path.join(source, 'deployment', 'manifests'), folder, { recursive:true,
    filter:file => fs.statSync(file).isDirectory() || file.endsWith('.json') });
  const file = path.join(folder, 'manifest-live.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.delivery = 'upload-directory'; manifest.bundled = false; manifest.localUploadRoot = upload;
  // Die Fixture gehört zum gerade getesteten Quellstand, nicht zum vorherigen Upload.
  const release = JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8'));
  manifest.version = release.version; manifest.buildNumber = release.buildNumber;
  const digest = input => crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex').toUpperCase();
  const groups=manifestGroups(runtimeFiles,isBinary);
  manifest.fileManifests=Object.keys(groups).map(name=>({path:name}));
  for(const part of manifest.fileManifests){
    const partFile=path.join(folder,part.path);
    const data={};
    data.version=manifest.version;
    data.buildNumber=manifest.buildNumber;
    data.files=groups[part.path].map(file=>({path:'MischWerk/'+file}));
    part.fileCount=data.files.length;
    for(const entry of data.files){
      const input=path.join(upload,entry.path);
      entry.bytes=fs.statSync(input).size;entry.sha256=digest(input);
    }
    fs.writeFileSync(partFile,JSON.stringify(data,null,2)+'\n');
    part.bytes=fs.statSync(partFile).size;part.sha256=digest(partFile);
  }
  manifest.fileCount=manifest.fileManifests.reduce((total,part)=>total+part.fileCount,0);
  fs.writeFileSync(file, JSON.stringify(manifest));
  return { project, upload };
}
test('Uploadprüfung benötigt ausschließlich Appdateien und Dateimanifeste, kein Archiv', t => {
  const f = fixture(t), result = checkUpload({project:f.project});
  assert.equal(result.files, runtimeFiles.length); assert.equal(result.uploadRoot, f.upload);
  assert.equal(result.buildNumber, JSON.parse(fs.readFileSync(path.join(f.project, 'package.json'), 'utf8')).buildNumber);
  assert.equal('sha256' in result, false);
});

test('Auslieferungsbündel erhalten alle vollständigen Module und ihre Reihenfolge bei weniger SDK-Aufrufen', () => {
  const project = path.resolve(__dirname,'../..'), delivery = createDelivery(project);
  const read = file => fs.readFileSync(path.join(project,'app/www',file),'utf8');
  const delivered = file => (delivery.get('www/'+file) || Buffer.from(read(file))).toString('utf8');
  for (const view of ['radio','wishes','studio','team','schedule']) {
    const scripts = [], styles = [];
    const scope = { document:{readyState:'loading',addEventListener(){},documentElement:{getAttribute:() => view,setAttribute(){}}},
      Client:{pageData:{view},includeJS:file => scripts.push(file),includeCSS:file => styles.push(file)},setTimeout(){} };
    scope.window = scope;
    const context = vm.createContext(scope);
    vm.runInContext(delivered('index.html').match(/<script>([\s\S]*?)<\/script>/)[1],context);
    vm.runInContext(delivered('js/start.js'),context);
    const expected = frontendFilesForView(view);
    const sourceJS = expected.filter(file => file.endsWith('.js') && file !== 'js/start.js');
    const sourceCSS = expected.filter(file => file.endsWith('.css'));
    assert.equal(scripts.map(delivered).join('\n;\n'), sourceJS.map(read).join('\n;\n'), 'JS unverändert: '+view);
    assert.equal(styles.map(delivered).join('\n'), sourceCSS.map(read).join('\n'), 'CSS unverändert: '+view);
    assert.ok(scripts.length < sourceJS.length, 'Weniger parserzeitige SDK-Skriptaufrufe: '+view);
    for (const file of [...scripts,...styles]) assert.ok(delivered(file).length < 9500, file);
  }
});

test('Uploadprüfung validiert Bündel gegen die Quellmodule und weist nachgehashte Fremdinhalte zurück', t => {
  const f = fixture(t), delivery = createDelivery(f.project), folder = path.join(f.project,'deployment/manifests');
  for (const [file, bytes] of delivery) fs.writeFileSync(path.join(f.upload,'MischWerk',file),bytes);
  const manifestFile = path.join(folder,'manifest-live.json'), manifest = JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  manifest.bundled = true;
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  function updateHashes() {
    for (const part of manifest.fileManifests) {
      const file = path.join(folder,part.path), data = JSON.parse(fs.readFileSync(file,'utf8'));
      for (const entry of data.files) { const bytes = fs.readFileSync(path.join(f.upload,entry.path));entry.bytes=bytes.length;entry.sha256=digest(bytes); }
      fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
      const bytes=fs.readFileSync(file);part.bytes=bytes.length;part.sha256=digest(bytes);
    }
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  }
  updateHashes();assert.equal(checkUpload({project:f.project}).files,runtimeFiles.length);
  fs.appendFileSync(path.join(f.upload,'MischWerk/www/js/ui/composition.js'),'\n/* Fremder Inhalt */\n');
  updateHashes();assert.throws(() => checkUpload({project:f.project}),/Upload weicht von den Quellen ab/);
});
test('Uploadprüfung weist fehlende, ungültige und fremde Buildnummern zurück', t => {
  const f = fixture(t), file = path.join(f.project, 'package.json');
  const release = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const buildNumber of [undefined, 0, -1, 1.5, String(release.buildNumber)]) {
    fs.writeFileSync(file, JSON.stringify({ ...release, buildNumber }));
    assert.throws(() => checkUpload({project:f.project}), /Buildnummer/);
  }
  fs.writeFileSync(file, JSON.stringify(release));
  const manifestFile = path.join(f.project, 'deployment/manifests/manifest-live.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.buildNumber += 1; fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  assert.throws(() => checkUpload({project:f.project}), /Upload-Buildnummer/);
});
test('Auch ein korrekt gehashtes Teilmanifest darf keine andere Buildnummer ausliefern', t => {
  const f = fixture(t), folder = path.join(f.project, 'deployment/manifests');
  const mainFile = path.join(folder, 'manifest-live.json');
  const main = JSON.parse(fs.readFileSync(mainFile, 'utf8'));
  const item = main.fileManifests[0], partFile = path.join(folder, item.path);
  const part = JSON.parse(fs.readFileSync(partFile, 'utf8'));
  part.buildNumber += 1; fs.writeFileSync(partFile, JSON.stringify(part));
  item.sha256 = crypto.createHash('sha256').update(fs.readFileSync(partFile)).digest('hex').toUpperCase();
  item.bytes = fs.statSync(partFile).size; fs.writeFileSync(mainFile, JSON.stringify(main));
  assert.throws(() => checkUpload({project:f.project}), /Teilmanifest-Buildnummer/);
});
test('Quell- und Uploadkonfigurationen müssen dieselbe Buildnummer wie das Paket tragen', t => {
  const f = fixture(t), source = path.join(f.project, 'app/app.config');
  const upload = path.join(f.upload, 'MischWerk/app.config'), original = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(source, original.replace(/^# Buildnummer = \d+/m, '# Buildnummer = 0'));
  assert.throws(() => checkUpload({project:f.project}), /Buildnummer in app.config/);
  fs.writeFileSync(source, original);
  fs.writeFileSync(upload, original.replace(/^# Buildnummer = \d+\r?\n/m, ''));
  assert.throws(() => checkUpload({project:f.project}), /Buildnummer-Kommentar/);
  fs.writeFileSync(upload, original);
  const sourceBackend = path.join(f.project, 'app/server/config.js');
  const uploadedBackend = path.join(f.upload, 'MischWerk/server/config.js');
  const backend = fs.readFileSync(sourceBackend, 'utf8');
  fs.writeFileSync(sourceBackend, backend.replace(/buildNumber: \d+/, 'buildNumber: 0'));
  assert.throws(() => checkUpload({project:f.project}), /Backend-Konfiguration und Buildnummer/);
  fs.writeFileSync(sourceBackend, backend);
  fs.writeFileSync(uploadedBackend, backend.replace(/buildNumber: \d+/, 'buildNumber: 0'));
  assert.throws(() => checkUpload({project:f.project}), /Backend-Konfiguration und Buildnummer/);
});
test('Uploadprüfung weist veränderte Upload- und Quelldateien unabhängig zurück', t => {
  const f = fixture(t), rel = 'www/js/radio/markup.js';
  const upload = path.join(f.upload, 'MischWerk', rel), source = path.join(f.project, 'app', rel);
  const original = fs.readFileSync(upload);
  fs.appendFileSync(upload, '\n');
  assert.throws(() => checkUpload({project:f.project}), /markup.js/);
  fs.writeFileSync(upload, original); fs.appendFileSync(source, '\n');
  assert.throws(() => checkUpload({project:f.project}), /Upload weicht von den Quellen ab/);
});
test('Uploadprüfung weist zusätzliche Dateien im Upload und Appordner zurück', t => {
  const f = fixture(t), extra = path.join(f.upload, 'fremd.txt');
  fs.writeFileSync(extra, 'fremd');
  assert.throws(() => checkUpload({project:f.project}), /Fremde Dateien neben der App/);
  fs.unlinkSync(extra); fs.writeFileSync(path.join(f.upload, 'MischWerk/fremd.txt'), 'fremd');
  assert.throws(() => checkUpload({project:f.project}), /Unerwartete oder fehlende Laufzeitdateien/);
});

test('HTTP-Abnahme erkennt trotz vollständigem lokalem Upload fehlende neue und veraltete ausgelieferte Module', async t => {
  const http = require('node:http');
  const { frontendFiles } = require('../../tools/lib/frontend-files.cjs');
  const { checkDelivery } = require('../../tools/checks/delivery.cjs');
  const source = path.resolve(__dirname, '../../app/www');
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../deployment/manifests/manifest-live.json'),'utf8'));
  const delivery = manifest.bundled === true ? createDelivery() : new Map();
  let incomplete = false;
  const server = http.createServer((request, response) => {
    const file = new URL(request.url, 'http://localhost').pathname.slice(1);
    if (!frontendFiles.includes(file)) { response.writeHead(404).end(); return; }
    if (incomplete && ['js/ui/composition.js', 'js/ui/layout.js'].includes(file)) {
      response.writeHead(404).end('Nicht gefunden'); return;
    }
    const bytes = delivery.get('www/'+file) || fs.readFileSync(path.join(source, file));
    response.end(incomplete && file === 'js/ui/overlays.js' ? '/* alte Fassung */' : bytes);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const complete = await checkDelivery(base);
  const publicFiles = frontendFiles.filter(file => /\.(?:html|js|css)$/.test(file)).length;
  assert.equal(complete.ok, true); assert.equal(complete.checkedFiles, publicFiles);
  incomplete = true;
  const mixed = await checkDelivery(base);
  assert.equal(mixed.ok, false); assert.equal(mixed.matchingFiles, publicFiles - 3);
  assert.deepEqual(mixed.mismatches.map(file => [file.file, file.status, file.httpStatus]), [
    ['js/ui/composition.js', 'http-error', 404], ['js/ui/layout.js', 'http-error', 404],
    ['js/ui/overlays.js', 'different', 200]
  ]);
  assert.equal(JSON.stringify(mixed).includes('alte Fassung'), false, 'Antwortinhalte bleiben privat');
});

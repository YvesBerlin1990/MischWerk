const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
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
  manifest.delivery = 'upload-directory'; manifest.localUploadRoot = upload;
  // Die Fixture gehört zum gerade getesteten Quellstand, nicht zum vorherigen Upload.
  manifest.version = JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8')).version;
  const digest = input => crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex').toUpperCase();
  const groups=manifestGroups(runtimeFiles,isBinary);
  manifest.fileManifests=Object.keys(groups).map(name=>({path:name}));
  for(const part of manifest.fileManifests){
    const partFile=path.join(folder,part.path);
    const data={};
    data.version=manifest.version;
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
  assert.equal('sha256' in result, false);
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
  let incomplete = false;
  const server = http.createServer((request, response) => {
    const file = new URL(request.url, 'http://localhost').pathname.slice(1);
    if (!frontendFiles.includes(file)) { response.writeHead(404).end(); return; }
    if (incomplete && ['js/ui/composition.js', 'js/ui/navigation.js'].includes(file)) {
      response.writeHead(404).end('Nicht gefunden'); return;
    }
    const bytes = fs.readFileSync(path.join(source, file));
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
    ['js/ui/composition.js', 'http-error', 404], ['js/ui/navigation.js', 'http-error', 404],
    ['js/ui/overlays.js', 'different', 200]
  ]);
  assert.equal(JSON.stringify(mixed).includes('alte Fassung'), false, 'Antwortinhalte bleiben privat');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { runtimeFiles, isBinary } = require('../../tools/checks/lengths.cjs');
const { checkUpload } = require('../../tools/checks/upload.cjs');
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
  for(const part of manifest.fileManifests){
    const partFile=path.join(folder,part.path);
    const data=JSON.parse(fs.readFileSync(partFile,'utf8'));
    data.version=manifest.version;
    data.files=runtimeFiles.filter(file=>part.path==='manifest-server.json' ? !file.startsWith('www/') :
      file.startsWith('www/') && (part.path==='manifest-media.json')===isBinary(file)).map(file=>({path:'MischWerk/'+file}));
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
  assert.equal(result.files, 88); assert.equal(result.uploadRoot, f.upload);
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

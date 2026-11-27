// X-Mas: Szenendatei, Referenzgeometrie und bytegleiche Bilder aus der Web-Übergabe.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
function load(file) {
  let factory;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app/www/js/radio', file), 'utf8'), {
    MischWerkUI:{define:(name, create) => { factory = create; }}, Math,
    window:{matchMedia:() => ({matches:false}), addEventListener() {}}, document:{addEventListener() {}}
  });
  return factory({});
}
const scene = JSON.parse(fs.readFileSync(path.join(root, 'medien/xmas/xmas-player.json'), 'utf8'));

test('X-Mas-Kette und Schnee verwenden exakt die Werte der Szenendatei', () => {
  const lights = load('xmas-lights.js'), snow = load('xmas-snow.js');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'medien/xmas/xmas-player.json'))).digest('hex'),
    'c776cbcaee3953d63a042814018ec1884fb8607be486f4c1a45a5f11488fb9de');
  assert.deepEqual(JSON.parse(JSON.stringify(lights.LIGHTS)), scene.lights);
  assert.deepEqual(JSON.parse(JSON.stringify(snow.PROFILE)), scene.playerSnow);
});

test('X-Mas-Kette trifft die Referenzwerte der Übergabe', () => {
  const lights = load('xmas-lights.js');
  const random = lights.seededRandom(1225);
  assert.deepEqual([random(), random(), random()].map(value => value.toFixed(9)), ['0.784531538', '0.688846834', '0.887322397']);
  assert.deepEqual([0, 1, 2, 17, 63].map(index => ({...lights.twinkle(index)})),
    [{period:10280, delay:-7081}, {period:8483, delay:-236}, {period:10559, delay:-5183}, {period:9410, delay:-7830}, {period:7088, delay:-2070}]);
  const point = row => [row.x.toFixed(3), row.y.toFixed(3)].join('|');
  const wide = lights.layout(1236, 205, false, [...lights.garlandCover([0, 0, 170, 109], false), ...lights.garlandCover([1066, 0, 170, 109], true)]);
  assert.equal(wide.count, 50); assert.equal(wide.bulbs.length, 43);
  assert.deepEqual(wide.bulbs.slice(0, 3).map(point).join(',').split(','), ['618.018|2.000', '672.890|2.000', '727.763|2.000']);
  const compact = lights.layout(470, 358, true, [...lights.garlandCover([0, 0, 150, 96], false), ...lights.garlandCover([320, 0, 150, 96], true)]);
  assert.equal(compact.count, 38); assert.equal(compact.bulbs.length, 29);
  assert.deepEqual(compact.bulbs.slice(0, 2).map(point).join(',').split(','), ['235.235|2.000', '274.117|2.000']);
  // Ohne Abdeckung gleichmäßig ab Mitte oben; das Kabel hängt höchstens bis eine Zeile über der Unterkante.
  const open = lights.layout(470, 358, true, []);
  assert.equal(open.bulbs.length, 38);
  assert.ok(open.spans.every(span => span[1][1] <= 357));
});

test('X-Mas-Bilder sind bytegleich aus der Web-Übergabe übernommen', () => {
  const expected = {
    'xmas-tafel.png':'7eb905d04f8ffd586c3f52b0ff88d11e01d6b955af1bd3976d8dabfa2d8321bb',
    'xmas-tafel-kompakt.png':'dd121618a32676330d62155999a5f54cbe4cfdb7b196c976325d8d65d6304428',
    'xmas-eckgirlande.png':'89374846d86fcbfc5b370e9ebb331ad8cb69d635aa04cb04d0c4f9b34e32cd88',
    'xmas-schleife.png':'c33e15930626416704ec8ee52466bc3e69ce1778131ffed921c7a11611c98df8',
    'xmas-zweig-unten-links.png':'d3aceedd3946ac35375d966bb4aaacb80e321688c7c8c44e970cb12c5e8d5b9f',
    'xmas-zweig-unten-rechts.png':'ef1cfb8501db9f8aae49ef9c21765e7119bfcd8a57b66c5b27e199c58dabaf3b',
    'xmas-kabel.png':'1ad5e3f9373d43b5d2a24494f22e9fef5d7fa13ed2930a9fc4fb6aee5a1b9917',
    'xmas-birne-warmweiss-aus.png':'dd88469600169dfa4fe24119ce9c495e31d48dff5e17deffb65910c8d154c99b',
    'xmas-birne-warmweiss-an.png':'fbbc6a4871b514595c74a6de3fbb37e8351ad0167e512247b2ed2ab347ece115',
    'xmas-birne-rot-aus.png':'b474505d898334c9580982b53df08a61ca2d408e3ea8a6d646175c32b819e097',
    'xmas-birne-rot-an.png':'a7379b6aebd00930912a7ef844fe170a8cd22886b2e6cc74ad20cdb931e4f438',
    'xmas-birne-gruen-aus.png':'4f27c3602ffb222395e1438879d1d70eaf9f1dc0d4afcbef76908946e7d715db',
    'xmas-birne-gruen-an.png':'65eef2194b92309a0203076ff2f4e9b347b9b83be884c2684b94b4e08abf2140',
    'xmas-birne-bernstein-aus.png':'820e6bd50e92fcf1d01c9272a8d9b88cf6834ede98f8ca8686fb1d71856698e2',
    'xmas-birne-bernstein-an.png':'20eb1bd3b3e9d57df495fa968e80371893439d75a65854eb77ecb7c021826be1',
    'xmas-birne-eisblau-aus.png':'dfc11f07f4473e0cd24e46e75d4452047f3fb570ea76040e248b5b1237310071',
    'xmas-birne-eisblau-an.png':'abc308193ccb3e3709ecd0cf8323b912af3dda0c8c0b381a21bb63001d31197b',
    'xmas-kranz-schmal.png':'38055c7c01f9779d36b9b127d6aa91c55570836eb44a3afe8d0c6277f35b8783',
    'xmas-snow.png':'2f551ed5be8563dbb0dcb38853df7d3d5bd2e9426ad67837c875a996770bc5db',
    'xmas-geschenk-schneeflocken.png':'cbcbd9587c87a1dd1aee605f9cc9a59e95e367ee470d551aa70ca9a3d1069674',
    'xmas-geschenk-sterne.png':'c3ebb6e105327842976553fe0ec218ecb98c161396d1a3a10e24c1e15b0cd3b3',
    'xmas-geschenk-tannen.png':'46079363b6f24d56ca2cee646c653717e77e2b7e944c7d8a07c0d2f64ffe5994',
    'xmas-geschenk-goldstreifen.png':'ed56bc9a933f3a7c9ecf8668e07aa3e655380268ad24fbce99c54865854ecfb3',
    'xmas-geschenk-creme.png':'03b5f37e7b2dfa3311b4f66943709fab680fbe5e0937ef1f3d6cdc0c85a21a29',
    'xmas-reglergriff.png':'95d4e4c0adfc8c93bfd41f6eb80c7d45d3c9db3084431f5c62f5d9bc5ab76ae7',
    'mischwerk-logo-freigestellt.png':'ab97408ca1457256a772500c2d089d2a33e49bd013b8b3de2444472d958514cd'
  };
  for (const [file, hash] of Object.entries(expected)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'app/www/img', file))).digest('hex'), hash, file);
  }
});

const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { createHarness } = require('../support/knuddels.cjs');
function product() { const h = createHarness(), user = h.user(1, 'Otterchen', 'owner'); return { h, user, station:h.state(user, h.open(user)).station }; }
function api(fetch) {
  let factory;
  vm.runInNewContext(fs.readFileSync('app/www/js/history/data.js', 'utf8'), {
    URL, Intl, AbortController, setTimeout, clearTimeout, fetch, window:{ fetch, AbortController },
    MischWerkUI:{ define(name, value) { factory = value; } }
  }); return factory();
}
const row = (date, song) => ({ timestamp:Date.parse(date) / 1000, metadata:{ song } });
test('Historienquelle ist ausschließlich für Inhaber und ernannte Radiomoderatoren im bestätigten Zustand enthalten', () => {
  const {h,user:owner,station} = product(), os=owner.sessions[0];
  assert.ok(station.historyUrl);assert.equal(station.historyIgnoredTitles.length,2);
  for(const [id,role] of [[2,'listener'],[3,'moderator'],[4,'manager']]){
    const user=h.user(id,'Rolle '+role,role),session=h.open(user),state=h.state(user,session);
    assert.equal(state.user.canModerate,false);assert.equal(Object.hasOwn(state.station,'historyUrl'),false);
    assert.equal(Object.hasOwn(state.station,'historyIgnoredTitles'),false);assert.ok(state.station.streamUrl);
    h.event(user,session,'mw:openStudio',{requestId:'unberechtigt-'+id,canModerate:true,studioHistory:true});
    assert.equal(user.sessions.some(s=>s.content.viewMode==='Overlay'),false,'Clientangaben verleihen keine Studio-/Historienrechte');
  }
  const mod=h.user(5,'RadioMod','listener'),ms=h.open(mod);
  h.event(owner,os,'mw:addRadioModerator',{nick:mod.nick,expectedRadioModeratorRevision:h.state(owner,os).radioModeratorRevision});
  assert.equal(h.state(mod,ms).station.historyUrl,station.historyUrl);
  h.event(owner,os,'mw:removeRadioModerator',{userId:mod.id,expectedRadioModeratorRevision:h.state(owner,os).radioModeratorRevision});
  assert.equal(Object.hasOwn(h.state(mod,ms).station,'historyUrl'),false);
  const pushed=ms.events.filter(e=>e.type==='mw:state').at(-1).data;
  assert.equal(pushed.user.canModerate,false);assert.equal(Object.hasOwn(pushed.station,'historyIgnoredTitles'),false);
});
test('Tageshistorie verwendet Berliner Kalendertag, Originaltext, Reihenfolge und echte Wiederholungen', () => {
  const data = api(), now = Date.parse('2026-11-03T12:00:00Z');
  const valid = row('2026-11-02T23:01:00Z', 'Band - Titel - Remix');
  const entries = [valid, valid, row('2026-11-03T10:00:00Z', valid.metadata.song), row('2026-11-02T22:59:59Z', 'Gestern'),
    row('2026-11-03T13:00:00Z', 'Zukunft'), row('2026-11-03T11:00:00Z', '<img src=x onerror=alert(1)>')];
  const result = data.parse(entries, now);
  assert.deepEqual(Array.from(result, x => x.text), ['<img src=x onerror=alert(1)>', valid.metadata.song, valid.metadata.song]);
  assert.equal(data.time(valid.timestamp), '00:01:00'); assert.equal(data.day(now), '2026-11-03');
});
test('Leere, Unknown und ungültige Daten erzeugen keine Lieder oder erfundenen Uhrzeiten', () => {
  const data = api(), now = Date.parse('2026-11-03T12:00:00Z');
  const rows = ['', '  ', 'Unknown', 'UNKNOWN', null, {}, 4].map(text => row('2026-11-03T10:00:00Z', text));
  rows.push(null, {}, {timestamp:'1793700000',metadata:{song:'Text'}}, {timestamp:-1,metadata:{song:'Text'}});
  assert.equal(data.parse(rows, now).length, 0);
  for (const invalid of [null, {}, {error:'offline'}, new Array(10001)]) assert.throws(() => data.parse(invalid, now));
});
test('Nur ausdrücklich benannte Senderjingles entfallen; ähnliche Musiktitel und Originaldaten bleiben erhalten', () => {
  const {h,user,station} = product(), data = api(), now = Date.parse('2026-11-03T12:00:00Z');
  assert.deepEqual(Array.from(station.historyIgnoredTitles), ['Mischwerk dein Radio', 'Dein Mix auf Mischwerk']);
  const titles = ['Mischwerk dein Radio', '  MISCHWERK  dein\tRadio  ', 'Dein Mix auf Mischwerk', 'dein mix auf mischwerk',
    'GAYLE - abcdefu', 'Cher - Believe', 'The Black Eyed Peas - I Gotta Feeling', 'Band - Dein Mix auf Mischwerk', 'Mischwerk dein Radio - Remix'];
  const rows = titles.map((title,i) => row('2026-11-03T10:0'+i+':00Z',title)), original = JSON.stringify(rows);
  assert.deepEqual(Array.from(data.parse(rows,now,station), r=>r.text), titles.slice(4).reverse());
  assert.equal(JSON.stringify(rows),original,'Quellmeldungen werden nicht umbenannt oder verändert');
  assert.equal(data.parse(rows,now,{...station,historyIgnoredTitles:[]}).length,titles.length);
  h.config.streampanel.historyIgnoredTitles = [null, 5, '', '  ', 'x'.repeat(201), '  Nur diese Kennung  '];
  assert.deepEqual(Array.from(h.state(user,h.open(user)).station.historyIgnoredTitles), ['Nur diese Kennung']);
});
test('Tageswechsel bleibt in Sommerzeit und an beiden Zeitumstellungen exakt bei Berliner Mitternacht', () => {
  const data = api();
  for (const [start, midnight] of [
    ['2026-11-03T12:00:00Z','2026-11-03T23:00:00Z'], ['2026-07-03T12:00:00Z','2026-07-03T22:00:00Z'],
    ['2026-03-28T23:00:00Z','2026-03-29T22:00:00Z'], ['2026-10-24T22:00:00Z','2026-10-25T23:00:00Z']
  ]) assert.equal(data.nextDay(Date.parse(start)), Date.parse(midnight));
  const repeated = [row('2026-10-25T00:30:00Z','Titel'), row('2026-10-25T01:30:00Z','Titel')];
  assert.equal(data.parse(repeated, Date.parse('2026-10-25T12:00:00Z')).length, 2);
});
test('Nur die bestätigte Historienroute darf Port 9000 verwenden; allgemeine Anbieterfreigaben bleiben streng', () => {
  const {h, user, station} = product(), data = api();
  assert.equal(data.url(station), 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json');
  for (const url of ['http://mischwerk.spcast.eu:9000/sp/cache/history/history.json',
    'https://mischwerk.spcast.eu:9000/other.json', 'https://foreign.example.com:9000/sp/cache/history/history.json',
    'https://user:secret@mischwerk.spcast.eu:9000/sp/cache/history/history.json',
    'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json?token=secret',
    'https://mischwerk.spcast.eu:9001/sp/cache/history/history.json', 'https://127.0.0.1/history']) {
    assert.equal(data.url({...station, historyUrl:url}), '');
    h.config.streampanel.historyUrl = url; assert.equal(h.state(user, h.open(user)).station.historyUrl, '');
  }
  assert.equal(data.url({...station, allowedHosts:[]}), '');
  h.config.streampanel.streamUrl = station.historyUrl; assert.equal(h.state(user,h.open(user)).station.configured, false);
});
test('Historienabruf verwendet keine Cookies, verbietet Weiterleitungen und lässt sich abbrechen', async () => {
  const {station} = product(); let options;
  const data = api(async (url, opts) => { options = opts; return {ok:true,text:async()=>JSON.stringify([row('2026-11-03T10:00:00Z','Song')])}; });
  assert.equal((await data.load(station).promise).length, 1);
  assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
  const stalled = api((url, opts) => new Promise((resolve,reject) => opts.signal.addEventListener('abort',()=>reject(Error('aborted')))));
  const task = stalled.load(station); task.cancel(); await assert.rejects(task.promise);
  const invalid = api(async()=>({ok:true,text:async()=>'not JSON'})); await assert.rejects(invalid.load(station).promise);
});

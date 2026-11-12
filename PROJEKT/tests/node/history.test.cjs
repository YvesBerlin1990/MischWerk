// Gegenfälle zur ausdrücklich entfernten Anbieterhistorie.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {createHarness}=require('../support/knuddels.cjs');
test('Entfernte Historie liefert in keiner Rolle eine Anbieteradresse; direkter Live-Titel bleibt erhalten',()=>{
 const h=createHarness();for(const [i,role] of ['owner','listener','moderator','manager'].entries()){
  const user=h.user(i+1,i===0?'Otterchen':'Rolle '+i,role),state=h.state(user,h.open(user));
  assert.equal(Object.hasOwn(state.station,'historyUrl'),false);assert.equal(Object.hasOwn(state.station,'historyIgnoredTitles'),false);
  assert.equal(state.station.metadataFormat,'spcast-shoutcast-song');assert.equal(state.station.metadataUrl,'https://mischwerk.sp.radio.fm/currentsong?sid=1');
 }
});
test('Historien- und Lauftexteditor werden nicht mehr geladen oder ausgeliefert',()=>{
 const {frontendFiles,frontendFilesForView}=require('../../tools/lib/frontend-files.cjs');
 assert.ok(frontendFiles.every(f=>!f.includes('/history/')&&!f.endsWith('studio/ticker.js')&&!f.endsWith('studio/ticker.css')));
 const source=frontendFilesForView('studio').filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync('app/www/'+f,'utf8')).join('\n');
 assert.doesNotMatch(source,/Heute gespielt|historyUrl|studio-ticker-tab|studio-history-tab|ticker-editor-placeholder/);
 for(const f of ['src/backend/config.js','src/backend/radio/station.js','app/www/js/radio/api.js','app/www/js/radio/metadata.js'])assert.doesNotMatch(fs.readFileSync(f,'utf8'),/historyUrl|spcast-history|:9000|sp\/cache\/history/);
 for(const f of ['src/backend/config.js','src/backend/radio/station.js','app/www/js/radio/api.js','app/www/js/radio/requests.js'])assert.doesNotMatch(fs.readFileSync(f,'utf8'),/currentSong\.txt|spcast-current-song|\/api\/streams|metadata\/live/,'Keine alte oder spekulative Titelquelle: '+f);
});

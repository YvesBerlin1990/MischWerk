const test=require('node:test'),assert=require('node:assert/strict');
const {startSite}=require('../support/site.cjs');








test('Öffentliche Teilbereiche haben direkte Adressen und die Startseite wählt nur das Radio vor',async t=>{const f=await startSite(t,{enabled:false});for(const [route,name] of Object.entries({'/':'radio','/sendeplan':'schedule','/team':'team','/mitmachen':'applications','/wunschbox':'wishes'})){const response=await fetch(f.base+route);assert.equal(response.status,200);const html=await response.text();assert.match(html,new RegExp('data-site-current="'+name+'"'));assert.match(html,/site-navigation.js/);assert.match(html,/data-player-src="\/player"/);}assert.equal((await fetch(f.base+'/site-navigation.js')).status,200);});

test('Zusätzlicher Arbeitsbereich ist vollständig stillgelegt; alte Aktionen mutieren keine Appdaten',async t=>{
 const f=await startSite(t),saved=JSON.stringify(f.h.store.data);
 for(const route of ['/arbeitsbereich','/api/workspace/session','/api/workspace/login','/api/workspace/action'])for(const method of ['GET','POST']){const response=await fetch(f.base+route,{method});assert.equal(response.status,410);assert.equal(response.headers.get('set-cookie'),null);}
 for(const asset of ['workspace.js','workspace-studio.js','workspace-team.js','workspace-schedule.js','workspace.css'])assert.equal((await fetch(f.base+'/'+asset)).status,404);
 assert.equal(JSON.stringify(f.h.store.data),saved);assert.equal(f.calls.length,0);
});

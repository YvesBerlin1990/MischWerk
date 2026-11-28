const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../fixtures/relay-v2.cjs');
function admin(){const f=setup(),h=f.h,u=h.user(2,'Otterchen','owner');h.app.chatCommands.mw(u,'admin');const s=u.sessions.find(s=>s.activeView==='team');return {...f,h,u,s};}
function save(f,extra={}){const data={view:'team',viewRevision:1,requestId:'ticker-save',expectedTickerRevision:0,text:'Information äöü',enabled:true,speed:48,direction:'left',...extra};return f.h.event(f.u,f.s,'mw:setTicker',data).find(e=>e.type==='mw:result').data;}
test('Nur aktuelle echte Inhabersitzung bearbeitet Lauftext; Chatbefehl und alte Studioverträge entfallen',()=>{
 const f=admin();assert.equal(f.h.app.chatCommands.lauftext,undefined);assert.equal(save(f).ok,true);assert.equal(f.h.runtime.tickerState().text,'Information äöü');
 for(const role of ['listener','moderator','manager','developer']){const u=f.h.user(10+role.length,role,role),s=f.h.open(u);assert.equal(f.h.event(u,s,'mw:setTicker',{view:'team',viewRevision:1}).find(e=>e.type==='mw:result').data.ok,false);}
});
test('Revision und Wiederholungsschutz erhalten bestätigten Stand und verraten keine Secrets',()=>{
 const f=admin();assert.equal(save(f).ok,true);assert.equal(save(f).ok,true);assert.equal(f.h.runtime.tickerState().revision,1);
 assert.equal(save(f,{text:'Andere Belegung'}).ok,false);assert.equal(save(f,{requestId:'other'}).ok,false);assert.equal(f.h.runtime.tickerState().text,'Information äöü');
});
for(const extra of [{speed:99},{font:'comic-sans'},{font:'constructor'},{font:null},{enabled:'true'},{text:'x'.repeat(301)},{text:'',enabled:true},{direction:'up'},{view:'studio'},{viewRevision:0}])test('Ungültiger Verwaltungs-Lauftext verändert nichts: '+JSON.stringify(extra),()=>{
 const f=admin(),before=JSON.stringify(f.h.store.data);assert.equal(save(f,extra).ok,false);assert.equal(JSON.stringify(f.h.store.data),before);
});
test('Tempo, Aus und gespeicherter Text bleiben nach Neustart konsistent; Speicherfehler ist kein Erfolg',()=>{
 const f=admin();assert.equal(save(f,{speed:72}).ok,true);const write=f.store.setObject;f.store.setObject=()=>{throw Error('private');};
 assert.equal(save(f,{requestId:'off',expectedTickerRevision:1,enabled:false,speed:72}).ok,false);assert.equal(f.h.runtime.tickerState().enabled,true);f.store.setObject=write;
 assert.equal(save(f,{requestId:'off',expectedTickerRevision:1,enabled:false,speed:72}).ok,true);const again=setup({store:f.store});assert.equal(again.h.runtime.tickerState().enabled,false);assert.equal(again.h.runtime.tickerState().speed,72);assert.equal(again.h.runtime.tickerState().text,'Information äöü');
});
test('Lauftextschrift: Standard Petit Formal Script, Auswahl bleibt nach Neustart, alte Anfragen ohne Feld behalten sie',()=>{
 const f=admin();assert.equal(f.h.runtime.tickerState().font,'petit-formal-script');
 assert.equal(save(f,{font:'josefin-sans'}).ok,true);assert.equal(f.h.runtime.tickerState().font,'josefin-sans');
 // Gleiche Anfragekennung mit anderer Schrift ist keine Wiederholung.
 assert.equal(save(f,{font:'rajdhani'}).ok,false);assert.equal(f.h.runtime.tickerState().font,'josefin-sans');
 assert.equal(save(f,{requestId:'legacy',expectedTickerRevision:1,speed:32}).ok,true);
 assert.equal(f.h.runtime.tickerState().font,'josefin-sans');assert.equal(f.h.runtime.tickerState().speed,32);
 assert.equal(save(f,{requestId:'rajdhani',expectedTickerRevision:2,font:'rajdhani'}).ok,true);
 const again=setup({store:f.store});assert.equal(again.h.runtime.tickerState().font,'rajdhani');
 // Unbekannte gespeicherte Werte fallen auf den Standard zurück.
 const state=JSON.parse(JSON.stringify(again.h.runtime.state));state.ticker.font='fremd';again.h.runtime.state=state;
 assert.equal(again.h.runtime.tickerState().font,'petit-formal-script');
});
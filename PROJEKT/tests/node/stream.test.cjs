// Vertragstests für öffentliche konfigurierte Quellen, ohne echten Produktzugang.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHarness}=require('../support/knuddels.cjs');
const {configureStream,spcastStatistics}=require('../fixtures/stream.cjs');
const {playbackHarness}=require('../support/playback.cjs');

test('Neuer Verbindungsweg hält 24 Stunden mit genau einem Play und erhält Statusfehler',()=>{
 const p=playbackHarness();p.play();p.audio.volume=.73;p.audio.muted=true;p.advance(86400000);
 p.signals.emit('provider-status',{status:'stopped',previous:'started'});
 assert.equal(p.audio.playCalls,1);assert.equal(p.audio.paused,false);assert.equal(p.connection.state().wanted,true);
 assert.equal(p.audio.volume,.73);assert.equal(p.audio.muted,true);
});
test('Kurze Engpässe und Ereignisflut erhalten dieselbe Verbindung ohne Anbieterabfragen',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.freeze(true);p.audio.readyState=2;
 for(let i=0;i<100;i++){p.audio.emit('waiting');p.audio.emit('stalled');p.audio.emit('playing');}
 p.advance(8000);p.freeze(false);p.audio.readyState=4;p.advance(2000);
 assert.equal(p.audio.playCalls,1);assert.equal(p.connection.state().phase,'playing');assert.equal(p.providerPolls.length,0);
});
for(const signal of ['keine','playing'])test('Echter Dauerstillstand verbindet automatisch neu trotz '+signal,()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.freeze(true);
 for(let i=0;i<17;i++){p.advance(1000);if(signal==='playing')p.audio.emit('playing');}
 assert.equal(p.audio.playCalls,2);assert.equal(p.connection.state().wanted,true);
 p.freeze(false);p.advance(2000);assert.equal(p.connection.state().phase,'playing');
});
for(const event of ['error','ended'])test('Transportabbruch '+event+' verbindet selbstständig neu ohne Lautstärkeänderung',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.audio.volume=.81;p.audio.muted=true;
 if(event==='error')p.audio.error={code:2};else p.audio.ended=true;p.audio.emit(event);
 assert.equal(p.connection.state().phase,'reconnecting');assert.equal(p.connection.state().wanted,true);
 for(let i=0;i<20;i++)p.audio.emit(event);p.advance(1000);
 assert.equal(p.audio.playCalls,2);assert.equal(p.audio.volume,.81);assert.equal(p.audio.muted,true);
 p.advance(2000);assert.equal(p.connection.state().phase,'playing');
});
test('Unerwartete native Pause setzt dieselbe Quelle fort',()=>{
 const p=playbackHarness();p.play();p.advance(5000);const src=p.audio.src;p.audio.pause();
 assert.equal(p.audio.paused,false);assert.equal(p.audio.playCalls,2);assert.equal(p.audio.src,src);
});
test('Wiederholte Ausfälle erhalten Hörwunsch mit begrenzter Rücknahme der Versuchsrate',()=>{
 const p=playbackHarness();let attempts=0;p.audio.play=()=>{attempts++;throw Error('network');};p.play();
 p.advance(600000);assert.ok(attempts>=20&&attempts<=30,attempts);assert.equal(p.connection.state().wanted,true);
 p.stop();const before=attempts;p.window.emit('online');p.advance(600000);assert.equal(attempts,before);
});
test('Späte Play-Ablehnung und Ereignisse können nach Stop keinen Neustart auslösen',async()=>{
 const p=playbackHarness();let reject;p.audio.play=()=>new Promise((resolve,fail)=>{reject=fail;});p.play();p.stop();
 reject(Error('late'));await Promise.resolve();p.audio.emit('playing');p.audio.error={code:2};p.audio.emit('error');p.window.emit('online');p.advance(600000);
 assert.equal(p.connection.state().wanted,false);assert.equal(p.connection.state().phase,'stopped');
});
test('Explizite Browserfreigabe wird verständlich verlangt ohne heimliche Wiederholungen',async()=>{
 const p=playbackHarness();let calls=0;p.audio.play=()=>{calls++;return Promise.reject({name:'NotAllowedError'});};p.play();await Promise.resolve();p.advance(600000);
 assert.equal(calls,1);assert.equal(p.connection.state().phase,'blocked');assert.match(p.document.getElementById('playback-status').textContent,/Freigabe/);
});
test('Online-Signal zieht nur eine fällige Wiederverbindung vor, laufender Ton bleibt unangetastet',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.window.emit('online');assert.equal(p.audio.playCalls,1);
 p.audio.error={code:2};p.audio.emit('error');p.window.emit('online');assert.equal(p.audio.playCalls,2);
 p.stop();p.window.emit('online');p.advance(60000);assert.equal(p.audio.playCalls,2);
});
test('Fallback ohne Performance-Uhr hält auch bei Uhrkorrektur die Wiederverbindung fällig',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.audio.error={code:2};p.audio.emit('error');
 p.shiftWall(-3600000);p.advance(3000);assert.equal(p.audio.playCalls,2);assert.equal(p.connection.state().wanted,true);
});
for(const invalid of ['seeking','error','paused'])test('Ungültiger Fortschritt bei '+invalid+' verhindert Wiederherstellung nicht',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.freeze(true);p.audio[invalid]=invalid==='error'?{code:3}:true;
 p.audio.currentTime+=100;p.audio.emit('timeupdate');p.advance(17000);assert.equal(p.audio.playCalls,2);assert.equal(p.connection.state().wanted,true);
});

test('Wiedergabe-Heartbeat sendet ausschließlich alle drei Minuten mit frischer Antwort',()=>{
 const p=playbackHarness();p.advance(600000);assert.equal(p.slashes.length,0);
 p.play();p.advance(180000);assert.equal(p.slashes.length,0);p.advance(2000);assert.equal(p.slashes.length,1);
 p.advance(364000);assert.equal(p.slashes.length,3);assert.ok(p.slashes.every(s=>s.command==='/confirm'));
 for(let i=1;i<p.slashes.length;i++)assert.ok(p.slashes[i].at-p.slashes[i-1].at>=180000);
 assert.deepEqual(p.errors,[]);
});
test('Wiederkehrende kurze Datenlücken verschieben den Knuddels-Heartbeat nicht endlos',()=>{
 const p=playbackHarness();p.play();
 for(let i=0;i<7;i++){
  p.advance(55000);p.freeze(true);p.audio.readyState=2;p.audio.emit('waiting');p.advance(2000);
  p.freeze(false);p.audio.readyState=4;p.advance(3000);
 }
 assert.equal(p.slashes.length,2);assert.equal(p.audio.playCalls,1);
 assert.ok(p.slashes.every(s=>s.command==='/confirm'));assert.ok(p.slashes[1].at-p.slashes[0].at>=180000);
});
test('Fortschreitendes Audio mit knappem Puffer bestätigt weiterhin den Channel',()=>{
 const p=playbackHarness();p.play();p.advance(5000);p.audio.readyState=2;p.advance(545000);
 assert.equal(p.slashes.length,3);assert.equal(p.audio.playCalls,1);assert.equal(p.audio.paused,false);
 assert.equal(p.connection.state().phase,'playing');
 p.freeze(true);p.advance(10000);assert.equal(p.slashes.length,3,'Stehende Medienzeit bestätigt keine Aktivität');
});
for(const performanceClock of [false,true])for(const shift of [-3600000,3600000])
 test('Heartbeat übersteht Uhrkorrektur '+shift+' ms '+(performanceClock?'mit Performance-Uhr':'ohne Performance-Uhr'),()=>{
 const p=playbackHarness({performanceClock});p.play();p.advance(179000);p.shiftWall(shift);p.advance(4000);
 assert.equal(p.slashes.length,1);p.advance(181000);assert.equal(p.slashes.length,2);
 assert.ok(p.slashes[1].at-p.slashes[0].at>=180000);assert.equal(p.audio.playCalls,1);
});
for(const shift of [-3600000,3600000])test('Ausstehende Channelbestätigung behält bei Uhrkorrektur '+shift+' ms ihre reale Frist',()=>{
 const p=playbackHarness({performanceClock:true});p.ack('hold');p.play();p.advance(182000);
 const first=p.activityRequests()[0].data.requestId;p.shiftWall(shift);p.reply(first);p.advance(1000);
 assert.equal(p.slashes.length,1);p.advance(180000);const second=p.activityRequests().at(-1).data.requestId;
 p.advance(11000);p.reply(second);p.advance(1000);assert.equal(p.slashes.length,1,'Reale zehn Sekunden bleiben die Antwortgrenze');
});
test('Ein Engpass während einer ausstehenden Heartbeatantwort wartet nicht erneut drei Minuten',()=>{
 const p=playbackHarness();p.ack('hold');p.play();p.advance(182000);assert.equal(p.activityRequests().length,1);
 p.freeze(true);p.audio.readyState=2;p.audio.emit('waiting');p.advance(2000);
 p.freeze(false);p.audio.readyState=4;p.ack('all');p.advance(15000);
 assert.equal(p.slashes.length,1);assert.ok(p.activityRequests().length<=2);
});
for(const action of ['stop','waiting','stalled','offline','pagehide'])test('Heartbeat endet bei '+action+' ohne weiteren Klick',()=>{
 const p=playbackHarness();p.play();p.advance(182000);assert.equal(p.slashes.length,1);
 if(action==='stop')p.stop();
 else if(action==='offline'){p.navigator.onLine=false;p.window.emit('offline');}
 else if(action==='pagehide')p.window.emit('pagehide');
 else {if(action==='waiting'||action==='stalled'){p.freeze(true);p.audio.readyState=2;}p.audio.emit(action);}
 const queries=p.activityRequests().length;p.advance(600000);assert.equal(p.slashes.length,1);assert.equal(p.activityRequests().length,queries);
});
for(const event of ['waiting','stalled'])test('Fortschreitendes Audio übersteht '+event+' auch ohne neues playing und gibt Heartbeat erneut frei',()=>{
 const p=playbackHarness();p.play();p.advance(182000);assert.equal(p.slashes.length,1);
 p.audio.emit(event);p.advance(21000);assert.equal(p.audio.paused,false);
 p.advance(182000);assert.equal(p.slashes.length,2);assert.deepEqual(p.errors,[]);
});
test('Stehende Medienzeit und Zeitsprünge erzeugen keinen Heartbeat; bewusster Neustart gibt ihn wieder frei',()=>{
 const p=playbackHarness();p.play();p.freeze(true);p.advance(300000);assert.equal(p.slashes.length,0);
 assert.equal(p.connection.state().wanted,true);p.freeze(false);p.stop();p.play();p.advance(182000);assert.equal(p.slashes.length,1);
 p.audio.currentTime+=600;p.advance(10000);assert.equal(p.slashes.length,1);p.advance(180000);assert.equal(p.slashes.length,2);
});
test('Direkt vor Fälligkeit eingefrorene Medienzeit darf keinen Heartbeat erzeugen',()=>{
 const p=playbackHarness();p.play();p.advance(179000);p.freeze(true);p.advance(10000);assert.equal(p.slashes.length,0);
});
test('Auch nach frischer Antwort muss Audio noch fortschreiten, bevor der Slash-Aufruf erfolgt',()=>{
 const p=playbackHarness();p.ack('hold');p.play();p.advance(182000);p.freeze(true);
 p.audio.currentTime+=0.1;
 p.reply(p.activityRequests()[0].data.requestId);assert.equal(p.slashes.length,0);
 p.advance(10000);assert.equal(p.slashes.length,0);
});
test('Fehlende, fremde, doppelte und zu späte Channelantworten bestätigen keine neue Aktivität',()=>{
 const p=playbackHarness();p.ack('hold');p.play();p.advance(182000);assert.equal(p.slashes.length,0);
 const first=p.activityRequests()[0].data.requestId;p.reply('foreign');assert.equal(p.slashes.length,0);
 p.reply(first);p.reply(first);p.advance(1000);assert.equal(p.slashes.length,1);
 p.advance(180000);const second=p.activityRequests().at(-1).data.requestId;p.advance(11000);p.reply(second);assert.equal(p.slashes.length,1);
});
test('Ausstehende Bestätigung darf Stop und einen neuen Wiedergabeversuch nicht überleben',()=>{
 const p=playbackHarness();p.ack('hold');p.play();p.advance(182000);const id=p.activityRequests()[0].data.requestId;
 p.stop();p.play();p.reply(id);assert.equal(p.slashes.length,0);p.advance(182000);assert.equal(p.slashes.length,0);
 p.reply(p.activityRequests().at(-1).data.requestId);p.advance(1000);assert.equal(p.slashes.length,1);
});
test('Verspätete gültige Bestätigung verkürzt nicht den Abstand tatsächlicher Slash-Aufrufe',()=>{
 const p=playbackHarness();p.ack('hold');p.play();p.advance(182000);p.advance(7000);
 p.reply(p.activityRequests()[0].data.requestId);p.advance(1000);assert.equal(p.slashes.length,1);
 const count=p.activityRequests().length;p.advance(179000);assert.equal(p.activityRequests().length,count);
 p.advance(1000);p.reply(p.activityRequests().at(-1).data.requestId);p.advance(1000);assert.equal(p.slashes.length,2);
 assert.ok(p.slashes[1].at-p.slashes[0].at>=180000);
});
test('Verlust der Knuddels-Antworten beendet Heartbeats trotz weiterlaufendem Audio',()=>{
 const p=playbackHarness();p.play();p.advance(182000);p.ack('none');p.advance(600000);
 assert.equal(p.slashes.length,1);assert.equal(p.audio.paused,false);assert.equal(p.model.connected(),false);
});
test('Verdeckte Radioleiste erhält nur bei laufendem Audio ihre Channelbestätigung',()=>{
 const p=playbackHarness();p.document.hidden=true;p.play();p.advance(546000);assert.equal(p.slashes.length,3);
 p.stop();const count=p.requests.length;p.advance(300000);assert.equal(p.requests.length,count);assert.equal(p.slashes.length,3);
});
test('Fehlende oder werfende Slash-API beeinflusst weder Ton noch Oberfläche',()=>{
 const p=playbackHarness();delete p.bridge.executeSlashCommand;p.play();p.advance(360000);
 assert.equal(p.slashes.length,0);assert.equal(p.activityRequests().length,0);assert.equal(p.audio.paused,false);
 const q=playbackHarness();q.throwSlash(true);q.play();q.advance(182000);assert.equal(q.slashes.length,0);assert.equal(q.audio.paused,false);assert.deepEqual(q.errors,[]);
});
function station(){const h=createHarness();configureStream(h.config);const user=h.user(1,'Otterchen','owner');return h.state(user,h.open(user)).station;}
function client(respond,{xhr=false,contentType='text/plain; charset=utf-8'}={}){
 const requests=[],factories={};
 const text=async url=>{const body=await respond(url);return typeof body==='string'?body:JSON.stringify(body);};
 const fetch=async(url,options)=>{requests.push({url,options});return {ok:true,headers:{get:()=>contentType},text:()=>text(url)};};
 class XMLHttpRequest{
  open(method,url){this.url=url;}getResponseHeader(){return contentType;}
  send(){requests.push({url:this.url});text(this.url).then(body=>{this.status=200;this.responseText=body;this.onload();},()=>this.onerror());}
 }
 const scope={URL,AbortController,setTimeout,clearTimeout,fetch,XMLHttpRequest,window:xhr?{}:{fetch,AbortController},
  MischWerkUI:{define(name,value){factories[name]=value;}}};
 for(const file of ['metadata.js','api.js'])vm.runInNewContext(fs.readFileSync('app/www/js/radio/'+file,'utf8'),scope);
 return {api:factories.radioApi({metadata:factories.songMetadata()}),requests};
}
test('Konfigurierbare verschachtelte JSON-Felder liefern getrennte Titel und Status',async()=>{
 const s=station();s.fields={title:'song.title',artist:'song.artist',live:'mode.live',status:'broadcast.online',statusIdentity:'station.id'};
 s.statusValues={online:true,offline:false};
 const body={song:{title:'Band - Live - Remix',artist:'Name - Original'},mode:{live:false},broadcast:{online:true},station:{id:s.stationId}};
 const {api,requests}=client(()=>body);
 assert.equal(await api.fetchStationStatus(s),'started');
 const song=await api.fetchMetadata(s);assert.equal(song.title,body.song.title);assert.equal(song.artist.name,body.song.artist);assert.equal(song.isLive,false);
 assert.ok(requests.every(r=>r.options.credentials==='omit'&&r.options.cache==='no-store'));
});
test('Fehlende Datendienste lassen den öffentlichen Audiostream nutzbar und erzeugen keine Abfragen',async()=>{
 const s=station();s.metadataUrl=s.statusUrl='';const {api,requests}=client(()=>{throw Error('Unzulässige Abfrage');});
 assert.equal(api.streamUrls(s).stream,s.streamUrl);assert.equal(await api.fetchProviderStatus(s),'unknown');
 await assert.rejects(api.fetchMetadata(s));assert.equal(requests.length,0);
});
test('Gleiche öffentliche JSON-Quelle wird bei parallelen Lesern nur einmal angefordert',async()=>{
 const s=station();s.metadataUrl=s.statusUrl='https://stats.example.com/combined';
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const {api,requests}=client(async()=>{await gate;return {title:'Ein Song',artist:'Band',listener_count:7,slug:s.stationId,stream_status:'started'};});
 const all=[api.fetchMetadata(s),api.fetchStationStatus(s)];assert.equal(requests.length,1);release();
 const results=await Promise.all(all);assert.equal(results[0].title,'Ein Song');assert.equal(results[1],'started');
});
function productStation(){const h=createHarness(),u=h.user(1,'Otterchen','owner');return h.state(u,h.open(u)).station;}
function historyStation(){return {...productStation(),metadataUrl:'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json',
 metadataFormat:'spcast-history',fields:{...productStation().fields,title:'metadata.song'}};}
function historyRows(song, timestamp=Math.floor(Date.now()/1000)-1){return [{timestamp,metadata:{song}}];}

for(const xhr of [false,true])test('Direkter SPCast-Songabruf umgeht fünf Minuten Cache auch mit '+(xhr?'XHR':'fetch')+' und trennt Titel und Interpret',async()=>{
 const s=productStation();let body='  a-ha - Take On Me - Live | Radio MischWerk\r\n';
 const {api,requests}=client(()=>body,{xhr});
 const first=await api.fetchMetadata(s);assert.equal(first.title,'Take On Me - Live');assert.equal(first.artist.name,'a-ha');
 assert.equal(first.isLive,null);assert.equal(Object.hasOwn(first,'timestamp'),false,'Keine erfundene Anbieterzeit');
 const url=new URL(requests[0].url);assert.equal(url.origin+url.pathname,s.metadataUrl);assert.match(url.searchParams.get('_mw'),/^\d+$/);
 body='Neue Band - Neuer Titel';const second=await api.fetchMetadata(s);assert.equal(second.title,'Neuer Titel');assert.equal(second.artist.name,'Neue Band');
 for(const [source,title,artist] of [['Nur ein Titel','Nur ein Titel',''],['Band -','Band -',''],['- Titel','- Titel',''],
  ['Jean-Michel Jarre','Jean-Michel Jarre',''],['AC/DC - Rock - Remix','Rock - Remix','AC/DC'],
  ['<b>Band</b> - Grüße','Grüße','<b>Band</b>']]){
  body=source;const song=await api.fetchMetadata(s);assert.equal(song.title,title);assert.equal(song.artist.name,artist);
 }
 for(body of ['', 'Unknown', ' unknown | Zusatz ', ' | Nur Zusatz', 'Mehrere\nZeilen', 'x'.repeat(2001)])await assert.rejects(api.fetchMetadata(s));
 if(!xhr)assert.ok(requests.every(r=>r.options.cache==='no-store'&&r.options.credentials==='omit'));
 for(const contentType of ['text/html','application/json','']){
  const invalid=client(()=>'<html>404 - Not Found</html>',{xhr,contentType});await assert.rejects(invalid.api.fetchMetadata(s));
 }
});

test('Gleichzeitige direkte Songleser teilen eine Anfrage trotz Cacheparameter',async()=>{
 const s=productStation();let release;const gate=new Promise(resolve=>{release=resolve;});
 const {api,requests}=client(async()=>{await gate;return 'Band - Titel';});
 const all=[api.fetchMetadata(s),api.fetchMetadata(s)];assert.equal(requests.length,1);release();
 for(const song of await Promise.all(all))assert.equal(song.title,'Titel');
});

test('Player liest den neuesten gültigen Historieneintrag unabhängig von Arrayfolge, Tagesgrenze und Bindestrichen',async()=>{
 const s=historyStation(),now=Math.floor(Date.now()/1000),title='Band - Titel - Live - Remix';
 const rows=[...historyRows('Älter',now-20),null,...historyRows(title,now-2),...historyRows('Zukunft',now+60),
  ...historyRows('Unknown',now-1),...historyRows('  ',now-1),{timestamp:String(now-1),metadata:{song:'Ungültig'}},
  ...historyRows('x'.repeat(2001),now-1)];
 const {api,requests}=client(()=>rows),song=await api.fetchMetadata(s);
 assert.equal(song.title,'Titel - Live - Remix');assert.equal(song.artist.name,'Band');assert.equal(song.isLive,null);assert.equal(song.timestamp,now-2);
 assert.equal(requests[0].url,s.metadataUrl);assert.equal(requests[0].options.cache,'no-store');
 assert.equal(requests[0].options.credentials,'omit');
 rows.splice(0,rows.length,...historyRows('Mischwerk dein Radio',now-86400));
 assert.equal((await api.fetchMetadata(s)).title,'Mischwerk dein Radio','Aktuelle Titelquelle nutzt weder Tages- noch Jinglefilter der privaten Historienansicht');
 for(const [source,title,artist] of [['a-ha - Take On Me','Take On Me','a-ha'],
  ['AC/DC - Rock - Live - Remix','Rock - Live - Remix','AC/DC'],['  Band   -   Titel  ','Titel','Band'],
  ['Titel ohne Interpret','Titel ohne Interpret',''],['Jean-Michel Jarre','Jean-Michel Jarre',''],
  ['Band -','Band -',''],['- Titel','- Titel',''],['Titel – Zusatz','Titel – Zusatz','']]){
  rows.splice(0,rows.length,...historyRows(source,now-2));const song=await api.fetchMetadata(s);
  assert.equal(song.title,title,source);assert.equal(song.artist.name,artist,source);
 }
});

test('Direkte Titelquelle ist für Hörer freigegeben; private Regie-Historienrechte bleiben getrennt',()=>{
 const h=createHarness();
 for(const [id,role] of [[1,'owner'],[2,'listener'],[3,'moderator'],[4,'manager']]){
  const u=h.user(id,id===1?'Otterchen':'Rolle '+id,role),s=h.state(u,h.open(u)).station;
  assert.equal(s.metadataFormat,'spcast-current-song');
  assert.equal(s.metadataUrl,'https://mischwerk.spcast.eu/currentSong.txt');
  assert.equal(Object.hasOwn(s,'historyUrl'),id===1);
 }
});

test('Leere, übergroße und fehlerhafte Historienantworten werden nicht als aktuelle Titel akzeptiert',async()=>{
 const s=historyStation();let body;
 const {api}=client(()=>body);
 for(body of [[],{},null,'not JSON',new Array(10001).fill(null),historyRows('Unknown'),' '.repeat(2000001)])await assert.rejects(api.fetchMetadata(s));
});

test('Port 9000 bleibt ausschließlich für die bestätigte Historie als Metadatenquelle freigegeben',()=>{
 const s=historyStation(),{api}=client(()=>[]);
 assert.equal(api.streamUrls(s).metadata,s.metadataUrl);
 for(const metadataUrl of ['https://mischwerk.spcast.eu:9000/other.json','https://mischwerk.spcast.eu:9001/sp/cache/history/history.json',
  'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json?token=secret','https://user:pass@mischwerk.spcast.eu:9000/sp/cache/history/history.json']){
  assert.equal(api.streamUrls({...s,metadataUrl}),null);
 }
 assert.equal(api.streamUrls({...s,metadataFormat:''}),null);
 assert.equal(api.audioUrl({...s,streamUrl:s.metadataUrl}),null);
});
test('Getrennte Titel- und Modusabrufe warten nicht aufeinander und deduplizieren den Modus',async()=>{
 const s=productStation();let releaseMode;
 const gate=new Promise(resolve=>{releaseMode=resolve;});
 const {api,requests}=client(async url=>url===s.modeUrl?(await gate,'autodj'):'Band - Neuer Titel');
 assert.equal(typeof api.fetchBroadcastMode,'function');
 const first=api.fetchBroadcastMode(s),second=api.fetchBroadcastMode(s);
 try{
  const song=await api.fetchMetadata(s);assert.equal(song.title,'Neuer Titel');assert.equal(song.artist.name,'Band');assert.equal(song.isLive,null);
  assert.equal(requests.filter(r=>r.url===s.modeUrl).length,1);
 }finally{releaseMode();}
 assert.deepEqual(await Promise.all([first,second]),[false,false]);
});
test('SPCast-Produktquelle liefert zugeordneten Übertragungsstatus und AutoDJ ohne Audioprobe',async()=>{
 const s=productStation(),{api,requests}=client(url=>url===s.statusUrl?spcastStatistics():url===s.modeUrl?'autodj':'Band - Titel');
 assert.equal(await api.fetchProviderStatus(s),'started');
 assert.equal((await api.fetchMetadata(s)).isLive,null);assert.equal(await api.fetchBroadcastMode(s),false);
 assert.ok(requests.every(r=>r.url!==s.streamUrl));
});
test('Bestätigter SPCast-Stopp gilt mit inaktivem Stream und explizit leerer Liste, fehlende Felder bleiben unbekannt',async()=>{
 const s=productStation();let body=spcastStatistics({online:false});const {api}=client(()=>body);
 assert.equal(await api.fetchProviderStatus(s),'stopped');
 body.streams=[];assert.equal(await api.fetchProviderStatus(s),'stopped');
 delete body.streams;assert.equal(await api.fetchProviderStatus(s),'unknown');
});
test('SPCast-Zuordnung wählt Stream-ID und Pfad statt Arrayposition und erhält aktive Backupquelle',async()=>{
 const s=productStation(),body=spcastStatistics({listeners:3});body.totalstreams=2;body.activestreams=2;body.currentlisteners=100;
 body.streams.unshift({...body.streams[0],id:2,streampath:'/other',currentlisteners:97});const {api}=client(()=>body);
 assert.equal(await api.fetchProviderStatus(s),'started');
 body.streams[1].streamstatus=0;body.streams[1].backupstatus=1;assert.equal(await api.fetchProviderStatus(s),'started');
});
test('Fremde, doppelte und widersprüchliche SPCast-Statistiken erzeugen keinen bestätigten Stopp',async()=>{
 const s=productStation();let body;const {api}=client(()=>body);
 for(const alter of [b=>b.streams[0].serverurl='https://other.example.com',b=>b.streams[0].streampath='/other',
  b=>b.streams[0].id=2,b=>b.streams.push({...b.streams[0]}),b=>b.activestreams=0,
  b=>b.streams[0].streamstatus=0,b=>b.streams[0].streamstatus='0',b=>b.activestreams=null,
  b=>b.streams[0].backupstatus='1',b=>b.streams=[]]){
  body=spcastStatistics();alter(body);assert.equal(await api.fetchProviderStatus(s),'unknown');
 }
});
test('Öffentlicher Modusdienst akzeptiert nur bestätigte Werte; Fehler bleiben von Titeln getrennt',async()=>{
 const s=productStation();let mode;const {api}=client(url=>{if(url===s.modeUrl){if(mode instanceof Error)throw mode;return mode;}return 'Song';});
 for(const [value,expected] of [['autodj',false],['live',true],['autodj_live',null],['relay',null],['',null],['<html>offline</html>',null]]){
  mode=value;assert.equal(await api.fetchBroadcastMode(s),expected);
  const song=await api.fetchMetadata(s);assert.equal(song.isLive,null);assert.equal(song.title,'Song');
 }
 mode=new Error('network');await assert.rejects(api.fetchBroadcastMode(s));assert.equal((await api.fetchMetadata(s)).title,'Song');
});
test('Lesender Anschlussprüfer folgt nur freigegebenen HTTPS-Weiterleitungen und beendet die Audioprobe',async()=>{
 const {probeStream}=require('../../tools/checks/streampanel.cjs'),s=station(),{api}=client(()=>({}));
 const requests=[];let canceled=0;
 const result=await probeStream(s,api,async(url,options)=>{
  requests.push({url,options});
  if(requests.length===1)return new Response(null,{status:302,headers:{location:'https://stats.example.com/audio'}});
  return new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(16));},cancel(){canceled++;}}),{
   headers:{'content-type':'audio/mpeg','access-control-allow-origin':'*'}});
 });
 assert.equal(result.finalUrl,'https://stats.example.com/audio');assert.equal(result.redirects.length,1);
 assert.equal(result.directAudio,true);assert.equal(result.bytesReceived,16);assert.equal(canceled,1);
 assert.ok(requests.every(r=>r.options.redirect==='manual'&&r.options.credentials==='omit'&&r.options.headers.Range==='bytes=0-8191'));
 for(const location of ['https://foreign.example.com/audio','http://stats.example.com/audio',
  'https://user:secret@stats.example.com/audio','https://stats.example.com/audio?token=secret']){
  let count=0;await assert.rejects(probeStream(s,api,async()=>{count++;return new Response(null,{status:302,headers:{location}});}));
  assert.equal(count,1,'Unzulässiges Weiterleitungsziel wird nicht angefragt');
 }
 let count=0;await assert.rejects(probeStream(s,api,async()=>{count++;return new Response(null,{status:302,headers:{location:s.streamUrl}});}));
 assert.equal(count,5,'Weiterleitungsschleife endet nach begrenzter Kette');
});
test('Unbekannter oder widersprüchlicher Senderstatus wird niemals als Sendepause oder AutoDJ erfunden',async()=>{
 const s=station();let body={stream_status:'other',slug:s.stationId};const {api}=client(()=>body);
 assert.equal(await api.fetchProviderStatus(s),'unknown');body={stream_status:'stopped',slug:'fremde-station'};
 assert.equal(await api.fetchProviderStatus(s),'unknown');body={title:'Song',artist:'Band',is_live:0};
 assert.equal((await api.fetchMetadata(s)).isLive,null);
});
test('Fehlende Titelfelder werden abgewiesen',async()=>{
 const {api}=client(()=>({unexpected:'Fremdes Format'}));await assert.rejects(api.fetchMetadata(station()));
});
test('Hörerzahl besitzt weder Konfiguration noch öffentliche Abfragefunktion',()=>{
 const h=createHarness();h.config.streampanel.listeners={url:'https://mischwerk.sp.radio.fm/obsolete-listeners',valueField:'currentlisteners'};
 const u=h.user(1,'Otterchen','owner'),s=h.state(u,h.open(u)).station,{api,requests}=client(()=>{throw Error('Keine Hörerabfrage');});
 assert.equal('listenersUrl' in s,false);assert.equal('listeners' in s.fields,false);
 assert.equal('listeners' in api.streamUrls(s),false);assert.equal('fetchListeners' in api,false);assert.equal(requests.length,0);
});
test('Browser verwirft fremde Hosts, Zugangsdaten und gefährliche Feldpfade',async()=>{
 const s=station(),{api,requests}=client(()=>({title:'Song',artist:'Band'}));
 for(const patch of [{streamUrl:'http://stream.example.com/stream'},{streamUrl:'https://user:secret@stream.example.com/stream'},
  {metadataUrl:'https://foreign.example.com/metadata'},{modeUrl:'https://foreign.example.com/mode'},
  {statusUrl:'https://stats.example.com/status?%74oken=private'},
  {provider:'unknown'},{allowedHosts:[]}])assert.equal(api.streamUrls({...s,...patch}),null);
 assert.equal(requests.length,0);s.fields.title='constructor.name';s.fields.artist='__proto__.name';await assert.rejects(api.fetchMetadata(s));
});
test('Aktive App und Backendquellen enthalten keinerlei alten Anbieter oder alte Endpunkte',()=>{
 const {runtimeFiles,isBinary}=require('../../tools/checks/lengths.cjs');
 for(const file of runtimeFiles.filter(f=>!isBinary(f)))assert.doesNotMatch(fs.readFileSync('app/'+file,'utf8'),/radioking/i,file);
});

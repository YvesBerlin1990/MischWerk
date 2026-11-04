// Vertragstests für öffentliche konfigurierte Quellen, ohne echten Produktzugang.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHarness}=require('../support/knuddels.cjs');
const {configureStream,spcastStatistics}=require('../fixtures/stream.cjs');
const {playbackHarness}=require('../support/playback.cjs');

test('Wiedergabe-Heartbeat sendet ausschließlich alle drei Minuten mit frischer Antwort',()=>{
 const p=playbackHarness();p.advance(600000);assert.equal(p.slashes.length,0);
 p.play();p.advance(180000);assert.equal(p.slashes.length,0);p.advance(2000);assert.equal(p.slashes.length,1);
 p.advance(364000);assert.equal(p.slashes.length,3);assert.ok(p.slashes.every(s=>s.command==='/confirm'));
 for(let i=1;i<p.slashes.length;i++)assert.ok(p.slashes[i].at-p.slashes[i-1].at>=180000);
 assert.deepEqual(p.errors,[]);
});
for(const action of ['stop','pause','waiting','stalled','error','ended','station','provider','offline','pagehide'])test('Heartbeat endet bei '+action+' ohne weiteren Klick',()=>{
 const p=playbackHarness();p.play();p.advance(182000);assert.equal(p.slashes.length,1);
 if(action==='stop')p.stop();
 else if(action==='station')p.signals.emit('station-changed',{configured:true});
 else if(action==='provider')p.signals.emit('provider-status',{status:'stopped',previous:'started'});
 else if(action==='offline'){p.navigator.onLine=false;p.window.emit('offline');}
 else if(action==='pagehide')p.window.emit('pagehide');
 else p.audio.emit(action);
 const queries=p.activityRequests().length;p.advance(600000);assert.equal(p.slashes.length,1);assert.equal(p.activityRequests().length,queries);
});
test('Stehende Medienzeit und Zeitsprünge erzeugen keinen Heartbeat; Fortschritt kann neu beginnen',()=>{
 const p=playbackHarness();p.play();p.freeze(true);p.advance(300000);assert.equal(p.slashes.length,0);
 p.freeze(false);p.advance(182000);assert.equal(p.slashes.length,1);
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
function client(respond){
 const requests=[];let factory;
 const fetch=async(url,options)=>{requests.push({url,options});return {ok:true,text:async()=>{const body=await respond(url);return typeof body==='string'?body:JSON.stringify(body);}};};
 vm.runInNewContext(fs.readFileSync('app/www/js/radio/api.js','utf8'),{URL,AbortController,setTimeout,clearTimeout,fetch,window:{fetch,AbortController},
  MischWerkUI:{define(name,value){factory=value;}}});
 return {api:factory(),requests};
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
test('Bestätigte SPCast-Titelfelder behalten getrennte Inhalte und fehlenden LIVE-Status',async()=>{
 const h=createHarness(),u=h.user(1,'Otterchen','owner'),s=h.state(u,h.open(u)).station;
 let body={currentSong:null,currentArtist:'Unknown'};const {api}=client(url=>url.includes('whoIsLive')?'relay':url.includes('statistics')?spcastStatistics():body);
 let song=await api.fetchMetadata(s);assert.equal(song.title,'');assert.equal(song.artist.name,'Unknown');assert.equal(song.isLive,null);
 body={currentSong:'Titel - Live - Remix',currentArtist:'Band - Original'};
 song=await api.fetchMetadata(s);assert.equal(song.title,body.currentSong);assert.equal(song.artist.name,body.currentArtist);
 assert.equal(await api.fetchProviderStatus(s),'started');
});
function productStation(){const h=createHarness(),u=h.user(1,'Otterchen','owner');return h.state(u,h.open(u)).station;}
test('SPCast-Produktquelle liefert zugeordneten Übertragungsstatus und AutoDJ ohne Audioprobe',async()=>{
 const s=productStation(),{api,requests}=client(url=>url===s.statusUrl?spcastStatistics():url===s.modeUrl?'autodj':{currentSong:'Titel',currentArtist:'Band'});
 assert.equal(await api.fetchProviderStatus(s),'started');
 assert.equal((await api.fetchMetadata(s)).isLive,false);assert.ok(requests.every(r=>r.url!==s.streamUrl));
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
test('Öffentlicher Modusdienst akzeptiert nur bestätigte AutoDJ-/LIVE-Werte und blockiert keine Titel bei Fehlern',async()=>{
 const s=productStation();let mode;const {api}=client(url=>{if(url===s.modeUrl){if(mode instanceof Error)throw mode;return mode;}return {currentSong:'Song',currentArtist:'Band'};});
 for(const [value,expected] of [['autodj',false],['live',true],['autodj_live',null],['relay',null],['',null],['<html>offline</html>',null],[new Error('network'),null]]){
  mode=value;const song=await api.fetchMetadata(s);assert.equal(song.isLive,expected);assert.equal(song.title,'Song');
 }
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

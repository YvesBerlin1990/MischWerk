// Vertragstests für öffentliche konfigurierte Quellen, ohne echten Produktzugang.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHarness}=require('../support/knuddels.cjs');
const {configureStream}=require('../fixtures/stream.cjs');
function station(){const h=createHarness();configureStream(h.config);const user=h.user(1,'Otterchen','owner');return h.state(user,h.open(user)).station;}
function client(respond){
 const requests=[];let factory;
 const fetch=async(url,options)=>{requests.push({url,options});return {ok:true,text:async()=>JSON.stringify(await respond(url))};};
 vm.runInNewContext(fs.readFileSync('app/www/js/radio/api.js','utf8'),{URL,AbortController,setTimeout,clearTimeout,fetch,window:{fetch,AbortController},
  MischWerkUI:{define(name,value){factory=value;}}});
 return {api:factory(),requests};
}
test('Konfigurierbare verschachtelte JSON-Felder liefern getrennte Titel, Status und Hörer',async()=>{
 const s=station();s.fields={title:'song.title',artist:'song.artist',live:'mode.live',listeners:'audience.current',status:'broadcast.online',statusIdentity:'station.id'};
 s.statusValues={online:true,offline:false};
 const body={song:{title:'Band - Live - Remix',artist:'Name - Original'},mode:{live:false},audience:{current:0},broadcast:{online:true},station:{id:s.stationId}};
 const {api,requests}=client(()=>body);
 assert.equal(await api.fetchStationStatus(s),'started');assert.equal(await api.fetchListeners(s),0);
 const song=await api.fetchMetadata(s);assert.equal(song.title,body.song.title);assert.equal(song.artist.name,body.song.artist);assert.equal(song.isLive,false);
 assert.ok(requests.every(r=>r.options.credentials==='omit'&&r.options.cache==='no-store'));
});
test('Fehlende Datendienste lassen den öffentlichen Audiostream nutzbar und erzeugen keine Abfragen',async()=>{
 const s=station();s.metadataUrl=s.statusUrl=s.listenersUrl='';const {api,requests}=client(()=>{throw Error('Unzulässige Abfrage');});
 assert.equal(api.streamUrls(s).stream,s.streamUrl);assert.equal(await api.fetchProviderStatus(s),'unknown');
 await assert.rejects(api.fetchMetadata(s));await assert.rejects(api.fetchListeners(s));assert.equal(requests.length,0);
});
test('Gleiche öffentliche JSON-Quelle wird bei parallelen Lesern nur einmal angefordert',async()=>{
 const s=station();s.metadataUrl=s.statusUrl=s.listenersUrl='https://stats.example.com/combined';
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const {api,requests}=client(async()=>{await gate;return {title:'Ein Song',artist:'Band',listener_count:7,slug:s.stationId,stream_status:'started'};});
 const all=[api.fetchMetadata(s),api.fetchStationStatus(s),api.fetchListeners(s)];assert.equal(requests.length,1);release();
 const results=await Promise.all(all);assert.equal(results[0].title,'Ein Song');assert.equal(results[1],'started');assert.equal(results[2],7);
});
test('Unbekannter oder widersprüchlicher Senderstatus wird niemals als Sendepause oder AutoDJ erfunden',async()=>{
 const s=station();let body={stream_status:'other',slug:s.stationId};const {api}=client(()=>body);
 assert.equal(await api.fetchProviderStatus(s),'unknown');body={stream_status:'stopped',slug:'fremde-station'};
 assert.equal(await api.fetchProviderStatus(s),'unknown');body={title:'Song',artist:'Band',is_live:0};
 assert.equal((await api.fetchMetadata(s)).isLive,null);
});
test('Ungültige Hörerzahlen und fehlende Felder werden abgewiesen; gültige Null bleibt Null',async()=>{
 const s=station();let body;const {api}=client(()=>body);
 for(const value of [null,-1,1.5,true,'NaN','1e3','',{},9007199254740992]){body={listener_count:value};await assert.rejects(api.fetchListeners(s));}
 body={listener_count:'0'};assert.equal(await api.fetchListeners(s),0);
 body={unexpected:'Fremdes Format'};await assert.rejects(api.fetchMetadata(s));
});
test('Browser verwirft fremde Hosts, Zugangsdaten und gefährliche Feldpfade',async()=>{
 const s=station(),{api,requests}=client(()=>({title:'Song',artist:'Band'}));
 for(const patch of [{streamUrl:'http://stream.example.com/stream'},{streamUrl:'https://user:secret@stream.example.com/stream'},
  {metadataUrl:'https://foreign.example.com/metadata'},{statusUrl:'https://stats.example.com/status?%74oken=private'},
  {listenersUrl:'https://127.0.0.1/listeners'},{provider:'unknown'},{allowedHosts:[]}])assert.equal(api.streamUrls({...s,...patch}),null);
 assert.equal(requests.length,0);s.fields.title='constructor.name';s.fields.artist='__proto__.name';await assert.rejects(api.fetchMetadata(s));
});
test('Aktive App und Backendquellen enthalten keinerlei alten Anbieter oder alte Endpunkte',()=>{
 const {runtimeFiles,isBinary}=require('../../tools/checks/lengths.cjs');
 for(const file of runtimeFiles.filter(f=>!isBinary(f)))assert.doesNotMatch(fs.readFileSync('app/'+file,'utf8'),/radioking/i,file);
});

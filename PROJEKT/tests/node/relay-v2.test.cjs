const test=require('node:test');const assert=require('node:assert/strict');
const crypto=require('node:crypto');const {setup}=require('../fixtures/relay-v2.cjs');
function last(events,type){return events.findLast(row=>row.type===type)?.data;}

test('Ausbleibender nativer Callback bleibt ein einzelner physischer POST und meldet die anschließende Blockade',()=>{
 const f=setup();for(let step=0;step<18;step++)f.h.advance(10000);
 assert.equal(f.posts.length,1,'Logischer Timeout darf keinen physisch offenen Aufruf freigeben');
 assert.equal(f.h.runtime.androidRelayHealthy(),false);
 assert.equal(f.h.runtime.receivedShow().active,false);
 assert.equal(f.h.runtime.androidLastFailure().stage,'busy','Blockierter Transport ersetzt den alten Timeoutbefund');
});

test('Zentraler Fünfsekundentakt erkennt einen DJ auch aus unbekanntem, beendetem oder Legacy-Stand',()=>{
 for(const [authority,broadcastState] of [['studio','unknown'],['studio','ended'],['legacy','unknown']]){
  const f=setup(),h=f.h,u=h.user(3,'Hörer'),session=h.open(u);
  const inactive={...f.response().station,authority,broadcastState,onAir:false,wishboxOpen:false,moderatorNick:null,topic:null,validUntil:0,updatedAt:0};
  for(let count=1;count<=3;count+=1){
   f.finish(undefined,{station:inactive});assert.equal(h.state(u,session).moderator,null);
   h.advance(4999);assert.equal(f.posts.length,count,'Kein vorzeitiger regulärer Abruf');
   h.advance(1);assert.equal(f.posts.length,count+1,'Auch ohne bestätigte Sendung nach fünf Sekunden erneut lesen');
  }
  f.finish();assert.equal(last(session.events,'mw:state').moderator.nick,'DJ-Test','Bestätigter DJ wird direkt übertragen');
  h.advance(4999);assert.equal(f.posts.length,4);h.advance(1);assert.equal(f.posts.length,5,'Aktive Sendung behält denselben Takt');
 }
});

test('Fünfsekundentakt erhält Einzelanfrage, Zehnsekundenfrist, Fehlerbackoff und Abschaltung',()=>{
 const f=setup(),h=f.h,first=f.posts[0];
 h.advance(5000);assert.equal(f.posts.length,1,'Keine zweite Anfrage während laufendem Aufruf');
 h.advance(5000);assert.equal(h.runtime.androidLastFailure().stage,'timeout');assert.equal(f.posts.length,1);
 first.args.onSuccess(JSON.stringify(f.response()),{getResponseCode:()=>200,getURLString:()=>first.url});
 assert.equal(h.runtime.receivedShow().active,false,'Verspäteter Erfolg aktiviert keinen DJ');
 for(const delay of [10000,20000,40000,60000,60000]){
  const count=f.posts.length;h.advance(delay-1);assert.equal(f.posts.length,count,'Fehlerpause vollständig erhalten');
  h.advance(1);assert.equal(f.posts.length,count+1);f.finish(undefined,{},503);
 }
 h.runtime.stopAndroidPublisher();const count=f.posts.length;h.advance(120000);assert.equal(f.posts.length,count,'Abschaltung beendet den Abgleich');
});

test('Private Quellen-Vorprüfung liest vorhandene Namespace-Kennung ohne Export, Commit oder Portaufruf',()=>{
 const f=setup(),h=f.h,u=h.user(8,'Polaroid');h.open(u);h.app.chatCommands.mw(u,'admin');const session=u.sessions.find(s=>s.activeView==='team');
 require('../fixtures/legacy-wishes.cjs').seed(h,[{text:'Ungefrorenes Original'}]);
 const before=JSON.stringify(h.store.data),posts=f.posts.length;
 h.runtime.nativeNamespace=()=>{throw Error('Erzeugender Getter verboten');};h.runtime.nativeMigrationPage=()=>{throw Error('Export verboten');};
 h.event(u,session,'mw:androidSettings.status',{});const view=last(session.events,'mw:androidSettings.status').state.sourcePreflight;
 assert.equal(view.sourceNamespace,f.posts[0].body.transportId);assert.equal(view.originalCount,1);assert.equal(view.outboxCount,0);
 assert.equal(view.version,h.config.version);assert.equal(view.buildNumber,h.config.buildNumber);assert.equal(view.checkedAt,h.now());
 assert.equal(JSON.stringify(h.store.data),before);assert.equal(f.posts.length,posts);assert.doesNotMatch(JSON.stringify(view),/Ungefrorenes Original|ownerKey|senderKey|syncSecret/);
});

test('Nicht vorhandene Quellenkennung bleibt unbekannt und wird durch Konsolenlesen nicht erzeugt',()=>{
 const {createHarness}=require('../support/knuddels.cjs'),h=createHarness(),u=h.user(8,'Polaroid');h.open(u);h.app.chatCommands.mw(u,'admin');const session=u.sessions.find(s=>s.activeView==='team'),before=JSON.stringify(h.store.data);
 h.event(u,session,'mw:androidSettings.status',{});const source=last(session.events,'mw:androidSettings.status').state.sourcePreflight;
 assert.equal(source.sourceNamespace,null);assert.equal(source.originalCount,0);assert.equal(JSON.stringify(h.store.data),before);assert.equal(h.runtime.loadWishes().studioNamespace,undefined);
});

test('Unbestätigte, bestätigte leere und abgelaufene Nickfreigaben bleiben unterscheidbar',()=>{
 const f=setup(),h=f.h,u=h.user(8,'Polaroid'),session=h.open(u);assert.equal(h.state(u,session).radioModeratorsConfirmed,false);assert.equal(h.state(u,session).radioModeratorTotal,null);
 const page=f.response().nickAccessPage;f.finish(undefined,{nickAccessPage:{...page,items:[]}});assert.equal(h.state(u,session).radioModeratorsConfirmed,true);assert.equal(h.state(u,session).radioModeratorTotal,0);
 h.advance(45001);assert.equal(h.state(u,session).radioModeratorsConfirmed,false);assert.equal(h.state(u,session).radioModeratorTotal,null);
});

test('Lokale Anzeige schreibt keine nativeConfig oder Sendungsvorgabe in den zentralen Request',()=>{
 const f=setup(),h=f.h,u=h.user(8,'Polaroid');h.open(u);h.app.chatCommands.mw(u,'admin');const session=u.sessions.find(s=>s.activeView==='team');
 h.event(u,session,'mw:setTicker',{requestId:'local-ticker',view:'team',viewRevision:1,expectedTickerRevision:0,text:'Nur hier',enabled:true,speed:48,direction:'left'});
 const request=h.runtime.nativeRelayRequest();assert.equal(request.nativeConfig,undefined);assert.equal(request.station,undefined);assert.equal(request.topic,undefined);assert.doesNotMatch(JSON.stringify(request),/Nur hier|ticker|nativeConfig/);assert.equal(h.runtime.tickerState().text,'Nur hier');
});

test('Eigene Abgabe während laufendem Poll folgt nach dessen Antwort im einzelnen Timer statt nach Regeltakt',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),session=h.open(u);f.finish();h.advance(5000);const poll=f.posts.at(-1),count=f.posts.length;
 h.event(u,session,'mw:wish.submit',{submissionId:'busy-fast',text:'Schnell und einmal'});assert.equal(f.posts.length,count);
 f.finish(poll);assert.equal(f.posts.length,count,'Kein rekursiver Post aus Callback');h.advance(1);assert.equal(f.posts.length,count+1);
 const sent=f.posts.at(-1);assert.equal(sent.body.wishSubmissions.length,1);assert.equal(sent.body.wishSubmissions[0].text,'Schnell und einmal');
 f.finish(sent,{wishReceipts:[]});h.advance(1);assert.equal(f.posts.length,count+1,'Fehlender Einzelbeleg erzeugt keine Millisekunden-Wiederholungsschleife');
 h.advance(4999);assert.equal(f.posts.length,count+2);assert.equal(f.posts.at(-1).body.wishSubmissions[0].submissionId,sent.body.wishSubmissions[0].submissionId);
});

test('Ein HTTP-Callbackfehler bleibt eine Warnung mit ursprünglicher privater Fehlerstufe',()=>{
 const f=setup(),post=f.posts[0];post.args.onFailure('Privater Antworttext',{getResponseCode:()=>400,getURLString:()=>post.url});
 const warnings=f.h.logs.filter(row=>row.level==='warn');assert.equal(warnings.length,1);
 assert.match(warnings[0].message,/Verbindungsabgleich/);assert.equal(f.h.runtime.androidLastFailure().stage,'http_response');
 assert.equal(f.h.runtime.androidLastFailure().httpStatus,400);assert.doesNotMatch(JSON.stringify(f.h.logs),/Privater Antworttext|Speicher- oder UI/);
 assert.equal(f.h.runtime.receivedShow().active,false);
});

test('HTTP-, JSON-, Vertrags- und fehlende Projektionsfelder bleiben privat unterscheidbar',()=>{
 for(const [kind,expected] of [['http','http_status'],['json','response_json'],['version','contract_version'],['fields','response_projection']]){
  const f=setup(),post=f.posts[0];let raw=JSON.stringify(f.response());
  if(kind==='json')raw='Nicht lesbar: private Daten';
  if(kind==='version')raw=JSON.stringify({accepted:true,serverTime:f.h.now(),wishes:[]});
  if(kind==='fields')raw=JSON.stringify(f.response({station:undefined}));
  post.args.onSuccess(raw,{getResponseCode:()=>kind==='http'?503:200,getURLString:()=>post.url});
  assert.equal(f.h.runtime.androidLastFailure().stage,expected,kind);assert.equal(f.h.logs.filter(row=>row.level==='warn').length,1,kind);
  assert.equal(f.h.runtime.receivedShow().active,false);assert.doesNotMatch(JSON.stringify(f.h.logs),/private Daten/);
 }
});

test('Gültiger V2-Legacy-Übergangsstand wird ohne Live-Freigabe und ohne Warnung angenommen',()=>{
 const f=setup(),reply=f.response();reply.station={...reply.station,authority:'legacy',broadcastState:'unknown',onAir:false,wishboxOpen:false,topic:null,moderatorNick:null,validUntil:0,updatedAt:0};
 f.finish(undefined,reply);assert.equal(f.h.runtime.androidRelayHealthy(),true);assert.equal(f.h.runtime.receivedShow().active,false);
 assert.equal(f.h.logs.filter(row=>row.level==='warn').length,0);assert.equal(f.h.runtime.receivedProtocol().authority,'legacy');
});

test('Antwortadresse, Größenlimit und gespeicherte Altwerte sind getrennte Gegenfälle',()=>{
 for(const [kind,expected] of [['url','response_url'],['size','response_size']]){
  const f=setup(),post=f.posts[0];post.args.onSuccess(kind==='size'?'x'.repeat(32769):JSON.stringify(f.response()),{getResponseCode:()=>200,getURLString:()=>kind==='url'?post.url+'?abweichend':post.url});
  assert.equal(f.h.runtime.androidLastFailure().stage,expected);assert.equal(f.h.runtime.androidLastFailure().httpStatus,200);assert.equal(f.h.logs.filter(row=>row.level==='warn').length,1);
 }
 const {persistence}=require('../support/knuddels.cjs'),f=setup({store:persistence({'mischwerk.state.v1':{version:1,revision:0,requests:[],nextId:1,moderator:{userId:7,nick:'Alter DJ'},topic:'Altes Thema',requestsEnabled:true,nativeDisplay:{teamSignsEnabled:false}}})});
 require('../fixtures/legacy-wishes.cjs').seed(f.h,[{text:'Unverändertes Original'}]);f.finish();
 assert.equal(f.h.runtime.receivedShow().nick,'DJ-Test');assert.equal(f.h.runtime.displaySettings().teamSignsEnabled,false);
 assert.equal(f.h.runtime.displaySettings().microphoneEnabled,true);assert.equal(f.h.runtime.displaySettings().headphonesEnabled,true);
 assert.equal(f.h.runtime.loadWishes().items[0].text,'Unverändertes Original');assert.equal(f.h.logs.filter(row=>row.level==='warn').length,0);
});

test('Alte Displayanfragen lassen neue Iconoptionen unverändert; fehlerhafte Typen und Wiederholungen mutieren nichts',()=>{
 const f=setup(),h=f.h,owner=h.user(2,'Otterchen','owner');h.open(owner);h.app.chatCommands.mw(owner,'admin');const ts=owner.sessions.find(s=>s.activeView==='team');
 const send=data=>last(h.event(owner,ts,'mw:display.save',{view:'team',viewRevision:1,announcementsEnabled:true,teamSignsEnabled:true,...data}),'mw:result');
 assert.equal(send({requestId:'new',expectedRevision:0,microphoneEnabled:false,headphonesEnabled:false}).ok,true);
 assert.equal(send({requestId:'old',expectedRevision:1,teamSignsEnabled:false}).ok,true);assert.equal(h.runtime.displaySettings().microphoneEnabled,false);assert.equal(h.runtime.displaySettings().headphonesEnabled,false);
 const before=JSON.stringify(h.store.data);assert.equal(send({requestId:'bad',expectedRevision:2,microphoneEnabled:'true'}).ok,false);assert.equal(JSON.stringify(h.store.data),before);
 assert.equal(send({requestId:'old',expectedRevision:1,teamSignsEnabled:false}).ok,true);assert.equal(JSON.stringify(h.store.data),before);
});

test('Gespeicherte erlaubte Altziele bleiben unverändert und werden privat ohne Rohadresse unterschieden',()=>{
 const {createHarness,persistence}=require('../support/knuddels.cjs');
 for(const [url,kind] of [['https://europe-west3-radio-mischwerk.cloudfunctions.net/publishKnuddelsState','cloud-functions'],['https://synthetic-endpoint.a.run.app','cloud-run']]){
  const posts=[],store=persistence({'mischwerk.android.private.v1':{enabled:true,runtimeVerified:true,syncSecret:'s'.repeat(64),syncUrl:url,revision:7}});
  const h=createHarness(store,{serverMethods:{getExternalServerAccess:()=>({canAccessURL:()=>true,postURL:(target,args)=>posts.push({target,args})})}});
  assert.equal(posts.length,1);assert.equal(posts[0].target,url);assert.equal(store.data['mischwerk.android.private.v1'].syncUrl,url);
  const user=h.user(4,'Polaroid');h.open(user);h.app.chatCommands.mw(user,'admin');const team=user.sessions.find(s=>s.activeView==='team');h.event(user,team,'mw:androidSettings.status',{});
  const state=team.events.at(-1).data.state;assert.equal(state.targetKind,kind);assert.doesNotMatch(JSON.stringify(state),/synthetic-endpoint|ssssssss/);
 }
});

for(const team of [false,true])for(const microphone of [false,true])for(const headphones of [false,true])test('Iconschalter unabhängig: Team '+team+', Mikrofon '+microphone+', Kopfhörer '+headphones,()=>{
 const f=setup(),h=f.h,owner=h.user(2,'Otterchen','owner'),dj=h.user(3,'DJ-Test'),listener=h.user(4,'Hörer');h.open(owner);const ds=h.open(dj),ls=h.open(listener);f.finish();
 h.event(dj,ds,'mw:listenerPresence',{active:true,sequence:1});h.event(listener,ls,'mw:listenerPresence',{active:true,sequence:1});
 h.app.chatCommands.mw(owner,'admin');const ts=owner.sessions.find(s=>s.activeView==='team');
 assert.equal(last(h.event(owner,ts,'mw:display.save',{view:'team',viewRevision:1,requestId:'icons',expectedRevision:0,teamSignsEnabled:team,microphoneEnabled:microphone,headphonesEnabled:headphones,announcementsEnabled:true}),'mw:result').ok,true);
 const paths=user=>[...user.nicklistIcons.keys()].map(value=>value.split('/').at(-1)).sort();
 assert.deepEqual(paths(dj),[...(team?['team.png']:[]),...(microphone?['moderator.png']:headphones?['listener.png']:[])].sort());
 assert.deepEqual(paths(listener),headphones?['listener.png']:[]);
});
test('V2 nutzt vier Strings, bekannte URL und unveränderte HMAC-v1-Hülle; keine privaten Studiofelder',()=>{
 const f=setup();assert.equal(f.posts.length,1);const p=f.posts[0],d=p.args.data;
 assert.deepEqual(Object.keys(d).sort(),['nonce','payload','sig','ts']);assert.ok(Object.values(d).every(v=>typeof v==='string'));
 assert.equal(d.sig,crypto.createHmac('sha256',f.secret).update('v1.'+d.ts+'.'+d.nonce+'.'+d.payload).digest('hex'));
 assert.equal(p.body.contractVersion,2);assert.ok(!('station'in p.body));assert.doesNotMatch(d.payload,/authorityEpoch|sessionId|uid|studioWishControl/);
 f.finish();assert.equal(f.h.runtime.receivedShow().active,true);
});
test('Nur zentrale Sendung öffnet Wünsche; alle Rollen einschließlich Inhaber ohne Moderationstaste oder Altmutation',()=>{
 const f=setup(),h=f.h,u=h.user(2,'Otterchen','owner'),s=h.open(u);let state=h.state(u,s);assert.equal(state.requestsEnabled,false);
 f.finish();state=h.state(u,s);assert.equal(state.requestsEnabled,true);assert.equal(state.topic,'Abendmusik');assert.equal(state.user.canModerate,false);
 const before=JSON.stringify(h.store.data);
 for(const type of ['mw:onAir','mw:offAir','mw:setTopic','mw:setRequests','mw:handover.accept','mw:openStudio','mw:addRadioModerator','mw:removeRadioModerator','mw:queue.read','mw:ackRequest','mw:setWishStage','mw:resolveRequest','mw:pin.login']){
  assert.equal(last(h.event(u,s,type,{requestId:'old',enabled:true,topic:'Falsch'}),'mw:result').ok,false,type);
  assert.equal(JSON.stringify(h.store.data),before,type);
 }
 assert.equal(h.app.chatCommands.lauftext,undefined);assert.equal(h.app.chatCommands.settopic instanceof Function,false); // Funktion stammt aus VM.
});
test('45-Sekunden-Frist wird weder durch Channelrefresh noch HTTP-Fehler verlängert; kein Ende, Audio unabhängig',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();const messages=h.bot.messages.length;
 h.advance(44000);assert.equal(h.state(u,s).requestsEnabled,true);h.advance(1000);const state=h.state(u,s);
 assert.equal(state.requestsEnabled,false);assert.equal(state.moderator,null);assert.equal(state.topic,'');assert.equal(h.bot.messages.length,messages);
 h.app.onUserLeft(u);assert.equal(h.runtime.receivedShow().active,false);
});
test('Native Outbox bleibt pending bis Einzelbeleg; gleicher Wunsch nach Verlust/Neustart nur einmal',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();
 let receipt=last(h.event(u,s,'mw:wish.submit',{submissionId:'wish-one',text:'Band – Lied'}),'mw:wish.receipt');assert.equal(receipt.pending,true);assert.equal(receipt.accepted,false);
 const sent=f.posts.at(-1),row=sent.body.wishSubmissions[0];assert.equal(row.displayName,'Hörer');assert.match(row.ownerKey,/^[a-f0-9]{64}$/);
 assert.equal(row.ownerKey,crypto.createHmac('sha256',f.secret).update('mw-owner-v2:'+sent.body.transportId+':3').digest('hex'));
 f.finish(sent,{wishReceipts:[{submissionId:row.submissionId,accepted:true,state:'queued',position:12,error:null}]});
 receipt=last(s.events,'mw:wish.receipt');assert.equal(receipt.accepted,true);assert.equal(h.state(u,s).wishPositions.nextPosition,12);
 h.event(u,s,'mw:wish.submit',{submissionId:'wish-one',text:'Band – Lied'});assert.equal(h.runtime.nativeRelayState().entries.length,1);
 const again=setup({store:h.store});assert.equal(again.h.runtime.nativeRelayState().entries[0].submissionId,row.submissionId);
});
test('Fremde Statuskennung und alte HTTP-Generation verändern keine eigenen Quittungen',()=>{
 const f=setup();f.finish(undefined,{ownWishStatuses:[{submissionId:'knuddels:foreign',state:'playing',position:1,wishRevision:1}]});
 assert.equal(f.h.runtime.nativeRelayState().entries.length,0);assert.equal(f.h.runtime.receivedShow().active,false);
 const old=f.posts[0];f.h.runtime.stopAndroidRelay();f.finish(old);assert.equal(f.h.runtime.receivedShow().active,false);
});
test('Teamzeichen-Schalter beeinflusst weder bestätigtes DJ-Mikrofon noch Hörerstatus; echte Nicks, kein Inhaberbonus',()=>{
 const f=setup(),h=f.h,dj=h.user(4,'DJ-Test'),owner=h.user(2,'Otterchen','owner');h.open(dj);const os=h.open(owner);f.finish();h.runtime.joinNicklist(dj);h.runtime.joinNicklist(owner);
 assert.deepEqual([...dj.nicklistIcons.keys()].map(v=>v.split('/').at(-1)).sort(),['moderator.png','team.png']);assert.equal(owner.nicklistIcons.size,0);
 h.app.chatCommands.mw(owner,'admin');const ts=owner.sessions.find(s=>s.activeView==='team');
 assert.equal(last(h.event(owner,ts,'mw:display.save',{view:'team',viewRevision:1,requestId:'display1',expectedRevision:0,teamSignsEnabled:false,announcementsEnabled:true}),'mw:result').ok,true);
 assert.deepEqual([...dj.nicklistIcons.keys()].map(v=>v.split('/').at(-1)),['moderator.png']);
});
test('Explizite Ereignisse erst nach stiller Basis und dauerhaft vor Botversuch markieren; Neustart/Wiederholung still',()=>{
 const f=setup(),h=f.h;f.finish();h.advance(5000);
 const event={eventId:'event-a',eventSeq:1,type:'start',createdAt:h.now(),moderatorNick:'DJ-Test',previousModeratorNick:null,topic:''};
 f.finish(undefined,{broadcastEvents:[event],eventCursor:'events-a'});assert.equal(h.bot.messages.length,1);
 h.advance(5000);f.finish(undefined,{broadcastEvents:[event],eventCursor:'events-a'});assert.equal(h.bot.messages.length,1);
 const restored=setup({store:h.store});restored.finish(undefined,{broadcastEvents:[event],eventCursor:'events-a'});assert.equal(restored.h.bot.messages.length,0);
});

test('Begrenzte zentrale Löschung bleibt bei applied:false vorgemerkt und blockiert keinen gültigen Senderempfang',()=>{
 const f=setup(),h=f.h;f.finish();h.runtime.queueNativeOwnerDeletion(3);h.advance(5000);const request=f.posts.at(-1),id=request.body.ownerDeletions[0].requestId;
 f.finish(request,{deletionReceipts:[{requestId:id,applied:false}]});assert.equal(h.runtime.nativeRelayState().deletions[0].applied,false);assert.equal(h.runtime.receivedShow().active,true);
 h.advance(5000);const repeated=f.posts.at(-1);assert.equal(repeated.body.ownerDeletions[0].requestId,id);f.finish(repeated,{deletionReceipts:[{requestId:id,applied:true}]});assert.equal(h.runtime.nativeRelayState().deletions[0].applied,true);
});

test('Nicklisten-Seiten werden vollständig zusammengesetzt; eigener Cursorreset verwirft alte Teilseiten',()=>{
 const f=setup(),h=f.h,now=h.now(),page={snapshotId:'large-roster',revision:'a'.repeat(64),snapshotAt:now,validUntil:now+45000,items:[{nick:'Erster'}],nextCursor:'page-two',complete:false};
 f.finish(undefined,{nickAccessPage:page});assert.equal(h.runtime.receivedRoster().length,0);h.advance(5000);
 f.finish(undefined,{nickAccessPage:{...page,items:[{nick:'Zweiter'}],nextCursor:null,complete:true},cursorReset:true});assert.deepEqual(Array.from(h.runtime.receivedRoster()),['Erster','Zweiter'],'Eventcursorreset darf keine Nicklistenteilseite verlieren');
 h.advance(5000);f.finish(undefined,{nickAccessPage:{...page,snapshotId:'next-roster',items:[{nick:'Alter Teil'}],nextCursor:'expired-page'}});h.advance(5000);
 f.finish(undefined,{nickAccessPage:{...page,snapshotId:'fresh-roster',revision:'b'.repeat(64),snapshotAt:h.now(),validUntil:h.now()+45000,items:[{nick:'Aktuell'}],nextCursor:null,complete:true,cursorReset:true}});
 assert.deepEqual(Array.from(h.runtime.receivedRoster()),['Aktuell']);
});

test('Öffnen und Statuslesen ohne eingerichteten Transport erzeugen keinen versteckten Queuecommit',()=>{
 const {createHarness}=require('../support/knuddels.cjs'),h=createHarness(),u=h.user(2,'Otterchen','owner'),before=JSON.stringify(h.store.data),session=h.open(u);h.state(u,session);h.app.chatCommands.mw(u,'admin');
 assert.equal(JSON.stringify(h.store.data),before);assert.equal(h.runtime.migrationView().phase,'idle');
});

// Interne Fachcontroller direkt prüfen; /mw verbindung ist kein Chat-Einstieg mehr.
const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const key='mischwerk.android.private.v1',url='https://radio-mischwerk.web.app/api/publishKnuddelsState';
const initial=()=>({enabled:false,runtimeVerified:false,syncSecret:'s'.repeat(64),syncUrl:url,revision:0});
function fixture(options={}){
 const calls=[],store=persistence({[key]:{...initial(),...options.settings},...options.store});let hookCalls=0;
 const h=createHarness(store,{serverMethods:{getExternalServerAccess:()=>({canAccessURL:()=>options.allowed!==false,postURL:(target,p)=>calls.push({target,p})}),getWebHookAccess(){hookCalls++;throw Error('No WebHook permission');},...options.serverMethods}});
 const owner=h.user(1,'Otterchen','owner');h.runtime.androidRelayCommand(owner,'einrichten');const session=owner.sessions[0];let seq=0;
 return {h,store,owner,session,calls,get hookCalls(){return hookCalls;},call(action,change={},user=owner,from=session){h.event(user,from,'mw:androidSettings.'+action,{revision:store.data[key].revision,requestId:'operation-'+(++seq),...change});return session.events.at(-1)?.data;},status(){h.event(owner,session,'mw:androidSettings.status',{});return session.events.at(-1)?.data;},complete(index=0,status=200,wishes=[]){const c=calls[index];c.p[status===200?'onSuccess':'onFailure'](JSON.stringify({accepted:status===200,serverTime:h.now(),wishes}),{getResponseCode:()=>status,getURLString:()=>url});}};
}
test('Geschützte Aktivierung benötigt ausschließlich vorhandenen Sync-Schlüssel und keinen WebHook',()=>{
 for(const relaySecret of [undefined,'','short','s'.repeat(64)]){const f=fixture({settings:{relaySecret}}),result=f.call('activate');assert.equal(result.ok,true);assert.equal(f.calls.length,1);assert.equal(f.hookCalls,0);assert.equal(f.store.data[key].enabled,true);assert.equal(f.store.data[key].runtimeVerified,true);f.complete();assert.equal(f.status().state.operation.firstAcceptedPost.accepted,true);}
});
test('Fehlender Sync-Schlüssel, Domainrechte und falsches Ziel öffnen keine Startsperre',()=>{
 for(const options of [{settings:{syncSecret:''}},{settings:{syncSecret:'short'}},{settings:{syncUrl:'https://evil.invalid'}},{allowed:false},{serverMethods:{getExternalServerAccess:undefined}}]){const f=fixture(options);assert.equal(f.call('activate').ok,false);assert.equal(f.store.data[key].enabled,false);assert.equal(f.calls.length,0);assert.equal(f.hookCalls,0);}
});
test('Verbindungseinstellungen in der Verwaltung erhalten aktiven Publisher, Schlüssel und Freigaben',()=>{
 const f=fixture();f.call('activate');f.complete();const saved=JSON.stringify(f.store.data[key]);
 f.h.app.chatCommands.mw(f.owner,'admin');
 const team=f.owner.sessions.find(s=>s.content.htmlFile.pageData.view==='team');assert.ok(team);
 const status=f.h.event(f.owner,team,'mw:androidSettings.status',{}).at(-1);
 assert.equal(status?.type,'mw:androidSettings.status');assert.equal(status.data.ok,true);
 assert.equal(status.data.state.operation.publisherActive,true);assert.equal(status.data.state.hasSyncSecret,true);
 assert.equal(JSON.stringify(f.store.data[key]),saved);assert.equal(f.calls.length,1);
 team.nativeClose(false);f.h.app.chatCommands.mw(f.owner,'admin');
 const reopened=f.owner.sessions.find(s=>s.content.htmlFile.pageData.view==='team');
 f.h.event(f.owner,reopened,'mw:androidSettings.status',{});
 assert.equal(JSON.stringify(f.store.data[key]),saved);assert.equal(f.calls.length,1);
 f.h.advance(20000);assert.equal(f.calls.length,2,'Derselbe Heartbeat läuft nach dem Öffnen und Wiederöffnen weiter');f.complete(1);
 assert.doesNotMatch(JSON.stringify(team.events),/ssssssss|rrrrrrrr/);
});

test('Entfernter Verbindungsbefehl verändert auch einen laufenden Publisher nicht',()=>{
 const f=fixture();f.call('activate');f.complete();const saved=JSON.stringify(f.store.data[key]),timers=[...f.h.timers.keys()];
 for(const option of ['', 'hilfe', 'einrichten', 'status', 'pruefen', 'http-pruefen', 'auth-pruefen']){
  f.h.app.chatCommands.mw(f.owner,'verbindung '+option);
  assert.match(f.owner.messages.at(-1),/Diesen Aufruf gibt es nicht/);
  assert.equal(JSON.stringify(f.store.data[key]),saved);assert.equal(f.calls.length,1);
  assert.deepEqual([...f.h.timers.keys()],timers);assert.equal(f.owner.sessions.length,1);
 }
 assert.equal(f.status().state.operation.publisherActive,true);
 f.h.advance(20000);assert.equal(f.calls.length,2);f.complete(1);
 assert.equal(JSON.stringify(f.store.data[key]),saved);
});

test('Aktivierung bleibt idempotent; Ausschalten beendet genau den vorhandenen Heartbeat',()=>{
 const f=fixture();assert.equal(f.call('activate').ok,true);f.complete();assert.equal(f.call('activate').ok,true);assert.equal(f.calls.length,1);assert.equal(f.store.data[key].revision,1);
 f.h.advance(20000);assert.equal(f.calls.length,2);f.complete(1);assert.ok(JSON.parse(f.calls[1].p.data.payload).station.updatedAt>JSON.parse(f.calls[0].p.data.payload).station.updatedAt);
 assert.equal(f.call('deactivate').ok,true);assert.equal(f.store.data[key].enabled,false);assert.equal(f.store.data[key].runtimeVerified,false);f.h.advance(60000);assert.equal(f.calls.length,2);
});
test('Inhaber, Anwesenheit, Sitzung, Revision, Schema und Wiederholung werden erneut geprüft',()=>{
 for(const action of ['activate','deactivate'])for(const mode of ['role','online','foreign','revision','schema','closed','shutdown']){const f=fixture();let data={},from=f.session;if(mode==='role')f.owner.role='manager';if(mode==='online')f.owner.online=false;if(mode==='foreign')from={};if(mode==='revision')data.revision=7;if(mode==='schema')data.enabled=true;if(mode==='closed')f.session.nativeClose(false);if(mode==='shutdown')f.h.app.onPrepareShutdown();f.call(action,data,f.owner,from);assert.equal(f.store.data[key].enabled,false);assert.equal(f.calls.length,0);assert.equal(f.hookCalls,0);}
 const f=fixture();assert.equal(f.call('activate',{requestId:'repeat'}).ok,true);assert.equal(f.call('deactivate',{requestId:'repeat'}).ok,false);assert.equal(f.store.data[key].enabled,true);
});
test('Speicher- und Startfehler rollen Freigabe zurück und geben keine privaten Details aus',()=>{
 const f=fixture();f.store.setObject=()=>{throw Error(initial().syncSecret+' private-storage');};assert.equal(f.call('activate').ok,false);assert.equal(f.calls.length,0);assert.doesNotMatch(JSON.stringify(f.session.events),/ssssssss|private-storage/);
 const g=fixture({store:{'mischwerk.android.receipts.v1':{version:99,entries:[]}}});assert.equal(g.call('activate').ok,false);assert.equal(g.store.data[key].enabled,false);assert.equal(g.store.data[key].runtimeVerified,false);assert.equal(g.calls.length,0);
});
test('Status unterscheidet laufenden Publisher, abgewiesenen POST und echte Annahme',()=>{
 const f=fixture();f.call('activate');f.complete(0,401);let state=f.status().state.operation;assert.equal(state.publisherActive,true);assert.equal(state.firstAcceptedPost,null);assert.equal(state.lastPost.status,401);assert.equal(state.lastPost.accepted,false);
 f.h.advance(20000);f.complete(1);state=f.status().state.operation;assert.equal(state.transport,'status-response-v1');assert.equal(state.firstAcceptedPost.wishesReceived,0);assert.equal(state.lastPost.accepted,true);
});
test('Speichern mit leerem Sync-Feld erhält Schlüssel, beendet Betrieb und lässt altes Relay-Secret unangetastet',()=>{
 const f=fixture({settings:{relaySecret:'r'.repeat(64)}});f.call('activate');f.complete();assert.equal(f.call('save',{syncSecret:''}).ok,true);assert.equal(f.store.data[key].syncSecret,initial().syncSecret);assert.equal(f.store.data[key].relaySecret,'r'.repeat(64));assert.equal(f.store.data[key].enabled,false);f.h.advance(60000);assert.equal(f.calls.length,1);
});
test('Alte prepare-Aktion ist entfernt und kann keine Registrierung oder Freigabe auslösen',()=>{
 const f=fixture(),before=f.session.events.length;f.call('prepare');assert.equal(f.session.events.length,before);assert.equal(f.hookCalls,0);assert.equal(f.calls.length,0);assert.equal(f.store.data[key].enabled,false);
});
test('Privater Betriebsbericht enthält nur technische Zähler und ersten regulären POST',()=>{
 const f=fixture();f.call('activate');f.complete(0,200,[{submissionId:'opaque-one',text:'Privater Wunsch',displayName:'Privater Name'}]);f.h.runtime.androidRelayCommand(f.owner,'status');const message=JSON.stringify(f.owner.messages);assert.match(message,/queueReturn/);assert.match(message,/wishesReceived/);assert.match(message,/status-response-v1/);assert.doesNotMatch(message,/ssssssss|rrrrrrrr|Privater Wunsch|Privater Name|opaque-one|nonce|payload|\bsig\b/);
 for(const role of ['listener','manager','developer','moderator']){const p=f.h.user(10+role.length,role,role);f.h.runtime.androidRelayCommand(p,'status');assert.equal(p.messages.length,0);}
});

const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const key='mischwerk.android.private.v1',url='https://radio-mischwerk.web.app/api/publishKnuddelsState',hook='https://hooks.example.invalid/private/android-wishes';
const initial=()=>({enabled:false,runtimeVerified:false,syncSecret:'s'.repeat(64),relaySecret:'r'.repeat(64),syncUrl:url,revision:0});
function fixture(options={}){
 const hooks=new Map(),calls=[],removed=[],store=persistence({[key]:{...initial(),...options.settings}});
 const external={canAccessURL:()=>options.allowed!==false,postURL(target,p){calls.push({target,p});if(options.throwPost)throw Error('private-network-detail');}};
 const h=createHarness(store,{serverMethods:{getExternalServerAccess:()=>external,getWebHookAccess:()=>({registerWebHook(k,fn){if(options.registerError)throw options.registerError;if(options.registerThrows)throw Error('private-registration-detail '+hook);hooks.set(k,fn);return options.returnUndefined?undefined:options.hook===undefined?hook:options.hook;},...(options.lookupUrl!==undefined?{getWebHookUrl(){return options.lookupUrl;}}:{}),unregisterWebHook(k){removed.push(k);hooks.delete(k);}}),...options.serverMethods}});
 const owner=h.user(1,'Otterchen','owner');h.app.chatCommands['mischwerk-relay'](owner,'einrichten');const session=owner.sessions[0];let seq=0;
 return {h,store,owner,session,hooks,calls,removed,call(action,change={},user=owner,from=session){h.event(user,from,'mw:androidSettings.'+action,{revision:store.data[key].revision,requestId:'operation-'+(++seq),...change});return session.events.at(-1)?.data;},status(){h.event(owner,session,'mw:androidSettings.status',{});return session.events.at(-1)?.data;},complete(index=0,status=200,accepted=true){const p=calls[index].p;p[status===200?'onSuccess':'onFailure'](JSON.stringify({accepted,serverTime:h.now()}),{getResponseCode:()=>status,getURLString:()=>url});}};
}
test('WebHook wird nur ausdrücklich vorbereitet; vollständige Adresse bleibt in privater Sitzungsantwort',()=>{
 const f=fixture();assert.equal(f.hooks.size,0);assert.equal(f.calls.length,0);
 const result=f.call('prepare');assert.equal(result.ok,true);assert.equal(result.webhookUrl,hook+'/v1/wishes');assert.equal(f.hooks.size,1);assert.equal(f.calls.length,0);
 assert.equal(f.store.data[key].enabled,false);assert.equal(f.store.data[key].runtimeVerified,false);
 const state=f.status();assert.equal(state.state.operation.webhookRegistered,true);assert.doesNotMatch(JSON.stringify(state),/hooks.example/);
 assert.doesNotMatch(JSON.stringify([f.h.logs,f.owner.messages,f.h.bot.messages]),/hooks.example|ssssssss|rrrrrrrr/);
});
test('Geschützte Aktivierung startet regulären signierten Publisher und 20-Sekunden-Heartbeat',()=>{
 const f=fixture();const result=f.call('activate');assert.equal(result.ok,true);assert.equal(f.calls.length,1);
 assert.equal(f.store.data[key].enabled,true);assert.equal(f.store.data[key].runtimeVerified,true);assert.equal(f.store.data[key].revision,1);
 assert.equal(result.state.operation.publisherActive,true);assert.equal(result.state.operation.firstAcceptedPost,null);
 f.complete();let state=f.status().state.operation;assert.equal(state.firstAcceptedPost.status,200);assert.equal(state.firstAcceptedPost.accepted,true);
 assert.equal(Object.keys(f.calls[0].p.data).sort().join(','),'nonce,payload,sig,ts');assert.equal(f.calls[0].p.header,undefined);
 const first=JSON.parse(f.calls[0].p.data.payload).station.updatedAt;f.h.advance(20000);assert.equal(f.calls.length,2);
 assert.ok(JSON.parse(f.calls[1].p.data.payload).station.updatedAt>first);f.complete(1);
 assert.doesNotMatch(JSON.stringify(f.status()),/ssssssss|rrrrrrrr|hooks.example|"sig"|"nonce"/);
});
test('Aktivierung ist idempotent und deaktivierter Betrieb schreibt keine weiteren Projektionen',()=>{
 const f=fixture();f.call('prepare');f.call('activate');f.complete();assert.equal(f.call('activate').ok,true);assert.equal(f.calls.length,1);assert.equal(f.store.data[key].revision,1);
 assert.equal(f.call('deactivate').ok,true);assert.equal(f.hooks.size,0);assert.equal(f.store.data[key].enabled,false);assert.equal(f.store.data[key].runtimeVerified,false);
 f.h.advance(60000);assert.equal(f.calls.length,1);assert.equal(f.status().state.operation.publisherActive,false);
});
test('Fehlende Schlüssel, Domainrechte oder HTTPS-Registrierungsadresse öffnen keine Startsperre',()=>{
 for(const options of [{settings:{relaySecret:''}},{settings:{relaySecret:'s'.repeat(64)}},{settings:{syncSecret:''}},{allowed:false},{hook:null},{hook:'http://hooks.example.invalid/private'},{hook:'https://hooks.example.invalid/private#fragment'}]){
  const f=fixture(options);assert.equal(f.call('activate').ok,false);assert.equal(f.store.data[key].enabled,false);assert.equal(f.calls.length,0);assert.equal(f.hooks.size,0);
 }
});
test('Dokumentierte URL-Abfrage übernimmt echte HTTPS-Adresse bei leerer Registrierungsrückgabe',()=>{
 const f=fixture({returnUndefined:true,lookupUrl:hook});const result=f.call('prepare');assert.equal(result.ok,true);assert.equal(result.webhookUrl,hook+'/v1/wishes');assert.equal(f.calls.length,0);assert.equal(f.store.data[key].enabled,false);
});
test('Notwendige native Routingquery bleibt erhalten; fremde Queryparameter werden abgewiesen',()=>{
 const query='native-route=synthetic',f=fixture({hook:hook+'?'+query});const result=f.call('prepare');assert.equal(result.ok,true);assert.equal(result.webhookUrl,hook+'/v1/wishes?'+query);
 function request(q){let status;f.hooks.get('android-wishes')({getMethod:()=> 'POST',getPath:()=>'/v1/wishes',getQueryString:()=>q,getHeaders:()=>({authorization:['Bearer '+initial().relaySecret],'content-type':['application/json']}),getBody:()=>JSON.stringify({action:'submitWish',submissionId:'synthetic',displayName:null,text:'Band Song'})},{send(s){status=s;}});return status;}
 assert.equal(request(query),409);assert.equal(request(''),409);assert.equal(request(query+'&extra=bad'),400);
});
test('Fehlgeschlagene native Registrierung benennt nur sicheren Fehlerabschnitt und bleibt geschlossen',()=>{
 for(const [options,stage] of [[{registerThrows:true},'register-call'],[{hook:null},'url-result'],[{hook:'http://hooks.example.invalid/private'},'url-result']]){
  const f=fixture(options),result=f.call('prepare');assert.equal(result.ok,false);const status=f.status();assert.equal(status.state.operation.webhookRegistration.failedStage,stage);assert.equal(status.state.operation.webhookRegistered,false);
  assert.doesNotMatch(JSON.stringify([result,status,f.h.logs]),/private-registration-detail|hooks.example|ssssssss|rrrrrrrr/);assert.equal(f.calls.length,0);assert.equal(f.store.data[key].enabled,false);
 }
});
test('Originaler Dienstfehler bleibt erkennbar, Geheimnisse/URLs/Stacktraces werden vor Ausgabe entfernt',()=>{
 const secrets=initial(),token='x'.repeat(64),error=new Error('WebHooks are disabled for this app. '+secrets.syncSecret+' '+secrets.relaySecret+' https://hooks.example.invalid/private?q=secret '+token+' 192.0.2.7');error.name='JavaException';error.stack='NEVER-EMIT-THIS-STACK';
 const f=fixture({registerError:error}),result=f.call('prepare'),status=f.status();assert.equal(result.ok,false);
 assert.match(result.message,/WebHooks are disabled for this app/);assert.equal(status.state.operation.webhookRegistration.error.name,'JavaException');
 assert.doesNotMatch(JSON.stringify([result,status,f.h.logs]),new RegExp([secrets.syncSecret,secrets.relaySecret,token,'hooks.example','192\\.0\\.2\\.7','NEVER-EMIT-THIS-STACK'].join('|')));
 assert.equal(f.store.data[key].enabled,false);assert.equal(f.calls.length,0);
});
test('Nicht lesbare oder überlange Fehlerwerte bleiben begrenzt ohne interne Ersatzdaten',()=>{
 for(const error of [{get message(){throw Error('private-detail');}},new Error('z'.repeat(5000))]){
  const f=fixture({registerError:error}),result=f.call('prepare');assert.equal(result.ok,false);assert.ok(result.message.length<500);assert.doesNotMatch(JSON.stringify(result),/private-detail|zzzzzzzz/);
 }
});
test('Operationen prüfen Inhaber, Sitzung, Revision, Schema, Wiederholung und Shutdown',()=>{
 for(const action of ['prepare','activate','deactivate']){
  for(const mode of ['role','online','foreign','revision','schema','closed','shutdown']){
   const f=fixture();let data={},from=f.session;if(mode==='role')f.owner.role='manager';if(mode==='online')f.owner.online=false;if(mode==='foreign')from={};if(mode==='revision')data.revision=7;if(mode==='schema')data.enabled=true;if(mode==='closed')f.session.nativeClose(false);if(mode==='shutdown')f.h.app.onPrepareShutdown();
   f.call(action,data,f.owner,from);assert.equal(f.store.data[key].enabled,false);assert.equal(f.calls.length,0);assert.equal(f.hooks.size,0);
  }
 }
 const f=fixture();assert.equal(f.call('activate',{requestId:'repeat'}).ok,true);assert.equal(f.call('deactivate',{requestId:'repeat'}).ok,false);assert.equal(f.store.data[key].enabled,true);
});
test('Speicher- und Startfehler bleiben geschlossen, bereinigen Hook und zeigen keine Geheimnisse',()=>{
 const f=fixture();f.store.setObject=()=>{throw Error(initial().syncSecret+' '+hook);};assert.equal(f.call('activate').ok,false);assert.equal(f.calls.length,0);assert.equal(f.hooks.size,0);
 assert.doesNotMatch(JSON.stringify(f.session.events),/ssssssss|rrrrrrrr|hooks.example/);
 const g=fixture({serverMethods:{getExternalServerAccess:undefined}});assert.equal(g.call('activate').ok,false);assert.equal(g.store.data[key].enabled,false);assert.equal(g.hooks.size,0);
});
test('Status unterscheidet laufenden Publisher von angenommenen und abgewiesenen Antworten',()=>{
 const f=fixture();f.call('activate');f.complete(0,401,false);let state=f.status().state.operation;
 assert.equal(state.publisherActive,true);assert.equal(state.firstAcceptedPost,null);assert.equal(state.lastPost.status,401);assert.equal(state.lastPost.accepted,false);
 f.h.advance(20000);f.complete(1);state=f.status().state.operation;assert.equal(state.firstAcceptedPost.status,200);assert.equal(state.lastPost.accepted,true);
});
test('Neues Speichern beendet regulären Betrieb und behält leere vorhandene Schlüssel',()=>{
 const f=fixture();f.call('activate');f.complete();const result=f.call('save',{syncSecret:'',relaySecret:''});assert.equal(result.ok,true);assert.equal(f.store.data[key].enabled,false);assert.equal(f.store.data[key].runtimeVerified,false);assert.equal(f.hooks.size,0);assert.equal(f.store.data[key].syncSecret,initial().syncSecret);
 f.h.advance(60000);assert.equal(f.calls.length,1);
});
test('Privater Betriebsbericht nennt tatsächliche Flags und ersten regulären Erfolg ohne Secrets oder Hook-URL',()=>{
 const f=fixture();f.call('activate');f.complete();f.h.app.chatCommands['mischwerk-relay'](f.owner,'status');
 const message=JSON.stringify(f.owner.messages);assert.match(message,/publisherActive/);assert.match(message,/firstRegularPost/);assert.match(message,/200/);
 assert.doesNotMatch(message,/ssssssss|rrrrrrrr|hooks.example|nonce|payload|\bsig\b/);
 for(const role of ['listener','manager','developer','moderator']){const person=f.h.user(10+role.length,role,role);f.h.app.chatCommands['mischwerk-relay'](person,'status');assert.equal(person.messages.length,0);}
});

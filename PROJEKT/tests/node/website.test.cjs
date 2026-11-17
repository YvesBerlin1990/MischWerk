const test=require('node:test'),assert=require('node:assert/strict');const {createHarness,persistence}=require('../support/knuddels.cjs');const {TestWebHooks}=require('../support/webhooks.cjs');
test('Alter zusätzlicher Website-WebHook lehnt sämtliche POST-/PIN-/Regieaktionen ohne Datenmutation ab',()=>{
 const hooks=new TestWebHooks(),store=persistence({'mischwerk.website.enabled.v1':true});const h=createHarness(store,{serverMethods:{getWebHookAccess:()=>hooks.api()}}),before=JSON.stringify(store.data);
 for(const operation of ['login.begin','login.status','state','action','logout',null]){const result=hooks.invoke('website',{method:'POST',body:JSON.stringify({operation,type:'mw:onAir',pin:'0123'})});assert.equal(result.status,410);assert.equal(JSON.stringify(store.data),before);}
 assert.equal(h.runtime.websiteSession,undefined);assert.equal(h.runtime.prepareModerationPin,undefined);
});
test('Alter öffentlicher Leseanschluss veröffentlicht keine gespeicherte native Sendung oder privaten Daten',()=>{
 const hooks=new TestWebHooks(),h=createHarness(persistence({'mischwerk.website.enabled.v1':true}),{serverMethods:{getWebHookAccess:()=>hooks.api()}});
 h.runtime.state.topic='Altes Thema';h.runtime.state.moderator={nick:'Alte Moderation',userId:99};const response=hooks.invoke('website');assert.equal(response.status,200);assert.doesNotMatch(response.body,/Altes Thema|Alte Moderation|userId|moderatorPins/);
});

// Echte Backendfachaktionen über die dokumentierte HTTP-Callback-Signatur, ohne Netzwerk.
const test=require('node:test'),assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {createHarness,persistence}=require('../support/knuddels.cjs');
const {TestWebHooks}=require('../support/webhooks.cjs');
function setup(enabled=true,savedState,existingStore){const hooks=new TestWebHooks(),h=createHarness(existingStore||persistence({'mischwerk.website.enabled.v1':enabled,...(savedState?{'mischwerk.state.v1':savedState}:{})}),{serverMethods:{getWebHookAccess:()=>hooks.api()}});
 const owner=h.user(1,'Otterchen','owner'),dj=h.user(2,'DJ-Test'),listener=h.user(3,'Hörer'),radio=h.open(owner);
 h.event(owner,radio,'mw:setRequests',{enabled:true});
 function call(data,method='POST',query='',finish=true){let result=hooks.invoke('website',{method,query,body:JSON.stringify(data)});if(finish&&JSON.parse(result.body).pending===true&&data.operation==='action'){h.flushPin();result=hooks.invoke('website',{method,query,body:JSON.stringify(data)});}return{status:result.status,data:JSON.parse(result.body),raw:result.body};}
 function login(user){const token=randomBytes(32).toString('hex'),code=randomBytes(16).toString('hex');assert.equal(call({operation:'login.begin',token,code}).status,200);h.app.chatCommands.mw(user,'homepage ' + code);return token;}
 function state(token,view='studio',values={}){return call({operation:'state',token,view,...values});}
 function action(token,type,data={},requestId=randomBytes(12).toString('hex')){return call({operation:'action',token,type,data,requestId});}
 return{hooks,h,owner,dj,listener,radio,call,login,state,action};}

test('Websiteanschluss bleibt zunächst aus und nur der tatsächliche anwesende Besitzer kann ihn aktivieren',()=>{const f=setup(false);assert.equal(f.hooks.observers.size,0);f.h.app.chatCommands.mw(f.listener,'homepage ' + 'aktivieren');assert.equal(f.hooks.observers.size,0);f.owner.online=false;f.h.app.chatCommands.mw(f.owner,'homepage ' + 'aktivieren');assert.equal(f.hooks.observers.size,0);f.owner.online=true;f.h.app.chatCommands.mw(f.owner,'homepage ' + 'aktivieren');assert.equal(f.hooks.observers.size,1);assert.match(f.owner.messages.at(-1),/https:/);f.h.app.chatCommands.mw(f.owner,'homepage ' + 'deaktivieren');assert.equal(f.hooks.observers.size,0);});
test('Laufende Website-PIN antwortet sofort mit pending; Polling führt den Auftrag genau einmal aus',()=>{
 const f=setup(),token=f.login(f.owner),input={operation:'action',token,type:'mw:onAir',requestId:'pin-poll-contract-123',data:{pin:'0123',pinConfirmation:'0123',expectedModerator:null}};
 for(let i=0;i<3;i++){const response=f.call(input,'POST','',false);assert.equal(response.status,200);assert.equal(response.data.pending,true);}
 assert.equal(f.h.bot.messages.length,0);assert.equal(f.h.store.data['mischwerk.state.v1'].moderator,null);
 assert.doesNotMatch(JSON.stringify(f.h.store.data),/0123/);
 assert.equal(f.call({...input,data:{...input.data,expectedModerator:'anderer-Auftrag'}},'POST','',false).status,400);
 f.h.flushPin();const done=f.call(input,'POST','',false);assert.equal(done.status,200);assert.equal(done.data.pending,undefined);
 assert.equal(f.h.bot.messages.length,1);assert.equal(f.h.state(f.owner,f.radio).user.canUseModeration,true);
});

test('Einmalcode bindet nur die authentifizierte Channelidentität; gefälschte Rollen und Wiederholungen verleihen keine Rechte',()=>{const f=setup(),token=randomBytes(32).toString('hex'),code=randomBytes(16).toString('hex');const initial={operation:'login.begin',token,code,userId:1,canManage:true};assert.equal(f.call(initial).status,200);assert.equal(f.call(initial).status,400);assert.equal(f.state(token).status,401);
 const second=randomBytes(32).toString('hex'),secondCode=randomBytes(16).toString('hex');f.call({operation:'login.begin',token:second,code:secondCode});f.h.app.chatCommands.mw(f.listener,'homepage ' + secondCode);assert.equal(f.call({operation:'login.status',token:second}).data.pending,true);f.h.app.chatCommands.mw(f.owner,'homepage ' + secondCode);assert.equal(f.call({operation:'login.status',token:second}).data.pending,false);assert.equal(f.state(second).data.state.user.nick,'Otterchen');f.h.app.chatCommands.mw(f.dj,'homepage ' + secondCode);assert.match(f.dj.messages.at(-1),/nicht verfügbar/);assert.equal(f.h.contents.length,1,'Kopplung erzeugt keine native Sitzung');});

test('Neue und ungültige Kopplungen verfallen; Logout, Verlassen und Rechteentzug sperren alte Zugriffstoken dauerhaft',()=>{const f=setup();let token=f.login(f.owner);f.h.advance(1800001);assert.equal(f.state(token).status,401);token=f.login(f.owner);f.call({operation:'logout',token});assert.equal(f.state(token).status,401);token=f.login(f.owner);f.owner.online=false;f.h.app.onUserLeft(f.owner);f.owner.online=true;assert.equal(f.state(token).status,401);
 const resumed=f.h.open(f.owner);f.h.event(f.owner,resumed,'mw:addRadioModerator',{nick:f.dj.nick});const djToken=f.login(f.dj);assert.equal(f.state(djToken).status,200);f.h.event(f.owner,resumed,'mw:removeRadioModerator',{userId:f.dj.id});f.h.event(f.owner,resumed,'mw:addRadioModerator',{nick:f.dj.nick});assert.equal(f.state(djToken).status,401,'Erneute Ernennung belebt kein altes Token');});

test('Bestätigte Websiteänderungen erscheinen im nativen Zustand; Wiederholung nach Antwortverlust sendet keine doppelte Studioansage',()=>{const f=setup(),token=f.login(f.owner),id='website-onair-12345';assert.equal(f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:null},id).status,200);assert.equal(f.h.state(f.owner,f.radio).moderator.nick,f.owner.nick);assert.equal(f.h.bot.messages.length,1);assert.equal(f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:null},id).status,200);assert.equal(f.h.bot.messages.length,1);assert.equal(f.action(token,'mw:setTopic',{topic:'Anderer Inhalt'},id).status,400);
 const previous=f.state(token).data.state;assert.equal(f.action(token,'mw:setTopic',{topic:'Website-Sendung',previousTopic:previous.topic}).status,200);assert.equal(f.h.state(f.owner,f.radio).topic,'Website-Sendung');f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'Aus dem Channel'});assert.equal(f.state(token).data.state.topic,'Aus dem Channel');assert.equal(f.action(token,'mw:setTopic',{topic:'Veraltet',previousTopic:'Website-Sendung'}).status,400);});

test('Website-Anmeldung bleibt ohne Zeitlimit aktiv; alte Enddaten ändern weder Beginn noch Schlüssel',()=>{const f=setup(),token=f.login(f.owner);assert.equal(f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:null}).status,200);const before=f.state(token).data.state.moderator;assert.equal('expiresAt' in before,false);assert.equal('openEnd' in before,false);assert.equal(f.h.state(f.owner,f.radio).user.isOnAir,true);assert.equal(f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:before.sessionKey,endMode:'fixed',endLocal:'2030-05-01T21:00'}).status,200);assert.deepEqual(f.state(token).data.state.moderator,before);});

test('Website-Moderation kann keine Verwaltung oder Bot-Texte lesen oder ändern',()=>{const f=setup(),ownerToken=f.login(f.owner);f.action(ownerToken,'mw:addRadioModerator',{nick:f.dj.nick,expectedRadioModeratorRevision:0});const token=f.login(f.dj);assert.equal(f.state(token,'team').status,400);assert.equal(f.action(token,'mw:channelTexts.save',{enabled:true,interval:20,texts:['Text'],expectedRevision:0}).status,400);assert.equal(f.action(token,'mw:schedule.save',{week:'2026-11-02'}).status,400);assert.equal(f.action(token,'mw:removeRadioModerator',{userId:1}).status,400);assert.equal(f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123'}).status,200);assert.equal(f.action(token,'mw:setTopic',{topic:'Sendung',previousTopic:''}).status,200);});

test('Wunschregie quittiert und entfernt ausschließlich den tatsächlich geöffneten Eintrag; Texte werden nach Abschluss entfernt',()=>{const f=setup(),token=f.login(f.owner);f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123'});const listenerRadio=f.h.open(f.listener);f.h.event(f.listener,listenerRadio,'mw:wish.submit',{text:'Band – Titel'});const before=f.h.store.data;assert.equal(f.action(token,'mw:ackRequest',{id:1}).status,400);const state=f.state(token).data.state;assert.equal(state.queue[0].text,'Band – Titel');assert.equal(f.action(token,'mw:ackRequest',{id:1}).status,200);assert.equal(f.h.state(f.owner,f.radio).queue[0].delivery.nick,f.owner.nick);assert.equal(f.action(token,'mw:setWishStage',{id:1,stage:'playing',previousStage:'queued'}).status,400);assert.equal(f.action(token,'mw:setWishStage',{id:1,stage:'preparing',previousStage:'queued'}).status,200);assert.equal(f.action(token,'mw:setWishStage',{id:1,stage:'playing',previousStage:'preparing'}).status,200);assert.equal(f.h.state(f.listener,listenerRadio).wishPositions.nextItem.stage,'playing');assert.equal(f.action(token,'mw:resolveRequest',{id:1,outcome:'done'}).status,200);assert.equal(f.h.state(f.owner,f.radio).queueTotal,0);assert.doesNotMatch(JSON.stringify(before),/Band – Titel/);});

test('Sendeplan und Bot-Texte verwenden vorhandene Revisionen, AutoDJ, Open End und dieselben Speicheradapter',()=>{const f=setup(),token=f.login(f.owner);let plan=f.state(token,'schedule',{week:'2026-11-02'}).data.state.schedule;const data={week:plan.week,expectedRevision:plan.revision,date:plan.week,start:'00:00',end:'00:00',kind:'autodj',timing:'allDay',topic:'Unser Musikmix'};assert.equal(f.action(token,'mw:schedule.save',data).status,200);assert.equal(f.action(token,'mw:schedule.save',data).status,400);plan=f.state(token,'schedule',{week:plan.week}).data.state.schedule;assert.equal(plan.entries[0].timing,'allDay');const texts=Array(6).fill('"'.repeat(300));assert.equal(f.action(token,'mw:channelTexts.save',{enabled:true,interval:50,texts,expectedRevision:0}).status,200);const team=f.state(token,'team');assert.ok(team.raw.length<9500);assert.equal(team.data.state.channelTexts.interval,50);assert.equal([...f.h.timers.values()].filter(task=>task.callback.name!=='reconcile').length,1);assert.equal(f.action(token,'mw:channelTexts.save',{enabled:false,interval:20,texts:[''],expectedRevision:0}).status,400);});

test('Öffentliche Projektionen enthalten weder private Identitäten noch Wünsche, Tokens oder Verwaltungsdaten',()=>{const f=setup(),token=f.login(f.owner);f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:null});f.action(token,'mw:setTopic',{topic:'Öffentliches Thema',previousTopic:''});const pub=f.call(null,'GET','radio=1');assert.equal(pub.data.radio.topic,'Öffentliches Thema');assert.equal(pub.data.radio.moderator.nick,'Yves');assert.doesNotMatch(pub.raw,/Otterchen|token|sessionKey|userId|radioModerator|channelTexts/);f.h.app.onPrepareShutdown();assert.equal(f.state(token).status,503);});

test('Websiteabgleich beendet eine Studioanmeldung auch nach sieben Stunden nicht',()=>{const f=setup(),token=f.login(f.owner);f.action(token,'mw:onAir',{pin:'0123',pinConfirmation:'0123',expectedModerator:null});f.h.advance(7*3600000);assert.equal(f.h.state(f.owner,f.radio).user.isOnAir,true);assert.equal(f.h.bot.messages.length,1);});
test('Verlust des Besitzerrechts beendet auch dann die Websitzung, wenn eine andere Moderationsberechtigung verbleibt',()=>{const original=setup(),first=original.login(original.owner);original.action(first,'mw:setTopic',{topic:'Test',previousTopic:''});original.h.event(original.owner,original.radio,'mw:setRequests',{enabled:true});const saved=JSON.parse(JSON.stringify(original.h.store.data['mischwerk.state.v1']));saved.radioModeratorUserIds.push(1);const f=setup(true,saved),token=f.login(f.owner);f.owner.role='listener';assert.equal(f.state(token,'team').status,401);const next=f.login(f.owner);assert.equal(f.state(next).data.state.user.canModerate,true);assert.equal(f.state(next).data.state.user.canManageRadioModerators,false);});


test('Websitewunsch bleibt nach Neustart in derselben Queue; Speicherfehler und Wiederholungen bleiben eindeutig',()=>{
 const f=setup();f.h.event(f.owner,f.radio,'mw:onAir',{pin:'0123',pinConfirmation:'0123'});const data={visitorId:'a'.repeat(32),submissionId:'website-durable',text:'Wunsch von der Website'};
 const write=f.h.store.setObject;f.h.store.setObject=()=>{throw Error('private');};
 assert.equal(f.call(data).data.ok,false);assert.equal(f.h.state(f.owner,f.radio).queueTotal,0);
 f.h.store.setObject=write;assert.equal(f.call(data).data.ok,true);
 const reboot=setup(true,null,f.h.store);reboot.h.event(reboot.owner,reboot.radio,'mw:onAir',{pin:'0123',pinConfirmation:'0123'});assert.equal(reboot.h.state(reboot.owner,reboot.radio).queueTotal,1);
 assert.equal(reboot.h.state(reboot.owner,reboot.radio).queue[0].text,data.text);
 assert.equal(reboot.call(data).data.ok,true);assert.equal(reboot.h.state(reboot.owner,reboot.radio).queueTotal,1);
 reboot.h.event(reboot.owner,reboot.radio,'mw:resolveRequest',{id:1,outcome:'done'});
 const final=setup(true,null,reboot.h.store);assert.equal(final.call(data).data.ok,true);
 assert.equal(final.h.state(final.owner,final.radio).queueTotal,0);
 assert.doesNotMatch(JSON.stringify(final.h.store.data),/Wunsch von der Website/);
});


test('Website verlangt weiterhin die persönliche PIN trotz direkter nativer Anmeldung',()=>{
 const f=setup(),token=f.login(f.owner);
 assert.equal(f.action(token,'mw:onAir',{authentication:'knuddels',nativeSession:true}).status,400);
 assert.equal(f.h.state(f.owner,f.radio).moderator,null);
 assert.equal(f.action(token,'mw:onAir',{pin:'001234',pinConfirmation:'001234'}).status,200);
 f.h.event(f.owner,f.radio,'mw:offAir',{});
 for(let i=0;i<5;i++)assert.equal(f.action(token,'mw:onAir',{pin:'999999'}).status,400);
 const pin=f.h.store.getObject('mischwerk.state.v1').moderatorPins.u1;
 assert.equal(pin.failures,5);assert.ok(pin.blockedUntil>f.h.now());
 assert.equal(f.action(token,'mw:onAir',{pin:'001234'}).status,400);
 assert.equal(f.h.event(f.owner,f.radio,'mw:onAir',{}).findLast(e=>e.type==='mw:result').data.ok,true);
 assert.deepEqual(f.h.store.getObject('mischwerk.state.v1').moderatorPins.u1,pin);
 f.h.event(f.owner,f.radio,'mw:offAir',{});f.h.advance(300001);
 assert.equal(f.action(token,'mw:onAir',{pin:'001234'}).status,200);
});

test('Website-Übernahme behält ihre PIN-Pflicht; native Übernahme nutzt die echte Sitzung',()=>{
 const f=setup();f.h.event(f.owner,f.radio,'mw:addRadioModerator',{nick:f.dj.nick});const token=f.login(f.dj),session=f.h.open(f.dj);
 f.h.event(f.owner,f.radio,'mw:onAir',{});
 f.h.event(f.owner,f.radio,'mw:handover.request',{nick:f.dj.nick,expectedModerator:f.h.state(f.owner,f.radio).moderator.sessionKey});
 const id=f.h.state(f.dj,session).handover.incoming.id;
 assert.equal(f.action(token,'mw:handover.accept',{id}).status,400);
 assert.equal(f.h.state(f.owner,f.radio).user.isOnAir,true);
 assert.equal(f.h.event(f.dj,session,'mw:handover.accept',{id}).findLast(e=>e.type==='mw:result').data.ok,true);
});

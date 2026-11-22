/* Aktuelle V2-Verträge in beiden echten Engines; vorhandenes Plattformharness wiederverwenden. */
var legacyHarness=readFile('tests/rhino/wishes.js','UTF-8');
eval(legacyHarness.slice(0,legacyHarness.indexOf("load(mischWerkAppRoot + '/main.js');")));
var now=1800000000000,nativeCalls=[],nonceSequence=0,currentRuntime;
setTimeout=function(callback,delay){var entry={id:++pinTimerSequence,callback:callback,at:now+delay};pinTimers.push(entry);return entry.id;};
function advance(ms){now+=ms;var due=pinTimers.filter(function(entry){return entry.at<=now;});due.forEach(function(entry){clearTimeout(entry.id);entry.callback();});}
RandomOperations.getRandomString=function(length,alphabet){nonceSequence+=1;var value='';for(var i=0;i<length;i+=1){value+=alphabet.charAt((i+nonceSequence)%alphabet.length);}return new java.lang.String(value);};
KnuddelsServer.getExternalServerAccess=function(){return {canAccessURL:function(){return true;},postURL:function(url,parameters){nativeCalls.push({url:url,parameters:parameters,body:JSON.parse(parameters.data.payload)});}};};
store.data['mischwerk.android.private.v1']={enabled:true,runtimeVerified:true,syncSecret:'synthetic_'+new Array(46).join('x'),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:0};
load(mischWerkAppRoot+'/main.js');
var attachSessions=MischWerkModules.attachSessions;
MischWerkModules.attachSessions=function(runtime,config){attachSessions(runtime,config);runtime.now=function(){return now;};currentRuntime=runtime;};
App=MischWerkModules.createApp(MischWerkConfig);App.onAppStart();
var owner=person(2,'Otterchen',true),listener=person(3,'Hörer',false),dj=person(4,'DJ-Test',false);
App.onUserJoined(owner);App.onUserJoined(listener);App.onUserJoined(dj);publicMessages=[];
var os=owner.sessions[0],ls=listener.sessions[0];
function response(extra){
 var result={contractVersion:2,accepted:true,serverTime:now,station:{contractVersion:2,authority:'studio',protocolEpoch:'rhino-public',revision:1,broadcastState:'live',onAir:true,wishboxOpen:true,moderatorNick:'DJ-Test',topic:'Äther 🎶',updatedAt:now,validUntil:now+45000},
 wishReceipts:[],ownWishStatuses:[],deletionReceipts:[],broadcastEvents:[],eventCursor:'initial',nickAccessPage:{snapshotId:'s'+now,revision:new Array(65).join('a'),snapshotAt:now,validUntil:now+45000,items:[{nick:'DJ-Test'}],nextCursor:null,complete:true}};
 Object.keys(extra||{}).forEach(function(key){result[key]=extra[key];});return result;
}
function finish(extra){var call=nativeCalls[nativeCalls.length-1];call.parameters.onSuccess(new java.lang.String(JSON.stringify(response(extra))),{getResponseCode:function(){return new java.lang.Integer(200);},getURLString:function(){return new java.lang.String(call.url);}});}
check(Object.keys(nativeCalls[0].parameters.data).sort().join(',')==='nonce,payload,sig,ts','Vier unveränderte Stringfelder');
Object.keys(nativeCalls[0].parameters.data).forEach(function(key){check(typeof nativeCalls[0].parameters.data[key]==='string','Stringfeld '+key);});
check(nativeCalls[0].body.contractVersion===2 && nativeCalls[0].body.station===undefined,'Nur innerer V2-Vertrag, keine lokale Sendung');
check(nativeCalls[0].body.nativeConfig===undefined,'Keine zentrale Konfigurationsmutation');
check(currentRuntime.receivedRosterState().confirmed===false,'Unbekannte Freigaben bleiben unbestätigt');
finish({station:{contractVersion:2,authority:'studio',protocolEpoch:'rhino-public',revision:0,broadcastState:'unknown',onAir:false,wishboxOpen:false,moderatorNick:null,topic:null,updatedAt:0,validUntil:0}});
check(currentRuntime.receivedShow().active===false,'Unbekannter Stand aktiviert keinen DJ');
advance(9999);check(nativeCalls.length===1,'Kein vorzeitiger regulärer Abgleich');
advance(1);check(nativeCalls.length===2,'Ohne aktive Sendung nach zehn Sekunden erneut abgleichen');
finish();App.onEventReceived(owner,'mw:refresh',{},os);
check(currentRuntime.receivedRosterState().confirmed===true,'Vollständig empfangene Freigaben sind bestätigt');
check(latest(os,'mw:state').user.showModerationButton===false,'Keine Moderationstaste auch für Inhaber');
check(latest(os,'mw:state').topic==='Äther 🎶' && latest(os,'mw:state').requestsEnabled===true,'Bestätigte Firebase-Sendung');
var unchanged=JSON.stringify(store.data);
['mw:onAir','mw:offAir','mw:openStudio','mw:setTopic','mw:setRequests','mw:handover.accept','mw:addRadioModerator','mw:removeRadioModerator','mw:ackRequest','mw:queue.read','mw:setWishStage','mw:resolveRequest','mw:pin.login'].forEach(function(type){
 App.onEventReceived(owner,type,{requestId:'old',enabled:true,topic:'Falsch'},os);check(latest(os,'mw:result').ok===false,'Altaktion gesperrt '+type);check(JSON.stringify(store.data)===unchanged,'Keine Altmutation '+type);
});
check(App.chatCommands.lauftext===undefined,'Lauftextbefehl entfernt');check(MischWerkModules.attachHandover===undefined && MischWerkModules.attachModerationPin===undefined,'Keine leeren Altcontroller');
var originalSet=store.setObject;
store.setObject=function(){throw new Error('synthetischer Speicherabbruch');};
App.onEventReceived(listener,'mw:wish.submit',{submissionId:'rhino-failed',text:'Fehler bleibt privat'},ls);
store.setObject=originalSet;
check(latest(ls,'mw:wish.receipt').accepted===false && currentRuntime.nativeRelayState().entries.length===0,'Speicherabbruch bestätigt keine Outbox');
App.onEventReceived(listener,'mw:wish.submit',{submissionId:'rhino-wish',text:'Lied für Änne 🎶'},ls);
check(latest(ls,'mw:wish.receipt').pending===true && latest(ls,'mw:wish.receipt').accepted===false,'Outbox ist keine Annahme');
advance(10000);var sent=nativeCalls[nativeCalls.length-1].body.wishSubmissions[0];check(sent.ownerKey.length===64 && sent.text==='Lied für Änne 🎶','Pseudonymer Besitzer und Unicode vollständig');
finish({wishReceipts:[{submissionId:sent.submissionId,accepted:true,state:'queued',position:17,error:null}]});
check(latest(ls,'mw:wish.receipt').accepted===true,'Individuelle Commitquittung');App.onEventReceived(listener,'mw:refresh',{},ls);check(latest(ls,'mw:state').wishPositions.nextPosition===17,'Zentraler globaler Platz');
App.chatCommands.mw(owner,'admin');var ts=owner.sessions.filter(function(session){return session.getAppContent().html.data.view==='team';})[0];
App.onEventReceived(owner,'mw:setTicker',{view:'team',viewRevision:1,requestId:'ticker',expectedTickerRevision:0,text:'Grüße aus dem Studio',enabled:true,speed:72,direction:'left'},ts);
check(latest(ts,'mw:result').ok===true && currentRuntime.tickerState().speed===72,'Inhaberverwaltung speichert Lauftext');
App.onEventReceived(owner,'mw:display.save',{view:'team',viewRevision:1,requestId:'display',expectedRevision:0,teamSignsEnabled:false,announcementsEnabled:true},ts);
check(latest(ts,'mw:result').ok===true,'Teamzeichen separat schaltbar');check(Object.keys(dj.nicklistIcons).length===1,'Mikrofon bleibt ohne MW-Teamzeichen');
var consoleUser=person(6,'Polaroid',false);consoleUser.getNick=function(){return new java.lang.String('Polaroid');};
App.onUserJoined(consoleUser);App.chatCommands.mw(consoleUser,'admin');
var consoleSession=consoleUser.sessions.filter(function(session){return session.getAppContent().html.data.view==='team';})[0];
check(!!consoleSession && currentRuntime.canUseAdministration(consoleUser),'Polaroid erhält die native Konsole aus authentifiziertem Java-Nick');
check(currentRuntime.canAdminister(consoleUser)===false,'Konsolenzugang erteilt kein Inhaberrecht');
var consoleSmileyCode=':(polaroid-test):',consoleSmileyImage='°>sm_fixture_polaroid.gif<°',consoleSmileyReplies=[];
var consolePrivateReply=consoleUser.sendPrivateMessage;
consoleUser.sendPrivateMessage=function(text){consoleSmileyReplies.push(String(text));};
function consoleSmileyMessage(code,image){return {getAuthor:function(){return consoleUser;},
 getRawText:function(){return new java.lang.String('smiley '+code);},getText:function(){return new java.lang.String('smiley '+image);}};}
App.onPrivateMessage(consoleSmileyMessage(consoleSmileyCode,consoleSmileyImage));
check(consoleSmileyReplies[0].indexOf('Smiley gespeichert')===0,'Polaroid importiert Smiley aus nativen Java-Strings ohne Inhaberrecht');
check(currentRuntime.readChannelTexts().smileys[0].image===consoleSmileyImage,'Polaroids Smiley dauerhaft im vorhandenen Speicher');
var consoleSmileyStored=JSON.stringify(currentRuntime.readChannelTexts());
App.onPrivateMessage(consoleSmileyMessage(consoleSmileyCode,consoleSmileyImage));
check(JSON.stringify(currentRuntime.readChannelTexts())===consoleSmileyStored,'Polaroids Smileywiederholung ist idempotent');
var consoleOnline=consoleUser.isOnlineInChannel;
consoleUser.isOnlineInChannel=function(){return false;};
App.onPrivateMessage(consoleSmileyMessage(':(gesperrt):','°>sm_fixture_private.gif<°'));
check(JSON.stringify(currentRuntime.readChannelTexts())===consoleSmileyStored && consoleSmileyReplies[2].indexOf('Empfangen')===-1,
 'Abwesender Polaroid erhält weder Import noch Formatdiagnose');
consoleUser.isOnlineInChannel=consoleOnline;consoleUser.sendPrivateMessage=consolePrivateReply;
check(currentRuntime.canAdminister(consoleUser)===false,'Smileyfreigabe erweitert keine Inhaberrechte');
App.onEventReceived(consoleUser,'mw:androidSettings.status',{},consoleSession);
check(latest(consoleSession,'mw:androidSettings.status').ok===true,'Polaroid liest die private Verbindung in aktueller Konsole');
var preflightBefore=JSON.stringify(store.data),preflightCalls=nativeCalls.length;
var preflight=currentRuntime.androidSourcePreflight();
check(preflight.version===MischWerkConfig.version && preflight.buildNumber===MischWerkConfig.buildNumber,'Vorprüfung trägt den tatsächlichen Appstand');
check(preflight.sourceNamespace===currentRuntime.loadWishes().studioNamespace,'Vorprüfung zeigt ausschließlich die gespeicherte Quellenkennung');
check(JSON.stringify(store.data)===preflightBefore && nativeCalls.length===preflightCalls,'Vorprüfung speichert und sendet nichts');
App.onEventReceived(consoleUser,'mw:display.save',{view:'team',viewRevision:1,requestId:'console-icons',expectedRevision:1,teamSignsEnabled:false,microphoneEnabled:false,headphonesEnabled:false,announcementsEnabled:true},consoleSession);
check(latest(consoleSession,'mw:result').ok===true && Object.keys(dj.nicklistIcons).length===0,'Mikrofon separat ausschaltbar ohne Status zu erfinden');
check(currentRuntime.displaySettings().headphonesEnabled===false,'Kopfhöreroption separat gespeichert');
App.onEventReceived(consoleUser,'mw:display.save',{view:'team',viewRevision:1,requestId:'console-restore',expectedRevision:2,teamSignsEnabled:false,microphoneEnabled:true,headphonesEnabled:true,announcementsEnabled:true},consoleSession);
check(Object.keys(dj.nicklistIcons).length===1,'Bestätigtes Mikrofon nach explizitem Einschalten wiederhergestellt');
var beforeExpiryMessages=publicMessages.length;
advance(45000);App.onEventReceived(listener,'mw:refresh',{},ls);check(latest(ls,'mw:state').moderator===null && latest(ls,'mw:state').requestsEnabled===false,'45 Sekunden schließen Anzeige und Annahme');check(publicMessages.length===beforeExpiryMessages,'Ausfall ist kein Ende');
check(currentRuntime.receivedRosterState().confirmed===false,'Abgelaufene Freigaben werden wieder unbestätigt');
var own=currentRuntime.copy(currentRuntime.nativeRelayState()),oldId=own.entries[0].submissionId;
currentRuntime.acceptNativeWishReply({wishReceipts:[],deletionReceipts:[],ownWishStatuses:[{submissionId:oldId,state:null,position:null,error:'unavailable'}]},
 {wishSubmissions:[],ownerDeletions:[],ownWishQueries:[{submissionId:oldId,ownerKey:own.entries[0].ownerKey}]});
check(currentRuntime.nativeRelayState().entries[0].state==='unconfirmed' && currentRuntime.nativeRelayState().entries[0].text==='Lied für Änne 🎶','Statusfehler bleibt neutral, Text und Identität erhalten');
var original=currentRuntime.copy(currentRuntime.loadWishes());
for(var i=0;i<260;i+=1){original.items.push({id:original.nextId++,senderKey:'3',nick:'Hörer',text:String(i)+new Array(141).join('🎶'),submissionId:'legacy-'+i,createdAt:now,delivery:i===0?{nick:'Alter DJ',at:now,senderKey:'2'}:null});}
var terminalId=original.nextId++;original.replays.push({id:terminalId,submissionId:'rhino-terminal',senderKey:'3',outcome:'done'});
original.revision+=1;currentRuntime.updateStudioWishState(currentRuntime.loadWishes(),original);currentRuntime.updateWishControlState(currentRuntime.loadWishes(),original);currentRuntime.commitWishMetadata(original);
var offset=0,index=0,sourceRevision,wishCount=0;
for(;;){var page=currentRuntime.nativeMigrationPage({migrationId:'rhino-import',offset:offset,chunkIndex:index++,sourceRevision:sourceRevision});sourceRevision=page.sourceRevision;
 check(JSON.stringify(page.chunk).length<9500,'Importpaket unter Grenze');wishCount+=page.chunk.wishes.length;if(page.chunk.finalChunk){break;}offset=page.nextOffset;}
check(wishCount===260 && index>10,'260 Unicodeoriginale vollständig paginiert');
var beforeReplay=currentRuntime.nativeRelayState().entries.length;
App.onEventReceived(listener,'mw:wish.submit',{submissionId:'rhino-terminal',text:'Historischer Text ist unbekannt'},ls);
check(latest(ls,'mw:wish.receipt').state==='done' && currentRuntime.nativeRelayState().entries.length===beforeReplay,'Terminaler Original-Replay erzeugt keine neue ID');
App.onEventReceived(dj,'mw:wish.submit',{submissionId:'rhino-terminal',text:'Fremde Wiederholung'},dj.sessions[0]);
check(latest(dj.sessions[0],'mw:wish.receipt').accepted===false,'Fremder Replaybesitzer bleibt gesperrt');

check(currentRuntime.numericUserId(new java.lang.Integer(3))===3,'Native Zahlenwrapper normalisiert');
var failedCall=nativeCalls[nativeCalls.length-1];
failedCall.parameters.onFailure(new java.lang.String('Private Antwort wird nie protokolliert'),{getResponseCode:function(){return new java.lang.Integer(400);},getURLString:function(){return new java.lang.String(failedCall.url);}});
check(currentRuntime.androidLastFailure().stage==='http_response' && currentRuntime.androidLastFailure().httpStatus===400,'HTTP-Ursprungsstufe bleibt bei Java-Antwortobjekten erhalten');
var budgetNow=1800000000000,budgetRuntime={now:function(){return budgetNow;}},callbacks=[];
MischWerkModules.attachHttpBudget(budgetRuntime);
var completeBudget=budgetRuntime.beginExternalRequest('sync');completeBudget();
check(budgetRuntime.externalRequestDelay('sync')===10000,'HTTP-Mindestabstand gilt auch nach sofortigem Erfolg');
for(var budgetIndex=1;budgetIndex<60;budgetIndex+=1){budgetNow+=10000;budgetRuntime.beginExternalRequest('sync')();}
check(budgetRuntime.externalRequestDelay('sync')===10000,'60 POSTs lassen keine zusätzliche Dringlichkeit zu');
budgetNow+=10000;check(budgetRuntime.externalRequestDelay('sync')===0,'Rollendes Fenster gibt den ältesten bestätigten Platz frei');
for(var scheduleIndex=0;scheduleIndex<30;scheduleIndex+=1){callbacks.push(budgetRuntime.beginExternalRequest('schedule'));}
check(budgetRuntime.externalRequestDelay('schedule')>0,'30 Sendeplanaufrufe halten ihre eigene Reserve');
budgetNow+=600000;check(budgetRuntime.externalRequestDelay('schedule')>0,'Ausstehende native Antworten bleiben auch nach zehn Minuten reserviert');
callbacks.forEach(function(callback){callback();});
budgetNow+=599999;check(budgetRuntime.externalRequestDelay('schedule')===1,'Verspätete Antworten halten ihre Reserve für weitere zehn Minuten');
budgetNow+=1;check(budgetRuntime.externalRequestDelay('schedule')===0,'Sendeplanreserve läuft nach echtem Callback ab');
budgetRuntime.beginExternalRequest('sync')();budgetNow-=1000;
check(budgetRuntime.externalRequestDelay('sync')===11000,'Rückwärts laufende Uhr hebt den Abstand nicht auf');
load('tests/rhino/android-signing.js');
print('Rhino-V2 OK: '+assertions+' Prüfungen');

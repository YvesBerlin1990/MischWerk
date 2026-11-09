/* Geschützte reguläre Inhaberaktivierung ohne WebHook in beiden echten Rhino-Engines. */
(function () {
    var persistenceBefore=KnuddelsServer.getPersistence, hooksBefore=KnuddelsServer.getWebHookAccess;
    var externalBefore=KnuddelsServer.getExternalServerAccess, saved={}, sends=[], ownerAllowed=true, hookCalls=0;
    var key='mischwerk.android.private.v1', clock=1800000000000, runtime, operator;
    saved[key]={enabled:false,runtimeVerified:false,syncSecret:new Array(65).join('s'),
        syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:0};
    KnuddelsServer.getPersistence=function(){return {getObject:function(k,fallback){return copy(saved[k]||fallback);},setObject:function(k,v){saved[k]=copy(v);}};};
    KnuddelsServer.getWebHookAccess=function(){hookCalls+=1;throw new Error('No WebHook permission');};
    KnuddelsServer.getExternalServerAccess=function(){return {canAccessURL:function(){return true;},postURL:function(url,p){
        sends.push(copy(p.data));p.onSuccess(new java.lang.String(JSON.stringify({accepted:true,serverTime:clock,wishes:[]})),{getResponseCode:function(){return 200;},getURLString:function(){return new java.lang.String(url);}});
    }};};
    try {
        channelTextTasks={};runtime=MischWerkModules.createRuntime(MischWerkConfig);
        runtime.now=function(){return clock;};runtime.warn=function(){};runtime.observeChanges=function(){};
        runtime.send=function(session,type,data){session.sendEvent(type,data);};
        runtime.isChannelOwner=function(user){return user===operator&&ownerAllowed;};
        runtime.online=function(user){return user.isOnlineInChannel();};runtime.userId=function(user){return user.getUserId();};
        runtime.state={requestsEnabled:false,topic:'',moderator:null};runtime.moderatorIsActive=function(){return false;};
        runtime.pendingAndroidUpdates=function(){return [];};runtime.confirmAndroidUpdates=function(){};
        runtime.startAndroidReceipts=function(){};runtime.androidReceiptsReady=function(){return true;};
        MischWerkModules.attachTicker(runtime);
        MischWerkModules.attachSessionState(runtime);MischWerkModules.attachContent(runtime);MischWerkModules.attachSessions(runtime,MischWerkConfig);
        MischWerkModules.attachAndroidFailures(runtime); MischWerkModules.attachAndroidSigning(runtime);MischWerkModules.attachAndroidConnection(runtime);MischWerkModules.attachAndroidIncoming(runtime);MischWerkModules.attachAndroidPublisher(runtime);
        MischWerkModules.attachAndroidRelay(runtime);MischWerkModules.attachAndroidOperation(runtime,MischWerkConfig);MischWerkModules.attachAndroidSettings(runtime,MischWerkConfig);
        operator=person(99021,'Synthetischer Betreiber',true);runtime.androidRelayCommand(operator,'einrichten');var session=operator.sessions[0],sequence=0;
        function action(name,extra){var data={revision:saved[key].revision,requestId:'operation-'+(++sequence)};Object.keys(extra||{}).forEach(function(k){data[k]=extra[k];});runtime.handleAndroidSettingsEvent(operator,'mw:androidSettings.'+name,data,session);return session.events.length ? session.events[session.events.length-1].data : null;}
        check(sends.length===0&&!saved[key].enabled,'Keine implizite Aktivierung durch Öffnen');
        ownerAllowed=false;action('activate');check(sends.length===0&&!saved[key].enabled,'Ownerverlust verhindert Aktivierung');
        ownerAllowed=true;runtime.androidRelayCommand(operator,'einrichten');session=operator.sessions[operator.sessions.length-1];
        var activated=action('activate');check(activated.ok&&saved[key].enabled&&saved[key].runtimeVerified,'Sync allein erlaubt ausdrücklich beide Flags');
        check(sends.length===1&&hookCalls===0&&runtime.androidPublisherStatus().firstAcceptedPost.status===200,'Erster regulärer POST ohne WebHook angenommen');
        check(Object.keys(sends[0]).sort().join(',')==='nonce,payload,sig,ts','Signaturvertrag unverändert in Rhino');
        var timerKey=Object.keys(channelTextTasks)[0],task=channelTextTasks[timerKey];check(task.at===channelTextTime+20000,'Bestehender 20-Sekunden-Takt');
        delete channelTextTasks[timerKey];clock+=20000;channelTextTime+=20000;task.callback();
        check(sends.length===2&&JSON.parse(sends[1].payload).station.updatedAt>JSON.parse(sends[0].payload).station.updatedAt,'Heartbeat streng monoton');
        check(action('activate').ok&&sends.length===2,'Aktivierung bleibt idempotent');
        runtime.handleAndroidSettingsEvent(operator,'mw:androidSettings.status',{},session);var status=session.events[session.events.length-1].data;
        check(status.state.operation.transport==='status-response-v1'&&JSON.stringify(status).indexOf(saved[key].syncSecret)===-1,'Status nur mit technischen Metadaten');
        check(action('deactivate').ok&&!saved[key].enabled&&!saved[key].runtimeVerified,'Ausschalten persistiert false-Flags');
        check(hookCalls===0&&Object.keys(channelTextTasks).length===0,'Ausschalten ohne Hook und zusätzlichen Timer');
        var before=session.events.length;action('prepare');check(session.events.length===before&&hookCalls===0,'Alte Hookvorbereitung ist entfernt');
    } finally {
        if(runtime&&runtime.stopAndroidRelay){runtime.stopAndroidRelay();}
        KnuddelsServer.getPersistence=persistenceBefore;KnuddelsServer.getWebHookAccess=hooksBefore;KnuddelsServer.getExternalServerAccess=externalBefore;channelTextTasks={};
    }
}());

/* Reguläre Owner-Freigabe in beiden echten Rhino-Engines mit ausschließlich synthetischen Daten. */
(function () {
    var persistenceBefore=KnuddelsServer.getPersistence, hooksBefore=KnuddelsServer.getWebHookAccess;
    var externalBefore=KnuddelsServer.getExternalServerAccess, saved={}, sends=[], observer=null, ownerAllowed=true;
    var hookAddress='https://hooks.example.invalid/private/android-wishes', throwRegistration=false;
    var key='mischwerk.android.private.v1', clock=1800000000000, runtime, operator;
    saved[key]={enabled:false,runtimeVerified:false,syncSecret:new Array(65).join('s'),relaySecret:new Array(65).join('r'),
        syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:0};
    KnuddelsServer.getPersistence=function(){return {getObject:function(k,fallback){return copy(saved[k]||fallback);},setObject:function(k,v){saved[k]=copy(v);}};};
    KnuddelsServer.getWebHookAccess=function(){return {
        registerWebHook:function(k,fn){if(throwRegistration){throw new Error('private details');}observer=fn;},
        getWebHookUrl:function(){return new java.lang.String(hookAddress);},
        unregisterWebHook:function(){observer=null;}
    };};
    KnuddelsServer.getExternalServerAccess=function(){return {canAccessURL:function(){return true;},postURL:function(url,p){
        sends.push(copy(p.data));p.onSuccess(JSON.stringify({accepted:true,serverTime:clock}),{getResponseCode:function(){return 200;},getURLString:function(){return url;}});
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
        MischWerkModules.attachSessionState(runtime);MischWerkModules.attachContent(runtime);MischWerkModules.attachSessions(runtime,MischWerkConfig);
        MischWerkModules.attachAndroidSigning(runtime);MischWerkModules.attachAndroidConnection(runtime);MischWerkModules.attachAndroidPublisher(runtime);
        MischWerkModules.attachAndroidWebHook(runtime);MischWerkModules.attachAndroidOperation(runtime,MischWerkConfig);MischWerkModules.attachAndroidSettings(runtime,MischWerkConfig);
        operator=person(99021,'Synthetischer Betreiber',true);runtime.androidRelayCommand(operator,'einrichten');var session=operator.sessions[0],sequence=0;
        function action(name,extra){var data={revision:saved[key].revision,requestId:'operation-'+(++sequence)};Object.keys(extra||{}).forEach(function(k){data[k]=extra[k];});runtime.handleAndroidSettingsEvent(operator,'mw:androidSettings.'+name,data,session);return session.events[session.events.length-1].data;}
        var prepared=action('prepare');
        check(prepared.ok&&prepared.webhookUrl==='https://hooks.example.invalid/private/android-wishes/v1/wishes','Native Java-String-URL mit fachlicher Route');
        check(prepared.state.operation.webhookRegistration.lookupUsed&&prepared.state.operation.webhookRegistration.returnedType==='undefined','Dokumentierte Adressabfrage bei leerem Registrierungsrückgabewert');
        check(sends.length===0&&!saved[key].enabled&&!saved[key].runtimeVerified,'Vorbereitung schaltet nichts frei');
        ownerAllowed=false;action('activate');check(sends.length===0&&!saved[key].enabled,'Ownerverlust verhindert Aktivierung');
        ownerAllowed=true;runtime.androidRelayCommand(operator,'einrichten');session=operator.sessions[operator.sessions.length-1];
        var activated=action('activate');check(activated.ok&&saved[key].enabled&&saved[key].runtimeVerified,'Ausdrückliche Owner-Freigabe persistiert beide Flags');
        check(sends.length===1&&runtime.androidPublisherStatus().firstAcceptedPost.status===200,'Erster regulärer signierter POST angenommen');
        check(Object.keys(sends[0]).sort().join(',')==='nonce,payload,sig,ts','Vier signierte Bodystrings auch in Rhino');
        var timerKey=Object.keys(channelTextTasks)[0],task=channelTextTasks[timerKey];
        check(task.at===channelTextTime+20000,'Vorhandener 20-Sekunden-Takt');
        delete channelTextTasks[timerKey];clock+=20000;channelTextTime+=20000;task.callback();
        check(sends.length===2&&JSON.parse(sends[1].payload).station.updatedAt>JSON.parse(sends[0].payload).station.updatedAt,'Regulärer Heartbeat streng monoton');
        check(action('activate').ok&&sends.length===2,'Wiederholte Aktivierung ist idempotent');
        runtime.handleAndroidSettingsEvent(operator,'mw:androidSettings.status',{},session);
        var status=session.events[session.events.length-1].data;
        check(JSON.stringify(status).indexOf('hooks.example')===-1&&JSON.stringify(status).indexOf(saved[key].syncSecret)===-1,'Status enthält weder Hook-Adresse noch Schlüssel');
        check(action('deactivate').ok&&!saved[key].enabled&&!saved[key].runtimeVerified,'Ausschalten persistiert false-Flags');
        check(observer===null&&Object.keys(channelTextTasks).length===0,'Ausschalten entfernt Hook und Timer');
        hookAddress='http://hooks.example.invalid/private';var rejected=action('prepare');
        check(!rejected.ok&&rejected.state.operation.webhookRegistration.failedStage==='url-result'&&!saved[key].enabled,'Unsicheres HTTP-Ergebnis bleibt gesperrt und wird sicher eingegrenzt');
        throwRegistration=true;rejected=action('prepare');
        check(!rejected.ok&&rejected.state.operation.webhookRegistration.failedStage==='register-call'&&observer===null,'Native Registrierungsfehler bereinigt und ohne Details berichtet');
        check(JSON.stringify(rejected).indexOf('private details')===-1&&JSON.stringify(rejected).indexOf('hooks.example')===-1,'Kein Endpunkt oder Exceptiontext im Fehlerbericht');
        var safeError=runtime.androidRegistrationError({name:new java.lang.String('JavaException'),message:new java.lang.String('WebHooks are disabled. '+saved[key].syncSecret+' https://hooks.example.invalid/private')},saved[key]);
        check(safeError.name==='JavaException'&&safeError.message.indexOf('WebHooks are disabled')!==-1,'Bereinigte native Java-String-Fehlermeldung bleibt verständlich');
        check(safeError.message.indexOf(saved[key].syncSecret)===-1&&safeError.message.indexOf('https://')===-1,'Echte Schlüssel und URL vor nativer Fehlerausgabe entfernt');
        try { new java.net.URL('synthetic-without-protocol'); }
        catch (nativeError) {
            var wrapped=runtime.androidRegistrationError(nativeError,saved[key]);
            check(wrapped.name==='JavaException'&&wrapped.message.indexOf('MalformedURLException')!==-1,'Echter von Rhino gewrappter Javafehler bleibt ohne Stack auswertbar');
        }
    } finally {
        if(runtime&&runtime.stopAndroidRelay){runtime.stopAndroidRelay();}
        KnuddelsServer.getPersistence=persistenceBefore;KnuddelsServer.getWebHookAccess=hooksBefore;KnuddelsServer.getExternalServerAccess=externalBefore;channelTextTasks={};
    }
}());

/* Eigene Cleanup-Persistenz, authentifizierte Radiositzung und Fehlerpfade in beiden Engines. */
(function () {
    var previousChannel=KnuddelsServer.getChannel, previousPeople=people, previousStore=store;
    var tasks={}, nextTask=0, previousTimeout=setTimeout, previousClear=clearTimeout;
    var clock=1000000, removalFailure=false, addFailure=false, writesFail=false, removals=0;
    var team='https://mischwerk.invalid/img/nicklist/team.png';
    var microphone='https://mischwerk.invalid/img/nicklist/moderator.png';
    var headphones='https://mischwerk.invalid/img/nicklist/listener.png';
    var cleanupKey='mischwerk.nicklist-icons.v1', user=person(8137,'Otterchen',true), online=true;
    people=[user]; user.isOnlineInChannel=function(){return online;};
    var data={}, nativeIcons={}, nativeAdd=user.addNicklistIcon;
    user.getPersistence=function(){return {
        getObject:function(key,fallback){return Object.prototype.hasOwnProperty.call(data,key)?copy(data[key]):fallback;},
        setObject:function(key,value){if(writesFail)throw new Error('private write');data[key]=copy(value);}
    };};
    user.addNicklistIcon=function(path,width){
        check(data[cleanupKey].paths.some(function(entry){return entry.path===String(path);}), 'Vor add dauerhaft vorgemerkt');
        nativeIcons[String(path)]=width; nativeAdd(path,width); if(addFailure)throw new Error('private add');
    };
    user.removeNicklistIcon=function(path){removals++;if(removalFailure)throw new Error('private remove');delete nativeIcons[String(path)];};
    KnuddelsServer.getChannel=function(){return {getOnlineUsers:function(){return online?[user]:[];}};};
    setTimeout=function(callback,delay){var id=++nextTask;tasks[id]={callback:callback,at:clock+delay};return id;};
    clearTimeout=function(id){delete tasks[id];};
    function advance(ms){clock+=ms;Object.keys(tasks).forEach(function(id){if(tasks[id]&&tasks[id].at<=clock){var task=tasks[id];delete tasks[id];task.callback();}});}
    try {
        var runtime=MischWerkModules.createRuntime(MischWerkConfig);
        runtime.now=function(){return clock;};runtime.warn=function(){};
        MischWerkModules.attachChanges(runtime);MischWerkModules.attachIdentity(runtime,MischWerkConfig);
        runtime.state={radioModeratorUserIds:[],moderator:null};
        runtime.moderationPinProof=function(){return false;};
        runtime.persist=function(next){runtime.state=next;runtime.changed('station');};
        runtime.broadcast=function(){};
        MischWerkModules.attachModeration(runtime,MischWerkConfig);
        MischWerkModules.attachSessionState(runtime);
        var view={kind:'radio',userId:8137,closed:false};
        var session={getUser:function(){return user;},getAppContent:function(){return view.content;}};
        view.content={getSessions:function(){return [session];}};view.session=session;
        runtime.getViews=function(){return [view];};
        MischWerkModules.attachNicklistStorage(runtime);MischWerkModules.attachNicklist(runtime);
        runtime.startNicklist();check(nativeIcons[team]===32,'Echter Inhaber ohne Team-Persistenz');
        runtime.receiveListenerPresence(user,{active:true,sequence:1},session);
        check(nativeIcons[headphones]===24,'Hörer aus eigener Sitzung');
        runtime.receiveListenerPresence(user,{active:false,sequence:1},session);
        check(nativeIcons[headphones]===24,'Doppelte Sequenz wirkungslos');
        runtime.state.moderator={userId:8137,authentication:'knuddels',sessionKey:'first'};runtime.changed('station');
        check(nativeIcons[microphone]===24&&!nativeIcons[headphones]&&Object.keys(nativeIcons).length===2,'Mikrofon ersetzt Kopfhörer');
        removalFailure=true;runtime.state.moderator=null;runtime.changed('station');
        check(nativeIcons[microphone]===24&&!nativeIcons[headphones]&&data[cleanupKey].paths.length===2,'Fehler erhält Nachweis und Limit');
        removalFailure=false;advance(1000);
        check(!nativeIcons[microphone]&&nativeIcons[headphones]===24,'Entfernung nach Wiederholung');
        advance(44000);check(!nativeIcons[headphones],'Serverfrist 45 Sekunden');
        writesFail=true;runtime.receiveListenerPresence(user,{active:true,sequence:2},session);check(!nativeIcons[headphones],'Ohne Nachweis kein add');
        writesFail=false;addFailure=true;advance(1000);check(nativeIcons[headphones]===24,'Möglicherweise gesetztes Bild');
        addFailure=false;advance(2000);check(nativeIcons[headphones]===24&&removals>3,'Unsicheren add bereinigt');
        runtime.state.moderator={userId:8137,authentication:'knuddels',sessionKey:'new'};runtime.changed('station');
        runtime.shuttingDown=true;runtime.stopNicklist();
        check(Object.keys(nativeIcons).length===0&&data[cleanupKey].paths.length===0&&Object.keys(tasks).length===0,'Shutdown bereinigt Icons und gemeinsamen Timeout');
        check(runtime.state.radioModeratorUserIds.length===0,'Keine neue Teampersistenz');
    } finally {
        setTimeout=previousTimeout;clearTimeout=previousClear;KnuddelsServer.getChannel=previousChannel;people=previousPeople;store=previousStore;
    }
}());

/* Dateiprüfung am tatsächlichen Laufzeitpaket, mit nativen Java-Stringwrappern. */
(function () {
    var originalList=KnuddelsServer.listFiles,originalExecute=KnuddelsServer.execute;
    var savedFiles=availableUpdateFiles,savedUpdates=updates,savedPeople=people.slice(),savedInvalidations=cacheInvalidations;
    var user=person(19837,'Dateiprüfer',true),messages=[],missing=true,scans=0;
    user.sendPrivateMessage=function(message){messages.push(String(message));};
    availableUpdateFiles=['server/app.js'];updates=[];
    var originalModules=MischWerkModules,originalConfig=MischWerkConfig;
    try {
        KnuddelsServer.listFiles=function(folder){
            scans+=1;
            var names=originalList(folder).filter(function(name){return !(missing&&String(folder)==='server/users'&&String(name)==='nicklist-storage.js');});
            var nativeNames=java.lang.reflect.Array.newInstance(java.lang.String,names.length);
            names.forEach(function(name,index){nativeNames[index]=new java.lang.String(String(name));});
            return nativeNames;
        };
        var guarded=MischWerkModules.createApp(MischWerkConfig);
        guarded.chatCommands.update(user,'');
        check(updates.length===0,'Fehlende Pflichtdatei verhindert nativen Neustartauftrag');
        check(messages[messages.length-1].indexOf('Kein Neustart')!==-1&&messages[messages.length-1].indexOf('server/users/nicklist-storage.js')!==-1,'Fehlenden relativen Pfad privat melden');
        check(MischWerkModules===originalModules&&MischWerkConfig===originalConfig,'Dateiprobe ersetzt keine globale Konfiguration oder Module');
        check(MischWerkUpdateProbe===null,'Temporäre Dateiprobe aufgeräumt');
        check(availableUpdateFiles.length===0&&scans>0,'Dateien übernommen, ohne Neustart auszulösen');
        missing=false;guarded.chatCommands.update(user,'');
        check(updates.length===1,'Nachliefern erlaubt Neustart trotz leerer neuer Änderungsmenge');
        guarded.chatCommands.update(user,'');check(updates.length===1,'Kein doppelter Neustart');

        availableUpdateFiles=['server/app.js'];updates=[];messages=[];
        var broken=MischWerkModules.createApp(MischWerkConfig);
        KnuddelsServer.listFiles=function(){throw new Error('private-native-details');};
        broken.chatCommands.update(user,'');
        check(updates.length===0&&messages[0].indexOf('Kein Neustart')!==-1,'Nicht prüfbare Plattformliste sperrt Neustart');
        check(messages[0].indexOf('private-native-details')===-1,'Keine internen Fehlermeldungen privat übernehmen');
        check(MischWerkUpdateProbe===null&&MischWerkModules===originalModules,'Fehler räumt Dateiprobe auf');

        availableUpdateFiles=['server/app.js'];updates=[];messages=[];
        KnuddelsServer.listFiles=originalList;
        var noPlan=MischWerkModules.createApp(MischWerkConfig);
        KnuddelsServer.execute=function(file){if(file==='server/app.js'){return;}originalExecute(file);};
        noPlan.chatCommands.update(user,'');
        check(updates.length===0&&messages[0].indexOf('Dateiliste')!==-1,'Fehlender Zielvertrag verhindert Neustart');
        check(MischWerkUpdateProbe===null&&MischWerkConfig===originalConfig,'Auch fehlender Zielvertrag verändert keine Konfiguration');
    } finally {
        KnuddelsServer.listFiles=originalList;KnuddelsServer.execute=originalExecute;
        availableUpdateFiles=savedFiles;updates=savedUpdates;people=savedPeople;cacheInvalidations=savedInvalidations;
    }
}());

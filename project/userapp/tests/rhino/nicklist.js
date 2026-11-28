/* Nicklisten-Icons aus zentralem Freigabesnapshot und bestätigter Sendung: Cleanup-Persistenz, eigene Radiositzung und Fehlerpfade. */
(function () {
    var previousChannel = KnuddelsServer.getChannel;
    var removalFailure = false, addFailure = false, writesFail = false, removals = 0;
    var team = 'https://mischwerk.invalid/img/nicklist/team.png';
    var microphone = 'https://mischwerk.invalid/img/nicklist/moderator.png';
    var headphones = 'https://mischwerk.invalid/img/nicklist/listener.png';
    var cleanupKey = 'mischwerk.nicklist-icons.v1', user = person(8137, 'DJ-Test', false), online = true;
    var roster = [], show = { active:false, nick:null }, display = { teamSignsEnabled:true, microphoneEnabled:true, headphonesEnabled:true };
    people = [user]; user.isOnlineInChannel = function () { return online; };
    user.getNick = function () { return new java.lang.String('DJ-Test'); };
    var data = {}, nativeIcons = {}, nativeAdd = user.addNicklistIcon;
    user.getPersistence = function () { return {
        getObject:function (key, fallback) { return Object.prototype.hasOwnProperty.call(data, key) ? copy(data[key]) : fallback; },
        setObject:function (key, value) { if (writesFail) { throw new Error('private write'); } data[key] = copy(value); }
    }; };
    user.addNicklistIcon = function (path, width) {
        check(data[cleanupKey].paths.some(function (entry) { return entry.path === String(path); }), 'Vor add dauerhaft vorgemerkt');
        nativeIcons[String(path)] = width; nativeAdd(path, width); if (addFailure) { throw new Error('private add'); }
    };
    user.removeNicklistIcon = function (path) { removals++; if (removalFailure) { throw new Error('private remove'); } delete nativeIcons[String(path)]; };
    KnuddelsServer.getChannel = function () { return { getOnlineUsers:function () { return online ? [user] : []; } }; };
    try {
        var runtime = MischWerkModules.createRuntime(MischWerkConfig);
        runtime.warn = function () {};
        MischWerkModules.attachChanges(runtime); MischWerkModules.attachIdentity(runtime, MischWerkConfig);
        runtime.receivedRoster = function () { return roster.slice(); };
        runtime.receivedShow = function () { return copy(show); };
        runtime.displaySettings = function () { return copy(display); };
        MischWerkModules.attachSessionState(runtime);
        var view = { kind:'radio', userId:8137, closed:false };
        var session = { getUser:function () { return user; }, getAppContent:function () { return view.content; } };
        view.content = { getSessions:function () { return [session]; } }; view.session = session;
        runtime.getViews = function () { return [view]; };
        MischWerkModules.attachNicklistStorage(runtime); MischWerkModules.attachNicklist(runtime);
        runtime.startNicklist();
        check(Object.keys(nativeIcons).length === 0, 'Ohne Freigabe, Sendung und Hörstatus keine Icons');
        roster = ['dj-test']; runtime.changed('station');
        check(nativeIcons[team] === 32, 'Teamzeichen aus zentraler Freigabe mit Java-Nick');
        display.teamSignsEnabled = false; runtime.changed('station');
        check(!nativeIcons[team], 'Teamzeichen lokal abschaltbar');
        display.teamSignsEnabled = true; runtime.changed('station');
        runtime.receiveListenerPresence(user, { active:true, sequence:1 }, session);
        check(nativeIcons[headphones] === 24, 'Hörer aus eigener Sitzung');
        runtime.receiveListenerPresence(user, { active:false, sequence:1 }, session);
        check(nativeIcons[headphones] === 24, 'Doppelte Sequenz wirkungslos');
        runtime.receiveListenerPresence(user, { active:false, sequence:2 }, { getUser:function () { return user; }, getAppContent:function () { return {}; } });
        check(nativeIcons[headphones] === 24, 'Fremde Sitzung ändert keinen Hörstatus');
        show = { active:true, nick:'DJ-Test' }; runtime.changed('station');
        check(nativeIcons[microphone] === 24 && !nativeIcons[headphones] && Object.keys(nativeIcons).length === 2, 'Mikrofon ersetzt Kopfhörer');
        display.microphoneEnabled = false; runtime.changed('station');
        check(!nativeIcons[microphone] && nativeIcons[headphones] === 24, 'Ausgeschaltetes Mikrofon zeigt nur bestätigtes Hören');
        display.microphoneEnabled = true; runtime.changed('station');
        removalFailure = true; show = { active:false, nick:null }; runtime.changed('station');
        check(nativeIcons[microphone] === 24 && !nativeIcons[headphones] && data[cleanupKey].paths.length === 2, 'Fehler erhält Nachweis und Limit');
        removalFailure = false; advance(1000);
        check(!nativeIcons[microphone] && nativeIcons[headphones] === 24, 'Entfernung nach Wiederholung');
        advance(44000); check(!nativeIcons[headphones], 'Serverfrist 45 Sekunden');
        writesFail = true; runtime.receiveListenerPresence(user, { active:true, sequence:3 }, session); check(!nativeIcons[headphones], 'Ohne Nachweis kein add');
        writesFail = false; addFailure = true; advance(1000); check(nativeIcons[headphones] === 24, 'Möglicherweise gesetztes Bild');
        addFailure = false; advance(2000); check(nativeIcons[headphones] === 24 && removals > 3, 'Unsicheren add bereinigt');
        show = { active:true, nick:'DJ-Test' }; runtime.changed('station');
        runtime.shuttingDown = true; runtime.stopNicklist();
        check(Object.keys(nativeIcons).length === 0 && data[cleanupKey].paths.length === 0 && timers.length === 0, 'Shutdown bereinigt Icons und gemeinsamen Timeout');
    } finally {
        KnuddelsServer.getChannel = previousChannel;
    }
}());

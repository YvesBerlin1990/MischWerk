/* Einheitliche Begrüßung, Bild-KCode und einmaliger Versand mit echten ES5-/Java-Wrappern. */
(function () {
    var savedBot = KnuddelsServer.getDefaultBotUser, savedChannel = KnuddelsServer.getChannel;
    var savedImage = KnuddelsServer.getFullImagePath;
    var sent = [], privateSent = [], privateAttempts = 0, privateFail = false, sendOrder = [];
    var online = [], attempts = 0, fail = false, logs = [], profileDisplays = [];
    var runtime = MischWerkModules.createRuntime(MischWerkConfig);
    runtime.state = { radioModeratorUserIds:[41, 42] };
    runtime.warn = function (code) { logs.push(code); };
    MischWerkModules.attachIdentity(runtime, MischWerkConfig);
    MischWerkModules.attachUserGreetings(runtime);
    function user(id, mcm) {
        return { getUserId:function () { return new java.lang.Long(id); },
            getNick:function () { return new java.lang.String('_Test°Nick'); },
            getProfileLink:function (displayText) {
                profileDisplays.push(String(displayText));
                var label = String(displayText).replace(/[<>]/g, function (character) { return '\\' + character; });
                return new java.lang.String('°>' + label + '|/w \\_Test\\°Nick<°');
            },
            getUserType:function () { return UserType.Human; },
            isOnlineInChannel:function () { return true; }, isChannelOwner:function () { return false; },
            isChannelModerator:function () { return mcm; }, hasProfilePhoto:function () { return true; },
            sendPrivateMessage:function (text) {
                sendOrder.push('private');
                privateAttempts += 1;
                if (privateFail) { throw new Error('private-welcome-detail'); }
                privateSent.push({ id:id, text:String(text) });
            },
            getProfilePhoto:function (width, height) {
                check(width === 24 && height === 24, 'Kleines Fotoformat angefragt');
                return new java.lang.String('https://example.invalid/photo.png');
            }
        };
    }
    KnuddelsServer.getChannel = function () { return { getOnlineUsers:function (type) {
        check(type === UserType.Human, 'Nur Menschen beim Start merken'); return online;
    } }; };
    KnuddelsServer.getDefaultBotUser = function () { return { sendPublicMessage:function (text) {
        sendOrder.push('public');
        attempts += 1; if (fail) { throw new Error('private-greeting-detail'); } sent.push(text);
    } }; };
    KnuddelsServer.getFullImagePath = function (name) { return new java.lang.String('https://mischwerk.invalid/' + name); };
    try {
        var listener = user(40, false), dj = user(41, false), both = user(42, true), mcm = user(43, true);
        runtime.initializeUserGreetings();
        [listener, dj, both, mcm].forEach(runtime.greetUser);
        check(sent.length === 4, 'Eine öffentliche Begrüßung je Rolle');
        check(privateSent[0].text.indexOf('°>LEFT<°°#r°°>CENTER<°') === 0 &&
            privateSent[0].text.indexOf('\n') === -1,
            'Links ausgerichtete Absenderzeile vor nativem KCode-Umbruch und Bildzentrierung');
        check(sendOrder.join(',') === 'private,public,private,public,private,public,private,public',
            'Jede private Grafik wird vor der öffentlichen Begrüßung versandt');
        var image = ' °>https://example.invalid/photo.png<>--<>|/w \\_Test\\°Nick<°';
        var greeting = '°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, °>\\_Test\\°Nick|/w \\_Test\\°Nick<°.§°r° Viel Spaß beim Zuhören.';
        check(profileDisplays[0] === '\\_Test\\°Nick' && profileDisplays[1] === 'Profil öffnen',
            'Native Profilfunktion erhält nur Text, Bildtag übernimmt das native Ziel');
        [0, 1, 2, 3].forEach(function (index) {
            check(sent[index] === greeting + image, 'Gleicher Text mit Foto am Ende in jeder Rolle');
            var welcome = privateSent[index];
            check(welcome.id === 40 + index, 'Private Grafik gehört ausschließlich zum Eintretenden');
            check(welcome.text.indexOf('banner...w_534.h_178.mw_534.mh_178.png<°') !== -1, 'Bannermaß erhält das Seitenverhältnis');
            check(welcome.text.indexOf('lieblingschannel.png<>--<>|/edit setlmc<°') !== -1 &&
                welcome.text.indexOf('channelinfo.png<>--<>|/info<°') !== -1, 'Aktive native Bildlinks');
            check(welcome.text.indexOf('mitmachen.png<>--<>|https://radio-mischwerk.web.app/<°') !== -1,
                'Website-Bildbutton verlinkt ausschließlich die bestätigte HTTPS-Adresse');
            check(welcome.text.replace(/°>[^°]*<°|°[^°]*°/g, '').replace(/\s/g, '') === '',
                'Nur Banner und drei Bildbuttons, kein zusätzlicher normaler Text');
            check(welcome.text.length < 9500, 'Private Nachricht bleibt begrenzt');
        });
        check(!runtime.isModerator(mcm), 'MCM ohne zusätzliche Radiorechte');
        runtime.greetUser(listener); check(sent.length === 4 && privateSent.length === 4, 'Doppelter Hook bleibt öffentlich und privat still');
        runtime.forgetUserGreeting(40); listener.getProfilePhoto = function () { throw new Error('private-photo'); };
        runtime.greetUser(listener); check(sent.length === 5 && sent[4] === greeting, 'Fotofehler erhält Text');
        runtime.forgetUserGreeting(40); listener.getProfilePhoto = function () { return 'https://example.invalid/a|/x'; };
        runtime.greetUser(listener); check(sent.length === 6 && sent[5] === greeting, 'KCode-Bildinjektion abgewiesen');
        runtime.forgetUserGreeting(40);
        var originalLink = listener.getProfileLink;
        listener.getProfileLink = function () { throw new Error('private-profile-link'); };
        listener.getProfilePhoto = function () { return new java.lang.String('https://example.invalid/photo.png'); };
        runtime.greetUser(listener);
        check(sent[sent.length - 1] === '°>{font}RobotoBold<°°16°°[230,199,123]°Willkommen bei Radio MischWerk, \\_Test\\°Nick.§°r° Viel Spaß beim Zuhören. °>https://example.invalid/photo.png<°',
            'Defekter Link erhält lesbare Begrüßung und Foto');
        listener.getProfileLink = originalLink;
        fail = true; runtime.forgetUserGreeting(40); var before = attempts;
        runtime.greetUser(listener); runtime.greetUser(listener);
        check(attempts === before + 1 && logs[logs.length - 1] === 'USER_GREETING', 'Botfehler einmalig und ohne private Details');
        check(privateSent[privateSent.length - 1].id === 40, 'Öffentlicher Fehler verhindert private Grafik nicht');
        fail = false; privateFail = true; runtime.forgetUserGreeting(40);
        var beforePrivate = privateAttempts;
        runtime.greetUser(listener); runtime.greetUser(listener);
        check(privateAttempts === beforePrivate + 1 && logs[logs.length - 1] === 'USER_WELCOME', 'Privater Versandfehler ohne Wiederholung');
        privateFail = false; runtime.clearUserGreetings(); online = [listener]; runtime.initializeUserGreetings();
        before = attempts; beforePrivate = privateAttempts; runtime.greetUser(listener);
        check(attempts === before && privateAttempts === beforePrivate, 'Start begrüßt Anwesende nicht nachträglich');
        runtime.forgetUserGreeting(mcm.getUserId());
        mcm.isChannelModerator = function () { throw new Error('private-role'); };
        runtime.greetUser(mcm);
        check(sent[sent.length - 1] === greeting + image, 'Begrüßung benötigt keinen Rollenabruf');
        before = attempts;
        listener.getUserType = function () { return 'appbot'; }; runtime.forgetUserGreeting(40);
        runtime.greetUser(listener); check(attempts === before, 'Keine Botbegrüßung');
        runtime.shuttingDown = true; runtime.greetUser(dj); check(attempts === before, 'Shutdown bleibt still');
    } finally {
        KnuddelsServer.getDefaultBotUser = savedBot; KnuddelsServer.getChannel = savedChannel;
        KnuddelsServer.getFullImagePath = savedImage;
    }
}());

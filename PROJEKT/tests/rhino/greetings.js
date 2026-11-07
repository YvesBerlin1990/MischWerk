/* Einheitliche Begrüßung, Bild-KCode und einmaliger Versand mit echten ES5-/Java-Wrappern. */
(function () {
    var savedBot = KnuddelsServer.getDefaultBotUser, savedChannel = KnuddelsServer.getChannel;
    var sent = [], online = [], attempts = 0, fail = false, logs = [], profileDisplays = [];
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
        attempts += 1; if (fail) { throw new Error('private-greeting-detail'); } sent.push(text);
    } }; };
    try {
        var listener = user(40, false), dj = user(41, false), both = user(42, true), mcm = user(43, true);
        runtime.initializeUserGreetings();
        [listener, dj, both, mcm].forEach(runtime.greetUser);
        check(sent.length === 4, 'Eine öffentliche Begrüßung je Rolle');
        var image = ' °>https://example.invalid/photo.png<>--<>|/w \\_Test\\°Nick<°';
        var greeting = '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>\\_Test\\°Nick|/w \\_Test\\°Nick<°._°r° Viel Spaß beim Zuhören.';
        check(profileDisplays[0] === '\\_Test\\°Nick' && profileDisplays[1] === 'Profil öffnen',
            'Native Profilfunktion erhält nur Text, Bildtag übernimmt das native Ziel');
        [0, 1, 2, 3].forEach(function (index) {
            check(sent[index] === greeting + image, 'Gleicher Text mit Foto am Ende in jeder Rolle');
        });
        check(!runtime.isModerator(mcm), 'MCM ohne zusätzliche Radiorechte');
        runtime.greetUser(listener); check(sent.length === 4, 'Doppelter Hook bleibt still');
        runtime.forgetUserGreeting(40); listener.getProfilePhoto = function () { throw new Error('private-photo'); };
        runtime.greetUser(listener); check(sent.length === 5 && sent[4] === greeting, 'Fotofehler erhält Text');
        runtime.forgetUserGreeting(40); listener.getProfilePhoto = function () { return 'https://example.invalid/a|/x'; };
        runtime.greetUser(listener); check(sent.length === 6 && sent[5] === greeting, 'KCode-Bildinjektion abgewiesen');
        runtime.forgetUserGreeting(40);
        var originalLink = listener.getProfileLink;
        listener.getProfileLink = function () { throw new Error('private-profile-link'); };
        listener.getProfilePhoto = function () { return new java.lang.String('https://example.invalid/photo.png'); };
        runtime.greetUser(listener);
        check(sent[sent.length - 1] === '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, \\_Test\\°Nick._°r° Viel Spaß beim Zuhören. °>https://example.invalid/photo.png<°',
            'Defekter Link erhält lesbare Begrüßung und Foto');
        listener.getProfileLink = originalLink;
        fail = true; runtime.forgetUserGreeting(40); var before = attempts;
        runtime.greetUser(listener); runtime.greetUser(listener);
        check(attempts === before + 1 && logs[logs.length - 1] === 'USER_GREETING', 'Botfehler einmalig und ohne private Details');
        fail = false; runtime.clearUserGreetings(); online = [listener]; runtime.initializeUserGreetings();
        before = attempts; runtime.greetUser(listener); check(attempts === before, 'Start begrüßt Anwesende nicht nachträglich');
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
    }
}());

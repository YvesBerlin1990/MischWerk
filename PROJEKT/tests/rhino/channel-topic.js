/* Native Java-Strings, KCode und Fehler im neuen Channel-Themenbefehl. */
(function () {
    var getChannel = KnuddelsServer.getChannel, topic = 'Bisheriges Thema', calls = 0, replies = [], failed = false;
    var information = {
        getTopic: function () { return new java.lang.String(topic); },
        setTopic: function (text, showMessage) {
            check(typeof text === 'string' && showMessage === true, 'Thema als primitiver String und Liveänderung');
            if (failed) { throw new Error('Private native Details'); }
            calls += 1; topic = text;
        }
    };
    KnuddelsServer.getChannel = function () { return { getChannelConfiguration: function () {
        return { getChannelInformation: function () { return information; } };
    } }; };
    try {
        var app = MischWerkModules.createApp(MischWerkConfig), present = true, ownerRight = true;
        var user = {
            getNick: function () { return new java.lang.String('Otterchen'); },
            isOnlineInChannel: function () { return present; }, isChannelOwner: function () { return ownerRight; },
            sendPrivateMessage: function (message) { replies.push(message); }
        };
        var raw = '  °[230,199,123]°_MischWerk_°r° ' +
            '°>{button}Lieblings-MyChannel|mw-lmc|call|/edit setlmc<° ' +
            '°>{button}Readme setzen|mw-readme|call|/readme Ich höre Radio MischWerk.<° ' +
            '°>{button}Channelinfo|mw-info|call|/info<°  ';
        check(typeof app.chatCommands.settopic === 'function' && calls === 0, 'Befehl registriert, kein automatisches Setzen');
        app.chatCommands.settopic(user, new java.lang.String(raw));
        check(topic === raw && calls === 1, 'Java-String mit KCode unverändert');
        app.chatCommands.settopic(user, raw);
        check(calls === 1, 'Identisches natives Thema ohne erneute Änderung');
        ownerRight = false; app.chatCommands.settopic(user, 'Gesperrt'); ownerRight = true;
        present = false; app.chatCommands.settopic(user, 'Gesperrt'); present = true;
        check(calls === 1, 'Rechte und Anwesenheit erneut geprüft');
        app.chatCommands.settopic(user, '   ');
        app.chatCommands.settopic(user, new Array(2502).join('a'));
        check(calls === 1, 'Leerer und überlanger Text abgewiesen');
        var maximum = new Array(2501).join('a'); app.chatCommands.settopic(user, maximum);
        check(topic.length === 2500 && calls === 2, '2500 Zeichen akzeptiert');
        failed = true; app.chatCommands.settopic(user, 'Fehler'); failed = false;
        check(topic === maximum && replies[replies.length - 1].indexOf('konnte gerade nicht') !== -1, 'Native Ausnahme ohne falschen Erfolg');
        check(replies.join(' ').indexOf('Private native Details') === -1, 'Keine privaten API-Details in Antworten');
        app.chatCommands.settopic(user, new java.lang.String('--buttons'));
        check(topic.indexOf('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|') !== -1,
            'Serverseitiger Lieblings-MyChannel-Button mit dokumentierten Eigenschaften');
        check(topic.indexOf('°>{button}Readme setzen||call|/readme Ich höre Radio MischWerk.|color|') !== -1,
            'Serverseitiger Readme-Button');
        check(topic.indexOf('°>{button}Channelinfo||call|/info|color|') !== -1, 'Serverseitiger Infobutton');
        check(replies[replies.length - 1].indexOf('3 von 3') !== -1, 'Rücklesen bestätigt drei gespeicherte Button-Elemente');
        var savedCalls = calls;
        app.chatCommands.settopic(user, '--pruefen');
        check(calls === savedCalls && replies[replies.length - 1].indexOf('Button-Elemente: 3') !== -1,
            'Prüfbefehl liest nur, ohne erneuten Setzaufruf');
        var originalSetter = information.setTopic;
        information.setTopic = function (text, showMessage) {
            originalSetter(text.replace(/°>\{button\}[^°]*<°/g, ''), showMessage);
        };
        topic = 'Anderer Text';
        app.chatCommands.settopic(user, '--buttons');
        check(replies[replies.length - 1].indexOf('veränderten Text') !== -1 &&
            replies[replies.length - 1].indexOf('0 von 3') !== -1, 'Native Filterung wird im Rücklesen erkannt');
    } finally { KnuddelsServer.getChannel = getChannel; }
}());

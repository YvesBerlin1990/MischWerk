/* Derselbe ES5-Speicher und Versandtimer in beiden echten Rhino-Engines. Keine echte Nachricht. */
var channelTextTasks = {}, channelTextTimerId = 0, channelTextTime = 100000000;
function setTimeout(callback, delay) {
    var id = ++channelTextTimerId;
    channelTextTasks[id] = { callback:callback, at:channelTextTime + delay };
    return id;
}
function clearTimeout(id) { delete channelTextTasks[id]; }
(function () {
    var previousPersistence = KnuddelsServer.getPersistence, previousBot = KnuddelsServer.getDefaultBotUser;
    var data = {}, messages = [], failWrite = false, failSend = false, attempts = 0;
    KnuddelsServer.getPersistence = function () { return {
        getObject:function (key, fallback) { return data[key] ? copy(data[key]) : fallback; },
        setObject:function (key, value) { if (failWrite) { throw new Error('private'); } data[key] = copy(value); }
    }; };
    KnuddelsServer.getDefaultBotUser = function () { return { sendPublicMessage:function (message) {
        attempts += 1; if (failSend) { throw new Error('private'); } messages.push(message);
    } }; };
    function advance(minutes) {
        channelTextTime += minutes * 60000;
        Object.keys(channelTextTasks).forEach(function (id) {
            var task = channelTextTasks[id];
            if (task && task.at <= channelTextTime) { delete channelTextTasks[id]; task.callback(); }
        });
    }
    function create() {
        var runtime = MischWerkModules.createRuntime({});
        runtime.now = function () { return channelTextTime; };
        runtime.warn = function () {};
        runtime.isChannelOwner = function (user) { return user === 'owner'; };
        runtime.canAdminister = runtime.isChannelOwner;
        MischWerkModules.attachChannelTextStorage(runtime);
        MischWerkModules.attachChannelTextScheduler(runtime);
        return runtime;
    }
    function configure(runtime, interval, enabled) {
        var state = runtime.readChannelTexts(), valid = runtime.validateChannelTexts({ enabled:enabled, interval:interval, texts:['°Erster°', '', 'Zweiter'] });
        state.enabled = valid.enabled; state.interval = valid.interval; state.texts = valid.texts;
        state.revision += 1; state.cursor = 0; state.nextAt = enabled ? channelTextTime + interval * 60000 : 0;
        runtime.storeChannelTexts(state); runtime.restartChannelTexts();
    }
    try {
        [20, 30, 40, 50].forEach(function (interval) {
            data = {}; messages = []; channelTextTasks = {};
            var runtime = create(); runtime.startChannelTexts();
            check(!runtime.readChannelTexts().enabled && Object.keys(channelTextTasks).length === 0, 'Bot-Texte anfangs aus');
            check(runtime.channelTextsView('listener') === null, 'Bot-Texte privat');
            configure(runtime, interval, true);
            var old = channelTextTasks[Object.keys(channelTextTasks)[0]].callback;
            runtime.startChannelTexts(); check(Object.keys(channelTextTasks).length === 1, 'Nur ein Timer nach doppeltem Start');
            advance(interval - 1); check(messages.length === 0, 'Kein vorzeitiger Versand');
            advance(1); check(messages[0] === '\\°Erster\\°', 'Klartext nach gewähltem Abstand');
            advance(interval); check(messages[1] === 'Zweiter', 'Leere Felder übersprungen');
            runtime.stopChannelTexts(); old(); check(Object.keys(channelTextTasks).length === 0, 'Alten Rückruf nach Stopp abgewiesen');
            var restarted = create(); restarted.startChannelTexts();
            advance(interval); check(messages.length === 3 && messages[2] === '\\°Erster\\°', 'Reihenfolge über Neustart');
            configure(restarted, interval, false); advance(500);
            check(messages.length === 3 && Object.keys(channelTextTasks).length === 0, 'Ausgeschaltet bleibt aus');
        });
        data = {}; messages = []; channelTextTasks = {};
        var runtime = create(); runtime.startChannelTexts(); configure(runtime, 20, true);
        failWrite = true; advance(20); check(messages.length === 0, 'Bei Speicherfehler keine Ausgabe');
        failWrite = false; failSend = true; var before = attempts;
        advance(19); check(attempts === before, 'Keine schnelle Wiederholung');
        advance(1); check(attempts === before + 1, 'Sendeversuch nach vollem Abstand');
        failSend = false; advance(20); check(messages[0] === 'Zweiter', 'Unsicherer Text wird nicht sofort wiederholt');
        advance(500); check(messages.length === 2, 'Keine Nachholserie');
        runtime.stopChannelTexts();
        var rejected = 0;
        [{enabled:true,interval:25,texts:['x']}, {enabled:true,interval:20,texts:['']},
            {enabled:true,interval:20,texts:[new Array(302).join('x')]}].forEach(function (invalid) {
            try { runtime.validateChannelTexts(invalid); } catch (error) { rejected += 1; }
        });
        check(rejected === 3, 'Intervalle, leere Aktivierung und Länge in Rhino validiert');
    } finally {
        KnuddelsServer.getPersistence = previousPersistence; KnuddelsServer.getDefaultBotUser = previousBot;
        channelTextTasks = {};
    }
}());

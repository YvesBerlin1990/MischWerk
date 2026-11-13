/* Öffentliche Homepagewochen über den dokumentierten GET-Port, auch als Java-String. */
(function () {
    var original = KnuddelsServer.getExternalServerAccess, calls = [], stamp = Date.parse('2026-11-11T18:30:00Z');
    var r = { now:function () { return stamp; }, failure:function (message) { var e = new Error(message); e.publicMessage = message; return e; }, warn:function () {} };
    MischWerkModules.attachScheduleCalendar(r);
    MischWerkModules.attachScheduleProgramme(r, {});
    MischWerkModules.attachPublicScheduleData(r);
    MischWerkModules.attachPublicSchedule(r);
    MischWerkModules.attachScheduleDay(r);
    var date = r.scheduleToday(), week = r.scheduleWeek(date), days = [], received = [];
    for (var i = 0; i < 7; i += 1) { days.push(r.scheduleDay(week, i)); }
    var row = {id:'web', date:date, week:week, start:'00:00', end:'00:00', until:null, kind:'autodj', timing:'allDay', generated:true,
        topic:'MischWerk Radio Show', moderator:'MischWerk am Pult'};
    function body(entries) { return JSON.stringify({version:1, ok:true, ready:true, week:week, today:date, days:days, revision:0, entries:entries}); }
    function reply(index, raw, code) {
        var call = calls[index];
        call.callbacks.onSuccess(new java.lang.String(raw), {getResponseCode:function () { return new java.lang.Integer(code || 200); },
            getURLString:function () { return new java.lang.String(call.url); }});
    }
    function receive(error, value) { received.push({error:error, value:value}); }
    KnuddelsServer.getExternalServerAccess = function () { return {canAccessURL:function () { return true; },
        getURL:function (url, callbacks) { calls.push({url:url, callbacks:callbacks}); }}; };
    try {
        var first = {}, second = {}, timers = pinTimers.length;
        r.readPublicSchedule(week, first, receive); r.readPublicSchedule(week, first, receive); r.readPublicSchedule(week, second, receive);
        check(calls.length === 1 && received.length === 0, 'Öffentliche GETs werden zusammengefasst und vor Antwort nicht bestätigt');
        reply(0, body([row])); check(received.length === 2 && !received[0].error, 'Nur jüngster Auftrag pro Inhalt, beide Hörer erhalten die Antwort');
        check(pinTimers.length === timers, 'Erfolgreicher GET räumt Timeout auf');
        var shown = r.scheduleDayPage(r.scheduleDayContext(date), 0, received[0].value);
        check(shown.entries[0].topic === row.topic && shown.entries[0].nick === row.moderator, 'JSON-Titel und Moderation unverändert');
        check(shown.entries[0].allDay && shown.entries[0].until - shown.entries[0].from === 1440, 'Generierte Ganztagszeile hat volle Berliner Tagesdauer');
        check(JSON.stringify(shown).length < 9500 && JSON.stringify(shown).indexOf('generated') === -1, 'Tagespaket bleibt begrenzt und enthält nur die Anzeige');
        r.readPublicSchedule(week, first, receive); check(calls.length === 1, 'Kurzer Cache erzeugt keinen weiteren Abruf');
        stamp += 60000; r.readPublicSchedule(week, first, receive); row.topic = ''; row.moderator = 'Polaroid'; row.kind = 'live'; row.timing = 'fixed'; row.start = '12:00'; row.end = '14:00';
        reply(1, body([row])); shown = r.scheduleDayPage(r.scheduleDayContext(date), 0, received[received.length-1].value);
        check(shown.entries[0].topic === 'Live-Sendung' && shown.entries[0].nick === 'Polaroid', 'Leerer Titel verwendet denselben sichtbaren Webtext');
        var signature = shown.signature;
        stamp += 60000; r.readPublicSchedule(week, first, receive); row.topic = 'Neuer Titel'; reply(2, body([row]));
        check(r.scheduleDayPage(r.scheduleDayContext(date), 0, received[received.length-1].value).signature !== signature, 'Inhaltswechsel trotz Revision 0 wechselt die Signatur');
        stamp += 60000; r.readPublicSchedule(week, first, receive); reply(3, '<html>Fehler</html>');
        check(!!received[received.length-1].error, 'Ungültige JSON-Antwort ist Fehler und kein leerer Tag');
        r.readPublicSchedule(week, first, receive); var delayed = calls.length-1;
        var timer = pinTimers[pinTimers.length-1]; stamp += 10000; timer.callback();
        check(!!received[received.length-1].error, 'GET-Zeitablauf meldet Fehler');
        var count = received.length; reply(delayed, body([row])); check(received.length === count, 'Verspätete Antwort nach Timeout bleibt verworfen');
        r.readPublicSchedule(week, first, receive); delayed = calls.length-1; r.stopPublicSchedule(); reply(delayed, body([row]));
        check(received.length === count && pinTimers.length === timers, 'Shutdown räumt Auftrag und Timeout auf');
        var rejected = false; try { r.scheduleDayContext('2026-02-30'); } catch (error) { rejected = true; }
        check(rejected, 'Ungültige Tagesdaten bleiben abgewiesen');
        var start = r.scheduleDay(week, -7), end = r.scheduleDay(week, 13), snapshot = {entries:[], signature:'test', checkedAt:stamp};
        check(r.scheduleDayPage(r.scheduleDayContext(start), 0, snapshot).previous === null, 'Vorwochenmontag sperrt Zurück');
        check(r.scheduleDayPage(r.scheduleDayContext(end), 0, snapshot).next === null, 'Folgewochensonntag sperrt Weiter');
        [r.scheduleDay(start, -1), r.scheduleDay(end, 1)].forEach(function (outside) {
            var denied = false; try { r.scheduleDayContext(outside); } catch (error) { denied = true; }
            check(denied, 'Außentag bleibt serverseitig gesperrt');
            var before = calls.length;
            r.readPublicSchedule(r.scheduleWeek(outside), first, receive);
            check(calls.length === before && !!received[received.length-1].error, 'Außenwoche erzeugt keinen GET');
        });
    } finally { r.stopPublicSchedule(); KnuddelsServer.getExternalServerAccess = original; }
}());

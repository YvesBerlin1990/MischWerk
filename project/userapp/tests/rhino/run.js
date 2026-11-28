/* Einstieg der Rhino-Prüfung: lädt das Plattformmodell und führt alle Suiten nacheinander aus. Jeder Fehler beendet den Lauf mit Exitcode 1. */
load('tests/rhino/harness.js');
var rhinoSuites = ['access', 'wishes', 'relay-v2', 'android-signing', 'android-settings', 'android-operation',
    'channel-topic', 'public-schedule', 'channel-texts', 'greetings', 'nicklist', 'update', 'ticker'];
(function () {
    var current = '';
    try {
        rhinoSuites.forEach(function (name) {
            current = name;
            var before = assertions;
            resetPlatform();
            load('tests/rhino/' + name + '.js');
            var passed = assertions - before;
            if (passed === 0) { throw new Error('Suite ohne Prüfungen'); }
            print('Suite ' + name + ': ' + passed + ' Prüfungen bestanden');
        });
    } catch (error) {
        print('FEHLER in Suite ' + current + ': ' + (error && error.message ? error.message : error));
        if (error && error.stack) { print(error.stack); }
        java.lang.System.exit(1);
    }
    print('Rhino OK: ' + rhinoSuites.length + ' Suiten, ' + assertions + ' Prüfungen');
}());

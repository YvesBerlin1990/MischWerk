/* Absichtlich interpretierter Rhino: pro Callback deutlich unter dem nativen 10-s-Limit. */
var mischWerkAppRoot = typeof mischWerkAppRoot === 'string' ? mischWerkAppRoot : 'app';
var MischWerkModules = {}, runtime = { now:function () { return new Date().getTime(); } };
var KnuddelsServer = { execute:function (file) { load(mischWerkAppRoot + '/' + file); } };
// Auch gebündelte Auslieferungspfade über deren wirklichen Ladeplan finden.
var composition = String(readFile(mischWerkAppRoot + '/server/app.js'));
var pattern = /KnuddelsServer\.execute\('([^']+)'\);/g, match;
while ((match = pattern.exec(composition))) {
    var source = String(readFile(mischWerkAppRoot + '/' + match[1]));
    if (/attachPinConstants1|attachPinConstants2|attachPinBcrypt/.test(source)) { load(mischWerkAppRoot + '/' + match[1]); }
}
MischWerkModules.attachPinConstants1(runtime); MischWerkModules.attachPinConstants2(runtime); MischWerkModules.attachPinBcrypt(runtime);
var salt = [], output = null, count = 0, maximum = 0, total = runtime.now();
for (var i = 0; i < 16; i += 1) { salt.push(i); }
var work = runtime.createPinBcrypt('2:0123', salt);
while (!output) {
    var started = runtime.now(); output = work.step(); maximum = Math.max(maximum, runtime.now() - started); count += 1;
    if (maximum >= 1000 || count > 1024) { throw new Error('PIN-Einzelschritt überschreitet das 1-s-Prüfbudget: ' + maximum); }
}
var hash = output.map(function (value) { return ('0' + value.toString(16)).slice(-2); }).join('');
if (hash !== '6b1efc45725197bde80955c1acfeac18b1f292f408acaa' || count < 16) { throw new Error('bcrypt-10-Vektor oder Aufteilung falsch'); }
print('Rhino-PIN-Budget OK: ' + count + ' Schritte, maximal ' + maximum + ' ms, gesamt ' + (runtime.now() - total) + ' ms; bcrypt-10 unverändert.');

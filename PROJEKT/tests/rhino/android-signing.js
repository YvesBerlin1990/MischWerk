/* Unveränderte Dummy-Vektoren plus UTF-8 in beiden echten Rhino-Engines. */
(function () {
    var runtime = MischWerkModules.createRuntime(MischWerkConfig), oldRandom = RandomOperations;
    MischWerkModules.attachAndroidSigning(runtime);
    var key = 'test-key-not-a-secret', ts = '1793996865399', nonce = 'AbCdEf0123456789';
    var payload = '{"station":{"wishboxOpen":true,"onAir":false,"moderatorNick":null,"topic":null,"updatedAt":1793996865399},"wishUpdates":[]}';
    check(runtime.androidSignFields('{}', key, ts, nonce).sig === '0487288b27421657f5979a4beadb8ad1c7431b4fdef43415a4e6acc94cd8e174', 'Firebase-Dummy-Vektor leeres Objekt');
    check(runtime.androidSignFields(payload, key, ts, nonce).sig === 'ad684ff593903a9b892c0b2190a582c64db8d247cbb354f072ae9638f849d6ac', 'Firebase-Dummy-Vektor Sender');
    check(runtime.androidHmacSha256('Ä😀', 'Grüße 🎵😀\n') === '1df5683a3c4c30d0248aa353a58b14dc983faceedf65d54fb859367619fa608a', 'UTF-8 und Surrogatpaare stimmen mit unabhängigem Node-Vektor');
    check(runtime.androidHmacSha256(new Array(21).join('\x0b'), 'Hi There') === 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7', 'RFC-4231-Vektor');
    ['A-Za-z0-9-------', '', 'abcdefghijklmnopq'].forEach(function (bad) {
        var failed = false; try { runtime.androidSignFields('{}', key, ts, bad); } catch (error) { failed = true; }
        check(failed, 'Ungültige Nonce abgewiesen');
    });
    try {
        runtime.now = function () { return Number(ts); };
        RandomOperations = { getRandomString: function (length, alphabet) {
            check(length === 16 && alphabet === 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'Vollständiges Zeichenalphabet statt Regex');
            return new java.lang.String(nonce);
        } };
        var packet = runtime.createAndroidSignedData({ topic: 'Ä😀' }, key);
        check(packet.nonce === nonce && packet.ts === ts && packet.payload === JSON.stringify({ topic: 'Ä😀' }), 'Native String-Nonce und unverändertes JSON');
        check(Object.keys(packet).sort().join(',') === 'nonce,payload,sig,ts', 'Nur vier stringwertige Transportfelder');
    } finally { RandomOperations = oldRandom; }
}());

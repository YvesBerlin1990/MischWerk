/* Textnormalisierung und Rhino-kompatible Linkpruefung. */
MischWerkModules.attachValidation = function (runtime, config) {
    'use strict';

    runtime.text = function (value, max, required) {
        if (typeof value !== 'string') { throw runtime.failure('Bitte gültigen Text eingeben.'); }
        var clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
        if ((required && !clean) || clean.length > max) {
            throw runtime.failure('Bitte die Eingabe prüfen (maximal ' + max + ' Zeichen).');
        }
        return clean;
    };

    runtime.containsWishLink = function (value) {
        var candidate = value.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\u3002\uff0e\uff61]/g, '.');
        try { candidate = decodeURIComponent(candidate); } catch (ignored) { /* Prozentzeichen dürfen im Songtitel stehen. */ }
        // Rhino wirft beim Auswerten des Unicode-Bereichs mit /i einen SyntaxError.
        // Nur die Prüfkopie kleinschreiben; der originale Wunschtext bleibt unverändert.
        candidate = candidate.toLowerCase();
        if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|[\s(<])\/\/|(?:^|[\s(<])(?:www\.|spotify:|mailto:|magnet:|javascript:|data:)/.test(candidate)) { return true; }
        // Initialen in Namen wie will.i.am oder M.I.A. nicht mit einer Domain verwechseln.
        return /(^|[\s(<\["'|])(?:[a-z0-9\u00c0-\u024f-]+\.)*[a-z0-9\u00c0-\u024f][a-z0-9\u00c0-\u024f-]+\.(?:[a-z\u00c0-\u024f]{2,63}|xn--[a-z0-9-]+)(?=$|[\/:?#\s)>\]"',;!])/.test(candidate) ||
            /(^|[\s(<])(?:x\.com|t\.co|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?=$|[\/:?#\s)>])/.test(candidate);
    };
};

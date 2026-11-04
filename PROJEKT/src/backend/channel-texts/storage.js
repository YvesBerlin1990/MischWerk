/* Private, versionierte Bot-Texte; allgemeiner Appzustand und Wünsche bleiben getrennt. */
MischWerkModules.attachChannelTextStorage = function (runtime) {
    'use strict';
    var key = 'mischwerk.channelTexts.v1', cached = null;
    function integer(value) { return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0; }
    runtime.validateChannelTexts = function (data) {
        if (!data || typeof data.enabled !== 'boolean' || [20, 30, 40, 50].indexOf(data.interval) === -1 ||
                !Array.isArray(data.texts) || data.texts.length < 1 || data.texts.length > 6) {
            throw runtime.failure('Bitte wähle 20, 30, 40 oder 50 Minuten und höchstens sechs Texte.');
        }
        var texts = data.texts.map(function (text) {
            if (typeof text !== 'string' || text.length > 300 || /[\x00-\x08\x0b-\x1f\x7f]/.test(text.replace(/\r\n?/g, '\n'))) {
                throw runtime.failure('Jeder Bot-Text darf höchstens 300 Zeichen und keine Steuerzeichen enthalten.');
            }
            return text.replace(/\r\n?/g, '\n').replace(/^\s+|\s+$/g, '');
        });
        if (data.enabled && !texts.some(function (text) { return !!text; })) {
            throw runtime.failure('Bitte trage zum Aktivieren mindestens einen Text ein.');
        }
        return { enabled:data.enabled, interval:data.interval, texts:texts };
    };
    runtime.readChannelTexts = function () {
        if (cached) { return runtime.copy(cached); }
        var stored = KnuddelsServer.getPersistence().getObject(key, null);
        var initial = { version:1, revision:0, enabled:false, interval:20, texts:['', ''], cursor:0, nextAt:0 };
        if (stored) {
            try {
                var valid = runtime.validateChannelTexts(stored);
                if (stored.version !== 1 || !integer(stored.revision) || !integer(stored.cursor) ||
                        stored.cursor >= valid.texts.length || !integer(stored.nextAt)) { throw new Error('Invalid settings'); }
                initial = { version:1, revision:stored.revision, enabled:valid.enabled, interval:valid.interval,
                    texts:valid.texts, cursor:stored.cursor, nextAt:stored.nextAt };
            } catch (error) {
                runtime.warn('CHANNEL_TEXTS_INVALID');
                throw runtime.failure('Gespeicherte Bot-Texte sind ungültig. Bitte die App-Daten prüfen lassen.');
            }
        }
        cached = initial;
        return runtime.copy(cached);
    };
    runtime.storeChannelTexts = function (next) {
        try { KnuddelsServer.getPersistence().setObject(key, next); }
        catch (error) { runtime.warn('CHANNEL_TEXTS_SAVE'); throw runtime.failure('Bot-Texte konnten nicht gespeichert werden. Bitte erneut versuchen.'); }
        cached = runtime.copy(next);
    };
    runtime.channelTextsView = function (user) {
        if (!runtime.isChannelOwner(user)) { return null; }
        var state = runtime.readChannelTexts();
        return { revision:state.revision, enabled:state.enabled, interval:state.interval, texts:state.texts, nextAt:state.nextAt };
    };
};

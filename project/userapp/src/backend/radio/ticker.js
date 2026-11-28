/* Senderweiter Lauftext; nur authentifizierte Radiomoderation darf bestätigte Werte ändern. */
MischWerkModules.attachTicker = function (runtime) {
    'use strict';
    var completed = [], FONTS = ['petit-formal-script', 'josefin-sans', 'rajdhani'];
    runtime.tickerState = function () {
        var value = runtime.state.ticker || {};
        var text = typeof value.text === 'string' && value.text.length <= 300 ? runtime.text(value.text, 300, false) : '';
        return { text:text, enabled:value.enabled === true && !!text,
            speed:[32, 48, 72].indexOf(value.speed) !== -1 ? value.speed : 48,
            direction:value.direction === 'right' ? 'right' : 'left',
            // Ohne gespeicherte Auswahl gilt Petit Formal Script.
            font:FONTS.indexOf(value.font) !== -1 ? value.font : FONTS[0],
            revision:typeof value.revision === 'number' && isFinite(value.revision) && value.revision >= 0 &&
                Math.floor(value.revision) === value.revision ? value.revision : 0 };
    };
    runtime.changeTicker = function (user, data) {
        if (runtime.shuttingDown || !runtime.canUseAdministration(user)) { throw runtime.failure('Keine Berechtigung für die Lauftextverwaltung.'); }
        if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId) ||
                typeof data.enabled !== 'boolean' || [32, 48, 72].indexOf(data.speed) === -1 ||
                ['left', 'right'].indexOf(data.direction) === -1 || (data.font !== undefined && FONTS.indexOf(data.font) === -1)) {
            throw runtime.failure('Bitte die Lauftext-Einstellungen prüfen.');
        }
        var text = runtime.text(data.text, 300, data.enabled);
        var userId = runtime.userId(user), current = runtime.tickerState();
        // Ältere Anfragen ohne Schriftfeld behalten die aktuelle Schrift.
        var font = data.font === undefined ? current.font : data.font;
        var signature = JSON.stringify([text, data.enabled, data.speed, data.direction, font, data.expectedTickerRevision]);
        var previous = completed.filter(function (item) { return item.userId === userId && item.id === data.requestId; })[0];
        if (previous) {
            if (previous.signature !== signature) { throw runtime.failure('Diese Anfrage wurde bereits verwendet. Bitte erneut speichern.'); }
            return 'Lauftext bereits gespeichert.';
        }
        if (data.expectedTickerRevision !== current.revision) {
            throw runtime.failure('Der Lauftext wurde inzwischen geändert. Dein Entwurf bleibt erhalten. Bitte den aktuellen Stand laden.');
        }
        var next = runtime.copy(runtime.state);
        next.ticker = { text:text, enabled:data.enabled, speed:data.speed, direction:data.direction, font:font, revision:current.revision + 1 };
        runtime.persist(next);
        completed.push({ userId:userId, id:data.requestId, signature:signature });
        if (completed.length > 32) { completed.shift(); }
        return 'Lauftext gespeichert.';
    };
};

/* Leere dunkle Overlay-Abdeckung; deaktiviert verwendet der Lader keine Farben. */
MischWerkModules.configureLoading = function (loading, enabled) {
    'use strict';
    [
        ['setText', ''],
        ['setForegroundColor', '#0a0a0a'],
        ['setBackgroundColor', '#0a0a0a'],
        ['setEnabled', enabled === true]
    ].forEach(function (setting) {
        try {
            if (loading && typeof loading[setting[0]] === 'function') {
                loading[setting[0]](setting[0].indexOf('Color') === -1 ? setting[1] : Color.fromHexString(setting[1]));
            }
        } catch (ignored) { /* Fehlende optionale Eigenschaften dürfen die Ansicht nicht verhindern. */ }
    });
};

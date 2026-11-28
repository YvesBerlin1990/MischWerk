/* Lokale Anzeigeeinstellungen; keine Schreibautorität für Firebase-Sendungen. */
MischWerkModules.attachDisplaySettings = function(runtime) {
    'use strict';
    var completed = [];
    runtime.displaySettings = function() {
        var value = runtime.state.nativeDisplay || {};
        return {
            teamSignsEnabled: value.teamSignsEnabled !== false,
            microphoneEnabled: value.microphoneEnabled !== false,
            headphonesEnabled: value.headphonesEnabled !== false,
            announcementsEnabled: value.announcementsEnabled !== false,
            theme: value.theme === 'xmas' ? 'xmas' : 'normal',
            revision: typeof value.revision === 'number' && isFinite(value.revision) && value.revision >= 0 ?
                value.revision : 0
        };
    };
    runtime.changeDisplaySettings = function(user, data) {
        if (runtime.shuttingDown || !runtime.canUseAdministration(user)) {
            throw runtime.failure('Keine Berechtigung für die Anzeigeverwaltung.');
        }
        var current = runtime.displaySettings();
        var themeOnly = data.themeOnly === true;
        if (themeOnly) {
            data.teamSignsEnabled = current.teamSignsEnabled;
            data.microphoneEnabled = current.microphoneEnabled;
            data.headphonesEnabled = current.headphonesEnabled;
            data.announcementsEnabled = current.announcementsEnabled;
        }
        if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId) ||
            (data.theme !== undefined && data.theme !== 'normal' && data.theme !== 'xmas') ||
            (themeOnly && data.theme === undefined) ||
            typeof data.teamSignsEnabled !== 'boolean' || typeof data.announcementsEnabled !== 'boolean' ||
            (data.microphoneEnabled !== undefined && typeof data.microphoneEnabled !== 'boolean') ||
            (data.headphonesEnabled !== undefined && typeof data.headphonesEnabled !== 'boolean')) {
            throw runtime.failure('Bitte die Anzeigeeinstellungen prüfen.');
        }
        var signature = themeOnly ? JSON.stringify(['theme', data.theme, data.expectedRevision]) :
            JSON.stringify([data.teamSignsEnabled, data.microphoneEnabled, data.headphonesEnabled,
                data.announcementsEnabled, data.expectedRevision, data.theme]);
        var previous = completed.filter(function(row) {
            return row.userId === runtime.userId(user) && row.id === data.requestId;
        })[0];
        if (previous) {
            if (previous.signature !== signature) {
                throw runtime.failure('Diese Anfrage wurde bereits anders verwendet.');
            }
            return 'Anzeige bereits gespeichert.';
        }
        var theme = data.theme === undefined ? current.theme : data.theme;
        var microphone = data.microphoneEnabled === undefined ? current.microphoneEnabled : data.microphoneEnabled;
        var headphones = data.headphonesEnabled === undefined ? current.headphonesEnabled : data.headphonesEnabled;
        if (data.expectedRevision !== current.revision) {
            throw runtime.failure('Die Anzeige wurde inzwischen geändert. Bitte erneut laden.');
        }
        if (data.teamSignsEnabled !== current.teamSignsEnabled || microphone !== current.microphoneEnabled ||
            headphones !== current.headphonesEnabled || data.announcementsEnabled !== current
            .announcementsEnabled || theme !== current.theme) {
            var next = runtime.copy(runtime.state);
            next.nativeDisplay = {
                teamSignsEnabled: data.teamSignsEnabled,
                microphoneEnabled: microphone,
                headphonesEnabled: headphones,
                announcementsEnabled: data.announcementsEnabled,
                theme: theme,
                revision: current.revision + 1
            };
            runtime.persist(next);
        }
        completed.push({
            userId: runtime.userId(user),
            id: data.requestId,
            signature: signature
        });
        if (completed.length > 32) {
            completed.shift();
        }
        return 'Anzeige gespeichert.';
    };
};

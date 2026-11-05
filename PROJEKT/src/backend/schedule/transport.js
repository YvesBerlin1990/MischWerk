/* Eigenständiges, paginiertes Sendeplan-Protokoll; Radiozustand bleibt klein. */
MischWerkModules.attachScheduleTransport = function (runtime) {
    'use strict';
    runtime.notifySchedule = function () {
        runtime.getViews().forEach(function (view) {
            if (view.kind !== 'schedule') { return; }
            try {
                view.content.getSessions().forEach(function (session) { runtime.send(session, 'mw:schedule.changed', {}); });
            } catch (error) { runtime.warn('SCHEDULE_NOTIFY', error); }
        });
    };
    runtime.handleScheduleEvent = function (user, type, data, session) {
        var requestId = null;
        try {
            runtime.load();
            if (!data || typeof data !== 'object' || Array.isArray(data) ||
                    typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                throw runtime.failure('Ungültige Sendeplan-Anfrage. Bitte erneut öffnen.');
            }
            requestId = data.requestId;
            if (runtime.shuttingDown) { throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte später erneut öffnen.'); }
            if (type === 'mw:schedule.get') {
                var result = runtime.schedulePage(user, data.week, data.page);
                result.requestId = requestId;
                if (JSON.stringify(result).length >= 9500) { throw new Error('schedule packet'); }
                runtime.send(session, 'mw:schedule.data', result);
                return;
            }
            runtime.changeSchedule(user, type, data);
            runtime.send(session, 'mw:schedule.result', { requestId: requestId, ok: true,
                message: type === 'mw:schedule.delete' ? 'Sendung entfernt.' : 'Sendung gespeichert.' });
            runtime.notifySchedule();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('SCHEDULE_ACTION', error); }
            runtime.send(session, 'mw:schedule.result', { requestId: requestId, ok: false,
                message: error.publicMessage || 'Der Sendeplan konnte nicht gespeichert oder geladen werden. Bitte erneut versuchen.' });
        }
    };
};

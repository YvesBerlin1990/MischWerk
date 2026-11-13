/* Eigenständiges, paginiertes Sendeplan-Protokoll; Radiozustand bleibt klein. */
MischWerkModules.attachScheduleTransport = function (runtime) {
    'use strict';
    runtime.observeChanges(function (kind, week) {
        if (kind !== 'schedule') { return; }
        runtime.invalidatePublicSchedule(week);
        runtime.getViews().forEach(function (view) {
            if (view.kind !== 'schedule') { return; }
            view.content.getSessions().forEach(function (session) { runtime.send(session, 'mw:schedule.changed', {week:week || null}); });
        });
    });
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
            if (type === 'mw:schedule.day') {
                var context = runtime.scheduleDayContext(data.date), page = data.page;
                runtime.readPublicSchedule(context.week, session.getAppContent(), function (error, snapshot) {
                    if (runtime.shuttingDown || !runtime.activeSession(user, session)) { return; }
                    try {
                        if (error) { throw error; }
                        if (!data.date && context.date !== runtime.scheduleToday()) {
                            throw runtime.failure('Der Tag hat gewechselt. Bitte erneut laden.');
                        }
                        var day = runtime.scheduleDayPage(runtime.scheduleDayContext(context.date), page, snapshot);
                        day.requestId = requestId;
                        if ((!page || page === 0) && typeof data.signature === 'string' && data.signature === day.signature) {
                            day.unchanged = true; delete day.entries;
                        }
                        if (JSON.stringify(day).length >= 9500) { throw new Error('schedule packet'); }
                        runtime.send(session, 'mw:schedule.data', day);
                    } catch (failure) {
                        runtime.send(session, 'mw:schedule.result', {requestId:requestId, ok:false,
                            message:failure.publicMessage || 'Der Sendeplan konnte nicht geladen werden. Bitte erneut versuchen.'});
                    }
                });
                return;
            }
            if (type === 'mw:schedule.get') {
                var result = data.range === true ? runtime.scheduleOverviewPage(user, data.page) : runtime.schedulePage(user, data.week, data.page);
                result.requestId = requestId;
                if (JSON.stringify(result).length >= 9500) { throw new Error('schedule packet'); }
                runtime.send(session, 'mw:schedule.data', result);
                return;
            }
            if (runtime.getViews().some(function (view) { return view.kind === 'schedule' && view.content === session.getAppContent(); })) {
                throw runtime.failure('Bitte Einträge auf der MischWerk-Homepage bearbeiten.');
            }
            runtime.changeSchedule(user, type, data);
            runtime.send(session, 'mw:schedule.result', { requestId: requestId, ok: true,
                message: type === 'mw:schedule.delete' ? 'Sendung entfernt.' : 'Sendung gespeichert.' });
            runtime.changed('schedule', data.week);
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('SCHEDULE_ACTION', error); }
            runtime.send(session, 'mw:schedule.result', { requestId: requestId, ok: false,
                message: error.publicMessage || 'Der Sendeplan konnte nicht gespeichert oder geladen werden. Bitte erneut versuchen.' });
        }
    };
};

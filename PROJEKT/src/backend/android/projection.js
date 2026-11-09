/* Nur tatsächliche Revisionen, niemals Kalender- oder Teamlisten an Firebase übertragen. */
MischWerkModules.attachRelayProjection = function (runtime) {
    'use strict';
    runtime.prepareRelayProjection = function () {
        var body = {}, revisions = [];
        try {
            var current = runtime.scheduleWeek(runtime.scheduleToday());
            [-7, 0, 7].forEach(function (days) {
                try {
                    var week = runtime.scheduleDay(current, days), saved = runtime.readScheduleWeek(week);
                    if (runtime.relayInteger(saved.revision)) { revisions.push({ week: week, revision: saved.revision }); }
                } catch (readError) { runtime.warn('RELAY_REVISION_READ'); }
            });
        } catch (calendarError) { runtime.warn('RELAY_REVISION_CALENDAR'); }
        if (revisions.length) { body.scheduleRevisions = revisions; }
        if (runtime.relayInteger(runtime.state.radioModeratorRevision)) { body.moderatorRevision = runtime.state.radioModeratorRevision; }
        return { body: body };
    };
};

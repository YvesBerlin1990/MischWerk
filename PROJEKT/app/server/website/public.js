/* Ausschließlich öffentliche Projektion; keine privaten Wünsche, Rollen oder internen Identitäten. */
MischWerkModules.attachWebsitePublic = function (runtime, config) {
    'use strict';
    runtime.publicWebsiteRadio = function () {
        var show=runtime.receivedShow();
        return {topic:show.active?show.topic:'',moderator:show.active?{nick:show.nick}:null};
    };
    runtime.publicWebsitePlan = function (week, page) {
        var plan = runtime.schedulePage(null, week, page);
        var entries = plan.entries.map(function (entry) {
            return { id:entry.id, date:entry.date, start:entry.start, end:entry.end, kind:entry.kind, timing:entry.timing, until:entry.until, week:entry.week,
                topic:entry.topic, moderator:entry.kind === 'autodj' ? 'MischWerk' :
                    String(entry.nick).toLowerCase() === config.ownerNick.toLowerCase() ? 'Yves' : 'Moderation' };
        });
        return { version:1, ok:true, week:plan.week, today:plan.today, days:plan.days, revision:plan.revision,
            previousRevision:plan.previousRevision, boundaryRevision:plan.boundaryRevision, entries:entries, page:plan.page, pages:plan.pages,
            total:plan.total, requestsEnabled:runtime.requestsAvailable() };
    };
};

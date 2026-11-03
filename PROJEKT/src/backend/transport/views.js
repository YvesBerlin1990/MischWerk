/* Sitzungsbezogene JSON-Antworten, Aktualisierung und Push. */
MischWerkModules.attachViewTransport = function (runtime, config) {
    'use strict';

    runtime.send = function (session, type, data) {
        try { if (session) { session.sendEvent(type, data); } }
        catch (error) { runtime.warn(); }
    };

    runtime.refresh = function (session, user, page, myPage, radioModeratorPage, refreshRequestId) {
        runtime.announceStudioStatus();
        var userId = runtime.userId(user);
        var view = runtime.getViews().filter(function (item) {
            return item.userId === userId && item.content === session.getAppContent();
        })[0];
        // Bei Push/Bestätigung denselben Wunsch halten, auch wenn davor ein anderer entfernt wurde.
        if (page === undefined && view && view.queueId) {
            runtime.wishItems().some(function (item, index) {
                if (item.id !== view.queueId) { return false; }
                page = Math.floor(index / runtime.pageSize);
                return true;
            });
        }
        var next = runtime.snapshot(user, page === undefined && view ? view.page : page,
            myPage === undefined && view ? view.myPage : myPage, view ? view.feedbackId : null,
            radioModeratorPage === undefined && view ? view.radioModeratorPage : radioModeratorPage);
        if (view) {
            view.page = next.page;
            view.myPage = next.wishPositions.page;
            view.radioModeratorPage = next.radioModeratorPage;
            view.queueId = next.queue.length ? next.queue[0].id : null;
            if (view.kind !== 'radio') {
                var owner = runtime.getViews().filter(function (item) { return item.content === view.radioContent; })[0];
                next.view = view.kind; next.viewRevision = view.viewRevision; next.wishSurfaceId = view.surfaceId;
                next.overlayState = runtime.overlayDraftState(user, owner, view.kind);
            }
            if (view.kind !== 'radio') {
                var radio = runtime.getViews().filter(function (item) { return item.content === view.radioContent; })[0];
                next.wishPresentation = radio ? radio.wishPresentation || null : null;
            }
        }
        if (refreshRequestId) { next.refreshRequestId = refreshRequestId; }
        runtime.send(session, 'mw:state', next);
    };

    runtime.broadcast = function () {
        runtime.pruneHandover();
        runtime.announceStudioStatus();
        runtime.getViews().forEach(function (view) {
            try {
                view.content.getSessions().forEach(function (session) {
                    try {
                        var user = session.getUser();
                        if (runtime.online(user)) { runtime.refresh(session, user); }
                    } catch (error) { runtime.warn(); }
                });
            } catch (error) { runtime.warn(); }
        });
    };

    runtime.result = function (session, ok, message, action, requestId, request) {
        var response = { ok: ok, message: message, action: action, requestId: requestId };
        if (request) { response.request = runtime.requestView(request); }
        runtime.send(session, 'mw:result', response);
    };
};

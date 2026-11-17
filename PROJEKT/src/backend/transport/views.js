/* Sitzungsbezogene JSON-Antworten, Aktualisierung und Push. */
MischWerkModules.attachViewTransport = function(runtime, config) {
    'use strict';

    runtime.send = function(session, type, data) {
        try {
            if (session) {
                session.sendEvent(type, data);
                return true;
            }
        } catch (error) {
            runtime.warn();
        }
        return false;
    };

    runtime.refresh = function(session, user, page, myPage, radioModeratorPage, refreshRequestId) {
        var userId = runtime.userId(user);
        var view = runtime.getViews().filter(function(item) {
            return item.userId === userId && item.content === session.getAppContent();
        })[0];
        if (view && view.kind === 'team' && !runtime.canUseAdministration(user)) {
            runtime.closeView(view);
            return;
        }
        var next = runtime.snapshot(user, page === undefined && view ? view.page : page,
            myPage === undefined && view ? view.myPage : myPage, view ? view.feedbackId : null,
            radioModeratorPage === undefined && view ? view.radioModeratorPage : radioModeratorPage, view &&
            view.kind);
        delete next.user.pinSetupRequired;
        if (view) {
            view.page = next.page;
            view.myPage = next.wishPositions.page;
            view.radioModeratorPage = next.radioModeratorPage;
            view.queueId = next.queue.length ? next.queue[0].id : null;
            if (view.kind !== 'radio') {
                var owner = runtime.getViews().filter(function(item) {
                    return item.content === view.radioContent;
                })[0];
                next.view = view.kind;
                next.viewRevision = view.viewRevision;
                next.wishSurfaceId = view.surfaceId;
                next.overlayState = runtime.overlayDraftState(user, owner, view.kind);
            }
            if (view.kind !== 'radio') {
                var radio = runtime.getViews().filter(function(item) {
                    return item.content === view.radioContent;
                })[0];
                next.wishPresentation = radio ? radio.wishPresentation || null : null;
            }
        }
        if (refreshRequestId) {
            next.refreshRequestId = refreshRequestId;
        }
        runtime.send(session, 'mw:state', next);
        if (view && view.kind === 'team') {
            runtime.send(session, 'mw:channelTexts.state', runtime.channelTextsView(user));
        }
    };

    runtime.broadcast = function() {
        runtime.getViews().forEach(function(view) {
            try {
                view.content.getSessions().forEach(function(session) {
                    try {
                        var user = session.getUser();
                        if (runtime.online(user)) {
                            runtime.refresh(session, user);
                        }
                    } catch (error) {
                        runtime.warn();
                    }
                });
            } catch (error) {
                runtime.warn();
            }
        });
    };

    runtime.result = function(session, ok, message, action, requestId) {
        var response = {
            ok: ok,
            message: message,
            action: action,
            requestId: requestId
        };
        runtime.send(session, 'mw:result', response);
    };
};

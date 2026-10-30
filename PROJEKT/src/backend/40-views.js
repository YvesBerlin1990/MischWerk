/* AppContent-Sitzungen, Push-Aktualisierung und getrennte Radio-/Popup-Ansichten. */
MischWerkModules.attachViews = function (runtime) {
    'use strict';

    runtime.send = function (session, type, data) {
        try { if (session) { session.sendEvent(type, data); } }
        catch (error) { runtime.warn(); }
    };
    runtime.refresh = function (session, user, page, myPage, radioModeratorPage) {
        var userId = runtime.userId(user);
        var view = runtime.views.filter(function (item) {
            return item.userId === userId && item.content === session.getAppContent();
        })[0];
        // Bei Push/Bestätigung denselben Wunsch halten, auch wenn davor ein anderer entfernt wurde.
        if (page === undefined && view && view.queueId) {
            runtime.state.requests.some(function (item, index) {
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
            view.myPage = next.myPage;
            view.radioModeratorPage = next.radioModeratorPage;
            view.queueId = next.queue.length ? next.queue[0].id : null;
        }
        runtime.send(session, 'mw:state', next);
    };
    runtime.broadcast = function () {
        runtime.views.forEach(function (view) {
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
    runtime.activeSession = function (user, session) {
        try {
            return !!session && runtime.online(user) && user.equals(session.getUser()) &&
                session.getAppContent().getSessions().some(function (active) { return user.equals(active.getUser()); });
        } catch (error) { return false; }
    };
    runtime.openView = function (user, kind, automatic) {
        if (!runtime.online(user)) { user.sendPrivateMessage('Bitte öffne MischWerk im MyChannel.'); return; }
        runtime.load();
        if (kind === 'studio' && !runtime.isModerator(user)) {
            throw runtime.failure('Nur die Radio-Moderation darf das Moderationsmenü öffnen.');
        }
        if (kind === 'team' && !runtime.isChannelOwner(user)) {
            throw runtime.failure('Nur der Channelinhaber darf das Radio-Team verwalten.');
        }
        runtime.prune();
        if (kind === 'wishes' && !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var data = runtime.snapshot(user, 0);
        data.view = kind;
        var htmlFile = new HTMLFile('index.html', data);
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, 264) :
            AppContent.popupContent(htmlFile, kind === 'wishes' ? 520 : kind === 'team' ? 560 : 780,
                kind === 'wishes' ? 360 : kind === 'team' ? 420 : 420);
        content.setResponsive(true);
        content.setAllowJFXBrowser(false);
        if (!user.canSendAppContent(content)) {
            if (automatic === true) { return false; }
            throw runtime.failure(kind === 'radio' ? 'Dieser Client unterstützt die MischWerk-Channelleiste nicht.' :
                'Dieser Client kann das MischWerk-Fenster gerade nicht öffnen.');
        }
        content.addCloseListener(function () {
            runtime.views = runtime.views.filter(function (view) { return view.content !== content; });
        });
        var userId = runtime.userId(user);
        runtime.views.slice().forEach(function (view) {
            if (view.userId === userId && (view.kind === 'radio') === (kind === 'radio')) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        if (!user.sendAppContent(content)) {
            throw runtime.failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.');
        }
        runtime.views.push({ content: content, kind: kind, userId: userId, page: 0, myPage: 0,
            radioModeratorPage: 0, feedbackId: null });
        return true;
    };
    runtime.open = function (user, automatic) {
        try { runtime.openView(user, 'radio', automatic); }
        catch (error) {
            if (automatic !== true) {
                user.sendPrivateMessage(error.publicMessage || 'MischWerk konnte gerade nicht geöffnet werden.');
            } else { runtime.warn(); }
        }
    };
};

/* Radioleiste und getrennte Popups oeffnen und verwalten. */
MischWerkModules.attachSessions = function (runtime, config) {
    'use strict';
    var views = [];

    runtime.getViews = function () { return views.slice(); };
    runtime.removeUserViews = function (userId) {
        views.slice().forEach(function (view) {
            if (view.userId === userId) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        views = views.filter(function (view) { return view.userId !== userId; });
    };

    runtime.activeSession = function (user, session) {
        try {
            return !!session && runtime.online(user) && user.equals(session.getUser()) &&
                session.getAppContent().getSessions().some(function (active) { return user.equals(active.getUser()); });
        } catch (error) { return false; }
    };

    runtime.openView = function (user, kind, automatic, opening) {
        if (kind === 'wishes' && (!opening || !opening.radioContent)) { throw runtime.failure('Bitte öffne die Wunschbox in der Radioleiste.'); }
        if (!runtime.online(user)) { user.sendPrivateMessage('Bitte öffne MischWerk im MyChannel.'); return; }
        runtime.load();
        runtime.loadWishes();
        // Appstart und Channelbeitritt koennen denselben Nutzer kurz nacheinander melden.
        // Eine bereits aktive Radioleiste dabei weder schliessen noch erneut senden.
        if (kind === 'radio' && automatic === true) {
            var activeRadio = views.some(function (view) {
                if (view.kind !== 'radio' || view.userId !== runtime.userId(user)) { return false; }
                try {
                    return view.content.getSessions().some(function (session) {
                        return user.equals(session.getUser());
                    });
                } catch (error) { return false; }
            });
            if (activeRadio) { return true; }
        }
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
        if (kind === 'wishes') {
            data.wishSurface = true; data.wishSurfaceId = opening.surfaceId;
            data.wishPresentation = opening.presentation;
        }
        var htmlFile = new HTMLFile('index.html', data);
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, 160) :
            kind === 'wishes' ? AppContent.overlayContent(htmlFile, 560, 360) :
            AppContent.popupContent(htmlFile, kind === 'schedule' ? 820 : kind === 'team' ? 560 : 780,
                kind === 'schedule' ? 560 : kind === 'team' ? 560 : 600);
        content.setResponsive(true);
        content.setAllowJFXBrowser(false);
        if (!user.canSendAppContent(content)) {
            if (automatic === true) { return false; }
            throw runtime.failure(kind === 'radio' ? 'Dieser Client unterstützt die MischWerk-Channelleiste nicht.' :
                'Dieser Client kann das MischWerk-Fenster gerade nicht öffnen.');
        }
        content.addCloseListener(function () {
            views = views.filter(function (view) { return view.content !== content; });
            if (kind === 'wishes') {
                opening.radioContent.getSessions().forEach(function (radioSession) {
                    try { radioSession.sendEvent('mw:wishes.closed', { surfaceId: opening.surfaceId }); }
                    catch (ignored) { /* Eine geschlossene Radioleiste benötigt keinen Fokus mehr. */ }
                });
            }
            if (kind === 'radio') {
                views.slice().forEach(function (view) {
                    if (view.radioContent === content) { view.content.getSessions().forEach(function (active) { active.remove(); }); }
                });
            }
        });
        var userId = runtime.userId(user);
        views.slice().forEach(function (view) {
            var group = function (name) { return name === 'radio' ? 'radio' : name === 'wishes' ? 'wishes' : 'popup'; };
            if (view.userId === userId && group(view.kind) === group(kind)) {
                view.content.getSessions().forEach(function (session) { session.remove(); });
            }
        });
        if (!user.sendAppContent(content)) {
            throw runtime.failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.');
        }
        views.push({ content: content, kind: kind, userId: userId, page: 0, myPage: 0,
            radioModeratorPage: 0, feedbackId: null, radioContent: opening && opening.radioContent,
            surfaceId: opening && opening.surfaceId });
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

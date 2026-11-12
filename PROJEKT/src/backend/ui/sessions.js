/* Radioleiste und authentifizierte Channel-Overlays verwalten. */
MischWerkModules.attachSessions = function (runtime, config) {
    'use strict';
    var views = [], surfaceSequence = 0;
    runtime.closeView = function (view) {
        if (!view || view.closed || view.closing) { return; }
        try {
            if (!runtime.isSessionActive(view.session)) { view.finishClose(false); return; }
            view.closing = true;
            view.session.remove();
        } catch (error) { view.closing = false; runtime.warn('SESSION_CLOSE', error); }
    };
    runtime.getViews = function () { return views.slice(); };
    runtime.removeUserViews = function (userId) {
        views.slice().forEach(function (view) {
            if (view.userId === userId) { runtime.closeView(view); }
        });
        views = views.filter(function (view) { return view.userId !== userId; });
    };
    runtime.overlayDraftState = function (user, radio, kind) {
        if (!radio || !radio.overlayDrafts) { return null; }
        var drafts = radio.overlayDrafts;
        if (!runtime.isModerator(user)) { delete drafts.studio; }
        if (!runtime.canAdminister(user)) { delete drafts.team; }
        return drafts[kind] || null;
    };
    function selection(opening, kind) {
        var radio = opening && views.filter(function (view) { return view.content === opening.radioContent; })[0];
        return radio && radio.overlaySelections && radio.overlaySelections[kind] || {};
    }
    function prepareView(user, kind, opening) {
        if (['radio', 'wishes', 'studio', 'team', 'schedule'].indexOf(kind) === -1) { throw runtime.failure('Diese Ansicht ist nicht verfügbar.'); }
        if (!runtime.online(user)) { throw runtime.failure('Bitte öffne MischWerk im MyChannel.'); }
        if (kind !== 'radio' && (!opening || !opening.radioContent || !views.some(function (view) {
            return view.kind === 'radio' && view.userId === runtime.userId(user) && view.content === opening.radioContent && view.content.getSessions().length;
        }))) { throw runtime.failure('Bitte öffne die Ansicht in der Radioleiste.'); }
        runtime.load(); runtime.loadWishes();
        if (kind === 'studio' && !runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf das Moderationsmenü öffnen.'); }
        if (kind === 'team' && !runtime.canAdminister(user)) { throw runtime.failure('Nur Otterchen als Channelinhaber darf die Verwaltung öffnen.'); }
        runtime.prune();
        if (kind === 'wishes' && !runtime.requestsAvailable(user)) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var selected = selection(opening, kind), page = selected.page || 0;
        if (kind === 'studio' && selected.queueId) {
            runtime.wishItems().some(function (item, index) { if (item.id !== selected.queueId) { return false; } page = Math.floor(index / runtime.pageSize); return true; });
        }
        var data = runtime.snapshot(user, page, selected.myPage || 0, selected.feedbackId || null, selected.radioModeratorPage || 0, kind);
        delete data.user.pinSetupRequired;
        data.view = kind; data.overlay = kind !== 'radio';
        data.viewRevision = 1;
        if (kind !== 'radio') {
            var radio = views.filter(function (view) { return view.content === opening.radioContent; })[0];
            data.overlayState = runtime.overlayDraftState(user, radio, kind);
        }
        if (kind !== 'radio') {
            data.wishSurface = kind === 'wishes'; data.wishSurfaceId = opening.surfaceId; data.wishPresentation = opening.presentation;
        }
        if (JSON.stringify(data).length >= 10000) { throw runtime.failure('Die Ansicht ist gerade zu umfangreich. Bitte erneut versuchen.'); }
        return runtime.createChannelContent(user, kind, data);
    }
    runtime.openView = function (user, kind, automatic, opening) {
        if (kind === 'radio' && automatic === true && views.some(function (view) {
            return view.kind === 'radio' && view.userId === runtime.userId(user) && view.content.getSessions().length;
        })) { return true; }
        var previous = kind !== 'radio' && views.filter(function (view) { return view.kind !== 'radio' && view.userId === runtime.userId(user); })[0];
        if (previous && (!opening || opening.previousContent !== previous.content || opening.radioContent !== previous.radioContent)) {
            throw runtime.failure('Die Channelansicht ist bereits geöffnet. Bitte erneut in der Radioleiste öffnen.');
        }
        if (kind !== 'radio' && opening) { opening.surfaceId = ++surfaceSequence; }
        var content;
        try { content = prepareView(user, kind, opening); }
        catch (error) { if (automatic === true) { return false; } throw error; }
        var userId = runtime.userId(user);
        var selected = selection(opening, kind);
        var entry = { content:content, kind:kind, viewRevision:1, userId:userId, page:selected.page || 0, myPage:selected.myPage || 0, radioModeratorPage:selected.radioModeratorPage || 0, queueId:selected.queueId,
            feedbackId:null, radioContent:opening && opening.radioContent, surfaceId:opening && opening.surfaceId };
        entry.finishClose = function (replacing) {
            if (entry.closed) { return; }
            entry.closed = true;
            var closedKind = entry.kind;
            views = views.filter(function (view) { return view.content !== content; });
            if (entry.transition && entry.transition.cancel) { entry.transition.cancel(); }
            if (entry.radioContent) {
                var radio = views.filter(function (view) { return view.content === entry.radioContent; })[0];
                if (radio && (closedKind !== 'studio' || runtime.isModerator(user)) && (closedKind !== 'team' || runtime.canAdminister(user))) {
                    if (!radio.overlaySelections) { radio.overlaySelections = {}; }
                    radio.overlaySelections[closedKind] = { page:entry.page, myPage:entry.myPage, queueId:entry.queueId, radioModeratorPage:entry.radioModeratorPage };
                }
                if (replacing !== true) { entry.radioContent.getSessions().forEach(function (radioSession) {
                    try {
                        radioSession.sendEvent(closedKind === 'wishes' ? 'mw:wishes.closed' : 'mw:overlay.closed',
                            { kind:closedKind, surfaceId:entry.surfaceId });
                    } catch (ignored) { /* Eine geschlossene Radioleiste benötigt keinen Fokus. */ }
                }); }
            }
            if (closedKind === 'radio') {
                runtime.changed('radio-closed');
                views.slice().forEach(function (view) {
                    if (view.radioContent === content) { runtime.closeView(view); }
                });
            }
        };
        content.addCloseListener(function (closedUser, closedContent, replacing) { entry.finishClose(replacing); });
        // sendAppContent (er)setzt nativ. Kein zweiter Schließauftrag an den alten Inhalt.
        entry.session = runtime.deliverChannelContent(user, content);
        if (!entry.session) { throw runtime.failure('MischWerk konnte die Ansicht gerade nicht öffnen. Bitte erneut versuchen.'); }
        views.push(entry);
        if (entry.radioContent) {
            entry.radioContent.getSessions().forEach(function (session) {
                try { session.sendEvent(kind === 'wishes' ? 'mw:wishes.open' : 'mw:overlay.open',
                    { kind:kind, surfaceId:entry.surfaceId, viewRevision:entry.viewRevision }); }
                catch (error) { runtime.warn('OVERLAY_NOTICE'); }
            });
        }
        return true;
    };
    runtime.open = function (user, automatic) {
        try { runtime.openView(user, 'radio', automatic); }
        catch (error) { if (automatic !== true) { user.sendPrivateMessage(error.publicMessage || 'MischWerk konnte gerade nicht geöffnet werden.'); } else { runtime.warn(); } }
    };
};

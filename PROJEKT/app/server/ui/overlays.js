/* Ein Overlay je Radio-Sitzung; Entwürfe vor einem bestätigten Wechsel übernehmen. */
MischWerkModules.attachOverlays = function (runtime) {
    'use strict';
    var sequence = 0;
    var actions = { 'mw:openWishes':'wishes', 'mw:openStudio':'studio', 'mw:openRadioTeam':'team', 'mw:openSchedule':'schedule' };
    function find(user, session) {
        return runtime.getViews().filter(function (view) {
            return view.userId === runtime.userId(user) && view.content === session.getAppContent();
        })[0];
    }
    function allowed(user, kind) {
        return kind === 'studio' ? runtime.isModerator(user) : kind === 'team' ? runtime.isChannelOwner(user) : true;
    }
    function parent(view) {
        return runtime.getViews().filter(function (radio) { return radio.kind === 'radio' && radio.userId === view.userId && radio.content === view.radioContent; })[0];
    }
    function remember(radio, action, requestId) {
        if (!requestId) { return; }
        if (!radio.overlayRequests) { radio.overlayRequests = []; }
        radio.overlayRequests.push({ id:requestId, action:action });
        if (radio.overlayRequests.length > 32) { radio.overlayRequests.shift(); }
    }
    function save(user, view, state, revision) {
        var radio = parent(view);
        if (!radio) { return false; }
        if (!allowed(user, view.kind)) {
            if (radio.overlayDrafts) { delete radio.overlayDrafts[view.kind]; }
            return true;
        }
        if (!state || typeof state !== 'object' || Array.isArray(state) || JSON.stringify(state).length > (view.kind === 'team' ? 4100 : 2500) ||
            typeof revision !== 'number' || !isFinite(revision) || Math.floor(revision) !== revision || revision < 0 || revision > 1000000000) { return false; }
        if (revision < (view.draftRevision || 0)) { return false; }
        view.draftRevision = revision;
        if (!radio.overlayDrafts) { radio.overlayDrafts = {}; }
        radio.overlayDrafts[view.kind] = JSON.parse(JSON.stringify(state));
        return true;
    }
    function perform(user, session, action, requestId) {
        if (!runtime.activeSession(user, session)) { return; }
        var radio = find(user, session), kind = actions[action];
        if (!radio || radio.kind !== 'radio' || !kind) { throw runtime.failure('Bitte öffne die Ansicht in der Radioleiste.'); }
        var existing = runtime.getViews().filter(function (view) { return view.kind !== 'radio' && view.userId === radio.userId; })[0];
        if (existing) {
            if (!radio.overlaySelections) { radio.overlaySelections = {}; }
            radio.overlaySelections[existing.kind] = { page:existing.page, myPage:existing.myPage, queueId:existing.queueId, radioModeratorPage:existing.radioModeratorPage };
        }
        {
            var presentation = radio.wishPresentation;
            var initial = presentation ? JSON.parse(JSON.stringify(presentation)) : null;
            if (initial) { initial.sequence = 0; initial.disabled = true; }
            runtime.openView(user, kind, false, { radioContent:radio.content, previousContent:existing && existing.content,
                presentation:initial });
            if (presentation && radio.wishPresentation === presentation) { presentation.sequence = 0; }
        }
        remember(radio, action, requestId);
        runtime.result(session, true, 'Ansicht geöffnet.', action, requestId);
    }
    runtime.openOverlay = function (user, session, action, requestId) {
        var radio = find(user, session), kind = actions[action];
        if (!radio || radio.kind !== 'radio' || !kind) { throw runtime.failure('Bitte öffne die Ansicht in der Radioleiste.'); }
        if (!allowed(user, kind)) { throw runtime.failure('Diese Ansicht ist für dich nicht verfügbar.'); }
        if (kind === 'wishes' && !runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var curtain = runtime.curtainState(user);
        if (kind === 'wishes' && curtain.closed && !curtain.exempt) { throw runtime.failure('Die Wunschbox ist momentan nicht verfügbar.'); }
        var previous = requestId && (radio.overlayRequests || []).filter(function (entry) { return entry.id === requestId; })[0];
        if (previous) {
            if (previous.action !== action) { throw runtime.failure('Diese Anfrage wurde bereits verwendet. Bitte erneut öffnen.'); }
            runtime.result(session, true, 'Anfrage bereits übernommen.', action, requestId); return;
        }
        var existing = runtime.getViews().filter(function (view) { return view.kind !== 'radio' && view.userId === radio.userId; })[0];
        if (!existing) { perform(user, session, action, requestId); return; }
        if (existing.transition && existing.transition.expires > Date.now()) {
            if (existing.transition.requestId === requestId && existing.transition.action === action) { return; }
            throw runtime.failure('Die bisherige Ansicht wird noch übernommen. Bitte kurz warten.');
        }
        var token = ++sequence;
        existing.transition = { token:token, action:action, requestId:requestId, expires:Date.now() + 14000,
            cancel:function (message) {
                existing.content.getSessions().forEach(function (active) { runtime.send(active, 'mw:overlay.resume', { token:token }); });
                runtime.result(session, false, message || 'Der Ansichtswechsel wurde unterbrochen. Bitte erneut öffnen.', action, requestId);
            } };
        existing.transition.finish = function () { perform(user, session, action, requestId); };
        existing.content.getSessions().forEach(function (active) { runtime.send(active, 'mw:overlay.prepare', { token:token }); });
    };
    runtime.resumeOverlayOpening = function (user, session) {
        var view = find(user, session), transition = view && view.transition;
        if (!view || view.kind === 'radio' || !transition || transition.expires < Date.now()) { return; }
        // Ein vor dem Listenerstart gesendetes Paket kann fehlen. Erst die eigene Clientbereitschaft ist verlässlich.
        runtime.send(session, 'mw:overlay.prepare', { token:transition.token });
    };
    runtime.expireOverlays = function (user) {
        runtime.getViews().forEach(function (view) {
            if (view.userId !== runtime.userId(user) || !view.transition || view.transition.expires >= Date.now()) { return; }
            var transition = view.transition; view.transition = null; transition.cancel();
        });
    };
    runtime.handleOverlayEvent = function (user, type, data, session) {
        var view = find(user, session);
        if (!view || !data || typeof data !== 'object' || Array.isArray(data)) { return; }
        if (type === 'mw:overlay.close' && view.kind === 'radio') {
            runtime.getViews().forEach(function (surface) {
                if (surface.kind === 'wishes' && surface.radioContent === view.content && surface.userId === view.userId &&
                    data.view === surface.kind && data.surfaceId === surface.surfaceId && data.viewRevision === surface.viewRevision) { runtime.closeView(surface); }
            });
            return;
        }
        if (view.kind === 'radio') { return; }
        if (type === 'mw:overlay.draft') { save(user, view, data.state, data.revision); return; }
        if (type === 'mw:overlay.dismiss') {
            var owner = parent(view);
            if (view.kind === 'wishes' && (!owner || (view.inputSequence || 0) > (owner.wishPresentation && owner.wishPresentation.sequence || 0))) { return; }
            if (!save(user, view, data.state, data.revision)) { return; }
            runtime.closeView(view); return;
        }
        var transition = view.transition;
        if (type === 'mw:overlay.cancel' && transition && data.token === transition.token) {
            view.transition = null; transition.cancel(); return;
        }
        if (type !== 'mw:overlay.ready' || !transition || data.token !== transition.token || transition.expires < Date.now()) { return; }
        view.transition = null;
        var radio = parent(view);
        if (data.error || !save(user, view, data.state, data.revision) || !radio ||
            (view.kind === 'wishes' && (view.inputSequence || 0) > (radio.wishPresentation && radio.wishPresentation.sequence || 0))) {
            transition.cancel(); return;
        }
        try { transition.finish(); }
        catch (error) {
            transition.cancel(error.publicMessage);
            if (!error.publicMessage) { runtime.warn('OVERLAY_OPEN'); }
        }
    };
};

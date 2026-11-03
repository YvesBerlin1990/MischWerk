/* Bereich und Seitenauswahl einer bestehenden Overlay-Sitzung wechseln. */
MischWerkModules.attachNavigation = function (runtime) {
    'use strict';
    runtime.selectOverlay = function (user, radio, view, kind) {
        if ((kind === 'studio' && !runtime.isModerator(user)) || (kind === 'team' && !runtime.isChannelOwner(user))) { throw runtime.failure('Diese Ansicht ist für dich nicht verfügbar.'); }
        if (!user.canSendAppContent(view.content)) { throw runtime.failure('Dieser Client unterstützt diese Channelansicht nicht. Die bisherige Ansicht bleibt geöffnet.'); }
        var curtain = runtime.curtainState(user);
        if (kind === 'wishes' && (!runtime.state.requestsEnabled || (curtain.closed && !curtain.exempt))) {
            throw runtime.failure('Die Wunschbox ist momentan nicht verfügbar.');
        }
        if (kind === 'studio') { runtime.refreshAssistant(); }
        if (!radio.overlaySelections) { radio.overlaySelections = {}; }
        radio.overlaySelections[view.kind] = { page:view.page, myPage:view.myPage, queueId:view.queueId, radioModeratorPage:view.radioModeratorPage };
        var previous = view.kind, selected = radio.overlaySelections[kind] || {};
        view.kind = kind; view.viewRevision += 1;
        view.page = selected.page || 0; view.myPage = selected.myPage || 0;
        view.queueId = selected.queueId; view.radioModeratorPage = selected.radioModeratorPage || 0;
        radio.content.getSessions().forEach(function (active) {
            if (previous === 'wishes') { runtime.send(active, 'mw:wishes.closed', { surfaceId:view.surfaceId, switching:true }); }
            if (kind === 'wishes') { runtime.send(active, 'mw:wishes.open', { surfaceId:view.surfaceId, viewRevision:view.viewRevision, shared:true }); }
        });
        view.content.getSessions().forEach(function (active) {
            runtime.send(active, 'mw:view', { view:kind, revision:view.viewRevision });
            runtime.refresh(active, user);
        });
    };
};

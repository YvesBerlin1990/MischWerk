/* Native Wunschoberfläche mit ihrer authentifizierten Radio-Sitzung verbinden. Kein Wunschtransport. */
MischWerkModules.attachWishSurface = function (runtime) {
    'use strict';
    var sequence = 0;
    function find(user, session) {
        return runtime.getViews().filter(function (view) {
            return view.userId === runtime.userId(user) && view.content === session.getAppContent();
        })[0];
    }
    function parent(view) {
        return runtime.getViews().filter(function (radio) {
            return radio.kind === 'radio' && radio.userId === view.userId && radio.content === view.radioContent;
        })[0];
    }
    function send(view, type, data) {
        view.content.getSessions().forEach(function (session) { runtime.send(session, type, data); });
    }
    runtime.toggleWishSurface = function (user, session) {
        var radio = find(user, session);
        if (!radio || radio.kind !== 'radio') { throw runtime.failure('Bitte öffne die Wunschbox in der Radioleiste.'); }
        if (!runtime.state.requestsEnabled) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var existing = runtime.getViews().filter(function (view) {
            return view.kind === 'wishes' && view.radioContent === radio.content && view.userId === radio.userId;
        })[0];
        if (existing) {
            existing.content.getSessions().forEach(function (active) { active.remove(); });
            return;
        }
        var curtain = runtime.curtainState(user);
        if (!runtime.state.requestsEnabled || (curtain.closed && !curtain.exempt)) {
            throw runtime.failure('Die Wunschbox ist momentan nicht verfügbar.');
        }
        sequence += 1;
        var presentation = radio.wishPresentation;
        if (presentation) { presentation.sequence = 0; presentation = JSON.parse(JSON.stringify(presentation)); presentation.disabled = true; }
        runtime.openView(user, 'wishes', false, { radioContent: radio.content,
            surfaceId: sequence, presentation: presentation || null });
        runtime.send(session, 'mw:wishes.open', { surfaceId: sequence });
    };
    runtime.handleWishSurfaceEvent = function (user, type, data, session) {
        var view = find(user, session);
        if (!view || !data || typeof data !== 'object' || Array.isArray(data)) { return; }
        if (type === 'mw:wishes.sync' && view.kind === 'radio') {
            if (typeof data.text !== 'string' || data.text.length > 300 ||
                typeof data.sequence !== 'number' || !isFinite(data.sequence) || data.sequence < 0 ||
                data.sequence > 1000000000 || Math.floor(data.sequence) !== data.sequence) { return; }
            var active = runtime.getViews().filter(function (surface) { return surface.kind === 'wishes' && surface.radioContent === view.content; })[0];
            if (active && active.surfaceId !== data.surfaceId) { return; }
            if (active && view.wishPresentation && data.sequence < view.wishPresentation.sequence) { return; }
            view.wishPresentation = { text: data.text, sequence: data.sequence, disabled: data.disabled === true,
                feedback: typeof data.feedback === 'string' ? data.feedback.slice(0, 800) : '',
                feedbackHidden: data.feedbackHidden !== false, error: data.error === true, pending: data.pending === true,
                hint: typeof data.hint === 'string' ? data.hint.slice(0, 400) : '' };
            runtime.getViews().forEach(function (surface) {
                if (surface.kind === 'wishes' && surface.radioContent === view.content && surface.userId === view.userId &&
                    surface.surfaceId === data.surfaceId) {
                    send(surface, 'mw:wishes.presentation', { surfaceId: surface.surfaceId, state: view.wishPresentation });
                }
            });
            return;
        }
        if (type === 'mw:wishes.close' && (view.kind === 'radio' || view.kind === 'wishes')) {
            runtime.getViews().filter(function (surface) {
                return surface.kind === 'wishes' && surface.userId === view.userId &&
                    (surface === view || surface.radioContent === view.content);
            }).forEach(function (surface) { surface.content.getSessions().forEach(function (active) { active.remove(); }); });
            return;
        }
        if (view.kind !== 'wishes' || (type !== 'mw:wishes.edit' && type !== 'mw:wishes.submit')) { return; }
        var radio = parent(view);
        if (!radio || !radio.content.getSessions().length || typeof data.text !== 'string' || data.text.length > 300 ||
            typeof data.sequence !== 'number' || !isFinite(data.sequence) || Math.floor(data.sequence) !== data.sequence ||
            data.sequence <= (view.inputSequence || 0) || data.sequence > 1000000000) { return; }
        view.inputSequence = data.sequence;
        send(radio, 'mw:wishes.input', { surfaceId: view.surfaceId, sequence: data.sequence,
            text: data.text, submit: type === 'mw:wishes.submit' });
    };
};

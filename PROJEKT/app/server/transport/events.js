/* Eventrouting und sichere Antworten auf Fachaktionen. */
MischWerkModules.attachEvents = function (runtime, config) {
    'use strict';

    runtime.handleEvent = function (user, type, data, session) {
        if (!runtime.activeSession(user, session)) { return; }
        if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
        if (type === 'mw:wish.submit') {
            runtime.handleWishSubmission(user, data, session);
            return;
        }
        if (type.indexOf('mw:wishes.') === 0) {
            runtime.handleWishSurfaceEvent(user, type, data, session);
            return;
        }
        if (type.indexOf('mw:schedule.') === 0) {
            runtime.handleScheduleEvent(user, type, data, session);
            return;
        }
        var requestId = null;
        var operation = 'EVENT_PREPARE';
        try {
            operation = 'STATE_LOAD';
            runtime.load();
            runtime.loadWishes();
            operation = 'STATE_PRUNE';
            if (runtime.prune()) { runtime.broadcast(); }
            operation = 'EVENT_VALIDATE';
            data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
            if (data.requestId !== undefined) {
                if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                    throw runtime.failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.');
                }
                requestId = data.requestId;
            }
            if (type === 'mw:ready' || type === 'mw:refresh') {
                operation = 'STATE_REFRESH';
                runtime.refresh(session, user, data.page, data.myPage, data.radioModeratorPage);
                return;
            }
            if (runtime.shuttingDown) {
                throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.');
            }
            if (type === 'mw:openWishes') {
                runtime.toggleWishSurface(user, session);
                runtime.result(session, true, 'Wunschbox geöffnet.', type, requestId);
                return;
            }
            if (type === 'mw:openStudio' || type === 'mw:openRadioTeam' || type === 'mw:openSchedule') {
                operation = 'OPEN_VIEW';
                runtime.openView(user, type === 'mw:openStudio' ? 'studio' :
                    type === 'mw:openRadioTeam' ? 'team' : type === 'mw:openSchedule' ? 'schedule' : 'schedule');
                runtime.result(session, true, 'Fenster geöffnet.', type, requestId);
                return;
            }
            if (type === 'mw:ackRequest') {
                operation = 'REQUEST_ACK';
                if (runtime.acknowledgeRequest(user, data, session)) { runtime.broadcast(); }
                return;
            }
            if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') {
                operation = 'RADIO_TEAM';
                var changedNick = runtime.manageRadioModerator(user, type, data);
                runtime.result(session, true, type === 'mw:addRadioModerator' ?
                    changedNick + ' ist jetzt Radiomoderator.' : 'Radiomoderator entfernt.', type, requestId);
            } else if (type === 'mw:setCurtain') {
                operation = 'CURTAIN_ACTION';
                runtime.result(session, true, runtime.changeCurtain(user, data), type, requestId);
            } else if (type.indexOf('mw:handover.') === 0) {
                operation = 'HANDOVER_ACTION';
                runtime.result(session, true, runtime.changeHandover(user, type, data), type, requestId);
            } else {
                operation = 'MODERATION_ACTION';
                if (type === 'mw:resolveRequest') { runtime.resolveRequest(user, data); }
                else if (type === 'mw:setTopic' || type === 'mw:setRequests') { runtime.changeShow(user, type, data); }
                else { runtime.changeModeration(user, type, data); }
                runtime.result(session, true, type === 'mw:setTopic' ? (runtime.state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                    type === 'mw:setRequests' ? (runtime.state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                    type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                    type === 'mw:onAir' ? 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
            }
            operation = 'STATE_BROADCAST';
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn(operation); }
            runtime.result(session, false, error.publicMessage ||
                'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.', type, requestId);
            try { if (runtime.state) { runtime.refresh(session, user); } } catch (ignored) { runtime.warn(); }
        }
    };
};

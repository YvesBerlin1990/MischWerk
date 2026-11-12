/* Eventrouting und sichere Antworten auf Fachaktionen. */
MischWerkModules.attachEvents = function (runtime, config) {
    'use strict';

    runtime.handleEvent = function (user, type, data, session) {
        if (typeof type === 'string' && type.indexOf('mw:androidSettings.') === 0) {
            runtime.handleAndroidSettingsEvent(user, type, data, session); return;
        }
        if (!runtime.activeSession(user, session)) { return; }
        if (type === 'mw:listenerPresence') { runtime.receiveListenerPresence(user, data, session); return; }
        if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
        if (type.indexOf('mw:channelTexts.') === 0) { runtime.handleChannelTextEvent(user, type, data, session); return; }
        if (type === 'mw:wish.submit') {
            runtime.handleWishSubmission(user, data, session);
            return;
        }
        if (type.indexOf('mw:overlay.') === 0) { runtime.handleOverlayEvent(user, type, data, session); return; }
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
            operation = 'EVENT_VALIDATE';
            data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
            // Veraltete native Clients dürfen PIN-Werte weder speichern noch weiterreichen.
            delete data.pin; delete data.pinConfirmation;
            if (data.requestId !== undefined) {
                if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                    throw runtime.failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.');
                }
                requestId = data.requestId;
            }
            operation = 'STATE_LOAD';
            runtime.load();
            runtime.loadWishes();
            operation = 'STATE_PRUNE';
            if (runtime.prune()) { runtime.broadcast(); }
            if (type === 'mw:ready' || type === 'mw:refresh') {
                if (type === 'mw:refresh') { runtime.receiveListenerPresence(user, data.listenerPresence, session); }
                operation = 'STATE_REFRESH';
                runtime.expireOverlays(user);
                var currentView = runtime.getViews().filter(function (view) { return view.content === session.getAppContent(); })[0];
                if (currentView && data.viewRevision !== undefined && data.viewRevision !== currentView.viewRevision) {
                    runtime.refresh(session, user);
                } else { runtime.refresh(session, user, data.page, data.myPage, data.radioModeratorPage, type === 'mw:refresh' ? requestId : null); }
                if (type === 'mw:ready') { runtime.resumeOverlayOpening(user, session); }
                return;
            }
            if (runtime.shuttingDown) {
                throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.');
            }
            if (type === 'mw:openWishes' || type === 'mw:openStudio' || type === 'mw:openRadioTeam' || type === 'mw:openSchedule') {
                operation = 'OPEN_OVERLAY';
                runtime.openOverlay(user, session, type, requestId); return;
            }
            if (type === 'mw:ackRequest') {
                operation = 'REQUEST_ACK';
                if (runtime.acknowledgeRequest(user, data, session)) { runtime.broadcast(); }
                return;
            }
            if (type === 'mw:pin.login') {
                throw runtime.failure('Eine PIN ist in der Knuddels-App nicht mehr nötig. Bitte das Moderationsmenü erneut öffnen.');
            } else if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') {
                operation = 'RADIO_TEAM';
                var changedNick = runtime.manageRadioModerator(user, type, data);
                runtime.result(session, true, type === 'mw:addRadioModerator' ?
                    changedNick + ' ist jetzt Radiomoderator.' : 'Radiomoderator entfernt.', type, requestId);
            } else if (type.indexOf('mw:handover.') === 0) {
                operation = 'HANDOVER_ACTION';
                runtime.result(session, true, runtime.changeHandover(user, type, data, session), type, requestId);
            } else {
                operation = 'MODERATION_ACTION';
                if (type === 'mw:resolveRequest') { runtime.resolveRequest(user, data); }
                else if (type === 'mw:setWishStage') { runtime.changeWishStage(user, data); }
                else if (type === 'mw:setTicker') {
                    var tickerView = runtime.getViews().filter(function (view) { return view.content === session.getAppContent(); })[0];
                    if (!tickerView || tickerView.kind !== 'studio' || data.view !== 'studio' || data.viewRevision !== tickerView.viewRevision) {
                        throw runtime.failure('Bitte den Lauftext im aktuellen Moderationsmenü bearbeiten.');
                    }
                    var tickerMessage = runtime.changeTicker(user, data);
                }
                else if (type === 'mw:setTopic' || type === 'mw:setRequests') { runtime.changeShow(user, type, data); }
                else { var moderationMessage = runtime.changeModeration(user, type, data, session); }
                runtime.result(session, true, type === 'mw:setTopic' ? (runtime.state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                    type === 'mw:setRequests' ? (runtime.state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                    type === 'mw:setTicker' ? tickerMessage : type === 'mw:setWishStage' ? 'Wunschstatus aktualisiert.' :
                    type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                    type === 'mw:onAir' ? moderationMessage || 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
            }
            operation = 'STATE_BROADCAST';
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn(operation); }
            runtime.result(session, false, error.publicMessage || (type === 'mw:refresh' || type === 'mw:ready' ?
                'Aktualisierung fehlgeschlagen. Bitte versuche es erneut.' :
                'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.'), type, requestId);
            try { if (runtime.state) { runtime.refresh(session, user); } } catch (ignored) { runtime.warn(); }
        }
    };
};

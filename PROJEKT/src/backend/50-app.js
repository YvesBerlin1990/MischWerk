/* Globaler Knuddels-App-Einstieg; setzt die fachlichen Module zu den Hooks zusammen. */
var App = (function (config) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachState(runtime, config);
    MischWerkModules.attachActions(runtime, config);
    MischWerkModules.attachWishTransport(runtime);
    MischWerkModules.attachViews(runtime);

    return {
        onAppStart: function () {
            runtime.load();
            runtime.loadWishes();
            KnuddelsServer.getDefaultLogger().info('MischWerk 0.1.33: Radioleiste mit Wunschbox-, Radio-Team- und Moderations-Popups gestartet. ' +
                (runtime.station().configured ? 'RadioKing ist konfiguriert.' : 'RadioKing-Hörerstream ist noch nicht konfiguriert.'));
            KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
                try { runtime.open(user, true); } catch (error) { runtime.warn(); }
            });
        },
        onUserJoined: function (user) {
            try { runtime.open(user, true); } catch (error) { runtime.warn(); }
        },
        onPrepareShutdown: function () {
            runtime.shuttingDown = true;
            runtime.broadcast();
        },
        onUserLeft: function (user) {
            var changed = false;
            try {
                runtime.load();
                var userId = runtime.userId(user);
                if (runtime.state.moderator && runtime.state.moderator.userId === userId) {
                    runtime.inactiveModeratorKey = runtime.moderatorKey();
                    changed = true;
                    var next = runtime.copy(runtime.state);
                    next.moderator = null;
                    runtime.persist(next);
                }
            } catch (error) { runtime.warn(); }
            runtime.views.slice().forEach(function (view) {
                if (view.userId === userId) {
                    view.content.getSessions().forEach(function (session) { session.remove(); });
                }
            });
            runtime.views = runtime.views.filter(function (view) { return view.userId !== userId; });
            if (changed) { runtime.broadcast(); }
        },
        onUserDeleted: function (userId) {
            runtime.load();
            runtime.loadWishes();
            runtime.removeWishesForUser(userId);
            userId = runtime.numericUserId(userId);
            var next = runtime.copy(runtime.state);
            if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
            if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
                next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
                next.radioModeratorRevision += 1;
            }
            runtime.persist(next);
            runtime.broadcast();
        },
        chatCommands: { mischwerk: runtime.open, radio: runtime.open },
        onEventReceived: function (user, type, data, session) {
            if (!runtime.activeSession(user, session)) { return; }
            if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
            if (type === 'mw:wish.submit') {
                runtime.handleWishSubmission(user, data, session);
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
                if (type === 'mw:openWishes' || type === 'mw:openStudio' || type === 'mw:openRadioTeam') {
                    operation = 'OPEN_VIEW';
                    runtime.openView(user, type === 'mw:openStudio' ? 'studio' :
                        type === 'mw:openRadioTeam' ? 'team' : 'wishes');
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
                } else {
                    operation = 'MODERATION_ACTION';
                    runtime.moderate(user, type, data);
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
        }
    };
}(MischWerkConfig));

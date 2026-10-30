/* Globaler Knuddels-App-Einstieg; setzt die fachlichen Module zu den Hooks zusammen. */
var App = (function (config) {
    'use strict';
    var runtime = MischWerkModules.createRuntime(config);
    MischWerkModules.attachState(runtime, config);
    MischWerkModules.attachActions(runtime, config);
    MischWerkModules.attachViews(runtime);

    return {
        onAppStart: function () {
            runtime.load();
            KnuddelsServer.getDefaultLogger().info('MischWerk 0.1.26: Radioleiste mit Wunschbox-/Moderations-Popups gestartet. ' +
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
                if (runtime.state.moderator && runtime.state.moderator.userId === user.getUserId()) {
                    runtime.inactiveModeratorKey = runtime.moderatorKey();
                    changed = true;
                    var next = runtime.copy(runtime.state);
                    next.moderator = null;
                    runtime.persist(next);
                }
            } catch (error) { runtime.warn(); }
            runtime.views.slice().forEach(function (view) {
                if (view.userId === user.getUserId()) {
                    view.content.getSessions().forEach(function (session) { session.remove(); });
                }
            });
            runtime.views = runtime.views.filter(function (view) { return view.userId !== user.getUserId(); });
            if (changed) { runtime.broadcast(); }
        },
        onUserDeleted: function (userId) {
            runtime.load();
            var next = runtime.copy(runtime.state);
            next.requests = next.requests.filter(function (item) { return item.userId !== userId; });
            delete next.cooldowns['u' + userId];
            if (next.moderator && next.moderator.userId === userId) { next.moderator = null; }
            runtime.persist(next);
            runtime.broadcast();
        },
        chatCommands: { mischwerk: runtime.open, radio: runtime.open },
        onEventReceived: function (user, type, data, session) {
            if (!runtime.activeSession(user, session)) { return; }
            if (typeof type !== 'string' || type.indexOf('mw:') !== 0) { return; }
            var requestId = null;
            try {
                runtime.load();
                if (runtime.prune()) { runtime.broadcast(); }
                data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
                if (data.requestId !== undefined) {
                    if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId)) {
                        throw runtime.failure('Ungültige Anfrage-ID. Bitte öffne MischWerk erneut.');
                    }
                    requestId = data.requestId;
                }
                if (type === 'mw:ready' || type === 'mw:refresh') {
                    runtime.refresh(session, user, data.page, data.myPage);
                    return;
                }
                if (runtime.shuttingDown) {
                    throw runtime.failure('MischWerk wird gerade neu gestartet. Bitte öffne die App gleich erneut.');
                }
                if (type === 'mw:openWishes' || type === 'mw:openStudio') {
                    runtime.openView(user, type === 'mw:openStudio' ? 'studio' : 'wishes');
                    runtime.result(session, true, 'Fenster geöffnet.', type, requestId);
                    return;
                }
                if (type === 'mw:ackRequest') {
                    if (runtime.acknowledgeRequest(user, data, session)) { runtime.broadcast(); }
                    return;
                }
                if (type === 'mw:request') {
                    var added = runtime.addRequest(user, data);
                    var request = added || runtime.state.requests.filter(function (item) {
                        return item.userId === user.getUserId() && item.requestId === requestId;
                    })[0];
                    if (request) {
                        runtime.views.forEach(function (view) {
                            if (view.userId === user.getUserId() && view.content === session.getAppContent()) {
                                view.feedbackId = request.id;
                            }
                        });
                    }
                    var message = request && request.delivery ? 'An ' + request.delivery.nick + ' übergeben.' :
                        request ? 'Dein Musikwunsch ist mit deinem Nicknamen gespeichert und wartet auf die Übergabe im Moderationsfenster.' :
                        'Dein Musikwunsch wurde bereits gespeichert und inzwischen bearbeitet.';
                    runtime.result(session, true, message, type, requestId, request);
                } else {
                    runtime.moderate(user, type, data);
                    runtime.result(session, true, type === 'mw:setTopic' ? (runtime.state.topic ? 'Thema gespeichert.' : 'Thema entfernt.') :
                        type === 'mw:setRequests' ? (runtime.state.requestsEnabled ? 'Wunschbox aktiviert.' : 'Wunschbox deaktiviert.') :
                        type === 'mw:resolveRequest' ? (data.outcome === 'discarded' ? 'Wunsch verworfen.' : 'Wunsch als erledigt entfernt.') :
                        type === 'mw:onAir' ? 'Studio-Anmeldung bestätigt.' : 'Studio-Anmeldung beendet.', type, requestId);
                }
                runtime.broadcast();
            } catch (error) {
                if (!error.publicMessage) { runtime.warn(); }
                runtime.result(session, false, error.publicMessage ||
                    'Die Aktion konnte nicht gespeichert werden. Bitte versuche es erneut.', type, requestId);
                try { if (runtime.state) { runtime.refresh(session, user); } } catch (ignored) { runtime.warn(); }
            }
        }
    };
}(MischWerkConfig));

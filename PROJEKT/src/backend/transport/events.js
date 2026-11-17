/* Ausschließlich verbleibende native Aktionen; alte Moderation ohne Mutation abweisen. */
MischWerkModules.attachEvents = function(runtime) {
    'use strict';
    runtime.handleEvent = function(user, type, data, session) {
        if (typeof type === 'string' && type.indexOf('mw:androidSettings.') === 0) {
            runtime.handleAndroidSettingsEvent(user, type, data, session);
            return;
        }
        if (!runtime.activeSession(user, session) || typeof type !== 'string' || type.indexOf('mw:') !== 0) {
            return;
        }
        if (type === 'mw:playback.error') {
            return;
        }
        data = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        delete data.pin;
        delete data.pinConfirmation;
        var requestId = typeof data.requestId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(data.requestId) ?
            data.requestId : null;
        try {
            if (type === 'mw:listenerPresence') {
                runtime.receiveListenerPresence(user, data, session);
                return;
            }
            if (type.indexOf('mw:channelTexts.') === 0) {
                runtime.handleChannelTextEvent(user, type, data, session);
                return;
            }
            if (type === 'mw:wish.submit') {
                runtime.handleWishSubmission(user, data, session);
                return;
            }
            if (type.indexOf('mw:overlay.') === 0) {
                runtime.handleOverlayEvent(user, type, data, session);
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
            runtime.load();
            if (type === 'mw:ready' || type === 'mw:refresh') {
                if (type === 'mw:refresh') {
                    runtime.receiveListenerPresence(user, data.listenerPresence, session);
                }
                runtime.expireOverlays(user);
                runtime.refresh(session, user, data.page, data.myPage, data.radioModeratorPage, type ===
                    'mw:refresh' ? requestId : null);
                if (type === 'mw:ready') {
                    runtime.resumeOverlayOpening(user, session);
                }
                return;
            }
            if (runtime.shuttingDown) {
                throw runtime.failure('MischWerk wird gerade neu gestartet.');
            }
            if (['mw:openWishes', 'mw:openRadioTeam', 'mw:openSchedule'].indexOf(type) >= 0) {
                runtime.openOverlay(user, session, type, requestId);
                return;
            }
            if (['mw:setTicker', 'mw:display.save', 'mw:migration.start', 'mw:migration.abort'].indexOf(type) <
                0) {
                throw runtime.failure(
                    'Diese Aktion ist in Knuddels nicht mehr verfügbar. Die Sendung wird im MischWerk Live Studio gesteuert.'
                );
            }
            var view = runtime.getViews().filter(function(item) {
                return item.content === session.getAppContent();
            })[0];
            if (!runtime.canUseAdministration(user) || !view || view.kind !== 'team' || data.view !== 'team' || data
                .viewRevision !== view.viewRevision) {
                throw runtime.failure('Bitte die aktuelle Verwaltung über /mw admin öffnen.');
            }
            var message = type === 'mw:setTicker' ? runtime.changeTicker(user, data) : type ===
                'mw:display.save' ?
                runtime.changeDisplaySettings(user, data) : runtime.changeMigration(user, type, data);
            runtime.result(session, true, message, type, requestId);
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) {
                runtime.warn('NATIVE_ACTION');
            }
            runtime.result(session, false, error.publicMessage ||
                'Die Aktion konnte nicht gespeichert werden. Bitte erneut versuchen.', type, requestId);
        }
    };
};

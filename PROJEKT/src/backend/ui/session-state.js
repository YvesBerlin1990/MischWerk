/* Aktuelle Sitzung auch bei neu erzeugten Plattformwrappern eindeutig zuordnen. */
MischWerkModules.attachSessionState = function (runtime) {
    'use strict';
    runtime.isSessionActive = function (session) {
        try {
            if (!session) { return false; }
            var user = session.getUser();
            var opened = typeof session.getOpenTimestamp === 'function' ? session.getOpenTimestamp() : null;
            return session.getAppContent().getSessions().some(function (active) {
                if (active === session) { return true; }
                return !!opened && typeof active.getOpenTimestamp === 'function' &&
                    user.equals(active.getUser()) && opened.getTime() === active.getOpenTimestamp().getTime();
            });
        } catch (error) { return false; }
    };
};

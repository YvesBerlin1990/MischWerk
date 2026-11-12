/* Frische private Berechtigung für Verbindungseinstellungen im Verwaltungsfenster. */
MischWerkModules.attachAndroidSettingsAccess = function (runtime) {
    'use strict';
    runtime.canUseAndroidSettings = function (user, entry, session) {
        return !runtime.shuttingDown && runtime.isChannelOwner(user) && entry && (!entry.embedded || runtime.canAdminister(user)) &&
            entry.userId === runtime.userId(user) && runtime.activeSession(user, session) &&
            session.getAppContent() === entry.content && runtime.now() < entry.expires;
    };
    runtime.administrationSettingsEntry = function (user, session) {
        if (runtime.shuttingDown || !runtime.canAdminister(user) || !runtime.activeSession(user, session)) { return null; }
        var view = runtime.getViews().filter(function (item) {
            return item.kind === 'team' && item.userId === runtime.userId(user) && item.content === session.getAppContent();
        })[0];
        return view ? { userId:runtime.userId(user), content:view.content, session:session,
            expires:runtime.now() + 600000, requests:[], embedded:true } : null;
    };
};

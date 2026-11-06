/* Native Inhalte erzeugen und ausliefern; Ansichtslebenszyklen bleiben in ui/sessions. */
MischWerkModules.attachContent = function (runtime) {
    'use strict';
    runtime.createChannelContent = function (user, kind, data) {
        var htmlFile = new HTMLFile(kind === 'relay-settings' ? 'relay-settings.html' : 'index.html', data);
        var radioHeight = data.ticker && data.ticker.enabled && data.ticker.text ? 220 : 176;
        var content = kind === 'radio' ? AppContent.headerbarContent(htmlFile, radioHeight) :
            AppContent.overlayContent(htmlFile, kind === 'schedule' ? 820 : kind === 'studio' ? 780 : 560,
                kind === 'schedule' ? 630 : kind === 'studio' ? 730 : kind === 'team' ? 630 : kind === 'relay-settings' ? 640 : 340);
        content.setResponsive(true); content.setAllowJFXBrowser(false);
        try { MischWerkModules.configureLoading(content.getLoadConfiguration(), kind !== 'radio'); }
        catch (ignored) { /* Ältere Clients ohne Ladeeigenschaften bleiben bedienbar. */ }
        if (!user.canSendAppContent(content)) {
            throw runtime.failure(kind === 'radio' ? 'Dieser Client unterstützt die MischWerk-Channelleiste nicht.' :
                'Dieser Client unterstützt diese Channelansicht nicht. Die bisherige Ansicht bleibt geöffnet.');
        }
        return content;
    };
    runtime.deliverChannelContent = function (user, content) { return user.sendAppContent(content); };
};

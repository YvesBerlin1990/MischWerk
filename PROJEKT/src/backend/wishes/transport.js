/* Wunsch-Event, direkte Quittung und Moderationsempfang. */
MischWerkModules.attachWishTransport = function (runtime, config) {
    'use strict';

    runtime.sendWishReceipt = function (session, accepted, message, submissionId) {
        var receipt = { accepted: accepted, message: message, submissionId: submissionId };
        runtime.send(session, 'mw:wish.receipt', receipt);
    };
    runtime.handleWishSubmission = function (user, data, session) {
        var submissionId = data && typeof data.submissionId === 'string' ? data.submissionId : null;
        var outcome;
        try {
            runtime.wishPhase = 'WISH_QUEUE';
            runtime.loadWishes();
            outcome = runtime.submitWish(user, data);
        } catch (error) {
            if (!error.publicMessage) { runtime.warn(runtime.wishPhase, error); }
            runtime.sendWishReceipt(session, false, error.publicMessage ||
                'Die Wunschübertragung konnte nicht abgeschlossen werden. Bitte versuche es erneut.', submissionId);
            return;
        }
        runtime.sendWishReceipt(session, true, outcome.item ?
            'Dein Musikwunsch wurde an die Moderation gesendet.' :
            'Dein Musikwunsch wurde bereits an die Moderation gesendet.', data.submissionId);
        runtime.broadcast();
    };

    runtime.acknowledgeRequest = function (user, data, session) {
        if (!runtime.canUseModeration(user)) { throw runtime.failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var view = runtime.getViews().filter(function (item) {
            return item.content === session.getAppContent();
        })[0];
        if (!view || view.kind !== 'studio') { throw runtime.failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = runtime.wishItems()[view.page * runtime.pageSize];
        if (!item || item.id !== data.id) { throw runtime.failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        return runtime.deliverWish(item.id, user);
    };
};

/* Native Wünsche: lokale Outbox ist noch keine bestätigte Firebase-Annahme. */
MischWerkModules.attachWishTransport = function(runtime) {
    'use strict';
    runtime.handleWishSubmission = function(user, data, session) {
        var id = data && typeof data.submissionId === 'string' ? data.submissionId : null;
        try {
            var row = runtime.queueNativeWish(user, data),
                pending = row.state === 'pending' || row.state === 'unconfirmed';
            runtime.send(session, 'mw:wish.receipt', {
                submissionId: id,
                accepted: !pending && row.accepted === true,
                pending: pending,
                state: row.state,
                message: row.legacyReplay ? 'Dieser Wunsch wurde bereits abgeschlossen oder verworfen.' : pending ? 'Dein Wunsch wird übertragen …' : row.accepted ?
                    'Dein Musikwunsch wurde an die Moderation gesendet.' :
                    'Der Wunsch wurde nicht angenommen.'
            });
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) {
                runtime.warn('NATIVE_WISH');
            }
            runtime.send(session, 'mw:wish.receipt', {
                submissionId: id,
                accepted: false,
                message: error.publicMessage ||
                    'Die Wunschübertragung konnte nicht vorbereitet werden. Bitte erneut versuchen.'
            });
        }
    };
};

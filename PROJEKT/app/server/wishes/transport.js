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

    runtime.sendQueuePage = function (user, data, session) {
        var view = runtime.getViews().filter(function (item) { return item.content === session.getAppContent(); })[0];
        if (!runtime.canUseModeration(user) || !view || view.kind !== 'studio' ||
                data.view !== 'studio' || data.viewRevision !== view.viewRevision) {
            throw runtime.failure('Bitte öffne die Wünsche in deiner aktuellen Moderation.');
        }
        var queue = runtime.loadWishes(), offset = data.offset;
        if (!data.requestId || typeof offset !== 'number' || offset < 0 || offset !== Math.floor(offset)) {
            throw runtime.failure('Die Wunschliste konnte nicht geladen werden. Bitte aktualisieren.');
        }
        var reset = data.generation !== queue.generation || data.revision !== queue.revision;
        var result = { requestId: data.requestId, viewRevision: view.viewRevision, generation: queue.generation,
            revision: queue.revision, offset: offset, next: offset, total: queue.items.length, reset: reset, items: [] };
        var grant = view.queueList;
        if (!reset) {
            if (offset === 0) { grant = { generation: queue.generation, revision: queue.revision, end: 0 }; }
            if (!grant || grant.generation !== queue.generation || grant.revision !== queue.revision || offset > grant.end) {
                throw runtime.failure('Bitte die Wunschliste erneut aktualisieren.');
            }
            while (result.next < queue.items.length && result.items.length < 10) {
                result.items.push(runtime.requestView(queue.items[result.next]));
                if (JSON.stringify({ type: 'mw:queue.page', data: result }).length >= 9500) { result.items.pop(); break; }
                result.next += 1;
            }
            grant.end = Math.max(grant.end, result.next); view.queueList = grant;
        } else { view.queueList = null; }
        runtime.send(session, 'mw:queue.page', result);
    };

    runtime.acknowledgeRequest = function (user, data, session) {
        if (!runtime.canUseModeration(user)) { throw runtime.failure('Nur die Radio-Moderation darf den Empfang bestätigen.'); }
        var view = runtime.getViews().filter(function (item) {
            return item.content === session.getAppContent();
        })[0];
        if (!view || view.kind !== 'studio') { throw runtime.failure('Die Bestätigung benötigt das Moderationsfenster.'); }
        var item = runtime.wishItems()[view.page * runtime.pageSize];
        var grant = view.queueList, queue = runtime.loadWishes();
        if (data.generation !== undefined || data.revision !== undefined) {
            if (!grant || data.generation !== grant.generation || data.revision !== grant.revision ||
                    grant.generation !== queue.generation || grant.revision !== queue.revision) {
                throw runtime.failure('Bitte die Wunschliste erneut aktualisieren.');
            }
            item = queue.items.slice(0, grant.end).filter(function (entry) { return entry.id === data.id; })[0];
        }
        if (!item || item.id !== data.id) { throw runtime.failure('Dieser Wunsch wird hier gerade nicht angezeigt.'); }
        return runtime.deliverWish(item.id, user);
    };
};

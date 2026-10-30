/* Schlanker Wunschweg: laufende Queue, Moderationsansicht und direkte Absenderquittung. */
MischWerkModules.attachWishTransport = function (runtime) {
    'use strict';

    var receiptLimit = 100;
    runtime.wishQueue = { nextId: 1, items: [], receipts: [] };

    function validSubmissionId(value) {
        return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    }
    function sameUser(left, right) {
        try { return !!left && !!right && left.equals(right); }
        catch (error) { return false; }
    }
    function receiptFor(user, submissionId) {
        return runtime.wishQueue.receipts.filter(function (receipt) {
            return receipt.submissionId === submissionId && sameUser(receipt.user, user);
        })[0] || null;
    }

    // Die Wunschliste ist absichtlich nur Laufzeitzustand. Sie wird weder in den allgemeinen
    // App-Zustand noch in einen eigenen AppPersistence-Schlüssel geschrieben.
    runtime.loadWishes = function () { return runtime.wishQueue; };
    runtime.wishItems = function () { return runtime.wishQueue.items; };
    runtime.submitWish = function (user, data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !validSubmissionId(data.submissionId)) {
            throw runtime.failure('Die Wunschübertragung ist ungültig. Bitte öffne MischWerk erneut.');
        }
        var queued = runtime.wishQueue.items.filter(function (item) {
            return item.submissionId === data.submissionId && sameUser(item.user, user);
        })[0];
        if (queued) { return { duplicate: true, item: queued }; }
        var receipt = receiptFor(user, data.submissionId);
        if (receipt) {
            return { duplicate: true, item: runtime.wishQueue.items.filter(function (item) {
                return item.id === receipt.wishId;
            })[0] || null };
        }
        if (runtime.shuttingDown || !runtime.state.requestsEnabled) {
            throw runtime.failure('Die Wunschbox ist deaktiviert.');
        }
        var wishText = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = { id: runtime.wishQueue.nextId, user: user, nick: runtime.nick(user), text: wishText,
            submissionId: data.submissionId, createdAt: runtime.now(), delivery: null };
        runtime.wishQueue.nextId += 1;
        runtime.wishQueue.items.push(item);
        runtime.wishQueue.receipts.push({ user: user, submissionId: data.submissionId, wishId: item.id });
        runtime.wishQueue.receipts = runtime.wishQueue.receipts.slice(-receiptLimit);
        return { duplicate: false, item: item };
    };
    runtime.deliverWish = function (id, moderator) {
        var item = runtime.wishQueue.items.filter(function (candidate) { return candidate.id === id; })[0];
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (item.delivery) { return false; }
        item.delivery = { nick: runtime.nick(moderator), at: runtime.now() };
        return true;
    };
    runtime.resolveWish = function (id) {
        if (!runtime.wishQueue.items.some(function (item) { return item.id === id; })) {
            throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.');
        }
        runtime.wishQueue.items = runtime.wishQueue.items.filter(function (item) { return item.id !== id; });
    };
    runtime.removeWishesForUser = function (userId) {
        var expected = String(userId);
        function belongsToDeletedUser(entry) {
            try { return entry.user && String(entry.user.getUserId()) === expected; }
            catch (error) { return false; }
        }
        runtime.wishQueue.items = runtime.wishQueue.items.filter(function (item) {
            return !belongsToDeletedUser(item);
        });
        runtime.wishQueue.receipts = runtime.wishQueue.receipts.filter(function (receipt) {
            return !belongsToDeletedUser(receipt);
        });
    };
    runtime.sendWishReceipt = function (session, accepted, message, submissionId) {
        var receipt = { accepted: accepted, message: message, submissionId: submissionId };
        runtime.send(session, 'mw:wish.receipt', receipt);
    };
    runtime.handleWishSubmission = function (user, data, session) {
        var submissionId = data && typeof data.submissionId === 'string' ? data.submissionId : null;
        try {
            runtime.load();
            var outcome = runtime.submitWish(user, data);
            runtime.sendWishReceipt(session, true, outcome.item ?
                'Dein Musikwunsch wurde an die Moderation gesendet.' :
                'Dein Musikwunsch wurde bereits an die Moderation gesendet.', data.submissionId);
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('WISH_QUEUE'); }
            runtime.sendWishReceipt(session, false, error.publicMessage ||
                'Die Wunschübertragung konnte nicht abgeschlossen werden. Bitte versuche es erneut.', submissionId);
        }
    };
};

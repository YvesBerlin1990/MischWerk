/* Eigenständiges Wunschprotokoll mit eigener String-Persistenz und eigener Quittung. */
MischWerkModules.attachWishTransport = function (runtime) {
    'use strict';

    var storageKey = 'mischwerk.wishes.v2';
    var receiptLimit = 100;
    runtime.wishQueue = null;

    function primitiveText(value) {
        if (typeof value === 'string') { return value; }
        if (typeof value === 'number') { return String(value); }
        if (value === null || value === undefined || typeof value.toString !== 'function') { return ''; }
        return String(value.toString());
    }
    function senderKeyFromValue(value) {
        var key;
        try { key = primitiveText(value); }
        catch (error) { key = ''; }
        if (!/^[1-9][0-9]*$/.test(key)) {
            throw runtime.failure('Deine Knuddels-Identität konnte nicht bestätigt werden. Bitte öffne MischWerk erneut.');
        }
        return key;
    }
    function sender(user) {
        var nick;
        try { nick = primitiveText(user.getNick()); }
        catch (error) { nick = ''; }
        nick = runtime.text(nick, 50, true);
        return { key: senderKeyFromValue(user.getUserId()), nick: nick };
    }
    function integer(value) {
        return typeof value === 'number' && isFinite(value) && value > 0 && Math.floor(value) === value;
    }
    function validSubmissionId(value) {
        return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    }
    function validItem(item) {
        if (!item || typeof item !== 'object' || Array.isArray(item) || !integer(item.id) ||
                typeof item.senderKey !== 'string' || !/^[1-9][0-9]*$/.test(item.senderKey) ||
                typeof item.nick !== 'string' || !item.nick || item.nick.length > 50 ||
                typeof item.text !== 'string' || !item.text || item.text.length > 300 || !validSubmissionId(item.submissionId) ||
                typeof item.createdAt !== 'number' || !isFinite(item.createdAt)) { return false; }
        return item.delivery === null || (item.delivery && typeof item.delivery === 'object' &&
            typeof item.delivery.nick === 'string' && !!item.delivery.nick && item.delivery.nick.length <= 50 &&
            typeof item.delivery.at === 'number' && isFinite(item.delivery.at));
    }
    function validateQueue(queue) {
        if (!queue || queue.version !== 2 || !integer(queue.nextId) || !Array.isArray(queue.items) ||
                !Array.isArray(queue.receipts) || !queue.items.every(validItem)) {
            throw new Error('Unbekanntes MischWerk-Wunschformat. Persistenz vor Migration sichern.');
        }
        queue.receipts = queue.receipts.filter(function (receipt) {
            return receipt && typeof receipt.senderKey === 'string' && /^[1-9][0-9]*$/.test(receipt.senderKey) &&
                validSubmissionId(receipt.submissionId) && integer(receipt.wishId) &&
                typeof receipt.at === 'number' && isFinite(receipt.at);
        }).slice(-receiptLimit);
        return queue;
    }
    function cloneQueue(queue) { return JSON.parse(JSON.stringify(queue)); }
    function legacySubmissionId(item) {
        return validSubmissionId(item.requestId) ? item.requestId : 'legacy-' + String(item.id);
    }
    function migrateLegacy() {
        var legacy = Array.isArray(runtime.state.requests) ? runtime.state.requests : [];
        var highest = 0;
        var items = legacy.map(function (item) {
            if (!integer(item.id)) { throw new Error('Ungültige historische Wunsch-ID.'); }
            highest = Math.max(highest, item.id);
            var migrated = {
                id: item.id,
                senderKey: senderKeyFromValue(item.userId),
                nick: primitiveText(item.nick),
                text: runtime.requestText(item),
                submissionId: legacySubmissionId(item),
                createdAt: typeof item.createdAt === 'number' && isFinite(item.createdAt) ? item.createdAt : runtime.now(),
                delivery: null
            };
            if (item.delivery) {
                migrated.delivery = { nick: primitiveText(item.delivery.nick),
                    at: typeof item.delivery.at === 'number' && isFinite(item.delivery.at) ? item.delivery.at : runtime.now() };
            }
            if (!validItem(migrated)) { throw new Error('Historischer Wunsch konnte nicht migriert werden.'); }
            return migrated;
        });
        var nextId = Math.max(highest + 1, integer(runtime.state.nextId) ? runtime.state.nextId : 1);
        return { version: 2, nextId: nextId, items: items, receipts: items.slice(-receiptLimit).map(function (item) {
            return { senderKey: item.senderKey, submissionId: item.submissionId, wishId: item.id, at: item.createdAt };
        }) };
    }
    function detachLegacyState() {
        // Ab jetzt ist ausschließlich die neue String-Persistenz maßgeblich. Die alte Kopie bleibt bis zum
        // nächsten regulären Zustands-Schreibvorgang nur im gespeicherten Altobjekt als Rücksicherung erhalten.
        runtime.state.requests = [];
        runtime.state.cooldowns = {};
        runtime.state.nextId = runtime.wishQueue.nextId;
    }

    runtime.loadWishes = function () {
        if (runtime.wishQueue) { return; }
        var persistence = KnuddelsServer.getPersistence();
        var serialized = primitiveText(persistence.getString(storageKey, ''));
        if (serialized) {
            runtime.wishQueue = validateQueue(JSON.parse(serialized));
        } else {
            var migrated = validateQueue(migrateLegacy());
            persistence.setString(storageKey, JSON.stringify(migrated));
            runtime.wishQueue = migrated;
        }
        detachLegacyState();
    };
    runtime.saveWishes = function (next, failureMessage) {
        next = validateQueue(next);
        var serialized;
        try { serialized = JSON.stringify(next); }
        catch (error) {
            runtime.warn('WISH_STORE_PREPARE');
            throw runtime.failure(failureMessage || 'Die Wunschliste konnte nicht vorbereitet werden. Bitte versuche es erneut.');
        }
        try { KnuddelsServer.getPersistence().setString(storageKey, serialized); }
        catch (error) {
            runtime.warn('WISH_STORE_WRITE');
            throw runtime.failure(failureMessage || 'Dein Wunsch konnte nicht gespeichert werden. Bitte versuche es erneut.');
        }
        runtime.wishQueue = JSON.parse(serialized);
        runtime.state.nextId = runtime.wishQueue.nextId;
    };
    runtime.wishItems = function () {
        runtime.loadWishes();
        return runtime.wishQueue.items;
    };
    runtime.wishSenderKey = function (user) { return sender(user).key; };
    runtime.submitWish = function (user, data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !validSubmissionId(data.submissionId)) {
            throw runtime.failure('Die Wunschübertragung ist ungültig. Bitte öffne MischWerk erneut.');
        }
        var identity = sender(user);
        var queued = runtime.wishQueue.items.filter(function (item) {
            return item.senderKey === identity.key && item.submissionId === data.submissionId;
        })[0];
        if (queued) { return { duplicate: true, item: queued }; }
        var duplicate = runtime.wishQueue.receipts.filter(function (receipt) {
            return receipt.senderKey === identity.key && receipt.submissionId === data.submissionId;
        })[0];
        if (duplicate) {
            return { duplicate: true, item: runtime.wishQueue.items.filter(function (item) {
                return item.id === duplicate.wishId;
            })[0] || null };
        }
        if (runtime.shuttingDown || !runtime.state.requestsEnabled) {
            throw runtime.failure('Die Wunschbox ist deaktiviert.');
        }
        var wishText = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var next = cloneQueue(runtime.wishQueue);
        var item = { id: next.nextId, senderKey: identity.key, nick: identity.nick, text: wishText,
            submissionId: data.submissionId, createdAt: runtime.now(), delivery: null };
        next.nextId += 1;
        next.items.push(item);
        next.receipts.push({ senderKey: identity.key, submissionId: data.submissionId, wishId: item.id, at: item.createdAt });
        next.receipts = next.receipts.slice(-receiptLimit);
        runtime.saveWishes(next, 'Dein Wunsch konnte nicht gespeichert werden. Bitte versuche es erneut.');
        return { duplicate: false, item: item };
    };
    runtime.deliverWish = function (id, moderator) {
        var next = cloneQueue(runtime.wishQueue);
        var item = next.items.filter(function (candidate) { return candidate.id === id; })[0];
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (item.delivery) { return false; }
        item.delivery = { nick: sender(moderator).nick, at: runtime.now() };
        runtime.saveWishes(next, 'Die Wunschübergabe konnte nicht gespeichert werden. Bitte versuche es erneut.');
        return true;
    };
    runtime.resolveWish = function (id) {
        var next = cloneQueue(runtime.wishQueue);
        if (!next.items.some(function (item) { return item.id === id; })) {
            throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.');
        }
        next.items = next.items.filter(function (item) { return item.id !== id; });
        runtime.saveWishes(next, 'Der Wunsch konnte nicht bearbeitet werden. Bitte versuche es erneut.');
    };
    runtime.removeWishesForUser = function (userId) {
        var senderKey = senderKeyFromValue(userId);
        var next = cloneQueue(runtime.wishQueue);
        next.items = next.items.filter(function (item) { return item.senderKey !== senderKey; });
        next.receipts = next.receipts.filter(function (receipt) { return receipt.senderKey !== senderKey; });
        if (next.items.length !== runtime.wishQueue.items.length || next.receipts.length !== runtime.wishQueue.receipts.length) {
            runtime.saveWishes(next, 'Die personenbezogenen Wunschdaten konnten nicht entfernt werden.');
        }
    };
    runtime.markWishFeedback = function (session, item) {
        if (!item) { return; }
        runtime.views.forEach(function (view) {
            if (view.content === session.getAppContent()) { view.feedbackId = item.id; }
        });
    };
    runtime.sendWishReceipt = function (session, accepted, message, submissionId, item) {
        var receipt = { accepted: accepted, message: message, submissionId: submissionId };
        if (item) { receipt.request = runtime.requestView(item); }
        runtime.send(session, 'mw:wish.receipt', receipt);
    };
    runtime.handleWishSubmission = function (user, data, session) {
        var submissionId = data && typeof data.submissionId === 'string' ? data.submissionId : null;
        try {
            runtime.load();
            runtime.loadWishes();
            var outcome = runtime.submitWish(user, data);
            runtime.markWishFeedback(session, outcome.item);
            var message = outcome.item && outcome.item.delivery ? 'An ' + outcome.item.delivery.nick + ' übergeben.' :
                outcome.item ? 'Dein Musikwunsch ist gespeichert und wartet auf die Moderation.' :
                    'Dein Musikwunsch wurde bereits gespeichert und inzwischen bearbeitet.';
            runtime.sendWishReceipt(session, true, message, data.submissionId, outcome.item);
            runtime.broadcast();
        } catch (error) {
            if (!error.publicMessage) { runtime.warn('WISH_SUBMIT'); }
            runtime.sendWishReceipt(session, false, error.publicMessage ||
                'Die Wunschübertragung konnte nicht abgeschlossen werden. Bitte versuche es erneut.', submissionId, null);
            try { if (runtime.state && runtime.wishQueue) { runtime.refresh(session, user); } }
            catch (ignored) { runtime.warn('WISH_REFRESH'); }
        }
    };
};

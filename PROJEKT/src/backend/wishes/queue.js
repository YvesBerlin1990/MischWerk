/* Eine flüchtige Wunschqueue; private Positionen werden ausschließlich daraus abgeleitet. */
MischWerkModules.attachWishQueue = function (runtime) {
    'use strict';

    runtime.wishPhase = 'WISH_VALIDATE';
    function emptyQueue() {
        return { nextId: 1, items: [], submissionIds: {}, revision: 0,
            generation: String(runtime.now()) + '-' + String(Math.random()).slice(2) };
    }
    var wishQueue = emptyQueue();

    function validSubmissionId(value) {
        return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    }
    function queueState() {
        var queue = wishQueue;
        if (!queue || typeof queue !== 'object' || typeof queue.nextId !== 'number' ||
                !Array.isArray(queue.items) || !queue.submissionIds || typeof queue.submissionIds !== 'object') {
            queue = emptyQueue();
            wishQueue = queue;
        }
        return queue;
    }
    function safeNick(user) {
        var nick = '';
        try { nick = String(user.getNick()); }
        catch (error) { /* Der Wunsch darf nicht an einem Wrapperwert scheitern. */ }
        nick = nick.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        return nick && nick.length <= 50 ? nick : 'Hörer';
    }
    function safeUserKey(value) {
        try {
            if (value && typeof value.getUserId === 'function') { value = value.getUserId(); }
            return value === null || value === undefined ? '' : String(value);
        } catch (error) { return ''; }
    }

    // Die Wunschliste ist absichtlich nur Laufzeitzustand. Sie wird weder in den allgemeinen
    // App-Zustand noch in einen eigenen AppPersistence-Schlüssel geschrieben.
    function itemById(queue, id) {
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].id === id) { return queue.items[index]; }
        }
        return null;
    }
    function itemBySubmissionId(queue, submissionId) {
        var id = queue.submissionIds['$' + submissionId];
        return id === undefined ? null : itemById(queue, id);
    }

    runtime.loadWishes = function () { return queueState(); };
    runtime.wishItems = function () { return queueState().items; };
    runtime.wishPositions = function (user, page) {
        var queue = queueState();
        var senderKey = safeUserKey(user);
        var own = [];
        if (senderKey) {
            queue.items.forEach(function (item, index) {
                if (item.senderKey === senderKey) {
                    own.push({ id: item.id, text: item.text, position: index + 1, stage: item.stage || 'queued' });
                }
            });
        }
        var pages = Math.max(1, own.length);
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        return { available: !!senderKey, generation: queue.generation, revision: queue.revision,
            nextPosition: own.length ? own[0].position : null,
            nextItem: own.length ? own[0] : null,
            items: own.slice(page, page + 1), total: own.length, page: page, pages: pages };
    };
    runtime.submitWish = function (user, data) {
        runtime.wishPhase = 'WISH_VALIDATE';
        if (!data || typeof data !== 'object' || Array.isArray(data) || !validSubmissionId(data.submissionId)) {
            throw runtime.failure('Die Wunschübertragung ist ungültig. Bitte öffne MischWerk erneut.');
        }
        runtime.wishPhase = 'WISH_QUEUE';
        var queue = queueState();
        var submissionKey = '$' + data.submissionId;
        if (queue.submissionIds[submissionKey] !== undefined) {
            return { duplicate: true, item: itemBySubmissionId(queue, data.submissionId) };
        }
        if (runtime.shuttingDown || !runtime.state || runtime.state.requestsEnabled !== true) {
            throw runtime.failure('Die Wunschbox ist deaktiviert.');
        }
        runtime.wishPhase = 'WISH_TEXT';
        var wishText = runtime.text(data.text, 300, true);
        runtime.wishPhase = 'WISH_LINK_CHECK';
        if (runtime.containsWishLink(wishText)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        runtime.wishPhase = 'WISH_ENTRY';
        var item = { id: queue.nextId, senderKey: safeUserKey(user), nick: safeNick(user), text: wishText,
            submissionId: data.submissionId, createdAt: runtime.now(), delivery: null };
        runtime.wishPhase = 'WISH_COMMIT';
        queue.nextId += 1;
        queue.submissionIds[submissionKey] = item.id;
        queue.items[queue.items.length] = item;
        queue.revision += 1;
        return { duplicate: false, item: item };
    };
    runtime.deliverWish = function (id, moderator) {
        var item = itemById(queueState(), id);
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (item.delivery) { return false; }
        item.delivery = { nick: safeNick(moderator), at: runtime.now() };
        return true;
    };
    runtime.resolveWish = function (id) {
        var queue = queueState();
        var remaining = [];
        var found = false;
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].id === id) { found = true; }
            else { remaining[remaining.length] = queue.items[index]; }
        }
        if (!found) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        queue.items = remaining;
        queue.revision += 1;
    };
    runtime.removeWishesForUser = function (userId) {
        var expected = safeUserKey(userId);
        if (!expected) { return; }
        var queue = queueState();
        var remaining = [];
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].senderKey !== expected) { remaining[remaining.length] = queue.items[index]; }
        }
        if (remaining.length !== queue.items.length) { queue.items = remaining; queue.revision += 1; }
    };
    runtime.resolveRequest = function (user, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') {
            throw runtime.failure('Ungültige Wunsch-Aktion.');
        }
        runtime.resolveWish(data.id);
    };
    runtime.changeWishStage = function (user, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf Wünsche bearbeiten.'); }
        var queue = queueState(), item = itemById(queue, data.id);
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (['queued', 'preparing', 'playing'].indexOf(data.stage) === -1) {
            throw runtime.failure('Bitte einen gültigen Wunschstatus wählen.');
        }
        var previous = item.stage || 'queued';
        if (data.stage === previous) { return; }
        if (data.previousStage !== previous) {
            throw runtime.failure('Der Wunsch wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        if (data.stage === 'playing' && (previous !== 'preparing' || queue.items[0] !== item)) {
            throw runtime.failure('Bitte zuerst den Wunsch auf Platz 1 vorbereiten.');
        }
        item.stage = data.stage;
        queue.revision += 1;
    };
};

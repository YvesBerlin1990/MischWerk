/* Eine dauerhafte Wunschqueue; private Positionen werden ausschließlich daraus abgeleitet. */
MischWerkModules.attachWishQueue = function (runtime) {
    'use strict';

    runtime.wishPhase = 'WISH_VALIDATE';
    var wishQueue = null;

    function validSubmissionId(value) {
        return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    }
    function queueState() {
        if (!wishQueue) {
            var saved = runtime.readWishes();
            saved.generation = String(runtime.now()) + '-' + String(Math.random()).slice(2);
            wishQueue = saved;
        }
        return wishQueue;
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

    function commit(next, quiet) {
        runtime.saveWishes(next);
        wishQueue = next;
        if (!quiet) { runtime.changed('wishes'); }
    }
    function remember(queue, item, outcome) {
        queue.replays.push({ submissionId: item.submissionId, id: item.id, senderKey: item.senderKey,
            outcome: outcome === 'done' ? 'done' : 'discarded' });
        queue.replays = queue.replays.slice(-256);
    }
    runtime.wishOutcome = function (id) {
        var rows = queueState().replays;
        for (var index = 0; index < rows.length; index += 1) {
            if (rows[index].submissionId === id) { return rows[index].outcome; }
        }
        return null;
    };
    function itemById(queue, id) {
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].id === id) { return queue.items[index]; }
        }
        return null;
    }

    runtime.commitWebsiteWishes = commit;
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
            return { duplicate: true, item: itemById(queue, queue.submissionIds[submissionKey]) };
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
        queue = runtime.copy(queue);
        queue.nextId += 1;
        queue.submissionIds[submissionKey] = item.id;
        queue.items[queue.items.length] = item;
        queue.revision += 1;
        commit(queue);
        return { duplicate: false, item: item };
    };
    runtime.enqueueAndroidWish = function (data, remember, confirm) {
        var queue = queueState();
        if (runtime.shuttingDown || !runtime.state || runtime.state.requestsEnabled !== true) {
            throw new Error('ANDROID_CLOSED');
        }
        var value = runtime.text(data.text, 300, true);
        if (!validSubmissionId(data.submissionId) || runtime.containsWishLink(value)) { throw new Error('ANDROID_INVALID'); }
        var item = { id: queue.nextId, senderKey: '', nick: 'Android', text: value,
            source: 'Android', externalSubmissionId: data.submissionId, submissionId: 'android:' + data.submissionId,
            createdAt: runtime.now(), delivery: null };
        remember(item, queue.items.length + 1);
        queue = runtime.copy(queue);
        queue.items.push(item); queue.submissionIds['$' + item.submissionId] = item.id;
        queue.nextId += 1; queue.revision += 1;
        commit(queue, true);
        try { confirm(item); } catch (error) { runtime.warn('ANDROID_RECEIPTS_WRITE'); }
        runtime.changed('wishes');
    };
    runtime.deliverWish = function (id, moderator) {
        var queue = runtime.copy(queueState()), item = itemById(queue, id);
        if (!item) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        if (item.delivery) { return false; }
        item.delivery = { nick: safeNick(moderator), at: runtime.now(), senderKey: safeUserKey(moderator) };
        commit(queue);
        return true;
    };
    runtime.resolveWish = function (id, outcome) {
        var queue = runtime.copy(queueState());
        var remaining = [];
        var removed = null;
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].id === id) {
                removed = queue.items[index];
            }
            else { remaining[remaining.length] = queue.items[index]; }
        }
        if (!removed) { throw runtime.failure('Dieser Wunsch wurde bereits bearbeitet.'); }
        queue.items = remaining;
        remember(queue, removed, outcome);
        queue.revision += 1;
        commit(queue);
        runtime.changed('wish-removed', { item: removed, outcome: outcome });
    };
    runtime.removeWishesForUser = function (userId) {
        var expected = safeUserKey(userId);
        if (!expected) { return; }
        var queue = runtime.copy(queueState());
        var remaining = [], redacted = false;
        queue.items.forEach(function (item) {
            if (item.delivery && item.delivery.senderKey === expected) {
                item.delivery = { nick: 'Radio-Team', at: item.delivery.at }; redacted = true;
            }
        });
        for (var index = 0; index < queue.items.length; index += 1) {
            if (queue.items[index].senderKey !== expected) { remaining[remaining.length] = queue.items[index]; }
        }
        var replays = queue.replays.filter(function (row) { return row.senderKey !== expected; });
        if (redacted || remaining.length !== queue.items.length || replays.length !== queue.replays.length) {
            queue.items = remaining; queue.replays = replays; queue.revision += 1; commit(queue);
        }
    };
    runtime.resolveRequest = function (user, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf diese Aktion ausführen.'); }
        if (data.outcome !== undefined && data.outcome !== 'done' && data.outcome !== 'discarded') {
            throw runtime.failure('Ungültige Wunsch-Aktion.');
        }
        runtime.resolveWish(data.id, data.outcome);
    };
    runtime.changeWishStage = function (user, data) {
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf Wünsche bearbeiten.'); }
        var queue = runtime.copy(queueState()), item = itemById(queue, data.id);
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
        commit(queue);
    };
};

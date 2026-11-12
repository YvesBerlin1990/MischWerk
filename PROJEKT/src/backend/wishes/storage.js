/* Dauerhafte Wunschqueue: vollständige Seiten schreiben, zuletzt den gültigen Stand umschalten. */
MischWerkModules.attachWishStorage = function (runtime) {
    'use strict';
    var key = 'mischwerk.wishes.v3', head = null, loaded = false;
    function integer(value, minimum) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= minimum;
    }
    function invalid() { throw new Error('WISH_STORAGE_FORMAT'); }
    function validate(value) {
        if (!value || value.version !== 1 || !integer(value.nextId, 1) || !integer(value.revision, 0) ||
                !Array.isArray(value.items) || !Array.isArray(value.replays) || value.replays.length > 256) { invalid(); }
        var ids = {}, submissions = {}, previous = 0;
        value.items.forEach(function (item) {
            if (!item || !integer(item.id, 1) || item.id <= previous || item.id >= value.nextId ||
                    typeof item.senderKey !== 'string' || item.senderKey.length > 100 ||
                    typeof item.nick !== 'string' || !item.nick || item.nick.length > 50 ||
                    typeof item.text !== 'string' || !item.text || item.text.length > 300 ||
                    typeof item.submissionId !== 'string' || !/^(?:android:)?[a-zA-Z0-9_-]{1,84}$/.test(item.submissionId) ||
                    submissions['$' + item.submissionId] || !integer(item.createdAt, 0) ||
                    (item.stage !== undefined && ['queued', 'preparing', 'playing'].indexOf(item.stage) < 0) ||
                    (item.delivery !== null && (!item.delivery || typeof item.delivery.nick !== 'string' ||
                        item.delivery.nick.length > 50 || !integer(item.delivery.at, 0) ||
                        (item.delivery.senderKey !== undefined && (typeof item.delivery.senderKey !== 'string' ||
                            item.delivery.senderKey.length > 100)))) ||
                    (item.displayName !== undefined && item.displayName !== null && (typeof item.displayName !== 'string' ||
                        item.displayName.length > 50 || /[\u0000-\u001f\u007f-\u009f]/.test(item.displayName))) ||
                    (item.origin !== undefined && (item.source !== 'Android' || ['web', 'android'].indexOf(item.origin) < 0)) ||
                    (item.source !== undefined && (item.source !== 'Android' ||
                        item.submissionId !== 'android:' + item.externalSubmissionId))) { invalid(); }
            previous = item.id; ids['$' + item.id] = true; submissions['$' + item.submissionId] = true;
        });
        value.replays.forEach(function (row) {
            if (!row || typeof row.submissionId !== 'string' || !/^(?:android:)?[a-zA-Z0-9_-]{1,84}$/.test(row.submissionId) ||
                    !integer(row.id, 1) || row.id >= value.nextId || ids['$' + row.id] ||
                    submissions['$' + row.submissionId] || typeof row.senderKey !== 'string' || row.senderKey.length > 100 ||
                    ['done', 'discarded'].indexOf(row.outcome) < 0) { invalid(); }
            submissions['$' + row.submissionId] = true;
        });
        runtime.validateStudioWishState(value);
        value.submissionIds = {};
        value.items.concat(value.replays).forEach(function (row) { value.submissionIds['$' + row.submissionId] = row.id; });
        return value;
    }
    function cleanup(store) {
        try {
            var keys = store.getObjectKeys(key + '.%');
            for (var index = 0; index < keys.length; index += 1) {
                var name = String(keys[index]), match = /^mischwerk\.wishes\.v3\.([01])\.([0-9]+)$/.exec(name);
                if (match && (!head || Number(match[1]) !== head.bank || Number(match[2]) >= head.pages)) {
                    store.deleteObject(name);
                }
            }
        } catch (error) { runtime.warn('WISH_STORAGE_CLEANUP'); }
    }
    runtime.readWishes = function () {
        var store = KnuddelsServer.getPersistence(), saved = store.getObject(key, null), value;
        if (saved !== null) {
            if (!saved || saved.version !== 1 || (saved.bank !== 0 && saved.bank !== 1) || !integer(saved.pages, 1)) { invalid(); }
            var parts = [];
            for (var index = 0; index < saved.pages; index += 1) {
                var part = store.getObject(key + '.' + saved.bank + '.' + index, null);
                if (!part || part.version !== 1 || typeof part.text !== 'string' || part.text.length > 10000) { invalid(); }
                parts.push(part.text);
            }
            value = validate(JSON.parse(parts.join('')));
        } else { value = validate({ version: 1, nextId: 1, revision: 0, items: [], replays: [] }); }
        head = saved; loaded = true; cleanup(store);
        return value;
    };
    runtime.saveWishes = function (queue) {
        if (!loaded) { throw new Error('WISH_STORAGE_NOT_LOADED'); }
        var store = KnuddelsServer.getPersistence(), bank = head ? 1 - head.bank : 0;
        var value = { version: 1, nextId: queue.nextId, revision: queue.revision, items: queue.items, replays: queue.replays,
            studioNamespace: queue.studioNamespace, studioStamp: queue.studioStamp, studioExports: queue.studioExports };
        validate(value);
        var text = JSON.stringify(value, function (name, entry) { return name === 'submissionIds' ? undefined : entry; });
        var next = { version: 1, bank: bank, pages: Math.ceil(text.length / 10000) };
        try {
            for (var index = 0; index < next.pages; index += 1) {
                var part = { version: 1, text: text.slice(index * 10000, (index + 1) * 10000) };
                if (runtime.jsonBytes(JSON.stringify(part)) > 90000) { throw new Error('WISH_STORAGE_PAGE_SIZE'); }
                store.setObject(key + '.' + bank + '.' + index, part);
            }
            // Ein einzelner setObject-Aufruf veröffentlicht erst den vollständig geschriebenen Stand.
            store.setObject(key, next);
        } catch (error) {
            cleanup(store);
            runtime.warn('WISH_STORAGE_WRITE');
            throw runtime.failure('Der Musikwunsch konnte nicht gespeichert werden. Bitte versuche es erneut.');
        }
        head = next; queue.submissionIds = value.submissionIds; cleanup(store);
    };
};

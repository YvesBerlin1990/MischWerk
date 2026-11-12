/* Externe Website-/Statuswünsche in derselben dauerhaften Queue; keine Channelidentität. */
MischWerkModules.attachWebsiteWishes = function (runtime) {
    'use strict';
    runtime.enrichExternalWishMetadata = function (id, data) {
        var queue = runtime.copy(runtime.loadWishes()), item = queue.items.filter(function (row) {
            return row.source === 'Android' && row.externalSubmissionId === id;
        })[0], changed = false;
        if (!item) { return; }
        if (item.displayName === undefined) { item.displayName = data.displayName; changed = true; }
        if (item.origin === undefined && data.origin !== undefined) { item.origin = data.origin; changed = true; }
        if (changed) { queue.revision += 1; runtime.commitWebsiteWishes(queue); }
    };
    runtime.enqueueAndroidWish = function (data, remember, confirm) {
        var queue = runtime.loadWishes();
        if (runtime.shuttingDown || !runtime.state || !runtime.requestsAvailable()) { throw new Error('ANDROID_CLOSED'); }
        var value = runtime.text(data.text, 300, true);
        if (!/^[a-zA-Z0-9_-]{1,80}$/.test(data.submissionId) || runtime.containsWishLink(value)) { throw new Error('ANDROID_INVALID'); }
        var item = { id: queue.nextId, senderKey: '', nick: 'Android', text: value,
            source: 'Android', externalSubmissionId: data.submissionId, submissionId: 'android:' + data.submissionId,
            displayName: data.displayName, createdAt: runtime.now(), delivery: null };
        if (data.origin !== undefined) { item.origin = data.origin; }
        remember(item, queue.items.length + 1);
        queue = runtime.copy(queue); queue.items.push(item); queue.submissionIds['$' + item.submissionId] = item.id;
        queue.nextId += 1; queue.revision += 1;
        runtime.commitWebsiteWishes(queue, true);
        try { confirm(item); } catch (error) { runtime.warn('ANDROID_RECEIPTS_WRITE'); }
        runtime.changed('wishes');
    };
    // Websitebesucher sind keine authentifizierten Channelnutzer und werden immer als Website gekennzeichnet.
    runtime.submitWebsiteWish = function (data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !(typeof data.submissionId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(data.submissionId)) ||
                !/^[a-f0-9]{32}$/.test(data.visitorId || '')) { throw runtime.failure('Ungültiger Websitewunsch.'); }
        var queue = runtime.copy(runtime.loadWishes()), key = '$web-' + data.submissionId;
        if (queue.submissionIds[key] !== undefined) { return; }
        if (runtime.shuttingDown || !runtime.requestsAvailable()) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var value = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(value)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = { id:queue.nextId, senderKey:'website:' + data.visitorId, nick:'Website', text:value,
            submissionId:'web-' + data.submissionId, createdAt:runtime.now(), delivery:null };
        queue.nextId += 1; queue.submissionIds[key] = item.id; queue.items.push(item); queue.revision += 1;
        runtime.commitWebsiteWishes(queue);
    };
};

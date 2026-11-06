/* Anonyme Websitewünsche in derselben flüchtigen Queue; keine Channelidentität. */
MischWerkModules.attachWebsiteWishes = function (runtime) {
    'use strict';
    // Websitebesucher sind keine authentifizierten Channelnutzer und werden immer als Website gekennzeichnet.
    runtime.submitWebsiteWish = function (data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !(typeof data.submissionId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(data.submissionId)) ||
                !/^[a-f0-9]{32}$/.test(data.visitorId || '')) { throw runtime.failure('Ungültiger Websitewunsch.'); }
        var queue = runtime.loadWishes(), key = '$web-' + data.submissionId;
        if (queue.submissionIds[key] !== undefined) { return; }
        if (runtime.shuttingDown || runtime.state.requestsEnabled !== true) { throw runtime.failure('Die Wunschbox ist deaktiviert.'); }
        var value = runtime.text(data.text, 300, true);
        if (runtime.containsWishLink(value)) { throw runtime.failure('Nur Interpret + Titel. Keine Links.'); }
        var item = { id:queue.nextId, senderKey:'website:' + data.visitorId, nick:'Website', text:value,
            submissionId:'web-' + data.submissionId, createdAt:runtime.now(), delivery:null };
        queue.nextId += 1; queue.submissionIds[key] = item.id; queue.items.push(item); queue.revision += 1;
        runtime.changed('wishes');
    };
};

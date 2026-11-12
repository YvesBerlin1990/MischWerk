/* Abgeleitete Nicklistenanzeige, flüchtige Hörermeldungen und ein gemeinsamer Timeout. */
MischWerkModules.attachNicklist = function (runtime) {
    'use strict';
    var records = {}, excluded = {}, enabled = false, reconciling = false, timer = null;
    var retryDelays = [1000, 2000, 5000, 15000, 30000];
    function warn() { runtime.warn('NICKLIST_SYNC'); }
    function radioView(user, session) {
        if (!runtime.activeSession(user, session)) { return null; }
        return runtime.getViews().filter(function (view) {
            return !view.closed && view.kind === 'radio' && view.userId === runtime.userId(user) &&
                view.content === session.getAppContent();
        })[0] || null;
    }
    function listening(user) {
        return runtime.getViews().some(function (view) {
            var presence = view.listenerPresence;
            return view.kind === 'radio' && view.userId === runtime.userId(user) && presence && presence.active &&
                presence.expiresAt > runtime.now() && radioView(user, presence.session) === view;
        });
    }
    function desired(user) {
        if (!enabled || runtime.shuttingDown || excluded['u' + runtime.userId(user)] || !runtime.online(user)) { return []; }
        var team = runtime.isModerator(user), icons = team ? ['team'] : [];
        if (team && runtime.moderatorIsActive() && runtime.state.moderator.userId === runtime.userId(user)) { icons.push('moderator'); }
        else if (listening(user)) { icons.push('listener'); }
        return icons;
    }
    function reconcileUser(user, force) {
        var id = 'u' + runtime.userId(user), record = records[id];
        if (!record) { record = records[id] = { user:user, loaded:false, entries:[], retryAt:0, failures:0 }; }
        record.user = user;
        var icons = desired(user), signature = icons.join(',');
        record.checkAt = runtime.now() + 20000;
        if (!force && signature === record.signature && record.retryAt > runtime.now()) { return; }
        record.signature = signature;
        if (runtime.applyNicklist(user, record, icons)) { record.retryAt = 0; record.failures = 0; }
        else { record.retryAt = runtime.now() + retryDelays[Math.min(record.failures++, retryDelays.length - 1)]; }
        if (!runtime.online(user) || excluded[id]) { delete records[id]; }
    }
    function schedule() {
        clearTimeout(timer); timer = null;
        if (!enabled || runtime.shuttingDown) { return; }
        var due = null;
        Object.keys(records).forEach(function (id) {
            var record = records[id];
            if (record.retryAt) { due = due === null ? record.retryAt : Math.min(due, record.retryAt); }
            if (!record.loaded || record.entries.length) { due = due === null ? record.checkAt : Math.min(due, record.checkAt); }
        });
        runtime.getViews().forEach(function (view) {
            var presence = view.listenerPresence;
            if (presence && presence.active) {
                if (presence.expiresAt <= runtime.now()) { presence.active = false; }
                else { due = due === null ? presence.expiresAt : Math.min(due, presence.expiresAt); }
            }
        });
        if (due !== null) { timer = setTimeout(reconcile, Math.max(1, due - runtime.now())); }
    }
    function reconcile() {
        if (!enabled || reconciling) { return; }
        reconciling = true;
        try {
            try { if (!runtime.shuttingDown && runtime.prune()) { runtime.broadcast(); } } catch (pruneError) { warn(); }
            KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).forEach(function (user) {
                if (!excluded['u' + runtime.userId(user)]) { try { reconcileUser(user); } catch (error) { warn(); } }
            });
            Object.keys(records).forEach(function (id) {
                if (!runtime.online(records[id].user)) { try { reconcileUser(records[id].user, true); } catch (error) { warn(); } }
            });
        } catch (error) { warn(); }
        reconciling = false;
        schedule();
    }
    runtime.receiveListenerPresence = function (user, data, session) {
        try {
            if (!enabled || runtime.shuttingDown || !data || typeof data.active !== 'boolean' ||
                    typeof data.sequence !== 'number' || !isFinite(data.sequence) || data.sequence < 1 ||
                    data.sequence > 9007199254740991 || Math.floor(data.sequence) !== data.sequence) { return; }
            var view = radioView(user, session);
            if (!view || excluded['u' + runtime.userId(user)] ||
                    (view.listenerPresence && data.sequence <= view.listenerPresence.sequence)) { return; }
            view.listenerPresence = { active:data.active, sequence:data.sequence, expiresAt:runtime.now() + 45000, session:session };
            reconcile();
        } catch (error) { warn(); }
    };
    runtime.startNicklist = function () { enabled = true; excluded = {}; reconcile(); };
    runtime.joinNicklist = function (user) {
        try {
            var id = 'u' + runtime.userId(user);
            delete excluded[id];
            if (!records[id]) { reconcileUser(user, true); }
            reconcile();
        } catch (error) { warn(); }
    };
    runtime.leaveNicklist = function (userId, user) {
        try {
            var id = 'u' + (user ? runtime.userId(user) : runtime.numericUserId(userId)), record = records[id];
            excluded[id] = true;
            runtime.getViews().forEach(function (view) { if ('u' + view.userId === id) { delete view.listenerPresence; } });
            if (user || record) { reconcileUser(user || record.user, true); }
            delete records[id];
            schedule();
        } catch (error) { warn(); }
    };
    runtime.stopNicklist = function () {
        enabled = false; clearTimeout(timer); timer = null;
        Object.keys(records).forEach(function (id) {
            try { runtime.applyNicklist(records[id].user, records[id], []); } catch (error) { warn(); }
        });
        runtime.getViews().forEach(function (view) { delete view.listenerPresence; });
    };
    runtime.observeChanges(function (kind) {
        if (kind === 'station' || kind === 'radio-closed') { reconcile(); }
    });
};

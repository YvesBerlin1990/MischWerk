/* Verifizierte Websitebefehle verwenden die vorhandenen Fachaktionen und Revisionen. */
MischWerkModules.attachWebsiteCommands = function (runtime) {
    'use strict';
    function content(data) {
        return JSON.stringify({type:data.type, data:Object.keys(data.data || {}).filter(function (key) {
            return key !== 'pin' && key !== 'pinConfirmation';
        }).reduce(function (safe, key) { safe[key] = data.data[key]; return safe; }, {})});
    }
    runtime.websiteState = function (auth, data) {
        var view = data.view || 'studio';
        if (['studio', 'team', 'schedule'].indexOf(view) === -1 || (view === 'team' && !runtime.isChannelOwner(auth.user))) {
            throw runtime.failure('Dieser Arbeitsbereich ist für dich nicht freigegeben.');
        }
        var entry = auth.entry, items = runtime.wishItems();
        if (typeof data.page === 'number' && isFinite(data.page)) { entry.page = Math.max(0, Math.floor(data.page)); }
        else if (entry.queueId) { items.some(function (item, index) { if (item.id === entry.queueId) { entry.page = index; return true; } return false; }); }
        var state = runtime.snapshot(auth.user, entry.page, 0, null, data.radioModeratorPage, view);
        entry.page = state.page; entry.queueId = view === 'studio' && state.queue.length ? state.queue[0].id : null;
        state.view = view;
        if (view === 'team') { state.channelTexts = runtime.channelTextsView(auth.user); }
        if (view === 'schedule') { state.schedule = runtime.schedulePage(auth.user, data.week, data.schedulePage); }
        return state;
    };
    runtime.runWebsiteAction = function (auth, type, data) {
        var user = auth.user;
        if (type === 'mw:onAir' || type === 'mw:offAir') { return runtime.changeModeration(user, type, data) || 'Studioanmeldung aktualisiert.'; }
        if (type === 'mw:setTopic' || type === 'mw:setRequests') { runtime.changeShow(user, type, data); return 'Einstellung gespeichert.'; }
        if (type.indexOf('mw:handover.') === 0) { return runtime.changeHandover(user, type, data); }
        if (type === 'mw:addRadioModerator' || type === 'mw:removeRadioModerator') {
            runtime.manageRadioModerator(user, type, data); return 'Radio-Team aktualisiert.';
        }
        if (type === 'mw:channelTexts.save') { return runtime.changeChannelTexts(user, data); }
        if (type === 'mw:schedule.save' || type === 'mw:schedule.delete') {
            runtime.changeSchedule(user, type, data); runtime.changed('schedule'); return 'Sendeplan gespeichert.';
        }
        if (['mw:ackRequest', 'mw:setWishStage', 'mw:resolveRequest'].indexOf(type) !== -1) {
            if (typeof data.id !== 'number' || data.id !== auth.entry.queueId) {
                throw runtime.failure('Bitte diesen Musikwunsch zuerst im Arbeitsbereich öffnen.');
            }
            if (!runtime.canUseModeration(user)) { throw runtime.failure('Bitte zuerst zur Moderation anmelden.'); }
            if (type === 'mw:ackRequest') { runtime.deliverWish(data.id, user); return 'Wunsch empfangen.'; }
            if (type === 'mw:setWishStage') { runtime.changeWishStage(user, data); return 'Wunschstatus gespeichert.'; }
            runtime.resolveRequest(user, data); return 'Wunsch bearbeitet.';
        }
        throw runtime.failure('Diese Websiteaktion ist nicht verfügbar.');
    };
    function action(auth, data) {
        if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(data.requestId) ||
                typeof data.type !== 'string' || !data.data || typeof data.data !== 'object' || Array.isArray(data.data)) {
            throw runtime.failure('Ungültige Websiteaktion.');
        }
        var body = content(data);
        var old = auth.entry.results.filter(function (item) { return item.id === data.requestId; })[0];
        if (old) {
            var wishControl = data.type === 'mw:setRequests' && runtime.canAdminister(auth.user);
            var administrative = /^(mw:(addRadioModerator|removeRadioModerator|channelTexts[.]|schedule[.]))/.test(data.type) && runtime.canAdminister(auth.user);
            if (!wishControl && !administrative && !runtime.canUseModeration(auth.user)) { throw runtime.failure('Bitte zuerst zur Moderation anmelden.'); }
            if (data.type === 'mw:onAir' || data.type === 'mw:handover.accept') {
                runtime.prepareModerationPin(auth.user, data.data, runtime.copy(runtime.state));
            }
            if (old.content !== body) { throw runtime.failure('Diese Anfragekennung wurde bereits anders verwendet.'); }
            return old.result;
        }
        var result = { message:runtime.runWebsiteAction(auth, data.type, data.data) };
        auth.entry.results.push({ id:data.requestId, content:body, result:result });
        if (auth.entry.results.length > 32) { auth.entry.results.shift(); }
        try { runtime.broadcast(); } catch (error) { runtime.warn('WEBSITE_NOTIFY'); }
        return result;
    }
    runtime.websiteAction = function (auth, data) {
        var waiting = auth.entry.pinAction, body = content(data);
        if (waiting && waiting.id === data.requestId) {
            if (waiting.content !== body) { throw runtime.failure('Diese Anfragekennung wurde bereits anders verwendet.'); }
            if (!waiting.done) { return {pending:true}; }
            delete auth.entry.pinAction;
            if (waiting.error) { throw runtime.failure(waiting.error); }
            if (!runtime.canUseModeration(auth.user)) { throw runtime.failure('Bitte zuerst zur Moderation anmelden.'); }
            return waiting.result;
        }
        try { return action(auth, data); }
        catch (error) {
            var ticket = {id:data.requestId, content:body, done:false};
            if (!runtime.deferModerationPin(error, function () {
                ticket.result = action(runtime.websiteSession(data.token), data); ticket.done = true;
            }, function (failure) {
                ticket.error = failure.publicMessage || 'Die PIN konnte nicht geprüft werden. Bitte erneut versuchen.'; ticket.done = true;
            }, function () { return runtime.websiteSession(data.token).entry === auth.entry; })) { throw error; }
            auth.entry.pinAction = ticket;
            return {pending:true};
        }
    };
};

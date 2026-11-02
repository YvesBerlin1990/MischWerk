/* Bestätigte Studio-Übergabe: laufende Anfrage, berechtigte Teilnehmer und Annahme. */
MischWerkModules.attachHandover = function (runtime) {
    'use strict';
    var pending = null;
    var revision = 0;
    function clear() { if (pending) { pending = null; revision += 1; return true; } return false; }
    function participants() {
        return KnuddelsServer.getChannel().getOnlineUsers(UserType.Human).filter(function (user) {
            return runtime.isModerator(user);
        });
    }
    runtime.pruneHandover = function () {
        if (!pending) { return; }
        try {
            if (runtime.shuttingDown || !runtime.moderatorIsActive() || runtime.moderatorKey() !== pending.moderatorKey ||
                    !participants().some(function (user) { return runtime.userId(user) === pending.toId; })) { clear(); }
        } catch (error) { clear(); runtime.warn('HANDOVER_VALIDATE'); }
    };
    runtime.dropHandoverForUser = function (userId) {
        return pending && (pending.fromId === userId || pending.toId === userId) ? clear() : false;
    };
    runtime.handoverSnapshot = function (user) {
        runtime.pruneHandover();
        var userId = runtime.userId(user);
        var active = runtime.moderatorIsActive() && runtime.state.moderator.userId === userId;
        var view = { revision: revision, candidates: [], outgoing: null, incoming: null };
        if (!runtime.isModerator(user)) { return view; }
        if (active && !pending) {
            view.candidates = participants().filter(function (person) {
                return runtime.userId(person) !== userId;
            }).map(function (person) { return runtime.nick(person); }).sort();
        }
        if (pending && pending.fromId === userId) { view.outgoing = { id: pending.id, nick: pending.toNick }; }
        if (pending && pending.toId === userId) { view.incoming = { id: pending.id, nick: pending.fromNick }; }
        return view;
    };
    runtime.changeHandover = function (user, type, data) {
        runtime.pruneHandover();
        if (!runtime.isModerator(user)) { throw runtime.failure('Nur die Radio-Moderation darf eine Übergabe verwenden.'); }
        var userId = runtime.userId(user);
        if (type === 'mw:handover.request') {
            if (!runtime.moderatorIsActive() || runtime.state.moderator.userId !== userId ||
                    typeof data.expectedModerator !== 'string' || data.expectedModerator !== runtime.moderatorKey()) {
                throw runtime.failure('Nur die aktuell angemeldete Moderation kann ihre Sendung übergeben.');
            }
            var nick = runtime.text(data.nick, 50, true);
            var target = participants().filter(function (person) {
                return runtime.userId(person) !== userId && runtime.nick(person).toLowerCase() === nick.toLowerCase();
            })[0];
            if (!target) { throw runtime.failure('Bitte einen anwesenden Radiomoderator auswählen.'); }
            if (pending) {
                if (pending.fromId === userId && pending.toId === runtime.userId(target)) { return 'Übergabe ist bereits angefragt.'; }
                throw runtime.failure('Bitte die offene Übergabe zuerst abbrechen.');
            }
            revision += 1;
            pending = { id: 'handover-' + runtime.now() + '-' + revision, moderatorKey: runtime.moderatorKey(),
                fromId: userId, fromNick: runtime.nick(user), toId: runtime.userId(target), toNick: runtime.nick(target) };
            runtime.notifyHandover(target, pending.fromNick);
            return 'Übergabe angefragt. Du bleibst bis zur Annahme ON AIR.';
        }
        if (!pending || data.id !== pending.id) { throw runtime.failure('Diese Übergabe ist nicht mehr verfügbar.'); }
        if (type === 'mw:handover.cancel' && pending.fromId === userId) { clear(); return 'Übergabe abgebrochen.'; }
        if (type === 'mw:handover.decline' && pending.toId === userId) { clear(); return 'Übergabe abgelehnt.'; }
        if (type !== 'mw:handover.accept' || pending.toId !== userId) {
            throw runtime.failure('Diese Übergabe ist nicht für dich vorgesehen.');
        }
        runtime.transferModeration(user, pending.moderatorKey, data.topic === undefined ? '' : data.topic);
        clear();
        return 'Sendung übernommen. Du bist jetzt ON AIR.';
    };
};

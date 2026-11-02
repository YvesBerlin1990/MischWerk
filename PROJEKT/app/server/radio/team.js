/* Channelinhaber ernennt und entfernt Radiomoderatoren. */
MischWerkModules.attachRadioTeam = function (runtime, config) {
    'use strict';

    runtime.manageRadioModerator = function (user, type, data) {
        if (!runtime.isChannelOwner(user)) {
            throw runtime.failure('Nur der Channelinhaber darf Radiomoderatoren verwalten.');
        }
        if (data.expectedRadioModeratorRevision !== undefined &&
                data.expectedRadioModeratorRevision !== runtime.state.radioModeratorRevision) {
            throw runtime.failure('Das Radio-Team wurde inzwischen geändert. Bitte erneut prüfen.');
        }
        var next = runtime.copy(runtime.state);
        var userId;
        var nick;
        if (type === 'mw:addRadioModerator') {
            nick = runtime.text(data.nick, 50, true);
            var access = KnuddelsServer.getUserAccess();
            if (!access.exists(nick)) { throw runtime.failure('Dieser Knuddels-Nick existiert nicht.'); }
            try { userId = runtime.numericUserId(access.getUserId(nick)); }
            catch (error) { throw runtime.failure('Dieser Knuddels-Nick konnte nicht aufgelöst werden.'); }
            if (userId === runtime.userId(user)) {
                throw runtime.failure('Der Channelinhaber ist bereits dauerhaft für das Studio berechtigt.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) !== -1) {
                throw runtime.failure('Dieser Nutzer ist bereits Radiomoderator.');
            }
            if (next.radioModeratorUserIds.length >= 50) {
                throw runtime.failure('Es können höchstens 50 Radiomoderatoren ernannt werden.');
            }
            next.radioModeratorUserIds.push(userId);
            nick = String(access.getNick(userId));
        } else if (type === 'mw:removeRadioModerator') {
            userId = data.userId;
            if (typeof userId !== 'number' || !isFinite(userId) || userId <= 0 || Math.floor(userId) !== userId) {
                throw runtime.failure('Ungültiger Radiomoderator.');
            }
            if (next.radioModeratorUserIds.indexOf(userId) === -1) {
                throw runtime.failure('Dieser Nutzer ist kein Radiomoderator mehr.');
            }
            next.radioModeratorUserIds = next.radioModeratorUserIds.filter(function (id) { return id !== userId; });
            if (next.moderator && next.moderator.userId === userId) {
                next.moderator = null;
            }
        } else { throw runtime.failure('Unbekannte Radio-Team-Aktion.'); }
        next.radioModeratorRevision = runtime.state.radioModeratorRevision + 1;
        runtime.persist(next);
        return nick;
    };

    runtime.radioModeratorViews = function (user, page) {
        if (!runtime.isChannelOwner(user)) { return { items: [], total: 0, page: 0, pages: 1 }; }
        var access = KnuddelsServer.getUserAccess();
        var total = runtime.state.radioModeratorUserIds.length;
        var pages = Math.max(1, Math.ceil(total / runtime.radioModeratorPageSize));
        page = Math.max(0, Math.min(pages - 1, Math.floor(Number(page) || 0)));
        var ids = runtime.state.radioModeratorUserIds.slice(page * runtime.radioModeratorPageSize,
            (page + 1) * runtime.radioModeratorPageSize);
        return { items: ids.map(function (userId) {
            var nick;
            try { nick = String(access.getNick(userId)); }
            catch (error) { nick = 'Unbekannter Nutzer #' + userId; }
            return { userId: userId, nick: nick };
        }), total: total, page: page, pages: pages };
    };
};

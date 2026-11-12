/* Nur eigene Bildpfade vormerken; ungewisse API-Aufrufe bleiben bereinigbar. */
MischWerkModules.attachNicklistStorage = function (runtime) {
    'use strict';
    var key = 'mischwerk.nicklist-icons.v1';
    var paths;
    function validPath(path, kind) {
        return typeof path === 'string' && path.length <= 2000 &&
            /^https?:\/\/[^\s\u0000-\u001f°<>]+$/.test(path) &&
            path.split('?')[0].slice(-('img/nicklist/' + kind + '.png').length) === 'img/nicklist/' + kind + '.png';
    }
    runtime.nicklistImagePaths = function () {
        if (!paths) {
            var resolved = {};
            ['team', 'listener', 'moderator'].forEach(function (kind) {
                var path = String(KnuddelsServer.getFullImagePath('img/nicklist/' + kind + '.png'));
                if (!validPath(path, kind)) { throw new Error('Nicklist image path'); }
                resolved[kind] = path;
            });
            paths = resolved;
        }
        return paths;
    };
    function write(user, record) {
        user.getPersistence().setObject(key, { version:1, paths:record.entries.map(function (entry) {
            return { kind:entry.kind, path:entry.path, status:entry.status };
        }) });
        record.dirty = false;
    }
    function read(user, record) {
        if (record.loaded) { return; }
        var saved = user.getPersistence().getObject(key, null);
        if (saved !== null && (!saved || saved.version !== 1 || !Array.isArray(saved.paths) || saved.paths.length > 2)) {
            throw new Error('Nicklist cleanup record');
        }
        var entries = saved ? saved.paths : [];
        entries.forEach(function (entry, index) {
            if (!entry || ['team', 'listener', 'moderator'].indexOf(entry.kind) === -1 ||
                    !validPath(entry.path, entry.kind) || ['possible', 'set', 'remove'].indexOf(entry.status) === -1 ||
                    entries.some(function (other, otherIndex) { return otherIndex < index && other.path === entry.path; })) {
                throw new Error('Nicklist cleanup path');
            }
        });
        // Nach Start/Wiederbeitritt zuerst jeden alten Pfad entfernen, auch einen weiter benötigten.
        record.entries = entries.map(function (entry) {
            return { kind:entry.kind, path:entry.path, status:'remove', live:false };
        });
        record.loaded = true;
    }
    runtime.applyNicklist = function (user, record, desired) {
        try {
            read(user, record);
            var images = desired.length ? runtime.nicklistImagePaths() : {};
            var failed = false;
            record.entries.slice().forEach(function (entry) {
                if (entry.live && desired.indexOf(entry.kind) !== -1 && images[entry.kind] === entry.path) { return; }
                entry.status = 'remove'; record.dirty = true;
                try { write(user, record); } catch (saveError) { runtime.warn('NICKLIST_WRITE'); }
                try {
                    user.removeNicklistIcon(entry.path);
                    record.entries = record.entries.filter(function (other) { return other !== entry; });
                    record.dirty = true;
                } catch (removeError) {
                    entry.live = false; record.dirty = true; failed = true; runtime.warn('NICKLIST_REMOVE');
                }
            });
            if (record.dirty) {
                try { write(user, record); }
                catch (cleanupError) { failed = true; runtime.warn('NICKLIST_WRITE'); }
            }
            if (failed) { return false; }
            desired.forEach(function (kind) {
                if (failed || record.entries.some(function (entry) { return entry.kind === kind && entry.live; })) { return; }
                if (record.entries.length >= 2) { failed = true; return; }
                var entry = { kind:kind, path:images[kind], status:'possible', live:false };
                record.entries.push(entry); record.dirty = true;
                try { write(user, record); }
                catch (prepareError) {
                    // Ohne dauerhaften Nachweis niemals die native Hinzufügung versuchen.
                    record.entries.pop(); failed = true; runtime.warn('NICKLIST_WRITE'); return;
                }
                try { user.addNicklistIcon(entry.path, kind === 'team' ? 32 : 24); entry.live = true; entry.status = 'set'; }
                catch (addError) { failed = true; runtime.warn('NICKLIST_ADD'); }
                record.dirty = true;
                try { write(user, record); }
                catch (addedError) { failed = true; runtime.warn('NICKLIST_WRITE'); }
            });
            return !failed;
        } catch (error) { runtime.warn('NICKLIST_RECORD'); return false; }
    };
};

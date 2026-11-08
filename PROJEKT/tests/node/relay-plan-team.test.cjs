// Regulärer signierter HTTP-Port mit echten Fachmodulen und isolierter Knuddels-Persistenz.
const test = require('node:test'), assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const url = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
const privateKey = 'mischwerk.android.private.v1', prefix = 'mischwerk.schedule.v1.';
const plain = value => JSON.parse(JSON.stringify(value));
function fixture(options = {}) {
  const store = options.store || persistence({ [privateKey]: { enabled: true, runtimeVerified: true, syncSecret: 's'.repeat(64), syncUrl: url } });
  const calls = []; let runtime;
  const h = createHarness(store, { users: [{ id: 1, nick: 'Otterchen', role: 'owner' }, { id: 2, nick: 'DJ Test' }],
    serverMethods: { getExternalServerAccess: () => ({ canAccessURL: () => true, postURL(target, p) { calls.push({ target, p }); } }) },
    configureModules(c) {
      if (options.nullNick) {
        const access = c.KnuddelsServer.getUserAccess;
        c.KnuddelsServer.getUserAccess = () => ({ ...access(), getNick: () => null });
      }
      if (process.env.MISCHWERK_RELAY_BASELINE) {
        const old = require('node:child_process').execFileSync('git', ['show', 'HEAD:PROJEKT/src/backend/android/publisher.js'], { encoding: 'utf8' });
        require('node:vm').runInContext(old, c);
      }
      const attach = c.MischWerkModules.attachAndroidPublisher;
      c.MischWerkModules.attachAndroidPublisher = r => { attach(r); runtime = r; };
    } });
  return { h, store, calls, runtime, body: () => JSON.parse(calls.at(-1).p.data.payload),
    reply(extra = {}, options = {}) {
      const call = calls[options.index === undefined ? calls.length - 1 : options.index];
      call.p[options.failure ? 'onFailure' : 'onSuccess'](JSON.stringify({ accepted: true, serverTime: h.now(), wishes: [], ...extra }),
        { getResponseCode: () => options.status || 200, getURLString: () => options.url || url });
    },
    tick(extra = {}, options = {}) { h.advance(20000); this.reply(extra, options); },
    week() { return runtime.scheduleWeek(runtime.scheduleToday()); },
    saved(week) { return plain(runtime.readScheduleWeek(week || this.week())); },
    schedule(command) { this.reply({ scheduleCommands: [command] }); },
    team(command) { this.reply({ moderatorCommands: [command] }); }
  };
}
function command(f, overrides = {}) {
  return { commandId: 'plan-1', operation: 'save', week: f.week(), expectedRevision: 0,
    entry: { date: f.runtime.scheduleToday(), kind: 'live', timing: 'fixed', start: '18:00', end: '19:00', nick: 'Otterchen', topic: 'Sendung' }, ...overrides };
}
const teamCommand = overrides => ({ commandId: 'team-1', operation: 'add', expectedRevision: 0, nick: 'DJ Test', ...overrides });
function seed(f, week, count) {
  const entries = Array.from({ length: count }, (_, i) => ({ id: i + 1, date: week, start: '18:00', end: '19:00', kind: 'live', timing: 'fixed',
    nick: 'Otterchen', userId: 1, topic: 'Ä'.repeat(80) + i }));
  const weeks = f.store.data[prefix + 'weeks'] || [];
  f.store.setObject(prefix + 'weeks', [...new Set([...weeks, week])]);
  f.store.setObject(prefix + week, { version: 1, revision: 1, nextId: count + 1, entries });
}
test('Erster regulärer POST ergänzt ausschließlich öffentliche Wochen und ein echtes Teamobjekt', () => {
  const f = fixture(), body = f.body();
  assert.ok(Array.isArray(body.scheduleUpdates), 'Öffentliche Wochenprojektion im regulären Status-POST');
  assert.equal(body.scheduleUpdates.length, 3); assert.deepEqual(body.teamUpdates, { revision: 0, moderators: [] });
  for (const page of body.scheduleUpdates) assert.deepEqual(page, plain(f.runtime.publicWebsitePlan(page.week, page.page)));
  assert.ok(body.scheduleUpdates.every(page => page.entries.length === 0), 'Keine künstlichen AutoDJ-Sendungen');
  assert.doesNotMatch(JSON.stringify(body), /userId|radioModeratorUserIds|authorization|syncSecret/);
  assert.ok(body.station.ticker); assert.deepEqual(body.wishUpdates, []);
  f.reply(); f.h.advance(20000); assert.equal(f.body().scheduleUpdates, undefined); assert.equal(f.body().teamUpdates, undefined);
});
test('Native Planänderung quittiert zuerst den Erfolg und sendet danach genau eine Änderungsnachricht', () => {
  const f = fixture(); f.reply(); const owner = f.h.user(1, 'Otterchen');
  const radio = owner.sessions.find(s => s.content.viewMode === 'Headerbar'); f.h.event(owner, radio, 'mw:openSchedule');
  const session = owner.sessions.find(s => s.content.htmlFile.pageData.view === 'schedule'), row = command(f);
  const events = f.h.event(owner, session, 'mw:schedule.save', { ...row.entry, week: row.week, expectedRevision: 0, requestId: 'native-plan' });
  assert.deepEqual(events.map(e => e.type), ['mw:schedule.result', 'mw:schedule.changed']);
  assert.equal(events[0].data.ok, true); assert.equal(f.body().scheduleUpdates[0].entries.length, 1);
});
test('Mehr als vier Wochen-Seiten werden in regulären Folgeposts vollständig geliefert; verlorene Antworten wiederholen Seiten', () => {
  const f = fixture(); f.reply(); seed(f, f.week(), 105); f.h.advance(20000);
  const first = f.body().scheduleUpdates; assert.equal(first.length, 4); assert.deepEqual(first.map(p => p.page), [0, 1, 2, 3]);
  f.reply({}, { status: 503 }); f.h.advance(20000); assert.deepEqual(f.body().scheduleUpdates, first);
  const calls = f.calls.length; f.reply(); assert.equal(f.calls.length, calls, 'Weitere Seiten warten auf den regulären Takt');
  f.h.advance(20000); const rest = f.body().scheduleUpdates.filter(p => p.week === f.week());
  assert.deepEqual(rest.map(p => p.page), [4, 5]);
  assert.equal([...first, ...rest].flatMap(p => p.entries).length, 105);
  f.reply(); f.h.advance(20000); assert.equal(f.body().scheduleUpdates, undefined);
});
test('Neue Revision während laufender Seitensendung startet eine vollständige neue Folge', () => {
  const f = fixture(); f.reply(); seed(f, f.week(), 105); f.h.advance(20000);
  const saved = f.saved(); saved.entries[0].topic = 'Neu'; f.runtime.writeScheduleWeek(f.week(), saved); f.runtime.changed('schedule'); f.reply();
  assert.equal(f.body().scheduleUpdates[0].page, 0); assert.equal(f.body().scheduleUpdates[0].revision, 2);
  assert.equal(f.body().scheduleUpdates[0].entries[0].topic, 'Neu');
});
test('Teamrevision und aufgelöste Nicks werden einmal übertragen; andere Senderänderungen senden kein Team', () => {
  const f = fixture(); f.team(teamCommand());
  assert.deepEqual(plain(f.runtime.state.radioModeratorUserIds), [2]);
  assert.equal(f.calls.length, 1, 'Keine rekursive Sendung aus einem Rückauftrag');
  f.h.advance(20000); assert.deepEqual(f.body().teamUpdates, { revision: 1, moderators: [{ nick: 'DJ Test' }] });
  assert.deepEqual(f.body().moderatorResults, [{ commandId: 'team-1', state: 'applied', revision: 1 }]);
  f.reply(); f.h.advance(20000); assert.equal(f.body().teamUpdates, undefined); assert.equal(f.body().moderatorResults, undefined);
  f.runtime.state.topic = 'Nur Thema'; f.runtime.changed('station'); f.reply(); f.h.advance(20000); assert.equal(f.body().teamUpdates, undefined);
});
test('Vorgeprüfter Relayauftrag ohne Rollenfelder speichert ohne anwesenden Inhaber; Wiederholung und Neustart wenden ihn nur einmal an', () => {
  const f = fixture(), row = command(f); f.h.user(1, 'Otterchen').online = false; f.schedule(row);
  assert.equal(f.saved().revision, 1); assert.equal(f.saved().entries.length, 1); assert.equal(f.calls.length, 1);
  f.h.advance(20000); assert.deepEqual(f.body().scheduleResults, [{ commandId: 'plan-1', state: 'applied', revision: 1 }]);
  f.schedule({ ...row, entry: { ...row.entry, topic: 'Darf nicht geändert werden' } }); assert.equal(f.saved().entries[0].topic, 'Sendung');
  f.h.app.onShutdown(); const reboot = fixture({ store: f.store }); reboot.schedule(row);
  assert.equal(reboot.saved().revision, 1); assert.equal(reboot.saved().entries.length, 1);
  reboot.h.advance(20000); assert.equal(reboot.body().scheduleResults[0].state, 'applied');
});
test('Speichern, Ändern und Löschen verwenden Wochenrevisionen und die bestehenden Zeitregeln', () => {
  const f = fixture(), row = command(f); f.schedule(row);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'edit', id: 1, expectedRevision: 1, entry: { ...row.entry, topic: 'Geändert' } }] });
  assert.equal(f.saved().entries[0].topic, 'Geändert'); assert.equal(f.saved().revision, 2);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'delete', operation: 'delete', id: 1, expectedRevision: 2 }] });
  assert.equal(f.saved().entries.length, 0); assert.equal(f.saved().revision, 3);
  f.h.advance(20000); assert.deepEqual(f.body().scheduleResults, [{ commandId: 'delete', state: 'applied', revision: 3 }]);
  assert.ok(f.body().scheduleUpdates.some(p => p.week === row.week && p.entries.length === 0));
});
test('Konflikte, Minuten, unbekannte Nicks, Überschneidungen und Sommerzeitlücken werden abgelehnt', () => {
  const variants = [row => ({ ...row, expectedRevision: 2 }), row => ({ ...row, entry: { ...row.entry, start: '18:30' } }),
    row => ({ ...row, entry: { ...row.entry, nick: 'Unbekannt' } }), row => ({ ...row, entry: { ...row.entry, nick: 'DJ Test' } }),
    row => ({ ...row, week: '2027-03-22', entry: { ...row.entry, date: '2027-03-28', start: '02:00', end: '03:00' } }),
    row => ({ ...row, entry: { ...row.entry, end: row.entry.start } })];
  for (const modify of variants) {
    const f = fixture(), row = modify(command(f)); f.schedule(row);
    assert.equal(f.saved(row.week).entries.length, 0); f.h.advance(20000); assert.equal(f.body().scheduleResults[0].state, 'rejected');
    assert.equal(f.saved(row.week).revision, 0, 'Ablehnung erhöht die Fachrevision nicht');
  }
  const f = fixture(), row = command(f); f.schedule(row); f.tick({ scheduleCommands: [{ ...row, commandId: 'overlap', expectedRevision: 1 }] });
  assert.equal(f.saved().entries.length, 1); f.h.advance(20000); assert.equal(f.body().scheduleResults[0].state, 'rejected');
});
test('Behauptete Firebase-Rollen in nativen Clientdaten verleihen keine Sendeplan- oder Teamrechte', () => {
  const f = fixture(), person = f.h.user(2, 'DJ Test'), radio = person.sessions.find(s => s.content.viewMode === 'Headerbar');
  const claims = { source: 'firebase', role: 'admin', verified: true, authorization: { source: 'firebase', role: 'admin', verified: true } };
  f.h.event(person, radio, 'mw:openSchedule');
  const session = person.sessions.find(s => s.content.htmlFile.pageData.view === 'schedule'), row = command(f);
  const events = f.h.event(person, session, 'mw:schedule.save', { ...row.entry, week: row.week, expectedRevision: 0, requestId: 'forged-claims', ...claims });
  assert.equal(events.find(e => e.type === 'mw:schedule.result').data.ok, false);
  f.h.event(person, radio, 'mw:addRadioModerator', { nick: 'DJ Test', expectedRadioModeratorRevision: 0, ...claims });
  assert.equal(f.saved().entries.length, 0); assert.equal(f.runtime.state.radioModeratorRevision, 0);
});
test('Nicht bestätigte, fremde, verspätete und gestoppte HTTP-Antworten führen keine Fachaufträge aus', () => {
  for (const opts of [{ status: 401 }, { failure: true }, { url: 'https://evil.invalid' }, { late: true }, { stopped: true }, { accepted: false }]) {
    const f = fixture(); if (opts.late) f.h.advance(10001); if (opts.stopped) f.h.app.onShutdown();
    f.reply({ accepted: opts.accepted === false ? false : true, scheduleCommands: [command(f)], moderatorCommands: [teamCommand()] }, opts);
    assert.equal(f.saved().entries.length, 0); assert.equal(f.runtime.state.radioModeratorRevision, 0);
  }
});
test('Mehrfachaufträge und ungültige Kennungen verändern nichts; einzelne Bereiche bleiben unabhängig', () => {
  const f = fixture(), row = command(f); f.reply({ scheduleCommands: [row, { ...row, commandId: 'extra' }], moderatorCommands: [teamCommand()] });
  assert.equal(f.saved().entries.length, 0); assert.equal(f.runtime.state.radioModeratorRevision, 1);
  f.tick({ scheduleCommands: [command(f, { commandId: 'bad/id' })] }); assert.equal(f.saved().entries.length, 0);
  f.tick({ scheduleCommands: [command(f, { commandId: '__proto__' })] }); assert.equal(f.saved().entries.length, 1);
});
test('Beide Auftragsbereiche und Androidwünsche teilen dieselbe Antwort ohne rekursive Sendeschleife', () => {
  const f = fixture(); f.reply({ scheduleCommands: [command(f)], moderatorCommands: [teamCommand()],
    wishes: [{ submissionId: 'existing-wish', text: 'Band – Titel', displayName: null }] });
  assert.equal(f.saved().entries.length, 1); assert.equal(f.runtime.state.radioModeratorRevision, 1); assert.equal(f.runtime.wishItems().length, 1);
  assert.equal(f.calls.length, 1); f.h.advance(20000); assert.equal(f.body().wishUpdates[0].state, 'queued');
  assert.equal(f.body().scheduleResults[0].state, 'applied'); assert.equal(f.body().moderatorResults[0].state, 'applied');
});
test('Leere Auftragsarrays erhalten die bisherige Nachlieferung großer Wunschquittungsmengen', () => {
  const f = fixture(); f.reply(); const at = f.h.now() - 120000;
  f.store.setObject('mischwerk.android.receipts.v1', { version: 1, entries: Array.from({ length: 205 }, (_, i) => ({
    submissionId: 'old-' + i, state: 'done', position: null, createdAt: at, at, committed: true, dirty: true, revision: 1 })) });
  f.h.app.onShutdown(); const reboot = fixture({ store: f.store });
  for (let i = 0; i < 3; i++) reboot.reply({ scheduleCommands: [], moderatorCommands: [] });
  assert.deepEqual(reboot.calls.map(call => JSON.parse(call.p.data.payload).wishUpdates.length), [100, 100, 5]);
});
test('Teamregeln erhalten Nick-Auflösung, Duplikatprüfung, 50er-Limit, Revision und Entfernen', () => {
  const f = fixture(); f.team(teamCommand()); f.tick({ moderatorCommands: [teamCommand({ commandId: 'duplicate', expectedRevision: 1 })] });
  assert.equal(f.runtime.state.radioModeratorRevision, 1); f.h.advance(20000); assert.equal(f.body().moderatorResults[0].state, 'rejected');
  f.reply({ moderatorCommands: [teamCommand({ commandId: 'remove', operation: 'remove', expectedRevision: 1 })] });
  assert.deepEqual(plain(f.runtime.state.radioModeratorUserIds), []); assert.equal(f.runtime.state.radioModeratorRevision, 2);
  f.tick({ moderatorCommands: [teamCommand({ commandId: 'stale', expectedRevision: 1 })] }); assert.equal(f.runtime.state.radioModeratorRevision, 2);
  const full = fixture(); full.runtime.state.radioModeratorUserIds = Array.from({ length: 50 }, (_, i) => 100 + i);
  full.team(teamCommand()); assert.equal(full.runtime.state.radioModeratorUserIds.length, 50); assert.equal(full.runtime.state.radioModeratorRevision, 0);
  const invalid = fixture(); invalid.team(teamCommand({ nick: 'Unbekannt' })); assert.equal(invalid.runtime.state.radioModeratorRevision, 0);
});
test('Teamwiederholung nach Neustart verändert weder Revision noch die ursprüngliche Quittung', () => {
  const f = fixture(), row = teamCommand(); f.team(row); f.h.app.onShutdown(); const reboot = fixture({ store: f.store }); reboot.team(row);
  assert.equal(reboot.runtime.state.radioModeratorRevision, 1); assert.deepEqual(plain(reboot.runtime.state.radioModeratorUserIds), [2]);
  reboot.h.advance(20000); assert.deepEqual(reboot.body().moderatorResults, [{ commandId: 'team-1', state: 'applied', revision: 1 }]);
});
test('Bereits quittierte Ablehnungen bleiben endgültig; eine neue Auftragskennung wird regulär angewandt', () => {
  const f = fixture(), row = command(f);
  f.store.setObject(prefix + 'weeks', [f.week()]);
  f.store.setObject(prefix + f.week(), { version: 1, revision: 0, nextId: 1, entries: [],
    relayResults: [{ commandId: row.commandId, state: 'rejected', revision: 0 }] });
  f.schedule(row); assert.equal(f.saved().entries.length, 0);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'resubmitted-plan' }] });
  assert.equal(f.saved().entries.length, 1); assert.equal(f.saved().revision, 1);
  assert.equal(f.saved().relayResults.find(result => result.commandId === row.commandId).state, 'rejected');
});
test('Remoteentzug beendet fremde Moderation, erhält aber die automatischen Inhaberrechte und dessen aktive Sendung', () => {
  for (const ownerEntry of [false, true]) {
    const f = fixture(), nick = ownerEntry ? 'Otterchen' : 'DJ Test', person = f.h.user(ownerEntry ? 1 : 2, nick);
    f.team(teamCommand({ nick })); f.h.advance(20000); f.reply();
    const radio = person.sessions.find(s => s.content.viewMode === 'Headerbar');
    f.h.event(person, radio, 'mw:onAir'); assert.equal(f.runtime.state.moderator.userId, person.id);
    f.reply({ moderatorCommands: [teamCommand({ commandId: 'remove-active', operation: 'remove', expectedRevision: 1, nick })] });
    assert.deepEqual(plain(f.runtime.state.radioModeratorUserIds), []);
    assert.equal(!!f.runtime.state.moderator, ownerEntry);
    assert.equal(f.runtime.isModerator(f.h.user(1, 'Otterchen')), true);
  }
});
test('Speicherfehler bestätigen keine fachliche Annahme; Wiederzustellung nach Erholung bleibt möglich', () => {
  for (const kind of ['schedule', 'moderator']) {
    const f = fixture(), write = f.store.setObject;
    f.store.setObject = (key, value) => { if (key === prefix + f.week() || key === f.runtime.key) throw Error('private-storage'); write(key, value); };
    f.reply(kind === 'schedule' ? { scheduleCommands: [command(f)] } : { moderatorCommands: [teamCommand()] });
    assert.equal(f.saved().entries.length, 0); assert.equal(f.runtime.state.radioModeratorRevision, 0);
    assert.deepEqual(plain(f.runtime.pendingRelayResults()), {}); f.store.setObject = write;
    f.tick(kind === 'schedule' ? { scheduleCommands: [command(f)] } : { moderatorCommands: [teamCommand()] });
    assert.equal(kind === 'schedule' ? f.saved().entries.length : f.runtime.state.radioModeratorRevision, 1);
    assert.doesNotMatch(JSON.stringify(f.h.logs), /private-storage/);
  }
});
test('Persistierte Quittung und Fachdaten haben denselben Commit; verlorene Quittung wird erneut gesendet', () => {
  const f = fixture(); f.schedule(command(f)); const saved = f.store.data[prefix + f.week()];
  assert.equal(saved.entries.length, 1); assert.equal(saved.relayResults[0].revision, saved.revision);
  f.h.advance(20000); const result = f.body().scheduleResults; f.reply({}, { status: 503 }); f.h.advance(20000);
  assert.deepEqual(f.body().scheduleResults, result); assert.equal(f.saved().entries.length, 1);
});
test('Neue Quittungen gehen vor historischen Neustartbelegen im nächsten regulären POST', () => {
  const f = fixture(), weeks = [];
  for (let i = 1; i <= 65; i++) {
    const week = f.runtime.scheduleDay(f.week(), -7 * i); weeks.push(week);
    f.store.setObject(prefix + week, { version: 1, revision: 1, nextId: 1, entries: [],
      relayResults: [{ commandId: 'historical-' + i, state: 'applied', revision: 1 }] });
  }
  f.store.setObject(prefix + 'weeks', weeks); f.schedule(command(f)); f.h.advance(20000);
  assert.equal(f.body().scheduleResults.length, 64); assert.equal(f.body().scheduleResults[0].commandId, 'plan-1');
  f.reply(); f.h.advance(20000); assert.ok(f.body().scheduleResults.length);
  assert.ok(f.body().scheduleResults.every(row => row.commandId !== 'plan-1'));
});
test('Öffentliche Projektion filtert kurze Studioeinträge und überträgt ausschließlich bestehende öffentliche Felder', () => {
  const f = fixture(); f.reply(); const owner = f.h.user(1, 'Otterchen'), radio = owner.sessions.find(s => s.content.viewMode === 'Headerbar');
  f.h.event(owner, radio, 'mw:onAir'); assert.ok(f.body().scheduleUpdates.every(page => page.entries.length === 0)); f.reply();
  f.h.advance(300000); const rows = (f.body().scheduleUpdates || []).flatMap(page => page.entries);
  assert.ok(rows.length); for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ['date', 'end', 'id', 'kind', 'moderator', 'start', 'timing', 'topic', 'week']);
  assert.doesNotMatch(JSON.stringify(f.body()), /userId|broadcastKey|actualStart|shortBroadcast/);
});
test('Fehlende Nickauflösung blockiert nur Teamprojektion und erlaubt deren spätere Nachlieferung', () => {
  const missing = fixture({ nullNick: true }); missing.reply(); missing.runtime.state.radioModeratorUserIds = [2];
  missing.h.advance(20000); assert.equal(missing.body().teamUpdates, undefined); assert.ok(missing.body().station);
  const f = fixture(); f.reply(); f.runtime.state.radioModeratorUserIds = [999]; f.runtime.state.radioModeratorRevision = 1; f.h.advance(20000);
  assert.ok(f.body().station); assert.equal(f.body().teamUpdates, undefined); f.reply();
  f.h.user(999, 'Später aufgelöst'); f.h.advance(20000); assert.deepEqual(f.body().teamUpdates, { revision: 1, moderators: [{ nick: 'Später aufgelöst' }] });
});

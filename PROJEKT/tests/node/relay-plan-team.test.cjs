// Regulärer signierter HTTP-Port mit echten Fachmodulen und isolierter Knuddels-Persistenz.
const test = require('node:test'), assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const url = 'https://radio-mischwerk.web.app/api/publishKnuddelsState';
const privateKey = 'mischwerk.android.private.v1', prefix = 'mischwerk.schedule.v1.';
const plain = value => JSON.parse(JSON.stringify(value));
function fixture(options = {}) {
  const store = options.store || persistence({ [privateKey]: { enabled: true, runtimeVerified: true, syncSecret: 's'.repeat(64), syncUrl: url } });
  const calls = []; let runtime;
  const h = createHarness(store, { now: options.now, users: [{ id: 1, nick: 'Otterchen', role: 'owner' }, { id: 2, nick: 'DJ Test' }],
    serverMethods: { getExternalServerAccess: () => ({ canAccessURL: () => true, postURL(target, p) { calls.push({ target, p }); } }) },
    configureModules(c) {
      if (options.nullNick) {
        const access = c.KnuddelsServer.getUserAccess;
        c.KnuddelsServer.getUserAccess = () => ({ ...access(), getNick: () => null });
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
  return { commandId: 'plan-1', id: 'firebase-plan', operation: 'save', week: f.week(), expectedRevision: 0,
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
function native(f, entry = {}, id = 1) {
  const row = command(f).entry;
  return { ...row, userId: 1, id, ...entry };
}
function seedEntries(f, entries, revision = 0) {
  f.store.setObject(prefix + 'weeks', [f.week()]);
  f.store.setObject(prefix + f.week(), { version: 1, revision, nextId: Math.max(0, ...entries.map(e => e.id)) + 1, entries });
}
function result(f, kind = 'schedule') { f.h.advance(20000); return f.body()[kind + 'Results'][0]; }

test('Homepage-Inhalte bleiben für Live und AutoDJ im bestehenden Relay-Wochencommit unverändert', () => {
  for (const kind of ['live', 'autodj']) {
    const f=fixture(),row=command(f);
    Object.assign(row.entry,{kind,nick:kind==='live'?'otterchen':'MischWerk am Pult',topic:'  Web   Titel  '});
    f.schedule(row);
    const saved=f.saved().entries[0];
    assert.equal(saved.topic,row.entry.topic);assert.equal(saved.nick,row.entry.nick);
    assert.equal(saved.userId,kind==='live'?1:null,'Anzeigetext ersetzt keine native Identitätsprüfung');
  }
});
test('Studioabgleich erhält den Webtitel eines aktiv gebundenen Homepage-Eintrags', () => {
  const f=fixture(),row=command(f);
  Object.assign(row.entry,{timing:'allDay',start:'00:00',end:'',topic:'Web-Original'});f.schedule(row);
  const owner=f.h.user(1,'Otterchen'),radio=f.h.open(owner);
  f.h.event(owner,radio,'mw:onAir',{});f.h.event(owner,radio,'mw:setTopic',{topic:'Natives Studiothema'});
  assert.equal(f.runtime.state.topic,'Natives Studiothema');
  f.h.advance(1000);f.h.event(owner,radio,'mw:offAir');
  const saved=f.saved();assert.equal(saved.entries.length,1);assert.ok(saved.entries[0].actualEnd);
  assert.equal(saved.entries[0].topic,'Web-Original');
});
test('Unveränderte Webtexte überschreiten keine Grenzen und übernehmen keine Steuerzeichen', () => {
  for(const entry of [{topic:' '.repeat(81)+'Titel'},{topic:'Web\tTitel'},{nick:'Otterchen\n'},{nick:'Otterchen'+' '.repeat(50)}]) {
    const f=fixture(),row=command(f);Object.assign(row.entry,entry);f.schedule(row);
    assert.equal(f.saved().entries.length,0);assert.equal(result(f).reason,'validation');
  }
});

test('Stabile ID ändert und löscht genau denselben nativen Eintrag nach Neustart', () => {
  const f = fixture(), row = command(f); f.schedule(row); f.h.app.onShutdown();
  const reboot = fixture({ store: f.store, now: f.h.now() });
  reboot.schedule({ ...row, commandId: 'edit', expectedRevision: 1, entry: { ...row.entry, topic: 'Neu' } });
  assert.equal(reboot.saved().entries.length, 1); assert.equal(reboot.saved().entries[0].id, 1);
  assert.equal(reboot.saved().entries[0].topic, 'Neu');
  reboot.tick({ scheduleCommands: [{ ...row, commandId: 'delete', operation: 'delete', expectedRevision: 2, entry: null }] });
  assert.equal(reboot.saved().revision, 3); assert.deepEqual(reboot.saved().entries, []);
  assert.deepEqual(reboot.saved().relayBindings, [{ firebaseId: row.id, nativeId: 1, deleted: true }]);
});
test('Exakter normalisierter Ausgangsbestand wird ohne Dublette an seine native ID gebunden', () => {
  const f = fixture(); seedEntries(f, [native(f, {}, 7)]);
  const row = command(f); row.entry.topic = '  Sendung  '; row.entry.nick = 'otterchen';
  f.schedule(row);
  assert.equal(f.saved().entries.length, 1); assert.equal(f.saved().nextId, 8);
  assert.deepEqual(f.saved().relayBindings, [{ firebaseId: row.id, nativeId: 7, deleted: false }]);
  assert.equal(result(f).state, 'applied');
});
test('Alte native Felddaten werden vor dem exakten Bestandsvergleich normalisiert', () => {
  const f = fixture(), entry = native(f, { topic: ' Sendung  ' }); delete entry.kind; delete entry.timing;
  seedEntries(f, [entry]); f.schedule(command(f));
  assert.equal(f.saved().entries.length, 1); assert.equal(f.saved().relayBindings[0].nativeId, 1);
});
test('Belegte native ID bleibt auch bei zurückgesetztem Zähler für eine zweite Firebase-ID gesperrt', () => {
  const f = fixture(), row = command(f); f.schedule(row);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'delete', expectedRevision: 1, operation: 'delete', entry: null }] });
  const saved = f.saved(); saved.nextId = 1; f.store.setObject(prefix + f.week(), saved);
  f.tick({ scheduleCommands: [command(f, { commandId: 'another', id: 'another-id', expectedRevision: 2 })] });
  assert.equal(result(f).reason, 'business_rule'); assert.equal(f.saved().entries.length, 0);
});
test('Mehrdeutiger Bestand und zweite Firebase-ID für bereits gebundene native ID werden fachlich abgelehnt', () => {
  const duplicate = fixture(); seedEntries(duplicate, [native(duplicate), native(duplicate, {}, 2)]);
  duplicate.schedule(command(duplicate)); assert.equal(result(duplicate).reason, 'business_rule');
  assert.equal(duplicate.saved().revision, 0); assert.equal(duplicate.saved().relayBindings, undefined);
  const f = fixture(); f.schedule(command(f));
  f.tick({ scheduleCommands: [command(f, { commandId: 'second-id', id: 'another-id', expectedRevision: 1 })] });
  assert.equal(result(f).reason, 'business_rule'); assert.equal(f.saved().relayBindings.length, 1); assert.equal(f.saved().entries.length, 1);
});
test('Unbekannte Löschung ist dauerhaft idempotent und ihr Schlüssel wird nicht wieder angelegt', () => {
  const f = fixture(), row = command(f, { operation: 'delete', entry: null });
  f.schedule(row); assert.equal(f.saved().revision, 0); assert.equal(result(f).state, 'applied');
  f.reply({ scheduleCommands: [{ ...row, commandId: 'delete-again' }] });
  assert.equal(f.saved().relayBindings.length, 1); assert.equal(f.saved().revision, 0);
  f.tick({ scheduleCommands: [command(f, { commandId: 'revive' })] });
  assert.equal(result(f).reason, 'business_rule'); assert.deepEqual(f.saved().entries, []);
});
test('Lokal entferntes gebundenes Ziel wird niemals auf einen anderen Eintrag umgebogen', () => {
  const f = fixture(), row = command(f); f.schedule(row);
  f.runtime.changeSchedule(f.h.user(1, 'Otterchen'), 'mw:schedule.delete', { week: f.week(), id: 1, expectedRevision: 1 });
  const saved = f.saved(); saved.entries.push(native(f, {}, 2)); saved.nextId = 3; f.runtime.writeScheduleWeek(f.week(), saved);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'missing-target', expectedRevision: 3 }] });
  assert.equal(result(f).reason, 'business_rule'); assert.equal(f.saved().entries[0].id, 2);
  assert.equal(f.saved().relayBindings[0].nativeId, 1);
});
test('Wochenwechsel verwendet neue Firebase-ID; alte ID bleibt an ihre Woche gebunden', () => {
  const f = fixture(), row = command(f); f.schedule(row);
  const next = f.runtime.scheduleDay(f.week(), 7), moved = { ...row, week: next, expectedRevision: 0, entry: { ...row.entry, date: next } };
  f.tick({ scheduleCommands: [{ ...moved, commandId: 'wrong-move' }] });
  assert.equal(result(f).reason, 'business_rule'); assert.equal(f.saved(next).entries.length, 0);
  f.reply({ scheduleCommands: [{ ...row, commandId: 'old-delete', expectedRevision: 1, operation: 'delete', entry: null }] });
  f.tick({ scheduleCommands: [{ ...moved, id: 'new-week-id', commandId: 'new-week-save' }] });
  assert.equal(f.saved().entries.length, 0); assert.equal(f.saved(next).entries.length, 1);
});
test('Zuordnungen und Löschmarker überleben die Kürzung des 64er-Quittungscaches', () => {
  const f = fixture(), row = command(f); f.schedule(row);
  f.tick({ scheduleCommands: [{ ...row, commandId: 'deleted', expectedRevision: 1, operation: 'delete', entry: null }] });
  for (let i = 0; i < 70; i++) f.tick({ scheduleCommands: [command(f, { commandId: 'empty-' + i, id: 'empty-id-' + i, expectedRevision: 2, operation: 'delete', entry: null })] });
  assert.equal(f.saved().relayResults.length, 64); assert.equal(f.saved().relayBindings.length, 71);
  f.h.app.onShutdown(); const reboot = fixture({ store: f.store, now: f.h.now() });
  reboot.schedule(command(reboot, { commandId: 'late-old-save', expectedRevision: 2 }));
  assert.equal(result(reboot).reason, 'business_rule'); assert.equal(reboot.saved().entries.length, 0);
});
test('Automatische und aktive Studioeinträge werden weder übernommen noch überschrieben', () => {
  for (const flags of [{ automatic: true }, { broadcastKey: 'active', actualStart: 1 }]) {
    const f = fixture(); seedEntries(f, [native(f, flags)]); f.schedule(command(f));
    assert.equal(result(f).reason, 'business_rule'); assert.equal(f.saved().relayBindings, undefined);
    assert.deepEqual(f.saved().entries[0], native(f, flags));
  }
});
test('Fehlende oder ungültige Revision ist validation; nur eine echte Abweichung ist revision_conflict', () => {
  for (const value of [undefined, null, '0', -1, 0.5, 2]) {
    const f = fixture(); f.schedule(command(f, { expectedRevision: value })); const r = result(f);
    assert.equal(r.reason, value === 2 ? 'revision_conflict' : 'validation'); assert.equal(r.revision, 0);
  }
  const f = fixture(); f.schedule(command(f, { week: 'ungültig' }));
  assert.equal(result(f).revision, null);
});
test('Feldschema, Vollstunden, native Nick-/Themenregeln und Sommerzeit werden geprüft', () => {
  const mutations = [r => ({ ...r, id: 1 }), r => ({ ...r, id: 'bad/id' }), r => ({ ...r, authorization: {} }),
    r => ({ ...r, entry: { ...r.entry, start: '18:30' } }), r => ({ ...r, entry: { ...r.entry, nick: 'Unbekannt' } }),
    r => ({ ...r, entry: { ...r.entry, topic: '' } }), r => ({ ...r, entry: { ...r.entry, extra: 'hidden' } }),
    r => ({ ...r, week: '2027-03-22', entry: { ...r.entry, date: '2027-03-28', start: '02:00', end: '03:00' } }),
    r => ({ ...r, operation: 'delete' })];
  for (const mutate of mutations) {
    const f = fixture(); f.schedule(mutate(command(f))); assert.equal(result(f).reason, 'validation');
    assert.equal(f.saved().entries.length, 0);
  }
});
test('Native Überschneidungsregeln bleiben Fachablehnung, offene und ganztägige Zeiten werden nativ normalisiert', () => {
  const f = fixture(); f.schedule(command(f));
  f.tick({ scheduleCommands: [command(f, { commandId: 'overlap', id: 'overlap-id', expectedRevision: 1, entry: { ...command(f).entry, end: '20:00' } })] });
  assert.equal(result(f).reason, 'business_rule');
  for (const timing of ['openEnd', 'allDay']) {
    const t = fixture(), row = command(t); row.entry = { ...row.entry, timing, end: '', ...(timing === 'allDay' ? { start: '00:00' } : {}) };
    t.schedule(row); assert.equal(t.saved().entries[0].end, timing === 'allDay' ? '00:00' : '');
    assert.equal(result(t).state, 'applied');
  }
});
test('Erfüllte Teamzustände quittieren applied ohne Revisionssprung, Studiowechsel oder doppelte Nebenwirkung', () => {
  const f = fixture(); let removals = 0, broadcasts = 0;
  f.runtime.dropWebsiteUser = () => removals++; f.runtime.broadcast = () => broadcasts++;
  f.team(teamCommand());
  f.tick({ moderatorCommands: [teamCommand({ commandId: 'already-added', expectedRevision: 1 })] });
  assert.equal(result(f, 'moderator').state, 'applied'); assert.equal(f.runtime.state.radioModeratorRevision, 1);
  assert.equal(broadcasts, 1);
  f.reply({ moderatorCommands: [teamCommand({ commandId: 'remove', operation: 'remove', expectedRevision: 1 })] });
  f.tick({ moderatorCommands: [teamCommand({ commandId: 'already-removed', operation: 'remove', expectedRevision: 2 })] });
  assert.equal(result(f, 'moderator').state, 'applied'); assert.equal(f.runtime.state.radioModeratorRevision, 2); assert.equal(removals, 1);
  assert.equal(broadcasts, 2);
  f.reply({ moderatorCommands: [teamCommand({ commandId: 'unknown', operation: 'remove', expectedRevision: 2, nick: 'Unbekannt' })] });
  assert.equal(result(f, 'moderator').reason, 'validation');
});
test('Teamgrenze, unveränderte native Duplikatprüfung und exaktes Remoteschema bleiben erhalten', () => {
  const f = fixture(); f.runtime.state.radioModeratorUserIds = Array.from({ length: 50 }, (_, i) => i + 100);
  f.team(teamCommand()); assert.equal(result(f, 'moderator').reason, 'business_rule');
  const t = fixture(); t.team(teamCommand());
  assert.throws(() => t.runtime.manageRadioModerator(t.h.user(1, 'Otterchen'), 'mw:addRadioModerator', { nick: 'DJ Test' }), /bereits/);
  t.tick({ moderatorCommands: [teamCommand({ commandId: 'roles', expectedRevision: 1, role: 'admin' })] });
  assert.equal(result(t, 'moderator').reason, 'validation');
});
test('Unbekannte Revisionen werden einzeln ausgelassen; Status und Wünsche werden weiter übertragen', () => {
  const f = fixture(); f.reply(); const read = f.runtime.readScheduleWeek;
  f.runtime.readScheduleWeek = week => { if (week === f.week()) throw Error('storage'); return read(week); };
  f.runtime.state.radioModeratorRevision = NaN; f.h.advance(20000);
  assert.equal(f.body().moderatorRevision, undefined); assert.equal(f.body().scheduleRevisions.length, 2);
  assert.ok(f.body().scheduleRevisions.every(r => r.week !== f.week())); assert.ok(f.body().station); assert.deepEqual(f.body().wishUpdates, []);
});
test('Revisionen um Jahres- und Sommerzeitwechsel verwenden ausschließlich Berliner ISO-Wochen', () => {
  const f = fixture(); f.reply();
  for (const iso of ['2026-12-31T23:30:00Z', '2027-03-28T01:30:00Z', '2027-10-31T01:30:00Z']) {
    f.runtime.now = () => Date.parse(iso);
    const rows = plain(f.runtime.prepareRelayProjection().body.scheduleRevisions), current = f.week();
    assert.deepEqual(rows.map(r => r.week), [-7, 0, 7].map(days => f.runtime.scheduleDay(current, days)));
  }
});
test('Grenze des Wochenobjekts entfernt weder Zuordnungen noch Daten und quittiert keinen falschen Erfolg', () => {
  const f = fixture(); seedEntries(f, [native(f, { topic: 'x'.repeat(89000) })]);
  const before = f.saved(); f.schedule(command(f, { operation: 'delete', entry: null }));
  // Ein noch speicherbarer Marker ist erlaubt; danach erzwingt der vorhandene Byte-Guard einen technischen Fehler.
  const s = f.saved(); s.padding = 'x'.repeat(2000); f.store.setObject(prefix + f.week(), s);
  const snapshot = f.saved(); f.tick({ scheduleCommands: [command(f, { commandId: 'too-full', id: 'new-id', operation: 'delete', entry: null })] });
  assert.deepEqual(f.saved(), snapshot); assert.equal(f.saved().entries[0].topic, before.entries[0].topic);
  assert.ok(!(f.runtime.pendingRelayResults().scheduleResults || []).some(r => r.commandId === 'too-full'));
  assert.equal(f.runtime.androidLastFailure().stage, 'command_storage');
});
test('HTTP-, JSON-, URL-, Größen- und Vertragsfehler liefern ausschließlich private technische Diagnose', () => {
  for (const [stage, raw, status, target, failed] of [
    ['http_response', '{}', 503, url, false], ['http_response', 'secret-content', 400, url, true],
    ['response_json', '{secret-content', 200, url, false], ['response_url', '{}', 200, 'https://evil.invalid', false],
    ['response_size', 'x'.repeat(32769), 200, url, false], ['response_contract', '{}', 200, url, false]
  ]) {
    const f = fixture(); assert.equal(f.runtime.androidLastFailure(), null);
    f.calls.at(-1).p[failed ? 'onFailure' : 'onSuccess'](raw, { getResponseCode: () => status, getURLString: () => target });
    const failure = plain(f.runtime.androidPublisherStatus().lastFailure);
    assert.deepEqual(failure, { stage, httpStatus: status, atUtc: new Date(f.h.now()).toISOString() });
    assert.deepEqual(Object.keys(failure).sort(), ['atUtc', 'httpStatus', 'stage']);
    assert.doesNotMatch(JSON.stringify(failure), /secret-content|evil|wish|nick|commandId/);
    f.h.advance(20000); f.reply(); assert.deepEqual(plain(f.runtime.androidLastFailure()), failure, 'Letzter Fehler bleibt nach Erholung sichtbar');
  }
});
test('Timeout, Vorbereitung, Versand und Speicherfehler verwenden vorhandenen Takt und neutrale Stufen', () => {
  const timeout = fixture(); timeout.h.advance(20000); assert.equal(timeout.runtime.androidLastFailure().stage, 'timeout');
  const prepare = fixture(); prepare.reply(); prepare.runtime.pendingAndroidUpdates = () => { throw Error('secret'); };
  prepare.h.advance(20000); assert.equal(prepare.runtime.androidLastFailure().stage, 'prepare');
  const send = fixture(); send.reply(); send.runtime.stopAndroidPublisher();
  send.runtime.startAndroidPublisher({ syncUrl: url }, { sendJson() { throw Error('secret'); } });
  assert.equal(send.runtime.androidLastFailure().stage, 'send'); assert.equal(send.runtime.androidLastFailure().httpStatus, null);
  const storage = fixture(); storage.store.setObject = () => { throw Error('secret'); }; storage.schedule(command(storage));
  assert.equal(storage.runtime.androidLastFailure().stage, 'command_storage');
});
test('03:10: Regulärer POST enthält nur tatsächliche Revisionen und keine Kalender-/Teamlisten', () => {
  const f = fixture(), body = f.body();
  assert.equal(body.scheduleUpdates, undefined); assert.equal(body.teamUpdates, undefined);
  assert.deepEqual(body.scheduleRevisions, [-7, 0, 7].map(days => ({ week: f.runtime.scheduleDay(f.week(), days), revision: 0 })));
  assert.equal(body.moderatorRevision, 0);
});
test('03:10: Stabile Firebase-ID wird zusammen mit nativer Änderung dauerhaft gespeichert', () => {
  const f = fixture(); f.schedule(command(f));
  assert.equal(f.saved().entries.length, 1);
  assert.deepEqual(f.saved().relayBindings, [{ firebaseId: 'firebase-plan', nativeId: 1, deleted: false }]);
});
test('Planänderung erhält die Erfolgsquittung ohne ungenutzte Overlay-Änderungsnachricht', () => {
  const f = fixture(); f.reply(); const owner = f.h.user(1, 'Otterchen');
  const radio = owner.sessions.find(s => s.content.viewMode === 'Headerbar');
  const session = radio, row = command(f);
  const events = f.h.event(owner, session, 'mw:schedule.save', { ...row.entry, week: row.week, expectedRevision: 0, requestId: 'native-plan' });
  assert.deepEqual(events.map(e => e.type), ['mw:schedule.result']);
  assert.equal(events[0].data.ok, true); assert.equal(f.body().scheduleUpdates, undefined); assert.equal(f.body().scheduleRevisions.find(r => r.week === row.week).revision, 1);
});
test('Vorgeprüfter Relayauftrag ohne Rollenfelder speichert ohne anwesenden Inhaber; Wiederholung und Neustart wenden ihn nur einmal an', () => {
  const f = fixture(), row = command(f); f.h.user(1, 'Otterchen').online = false; f.schedule(row);
  assert.equal(f.saved().revision, 1); assert.equal(f.saved().entries.length, 1); assert.equal(f.calls.length, 1);
  f.h.advance(20000); assert.deepEqual(f.body().scheduleResults, [{ commandId: 'plan-1', state: 'applied', revision: 1 }]);
  f.schedule({ ...row, entry: { ...row.entry, topic: 'Darf nicht geändert werden' } }); assert.equal(f.saved().entries[0].topic, 'Sendung');
  f.h.app.onShutdown(); const reboot = fixture({ store: f.store, now: f.h.now() }); reboot.schedule(row);
  assert.equal(reboot.saved().revision, 1); assert.equal(reboot.saved().entries.length, 1);
  reboot.h.advance(20000); assert.equal(reboot.body().scheduleResults[0].state, 'applied');
});
test('Behauptete Firebase-Rollen in nativen Clientdaten verleihen keine Sendeplan- oder Teamrechte', () => {
  const f = fixture(), person = f.h.user(2, 'DJ Test'), radio = person.sessions.find(s => s.content.viewMode === 'Headerbar');
  const claims = { source: 'firebase', role: 'admin', verified: true, authorization: { source: 'firebase', role: 'admin', verified: true } };
  const session = radio, row = command(f);
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
  const f = fixture(), owner=f.h.user(1,'Otterchen','owner');
  f.h.event(owner,f.h.open(owner),'mw:onAir',{});
  const date=f.runtime.scheduleDay(f.runtime.scheduleToday(),7), week=f.runtime.scheduleWeek(date);
  f.reply({ scheduleCommands:[command(f,{week,entry:{...command(f).entry,date}})], moderatorCommands:[teamCommand()],
    wishes:[{submissionId:'existing-wish',text:'Band – Titel',displayName:null}] });
  assert.equal(f.saved(week).entries.length,1);assert.equal(f.runtime.state.radioModeratorRevision,1);assert.equal(f.runtime.wishItems().length,1);
  assert.equal(f.calls.length,1);f.h.advance(20000);assert.equal(f.body().wishUpdates[0].state,'queued');
  assert.equal(f.body().scheduleResults[0].state,'applied');assert.equal(f.body().moderatorResults[0].state,'applied');
});

test('Leere Auftragsarrays erhalten die bisherige Nachlieferung großer Wunschquittungsmengen', () => {
  const f = fixture(); f.reply(); const at = f.h.now() - 120000;
  f.store.setObject('mischwerk.android.receipts.v1', { version: 1, entries: Array.from({ length: 205 }, (_, i) => ({
    submissionId: 'old-' + i, state: 'done', position: null, createdAt: at, at, committed: true, dirty: true, revision: 1 })) });
  f.h.app.onShutdown(); const reboot = fixture({ store: f.store, now: f.h.now() });
  for (let i = 0; i < 3; i++) reboot.reply({ scheduleCommands: [], moderatorCommands: [] });
  assert.deepEqual(reboot.calls.map(call => JSON.parse(call.p.data.payload).wishUpdates.length), [100, 100, 5]);
});
test('Teamwiederholung nach Neustart verändert weder Revision noch die ursprüngliche Quittung', () => {
  const f = fixture(), row = teamCommand(); f.team(row); f.h.app.onShutdown(); const reboot = fixture({ store: f.store, now: f.h.now() }); reboot.team(row);
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
    f.h.event(person, radio, 'mw:onAir', {}); assert.equal(f.runtime.state.moderator.userId, person.id);
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
  const f = fixture(), writes = [], write = f.store.setObject;
  f.store.setObject = (key, value) => { if (key === prefix + f.week()) writes.push(plain(value)); write(key, value); };
  f.runtime.broadcast = () => { throw Error('notification'); };
  f.schedule(command(f)); const saved = f.store.data[prefix + f.week()];
  assert.equal(writes.length, 1); assert.equal(writes[0].relayBindings[0].nativeId, writes[0].entries[0].id);
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
  assert.equal(f.body().scheduleResults.length, 10); assert.equal(f.body().scheduleResults[0].commandId, 'plan-1');
  f.reply(); f.h.advance(20000); assert.ok(f.body().scheduleResults.length);
  assert.ok(f.body().scheduleResults.every(row => row.commandId !== 'plan-1'));
});

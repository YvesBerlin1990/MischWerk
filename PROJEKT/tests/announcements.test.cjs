const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../tools/knuddels-mock.cjs');
const onAir = nick => '🎙️ ' + nick + ' betritt das Studio – ab jetzt live ON AIR bei Radio MischWerk!';
const offAir = nick => '🎙️ ' + nick + ' verlässt das Studio – danke fürs Zuhören und bis zum nächsten Mal bei Radio MischWerk!';
const result = events => events.findLast(event => event.type === 'mw:result')?.data;
function fixture() {
  const h = createHarness();
  const owner = h.user(2, 'Otterchen', 'owner'), listener = h.user(1, 'Musikfreund');
  return { h, owner, listener, os: h.open(owner), ls: h.open(listener) };
}
function appoint(h, owner, session, person) {
  assert.equal(result(h.event(owner, session, 'mw:addRadioModerator', { nick: person.nick })).ok, true);
}

test('Nick-Bot meldet bestätigte An-/Abmeldung einmalig mit echtem Nick; Verlängern und Ansichten bleiben still', () => {
  const { h, owner, listener, os, ls } = fixture();
  assert.deepEqual(h.bot.messages, []);
  assert.equal(result(h.event(owner, os, 'mw:onAir', { nick: 'Gefälschter Nick' })).ok, true);
  assert.deepEqual(h.bot.messages, [onAir('Otterchen')]);
  const key = h.state(owner, os).moderator.sessionKey;
  assert.equal(result(h.event(owner, os, 'mw:onAir', { expectedModerator: key })).ok, true);
  h.event(owner, os, 'mw:openStudio');
  h.event(listener, ls, 'mw:openSchedule');
  h.state(listener, ls); h.state(owner, os); h.app.onAppStart();
  assert.deepEqual(h.bot.messages, [onAir('Otterchen')]);
  assert.equal(result(h.event(owner, os, 'mw:offAir')).ok, true);
  h.state(listener, ls); h.state(owner, os);
  assert.deepEqual(h.bot.messages, [onAir('Otterchen'), offAir('Otterchen')]);
});

test('Abgewiesene Rollen, veraltete Aktionen und fehlgeschlagene Speicherung erzeugen keine Botmeldung', () => {
  const { h, owner, listener, os, ls } = fixture();
  const save = h.store.setObject;
  assert.equal(result(h.event(listener, ls, 'mw:onAir', { canModerate: true })).ok, false);
  h.store.setObject = () => { throw new Error('private-storage-detail'); };
  assert.equal(result(h.event(owner, os, 'mw:onAir')).ok, false);
  assert.deepEqual(h.bot.messages, []);
  h.store.setObject = save;
  h.event(owner, os, 'mw:onAir');
  assert.equal(result(h.event(owner, os, 'mw:offAir', { expectedModerator: 'veraltet' })).ok, false);
  h.store.setObject = () => { throw new Error('private-storage-detail'); };
  assert.equal(result(h.event(owner, os, 'mw:offAir')).ok, false);
  assert.equal(h.state(owner, os).moderator.nick, 'Otterchen');
  assert.deepEqual(h.bot.messages, [onAir('Otterchen')]);
});

test('Bestätigte Übergabe meldet beide Moderatoren gemeinsam; Besitzerabmeldung nennt die aktive Moderation', () => {
  const { h, owner, os } = fixture();
  const dj = h.user(3, 'Radio-DJ'), ds = h.open(dj);
  appoint(h, owner, os, dj);
  h.event(owner, os, 'mw:onAir');
  h.event(owner, os, 'mw:handover.request', { expectedModerator: h.state(owner, os).moderator.sessionKey, nick: dj.nick });
  h.event(dj, ds, 'mw:handover.accept', { id: h.state(dj, ds).handover.incoming.id, topic: '' });
  const transfer = '🎙️ Otterchen macht Platz im Studio – Radio-DJ ist jetzt live ON AIR bei Radio MischWerk!';
  assert.deepEqual(h.bot.messages, [onAir('Otterchen'), transfer]);
  assert.equal(result(h.event(owner, os, 'mw:offAir')).ok, true);
  assert.deepEqual(h.bot.messages, [onAir('Otterchen'), transfer, offAir('Radio-DJ')]);
});

for (const cause of ['Channel verlassen', 'Ablauf', 'Ernennung entzogen', 'Nutzer gelöscht', 'Besitzerrechte verloren']) {
  test('Automatisches Moderationsende meldet sich genau einmal: ' + cause, () => {
    const { h, owner, listener, os, ls } = fixture();
    const dj = h.user(3, 'Radio-DJ'), ds = h.open(dj);
    appoint(h, owner, os, dj);
    const presenter = cause === 'Besitzerrechte verloren' ? owner : dj;
    h.event(presenter, presenter === owner ? os : ds, 'mw:onAir');
    h.event(owner, os, 'mw:setTopic', { topic: 'Thema bleibt bei automatischem Ende' });
    if (cause === 'Channel verlassen') { presenter.online = false; h.app.onUserLeft(presenter); }
    if (cause === 'Ablauf') { h.advance(6 * 3600000 + 1); }
    if (cause === 'Ernennung entzogen') { h.event(owner, os, 'mw:removeRadioModerator', { userId: dj.id }); }
    if (cause === 'Nutzer gelöscht') { h.app.onUserDeleted(dj.id); }
    if (cause === 'Besitzerrechte verloren') { owner.role = 'listener'; }
    const state = h.state(listener, ls);
    h.state(listener, ls);
    assert.equal(state.moderator, null);
    assert.equal(state.topic, 'Thema bleibt bei automatischem Ende');
    assert.deepEqual(h.bot.messages, [onAir(presenter.nick), offAir(presenter.nick)]);
  });
}

test('Verlassen mit Speicherfehler beendet die öffentliche Moderation ohne Wiederholung bei Wiederbeitritt', () => {
  const { h, owner, listener, os, ls } = fixture();
  h.event(owner, os, 'mw:onAir');
  h.store.setObject = () => { throw new Error('storage-failed'); };
  owner.online = false; h.app.onUserLeft(owner);
  h.state(listener, ls); h.state(listener, ls);
  owner.online = true; h.app.onUserJoined(owner);
  assert.equal(h.state(listener, ls).moderator, null);
  assert.deepEqual(h.bot.messages, [onAir('Otterchen'), offAir('Otterchen')]);
});

test('Botfehler nehmen die Studioaktion nicht zurück und werden nicht bei jedem Refresh erneut versucht', () => {
  const { h, owner, listener, os, ls } = fixture();
  let attempts = 0;
  h.bot.sendPublicMessage = () => { attempts++; throw new Error('private-bot-detail'); };
  assert.equal(result(h.event(owner, os, 'mw:onAir')).ok, true);
  h.state(listener, ls); h.state(owner, os);
  assert.equal(attempts, 1);
  assert.equal(h.state(owner, os).user.isOnAir, true);
  assert.equal(result(h.event(owner, os, 'mw:offAir')).ok, true);
  h.state(listener, ls); assert.equal(attempts, 2);
  assert.equal(h.state(owner, os).moderator, null);
  assert.ok(h.logs.some(entry => entry.message.includes('STUDIO_ANNOUNCE')));
  assert.ok(h.logs.every(entry => !entry.message.includes('private-bot-detail')));
});

test('App-Neustart übernimmt gültige Moderation still und verwirft abgelaufene ohne Start-/Endmeldung', () => {
  const { h, owner, os } = fixture();
  h.event(owner, os, 'mw:onAir');
  const restarted = createHarness(h.store, { users: [{ id: 2, nick: 'Otterchen', role: 'owner' }] });
  const current = restarted.user(2), session = current.sessions[0];
  restarted.app.onAppStart(); restarted.state(current, session);
  assert.deepEqual(restarted.bot.messages, []);
  assert.equal(result(restarted.event(current, session, 'mw:offAir')).ok, true);
  assert.deepEqual(restarted.bot.messages, [offAir('Otterchen')]);
  h.event(owner, os, 'mw:onAir');
  h.store.data['mischwerk.state.v1'].moderator.expiresAt = 0;
  const expired = createHarness(h.store, { users: [{ id: 2, nick: 'Otterchen', role: 'owner' }] });
  assert.deepEqual(expired.bot.messages, []);
  assert.equal(expired.state(expired.user(2), expired.user(2).sessions[0]).moderator, null);
});

test('Moderatornick wird über die dokumentierte KCode-Escapemethode als Text eingesetzt', () => {
  const { h, owner, os } = fixture();
  owner.nick = '_DJ°>/befehl|Text<°';
  h.event(owner, os, 'mw:onAir');
  assert.deepEqual(h.escapedNicks, [owner.nick]);
  const escaped = owner.nick.replace(/[_°<>\\]/g, character => '\\' + character);
  assert.deepEqual(h.bot.messages, [onAir(escaped)]);
  assert.ok(h.bot.messages[0].length < 10000);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
const result = events => events.findLast(event => event.type === 'mw:result')?.data;
function fixture() {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), os = h.open(owner);
  const dj = h.user(2, 'Nächster DJ'), ds = h.open(dj), other = h.user(3, 'Anderer DJ'), ss = h.open(other);
  for (const user of [dj, other]) { h.event(owner, os, 'mw:addRadioModerator', { nick: user.nick }); }
  h.event(owner, os, 'mw:onAir'); h.event(owner, os, 'mw:setTopic', { topic: 'Alte Sendung' });
  function request() {
    const key = h.state(owner, os).moderator.sessionKey;
    assert.equal(result(h.event(owner, os, 'mw:handover.request', { nick: dj.nick, expectedModerator: key })).ok, true);
    return h.state(dj, ds).handover.incoming.id;
  }
  return { h, owner, os, dj, ds, other, ss, request };
}

test('Übergabe wechselt erst bei Annahme Moderator und Thema gemeinsam; Queue und Wunschbox bleiben erhalten', () => {
  const { h, owner, os, dj, ds, other, ss, request } = fixture();
  h.event(other, ss, 'mw:wish.submit', { text: 'Aha – Take on me' });
  h.event(owner, os, 'mw:setRequests', { enabled: false });
  const before = h.state(owner, os), id = request();
  assert.equal(h.state(owner, os).moderator.nick, owner.nick);
  assert.equal(h.state(dj, ds).handover.incoming.nick, owner.nick);
  assert.equal(h.state(owner, os).handover.outgoing.nick, dj.nick);
  assert.equal(h.state(other, ss).handover.incoming, null);
  assert.equal(h.state(other, ss).handover.outgoing, null);
  assert.equal(dj.messages.length, 1);
  assert.equal(h.bot.messages.length, 1, 'Anfrage noch nicht öffentlich');
  const writes = h.store.setObject, changes = [];
  h.store.setObject = (key, value) => { changes.push(JSON.parse(JSON.stringify(value))); writes(key, value); };
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id, topic: 'Neue Sendung' })).ok, true);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].moderator.nick, dj.nick); assert.equal(changes[0].topic, 'Neue Sendung');
  const after = h.state(dj, ds);
  assert.equal(after.user.isOnAir, true); assert.equal(after.topic, 'Neue Sendung');
  assert.equal(after.requestsEnabled, false); assert.equal(after.queueTotal, 1);
  assert.notEqual(after.moderator.sessionKey, before.moderator.sessionKey);
  assert.equal(after.moderator.expiresAt - after.serverTime, 6 * 3600000);
  assert.equal(after.handover.incoming, null);
  assert.equal(h.bot.messages[1], '🎙️ Otterchen macht Platz im Studio – Nächster DJ ist jetzt live ON AIR bei Radio MischWerk!');
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id })).ok, false);
  assert.equal(h.bot.messages.length, 2);
  owner.online = false; h.app.onUserLeft(owner);
  assert.equal(h.state(dj, ds).user.isOnAir, true, 'Bisheriger Moderator kann nach der Übergabe den Channel verlassen');
  assert.equal(h.bot.messages.length, 2, 'Keine Abmeldung des neuen Moderators durch Verlassen des alten');
});

test('Nur aktive Moderation fragt an; Ziel muss anwesend, ernannt und verschieden sein; nur Ziel nimmt an', () => {
  const { h, owner, os, dj, ds, other, ss, request } = fixture();
  const cm = h.user(4, 'Channel-CM', 'moderator'), cs = h.open(cm), manager = h.user(5, 'Manager', 'manager');
  const key = h.state(owner, os).moderator.sessionKey;
  for (const nick of [owner.nick, cm.nick, manager.nick, 'Unbekannt']) {
    assert.equal(result(h.event(owner, os, 'mw:handover.request', { nick, expectedModerator: key })).ok, false);
  }
  assert.equal(result(h.event(owner, os, 'mw:handover.request', { nick: dj.nick })).ok, false);
  assert.equal(result(h.event(dj, ds, 'mw:handover.request', { nick: other.nick, expectedModerator: key })).ok, false);
  dj.online = false;
  assert.equal(result(h.event(owner, os, 'mw:handover.request', { nick: dj.nick, expectedModerator: key })).ok, false);
  dj.online = true;
  const id = request();
  for (const [user, session] of [[owner, os], [other, ss], [cm, cs]]) {
    assert.equal(result(h.event(user, session, 'mw:handover.accept', { id, nick: dj.nick, userId: dj.id })).ok, false);
  }
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id: 'veraltet' })).ok, false);
  assert.equal(result(h.event(dj, os, 'mw:handover.accept', { id })), undefined);
  assert.equal(h.state(owner, os).moderator.nick, owner.nick);
});

test('Direkte Übernahme einer besetzten Moderation bleibt auch mit manipulierten Clientdaten gesperrt', () => {
  const { h, owner, os, dj, ds } = fixture();
  for (const data of [{}, { expectedModerator: h.state(owner, os).moderator.sessionKey, handover: true }]) {
    assert.equal(result(h.event(dj, ds, 'mw:onAir', data)).ok, false);
  }
  assert.equal(h.bot.messages.length, 1);
});

test('Otterchen als Inhaber empfängt Übergaben ohne Eintrag und behält offene Anfragen beim Entfernen eines optionalen Eintrags',()=>{
  const {h,owner,os,dj,ds}=fixture();h.event(owner,os,'mw:offAir');h.event(dj,ds,'mw:onAir');
  const send=()=>h.event(dj,ds,'mw:handover.request',{nick:owner.nick,expectedModerator:h.state(dj,ds).moderator.sessionKey});
  assert.equal(h.state(dj,ds).handover.candidates.includes(owner.nick),true);
  assert.equal(result(send()).ok,true);const first=h.state(owner,os).handover.incoming.id;
  h.event(owner,os,'mw:addRadioModerator',{nick:owner.nick});assert.equal(h.state(dj,ds).handover.outgoing.id,first);
  assert.equal(result(send()).ok,true);
  h.event(owner,os,'mw:removeRadioModerator',{userId:owner.id});
  assert.equal(h.state(owner,os).handover.incoming.id,first);
  assert.equal(result(h.event(owner,os,'mw:handover.accept',{id:first,topic:'Inhabersendung'})).ok,true);
  assert.equal(h.state(owner,os).user.isOnAir,true);
});

test('Privater Annahmebeleg bestätigt die genaue Anfrage auch ohne Notizen und endet mit der übernommenen Sendung',()=>{
 const {h,owner,os,dj,ds,other,ss,request}=fixture(),id=request();
 assert.equal(h.state(dj,ds).handover.acceptedId,null);
 const write=h.store.setObject;h.store.setObject=()=>{throw Error('storage-failed');};
 assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id})).ok,false);assert.equal(h.state(dj,ds).handover.acceptedId,null);
 h.store.setObject=write;assert.equal(result(h.event(dj,ds,'mw:handover.accept',{id})).ok,true);
 assert.equal(h.state(dj,ds).handover.acceptedId,id);assert.equal(h.state(dj,ds).handover.receivedNotes,null);
 for(const [user,session] of [[owner,os],[other,ss]])assert.equal(h.state(user,session).handover.acceptedId,null);
 h.event(owner,os,'mw:setTopic',{topic:'Spätere Themenänderung'});h.event(dj,ds,'mw:onAir');assert.equal(h.state(dj,ds).handover.acceptedId,id);
 h.event(dj,ds,'mw:offAir');assert.equal(h.state(dj,ds).handover.acceptedId,null);
 h.event(dj,ds,'mw:onAir');assert.equal(h.state(dj,ds).handover.acceptedId,null);
});

test('Ablehnen, Abbrechen und doppelte Anfrage lassen die bisherige Sendung unverändert', () => {
  const { h, owner, os, dj, ds, other, ss, request } = fixture();
  let id = request();
  assert.equal(request(), id); assert.equal(dj.messages.length, 1, 'Kein doppelter privater Hinweis');
  assert.equal(result(h.event(other, ss, 'mw:handover.cancel', { id })).ok, false);
  assert.equal(result(h.event(owner, os, 'mw:handover.decline', { id })).ok, false);
  h.event(dj, ds, 'mw:handover.decline', { id });
  assert.equal(h.state(owner, os).topic, 'Alte Sendung');
  const previous = id; id = request(); assert.notEqual(id, previous);
  h.event(owner, os, 'mw:handover.cancel', { id });
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id })).ok, false);
  assert.equal(h.state(owner, os).moderator.nick, owner.nick); assert.equal(h.bot.messages.length, 1);
});

test('Speicher- und Validierungsfehler bei Annahme erhalten Anfrage, bisherige Moderation und Thema', () => {
  const { h, owner, os, dj, ds, request } = fixture(); const id = request();
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id, topic: 'x'.repeat(81) })).ok, false);
  const save = h.store.setObject; h.store.setObject = () => { throw new Error('private-storage-detail'); };
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id, topic: 'Entwurf' })).ok, false);
  assert.equal(h.state(owner, os).moderator.nick, owner.nick); assert.equal(h.state(owner, os).topic, 'Alte Sendung');
  assert.equal(h.state(dj, ds).handover.incoming.id, id); assert.equal(h.bot.messages.length, 1);
  h.store.setObject = save;
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id, topic: '' })).ok, true);
  assert.equal(h.state(dj, ds).topic, '');
});

for (const cause of ['Absender verlässt Channel', 'Ziel verlässt Channel', 'Ziel verliert Ernennung', 'Ziel gelöscht', 'Ablauf', 'Abmeldung', 'Verlängerung', 'Shutdown']) {
  test('Offene Übergabe verfällt endgültig bei: ' + cause, () => {
    const { h, owner, os, dj, ds, request } = fixture(); const id = request();
    if (cause.includes('verlässt')) { const user = cause.startsWith('Absender') ? owner : dj; user.online = false; h.app.onUserLeft(user); user.online = true; h.app.onUserJoined(user); }
    if (cause === 'Ziel verliert Ernennung') { h.event(owner, os, 'mw:removeRadioModerator', { userId: dj.id }); }
    if (cause === 'Ziel gelöscht') { h.app.onUserDeleted(dj.id); }
    if (cause === 'Ablauf') { h.advance(6 * 3600000 + 1); }
    if (cause === 'Abmeldung') { h.event(owner, os, 'mw:offAir'); }
    if (cause === 'Verlängerung') { h.event(owner, os, 'mw:onAir'); }
    if (cause === 'Shutdown') { h.app.onPrepareShutdown(); }
    const currentSession = dj.sessions[0] || ds;
    assert.equal(h.state(dj, currentSession).handover.incoming, null);
    assert.equal(result(h.event(dj, currentSession, 'mw:handover.accept', { id, topic: 'Alt' })).ok, false);
  });
}

test('Anfrage bleibt flüchtig, Privatmeldung ist fehlertolerant und normale Hörer sehen keine Beteiligten', () => {
  const { h, owner, os, dj, ds, request } = fixture();
  dj.sendPrivateMessage = () => { throw new Error('private-notice-detail'); };
  const id = request(), listener = h.user(8, 'Hörer'), ls = h.open(listener);
  const hand = h.state(listener, ls).handover;
  assert.equal(hand.incoming, null); assert.equal(hand.outgoing, null); assert.equal(hand.candidates.length, 0);
  assert.ok(!JSON.stringify(h.store.data).includes(id));
  const restarted = createHarness(h.store, { users: [{ id: 1, nick: owner.nick, role: 'owner' }, { id: 2, nick: dj.nick }] });
  assert.equal(restarted.state(restarted.user(1), restarted.user(1).sessions[0]).handover.outgoing, null);
  assert.equal(restarted.state(restarted.user(2), restarted.user(2).sessions[0]).handover.incoming, null);
  assert.deepEqual(restarted.bot.messages, []);
  assert.ok(h.logs.some(log => log.message.includes('HANDOVER_NOTICE')));
  assert.equal(result(h.event(dj, ds, 'mw:handover.accept', { id, topic: 'Neue Sendung' })).ok, true);
  for (let index = 0; index < 48; index++) {
    const person = h.user(index + 100, ('DJ-' + index).padEnd(50, 'x'));
    assert.equal(result(h.event(owner, os, 'mw:addRadioModerator', { nick: person.nick })).ok, true);
  }
  const largest = h.state(dj, ds);
  assert.equal(largest.handover.candidates.length, 50);
  assert.ok(JSON.stringify(largest).length < 9500, 'Vollständige Kandidatenliste bleibt unter dem Eventlimit');
});

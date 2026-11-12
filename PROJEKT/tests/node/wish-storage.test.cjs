// Dauerhafte Wünsche: echte App-Neuerzeugung, Schreibabbrüche und private Projektionen.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
const key = 'mischwerk.wishes.v3';
function setup(store) {
  const h = createHarness(store, { appDir: process.env.MISCHWERK_WISH_BASELINE, users:[{id:1,nick:'Otterchen',role:'owner'}] });
  const owner = h.user(1, 'Otterchen', 'owner'), listener = h.user(2, 'Hörer'), other = h.user(3, 'Andere');
  h.state(listener,h.open(listener));
  const os=h.open(owner);h.event(owner,os,'mw:onAir',{});
  return { h, owner, listener, other, os, ls: h.open(listener), xs: h.open(other) };
}
function submit(f, text, submissionId) {
  return f.h.event(f.listener, f.ls, 'mw:wish.submit', { text, submissionId }).find(e => e.type === 'mw:wish.receipt').data;
}
function state(f) { return f.h.state(f.owner, f.os); }
function saved(store) {
  const head = store.data[key];
  return JSON.parse(Array.from({ length: head.pages }, (_, i) => store.data[key + '.' + head.bank + '.' + i].text).join(''));
}
test('Bestätigte offene Wünsche überstehen Update und beide Shutdown-Hooks mit Reihenfolge, Empfang und Regiestatus', () => {
  const f = setup();
  submit(f, 'Erster Wunsch', 'first'); submit(f, 'Zweiter Wunsch', 'second');
  f.h.event(f.owner, f.os, 'mw:openStudio');
  const studio = f.owner.sessions.find(s => s.activeView === 'studio');
  f.h.event(f.owner, studio, 'mw:ackRequest', { id: 1 });
  f.h.event(f.owner, studio, 'mw:setWishStage', { id: 1, previousStage: 'queued', stage: 'preparing' });
  const before = f.h.state(f.owner, studio), own = f.h.state(f.listener, f.ls).wishPositions;
  f.h.app.chatCommands.update(f.owner, ''); f.h.app.onPrepareShutdown(); f.h.app.onShutdown();
  const reboot = setup(f.h.store), after = state(reboot);
  assert.equal(after.queueTotal, 2);
  assert.deepEqual(after.queueWindow.map(row => [row.id, row.text, row.delivery, row.stage]),
    before.queueWindow.map(row => [row.id, row.text, row.delivery, row.stage]));
  assert.equal(reboot.h.state(reboot.listener, reboot.ls).wishPositions.nextItem.position, 1);
  assert.notEqual(reboot.h.state(reboot.listener, reboot.ls).wishPositions.generation, own.generation);
  assert.equal(submit(reboot, 'Erster Wunsch', 'first').accepted, true);
  assert.equal(state(reboot).queueTotal, 2, 'Verlorene Quittung erzeugt nach Neustart keinen Doppelwunsch');
  const publicState = reboot.h.state(reboot.other, reboot.xs);
  assert.equal(publicState.queueTotal, 0); assert.equal(publicState.wishPositions.total, 0);
  assert.doesNotMatch(JSON.stringify(publicState), /Erster Wunsch|Zweiter Wunsch|senderKey/);
});
for (const failure of ['page', 'head']) test('Schreibabbruch bei ' + failure + ' erhält den letzten Commit und dieselbe Wiederholungskennung', () => {
  const f = setup(); submit(f, 'Gespeichert', 'saved');
  const before = JSON.stringify(f.h.store.data), write = f.h.store.setObject;
  f.h.store.setObject = (name, value) => {
    if (failure === 'head' ? name === key : name.startsWith(key + '.')) throw Error('private-disk-detail');
    write(name, value);
  };
  const receipt = submit(f, 'Noch nicht gespeichert', 'retry');
  assert.equal(receipt.accepted, false); assert.equal(state(f).queueTotal, 1);
  assert.equal(JSON.stringify(f.h.store.data), before);
  assert.doesNotMatch(JSON.stringify(receipt) + JSON.stringify(f.h.logs), /private-disk-detail|Noch nicht gespeichert/);
  f.h.store.setObject = write;
  const reboot = setup(f.h.store);
  assert.equal(state(reboot).queue[0].text, 'Gespeichert');
  assert.equal(submit(reboot, 'Noch nicht gespeichert', 'retry').accepted, true);
  assert.equal(submit(reboot, 'Noch nicht gespeichert', 'retry').accepted, true);
  assert.equal(state(reboot).queueTotal, 2);
});
test('Viele Unicodewünsche überschreiten 100 kB insgesamt und bleiben pro Schlüssel unter der API-Grenze', () => {
  const f = setup();
  for (let i = 0; i < 260; i++) assert.equal(submit(f, String(i) + '🎶'.repeat(145), 'large-' + i).accepted, true);
  assert.ok(Buffer.byteLength(JSON.stringify(saved(f.h.store))) > 100000);
  assert.ok(f.h.store.data[key].pages > 1);
  for (const [name, value] of Object.entries(f.h.store.data)) if (name.startsWith(key)) {
    assert.ok(Buffer.byteLength(JSON.stringify(value)) < 90000);
  }
  const reboot = setup(f.h.store);
  assert.equal(state(reboot).queueTotal, 260);
  assert.equal(reboot.h.state(reboot.listener, reboot.ls, 0, 259).wishPositions.items[0].text, '259' + '🎶'.repeat(145));
});
test('Abschluss, Verwerfen und Nutzerlöschung bleiben nach Neustart endgültig; kein Wunscharchiv', () => {
  const f = setup();
  for (let i = 0; i < 4; i++) submit(f, 'Privater Wunsch ' + i, 'terminal-' + i);
  f.h.event(f.other, f.xs, 'mw:wish.submit', { text: 'Bleibt offen', submissionId: 'other' });
  f.h.event(f.owner, f.os, 'mw:resolveRequest', { id: 1, outcome: 'done' });
  f.h.event(f.owner, f.os, 'mw:resolveRequest', { id: 2, outcome: 'discarded' });
  let reboot = setup(f.h.store);
  submit(reboot, 'Privater Wunsch 0', 'terminal-0');
  assert.equal(state(reboot).queueTotal, 3);
  reboot.h.app.onUserDeleted(reboot.listener.id);
  assert.doesNotMatch(JSON.stringify(reboot.h.store.data), /Privater Wunsch|terminal-/);
  reboot = setup(reboot.h.store);
  assert.equal(state(reboot).queueTotal, 1); assert.equal(state(reboot).queue[0].text, 'Bleibt offen');
});
test('Speicherfehler bei Status, Empfang oder Abschluss ändern weder RAM noch dauerhaften Wunsch', () => {
  const f = setup(); submit(f, 'Unverändert', 'unchanged');
  f.h.event(f.owner, f.os, 'mw:openStudio'); const studio = f.owner.sessions.find(s => s.activeView === 'studio');
  const before = JSON.stringify(saved(f.h.store)), write = f.h.store.setObject;
  f.h.store.setObject = () => { throw Error('offline'); };
  for (const [type, data] of [['mw:ackRequest', { id: 1 }], ['mw:setWishStage', { id: 1, previousStage: 'queued', stage: 'preparing' }],
    ['mw:resolveRequest', { id: 1, outcome: 'done' }]]) {
    assert.equal(f.h.event(f.owner, studio, type, data).find(e => e.type === 'mw:result').data.ok, false);
    assert.equal(JSON.stringify(saved(f.h.store)), before);
    const row = state(f).queue[0]; assert.equal(row.delivery, null); assert.equal(row.stage, 'queued');
  }
  f.h.store.setObject = write;
  assert.equal(state(setup(f.h.store)).queueTotal, 1);
});
test('Unvollständiger Speicher wird niemals als leere Queue überschrieben; verwaiste Seiten werden nicht wiederbelebt', () => {
  const f = setup(); submit(f, 'Gespeichert', 'safe');
  const head = f.h.store.data[key], page = key + '.' + head.bank + '.0';
  const original = f.h.store.data[page]; delete f.h.store.data[page];
  const before = JSON.stringify(f.h.store.data);
  assert.throws(() => setup(f.h.store), /WISH_STORAGE_FORMAT/);
  assert.equal(JSON.stringify(f.h.store.data), before);
  f.h.store.data[page] = original;
  const orphan = key + '.' + (1 - head.bank) + '.999';
  f.h.store.data[orphan] = { version: 1, text: 'Kein bestätigter Wunsch' };
  assert.equal(state(setup(f.h.store)).queueTotal, 1); assert.equal(f.h.store.data[orphan], undefined);
});

test('Nutzerlöschung entfernt auch den gespeicherten Empfangsnick des Moderators aus fremden offenen Wünschen', () => {
  const f = setup(); submit(f, 'Bleibt offen', 'private-reader');
  f.h.event(f.owner, f.os, 'mw:openStudio'); const studio = f.owner.sessions.find(s => s.activeView === 'studio');
  f.h.event(f.owner, studio, 'mw:ackRequest', { id: 1 });
  assert.equal(saved(f.h.store).items[0].delivery.senderKey, String(f.owner.id));
  assert.equal('senderKey' in state(f).queue[0].delivery, false);
  f.h.app.onUserDeleted(f.owner.id);
  const delivery = saved(f.h.store).items[0].delivery;
  assert.equal(delivery.nick, 'Radio-Team'); assert.equal('senderKey' in delivery, false);
  const reboot = setup(f.h.store);
  assert.equal(state(reboot).queue[0].text, 'Bleibt offen');
  assert.equal(state(reboot).queue[0].delivery.nick, 'Radio-Team');
});

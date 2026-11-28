// Sendeplan-Overlay und privater Wochen-Altbestand; die öffentliche Tagesansicht prüft public-schedule.test.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
let sequence = 0;
const week = '2026-10-26', weekKey = 'mischwerk.schedule.v1.' + week, indexKey = 'mischwerk.schedule.v1.weeks';

function fixture(initial) {
  const h = createHarness(initial ? persistence(initial) : undefined);
  const owner = h.user(1, 'Otterchen', 'owner');
  const listener = h.user(2, 'Musikfreund');
  const radio = h.open(owner), listenerRadio = h.open(listener);
  return { h, owner, listener, radio, listenerRadio, session: radio };
}
function event(f, type, values = {}, person = f.owner, session = f.session) {
  return f.h.event(person, session, type, { requestId: 'schedule-test-' + (++sequence), ...values });
}
function storedWeek() {
  return { version: 1, revision: 3, nextId: 4, entries: [
    { id: 1, userId: 1, nick: 'Otterchen', date: week, start: '19:00', end: '21:00', topic: 'Eigene Sendung' },
    { id: 2, userId: 7, nick: 'Andere', date: '2026-10-27', start: '18:00', end: '20:00', topic: 'Fremde Sendung' },
    { id: 3, kind: 'autodj', date: '2026-10-28', timing: 'allDay', topic: 'AutoDJ' }
  ] };
}

test('Tagesplan öffnet für Hörer und Inhaber ohne Wunschfreigabe und erhält Radio sowie gespeicherte Daten',()=>{
 const f=fixture();f.h.event(f.owner,f.radio,'mw:setRequests',{enabled:false});const before=JSON.stringify(f.h.store.data);
 for(const [person,session]of [[f.owner,f.radio],[f.listener,f.listenerRadio]]){
  const events=f.h.event(person,session,'mw:openSchedule',{requestId:'daily-plan'});
  assert.equal(events.find(e=>e.type==='mw:result').data.ok,true);
  assert.equal(person.sessions.some(s=>s.activeView==='schedule'),true);assert.equal(session.removed,false);
 }
 assert.equal(JSON.stringify(f.h.store.data),before);
});
test('Schreib- und alte Leseanfragen werden ohne Änderung abgewiesen und verweisen auf die Homepage', () => {
  const f = fixture({ [indexKey]: [week], [weekKey]: storedWeek() }), before = JSON.stringify(f.h.store.data);
  for (const type of ['mw:schedule.get', 'mw:schedule.save', 'mw:schedule.delete']) {
    const result = event(f, type, { week, expectedRevision: 3, id: 1, date: week, start: '10:00', end: '11:00', topic: 'Neu' })
      .find(item => item.type === 'mw:schedule.result');
    assert.equal(result.data.ok, false); assert.match(result.data.message, /Homepage/);
    assert.equal(JSON.stringify(f.h.store.data), before);
  }
});
test('Geschlossene/fremde Sitzungen und ungültige Anfrage-IDs dürfen keine Sendung speichern', () => {
  const f = fixture();
  assert.deepEqual(event(f, 'mw:schedule.save', {}, f.listener, f.session), []);
  assert.equal(event(f, 'mw:schedule.get', { requestId: '../datei' }).find(item => item.type === 'mw:schedule.result').data.ok, false);
  f.session.remove();
  assert.deepEqual(event(f, 'mw:schedule.save'), []);
  assert.equal(Object.keys(f.h.store.data).some(key => key.startsWith('mischwerk.schedule.')), false);
});
test('Nutzerlöschung entfernt nur eigene Einträge aus dem privaten Wochen-Altbestand', () => {
  const f = fixture({ [indexKey]: [week], [weekKey]: storedWeek() });
  f.h.app.onUserDeleted(f.owner.id);
  const saved = f.h.store.data[weekKey];
  assert.deepEqual(saved.entries.map(entry => entry.id), [2, 3]);
  assert.equal(saved.revision, 4); assert.deepEqual(f.h.store.data[indexKey], [week]);
  f.h.app.onUserDeleted(99);
  assert.equal(f.h.store.data[weekKey].revision, 4, 'Ohne eigene Einträge wird nichts neu geschrieben');
});
test('Beschädigter Wochen-Altbestand verhindert die übrige Nutzerlöschung nicht', () => {
  const f = fixture({ [indexKey]: [week], [weekKey]: { version: 9, entries: 'kaputt' } });
  assert.doesNotThrow(() => f.h.app.onUserDeleted(f.owner.id));
  assert.match(JSON.stringify(f.h.logs), /SCHEDULE_PURGE/);
  assert.deepEqual(f.h.store.data[weekKey], { version: 9, entries: 'kaputt' });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
let sequence = 0;
const week = '2026-10-26';
function fixture() {
  const h = createHarness();
  const owner = h.user(1, 'Otterchen', 'owner');
  const listener = h.user(2, 'Musikfreund');
  const radio = h.open(owner), listenerRadio = h.open(listener);
  h.event(owner, radio, 'mw:openSchedule');
  const session = owner.sessions.find(item => item.content.htmlFile.pageData.view === 'schedule');
  return { h, owner, listener, radio, listenerRadio, session };
}
function event(f, type, values = {}, person = f.owner, session = f.session) {
  return f.h.event(person, session, type, { requestId: 'schedule-test-' + (++sequence), ...values });
}
function read(f, date = week, page = 0, person = f.owner, session = f.session) {
  const events = event(f, 'mw:schedule.get', { week: date, page }, person, session);
  const result = events.find(item => item.type === 'mw:schedule.data');
  assert.ok(result, JSON.stringify(events));
  return result.data;
}
function save(f, values = {}) {
  const selected = values.week || week;
  return event(f, 'mw:schedule.save', { week: selected, expectedRevision: read(f, selected).revision,
    date: selected, start: '19:00', end: '21:00', nick: f.owner.nick, topic: '80er und 90er', ...values })
    .find(item => item.type === 'mw:schedule.result').data;
}
test('Sendeplan öffnet für Hörer trotz deaktivierter Wunschbox als eigenes Popup und erhält die Radioleiste', () => {
  const f = fixture();
  f.h.event(f.owner, f.session, 'mw:setRequests', { enabled: false });
  const result = f.h.event(f.listener, f.listenerRadio, 'mw:openSchedule');
  assert.equal(result.find(item => item.type === 'mw:result').data.ok, true);
  assert.equal(f.listenerRadio.removed, false);
  const popup = f.listener.sessions.find(item => item.content.htmlFile.pageData.view === 'schedule');
  assert.equal(popup.content.width, 820); assert.equal(popup.content.height, 630);
  assert.equal(popup.content.allowJFXBrowser, false);
  const data = read(f, week, 0, f.listener, popup);
  assert.equal(data.canManage, false);
  assert.deepEqual(data.days, ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
});
test('Nur der echte Channelinhaber bearbeitet den Plan; Radiomoderatoren, CM und Appmanager lesen nur', () => {
  const f = fixture();
  const moderator = f.h.user(3, 'Radiostimme');
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: moderator.nick });
  for (const person of [f.listener, moderator, f.h.user(4, 'CM', 'cm'), f.h.user(5, 'Appmanager', 'manager')]) {
    const session = f.h.open(person);
    assert.equal(read(f, week, 0, person, session).canManage, false);
    for (const type of ['mw:schedule.save', 'mw:schedule.delete']) {
      const response = event(f, type, { week, expectedRevision: 0, canManage: true, id: 1,
        date: week, start: '18:00', end: '20:00', nick: person.nick, topic: 'Manipuliert' }, person, session);
      assert.equal(response.find(item => item.type === 'mw:schedule.result').data.ok, false);
    }
  }
  assert.equal(read(f).total, 0);
});
test('Anlegen, Ändern, Wiederholungs- und Revisionsschutz sowie Löschen einzelner Sendungen', () => {
  const f = fixture();
  assert.equal(save(f).ok, true);
  const first = read(f);
  const id = first.entries[0].id;
  assert.equal(save(f, { id, start: '20:00', end: '22:00', topic: 'Rockabend' }).ok, true);
  assert.equal(read(f).entries[0].topic, 'Rockabend');
  assert.equal(save(f, { expectedRevision: first.revision, topic: 'Veraltet' }).ok, false);
  assert.equal(read(f).total, 1);
  const result = event(f, 'mw:schedule.delete', { week, id, expectedRevision: read(f).revision });
  assert.equal(result.find(item => item.type === 'mw:schedule.result').data.ok, true);
  assert.equal(read(f).total, 0);
});
test('Nur vorhandene und für das Radio ernannte Nicks; authentifizierte User-ID bleibt privat', () => {
  const f = fixture();
  assert.equal(save(f, { nick: 'Unbekannter Nick' }).ok, false);
  assert.equal(save(f, { nick: f.listener.nick }).ok, false);
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick, userId: 999 }).ok, true);
  const entry = read(f).entries[0];
  assert.equal(entry.nick, f.listener.nick);
  assert.equal('userId' in entry, false);
  const stored = f.h.store.data['mischwerk.schedule.v1.' + week].entries[0];
  assert.equal(stored.userId, f.listener.id);
});
test('Datums-, Uhrzeit-, Themen- und Wochenvalidierung; fehlerhafte Eingaben verändern keine Daten', () => {
  const f = fixture();
  for (const input of [{ date: '2026-02-30' }, { date: '2026-11-02' }, { start: '25:00' },
    { end: '19:00' }, { topic: '' }, { topic: 'x'.repeat(81) }, { expectedRevision: null }, { id: '1' }]) {
    assert.equal(save(f, input).ok, false, JSON.stringify(input));
  }
  assert.equal(read(f).total, 0);
  assert.equal(read(f, '2026-11-01').week, week);
});
test('Überschneidungen werden einschließlich Sonntag/Montag verhindert; angrenzende Sendungen sind möglich', () => {
  const f = fixture();
  assert.equal(save(f, { date: '2026-11-01', start: '22:00', end: '02:00' }).ok, true);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '01:00', end: '03:00' }).ok, false);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '02:00', end: '04:00' }).ok, true);
  const next = read(f, '2026-11-02');
  assert.equal(next.total, 2);
  assert.equal(next.previousRevision, read(f).revision, 'Auch die Vorwoche besitzt eine geprüfte Paketrevision');
  assert.equal(next.entries[0].week, week, 'Fortsetzung der Vorwoche am Montag sichtbar');
  assert.equal(save(f, { date: '2026-11-01', start: '23:00', end: '01:00' }).ok, false);
});
test('Zukünftige Wochen über Monats- und Jahresgrenzen werden mit eigener Revision gespeichert und gelesen', () => {
  const f = fixture();
  for (const future of ['2027-01-04', '2027-04-12', '2028-01-03']) {
    assert.equal(save(f, { week: future, date: future, topic: 'Zukunft ' + future }).ok, true);
    const planned = read(f, future);
    assert.equal(planned.revision, 1);
    assert.equal(planned.entries[0].date, future);
    assert.equal(planned.entries[0].topic, 'Zukunft ' + future);
    assert.equal(save(f, { week: future, date: future, start: '21:00', end: '22:00', expectedRevision: 0 }).ok, false);
    assert.ok(f.h.store.data['mischwerk.schedule.v1.' + future]);
  }
  assert.equal(read(f).total, 0, 'Die Ausgangswoche bleibt unverändert');
});

test('Sendungen bis exakt Mitternacht erzeugen keine leere Fortsetzung in der Folgewoche', () => {
  const f = fixture();
  assert.equal(save(f, { date: '2026-11-01', start: '22:00', end: '00:00' }).ok, true);
  assert.equal(read(f).total, 1);
  assert.equal(read(f, '2026-11-02').total, 0);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', start: '00:00', end: '02:00' }).ok, true);
  assert.equal(read(f, '2026-11-02').total, 1);
});

test('Defektes Sendeplanfenster erzeugt nach erfolgreichem Speichern keine zweite Fehlerquittung', () => {
  const f = fixture();
  f.h.event(f.listener, f.listenerRadio, 'mw:openSchedule');
  const broken = f.listener.sessions.find(item => item.content.viewMode === 'Overlay').content;
  broken.getSessions = () => { throw new Error('Private Sitzungsdetails'); };
  const observer = f.h.user(3, 'Weitere Hörerin');
  const observerRadio = f.h.open(observer);
  f.h.event(observer, observerRadio, 'mw:openSchedule');
  const observerPopup = observer.sessions.find(item => item.content.viewMode === 'Overlay');
  observerPopup.events = [];
  const moderator=f.h.user(4,'Studiobeobachtung');
  f.h.event(f.owner,f.radio,'mw:addRadioModerator',{nick:moderator.nick});
  const moderatorRadio=f.h.open(moderator);f.h.event(moderator,moderatorRadio,'mw:openStudio');
  const studio=moderator.sessions.find(item=>item.content.htmlFile.pageData.view==='studio');studio.events=[];
  const events = event(f, 'mw:schedule.save', { week, expectedRevision: 0,
    date: week, start: '19:00', end: '21:00', nick: f.owner.nick, topic: 'Gespeicherte Sendung' });
  const receipts = events.filter(item => item.type === 'mw:schedule.result');
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].data.ok, true);
  assert.equal(read(f).entries[0].topic, 'Gespeicherte Sendung');
  assert.equal(observerPopup.events.some(item => item.type === 'mw:schedule.changed'), true);
  assert.equal(studio.events.some(item=>item.type==='mw:schedule.changed'),false,'Keine ungenutzten Kalenderhinweise mehr an Moderation');
  assert.equal(f.h.logs.some(item => item.message.includes('[SCHEDULE_NOTIFY]')), true);
  assert.doesNotMatch(JSON.stringify(f.h.logs), /Private Sitzungsdetails/);
});
test('Persistente Wochenpläne überleben Neustarts und bleiben vollständig von Zustand und Wünschen getrennt', () => {
  const f = fixture();
  const state = JSON.stringify(f.h.store.data['mischwerk.state.v1']);
  assert.equal(save(f).ok, true);
  assert.equal(JSON.stringify(f.h.store.data['mischwerk.state.v1']), state);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' });
  const second = createHarness(f.h.store);
  const listener = second.user(2, f.listener.nick);
  const session = second.open(listener);
  const restarted = { h: second, owner: listener, session };
  assert.equal(read(restarted).entries[0].topic, '80er und 90er');
  assert.equal(second.state(listener, session).queueTotal, 0);
});
test('Alle Wochen-Einträge bleiben über kleine Pakete lesbar, ohne private User-IDs zu veröffentlichen', () => {
  const f = fixture();
  for (let i = 0; i < 25; i++) {
    const start = String(Math.floor(i / 3)).padStart(2, '0') + ':' + String(i % 3 * 20).padStart(2, '0');
    const end = String(Math.floor((i + 1) / 3)).padStart(2, '0') + ':' + String((i + 1) % 3 * 20).padStart(2, '0');
    assert.equal(save(f, { start, end, topic: '"'.repeat(80) }).ok, true);
  }
  const first = read(f), second = read(f, week, 1);
  assert.equal(first.pages, 2); assert.equal(first.total, 25);
  assert.equal(first.entries.length + second.entries.length, 25);
  assert.ok(JSON.stringify(first).length < 9500);
  assert.equal(first.entries.some(entry => 'userId' in entry), false);
});
test('Speicherfehler erhalten Wochenplan und Wunschannahme', () => {
  const f = fixture();
  assert.equal(save(f).ok, true);
  const setObject = f.h.store.setObject;
  f.h.store.setObject = (key, value) => { if (key.startsWith('mischwerk.schedule.')) { throw new Error('privater Fehler'); } setObject(key, value); };
  const response = save(f, { id: read(f).entries[0].id, topic: 'Nicht gespeichert' });
  assert.equal(response.ok, false); assert.doesNotMatch(response.message, /privater Fehler/);
  assert.equal(read(f).entries[0].topic, '80er und 90er');
  assert.equal(f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' })
    .find(item => item.type === 'mw:wish.receipt').data.accepted, true);
});
test('Nutzerlöschung entfernt geplante Nick-/Userdaten aus allen gespeicherten Wochen', () => {
  const f = fixture();
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick }).ok, true);
  assert.equal(save(f, { week: '2026-11-02', date: '2026-11-02', nick: f.listener.nick }).ok, true);
  f.h.app.onUserDeleted(f.listener.id);
  assert.equal(read(f).total, 0); assert.equal(read(f, '2026-11-02').total, 0);
  assert.equal(JSON.stringify(f.h.store.data).includes(f.listener.nick), false);
});
test('Aktuelle Woche folgt dem deutschen Datum auch sonntags nach UTC-Mitternacht und im Sommer', () => {
  const f = fixture();
  for (const [stamp, today, monday] of [
    ['2026-07-05T22:30:00Z', '2026-07-06', '2026-07-06'],
    ['2026-10-25T00:30:00Z', '2026-10-25', '2026-10-19'],
    ['2026-10-25T01:30:00Z', '2026-10-25', '2026-10-19'],
    ['2026-12-31T23:30:00Z', '2027-01-01', '2026-12-28']
  ]) {
    f.h.advance(Date.parse(stamp) - f.h.state(f.owner, f.session).serverTime);
    const current = event(f, 'mw:schedule.get').find(item => item.type === 'mw:schedule.data').data;
    assert.equal(current.today, today); assert.equal(current.week, monday);
    assert.equal(current.days.length, 7);
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
test('Fehler beim Bereinigen des Sendeplans blockieren nicht die bisherige Rollen- und Wunschbereinigung', () => {
  const f = fixture();
  f.h.event(f.owner, f.session, 'mw:addRadioModerator', { nick: f.listener.nick });
  assert.equal(save(f, { nick: f.listener.nick }).ok, true);
  f.h.event(f.listener, f.listenerRadio, 'mw:wish.submit', { text: 'Aha – Take On Me' });
  const write = f.h.store.setObject;
  f.h.store.setObject = (key, value) => {
    if (key.startsWith('mischwerk.schedule.')) { throw new Error('privater Speicherfehler'); }
    write(key, value);
  };
  assert.doesNotThrow(() => f.h.app.onUserDeleted(f.listener.id));
  assert.equal(f.h.store.data['mischwerk.state.v1'].radioModeratorUserIds.length, 0);
  assert.equal(f.h.state(f.owner, f.session).queueTotal, 0);
  assert.ok(f.h.logs.some(log => log.message.includes('SCHEDULE_PURGE')));
  assert.equal(f.h.logs.some(log => log.message.includes('privater Speicherfehler')), false);
});

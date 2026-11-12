const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');

function fixture() {
  const calls = [];
  let topic = 'Bisheriges Channel-Thema';
  const information = {
    getTopic: () => topic,
    setTopic(text, showMessage) { calls.push({ text, showMessage }); topic = text; }
  };
  const h = createHarness(undefined, { serverMethods: {
    getChannel: () => ({ getOnlineUsers: () => [], getChannelConfiguration: () => ({ getChannelInformation: () => information }) })
  } });
  const owner = h.user(1, 'Otterchen', 'owner');
  return { h, owner, calls, information, topic: () => topic, run: (text, person = owner) => h.app.chatCommands.settopic(person, text) };
}

test('/settopic ist registriert und verändert beim Appstart kein Channel-Thema', () => {
  const f = fixture();
  assert.equal(typeof f.h.app.chatCommands.settopic, 'function');
  assert.equal(f.calls.length, 0);
  assert.equal(f.topic(), 'Bisheriges Channel-Thema');
});

test('/settopic übernimmt KCode und Java-Stringwerte unverändert, ohne Radio oder Appzustand zu ändern', () => {
  const f = fixture(), radio = f.h.open(f.owner), before = JSON.stringify(f.h.store.data), events = radio.events.length;
  const raw = '  °[230,199,123]°_Radio MischWerk_°r° °>{button}Info||call|/info<° ' + 'Musik '.repeat(60);
  f.run(new String(raw));
  assert.deepEqual(f.calls, [{ text: raw, showMessage: true }]);
  assert.equal(f.topic(), raw);
  assert.match(f.owner.messages.at(-1), /^Das Channel-Thema wurde aktualisiert\. Rücklesen unverändert/);
  assert.equal(JSON.stringify(f.h.store.data), before);
  assert.equal(f.owner.sessions.length, 1); assert.equal(radio.removed, false);
  assert.equal(radio.events.length, events); assert.equal(f.h.bot.messages.length, 0);
  f.run(raw);
  assert.equal(f.calls.length, 1, 'Gleiches Thema erzeugt keine erneute öffentliche Änderung');
  assert.match(f.owner.messages.at(-1), /bereits/);
});

test('/settopic verlangt bei jedem Aufruf authentifizierten Otterchen, Inhaberrecht und Anwesenheit', () => {
  const f = fixture();
  for (const [index, [nick, role, online]] of [
    ['Otterchen', 'listener', true], ['Otterchen', 'moderator', true], ['Otterchen', 'manager', true],
    ['Anderer Inhaber', 'owner', true], ['Otterchen', 'owner', false]
  ].entries()) {
    const person = f.h.user(10 + index, nick, role); person.online = online;
    f.run('Nicht erlaubt', person);
    assert.match(person.messages.at(-1), /Otterchen|MischWerk-Channel/);
  }
  const dj = f.h.user(30, 'Radio-Team'), radio = f.h.open(f.owner);
  f.h.event(f.owner, radio, 'mw:addRadioModerator', { nick: dj.nick });
  f.run('Nicht erlaubt', dj);
  assert.match(dj.messages.at(-1), /Nur Otterchen/);
  f.run('Erlaubt'); f.owner.role = 'listener'; f.run('Rechte verloren');
  assert.equal(f.calls.length, 1); assert.equal(f.topic(), 'Erlaubt');
});

test('/settopic akzeptiert genau 2500 UTF-16-Zeichen und lehnt fehlenden, leeren oder längeren Text ab', () => {
  const f = fixture();
  for (const text of [undefined, null, '', ' \t\r\n ', 'a'.repeat(2501), '🎵'.repeat(1251)]) {
    f.run(text);
    assert.match(f.owner.messages.at(-1), /\/settopic TEXT|2\.500/);
  }
  assert.equal(f.calls.length, 0); assert.equal(f.topic(), 'Bisheriges Channel-Thema');
  const maximum = '🎵'.repeat(1250); f.run(maximum);
  assert.deepEqual(f.calls, [{ text: maximum, showMessage: true }]);
});

test('/settopic meldet native API-Fehler ohne Rohtext und erlaubt danach einen neuen Versuch', () => {
  const f = fixture(), setter = f.information.setTopic;
  f.information.setTopic = () => { throw new Error('PRIVATE-DETAILS und beliebiger Themeninhalt'); };
  f.run('°>{button}Privat||call|/info<°');
  assert.equal(f.topic(), 'Bisheriges Channel-Thema'); assert.equal(f.calls.length, 0);
  assert.match(f.owner.messages.at(-1), /konnte gerade nicht/);
  assert.doesNotMatch(JSON.stringify(f.owner.messages) + JSON.stringify(f.h.logs), /PRIVATE-DETAILS|Privat|Themeninhalt/);
  f.information.setTopic = setter; f.run('Erneuter Versuch');
  assert.equal(f.calls.length, 1); assert.equal(f.topic(), 'Erneuter Versuch');
});

test('/settopic bleibt bei fehlender API und beim Shutdown geschlossen', () => {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner');
  assert.doesNotThrow(() => h.app.chatCommands.settopic(owner, 'Ohne API'));
  assert.match(owner.messages.at(-1), /konnte gerade nicht/);
  const f = fixture(); f.h.app.onPrepareShutdown(); f.run('Beim Neustart');
  assert.equal(f.calls.length, 0); assert.match(f.owner.messages.at(-1), /neu gestartet/);
});

test('/settopic wiederholt eine bestätigte Themenänderung bei fehlgeschlagener Privatantwort nicht', () => {
  const f = fixture();
  f.owner.sendPrivateMessage = () => { throw new Error('Private Antwort fehlgeschlagen'); };
  assert.doesNotThrow(() => f.run('Bestätigtes Thema'));
  assert.equal(f.calls.length, 1); assert.equal(f.topic(), 'Bestätigtes Thema');
  assert.match(f.h.logs.at(-1).message, /CHANNEL_TOPIC_REPLY/);
});

test('/settopic übergibt Lieblings-MyChannel, Readme und Channelinfo als drei vollständige native Buttons', () => {
  const f = fixture();
  const buttons = [
    '°>{button}Lieblings-MyChannel|mw-lmc|call|/edit setlmc<°',
    '°>{button}Readme setzen|mw-readme|call|/readme Ich höre Radio MischWerk.<°',
    '°>{button}Channelinfo|mw-info|call|/info<°'
  ];
  const raw = '°[230,199,123]°_Radio MischWerk_°r° – Dein Mix aus Musik und guter Laune! ' + buttons.join(' ');
  f.run(raw);
  assert.equal(raw.length < 2500, true);
  assert.deepEqual(f.calls, [{ text: raw, showMessage: true }]);
  assert.equal(f.information.getTopic(), raw);
  for (const button of buttons) assert.equal(f.topic().includes(button), true);
  assert.match(f.owner.messages.at(-1), /^Das Channel-Thema wurde aktualisiert\. Rücklesen unverändert.*3 von 3/);
  assert.equal(f.owner.messages.at(-1).includes('{button}'), false, 'Quittung enthält keine erneut ausgegebenen Buttons');
  assert.equal(f.h.bot.messages.length, 0, 'Buttons werden beim Setzen nicht als zusätzliche Botnachricht ausgeführt');
});

test('/settopic --buttons erhält zwei Aktionen und Homepage als inaktiven Button ohne Readme-Befehl', () => {
  const f = fixture(); f.run('--buttons');
  assert.equal(f.calls.length, 1);
  const raw = f.calls[0].text;
  assert.equal((raw.match(/°>\{button\}/g) || []).length, 3);
  assert.ok(raw.includes('guter Laune!°#r°°#r°°>CENTER<°°>{button}'), 'Abstand und eigene zentrierte Buttonzeile');
  assert.ok(raw.includes('°>{button}Lieblings-MyChannel||call|/edit setlmc|color|'));
  assert.ok(raw.includes('°>{button}Homepage||enabled|0|color|'));
  const homepage=raw.match(/°>\{button\}Homepage\|[^°]*<°/)[0];
  assert.doesNotMatch(homepage,/\|call\|/);
  assert.doesNotMatch(raw,/Readme setzen|\/readme\b/);
  assert.ok(raw.includes('°>{button}Channelinfo||call|/info|color|'));
  assert.equal(f.calls[0].showMessage, true);
  assert.match(f.owner.messages.at(-1), /unverändert.*3 von 3/);
  f.run('--buttons'); assert.equal(f.calls.length, 1);
});

test('Rücklesen erkennt entfernte oder umgeschriebene Buttons ohne falsche Erfolgsbestätigung', () => {
  for (const transform of [text => text.replace(/°>\{button\}[^°]*<°/g, ''), text => text.replace('/info', '/anderer-befehl')]) {
    const f = fixture(), setter = f.information.setTopic;
    f.information.setTopic = (text, showMessage) => setter(transform(text), showMessage);
    f.run('--buttons');
    assert.match(f.owner.messages.at(-1), /veränderten Text/);
    assert.doesNotMatch(f.owner.messages.at(-1), /wurde aktualisiert|unverändert|\{button\}/);
    assert.equal(f.calls.length, 1);
  }
});

test('Rücklesen nach erfolgreichem Setzen darf bei API-Fehlern weder zurückrollen noch erneut setzen', () => {
  const f = fixture(), setter = f.information.setTopic;
  f.information.setTopic = (text, showMessage) => {
    setter(text, showMessage);
    f.information.getTopic = () => { throw new Error('Private Readbackdetails'); };
  };
  f.run('--buttons');
  assert.equal(f.calls.length, 1);
  assert.match(f.owner.messages.at(-1), /übergeben.*nicht geprüft/);
  assert.doesNotMatch(JSON.stringify(f.owner.messages) + JSON.stringify(f.h.logs), /Private Readbackdetails/);
});

test('Prüfbefehl liest nur Zeichen- und Buttonzahl, erhält das Thema und benötigt Inhaberrecht', () => {
  const f = fixture(); f.run('--buttons'); const raw = f.topic(), count = f.calls.length;
  f.run('--pruefen');
  assert.equal(f.calls.length, count); assert.equal(f.topic(), raw);
  assert.match(f.owner.messages.at(-1), /Button-Elemente: 3/);
  assert.equal(f.owner.messages.at(-1).includes(raw), false);
  f.owner.role = 'listener'; f.run('--buttons'); f.run('--pruefen');
  assert.equal(f.calls.length, count); assert.match(f.owner.messages.at(-1), /Nur Otterchen/);
});

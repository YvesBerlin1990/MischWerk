const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');

function greeting(nick) {
  return '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>' + nick + '|/w ' + nick + '<°._°r° Viel Spaß beim Zuhören.';
}
function photoLink(url, nick) { return ' °>' + url + '<>--<>|/w ' + nick + '<°'; }

test('Bildtag bleibt gültig, wenn die Profilfunktion Anzeigetext maskiert oder mit _h formatiert', () => {
  for (const format of [display => display.replace(/[<>]/g, character => '\\' + character), display => '_h' + display]) {
    const { h } = fixture(), person = h.user(2, 'Fotofreund'), displays = [];
    person.profilePhoto = 'https://example.invalid/profile.png?cnt=91&.img';
    person.getProfileLink = display => {
      displays.push(display);
      return '°>' + format(display) + '|/w "native-profile-target"<°';
    };
    h.app.onUserJoined(person);
    assert.ok(h.bot.messages[0].endsWith(' °>https://example.invalid/profile.png?cnt=91&.img<>--<>|/w "native-profile-target"<°'));
    assert.deepEqual(displays, ['Fotofreund', 'Profil öffnen']);
  }
});

function fixture(options = {}) {
  const h = createHarness(undefined, { random: () => 0, ...options }), owner = h.user(1, 'Otterchen', 'owner');
  const session = h.open(owner);
  const appoint = person => {
    h.event(owner, session, 'mw:addRadioModerator', { nick: person.nick });
    assert.equal(h.state(person, h.open(person)).user.canModerate, true);
  };
  return { h, owner, session, appoint };
}

test('Nick und Foto verwenden den nativen Profillink; Begrüßung ist größer, fett, warmgolden und ohne festen Zeilenumbruch', () => {
  const { h } = fixture(), person = h.user(2, 'Fotofreund'), displays = [];
  person.profilePhoto = 'https://example.invalid/profile.png';
  person.getProfileLink = display => { displays.push(display); return '°>' + display + '|/w Fotofreund<°'; };
  h.app.onUserJoined(person);
  assert.deepEqual(displays, ['Fotofreund', 'Profil öffnen']);
  assert.doesNotMatch(h.bot.messages[0], /°#°|[\r\n]/, 'Kein erzwungener Umbruch zwischen den Begrüßungssätzen');
  assert.equal(h.bot.messages[0], '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, °>Fotofreund|/w Fotofreund<°._°r° Viel Spaß beim Zuhören. °>https://example.invalid/profile.png<>--<>|/w Fotofreund<°');
  assert.deepEqual(person.photoSize, [24, 24]);
});

test('Öffentliche Begrüßung ist für Hörer, MCM, Radio-Team, Doppelrolle und Inhaber gleich; Rechte bleiben erhalten', () => {
  const { h, owner, appoint } = fixture();
  const listener = h.user(2, 'Musikfreund'), mcm = h.user(3, 'Channelhilfe', 'moderator');
  const dj = h.user(4, 'Plattenfreund'), both = h.user(5, 'Doppelschicht', 'moderator');
  appoint(dj); appoint(both);
  for (const person of [listener, mcm, dj, both, owner]) h.app.onUserJoined(person);
  assert.equal(h.bot.messages.length, 5);
  assert.equal(h.bot.messages[0], greeting('Musikfreund'));
  assert.equal(h.bot.messages[1], greeting('Channelhilfe'));
  assert.equal(h.bot.messages[2], greeting('Plattenfreund'));
  assert.equal(h.bot.messages[3], greeting('Doppelschicht'));
  assert.equal(h.bot.messages[4], greeting('Otterchen'));
  for (const person of [listener, mcm]) assert.equal(h.state(person, person.sessions[0]).user.canModerate, false);
  assert.ok(h.bot.messages.every(message => !/ON AIR|live|User-ID/i.test(message)));
});

test('Nur echte Menschen werden begrüßt; Appmanager, Entwickler und behauptete Clientrollen bleiben Hörer', () => {
  const { h } = fixture();
  for (const [index, role] of ['manager', 'developer'].entries()) {
    const person = h.user(10 + index, role, role);
    h.app.onUserJoined(person);
    h.event(person, person.sessions[0], 'mw:refresh', { canModerate: true, isChannelModerator: true });
    assert.equal(h.bot.messages.at(-1), greeting(role));
  }
  for (const type of ['appbot', 'systembot']) {
    const bot = h.user(20 + h.bot.messages.length, type); bot.userType = type;
    h.app.onUserJoined(bot);
  }
  const absent = h.user(30, 'Abwesend'); absent.online = false; h.app.onUserJoined(absent);
  assert.equal(h.bot.messages.length, 2);
});

test('Kleines Profilfoto steht hinter der vollständigen Begrüßung; die User-API erhält eine 24×24-Anfrage', () => {
  const { h } = fixture(), person = h.user(2, 'Fotofreund');
  person.profilePhoto = 'https://example.invalid/profile.png?size=24';
  h.app.onUserJoined(person);
  assert.deepEqual(person.photoSize, [24, 24]);
  assert.equal(h.bot.messages.length, 1);
  assert.equal(h.bot.messages[0], greeting('Fotofreund') + photoLink('https://example.invalid/profile.png?size=24', 'Fotofreund'));
  assert.deepEqual(person.messages, []);
});

test('Mit und ohne Foto erhalten alle Rollen dieselbe neutrale Begrüßung', () => {
  for (const role of ['listener', 'mcm', 'radio', 'both']) {
    const { h, appoint } = fixture(), person = h.user(2, 'Langer _Nick°', ['mcm', 'both'].includes(role) ? 'moderator' : 'listener');
    if (['radio', 'both'].includes(role)) appoint(person);
    h.app.onUserJoined(person);
    const text = h.bot.messages.at(-1);
    assert.equal(text, greeting('Langer \\_Nick\\°'));
    person.online = false; h.app.onUserLeft(person);
    person.profilePhoto = 'https://example.invalid/photo.png'; person.online = true; h.app.onUserJoined(person);
    assert.equal(h.bot.messages.at(-1), text + photoLink('https://example.invalid/photo.png', 'Langer \\_Nick\\°'));
    assert.deepEqual(person.photoSize, [24, 24]);
  }
});

test('Kein Foto, Abruffehler, leere oder gefährliche Bildadresse lassen die Textbegrüßung bestehen', () => {
  for (const url of [undefined, '', null, 'javascript:alert(1)', 'https://example.invalid/a°>x<°',
    'https://example.invalid/a|/x', 'https://example.invalid/a\n.png', 'https://example.invalid/' + 'x'.repeat(2000)]) {
    const { h } = fixture(), person = h.user(2, 'OhneFoto'); person.profilePhoto = url;
    h.app.onUserJoined(person);
    assert.equal(h.bot.messages[0], greeting('OhneFoto'));
  }
  for (const method of ['hasProfilePhoto', 'getProfilePhoto']) {
    const { h } = fixture(), person = h.user(2, 'Fotofehler'); person.profilePhoto = 'https://example.invalid/a.png';
    person[method] = () => { throw new Error('private-photo-detail'); };
    h.app.onUserJoined(person);
    assert.equal(h.bot.messages[0], greeting('Fotofehler'));
    assert.ok(!JSON.stringify(h.logs).includes('private-photo-detail'));
  }
});

test('Nicknamen werden mit escapeKCode eingesetzt; Java-ähnliche Werte werden primitive Strings', () => {
  const { h } = fixture(), person = h.user(2, '_Nick°>/x|Text<°');
  const nick = person.nick;
  person.getNick = () => ({ toString: () => nick });
  person.getUserId = () => ({ valueOf: () => 2 });
  h.app.onUserJoined(person);
  assert.ok(h.escapedNicks.includes(nick));
  assert.ok(h.bot.messages[0].includes(nick.replace(/[_°<>\\|]/g, character => '\\' + character)));
});

test('Ausgefallene oder leere Profillinks erhalten Text und Foto als unverlinkte Rückfallebene', () => {
  for (const result of [undefined, null, '', 'x'.repeat(6001), new Error('private-link-detail')]) {
    const { h } = fixture(), person = h.user(2, 'Linkfehler');
    person.profilePhoto = 'https://example.invalid/photo.png';
    person.getProfileLink = () => { if (result instanceof Error) throw result; return result; };
    h.app.onUserJoined(person);
    assert.equal(h.bot.messages[0], '°16°°[230,199,123]°_Willkommen bei Radio MischWerk, Linkfehler._°r° Viel Spaß beim Zuhören. °>https://example.invalid/photo.png<°');
    assert.ok(!JSON.stringify(h.logs).includes('private-link-detail'));
  }
});

test('Nicht auswertbare native Foto-Profillinks behalten einen eigenständigen Bildtag', () => {
  for (const link of ['kein Link', '°>Profil öffnen|<°', '°>Profil öffnen|/w Ziel°#°<°', '°>Profil öffnen|/w Ziel\n/anderer-befehl<°']) {
    const { h } = fixture(), person = h.user(2, 'Linkfehler');
    person.profilePhoto = 'https://example.invalid/photo.png';
    person.getProfileLink = display => display === 'Profil öffnen' ? link : '°>Linkfehler|/w Linkfehler<°';
    h.app.onUserJoined(person);
    assert.equal(h.bot.messages[0], greeting('Linkfehler') + ' °>https://example.invalid/photo.png<°');
  }
});

test('Nick-Link maskiert den Trenner auch neben wörtlichen Backslashes genau einmal', () => {
  for (const nick of ['Nick|Text', 'Nick\\|Text']) {
    const { h } = fixture(), person = h.user(2, nick);let display;
    person.getProfileLink = value => { display = value; return '°>' + value + '|/w Linktest<°'; };
    h.app.onUserJoined(person);
    assert.equal(display, nick === 'Nick|Text' ? 'Nick\\|Text' : 'Nick\\\\\\|Text');
    assert.ok(h.bot.messages[0].includes('|/w Linktest<°'));
  }
});

test('Doppelte Hooks, Appstart, Refresh, Wiederöffnung und Rollenänderung erzeugen keine weitere Begrüßung', () => {
  const { h, appoint } = fixture(), person = h.user(2, 'BleibtHier');
  h.app.onUserJoined(person); h.app.onUserJoined(person);
  h.state(person, person.sessions[0]); h.open(person); appoint(person);
  h.app.onAppStart(); h.app.onUserJoined(person);
  assert.equal(h.bot.messages.length, 1);
  assert.ok(h.store.data['mischwerk.state.v1'].radioModeratorUserIds.includes(2));
  assert.ok(Object.keys(h.store.data).every(key => !/greet|welcome/i.test(key)));
});

test('Begrüßungen benötigen keinen Zufall und bleiben bei echtem Wiederbeitritt gleich', () => {
  let calls = 0;
  const { h } = fixture({ random: () => { calls++; return .5; } });
  calls = 0; // Die bestehende Wunschqueue erzeugt beim Start ihre unabhängige Zufallskennung.
  const person = h.user(2, 'KommtNochmal');
  assert.equal(calls, 0); h.app.onUserJoined(person); assert.equal(calls, 0);
  h.app.onUserJoined(person); h.app.onAppStart(); h.state(person, person.sessions[0]);
  assert.equal(calls, 0); assert.equal(h.bot.messages.length, 1);
  person.online = false; h.app.onUserLeft(person); person.online = true; h.app.onUserJoined(person);
  assert.equal(calls, 0); assert.equal(h.bot.messages.length, 2); assert.equal(h.bot.messages[0], h.bot.messages[1]);
});

test('Nick-Ersetzung behandelt Dollarzeichen und Vorlagenmarker im tatsächlichen Nick wörtlich', () => {
  const { h } = fixture(), person = h.user(2, "$&_$`_$'_{Nick}°");
  person.profilePhoto = 'https://example.invalid/photo.png'; h.app.onUserJoined(person);
  const nick = person.nick.replace(/[_°<>\\]/g, character => '\\' + character);
  assert.equal(h.bot.messages[0], greeting(nick) + photoLink('https://example.invalid/photo.png', nick));
});

test('Start und Neustart begrüßen bereits Anwesende nicht nachträglich', () => {
  const h = createHarness(undefined, { users: [{ id: 2, nick: 'SchonDa', role: 'listener' }] });
  const person = h.user(2);
  h.app.onUserJoined(person); h.app.onAppStart();
  assert.deepEqual(h.bot.messages, []);
  const restarted = createHarness(h.store, { users: [{ id: 2, nick: 'SchonDa', role: 'listener' }] });
  restarted.app.onUserJoined(restarted.user(2)); assert.deepEqual(restarted.bot.messages, []);
});

test('Echter Wiederbeitritt behält auch nach Rollenwechsel den Text; Verlassen und Nutzerlöschung bleiben still', () => {
  const { h, appoint } = fixture(), person = h.user(2, 'KommtWieder');
  h.app.onUserJoined(person);
  person.online = false; h.app.onUserLeft(person);
  assert.equal(h.bot.messages.length, 1);
  person.online = true; appoint(person); person.role = 'moderator'; h.app.onUserJoined(person);
  assert.equal(h.bot.messages.length, 2); assert.equal(h.bot.messages[1], greeting('KommtWieder'));
  h.app.onUserDeleted(2); assert.equal(h.bot.messages.length, 2);
  h.app.onUserJoined(person); assert.equal(h.bot.messages.length, 3); assert.equal(h.bot.messages[2], h.bot.messages[1]);
});

test('Botfehler werden einmal versucht, verraten keine Details und verhindern weder Radio noch Wünsche', () => {
  const { h } = fixture(), person = h.user(2, 'Botfehler'); let attempts = 0;
  h.bot.sendPublicMessage = () => { attempts++; throw new Error('private-bot-detail'); };
  h.app.onUserJoined(person); h.app.onUserJoined(person); h.app.onAppStart();
  assert.equal(attempts, 1); assert.equal(person.sessions.length, 1);
  const events = h.event(person, person.sessions[0], 'mw:wish.submit', { text: 'Interpret – Titel' });
  assert.equal(events.find(event => event.type === 'mw:wish.receipt').data.accepted, true);
  assert.ok(h.logs.some(entry => entry.message.includes('USER_GREETING')));
  assert.ok(!JSON.stringify(h.logs).includes('private-bot-detail'));
});

test('Fehlende UI-Fähigkeit oder defekter Rollenabruf koppeln Begrüßung und Radio nicht aneinander', () => {
  const { h } = fixture(), incapable = h.user(2, 'OhneHeader'); incapable.capable = false;
  h.app.onUserJoined(incapable); assert.equal(h.bot.messages.length, 1);
  const broken = h.user(3, 'Rollenfehler'); broken.isChannelModerator = () => { throw new Error('private-role'); };
  h.app.onUserJoined(broken); assert.equal(broken.sessions.length, 1); assert.equal(h.bot.messages.length, 2);
  assert.equal(h.bot.messages[1], greeting('Rollenfehler'));
  assert.ok(!JSON.stringify(h.logs).includes('private-role'));
});

for (const hook of ['onPrepareShutdown', 'onShutdown']) {
  test('Shutdown sperrt weitere Begrüßungen: ' + hook, () => {
    const { h } = fixture(); h.app[hook](); h.app.onUserJoined(h.user(2, 'ZuSpät'));
    assert.deepEqual(h.bot.messages, []);
  });
}

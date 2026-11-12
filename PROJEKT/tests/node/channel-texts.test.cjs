const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const key = 'mischwerk.channelTexts.v1';
const minutes = n => n * 60000;
function setup(store) {
  const h = createHarness(store), owner = h.user(501, 'Otterchen', 'owner'), radio = h.open(owner);
  h.event(owner, radio, 'mw:openRadioTeam');
  return { h, owner, radio, team:owner.sessions.at(-1) };
}
function settings(f) {
  f.h.event(f.owner, f.team, 'mw:refresh');
  return f.team.events.findLast(e => e.type === 'mw:channelTexts.state')?.data;
}
let sequence = 0;
function save(f, changes = {}) {
  const current = settings(f);
  f.h.event(f.owner, f.team, 'mw:channelTexts.save', { requestId:'texts-' + (++sequence), view:'team', viewRevision:1,
    expectedRevision:current.revision, enabled:true, interval:20, texts:['Erster Text', '', 'Zweiter Text'], ...changes });
  return f.team.events.findLast(e => e.type === 'mw:result')?.data;
}

// Native Nachrichtenverarbeitung als Fixture; dies ist kein echter Smiley-/Clientnachweis.
const smileyCode = ':(nosmoking-happy-y):';
const smileyImage = '°>sm_fixture_nosmoking_happy_y.b.gif<°';
// Vom Diagnosescreenshot des Nutzers abgelesen; seine Ausgabe nennt exakt 111 Zeichen.
const reportedSmileyPath = 'sm_abo_24-03_nosmoking_yellow_happy...b.w_35.h_39.mx_1.pw_33.ph_39.gif';
const reportedSmileyMessage = '°>' + reportedSmileyPath + '<>--<>|/tb-show sid~smileyClick:21178<°';
function learnSmiley(f, code = smileyCode, image = smileyImage, user = f.owner) {
  f.h.app.onPrivateMessage({ getAuthor:() => user, getRawText:() => new String('smiley ' + code),
    getText:() => new String('smiley ' + image) });
}

test('Die gemeldeten 111 Zeichen des echten Smiley-Bildcodes werden mit allen Punkten unverändert übernommen', () => {
  assert.equal(reportedSmileyMessage.length, 111);
  const f = setup(), image = '°>' + reportedSmileyPath + '<°';
  assert.equal(save(f, {texts:['Rauchen bitte vor der Tür. ' + smileyCode]}).ok, true);
  const before = structuredClone(f.h.store.data[key]);
  learnSmiley(f, smileyCode, reportedSmileyMessage);
  assert.match(f.owner.messages.at(-1), /^Smiley gespeichert/);
  assert.deepEqual(f.h.store.data[key].smileys, [{code:smileyCode,image}]);
  assert.equal(f.h.store.data[key].nextAt, before.nextAt);
  assert.deepEqual(f.h.bot.messages, []);
  f.h.app.onShutdown();
  const restarted = setup(f.h.store);
  restarted.h.advance(minutes(20));
  assert.deepEqual(restarted.h.bot.messages, ['Rauchen bitte vor der Tür. ' + image]);
  assert.equal(settings(restarted).texts[0], 'Rauchen bitte vor der Tür. ' + smileyCode);
  assert.doesNotMatch(restarted.h.bot.messages[0], /tb-show|\\°/);
});

test('Mehrere Punkte im Bildnamen bleiben erlaubt; echte relative und absolute Pfadwechsel bleiben gesperrt', () => {
  for (const path of ['../sm_test.gif','smileys/../sm_test.gif','smileys/./sm_test.gif',
    'https://chat.knuddels.de/pics/../sm_test.gif','https://chat.knuddels.de/pics/./sm_test.gif',
    'https://chat.knuddels.de/pics/%2e%2e/sm_test.gif']) {
    const f = setup(); learnSmiley(f, smileyCode, '°>' + path + '<°');
    assert.equal(f.h.store.data[key], undefined, path);
  }
  for (const path of [reportedSmileyPath, 'smileys/' + reportedSmileyPath,
    'https://chat.knuddels.de/pics/' + reportedSmileyPath]) {
    const f = setup(); learnSmiley(f, smileyCode, '°>' + path + '<°');
    assert.equal(f.h.store.data[key]?.smileys[0]?.image, '°>' + path + '<°', path);
  }
});

test('Eigener Knuddels-Smiley wird einmal nativ übernommen und im gespeicherten Bot-Text auch nach Neustart ersetzt', () => {
  const f = setup();
  assert.equal(save(f, { texts:['Rauchen bitte vor der Tür. ' + smileyCode] }).ok, true);
  const before = structuredClone(f.h.store.data[key]);
  learnSmiley(f, smileyCode, smileyImage.replace('<°', '<>--<>|/tb-show sid~smileyClick:21178<°'));
  assert.equal(f.h.store.data[key].nextAt, before.nextAt);
  assert.equal(f.h.store.data[key].revision, before.revision);
  assert.equal(f.h.timers.size, 1);
  assert.deepEqual(f.h.bot.messages, [], 'Übernehmen sendet keine öffentliche Nachricht');
  f.h.app.onShutdown();
  const restarted = setup(f.h.store);
  restarted.h.advance(minutes(20));
  assert.deepEqual(restarted.h.bot.messages, ['Rauchen bitte vor der Tür. ' + smileyImage]);
  assert.equal(settings(restarted).texts[0], 'Rauchen bitte vor der Tür. ' + smileyCode);
  assert.doesNotMatch(JSON.stringify(settings(restarted)), /sm_fixture|smileys/);
});

test('Smileyzuordnung überlebt Verwaltungsspeichern; unbekannte Kürzel und übriger KCode bleiben Klartext', () => {
  const f = setup(); learnSmiley(f);
  const text = '_Hallo_ °R° ' + smileyCode + ' :(unbekannt): 🙂 ' + smileyCode;
  assert.equal(save(f, { texts:[text], smileys:[{ code:':(unbekannt):', image:smileyImage }] }).ok, true);
  f.h.advance(minutes(20));
  assert.equal(f.h.bot.messages[0], '\\_Hallo\\_ \\°R\\° ' + smileyImage + ' :(unbekannt): 🙂 ' + smileyImage);
  assert.equal(f.h.store.data[key].smileys.length, 1, 'Clientdaten können keine Zuordnung einschleusen');
});

test('Native Smiley-Bildlinks und umgebende Formatierung werden unabhängig vom Smileybesitz erkannt', () => {
  // Formatvarianten als Gegenfälle, kein Mitschnitt der tatsächlichen Serverantwort des Nutzers.
  for (const delivered of [
    '°r°smiley ' + smileyImage + '°r°',
    '°r°' + smileyImage + '°r°',
    '_' + smileyImage.replace('<°', '<>|/tb-show sid~smileyClick:21178<°') + '_',
    smileyImage.replace('<°', '|/tb-show sid~smileyClick:21178<°'),
    '°[230,199,123]°' + smileyImage + '°r°'
  ]) {
    const f = setup(); learnSmiley(f, smileyCode, delivered);
    assert.equal(f.h.store.data[key]?.smileys[0]?.image, smileyImage, delivered);
    assert.match(f.owner.messages.at(-1), /^Smiley gespeichert/);
  }
});

test('Native Bildpfade mit Unterordnern und vertrauenswürdigen URL-Parametern bleiben erhalten', () => {
  for (const image of ['°>smileys/sm_fixture_nosmoking.gif<°',
    '°>https://chat.knuddels.de/pics/smileys/sm_fixture.gif?v=2&size=33<°']) {
    const f = setup(); learnSmiley(f, smileyCode, image);
    assert.equal(f.h.store.data[key]?.smileys[0]?.image, image);
    f.h.app.onShutdown();
    const restarted = setup(f.h.store);
    assert.equal(save(restarted, {texts:[smileyCode]}).ok, true);
    restarted.h.advance(minutes(20));
    assert.equal(restarted.h.bot.messages[0], image);
  }
});

test('Unbekanntes natives Format meldet keine Besitzbehauptung und liefert nur privat begrenzte Formatdaten', () => {
  for (const delivered of [smileyCode, '°>{image}sm_fixture.gif<°', 'x'.repeat(2000), '\u0000'.repeat(2000)]) {
    const f = setup(); learnSmiley(f, smileyCode, delivered);
    const reply = f.owner.messages.at(-1);
    assert.match(reply, /App|Format/);
    assert.doesNotMatch(reply, /eigenen aktiven Smiley/);
    assert.match(reply, /Empfangen/);
    assert.ok(reply.length < 1200);
    assert.equal(f.h.store.data[key], undefined);
    assert.deepEqual(f.h.bot.messages, []);
    assert.doesNotMatch(JSON.stringify(f.h.logs), /sm_fixture|nosmoking|Empfangen/);
    if (delivered.includes('°')) assert.ok(reply.includes('\\°'), 'Diagnose-KCode wird maskiert');
  }
});

test('Smileyimport prüft echten anwesenden Inhaber, menschlichen Autor und Shutdown', () => {
  for (const role of ['listener','moderator','manager','owner']) {
    const f = setup(), other = f.h.user(700, 'Fremder', role);
    learnSmiley(f, smileyCode, smileyImage, other);
    assert.equal(f.h.store.data[key], undefined, role);
    assert.match(other.messages.at(-1), /Nur Otterchen/);
  }
  for (const change of [f => { f.owner.online = false; }, f => { f.owner.userType = 'bot'; },
      f => { f.h.app.onPrepareShutdown(); }]) {
    const f = setup(); change(f); learnSmiley(f);
    assert.equal(f.h.store.data[key], undefined);
  }
});

test('Nicht aufgelöste Smileys, fremde Bilder, KCode und zusätzliche Nachrichtenteile werden nicht gelernt', () => {
  const f = setup();
  for (const [raw, image] of [
    [smileyCode, smileyCode], [smileyCode, '°>https://example.org/sm.gif<°'],
    [smileyCode, '°>https://knuddels.de.example.org/sm.gif<°'],
    [smileyCode, '°>sm_test.gif|/update<°'], [smileyCode, '°>../sm_test.gif<°'],
    [smileyCode, '°>sm_test.gif?x=1<°'], [smileyCode, '°>sm_test.svg<°'],
    [smileyCode, smileyImage + ' weiterer Text'], [smileyCode, smileyImage + smileyImage],
    ['°>sm_test.gif<°', smileyImage], [smileyCode + ' :(zweiter):', smileyImage]
  ]) {
    learnSmiley(f, raw, image);
    assert.equal(f.h.store.data[key], undefined, image);
    assert.doesNotMatch(f.owner.messages.at(-1), /^Smiley gespeichert/);
  }
  const count = f.owner.messages.length;
  f.h.app.onPrivateMessage({ getAuthor:() => f.owner, getRawText:() => 'Hallo', getText:() => 'Hallo' });
  assert.equal(f.owner.messages.length, count, 'Gewöhnliche Privatnachrichten lösen nichts aus');
  assert.deepEqual(f.h.bot.messages, []);
});

test('Smileyimport ist idempotent, erhält den Zeitplan und bestätigt Speicherfehler nicht als Erfolg', () => {
  const f = setup(); save(f); f.h.advance(minutes(20));
  let writes = 0;
  const write = f.h.store.setObject;
  f.h.store.setObject = (name, value) => { writes++; return write(name, value); };
  learnSmiley(f);
  const before = structuredClone(f.h.store.data[key]);
  learnSmiley(f);
  assert.equal(writes, 1);
  assert.match(f.owner.messages.at(-1), /bereits/);
  f.h.store.setObject = () => { throw Error('private-import-failure'); };
  learnSmiley(f, smileyCode, '°>sm_fixture_changed.gif<°');
  assert.deepEqual(f.h.store.data[key], before);
  assert.match(f.owner.messages.at(-1), /nicht gespeichert/);
  f.h.store.setObject = write;
  f.owner.sendPrivateMessage = () => { throw Error('private-reply-failure'); };
  learnSmiley(f, smileyCode, '°>sm_fixture_changed.gif<°');
  const next = f.h.store.data[key];
  assert.equal(next.smileys[0].image, '°>sm_fixture_changed.gif<°');
  for (const field of ['enabled','interval','texts','cursor','nextAt','revision']) assert.deepEqual(next[field], before[field]);
  assert.doesNotMatch(JSON.stringify(f.h.logs), /private-import-failure|private-reply-failure/);
});

test('Smileyablage ist begrenzt, ersetzt bekannte Kürzel und verwirft beschädigte gespeicherte Zuordnungen', () => {
  const f = setup();
  for (let index = 0; index < 32; index++) learnSmiley(f, ':(test-' + index + '):');
  learnSmiley(f, ':(voll):');
  assert.equal(f.h.store.data[key].smileys.length, 32);
  assert.match(f.owner.messages.at(-1), /bereits 32/);
  learnSmiley(f, ':(test-0):', '°>sm_neu.gif<°');
  assert.equal(f.h.store.data[key].smileys[0].image, '°>sm_neu.gif<°');
  const stored = structuredClone(f.h.store.data[key]);
  for (const invalid of [null, {}, Array(33).fill(stored.smileys[0]),
      [stored.smileys[0], stored.smileys[0]], [{code:smileyCode,image:'°>https://evil.test/x.gif<°'}]]) {
    const state = {...stored, smileys:invalid}, broken = setup(persistence({[key]:state}));
    learnSmiley(broken);
    assert.doesNotMatch(broken.owner.messages.at(-1), /^Smiley gespeichert/);
    assert.deepEqual(broken.h.store.data[key], state);
  }
});

test('Nur einfache Knuddels-Bildtags bleiben erhalten; Befehlslinks und andere Formatierung bleiben Text', () => {
  const f = setup();
  const url = '°>https://apps10.knuddels.biz/kimg/smileys/ft_freetext_happy_y.gif<°';
  const plain = '°>https://evil.test/a.gif<° °>Hallo|/update<°';
  assert.equal(save(f, {texts:[smileyImage + ' ' + url + ' ' + plain]}).ok, true);
  f.h.advance(minutes(20));
  assert.equal(f.h.bot.messages[0], smileyImage + ' ' + url + ' \\°\\>https://evil.test/a.gif\\<\\° \\°\\>Hallo|/update\\<\\°');
});

test('Viele lange Smiley-Bildcodes überschreiten das Versandlimit nicht und verlieren keinen übrigen Text', () => {
  const f = setup(), code = ':(a):';
  learnSmiley(f, code, '°>sm_' + 'a'.repeat(380) + '.gif<°');
  assert.equal(save(f, {texts:[code.repeat(59) + ' Ende']}).ok, true);
  f.h.advance(minutes(20));
  const output = f.h.bot.messages[0];
  assert.ok(output.length < 9500);
  assert.ok(output.endsWith(' Ende'));
  assert.ok(output.includes('°>sm_'));
  assert.ok(output.includes(code), 'Überzählige Ersetzungen behalten das lesbare Kürzel');
});
test('Bot-Texte beginnen ausgeschaltet und bleiben in allen öffentlichen Zuständen privat', () => {
  const f = setup();
  assert.deepEqual(settings(f), { enabled:false, interval:20, texts:['',''], revision:0, nextAt:0 });
  assert.equal(f.h.timers.size, 0);
  assert.equal(save(f).ok, true);
  const listener = f.h.user(502, 'Hörer'), moderator = f.h.user(503, 'Appmanager', 'manager');
  for (const user of [listener, moderator, f.owner]) {
    const radio = user === f.owner ? f.radio : f.h.open(user);
    assert.equal(JSON.stringify(radio.content.htmlFile.pageData).includes('channelTexts'), false);
    assert.equal(f.h.event(user, radio, 'mw:refresh').some(e => e.type === 'mw:channelTexts.state'), false);
    assert.equal(JSON.stringify(f.h.state(user, radio)).includes('Erster Text'), false);
  }
  f.h.advance(minutes(19)); assert.deepEqual(f.h.bot.messages, []);
});
for (const interval of [20,30,40,50]) test('Bot-Texte senden exakt nach '+interval+' Minuten und rotieren ohne leere Ausgabe', () => {
  const f = setup(); assert.equal(save(f,{interval}).ok,true);
  f.h.advance(minutes(interval)-1); assert.deepEqual(f.h.bot.messages,[]);
  f.h.advance(1); assert.deepEqual(f.h.bot.messages,['Erster Text']);
  assert.equal(f.h.timers.size,1);
  f.h.advance(minutes(interval)); f.h.advance(minutes(interval));
  assert.deepEqual(f.h.bot.messages,['Erster Text','Zweiter Text','Erster Text']);
});
test('Änderungen starten den Abstand neu, alte Timer und doppelte Starts erzeugen keine zweite Ausgabe', () => {
  const f=setup(); save(f); const obsolete=[...f.h.timers.values()][0].callback;
  f.h.advance(minutes(19)); save(f,{interval:50,texts:['Neu']}); obsolete();
  f.h.app.onAppStart(); assert.equal([...f.h.timers.values()].filter(task=>task.callback.name!=='reconcile').length,1);
  f.h.advance(minutes(49)); assert.deepEqual(f.h.bot.messages,[]);
  f.h.advance(minutes(1)); assert.deepEqual(f.h.bot.messages,['Neu']);
  save(f,{enabled:false}); assert.equal([...f.h.timers.values()].filter(task=>task.callback.name!=='reconcile').length,0);
  f.h.advance(minutes(500)); assert.deepEqual(f.h.bot.messages,['Neu']);
});
test('Zukünftiger Termin und Rotationszeiger bleiben über Neustart erhalten; überfällige Termine werden nicht nachgeholt', () => {
  const f=setup(); save(f); f.h.advance(minutes(20)); f.h.advance(minutes(5));
  f.h.app.onPrepareShutdown(); assert.equal(f.h.timers.size,0);
  const next=setup(f.h.store), due=next.h.store.data[key].nextAt;
  next.h.advance(Math.max(0,due-next.h.now())-1); assert.deepEqual(next.h.bot.messages,[]);
  next.h.advance(2); assert.deepEqual(next.h.bot.messages,['Zweiter Text']);
  next.h.app.onShutdown(); assert.equal(next.h.timers.size,0);
  const store=persistence({[key]:{...next.h.store.data[key],nextAt:1}}), late=setup(store);
  late.h.advance(minutes(19)); assert.deepEqual(late.h.bot.messages,[]);
  late.h.advance(minutes(1)); assert.equal(late.h.bot.messages.length,1);
  late.h.advance(minutes(500)); assert.equal(late.h.bot.messages.length,2,'Ein Zeitsprung erzeugt eine Ausgabe, keine Nachholserie');
});
test('Beide Shutdown-Hooks stoppen auch einen bereits entnommenen Timer; deaktivierte Einstellungen bleiben nach Neustart aus', () => {
  for(const hook of ['onPrepareShutdown','onShutdown']) {
    const f=setup();save(f);const callback=[...f.h.timers.values()][0].callback;
    f.h.app[hook]();callback();assert.equal(f.h.timers.size,0);assert.deepEqual(f.h.bot.messages,[]);
  }
  const f=setup();save(f,{enabled:false});const restarted=setup(f.h.store);
  restarted.h.advance(minutes(500));assert.deepEqual(restarted.h.bot.messages,[]);
});
test('Speichern wird vor der Ausgabe abgeschlossen; Speicher- und Sendefehler lösen keine sofortige Wiederholung aus', () => {
  const f=setup();save(f);const write=f.h.store.setObject;
  f.h.store.setObject=(name,value)=>{if(name===key)throw Error('secret-storage');return write(name,value);};
  f.h.advance(minutes(20));assert.deepEqual(f.h.bot.messages,[]);assert.equal(f.h.timers.size,1);
  f.h.store.setObject=write;let attempts=0;
  f.h.bot.sendPublicMessage=()=>{attempts++;assert.ok(f.h.store.data[key].nextAt>Date.now());throw Error('secret-send');};
  f.h.advance(minutes(19));assert.equal(attempts,0);
  f.h.advance(minutes(1));assert.equal(attempts,1);
  f.h.advance(1);assert.equal(attempts,1);
  f.h.advance(minutes(20));assert.equal(attempts,2);
  assert.doesNotMatch(JSON.stringify(f.h.logs),/secret-storage|secret-send/);
});
test('Fehlgeschlagene Änderung erhält den bestätigten Zeitplan und meldet keinen Erfolg', () => {
  const f=setup();save(f);const before=structuredClone(f.h.store.data[key]);
  f.h.store.setObject=()=>{throw Error('secret');};
  assert.equal(save(f,{enabled:false}).ok,false);assert.deepEqual(f.h.store.data[key],before);assert.equal(f.h.timers.size,1);
});
test('Nur aktuelle eigene Verwaltung des Channelinhabers darf speichern; alte Revisionen und Wiederholungen bleiben wirkungslos', () => {
  const f=setup(); const data={requestId:'save-once',view:'team',viewRevision:1,expectedRevision:0,enabled:true,interval:20,texts:['Privat']};
  f.h.event(f.owner,f.radio,'mw:channelTexts.save',data);assert.equal(f.h.store.data[key],undefined);
  for(const role of ['listener','manager','moderator']) {
    const user=f.h.user(600+sequence++,role,role),session=f.h.open(user);
    f.h.event(user,session,'mw:channelTexts.save',data);assert.equal(f.h.store.data[key],undefined);
    f.h.event(user,f.team,'mw:channelTexts.save',data);assert.equal(f.h.store.data[key],undefined);
  }
  f.h.event(f.owner,f.team,'mw:channelTexts.save',data);const before=structuredClone(f.h.store.data[key]);
  f.h.event(f.owner,f.team,'mw:channelTexts.save',data);assert.deepEqual(f.h.store.data[key],before);
  f.h.event(f.owner,f.team,'mw:channelTexts.save',{...data,expectedRevision:1,viewRevision:0});assert.deepEqual(f.h.store.data[key],before);
  f.owner.role='listener';f.h.event(f.owner,f.team,'mw:refresh');
  assert.equal(f.team.events.findLast(e=>e.type==='mw:channelTexts.state')?.data,null);
  f.h.event(f.owner,f.team,'mw:channelTexts.save',{...data,expectedRevision:1});assert.deepEqual(f.h.store.data[key],before);
  f.team.remove();f.h.event(f.owner,f.team,'mw:channelTexts.save',data);assert.deepEqual(f.h.store.data[key],before);
});
test('Validierung hält Intervalle, Anzahl, Textlänge, Steuerzeichen und Klartextausgabe ein', () => {
  const f=setup();
  for(const changes of [{interval:10},{interval:25},{interval:'20'},{enabled:1},{texts:[]},{texts:Array(7).fill('x')},
      {texts:['x'.repeat(301)]},{texts:[{}]},{texts:['x\u0000']},{texts:[' ','\n']}]) {
    assert.equal(save(f,changes).ok,false,JSON.stringify(changes));assert.equal(f.h.store.data[key],undefined);
  }
  assert.equal(save(f,{texts:['  °>Hallo<° _Test_\\  ','Text zwei\r\nmit Zeile']}).ok,true);
  f.h.advance(minutes(20));assert.equal(f.h.bot.messages[0],'\\°\\>Hallo\\<\\° \\_Test\\_\\\\');
  const maximal=Array(6).fill('"'.repeat(300));assert.equal(save(f,{texts:maximal}).ok,true);
  assert.ok(JSON.stringify(settings(f)).length<4100);
  const draft={channelTexts:{selected:'texts',dirty:true,revision:2,form:{enabled:true,interval:20,texts:maximal}}};
  f.h.event(f.owner,f.team,'mw:overlay.dismiss',{state:draft,revision:1});
  assert.equal(f.team.removed,true);f.h.event(f.owner,f.radio,'mw:openRadioTeam');
  const reopened=f.owner.sessions.at(-1);assert.deepEqual(reopened.content.htmlFile.pageData.overlayState,draft);
  assert.ok(JSON.stringify(reopened.content.htmlFile.pageData).length<10000);
});
test('Maximaler Verwaltungsentwurf bleibt auch mit voller Wunschregie, Thema und Team-Entwurf unter dem HTMLFile-Limit', () => {
  const f=setup();f.h.event(f.owner,f.radio,'mw:onAir',{});f.team.remove();
  for(let i=0;i<12;i++) {
    const user=i<3?f.owner:f.h.user(800+i,'Hörer '+i), session=i<3?f.radio:f.h.open(user);
    f.h.event(user,session,'mw:wish.submit',{text:'"'.repeat(300),submissionId:'payload-'+i});f.h.advance(121000);
  }
  f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'"'.repeat(80),previousTopic:''});
  f.h.event(f.owner,f.radio,'mw:openRadioTeam');f.team=f.owner.sessions.at(-1);
  const draft={team:{nick:'"'.repeat(50),page:0},channelTexts:{selected:'texts',dirty:true,revision:0,
    form:{enabled:true,interval:20,texts:Array(6).fill('"'.repeat(300))}}};
  f.h.event(f.owner,f.team,'mw:overlay.dismiss',{state:draft,revision:1});
  f.h.event(f.owner,f.radio,'mw:openRadioTeam');const reopened=f.owner.sessions.at(-1);
  assert.equal(reopened.content.htmlFile.pageData.view,'team');
  assert.deepEqual(reopened.content.htmlFile.pageData.overlayState,draft);
  assert.deepEqual(reopened.content.htmlFile.pageData.queueWindow,[],'Verwaltung benötigt keine duplizierte Studio-Wunschregie');
  assert.ok(JSON.stringify(reopened.content.htmlFile.pageData).length<8500);
  f.h.event(f.owner,f.radio,'mw:onAir',{});f.h.event(f.owner,f.radio,'mw:setTopic',{topic:'"'.repeat(80)});
  const state=f.h.state(f.owner,reopened);assert.deepEqual(state.queueWindow,[]);assert.equal(state.topic,'"'.repeat(80));
  assert.ok(f.h.state(f.owner,f.radio).queueWindow.length>0,'Radio-/Studio-Daten bleiben erhalten');
});

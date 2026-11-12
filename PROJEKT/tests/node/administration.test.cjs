const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
function overlay(user) { return user.sessions.find(session => session.content.viewMode === 'Overlay'); }

test('/mw bündelt die Befehle ohne alte Namen oder manuellen Radioaufruf', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner');h.app.onUserJoined(owner);const radio=owner.sessions[0];
  assert.deepEqual(Object.keys(h.app.chatCommands).sort(),['lauftext','mw','settopic','update']);
  h.app.chatCommands.mw(owner,'');assert.match(owner.messages.at(-1),/\/mw admin/);assert.doesNotMatch(owner.messages.at(-1),/\/mw homepage|\/mw verbindung/);
  for(const value of ['hilfe','radio','verwaltung','admin zusätzlich','homepage unbekannt','verbindung unbekannt']) h.app.chatCommands.mw(owner,value);
  assert.equal(owner.sessions.length,1);assert.equal(owner.sessions[0],radio);assert.equal(radio.removed,false);
});

test('/mw zeigt nur passende Hilfe und verändert weder Verbindung noch Daten', () => {
  for(const role of ['listener','manager','developer','owner']) {
    const h=createHarness(),user=h.user(1,role==='owner'?'Otterchen':'Hörer',role);h.app.onUserJoined(user);
    const before=JSON.stringify(h.store.data),count=user.sessions.length;
    h.app.chatCommands.mw(user,'');const help=user.messages.at(-1);
    if(role==='owner') {assert.match(help,/\/mw admin/);assert.match(help,/Verbindung/);assert.doesNotMatch(help,/\/mw homepage|\/mw verbindung/);} else {assert.doesNotMatch(help,/\/mw admin|\/mw verbindung/);}
    h.app.chatCommands.mw(user,'homepage hilfe');h.app.chatCommands.mw(user,'verbindung hilfe');
    assert.equal(user.sessions.length,count);assert.equal(JSON.stringify(h.store.data),before);
  }
});

test('/mw verbindung samt Unterbefehlen ist entfernt und führt keine Fachaktion aus', () => {
  for (const role of ['listener','moderator','manager','developer','owner']) {
    const h=createHarness(),user=h.user(1,role==='owner'?'Otterchen':'Hörer',role);h.app.onUserJoined(user);
    const radio=user.sessions[0],before=JSON.stringify(h.store.data),timers=[...h.timers.keys()];
    for (const argument of ['', 'hilfe', 'einrichten', 'status', 'pruefen', 'http-pruefen', 'auth-pruefen', 'aktivieren', 'einrichten privater-schluessel']) {
      h.app.chatCommands.mw(user,'  VeRbInDuNg  '+argument);
      assert.match(user.messages.at(-1),/Diesen Aufruf gibt es nicht/);
      assert.doesNotMatch(user.messages.at(-1),/privater-schluessel|\/mw verbindung/);
      assert.equal(user.sessions.length,1);assert.equal(user.sessions[0],radio);assert.equal(radio.removed,false);
      assert.equal(JSON.stringify(h.store.data),before);assert.deepEqual([...h.timers.keys()],timers);
    }
    assert.equal(h.bot.messages.length,1,'Nur die bestehende Beitrittsbegrüßung');
  }
});
test('Kompakte Overlays verdecken weniger Chat und behalten getrennte native Radio-Sitzungen', () => {
  for(const [action,width,height] of [['mw:openWishes',480,340],['mw:openStudio',640,580],['mw:openRadioTeam',500,560],['mw:openSchedule',640,320]]) {
    const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
    h.event(owner,radio,'mw:setRequests',{enabled:true});h.event(owner,radio,action);
    const current=overlay(owner);assert.ok(current,action);
    assert.deepEqual([current.content.width,current.content.height],[width,height],action);
    assert.equal(radio.removed,false);assert.equal(owner.sessions.length,2);
  }
});
test('/mw admin öffnet die Verwaltung für Otterchen und erhält die bestehende Radio-Sitzung', () => {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), radio = h.open(owner);
  h.app.chatCommands.mw(owner, 'admin');
  assert.equal(overlay(owner).content.htmlFile.pageData.view, 'team');
  assert.equal(overlay(owner).content.width, 500); assert.equal(overlay(owner).content.height, 560);
  assert.equal(radio.removed, false); assert.equal(owner.sessions.length, 2); assert.equal(h.bot.messages.length, 0);
});
test('Verwaltungsbefehl braucht authentifizierten Otterchen, Inhaberrecht und Channelanwesenheit', () => {
  for (const [nick,role,online] of [['Otterchen','listener',true],['Otterchen','manager',true],['Otterchen','moderator',true],['Anderer Inhaber','owner',true],['Otterchen','owner',false]]) {
    const h = createHarness(), person = h.user(1,nick,role); person.online = online;
    h.app.chatCommands.mw(person,'admin');
    assert.equal(person.sessions.length,0); assert.equal(person.messages.length,1);
    assert.match(person.messages[0],/Channel|Otterchen/); assert.equal(h.bot.messages.length,0);
    if(online){const radio=h.open(person);assert.equal(h.state(person,radio).user.showModerationButton,false,'Keine automatische Freigabe allein durch Nick oder fremde Rolle');}
  }
});
test('Verwaltungsbefehl öffnet fehlende Radioleiste, prüft Syntax und Shutdown und erhält Entwürfe beim Wechsel', () => {
  const h = createHarness(), owner = h.user(1,'Otterchen','owner');
  for (const params of ['Team', 'verwaltung', '  vErWaLtUnG  ', 'Verwaltung zusätzlich', 'admin zusätzlich', 'administrator']) { h.app.chatCommands.mw(owner,params); assert.equal(owner.sessions.length,0); assert.match(owner.messages.at(-1),/\/mw/); }
  h.app.chatCommands.mw(owner,'  AdMiN  '); const first=overlay(owner),radio=owner.sessions.find(s=>s.content.viewMode==='Headerbar');
  h.app.chatCommands.mw(owner,'admin'); assert.equal(overlay(owner),first);
  h.finishOverlay(owner,first,{team:{nick:'Erhaltener Entwurf'}},false,1);
  const current=overlay(owner); assert.notEqual(current,first); assert.equal(current.content.htmlFile.pageData.overlayState.team.nick,'Erhaltener Entwurf'); assert.equal(radio.removed,false);
  h.app.onPrepareShutdown(); h.app.chatCommands.mw(owner,'admin'); assert.equal(overlay(owner),current); assert.match(owner.messages.at(-1),/neu gestartet/);
});
test('Bestehende UI-Öffnung umgeht weder Otterchen-Prüfung noch erneute Rechteprüfung beim Wechsel', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
  h.event(owner,radio,'mw:openStudio'); const studio=overlay(owner);
  h.app.chatCommands.mw(owner,'admin'); owner.nick='Fremder Inhaber'; h.finishOverlay(owner,studio);
  assert.equal(overlay(owner),studio); assert.equal(studio.removed,false);
  h.event(owner,radio,'mw:openRadioTeam'); assert.equal(overlay(owner),studio); assert.equal(radio.events.find(e=>e.type==='mw:result').data.ok,false);
});


test('Otterchen als Inhaber hat automatisch Zugriff; andere Nutzer benötigen ihren Radio-Team-Eintrag', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
  assert.equal(h.state(owner,radio).user.canModerate,true);
  assert.equal(h.state(owner,radio).user.showModerationButton,true,'Echter Inhaber Otterchen braucht keinen Listeneintrag');
  assert.deepEqual(h.store.data['mischwerk.state.v1']?.radioModeratorUserIds||[],[],'Keine künstliche Eintragung für den Inhaber');
  for(const [index,role] of ['listener','moderator','manager','developer'].entries()) {
    const person=h.user(10+index,role,role),session=h.open(person);
    assert.equal(h.state(person,session).user.showModerationButton,false,role);
  }
  const dj=h.user(30,'Eingetragener DJ'),session=h.open(dj);
  h.event(owner,radio,'mw:addRadioModerator',{nick:dj.nick});
  assert.equal(h.state(dj,session).user.showModerationButton,true);
  dj.nick='Umbenannter DJ';assert.equal(h.state(dj,session).user.showModerationButton,true,'User-ID statt Nickvergleich');
  const restarted=createHarness(h.store),same=restarted.user(30,dj.nick),sameSession=restarted.open(same);
  assert.equal(restarted.state(same,sameSession).user.showModerationButton,true,'Gespeicherte Ernennung nach Neustart');
  h.event(owner,radio,'mw:removeRadioModerator',{userId:dj.id});
  assert.equal(h.state(dj,session).user.showModerationButton,false);
});
test('Otterchens automatische Rechte und aktive Moderation bleiben beim Entfernen eines optionalen eigenen Listeneintrags erhalten', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
  h.event(owner,radio,'mw:onAir', {});const key=h.state(owner,radio).moderator.sessionKey;
  h.event(owner,radio,'mw:addRadioModerator',{nick:owner.nick});
  assert.equal(h.state(owner,radio).user.showModerationButton,true);
  h.event(owner,radio,'mw:removeRadioModerator',{userId:owner.id});
  const state=h.state(owner,radio);
  assert.equal(state.user.showModerationButton,true);assert.equal(state.user.canModerate,true);assert.equal(state.user.canManageRadioModerators,true);
  assert.equal(state.user.isOnAir,true);assert.equal(state.moderator.sessionKey,key);
  const again=createHarness(h.store),same=again.user(1,'Otterchen','owner'),session=again.open(same);
  assert.equal(again.state(same,session).user.showModerationButton,true,'Automatischer Zugriff auch nach Neustart ohne Eintrag');
  same.role='listener';assert.equal(again.state(same,session).user.showModerationButton,false,'Nick allein ohne Inhaberrecht genügt nicht');
  assert.equal(again.state(same,session).user.canManageRadioModerators,false);
});

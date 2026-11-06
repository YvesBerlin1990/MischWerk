const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
function overlay(user) { return user.sessions.find(session => session.content.viewMode === 'Overlay'); }
test('/MW Verwaltung öffnet die Verwaltung für Otterchen und erhält die bestehende Radio-Sitzung', () => {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), radio = h.open(owner);
  h.app.chatCommands.mw(owner, 'Verwaltung');
  assert.equal(overlay(owner).content.htmlFile.pageData.view, 'team');
  assert.equal(overlay(owner).content.width, 560); assert.equal(overlay(owner).content.height, 630);
  assert.equal(radio.removed, false); assert.equal(owner.sessions.length, 2); assert.equal(h.bot.messages.length, 0);
});
test('Verwaltungsbefehl braucht authentifizierten Otterchen, Inhaberrecht und Channelanwesenheit', () => {
  for (const [nick,role,online] of [['Otterchen','listener',true],['Otterchen','manager',true],['Otterchen','moderator',true],['Anderer Inhaber','owner',true],['Otterchen','owner',false]]) {
    const h = createHarness(), person = h.user(1,nick,role); person.online = online;
    h.app.chatCommands.mw(person,'Verwaltung');
    assert.equal(person.sessions.length,0); assert.equal(person.messages.length,1);
    assert.match(person.messages[0],/Channel|Otterchen/); assert.equal(h.bot.messages.length,0);
    if(online){const radio=h.open(person);assert.equal(h.state(person,radio).user.showModerationButton,false,'Keine automatische Freigabe allein durch Nick oder fremde Rolle');}
  }
});
test('Verwaltungsbefehl öffnet fehlende Radioleiste, prüft Syntax und Shutdown und erhält Entwürfe beim Wechsel', () => {
  const h = createHarness(), owner = h.user(1,'Otterchen','owner');
  for (const params of ['', 'Team', 'Verwaltung zusätzlich']) { h.app.chatCommands.mw(owner,params); assert.equal(owner.sessions.length,0); assert.match(owner.messages.at(-1),/\/MW Verwaltung/); }
  h.app.chatCommands.mw(owner,'  vErWaLtUnG  '); const first=overlay(owner),radio=owner.sessions.find(s=>s.content.viewMode==='Headerbar');
  h.app.chatCommands.mw(owner,'Verwaltung'); assert.equal(overlay(owner),first);
  h.finishOverlay(owner,first,{team:{nick:'Erhaltener Entwurf'}},false,1);
  const current=overlay(owner); assert.notEqual(current,first); assert.equal(current.content.htmlFile.pageData.overlayState.team.nick,'Erhaltener Entwurf'); assert.equal(radio.removed,false);
  h.app.onPrepareShutdown(); h.app.chatCommands.mw(owner,'Verwaltung'); assert.equal(overlay(owner),current); assert.match(owner.messages.at(-1),/neu gestartet/);
});
test('Bestehende UI-Öffnung umgeht weder Otterchen-Prüfung noch erneute Rechteprüfung beim Wechsel', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
  h.event(owner,radio,'mw:openStudio'); const studio=overlay(owner);
  h.app.chatCommands.mw(owner,'Verwaltung'); owner.nick='Fremder Inhaber'; h.finishOverlay(owner,studio);
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
  h.event(owner,radio,'mw:onAir');const key=h.state(owner,radio).moderator.sessionKey;
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

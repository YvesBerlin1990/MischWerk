const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
function overlay(user) { return user.sessions.find(session => session.content.viewMode === 'Overlay'); }

test('/mw bündelt die Befehle ohne alte Namen oder manuellen Radioaufruf', () => {
  const h=createHarness(),owner=h.user(1,'Otterchen','owner');h.app.onUserJoined(owner);const radio=owner.sessions[0];
  assert.deepEqual(Object.keys(h.app.chatCommands).sort(),['mw','settopic','update']);
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
  for(const [action,width,height] of [['mw:openWishes',480,340],['mw:openRadioTeam',500,560],['mw:openSchedule',640,320]]) {
    const f=require('../fixtures/relay-v2.cjs').setup();f.finish();const h=f.h,owner=h.user(1,'Otterchen','owner'),radio=h.open(owner);
    h.event(owner,radio,action);
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

test('Die Designauswahl wird im Channel verteilt und gemeinsam mit den Anzeigeoptionen erhalten', () => {
  const h = createHarness(), owner = h.user(1, 'Otterchen', 'owner'), listener = h.user(2, 'Hörer');
  const ownerRadio = h.open(owner), listenerRadio = h.open(listener);
  h.app.chatCommands.mw(owner, 'admin');
  const team = overlay(owner);
  const request = {view:'team', viewRevision:team.viewRevision, expectedRevision:0, theme:'xmas'};
  h.event(owner, ownerRadio, 'mw:display.theme', {...request, requestId:'falsche-sitzung'});
  assert.equal(h.state(listener, listenerRadio).theme, 'normal');

  const result = h.event(owner, team, 'mw:display.theme', {...request, requestId:'xmas'});
  assert.equal(result.find(row => row.type === 'mw:result').data.ok, true);
  assert.equal(listenerRadio.events.findLast(row => row.type === 'mw:state').data.theme, 'xmas');
  const restarted = createHarness(h.store), returning = restarted.user(2, 'Hörer');
  assert.equal(restarted.state(returning, restarted.open(returning)).theme, 'xmas');
  h.event(owner, team, 'mw:display.save', {...request, theme:undefined, requestId:'zeichen', expectedRevision:1,
    teamSignsEnabled:false, announcementsEnabled:true});
  assert.equal(h.state(owner, team).displaySettings.teamSignsEnabled, false);
  assert.equal(h.state(listener, listenerRadio).theme, 'xmas');

  h.event(owner, team, 'mw:display.theme', {...request, theme:'normal', requestId:'normal', expectedRevision:2});
  assert.equal(h.state(owner, team).displaySettings.teamSignsEnabled, false);
  assert.equal(h.state(listener, listenerRadio).theme, 'normal');
});

test('Polaroid erhält die gesamte Konsole mit Verbindung, aber kein Inhaber-, Themen- oder Wartungsrecht',()=>{
 const posts=[],h=createHarness(undefined,{serverMethods:{getExternalServerAccess:()=>({canAccessURL:()=>true,postURL:(url,data)=>posts.push({url,data})})}}),person=h.user(813,'Polaroid'),radio=h.open(person);h.app.chatCommands.mw(person,'admin');const session=overlay(person);
 assert.ok(session);assert.equal(h.runtime.canAdminister(person),false);assert.equal(h.runtime.canUseAdministration(person),true);
 assert.equal(h.state(person,session).user.canAdminister,true);
 h.event(person,session,'mw:androidSettings.status',{});assert.equal(session.events.at(-1).data.ok,true);
 h.event(person,session,'mw:androidSettings.save',{requestId:'polaroid-save',revision:0,syncSecret:'s'.repeat(64)});assert.equal(session.events.at(-1).data.ok,true);
 h.event(person,session,'mw:androidSettings.activate',{requestId:'polaroid-on',revision:1});assert.equal(session.events.at(-1).data.ok,true);assert.equal(posts.length,1);
 h.event(person,session,'mw:androidSettings.deactivate',{requestId:'polaroid-off',revision:2});assert.equal(session.events.at(-1).data.ok,true);
 h.event(person,session,'mw:channelTexts.save',{requestId:'polaroid-text',view:'team',viewRevision:1,expectedRevision:0,enabled:false,interval:20,texts:['Ein Bot-Text']});assert.equal(session.events.findLast(row=>row.type==='mw:result').data.ok,true);
 h.event(person,session,'mw:setTicker',{requestId:'polaroid-ticker',view:'team',viewRevision:1,expectedTickerRevision:0,text:'Lauftext',enabled:true,speed:48,direction:'left'});assert.equal(session.events.findLast(row=>row.type==='mw:result').data.ok,true);
 h.app.chatCommands.settopic(person,'Kein neuer Themenwert');assert.match(person.messages.at(-1),/Nur Otterchen/);
 h.app.chatCommands.update(person,'');assert.equal(h.updateCalls.length,0);assert.equal(radio.removed,false);
 person.online=false;h.event(person,session,'mw:androidSettings.save',{requestId:'offline',revision:3,syncSecret:'x'.repeat(64)});
 assert.equal(h.store.data['mischwerk.android.private.v1'].syncSecret,'s'.repeat(64));
});

test('Konsolenfreigabe vertraut weder Clientnamen noch fremden oder geschlossenen Sitzungen',()=>{
 const h=createHarness(),person=h.user(71,'Hörer'),radio=h.open(person);h.event(person,radio,'mw:openRadioTeam',{nick:'Polaroid',canAdminister:true});assert.equal(overlay(person),undefined);
 for(const online of [true,false]){const h=createHarness(),p=h.user(72,'Polaroid');p.online=online;p.userType='bot';h.app.chatCommands.mw(p,'admin');assert.equal(overlay(p),undefined);}
 const p=h.user(73,'Polaroid');h.open(p);h.app.chatCommands.mw(p,'admin');const team=overlay(p);team.nativeClose(false);
 const before=JSON.stringify(h.store.data);h.event(p,team,'mw:display.save',{requestId:'closed',view:'team',viewRevision:1,expectedRevision:0,teamSignsEnabled:false,announcementsEnabled:true});assert.equal(JSON.stringify(h.store.data),before);
});
test('Verwaltungsbefehl braucht authentifizierten Otterchen, Inhaberrecht und Channelanwesenheit', () => {
  for (const [nick,role,online] of [['Otterchen','listener',true],['Otterchen','manager',true],['Otterchen','moderator',true],['Anderer Inhaber','owner',true],['Otterchen','owner',false]]) {
    const h = createHarness(), person = h.user(1,nick,role); person.online = online;
    h.app.chatCommands.mw(person,'admin');
    assert.equal(person.sessions.length,0); assert.equal(person.messages.length,1);
    assert.match(person.messages[0],/Channel|Otterchen/); assert.equal(h.bot.messages.length,0);
    if(online){const radio=h.open(person);assert.equal('showModerationButton' in h.state(person,radio).user,false,'Keine Moderationsfelder im Zustand');}
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

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../tools/knuddels-mock.cjs');
const wish = { artist: 'Lieblingsband', title: 'Unser Song', message: 'Für den Channel' };
const lastResult = events => events.findLast(event => event.type === 'mw:result')?.data;
function fixture() {
  const h = createHarness();
  const listener = h.user(1, 'Musikfreund'); const owner = h.user(2, 'Otterchen', 'owner');
  return { h, listener, owner, ls: h.open(listener), os: h.open(owner) };
}
test('Rechte kommen vom User, nicht vom Nick oder den Eventdaten', () => {
  const { h, listener, ls } = fixture(); listener.nick = 'Otterchen';
  for (const type of ['mw:setRequests', 'mw:setTopic', 'mw:onAir', 'mw:offAir', 'mw:resolveRequest']) {
    const result = lastResult(h.event(listener, ls, type, { enabled: false, id: 1, canModerate: true, userId: 2 }));
    assert.equal(result.ok, false);
  }
  assert.equal(h.state(listener, ls).requestsEnabled, true);
  assert.equal(h.state(listener, ls).user.canModerate, false);
});
test('Session muss zum authentifizierten Nutzer gehören; geschlossene Sessions werden ignoriert', () => {
  const { h, listener, owner, ls } = fixture();
  assert.deepEqual(h.event(owner, ls, 'mw:setRequests', { enabled: false }), []);
  h.app.onEventReceived(listener, 'mw:request', wish, null);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
});
test('Wunschbox kann geschlossen werden; Backend weist Wünsche dann ab', () => {
  const { h, listener, owner, ls, os } = fixture();
  assert.equal(lastResult(h.event(owner, os, 'mw:setRequests', { enabled: false })).ok, true);
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', wish)).ok, false);
  h.event(owner, os, 'mw:setRequests', { enabled: true });
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', wish)).ok, true);
});
test('Channel-Moderator steuert Wunschbox und persistentes Sendungsthema für alle Hörer', () => {
  const {h,listener,owner,ls,os}=fixture();
  const mod=h.user(4,'StudioMod','moderator'),ms=h.open(mod);
  assert.equal(h.state(listener,ls).topic,'');
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'  80er\n und 90er  '})).ok,true);
  assert.equal(h.state(listener,ls).topic,'80er und 90er');
  assert.equal(h.state(owner,os).topic,'80er und 90er');
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:false})).ok,true);
  assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:'Mein Wunsch'})).ok,false);
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true})).ok,true);
  assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:'Mein Wunsch'})).ok,true);
  const restarted=createHarness(h.store),ru=restarted.user(9,'Hoerer'),rs=restarted.open(ru);
  assert.equal(restarted.state(ru,rs).topic,'80er und 90er');
  mod.role='listener';
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Unerlaubt'})).ok,false);
  assert.equal(h.state(listener,ls).topic,'80er und 90er');
  assert.equal(lastResult(h.event(owner,os,'mw:setTopic',{topic:''})).ok,true);
  assert.equal(h.state(listener,ls).topic,'');
});

test('Thema validiert Text und Länge; Speicherfehler und alte Daten bewahren den Zustand', () => {
  const {h,listener,owner,ls,os}=fixture();
  h.event(owner,os,'mw:setTopic',{topic:'Rock & Pop'});
  for(const topic of [null,{},42,'A'.repeat(81)]){
    assert.equal(lastResult(h.event(owner,os,'mw:setTopic',{topic})).ok,false);
    assert.equal(h.state(listener,ls).topic,'Rock & Pop');
  }
  const old=h.store.data['mischwerk.state.v1'];
  delete old.topic;
  const legacy=createHarness(h.store),lu=legacy.user(8,'Altbestand','owner'),ss=legacy.open(lu);
  assert.equal(legacy.state(lu,ss).topic,'');
  assert.equal(legacy.state(lu,ss).requestsEnabled,true);
  const saved=h.store.setObject;
  h.store.setObject=()=>{throw new Error('disk full');};
  const rejected=lastResult(h.event(owner,os,'mw:setTopic',{topic:'Neues Thema'}));
  h.store.setObject=saved;
  assert.equal(rejected.ok,false);
  assert.equal(h.state(listener,ls).topic,'Rock & Pop');
});

test('Mehr als zwei Wünsche dürfen ohne Wartezeit direkt nacheinander gesendet werden', () => {
  const { h, listener, ls } = fixture();
  for(let i=0;i<4;i++){assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:'Wunsch '+i,requestId:'direkt-'+i})).ok,true);}
  assert.equal(h.state(listener,ls).myTotal,4);
});
test('Private Grüße und Nutzer-IDs gehen nicht an andere Hörer; Moderation erhält die Queue', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:request', { ...wish, nick: 'Fälschung' });
  const stranger = h.user(3, 'Zuhörer'); const ss = h.open(stranger);
  assert.equal(h.state(stranger, ss).queue.length, 0); assert.equal(h.state(stranger, ss).myRequests.length, 0);
  const queue = h.state(owner, os).queue;
  assert.equal(queue[0].nick, 'Musikfreund'); assert.equal(queue[0].text, wish.artist + ' – ' + wish.title + ' · ' + wish.message);
  assert.equal('userId' in queue[0], false);
});
test('Moderatorrechte werden bei jeder Aktion und beim Lesen erneut geprüft', () => {
  const { h, listener, ls } = fixture();
  listener.role = 'moderator'; assert.equal(h.state(listener, ls).user.canModerate, true);
  listener.role = 'listener';
  assert.equal(lastResult(h.event(listener, ls, 'mw:setRequests', { enabled: false })).ok, false);
  assert.equal(h.state(listener, ls).queue.length, 0);
});
test('Ungültige Texte und nichtboolesche Schalter werden verworfen', () => {
  const { h, listener, owner, ls, os } = fixture();
  for (const data of [{ artist: '', title: 'X' }, { artist: 'a'.repeat(81), title: 'X' }, { artist: {}, title: 'X' }]) {
    assert.equal(lastResult(h.event(listener, ls, 'mw:request', data)).ok, false);
  }
  assert.equal(lastResult(h.event(owner, os, 'mw:setRequests', { enabled: 'false' })).ok, false);
});
test('Neustart und Zeitablauf bewahren Wünsche und Wunschbox-Status', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:request', wish); h.event(owner, os, 'mw:setRequests', { enabled: false });
  const restarted = createHarness(h.store); const ro = restarted.user(2, 'Otterchen', 'owner'); const rs = restarted.open(ro);
  assert.equal(restarted.state(ro, rs).queue.length, 1); assert.equal(restarted.state(ro, rs).requestsEnabled, false);
  restarted.advance(48 * 3600000 + 1); assert.equal(restarted.state(ro, rs).queue.length, 1);
});
test('On-Air nutzt echten Nick; Fremd-Abmeldung nur durch Besitzer; Anmeldung läuft ab', () => {
  const { h, listener, owner, ls, os } = fixture(); listener.role = 'moderator';
  h.event(listener, ls, 'mw:onAir', { nick: 'Fälschung' });
  assert.equal(h.state(owner, os).moderator.nick, listener.nick);
  const other = h.user(4, 'AndereMod', 'moderator'); const ss = h.open(other);
  assert.equal(lastResult(h.event(other, ss, 'mw:offAir')).ok, false);
  assert.equal(lastResult(h.event(owner, os, 'mw:offAir')).ok, true);
  h.event(listener, ls, 'mw:onAir'); h.advance(6 * 3600000 + 1);
  assert.equal(h.state(owner, os).moderator, null);
});

test('ON AIR endet beim Channel-Verlassen oder Rechteverlust und behält Wünsche und Thema',()=>{
  const {h,listener,owner,ls,os}=fixture();
  const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  h.event(listener,ls,'mw:request',{text:'Band – Song'});h.event(owner,os,'mw:setTopic',{topic:'Rock'});
  h.event(mod,ms,'mw:onAir');
  h.app.onUserLeft(mod);
  assert.equal(os.events.findLast(e=>e.type==='mw:state').data.moderator,null,'Andere Ansichten sofort aktualisieren');
  assert.equal(h.state(owner,os).moderator,null);
  const again=h.open(mod);h.event(mod,again,'mw:onAir');mod.role='listener';
  const state=h.state(owner,os);
  assert.equal(state.moderator,null);assert.equal(state.queueTotal,1);assert.equal(state.topic,'Rock');
  mod.role='moderator';h.event(mod,again,'mw:onAir');mod.online=false;
  assert.equal(h.state(owner,os).moderator,null,'Auch verpassten Leave-Hook beim nächsten Lesen erkennen');
});

test('Studio-Rechte, bewusste Verlängerung und veraltete Abmeldungen folgen der echten Moderationssitzung',()=>{
  const {h,listener,owner,os}=fixture();
  const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod),other=h.user(10,'ZweiterMod','moderator'),ss=h.open(other);
  assert.equal(h.state(owner,os).user.canEndModeration,false);
  h.event(mod,ms,'mw:onAir',{expectedModerator:null});
  let state=h.state(mod,ms),key=state.moderator.sessionKey,expires=state.moderator.expiresAt;
  assert.equal(state.user.isOnAir,true);assert.equal(state.user.canEndModeration,true);
  assert.equal(h.state(other,ss).user.canEndModeration,false);assert.equal(h.state(owner,os).user.canEndModeration,true);
  assert.equal(h.state(listener,h.open(listener)).user.canEndModeration,false);
  assert.equal(lastResult(h.event(other,ss,'mw:offAir',{canEndModeration:true})).ok,false);
  h.advance(60000);h.event(mod,ms,'mw:onAir',{expectedModerator:key});
  state=h.state(mod,ms);assert.ok(state.moderator.expiresAt>expires);assert.notEqual(state.moderator.sessionKey,key);
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:key})).ok,false);
  key=state.moderator.sessionKey;
  h.event(other,ss,'mw:onAir',{expectedModerator:key});
  assert.equal(lastResult(h.event(mod,ms,'mw:onAir',{expectedModerator:key})).ok,false,'Veraltete Übernahme nicht anwenden');
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:key})).ok,false,'Alte Abmeldung beendet keine neue Sendung');
  assert.equal(h.state(owner,os).moderator.nick,'ZweiterMod');
  const store=h.store.setObject;h.store.setObject=()=>{throw new Error('disk full');};
  assert.equal(lastResult(h.event(owner,os,'mw:offAir',{expectedModerator:h.state(owner,os).moderator.sessionKey})).ok,false);
  h.store.setObject=store;assert.equal(h.state(owner,os).moderator.nick,'ZweiterMod');
});

test('Speicherfehler beim Verlassen lässt keine unbestätigte ON-AIR-Anzeige stehen oder beim Wiederbeitritt aufleben',()=>{
  const {h,owner,os}=fixture();const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  h.event(mod,ms,'mw:onAir');
  const save=h.store.setObject;h.store.setObject=()=>{throw new Error('disk full');};
  h.app.onUserLeft(mod);
  assert.equal(os.events.findLast(e=>e.type==='mw:state').data.moderator,null,'Anzeige auch bei fehlgeschlagener Speicherung sofort aus');
  assert.equal(h.state(owner,os).moderator,null);
  h.store.setObject=save;
  h.open(mod);assert.equal(h.state(owner,os).moderator,null,'Wiederbeitritt erfordert neue Anmeldung');
});

test('Gleichzeitige Themen- und Wunschbox-Änderungen überschreiben keinen neueren fachlichen Stand',()=>{
  const {h,owner,os}=fixture();const mod=h.user(9,'Sendemod','moderator'),ms=h.open(mod);
  h.event(owner,os,'mw:setTopic',{topic:'Rock',previousTopic:''});
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Jazz',previousTopic:''})).ok,false);
  assert.equal(h.state(owner,os).topic,'Rock');
  h.event(owner,os,'mw:onAir'); // Andere Zustandsrevision sperrt eine gültige Themenänderung nicht.
  assert.equal(lastResult(h.event(mod,ms,'mw:setTopic',{topic:'Jazz',previousTopic:'Rock'})).ok,true);
  h.event(owner,os,'mw:setRequests',{enabled:false,previousEnabled:true});
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true,previousEnabled:true})).ok,false);
  assert.equal(h.state(owner,os).requestsEnabled,false);
  assert.equal(lastResult(h.event(mod,ms,'mw:setRequests',{enabled:true,previousEnabled:false})).ok,true);
});

test('Parallele Bearbeitung hält den angezeigten Wunsch und quittiert weiterhin die richtige ID',()=>{
  const {h,listener,owner,ls,os}=fixture();
  for(const text of ['A','B','C','D'])h.event(listener,ls,'mw:request',{text});
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Popup');
  const other=h.user(9,'ZweiterMod','moderator'),ss=h.open(other);h.event(other,ss,'mw:openStudio');
  const second=other.sessions.find(s=>s.content.viewMode==='Popup');
  const item=h.state(owner,studio,1).queue[0],first=h.state(other,second).queue[0];
  h.event(other,second,'mw:resolveRequest',{id:first.id,outcome:'done'});
  let pushed=studio.events.findLast(e=>e.type==='mw:state').data;
  assert.equal(pushed.queue[0].id,item.id);assert.equal(pushed.page,0);
  h.event(owner,studio,'mw:refresh',{});assert.equal(studio.events.findLast(e=>e.type==='mw:state').data.queue[0].id,item.id);
  h.event(owner,studio,'mw:ackRequest',{id:item.id});
  assert.equal(h.state(listener,ls).myRequests[0].delivery.nick,'Otterchen');
  h.event(owner,studio,'mw:resolveRequest',{id:item.id,outcome:'discarded'});
  pushed=studio.events.findLast(e=>e.type==='mw:state').data;assert.equal(pushed.queue[0].text,'C');
  h.state(owner,studio,1);h.event(owner,studio,'mw:resolveRequest',{id:4});
  pushed=studio.events.findLast(e=>e.type==='mw:state').data;assert.equal(pushed.queue[0].text,'C');assert.equal(pushed.page,0);
});

test('Wunsch-Aktionen melden Erledigt und Verwerfen eindeutig; ungültige Aktionen erhalten die Queue',()=>{
  const {h,listener,owner,ls,os}=fixture();
  h.event(listener,ls,'mw:request',{text:'Band – Song'});const id=h.state(owner,os).queue[0].id;
  assert.equal(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'play-now'})).ok,false);
  assert.equal(h.state(owner,os).queueTotal,1);
  assert.match(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'discarded'})).message,/verworfen/);
  assert.equal(lastResult(h.event(owner,os,'mw:resolveRequest',{id,outcome:'done'})).ok,false);
  h.event(listener,ls,'mw:request',{text:'Neuer Song'});
  assert.match(lastResult(h.event(owner,os,'mw:resolveRequest',{id:h.state(owner,os).queue[0].id,outcome:'done'})).message,/erledigt/);
});
test('Queue ist begrenzt, paginiert und bleibt unter dem Knuddels-Eventlimit', () => {
  const { h, owner, os } = fixture();
  for (let i = 0; i < 50; i++) {
    const user = h.user(100 + i, 'Hörer' + i); const session = h.open(user);
    assert.equal(lastResult(h.event(user, session, 'mw:request', { artist: 'ä'.repeat(80), title: 'T'.repeat(80), message: 'G'.repeat(200) })).ok, true);
  }
  const snapshot = h.state(owner, os, 2);
  assert.equal(snapshot.queue.length, 1); assert.equal(snapshot.pages, 50); assert.ok(JSON.stringify(snapshot).length < 10000);
  const extra = h.user(999, 'ZuSpät'); const es = h.open(extra);
  assert.equal(lastResult(h.event(extra, es, 'mw:request', wish)).ok, false);
  const id = snapshot.queue[0].id; h.event(owner, os, 'mw:resolveRequest', { id });
  assert.equal(h.state(owner, os).queueTotal, 49);
});
test('Channel verlassen schließt die UI, Löschung entfernt persönliche Daten', () => {
  const { h, listener, owner, ls, os } = fixture();
  h.event(listener, ls, 'mw:request', wish); h.app.onUserLeft(listener); assert.equal(ls.removed, true);
  listener.online = false; assert.deepEqual(h.event(listener, ls, 'mw:request', wish), []);
  h.app.onUserDeleted(listener.id); assert.equal(h.state(owner, os).queueTotal, 0);
});
test('RadioKing ist mit der echten MischWerk-Radio-ID und öffentlichen HTTPS-Adressen konfiguriert', () => {
  const { h, owner, os } = fixture();
  const station=h.state(owner,os).station;
  assert.equal(station.provider,'radioking'); assert.equal(station.radioId,'mischwerk');
  assert.equal(station.configured,true);
  assert.equal(station.streamUrl,'https://play.radioking.io/mischwerk');
  assert.equal(station.metadataUrl,'https://api.radioking.io/widget/radio/mischwerk/track/current');
  assert.equal(h.config.streamplus,undefined);
});

test('Leere RadioKing-Konfiguration deaktiviert nur den Player, Wunschbox und Studio bleiben nutzbar', () => {
  const {h,listener,ls,owner,os}=fixture();
  let requestNumber=0;
  for(const settings of [null,{}, {radioId:''}, {radioId:'   '}]) {
    h.config.radioking=settings;
    const station=h.state(owner,os).station;
    assert.equal(station.configured,false);assert.equal(station.streamUrl,'');assert.equal(station.metadataUrl,'');
    assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:'Ein Wunsch',requestId:'empty-'+(++requestNumber)})).ok,true);
    assert.equal(lastResult(h.event(owner,os,'mw:setTopic',{topic:'80er'})).ok,true);
  }
});

test('RadioKing akzeptiert die Radio-ID statt Live-Server, URLs, Zugangsdaten oder beliebiger Hosts',()=>{
  const {h,owner,os}=fixture();
  for(const value of ['https://play.radioking.io/mischwerk','http://live.radioking.com/mischwerk','../mischwerk','mischwerk?token=secret','mischwerk#secret','mischwerk/other','mischwerk%2fother','user:pass@mischwerk','mischwerk\\other','mischwerk\nother','-mischwerk','mischwerk-','mischwerk--other','ä-radio','x'.repeat(121),{},1]) {
    h.config.radioking={radioId:value};
    const station=h.state(owner,os).station;
    assert.equal(station.configured,false,JSON.stringify(value));
    assert.equal(station.radioId,''); assert.equal(station.streamUrl,'');assert.equal(station.metadataUrl,'');
    assert.doesNotMatch(JSON.stringify(station),/secret|live\.radioking|user:pass/);
  }
  h.config.radioking={radioId:'  MISCHWERK  '};
  assert.equal(h.state(owner,os).station.radioId,'mischwerk');
});

test('Überzählige RadioKing-Zugangsdaten oder alte Einstellungen werden nie an Hörer gesendet',()=>{
  const {h,owner,os}=fixture();
  h.config.radioking={radioId:'mischwerk',password:'private-secret',token:'private-secret',streamUrl:'https://evil.example'};
  h.config.streamplus={streamUrl:'https://server12345.streamplus.de/stream.mp3'};
  const station=h.state(owner,os).station;
  assert.equal(station.configured,true);
  assert.equal(station.streamUrl,'https://play.radioking.io/mischwerk');
  assert.doesNotMatch(JSON.stringify(station),/private-secret|evil\.example|streamplus/);
});

test('Alte UserPersistence-Wartezeiten werden nicht mehr gelesen und blockieren keine Wünsche', () => {
  const { h, listener, ls } = fixture();
  listener.persistence.getNumber = () => { throw new Error('obsolete cooldown must not be read'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'atomic-request' })).ok, true);
  assert.equal(h.state(listener, ls).myRequests.length, 1);
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'another-request' })).ok, true);
});
test('Eine defekte andere UI-Sitzung ändert keine erfolgreiche Wunschannahme', () => {
  const { h, listener, ls, os } = fixture();
  os.sendEvent = () => { throw new Error('closed transport'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', wish)).ok, true);
  assert.equal(h.state(listener, ls).myRequests.length, 1);
});
test('Push-Updates bewahren die ausgewählte Moderationsseite', () => {
  const { h, owner, os } = fixture();
  for (let i = 0; i < 10; i++) { const user = h.user(100 + i, 'Hörer' + i); h.event(user, h.open(user), 'mw:request', wish); }
  assert.equal(h.state(owner, os, 1).page, 1);
  os.events = [];
  const extra = h.user(200, 'NeuerHörer'); h.event(extra, h.open(extra), 'mw:request', wish);
  assert.equal(os.events.findLast(event => event.type === 'mw:state').data.page, 1);
});
test('Erneut übertragener Wunsch mit derselben ID wird nicht doppelt angelegt', () => {
  const { h, listener, owner, ls, os } = fixture();
  const data = { ...wish, requestId: 'retry-request' };
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', data)).ok, true);
  const id = h.state(owner, os).queue[0].id;
  h.event(owner, os, 'mw:resolveRequest', { id });
  h.event(owner, os, 'mw:setRequests', { enabled: false });
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', data)).ok, true);
  assert.equal(h.state(owner, os).queueTotal, 0);
});
test('Eine geschlossene nicht-null Sitzung darf keine weiteren Aktionen ausführen', () => {
  const { h, listener, ls } = fixture(); ls.remove();
  assert.deepEqual(h.event(listener, ls, 'mw:request', wish), []);
});
test('Wunsch und Wiederholungsschutz werden gemeinsam gespeichert; Speicherfehler verändern den Zustand nicht', () => {
  const { h, listener, ls } = fixture();
  const original = h.store.setObject; h.store.setObject = () => { throw new Error('disk failed'); };
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'retry-after-disk' })).ok, false);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
  h.store.setObject = original;
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'retry-after-disk' })).ok, true);
});
test('Anfrage-IDs werden validiert und interne Speicherfehler nicht an den Nutzer durchgereicht', () => {
  const { h, listener, ls } = fixture();
  assert.equal(lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'x'.repeat(81) })).ok, false);
  assert.equal(h.state(listener, ls).myRequests.length, 0);
  h.store.setObject = () => { throw new Error('secret internal path'); };
  const response = lastResult(h.event(listener, ls, 'mw:request', { ...wish, requestId: 'safe-id' }));
  assert.equal(response.requestId, 'safe-id'); assert.equal(response.action, 'mw:request');
  assert.equal(response.ok, false); assert.ok(!response.message.includes('secret'));
});
test('Bestehende Daten bleiben gültig; alte UserPersistence-Cooldowns sperren keinen Versand', () => {
  const { h, listener, ls } = fixture(); h.event(listener, ls, 'mw:request', wish);
  const stored = h.store.data['mischwerk.state.v1']; const timestamp = stored.requests[0].createdAt;
  delete stored.cooldowns; delete stored.revision;
  const restarted = createHarness(h.store); const user = restarted.user(1, 'Musikfreund');
  user.persistence.setNumber('mischwerk.lastRequestAt.v1', timestamp);
  const session = restarted.open(user);
  assert.equal(restarted.state(user, session).myRequests.length, 1);
  assert.equal(lastResult(restarted.event(user, session, 'mw:request', wish)).ok, true);
});
test('Knuddels-Ansicht ist responsiv und schließt den alten JFX-Browser aus', () => {
  const { h, os } = fixture();
  assert.equal(os.content.responsive, true); assert.equal(os.content.allowJFXBrowser, false);
  assert.equal(os.content.htmlFile.getAssetPath(), 'index.html');
  assert.equal(os.content.viewMode, 'Headerbar'); assert.equal(os.content.height, 264);
});
test('Channelbeitritt und Appstart öffnen die Leiste; Wiederöffnen hinterlässt keine doppelte Sitzung', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer');
  h.app.onUserJoined(user); const first = user.sessions[0];
  assert.equal(first.content.viewMode, 'Headerbar');
  h.app.chatCommands.mischwerk(user);
  assert.equal(first.removed, true); assert.equal(user.sessions.length, 1);
  h.app.onAppStart(); assert.equal(user.sessions.length, 1);
  h.app.onUserLeft(user); assert.equal(user.sessions.length, 0);
});
test('Nicht unterstützte Headerbar öffnet kein Popup und erzeugt beim Beitritt keine Fehlermeldung', () => {
  const h = createHarness(); const user = h.user(9, 'Hörer'); user.capable = false;
  h.app.onUserJoined(user); assert.equal(user.sessions.length, 0); assert.equal(user.messages.length, 0);
  h.app.chatCommands.mischwerk(user); assert.match(user.messages[0], /Channel.*leiste/);
});
test('Wunschbox und Moderation öffnen als Popup, während die Radioleiste bestehen bleibt', () => {
  const {h,owner,os} = fixture();
  assert.equal(lastResult(h.event(owner,os,'mw:openWishes')).ok,true);
  const wishes=owner.sessions.find(session=>session.content.viewMode==='Popup');
  assert.equal(wishes.content.width,520);assert.equal(wishes.content.height,360);
  assert.equal(wishes.content.htmlFile.getPageData().view,'wishes'); assert.equal(os.removed,false);
  h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(session=>session.content.viewMode==='Popup');
  assert.equal(studio.content.width,780);assert.equal(studio.content.height,420);
  assert.equal(wishes.removed,true); assert.equal(os.removed,false);
  assert.equal(studio.content.htmlFile.getPageData().view,'studio');
  h.event(owner,studio,'mw:setRequests',{enabled:false});
  assert.equal(h.state(owner,os).requestsEnabled,false);
  h.app.onUserLeft(owner); assert.equal(owner.sessions.length,0);
});
test('Studio-Popup prüft Rechte im Backend; abgelehntes Popup schließt die Leiste nicht', () => {
  const {h,listener,ls} = fixture();
  assert.equal(lastResult(h.event(listener,ls,'mw:openStudio',{canModerate:true})).ok,false);
  assert.equal(listener.sessions.length,1); assert.equal(ls.removed,false);
  listener.canSendAppContent=content=>content.viewMode==='Headerbar';
  assert.equal(lastResult(h.event(listener,ls,'mw:openWishes')).ok,false);
  assert.equal(ls.removed,false); assert.equal(listener.sessions.length,1);
});

test('Deaktivierte Wunschbox blockiert neue Popups serverseitig für Hörer und Moderatoren; Reaktivieren erhält Wünsche',()=>{
  const {h,listener,owner,ls,os}=fixture();
  h.event(listener,ls,'mw:request',{text:'Diesen Wunsch erhalten'});
  assert.equal(lastResult(h.event(listener,ls,'mw:openWishes')).ok,true);
  const existingWish=listener.sessions.find(s=>s.content.viewMode==='Popup');
  h.event(owner,os,'mw:setRequests',{enabled:false});
  assert.equal(lastResult(h.event(owner,os,'mw:openStudio')).ok,true);
  const studio=owner.sessions.find(s=>s.content.viewMode==='Popup');
  const contentCount=h.contents.length;
  for(const [person,session] of [[listener,ls],[owner,os]]){
    const result=lastResult(h.event(person,session,'mw:openWishes',{enabled:true,canModerate:true}));
    assert.equal(result.ok,false);assert.match(result.message,/deaktiviert/);
    assert.equal(h.contents.length,contentCount,'Kein neues Popup erzeugen');
    assert.equal(session.removed,false);
  }
  assert.equal(studio.removed,false,'Gesperrtes Wunschfenster ersetzt das Studio nicht');
  assert.equal(lastResult(h.event(listener,existingWish,'mw:request',{text:'Nicht annehmen'})).ok,false);
  assert.equal(h.state(owner,os).queueTotal,1);
  const restarted=createHarness(h.store),nextListener=restarted.user(10,'Neuer Hörer'),nextSession=restarted.open(nextListener);
  assert.equal(lastResult(restarted.event(nextListener,nextSession,'mw:openWishes')).ok,false,'Sperre nach Neustart erhalten');
  assert.equal(lastResult(h.event(owner,studio,'mw:setRequests',{enabled:true})).ok,true);
  assert.equal(lastResult(h.event(listener,ls,'mw:openWishes')).ok,true);
  assert.equal(h.state(listener,ls).myTotal,1,'Gespeicherte Wünsche erhalten');
});
test('Popup und Radioleiste behalten getrennte Seiten bei Statusmeldungen', () => {
  const {h,owner,os}=fixture();
  for(let i=0;i<17;i++){const user=h.user(200+i,'Wunsch'+i);h.event(user,h.open(user),'mw:request',wish);}
  h.event(owner,os,'mw:openStudio'); const popup=owner.sessions.find(session=>session.content.viewMode==='Popup');
  assert.equal(h.state(owner,popup,1).page,1); assert.equal(h.state(owner,os,0).page,0);
  h.event(owner,os,'mw:setRequests',{enabled:false});
  assert.equal(popup.events.findLast(event=>event.type==='mw:state').data.page,1);
  assert.equal(os.events.findLast(event=>event.type==='mw:state').data.page,0);
});
test('Ein Textfeld übermittelt den vollständigen Wunsch mit echtem Nick und ohne erfundene Zustellung', () => {
  const {h,listener,owner,ls,os}=fixture();
  const response=lastResult(h.event(listener,ls,'mw:request',{text:'Bitte Lieblingsband – Unser Song. Grüße an den Channel!',nick:'Fälschung',userId:owner.id,delivery:{nick:'Fake'},requestId:'single-field'}));
  assert.equal(response.ok,true);assert.match(response.message,/gespeichert/);assert.doesNotMatch(response.message,/angekommen|übergeben/);
  const item=h.state(owner,os).queue[0];
  assert.equal(item.nick,listener.nick);assert.equal(item.text,'Bitte Lieblingsband – Unser Song. Grüße an den Channel!');
  assert.equal(item.delivery,null);assert.equal(response.request.nick,listener.nick);
  assert.equal('userId' in item,false);
});
test('Einzelfeld wird serverseitig validiert; alte gespeicherte Wünsche bleiben lesbar', () => {
  const {h,listener,owner,ls,os}=fixture();
  for(const text of ['', '  \n ', {}, 'X'.repeat(301)]){
    assert.equal(lastResult(h.event(listener,ls,'mw:request',{text})).ok,false);
  }
  assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:'  Wunsch\nmit   Gruß  '})).ok,true);
  assert.equal(h.state(owner,os).queue[0].text,'Wunsch mit Gruß');
  const stored=h.store.data['mischwerk.state.v1'].requests[0];
  delete stored.text;stored.artist='Alte Band';stored.title='Alter Titel';stored.message='Alter Gruß';
  const restarted=createHarness(h.store),person=restarted.user(2,'Otterchen','owner');
  assert.equal(restarted.state(person,restarted.open(person)).queue[0].text,'Alte Band – Alter Titel · Alter Gruß');
});

test('Musikwünsche lehnen Links im Backend ab, erlauben normale Interpret-/Titel-Namen und erhalten alte gespeicherte Wünsche',()=>{
  const {h,listener,owner,ls,os}=fixture();
  for(const link of ['https://youtu.be/123','youtube.com/watch?v=123','www.youtube.com/watch?v=123','http://example.org/song','example.de','open.spotify.com/track/123','spotify:track:123','https%3A%2F%2Fexample.com','example。com','https://exa\u200bmple.com','[Song](example.org)','//example.net/song','ftp://example.com/song','192.168.0.1/song','x.com/song']){
    const result=lastResult(h.event(listener,ls,'mw:request',{text:'Queen – Song '+link}));
    assert.equal(result.ok,false,link);assert.match(result.message,/Keine Links/);
    assert.equal(h.state(owner,os).queueTotal,0);
  }
  assert.equal(lastResult(h.event(listener,ls,'mw:request',{artist:'Band',title:'Song',message:'https://example.com'})).ok,false,'Alter Client darf keine Links einschleusen');
  for(const text of ['a-ha – Take On Me','will.i.am – Scream & Shout','M.I.A. – Paper Planes','t.A.T.u. – All The Things She Said','AC/DC – Thunderstruck','Mr. Big – To Be With You']){
    assert.equal(lastResult(h.event(listener,ls,'mw:request',{text})).ok,true,text);
  }
  const saved=h.store.data['mischwerk.state.v1'];saved.requests[0].text='Alter Wunsch mit https://example.com';
  const restarted=createHarness(h.store),ru=restarted.user(owner.id,owner.nick,'owner');
  assert.equal(restarted.state(ru,restarted.open(ru)).queue[0].text,'Alter Wunsch mit https://example.com','Bestehenden Inhalt nicht löschen');
});
test('Zustellung erfordert eine berechtigte Studiositzung und genau den angezeigten Wunsch', () => {
  const {h,listener,owner,ls,os}=fixture();
  h.event(listener,ls,'mw:request',{text:'Erster Wunsch'});
  const other=h.user(3,'Anderer Hörer');h.event(other,h.open(other),'mw:request',{text:'Zweiter Wunsch'});
  const id=h.state(owner,os).queue[0].id;
  assert.equal(lastResult(h.event(listener,ls,'mw:ackRequest',{id,nick:'Fake'})).ok,false);
  assert.equal(lastResult(h.event(owner,os,'mw:ackRequest',{id})).ok,false);
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Popup');
  const second=h.state(owner,studio,1).queue[0];
  assert.equal(lastResult(h.event(owner,studio,'mw:ackRequest',{id})).ok,false);
  assert.equal(h.state(listener,ls).myRequests[0].delivery,null);
  h.state(owner,studio,0);
  h.event(owner,studio,'mw:ackRequest',{id,nick:'Fake',userId:999});
  const received=h.state(listener,ls).myRequests[0];
  assert.equal(received.delivery.nick,'Otterchen');assert.ok(received.delivery.at);
  assert.equal('userId' in received.delivery,false);
  const revision=h.state(owner,studio).revision;h.event(owner,studio,'mw:ackRequest',{id});
  assert.equal(h.state(owner,studio).revision,revision);
  owner.role='listener';
  assert.equal(lastResult(h.event(owner,studio,'mw:ackRequest',{id:second.id})).ok,false);
  const restarted=createHarness(h.store),person=restarted.user(1,listener.nick);
  assert.equal(restarted.state(person,restarted.open(person)).myRequests[0].delivery.nick,'Otterchen');
});
test('Viele eigene Wünsche bleiben paginiert unter dem Eventlimit und erhalten ihre Zustellrückmeldung', () => {
  const {h,listener,owner,ls,os}=fixture();
  for(let i=0;i<50;i++){
    assert.equal(lastResult(h.event(listener,ls,'mw:request',{text:String(i).padStart(2,'0')+'ä'.repeat(298),requestId:'full-own-'+i})).ok,true);
  }
  let state=h.state(listener,ls,0,0);
  assert.equal(state.myTotal,50);assert.equal(state.myPages,50);assert.equal(state.myRequests.length,1);
  assert.equal(state.myRequests[0].text.slice(0,2),'00');
  assert.ok(JSON.stringify(state).length<10000);
  h.event(owner,os,'mw:openStudio');const studio=owner.sessions.find(s=>s.content.viewMode==='Popup');
  const item=h.state(owner,studio,49).queue[0];
  h.event(owner,studio,'mw:ackRequest',{id:item.id});
  state=h.state(listener,ls,0,3);
  assert.equal(state.myPage,3);assert.equal(state.myRequests[0].text.slice(0,2),'03');
  assert.equal(state.requestFeedback.id,item.id);
  assert.equal(state.requestFeedback.delivery.nick,'Otterchen');
  h.event(owner,studio,'mw:setRequests',{enabled:false});
  assert.equal(ls.events.findLast(e=>e.type==='mw:state').data.myPage,3);
  state=h.state(listener,ls,0,500);
  assert.equal(state.myPage,49);assert.ok(JSON.stringify(state).length<10000);
  h.app.onUserDeleted(listener.id);assert.equal(h.state(owner,studio).queueTotal,0);
});



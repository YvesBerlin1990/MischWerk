// Private Wunschpositionen aus der dauerhaften Moderationsqueue.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../support/knuddels.cjs');
function setup() {
  const h=createHarness(), owner=h.user(1,'Otterchen','owner'), a=h.user(2,'Hörer A'), b=h.user(3,'Hörer B');
  const os=h.open(owner);h.event(owner,os,'mw:onAir',{});
  return { h,owner,a,b,os,as:h.open(a),bs:h.open(b)};
}
test('Eigene Positionen sind privat und rücken nach Erledigt oder Verwerfen tatsächlich nach',()=>{
  const {h,owner,a,b,os,as,bs}=setup();
  for(const [user,session,text] of [[a,as,'A eins'],[b,bs,'B eins'],[a,as,'A zwei'],[b,bs,'B zwei']])
    h.event(user,session,'mw:wish.submit',{text});
  const first=h.state(a,as).wishPositions, second=h.state(b,bs).wishPositions;
  assert.deepEqual(first.items.map(x=>[x.text,x.position]),[['A eins',1]]);
  assert.deepEqual(second.items.map(x=>[x.text,x.position]),[['B eins',2]]);
  assert.equal(first.pages,2);
  assert.deepEqual(first.nextItem,first.items[0]);
  assert.equal(second.nextItem.text,'B eins','Die Zusammenfassung enthält ausschließlich eigene Wünsche');
  assert.deepEqual(h.state(a,as,0,1).wishPositions.nextItem,first.items[0],'Blättern verändert den nächsten Wunsch der Appleiste nicht');
  assert.deepEqual(h.state(a,as,0,1).wishPositions.items.map(x=>[x.text,x.position]),[['A zwei',3]]);
  h.state(a,as,0,0);
  assert.deepEqual(h.state(b,bs,0,1).wishPositions.items.map(x=>[x.text,x.position]),[['B zwei',4]]);
  h.state(b,bs,0,0);
  assert.equal(h.state(owner,os).wishPositions.total,0);
  assert.equal(h.state(owner,os).wishPositions.nextItem,null);
  assert.equal(h.state(a,as).myRequests.length,0,'Kein historisches Wunschmodell reaktivieren');
  assert.ok(first.items.every(item=>Object.keys(item).sort().join(',')==='id,position,stage,text' && item.stage==='queued'));
  h.event(owner,os,'mw:resolveRequest',{id:first.items[0].id,outcome:'done'});
  assert.deepEqual(as.events.findLast(e=>e.type==='mw:state').data.wishPositions.items.map(x=>x.position),[2]);
  assert.deepEqual(bs.events.findLast(e=>e.type==='mw:state').data.wishPositions.items.map(x=>x.position),[1]);
  h.event(owner,os,'mw:resolveRequest',{id:second.items[0].id,outcome:'discarded'});
  assert.deepEqual(h.state(a,as).wishPositions.items.map(x=>x.position),[1]);
  assert.deepEqual(h.state(b,bs).wishPositions.items.map(x=>x.position),[2]);
});
test('Positionen vertrauen nur der authentifizierten Identität und erlauben keine fremden Mutationen',()=>{
  const {h,a,b,as,bs}=setup();
  h.event(a,as,'mw:wish.submit',{text:'Nur A',userId:b.id,nick:b.nick,senderKey:String(b.id)});
  h.event(b,bs,'mw:wish.submit',{text:'Nur B'});
  const snapshot=h.state(a,as), own=snapshot.wishPositions;
  h.event(a,as,'mw:refresh',{userId:b.id,nick:b.nick,myPage:0});
  assert.deepEqual(as.events.at(-1).data.wishPositions.items.map(x=>x.text),['Nur A']);
  const rejected=h.event(a,as,'mw:resolveRequest',{id:own.items[0].id,outcome:'done'});
  assert.equal(rejected.find(e=>e.type==='mw:result').data.ok,false);
  assert.equal(h.state(a,as).wishPositions.revision,own.revision);
  assert.deepEqual(h.event(a,bs,'mw:refresh',{myPage:0}),[]);
  a.nick='Neuer Nick';
  assert.equal(h.state(a,as).wishPositions.items[0].text,'Nur A','Nickwechsel ändert die Zuordnung nicht');
  as.remove();
  const reopened=h.open(a);
  assert.deepEqual(h.state(a,reopened).wishPositions.items,own.items,'Erneutes Öffnen erhält dieselben eigenen Plätze');
});
test('Viele eigene Wünsche bleiben paginiert, klein und auf der ausgewählten Seite bei Push',()=>{
  const {h,owner,a,b,os,as,bs}=setup();
  for(let i=0;i<40;i++)h.event(a,as,'mw:wish.submit',{text:String(i).padStart(2,'0')+'ä'.repeat(298)});
  let state=h.state(a,as,0,39);
  assert.equal(state.wishPositions.total,40);
  assert.equal(state.wishPositions.pages,40);
  assert.equal(state.wishPositions.page,39);
  assert.deepEqual(state.wishPositions.items.map(x=>x.position),[40]);
  h.event(b,bs,'mw:wish.submit',{text:'Danach B'});
  assert.equal(as.events.findLast(e=>e.type==='mw:state').data.wishPositions.page,39);
  h.event(owner,os,'mw:resolveRequest',{id:state.wishPositions.items[0].id,outcome:'done'});
  state=as.events.findLast(e=>e.type==='mw:state').data;
  assert.equal(state.wishPositions.page,38);
  assert.equal(state.wishPositions.total,39);
  for(let page=0;page<39;page++){
    state=h.state(a,as,0,page);
    assert.ok(state.wishPositions.items.length===1);
    assert.ok(JSON.stringify(state).length<10000);
    assert.ok(Buffer.byteLength(JSON.stringify(state),'utf8')<10000);
    assert.ok(state.wishPositions.items.every(x=>x.position===page+1));
  }
});
test('Wiederholungen und Empfang ändern keine Position; ein Neustart beginnt eine neue Ansichts-Generation',()=>{
  const {h,owner,a,os,as}=setup(), data={text:'Ein Wunsch',submissionId:'position-retry'};
  h.event(a,as,'mw:wish.submit',data);
  const before=h.state(a,as).wishPositions;
  h.event(a,as,'mw:wish.submit',data);
  assert.deepEqual(h.state(a,as).wishPositions,before);
  h.event(owner,os,'mw:openStudio');
  const studio=owner.sessions.find(x=>x.content.viewMode==='Overlay');
  h.event(owner,studio,'mw:ackRequest',{id:before.items[0].id});
  assert.equal(h.state(a,as).wishPositions.revision,before.revision);
  h.event(owner,studio,'mw:resolveRequest',{id:before.items[0].id,outcome:'done'});
  h.event(a,as,'mw:wish.submit',data);
  assert.equal(h.state(a,as).wishPositions.total,0,'Verspätete Wiederholung belebt erledigte Wünsche nicht wieder');
  const reboot=createHarness(h.store), user=reboot.user(a.id,a.nick), session=reboot.open(user);
  const after=reboot.state(user,session).wishPositions;
  assert.equal(after.total,0);
  assert.notEqual(after.generation,before.generation);
});
test('Geschlossene Wunschbox und Nutzerlöschung erhalten korrekte Positionen mit dauerhaften Wünschen',()=>{
  const {h,owner,a,b,os,as,bs}=setup();
  h.event(a,as,'mw:wish.submit',{text:'A vorher'});
  h.event(b,bs,'mw:wish.submit',{text:'B danach'});
  h.event(owner,os,'mw:setRequests',{enabled:false});
  assert.equal(h.state(b,bs).wishPositions.items[0].position,2);
  h.app.onUserDeleted(a.id);
  assert.equal(h.state(b,bs).wishPositions.items[0].position,1);
  assert.equal(h.store.data['mischwerk.wishes.v2'],undefined);
  const write=h.store.setObject;h.store.setObject=()=>{throw new Error('Speicherfehler');};
  const result=h.event(owner,os,'mw:resolveRequest',{id:h.state(b,bs).wishPositions.items[0].id,outcome:'discarded'});
  assert.equal(result.find(e=>e.type==='mw:result').data.ok,false);
  assert.equal(h.state(b,bs).wishPositions.total,1);
  h.store.setObject=write;
  h.event(owner,os,'mw:resolveRequest',{id:h.state(b,bs).wishPositions.items[0].id,outcome:'discarded'});
  assert.equal(h.state(b,bs).wishPositions.total,0);
});

test('Wunschbox öffnet als natives Channel-Overlay; Header bleibt beim Wechsel zur Moderation erhalten',()=>{
 const {h,owner,a,os,as}=setup();

 h.event(a,as,'mw:wishes.sync',{text:'Mein Entwurf',sequence:0,disabled:false});
 const events=h.event(a,as,'mw:openWishes');
 assert.equal(events.find(e=>e.type==='mw:result').data.ok,true);
 const surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 assert.ok(surface);assert.equal(as.content.height,176);assert.equal(as.removed,false);
 assert.deepEqual([surface.content.width,surface.content.height],[480,340]);
 assert.equal(surface.content.responsive,true);assert.equal(surface.content.allowJFXBrowser,false);
 assert.equal(surface.content.htmlFile.pageData.wishSurface,true);
 assert.equal(surface.content.htmlFile.pageData.wishPresentation.text,'Mein Entwurf');
 h.event(owner,os,'mw:openWishes');const ownerOverlay=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 h.event(owner,os,'mw:openStudio');h.finishOverlay(owner,ownerOverlay);const studio=owner.sessions.find(s=>s.content.viewMode==='Overlay');
 assert.equal(ownerOverlay.removed,true);assert.notEqual(studio,ownerOverlay);assert.equal(studio.activeView,'studio');assert.equal(h.event(owner,studio,'mw:openWishes').find(e=>e.type==='mw:result').data.ok,false);
 h.event(a,as,'mw:openWishes');h.finishOverlay(a,surface);assert.equal(surface.removed,true);assert.equal(as.removed,false);
 h.event(owner,os,'mw:setRequests',{enabled:false});
 assert.equal(h.event(a,as,'mw:openWishes').find(e=>e.type==='mw:result').data.ok,false);
});

test('Overlay-Eingabe wird nur an die eigene Radio-Sitzung gereicht; Wunschtransport bleibt eigenständig',()=>{
 const {h,owner,a,b,os,as,bs}=setup();
 h.event(a,as,'mw:openWishes');const surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 const id=surface.content.htmlFile.pageData.wishSurfaceId;
 h.event(a,surface,'mw:wishes.submit',{text:'Unser Song',sequence:1});
 const input=as.events.find(e=>e.type==='mw:wishes.input');assert.equal(input.data.text,'Unser Song');
 assert.equal(input.data.submit,true);assert.equal(input.data.surfaceId,id);
 assert.equal(h.state(a,as).wishPositions.total,0,'UI-Relay reiht selbst keinen Wunsch ein');
 assert.equal(bs.events.some(e=>e.type==='mw:wishes.input'),false);
 const receipt=h.event(a,as,'mw:wish.submit',{text:'Unser Song',submissionId:'same-radio-controller'});
 assert.equal(receipt[0].type,'mw:wish.receipt');assert.equal(receipt[0].data.accepted,true);
 h.event(a,as,'mw:wishes.sync',{surfaceId:id,sequence:1,text:'',feedback:'Gesendet',feedbackHidden:false,disabled:false});
 assert.equal(surface.events.find(e=>e.type==='mw:wishes.presentation').data.state.feedback,'Gesendet');
 h.event(a,surface,'mw:overlay.dismiss',{state:{},revision:1});assert.equal(surface.removed,true);
 h.event(a,as,'mw:openWishes');const next=a.sessions.find(s=>s.content.viewMode==='Overlay');
 assert.equal(next.content.htmlFile.pageData.wishPresentation.feedback,'Gesendet');
 assert.equal(h.state(a,as).wishPositions.total,1);
});

test('Geschlossene, fremde und veraltete Overlay-Eingaben verändern keinen Radioentwurf',()=>{
 const {h,owner,a,b,os,as,bs}=setup();
 h.event(a,as,'mw:openWishes');const surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 as.events=[];h.event(b,surface,'mw:wishes.edit',{text:'Fremd',sequence:1});assert.equal(as.events.length,0);
 h.event(b,bs,'mw:wishes.edit',{text:'Falsche Ansicht',sequence:1});assert.equal(as.events.length,0);
 for(const sequence of [-1,0,1.5,Infinity,1000000001])h.event(a,surface,'mw:wishes.edit',{text:'Ungültig',sequence});
 assert.equal(as.events.length,0);
 h.event(a,surface,'mw:wishes.edit',{text:'Neu',sequence:2});
 h.event(a,surface,'mw:wishes.edit',{text:'Alt',sequence:1});
 assert.deepEqual(as.events.map(e=>e.data.text),['Neu']);
 surface.remove();as.events=[];h.event(a,surface,'mw:wishes.edit',{text:'Geschlossen',sequence:3});
 assert.equal(as.events.length,0);
});

test('Nicht unterstütztes Overlay erhält den bestehenden Header',()=>{
 const {h,owner,a,os,as}=setup();

 a.capable=false;assert.equal(h.event(a,as,'mw:openWishes').find(e=>e.type==='mw:result').data.ok,false);
 assert.equal(as.removed,false);assert.equal(as.content.height,176);assert.equal(a.sessions.length,1);
 a.capable=true;h.event(a,as,'mw:openWishes');const surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 as.remove();assert.equal(surface.removed,true);
});


test('Identische Wunschdarstellung wird nicht erneut gesendet; neue Sequenz und neues Fenster erhalten ihre Bestätigung',()=>{
 const {h,owner,a,as}=setup();h.event(a,as,'mw:openWishes');
 let surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 const data={surfaceId:as.events.findLast(e=>e.type==='mw:wishes.open').data.surfaceId,sequence:1,text:'Mein Entwurf',disabled:false,feedbackHidden:true};
 for(let i=0;i<25;i++)h.event(a,as,'mw:wishes.sync',data);
 assert.equal(surface.events.filter(e=>e.type==='mw:wishes.presentation').length,1);
 h.event(a,as,'mw:wishes.sync',{...data,sequence:2});assert.equal(surface.events.filter(e=>e.type==='mw:wishes.presentation').length,2);
 surface.nativeClose(false);h.event(a,as,'mw:openWishes');surface=a.sessions.find(s=>s.content.viewMode==='Overlay');
 const nextId=as.events.findLast(e=>e.type==='mw:wishes.open').data.surfaceId;
 h.event(a,as,'mw:wishes.sync',{...data,surfaceId:nextId,sequence:0});assert.equal(surface.events.filter(e=>e.type==='mw:wishes.presentation').length,1);
 h.event(a,as,'mw:wishes.sync',data);assert.equal(surface.events.filter(e=>e.type==='mw:wishes.presentation').length,1,'Alte Fensterkennung bleibt wirkungslos');
});

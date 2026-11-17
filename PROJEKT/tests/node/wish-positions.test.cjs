const test=require('node:test'),assert=require('node:assert/strict');const {setup}=require('../fixtures/relay-v2.cjs');
function submit(f,u,s,id,text){f.h.event(u,s,'mw:wish.submit',{submissionId:id,text});const post=f.posts.at(-1),row=post.body.wishSubmissions[0];f.finish(post,{wishReceipts:[{submissionId:row.submissionId,accepted:true,state:'queued',position:9,error:null}]});return row;}

test('Drei aktuelle Hörerstufen und bestätigtes Gespielt bleiben von historischen Wirezuständen getrennt',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),session=h.open(u);f.finish();const row=submit(f,u,session,'three','Drei Stufen');
 for(const [revision,wire,visible] of [[1,'received','received'],[2,'preparing','preparing'],[3,'playing','preparing']]){
  h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:wire,position:1,wishRevision:revision}]});
  assert.equal(h.state(u,session).wishPositions.nextItem.stage,visible);assert.equal(h.runtime.nativeRelayState().entries[0].state,wire,'Originaler Wirezustand wird nicht umgeschrieben');
 }
 h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:'done',position:null,wishRevision:4}]});
 assert.equal(h.state(u,session).wishPositions.lastOutcome,'played');assert.equal(h.runtime.nativeRelayState().entries[0].text,'');
 h.advance(45001);assert.equal(h.state(u,session).wishPositions.lastOutcome,null);
});

test('Historische Endbelege und verworfene Wünsche werden niemals als Gespielt umgedeutet',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),session=h.open(u);require('../fixtures/legacy-wishes.cjs').seed(h,[{text:'Privates Original erhalten'}]);f.finish();h.advance(5000);const query=f.posts.at(-1).body.ownWishQueries[0];
 f.finish(undefined,{ownWishStatuses:[{submissionId:query.submissionId,state:'done',position:null,wishRevision:1}]});
 assert.equal(h.state(u,session).wishPositions.lastOutcome,'closed');assert.equal(h.runtime.loadWishes().items[0].text,'Privates Original erhalten');
 const newer=submit(f,u,session,'discarded','Technisch verworfen');h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:newer.submissionId,state:'discarded',position:null,wishRevision:1}]});
 assert.equal(h.state(u,session).wishPositions.lastOutcome,'closed');assert.equal(h.runtime.nativeRelayState().entries.find(row=>row.clientId==='discarded').playedConfirmed,false);
});
test('Eigene absolute globale Plätze kommen nur von Firebase; fremde Texte und Besitzer bleiben privat',()=>{
 const f=setup(),h=f.h,a=h.user(3,'Erster'),b=h.user(4,'Zweiter'),as=h.open(a),bs=h.open(b);f.finish();submit(f,a,as,'one','Nur für Ersten');
 assert.equal(h.state(a,as).wishPositions.nextPosition,9);assert.equal(h.state(b,bs).wishPositions.total,0);assert.doesNotMatch(JSON.stringify(h.state(b,bs)),/Nur für Ersten|senderKey|ownerKey/);
 h.advance(5000);const post=f.posts.at(-1),query=post.body.ownWishQueries[0];f.finish(post,{ownWishStatuses:[{submissionId:query.submissionId,state:'preparing',position:3,wishRevision:2}]});
 assert.equal(h.state(a,as).wishPositions.nextPosition,3);assert.equal(h.state(a,as).wishPositions.nextItem.stage,'preparing');
});
test('Endstatus entfernt nur eigenen offenen Status; veraltete Einzelrevision kann ihn nicht zurückholen',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();const row=submit(f,u,s,'one','Wunsch');h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:'done',position:null,wishRevision:8}]});
 assert.equal(h.state(u,s).wishPositions.total,0);assert.equal(h.runtime.nativeRelayState().entries[0].state,'done');
});
test('Ausgelaufene eigene Statusbestätigung behauptet trotz Channelrefresh keinen alten Platz',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();submit(f,u,s,'one','Wunsch');h.advance(45000);const state=h.state(u,s);assert.equal(state.wishPositions.nextPosition,null);
});

for(const code of ['permission_denied','owner_deleted','not_found','invalid_request','unavailable','future_unknown'])test('Eigener Statusfehler bleibt neutral und bewahrt Kennung/Text: '+code,()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();const row=submit(f,u,s,'one','Mein Wunsch');const before=h.runtime.nativeRelayState().entries[0];h.advance(5000);
 f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:null,position:null,error:code}]});const saved=h.runtime.nativeRelayState().entries[0];assert.equal(saved.state,'unconfirmed');assert.equal(saved.submissionId,before.submissionId);assert.equal(saved.text,'Mein Wunsch');assert.equal(h.state(u,s).wishPositions.nextPosition,null);assert.equal(h.state(u,s).wishPositions.nextItem.stage,'unknown');assert.equal(h.runtime.receivedShow().active,true);
});

test('Zentral archivierter Terminalbeleg mit Revision0 entfernt Text auch nach höherer aktiver Einzelrevision',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();const row=submit(f,u,s,'one','Zu löschender Text');h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:'preparing',position:1,wishRevision:5}]});h.advance(5000);f.finish(undefined,{ownWishStatuses:[{submissionId:row.submissionId,state:'done',position:null,wishRevision:0}]});
 const saved=h.runtime.nativeRelayState().entries[0];assert.equal(saved.state,'done');assert.equal(saved.text,'');assert.equal(saved.nick,'');assert.match(saved.textDigest,/^[a-f0-9]{64}$/);assert.equal(h.state(u,s).wishPositions.total,0);h.event(u,s,'mw:wish.submit',{submissionId:'one',text:'Zu löschender Text'});assert.equal(h.runtime.nativeRelayState().entries.length,1);
});

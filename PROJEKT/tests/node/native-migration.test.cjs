const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {setup}=require('../fixtures/relay-v2.cjs');const {seed}=require('../fixtures/legacy-wishes.cjs');
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function pages(h,migrationId='prepared-import'){
 let offset=0,index=0,sourceRevision,all=[];
 for(;;){const p=h.runtime.nativeMigrationPage({migrationId,offset,chunkIndex:index++,sourceRevision});sourceRevision=p.sourceRevision;all.push(p);if(p.chunk.finalChunk)return all;assert.ok(p.nextOffset>offset);offset=p.nextOffset;}
}
test('Vollständiger seitenweiser Originalimport erhält 260 Unicodewünsche, Reihenfolge, direkte Websiteherkunft und delivery',()=>{
 const f=setup();seed(f.h,Array.from({length:260},(_,i)=>({text:'  '+i+'🎶'.repeat(140)+'  ',...(i===1?{senderKey:'website:visitor',nick:'Website',submissionId:'web-legacy'}:{}),...(i===0?{delivery:{nick:'Alter DJ',senderKey:'9',at:f.h.now()-500},stage:'preparing'}:{})})));
 const result=pages(f.h);assert.ok(result.length>10);const wishes=result.flatMap(p=>p.chunk.wishes);assert.equal(wishes.length,260);
 assert.deepEqual(wishes.map(r=>r.arrivalSequence),Array.from({length:260},(_,i)=>i+1));assert.equal(wishes[0].text,'  0'+'🎶'.repeat(140)+'  ');assert.equal(wishes[1].origin,'web');assert.equal(wishes[1].submissionId,'web-legacy');
 const delivery=result.flatMap(p=>p.chunk.receipts).find(r=>r.kind==='delivery');assert.equal(delivery.result.nick,'Alter DJ');assert.match(delivery.result.ownerKey,/^[a-f0-9]{64}$/);assert.equal(delivery.result.senderKey,undefined);
 for(const page of result){assert.ok(JSON.stringify(page.chunk).length<9500);assert.equal(page.digest,crypto.createHash('sha256').update(canonical(page.chunk)).digest('hex'));}
});
test('Normale Event-/Statusmetadaten verändern gebundenen Legacyexport nicht; Nutzerlöschung invalidiert ihn',()=>{
 const f=setup();seed(f.h,[{text:'Original'}]);const first=pages(f.h)[0],state=JSON.parse(JSON.stringify(f.h.runtime.nativeRelayState()));state.eventCursor='new-cursor';f.h.runtime.saveNativeRelayState(state);
 assert.equal(pages(f.h)[0].sourceRevision,first.sourceRevision);f.h.app.onUserDeleted(3);
 assert.throws(()=>f.h.runtime.nativeMigrationPage({migrationId:'prepared-import',sourceRevision:first.sourceRevision}),/MIGRATION_REVISION/);
});
test('Status allein startet nichts; nur echte Inhabersitzung exportiert, gleicher Chunk bis passende Inhaltsquittung',()=>{
 const f=setup(),h=f.h;seed(h,[{text:'Original'}]);f.finish(undefined,{migrationPreparation:{migrationId:'prepared-import',sourceNamespace:h.runtime.nativeNamespace(),phase:'importing'}});
 assert.equal(h.runtime.migrationView().phase,'idle');const owner=h.user(2,'Otterchen','owner');h.app.chatCommands.mw(owner,'admin');const s=owner.sessions.find(s=>s.activeView==='team');
 h.event(owner,s,'mw:migration.start',{requestId:'start-export',view:'team',viewRevision:1});h.advance(10000);const sent=f.posts.at(-1),chunk=sent.body.migrationChunk;assert.ok(chunk);assert.equal(h.runtime.migrationFrozen(),true);
 const page=h.runtime.nativeMigrationPage({migrationId:chunk.migrationId,sourceRevision:chunk.sourceRevision,offset:0,chunkIndex:0});
 f.finish(sent,{migrationReceipt:{migrationId:chunk.migrationId,sourceRevision:chunk.sourceRevision,chunkIndex:0,digest:'0'.repeat(64),accepted:true}});
 assert.equal(h.runtime.migrationView().phase,'exporting');assert.equal(h.runtime.migrationView().chunkIndex,0);
 h.advance(20000);const repeated=f.posts.at(-1);assert.deepEqual(repeated.body.migrationChunk,chunk);
 f.finish(repeated,{migrationReceipt:{migrationId:chunk.migrationId,sourceRevision:chunk.sourceRevision,chunkIndex:0,digest:page.digest,accepted:true}});
 assert.equal(h.runtime.migrationView().phase,'exported');assert.match(h.runtime.migrationView().message,/Verifikation/);
});

test('Terminaler Original-Replay exportiert Besitzer und unbekannten Textdigest; dieselbe clientId erzeugt keinen neuen Wunsch',()=>{
 const f=setup(),h=f.h;seed(h,[{text:'Bereits erledigtes Original',submissionId:'old-terminal'}]);
 const original=JSON.parse(JSON.stringify(h.runtime.loadWishes()));original.items=[];original.replays=[{id:1,submissionId:'old-terminal',senderKey:'3',outcome:'done'}];original.revision++;h.runtime.updateStudioWishState(h.runtime.loadWishes(),original);h.runtime.updateWishControlState(h.runtime.loadWishes(),original);h.runtime.commitWishMetadata(original);
 const exports=pages(h),replay=exports.flatMap(p=>p.chunk.receipts).find(r=>r.kind==='replay');
 assert.equal(replay.submissionId,'knuddels:'+h.runtime.nativeNamespace()+'-1');assert.equal(replay.result.ownerKey,h.runtime.nativeOwnerKey('3'));assert.equal(replay.result.textDigest,null);assert.equal(replay.digest,null);assert.equal(replay.result.state,'done');
 assert.ok(exports.flatMap(p=>p.chunk.aliases).some(a=>a.alias==='old-terminal'&&a.submissionId===replay.submissionId));
 const user=h.user(3,'Hörer'),other=h.user(4,'Anderer'),session=h.open(user),foreign=h.open(other);f.finish();const before=JSON.stringify(h.runtime.loadWishes()),posts=f.posts.length;
 h.event(user,session,'mw:wish.submit',{submissionId:'old-terminal',text:'Inhalt ist historisch unbekannt'});
 const receipt=session.events.findLast(e=>e.type==='mw:wish.receipt').data;assert.equal(receipt.accepted,true);assert.equal(receipt.state,'done');assert.match(receipt.message,/bereits abgeschlossen/);
 h.event(other,foreign,'mw:wish.submit',{submissionId:'old-terminal',text:'Fremde Wiederholung'});assert.equal(foreign.events.findLast(e=>e.type==='mw:wish.receipt').data.accepted,false);
 assert.equal(JSON.stringify(h.runtime.loadWishes()),before);assert.equal(f.posts.length,posts);assert.equal(h.runtime.nativeRelayState().entries.length,0);
});

test('Negative Importquittung hält Chunk und Freeze; gültige Sender- und Löschbelege bleiben übernommen',()=>{
 const f=setup(),h=f.h;seed(h,[{text:'Original'}]);f.finish(undefined,{migrationPreparation:{migrationId:'prepared-import',sourceNamespace:h.runtime.nativeNamespace(),phase:'importing'}});
 const owner=h.user(2,'Otterchen','owner');h.app.chatCommands.mw(owner,'admin');const session=owner.sessions.find(s=>s.activeView==='team');h.event(owner,session,'mw:migration.start',{requestId:'start',view:'team',viewRevision:1});h.advance(10000);const sent=f.posts.at(-1);
 f.finish(sent,{migrationReceipt:{accepted:false,error:'request_conflict'}});assert.equal(h.runtime.migrationView().chunkIndex,0);assert.equal(h.runtime.migrationFrozen(),true);assert.match(h.runtime.migrationView().message,/noch nicht bestätigt/);assert.equal(h.runtime.receivedShow().active,true);
 h.advance(10000);assert.deepEqual(f.posts.at(-1).body.migrationChunk,sent.body.migrationChunk);
});

test('Nutzerlöschung invalidiert auch einen bereits exportierten, noch nicht zentral umgeschalteten Originalstand',()=>{
 const f=setup(),h=f.h;seed(h,[{text:'Eigenes Original'}]);const relay=JSON.parse(JSON.stringify(h.runtime.nativeRelayState()));relay.migration={migrationId:'prepared',phase:'exported',sourceRevision:'gebunden',offset:1,chunkIndex:1,protocolEpochAtStart:'public-cutover'};h.runtime.saveNativeRelayState(relay);f.finish();assert.equal(h.runtime.migrationFrozen(),true);
 h.app.onUserDeleted(3);assert.equal(h.runtime.migrationView().phase,'invalidated');assert.equal(h.runtime.nativeRelayState().deletions[0].applied,false);assert.equal(h.runtime.loadWishes().items.length,0);
});

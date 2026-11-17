const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../fixtures/relay-v2.cjs');const {seed,saved}=require('../fixtures/legacy-wishes.cjs');
const {createHarness}=require('../support/knuddels.cjs');
test('Originalbestand einschließlich Website, Empfang und Regiestufe übersteht beide Shutdown-Hooks unverändert',()=>{
 const f=setup();seed(f.h,[{text:'  Original 🎶  ',delivery:{nick:'Alter DJ',at:f.h.now()-200,senderKey:'9'},stage:'preparing'},
 {senderKey:'website:abcdef',nick:'Website',text:'Websitewunsch',submissionId:'web-old'},
 {senderKey:'',nick:'Android',source:'Android',submissionId:'android:external',externalSubmissionId:'external',displayName:null}]);
 const before=saved(f.store);f.h.app.onPrepareShutdown();f.h.app.onShutdown();const reboot=setup({store:f.store});
 assert.deepEqual(saved(reboot.store).items,before.items);assert.deepEqual(saved(reboot.store).controlVersions,before.controlVersions);
 assert.equal(reboot.h.runtime.receivedShow().active,false);
});
for(const failure of ['head','page'])test('Outbox-Schreibabbruch bei '+failure+' bestätigt nichts und erhält Originale und Wiederholungskennung',()=>{
 const f=setup(),h=f.h,u=h.user(3,'Hörer'),s=h.open(u);f.finish();seed(h,[{text:'Erhalten'}]);
 const before=JSON.stringify(saved(f.store)),write=f.store.setObject;
 f.store.setObject=(key,value)=>{if(failure==='head'?key==='mischwerk.wishes.v3':/^mischwerk.wishes.v3[.]/.test(key))throw Error('private-disk');write(key,value);};
 const receipt=h.event(u,s,'mw:wish.submit',{submissionId:'retry',text:'Nicht bestätigt'}).find(e=>e.type==='mw:wish.receipt').data;
 assert.equal(receipt.accepted,false);assert.equal(JSON.stringify(saved(f.store)),before);assert.doesNotMatch(JSON.stringify(receipt),/private-disk/);
 f.store.setObject=write;h.event(u,s,'mw:wish.submit',{submissionId:'retry',text:'Nicht bestätigt'});assert.equal(h.runtime.nativeRelayState().entries.length,1);
});
test('260 Unicodewünsche über 100 kB bleiben ohne Gesamtcap paginiert, vollständig und im Original erhalten',()=>{
 const f=setup();const rows=Array.from({length:260},(_,i)=>({text:String(i)+'🎶'.repeat(145)}));seed(f.h,rows);
 assert.ok(Buffer.byteLength(JSON.stringify(saved(f.store)))>100000);assert.ok(f.store.data['mischwerk.wishes.v3'].pages>1);
 for(const [key,value]of Object.entries(f.store.data))if(key.startsWith('mischwerk.wishes.v3.')){assert.ok(Buffer.byteLength(JSON.stringify(value))<90000);assert.ok(value.text.length<=10000);}
 const again=setup({store:f.store});assert.deepEqual(saved(again.store).items.map(v=>v.text),rows.map(v=>v.text));
});
test('Fehlende bestätigte Speicherseite wird niemals als leere Queue überschrieben; verwaiste Seiten werden bereinigt',()=>{
 const f=setup();seed(f.h,[{text:'Erhalten'}]);const head=f.store.data['mischwerk.wishes.v3'],name='mischwerk.wishes.v3.'+head.bank+'.0',page=f.store.data[name];delete f.store.data[name];
 const before=JSON.stringify(f.store.data);assert.throws(()=>createHarness(f.store),/WISH_STORAGE_FORMAT/);assert.equal(JSON.stringify(f.store.data),before);
 f.store.data[name]=page;const orphan='mischwerk.wishes.v3.'+(1-head.bank)+'.999';f.store.data[orphan]={version:1,text:'Alt'};
 const again=setup({store:f.store});assert.equal(again.h.runtime.wishItems().length,1);assert.equal(f.store.data[orphan],undefined);
});
test('Nutzerlöschung speichert zuerst zentralen Löschauftrag und entfernt ausschließlich zugehörige Texte und Empfangsidentität',()=>{
 const f=setup();seed(f.h,[{text:'Entfernen'},{senderKey:'4',text:'Bleibt',delivery:{nick:'Hörer',senderKey:'3',at:f.h.now()}}]);
 f.h.app.onUserDeleted(3);assert.equal(f.h.runtime.nativeRelayState().deletions.length,1);
 const rows=saved(f.store).items;assert.equal(rows.length,1);assert.equal(rows[0].text,'Bleibt');assert.equal(rows[0].delivery.nick,'Radio-Team');assert.equal(rows[0].delivery.senderKey,undefined);
});

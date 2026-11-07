// Synthetische Schlüssel/Vektoren; kein Netzwerk und keine echten Secrets.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function signing(options={}){const scope={MischWerkModules:{},RandomOperations:options.random===null?undefined:{getRandomString:options.random||((n,a)=>a.slice(0,n))}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../src/backend/android/signing.js'),'utf8'),scope);const runtime={now:()=>1793996865399};scope.MischWerkModules.attachAndroidSigning(runtime);return runtime;}
const payload='{"station":{"wishboxOpen":true,"onAir":false,"moderatorNick":null,"topic":null,"updatedAt":1793996865399},"wishUpdates":[]}';
test('Beide unveränderten Firebase-Dummy-Vektoren stimmen bytegenau',()=>{
 const r=signing();for(const [body,expected] of [['{}','0487288b27421657f5979a4beadb8ad1c7431b4fdef43415a4e6acc94cd8e174'],[payload,'ad684ff593903a9b892c0b2190a582c64db8d247cbb354f072ae9638f849d6ac']]){
 const value=r.androidSignFields(body,'test-key-not-a-secret','1793996865399','AbCdEf0123456789');assert.equal(value.sig,expected);assert.equal(value.payload,body);assert.deepEqual(Object.keys(value).sort(),['nonce','payload','sig','ts']);}
});
test('HMAC stimmt bei UTF-8, Ersatzzeichen, Blockgrenzen und langen Schlüsseln mit Node überein',()=>{
 const r=signing();for(const key of ['Jefe','\x0b'.repeat(20),'\xaa'.repeat(131),'Ä😀'])for(const text of ['', 'Hi There','ÄÖüß\r\n🎵😀','\ud800x\udc00','x'.repeat(55),'x'.repeat(64),'😀'.repeat(4096)]){
 assert.equal(r.androidHmacSha256(key,text),crypto.createHmac('sha256',key).update(text,'utf8').digest('hex'));}
});
test('Exakte Leerzeichen und JSON-Reihenfolge werden signiert und nicht normalisiert',()=>{
 const r=signing(),p=' {"b":2, "a":"Ä😀"}\n';const v=r.androidSignFields(p,'key','1793996865399','AbCdEf0123456789');
 assert.equal(v.payload,p);assert.equal(v.sig,crypto.createHmac('sha256','key').update('v1.'+v.ts+'.'+v.nonce+'.'+p).digest('hex'));
});
test('Ungültige Zeit, Nonce, Typen und überlange Nutzlasten werden vor dem Signieren abgewiesen',()=>{
 const r=signing();for(const [p,k,t,n] of [['{}','key','0','AbCdEf0123456789'],['{}','key','1.1','AbCdEf0123456789'],['{}','key','9007199254740992','AbCdEf0123456789'],['{}','key','1','A-Za-z0-9-------'],['x'.repeat(256001),'key','1','AbCdEf0123456789'],[{},'key','1','AbCdEf0123456789']])assert.throws(()=>r.androidSignFields(p,k,t,n));
});

test('RFC-4231-Vektor stimmt unabhängig von den Firebase-Beispielen',()=>{
 assert.equal(signing().androidHmacSha256('\x0b'.repeat(20),'Hi There'),'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
});

test('Nonce nutzt das vollständige dokumentierte Alphabet und JSON wird genau einmal serialisiert',()=>{
 let serialized=0,randomCalls=0;const r=signing({random:(n,a)=>{randomCalls++;assert.equal(n,16);assert.equal(a,'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');return new String('AbCdEf0123456789');}});
 const data=r.createAndroidSignedData({toJSON(){serialized++;return{topic:'Ä😀'};}},'dummy-key');
 assert.equal(serialized,1);assert.equal(randomCalls,1);assert.equal(data.payload,'{"topic":"Ä😀"}');
 assert.equal(data.sig,crypto.createHmac('sha256','dummy-key').update('v1.'+data.ts+'.'+data.nonce+'.'+data.payload).digest('hex'));
 assert.ok(!Object.values(data).includes('dummy-key'));
 for(const random of [null,()=> 'A-Za-z0-9-------',()=>'',()=>123])assert.throws(()=>signing({random}).createAndroidSignedData({},'dummy-key'));
 for(const now of [NaN,Infinity,0,1.5,-1]){const bad=signing();bad.now=()=>now;assert.throws(()=>bad.createAndroidSignedData({},'dummy-key'));}
});

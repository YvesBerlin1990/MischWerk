const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { createHarness, persistence } = require('../support/knuddels.cjs');
const key = 'mischwerk.nicklist-icons.v1';
const image = kind => 'https://mischwerk.invalid/img/nicklist/' + kind + '.png';
const icons = user => [...user.nicklistIcons.keys()].filter(url=>url.startsWith('https://mischwerk.invalid/')).map(url=>path.basename(url,'.png')).sort();
function fixture() {
  const h = createHarness(undefined,{users:[{id:1,nick:'Otterchen',role:'owner'},{id:2,nick:'DJ'},{id:3,nick:'Hörer'}]});
  const owner = h.user(1), dj = h.user(2), listener = h.user(3);
  const os = owner.sessions[0], ds = dj.sessions[0], ls = listener.sessions[0];
  const appoint = () => h.event(owner,os,'mw:addRadioModerator',{nick:dj.nick});
  const presence = (user,session,active,sequence) => h.event(user,session,'mw:listenerPresence',{active,sequence});
  return {h,owner,dj,listener,os,ds,ls,appoint,presence};
}
test('Gelieferte transparente PNGs mit 24 px Höhe und proportionalem MW-Zeichen und unverwechselbare Zielpfade sind inventarisiert',()=>{
  const hashes={team:'704c413878d750de5cc5e650b98a17664a2c981ef8baf38326998aa4b5175927',listener:'116b5e6bcc0aa246f8d630499c4fc46e6e2fe0971cd663d392bf59f30cde1709',moderator:'e3226d285d66bfa6cfd2c674eb48dc8a9e08f34d39eec231ce2299191ebb7fa2'};
  for (const kind of Object.keys(hashes)) {
    const app=process.env.MISCHWERK_TEST_UPLOAD||path.resolve(__dirname,'../../app');
    const bytes=fs.readFileSync(path.join(app,'www/img/nicklist',kind+'.png'));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),kind==='team'?32:24); assert.equal(bytes.readUInt32BE(20),24);
    assert.equal(bytes[25],6,'RGBA-PNG');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[kind]);
    assert.ok(require('../../tools/lib/frontend-files.cjs').frontendFiles.includes('img/nicklist/'+kind+'.png'));
  }
});



















function clientFixture(){
  let factory,position=null,now=1000;const messages=[],handlers={},audioHandlers={},windowHandlers={};
  const audio={muted:false,volume:.1,addEventListener:(name,fn)=>audioHandlers[name]=fn};
  const context={MischWerkUI:{define:(name,fn)=>factory=fn},navigator:{onLine:true},window:{addEventListener:(name,fn)=>windowHandlers[name]=fn}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../app/www/js/radio/listener.js'),'utf8'),context);
  const presence=factory({player:{playbackPosition:()=>position,playbackNow:()=>now},audio,commands:{send:(type,data)=>messages.push({type,data:JSON.parse(JSON.stringify(data))})},model:{view:'radio'},signals:{on:(name,fn)=>handlers[name]=fn}});
  presence.start();return {presence,audio,audioHandlers,windowHandlers,handlers,messages,step(value){position=value;now+=1000;presence.sample();},context};
}
test('Client: zwei plausible Fortschrittsmessungen, Nullfortschritt, Sprung und Wiederanlauf',()=>{
  const f=clientFixture();f.step(null);f.step(0);f.step(1);assert.equal(f.messages.length,0);f.step(2);
  assert.equal(f.messages.at(-1).data.active,true);f.step(2);assert.equal(f.messages.at(-1).data.active,false);
  f.step(3);f.step(4);assert.equal(f.messages.at(-1).data.active,true);f.step(200);assert.equal(f.messages.at(-1).data.active,false);
  f.step(201);f.step(202);assert.equal(f.messages.at(-1).data.active,true);
  for(let i=1;i<f.messages.length;i++)assert.ok(f.messages[i].data.sequence>f.messages[i-1].data.sequence);
});
test('Client: Mute, Lautstärke null, Stop, Nachladen, Fehler, Offline und Seitenende sofort inaktiv',()=>{
  for(const trigger of ['mute','zero','waiting','error','ended','pause','seeking','emptied','offline','stop','dispose']){
    const f=clientFixture();f.step(0);f.step(1);f.step(2);assert.equal(f.messages.at(-1).data.active,true);
    if(trigger==='mute'){f.audio.muted=true;f.audioHandlers.volumechange();}
    else if(trigger==='zero'){f.audio.volume=0;f.audioHandlers.volumechange();}
    else if(trigger==='offline')f.windowHandlers.offline();else if(trigger==='stop')f.handlers['playback-reset']();
    else if(trigger==='dispose')f.presence.dispose();else f.audioHandlers[trigger]();
    assert.equal(f.messages.at(-1).data.active,false,trigger);
  }
});
test('Client: Hintergrund bei Fortschritt bleibt aktiv; Refresh erneuert nur mit höherer Sequenz',()=>{
  const f=clientFixture();f.context.document={hidden:true};f.step(0);f.step(1);f.step(2);f.step(3);
  const before=f.messages.length,a=f.presence.renewal(),b=f.presence.renewal();
  assert.equal(a.active,true);assert.equal(b.active,true);assert.ok(b.sequence>a.sequence);assert.equal(f.messages.length,before);
  f.presence.dispose();f.presence.resume();f.step(4);assert.equal(f.presence.renewal().active,false);f.step(5);f.step(6);assert.equal(f.presence.renewal().active,true);
});
test('Bestehender Lifecycle erneuert im Hintergrund alle 20 Sekunden ohne weitere Abfrage und erhält /confirm',()=>{
  const p=require('../support/playback.cjs').playbackHarness();p.play();p.advance(4000);
  assert.equal(p.requests.filter(r=>r.type==='mw:listenerPresence').at(-1).data.active,true);
  p.document.hidden=true;p.document.emit('visibilitychange');p.advance(196000);
  const renewals=p.requests.filter(r=>r.type==='mw:refresh'&&r.data.listenerPresence);
  assert.equal(renewals.length,10);assert.ok(renewals.every(r=>r.data.listenerPresence.active));
  assert.ok(renewals.every((r,i)=>i===0||r.data.listenerPresence.sequence>renewals[i-1].data.listenerPresence.sequence));
  assert.equal(p.slashes.length,1);assert.equal(p.audio.playCalls,1);assert.equal(p.audio.paused,false);
  p.audio.volume=0;p.audio.emit('volumechange');assert.equal(p.requests.at(-1).type,'mw:listenerPresence');assert.equal(p.requests.at(-1).data.active,false);
  p.window.emit('pagehide');p.advance(20000);assert.equal(p.audio.paused,true);
});

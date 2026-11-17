const test=require('node:test'),assert=require('node:assert/strict');const {setup}=require('../fixtures/relay-v2.cjs');
function event(h,type='handover'){return {eventId:'explicit-event',eventSeq:1,type,createdAt:h.now(),moderatorNick:'Neuer DJ',previousModeratorNick:type==='handover'?'Bisheriger DJ':null,topic:''};}
for(const type of ['start','end','handover'])test('Explizites '+type+' nach stiller Basis genau einmal, unabhängig von Channelanwesenheit',()=>{
 const f=setup();f.finish();f.h.advance(5000);const row=event(f.h,type);f.finish(undefined,{broadcastEvents:[row],eventCursor:'cursor-event'});assert.equal(f.h.bot.messages.length,1);
 if(type==='handover'){assert.match(f.h.bot.messages[0],/Bisheriger DJ.*Neuer DJ/);}
 f.h.advance(5000);f.finish(undefined,{broadcastEvents:[row],eventCursor:'cursor-event'});assert.equal(f.h.bot.messages.length,1);
});
test('Botfehler wird nicht wiederholt und nimmt die bestätigte Projektion nicht zurück',()=>{
 const f=setup();f.finish();f.h.advance(5000);let attempts=0;f.h.bot.sendPublicMessage=()=>{attempts++;throw Error('private');};const row=event(f.h,'start');f.finish(undefined,{broadcastEvents:[row],eventCursor:'e'});
 assert.equal(attempts,1);assert.equal(f.h.runtime.receivedShow().active,true);f.h.advance(5000);f.finish(undefined,{broadcastEvents:[row],eventCursor:'e'});assert.equal(attempts,1);
});
test('Fehlender dauerhafter Vorabbeleg verhindert Botversuch; veraltete Ereignisse werden nicht nachgeholt',()=>{
 const f=setup();f.finish();f.h.advance(5000);const write=f.store.setObject;f.store.setObject=()=>{throw Error('disk');};f.finish(undefined,{broadcastEvents:[event(f.h)],eventCursor:'e'});assert.equal(f.h.bot.messages.length,0);f.store.setObject=write;
 f.h.advance(20000);f.finish(undefined,{broadcastEvents:[{...event(f.h),createdAt:f.h.now()-46000}],eventCursor:'old'});assert.equal(f.h.bot.messages.length,0);
});
test('unknown und Ende ohne Ereignis bleiben still, Neustart holt verpasste Ereignisse nicht nach',()=>{
 const f=setup();f.finish();f.h.advance(5000);f.finish(undefined,{station:{...f.response().station,broadcastState:'unknown',onAir:false,wishboxOpen:false,moderatorNick:null,topic:null,validUntil:0,updatedAt:0}});assert.equal(f.h.runtime.receivedShow().active,false);assert.equal(f.h.bot.messages.length,0);
 const again=setup({store:f.store});again.finish(undefined,{broadcastEvents:[{...event(again.h),eventSeq:2}],eventCursor:'after-restart'});assert.equal(again.h.bot.messages.length,0);
});

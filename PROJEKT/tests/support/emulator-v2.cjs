const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {AppRuntime}=require('./native-lab/runtime/app.cjs');const {profiles,defaults}=require('./native-lab/config.cjs');
function create(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'MischWerk-Emulator-V2-'));const posts=[],events=[],faults={...defaults};
 const external={canAccessURL:()=>true,postURL(url,args){posts.push({url,args,body:JSON.parse(args.data.payload)});}};
 const runtime=new AppRuntime({appDir:process.env.MISCHWERK_TEST_UPLOAD||path.resolve(__dirname,'../../app'),dataDir:directory,profiles,faults,external,emit:(kind,data)=>events.push({kind,...data})});
 runtime.persistence.api().setObject('mischwerk.android.private.v1',{enabled:true,runtimeVerified:true,syncSecret:'synthetic_'+ 'x'.repeat(45),syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',revision:0});runtime.start();
 t.after(()=>{runtime.shutdown();const target=path.resolve(directory);assert.ok(target.startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(target,{recursive:true,force:true});});
 function reply(extra={}){const post=posts.at(-1),now=runtime.clock.now();const body={contractVersion:2,accepted:true,serverTime:now,station:{contractVersion:2,authority:'studio',protocolEpoch:'emulator-public',revision:1,broadcastState:'live',onAir:true,wishboxOpen:true,moderatorNick:'DJ-Test',topic:'Emulator-Sendung',updatedAt:now,validUntil:now+45000},wishReceipts:[],ownWishStatuses:[],deletionReceipts:[],broadcastEvents:[],eventCursor:'initial',nickAccessPage:{snapshotId:'s'+now,revision:'a'.repeat(64),snapshotAt:now,validUntil:now+45000,items:[{nick:'DJ-Test'}],nextCursor:null,complete:true},...extra};runtime.invokeFunction(post.args.onSuccess,[JSON.stringify(body),{getResponseCode:()=>200,getURLString:()=>post.url}]);return post;}
 const join=nick=>{runtime.join(nick,nick);return [...runtime.contents.sessions.keys()].find(id=>runtime.contents.describe(id).nick===nick);};
 const state=(nick,id)=>{runtime.event(nick,id,'mw:refresh',{});return events.findLast(e=>e.kind==='sessionEvent'&&e.sessionId===id&&e.eventType==='mw:state').eventData;};
 return {runtime,posts,events,faults,reply,join,state};
}
module.exports={create};

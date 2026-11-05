// Echte Frontendmodule mit kontrollierter Medien-/Channelverbindung; kein nativer Idle-Server.
const fs=require('node:fs'),vm=require('node:vm');
const {TestClock}=require('../../tools/emulator/runtime/clock.cjs');
const {createHarness}=require('./knuddels.cjs');
function playbackHarness(){
 const errors=[],clock=new TestClock(error=>{throw error;}),factories={},nodes={},listeners={},requests=[],slashes=[],providerPolls=[];
 function target(){const handlers={},attributes={};return {classList:{add(){},toggle(){},remove(){}},hidden:false,disabled:false,
  setAttribute(key,value){attributes[key]=String(value);},getAttribute:key=>attributes[key],removeAttribute(key){delete attributes[key];},
  addEventListener(type,callback){(handlers[type]||(handlers[type]=[])).push(callback);},
  emit(type,event={}){for(const callback of handlers[type]||[])callback(event);}};}
 const document=Object.assign(target(),{hidden:false,readyState:'complete',documentElement:target(),body:target(),
  querySelectorAll:()=>[],getElementById:id=>nodes[id]||(nodes[id]=target())});
 const window=target(),navigator={onLine:true};
 const audio=Object.assign(target(),{paused:true,ended:false,seeking:false,error:null,readyState:0,volume:.1,playCalls:0});
 let base=0,began=clock.now(),frozen=false,revision=1,sequence=0,ack='all',throwSlash=false;
 Object.defineProperty(audio,'currentTime',{get:()=>base+(audio.paused||frozen?0:(clock.now()-began)/1000),set:value=>{base=value;began=clock.now();}});
 audio.play=()=>{audio.playCalls++;audio.paused=false;audio.ended=false;audio.readyState=4;began=clock.now();audio.emit('playing');};
 audio.pause=()=>{base=audio.currentTime;audio.paused=true;audio.emit('pause');};
 audio.load=()=>{base=0;audio.readyState=0;audio.error=null;audio.ended=false;audio.seeking=false;audio.emit('emptied');};
 const h=createHarness(),user=h.user(1,'Otterchen','owner'),state=h.state(user,h.open(user));state.view='radio';
 function reply(id){const data={...state,revision:++revision,refreshRequestId:id};for(const callback of listeners['mw:state']||[])callback({data});}
 const bridge={pageData:state,getHostFrame:()=>({setTitle(){}}),addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);},
  executeSlashCommand(command){if(throwSlash)throw Error('bridge');slashes.push({command,at:clock.now()});},
  sendEvent(type,data={}){requests.push({type,data,at:clock.now()});if(type==='mw:refresh'&&ack!=='none'&&!(ack==='hold'&&data.requestId))reply(data.requestId);}};
 const scope={window,document,navigator,Date:clock.Date,console,Array,isFinite,
  setInterval:(fn,ms)=>clock.add(fn,ms,true),clearInterval:id=>clock.clear(id),
  setTimeout:(fn,ms)=>clock.add(fn,ms),clearTimeout:id=>clock.clear(id),MischWerkUI:{define:(name,factory)=>{factories[name]=factory;}}};
 for(const file of ['core/signals','core/model','transport/commands','radio/connection','radio/player','transport/lifecycle']){
  vm.runInNewContext(fs.readFileSync('app/www/js/'+file+'.js','utf8'),scope,{filename:file});
 }
 const signals=factories.signals({}),model=factories.model({bridge,signals});
 const dom={el:document.getElementById,setText(id,text){document.getElementById(id).textContent=text;}};
 const layout={notify:message=>errors.push(message),resizeBar(){},resizeDialog(){}};
 const commands=factories.commands({bridge,model,layout,signals});
 const provider={status:()=> 'started',poll:()=>{providerPolls.push(clock.now());return Promise.resolve();},hasStation:()=>true,dispose(){}};
 const connection=factories.radioConnection({audio,signals});
 const player=factories.player({model,dom,signals,provider,connection,volume:{preparePlayback(){}},api:{audioUrl:()=>state.station?.streamUrl||'https://local.invalid/tone'}});
 factories.lifecycle({bridge,model,dom,layout,commands,player,signals,provider,wishes:null}).start([commands,player]);
 function advance(ms){while(ms>0){const step=Math.min(1000,ms);clock.advance(step);ms-=step;}}
 return {audio,bridge,document,model,signals,window,navigator,requests,slashes,errors,providerPolls,advance,reply,connection,
  play(){document.getElementById('play-button').emit('click');},stop:player.stop,
  ack(value){ack=value;},throwSlash(value){throwSlash=value;},
  shiftWall(value){scope.Date.now=()=>clock.now()+value;},
  freeze(value){base=audio.currentTime;began=clock.now();frozen=value;},
  activityRequests:()=>requests.filter(r=>r.type==='mw:refresh'&&r.data.requestId?.startsWith('playback-'))};
}
module.exports={playbackHarness};

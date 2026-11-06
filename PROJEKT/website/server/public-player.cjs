// Öffentlicher Appplayer ohne simulierte Nutzer, Testbackend oder Verwaltungsrechte.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function createPublicPlayer(root,bridge){
 const scope={MischWerkModules:{}};vm.createContext(scope);
 for(const file of ['config.js','radio/station.js'])vm.runInContext(fs.readFileSync(path.join(root,'src/backend',file),'utf8'),scope);
 const runtime={};scope.MischWerkModules.attachStation(runtime,scope.MischWerkConfig);
 const station=JSON.parse(JSON.stringify(runtime.station()));delete station.historyUrl;delete station.historyIgnoredTitles;
 let cached=null,pending=null;
 async function data(){
  let radio=null;
  if(bridge.configured){
   if(!cached||Date.now()-cached.at>10000){if(!pending)pending=bridge.publicRadio().then(value=>{cached={at:Date.now(),data:value.radio};}).catch(()=>{cached={at:Date.now(),data:null};}).finally(()=>{pending=null;});await pending;}
   radio=cached?.data;
  }
  return {view:'radio',station,user:{nick:'',canModerate:false,canManageRadioModerators:false,isOnAir:false,canEndModeration:false},
   topic:radio?.topic||'',moderator:radio?.moderator||null,revision:Date.now(),serverTime:Date.now(),shuttingDown:false,
   curtain:{closed:false,canManage:false},requestsEnabled:false,myRequests:[],queue:[],queueWindow:[],queueTotal:0,
   page:0,pages:1,limits:{maxTextLength:300,maxTopicLength:80},wishPositions:{available:false,items:[],total:0,nextPosition:null}};
 }
 async function html(){const state=await data();const injection='<base href="/app/www/"><link rel="stylesheet" href="/radio-site.css"><script>window.MischWerkPublicState='+JSON.stringify(state).replace(/</g,'\\u003c')+';</script><script src="/public-player.js"></script>';
  return fs.readFileSync(path.join(root,'app/www/index.html'),'utf8').replace('<head>','<head>'+injection);
 }
 return {data,html};
}
module.exports={createPublicPlayer};

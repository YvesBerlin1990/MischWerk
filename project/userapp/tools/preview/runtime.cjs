// Getrennte lokale Vorschau mit synthetischer Firebaseantwort; kein produktiver Brückenaufruf.
const {setup}=require('../../tests/fixtures/relay-v2.cjs');
function createPreviewRuntime(publicRadio,onEvent){
 const fixture=setup({onEvent,now:Date.now()}),harness=fixture.h;
 if(!publicRadio){harness.config.streampanel.streamUrl='';}
 harness.config.ownerNick='Testleitung';const owner=harness.user(1,'Testleitung','owner'),session=harness.open(owner);
 let completed=0;function completeSynthetic(){while(completed<fixture.posts.length){const post=fixture.posts[completed++],response=fixture.response();
   response.station.moderatorNick='Testleitung';if(publicRadio){Object.assign(response.station,{broadcastState:'unknown',onAir:false,wishboxOpen:false,moderatorNick:null,topic:null,validUntil:0,updatedAt:0});}
   response.wishReceipts=post.body.wishSubmissions.map((row,i)=>({submissionId:row.submissionId,accepted:true,state:'queued',position:i+1,error:null}));fixture.finish(post,response);
 }}
 completeSynthetic();if(publicRadio){session.remove();owner.online=false;}
 return {harness,owner,publicRadio,clockAt:Date.now(),completeSynthetic};
}
module.exports={createPreviewRuntime};

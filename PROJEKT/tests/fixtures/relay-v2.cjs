// Synthetische V2-Antworten über den echten vorhandenen postURL-Adapter.
const {createHarness,persistence}=require('../support/knuddels.cjs');
const secret='synthetic_key_'+ 'x'.repeat(40);
function setup(options={}){
 const posts=[],external={canAccessURL:()=>true,postURL(url,args){posts.push({url,args,body:JSON.parse(args.data.payload)});}};
 const store=options.store||persistence();
 store.data['mischwerk.android.private.v1']={enabled:true,runtimeVerified:true,syncUrl:'https://radio-mischwerk.web.app/api/publishKnuddelsState',syncSecret:secret,revision:1};
 const h=createHarness(store,{now:1800000000000,...options,serverMethods:{getExternalServerAccess:()=>external,...options.serverMethods}});
 function response(extra={}){return {contractVersion:2,accepted:true,serverTime:h.now(),station:{contractVersion:2,authority:'studio',protocolEpoch:'public-cutover',revision:1,
  broadcastState:'live',onAir:true,wishboxOpen:true,moderatorNick:'DJ-Test',topic:'Abendmusik',updatedAt:h.now(),validUntil:h.now()+45000},
  wishReceipts:[],ownWishStatuses:[],deletionReceipts:[],broadcastEvents:[],eventCursor:'events-initial',
  nickAccessPage:{snapshotId:'roster-'+h.now(),revision:'a'.repeat(64),snapshotAt:h.now(),validUntil:h.now()+45000,items:[{nick:'DJ-Test'}],nextCursor:null,complete:true},...extra};}
 function finish(post=posts.at(-1),extra={},status=200){post.args.onSuccess(JSON.stringify(response(extra)),{getResponseCode:()=>status,getURLString:()=>post.url});}
 return {h,store,posts,response,finish,secret};
}
module.exports={setup,secret};

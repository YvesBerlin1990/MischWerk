// Produktions-Website und echter Appcallback, ausschließlich durch lokales HTTP-Testmodell verbunden.
const {createHarness}=require('./harness.cjs');
const {createSiteBridge}=require('../../server/site-bridge.cjs');
const {createSiteServer}=require('../../server/server.cjs');
async function startSite(t,{origin,enabled=true}={}){
 const h=createHarness(),owner=h.user(1,'Otterchen','owner'),dj=h.user(2,'DJ-Test'),listener=h.user(3,'Testhörer'),radio=h.open(owner),calls=[],faults={};
 h.event(owner,radio,'mw:setRequests',{enabled:true});
 h.event(owner,radio,'mw:addRadioModerator',{nick:dj.nick});
 const bridge=createSiteBridge({MISCHWERK_APP_WEBHOOK:enabled?'https://app.example.invalid/website':''},async(url,options)=>{
  const data=options.body?JSON.parse(options.body):null;calls.push({operation:data?.operation,type:data?.type});
  if(faults.failNext){faults.failNext=false;throw Error('simulated connection loss');}
  const result=h.webhooks.invoke('website',{method:options.method,query:url.search.slice(1),body:options.body});
  const pending=JSON.parse(result.body).pending===true&&data?.operation==='action';
  if(pending)setImmediate(()=>h.flushPin());
  if(faults.loseNext&&data?.operation==='action'&&!pending){faults.loseNext=false;throw Error('simulated lost confirmation');}
  return new Response(result.body,{status:result.status,headers:result.headers});
 });
 const server=createSiteServer({env:origin?{MISCHWERK_PUBLIC_ORIGIN:origin}:{},bridge});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base='http://127.0.0.1:'+server.address().port;
 let cookie='',csrf='';
 async function api(path,data,extra={}){const response=await fetch(base+'/api/workspace/'+path,{method:data===undefined?'GET':'POST',headers:{Cookie:cookie,...(data===undefined?{}:{Origin:origin||base,'Content-Type':'application/json','X-CSRF-Token':csrf}),...extra},body:data===undefined?undefined:JSON.stringify(data)});
  if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const json=await response.json();if(json.csrf)csrf=json.csrf;return {response,json};}
 async function login(person=owner){await api('session');const result=await api('login',{});h.app.chatCommands.mw(person,'homepage ' + result.json.code);await api('login-status');return api('state',{view:'studio'});}
 return{h,owner,dj,listener,radio,base,server,bridge,faults,calls,api,login,get cookie(){return cookie;}};
}
module.exports={startSite};

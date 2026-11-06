// Geschützte Website-API: Origin + CSRF, HttpOnly-Sitzung, bestätigte Appidentität.
const {randomBytes,timingSafeEqual}=require('node:crypto');
const {createSessions,token}=require('./sessions.cjs');
function createWorkspaceApi({bridge,origin,clock=Date.now}){
 const sessions=createSessions({secure:origin.startsWith('https:'),clock}),rates=new Map();
 function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
 function safe(a,b){return typeof a==='string'&&/^[a-f0-9]{64}$/.test(a)&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
 function limit(req){const key=req.socket.remoteAddress,now=clock();for(const [ip,row]of rates)if(now-row.at>=60000)rates.delete(ip);const row=rates.get(key)||{at:now,count:0};row.count++;rates.set(key,row);return row.count>180;}
 return async function workspaceApi(req,res,url){
  if(!url.pathname.startsWith('/api/workspace/'))return false;
  if(limit(req)){json(res,429,{message:'Bitte warte einen Moment.'});return true;}
  if(!['GET','POST'].includes(req.method)){json(res,405,{message:'Diese Anfrage ist nicht verfügbar.'});return true;}
  if(req.method==='POST'&&(req.headers.origin!==origin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))){json(res,403,{message:'Bitte verwende den Arbeitsbereich auf dieser Website.'});return true;}
  const item=sessions.get(req,res);let data={};
  if(req.method==='POST'){
   if(!safe(req.headers['x-csrf-token'],item.csrf)){json(res,403,{message:'Bitte die Anmeldung neu laden.'});return true;}
   let raw='';for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>8500){json(res,413,{message:'Die Eingabe ist zu lang.'});return true;}}
   try{data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();}catch{json(res,400,{message:'Ungültige Eingabe.'});return true;}
  }
  try{
   if(req.method==='GET'&&url.pathname==='/api/workspace/session'){
    json(res,200,{csrf:item.csrf,available:bridge.configured,approved:item.approved,code:item.code||null,expiresAt:item.pairExpires||null});return true;
   }
   if(!bridge.configured){json(res,503,{message:'Der Arbeitsbereich ist noch nicht mit der App verbunden.'});return true;}
   if(req.method==='POST'&&url.pathname==='/api/workspace/login'){
    if(item.appToken)await bridge.control(item.appToken,'logout').catch(()=>{});
    const appToken=token(),code=randomBytes(16).toString('hex');
    const result=await bridge.control(appToken,'login.begin',{code});
    item.appToken=appToken;item.code=code;item.approved=false;item.pairExpires=result.expiresAt;
    json(res,200,{code,expiresAt:result.expiresAt});return true;
   }
   if(req.method==='POST'&&url.pathname==='/api/workspace/logout'){
    if(item.appToken)await bridge.control(item.appToken,'logout').catch(()=>{});sessions.drop(item,res);json(res,200,{ok:true});return true;
   }
   if(!item.appToken){json(res,401,{message:'Bitte zuerst anmelden.'});return true;}
   if(req.method==='GET'&&url.pathname==='/api/workspace/login-status'){
    const result=await bridge.control(item.appToken,'login.status');
    if(!result.pending&&!item.approved){item.approved=true;item.code=null;sessions.rotate(item,res);}
    json(res,200,{approved:item.approved,csrf:item.csrf});return true;
   }
   if(!item.approved){json(res,401,{message:'Bitte die Anmeldung im Channel bestätigen.'});return true;}
   if(req.method==='POST'&&url.pathname==='/api/workspace/state'){
    const result=await bridge.control(item.appToken,'state',{view:data.view,page:data.page,week:data.week,schedulePage:data.schedulePage,radioModeratorPage:data.radioModeratorPage});
    if(data.view==='schedule'&&result.state.schedule.pages>1){
     const plan=result.state.schedule,entries=plan.entries.slice();
     for(let page=1;page<plan.pages;page++){const next=await bridge.control(item.appToken,'state',{view:'schedule',week:plan.week,schedulePage:page});const part=next.state.schedule;
      if(part.week!==plan.week||part.revision!==plan.revision||part.previousRevision!==plan.previousRevision||part.boundaryRevision!==plan.boundaryRevision)throw Object.assign(Error('Der Plan wurde inzwischen geändert. Bitte erneut laden.'),{status:409});entries.push(...part.entries);}
     plan.entries=entries;
    }
    json(res,200,{state:result.state});return true;
   }
   if(req.method==='POST'&&url.pathname==='/api/workspace/action'){
    const result=await bridge.control(item.appToken,'action',{type:data.type,data:data.data,requestId:data.requestId});json(res,200,{ok:true,message:result.message});return true;
   }
   json(res,404,{message:'Nicht gefunden.'});
  }catch(error){if(error.status===401){sessions.drop(item,res);}json(res,[400,401,403,409,429].includes(error.status)?error.status:503,{message:error.status&&error.message||'Die Appverbindung ist derzeit nicht verfügbar. Deine Eingaben bleiben erhalten.'});}
  return true;
 };
}
module.exports={createWorkspaceApi};

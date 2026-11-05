// Website-Sitzungen bleiben serverseitig; kein Appzugriffstoken gelangt in den Browser.
const {randomBytes}=require('node:crypto');
const token=()=>randomBytes(32).toString('hex');
function createSessions({secure=false,clock=Date.now}={}){
 const entries=new Map();
 function clean(){for(const [key,item] of entries)if(clock()>=item.expires||clock()-item.touched>=1800000)entries.delete(key);}
 function cookie(res,key){res.setHeader('Set-Cookie','mw_workspace='+key+'; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age='+(key?'28800':'0')+(secure?'; Secure':''));}
 function get(req,res){clean();const match=/(?:^|;\s*)mw_workspace=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'');let item=match&&entries.get(match[1]);
  if(!item){if(entries.size>=200)throw Error('Zu viele Anmeldungen. Bitte später versuchen.');item={key:token(),csrf:token(),expires:clock()+28800000,touched:clock(),appToken:null,approved:false};entries.set(item.key,item);cookie(res,item.key);}
  item.touched=clock();return item;
 }
 function rotate(item,res){entries.delete(item.key);item.key=token();item.csrf=token();entries.set(item.key,item);cookie(res,item.key);}
 function drop(item,res){entries.delete(item.key);cookie(res,'');}
 return {get,rotate,drop};
}
module.exports={createSessions,token};

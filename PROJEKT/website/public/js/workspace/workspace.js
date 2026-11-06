/* Websitearbeitsbereich: bestätigter Zustand, private Entwürfe im DOM und ein sichtbarkeitsabhängiger Abgleich. */
(function(){'use strict';var csrf='',approved=false,available=false,timer,loading=false,busy=false,generation=0,pendingAction=null,subscribers=[],viewOptions={studio:{},team:{},schedule:{}};
 var factories={};window.MischWerkUI={define:function(name,factory){factories[name]=factory;}};
 var W=window.MischWerkWorkspace={state:null,view:'studio',studioTab:'programme',options:{},factories:factories,
  el:function(id){return document.getElementById(id);},node:function(tag,text){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},
  message:function(text,error){var n=W.el('workspace-message');n.textContent=text;n.className='section-status '+(error?'error':'success');},
  onState:function(fn){subscribers.push(fn);if(W.state)fn(W.state);},notify:function(){subscribers.forEach(function(fn){fn(W.state);});document.dispatchEvent(new Event('workspace:view'));}
 };
 async function request(path,data){var controller=new AbortController(),timeout=setTimeout(function(){controller.abort();},15000);
  try{var response=await fetch('/api/workspace/'+path,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',signal:controller.signal});var result=await response.json();
   if(!response.ok){var error=Error(result.message||'Die Anfrage konnte nicht bestätigt werden.');error.status=response.status;throw error;}return result;
  }finally{clearTimeout(timeout);}
 }
 function clearPrivate(){approved=false;W.state=null;W.view='studio';W.studioTab='programme';viewOptions={studio:{},team:{},schedule:{}};W.options=viewOptions.studio;pendingAction=null;generation++;W.el('workspace').hidden=true;W.el('login-panel').hidden=false;W.el('workspace-user').textContent='';
  document.querySelectorAll('#workspace form').forEach(function(form){form.reset();});['team-list','plan-list','queue-text','queue-sender','queue-position','handover-private-note','handover-received','history-list','studio-presenter','studio-expiry','handover-status','handover-target','plan-range','team-page','history-page'].forEach(function(id){W.el(id).replaceChildren();});W.notify();
 }
 function show(){W.el('workspace').hidden=!approved;W.el('login-panel').hidden=approved;
  ['studio','team','schedule'].forEach(function(view){W.el(view+'-view').hidden=W.view!==view;});
  document.querySelectorAll('[data-view]').forEach(function(button){button.setAttribute('aria-current',button.dataset.view===W.view?'page':'false');});
  if(W.state){W.el('workspace-user').textContent=W.state.user.nick+' · '+(W.state.user.canManageRadioModerators?'Channelinhaber':'Radiomoderation');W.el('team-navigation').hidden=!W.state.user.canManageRadioModerators;}
 }
 function schedule(){clearTimeout(timer);if(document.hidden)return;timer=setTimeout(function(){if(approved)W.load();else if(W.el('login-code-area').hidden===false)checkLogin();},approved?5000:3000);}
 async function failure(error){W.message(error.status?error.message:'Keine Bestätigung erhalten. Deine Eingaben bleiben erhalten. Bitte erneut prüfen.',true);if(error.status===401){clearPrivate();await session();}}
 W.load=async function(){if(!approved||busy||document.hidden){schedule();return;}if(loading)return;loading=true;var selected=generation;
  try{var result=await request('state',Object.assign({view:W.view},W.options));if(selected!==generation)return;W.state=result.state;show();W.notify();}
  catch(error){if(selected===generation)await failure(error);}finally{loading=false;if(selected!==generation&&approved)W.load();else schedule();}
 };
 W.act=async function(type,data){if(busy||!approved)return false;busy=true;generation++;var signature=JSON.stringify({type:type,data:data});
  if(!pendingAction||pendingAction.signature!==signature)pendingAction={signature:signature,id:crypto.randomUUID()};
  var controls=Array.from(document.querySelectorAll('#workspace input,#workspace textarea,#workspace select,#workspace button')).map(function(n){var old=n.disabled;n.disabled=true;return[n,old];});
  W.message('Wird gespeichert …');var success=false;
  try{var result=await request('action',{type:type,data:data,requestId:pendingAction.id});pendingAction=null;W.message(result.message||'Gespeichert.');success=true;}
  catch(error){await failure(error);}finally{busy=false;controls.forEach(function(pair){pair[0].disabled=pair[1];});if(approved)await W.load();}
  return success;
 };
 W.select=async function(view){if(busy||!approved)return;W.view=view;W.options=viewOptions[view];generation++;show();await W.load();};
 W.changeOptions=async function(values){Object.assign(W.options,values);generation++;await W.load();};
 async function session(){try{var data=await request('session');csrf=data.csrf;available=data.available;approved=data.approved;W.el('login-start').disabled=!available;
  if(data.code){W.el('login-code').textContent='/mischwerk-web '+data.code;W.el('login-code-area').hidden=false;}else W.el('login-code-area').hidden=true;
  show();if(approved)await W.load();else W.message(available?'Bereit für deine Anmeldung.':'Der Arbeitsbereich ist noch nicht mit der App verbunden.',!available);
 }catch(error){W.message('Die Websiteverbindung ist gerade nicht verfügbar.',true);}schedule();}
 async function checkLogin(){try{var data=await request('login-status');csrf=data.csrf||csrf;if(data.approved){approved=true;W.el('login-code-area').hidden=true;W.message('Anmeldung bestätigt.');show();await W.load();}}catch(error){await failure(error);}schedule();}
 W.el('login-start').addEventListener('click',async function(){this.disabled=true;try{var data=await request('login',{});W.el('login-code').textContent='/mischwerk-web '+data.code;W.el('login-code-area').hidden=false;W.el('login-expires').textContent='Der Code gilt drei Minuten und kann einmal bestätigt werden.';W.message('Bitte bestätige die Anmeldung jetzt selbst im Channel.');}catch(error){await failure(error);}finally{this.disabled=!available;schedule();}});
 W.el('login-copy').addEventListener('click',async function(){try{await navigator.clipboard.writeText(W.el('login-code').textContent);W.message('Befehl kopiert. Bitte selbst im Channel ausführen.');}catch{W.message('Bitte den angezeigten Befehl markieren und kopieren.',true);}});
 W.el('login-check').addEventListener('click',checkLogin);W.el('workspace-refresh').addEventListener('click',function(){W.load();});
 W.el('logout').addEventListener('click',async function(){try{await request('logout',{});clearPrivate();await session();W.message('Du bist abgemeldet.');}catch{clearPrivate();W.message('Die Abmeldung konnte nicht bestätigt werden. Bitte erneut verbinden und abmelden.',true);}});
 document.querySelectorAll('[data-view]').forEach(function(button){button.addEventListener('click',function(){W.select(button.dataset.view);});});
 document.addEventListener('visibilitychange',function(){clearTimeout(timer);if(!document.hidden){if(approved)W.load();else if(!W.el('login-code-area').hidden)checkLogin();}});window.addEventListener('pagehide',function(){clearTimeout(timer);generation++;});
 document.querySelectorAll('textarea').forEach(function(field){function resize(){field.style.height='auto';field.style.height=field.scrollHeight+'px';}field.addEventListener('input',resize);});
 W.request=request;W.show=show;session();
})();

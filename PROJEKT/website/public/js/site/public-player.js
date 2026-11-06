// Kompatibilitätsadapter für den vorhandenen öffentlichen Player, keine Knuddels-Sitzung.
(function(){'use strict';var handlers={},initial=window.MischWerkPublicState;
 function emit(state,id){state.refreshRequestId=id||null;(handlers['mw:state']||[]).forEach(function(fn){fn({data:state});});}
 window.Client={pageData:initial,isK3Client:function(){return false;},
 includeJS:function(file){document.write('<script src="'+file+'"><\/script>');},includeCSS:function(file){document.write('<link rel="stylesheet" href="'+file+'">');},
 getHostFrame:function(){return{setTitle:function(){},setSize:function(width,height){parent.postMessage({type:'website-radio-size',height:height},location.origin);}};},
 addEventListener:function(type,fn){(handlers[type]||(handlers[type]=[])).push(fn);},
 sendEvent:function(type,data){if(type!=='mw:ready'&&type!=='mw:refresh')return;fetch('/api/public/radio',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(state){emit(state,data&&data.requestId);}).catch(function(){});}};

  ['playing','pause','ended','error'].forEach(function(type){document.addEventListener(type,function(event){if(event.target.id==='radio-audio')parent.postMessage({type:'website-player-status',active:!event.target.paused&&!event.target.ended&&!!event.target.currentSrc},location.origin);},true);});
})();

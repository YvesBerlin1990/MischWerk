// Sichtbare Textzeilen und echte Eingabeflächen prüfen, einschließlich nativer Scrollclips.
async function inspectLayout(page) {
 return page.evaluate(()=>{
  const controls='button,input,textarea,select',items=[],issues=[];
  function name(n){return n.id||n.className||n.tagName;}
  function visible(n){return n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'&&!n.closest('.sr-only,[aria-hidden=true]');}
  function clip(rect,node){
   const r={left:Math.max(0,rect.left),right:Math.min(innerWidth,rect.right),top:Math.max(0,rect.top),bottom:Math.min(innerHeight,rect.bottom)};
   for(let p=node;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();
    if(/auto|scroll|hidden|clip/.test(s.overflowX)){r.left=Math.max(r.left,b.left);r.right=Math.min(r.right,b.right);}
    if(/auto|scroll|hidden|clip/.test(s.overflowY)){r.top=Math.max(r.top,b.top);r.bottom=Math.min(r.bottom,b.bottom);}
   }
   return r.right-r.left>1&&r.bottom-r.top>1?r:null;
  }
  for(const node of document.querySelectorAll(controls))if(visible(node)){
   const b=node.getBoundingClientRect(),r=clip(b,node);
   if(b.left<-.5||b.right>innerWidth+.5)issues.push('Überbreite: '+name(node));
   if(r)items.push({node,r,name:name(node)});
  }
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const text=walker.currentNode,node=text.parentElement;
   if(!text.textContent.trim()||!visible(node)||node.closest(controls+',script,style,svg'))continue;
   const range=document.createRange();range.selectNodeContents(text);
   for(const rect of range.getClientRects()){const r=clip(rect,node);if(r)items.push({node,r,name:name(node)+': '+text.textContent.trim().slice(0,45)});}
  }
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j];if(a.node===b.node||a.node.contains(b.node)||b.node.contains(a.node))continue;
   if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)issues.push(a.name+' ↔ '+b.name);
  }
  return {view:document.documentElement.dataset.view,size:[innerWidth,innerHeight],issues};
 });
}
module.exports={inspectLayout};

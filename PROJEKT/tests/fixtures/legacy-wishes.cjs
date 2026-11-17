// Nur synthetischer Originalbestand im vorhandenen paginierten Speicher.
function seed(h,rows){
 const before=h.runtime.loadWishes(),next=JSON.parse(JSON.stringify(before));
 next.items=rows.map((row,index)=>({id:index+1,senderKey:'3',nick:'Hörer',text:'Original '+index,submissionId:'original-'+index,createdAt:h.now()-1000,delivery:null,...row}));
 next.nextId=next.items.length+1;next.revision+=1;
 h.runtime.updateStudioWishState(before,next);h.runtime.updateWishControlState(before,next);h.runtime.commitWishMetadata(next);return next;
}
function saved(store){const key='mischwerk.wishes.v3',head=store.data[key];return JSON.parse(Array.from({length:head.pages},(_,i)=>store.data[key+'.'+head.bank+'.'+i].text).join(''));}
module.exports={seed,saved};

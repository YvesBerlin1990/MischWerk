const assert=require('node:assert/strict');
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function reveal(page,selector){
 await settle(page);const target=page.locator(selector);assert.ok(await target.count(),selector+' existiert');
 if(!await target.isVisible()){
  const id=await target.evaluate(n=>n.closest('#handover-panel')?'handover-paging':'studio-paging');
  const nav=page.locator('#'+id),buttons=nav.locator('button');let guard=0;
  async function turn(button){
   try{await button.focus();await button.press('Enter',{timeout:2000});}catch(error){
    if(await target.isVisible())return;throw error;
   }await settle(page);
  }
  while(await nav.isVisible()&&!await buttons.first().isDisabled()&&guard++<30)await turn(buttons.first());
  while(!await target.isVisible()&&await nav.isVisible()&&!await buttons.last().isDisabled()&&guard++<60)await turn(buttons.last());
 }
 assert.equal(await target.isVisible(),true,selector+' ist ohne Scrollen erreichbar');
}
async function readText(page,selector,area='studio'){
  await reveal(page,selector,area);
  const node=page.locator(selector),nav=node.locator('xpath=following-sibling::nav[1]');
  if(!await nav.isVisible())return node.textContent();
  const buttons=nav.locator('button');let guard=0;
  while(!await buttons.first().isDisabled()&&guard++<100)await buttons.first().click();
  let text=await node.textContent();
  while(!await buttons.last().isDisabled()&&guard++<200){await buttons.last().click();text+=await node.textContent();}
  assert.ok(guard<200);return text;
}
async function fits(page){
 await settle(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1),false);
 for(const button of await page.locator('#studio-panel button:visible').all()){
  const rect=await button.boundingBox();assert.ok(rect&&rect.width>=44&&rect.height>=44);
  const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  assert.ok(rect.x>=-1&&rect.x+rect.width<=viewport.width+1&&rect.y>=-1&&rect.y+rect.height<=viewport.height+1,'Bedienziel vollständig im Fenster: '+await button.getAttribute('id'));
 }
}
async function login(page){
 if(!await page.locator('#on-air').isVisible()||await page.locator('#on-air').isDisabled())return false;
 await reveal(page,'#on-air');await page.locator('#on-air').click();
 await page.locator('#off-air:not([disabled])').waitFor();return true;
}
// Bestehende Backendverträge unabhängig von der jetzt rein lesenden Wunschliste prüfen.
async function resolveRequest(page,outcome='done',id){
 await page.evaluate(({outcome,id})=>Client.sendEvent('mw:resolveRequest',{
  id:id||Number(document.querySelector('.queue-item').dataset.wishId),outcome}),{outcome,id});
}
async function stageRequest(page,stage,previousStage='queued'){
 await page.evaluate(({stage,previousStage})=>Client.sendEvent('mw:setWishStage',{
  id:Number(document.querySelector('.queue-item').dataset.wishId),stage,previousStage}),{stage,previousStage});
}
module.exports={reveal,readText,fits,settle,login,resolveRequest,stageRequest};

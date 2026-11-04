const assert=require('node:assert/strict');
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function reveal(page,selector,area='studio'){
  await settle(page);
  if(await page.locator(selector).isVisible())return;
  const detail=page.locator('#queue-detail-toggle');
  if(await detail.isVisible()&&await page.locator(selector).count()&&await page.locator(selector).evaluate(n=>!!n.closest('.queue-toolbar,.queue-copy'))){
    await detail.click();await settle(page);
    if(await page.locator(selector).isVisible())return;
  }
  const pager=page.locator('#'+area+'-paging');
  if(!await pager.isVisible())throw Error('Nicht erreichbare Bediengruppe: '+selector);
  const previous=pager.locator('[data-part-previous]'),next=pager.locator('[data-part-next]');
  async function turn(button){
    try{await button.click({timeout:5000});}
    catch(error){if(!await page.locator(selector).isVisible())throw error;}
    await settle(page);
  }
  let guard=0;
  while(!await previous.isDisabled()&&guard++<30){await turn(previous);if(await page.locator(selector).isVisible())return;}
  while(!await page.locator(selector).isVisible()&&!await next.isDisabled()&&guard++<60){await turn(next);}
  assert.equal(await page.locator(selector).isVisible(),true,selector+' ist ohne Scrollen erreichbar');
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
  await settle(page);
  const result=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,
    outside:[...document.querySelectorAll('#studio-panel button')].filter(n=>n.getClientRects().length).filter(n=>{const b=n.getBoundingClientRect();return b.top<0||b.bottom>innerHeight+1||b.left<0||b.right>innerWidth+1;}).map(n=>n.id||n.textContent)}));
  assert.equal(result.scroll,false);assert.deepEqual(result.outside,[]);
}
module.exports={reveal,readText,fits,settle};

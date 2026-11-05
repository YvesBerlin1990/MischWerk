// Der echte aktuelle Appadapter wird ausschließlich im isolierten API-Modell aktiviert.
const {createHarness:baseHarness,persistence}=require('../../../tests/support/knuddels.cjs');
const {TestWebHooks}=require('./webhooks.cjs');
function createHarness(){const webhooks=new TestWebHooks();const store=persistence({'mischwerk.website.enabled.v1':true});
 const h=baseHarness(store,{serverMethods:{getWebHookAccess:()=>webhooks.api()}});h.webhooks=webhooks;return h;}
module.exports={createHarness};

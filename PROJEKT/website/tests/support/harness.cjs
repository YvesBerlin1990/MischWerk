const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHarness:baseHarness}=require('../../../tests/support/knuddels.cjs');
const {TestWebHooks}=require('./webhooks.cjs');
function createHarness(){
  const webhooks=new TestWebHooks();let websiteInfo;
  const h=baseHarness(undefined,{serverMethods:{getWebHookAccess:()=>webhooks.api()},configureModules(context){
    for(const file of ['wishes.js','website.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../integration',file),'utf8'),context,{filename:'website/integration/'+file});
    const modules=context.MischWerkModules,attach=modules.attachLifecycle;
    modules.attachLifecycle=function(runtime,config){
      attach(runtime,config);modules.attachWebsiteWishes(runtime);modules.attachWebsite(runtime,config);
      const start=runtime.start;runtime.start=function(){start();runtime.registerWebsite();};websiteInfo=runtime.websiteInfo;
    };
  }});
  h.webhooks=webhooks;h.app.chatCommands['mischwerk-web']=websiteInfo;return h;
}
module.exports={createHarness};

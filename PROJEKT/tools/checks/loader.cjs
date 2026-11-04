// Expliziter lesender Nachweis des öffentlichen Knuddels-Laders. Nie Teil der App.
// Führt nur dessen isolierte Lade-Komponente lokal aus, ohne Bridge oder Chatverbindung.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const url = 'https://chatproxy.knuddels.de/apps/apploader/app-loader.html';
async function checkLoader() {
  const response = await fetch(url, { credentials:'omit', redirect:'error',
    headers:{'Cache-Control':'no-cache'}, signal:AbortSignal.timeout(10000) });
  assert.equal(response.status,200,'Öffentlicher Loader nicht abrufbar');
  const bytes = Buffer.from(await response.arrayBuffer()), source = bytes.toString('utf8');
  const marker = 'function(e,t,n){"use strict";n.r(t),n.d(t,"create",function(){return r}),n.d(t,"destroy",function(){return o});';
  const from = source.indexOf(marker), to = source.indexOf('},function(',from);
  assert.ok(from >= 0 && to > from,'Öffentliche Lade-Komponente geändert; erneut untersuchen');
  const component = source.slice(from,to+1), css = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(component.includes('htmluiContentLoadingIndicator') && css,'Lade-Komponente oder Styles fehlen');
  const browser = await chromium.launch({ headless:true, channel:'msedge' });
  const cases = [];
  try {
    const context = await browser.newContext({ viewport:{width:560,height:340} });
    await context.route('**/*',route => route.abort());
    const page = await context.newPage();
    for (const enabled of [false,true]) {
      await page.setContent('<html><head><style>'+css+'</style></head><body><div id="appContentV2">Lade…</div></body></html>');
      const result = await page.evaluate(({component,enabled}) => {
        const exports = {};
        function dependency(id) {
          if (id === 0) return {knuddelsConsole:{log(){},error(){}}};
          throw Error('Unerwartete Abhängigkeit der isolierten Lade-Komponente');
        }
        dependency.r = () => {};
        dependency.d = (target,key,get) => Object.defineProperty(target,key,{get});
        (0,eval)('('+component+')')({},exports,dependency);
        exports.create({ enabled,text:'',backgroundColor:{r:36,g:36,b:36,a:1},foregroundColor:{r:36,g:36,b:36,a:1} });
        const indicator = document.getElementById('htmluiContentLoadingIndicator');
        const result = { enabled,indicator:!!indicator,
          indicatorBackground:indicator ? getComputedStyle(indicator).backgroundColor : null,
          text:indicator?.textContent ?? null,rootBackground:getComputedStyle(document.documentElement).backgroundColor };
        exports.destroy();
        result.removed = !document.getElementById('htmluiContentLoadingIndicator');
        return result;
      },{component,enabled});
      assert.equal(result.indicator,enabled);
      assert.equal(result.rootBackground,'rgb(255, 255, 255)');
      assert.equal(result.removed,true);
      if (enabled) { assert.equal(result.indicatorBackground,'rgb(36, 36, 36)');assert.equal(result.text,''); }
      cases.push(result);
    }
    return { checkedAt:new Date().toISOString(),url,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
      scope:'Öffentliche Lade-Komponente isoliert in Edge; keine echte STAPP-/Bridge- oder Vor-Konfigurationsabnahme.',cases };
  } finally { await browser.close(); }
}
if (require.main === module) checkLoader().then(report => console.log(JSON.stringify(report,null,2)))
  .catch(error => {console.error(error);process.exitCode=1;});
module.exports = { checkLoader };

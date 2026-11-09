const {previewCurtain}=require('../../../tests/support/preview-command.cjs');
// Lokale Website mit echtem Appplayer; Anbieterantworten und Testton bleiben synthetisch.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { spcastStatistics } = require('../../../tests/fixtures/stream.cjs');
let browser, child, base;
test.before(async () => {
  child = spawn(process.execPath, ['tools/preview/server.cjs'], { cwd:path.resolve(__dirname, '../..'), windowsHide:true, env:{...process.env, MISCHWERK_PREVIEW_PORT:'0', MISCHWERK_WEBSITE_TEST:'1', MISCHWERK_SMTP_USER:'', MISCHWERK_SMTP_PASSWORD:'', MISCHWERK_APP_WEBHOOK:''} });
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Preview startup timeout')), 8000);
    child.on('error', reject);
    child.stdout.on('data', chunk => { const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
  });
  browser = await chromium.launch({headless:true, channel:'msedge'});
});
test.after(async () => { await browser?.close(); child?.kill(); });
async function setup(t) {
  const context = await browser.newContext({viewport:{width:1440, height:1000}});
  t.after(() => context.close());
  const errors = [], external = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route('https://**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'scripts.streampanel.net') return route.fulfill({json:{currentSong:'Prüftitel mit vollständiger Anzeige',currentArtist:'Testinterpret'}});
    if (url.hostname === 'mischwerk.spcast.eu' && url.pathname === '/sp/cache/history/history.json') return route.fulfill({json:[{timestamp:Math.floor(Date.now()/1000)-5,metadata:{song:'Testinterpret - Prüftitel mit vollständiger Anzeige'}}]});
    if (url.hostname === 'mischwerk.sp.radio.fm' && url.pathname === '/statistics') return route.fulfill({json:spcastStatistics()});
    if (url.hostname === 'mischwerk.sp.radio.fm' && url.pathname === '/scripts/whoIsLive.php') return route.fulfill({contentType:'text/plain',body:'autodj'});
    if (url.hostname === 'mischwerk.sp.radio.fm' && url.pathname === '/stream') return route.fulfill({contentType:'audio/wav',body:require('../../../tests/fixtures/audio.cjs').audioFixture()});
    external.push(url.href); return route.abort();
  });
  return {context, page:await context.newPage(), errors, external};
}
async function cleanText(page) {
  for (const frame of page.frames()) {
    const copy = await frame.evaluate(() => document.body.innerText + '\n' + document.title + '\n' + [...document.querySelectorAll('[title],[aria-label],[aria-description],[aria-valuetext],[placeholder],img[alt]')].map(n => ['title','aria-label','aria-description','aria-valuetext','placeholder','alt'].map(a => n.getAttribute(a) || '').join(' ')).join('\n'));
    assert.doesNotMatch(copy, /Otterchen|Knuddels|Polaroid|Musikfreund|Mixfreund|Klangwelle|RadioKing|STREAMPANEL|SPCast/i);
  }
}
test('Startseite: direkter Player, vollständige Bedienung und ruhende Audioquelle bei allen Websitebreiten', async t => {
  const {page, errors, external} = await setup(t);
  await page.goto(base);
  const radio = page.frameLocator('#radio-frame');
  await radio.locator('#track-title').filter({hasText:'Prüftitel'}).waitFor();
  for (const width of [1440,1024,768,560,390,320]) {
    await page.setViewportSize({width,height:1000});
    await page.waitForTimeout(120);
    await cleanText(page);
    for (const frame of page.frames()) assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Keine horizontale Überbreite bei ' + width);
    for (const id of ['play-button','mute-button','volume']) {
      const control = radio.locator('#' + id);
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, id + ' bleibt bedienbar bei ' + width);
    }
    assert.equal(await radio.locator('#radio-audio').getAttribute('src'), null);
    assert.equal(await radio.locator('#open-wishes').isVisible(), false);
    assert.equal(await radio.locator('#open-schedule').isVisible(), false);
    assert.equal(await radio.locator('#studio-tab').isVisible(), false);
    assert.equal(await radio.locator('#team-tab').isVisible(), false);
    const frame = page.frames().find(f => f.url().includes('/preview?'));
    assert.equal(await frame.evaluate(() => MischWerkDemoData.pageData.user.canModerate), false);
  }
  await page.locator('#site-menu-toggle').click();
  await page.getByRole('link',{name:'Radio hören',exact:true}).click();
  assert.equal(new URL(page.url()).pathname, '/');
  await page.goto(base + '/channel.html?radio=public');
  await page.frameLocator('#radio-frame').locator('html.mw-ready').waitFor();
  await cleanText(page);
  assert.equal(await page.getByRole('link',{name:'Studio-Test',exact:true}).isVisible(), false);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
});
test('Websiteplayer: Play, freie Lautstärke, Mute, Stop und leiser Neustart verwenden die bestehende Audiologik', async t => {
  const {page, errors} = await setup(t);
  await page.goto(base);
  const radio = page.frameLocator('#radio-frame');
  await radio.locator('#track-title').filter({hasText:'Prüftitel'}).waitFor();
  await radio.locator('#play-button').click();
  await radio.locator('body.playing').waitFor();
  assert.ok(await radio.locator('#radio-audio').evaluate(a => a.volume <= .1));
  await radio.locator('#volume').press('End');
  assert.equal(await radio.locator('#radio-audio').evaluate(a => a.volume), 1);
  await radio.locator('#mute-button').click();
  assert.equal(await radio.locator('#radio-audio').evaluate(a => a.volume), 0);
  await radio.locator('#mute-button').click();
  assert.equal(await radio.locator('#radio-audio').evaluate(a => a.volume), 1);
  await radio.locator('#play-button').click();
  assert.equal(await radio.locator('#radio-audio').getAttribute('src'), null);
  await radio.locator('#play-button').click();
  await radio.locator('body.playing').waitFor();
  assert.ok(await radio.locator('#radio-audio').evaluate(a => a.volume <= .1));
  await radio.locator('#play-button').click();
  assert.deepEqual(errors, []);
});
test('Testansichten: neutrale Rollen und Beschriftungen auch in Wunschbox, Sendeplan, Studio und Team', async t => {
  const {page, errors, external} = await setup(t);
  for (const role of ['listener','moderator']) {
    await page.goto(base + '/channel.html?role=' + role);
    const radio = page.frameLocator('#radio-frame');
    await radio.locator('html.mw-ready').waitFor();
    await cleanText(page);
    if (role === 'moderator') {
      await previewCurtain(radio);
      for (const [id,view] of [['open-wishes','wishes'],['open-schedule','schedule'],['studio-tab','studio'],['team-tab','team']]) {
        if (view === 'team') {
          assert.equal(await radio.locator('#team-tab').count(),0);
          await radio.locator('html').evaluate(() => window.MischWerkPreviewCommand('/MW Verwaltung'));
        } else { await radio.locator('#' + id).click(); }
        await page.frameLocator('#overlay-frame').locator('html.mw-ready[data-view="' + view + '"]').waitFor();
        await cleanText(page);
        assert.equal(await page.frameLocator('#overlay-frame').locator('html').getAttribute('data-view'),view);
        if (view === 'team') {
          const team = page.frameLocator('#overlay-frame');
          assert.equal(await team.locator('#team-status-tab').count(),0);
          await team.locator('#team-texts-tab').click();
          await cleanText(page);
        }
      }
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
});

test('Websitebereiche ohne Einrichtung: öffentliche Profile, gesperrter Versand und keine private Empfängeradresse', async t => {
  const {page, errors} = await setup(t);
  await page.goto(base);
  await page.getByRole('link',{name:'Das Team',exact:true}).click();
  await page.locator('.team-card').first().waitFor();
  assert.deepEqual(await page.locator('.team-card h3').allTextContents(), ['Yves','Alex']);
  await page.getByRole('link',{name:'Sendeplan',exact:true}).click();
  await page.locator('#schedule-status.error').waitFor();
  await page.getByRole('link',{name:'Mitmachen',exact:true}).click();
  assert.equal(await page.locator('#application-form button[type=submit]').isDisabled(), true);
  await page.getByRole('link',{name:'Wunschbox',exact:true}).click();
  assert.equal(await page.locator('#site-wish-form button[type=submit]').isDisabled(), true);
  assert.doesNotMatch(await page.content(), /yves\.klewer|mailbox\.org|MISCHWERK_SMTP|webhooks\//i);
  const publicContent = await (await page.request.get(base + '/api/site/content')).text();
  assert.doesNotMatch(publicContent, /@|SMTP|webhooks\//i);
  for (const file of ['/.env','/site-mail.cjs','/site-api.cjs']) assert.equal((await page.request.get(base + file)).status(),404);
  await cleanText(page); assert.deepEqual(errors, []);
});

test('Websiteformulare und Appplan: paginierte Woche, Mitternacht, Entwurfserhalt und Quittung ohne Audioverlust', async t => {
  const {page, errors, external} = await setup(t);
  const wishes = [], applications = [];
  await page.route('**/api/site/content', route => route.fulfill({json:{...require('../../server/site-content.cjs'), applicationsAvailable:true, appConnected:true}}));
  await page.route('**/api/site/schedule?**', route => {
    const url = new URL(route.request().url()), week = url.searchParams.get('week'), pageNumber = Number(url.searchParams.get('page'));
    const days = Array.from({length:7}, (_,i) => new Date(Date.parse(week+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));
    const rows = [{id:'check-1',date:week,start:'23:00',end:'01:00',topic:'Testsendung über Mitternacht',moderator:'Yves'},
      {id:'check-2',date:days[2],start:'18:00',end:'20:00',topic:'Zweite Testsendung',moderator:'Moderation'}];
    return route.fulfill({json:{version:1,ok:true,week,today:days[1],days,revision:3,previousRevision:2,entries:[rows[pageNumber]],page:pageNumber,pages:2,total:2,requestsEnabled:true}});
  });
  await page.route('**/api/site/wishes', route => {
    wishes.push(route.request().postDataJSON());
    return route.fulfill(wishes.length === 1 ? {status:503,json:{message:'Versandfehler. Deine Eingabe bleibt erhalten.'}} : {json:{ok:true,message:'Dein Musikwunsch ist bei der Moderation angekommen.'}});
  });
  await page.route('**/api/site/applications', route => {
    applications.push(route.request().postDataJSON());
    return route.fulfill({json:{ok:true,message:'Danke! Deine Bewerbung wurde per E-Mail übermittelt.'}});
  });
  await page.goto(base);
  const radio = page.frameLocator('#radio-frame');
  await radio.locator('#track-title').filter({hasText:'Prüftitel'}).waitFor();
  await radio.locator('#play-button').click(); await radio.locator('body.playing').waitFor();
  await page.getByRole('link',{name:'Sendeplan',exact:true}).click();
  await page.locator('.schedule-day').first().waitFor();
  assert.equal(await page.locator('.schedule-day').count(),7);
  assert.equal(await page.getByText('Testsendung über Mitternacht',{exact:true}).count(),2);
  assert.match(await page.locator('.schedule-day').nth(1).innerText(), /00:00 – 01:00/);
  const weekBefore = await page.locator('#schedule-week').textContent();
  await page.getByRole('button',{name:'Nächste Woche',exact:true}).click();
  await page.waitForFunction(before => document.querySelector('#schedule-week').textContent !== before, weekBefore);
  await page.locator('#schedule-status').filter({hasText:'aktuelle Plan'}).waitFor();
  assert.equal(await radio.locator('#radio-audio').evaluate(a => !a.paused),true);
  await page.getByRole('link',{name:'Wunschbox',exact:true}).click();
  await page.locator('#site-wish-form textarea').fill('a-ha – Take On Me');
  await page.locator('#site-wish-form button[type=submit]').click();
  await page.locator('#site-wish-status.error').waitFor();
  assert.equal(await page.locator('#site-wish-form textarea').inputValue(),'a-ha – Take On Me');
  await page.locator('#site-wish-form button[type=submit]').click();
  await page.locator('#site-wish-status.success').waitFor();
  assert.equal(wishes.length,2); assert.equal(wishes[0].submissionId,wishes[1].submissionId);
  assert.equal(await page.locator('#site-wish-form textarea').inputValue(),'');
  await page.getByRole('link',{name:'Mitmachen',exact:true}).click();
  await page.locator('#application-form input[name=name]').fill('Testbewerbung');
  await page.locator('#application-form input[name=email]').fill('bewerbung@example.invalid');
  await page.locator('#application-form textarea[name=availability]').fill('Am Wochenende, erste Radioerfahrung.');
  await page.locator('#application-form textarea[name=message]').fill('Ich möchte eine eigene Sendung moderieren.');
  await page.locator('#application-form button[type=submit]').click();
  await page.locator('#application-status.success').waitFor();
  assert.equal(applications.length,1); assert.equal(applications[0].name,'Testbewerbung');
  assert.equal(await page.locator('#application-form input[name=email]').inputValue(),'');
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Websitebereiche ohne Überbreite bei '+width);
  }
  await page.locator('#site-menu-toggle').click();
  await page.getByRole('link',{name:'Radio hören',exact:true}).click();
  await cleanText(page); await radio.locator('#play-button').click();
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
});

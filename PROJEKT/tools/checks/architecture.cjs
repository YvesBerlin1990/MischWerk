// Prüft die öffentlichen Backend-Schnittstellen und die explizite Frontend-Verdrahtung.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { modules } = require('../build/backend.cjs');
const { frontendFiles, frontendFilesForView } = require('../lib/frontend-files.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function checkArchitecture() {
  const backend = Object.fromEntries(modules.map(file => [file, read('src/backend/' + file)]));
  const allBackend = Object.values(backend).join('\n');
  assert.doesNotMatch(allBackend, /KnuddelsServer\.(?:set|clear)(?:Timeout|Interval)\s*\(/, 'Hosttimer sind globale Funktionen, keine unbelegten KnuddelsServer-Methoden');
  assert.equal((backend['channel-texts/scheduler.js'].match(/\bsetTimeout\s*\(/g) || []).length, 1, 'Ein Bot-Versandtimer');
  assert.equal((backend['android/publisher.js'].match(/\bsetTimeout\s*\(/g) || []).length, 1, 'Ein eigener Android-Heartbeat, nur bei eingerichtetem Transport');
  assert.equal((backend['android/verification.js'].match(/\bsetTimeout\s*\(/g) || []).length, 1, 'Ein begrenzter Timeout je ausdrücklicher HTTP-Prüfung');
  assert.equal((allBackend.match(/\bsetTimeout\s*\(/g) || []).length, 3, 'Nur Bot-/Heartbeat-Timer und ausdrücklicher Prüf-Timeout');
  assert.match(backend['website/transport.js'], /getWebHookAccess\(\)\.registerWebHook\('website', handle\)/, 'Website verwendet ausschließlich dokumentierten WebHook');
  assert.doesNotMatch(backend['website/commands.js'], /handleEvent|handleScheduleEvent|handleChannelTextEvent|new User|sendAppContent/, 'Webadapter verwendet Fachaktionen ohne native Sitzungsattrappe');
  assert.match(backend['website/access.js'], /runtime\.isModerator\(person\)/, 'Websitzung prüft aktuelle Channelrechte');
  for (const method of ['sendAppContent', 'overlayContent', 'headerbarContent', 'remove']) {
    assert.equal((allBackend.match(new RegExp('\\.' + method + '\\s*\\(', 'g')) || []).length, 1, 'Genau ein nativer Lebenszykluspfad: ' + method);
  }
  assert.equal((allBackend.match(/new\s+HTMLFile\s*\(/g) || []).length, 1, 'Genau eine HTMLFile-Erzeugung');
  assert.doesNotMatch(allBackend, /toggleWishSurface|newSurfaceId|runtime\.prepareView|entry\.switching/, 'Abgelöste Öffnungs-/Ersetzungswege');
  assert.doesNotMatch(backend['ui/sessions.js'], /\.replacing\s*=|previousRadio|closeView\(previous\)/, 'Ersetzen bleibt bei sendAppContent, ohne eigenen Nachschließweg');
  assert.match(backend['ui/sessions.js'], /entry\.session\s*=\s*runtime\.deliverChannelContent\(user, content\)/, 'Native Rückgabesitzung besitzt den gemeinsamen Schließweg');
  assert.doesNotMatch(backend['ui/wish-surface.js'], /runtime\.(?:openView|closeView)\s*\(|AppContent\./, 'Wunschrelay besitzt keine Fenster');
  const providers = {};
  for (const [file, text] of Object.entries(backend)) {
    for (const match of text.matchAll(/runtime\.(\w+)\s*=\s*function/g)) {
      assert.ok(!providers[match[1]], 'Doppelte öffentliche Backendfunktion: ' + match[1]);
      providers[match[1]] = file;
    }
  }
  const edges = Object.fromEntries(modules.map(file => [file, [...new Set(
    [...backend[file].matchAll(/runtime\.(\w+)/g)].map(match => providers[match[1]]).filter(owner => owner && owner !== file)
  )]]));
  const visited = new Set();
  function visit(file, stack = []) {
    assert.ok(!stack.includes(file), 'Zyklische Backendabhängigkeit: ' + stack.concat(file).join(' -> '));
    if (visited.has(file)) { return; }
    for (const target of edges[file]) { visit(target, stack.concat(file)); }
    visited.add(file);
  }
  for (const file of modules.filter(file => file !== 'app.js')) { visit(file); }

  const factories = {};
  const declarations = {};
  for (const file of frontendFiles.filter(file => file.endsWith('.js') && file !== 'js/start.js' && file !== 'js/ui/composition.js')) {
    const source = read('app/www/' + file);
    new vm.Script(source, { filename: file }).runInNewContext({ MischWerkUI: {
      define(name, factory) {
        assert.ok(!factories[name], 'Doppeltes Frontendmodul: ' + name);
        factories[name] = factory;
        declarations[name] = [...new Set([...source.matchAll(/dependencies\.(\w+)/g)].map(match => match[1]))].sort();
      }
    } });
    assert.ok(!/Client\.includeJS|factories\./.test(source), 'Fachmodule dürfen keine anderen Module laden: ' + file);
  }
  const frontend = frontendFiles.filter(file => file.endsWith('.js')).map(file => read('app/www/' + file)).join('\n');
  assert.doesNotMatch(frontend, /playbackFailed|playbackTimedOut|wantedPlayback|station-changed/, 'Abgelöste Verbindungssteuerung vollständig entfernt');
  const radioController = read('app/www/js/radio/player.js') + read('app/www/js/radio/provider.js');
  assert.doesNotMatch(radioController, /audio\.(?:src|play|pause|load)|provider\.poll\(/, 'Nur radio/connection besitzt die Audioquelle; keine Statusabfrage durch Medienereignisse');
  const radioConnection = read('app/www/js/radio/connection.js');
  assert.doesNotMatch(radioConnection, /provider|fetch\(|XMLHttpRequest|AudioContext|new Audio/, 'Ein direkter nativer Stream ohne parallele Anbieter-/Audiowege');
  assert.equal((radioConnection.match(/setTimeout\(/g) || []).length, 1, 'Ein Timer für Verbindung und Wiederherstellung');
  assert.doesNotMatch(frontend, /sharedViews|model\.shared|switchView|view-select|view-changed|enterView|dialogLimit|studioHostTimer|mw:view/, 'Alte gemeinsame Navigation und automatische Overlaygrößen entfernt');
  assert.doesNotMatch(read('app/www/js/ui/layout.js'), /getHostFrame|setSize|setMinSize|setMaxSize|setResizable/, 'Overlaylayout verändert keine nativen Fenstermaße');
  const wishWindow = read('app/www/js/wishes/window.js');
  assert.doesNotMatch(wishWindow, /setMinSize|setMaxSize|setResizable|setTimeout|setInterval|screen\./, 'Wunschhöhe ohne alte Grenzen-/Warte-/Wiederholungsmechanik');
  assert.equal((wishWindow.match(/\.setSize\(/g) || []).length, 1, 'Ein dokumentierter Größenpfad für die Wunschbestätigung');
  const studioWindow=read('app/www/js/studio/window.js');
  assert.doesNotMatch(studioWindow,/setMinSize|setMaxSize|setResizable|setTimeout|setInterval/,'Studiohöhe ohne parallele Fenster-/Wiederholungsmechanik');
  assert.equal((studioWindow.match(/\.setSize\(/g)||[]).length,1,'Ein dokumentierter Größenpfad für die ausdrücklich gewünschte kompakte Moderation');
  for (const view of ['radio','wishes','studio','team','schedule']) {
    assert.equal(frontendFilesForView(view).includes('js/wishes/window.js'), view === 'wishes', 'Native Wunschhöhe nur im Wunsch-Ladeplan');
  }
  assert.doesNotMatch(frontend, /(?:bridge|Client)\.close\s*\(|window\.open\s*\(|location\.(?:assign|replace)\s*\(/, 'Fensteraktionen müssen den gemeinsamen Ereignisweg verwenden');
  assert.doesNotMatch(read('tools/preview/channel.html') + read('tools/preview/bridge.js'), /preview-wishes/, 'Ein gemeinsamer Vorschau-Overlayweg');
  const start = read('app/www/js/start.js');
  const composition = read('app/www/js/ui/composition.js');
  const available = new Set(['bridge', 'audio']);
  const composed = new Set();
  for (const match of composition.matchAll(/(?:(?:(?:var )?(\w+) = )?)factories\.(\w+)\(\{([\s\S]*?)\}\);/g)) {
    const [, variable, name, argumentsText] = match;
    assert.ok(factories[name], 'Unbekannte Frontendkomponente: ' + name);
    assert.ok(!composed.has(name), 'Doppelte Zusammensetzung: ' + name);
    const pairs = [...argumentsText.matchAll(/(\w+):\s*(\w+)/g)];
    for (const [, dependency, value] of pairs) {
      assert.ok(available.has(value), name + '.' + dependency + ': Vorwärtsreferenz oder zyklische Abhängigkeit');
    }
    assert.deepEqual(pairs.map(pair => pair[1]).sort(), declarations[name], 'Abhängigkeiten passen nicht zur Schnittstelle: ' + name);
    if (variable) { available.add(variable); }
    composed.add(name);
  }
  assert.deepEqual([...composed].sort(), Object.keys(factories).sort(), 'Unverdrahtete Frontendkomponenten');
  const used = new Set();
  for (const view of ['radio', 'wishes', 'studio', 'team', 'schedule']) {
    const loaded = [], built = [], scope = { window: {}, document: {
      documentElement: { getAttribute: () => view }
    }, Client: { pageData: { view }, includeJS: file => loaded.push(file) } };
    vm.runInNewContext(start, scope);
    scope.MischWerkUI = scope.window.MischWerkUI;
    vm.runInNewContext(composition, scope);
    const expected = frontendFilesForView(view).filter(file => file.endsWith('.js') &&
      file !== 'js/start.js');
    assert.deepEqual([...loaded].sort(), [...expected].sort(), 'Ladeplan: ' + view);
    for (const file of loaded.filter(file => file !== 'js/ui/composition.js')) {
      const name = read('app/www/' + file).match(/MischWerkUI\.define\('([^']+)'/)[1];
      scope.window.MischWerkUI.define(name, () => {
        built.push(name); used.add(name);
        return { start() {}, prepareAssets() {}, el() { return {}; } };
      });
    }
    assert.equal(built.length, loaded.length - 1, 'Jedes geladene Modul muss genau einmal entstehen: ' + view);
    assert.equal(new Set(built).size, built.length, 'Doppelte Initialisierung: ' + view);
  }
  assert.deepEqual([...used].sort(), Object.keys(factories).sort(), 'Modul ohne erreichbares Fenster');
  return { backendModules: modules.length, frontendComponents: composed.size };
}
if (require.main === module) { console.log('Architektur geprüft:', checkArchitecture()); }
module.exports = { checkArchitecture };

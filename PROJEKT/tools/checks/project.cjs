const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { checkBackend, modules } = require('../build/backend.cjs');
const { frontendFiles } = require('../lib/frontend-files.cjs');
const { runtimeFiles, isBinary, checkRuntime } = require('./lengths.cjs');
const { checkArchitecture } = require('./architecture.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
checkBackend();
checkArchitecture();
const backend = modules.map(file => read('app/server/' + file)).join('\n');
assert.ok(read('app/main.js').split('\n').length < 6, 'main.js darf nur der Einstieg sein');
assert.equal((read('app/main.js').match(/KnuddelsServer.execute\(/g) || []).length, 1, 'main.js lädt genau das Kompositionsmodul');
assert.ok(!/onEventReceived\s*[:=]|runtime\.\w+\s*=|function\s*\(/.test(read('app/main.js')), 'Fachlogik im Einstieg');
for (const file of ['app/main.js', ...frontendFiles.filter(file => file.endsWith('.js')).map(file => 'app/www/' + file), 'tools/preview/bridge.js']) {
  new vm.Script(read(file), { filename: file });
  console.log('Syntax OK:', file);
}
const backendApi = read('references/api/knuddels-userapp-backend-api.js');
const frontendApi = read('references/api/knuddels-webapp-frontend-api.js');
for (const name of ['KnuddelsServer.getPersistence', 'KnuddelsServer.getDefaultLogger', 'KnuddelsServer.getChannel', 'KnuddelsServer.getUserAccess', 'Channel.prototype.getOnlineUsers', 'UserAccess.prototype.exists', 'UserAccess.prototype.getUserId', 'UserAccess.prototype.getNick', 'UserType.Human', 'Logger.prototype.warn', 'Logger.prototype.info', 'AppContent.headerbarContent', 'AppContent.prototype.getSessions', 'AppContent.prototype.setAllowJFXBrowser', 'User.prototype.isChannelOwner', 'User.prototype.sendAppContent', 'AppContentSession.prototype.getAppContent', 'AppContentSession.prototype.sendEvent', 'Persistence.prototype.getObject', 'Persistence.prototype.setObject']) {
  assert.ok(backendApi.includes(name), 'Fehlende Backend-Referenz: ' + name);
}
for (const name of ['Client.sendEvent', 'Client.addEventListener', 'Client.includeCSS', 'Client.includeJS', 'Client.isK3Client', 'Client.getHostFrame']) {
  assert.ok(frontendApi.includes(name), 'Fehlende Frontend-Referenz: ' + name);
}
// Vollstaendiges Inventar der zusaetzlichen verwendeten Hooks und Instanzmethoden.
for (const [type, names] of Object.entries({
  App: ['onAppStart', 'onPrepareShutdown', 'onUserJoined', 'onUserLeft', 'onUserDeleted', 'onEventReceived'],
  User: ['getNick', 'getUserId', 'isOnlineInChannel', 'isAppManager', 'equals', 'canSendAppContent', 'sendAppContent', 'sendPrivateMessage'],
  AppContentSession: ['getUser', 'remove'],
  AppContent: ['setResponsive', 'addCloseListener'],
  BotUser: ['sendPublicMessage'], String: ['escapeKCode'],
  AppAccess: ['getOwnInstance'], AppInstance: ['getRootInstance'], RootAppInstance: ['updateAppFiles', 'invalidateClientCache', 'updateApp']
})) {
  for (const name of names) {
    assert.ok(backendApi.includes(type + '.prototype.' + name + ' = function'), 'Fehlende API-Signatur: ' + type + '.' + name);
  }
}
assert.ok(backendApi.includes('KnuddelsServer.getAppAccess = function'), 'Fehlende AppAccess-Signatur');
assert.ok(backendApi.includes('KnuddelsServer.getDefaultBotUser = function'), 'Fehlende BotUser-Signatur');
assert.ok(backendApi.includes('KnuddelsServer.execute = function'), 'Fehlende Loader-Signatur');
assert.ok(backendApi.includes('AppContent.overlayContent'), 'Overlay fehlt in der Backend-Referenz');
for (const name of ['setTitle', 'setSize']) {
  assert.ok(frontendApi.includes('Client.HostFrame.prototype.' + name + ' = function'), 'Fehlende HostFrame-Signatur: ' + name);
}
const markupFiles = frontendFiles.filter(file => file.endsWith('.js') && /\bdom\.mount\(/.test(read('app/www/' + file)));
const html = read('app/www/index.html') + markupFiles.map(file => read('app/www/' + file)).join('\n');
assert.ok(!html.includes('knuddels-webapp-frontend-api.js'), 'Referenzstub darf nicht ausgeführt werden');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Doppelte HTML-IDs');
const js = frontendFiles.filter(file => file.endsWith('.js')).map(file => read('app/www/' + file)).join('\n');
for (const file of runtimeFiles.filter(file => !isBinary(file)).map(file => 'app/' + file)) {
  assert.ok(!/laut\.fm|lautfm|stationSlug|streamplus/i.test(read(file)), 'Entfernte Radioanbindung in Laufzeitdatei: ' + file);
}
for (const match of js.matchAll(/(?:el|setText)\('([^']+)'/g)) { assert.ok(ids.includes(match[1]), 'Fehlendes UI-Element: ' + match[1]); }
assert.ok(!/\b(?:fetch|process|module\.exports|document|window)\b/.test(backend), 'Browser-/Node-Funktion im Backend');
assert.ok(!backend.includes('.isChannelModerator('), 'Channelmoderatoren dürfen nicht automatisch Studiozugriff erhalten');
assert.ok(!js.includes('innerHTML'), 'Fremde Texte mit textContent ausgeben');
assert.ok(!js.includes('MischWerkDemo'), 'Demo-Code darf nicht im Produktions-Frontend liegen');
console.log('Backend-Module, API-Signaturen, UI-IDs, Laufzeitgrenzen und Trennung der Demo: OK');
const lengths = checkRuntime(path.join(root, 'app'));
console.log(lengths.length + ' tatsächlich ausgelieferte Textdateien: jeweils strikt unter 9.500 Zeichen.');
assert.ok(backend.includes('AppContent.headerbarContent'), 'Radio benötigt die Channelleiste.');
assert.ok(backend.includes('AppContent.overlayContent') && !backend.includes('AppContent.popupContent'), 'Alle vier Channelansichten benötigen echte Overlays.');
assert.ok(frontendApi.includes('Client.HostFrame.prototype.setSize'), 'Headerbar-Höhenanpassung fehlt in Referenz.');
console.log('Produktnachweise: docs/pruefung/PRUEFBERICHT.md. Echte Knuddels-/K3-Abnahme: docs/betrieb/LIVE-ABNAHME.md.');

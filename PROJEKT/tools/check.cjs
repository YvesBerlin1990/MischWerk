const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['app/main.js', 'app/www/js/app.js', 'preview-bridge.js']) {
  new vm.Script(read(file), { filename: file });
  console.log('Syntax OK:', file);
}
const backendApi = read('references/api/knuddels-userapp-backend-api.js');
const frontendApi = read('references/api/knuddels-webapp-frontend-api.js');
for (const name of ['KnuddelsServer.getPersistence', 'KnuddelsServer.getDefaultLogger', 'KnuddelsServer.getChannel', 'Channel.prototype.getOnlineUsers', 'UserType.Human', 'Logger.prototype.warn', 'Logger.prototype.info', 'AppContent.headerbarContent', 'AppContent.prototype.getSessions', 'AppContent.prototype.setAllowJFXBrowser', 'User.prototype.isChannelOwner', 'User.prototype.isChannelModerator', 'User.prototype.sendAppContent', 'AppContentSession.prototype.getAppContent', 'AppContentSession.prototype.sendEvent', 'Persistence.prototype.getObject', 'Persistence.prototype.setObject']) {
  assert.ok(backendApi.includes(name), 'Fehlende Backend-Referenz: ' + name);
}
for (const name of ['Client.sendEvent', 'Client.addEventListener', 'Client.includeCSS', 'Client.includeJS', 'Client.isK3Client', 'Client.getHostFrame']) {
  assert.ok(frontendApi.includes(name), 'Fehlende Frontend-Referenz: ' + name);
}
const html = read('app/www/index.html');
assert.ok(!html.includes('knuddels-webapp-frontend-api.js'), 'Referenzstub darf nicht ausgeführt werden');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Doppelte HTML-IDs');
const js = read('app/www/js/app.js');
for (const file of ['app/main.js', 'app/www/js/app.js', 'app/www/index.html', 'app/app.config']) {
  assert.ok(!/laut\.fm|lautfm|stationSlug|streamplus/i.test(read(file)), 'Entfernte Radioanbindung in Laufzeitdatei: ' + file);
}
for (const match of js.matchAll(/(?:el|setText)\('([^']+)'/g)) { assert.ok(ids.includes(match[1]), 'Fehlendes UI-Element: ' + match[1]); }
assert.ok(!/\b(?:fetch|process|module\.exports|document|window)\b/.test(read('app/main.js')), 'Browser-/Node-Funktion im Backend');
assert.ok(!js.includes('innerHTML'), 'Fremde Texte mit textContent ausgeben');
assert.ok(!js.includes('MischWerkDemo'), 'Demo-Code darf nicht im Produktions-Frontend liegen');
console.log('API-Signaturen, UI-IDs, Laufzeitgrenzen und Trennung der Demo: OK');
assert.ok(read('app/main.js').includes('AppContent.headerbarContent'), 'Radio benötigt die Channelleiste.');
assert.ok(read('app/main.js').includes('AppContent.popupContent'), 'Wunschbox und Moderation benötigen Popups.');
assert.ok(frontendApi.includes('Client.HostFrame.prototype.setSize'), 'Headerbar-Höhenanpassung fehlt in Referenz.');
console.log('LIVE-Stand: docs/LIVE-ABNAHME.md. RadioKing ist lokal eingerichtet; echte Knuddels-/K3-Abnahme steht noch aus.');

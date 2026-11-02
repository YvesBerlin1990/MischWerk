// Lokale Testprofile. Niemals in die UserApp oder den Upload übernehmen.
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '../..');
const profiles = Object.freeze([
  { nick: 'Otterchen', role: 'owner', id: 101 },
  { nick: 'Polaroid', role: 'listener', id: 102 },
  { nick: 'Testhoerer', role: 'listener', id: 103 },
  { nick: 'DJ-Test', role: 'listener', id: 104 },
  { nick: 'AppManager', role: 'manager', id: 105 },
  { nick: 'Channelmoderator', role: 'cm', id: 106 }
]);
const defaults = Object.freeze({
  clientDelayMs: 0, serverDelayMs: 0, duplicateNext: false, clientEventType: 'mw:wish.submit',
  dropClient: 0, dropServer: 0, dropServerType: '',
  failPersistence: false, resourceDelayMs: 0, resourceFailure: '',
  hostSizing: 'normal', loader: 'parser', provider: 'unconfigured'
});
function validateFaults(value, current = defaults) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Fehlerprofil muss ein Objekt sein.');
  const next = { ...current };
  for (const [key, item] of Object.entries(value)) {
    if (!(key in defaults)) throw new Error('Unbekannte Fehlereinstellung: ' + key);
    if (['clientDelayMs', 'serverDelayMs', 'resourceDelayMs'].includes(key)) {
      if (!Number.isInteger(item) || item < 0 || item > 10000) throw new Error('Verzögerung muss zwischen 0 und 10000 ms liegen.');
    } else if (['dropClient', 'dropServer'].includes(key)) {
      if (!Number.isInteger(item) || item < 0 || item > 100) throw new Error('Paketanzahl muss zwischen 0 und 100 liegen.');
    } else if (['duplicateNext', 'failPersistence'].includes(key)) {
      if (typeof item !== 'boolean') throw new Error('Boolescher Wert erforderlich.');
    } else if (key === 'hostSizing') {
      if (!['normal', 'ignored', 'delayed', 'stepped'].includes(item)) throw new Error('Ungültiger Fenstermodus.');
    } else if (key === 'loader') {
      if (!['parser', 'async'].includes(item)) throw new Error('Ungültiger Lademodus.');
    } else if (key === 'provider') {
      if (!['unconfigured', 'online', 'stopped', 'http-error', 'invalid', 'slow'].includes(item)) throw new Error('Ungültiger Anbieterfall.');
    } else if (typeof item !== 'string' || item.length > 160) throw new Error('Ungültiger Filter.');
    next[key] = item;
  }
  return next;
}
module.exports = { projectRoot, profiles, defaults, validateFaults };

const { randomUUID } = require('node:crypto');
const { copy } = require('./persistence.cjs');
function payload(value) {
  const serialized = JSON.stringify(value === undefined ? {} : value);
  if (!serialized || serialized.length >= 10000) throw new Error('HTMLUI-Nutzdaten müssen unter 10000 Zeichen bleiben.');
  return JSON.parse(serialized);
}
class TestContents {
  constructor(runtime) { this.runtime = runtime; this.sessions = new Map(); this.records = new WeakMap(); }
  create(htmlFile, mode, width, height) {
    if (mode === 'Headerbar' && (!Number.isInteger(height) || height < 20 || height > 500)) throw new Error('Headerbarhöhe: Ganzzahl von 20 bis 500.');
    const minimum = mode === 'Overlay' ? 20 : 50;
    if (mode !== 'Headerbar' && ![width, height].every(value => Number.isInteger(value) && value >= minimum && value <= 1000)) {
      throw new Error(mode + ': ganzzahlige Fenstermaße von ' + minimum + ' bis 1000 erforderlich.');
    }
    const record = { htmlFile, mode, width: mode === 'Headerbar' ? 0 : width, height, responsive: false, jfx: true, listeners: [], sessions: [] };
    record.loading = { enabled:true, background:'#FFFFFF', foreground:'#000000', text:'Lädt...' };
    const loading = {
      setBackgroundColor: color => { record.loading.background = color.asHexString(); },
      setForegroundColor: color => { record.loading.foreground = color.asHexString(); },
      setText: text => { if (typeof text !== 'string') throw new Error('Ladetext benötigt String.'); record.loading.text = text; },
      setEnabled: value => { if (typeof value !== 'boolean') throw new Error('Ladezustand benötigt Boolean.'); record.loading.enabled = value; }
    };
    const content = {
      getLoadConfiguration: () => loading,
      getHTMLFile: () => record.htmlFile, getAppViewMode: () => this.runtime.enums.AppViewMode[mode],
      getWidth: () => record.width, getHeight: () => record.height,
      setResponsive: value => { record.responsive = value === true; }, isResponsive: () => record.responsive,
      setAllowJFXBrowser: value => { record.jfx = value === true; }, isAllowJFXBrowser: () => record.jfx,
      addCloseListener: callback => { if (typeof callback !== 'function') throw new Error('Close-Listener benötigt Funktion.'); record.listeners.push(callback); },
      getSessions: () => record.sessions.slice(), getUsers: () => record.sessions.map(session => session.getUser()),
      remove: () => record.sessions.slice().forEach(session => session.remove()),
      sendEvent: (type, data) => record.sessions.forEach(session => session.sendEvent(type, data))
    };
    this.records.set(content, record); return content;
  }
  open(user, content) {
    const record = this.records.get(content);
    if (!record) throw new Error('Unbekannter AppContent.');
    const id = randomUUID(), openedAt = new this.runtime.clock.Date();
    let active = true;
    const session = {
      getUser: () => user, getAppContent: () => content,
      getAppViewMode: () => content.getAppViewMode(), getGlobalAppInstance: () => null,
      getOpenTimestamp: () => new this.runtime.clock.Date(openedAt.getTime()),
      isConnectedUsingDirectConnection: () => false,
      sendEvent: (type, data) => {
        if (!active) throw new Error('AppContentSession ist geschlossen.');
        if (typeof type !== 'string' || !type || type === '*' || type.length > 100) throw new Error('Ungültiger Eventtyp.');
        this.runtime.emit('sessionEvent', { nick: user.getNick(), sessionId: id, eventType: type, eventData: payload(data) });
      },
      remove: () => {
        if (!active) return;
        active = false; this.sessions.delete(id);
        record.sessions = record.sessions.filter(item => item !== session);
        this.runtime.emit('contentRemove', { nick: user.getNick(), sessionId: id });
        record.listeners.slice().forEach(listener => {
          try { this.runtime.invokeFunction(listener, [user, content, false]); } catch { /* Fehler wurde bereits als Appfehler erfasst. Andere Listener weiter ausführen. */ }
        });
      }
    };
    this.sessions.set(id, session); record.sessions.push(session);
    this.runtime.emit('contentShow', this.describe(id));
    return session;
  }
  describe(id) {
    const session = this.sessions.get(id); if (!session) return null;
    const content = session.getAppContent(), record = this.records.get(content);
    return { sessionId: id, nick: session.getUser().getNick(), mode: record.mode,
      width: record.width, height: record.height, responsive: record.responsive, allowJFX: record.jfx,
      loading: copy(record.loading),
      htmlPath: record.htmlFile.getAssetPath(), pageData: copy(record.htmlFile.getPageData()) };
  }
  owned(id, user) { const session = this.sessions.get(id); return session?.getUser() === user ? session : null; }
  removeUser(user) { [...this.sessions.values()].filter(session => session.getUser() === user).forEach(session => session.remove()); }
  clear() { [...this.sessions.values()].forEach(session => session.remove()); }
}
module.exports = { TestContents, payload };

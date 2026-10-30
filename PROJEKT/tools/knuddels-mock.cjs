// Nur für lokale Tests/Vorschau. Niemals nach Knuddels hochladen.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
function persistence(data = {}) {
  return {
    data,
    getObject: (key, fallback) => clone(key in data ? data[key] : fallback),
    setObject: (key, value) => {
      if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 100000) { throw new Error('Persistence object exceeds 100 kB'); }
      data[key] = clone(value);
    },
    hasString: key => typeof data[key] === 'string',
    getString: (key, fallback = '') => typeof data[key] === 'string' ? data[key] : fallback,
    setString: (key, value) => {
      if (typeof value !== 'string') { throw new Error('Persistence string required'); }
      data[key] = value;
    },
    deleteString: key => { if (typeof data[key] === 'string') { delete data[key]; } },
    getNumber: (key, fallback = 0) => key in data ? data[key] : fallback,
    setNumber: (key, value) => { data[key] = value; }
  };
}
function createHarness(existingPersistence) {
  const store = existingPersistence || persistence();
  const users = new Map();
  const contents = [];
  const logs = [];
  let submissionSequence = 0;
  let timestamp = Date.now();
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [timestamp])); }
    static now() { return timestamp; }
  }
  class HTMLFile {
    constructor(assetPath, pageData) {
      if (JSON.stringify(pageData).length > 10000) { throw new Error('HTMLFile pageData exceeds 10000 characters'); }
      this.assetPath = assetPath; this.pageData = clone(pageData);
    }
    getAssetPath() { return this.assetPath; }
    getPageData() { return clone(this.pageData); }
  }
  function createContent(htmlFile, viewMode, width, height) {
    const content = { htmlFile, viewMode, width, height, sessions: [], closeListeners: [],
      getHTMLFile() { return this.htmlFile; }, getSessions() { return this.sessions.slice(); },
      setResponsive(value) { this.responsive = value; }, setAllowJFXBrowser(value) { this.allowJFXBrowser = value; },
      addCloseListener(callback) { this.closeListeners.push(callback); } };
    contents.push(content); return content;
  }
  const context = vm.createContext({
    Date: FakeDate,
    HTMLFile,
    UserType: { Human: 'human' },
    KnuddelsServer: { getPersistence: () => store, getDefaultLogger: () => ({
      warn(message) { logs.push({ level: 'warn', message }); },
      info(message) { logs.push({ level: 'info', message }); }
    }),
      getChannel: () => ({ getOnlineUsers: () => [...users.values()].filter(user => user.online) }),
      getUserAccess: () => ({
        exists(nick) { return [...users.values()].some(person => person.nick.toLowerCase() === String(nick).toLowerCase()); },
        getUserId(nick) {
          const person = [...users.values()].find(candidate => candidate.nick.toLowerCase() === String(nick).toLowerCase());
          if (!person) { throw new Error('unknown nick'); }
          return person.id;
        },
        getNick(userId) {
          const person = users.get(userId);
          if (!person) { throw new Error('unknown user id'); }
          return person.nick;
        }
      }) },
    AppContent: { headerbarContent: (htmlFile, height) => createContent(htmlFile, 'Headerbar', 0, height),
      popupContent: (htmlFile, width, height) => createContent(htmlFile, 'Popup', width, height) }
  });
  const source = fs.readFileSync(path.join(__dirname, '../app/main.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'main.js' });
  const app = context.App;
  function user(id, nick, role = 'listener') {
    if (users.has(id)) { return users.get(id); }
    const person = {
      id, nick, role, online: true, capable: true, messages: [], sessions: [], persistence: persistence(),
      getUserId() { return this.id; }, getNick() { return this.nick; },
      isOnlineInChannel() { return this.online; },
      isChannelOwner() { return this.role === 'owner'; },
      isChannelModerator() { return this.role === 'moderator'; },
      equals(other) { return !!other && this.id === other.id; },
      getPersistence() { return this.persistence; },
      canSendAppContent() { return this.capable; },
      sendPrivateMessage(message) { this.messages.push(message); },
      sendAppContent(content) {
        this.sessions.slice().filter(session => session.content.viewMode === content.viewMode).forEach(session => session.remove());
        const session = {
          user: this, content, events: [], removed: false,
          getUser() { return this.user; }, getAppContent() { return this.content; },
          sendEvent(type, data) {
            if (JSON.stringify(data).length > 10000) { throw new Error('Event payload exceeds API limit'); }
            this.events.push({ type, data: clone(data) });
            if (this.events.length > 100) { this.events.shift(); }
          },
          remove() {
            if (this.removed) { return; } this.removed = true;
            this.content.sessions = this.content.sessions.filter(item => item !== this);
            this.user.sessions = this.user.sessions.filter(item => item !== this);
            this.content.closeListeners.forEach(callback => callback(this.user, this.content, false));
          }
        };
        content.sessions.push(session); this.sessions.push(session); return session;
      }
    };
    users.set(id, person); return person;
  }
  app.onAppStart();
  return {
    app, config: context.MischWerkConfig, store, user, contents, logs,
    advance(ms) { timestamp += ms; },
    open(person) { app.chatCommands.mischwerk(person); return person.sessions[0]; },
    event(person, session, type, data = {}) {
      if (type === 'mw:wish.submit' && data.submissionId === undefined) {
        data = { ...data, submissionId: 'test-wish-' + (++submissionSequence) };
      }
      session.events = []; app.onEventReceived(person, type, data, session); return session.events;
    },
    state(person, session, page = 0, myPage, radioModeratorPage) {
      this.event(person, session, 'mw:refresh', { page, myPage, radioModeratorPage });
      return session.events.findLast(event => event.type === 'mw:state')?.data;
    }
  };
}
module.exports = { createHarness, persistence };

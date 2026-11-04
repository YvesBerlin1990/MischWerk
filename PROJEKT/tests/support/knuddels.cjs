// Nur für lokale Tests/Vorschau. Niemals nach Knuddels hochladen.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
function assertHex(hex) { if (!/^#[\da-f]{6}$/i.test(hex)) throw Error('Ungültige Color-Hexfarbe'); }
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
function createHarness(existingPersistence, options = {}) {
  const store = existingPersistence || persistence();
  const users = new Map();
  const contents = [];
  const logs = [];
  const escapedNicks = [];
  const bot = { messages: [], sendPublicMessage(message) { this.messages.push(message); } };
  const updateCalls = [];
  const updateFileCalls = [];
  const cacheInvalidations = [];
  const rootInstance = {
    availableFiles: ['server/app.js'],
    invalidateClientCache() {
      cacheInvalidations.push(true);
      if (options.failClientCache) { throw new Error('Private interne Cachedetails'); }
    },
    updateAppFiles() {
      const files = this.availableFiles.slice(); this.availableFiles = []; updateFileCalls.push(files); return files;
    },
    updateApp(message, logMessage) { updateCalls.push({ message, logMessage }); return 30; }
  };
  let submissionSequence = 0;
  let timestamp = Date.now();
  const timers = new Map();
  let timerSequence = 0;
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
    const loading = { background:'#FFFFFF', foreground:'#000000', text:'Lädt...', enabled:true };
    const content = { htmlFile, viewMode, width, height, sessions: [], closeListeners: [],
      loading, getLoadConfiguration: () => ({
        setBackgroundColor: color => { loading.background = color.asHexString(); },
        setForegroundColor: color => { loading.foreground = color.asHexString(); },
        setText: text => { loading.text = text; },
        setEnabled: value => { loading.enabled = value; }
      }),
      getHTMLFile() { return this.htmlFile; }, getSessions() { return this.sessions.slice(); },
      setResponsive(value) { this.responsive = value; }, setAllowJFXBrowser(value) { this.allowJFXBrowser = value; },
      addCloseListener(callback) { this.closeListeners.push(callback); } };
    contents.push(content); return content;
  }
  const context = vm.createContext({
    escapeKCodeMock(value) {
      escapedNicks.push(value);
      return value.replace(/[_°<>\\]/g, character => '\\' + character);
    },
    Date: FakeDate,
    setTimeout(callback, delay) { const id = ++timerSequence; timers.set(id, { callback, at:timestamp + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    HTMLFile,
    Color: { fromHexString: hex => { assertHex(hex); return { asHexString: () => hex.toUpperCase() }; } },
    UserType: { Human: 'human' },
    KnuddelsServer: { execute: file => runFile(file), getPersistence: () => store, getDefaultBotUser: () => bot, getDefaultLogger: () => ({
      warn(message) { logs.push({ level: 'warn', message }); },
      info(message) { logs.push({ level: 'info', message }); }
    }),
      getChannel: () => ({ getOnlineUsers: () => [...users.values()].filter(user => user.online) }),
      ...(options.serverMethods || {}),
      getAppAccess: () => ({ getOwnInstance: () => ({ getRootInstance: () => rootInstance }) }),
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
      popupContent: (htmlFile, width, height) => createContent(htmlFile, 'Popup', width, height),
      overlayContent: (htmlFile, width, height) => createContent(htmlFile, 'Overlay', width, height) }
  });
  vm.runInContext('String.prototype.escapeKCode = function () { return escapeKCodeMock(String(this)); };', context);
  const loadedFiles = [];
  function runFile(file) {
    const appRoot = path.resolve(__dirname, '../../app');
    const target = path.resolve(appRoot, file);
    if (!target.startsWith(appRoot + path.sep)) { throw new Error('Loader ausserhalb der App'); }
    loadedFiles.push(file);
    const result = vm.runInContext(fs.readFileSync(target, 'utf8'), context, { filename: file });
    if (file === 'server/app.js' && options.configureModules) { options.configureModules(context); }
    return result;
  }
  runFile('main.js');
  const app = context.App;
  let sessionSequence = 0;
  function user(id, nick, role = 'listener') {
    if (users.has(id)) { return users.get(id); }
    const person = {
      id, nick, role, online: true, capable: true, messages: [], sessions: [], persistence: persistence(),
      getUserId() { return this.id; }, getNick() { return this.nick; },
      isOnlineInChannel() { return this.online; },
      isChannelOwner() { return this.role === 'owner'; },
      isAppManager() { return this.role === 'owner' || this.role === 'manager'; },
      isChannelModerator() { return this.role === 'moderator'; },
      equals(other) { return !!other && this.id === other.id; },
      getPersistence() { return this.persistence; },
      canSendAppContent() { return this.capable; },
      sendPrivateMessage(message) { this.messages.push(message); },
      sendAppContent(content) {
        this.sessions.slice().filter(session => session.content.viewMode === content.viewMode).forEach(session => session.nativeClose(true));
        const openedAt = timestamp + ++sessionSequence;
        const session = {
          getOpenTimestamp() { return new Date(openedAt); },
          user: this, content, activeView:content.htmlFile.pageData.view, viewRevision:1, events: [], removed: false,
          getUser() { return this.user; }, getAppContent() { return this.content; },
          sendEvent(type, data) {
            if (JSON.stringify(data).length > 10000) { throw new Error('Event payload exceeds API limit'); }
            if (type === 'mw:view') { this.activeView = data.view; this.viewRevision = data.revision; }
            if (type === 'mw:state' && data.view) { this.activeView = data.view; this.viewRevision = data.viewRevision; }
            this.events.push({ type, data: clone(data) });
            if (options.onEvent) { options.onEvent(this, { type, data: clone(data) }); }
            if (this.events.length > 100) { this.events.shift(); }
          },
          remove() { this.nativeClose(false); },
          nativeClose(replacing) {
            if (this.removed) { return; } this.removed = true;
            this.content.sessions = this.content.sessions.filter(item => item !== this);
            this.user.sessions = this.user.sessions.filter(item => item !== this);
            this.content.closeListeners.forEach(callback => callback(this.user, this.content, replacing));
          }
        };
        content.sessions.push(session); this.sessions.push(session); return session;
      }
    };
    users.set(id, person); return person;
  }
  for (const person of options.users || []) { user(person.id, person.nick, person.role); }
  app.onAppStart();
  return {
    app, config: context.MischWerkConfig, store, user, contents, logs, bot, escapedNicks, updateCalls, updateFileCalls, cacheInvalidations, rootInstance, loadedFiles,
    timers,
    now() { return timestamp; },
    advance(ms) {
      timestamp += ms;
      for (const [id, task] of [...timers]) {
        if (task.at > timestamp || !timers.has(id)) continue;
        timers.delete(id); task.callback();
      }
    },
    open(person) { app.chatCommands.mischwerk(person); return person.sessions[0]; },
    event(person, session, type, data = {}) {
      if (/^mw:overlay\./.test(type)) { data = { view:session.activeView, viewRevision:session.viewRevision, ...data }; }
      if (type === 'mw:wish.submit' && data.submissionId === undefined) {
        data = { ...data, submissionId: 'test-wish-' + (++submissionSequence) };
      }
      session.events = []; app.onEventReceived(person, type, data, session); return session.events;
    },
    finishOverlay(person, surface, state = {}, error = false, revision = 1) {
      const prepare = surface.events.findLast(event => event.type === 'mw:overlay.prepare');
      if (!prepare) throw Error('Keine vorbereitete Overlay-Transaktion');
      return this.event(person, surface, 'mw:overlay.ready', { token:prepare.data.token, state, revision, error });
    },
    state(person, session, page = 0, myPage, radioModeratorPage) {
      this.event(person, session, 'mw:refresh', { page, myPage, radioModeratorPage });
      return session.events.findLast(event => event.type === 'mw:state')?.data;
    }
  };
}
module.exports = { createHarness, persistence };

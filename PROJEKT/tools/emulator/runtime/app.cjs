// Führt die echte lokale App aus. Node-VM ist eine Simulation, keine Rhino- oder Sicherheits-Sandbox.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TestClock } = require('./clock.cjs');
const { TestPersistence, copy } = require('./persistence.cjs');
const { TestUsers } = require('./users.cjs');
const { TestContents, payload } = require('./content.cjs');
function enumeration(names) { return Object.fromEntries(names.map(name => [name, Object.freeze({ toString: () => name })])); }
class AppRuntime {
  constructor(options) {
    this.options = options; this.appDir = fs.realpathSync(options.appDir);
    this.emit = options.emit || (() => {}); this.faults = options.faults;
    this.enums = { UserType: enumeration(['Human', 'AppBot']),
      AppViewMode: enumeration(['Headerbar', 'Popup', 'Overlay', 'Global']),
      ClientType: enumeration(['Applet', 'Browser', 'Android', 'IOS', 'Offline']) };
    this.clock = new TestClock(error => this.recordError('Timer', error));
    this.contents = new TestContents(this); this.users = new TestUsers(this, options.profiles);
    this.persistence = new TestPersistence(options.dataDir, () => this.faults.failPersistence,
      write => this.emit('persistence', write));
    this.cacheVersion = 0; this.loadedFiles = []; this.errors = [];
  }
  recordError(phase, error) {
    const detail = { phase, message: String(error.message), stack: String(error.stack || '') };
    this.errors.push(detail); if (this.errors.length > 100) this.errors.shift();
    this.emit('appError', detail);
  }
  invokeFunction(fn, args = [], thisArg = this.app) {
    if (typeof fn !== 'function') return;
    const previous = this.context.__emulatorCall;
    this.context.__emulatorCall = { fn, args, thisArg };
    try { return vm.runInContext('__emulatorCall.fn.apply(__emulatorCall.thisArg, __emulatorCall.args)', this.context, { timeout: 1500 }); }
    catch (error) { this.recordError('App-Callback', error); throw error; }
    finally { this.context.__emulatorCall = previous; }
  }
  execute(file) {
    const target = path.resolve(this.appDir, String(file));
    if (!target.startsWith(this.appDir + path.sep) || path.extname(target) !== '.js') throw new Error('App-Loader außerhalb des erlaubten Bereichs.');
    if (!fs.realpathSync(target).startsWith(this.appDir + path.sep)) throw new Error('App-Loader über Verknüpfung außerhalb der App.');
    this.loadedFiles.push(path.relative(this.appDir, target).replaceAll('\\', '/'));
    const source = this.options.source?.read(path.relative(this.appDir, target)) || fs.readFileSync(target);
    vm.runInContext(source.toString('utf8'), this.context, { filename: file, timeout: 1500 });
  }
  start() {
    const runtime = this;
    const logger = Object.fromEntries(['debug', 'info', 'warn', 'error', 'fatal'].map(level => [level, (...args) =>
      runtime.emit('log', { level, message: args.map(String).join(' ') })]));
    const rootInstance = {
      invalidateClientCache() { runtime.cacheVersion++; runtime.emit('cache', { version: runtime.cacheVersion }); },
      updateAppFiles() { runtime.emit('log', { level: 'info', message: 'Lokaler Update-Test: keine FTP-Verbindung, keine neuen Dateien.' }); return []; },
      updateApp() { throw new Error('Knuddels-Neustart wird lokal nicht angefordert. Testneustart in der Emulatorleiste verwenden.'); }
    };
    const channel = {
      getChannelName: () => 'MischWerk', getRootChannelName: () => 'MischWerk',
      getOnlineUsers: type => !type || type === runtime.enums.UserType.Human ? runtime.users.online().map(record => record.user) : []
    };
    const server = {
      execute: file => runtime.execute(file), getPersistence: () => runtime.persistence.api(),
      getDefaultLogger: () => logger, getChannel: () => channel, getUserAccess: () => runtime.users.access(),
      getDefaultBotUser: () => ({ getNick: () => 'MischWerk-Testbot',
        sendPublicMessage: message => runtime.emit('public', { nick: 'MischWerk-Testbot', message: String(message) }) }),
      getAppAccess: () => ({ getOwnInstance: () => ({ getRootInstance: () => rootInstance }) })
    };
    const strict = (target, label) => new Proxy(target, { get(object, property) {
      if (typeof property !== 'symbol' && !(property in object)) {
        const error = new Error('Nicht modellierte API: ' + label + '.' + property);
        runtime.recordError('API-Abdeckung', error); throw error;
      }
      return object[property];
    } });
    function HTMLFile(assetPath, pageData = {}) {
      if (typeof assetPath !== 'string' || !assetPath || assetPath.includes('\0') || assetPath.startsWith('/') || assetPath.split(/[\\/]/).includes('..')) throw new Error('Ungültiger HTMLFile-Pfad.');
      const data = payload(pageData);
      this.getAssetPath = () => assetPath; this.getPageData = () => copy(data);
    }
    const context = {
      Date: this.clock.Date, HTMLFile, UserType: this.enums.UserType, AppViewMode: this.enums.AppViewMode,
      Color: strict({ fromHexString: value => {
        if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) throw new Error('Color.fromHexString benötigt #RRGGBB.');
        return { asHexString: () => value.toUpperCase() };
      } }, 'Color'),
      KnuddelsServer: strict(server, 'KnuddelsServer'),
      AppContent: {
        headerbarContent: (html, height) => runtime.contents.create(html, 'Headerbar', 0, height),
        popupContent: (html, width = 300, height = 400) => runtime.contents.create(html, 'Popup', width, height),
        overlayContent: (html, width = 200, height = 350) => runtime.contents.create(html, 'Overlay', width, height)
      },
      setTimeout: (fn, delay, ...args) => this.clock.add(() => this.invokeFunction(fn, args), delay),
      setInterval: (fn, delay, ...args) => this.clock.add(() => this.invokeFunction(fn, args), delay, true),
      clearTimeout: id => this.clock.clear(id), clearInterval: id => this.clock.clear(id)
    };
    this.context = vm.createContext(context);
    vm.runInContext("String.prototype.escapeKCode = function () { return this.replace(/[_°<>\\\\]/g, function (c) { return '\\\\' + c; }); };", this.context);
    this.execute('main.js');
    this.app = this.context.App;
    if (!this.app || typeof this.app !== 'object') throw new Error('main.js hat kein App-Objekt erzeugt.');
    // Ausschließlich die lokale Instanz ändern; Dateien und echter Anbieter bleiben unberührt.
    if (this.options.providerConfig && this.context.MischWerkConfig) Object.assign(this.context.MischWerkConfig.streampanel, this.options.providerConfig);
    this.invokeFunction(this.app.onAppStart);
    this.clock.start(); this.emit('started', { loadedFiles: this.loadedFiles.length });
  }
  join(nick, connection, client = 'k3') {
    const record = this.users.find(nick);
    if (!record) throw new Error('Testnutzer zuerst anlegen.');
    if (record.state.online) throw new Error('Dieser Testnutzer ist bereits verbunden. Anderen Testnutzer wählen.');
    record.state.online = true; record.state.connection = connection; record.state.client = client;
    try { this.invokeFunction(this.app.onUserJoined, [record.user]); }
    catch (error) { this.leave(nick); throw error; }
    return record;
  }
  leave(nick) {
    const record = this.users.find(nick); if (!record || !record.state.online) return;
    record.state.online = false; record.state.connection = null;
    this.contents.removeUser(record.user);
    this.invokeFunction(this.app.onUserLeft, [record.user]);
  }
  event(nick, id, type, data) {
    const record = this.users.find(nick), session = record && this.contents.owned(id, record.user);
    if (!record?.state.online || !session) throw new Error('Fremde, geschlossene oder nicht verbundene Sitzung.');
    if (typeof type !== 'string' || !type || type === '*' || type.length > 100) throw new Error('Ungültiger Eventtyp.');
    this.invokeFunction(this.app.onEventReceived, [record.user, type, payload(data), session]);
  }
  close(nick, id) {
    const record = this.users.find(nick), session = record && this.contents.owned(id, record.user);
    if (!record?.state.online || !session) throw new Error('Diese Sitzung gehört nicht zum verbundenen Testnutzer.');
    session.remove();
  }
  command(nick, command, params = '') {
    const record = this.users.find(nick); if (!record?.state.online) throw new Error('Channelbeitritt erforderlich.');
    if (command === '/confirm' && params === '') {
      this.emit('platformCommand', { nick:record.state.nick, command, idleEffect:'not-modelled' }); return;
    }
    const fn = this.app.chatCommands?.[command];
    if (typeof fn !== 'function') throw new Error('Unbekannter Appbefehl.');
    this.invokeFunction(fn, [record.user, String(params), command]);
  }
  deleteUser(nick) {
    const record = this.users.find(nick); if (!record) throw new Error('Testnutzer existiert nicht.');
    this.leave(nick);
    this.invokeFunction(this.app.onUserDeleted, [record.state.id]);
    this.users.users.delete(record.state.nick.toLocaleLowerCase('de'));
  }
  shutdown() {
    try { this.invokeFunction(this.app?.onPrepareShutdown, [0]); this.invokeFunction(this.app?.onShutdown); }
    finally { try { this.contents.clear(); } finally { this.clock.stop(); } }
  }
}
module.exports = { AppRuntime };

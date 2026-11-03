const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { AppRuntime } = require('../runtime/app.cjs');
const { defaults, profiles, validateFaults } = require('../config.cjs');
const { payload } = require('../runtime/content.cjs');
const { copy } = require('../runtime/persistence.cjs');
const { SourceSnapshot } = require('../runtime/source.cjs');
class EmulatorHub {
  constructor(options) {
    this.options = options; this.faults = { ...defaults }; this.sockets = new Map();
    this.controlToken = randomUUID(); this.trace = []; this.sequence = 0;
    this.deliveryTimers = new Set(); this.epoch = 0; this.resourceGeneration = 0; this.lastEvents = new Map();
    this.startRuntime(profiles);
    this.sourceMonitor = setInterval(() => {
      try {
        const changed = this.source.changes();
        if (JSON.stringify(changed) !== JSON.stringify(this.sourceChanges)) {
          this.sourceChanges = changed;
          this.log('sourceChanges', { files: changed });
          this.broadcast(this.state());
        }
      } catch (error) { this.log('sourceError', { message: error.message }); }
    }, 2000);
    this.sourceMonitor.unref();
  }
  log(kind, data = {}) {
    const item = { ...copy(data), sequence: ++this.sequence, at: this.runtime?.clock.now() || Date.now(), realAt: Date.now(), kind };
    this.trace.push(item); if (this.trace.length > 500) this.trace.shift();
    this.broadcast({ type: 'trace', item }); return item;
  }
  providerConfig() {
    if (this.faults.provider === 'unconfigured') return { streamUrl: '', allowedHosts: [],
      metadata: { url: '', titleField: '', artistField: '', liveField: '' },
      status: { url: '', valueField: '', onlineValue: null, offlineValue: null, identityField: '', identityValue: '' } };
    const origin = 'https://emulator.mischwerk.invalid';
    return { streamUrl: origin + '/fixture/audio.wav', allowedHosts: ['emulator.mischwerk.invalid'],
      historyUrl: origin + '/fixture/history',
      metadata: { url: origin + '/fixture/metadata', titleField: 'title', artistField: 'artist', liveField: 'live' },
      status: { url: origin + '/fixture/status', valueField: 'status', onlineValue: 'started',
        offlineValue: 'stopped', identityField: '', identityValue: '' } };
  }
  startRuntime(definitions) {
    this.source = new SourceSnapshot(this.options.appDir);
    this.sourceChanges = [];
    this.options.appConfig = this.source.config;
    this.runtime = new AppRuntime({ appDir: this.options.appDir, dataDir: this.options.dataDir,
      profiles: definitions, faults: this.faults, source: this.source,
      providerConfig: this.providerConfig(),
      emit: (kind, data) => this.onRuntime(kind, data) });
    this.runtime.start();
  }
  setOrigin(origin) { this.options.origin = origin; }
  onRuntime(kind, data) {
    this.log(kind, data);
    if (kind === 'sessionEvent') {
      if (this.faults.dropServer > 0 && (!this.faults.dropServerType || this.faults.dropServerType === data.eventType)) {
        this.faults.dropServer--; this.log('droppedServer', { nick: data.nick, sessionId: data.sessionId, eventType: data.eventType }); return;
      }
      this.deliver(() => this.sendUser(data.nick, { type: 'sessionEvent', ...data }), this.faults.serverDelayMs);
    } else if (kind === 'contentShow') {
      this.sendUser(data.nick, { type: 'contentShow', ...data });
    } else if (kind === 'contentRemove') {
      this.sendUser(data.nick, { type: 'contentRemove', ...data });
    } else if (kind === 'private') this.sendUser(data.nick, { type: 'private', ...data });
    else if (kind === 'public') this.broadcast({ type: 'public', ...data });
  }
  deliver(callback, delay) {
    const epoch = this.epoch;
    if (!delay) { callback(); return; }
    if (this.deliveryTimers.size > 1000) throw new Error('Zu viele verzögerte Testpakete.');
    const timer = setTimeout(() => { this.deliveryTimers.delete(timer); if (epoch === this.epoch) callback(); }, delay);
    this.deliveryTimers.add(timer);
  }
  send(socket, message) { if (socket.readyState === 1) socket.send(JSON.stringify(message)); }
  broadcast(message) { for (const socket of this.sockets.values()) this.send(socket, message); }
  sendUser(nick, message) { for (const socket of this.sockets.values()) if (socket.nick === nick) this.send(socket, message); }
  state(includeTrace = false) {
    return { type: 'state', appName: 'MischWerk', appVersion: this.options.appConfig.appVersion,
      engine: 'Node-VM · simulierte Knuddels-API', now: this.runtime.clock.now(), epoch: this.epoch,
      sourceHash: this.source.hash,
      sourceChanges: includeTrace ? this.source.changes() : this.sourceChanges,
      users: this.runtime.users.descriptions(), faults: { ...this.faults },
      sessions: [...this.runtime.contents.sessions.keys()].map(id => {
        const view = this.runtime.contents.describe(id); delete view.pageData; return view;
      }), appErrors: this.runtime.errors.slice(), trace: includeTrace ? this.trace.slice() : undefined, rhino: this.rhino || null };
  }
  connect(socket) {
    socket.id = randomUUID(); socket.nick = null; this.sockets.set(socket.id, socket);
    this.send(socket, { ...this.state(true), type: 'hello', connectionId: socket.id });
    socket.on('message', raw => {
      try {
        const message = JSON.parse(raw.toString());
        if (!message || typeof message !== 'object' || Array.isArray(message) || typeof message.type !== 'string') throw new Error('Nachricht benötigt ein Objekt mit type.');
        this.receive(socket, message);
      } catch (error) {
        this.log('rejected', { nick: socket.nick, message: error.message });
        this.send(socket, { type: 'error', message: error.message });
      }
    });
    socket.on('error', error => this.log('socketError', { message: error.message }));
    socket.on('close', () => {
      this.sockets.delete(socket.id);
      if (socket.nick && this.runtime.users.find(socket.nick)?.state.connection === socket.id) {
        try { this.runtime.leave(socket.nick); } catch (error) { this.log('appError', { message: error.message }); }
      }
      this.broadcast({ type: 'state', ...this.state() });
    });
  }
  receive(socket, message) {
    switch (message.type) {
      case 'join': {
        if (socket.nick) throw new Error('Zuerst den Channel verlassen.');
        if (!['k3', 'stapp', 'android', 'ios', 'jfx'].includes(message.client || 'k3')) throw new Error('Unbekanntes Clientprofil.');
        const record = this.runtime.users.find(message.nick);
        if (!record) throw new Error('Unbekannter Testnutzer.');
        if (record.state.online) throw new Error('Testnutzer bereits verbunden.');
        socket.nick = record.state.nick;
        try { this.runtime.join(socket.nick, socket.id, message.client || 'k3'); }
        catch (error) { socket.nick = null; throw error; }
        this.send(socket, { type: 'joined', nick: socket.nick });
        this.log('joined', { nick: socket.nick, client: message.client || 'k3' }); break;
      }
      case 'leave':
        if (socket.nick) this.runtime.leave(socket.nick);
        socket.nick = null; this.send(socket, { type: 'left' }); break;
      case 'event': {
        if (!socket.nick) throw new Error('Nicht im Channel.');
        const event = { sessionId: message.sessionId, eventType: message.eventType, eventData: payload(message.eventData) };
        const user = this.runtime.users.find(socket.nick)?.user;
        if (!this.runtime.contents.owned(event.sessionId, user)) throw new Error('Fremde oder geschlossene Sitzung.');
        if (!this.faults.clientEventType || event.eventType === this.faults.clientEventType) this.lastEvents.set(socket.id, copy(event));
        this.dispatch(socket, event); break;
      }
      case 'close': this.runtime.close(socket.nick, message.sessionId); break;
      case 'command': this.runtime.command(socket.nick, String(message.command), message.params); break;
      case 'chat':
        if (!socket.nick || typeof message.message !== 'string' || message.message.length > 1000) throw new Error('Ungültige Chatnachricht.');
        this.broadcast({ type: 'public', nick: socket.nick, message: message.message }); break;
      case 'faults': {
        const next = validateFaults(message.value, this.faults);
        const requiresRestart = next.provider !== this.faults.provider;
        if (['resourceFailure', 'resourceDelayMs', 'loader'].some(key => next[key] !== this.faults[key])) this.resourceGeneration++;
        Object.assign(this.faults, next);
        this.log('faults', { value: this.faults });
        if (requiresRestart) this.restart(false);
        break;
      }
      case 'register':
        this.runtime.users.register({ nick: message.nick, role: message.role }); break;
      case 'deleteUser': {
        this.runtime.deleteUser(message.nick);
        for (const active of this.sockets.values()) {
          if (active.nick === message.nick) { active.nick = null; this.send(active, { type: 'left' }); }
        }
        this.log('userDeleted', { nick: message.nick }); break;
      }
      case 'role': {
        const record = this.runtime.users.find(message.nick);
        if (!record || !['owner', 'listener', 'manager', 'developer', 'cm'].includes(message.role)) throw new Error('Ungültige Rollenänderung.');
        record.state.role = message.role;
        this.log('role', { nick: record.state.nick, role: message.role });
        for (const [id, session] of [...this.runtime.contents.sessions]) {
          this.runtime.event(session.getUser().getNick(), id, 'mw:refresh', {});
        }
        break;
      }
      case 'capability': {
        const record = this.runtime.users.find(message.nick);
        if (!record || !['Overlay', 'Popup', 'Headerbar'].includes(message.mode) || typeof message.available !== 'boolean') throw new Error('Ungültige Fensterfähigkeit.');
        record.state.capabilities[message.mode] = message.available;
        this.log('capability', { nick: message.nick, mode: message.mode, available: message.available }); break;
      }
      case 'replay': {
        const event = this.lastEvents.get(socket.id);
        if (!event) throw new Error('Noch kein Appereignis zum Wiederholen.');
        this.dispatch(socket, event); break;
      }
      case 'advance':
        this.runtime.clock.advance(message.milliseconds); this.log('clock', { milliseconds: message.milliseconds }); break;
      case 'restart': this.restart(message.reset === true); break;
      case 'disconnect': socket.close(4000, 'Absichtlicher Verbindungsausfall'); return;
      case 'clearTrace': this.trace = []; break;
      case 'diagnostic': {
        if (typeof message.kind !== 'string' || !/^[a-zA-Z]{1,40}$/.test(message.kind) ||
            !message.value || typeof message.value !== 'object' || JSON.stringify(message.value).length > 16000) throw new Error('Ungültiger Browserbefund.');
        this.log(message.kind === 'diagnostic' ? 'clientDiagnostic' : message.kind, { ...message.value, nick: socket.nick });
        return;
      }
      case 'rhino': this.runRhino(); break;
      case 'state': break;
      default: throw new Error('Unbekannter Emulatorbefehl.');
    }
    this.broadcast(this.state());
  }
  dispatch(socket, event) {
    const matches = !this.faults.clientEventType || this.faults.clientEventType === event.eventType;
    if (matches && this.faults.dropClient > 0) {
      this.faults.dropClient--; this.log('droppedClient', { nick: socket.nick, ...event }); return;
    }
    const nick = socket.nick, duplicate = matches && this.faults.duplicateNext;
    if (matches) this.faults.duplicateNext = false;
    this.log('clientEvent', { nick, ...event, duplicate });
    const run = () => {
      try {
        const record = this.runtime.users.find(nick);
        if (!record?.state.online || record.state.connection !== socket.id) return;
        this.runtime.event(nick, event.sessionId, event.eventType, event.eventData);
        if (duplicate) this.runtime.event(nick, event.sessionId, event.eventType, event.eventData);
      } catch (error) { this.send(socket, { type: 'error', message: error.message }); this.log('deliveryError', { message: error.message }); }
    };
    this.deliver(run, this.faults.clientDelayMs);
  }
  restart(reset) {
    const definitions = this.runtime.users.descriptions();
    for (const timer of this.deliveryTimers) clearTimeout(timer);
    this.deliveryTimers.clear(); this.epoch++; this.lastEvents.clear();
    this.runtime.shutdown();
    if (reset) {
      Object.assign(this.faults, defaults);
      this.runtime.persistence.reset();
    }
    this.broadcast({ type: 'resetFrames' });
    this.startRuntime(definitions);
    for (const socket of this.sockets.values()) {
      if (socket.nick) this.runtime.join(socket.nick, socket.id, definitions.find(user => user.nick === socket.nick)?.client || 'k3');
    }
    this.log('restart', { reset });
  }
  runRhino() {
    if (this.rhino?.running) return;
    const { spawn } = require('node:child_process');
    this.rhino = { running: true, output: '', success: null };
    const child = spawn(process.execPath, [path.join(this.options.projectRoot, 'tools/checks/rhino.cjs')],
      { cwd: this.options.projectRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    this.rhinoChild = child;
    const timeout = setTimeout(() => child.kill(), 60000);
    const output = chunk => { this.rhino.output = (this.rhino.output + chunk.toString()).slice(-30000); };
    child.stdout.on('data', output); child.stderr.on('data', output);
    child.on('error', error => output(error.message));
    child.on('close', code => {
      clearTimeout(timeout); this.rhinoChild = null;
      this.rhino.running = false; this.rhino.success = code === 0;
      this.log('rhino', { success: code === 0, output: this.rhino.output }); this.broadcast(this.state());
    });
  }
  shutdown() {
    clearInterval(this.sourceMonitor);
    this.epoch++;
    for (const timer of this.deliveryTimers) clearTimeout(timer);
    this.deliveryTimers.clear(); this.rhinoChild?.kill();
    for (const socket of this.sockets.values()) socket.close(1001, 'Emulator beendet');
    this.sockets.clear(); this.runtime.shutdown();
  }
}
module.exports = { EmulatorHub };

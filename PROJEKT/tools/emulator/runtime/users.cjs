const { randomUUID } = require('node:crypto');
class TestUsers {
  constructor(runtime, definitions) {
    this.runtime = runtime; this.users = new Map();
    definitions.forEach(definition => this.register(definition));
  }
  register(definition) {
    const nick = String(definition.nick || '').trim();
    if (!nick || nick.length > 40 || /[\u0000-\u001f]/.test(nick)) throw new Error('Nickname: 1 bis 40 Zeichen.');
    const key = nick.toLocaleLowerCase('de');
    if (this.users.has(key)) return this.users.get(key);
    const state = { nick, id: definition.id || 1000 + this.users.size, role: definition.role || 'listener',
      online: false, connection: null, sendingContent: false, client: definition.client || 'k3',
      capabilities: { Headerbar: true, Popup: true, Overlay: true, ...definition.capabilities } };
    if (!['owner', 'listener', 'manager', 'developer', 'cm'].includes(state.role)) throw new Error('Ungültige Testrolle.');
    const runtime = this.runtime;
    const user = {
      getNick: () => state.nick, getUserId: () => state.id,
      getUserType: () => runtime.enums.UserType.Human,
      hasProfilePhoto: () => !!state.profilePhoto,
      getProfilePhoto: (width, height) => { state.photoSize = [width, height]; return state.profilePhoto; },
      getProfileLink: displayText => {
        const nick = state.nick.replace(/[_°<>\\|]/g, c => '\\' + c);
        return '°>' + (displayText === undefined ? nick : String(displayText)) + '|/w ' + nick + '<°';
      },
      equals: other => !!other && typeof other.getUserId === 'function' && other.getUserId() === state.id,
      isOnlineInChannel: () => state.online, isOnline: () => state.online,
      isChannelOwner: () => state.role === 'owner',
      isAppManager: () => ['owner', 'manager'].includes(state.role),
      isAppDeveloper: () => state.role === 'developer',
      isChannelModerator: () => state.role === 'cm',
      isConnectedWithK3Client: () => state.online && state.client === 'k3',
      getClientType: () => runtime.enums.ClientType[state.client === 'android' ? 'Android' : state.client === 'ios' ? 'IOS' : state.client === 'jfx' ? 'Applet' : 'Browser'],
      canShowAppViewMode: mode => state.online && state.capabilities[mode.toString()] === true,
      canSendAppContent: content => state.online && !state.sendingContent && state.capabilities[content.getAppViewMode().toString()] === true &&
        !(state.client === 'jfx' && !content.isAllowJFXBrowser()),
      sendAppContent: content => {
        if (!user.canSendAppContent(content)) return null;
        state.sendingContent = true;
        try { return runtime.contents.open(user, content); }
        finally { state.sendingContent = false; }
      },
      getAppContentSessions: mode => [...runtime.contents.sessions.values()].filter(session =>
        session.getUser() === user && (!mode || session.getAppViewMode() === mode)),
      getAppContentSession: mode => user.getAppContentSessions(mode)[0] || null,
      sendPrivateMessage: message => runtime.emit('private', { nick: state.nick, message: String(message) })
    };
    const record = { state, user, key: randomUUID() };
    this.users.set(key, record); return record;
  }
  find(nick) { return this.users.get(String(nick).toLocaleLowerCase('de')); }
  byId(id) { return [...this.users.values()].find(record => record.state.id === Number(id)); }
  online() { return [...this.users.values()].filter(record => record.state.online); }
  descriptions() { return [...this.users.values()].map(({ state }) => ({ ...state, capabilities: { ...state.capabilities }, connection: undefined })); }
  access() {
    return {
      exists: nick => !!this.find(nick),
      getUserId: nick => { const record = this.find(nick); if (!record) throw new Error('Unbekannter Testnutzer.'); return record.state.id; },
      getNick: id => { const record = this.byId(id); if (!record) throw new Error('Unbekannte Test-ID.'); return record.state.nick; },
      getUserById: id => this.byId(id)?.user || null
    };
  }
}
module.exports = { TestUsers };

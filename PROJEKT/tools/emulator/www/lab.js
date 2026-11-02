import { AppWindows } from './windows.js';
const $ = selector => document.querySelector(selector);
const boot = window.EmulatorBoot;
let socket, connectionId, joined = false, reconnectTimer, hidden = false, state = { faults: {}, users: [] }, trace = [];
const frames = new AppWindows(send, diagnostic, () => state.faults);
window.EmulatorLab = { frames, get state() { return state; }, get trace() { return trace; }, send };
function notice(message) { $('#notice').textContent = message; }
function send(value) {
  if (socket?.readyState !== WebSocket.OPEN) { notice('Steuerverbindung fehlt.'); return; }
  socket.send(JSON.stringify(value));
}
function diagnostic(kind, data) {
  if (socket?.readyState === WebSocket.OPEN) { send({ type: 'diagnostic', kind, value: data }); return; }
  const item = { at: Date.now(), kind, ...data };
  trace.push(item); if (trace.length > 500) trace.shift();
  renderTrace();
}
function connect() {
  socket = new WebSocket('ws://' + location.host + '/control?token=' + encodeURIComponent(boot.token));
  socket.addEventListener('open', () => { $('#connection').textContent = 'Lokal verbunden'; $('#connection').dataset.connected = 'true'; });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.connectionId) connectionId = message.connectionId;
    if (message.type === 'hello' || message.type === 'state') updateState(message);
    else if (message.type === 'trace') { trace.push(message.item); if (trace.length > 500) trace.shift(); renderTrace(); }
    else if (message.type === 'joined') { joined = true; updateJoined(); notice(message.nick + ' ist im Testchannel.'); }
    else if (message.type === 'left') { joined = false; frames.clear(); updateJoined(); }
    else if (message.type === 'error') { notice(message.message); diagnostic('error', { message: message.message }); }
    else if (message.type === 'contentShow') frames.show(message, connectionId);
    else if (message.type === 'contentRemove') frames.remove(message.sessionId);
    else if (message.type === 'sessionEvent') frames.event(message);
    else if (message.type === 'resetFrames') frames.clear();
    else if (message.type === 'public' || message.type === 'private') addChat(message);
  });
  socket.addEventListener('close', () => {
    joined = false; frames.clear(); updateJoined();
    $('#connection').textContent = 'Getrennt · neuer Beitritt erforderlich'; $('#connection').dataset.connected = 'false';
    clearTimeout(reconnectTimer); reconnectTimer = setTimeout(connect, 1500);
  });
}
function updateJoined() { $('#join').textContent = joined ? 'Channel verlassen' : 'Channel betreten'; $('#persona').disabled = joined; $('#client').disabled = joined; }
function updateState(value) {
  state = value;
  $('#version').textContent = 'App ' + value.appVersion;
  if (value.sourceChanges?.length) notice('Quellen geändert: Der laufende Test bleibt bei seinem geprüften Stand. Zum Übernehmen „App mit Testdaten neu starten“ wählen.');
  if (value.trace && trace.length === 0) trace = value.trace;
  const selected = $('#persona').value || new URLSearchParams(location.search).get('nick') || 'Otterchen';
  const signature = JSON.stringify(value.users.map(user => [user.nick, user.role]));
  if ($('#persona').dataset.signature !== signature) {
    $('#persona').replaceChildren(...value.users.map(user => {
      const option = document.createElement('option'); option.value = user.nick;
      option.textContent = user.nick + ' · ' + ({ owner: 'Besitzer', listener: 'Hörer', manager: 'AppManager', developer: 'Entwickler', cm: 'Channelmoderator' }[user.role]); return option;
    }));
    $('#persona').dataset.signature = signature; $('#persona').value = value.users.some(user => user.nick === selected) ? selected : value.users[0]?.nick || '';
  }
  $('#users').replaceChildren(...value.users.map(user => {
    const row = document.createElement('div'); row.className = 'user-row' + (user.online ? ' online' : '');
    const name = document.createElement('span'); name.textContent = user.nick;
    const status = document.createElement('span'); status.textContent = user.online ? 'im Channel' : 'offline';
    row.append(name, status); return row;
  }));
  for (const input of document.querySelectorAll('[data-fault]')) {
    if (document.activeElement === input) continue;
    if (input.type === 'checkbox') input.checked = value.faults[input.id]; else input.value = value.faults[input.id];
  }
  $('#clock').textContent = new Date(value.now).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) + ' · simulierte Serverzeit';
  if (value.rhino) $('#rhino-result').textContent = (value.rhino.running ? 'Rhino läuft …\n' : value.rhino.success ? 'Bestanden · echte Engines\n' : 'Fehlgeschlagen\n') + value.rhino.output;
  updatePersona(); renderTrace();
}
function updatePersona() {
  const user = state.users.find(item => item.nick === $('#persona').value);
  if (user) { $('#role').value = user.role; $('#no-overlay').checked = !user.capabilities.Overlay; }
}
function renderTrace() {
  const filter = $('#trace-filter').value;
  const events = trace.filter(item => !filter || (filter === 'error' ? /error|rejected|diagnostic|failure/i.test(item.kind) : item.kind === filter)).slice(-120);
  const list = $('#trace'), atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  list.replaceChildren(...events.map(item => {
    const row = document.createElement('li'); if (/error|rejected|failure/i.test(item.kind)) row.className = 'error';
    const title = document.createElement('div');
    title.textContent = new Date(item.at).toLocaleTimeString('de-DE') + '  ' + item.kind + (item.nick ? ' · ' + item.nick : '') +
      (item.eventType ? ' · ' + item.eventType : '') + (item.message ? ' · ' + item.message : '');
    const detail = document.createElement('details'), summary = document.createElement('summary'), text = document.createElement('pre');
    summary.textContent = 'Daten anzeigen'; text.textContent = JSON.stringify(item, null, 2);
    detail.append(summary, text); row.append(title, detail); return row;
  }));
  if (atBottom) list.scrollTop = list.scrollHeight;
}
function addChat(message) {
  const row = document.createElement('p'), nick = document.createElement('strong');
  nick.textContent = message.nick + (message.type === 'private' ? ' (privat): ' : ': ');
  row.append(nick, document.createTextNode(message.message)); $('#chat').append(row);
  if ($('#chat').children.length > 100) $('#chat').firstElementChild.remove();
}
$('#join').addEventListener('click', () => send(joined ? { type: 'leave' } : { type: 'join', nick: $('#persona').value, client: $('#client').value }));
$('#persona').addEventListener('change', updatePersona);
$('#apply-role').addEventListener('click', () => send({ type: 'role', nick: $('#persona').value, role: $('#role').value }));
$('#register').addEventListener('click', () => { send({ type: 'register', nick: $('#new-nick').value.trim(), role: 'listener' }); $('#new-nick').value = ''; });
$('#delete-user').addEventListener('click', () => send({ type: 'deleteUser', nick: $('#persona').value }));
$('#new-window').addEventListener('click', () => {
  const available = state.users.find(user => !user.online && user.nick !== $('#persona').value) || state.users[0];
  window.open('/?nick=' + encodeURIComponent(available.nick), '_blank', 'noopener');
});
function setWidth(value) {
  const width = Math.max(320, Math.min(3840, Number(value) || 1280)); $('#width').value = width;
  $('#stage').style.width = width + 'px'; $('#stage-label').textContent = width + ' px · echte Framebreite, keine Skalierung';
}
$('#width').addEventListener('change', event => setWidth(event.target.value));
$('#width-preset').addEventListener('change', event => setWidth(event.target.value));
$('#client').addEventListener('change', event => { if (event.target.value === 'android') setWidth(390); if (event.target.value === 'ios') setWidth(393); });
for (const input of document.querySelectorAll('[data-fault]')) input.addEventListener('change', () => {
  const value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
  send({ type: 'faults', value: { [input.id]: value } });
});
$('#drop-client').addEventListener('click', () => send({ type: 'faults', value: { dropClient: 1 } }));
$('#drop-server').addEventListener('click', () => send({ type: 'faults', value: { dropServer: 1, dropServerType: $('#dropServerType').value } }));
$('#duplicate').addEventListener('click', () => send({ type: 'faults', value: { duplicateNext: true } }));
$('#replay').addEventListener('click', () => send({ type: 'replay' }));
$('#disconnect').addEventListener('click', () => send({ type: 'disconnect' }));
$('#no-overlay').addEventListener('change', event => send({ type: 'capability', nick: $('#persona').value, mode: 'Overlay', available: !event.target.checked }));
$('#inspect').addEventListener('click', () => frames.inspect());
$('#visibility').addEventListener('click', () => { hidden = !hidden; frames.hidden(hidden); $('#visibility').textContent = hidden ? 'App wieder anzeigen' : 'App verbergen'; });
for (const button of document.querySelectorAll('[data-advance]')) button.addEventListener('click', () => send({ type: 'advance', milliseconds: Number(button.dataset.advance) }));
$('#restart').addEventListener('click', () => send({ type: 'restart' }));
$('#reset').addEventListener('click', () => send({ type: 'restart', reset: true }));
$('#rhino').addEventListener('click', () => send({ type: 'rhino' }));
$('#clear-trace').addEventListener('click', () => { trace = []; send({ type: 'clearTrace' }); renderTrace(); });
$('#trace-filter').addEventListener('change', renderTrace);
$('#chat-form').addEventListener('submit', event => {
  event.preventDefault(); const text = $('#chat-input').value; $('#chat-input').value = '';
  if (text.startsWith('/')) { const parts = text.slice(1).split(' '); send({ type: 'command', command: parts.shift(), params: parts.join(' ') }); }
  else send({ type: 'chat', message: text });
});
$('#export').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/report', { headers: { 'x-emulator-token': boot.token } });
    if (!response.ok) throw new Error('Bericht konnte nicht gelesen werden.');
    const report = await response.json(); report.browserFindings = trace.filter(item => !item.sequence);
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    link.download = 'MischWerk-Emulator-Pruefung.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) { notice(error.message); }
});
connect();

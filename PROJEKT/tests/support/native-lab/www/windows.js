// Echte CSS-Pixel, getrennte Header-/Channel-/Overlayframes. Kein Zoom und keine Gesamt-Skalierung.
export class AppWindows {
  constructor(send, diagnostic, getFaults) {
    this.send = send; this.diagnostic = diagnostic; this.getFaults = getFaults;
    this.sessions = new Map(); this.pendingSizes = new Set(); this.z = 10;
    this.stage = document.querySelector('#stage');
    this.stageWidth = this.stage.clientWidth;
    new ResizeObserver(() => {
      if (this.stage.clientWidth !== this.stageWidth) { this.stageWidth = this.stage.clientWidth; this.constrain(); }
    }).observe(this.stage);
    new ResizeObserver(() => {
      document.querySelector('#popups').style.top = document.querySelector('#headerbars').offsetHeight + 'px';
      this.fitStage();
    }).observe(document.querySelector('#headerbars'));
    window.addEventListener('message', message => this.receive(message));
  }
  show(description, connectionId) {
    this.remove(description.sessionId);
    const iframe = document.createElement('iframe');
    iframe.title = description.nick + ' · ' + description.mode + ' · ' + (description.pageData.view || '');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    const entry = { ...description, iframe, queue: [], loaded: false, min: { width: 0, height: 0 }, max: { width: 3840, height: 1000 } };
    // Der öffentliche Knuddels-Lader besitzt selbst einen weißen Unterbau.
    // LoadConfiguration gestaltet ausschließlich seine aktivierte Abdeckung.
    if (description.mode !== 'Headerbar') iframe.style.backgroundColor = '#ffffff';
    if (description.mode === 'Headerbar') {
      entry.element = iframe; iframe.style.height = description.height + 'px';
      document.querySelector('#headerbars').append(iframe);
    } else {
      const element = document.createElement('section');
      element.className = 'app-window ' + (description.mode === 'Overlay' ? 'overlay' : 'popup');
      element.dataset.session = description.sessionId;
      entry.element = element;
      element.style.backgroundColor = '#ffffff';
      if (description.mode !== 'Overlay') {
        const title = document.createElement('div'); title.className = 'window-title';
        const label = document.createElement('span'); label.textContent = description.pageData.view || 'App';
        const close = document.createElement('button'); close.textContent = '×'; close.title = 'Appfenster schließen';
        close.addEventListener('click', () => this.send({ type: 'close', sessionId: description.sessionId }));
        title.append(label, close); element.append(title);
        this.draggable(element, title);
        element.addEventListener('pointerdown', () => { element.style.zIndex = ++this.z; });
      }
      element.append(iframe);
      if (description.loading && (description.loading.enabled || this.getFaults().ignoreLoadingDisabled)) {
        const loading = document.createElement('div'); loading.className = 'app-loading';
        loading.style.backgroundColor = description.loading.background; loading.style.color = description.loading.foreground;
        loading.textContent = description.loading.text; loading.setAttribute('role', 'status');
        element.append(loading); entry.loadingElement = loading;
      }
      document.querySelector(description.mode === 'Overlay' ? '#overlays' : '#popups').append(element);
    }
    this.sessions.set(description.sessionId, entry);
    this.applySize(entry, description.width, description.height);
    if (description.mode !== 'Headerbar') {
      entry.resizeObserver = new ResizeObserver(() => {
        entry.width = entry.iframe.clientWidth; entry.height = entry.iframe.clientHeight; this.fitStage();
      });
      entry.resizeObserver.observe(entry.element);
    }
    iframe.src = '/frame/' + description.sessionId + '?connection=' + encodeURIComponent(connectionId);
    entry.startupTimer = setTimeout(() => {
      if (!entry.appReady && this.sessions.has(description.sessionId)) {
        entry.loadingElement?.remove();
        this.diagnostic('startupError', { sessionId: description.sessionId, message: 'App nach 16 Sekunden nicht bedienbereit.' });
      }
    }, 16000);
  }
  applySize(entry, width, height) {
    const stageWidth = this.stage.clientWidth;
    if (entry.mode === 'Headerbar') {
      entry.height = Math.max(20, Math.min(500, Math.round(height || entry.height)));
      entry.iframe.style.height = entry.height + 'px'; return;
    }
    const maxHeight = Math.max(120, Math.min(entry.max.height, window.innerHeight - 130));
    entry.width = Math.max(Math.min(200, stageWidth), Math.min(stageWidth, entry.max.width, Math.max(entry.min.width, width || entry.width)));
    entry.height = Math.max(80, Math.min(maxHeight, Math.max(entry.min.height, height || entry.height)));
    entry.element.style.width = entry.width + 'px';
    entry.element.style.height = entry.height + (entry.mode === 'Overlay' ? 0 : 30) + 'px';
    this.fitStage();
  }
  fitStage() {
    const headerHeight = document.querySelector('#headerbars').offsetHeight;
    let height = Math.max(620, headerHeight + 460);
    for (const entry of this.sessions.values()) {
      if (entry.mode === 'Headerbar') continue;
      height = Math.max(height, headerHeight + entry.element.offsetTop + entry.element.offsetHeight + 24);
    }
    document.querySelector('#channel').style.minHeight = Math.ceil(height - headerHeight) + 'px';
  }
  constrain() { for (const entry of this.sessions.values()) this.applySize(entry, entry.width, entry.height); }
  remove(id) {
    const entry = this.sessions.get(id); if (!entry) return;
    clearTimeout(entry.startupTimer); entry.resizeObserver?.disconnect(); entry.element.remove(); this.sessions.delete(id); this.fitStage();
  }
  clear() {
    for (const timer of this.pendingSizes) clearTimeout(timer);
    this.pendingSizes.clear();
    for (const id of [...this.sessions.keys()]) this.remove(id);
  }
  post(entry, type, data = {}) {
    entry.iframe.contentWindow.postMessage({ ...data, source: 'mischwerk-emulator-host', sessionId: entry.sessionId, type }, location.origin);
  }
  event(message) {
    const entry = this.sessions.get(message.sessionId); if (!entry) return;
    if (!entry.loaded) { entry.queue.push(message); if (entry.queue.length > 100) { entry.queue.shift(); this.diagnostic('bufferError', { message: 'Framepuffer voll.' }); } }
    else this.post(entry, 'event', message);
  }
  inspect() { for (const entry of this.sessions.values()) this.post(entry, 'inspect'); }
  hidden(value) {
    for (const entry of this.sessions.values()) {
      entry.iframe.style.visibility = value ? 'hidden' : '';
      this.post(entry, 'visibility', { hidden: value });
    }
  }
  receive(message) {
    if (message.origin !== location.origin || !message.data || message.data.source !== 'mischwerk-emulator-frame') return;
    const entry = this.sessions.get(message.data.sessionId);
    if (!entry || message.source !== entry.iframe.contentWindow) return;
    const data = message.data;
    if (data.type === 'event') this.send({ type: 'event', sessionId: entry.sessionId, eventType: data.eventType, eventData: data.eventData });
    else if (data.type === 'close') this.send({ type: 'close', sessionId: entry.sessionId });
    else if (data.type === 'command') {
      const command = data.command.replace(/^\//, '').split(' ');
      this.send({ type: 'command', command: command.shift(), params: command.join(' ') });
    } else if (data.type === 'frameLoaded') {
      entry.loadingElement?.remove();
      this.diagnostic('nativeReady', { sessionId:entry.sessionId, visibleAtHandoff:data.visibleAtHandoff === true });
      entry.loaded = true; entry.queue.splice(0).forEach(event => this.post(entry, 'event', event));
    } else if (data.type === 'ready') {
      entry.appReady = true; entry.loadingElement?.remove(); clearTimeout(entry.startupTimer); this.diagnostic('frameReady', { sessionId: entry.sessionId, milliseconds: data.milliseconds });
    } else if (data.type === 'host') this.host(entry, data);
    else this.diagnostic(data.type, data);
  }
  host(entry, data) {
    this.diagnostic('hostSize', { sessionId: entry.sessionId, mode: entry.mode, ...data });
    if (data.method === 'setTitle') { const title = entry.element.querySelector?.('.window-title span'); if (title) title.textContent = data.title; return; }
    if (data.method === 'setResizable') { if (entry.mode === 'Popup') entry.element.style.resize = data.value ? 'both' : 'none'; return; }
    if (data.method === 'setMinSize') { entry.min = { width: data.width, height: data.height }; return; }
    if (data.method === 'setMaxSize') { entry.max = { width: data.width || 3840, height: data.height || 1000 }; return; }
    if (data.method !== 'setSize') return;
    const mode = this.getFaults().hostSizing;
    if (mode === 'ignored') return;
    const targetWidth = data.width || entry.width, targetHeight = data.height || entry.height;
    const schedule = (callback, delay) => {
      const timer = setTimeout(() => {
        this.pendingSizes.delete(timer);
        if (this.sessions.get(entry.sessionId) === entry) callback();
      }, delay); this.pendingSizes.add(timer);
    };
    if (mode === 'stepped') {
      const previousHeight = entry.height;
      schedule(() => this.applySize(entry, targetWidth, Math.round((previousHeight + targetHeight) / 2)), 120);
      schedule(() => this.applySize(entry, targetWidth, targetHeight), 350);
    } else if (mode === 'delayed') schedule(() => this.applySize(entry, targetWidth, targetHeight), 500);
    else this.applySize(entry, targetWidth, targetHeight);
  }
  draggable(element, handle) {
    handle.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      const startX = event.clientX, startY = event.clientY, left = element.offsetLeft, top = element.offsetTop;
      handle.setPointerCapture(event.pointerId);
      const move = current => {
        element.style.left = Math.max(0, Math.min(this.stage.clientWidth - element.offsetWidth, left + current.clientX - startX)) + 'px';
        element.style.top = Math.max(0, Math.min(2000, top + current.clientY - startY)) + 'px';
        this.fitStage();
      };
      const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); };
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
    });
  }
}

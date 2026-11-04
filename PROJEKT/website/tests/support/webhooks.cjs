// Dokumentierte WebHook-Registrierung im lokalen Modell; keine externen HTTP-Aufrufe.
class TestWebHooks {
  constructor() { this.observers = new Map(); }
  api() {
    return {
      registerWebHook: (key, observer) => {
        if (!/^[a-zA-Z0-9_-]{1,50}$/.test(key) || typeof observer !== 'function') throw Error('Ungültiger WebHook.');
        this.observers.set(key, observer); return this.url(key);
      },
      getWebHookUrl: key => this.observers.has(key) ? this.url(key) : null,
      getRegisteredWebhooks: () => [...this.observers.keys()],
      unregisterWebHook: key => this.observers.delete(key),
      unregisterAllWebHooks: () => this.observers.clear()
    };
  }
  url(key) { return 'https://emulator.mischwerk.invalid/webhooks/local/' + key; }
  invoke(key, { method = 'GET', query = '', body = '', remoteAddress = '127.0.0.1' } = {}) {
    const observer = this.observers.get(key);
    if (!observer) throw Error('WebHook nicht registriert.');
    let result = null;
    observer({ getMethod: () => method, getQueryString: () => query, getBody: () => body,
      getRemoteAddress: () => remoteAddress }, {
      isSent: () => result !== null,
      send: (status, headers, text) => {
        if (result) throw Error('Doppelte WebHook-Antwort.');
        if (!Number.isInteger(status) || typeof text !== 'string') throw Error('Ungültige WebHook-Antwort.');
        result = { status, headers, body: text };
      }
    });
    if (!result) throw Error('WebHook hat nicht geantwortet.');
    return result;
  }
}
module.exports = { TestWebHooks };

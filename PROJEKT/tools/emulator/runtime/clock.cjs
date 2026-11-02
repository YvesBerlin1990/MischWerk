// Reale Zeit plus kontrollierter Zeitsprung. Übersprungene Intervalle werden nicht tausendfach nachgespielt.
class TestClock {
  constructor(onError = () => {}) {
    this.offset = 0; this.tasks = new Map(); this.sequence = 0; this.onError = onError;
    const clock = this;
    this.Date = class extends Date {
      constructor(...args) { super(...(args.length ? args : [clock.now()])); }
      static now() { return clock.now(); }
    };
  }
  now() { return Date.now() + this.offset; }
  add(callback, delay, interval = false, args = []) {
    if (typeof callback !== 'function') throw new Error('Timer benötigt eine Funktion.');
    const period = Math.max(1, Number(delay) || 1), id = ++this.sequence;
    this.tasks.set(id, { callback, args, at: this.now() + period, period: interval ? period : 0 });
    return id;
  }
  clear(id) { this.tasks.delete(id); }
  tick() {
    const now = this.now();
    for (const [id, task] of [...this.tasks]) {
      if (task.at > now || !this.tasks.has(id)) continue;
      if (task.period) task.at = now + task.period;
      else this.tasks.delete(id);
      try { task.callback(...task.args); } catch (error) { this.onError(error); }
    }
  }
  advance(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 32 * 86400000) throw new Error('Zeitsprung: 0 bis 32 Tage.');
    this.offset += milliseconds; this.tick(); return this.now();
  }
  start() { this.pulse = setInterval(() => this.tick(), 50); this.pulse.unref(); }
  stop() { clearInterval(this.pulse); this.tasks.clear(); }
}
module.exports = { TestClock };

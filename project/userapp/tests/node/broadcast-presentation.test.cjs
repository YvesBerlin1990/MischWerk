const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function presentation() {
  let now = 100000, current = { moderator: null, topic: '' }, fresh = false, render;
  const nodes = new Map(), events = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, { hidden: false, textContent: '', attributes: {},
      classList: { add() {}, toggle() {} }, setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; } });
    return nodes.get(id);
  }
  const document = { hidden: false, documentElement: element('root'), body: element('body'),
    querySelector: element, addEventListener() {} };
  const model = { current: () => current, broadcastFresh: () => fresh, positionsFresh: () => false };
  const dom = { el: element, setText: (id, value) => { element(id).textContent = value; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../app/www/js/radio/presentation.js'), 'utf8'), {
    document, Date: { now: () => now }, MischWerkUI: { define: (_name, factory) => {
      render = factory({ model, dom, signals: { emit() {}, on: (name, callback) => events.set(name, callback) } });
    } },
  });
  return { element, render, setState(value, confirmed) { current = value; fresh = confirmed; },
    provider(isLive) { events.get('broadcast-status')({ status: 'started', statusAt: now, modeAt: now, isLive }); },
    advance(milliseconds) { now += milliseconds; render.renderOnAirStatus(); } };
}

test('Nur frische zentrale Moderation bestätigt den Live-DJ; Anbieter-Live ersetzt keinen Namen', () => {
  const p = presentation(); p.provider(true);
  assert.equal(p.element('on-air-sign').textContent, 'Moderation derzeit nicht verfügbar');
  assert.equal(p.element('host-name').hidden, true);
  p.setState({ moderator: { nick: 'Prüf-DJ' }, topic: 'Ätherklänge' }, true);
  p.render.renderTopic(); p.render.renderOnAirStatus();
  assert.equal(p.element('on-air-sign').textContent, 'Es moderiert');
  assert.equal(p.element('host-name').attributes['aria-label'], 'Prüf-DJ');
  assert.equal(p.element('show-topic').textContent, 'Ätherklänge');
  p.setState({ moderator: { nick: 'Vorheriger DJ' }, topic: 'Altes Thema' }, false);
  p.render.renderTopic(); p.render.renderOnAirStatus();
  assert.equal(p.element('on-air-sign').textContent, 'Moderation derzeit nicht verfügbar');
  assert.equal(p.element('show-topic').textContent, 'MischWerk Radio Show');
  assert.equal(p.element('host-name').hidden, true);
});

test('Bestätigter AutoDJ bleibt unabhängig, sein Nachweis gilt wie auf Web und Android höchstens 45 Sekunden', () => {
  const p = presentation(); p.provider(false);
  assert.equal(p.element('on-air-sign').textContent, 'MischWerk am Pult');
  p.advance(45001);
  assert.equal(p.element('on-air-sign').textContent, 'Moderation derzeit nicht verfügbar');
});

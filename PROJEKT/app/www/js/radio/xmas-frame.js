/* X-Mas-Tafel wie im Web: Schneeschicht, Schneefall, Fotokabel, fünffarbige Birnen, Eckgirlanden,
   Zweige, Geschenke und Schleifen. Geometrie liefert radio/xmas-lights, den Schnee radio/xmas-snow. */
MischWerkUI.define('xmasFrame', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, lights = dependencies.xmasLights, snow = dependencies.xmasSnow;
  var host = dom.el('radio-xmas-lights'), root = document.documentElement;
  var LIGHTS = lights && lights.LIGHTS, BLEED = 8, WIDE_AT = 1220;
  var built = false, wire = null, field = null, flakes = null, garlands = [], bulbs = [], stamp = '';
  var cable = new Image();
  cable.onload = function () { stamp = ''; fit(); };

  function layer(className, parent, tag) {
    var node = document.createElement(tag || 'div');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    parent.appendChild(node);
    return node;
  }
  function build() {
    built = true;
    cable.src = 'img/xmas-kabel.png';
    var face = dom.el('radio-panel').querySelector('.radio-program-face');
    if (face) { layer('radio-xmas-floor', face); }
    flakes = layer('radio-xmas-snow', host, 'canvas');
    wire = layer('radio-xmas-wire', host, 'canvas');
    field = layer('radio-xmas-bulbs', host);
    garlands = ['left', 'right'].map(function (side) { return layer('radio-xmas-corner radio-xmas-garland radio-xmas-' + side, host); });
    layer('radio-xmas-corner radio-xmas-sprig radio-xmas-left', host);
    layer('radio-xmas-corner radio-xmas-sprig radio-xmas-right', host);
    [['left', ['schneeflocken', 'sterne']], ['right', ['tannen', 'goldstreifen', 'creme']]].forEach(function (scene) {
      var vignette = layer('radio-xmas-vignette radio-xmas-' + scene[0], host);
      scene[1].forEach(function (name) { layer('radio-xmas-corner radio-xmas-gift radio-xmas-gift-' + name, vignette, 'i'); });
    });
    layer('radio-xmas-corner radio-xmas-bow radio-xmas-left', host);
    layer('radio-xmas-corner radio-xmas-bow radio-xmas-right', host);
  }

  // Breit: zu lange Titel bis 18 px einpassen; was dann nicht passt, bleibt per Fokus und Scrollen lesbar.
  function fitTitles(wide) {
    ['track-title', 'track-artist'].forEach(function (id) {
      var node = dom.el(id);
      if (!node) { return; }
      node.style.fontSize = '';
      node.removeAttribute('data-fit-overflow');
      if (!wide || !node.clientHeight) { return; }
      var size = parseFloat(getComputedStyle(node).fontSize) || 18;
      while (node.scrollHeight > node.clientHeight + 1 && size > 18) {
        size = Math.max(18, size - 1);
        node.style.fontSize = size + 'px';
      }
      if (node.scrollHeight > node.clientHeight + 1) { node.setAttribute('data-fit-overflow', 'true'); }
    });
  }

  function fit() {
    var on = !!host && !!lights && root.classList.contains('theme-xmas');
    if (!on) {
      if (snow && flakes) { snow.attach(flakes, false); }
      ['track-title', 'track-artist'].forEach(function (id) { var node = dom.el(id); if (node) { node.style.fontSize = ''; } });
      return;
    }
    if (!built) { build(); }
    var panel = dom.el('radio-panel'), frame = panel.getBoundingClientRect();
    var width = panel.clientWidth, height = panel.clientHeight, compact = window.innerWidth < WIDE_AT;
    fitTitles(!compact);
    if (snow) { snow.attach(flakes, width > 0); }
    if (width < 40 || height < 40) { return; }
    // Unter den oberen Girlanden bleiben die Birnen aus; unten laufen sie unter den Zweigen durch.
    var covered = [];
    garlands.forEach(function (node, index) {
      var box = node.getBoundingClientRect();
      covered = covered.concat(lights.garlandCover([box.left - frame.left, box.top - frame.top, box.width, box.height], index === 1));
    });
    var density = Math.min(window.devicePixelRatio || 1, 3);
    var key = [width, height, compact, density, cable.complete && cable.naturalWidth].concat(covered.map(function (c) {
      return c.map(Math.round).join(',');
    })).join('/');
    if (key === stamp) { return; }
    stamp = key;
    var result = lights.layout(width, height, compact, covered), profile = compact ? 'compact' : 'wide';
    // Die Zeichenfläche ragt rundum über die Tafel hinaus, damit das Kabel an den Kanten nicht abreißt.
    wire.style.left = wire.style.top = -BLEED + 'px';
    wire.style.width = width + 2 * BLEED + 'px';
    wire.style.height = height + 2 * BLEED + 'px';
    wire.width = Math.ceil((width + 2 * BLEED) * density);
    wire.height = Math.ceil((height + 2 * BLEED) * density);
    var context = wire.getContext && wire.getContext('2d');
    if (context && cable.complete && cable.naturalWidth) {
      context.setTransform(density, 0, 0, density, BLEED * density, BLEED * density);
      context.imageSmoothingQuality = 'high';
      lights.drawCable(context, result.spans, LIGHTS.cable[profile], cable);
    }
    while (bulbs.length < result.bulbs.length) { bulbs.push(layer('radio-xmas-bulb', field, 'i')); layer('radio-xmas-glow', bulbs[bulbs.length - 1], 'b'); }
    while (bulbs.length > result.bulbs.length) { field.removeChild(bulbs.pop()); }
    // Die Birnen hängen mit der Fassung am Kabel senkrecht nach unten; Farben in fester Folge.
    var size = LIGHTS.bulb[profile];
    result.bulbs.forEach(function (point, index) {
      var node = bulbs[index], style = node.style, timing = lights.twinkle(point.index);
      node.setAttribute('data-index', point.index);
      node.setAttribute('data-color', LIGHTS.colors[point.index % LIGHTS.colors.length]);
      style.left = point.x - size / 2 + 'px'; style.top = point.y - size * .06 + 'px';
      style.width = size + 'px'; style.height = size * LIGHTS.bulbAspect + 'px';
      style.setProperty('--twinkle-period', timing.period + 'ms');
      style.setProperty('--twinkle-delay', timing.delay + 'ms');
    });
    host.setAttribute('data-ready', 'true');
  }

  return {fit:fit};
});

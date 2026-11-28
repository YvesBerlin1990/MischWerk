/* Leiser Schneefall in der X-Mas-Tafel wie im Web (referenz/christmas-snowfall.js, Profil playerSnow).
   Genau eine Animationsschleife, nur bei sichtbarer X-Mas-Radioleiste; reduzierte Bewegung zeigt ein stehendes Bild. */
MischWerkUI.define('xmasSnow', function () {
  'use strict';
  // Werte aus medien/xmas/xmas-player.json (playerSnow).
  var PROFILE = {cycleSeconds:120, seed:907, rate:0.00011, min:10, max:60, widths:[1.3, 2, 3.2],
    speeds:[9, 14, 20], opacities:[0.45, 0.6, 0.5], foreground:0.08, middle:0.3};
  var EDGE = 24, canvas = null, context = null, sprites = null, flakes = [], width = 0, height = 0;
  var frame = null, previous = null, elapsed = 0, enabled = false;
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};

  function sprite(depth) {
    var node = document.createElement('canvas'), ctx;
    node.width = node.height = 32;
    ctx = node.getContext('2d');
    var glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, '#f5f8ff');
    glow.addColorStop(depth === 2 ? .28 : .46, 'rgba(234,242,255,.72)');
    glow.addColorStop(1, 'rgba(184,209,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 32);
    return node;
  }

  function resize() {
    var visibleWidth = canvas.clientWidth, visibleHeight = canvas.clientHeight;
    var density = Math.min(window.devicePixelRatio || 1, 1.5);
    var pixelWidth = Math.round(visibleWidth * density), pixelHeight = Math.round(visibleHeight * density);
    if (!visibleWidth || !visibleHeight) { return false; }
    if (width === visibleWidth && height === visibleHeight && canvas.width === pixelWidth && canvas.height === pixelHeight) { return true; }
    width = visibleWidth; height = visibleHeight;
    canvas.width = pixelWidth; canvas.height = pixelHeight;
    context.setTransform(density, 0, 0, density, 0, 0);
    sprites = sprites || PROFILE.widths.map(function (ignored, depth) { return sprite(depth); });
    var count = Math.max(PROFILE.min, Math.min(PROFILE.max, Math.round(width * height * PROFILE.rate))), seed = PROFILE.seed;
    function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    function vary(value) { return value * (.72 + .56 * random()); }
    flakes = [];
    for (var index = 0; index < count; index++) {
      var depth = index < count * (1 - PROFILE.middle - PROFILE.foreground) ? 0 : index < count * (1 - PROFILE.foreground) ? 1 : 2;
      var x = random(), y = random();
      flakes.push({depth:depth, x:x, y:y, radius:vary(PROFILE.widths[depth]), opacity:vary(PROFILE.opacities[depth]),
        drift:vary(5 * (depth + 1)), phase:random() * 2 * Math.PI, swayCycles:Math.round(7 + 10 * random()),
        fallCycles:Math.max(1, Math.round(vary(PROFILE.speeds[depth]) * PROFILE.cycleSeconds / (height + 2 * EDGE)))});
    }
    return true;
  }

  function draw(still) {
    var progress = elapsed / PROFILE.cycleSeconds, wave = 2 * Math.PI * progress, sharedWind = Math.sin(wave * 3) * 11;
    var pathWidth = width + 2 * EDGE, pathHeight = height + 2 * EDGE;
    context.clearRect(0, 0, width, height);
    for (var i = 0; i < flakes.length; i++) {
      var flake = flakes[i];
      if (still && flake.depth === 2) { break; }
      var wind = sharedWind + Math.sin(wave * flake.swayCycles + flake.phase) * flake.drift;
      var x = (pathWidth + flake.x * pathWidth + wind) % pathWidth - EDGE;
      var y = (flake.y + progress * flake.fallCycles) % 1 * pathHeight - EDGE;
      context.globalAlpha = flake.opacity * (still ? .65 : 1);
      context.drawImage(sprites[flake.depth], x - flake.radius, y - flake.radius, flake.radius * 2, flake.radius * 2);
    }
    context.globalAlpha = 1;
  }

  function active() { return enabled && !document.hidden && !!context; }
  function render(time) {
    frame = null;
    if (!active() || reduced.matches || !resize()) { return; }
    if (previous !== null) { elapsed = (elapsed + (time - previous) / 1000) % PROFILE.cycleSeconds; }
    previous = time;
    draw(false);
    frame = window.requestAnimationFrame(render);
  }
  function update() {
    if (frame !== null) { window.cancelAnimationFrame(frame); }
    frame = null; previous = null;
    if (!active()) { return; }
    if (!resize()) { return; }
    draw(reduced.matches);
    if (!reduced.matches) { frame = window.requestAnimationFrame(render); }
  }

  // Die Tafel liefert ihre Leinwand; ohne X-Mas oder bei verborgener Seite steht die Schleife still.
  function attach(node, on) {
    if (node && node !== canvas) {
      canvas = node;
      context = node.getContext ? node.getContext('2d') : null;
      width = 0;
    }
    enabled = !!on;
    update();
  }
  document.addEventListener('visibilitychange', update);
  if (reduced.addEventListener) { reduced.addEventListener('change', update); }
  else if (reduced.addListener) { reduced.addListener(update); }
  window.addEventListener('pagehide', function () { enabled = false; update(); });
  return {attach:attach, PROFILE:PROFILE};
});

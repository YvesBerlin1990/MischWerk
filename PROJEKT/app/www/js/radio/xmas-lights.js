/* Reine X-Mas-Kettengeometrie wie im Web (referenz/xmas-frame.js): Zufallstakt,
   Birnen auf freien Strecken zwischen den Girlanden und durchhängendes Fotokabel. */
MischWerkUI.define('xmasLights', function () {
  'use strict';
  // Werte aus medien/xmas/xmas-player.json (lights); tests/node/xmas.test.cjs gleicht sie ab.
  var LIGHTS = {spacing:{wide:56, compact:42}, inset:2, bulb:{wide:18, compact:14}, sag:4.5, seed:1225,
    periodMs:[6200, 11400], dim:0, rest:0.82, cable:{wide:3.6, compact:3},
    colors:['warmweiss', 'rot', 'gruen', 'bernstein', 'eisblau'], bulbAspect:1.4, glassCenter:0.67};
  var DECK_RADIUS = 24;

  // Mulberry32: kleine, plattformgleich nachrechenbare Zufallsfolge.
  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function twinkle(index) {
    var next = seededRandom(LIGHTS.seed + index * 7919);
    var period = Math.round(LIGHTS.periodMs[0] + next() * (LIGHTS.periodMs[1] - LIGHTS.periodMs[0]));
    return {period:period, delay:-Math.round(next() * period)};
  }

  function perimeterPoint(left, top, right, bottom, radius, distance) {
    var sx = right - left - 2 * radius, sy = bottom - top - 2 * radius, arc = Math.PI * radius / 2, h = Math.PI / 2;
    var segments = [
      [sx, function (t) { return [left + radius + t * sx, top]; }],
      [arc, function (t) { return [right - radius + Math.sin(t * h) * radius, top + radius - Math.cos(t * h) * radius]; }],
      [sy, function (t) { return [right, top + radius + t * sy]; }],
      [arc, function (t) { return [right - radius + Math.cos(t * h) * radius, bottom - radius + Math.sin(t * h) * radius]; }],
      [sx, function (t) { return [right - radius - t * sx, bottom]; }],
      [arc, function (t) { return [left + radius - Math.sin(t * h) * radius, bottom - radius + Math.cos(t * h) * radius]; }],
      [sy, function (t) { return [left, bottom - radius - t * sy]; }],
      [arc, function (t) { return [left + radius - Math.cos(t * h) * radius, top + radius - Math.sin(t * h) * radius]; }]
    ];
    var total = 2 * sx + 2 * sy + 4 * arc, rest = ((distance % total) + total) % total;
    for (var i = 0; i < segments.length; i++) {
      if (rest <= segments[i][0] && segments[i][0] > 0) { return segments[i][1](rest / segments[i][0]); }
      rest -= segments[i][0];
    }
    return segments[0][1](0);
  }
  function wrap(distance, perimeter) { return ((distance % perimeter) + perimeter) % perimeter; }

  // Birnen ab Mitte oben im Uhrzeigersinn; unter dem Grün der Girlanden bleiben sie aus.
  function layout(width, height, compact, covered) {
    covered = covered || [];
    var profile = compact ? 'compact' : 'wide', bulb = LIGHTS.bulb[profile], spacing = LIGHTS.spacing[profile];
    // Seitlich so weit innen, dass die Birnen vollständig auf der Tafel hängen.
    var insetX = Math.max(LIGHTS.inset, bulb / 2 + 1), insetY = LIGHTS.inset, radius = Math.max(0, DECK_RADIUS - insetX);
    var left = insetX, top = insetY, right = width - insetX, bottom = height - insetY;
    var perimeter = 2 * (right - left - 2 * radius) + 2 * (bottom - top - 2 * radius) + 2 * Math.PI * radius;
    var count = Math.max(8, Math.round(perimeter / spacing)), start = (right - left - 2 * radius) / 2;
    function pointAt(distance) { return perimeterPoint(left, top, right, bottom, radius, start + distance); }
    function free(distance) {
      var p = pointAt(distance), box = [p[0] - bulb / 2, p[1] - bulb * .06, p[0] + bulb / 2, p[1] + bulb * LIGHTS.bulbAspect];
      return !covered.some(function (c) { return box[0] < c[2] && box[2] > c[0] && box[1] < c[3] && box[3] > c[1]; });
    }
    var intervals = [], open = null, distance, i;
    for (distance = 0; distance < perimeter; distance += .5) {
      var visible = free(distance);
      if (visible && open === null) { open = distance; }
      if (!visible && open !== null) { intervals.push([open, distance - .5]); open = null; }
    }
    if (open !== null) { intervals.push([open, perimeter]); }
    if (intervals.length > 1 && intervals[0][0] === 0 && intervals[intervals.length - 1][1] >= perimeter - 1) {
      intervals[0][0] = intervals.pop()[0] - perimeter;
    }
    var places = [];
    if (!covered.length || (intervals.length === 1 && intervals[0][1] - intervals[0][0] >= perimeter - 1)) {
      for (i = 0; i < count; i++) { places.push(i * perimeter / count); }
    } else {
      // Je freier Strecke gleichmäßig verteilt, mit je einer Birne direkt an beiden Enden.
      intervals.forEach(function (range) {
        var length = range[1] - range[0], n = length < bulb ? 1 : Math.max(2, Math.round(length / spacing) + 1);
        for (var k = 0; k < n; k++) { places.push(n === 1 ? range[0] + length / 2 : range[0] + k * length / (n - 1)); }
      });
    }
    places.sort(function (p, q) { return wrap(p, perimeter) - wrap(q, perimeter); });
    var bulbs = places.map(function (place, index) {
      var p = pointAt(place);
      return {x:p[0], y:p[1], index:index, distance:wrap(place, perimeter)};
    });
    // Das Kabel verbindet alle Fassungen und läuft unter dem Grün im normalen Abstand weiter.
    var anchors = bulbs.map(function (row) { return row.distance; });
    for (i = 0; i < count; i++) {
      distance = i * perimeter / count;
      var near = bulbs.some(function (row) {
        var gap = Math.abs(row.distance - distance);
        return gap < spacing / 2 || gap > perimeter - spacing / 2;
      });
      if (!near && !free(distance)) { anchors.push(distance); }
    }
    anchors.sort(function (p, q) { return p - q; });
    var points = anchors.map(pointAt);
    var spans = points.map(function (from, index) {
      var to = points[(index + 1) % points.length];
      return [from, [(from[0] + to[0]) / 2, Math.min((from[1] + to[1]) / 2 + LIGHTS.sag, height - 1)], to];
    });
    return {bulbs:bulbs, spans:spans, count:count};
  }

  // Dichtes Grün einer Eckgirlande: oberer und seitlicher Arm, rechts gespiegelt.
  function garlandCover(box, mirrored) {
    return [[0, 0, 1, .4], [0, 0, .3, 1]].map(function (arm) {
      var a = mirrored ? 1 - arm[2] : arm[0], b = mirrored ? 1 - arm[0] : arm[2];
      return [box[0] + a * box[2], box[1] + arm[1] * box[3], box[0] + b * box[2], box[1] + arm[3] * box[3]];
    });
  }

  // Die Kabelkachel enthält oben und unten je 12 % Rand; die Textur läuft über alle Bögen fort.
  function drawCable(context, spans, thickness, cable) {
    var drawnHeight = thickness * 1.24, scale = drawnHeight / cable.height, tileLength = cable.width * scale, travelled = 0;
    spans.forEach(function (span) {
      var from = span[0], control = span[1], to = span[2];
      var rough = Math.hypot(control[0] - from[0], control[1] - from[1]) + Math.hypot(to[0] - control[0], to[1] - control[1]);
      var steps = Math.max(2, Math.ceil(rough / 3)), previous = from;
      for (var step = 1; step <= steps; step++) {
        var t = step / steps, point = [0, 1].map(function (k) {
          return (1 - t) * (1 - t) * from[k] + 2 * (1 - t) * t * control[k] + t * t * to[k];
        });
        var length = Math.hypot(point[0] - previous[0], point[1] - previous[1]), drawn = 0, total = length + .6;
        context.save();
        context.translate(previous[0], previous[1]);
        context.rotate(Math.atan2(point[1] - previous[1], point[0] - previous[0]));
        while (drawn < total) {
          var offset = (travelled + drawn) % tileLength, chunk = Math.min(total - drawn, tileLength - offset);
          context.drawImage(cable, offset / scale, 0, chunk / scale, cable.height, drawn, -drawnHeight / 2, chunk, drawnHeight);
          drawn += chunk;
        }
        context.restore();
        travelled += length;
        previous = point;
      }
    });
  }

  return {LIGHTS:LIGHTS, seededRandom:seededRandom, twinkle:twinkle, layout:layout, garlandCover:garlandCover, drawCable:drawCable};
});

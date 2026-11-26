/* Lampen und Kabel teilen sich den gerundeten Verlauf der vorhandenen Größenmessung. */
MischWerkUI.define('xmasFrame', function (dependencies) {
  'use strict';
  var frame = dependencies.dom.el('radio-xmas-frame');
  var measured = '', halos = frame.querySelector('.radio-xmas-halos');
  var lights = [];

  function fitLights(count) {
    if (lights.length === count) { return; }
    lights.forEach(function (light) { light.lamp.remove(); light.halo.remove(); });
    lights = [];
    // Ganze Gruppen auf einem geschlossenen Ring halten auch die Naht zwischen Ende und Anfang im Takt.
    var groups = Math.max(1, Math.round(count / 7));
    for (var index = 0; index < count; index += 1) {
      var lamp = document.createElement('span');
      lamp.className = 'radio-xmas-lamp';
      lamp.style.setProperty('--xmas-phase', (-3.6 * ((count - index) * groups % count) / count).toFixed(5) + 's');
      var halo = lamp.cloneNode(false);
      halo.className = 'radio-xmas-halo';
      halos.appendChild(halo);
      frame.appendChild(lamp);
      lights.push({lamp:lamp, halo:halo});
    }
  }

  function placeLight(light, point) {
    light.style.setProperty('--xmas-x', point[0].toFixed(2) + 'px');
    light.style.setProperty('--xmas-y', point[1].toFixed(2) + 'px');
    light.style.setProperty('--xmas-angle', point[2].toFixed(2) + 'deg');
  }

  function fit() {
    var box = frame.getBoundingClientRect();
    if (!box.width || !box.height) { return; }
    var style = getComputedStyle(frame);
    var inset = parseFloat(style.getPropertyValue('--xmas-cable-inset')) || 0;
    var width = box.width - 2 * inset, height = box.height - 2 * inset;
    var radius = Math.min(parseFloat(style.borderTopLeftRadius) - inset, width / 2, height / 2);
    var spacing = parseFloat(style.getPropertyValue('--xmas-lamp-gap'));
    if (!(radius > 0 && spacing > 0)) { return; }
    var stamp = [width, height, radius, spacing, inset].join('/');
    if (stamp === measured) { return; }
    measured = stamp;

    var segments = [], perimeter = 0, corners = [];
    function line(x, y, dx, dy, length, angle) {
      segments.push({start:perimeter, point:function (distance) {
        return [x + distance * dx, y + distance * dy, angle];
      }});
      perimeter += length;
    }
    function corner(x, y, angle) {
      var length = Math.PI * radius / 2;
      corners.push(perimeter + length / 2);
      segments.push({start:perimeter, point:function (distance) {
        var radians = angle * Math.PI / 180 + distance / radius;
        return [x + Math.cos(radians) * radius, y + Math.sin(radians) * radius, radians * 180 / Math.PI + 90];
      }});
      perimeter += length;
    }
    line(radius, 0, 1, 0, width - 2 * radius, 0);
    corner(width - radius, radius, -90);
    line(width, radius, 0, 1, height - 2 * radius, 90);
    corner(width - radius, height - radius, 0);
    line(width - radius, height, -1, 0, width - 2 * radius, 180);
    corner(radius, height - radius, 90);
    line(0, height - radius, 0, -1, height - 2 * radius, 270);
    corner(radius, radius, 180);

    function pointAt(distance) {
      distance %= perimeter;
      var segment = segments.reduce(function (current, next) {
        return next.start <= distance ? next : current;
      });
      var point = segment.point(distance - segment.start);
      return [point[0] + inset, point[1] + inset, point[2]];
    }
    var distances = [];
    corners.forEach(function (start, index) {
      var length = (corners[index + 1] || corners[0] + perimeter) - start;
      var count = Math.max(1, Math.round(length / spacing));
      for (var i = 0; i < count; i += 1) { distances.push(start + length * i / count); }
    });

    fitLights(distances.length);
    distances.forEach(function (distance, index) {
      var point = pointAt(distance);
      placeLight(lights[index].lamp, point);
      placeLight(lights[index].halo, point);
    });
  }

  return {fit:fit};
});

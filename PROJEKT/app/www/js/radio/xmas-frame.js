/* Lampen und Kabel teilen sich den gerundeten Verlauf der vorhandenen Größenmessung. */
MischWerkUI.define('xmasFrame', function (dependencies) {
  'use strict';
  var frame = dependencies.dom.el('radio-xmas-frame');
  var measured = '', cable, wire, halos;

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
    function coords(x, y) { return x.toFixed(2) + ' ' + y.toFixed(2); }
    var distances = [];
    corners.forEach(function (start, index) {
      var length = (corners[index + 1] || corners[0] + perimeter) - start;
      var count = Math.max(1, Math.round(length / spacing));
      for (var i = 0; i < count; i += 1) { distances.push(start + length * i / count); }
    });

    if (!cable) {
      var svg = 'http://www.w3.org/2000/svg';
      cable = document.createElementNS(svg, 'svg');
      cable.setAttribute('class', 'radio-xmas-cable');
      wire = document.createElementNS(svg, 'path');
      cable.appendChild(wire);
      frame.appendChild(cable);
      halos = document.createElement('span');
      halos.className = 'radio-xmas-halos';
      frame.appendChild(halos);
    }
    cable.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var lamps = document.createDocumentFragment();
    var light = document.createDocumentFragment();
    var first = pointAt(distances[0]);
    var path = 'M' + coords(first[0], first[1]);
    distances.forEach(function (distance, index) {
      var point = pointAt(distance);
      var nextDistance = distances[index + 1] || distances[0] + perimeter;
      var end = pointAt(nextDistance);
      var middle = pointAt((distance + nextDistance) / 2);
      var radians = middle[2] * Math.PI / 180;
      var sag = Math.min(4, (nextDistance - distance) * .06);
      // Der Kurvenmittelpunkt folgt dem Rahmenprofil und hängt leicht nach innen durch.
      var x = 2 * (middle[0] - Math.sin(radians) * sag) - (point[0] + end[0]) / 2;
      var y = 2 * (middle[1] + Math.cos(radians) * sag) - (point[1] + end[1]) / 2;
      path += ' Q' + coords(x, y) + ' ' + coords(end[0], end[1]);
      var lamp = document.createElement('span');
      lamp.className = 'radio-xmas-lamp';
      lamp.style.setProperty('--xmas-x', point[0].toFixed(2) + 'px');
      lamp.style.setProperty('--xmas-y', point[1].toFixed(2) + 'px');
      lamp.style.setProperty('--xmas-angle', point[2].toFixed(2) + 'deg');
      var halo = lamp.cloneNode(false);
      halo.className = 'radio-xmas-halo';
      light.appendChild(halo);
      lamps.appendChild(lamp);
    });
    wire.setAttribute('d', path + ' Z');
    halos.textContent = '';
    halos.appendChild(light);
    frame.querySelectorAll('.radio-xmas-lamp').forEach(function (lamp) { frame.removeChild(lamp); });
    frame.appendChild(lamps);
  }

  return {fit:fit};
});

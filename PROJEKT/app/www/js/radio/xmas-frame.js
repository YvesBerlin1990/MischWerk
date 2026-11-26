/* Die Lampen folgen dem gerundeten Rahmen bei jeder vorhandenen Größenmessung. */
MischWerkUI.define('xmasFrame', function (dependencies) {
  'use strict';
  var frame = dependencies.dom.el('radio-xmas-frame');
  var measured = '';

  function fit() {
    var box = frame.getBoundingClientRect();
    var width = box.width, height = box.height;
    if (!width || !height) { return; }
    var style = getComputedStyle(frame);
    var radius = Math.min(parseFloat(style.borderTopLeftRadius), width / 2, height / 2);
    var spacing = parseFloat(style.getPropertyValue('--xmas-lamp-gap'));
    if (!(radius > 0 && spacing > 0)) { return; }
    var stamp = [width, height, radius, spacing].join('/');
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

    var lamps = document.createDocumentFragment();
    corners.forEach(function (start, index) {
      var length = (corners[index + 1] || corners[0] + perimeter) - start;
      var count = Math.max(1, Math.round(length / spacing));
      for (var i = 0; i < count; i += 1) {
        var distance = (start + length * i / count) % perimeter;
        var segment = segments.reduce(function (current, next) {
          return next.start <= distance ? next : current;
        });
        var point = segment.point(distance - segment.start);
        var lamp = document.createElement('span');
        lamp.className = 'radio-xmas-lamp';
        lamp.style.left = point[0].toFixed(2) + 'px';
        lamp.style.top = point[1].toFixed(2) + 'px';
        lamp.style.setProperty('--xmas-angle', point[2].toFixed(2) + 'deg');
        lamps.appendChild(lamp);
      }
    });
    frame.querySelectorAll('.radio-xmas-lamp').forEach(function (lamp) { frame.removeChild(lamp); });
    frame.appendChild(lamps);
  }

  return {fit:fit};
});

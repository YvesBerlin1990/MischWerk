/* Die gemeinsamen An- und Aus-Bilder teilen dieselbe Geometrie und Lichtkurve. */
MischWerkUI.define('xmasFrame', function (dependencies) {
  'use strict';
  var host = dependencies.dom.el('radio-xmas-shared-frame');
  var root = document.documentElement;
  var maps = {}, mounted = '', stamp = '', layers = {};

  function map(name, fit) {
    if (!maps[name] && typeof fetch === 'function') {
      maps[name] = {};
      fetch('img/' + name + '.json').then(function (response) {
        if (!response.ok) { throw new Error('Weihnachtsgrafiken fehlen'); }
        return response.json();
      }).then(function (data) {
        maps[name].data = data;
        fit();
      }).catch(function () { /* Die Bedienoberfläche bleibt auch ohne optionale Grafik verfügbar. */ });
    }
    return maps[name] && maps[name].data;
  }

  function px(value) { return value + 'px'; }

  function layer(key, className) {
    if (!layers[key]) {
      var node = document.createElement('span');
      node.className = className;
      host.appendChild(node);
      layers[key] = node;
    }
    return layers[key];
  }

  function place(key, className, box, image, dimensions, offset, flip) {
    var node = layer(key, className), style = node.style;
    style.left = px(box[0]); style.top = px(box[1]);
    style.width = px(box[2]); style.height = px(box[3]);
    style.backgroundImage = 'url("img/' + image + '.png")';
    style.backgroundSize = px(dimensions[0]) + ' ' + px(dimensions[1]);
    style.backgroundPosition = px(offset[0]) + ' ' + px(offset[1]);
    style.transform = flip ? 'scaleX(-1)' : '';
    return node;
  }

  function light(key, point, index, count, scale, scene) {
    var rx = point.rx + .55, ry = point.ry + .55;
    var sourceX = point.sourceX === undefined ? point.x : point.sourceX;
    var sourceY = point.sourceY === undefined ? point.y : point.sourceY;
    var lamp = place(key, 'radio-xmas-shared-light',
      [(point.x - rx) * scale,(point.y - ry) * scale,2 * rx * scale,2 * ry * scale],
      scene.image, scene.atlas.map(function (size) { return size * scale; }),
      [-(sourceX - rx) * scale,-(sourceY - ry) * scale], point.flip);
    var phase = (8 - index / count * scene.groups + Math.sin(index * 2.39996) * .049) % 1;
    lamp.style.setProperty('--xmas-phase', -scene.period * phase + 'ms');
  }

  function renderWide(points, scale) {
    var scene = {image:'xmas-player-knuddels-an', atlas:[1327,187], period:3800, groups:3};
    points.forEach(function (point,index) { light('light' + index, point, index, points.length, scale, scene); });
  }

  function renderCompact(data, scale, height) {
    var profile = data.compact, width = profile.width, units = height / scale, points = [], tiles = [];
    var head = profile.pieces.head, foot = profile.pieces.foot, short = profile.pieces.short;
    var top = head.rect[3], bottom = units - foot.rect[3], remaining = bottom - top;
    function add(piece, x, y, length, flip, crop) {
      tiles.push({piece:piece, x:x, y:y, length:length, flip:flip, crop:crop || 0});
    }
    add(head,0,0,top,false);
    add(foot,0,bottom,foot.rect[3],false);
    // Bei hohen Hosts wechseln die beiden langen Seitenstücke. Schnittstellen liegen zwischen den Birnen.
    var y = top, index = 0;
    while (remaining > .1) {
      var piece = remaining < 170 ? short : profile.pieces[index % 2 ? 'longB' : 'longA'];
      var length = Math.min(remaining,piece.rect[3]);
      var crop = 0;
      if (length < piece.rect[3]) {
        var starts = [0].concat(piece.lamps.map(function (lamp) { return lamp[1] + lamp[3] + 1; }));
        var candidates = starts.filter(function (start) {
          var limit = start + length;
          return limit <= piece.rect[3] && piece.lamps.every(function (lamp) {
            return Math.abs(limit - lamp[1]) >= lamp[3];
          });
        });
        crop = candidates[0] || 0;
      }
      add(piece,0,y,length,false,crop);
      add(piece,width - piece.rect[2],y,length,true,crop);
      y += length; remaining -= length; index += 1;
    }

    var assets = profile.atlas.map(function (size) { return size * scale; });
    tiles.forEach(function (tile, index) {
      var rect = tile.piece.rect;
      place('art' + index,'radio-xmas-shared-art',
        [tile.x * scale,tile.y * scale,rect[2] * scale,tile.length * scale],
        'xmas-player-kompakt-aus', assets,[-rect[0] * scale,-(rect[1] + tile.crop) * scale],tile.flip);
      tile.piece.lamps.forEach(function (lamp) {
        var localY = lamp[1] - tile.crop;
        if (localY - lamp[3] < 0 || localY + lamp[3] > tile.length) { return; }
        points.push({
          x:tile.x + (tile.flip ? rect[2] - lamp[0] : lamp[0]), y:tile.y + localY,
          sourceX:rect[0] + lamp[0], sourceY:rect[1] + lamp[1],
          rx:lamp[2],ry:lamp[3],flip:tile.flip
        });
      });
    });
    points.sort(function (a,b) {
      return Math.atan2(a.y / units - .5,a.x / width - .5) - Math.atan2(b.y / units - .5,b.x / width - .5);
    });
    var scene = {image:'xmas-player-kompakt-an', atlas:profile.atlas, period:data.light.periodMs, groups:data.light.groups};
    points.forEach(function (point,i) { light('light' + i,point,i,points.length,scale,scene); });
    // Nur tatsächlich geänderte Geometrie ersetzt entfallene Seitenstücke.
    Object.keys(layers).forEach(function (key) {
      if ((key.indexOf('art') === 0 && +key.slice(3) >= tiles.length) ||
          (key.indexOf('light') === 0 && +key.slice(5) >= points.length)) {
        layers[key].remove(); delete layers[key];
      }
    });
  }

  function fit() {
    var wide = root.classList.contains('xmas-shared-wide');
    var compact = root.classList.contains('xmas-shared-compact');
    if (!wide && !compact) { return; }
    var box = host.getBoundingClientRect();
    if (!box.width || !box.height) { return; }
    var profile = wide ? 'wide' : 'compact';
    if (mounted !== profile) {
      mounted = profile; layers = {}; host.textContent = ''; stamp = '';
      delete host.dataset.ready;
    }
    var data = map(wide ? 'xmas-player-knuddels-lichter' : 'xmas-player', fit);
    if (!data) { return; }
    var size = [profile, box.width, box.height].join('/');
    if (stamp === size) { return; }
    if (wide) { renderWide(data, box.width / 1327); }
    else { renderCompact(data, box.width / data.compact.width, box.height); }
    stamp = size;
    host.dataset.ready = profile;
  }

  function fitHost(width, available, inset, room, reference) {
    var sharedScale = Math.min(1, width / 1360, available / 220);
    var compactScale = Math.min((width - 2 * inset) / 700, room / 713);
    var sharedCompact = width <= 700 && room >= 285 && compactScale >= .40;
    var low = !reference && width >= 800 && sharedScale >= .58 &&
      !document.body.classList.contains('has-own-wish');
    root.classList.toggle('xmas-shared-wide', reference || low);
    root.classList.toggle('xmas-shared-low', low);
    root.classList.toggle('xmas-shared-compact', sharedCompact);
    root.style.setProperty('--xmas-compact-scale', compactScale);
    root.style.setProperty('--xmas-compact-width', 700 * compactScale + 'px');
    root.style.setProperty('--xmas-compact-height', room + 'px');
    root.style.setProperty('--xmas-shared-scale', sharedScale);
    root.style.setProperty('--xmas-shared-width', 1327 * sharedScale + 'px');
    root.style.setProperty('--xmas-shared-height', 187 * sharedScale + 'px');
    fit();
  }

  return {fitHost:fitHost};
});

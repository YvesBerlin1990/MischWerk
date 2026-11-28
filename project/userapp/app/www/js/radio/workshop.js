/* Dekoration ausschließlich in freien senkrechten Korridoren; kein eigener Timer. */
MischWerkUI.define('workshop', function () {
  'use strict';
  function fit() {
    var panel = document.getElementById('radio-panel');
    var face = panel && panel.querySelector('.radio-program-face');
    if (!face) { return; }
    if (!window.CSS || !CSS.supports('clip-path', 'path("M 0 0 H 1 V 1 H 0 Z")') ||
      (document.fonts && document.fonts.status === 'loading')) {
      face.style.setProperty('--workshop-opacity', '0'); return;
    }
    var box = face.getBoundingClientRect(), occupied = [], rectangles = [], lanes = [], edge = 6;
    function reserve(rect, padding) {
      if (!rect.width || !rect.height) { return; }
      rectangles.push({left:rect.left-box.left,right:rect.right-box.left,
        top:rect.top-box.top,bottom:rect.bottom-box.top,padding:Math.max(12,padding)});
      occupied.push([Math.max(edge, Math.floor(rect.left - box.left - padding)),
        Math.min(box.width - edge, Math.ceil(rect.right - box.left + padding))]);
    }
    panel.querySelectorAll('button,input,output,img,svg,#on-air-sign,#host-name,.volume-control,.transport').forEach(function (node) {
      if (!node.closest('[hidden]')) { reserve(node.getBoundingClientRect(), node.classList.contains('transport') ? 24 : 10); }
    });
    var walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim() || node.parentElement.closest('[hidden],.sr-only,button,output')) { continue; }
      var range = document.createRange();
      range.selectNodeContents(node);
      Array.from(range.getClientRects()).forEach(function (rect) { reserve(rect, 12); });
      range.detach();
    }
    occupied.sort(function (a, b) { return a[0] - b[0]; });
    var cursor = edge;
    occupied.concat([[box.width - edge, box.width - edge]]).forEach(function (interval) {
      if (interval[0] - cursor >= 32) { lanes.push([cursor, interval[0]]); }
      cursor = Math.max(cursor, interval[1]);
    });
    // Eine 45-Grad-Linie braucht die ganze Leistenhöhe als Breite, plus Glowsaum.
    // Schmale Restkorridore erhalten kein angeschnittenes Ersatzstück.
    var height = face.clientHeight, required = height + 64, chosen = [], positions = [];
    [box.width * 0.18, box.width * 0.78].forEach(function (target) {
      var candidates = lanes.filter(function (lane) { return lane[1] - lane[0] >= required && chosen.indexOf(lane) === -1; });
      function left(lane) { return Math.max(lane[0] + 32, Math.min(lane[1] - height - 32, target - height / 2)); }
      candidates.sort(function (a, b) { return Math.abs(left(a) + height / 2 - target) - Math.abs(left(b) + height / 2 - target); });
      if (candidates.length) { chosen.push(candidates[0]); positions.push(Math.round(left(candidates[0]))); }
    });
    // Wenn kein senkrechter Korridor passt, den wirklichen 45-Grad-Verlauf prüfen.
    // x(y) = Start + Höhe - y: ein Rechteck sperrt nur die dazugehörigen Starts.
    if (!positions.length && box.width >= 1200) {
      var start=edge+16,end=Math.floor(box.width-height-edge-16),free=[];
      var blocked=rectangles.filter(function(rect){return rect.bottom>=0&&rect.top<=height;}).map(function(rect){
        return [Math.floor(rect.left+rect.top-height-2*rect.padding),
          Math.ceil(rect.right+rect.bottom-height+2*rect.padding)];
      }).sort(function(a,b){return a[0]-b[0];});
      blocked.concat([[end,end]]).forEach(function(interval){
        if(interval[0]>start+2)free.push([start,Math.min(end,interval[0])]);
        start=Math.max(start,interval[1]);
      });
      [box.width*.18,box.width*.78].forEach(function(target){
        free=free.filter(function(lane){return lane[1]-lane[0]>2;});
        free.sort(function(a,b){return Math.abs((a[0]+a[1]+height)/2-target)-Math.abs((b[0]+b[1]+height)/2-target);});
        if(!free.length)return;
        var lane=free.shift(),position=Math.round(Math.max(lane[0]+1,Math.min(lane[1]-1,target-height/2)));
        // Der Clip enthält Linie und Reflex; die Rechteckprüfung schützt deren Verlauf.
        chosen.push([position-16,position+height+16]);positions.push(position);
      });
    }
    var value = chosen.length ? 'path("' + chosen.map(function (lane) {
      return 'M ' + lane[0] + ' 0 H ' + lane[1] + ' V ' + height + ' H ' + lane[0] + ' Z';
    }).join(' ') + '")' : 'inset(50%)';
    if (face.style.getPropertyValue('--workshop-space') !== value) { face.style.setProperty('--workshop-space', value); }
    face.style.setProperty('--workshop-height', height + 'px');
    face.style.setProperty('--workshop-first', (positions.length ? positions[0] : -9999) + 'px');
    face.style.setProperty('--workshop-second', (positions.length > 1 ? positions[1] : -9999) + 'px');
    face.style.setProperty('--workshop-opacity', chosen.length ? '1' : '0');
  }
  return { fit:fit };
});

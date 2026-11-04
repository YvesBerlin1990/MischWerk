/* Erfolgreiche Versandquittung kurz zeigen; Fehler und laufenden Versand erhalten. */
MischWerkUI.define('wishFeedback', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge, dom = dependencies.dom;
  var timer, key = null;
  function start() {
    // Das Wunschfenster übernimmt ausschließlich die Darstellung aus der Radioleiste.
    if (bridge && bridge.pageData && bridge.pageData.wishSurface) { return; }
    var box = dom.el('wish-feedback');
    function changed() {
      var next = !box.hidden && box.classList.contains('success') ? box.textContent : null;
      if (next === key) { return; }
      key = next; clearTimeout(timer);
      if (next === null) { return; }
      timer = setTimeout(function () {
        if (key === next && box.classList.contains('success')) { box.hidden = true; }
      }, 5000);
    }
    var observer = new MutationObserver(changed);
    observer.observe(box, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','hidden'] });
    changed();
    window.addEventListener('pagehide', function () { clearTimeout(timer); observer.disconnect(); });
  }
  return { start:start };
});

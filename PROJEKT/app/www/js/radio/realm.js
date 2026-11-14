/* Ein lokaler about:blank-Realm; kein Audioweg, Timer oder fremdes Host-DOM. */
MischWerkUI.define('playbackRealm', function () {
  'use strict';
  var frame = null, np = null, attempted = false;
  function getPlay() {
    if (!attempted) {
      attempted = true;
      try {
        frame = document.createElement('iframe');
        frame.hidden = true; frame.style.display = 'none'; frame.tabIndex = -1;
        frame.setAttribute('aria-hidden', 'true'); frame.src = 'about:blank';
        document.body.appendChild(frame);
        np = frame.contentWindow.HTMLMediaElement.prototype.play;
        if (typeof np !== 'function') { np = null; }
      } catch (ignoredRealm) { np = null; }
    }
    if (!np) { throw new Error('Lokaler Realm nicht verfügbar.'); }
    return np;
  }
  return {getPlay:getPlay,
    dispose:function () {
      try { if (frame && frame.parentNode) { frame.parentNode.removeChild(frame); } } catch (ignoredRemoval) { /* Aufräumen darf Audio nicht beeinflussen. */ }
      frame = null; np = null; attempted = false;
    }};
});

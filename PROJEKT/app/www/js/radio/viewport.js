/* Ausschließlich Radio-Geometrie: die Wunschoberfläche besitzt einen eigenen nativen Overlayrahmen. */
MischWerkUI.define('viewport', function (dependencies) {
  'use strict';
  var bridge = dependencies.bridge;
  var model = dependencies.model;
  var dom = dependencies.dom;
  var signals = dependencies.signals;
  var workshop = dependencies.workshop;
  var xmasFrame = dependencies.xmasFrame;
  var root = document.documentElement;
  var requestedHeight = 0, scheduled = false;
  if (bridge && bridge.isK3Client()) {
    var initialTicker = bridge.pageData && bridge.pageData.ticker;
    requestedHeight = initialTicker && initialTicker.enabled && initialTicker.text ? 220 : 176;
  }
  function fitLabels() {
    var wide=window.innerWidth>=1200,compact=window.innerWidth<=700;
    var tight=wide&&window.innerWidth<1800&&!dom.el('radio-panel').classList.contains('has-moderation');
    var minimum=wide?20:compact?14:16,maximum=tight?20:wide?24:compact?16:18;
    var size=Math.max(minimum,Math.min(maximum,Math.round(dom.el('radio-panel').getBoundingClientRect().height*.08)));
    if(root.style.getPropertyValue('--radio-label-size')===size+'px')return false;
    root.style.setProperty('--radio-label-size',size+'px');return true;
  }
  function fitControls() {
    if(window.innerWidth<=700){
      ['--radio-play-size','--radio-play-symbol-size','--radio-wish-size'].forEach(function(name){root.style.removeProperty(name);});
      return false;
    }
    var wide=window.innerWidth>=1200,metadata=dom.el('radio-metadata');
    var height=metadata.getBoundingClientRect().height-(parseFloat(getComputedStyle(metadata).paddingBottom)||0);
    var size=Math.max(wide?96:80,Math.min(wide?120:96,Math.round(height*.65)));
    var values={'--radio-play-size':size+'px','--radio-play-symbol-size':Math.round(size*.4)+'px',
      '--radio-wish-size':Math.max(16,Math.min(wide&&window.innerWidth<1800&&!dom.el('radio-panel').classList.contains('has-moderation')?16:18,Math.round(dom.el('radio-panel').getBoundingClientRect().height*.065)))+'px'};
    var changed=false;
    Object.keys(values).forEach(function(name){if(root.style.getPropertyValue(name)!==values[name]){root.style.setProperty(name,values[name]);changed=true;}});
    return changed;
  }
  function fitProportions() {
    if (window.innerWidth <= 700) {
      fitControls();
      root.style.removeProperty('--radio-logo-size');
      root.style.removeProperty('--radio-brand-width');
      for(var compactPass=0;compactPass<3;compactPass+=1){if(!fitLabels())break;}
      return;
    }
    var wide=window.innerWidth>=1200,tight=wide&&window.innerWidth<1600&&!dom.el('radio-panel').classList.contains('has-moderation'),minimum=tight?144:wide?160:96;
    var maximum=tight?160:wide?Math.min(220,160+Math.max(0,window.innerWidth-1200)/2):128;
    // Das absolut positionierte Bild bestimmt seine eigene Messhöhe nicht mit.
    // Größere Randspalten bleiben symmetrisch; Textumbruch höchstens viermal abgleichen.
    for(var pass=0;pass<4;pass+=1){
      var labelChanged=fitLabels();
      var controlsChanged=fitControls();
      var metadata=dom.el('radio-metadata');
      var available=metadata.getBoundingClientRect().height-(parseFloat(getComputedStyle(metadata).paddingBottom)||0)+(wide?16:-16);
      var size=Math.floor(Math.max(minimum,Math.min(maximum,available)));
      if(wide)root.style.setProperty('--radio-brand-width',(size-32)+'px');
      if(root.style.getPropertyValue('--radio-logo-size')===size+'px'){
        if(!labelChanged&&!controlsChanged)break;
        continue;
      }
      root.style.setProperty('--radio-logo-size',size+'px');
    }
  }
  function centerInformation() {
    root.style.removeProperty('--radio-music-shift');
    root.style.removeProperty('--radio-context-shift');
    if(window.innerWidth<1200)return;
    var metadata=dom.el('radio-metadata'),context=metadata.querySelector('.radio-context');
    var area=metadata.getBoundingClientRect(),music=metadata.querySelector('.track-eyebrow').getBoundingClientRect();
    var topic=context.querySelector('.topic-label').getBoundingClientRect();
    var volume=metadata.querySelector('.volume-control').getBoundingClientRect();
    // Die Musiküberschrift ist die Bezugslinie. Lange Themen müssen samt Regler passen.
    var musicCenter=music.top+music.height/2,topicCenter=topic.top+topic.height/2;
    var wishBelow=window.innerWidth<1800&&document.body.classList.contains('has-own-wish')&&!dom.el('radio-panel').classList.contains('has-moderation');
    var top=wishBelow?topicCenter:Math.max(area.top+8+Math.max(music.height,topic.height)/2,
      Math.min(musicCenter,area.bottom-(volume.bottom-topicCenter)-8));
    var shift=top-musicCenter;
    root.style.setProperty('--radio-music-shift',shift+'px');
    if(!wishBelow)root.style.setProperty('--radio-context-shift',(top-topicCenter)+'px');
  }
  function requestHeight(height) {
    root.style.setProperty('--radio-height', height + 'px');
    if (!bridge || height === requestedHeight) { return; }
    requestedHeight = height;
    try { bridge.getHostFrame().setSize(0, height); }
    catch (ignored) { /* Die angezeigte Leiste nutzt die tatsächlich gewährte Höhe. */ }
  }
  function fitXmas() {
    var width = window.innerWidth;
    var ticker = dom.el('radio-ticker');
    var footer = ticker && !ticker.hidden ? 44 : 0;
    // Die freigegebene Fläche misst 1645 × 292. Kleine Hosthöhen dürfen das Raster gemeinsam verkleinern.
    var wide = width >= 1200;
    var preferred = Math.min(500, (wide ? Math.ceil(width * 292 / 1645) : width > 700 ? 262 : 432) + footer);
    var granted = Math.min(preferred, window.innerHeight);
    var available = Math.max(0, granted - footer);
    var reference = wide && available >= 198;
    var unit = reference ? Math.min(width / 1645, available / 292) : width > 700 ? .78 : .59;
    var inset = reference ? 22 * unit : wide ? 16 : width > 700 ? 13 : 10;
    var horizontal = reference ? (width - 1645 * unit) / 2 + inset : inset;
    var room = Math.max(0, available - 2 * inset);
    var sizes = { height:granted, room:room, unit:unit, 'pad-x':horizontal, 'pad-y':inset,
      footer:footer, 'wide-lamp-gap':96 * unit };
    Object.keys(sizes).forEach(function (name) {
      root.style.setProperty('--xmas-' + name, sizes[name] + 'px');
    });
    root.classList.remove('radio-constrained');
    root.classList.toggle('xmas-reference', reference);
    root.classList.toggle('xmas-compact', width <= 700 && room < 355);
    root.classList.toggle('xmas-short', room < (width <= 700 ? 170 : 157));
    var title = dom.el('track-title');
    title.classList.toggle('xmas-long-title', title.textContent.length > 28);
    requestHeight(preferred);
    if (xmasFrame) { xmasFrame.fit(); }
    if (workshop) { workshop.fit(); }
  }
  function resize(initial) {
    if ((!root.classList.contains('mw-ready') && initial !== true) || model.view !== 'radio' || (document.readyState === 'loading' && initial !== true) ||
        !Array.from(document.querySelectorAll('link[rel=stylesheet]')).every(function (link) { return !!link.sheet; })) { return; }
    var small = window.innerWidth <= 1350;
    var focused = document.activeElement;
    if (root.classList.contains('theme-xmas')) { fitXmas(); return; }
    root.classList.remove('xmas-compact', 'xmas-short', 'xmas-reference');
    var constrained = small && window.innerHeight < 360;
    root.classList.toggle('radio-constrained', constrained);
    if (bridge && !bridge.isK3Client()) { root.classList.remove('radio-constrained'); }
    fitProportions();
    centerInformation();
    var ticker = dom.el('radio-ticker');
    var tickerHeight = ticker && !ticker.hidden ? Math.ceil(ticker.getBoundingClientRect().height) : 0;
    // Der obere Anschluss nutzt den unteren Appleistenrand; dessen Glowraum liegt unter der Laufzeile.
    var deck = dom.el('radio-deck');
    var deckStyle = getComputedStyle(deck);
    var topSpace = parseFloat(deckStyle.marginTop) || 0;
    var glowSpace = parseFloat(deckStyle.getPropertyValue('--radio-glow-space')) || 0;
    var contentHeight = topSpace + Math.max(160, Math.ceil(dom.el('radio-panel').getBoundingClientRect().height)) + tickerHeight + glowSpace;
    var height = Math.min(500, contentHeight);
    if (bridge && !bridge.isK3Client()) { constrained = small && window.innerHeight + 1 < contentHeight; }
    requestHeight(height);
    root.classList.toggle('radio-constrained', constrained);
    if (workshop) { workshop.fit(); }
    if (focused && focused !== document.body && !focused.getClientRects().length) {
      var target = dom.el('open-wishes').disabled ? dom.el('mute-button') : dom.el('open-wishes');
      target.focus({ preventScroll:true });
      if (target.id === 'mute-button') { target.scrollIntoView({ block:'nearest', inline:'nearest' }); }
    }
  }
  function request() {
    if (scheduled || model.view !== 'radio') { return; }
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; resize(); });
  }
  function start() {
    if (model.view !== 'radio') { return; }
    signals.on('snapshot', request);
    signals.on('radio-layout', request);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(request); }
    if (document.fonts && document.fonts.addEventListener) { document.fonts.addEventListener('loadingdone', request); }
    resize();
  }
  return { start:start, resize:resize };
});

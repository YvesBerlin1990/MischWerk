/* Volltexte innerhalb der Radioansicht lesen, bei Bedarf auf mehreren sichtbaren Seiten. */
MischWerkUI.define('xmasReader', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, signals = dependencies.signals;
  var dialog = dom.el('xmas-reader'), text = dom.el('xmas-reader-text');
  var title = dom.el('xmas-reader-title'), pageLabel = dom.el('xmas-reader-page');
  var previous = dom.el('xmas-reader-prev'), next = dom.el('xmas-reader-next');
  var closeButton = dom.el('xmas-reader-close');
  var active, parts = [], pages = [], index = 0;
  var fields = {
    music:{ title:'Aktuelle Musik', ids:['track-title','track-artist'] },
    topic:{ title:'Sendung', ids:['show-topic','on-air-sign','host-name'] },
    wish:{ title:'Dein Musikwunsch', ids:['own-wish-label','own-wish-rank','own-wish-title','own-wish-stage'] }
  };

  function render() {
    text.textContent = pages[index] || '';
    pageLabel.textContent = (index + 1) + ' / ' + pages.length;
    previous.disabled = index === 0;
    next.disabled = index >= pages.length - 1;
  }

  function paginate() {
    if (!dialog.hasAttribute('open')) { return; }
    var offset = pages.slice(0, index).join('').length;
    pages = [];
    for (var start = 0; start < parts.length;) {
      var low = start + 1, high = parts.length, end = low;
      while (low <= high) {
        var middle = Math.floor((low + high) / 2);
        text.textContent = parts.slice(start, middle).join('');
        if (text.scrollHeight <= text.clientHeight) { end = middle; low = middle + 1; }
        else { high = middle - 1; }
      }
      // Möglichst an einem Wortende teilen und alle Zeichen erhalten.
      if (end < parts.length) {
        for (var candidate = end; candidate > Math.max(start + 1, end - 16); candidate -= 1) {
          if (/\s/.test(parts[candidate - 1])) { end = candidate; break; }
        }
      }
      pages.push(parts.slice(start,end).join(''));
      start = end;
    }
    index = 0;
    while (index < pages.length - 1 && offset >= pages[index].length) {
      offset -= pages[index].length; index += 1;
    }
    render();
  }

  function restoreFocus() {
    if (active && !active.hidden && active.getClientRects().length) { active.focus({preventScroll:true}); }
    active = null;
  }
  function close() {
    if (typeof dialog.close === 'function') { dialog.close(); }
    else { dialog.removeAttribute('open'); restoreFocus(); }
  }
  function open(button) {
    var group = fields[button.dataset.read];
    var full = group.ids.map(function (id) {
      var field = dom.el(id);
      return field.hidden || field.closest('[hidden]') ? '' : field.textContent;
    }).filter(Boolean).join('\n');
    if (!full) { return; }
    active = button; parts = Array.from(full); index = 0; pages = [];
    title.textContent = group.title;
    if (typeof dialog.showModal === 'function') { dialog.showModal(); }
    else { dialog.setAttribute('open',''); closeButton.focus({preventScroll:true}); }
    paginate();
  }
  function start() {
    var triggers = Array.from(document.querySelectorAll('.xmas-read-trigger'));
    triggers.forEach(function (trigger) { trigger.addEventListener('click', function () { open(trigger); }); });
    signals.on('snapshot', function () {
      var enabled = document.documentElement.classList.contains('theme-xmas');
      if (!enabled && dialog.hasAttribute('open')) { close(); }
      triggers.forEach(function (trigger) { trigger.hidden = !enabled; });
    });
    previous.addEventListener('click', function () { index -= 1; render(); });
    next.addEventListener('click', function () { index += 1; render(); });
    closeButton.addEventListener('click', close);
    dialog.addEventListener('close', restoreFocus);
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && typeof dialog.close !== 'function') { close(); }
    });
    window.addEventListener('resize', paginate);
  }
  return {start:start};
});

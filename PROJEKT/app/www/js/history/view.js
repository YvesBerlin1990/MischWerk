/* Historienoberfläche und vollständige Titelseiten nach verfügbarem Overlayplatz. */
MischWerkUI.define('historyView', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, pages = [], layoutKey = '', previousRows = '';
  dom.mount('history-placeholder', `
    <section id="history-panel" role="tabpanel" aria-labelledby="studio-history-tab" hidden>
      <div class="list-heading"><h2 id="history-heading">Heute gespielt</h2><button id="history-refresh" class="secondary-button" type="button">Aktualisieren</button></div>
      <p id="history-feedback" class="history-feedback" role="status" aria-live="polite"></p>
      <p id="history-empty" class="empty-copy">Für heute liegen noch keine Titelmeldungen vor.</p>
      <ol id="history-list" class="history-list" aria-label="Heutige Titelmeldungen, neueste zuerst"></ol>
      <nav id="history-pagination" class="pagination" aria-label="Seiten der Titelhistorie" hidden>
        <button id="history-previous" class="secondary-button" type="button">Zurück</button><span id="history-page" role="status"></span><button id="history-next" class="secondary-button" type="button">Weiter</button>
      </nav>
      <p class="fine-print">Senderzeit in deutscher Ortszeit. Ton und Titel können zeitversetzt sein.</p>
    </section>
  `);
  function item(row, time) {
    var node = document.createElement('li'), stamp = document.createElement('time'), title = document.createElement('span');
    stamp.dateTime = new Date(row.timestamp * 1000).toISOString(); stamp.textContent = time(row.timestamp);
    if (row.offset) { stamp.title = 'Fortsetzung desselben Titels'; }
    title.textContent = row.text; node.append(stamp, title); return node;
  }
  function paginate(rows, time, available) {
    var list = dom.el('history-list'), result = [], current = [];
    function next() { if (current.length) { result.push(current); } current = []; list.replaceChildren(); }
    rows.forEach(function (row, index) {
      var letters = Array.from(row.text), offset = 0;
      while (offset < letters.length) {
        if (current.length === 6) { next(); }
        var part = {timestamp:row.timestamp, text:letters.slice(offset).join(''), offset:offset, index:index};
        var node = item(part, time); list.appendChild(node);
        if (list.getBoundingClientRect().height <= available) { current.push(part); offset = letters.length; continue; }
        node.remove();
        if (current.length) { next(); continue; }
        list.appendChild(node);
        var low = 1, high = letters.length - offset;
        while (low < high) {
          var middle = Math.ceil((low + high) / 2); node.lastChild.textContent = letters.slice(offset, offset + middle).join('');
          if (list.getBoundingClientRect().height <= available) { low = middle; } else { high = middle - 1; }
        }
        part.text = letters.slice(offset, offset + low).join(''); current.push(part); offset += low; next();
      }
    });
    next(); return result.length ? result : [[]];
  }
  function render(rows, selected, time) {
    if (!dom.el('history-panel').getClientRects().length) { return selected; }
    var list = dom.el('history-list'), pagination = dom.el('history-pagination');
    var anchor = pages[selected] && pages[selected][0];
    list.replaceChildren(); dom.el('history-empty').hidden = rows.length > 0; pagination.hidden = false;
    var shell = document.querySelector('.dialog-shell');
    var available = Math.max(1, Math.floor(innerHeight - shell.getBoundingClientRect().bottom + list.getBoundingClientRect().height - 2));
    var serialized = JSON.stringify(rows);
    var key = [innerWidth, innerHeight, list.getBoundingClientRect().width, available, serialized].join('|');
    if (key !== layoutKey) {
      pages = paginate(rows, time, available); layoutKey = key;
      if (anchor && previousRows === serialized) {
        var found = pages.findIndex(function (page) { return page.some(function (part) {
          return part.index === anchor.index && part.offset <= anchor.offset && part.offset + Array.from(part.text).length > anchor.offset;
        }); });
        if (found !== -1) { selected = found; }
      }
      previousRows = serialized;
    }
    selected = Math.max(0, Math.min(selected, pages.length - 1)); list.replaceChildren();
    pages[selected].forEach(function (row) { list.appendChild(item(row, time)); });
    pagination.hidden = pages.length === 1;
    dom.setText('history-page', 'Seite ' + (selected + 1) + ' / ' + pages.length);
    dom.el('history-previous').disabled = selected === 0; dom.el('history-next').disabled = selected === pages.length - 1;
    return selected;
  }
  function clear() {
    pages = []; layoutKey = ''; previousRows = '';
    dom.el('history-list').replaceChildren(); dom.el('history-pagination').hidden = true;
  }
  return { render:render, clear:clear };
});

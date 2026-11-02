/* Gemeinsame DOM-Helfer und Einsetzen der mitgelieferten statischen Vorlagen. */
MischWerkUI.define('dom', function (dependencies) {
  'use strict';

  function el(id) { return document.getElementById(id); }
  
  function setText(id, value) {
    var node = el(id), text = value === null || value === undefined ? '' : String(value);
    if (node.textContent !== text) { node.textContent = text; }
    if (id === 'track-title' || id === 'track-artist' || id === 'host-name' || id === 'show-topic') {
      if (node.title !== text) { node.title = text; }
    }
  }
  
  function element(tag, className, text) {
    var node = document.createElement(tag); if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; } return node;
  }
  
  function time(timestamp) { return new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  
  function mount(id, markup) {
    // Ausschließlich mitgelieferte, statische Ansichtsvorlagen; Fremdtexte bleiben textContent.
    var parsed = new DOMParser().parseFromString(markup, 'text/html');
    var fragment = document.createDocumentFragment();
    Array.prototype.slice.call(parsed.body.childNodes).forEach(function (node) {
      fragment.appendChild(document.importNode(node, true));
    });
    el(id).replaceWith(fragment);
  }
  return { el: el, setText: setText, element: element, time: time, mount: mount };
});

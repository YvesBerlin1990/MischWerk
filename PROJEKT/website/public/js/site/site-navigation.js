// Öffentliche Teilbereiche; ein laufender Player behält sein Dokument beim Wechsel.
(function () {
  'use strict';
  var routes = {
    radio: '/', schedule: '/sendeplan', team: '/team',
    applications: '/mitmachen', wishes: '/wunschbox'
  };
  var titles = {
    radio: 'Radio MischWerk', schedule: 'Sendeplan', team: 'Das Team',
    applications: 'Mitmachen', wishes: 'Wunschbox'
  };
  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('site-menu-toggle');
  var frame = document.getElementById('radio-frame');
  var current = 'radio', active = false;
  if (!header || !toggle) return;

  function menu(open) {
    header.dataset.menuOpen = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  function listeningLink() {
    var link = document.getElementById('site-listening');
    if (link) link.hidden = !active || current === 'radio';
  }
  function player() {
    if (!frame) return;
    if (current === 'radio') {
      if (!frame.getAttribute('src')) frame.src = frame.dataset.playerSrc;
    } else {
      try {
        var audio = frame.contentDocument && frame.contentDocument.getElementById('radio-audio');
        active = !!(audio && !audio.paused && !audio.ended && audio.currentSrc);
      } catch {}
      if (!active) frame.removeAttribute('src');
    }
    listeningLink();
  }
  function select(name, push, focus) {
    if (!Object.hasOwn(routes, name)) return;
    current = name;
    document.body.dataset.siteCurrent = name;
    document.querySelectorAll('[data-site-page]').forEach(function (section) {
      section.hidden = section.dataset.sitePage !== name;
    });
    document.querySelectorAll('[data-site-link]').forEach(function (link) {
      if (link.dataset.siteLink === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    var selected = document.querySelector('[data-site-page="' + name + '"][id]');
    var skip = document.querySelector('.skip-link');
    if (skip && selected) {
      skip.href = '#' + selected.id;
      skip.textContent = name === 'radio' ? 'Zum Radio' : 'Zum Inhalt';
    }
    if (push && location.pathname !== routes[name]) history.pushState({ page: name }, '', routes[name]);
    document.title = titles[name] + ' · MischWerk';
    menu(false);
    player();
    document.dispatchEvent(new Event('site-view'));
    if (focus) {
      var target = document.querySelector('[data-site-page="' + name + '"] h1,[data-site-page="' + name + '"] h2');
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  document.querySelectorAll('[data-site-link]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      select(link.dataset.siteLink, true, true);
    });
  });
  toggle.addEventListener('click', function () {
    menu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      menu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) menu(false);
  });
  function route() {
    return Object.keys(routes).find(function (key) { return routes[key] === location.pathname; }) || 'radio';
  }
  window.addEventListener('popstate', function () { select(route(), false, true); });
  window.addEventListener('message', function (event) {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow ||
        event.data?.type !== 'website-player-status') return;
    active = event.data.active === true;
    listeningLink();
    if (!active && current !== 'radio') frame.removeAttribute('src');
  });
  select(route(), false, false);
})();

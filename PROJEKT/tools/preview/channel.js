(function () {
  'use strict';
  var parameters = new URLSearchParams(location.search);
  var home = document.body.classList.contains('home-page');
  var publicRadio = home || parameters.get('radio') === 'public';
  var role = !publicRadio && parameters.get('role') === 'moderator' ? 'moderator' : 'listener';
  var radio = document.getElementById('radio-frame'), overlay = document.getElementById('overlay-frame');
  var kinds = { wishes:true, studio:true, team:true, schedule:true };
  document.body.classList.toggle('public-radio', publicRadio);
  if (!home) {
    document.getElementById('mode-label').textContent = publicRadio ? 'Radio MischWerk' : 'Lokaler Test · ' + (role === 'moderator' ? 'Studio und Verwaltung' : 'Höreransicht');
    document.getElementById('mode-title').textContent = publicRadio ? 'Die Mischung macht’s.' : 'Ein Blick hinter die Regler.';
    document.getElementById('mode-description').textContent = publicRadio ?
      'Drücke Play und hör rein. Titel und Interpret siehst du direkt im Player.' :
      'Wunschbox und Sendeplan lassen sich oben öffnen. Im Studio-Test kannst du auch die Moderation und die Verwaltung ausprobieren.';
    document.getElementById('mode-note').textContent = publicRadio ?
      'Der Player startet leise. Du kannst die Lautstärke jederzeit anpassen.' :
      'Dies ist ein Test mit Beispieldaten, ohne Radiostream. Wünsche, Studioanmeldungen und Sendeplaneinträge bleiben hier in der Vorschau. Sie erreichen weder das Radio noch einen echten Sendeplan.';
    document.querySelectorAll('.test-only').forEach(function (link) { link.hidden = publicRadio; });
    radio.src = '/preview?embedded=1&role=' + role + (publicRadio ? '&radio=public' : '');
  }
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || !event.data) { return; }
    var data = event.data;
    if (event.source === radio.contentWindow && data.type === 'preview-radio-size' && Number.isFinite(data.height)) {
      radio.style.height = Math.max(publicRadio ? 210 : 160, Math.min(500, data.height)) + 'px'; return;
    }
    if (overlay && event.source === overlay.contentWindow && data.type === 'preview-wish-size' && Number.isFinite(data.height)) {
      overlay.style.height = Math.max(50, Math.min(1000, data.height)) + 'px';
      if (Number.isFinite(data.width) && data.width > 0) { overlay.style.width = 'min(' + Math.min(1000, data.width) + 'px,100%)'; }
      return;
    }
    if (publicRadio || !overlay || event.source !== radio.contentWindow || data.type !== 'preview-overlay') { return; }
    if (!data.open) { overlay.hidden = true; overlay.removeAttribute('src'); return; }
    if (!Object.prototype.hasOwnProperty.call(kinds, data.kind)) { return; }
    overlay.style.width = 'min(' + (data.kind === 'schedule' ? 820 : data.kind === 'studio' ? 780 : 560) + 'px,100%)';
    overlay.style.height = (data.kind === 'schedule' ? 630 : data.kind === 'studio' ? 730 : data.kind === 'team' ? 630 : 340) + 'px';
    overlay.src = '/preview?view=' + data.kind + '&sourceSession=' + encodeURIComponent(data.sessionId);
    overlay.hidden = false;
  });
}());

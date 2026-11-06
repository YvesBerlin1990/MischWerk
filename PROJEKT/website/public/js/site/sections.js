(function () {
  'use strict';
  if (!document.getElementById('sendeplan')) return;
  var week, generation = 0, pending = null, refreshTimer;
  var applicationAvailable = false, wishAvailable = false, wishChecked = false;
  function node(tag, text, className) {
    var item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item;
  }
  function dayOffset(date, offset) { return new Date(Date.parse(date + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10); }
  function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function monday(date) { return dayOffset(date, -((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7)); }
  function dateLabel(date, weekday) { return new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: '2-digit', month: '2-digit', ...(weekday ? { weekday: 'long' } : { year: 'numeric' }) }).format(new Date(date + 'T12:00:00Z')); }
  function message(id, text, state) { var field = document.getElementById(id); field.textContent = text; field.className = 'section-status' + (state ? ' ' + state : ''); }
  function setWishAvailability(value) {
    var button = document.querySelector('#site-wish-form button[type=submit]');
    button.disabled = !value || button.hasAttribute('aria-busy');
    if (wishChecked && value === wishAvailable) return;
    wishAvailable = value; wishChecked = true;
    message('site-wish-status', value ? 'Die Wunschbox ist offen.' : 'Die Wunschbox ist gerade nicht verfügbar.');
  }
  function showWeek(data) {
    var target = document.getElementById('schedule-weekdays'); target.replaceChildren();
    data.days.forEach(function (date) {
      var card = node('article', undefined, 'schedule-day' + (date === data.today ? ' is-today' : ''));
      var parts = dateLabel(date, true).split(', '), heading = node('h3', parts[0]); heading.appendChild(node('span', parts.slice(1).join(', '))); card.appendChild(heading);
      window.MischWerkSiteCalendar.slots(data.entries,date).forEach(function(slot){
        var entry=slot.entry,row=node('div',undefined,'schedule-entry');
        var open=entry&&entry.timing==='openEnd'&&entry.date===date;
        row.appendChild(node('time',slot.from===0&&slot.to===1440&&!open?'Ganztags':window.MischWerkSiteCalendar.time(slot.from)+' – '+(open?'Open End':window.MischWerkSiteCalendar.time(slot.to))));
        row.appendChild(node('h4',entry&&entry.topic||'MischWerk am Pult'));
        row.appendChild(node('p',entry&&entry.kind!=='autodj'?entry.moderator:'AutoDJ (MischWerk)'));card.appendChild(row);
      });
      target.appendChild(card);
    });
  }
  async function loadSchedule() {
    clearTimeout(refreshTimer); if (document.hidden || !['schedule','wishes'].includes(document.body.dataset.siteCurrent)) return;
    if (pending) pending.abort(); var controller = new AbortController(), selected = ++generation; pending = controller;
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    var selectedWeek = week;
    document.getElementById('schedule-week').textContent = dateLabel(week) + ' – ' + dateLabel(dayOffset(week, 6));
    message('schedule-status', 'Der Sendeplan wird geladen …');
    try {
      var entries = [], data, firstRevision, firstPrevious, firstBoundary;
      for (var page = 0; ; page++) {
        var response = await fetch('/api/site/schedule?week=' + selectedWeek + '&page=' + page, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw Error('schedule'); data = await response.json();
        if (data.week !== selectedWeek || data.page !== page || !Array.isArray(data.entries) || !Array.isArray(data.days) || data.days.length !== 7 || !Number.isInteger(data.pages) || data.pages < 1) throw Error('schedule');
        if (page === 0) { firstRevision = data.revision; firstPrevious = data.previousRevision; firstBoundary=data.boundaryRevision; }
        if (data.revision !== firstRevision || data.previousRevision !== firstPrevious || data.boundaryRevision !== firstBoundary) throw Error('changed');
        entries = entries.concat(data.entries); if (page + 1 >= data.pages) break;
      }
      if (selected !== generation) return;
      showWeek(Object.assign({}, data, { entries: entries }));
      message('schedule-status', data.total ? 'Der aktuelle Plan für diese Woche.' : 'Freie Sendezeiten übernimmt AutoDJ (MischWerk).');
      setWishAvailability(data.requestsEnabled === true);
    } catch (error) {
      if (selected !== generation) return;
      document.getElementById('schedule-weekdays').replaceChildren();
      message('schedule-status', 'Der Sendeplan ist gerade nicht verfügbar. Bitte versuche es später noch einmal.', 'error'); setWishAvailability(false);
    } finally {
      clearTimeout(timer); if (pending === controller) { pending = null; if (!document.hidden) refreshTimer = setTimeout(loadSchedule, 60000); }
    }
  }
  function renderTeam(team) {
    var list = document.getElementById('team-list'); list.replaceChildren();
    team.forEach(function (person) {
      var card = node('article', undefined, 'team-card'), avatar = node('div', person.initials, 'team-avatar'); avatar.setAttribute('aria-hidden', 'true'); card.appendChild(avatar);
      var copy = node('div'); copy.appendChild(node('h3', person.name)); copy.appendChild(node('p', person.role, 'team-role')); copy.appendChild(node('p', person.text, 'team-description')); card.appendChild(copy); list.appendChild(card);
    });
  }
  function bindForm(id, endpoint, statusId, available, label) {
    var form = document.getElementById(id), submissionId = null;
    form.addEventListener('input', function () { submissionId = null; });
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); if (!available() || !form.reportValidity()) return;
      var button = form.querySelector('button[type=submit]'); if (button.disabled) return;
      submissionId = submissionId || crypto.randomUUID();
      var data = Object.fromEntries(new FormData(form)); data.submissionId = submissionId;
      button.disabled = true; button.textContent = 'Wird gesendet …'; button.setAttribute('aria-busy', 'true'); message(statusId, 'Die Übermittlung läuft …');
      try {
        var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
        var result = await response.json(); if (!response.ok || result.ok !== true) throw Error(result.message || 'Die Übermittlung ist gerade nicht möglich.');
        form.reset(); submissionId = null; message(statusId, result.message, 'success');
        if (id === 'site-wish-form') document.getElementById('site-wish-count').textContent = '0 / 300 Zeichen · keine Links';
      } catch (error) { message(statusId, error.name === 'TimeoutError' || error.name === 'TypeError' ? 'Die Verbindung antwortet gerade nicht. Deine Eingaben bleiben erhalten.' : error.message, 'error'); }
      finally { button.disabled = !available(); button.textContent = label; button.removeAttribute('aria-busy'); }
    });
  }
  week = monday(today());
  document.getElementById('schedule-previous').addEventListener('click', function () { week = dayOffset(week, -7); loadSchedule(); });
  document.getElementById('schedule-next').addEventListener('click', function () { week = dayOffset(week, 7); loadSchedule(); });
  document.getElementById('schedule-today').addEventListener('click', function () { week = monday(today()); loadSchedule(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTimeout(refreshTimer); generation++; if (pending) pending.abort(); } else loadSchedule(); });
  document.addEventListener('site-view',function(){if(['schedule','wishes'].includes(document.body.dataset.siteCurrent))loadSchedule();else{clearTimeout(refreshTimer);generation++;if(pending)pending.abort();}});
  window.addEventListener('pagehide', function () { clearTimeout(refreshTimer); generation++; if (pending) pending.abort(); });
  document.querySelector('#site-wish-form textarea').addEventListener('input', function (event) { document.getElementById('site-wish-count').textContent = event.target.value.length + ' / 300 Zeichen · keine Links'; });
  bindForm('application-form', '/api/site/applications', 'application-status', function () { return applicationAvailable; }, 'Bewerbung senden');
  bindForm('site-wish-form', '/api/site/wishes', 'site-wish-status', function () { return wishAvailable; }, 'Musikwunsch senden');
  fetch('/api/site/content', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw Error('content'); return response.json(); }).then(function (data) {
    renderTeam(data.team); applicationAvailable = data.applicationsAvailable === true;
    document.querySelector('#application-form button[type=submit]').disabled = !applicationAvailable;
    message('application-status', applicationAvailable ? 'Wir melden uns per E-Mail bei dir.' : 'Bewerbungen können gerade noch nicht gesendet werden.');
  }).catch(function () { message('application-status', 'Das Formular ist gerade nicht verfügbar.'); });
  loadSchedule();
}());

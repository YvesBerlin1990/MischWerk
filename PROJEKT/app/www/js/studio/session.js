/* Bestätigtes Moderationsende, lokale Bearbeitung und serververankerte Restzeit. */
MischWerkUI.define('studioSession', function (dependencies) {
  'use strict';
  var model=dependencies.model, dom=dependencies.dom, commands=dependencies.commands, signals=dependencies.signals;
  var draft=null, submitted=false, serverAnchor=0, localAnchor=0;
  var formatter=new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Berlin', year:'numeric', month:'2-digit',
    day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
  function clock() { return serverAnchor ? serverAnchor+Math.max(0,Date.now()-localAnchor) : model.current().serverTime||Date.now(); }
  function localTime(stamp) {
    var parts={}; formatter.formatToParts(new Date(stamp)).forEach(function (part) { parts[part.type]=part.value; });
    return parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
  }
  function key() { var item=model.current().moderator; return item ? item.sessionKey||String(item.since) : null; }
  function own() { var state=model.current(); return !!(state&&state.user.canModerate&&state.user.isOnAir&&state.moderator); }
  function openEnd(item) { return item.openEnd===true&&item.expiresAt===null; }
  function description(item) {
    if (openEnd(item)) { return 'Open End · bis zur Abmeldung'; }
    if (typeof item.expiresAt!=='number'||!isFinite(item.expiresAt)) { return 'Endzeit unbestätigt'; }
    var value=localTime(item.expiresAt), minutes=Math.max(0,Math.ceil((item.expiresAt-clock())/60000));
    return 'Angemeldet bis '+value.slice(8,10)+'.'+value.slice(5,7)+'.'+value.slice(0,4)+' um '+value.slice(11)+
      ' Uhr · '+(minutes ? 'Noch '+Math.floor(minutes/60)+' Std. '+minutes%60+' Min.' : 'Endzeit erreicht');
  }
  function feedback(text) { dom.setText('studio-end-feedback',text); dom.el('studio-end-feedback').hidden=!text; }
  function measure() {
    var form=dom.el('studio-end-form');
    if (!draft||!form.getClientRects().length) { return; }
    signals.emit('studio-natural-height', { tab:'programme', height:form.getBoundingClientRect().top+form.scrollHeight+
      form.offsetHeight-form.clientHeight+parseFloat(getComputedStyle(document.querySelector('.dialog-shell')).paddingBottom) });
  }
  function close(focus) {
    draft=null; submitted=false; dom.el('studio-end-form').hidden=true;
    dom.el('studio-end-form').reset(); feedback(''); dom.setText('studio-end-current','');
    document.documentElement.classList.remove('studio-end-open');
    if (focus&&!dom.el('on-air').disabled) { dom.el('on-air').focus({preventScroll:true}); }
    signals.emit('controls'); signals.emit('studio-layout');
  }
  function render() {
    var state=model.current(); if (!state) { return; }
    var item=state.moderator, live=model.connected();
    dom.el('studio-session').hidden=!live||!item;
    dom.setText('studio-session',item ? description(item) : '');
    dom.el('studio-timing').hidden=!live||!item;
    var started=item&&typeof item.since==='number'&&isFinite(item.since);
    dom.setText('studio-started',started ? dom.time(item.since)+' Uhr' : '');
    var elapsed=started ? Math.max(0,Math.floor((clock()-item.since)/60000)) : 0;
    dom.setText('studio-duration',Math.floor(elapsed/60)+' Std. '+elapsed%60+' Min.');
    if (!draft) { return; }
    if (!own()) { close(false); return; }
    var busy=!!commands.pending(), stale=draft.key!==key(), mode=dom.el('studio-end-mode').value;
    dom.el('studio-end-fields').disabled=!live||busy;
    dom.el('studio-end-at-field').hidden=mode==='openEnd';
    dom.el('studio-end-at').disabled=mode==='openEnd'; dom.el('studio-end-at').required=mode==='fixed';
    dom.el('studio-end-at').min=localTime(clock()+60000);
    dom.setText('studio-end-help',mode==='openEnd' ? 'Ohne feste Endzeit. Abmeldung, Channel-Verlassen oder Rechteverlust beenden die Anmeldung.' :
      'Datum und Uhrzeit gelten in deutscher Zeit (Berlin).');
    dom.setText('studio-end-current','Aktuell: '+description(item));
    var changed=mode!==draft.mode||mode==='fixed'&&dom.el('studio-end-at').value!==draft.local;
    dom.el('studio-end-save').disabled=!live||busy||stale||!changed||mode==='fixed'&&!dom.el('studio-end-at').checkValidity();
    dom.el('studio-end-save').setAttribute('aria-busy',String(submitted&&busy));
    dom.el('studio-end-reload').hidden=!stale;
    if (stale&&!busy) { feedback('Die Anmeldung wurde inzwischen geändert. Bitte den aktuellen Stand laden und erneut prüfen.'); }
    if (submitted&&!busy) { submitted=false; feedback('Keine Bestätigung erhalten. Dein Entwurf bleibt erhalten; bitte den aktuellen Stand prüfen.'); }
    measure();
  }
  function open(saved) {
    if (!own()||!model.connected()||commands.pending()) { return; }
    var item=model.current().moderator, mode=openEnd(item)?'openEnd':'fixed';
    var value=localTime(typeof item.expiresAt==='number' ? item.expiresAt : clock()+6*3600000);
    draft=saved&&typeof saved.key==='string' ? {key:saved.key,mode:saved.mode,local:saved.local} : {key:key(),mode:mode,local:value};
    dom.el('studio-end-mode').value=saved&&saved.valueMode==='openEnd' ? 'openEnd' : saved&&saved.valueMode==='fixed' ? 'fixed' : mode;
    dom.el('studio-end-at').value=saved&&typeof saved.valueLocal==='string' ? saved.valueLocal.slice(0,16) : value;
    dom.el('studio-end-form').hidden=false; document.documentElement.classList.add('studio-end-open');
    feedback(''); render(); dom.el('studio-end-mode').focus({preventScroll:true}); signals.emit('studio-fit');
  }
  function start() {
    signals.on('snapshot',function () { serverAnchor=model.current().serverTime; localAnchor=Date.now(); render(); });
    signals.on('controls',render); signals.on('studio-fit',measure); signals.on('initial-layout',measure);
    window.addEventListener('resize',measure);
    signals.on('studio-end-edit',function () { open(); });
    signals.on('overlay-capture',function (state) {
      if (draft&&own()) { state.studioSession={key:draft.key,mode:draft.mode,local:draft.local,
        valueMode:dom.el('studio-end-mode').value,valueLocal:dom.el('studio-end-at').value}; }
    });
    signals.on('overlay-restore',function (state) { if (state.studioSession) { open(state.studioSession); } });
    ['studio-end-mode','studio-end-at'].forEach(function (id) { dom.el(id).addEventListener('input',function () { feedback(''); render(); }); });
    dom.el('studio-end-cancel').addEventListener('click',function () { close(true); });
    dom.el('studio-end-reload').addEventListener('click',function () { open(); });
    dom.el('studio-end-form').addEventListener('submit',function (event) {
      event.preventDefault();
      if (!draft||!own()||draft.key!==key()||dom.el('studio-end-save').disabled||!this.reportValidity()) { return; }
      submitted=true; feedback('Wird gespeichert …');
      commands.send('mw:onAir',{endMode:dom.el('studio-end-mode').value,endLocal:dom.el('studio-end-at').value},true);
      if (!commands.pending()) { submitted=false; }
    });
    signals.on('command-result',function (response) {
      if (!submitted||response.action!=='mw:onAir') { return; }
      submitted=false;
      if (response.ok) { close(true); } else { feedback(response.message||'Endzeit konnte nicht gespeichert werden.'); render(); }
    });
  }
  return {start:start};
});

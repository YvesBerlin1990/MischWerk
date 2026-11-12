/* Radio-Team darstellen und Ernennungs-/Entfernungsaktionen auslösen. */
MischWerkUI.define('team', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var rendered = null;
  var removal = null;
  function closeRemoval() {
    if (!removal || commands.pending()) { return; }
    var button = removal.button;
    removal.box.remove(); removal = null;
    button.setAttribute('aria-expanded', 'false');
    button.removeAttribute('aria-controls');
    if (button.isConnected) { button.focus(); }
  }
  function confirmRemoval(item, row, button) {
    if (button.disabled) { return; }
    if (removal && removal.button === button) { closeRemoval(); return; }
    closeRemoval();
    var box = dom.element('div', 'team-member-confirm');
    box.id = 'team-removal-confirm';
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Mitglied entfernen');
    box.appendChild(dom.element('p', '', item.nick + ' aus dem Radio-Team entfernen?' + (model.current().moderator && model.current().moderator.nick === item.nick && model.current().user.nick !== item.nick ? ' Die laufende Moderation wird beendet.' : '')));
    var actions = dom.element('div', 'button-row');
    var feedback = dom.element('p', 'team-removal-feedback');
    feedback.setAttribute('role', 'status'); feedback.hidden = true;
    var confirm = dom.element('button', 'primary-button', 'Entfernen');
    var cancel = dom.element('button', 'secondary-button', 'Abbrechen');
    confirm.type = cancel.type = 'button';
    confirm.dataset.confirmRemoval = String(item.userId);
    confirm.addEventListener('click', function () {
      if (this.disabled) { return; }
      commands.send('mw:removeRadioModerator', { userId: item.userId }, true);
    });
    cancel.addEventListener('click', closeRemoval);
    box.addEventListener('keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); closeRemoval(); } });
    actions.appendChild(confirm); actions.appendChild(cancel); box.appendChild(actions); box.appendChild(feedback); row.appendChild(box);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-controls', box.id);
    removal = { box: box, button: button }; cancel.focus();
  }
  function renderRadioTeam() {
    var list = dom.el('radio-moderator-list');
    dom.setText('radio-moderator-count', model.current().radioModeratorTotal);
    dom.setText('radio-moderator-page-label', 'Seite ' + (model.current().radioModeratorPage + 1) + ' / ' + model.current().radioModeratorPages);
    dom.el('radio-moderator-pagination').hidden = model.current().radioModeratorPages <= 1;
    var key = JSON.stringify([model.current().user.canManageRadioModerators, model.current().radioModerators]);
    if (key === rendered) { return; }
    rendered = key;
    var focusLostDuringRemoval = removal && document.activeElement === document.body;
    var focusedRow = (focusLostDuringRemoval ? removal.button : document.activeElement).closest('.team-member');
    var focusedId = focusedRow && focusedRow.dataset.memberId;
    var hadFocus = list.contains(document.activeElement) || focusLostDuringRemoval;
    removal = null;
    list.textContent = '';
    if (!model.current().user.canManageRadioModerators) { return; }
    if (!model.current().radioModerators.length) {
      list.appendChild(dom.element('p', 'empty-copy', 'Dein Radio-Team ist noch leer.'));
      if (hadFocus) { dom.el('team-list-heading').focus(); }
      return;
    }
    model.current().radioModerators.forEach(function (item) {
      var row = dom.element('div', 'team-member');
      row.dataset.memberId = String(item.userId);
      var copy = dom.element('div', 'team-member-copy');
      copy.appendChild(dom.element('strong', '', item.nick));
      row.appendChild(copy);
      var button = dom.element('button', 'secondary-button', 'Entfernen');
      button.type = 'button';
      button.dataset.radioModeratorId = String(item.userId);
      button.title = 'Aus dem Radio-Team entfernen';
      button.setAttribute('aria-label', item.nick + ' entfernen');
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', function () {
        confirmRemoval(item, row, button);
      });
      row.appendChild(button);
      list.appendChild(row);
    });
    if (hadFocus) {
      var replacement = Array.prototype.find.call(list.querySelectorAll('[data-radio-moderator-id]'), function (button) {
        return button.dataset.radioModeratorId === focusedId;
      });
      (replacement || dom.el('team-list-heading')).focus();
    }
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    dom.el('radio-moderator-nick').disabled = !!commands.pending() || !live || !model.current().user.canManageRadioModerators;
    dom.el('add-radio-moderator').disabled = dom.el('radio-moderator-nick').disabled || !dom.el('radio-moderator-nick').value.trim();
    dom.el('refresh-radio-team').disabled = !model.current().user.canManageRadioModerators;
    dom.el('prev-radio-moderator-page').disabled = !live || !!commands.pending() || !model.current().user.canManageRadioModerators || model.current().radioModeratorPage <= 0;
    dom.el('next-radio-moderator-page').disabled = !live || !!commands.pending() || !model.current().user.canManageRadioModerators || model.current().radioModeratorPage >= model.current().radioModeratorPages - 1;
    document.querySelectorAll('[data-radio-moderator-id]').forEach(function (button) {
      button.disabled = !!commands.pending() || !live || !model.current().user.canManageRadioModerators;
    });
    if (removal) {
      removal.box.querySelectorAll('button').forEach(function (button) {
        button.disabled = !!commands.pending() || !live || !model.current().user.canManageRadioModerators;
      });
    }
  
  }
  function start() {
    signals.on('overlay-capture', function (state) {
      if (model.view !== 'team') { return; }
      state.team = { nick:dom.el('radio-moderator-nick').value, page:model.current() && model.current().radioModeratorPage || 0,
        removing:removal && removal.button.dataset.radioModeratorId };
    });
    signals.on('overlay-restore', function (state) {
      if (model.view !== 'team') { return; }
      if (!state.team || !model.current().user.canManageRadioModerators) { return; }
      if (typeof state.team.nick === 'string' && state.team.nick.length <= 100) { dom.el('radio-moderator-nick').value = state.team.nick; }
      if (Number.isInteger(state.team.page) && state.team.page > 0 && state.team.page !== model.current().radioModeratorPage) { commands.send('mw:refresh', { radioModeratorPage:state.team.page }); }
      var target = Array.from(document.querySelectorAll('[data-radio-moderator-id]')).find(function (button) { return button.dataset.radioModeratorId === state.team.removing; });
      if (target) { target.click(); }
      availability();
    });
    dom.el('radio-moderator-nick').addEventListener('input', availability);
    dom.el('radio-moderator-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (dom.el('add-radio-moderator').disabled || !this.reportValidity()) { return; }
      commands.send('mw:addRadioModerator', { nick: dom.el('radio-moderator-nick').value }, true);
    });
    commands.bindRefresh('refresh-radio-team', 'team-refresh-feedback');
    dom.el('prev-radio-moderator-page').addEventListener('click', function () { commands.send('mw:refresh', { radioModeratorPage: model.current().radioModeratorPage - 1 }); });
    dom.el('next-radio-moderator-page').addEventListener('click', function () { commands.send('mw:refresh', { radioModeratorPage: model.current().radioModeratorPage + 1 }); });
  
    signals.on('command-result', function (response) {
      if (response.ok && response.action === 'mw:addRadioModerator') { dom.el('radio-moderator-form').reset(); }
      if (!response.ok && response.action === 'mw:removeRadioModerator' && removal) {
        var feedback = removal.box.querySelector('.team-removal-feedback');
        feedback.textContent = response.message || 'Studiozugriff konnte nicht entzogen werden.'; feedback.hidden = false;
        availability();
        if (document.activeElement === document.body) { removal.box.querySelector('[data-confirm-removal]').focus(); }
      }
    });
  }
  return { start: start, render: renderRadioTeam, availability: availability };
});

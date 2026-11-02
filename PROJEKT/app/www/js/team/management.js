/* Radio-Team darstellen und Ernennungs-/Entfernungsaktionen auslösen. */
MischWerkUI.define('team', function (dependencies) {
  'use strict';
  var model = dependencies.model;
  var dom = dependencies.dom;
  var commands = dependencies.commands;
  var signals = dependencies.signals;
  var rendered = null;
  function renderRadioTeam() {
    var list = dom.el('radio-moderator-list');
    dom.setText('radio-moderator-count', model.current().radioModeratorTotal);
    dom.setText('radio-moderator-page-label', 'Seite ' + (model.current().radioModeratorPage + 1) + ' / ' + model.current().radioModeratorPages);
    dom.el('radio-moderator-pagination').hidden = model.current().radioModeratorPages <= 1;
    var key = JSON.stringify([model.current().user.canManageRadioModerators, model.current().radioModerators]);
    if (key === rendered) { return; }
    rendered = key;
    var hadFocus = list.contains(document.activeElement);
    list.textContent = '';
    if (hadFocus && model.current().user.canManageRadioModerators) { dom.el('radio-moderator-nick').focus(); }
    if (!model.current().user.canManageRadioModerators) { return; }
    if (!model.current().radioModerators.length) {
      list.appendChild(dom.element('p', 'empty-copy', 'Noch keine Radiomoderatoren ernannt.'));
      return;
    }
    model.current().radioModerators.forEach(function (item) {
      var row = dom.element('div', 'team-member');
      row.appendChild(dom.element('strong', '', item.nick));
      var button = dom.element('button', 'secondary-button', 'Entfernen');
      button.type = 'button';
      button.dataset.radioModeratorId = String(item.userId);
      button.title = item.nick + ' den Studiozugriff entziehen';
      button.addEventListener('click', function () {
        commands.send('mw:removeRadioModerator', { userId: item.userId }, true);
      });
      row.appendChild(button);
      list.appendChild(row);
    });
  }
  
  function availability() {
    if (!model.current()) { return; }
    var live = model.connected();
    dom.el('radio-moderator-nick').disabled = !!commands.pending() || !live || !model.current().user.canManageRadioModerators;
    dom.el('add-radio-moderator').disabled = dom.el('radio-moderator-nick').disabled;
    dom.el('refresh-radio-team').disabled = !!commands.pending() || !model.current().user.canManageRadioModerators;
    dom.el('prev-radio-moderator-page').disabled = !live || !!commands.pending() || !model.current().user.canManageRadioModerators || model.current().radioModeratorPage <= 0;
    dom.el('next-radio-moderator-page').disabled = !live || !!commands.pending() || !model.current().user.canManageRadioModerators || model.current().radioModeratorPage >= model.current().radioModeratorPages - 1;
    document.querySelectorAll('[data-radio-moderator-id]').forEach(function (button) {
      button.disabled = !!commands.pending() || !live || !model.current().user.canManageRadioModerators;
    });
  
  }
  function start() {
    dom.el('radio-moderator-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (dom.el('add-radio-moderator').disabled || !this.reportValidity()) { return; }
      commands.send('mw:addRadioModerator', { nick: dom.el('radio-moderator-nick').value }, true);
    });
    dom.el('refresh-radio-team').addEventListener('click', function () { commands.send('mw:refresh', {}); });
    dom.el('prev-radio-moderator-page').addEventListener('click', function () { commands.send('mw:refresh', { radioModeratorPage: model.current().radioModeratorPage - 1 }); });
    dom.el('next-radio-moderator-page').addEventListener('click', function () { commands.send('mw:refresh', { radioModeratorPage: model.current().radioModeratorPage + 1 }); });
  
    signals.on('command-result', function (response) {
      if (response.ok && response.action === 'mw:addRadioModerator') { dom.el('radio-moderator-form').reset(); }
    });
  }
  return { start: start, render: renderRadioTeam, availability: availability };
});

/* Drei Verwaltungsbereiche; keine Schlüssel im flüchtigen Overlayentwurf. */
MischWerkUI.define('teamNavigation', function (dependencies) {
  'use strict';
  var dom = dependencies.dom, model = dependencies.model, signals = dependencies.signals;
  var names = ['members', 'texts', 'connection'], selected = 'members';
  var tabs = ['team-members-tab', 'team-texts-tab', 'team-connection-tab'];
  var panels = ['team-members', 'channel-texts-panel', 'team-connection-panel'];
  function select(name, focus) {
    selected = names.indexOf(name) === -1 ? 'members' : name;
    names.forEach(function (item, index) {
      var active = selected === item, button = dom.el(tabs[index]);
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      dom.el(panels[index]).hidden = !active;
    });
    signals.emit('channel-texts-panel', selected === 'texts');
    signals.emit('team-panel', selected);
    if (focus) { dom.el(tabs[names.indexOf(selected)]).focus(); }
  }
  function start() {
    tabs.forEach(function (id, index) {
      var button = dom.el(id);
      button.addEventListener('click', function () { select(names[index]); });
      button.addEventListener('keydown', function (event) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) { return; }
        event.preventDefault();
        var next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 :
          (index + (event.key === 'ArrowLeft' ? 2 : 1)) % 3;
        select(names[next], true);
      });
    });
    signals.on('snapshot', function () { if (!model.current().user.canManageRadioModerators) { select('members'); } });
    signals.on('overlay-capture', function (state) {
      state.teamArea = selected;
      if (state.channelTexts) { state.channelTexts.selected = selected; }
    });
    signals.on('overlay-restore', function (state) { select(state.teamArea || state.channelTexts && state.channelTexts.selected); });
  }
  return { start:start };
});

/* Oberfläche nach vollständigem Markup zusammensetzen. */
(function () {
  'use strict';
  if (window.MischWerkUI) { return; }
  var modules = [
    ['dom', 'core/dom.js'],
    ['signals', 'core/signals.js'],
    ['model', 'core/model.js'],
    ['radioMarkup', 'radio/markup.js', 'radio'],
    ['viewport', 'radio/viewport.js', 'radio'],
    ['wishesMarkup', 'wishes/markup.js', 'wishes radio'],
    ['studioMarkup', 'studio/markup.js', 'studio'],
    ['handoverMarkup', 'studio/handover-markup.js', 'studio'],
    ['teamMarkup', 'team/markup.js', 'team'],
    ['channelTextsMarkup', 'team/channel-texts-markup.js', 'team'],
    ['channelTextsLayout', 'team/layout.js', 'team'],
    ['layout', 'ui/layout.js'],
    ['commands', 'transport/commands.js'],
    ['songMetadata', 'radio/metadata.js', 'radio'],
    ['radioRequests', 'radio/requests.js', 'radio'],
    ['radioApi', 'radio/api.js', 'radio'],
    ['presentation', 'radio/presentation.js', 'radio'],
    ['provider', 'radio/provider.js', 'radio'],
    ['volume', 'radio/volume.js', 'radio'],
    ['playbackRealm', 'radio/realm.js', 'radio'],
    ['radioConnection', 'radio/connection.js', 'radio'],
    ['player', 'radio/player.js', 'radio'],
    ['listenerPresence', 'radio/listener.js', 'radio'],
    ['radioTicker', 'radio/ticker.js', 'radio'],
    ['wishes', 'wishes/wishbox.js', 'wishes radio'],
    ['wishFeedback', 'wishes/feedback.js', 'wishes radio'],
    ['wishRelay', 'wishes/relay.js', 'radio'],
    ['wishDrawer', 'wishes/drawer.js', 'wishes'],
    ['wishWindow', 'wishes/window.js', 'wishes'],
    ['studio', 'studio/controls.js', 'studio'],
    ['handover', 'studio/handover.js', 'studio'],
    ['studioWorkspace', 'studio/workspace.js', 'studio'],
    ['studioWindow', 'studio/window.js', 'studio'],
    ['studioReader', 'studio/reader.js', 'studio'],
    ['queue', 'studio/queue.js', 'studio'],
    ['team', 'team/management.js', 'team'],
    ['channelTexts', 'team/channel-texts.js', 'team'],
    ['teamConnection', 'operator/relay-settings.js', 'team'],
    ['teamNavigation', 'team/navigation.js', 'team'],
    ['scheduleMarkup', 'schedule/markup.js', 'schedule'],
    ['scheduleView', 'schedule/view.js', 'schedule'],
    ['scheduleCache', 'schedule/cache.js', 'schedule'],
    ['schedule', 'schedule/controller.js', 'schedule'],
    ['overlays', 'ui/overlays.js'],
    ['updates', 'ui/updates.js'],
    ['lifecycle', 'transport/lifecycle.js']
  ];
  var view = document.documentElement.getAttribute('data-view') || 'radio';
  var loadPlan = modules.filter(function (module) {
    return !module[2] || module[2].split(' ').indexOf(view) !== -1;
  });
  var factories = {};
  var initialized = false, composer = null;
  var markupReady = document.readyState !== 'loading';
  function initialize() {
    if (typeof startupBroken !== 'undefined' && startupBroken) { return; }
    if (initialized || !composer || !markupReady || !loadPlan.every(function (module) { return !!factories[module[0]]; })) { return; }
    initialized = true;
    composer(factories);
  }
  function mount() { markupReady = true; initialize(); }
  if (!markupReady) { document.addEventListener('DOMContentLoaded', mount, { once:true }); }
  window.MischWerkUI = {
    mount: mount,
    setComposer: function (compose) { composer = compose; initialize(); },
    define: function (name, factory) {
      if (factories[name]) { throw new Error('Doppeltes Oberflächenmodul: ' + name); }
      factories[name] = factory;
      initialize();
    }
  };
  if (window.addEventListener) {
    window.addEventListener('error', function (event) {
      if (document.documentElement.classList.contains('mw-ready')) { return; }
      var target = event.target;
      var file = target && /^(SCRIPT|LINK)$/.test(target.tagName) ? target.src || target.href : event.filename;
      var box = document.getElementById('startup-error');
      if (file && box) {
        box.textContent = 'MischWerk konnte eine Startdatei nicht laden oder ausführen: ' +
          file.split('?')[0].split('/').slice(-2).join('/') + '. Bitte den vollständigen App-Upload aktualisieren und erneut öffnen.';
      }
    }, true);
  }
  if (typeof Client !== 'undefined') { Client.includeJS('js/ui/composition.js'); }
  else { var composition = document.createElement('script'); composition.src = 'js/ui/composition.js'; document.head.appendChild(composition); }
  loadPlan.forEach(function (module) {
    var file = 'js/' + module[1];
    if (typeof Client !== 'undefined') { Client.includeJS(file); }
    else {
      var script = document.createElement('script');
      script.src = file;
      document.body.appendChild(script);
    }
  });
}());

/* Lokale Benachrichtigungen zwischen unabhängig verdrahteten Komponenten. */
MischWerkUI.define('signals', function (dependencies) {
  'use strict';

  var listeners = {};
  function on(name, callback) { (listeners[name] || (listeners[name] = [])).push(callback); }
  function emit(name, value) { (listeners[name] || []).slice().forEach(function (callback) { callback(value); }); }
  return { on: on, emit: emit };
});

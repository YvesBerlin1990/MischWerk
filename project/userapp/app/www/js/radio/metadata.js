/* Aktuelle SPCast-Songzeilen für die öffentliche Titel-/Interpretenanzeige lesen. */
MischWerkUI.define('songMetadata', function () {
  'use strict';
  function split(combined) {
    combined = combined.trim();
    var divider = combined.indexOf(' - ');
    var performer = divider > 0 ? combined.slice(0, divider).trim() : '';
    var track = performer ? combined.slice(divider + 3).trim() : '';
    return { title: track || combined, artist: { name: track ? performer : '' }, isLive: null };
  }
  function current(text) {
    if (text.length > 2000 || !text.trim() || text.trim().toLowerCase() === 'unknown' ||
        /[\r\n\x00-\x1f]/.test(text.trim()) || /<(?:!|\/?[a-z])/i.test(text)) { throw new Error('invalid current song'); }
    // Optionale Anbieterzusätze gehören nicht zu Titel oder Interpret.
    var combined = text.split('|')[0].trim();
    if (!combined || combined.toLowerCase() === 'unknown') { throw new Error('current song unavailable'); }
    return split(combined);
  }
  return { current: current };
});

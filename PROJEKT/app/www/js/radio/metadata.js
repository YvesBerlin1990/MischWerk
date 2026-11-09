/* Kombinierte SPCast-Songzeilen lesen; private Historienfilter bleiben unabhängig. */
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
        /[\r\n\x00-\x1f]/.test(text.trim())) { throw new Error('invalid current song'); }
    // Optionale Anbieterzusätze gehören nicht zu Titel oder Interpret.
    var combined = text.split('|')[0].trim();
    if (!combined || combined.toLowerCase() === 'unknown') { throw new Error('current song unavailable'); }
    return split(combined);
  }
  function history(text) {
    if (text.length > 2000000) { throw new Error('history too large'); }
    var rows = JSON.parse(text), latest = null, now = Date.now();
    if (!Array.isArray(rows) || rows.length > 10000) { throw new Error('invalid history'); }
    rows.forEach(function (row) {
      var stamp = row && row.timestamp, song = row && row.metadata && row.metadata.song;
      if (Number.isSafeInteger(stamp) && stamp > 0 && stamp * 1000 <= now &&
          typeof song === 'string' && song.trim() && song.trim().toLowerCase() !== 'unknown' && song.length <= 2000 &&
          (!latest || stamp > latest.timestamp)) { latest = row; }
    });
    if (!latest) { throw new Error('history has no valid title'); }
    var song = split(latest.metadata.song);
    song.timestamp = latest.timestamp;
    return song;
  }
  return { current: current, history: history };
});

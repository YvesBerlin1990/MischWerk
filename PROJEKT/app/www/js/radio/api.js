/* Geprüfte öffentliche RadioKing-Adressen, HTTP und Antwortvalidierung. */
MischWerkUI.define('radioApi', function (dependencies) {
  'use strict';

  function getResponse(url, fresh) {
    if (fresh && typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 10000);
      return fetch(url, { cache: 'no-store', credentials: 'omit', signal: controller.signal }).then(function (response) {
        if (!response.ok) { throw new Error('http'); }
        return response.text();
      }).then(function (text) { clearTimeout(timer); return text; }, function () {
        clearTimeout(timer); throw new Error('network');
      });
    }
    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest(); request.open('GET', url, true); request.timeout = 10000;
      request.onload = function () {
        if (request.status < 200 || request.status >= 300) { reject(new Error('http')); return; }
        resolve(request.responseText);
      };
      request.onerror = request.ontimeout = function () { reject(new Error('network')); };
      request.send();
    });
  }
  
  function radioKingUrls(station) {
    if (!station || !station.configured || station.provider !== 'radioking' ||
        typeof station.radioId !== 'string' || station.radioId.length > 120 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(station.radioId)) { return null; }
    var stream = 'https://play.radioking.io/' + station.radioId;
    var metadata = 'https://api.radioking.io/widget/radio/' + station.radioId + '/track/current';
    // Nur die zum bestätigten Radio gehörenden öffentlichen Endpunkte zulassen.
    if (station.streamUrl !== stream || station.metadataUrl !== metadata) { return null; }
    var base = 'https://api.radioking.io/widget/radio/' + station.radioId;
    return { stream: stream, metadata: metadata, status: base, listeners: base + '/listener' };
  }
  
  function fetchStationStatus(station) {
    var urls = radioKingUrls(station);
    if (!urls) { return Promise.reject(new Error('station unavailable')); }
    return getResponse(urls.status, true).then(function (text) {
      var data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || data.status === 'error' || data.slug !== station.radioId) { throw new Error('invalid RadioKing station'); }
      // Senderstart ausschließlich aus stream_status, unabhängig von Titel- oder Studiomodus.
      return data.stream_status === 'started' || data.stream_status === 'stopped' ? data.stream_status : 'unknown';
    });
  }
  function fetchProviderStatus(station) {
    return fetchStationStatus(station).catch(function () { return 'unknown'; });
  }
  
  function parseMetadata(text) {
    var data = JSON.parse(text);
    if (data === null) { return { title: '', artist: { name: '' }, isLive: null }; }
    if (typeof data !== 'object' || Array.isArray(data) || data.error || data.status === 'error' ||
        (!Object.prototype.hasOwnProperty.call(data, 'title') && !Object.prototype.hasOwnProperty.call(data, 'artist'))) {
      throw new Error('invalid RadioKing metadata');
    }
    // RadioKing liefert getrennte Felder. Bindestriche in Titeln/Interpreten unverändert lassen.
    return { title: typeof data.title === 'string' ? data.title.trim() : '',
      artist: { name: typeof data.artist === 'string' ? data.artist.trim() : '' },
      isLive: typeof data.is_live === 'boolean' ? data.is_live : null };
  }
  
  function fetchMetadata(station) {
    var urls = radioKingUrls(station);
    if (!urls) { return Promise.reject(new Error('metadata unavailable')); }
    return getResponse(urls.metadata, true).then(parseMetadata);
  }
  function fetchListeners(station) {
    var urls = radioKingUrls(station);
    if (!urls) { return Promise.reject(new Error('listeners unavailable')); }
    return getResponse(urls.listeners, true).then(function (text) {
      var data = JSON.parse(text);
      var count = data && data.listener_count;
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || data.message ||
          (typeof count !== 'number' && !(typeof count === 'string' && /^[0-9]+$/.test(count)))) {
        throw new Error('invalid listener count');
      }
      count = Number(count);
      if (!isFinite(count) || count < 0 || Math.floor(count) !== count || count > 9007199254740991) {
        throw new Error('invalid listener count');
      }
      return count;
    });
  }
  return { radioKingUrls: radioKingUrls, fetchProviderStatus: fetchProviderStatus,
    fetchStationStatus: fetchStationStatus, fetchMetadata: fetchMetadata, fetchListeners: fetchListeners };
});

// Ausschließlich lokale, synthetische Anschlüsse; kein echtes STREAMPANEL-Produkt.
function configureStream(config, id = 'test-radio') {
  const enabled = typeof id === 'string' && id.length > 0;
  const base = enabled ? 'https://stats.example.com/widget/radio/' + id : '';
  config.streampanel = {
    streamUrl: enabled ? 'https://stream.example.com/' + id : '',
    allowedHosts: ['stats.example.com'],
    metadata: { url: base ? base + '/track/current' : '', titleField: 'title', artistField: 'artist', liveField: 'is_live' },
    status: { url: base, valueField: 'stream_status', onlineValue: 'started', offlineValue: 'stopped',
      identityField: 'slug', identityValue: enabled ? id : '' }
  };
  return config.streampanel;
}
function spcastStatistics({ online = true, listeners = 0 } = {}) {
  return { totalstreams: 1, activestreams: online ? 1 : 0, currentlisteners: listeners,
    streams: [{ id: 1, streampath: '/stream', serverurl: 'https://mischwerk.spcast.eu',
      streamstatus: online ? 1 : 0, backupstatus: 0, currentlisteners: listeners }] };
}
module.exports = { configureStream, spcastStatistics };

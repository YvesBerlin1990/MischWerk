/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
var MischWerkConfig = {
    version: '0.1.322',
    buildNumber: 322,
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    curtainExemptNicks: ['Otterchen', 'Polaroid'],
    // Öffentliche SPCast-Anschlüsse; Historie als aktuelle Titelquelle geprüft am 09.11.2026.
    // Keine Moderatorpasswörter, privaten API-Schlüssel oder Beispielstationen eintragen.
    streampanel: {
        streamUrl: 'https://mischwerk.sp.radio.fm/stream',
        allowedHosts: ['mischwerk.spcast.eu', 'scripts.streampanel.net'],
        historyUrl: 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json',
        historyIgnoredTitles: ['Mischwerk dein Radio', 'Dein Mix auf Mischwerk'],
        metadata: {
            url: 'https://mischwerk.spcast.eu:9000/sp/cache/history/history.json', format: 'spcast-history',
            titleField: 'metadata.song', artistField: '', liveField: '',
            modeUrl: 'https://mischwerk.sp.radio.fm/scripts/whoIsLive.php'
        },
        status: {
            url: 'https://mischwerk.sp.radio.fm/statistics?json=1', format: 'spcast-statistics',
            streamId: 1, streamPath: '/stream', valueField: 'streamstatus', onlineValue: 1, offlineValue: 0,
            identityField: 'serverurl', identityValue: 'https://mischwerk.spcast.eu'
        }
    },
    // Optionale anfängliche Radio-Moderatoren; weitere IDs verwaltet der Channelinhaber persistent.
    radioModeratorUserIds: []
};

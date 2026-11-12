/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
var MischWerkConfig = {
    version: '0.1.382',
    buildNumber: 382,
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    // Öffentliche SPCast-Anschlüsse; schneller currentsong-Anschluss geprüft am 10.11.2026.
    // Keine Moderatorpasswörter, privaten API-Schlüssel oder Beispielstationen eintragen.
    streampanel: {
        streamUrl: 'https://mischwerk.sp.radio.fm/stream',
        allowedHosts: ['mischwerk.spcast.eu'],
        metadata: {
            url: 'https://mischwerk.sp.radio.fm/currentsong?sid=1', format: 'spcast-shoutcast-song',
            titleField: '', artistField: '', liveField: '',
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

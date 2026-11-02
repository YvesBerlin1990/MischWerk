/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
var MischWerkConfig = {
    version: '0.1.117',
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    curtainExemptNicks: ['Otterchen', 'Polaroid'],
    // Öffentliche Höreranschlüsse erst nach Bereitstellung aus der Produktverwaltung übernehmen.
    // Keine Moderatorpasswörter, privaten API-Schlüssel oder Beispielstationen eintragen.
    streampanel: {
        streamUrl: '',
        allowedHosts: [],
        metadata: { url: '', titleField: '', artistField: '', liveField: '' },
        status: { url: '', valueField: '', onlineValue: null, offlineValue: null,
            identityField: '', identityValue: '' },
        listeners: { url: '', valueField: '' }
    },
    // Optionale anfängliche Radio-Moderatoren; weitere IDs verwaltet der Channelinhaber persistent.
    radioModeratorUserIds: [],
    moderatorSessionHours: 6
};

/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
var MischWerkConfig = {
    version: '0.1.106',
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    curtainExemptNicks: ['Otterchen', 'Polaroid'],
    // Öffentliche Radio-ID aus RadioKing; keine Live-/Manager-Zugangsdaten nötig.
    radioking: {
        radioId: 'mischwerk'
    },
    // Optionale anfängliche Radio-Moderatoren; weitere IDs verwaltet der Channelinhaber persistent.
    radioModeratorUserIds: [],
    moderatorSessionHours: 6
};

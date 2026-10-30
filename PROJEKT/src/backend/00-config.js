/* MischWerk Backend-Konfiguration. Keine Zugangsdaten oder Clientwerte. */
var MischWerkConfig = {
    stationName: 'MischWerk',
    ownerNick: 'Otterchen',
    // Öffentliche Radio-ID aus RadioKing; keine Live-/Manager-Zugangsdaten nötig.
    radioking: {
        radioId: 'mischwerk'
    },
    // Zusätzliche Radio-Moderatoren nur über echte numerische Knuddels-User-IDs.
    radioModeratorUserIds: [],
    maxQueueLength: 50,
    moderatorSessionHours: 6
};

var MischWerkModules = {};

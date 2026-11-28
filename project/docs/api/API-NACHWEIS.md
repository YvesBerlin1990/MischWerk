# MischWerk – Schnittstellen

Dieses Dokument beschreibt die Schnittstellen, die MischWerk heute verwendet. Verbindliche Vorgaben zu Verhalten, Rechten und Grenzen stehen in [agent-rules.json](../../../agent-rules.json). Die Signaturen prüft `pnpm run check` gegen die beiden unveränderten offiziellen Referenzstubs unter [project/userapp/references/api/](../../userapp/references/api). Weitere Quellen sind die [Knuddels-Entwicklerdokumentation](https://developer.knuddels.de/docs/) und das [UserApps-Wiki](https://github.com/knuddelsgmbh/UserApps/wiki).

## Knuddels-Server (Backend, ES5 auf Rhino)

| Bereich | Verwendete API | Zweck |
| --- | --- | --- |
| Lebenszyklus | `App.onAppStart`, `onPrepareShutdown`, `onShutdown`, `onUserJoined`, `onUserLeft`, `onUserDeleted`, `onEventReceived`, `onPrivateMessage` | Start, Beenden, Channelbeitritt, Nutzerlöschung, Clientereignisse, Smiley-Import per Privatnachricht |
| Chatbefehle | `App.chatCommands` mit `mw`, `settopic`, `update` | Einzige registrierte Befehle |
| Persistenz | `KnuddelsServer.getPersistence()`, `User.getPersistence()` mit `getObject`/`setObject`/`deleteObject` | Appzustand, Sendeplanwochen, Bot-Einstellungen, paginierte Wunsch-Outbox, Nicklisten-Vormerkungen |
| Nutzer und Rechte | `KnuddelsServer.getUserAccess()`, `User.isChannelOwner`, `User.isAppManager` | Inhaber-, Verwaltungs- und Wartungsrechte aus authentifizierten Objekten |
| Sitzungen | `AppContent.getSessions()`, `AppContentSession.getOpenTimestamp()` | Zuordnung und Schließen nativer Ansichten |
| Nachrichten | `User.sendPrivateMessage`, `KnuddelsServer.getDefaultBotUser().sendPublicMessage` | Antworten, Willkommensgrafik, öffentliche Begrüßung und Studiomeldungen |
| Profil | `User.getProfileLink`, `hasProfilePhoto`, `getProfilePhoto(24, 24)` | Verlinkter Nick und Profilfoto in der Begrüßung |
| Nickliste | `User.addNicklistIcon(path, width)`, `removeNicklistIcon(path)`, `KnuddelsServer.getFullImagePath` | Team-, Mikrofon- und Kopfhörersymbol |
| Channel-Thema | `getChannel().getChannelConfiguration().getChannelInformation()` mit `getTopic`, `setTopic(text, true)` | `/settopic` |
| Externe Adressen | `getExternalServerAccess()` mit `canAccessURL`, `getURL`, `postURL` | Sendeplan lesen, Firebase-Abgleich |
| Wartung | `getAppAccess().getOwnInstance().getRootInstance()` mit `updateAppFiles`, `invalidateClientCache`, `updateApp`; `KnuddelsServer.listFiles` | `/update` mit Dateiprüfung vor dem Neustart |
| Sonstiges | `getDefaultLogger`, `getAppServerInfo` | Begrenzte Protokollierung, Laufzeitangaben |

Pakete zwischen Server und Client bleiben einschließlich JSON-Hülle unter 10 000 Zeichen und werden bei Bedarf seitenweise übertragen.

## Knuddels-Client (HTMLUI)

| Verwendete API | Zweck |
| --- | --- |
| `Client.includeJS`, `Client.includeCSS` | Einmaliges Laden nach festem Ladeplan aus [frontend-files.cjs](../../userapp/tools/lib/frontend-files.cjs) |
| `Client.pageData` | Startdaten der Ansicht |
| `Client.sendEvent` (über die Clientbrücke in `js/transport/`) | Ereignisse an den Server (Präfix `mw:`) |
| `Client.executeSlashCommand('/confirm')` | Aktivitätsbestätigung bei nachgewiesener Wiedergabe |
| `getHostFrame().setSize(width, height)` | Natürliche Höhe von Radioleiste, Wunschbox und Sendeplan; Headerbars ignorieren die Breite |

### Clientereignisse

| Gruppe | Ereignisse |
| --- | --- |
| Start und Zustand | `mw:ready`, `mw:state`, `mw:refresh`, `mw:result`, `mw:listenerPresence` |
| Overlays | `mw:overlay.prepare`, `.open`, `.ready`, `.resume`, `.draft`, `.close`, `.closed`, `.cancel`, `.dismiss`; `mw:openWishes`, `mw:openSchedule`, `mw:openRadioTeam` |
| Wünsche | `mw:wish.submit`, `mw:wish.receipt`, `mw:wishes.open`, `.input`, `.edit`, `.submit`, `.sync`, `.presentation`, `.closed` |
| Sendeplan | `mw:schedule.day`, `mw:schedule.data`, `mw:schedule.result`; andere `mw:schedule.*`-Aufträge werden ohne Änderung abgewiesen |
| Verwaltung | `mw:display.save`, `mw:display.theme`, `mw:setTicker`, `mw:channelTexts.save`, `.state`, `mw:androidSettings.status`, `.save`, `.activate`, `.deactivate`, `.result` |
| Verworfen | `mw:playback.error` wird ohne Auswertung oder Antwort verworfen |

## Externe Dienste

| Adresse | Richtung | Zweck |
| --- | --- | --- |
| `https://mischwerk.sp.radio.fm/stream` | Client liest | Audiostream (STREAMPANEL/SPCast) |
| `https://mischwerk.sp.radio.fm/currentsong?sid=1` | Client liest | Aktueller Titel; eine Songzeile, `text/plain` oder `text/html` mit strenger Zeilenprüfung |
| `https://mischwerk.sp.radio.fm/scripts/whoIsLive.php` | Client liest | AutoDJ-/Live-Modus |
| `https://mischwerk.sp.radio.fm/statistics?json=1` | Client liest | Übertragungsstatus; ohne Zusatzparameter |
| `https://radio-mischwerk.web.app/api/public-schedule?week=<Montag>` | Server liest | Öffentlicher Sendeplan, höchstens vorige/aktuelle/nächste Berliner Woche |
| `https://radio-mischwerk.web.app/api/publishKnuddelsState` | Server sendet | Signierter V2-Abgleich mit dem MischWerk Live Studio |

Die konkrete Konfiguration steht in [src/backend/config.js](../../userapp/src/backend/config.js); `node tools/checks/streampanel.cjs` prüft die STREAMPANEL-Quellen lesend.

### V2-Abgleich mit dem Live Studio

- Hülle aus vier Zeichenketten `payload`, `ts`, `nonce`, `sig`; HMAC-SHA256 über `v1.ts.nonce.payload` in UTF-8, Ausgabe als Hex in Kleinbuchstaben, mit dem vorhandenen Sync-Secret.
- Innerer Vertrag 2 mit `transportId`/`requestId`, bis zu zehn `wishSubmissions`, zwanzig `ownWishQueries`, zehn `ownerDeletions`, `eventCursor`/`nickAccessCursor`.
- Antworten gelten nur bei HTTP 200 und `accepted`, plausibler `serverTime`, passendem Ziel und höchstens 32 768 UTF-16-Zeichen bzw. UTF-8-Bytes innerhalb von zehn Sekunden.
- Ein Publisher-Timer, Grundtakt zehn Sekunden, Backoff 10/20/40/60 Sekunden, höchstens ein offener Aufruf.
- `core/http-budget` begrenzt rollend auf 60 Abgleich-POSTs und 30 Sendeplan-GETs je zehn Minuten; zehn der dokumentierten 100 externen Anfragen bleiben frei.
- Der führende gemeinsame Vertrag liegt im Android-Projekt unter `project/docs/STUDIO_BROADCAST_CONTRACT.md`.

## Nachweis

| Ebene | Werkzeug | Belegt |
| --- | --- | --- |
| Signaturen | `pnpm run check` | Aufrufe passen zu den Referenzstubs |
| Fachlogik | `pnpm test` | Verhalten in modellierter Plattform |
| Laufzeit | `pnpm run check:rhino` | Rhino 1.7.7.2 und 1.9.1 |
| Oberfläche | `pnpm run test:browser` | Edge mit K3-/STAPP-Modellen |
| Plattform | [LIVE-Abnahme](../betrieb/LIVE-ABNAHME.md) | Native Darstellung und Betrieb, gesondert abzunehmen |

Lokale Modelle und Emulator belegen keine native Plattformausführung.

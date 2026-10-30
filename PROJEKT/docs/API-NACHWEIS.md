# MischWerk – API-Nachweis 0.1.30

Stand 30.10.2026. RadioKing ersetzt die frühere Radioanbindung vollständig. 0.1.27 ergänzt die vom Channelinhaber gepflegte Radiomoderatorenrolle; 0.1.28 gestaltet das Moderationspopup neu; 0.1.29 entfernt die feste Wunschgrenze und schützt den technischen Wiederholungsbestand; 0.1.30 normalisiert Knuddels-/Rhino-Wrapper vor der Wunschpersistenz. Kein Knuddels-Upload, Update oder Neustart.

## Knuddels und K3

Die betroffenen Signaturen wurden gegen die beiden unveränderten lokalen Referenzen in `references/api/` und die aktuellen offiziellen Seiten für [Client](https://developer.knuddels.de/docs/classes/Client.html), [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html), [HostFrame](https://developer.knuddels.de/docs/classes/Client.HostFrame.html), [User](https://developer.knuddels.de/docs/classes/User.html), [UserAccess](https://developer.knuddels.de/docs/classes/UserAccess.html) und [AppPersistence](https://developer.knuddels.de/docs/classes/AppPersistence.html) abgeglichen.

| Aufgabe | Verwendeter dokumentierter Weg |
| --- | --- |
| Backend | Globales `App`, dokumentierte Start-/Event-/Lebenszyklus-Hooks, ES5/Rhino |
| Channel-Leiste | `HTMLFile`, `AppContent.headerbarContent`, `setResponsive`, Fähigkeitsprüfung vor `User.sendAppContent` |
| Wunschbox / Studio / Radio-Team | `AppContent.popupContent`, eigene Content-Sitzungen und serverseitige Rechteprüfung |
| Frontend → Backend | `Client.sendEvent`, `App.onEventReceived` |
| Backend → Frontend | `AppContentSession.sendEvent`, `Client.addEventListener`, `event.data` |
| Identität / Rechte | Authentifizierte Session/User-Objekte, `getUserId`, `getNick`, `isChannelOwner`; Studio nur für Besitzer oder persistiert ernannte numerische Radiomoderator-ID, nie automatisch für Channelmoderatoren |
| Nick-Auflösung | `KnuddelsServer.getUserAccess()`, `UserAccess.exists`, `getUserId`, `getNick`; der Client liefert keine vertrauenswürdige Rolle oder ID |
| Speicherung | `KnuddelsServer.getPersistence`, `getObject`, `setObject`; maximal 100 KB für das JSON-serialisierte Objekt |
| Größe | STAPP: `Client.getHostFrame().setSize(0, height)`; nur außerhalb K3 über `Client.isK3Client()` |
| Assets | `Client.includeCSS`, `Client.includeJS` |

Kein privater K3-Endpunkt, kein direktes Eingreifen in den Client, keine erfundenen Methoden. Referenz-Stubs werden nicht eingebunden. Nutzdaten bleiben unter dem dokumentierten Eventlimit; Listen sind paginiert.

## RadioKing

`MischWerkConfig.radioking.radioId` ist auf `mischwerk` gesetzt. Daraus entstehen ausschließlich diese öffentlichen HTTPS-Adressen:

- Audio: `https://play.radioking.io/mischwerk`.
- Aktueller Titel: `https://api.radioking.io/widget/radio/mischwerk/track/current`.

Primärnachweis durch direkte Anbieterantworten: [Sender](https://api.radioking.io/widget/radio/mischwerk), [Streamliste](https://api.radioking.io/widget/radio/mischwerk/stream), [Titel](https://api.radioking.io/widget/radio/mischwerk/track/current). Sie bestätigen den Namen MischWerk, Radio-ID `mischwerk`, numerische ID 950821, Standard-MP3 mit 128 kbit/s und getrennte `title`-/`artist`-Textfelder. Beim laufenden Sender lieferte der Titel-Endpunkt im Nachweis 0.1.17 JSON mit HTTP 200 und `Access-Control-Allow-Origin: *`; während der bestätigten Sendepause im Nachweis 0.1.25 antwortete er mit HTTP 404. Deshalb wird eine Sendepause ausschließlich anhand des passenden `slug` und `stream_status=stopped` am Senderstatus-Endpunkt festgestellt, niemals anhand der Titelantwort.

Die offizielle [RadioKing-Einstellungsübersicht](https://help.radioking.com/hc/en-us/articles/4409391813521-Settings-Presentation) beschreibt öffentlichen Hörlink und Live-Titrierung. Die [Live-Anleitung](https://help.radioking.com/hc/en-us/articles/4408959440913-Broadcast-live-with-LadioCast) unterscheidet den Encoder-Eingang `live.radioking.com` vom öffentlichen Listening-Link. Die beiden neueren Nutzerscreenshots bestätigen den eingebauten Standard-Hörlink. Live-Zugangsdaten, M3U-Datei und Smartlink sind keine Audioquelle dieser App.

Die Widget-API wurde direkt als öffentliche RadioKing-Schnittstelle verifiziert. Ein versionierter öffentlicher API-Vertrag wurde nicht gefunden; daraus folgt keine Zusage dauerhafter Verfügbarkeit. Rohantworten und Browsernachweis: [Netzwerkbericht](radioking-pruefung/anbindung-0.1.17.json).

HTTP und Audio bleiben im HTMLUI-Browser: `XMLHttpRequest` mit 10 Sekunden Timeout, öffentliche JSON-Abfrage alle 30 Sekunden nur in der sichtbaren Leiste; Wiedergabe über das HTML-Audioelement erst nach Klick. Kein Backend-HTTP-Zugriff oder `ExternalServerAccess`, daher keine angenommene `knuddelsAccess.txt`-Freigabe. Kein API-Schlüssel, kein Login, kein Live-/Manager-Passwort.

Radio-ID und abgeleitete Endpunkte werden im Backend und Frontend geprüft. Fremde Hosts, Zugangsdaten oder abweichende Radio-IDs werden nicht übernommen. Die HTTPS-Weiterleitung des Standard-Hörlinks folgt der Browser selbst. RadioKing liefert Künstler und Titel getrennt; keine heuristische Trennung an Bindestrichen. Null/fehlende Felder verschwinden, externe Texte werden ausschließlich über `textContent` ausgegeben.

Metadatenfehler stoppen kein Audio. Späte Antworten sind an die aktuelle Sendergeneration gebunden. ON-AIR-Schild und Moderatorname folgen weiterhin der authentifizierten Knuddels-Studioanmeldung, nicht RadioKings `is_live`. Wünsche lösen keine automatische RadioKing-Wiedergabe aus.

## Validierung und Grenzen

105 lokale Fälle bestanden (54 Backend-/HTTP-, 51 Browserfälle), Syntax-/API-/UI-Prüfung erfolgreich. Zusätzlich tatsächliche MischWerk-MP3-Dekodierung und Cross-Origin-Titelabfrage im Edge-Browser mit unverändertem Produktions-Frontend; nur die Knuddels-Brücke simuliert. Original-Logo unverändert. Seit 0.1.17 berücksichtigt der CSS-Abstand zwischen Play und Wiedergabestatus den äußeren Plattenteller-Ring. Details: [Prüfbericht](PRUEFUNG-0.1.30.md).

Seit 0.1.26 wird das Backend in sechs eigenständigen ES5-Modulen unter `src/backend/` gepflegt. `tools/build-backend.cjs` fügt sie in fester Reihenfolge ohne Laufzeit-Loader zu `app/main.js` zusammen. Knuddels erhält weiterhin ausschließlich die dokumentierte globale Variable `App` im einzelnen Backend-Bundle; weder `require` noch eine Node-, Browser- oder private K3-Schnittstelle gelangt in die Laufzeitdatei. `tools/check.cjs`, die Tests und der Paketbau lehnen ein vom Modulstand abweichendes Bundle ab.

Echte RadioKing-Abnahme im Knuddels-Desktop-/K3-Client bleibt nach separat freigegebenem Upload offen. Keine Behauptung, dass Browser-Mocks reale K3-Ausführung bestätigen. Bisherige API-Nachweise liegen unverändert unter [Sammelarchiv der früheren Unterlagen](../../ARCHIV/Historie-2026-10-29.zip) und gelten hinsichtlich früherer Radioanbieter nicht mehr.

Wunschbox-Sperre 0.1.18: Der vorhandene mw:openWishes-Event wird bei deaktivierter Wunschbox serverseitig vor AppContent-Erzeugung abgelehnt. Frontend sperrt den nativen Button und den Click-Handler, zeigt „Deaktiviert“ und gibt die Aktion nach bestätigtem Aktivieren wieder frei. Keine neue Knuddels-/K3-Signatur; vorhandene lokale User-/AppContent-/Event-Referenzen geprüft. Rolle, Persistenz, Radio-Audio und Studiozugang bleiben erhalten. Bereits geöffnete Wunschfenster werden gesperrt, ohne ihren Entwurf zu löschen.

0.1.19 korrigiert ausschließlich die inaktive ON-AIR-Farbe auf neutrales Grau ohne äußeren Lichtschein. Aktives Rot und die bestehende Studio-/Verbindungsprüfung bleiben erhalten. Keine Knuddels-/K3-Signatur geändert.

Lautstärke 0.1.20: 40 % Standard, automatische Wiederherstellung höchstens 60 %, darüber rote Hinweiszone, manuell weiterhin bis 100 %. Keine dB-Messung oder garantierte Schutzzone. Siehe [Einordnung](LAUTSTAERKE.md). Keine neue Knuddels-/K3-Schnittstelle.

Wunschbox 0.1.21 ersetzt die frühere zweispaltige Wunschansicht: ein Formular mit Interpret + Titel und einem kurzen Link-Hinweis, keine Historie/Nick-Anzeige/Reiter. Initial 520 × 360 px, Logo im Wunschkopf 72 px; Studio unverändert. Links in Frontend und Backend abweisen; authentifizierten Nick und kurze Zustellbestätigung erhalten. Aktuell gilt [PRUEFUNG-0.1.30.md](PRUEFUNG-0.1.30.md).

Positionierung 0.1.22: ON AIR und Sender-/Moderatorname bilden ab 901 px eine vertikal zur Wunschbox zentrierte Gruppe ohne künstliche Leerzeile. Schild und Name teilen eine Mittelachse, der Abstand beträgt 10 px. Ab 1500 px steht dafür eine 200–220 px breite Spalte zur Verfügung. Eine feine Trennlinie gliedert den Wunschbutton. Der berechtigte Moderationslink bleibt unten rechts und beeinflusst die übrige Geometrie nicht. Layout bei 320–2560 px mit langen Texten geprüft; Höhen und APIs unverändert.

Studio 0.1.23: sichtbarer Verbindungsstatus, serverseitig bestimmte eigene Anmeldung/Abmelderechte und Ablaufzeit, ausdrückliches Verlängern. ON AIR endet bei Verlassen, Rechteverlust oder Ablauf, auch bei Speicherfehlern keine unbestätigte Anzeige. Fachliche Vergleichswerte schützen parallele Änderungen. Warteschlange hält die Wunsch-ID und den Tastaturfokus; Erledigt/Verwerfen werden eindeutig bestätigt. Scrollfreie Studioansichten bei 320–780 px und vollständiger Backend-Browser-Ablauf geprüft. Keine neue K3-Methode oder RadioKing-Managerfunktion. Siehe [Prüfbericht](PRUEFUNG-0.1.30.md).

Gestaltung 0.1.24: deaktivierte Wunschbox mit neutralgrauem Rahmen, Schlosssymbol und kleiner Statusmarkierung „Deaktiviert“. Aktiv weiterhin Gold/Musiknote. Abmessungen, Position, tatsächliche Sperre und API-Wege unverändert. Siehe [Prüfbericht](PRUEFUNG-0.1.30.md).

RadioKing-Status 0.1.25: /widget/radio/{Radio-ID} zusätzlich lesen, ausschließlich stream_status=started/stopped bei passendem slug auswerten. Sendepause sperrt Play neutralgrau und beendet eine bestehende Audioverbindung; Wiederanlauf gibt frei ohne Autostart. Fehler/unbekannte Werte bleiben manuell bedienbar und stoppen keinen Ton. Status/Titel etwa alle 30 Sekunden nur sichtbar; keine Titelabfrage bei bestätigter Pause. Aktueller echter Status-/CORS-Nachweis: [0.1.30](radioking-pruefung/anbindung-0.1.30.json), [Prüfbericht](PRUEFUNG-0.1.30.md). Frühere MP3-Dekodierung bleibt separat im Bericht 0.1.17 nachgewiesen.

Radio-Team 0.1.27: Ein neuer, nur für den tatsächlichen Channelinhaber freigegebener Event-/Popup-Weg verwaltet höchstens 50 Radiomoderatoren außerhalb des Moderationsmenüs; die Liste wird serverseitig in Fünferseiten übertragen. `UserAccess.exists` prüft den Nick; `getUserId` liefert die dauerhaft gespeicherte numerische Identität, `getNick` nur den aktuellen Anzeigewert. Eine Fachrevision verhindert das Überschreiben paralleler Änderungen. Jede Studioaktion und jeder Snapshot prüft Besitzer oder ID-Listenmitglied erneut; `User.isChannelModerator` wird im Produktionsbackend bewusst nicht mehr verwendet. Beim Entfernen oder Löschen einer ID endet deren aktive Studio-Anmeldung. Bestehende AppPersistence ohne Rollenfelder wird kompatibel mit einer leeren Liste ergänzt.

Studio-Optik 0.1.28: ausschließlich HTML-Struktur und CSS des vorhandenen Moderationspopups wurden neu gegliedert. Alle bisherigen IDs, Events, Rollenprüfungen und HostFrame-Wege bleiben erhalten. Inline-SVGs sind rein lokale Bedienelement-Symbole; es gibt keine neue Ressource, Bibliothek oder API. Das rote Statuslicht verwendet nur den bereits serverseitig bestätigten `moderator-on-air`-Zustand. Der frühere statische Fußtext ist aus dem HTML entfernt; die dynamische Ablaufanzeige bleibt unverändert.

Wunschpersistenz 0.1.29: Die offizielle AppPersistence-Grenze von 100 KB gilt für das JSON-serialisierte Objekt. Der technische Wiederholungsschutz `cooldowns` wird daher beim Laden und vor jedem Schreiben auf gültige Anfrage-IDs und die 100 neuesten Einträge begrenzt. Ein erster Schreibfehler löst einen zweiten Versuch mit 20 Wiederholungsmarkern aus; offene Wünsche und sämtliche fachlichen Zustandsfelder bleiben dabei unverändert. Schlägt auch dieser Versuch fehl, wird kein In-Memory-Erfolg übernommen, der Wunschentwurf bleibt im Frontend erhalten und das private Log kennzeichnet die Operation mit `PERSIST_WRITE`. Es gibt weiterhin keine Wartezeit, persönliche Begrenzung oder feste Gesamtanzahl. Die Queue bleibt für das Eventlimit einzeln paginiert. Erfolgs-, Versand- und Fehlerfeedback verwenden getrennte Klassen und dokumentierte ARIA-Live-Eigenschaften; es kommt keine neue Knuddels- oder K3-Schnittstelle hinzu.

Wunschpersistenz 0.1.30: `User.getUserId()` und `User.getNick()` können in der echten Knuddels-/Rhino-Laufzeit Wrapperwerte liefern. Zentrale Laufzeithelfer wandeln sie nun vor jedem Vergleich, Zustandsobjekt und `JSON.stringify` in eine endliche positive Ganzzahl beziehungsweise einen JavaScript-String um. Die JSON-Vorbereitung der AppPersistence besitzt einen eigenen sicheren Fehlerpfad `PERSIST_PREPARE`; der Eventablauf protokolliert zusätzlich kurze Phasenkennungen wie `REQUEST_ADD`, ohne interne Ausnahmetexte oder Nutzerdaten preiszugeben. Es kommt keine neue Knuddels- oder K3-Schnittstelle hinzu.

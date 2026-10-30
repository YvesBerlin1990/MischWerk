# MischWerk – aktueller Teststand

30.10.2026 · lokale Version 0.1.28 · RadioKing · zuletzt bestätigtes LIVE 0.1.13.

102 automatisierte Fälle bestanden (51 Backend-/HTTP-, 51 Browserfälle), 0 Fehler. Die echte MP3-/CORS-Prüfung stammt vom laufenden Sender aus dem Nachweis 0.1.17; der aktuelle Nachweis 0.1.28 bestätigt die öffentliche Statusantwort während einer Sendepause. Kein Upload oder Neustart.

- Aktueller Bericht: [PRUEFUNG-0.1.28.md](PRUEFUNG-0.1.28.md).
- Rohantworten/Browsernachweis: [anbindung-0.1.17.json](radioking-pruefung/anbindung-0.1.17.json).
- Aktueller Senderstatus: [anbindung-0.1.28.json](radioking-pruefung/anbindung-0.1.28.json).
- Echte Leistenvorschau: [2124 px](radioking-pruefung/MischWerk-RadioKing-2124.png).
- Frühere Prüfungen: [Sammelarchiv](../../ARCHIV/Historie-2026-10-29.zip).

RadioKing ist der einzige aktive Radioanbieter. Der reale Knuddels-/K3-Test des RadioKing-Streams steht bis zur erneuten Uploadfreigabe aus. Ein echter Encoder-/AutoDJ-Wechsel wurde nicht ausgelöst.

0.1.18 ergänzt die vollständige Wunschbox-Sperre: kein Popup im Browser oder Backend, verständlicher Deaktiviert-Text, unveränderte Wünsche, Studiozugang und Audio sowie erneutes Öffnen nach Reaktivierung.

Lautstärke 0.1.20: 40 % Standard, automatische Wiederherstellung höchstens 60 %, darüber rote Hinweiszone, manuell weiterhin bis 100 %. Keine dB-Messung oder garantierte Schutzzone. Siehe [Einordnung](LAUTSTAERKE.md). Keine neue Knuddels-/K3-Schnittstelle.

Wunschbox 0.1.21 ersetzt die frühere zweispaltige Wunschansicht: ein Formular mit Interpret + Titel und einem kurzen Link-Hinweis, keine Historie/Nick-Anzeige/Reiter. Initial 520 × 360 px, Logo im Wunschkopf 72 px; Studio unverändert. Links in Frontend und Backend abweisen; authentifizierten Nick und kurze Zustellbestätigung erhalten. Aktuell gilt [PRUEFUNG-0.1.28.md](PRUEFUNG-0.1.28.md).

Positionierung 0.1.22: ON AIR und Sender-/Moderatorname bilden ab 901 px eine vertikal zur Wunschbox zentrierte Gruppe ohne künstliche Leerzeile. Schild und Name teilen eine Mittelachse, der Abstand beträgt 10 px. Ab 1500 px steht dafür eine 200–220 px breite Spalte zur Verfügung. Eine feine Trennlinie gliedert den Wunschbutton. Der berechtigte Moderationslink bleibt unten rechts und beeinflusst die übrige Geometrie nicht. Layout bei 320–2560 px mit langen Texten geprüft; Höhen und APIs unverändert.

Studio 0.1.23: sichtbarer Verbindungsstatus, serverseitig bestimmte eigene Anmeldung/Abmelderechte und Ablaufzeit, ausdrückliches Verlängern. ON AIR endet bei Verlassen, Rechteverlust oder Ablauf, auch bei Speicherfehlern keine unbestätigte Anzeige. Fachliche Vergleichswerte schützen parallele Änderungen. Warteschlange hält die Wunsch-ID und den Tastaturfokus; Erledigt/Verwerfen werden eindeutig bestätigt. Scrollfreie Studioansichten bei 320–780 px und vollständiger Backend-Browser-Ablauf geprüft. Keine neue K3-Methode oder RadioKing-Managerfunktion. Siehe [Prüfbericht](PRUEFUNG-0.1.28.md).

Gestaltung 0.1.24: deaktivierte Wunschbox mit neutralgrauem Rahmen, Schlosssymbol und kleiner Statusmarkierung „Deaktiviert“. Aktiv weiterhin Gold/Musiknote. Abmessungen, Position, tatsächliche Sperre und API-Wege unverändert. Siehe [Prüfbericht](PRUEFUNG-0.1.28.md).

RadioKing-Status 0.1.25: /widget/radio/{Radio-ID} zusätzlich lesen, ausschließlich stream_status=started/stopped bei passendem slug auswerten. Sendepause sperrt Play neutralgrau und beendet eine bestehende Audioverbindung; Wiederanlauf gibt frei ohne Autostart. Fehler/unbekannte Werte bleiben manuell bedienbar und stoppen keinen Ton. Status/Titel etwa alle 30 Sekunden nur sichtbar; keine Titelabfrage bei bestätigter Pause. Aktueller echter Status-/CORS-Nachweis: [0.1.28](radioking-pruefung/anbindung-0.1.28.json), [Prüfbericht](PRUEFUNG-0.1.28.md). Frühere MP3-Dekodierung bleibt separat im Bericht 0.1.17 nachgewiesen.

Backend-Struktur 0.1.26: sechs ES5-Module unter `src/backend/`, deterministisches Bundle `app/main.js`, automatische Bundle-Aktualitätsprüfung in Tests, Check und Paketbau. Keine Laufzeit- oder API-Änderung.

Radio-Team 0.1.27: Channelmoderatoren besitzen keinen automatischen Studiozugriff mehr. Der Channelinhaber ernennt existierende Knuddels-Nicks im eigenen Radio-Team-Popup; gespeichert werden numerische User-IDs. Besitzergrenze, unbekannte und doppelte Nicks, parallele Revisionen, Neustartpersistenz, eigenes Popup, sichere Textausgabe, schmale Darstellung, Rechteentzug und sofortiges Ende einer laufenden Anmeldung sind automatisiert geprüft.

Moderationsfenster 0.1.28: neue Broadcast-Konsolenoptik mit Rack-Kopf, zwei Steuerkarten, kompaktem Themenstreifen und gefasster Warteschlange. Der frühere Fußtext ist vollständig entfernt. Bestehende Funktionstests sowie Layout-, Fokus- und Scrollfreiheitstests bei 320, 390, 600, 601 und 780 px bleiben bestanden; aktualisierte Abnahmebilder liegen unter `docs/studio-pruefung/`.

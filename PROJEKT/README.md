# MischWerk – Projektübersicht

Lokaler Stand **0.1.106 mit RadioKing**. Zuletzt im echten Knuddels-App-Log beobachtet: **0.1.103**, Backend gestartet, Radioleiste leer. Upload, Knuddels-Update und Serverneustart benötigen weiterhin eine neue ausdrückliche Freigabe.

Version 0.1.106 entfernt die senkrechte Mittelnaht aus dem Vorhang. Das Logo fügt sich ohne dunkles Rechteck in die deckende Kartenfläche ein. Gestaltung ausschließlich per CSS geändert; Logo-Datei, Werbung, Vorhangsteuerung und Funktionen bleiben erhalten.

Version 0.1.105 zeigt Rückmeldungen in der Radioleiste kompakt unten rechts, passend zur Textbreite und höchstens 420 px breit. Lange Meldungen umbrechen auch bei 320 px Fensterbreite. Texte, Fehlerzustände, Ausblendzeit und Rückmeldungen in Popupfenstern bleiben erhalten.

Version 0.1.104 korrigiert den leeren Start: Die echte Knuddels-Dateieinbindung arbeitet mit document.write. Der frühere Aufruf nach DOMContentLoaded konnte die HTML-Oberfläche löschen. js/start.js und sein Fensterplan werden jetzt während des Parsens eingebunden; erst die Zusammensetzung wartet auf fertiges HTML und alle Module. Ein zusätzlicher Test bildet diese Einbindung für alle fünf Fenster nach. Falls die Oberfläche nicht fertig wird, erscheint nach 15 Sekunden ein verständlicher Hinweis statt einer dauerhaft leeren Fläche. Vorhang, Werbe-MP3 und bisherige Funktionen bleiben erhalten.

Seit 0.1.103 verhüllt ein Vorhang die Radioleiste. Otterchen und Polaroid sehen die Leiste direkt. Nur Otterchen als tatsächlicher Channelinhaber erhält den eigenen Button zum globalen Öffnen/Schließen; dieser Zustand bleibt bei Neustarts erhalten. Der getrennte Button Werbung starten spielt die eigene MP3 lokal beim jeweiligen Hörer. Weder Klick noch Audioende öffnen den Vorhang. Die MP3 lädt erst auf Klick, Startlautstärke höchstens 10 %. Die Radioleiste lädt nun 18 JavaScript-Dateien und acht Stylesheets; andere Fensterpläne bleiben unverändert.

Historische Messung mit 0.1.102: Kontrollierter lokaler Erststart mit 120 ms zusätzlicher Antwortzeit je Textdatei: Median 827 → 674 ms; mit Cache 26 → 34 ms bei je drei Durchläufen. Der damals verwendete DOMContentLoaded-Ladeweg war mit der echten Knuddels-Einbindung nicht kompatibel und wurde in 0.1.104 korrigiert. Diese früheren Mockmessungen sind kein Nachweis für die aktuelle Knuddels-Ladezeit. Die reine Weiterleitungsdatei bleibt entfernt; Fensterpläne und Freigabe erst nach fertigem Layout bleiben erhalten.

Seit 0.1.101 lädt jedes Fenster seine eigenen Module und Styles. Beim Channelbeitritt benötigt die Radioleiste 17 statt 36 JavaScript-Dateien und sieben statt 14 Stylesheets. Die Textressourcen sinken von 176.752 auf 80.934 Bytes, jeweils ohne HTML und Logo. Das Original-Logo behält seine Maße und lädt unabhängig von der Bedienbereitschaft. Popupfunktionen, Rechte, Audiostart und Cacheaktualisierung bleiben erhalten. Gemessene lokale Ressourcenmengen sind keine zugesagte Knuddels-Ladezeit.

Seit 0.1.100 bündelt eine gemeinsame Sendeplan-Karte die Wochenwahl und Aktionen. Pfeile flankieren den mittigen Zeitraum, darunter stehen Diese Woche, Aktualisieren und für den Besitzer Sendung eintragen. Der sichtbare Zusatz „Deutsche Ortszeit“ entfällt. Kalenderberechnung und Sommer-/Winterzeit bleiben unverändert; die Leiste passt auch bei 320 px Breite.

Seit 0.1.99 verwenden alle Popupfenster das Design der Radioleiste. Die Moderation bündelt Studio-Steuerung und Musikwünsche in zwei Arbeitsbereichen; das Themenfeld hat die volle Spaltenbreite. Radio-Team, Statuszentrale und Sendeplan haben passende Karten und Goldbuttons. Prüfzeiten stehen unter Details; die neun Statuswerte bleiben direkt sichtbar.

Seit 0.1.98 sind Logo und Titel in Wunschbox, Moderation und Radio-Team größer. „Wunschbox offen“ entfällt; Hinweise bei deaktivierter Wunschbox oder fehlender Verbindung bleiben erhalten. Die kompakte Statuszentrale zeigt weiterhin alle neun Statuswerte bei 320 px Breite ohne Scrollen.

Seit 0.1.97 besitzt die äußere Radioleiste einen ruhigen anthrazitfarbenen Hintergrund mit sanftem Goldlicht, feiner Materialstruktur und warmer Außenkontur. Die Fläche ist abgerundet; Größen, Bedienung und Wiedergaberahmen bleiben erhalten. Die neue Grundfarbe gilt bereits beim Laden ausschließlich für die Radioansicht.

Seit 0.1.96 stehen Live-Beschriftung und Moderatorname in einer gemeinsamen dezenten Anzeige mit gleicher Schriftgröße und Zeilenhöhe. Beide Texte sind mittig ausgerichtet; lange Namen umbrechen vollständig. Der Text „DJ Mischwerk legt auf“ und die bestätigten Moderationszustände bleiben erhalten.

Seit 0.1.95 steht ohne angemeldete Live-Moderation auf Nutzerwunsch „DJ Mischwerk legt auf“ in der Radioleiste. Startvorlage, Tooltip und zugängliche Beschriftung verwenden denselben Text. Bestätigte Live-Moderation und Verbindungswarnung bleiben erhalten.

Version 0.1.94 erneuert beim Appstart und nach dem Dateiabruf im Updatebefehl den dokumentierten Oberflächen-Cache. Dies gilt auch dann, wenn Dateien schon übernommen wurden und die nächste Dateiliste leer ist. Ohne neue Dateien erfolgt weiterhin kein Neustart. Die private Rückmeldung nennt die laufende Codeversion und erklärt das erneute Öffnen der Statuszentrale sowie das notwendige vollständige Uploadziel.

## Ablage im MischWerk-Hauptordner

| Ordner | Zweck |
| --- | --- |
| [UPLOAD/MischWerk](../UPLOAD/MischWerk/) | 84 fertige Laufzeitdateien einschließlich `server/` und `www/` |
| [ANLEITUNGEN](../ANLEITUNGEN/) | Installation, RadioKing-Einrichtung und aktuelles Paket |
| PROJEKT | Gepflegte Quellen, lokale Vorschau, Tests, Werkzeuge und technische Dokumentation |

Unter [ANLEITUNGEN/Paket](../ANLEITUNGEN/Paket/) liegen ausschließlich das aktuelle ZIP, drei Manifeste und die Prüfsumme. Das ist die einzige ZIP-Ablage; unter UPLOAD liegt nur der fertige Appordner. Frühere Pakete und zweite ZIP-Kopien werden nicht aufbewahrt.

## Technische Dateien

| Bereich | Inhalt |
| --- | --- |
| `src/backend/` | Gepflegte Backendmodule nach Fachzuständigkeit |
| `app/server/` | Erzeugte, bytegleiche Laufzeitkopien der Backendmodule |
| `app/www/` | Gepflegte Browseroberfläche; kein zweiter Frontend-Quellordner |
| `app/main.js` | Kurzer Laufzeiteinstieg über das Kompositionsmodul |
| `deployment/` | Bestätigtes Knuddels-Ziel ohne Passwort |
| `tests/` | Backend-, HTTP-, Browser- und Rhino-Prüfungen |
| `tools/` | Paketbau, Prüfungen und Vorschau-Server |
| `tools/preview/` | Startseite und Bridge ausschließlich für die lokale Vorschau |
| `references/api/` | Unveränderte Knuddels-/K3-API-Dateien; Dokumentation, niemals ausführen |
| `node_modules/` | Installierte Entwicklungsabhängigkeiten für lokale Browserprüfungen |
| `package.json`, `pnpm-lock.yaml` | Befehle und reproduzierbar festgelegte Abhängigkeiten |
| `AGENTS.md` | Verbindliche fachliche Regeln und Prüfabläufe |

`src/backend/`, `app/server/` und `UPLOAD/MischWerk/server/` haben unterschiedliche Aufgaben: Quelle, geprüfte Laufzeitfassung und fertige Auslieferung. Diese Kopien werden vom Build benötigt.

## Dokumentation nach Thema

- [Architektur und Zustandsbesitz](docs/architektur/ARCHITEKTUR.md), [Frontendmodule](docs/architektur/ARCHITEKTUR-FRONTEND.md), [Design](docs/architektur/DESIGN.md).
- [API-Nachweis](docs/api/API-NACHWEIS.md), [API-/Wiki-Abgleich und Rhino-Wunschfehler](docs/api/API-WIKI-ABGLEICH.md).
- [Betrieb und Datenhaltung](docs/betrieb/INBETRIEBNAHME.md), [echte LIVE-Abnahme](docs/betrieb/LIVE-ABNAHME.md), [Sendeplan](docs/betrieb/SENDEPLAN.md), [Lautstärke](docs/betrieb/LAUTSTAERKE.md).
- [Aktueller Prüfbericht](docs/pruefung/PRUEFBERICHT.md). Die datierten technischen Anbieterprüfungen bleiben unter `docs/pruefung/radioking/`; alte Oberflächenbilder und Designreferenzen wurden auf Nutzerwunsch entfernt.

Prüfbericht und technische Nachweise werden an festen Pfaden aktualisiert. Die RadioKing-Wiedergabeprüfung und der Rhino-Fehlernachweis dokumentieren eigenständige Ergebnisse mit Datum und damaliger Version. Screenshots nur bei Bedarf erzeugen und keine alten Bildsammlungen ansammeln.

## Lokale Befehle

Alle Befehle aus `PROJEKT/` ausführen. Benötigt werden Node.js ab Version 20, pnpm 11 und Microsoft Edge.

```text
pnpm install --frozen-lockfile
node tools/preview.cjs
```

Vorschau im Browser: `http://127.0.0.1:8765`. Sie verwendet lokale Knuddels-Ersatzobjekte und verbindet sich nicht mit dem echten Radiosender.

```text
node tools/build-backend.cjs
pnpm test
pnpm run check
pnpm run test:browser
pnpm run check:rhino
node tools/build-install.cjs
node tools/check-package.cjs
```

Rhino benötigt Java 11+; bei Bedarf über `MISCHWERK_JAVA` konfigurieren und die geprüften JARs einmal mit `node tools/check-rhino.cjs --download` im Temp-Cache bereitstellen. Eine externe Playwright-Installation kann über `MISCHWERK_PLAYWRIGHT` verwendet werden.

Der Paketbau schreibt nur nach `../UPLOAD/MischWerk/` und `../ANLEITUNGEN/Paket/`. Er lädt nichts hoch. Der ausdrückliche Netzwerktest `node tools/radioking-compatibility-check.cjs` prüft den eigenen RadioKing-Sender und ersetzt den letzten Anbieterbericht unter `docs/pruefung/radioking/anbindung-aktuell.json`. Version und Zeitpunkt stehen im Bericht.

Radio-Team → Statuszentrale: Übertragung, Live-/AutoDJ-Titelstatus, getrennte ON-AIR-Anmeldung, Hörerzahl, Titelabruf, App-Verbindung, Wunschbox, offene Musikwünsche und Thema. Nur für den Channelinhaber; sichtbare Zentrale aktualisiert nach Abschluss alle 30 s, nach Fehlern nach 60 s. Live-/AutoDJ folgt der RadioKing-Titelmeldung und ist kein separater Encoder-Verbindungstest.

Seit 0.1.90: kompakte Statusübersicht in drei beziehungsweise zwei Spalten. Alle Statuswerte sofort sichtbar; vollständige Erklärungen, Titel-/Themenangaben und Prüfzeiten unter „Details & Prüfzeiten“. Funktionen und automatische Aktualisierung unverändert.

Seit 0.1.91: Statuspunkte direkt vor den Werten statt farbiger Kartenränder. Grün für bestätigte nutzbare/aktive Zustände, Rot für Fehler/gestoppte Übertragung, neutral für unbekannt/inaktiv.

Seit 0.1.93 stehen Aktualisierungsintervalle unter Details & Prüfzeiten. Der Button zeigt beim Abruf „Prüfe …“. Die Hauptübersicht bleibt auf Statuswerte konzentriert.

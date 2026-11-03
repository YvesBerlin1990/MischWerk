# MischWerk – technische Übersicht

Lokaler Appstand **0.1.146** mit Tageshistorie ausschließlich für den Channelinhaber und ernannte Radiomoderatoren unter **Moderation → Heute gespielt**: verfügbare heutige Titelmeldungen ohne die bekannten Senderjingles, mit Senderuhrzeit und passenden Seiten ohne Scrollen in deutscher Ortszeit, neueste zuerst. Öffentlicher SPCast-Stream, Titelquelle, Übertragungsstatus und Sendemodus bleiben erhalten. MischWerk übernimmt erscheint ausschließlich bei bestätigtem AutoDJ; bestätigtes LIVE zeigt die Live-Kapsel und den im Studio angemeldeten Moderatornamen. Bestätigter Sendestopp sperrt Play; Wiederanlauf gibt Play ohne Autostart frei. Alle Zusatzbereiche behalten ihre gemeinsame Overlay-Sitzung mit abgeschalteter nativer Ladeansicht. Die wieder laufende LIVE-Version 0.1.132 bleibt unverändert. Die Hörerzahl ist vorerst vollständig entfernt. Normale Hörer sehen in der freien rechten Spalte der breiten Leiste das freigegebene Radio-Logo. Die Radioleiste nutzt die volle Breite ohne äußere Seitenränder. Verbindliche Regeln stehen ausschließlich in [AGENTS.md](AGENTS.md).

## Zuständigkeiten der Ordner

| Ablage | Aufgabe |
| --- | --- |
| app/www/ | Gepflegte Browseroberfläche, Original-Logo und eigene Werbe-MP3 |
| medien/logos/ und medien/mychannel/ | Zusätzliche Original-Logos und Hintergrundbild für den Knuddels-MyChannel |
| src/backend/ | 31 gepflegte ES5/Rhino-Backendmodule |
| app/server/ und app/main.js | Vom Backendbuild erzeugte Laufzeitkopien und kurzer Einstieg |
| C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/ | Ausschließlich die 101 fertig geprüften Laufzeitdateien für Knuddels |
| deployment/live.json | Bestätigtes Ziel und absoluter lokaler Uploadpfad; keine Passwörter |
| deployment/manifests/ | Fünf Dateinachweise mit Inventar, Bytezahlen und SHA-256 |
| tools/build/ | backend.cjs erzeugt Laufzeitmodule; prepare-upload.cjs prüft und aktualisiert den Desktop-Upload |
| tools/checks/ | project, architecture, lengths, upload, delivery, rhino und streampanel prüfen ihre jeweiligen Bereiche |
| tools/lib/ | Gemeinsames Browserinventar mit ansichtsabhängigen Ladeplänen |
| tools/preview/ | server.cjs, Vorschauseite und Bridge ausschließlich für die lokale Entwicklung |
| tools/emulator/ | Strenges lokales Testlabor mit echtem Appcode, getrennten Plattformmodellen und Fehlerkonsole |
| tests/node/ | Backend, Providerfeldzuordnung, HTTP-Vorschau, Kalender, Übergabe und Uploadintegrität |
| tests/browser/ | Playwright-/Edge-Abläufe für Oberfläche, Sendeplan und Übergabe |
| tests/fixtures/ | Lokaler Testton und synthetische öffentliche Anbieterantworten |
| tests/support/ | Knuddels-Ersatzobjekte; werden nicht ausgeliefert |
| tests/rhino/ | Wunsch-/Kalender-/Studioabläufe für die echten Rhino-Engines |
| docs/architektur/ | Architektur, Frontend und Gestaltung |
| docs/api/ | Schnittstellennachweise; nachweise/radioking enthält ausschließlich datierte ehemalige Anbieterbefunde |
| docs/betrieb/ | Gemeinsame Installation und STREAMPANEL-Einrichtung, echte LIVE-Abnahme, Sendeplan und Lautstärke |
| docs/pruefung/ | Ein aktueller Prüfbericht und die darin verwendeten aktuellen Appbilder unter oberflaeche/ |
| references/api/ | Zwei unveränderte offizielle Dokumentationsstubs, niemals als Appcode laden |

Die 31 gleichen Backenddateien sind beabsichtigt: src/backend ist die Quelle, app/server die geprüfte Laufzeit und der Desktop-UPLOAD die Auslieferung. Keine dieser notwendigen Kopien ist ein Archiv. app/www besitzt keinen zweiten Frontendquellordner. Git-Metadaten, package.json, pnpm-lock.yaml und node_modules gehören zur Entwicklungsumgebung und bleiben erhalten.

## Logos und MyChannel-Hintergrund

Die drei vom Desktop übernommenen Bilddateien liegen gemeinsam unter [medien/](medien/). Bildinhalt, Dateiformate und Auflösungen sind unverändert; die PNG-Logodatei mit dem bisherigen generierten exec-Dateinamen hat einen verständlichen Namen erhalten.

| Datei | Auflösung |
| --- | --- |
| [Logo als JPG](medien/logos/MischWerk-RadioKing-Logo.jpg) | 1254 × 1254 px |
| [Logo als PNG](medien/logos/MischWerk-Logo-1254x1254.png) | 1254 × 1254 px |
| [Knuddels-MyChannel-Hintergrund](medien/mychannel/Hintergrund_MischWerk_Knuddels.png) | 1610 × 977 px |

Diese Medienablage gehört zum Projekt. Das bereits verwendete App-Logo bleibt unter app/www/img/; die zusätzlichen Bilder werden nicht automatisch mit der UserApp ausgeliefert.

## Befehle aus PROJEKT/

| Befehl | Zweck |
| --- | --- |
| pnpm run preview | Lokale Vorschau auf http://127.0.0.1:8765; keine echte Sender-/Knuddels-Verbindung |
| pnpm run emulator | Interaktives Testlabor auf http://127.0.0.1:8776 |
| pnpm run test:emulator | Echte Rhino-Projektprüfungen sowie automatische Emulator- und Browserfälle |
| pnpm run build:backend | Quellen nach app/server kopieren und main.js erzeugen |
| pnpm run check:backend | Quell-/Laufzeitgleichheit prüfen |
| pnpm test | Alle Node-Prüfungen |
| pnpm run test:browser | Alle Browserprüfungen mit Edge |
| pnpm run check | Syntax, Plattformsignaturen, Komponenten, UI-IDs und Laufzeitinventar |
| pnpm run check:rhino | Rhino 1.7.7.2 und 1.9.1 |
| pnpm run check:lengths | Alle Laufzeittexte strikt unter 9500 Zeichen |
| pnpm run prepare:upload | Vollständige Prüfungen und ausschließliche Desktop-Bereitstellung ohne ZIP |
| pnpm run check:upload | Quellen, tatsächlichen Desktop-Upload und Dateimanifeste abgleichen |
| pnpm run check:delivery --base-url URL/ | Ausdrücklich gewählte öffentliche HTML-/JS-/CSS-Auslieferung lesend mit lokalen SHA-256 vergleichen |
| node tools/checks/streampanel.cjs | Lesende Anbieterprüfung; ohne öffentliche Produktdaten ausstehend bei null Netzabrufen |

Der bisherige npm-Befehl build:live bleibt als Alias für dieselbe Uploadbereitstellung erhalten. Direkte Einstiegspunkte liegen unter tools/build/, tools/checks/ und tools/preview/server.cjs. Die alten flachen Werkzeugpfade entfallen vollständig.

Voraussetzungen: Node.js ab 20, pnpm 11.25.0, Edge und Java 11+. Abhängigkeiten mit pnpm install --frozen-lockfile einrichten. Einmalig geprüfte Rhino-JARs mit node tools/checks/rhino.cjs --download im Temp-Cache bereitstellen. MISCHWERK_JAVA kann auf Java zeigen; MISCHWERK_PLAYWRIGHT auf eine externe Playwright-Installation und MISCHWERK_PREVIEW_PORT auf einen anderen lokalen Port.

Optionale Bildaufnahmen aus Browserprüfungen landen unter dem System-Tempordner/MischWerk-Pruefbilder und erzeugen keine weiteren Bildsammlungen im Projekt. Dauerhaft behalten werden nur tatsächlich verwendete aktuelle Berichtsbilder.

## App im Testlabor prüfen

Das Testlabor ist vollständig in diesem Projekt eingebaut. Für künftige Codex-Arbeiten genügt der MischWerk-Hauptordner; der Zugang ist über die dortige AGENTS.md und den zentralen Abschnitt „Codex-Zugriff auf den integrierten Emulator“ festgehalten. Vom Hauptordner startet **pnpm --dir PROJEKT run emulator** ohne weiteren App-/Emulatorpfad. Die ursprüngliche Desktop-ZIP und frühere Entpackordner werden dafür nicht benötigt.

Aus PROJEKT/ mit **pnpm run emulator** starten und **http://127.0.0.1:8776** öffnen. Alternativ [Start-Testlabor.ps1](tools/emulator/Start-Testlabor.ps1) ausführen; -Port bzw. MISCHWERK_EMULATOR_PORT wählt einen anderen lokalen Port. Strg+C beendet den Server.

Otterchen ist im Testprofil Channelinhaber. Weitere Fenster mit anderen Testnutzern teilen dasselbe echte Appbackend. AppManager, AppDeveloper, Channelmoderator und Hörer bleiben getrennte Rollen; DJ-Test erst über das echte Radio-Team ernennen. Der eigene MyChannel-Hintergrund wird im getrennten Channelbereich gezeigt.

Die Konsole bietet tatsächliche Framebreiten von 320 bis 3840 px, normale/ignorierte/verzögerte/schrittweise Größenantworten, Knuddels-Parsermodus und einen zusätzlichen Async-Stresstest. JS/CSS/Bilder lassen sich verzögern oder gezielt ausfallen lassen. Client- und Serverereignisse getrennt verzögern; mit Filtern etwa nur mw:wish.submit doppeln oder mw:wish.receipt verlieren. Speicherfehler, Rollenentzug, fehlende Overlayfähigkeit, Nutzerlöschung, Verbindungsabbruch, Appneustart und serverseitige Zeitsprünge ergänzen die Prüfung.

Synthetische Anbieterfälle liefern ausschließlich lokale JSON-Antworten und einen generierten Testton. Der Ton startet nur über Play in der App. Der Originalzustand ohne freigeschalteten Anbieter bleibt als eigenes Profil erhalten. Die Appdateien und der Upload werden nicht bearbeitet.

Ein laufender Test hält seinen Appstand im Speicher fest und meldet externe Quelländerungen. Ein ausdrücklicher lokaler Appneustart übernimmt sie; das verhindert gemischte Backend-/Browserstände. Dauerhafte Testzustände liegen unter dem System-Tempordner/MischWerk-Emulator/testdaten; „Testdaten zurücksetzen“ löscht ausschließlich diese lokalen Zustände. Ein normaler Appneustart erhält sie und leert die flüchtige Wunschqueue.

„Layout prüfen“ erfasst Framebreite, horizontale Überbreite, zu kleine Buttons und Fokus. Ereignisse, Fehlerprofile, Quellhash, Appversion und echte Rhino-Ergebnisse können als JSON exportiert werden. Die [integrierte Bedienhilfe](tools/emulator/www/help.html) beschreibt typische Prüfschritte und Grenzen. **pnpm run test:emulator** führt die vorhandenen Backendprüfungen in Rhino 1.7.7.2/1.9.1 sowie die eigenen Laufzeit-, Protokoll- und Browserfälle aus. Benötigt werden installierte Entwicklungsabhängigkeiten, Edge und die bereits beschriebenen Java-/Rhino-Voraussetzungen.

Die Node-VM simuliert die benötigte Knuddels-API. Fehlende API-Funktionen werden gemeldet. Mobile Profile bleiben Browsermodelle; native Clientgeometrie, Betriebssysteme und der echte STREAMPANEL-Anschluss benötigen weiterhin ihre eigene Abnahme.

## Bereitstellung und Dokumentation

Auch aus einem Codex-Worktree wird ausschließlich C:/Users/Yves/Desktop/MischWerk/UPLOAD aktualisiert. Die fünf Manifeste unter deployment/manifests werden im Arbeits- und Desktopprojekt identisch gehalten. Keine zweite Uploadkopie, ZIP oder Sicherungssammlung. Ein Build veröffentlicht und startet nichts neu.

[Installation, Betrieb und STREAMPANEL](docs/betrieb/INBETRIEBNAHME.md) · [LIVE-Abnahme](docs/betrieb/LIVE-ABNAHME.md) · [Architektur](docs/architektur/ARCHITEKTUR.md) · [Frontend](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [API-Nachweis](docs/api/API-NACHWEIS.md) · [Prüfbericht](docs/pruefung/PRUEFBERICHT.md).

Moderation seit 0.1.118: manuelle Wunschregie, lesender Sendungsassistent mit Sendeplanzeiten und private Übergabenotizen. [Bedienung](docs/betrieb/INBETRIEBNAHME.md#moderation-verwenden). Neuer Nachweis manifest-studio.json trennt Studiooberfläche von gemeinsamen Browserdateien; kein zusätzliches Uploadziel.

Radio-Team und Statuszentrale verwenden seit 0.1.119 eine gemeinsame natürliche Fensterhöhe. Das Umschalten verändert weder Kopf noch Reiterposition; beide Ansichten bleiben getrennt bedienbar.

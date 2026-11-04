# MischWerk – technische Übersicht

Aktueller lokaler Stand **0.1.202 · Build 202**. Der äußerste Hintergrund der Appleiste entspricht mit **#0F1114 (RGB 15, 17, 20)** der dominierenden Grundfarbe am oberen Rand des vorhandenen Channelbilds medien/mychannel/Hintergrund_MischWerk_Knuddels.png. Radio-HTML, Body und äußerer Leistenuntergrund verwenden dieselbe Canvas-Farbe bereits beim frühen HTML-Aufbau. Die Playerkarte bleibt #141414, Overlays und native Ladefarben bleiben unverändert. Platzverteilung 201, Originalbild/-Logos, Controller und Funktionen erhalten. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Live-Aktion.

Platzverteilung aus 201: Die Appleiste verteilt die Mitte ab 1200 px proportional auf Musik/Lautstärke, Thema/Sendestatus und gegebenenfalls den eigenen Wunsch. Ohne Wunsch nutzen die zwei übrigen Informationsbereiche den Platz. Gemeinsame Oberkante, ruhige Trennlinien, passende Innenabstände, eine bis 440 px nutzbare Lautstärkegruppe und ein an der Übergangsbreite angepasster 20–24-px-Titel ersetzen die überbreite Musikspalte mit rechts zusammengedrängten Informationen. Die schmalen Raster unter 1200 px, sämtliche Controller, Fachlogik, Audio und Overlaygestaltung bleiben unverändert. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Live-Aktion.

Versionsstand 200: Ausschließlich Versions- und Buildkennung gegenüber 199 erhöht; Gestaltung und Funktionen sind bytegleich erhalten. Backendkonfiguration, App-Konfiguration, Einstieg und alle fünf Manifeste tragen dieselbe neue Kennung. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal neu bereitgestellt; keine Live-Aktion. Die nachfolgenden Gestaltungs-/Browsernachweise stammen aus dem unveränderten Stand 199.

Unverändert aus Build 199: Die bestätigten ZIP-Designs sind in der gewünschten Reihenfolge übernommen: Appleiste nach B · Vinyl Deck, anschließend Moderation, Verwaltung, Wunschbox und Sendeplan nach MischWerk_Alle_Menues. Schwarze Flächen, silberne Aktionen, statisches Vinylmotiv und lokal geladene Outfit-/Fraunces-Schriften bilden die gemeinsame Gestaltung. Sämtliche Menüüberschriften sind mittig; die Original-Logos stehen links vor dem ruhigen Kopfzeilenhintergrund ohne abgesetzte schwarze Kachel, das Vinylmotiv rechts und das X bleibt rechts bedienbar. Responsive Appleiste mit direktem Zugriff auf öffentliche und berechtigte private Aktionen, lange Informationen im vorhandenen nativen Lesebereich. Rollen, private Wunschinformation, Entwürfe, Chronologie 197/198, Event-/Sitzungskorrektur und Startabsicherung sind erhalten. **106 Laufzeitdateien, 100 Texte, 31 Backendmodule, 73 Browserdateien, 44 Komponenten, 17 Stylesheets, fünf Manifeste.** Ausschließlich fester Desktop-UPLOAD; keine Live-Aktion.

Erhalten aus Build 198: Die Seitenzählung in Heute gespielt folgt ebenfalls der Zeit: älteste Titel auf Seite 1, neueste auf der letzten Seite. Beim Öffnen werden weiterhin die neuesten Titel auf der letzten Seite gezeigt. Zurück verringert die Seitenzahl, Weiter erhöht sie. Internen Cursor, Sortierung, Navigation und Seitenanker erhalten; ausschließlich die sichtbare Zahl ist angepasst. Frühere Wunsch-, Start-, Event-/Sitzungs- und Audiokorrekturen bleiben erhalten. Nur lokal bereitgestellt, weiterhin 102 Laufzeitdateien; keine Live-Aktion.

Build 197: In Heute gespielt folgt die Navigation der Uhrzeit: Zurück zeigt ältere Titel, Weiter neuere. Auf der neuesten Seite ist Weiter gesperrt, auf der ältesten Zurück. Die neuesten Titel stehen weiterhin oben; Seitennummerierung, Textfortsetzungen und Gestaltung bleiben erhalten. Wunschübersichtsentfernung, Event-/Sitzungskorrektur und Startabsicherung bleiben erhalten. Ausschließlich lokal bereitgestellt, unverändert 102 Laufzeitdateien; keine Live-Aktion.

Build 196: Die doppelte Rubrik Deine offenen Wünsche entfällt vollständig aus der Wunschbox samt Aktualisieren, Liste und Seitennavigation. Nach Abgabe bleiben die kurze Fünf-Sekunden-Bestätigung und Weiteren Wunsch eingeben; Titel, Platz und Bearbeitungsstatus stehen ausschließlich im vorhandenen privaten Wunschbereich der Appleiste. Eingabe, Entwürfe, Fokus, Versand, Radioaudio und natürliche Wunschhöhe bleiben erhalten. Event-/Sitzungskorrektur aus 194 und Startabsicherung aus 195 sind erhalten. Ausschließlich lokale Bereitstellung mit 102 Laufzeitdateien; keine Live-Aktion.

Build 195: Die leere Appleiste direkt nach Beitritt/Aktualisierung ist auf einen öffentlich nachgewiesenen Auslieferungsmischstand zurückgeführt: Ladeplan aktuell, 13 Frontenddateien älter und drei benötigte Dateien nicht vorhanden. Startfehler werden bereits vor der ersten SDK-Dateieinbindung abgesichert und bei fehlenden Pflichtdateien sofort sichtbar gemeldet. Vollständiger Desktop-UPLOAD mit 103 Laufzeitdateien lokal bereitgestellt; die Event-/Sitzungskorrektur aus Build 194 bleibt erhalten. Keine Live-Aktivierung oder Übertragung ausgeführt.

Build 194: Wunschbox-Abgleich gegen das gemeldete Eventlimit korrigiert: Entwürfe lokal sofort anzeigen, Serverabgleich bündeln und identische Rückmeldungen unterdrücken. Vor Schließen/Absenden/Overlaywechsel wird die letzte Eingabe übertragen. Sitzungen werden nur noch aktuell und höchstens einmal geschlossen, auch bei verzögertem Close-Listener und neuen Plattformwrappern. Ausschließlich lokale Bereitstellung; die vorübergehend abgeschaltete Knuddels-App wird nicht automatisch aktiviert oder aktualisiert.

Build 193: Der vorhandene Bereich Dein Wunsch in der Appleiste zeigt Platz, nächsten eigenen Songtitel und Bearbeitungsstatus, bei mehreren Wünschen ergänzt um einen kleinen Zähler. Am Wunschbox-Button entstehen keine Zusatzangaben. Die Detailansicht ordnet Platz/Status über dem vollständigen Titel; der zusätzliche Moderationshinweis entfällt. Erfolgsfeedback verschwindet nach fünf Sekunden, Fehler und laufender Versand bleiben sichtbar.

Build 192: Der Menüpunkt heißt jetzt Verwaltung, einschließlich Tooltip, Screenreaderbeschriftung, frühem und fertigem Dialogtitel sowie nativem Fenstertitel. Überschrift und Leitspruch stehen mittig in der Kopfkarte, Logo links und Schließen-X rechts. Funktionen und Berechtigungen der Teamverwaltung bleiben erhalten.

Build 191: Vollständig leere Wochen verteilen den verfügbaren unteren Platz gleichmäßig auf ihre sieben Tageszeilen. Bestehende Mindesthöhe, Schrift und Kalenderfunktionen bleiben erhalten. Gefüllte Wochen, Pagination und Editor behalten ihre natürliche Anordnung; keine neue Fenstersteuerung.

Build 190: Die Statuszentrale ist vollständig entfernt: Anzeige, Reiter, Prüftaste, Detailseiten und eigene Anbieterabfragen. Radio-Team öffnet direkt die Mitgliederverwaltung. Ernennen/Entziehen, Aktualisieren, Rechte, Entwürfe und feste native Maße bleiben erhalten. Die unabhängige Anbieterprüfung und Wiedergabe der Radioleiste bleiben unverändert.

Build 189 entfernt „Deine Sendezeiten“ vollständig aus der Moderation, einschließlich Kalenderabruf, Aktualisieren und eigenem Modul. Die natürliche Fensterhöhe richtet sich nach den verbleibenden Bediengruppen. Öffentlicher Sendeplan und gespeicherte Termine bleiben erhalten.

Build 188 zentriert Moderation und Leitspruch in der gesamten Kopfkarte. Das Original-Logo bleibt links, das Schließen-X rechts mit 44-px-Bedienfläche. Normale und kompakte Ansicht sowie früher HTML-Kopf sind berücksichtigt; Studiofunktionen, natürliche Höhe und andere Overlays bleiben erhalten.

Build 187 zentriert Sendeplan und Leitspruch in der gesamten Kopfkarte. Das Original-Logo bleibt links, das Schließen-X rechts. Die Ausrichtung gilt bereits für den frühen HTML-Kopf; Kalender, Anfangsmaße, Funktionen und andere Overlays bleiben erhalten.

Build 186 zentriert die Wunschbox-Kopfüberschrift als „MischWerk Wunschbox“ über die gesamte Kopfbreite. Der Schließen-Button bleibt rechts; schmal kann der Titel auf zwei Zeilen umbrechen. Flaches Formular, native Anfangshöhe und Wunsch-/Audiofunktionen bleiben erhalten.

Build 185 entfernt die zusätzliche Kartenfläche um das Wunschformular. Das Formular bleibt funktional erhalten; Textfeld und Sendebutton nutzen die volle Inhaltsbreite. Die eigene Textfeldumrandung bleibt bestehen, das Textfeld erhält mehr Platz. Native Anfangsgröße, Versand, Entwürfe und Quittungen sind unverändert.

Build 184 fasst die Lautstärkebedienung zusammen: Lautstärke steht vor der Stummschalttaste, die jetzt direkt neben dem Regler liegt. Abstände regulär 6 px, kompakt weiterhin 4 px. Native 44-px-Bedienflächen, Prozentfeld, Warnung und sämtliche Audiocontroller bleiben erhalten.

Build 183 vergrößert Schrift und Symbole der öffentlichen Buttons Sendeplan/Wunschbox auf 16/22 px. Schmale Ansichten verwenden passende 14/20 px; begrenzte Verwaltungsrahmen bleiben bedienbar. Die Buttonhöhe bleibt 44 px, einschließlich deaktivierter Wunschbox. Alle Browsercontroller und Audiofunktionen sind unverändert.

Seit Build 182 gilt die Änderung: Dieser Stand ändert die AutoDJ-Beschriftung in „MischWerk am Pult“. Die vorhandene Moderations-/Sendemodusprüfung, Gestaltung und Wiedergabe einschließlich Heartbeat bleiben erhalten.

Build 181 ergänzt einen an tatsächlichen Audiofortschritt gebundenen Wiedergabe-Heartbeat in der Radioleiste: alle drei Minuten /confirm über die dokumentierte Client.executeSlashCommand-Methode, erst nach passender frischer mw:refresh-Antwort. Stop, Pause, Nachladen, Fehler, Seitenende und fehlende Verbindung sperren weitere Aufrufe. Im Hintergrund bleibt der bestehende Channel-Leseweg nur bei laufendem Radio aktiv. Gestaltung, vier getrennte Overlays, Rollen, Entwürfe und Wunschtransport bleiben erhalten. Der aktuelle öffentliche OR-Radio-Player belegt diesen Ansatz; eine echte native MischWerk-Timeoutabnahme steht weiterhin aus.

Reine Versionsfortschreibung auf 0.1.181 / Build 181. Funktionen und Oberfläche entsprechen unverändert dem geprüften Stand 179.

Build 179 nutzt den freien unteren Sendeplanbereich für besser lesbare Tageszeilen: Wochentag 16 px, Datum und Leerhinweis 14 px, Tageszahl 26 px; vollständig leere Wochen nutzen mindestens 50 px hohe Zeilen. Bei vorhandenen Sendungen werden leere Zwischenzeilen kompakter ab 40 px gehalten. Im breiten 820-×-630-Rahmen bleiben alle sieben leeren Tage auf einer Seite; der freie Unterrand sinkt lokal von 118 auf 17 px. An der Oberfläche ausschließlich schedule.css geändert; Farben, vollständige Sendungsinhalte, Pagination, Editor, Rechte und alle JavaScriptmodule bleiben erhalten. Keine neue Hostgrößensteuerung.


Themenbearbeitung in Build 178: Eingabe, Zähler, Speichern, Fehler, Bestätigung und Verwerfen behalten feste Feld-/Button-/Folgeabschnittsmaße. Hilfe und Rückmeldung teilen einen festen Statusplatz; Verwerfen wird ohne Layoutänderung sichtbar. Bei diesen Vorgängen erfolgt kein neuer Hostgrößenauftrag. Eine schon sichtbare Studio-Statusmeldung behält während der Themenbearbeitung ihren Platz auch nach ihrem regulären Ausblenden; bewusste Bereichs-/Steuerungswechsel geben ihn frei. Die bestätigte automatische Verkürzung bei anderen Inhalts- und Reiterwechseln bleibt erhalten.

Seit Build 178 passt studio/window ausschließlich die vorhandene Moderationsfensterhöhe an den vollständigen Inhalt an. Die anfangs verfügbare Clienthöhe bleibt die feste Obergrenze. Leere Sendezeiten, wenige Wünsche und kurze Historienlisten hinterlassen keine große untere Leerreserve; mehr Inhalt wächst innerhalb dieser Grenze und bleibt danach paginiert. Die Senderzeit-Fußzeile der Historie entfällt. Ihre tatsächlichen Zeitstempel und Berliner Tagesregeln bleiben erhalten. Größenabhängige Kompaktgestaltung richtet sich nach der anfänglichen Clientgrenze, damit die eigene Verkürzung keine weitere Schrumpfkaskade auslöst. Andere Overlays und die Radioleiste sind davon unabhängig.

/update meldet knapp das Ergebnis: keine neuen Dateien mit laufender Version, vorgemerkter Neustart mit tatsächlicher Zeitschätzung oder ein klarer Bedien-/Fehlerhinweis. Die Updatebedingungen und Appmanagerrechte bleiben erhalten.

Vorhang ausschließlich per Chat: /vorhang öffnen und /vorhang schließen. Der bisherige Button, sein Binding und seine Styles entfallen; Inhaberprüfung, globale Speicherung, Hörerausnahmen, Fokus, Werbung und Audio bleiben erhalten.

Lokaler Appstand **0.1.178 · Build 178**: drei Moderationsreiter, eine zusammenhängende Sendesteuerung, kompakte Wunschliste, eigene geplante Sendezeiten und eine flächennutzende Tageshistorie. Der Sendungsassistent entfällt. Sendeplan, Rollen, Wunschversand, Radioaudio und native Overlayarchitektur bleiben erhalten. Der bekannte weiße STAPP-Erstöffnungsblitz ist damit nicht neu behoben. Aktuelle Bilder und Prüfungen stehen im [Prüfbericht](docs/pruefung/PRUEFBERICHT.md); Regeln ausschließlich in [AGENTS.md](AGENTS.md).


## Zuständigkeiten der Ordner

| Ablage | Aufgabe |
| --- | --- |
| app/www/ | Gepflegte Browseroberfläche, Original-Logo und eigene Werbe-MP3 |
| medien/logos/ und medien/mychannel/ | Zusätzliche Original-Logos und Hintergrundbild für den Knuddels-MyChannel |
| src/backend/ | 30 gepflegte ES5/Rhino-Backendmodule |
| app/server/ und app/main.js | Vom Backendbuild erzeugte Laufzeitkopien und kurzer Einstieg |
| C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/ | Ausschließlich die 103 fertig geprüften Laufzeitdateien für Knuddels |
| deployment/live.json | Bestätigtes Ziel und absoluter lokaler Uploadpfad; keine Passwörter |
| deployment/manifests/ | Fünf Dateinachweise mit Inventar, Bytezahlen und SHA-256 |
| tools/build/ | backend.cjs erzeugt Laufzeitmodule; prepare-upload.cjs prüft und aktualisiert den Desktop-Upload |
| tools/checks/ | project, architecture, lengths, upload, delivery, rhino und streampanel prüfen ihre jeweiligen Bereiche |
| tools/lib/ | Gemeinsames Browserinventar mit ansichtsabhängigen Ladeplänen |
| website/ | Pausierter eigenständiger Websiteentwurf mit eigenen Abhängigkeiten und Prüfungen |
| tools/preview/ | Ausschließlich lokale Testvorschau der Knuddels-App und deren Bridge |
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

Die 30 gleichen Backenddateien sind beabsichtigt: src/backend ist die Quelle, app/server die geprüfte Laufzeit und der Desktop-UPLOAD die Auslieferung. Keine dieser notwendigen Kopien ist ein Archiv. app/www besitzt keinen zweiten Frontendquellordner. Git-Metadaten, package.json, pnpm-lock.yaml und node_modules gehören zur Entwicklungsumgebung und bleiben erhalten.

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
| pnpm run preview | Lokale Knuddels-App-Testvorschau auf http://127.0.0.1:8765 |
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

## Website – pausiert

Der eigenständige Entwurf ist vollständig unter [website/](website/README.md) abgelegt. Websiteprozesse, Mailversand und Appanbindung sind gestoppt. Die normale App-Prüfkette und UPLOAD enthalten keine Website. pnpm run preview startet ausschließlich die lokale Knuddels-App-Testvorschau.

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

Auch aus einem Codex-Worktree wird ausschließlich C:/Users/Yves/Desktop/MischWerk/UPLOAD aktualisiert. Die fünf Manifeste unter deployment/manifests werden im Arbeits- und Desktopprojekt identisch gehalten. Keine zweite Uploadkopie, ZIP oder Sicherungssammlung. Ein Build veröffentlicht und startet nichts neu. Die gemeinsame Version und Buildnummer stehen in package.json; tools/lib/release-identity.cjs prüft sie gegen Konfiguration und Dateimanifeste. app.config führt den Build als Kommentar. Der interne Startlog enthält beide Kennungen; ein unveränderter erneuter Build erhöht keine Nummer.

[Installation, Betrieb und STREAMPANEL](docs/betrieb/INBETRIEBNAHME.md) · [LIVE-Abnahme](docs/betrieb/LIVE-ABNAHME.md) · [Architektur](docs/architektur/ARCHITEKTUR.md) · [Frontend](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [API-Nachweis](docs/api/API-NACHWEIS.md) · [Prüfbericht](docs/pruefung/PRUEFBERICHT.md).

Moderation seit 0.1.177: Deine Sendung, Musikwünsche und Heute gespielt, manuelle Wunschregie und private Übergabenotizen. [Bedienung](docs/betrieb/INBETRIEBNAHME.md#moderation-verwenden). manifest-studio.json trennt die Studioauslieferung von gemeinsamen Browserdateien.

Verwaltung öffnet unmittelbar die Mitgliederverwaltung im festen nativen Rahmen von 560 × 630 px. Längere Mitgliederlisten bleiben scrollbar; eine Statusansicht und Reiternavigation gibt es nicht mehr.

Auslieferung ab Build 172: prepare-upload erzeugt kleine Bündel aus vollständigen, unveränderten Quellmodulen ausschließlich im festen Desktop-UPLOAD. Die Quelldateien unter app/www bleiben modular. bundled=true im Manifest und check:upload/check:delivery prüfen die reproduzierbaren tatsächlichen Auslieferungsbytes. Alle Dateien bleiben unter 9500 Zeichen. tools/checks/startup.cjs misst lokale Kaltstarts mit ausdrücklich gewähltem Appordner und optionaler Ressourcenverzögerung; dies ist keine echte Knuddels-Ladezeit.

Lesender Loadernachweis: node tools/checks/loader.cjs liest ausdrücklich den öffentlichen Knuddels-Lader und prüft seine isolierte Lade-Komponente in Edge, ohne Chat-/Bridge-Verbindung. Kein Bestandteil der normalen App- oder Paketprüfung.

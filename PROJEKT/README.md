# MischWerk – technische Übersicht

**App 0.1.239 · Build 239 · Website 0.2.0**, Stand 06.11.2026. Funktionen und aktuelle Bilder stehen in der [GitHub-Übersicht](../README.md); verbindliche Entwicklungsregeln ausschließlich in [AGENTS.md](AGENTS.md).

Die Übergabe erhält ihre ausgewählte Bediengruppe bei Größenwechseln, bleibt in sehr kleinen Rahmen scrollbar und verarbeitet verlorene Bestätigungen anhand des frischen Serverzustands. Otterchen erhält als tatsächlicher Channelinhaber automatisch Moderationszugang und Übergabeempfang; andere Nutzer benötigen ihren Radio-Team-Eintrag.

Sendeplan, Wunschbox und Moderation verwenden gemeinsame Tasten-/Symbolmaße, Beschriftungszeilen und gleichmäßige Abstände. Die Zusatzzeile Deaktiviert verschiebt keine Taste oder Hauptbeschriftung.

Schmale Radioansichten trennen Schallplatte, Musikangaben und Aktionen. Bei höchstens 420 px hoher Moderation scrollt der Wunschbereich mit vollständig erhaltenen Textseiten und Aktionen; die breite Radioansicht bleibt pixelgleich.

Der Glowabstand unter der Appleiste beträgt jetzt 16 statt 40 px; die native Anfangshöhe ist entsprechend 176 px. Der unveränderte RGB-Halo blendet bis auf die Hintergrundfarbe aus.

Die deaktivierte Wunschbox besitzt dieselbe Symbolgröße und Beschriftungshöhe wie Sendeplan; die Zusatzzeile Deaktiviert bleibt sichtbar.

Otterchen hat als tatsächlicher Channelinhaber automatisch alle bestehenden Apprechte, einschließlich sichtbarer Moderation und Übergabeempfang. Ein Radio-Team-Eintrag ist für ihn nicht erforderlich; andere Nutzer benötigen weiterhin die Ernennung unter Verwaltung. Ein optionaler eigener Eintrag kann ohne Verlust seiner Inhaberrechte entfernt werden.

Verwaltung ist aus der Appleiste entfernt. **/MW Verwaltung** öffnet das bestehende Fenster ausschließlich für den anwesenden Channelinhaber **Otterchen**. Radio-Team und Bot-Texte bleiben darin erreichbar.

Build 230 ergänzt eine getrennte private Betreiberansicht über `/mischwerk-relay einrichten`. Sie verwendet dokumentierte native User-/Session-Identitäten und speichert Sync-/optionale Relay-Schlüssel nur serverseitig. Vorhandene Werte werden nicht zurückgesendet; jede Speicherung setzt enabled/runtimeVerified auf false. Der tatsächliche native Einstellungsweg ist nach Installation noch abzunehmen. Build 229 bleibt der letzte durch den Nutzer bestätigte native Stand mit fehlerfreier Server-/Domainprüfung. [Einrichtung](docs/betrieb/INBETRIEBNAHME.md#private-android-einrichtung-ab-build-230) · [Nachweis](docs/api/API-NACHWEIS.md#private-betreibereinrichtung-230).

Der Appstand besteht aus **132 Laufzeitdateien, 125 Textdateien, 48 Backendmodulen, 80 Browser-/Mediendateien, zwei separaten Betreiberdateien, 49 bisherigen Frontendkomponenten und 18 Stylesheets**. Fünf Manifeste belegen die vollständige Auslieferung. Die Website bleibt ein eigenes Projekt außerhalb des Knuddels-UPLOAD.

`/mischwerk-relay pruefen` liest ausschließlich für den anwesenden Channelinhaber Serverinformationen und Domainrechte. Die Android-Vorbereitung verwendet dieselbe Queue, begrenzte technische Marker und den vereinbarten payload-String an Firebase Hosting. Geschützte Konfiguration, echte Hook-/HTTP-Abnahme und vollständiger Betrieb stehen aus. Oberfläche und Audio bleiben unverändert. Die zurückgekommene Dropbox-Revision 6 wurde nach dem Folgeauftrag gelesen; die bestätigten Knuddels-Ergebnisse und offenen Punkte sind in Revision 7 gespeichert und vollständig nachgelesen. [Vertrag](docs/api/API-NACHWEIS.md) · [Prüfstand](docs/pruefung/PRUEFBERICHT.md).

`radio/connection` besitzt allein Audioquelle, Hörwunsch und Wiederherstellung. Kurze Engpässe erhalten Verbindung und Puffer; echte Abbrüche werden bei bestehendem Hörwunsch erneut verbunden. Metadaten und Status steuern kein Audio. Der bestehende Heartbeat erhält seine Fälligkeit über Nachladephasen und bestätigt Aktivität nur bei geprüftem Audiofortschritt und frischer passender Channelantwort.

Die native Inaktivitätstrennung wurde am 05.11.2026 kontrolliert reproduziert. Build 223 behebt den lokalen Zählerfehler; seine native Langzeitabnahme steht noch aus. [Messungen](docs/pruefung/PRUEFBERICHT.md) · [Abnahmeplan](docs/betrieb/LIVE-ABNAHME.md).

## Zuständigkeiten der Ordner

| Ablage | Aufgabe |
| --- | --- |
| app/www/ | Gepflegte Browseroberfläche, Original-Logo und eigene Werbe-MP3 |
| medien/logos/ und medien/mychannel/ | Zusätzliche Original-Logos und Hintergrundbild für den Knuddels-MyChannel |
| src/backend/ | 48 gepflegte ES5/Rhino-Backendmodule |
| app/server/ und app/main.js | Vom Backendbuild erzeugte Laufzeitkopien und kurzer Einstieg |
| C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/ | Ausschließlich die 132 fertig geprüften Laufzeitdateien für Knuddels |
| deployment/live.json | Bestätigtes Ziel und absoluter lokaler Uploadpfad; keine Passwörter |
| deployment/manifests/ | Fünf Dateinachweise mit Inventar, Bytezahlen und SHA-256 |
| tools/build/ | backend.cjs erzeugt Laufzeitmodule; prepare-upload.cjs prüft und aktualisiert den Desktop-Upload |
| tools/checks/ | project, architecture, lengths, upload, delivery, rhino und streampanel prüfen ihre jeweiligen Bereiche |
| tools/lib/ | Gemeinsames Browserinventar mit ansichtsabhängigen Ladeplänen |
| website/ | Eigenständige Homepage und geschützter Arbeitsbereich mit eigenen Abhängigkeiten und Prüfungen |
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

Die 48 gleichen Backenddateien sind beabsichtigt: src/backend ist die Quelle, app/server die geprüfte Laufzeit und der Desktop-UPLOAD die Auslieferung. Keine dieser notwendigen Kopien ist ein Archiv. app/www besitzt keinen zweiten Frontendquellordner. Git-Metadaten, package.json, pnpm-lock.yaml und node_modules gehören zur Entwicklungsumgebung und bleiben erhalten.

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
| pnpm run prepare:upload | Backend-, Node-, Rhino-, Integritätsprüfungen und Desktop-Bereitstellung; Browser separat |
| pnpm run check:upload | Quellen, tatsächlichen Desktop-Upload und Dateimanifeste abgleichen |
| pnpm run check:delivery --base-url URL/ | Ausdrücklich gewählte öffentliche HTML-/JS-/CSS-Auslieferung lesend mit lokalen SHA-256 vergleichen |
| node tools/checks/streampanel.cjs | Lesende Anbieterprüfung; ohne öffentliche Produktdaten ausstehend bei null Netzabrufen |

Der bisherige npm-Befehl build:live bleibt als Alias für dieselbe Uploadbereitstellung erhalten. Direkte Einstiegspunkte liegen unter tools/build/, tools/checks/ und tools/preview/server.cjs. Die alten flachen Werkzeugpfade entfallen vollständig.

Voraussetzungen: Node.js ab 20, pnpm 11.25.0, Edge und Java 11+. Abhängigkeiten mit pnpm install --frozen-lockfile einrichten. Einmalig geprüfte Rhino-JARs mit node tools/checks/rhino.cjs --download im Temp-Cache bereitstellen. MISCHWERK_JAVA kann auf Java zeigen; MISCHWERK_PLAYWRIGHT auf eine externe Playwright-Installation und MISCHWERK_PREVIEW_PORT auf einen anderen lokalen Port.

Optionale Bildaufnahmen aus Browserprüfungen landen unter dem System-Tempordner/MischWerk-Pruefbilder und erzeugen keine weiteren Bildsammlungen im Projekt. Dauerhaft behalten werden nur tatsächlich verwendete aktuelle Berichtsbilder.

## Website und Arbeitsbereich

Die wieder aufgenommene Homepage liegt unter [website/](website/README.md). Aus diesem Ordner startet pnpm start den eigenen Node-Webserver; Node.js ab 22 ist erforderlich. Öffentliche Reiter sind unter /, /sendeplan, /team, /mitmachen und /wunschbox erreichbar. /arbeitsbereich enthält die geschützten Fachansichten. Die Appadapter laufen ausschließlich nach Besitzerfreigabe; die Website selbst gehört nicht zum UPLOAD. Mailversand bleibt ausgeschaltet. STREAMPANEL/DataDachs ist geplant, die erforderliche moderne Node-Laufzeit im konkreten Tarif noch unbestätigt. Einrichtung, Rechte und native Abnahme stehen in [website/docs/ANBINDUNG.md](website/docs/ANBINDUNG.md). pnpm run preview im PROJEKT-Ordner bleibt die lokale Knuddels-App-Testvorschau.

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

Die native Verwaltung wird mit `/MW Verwaltung` geöffnet und bleibt im festen Rahmen von 560 × 630 px mit den Bereichen Radio-Team und Bot-Texte. Die frühere Statuszentrale bleibt entfernt.

Auslieferung ab Build 172: prepare-upload erzeugt kleine Bündel aus vollständigen, unveränderten Quellmodulen ausschließlich im festen Desktop-UPLOAD. Die Quelldateien unter app/www bleiben modular. bundled=true im Manifest und check:upload/check:delivery prüfen die reproduzierbaren tatsächlichen Auslieferungsbytes. Alle Dateien bleiben unter 9500 Zeichen. tools/checks/startup.cjs misst lokale Kaltstarts mit ausdrücklich gewähltem Appordner und optionaler Ressourcenverzögerung; dies ist keine echte Knuddels-Ladezeit.

Lesender Loadernachweis: node tools/checks/loader.cjs liest ausdrücklich den öffentlichen Knuddels-Lader und prüft seine isolierte Lade-Komponente in Edge, ohne Chat-/Bridge-Verbindung. Kein Bestandteil der normalen App- oder Paketprüfung.

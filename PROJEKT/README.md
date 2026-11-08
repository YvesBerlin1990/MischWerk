# MischWerk – technische Übersicht

**App 0.1.305 · Build 305 · Website 0.2.5**, Stand 08.11.2026.

[Projekt und Bilder](../.github/README.md) · [Verbindliche Regeln](AGENTS.md) · [Installation und Betrieb](docs/betrieb/INBETRIEBNAHME.md)

Die GitHub-Übersicht liegt in [.github/README.md](../.github/README.md). Fachliche Regeln stehen zentral in [AGENTS.md](AGENTS.md); die folgenden Abschnitte erklären Ablage und Werkzeuge.

Die App- und Website-Badges in der GitHub-Übersicht lesen die jeweilige `package.json` auf `main`; der Commit-Badge zeigt die letzte Änderung dieses Branches. Die Versionsanzeigen aktualisieren sich dadurch nach einem Push automatisch. Die Node.js-Voraussetzung ist separat verlinkt.

![Aktuelle Appleiste mit unveränderter Playtaste und daran angeglichenen Aktionen](docs/pruefung/oberflaeche/radio/vinyl-glow-desktop.png)

[Mobilansicht](docs/pruefung/oberflaeche/radio/vinyl-glow-mobil.png) · [Aktionsbuttons im Detail](docs/pruefung/oberflaeche/radio/radio-buttons.png) · [Kompakte Aktionsbuttons](docs/pruefung/oberflaeche/radio/radio-buttons-schmal.png) · [Hörer-Sendeplan](docs/pruefung/oberflaeche/sendeplan/sendeplan-hoerer-720.png). Alle Bilder zeigen lokale Vorschauen mit Beispieldaten.

Neue Channelbeitritte erhalten einheitlich „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ mit vorhandenem kleinen Profilfoto am Ende. Der größere fette erste Satz verwendet Appleisten-Gold #e6c77b, danach folgt der zweite Satz in normaler Channelschrift ohne festen Zeilenumbruch. Nick und Foto sind native Profillinks. Die bisherigen 30 Vorlagen und die Zufallsauswahl sind entfernt. Der Appstart begrüßt bereits Anwesende nicht nachträglich. [API-Nachweis](docs/api/API-NACHWEIS.md#öffentliche-userbegrüßung) · [Prüfbericht](docs/pruefung/PRUEFBERICHT.md).

Offene Musikwünsche werden vor der Annahme dauerhaft gespeichert und nach Updates oder Neustarts samt Reihenfolge und Bearbeitungsstatus wieder geladen. Erledigte und verworfene Texte werden entfernt. Beim ersten Wechsel von Build 267 oder älter sind dessen bisher nur flüchtige Wünsche noch nicht gesichert.

Radioregie, Sendeplan und Verwaltung sind durchgängig mit flachen Arbeitsflächen, Goldakzenten und vollständigen Reitern gestaltet. Die Radioregie bietet Anmelden, Abmelden und bestätigte Übergabe; diese Wechsel werden automatisch im Sendeplan vermerkt. Passende vorhandene Planungen werden ergänzt. Eine Anmeldung hat kein Zeitlimit und benötigt keine Verlängerung; Endzeit-, Restzeit- und Studiozeitanzeigen sind entfernt.

Alle Menüs bleiben kompakte Overlays: Radioregie bis 640 × 580 px, Sendeplan 720 × 600 px, Verwaltung 500 × 560 px und Wunschbox 480 × 340 px. Einheitliche niedrige Köpfe und ein auf fertiges CSS/Schriftlayout wartender Start verringern Chatabdeckung und Darstellungssprünge. Vorhandene Seiten- und Scrollwege erhalten alle Inhalte.

Der Sendeplan-Button in der Appleiste ist vorerst für andere Nutzer deaktiviert und zeigt darunter „In Kürze“. Otterchen als anwesender Channelinhaber kann ihn zum Weiterarbeiten öffnen.

Sendeplan, Wunschbox und Radioregie verwenden große, stark gerundete Tasten mit umlaufendem warmem Goldrand und derselben dunklen Materialwirkung wie die Playtaste. In breiten Fenstern stehen Symbol und Beschriftung nebeneinander; mittlere und sehr schmale Flächen ordnen sie untereinander an. Auch kompakt bleiben alle Bezeichnungen vollständig sichtbar. Die Playtaste selbst bleibt unverändert.

Beim Öffnen beginnt die Sendeplanübersicht heute und enthält die nächsten 14 Tage einschließlich heute. „Weiter“ führt durch alle Vorschautage; „Ab heute“ kehrt zum Anfang zurück. Termine werden aus bis zu drei gespeicherten Wochen zusammengeführt. Die gesonderte Wochenwahl bleibt dem Inhaber für die Verwaltung und langfristige Planung erhalten.

Der Sendeplan zeigt das Programm für Hörer: Sendungstitel als hervorgehobene Überschrift, darunter der Name; die Uhrzeit steht zugeordnet daneben. Freie Musikzeiten heißen „Musikmix von MischWerk“, Open End in der Leseansicht „Ende offen“. Heute und morgen sind markiert. Der Zeitraum steht ausschließlich im Kopf; unten stehen Seitennummer und Navigation. Verwaltungsaktionen und kurze Studioanmeldungen bleiben privat.

Jeder gefüllte Tag beginnt mit einem gemeinsamen Datumskopf. Musikzeiten und Sendungen sind an denselben Textkanten ausgerichtet; schmale Fenster stapeln sie geordnet. Inhaberaktionen und der kompakte private Kurzzeithinweis folgen unter dem Sendungstext.

Der Kopf trennt Zeitraum und Navigation von den Aktionen darunter. „Ab heute“ und Aktualisieren sind zusammengefasst; die Eintragen-Aktion steht separat und bricht auf schmalen Fenstern geordnet um. Ein Zeitzonenhinweis wird nicht angezeigt.

Automatische Studioeinträge zeigen volle Anfangsstunden und erscheinen für Hörer ab fünf Minuten Dauer. Kürzere Anmeldungen bleiben für den Inhaber sichtbar. Normale und abgeschlossene automatische Einträge lassen sich direkt mit „Entfernen“ und anschließender Bestätigung löschen. [Sendeplan bedienen](docs/betrieb/SENDEPLAN.md).

Der senderweite Lauftext lässt sich in **Radioregie → Lauftext** einstellen. Nur Radiomoderation einschließlich des automatisch berechtigten Inhabers kann Text, Tempo, Richtung und Ein/Aus speichern. Die feste Kennzeichnung lautet „Information:“. [Bedienung](docs/betrieb/INBETRIEBNAHME.md#lauftext-unter-der-appleiste).

Der Android-Publisher überträgt Senderdaten und den bestätigten Lauftext einschließlich ausgeschaltetem Zustand im signierten Status-POST. Android-Musikwünsche werden aus dessen frischen bestätigten Antworten in dieselbe dauerhafte Wunschqueue übernommen und mit tatsächlichem Status und Platz quittiert. Die Einrichtung benötigt nur den privaten Sync-Schlüssel; Android-WebHook, Hook-URL und zusätzlicher Relay-Schlüssel entfallen. [Einrichtung und Abnahme](docs/betrieb/INBETRIEBNAHME.md#regulärer-rückkanal-ab-build-289) · [Anbindungsvertrag](docs/api/ANDROID-RELAY-HANDOFF.json).

Das native Channel-Thema lässt sich mit **`/settopic TEXT`** setzen. **`/settopic --buttons`** erzeugt die vereinbarte Vorlage mit Lieblings-MyChannel, Readme und Channelinfo direkt im Backend und liest das Ergebnis zurück. **`/settopic --pruefen`** liest nur die gespeicherte Zeichen- und Buttonzahl. [Bedienung](docs/betrieb/INBETRIEBNAHME.md#channel-thema-setzen).

## Zuständigkeiten der Ordner

Alle folgenden Pfade liegen innerhalb von `PROJEKT/`, soweit nicht anders angegeben.

| Ablage | Inhalt |
| --- | --- |
| [src/backend/](src/backend) | Gepflegte ES5-/Rhino-Backendmodule |
| [app/server/](app/server) und `app/main.js` | Erzeugte Backendlaufzeit und Einstieg |
| [app/www/](app/www) | Gepflegte Browseroberfläche, Fonts und Appmedien |
| [app/www/css/](app/www/css) | Styles nach shared, radio, studio, schedule, team, wishes und history |
| [medien/](medien) | Original-Logos und MyChannel-Hintergrund |
| [tools/build/](tools/build) und [tools/checks/](tools/checks) | Paketbau und Prüfwerkzeuge |
| [tools/lib/](tools/lib) | Gemeinsames Inventar, Ladepläne und Releasekennung |
| [tools/preview/](tools/preview) | Lokale App-Testvorschau |
| [tools/emulator/](tools/emulator) | Integriertes interaktives Testlabor |
| [tests/](tests) | Node-, Browser- und Rhino-Prüfungen mit Fixtures/Support |
| [website/](website/README.md) | Eigenständige Homepage mit eigenen Abhängigkeiten und Prüfungen |
| [website/public/](website/public) | HTML, CSS und Browsermodule unter js/site und js/workspace |
| [website/server/](website/server) | Regulärer Webserver, Sitzungen und Adapter |
| [website/tools/preview/](website/tools/preview) | Vier ausschließlich lokale Diagnosedateien |
| [docs/](docs) | Architektur, API-Nachweise, Betrieb und Prüfberichte |
| [docs/pruefung/oberflaeche/](docs/pruefung/oberflaeche) | Aktuelle Bilder in sechs Themenordnern |
| [deployment/](deployment) | Zielkonfiguration und fünf Auslieferungsmanifeste |
| [references/api/](references/api) | Zwei offizielle Dokumentationsstubs |

`src/backend/` ist die Quelle, `app/server/` die erzeugte Laufzeit. Die fertige Auslieferung liegt fest unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**, außerhalb des Gitbestands. Die Website ist ein separates Projekt und gehört nicht zum Knuddels-Paket. Einzelheiten zur Ablage stehen im Abschnitt [Struktur und Freigabe](AGENTS.md#struktur-und-freigabe).

## Lokal arbeiten

Voraussetzungen: **Node.js ab 20**, **pnpm 11.25.0**, Microsoft Edge für Browserprüfungen und **Java 11+** für Rhino. Die Website benötigt Node.js ab 22.

Befehle aus `PROJEKT/` ausführen; von der Repositorywurzel jeweils `pnpm --dir PROJEKT …` verwenden.

| Befehl | Zweck |
| --- | --- |
| `pnpm install --frozen-lockfile` | Entwicklungsabhängigkeiten installieren |
| `pnpm run emulator` | Interaktives Testlabor auf http://127.0.0.1:8776 |
| `pnpm run preview` | App-Testvorschau auf http://127.0.0.1:8765 |
| `pnpm run build:backend` | Backendlaufzeit aus den Quellen erzeugen |
| `pnpm run check:backend` | Quell-/Laufzeitgleichheit prüfen |
| `pnpm test` | Node-Prüfungen |
| `pnpm run test:browser` | Browserprüfungen mit Edge |
| `pnpm run test:emulator` | Rhino- und Emulatorprüfungen einschließlich Browserfälle |
| `pnpm run check` | Projektstruktur, API-Signaturen, Komponenten und Inventar |
| `pnpm run check:rhino` | Echte Rhino-Engines 1.7.7.2 und 1.9.1 |
| `pnpm run check:lengths` | Textgrenzen der Laufzeitdateien prüfen |
| `pnpm run prepare:upload` | Geprüftes Paket im festen Desktop-UPLOAD bauen |
| `pnpm run check:upload` | Tatsächliches Paket, Quellen und fünf Manifeste vergleichen |
| `pnpm run check:delivery --base-url URL/` | Gewählte öffentliche Auslieferung lesend per SHA-256 vergleichen |

Einmalig benötigte Rhino-JARs: `node tools/checks/rhino.cjs --download`. `MISCHWERK_JAVA` wählt Java; `MISCHWERK_PLAYWRIGHT` eine externe Playwright-Installation. `build:live` ist ein Alias für `prepare:upload`.

## App im Testlabor prüfen

Mit `pnpm run emulator` starten und [127.0.0.1:8776](http://127.0.0.1:8776) öffnen; alternativ [Start-Testlabor.ps1](tools/emulator/Start-Testlabor.ps1) verwenden. `-Port` bzw. `MISCHWERK_EMULATOR_PORT` wählt einen anderen Port, Strg+C beendet den Server.

Das Labor bietet mehrere Testnutzer, K3-/STAPP-Modelle, Breiten von 320 bis 3840 px, verzögerte oder ausfallende Ressourcen und Nachrichten sowie lokale Provider-/Audiofälle. Es hält den geladenen Appstand fest; Testdaten liegen im System-Tempordner. Die Modelle ersetzen keine native Knuddels-Abnahme.

[Bedienhilfe](tools/emulator/www/help.html) · [Codex-Zugriff](AGENTS.md#codex-zugriff-auf-den-integrierten-emulator)

## Website

Aus `website/` startet `pnpm start` den regulären Webserver, `pnpm test` die eigenen Prüfungen. Die öffentliche Navigation und der geschützte Arbeitsbereich nutzen vorbereitete Appadapter. Einrichtung, ausgeschalteter Mailversand und offene Produktionsabnahme sind in der [Website-Dokumentation](website/README.md) und im [Anbindungsvertrag](website/docs/ANBINDUNG.md) beschrieben.

## Bereitstellung und Nachweise

`prepare:upload` baut Backend und Auslieferungsbündel und führt Node-, Rhino- und Integritätsprüfungen aus. Die Browserrunde läuft separat. Der App-Arbeitsbestand behält alle 149 Dateien. Das aktuelle UPLOAD-Paket umfasst 131 Dateien, darunter 124 Texte; 18 vollständig gebündelte Einzeldateien werden dort nicht zusätzlich kopiert. Der Paketbau entfernt ihre alten UPLOAD-Kopien automatisch. Die fachlichen Ordner, alle 62 Backendmodule und die unveränderten übrigen Ladepfade bleiben erhalten. Fünf Manifeste dokumentieren die tatsächlichen Auslieferungsbytes. Alle Laufzeittexte und Manifeste bleiben unter 9500 Zeichen. Der Paketbau veröffentlicht nichts und startet keine echte App neu.

[App-Prüfbericht](docs/pruefung/PRUEFBERICHT.md) · [Website-Prüfbericht](website/docs/PRUEFUNG.md) · [API-Nachweis](docs/api/API-NACHWEIS.md) · [Architektur](docs/architektur/ARCHITEKTUR.md) · [Frontend](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [Design](docs/architektur/DESIGN.md) · [LIVE-Abnahme](docs/betrieb/LIVE-ABNAHME.md)

# MischWerk – technische Übersicht

**App 0.1.269 · Build 269 · Website 0.2.1**, Stand 06.11.2026.

[Projekt und Bilder](../.github/README.md) · [Verbindliche Regeln](AGENTS.md) · [Installation und Betrieb](docs/betrieb/INBETRIEBNAHME.md)

Die GitHub-Übersicht liegt in [.github/README.md](../.github/README.md). Fachliche Regeln stehen zentral in [AGENTS.md](AGENTS.md); die folgenden Abschnitte erklären Ablage und Werkzeuge.

Neue Channelbeitritte erhalten einheitlich „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ mit vorhandenem kleinen Profilfoto am Ende. Die größere fette erste Zeile verwendet Appleisten-Gold #e6c77b, die zweite Zeile die normale Channelschrift. Nick und Foto sind native Profillinks. Die bisherigen 30 Vorlagen und die Zufallsauswahl sind entfernt. Der Appstart begrüßt bereits Anwesende nicht nachträglich. [API-Nachweis](docs/api/API-NACHWEIS.md#öffentliche-userbegrüßung) · [Prüfbericht](docs/pruefung/PRUEFBERICHT.md).

Offene Musikwünsche werden vor der Annahme dauerhaft gespeichert und nach Updates oder Neustarts samt Reihenfolge und Bearbeitungsstatus wieder geladen. Erledigte und verworfene Texte werden entfernt. Beim ersten Wechsel von Build 267 oder älter sind dessen bisher nur flüchtige Wünsche noch nicht gesichert.

Die Radioregie bietet Anmelden, Abmelden und bestätigte Übergabe. Eine Anmeldung hat kein Zeitlimit und benötigt keine Verlängerung; Endzeit-, Restzeit- und Studiozeitanzeigen sind entfernt.

Der senderweite Lauftext lässt sich in **Radioregie → Lauftext** einstellen. Nur Radiomoderation einschließlich des automatisch berechtigten Inhabers kann Text, Tempo, Richtung und Ein/Aus speichern. Die feste Kennzeichnung lautet „Information:“. [Bedienung](docs/betrieb/INBETRIEBNAHME.md#lauftext-unter-der-appleiste).

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

`prepare:upload` baut Backend und Auslieferungsbündel und führt Node-, Rhino- und Integritätsprüfungen aus. Die Browserrunde läuft separat. Das aktuelle Paket umfasst 140 Laufzeitdateien, darunter 133 Texte; fünf Manifeste dokumentieren die tatsächlichen Bytes. Alle Laufzeittexte und Manifeste bleiben unter 9500 Zeichen. Der Paketbau veröffentlicht nichts und startet keine echte App neu.

[App-Prüfbericht](docs/pruefung/PRUEFBERICHT.md) · [Website-Prüfbericht](website/docs/PRUEFUNG.md) · [API-Nachweis](docs/api/API-NACHWEIS.md) · [Architektur](docs/architektur/ARCHITEKTUR.md) · [Frontend](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [Design](docs/architektur/DESIGN.md) · [LIVE-Abnahme](docs/betrieb/LIVE-ABNAHME.md)

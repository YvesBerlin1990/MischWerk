# MischWerk – technische Übersicht

**App 0.1.330 · Build 330 · Website 0.2.7** · Stand: 09.11.2026.

MischWerk verbindet Radio, dauerhafte Musikwünsche, Moderation, Lauftext und Sendeplan in einer Knuddels-UserApp. Die eigenständige Website und der Android-Rückkanal verwenden vorbereitete Appverträge. Funktionen und aktuelle Bilder stehen in der [GitHub-Übersicht](../.github/README.md); fachliche Regeln und Prüfvorgaben zentral in [AGENTS.md](AGENTS.md).

![Radioleiste aus Build 330 mit großer goldener Playtaste, Titel über Interpret und kompakten Aktionen](docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

[Mittlere Breite](docs/pruefung/oberflaeche/radio/radio-harmonie-mittel.png) · [Mobilansicht](docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png) · [Lauftext](docs/pruefung/oberflaeche/radio/lauftext-1280.png) · [Moderation](docs/pruefung/oberflaeche/moderation/moderation-780.png). Die drei Radioübersichten und der Lauftext stammen aus dem fertigen lokalen Build 330 mit Beispieldaten; Menübilder behalten ihren dokumentierten Stand 322. Das native Sendeplan-Overlay ist vollständig zurückgesetzt; seine erhaltene Taste bleibt für alle Nutzer auf „In Kürze“ gesperrt. Homepage-Sendeplan und gespeicherte Wochen bleiben erhalten.

## Zuständigkeiten der Ordner

Alle folgenden Pfade liegen innerhalb von `PROJEKT/`.

| Ablage | Inhalt |
| --- | --- |
| [src/backend/](src/backend) | Gepflegte ES5-/Rhino-Backendmodule |
| [app/server/](app/server) und `app/main.js` | Daraus erzeugte Backendlaufzeit und kurzer Einstieg |
| [app/www/](app/www) | Gepflegte Browseroberfläche, lokale Schriften und Appmedien |
| [medien/](medien) | Original-Logos und MyChannel-Hintergrund |
| [tools/build/](tools/build) · [tools/checks/](tools/checks) | Paketbau und Prüfwerkzeuge |
| [tools/lib/](tools/lib) | Gemeinsames Inventar, Ladepläne und Releasekennung |
| [tools/emulator/](tools/emulator) · [tools/preview/](tools/preview) | Integriertes Testlabor und lokale Appvorschau |
| [tests/](tests) | Node-, Browser- und Rhino-Prüfungen mit Fixtures und Support |
| [website/](website/README.md) | Homepage mit eigenem Server, Abhängigkeiten und Prüfungen |
| [docs/](docs) | Architektur, API-Nachweise, Betrieb und Prüfberichte |
| [docs/pruefung/oberflaeche/](docs/pruefung/oberflaeche) | Aktuelle Appbilder in sechs Themenordnern |
| [deployment/](deployment) | Zielkonfiguration und fünf Auslieferungsmanifeste |
| [references/api/](references/api) | Zwei unveränderte offizielle Dokumentationsstubs |

`src/backend/` ist die Backendquelle, `app/server/` die erzeugte Laufzeit. Die Browserquellen werden direkt unter `app/www/` gepflegt. Die Website ist ein separates Projekt.

## Lokal arbeiten

Voraussetzungen: **Node.js ab 20**, **pnpm 11.25.0**, Microsoft Edge für Browserprüfungen und **Java 11+** für Rhino. Die Website benötigt Node.js ab 22.

Befehle aus `PROJEKT/` ausführen; von der Repositorywurzel jeweils `pnpm --dir PROJEKT …` verwenden. Bei gesperrten PowerShell-Skripten funktioniert `pnpm.cmd`.

| Befehl | Zweck |
| --- | --- |
| `pnpm install --frozen-lockfile` | Entwicklungsabhängigkeiten installieren |
| `pnpm run emulator` | Interaktives Testlabor auf http://127.0.0.1:8776 |
| `pnpm run preview` | Appvorschau auf http://127.0.0.1:8765 |
| `pnpm run build:backend` | Backendlaufzeit aus den Quellen erzeugen |
| `pnpm run check:backend` | Quell-/Laufzeitgleichheit prüfen |
| `pnpm test` | Vollständige Node-Suite |
| `pnpm run test:browser` | Browser- und Emulatorprüfungen mit Edge |
| `pnpm run test:emulator` | Rhino und integrierte Emulatorprüfungen |
| `pnpm run check` | Struktur, Syntax, API-Signaturen, Komponenten und Inventar |
| `pnpm run check:rhino` | Rhino 1.7.7.2 und 1.9.1 |
| `pnpm run check:lengths` | Textgrenzen der Laufzeitdateien |
| `pnpm run prepare:upload` | Geprüftes Paket im festen Desktop-UPLOAD bauen |
| `pnpm run check:upload` | Paket, Quellen und fünf Manifeste vergleichen |
| `pnpm run check:delivery --base-url URL/` | Gewählte öffentliche Auslieferung lesend per SHA-256 vergleichen |

Rhino-JARs einmalig mit `node tools/checks/rhino.cjs --download` beziehen. `MISCHWERK_JAVA` wählt Java; `MISCHWERK_PLAYWRIGHT` eine externe Playwright-Installation. `build:live` ist ein Alias für `prepare:upload`. `MISCHWERK_TEST_UPLOAD` richtet die unterstützten Prüfwerkzeuge auf das tatsächlich gebündelte Appverzeichnis.

## App im Testlabor prüfen

`pnpm run emulator` startet [127.0.0.1:8776](http://127.0.0.1:8776); alternativ [Start-Testlabor.ps1](tools/emulator/Start-Testlabor.ps1) verwenden. `-Port` bzw. `MISCHWERK_EMULATOR_PORT` wählt einen anderen Port, Strg+C beendet den Server.

Das Labor lädt den lokalen Appcode und bietet Testnutzer, K3-/STAPP-Modelle, Breiten von 320 bis 3840 px, verzögerte oder ausfallende Ressourcen sowie lokale Provider- und Audiofälle. Testdaten liegen im System-Tempordner. Die Modelle ersetzen keine native Knuddels-Abnahme.

[Bedienhilfe](tools/emulator/www/help.html) · [Codex-Zugriff](AGENTS.md#codex-zugriff-auf-den-integrierten-emulator)

## Website und Anbindungen

Aus `website/` startet `pnpm start` den regulären Webserver; `pnpm test` prüft das eigene Projekt. Die öffentliche Navigation und der geschützte Arbeitsbereich verwenden vorbereitete Appadapter. Einrichtung, ausgeschalteter Mailversand und offene Produktionsabnahme stehen in der [Website-Dokumentation](website/README.md) und im [Anbindungsvertrag](website/docs/ANBINDUNG.md).

Der signierte Android-Statusweg überträgt Senderdaten und Lauftext und übernimmt bestätigte Antwortwünsche in dieselbe dauerhafte Wunschqueue. Einrichtung und Aktivierung sind unter [Installation und Betrieb](docs/betrieb/INBETRIEBNAHME.md#regulärer-rückkanal-ab-build-289) beschrieben. Sendeplan und Radioteam nutzen denselben Rückkanal; der [Homepage-/Teamvertrag](docs/api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md) enthält die abgestimmten Daten und offenen gemeinsamen Nachweise.

## Bereitstellung und Nachweise

`prepare:upload` baut Backend und Auslieferungsbündel und führt Node-, Rhino- und Integritätsprüfungen aus. Beide Rhino-Engines prüfen auch das fertige Paket; die Browserrunde läuft separat. Der App-Arbeitsbestand umfasst **154 Dateien und 64 Backendmodule**, das aktuelle Paket **109 Dateien mit 101 Texten und 37 Serverdateien**. Ganze benachbarte Module werden reproduzierbar gebündelt; Quellen bleiben lesbar erhalten. Fünf Manifeste belegen die tatsächlichen Auslieferungsbytes. Alle Laufzeittexte und Manifeste bleiben strikt unter 9500 UTF-16-Zeichen.

Die einzige fertige Auslieferung liegt unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/** und bleibt außerhalb des Gitbestands. Paketbau und GitHub-Push installieren die App nicht auf Knuddels. Den Ablauf beschreibt die [Uploadanleitung](docs/betrieb/INBETRIEBNAHME.md#installation-und-upload).

[App-Prüfbericht und aktuelle Bilder](docs/pruefung/PRUEFBERICHT.md) · [Website-Prüfbericht](website/docs/PRUEFUNG.md) · [API-Nachweis](docs/api/API-NACHWEIS.md) · [Architektur](docs/architektur/ARCHITEKTUR.md) · [Frontend](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [Design](docs/architektur/DESIGN.md) · [Native Abnahme](docs/betrieb/LIVE-ABNAHME.md)

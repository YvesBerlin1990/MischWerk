# MischWerk – technische Übersicht

**App 0.1.448 · Build 448 · Website 0.2.13** · Stand: 17.11.2026.

MischWerk zeigt Radio, zentrale Sendungsdaten, eigene Musikwünsche, Lauftext und Sendeplan in Knuddels. Sendung und Wunschregie liegen im MischWerk Live Studio mit Firebase; die App verwendet den vorhandenen signierten Abgleich.

[Funktionen und Bilder](../.github/README.md) · [Verbindliche Projektregeln](../AGENTS.md) · [Architektur](docs/architektur/ARCHITEKTUR.md)

## Zuständigkeiten der Ordner

Alle folgenden Pfade liegen innerhalb von `PROJEKT/`.

| Ablage | Inhalt |
| --- | --- |
| [src/backend/](src/backend) | Gepflegte ES5-/Rhino-Backendmodule |
| [app/server/](app/server) und `app/main.js` | Erzeugte Backendlaufzeit und kurzer Einstieg |
| [app/www/](app/www) | Gepflegte Browseroberfläche, lokale Schriften und Appmedien |
| [medien/](medien) | Originalmedien und MyChannel-Hintergründe |
| [tools/build/](tools/build) · [tools/checks/](tools/checks) | Paketbau und Prüfwerkzeuge |
| [tools/lib/](tools/lib) | Gemeinsame Hilfen, Inventar und Ladepläne |
| [tools/userapp-emulator/](tools/userapp-emulator) · [tools/preview/](tools/preview) | Zentral geliefertes Emulator-Submodul und lokale Appvorschau |
| [tests/](tests) | Node-, Browser- und Rhino-Prüfungen mit Fixtures und Support |
| [website/](website/README.md) | Eigenständige Homepage und Webserver |
| [docs/](docs) | Architektur, API-Nachweise, Betrieb und Prüfberichte |
| [docs/pruefung/oberflaeche/](docs/pruefung/oberflaeche) | App-Prüfbilder |
| [deployment/](deployment) | Zielkonfiguration und fünf Auslieferungsmanifeste |
| [references/api/](references/api) | Zwei offizielle Dokumentationsstubs |

## Lokal arbeiten

Voraussetzungen: **Git**, **Node.js 24**, **pnpm 11.25.0**, Microsoft Edge für Browserprüfungen und **Java 11+** für Rhino. Der zentrale Emulator einschließlich Windows-Einrichtung verwendet Node.js 24. Die eigenständige Website benötigt Node.js ab 22.

Befehle aus `PROJEKT/` ausführen; von der Repositorywurzel jeweils `pnpm --dir PROJEKT …` verwenden. Bei gesperrten PowerShell-Skripten funktioniert `pnpm.cmd`.

| Befehl | Zweck |
| --- | --- |
| `pnpm install --frozen-lockfile` | Entwicklungsabhängigkeiten installieren |
| `pnpm run emulator` | Zentraler UserApp-Emulator auf `http://127.0.0.1:3105` |
| `pnpm run emulator:setup` | Automatischen Windows-Abgleich für diese lokale Repositorykopie einrichten oder erneuern |
| `pnpm run preview` | Appvorschau auf `http://127.0.0.1:8765` |
| `pnpm run build:backend` | Backendlaufzeit aus den Quellen erzeugen |
| `pnpm run check:backend` | Quell-/Laufzeitgleichheit prüfen |
| `pnpm test` | Vollständige Node-Suite |
| `pnpm run test:browser` | Browser- und Emulatorprüfungen mit Edge |
| `pnpm run test:emulator` | MischWerk-Integration mit der tatsächlichen zentralen Laufzeit |
| `pnpm run check` | Struktur, Syntax, API-Signaturen und Inventar |
| `pnpm run check:rhino` | Rhino 1.7.7.2 und 1.9.1 |
| `pnpm run check:lengths` | Textgrenzen der Laufzeitdateien |
| `pnpm run prepare:upload` | Geprüftes Paket im Desktop-UPLOAD bauen |
| `pnpm run check:upload` | Paket, Quellen und fünf Manifeste vergleichen |
| `pnpm run check:delivery --base-url URL/` | Gewählte öffentliche Auslieferung lesend per SHA-256 vergleichen |

Rhino-JARs einmalig mit `node tools/checks/rhino.cjs --download` beziehen. `MISCHWERK_JAVA` wählt Java; `MISCHWERK_PLAYWRIGHT` eine externe Playwright-Installation. `build:live` ist ein Alias für `prepare:upload`. `MISCHWERK_TEST_UPLOAD` richtet die unterstützten Prüfwerkzeuge auf das gebündelte Appverzeichnis.

## App im zentralen Emulator prüfen

Nach `pnpm install --frozen-lockfile` startet `pnpm run emulator` aus `PROJEKT/` den lokalen Appbestand auf `127.0.0.1:3105`. Unter Windows initialisiert der Starter bei Bedarf das gebundene Submodul und ruft dessen zentrale Abgleichseinrichtung auf. Diese registriert die tatsächliche lokale Repositorykopie und beendet ihren ersten Abgleich einschließlich nötiger Emulatorabhängigkeiten vor dem Serverstart. `MISCHWERK_EMULATOR_PORT` wählt einen anderen Port, Strg+C beendet den Server.

`pnpm run emulator:setup` richtet den automatischen Abgleich ausdrücklich ein oder erneuert ihn. Auf einem weiteren Windows-Rechner oder nach Verschieben genügt derselbe Befehl beziehungsweise der erste normale Emulatorstart. Mehrere Kopien an unterschiedlichen Pfaden können nebeneinander registriert sein; die zentrale Einrichtung verwaltet eine gemeinsame stille Windows-Aufgabe bei der Benutzeranmeldung. Der Abgleich verwendet die jeweilige vorhandene Git-Anmeldung mit Zugriff auf die privaten Repositories. Maschinenpfade und Zugangsdaten werden nicht im Repository verteilt. Die Installation auf anderen Rechnern erfolgt durch deren lokalen Aufruf.

Die Laufzeit stammt aus [Windows-K-UserAppEmulator](https://github.com/PolaroidK/Windows-K-UserAppEmulator), Branch `emulator-submodule`. Der kleine lokale Starter baut das Backend und übergibt den absoluten Apppfad; Emulatoränderungen werden ausschließlich im zentralen Repository gepflegt. Testdaten und Berichte liegen im System-Tempordner. Der bisherige Emulator ist veraltet; seine Modelle bleiben unter `tests/support/native-lab/` für bestehende Regressionstests erhalten. Die Modelle ersetzen keine native Knuddels-Abnahme.

[Zentrale Dokumentation](tools/userapp-emulator/laufzeit-und-submodul.md) · [Codex-Zugriff](../AGENTS.md#codex-zugriff-auf-den-zentralen-emulator)

## Website und Anbindungen

Im Ordner `website/` zunächst `pnpm install --frozen-lockfile` ausführen. `pnpm start` startet den regulären Webserver, `pnpm test` prüft das eigene Projekt. Einrichtung und Appadapter sind in der [Website-Dokumentation](website/README.md) und im [Anbindungsvertrag](website/docs/ANBINDUNG.md) beschrieben.

[Senderdaten und Wünsche](docs/api/API-NACHWEIS.md) · [Homepage-/Teamvertrag](docs/api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md) · [Sendeplan](docs/betrieb/SENDEPLAN.md) · [Einrichtung und Betrieb](docs/betrieb/INBETRIEBNAHME.md)

## Paketbau und Nachweise

`prepare:upload` baut Backend und Auslieferungsbündel und führt Node-, Rhino- und Integritätsprüfungen aus. Beide Rhino-Engines prüfen auch das fertige Paket; die Browserrunde läuft separat. Die Auslieferung liegt unter `<Desktop des aktuellen Nutzers>/MischWerk/UPLOAD/MischWerk/`. Der Windows-Desktop wird automatisch ermittelt. Ablauf und Installation beschreibt die [Uploadanleitung](docs/betrieb/INBETRIEBNAHME.md#installation-und-upload).

Aktuelle Ergebnisse, Bestandszahlen und offene Abnahmen stehen in den Prüfberichten:

[App-Prüfbericht und Bilder](docs/pruefung/PRUEFBERICHT.md) · [Website-Prüfbericht](website/docs/PRUEFUNG.md) · [Native Abnahme](docs/betrieb/LIVE-ABNAHME.md) · [Frontend-Architektur](docs/architektur/ARCHITEKTUR-FRONTEND.md) · [Design](docs/architektur/DESIGN.md)

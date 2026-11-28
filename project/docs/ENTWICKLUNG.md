# MischWerk – technische Übersicht

Version und Build stehen im [App-Paket](../userapp/package.json).

MischWerk zeigt Radio, zentrale Sendungsdaten, eigene Musikwünsche, Lauftext und Sendeplan in Knuddels. Sendung und Wunschregie liegen im MischWerk Live Studio mit Firebase; die App verwendet den vorhandenen signierten Abgleich.

[Funktionen und Bilder](../../README.md) · [Verbindliche Projektregeln](../../agent-rules.json) · [Architektur](architektur/ARCHITEKTUR.md)

## Zuständigkeiten der Ordner

Alle folgenden Pfade liegen innerhalb von `project/`. Die Knuddels-App bildet das Modul `userapp/`; daneben liegen Originalmedien und Dokumentation.

| Ablage | Inhalt |
| --- | --- |
| [userapp/src/backend/](../userapp/src/backend) | Gepflegte ES5-/Rhino-Backendmodule |
| [userapp/app/server/](../userapp/app/server) und `userapp/app/main.js` | Erzeugte Backendlaufzeit und kurzer Einstieg |
| [userapp/app/www/](../userapp/app/www) | Gepflegte Browseroberfläche, lokale Schriften und Appmedien |
| [userapp/tools/build/](../userapp/tools/build) · [userapp/tools/checks/](../userapp/tools/checks) | Paketbau und Prüfwerkzeuge |
| [userapp/tools/lib/](../userapp/tools/lib) | Gemeinsame Hilfen, Inventar und Ladepläne |
| [userapp/tools/userapp-emulator/](../userapp/tools/userapp-emulator) · [userapp/tools/preview/](../userapp/tools/preview) | Zentral geliefertes Emulator-Submodul und lokale Appvorschau |
| [userapp/tests/](../userapp/tests) | Node-, Browser- und Rhino-Prüfungen mit Fixtures und Support |
| [userapp/deployment/](../userapp/deployment) | Zielkonfiguration und fünf Auslieferungsmanifeste |
| [userapp/references/api/](../userapp/references/api) | Zwei offizielle Dokumentationsstubs |
| [assets/](../assets) | Originalmedien und MyChannel-Hintergründe |
| [docs/](.) | Architektur, Schnittstellen, Betrieb und Prüfbericht |
| [docs/pruefung/oberflaeche/](pruefung/oberflaeche) | App-Prüfbilder |

## Lokal arbeiten

Voraussetzungen: **Git**, **Node.js 24**, **pnpm 11.25.0**, Microsoft Edge für Browserprüfungen und **Java 11+** für Rhino. Der zentrale Emulator einschließlich Windows-Einrichtung verwendet Node.js 24.

Befehle aus `project/userapp/` ausführen; von der Repositorywurzel jeweils `pnpm --dir project/userapp …` verwenden. Bei gesperrten PowerShell-Skripten funktioniert `pnpm.cmd`.

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
| `pnpm run prepare:upload` | Geprüftes Paket im konfigurierten UPLOAD bauen |
| `pnpm run check:upload` | Paket, Quellen und fünf Manifeste vergleichen |
| `pnpm run check:delivery --base-url URL/` | Gewählte öffentliche Auslieferung lesend per SHA-256 vergleichen |

Rhino-JARs einmalig mit `node tools/checks/rhino.cjs --download` beziehen. `MISCHWERK_JAVA` wählt Java; `MISCHWERK_PLAYWRIGHT` eine externe Playwright-Installation. `build:live` ist ein Alias für `prepare:upload`. `MISCHWERK_TEST_UPLOAD` richtet die unterstützten Prüfwerkzeuge auf das gebündelte Appverzeichnis.

## App im zentralen Emulator prüfen

Mit `pnpm run emulator` starten. Unter Windows richtet der erste Start den Abgleich für diese Kopie ein. `pnpm run emulator:setup` erneuert die Einrichtung. `MISCHWERK_EMULATOR_PORT` wählt einen anderen Port, Strg+C beendet den lokalen Server.

[Zentrale Dokumentation](../userapp/tools/userapp-emulator/laufzeit-und-submodul.md) · [Emulatorregeln](../../agent-rules.json)

## Anbindungen

Die App spricht das MischWerk Live Studio und die Website ausschließlich über die im Schnittstellendokument genannten Endpunkte an.

[Schnittstellen](api/API-NACHWEIS.md) · [Sendeplan](betrieb/SENDEPLAN.md) · [Einrichtung und Betrieb](betrieb/INBETRIEBNAHME.md)

## Paketbau und Nachweise

In der [Uploadanleitung](betrieb/INBETRIEBNAHME.md#installation-und-upload) stehen der Einstieg zur Paketprüfung und der Installationsablauf. Standardziel, persönliches Direktziel und Freigabeverfahren beschreibt [Wartung und Bereitstellung](../../agent-rules.json).

Aktuelle Ergebnisse und offene Abnahmen stehen hier:

[App-Prüfbericht und Bilder](pruefung/PRUEFBERICHT.md) · [Native Abnahme](betrieb/LIVE-ABNAHME.md) · [Frontend-Architektur](architektur/ARCHITEKTUR-FRONTEND.md) · [Design](architektur/DESIGN.md)

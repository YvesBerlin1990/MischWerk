<img src="../PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="120" height="120">

# MischWerk

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

[![App-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fpackage.json&label=App&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Build](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FYvesBerlin1990%2FMischWerk%2Fmain%2FPROJEKT%2Fpackage.json&query=%24.buildNumber&label=Build&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Website-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fwebsite%2Fpackage.json&label=Website&color=e6c77b&labelColor=141414)](../PROJEKT/website/README.md)

**App 0.1.402 · Build 402 · Website 0.2.12** · Stand: 14. November 2026.

![Lokale Testansicht der Radioleiste](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

## Funktionen

- **Radio:** Play/Stop, aktuelle Titel und Lautstärke mit Stummschaltung. Die Radioleiste öffnet automatisch; die Wiedergabe beginnt nach Play.
- **Musikwünsche:** Ein freies Textfeld für den Wunsch. Für Hörer erscheint die Wunschbox bei angemeldeter Moderation und freigegebener Wunschannahme. Bestätigte offene Wünsche bleiben über Appupdates und Neustarts gespeichert.
- **Moderation:** Native Anmeldung ohne persönliche PIN, Sendungsthema, Wunschliste und bestätigte Übergabe. Der Lauftext wird über `/lauftext` gepflegt.
- **Sendeplan:** Öffentliche Tagesübersicht aus der Homepage mit Navigation durch vergangene, aktuelle und nächste Kalenderwoche. Die redaktionelle Planung erfolgt auf der Homepage.
- **Verwaltung:** Radio-Team, Bot-Texte und Verbindungseinstellungen für den Channelinhaber über `/mw admin`.
- **Homepage und Android:** Vorbereitete Anbindungen für Senderdaten, gemeinsame Musikwünsche und Wunschfernregie. Einrichtung und ausstehende gemeinsame Abnahmen stehen in der [Betriebsdokumentation](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md).

## Einblicke

| Schmale Radioleiste | Wunschbox | Verwaltung |
| --- | --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png" alt="Radioleiste bei 320 Pixeln" width="240"> | <img src="../PROJEKT/docs/pruefung/oberflaeche/wunschbox/wunschbox-flach-320.png" alt="Wunschbox mit einem freien Textfeld" width="240"> | <img src="../PROJEKT/docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-560.png" alt="Verbindungseinstellungen im Verwaltungsmenü" width="300"> |

![Tagesplan mit Sendung davor und danach](../PROJEKT/docs/pruefung/oberflaeche/sendeplan/sendeplan-tag-640.png)

Die Bilder zeigen lokale Testmodelle mit Beispieldaten. Aufnahme- und Prüfstände sowie offene native Abnahmen sind im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md) dokumentiert.

## Lokal starten

Voraussetzungen: **Node.js ab 20** und **pnpm 11.25.0**. Im Repositoryordner:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Das integrierte Testlabor ist unter [127.0.0.1:8776](http://127.0.0.1:8776) erreichbar. Bei gesperrten PowerShell-Skripten `pnpm.cmd` verwenden. Die eigenständige [Website](../PROJEKT/website/README.md) benötigt Node.js ab 22.

## Projekt und Dokumentation

Der Projektcode liegt in [`PROJEKT/`](../PROJEKT/). Die [technische Übersicht](../PROJEKT/README.md) erklärt Ordner, Werkzeuge und Prüfungsbefehle. Verbindliche Projektregeln stehen zentral in [AGENTS.md](../AGENTS.md).

[Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [Testlabor-Bedienhilfe](../PROJEKT/tools/emulator/www/help.html) · [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md) · [Website-Prüfbericht](../PROJEKT/website/docs/PRUEFUNG.md) · [Native Abnahme](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md)

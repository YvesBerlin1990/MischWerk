<img src="../PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="120" height="120">

# MischWerk

[![App-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fpackage.json&label=App&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Build](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FYvesBerlin1990%2FMischWerk%2Fmain%2FPROJEKT%2Fpackage.json&query=%24.buildNumber&label=Build&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Website-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fwebsite%2Fpackage.json&label=Website&color=e6c77b&labelColor=141414)](../PROJEKT/website/README.md)
[![Node.js ab 20](https://img.shields.io/badge/Node.js-%E2%89%A520-5fa04e?logo=nodedotjs&logoColor=white&labelColor=141414)](../PROJEKT/README.md#lokal-arbeiten)
[![JavaScript ES5 / Rhino](https://img.shields.io/badge/JavaScript-ES5%20%2F%20Rhino-f7df1e?logo=javascript&logoColor=141414&labelColor=141414)](../PROJEKT/docs/architektur/ARCHITEKTUR.md)
[![Letzter Commit](https://img.shields.io/github/last-commit/YvesBerlin1990/MischWerk/main?label=Letzter%20Commit&color=e6c77b&labelColor=141414)](https://github.com/YvesBerlin1990/MischWerk/commits/main/)

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

**App 0.1.382 · Build 382 · Website 0.2.11** · Stand: 12. November 2026.

![Aktuelle Radioleiste mit großer Playtaste, getrenntem Titel und Interpret, Lautstärke und goldenen Aktionstasten](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

- **Radio:** HTTPS-Stream mit Play/Stop und aktuellen Titeln direkt vom SPCast-Streamserver. Der goldene Lautstärkeregler steht auf allen Breiten waagerecht unter Thema und Moderationsname. Vinyl-Player und Original-Logo bleiben erhalten. Ein eigener Wunsch erscheint breit nur bei Bedarf; die übrige Fläche nutzen Musik und Sendungsinfo. Während der Wiedergabe leuchten Playtaste und Außenrand.
- **Wunschbox erst bei Live-Moderation:** Hörer sehen den Button erst, wenn sich die Moderation anmeldet und die Wunschannahme freigegeben ist. Im AutoDJ, nach Abmeldung und bei gesperrter Wunschannahme ist er ausgeblendet. Das Öffnen des Moderationsmenüs allein startet keine Sendung. Ein freies Textfeld nimmt den Wunsch auf; bestätigte offene Wünsche bleiben bei Appupdates und Neustarts gespeichert.
- **Moderation:** Native Anmeldung ohne persönliche PIN, Anmelden und Abmelden ohne Zeitlimit, Sendungsthema, private Wunschregie und bestätigte Übergabe an andere Moderatoren. Das Menü bietet die Bereiche Sendung und Wünsche.
- **Lauftext:** /lauftext TEXT setzt und aktiviert die Laufzeile mit automatisch ergänzten +++; --aus/--an erhält den gespeicherten Text.
- **Sendeplan aus der Homepage:** Die App liest die öffentliche Tagesübersicht von [radio-mischwerk.web.app](https://radio-mischwerk.web.app/) mit Thema, Moderationsname und Uhrzeit. Davor, aktuelle Sendung und Danach sind zugeordnet. Auch AutoDJ-Zeilen stammen aus den gelieferten Homepage-Daten; leere Tage und Abruffehler werden ausdrücklich angezeigt. Für den Lesezugriff sind weder ein Verbindungsschlüssel noch eine aktivierte Statusübertragung nötig. Die redaktionelle Planung wird auf der Homepage gepflegt.
- **Verwaltung:** Radio-Team, Bot-Texte und Verbindungseinstellungen auf einer ruhigen flachen Fläche mit kurzen Texten und direkter Textauswahl. Für den Channelinhaber über `/mw admin` erreichbar.
- **Homepage und Android:** Eigene Website mit geschütztem Arbeitsbereich sowie signierte Senderdaten und Musikwünsche über den bestehenden Android-Rückkanal. Einrichtung und Produktionsabnahme sind separat dokumentiert.
- **Begrüßung und Nickliste:** Private Willkommensgrafik mit aktivem Website-Button sowie öffentliche Begrüßung mit goldener Hervorhebung und Profilverlinkung. Für den ersten Satz wird RobotoBold angefordert. Die neuen Original-Icons kennzeichnen Radio-Team, laufende Wiedergabe mit Ton und bestätigte Moderation.

## Einblicke

| Radio bei schmalem Fenster | Waagerechte Lautstärke |
| --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png" alt="Aktuelle Radioleiste bei 320 Pixeln" width="320"> | ![Goldener Regler mit Lautsprecher und Prozentanzeige](../PROJEKT/docs/pruefung/oberflaeche/radio/lautstaerke-gruppe.png) |

**Wunschbox für Hörer: im AutoDJ ausgeblendet, nach angemeldeter Live-Moderation und Freigabe sichtbar.**

![AutoDJ ohne Wunschboxbutton](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-wunschbox-autodj.png)

![Live-Moderation mit freigegebener Wunschbox](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-wunschbox-live.png)

![Radio mit angeschlossenem Lauftext und lokaler Pause-Taste](../PROJEKT/docs/pruefung/oberflaeche/radio/lauftext-1280.png)

Alle **35 App-Screenshots** und die **drei Websiteaufnahmen** wurden am **12. November 2026** mit **Build 382 / Website 0.2.11** erneuert. Sie zeigen den tatsächlichen lokalen Appcode mit Beispieldaten und ersetzen die früheren Aufnahmen. Native Knuddels-Darstellung, Schrift- und Profilklickwirkung bleiben gesondert abzunehmen. Weitere Bilder und Prüfergebnisse stehen im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md).

![Neuer Tagesplan mit Sendung davor und danach](../PROJEKT/docs/pruefung/oberflaeche/sendeplan/sendeplan-tag-640.png)

| Wunschbox | Verwaltung und Verbindung |
| --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/wunschbox/wunschbox-flach-320.png" alt="Wunschbox mit einem freien Textfeld" width="320"> | <img src="../PROJEKT/docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-560.png" alt="Verbindungseinstellungen im Verwaltungsmenü" width="440"> |

## Lokal starten

Voraussetzungen: Node.js ab 20 und pnpm 11.25.0. Im Repositoryordner:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Das integrierte Testlabor öffnet unter [127.0.0.1:8776](http://127.0.0.1:8776) den lokalen Appcode mit Testnutzern und getrennten Radio-/Overlayfenstern. Audio beginnt nach Play.

Die eigenständige [Website](../PROJEKT/website/README.md) benötigt Node.js ab 22. Appadapter und Mailversand sind standardmäßig ausgeschaltet. Offene Produktionsfragen und bekannte Websitebefunde stehen im [Website-Prüfbericht](../PROJEKT/website/docs/PRUEFUNG.md).

## Projekt und Dokumentation

| Ablage | Inhalt |
| --- | --- |
| `PROJEKT/src/backend/` | Gepflegte ES5-/Rhino-Backendmodule |
| `PROJEKT/app/` | Erzeugte Backendlaufzeit und gepflegte Browseroberfläche |
| `PROJEKT/website/` | Homepage und eigener Webserver |
| `PROJEKT/tools/` · `PROJEKT/tests/` | Build, Testlabor und Prüfungen |
| `PROJEKT/docs/` | Architektur, API-Nachweise, Betrieb und aktuelle Prüfbilder |
| `PROJEKT/deployment/` | Zielkonfiguration und fünf Auslieferungsmanifeste |

Der lokale Paketbau bündelt die App für Knuddels im Desktop-UPLOAD. Private Konfigurationen, Zugangsdaten, installierte Abhängigkeiten und UPLOAD gehören nicht ins Repository.

[Technischer Einstieg und Prüfungsbefehle](../PROJEKT/README.md) · [Projektregeln](../PROJEKT/AGENTS.md) · [Testlabor-Bedienhilfe](../PROJEKT/tools/emulator/www/help.html) · [Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [Native Abnahme](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md)

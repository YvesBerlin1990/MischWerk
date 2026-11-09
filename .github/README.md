<img src="../PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="120" height="120">

# MischWerk

[![App-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fpackage.json&label=App&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Build](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FYvesBerlin1990%2FMischWerk%2Fmain%2FPROJEKT%2Fpackage.json&query=%24.buildNumber&label=Build&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Website-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fwebsite%2Fpackage.json&label=Website&color=e6c77b&labelColor=141414)](../PROJEKT/website/README.md)
[![Node.js ab 20](https://img.shields.io/badge/Node.js-%E2%89%A520-5fa04e?logo=nodedotjs&logoColor=white&labelColor=141414)](../PROJEKT/README.md#lokal-arbeiten)
[![JavaScript ES5 / Rhino](https://img.shields.io/badge/JavaScript-ES5%20%2F%20Rhino-f7df1e?logo=javascript&logoColor=141414&labelColor=141414)](../PROJEKT/docs/architektur/ARCHITEKTUR.md)
[![Letzter Commit](https://img.shields.io/github/last-commit/YvesBerlin1990/MischWerk/main?label=Letzter%20Commit&color=e6c77b&labelColor=141414)](https://github.com/YvesBerlin1990/MischWerk/commits/main/)

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

**App 0.1.330 · Build 330 · Website 0.2.7** · Stand: 9. November 2026.

![Aktuelle Radioleiste mit großer Playtaste, getrenntem Titel und Interpret, Lautstärke und goldenen Aktionstasten](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

- **Radio:** HTTPS-Stream mit Play/Stop und Lautstärke. Titel und Interpret werden alle fünf Sekunden direkt vom SPCast-Streamserver abgefragt. Die mittige Musikfläche hat Vorrang; der Lautstärkeregler steht breit senkrecht rechts neben dem Thema und schmal waagerecht darunter. Ein eigener Wunsch erscheint nur bei Bedarf und gibt sonst seine Fläche frei. Während der Wiedergabe leuchten Playtaste und farbiger Außenrand.
- **Wunschbox:** Ein freies Textfeld für Musikwünsche und eine private Anzeige des eigenen Platzes. Bestätigte offene Wünsche bleiben bei Appupdates und Neustarts gespeichert.
- **Moderation:** Anmelden und Abmelden ohne Zeitlimit, Sendungsthema, Wunschregie, „Heute gespielt“, Lauftext und bestätigte Übergabe an andere Moderatoren.
- **Sendeplan:** Das native Overlay ist vollständig zurückgesetzt. Der erhaltene Button bleibt für alle Nutzer einschließlich Inhaber deaktiviert mit **„In Kürze“**. Gespeicherte Wochen und der eigenständige Homepage-Sendeplan bleiben erhalten.
- **Verwaltung:** Radio-Team und Bot-Texte für den Channelinhaber, erreichbar über `/MW Verwaltung`.
- **Homepage und Android:** Eigene Website mit geschütztem Arbeitsbereich sowie signierte Senderdaten und Musikwünsche über den bestehenden Android-Rückkanal. Einrichtung und Produktionsabnahme sind separat dokumentiert.

## Einblicke

| Radio mobil | Aktionen im Detail |
| --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png" alt="Radioleiste bei schmaler Fensterbreite" width="320"> | ![Sendeplan, Wunschbox und Moderation mit zentrierten Beschriftungen](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-buttons.png) |

![Radio mit angeschlossenem Lauftext und lokaler Pause-Taste](../PROJEKT/docs/pruefung/oberflaeche/radio/lauftext-1280.png)

![Moderation mit Sendungsthema und An-/Abmeldung](../PROJEKT/docs/pruefung/oberflaeche/moderation/moderation-780.png)

Die Radioübersichten einschließlich Lauftext zeigen den fertigen lokalen **Build 330** mit Beispieldaten; Detail- und Menübilder behalten ihren dokumentierten Stand **Build 322**. Das native Sendeplan-Overlay ist entfernt; die erhaltene Taste bleibt für alle Nutzer deaktiviert mit „In Kürze“. Gespeicherte Wochen und Homepage-Sendeplan bleiben erhalten. Weitere Bilder und Prüfergebnisse stehen im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md).

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

<img src="../PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="120" height="120">

# MischWerk

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

**App 0.1.239 · Build 239 · Website 0.2.0** — Stand: 6. November 2026.

![MischWerk-Appleiste mit goldenen Tasten und aktivem Wiedergabelicht](../PROJEKT/docs/pruefung/oberflaeche/radio/vinyl-glow-desktop.png)

- **Radio:** HTTPS-Livestream, Play/Stop, Lautstärke und aktuelle Titel.
- **Wunschbox:** Musikwünsche senden und den eigenen Platz privat verfolgen.
- **Moderation:** Sendungsthema, Endzeit oder Open End, Wunschregie und bestätigte Übergabe.
- **Sendeplan:** Wochenübersicht mit Live, AutoDJ und flexiblen Laufzeiten.
- **Verwaltung:** Radio-Team und öffentliche Bot-Texte für den Channelinhaber.

## Einblicke

| Moderation | Sendeplan |
| --- | --- |
| ![Moderation mit Endzeit und Sendungsthema](../PROJEKT/docs/pruefung/oberflaeche/moderation/moderation-780.png) | ![Sendeplan mit Live und AutoDJ](../PROJEKT/docs/pruefung/oberflaeche/sendeplan/sendeplan-sendungen-820.png) |

*Lokale Vorschau mit Beispieldaten; kein Nachweis eines auf Knuddels veröffentlichten Stands.* Weitere Ansichten und Ergebnisse stehen im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md).

## Lokal starten

Im MischWerk-Hauptordner mit Node.js ab 20 und pnpm 11.25.0:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Das integrierte Testlabor ist unter [127.0.0.1:8776](http://127.0.0.1:8776) erreichbar. Es verwendet den echten lokalen Appcode mit Testnutzern und getrennten Radio-/Overlayfenstern. Audio startet erst nach Play.

[Bedienhilfe](../PROJEKT/tools/emulator/www/help.html) · [Ordner und Prüfungsbefehle](../PROJEKT/README.md) · [Codex-Einstieg](../PROJEKT/AGENTS.md#codex-zugriff-auf-den-integrierten-emulator)

## Homepage und Dokumentation

Die [Homepage](../PROJEKT/website/README.md) besitzt eigene Bereiche für Radio, Sendeplan, Team, Mitmachen und Wunschbox sowie einen geschützten Arbeitsbereich. Sie benötigt Node.js ab 22. Appanschluss und Mailversand sind standardmäßig ausgeschaltet; produktive Anbindung und Hosting bleiben gesondert abzunehmen.

[Projektregeln](../PROJEKT/AGENTS.md) · [Architektur](../PROJEKT/docs/architektur/ARCHITEKTUR.md) · [Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [Native Abnahme](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md) · [Website-Prüfbericht](../PROJEKT/website/docs/PRUEFUNG.md)

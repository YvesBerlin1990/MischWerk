<img src="PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="150" height="150">

# MischWerk

Radio-App für den Knuddels-MyChannel **MischWerk** – mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

**App 0.1.223 · Build 223 · Website 0.2.0** — Stand: 5. November 2026.

![MischWerk-Appleiste mit goldenen Tasten und aktivem Wiedergabelicht](PROJEKT/docs/pruefung/oberflaeche/vinyl-glow-desktop.png)

*Die Bilder zeigen den aktuellen lokalen Appcode mit Beispieldaten. Sie belegen keinen auf Knuddels veröffentlichten Stand.*

## Was die App bietet

| Bereich | Funktionen |
| --- | --- |
| Radio | Direkter HTTPS-Stream, Play/Stop, Lautstärke, Stummschaltung, Titel und Interpret. Goldener Playbutton und RGB-Lichthof zeigen tatsächliche Wiedergabe. |
| Wunschbox | Ein Textfeld mit bis zu 300 Zeichen. Eigener Song, Platz und Bearbeitungsstatus erscheinen privat in der Appleiste. |
| Moderation | Anmeldung, feste Endzeit oder Open End, Sendungsthema, manuelle Wunschregie, bestätigte Übergabe und private Notizen. |
| Heute gespielt | Titelmeldungen des aktuellen Tages, ausschließlich für die Moderation; vollständige Texte mit chronologischer Seitennavigation. |
| Sendeplan | Wochenübersicht mit Live, AutoDJ, Ganztags und Open End. Alle dürfen lesen, der Channelinhaber darf bearbeiten. |
| Verwaltung | Radiomoderatoren ernennen und entfernen. Bis zu sechs öffentliche Bot-Texte mit 20, 30, 40 oder 50 Minuten Abstand. |
| Vorhang | Roter Theatervorhang mit Freigabe per Chat; eigene Werbewiedergabe erst nach bewusstem Klick. |

Studiozugriff haben der tatsächliche Channelinhaber und ausdrücklich ernannte Radiomoderatoren. Channelmoderation und Appmanagerrechte allein reichen nicht. Offene Musikwünsche sind bewusst flüchtig und werden bei einem tatsächlichen App-Neustart geleert.

## Neu seit dem letzten GitHub-Stand

- **Erneuerter Audioverbindungsweg:** Ein einziges natives Audioelement und ein zuständiger Verbindungscontroller. Kurze Engpässe erhalten Quelle und Puffer; echte Abbrüche werden bei bestehendem Hörwunsch automatisch neu verbunden. Titel- und Statusabfragen stoppen das Audio nicht. Stop beendet auch weitere Versuche.
- **Ursache der Knuddels-Trennung eingegrenzt:** Im kontrollierten Windows-Test führte das Aussetzen von `/confirm` nach rund zehn Minuten zum Schließen der Headerbar, während Audio noch lief. Der alte Code konnte diese Bestätigung durch wiederholtes Zurücksetzen bei kurzen Nachladephasen verhindern. Build 223 erhält den Bestätigungstermin; tatsächlicher Audiofortschritt und eine passende frische Channelantwort bleiben Voraussetzung. [Messungen und Grenzen](PROJEKT/docs/pruefung/PRUEFBERICHT.md).
- **Überarbeitete Bedienung:** Goldene Vinyl-Tasten, leuchtender Playbutton, vollständig erreichbare Lautstärketaste, hervorgehobene Überschriften und mehr Luft für Texte.
- **Sendeplan und Studio:** AutoDJ-Lücken, Ganztags und Open End im Plan sowie frei wählbare eigene Moderations-Endzeit.
- **Menüs:** Größere Logos, zum Channel passende Außenflächen und ein gemeinsamer Scrollbereich für Bot-Texte.
- **Homepage:** Getrennte öffentliche Bereiche und geschützter Arbeitsbereich; Appanschluss lokal vorbereitet und standardmäßig ausgeschaltet.

Der Knuddels-Ursachentest lief mit dem noch alten Live-Code. Die native Langzeitabnahme des neuen Builds bleibt offen. Ein GitHub-Push installiert die App nicht in Knuddels und veröffentlicht die Homepage nicht.

## Einblicke

| Moderation | Sendeplan |
| --- | --- |
| ![Moderation mit Endzeit und Sendungsthema](PROJEKT/docs/pruefung/oberflaeche/moderation-780.png) | ![Sendeplan mit Live und AutoDJ](PROJEKT/docs/pruefung/oberflaeche/sendeplan-sendungen-820.png) |

| Verwaltung | Wunschbox |
| --- | --- |
| ![Verwaltung der öffentlichen Bot-Texte](PROJEKT/docs/pruefung/oberflaeche/verwaltung-bottexte-560.png) | ![Wunschbox mit einem Eingabefeld](PROJEKT/docs/pruefung/oberflaeche/wunschbox-flach-560.png) |

[Schmale Appleiste](PROJEKT/docs/pruefung/oberflaeche/vinyl-glow-mobil.png) · [Sendeplan auf 320 px](PROJEKT/docs/pruefung/oberflaeche/sendeplan-320.png) · [Theatervorhang](PROJEKT/docs/pruefung/oberflaeche/vorhang-1920.png)

## Lokal starten

Für die Appwerkzeuge: **Node.js ab 20**, **pnpm 11.25.0**, Microsoft Edge für Browserprüfungen und Java 11+ für Rhino. Die eigenständige Website benötigt **Node.js ab 22**.

Aus dem MischWerk-Hauptordner:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Das integrierte Testlabor läuft unter **http://127.0.0.1:8776**. Es verwendet den echten lokalen Appcode in getrennten Frames für Radio und Overlays. Rollen, mehrere Testnutzer, verzögerte Nachrichten, Ressourcenfehler und lokale Anbieterantworten lassen sich prüfen. Testdaten liegen im System-Tempordner; Radio startet erst nach Play.

[Bedienhilfe](PROJEKT/tools/emulator/www/help.html) · [Technische Übersicht und Befehle](PROJEKT/README.md) · [Codex-Einstieg](PROJEKT/AGENTS.md#codex-zugriff-auf-den-integrierten-emulator)

## Prüfstand und Bereitstellung

```powershell
pnpm --dir PROJEKT test
pnpm --dir PROJEKT run test:browser
pnpm --dir PROJEKT run check
pnpm --dir PROJEKT run check:rhino
pnpm --dir PROJEKT run prepare:upload
pnpm --dir PROJEKT run check:upload
pnpm --dir PROJEKT/website test
```

Für die erste Rhino-Prüfung: `node PROJEKT/tools/checks/rhino.cjs --download`.

Der dokumentierte App-Prüfstand umfasst **283 Nodefälle**, **272 Browserfälle** und **je 906 Prüfungen** in Rhino 1.7.7.2 und 1.9.1. Die Website hat **22 eigene Prüfungen**. Ergebnis, Wiederholungsläufe und Grenzen stehen im [App-Prüfbericht](PROJEKT/docs/pruefung/PRUEFBERICHT.md) und [Website-Prüfbericht](PROJEKT/website/docs/PRUEFUNG.md). Lokale K3-/STAPP-Modelle ersetzen keine native Abnahme.

Das vollständige Paket enthält **122 Laufzeitdateien**, darunter **115 Textdateien**, und wird durch **fünf Manifeste** geprüft. Jede ausgelieferte Textdatei und jedes Manifest bleibt unter **9500 Zeichen**. Ganze Quellmodule werden ausschließlich für die Auslieferung reproduzierbar gebündelt, ohne Minifizierung.

Der fest konfigurierte lokale Ausgabeordner ist **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**. Er ist per Gitignore ausgeschlossen. Der Paketbau führt keinen FTP-Upload und keinen Knuddels-Neustart aus. Zur Installation gehören alle Dateien und Unterordner gemeinsam. [Installation und Betrieb](PROJEKT/docs/betrieb/INBETRIEBNAHME.md#installation-und-upload) · [Native Abnahme](PROJEKT/docs/betrieb/LIVE-ABNAHME.md).

## Homepage

Die [Website 0.2.0](PROJEKT/website/README.md) bietet Start/Radio, Sendeplan, Team, Mitmachen und Wunschbox unter eigenen Adressen. Im Arbeitsbereich stehen Moderation, Sendeplanung und Besitzerverwaltung bereit. Die Kopplung verwendet bestätigte Channelkonten und bestehende Appdaten.

![Lokale Vorschau der MischWerk-Homepage](PROJEKT/website/docs/website-startseite.jpg)

Appanschluss und Mailversand sind standardmäßig ausgeschaltet. Hosting, HTTPS und echte Appanbindung sind noch gesondert abzunehmen. [Einrichtung und Grenzen](PROJEKT/website/docs/ANBINDUNG.md).

## Projekt und Dokumentation

| Bereich | Ablage |
| --- | --- |
| App-Laufzeit und Frontend | [PROJEKT/app](PROJEKT/app) |
| Gepflegte Backendquellen | [PROJEKT/src/backend](PROJEKT/src/backend) |
| Integriertes Testlabor | [PROJEKT/tools/emulator](PROJEKT/tools/emulator) |
| Build und Prüfungen | [PROJEKT/tools](PROJEKT/tools) · [PROJEKT/tests](PROJEKT/tests) |
| Originalmedien | [PROJEKT/medien](PROJEKT/medien) |
| Projektregeln | [PROJEKT/AGENTS.md](PROJEKT/AGENTS.md) |
| Aufbau und Gestaltung | [Architektur](PROJEKT/docs/architektur/ARCHITEKTUR.md) · [Frontend](PROJEKT/docs/architektur/ARCHITEKTUR-FRONTEND.md) · [Design](PROJEKT/docs/architektur/DESIGN.md) |
| Schnittstellen | [API-Nachweis](PROJEKT/docs/api/API-NACHWEIS.md) |

Private `.env`-Dateien, Zugangsdaten, Entwicklungsabhängigkeiten und lokale Auslieferungen gehören nicht ins Repository.

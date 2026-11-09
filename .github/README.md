<img src="../PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="120" height="120">

# MischWerk

[![App-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fpackage.json&label=App&color=e6c77b&labelColor=141414)](../PROJEKT/package.json)
[![Website-Version](https://img.shields.io/github/package-json/v/YvesBerlin1990/MischWerk/main?filename=PROJEKT%2Fwebsite%2Fpackage.json&label=Website&color=e6c77b&labelColor=141414)](../PROJEKT/website/README.md)
[![Node.js ab 20](https://img.shields.io/badge/Node.js-%E2%89%A520-5fa04e?logo=nodedotjs&logoColor=white&labelColor=141414)](../PROJEKT/README.md#lokal-arbeiten)
[![Letzter Commit](https://img.shields.io/github/last-commit/YvesBerlin1990/MischWerk/main?label=Letzter%20Commit&color=e6c77b&labelColor=141414)](https://github.com/YvesBerlin1990/MischWerk/commits/main/)

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Moderation, Sendeplan und eigener Homepage.

**App 0.1.311 · Build 311 · Website 0.2.5** — Dokumentation und Bilder: 9. November 2026.

Musik, Sendungsthema und eigener Wunsch verwenden eine gemeinsame Schriftabstufung mit Outfit. Kompaktere Goldtasten schaffen rund 110 px mehr Platz für die Informationen; die Lautstärkeregelung ist kürzer und feiner gezeichnet. Die Playtaste und die vorhandenen Bedienwege bleiben erhalten.

Der Lauftext verwendet lokal Rajdhani Medium und ergänzt automatisch `+++ Text +++`. Der Wunschboxschalter bestätigt Änderungen direkt im bestehenden Status, ohne eine zusätzliche Radioregie-Seite zu erzeugen. Für die Synchronisierung von Sendeplan und Radioteam sind dauerhafte Firebase-ID-Zuordnungen, atomare Quittungen und private Fehlerdiagnose umgesetzt; die gemeinsame native Abnahme folgt nach Installation.

![Aktuelle Appleiste mit abgestimmten Informationsgruppen, feinem Lautstärkeregler und kompakten Goldtasten](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

- **Bedienung:** Kompakte, gut lesbare Tasten für Sendeplan, Wunschbox und Radioregie. Gerundete Konturen, warme Goldränder und dunkle Materialfarben passen zur unveränderten Playtaste; schmale Fenster ordnen die Inhalte passend an.
- **Begrüßung:** Einheitlich „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ für alle User; größere fette Begrüßungszeile in Gold, Nick und Foto als Profillinks, Foto weiterhin am Ende.
- **Lauftext:** Frei einstellbarer Hinweis unter der Appleiste; Text, Tempo, Richtung und Ein/Aus in der Radioregie. Klar begrenzter Textbereich mit weichem Ein- und Auslauf zwischen „Information:“ und der Pause-Taste.
- **Radio:** HTTPS-Livestream, Play/Stop, Lautstärke und aktuelle Titel. Neue Titel erscheinen unabhängig von der AutoDJ-/Live-Abfrage.
- **Wunschbox:** Musikwünsche senden und den eigenen Platz privat verfolgen. Bestätigte offene Wünsche bleiben bei Updates und Neustarts mit Reihenfolge und Bearbeitungsstatus gespeichert.
- **Moderation:** Anmelden und Abmelden ohne Zeitlimit, Sendungsthema, Wunschregie und bestätigte Übergabe. Keine Verlängerung oder automatische Sechs-Stunden-Abmeldung.
- **Sendeplan:** Hörerprogramm für die nächsten 14 Tage ab heute. Sendungstitel, Uhrzeiten und Namen stehen im Vordergrund; freie Zeiten heißen „Musikmix von MischWerk“. Ein reiner Musikplan zeigt im Standardfenster fünf Tage pro Seite. Automatische Studioeinträge erscheinen für Hörer ab fünf Minuten und mit vollen Anfangsstunden; der Inhaber kann abgeschlossene und manuelle Einträge direkt entfernen.
- **Verwaltung:** Radio-Team und öffentliche Bot-Texte für den Channelinhaber.
- **Android-Anbindung:** Signierte Senderdaten einschließlich Lauftext; Android-Musikwünsche gelangen über Statusantworten in dieselbe dauerhafte Wunschqueue. Für die Einrichtung genügt der private Sync-Schlüssel.

Der öffentliche **Sendeplan-Button bleibt bewusst auf „In Kürze“**. Otterchen als anwesender Channelinhaber kann die Ansicht bereits öffnen. Die folgenden Kalenderbilder zeigen die lokale Höreransicht.

## Einblicke

| Appleiste mobil | Aktionsbuttons im Detail |
| --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png" alt="Mobile Appleiste mit drei Informationsgruppen und kompakten Aktionen" width="320"> | ![Kompakte gerundete Tasten für Sendeplan, Wunschbox und Radioregie; Wunschbox hier deaktiviert](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-buttons.png) |

[Mittlere Fensterbreite](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-mittel.png) · [Radio im festen mobilen Header](../PROJEKT/docs/pruefung/oberflaeche/radio/vinyl-glow-mobil.png)

![Lauftext mit lokaler Rajdhani Medium und automatisch ergänzten Pluszeichen unter der aktuellen Appleiste](../PROJEKT/docs/pruefung/oberflaeche/radio/lauftext-1280.png)

| Radioregie | Hörer-Sendeplan |
| --- | --- |
| ![Radioregie mit An-/Abmeldung, Übergabe und Sendungsthema](../PROJEKT/docs/pruefung/oberflaeche/moderation/moderation-780.png) | ![Hörerprogramm mit Sendungstiteln, Zeiten und Namen](../PROJEKT/docs/pruefung/oberflaeche/sendeplan/sendeplan-hoerer-720.png) |

*Lokale Vorschau mit Beispieldaten; kein Nachweis eines auf Knuddels veröffentlichten Stands.* Weitere Ansichten und Ergebnisse stehen im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md).

## Projektablage

Die GitHub-Übersicht liegt unter `.github/README.md`. Der technische Einstieg steht in [PROJEKT/README.md](../PROJEKT/README.md); die verbindlichen Regeln in [PROJEKT/AGENTS.md](../PROJEKT/AGENTS.md).

| Ablage unter PROJEKT | Inhalt |
| --- | --- |
| `src/backend/` · `app/server/` | Backendquellen und daraus erzeugte Laufzeit |
| `app/www/` | Appoberfläche; Styles in Fachordnern unter `css/` |
| `website/public/` · `website/server/` | Homepage und regulärer Webserver |
| `tools/` · `tests/` | Build, Testlabor und Prüfungen |
| `docs/` · `docs/pruefung/oberflaeche/` | Dokumentation und Prüfbilder nach Themen |
| `deployment/` | Zielkonfiguration und fünf Auslieferungsmanifeste |

Das Knuddels-Paket wird lokal im festen Desktop-UPLOAD vorbereitet: 135 Auslieferungsdateien statt 153 Dateien im App-Arbeitsbestand. Vollständig gebündelte Einzeldateien werden nicht doppelt hochgeladen; die Quellmodule und fachlichen Ordner bleiben erhalten. Das Paket gehört nicht ins Repository; ebenso bleiben private Konfigurationen und installierte Abhängigkeiten außerhalb des Gitbestands.

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

Die Android-Anbindung benötigt keinen Android-WebHook und keinen zusätzlichen Relay-Schlüssel. Einrichtung, Aktivierung und offene native Abnahmen sind in [Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md#regulärer-rückkanal-ab-build-289) beschrieben; den technischen Vertrag dokumentiert die [Android-Übergabe](../PROJEKT/docs/api/ANDROID-RELAY-HANDOFF.json). Sendeplan und Radioteam verwenden ebenfalls den bestehenden signierten Statusweg; die [aktuelle Vertragsrückantwort](../PROJEKT/docs/api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md) hält den abgestimmten Vertrag und die noch offenen gemeinsamen Nachweise fest.

[Projektregeln](../PROJEKT/AGENTS.md) · [Architektur](../PROJEKT/docs/architektur/ARCHITEKTUR.md) · [Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [Native Abnahme](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md) · [Website-Prüfbericht](../PROJEKT/website/docs/PRUEFUNG.md)

Das native Channel-Thema lässt sich über `/settopic TEXT` einschließlich KCode setzen.

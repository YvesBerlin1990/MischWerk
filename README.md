<img src="PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="150" height="150">

# MischWerk

Radio-App für den Knuddels-Channel **MischWerk**. Die App verbindet den RadioKing-Player mit Musikwünschen, Moderation, Sendeplan und einer Statuszentrale für den Channelinhaber.

**Aktueller Projektstand: 0.1.106 · Stand: 2. November 2026**

Die Versionsnummer beschreibt den Stand im Repository. Welche Fassung tatsächlich in Knuddels läuft, steht im App-Log. Ein GitHub-Push installiert oder aktualisiert die App nicht automatisch.

## Funktionen

| Bereich | Inhalt |
| --- | --- |
| Radioleiste | RadioKing-Stream, aktueller Titel und Interpret, öffentliche Hörerzahl, Play/Stop, Lautstärke und Stummschaltung |
| Wunschbox | Musikwünsche mit einem Feld für Interpret und Titel, Versandbestätigung und serverseitiger Prüfung |
| Moderation | Studio-Anmeldung, Sendungsthema, Wunschbox öffnen/schließen und offene Musikwünsche bearbeiten |
| Sendungsübergabe | Laufende Moderation an ein berechtigtes Teammitglied übergeben |
| Radio-Team | Radiomoderatoren ernennen oder entfernen |
| Statuszentrale | RadioKing-Übertragung, LIVE/AutoDJ, Studio-Anmeldung, Hörerzahl, Titelservice, App-Verbindung, Wunschbox, offene Musikwünsche und Thema |
| Sendeplan | Datierte Wochenübersicht mit Moderator, Uhrzeit und Thema; Planung weiterer Wochen und Monate |
| Vorhang | Radioleiste global verhüllen oder freigeben; eigener Button für die bereitgestellte Radio-Werbung |

Wunschbox, Moderation, Radio-Team und Sendeplan öffnen in eigenen Fenstern. Dabei bleibt die Radioleiste mit laufender Wiedergabe erhalten. Die Oberflächen passen sich breiten und schmalen Fenstern an.

### Vorhang und Werbung

Der Vorhang startet bei fehlendem gespeicherten Zustand geschlossen. **Otterchen und Polaroid** sehen die Radioleiste direkt. Nur **Otterchen als tatsächlicher Channelinhaber** erhält den Schalter zum globalen Öffnen und Schließen. Der Zustand bleibt über App-Neustarts hinweg gespeichert.

**Werbung starten** spielt die eigene MP3 beim jeweiligen Hörer nach dessen Klick ab. Ein weiterer Klick stoppt sie. Die Datei lädt erst beim Start; die Anfangslautstärke beträgt höchstens 10 %. Der Werbeklick und das Ende der MP3 ändern den Vorhangzustand nicht. Beim bewussten Start der Werbung wird ein laufender Radiostream gestoppt, damit beide Tonquellen nicht gleichzeitig spielen.

### Rollen und Berechtigungen

| Aktion | Berechtigung |
| --- | --- |
| Radio hören, Sendeplan lesen, Wünsche bei geöffneter Wunschbox senden | Hörer |
| Moderationsfenster, Thema, Wunschbox-Steuerung und Musikwünsche bearbeiten | Channelinhaber oder von ihm ernannte Radiomoderatoren |
| Radio-Team verwalten und Statuszentrale öffnen | Tatsächlicher Channelinhaber |
| Sendungen im Sendeplan anlegen, bearbeiten und löschen | Tatsächlicher Channelinhaber |
| Vorhang global öffnen und schließen | Otterchen mit Channelinhaberrecht |
| `/update` ausführen | Im Channel anwesende Appmanager einschließlich Channelinhaber |

Channelmoderatoren und Appmanager erhalten dadurch nicht automatisch Radiomoderatorenrechte. Identität, Sitzung und Berechtigungen werden im Backend geprüft.

## Projektstruktur

```text
MischWerk/
├── README.md                     Projektübersicht auf GitHub
├── AGENTS.md                     Verweis auf die zentralen Projektregeln
├── ANLEITUNGEN/                  Installation und RadioKing-Einrichtung
│   └── Paket/                    Manifeste, Prüfsumme und lokal erzeugtes ZIP
├── PROJEKT/                      Technische Projektwurzel
│   ├── src/backend/              Gepflegte Backendmodule
│   ├── app/
│   │   ├── main.js               Kurzer Einstieg ohne Fachlogik
│   │   ├── app.config            Knuddels-Konfiguration
│   │   ├── server/               Erzeugte Backend-Laufzeitkopien
│   │   └── www/                  Browseroberfläche, Logo und Werbe-MP3
│   ├── deployment/               Uploadziel ohne Passwort
│   ├── docs/                     Architektur, Betrieb und Prüfbericht
│   ├── references/api/           Knuddels-/K3-Referenzen
│   ├── tests/                    Backend-, Browser- und Rhino-Prüfungen
│   └── tools/                    Vorschau, Prüfungen und Paketbau
└── UPLOAD/MischWerk/             Lokal erzeugter fertiger Uploadordner
```

`UPLOAD/`, die erzeugten ZIP-Dateien, `node_modules/` und lokale Konfigurationsdateien sind per `.gitignore` ausgeschlossen. Nach dem Klonen entstehen Uploadordner und ZIP durch den Paketbau. Die Manifeste und Prüfsummen im Repository dokumentieren den zuletzt gebauten Stand.

## Lokal einrichten und ansehen

Voraussetzungen:

- Zugriff auf dieses private GitHub-Repository und Git.
- Node.js ab Version 20 gemäß [package.json](PROJEKT/package.json), pnpm **11.25.0** gemäß `packageManager`.
- Microsoft Edge für die Browserprüfungen mit Playwright.
- Java 11 oder neuer für die Rhino-Prüfungen.
- Windows mit `powershell.exe` für den vorhandenen ZIP-Paketbau und die ZIP-Prüfung.

```powershell
git clone https://github.com/YvesBerlin1990/MischWerk.git
cd MischWerk\PROJEKT
pnpm install --frozen-lockfile
pnpm run preview
```

Die Vorschau läuft unter **http://127.0.0.1:8765**. Dort lassen sich Hörer- und Besitzeransicht öffnen. Sie arbeitet mit lokalen Knuddels-Ersatzobjekten und Beispieldaten; der echte RadioKing-Stream ist in dieser Demo deaktiviert. Beenden mit `Strg+C`.

Alle folgenden Befehle werden aus **`PROJEKT/`** ausgeführt.

## Entwicklung und Prüfungen

Backendänderungen erfolgen in `src/backend/`. Der Build überträgt sie nach `app/server/`. Änderungen an der Browseroberfläche erfolgen direkt in `app/www/`.

| Befehl | Zweck |
| --- | --- |
| `pnpm run build:backend` | Backend-Laufzeitdateien und kurzen Einstieg erzeugen |
| `pnpm test` | Backend-, Vorschau-, Sendeplan-, Studioansagen- und Übergabefälle prüfen |
| `pnpm run check` | Syntax, Architektur, API-Signaturen, Inventar und Textlängen prüfen |
| `pnpm run test:browser` | Oberflächen und Abläufe mit Playwright/Microsoft Edge prüfen |
| `pnpm run check:rhino` | Backend in Rhino 1.7.7.2 und 1.9.1 prüfen |
| `pnpm run check:lengths` | Laufzeittexte auf die Grenze von weniger als 9.500 Zeichen prüfen |
| `pnpm run build:live` | Prüfungen ausführen und vollständiges Uploadpaket erzeugen |
| `node tools/check-package.cjs` | Upload, ZIP, Manifeste, Hashes und Textlängen abgleichen |

Für die erste Rhino-Prüfung die geprüften Engine-Dateien im lokalen Temp-Cache bereitstellen:

```powershell
node tools/check-rhino.cjs --download
```

Bei Bedarf lässt sich der Java-Pfad über `MISCHWERK_JAVA`, der Vorschau-Port über `MISCHWERK_PREVIEW_PORT` und eine externe Playwright-Installation über `MISCHWERK_PLAYWRIGHT` konfigurieren.

Der [aktuelle Prüfbericht](PROJEKT/docs/pruefung/PRUEFBERICHT.md) nennt die tatsächlich ausgeführten Prüfungen für die jeweilige Version. Lokale Tests ersetzen die Abnahme im echten Knuddels-Client nicht.

## Paket bauen und auf Knuddels übertragen

```powershell
pnpm run build:live
node tools/check-package.cjs
```

Der Paketbau erzeugt **`UPLOAD/MischWerk/`** sowie das aktuelle ZIP, drei Manifeste und die ZIP-Prüfsumme unter **`ANLEITUNGEN/Paket/`**. Er führt keinen FTP-Upload und keinen App-Neustart aus.

1. Den vollständigen Inhalt von `UPLOAD/MischWerk/` per FTP mit explizitem TLS nach **`/ftp/MischWerk`** übertragen. Direkt dort müssen `main.js`, `app.config`, `server/` und `www/` liegen.
2. Das Ende aller Übertragungen abwarten. Bei der ersten Installation MischWerk über **`/apps`** einrichten; die bestätigte Installations-ID lautet **`30807196.MischWerk`**.
3. Bei einer vorhandenen Installation nach dem vollständigen Upload **`/update`** ausführen. Die tatsächlich gestartete Version im App-Log prüfen und die Leiste bei Bedarf mit **`/mischwerk`** erneut öffnen.

Der bestätigte FTP-Host ist `appupload.knuddels.de`, Port 21. Zugangsdaten werden im FTP-Programm eingegeben. Eine leere Dateiliste bei `/update` löst keinen Neustart aus und beweist keinen vollständigen Upload.

Ausführliche Schritte, App-ID, FileZilla-Einrichtung und Fehlerhilfe: **[Installation auf Knuddels](ANLEITUNGEN/INSTALLIEREN-LIVE.md)**.

## Konfiguration und Datenhaltung

- Die öffentliche RadioKing-ID **`mischwerk`** steht in [src/backend/config.js](PROJEKT/src/backend/config.js). Der Hörerstream lautet `https://play.radioking.io/mischwerk`. Titel, Status und Hörerzahl stammen aus den öffentlichen Widget-Endpunkten; Zugangsschlüssel sind dafür nicht hinterlegt.
- Die Hörerzahl benötigt die öffentliche Freigabe in RadioKing. LIVE/AutoDJ in der Statuszentrale folgt der RadioKing-Titelmeldung; die Studio-Anmeldung der App wird getrennt angezeigt. Details: [RadioKing-Einrichtung](ANLEITUNGEN/RADIOKING-EINRICHTUNG.txt).
- Thema, Wunschboxstatus, Radio-Team, Studiozustand, Sendeplan und Vorhangzustand werden über die vorgesehenen Speicherwege verwaltet.
- **Offene Musikwünsche sind absichtlich flüchtig.** Bei einem tatsächlichen App-Neustart beginnt diese Warteschlange leer. Für eine Wartung während einer Sendung diesen Ablauf berücksichtigen.
- Passwörter, Tokens und API-Schlüssel gehören nicht in Quellcode oder Git. Die Dateien in `references/api/` dienen als Dokumentation und werden nicht als Appcode ausgeführt.

## Weitere Dokumentation

| Thema | Anleitung |
| --- | --- |
| Technische Übersicht und Änderungshistorie | [PROJEKT/README.md](PROJEKT/README.md) |
| Architektur und Zustandsbesitz | [Architektur](PROJEKT/docs/architektur/ARCHITEKTUR.md) · [Frontendmodule](PROJEKT/docs/architektur/ARCHITEKTUR-FRONTEND.md) |
| Gestaltung | [Design](PROJEKT/docs/architektur/DESIGN.md) |
| Schnittstellen und Kompatibilität | [API-Nachweis](PROJEKT/docs/api/API-NACHWEIS.md) |
| Betrieb und echte Abnahme | [Inbetriebnahme](PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [LIVE-Abnahme](PROJEKT/docs/betrieb/LIVE-ABNAHME.md) |
| Sendeplan und Audio | [Sendeplan](PROJEKT/docs/betrieb/SENDEPLAN.md) · [Lautstärke](PROJEKT/docs/betrieb/LAUTSTAERKE.md) |
| Aktueller Test- und Paketstand | [Prüfbericht](PROJEKT/docs/pruefung/PRUEFBERICHT.md) |
| Verbindliche Regeln für Änderungen | [PROJEKT/AGENTS.md](PROJEKT/AGENTS.md) |

Projektbetreuung: **[YvesBerlin1990](https://github.com/YvesBerlin1990)** · Channelinhaber: **Otterchen**.

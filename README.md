<img src="PROJEKT/app/www/img/mischwerk-logo.png" alt="MischWerk" width="150" height="150">

# MischWerk

Radio-App für den Knuddels-Channel **MischWerk**. Aktueller lokaler Stand **0.1.117**; STREAMPANEL ist vorbereitet und wartet auf Freischaltung. Der tatsächliche LIVE-Stand ergibt sich aus dem Knuddels-App-Log.

## Schnell finden

| Gesucht | Ablage |
| --- | --- |
| Fertige Dateien für einen späteren Upload | **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/** |
| Installation, Betrieb und STREAMPANEL-Einrichtung | [Betriebsanleitung](PROJEKT/docs/betrieb/INBETRIEBNAHME.md) |
| Entwicklung, Ordner und Befehle | [Technische Übersicht](PROJEKT/README.md) |
| Interaktive Appprüfung mit gezielten Fehlerfällen | [Testlabor starten und bedienen](PROJEKT/README.md#app-im-testlabor-prüfen) |
| Zusätzliche Logos und MyChannel-Hintergrund | [Projektmedien](PROJEKT/README.md#logos-und-mychannel-hintergrund) |
| Aktueller Prüfstand | [Prüfbericht](PROJEKT/docs/pruefung/PRUEFBERICHT.md) |
| Verbindliche Projektregeln | [PROJEKT/AGENTS.md](PROJEKT/AGENTS.md) |

## Funktionen

- Radioleiste mit Play/Stop, Lautstärke, Mute, Titel/Interpret, Moderation, Thema und weißer Hörerzahl.
- Wunschbox als natives Overlay oben rechts im Channel: Versandbestätigung und ausschließlich eigene offene Wunschplätze; Erledigt/Verwerfen in der Moderation lässt Folgeplätze nachrücken.
- Moderation mit Studio-Anmeldung, Sendungsthema, Wunschannahme und bestätigter Sendungsübergabe.
- Radio-Team und Statuszentrale für den tatsächlichen Channelinhaber.
- Sendeplan für alle zum Lesen, für den Channelinhaber zum Bearbeiten.
- Globaler Vorhang und getrennt nach eigenem Klick abspielbare Radio-Werbung.

Studiozugriff haben der tatsächliche Channelinhaber und ausdrücklich ernannte Radiomoderatoren. Channelmoderatoren und Appmanager erhalten dadurch keine zusätzlichen Radiorechte. Ein tatsächlicher App-Neustart leert die bewusst flüchtigen offenen Wünsche.

## Ordnerstruktur

```text
MischWerk/
├── README.md
├── AGENTS.md
├── PROJEKT/
│   ├── app/                      Browseroberfläche und erzeugte Knuddels-Laufzeit
│   ├── src/backend/              Gepflegte Backendquellen
│   ├── medien/                   Original-Logos und MyChannel-Hintergrund
│   ├── deployment/
│   │   ├── live.json             Zielkonfiguration ohne Passwort
│   │   └── manifests/            Vier geprüfte Dateimanifeste
│   ├── tools/
│   │   ├── build/                Backend und Uploadbereitstellung
│   │   ├── checks/               Projekt-, Upload-, Rhino- und Anbieterprüfungen
│   │   ├── emulator/             Integriertes Testlabor mit Fehlerfällen
│   │   ├── lib/                  Gemeinsames Browserinventar
│   │   └── preview/              Lokale Vorschau
│   ├── tests/                    Node, Browser, Rhino, Fixtures und Ersatzobjekte
│   ├── docs/                     Architektur, Schnittstellen, Betrieb und Prüfung
│   └── references/api/           Unveränderte Knuddels-Referenzen
└── UPLOAD/MischWerk/              Verbindlicher Upload im Desktopprojekt
```

Im Codex-Worktree gibt es keine zweite Uploadkopie. Auch ein dort gestarteter Build aktualisiert ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD**. Es werden keine ZIP-Dateien erstellt. Die Dateimanifeste liegen im Arbeits- und Desktopprojekt unter PROJEKT/deployment/manifests.

## Lokal arbeiten

Node.js ab 20, pnpm 11.25.0, Edge für Browserprüfungen und Java 11+ für Rhino. Alle Befehle aus PROJEKT/:

```text
pnpm install --frozen-lockfile
pnpm run preview
pnpm run emulator
pnpm test
pnpm run test:browser
pnpm run test:emulator
pnpm run check
pnpm run prepare:upload
pnpm run check:upload
```

Vorschau: http://127.0.0.1:8765, mit lokalen Ersatzdaten und ohne echten Senderzugriff. Details zu optionalen Prüfungen und Rhino stehen in der [technischen Übersicht](PROJEKT/README.md).

## Integrierter Emulator

Das Testlabor liegt vollständig unter [PROJEKT/tools/emulator](PROJEKT/tools/emulator). Der MischWerk-Projektordner genügt für die Entwicklung und den Zugriff durch Codex; Start- und Prüfwege stehen in den [Projektregeln](PROJEKT/AGENTS.md#codex-zugriff-auf-den-integrierten-emulator). Eine separate Emulator-ZIP oder ein zweiter Projektordner wird nicht benötigt.

Direkt aus dem MischWerk-Hauptordner starten:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Anschließend http://127.0.0.1:8776 öffnen; Strg+C beendet den Server. Die automatische Emulatorprüfung läuft mit `pnpm --dir PROJEKT run test:emulator`.

Der Emulator lädt den echten lokalen Appcode und stellt Radioleiste, Wunsch-Overlay und Verwaltungsfenster in getrennten Frames dar. Mehrere Testnutzer, Rollenwechsel, verlorene oder doppelte Nachrichten, Verzögerungen, Speicherfehler und lokale Anbieterantworten lassen sich gezielt prüfen. Testdaten liegen getrennt im System-Tempordner; Appdateien und Upload werden vom Emulator nur gelesen.

Die [Bedienhilfe](PROJEKT/tools/emulator/www/help.html) erklärt die Fehlerfälle und Diagnose. Die Plattform wird lokal simuliert; echte Knuddels-/K3-/STAPP-/iOS-Prüfungen und der noch ausstehende STREAMPANEL-Zugang bleiben separat erforderlich. Ergebnisse stehen im [aktuellen Prüfbericht](PROJEKT/docs/pruefung/PRUEFBERICHT.md).

## Knuddels-Bereitstellung

Die lokale Bereitstellung führt keinen FTP-Upload, kein Knuddels-Update und keinen Neustart aus. Nach gesondertem Auftrag gehört der Ordner MischWerk aus dem Desktop-UPLOAD nach /ftp. Installation und kontrolliertes Update sind in der [Betriebsanleitung](PROJEKT/docs/betrieb/INBETRIEBNAHME.md#installation-und-upload) beschrieben.

Passwörter, Tokens und Encoder-Zugangsdaten gehören nicht in die App oder Git. Git-Verwaltung und installierte Abhängigkeiten bleiben an ihren vorgesehenen Stellen; UPLOAD und node_modules sind per .gitignore ausgeschlossen.

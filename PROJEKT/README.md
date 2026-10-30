# MischWerk – technische Projektdateien

Lokaler Stand **0.1.28 mit RadioKing**. Lautstärke: Start 40 %, automatische Wiederherstellung höchstens 60 %, darüber rote Hinweiszone mit Warnzeichen. Manuell bleibt 0–100 % frei bedienbar. Prozent ist keine dB-Messung oder Zusage eines sicheren Hörpegels. [Einordnung und Quellen](docs/LAUTSTAERKE.md). Zuletzt bestätigtes Knuddels-LIVE: 0.1.13; weiterhin kein Upload/Neustart.

| Bereich | Inhalt |
| --- | --- |
| `src/backend/` | Gepflegte ES5/Rhino-Module für Konfiguration, Zustand, Aktionen, Ansichten und App-Hooks |
| `app/` | Erzeugte Knuddels-`main.js`, HTMLUI-Frontend und Original-Logo |
| `deployment/live.json` | Bestätigtes Knuddels-Ziel ohne Passwort |
| `tools/` | Vorschau, API-Mock, Checks, lokaler Paketbau und RadioKing-Netzwerkprüfung |
| `tests/` | Backend-/HTTP-/Browserprüfungen und Audiofixture |
| `references/api/` | Unveränderte Knuddels-/K3-Referenzdateien, nicht ausführen |
| `references/design/` | Gestaltungsreferenz des Nutzers |
| `docs/` | Aktuelle API-, Design-, Test- und LIVE-Nachweise |
| `AGENTS.md` | Dauerhafte fachliche Regeln und Prüfabläufe |

## Aktuelle Nutzerordner

- [Upload](../UPLOAD/MischWerk/): ausschließlich sechs fertige Laufzeitdateien.
- [Installation](../ANLEITUNGEN/INSTALLIEREN-LIVE.md) und [RadioKing](../ANLEITUNGEN/RADIOKING-EINRICHTUNG.txt): aktuelle Anleitungen.
- [Paket](../ANLEITUNGEN/Paket/): aktuelles ZIP, Manifest, Prüfsumme.
- [Archiv](../ARCHIV/): historische Pakete, Anbieter-Unterlagen und ältere Prüfungen als geprüftes Sammelarchiv.

Die Startdateien für Vorschau, Paketbau und Explorer liegen eine Ebene höher im MischWerk-Hauptordner. Dort hilft `START-HIER.txt` bei der Orientierung.

## Aus diesem Ordner prüfen

```text
pnpm install --frozen-lockfile
pnpm run build:backend
pnpm test
pnpm run check
pnpm run test:browser
pnpm run build:live
```

Benötigt werden Node.js ab Version 20, pnpm 11 und Microsoft Edge. Playwright ist versionsgenau im Lockfile hinterlegt; eine vorhandene externe Installation kann weiterhin über `MISCHWERK_PLAYWRIGHT` verwendet werden. Der Paketbau schreibt nach `../UPLOAD/MischWerk/` und `../ANLEITUNGEN/Paket/`; er lädt nichts hoch. Der bewusste Netzwerktest `node tools/radioking-compatibility-check.cjs` ruft den echten RadioKing-Stream ab und speichert Nachweise unter `docs/radioking-pruefung/`.

RadioKing ist über `MischWerkConfig.radioking.radioId = 'mischwerk'` eingerichtet. Hörlink `https://play.radioking.io/mischwerk`, getrennte Titel-/Interpretenfelder aus der öffentlichen Widget-API. Die lokale Funktionsdemo bleibt ohne echte Senderverbindung. App-Leiste, Wunschbox-/Studio-/Radio-Team-Popups, Rollen, Nick-/Zustellprüfung, Thema, ON AIR, Original-Logo, #404040 und Scrollfreiheit bleiben erhalten.

Radio-Team 0.1.27: Nur der tatsächliche Channelinhaber verwaltet Radiomoderatoren in einem eigenen Popup außerhalb des Moderationsmenüs. Ernennungen werden serverseitig auf existierende Knuddels-Nicks geprüft und als numerische User-IDs gespeichert. Nur der Channelinhaber und ernannte Radiomoderatoren erhalten Studiozugriff; Channelmoderatoren nicht mehr automatisch. Entzug beendet eine betroffene ON-AIR-Anmeldung sofort.

Moderationsfenster 0.1.28: vollständig als kompakte Broadcast-Konsole neu gestaltet. Rack-Kopf, Mikrofon- und Wunschbox-Steuerung, Sendungsthema und Warteschlange bilden eine klar gegliederte Oberfläche. Der frühere allgemeine Fußtext wurde entfernt; die tatsächliche Ablaufzeit erscheint weiterhin nur bei einer aktiven Studio-Anmeldung.

Deaktivierte Wunschbox: Button gesperrt mit „Deaktiviert“, auch serverseitig kein neues Wunsch-Popup. Moderationsmenü bleibt zum Reaktivieren zugänglich. Vorhandene Wünsche bleiben gespeichert.

Wunschbox 0.1.21: kompaktes einzelnes Formular für Interpret + Titel, ohne eigene Wunschliste. Keine YouTube-/sonstigen Links; client- und serverseitige Prüfung. Nick-Übermittlung und kurze gespeicherte/zugestellte Rückmeldung bleiben erhalten.

Positionierung 0.1.22: ON AIR und Sender-/Moderatorname bilden ab 901 px eine vertikal zur Wunschbox zentrierte Gruppe ohne künstliche Leerzeile. Schild und Name teilen eine Mittelachse, der Abstand beträgt 10 px. Ab 1500 px steht dafür eine 200–220 px breite Spalte zur Verfügung. Eine feine Trennlinie gliedert den Wunschbutton. Der berechtigte Moderationslink bleibt unten rechts und beeinflusst die übrige Geometrie nicht. Layout bei 320–2560 px mit langen Texten geprüft; Höhen und APIs unverändert.

Das Backend ist seit 0.1.26 modular gepflegt. `app/main.js` wird ausschließlich über `pnpm run build:backend` aus `src/backend/*.js` erzeugt; Tests und Paketbau erkennen ein veraltetes Bundle. Radio-Team, Moderationsmenü, Warteschlange und RadioKing-Sendepause sind im [aktuellen Prüfbericht](docs/PRUEFUNG-0.1.28.md) zusammengefasst.

Senderstatus seit 0.1.25: bestätigte RadioKing-Sendepause deaktiviert Play; automatische Freigabe beim Wiederanlauf ohne Autostart. [Nachweise](docs/PRUEFUNG-0.1.28.md).

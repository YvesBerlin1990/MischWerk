# MischWerk – Prüfbericht 0.1.470 / Build 470

Dieser Bericht hält den aktuellen lokalen Prüfstand fest. Frühere Stände stehen in der Git-Historie. Was sich nur in Knuddels selbst abnehmen lässt, steht in der [Live-Abnahme](../betrieb/LIVE-ABNAHME.md); die verbindlichen Vorgaben stehen in [agent-rules.json](../../../agent-rules.json).

## Prüfergebnisse

| Prüfung | Befehl | Ergebnis |
| --- | --- | --- |
| Struktur, Syntax, API-Signaturen, Inventar | `pnpm run check` | bestanden |
| Textgrenzen der Laufzeitdateien | `pnpm run check:lengths` | 138 Dateien, höchstens 9024 von 9500 Zeichen |
| Node-Suite | `pnpm test` | 421 von 421 |
| Browser und Emulator mit Edge | `pnpm run test:browser` | 251 von 251 |
| Rhino 1.7.7.2 und 1.9.1 | `pnpm run check:rhino` | je 13 Suiten und 772 Prüfungen, am Quellstand und am gebündelten Paket |
| Paketbau | `pnpm run prepare:upload` | 145 Dateien, fünf Manifeste auf Build 470 |
| Paketvergleich | `pnpm run check:upload` | bestanden, 102 Textdateien, höchstens 9343 Zeichen |
| Browser und Emulator am gebündelten Paket | `MISCHWERK_TEST_UPLOAD` | 251 von 251 |

Rhino läuft mit Java 21 über `MISCHWERK_JAVA`. Die Suiten starten über `tests/rhino/run.js` mit dem gemeinsamen Plattformmodell `tests/rhino/harness.js`.

## Nicht lokal belegt

- FTP-Upload und Freigabe von Build 470.
- Der erste GitHub-Lauf des Prüfworkflows `pruefung.yml`.
- Native Darstellung, echte Audioausgabe und produktive Synchronisation: siehe [Live-Abnahme](../betrieb/LIVE-ABNAHME.md).

## Prüfbilder

Alle 28 Aufnahmen stammen vom Stand Build 470 und zeigen lokale Testmodelle mit Beispieldaten. Die Browsertests erzeugen sie mit gesetzten Aufnahmeschaltern neu: `MISCHWERK_V2_CAPTURE`, `MISCHWERK_CONNECTION_CAPTURE`, `MISCHWERK_SMILEY_CAPTURE`, `MISCHWERK_BALANCE_CAPTURE` und `MISCHWERK_CAPTURE_OVERLAY` schreiben direkt hierher, die Sendeplan-Tagesansichten entstehen in jedem Lauf. Die X-Mas-Aufnahmen legt jeder Lauf unter `MischWerk-Pruefbilder` im System-Tempverzeichnis ab; sie werden von dort übernommen.

| Bereich | Aufnahmen |
| --- | --- |
| Radio | [breit](oberflaeche/radio/radio-harmonie-breit.png) · [mittel](oberflaeche/radio/radio-harmonie-mittel.png) · [schmal](oberflaeche/radio/radio-harmonie-schmal.png) · [Bereiche mit eigenem Wunsch](oberflaeche/radio/radio-bereiche-mit-wunsch.png) · [ohne Wunsch](oberflaeche/radio/radio-bereiche-ohne-wunsch.png) |
| Radio X-Mas | [1645 px](oberflaeche/radio/xmas-1645-an.png) · [1645 px, Lichter aus](oberflaeche/radio/xmas-1645-aus.png) · [1440 px](oberflaeche/radio/xmas-1440-an.png) · [900 px](oberflaeche/radio/xmas-900-an.png) · [390 px](oberflaeche/radio/xmas-390-an.png) |
| Wunschbox | [Eingabe 320 px](oberflaeche/wunschbox/wunschbox-flach-320.png) · [560 px](oberflaeche/wunschbox/wunschbox-flach-560.png) · [Versandquittung 320 px](oberflaeche/wunschbox/wunschbox-nach-versand-320.png) · [560 px](oberflaeche/wunschbox/wunschbox-nach-versand-560.png) · [Wiederöffnung](oberflaeche/wunschbox/wunschbox-weitere-eingabe.png) · [X-Mas 320 px](oberflaeche/wunschbox/wunschbox-xmas-320.png) · [X-Mas 480 px](oberflaeche/wunschbox/wunschbox-xmas-480.png) |
| Sendeplan | [Tag 640 px](oberflaeche/sendeplan/sendeplan-tag-640.png) · [320 px](oberflaeche/sendeplan/sendeplan-tag-320.png) · [Ganztägig AutoDJ](oberflaeche/sendeplan/sendeplan-autodj.png) · [X-Mas 640 px](oberflaeche/sendeplan/sendeplan-xmas-640.png) · [X-Mas 320 px](oberflaeche/sendeplan/sendeplan-xmas-320.png) |
| Verwaltung | [Anzeige 560 px](oberflaeche/verwaltung/verwaltung-560.png) · [320 px](oberflaeche/verwaltung/verwaltung-320.png) · [Bot-Texte 560 px](oberflaeche/verwaltung/verwaltung-bottexte-560.png) · [320 px](oberflaeche/verwaltung/verwaltung-bottexte-320.png) · [Verbindung 560 px](oberflaeche/verwaltung/verwaltung-verbindung-560.png) · [320 px](oberflaeche/verwaltung/verwaltung-verbindung-320.png) |

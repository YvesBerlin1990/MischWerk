<picture>
  <source media="(max-width: 600px)" srcset="mischwerk-header-schmal.png">
  <img src="mischwerk-header.png" alt="MischWerk – Radio und Community bei Knuddels. Musik hören, Wünsche teilen, gemeinsam erleben." width="1600">
</picture>

# MischWerk · Radio & Community

Radio-App für den Knuddels-MyChannel **MischWerk** mit Musikwünschen, Sendungsanzeige und Tagesplan. Den Appstand führt das [App-Paket](../PROJEKT/package.json), den Webstand das [Website-Paket](../PROJEKT/website/package.json).

![Breite Radioleiste im lokalen Testmodell](../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-breit.png)

| Schmale Radioleiste | Wunschbox | Verwaltung |
| --- | --- | --- |
| <img src="../PROJEKT/docs/pruefung/oberflaeche/radio/radio-harmonie-schmal.png" alt="Radioleiste bei 320 Pixeln" width="240"> | <img src="../PROJEKT/docs/pruefung/oberflaeche/wunschbox/wunschbox-nach-versand-320.png" alt="Wunschbox mit Versandquittung und Schaltfläche für einen weiteren Wunsch" width="240"> | <img src="../PROJEKT/docs/pruefung/oberflaeche/verwaltung/verwaltung-verbindung-560.png" alt="Verbindungseinstellungen in der Verwaltung" width="300"> |

Aufnahmestände und weitere Ansichten stehen im [App-Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md#prüfbilder).

## Lokal starten

Mit Git, Node.js 24 und pnpm 11.25.0 aus der Repositorywurzel:

```powershell
pnpm --dir PROJEKT install --frozen-lockfile
pnpm --dir PROJEKT run emulator
```

Der Emulator ist unter `127.0.0.1:3105` erreichbar. Für die Werkzeuge und die Windows-Einrichtung siehe die [technische Übersicht](../PROJEKT/README.md).

## Dokumentation

[Projektregeln](../AGENTS.md) · [Installation und Betrieb](../PROJEKT/docs/betrieb/INBETRIEBNAHME.md) · [Website](../PROJEKT/website/README.md) · [Website-Prüfbericht](../PROJEKT/website/docs/PRUEFUNG.md) · [Native Abnahme](../PROJEKT/docs/betrieb/LIVE-ABNAHME.md)

# MischWerk – öffentliches Website-Projekt

Der [Paketstand](package.json) gehört zum lokalen Node-Server mit Radio, Sendeplan, Team und Formularen. Die [Anbindungsübersicht](docs/ANBINDUNG.md) führt zu den Projektregeln und Nachweisen.

## Lokal starten

Mit Node.js ab 22, pnpm 11.25.0 und für Browserprüfungen Microsoft Edge:

```powershell
pnpm install --frozen-lockfile
pnpm start
pnpm test
```

Standardadresse ist `127.0.0.1:8766`. Für den Diagnoseadapter siehe [Website und Android-Vorbereitung](../../AGENTS.md#website-und-android-vorbereitung).

## Dateien und Nachweise

[Öffentliche Oberfläche](public/) · [Regulärer Server](server/) · [Lokale Diagnose](tools/preview/) · [Website-Prüfbericht](docs/PRUEFUNG.md)

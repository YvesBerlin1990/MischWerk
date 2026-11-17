# MischWerk – öffentliche Homepage

**Website 0.2.13 · App 0.1.448 / Build 448**

Dieses lokale Node-Projekt enthält öffentlichen Player, Tagesplan, Team, Mitmachen und Wunschformular. Die reguläre redaktionelle Homepage unter www.radio-mischwerk.de arbeitet weiterhin mit ihrem bisherigen Firebase-Betrieb. Der zusätzliche Node-Arbeitsbereich ist entfernt; seine alten Adressen liefern 410.

## Lokal starten

Node.js 22+, pnpm 11.25.0 und Edge für Browserprüfungen:

```powershell
pnpm install --frozen-lockfile
pnpm start
pnpm test
```

Der reguläre Server läuft standardmäßig unter `http://127.0.0.1:8766`. Die isolierte Vorschau benötigt `MISCHWERK_WEBSITE_TEST=1`; sie veröffentlicht nichts. SMTP und produktiver Appadapter sind standardmäßig aus. Der frühere native Wunsch-POST ist stillgelegt; daraus folgt keine neue produktive Firebase-Anbindung dieses lokalen Servers.

## Dateien und Nachweise

`public/` enthält öffentliche Medien/Styles und `js/site/`. `server/` enthält den regulären Server und öffentliche Adapter. `tools/preview/` ist ausschließlich lokale Diagnose. Workspace-/PIN-/Studio-Controller werden nicht mehr bereitgestellt.

[Anbindung](docs/ANBINDUNG.md) · [Prüfbericht](docs/PRUEFUNG.md) · [Projektregeln](../../AGENTS.md)

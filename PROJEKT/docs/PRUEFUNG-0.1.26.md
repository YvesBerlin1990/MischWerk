# MischWerk 0.1.26 – modulares Backend mit erzeugter main.js

30.10.2026. Ausschließlich lokale Strukturänderung, Tests und Paketvorbereitung. Kein FTP-Upload, Knuddels-Update, Serverneustart oder RadioKing-Eingriff. Zuletzt bestätigtes LIVE bleibt 0.1.13.

## Struktur

Das gepflegte Backend liegt nicht mehr vollständig in einer einzelnen Quelldatei. Es ist unter `src/backend/` auf sechs eigenständig syntaktisch prüfbare ES5-Module verteilt:

- `00-config.js`: öffentliche Sender- und Laufzeitkonfiguration.
- `10-runtime.js`: gemeinsamer Laufzeitkern und Hilfsfunktionen.
- `20-state.js`: Persistenz, Rollenprüfung, RadioKing-Konfiguration und Snapshots.
- `30-actions.js`: Wunsch-, Themen- und Moderationsaktionen samt Validierung.
- `40-views.js`: AppContent-Sitzungen, Push-Aktualisierung und Popup-/Leistenansichten.
- `50-app.js`: globaler `App`-Einstieg und dokumentierte Knuddels-Hooks.

`tools/build-backend.cjs` prüft jedes Modul und erzeugt daraus in fester Reihenfolge `app/main.js`. Diese Datei bleibt die einzige Backend-Laufzeitdatei für Knuddels und trägt einen deutlichen Hinweis, dass sie nicht direkt bearbeitet wird. Tests, `tools/check.cjs` und der Paketbau lehnen ein veraltetes oder manuell abweichendes Bundle ab. Der Paketbau erzeugt das Bundle vor seinen Prüfungen neu.

## Kompatibilität

Keine fachliche oder API-seitige Änderung: globales `App`, Hooknamen, Eventtypen, Persistenzschlüssel `mischwerk.state.v1`, Datenformat Version 1, Rollenprüfungen, RadioKing-ID, Frontend und sechs Uploaddateien bleiben erhalten. Die Module verwenden in der Laufzeit weiterhin ES5/Rhino und keine Node-, Browser-, DOM-, `require`- oder private K3-Schnittstelle. Node.js wird ausschließlich vom lokalen Buildwerkzeug verwendet.

Die App-Version wurde wegen des neu erzeugten Backend-Bundles auf 0.1.26 erhöht. Das bisherige Paket und der Prüfbericht 0.1.25 wurden vor dem Neubau mit SHA-256 verifiziert und unter `ARCHIV/` gesichert.

## Prüfung und Paket

- 49 Backend-/HTTP-/Vorschaufälle bestanden.
- 50 Playwright-/Edge-Browserfälle bestanden.
- Bundle-Aktualität, Syntax, lokale API-Signaturen, UI-IDs und Laufzeitgrenzen bestanden.
- Quelle, Uploadordner, ZIP und Manifest enthalten weiterhin exakt sechs freigegebene Laufzeitdateien.
- Original-Logo und sämtliche Frontenddateien sind gegenüber 0.1.25 unverändert.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.26.zip`.
- ZIP-SHA256: `D9F4B455C509A4DFDD57E9ADF9917449C5B2DF60C8B6C25983FCF1978DB8D3E6`.

Die echte Knuddels-/K3-Abnahme bleibt bis zu einer separaten Uploadfreigabe offen. Browser-Mocks und das lokale Bundle bestätigen keine reale K3-Ausführung.

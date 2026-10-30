# MischWerk 0.1.28 – neues Moderationsfenster

Stand: 30.10.2026. Ausschließlich lokal vorbereitet; zuletzt bestätigtes LIVE bleibt 0.1.13. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Änderung

- Das Moderationsfenster ist vollständig als zusammenhängende Broadcast-Konsole neu gestaltet.
- Der Kopf fasst Original-Logo, Titel und Verbindungsstatus in einer dunklen Rack-Fläche zusammen.
- Mikrofon und Wunschbox besitzen eigenständige Steuerkarten mit lokalen Liniensymbolen. Das kleine rote Mikrofon-Statuslicht folgt ausschließlich der bereits serverseitig bestätigten Studio-Anmeldung.
- Das Sendungsthema ist ein kompakter horizontaler Steuerstreifen. Die Warteschlange besitzt eine eigene eingefasste Fläche, eine klarere Aktualisieren-Aktion, neu gestaltete Wunschkarte und kompakte Seitennavigation.
- Bis 600 px wechseln die vorhandenen Reiter weiterhin zwischen Studio und Wünschen. Die neue Oberfläche bleibt bei 320, 390, 600, 601 und 780 px vollständig bedienbar.
- Der frühere Text am unteren Fensterrand („Studio-Anmeldung … Sende-Encoder …“) wurde vollständig aus dem HTML entfernt. Die tatsächliche Ablaufzeit bleibt nur bei einer aktiven Anmeldung in der Mikrofonkarte sichtbar.
- Keine neue Bilddatei, Bibliothek, Rolle, API oder Backendfunktion. Radioleiste, Wunschbox und Radio-Team bleiben funktional und optisch außerhalb des Moderationsfensters unverändert.

## Prüfungen

Bestanden:

```text
node tools/build-backend.cjs
node --test tests/backend.test.cjs tests/preview.test.cjs
node tools/check.cjs
node --test tests/frontend.browser.test.cjs
node tools/radioking-compatibility-check.cjs
node tools/build-install.cjs
```

- 51 Backend-/HTTP-Fälle und 51 Browserfälle, insgesamt 102, ohne Fehler.
- Bestehende Rollen-, Wunsch-, Thema-, ON-AIR-, Radio-Team- und RadioKing-Funktionen unverändert bestanden.
- Neue Studio-Struktur, vollständiges Entfernen des Fußtexts, lange Namen/Wünsche, Tastaturfokus, Reiter, dynamische Höhe und Scrollfreiheit geprüft.
- Abnahmebilder: `docs/studio-pruefung/Studio-Leer-780.png`, `Studio-780.png` und `Studio-Wuensche-320.png`.
- Syntax-, API-, UI-ID-, Bundle- und Sechs-Dateien-Prüfung erfolgreich.
- Der öffentliche RadioKing-Kompatibilitätstest bestätigt weiterhin die eigene Radio-ID und den aktuell gemeldeten Sendepausenstatus; die Studioänderung erzeugt keine Anbieterabfragen.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.28.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.28.zip`.
- ZIP-SHA-256: `335D1A5C5B42E9575ADD0EF7E985FD716D88F0BD9D4171682154FD69E17914B5`.
- Vorheriges ZIP 0.1.27 und sein Prüfbericht wurden mit verifizierten SHA-256-Werten unter `ARCHIV/` gesichert.

Die lokale Edge-/Mock-Prüfung ersetzt keine echte Abnahme im Knuddels-Desktop-/K3-Client. Vor einer später ausdrücklich freigegebenen Veröffentlichung ist das neue Moderationsfenster dort bei normaler und schmaler Breite zu prüfen.

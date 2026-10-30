# MischWerk 0.1.27 – Radio-Team und eindeutige Studio-Berechtigung

Stand: 30.10.2026. Ausschließlich lokal vorbereitet; zuletzt bestätigtes LIVE bleibt 0.1.13. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Änderung

- Channelmoderatoren erhalten keinen automatischen Zugriff mehr auf das Moderationsmenü.
- Der tatsächliche Channelinhaber bleibt dauerhaft für Verwaltung und Studio berechtigt.
- Nur der Channelinhaber sieht in der Radioleiste den getrennten Link **Radio-Team**. Die Verwaltung befindet sich in einem eigenen Popup und nicht im Moderationsmenü.
- Ein existierender Knuddels-Nick wird ausschließlich im Backend über `KnuddelsServer.getUserAccess()` geprüft und in eine numerische User-ID aufgelöst. Persistiert werden maximal 50 eindeutige IDs, keine vom Browser behaupteten Rollen.
- Ernennen und Entfernen verwenden eine eigene Fachrevision gegen parallele Änderungen. Die sichtbare Liste wird serverseitig in Fünferseiten übertragen. Entfernen oder Nutzerlöschung bereinigt die Liste; der Entzug beendet eine betroffene aktive Studio-Anmeldung sofort.
- Bestehende Persistenz bleibt kompatibel: Fehlen die neuen Rollenfelder, startet die Radiomoderatorenliste leer. Wünsche, Wunschbox-Status und Thema bleiben unverändert.
- Die lokale Vorschau bildet das getrennte Radio-Team-Popup ab. Das Backend bleibt in sechs ES5/Rhino-Modulen gepflegt; `app/main.js` ist daraus deterministisch erzeugt.

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
- Rollenabgrenzung, Besitzergrenze, unbekannte/doppelte Nicks, Neustartpersistenz, veraltete Revisionen, separates Popup, sichere Textausgabe und Entzug während ON AIR geprüft.
- Radioleiste bei 320–2560 px sowie Radio-Team bei 320/560 px ohne horizontale Überlagerung geprüft.
- Syntax-, dokumentierte API-Signaturen, UI-IDs, ES5-Bundle-Grenzen und Uploaddateiliste geprüft.
- Der bewusste RadioKing-Netzwerktest bestätigt weiterhin Radio-ID `mischwerk`, numerische ID 950821 und den aktuell gemeldeten öffentlichen Senderstatus. Die neue Rollenfunktion verwendet keine RadioKing-Manager- oder Encoder-Schnittstelle.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.27.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.27.zip`.
- ZIP-SHA-256: `251E312BBDA965609C5A0DAC6A64EB96A0C089CBB7C97996AF3D8DC6E406FEF1`.
- Vorheriges ZIP 0.1.26 und sein Prüfbericht wurden mit verifizierten SHA-256-Werten unter `ARCHIV/` gesichert.

Die lokale Browser- und Mock-Prüfung ersetzt keine echte Abnahme im Knuddels-Desktop-/K3-Client. Vor einer später ausdrücklich freigegebenen Veröffentlichung sind besonders Channelinhaber, Channelmoderator ohne Ernennung, ernannter Radiomoderator und Rechteentzug mit echten Accounts zu prüfen.

# MischWerk 0.1.31 – neuer Wunschtransport

Stand: 30.10.2026. Ausschließlich lokal vorbereitet. Im echten App-Log lief 0.1.30; die Kennung `REQUEST_ADD` zeigte erneut einen Abbruch innerhalb des bisherigen Wunschpfads. Auf ausdrücklichen Nutzerwunsch wurde dieser Pfad nicht weiter korrigiert, sondern vollständig ersetzt. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Vollständiger Neuaufbau

- Das Frontend sendet neue Wünsche ausschließlich als `mw:wish.submit` mit genau `submissionId` und `text`.
- Das Backend besitzt dafür einen eigenständigen Handler außerhalb der allgemeinen Mutationsverarbeitung und antwortet ausschließlich als `mw:wish.receipt`.
- `mw:request` und die allgemeine `mw:result`-Quittung nehmen keine neuen Wünsche mehr an. Der Regressionstest bestätigt, dass der Altweg keinen Queue-Eintrag erzeugt.
- Die Queue wird getrennt vom allgemeinen App-Zustand als JSON-String `mischwerk.wishes.v2` über `AppPersistence.getString/setString` gespeichert. Ein gesperrtes allgemeines `setObject` beeinflusst den Wunschversand nicht.
- Der authentifizierte `User` bleibt die einzige Identitätsquelle. Die User-ID wird ohne numerische Java-/Rhino-Konvertierung als kanonischer Ziffernstring, der Nick als String in einen neu erzeugten reinen JSON-Datensatz übernommen.
- Historische Wünsche aus `mischwerk.state.v1.requests` werden nur dann einmalig migriert, wenn der neue v2-String noch fehlt. Nach erfolgreicher Migration ist ausschließlich der neue Speicher maßgeblich.

## Verhalten und Grenzen

- Es gibt keine persönliche Wunschbegrenzung, keine feste Gesamtanzahl und keine Wartezeit.
- Die Queue bleibt für Knuddels-Ereignisgrenzen serverseitig einzeln paginiert. Ausschließlich technische Quittungsmarker werden auf die neuesten 100 Einträge begrenzt; offene Wünsche werden dabei niemals entfernt.
- Eine wiederholte `submissionId` wird idempotent bestätigt und erzeugt keinen doppelten Wunsch, auch wenn die erste Quittung verspätet eintrifft.
- Erfolg leert nur den unveränderten zugehörigen Entwurf und zeigt weiterhin die gut erkennbare Erfolgskarte. Fehler und Zeitüberschreitung erhalten den Text.
- Studioquittung, Moderator-Nick, Erledigt/Verwerfen, Rechte, Thema und Wunschbox-Schalter bleiben erhalten.

## Offizielle API-Wege

- `Client.sendEvent` → `App.onEventReceived`: <https://developer.knuddels.de/docs/classes/Client.html#method_sendEvent>
- `AppContentSession.sendEvent`: <https://developer.knuddels.de/docs/classes/AppContentSession.html#method_sendEvent>
- `AppPersistence` / `Persistence.getString` und `setString`: <https://developer.knuddels.de/docs/classes/Persistence.html>

Die Nutzdaten beider Ereignisrichtungen liegen deutlich unter der dokumentierten Grenze von 10.000 Zeichen. Es wurde keine private oder undokumentierte K3-Schnittstelle eingeführt.

## Prüfungen

Bestanden:

```text
pnpm install --frozen-lockfile
node tools/build-backend.cjs
node --test tests/backend.test.cjs tests/preview.test.cjs
node tools/check.cjs
node --test tests/frontend.browser.test.cjs
node tools/radioking-compatibility-check.cjs
node tools/build-install.cjs
```

- 54 Backend-/HTTP-Fälle und 51 Browserfälle, insgesamt 105, ohne Fehler.
- Neuer Hin- und Rückweg, abgeschalteter Altweg, String-Persistenz, Altbestandsmigration, Neustart, Idempotenz, Speicherfehler, Entwurfserhalt, Queue-Pagination und mehr als 50 Wünsche sind abgedeckt.
- Der vollständige Browser-Roundtrip zwischen Hörer und Studio verwendet das neue Protokoll.
- Syntax-, API-, UI-ID-, Backend-Bundle- und Sechs-Dateien-Prüfung erfolgreich.
- Der öffentliche RadioKing-Test bestätigt die eigene Radio-ID; alle geschützten Laufzeitdateien blieben während der Netzprüfung unverändert.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.31.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.31.zip`.
- ZIP-SHA-256: `1E626C2148F56C47BAF4215DEC9D0FF9B7DC360F2326D182B98A68CCEB5402EE`.
- Paket 0.1.30 wurde vor dem Archivieren mit `45B204E0205D79A30593286FF651EF687E38342729EB776C7020DFE85BB6C315` verifiziert. Sein Prüfbericht liegt im geprüften `ARCHIV/Nachweise-0.1.30.zip`.

Nach einem später ausdrücklich freigegebenen vollständigen Update muss ein echter Wunsch mit vorhandenem Altbestand abgesendet und in der Moderationswarteschlange kontrolliert werden. Da der alte Wunschpfad nicht mehr existiert, kann `REQUEST_ADD` bei einer neuen Wunschübertragung in 0.1.31 nicht mehr auftreten.

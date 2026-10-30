# MischWerk 0.1.32 – reine Moderationswarteschlange

Stand: 30.10.2026. Ausschließlich lokal vorbereitet. Im echten App-Log lief 0.1.31; die Kennung `WISH_SUBMIT` zeigte weiterhin einen Abbruch im Wunsch-Speicher-/Identitätsunterbau. Auf ausdrücklichen Nutzerwunsch wurde dieser Unterbau vollständig entfernt. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Neuer minimaler Wunschweg

- Das Frontend sendet ausschließlich `mw:wish.submit` mit `submissionId` und `text`.
- Das Backend prüft Wunschbox-Status, Text und Links, übernimmt den authentifizierten Nick und hängt den Wunsch direkt an eine flüchtige serverseitige Queue.
- Der Wunsch erscheint ausschließlich in der Warteschlange des Moderationsfensters. Hörerzustände enthalten keine eigene Wunschliste, Historie oder spätere Zustellanzeige.
- Der Absender erhält unmittelbar über `mw:wish.receipt` die gut erkennbare Meldung „Dein Musikwunsch wurde an die Moderation gesendet.“ Fehler behalten den Entwurf.
- `mischwerk.wishes.v2`, `mischwerk.state.v1.requests`, AppPersistence, Migration und Nutzer-ID-Konvertierung sind an der Wunschannahme nicht beteiligt.
- Beim App-Neustart beginnt die Wunschqueue bewusst leer. Thema, Wunschbox-Schalter und Radio-Team bleiben unabhängig davon persistent.

## Verhalten und Grenzen

- Es gibt keine persönliche Wunschbegrenzung, keine feste Gesamtanzahl und keine Wartezeit.
- Die Moderationsqueue bleibt für das Knuddels-Ereignislimit einzeln paginiert.
- Eine wiederholte `submissionId` wird während der laufenden App idempotent bestätigt und erzeugt keinen zweiten Eintrag.
- Erledigt und Verwerfen entfernen nur den ausgewählten Queue-Eintrag. Andere Hörer erhalten weder Queue-Inhalt noch Absender-Nick.
- Studiozugriff bleibt ausschließlich dem Channelinhaber und den von ihm ernannten Radiomoderatoren vorbehalten.

## Prüfungen

Bestanden:

```text
node tools/build-backend.cjs
node --test tests/backend.test.cjs tests/preview.test.cjs
node --test tests/frontend.browser.test.cjs
node tools/check.cjs
node tools/radioking-compatibility-check.cjs
node tools/build-install.cjs
```

- 54 Backend-/HTTP-Fälle und 51 Browserfälle, insgesamt 105, ohne Fehler.
- Tests erzwingen, dass `setString`- und `setObject`-Fehler keinen Wunschversand berühren und kein Schlüssel `mischwerk.wishes.v2` entsteht.
- Alte Zustandswünsche werden nicht migriert; ein Neustart liefert eine leere Queue.
- Die Höreransicht bleibt ohne Wunschhistorie, während die Moderation Nick und vollständigen Text sieht.
- 50 beziehungsweise 61 Wünsche werden ohne feste Mengenbegrenzung angenommen und paginiert.
- Der vollständige Browser-Roundtrip bestätigt Versand, Moderationsanzeige, Bearbeitung, Thema und Wunschbox-Steuerung.
- Der öffentliche RadioKing-Test bestätigt den eigenen Senderstatus; geschützte Laufzeitdateien blieben unverändert.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.32.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.32.zip`.
- ZIP-SHA-256: `7F3AE832CF45FCCBA69AE7AF77233C8FB009C588E1C4985C6BE0221C0B6F25C6`.
- Paket 0.1.31 wurde vor dem Archivieren mit `1E626C2148F56C47BAF4215DEC9D0FF9B7DC360F2326D182B98A68CCEB5402EE` verifiziert.

Nach einem später ausdrücklich freigegebenen vollständigen Update muss ein echter Testwunsch gesendet und ausschließlich in der Moderationswarteschlange kontrolliert werden. Im App-Log darf dabei keine `WISH_SUBMIT`- oder Speicherwarnung erscheinen.

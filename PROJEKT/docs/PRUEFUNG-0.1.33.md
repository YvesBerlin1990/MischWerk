# MischWerk 0.1.33 – primitive Laufzeitqueue

Stand: 30.10.2026. Ausschließlich lokal vorbereitet. Im echten App-Log lief 0.1.32; die Kennung `WISH_QUEUE` zeigte einen verbliebenen Abbruch im Laufzeiteintrag. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Änderung

- Queue-Einträge enthalten keine Knuddels-/Java-`User`-Objekte mehr, sondern nur ID, optionale primitive Absenderkennung, Nick, Text, Übertragungs-ID, Zeitpunkt und optionalen Moderationsempfang.
- Die primitive Absenderkennung wird nur zur Löschung personenbezogener Laufzeitdaten verwendet. Jeder Wrapper- oder Konvertierungsfehler wird lokal abgefangen und kann die Wunschannahme nicht abbrechen.
- Der Wiederholungsschutz hält ausschließlich die letzten technischen `submissionId`-Strings, keine Benutzerobjekte.
- Ein erfolgreicher Queue-Eintrag wird unmittelbar über `mw:wish.receipt` bestätigt. Der nachgelagerte Broadcast ist nicht mehr Teil des Annahme-Fehlerpfads und kann keinen bereits angenommenen Wunsch als fehlgeschlagen melden.
- Der Wunsch erscheint weiterhin ausschließlich in der Warteschlange des Moderationsfensters. Es gibt keine Persistenz, Migration, Hörerhistorie oder Mengenbegrenzung.

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
- Der Wrappertest übergibt Java-/Rhino-ähnliche Werte für User-ID und Nick, bestätigt den Queue-Eintrag und verbietet eine `WISH_APPEND`-Warnung.
- Speicherfehler und der nicht vorhandene Schlüssel `mischwerk.wishes.v2` bleiben vollständig vom Wunschweg getrennt.
- 50 beziehungsweise 61 Wünsche werden ohne feste Begrenzung angenommen und moderationsseitig paginiert.
- Hörerzustände enthalten keine Wunschhistorie; der vollständige Browser-Roundtrip bestätigt ausschließlich die direkte Versandmeldung und die Moderationsqueue.
- Der öffentliche RadioKing-Test bestätigt den eigenen Senderstatus; geschützte Laufzeitdateien blieben unverändert.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.33.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.33.zip`.
- ZIP-SHA-256: `D9CCC659078132107668FAEAC1223061D24231F6F510B7B1B6F98A921A1D17DF`.
- Paket 0.1.32 wurde vor dem Archivieren mit `7F3AE832CF45FCCBA69AE7AF77233C8FB009C588E1C4985C6BE0221C0B6F25C6` verifiziert.

Nach einem später ausdrücklich freigegebenen vollständigen Update muss ein echter Testwunsch gesendet und ausschließlich in der Moderationswarteschlange kontrolliert werden. Im App-Log darf dabei weder `WISH_QUEUE` noch `WISH_APPEND` erscheinen.

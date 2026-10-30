# MischWerk 0.1.30 – Wunschpersistenz in der Knuddels-Laufzeit

Stand: 30.10.2026. Ausschließlich lokal vorbereitet. Im echten privaten App-Log wurde die laufende Version 0.1.29 beobachtet; die Moderationsansicht zeigte nach dem fehlgeschlagenen Test weiterhin eine leere Warteschlange. Dadurch ist ein Versionsmix ausgeschlossen und der Abbruch auf den Pfad vor der erfolgreichen Persistenz eingegrenzt. Bei dieser Bearbeitung erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Fehlerbild und Korrektur

- LIVE 0.1.29 zeigte bei „Aha – Take on me (Testwunsch)“ die sichtbare Fehlermeldung und nur die bisherige allgemeine private Warnung. Der Wunsch erschien nicht in der Warteschlange.
- Die lokale Testumgebung lieferte Nutzer-ID und Nick bislang als normale JavaScript-Primitiven. Die echte Knuddels-/Rhino-Laufzeit kann diese API-Werte als Java-Wrapper bereitstellen. Solche Wrapper dürfen nicht unverändert in Vergleiche, Zustandsobjekte und die JSON-Persistenz gelangen.
- 0.1.30 führt zentrale Helfer ein, die jede Nutzer-ID in eine endliche positive Ganzzahl und jeden Nick in einen JavaScript-String umwandeln. Wunsch, Zustellung, Studio-Anmeldung, Ansichten, Radio-Team und Nutzerlöschung verwenden dieselben normalisierten Werte.
- Die gesamte JSON-Vorbereitung vor `AppPersistence.setObject` besitzt jetzt einen eigenen sicheren Fehlerpfad. Ein unerwarteter Fehler wird als `PERSIST_PREPARE` gekennzeichnet; der eigentliche Schreibfehler bleibt `PERSIST_WRITE`.
- Der Eventablauf führt zusätzliche kurze Phasenkennungen wie `STATE_LOAD`, `REQUEST_ADD`, `REQUEST_RESULT` und `STATE_BROADCAST`. Dadurch kann ein verbleibender echter Laufzeitfehler gezielt zugeordnet werden, ohne Ausnahmetexte oder Nutzerdaten in das Log zu schreiben.

## Unveränderte Fachregeln

- Es gibt keine persönliche Wunschbegrenzung, keine feste Gesamtanzahl und keine Wartezeit.
- Offene Wünsche werden nicht automatisch verworfen oder für technische Marker gelöscht. Die Queue bleibt einzeln paginiert.
- Nach bestätigter Speicherung erhält der Hörer weiterhin die gut erkennbare Erfolgskarte. Bei einem Fehler bleibt der Entwurf erhalten.
- Channelmoderatoren erhalten nicht automatisch Studiozugriff. Nur der Channelinhaber und von ihm im getrennten Radio-Team ernannte Radiomoderatoren dürfen das Moderationsmenü verwenden.

## Regression und Prüfungen

Der neue Regressionstest ersetzt `getUserId()` und `getNick()` eines Hörers durch Knuddels-/Rhino-ähnliche Wrapperobjekte. Er sendet einen Wunsch, prüft Zahl und String im gespeicherten JSON und liest denselben Wunsch nach einem simulierten Neustart wieder ein.

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
- Wrapper-Normalisierung, JSON-Persistenz, Neustart, unbegrenzte Wunschannahme, Wiederholungs-ID, sichtbares Feedback und Entwurfserhalt sind abgedeckt.
- Syntax-, API-, UI-ID-, Backend-Bundle- und Sechs-Dateien-Prüfung erfolgreich.
- Der öffentliche RadioKing-Test bestätigt die eigene Radio-ID; alle geschützten Laufzeitdateien blieben während der Netzprüfung unverändert.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.30.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.30.zip`.
- ZIP-SHA-256: `45B204E0205D79A30593286FF651EF687E38342729EB776C7020DFE85BB6C315`.
- Paket 0.1.29 wurde vor dem Archivieren mit `CAB86CB1C640881515737B2D8F66747FC17159A77C9A9A947AE30E43927F504A` verifiziert. Sein Prüfbericht liegt im geprüften `ARCHIV/Nachweise-0.1.29.zip`.

Die lokale Regression bildet die beobachtete Laufzeitdifferenz gezielt nach, ersetzt aber keine erneute Abnahme in Knuddels. Nach einem später ausdrücklich freigegebenen vollständigen Update muss der Testwunsch im echten Client abgesendet und in der Warteschlange kontrolliert werden. Falls er wider Erwarten scheitert, liefert das private App-Log nun eine konkrete Phasenkennung statt der bisherigen allgemeinen Warnung.

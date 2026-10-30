# MischWerk 0.1.29 – Wunschversand und Rückmeldung

Stand: 30.10.2026. Ausschließlich lokal vorbereitet; zuletzt bestätigtes LIVE bleibt 0.1.13. Es erfolgten kein FTP-Upload, kein Knuddels-Update und kein Serverneustart.

## Fehlerbild und Korrektur

- Die private App-Log-Warnung und die Meldung im Wunschfenster stammen aus demselben fehlgeschlagenen Backend-Vorgang. Ein Fehler wurde nicht als erfolgreiche Wunschannahme ausgegeben; der Entwurf blieb erhalten.
- Die offizielle Knuddels-AppPersistence erlaubt pro JSON-Objekt maximal 100 KB. Der historische Zustand `cooldowns` wuchs bislang pro Nutzer dauerhaft weiter und wurde beim Laden nur auf einen wahrheitswertigen Wert, nicht auf den erwarteten Objekttyp geprüft.
- 0.1.29 validiert diese rein technischen Wiederholungsmarker beim Laden und vor jedem Schreiben. Es bleiben höchstens die 100 neuesten gültigen Anfrage-IDs erhalten. Schlägt ein Schreibversuch dennoch fehl, wird ausschließlich dieser technische Bestand auf 20 Marker reduziert und einmal erneut gespeichert.
- Offene Wünsche, Wunschtexte, Absender, Zustellungen, Thema, Wunschbox-Status, ON-AIR-Anmeldung und Radio-Team werden durch diese Bereinigung nicht entfernt oder verändert.
- Schlägt auch der zweite Versuch fehl, bleibt der persistente und laufende Zustand unverändert. Der Nutzer erhält eine klare Fehlermeldung, sein Entwurf bleibt stehen und das private App-Log kennzeichnet die Operation ohne interne Fehlermeldungen preiszugeben als `PERSIST_WRITE`.

## Keine Wunschbegrenzung

- Die bisherige feste Gesamtgrenze von 50 Wünschen wurde aus Konfiguration und Backend entfernt.
- Es gibt weder eine persönliche noch eine feste Gesamtanzahl-Begrenzung, keine Wartezeit und keinen automatischen 24-Stunden-Verfall.
- Wünsche bleiben für die Knuddels-Eventgrenze serverseitig einzeln paginiert. Die unvermeidbare physische AppPersistence-Kapazität und die Textlänge von 300 Zeichen bleiben technische Rahmenbedingungen.
- Der Regressionstest legt 61 Wünsche nacheinander an und bestätigt ausdrücklich, dass auch der 51. und alle folgenden angenommen werden.

## Sichtbares Feedback

- Während des Versands erscheint eine neutrale Statuskarte „Wird gesendet …“.
- Nach serverseitig bestätigter Speicherung erscheint eine deutlich eingefasste Erfolgskarte mit goldenem Häkchen und dem Text „Wunsch erfolgreich gespeichert – wartet auf Moderation.“ beziehungsweise dem angemeldeten Moderatornamen.
- Die spätere Studioübergabe wird getrennt als „Wunsch an [Moderator] übergeben.“ bestätigt.
- Fehler besitzen eine eigene warme Markierung, ein Ausrufezeichen und eine assertive ARIA-Live-Region. Erfolg verwendet eine höfliche Status-Live-Region. Das Formular wird ausschließlich nach der passenden Erfolgsbestätigung geleert.

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

- 53 Backend-/HTTP-Fälle und 51 Browserfälle, insgesamt 104, ohne Fehler.
- Altbestand mit 1.500 Wiederholungsmarkern, falscher `cooldowns`-Datentyp, simulierte Speicherknappheit, endgültiger Speicherfehler und Neustartpersistenz sind abgedeckt.
- Keine feste Wunschanzahl, Wunschpagination, Eventlimit, Wiederholungs-ID, Entwurfserhalt, klare Erfolgs-/Fehlerdarstellung und vollständiger Browser-Roundtrip sind geprüft.
- Syntax-, API-, UI-ID-, Bundle- und Sechs-Dateien-Prüfung erfolgreich.
- Der öffentliche RadioKing-Kompatibilitätstest bestätigt weiterhin die eigene Radio-ID und den gemeldeten Sendepausenstatus; alle geschützten Laufzeitdateien blieben während des Netzwerktests unverändert.

## Paket

- Version in `package.json` und `app/app.config`: 0.1.29.
- Uploadordner: `UPLOAD/MischWerk/`, genau sechs freigegebene Laufzeitdateien.
- Aktuelles ZIP: `MischWerk-Knuddels-LIVE-0.1.29.zip`.
- ZIP-SHA-256: `CAB86CB1C640881515737B2D8F66747FC17159A77C9A9A947AE30E43927F504A`.
- Paket 0.1.28 wurde vor dem Verschieben mit `335D1A5C5B42E9575ADD0EF7E985FD716D88F0BD9D4171682154FD69E17914B5` verifiziert. Sein Prüfbericht liegt im geprüften `ARCHIV/Nachweise-0.1.28.zip`.

Die lokale Edge-/Mock-Prüfung ersetzt keine echte Abnahme im Knuddels-Desktop-/K3-Client. Nach einer später ausdrücklich freigegebenen vollständigen Veröffentlichung muss mit vorhandenem AppPersistence-Bestand ein echter Wunsch abgesendet und im Studio geprüft werden.

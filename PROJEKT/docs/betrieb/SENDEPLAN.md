# MischWerk – Sendeplan

Der Button **Sendeplan** steht in der Radioleiste direkt über der Wunschbox. Er öffnet ein eigenes Fenster und bleibt auch bei geschlossener Wunschbox erreichbar. Radioleiste und laufender Ton bleiben bestehen.

## Wochenübersicht

Die Ansicht startet mit der aktuellen Woche von Montag bis Sonntag. Jeder Tag zeigt Wochentag und Datum. Geplante Sendungen enthalten Von-/Bis-Zeit, Moderator und Thema; leere Tage zeigen „Keine Sendung geplant“. Der heutige Tag wird markiert. Zeiten sind deutsche Ortszeit; die Datumsgrenze berücksichtigt MEZ/MESZ unabhängig von der Serverzeitzone.

Mit den Pfeilen wechseln Sie zur vorherigen oder nächsten Woche. **Diese Woche** kehrt zur aktuellen Woche zurück. Solange diese Ansicht ausgewählt bleibt, folgt sie auch dem nächsten Wochenwechsel. Bewusst ausgewählte andere Wochen bleiben stehen. Seit 0.1.47 passt sich die Höhe des nativen Desktopfensters dem Inhalt an und wächst oder schrumpft mit den Sendungen. Es gibt keine Scrollleisten. Reicht die Bildschirmhöhe nicht aus oder gibt der Client eine feste Höhe vor, erscheinen **Zurück**, **Weiter** und eine Seitenangabe unter der Liste. Auch lange einzelne Tage werden vollständig auf Folgeseiten fortgesetzt. Alle Termine werden bei Bedarf über mehrere kleine Datenpakete nachgeladen; diese Übertragung ist unabhängig von der sichtbaren Seiteneinteilung.

Ein Ende vor dem Beginn bedeutet den Folgetag, beispielsweise Sonntag 22:00 bis Montag 02:00. Die Fortsetzung ist auch am Montag der Folgewoche sichtbar. Gleiche Anfangs- und Endzeiten sowie sich überschneidende Sendungen werden zurückgewiesen. Es handelt sich um datierte Einträge, nicht um automatisch wiederkehrende Termine.

## Nur der Channelinhaber bearbeitet

Alle Nutzer können lesen. Ausschließlich der tatsächliche Channelinhaber sieht **Sendung eintragen** und **Bearbeiten** und darf Änderungen speichern. Radiomoderatoren, Channelmoderatoren und Appmanager erhalten dadurch keine Schreibrechte.

1. **Sendung eintragen** öffnen. Die Woche kann vorab über die Pfeile gewählt werden; das ist für Zukunftstermine nicht mehr erforderlich.
2. Datum frei im Kalender auswählen, auch in zukünftigen Wochen, Monaten oder Jahren. Die passende Woche wird automatisch geladen. Bereits eingegebene Zeiten, Nick und Thema bleiben erhalten. **Speichern** wird freigegeben, sobald die Zielwoche geladen ist. Vorhandenen Knuddels-Nick, Anfangs-/Endzeit und Thema bis 80 Zeichen angeben.
3. **Speichern** wählen. Der Moderator muss der Channelinhaber oder ein bereits im Radio-Team ernannter Radiomoderator sein.
4. Zum Ändern **Bearbeiten** an der Sendung wählen. Dort kann die Sendung auch gelöscht werden. Für einen Wechsel in eine andere Kalenderwoche den Eintrag in der alten Woche entfernen und in der Zielwoche neu anlegen.

Die Planung meldet niemanden automatisch im Studio an und steuert keinen Anbieter-Encoder. Die tatsächliche ON-AIR-Anmeldung bleibt unabhängig.

## Verlässliche Änderungen

Das Backend prüft bei jedem Schreibzugriff die authentifizierte Sitzung, tatsächlichen Channelbesitz, Kalenderdaten und Wochenrevision. Ein veralteter Entwurf überschreibt keine zwischenzeitliche Änderung. Bei Speicherfehlern bleibt der Entwurf erhalten. Neue Einträge lassen sich nach einem App-Neustart wieder lesen.

Wochenpläne liegen getrennt vom allgemeinen Appzustand unter `mischwerk.schedule.v1.<Montag>`. Ein eigener Wochenindex ermöglicht die personenbezogene Bereinigung bei Nutzerlöschung. Öffentlich übertragen werden Datum, Zeiten, Nick und Thema, keine interne User-ID. Die flüchtige Wunschqueue und deren unbegrenzte Annahme bleiben unabhängig.

Die Client-/Server-Kommunikation verwendet `mw:schedule.get`, `.data`, `.save`, `.delete`, `.result` und `.changed`. Je Paket höchstens 20 Einträge; der Client setzt die vollständige Woche zusammen und prüft Anfrage-ID sowie Revision der aktuellen und vorherigen Woche. Die übrigen Ansichten erhalten keine zusätzlichen Planlisten im allgemeinen Statuspaket.

Architektur: vier Backendmodule unter `src/backend/schedule/`, sieben Frontendkomponenten unter `app/www/js/schedule/` und das zuständige Stylesheet `app/www/css/schedule.css`. Tests: `tests/node/schedule.test.cjs` und `tests/browser/schedule.browser.test.cjs`. Einzelheiten zum lokalen Paket und verbleibender echter Knuddels-Abnahme: [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md).

Seit 0.1.46 entfällt die Verbindungsplakette im Kopf des Sendeplans. Lade-, Speicher- und Fehlerrückmeldungen erscheinen weiterhin direkt im Plan.

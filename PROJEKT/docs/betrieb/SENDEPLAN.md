# MischWerk – Sendeplan

Stand **0.1.299 / Build 299**. Eigenes natives Channel-Overlay; Radioleiste und Ton bleiben bestehen. Öffentlich ist nur der Kalender. Die Titelhistorie gehört ausschließlich zur berechtigten [Moderation](INBETRIEBNAHME.md#tageshistorie-verwenden).

Der Sendeplan beantwortet für Hörer: Welche Sendung erwartet mich, wann und mit wem? Der Sendungstitel steht als hervorgehobene Überschrift über dem Namen. Freie Musikzeiten heißen **Musikmix von MischWerk**, ein offenes Ende **Ende offen**. Hörer sehen keine Verwaltungsaktionen oder internen Anmeldeprotokolle. Bei reinem Musikplan beginnen die Tageszeilen direkt, ohne zusätzliche Ankündigungszeile. Im breiten Standardfenster passen fünf kompakte Tage auf eine Seite.

Das Datum steht als gemeinsamer Kopf über dem Tagesverlauf. Musikzeiten und Sendungen sind an denselben Textkanten ausgerichtet; im schmalen Fenster stehen Zeit und Inhalt geordnet untereinander. Inhaberaktionen folgen unter der Sendung. Der private Hinweis bei sehr kurzen Anmeldungen bleibt dezent und erhält die volle Textbreite.

## Vorschau ab heute

Die Übersicht beginnt immer mit heute und enthält genau 14 aufeinanderfolgende Tage bis einschließlich heute + 13. Bereits vergangene Tage stehen nicht vor dem heutigen Tag. Die Anzeige springt beim Öffnen nicht zu einer späteren Sendung. Tage zeigen Datum, Zeiten, Sendungstitel und Namen. Freie Zeiten erscheinen als **Musikmix von MischWerk**; daraus entstehen keine zusätzlichen gespeicherten Einträge. Heute und morgen sind markiert. Zeiten gelten in Europe/Berlin einschließlich Sommer-/Winterzeit.

**Weiter** und **Zurück** am unteren Rand führen durch alle 14 Tage. Der Zeitraum steht ausschließlich oben im Kopf. Unten stehen nur Seitennummer und Navigation. **Ab heute** kehrt zur ersten Seite zurück. Der bewusst ausgewählte Eintrag oder Tag bleibt beim Aktualisieren sichtbar, auch wenn zusätzliche Sendungen die Seitennummern verschieben. Nur der Inhaber besitzt zusätzlich die oberen Wochenpfeile für Verwaltung und langfristige Planung. Anfangsgröße **720 × 600 px**, ohne nachträgliche Größenaufträge. Alle Einträge bleiben bei knappen Rahmen über Seiten und natürlichen Überlauf erreichbar.

Der Kopf trennt den Zeitraum mit seinen Pfeilen von den Aktionen darunter. **Ab heute** und Aktualisieren stehen zusammen; **Sendung eintragen** ist für den Inhaber separat angeordnet und rückt bei sehr schmalen Fenstern auf eine eigene volle Zeile. Die Oberfläche zeigt keinen Zeitzonenhinweis.

## Nur der Channelinhaber bearbeitet

Alle dürfen lesen. Nur der tatsächliche Channelinhaber darf eintragen, bearbeiten und löschen; Radiomoderatoren, Channelmoderatoren und Appmanager erhalten keine Schreibrechte.

1. **Sendung eintragen** öffnen und Datum wählen, auch für Nachträge vergangener Sendungen oder zukünftige Wochen. Die Zielwoche wird geladen; Eingaben bleiben erhalten.
2. **Sendeart:** Live mit berechtigtem Moderator oder AutoDJ mit dem Namen MischWerk.
3. **Laufzeit:** Feste Zeit, Ganztags oder Open End. Thema bis 80 Zeichen.
4. **Speichern** bestätigt den Eintrag. Bearbeiten erlaubt Änderungen und Löschen. Wechsel in eine andere Speicherwoche durch Entfernen und erneutes Anlegen.

Direkt an einer Sendung führt **Entfernen** zur Nachfrage am Eintrag. **Abbrechen** erhält die Sendung und führt den Fokus zur Aktion zurück. Das gilt auch für abgeschlossene automatische Studioeinträge. Bei einer noch laufenden Moderation zuerst regulär abmelden; der Kalender beendet keine Sendung.

## Automatische Studioeinträge

Anmeldungen aus der Radioregie erscheinen mit voller Anfangsstunde, beispielsweise **16 Uhr** statt 16:40 Uhr. Zusätzliche minutengenaue An-/Abmeldezeilen entfallen. Manuell geplante Sendungen behalten ihre eingetragenen Uhrzeiten.

Für Hörer erscheinen automatische Einträge erst ab **fünf Minuten** tatsächlicher Dauer. Das gilt auch für bereits vorhandene kurze Testanmeldungen. Der Inhaber sieht kürzere Einträge weiterhin mit dem Hinweis „Unter 5 Minuten · privat“ bei den Inhaberaktionen und kann sie nach dem Abmelden entfernen. Die Filterung verändert keine Studioregistrierung und löscht keine Einträge ungefragt. Die Anzeige nutzt den vorhandenen Aktualisierungsweg.

Bei fester Zeit bedeutet Ende vor Beginn den Folgetag; gleiche Zeiten sind ungültig. Durch die Sommerzeitumstellung entfallende Uhrzeiten werden beim Speichern verständlich abgewiesen. Gültige Sendungen über den Zeitsprung bleiben möglich. Ganztags gilt von 00:00 bis 00:00 am Folgetag. Open End reicht ohne erfundene Endzeit bis zur nächsten geplanten Sendung, gegebenenfalls über Wochen. Feste Überschneidungen werden abgewiesen. Datierte Einträge wiederholen sich nicht automatisch.

Planung meldet niemanden im Studio an und steuert weder AutoDJ noch Encoder. Der frühere Sendungsassistent und Deine Sendezeiten sind entfernt.

## Verlässliche Änderungen

Backend prüft Sitzung, Channelbesitz, Kalenderdaten und Wochenrevision. Veraltete Entwürfe überschreiben keine zwischenzeitliche Änderung; Fehler erhalten Eingaben. Nachträge dürfen tatsächliche automatische Studiozeiten nicht überdecken; ein Anschluss unmittelbar nach der Abmeldung ist möglich. Bei Rechteverlust werden private Eingaben verworfen und die Hörerübersicht ab heute geladen. Wochenpläne bleiben über Neustarts gespeichert, getrennt von der dauerhaften Wunschqueue.

`mw:schedule.*` überträgt kleine Pakete und prüft konsistente Revisionen einschließlich benachbarter Wochen und Open-End-Grenzen. Keine interne User-ID in öffentlichen Daten. Die 14-Tage-Vorschau verbindet zwei oder drei vorhandene Wochen und übernimmt Fortsetzungen nur einmal; Datenpakete und sichtbare Seiten sind getrennt. Die Wochenpersistenz und ihre Bearbeitungsrevisionen bleiben erhalten.

Sechs Backendmodule, sieben Frontendkomponenten sowie `schedule.css` und `schedule-options.css` trennen Fachlogik, Speicherung, Transport und Darstellung. [Prüfbericht](../pruefung/PRUEFBERICHT.md).

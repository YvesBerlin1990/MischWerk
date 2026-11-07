# MischWerk – Sendeplan

Stand **0.1.274 / Build 274**. Eigenes natives Channel-Overlay; Radioleiste und Ton bleiben bestehen. Öffentlich ist nur der Kalender. Die Titelhistorie gehört ausschließlich zur berechtigten [Moderation](INBETRIEBNAHME.md#tageshistorie-verwenden).

## Wochenübersicht

Start mit der aktuellen Woche Montag bis Sonntag. Tage zeigen Datum, Zeiten, Moderation und Thema. Freie Zeiten erscheinen als **AutoDJ (MischWerk)**; daraus entstehen keine zusätzlichen gespeicherten Einträge. Der heutige Tag ist markiert. Zeiten gelten in Europe/Berlin einschließlich Sommer-/Winterzeit.

Pfeile wechseln die Woche, **Diese Woche** kehrt zurück. Bewusst ausgewählte andere Wochen bleiben beim Aktualisieren erhalten. Anfangsgröße **720 × 600 px**, ohne nachträgliche Größenaufträge. Alle Einträge bleiben bei knappen Rahmen über Seiten und natürlichen Überlauf erreichbar.

## Nur der Channelinhaber bearbeitet

Alle dürfen lesen. Nur der tatsächliche Channelinhaber darf eintragen, bearbeiten und löschen; Radiomoderatoren, Channelmoderatoren und Appmanager erhalten keine Schreibrechte.

1. **Sendung eintragen** öffnen und Datum wählen, auch in zukünftigen Wochen. Die Zielwoche wird geladen; Eingaben bleiben erhalten.
2. **Sendeart:** Live mit berechtigtem Moderator oder AutoDJ mit dem Namen MischWerk.
3. **Laufzeit:** Feste Zeit, Ganztags oder Open End. Thema bis 80 Zeichen.
4. **Speichern** bestätigt den Eintrag. Bearbeiten erlaubt Änderungen und Löschen. Wechsel in eine andere Speicherwoche durch Entfernen und erneutes Anlegen.

Bei fester Zeit bedeutet Ende vor Beginn den Folgetag; gleiche Zeiten sind ungültig. Ganztags gilt von 00:00 bis 00:00 am Folgetag. Open End reicht ohne erfundene Endzeit bis zur nächsten geplanten Sendung, gegebenenfalls über Wochen. Feste Überschneidungen werden abgewiesen. Datierte Einträge wiederholen sich nicht automatisch.

Planung meldet niemanden im Studio an und steuert weder AutoDJ noch Encoder. Der frühere Sendungsassistent und Deine Sendezeiten sind entfernt.

## Verlässliche Änderungen

Backend prüft Sitzung, Channelbesitz, Kalenderdaten und Wochenrevision. Veraltete Entwürfe überschreiben keine zwischenzeitliche Änderung; Fehler erhalten Eingaben. Wochenpläne bleiben über Neustarts gespeichert, getrennt von der flüchtigen Wunschqueue.

`mw:schedule.*` überträgt kleine Pakete und prüft konsistente Revisionen einschließlich benachbarter Wochen und Open-End-Grenzen. Keine interne User-ID in öffentlichen Daten. Vollständige Wochen werden vor Darstellung zusammengesetzt; Datenpakete und sichtbare Seiten sind getrennt.

Vier Backendmodule, sieben Frontendkomponenten sowie `schedule.css` und `schedule-options.css` trennen Fachlogik, Speicherung, Transport und Darstellung. [Prüfbericht](../pruefung/PRUEFBERICHT.md).

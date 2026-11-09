# MischWerk – Sendeplan

Stand **0.1.330 / Build 330**, 09.11.2026. Das bisherige native Sendeplan-Overlay ist vollständig zurückgesetzt. Gestaltung, Layout, Kalenderansicht, Editor und deren Frontendmodule sind entfernt. Ein neuer Entwurf ist noch nicht eingebaut.

Der Button in der Appleiste bleibt an seiner Position mit Symbol und Beschriftung **Sendeplan** erhalten. Darunter steht dauerhaft **In Kürze**. Er ist für alle Nutzer einschließlich des Inhabers deaktiviert; Klick, Enter und Leertaste öffnen kein Fenster. Alte Öffnungsaufrufe werden serverseitig abgewiesen und schließen kein anderes Overlay. Alte direkte Sendeplanseiten zeigen einen neutralen Hinweis und starten keine Radio- oder Providercontroller.

Die entfernte native Oberfläche hat keine Anbieter-, Titel-, Historien- oder Kalenderabfragen mehr. Die bestehende Appleiste behält ihren Stream sowie den Liveabruf für Titel und Interpreten; die private Historie bleibt in der berechtigten Moderation.

## Erhaltene Daten und Anbindungen

Gespeicherte Wochen und Revisionen bleiben unverändert unter `mischwerk.schedule.v1.<Montag>` und `mischwerk.schedule.v1.weeks`. Es gibt weder Migration noch Löschung. Automatische Studioeinträge, Fünf-Minuten-Filter, Kalenderberechnung in Europe/Berlin, Überlappungsprüfung und Nutzerbereinigung bleiben erhalten.

Das sitzungsgeprüfte `mw:schedule.*`-Datenprotokoll bleibt für bestehende Fachverträge erhalten, ohne native Overlaybenachrichtigungen. Manuelle native Änderungen benötigen weiterhin die authentifizierte Inhaberberechtigung und passende Wochenrevision; CM-, Appmanager- oder Radiomoderatorenrechte genügen nicht. Planung steuert weder Encoder noch Audio.

Der eigenständige Homepage-Sendeplan und die bestehende Homepage-/Android-Anbindung bleiben aktiv. Der bisher gemeinsam verwendete Kalenderhelfer liegt jetzt ausschließlich unter `website/public/js/site/calendar.js` und wird von der Website über `/calendar.js` geladen. Der reguläre Websiteserver und der isolierte Diagnoseserver bedienen diesen Pfad.

`schedule/commands`, `schedule/relay` und `schedule/storage` behalten die gemeinsamen Fachaktionen sowie dauerhafte Firebase-Zuordnungen und Löschmarker im bestehenden Wochenobjekt. Änderung und Ergebnis werden gemeinsam gespeichert. `android/projection` meldet echte Revisionen über den vorhandenen signierten Statusweg. Es entstehen keine zusätzliche Persistenz und kein neuer Timer.

Die alten nativen Sendeplanbilder sind aus der aktuellen Dokumentation entfernt; frühere Gestaltung bleibt in Git nachvollziehbar. [Prüfbericht](../pruefung/PRUEFBERICHT.md) · [Frontendarchitektur](../architektur/ARCHITEKTUR-FRONTEND.md).

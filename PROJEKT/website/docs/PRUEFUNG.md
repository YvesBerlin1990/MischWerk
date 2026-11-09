# MischWerk – Websiteprüfung 0.2.7

Stand: **09.11.2026**, mit App **0.1.330 / Build 330** lokal geprüft.

## Aktuelle Prüfungen und Bilder

**22/22 eigene Node-/Browserfälle bestanden**, keine übersprungenen Fälle, 10,5 Sekunden. Geprüft sind öffentlicher Player und Navigation, mobile Bedienung, Formulare, geschützter Arbeitsbereich, Channelbestätigung, Sitzungen/CSRF, Rechteentzug, Entwürfe und Antwortverlust. Lokale HTTP-/Knuddels-Modelle und synthetische Anbieterantworten; keine echte Mail oder Channelaktion.

Die bestehenden Anbieterfixtures enthalten den direkten SPCast-Titelpfad aus App Build 323. Website 0.2.7 erhält den waagerechten Homepage-Regler trotz der neuen senkrechten Gestaltung in App Build 326 durch gezielte CSS-Rücksetzungen. Der vorhandene Browserfall prüft Schreibrichtung und 44-px-Reglerhöhe von 1440 bis 320 px ausdrücklich. Gemeinsames Player-DOM und bestehende Website-Ladewege bleiben erhalten. Die erneute vollständige Websiteprüfung mit der größeren Themenschrift aus App 328 besteht ebenfalls. Historische Aufnahmen bleiben ihrem tatsächlichen Stand 322 zugeordnet.

Website 0.2.7 erhält den Homepage-Sendeplan unabhängig vom entfernten nativen App-Overlay. Der unveränderte Kalenderhelfer wurde nach public/js/site/calendar.js verschoben und wird im regulären Server sowie der Diagnose über /calendar.js geladen. Alle 22 Tests bestehen mit App Build 330, einschließlich Kalender, Arbeitsbereich und Radio. Die alten nativen Kalenderdiagnosen sind entfernt; öffentliche Website und Datenverträge bleiben geprüft.

Die drei Aufnahmen wurden am **09.11.2026** aus dem regulären lokalen Websiteserver mit Appkomponenten aus Build 322 erneuert und visuell geprüft:

- [Desktop-Startseite](website-startseite.jpg)
- [Mobile Startseite](website-mobil.jpg)
- [Geschützter Arbeitsbereich](arbeitsbereich.jpg)

Der Arbeitsbereich wird ausschließlich über den vorhandenen lokalen Testadapter angemeldet. Bilder zeigen Beispieldaten; daraus folgt keine produktive Appverbindung oder Veröffentlichung.

## Weiterhin offene Befunde

Die folgenden drei Gegenfälle wurden am 09.11.2026 unabhängig von der regulären Suite reproduziert. Sie sind nicht durch deren grüne Ergebnisse behoben:

| Priorität | Fundstelle | Nachgewiesener Fehler und erforderliche Korrektur |
| --- | --- | --- |
| P2 | `server/site-api.cjs:41–45`, `server/workspace-api.cjs:17` | `raw += part` dekodiert jeden Netzwerkblock separat. Wird ü zwischen seinen beiden UTF-8-Bytes geteilt, bestätigt der öffentliche Wunschweg HTTP 200 und übermittelt „Gr��ße für dich 🎵“. Der authentifizierte Themenauftrag speichert entsprechend „Gr��ße aus der Regie“ und bestätigt Erfolg. Buffer bis zur vollständigen Dekodierung sammeln oder einen zustandsbehafteten UTF-8-Decoder verwenden; das Byte-Limit am tatsächlichen Eingang erhalten. |
| P2 | `public/js/workspace/workspace-schedule.js:5–7,26` | `data-confirm=yes` am Löschbutton ist nicht an die ausgewählte Sendung gebunden und wird beim Editorwechsel nicht gelöscht. Edge-Gegenfall: zwei Sendungen A/B anlegen, A bearbeiten und Löschen einmal anklicken, dann B bearbeiten. B übernimmt „Löschen bestätigen“ und wird mit einem Klick entfernt; A bleibt. Bestätigung an Identität und Revision binden und beim Eintragswechsel, Zurücksetzen, Wochenwechsel sowie Abmelden verwerfen. |
| P2 | `server/server.cjs:21` | Der Produktiveinstieg übergibt `mail:{configured:false}` an `createSiteApi`. Selbst bei `MISCHWERK_APPLICATIONS_ENABLED=true` und vollständig synthetisch befüllter SMTP-Konfiguration meldet `/api/site/content` weiterhin `applicationsAvailable:false`; der Stub besitzt außerdem keine send-Methode. Der separat mit Transportattrappe geprüfte `createApplicationMail` meldet mit derselben Konfiguration true. Den echten Adapter nach vorhandener Konfiguration verdrahten und den deaktivierten Standard erhalten. Keine SMTP-Verbindung und kein Versand im Gegenfall. |

Die bestehende Website-Testhilfe injiziert für Mailtests den Adapter direkt in die Formular-API. Der reguläre Serverpfad, geteilte UTF-8-Zeichen und übernommene Löschbestätigung werden von den vorhandenen Standardfällen noch nicht abgesichert. Gegenfälle verwendeten synthetische Konfiguration; keine SMTP-Verbindung und kein Mailversand.

Der zuvor im Appbericht erwähnte P2-Rechtebefund wurde nach Abgleich der offiziellen, auf den Appchannel bezogenen isChannelOwner-API zurückgenommen. [Einordnung](../../docs/pruefung/PRUEFBERICHT.md#bekannte-befunde-und-offene-abnahme).

## Betrieb und ausstehende Abnahme

Der reguläre Server verwendet keine Testrollen; Diagnoseadapter bleiben auf MISCHWERK_WEBSITE_TEST=1 beschränkt. Öffentliche Bereiche sind Radio, Sendeplan, Team, Mitmachen und Wunschbox mit eigenen Adressen und mobilem Menü. Appadapter und Mailversand sind standardmäßig ausgeschaltet. Der geschützte Arbeitsbereich bietet Moderation ohne Zeitlimit, Wunschregie, Übergabe, Historie, Sendeplan und Inhaberverwaltung.

Vor Veröffentlichung die tatsächliche Hostinglaufzeit **Node.js ab 22**, Domain, HTTPS-Proxy, private Serverumgebung und native App-/WebHook-Anbindung prüfen. Channelrollen, Anwesenheit, Ende-zu-Ende-Verbindung und Mailversand benötigen eigene Abnahme. [Anbindung](ANBINDUNG.md) · [App-Prüfbericht](../../docs/pruefung/PRUEFBERICHT.md) · [Native Abnahme](../../docs/betrieb/LIVE-ABNAHME.md).

# MischWerk – Websiteprüfung 0.2.11

Stand: **12.11.2026**, mit App **0.1.382 / Build 382** lokal geprüft.

## Aktuelle Prüfungen und Bilder

Für den GitHub-Abschluss am 12.11.2026 erneut vollständig geprüft: **22/22 Node-/Browserfälle mit App Build 382 bestanden**. Desktop-Startseite, mobile Startseite und angemeldeter Arbeitsbereich sind am aktuellen lokalen Stand neu aufgenommen und visuell geprüft. Protokolle: `MischWerk-382-GitHub-Website.log` und `MischWerk-382-GitHub-Websitebilder.log` im System-Tempverzeichnis. Die nachfolgend dokumentierten zusätzlichen Websitebefunde bleiben offen.

Website 0.2.11 zeigt und kopiert `/mw homepage CODE` für die bestehende Channelbestätigung. Vorschau und Prüfungen verwenden `/mw admin`; Bridge und serverseitige Freigabe sind gemeinsam angepasst. Einmalcode, Token, PIN, Rechte, Sitzungen und Radio bleiben erhalten. **22/22 eigene Node-/Browserfälle bestanden** mit App 363. Protokoll: `mischwerk-mw-363-website-complete.log` im System-Tempverzeichnis. Keine Veröffentlichung oder echte Channel-/Mailaktion.

Website 0.2.9 ergänzt die getrennte Moderationsanmeldung mit persönlicher PIN. Thema und private Wunschregie sind erst nach deren erfolgreichem Abschluss verfügbar. Deine Sendung, Musikwünsche und der bestehende Kalenderhelfer bleiben erhalten; Historienreiter und Anbieterzugang bleiben entfernt. Die vollständige Websiteprüfung bestätigt Channelkopplung, PIN-Anmeldung, Kalender, private Wunschregie, Rechteentzug und öffentlichen Player.

**22/22 eigene Node-/Browserfälle bestanden**, keine übersprungenen Fälle, 8,5 Sekunden. Geprüft sind öffentlicher Player und Navigation, mobile Bedienung, Formulare, geschützter Arbeitsbereich, Channelbestätigung, Sitzungen/CSRF, Rechteentzug, Entwürfe und Antwortverlust. Lokale HTTP-/Knuddels-Modelle und synthetische Anbieterantworten; keine echte Mail oder Channelaktion.

Mit App Build 340 erneut vollständig geprüft: Der gemeinsame Player und die Vorschau benötigen keinen Vorhangbefehl, Freigabeschritt oder Werbeplayer. Öffentliche Wiedergabe und geschützter Arbeitsbereich bleiben nutzbar.

Die bestehenden Anbieterfixtures enthalten den direkten SPCast-Titelpfad aus App Build 323. Website 0.2.7 erhält den waagerechten Homepage-Regler trotz der neuen senkrechten Gestaltung in App Build 326 durch gezielte CSS-Rücksetzungen. Der vorhandene Browserfall prüft Schreibrichtung und 44-px-Reglerhöhe von 1440 bis 320 px ausdrücklich. Gemeinsames Player-DOM und bestehende Website-Ladewege bleiben erhalten. Die erneute vollständige Websiteprüfung mit der größeren Themenschrift aus App 328 besteht ebenfalls. Die damaligen Aufnahmen aus Build 322 sind inzwischen durch die aktuellen Aufnahmen aus Build 382 ersetzt.

Website 0.2.8 behält den eigenständigen Homepage-Sendeplan und den unveränderten Kalenderhelfer unter public/js/site/calendar.js. Alle 22 Tests bestehen mit App Build 333, einschließlich Kalender, Arbeitsbereich, Radio und der lokalen Sendeplan-Diagnose mit angepasster Anfangshöhe. Die App zeigt einen neuen rein lesenden Tagesplan aus bestätigten Homepage-Einträgen; die externe Planung und der Rückkanalvertrag bleiben unverändert.

Die drei Aufnahmen wurden am **12.11.2026** aus dem regulären lokalen Websiteserver mit Appkomponenten aus Build 382 erneuert und visuell geprüft:

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

PIN-Anmeldung (10.11.2026, Website 0.2.9 / App 343): allgemeine Channelkopplung und Moderationsanmeldung sind getrennt. Persönliche PIN-Einrichtung/-Prüfung auch im Arbeitsbereich und bei Übergabe, Themen-/Queue-Sperre nach Berechtigungsverlust und eigenständige Wunschbox-Ausnahme. 22/22 Websitefälle bestanden, einschließlich echter Appfachaktionen im isolierten Modell. Keine Veröffentlichung oder native Plattformabnahme.

Asynchrone PIN-Prüfung (Website 0.2.10 / App 350): Der bestehende Serveradapter liest ausschließlich laufende PIN-Aktionen mit derselben authentifizierten Anfragekennung erneut. Kurze WebHook-Antworten vermeiden eine offene HTTP-Anfrage während bcrypt; Kostenfaktor und Konto-/Sitzungsprüfung bleiben erhalten. Native Arbeit läuft maximal 60 Sekunden, Bridge und Browser besitzen passende begrenzte Wartezeiten. Die Website-Gesamtprüfung ergibt 21/22 Fälle: sämtliche Workspace-/HTTP-/PIN-Fälle bestehen. Ein unabhängiger Demo-Textfall scheitert am neu vorhandenen Wort „Knuddels“ im Smiley-Hinweis der Verwaltung; dieser Befund betrifft weder PIN-Prüfung noch Rechte und bleibt offen. Keine Veröffentlichung.

# MischWerk – Websiteprüfung 0.2.12

Stand: **12.11.2026**, mit App **0.1.383 / Build 383** lokal geprüft.

## Aktuelle Prüfungen und Bilder

Für die Fehlerkorrektur am 12.11.2026 vollständig geprüft: **26/26 Node-/Browserfälle mit App Build 383 bestanden**, ohne übersprungene Fälle. Vier zusätzliche Regressionstests reproduzieren am vorherigen Stand alle drei dokumentierten Fehler und bestehen nach der Korrektur. Desktop-Startseite, mobile Startseite und angemeldeter Arbeitsbereich sind am aktuellen lokalen Stand neu aufgenommen und visuell geprüft. Protokolle: `MischWerk-383-Website-Gegenfaelle.log`, `MischWerk-383-Website-Final.log` und `MischWerk-383-GitHub-Websitebilder.log` im System-Tempverzeichnis.

Website 0.2.11 zeigt und kopiert `/mw homepage CODE` für die bestehende Channelbestätigung. Vorschau und Prüfungen verwenden `/mw admin`; Bridge und serverseitige Freigabe sind gemeinsam angepasst. Einmalcode, Token, PIN, Rechte, Sitzungen und Radio bleiben erhalten. **22/22 eigene Node-/Browserfälle bestanden** mit App 363. Protokoll: `mischwerk-mw-363-website-complete.log` im System-Tempverzeichnis. Keine Veröffentlichung oder echte Channel-/Mailaktion.

Website 0.2.9 ergänzt die getrennte Moderationsanmeldung mit persönlicher PIN. Thema und private Wunschregie sind erst nach deren erfolgreichem Abschluss verfügbar. Deine Sendung, Musikwünsche und der bestehende Kalenderhelfer bleiben erhalten; Historienreiter und Anbieterzugang bleiben entfernt. Die vollständige Websiteprüfung bestätigt Channelkopplung, PIN-Anmeldung, Kalender, private Wunschregie, Rechteentzug und öffentlichen Player.

**22/22 eigene Node-/Browserfälle bestanden**, keine übersprungenen Fälle, 8,5 Sekunden. Geprüft sind öffentlicher Player und Navigation, mobile Bedienung, Formulare, geschützter Arbeitsbereich, Channelbestätigung, Sitzungen/CSRF, Rechteentzug, Entwürfe und Antwortverlust. Lokale HTTP-/Knuddels-Modelle und synthetische Anbieterantworten; keine echte Mail oder Channelaktion.

Mit App Build 340 erneut vollständig geprüft: Der gemeinsame Player und die Vorschau benötigen keinen Vorhangbefehl, Freigabeschritt oder Werbeplayer. Öffentliche Wiedergabe und geschützter Arbeitsbereich bleiben nutzbar.

Die bestehenden Anbieterfixtures enthalten den direkten SPCast-Titelpfad aus App Build 323. Website 0.2.7 erhält den waagerechten Homepage-Regler trotz der neuen senkrechten Gestaltung in App Build 326 durch gezielte CSS-Rücksetzungen. Der vorhandene Browserfall prüft Schreibrichtung und 44-px-Reglerhöhe von 1440 bis 320 px ausdrücklich. Gemeinsames Player-DOM und bestehende Website-Ladewege bleiben erhalten. Die erneute vollständige Websiteprüfung mit der größeren Themenschrift aus App 328 besteht ebenfalls. Die damaligen Aufnahmen aus Build 322 sind inzwischen durch die aktuellen Aufnahmen aus Build 383 ersetzt.

Website 0.2.8 behält den eigenständigen Homepage-Sendeplan und den unveränderten Kalenderhelfer unter public/js/site/calendar.js. Alle 22 Tests bestehen mit App Build 333, einschließlich Kalender, Arbeitsbereich, Radio und der lokalen Sendeplan-Diagnose mit angepasster Anfangshöhe. Die App zeigt einen neuen rein lesenden Tagesplan aus bestätigten Homepage-Einträgen; die externe Planung und der Rückkanalvertrag bleiben unverändert.

Die drei Aufnahmen wurden am **12.11.2026** aus dem regulären lokalen Websiteserver mit Appkomponenten aus Build 383 erneuert und visuell geprüft:

- [Desktop-Startseite](website-startseite.jpg)
- [Mobile Startseite](website-mobil.jpg)
- [Geschützter Arbeitsbereich](arbeitsbereich.jpg)

Der Arbeitsbereich wird ausschließlich über den vorhandenen lokalen Testadapter angemeldet. Bilder zeigen Beispieldaten; daraus folgt keine produktive Appverbindung oder Veröffentlichung.

## Behobene Befunde · Website 0.2.12

Die drei seit dem 09.11.2026 dokumentierten Gegenfälle sind jetzt korrigiert. Die bestehenden 22 Prüfungen bleiben erhalten; vier neue Fälle sichern die tatsächlichen HTTP-, Server- und Browserwege ab:

| Befund | Korrektur | Nachweis |
| --- | --- | --- |
| Geteiltes UTF-8 im öffentlichen Wunschweg und geschützten Themenauftrag | Eingehende Buffer bis maximal 12000 beziehungsweise 8500 Bytes sammeln und genau einmal dekodieren. | Zwei echte HTTP-Gegenfälle teilen ein mehrbyteiges Zeichen zwischen Netzwerkblöcken. „Grüße für dich 🎵“ und „Grüße aus der Regie 🎵“ kommen unverändert an; übergroße Mehrbyte-Anfragen ergeben 413 ohne Fachänderung. |
| Übernommene Löschbestätigung beim Eintragswechsel | Bestätigung an Woche, Eintrags-ID und Revision binden und bei Editor-, Wochen-, Ansichts-, Rechte- oder Sitzungswechsel zurücksetzen. | Browserfall mit zwei Sendungen: Vormerken von A löscht B nach Auswahl nicht. Neu/Zurücksetzen, Wochenwechsel, Ansichtswechsel, externe Revision und Logout/erneute Anmeldung verlangen neue Bestätigung. Erst der zweite passende Klick entfernt ausschließlich B. |
| Fehlender Mailadapter im regulären Server | Den vorhandenen `createApplicationMail` über den Standard von `createSiteApi` verwenden. | Reeller Serverstart mit synthetischer SMTP-Konfiguration und Transportattrappe: fehlende oder falsche Freigabe bleibt deaktiviert; ausdrückliche Freigabe ermöglicht den Bewerbungsweg. Keine Geheimnisse in öffentlichen Daten, keine echte SMTP-Verbindung oder Mail. |

Die vollständige Suite prüft diese Gegenfälle nun zusätzlich zu Channelkopplung, PIN, CSRF, Rechteentzug, Antwortverlust, öffentlicher Navigation, Kalender und laufendem Radio. Der reguläre Mailserverpfad wird separat von den bisherigen direkt injizierten Formularattrappen geprüft. Keine produktive Verbindung oder Veröffentlichung aus den lokalen Erfolgen ableiten.

Der zuvor im Appbericht erwähnte P2-Rechtebefund wurde nach Abgleich der offiziellen, auf den Appchannel bezogenen isChannelOwner-API zurückgenommen. [Einordnung](../../docs/pruefung/PRUEFBERICHT.md#bekannte-befunde-und-offene-abnahme).

## Betrieb und ausstehende Abnahme

Der reguläre Server verwendet keine Testrollen; Diagnoseadapter bleiben auf MISCHWERK_WEBSITE_TEST=1 beschränkt. Öffentliche Bereiche sind Radio, Sendeplan, Team, Mitmachen und Wunschbox mit eigenen Adressen und mobilem Menü. Appadapter und Mailversand sind standardmäßig ausgeschaltet. Der geschützte Arbeitsbereich bietet Moderation ohne Zeitlimit, Wunschregie, Übergabe, Sendeplan und Inhaberverwaltung. Die Anbieterhistorie ist entfernt.

Vor Veröffentlichung die tatsächliche Hostinglaufzeit **Node.js ab 22**, Domain, HTTPS-Proxy, private Serverumgebung und native App-/WebHook-Anbindung prüfen. Channelrollen, Anwesenheit, Ende-zu-Ende-Verbindung und Mailversand benötigen eigene Abnahme. [Anbindung](ANBINDUNG.md) · [App-Prüfbericht](../../docs/pruefung/PRUEFBERICHT.md) · [Native Abnahme](../../docs/betrieb/LIVE-ABNAHME.md).

PIN-Anmeldung (10.11.2026, Website 0.2.9 / App 343): allgemeine Channelkopplung und Moderationsanmeldung sind getrennt. Persönliche PIN-Einrichtung/-Prüfung auch im Arbeitsbereich und bei Übergabe, Themen-/Queue-Sperre nach Berechtigungsverlust und eigenständige Wunschbox-Ausnahme. 22/22 Websitefälle bestanden, einschließlich echter Appfachaktionen im isolierten Modell. Keine Veröffentlichung oder native Plattformabnahme.

Asynchrone PIN-Prüfung (Website 0.2.10 / App 350): Der bestehende Serveradapter liest ausschließlich laufende PIN-Aktionen mit derselben authentifizierten Anfragekennung erneut. Kurze WebHook-Antworten vermeiden eine offene HTTP-Anfrage während bcrypt; Kostenfaktor und Konto-/Sitzungsprüfung bleiben erhalten. Native Arbeit läuft maximal 60 Sekunden, Bridge und Browser besitzen passende begrenzte Wartezeiten. Die Website-Gesamtprüfung ergibt 21/22 Fälle: sämtliche Workspace-/HTTP-/PIN-Fälle bestehen. Ein unabhängiger Demo-Textfall scheitert am neu vorhandenen Wort „Knuddels“ im Smiley-Hinweis der Verwaltung; dieser damalige Befund betrifft weder PIN-Prüfung noch Rechte. Die aktuelle Suite prüft den gültigen neutralen Hilfetext und besteht mit 26/26 Fällen. Keine Veröffentlichung.

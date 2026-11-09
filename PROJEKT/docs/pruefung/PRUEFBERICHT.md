# MischWerk – Prüfbericht 0.1.322 / Build 322

Stand: **09.11.2026**. Geprüft wird das fertige Paket unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**. Die App ist lokal vorbereitet; GitHub-Veröffentlichung und native Knuddels-Installation sind getrennte Vorgänge.

## Aktueller Prüfstand

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige Node-Suite am fertigen UPLOAD | **487/487 bestanden**, Testdateien nacheinander ausgeführt |
| Struktur, Syntax, API-Signaturen, Quellen-/Laufzeitgleichheit und Textgrenzen | Bestanden |
| Rhino 1.7.7.2 und 1.9.1 am fertigen UPLOAD | **Je 1160 Prüfungen bestanden**, JAR-Hashes verifiziert |
| Vollständige Edge-/K3-/STAPP-Browserrunde am UPLOAD | **355 Fälle: 351 bestanden, vier Abweichungen**, keine übersprungenen Fälle; 616,2 Sekunden |
| Paket und fünf Auslieferungsmanifeste | **108 Dateien, 100 Texte, maximal 9485 UTF-16-Zeichen**, konsistent |
| Eigenständige Websiteprüfung | **22/22 bestanden**, aktuelle Historienquelle in vorhandener Testfixture ergänzt |

Der erste parallel gestartete Node-Lauf scheiterte in einem Emulatorstart am bestehenden 1500-ms-VM-Zeitlimit. Die anschließende vollständige Ausführung mit nacheinander gestarteten Testdateien besteht ohne Codeänderung, ausgelassene Fälle oder geänderte Zeitgrenzen. Laufprotokolle liegen ausschließlich im System-Tempordner.

Die vorhandenen Prüfungen decken Radio und Wiederverbindung, Aktivitätsbestätigung, Lautstärke/Mute, Vorhang/Werbung, dauerhafte Wünsche, Moderation und Übergaben, Lauftext, private Historie, Sendeplan, Team, Bot-Texte und Android-Einrichtung ab. Browser- und Emulatormodelle verwenden lokale Anbieterantworten und echtes lokales HTML-Audio. Native Ausführung und gemeinsame Firebase-/Android-Abnahme bleiben eigenständige Nachweise.

## Aktuelle Oberfläche und Bilder

README und technische Übersicht beschreiben den aktuellen Funktionsstand ohne fortlaufende Buildchronik. Die Appbilder werden direkt aus dem gebündelten **Build 322** im vorhandenen Testlabor aufgenommen. Beispieldaten sind lokale Testdaten. Frühere, durch diese Aufnahmen ersetzte Zwischenstände werden über Git aufbewahrt; Originalmedien und erforderliche API-Nachweise bleiben erhalten.

| Bereich | Ansichten aus Build 322 |
| --- | --- |
| Radio | [Breit](oberflaeche/radio/radio-harmonie-breit.png), [mittel](oberflaeche/radio/radio-harmonie-mittel.png), [schmal](oberflaeche/radio/radio-harmonie-schmal.png), [Aktive Playtaste](oberflaeche/radio/playbutton-aktiv-1280.png), [Lauftext](oberflaeche/radio/lauftext-1280.png) |
| Bedienung | [Aktionen](oberflaeche/radio/radio-buttons.png), [schmale Aktionen](oberflaeche/radio/radio-buttons-schmal.png), [Sendeplantaste](oberflaeche/radio/button-sendeplan.png), [Moderationstaste](oberflaeche/radio/button-moderation.png), [Lautstärke](oberflaeche/radio/lautstaerke-gruppe.png), [stumm](oberflaeche/radio/lautstaerke-stumm.png), [100 Prozent](oberflaeche/radio/lautstaerke-schmal-100.png) |
| Wunschbox | [Breit](oberflaeche/wunschbox/wunschbox-flach-560.png), [schmal](oberflaeche/wunschbox/wunschbox-flach-320.png), [Quittung breit](oberflaeche/wunschbox/wunschbox-nach-versand-560.png), [Quittung schmal](oberflaeche/wunschbox/wunschbox-nach-versand-320.png) |
| Moderation | [Sendung breit](oberflaeche/moderation/moderation-780.png), [schmal](oberflaeche/moderation/moderation-320.png), [Wünsche](oberflaeche/moderation/moderation-wuensche-780.png), [Historie](oberflaeche/moderation/moderation-historie-780.png), [Lauftext](oberflaeche/moderation/moderation-lauftext-780.png) |
| Verwaltung | [Team breit](oberflaeche/verwaltung/verwaltung-560.png), [schmal](oberflaeche/verwaltung/verwaltung-320.png), [Bot-Texte breit](oberflaeche/verwaltung/verwaltung-bottexte-560.png), [schmal](oberflaeche/verwaltung/verwaltung-bottexte-320.png) |
| Sendeplan | [Höreransicht](oberflaeche/sendeplan/sendeplan-hoerer-720.png), [schmal](oberflaeche/sendeplan/sendeplan-hoerer-320.png), [Verwaltung](oberflaeche/sendeplan/sendeplan-820.png), [Sendungen](oberflaeche/sendeplan/sendeplan-sendungen-820.png), [Editor breit](oberflaeche/sendeplan/sendeplan-editor-820.png), [schmal](oberflaeche/sendeplan/sendeplan-editor-320.png) |

Die öffentliche Sendeplantaste bleibt auf „In Kürze“ gesperrt; der echte anwesende Channelinhaber kann weiterarbeiten. Die Hörerbilder zeigen die vorbereitete Ansicht im lokalen Modell.

Die zusätzlichen Radioaufnahmen verwenden denselben unveränderten Paketsnapshot mit SHA-256 **fc8ffe89c1e7c0d53ffc619ae1a35967d4034fea4e51ac95c746fe53fa67ba3a**. Browserkonsole und Fremdnetzprüfung bleiben dabei fehlerfrei. README-Badges sind als gültige SVGs mit HTTP 200 geprüft. Fünf ersetzte, nicht mehr verlinkte Detailbilder wurden entfernt; die drei Websitebilder sind ebenfalls erneuert.

## Bekannte Befunde und offene Abnahme

- **Browser-Gesamtlauf:** Zwei Fälle melden unpassende Lautstärkegeometrie im festen 160-px-Header (1100 bzw. 390 px Breite); ein Wunschboxfall meldet beim Wechsel ein-/zweizeiliger Beschriftung 8 px Textversatz. Diese drei Abweichungen bestehen auch in der gezielten Gegenprobe. Ein Sendeplanfall verliert im Gesamtlauf nach zusätzlicher Seitenaufteilung den zuvor gelesenen leeren Tag; derselbe Fall besteht anschließend isoliert, ohne Codeänderung. Seine zeitliche Ursache ist offen. Testgrenzen, Appcode und Paketbytes wurden nicht verändert. Fundstellen: `tests/browser/frontend.browser.test.cjs:1384,1495,1645` und `tests/browser/schedule.browser.test.cjs:246`.
- **Website 0.2.5:** Drei reproduzierte P2-Befunde bleiben offen: UTF-8-Dekodierung an HTTP-Blockgrenzen, übernommene Löschbestätigung beim Eintragswechsel und fehlende Mailadapter-Verdrahtung im regulären Server. Fundstellen und Gegenfälle stehen im [Websitebericht](../../website/docs/PRUEFUNG.md). Der GitHub-Abschluss verändert den Websitecode nicht.
- **Minimaler Glow-Rundungsrand im lokalen STAPP-Modell:** Bei 390 px und Pixeldichte 2 ließ die Ganzzahlrundung der Fensterhöhe zuvor 0,984375 CSS-Pixel unter dem 16-px-Fade frei; die letzten zwei physischen Bildzeilen wurden mit RGB 5/19/11 gemessen. Eine vorübergehende lokale 17-px-Diagnose bestätigte die Rundungsursache und wurde entfernt. Kein allgemeiner Funktionsverlust und keine entsprechende native Knuddels-Auffälligkeit nachgewiesen. Pixelgrenzen und gewünschter Glow werden nicht für den GitHub-Abschluss verändert.
- **Zurückgenommener Rechtebefund:** Der frühere Modellfall änderte nur den Nick eines weiterhin simulierten Channelinhabers. Die offizielle API bezieht isChannelOwner auf den Appchannel; damit wurde kein fremder Channelinhaber und keine bestätigte Zugriffslücke nachgewiesen. [API-Abgleich](../api/API-NACHWEIS.md#channelinhaberprüfung-ist-auf-den-appchannel-bezogen--09112026).
- **Native Abnahme:** Installation von Build 322, längeres Hören in echten Clients, erste/erneute Overlayöffnung, native Begrüßungs-/Themenbuttons und gemeinsame Firebase-/Android-Ende-zu-Ende-Abnahme separat durchführen. Der eingerichtete Live-Encoder-Metadatenweg zur Historie ist bereits vom Auftraggeber bestätigt. [LIVE-Abnahme](../betrieb/LIVE-ABNAHME.md).

## Nativer Socket-Timeout und Aktivitätskorrektur

Am **09.11.2026 um 03:05:53,393 Europe/Berlin** protokolliert der Windows-Client SocketTimeoutException: Read timed out. Der letzte verzeichnete /confirm liegt um 02:58:01,624, rund 7 Minuten 52 Sekunden zuvor. Der PINGPONG-Healthcheck meldet vor dem Timeout 11,365 und anschließend 27,808 Sekunden ohne empfangene Chatserverdaten. Netz, Server und nativer Client lassen sich als Ursache dieser Empfangslücke anhand des Logs nicht unterscheiden; ein Zehn-Minuten-Inaktivitätsabbruch ist für diesen Vorfall nicht belegt.

Nach Wiederverbindung bestätigten passive Beobachtungen von 03:09:48–03:13:30 sowie 03:14:47–03:18:29 reguläre frische Antworten und /confirm-Aufrufe bei fortschreitendem fehlerfreiem Audio, auch im verdeckten Radio. Diagnosepunkte wurden entfernt. Beobachtet wurde der damalige installierte Code, keine native Installation der späteren Korrektur.

Build 312 korrigiert zwei unabhängig reproduzierte Appbedingungen: Tatsächlicher Audiofortschritt wird auch mit readyState 2 anerkannt; Aktivitätsfristen verwenden dieselbe monotone Uhr wie die Audioverbindung. Fünf der sieben Node-Gegenfälle und ein K3-Browserfall scheiterten vor der Korrektur. Die Bedingungen wurden unmittelbar vor dem nativen Timeout nicht gemessen und sind deshalb keine belegte Erklärung dieses Vorfalls.

## Erforderlicher historischer Audio-/Knuddels-Nachweis

Der folgende native Versuch vom **05.11.2026** bleibt als Ursachennachweis erhalten. Er betrifft die damalige Windows-Sitzung und ersetzt keine native Langzeitabnahme des heutigen Pakets.

## Kontrollierter nativer Ursachentest

Freigabe des Nutzers: ausschließlich die vorhandenen /confirm-Aufrufe vorübergehend aussetzen, Audio weiterlaufen lassen, nach spätestens elf Minuten wiederherstellen; mögliche Trennung und Musikstopp waren ausdrücklich genannt und genehmigt. Um 13:57:43 wurde nur die Methode im laufenden Dokument für exakt den Befehl /confirm vorübergehend umhüllt. Andere Befehle und normale mw:refresh-Anfragen blieben wirksam. Es wurden weder Streamquelle, Lautstärke, Audioereignisse noch Serverdaten manipuliert. Zeitlich begrenzte Rücknahme sowohl im Dokument als auch im externen Diagnoseprozess. Drei reguläre Bestätigungsversuche wurden unterdrückt.

| Zeitpunkt Europe/Berlin | Direkt beobachtetes Ereignis |
| --- | --- |
| 13:57:36,297 | Letzter regulärer /confirm-Aufruf vor dem Eingriff. |
| 13:57:43,903 | Beginn des auf höchstens elf Minuten begrenzten Tests. |
| 14:07:36,539 | Audio läuft: Medienzeit 2777,285 s, paused=false, readyState=3, kein Medienfehler, navigator.onLine=true, noch 2,222 s Puffer. Ursprüngliches Dokument unverändert. |
| 14:07:37,061 | Java-Client protokolliert got disconnected. Abstand zum letzten /confirm rund 600,764 s. |
| 14:07:37,063 | Client protokolliert Disconnecting from server. |
| 14:07:37,071–073 | Beide unabhängigen Diagnoseverbindungen melden target_closed; ursprünglicher Headerbar-Frame ist zerstört. |
| 14:07:37,216 | Native Chat-Verbindung beginnt ihren Neuaufbau. Die Radioleiste ist weiterhin weg. |

Vor dem Schließen kein waiting, stalled, pause, ended, Medienfehler oder eigener stopPlayback-/playbackFailed-Aufruf. Der Windows-Client zeigt anschließend Neu eintreten und Die Verbindung zum Server wurde unterbrochen. Damit ist in diesem Test ein gesunder Stream durch das Schließen seiner Knuddels-Ansicht beendet worden. Die gewöhnlichen App-Zustandsanfragen verhindern diese Inaktivitätstrennung nicht.

Nach dem Test Channel über die vorhandene Schaltfläche wieder betreten, Play betätigt und die zuvor eingestellten 38 Prozent wiederhergestellt. Das neue Dokument hat timeOrigin 1793884182274.6 statt 1793881276910.6. Prüfung um 14:12:04: genau ein Radioframe, laufende Medienzeit, kein Fehler, volume=0.38, muted=false, unveränderte ursprüngliche Slash-Methode und keine temporären Test-/Beobachterobjekte. Alle Diagnoseprozesse beendet. Der Eingriff endete mit dem zerstörten alten Dokument, vor Ablauf der elf Minuten; er wurde nicht in die neue Ansicht oder in Dateien übernommen.

Zusätzlicher statischer Nachweis am installierten Windows-Client V9.0cac / b261026: Die Meldung stammt aus px$19.run im Chat-Lesethread. Dieser erhält über den Empfangs-/Decodierpfad kein weiteres Paket und wirft die entsprechende RuntimeException; der nachfolgende Fehlerpfad beendet die Chat-Sitzung. Der unveränderte Bytecode wurde lokal gelesen, die Clientinstallation nicht bearbeitet. main.jar SHA-256: 09948ac4003112f2c28a5e858e266fc79499a52f39b4823b063809a41cc0e3de. Das ist ein anderer Befund als der separat protokollierte SocketTimeoutException um 04:15 Uhr. Aus dem bloßen Text got disconnected allein wurde keine Netz-/Anbieterursache abgeleitet.

Historische Gegenprobe: Am 05.11. um 01:06:15 folgt auf die Chat-Trennung nach 5,296 s ein neu erzeugter MischWerk-Headerbar-Browser; um 01:22:06 folgt eine neue Headerbar beim späteren Wiedereintritt. Der Abbruch 13:07:33 liegt 599,984 s nach Erzeugen der Headerbar um 12:57:33. Diese Zeiten stützen den nativ reproduzierten Sitzungsmechanismus, ersetzen aber keine damals fehlende Audiomessung.

Die Korrektur des dafür anfälligen Appwegs befindet sich bereits in Build 223 in transport/lifecycle.js: kurze Engpässe behalten die Fälligkeit, verlorene Antworten beginnen keinen neuen Drei-Minuten-Zyklus. Die vier gezielten Gegenprüfungen zu wiederkehrenden Datenlücken, unterbrochener Heartbeatantwort, Stop/neuem Hörversuch und verspäteter Bestätigung wurden nach diesem nativen Befund erneut erfolgreich ausgeführt. Keine zusätzliche Wiederverbindungs-, Autostart- oder Persistenzfunktion eingeführt. Die vollständige native Abnahme des neuen Builds setzt dessen tatsächliche Übernahme voraus; der untersuchte echte Client lädt weiterhin den alten Code.

## Grenzen

Lokale Browser-/HTTP-Prüfungen, modellierte K3-/STAPP-Plattform und echte native Beobachtungen sind getrennte Nachweise. Die Headerbar kann bei nativer Chat-Trennung zerstört werden; beliebige Netz-/Anbieterausfälle jenseits der Pufferreserve oder ein beendeter Client lassen sich nicht lückenlos überbrücken. Die öffentliche Client-Dokumentation führt /confirm weiterhin nicht ausdrücklich in ihrer Whitelist; dokumentierte Methode, OR-Radio-Code und nativer Versuch sind im [API-Nachweis](../api/API-NACHWEIS.md) eingeordnet.

Historische API-/Rhino-Recherche bleibt in den vorhandenen Nachweisen, frühere ersetzte Build- und Bildstände in Git. Es werden keine zusätzliche Archivdatei, privaten Umgebungsdateien oder Testprotokolle ausgeliefert.

# MischWerk – Prüfbericht 0.1.330 / Build 330

Stand: **09.11.2026**. Das fertige Paket liegt unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**. Lokal vorbereitet; GitHub, FTP und native Knuddels-Installation sind getrennte Vorgänge.

## Aktueller Prüfstand

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige Node-Suite beim Paketbau 330 | **490/490 bestanden** |
| Struktur, Syntax, API-Signaturen, Quellen-/Laufzeitgleichheit und Textgrenzen | Bestanden |
| Rhino 1.7.7.2 und 1.9.1 | **Je 1149 Prüfungen bestanden**, Arbeitsbestand und fertiger UPLOAD; JAR-Hashes verifiziert |
| Betroffene Browser-/Emulatorfälle am UPLOAD 330 | **19/19 bestanden**, keine übersprungenen Fälle, 24,3 Sekunden |
| Breiten-/Rollen-/Pixeldichtematrix am Arbeitsbestand | 320–3840 px, drei Rollen und Pixeldichten 1/1,25/1,5/2 bestanden; mit und ohne Wunsch sowie langen Texten |
| Website 0.2.7 mit App 330 | **22/22 bestanden**, keine übersprungenen Fälle, 10,5 Sekunden |
| Paket und fünf Auslieferungsmanifeste | **102 Dateien, 94 Texte, maximal 9485 UTF-16-Zeichen**, konsistent; Arbeitsbestand 145 Dateien |
| Breite vorherige Abdeckung, Build 329 | 337 Browser-/Emulatorfälle: 335 im Gesamtlauf plus zwei nach Anpassung der entfernten Kalender-/Druckeffekt-Erwartungen erfolgreich nachgeprüft; zusätzlich vier Resetfälle bestanden |

## Abstand der senkrechten Lautstärkeregelung

Der Nutzer zeigt die Prozentanzeige auf beziehungsweise oberhalb der sichtbaren oberen Appleistenkante. Der Gegenfall reproduziert in Build 329 in K3 und STAPP **0 px Abstand** zwischen Ausgabe und Leistenkante; auch unten fehlt Reserve. Build 330 zentriert die Gruppe mit **112 px Höhe** innerhalb der 124-px-Informationsfläche. Ausgabe und Stummtaste haben jeweils **6 px Abstand** zur sichtbaren Kante. Die senkrechte Reglerfläche ist weiterhin 44 px breit und jetzt **52 statt 64 px hoch**. Prozenttext, 16-px-Ausgabe, 44-px-Stummtaste und alle übrigen Bedienflächen behalten ihre Maße.

Funktional geändert ist ausschließlich metadata-layout.css. Der Test prüft den Abstand am sichtbaren Leistenrahmen, normales 48 % und rotes 100 % samt Warnsymbol, Richtung mit Maus, Home/End/Pfeiltasten, Mute, unveränderten Audioknoten und schmale waagerechte Rückfallanordnung. Zwei alte Größenassertionen wurden an die ausdrücklich verkürzte Strecke angepasst; alle betroffenen aktuellen Fälle bestehen am fertigen Paket. Die getrennte breite Matrix besteht ebenfalls. Der waagerechte Homepage-Regler ist durch seine bisherigen Styles unverändert und vollständig mitgeprüft.

Die tatsächlichen Paketaufnahmen bei 48 % und 100 % sowie die fünf Radioübersichten wurden visuell geprüft. Zusätzliche Reglerbilder liegen ausschließlich im System-Tempordner unter MischWerk-Pruefbilder/radio/Randabstand-48.png und Randabstand-100.png. Ein erneuter vollständiger Browser-Gesamtlauf aller übrigen Bereiche wird für diese CSS-Korrektur nicht behauptet.

## Sendeplan-Reset

Das native Sendeplan-Overlay ist samt Kalender, Editor, Layout und eigener Gestaltung entfernt. Sieben Frontend-JS-Dateien und zwei Stylesheets entfallen aus App und UPLOAD. Öffnungsbinding, Komponentenverdrahtung, native Größenangaben, private Kalenderentwürfe und Overlay-Änderungsnachrichten sind entfernt. Damit gibt es aus dieser Oberfläche keine Provider-/Historien- oder Kalenderabfragen mehr.

Die erhaltene Taste bleibt für **alle Rollen einschließlich Inhaber** deaktiviert mit **In Kürze**. Maße, Symbol, Material und Platz bleiben erhalten. Erzwungene Klicks sowie Enter/Leertaste erzeugen keinen Öffnungsauftrag. Alte mw:openSchedule-Aufrufe werden negativ quittiert, ohne die Radioleiste oder ein anderes Overlay zu ersetzen. Alte direkte schedule-Seiten starten weder Komponenten noch Providercontroller. Der lokale alte Vorschaupfad antwortet mit HTTP 410. Nach Schließen der Verwaltung geht der Fokus zur aktiven Moderationstaste; Rückfälle umgehen die deaktivierte Sendeplantaste.

Die mit Build 329 ausgeführten Resetfälle verwenden den bestehenden integrierten Emulator mit den tatsächlichen Paketdateien. Sie prüfen Inhaber und Hörer in K3/STAPP, fehlende alte Assets, die direkte Altseite, erhaltenen Studioentwurf und denselben laufenden Audioknoten. Node und Rhino prüfen zusätzlich erhaltene Wochenpersistenz, Revisionsschutz, Kalenderregeln, Studioabgleich, Homepage- und Android-Verträge. Alte Tests der entfernten Kalendergestaltung sind durch Resetprüfungen ersetzt; bestehende Fachtests verwenden weiterhin authentifizierte Radiositzungen.

Gespeicherte Sendeplanwochen bleiben unverändert. Homepage-Sendeplan und Homepage-/Android-Anbindung sind erhalten. Der bisher gemeinsam verwendete Datumshelfer liegt bytegleich unter website/public/js/site/calendar.js und wird über /calendar.js geladen. Die Websiteprüfung deckt die öffentliche Anzeige und den geschützten Arbeitsbereich weiterhin ab.

Stream, aktueller Titel/Interpret und private Moderationshistorie behalten ihre bisherigen Providerwege. Direkter SPCast-Titelabruf, Fünfsekundentakt, Cacheparameter, Fehlererholung, Titel über Interpret und Audioerhalt werden weiter in den bestehenden Browserfällen geprüft. Der Reset greift nicht in den Encoder oder Streamserver ein.

## Aktuelle Oberfläche und Bilder

Die Radioübersichten breit, mittel, schmal und mit Lauftext sowie das Aktionsdetail wurden aus dem tatsächlichen UPLOAD **330** erneuert. Sichtkontrolle: gesperrte Sendeplantaste mit In Kürze, Titel über Interpret, große Themen-/Moderationsschrift, senkrechter Regler breit und waagerechter Regler schmal. Kein neues Kalenderdesign. Alte native Sendeplanbilder sind aus der aktuellen Dokumentation entfernt; Git bewahrt frühere Stände.

| Bereich | Aktuelle Ansichten |
| --- | --- |
| Radio, Build 330 | [Breit](oberflaeche/radio/radio-harmonie-breit.png), [mittel](oberflaeche/radio/radio-harmonie-mittel.png), [schmal](oberflaeche/radio/radio-harmonie-schmal.png), [Aktionen](oberflaeche/radio/radio-buttons.png), [Lauftext](oberflaeche/radio/lauftext-1280.png) |
| Erhaltene Menübilder, Stand 322 | [Wunschbox](oberflaeche/wunschbox/wunschbox-flach-560.png), [Moderation](oberflaeche/moderation/moderation-780.png), [Verwaltung](oberflaeche/verwaltung/verwaltung-bottexte-560.png) |

Laufprotokolle und zusätzliche Aufnahmen liegen ausschließlich im System-Tempordner unter MischWerk-330-*. Die fünf erneuerten Bilder verwenden denselben Paketstand mit SHA-256 **dc57597ee27a0ef765847ded792b0f7e6eb6501a367950a5a759e4ccc186ca65**; Quellen und Paket sind über die fünf Manifeste geprüft. Lokale Beispieldaten und Clientmodelle ersetzen keine native Knuddels-Installation.

## Bekannte Befunde und offene Abnahme

- **Website 0.2.7:** Drei reproduzierte P2-Befunde bleiben offen: UTF-8-Dekodierung an HTTP-Blockgrenzen, übernommene Löschbestätigung beim Eintragswechsel und fehlende Mailadapter-Verdrahtung im regulären Server. Fundstellen und Gegenfälle stehen im [Websitebericht](../../website/docs/PRUEFUNG.md). Die Regler-Kompatibilitätsstyles und der dazu ergänzte Browsernachweis beheben diese drei unabhängigen Server-/Arbeitsbereichsbefunde nicht.
- **Minimaler Glow-Rundungsrand im lokalen STAPP-Modell:** Bei 390 px und Pixeldichte 2 ließ die Ganzzahlrundung der Fensterhöhe zuvor 0,984375 CSS-Pixel unter dem 16-px-Fade frei; die letzten zwei physischen Bildzeilen wurden mit RGB 5/19/11 gemessen. Eine vorübergehende lokale 17-px-Diagnose bestätigte die Rundungsursache und wurde entfernt. Kein allgemeiner Funktionsverlust und keine entsprechende native Knuddels-Auffälligkeit nachgewiesen. Pixelgrenzen und gewünschter Glow werden nicht für den GitHub-Abschluss verändert.
- **Zurückgenommener Rechtebefund:** Der frühere Modellfall änderte nur den Nick eines weiterhin simulierten Channelinhabers. Die offizielle API bezieht isChannelOwner auf den Appchannel; damit wurde kein fremder Channelinhaber und keine bestätigte Zugriffslücke nachgewiesen. [API-Abgleich](../api/API-NACHWEIS.md#channelinhaberprüfung-ist-auf-den-appchannel-bezogen--09112026).
- **Native Abnahme:** Installation von Build 330, größere Themen-/Moderationsschrift, stabile Wunschbox-Beschriftung, senkrechter Regler samt schmaler Rückfallanordnung, zentrierte Flächenaufteilung und Titelquelle in echten Clients, längeres Hören, erste/erneute Overlayöffnung, native Begrüßungs-/Themenbuttons und gemeinsame Firebase-/Android-Ende-zu-Ende-Abnahme separat durchführen. Der eingerichtete Live-Encoder-Metadatenweg zur Historie ist bereits vom Auftraggeber bestätigt; die sekundengenaue Übereinstimmung von Audio und Text ist nicht zugesichert. [LIVE-Abnahme](../betrieb/LIVE-ABNAHME.md).

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

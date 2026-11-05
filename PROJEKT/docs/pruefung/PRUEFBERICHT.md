# MischWerk – Prüfbericht 0.1.223 / Build 223

Stand 05.11.2026, ergänzt nach nativem Gegenversuch um 14:07 Uhr Europe/Berlin und vollständiger Abschlussprüfung für GitHub. Auftrag: Anbieter-zu-App-Verbindung vollständig erneuern, alte Audiowege entfernen, dauerhaftes Hören und kurze Störungen prüfen; OR Radio recherchieren, Datenlücken und den vorhandenen /confirm-Mechanismus untersuchen. Folgeaufträge: eigentlichen Knuddels-Trennungsfaktor weiter untersuchen und den aktuellen Projektstand einschließlich Dokumentation und Bildern auf GitHub committen und pushen. Arbeitsquelle ist C:/Users/Yves/Desktop/MischWerk/PROJEKT. Die Knuddels-Bereitstellung bleibt lokal; der Nutzer hat den unten beschriebenen vorübergehenden nativen Inaktivitätstest ausdrücklich freigegeben.

## Ergebnis und belegte Ursachen

Die bisherige Wiedergabesteuerung ist vollständig ersetzt. radio/connection besitzt allein den Hörwunsch, die native Audioquelle, Medienereignisse und einen Verbindungs-/Wiederherstellungstimer. radio/player steuert nur Bedienung und Anzeige. Der bestätigte öffentliche HTTPS-Höreranschluss wird direkt vom nativen Audioelement geöffnet, wie im aktuell öffentlich geprüften OR-Radio-Prinzip. Der Provider liefert ausschließlich Titel-, Modus- und Statusdaten. Keine fremden Streamadressen oder Playerbibliotheken, kein zusätzlicher Audio-/Encoder-/Web-Audio-Weg.

Drei konkrete Probleme der bisherigen Appsteuerung sind belegt:

1. Der alte Stillstandswächter löschte nach 20 Sekunden den Hörwunsch und verlangte erneut Play. Ebenso beendeten unerwartete Pause, Ende und Medienfehler den Versuch endgültig.
2. Eine Sendepause-Antwort des getrennten Statistikdienstes entfernte auch einen noch nutzbaren Audiostream. Statusprüfung und Audio waren unnötig gekoppelt.
3. Jede Nachladephase setzte den Drei-Minuten-Zähler der Knuddels-Aktivitätsbestätigung zurück. Reproduzierter Gegenfall: sechs Minuten mit je zwei Sekunden Engpass pro Minute, eine weiterhin aktive Verbindung, aber null Aktivitätsbestätigungen. Auch ein Engpass während einer ausstehenden Leseantwort konnte erneut drei Minuten Wartezeit verursachen; separater Gegenfall vor Korrektur rot, danach grün.

Die beiden Audioabschaltwege sind entfernt. Der vorhandene Heartbeat bleibt erhalten, behält seine Fälligkeit über kurze Engpässe und verwirft dabei nur unbrauchbare Fortschritts-/Antwortbelege. Erst eine tatsächlich ausgeführte Aktivitätsbestätigung beginnt den nächsten Drei-Minuten-Abstand. Verlorene Antworten werden bei tatsächlicher Wiedergabe und gültigem Channelzustand frühestens nach zehn Sekunden erneut angefordert. Slash-Aufruf weiterhin erst nach passender frischer mw:refresh-Antwort und danach weiterem Audiofortschritt. Stop, Seitenende, fehlende Verbindung, stehende Medienzeit sowie fremde/späte Antworten erzeugen keine Aktivität. Die automatisierten Prüfungen führen keine echten Chat-/Slash-Aktionen aus; der gesondert freigegebene native Gegenversuch ist nachfolgend abgegrenzt.

Der native Gegenversuch belegt inzwischen die Folge ausbleibender Aktivitätsbestätigungen: nach rund zehn Minuten trennt Knuddels die Chat-Sitzung und zerstört die Headerbar samt noch gesundem Audioplayer. Zusammen mit dem reproduzierten Zurücksetzen des alten Heartbeatzählers ist damit ein konkreter appseitiger Weg in diesen Abbruch belegt. Es wurde nicht nachträglich aufgezeichnet, ob genau dieser Weg jeden früher gemeldeten sporadischen Abbruch ausgelöst hat. Build 223 korrigiert den Zähler bereits; die neue Audiowiederverbindung allein wäre für ein zerstörtes Dokument wirkungslos.

## Untersuchung im tatsächlich laufenden Windows-Client

Die erste native Untersuchung erfolgte ausschließlich lesend über die bereits vorhandene Chromium-Diagnoseschnittstelle. Passive Medienbeobachtung und nicht anhaltende Diagnosepunkte erfassten Aufrufe der alten Abschaltfunktionen, Medienfehler, Framewechsel und die bereits vom Player selbst ausgeführten Aktivitätsbestätigungen. Die Logs wurden außerhalb des Browserdokuments im lokalen Temp-Verzeichnis gesichert und gingen beim späteren Schließen der Headerbar nicht verloren. Erst nach ausdrücklicher Nutzerzustimmung folgte der begrenzte Gegenversuch.

Der tatsächlich geladene Quelltext wurde aus dem laufenden Frame gelesen, nicht nur aus dem öffentlichen Download abgeleitet. Er enthält noch den alten Player mit 20-Sekunden-Endabschaltung, Statuskopplung und dem zurückgesetzten Heartbeatzähler. SHA-256 des geladenen player.js: 33fd82e4441dfbdab6c24f9e01d16147ee69887cd80d1fe6aa069e5efce6ed5b; lifecycle.js: 2bf6d14758914e7f09468c3ca92098aca5844b696f84afa79f09771404f6bf6a. Der neue lokale Build 223 ist dort noch nicht geladen.

Das native Clientprotokoll enthält am 05.11.2026 um 13:07:33 und 13:12:33 Uhr Europe/Berlin jeweils „got disconnected“ und „Disconnecting from server“. Nach dem ersten Ereignis folgt ein Verbindungsneuaufbau. Das belegt Knuddels-Verbindungsabbrüche, aber weder einen Streamserverausfall noch eine zeitliche Übereinstimmung mit dem gemeldeten sporadischen Radiostopp. Unmittelbar vor dem zweiten Ereignis ist eine beantwortete Client-Ping-Anfrage protokolliert; der Auslöser der Trennung wird dort nicht genannt. Geräteaufzählungen im Log sind kein Audiofehlernachweis.

Native Beobachtung am 05.11.2026 von 13:31:10 bis 13:41:16 Uhr Europe/Berlin: 600 Messpunkte, Medienzeit von 591,295 auf 1197,526 Sekunden fortgeschritten, durchgehend dieselbe Quelle und dasselbe Dokument, readyState 3, keine Pause, kein Medienfehler, kein waiting/stalled/ended, kein eigener Stopaufruf und kein Framewechsel. Kleinste beobachtete Pufferreserve rund 1,19 Sekunden. Drei bestehende /confirm-Aufrufe um 13:33:24, 13:36:26 und 13:39:27 führten zu keiner beobachteten Audiounterbrechung. Um 13:40:38 wechselte das Dokument ohne Eingriff des Diagnosewerkzeugs auf hidden; auch danach lief Audio weiter. Der sporadische Originalfehler trat in diesem begrenzten Zeitraum nicht auf. Diese Messung widerlegt keinen seltenen Fehler und ist kein Ursachennachweis für frühere Unterbrechungen.

Der geprüfte Backendweg mw:refresh versendet Zustandsdaten an die bestehende Sitzung. Er ruft weder sendAppContent noch die Entfernung der Radioleiste auf. Die Erzeugung einer neuen Radioansicht und das Entfernen bei tatsächlichem Channel-Verlassen bleiben getrennte Lebenszyklusaktionen.

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

## Verhalten des neuen Verbindungswegs

Ein bewusster Play-Klick eröffnet den Hörwunsch. Die bereits bestätigte eigene öffentliche Adresse bleibt maßgeblich; dynamische Weiterleitungsziele werden nicht gespeichert. Status-/Titelantworten, Rollenänderungen, Historienrechte und Channelaktualisierungen verändern die Audioquelle nicht. Nur eine tatsächlich andere oder entfernte Audioadresse beendet den alten Hörwunsch.

waiting erhält Quelle und Browserpuffer. stalled allein bei weiterlaufender Wiedergabe verändert sie nicht. Tatsächlicher Medienfortschritt wird über native Zeit/Zustände beurteilt; ein einzelnes playing-Ereignis kann keinen Dauerstillstand verbergen. Kurze Engpässe erholen sich ohne eigene neue Play-/Load-Aufrufe. Unerwartete Pause versucht dieselbe Quelle fortzusetzen. Echte Fehler/Ende oder Stillstand führen zu einer neuen Verbindung, ohne den Hörwunsch zu löschen. Nach 15 Sekunden ohne Fortschritt beziehungsweise 30 Sekunden ohne ersten Fortschritt wird ein festhängender Versuch ersetzt. Wiederholungsabstände 1/2/4/8/15/30 Sekunden, Rücknahme erst nach stabiler Wiedergabe. Genau ein Steuerungstimer, keine parallelen Versuche; monotone Frist einschließlich Rücksprungschutz ohne Performance-Uhr.

Stop, Werbestart, tatsächlicher Quellenwechsel und Seitenende schließen die Quelle und alle Wiederholungen. Generationszuordnung verwirft späte Play-Ablehnungen. Automatische Erholung erhält Lautstärke und Stumm; bewusster neuer Hörversuch verwendet weiterhin höchstens 10 Prozent Startlautstärke. Verweigert der Browser ausdrücklich die Wiedergabefreigabe, wird der nötige Play-Klick verständlich angezeigt. Goldlicht/RGB-Glow folgen tatsächlicher Wiedergabe; Stop/Nachladen bleiben dunkel.

## Tatsächliche Anbieter- und Datenlückenmessung

Die HTTP-Lücken und Verbindungsabbrüche in den Fehlertests wurden bewusst lokal erzeugt. Sie sind keine beobachteten Ausfälle von STREAMPANEL.

Eigene parallele Messung zweier öffentlicher Anschlüsse für jeweils 120 Sekunden, Abschluss 05.11.2026 um 12:01:20 UTC / 13:01:20 Europe/Berlin:

| Messung | Öffentlicher Höreranschluss | Direkter Anschluss des Anbieterplayers |
| --- | --- | --- |
| Weg | sp.radio.fm/stream → einmal HTTP 302 → spcast.eu/stream | spcast.eu/stream direkt |
| Ziel | derselbe eigene Streamserver | derselbe eigene Streamserver |
| Antwort | HTTP 200, audio/mpeg | HTTP 200, audio/mpeg |
| Format | 320 kbit/s, 44100 Hz | 320 kbit/s, 44100 Hz |
| Empfangene Bytes | 4.874.469 | 4.874.469 |
| Größter beobachteter Abstand zwischen Datenblöcken | 372 ms | 381 ms |
| Lücken über zwei Sekunden / unerwartetes Ende | 0 / 0 | 0 / 0 |

Die Weiterleitung erfolgt beim Öffnen, nicht zwischen Musiktiteln. Audioantworten verbieten Caching (no-cache/no-store). In diesen Messungen ist weder eine Datenlücke beim Anbieter noch ein Vorteil durch Umgehen der Weiterleitung belegt. Die öffentliche Statusseite zeigte keine veröffentlichte Incident-/Wartungsmeldung; das ist kein individueller Verfügbarkeitsnachweis.

Mehrere echte fünfminütige Headless-Edge-Läufe gegen den eigenen Radiostream verliefen mit einer durchgehenden nativen Verbindung und fortschreitender Medienzeit, ohne spätere waiting-/pause-/ended-/error-Ereignisse. Die beobachtete native Reserve lag meist bei etwa ein bis zwei Sekunden. Das erklärt, warum mehrsekündige Lieferpausen bei diesem Direktstream hörbar werden könnten; es beweist keine solche Pause in der gemeldeten Windows-Sitzung. Ein größerer künstlicher Liveversatz oder ein anderer fremder Player wurde nicht eingeführt.

Die Quellen und API-Grenzen stehen im [API-Nachweis](../api/API-NACHWEIS.md). Temporäre Messdaten enthalten nur Zeitabstände, Bytezahlen, Medienzustände und öffentliche Anschlussangaben; keine Musikaufzeichnung oder Anbieterzugänge.

## Prüfungen

- Node: 283/283 Prüfungen am endgültigen Stand bestanden.
- Browser: abschließender vollständiger Lauf aller fünf Suiten gegen den tatsächlichen Desktop-UPLOAD am 05.11.2026: **272/272 bestanden**, keine Fehler, rund 422 Sekunden. Im vorherigen Gesamtlauf hatte ein unveränderter Moderations-Geometriefall vorübergehend ein nicht sichtbares Themenfeld gemeldet (271/272); der anschließende Einzellauf und der jetzige vollständige Lauf bestanden ohne funktionale Codeänderung. Alle Audio-/Heartbeatfälle bestanden in beiden Gesamtläufen.
- Website: vollständiger separater Lauf mit **22/22 bestandenen Node-/HTTP-/Browserfällen**, rund 13,9 Sekunden. Gemeinsame Appkomponenten aus Build 223; ausschließlich lokale Testdaten und API-Modelle.
- Rhino: jeweils 906 Prüfungen mit 1.7.7.2 und 1.9.1 bestanden. Projekt-, Architektur-, Syntax-, Textlängen-, Manifest- und vollständige Upload-Integritätsprüfung bestanden.
- Echtes lokales Audio in K3-/STAPP-Modellen: Streamende mit nativer pause-vor-ended-Reihenfolge, harter HTTP-Abriss und Wiederverbindung, Lautstärke/Mute, dauerhafter Stop, echte sechssekündige Lieferlücke mit automatischer nativer Erholung auf derselben Quelle.
- Vier Sekunden echte HTTP-Lücke mit vorhandener Reserve: kein waiting/pause/error nach Wiedergabestart, eine einzige HTTP-Audioverbindung.
- Zeitbeschleunigt: 24 Stunden fortschreitende Wiedergabe mit genau einem Play; wiederholte Ausfälle mit begrenzter Versuchsrate; Ereignisflut, Stillstand ohne Ereignisse, rückwärts gestellte Systemuhr, alte Promise-Ablehnungen, Browserfreigabe, Online-Signal, Kurzstörungen und Heartbeatbestätigungen. Keine 24-stündige Echtzeitmessung behauptet.
- Metadatenentkopplung: Stopp-/Fehlerantworten und Änderungen ausschließlich der Datenanschlüsse erhalten laufendes Audio. Ungültige Höreradressen bleiben gesperrt; manipulierte Datenadressen werden nicht abgerufen.
- Architekturprüfung verweigert alte Steuerungsnamen und Audioquellenbesitz außerhalb radio/connection. Quellen und tatsächlich ausgelieferte Dateien enthalten keinen playbackFailed-/playbackTimedOut-/wantedPlayback-/station-changed-Altpfad.

## Erhalt und Bereitstellung

Hashvergleich innerhalb des Audio-Umbaus auf Build 223: Gestaltung, Originalmedien, API-Referenzstubs, Lautstärkekomponente, Wunschtransport und sämtliche Backendfachmodule blieben dabei unverändert. Außer Versionsdateien wurden für diesen Umbau nur Audioverbindung, Radiobedienung, Trennung der Providerdaten, Zusammensetzung/Ladeplan und der bestehende Client-Heartbeat angepasst. Neu ist dabei genau ein fachliches Laufzeitmodul radio/connection.js. Keine neue Abhängigkeit, Minifizierung oder Doppelimplementierung. Der GitHub-Abgleich umfasst zusätzlich die bereits lokal abgeschlossenen Änderungen seit Build 208.

122 Laufzeitdateien, 115 Texte, 40 Backendmodule, 80 Browserdateien, 49 Komponenten, 18 Stylesheets und fünf Manifeste. Alle ausgelieferten Texte und Manifeste strikt unter 9500 Zeichen; Quellenmaximum 9416, tatsächliches Bündelmaximum 9477. Vollständiger lokaler Ordner C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk. Kein FTP, natives Update oder Neustart. Website und Testwerkzeuge bleiben außerhalb des Uploads.

## GitHub-Dokumentation und aktuelle Bilder

Haupt-README und technische Übersicht auf App 0.1.223 / Website 0.2.0 zusammengeführt. Architektur-, Gestaltungs-, Betriebs-, Sendeplan-, Lautstärke- und Abnahmetexte beschreiben den aktuellen Code; der ausführliche API-Nachweis kennzeichnet ältere Einträge ausdrücklich als historische Recherche. Vorhandene Freigaben, native Befunde und noch offene Abnahmen bleiben nachvollziehbar. Die Dokumentationspflege ändert keine Versionsnummer und keine Laufzeitlogik. radio/player.js wurde lediglich auf die im Repository vorgegebenen LF-Zeilenenden vereinheitlicht; danach wurden Manifeste und UPLOAD neu erstellt und vollständig geprüft.

Aktuelle Aufnahmen stammen aus dem tatsächlich gebündelten Build beziehungsweise dem lokalen Websiteserver. Beispieldaten, Rollen und Senderantworten sind lokale Prüfdaten. Sie belegen weder eine Veröffentlichung noch die native Langzeitabnahme. Ungenutzte ältere Oberflächenbilder wurden entfernt; Originalmedien bleiben erhalten.

| Bereich | Aktuelle Ansichten |
| --- | --- |
| Radioleiste | [Bereit](oberflaeche/webradio-desktop.png), [Wiedergabe breit](oberflaeche/vinyl-glow-desktop.png), [Wiedergabe schmal](oberflaeche/vinyl-glow-mobil.png), [schmal bereit](oberflaeche/vinyl-pause-mobil.png) |
| Tasten und Lautstärke | [Goldene Aktionen](oberflaeche/radio-buttons.png), [schmale Aktionen](oberflaeche/radio-buttons-schmal.png), [Lautstärke](oberflaeche/lautstaerke-gruppe.png), [Stumm](oberflaeche/lautstaerke-stumm.png), [100 Prozent schmal](oberflaeche/lautstaerke-schmal-100.png) |
| Wunschbox | [560 px](oberflaeche/wunschbox-flach-560.png), [320 px](oberflaeche/wunschbox-flach-320.png), [Quittung breit](oberflaeche/wunschbox-nach-versand-560.png), [Quittung schmal](oberflaeche/wunschbox-nach-versand-320.png) |
| Moderation | [780 px](oberflaeche/moderation-780.png), [320 px](oberflaeche/moderation-320.png), [Wünsche breit](oberflaeche/moderation-wuensche-780.png), [Wünsche schmal](oberflaeche/moderation-wuensche-320.png) |
| Verwaltung | [Radio-Team](oberflaeche/verwaltung-menue.png), [Bot-Texte breit](oberflaeche/verwaltung-bottexte-560.png), [Bot-Texte schmal](oberflaeche/verwaltung-bottexte-320.png) |
| Sendeplan | [Woche breit](oberflaeche/sendeplan-sendungen-820.png), [Woche schmal](oberflaeche/sendeplan-320.png), [Editor breit](oberflaeche/sendeplan-editor-820.png), [Editor schmal](oberflaeche/sendeplan-editor-320.png) |
| Vorhang | [Geschlossen breit](oberflaeche/vorhang-1920.png), [geschlossen schmal](oberflaeche/vorhang-320.png), [Öffnungsphase](oberflaeche/vorhang-oeffnung.png) |

Die drei aktuellen Websiteaufnahmen und deren gesonderte Prüfergebnisse stehen im [Websitebericht](../../website/docs/PRUEFUNG.md). Reale Umgebungsdateien, Zugangsdaten, Diagnoseprotokolle und lokale Testartefakte gehören nicht zum Commit.

## Grenzen

Echte Browser-/HTTP-Prüfung und modellierte K3-/STAPP-Plattform sind voneinander zu unterscheiden. Der freigegebene Gegenversuch weist die native Inaktivitätstrennung dieser Windows-Sitzung und die anschließende Zerstörung der Headerbar nach. Er ist keine Langzeitabnahme des noch nicht veröffentlichten Builds 223 und keine Garantie für andere Clients oder künftige Serverregeln. Die öffentliche aktuelle Client-Dokumentation führt /confirm weiterhin nicht ausdrücklich in ihrer Whitelist; die dokumentierte Methode, der OR-Radio-Code und der lokale native Versuch sind getrennte Nachweise. Beliebige Netz-/Anbieterausfälle jenseits der verfügbaren Pufferreserve sowie eine Beendigung des nativen Clients lassen sich nicht durch JavaScript lückenlos überbrücken. Eine dauerhaft nicht erreichbare Quelle wird mit begrenzter Rate weiter versucht, solange der Nutzer hören möchte.

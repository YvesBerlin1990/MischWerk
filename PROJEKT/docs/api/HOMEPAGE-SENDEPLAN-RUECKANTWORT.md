# Rückantwort: Homepage-Sendeplan und Radioteam · Build 372

## Direkter öffentlicher Sendeplanabruf auf Nutzerauftrag · 11.11.2026

Der Betreiber hat ausdrücklich beauftragt, die öffentliche JSON direkt in der Knuddels-App zu lesen. Build **0.1.372 / 372** stellt die öffentliche Tagesanzeige deshalb auf `GET https://radio-mischwerk.web.app/api/public-schedule?week=<Montag>` über **ExternalServerAccess.getURL** um. Die Homepage benötigt dafür keine Änderung und keinen neuen Auftragsdatensatz. Die Anzeige funktioniert unabhängig von Aktivierung und Schlüssel des bestehenden Statuspublishers.

Das vollständige öffentliche Wochen-JSON ist die Anzeigequelle. Generierte AutoDJ-Zeilen erscheinen mit gelieferten Titeln und Moderationsnamen. Leere Titel zeigen wie die Homepage **Live-Sendung**, leere Moderationsfelder **Moderation**. Ganztags erscheint **Ganztägig**, Tagesende **00:00**. Open End nutzt das vom Endpunkt aufgelöste numerische `until` in Berliner Kalenderminuten; ohne `until` gilt das Ende des Starttags. Keine lokalen Ersatzsendungen, kein Import und kein Rückfall auf den nativen Wochenbestand.

Je Woche wird ein laufender GET gemeinsam verwendet; flüchtiger Cache 15 Sekunden, maximal vorige/aktuelle/nächste Woche. Ein 10-Sekunden-Timeout sowie HTTP-/URL-/JSON-/Feldprüfung verhindern falsche Erfolgsanzeigen. Die bestehende 20-Sekunden-Aktualisierung liest nur die offene Ansicht. Fehler erhalten den bekannten Plan und bieten Wiederholen. Paketfolge und Inhaltskennung verhindern gemischte Antworten auch bei unveränderter öffentlicher Revision 0. Beide Shutdown-Hooks sowie geschlossene/fremde Sitzungen verwerfen ausstehende Zustellungen.

Die vorhandenen signierten `scheduleCommands`/`moderatorCommands`, Revisionen und Ergebnisquittungen bleiben für ihre nativen Schreibverträge unverändert. Der zuvor offene Relaynachweis ist damit keine Voraussetzung mehr für den öffentlichen Tagesplan. Dessen separate fachliche Übernahme ist durch diesen lesenden GET weder repariert noch bewiesen. Senderstatus, Lauftext, Team, Wunschqueue und Schlüssel werden nicht umkonfiguriert.

Die echten öffentlichen Antworten aller drei Wochen wurden lokal gegen die tatsächliche `dayTimeline`-Funktion des Homepage-Renderers verglichen: **21 Tage, 24 Zeilen, drei GETs**, gleiche Zeiten, Themen, Namen und Ganztagskennzeichnung. Am **07.11.2026** ergeben sich:

| Zeitraum | Thema | Moderation |
| --- | --- | --- |
| 00:00–12:00 | MischWerk Radio Show | MischWerk am Pult |
| 12:00–14:00 | Live-Sendung | Otterchen |
| 14:00–15:00 | Live-Sendung | Polaroid |
| 15:00–00:00 | MischWerk Radio Show | MischWerk am Pult |

Heute, **11.11.2026**, ergibt sich **MischWerk Radio Show / MischWerk am Pult / Ganztägig**. Dieser Vergleich wurde zunächst lokal ausgeführt und ist nach der Betreiberinstallation nun auch für beide genannten Tage in der echten Knuddels-App bestätigt. Paket und endgültige Prüfungen: [Prüfbericht](../pruefung/PRUEFBERICHT.md); Bedienung: [Sendeplan](../betrieb/SENDEPLAN.md).

### Native Prüfung nach Betreiberinstallation

Der Betreiber hat Upload von Build 372 und /update bestätigt. Im echten Channel MischWerk / Otterchen wurde zusätzlich die private Meldung mit Version **0.1.372** gelesen. Die öffentlichen JSON-Antworten für 2026-11-02 und 2026-11-09 wurden am **11.11.2026 um 17:29:54–17:29:55 UTC** erneut per HTTP 200 gelesen. Danach wurde das echte native Sendeplanfenster geöffnet und verglichen: Am **07.11.2026** stehen alle vier gelieferten Zeiträume mit denselben Titeln und Moderationsnamen; insbesondere **Live-Sendung / Otterchen / 12:00–14:00** und **Live-Sendung / Polaroid / 14:00–15:00**. Die beiden AutoDJ-Zeiträume sind **00:00–12:00** und **15:00–00:00**, jeweils **MischWerk Radio Show / MischWerk am Pult**.

Nach Rückkehr zu Heute zeigt die echte App am **11.11.2026** **MischWerk Radio Show / MischWerk am Pult / Ganztägig** und Jetzt im Programm. Nach 22 Sekunden zusätzlicher Beobachtungszeit wurde die regulär erneuerte Tagesliste um **17:31:48 UTC / 18:31:48 Europe/Berlin** erneut korrekt und ohne Fehlermeldung gelesen. Damit sind Empfang und Darstellung der geprüften öffentlichen Sendeplandaten in der produktiven Knuddels-App bestätigt. Der bisher offene Sichtvergleich dieser beiden Tage ist abgeschlossen. Eine neue redaktionelle Homepageänderung wurde dafür nicht ausgelöst; deren Änderung/Löschung und die unabhängigen nativen Relay-Schreibquittungen sind damit nicht zusätzlich abgenommen.

Die folgenden Abschnitte dokumentieren die bisherigen Relay-/Sichtbefunde bis Build 370. Ihre damalige Anforderung, Einzelaufträge vor einer öffentlichen Anzeige zu belegen, gilt nicht für den neuen direkten Lesepfad.

## Nativer Datenabgleich nach Installation von Build 370 · 11.11.2026

Der Betreiber hat den vollständigen Upload und `/update` ausdrücklich bestätigt. In der echten Knuddels-Ansicht ist außerdem die private Appmeldung mit **Version 0.1.370** sichtbar. Die Sendeplanansicht zeigt jetzt die neue Meldung **„Für diesen Tag wurden noch keine Sendungen übernommen.“** statt der früheren Ersatzzeile. Die neue Tagesdarstellung ist damit nativ beobachtet.

Der Betreiber meldete im Prüfverlauf zunächst eine ausgeschaltete Verbindung mit hinterlegtem Schlüssel und anschließend die aktive Verbindung. Nach dieser Aktivierung wurde `/mw admin` → Verbindung in der laufenden App gelesen. Zunächst stand dort **„Verbindung aktiv – Übertragung noch nicht bestätigt.“**. Nach mehr als zwei regulären 20-Sekunden-Takten und ausdrücklichem **Aktualisieren** wurde **„Aktiv – Daten werden übertragen.“** und **„Schlüssel ist hinterlegt.“** beobachtet. Der Statusabruf erfolgte um **16:39:37 UTC / 17:39:37 Europe/Berlin**; die darauf folgende fertige Anzeige bestätigte die angenommene letzte reguläre Antwort. Der Betreiber hat aktiviert; Codex hat lediglich den vorhandenen Status aktualisiert und die Tagesansichten gelesen.

| Vergleich | Öffentliche Homepage-JSON | Echte Knuddels-Tagesansicht |
| --- | --- | --- |
| 11.11.2026 | Nur eine generierte ganztägige AutoDJ-Lücke, keine nicht generierte Sendung | Keine übernommenen Sendungen |
| 07.11.2026 | Zwei nicht generierte Live-Einträge, siehe unten | Keine übernommenen Sendungen; nach Aktivierung erneut geöffnet und um **16:40:49 UTC / 17:40:49 Europe/Berlin** nochmals beobachtet |

Die [öffentliche Vorwoche](https://radio-mischwerk.web.app/api/public-schedule?week=2026-11-02) enthält konkret:

- Firebase-/öffentliche Eintrags-ID `mw_20261102_1`, Datum `2026-11-07`, `12:00`–`14:00`, Moderator `Otterchen`, öffentliches `topic: ""`.
- Firebase-/öffentliche Eintrags-ID `mw_20261102_2`, Datum `2026-11-07`, `14:00`–`15:00`, Moderator `Polaroid`, öffentliches `topic: ""`.

Aktuelle und nächste öffentliche Woche enthalten weiterhin ausschließlich je sieben `generated: true`-Lücken. Alle drei öffentlichen Wochenrevisionen sind 0; `knuddelsSyncState` und `knuddelsSyncError` sind jeweils `null`. Diese Werte sind öffentliche Lesedaten und keine echten Knuddels-Revisionen oder Auftragsbelege.

**Gesicherte Aussage:** Die aktuelle Statusverbindung nimmt reguläre Antworten an. Für die geprüften Tage liegen im neuen öffentlichen Knuddels-Tagesplan keine aktiv gebundenen übernommenen Sendungen vor. Die zwei öffentlichen Einträge vom 07.11. sind dort nicht sichtbar. Weder der Empfang eines bestimmten `scheduleCommands`-Auftrags noch eine konkrete Ablehnung oder eine fehlerhafte Firebase-Quittungsverarbeitung ist damit nachgewiesen. Öffentliche JSON-Verfügbarkeit allein erzeugt keinen Import; maßgeblich bleiben die Einzelaufträge im bestehenden Statusrückkanal.

### Konkreter nächster Nachweis für den Homepage-/Firebase-Codex

Bitte für die beiden genannten IDs beziehungsweise eine tatsächlich beabsichtigte redaktionelle Änderung feststellen: Gibt es einen Auftragsdatensatz? Welche `commandId`, `week`, `expectedRevision` und welches tatsächliche `entry` wurden erzeugt? Wurde dieser Auftrag nach der Betreiberaktivierung in einer regulären Statusantwort ausgeliefert? Welches zugehörige `scheduleResults` und welche tatsächlichen `scheduleRevisions` kamen anschließend zurück, und welchen Endstatus erhielt der Auftrag in Firebase? Für die Logsuche liegt eine native Sichtbeobachtung der aktiven Verbindung im Fenster **16:38:35–16:40:49 UTC am 11.11.2026** vor; dies sind Beobachtungszeiten, keine behaupteten Request-/Trace-IDs oder genauen POST-Zeitstempel.

Die öffentlich leeren topic-Felder sind ein konkreter Prüfhinweis: Der bestehende native Vertrag verlangt ein nicht leeres Thema. **Nur falls ein tatsächlicher Auftrag ebenfalls ein leeres `entry.topic` enthält**, ist eine fachliche Validierungsablehnung zu erwarten. Die öffentliche Projektion genügt nicht zum Beleg dieser Ursache. Keine Themen erfinden, keine neuen Gesamtimporte oder Schnittstellen ergänzen und die bestehende Verbindung nicht erneut einrichten.

Dieser Arbeitsgang bestand aus nativer Sichtprüfung, öffentlichem Leseabruf und Dokumentation. Appcode, UPLOAD, Manifeste und gespeicherte Schlüssel wurden von Codex nicht geändert. Die folgenden früheren Hinweise auf eine noch ausstehende Installation beschreiben den Stand vor der nun vom Betreiber bestätigten Installation.

## Ersatztexte auf direkten Nutzerauftrag entfernt · Build 370

Nach dem Kontrollbefund bat der Nutzer ausdrücklich, die vorgegebenen Texte aus dem Code zu entfernen und den Empfang zu prüfen. Der gemeinsame lokale Arbeitsstand ist inzwischen **0.1.370 / Build 370**; parallel weiterentwickelte Wartungs-/Updatefunktionen wurden erhalten.

Die öffentliche Tagesprojektion `schedule/day.js` liefert jetzt ausschließlich tatsächlich übernommene, aktiv gebundene Homepage-Einträge. Der bisherige Lückenzweig mit Mischwerk Show / AutoDJ ist vollständig entfernt. Leere Tage und freie Zeiträume erzeugen keine künstlichen Sendungszeilen. Die Oberfläche meldet nach einem erfolgreich geladenen leeren Tag ausdrücklich **„Für diesen Tag wurden noch keine Sendungen übernommen.“**. Fehler bleiben davon getrennt sichtbar.

`schedule/relay.js` erhält gültige empfangene topic-/nick-Anzeigetexte unverändert im bestehenden atomaren Wochencommit. Die bisherigen nativen Identitäts-, Revisions-, Überschneidungs- und normalisierten Bestandsprüfungen bleiben erhalten. Die ursprünglichen Anzeigezeichenfolgen werden nach der Fachprüfung übernommen; Steuerzeichen, überschrittene Längen und leere Pflichtthemen werden abgewiesen, statt still verändert. AutoDJ-Namen werden im Tagespaket und in `schedule/view.js` nicht mehr ersetzt; der Zusatz Mit entfällt ebenfalls. Der Studioabgleich erhält bei aktiv gebundenen Homepage-Einträgen den Webtitel und protokolliert weiterhin die tatsächlichen Studiozeiten. Es gibt keine zusätzliche Queue oder Schnittstelle und keine Datenmigration. Schon früher umgeschriebene gespeicherte Texte benötigen einen neuen regulären Homepageauftrag, um ihre ursprünglichen Werte erneut zu erhalten.

Zwei passende Gegenfälle scheiterten vor der Korrektur an Textnormalisierung beziehungsweise Studioüberschreibung und bestehen anschließend. Die gezielte Nodeprüfung besteht mit **81/81 Fällen**, darunter Inhaltsgleichheit für Live und AutoDJ, Ablehnung ungültiger Rohtexte und Schutz des Webtitels beim Studioabgleich. **14/14 Sendeplan-Browserfälle** bestehen jeweils am App-Arbeitsbestand und am tatsächlich gebündelten UPLOAD. Sie prüfen leere Tage, direkten Live-Namen, tatsächlich gelieferten AutoDJ-Namen, HTML als sicheren Text, Anlegen/Ändern/Löschen, Fokus, Audio und Größenverhalten in K3/STAPP.

Der vollständige Paketbau besteht mit **596/596 Nodefällen**, Architektur-/API-/Längenprüfungen und beiden verifizierten Rhino-Engines **1.7.7.2 und 1.9.1**, jeweils **1294 Prüfungen** an App und UPLOAD einschließlich unverändert erhaltener Webtexte. Die vollständige Node-Suite besteht zusätzlich am tatsächlichen gebündelten UPLOAD mit **596/596 Fällen**. Der aktuelle Paketvergleich bestätigt **113 Dateien, 104 Texte, maximal 9494 UTF-16-Zeichen** und fünf konsistente Manifeste. Paket: `C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/`. Protokolle im System-Tempverzeichnis: `mischwerk-sendeplan-370-paket.log`, `mischwerk-sendeplan-370-upload-node.log` und `mischwerk-sendeplan-370-upload-browser.log`.

### Beobachtung in der echten Knuddels-App

Über die Computersteuerung wurde der vorhandene Channel **MischWerk / Otterchen** ausgewählt und dessen Sendeplan geöffnet. Die echte Ansicht zeigt am **Mittwoch, 11. November** weiterhin **Mischwerk Show / AutoDJ**, **Ganztägig** und **00:00–24:00 Uhr**. Die neue Darstellung ist dort noch nicht sichtbar; die installierte Buildnummer wurde dadurch nicht ermittelt. Es wurde kein Update, Neustart oder FTP-Upload ausgeführt. Die Datenherkunft dieser alten Zeile und eine konkrete erfolgreiche Auftragübernahme lassen sich aus dieser Anzeige weiterhin nicht eindeutig bestimmen.

Ein erneuter öffentlicher JSON-Abruf am 11.11.2026 zeigt in der aktuellen und nächsten Woche weiterhin ausschließlich je sieben generierte AutoDJ-Lücken und keine nicht generierten Einträge. Die Vorwoche enthält zwei öffentliche Live-Einträge am 07.11.2026; deren öffentliche topic-Felder sind leer. Diese Leseprojektion ist keine Auftragswarteschlange. Daraus ist weder der tatsächliche `entry.topic` eines möglichen Auftrags noch dessen native Annahme ableitbar; eine konkrete zusammengehörige Auftrags-/Ergebnisquittung fehlt weiterhin.

Für den echten Empfangstest muss der vollständige neue Paketstand installiert sein. Ein danach erfolgreich geladener leerer Tag zeigt keine künstliche Sendung mehr. Eine beabsichtigte Homepageänderung muss anschließend als tatsächlicher Eintrag mit passender Auftrags-/Ergebnisquittung verfolgt werden. Der bestehende Statuskanal, gespeicherte Schlüssel und Aktivierung werden dafür nicht erneut eingerichtet.

## Kontrollbefund vor der anschließenden Korrektur · Build 369

Grundlage ist die vom Betreiber nachgereichte `C:/Users/Yves/Desktop/Übergabe.zip` mit `MischWerk Sendeplan Kontrollauftrag.md` und zwei Screenshots. ZIP-SHA-256: **8D6D286D7274A35EC58A4F098E8C23F439BD8EBFE313952B0CE9C17CB869479D**. Geprüft wurde der inzwischen vorhandene lokale Stand **0.1.369 / Build 369**. Der folgende Befund ergänzt den früheren Transportabgleich zu Build 368: Die vorhandene Auftragsverarbeitung bedeutet ausdrücklich keine unveränderte Übernahme aller Anzeigetexte.

### Belegte Ursachen

| Stelle | Tatsächliches Verhalten und Abweichung zur übergebenen Anforderung |
| --- | --- |
| [schedule/day.js](../../src/backend/schedule/day.js), Zeilen 28–30 | Freie Zeiten werden lokal als `Mischwerk Show` / `AutoDJ` erzeugt. Ein vollständig leerer Tag reproduziert damit den Text des Knuddels-Screenshots, ohne eine gespeicherte Sendung oder einen Firebase-Auftrag. Erwartet werden laut Kontrollunterlage `MischWerk Radio Show` / `MischWerk am Pult`. |
| [schedule/commands.js](../../src/backend/schedule/commands.js), Zeilen 74–92 | Bei `kind: autodj` wird der übermittelte Nick bereits beim Normalisieren durch `MischWerk` ersetzt. Bei Live-Sendungen wird der Nick über UserAccess auf die native Kontoschreibweise umgestellt. Das Thema durchläuft `runtime.text`. |
| [core/validation.js](../../src/backend/core/validation.js), Zeile 7 | `runtime.text` ersetzt Steuerzeichen, fasst Leerraum zusammen und entfernt äußere Leerzeichen. Beispiel: Empfang `topic: "  Web   Titel  "`, `nick: "otterchen"`; Speicherung und Tagespaket `Web Titel` / `Otterchen`. Zu lange Themen werden abgelehnt, nicht abgeschnitten. Normale bereits normalisierte Titel bleiben an dieser Stelle erhalten. |
| [schedule/day.js](../../src/backend/schedule/day.js), Zeile 41 | Das Thema wird aus dem gespeicherten Eintrag übernommen; für AutoDJ wird der Name erneut durch `AutoDJ` ersetzt. |
| [schedule/view.js](../../app/www/js/schedule/view.js), Zeilen 68–69 | Der Titel wird als Textknoten ausgegeben. Der Name wird bei AutoDJ unabhängig vom gelieferten Nick zu `AutoDJ`; Live-Namen erhalten den Zusatz `Mit `. Die CSS-Regeln umbrechen lange Titel und Namen, ohne eine eigene Textkürzung einzuführen. |
| [schedule/broadcasts.js](../../src/backend/schedule/broadcasts.js), Zeilen 29–55 | Eine passende gebundene Planung kann durch den bestehenden Studioabgleich gefunden werden. `if (topic) { entry.topic = topic; }` überschreibt dann auch deren Webtitel. Reproduktion: `Web-Original` wird nach nativer Anmeldung, Themenänderung und Abmeldung zu `Natives Studiothema`, bei unveränderter aktiver Firebase-Zuordnung. |

Für einen übernommenen ganztägigen AutoDJ-Eintrag wurde die vollständige Kette lokal beobachtet: Empfang `MischWerk Radio Show` / `MischWerk am Pult` → Speicherung `MischWerk Radio Show` / `MischWerk` → Tagespaket und sichtbare Browseranzeige `MischWerk Radio Show` / `AutoDJ`. Die Anforderung unveränderter Titel und Namen ist somit im aktuellen Stand nicht durchgängig erfüllt.

Die drei sichtbaren Abweichungen sind im Code nachvollziehbar. Die konkrete Herkunft der Zeile im echten Knuddels-Screenshot ist trotzdem nicht eindeutig bewiesen: Derselbe Text könnte auch aus einem übernommenen Eintrag mit entsprechendem Thema entstehen. Es fehlt der zugehörige native Wochen-/Bindungsstand. Im zugeschnittenen Webbild fehlt das Datum; ein Vergleich desselben Tages derselben Woche wurde nicht belegt.

### Ganztagsanzeige und Lücken

`schedule/view.js:50` setzt bei `00:00`–`24:00` und nicht offenem Ende die Positionsbeschriftung `Ganztägig`. Zeile 66 erzeugt zusätzlich die Uhrzeit `00:00 – 24:00 Uhr`. Beide beschreiben denselben Tagesbereich. Es wurde keine doppelt gespeicherte Sendung daraus festgestellt. Die lokale Browserreproduktion zeigt beide Angaben in K3 und STAPP. Die Anzeige könnte für Ganztagsbereiche auf eine einzelne Zeitbeschriftung vereinheitlicht werden; dies ist von den festgelegten Titel-/Namensinhalten getrennt zu behandeln.

Vor, zwischen und nach zwei festen Sendungen entstehen ausschließlich passende freie Bereiche: `00–10 AutoDJ`, `10–12 Sendung`, `12–14 AutoDJ`, `14–16 Sendung`, `16–24 AutoDJ`. Es werden nur die zwei übernommenen Sendungen gespeichert. Keine zusätzliche ganztägige Lücke überlagert die belegten Bereiche. Vorhandene Fälle für Ganztags, Open End, Mitternacht, Nachbarwochen und Überlappungsablehnung bestehen ebenfalls.

### Zuordnung und Grenzen

Der reguläre Relayweg hält dieselbe Firebase-ID bei Wiederholung und Änderung auf derselben nativen ID. Die geprüfte Folge Anlegen → Wiederholung → Änderung → Löschen → Wiederholung endet mit Revision 3, keinem Eintrag und einem gelöschten Bindungsmarker. Im geprüften Relay-Löschablauf bleibt keine aktive verwaiste Zuordnung.

Ein gesonderter Randfall wurde reproduziert: Die bestehende inhabergeprüfte native Wochen-Fachaktion löscht einen gebundenen Eintrag in `schedule/commands.js:33`, erhält aber dessen `relayBindings` mit `deleted: false`. Der öffentliche Tag zeigt danach die freie Zeit; die Zuordnung verweist weiterhin auf das fehlende Ziel. Der vorhandene Schutz verhindert eine stille Neuzuordnung dieser Firebase-ID. Dies ist ein belegter lokaler Randfall, kein Nachweis, dass er im laufenden System aufgetreten ist.

### Ausgeführte Prüfung und Korrekturvorschlag

**78/78 vorhandene Nodefälle** für Relay/Sendeplan sowie **14/14 vorhandene Edge-Browserfälle** für die integrierten K3-/STAPP-Modelle bestehen. Die bisherigen Fälle erwarten teilweise ausdrücklich die abweichenden Texte; ihr Erfolg belegt die neue Inhaltsanforderung nicht. Zusätzliche temporäre Beobachtungsproben verwenden die vorhandenen Fixtures und den integrierten Emulator unverändert. Sie verfolgen Empfang, Speicherung, Tagespaket und tatsächliche Browser-Textknoten. Sämtliche externen Browseranfragen waren gesperrt; es gab keine externen Anfragen oder Browserfehler. Proben, JSON-Befund und zwei Prüfbilder liegen ausschließlich unter `C:/Users/Yves/AppData/Local/Temp/mischwerk-homepage-rueckmeldung-20261111/`.

Konkrete Korrekturstellen für eine anschließende Umsetzung:

1. Lokale Lücken in `schedule/day.js` mit den gemeinsamen Namen `MischWerk Radio Show` / `MischWerk am Pult` beschriften; weiterhin ausschließlich ableiten.
2. Empfangene Anzeigeinhalte im Relay-Speicherweg validieren und unverändert erhalten. Native Identitäts-/Rechteprüfung davon trennen. `schedule/day.js` und `schedule/view.js` müssen den erhaltenen Namen darstellen, ohne AutoDJ-Ersetzung oder angehängtes `Mit `.
3. Beim Studioabgleich Webtitel aktiv gebundener Homepage-Einträge erhalten; tatsächliche Studiozeiten weiterhin im vorhandenen Eintrag protokollieren. Ungebundene lokale Studioeinträge behalten ihren bisherigen Fachweg.
4. Für native Löschung gebundener Ziele eine konsistente Behandlung festlegen und prüfen, einschließlich Bindungsstatus und späterer Firebase-Änderung; keine automatische Umbelegung oder Wiederanlage einführen.
5. Die betroffenen vorhandenen Node-/Browserfälle auf die gewünschte Inhaltsgleichheit ausrichten und Gegenfälle für Namen, Titel, Studioabgleich und Bindungs-Löschung ergänzen. Die derzeitige lokale Regel `AGENTS.md:196` verlangt noch die alten Lückentexte; bei Umsetzung muss sie im selben Schritt konsistent angepasst werden.

Die Kontrollphase verwendete die zu Beginn vorhandenen Sendeplanmodule aus Build 369. Der gemeinsame Ordner wurde währenddessen an anderer Stelle weiterentwickelt; deshalb besteht kein globaler Unverändert-Nachweis für die ursprünglich erfassten 444 Dateien. In der Kontrollphase bestand der Quellen-/Laufzeit- und Uploadabgleich mit **111 Dateien, 102 Texten, maximal 9494 UTF-16-Zeichen**. Erst der anschließende direkte Nutzerauftrag führte zur oben beschriebenen Sendeplankorrektur in Build 370. Installation und echte Auftragübernahme wurden nicht ausgeführt.

### Weiterhin fehlender Live-Nachweis

Im ZIP gibt es keine `commandId`, keine zugeordnete stabile Firebase-ID und keine zusammengehörigen Revisions-/Quittungsdaten eines realen Auftrags. Der früher bestätigte aktive Verbindungsstatus ersetzt diese Angaben nicht. Benötigt werden für eine vorhandene oder beabsichtigte redaktionelle Änderung: Datum und Woche, Auftrags- und Eintrags-ID, erwartete native Revision, UTC-Auslieferungszeit, passendes `scheduleResults`, tatsächlich gemeldete `scheduleRevisions` und der belegte Abschluss auf Firebase-Seite. Vor öffentlichem Sichtvergleich denselben Tag derselben Woche wählen. Eine konkrete echte Übernahme wurde in dieser Kontrolle nicht beobachtet.

Die kompakte Rückmeldung für den Homepage-Codex liegt auf dem Desktop als [MischWerk Sendeplan Kontrollergebnis.md](<C:/Users/Yves/Desktop/MischWerk Sendeplan Kontrollergebnis.md>).

## Vorheriger Transportabgleich der Übergabe · Build 368

Geprüfter lokaler Stand: **0.1.368 / Build 368**, Arbeitsordner **C:/Users/Yves/Desktop/MischWerk/**. Grundlage ist die damalige Eingangsfassung von `C:/Users/Yves/Desktop/Knuddels Sendeplan Übergabe.md`, SHA-256 **FB969963107AB7C7EF5AA2C48D72186A6BD712A99E6487F99703EDF2F6A25F6C**. Auf anschließenden ausdrücklichen Nutzerauftrag wurde diese Datei um den Knuddels-Befund, den bestätigten Verbindungsstatus und die Zuständigkeit des Homepage-Codex ergänzt. Der Auftrag zum Bestandsabgleich ist abgeschlossen; gegenüber dem beschriebenen Vertrag ist keine fehlende Knuddels-Funktion festgestellt worden. Es wurde kein neuer Build erzeugt.

| Gegenstand der Übergabe | Tatsächlich vorhandene Verarbeitung |
| --- | --- |
| Bestehender Statuskanal | [connection.js](../../src/backend/android/connection.js) sendet per nativem HTTP-POST an das konfigurierte feste Ziel. [publisher.js](../../src/backend/android/publisher.js) übernimmt Aufträge ausschließlich aus einer passenden, rechtzeitigen HTTP-200-Antwort mit `accepted === true`, plausibler `serverTime` und gültigem `wishes`-Array. |
| `scheduleCommands` | [commands.js](../../src/backend/android/commands.js) prüft höchstens einen Auftrag mit exakt `commandId`, `operation`, `week`, `expectedRevision`, `id`, `entry`. `save` erwartet die sieben genannten Sendungsfelder; `delete` verlangt `entry: null`. Bestehende Vollstunden-, Nick-, Themen- und Überschneidungsprüfungen bleiben maßgeblich. |
| Firebase-Eintrags-ID | [relay.js](../../src/backend/schedule/relay.js) ordnet die stabile String-ID dauerhaft einer nativen Woche und Eintrags-ID zu. Änderung, Zuordnung und Ergebnis werden zusammen gespeichert. Wiederholungen, Neustarts und Löschmarker verhindern doppelte oder neu zugeordnete Einträge. |
| Ergebnisse und Revisionen | `pendingRelayResults()` liefert höchstens zehn `scheduleResults` im folgenden regulären POST. [projection.js](../../src/backend/android/projection.js) meldet die tatsächlich lesbaren `scheduleRevisions` für vorige, aktuelle und nächste Berliner ISO-Woche. Die öffentliche JSON-Revision wird dafür nicht übernommen. |
| Öffentlicher Tagesplan | [day.js](../../src/backend/schedule/day.js) zeigt bestätigte aktive `relayBindings`. Ungebundene Alteinträge und automatische Studioaufzeichnungen bleiben außerhalb dieser Projektion. AutoDJ-Lücken werden nur abgeleitet. Die öffentliche JSON-Ansicht wird von Knuddels nicht als Auftragsliste eingelesen. |

Die vorhandene native Tagesansicht und deren Gestaltung erfüllen den bisherigen freigegebenen Projektstand. Aus der Homepage-Ansicht ergibt sich kein zusätzlicher Gestaltungsauftrag.

### Öffentliche HTTP-Stichprobe

Die [Homepage](https://radio-mischwerk.web.app/) und alle drei unten verlinkten öffentlichen Wochenabrufe lieferten bei der Prüfung HTTP 200:

| Montag der Woche | Einträge insgesamt | `generated: true` | Ohne `generated: true` | Öffentliche `revision` |
| --- | ---: | ---: | ---: | ---: |
| [02.11.2026](https://radio-mischwerk.web.app/api/public-schedule?week=2026-11-02) | 10 | 8 | 2 | 0 |
| [09.11.2026](https://radio-mischwerk.web.app/api/public-schedule?week=2026-11-09) | 7 | 7 | 0 | 0 |
| [16.11.2026](https://radio-mischwerk.web.app/api/public-schedule?week=2026-11-16) | 7 | 7 | 0 | 0 |

`knuddelsSyncState` und `knuddelsSyncError` waren in allen drei Antworten `null`. Die aktuelle Woche enthält somit in dieser öffentlichen Stichprobe ausschließlich generierte AutoDJ-Zeiten. Diese Daten belegen weder ausgelieferte Änderungsaufträge noch eine erfolgreiche native Übernahme. Öffentliche Darstellung, interne Auftragswarteschlange und echte Knuddels-Revisionen sind getrennt zu beurteilen.

### Nachgereichter nativer Verbindungsstatus

Der Betreiber hat am 11.11.2026 einen Screenshot aus `/mw admin` → **Verbindung** bereitgestellt. Sichtbar sind **„Aktiv – Daten werden übertragen.“**, **„Schlüssel ist hinterlegt.“**, die Taste **„Aktiv“** und **„Ausschalten“**. Nach dem vorhandenen Controller bedeutet dies `publisherActive === true` und eine angenommene letzte reguläre Statusantwort (`lastPost.accepted`). Der Screenshot zeigt keine Buildnummer, keinen einzelnen Sendeplanauftrag und keine Ergebnisquittung.

Die Homepage einschließlich Sendeplanpflege wird vom anderen Codex betreut. Dieser übernimmt den nächsten Schritt der fachlichen Datenflussprüfung. Die damalige Desktop-Rückgabe `MischWerk Sendeplan Rückgabe an Homepage-Codex.md` wurde inzwischen entfernt; maßgeblich ist der Kontrollbefund oben und die dort verlinkte neue Rückmeldung. Die bisher beschriebene manuelle Homepageänderung wurde vom Betreiber nicht als ausgeführt bestätigt.

### Prüfergebnis und verbleibender Betriebsnachweis

**115/115 vorhandene Nodefälle** bestehen: 42 für Relay/Tagesplan/Team, 36 für den Sendeplan und 37 für Android-Transport/Wünsche/Diagnose. Geprüft wurden insbesondere Anlegen, Ändern und Löschen über reguläre Antworten, ID-Bindung, Ergebnisrückweg, Revisionskonflikte, Wiederholung/Neustart, Speicherfehler, AutoDJ-Ableitung und abgewiesene ungültige Antworten. Quellen-/Laufzeitabgleich und `check:upload` bestehen. Das vorhandene Paket enthält **105 Dateien, davon 99 Texte, maximal 9494 UTF-16-Zeichen**; alle fünf Manifeste stimmen überein. Die **339 vor dieser Prüfung erfassten Dateien** aus Backendquellen, App, Deployment, festem UPLOAD sowie Paket-/Lockdatei bleiben per SHA-256 unverändert. Einzelheiten stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Der tatsächlich in Knuddels installierte Build und die Annahme eines konkreten Sendeplanauftrags bleiben unbekannt. Die aktive Statusverbindung ist durch den nachgereichten Screenshot belegt. Der noch offene gemeinsame Betriebsnachweis besteht aus einer beabsichtigten Homepageänderung, dem zugehörigen `scheduleCommands`-Auftrag, dessen nativer Anwendung sowie passendem `scheduleResults` und tatsächlicher `scheduleRevisions` im nächsten regulären POST. Dazu vorhandene redigierte technische Befunde verwenden; keine Schlüssel, vollständigen Nutzlasten oder privaten Inhalte weitergeben. Der aktuelle Bedienweg für den Verbindungsstatus ist `/mw admin` → Verbindung; frühere Relay-Chatbefehle sind entfernt. Die bestehende Konfiguration muss für den Abgleich nicht erneut gespeichert werden.

## Historischer Implementierungsabschluss · Build 308

Stand: 08.11.2026. Die vom Betreiber ausdrücklich freigegebene Anforderungsfassung vom **03:10:26 Uhr Europe/Berlin** ist vollständig in **0.1.308 / Build 308** umgesetzt. Genau ein lokales Funktionspaket wurde erstellt; seine native Installation und gemeinsame Abnahme stehen aus.

Referenz: Knuddels-Anforderungen-Homepage-Sendeplan.md, SHA-256 **D244DBD5D6999EE962E2B52D2CBACD3780548638A773E8CE57511881E4285457**. Die Referenzdatei wurde nicht verändert. Die in dieser Fassung Firebase-seitig abgesicherten Randfälle sind geschlossen; dazu werden keine erneuten Antworten angefordert.

### Gelieferter Knuddels-Stand

- Bestehender signierter Status-POST, Sync-Schlüssel, vier signierte Strings, Senderstatus, Lauftext, Wunschqueue und 20-Sekunden-Takt bleiben erhalten. Keine neue URL, kein WebHook, Callable oder Timer.
- Keine scheduleUpdates/teamUpdates. Jeder reguläre POST meldet ausschließlich bekannte native scheduleRevisions für vorige/aktuelle/nächste Berliner ISO-Woche und optional moderatorRevision. Unbekannte Werte werden ausgelassen; Ergebnisrevisionen bleiben tatsächliche Ganzzahlen oder ausdrücklich null.
- Je höchstens ein exakt geformter Plan-/Teamauftrag wird ausschließlich aus einer frischen, passenden, angenommenen regulären Antwort übernommen. Keine Rollen-, Konto-, UID- oder E-Mail-Felder und keine zusätzliche Inhaberannahme. Native Clientaktionen behalten ihre bisherigen Rechteprüfungen.
- Stabile Firebase-String-ID wird dauerhaft auf die native Wochen-/Eintrags-ID abgebildet. Normalisierter vollständiger Bestandsvergleich: genau ein Treffer verknüpfen, kein Treffer regulär neu anlegen, mehrere Treffer fachlich ablehnen. Ein schon gebundenes Ziel darf nie einer zweiten Firebase-ID gehören. Bekannte fehlende Ziele werden nicht neu zugeordnet.
- Vorhandener Wochenadapter schreibt Mutation, relayBindings mit Zuordnung/Löschmarker und applied-Beleg in **einem Wochenobjekt**. Keine zweite Datenablage. Unbekannte und wiederholte Löschungen werden idempotent quittiert; Löschmarker bleiben dauerhaft. Zuordnungen und Löschmarker werden niemals mit dem 64er-Ergebniscache gekürzt. Speichergrenzen lassen Daten und Identität erhalten und täuschen keinen Erfolg vor.
- Teamaufträge nutzen die vorhandene native Nickauflösung, 50er-Grenze und denselben allgemeinen Commit. Bereits vorhandenes add und bereits fehlendes remove quittieren applied, ohne weitere Teamrevision, Abmeldung, Entfernung oder öffentliche Benachrichtigung. Tatsächlicher Entzug erhält die bisherigen Studio-/Inhaberschutzregeln.
- Im folgenden regulären POST höchstens zehn scheduleResults und zehn moderatorResults. Neue Ablehnungen enthalten validation, business_rule oder ausschließlich bei gültiger abweichender Revision revision_conflict. Fehlende/ungültige erwartete Revision ist validation. Technische Speicherfehler bleiben ohne falsche endgültige Quittung erneut zustellbar. Bekannte Auftragskennungen liefern das gespeicherte Ergebnis; angenommene POSTs bestätigen die übertragenen Belege flüchtig, Neustarts bieten sie erneut an.
- Native Inhaberaktionen, Minutenzeiten, Rechte, Wunschdaten und automatische Studioeinträge bleiben erhalten. Keine Migration, Gesamtlistenübernahme oder öffentliche Rückprojektion lokaler Inhalte. currentSong/currentArtist werden weiterhin nicht gesendet, auch nicht als null.

### Private Diagnose und Annahmen

Der damalige Befehl /mischwerk-relay status ergänzte lastFailure mit exakt stage, httpStatus und atUtc; dieser Chat-Einstieg ist im aktuellen Stand entfernt. Die interne Diagnose bleibt erhalten. Die Stufen sind prepare, send, timeout, http_response, response_url, response_size, response_json, response_contract und command_storage. HTTP-Code nur, soweit tatsächlich bekannt, sonst null; Zeit als UTC-ISO. Diagnose enthält keine Inhalte, IDs, Nicks, URLs, Geheimnisse oder Exceptions. Der erfolgreiche erste reguläre POST und die bestehenden technischen Zähler bleiben erhalten.

Je eine Zeile zu den verwendeten nativen Annahmen:

- Native Identität ist das bestehende Paar aus ISO-Woche und numerischer Eintrags-ID; beide bleiben intern, Firebase-IDs bleiben dauerhaft eindeutig.
- Eine fehlende gespeicherte Woche besitzt den vom vorhandenen Adapter definierten echten leeren Stand mit Revision 0; unlesbare oder ungültige Stände werden niemals durch geschätzte Revisionen ersetzt.
- Gelöschte Firebase-IDs werden nicht reaktiviert; Wiederherstellung oder Wochenverschiebung verwendet nach dem vereinbarten Lebenszyklus eine neue stabile ID.
- Automatische Studioeinträge sind keine Erstübernahmekandidaten; aktive sowie noch nicht abgeglichene Studioeinträge behalten ihre vorhandenen Schutzregeln.
- Nicht festes Ende kommt als leerer String; Ganztags wird intern wie bisher als 00:00 bis 00:00 gespeichert, Open End mit leerem Ende.
- Vorhandene native Pflichtfelder bleiben Pflichtfelder: insbesondere ein gültiger ernannter Live-Nick beziehungsweise Inhaber und ein nicht leeres Thema; AutoDJ bleibt die bestehende eigene Sendeart.
- Eine bereits erfüllte Löschung oder Teamaktion erhöht die Fachrevision nicht; das dauerhafte Speichern ihrer technischen Quittung bleibt erforderlich.
- Der letzte Fehler bleibt nach Erholung und Stop/Start sichtbar; ein Appneustart beginnt mit lastFailure null. Es entsteht keine Diagnosepersistenz.
- Alte bereits gespeicherte Ablehnungsbelege ohne reason bleiben unverändert; ein historischer Grund wird nicht erfunden. Neue Ablehnungen enthalten den tatsächlichen Grund.
- Lokale/automatische Studioinhalte werden nicht öffentlich übertragen; die konkrete Titel-/Interpretenquelle ist weiterhin im Firebase-/Homepage-Projekt nachzuweisen und wird durch diesen Build nicht ersetzt.

### Lokaler Nachweis

475/475 Nodefälle bestanden, darunter 35 gezielte Plan-/Team-/Diagnosefälle. Zwei neue Gegenfälle scheiterten vor der Umsetzung am bisherigen Build 307 und bestehen jetzt. Beide verifizierten echten Rhino-Engines 1.7.7.2 und 1.9.1 bestehen jeweils 1160 Prüfungen einschließlich nativer Java-Strings/-Integer am HTTP-Port. Architektur, API-Signaturen, Quellen-/Runtimegleichheit und Grenzen sind geprüft.

Die Oberfläche ist gegenüber dem Beginn dieses Auftrags per SHA-256 **85/85 Dateien bytegleich**. Der bestehende Appbestand enthält 151 Dateien mit 64 Backendmodulen. Das eine fertige Paket liegt unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**: 133 Laufzeitdateien, davon 126 Texte, höchstens 9485 UTF-16-Zeichen; fünf konsistente Manifeste. Am fertigen Paket bestehen zusätzlich 5/5 Edge-Emulatorfälle für K3/STAPP-Wünsche, Audio/Entwürfe/Neustart, Parserstart, zwei Nutzer und Team-Popup. Details im [Prüfbericht](../pruefung/PRUEFBERICHT.md).

### Übergabe und gemeinsame Abnahme

Die Anforderungen zu Reihenfolge, Konfliktzähler, Wochenwechsel, ID-Lebenszyklus, Revisionspriorität, offenen Befehlen und Ausgangsbestand gelten gemäß 03:10-Fassung als Firebase-seitig abgesichert. Keine erneute Vertragsklärung oder weitere Freigabe ist dafür nötig. Die zuvor genannten Risiken sind Knuddels-seitig durch eindeutige dauerhafte Bindungen, atomare Commits, Fachregeln und präzise Ergebnisse abgesichert.

Nach Installation dieses Pakets gemeinsam den echten Datenfluss prüfen:

1. Privater Knuddels-Status nennt den tatsächlich installierten Build, aktiven Publisher und reguläre HTTP-200-/accepted-Annahme. Bestehende Schlüssel und Aktivierung nicht unnötig erneut speichern.
2. Tatsächliche native Revisionen kommen bei Firebase an. Eine beabsichtigte Homepageänderung liefert genau einen Auftrag und wird genau einmal nativ angewandt oder mit tatsächlichem Grund abgelehnt.
3. Passende Ergebnisquittung erreicht Firebase im nächsten regulären POST; ein offener Auftrag wird erst damit abgeschlossen. Eine erneute Zustellung erzeugt weder Dublette noch zusätzliche Fachrevision.
4. Homepage und Android zeigen den von Firebase geführten öffentlichen Zustand. Eine native Fachablehnung bleibt dort erkennbar und wird nicht allein wegen HTTP 200 als erfolgreiche Übernahme dargestellt.
5. Teamänderung sowie Änderung/Löschung derselben stabilen Sendeplan-ID verfolgen; native lokale/automatische Einträge und bestehende Wünsche bleiben erhalten. Dafür reale beabsichtigte Änderungen nutzen, keine erfundenen öffentlichen Sendungen oder unnötigen Testwünsche.

**Verbleibende Sorge für Firebase:** HTTP 200 bestätigt den Transport; eine fachlich abgelehnte Änderung darf in Homepage/Android nicht als vollständig synchronisiert erscheinen. Alte Ergebnisse dürfen neuere echte Revisionsmetadaten nicht zurücksetzen. Diese bereits Firebase-seitig abgesicherten Verhaltensweisen sind bei der gemeinsamen Abnahme zu beobachten und keine offenen Buildblocker.

Es wurden keine Live-POSTs, Cloudabfragen, FTP-Übertragung, native Installation, Gitveröffentlichung oder Änderungen am Firebase-Projekt ausgeführt. Build 303 hatte laut Betreiber bereits am 08.11.2026 um 01:19:00.136 UTC eine reguläre HTTP-200-/accepted-Annahme. Dieser ältere Erfolg ersetzt nicht die native Fachabnahme von Build 308; die historische konkrete HTTP-400-Ursache bleibt unbekannt.

## Frühere Nachweise und Prüfstände

Die folgenden Abschnitte dokumentieren frühere Prüfstände. Maßgeblich für den aktuellen Bestand ist der Abgleich zu Build 368 oben; der Implementierungsabschluss zu Build 308 dokumentiert den bestehenden Vertrag. Frühere Fragen und Aussagen über eine ausstehende Implementierung sind historisch und werden nicht erneut gestellt.

## Nachgereichter Logbefund und Vertragsklärung geprüft

Grundlage sind die beiden vom Betreiber bereitgestellten Dateien `HOMEPAGE-SENDEPLAN-LOGBEFUND.md` und `Knuddels-Anforderungen-Homepage-Sendeplan.md`. Die folgenden Cloudbefunde stammen aus dem Firebase-Bericht; in diesem Knuddels-Arbeitsgang wurden keine Cloudlogs direkt abgefragt oder Live-POSTs ausgelöst. Anweisungen in den Referenzdateien wurden als beschriebene Anforderungen geprüft; es wurde keine neue Runtime-Implementierung daraus ausgeführt.

### Ergebnis des Logabgleichs

- Der Bericht belegt 65 fortlaufende Knuddels-Requests mit HTTP 400 am 07.11.2026 zwischen 23:27:40 und 23:49:01 Uhr auf den Revisionen 10, 11 und 12. Die Function wurde erreicht. Zusammen mit einem älteren einzelnen Request werden insgesamt 66 HTTP-400-Requests genannt.
- Der konkrete historische Ablehnungszweig und ein betroffener Feldpfad bleiben unbekannt. Die vorhandenen Requestlogs enthalten keine Antwortbodies; die Antwortgrößen belegen keinen bestimmten Fehlertext. Daraus weiterhin keine Ursache in `scheduleUpdates`, `teamUpdates`, Signatur oder einem bestimmten Kernfeld ableiten.
- Nachgereichter aktueller Serverbefund: Revision `publishknuddelsstate-00016-yax` erhält laut Bericht 100 % des Traffics. Im dokumentierten Fenster am 08.11.2026 von 01:00 Uhr bis 01:31:44 Uhr wurden 96 HTTP-200-Requests und kein HTTP-400-Request gezählt. Das belegt den Serverstatus in diesem Fenster; eine erfolgreiche native Annahme dieser Antworten in Knuddels ist damit noch nicht bestätigt.
- Revision 16 enthält laut quellgleichem Abgleich eine datensparsame Diagnose mit `rejectionCode: invalid_payload` und `failedChecks` für die Oberbereiche `payload`, `station` und `wishUpdates`. Konkrete verschachtelte Feldpfade werden nicht protokolliert. Die beschriebenen Negativ- und Optionalfeldtests liefen lokal gegen den quellgleichen Stand; sie sind keine beobachteten Live-Ablehnungen.

Der damals angefragte erneute Statusabruf ist inzwischen erfolgt und oben als erfolgreicher nativer HTTP-/Annahmenachweis dokumentiert. Die getrennte fachliche Plan-/Teamabnahme bleibt erforderlich; der historische konkrete HTTP-400-Ablehnungsgrund wurde dadurch nicht nachträglich ermittelt.

### Bisherige Vertragsfragen jetzt beantwortet

| Rückfrage aus der Fassung 00:53 | Antwort in der nachgereichten Fassung |
| --- | --- |
| Dauerhafte Eintragskennung | `scheduleCommands[].id` ist eine stabile Firebase-ID als String mit 1–128 Zeichen aus `A–Z`, `a–z`, `0–9`, `_`, `-`. `commandId` bleibt die einzelne Auftragskennung. Beispiele für Erstübernahme, Änderung und Löschung zeigen die tatsächliche Arrayform. |
| Erstübernahme vorhandener Sendungen | Exakt alle normalisierten Werte `week, date, kind, timing, start, end, nick, topic` vergleichen. Ein Treffer wird verknüpft, kein Treffer nach vorhandenen Regeln neu angelegt, mehrere Treffer abgelehnt. Der Betreiber richtet den Ausgangsbestand auf der Homepage ein; eine erfolgte Einrichtung ist dadurch noch nicht nachgewiesen. |
| Native Knuddels-Pflege und Studioeinträge | Bestehende Inhaberaktionen, Rechte, Bedienabläufe und automatische Studioeinträge bleiben unverändert lokal. Sie werden nicht in Homepage oder Android projiziert. Firebase führt den öffentlichen Inhalt. |
| Titel und Interpret | `currentSong` und `currentArtist` gehören ausdrücklich nicht in den Knuddels-Vertrag. Homepage und Android verwenden die vorhandene StreamPanel-Providerquelle. Ein eigener serverseitiger Firebase-Abruf ist laut Dokument weiterhin nicht belegt; Knuddels soll dafür keine Ersatzquelle aufbauen. |

Zusätzlich ist jetzt ein optionaler Ablehnungsgrund festgelegt: `reason: "revision_conflict"`, `"validation"` oder `"business_rule"`. Nur bei einem ausdrücklich gemeldeten Revisionskonflikt darf Firebase genau einen neuen Versuch mit aktueller Revision und neuer `commandId` ausstellen. Andere Ablehnungen und ein zweiter Konflikt bleiben endgültig. Diese neue Erweiterung ist im aktuellen Knuddels-Code noch nicht vorhanden.

### Noch umzusetzender Knuddels-Vertrag

Die bisherigen fachlichen Rückfragen sind damit für die weitere Implementierung geklärt. Build 304 enthält weiterhin die alte Vollprojektion. Ein künftiger gemeinsamer Funktionsbuild muss den Versand auf `scheduleRevisions` und `moderatorRevision` umstellen, `scheduleUpdates`/`teamUpdates` entfernen, die stabile Firebase-/Knuddels-ID-Zuordnung einschließlich gelöschter Zuordnungen ergänzen, erfüllte Teamzustände idempotent quittieren sowie höchstens zehn Ergebnisse je Bereich einschließlich der neuen Ablehnungsgründe ausgeben. Wunschweg, Senderfelder, Oberfläche, native Rechte und vorhandene Einträge bleiben erhalten.

Dieser Arbeitsgang umfasst Prüfung und Fortschreibung der Rückantwort. Kein neuer Build, keine Umsetzung der beschriebenen Änderungen, keine Migration, kein Rollout und keine erneute Behauptung eines bestätigten Gesamtdatenflusses. Die nachfolgenden Abschnitte dokumentieren den vorherigen Prüf- und Fehlerstand.

## Historischer Abgleich der Anforderungsfassung 00:53

Die damaligen Rückfragen und die damalige Feststellung fehlender Cloudbefunde sind durch die oben zusammengefassten Nachlieferungen aktualisiert. Insbesondere ist die frühere Anforderung optionaler Titel-/Interpretenfelder durch deren ausdrücklichen Ausschluss ersetzt.

Die neue Fassung verlagert die Führung des öffentlichen Sendeplans und Teams nach Firebase; gepflegt werden diese Inhalte ausschließlich auf der Homepage. Knuddels soll Einzelbefehle übernehmen und Revisionen sowie Ergebnisse zurückmelden. Das ersetzt den zuvor vereinbarten Export vollständiger öffentlicher Wochen-/Teamprojektionen. URL, Signatur, Schlüssel, Heartbeat, Wunschweg und Oberfläche sollen erhalten bleiben.

### Abgleich mit dem tatsächlich vorhandenen Code

| Bereich | Stand in Build 304 | Änderung laut Fassung 00:53 |
| --- | --- | --- |
| Sendeplan-/Teamexport | `android/projection.js` liefert weiterhin `scheduleUpdates` und `teamUpdates`. | Beide Vollprojektionen aus dem Relay-Body entfernen; vorhandene Knuddels-Daten erhalten. |
| Revisionen | `scheduleRevisions` und `moderatorRevision` werden noch nicht gesendet. | Echte Knuddels-Revisionen aus den vorhandenen Wochen-/Teamadaptern melden; laut Vorgabe nur das zugelassene Wochenfenster. |
| Aufträge und Quittungen | `android/commands.js` verarbeitet bereits beide Auftragsbereiche; der Publisher sendet `scheduleResults` und `moderatorResults` im nächsten regulären POST. | Vorhandenen Weg weiterverwenden. Die Aussage, diese Quittungen fehlten noch, trifft auf Build 303/304 nicht zu. Die aktuelle Ausgabelimitierung von 64 auf höchstens zehn Ergebnisse je Bereich reduzieren. |
| Eintragskennungen | Die Fachlogik erwartet derzeit eine numerische Knuddels-ID; 0 beziehungsweise fehlende ID legt einen neuen Eintrag an. Eine stabile Zuordnung von Firebase-Eintrags-IDs zu Knuddels-IDs fehlt. | Die geforderte Zuordnung und Übernahme eines eindeutig identischen vorhandenen Eintrags ergänzen, ohne bestehende Einträge pauschal zu ersetzen. |
| Team-Idempotenz | Ein bereits ernannter Nutzer und das Entfernen eines nicht eingetragenen Nutzers werden bisher abgelehnt. | Für Relayaufträge passende bereits erfüllte Zustände erfolgreich quittieren; native Rechte und vorhandene Daten erhalten. |
| Titel/Interpret | `config.js` benennt Providerfelder. Tatsächliche Werte werden in `app/www/js/radio/api.js` und `provider.js` im Browser abgerufen; im Backend-Publisher gibt es dafür derzeit keinen bestätigten aktuellen Wert. | Feldnamen nicht als Titelwerte senden. Bei fehlender Quelle optionale Felder weglassen; `null` würde vorhandene Firebase-Werte ausdrücklich löschen. |

### Damalige Rückfragen – durch die Nachlieferung beantwortet

1. **Stabile Eintrags-ID und tatsächlicher JSON-Vertrag:** Bitte je eine bereinigte tatsächliche Relay-Antwort für erstmaliges `save`, spätere Änderung desselben Eintrags und `delete` bereitstellen. Welches Feld trägt die dauerhafte Firebase-Eintrags-ID, welchen Typ und welche Grenzen hat es? Ist das vorhandene `id` künftig die Firebase-ID oder weiterhin die numerische Knuddels-ID? Eine `commandId` identifiziert einen einzelnen Auftrag und ändert sich beim nächsten fachlichen Versuch; sie allein kann spätere Änderungen nicht dauerhaft demselben Eintrag zuordnen. Bitte auch die tatsächliche Array-/Objektform der Auftragsfelder zeigen.
2. **Bestandsabgleich und Umschaltung:** Der geforderte einmalige Firebase-Ausgangsbestand ist keine automatische Knuddels-Ausleitung. Bitte den eingerichteten Ausgangsbestand beziehungsweise den geplanten Umschaltpunkt bestätigen. Für den Abgleich sollten eindeutige vollständige fachliche Übereinstimmungen maßgeblich sein; die verkürzten Kriterien Woche/Datum/Start/Moderator/Thema lassen Endzeit, Sendeart und Laufzeitart offen. Laufende beziehungsweise automatische Studioeinträge besitzen zusätzliche Schutzregeln. Mehrdeutige Treffer dürfen keine bestehende Sendung still übernehmen oder verändern.
3. **Bestehende Knuddels-Pflege und Studio-Protokollierung:** Im aktuellen Code gibt es weiterhin native Inhaberaktionen für Plan und Team sowie automatische Sendeplaneinträge bei Studiowechseln. Bitte festhalten, ob diese unverändert als rein lokale Knuddels-Funktionen bestehen bleiben. Bei Firebase als führender öffentlicher Quelle würden solche lokalen Änderungen künftig nicht auf der Homepage oder in Android erscheinen. Eine Einschränkung dieser Bedienwege wäre eine zusätzliche Verhaltensänderung und muss gegenüber der Vorgabe „Bedienung nicht verändern“ eindeutig beschrieben sein.
4. **Tatsächliche Titelquelle:** Falls der neue Build echte `currentSong`-/`currentArtist`-Werte senden soll, fehlt dafür eine bestätigte Quelle im Backend. Bitte den vorgesehenen Quellweg benennen. Ohne diese Quelle können die Felder entsprechend der ausdrücklich optionalen Semantik entfallen; vorhandene Firebase-Werte bleiben dann erhalten. Ein erfundener Wert, ein pauschales `null` oder eine zweite unvereinbarte Provider-/Timerlogik ist keine Lösung.

### Damaliger Stand zum HTTP-Fehler

Die Fassung 00:53 enthält keine Antwort auf den unten dokumentierten Logauftrag: Es fehlen weiterhin ein zugeordneter Request, UTC-Zeitstempel/Trace-ID, HTTP-Status und konkreter Fehlergrund zu Build 303. Aus dem neuen Vertrag folgt kein Nachweis, dass `scheduleUpdates` oder `teamUpdates` den gemeldeten Fehler ausgelöst haben. Bitte die erreichte Deploymentrevision und die tatsächlichen Logbefunde nachreichen; die Aussage, ungültige optionale Daten künftig einzeln zu ignorieren, ersetzt keinen solchen Befund.

Prüfergebnis: Die neue Zuständigkeit und die vorgesehenen Felder sind nachvollziehbar. Für eine sichere vollständige Umsetzung fehlen insbesondere der eindeutige ID-Vertrag und die Festlegung zum Umgang mit vorhandenen Bedienwegen und Beständen. In diesem Prüfschritt wurden ausschließlich diese Rückantwort und der Prüfbericht aktualisiert. Kein neuer Build, keine Datenmigration und keine Änderung am laufenden Relay oder an vorhandenen Knuddels-Daten.

## Historischer nativer Fehler in Build 303 – damaliger Prüfauftrag an Firebase

Vom Betreiber am 07.11.2026 gemeldeter damaliger Fehlerstand. Genaue Uhrzeit und Trace-ID wurden nicht mitgeliefert. Inzwischen liegen sowohl der Firebase-Logbericht als auch der oben dokumentierte erfolgreiche native Statusabruf vor.

### Gemeldeter privater Status

Ausgabe von `/mischwerk-relay status`, inhaltlich unverändert, zur Lesbarkeit eingerückt:

```json
{
  "build": 303,
  "version": "0.1.303",
  "publisherActive": true,
  "flags": {
    "enabled": true,
    "runtimeVerified": true
  },
  "firstRegularPost": null,
  "transport": "status-response-v1",
  "queueReturn": {
    "received": 0,
    "adopted": 0,
    "duplicates": 0,
    "discarded": 0,
    "invalid": 0
  },
  "statusUpdatesConfirmed": 0
}
```

### Gemeldete private App-Logs

Die beiden Zeilen wurden vom Betreiber so übermittelt:

```text
App-Logs (privat): MischWerk: WARN: MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden. [ANDROID_HTTP_RESPONSE]
App-Logs (privat): MischWerk: WARN: MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden. [ANDROID_PUBLISH_RESPONSE]
```

### Gesicherte Einordnung

- Build 303 läuft nativ; der Publisher ist gestartet und die gespeicherten Freigabeflags sind aktiv. `firstRegularPost: null` bedeutet, dass Knuddels seit diesem Publisherstart noch keine reguläre Antwort erfolgreich angenommen hat. Ob Firebase einen Request bereits verarbeitet oder Daten gespeichert hat, ist daraus nicht erkennbar.
- `ANDROID_HTTP_RESPONSE` stammt aus der Auswertung des nativen HTTP-Callbacks in `android/connection.js`. Dieselbe Meldung kann bei Fehlercallback, fehlenden/ungültigen Response-Metadaten, abweichender Antwortadresse, zu großer Antwort oder fehlgeschlagenem JSON-Parsing entstehen. Der konkrete Grund und HTTP-Status stehen nicht in dieser Warnung.
- `ANDROID_PUBLISH_RESPONSE` entsteht anschließend, wenn der Publisher die Rückmeldung nicht akzeptieren kann. Die Meldungen belegen weder einen bestimmten HTTP-Status noch einen Fehler am Sync-Schlüssel oder an einem konkreten Payloadfeld.
- `queueReturn` und `statusUpdatesConfirmed` betreffen Android-Musikwünsche beziehungsweise deren Quittungen; sie sind keine getrennten Sendeplan-/Team-Erfolgszähler. Der gemeinsame Datenfluss mit Homepage und Android bleibt unbestätigt.

### Benötigte Angaben aus Firebase-/Hosting-Logs

Bitte einen aktuellen regulären POST an `https://radio-mischwerk.web.app/api/publishKnuddelsState` anhand vorhandener Logs untersuchen. Der Publisher verwendet den bestehenden 20-Sekunden-Takt. Es ist kein zusätzlicher Testwunsch oder erneutes Speichern des Sync-Schlüssels nötig.

1. **Requestzuordnung:** Ankunft belegt ja/nein, genauer UTC-Zeitstempel, Request-/Trace-ID, HTTP-Status und Bearbeitungsdauer. Bitte Hosting-/Routingfehler und tatsächlich erreichte Function unterscheiden; fehlende Beobachtungen ausdrücklich als unbekannt kennzeichnen.
2. **Serverseitiger Fehlergrund:** Tatsächlich protokollierter Fehlercode und die fehlgeschlagene Phase, etwa Transportauthentisierung, JSON-/Schemavalidierung oder Speicherung. Bei einem Schemafehler genügt der betroffene Feldpfad und die erwartete Form beziehungsweise der erwartete Typ. Keine komplette Nutzlast mitsenden.
3. **Bereitgestellter Vertrag:** Welche Function-/Deploymentrevision wurde erreicht? Unterstützt diese Revision bereits `scheduleUpdates`, `teamUpdates`, `scheduleResults` und `moderatorResults` im bestehenden signierten Body? Die Auftragsberechtigung wird gemäß geklärtem Vertrag in Firebase geprüft; es werden keine zusätzlichen Rollenfelder aus Knuddels erwartet.
4. **HTTP-Antwort:** Tatsächlicher Status, Content-Type und Antwortgröße in UTF-8-Bytes. Handelt es sich um gültiges JSON oder beispielsweise eine HTML-/Routingantwort? Weiterleitungen und eine mögliche Abweichung von der festen Antwortadresse bitte soweit serverseitig belegbar als Metadaten angeben.
5. **Bei HTTP 200:** Ist die Antwort ein JSON-Objekt mit `accepted: true`, einem numerischen `serverTime` in Unix-Millisekunden und einem `wishes`-Array mit höchstens zehn Einträgen, auch bei leerem Array? Die optionalen `scheduleCommands` und `moderatorCommands` dürfen jeweils höchstens einen Auftrag enthalten. Für die Diagnose reichen Feldvorhandensein, Typen, Arraylängen und Serverzeit; keine Inhalte von Wünschen oder Aufträgen.
6. **Bereits erfolgte Speicherung:** Wurden Senderdaten, Sendeplanseiten, Teamdaten oder Auftragsquittungen bereits ganz oder teilweise übernommen? Bitte gegebenenfalls nur technische Revisionen, Seitenzahlen und Zeitstempel nennen, damit ein serverseitiger Commit von einer Knuddels-seitig verworfenen Antwort unterschieden werden kann.

Knuddels akzeptiert die reguläre Antwort nur bei passender Zieladresse, HTTP 200, `accepted === true`, plausibler Serverzeit und rechtzeitigem Callback innerhalb von zehn Sekunden. Der Verbindungsadapter hat zusätzlich einen lokalen Schutz von höchstens 32768 UTF-16-Zeichen und 32768 UTF-8-Bytes für die Antwort; das ist keine zugesicherte Plattformgrenze.

Bitte die Logbefunde mit einer belegten Ursache beziehungsweise einer ausdrücklich benannten verbleibenden Lücke zurückmelden. Schlüssel, Signaturen, Authentisierungswerte, vollständige Request-/Responsebodies und persönliche Inhalte gehören nicht in die Rückantwort. Die vorhandene Knuddels-Konfiguration bleibt für diesen Diagnoseauftrag unverändert; aus den bisherigen Meldungen ist noch keine gezielte Codekorrektur ableitbar.

## Bereits umgesetzte Rollenklärung aus Build 302

Die aktualisierte Datei `Knuddels-Anforderungen-Homepage-Sendeplan.md` klärt die bisherige Rollenfrage: Firebase prüft Konto, App Check und Berechtigung, bevor ein Auftrag in der regulären Relay-Antwort erscheint. Die Auftragsobjekte enthalten keine Rollen-, Nutzeridentitäts- oder `authorization`-Felder. Eine zusätzliche Rollenprüfung oder interaktive Channelinhaberannahme in Knuddels ist nicht vorgesehen.

Die bisherige zusätzliche Prüfung auf `authorization.role === "admin"` wurde deshalb aus `src/backend/android/commands.js` entfernt. Der Gegenfall ohne Rollenfelder scheitert am bisherigen Build 301 und besteht nach der Anpassung. Die Annahme von Sendeplan- und Teamaufträgen hängt weiterhin ausschließlich an einer passenden, frischen und angenommenen regulären HTTP-Antwort des vorhandenen Publishers; Wochen-/Teamrevisionen, Nickauflösung, volle Stunden und alle Fachregeln werden weiterhin geprüft. Native Knuddels-Clientaktionen behalten ihre bisherigen Rechteprüfungen. Die Rollenfrage ist damit geklärt.

## Historischer Anbindungsvertrag bis Build 304 – durch Build 308 ersetzt

Die folgende Beschreibung dokumentiert den damaligen Code. Die Fassung 00:53 verlangte stattdessen Revisionsmetadaten und Einzelbefehle; die Umstellung ist seit Build 308 umgesetzt, siehe oben.

- Ausschließlich der bestehende signierte POST an `https://radio-mischwerk.web.app/api/publishKnuddelsState`, mit demselben Sync-Schlüssel und Transport. Keine neuen URLs, Schlüssel, WebHooks, Callables oder Timer.
- `scheduleUpdates`: öffentliche Wochen-Seiten direkt aus `runtime.publicWebsitePlan(week, page)`, höchstens vier je POST; zuverlässige Seitennachlieferung im bestehenden Takt.
- `teamUpdates`: ein Objekt `{ revision, moderators: [{ nick }] }` mit den tatsächlichen aufgelösten Radioteam-Nicks.
- `scheduleResults` und `moderatorResults`: `{ commandId, state: "applied"|"rejected", revision: number|null }` im nächsten regulären POST. Fachänderung und Annahmebeleg werden zusammen in vorhandenen Wochen-/Teamdaten gespeichert. Jüngste 64 Ergebnisse je Woche beziehungsweise Team sichern Wiederholungen; ältere angewandte Aufträge scheitern zusätzlich an ihrer veralteten erwarteten Revision.
- `scheduleCommands` und `moderatorCommands`: Arrays mit je höchstens einem bereits von Firebase berechtigten Auftrag. Keine zusätzlichen Rollenfelder erforderlich. Technische Auftragskennungen bleiben auf 1–128 ASCII-Zeichen aus `A–Z`, `a–z`, `0–9`, `_` und `-` begrenzt.

Bereits endgültig mit `rejected` quittierte Auftragskennungen bleiben abgelehnt. Falls ein früherer Build einen echten Auftrag wegen der inzwischen entfernten Rollenprüfung abgelehnt hat, muss Firebase eine erneute fachliche Anfrage mit neuer Kennung und aktueller erwarteter Revision stellen. Alte Kennungen werden nicht nachträglich ausgeführt.

Oberfläche, `station`, `wishUpdates`, Wunschqueue, Lauftext und sonstige Android-Funktionen bleiben für diese Korrektur unverändert. Freie Musikzeiten werden nicht als künstliche Sendungen gespeichert. Die öffentliche Ergänzung mit „MischWerk am Pult“ und „MischWerk Radio Show“ bleibt Aufgabe der Homepage.

## Bisherige Umsetzung und lokale Prüfnachweise aus Build 302/303

Die Fachänderung betrifft ausschließlich `src/backend/android/commands.js` und die erzeugte Kopie `app/server/android/commands.js`. Die Relaykorrektur erhielt Build 302; der aktuelle gemeinsame Arbeitsstand 0.1.303 / Build 303 enthält zusätzlich die parallel fortgeführte Radioanpassung. Paketdatei, Backend-/Appkonfiguration, Einstieg und fünf Manifeste sind konsistent. Vorhandene Änderungen anderer Aufgaben bleiben erhalten.

Der vollständige lokale Paketbau besteht mit **462/462 Nodefällen**, darunter **22 Relayfälle**, und jeweils **1153 Prüfungen** in den SHA-256-verifizierten Rhino-Engines **1.7.7.2 und 1.9.1**. Geprüft sind insbesondere beide rollenfreien Auftragsbereiche, unveränderte native Rechte, HTTP-/Frischeprüfung, Revisionen, Wiederholung/Neustart und endgültige Ablehnungen. Architektur, API-Signaturen, Syntax, Quellen-/Laufzeitgleichheit und Zeichengrenzen bestehen ebenfalls.

`check:upload` bestätigt **Build 303**, **131 Dateien**, darunter **124 Texte**, maximal **9485 UTF-16-Zeichen**, und fünf konsistente Manifeste. Der feste Uploadordner lautet `C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/`. Die konkreten Nachweise stehen im [aktuellen Prüfbericht](../pruefung/PRUEFBERICHT.md).

Der Betreiber hat inzwischen sowohl den nativen Start von Build 303 als auch die erste erfolgreich angenommene reguläre HTTP-200-Antwort belegt. Die fachliche Firestore-Übernahme und der gemeinsame neue Plan-/Teamdatenfluss bleiben zu bestätigen. Diese Rückantwort ergänzt ausschließlich Diagnose und Übergabe; Appcode und Upload-Paket werden durch diesen Dokumentationsschritt nicht verändert.

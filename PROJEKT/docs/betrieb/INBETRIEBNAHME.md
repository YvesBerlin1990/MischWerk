# MischWerk – Installation, Betrieb und STREAMPANEL

Sicht-/Bedienprüfung 208: Lange Bot-Texte sind im Eingabefeld mit dem Mausrad und der Tastatur vollständig lesbar. Die vorhandene Aktionsgruppe bleibt bei normalen Rahmen unten sichtbar; Speichern, Aktualisieren sowie Fehler-/Erfolg-/Konflikthinweis sind unmittelbar erreichbar. Nur im Bot-Textbereich CSS und die Position des bestehenden Rückmeldeabsatzes angepasst. Bei weniger als 481 px verfügbarer Höhe nutzt die Gruppe ihren natürlichen Dokumentfluss. Native Fenstermaße, Feldwerte und alle ausführbaren Controller bleiben erhalten. K3/STAPP mit 560/390/320 px, 1×/2×-Pixeldichte, sechs langen Feldern und begrenzter Höhe geprüft.

Aktueller lokaler Stand **0.1.208 · Build 208**. Die Verwaltung enthält jetzt die Bereiche Radio-Team und Bot-Texte. Ausschließlich der tatsächliche Channelinhaber kann bis zu sechs Textfelder bearbeiten (je höchstens 300 Zeichen), automatische öffentliche Ausgabe ein-/ausschalten und **20, 30, 40 oder 50 Minuten** Abstand wählen. Anfangs ausgeschaltet; gefüllte Texte laufen der Reihe nach, leere Felder werden übersprungen. Nach Speichern beginnt ein voller Abstand. Einstellungen und Rotationszeiger bleiben über Neustarts erhalten; verpasste Termine werden nicht nachgeholt. Öffentlicher Versand über den Standardbot als Klartext. Eigener privater Einstellungszustand, Revisionsschutz, Fehler-/Entwurfserhalt und Löschung beim Rechteverlust. Ein serverseitiger Timeout mit Shutdown-Abbruch; keine zusätzlichen Radioereignisse oder Client-Versandtimer. Vorhandene Radio-/Wunsch-/Sendeplanfunktionen und Gestaltung bleiben erhalten. **111 Laufzeitdateien, 105 Texte, 34 Backendmodule, 75 Browserdateien, 46 Komponenten, 17 Stylesheets, fünf Manifeste.** Der vollständige feste Desktop-UPLOAD ist ausschließlich lokal vorbereitet; keine Live-Aktion.

Bedienung nach manuellem vollständigen Upload: Als Channelinhaber Verwaltung öffnen, Bot-Texte wählen, Nachrichten eintragen, Abstand wählen, Automatisch senden aktivieren und Speichern. Erste Ausgabe nach dem gewählten Abstand; ausgeschaltet speichern beendet den Timer. Weitere Felder hinzufügen oder entfernen, höchstens sechs. Leere Felder bleiben ohne Ausgabe. Texte sind Klartext; Formatierungs-/Befehlscode wird escaped. Es wurde kein öffentlicher Testversand in Knuddels durchgeführt.

Erhaltene Sendeplankorrektur aus 206: Sendung eintragen und Sendung bearbeiten passen im vorhandenen 630-px-Sendeplanrahmen bei 820/560/390/320 px Breite ohne Dokument-Scrollen. Im Editor stehen nur die Eingaben und Formularaktionen im Mittelpunkt; die weiterhin nutzbare Aktualisierung sitzt rechts im zentrierten Formularkopf. Datum/Moderation und Von/Bis bleiben zweispaltig, das Thema nutzt die volle Breite. Pflichtfelder, 16-px-Eingabetext, mindestens 44-px-Bedienflächen, Fehler/Aktualisieren/Entwurf, Speichern, Zurück und Löschen bleiben erhalten. Nur schedule.css geändert; Fachcontroller und übrige Gestaltung einschließlich RGB-Glow/40-px-Auslauf unverändert. Kalender und native 820 × 630 px bleiben erhalten, tatsächlich kleinere Hostgrenzen behalten ihre native Erreichbarkeit. Fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Veröffentlichung oder Live-Aktion.

Platzverteilung aus 201: Die Appleiste verteilt die Mitte ab 1200 px proportional auf Musik/Lautstärke, Thema/Sendestatus und gegebenenfalls den eigenen Wunsch. Ohne Wunsch nutzen die zwei übrigen Informationsbereiche den Platz. Gemeinsame Oberkante, ruhige Trennlinien, passende Innenabstände, eine bis 440 px nutzbare Lautstärkegruppe und ein an der Übergangsbreite angepasster 20–24-px-Titel ersetzen die überbreite Musikspalte mit rechts zusammengedrängten Informationen. Die schmalen Raster unter 1200 px, sämtliche Controller, Fachlogik, Audio und Overlaygestaltung bleiben unverändert. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Live-Aktion.

Versionsstand 200: Ausschließlich Versions- und Buildkennung gegenüber 199 erhöht; Gestaltung und Funktionen sind bytegleich erhalten. Backendkonfiguration, App-Konfiguration, Einstieg und alle fünf Manifeste tragen dieselbe neue Kennung. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal neu bereitgestellt; keine Live-Aktion. Die nachfolgenden Gestaltungs-/Browsernachweise stammen aus dem unveränderten Stand 199.

Unverändert aus Build 199: Die bestätigten ZIP-Designs sind in der gewünschten Reihenfolge übernommen: Appleiste nach B · Vinyl Deck, anschließend Moderation, Verwaltung, Wunschbox und Sendeplan nach MischWerk_Alle_Menues. Schwarze Flächen, silberne Aktionen, statisches Vinylmotiv und lokal geladene Outfit-/Fraunces-Schriften bilden die gemeinsame Gestaltung. Sämtliche Menüüberschriften sind mittig; die Original-Logos stehen links vor dem ruhigen Kopfzeilenhintergrund ohne abgesetzte schwarze Kachel, das Vinylmotiv rechts und das X bleibt rechts bedienbar. Responsive Appleiste mit direktem Zugriff auf öffentliche und berechtigte private Aktionen, lange Informationen im vorhandenen nativen Lesebereich. Rollen, private Wunschinformation, Entwürfe, Chronologie 197/198, Event-/Sitzungskorrektur und Startabsicherung sind erhalten. **106 Laufzeitdateien, 100 Texte, 31 Backendmodule, 73 Browserdateien, 44 Komponenten, 17 Stylesheets, fünf Manifeste.** Ausschließlich fester Desktop-UPLOAD; keine Live-Aktion.

Aktuelle native Abnahme für 206: Im regulären 630-px-Sendeplanrahmen Eintragen/Bearbeiten, Fehler, Aktualisieren mit Entwurfserhalt, Speichern, Zurück und Löschen ohne Scrollen bei breiter und schmaler Ansicht kontrollieren. Nach vollständiger eigener Übernahme aller 106 Dateien einschließlich Fonts und beider OFL-Texte sowie aller Unterordner Version 0.1.206 / Build 206 im App-Startlog prüfen. Kalter/warmer Einstieg, 200-px-Apprahmen einschließlich Glowauslauf in schmalen/breiten K3-/STAPP-Ansichten, alle vier Overlays mit mittigem Titel und freiem Logo, Fokus, lange Inhalte, private Wünsche und Historien-Zeitrichtung kontrollieren. Zusätzlich Rillen, langsamen RGB-Wechsel einschließlich Schleifenübergang, den weich auslaufenden unteren Rand und sofortiges Erlöschen bei Stop/Pause/Nachladen kontrollieren; reduzierte Bewegung behält einen statischen Halo. APP-LIMIT-/bereits-geschlossen-Warnungen aus dem ursprünglichen Fehlerauftrag im begrenzten Mehrnutzer-Gegencheck beobachten. Codex führt keine Übertragung, Aktivierung, echte Aktualisierung oder Neustartaktion aus. Ältere Buildbeschreibungen unten sind historische Nachweise; insbesondere der alte Prüfauftrag für 180 ist kein aktueller Bereitstellungsstand.

Erhalten aus Build 198: Die Seitenzählung in Heute gespielt folgt ebenfalls der Zeit: älteste Titel auf Seite 1, neueste auf der letzten Seite. Beim Öffnen werden weiterhin die neuesten Titel auf der letzten Seite gezeigt. Zurück verringert die Seitenzahl, Weiter erhöht sie. Internen Cursor, Sortierung, Navigation und Seitenanker erhalten; ausschließlich die sichtbare Zahl ist angepasst. Frühere Wunsch-, Start-, Event-/Sitzungs- und Audiokorrekturen bleiben erhalten. Nur lokal bereitgestellt, weiterhin 102 Laufzeitdateien; keine Live-Aktion.

Build 197: In Heute gespielt folgt die Navigation der Uhrzeit: Zurück zeigt ältere Titel, Weiter neuere. Auf der neuesten Seite ist Weiter gesperrt, auf der ältesten Zurück. Die neuesten Titel stehen weiterhin oben; Seitennummerierung, Textfortsetzungen und Gestaltung bleiben erhalten. Wunschübersichtsentfernung, Event-/Sitzungskorrektur und Startabsicherung bleiben erhalten. Ausschließlich lokal bereitgestellt, unverändert 102 Laufzeitdateien; keine Live-Aktion.

Build 196: Die doppelte Rubrik Deine offenen Wünsche entfällt vollständig aus der Wunschbox samt Aktualisieren, Liste und Seitennavigation. Nach Abgabe bleiben die kurze Fünf-Sekunden-Bestätigung und Weiteren Wunsch eingeben; Titel, Platz und Bearbeitungsstatus stehen ausschließlich im vorhandenen privaten Wunschbereich der Appleiste. Eingabe, Entwürfe, Fokus, Versand, Radioaudio und natürliche Wunschhöhe bleiben erhalten. Event-/Sitzungskorrektur aus 194 und Startabsicherung aus 195 sind erhalten. Ausschließlich lokale Bereitstellung mit 102 Laufzeitdateien; keine Live-Aktion.

Build 195: Die leere Appleiste direkt nach Beitritt/Aktualisierung ist auf einen öffentlich nachgewiesenen Auslieferungsmischstand zurückgeführt: Ladeplan aktuell, 13 Frontenddateien älter und drei benötigte Dateien nicht vorhanden. Startfehler werden bereits vor der ersten SDK-Dateieinbindung abgesichert und bei fehlenden Pflichtdateien sofort sichtbar gemeldet. Vollständiger Desktop-UPLOAD mit 103 Laufzeitdateien lokal bereitgestellt; die Event-/Sitzungskorrektur aus Build 194 bleibt erhalten. Keine Live-Aktivierung oder Übertragung ausgeführt.

Build 194: Wunschbox-Abgleich gegen das gemeldete Eventlimit korrigiert: Entwürfe lokal sofort anzeigen, Serverabgleich bündeln und identische Rückmeldungen unterdrücken. Vor Schließen/Absenden/Overlaywechsel wird die letzte Eingabe übertragen. Sitzungen werden nur noch aktuell und höchstens einmal geschlossen, auch bei verzögertem Close-Listener und neuen Plattformwrappern. Ausschließlich lokale Bereitstellung; die vorübergehend abgeschaltete Knuddels-App wird nicht automatisch aktiviert oder aktualisiert.

Für den vollständigen Stand 198 alle 102 Dateien aus dem festen UPLOAD/MischWerk einschließlich Unterordnern übertragen und vorhandene Dateien ersetzen; insbesondere auch Bündeldateien, Komposition und die drei bisher fehlenden Dateien übernehmen. Einzelnes Nachtragen von relay.js genügt wegen weiterer alter Module nicht. Erst nach abgeschlossener vollständiger Übernahme aktualisieren und Versionskennung 0.1.198 / Build 198 im App-Startlog prüfen. Danach Beitritt und Aktualisierung mit kaltem/warmem Cache, Radio und vier Overlays sowie den Event-/Sitzungsgegencheck mit zwei bis drei Nutzern prüfen. APP-LIMIT- und bereits-geschlossen-Warnungen mit Uhrzeit/Version kontrollieren. Diese nativen Schritte und die vollständige Veröffentlichung sind noch nicht ausgeführt.

Build 193: Der vorhandene Bereich Dein Wunsch in der Appleiste zeigt Platz, nächsten eigenen Songtitel und Bearbeitungsstatus, bei mehreren Wünschen ergänzt um einen kleinen Zähler. Am Wunschbox-Button entstehen keine Zusatzangaben. Die Detailansicht ordnet Platz/Status über dem vollständigen Titel; der zusätzliche Moderationshinweis entfällt. Erfolgsfeedback verschwindet nach fünf Sekunden, Fehler und laufender Versand bleiben sichtbar.

Build 192: Der Menüpunkt heißt jetzt Verwaltung, einschließlich Tooltip, Screenreaderbeschriftung, frühem und fertigem Dialogtitel sowie nativem Fenstertitel. Überschrift und Leitspruch stehen mittig in der Kopfkarte, Logo links und Schließen-X rechts. Funktionen und Berechtigungen der Teamverwaltung bleiben erhalten.

Build 191: Vollständig leere Wochen verteilen den verfügbaren unteren Platz gleichmäßig auf ihre sieben Tageszeilen. Bestehende Mindesthöhe, Schrift und Kalenderfunktionen bleiben erhalten. Gefüllte Wochen, Pagination und Editor behalten ihre natürliche Anordnung; keine neue Fenstersteuerung.

Build 190: Die Statuszentrale ist vollständig entfernt: Anzeige, Reiter, Prüftaste, Detailseiten und eigene Anbieterabfragen. Radio-Team öffnet direkt die Mitgliederverwaltung. Ernennen/Entziehen, Aktualisieren, Rechte, Entwürfe und feste native Maße bleiben erhalten. Die unabhängige Anbieterprüfung und Wiedergabe der Radioleiste bleiben unverändert.

Build 189 entfernt „Deine Sendezeiten“ vollständig aus der Moderation, einschließlich Kalenderabruf, Aktualisieren und eigenem Modul. Die natürliche Fensterhöhe richtet sich nach den verbleibenden Bediengruppen. Öffentlicher Sendeplan und gespeicherte Termine bleiben erhalten.

Build 188 zentriert Moderation und Leitspruch in der gesamten Kopfkarte. Das Original-Logo bleibt links, das Schließen-X rechts mit 44-px-Bedienfläche. Normale und kompakte Ansicht sowie früher HTML-Kopf sind berücksichtigt; Studiofunktionen, natürliche Höhe und andere Overlays bleiben erhalten.

Build 187 zentriert Sendeplan und Leitspruch in der gesamten Kopfkarte. Das Original-Logo bleibt links, das Schließen-X rechts. Die Ausrichtung gilt bereits für den frühen HTML-Kopf; Kalender, Anfangsmaße, Funktionen und andere Overlays bleiben erhalten.

Build 186 zentriert die Wunschbox-Kopfüberschrift als „MischWerk Wunschbox“ über die gesamte Kopfbreite. Der Schließen-Button bleibt rechts; schmal kann der Titel auf zwei Zeilen umbrechen. Flaches Formular, native Anfangshöhe und Wunsch-/Audiofunktionen bleiben erhalten.

Build 185 entfernt die zusätzliche Kartenfläche um das Wunschformular. Das Formular bleibt funktional erhalten; Textfeld und Sendebutton nutzen die volle Inhaltsbreite. Die eigene Textfeldumrandung bleibt bestehen, das Textfeld erhält mehr Platz. Native Anfangsgröße, Versand, Entwürfe und Quittungen sind unverändert.

Build 184 fasst die Lautstärkebedienung zusammen: Lautstärke steht vor der Stummschalttaste, die jetzt direkt neben dem Regler liegt. Abstände regulär 6 px, kompakt weiterhin 4 px. Native 44-px-Bedienflächen, Prozentfeld, Warnung und sämtliche Audiocontroller bleiben erhalten.

Build 183 vergrößert Schrift und Symbole der öffentlichen Buttons Sendeplan/Wunschbox auf 16/22 px. Schmale Ansichten verwenden passende 14/20 px; begrenzte Verwaltungsrahmen bleiben bedienbar. Die Buttonhöhe bleibt 44 px, einschließlich deaktivierter Wunschbox. Alle Browsercontroller und Audiofunktionen sind unverändert.

Seit Build 182: Die AutoDJ-Anzeige lautet „MischWerk am Pult“. Bestehende Status-/Studioentscheidung, unabhängige Tooltip-/ARIA-Beschreibung, Gestaltung und Wiedergabe einschließlich Heartbeat sind unverändert.

Build 181 ergänzt einen an tatsächlichen Audiofortschritt gebundenen Wiedergabe-Heartbeat in der Radioleiste: alle drei Minuten /confirm über die dokumentierte Client.executeSlashCommand-Methode, erst nach passender frischer mw:refresh-Antwort. Stop, Pause, Nachladen, Fehler, Seitenende und fehlende Verbindung sperren weitere Aufrufe. Im Hintergrund bleibt der bestehende Channel-Leseweg nur bei laufendem Radio aktiv. Gestaltung, vier getrennte Overlays, Rollen, Entwürfe und Wunschtransport bleiben erhalten. Der aktuelle öffentliche OR-Radio-Player belegt diesen Ansatz; eine echte native MischWerk-Timeoutabnahme steht weiterhin aus.

Reine Versionsfortschreibung auf 0.1.181 / Build 181. Funktionen und Oberfläche entsprechen unverändert dem geprüften Stand 179.

Build 179 nutzt den freien unteren Sendeplanbereich für besser lesbare Tageszeilen: Wochentag 16 px, Datum und Leerhinweis 14 px, Tageszahl 26 px; vollständig leere Wochen nutzen mindestens 50 px hohe Zeilen. Bei vorhandenen Sendungen werden leere Zwischenzeilen kompakter ab 40 px gehalten. Im breiten 820-×-630-Rahmen bleiben alle sieben leeren Tage auf einer Seite; der freie Unterrand sinkt lokal von 118 auf 17 px. An der Oberfläche ausschließlich schedule.css geändert; Farben, vollständige Sendungsinhalte, Pagination, Editor, Rechte und alle JavaScriptmodule bleiben erhalten. Keine neue Hostgrößensteuerung.


Themenbearbeitung in Build 178: Eingabe, Zähler, Speichern, Fehler, Bestätigung und Verwerfen behalten feste Feld-/Button-/Folgeabschnittsmaße. Hilfe und Rückmeldung teilen einen festen Statusplatz; Verwerfen wird ohne Layoutänderung sichtbar. Bei diesen Vorgängen erfolgt kein neuer Hostgrößenauftrag. Eine schon sichtbare Studio-Statusmeldung behält während der Themenbearbeitung ihren Platz auch nach ihrem regulären Ausblenden; bewusste Bereichs-/Steuerungswechsel geben ihn frei. Die bestätigte automatische Verkürzung bei anderen Inhalts- und Reiterwechseln bleibt erhalten.

Seit Build 178 passt studio/window ausschließlich die vorhandene Moderationsfensterhöhe an den vollständigen Inhalt an. Die anfangs verfügbare Clienthöhe bleibt die feste Obergrenze. Leere Sendezeiten, wenige Wünsche und kurze Historienlisten hinterlassen keine große untere Leerreserve; mehr Inhalt wächst innerhalb dieser Grenze und bleibt danach paginiert. Die Senderzeit-Fußzeile der Historie entfällt. Ihre tatsächlichen Zeitstempel und Berliner Tagesregeln bleiben erhalten. Größenabhängige Kompaktgestaltung richtet sich nach der anfänglichen Clientgrenze, damit die eigene Verkürzung keine weitere Schrumpfkaskade auslöst. Andere Overlays und die Radioleiste sind davon unabhängig.

Seit 0.1.175 zeigt der Sendeplan für Hörer die eingetragenen Uhrzeiten, Moderation und Themen in neuer Gestaltung. Der Hinweis auf Otterchen und Polaroid vergibt keine Rechte und legt keine Sendungen an. Eingetragene Termine weiterhin nur als tatsächlicher Channelinhaber verwalten.

Updateantworten seit 0.1.170: Ohne neue Dateien nennt der Bot nur das Ergebnis und die laufende Version; die App läuft ohne Neustart weiter. Ein angenommener Neustartauftrag wird als vorgemerkt mit gelieferter voraussichtlicher Wartezeit und dem Hinweis auf offene Musikwünsche bestätigt. FTP-/Cache-Anleitungen entfallen aus der normalen Chatantwort; die tatsächlichen Voraussetzungen dieser Anleitung gelten weiterhin. Die gesonderte technische App-Logs-Zeile wird nicht durch den eigenen Bottext gesteuert.

Lokaler Stand 0.1.178 (Build 178) mit einer Tageshistorie ausschließlich für berechtigte Radiomoderatoren und den Channelinhaber unter **Moderation → Heute gespielt** sowie öffentlichem SPCast-MP3-/Titelanschluss, Übertragungsstatus und Sendemodus; bestätigtes LIVE 0.1.132: Nach dem noch ausstehenden Update bestätigt der Nutzer wieder normale Darstellung in Knuddels. Die öffentliche HTML-/JS-/CSS-Auslieferung wurde am 03.11.2026 um 11:54 Uhr Europe/Berlin mit 62/62 passenden Dateihashes bestätigt. Details und Grenzen stehen in der [LIVE-Abnahme](LIVE-ABNAHME.md).

0.1.131 entfernt nach Nutzungsabgleich ausschließlich eine unbenutzte Formularregel.

0.1.130 bereinigt unbenutzte Fensterreste bei unveränderten Channel-Overlays, Wunschversand und Browser-prefetch.

0.1.129 ergänzt die korrigierte SDK-Übergabe um Schutz gegen doppelte/verspätete erfolgreiche Öffnungsaufträge, Wiederaufnahme früher verlorener Wechselvorbereitung und eindeutige Behandlung nachgelagerter Mitteilungsfehler. Im Zielclient nach separat autorisierter Veröffentlichung auch schnelle Klickfolgen, Wiederöffnen, Entwurfsübernahme und unverändertes Audio prüfen. Der aktuelle lokale Upload bleibt der feste Desktop-UPLOAD.

Historische native Beobachtung vom 03.11.2026: Windows-STAPP startet tatsächlich LIVE 0.1.127. Die lokale Korrektur 0.1.128 baut die vollständige Oberfläche und erste Maße vor der SDK-Ladeübergabe auf. Nach separat autorisierter Veröffentlichung den ersten sichtbaren Frame aller vier Overlays mit kaltem und warmem Cache prüfen; ältere Befunde sind keine native Abnahme von 0.1.128.

Lokaler Stand 0.1.178 (Build 178) mit öffentlichem STREAMPANEL-Anschluss und Tageshistorie. Am 02.11.2026 direkt in der bestehenden Windows-STAPP-Sitzung Otterchen/MischWerk geprüft: LIVE 0.1.123 mit bedienbarer Oberfläche und bestätigter Wunschübertragung. Umfang und offene Abnahmefälle stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md). Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Vorhang seit 0.1.169 ausschließlich mit /vorhang öffnen und /vorhang schließen im Chat bedienen. Nur der im Channel anwesende Otterchen mit tatsächlichem Channelinhaberrecht darf ändern; keine offene Radioansicht erforderlich. Es gibt keinen Vorhangbutton mehr. Nach später gesondert autorisiertem Upload beide Richtungen mit getrennten echten Nutzern prüfen: normaler Hörer zunächst verhüllt, Otterchen und Polaroid unverhüllt; globalen Zustand und Erhalt nach Neustart bestätigen. Ungültige Angaben, unberechtigte Nutzer und Speicherfehler ändern nichts; eine Wiederholung schaltet nicht zurück. Werbung startet/stoppt ausschließlich durch lokalen Hörer-Klick, lädt die unveränderte MP3 erst dann und öffnet den Vorhang nicht. Globale Chatänderungen unterbrechen keine laufende Wiedergabe. Native Audiofreigabe in K3/STAPP bleibt Bestandteil der echten Abnahme.

Den ersten Channelbeitritt, erneuten Beitritt mit Cache und ersten Aufruf nach Appupdate separat echt prüfen. Dateien werden während des HTML-Parsens angefordert; die Zusammensetzung erfolgt nach vollständigem Markup am Bodyende, DOMContentLoaded dient als Rückfall. Die Radioleiste lädt ihren eigenen Plan einschließlich des erhaltenen Wunschcontrollers; die Wunschoberfläche öffnet als natives Channel-Overlay. Gemeinsame Channel-Overlays für Moderation, Radio-Team und Sendeplan sowie alle Rollen ohne Audioabbruch prüfen. Das Logo darf nachladen; seine Fläche bleibt reserviert. Lokale Browserprüfungen ersetzen keine Zeitmessung des echten Knuddels-Starts.

Seit 0.1.94 erneuert der Updatebefehl nach erfolgreichem Dateiabruf auch bei leerer Dateiliste den dokumentierten Oberflächen-Cache. Beim Appstart erfolgt dies vor dem Öffnen der Ansichten. Fehlende neue Dateien lösen weiterhin keinen Neustart aus. Laufende Version im App-Log prüfen und Verwaltung schließen und neu öffnen. Vollständiges Paket und korrektes FTP-Ziel bleiben Voraussetzung.

## Installation und Upload

Ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD** verwenden. Darunter liegt der vollständige Appordner **MischWerk** mit app.config, main.js, server/ und www/. Die Projektwurzel enthält zusätzlich Quellen, Dokumentation und Git und gehört nicht auf den App-FTP. Keine ZIP erstellen oder entpacken.

| Angabe | Bestätigter Wert |
| --- | --- |
| Channel / Besitzer | MischWerk / Otterchen |
| Entwickler-ID / FTP-Benutzername | 30807196 |
| FTP-Host / Port | appupload.knuddels.de / 21 |
| Verbindung | FTP mit explizitem TLS |
| Zielverzeichnis | /ftp/MischWerk |
| Vollständige App-ID | knuddelsDEV.30807196.MischWerk |
| Eingabe im Installationsdialog | 30807196.MischWerk |
| Bestätigter AppBot | MischWerkBot |
| App öffnen | /mischwerk |

Passwörter ausschließlich im FTP-Programm eingeben. Die Entwickler-ID ersetzt kein Passwort. app.config verwendet den Entwicklernamen Otterchen; das bestätigte knuddelsDEV-Präfix der App-ID darf nicht aus dem LIVE-FTP-Host anders abgeleitet werden. [App-ID-Dokumentation](https://developer.knuddels.de/docs/classes/AppInfo.html).

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 102 Laufzeitdateien einschließlich 31 Servermodulen, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende aller Manifestübertragungen abwarten, einschließlich www/audio/werbung.mp3 und sämtlicher server/-Module. Eine leere FileZilla-Warteschlange und erfolgreiche Übertragungen prüfen; anschließend kann noch Plattform-Synchronisationszeit nötig sein.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version im App-Log bestätigen: lokal ist 0.1.178 (Build 178) mit aktiver leerer dunkler Overlayabdeckung vorbereitet. Die Startmeldung enthält Version und Buildnummer sowie die Radioleiste mit vier Channel-Overlays. Radioleiste bei Bedarf mit /mischwerk erneut öffnen; bestehende Statusfenster nach Updates schließen und neu öffnen.

Für eine ausdrücklich angeforderte Auslieferungsabnahme anschließend aus PROJEKT/ **pnpm run check:delivery --base-url https://apps8.knuddels.biz/apps/de2635007/** ausführen. Die hier am 03.11.2026 beobachtete öffentliche Basisadresse bei einem Appwechsel erneut prüfen. Das Werkzeug lädt ausschließlich öffentliche HTML-/JS-/CSS-Dateien lesend und vergleicht deren tatsächliche SHA-256 mit den lokalen Appbytes. Fehlende Dateien oder alte Fassungen liefern Exitcode 1; vollständig passende Dateien Exitcode 0. Keine Benutzer-/Sitzungsdaten oder Zugangsdaten angeben. Betriebsvorgaben bleiben zentral in AGENTS.md.

Die offizielle API übernimmt mit /update keine noch laufende Übertragung als vollständig. Meldet sie keine neuen Dateien, werden keine weiteren Dateien übernommen und kein Neustart erzwungen; dies beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

„Erledigt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt C:/Users/Yves/Desktop/MischWerk/UPLOAD mit dem Appordner MischWerk/. Fünf Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das Radio-Team-Overlay öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: Der Hörer muss deutlich „Dein Musikwunsch wurde an die Moderation gesendet.“ sehen. In der Wunschbox ausschließlich eigene offene Texte und ihren Platz prüfen; mit zwei Hörern sicherstellen, dass fremde Texte/Nicks verborgen bleiben. In der Moderation Gespielt und Verwerfen prüfen: nachfolgende eigene Plätze rücken nach. Radioleiste nennt den nächsten eigenen Platz, auch bei deaktiviertem Formular. Erneutes Öffnen, mehrere eigene Seiten, Verbindungsabbruch und App-Neustart (Queue leer) prüfen. Die vollständige Queue darf ausschließlich im Moderationsfenster erscheinen; dort richtigen Hörer-Nick und vollständigen Text prüfen und als Moderator bearbeiten. Andere Hörer dürfen weder fremde Queueeinträge noch private Wunschhistorie sehen. Die Sender-Titelhistorie unter Heute gespielt ist seit 0.1.139 ebenfalls ausschließlich über das berechtigte Moderationsmenü erreichbar.
- Wunschannahme in der Moderation deaktivieren: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Erfolgreich ausdrücklich abmelden: Das gespeicherte Thema wird ohne getrenntes Speichern geleert; der Player zeigt dann Thema: MischWerk Radio Show. Das Studiofeld bleibt leer und die Wunschqueue erhalten. Abgewiesene/fehlgeschlagene Abmeldung sowie automatisches Ende durch Verlassen, Ablauf oder Rechteverlust behalten das Thema. Feld leeren und speichern zeigt im Player wieder den Standardtext, ohne ihn als Thema zu speichern. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox-Status und Thema bleiben erhalten; die flüchtige Wunschqueue beginnt leer.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- STREAMPANEL-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Overlay-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

Die Wunschbox öffnet als natives Overlay oben rechts im Channel mit 560 × 340 px für das erste leere Formular. Nach bestätigter Abgabe folgt die native Höhe dem tatsächlichen Inhalt, damit Position, Quittung und weiterer Wunsch im verfügbaren Rahmen ohne Scrollen sichtbar bleiben. Die Radioleiste erhält dafür keine zusätzliche Höhe. Entwurf, ausstehende Bestätigung, private Positionen und Wiedergabe bleiben im bestehenden Radio erhalten. Radio-Team öffnet mit festem nativem Maß von 560 × 630 px; drei Mitglieder pro Seite und einzeln durchblätterbare Details bleiben nativ erreichbar. Die Hörerzahl ist vorerst vollständig entfernt. Der öffentliche STREAMPANEL-Produktanschluss ist eingerichtet; tatsächliche Anbieter- und native Abnahmen sind im aktuellen Prüfbericht getrennt ausgewiesen.

Das Anfangslayout wird nach geladenem CSS sichtbar. Studio, Team und Sendeplan behalten ihre nativen Anfangsmaße; entfernte Bildschirmgrenzen und Warte-/Wiederholungstimer bleiben entfernt. Die Wunschbox passt seit 0.1.152 nach einer bestätigten Abgabe ihre Höhe an den tatsächlichen Inhalt an, ohne unveränderte Zielmaße erneut anzufordern. Öffnung und Größenannahme in K3/STAPP nach vollständigem Upload separat gemäß LIVE-ABNAHME.md prüfen.

## Betrieb und Daten

Es gibt weder eine persönliche noch eine feste Gesamtanzahl-Begrenzung, keine Zwei-Wünsche-Grenze und keine Wartezeit. Während die App läuft, werden Wünsche serverseitig einzeln paginiert; ein App-Neustart leert diese Queue bewusst.

Wünsche werden nicht gespeichert. Die laufende Queue hält nur den authentifizierten Nutzer, dessen Nick, Wunschtext, Zeitpunkt und technische Übertragungs-ID im Arbeitsspeicher der App. Der Hörer erhält die direkte Versandbestätigung und ausschließlich seine eigenen offenen Wunschtexte mit Positionen. Die vollständige Queue, fremde Nicks und Bearbeitung erscheinen ausschließlich für berechtigte Moderatoren im Moderationsfenster. Die Liste ernannter Radiomoderatoren speichert weiterhin ausschließlich numerische Knuddels-User-IDs in AppPersistence; sichtbare Nicks werden serverseitig aufgelöst. Die App verwendet keine Analyse- oder Trackingbibliotheken. Beim konfigurierten Sender gehen Stations-/Metadatenanfragen und beim Abspielen der Streamabruf an STREAMPANEL.

Seit 0.1.34 besitzt die Wunschbox einen auf Rhino-Grundoperationen reduzierten Laufzeitweg aus reinen JavaScript-Werten. Das Frontend sendet `mw:wish.submit` mit `submissionId` und Text; das Backend reiht ID, Nick, Text und Zeitpunkt ohne AppPersistence- oder Java-Objekt ein und quittiert unmittelbar über `mw:wish.receipt`. Eine wiederholte `submissionId` erzeugt während der gesamten laufenden App-Sitzung keinen zweiten Wunsch. Nachgelagerte UI-Aktualisierungen können die Annahme nicht mehr in einen Fehler umwandeln. Backend und Frontend deshalb bei einem später freigegebenen Update gemeinsam vollständig hochladen und die App anschließend kontrolliert neu starten.

Eine Studio-Anmeldung läuft nach 6 Stunden aus. Sie weist aus, wer sich in dieser App angemeldet hat; sie erkennt keinen Encoder oder echten Sendebeginn bei STREAMPANEL. Ein Moderatorwechsel in STREAMPANEL muss auch im App-Studio übernommen werden.

Vor einem Produktivupdate AppPersistence sichern. `autoUpdate = false` ermöglicht einen kontrollierten Neustart nach vollständigem Upload. Die ausführlichen API- und K3-Regeln stehen dauerhaft in `AGENTS.md`.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation verwendet im Moderationsmenü den Button „Sendung übergeben“ direkt unter Anmeldung/Abmeldung in der Mikrofon-Karte, wählt einen anwesenden Radiomoderator aus und fragt die Übergabe an. Bis zur Annahme bleibt sie ON AIR. Der Nachfolger erhält einen privaten Hinweis und öffnet „Übergabe ansehen“. Dort kann er sein neues Sendungsthema bis 80 Zeichen eintragen und mit „Jetzt übernehmen“ bestätigen; leer lassen entfernt das bisherige Thema. Erst dann wechselt die App den angezeigten Moderator und sendet die gemeinsame öffentliche Botmeldung. Die Wunschliste und der Wunschboxschalter bleiben erhalten.

„Ablehnen“ und „Übergabe abbrechen“ ändern die bisherige Anmeldung nicht. „Zurück zum Studio“ lässt eine offene Anfrage bestehen. Bei Verlassen des Channels, Rechteverlust, Ablauf oder geänderter Moderationssitzung verfällt sie. Nach einem App-Neustart gibt es keine offene Übergabe mehr. Bei Speicherfehler kann der Nachfolger mit erhaltenem Themenentwurf erneut bestätigen. Der Channelinhaber kann weiterhin eine Moderation ausdrücklich beenden; die direkte Übernahme einer fremden laufenden Sendung ist gesperrt. Den Encoderwechsel führen die Moderatoren in ihrer Radiosoftware durch und bestätigen passend dazu in MischWerk.

## STREAMPANEL einrichten

### Aktueller Zustand

Seit 0.1.134 ist die vom Nutzer gezeigte öffentliche Höreradresse https://mischwerk.sp.radio.fm/stream eingetragen. Der Abruf bestätigt MP3 mit 320 kbit/s und eine funktionierende HTTPS-Weiterleitung nach mischwerk.spcast.eu. Die Titelquelle stammt aus dem eigenen öffentlichen HTML5-Player und verwendet getrennte currentSong-/currentArtist-Felder. Aktuell meldet sie keinen Titel und als Interpret Unknown. HTTP-/CORS- und stumme Edge-Decoderprüfung bestanden; echter Titelwechsel und native Knuddels-Wiedergabe sind noch abzunehmen.

Seit 0.1.135 ist außerdem https://mischwerk.sp.radio.fm/statistics?json=1 für die Übertragungsprüfung eingerichtet: Stream-ID 1, Pfad /stream und Stationsidentität bestimmen den Eintrag. Der eigene Playerdienst https://mischwerk.sp.radio.fm/scripts/whoIsLive.php bestätigt bei exakt autodj/live den Sendemodus; andere Modi bleiben unbekannt. Tatsächlich im HTTP-/Edge-CORS-Test gelesen: started, 0 Hörer, AutoDJ. Knuddels-Moderation, Sendeplan und Wunschübertragung bleiben davon unabhängig.

Ein bestätigter Sendestopp sperrt Play und entfernt die laufende Audioquelle. Statusprüfung alle 30 Sekunden nach Antwort und zusätzlich sofort bei waiting/stalled bzw. Medienfehler; HTTP-Antwort und Quellenverzögerung kommen zum Prüftakt hinzu. Bei Wiederanlauf wird Play freigegeben, kein Ton automatisch gestartet. Ein bloßer Datenabruf-/Netzwerkfehler bestätigt keinen Stopp und unterbricht laufendes Audio nicht. Bei Rückkehr aus dem Hintergrund sofort neu prüfen.

### Was die offizielle Recherche bestätigt

STREAMPANEL setzt SPCast ein. SPCast verwendet eine eigene Engine und HLS; kompatible Shoutcast-/Icecast-Eingänge sind kein Beleg für deren Status-APIs. Die offizielle HTML5-Player-Anleitung zeigt auch einen öffentlichen direkten HTTPS-Audiostream für ein natives Audioelement. Dieser ist für MischWerk inzwischen tatsächlich geprüft. Platzhalter aus Anbieterbeispielen sind keine MischWerk-Adressen.
https://www.streampanel.net/webradio-hosting/
https://www.spcast.eu/en/what-is-spcast/
https://www.spcast.eu/html5-player/
https://www.spcast.eu/faq/allgemein/einrichtungstutorial/

Eigene Playerdaten und das tatsächlich eingebundene Anbieterskript bestätigen Titel- und Modusquelle. Die Statistikroute wird im offiziellen SPCast-Update 0.9.9.094 ausdrücklich veröffentlicht und ist am eigenen MischWerk-Host samt Schema und CORS geprüft. Die PushAPI für radio.de/TuneIn bleibt ein ausgehender Meldedienst und wird nicht als Statistik-Lesequelle verwendet.
https://community.streampanel.net/d/320-spcast-version-099094
https://www.spcast.eu/produktbilder/
https://www.spcast.eu/radio-metadata-api-integration/

### Bestätigte und noch offene öffentliche Angaben

1. Bestätigt: https://mischwerk.sp.radio.fm/stream, audio/mpeg, 320 kbit/s. Der im Screenshot veraltete /stream256-Anschluss und der Encodermount /stream_live werden nicht verwendet.
2. Bestätigt: https://mischwerk.sp.radio.fm/ und dessen tatsächlich eingebundenes Anbieterskript. Keine fremde Playerimplementierung übernommen; das vorhandene native Audioelement bleibt erhalten.
3. Titel/Interpret bestätigt: https://scripts.streampanel.net/spcast/player/default/api.php?url=mischwerk.spcast.eu&userid=8884&historic=true mit currentSong/currentArtist. Die Kennung ist öffentlich im Player enthalten. Getrennte Titel-/Interpretenfelder bleiben erhalten; kein Aufteilen an Bindestrichen. Die Quelle liefert aktuell keinen Titel; tatsächlichen Titelwechsel noch prüfen.
4. Statistik und Sendemodus sind oben bestätigt und konfiguriert. Unbekannte Modi oder unbestätigte Daten bleiben unbekannt; die Knuddels-Studioanmeldung wird unabhängig angezeigt. Den echten Sender für lokale Tests nicht stoppen; Stopp-/Rückkehrnachweise sind bisher simuliert.

Encoder-Host, Port, Benutzer, Passwort und Mountpoint gehören ausschließlich in die Sendesoftware. Diese Angaben werden NICHT für die App benötigt. Zugangsdaten nicht in Screenshots/Playerlinks übernehmen. Unterstützung: https://www.streampanel.net/kontakt/
Offizielle Störungsübersicht: https://status.streampanel.net/

### Konfiguration

In src/backend/config.js unter MischWerkConfig.streampanel:

- streamUrl: bestätigte öffentliche HTTPS-Audioadresse
- allowedHosts: zusätzliche exakte öffentliche Hostnamen der JSON-Daten; Streamhost wird automatisch zugelassen
- metadata: url, titleField, artistField, liveField sowie ergänzend modeUrl
- status: url, valueField, onlineValue, offlineValue; identityField und identityValue zur Antwortzuordnung. Für das bestätigte SPCast-Format zusätzlich format=spcast-statistics, streamId und streamPath

Feldpfade dürfen verschachtelte Objekte mit Punkten benennen. Arraypfade und Skriptausdrücke sind bewusst nicht vorgesehen. Statuswerte werden ohne automatische Typumwandlung verglichen.

Dies ist eine interne Zuordnung tatsächlich bestätigter öffentlicher Produktdaten. Es werden weder Endpunkte aus Radio-ID/Hostname abgeleitet noch fremde Demosender eingetragen. Fehlende optionale Felder bleiben leer. Die direkte Audioadresse funktioniert unabhängig von fehlenden JSON-Quellen. Unverfügbare Daten bleiben unbekannt. Ein künftig bestätigter Offline-Status stoppt Audio; ein bloßer Abfragefehler nicht.

### Abnahme nach Erhalt

- Echte öffentliche Werte eintragen, Backend bauen, volle Prüfungen und Paketbau ausführen.
- node tools/checks/streampanel.cjs prüft lesend Audio/zugeordnete JSON-Quellen. Ohne Konfiguration meldet es ausstehend bei null Netzabrufen. Node-HTTP-Nachweise beweisen weder Browser-CORS noch Audio-Decodierung in K3.
- Im Browser und danach im autorisierten Knuddels-/K3-/STAPP-Test: bewussten Play-Klick, Codec, HTTPS, Weiterleitungen, CORS, Titelwechsel, echte Null, Stopp, Wiederanlauf ohne Autostart, Hintergrund/Rückkehr und Fehler ohne Audioabbruch prüfen.
- Bei ausschließlich HLS/MSE: tatsächlichen offiziellen Playerweg und Zielclient-Unterstützung gesondert integrieren und prüfen. Die direkte HTML-Audio-Vorbereitung allein ist dafür kein Kompatibilitätsnachweis.
- Die Moderatoren konfigurieren ihre Sendesoftware separat im neuen Anbieter; MischWerk steuert keinen Encoder oder AutoDJ.
- Erst nach eigenem Auftrag vollständig hochladen und Knuddels aktualisieren. Ein echter App-Neustart leert die flüchtige Wunschqueue; ein bloßes Öffnen/Schließen des Wunsch-Overlays erhält Sitzung, Entwurf und Wiedergabe.

Die vollständige reale Funktionsabnahme steht in [LIVE-ABNAHME.md](LIVE-ABNAHME.md), Sendeplan und Lautstärke in [SENDEPLAN.md](SENDEPLAN.md) und [LAUTSTAERKE.md](LAUTSTAERKE.md). Schnittstellen und Herkunft der öffentlichen Daten: [API-NACHWEIS.md](../api/API-NACHWEIS.md).

Seit 0.1.116 verwendet die Wunschbox AppContent.overlayContent. Native Platzierung und Clientunterstützung separat prüfen. Ausdrückliches Schließen übernimmt zuerst die letzte Eingabe im Radio; bleibt die Verbindung aus, bleibt diese Eingabe mit Hinweis sichtbar. Die lokale Channel-Vorschau unter /channel.html modelliert getrennte Header-/Overlayframes.

Moderation öffnet unverändert nativ mit 780 × 730 px. Seit Build 178 verkürzt sie das vorhandene Fenster auf den vollständigen Inhalt und wächst bei mehr Inhalt höchstens bis zur anfänglich verfügbaren Clienthöhe. Bei knappen Maßen führen Bereichs-/Textseiten zu allen Inhalten und Aktionen; die Moderation hat keine Dokument- oder Listenscrollfläche. Eingabe, Speichern und Verwerfen des Themas erhalten dieselbe Geometrie.

## Tageshistorie verwenden

Als Channelinhaber oder ernannter Radiomoderator **Moderation → Heute gespielt** wählen. Normale Hörer, Channelmoderatoren und Appmanager ohne eigene Ernennung erhalten keine Historie; der öffentliche Sendeplan zeigt nur den Kalender. Angezeigt werden verfügbare Titelmeldungen des aktuellen Tages in deutscher Ortszeit, neueste zuerst, mit so vielen Einträgen pro Seite, wie die verfügbare Overlayfläche erlaubt. Ohne Scrollen über Zurück/Weiter lesen; sehr lange Titel werden vollständig auf Fortsetzungsseiten verteilt. Aktualisieren lädt ausdrücklich neu; bei sichtbarem Reiter erfolgt außerdem alle 15 Sekunden nach Abschluss ein Abruf. Bei Störung bleiben bereits geladene heutige Titel stehen, an Mitternacht beginnt die Liste neu. Sendesteuerung, Wunschpult und ungespeichertes Sendungsthema bleiben beim Reiterwechsel erhalten; Kalenderentwürfe bleiben beim Bereichswechsel erhalten. Beim Entzug der Moderationsrechte werden geladene Historientitel gelöscht und Abrufe beendet. Reiterwechsel bleiben im selben Moderationsoverlay; der öffentliche Sendeplan bleibt eine getrennte Ansicht.

Die öffentliche Quelle ist eingerichtet; in den gezeigten Streampanel-Darstellungsfeldern muss nichts ausgefüllt werden. Die Nachprüfung am 03.11.2026 um 13:55 Uhr bestätigt echte Liednamen und Titelwechsel. Die beiden bekannten Senderjingles Mischwerk dein Radio und Dein Mix auf Mischwerk werden seit 0.1.137 aus der Historie ausgefiltert; ähnlich benannte Musiktitel bleiben erhalten. Wenn ausschließlich leere/Unknown-Meldungen vorliegen, bleibt die Liste korrekt leer. Die Uhrzeit gehört zur Titelmeldung des Senders und kann vom hörbaren Start abweichen. Umfang und Aufbewahrung des Anbietercaches sind nicht zugesichert; die Liste ist kein vollständiges Tagesarchiv. Sie enthält keine privaten Musikwünsche.

## Moderation verwenden

Drei Reiter stehen ständig zur Auswahl:

- **Deine Sendung:** Anmeldung übernehmen oder verlängern, Beginn, Laufzeit und bestätigtes Anmeldeende sehen, Thema ausdrücklich speichern oder Änderungen verwerfen. Die Übergabeaktion steht direkt bei An- und Abmeldung. Darunter die Wunschbox bedienen. Die Rubrik Deine Sendezeiten entfällt; Termine werden im öffentlichen Sendeplan angezeigt. Der frühere Sendungsassistent ist entfernt.
- **Musikwünsche:** Bis zu drei Einträge in Eingangsreihenfolge. Eine Vorschau auswählen, um den vollständigen Text und die Aktionen zu sehen. Nur die sichtbare Auswahl bestätigt den Empfang. Vorbereiten erhält die Platznummer; ausschließlich Platz 1 kann nach Vorbereitung als Läuft gerade markiert werden. Gespielt/Verwerfen entfernt den Wunsch und lässt Folgeplätze nachrücken. Diese Aktionen starten keine Musik. Bei knapper Höhe wechselt Aktionen/Wunschtext zwischen den beiden Bediengruppen; bei schmalen langen Texten führen Textpfeile durch den gesamten Originaltext.
- **Heute gespielt:** Die verfügbare Fläche zeigt heutige Titelmeldungen mit Senderzeit. Weitere Einträge und lange Titel bleiben über Seiten vollständig lesbar. Abrufe, Berliner Tageswechsel und Rechte bleiben unverändert.

Eine Übergabe bleibt bis zur Annahme beim bisherigen Moderator. Notizen bis 500 Zeichen sind ausschließlich für Absender und Nachfolger sichtbar und bleiben nach der Annahme unter Deine Sendung verfügbar. Bei Speicherfehler bleiben die Eingaben erhalten; nach Ende, Nutzerlöschung oder Appneustart entfallen die flüchtigen Hinweise. Bei knappen Rahmen sind ganze Bediengruppen über Bereichsseiten erreichbar. Der Sendeplan wird weiterhin nur vom tatsächlichen Channelinhaber bearbeitet. manifest-studio.json ist ein Dateinachweis außerhalb des Appordners.

Verwaltung behält den festen nativen Rahmen von 560 × 630 px und zeigt direkt die Mitgliederverwaltung. Nickentwurf und unbestätigte Zugriffsentziehung bleiben bei Aktualisierung und bewusster Wiederöffnung erhalten. Längere Inhalte sind nativ scrollbar. Statuszentrale und Reiter sind seit Build 190 entfernt.

Seit 0.1.124 stehen Platznummer und vollständiger eigener Wunsch oberhalb der Eingabe. Mehrere eigene Wünsche einzeln über Vor/Zurück ansehen. Nach bestätigtem Versand öffnet Weiteren Wunsch eingeben das Formular erneut; die Platzinformation bleibt erhalten. Der native Wunschrahmen bleibt bei 560 × 340 px. Längere Wunschinformationen und gleichzeitige Entwürfe sind über natives Dokumentscrollen erreichbar; die App verändert die Fenstergröße nicht.

Seit 0.1.140 sehen normale Hörer ab 1400 px Framebreite rechts das freigegebene Radio-Logo. Bei vorhandenen Verwaltungsrechten stehen dort weiterhin die bisherigen Aktionen. Schmale Ansichten behalten ihren Platz für die Bedienung; das zusätzliche Logo entfällt dort.

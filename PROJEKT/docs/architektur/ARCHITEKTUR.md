# MischWerk – Architektur 0.1.202 · Build 202

Aktueller lokaler Stand **0.1.202 · Build 202**. Der äußerste Hintergrund der Appleiste entspricht mit **#0F1114 (RGB 15, 17, 20)** der dominierenden Grundfarbe am oberen Rand des vorhandenen Channelbilds medien/mychannel/Hintergrund_MischWerk_Knuddels.png. Radio-HTML, Body und äußerer Leistenuntergrund verwenden dieselbe Canvas-Farbe bereits beim frühen HTML-Aufbau. Die Playerkarte bleibt #141414, Overlays und native Ladefarben bleiben unverändert. Platzverteilung 201, Originalbild/-Logos, Controller und Funktionen erhalten. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Live-Aktion.

Platzverteilung aus 201: Die Appleiste verteilt die Mitte ab 1200 px proportional auf Musik/Lautstärke, Thema/Sendestatus und gegebenenfalls den eigenen Wunsch. Ohne Wunsch nutzen die zwei übrigen Informationsbereiche den Platz. Gemeinsame Oberkante, ruhige Trennlinien, passende Innenabstände, eine bis 440 px nutzbare Lautstärkegruppe und ein an der Übergangsbreite angepasster 20–24-px-Titel ersetzen die überbreite Musikspalte mit rechts zusammengedrängten Informationen. Die schmalen Raster unter 1200 px, sämtliche Controller, Fachlogik, Audio und Overlaygestaltung bleiben unverändert. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal bereitgestellt; keine Live-Aktion.

Versionsstand 200: Ausschließlich Versions- und Buildkennung gegenüber 199 erhöht; Gestaltung und Funktionen sind bytegleich erhalten. Backendkonfiguration, App-Konfiguration, Einstieg und alle fünf Manifeste tragen dieselbe neue Kennung. Vollständiger fester Desktop-UPLOAD mit 106 Laufzeitdateien lokal neu bereitgestellt; keine Live-Aktion. Die nachfolgenden Gestaltungs-/Browsernachweise stammen aus dem unveränderten Stand 199.

Unverändert aus Build 199: Die bestätigten ZIP-Designs sind in der gewünschten Reihenfolge übernommen: Appleiste nach B · Vinyl Deck, anschließend Moderation, Verwaltung, Wunschbox und Sendeplan nach MischWerk_Alle_Menues. Schwarze Flächen, silberne Aktionen, statisches Vinylmotiv und lokal geladene Outfit-/Fraunces-Schriften bilden die gemeinsame Gestaltung. Sämtliche Menüüberschriften sind mittig; die Original-Logos stehen links vor dem ruhigen Kopfzeilenhintergrund ohne abgesetzte schwarze Kachel, das Vinylmotiv rechts und das X bleibt rechts bedienbar. Responsive Appleiste mit direktem Zugriff auf öffentliche und berechtigte private Aktionen, lange Informationen im vorhandenen nativen Lesebereich. Rollen, private Wunschinformation, Entwürfe, Chronologie 197/198, Event-/Sitzungskorrektur und Startabsicherung sind erhalten. **106 Laufzeitdateien, 100 Texte, 31 Backendmodule, 73 Browserdateien, 44 Komponenten, 17 Stylesheets, fünf Manifeste.** Ausschließlich fester Desktop-UPLOAD; keine Live-Aktion.

Erhalten aus Build 198: Die Seitenzählung in Heute gespielt folgt ebenfalls der Zeit: älteste Titel auf Seite 1, neueste auf der letzten Seite. Beim Öffnen werden weiterhin die neuesten Titel auf der letzten Seite gezeigt. Zurück verringert die Seitenzahl, Weiter erhöht sie. Internen Cursor, Sortierung, Navigation und Seitenanker erhalten; ausschließlich die sichtbare Zahl ist angepasst. Frühere Wunsch-, Start-, Event-/Sitzungs- und Audiokorrekturen bleiben erhalten. Nur lokal bereitgestellt, weiterhin 102 Laufzeitdateien; keine Live-Aktion.

Build 197: In Heute gespielt folgt die Navigation der Uhrzeit: Zurück zeigt ältere Titel, Weiter neuere. Auf der neuesten Seite ist Weiter gesperrt, auf der ältesten Zurück. Die neuesten Titel stehen weiterhin oben; Seitennummerierung, Textfortsetzungen und Gestaltung bleiben erhalten. Wunschübersichtsentfernung, Event-/Sitzungskorrektur und Startabsicherung bleiben erhalten. Ausschließlich lokal bereitgestellt, unverändert 102 Laufzeitdateien; keine Live-Aktion.

Build 196: Die doppelte Rubrik Deine offenen Wünsche entfällt vollständig aus der Wunschbox samt Aktualisieren, Liste und Seitennavigation. Nach Abgabe bleiben die kurze Fünf-Sekunden-Bestätigung und Weiteren Wunsch eingeben; Titel, Platz und Bearbeitungsstatus stehen ausschließlich im vorhandenen privaten Wunschbereich der Appleiste. Eingabe, Entwürfe, Fokus, Versand, Radioaudio und natürliche Wunschhöhe bleiben erhalten. Event-/Sitzungskorrektur aus 194 und Startabsicherung aus 195 sind erhalten. Ausschließlich lokale Bereitstellung mit 102 Laufzeitdateien; keine Live-Aktion.

Build 195: Die leere Appleiste direkt nach Beitritt/Aktualisierung ist auf einen öffentlich nachgewiesenen Auslieferungsmischstand zurückgeführt: Ladeplan aktuell, 13 Frontenddateien älter und drei benötigte Dateien nicht vorhanden. Startfehler werden bereits vor der ersten SDK-Dateieinbindung abgesichert und bei fehlenden Pflichtdateien sofort sichtbar gemeldet. Vollständiger Desktop-UPLOAD mit 103 Laufzeitdateien lokal bereitgestellt; die Event-/Sitzungskorrektur aus Build 194 bleibt erhalten. Keine Live-Aktivierung oder Übertragung ausgeführt.

Build 194: Wunschbox-Abgleich gegen das gemeldete Eventlimit korrigiert: Entwürfe lokal sofort anzeigen, Serverabgleich bündeln und identische Rückmeldungen unterdrücken. Vor Schließen/Absenden/Overlaywechsel wird die letzte Eingabe übertragen. Sitzungen werden nur noch aktuell und höchstens einmal geschlossen, auch bei verzögertem Close-Listener und neuen Plattformwrappern. Ausschließlich lokale Bereitstellung; die vorübergehend abgeschaltete Knuddels-App wird nicht automatisch aktiviert oder aktualisiert.

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

Build 179 nutzt den freien unteren Sendeplanbereich für besser lesbare Tageszeilen: Wochentag 16 px, Datum und Leerhinweis 14 px, Tageszahl 26 px; vollständig leere Wochen nutzen mindestens 50 px hohe Zeilen. Bei vorhandenen Sendungen werden leere Zwischenzeilen kompakter ab 40 px gehalten. Im breiten 820-×-630-Rahmen bleiben alle sieben leeren Tage auf einer Seite; der freie Unterrand sinkt lokal von 118 auf 17 px. An der Oberfläche ausschließlich schedule.css geändert; Farben, vollständige Sendungsinhalte, Pagination, Editor, Rechte und alle JavaScriptmodule bleiben erhalten. Keine neue Hostgrößensteuerung.


Themenbearbeitung in Build 178: Eingabe, Zähler, Speichern, Fehler, Bestätigung und Verwerfen behalten feste Feld-/Button-/Folgeabschnittsmaße. Hilfe und Rückmeldung teilen einen festen Statusplatz; Verwerfen wird ohne Layoutänderung sichtbar. Bei diesen Vorgängen erfolgt kein neuer Hostgrößenauftrag. Eine schon sichtbare Studio-Statusmeldung behält während der Themenbearbeitung ihren Platz auch nach ihrem regulären Ausblenden; bewusste Bereichs-/Steuerungswechsel geben ihn frei. Die bestätigte automatische Verkürzung bei anderen Inhalts- und Reiterwechseln bleibt erhalten.

Seit Build 178 passt studio/window ausschließlich die vorhandene Moderationsfensterhöhe an den vollständigen Inhalt an. Die anfangs verfügbare Clienthöhe bleibt die feste Obergrenze. Leere Sendezeiten, wenige Wünsche und kurze Historienlisten hinterlassen keine große untere Leerreserve; mehr Inhalt wächst innerhalb dieser Grenze und bleibt danach paginiert. Die Senderzeit-Fußzeile der Historie entfällt. Ihre tatsächlichen Zeitstempel und Berliner Tagesregeln bleiben erhalten. Größenabhängige Kompaktgestaltung richtet sich nach der anfänglichen Clientgrenze, damit die eigene Verkürzung keine weitere Schrumpfkaskade auslöst. Andere Overlays und die Radioleiste sind davon unabhängig.

Build 177 modernisiert ausschließlich die Moderationsoberfläche in der Farbpalette des Sendeplans. Deine Sendung, Musikwünsche und Heute gespielt besitzen eigene Reiter. Sendestatus mit Anmeldung, Abmeldung und Übergabe, danach Thema, Wunschbox und eigene Sendezeiten stehen untereinander, ohne Kartenraster. Eine separate Übergabezeile entfällt; ein Notizbereich erscheint nur bei tatsächlich empfangenen privaten Hinweisen. Ganze Bediengruppen und vollständige lange Texte werden im vorhandenen Rahmen auf Seiten verteilt. Die Wunschliste zeigt bis zu drei Einträge und eine vollständige, bedienbare Auswahl. Nur die Auswahl wird über den unveränderten Empfangstransport quittiert. Der Sendungsassistent ist aus Backend, Snapshot, Ladeplan und Oberfläche entfernt. Eigene Sendezeiten stammen lesend aus dem vorhandenen mw:schedule-Protokoll. Native Anfangsmaße, getrennte Overlays und eigenständige Headerbar bleiben erhalten.

Build 176 glich ausschließlich die Sendeplanpalette an die Appleiste an. Damals blieben JavaScriptmodule und Geometrie unverändert; Build 177 ergänzt nun den oben beschriebenen Moderationsumbau.

Der Sendeplan ist seit 0.1.175 eine Hörerübersicht. schedule/markup besitzt Teamhinweis und Wochensteuerung, schedule/view stellt vollständige Kalender- und Sendungsdaten dar, schedule.css ausschließlich das neue Aussehen. schedule/pages wählt ohne frühere bewusste Seitenwahl zunächst die erste eingetragene Sendung als Anker; eine manuelle leere Seite bleibt beim Refresh erhalten. Alle sieben Tage bleiben erreichbar. Controller, Editor, Kalenderregeln und schedule/window bleiben unverändert. Der native Rahmen wird nicht nachgeführt.

Vorhang ausschließlich per Chat: /vorhang öffnen und /vorhang schließen. Der bisherige Button, sein Binding und seine Styles entfallen; Inhaberprüfung, globale Speicherung, Hörerausnahmen, Fokus, Werbung und Audio bleiben erhalten.

Die gemessenen Grundinhalte bestimmen seit 0.1.153 ausschließlich die nativen Anfangsmaße: Wunschbox 560 × 340, Moderation 780 × 730, Verwaltung 560 × 630 und Sendeplan 820 × 630 px. Nach bestätigtem Wunsch passt wishes/window die native Wunschhöhe an den tatsächlichen Inhalt an. Andere Overlays behalten ihre festen Maße. Bei echten Hostgrenzen bleiben überlange Inhalte nativ erreichbar.

Alle vier Zusatzbereiche öffnen eine eigene native Overlayseite. ui/overlays prüft Auftrag, Rolle und Radiozuordnung, übernimmt vor dem Wechsel bestätigte Eingaben und übergibt an ui/sessions. Dort entstehen HTMLFile und AppContent.overlayContent mit dem Anfangsmaß des Zielbereichs. Nach canSendAppContent übernimmt sendAppContent selbst das native (Er)setzen und liefert die gespeicherte AppContentSession. Es gibt keinen eigenen Nachschließweg und kein eigenes Ersetzungsflag. Der Close-Listener verwendet den nativen replacing-Parameter; closeView/remove bleibt ausdrücklichem Schließen und dem Sitzungsende vorbehalten. Auch derselbe bewusst erneut gewählte Bereich öffnet frisch; identische Anfrage-IDs werden weiterhin nur einmal ausgeführt. Die Radioleiste bleibt dieselbe Sitzung mit demselben Audioelement.

Die frühere Backend-/Browsernavigation ui/navigation ist gelöscht. Es gibt keine gemeinsame Overlayseite, mw:view-Umschaltung, sharedViews-Ladepläne, allgemeine automatische Höhensteuerung, vorgeladenen fremden Overlaycontroller oder wiederhergestellten Fenster-/Scrollzustände. Ausschließlich wishes/window passt seit 0.1.152 nach bestätigtem Wunsch die native Höhe an den sichtbaren Inhalt an. Die native Ladeansicht der Overlays bleibt in den Appfarben aktiv.

Die Tageshistorie bleibt ein berechtigter Reiter innerhalb der Moderationsseite. Übergreifende Entwürfe und Auswahlwerte liegen ausschließlich im eigenen flüchtigen Radiocache. Laufende Wunschübertragung und private Quittungen besitzen weiterhin ihre bisherigen Fachmodule. Einzelheiten: [Frontend](ARCHITEKTUR-FRONTEND.md), [API](../api/API-NACHWEIS.md), [Prüfung](../pruefung/PRUEFBERICHT.md).

106 Laufzeitdateien: main.js und app.config, 31 Servermodule und 73 Browserdateien einschließlich Original-PNGs und eigener MP3. 44 Frontendkomponenten und 17 Stylesheets.

Die eigenständige Website ist pausiert und vollständig unter website/ abgelegt. Ihr Code und ihre vorbereiteten Adapter werden weder vom Backend noch von der App-Prüfkette oder UPLOAD geladen. tools/preview dient ausschließlich der App-Testvorschau; der normale Websiteeinstieg öffnet keinen Server.

## Zusammensetzung und Start

main.js lädt server/app.js mit dem dokumentierten KnuddelsServer.execute und übernimmt das globale App. Backendquellen unter src/backend/ werden bytegleich nach app/server/ und beim Paketbau nach UPLOAD/MischWerk/server/ übernommen. Das Kompositionsmodul lädt und verdrahtet Module, verarbeitet aber keine Fachereignisse.

index.html fordert Styles und js/start.js während des HTML-Parsens über Client.includeCSS/includeJS an. Das ist wegen der document.write-Implementierung der Plattform erforderlich. ui/composition.js besitzt die explizite Verdrahtung; start.js besitzt den Ladeplan und die einmalige Startfreigabe. Die Zusammensetzung erfolgt nach vollständigem Markup am Bodyende und registrierten Modulen, DOMContentLoaded dient als idempotenter Rückfall. Keine mehrfachen Initialisierungen. Geladenes CSS und fertiges Anfangslayout geben mw-ready frei; langsame Logoantworten blockieren die Radioleiste nicht. Nach 15 Sekunden ohne vollständige Initialisierung erscheint der verständliche Starthinweis. 44 Komponenten und 17 Stylesheets; Pläne siehe [Frontend](ARCHITEKTUR-FRONTEND.md).

## Backendkomponenten

| Datei unter server/ | Verantwortung / öffentliche Funktionen |
| --- | --- |
| config.js | Öffentliche Sender-, Rollen- und Längenkonfiguration |
| core/runtime.js | Laufzeitkonstanten, now, copy, failure, jsonBytes |
| core/diagnostics.js | Datensparsame warn-Diagnose mit eigener Meldedrossel |
| core/validation.js | Textnormalisierung und unveränderte Rhino-kompatible Linkprüfung |
| users/identity.js | Primitive Userwerte, Anwesenheit und serverseitige Rollen |
| state/persistence.js | initialState, readState, persist und Bereinigung historischer Marker |
| state/initialization.js | load: beim ersten Laden Speicher lesen, danach Studio-Anmeldung prüfen |
| radio/station.js | Geprüfte öffentliche Senderadressen |
| radio/team.js | Ernennen, Entziehen und paginierte Radio-Team-Ansicht |
| radio/moderation.js | moderatorKey, invalidateModerator, moderatorIsActive, prune, changeModeration, transferModeration; ausdrückliche Abmeldung leert atomar das Thema |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/assistant.js | refreshAssistant, assistantSnapshot, removeAssistantUser; lesender flüchtiger Plancache und echte Studiozeit |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| radio/curtain.js | curtainState, changeCurtain; authentifizierte Ausnahmen, Otterchen als tatsächlicher Inhaber, globalen Vorhang über persist ändern |
| wishes/queue.js | Flüchtige Queue, Annahme, Deduplizierung, Empfang, Entfernen und private wishPositions aus authentifiziertem User |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| ui/snapshot.js | Berechtigte Ansichtsmodelle und Wunschdarstellung |
| ui/wish-surface.js | Ausschließlich gepaarte Eingaben und Darstellung weiterreichen; kein Öffnen, Schließen oder Einreihen |
| ui/sessions.js | Aktive Sitzung prüfen; openView / closeView und private prepareView; einziger nativer Lebenszyklus, authentifizierte Header-/Overlayzuordnung und Lebensdauer |
| ui/overlays.js | openOverlay / handleOverlayEvent / expireOverlays; bestätigter Wechsel, flüchtige private Entwürfe, Token und Wiederfreigabe |
| transport/views.js | send, refresh, broadcast und allgemeines result |
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen; Vorhang-Chatbefehl privat beantworten und bestätigten Fachzustand verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Besitzeraktionen, Revisions-/Zeitprüfung und öffentliche Lesepakete |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Protokoll und Änderungsbenachrichtigung |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Ausschließlich Komponenten laden, erzeugen und verdrahten |



## Zustand und Datenfluss

state/persistence besitzt den allgemeinen dauerhaften Zustand und Commit; Sendeplanwochen haben einen eigenen Speicheradapter. radio/moderation besitzt ON AIR und private Sperrmarker, radio/handover die flüchtige bestätigte Übergabe. radio/curtain besitzt den globalen Vorhang; Werbewiedergabe bleibt ausschließlich lokal. wishes/queue besitzt die flüchtige Queue und private aktuelle Positionen, wishes/transport die bestehende Wunschübertragung. ui/sessions besitzt authentifizierte Ansichten; Identität und Rechte kommen immer vom Server.

Backend wishes/transport und Frontend wishes/wishbox bleiben bytegleich. Der Versandcontroller lebt ausschließlich in der Radioleiste; das native Wunschoverlay reicht Eingaben und Darstellung zwischen authentifizierten gepaarten Sitzungen weiter. ui/overlays übernimmt vor einer neuen Öffnung bestätigte Eingaben und ausstehende Aktionen über Token, Frist und Entwurfsrevision. Neue native Sitzungen erhalten ihre eigenen Öffnungskennungen. Ereignisse geschlossener alter Sitzungen sind unwirksam. Rechteverlust löscht private Verwaltungsentwürfe im flüchtigen Radiocache. Fehlgeschlagene neue Öffnungen erhalten das bisherige Overlay und dessen bestätigte Wunsch-Eingabesequenz.

Private Wunschpositionen stammen aus derselben Moderationsqueue, ein eigener Eintrag pro Seite. Generation und Queue-Revision verwerfen alte Antworten. Erledigt/Verwerfen entfernt den ausgewählten Wunsch und lässt Folgeplätze nachrücken; es ist keine automatische Erkennung tatsächlich gespielter Titel. Nur die Moderation sieht fremde Wünsche/Nicks. Ein wirklicher App-Neustart leert die Queue.

## Fenster und Anbieter

ui/layout passt ausschließlich den Inhalt an den tatsächlich vorhandenen Rahmen an. Die Moderation verwendet bei knapper Fläche ihre Arbeitsreiter; Kalender und Historie paginieren weiter innerhalb des vorhandenen Rahmens. Alle übrigen längeren Inhalte bleiben nativ scrollbar. Moderation, Team und Sendeplan fordern nach der Öffnung keine Größenänderung an. Die Wunschbox verwendet weiterhin ihre vorhandene inhaltsgerechte Höhenanpassung über wishes/window und HostFrame.setSize; setMinSize, setMaxSize und setResizable werden nicht verwendet. Die Anfangsmaße stehen im nativen Konstruktor in ui/sessions. radio/viewport besitzt ausschließlich die Radioleistenhöhe.

radio/station validiert ausschließlich explizit konfigurierte öffentliche HTTPS-Adressen und erlaubte Datenhosts. radio/api liest zugeordnete JSON-Felder; keine vom früheren Anbieter abgeleiteten Routen. Seit 0.1.135 liefert die bestätigte SPCast-Statistik Übertragungsstatus für Stream-ID 1 mit Pfad-/Identitätsprüfung; keine feste Arrayposition. Explizite leere Nullantwort bestätigt Stopp, fehlende/fremde/widersprüchliche Daten nicht. Aktive Backupquelle erhalten. Der eigene Player liefert getrennte Titel/Interpret und den ergänzenden Sendemodusdienst; nur autodj/live werden in die interne Boolean-Darstellung umgesetzt. Fehlende Daten bleiben unbekannt. Status- und Titelanfragen behalten eigene Timer und Generationen; parallele Leser derselben URL teilen einen HTTP-Aufruf. LIVE/AutoDJ benötigt bestätigte Übertragung und frischen bekannten Modus; die App-Studioanmeldung bleibt unabhängig. Native Bufferereignisse prüfen den Status zusätzlich sofort, ohne Audioprobe. Stopp sperrt Play und trennt Audio, Wiederanlauf gibt nur Play frei.

[API-Nachweis](../api/API-NACHWEIS.md) · [STREAMPANEL-Einrichtung](../betrieb/INBETRIEBNAHME.md#streampanel-einrichten) · [Prüfbericht](../pruefung/PRUEFBERICHT.md). Öffentlicher Produktanschluss lesend im HTTP-/Edge-Test bestätigt; echte Knuddels-/K3-/STAPP-Abnahme bleibt gesondert offen. Kein Upload oder Neustart ausgeführt.

wishes/queue besitzt manuelle Wunschstufen mit Vorwertvergleich und Queue-Revision. wishes/transport bleibt bytegleich. ui/snapshot ergänzt für berechtigte Moderatoren ausschließlich queueWindow (höchstens drei Datensätze) und queueStart, ohne die bestehende Einzelauswahl queue/page zu ändern. Vorschauauswahl verwendet mw:refresh; die bisherige Sitzungsauswahl bleibt der Empfangsschutz. Planpersistenz wird ausschließlich bei expliziter Planlesung gelesen; keine Assistentenaktualisierung im Wunschbroadcast. Private Übergabenotizen liegen weiterhin flüchtig in radio/handover.

Die fünf Dateinachweise unter deployment/manifests teilen Server, gemeinsamen Browsercode, Studio und Medien fachlich auf. tools/lib/upload-manifests.cjs liefert die gemeinsame Gruppierung; Builder und unabhängiger Uploadprüfer prüfen vollständiges Inventar und jeden Hash. tools/lib/release-identity.cjs prüft seit Build 163 außerdem die gemeinsame Versions-/Buildkennung aus package.json gegen app.config und die Backendkonfiguration. Die Kennung erscheint im erzeugten Einstieg, im internen Startprotokoll und in allen fünf Manifesten; der Build bleibt reproduzierbar.

Verwaltung (technischer Ansichtstyp team) enthält die Mitgliederverwaltung. Statusmodule, Statusstylesheet, Reiternavigation und gemeinsame Gridreserve sind entfernt. radio/api wird ausschließlich im Radio geladen. Ernennungsentwurf, Entzugsbestätigung, Fokus und privater Overlayentwurf bleiben erhalten; alte Statusauswahl wird ignoriert.

Aktualisieren seit 0.1.120: transport/events prüft optionale Anfrage-IDs vor den vorbereitenden Leseoperationen, damit auch Lesefehler zugeordnet werden können. transport/views ergänzt ausschließlich das ausdrücklich angeforderte mw:state um refreshRequestId. Broadcast und automatische Lesung behalten ihre bisherigen Pakete. Die optionale Kennung ändert weder Persistenz noch Fachrevision, Seitenzuordnung oder das separate Wunschprotokoll.

Sendeplan: Jede native Öffnung beginnt mit 820 × 630 px; danach bestimmt der tatsächliche Viewport die Pagination. Datenladen, Wochenwechsel, Editor und Rückmeldungen ändern das Fenstermaß nicht.

Build 172: ui/loading konfiguriert ausschließlich optionale native Ladeeigenschaften, ui/sessions bleibt alleiniger Öffnungs-/Versandort. prepare-upload.createDelivery erzeugt ausschließlich die Auslieferungstransformation aus vollständigen Quellmodulen; app/www, Architekturprüfung und Längenprüfung bleiben die modulare Quelle. check:upload und check:delivery vergleichen bei bundled=true die reproduzierten Bündelbytes. Keine Vorladefunktion im aktuellen lifecycle.

Build 173: sessions übergibt an loading ausdrücklich, ob eine native Abdeckung aktiv sein soll. Nur die vier Overlays aktivieren die leere dunkle Abdeckung; die eigenständige Radioleiste bleibt bei ihrer bisherigen Abschaltung. Der Emulator modelliert den weißen Loader-Unterbau getrennt von den konfigurierten Ladefarben.

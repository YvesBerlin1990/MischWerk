# MischWerk – Architektur 0.1.146

Die Tageshistorie ist ausschließlich ein Reiter in der berechtigten Moderationsoberfläche. Der öffentliche Sendeplan enthält weiterhin nur den Kalender. history/view, history/data und history/controller werden mit der vorhandenen Studiooberfläche geladen. Das Backend gibt die geprüfte historyUrl und historyIgnoredTitles ausschließlich an den Channelinhaber und ernannte Radiomoderatoren weiter; der Browser lädt die Titelmeldungen im sichtbaren Reiter. Kein neuer Backendauftrag, AppContent oder nativer Wechselweg. Kalenderentwurf, privater Radiocache und Audio behalten ihre bisherigen Zuständigkeiten. Details und Grenzen siehe [Frontend](ARCHITEKTUR-FRONTEND.md) und [Schnittstellennachweis](../api/API-NACHWEIS.md).

Alle Zusatzansichten folgen einem Ablauf: transport/commands bindet die vier Einstiegstasten; ui/overlays entscheidet zwischen Erstöffnung, Fokus/Toggle und Bereichswechsel. ui/sessions besitzt die einzige native Konstruktion, sendAppContent und closeView mit AppContentSession.remove. prepareView ist privat und verweigert den Ersatz einer noch vorhandenen Zusatzoberfläche. Ein Bereichswechsel führt ausschließlich über selectOverlay und mw:view/mw:state zur eigenen switchView-Funktion. Die Radioleiste bleibt ein eigener Typ derselben Sitzungsverwaltung; ihre tatsächliche Wiederöffnung per /mischwerk bleibt erhalten.

ui/overlays besitzt zusätzlich den flüchtigen Wiederholungsschutz der letzten 32 erfolgreichen Öffnungsaufträge pro Radio-Sitzung sowie resumeOverlayOpening für die eigene Clientbereitschaft. transport/events ruft diesen Einstieg nur nach mw:ready auf. ui/sessions isoliert Fehler seiner nachgelagerten Öffnungsmitteilung vom bereits erfolgreichen AppContent-Versand. Keine zusätzliche Persistenz oder Plattformbrücke; Fachtransport der Musikwünsche bleibt unverändert.

Seit 0.1.128 startet die eigene mount-Freigabe am Body-Ende nach vollständigem Markup und allen Modulregistrierungen. Anfangslayout und nötige natürliche Hostmaße stehen vor dem früher registrierten SDK-DOMContentLoaded-Listener bereit. Der eigene DOMContentLoaded-Weg bleibt idempotenter Rückfall. Native Ladeübergabe und Appbereitschaft werden im Emulator unabhängig geprüft; kein Eingriff in Plattformlistener oder private APIs.

Seit 0.1.132 ist die native Ladeansicht über LoadConfiguration.setEnabled(false) abgeschaltet; die frühe HTML-Hülle bleibt dunkel. Die Radioleiste lädt weiterhin ausschließlich ihre eigenen Controller. Zugehörige Zusatzbereiche werden einmal in eine gemeinsame Overlayoberfläche geladen. Vorhandenes Browser-prefetch bleibt eine optionale Ergänzung für statische Dateien.


101 Laufzeitdateien: main.js und app.config, 31 Servermodule und 68 Browserdateien einschließlich Original-PNG und eigener Werbe-MP3. ES5/Rhino im Backend, explizite Browserkomponenten, keine Minifizierung oder Sammelbundles. Fachliche Regeln stehen ausschließlich in AGENTS.md.

## Zusammensetzung und Start

main.js lädt server/app.js mit dem dokumentierten KnuddelsServer.execute und übernimmt das globale App. Backendquellen unter src/backend/ werden bytegleich nach app/server/ und beim Paketbau nach UPLOAD/MischWerk/server/ übernommen. Das Kompositionsmodul lädt und verdrahtet Module, verarbeitet aber keine Fachereignisse.

index.html fordert Styles und js/start.js während des HTML-Parsens über Client.includeCSS/includeJS an. Das ist wegen der document.write-Implementierung der Plattform erforderlich. ui/composition.js besitzt die explizite Verdrahtung; start.js besitzt den Ladeplan und die einmalige Startfreigabe. Die Zusammensetzung erfolgt nach vollständigem Markup am Bodyende und registrierten Modulen, DOMContentLoaded dient als idempotenter Rückfall. Keine mehrfachen Initialisierungen. Geladenes CSS und fertiges Anfangslayout geben mw-ready frei; langsame Logoantworten blockieren die Radioleiste nicht. Nach 15 Sekunden ohne vollständige Initialisierung erscheint der verständliche Starthinweis. 44 Komponenten und 18 Stylesheets; Pläne siehe [Frontend](ARCHITEKTUR-FRONTEND.md).

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
| ui/navigation.js | selectOverlay; Zielbereich, Bereichsrevision, eigener Cursor und Datenereignisse in derselben Sitzung |
| ui/overlays.js | openOverlay / handleOverlayEvent / expireOverlays; bestätigter Wechsel, flüchtige private Entwürfe, Token und Wiederfreigabe |
| transport/views.js | send, refresh, broadcast und allgemeines result |
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Besitzeraktionen, Revisions-/Zeitprüfung und öffentliche Lesepakete |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Protokoll und Änderungsbenachrichtigung |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Ausschließlich Komponenten laden, erzeugen und verdrahten |



## Zustand und Datenfluss

state/persistence besitzt den allgemeinen dauerhaften Zustand und Commit; Sendeplanwochen haben einen eigenen Speicheradapter. radio/moderation besitzt ON AIR und private Sperrmarker, radio/handover die flüchtige bestätigte Übergabe. radio/curtain besitzt den globalen Vorhang; Werbewiedergabe bleibt ausschließlich lokal. wishes/queue besitzt die flüchtige Queue und private aktuelle Positionen, wishes/transport die bestehende Wunschübertragung. ui/sessions besitzt authentifizierte Ansichten; Identität und Rechte kommen immer vom Server.

Backend wishes/transport bleibt bytegleich. Im Frontend wishes/wishbox entfällt seit 0.1.130 ausschließlich die wirkungslose green-pill-Klassenzeile; alle übrigen Bytes und die gesamte Versandlogik bleiben erhalten. submissionId, direkte mw:wish.receipt-Quittung, Wiederholungsschutz und Entwurfserhalt sind unverändert. Die Wunschoberfläche verwendet ein natives Channel-Overlay. UI-Eingaben werden nach serverseitiger Paarprüfung an das bestehende Radioformular gegeben; dessen unveränderter Controller sendet weiterhin mw:wish.submit und empfängt mw:wish.receipt. Entwurf und ausstehende Quittung bleiben beim Overlay-Schließen im Radio. Studio, Radio-Team und Sendeplan nutzen denselben nativen Overlaymodus. Ein Radio hält pro Nutzer höchstens eine aktive Overlayansicht. Der frühere separate Wunschboxöffner und allgemeine Overlayersatz sind entfernt. Wunschdarstellungsereignisse steuern lediglich den vorhandenen Relayzustand. ui/overlays bestätigt vor dem Wechsel deren letzte Eingaben und ausstehende Aktionen; Sitzung, Token, Frist, Revision und Rollen werden geprüft. Bis zum bestätigten Bereichswechsel oder Abbruch bleibt die Eingabe kurz inert. Das Overlay behält AppContent, Sitzung, Dokument und alle einmalig registrierten Komponenten. ui/navigation sendet mw:view und einen frischen mw:state; die eigene Clientfunktion switchView schaltet die vorhandenen Vorlagen. Bereichsrevisionen verhindern die Übernahme veralteter Pakete. Clientfelder bleiben beim Zurückwechseln im DOM; der Radiocache erhält Entwürfe für echtes Schließen und Wiederöffnen. Versteckte Verwaltungsentwürfe werden bei Rechteverlust verworfen. Bei Fehlern oder abgelaufener Transaktion wird die alte Ansicht wieder freigegeben. Eigene Verwaltungsentwürfe und Cursor liegen ausschließlich im zugehörigen flüchtigen Radioobjekt; geschützter Wunschtransport und private Zustandsantworten bleiben getrennt. Wiederholter Aufruf derselben Verwaltungsansicht lädt sie nicht neu. Radioende schließt seine Channelansicht und verwirft den Entwurfscache.

Private Wunschpositionen stammen aus derselben Moderationsqueue, ein eigener Eintrag pro Seite. Generation und Queue-Revision verwerfen alte Antworten. Erledigt/Verwerfen entfernt den ausgewählten Wunsch und lässt Folgeplätze nachrücken; es ist keine automatische Erkennung tatsächlich gespielter Titel. Nur die Moderation sieht fremde Wünsche/Nicks. Ein wirklicher App-Neustart leert die Queue.

## Fenster und Anbieter

ui/layout passt Moderation und Radio-Team vor Sichtbarkeit an natürliche Inhaltshöhe und Bildschirm-/1000-px-Grenze an. lifecycle gibt das Anfangslayout nach geladenem CSS/Markup frei; ein späteres Logo hält es nicht auf. ui/layout hält seine Höhengrenze vor dem ersten Hostaufruf fest, damit eine als Bildschirmhöhe gemeldete Framehöhe keine Schrumpfschleife auslöst. Nur geänderte Ziele erzeugen Hostaufrufe; unveränderte Verbindungskontrollen erzeugen keine erneute Dialogmessung. Drei Mitglieder pro Seite und einzeln durchblätterbare Statusdetails vermeiden lange Scrollstapel. Reiter, Bestätigung, Inhalte und Breitenwechsel werden weiter berücksichtigt. Moderation startet mit 780 × 600 und erhält vor Sichtbarkeit die gemessene Inhaltshöhe. Die Messung berücksichtigt die vollständige Konsole; ein kleiner oder ignorierter Hostrahmen darf über seine Fallbackansicht keine neue Schrumpfschleife auslösen. Reiter, Fokus und Entwürfe bleiben erhalten. radio/viewport misst ausschließlich die Radioleiste; Öffnen und Schließen der Wunschbox verändern deren Höhe nicht. Die Wunschoberfläche startet mit 560 × 600 und ui/layout misst ihre natürliche Höhe am wishes-panel. Die eigene Wunschkarte steht vor dem Formular, jeweils ein Wunsch pro Seite. Das leere Formular wird nach Erfolg durch eine neue Eingabeaktion ersetzt. Keine innere Scrollfläche; nur echte Hostgrenzen behalten native Erreichbarkeit. Bei ignorierten Hostgrößen bleiben die übrigen Dialoginhalte scrollbar erreichbar.

radio/station validiert ausschließlich explizit konfigurierte öffentliche HTTPS-Adressen und erlaubte Datenhosts. radio/api liest zugeordnete JSON-Felder; keine vom früheren Anbieter abgeleiteten Routen. Seit 0.1.135 liefert die bestätigte SPCast-Statistik Übertragungsstatus für Stream-ID 1 mit Pfad-/Identitätsprüfung; keine feste Arrayposition. Explizite leere Nullantwort bestätigt Stopp, fehlende/fremde/widersprüchliche Daten nicht. Aktive Backupquelle erhalten. Der eigene Player liefert getrennte Titel/Interpret und den ergänzenden Sendemodusdienst; nur autodj/live werden in die interne Boolean-Darstellung umgesetzt. Fehlende Daten bleiben unbekannt. Status- und Titelanfragen behalten eigene Timer und Generationen; parallele Leser derselben URL teilen einen HTTP-Aufruf. LIVE/AutoDJ benötigt bestätigte Übertragung und frischen bekannten Modus; die App-Studioanmeldung bleibt unabhängig. Native Bufferereignisse prüfen den Status zusätzlich sofort, ohne Audioprobe. Stopp sperrt Play und trennt Audio, Wiederanlauf gibt nur Play frei.

[API-Nachweis](../api/API-NACHWEIS.md) · [STREAMPANEL-Einrichtung](../betrieb/INBETRIEBNAHME.md#streampanel-einrichten) · [Prüfbericht](../pruefung/PRUEFBERICHT.md). Öffentlicher Produktanschluss lesend im HTTP-/Edge-Test bestätigt; echte Knuddels-/K3-/STAPP-Abnahme bleibt gesondert offen. Kein Upload oder Neustart ausgeführt.

Seit 0.1.118 besitzt wishes/queue zusätzlich manuelle Wunschstufen mit Vorwertvergleich und Queue-Revision. wishes/transport bleibt bytegleich. Eigene Positionspakete enthalten stage; fremde Texte und interne IDs bleiben verborgen. ui/snapshot liest nur den flüchtigen Assistentencache. Planpersistenz wird nur bei moderationsberechtigtem ready/refresh oder Studioöffnung gelesen, niemals bei Wunschbroadcast. Planänderungen melden mw:schedule.changed auch ans Studio. Der Cache verfällt nach 65 Sekunden und wird bei Nutzerlöschung bereinigt. radio/handover besitzt Anfragehinweise und empfängergebundene übernommene Notizen in seiner Closure; kein neuer Persistenzschlüssel. Die ursprüngliche Anmeldezeit bleibt beim Verlängern erhalten.

Die fünf Dateinachweise unter deployment/manifests teilen Server, gemeinsamen Browsercode, Studio und Medien fachlich auf. tools/lib/upload-manifests.cjs liefert die gemeinsame Gruppierung; Builder und unabhängiger Uploadprüfer prüfen vollständiges Inventar und jeden Hash.

Radio-Team seit 0.1.119: team-workspace legt beide Reiter in dieselbe Gridzelle. Die größere natürliche Ansicht bestimmt die gemeinsame Höhe; der inaktive Inhalt bleibt unsichtbar und nicht bedienbar. ui/layout verwendet unverändert die bestehende Hüllenmessung. Statusdetails behalten ihren Layoutzustand unabhängig von der Reiterauswahl. Statusabfragen bleiben an selected, Sichtbarkeit und serverbestätigte Berechtigung gebunden.

Aktualisieren seit 0.1.120: transport/events prüft optionale Anfrage-IDs vor den vorbereitenden Leseoperationen, damit auch Lesefehler zugeordnet werden können. transport/views ergänzt ausschließlich das ausdrücklich angeforderte mw:state um refreshRequestId. Broadcast und automatische Lesung behalten ihre bisherigen Pakete. Die optionale Kennung ändert weder Persistenz noch Fachrevision, Seitenzuordnung oder das separate Wunschprotokoll.

Sendeplan: ui/sessions setzt bei erster Öffnung 820 × 660 in AppContent.overlayContent. Bei Bereichswechsel in der bestehenden Sitzung fordert ui/layout dieses Zielmaß einmal an. schedule/window wird ohne Bridge zusammengesetzt und paginiert ausschließlich innerhalb des vorhandenen Viewports. Nach Bereichseintritt keine Größenkorrektur beim Laden oder bei Daten-/Editoränderungen. Die 100-vh-Mindesthöhe betrifft nur den Seitenhintergrund, nicht die gemessene Inhaltshülle.
